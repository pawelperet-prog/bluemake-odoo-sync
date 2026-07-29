import './index.css';
import { renderDashboardView } from './views/DashboardView.js';
import { renderScannerView } from './views/ScannerView.js';
import { renderProductView } from './views/ProductView.js';
import { renderHistoryView } from './views/HistoryView.js';

const app = document.getElementById('app');

function navigateTo(route, params = null) {
  app.innerHTML = '';
  switch (route) {
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
    default:
      renderDashboardView(app, navigateTo);
  }
}

// Initial route
navigateTo('dashboard');
