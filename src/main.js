import './index.css';
import { renderDashboardView } from './views/DashboardView.js';
import { renderScannerView } from './views/ScannerView.js';
import { renderProductView } from './views/ProductView.js';
import { renderHistoryView } from './views/HistoryView.js';
import { renderValuationView } from './views/ValuationView.js';
import { renderOrderImportView } from './views/OrderImportView.js';
import { renderSoftJawsView } from './views/SoftJawsView.js';
import { renderWzGeneratorView } from './views/WzGeneratorView.js';
import { renderEmployeesView } from './views/EmployeesView.js';
import { renderLoginView } from './views/LoginView.js';
import { renderSiteGateView } from './views/SiteGateView.js';
import { isSiteUnlocked, isUserLoggedIn, isAdmin, getCurrentOperator } from './services/authService.js';

const app = document.getElementById('app');

let currentRouteParams = null;
let isInternalNavigation = false;
let currentViewCleanup = null;

export function parseHash() {
  const hash = window.location.hash || '';
  const clean = hash.replace(/^#\/?/, '').trim();
  const [routePart] = clean.split('?');
  const route = routePart || 'dashboard';
  return { route };
}

export function navigateTo(route, params = null, replace = false) {
  if (route === 'warehouse') route = 'dashboard';
  if (params !== null) {
    currentRouteParams = params;
  }

  const targetHash = `#/${route}`;
  if (window.location.hash !== targetHash) {
    isInternalNavigation = true;
    if (replace) {
      const url = new URL(window.location.href);
      url.hash = targetHash;
      window.location.replace(url.href);
    } else {
      window.location.hash = targetHash;
    }
  }

  renderRoute(route, params);
}

function renderRoute(route, params = null) {
  if (route === 'warehouse') route = 'dashboard';

  // 1. Zabezpieczenie Główne Strony: Wymagane hasło dostępowe Szymon_Mateusz2025
  if (!isSiteUnlocked()) {
    app.innerHTML = '';
    renderSiteGateView(app, () => {
      if (!isUserLoggedIn()) {
        navigateTo('login', null, true);
      } else {
        const { route: savedRoute } = parseHash();
        navigateTo(savedRoute && savedRoute !== 'login' ? savedRoute : 'dashboard', null, true);
      }
    });
    return;
  }

  // 2. Jeśli użytkownik nie jest zalogowany i nie jest na ekranie logowania, przekieruj do login
  if (!isUserLoggedIn() && route !== 'login') {
    app.innerHTML = '';
    renderLoginView(app, navigateTo);
    return;
  }

  // 3. Zabezpieczenie: Wycena tylko dla Adminów (Paweł, Mateusz)
  if (route === 'valuation' && !isAdmin()) {
    alert(`⛔ Brak uprawnień: Moduł "Wycena" jest dostępny wyłącznie dla Administratorów.`);
    navigateTo('dashboard', null, true);
    return;
  }

  if (typeof currentViewCleanup === 'function') {
    try {
      currentViewCleanup();
    } catch (e) {
      console.warn('View cleanup error:', e);
    }
    currentViewCleanup = null;
  }

  app.innerHTML = '';
  const effectiveParams = params !== null ? params : currentRouteParams;

  let cleanupFn = null;
  switch (route) {
    case 'login':
      cleanupFn = renderLoginView(app, navigateTo);
      break;
    case 'dashboard':
    case 'warehouse':
      cleanupFn = renderDashboardView(app, navigateTo);
      break;
    case 'scanner':
      cleanupFn = renderScannerView(app, navigateTo);
      break;
    case 'product':
      cleanupFn = renderProductView(app, navigateTo, effectiveParams);
      break;
    case 'history':
      cleanupFn = renderHistoryView(app, navigateTo);
      break;
    case 'valuation':
      cleanupFn = renderValuationView(app, navigateTo);
      break;
    case 'orders':
      cleanupFn = renderOrderImportView(app, navigateTo);
      break;
    case 'jaws':
      cleanupFn = renderSoftJawsView(app, navigateTo, effectiveParams);
      break;
    case 'wz':
      cleanupFn = renderWzGeneratorView(app, navigateTo, effectiveParams);
      break;
    case 'employees':
      cleanupFn = renderEmployeesView(app, navigateTo);
      break;
    default:
      cleanupFn = renderDashboardView(app, navigateTo);
  }

  if (typeof cleanupFn === 'function') {
    currentViewCleanup = cleanupFn;
  }
}

// Obsługa przycisków przeglądarki Wstecz / Dalej (Back / Forward oraz gestów na telefonie)
window.addEventListener('hashchange', () => {
  if (isInternalNavigation) {
    isInternalNavigation = false;
    return;
  }
  const { route } = parseHash();
  renderRoute(route, currentRouteParams);
});

// Start aplikacji - sprawdzenie hasła i zalogowania oraz załadowanie właściwej podstrony z URL
const initial = parseHash();
if (!isSiteUnlocked()) {
  renderSiteGateView(app, () => {
    if (!isUserLoggedIn()) {
      navigateTo('login', null, true);
    } else {
      const { route: r } = parseHash();
      navigateTo(r && r !== 'login' ? r : 'dashboard', null, true);
    }
  });
} else if (!isUserLoggedIn()) {
  navigateTo('login', null, true);
} else {
  // Przejdź do trasy z adresu URL (np. /sync/#/orders) lub domyślnie /sync/#/dashboard
  const target = initial.route && initial.route !== 'login' ? initial.route : 'dashboard';
  navigateTo(target, null, true);
}
