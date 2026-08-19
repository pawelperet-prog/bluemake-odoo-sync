import './index.css';
import { renderDashboardView } from './views/DashboardView.js';
import { renderScannerView } from './views/ScannerView.js';
import { renderProductView } from './views/ProductView.js';
import { renderHistoryView } from './views/HistoryView.js';
import { renderValuationView } from './views/ValuationView.js';
import { renderOrderImportView } from './views/OrderImportView.js';
import { renderLoginView } from './views/LoginView.js';
import { isUserLoggedIn } from './services/authService.js';

const app = document.getElementById('app');

function navigateTo(route, params = null) {
  // Jeśli użytkownik nie jest zalogowany i nie jest na ekranie logowania, przekieruj do login
  if (!isUserLoggedIn() && route !== 'login') {
    app.innerHTML = '';
    renderLoginView(app, navigateTo);
    return;
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
    default:
      renderDashboardView(app, navigateTo);
  }
}

// Initial route
if (!isUserLoggedIn()) {
  navigateTo('login');
} else {
  navigateTo('dashboard');
}
