// Small labelled chips: grade badge, kind tag, missable flag, PSN-hidden flag, method confidence, counters.
import { h } from './dom.js';
import { GRADE_LABELS, KIND_LABELS, formatTarget } from './trophy-data.js';
import { countFor } from './progress-store.js';

export function gradeBadge(grade, size = '') {
  return h('span', { class: `grade grade-${grade} ${size}`, title: `${GRADE_LABELS[grade]} trophy` }, GRADE_LABELS[grade]);
}

export function gradeDot(grade) {
  return h('span', { class: `grade-dot grade-${grade}`, title: GRADE_LABELS[grade] });
}

export function kindTag(kind) {
  return h('span', { class: `tag tag-${kind}` }, KIND_LABELS[kind] ?? kind);
}

export function missableTag() {
  return h('span', { class: 'tag tag-missable', title: 'Can be missed: see the Missables view' }, '⚠ Missable');
}

export function hiddenTag() {
  return h('span', { class: 'tag tag-hidden', title: 'Hidden on PlayStation until earned' }, 'PSN hidden');
}

export function stageTag(stage) {
  return h('span', { class: 'tag tag-stage', title: `Roadmap stage ${stage}` }, `Stage ${stage}`);
}

const CONFIDENCE_TEXT = {
  confirmed: 'Method confirmed by guides',
  partial: 'Partly confirmed',
  unconfirmed: 'Method not confirmed yet',
};

export function confidenceTag(confidence) {
  return h('span', { class: `tag tag-${confidence}`, title: CONFIDENCE_TEXT[confidence] }, CONFIDENCE_TEXT[confidence]);
}

/** "12 / 18" with a thin bar, for trophies that count something. */
export function countPill(trophy, state) {
  if (!trophy.count) return null;
  const done = countFor(state, trophy);
  const percent = Math.round((done / trophy.count) * 100);
  return h('span', { class: 'count-pill', title: `${formatTarget(trophy, done)} of ${formatTarget(trophy)}` },
    h('span', { class: 'count-text' }, `${formatTarget(trophy, done)} / ${formatTarget(trophy)}`),
    h('span', { class: 'count-bar' }, h('span', { style: `width:${percent}%` })));
}
