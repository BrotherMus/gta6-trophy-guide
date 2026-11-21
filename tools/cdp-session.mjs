// Shared by the screenshot script and the smoke test: serve app/ with serve.ts, start headless Chrome (or Edge),
// and talk to its page over the Chrome DevTools Protocol using the WebSocket built into Node 22+.
import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = fileURLToPath(new URL('..', import.meta.url));
export const STORAGE_PREFIX = 'leonida-platinum-guide/';

const BROWSER_CANDIDATES = [
  process.env.BROWSER,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findBrowser() {
  const found = BROWSER_CANDIDATES.find((path) => existsSync(path));
  if (!found) throw new Error('No Chrome or Edge found; set BROWSER to its executable.');
  return found;
}

async function waitForHttp(url, attempts = 80) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
    } catch {
      // not up yet
    }
    await sleep(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function connectToDevTools(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();
  const eventWaiters = [];
  let nextId = 1;
  socket.addEventListener('message', (message) => {
    const payload = JSON.parse(message.data);
    if (payload.id && pending.has(payload.id)) {
      const { resolve, reject } = pending.get(payload.id);
      pending.delete(payload.id);
      if (payload.error) reject(new Error(payload.error.message));
      else resolve(payload.result);
    } else if (payload.method) {
      for (const waiter of [...eventWaiters]) {
        if (waiter.method === payload.method) {
          eventWaiters.splice(eventWaiters.indexOf(waiter), 1);
          waiter.resolve(payload.params);
        }
      }
    }
  });
  return new Promise((resolve, reject) => {
    socket.addEventListener('error', reject, { once: true });
    socket.addEventListener(
      'open',
      () =>
        resolve({
          send(method, params = {}) {
            const id = nextId++;
            socket.send(JSON.stringify({ id, method, params }));
            return new Promise((done, fail) => pending.set(id, { resolve: done, reject: fail }));
          },
          once(method) {
            return new Promise((done) => eventWaiters.push({ method, resolve: done }));
          },
          close: () => socket.close(),
        }),
      { once: true },
    );
  });
}

/** Starts server + browser, runs work(page), and always shuts both down. */
export async function withBrowserPage({ appPort, debugPort }, work) {
  const profileDir = join(tmpdir(), `leonida-guide-profile-${debugPort}`);
  rmSync(profileDir, { recursive: true, force: true });
  const server = spawn(process.execPath, [join(repoRoot, 'serve.ts'), '--port', String(appPort)], { stdio: 'ignore' });
  const browser = spawn(
    findBrowser(),
    [
      '--headless=new',
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${profileDir}`,
      '--window-size=1280,800',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--force-device-scale-factor=1',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  try {
    const baseUrl = `http://localhost:${appPort}`;
    await waitForHttp(`${baseUrl}/index.html`);
    await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`);
    const targets = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json();
    const cdp = await connectToDevTools(targets.find((target) => target.type === 'page').webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Browser.setDownloadBehavior', { behavior: 'deny' }).catch(() => {});
    const page = createPageHelpers(cdp, baseUrl);
    try {
      return await work(page);
    } finally {
      cdp.close();
    }
  } finally {
    browser.kill();
    server.kill();
  }
}

function createPageHelpers(cdp, baseUrl) {
  const page = {
    cdp,
    baseUrl,
    async evaluate(expression) {
      const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(`Page error: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
      return result.result.value;
    },
    async goto(pathAndHash) {
      const loaded = cdp.once('Page.loadEventFired');
      await cdp.send('Page.navigate', { url: `${baseUrl}${pathAndHash}` });
      await loaded;
    },
    async waitFor(selector, timeoutMs = 8000) {
      const started = Date.now();
      while (Date.now() - started < timeoutMs) {
        if (await page.evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return;
        await sleep(100);
      }
      throw new Error(`Timed out waiting for ${selector}`);
    },
    async setStoredState({ earned = [], preferences = {} }) {
      await page.goto('/blank-for-storage');
      await page.evaluate(
        `localStorage.clear();
         localStorage.setItem(${JSON.stringify(STORAGE_PREFIX + 'earned-v1')}, ${JSON.stringify(JSON.stringify(earned))});
         localStorage.setItem(${JSON.stringify(STORAGE_PREFIX + 'preferences-v1')}, ${JSON.stringify(JSON.stringify(preferences))});`,
      );
    },
    setViewport(width, height) {
      return cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
    },
  };
  return page;
}
