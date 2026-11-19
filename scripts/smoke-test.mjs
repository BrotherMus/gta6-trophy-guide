// Smoke test of the real app in headless Chrome/Edge: checklist, filters, search, saved ticks, spoiler shield,
// export/import through the file input, and a cited guide for every trophy. Exits 1 on the first failure.
//
//   node scripts/smoke-test.mjs

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { serveApp, launchBrowser, openPage, watchOutsideRequests, evaluate, openApp, sleep } from './cdp-browser.mjs';

const results = [];

function expect(label, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  results.push({ label, pass });
  console.log(`${pass ? 'pass' : 'FAIL'}  ${label}${pass ? '' : `: got ${JSON.stringify(actual)}, wanted ${JSON.stringify(expected)}`}`);
}

const rowCount = '[...document.querySelectorAll("#trophy-list .trophy-row")].length';
const rowNames = '[...document.querySelectorAll("#trophy-list .trophy-name")].map((n) => n.textContent)';
const clickChip = (id) => `document.querySelector(".chip-${id}").click(); true`;
const setField = (selector, value, eventName) =>
  `(() => { const field = document.querySelector(${JSON.stringify(selector)}); field.value = ${JSON.stringify(value)}; field.dispatchEvent(new Event("${eventName}")); return true; })()`;

async function setFileInput(page, selector, path) {
  const { root } = await page.send('DOM.getDocument');
  const { nodeId } = await page.send('DOM.querySelector', { nodeId: root.nodeId, selector });
  await page.send('DOM.setFileInputFiles', { nodeId, files: [path] });
}

async function testTracker(page, origin) {
  await evaluate(page, 'localStorage.clear(); true');
  await openApp(page, `${origin}/index.html#tracker`);
  expect('checklist shows all 55 trophies', await evaluate(page, rowCount), 55);
  expect('progress strip starts at 0 / 55', await evaluate(page, 'document.querySelector(".progress-overall .progress-number").textContent'), '0 / 55');

  await evaluate(page, clickChip('missable'));
  expect('Missable filter keeps one trophy', await evaluate(page, rowNames), ['Positive Mental Attitude']);
  await evaluate(page, clickChip('collectible'));
  expect('Collectibles filter count', await evaluate(page, rowCount), 5);
  await evaluate(page, clickChip('activity'));
  expect('Activities filter count', await evaluate(page, rowCount), 9);
  await evaluate(page, clickChip('story'));
  expect('Story filter count', await evaluate(page, rowCount), 12);
  expect('Online chip is disabled (no online trophies)', await evaluate(page, 'document.querySelector(".chip-online").disabled'), true);
  await evaluate(page, clickChip('all'));

  await evaluate(page, setField('#grade-filter', 'silver', 'change'));
  expect('grade filter: 6 silver', await evaluate(page, rowCount), 6);
  await evaluate(page, setField('#grade-filter', 'all', 'change'));

  await evaluate(page, setField('#trophy-search', 'UFO', 'input'));
  expect('search finds the UFO trophy', await evaluate(page, rowNames), ['The Truth Is Out There']);
  await evaluate(page, setField('#trophy-search', '', 'input'));

  await evaluate(page, 'document.querySelector(".trophy-row[data-id=\'20\'] .earned-box").click(); true');
  await openApp(page, `${origin}/index.html?reload=1#tracker`);
  expect('a ticked trophy stays ticked after reload', await evaluate(page, 'document.querySelector(".trophy-row[data-id=\'20\'] .earned-box").checked'), true);
  expect('bronze bar counts it', await evaluate(page, 'document.querySelector(".progress-bronze .progress-number").textContent'), '1 / 46');
}

async function testSpoilers(page, origin) {
  const nameOf = (id) => `document.querySelector(".trophy-row[data-id='${id}'] .trophy-name").textContent`;
  expect('story trophy shielded by default', await evaluate(page, nameOf(4)), 'Hidden story trophy');
  expect('non-story trophy not shielded', await evaluate(page, nameOf(50)), 'The Truth Is Out There');
  await openApp(page, `${origin}/index.html?s=1#settings`);
  await evaluate(page, 'document.querySelector("input[name=spoiler][value=off]").click(); true');
  await openApp(page, `${origin}/index.html?s=2#tracker`);
  expect('spoiler off shows the official name', await evaluate(page, nameOf(4)), 'T**s Ass Drug Money');
}

async function testBackup(page, origin) {
  const backup = JSON.stringify({ app: 'leonida-trophy-log', version: 1, earned: [{ id: 1 }, { name: 'Let’s Go Bowling' }, 'In The Beginning...', { name: 'Not a trophy' }], counts: { 15: 120 } });
  const folder = mkdtempSync(join(tmpdir(), 'trophy-backup-'));
  const file = join(folder, 'backup.json');
  writeFileSync(file, backup);
  try {
    await openApp(page, `${origin}/index.html?b=1#settings`);
    const exported = await evaluate(page, 'import("./js/backup-file.js").then((m) => document.querySelector("#export-button") && true)');
    expect('export button present', exported, true);
    await setFileInput(page, '#import-file', file);
    await sleep(400);
    expect('import reports matched and skipped entries', await evaluate(page, 'document.querySelector(".backup-status").textContent.includes("Imported 3 earned trophies") && document.querySelector(".backup-status").textContent.includes("1 unknown")'), true);
    const saved = await evaluate(page, 'JSON.parse(localStorage.getItem("leonida-trophy-log/progress"))');
    expect('import saved ids by id, curly-quote name and ellipsis name', Object.keys(saved.earned).sort(), ['1', '44', '46']);
    expect('import kept the stunt counter', saved.counts['15'], 120);
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
}

async function testEveryGuide(page, origin) {
  await evaluate(page, 'localStorage.setItem("leonida-trophy-log/progress", JSON.stringify({ version: 1, earned: {}, counts: {}, spoiler: "off" })); true');
  await openApp(page, `${origin}/index.html?g=1#tracker`);
  const report = await evaluate(page, `(() => {
    const missing = [];
    for (const row of document.querySelectorAll('#trophy-list .trophy-row')) {
      row.querySelector('.row-main').click();
      const panel = document.querySelector('#guide-panel');
      const links = [...panel.querySelectorAll('.source-item a')].filter((a) => a.href.startsWith('https://'));
      const guide = panel.querySelector('.guide-text')?.textContent.trim();
      if (!guide || !links.length) missing.push(row.dataset.id);
    }
    return missing;
  })()`);
  expect('every trophy shows a guide and at least one linked source', report, []);
}

async function main() {
  const server = await serveApp();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await launchBrowser();
  let outside = [];
  try {
    const page = await openPage();
    outside = await watchOutsideRequests(page, origin);
    await openApp(page, `${origin}/index.html`);
    await testTracker(page, origin);
    await testSpoilers(page, origin);
    await testBackup(page, origin);
    await testEveryGuide(page, origin);
    page.close();
  } finally {
    await browser.close();
    server.close();
  }
  expect('no request left the app\'s own server', outside, []);
  const failed = results.filter((result) => !result.pass).length;
  console.log(`${results.length - failed} passed, ${failed} failed`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
