// Filter chips (story, missable, collectibles, activities…), grade and status selects, and the search box.
import { el, replaceContent } from '../ui/dom.js';
import { GRADE_FILTERS, STATUS_FILTERS, countTrophiesOfKind, visibleKindFilters } from '../logic/trophy-filters.js';

const STATUS_LABEL = { all: 'Any status', unearned: 'Not earned', earned: 'Earned' };

export function createFilterBar(context) {
  const { data, preferences } = context;
  const chipRow = el('div', { className: 'filter-bar', attrs: { role: 'toolbar', 'aria-label': 'Filter by kind' } });

  const gradeSelect = el(
    'select',
    { attrs: { 'aria-label': 'Grade' }, on: { change: () => preferences.update({ gradeFilter: gradeSelect.value }) } },
    GRADE_FILTERS.map((grade) => el('option', { value: grade, text: grade === 'all' ? 'All grades' : capitalize(grade) })),
  );
  const statusSelect = el(
    'select',
    { attrs: { 'aria-label': 'Status' }, on: { change: () => preferences.update({ statusFilter: statusSelect.value }) } },
    STATUS_FILTERS.map((status) => el('option', { value: status, text: STATUS_LABEL[status] })),
  );
  const searchBox = el('input', {
    type: 'search',
    placeholder: 'Search names, descriptions, guides…',
    attrs: { 'aria-label': 'Search trophies' },
    on: { input: () => preferences.update({ searchText: searchBox.value }) },
  });

  const chipList = el('div', { className: 'filter-chips' });
  chipRow.append(chipList, el('div', { className: 'filter-controls' }, gradeSelect, statusSelect, searchBox));

  function renderChips() {
    const current = preferences.get();
    gradeSelect.value = current.gradeFilter;
    statusSelect.value = current.statusFilter;
    if (searchBox.value !== current.searchText) searchBox.value = current.searchText;
    replaceContent(
      chipList,
      visibleKindFilters(data.trophies).map((filter) =>
        el(
          'button',
          {
            type: 'button',
            className: `chip chip-${filter.id}`,
            attrs: { 'aria-pressed': String(current.kindFilter === filter.id) },
            on: { click: () => preferences.update({ kindFilter: filter.id }) },
          },
          filter.label,
          el('span', { className: 'chip-count', text: String(countTrophiesOfKind(data.trophies, filter.id)) }),
        ),
      ),
    );
  }

  renderChips();
  return { element: chipRow, refresh: renderChips };
}

function capitalize(word) {
  return word[0].toUpperCase() + word.slice(1);
}
