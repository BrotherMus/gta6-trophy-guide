// The guide beside the checklist: one trophy's official text, our guide, its steps and the sources it cites.
import { el, replaceContent } from '../ui/dom.js';
import { renderGradeBadge, renderGradeWord } from '../ui/grade-badge.js';
import { renderSourceList } from '../ui/source-links.js';

export function renderGuidePanel(root, trophy, context) {
  if (!trophy) {
    replaceContent(root, el('div', { className: 'guide-panel' }, el('p', { text: 'Pick a trophy to read its guide.' })));
    return;
  }
  const earned = context.progress.isEarned(trophy.id);
  const masked = context.isMasked(trophy);
  replaceContent(
    root,
    el(
      'article',
      { className: 'guide-panel', attrs: { 'aria-label': 'Trophy guide' } },
      renderGuideHeader(trophy, masked),
      renderGuideFacts(trophy, masked),
      masked ? renderSpoilerCover(trophy, context) : renderGuideBody(trophy),
      renderEarnedControl(trophy, earned, context),
    ),
  );
}

function renderGuideHeader(trophy, masked) {
  return el(
    'header',
    { className: 'guide-head' },
    renderGradeBadge(trophy.grade),
    el(
      'div',
      {},
      el('h2', { className: 'guide-title', text: masked ? 'Spoiler hidden' : trophy.name }),
      el('p', { className: 'guide-official', text: masked ? 'Story details are covered until you earn it.' : `“${trophy.description}”` }),
    ),
  );
}

function renderGuideFacts(trophy, masked) {
  return el(
    'p',
    { className: 'guide-facts' },
    el('span', {}, el('b', { text: 'Grade ' }), renderGradeWord(trophy.grade)),
    el('span', {}, el('b', { text: 'Stage ' }), String(trophy.stage)),
    trophy.count && el('span', {}, el('b', { text: 'Target ' }), trophy.count.toLocaleString('en-US')),
    el('span', {}, el('b', { text: 'PSN ' }), trophy.hidden ? 'hidden' : 'visible'),
    !masked && trophy.unlock && el('span', {}, el('b', { text: 'When ' }), trophy.unlock),
  );
}

// Sources sit right under the guide text so the citation is always in view next to the claims it backs.
function renderGuideBody(trophy) {
  return [
    trophy.missable && el('p', { className: 'missable-alert', text: `⚠ ${trophy.missableNote}` }),
    el('h3', { className: 'guide-section-title', text: 'Guide' }),
    el('p', { className: 'guide-text', text: trophy.guide }),
    el('h3', { className: 'guide-section-title', text: `Cited sources (${trophy.sources.length})` }),
    renderSourceList(trophy.sources),
    trophy.steps?.length > 0 && el('h3', { className: 'guide-section-title', text: 'Steps' }),
    trophy.steps?.length > 0 && el('ol', { className: 'guide-steps' }, trophy.steps.map((step) => el('li', { text: step }))),
  ];
}

function renderSpoilerCover(trophy, context) {
  return el(
    'div',
    { className: 'spoiler-cover' },
    el('p', { text: 'Spoiler protection is on for this trophy.' }),
    el('button', {
      type: 'button',
      className: 'button',
      text: 'Reveal this one',
      on: { click: () => context.revealTrophy(trophy.id) },
    }),
  );
}

function renderEarnedControl(trophy, earned, context) {
  return el(
    'div',
    { className: 'guide-earn' },
    el('span', { text: earned ? '✓ Earned – saved in this browser' : 'Not earned yet' }),
    el('button', {
      type: 'button',
      className: earned ? 'button button-quiet' : 'button',
      text: earned ? 'Mark as not earned' : 'Mark as earned',
      on: { click: () => context.progress.setEarned(trophy.id, !earned) },
    }),
  );
}
