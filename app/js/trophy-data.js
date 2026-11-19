// Loads app/data/trophies.json and indexes it: trophies by id, sources by id, sort orders and labels.

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

export const KIND_LABELS = {
  platinum: 'Platinum',
  story: 'Story',
  side: 'Side strand',
  collectible: 'Collectible',
  activity: 'Activity',
  crime: 'Crime & chaos',
  misc: 'Misc',
};

export const SORT_MODES = [
  { id: 'roadmap', label: 'Roadmap order' },
  { id: 'list', label: 'PlayStation order' },
  { id: 'grade', label: 'Grade' },
  { id: 'name', label: 'Name A–Z' },
];

/** Fetch the trophy file that ships beside the app (same origin, no network beyond it). */
export async function loadTrophyData(url = 'data/trophies.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not read ${url} (${response.status})`);
  return indexTrophyData(await response.json());
}

/** Accept the {trophies:[...]} object or a bare array; add lookup maps. */
export function indexTrophyData(raw) {
  const trophies = Array.isArray(raw) ? raw : raw.trophies;
  const base = Array.isArray(raw) ? {} : raw;
  return {
    ...base,
    trophies,
    stages: base.stages ?? [],
    chapters: base.chapters ?? [],
    byId: new Map(trophies.map((trophy) => [trophy.id, trophy])),
    sourceById: new Map((base.sources ?? []).map((source) => [source.id, source])),
  };
}

/** A trophy's cited sources with name, page title, link and what each one backs up. */
export function resolveSources(data, trophy) {
  return (trophy.sources ?? [])
    .map((ref) => ({ ...data.sourceById.get(ref.id), for: ref.for }))
    .filter((source) => source.url);
}

/** Names of the sources behind a stage or chapter, for a compact "per X, Y" line. */
export function sourceNames(data, ids = []) {
  return ids.map((id) => data.sourceById.get(id)?.name).filter(Boolean);
}

export function sortTrophies(trophies, mode) {
  const list = [...trophies];
  const byRoadmap = (a, b) => a.stage - b.stage || a.order - b.order;
  if (mode === 'list') return list.sort((a, b) => a.id - b.id);
  if (mode === 'grade') return list.sort((a, b) => GRADE_ORDER.indexOf(a.grade) - GRADE_ORDER.indexOf(b.grade) || a.id - b.id);
  if (mode === 'name') return list.sort((a, b) => a.name.localeCompare(b.name));
  return list.sort(byRoadmap);
}

/** "18", "250", or "$250,000" for money targets. */
export function formatTarget(trophy, value = trophy.count) {
  const number = Number(value ?? 0).toLocaleString('en-US');
  return trophy.unit === 'usd' ? `$${number}` : number;
}

export function chapterLabel(chapter) {
  return chapter ? `Chapter ${chapter}` : 'Any time';
}
