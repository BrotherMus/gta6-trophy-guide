// The Tracker tab: filter bar, the checklist of all 55 trophies, and the selected trophy's guide beside it.
import { h } from './dom.js';
import { gradeBadge, kindTag, missableTag, hiddenTag, countPill } from './badges.js';
import { KIND_FILTERS, countMatching, filterTrophies } from './trophy-filters.js';
import { GRADE_ORDER, GRADE_LABELS, SORT_MODES } from './trophy-data.js';
import { isShielded, visibleName, visibleDescription } from './spoiler-shield.js';
import { renderGuidePanel } from './guide-panel.js';

/** Build the tracker's fixed parts once (so the search box keeps focus while typing). */
export function mountTrackerView(root, ctx) {
  const search = h('input', {
    class: 'search', type: 'search', id: 'trophy-search', placeholder: 'Search names, guides…', 'aria-label': 'Search trophies',
    value: ctx.state.view.search, onInput: (event) => ctx.updateView({ search: event.target.value }),
  });
  root.replaceChildren(
    h('div', { class: 'tracker-split' },
      h('section', { class: 'list-pane', 'aria-label': 'Trophy checklist' },
        h('div', { class: 'filter-bar', id: 'filter-bar' },
          h('div', { class: 'chips', id: 'kind-chips', role: 'group', 'aria-label': 'Filter by kind' }),
          h('div', { class: 'filter-tools' },
            renderGradeSelect(ctx),
            search,
            renderSortSelect(ctx),
            h('label', { class: 'toggle' },
              h('input', { type: 'checkbox', checked: ctx.state.view.hideEarned, onChange: (event) => ctx.updateView({ hideEarned: event.target.checked }) }),
              'Hide earned'))),
        h('p', { class: 'list-meta', id: 'list-meta' }),
        h('ol', { class: 'trophy-list', id: 'trophy-list' })),
      h('aside', { class: 'guide-panel', id: 'guide-panel', 'aria-label': 'Trophy guide' })),
  );
}

function renderGradeSelect(ctx) {
  return h('select', { class: 'select', id: 'grade-filter', 'aria-label': 'Filter by grade', onChange: (event) => ctx.updateView({ grade: event.target.value }) },
    h('option', { value: 'all' }, 'All grades'),
    GRADE_ORDER.map((grade) => h('option', { value: grade, selected: ctx.state.view.grade === grade }, GRADE_LABELS[grade])));
}

function renderSortSelect(ctx) {
  return h('select', { class: 'select', id: 'sort-mode', 'aria-label': 'Sort order', onChange: (event) => ctx.updateView({ sort: event.target.value }) },
    SORT_MODES.map((mode) => h('option', { value: mode.id, selected: ctx.state.view.sort === mode.id }, mode.label)));
}

function renderKindChips(root, ctx) {
  const chips = root.querySelector('#kind-chips');
  chips.replaceChildren(...KIND_FILTERS.map((filter) => {
    const count = countMatching(ctx.data.trophies, filter.id);
    return h('button', {
      type: 'button',
      class: `chip chip-${filter.id}${ctx.state.view.filter === filter.id ? ' is-active' : ''}`,
      'aria-pressed': String(ctx.state.view.filter === filter.id),
      title: filter.emptyNote ?? `${count} trophies`,
      disabled: count === 0,
      onClick: () => ctx.updateView({ filter: filter.id }),
    }, filter.label, h('span', { class: 'chip-count' }, count));
  }));
}

/** One checklist row: tick box, official name and description, grade badge and tags. */
export function renderTrophyRow(trophy, ctx) {
  const { state } = ctx;
  const earned = Boolean(state.progress.earned[trophy.id]);
  const shielded = isShielded(trophy, state);
  const selected = state.view.selectedId === trophy.id;
  return h('li', { class: `trophy-row${earned ? ' is-earned' : ''}${selected ? ' is-selected' : ''}${shielded ? ' is-shielded' : ''}`, dataset: { id: trophy.id } },
    h('input', {
      class: 'earned-box', type: 'checkbox', checked: earned, 'aria-label': `Earned: ${visibleName(trophy, state)}`,
      onChange: (event) => ctx.setEarned(trophy.id, event.target.checked),
    }),
    h('button', { type: 'button', class: 'row-main', onClick: () => ctx.updateView({ selectedId: trophy.id }) },
      h('span', { class: 'row-title' },
        h('span', { class: 'trophy-name' }, visibleName(trophy, state)),
        trophy.missable ? missableTag() : null,
        kindTag(trophy.kind),
        trophy.hidden ? hiddenTag() : null),
      h('span', { class: 'row-desc' },
        h('span', { class: 'trophy-desc' }, visibleDescription(trophy, state)),
        countPill(trophy, state))),
    gradeBadge(trophy.grade));
}

export function updateTrackerView(root, ctx) {
  renderKindChips(root, ctx);
  const list = filterTrophies(ctx.data, ctx.state);
  const activeFilter = KIND_FILTERS.find((f) => f.id === ctx.state.view.filter);
  root.querySelector('#list-meta').replaceChildren(
    h('strong', null, `${list.length}`), ` of ${ctx.data.trophies.length} trophies`,
    activeFilter && activeFilter.id !== 'all' ? ` · ${activeFilter.label}` : '',
    ' · tick a box to save progress in this browser');
  const rows = list.length
    ? list.map((trophy) => renderTrophyRow(trophy, ctx))
    : [h('li', { class: 'empty-row' }, activeFilter?.emptyNote ?? 'No trophy matches these filters.')];
  root.querySelector('#trophy-list').replaceChildren(...rows);
  const selected = ctx.data.byId.get(ctx.state.view.selectedId) ?? list[0];
  renderGuidePanel(root.querySelector('#guide-panel'), ctx, selected);
}
