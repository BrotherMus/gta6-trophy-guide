// Checklist view: filter bar, trophy rows with checkboxes, and the guide panel beside them.

import { createElement } from './dom.js';
import { countForKindFilter, filterTrophies, GRADE_FILTERS, KIND_FILTERS, STATUS_FILTERS } from './filters.js';
import { gradeBadge, renderGuidePanel } from './render-guide.js';
import { isSpoilerHidden, visibleDescription, visibleName } from './spoilers.js';
import { resolveSources } from './trophy-data.js';

function chip(label, pressed, onClick, count, extraClass = '') {
  return createElement(
    'button',
    { className: `chip ${extraClass}`, 'aria-pressed': String(pressed), onclick: onClick },
    label,
    count == null ? null : createElement('b', {}, count),
  );
}

function renderFilterBar(data, state, actions) {
  const kindChips = KIND_FILTERS.map((filter) =>
    chip(filter.label, state.kindFilter === filter.id, () => actions.setFilter({ kindFilter: filter.id }), countForKindFilter(data.trophies, filter.id), filter.id === 'missable' ? 'missable-chip' : ''),
  );
  const gradeSelect = createElement(
    'select',
    { className: 'chip', 'aria-label': 'Grade', onchange: (event) => actions.setFilter({ gradeFilter: event.target.value }) },
    GRADE_FILTERS.map((grade) => createElement('option', { value: grade, selected: state.gradeFilter === grade }, grade === 'any' ? 'Any grade' : grade[0].toUpperCase() + grade.slice(1))),
  );
  const statusSelect = createElement(
    'select',
    { className: 'chip', 'aria-label': 'Status', onchange: (event) => actions.setFilter({ statusFilter: event.target.value }) },
    STATUS_FILTERS.map((status) => createElement('option', { value: status, selected: state.statusFilter === status }, { all: 'All', todo: 'To do', earned: 'Earned' }[status])),
  );
  const search = createElement('input', {
    className: 'search-input', type: 'search', placeholder: 'Search names & descriptions', value: state.searchText, 'aria-label': 'Search',
    oninput: (event) => actions.setFilter({ searchText: event.target.value }, true),
  });
  return createElement('div', { className: 'filter-bar' }, kindChips, gradeSelect, statusSelect, search, createElement('span', { className: 'tag' }, 'Online: none in list'));
}

// "Ch 1 · Stage 2 · PowerPyx +1": where the trophy sits in the roadmap and which guides back its tips.
function rowMetaLine(trophy, data) {
  const sources = resolveSources(trophy, data.sources).map((source) => source.name.split(' – ')[0]);
  const cited = sources.length > 1 ? `${sources[0]} +${sources.length - 1}` : sources[0] ?? 'no source';
  return [trophy.chapter ? `Ch ${trophy.chapter}` : null, `Stage ${trophy.stage}`, `Cited: ${cited}`].filter(Boolean).join(' · ');
}

function renderTrophyRow(trophy, data, state, actions) {
  const earned = state.earned.has(trophy.id);
  const checkbox = createElement('input', {
    type: 'checkbox', className: 'earn-box', checked: earned, 'aria-label': `Earned: ${visibleName(trophy, state)}`,
    onclick: (event) => { event.stopPropagation(); actions.toggleEarned(trophy.id); },
  });
  return createElement(
    'li',
    { className: `trophy-row${earned ? ' earned' : ''}${state.selectedId === trophy.id ? ' selected' : ''}`, onclick: () => actions.selectTrophy(trophy.id) },
    checkbox,
    createElement('div', {}, createElement('div', { className: 'trophy-name' }, visibleName(trophy, state)), createElement('div', { className: 'trophy-desc' }, visibleDescription(trophy, state))),
    createElement(
      'div',
      { className: 'trophy-side' },
      createElement(
        'div',
        { className: 'trophy-tags' },
        trophy.missable ? createElement('span', { className: 'tag missable' }, 'Missable') : null,
        isSpoilerHidden(trophy, state) ? createElement('span', { className: 'tag spoiler' }, 'Spoiler') : null,
        gradeBadge(trophy.grade),
      ),
      createElement('div', { className: 'trophy-meta' }, rowMetaLine(trophy, data)),
    ),
  );
}

export function renderTrackerView(data, state, actions) {
  const visible = filterTrophies(data.trophies, state);
  const list = visible.length
    ? createElement('ul', { className: 'trophy-list' }, visible.map((trophy) => renderTrophyRow(trophy, data, state, actions)))
    : createElement('p', { className: 'list-empty' }, 'No trophy matches these filters.');
  return createElement(
    'div',
    { className: 'tracker-layout' },
    createElement('section', {}, renderFilterBar(data, state, actions), createElement('div', { className: 'panel' }, list)),
    renderGuidePanel(data.byId.get(state.selectedId), data, state),
  );
}
