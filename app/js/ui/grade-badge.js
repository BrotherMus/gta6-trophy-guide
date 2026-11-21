// Grade badges (round medal with a letter), grade dots and progress meters, drawn in CSS – no images.
import { el } from './dom.js';

const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };

export function renderGradeBadge(grade) {
  return el('span', {
    className: `grade-badge grade-${grade}`,
    text: GRADE_LETTER[grade] ?? '?',
    attrs: { title: `${grade} trophy`, 'aria-label': `${grade} trophy` },
  });
}

export function renderGradeDot(grade) {
  return el('span', { className: `grade-dot grade-${grade}`, attrs: { title: grade, 'aria-hidden': 'true' } });
}

export function renderGradeWord(grade) {
  return el('span', { className: `grade-word grade-${grade}`, text: grade });
}

export function renderMeter({ label, earned, total, className = '' }) {
  const percent = total === 0 ? 0 : Math.round((earned / total) * 100);
  return el(
    'div',
    { className: `meter ${className}` },
    el('div', { className: 'meter-label' }, el('span', { text: label }), el('strong', { text: `${earned}/${total}` })),
    el(
      'div',
      { className: 'meter-track', attrs: { role: 'progressbar', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(earned), 'aria-label': label } },
      el('div', { className: 'meter-fill', style: `width:${percent}%` }),
    ),
  );
}
