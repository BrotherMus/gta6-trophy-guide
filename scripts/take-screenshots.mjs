// Takes the entry's screenshots: serves app/ locally, drives headless Chrome (or Edge) over the DevTools
// protocol, sets the saved progress each shot in shots.json asks for, and captures 1280x800 JPEGs into
// screenshots/ with Page.captureScreenshot. It also fails if the app requests anything outside its own server.
//
//   node scripts/take-screenshots.mjs            (Node 22+, standard library only)
//   CHROME_PATH=/path/to/chrome node scripts/take-screenshots.mjs

import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const appRoot = join(repo, 'app');
const shotsDir = join(repo, 'screenshots');
const shots = JSON.parse(readFileSync(join(repo, 'shots.json'), 'utf8'));
const VIEWPORT = { width: 1280, height: 800 };
const MAX_BYTES = 256 * 1024;
const DEBUG_PORT = 9333;

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

function serveApp() {
  const server = createServer((request, response) => {
    let pathname = decodeURIComponent(new URL(request.url, 'http://x').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = resolve(join(appRoot, normalize(pathname)));
    if (!file.startsWith(appRoot + sep) || !existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    createReadStream(file).pipe(response);
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ];
  const found = candidates.find((path) => path && existsSync(path));
  if (!found) throw new Error('No Chrome or Edge found; set CHROME_PATH.');
  return found;
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

async function waitForDebugger() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      if (response.ok) return;
    } catch {
      // not up yet
    }
    await sleep(200);
  }
  throw new Error('Headless browser did not open its debugging port.');
}

/** A minimal DevTools protocol client over the browser's WebSocket. */
async function connectToPage() {
  const target = await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, { method: 'PUT' })).json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((done, fail) => { socket.onopen = done; socket.onerror = fail; });
  let nextId = 1;
  const pending = new Map();
  const listeners = [];
  socket.onmessage = (message) => {
    const payload = JSON.parse(message.data);
    if (payload.id && pending.has(payload.id)) {
      const { done, fail } = pending.get(payload.id);
      pending.delete(payload.id);
      if (payload.error) fail(new Error(payload.error.message));
      else done(payload.result);
    } else if (payload.method) {
      for (const listener of listeners) listener(payload);
    }
  };
  return {
    send(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((done, fail) => pending.set(id, { done, fail }));
    },
    on(listener) { listeners.push(listener); },
    close() { socket.close(); },
  };
}

async function evaluate(page, expression) {
  const result = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  return result.result?.value;
}

async function waitForAppReady(page) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await evaluate(page, 'document.documentElement.dataset.ready === "true"')) return;
    await sleep(100);
  }
  throw new Error('The app never finished rendering.');
}

function progressFor(shot) {
  const earned = Object.fromEntries(shot.progress.earned.map((id) => [id, '2026-11-19']));
  return { version: 1, earned, counts: shot.progress.counts, spoiler: shot.progress.spoiler };
}

async function captureJpeg(page) {
  for (const quality of [86, 80, 74, 68, 60, 52]) {
    const { data } = await page.send('Page.captureScreenshot', { format: 'jpeg', quality, captureBeyondViewport: false });
    const bytes = Buffer.from(data, 'base64');
    if (bytes.length <= MAX_BYTES) return { bytes, quality };
  }
  throw new Error('Screenshot stays over 256 KiB even at low quality.');
}

/** Delete the throwaway browser profile; Windows may hold its files briefly after the browser exits. */
async function removeProfile(profile) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      rmSync(profile, { recursive: true, force: true });
      return;
    } catch {
      await sleep(500);
    }
  }
  console.warn(`Could not remove the temporary browser profile ${profile}; delete it by hand.`);
}

async function main() {
  const server = await serveApp();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const profile = mkdtempSync(join(tmpdir(), 'trophy-shots-'));
  const browser = spawn(findBrowser(), [
    '--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars',
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`, 'about:blank',
  ], { stdio: 'ignore' });
  const outsideRequests = [];
  try {
    await waitForDebugger();
    const page = await connectToPage();
    page.on((event) => {
      if (event.method === 'Network.requestWillBeSent') {
        const url = event.params.request.url;
        if (!url.startsWith(origin) && !url.startsWith('data:') && !url.startsWith('blob:') && url !== 'about:blank') outsideRequests.push(url);
      }
    });
    await page.send('Network.enable');
    await page.send('Page.enable');
    await page.send('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, deviceScaleFactor: 1, mobile: false });
    await page.send('Page.navigate', { url: `${origin}/index.html` });
    await waitForAppReady(page);

    for (const [index, shot] of shots.entries()) {
      await evaluate(page, `localStorage.setItem('leonida-trophy-log/progress', ${JSON.stringify(JSON.stringify(progressFor(shot)))});
        localStorage.setItem('leonida-trophy-log/view', ${JSON.stringify(JSON.stringify(shot.view ?? {}))}); true`);
      await page.send('Page.navigate', { url: `${origin}/index.html?shot=${index + 1}#${shot.route}` });
      await sleep(150);
      await waitForAppReady(page);
      await evaluate(page, `document.querySelector('.trophy-row.is-selected')?.scrollIntoView({ block: 'center' }); true`);
      await sleep(250);
      const { bytes, quality } = await captureJpeg(page);
      writeFileSync(join(shotsDir, shot.file), bytes);
      console.log(`${shot.file}: ${(bytes.length / 1024).toFixed(1)} KiB at quality ${quality}`);
    }
    page.close();
  } finally {
    const exited = new Promise((done) => browser.once('exit', done));
    browser.kill();
    server.close();
    await Promise.race([exited, sleep(5000)]);
    await removeProfile(profile);
  }
  if (outsideRequests.length) {
    console.error('The app requested files outside its own server:', outsideRequests);
    process.exitCode = 1;
  } else {
    console.log('No request left the app\'s own server.');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
