// HomeLedger — boot, hash routing, and wiring.
// Hash routes: #/ (dashboard), #/transactions, #/budgets, #/insights.
// The ledger lives in localStorage (see data.js); every change saves it and
// re-renders the current page.

import {
  loadState, saveState, resetState, freshId, monthsIn, prettyMonth, SUGGESTED,
} from './data.js';
import {
  renderDashboard, renderTransactions, renderBudgets, renderInsights,
} from './views.js';

const app = {
  state: loadState(),
  filter: { cat: '', type: '', q: '', editing: null },
};

const PAGES = {
  '': renderDashboard,
  transactions: (s) => renderTransactions(s, app.filter),
  budgets: renderBudgets,
  insights: renderInsights,
};

function routeFromHash() {
  const name = location.hash.replace(/^#\/?/, '');
  return PAGES[name] ? name : '';
}

function paint() {
  const route = routeFromHash();
  document.getElementById('view').innerHTML = PAGES[route](app.state);
  for (const link of document.querySelectorAll('.nav-item')) {
    link.classList.toggle('active', link.dataset.route === route);
  }
  document.getElementById('month-badge').textContent = prettyMonth(app.state.month);
  window.scrollTo(0, 0);
}

function persistAndPaint() {
  saveState(app.state);
  paint();
}

function stepMonth(delta) {
  const months = monthsIn(app.state);
  const target = months[months.indexOf(app.state.month) + delta];
  if (!target) return;
  app.state.month = target;
  app.filter.editing = null;
  persistAndPaint();
}

function formToTx(form) {
  const fields = new FormData(form);
  return {
    date: String(fields.get('date')),
    desc: String(fields.get('desc')).trim(),
    cat: String(fields.get('cat')),
    amount: Math.round(Number(fields.get('amount')) * 100) / 100,
    type: String(fields.get('kind')),
  };
}

function txLooksGood(t) {
  return Boolean(t.date && t.desc && t.cat) &&
    Number.isFinite(t.amount) && t.amount > 0 &&
    (t.type === 'expense' || t.type === 'income');
}

function askDelete(tx) {
  const amount = tx.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  return window.confirm(`Delete "${tx.desc}" (${amount})?`);
}

document.addEventListener('DOMContentLoaded', () => {
  paint();

  // One delegated click handler on <body> so the footer's reset button works
  // with the same code as the buttons inside the view.
  document.body.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    switch (el.dataset.action) {
      case 'prev-month': stepMonth(-1); break;
      case 'next-month': stepMonth(1); break;
      case 'delete-tx': {
        const tx = app.state.transactions.find((t) => t.id === el.dataset.id);
        if (tx && askDelete(tx)) {
          app.state.transactions = app.state.transactions.filter((t) => t.id !== tx.id);
          app.filter.editing = null;
          persistAndPaint();
        }
        break;
      }
      case 'edit-tx': {
        app.filter.editing = el.dataset.id;
        paint();
        const form = document.getElementById('edit-form');
        if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
      case 'cancel-edit':
        app.filter.editing = null;
        paint();
        break;
      case 'reset-budgets':
        app.state.budgets = { ...SUGGESTED };
        persistAndPaint();
        break;
      case 'reset-data':
        if (window.confirm('Reset all data back to the sample household? Your changes will be lost.')) {
          app.state = resetState();
          app.filter = { cat: '', type: '', q: '', editing: null };
          persistAndPaint();
        }
        break;
      default:
        break;
    }
  });

  document.getElementById('view').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const form = ev.target;
    const t = formToTx(form);
    if (!txLooksGood(t)) return;
    if (form.id === 'add-form') {
      app.state.transactions.push({ id: freshId(app.state), ...t });
      app.filter.editing = null;
      persistAndPaint();
    } else if (form.id === 'edit-form') {
      const i = app.state.transactions.findIndex((x) => x.id === form.dataset.id);
      if (i >= 0) app.state.transactions[i] = { id: form.dataset.id, ...t };
      app.filter.editing = null;
      persistAndPaint();
    }
  });

  // Budget inputs save on change; the category/type filters re-render the list.
  document.getElementById('view').addEventListener('change', (ev) => {
    const el = ev.target;
    if (el.classList && el.classList.contains('budget-input')) {
      app.state.budgets[el.dataset.cat] = Math.max(0, Math.round(Number(el.value) || 0));
      saveState(app.state);
      paint();
      const again = document.getElementById('budget-' + el.dataset.cat);
      if (again) again.focus();
      return;
    }
    if (el.id === 'filter-cat') {
      app.filter.cat = el.value;
      app.filter.editing = null;
      paint();
    }
    if (el.id === 'filter-kind') {
      app.filter.type = el.value;
      app.filter.editing = null;
      paint();
    }
  });

  // The search box re-renders on every keystroke but keeps the caret put.
  document.getElementById('view').addEventListener('input', (ev) => {
    if (ev.target.id !== 'filter-q') return;
    app.filter.q = ev.target.value;
    const pos = ev.target.selectionStart;
    paint();
    const again = document.getElementById('filter-q');
    if (again) {
      again.focus();
      again.setSelectionRange(pos, pos);
    }
  });

  window.addEventListener('hashchange', () => {
    app.filter.editing = null;
    paint();
  });
});
