// Missables view: a chapter timeline from the data, the one missable flagged, and counts read from official descriptions.

import { createElement } from './dom.js';
import { sortByPlayOrder } from './render-roadmap.js';
import { visibleName } from './spoilers.js';
import { KIND_LABELS } from './trophy-data.js';

const CHAPTERS = [1, 2, 3, 4, 5];

function chapterItem(trophy, state, actions) {
  return createElement(
    'div',
    { className: `chapter-item${trophy.missable ? ' is-missable' : ''}`, onclick: () => actions.openTrophy(trophy.id), style: 'cursor:pointer' },
    createElement('span', { className: 'kind' }, trophy.missable ? 'Missable · do now' : trophy.kind === 'story' ? 'Story · automatic' : `${KIND_LABELS[trophy.kind]} · unlocks here`),
    `${state.earned.has(trophy.id) ? '✓ ' : ''}${visibleName(trophy, state)}`,
  );
}

// Reads the number a trophy asks for straight from its official description ("Complete 250 Stunts.").
export function countFromDescription(description) {
  const match = description.match(/\$?([\d,]+)\s*([A-Za-z][^.]*)?/);
  if (!match) return null;
  return { amount: match[0].startsWith('$') ? `$${match[1]}` : match[1], what: description.replace(/\.$/, '') };
}

function countsTable(data, state) {
  const rows = data.trophies
    .filter((trophy) => trophy.kind !== 'story' && /\d/.test(trophy.description))
    .map((trophy) => ({ trophy, count: countFromDescription(trophy.description) }))
    .filter((row) => row.count);
  return createElement(
    'table',
    { className: 'counts-table' },
    createElement('thead', {}, createElement('tr', {}, createElement('th', {}, 'Count'), createElement('th', {}, 'Trophy'), createElement('th', {}, 'Official requirement'), createElement('th', {}, 'Stage'))),
    createElement(
      'tbody',
      {},
      rows.map(({ trophy, count }) =>
        createElement('tr', {}, createElement('td', { className: 'count' }, count.amount), createElement('td', {}, visibleName(trophy, state)), createElement('td', {}, count.what), createElement('td', {}, `Stage ${trophy.stage}`)),
      ),
    ),
  );
}

export function renderMissablesView(data, state, actions) {
  const missables = data.trophies.filter((trophy) => trophy.missable);
  const columns = CHAPTERS.map((chapter) => {
    const inChapter = sortByPlayOrder(data.trophies.filter((trophy) => trophy.chapter === chapter));
    return createElement('section', { className: 'panel chapter-col' }, createElement('h2', {}, `Chapter ${chapter}`), inChapter.map((trophy) => chapterItem(trophy, state, actions)));
  });
  return createElement(
    'div',
    {},
    createElement(
      'section',
      { className: 'panel missable-callout' },
      createElement('h2', {}, `${missables.length} potentially missable trophy`),
      missables.map((trophy) => createElement('p', { style: 'margin:0' }, createElement('b', {}, `${trophy.name}: `), trophy.missableNote, ' Everything else can be finished in free roam after the story (PowerPyx, KeenGamer).')),
    ),
    createElement('div', { className: 'timeline' }, columns),
    createElement('section', { className: 'panel', style: 'padding:10px' }, countsTable(data, state)),
  );
}
