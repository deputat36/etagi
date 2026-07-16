import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const failureLogPath = path.join(rootDir, 'browser-smoke-failure.log');
const chrome = findChrome();
if(!chrome) fail('UI actions smoke: Chrome/Chromium не найден. Укажите CHROME_BIN или установите системный браузер.');

const server = createStaticServer(rootDir);
server.keepAliveTimeout = 1;
server.headersTimeout = 5000;
const port = await listen(server);
const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'etagi-ui-actions-smoke-'));

try{
  const url = `http://127.0.0.1:${port}/tools/ui-actions-smoke.html`;
  const result = spawnSync(chrome, [
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
    '--virtual-time-budget=30000',
    '--dump-dom',
    url
  ], {
    cwd:rootDir,
    encoding:'utf8',
    timeout:45000,
    maxBuffer:8 * 1024 * 1024
  });

  if(result.error) fail(`UI actions smoke: ${result.error.message}`);
  const dom = String(result.stdout || '');
  const stderr = String(result.stderr || '').trim();
  const smoke = parseSmokeResult(dom);

  if(result.status !== 0 && smoke.status !== 'passed'){
    fail([`UI actions smoke: Chrome завершился с кодом ${result.status}.`, smoke.text, stderr].filter(Boolean).join('\n'));
  }
  if(smoke.status !== 'passed'){
    fail([`UI actions smoke: статус ${smoke.status}.`, smoke.text, stderr].filter(Boolean).join('\n'));
  }

  console.log(smoke.text || 'UI actions smoke passed.');
} finally {
  fs.rmSync(profileDir, {recursive:true, force:true});
  await closeServer(server);
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

function fail(message){
  const text = String(message || 'UI actions smoke failed.').trim();
  try{ fs.writeFileSync(failureLogPath, `${text}\n`, 'utf8'); } catch(error){}
  console.error(text);
  process.exit(1);
}
