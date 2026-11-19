// Entry point: load the trophy data and saved progress, then render the active tab and the progress strip.
import { loadTrophyData } from './trophy-data.js';
import { loadSavedState, saveView, setEarned, setCount, setSpoilerMode, replaceProgress } from './progress-store.js';
import { currentRoute, onRouteChange, markActiveTab } from './router.js';
import { renderProgressStrip } from './progress-strip.js';
import { mountTrackerView, updateTrackerView } from './tracker-view.js';
import { renderRoadmapView } from './roadmap-view.js';
import { renderMissablesView } from './missables-view.js';
import { renderSettingsView } from './settings-view.js';

const VIEW_RENDERERS = {
  roadmap: renderRoadmapView,
  missables: renderMissablesView,
  settings: renderSettingsView,
};

function createAppContext(data, state) {
  const viewRoot = document.getElementById('view');
  let mountedRoute = null;

  const ctx = {
    data,
    state,
    rerender() {
      const route = currentRoute();
      markActiveTab(document.getElementById('tabs'), route);
      renderProgressStrip(document.getElementById('progress-strip'), data, state);
      viewRoot.dataset.route = route;
      if (route === 'tracker') {
        if (mountedRoute !== 'tracker') mountTrackerView(viewRoot, ctx);
        updateTrackerView(viewRoot, ctx);
      } else {
        VIEW_RENDERERS[route](viewRoot, ctx);
      }
      mountedRoute = route;
    },
    updateView(patch) {
      Object.assign(state.view, patch);
      saveView(state);
      ctx.rerender();
    },
    setEarned(id, earned) {
      setEarned(state, id, earned);
      ctx.rerender();
    },
    setCount(trophy, value) {
      setCount(state, trophy, value);
      ctx.rerender();
    },
    setSpoilerMode(mode) {
      setSpoilerMode(state, mode);
      ctx.rerender();
    },
    reveal(id) {
      state.revealed.add(id);
      ctx.rerender();
    },
    replaceProgress(progress) {
      replaceProgress(state, progress);
      ctx.rerender();
    },
  };
  return ctx;
}

async function startApp() {
  try {
    const data = await loadTrophyData();
    const ctx = createAppContext(data, loadSavedState());
    onRouteChange(() => ctx.rerender());
    ctx.rerender();
    document.documentElement.dataset.ready = 'true';
  } catch (error) {
    document.getElementById('view').replaceChildren(Object.assign(document.createElement('p'), {
      className: 'loading',
      textContent: `Could not load the trophy list: ${error.message}. Serve app/ over HTTP (node serve.ts).`,
    }));
  }
}

startApp();
