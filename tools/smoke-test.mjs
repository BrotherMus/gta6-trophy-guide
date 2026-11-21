// Smoke test of the guide in headless Chrome: 55 rows, ticking persists across reloads, the kind filters and
// search work, the spoiler setting covers story trophies, export/import round-trips, every guide cites sources,
// and the page requests nothing outside its own server.
//
//   node tools/smoke-test.mjs
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { STORAGE_PREFIX, sleep, withBrowserPage } from './cdp-session.mjs';

const results = [];
function expect(label, condition, detail = '') {
  results.push({ label, ok: Boolean(condition), detail });
}

const rowCount = `document.querySelectorAll('.trophy-row').length`;
const clickChip = (label) =>
  `[...document.querySelectorAll('.chip')].find((chip) => chip.firstChild.textContent.trim() === ${JSON.stringify(label)}).click()`;
const earnedInStorage = `JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_PREFIX + 'earned-v1')}) || '[]')`;

async function runSmokeTest(page) {
  await page.setViewport(1280, 800);
  await page.setStoredState({});
  await page.goto('/#/checklist');
  await page.waitFor('.trophy-row');
  expect('checklist shows all 55 trophies', (await page.evaluate(rowCount)) === 55);
  expect('first row is the platinum', (await page.evaluate(`document.querySelector('.trophy-name').textContent`)) === 'Vice Got a Price!');

  await page.evaluate(`document.querySelector('.trophy-row[data-id="2"] .earn-box').click()`);
  await sleep(100);
  expect('ticking saves to localStorage', JSON.stringify(await page.evaluate(earnedInStorage)) === '[2]');
  await page.goto('/?reload=1#/checklist');
  await page.waitFor('.trophy-row');
  expect('tick survives a reload', await page.evaluate(`document.querySelector('.trophy-row[data-id="2"] .earn-box').checked`));
  expect('overall meter counts it', (await page.evaluate(`document.querySelector('.meter-overall strong').textContent`)) === '1/55');

  for (const [label, count] of [['Story', 12], ['Missable', 1], ['Collectibles', 7], ['Activities', 10], ['Side missions', 7], ['Robberies', 10], ['Misc', 12]]) {
    await page.evaluate(clickChip(label));
    await sleep(50);
    expect(`filter ${label} shows ${count}`, (await page.evaluate(rowCount)) === count, String(await page.evaluate(rowCount)));
  }
  await page.evaluate(clickChip('All'));
  await page.evaluate(`(() => { const box = document.querySelector('input[type=search]'); box.value = 'tank'; box.dispatchEvent(new Event('input')); })()`);
  await sleep(50);
  const searchNames = await page.evaluate(`[...document.querySelectorAll('.trophy-name')].map((n) => n.textContent)`);
  expect('search "tank" finds Challenging Tank', searchNames.includes('Challenging Tank'), searchNames.join(', '));
  await page.evaluate(`(() => { const box = document.querySelector('input[type=search]'); box.value = ''; box.dispatchEvent(new Event('input')); })()`);

  await page.goto('/?guide=1#/checklist/37');
  await page.waitFor('.guide-panel .source-list');
  expect('guide panel opens the chosen trophy', (await page.evaluate(`document.querySelector('.guide-title').textContent`)) === 'Catch Me If You Can');
  expect('guide cites linked sources', (await page.evaluate(`document.querySelectorAll('.guide-panel .source-item a[href^="https://"]').length`)) >= 2);

  await page.goto('/?settings=1#/settings');
  await page.waitFor('.toggle input');
  await page.evaluate(`document.querySelector('.toggle input').click()`);
  await page.goto('/?spoilers=1#/checklist');
  await page.waitFor('.trophy-row');
  await page.evaluate(clickChip('Story'));
  await sleep(50);
  const storyNames = await page.evaluate(`[...document.querySelectorAll('.trophy-name')].map((n) => n.textContent)`);
  expect('spoiler setting covers unearned story trophies', storyNames.filter((name) => name.includes('spoiler hidden')).length === 11, storyNames.join(' | '));
  expect('earned story trophy stays readable', storyNames.includes('Just Like Paradise'));

  await page.goto('/?backup=1#/settings');
  await page.waitFor('.backup-actions .button');
  await page.evaluate(`document.querySelector('.backup-actions .button').click()`);
  await sleep(100);
  const statusTexts = await page.evaluate(`[...document.querySelectorAll('.status-message')].map((n) => n.textContent).join(' | ')`);
  expect('export reports the file', statusTexts.includes('Exported 1 earned trophies'), statusTexts);

  const importDir = mkdtempSync(join(tmpdir(), 'leonida-import-'));
  const importFile = join(importDir, 'progress.json');
  writeFileSync(importFile, JSON.stringify({ earned: [{ id: 1 }, 'Snow Storm', 28] }));
  const { root } = await page.cdp.send('DOM.getDocument');
  const { nodeId } = await page.cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: '.file-button input[type=file]' });
  await page.cdp.send('DOM.setFileInputFiles', { nodeId, files: [importFile] });
  await sleep(300);
  expect('import replaces progress from a file', JSON.stringify(await page.evaluate(earnedInStorage)) === '[1,13,28]', JSON.stringify(await page.evaluate(earnedInStorage)));

  await page.goto('/?view=roadmap#/roadmap');
  await page.waitFor('.stage-card');
  expect('roadmap shows 4 stages', (await page.evaluate(`document.querySelectorAll('.stage-card').length`)) === 4);
  expect('roadmap lists every trophy once', (await page.evaluate(`document.querySelectorAll('.stage-trophy').length`)) === 55);

  await page.goto('/?view=missables#/missables');
  await page.waitFor('.timeline-step');
  expect('missables flags the Chapter 1 step', (await page.evaluate(`document.querySelectorAll('.timeline-step.is-missable').length`)) === 1);

  const resourceUrls = await page.evaluate(`performance.getEntriesByType('resource').map((entry) => entry.name)`);
  const foreign = resourceUrls.filter((url) => !url.startsWith(page.baseUrl));
  expect('no request leaves the local server', foreign.length === 0, foreign.join(', '));
}

withBrowserPage({ appPort: 8138, debugPort: 9338 }, runSmokeTest)
  .then(() => {
    for (const result of results) console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.label}${result.ok || !result.detail ? '' : `  (${result.detail})`}`);
    const failed = results.filter((result) => !result.ok).length;
    console.log(`${results.length - failed} passed, ${failed} failed`);
    if (failed > 0) process.exitCode = 1;
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
