import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const failureLogPath = path.join(rootDir, 'browser-smoke-failure.log');
try { fs.rmSync(failureLogPath, {force:true}); } catch(error){}

const chrome = findChrome();
if (!chrome) {
  const message = 'Browser smoke: Chrome/Chromium не найден. Укажите CHROME_BIN или установите системный браузер.';
  writeFailureLog(message);
  console.error(message);
  process.exit(1);
}

const server = createStaticServer(rootDir);
const port = await listen(server);
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'etagi-browser-smoke-'));
const url = `http://127.0.0.1:${port}/tools/browser-smoke.html`;

try {
  const result = await runChrome(chrome, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--hide-scrollbars',
    '--window-size=1440,1200',
    `--user-data-dir=${profileDir}`,
    '--virtual-time-budget=22000',
    '--dump-dom',
    url
  ], {
    cwd: rootDir,
    encoding: 'utf8',
    timeout: 35000,
    maxBuffer: 12 * 1024 * 1024
  });

  if (result.timedOut) fail('Browser smoke: Chrome не завершил smoke-сценарий за 35 секунд.', result.stderr);
  if (result.overflow) fail('Browser smoke: вывод Chrome превысил безопасный лимит 12 МБ.', result.stderr);
  if (result.error) fail(`Browser smoke: не удалось запустить браузер — ${result.error.message}`);

  if (result.status !== 0) {
    fail(`Browser smoke: Chrome завершился с кодом ${result.status}.`, result.stderr);
  }

  const dom = String(result.stdout || '');
  const summary = extractResult(dom);
  if (!dom.includes('id="browserSmokeResult"') || !dom.includes('data-status="passed"')) {
    fail('Browser smoke failed.', summary || result.stderr || 'Результат smoke-сценария не найден в DOM.');
  }

  console.log(summary || 'Browser smoke passed.');
}
catch(error) {
  const message = String(error?.message || error || 'Browser smoke failed.').trim();
  writeFailureLog(message);
  console.error(message);
  process.exitCode = 1;
}
finally {
  await closeServer(server);
  fs.rmSync(profileDir, {recursive:true, force:true});
}

function runChrome(command, args, options){
  return new Promise(resolve => {
    let stdout = '';
    let stderr = '';
    let settled = false;
    let timedOut = false;
    let overflow = false;
    let timer;

    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe']
    });

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

function fail(message, details = ''){
  const suffix = String(details || '').trim().slice(-8000);
  throw new Error(suffix ? `${message}\n${suffix}` : message);
}

function writeFailureLog(message){
  try { fs.writeFileSync(failureLogPath, `${String(message || '').trim()}\n`, 'utf8'); } catch(error){}
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

  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && !fs.existsSync(candidate)) continue;
    const probe = spawnSync(candidate, ['--version'], {encoding:'utf8', timeout:5000});
    if (!probe.error && probe.status === 0) return candidate;
  }
  return '';
}

function createStaticServer(root){
  return http.createServer((request, response) => {
    try {
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      let relativePath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
      if (!relativePath) relativePath = 'index.html';

      let filePath = path.resolve(root, relativePath);
      if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end('Forbidden');
        return;
      }

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        response.writeHead(404).end('Not found');
        return;
      }

      response.writeHead(200, {
        'Content-Type': contentType(filePath),
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(filePath).pipe(response);
    }
    catch(error) {
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
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
  })[ext] || 'application/octet-stream';
}

function extractResult(dom){
  const match = dom.match(/<pre\b[^>]*id="browserSmokeResult"[^>]*>([\s\S]*?)<\/pre>/i);
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
