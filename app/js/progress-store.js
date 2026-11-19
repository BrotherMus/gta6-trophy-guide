// Saved state in localStorage: earned trophies, per-trophy counters, the spoiler setting and the tracker's view.

const PROGRESS_KEY = 'leonida-trophy-log/progress';
const VIEW_KEY = 'leonida-trophy-log/view';

export const DEFAULT_VIEW = {
  filter: 'all',
  grade: 'all',
  search: '',
  sort: 'roadmap',
  hideEarned: false,
  selectedId: 28,
};

export function emptyProgress() {
  return { version: 1, earned: {}, counts: {}, spoiler: 'story' };
}

function readJson(key, fallback) {
  try {
    const text = localStorage.getItem(key);
    return text ? JSON.parse(text) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private window): the session still works, it just will not persist.
  }
}

export function loadSavedState() {
  const progress = { ...emptyProgress(), ...readJson(PROGRESS_KEY, {}) };
  return {
    progress,
    view: { ...DEFAULT_VIEW, ...readJson(VIEW_KEY, {}) },
    revealed: new Set(),
  };
}

export function saveProgress(state) {
  writeJson(PROGRESS_KEY, state.progress);
}

export function saveView(state) {
  const { search, ...view } = state.view;
  writeJson(VIEW_KEY, view);
}

export function isEarned(state, id) {
  return Boolean(state.progress.earned[id]);
}

/** Tick or untick a trophy; the date earned is kept for the backup file. */
export function setEarned(state, id, earned) {
  if (earned) state.progress.earned[id] = state.progress.earned[id] || new Date().toISOString().slice(0, 10);
  else delete state.progress.earned[id];
  saveProgress(state);
}

/** Store a counter (stunts, scans, money...) and tick the trophy once the target is reached. */
export function setCount(state, trophy, value) {
  const clamped = Math.max(0, Math.min(Number(value) || 0, trophy.count));
  if (clamped) state.progress.counts[trophy.id] = clamped;
  else delete state.progress.counts[trophy.id];
  if (clamped >= trophy.count) setEarned(state, trophy.id, true);
  saveProgress(state);
}

export function countFor(state, trophy) {
  if (isEarned(state, trophy.id)) return trophy.count;
  return state.progress.counts[trophy.id] ?? 0;
}

export function setSpoilerMode(state, mode) {
  state.progress.spoiler = mode;
  state.revealed.clear();
  saveProgress(state);
}

export function replaceProgress(state, progress) {
  state.progress = { ...emptyProgress(), ...progress };
  state.revealed.clear();
  saveProgress(state);
}
