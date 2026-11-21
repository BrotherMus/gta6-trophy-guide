// Spoilers & backup: the spoiler setting with a live preview, and export / import / reset of saved progress.
import { el, replaceContent } from '../ui/dom.js';
import { buildBackup, downloadBackup, readBackupText, BACKUP_FILENAME } from '../state/backup-file.js';
import { countMaskedTrophies } from '../logic/spoiler-rules.js';
import { renderTrophyRow } from './trophy-row.js';

export function mountSettingsView(root, context) {
  let status = null;

  function showStatus(text, isError = false) {
    status = { text, isError };
    refresh();
  }

  function exportProgress() {
    const backup = buildBackup(context.data, context.progress.earnedIds());
    downloadBackup(backup);
    showStatus(`Exported ${backup.earnedCount} earned trophies to ${BACKUP_FILENAME}.`);
  }

  async function importProgress(file) {
    if (!file) return;
    try {
      const ids = readBackupText(await file.text(), context.data);
      context.progress.replaceEarned(ids);
      showStatus(`Imported ${ids.length} earned trophies from ${file.name}.`);
    } catch (error) {
      showStatus(`Import failed: ${error.message}`, true);
    }
  }

  function resetProgress() {
    if (!window.confirm('Clear every earned tick in this browser? Export first if you want a copy.')) return;
    context.progress.replaceEarned([]);
    showStatus('Progress cleared.');
  }

  function refresh() {
    const preferences = context.preferences.get();
    replaceContent(
      root,
      el(
        'div',
        { className: 'view-intro' },
        el('h1', { text: 'Spoilers & backup' }),
        el('p', { text: 'Everything is stored in this browser (localStorage). Nothing is sent anywhere.' }),
      ),
      el(
        'div',
        { className: 'settings-layout' },
        el('div', {}, renderSpoilerPanel(context, preferences), renderBackupPanel(context, { exportProgress, importProgress, resetProgress, status })),
        renderSpoilerPreview(context),
      ),
    );
  }

  refresh();
  return { refresh };
}

function renderSpoilerPanel(context, preferences) {
  const coveredCount = countMaskedTrophies(context.data.trophies, preferences, context.progress.isEarned);
  return el(
    'section',
    { className: 'panel' },
    el('h2', { text: 'Spoiler protection' }),
    renderToggle({
      checked: preferences.hideStorySpoilers,
      label: 'Hide story trophies until earned',
      hint: 'Covers the name and description of the 12 story trophies (chapters and missions) everywhere in the guide.',
      onChange: (checked) => context.preferences.update({ hideStorySpoilers: checked }),
    }),
    renderToggle({
      checked: preferences.hideAllHiddenTrophies,
      label: 'Also hide the other trophies PlayStation hides',
      hint: '28 trophies are hidden on PSN; this covers all of them until earned.',
      onChange: (checked) => context.preferences.update({ hideAllHiddenTrophies: checked }),
    }),
    el('p', { className: 'status-message', text: `Covering ${coveredCount} trophies right now.` }),
  );
}

function renderToggle({ checked, label, hint, onChange }) {
  const input = el('input', { type: 'checkbox', checked, on: { change: () => onChange(input.checked) } });
  return el('label', { className: 'toggle' }, input, el('span', {}, el('b', { text: label }), el('small', { text: hint })));
}

function renderBackupPanel(context, { exportProgress, importProgress, resetProgress, status }) {
  const fileInput = el('input', {
    type: 'file',
    accept: 'application/json,.json',
    attrs: { 'aria-label': 'Import progress file' },
    on: { change: () => importProgress(fileInput.files[0]) },
  });
  return el(
    'section',
    { className: 'panel' },
    el('h2', { text: 'Export & import progress' }),
    el('p', { text: `${context.progress.count()} of ${context.data.trophies.length} trophies ticked in this browser.` }),
    el(
      'div',
      { className: 'backup-actions' },
      el('button', { type: 'button', className: 'button', text: 'Export to JSON file', on: { click: exportProgress } }),
      el('span', { className: 'button button-quiet file-button' }, 'Import a file…', fileInput),
      el('button', { type: 'button', className: 'button button-quiet', text: 'Reset', on: { click: resetProgress } }),
    ),
    status && el('p', { className: `status-message${status.isError ? ' is-error' : ''}`, text: status.text }),
    el('div', { className: 'backup-format', text: describeBackupFormat(context) }),
  );
}

function describeBackupFormat(context) {
  const sample = context.progress.earnedIds().slice(0, 2).map((id) => `{ "id": ${id}, "name": "${context.data.byId.get(id).name}" }`);
  return `${BACKUP_FILENAME}\n{ "format": "leonida-platinum-guide/progress",\n  "earned": [ ${sample.join(', ') || '…'} ] }`;
}

// Covered trophies first, so the effect of the setting is visible at the top of the preview.
function renderSpoilerPreview(context) {
  const storyTrophies = context.data.trophies
    .filter((trophy) => trophy.kind === 'story')
    .sort((a, b) => Number(context.isMasked(b)) - Number(context.isMasked(a)) || a.id - b.id)
    .slice(0, 8);
  return el(
    'section',
    { className: 'panel' },
    el('h2', { text: 'Preview: story trophies as the checklist shows them' }),
    el(
      'ul',
      { className: 'trophy-list' },
      storyTrophies.map((trophy) =>
        renderTrophyRow(trophy, {
          earned: context.progress.isEarned(trophy.id),
          masked: context.isMasked(trophy),
          selected: false,
          onToggleEarned: (id, earned) => context.progress.setEarned(id, earned),
          onSelect: (id) => context.navigate(`#/checklist/${id}`),
        }),
      ),
    ),
  );
}
