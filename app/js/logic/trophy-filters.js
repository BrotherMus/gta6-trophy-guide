// Which trophies the checklist shows: by kind (story, missable, collectibles, activities…), grade, status and search.

export const KIND_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'story', label: 'Story' },
  { id: 'missable', label: 'Missable' },
  { id: 'collectible', label: 'Collectibles' },
  { id: 'activity', label: 'Activities' },
  { id: 'side', label: 'Side missions' },
  { id: 'crime', label: 'Robberies' },
  { id: 'misc', label: 'Misc' },
  { id: 'online', label: 'Online', onlyWhenPresent: true },
];

export const GRADE_FILTERS = ['all', 'platinum', 'gold', 'silver', 'bronze'];
export const STATUS_FILTERS = ['all', 'unearned', 'earned'];

export function trophyMatchesKind(trophy, kind) {
  if (kind === 'all') return true;
  if (kind === 'missable') return trophy.missable === true;
  return trophy.kind === kind || (trophy.tags ?? []).includes(kind);
}

export function visibleKindFilters(trophies) {
  return KIND_FILTERS.filter((filter) => !filter.onlyWhenPresent || countTrophiesOfKind(trophies, filter.id) > 0);
}

export function countTrophiesOfKind(trophies, kind) {
  return trophies.filter((trophy) => trophyMatchesKind(trophy, kind)).length;
}

/** Search reads only what the reader may see: a spoiler-masked trophy matches on grade and stage text alone. */
export function trophyMatchesSearch(trophy, searchText, isMasked) {
  const query = searchText.trim().toLowerCase();
  if (!query) return true;
  const haystack = isMasked
    ? `${trophy.grade} stage ${trophy.stage}`
    : `${trophy.name} ${trophy.description} ${trophy.grade} ${trophy.unlock ?? ''} ${trophy.guide}`;
  return haystack.toLowerCase().includes(query);
}

export function filterTrophies(trophies, preferences, { isEarned, isMasked }) {
  return trophies.filter((trophy) => {
    if (!trophyMatchesKind(trophy, preferences.kindFilter)) return false;
    if (preferences.gradeFilter !== 'all' && trophy.grade !== preferences.gradeFilter) return false;
    if (preferences.statusFilter === 'earned' && !isEarned(trophy.id)) return false;
    if (preferences.statusFilter === 'unearned' && isEarned(trophy.id)) return false;
    return trophyMatchesSearch(trophy, preferences.searchText, isMasked(trophy));
  });
}
