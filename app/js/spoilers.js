// Spoiler setting: story trophies keep their name and description hidden until earned.

export function isSpoilerHidden(trophy, state) {
  return state.hideStorySpoilers && trophy.kind === 'story' && !state.earned.has(trophy.id);
}

export function visibleName(trophy, state) {
  if (!isSpoilerHidden(trophy, state)) return trophy.name;
  return trophy.chapter ? `Story trophy · Chapter ${trophy.chapter}` : 'Story trophy';
}

export function visibleDescription(trophy, state) {
  return isSpoilerHidden(trophy, state) ? 'Hidden until earned (spoiler setting on).' : trophy.description;
}
