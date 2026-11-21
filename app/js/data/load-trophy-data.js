// Loads app/data/trophies.json (a local file, never the network) and indexes it for the views.

export async function loadTrophyData(url = 'data/trophies.json') {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not read ${url} (${response.status})`);
  return indexTrophyData(await response.json());
}

export function indexTrophyData(raw) {
  const trophies = Array.isArray(raw) ? raw : raw.trophies;
  const byId = new Map(trophies.map((trophy) => [trophy.id, trophy]));
  const sourcesById = new Map((raw.sourceIndex ?? []).map((source) => [source.id, source]));
  return {
    trophies,
    byId,
    sourcesById,
    stages: raw.stages ?? [],
    timeline: raw.timeline ?? [],
    missableContent: raw.missableContent ?? [],
    researched: raw.researched ?? '',
  };
}

export function trophiesInStage(data, stageId) {
  return data.trophies.filter((trophy) => trophy.stage === stageId);
}
