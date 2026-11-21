// Spoilers & backup view: the story spoiler toggle with a live preview, export, import and reset.

import { createElement } from './dom.js';
import { visibleDescription, visibleName } from './spoilers.js';

function spoilerCard(data, state, actions) {
  const preview = data.trophies.filter((trophy) => trophy.kind === 'story').slice(0, 6);
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
    createElement('p', {}, 'File format: { "format": "leonida-platinum-tracker/progress", "earned": [trophy ids], "hideStorySpoilers": true }'),
  );
}

export function renderSettingsView(data, state, actions) {
  return createElement('div', { className: 'settings-grid' }, spoilerCard(data, state, actions), backupCard(state, actions));
}
