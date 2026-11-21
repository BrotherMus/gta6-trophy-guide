// The checklist screen: filters and the trophy list on the left, the selected trophy's cited guide on the right.
import { el, replaceContent } from '../ui/dom.js';
import { filterTrophies } from '../logic/trophy-filters.js';
import { createFilterBar } from './filter-bar.js';
import { renderTrophyRow } from './trophy-row.js';
import { renderGuidePanel } from './guide-panel.js';

export function mountChecklistView(root, context, initialTrophyId) {
  let selectedId = initialTrophyId ?? context.data.trophies[0].id;
  const filterBar = createFilterBar(context);
  const listNote = el('p', { className: 'list-note' });
  const list = el('ul', { className: 'trophy-list', attrs: { 'aria-label': 'Trophies' } });
  const guideColumn = el('aside', { className: 'guide-column' });

  replaceContent(
    root,
    el(
      'div',
      { className: 'checklist-layout' },
      el('section', { className: 'checklist-column', attrs: { 'aria-label': 'Checklist' } }, filterBar.element, listNote, list),
      guideColumn,
    ),
  );

  function renderTrophyList() {
    const preferences = context.preferences.get();
    const visible = filterTrophies(context.data.trophies, preferences, {
      isEarned: context.progress.isEarned,
      isMasked: context.isMasked,
    });
    const onlineCount = context.data.trophies.filter((trophy) => trophy.kind === 'online').length;
    listNote.textContent = `Showing ${visible.length} of ${context.data.trophies.length} · official PS5 names, descriptions and grades · ${onlineCount === 0 ? 'no online trophies on this list' : `${onlineCount} online`}`;
    replaceContent(
      list,
      visible.length === 0
        ? el('li', { className: 'empty-list', text: 'No trophy matches these filters.' })
        : visible.map((trophy) =>
            renderTrophyRow(trophy, {
              earned: context.progress.isEarned(trophy.id),
              masked: context.isMasked(trophy),
              selected: trophy.id === selectedId,
              onToggleEarned: (id, earned) => context.progress.setEarned(id, earned),
              onSelect: (id) => context.navigate(`#/checklist/${id}`),
            }),
          ),
    );
  }

  function renderSelectedGuide() {
    renderGuidePanel(guideColumn, context.data.byId.get(selectedId), context);
  }

  function refresh() {
    filterBar.refresh();
    renderTrophyList();
    renderSelectedGuide();
  }

  refresh();

  return {
    refresh,
    select(trophyId) {
      if (trophyId === undefined || trophyId === selectedId) return;
      selectedId = trophyId;
      renderTrophyList();
      renderSelectedGuide();
    },
  };
}
