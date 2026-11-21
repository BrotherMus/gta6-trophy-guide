// Checklist filters: kind chips, grade chips, earned state and text search.

import { visibleDescription, visibleName } from './spoilers.js';

export const KIND_FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'story', label: 'Story', test: (t) => t.kind === 'story' },
  { id: 'missable', label: 'Missable', test: (t) => t.missable === true },
  { id: 'collectibles', label: 'Collectibles', test: (t) => t.kind === 'collectibles' },
  { id: 'activities', label: 'Activities', test: (t) => t.kind === 'activities' },
  { id: 'side', label: 'Side quests', test: (t) => t.kind === 'side' },
  { id: 'crime', label: 'Heists & crime', test: (t) => t.kind === 'crime' },
  { id: 'misc', label: 'Misc', test: (t) => t.kind === 'misc' || t.kind === 'completion' },
];

export const GRADE_FILTERS = ['any', 'platinum', 'gold', 'silver', 'bronze'];

export const STATUS_FILTERS = ['all', 'todo', 'earned'];

export function filterTrophies(trophies, state) {
  const kind = KIND_FILTERS.find((filter) => filter.id === state.kindFilter) ?? KIND_FILTERS[0];
  const query = state.searchText.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (!kind.test(trophy)) return false;
    if (state.gradeFilter !== 'any' && trophy.grade !== state.gradeFilter) return false;
    if (state.statusFilter === 'todo' && state.earned.has(trophy.id)) return false;
    if (state.statusFilter === 'earned' && !state.earned.has(trophy.id)) return false;
    if (!query) return true;
    const haystack = `${visibleName(trophy, state)} ${visibleDescription(trophy, state)}`.toLowerCase();
    return haystack.includes(query);
  });
}

export function countForKindFilter(trophies, filterId) {
  const filter = KIND_FILTERS.find((candidate) => candidate.id === filterId);
  return trophies.filter(filter.test).length;
}
