// The Missables tab: the missable trophy and its window, run-safety warnings, then one row per story chapter
// with its missions in order and the trophies that chapter earns or opens.
import { h } from './dom.js';
import { gradeBadge, gradeDot } from './badges.js';
import { sourceNames } from './trophy-data.js';
import { visibleName } from './spoiler-shield.js';
import { renderSourceList } from './guide-panel.js';

export function renderMissablesView(root, ctx) {
  const missables = ctx.data.trophies.filter((trophy) => trophy.missable);
  root.replaceChildren(
    h('h2', { class: 'view-title' }, `Missable trophies: ${missables.length} of ${ctx.data.trophies.length}`,
      h('span', { class: 'title-note' }, ' · everything else stays open after the final mission')),
    h('section', { class: 'missable-cards', id: 'missable-cards' }, missables.map((trophy) => renderMissableCard(ctx, trophy))),
    renderWarningStrip(ctx),
    h('h2', { class: 'view-title timeline-title' }, 'Chapter by chapter: missions in order, and the trophies each one earns or opens'),
    h('div', { class: 'chapter-timeline', id: 'chapter-timeline' },
      ctx.data.chapters.map((chapter) => renderChapterRow(ctx, chapter)),
      renderAnyTimeRow(ctx)),
  );
}

function renderMissableCard(ctx, trophy) {
  const earned = Boolean(ctx.state.progress.earned[trophy.id]);
  return h('article', { class: `missable-card${earned ? ' is-earned' : ''}` },
    h('div', { class: 'missable-main' },
      h('header', { class: 'missable-head' },
        gradeBadge(trophy.grade),
        h('h3', { class: 'missable-name' }, trophy.name),
        h('label', { class: 'toggle' },
          h('input', { type: 'checkbox', checked: earned, onChange: (event) => ctx.setEarned(trophy.id, event.target.checked) }), 'Earned')),
      h('p', { class: 'guide-official' }, h('span', { class: 'official-label' }, 'Official'), trophy.description),
      h('p', { class: 'missable-window' }, h('strong', null, `Window: Chapter ${trophy.chapter} only. `), trophy.missableNote),
      h('ol', { class: 'guide-steps' }, trophy.steps.map((step) => h('li', null, step)))),
    renderSourceList(ctx.data, trophy));
}

function renderWarningStrip(ctx) {
  return h('ul', { class: 'warning-strip', 'aria-label': 'Protect your run' },
    (ctx.data.summary?.warnings ?? []).map((warning) => h('li', null, h('span', { class: 'warning-icon', 'aria-hidden': 'true' }, '!'), warning)));
}

function renderChapterRow(ctx, chapter) {
  const trophies = ctx.data.trophies
    .filter((trophy) => trophy.chapter === chapter.chapter)
    .sort((a, b) => a.stage - b.stage || a.order - b.order);
  const hasMissable = trophies.some((trophy) => trophy.missable);
  return h('article', { class: `chapter-row${hasMissable ? ' has-missable' : ''}` },
    h('h3', { class: 'chapter-name' }, chapter.title),
    h('div', { class: 'chapter-plan' },
      h('ol', { class: 'mission-chain' }, chapter.missions.map((mission) => h('li', null, mission))),
      h('p', { class: 'chapter-watch' }, chapter.watch, h('span', { class: 'chapter-sources' }, ` (${sourceNames(ctx.data, chapter.sources).join(', ')})`))),
    h('ul', { class: 'chapter-trophies' }, trophies.map((trophy) => renderTimelineTrophy(ctx, trophy))));
}

function renderAnyTimeRow(ctx) {
  const anyTime = ctx.data.trophies.filter((trophy) => !trophy.chapter);
  return h('article', { class: 'chapter-row chapter-any' },
    h('h3', { class: 'chapter-name' }, 'Any time'),
    h('div', { class: 'chapter-plan' },
      h('p', { class: 'chapter-watch' }, `${anyTime.length} trophies with no chapter lock: roadmap stages 2 to 4.`)),
    h('ul', { class: 'chapter-trophies' }, anyTime.map((trophy) => renderTimelineTrophy(ctx, trophy))));
}

function renderTimelineTrophy(ctx, trophy) {
  const earned = Boolean(ctx.state.progress.earned[trophy.id]);
  return h('li', { class: `timeline-trophy${earned ? ' is-earned' : ''}${trophy.missable ? ' is-missable' : ''}` },
    gradeDot(trophy.grade),
    h('a', { href: '#tracker', onClick: () => ctx.updateView({ selectedId: trophy.id }) }, visibleName(trophy, ctx.state)),
    earned ? h('span', { class: 'mini-check', 'aria-label': 'earned' }, '✓') : null,
    trophy.missable ? h('span', { class: 'mini-flag' }, 'missable') : null);
}
