// The spoiler setting: hides names and descriptions of unearned story (or all PSN-hidden) trophies.

export const SPOILER_MODES = [
  { id: 'off', label: 'Off', hint: 'Show every official name and description.' },
  { id: 'story', label: 'Story trophies', hint: 'Hide the 12 story trophies until you earn them.' },
  { id: 'hidden', label: 'All PSN-hidden', hint: 'Hide all 28 trophies PlayStation keeps secret until earned.' },
];

export function isShielded(trophy, state) {
  if (state.progress.earned[trophy.id] || state.revealed.has(trophy.id)) return false;
  const mode = state.progress.spoiler;
  if (mode === 'story') return trophy.kind === 'story';
  if (mode === 'hidden') return Boolean(trophy.hidden);
  return false;
}

export function visibleName(trophy, state) {
  if (!isShielded(trophy, state)) return trophy.name;
  return trophy.kind === 'story' ? 'Hidden story trophy' : 'Hidden trophy';
}

export function visibleDescription(trophy, state) {
  if (!isShielded(trophy, state)) return trophy.description;
  return trophy.chapter ? `Spoiler shield on · unlocks in Chapter ${trophy.chapter}` : 'Spoiler shield on · earn it or reveal';
}

export function countShielded(trophies, state) {
  return trophies.filter((trophy) => isShielded(trophy, state)).length;
}
