// Kind filters (story, missable, collectibles, activities...), grade filter, search and hide-earned.
import { isShielded } from './spoiler-shield.js';
import { sortTrophies } from './trophy-data.js';

export const KIND_FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'story', label: 'Story', test: (t) => t.kind === 'story' },
  { id: 'missable', label: 'Missable', test: (t) => t.missable },
  { id: 'collectible', label: 'Collectibles', test: (t) => t.kind === 'collectible' },
  { id: 'activity', label: 'Activities', test: (t) => t.kind === 'activity' },
  { id: 'side', label: 'Side strands', test: (t) => t.kind === 'side' },
  { id: 'crime', label: 'Crime', test: (t) => t.kind === 'crime' },
  { id: 'online', label: 'Online', test: (t) => t.kind === 'online', emptyNote: 'The official list has no online trophies.' },
];

export function countMatching(trophies, filterId) {
  const filter = KIND_FILTERS.find((f) => f.id === filterId) ?? KIND_FILTERS[0];
  return trophies.filter(filter.test).length;
}

function matchesSearch(trophy, state, query) {
  if (!query) return true;
  const visible = isShielded(trophy, state) ? [] : [trophy.name, trophy.description, trophy.guide, trophy.when];
  return visible.join(' ').toLowerCase().includes(query);
}

/** The tracker's list: kind filter, grade, search text, hide-earned, then the chosen sort order. */
export function filterTrophies(data, state) {
  const { filter, grade, search, hideEarned, sort } = state.view;
  const kind = KIND_FILTERS.find((f) => f.id === filter) ?? KIND_FILTERS[0];
  const query = search.trim().toLowerCase();
  const matches = data.trophies.filter((trophy) =>
    kind.test(trophy) &&
    (grade === 'all' || trophy.grade === grade) &&
    !(hideEarned && state.progress.earned[trophy.id]) &&
    matchesSearch(trophy, state, query));
  return sortTrophies(matches, sort);
}
