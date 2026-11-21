// Guide panel: official text, our guide, steps and the named, linked sources beside it.

import { createElement } from './dom.js';
import { isSpoilerHidden, visibleDescription, visibleName } from './spoilers.js';
import { KIND_LABELS, resolveSources } from './trophy-data.js';

export function gradeBadge(grade) {
  return createElement('span', { className: `grade-badge ${grade}` }, grade);
}

function stageLabel(trophy, data) {
  const stage = data.stages.find((candidate) => candidate.id === trophy.stage);
  return stage ? `Stage ${stage.id}: ${stage.title}` : null;
}

function sourceList(trophy, data) {
  const sources = resolveSources(trophy, data.sources);
  return createElement(
    'section',
    { className: 'guide-sources' },
    createElement('h3', {}, `Sources (${sources.length})`),
    createElement(
      'ul',
      {},
      sources.map((source) =>
        createElement(
          'li',
          {},
          createElement('a', { href: source.url, target: '_blank', rel: 'noopener noreferrer' }, source.name),
          createElement('span', { className: 'source-url' }, source.url.replace(/^https:\/\/(www\.)?/, '')),
        ),
      ),
    ),
  );
}

export function renderGuidePanel(trophy, data, state) {
  if (!trophy) return createElement('aside', { className: 'panel guide-panel' }, 'Pick a trophy to read its guide.');
  const hidden = isSpoilerHidden(trophy, state);
  const meta = createElement(
    'div',
    { className: 'guide-meta' },
    gradeBadge(trophy.grade),
    createElement('span', { className: 'tag' }, KIND_LABELS[trophy.kind] ?? trophy.kind),
    trophy.chapter ? createElement('span', { className: 'tag' }, `Chapter ${trophy.chapter}`) : null,
    stageLabel(trophy, data) ? createElement('span', { className: 'tag' }, stageLabel(trophy, data)) : null,
    trophy.missable ? createElement('span', { className: 'tag missable' }, 'Missable') : null,
  );
  const body = hidden
    ? [createElement('p', { className: 'guide-text' }, 'This story trophy is hidden by the spoiler setting. Mark it earned, or turn spoilers off under Spoilers & backup, to read its guide.')]
    : [
        trophy.missableNote ? createElement('div', { className: 'missable-note' }, trophy.missableNote) : null,
        createElement('p', { className: 'guide-text' }, trophy.guide),
        createElement('ol', { className: 'guide-steps' }, (trophy.steps ?? []).map((step) => createElement('li', {}, step))),
      ];
  return createElement(
    'aside',
    { className: 'panel guide-panel', 'aria-live': 'polite' },
    createElement('div', { className: 'guide-head' }, createElement('h2', {}, visibleName(trophy, state))),
    createElement('p', { className: 'guide-official' }, 'Official: ', createElement('q', {}, visibleDescription(trophy, state))),
    meta,
    body,
    sourceList(trophy, data),
  );
}
