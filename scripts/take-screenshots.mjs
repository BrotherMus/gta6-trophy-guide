// Takes the entry's screenshots: serves app/ locally, drives headless Chrome (or Edge) over the DevTools
// protocol, and saves each view as a 1280x800 JPEG under 256 KiB with Page.captureScreenshot.
// Usage: node scripts/take-screenshots.mjs [--browser <path to chrome or msedge>]
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const appRoot = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');
const MAX_BYTES = 256 * 1024;
const VIEWPORT = { width: 1280, height: 800 };

// Demo progress shown in the shots: the first story trophies and a spread of cleanup trophies.
const DEMO_EARNED = [2, 3, 4, 8, 9, 20, 21, 28, 35, 42, 44, 46, 30, 31, 17];

const SHOTS = [
  { file: '1-checklist-guide.jpg', hash: '#view=tracker&trophy=28', spoilers: true },
  { file: '2-roadmap.jpg', hash: '#view=roadmap&trophy=1', spoilers: false },
  { file: '3-missables.jpg', hash: '#view=missables&trophy=28', spoilers: false },
  { file: '4-spoilers-backup.jpg', hash: '#view=settings&trophy=1', spoilers: true, after: "document.querySelector('.status-line').textContent = 'Exported gta6-trophy-progress.json'" },
];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

function startStaticServer() {
  const server = createServer((request, response) => {
    const path = normalize(decodeURIComponent(new URL(request.url, 'http://x').pathname)).replace(/^[/\\]+/, '');
    const file = join(appRoot, path || 'index.html');
    if (!file.startsWith(appRoot) || !existsSync(file) || statSync(file).isDirectory()) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    response.end(readFileSync(file));
  });
  return new Promise((ready) => server.listen(0, '127.0.0.1', () => ready(server)));
}

function findBrowser() {
  const flag = process.argv.indexOf('--browser');
  const candidates = [
    flag > -1 ? process.argv[flag + 1] : null,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  const found = candidates.find((candidate) => candidate && existsSync(candidate));
  if (!found) throw new Error('No Chrome or Edge found; pass --browser <path>.');
  return found;
}

async function launchBrowser() {
  const profile = mkdtempSync(join(tmpdir(), 'trophy-shots-'));
  const child = spawn(findBrowser(), [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
    '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${VIEWPORT.width},${VIEWPORT.height}`, 'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const wsUrl = await new Promise((found, fail) => {
    let log = '';
    child.stderr.on('data', (chunk) => {
      log += chunk;
      const match = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) found(match[1]);
    });
    child.on('exit', () => fail(new Error(`browser exited: ${log}`)));
  });
  return { child, profile, wsUrl };
}

function connectDevTools(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let nextId = 1;
  const pending = new Map();
  const listeners = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve: done, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else done(message.result);
    } else listeners.forEach((listener) => listener(message));
  });
  const send = (method, params = {}, sessionId) => new Promise((done, reject) => {
    const id = nextId++;
    pending.set(id, { resolve: done, reject });
    socket.send(JSON.stringify({ id, method, params, sessionId }));
  });
  const waitFor = (method) => new Promise((done) => listeners.push((message) => message.method === method && done(message)));
  return new Promise((ready) => socket.addEventListener('open', () => ready({ send, waitFor, close: () => socket.close() })));
}

const pause = (ms) => new Promise((done) => setTimeout(done, ms));

async function captureUnderLimit(send, sessionId) {
  for (const quality of [90, 84, 78, 72, 66, 60, 50]) {
    const { data } = await send('Page.captureScreenshot', { format: 'jpeg', quality, clip: { x: 0, y: 0, ...VIEWPORT, scale: 1 } }, sessionId);
    const bytes = Buffer.from(data, 'base64');
    if (bytes.length <= MAX_BYTES) return { bytes, quality };
  }
  throw new Error('Could not fit the screenshot under 256 KiB.');
}

async function takeShot(devtools, sessionId, baseUrl, shot) {
  const { send } = devtools;
  const state = JSON.stringify({ earned: DEMO_EARNED, hideStorySpoilers: shot.spoilers });
  await send('Page.navigate', { url: `${baseUrl}/index.html` }, sessionId);
  await pause(600);
  await send('Runtime.evaluate', { expression: `localStorage.setItem('leonida-platinum-tracker.v1', ${JSON.stringify(state)})` }, sessionId);
  // A fresh query string makes this a full navigation, so the app boots again and reads the hash route.
  await send('Page.navigate', { url: `${baseUrl}/index.html?shot=${encodeURIComponent(shot.file)}${shot.hash}` }, sessionId);
  await pause(1000);
  if (shot.after) {
    await send('Runtime.evaluate', { expression: shot.after }, sessionId);
    await pause(200);
  }
  const { bytes, quality } = await captureUnderLimit(send, sessionId);
  writeFileSync(join(shotsDir, shot.file), bytes);
  console.log(`${shot.file}: ${bytes.length} bytes at quality ${quality}`);
}

async function main() {
  mkdirSync(shotsDir, { recursive: true });
  const server = await startStaticServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const browser = await launchBrowser();
  try {
    const devtools = await connectDevTools(browser.wsUrl);
    const { targetId } = await devtools.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await devtools.send('Target.attachToTarget', { targetId, flatten: true });
    await devtools.send('Page.enable', {}, sessionId);
    await devtools.send('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, deviceScaleFactor: 1, mobile: false }, sessionId);
    for (const shot of SHOTS) await takeShot(devtools, sessionId, baseUrl, shot);
    devtools.close();
  } finally {
    browser.child.kill();
    server.close();
    await pause(500);
    rmSync(browser.profile, { recursive: true, force: true, maxRetries: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
