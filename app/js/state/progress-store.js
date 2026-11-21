// Which trophies are earned, kept in localStorage and announced to subscribers on every change.

const PROGRESS_KEY = 'leonida-platinum-guide/earned-v1';

export function createProgressStore(validIds) {
  let earned = new Set(readEarnedIds().filter((id) => validIds.has(id)));
  const listeners = new Set();

  function commit() {
    writeEarnedIds([...earned]);
    for (const listener of listeners) listener();
  }

  return {
    isEarned: (id) => earned.has(id),
    earnedIds: () => [...earned].sort((a, b) => a - b),
    count: () => earned.size,
    setEarned(id, isEarned) {
      if (isEarned) earned.add(id);
      else earned.delete(id);
      commit();
    },
    toggleEarned(id) {
      this.setEarned(id, !earned.has(id));
    },
    replaceEarned(ids) {
      earned = new Set(ids.filter((id) => validIds.has(id)));
      commit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function readEarnedIds() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(Number.isInteger) : [];
  } catch {
    return [];
  }
}

function writeEarnedIds(ids) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(ids));
  } catch {
    // Private windows can refuse storage; progress then lasts for this tab only.
  }
}
