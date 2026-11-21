// Roadmap view: the four stages to the platinum, each listing its trophies in play order.

import { createElement } from './dom.js';
import { visibleName } from './spoilers.js';

export function sortByPlayOrder(trophies) {
  return [...trophies].sort((a, b) => (a.chapter ?? 9) - (b.chapter ?? 9) || (a.order ?? 99) - (b.order ?? 99) || a.id - b.id);
}

function stageEntry(trophy, state, actions) {
  return createElement(
    'li',
    { className: state.earned.has(trophy.id) ? 'earned' : '', onclick: () => actions.openTrophy(trophy.id), style: 'cursor:pointer' },
    createElement('span', { className: `dot ${trophy.grade}` }),
    createElement('span', {}, visibleName(trophy, state)),
    trophy.missable ? createElement('span', { className: 'flag', title: 'Missable' }, '!') : null,
    createElement('span', { className: 'where' }, trophy.chapter ? `Ch ${trophy.chapter}` : ''),
  );
}

function stageCard(stage, data, state, actions) {
  const trophies = sortByPlayOrder(data.trophies.filter((trophy) => trophy.stage === stage.id));
  const earned = trophies.filter((trophy) => state.earned.has(trophy.id)).length;
  const share = trophies.length ? Math.round((earned / trophies.length) * 100) : 0;
  return createElement(
    'section',
    { className: 'panel stage-card' },
    createElement('div', { className: 'stage-num' }, `Stage ${stage.id} · ${stage.hours}`),
    createElement('h2', {}, stage.title),
    createElement('p', { className: 'stage-summary' }, stage.summary),
    createElement('div', { className: 'stage-progress' }, `${earned} / ${trophies.length} trophies`),
    createElement('div', { className: 'bar' }, createElement('span', { style: `width:${share}%` })),
    createElement('ul', { className: 'stage-list' }, trophies.map((trophy) => stageEntry(trophy, state, actions))),
  );
}

export function renderRoadmapView(data, state, actions) {
  return createElement(
    'div',
    {},
    createElement('p', { className: 'view-intro' }, 'One playthrough, ~200 h (PowerPyx). ! marks the one missable. Ch = chapter it opens in. Click a trophy for its guide.'),
    createElement('div', { className: 'stage-grid' }, data.stages.map((stage) => stageCard(stage, data, state, actions))),
  );
}
