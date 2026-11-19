// Shared plumbing for the scripts: serve app/ on a local port, launch headless Chrome or Edge, and talk to a page
// over the DevTools protocol (Node 22+ global WebSocket and fetch, standard library only).

import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const appRoot = join(repoRoot, 'app');
export const VIEWPORT = { width: 1280, height: 800 };
const DEBUG_PORT = 9333;

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

export const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** Serve app/ read-only on 127.0.0.1 with a random port; resolves to the server. */
export function serveApp() {
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

async function waitForDebugger() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)).ok) return;
    } catch {
      // not listening yet
    }
    await sleep(200);
  }
  throw new Error('Headless browser did not open its debugging port.');
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

/** Start a headless browser with a fresh profile; close() stops it and cleans up. */
export async function launchBrowser() {
  const profile = mkdtempSync(join(tmpdir(), 'trophy-browser-'));
  const browser = spawn(findBrowser(), [
    '--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--hide-scrollbars',
    `--window-size=${VIEWPORT.width},${VIEWPORT.height}`, 'about:blank',
  ], { stdio: 'ignore' });
  const exited = new Promise((done) => browser.once('exit', done));
  await waitForDebugger();
  return {
    async close() {
      browser.kill();
      await Promise.race([exited, sleep(5000)]);
      await removeProfile(profile);
    },
  };
}

/** Open a tab and return a minimal protocol client: send(method, params), on(listener), close(). */
export async function openPage() {
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
  const page = {
    send(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((done, fail) => pending.set(id, { done, fail }));
    },
    on(listener) { listeners.push(listener); },
    close() { socket.close(); },
  };
  await page.send('Page.enable');
  await page.send('Emulation.setDeviceMetricsOverride', { ...VIEWPORT, deviceScaleFactor: 1, mobile: false });
  return page;
}

/** Record every request that leaves the app's own server (the app must make none). */
export async function watchOutsideRequests(page, origin) {
  const outside = [];
  page.on((event) => {
    if (event.method !== 'Network.requestWillBeSent') return;
    const url = event.params.request.url;
    if (!url.startsWith(origin) && !url.startsWith('data:') && !url.startsWith('blob:') && url !== 'about:blank') outside.push(url);
  });
  await page.send('Network.enable');
  return outside;
}

export async function evaluate(page, expression) {
  const result = await page.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
  return result.result?.value;
}

/** Navigate and wait until main.js marks the page ready. */
export async function openApp(page, url) {
  await page.send('Page.navigate', { url });
  await sleep(150);
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (await evaluate(page, 'document.documentElement.dataset.ready === "true"')) return;
    await sleep(100);
  }
  throw new Error(`The app never finished rendering at ${url}`);
}
