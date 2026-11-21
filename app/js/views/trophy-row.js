// One checklist row: earned checkbox, grade badge, official name and description, and tags.
import { el } from '../ui/dom.js';
import { renderGradeBadge } from '../ui/grade-badge.js';
import { maskedTrophyDescription, maskedTrophyName } from '../logic/spoiler-rules.js';

const KIND_LABEL = {
  platinum: 'Platinum',
  story: 'Story',
  collectible: 'Collectible',
  activity: 'Activity',
  side: 'Side mission',
  crime: 'Robbery',
  misc: 'Misc',
  online: 'Online',
};

export function renderTrophyRow(trophy, { earned, masked, selected, onToggleEarned, onSelect }) {
  const checkbox = el('input', {
    type: 'checkbox',
    className: 'earn-box',
    checked: earned,
    attrs: { 'aria-label': `Earned: ${masked ? 'hidden trophy' : trophy.name}` },
    on: {
      click: (event) => event.stopPropagation(),
      change: () => onToggleEarned(trophy.id, checkbox.checked),
    },
  });

  return el(
    'li',
    {
      className: ['trophy-row', earned && 'is-earned', selected && 'is-selected', masked && 'masked'].filter(Boolean).join(' '),
      dataset: { id: String(trophy.id) },
      attrs: { tabindex: '0', 'aria-selected': String(selected) },
      on: {
        click: () => onSelect(trophy.id),
        keydown: (event) => {
          if (event.key === 'Enter') onSelect(trophy.id);
        },
      },
    },
    checkbox,
    renderGradeBadge(trophy.grade),
    el(
      'div',
      { className: 'trophy-text' },
      el('p', { className: 'trophy-name', text: masked ? maskedTrophyName(trophy) : trophy.name }),
      el('p', { className: 'trophy-desc', text: masked ? maskedTrophyDescription() : trophy.description }),
    ),
    renderTrophyTags(trophy),
  );
}

function renderTrophyTags(trophy) {
  return el(
    'div',
    { className: 'trophy-meta' },
    trophy.missable && el('span', { className: 'tag tag-missable', text: 'Missable' }),
    el('span', { className: `tag tag-grade grade-${trophy.grade}`, text: trophy.grade }),
    el('span', { className: 'tag tag-stage', text: `Stage ${trophy.stage}` }),
    trophy.kind !== trophy.grade && el('span', { className: 'tag', text: KIND_LABEL[trophy.kind] ?? trophy.kind }),
    trophy.count && el('span', { className: 'tag', text: `×${trophy.count.toLocaleString('en-US')}` }),
    trophy.hidden && el('span', { className: 'tag tag-hidden', text: 'PSN hidden' }),
  );
}
