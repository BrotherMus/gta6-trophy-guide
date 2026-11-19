// Export progress to a JSON file and import it back (also accepts the starter's plain list of names).

const APP_ID = 'leonida-trophy-log';

export function buildBackup(data, state) {
  return {
    app: APP_ID,
    version: 1,
    game: data.game,
    exportedAt: new Date().toISOString(),
    spoiler: state.progress.spoiler,
    earned: data.trophies
      .filter((trophy) => state.progress.earned[trophy.id])
      .map((trophy) => ({ id: trophy.id, name: trophy.name, date: state.progress.earned[trophy.id] })),
    counts: state.progress.counts,
  };
}

/** Save the backup as a .json download; nothing leaves the browser. */
export function downloadBackup(data, state) {
  const blob = new Blob([JSON.stringify(buildBackup(data, state), null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `leonida-trophy-log-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

const normalizeName = (name) => String(name).toLowerCase().replace(/[‘’]/g, "'").replace(/…/g, '...').replace(/\s+/g, ' ').trim();

/** Turn a backup's contents into progress; unknown entries are counted, never guessed. */
export function parseBackup(data, json) {
  const byName = new Map(data.trophies.map((trophy) => [normalizeName(trophy.name), trophy]));
  const entries = Array.isArray(json) ? json : json?.earned;
  if (!Array.isArray(entries)) throw new Error('This file is not a trophy backup.');
  const earned = {};
  let ignored = 0;
  for (const entry of entries) {
    const trophy = typeof entry === 'object' && entry !== null
      ? data.byId.get(entry.id) ?? byName.get(normalizeName(entry.name ?? ''))
      : data.byId.get(entry) ?? byName.get(normalizeName(entry));
    if (trophy) earned[trophy.id] = (typeof entry === 'object' && entry.date) || true;
    else ignored += 1;
  }
  const counts = {};
  for (const [id, value] of Object.entries(json?.counts ?? {})) {
    if (data.byId.has(Number(id)) && Number(value) > 0) counts[id] = Number(value);
  }
  const spoiler = ['off', 'story', 'hidden'].includes(json?.spoiler) ? json.spoiler : undefined;
  return { progress: { earned, counts, ...(spoiler ? { spoiler } : {}) }, matched: Object.keys(earned).length, ignored };
}

export async function readBackupFile(data, file) {
  return parseBackup(data, JSON.parse(await file.text()));
}
