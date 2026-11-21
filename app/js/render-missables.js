// Missables view: a chapter timeline from the data, the one missable flagged, and counts read from official descriptions.

import { createElement } from './dom.js';
import { sortByPlayOrder } from './render-roadmap.js';
import { visibleName } from './spoilers.js';
const CHAPTERS = [1, 2, 3, 4, 5];

// One-word labels so each timeline entry stays on a single line.
const SHORT_KIND = { story: 'story', side: 'side', collectibles: 'collect', activities: 'activity', crime: 'heist', misc: 'misc', completion: '100%' };

function chapterItem(trophy, state, actions) {
  return createElement(
    'div',
    { className: `chapter-item${trophy.missable ? ' is-missable' : ''}`, onclick: () => actions.openTrophy(trophy.id), style: 'cursor:pointer' },
    `${state.earned.has(trophy.id) ? '✓ ' : ''}${visibleName(trophy, state)}`,
    createElement('span', { className: `kind kind-${trophy.kind}` }, trophy.missable ? 'MISSABLE' : SHORT_KIND[trophy.kind]),
  );
}

// Reads the number a trophy asks for straight from its official description ("Complete 250 Stunts.").
export function countFromDescription(description) {
  const match = description.match(/(\$?)([\d,]+)(%?)/);
  if (!match) return null;
  return { amount: `${match[1]}${match[2]}${match[3]}`, what: description.replace(/\.$/, '') };
}

function countCards(data, state) {
  const rows = data.trophies
    .filter((trophy) => trophy.kind !== 'story' && /\d/.test(trophy.description))
    .map((trophy) => ({ trophy, count: countFromDescription(trophy.description) }))
    .filter((row) => row.count);
  return createElement(
    'section',
    { className: 'panel counts-panel' },
    createElement('h2', {}, 'Collectibles & counts, read from the official descriptions'),
    createElement(
      'div',
      { className: 'count-grid' },
      rows.map(({ trophy, count }) =>
        createElement(
          'div',
          { className: `count-card${state.earned.has(trophy.id) ? ' earned' : ''}`, title: count.what },
          createElement('span', { className: 'count' }, count.amount),
          createElement('span', {}, createElement('b', {}, visibleName(trophy, state)), createElement('small', {}, ` S${trophy.stage}`)),
        ),
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
      createElement('h2', {}, `${missables.length} potentially missable trophy · chapter-by-chapter unlock timeline`),
      missables.map((trophy) => createElement('p', { style: 'margin:0' }, createElement('b', {}, `${trophy.name}: `), trophy.missableNote, ' Everything else can be finished in free roam after the story (PowerPyx, KeenGamer).')),
    ),
    createElement('div', { className: 'timeline' }, columns),
    countCards(data, state),
  );
}
