// Missables: the one potentially missable trophy, the story order of trophy unlocks, and what can be missed safely.
import { el, replaceContent } from '../ui/dom.js';
import { renderSourceLine, renderSourceList } from '../ui/source-links.js';
import { maskedTrophyName } from '../logic/spoiler-rules.js';

export function mountMissablesView(root, context) {
  function refresh() {
    const missable = context.data.trophies.filter((trophy) => trophy.missable);
    replaceContent(
      root,
      el(
        'div',
        { className: 'view-intro' },
        el('h1', { text: `Missables: ${missable.length} trophy, 1 step to watch` }),
        el('p', { text: 'No mission replay, but free roam continues after the story. Only one trophy step can be lost – everything else returns later.' }),
      ),
      el(
        'div',
        { className: 'missables-layout' },
        el('div', {}, missable.map((trophy) => renderMissableHero(trophy, context)), renderSafeToMiss(context), renderSaveAdvice(context)),
        el('div', {}, renderStoryTimeline(context)),
      ),
    );
  }
  refresh();
  return { refresh };
}

function renderMissableHero(trophy, context) {
  const earned = context.progress.isEarned(trophy.id);
  return el(
    'section',
    { className: 'panel missable-hero' },
    el('h2', { text: `⚠ ${trophy.name} ${earned ? '– earned ✓' : ''}` }),
    el('p', { className: 'guide-official', text: `“${trophy.description}” · Bronze · ${trophy.count} spots` }),
    el('p', { className: 'missable-alert', text: trophy.missableNote }),
    el('ol', { className: 'guide-steps' }, trophy.steps.map((step) => el('li', { text: step }))),
    el('h3', { className: 'guide-section-title', text: 'Sources' }),
    renderSourceList(trophy.sources.slice(0, 2)),
  );
}

function renderStoryTimeline(context) {
  const rows = [];
  let currentChapter = '';
  for (const step of context.data.timeline) {
    if (step.chapter !== currentChapter) {
      currentChapter = step.chapter;
      rows.push(el('li', { className: 'timeline-chapter', text: currentChapter }));
    }
    rows.push(
      el(
        'li',
        { className: `timeline-step${step.missable ? ' is-missable' : ''}` },
        el('span', { className: 'timeline-mission', text: step.mission }),
        el('span', { text: step.unlocks }),
        el('span', { className: 'timeline-trophies', text: step.trophies.map((id) => trophyLabel(id, context)).join(', ') }),
      ),
    );
  }
  return el(
    'section',
    { className: 'panel' },
    el('h2', { text: 'Story order: which mission opens which trophy' }),
    el('ol', { className: 'timeline' }, rows),
    renderSourceLine(['powerpyx'], context.data.sourcesById),
  );
}

function trophyLabel(trophyId, context) {
  const trophy = context.data.byId.get(trophyId);
  const name = context.isMasked(trophy) ? maskedTrophyName(trophy) : trophy.name;
  return context.progress.isEarned(trophyId) ? `${name} ✓` : name;
}

function renderSafeToMiss(context) {
  return el(
    'section',
    { className: 'panel' },
    el('h2', { text: 'Can be missed – costs no trophy' }),
    el(
      'ul',
      { className: 'safe-list' },
      context.data.missableContent.map((item) => el('li', {}, item.what, el('span', { text: item.trophyImpact }))),
    ),
    renderSourceLine(['powerpyx'], context.data.sourcesById),
  );
}

function renderSaveAdvice(context) {
  return el(
    'section',
    { className: 'panel' },
    el('h2', { text: 'Save plan' }),
    el(
      'ul',
      { className: 'safe-list' },
      el('li', { text: '15 manual slots + 1 autosave: keep one save at the start and end of each of the 5 chapters.' }),
      el('li', { text: 'Rotate the other 5 slots during free-roam cleanup.' }),
      el('li', { text: 'Cheats disable trophies and saving for that session.' }),
    ),
    renderSourceLine(['powerpyx', 'keengamer'], context.data.sourcesById),
  );
}
