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

/**
 * A stage's trophies in play order. The story stage follows the story timeline chapter by chapter; the free-roam
 * stages keep the official list order, with the platinum always last.
 */
export function trophiesInStage(data, stageId) {
  const inStage = data.trophies.filter((trophy) => trophy.stage === stageId);
  if (stageId === 1) {
    const storyPosition = storyOrderOf(data);
    const positionOf = (trophy) => storyPosition.get(trophy.id) ?? Infinity;
    return inStage.sort((a, b) => positionOf(a) - positionOf(b) || a.id - b.id);
  }
  const platinumLast = (trophy) => (trophy.grade === 'platinum' ? 1 : 0);
  return inStage.sort((a, b) => platinumLast(a) - platinumLast(b) || a.id - b.id);
}

function storyOrderOf(data) {
  const position = new Map();
  data.timeline.forEach((step, index) => {
    for (const id of step.trophies) if (!position.has(id)) position.set(id, index);
  });
  return position;
}

export function storyStepOf(data, trophyId) {
  return data.timeline.find((step) => step.trophies.includes(trophyId));
}
