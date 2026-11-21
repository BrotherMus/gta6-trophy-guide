// Spoiler settings and checklist filters, remembered between visits.

const PREFERENCES_KEY = 'leonida-platinum-guide/preferences-v1';

export const DEFAULT_PREFERENCES = Object.freeze({
  hideStorySpoilers: false,
  hideAllHiddenTrophies: false,
  kindFilter: 'all',
  gradeFilter: 'all',
  statusFilter: 'all',
  searchText: '',
});

export function createPreferencesStore() {
  let preferences = { ...DEFAULT_PREFERENCES, ...readPreferences() };
  const listeners = new Set();

  return {
    get: () => preferences,
    update(patch) {
      preferences = { ...preferences, ...patch };
      writePreferences(preferences);
      for (const listener of listeners) listener(patch);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function readPreferences() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFERENCES_KEY) ?? '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writePreferences(preferences) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // Storage refused: settings last for this tab only.
  }
}
