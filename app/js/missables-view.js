// The Missables tab: the missable trophy with its window, then a chapter-by-chapter checklist of what opens when.
import { h } from './dom.js';
import { gradeBadge, gradeDot } from './badges.js';
import { sourceNames } from './trophy-data.js';
import { visibleName } from './spoiler-shield.js';
import { renderSourceList } from './guide-panel.js';

export function renderMissablesView(root, ctx) {
  const missables = ctx.data.trophies.filter((trophy) => trophy.missable);
  root.replaceChildren(
    h('div', { class: 'missables-top' },
      h('section', { class: 'missable-cards', id: 'missable-cards' },
        h('h2', { class: 'view-title' }, `Missable trophies: ${missables.length} of ${ctx.data.trophies.length}`),
        missables.map((trophy) => renderMissableCard(ctx, trophy))),
      renderWarnings(ctx)),
    h('h2', { class: 'view-title timeline-title' }, 'Chapter by chapter: missions, windows and the trophies they open'),
    h('div', { class: 'chapter-timeline', id: 'chapter-timeline' },
      ctx.data.chapters.map((chapter) => renderChapterColumn(ctx, chapter)),
      renderAnyTimeColumn(ctx)),
  );
}

function renderMissableCard(ctx, trophy) {
  const earned = Boolean(ctx.state.progress.earned[trophy.id]);
  return h('article', { class: `missable-card${earned ? ' is-earned' : ''}` },
    h('header', { class: 'missable-head' },
      gradeBadge(trophy.grade),
      h('h3', { class: 'missable-name' }, trophy.name),
      h('label', { class: 'toggle' },
        h('input', { type: 'checkbox', checked: earned, onChange: (event) => ctx.setEarned(trophy.id, event.target.checked) }), 'Earned')),
    h('p', { class: 'guide-official' }, h('span', { class: 'official-label' }, 'Official'), trophy.description),
    h('p', { class: 'missable-window' }, h('strong', null, `Window: Chapter ${trophy.chapter} only. `), trophy.missableNote),
    h('ol', { class: 'guide-steps' }, trophy.steps.map((step) => h('li', null, step))),
    renderSourceList(ctx.data, trophy));
}

function renderWarnings(ctx) {
  return h('section', { class: 'warning-card' },
    h('h3', { class: 'warning-title' }, 'Not missable, but protect your run'),
    h('ul', { class: 'warning-list' }, (ctx.data.summary?.warnings ?? []).map((warning) => h('li', null, warning))),
    h('p', { class: 'warning-note' }, 'Every other trophy stays available after the final mission: free roam continues and late-opening strands such as Kenton\'s return later.'));
}

function renderChapterColumn(ctx, chapter) {
  const trophies = ctx.data.trophies
    .filter((trophy) => trophy.chapter === chapter.chapter)
    .sort((a, b) => a.stage - b.stage || a.order - b.order);
  return h('article', { class: 'chapter-column' },
    h('h3', { class: 'chapter-name' }, chapter.title),
    h('ol', { class: 'mission-list' }, chapter.missions.map((mission) => h('li', null, mission))),
    h('p', { class: `chapter-watch${trophies.some((t) => t.missable) ? ' has-missable' : ''}` }, chapter.watch),
    h('ul', { class: 'chapter-trophies' }, trophies.map((trophy) => renderTimelineTrophy(ctx, trophy))),
    h('p', { class: 'stage-sources' }, 'Per ', sourceNames(ctx.data, chapter.sources).join(', ')));
}

function renderAnyTimeColumn(ctx) {
  const anyTime = ctx.data.trophies.filter((trophy) => !trophy.chapter);
  return h('article', { class: 'chapter-column chapter-any' },
    h('h3', { class: 'chapter-name' }, 'Any time / free roam'),
    h('p', { class: 'chapter-watch' }, `${anyTime.length} trophies with no chapter lock: do them in roadmap stages 2 to 4.`),
    h('ul', { class: 'chapter-trophies' }, anyTime.map((trophy) => renderTimelineTrophy(ctx, trophy))));
}

function renderTimelineTrophy(ctx, trophy) {
  const earned = Boolean(ctx.state.progress.earned[trophy.id]);
  return h('li', { class: `timeline-trophy${earned ? ' is-earned' : ''}${trophy.missable ? ' is-missable' : ''}` },
    gradeDot(trophy.grade),
    h('a', { href: '#tracker', onClick: () => ctx.updateView({ selectedId: trophy.id }) }, visibleName(trophy, ctx.state)),
    trophy.missable ? h('span', { class: 'mini-flag' }, 'missable') : null);
}
