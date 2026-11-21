// The roadmap to the platinum: four stages in order, each with its tasks, its trophies and their progress.
import { el, replaceContent } from '../ui/dom.js';
import { renderGradeDot, renderMeter } from '../ui/grade-badge.js';
import { storyStepOf, trophiesInStage } from '../data/load-trophy-data.js';
import { maskedTrophyName } from '../logic/spoiler-rules.js';
import { renderSourceLine } from '../ui/source-links.js';

export function mountRoadmapView(root, context) {
  function refresh() {
    replaceContent(
      root,
      el(
        'div',
        { className: 'view-intro' },
        el('h1', { text: 'Roadmap to Vice Got a Price!' }),
        el('p', {
          text: 'One playthrough, about 200 hours, 1 potentially missable trophy, 0 online. Follow the stages in order; stages 2 and 3 can be mixed freely in free roam.',
        }),
      ),
      el('div', { className: 'stage-grid' }, context.data.stages.map((stage) => renderStageCard(stage, context))),
    );
  }
  refresh();
  return { refresh };
}

function renderStageCard(stage, context) {
  const trophies = trophiesInStage(context.data, stage.id);
  const earnedCount = trophies.filter((trophy) => context.progress.isEarned(trophy.id)).length;
  return el(
    'section',
    { className: 'stage-card', attrs: { 'aria-label': `Stage ${stage.id}` } },
    el('p', { className: 'stage-number', text: `Stage ${stage.id}` }),
    el('h2', { text: stage.title }),
    el('p', { className: 'stage-hours', text: stage.hours }),
    el('div', { className: 'stage-progress' }, renderMeter({ label: `${trophies.length} trophies`, earned: earnedCount, total: trophies.length })),
    el('ul', { className: 'stage-tasks' }, stage.tasks.map((task) => el('li', { text: task }))),
    el('ol', { className: 'stage-trophies' }, trophies.map((trophy) => renderStageTrophy(trophy, context))),
    renderSourceLine(stage.sources, context.data.sourcesById),
  );
}

function renderStageTrophy(trophy, context) {
  const masked = context.isMasked(trophy);
  const step = storyStepOf(context.data, trophy.id);
  return el(
    'li',
    { className: 'stage-trophy' },
    renderGradeDot(trophy.grade),
    el(
      'a',
      { href: `#/checklist/${trophy.id}`, title: masked ? 'Spoiler hidden' : trophy.description },
      masked ? maskedTrophyName(trophy) : trophy.name,
      step && trophy.stage === 1 && el('span', { className: 'stage-chapter', text: ` · ${step.chapter.replace('Chapter ', 'Ch ')}` }),
    ),
    context.progress.isEarned(trophy.id)
      ? el('span', { className: 'done', text: '✓' })
      : el('span', { text: trophy.missable ? '⚠' : trophy.count ? `×${trophy.count}` : '' }),
  );
}
