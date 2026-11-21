// Export progress to a JSON file and read one back (ours, or a plain list of ids or names).

export const BACKUP_FORMAT = 'leonida-platinum-guide/progress';
export const BACKUP_FILENAME = 'gta6-trophy-progress.json';

export function buildBackup(data, earnedIds) {
  return {
    format: BACKUP_FORMAT,
    version: 1,
    game: 'Grand Theft Auto VI (PS5)',
    exportedAt: new Date().toISOString(),
    earnedCount: earnedIds.length,
    earned: earnedIds.map((id) => ({ id, name: data.byId.get(id)?.name ?? '' })),
  };
}

export function downloadBackup(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = BACKUP_FILENAME;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Returns the earned trophy ids found in a backup's text, or throws an Error explaining why it can't be read. */
export function readBackupText(text, data) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('That file is not JSON.');
  }
  const entries = Array.isArray(parsed) ? parsed : parsed?.earned;
  if (!Array.isArray(entries)) throw new Error('No "earned" list found in that file.');
  const idsByName = new Map(data.trophies.map((trophy) => [normalizeName(trophy.name), trophy.id]));
  const ids = new Set();
  for (const entry of entries) {
    const id = resolveEntryId(entry, data, idsByName);
    if (id !== undefined) ids.add(id);
  }
  return [...ids];
}

function resolveEntryId(entry, data, idsByName) {
  if (Number.isInteger(entry) && data.byId.has(entry)) return entry;
  if (typeof entry === 'string') return idsByName.get(normalizeName(entry));
  if (entry && typeof entry === 'object') {
    if (Number.isInteger(entry.id) && data.byId.has(entry.id)) return entry.id;
    if (typeof entry.name === 'string') return idsByName.get(normalizeName(entry.name));
  }
  return undefined;
}

function normalizeName(name) {
  return name.toLowerCase().replace(/[’‘]/g, "'").replace(/…/g, '...').replace(/\s+/g, ' ').trim();
}
