import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'artifacts', 'print-screenshots');
const failureLogPath = path.join(rootDir, 'print-screenshots-failure.log');
const scenarios = [
  {id:'one-no-photo', title:'1 на А4 без фото'},
  {id:'two-big-phone', title:'2 на А4 с крупным телефоном'},
  {id:'one-showcase', title:'1 на А4 — Витрина'},
  {id:'two-photo', title:'2 на А4 — С фото'},
  {id:'four-contacts', title:'4 на А4 без наложения контактов'}
];
const virtualBudgets = [30000, 45000];

fs.rmSync(failureLogPath, {force:true});
fs.rmSync(outputDir, {recursive:true, force:true});
fs.mkdirSync(outputDir, {recursive:true});

const chrome = findChrome();
if(!chrome) failImmediately('Print screenshots: Chrome/Chromium не найден. Укажите CHROME_BIN или установите системный браузер.');

const server = createStaticServer(rootDir);
const port = await listen(server);
const manifest = [];

try{
  for(const scenario of scenarios){
    const screenshotPath = path.join(outputDir, `${scenario.id}.png`);
    const result = await captureScenario(chrome, port, scenario, screenshotPath);
    const sizeBytes = fs.statSync(screenshotPath).size;
    if(sizeBytes < 10000) throw new Error(`${scenario.title}: PNG подозрительно мал — ${sizeBytes} байт.`);

    manifest.push({
      id: scenario.id,
      title: scenario.title,
      file: path.relative(rootDir, screenshotPath).replaceAll('\\', '/'),
      sizeBytes,
      attempt: result.attempt,
      virtualTimeBudget: result.virtualTimeBudget
    });
    console.log(`✓ ${scenario.title}: ${Math.round(sizeBytes / 1024)} КБ, попытка ${result.attempt}`);
  }

  fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    viewport: {width:794, height:1123, deviceScaleFactor:1},
    scenarios: manifest
  }, null, 2), 'utf8');
  console.log(`Print screenshots passed: ${manifest.length} PNG.`);
} catch(error){
  const details = String(error?.message || error);
  fs.writeFileSync(failureLogPath, `${details}\n`, 'utf8');
  console.error(details);
  process.exitCode = 1;
} finally {
  await closeServer(server);
}

async function captureScenario(command, port, scenario, screenshotPath){
  let lastFailure = '';

  for(let index = 0; index < virtualBudgets.length; index += 1){
    const attempt = index + 1;
    const virtualTimeBudget = virtualBudgets[index];
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), `etagi-print-${scenario.id}-${attempt}-`));
    const url = `http://127.0.0.1:${port}/tools/print-screenshot.html?scenario=${encodeURIComponent(scenario.id)}`;

    fs.rmSync(screenshotPath, {force:true});

    try{
      const result = await runChrome(command, [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--hide-scrollbars',
        '--run-all-compositor-stages-before-draw',
        '--force-device-scale-factor=1',
        '--window-size=794,1123',
        `--user-data-dir=${profileDir}`,
        `--virtual-time-budget=${virtualTimeBudget}`,
        '--dump-dom',
        `--screenshot=${screenshotPath}`,
        url
      ], {
        cwd: rootDir,
        timeout: virtualTimeBudget + 20000,
        maxBuffer: 12 * 1024 * 1024
      });

      if(result.timedOut) lastFailure = `${scenario.title}: Chrome не завершил попытку ${attempt} за ${virtualTimeBudget + 20000} мс.`;
      else if(result.overflow) lastFailure = `${scenario.title}: вывод Chrome превысил 12 МБ.`;
      else if(result.error) lastFailure = `${scenario.title}: браузер не запущен — ${result.error.message}`;
      else if(result.status !== 0) lastFailure = `${scenario.title}: Chrome завершился с кодом ${result.status}.\n${tail(result.stderr)}`;
      else {
        const dom = String(result.stdout || '');
        const summary = extractStatus(dom);
        if(dom.includes('id="captureStatus"') && dom.includes('data-status="passed"') && fs.existsSync(screenshotPath)){
          return {attempt, virtualTimeBudget};
        }
        lastFailure = `${scenario.title}: harness не подтвердил готовность на попытке ${attempt}.\n${summary || tail(result.stderr) || 'Статус не найден.'}`;
      }
    } finally {
      fs.rmSync(profileDir, {recursive:true, force:true});
    }
  }

  throw new Error(lastFailure || `${scenario.title}: сценарий не завершён.`);
}

function runChrome(command, args, options){
  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;
    let overflow = false;
    let timer;

    const child = spawn(command, args, {cwd:options.cwd, stdio:['ignore','pipe','pipe']});
    const finish = result => {
      if(settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({stdout, stderr, timedOut, overflow, ...result});
    };
    const append = (current, chunk) => {
      const next = current + chunk;
      if(Buffer.byteLength(next, 'utf8') <= options.maxBuffer) return next;
      overflow = true;
      child.kill('SIGKILL');
      return current;
    };

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => { stdout = append(stdout, chunk); });
    child.stderr.on('data', chunk => { stderr = append(stderr, chunk); });
    child.once('error', error => finish({error, status:null, signal:null}));
    child.once('close', (status, signal) => finish({error:null, status, signal}));
    timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, options.timeout);
  });
}

function findChrome(){
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser'
  ].filter(Boolean);
  for(const candidate of candidates){
    if(path.isAbsolute(candidate) && !fs.existsSync(candidate)) continue;
    const probe = spawnSync(candidate, ['--version'], {encoding:'utf8', timeout:5000});
    if(!probe.error && probe.status === 0) return candidate;
  }
  return '';
}

function createStaticServer(root){
  return http.createServer((request, response) => {
    try{
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      let relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
      if(!relativePath) relativePath = 'index.html';
      let filePath = path.resolve(root, relativePath);
      if(filePath !== root && !filePath.startsWith(`${root}${path.sep}`)){
        response.writeHead(403).end('Forbidden');
        return;
      }
      if(fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
      if(!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()){
        response.writeHead(404).end('Not found');
        return;
      }
      response.writeHead(200, {'Content-Type':contentType(filePath), 'Cache-Control':'no-store'});
      fs.createReadStream(filePath).pipe(response);
    } catch(error){
      response.writeHead(500).end(error.message || 'Server error');
    }
  });
}

function listen(server){
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function closeServer(server){
  return new Promise(resolve => server.close(() => resolve()));
}

function contentType(filePath){
  const ext = path.extname(filePath).toLowerCase();
  return ({
    '.html':'text/html; charset=utf-8',
    '.js':'text/javascript; charset=utf-8',
    '.mjs':'text/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8',
    '.json':'application/json; charset=utf-8',
    '.svg':'image/svg+xml',
    '.png':'image/png',
    '.jpg':'image/jpeg',
    '.jpeg':'image/jpeg',
    '.webp':'image/webp'
  })[ext] || 'application/octet-stream';
}

function extractStatus(dom){
  const match = dom.match(/<pre\b[^>]*id="captureStatus"[^>]*>([\s\S]*?)<\/pre>/i);
  return decodeHtml(match?.[1] || '').trim();
}

function decodeHtml(value){
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'");
}

function tail(value){
  return String(value || '').trim().slice(-4000);
}

function failImmediately(message){
  fs.writeFileSync(failureLogPath, `${message}\n`, 'utf8');
  console.error(message);
  process.exit(1);
}
