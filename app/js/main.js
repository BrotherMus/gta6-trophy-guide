// Entry point: load the trophy data, build the shared context, and swap views as the hash route changes.
// The checklist ships in the first load; roadmap, missables and spoilers & backup load on demand with import().
import { loadTrophyData } from './data/load-trophy-data.js';
import { createProgressStore } from './state/progress-store.js';
import { createPreferencesStore } from './state/preferences-store.js';
import { isTrophyMasked } from './logic/spoiler-rules.js';
import { markActiveTab, watchRoute } from './router.js';
import { renderProgressSummary } from './views/progress-summary.js';
import { mountChecklistView } from './views/checklist-view.js';

const LAZY_VIEWS = {
  roadmap: () => import('./views/roadmap-view.js').then((module) => module.mountRoadmapView),
  missables: () => import('./views/missables-view.js').then((module) => module.mountMissablesView),
  settings: () => import('./views/settings-view.js').then((module) => module.mountSettingsView),
};

async function startGuide() {
  const viewRoot = document.getElementById('view-root');
  const summaryRoot = document.getElementById('progress-summary');
  const tabs = document.getElementById('view-tabs');

  let data;
  try {
    data = await loadTrophyData();
  } catch (error) {
    viewRoot.textContent = `The trophy list could not be loaded: ${error.message}`;
    return;
  }

  const context = createGuideContext(data);
  let mounted = { name: '', view: null };

  async function showRoute(route) {
    markActiveTab(tabs, route.view);
    if (mounted.name === route.view && mounted.view?.select) {
      mounted.view.select(route.trophyId);
      return;
    }
    const mount = route.view === 'checklist' ? mountChecklistView : await LAZY_VIEWS[route.view]();
    mounted = { name: route.view, view: mount(viewRoot, context, route.trophyId) };
    document.documentElement.dataset.view = route.view;
  }

  function refreshEverything() {
    renderProgressSummary(summaryRoot, context);
    mounted.view?.refresh();
  }

  context.progress.subscribe(refreshEverything);
  context.preferences.subscribe(refreshEverything);
  context.onReveal = refreshEverything;

  renderProgressSummary(summaryRoot, context);
  watchRoute(showRoute);
}

function createGuideContext(data) {
  const progress = createProgressStore(new Set(data.byId.keys()));
  const preferences = createPreferencesStore();
  const revealedIds = new Set();
  const context = {
    data,
    progress,
    preferences,
    revealedIds,
    onReveal: () => {},
    isMasked: (trophy) => isTrophyMasked(trophy, preferences.get(), progress.isEarned, revealedIds),
    revealTrophy(trophyId) {
      revealedIds.add(trophyId);
      context.onReveal();
    },
    navigate(hash) {
      if (location.hash === hash) return;
      location.hash = hash;
    },
  };
  return context;
}

startGuide();
