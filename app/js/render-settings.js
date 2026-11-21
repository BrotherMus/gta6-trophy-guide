// Spoilers & backup view: the story spoiler toggle with a live preview, export, import and reset.

import { createElement } from './dom.js';
import { KIND_FILTERS } from './filters.js';
import { visibleDescription, visibleName } from './spoilers.js';

function spoilerCard(data, state, actions) {
  const preview = data.trophies.filter((trophy) => trophy.kind === 'story').slice(0, 9);
  return createElement(
    'section',
    { className: 'panel settings-card' },
    createElement('h2', {}, 'Story spoilers'),
    createElement('p', {}, 'When on, the names and descriptions of story trophies stay hidden until you mark them earned. Guides for hidden trophies stay closed too.'),
    createElement(
      'label',
      { className: 'toggle' },
      createElement('input', { type: 'checkbox', checked: state.hideStorySpoilers, onchange: (event) => actions.setSpoilers(event.target.checked) }),
      'Hide story trophies until earned',
    ),
    createElement('ul', { className: 'preview-list' }, preview.map((trophy) => createElement('li', {}, createElement('b', {}, visibleName(trophy, state)), ' — ', visibleDescription(trophy, state)))),
  );
}

function backupCard(state, actions) {
  const fileInput = createElement('input', {
    type: 'file', accept: 'application/json,.json', className: 'visually-hidden', id: 'import-file',
    onchange: (event) => event.target.files[0] && actions.importFile(event.target.files[0]),
  });
  return createElement(
    'section',
    { className: 'panel settings-card' },
    createElement('h2', {}, 'Backup: export & import'),
    createElement('p', {}, `Progress is saved in this browser automatically (${state.earned.size} trophies earned). Export it to a JSON file to keep a copy or move it to another browser, then import it back.`),
    createElement('button', { className: 'btn', onclick: actions.exportFile }, 'Export progress (.json)'),
    createElement('button', { className: 'btn secondary', onclick: () => fileInput.click() }, 'Import from file…'),
    createElement('button', { className: 'btn secondary', onclick: actions.resetAll }, 'Reset'),
    fileInput,
    createElement('p', { className: 'status-line', role: 'status' }, state.statusMessage ?? ''),
    createElement('h3', { className: 'preview-head' }, 'What the export file holds'),
    createElement('pre', { className: 'export-preview' }, exportPreviewText(state)),
    createElement('p', {}, 'Import accepts this file from any browser; unknown trophy ids are ignored and the platinum is recomputed from the other 54.'),
  );
}

function exportPreviewText(state) {
  const earned = [...state.earned].sort((a, b) => a - b);
  return JSON.stringify({ format: 'leonida-platinum-tracker/progress', earned: '__EARNED__', hideStorySpoilers: state.hideStorySpoilers }, null, 2)
    .replace('"__EARNED__"', `[${earned.join(', ')}]`);
}

// Earned / total for every checklist filter, so a restored backup can be checked at a glance.
function progressByKindCard(data, state) {
  const rows = KIND_FILTERS.filter((filter) => filter.id !== 'all').map((filter) => {
    const matching = data.trophies.filter(filter.test);
    const earned = matching.filter((trophy) => state.earned.has(trophy.id)).length;
    return createElement(
      'div',
      { className: 'kind-progress' },
      createElement('div', { className: 'grade-bar-label' }, createElement('span', {}, filter.label), createElement('span', {}, `${earned}/${matching.length}`)),
      createElement('div', { className: 'bar' }, createElement('span', { style: `width:${matching.length ? Math.round((earned / matching.length) * 100) : 0}%` })),
    );
  });
  return createElement('section', { className: 'panel settings-card wide' }, createElement('h2', {}, 'Saved progress by filter'), createElement('div', { className: 'kind-progress-grid' }, rows));
}

export function renderSettingsView(data, state, actions) {
  return createElement('div', { className: 'settings-grid' }, spoilerCard(data, state, actions), backupCard(state, actions), progressByKindCard(data, state));
}
