import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { attachCdpPipeErrorHandlers } from './cdp-pipe-error-guard.mjs';

const rootDir = process.cwd();
const outputDir = path.join(rootDir, 'artifacts', 'eight-print-screenshot');
const screenshotPath = path.join(outputDir, 'eight-economy.png');
const metadataPath = path.join(outputDir, 'eight-economy.json');
const failureLogPath = path.join(rootDir, 'eight-print-screenshot-failure.log');
const chrome = findChrome();

fs.rmSync(outputDir, {recursive:true, force:true});
fs.rmSync(failureLogPath, {force:true});
fs.mkdirSync(outputDir, {recursive:true});

if(!chrome) failImmediately('8 на А4: Chrome/Chromium не найден. Укажите CHROME_BIN или установите системный браузер.');

const server = createStaticServer(rootDir);
server.keepAliveTimeout = 1;
server.headersTimeout = 5000;
const port = await listen(server);
let finalError = '';

try{
  const result = await captureWithRetry(chrome, port);
  const sizeBytes = fs.statSync(screenshotPath).size;
  if(sizeBytes < 10000) throw new Error(`8 на А4: PNG подозрительно мал — ${sizeBytes} байт.`);

  const metadata = {
    id:'eight-economy',
    title:'8 на А4 — сверхкомпактный контактный макет',
    file:'artifacts/eight-print-screenshot/eight-economy.png',
    sizeBytes,
    attempt:result.attempt,
    captureMethod:'cdp-pipe',
    waitMs:result.waitMs,
    viewport:{width:794, height:1123, deviceScaleFactor:1}
  };
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`✓ 8 на А4: ${Math.round(sizeBytes / 1024)} КБ, ожидание ${result.waitMs} мс`);
} catch(error){
  finalError = String(error?.message || error || '8 на А4: неизвестная ошибка').trim();
  fs.writeFileSync(failureLogPath, `${finalError}\n`, 'utf8');
  console.error(finalError);
  process.exitCode = 1;
} finally {
  await closeServer(server);
}

async function captureWithRetry(command, port){
  let lastFailure = '';
  for(let attempt = 1; attempt <= 2; attempt += 1){
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), `etagi-eight-print-${attempt}-`));
    fs.rmSync(screenshotPath, {force:true});
    try{
      const result = await captureWithCdpPipe(command, profileDir, port);
      return {attempt, waitMs:result.waitMs};
    } catch(error){
      lastFailure = `8 на А4: попытка ${attempt} — ${error.message || error}`;
    } finally {
      fs.rmSync(profileDir, {recursive:true, force:true});
    }
  }
  throw new Error(lastFailure || '8 на А4: обе попытки завершились ошибкой.');
}

async function captureWithCdpPipe(command, profileDir, port){
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
    '--window-size=794,1123',
    `--user-data-dir=${profileDir}`,
    '--remote-debugging-pipe',
    'about:blank'
  ], {
    cwd:rootDir,
    stdio:['ignore','ignore','pipe','pipe','pipe']
  });

  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { stderr = tail(stderr + chunk); });
  const cdp = createCdpPipeClient(child);
  const startedAt = Date.now();

  try{
    const {targetId} = await cdp.send('Target.createTarget', {url:'about:blank'}, '', 12000);
    const {sessionId} = await cdp.send('Target.attachToTarget', {targetId, flatten:true}, '', 12000);
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width:794,
      height:1123,
      deviceScaleFactor:1,
      mobile:false,
      screenWidth:794,
      screenHeight:1123
    }, sessionId);
    await cdp.send('Page.navigate', {
      url:`http://127.0.0.1:${port}/tools/eight-print-screenshot.html`
    }, sessionId, 12000);

    const captureStatus = await waitForCaptureStatus(cdp, sessionId, 35000);
    if(captureStatus.status !== 'passed') throw new Error(captureStatus.text || `harness status: ${captureStatus.status}`);

    await cdp.send('Page.bringToFront', {}, sessionId);
    const screenshot = await cdp.send('Page.captureScreenshot', {
      format:'png',
      fromSurface:true,
      captureBeyondViewport:false
    }, sessionId, 15000);
    if(!screenshot?.data) throw new Error('CDP не вернул PNG.');
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    return {waitMs:Date.now() - startedAt};
  } catch(error){
    const details = stderr ? `${error.message || error}\n${stderr}` : String(error.message || error);
    throw new Error(details);
  } finally {
    cdp.close();
    await terminateProcess(child);
  }
}

async function waitForCaptureStatus(cdp, sessionId, timeout){
  const startedAt = Date.now();
  let latest = {status:'missing', text:'captureStatus не найден'};
  while(Date.now() - startedAt < timeout){
    const evaluated = await cdp.send('Runtime.evaluate', {
      expression:`(() => {
        const node = document.getElementById('captureStatus');
        return node
          ? {status:node.dataset.status || 'pending', text:(node.textContent || '').trim()}
          : {status:'missing', text:'captureStatus не найден'};
      })()`,
      returnByValue:true,
      awaitPromise:true
    }, sessionId, 8000);
    latest = evaluated?.result?.value || latest;
    if(latest.status === 'passed' || latest.status === 'failed') return latest;
    await delay(120);
  }
  throw new Error(`harness timeout: ${latest.text || latest.status}`);
}

function createCdpPipeClient(child){
  const input = child.stdio[3];
  const output = child.stdio[4];
  const pending = new Map();
  let nextId = 1;
  let buffer = Buffer.alloc(0);
  let closed = false;

  output.on('data', chunk => {
    buffer = Buffer.concat([buffer, chunk]);
    let separatorIndex = buffer.indexOf(0);
    while(separatorIndex >= 0){
      const raw = buffer.subarray(0, separatorIndex).toString('utf8');
      buffer = buffer.subarray(separatorIndex + 1);
      if(raw) handleMessage(raw);
      separatorIndex = buffer.indexOf(0);
    }
  });

  const failAll = error => {
    if(closed) return;
    closed = true;
    for(const item of pending.values()){
      clearTimeout(item.timer);
      item.reject(error);
    }
    pending.clear();
  };

  attachCdpPipeErrorHandlers(input, output, failAll);
  child.once('error', failAll);
  child.once('close', (code, signal) => {
    failAll(new Error(`Chrome CDP pipe закрыт: code=${code}, signal=${signal || ''}`));
  });

  function handleMessage(raw){
    let message;
    try{ message = JSON.parse(raw); }
    catch(error){ failAll(new Error(`Некорректный ответ CDP: ${raw.slice(0, 300)}`)); return; }
    if(!message.id) return;
    const item = pending.get(message.id);
    if(!item) return;
    pending.delete(message.id);
    clearTimeout(item.timer);
    if(message.error) item.reject(new Error(`${item.method}: ${message.error.message || 'CDP error'}`));
    else item.resolve(message.result || {});
  }

  return {
    send(method, params = {}, sessionId = '', timeout = 10000){
      if(closed) return Promise.reject(new Error(`CDP pipe закрыт до команды ${method}.`));
      const id = nextId++;
      const payload = {id, method, params};
      if(sessionId) payload.sessionId = sessionId;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`${method}: timeout ${timeout} мс`));
        }, timeout);
        pending.set(id, {method, resolve, reject, timer});
        input.write(`${JSON.stringify(payload)}\0`);
      });
    },
    close(){
      failAll(new Error('CDP pipe закрыт runner-ом.'));
      input.end();
    }
  };
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

function terminateProcess(child){
  if(child.exitCode !== null || child.signalCode) return Promise.resolve();
  child.kill('SIGTERM');
  return new Promise(resolve => {
    const timer = setTimeout(() => {
      if(child.exitCode === null && !child.signalCode) child.kill('SIGKILL');
      resolve();
    }, 1500);
    child.once('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });
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

function delay(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
function tail(value){ return String(value || '').trim().slice(-4000); }
function failImmediately(message){
  fs.writeFileSync(failureLogPath, `${message}\n`, 'utf8');
  console.error(message);
  process.exit(1);
}
