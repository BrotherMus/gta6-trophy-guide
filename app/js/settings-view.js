// The Spoilers & backup tab: spoiler shield modes with a live preview, export/import/reset, and the source list.
import { h, externalLink, shortHost } from './dom.js';
import { gradeBadge } from './badges.js';
import { SPOILER_MODES, countShielded, visibleName, visibleDescription } from './spoiler-shield.js';
import { buildBackup, downloadBackup, readBackupFile } from './backup-file.js';

let lastBackupMessage = '';

export function renderSettingsView(root, ctx) {
  root.replaceChildren(
    h('div', { class: 'settings-grid' },
      renderSpoilerCard(ctx),
      h('div', { class: 'settings-side' }, renderBackupCard(ctx), renderSourcesCard(ctx))),
  );
}

function renderSpoilerCard(ctx) {
  const mode = ctx.state.progress.spoiler;
  const preview = ctx.data.trophies.filter((trophy) => trophy.kind === 'story').slice(0, 5);
  return h('section', { class: 'settings-card', id: 'spoiler-settings' },
    h('h2', { class: 'view-title' }, 'Spoiler shield'),
    h('p', { class: 'settings-lead' }, 'Hide names and descriptions of story trophies until you earn them. Earned trophies always show in full.'),
    h('div', { class: 'mode-options', role: 'radiogroup', 'aria-label': 'Spoiler shield mode' },
      SPOILER_MODES.map((option) => h('label', { class: `mode-option${mode === option.id ? ' is-active' : ''}` },
        h('input', { type: 'radio', name: 'spoiler', value: option.id, checked: mode === option.id, onChange: () => ctx.setSpoilerMode(option.id) }),
        h('span', { class: 'mode-label' }, option.label),
        h('span', { class: 'mode-hint' }, option.hint)))),
    h('p', { class: 'shield-count' }, h('strong', null, countShielded(ctx.data.trophies, ctx.state)), ' trophies are shielded right now.'),
    h('h3', { class: 'guide-heading' }, 'Preview: the first story trophies'),
    h('ul', { class: 'preview-list' }, preview.map((trophy) =>
      h('li', { class: `preview-row${ctx.state.progress.earned[trophy.id] ? ' is-earned' : ''}` },
        h('span', { class: 'preview-text' },
          h('strong', null, visibleName(trophy, ctx.state)),
          h('span', null, visibleDescription(trophy, ctx.state))),
        ctx.state.progress.earned[trophy.id] ? h('span', { class: 'preview-earned' }, '✓ earned') : null,
        gradeBadge(trophy.grade)))));
}

function renderBackupCard(ctx) {
  const earnedCount = Object.keys(ctx.state.progress.earned).length;
  const fileInput = h('input', {
    type: 'file', accept: 'application/json,.json', id: 'import-file', class: 'visually-hidden',
    onChange: async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const result = await readBackupFile(ctx.data, file);
        lastBackupMessage = `Imported ${result.matched} earned trophies from ${file.name}${result.ignored ? ` (${result.ignored} unknown entries skipped)` : ''}.`;
        ctx.replaceProgress({ ...result.progress, spoiler: result.progress.spoiler ?? ctx.state.progress.spoiler });
      } catch (error) {
        lastBackupMessage = `Import failed: ${error.message}`;
        ctx.rerender();
      }
    },
  });
  return h('section', { class: 'settings-card', id: 'backup-settings' },
    h('h2', { class: 'view-title' }, 'Backup & restore'),
    h('p', { class: 'settings-lead' }, `Progress lives in this browser (localStorage): ${earnedCount} earned, ${Object.keys(ctx.state.progress.counts).length} counters. Export a file to move it or keep it safe.`),
    h('div', { class: 'backup-actions' },
      h('button', { type: 'button', class: 'button', id: 'export-button', onClick: () => { downloadBackup(ctx.data, ctx.state); lastBackupMessage = 'Backup file saved to your downloads.'; ctx.rerender(); } }, '⇩ Export progress (.json)'),
      h('label', { class: 'button button-ghost', for: 'import-file' }, '⇧ Import progress'),
      fileInput,
      h('button', { type: 'button', class: 'button button-danger', onClick: () => { if (confirm('Clear all saved progress in this browser?')) { lastBackupMessage = 'Progress cleared.'; ctx.replaceProgress({ spoiler: ctx.state.progress.spoiler }); } } }, 'Reset')),
    h('p', { class: 'backup-status', role: 'status' }, lastBackupMessage || 'Import accepts this app\'s backups and plain lists of trophy names.'),
    h('pre', { class: 'backup-preview', 'aria-label': 'Backup file preview' }, backupPreviewText(ctx)));
}

/** The first lines of the file Export would write, so the format is visible before saving. */
function backupPreviewText(ctx) {
  const { earned, counts, ...header } = buildBackup(ctx.data, ctx.state);
  const headerLines = Object.entries(header).map(([key, value]) => `  "${key}": ${JSON.stringify(value)},`);
  const earnedLines = earned.slice(0, 4).map((entry) => `    ${JSON.stringify(entry)},`);
  const more = earned.length > 4 ? [`    … ${earned.length - 4} more`] : [];
  return ['{', ...headerLines, '  "earned": [', ...earnedLines, ...more, '  ],', `  "counts": ${JSON.stringify(counts)}`, '}'].join('\n');
}

function renderSourcesCard(ctx) {
  return h('section', { class: 'settings-card', id: 'source-index' },
    h('h2', { class: 'view-title' }, 'Sources cited in this guide'),
    h('p', { class: 'settings-lead' }, 'Every guide is written in our own words and names its sources beside it. Links open only when you click them; the app itself loads nothing from the web.'),
    h('ul', { class: 'source-index' }, (ctx.data.sources ?? []).map((source) => h('li', null,
      externalLink(source.url, source.name, 'source-name'),
      h('span', { class: 'source-for' }, source.page),
      h('span', { class: 'source-host' }, shortHost(source.url))))));
}
