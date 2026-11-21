// Loads app/data/trophies.json (a file of this app, never the network) and indexes it.

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const KIND_LABELS = {
  story: 'Story',
  side: 'Side quests',
  collectibles: 'Collectibles',
  activities: 'Activities',
  crime: 'Heists & crime',
  misc: 'Misc & stunts',
  completion: 'Completion',
};

export async function loadTrophyData() {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`trophies.json: HTTP ${response.status}`);
  const data = await response.json();
  const trophies = Array.isArray(data) ? data : data.trophies;
  return {
    trophies,
    stages: data.stages ?? [],
    sources: data.sources ?? {},
    totals: data.totals ?? countByGrade(trophies),
    byId: new Map(trophies.map((trophy) => [trophy.id, trophy])),
  };
}

export function countByGrade(trophies) {
  const totals = Object.fromEntries(GRADE_ORDER.map((grade) => [grade, 0]));
  for (const trophy of trophies) totals[trophy.grade] += 1;
  return totals;
}

export function resolveSources(trophy, sourceIndex) {
  return (trophy.sources ?? []).map((key) => (typeof key === 'string' ? sourceIndex[key] : key)).filter(Boolean);
}
