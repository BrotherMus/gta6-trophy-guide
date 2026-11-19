// Hash routes for the four tabs: #tracker, #roadmap, #missables, #settings.

export const ROUTES = ['tracker', 'roadmap', 'missables', 'settings'];

export function currentRoute() {
  const route = location.hash.replace(/^#\/?/, '').split(/[?&]/)[0];
  return ROUTES.includes(route) ? route : 'tracker';
}

export function onRouteChange(callback) {
  window.addEventListener('hashchange', callback);
}

export function markActiveTab(nav, route) {
  for (const link of nav.querySelectorAll('[data-route]')) {
    if (link.dataset.route === route) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
}
