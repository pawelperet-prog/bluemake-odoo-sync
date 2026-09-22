import './index.css';
import { renderDashboardView } from './views/DashboardView.js';
import { renderScannerView } from './views/ScannerView.js';
import { renderProductView } from './views/ProductView.js';
import { renderHistoryView } from './views/HistoryView.js';
import { renderValuationView } from './views/ValuationView.js';
import { renderOrderImportView } from './views/OrderImportView.js';
import { renderSoftJawsView } from './views/SoftJawsView.js';
import { renderWzGeneratorView } from './views/WzGeneratorView.js';
import { renderLoginView } from './views/LoginView.js';
import { renderSiteGateView } from './views/SiteGateView.js';
import { isSiteUnlocked, isUserLoggedIn, isAdmin, getCurrentOperator } from './services/authService.js';

const app = document.getElementById('app');

function navigateTo(route, params = null) {
  // 1. Zabezpieczenie Główne Strony: Wymagane hasło dostępowe Szymon_Mateusz2025
  if (!isSiteUnlocked()) {
    app.innerHTML = '';
    renderSiteGateView(app, () => {
      if (!isUserLoggedIn()) {
        navigateTo('login');
      } else {
        navigateTo('dashboard');
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

  // 3. Zabezpieczenie: Zamówienia i Wyceny tylko dla Adminów (Paweł, Mateusz)
  if ((route === 'orders' || route === 'valuation') && !isAdmin()) {
    alert(`⛔ Brak uprawnień: Moduł "${route === 'orders' ? 'Zamówienia' : 'Wycena'}" jest dostępny wyłącznie dla Administratorów.`);
    route = 'dashboard';
  }

  app.innerHTML = '';
  switch (route) {
    case 'login':
      renderLoginView(app, navigateTo);
      break;
    case 'dashboard':
      renderDashboardView(app, navigateTo);
      break;
    case 'scanner':
      renderScannerView(app, navigateTo);
      break;
    case 'product':
      renderProductView(app, navigateTo, params);
      break;
    case 'history':
      renderHistoryView(app, navigateTo);
      break;
    case 'valuation':
      renderValuationView(app, navigateTo);
      break;
    case 'orders':
      renderOrderImportView(app, navigateTo);
      break;
    case 'jaws':
      renderSoftJawsView(app, navigateTo, params);
      break;
    case 'wz':
      renderWzGeneratorView(app, navigateTo);
      break;
    default:
      renderDashboardView(app, navigateTo);
  }
}

// Initial route
if (!isSiteUnlocked()) {
  renderSiteGateView(app, () => {
    if (!isUserLoggedIn()) {
      navigateTo('login');
    } else {
      navigateTo('dashboard');
    }
  });
} else if (!isUserLoggedIn()) {
  navigateTo('login');
} else {
  navigateTo('dashboard');
}

