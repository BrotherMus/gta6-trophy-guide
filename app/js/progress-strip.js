// The progress bar row under the header: overall, then one bar per grade.
import { h, meter } from './dom.js';
import { GRADE_ORDER, GRADE_LABELS } from './trophy-data.js';

export function summarizeProgress(trophies, state) {
  const earned = (list) => list.filter((trophy) => state.progress.earned[trophy.id]).length;
  const byGrade = GRADE_ORDER.map((grade) => {
    const list = trophies.filter((trophy) => trophy.grade === grade);
    return { grade, done: earned(list), total: list.length };
  });
  return { done: earned(trophies), total: trophies.length, byGrade };
}

export function renderProgressStrip(root, data, state) {
  const summary = summarizeProgress(data.trophies, state);
  const percent = Math.round((summary.done / summary.total) * 100);
  root.replaceChildren(
    h('div', { class: 'progress-overall' },
      h('span', { class: 'progress-label' }, 'Overall'),
      h('strong', { class: 'progress-number' }, `${summary.done}`, h('small', null, ` / ${summary.total}`)),
      h('span', { class: 'progress-percent' }, `${percent}%`),
      meter(summary.done, summary.total, 'meter-overall')),
    ...summary.byGrade.map(({ grade, done, total }) =>
      h('div', { class: `progress-grade progress-${grade}` },
        h('span', { class: 'progress-label' }, h('span', { class: `grade-dot grade-${grade}` }), GRADE_LABELS[grade]),
        h('strong', { class: 'progress-number' }, `${done}`, h('small', null, ` / ${total}`)),
        meter(done, total, `meter-${grade}`))),
  );
}
