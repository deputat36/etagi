import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { attachCdpPipeErrorHandlers } from './cdp-pipe-error-guard.mjs';

class BenchmarkFailure extends Error {}

const rootDir = process.cwd();
const budgetPath = path.join(rootDir, 'data/performance-budget.json');
const failurePath = path.join(rootDir, 'performance-budget-failure.json');
fs.rmSync(failurePath, {force:true});

const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
const chrome = findChrome();
if(!chrome) writeFailureAndExit({type:'infrastructure', reason:'Chrome/Chromium не найден. Укажите CHROME_BIN или установите системный браузер.'});

const server = createStaticServer(rootDir);
server.keepAliveTimeout = 1;
server.headersTimeout = 5000;
const port = await listen(server);

try {
  const result = await runWithRetry(chrome, port, budget);
  validateResult(result, budget);
  printResult(result, budget);
} catch(error){
  const payload = error instanceof BenchmarkFailure
    ? {type:'benchmark', reason:error.message, details:error.details || null}
    : {type:'infrastructure', reason:String(error?.message || error)};
  try { fs.writeFileSync(failurePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8'); } catch{}
  console.error(`Performance budget failed: ${payload.reason}`);
  if(payload.details) console.error(JSON.stringify(payload.details, null, 2));
  process.exitCode = 1;
} finally {
  await closeServer(server);
}

async function runWithRetry(command, port, config){
  let lastError;
  for(let attempt = 1; attempt <= 2; attempt += 1){
    const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), `etagi-performance-${attempt}-`));
    try {
      return await runOnce(command, profileDir, port, config, attempt);
    } catch(error){
      if(error instanceof BenchmarkFailure) throw error;
      lastError = error;
      if(attempt === 2) throw error;
    } finally {
      fs.rmSync(profileDir, {recursive:true, force:true});
    }
  }
  throw lastError || new Error('Performance benchmark не завершён.');
}

async function runOnce(command, profileDir, port, config, attempt){
  const child = spawn(command, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--disable-background-networking', '--disable-component-update', '--disable-default-apps',
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars',
    '--run-all-compositor-stages-before-draw', '--force-device-scale-factor=1',
    '--window-size=1440,1200', `--user-data-dir=${profileDir}`, '--remote-debugging-pipe', 'about:blank'
  ], {cwd:rootDir, stdio:['ignore','ignore','pipe','pipe','pipe']});

  let stderr = '';
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', chunk => { stderr = tail(stderr + chunk); });
  const cdp = createCdpPipeClient(child);

  try {
    const {targetId} = await cdp.send('Target.createTarget', {url:'about:blank'}, '', 12000);
    const {sessionId} = await cdp.send('Target.attachToTarget', {targetId, flatten:true}, '', 12000);
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width:1440, height:1200, deviceScaleFactor:1, mobile:false, screenWidth:1440, screenHeight:1200
    }, sessionId);
    await cdp.send('Page.navigate', {url:`http://127.0.0.1:${port}/index.html?smoke=performance-budget`}, sessionId, 12000);
    const evaluated = await cdp.send('Runtime.evaluate', {
      expression: benchmarkExpression(config),
      returnByValue:true,
      awaitPromise:true
    }, sessionId, 120000);
    if(evaluated?.exceptionDetails){
      throw new BenchmarkFailure(`Browser benchmark exception: ${evaluated.exceptionDetails.text || 'unknown'}`);
    }
    const value = evaluated?.result?.value;
    if(!value || !Array.isArray(value.results)) throw new BenchmarkFailure('Browser benchmark не вернул результаты.');
    return {...value, attempt};
  } catch(error){
    if(error instanceof BenchmarkFailure) throw error;
    throw new Error(stderr ? `${error.message || error}\n${stderr}` : String(error.message || error));
  } finally {
    cdp.close();
    await terminateProcess(child);
  }
}

function benchmarkExpression(config){
  const serialized = JSON.stringify(config).replace(/</g, '\\u003c');
  return `(async () => {
    const config = ${serialized};
    const counts = [1,2,4,8];
    const sheet = () => document.getElementById('printSheet');
    const headlineInput = () => document.getElementById('headline');
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const raf = () => new Promise(resolve => requestAnimationFrame(() => resolve()));

    async function waitFor(predicate, timeout = 15000, label = 'condition'){
      const started = performance.now();
      while(performance.now() - started < timeout){
        if(predicate()) return;
        await sleep(25);
      }
      throw new Error('timeout: ' + label);
    }

    // Повторяем доказанный контракт form-input-render-smoke: сначала ждём
    // полной загрузки библиотеки, затем даём init() закончить применение шаблона.
    await waitFor(() => document.querySelectorAll('#templateList .tpl-card').length > 1, 12000, 'templates ready');
    await waitFor(() => sheet()?.querySelector('.flyer') && headlineInput() && document.querySelector('[data-count="8"]'), 8000, 'app ready');
    await sleep(700);

    for(const [id, checked] of [['showHeadline', true], ['showPhoto', false], ['showQr', false], ['tearOffs', false]]){
      const el = document.getElementById(id);
      if(el && el.checked !== checked){
        el.checked = checked;
        el.dispatchEvent(new Event('change', {bubbles:true}));
      }
    }
    await raf(); await raf();

    async function setCount(count){
      const button = document.querySelector('[data-count="' + count + '"]');
      if(!button) throw new Error('missing count button ' + count);
      button.click();
      await waitFor(() => sheet().querySelectorAll('.flyer').length === count, 5000, 'flyer count ' + count);
      await raf(); await raf();
    }

    async function editOnce(count, token){
      const input = headlineInput();
      const value = 'Perf ' + count + ' ' + token + ' ' + Math.random().toString(36).slice(2,8);
      let mutationCallbacks = 0;
      const observer = new MutationObserver(() => { mutationCallbacks += 1; });
      observer.observe(sheet(), {subtree:true, childList:true, characterData:true, attributes:true});

      input.value = value;
      const start = performance.now();
      input.dispatchEvent(new Event('input', {bubbles:true}));
      const syncMs = performance.now() - start;

      await waitFor(() => {
        const flyers = [...sheet().querySelectorAll('.flyer')];
        return flyers.length === count && flyers.every(f => (f.querySelector('.headline')?.textContent || '').trim() === value);
      }, 5000, 'headline propagation ' + count);
      await raf(); await raf();

      const settleMs = performance.now() - start;
      const flyers = [...sheet().querySelectorAll('.flyer')];
      const headlineMatches = flyers.filter(f => (f.querySelector('.headline')?.textContent || '').trim() === value).length;
      const domNodes = sheet().querySelectorAll('*').length;
      await sleep(config.structural.stabilityObservationMs);
      const callbacksAfterObservation = mutationCallbacks;
      await sleep(config.structural.stabilityQuietWindowMs);
      const callbacksAfterQuiet = mutationCallbacks;
      observer.disconnect();
      if(callbacksAfterQuiet !== callbacksAfterObservation) throw new Error('printSheet mutations continue after stabilization for count ' + count);

      return {settleMs, syncMs, domNodes, flyerCount:flyers.length, headlineMatches, mutationCallbacks:callbacksAfterQuiet};
    }

    const results = [];
    for(const count of counts){
      await setCount(count);
      for(let i=0;i<config.warmups;i++) await editOnce(count, 'warmup-' + i);
      const samples = [];
      for(let i=0;i<config.samples;i++) samples.push(await editOnce(count, 'sample-' + i));
      const settle = samples.map(x => x.settleMs).sort((a,b) => a-b);
      const sync = samples.map(x => x.syncMs).sort((a,b) => a-b);
      const middle = Math.floor(settle.length / 2);
      const medianMs = settle.length % 2 ? settle[middle] : (settle[middle-1] + settle[middle]) / 2;
      const syncMedianMs = sync.length % 2 ? sync[middle] : (sync[middle-1] + sync[middle]) / 2;
      results.push({
        count,
        samplesMs:samples.map(x => Number(x.settleMs.toFixed(2))),
        syncSamplesMs:samples.map(x => Number(x.syncMs.toFixed(2))),
        medianMs:Number(medianMs.toFixed(2)),
        syncMedianMs:Number(syncMedianMs.toFixed(2)),
        worstMs:Number(Math.max(...samples.map(x => x.settleMs)).toFixed(2)),
        domNodes:Math.max(...samples.map(x => x.domNodes)),
        flyerCount:samples.at(-1).flyerCount,
        headlineMatches:samples.at(-1).headlineMatches,
        mutationCallbacks:Math.max(...samples.map(x => x.mutationCallbacks))
      });
    }
    return {chrome:navigator.userAgent, results};
  })()`;
}

function validateResult(result, config){
  const failures = [];
  const byCount = new Map(result.results.map(item => [Number(item.count), item]));
  for(const count of [1,2,4,8]){
    const item = byCount.get(count);
    const ceiling = Number(config.counts[String(count)].medianCeilingMs);
    if(!item){ failures.push(`count ${count}: result missing`); continue; }
    if(item.flyerCount !== count) failures.push(`count ${count}: flyers ${item.flyerCount}, expected ${count}`);
    if(item.headlineMatches !== count) failures.push(`count ${count}: updated headlines ${item.headlineMatches}, expected ${count}`);
    if(item.medianMs > ceiling) failures.push(`count ${count}: median ${item.medianMs}ms > budget ${ceiling}ms`);
    if(item.worstMs > ceiling * Number(config.worstSampleMultiplier || 4)) failures.push(`count ${count}: worst ${item.worstMs}ms is an extreme hang`);
  }

  const one = byCount.get(1);
  if(one){
    for(const count of [2,4,8]){
      const item = byCount.get(count);
      if(!item) continue;
      const maxDom = one.domNodes * count * Number(config.structural.domGrowthFactor) + Number(config.structural.domFixedAllowance);
      if(item.domNodes > maxDom) failures.push(`count ${count}: DOM ${item.domNodes} > structural limit ${Math.round(maxDom)}`);
    }
  }

  const four = byCount.get(Number(config.scaling.from));
  const eight = byCount.get(Number(config.scaling.to));
  if(four && eight){
    const limit = four.medianMs * Number(config.scaling.multiplier) + Number(config.scaling.allowanceMs);
    if(eight.medianMs > limit) failures.push(`scaling 4→8: ${eight.medianMs}ms > ${limit.toFixed(2)}ms`);
  }

  if(failures.length){
    const error = new BenchmarkFailure(failures.join('; '));
    error.details = {results:result.results, budget:config};
    throw error;
  }
}

function printResult(result, config){
  console.log('Performance budget passed.');
  console.log('copies | median | worst | sync median | budget | DOM');
  for(const item of result.results){
    const ceiling = config.counts[String(item.count)].medianCeilingMs;
    console.log(`${item.count} | ${item.medianMs} ms | ${item.worstMs} ms | ${item.syncMedianMs} ms | ${ceiling} ms | ${item.domNodes}`);
    console.log(`  samples: ${item.samplesMs.join(', ')}`);
  }
  const four = result.results.find(x => x.count === 4);
  const eight = result.results.find(x => x.count === 8);
  if(four && eight) console.log(`scaling 4→8: ${eight.medianMs} <= ${four.medianMs} × ${config.scaling.multiplier} + ${config.scaling.allowanceMs}`);
}

function writeFailureAndExit(payload){
  try { fs.writeFileSync(failurePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8'); } catch{}
  console.error(`Performance budget failed: ${payload.reason}`);
  process.exit(1);
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
  child.once('close', (code, signal) => failAll(new Error(`Chrome CDP pipe закрыт: code=${code}, signal=${signal || ''}`)));

  function handleMessage(raw){
    let message;
    try { message = JSON.parse(raw); }
    catch { failAll(new Error(`Некорректный ответ CDP: ${raw.slice(0,300)}`)); return; }
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
    close(){ failAll(new Error('CDP pipe закрыт runner-ом.')); input.end(); }
  };
}

function findChrome(){
  const candidates = [
    process.env.CHROME_BIN,
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium', '/usr/bin/chromium-browser',
    'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'
  ].filter(Boolean);
  for(const candidate of candidates){
    if(path.isAbsolute(candidate) && !fs.existsSync(candidate)) continue;
    const probe = spawnSync(candidate, ['--version'], {encoding:'utf8', timeout:5000});
    if(!probe.error && probe.status === 0) return candidate;
  }
  return '';
}

function createStaticServer(root){
  const rootResolved = path.resolve(root);
  return http.createServer((request, response) => {
    try {
      const url = new URL(request.url || '/', 'http://127.0.0.1');
      let pathname = decodeURIComponent(url.pathname);
      if(pathname === '/') pathname = '/index.html';
      const resolved = path.resolve(root, `.${pathname}`);
      if(!resolved.startsWith(rootResolved) || !fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()){
        response.writeHead(404); response.end('Not found'); return;
      }
      response.writeHead(200, {'Content-Type':contentType(resolved), 'Cache-Control':'no-store', 'Connection':'close'});
      fs.createReadStream(resolved).pipe(response);
    } catch(error){
      response.writeHead(500, {'Connection':'close'}); response.end(String(error?.message || error));
    }
  });
}

function contentType(file){
  const ext = path.extname(file).toLowerCase();
  return ({
    '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml',
    '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp'
  })[ext] || 'application/octet-stream';
}

function listen(server){
  return new Promise((resolve,reject) => {
    server.once('error',reject);
    server.listen(0,'127.0.0.1',()=>resolve(server.address().port));
  });
}
function closeServer(server){ return new Promise(resolve => server.close(()=>resolve())); }
function delay(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
async function terminateProcess(child){
  if(child.exitCode !== null) return;
  child.kill('SIGTERM');
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(1500)]);
  if(child.exitCode === null) child.kill('SIGKILL');
}
function tail(text, max = 6000){ return String(text || '').slice(-max); }
