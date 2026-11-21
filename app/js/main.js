// Boot: load the trophy data, restore saved progress, route between views from the URL hash.

import { replaceContent } from './dom.js';
import { downloadProgressFile, importProgressFile, loadSavedState, resetProgress, saveState, toggleEarned } from './progress-store.js';
import { renderMissablesView } from './render-missables.js';
import { renderProgressSummary } from './render-progress.js';
import { renderRoadmapView } from './render-roadmap.js';
import { renderSettingsView } from './render-settings.js';
import { renderTrackerView } from './render-tracker.js';
import { loadTrophyData } from './trophy-data.js';

const VIEWS = { tracker: renderTrackerView, roadmap: renderRoadmapView, missables: renderMissablesView, settings: renderSettingsView };

function readHashRoute() {
  const params = new URLSearchParams(location.hash.slice(1));
  return { view: VIEWS[params.get('view')] ? params.get('view') : 'tracker', trophy: Number(params.get('trophy')) || null };
}

function createActions(data, state, render) {
  return {
    toggleEarned(id) { toggleEarned(state, id); render(); },
    selectTrophy(id) { state.selectedId = id; render(); },
    openTrophy(id) { state.selectedId = id; state.view = 'tracker'; state.kindFilter = 'all'; render(); },
    setFilter(patch, keepFocus) {
      Object.assign(state, patch);
      render();
      if (keepFocus) document.querySelector('.search-input')?.focus();
    },
    setSpoilers(hide) { state.hideStorySpoilers = hide; saveState(state); render(); },
    exportFile() { downloadProgressFile(state); state.statusMessage = 'Exported gta6-trophy-progress.json'; render(); },
    async importFile(file) {
      try { state.statusMessage = `Imported ${await importProgressFile(state, file)} earned trophies from ${file.name}`; }
      catch (error) { state.statusMessage = `Import failed: ${error.message}`; }
      render();
    },
    resetAll() { if (confirm('Clear all saved progress?')) { resetProgress(state); render(); } },
    showView(view) { state.view = view; render(); },
  };
}

function updateTabs(view) {
  for (const tab of document.querySelectorAll('#view-tabs .tab')) {
    if (tab.dataset.view === view) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
}

async function startApp() {
  const root = document.getElementById('view-root');
  const data = await loadTrophyData();
  const route = readHashRoute();
  const state = {
    ...loadSavedState(),
    trophyIds: data.trophies.map((trophy) => trophy.id),
    platinumId: data.trophies.find((trophy) => trophy.grade === 'platinum')?.id,
    view: route.view,
    selectedId: route.trophy ?? data.trophies[0].id,
    kindFilter: 'all', gradeFilter: 'any', statusFilter: 'all', searchText: '', statusMessage: '',
  };
  const render = () => {
    history.replaceState(null, '', `#view=${state.view}&trophy=${state.selectedId}`);
    updateTabs(state.view);
    renderProgressSummary(document.getElementById('progress-summary'), data, state);
    replaceContent(root, VIEWS[state.view](data, state, actions));
  };
  const actions = createActions(data, state, render);
  document.getElementById('view-tabs').addEventListener('click', (event) => {
    const view = event.target.closest('[data-view]')?.dataset.view;
    if (view) actions.showView(view);
  });
  window.leonidaTracker = { state, render };
  render();
}

startApp().catch((error) => {
  document.getElementById('view-root').textContent = `Could not load the trophy list: ${error.message}`;
});
