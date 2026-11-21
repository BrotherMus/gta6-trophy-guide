// Saved progress and preferences in localStorage, plus export to / import from a JSON file.

const STORAGE_KEY = 'leonida-platinum-tracker.v1';
const EXPORT_FORMAT = 'leonida-platinum-tracker/progress';

export function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return {
      earned: new Set(Array.isArray(saved.earned) ? saved.earned : []),
      hideStorySpoilers: saved.hideStorySpoilers !== false,
    };
  } catch {
    return { earned: new Set(), hideStorySpoilers: true };
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(state)));
  } catch {
    // Private windows may refuse storage; the tracker still works for this visit.
  }
}

function serializeState(state) {
  return { earned: [...state.earned].sort((a, b) => a - b), hideStorySpoilers: state.hideStorySpoilers };
}

export function toggleEarned(state, trophyId) {
  if (state.earned.has(trophyId)) state.earned.delete(trophyId);
  else state.earned.add(trophyId);
  syncPlatinum(state);
  saveState(state);
}

// The platinum follows the other 54: it is earned exactly when they all are.
function syncPlatinum(state) {
  const others = state.trophyIds.filter((id) => id !== state.platinumId);
  if (others.every((id) => state.earned.has(id))) state.earned.add(state.platinumId);
  else state.earned.delete(state.platinumId);
}

export function downloadProgressFile(state) {
  const payload = { format: EXPORT_FORMAT, exportedAt: new Date().toISOString(), ...serializeState(state) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export async function importProgressFile(state, file) {
  const parsed = JSON.parse(await file.text());
  if (!parsed || !Array.isArray(parsed.earned)) throw new Error('This file has no "earned" list.');
  const known = new Set(state.trophyIds);
  const earned = parsed.earned.filter((id) => known.has(id));
  state.earned = new Set(earned);
  if (typeof parsed.hideStorySpoilers === 'boolean') state.hideStorySpoilers = parsed.hideStorySpoilers;
  syncPlatinum(state);
  saveState(state);
  return earned.length;
}

export function resetProgress(state) {
  state.earned = new Set();
  saveState(state);
}
