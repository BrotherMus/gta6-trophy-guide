// Header progress: overall count and one bar per grade.

import { createElement, replaceContent } from './dom.js';
import { GRADE_ORDER } from './trophy-data.js';

function percent(part, whole) {
  return whole ? Math.round((part / whole) * 100) : 0;
}

function progressBar(value) {
  return createElement('div', { className: 'bar' }, createElement('span', { style: `width:${value}%` }));
}

export function renderProgressSummary(container, data, state) {
  const earnedCount = data.trophies.filter((trophy) => state.earned.has(trophy.id)).length;
  const overall = createElement(
    'div',
    { className: 'overall' },
    createElement('div', { className: 'overall-num' }, `${earnedCount}`, createElement('small', {}, ` / ${data.trophies.length} · ${percent(earnedCount, data.trophies.length)}%`)),
    progressBar(percent(earnedCount, data.trophies.length)),
  );
  const gradeBars = GRADE_ORDER.map((grade) => {
    const ofGrade = data.trophies.filter((trophy) => trophy.grade === grade);
    const earned = ofGrade.filter((trophy) => state.earned.has(trophy.id)).length;
    return createElement(
      'div',
      { className: `grade-bar ${grade}` },
      createElement('div', { className: 'grade-bar-label' }, createElement('span', {}, grade[0].toUpperCase() + grade.slice(1)), createElement('span', {}, `${earned}/${ofGrade.length}`)),
      progressBar(percent(earned, ofGrade.length)),
    );
  });
  replaceContent(container, overall, createElement('div', { className: 'grade-bars' }, gradeBars));
}
