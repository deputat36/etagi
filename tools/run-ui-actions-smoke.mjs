import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const failureLogPath = path.join(rootDir, 'browser-smoke-failure.log');
const chrome = findChrome();
if(!chrome) failImmediately('UI actions smoke: Chrome/Chromium не найден. Укажите CHROME_BIN или установите системный браузер.');

const failureFixtureMode = process.argv.includes('--failure-fixture');
const smokePages = failureFixtureMode ? [
  {
    label:'UI actions failure fixture',
    path:'tools/ui-actions-failure-fixture.html',
    virtualTimeBudget:1500,
    timeoutMs:12000
  }
] : [
  {
    label:'UI actions smoke',
    path:'tools/ui-actions-smoke.html',
    virtualTimeBudget:40000,
    timeoutMs:55000
  },
  {
    label:'QR inline error smoke',
    path:'tools/qr-inline-error-smoke.html',
    virtualTimeBudget:18000,
    timeoutMs:30000
  },
  {
    label:'Inline tab order smoke',
    path:'tools/inline-tab-order-smoke.html',
    virtualTimeBudget:18000,
    timeoutMs:30000
  },
  {
    label:'Template keyboard smoke',
    path:'tools/template-keyboard-smoke.html',
    virtualTimeBudget:22000,
    timeoutMs:34000
  },
  {
    label:'Form input render smoke',
    path:'tools/form-input-render-smoke.html',
    virtualTimeBudget:18000,
    timeoutMs:30000
  },
  {
    label:'Quality scheduler smoke',
    path:'tools/quality-scheduler-smoke.html',
    virtualTimeBudget:16000,
    timeoutMs:28000
  },
  {
    label:'Ink efficiency observer smoke',
    path:'tools/ink-efficiency-observer-smoke.html',
    virtualTimeBudget:18000,
    timeoutMs:30000
  },
  {
    label:'Quality extra actions observer smoke',
    path:'tools/quality-extra-actions-observer-smoke.html',
    virtualTimeBudget:18000,
    timeoutMs:30000
  },
  {
    label:'Fit preview smoke',
    path:'tools/fit-preview-smoke.html',
    virtualTimeBudget:22000,
    timeoutMs:36000
  },
  {
    label:'Print format policy smoke',
    path:'tools/print-format-policy-smoke.html',
    virtualTimeBudget:26000,
    timeoutMs:38000
  },
  {
    label:'Destructive snapshot smoke',
    path:'tools/destructive-snapshot-smoke.html',
    virtualTimeBudget:38000,
    timeoutMs:50000
  },
  {
    label:'Destructive undo smoke',
    path:'tools/destructive-undo-smoke.html',
    virtualTimeBudget:45000,
    timeoutMs:58000
  },
  {
    label:'Named layout delete confirmation smoke',
    path:'tools/named-layout-delete-confirm-smoke.html',
    virtualTimeBudget:30000,
    timeoutMs:42000
  },
  {
    label:'Print dialog smoke',
    path:'tools/print-dialog-smoke.html',
    virtualTimeBudget:20000,
    timeoutMs:32000
  }
];

const server = createStaticServer(rootDir);
server.keepAliveTimeout = 1;
server.headersTimeout = 5000;
const port = await listen(server);
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'etagi-ui-actions-smoke-'));
let failure = '';

try{
  for(const page of smokePages){
    const smoke = await runSmokePage(page);
    console.log(`${page.label}:`);
    console.log(smoke.text || `${page.label} passed.`);
  }
} catch(error){
  failure = String(error?.message || error || 'UI actions smoke failed.').trim();
  writeFailureLog(failure);
} finally {
  fs.rmSync(profileDir, {recursive:true, force:true});
  await closeServer(server);
}

if(failure){
  console.error(failure);
  process.exit(1);
}

async function runSmokePage(page){
  const url = `http://127.0.0.1:${port}/${page.path}`;
  const result = await runChrome(chrome, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--run-all-compositor-stages-before-draw',
    '--force-device-scale-factor=1',
    '--window-size=1440,1200',
    `--user-data-dir=${profileDir}`,
    `--virtual-time-budget=${page.virtualTimeBudget}`,
    '--dump-dom',
    url
  ], page.timeoutMs);

  const dom = String(result.stdout || '');
  const stderr = String(result.stderr || '').trim();
  const smoke = parseSmokeResult(dom);

  if(result.code !== 0 && smoke.status !== 'passed'){
    throw new Error([`${page.label}: Chrome завершился с кодом ${result.code}.`, smoke.text, stderr].filter(Boolean).join('\n'));
  }
  if(smoke.status !== 'passed'){
    throw new Error([`${page.label}: статус ${smoke.status}.`, smoke.text, stderr].filter(Boolean).join('\n'));
  }

  return smoke;
}

function runChrome(command, args, timeoutMs){
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd:rootDir,
      stdio:['ignore', 'pipe', 'pipe']
    });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const maxBuffer = 8 * 1024 * 1024;
    const timer = setTimeout(() => {
      if(settled) return;
      settled = true;
      terminateProcess(child);
      reject(new Error(`UI actions smoke: Chrome не завершился за ${timeoutMs} мс.`));
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdout += chunk;
      if(stdout.length > maxBuffer && !settled){
        settled = true;
        clearTimeout(timer);
        terminateProcess(child);
        reject(new Error('UI actions smoke: stdout Chrome превысил 8 МБ.'));
      }
    });
    child.stderr.on('data', chunk => {
      stderr += chunk;
      if(stderr.length > maxBuffer && !settled){
        settled = true;
        clearTimeout(timer);
        terminateProcess(child);
        reject(new Error('UI actions smoke: stderr Chrome превысил 8 МБ.'));
      }
    });
    child.once('error', error => {
      if(settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    });
    child.once('close', code => {
      if(settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({code:Number.isInteger(code) ? code : 1, stdout, stderr});
    });
  });
}

function terminateProcess(child){
  if(!child || child.killed) return;
  try{ child.kill('SIGTERM'); } catch(error){}
  const timer = setTimeout(() => {
    try{ child.kill('SIGKILL'); } catch(error){}
  }, 1000);
  timer.unref?.();
}

function parseSmokeResult(dom){
  const tag = dom.match(/<pre\b[^>]*\bid=["']uiActionsSmokeResult["'][^>]*>/i)?.[0] || '';
  const status = tag.match(/\bdata-status=["']([^"']+)["']/i)?.[1] || 'missing';
  const text = dom.match(/<pre\b[^>]*\bid=["']uiActionsSmokeResult["'][^>]*>([\s\S]*?)<\/pre>/i)?.[1] || 'uiActionsSmokeResult не найден';
  return {status, text:decodeHtml(text).trim()};
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

      response.shouldKeepAlive = false;
      response.writeHead(200, {
        'Content-Type':contentType(filePath),
        'Cache-Control':'no-store',
        'Connection':'close'
      });
      fs.createReadStream(filePath).pipe(response);
    } catch(error){
      response.writeHead(500, {'Connection':'close'}).end(error.message || 'Server error');
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

function decodeHtml(value){
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function writeFailureLog(message){
  try{ fs.writeFileSync(failureLogPath, `${String(message || '').trim()}\n`, 'utf8'); } catch(error){}
}

function failImmediately(message){
  const text = String(message || 'UI actions smoke failed.').trim();
  writeFailureLog(text);
  console.error(text);
  process.exit(1);
}
