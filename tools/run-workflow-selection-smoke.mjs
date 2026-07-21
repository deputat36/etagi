import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';

const rootDir = process.cwd();
const failureLogPath = path.join(rootDir, 'workflow-selection-failure.log');
const chrome = findChrome();

fs.rmSync(failureLogPath, {force:true});
if(!chrome) failImmediately('Workflow selection audit: Chrome/Chromium не найден.');

const server = createStaticServer(rootDir);
server.keepAliveTimeout = 1;
server.headersTimeout = 5000;
const port = await listen(server);
let passed = false;
let lastFailure = '';

try{
  for(let attempt = 1; attempt <= 2; attempt += 1){
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), `etagi-workflow-selection-${attempt}-`));
    try{
      const result = await runChrome(chrome, profileDir, port, 55000);
      const parsed = parseResult(String(result.stdout || ''));
      if(result.code === 0 && parsed.status === 'passed'){
        console.log(parsed.text || `Workflow selection audit passed on attempt ${attempt}.`);
        passed = true;
        break;
      }
      lastFailure = [
        `Workflow selection audit: попытка ${attempt}, Chrome code=${result.code}, status=${parsed.status}.`,
        parsed.text,
        tail(result.stderr)
      ].filter(Boolean).join('\n');
    } catch(error){
      lastFailure = `Workflow selection audit: попытка ${attempt} — ${error.message || error}`;
    } finally {
      fs.rmSync(profileDir, {recursive:true, force:true});
    }
  }
} finally {
  await closeServer(server);
}

if(!passed){
  fs.writeFileSync(failureLogPath, `${lastFailure || 'Workflow selection audit failed.'}\n`, 'utf8');
  console.error(lastFailure || 'Workflow selection audit failed.');
  process.exit(1);
}

async function runChrome(command, profileDir, port, timeoutMs){
  const url = `http://127.0.0.1:${port}/tools/workflow-selection-smoke.html`;
  return new Promise((resolve, reject) => {
    const child = spawn(command, [
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
      '--virtual-time-budget=42000',
      '--dump-dom',
      url
    ], {cwd:rootDir, stdio:['ignore','pipe','pipe']});

    let stdout = '';
    let stderr = '';
    let settled = false;
    const maxBuffer = 8 * 1024 * 1024;
    const timer = setTimeout(() => {
      if(settled) return;
      settled = true;
      terminateProcess(child);
      reject(new Error(`Chrome не завершился за ${timeoutMs} мс.`));
    }, timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', chunk => {
      stdout += chunk;
      if(stdout.length > maxBuffer && !settled){
        settled = true;
        clearTimeout(timer);
        terminateProcess(child);
        reject(new Error('stdout Chrome превысил 8 МБ.'));
      }
    });
    child.stderr.on('data', chunk => {
      stderr += chunk;
      if(stderr.length > maxBuffer && !settled){
        settled = true;
        clearTimeout(timer);
        terminateProcess(child);
        reject(new Error('stderr Chrome превысил 8 МБ.'));
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

function parseResult(dom){
  const tag = dom.match(/<pre\b[^>]*\bid=["']workflowSelectionSmokeResult["'][^>]*>/i)?.[0] || '';
  const status = tag.match(/\bdata-status=["']([^"']+)["']/i)?.[1] || 'missing';
  const text = dom.match(/<pre\b[^>]*\bid=["']workflowSelectionSmokeResult["'][^>]*>([\s\S]*?)<\/pre>/i)?.[1] || 'workflowSelectionSmokeResult не найден';
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
function closeServer(server){ return new Promise(resolve => server.close(() => resolve())); }
function terminateProcess(child){
  if(!child || child.killed) return;
  try{ child.kill('SIGTERM'); } catch(error){}
  const timer = setTimeout(() => { try{ child.kill('SIGKILL'); } catch(error){} }, 1000);
  timer.unref?.();
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
    '.png':'image/png'
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
function tail(value){ return String(value || '').trim().slice(-4000); }
function failImmediately(message){
  fs.writeFileSync(failureLogPath, `${message}\n`, 'utf8');
  console.error(message);
  process.exit(1);
}
