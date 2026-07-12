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
const requestedScenario = getRequestedScenario();
const selectedScenarios = requestedScenario
  ? scenarios.filter(item => item.id === requestedScenario)
  : scenarios;

fs.rmSync(failureLogPath, {force:true});
fs.rmSync(outputDir, {recursive:true, force:true});
fs.mkdirSync(outputDir, {recursive:true});

if(requestedScenario && !selectedScenarios.length){
  failImmediately(`Print screenshots: неизвестный сценарий ${requestedScenario}.`);
}

const chrome = findChrome();
if(!chrome) failImmediately('Print screenshots: Chrome/Chromium не найден. Укажите CHROME_BIN или установите системный браузер.');

const manifest = [];

try{
  for(const scenario of selectedScenarios){
    const server = createStaticServer(rootDir);
    server.keepAliveTimeout = 1;
    server.headersTimeout = 5000;
    const port = await listen(server);
    const screenshotPath = path.join(outputDir, `${scenario.id}.png`);

    try{
      const result = await captureScenario(chrome, port, scenario, screenshotPath);
      const sizeBytes = fs.statSync(screenshotPath).size;
      if(sizeBytes < 10000) throw new Error(`${scenario.title}: PNG подозрительно мал — ${sizeBytes} байт.`);

      const entry = {
        id: scenario.id,
        title: scenario.title,
        file: path.relative(rootDir, screenshotPath).replaceAll('\\', '/'),
        sizeBytes,
        attempt: result.attempt,
        captureMethod: 'cdp-pipe',
        waitMs: result.waitMs
      };
      manifest.push(entry);
      fs.writeFileSync(path.join(outputDir, `${scenario.id}.json`), JSON.stringify(entry, null, 2), 'utf8');
      console.log(`✓ ${scenario.title}: ${Math.round(sizeBytes / 1024)} КБ, ожидание ${result.waitMs} мс`);
    } finally {
      await closeServer(server);
    }
  }

  if(!requestedScenario) writeManifest(manifest);
  console.log(`Print screenshots passed: ${manifest.length} PNG.`);
} catch(error){
  const details = String(error?.message || error);
  fs.writeFileSync(failureLogPath, `${details}\n`, 'utf8');
  console.error(details);
  process.exitCode = 1;
}

async function captureScenario(command, port, scenario, screenshotPath){
  let lastFailure = '';

  for(let attempt = 1; attempt <= 2; attempt += 1){
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), `etagi-print-${scenario.id}-${attempt}-`));
    const url = `http://127.0.0.1:${port}/tools/print-screenshot.html?scenario=${encodeURIComponent(scenario.id)}`;
    fs.rmSync(screenshotPath, {force:true});

    try{
      const result = await captureWithCdpPipe(command, profileDir, url, screenshotPath);
      return {attempt, waitMs:result.waitMs};
    } catch(error){
      lastFailure = `${scenario.title}: попытка ${attempt} — ${error.message || error}`;
    } finally {
      fs.rmSync(profileDir, {recursive:true, force:true});
    }
  }

  throw new Error(lastFailure || `${scenario.title}: сценарий не завершён.`);
}

async function captureWithCdpPipe(command, profileDir, url, screenshotPath){
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
    cwd: rootDir,
    stdio:['ignore','ignore','pipe','pipe','pipe']
  });

  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => {
    stderr = tail(stderr + chunk);
  });

  const cdp = createCdpPipeClient(child);
  const startedAt = Date.now();

  try{
    const {targetId} = await cdp.send('Target.createTarget', {
      url:'about:blank'
    }, '', 12000);
    const {sessionId} = await cdp.send('Target.attachToTarget', {
      targetId,
      flatten:true
    }, '', 12000);

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
    await cdp.send('Page.navigate', {url}, sessionId, 12000);

    const captureStatus = await waitForCaptureStatus(cdp, sessionId, 35000);
    if(captureStatus.status !== 'passed'){
      throw new Error(captureStatus.text || `harness status: ${captureStatus.status}`);
    }

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

  child.once('error', failAll);
  child.once('close', (code, signal) => {
    failAll(new Error(`Chrome CDP pipe закрыт: code=${code}, signal=${signal || ''}`));
  });

  function handleMessage(raw){
    let message;
    try{
      message = JSON.parse(raw);
    } catch(error){
      failAll(new Error(`Некорректный ответ CDP: ${raw.slice(0, 300)}`));
      return;
    }

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

function getRequestedScenario(){
  const index = process.argv.indexOf('--scenario');
  const cliValue = index >= 0 ? process.argv[index + 1] : '';
  return String(process.env.PRINT_SCREENSHOT_SCENARIO || cliValue || '').trim();
}

function writeManifest(entries){
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify({
    generatedAt: new Date().toISOString(),
    viewport: {width:794, height:1123, deviceScaleFactor:1},
    scenarios: entries
  }, null, 2), 'utf8');
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

function delay(ms){
  return new Promise(resolve => setTimeout(resolve, ms));
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

function tail(value){
  return String(value || '').trim().slice(-4000);
}

function failImmediately(message){
  fs.writeFileSync(failureLogPath, `${message}\n`, 'utf8');
  console.error(message);
  process.exit(1);
}
