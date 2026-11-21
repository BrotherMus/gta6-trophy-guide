// Spoiler protection: story trophies (and optionally every hidden one) keep their name and description covered until earned.

export function isTrophyMasked(trophy, preferences, isEarned, revealedIds) {
  if (isEarned(trophy.id) || revealedIds.has(trophy.id)) return false;
  if (preferences.hideStorySpoilers && trophy.kind === 'story') return true;
  if (preferences.hideAllHiddenTrophies && trophy.hidden) return true;
  return false;
}

export function maskedTrophyName(trophy) {
  return trophy.kind === 'story' ? 'Story trophy – spoiler hidden' : 'Hidden trophy – spoiler hidden';
}

export function maskedTrophyDescription() {
  return 'Covered until earned – tick it or open it and press Reveal.';
}

export function countMaskedTrophies(trophies, preferences, isEarned) {
  const none = new Set();
  return trophies.filter((trophy) => isTrophyMasked(trophy, preferences, isEarned, none)).length;
}
