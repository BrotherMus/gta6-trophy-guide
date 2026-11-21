// Takes the entry's screenshots: for each shot in shots.json it sets the saved progress and settings, opens the
// route in headless Chrome (or Edge), and saves a Page.captureScreenshot JPEG to screenshots/, kept under 256 KiB.
//
//   node tools/take-screenshots.mjs            (BROWSER=<path to chrome.exe or msedge.exe> to pick one)
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot, sleep, withBrowserPage } from './cdp-session.mjs';

const shots = JSON.parse(readFileSync(join(repoRoot, 'shots.json'), 'utf8'));
const screenshotDir = join(repoRoot, 'screenshots');
const MAX_BYTES = 256 * 1024;

async function captureJpegUnderLimit(page) {
  for (let quality = 88; quality >= 40; quality -= 6) {
    const { data } = await page.cdp.send('Page.captureScreenshot', { format: 'jpeg', quality, fromSurface: true });
    const bytes = Buffer.from(data, 'base64');
    if (bytes.length <= MAX_BYTES) return { bytes, quality };
  }
  throw new Error('Could not fit the screenshot under 256 KiB');
}

async function takeScreenshots(page) {
  mkdirSync(screenshotDir, { recursive: true });
  for (const old of readdirSync(screenshotDir)) rmSync(join(screenshotDir, old));

  for (const [index, shot] of shots.entries()) {
    await page.setViewport(shot.viewport.width, shot.viewport.height);
    await page.setStoredState({ earned: shot.earned, preferences: shot.preferences });
    await page.goto(`/?shot=${index + 1}${shot.path}`);
    await page.waitFor(shot.waitFor);
    if (shot.click) await page.evaluate(`document.querySelector(${JSON.stringify(shot.click)}).click()`);
    await sleep(400);
    const { bytes, quality } = await captureJpegUnderLimit(page);
    writeFileSync(join(screenshotDir, shot.file), bytes);
    console.log(`${shot.file}: ${bytes.length} bytes at JPEG quality ${quality}`);
  }
}

withBrowserPage({ appPort: 8137, debugPort: 9337 }, takeScreenshots).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
