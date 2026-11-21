// Hash routes: #/checklist, #/checklist/<trophy id>, #/roadmap, #/missables, #/settings.

export const VIEW_NAMES = ['checklist', 'roadmap', 'missables', 'settings'];

export function parseRoute(hash) {
  const [view, idText] = hash.replace(/^#\/?/, '').split('/');
  const trophyId = Number.parseInt(idText, 10);
  return {
    view: VIEW_NAMES.includes(view) ? view : 'checklist',
    trophyId: Number.isInteger(trophyId) ? trophyId : undefined,
  };
}

export function watchRoute(onRoute) {
  const emit = () => onRoute(parseRoute(location.hash));
  window.addEventListener('hashchange', emit);
  emit();
}

export function markActiveTab(tabs, view) {
  for (const tab of tabs.querySelectorAll('a[data-view]')) {
    if (tab.dataset.view === view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
}
