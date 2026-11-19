// The guide beside the checklist: official text, our own walkthrough, steps, counter and cited sources.
import { h, externalLink, shortHost } from './dom.js';
import { gradeBadge, kindTag, missableTag, hiddenTag, stageTag, confidenceTag } from './badges.js';
import { resolveSources, formatTarget, chapterLabel } from './trophy-data.js';
import { isShielded } from './spoiler-shield.js';
import { countFor } from './progress-store.js';

export function renderGuidePanel(panel, ctx, trophy) {
  if (!trophy) {
    panel.replaceChildren(h('p', { class: 'guide-empty' }, 'Pick a trophy to read its guide.'));
    return;
  }
  if (isShielded(trophy, ctx.state)) {
    panel.replaceChildren(renderShieldNotice(ctx, trophy));
    return;
  }
  panel.replaceChildren(
    renderGuideHeader(ctx, trophy),
    trophy.missable ? renderMissableWarning(trophy) : null,
    trophy.count ? renderCounter(ctx, trophy) : null,
    h('section', { class: 'guide-body' },
      h('h3', { class: 'guide-heading' }, 'How to get it'),
      h('p', { class: 'guide-text' }, trophy.guide)),
    renderSourceList(ctx.data, trophy),
    trophy.steps?.length
      ? h('section', { class: 'guide-body' },
        h('h3', { class: 'guide-heading' }, 'Step by step'),
        h('ol', { class: 'guide-steps' }, trophy.steps.map((step) => h('li', null, step))))
      : null,
  );
}

function renderGuideHeader(ctx, trophy) {
  const earned = Boolean(ctx.state.progress.earned[trophy.id]);
  return h('header', { class: 'guide-header' },
    h('div', { class: 'guide-title-row' },
      h('h2', { class: 'guide-name' }, trophy.name),
      gradeBadge(trophy.grade, 'grade-large')),
    h('p', { class: 'guide-official' }, h('span', { class: 'official-label' }, 'Official'), trophy.description),
    h('p', { class: 'guide-tags' },
      kindTag(trophy.kind), stageTag(trophy.stage), trophy.missable ? missableTag() : null, trophy.hidden ? hiddenTag() : null,
      confidenceTag(trophy.confidence),
      h('button', {
        type: 'button', class: `earn-button${earned ? ' is-earned' : ''}`,
        onClick: () => ctx.setEarned(trophy.id, !earned),
      }, earned ? '✓ Earned' : 'Mark earned')),
    h('p', { class: 'guide-when' }, h('strong', null, chapterLabel(trophy.chapter)), ` · ${trophy.when}`));
}

function renderMissableWarning(trophy) {
  return h('div', { class: 'missable-warning', role: 'note' },
    h('strong', null, 'Missable window'), h('span', null, trophy.missableNote));
}

/** Number box for counting trophies; reaching the target ticks the trophy. */
function renderCounter(ctx, trophy) {
  const done = countFor(ctx.state, trophy);
  const step = trophy.unit === 'usd' ? 10000 : 1;
  return h('div', { class: 'counter' },
    h('label', { for: `count-${trophy.id}` }, 'Your count'),
    h('input', {
      id: `count-${trophy.id}`, type: 'number', min: 0, max: trophy.count, step, value: String(done),
      onChange: (event) => ctx.setCount(trophy, event.target.value),
    }),
    h('span', { class: 'counter-target' }, `of ${formatTarget(trophy)}`),
    h('button', { type: 'button', class: 'counter-plus', onClick: () => ctx.setCount(trophy, done + step) }, `+${formatTarget(trophy, step)}`));
}

/** Each source: name, page title, what fact it backs, and its link (opened only on click). */
export function renderSourceList(data, trophy) {
  const sources = resolveSources(data, trophy);
  return h('section', { class: 'guide-sources' },
    h('h3', { class: 'guide-heading' }, `Sources (${sources.length})`),
    h('ul', { class: 'source-list' }, sources.map((source) =>
      h('li', { class: 'source-item' },
        externalLink(source.url, source.name, 'source-name'),
        h('span', { class: 'source-for' }, source.for),
        h('span', { class: 'source-host' }, shortHost(source.url))))));
}

function renderShieldNotice(ctx, trophy) {
  return h('div', { class: 'shield-notice' },
    gradeBadge(trophy.grade, 'grade-large'),
    h('h2', { class: 'guide-name' }, trophy.kind === 'story' ? 'Hidden story trophy' : 'Hidden trophy'),
    h('p', null, `The spoiler shield hides this trophy's name, description and guide until you earn it (${chapterLabel(trophy.chapter)}).`),
    h('div', { class: 'shield-actions' },
      h('button', { type: 'button', class: 'button', onClick: () => ctx.reveal(trophy.id) }, 'Reveal this one'),
      h('a', { class: 'button button-ghost', href: '#settings' }, 'Spoiler settings')));
}
