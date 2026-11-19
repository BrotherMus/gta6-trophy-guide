// Takes the entry's screenshots: serves app/ locally, drives headless Chrome (or Edge) over the DevTools
// protocol, sets the saved progress each shot in shots.json asks for, and captures 1280x800 JPEGs into
// screenshots/ with Page.captureScreenshot. It also fails if the app requests anything outside its own server.
//
//   node scripts/take-screenshots.mjs            (Node 22+, standard library only)
//   CHROME_PATH=/path/to/chrome node scripts/take-screenshots.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRoot, serveApp, launchBrowser, openPage, watchOutsideRequests, evaluate, openApp, sleep } from './cdp-browser.mjs';

const shotsDir = join(repoRoot, 'screenshots');
const shots = JSON.parse(readFileSync(join(repoRoot, 'shots.json'), 'utf8'));
const MAX_BYTES = 256 * 1024;

/** The localStorage progress a shot asks for, in the app's own format. */
function progressFor(shot) {
  const earned = Object.fromEntries(shot.progress.earned.map((id) => [id, '2026-11-19']));
  return { version: 1, earned, counts: shot.progress.counts, spoiler: shot.progress.spoiler };
}

/** JPEG at the best quality that stays within the 256 KiB screenshot cap. */
async function captureJpeg(page) {
  for (const quality of [86, 80, 74, 68, 60, 52]) {
    const { data } = await page.send('Page.captureScreenshot', { format: 'jpeg', quality, captureBeyondViewport: false });
    const bytes = Buffer.from(data, 'base64');
    if (bytes.length <= MAX_BYTES) return { bytes, quality };
  }
  throw new Error('Screenshot stays over 256 KiB even at low quality.');
}

async function main() {
  const server = await serveApp();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await launchBrowser();
  let outsideRequests = [];
  try {
    const page = await openPage();
    outsideRequests = await watchOutsideRequests(page, origin);
    await openApp(page, `${origin}/index.html`);
    for (const [index, shot] of shots.entries()) {
      await evaluate(page, `localStorage.setItem('leonida-trophy-log/progress', ${JSON.stringify(JSON.stringify(progressFor(shot)))});
        localStorage.setItem('leonida-trophy-log/view', ${JSON.stringify(JSON.stringify(shot.view ?? {}))}); true`);
      await openApp(page, `${origin}/index.html?shot=${index + 1}#${shot.route}`);
      await evaluate(page, `document.querySelector('.trophy-row.is-selected')?.scrollIntoView({ block: 'center' }); true`);
      await sleep(250);
      const { bytes, quality } = await captureJpeg(page);
      writeFileSync(join(shotsDir, shot.file), bytes);
      console.log(`${shot.file}: ${(bytes.length / 1024).toFixed(1)} KiB at quality ${quality}`);
    }
    page.close();
  } finally {
    await browser.close();
    server.close();
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
