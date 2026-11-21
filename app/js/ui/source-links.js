// Cited-source rendering shared by the guide panel, roadmap and missables: links only, the app never fetches them.
import { el } from './dom.js';

export function renderSourceList(sources) {
  return el(
    'ul',
    { className: 'source-list' },
    sources.map((source) =>
      el(
        'li',
        { className: 'source-item' },
        el('a', { href: source.url, text: source.name, target: '_blank', rel: 'noopener noreferrer' }),
        source.section && el('span', { className: 'source-section', text: ` — ${source.section}` }),
        el('span', { className: 'source-url', text: source.url }),
      ),
    ),
  );
}

export function renderSourceLine(sourceIds, sourcesById) {
  return el(
    'p',
    { className: 'source-line' },
    'Sources: ',
    sourceIds.map((id, index) => {
      const source = sourcesById.get(id);
      return [index > 0 && ' · ', el('a', { href: source.url, text: source.name, target: '_blank', rel: 'noopener noreferrer' })];
    }),
  );
}
