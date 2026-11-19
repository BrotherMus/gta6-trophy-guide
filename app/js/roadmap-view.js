// The Roadmap tab: four stages to the platinum, stage 1 split by story chapter, each trophy in play order.
import { h, meter } from './dom.js';
import { gradeDot } from './badges.js';
import { sourceNames } from './trophy-data.js';
import { visibleName } from './spoiler-shield.js';

export function renderRoadmapView(root, ctx) {
  root.replaceChildren(
    renderRoadmapFacts(ctx),
    h('div', { class: 'stage-grid', id: 'stage-grid' }, ctx.data.stages.map((stage) => renderStageCard(ctx, stage))),
  );
}

/** The at-a-glance numbers: difficulty, hours, playthroughs, missables, online, with their sources. */
export function renderRoadmapFacts(ctx) {
  const summary = ctx.data.summary ?? {};
  return h('section', { class: 'roadmap-facts', id: 'roadmap-facts' },
    h('div', { class: 'roadmap-heading' },
      h('h2', { class: 'view-title' }, 'Roadmap to ', h('em', null, 'Vice Got a Price!')),
      h('p', { class: 'stage-sources' }, '4 stages, in play order · figures per ', sourceNames(ctx.data, summary.factSources).join(', '))),
    (summary.facts ?? []).map((fact) =>
      h('div', { class: 'fact' }, h('span', { class: 'fact-label' }, fact.label), h('strong', { class: 'fact-value' }, fact.value))));
}

function stageTrophies(ctx, stage) {
  return ctx.data.trophies.filter((trophy) => trophy.stage === stage.stage).sort((a, b) => a.order - b.order);
}

function renderStageCard(ctx, stage) {
  const trophies = stageTrophies(ctx, stage);
  const done = trophies.filter((trophy) => ctx.state.progress.earned[trophy.id]).length;
  const body = stage.stage === 1 ? renderByChapter(ctx, trophies) : h('ol', { class: 'stage-list' }, trophies.map((trophy) => renderStageItem(ctx, trophy)));
  return h('article', { class: `stage-card stage-${stage.stage}` },
    h('header', { class: 'stage-head' },
      h('span', { class: 'stage-number' }, stage.stage),
      h('div', null,
        h('h3', { class: 'stage-title' }, stage.title),
        h('p', { class: 'stage-meta' }, `${stage.time} · ${done}/${trophies.length} earned`))),
    meter(done, trophies.length, 'meter-stage'),
    h('p', { class: 'stage-summary' }, stage.summary),
    body,
    h('p', { class: 'stage-sources' }, 'Per ', sourceNames(ctx.data, stage.sources).join(', ')));
}

/** Stage 1 grouped under its story chapters, so the order follows the missions. */
function renderByChapter(ctx, trophies) {
  return ctx.data.chapters.map((chapter) => {
    const inChapter = trophies.filter((trophy) => trophy.chapter === chapter.chapter);
    if (!inChapter.length) return null;
    return h('section', { class: 'chapter-group' },
      h('h4', { class: 'chapter-title' }, chapter.title),
      h('ol', { class: 'stage-list' }, inChapter.map((trophy) => renderStageItem(ctx, trophy))));
  });
}

function renderStageItem(ctx, trophy) {
  const earned = Boolean(ctx.state.progress.earned[trophy.id]);
  return h('li', { class: `stage-item${earned ? ' is-earned' : ''}${trophy.missable ? ' is-missable' : ''}` },
    h('input', {
      type: 'checkbox', class: 'earned-box small', checked: earned, 'aria-label': `Earned: ${visibleName(trophy, ctx.state)}`,
      onChange: (event) => ctx.setEarned(trophy.id, event.target.checked),
    }),
    gradeDot(trophy.grade),
    h('a', { class: 'stage-link', href: '#tracker', onClick: () => ctx.updateView({ selectedId: trophy.id }) },
      h('span', { class: 'stage-name' }, visibleName(trophy, ctx.state)),
      h('span', { class: 'stage-when' }, trophy.missable ? `⚠ ${trophy.when}` : trophy.when)));
}
