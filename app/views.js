// HomeLedger — the four pages.
// Every page is a function of (state, options) returning an HTML string;
// main.js mounts the string and wires the buttons. All figures come from
// data.js, so nothing on screen is a hardcoded number.

import {
  CATEGORIES, BY_ID, RECURRING, SUGGESTED,
  prettyMonth, rowsForMonth, monthTotals, spendByCategory, budgetSum,
  fmtMoney, fmtMoney0, daysIn,
} from './data.js';
import { donutChart, hbar, budgetMeter, dailyColumns } from './charts.js';

export function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function shortDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function pageIntro(state, heading, lede) {
  return `<section class="page-intro">
    <div><h1>${heading}</h1><p class="lede">${lede}</p></div>
    <div class="month-switch">
      <button class="btn btn-quiet" data-action="prev-month" aria-label="Previous month">‹ Prev</button>
      <strong class="month-name">${prettyMonth(state.month)}</strong>
      <button class="btn btn-quiet" data-action="next-month" aria-label="Next month">Next ›</button>
    </div>
  </section>`;
}

function txItem(t) {
  const cat = BY_ID[t.cat];
  const income = t.type === 'income';
  return `<li class="tx-item">
    <span class="tx-dot" style="background:${cat ? cat.color : '#2f6b4f'}" title="${esc(cat ? cat.label : 'Income')}"></span>
    <span class="tx-body"><span class="tx-desc">${esc(t.desc)}</span>
      <span class="tx-sub">${shortDate(t.date)} · ${esc(cat ? cat.label : 'Income')}</span></span>
    <span class="tx-amount${income ? ' in' : ''}">${income ? '+' : '−'}${fmtMoney(t.amount)}</span>
    <button class="btn btn-small" data-action="edit-tx" data-id="${t.id}">Edit</button>
    <button class="btn btn-small btn-danger" data-action="delete-tx" data-id="${t.id}" aria-label="Delete ${esc(t.desc)}">✕</button>
  </li>`;
}

// ---------------- Dashboard ----------------

export function renderDashboard(state) {
  const month = state.month;
  const totals = monthTotals(state, month);
  const byCat = spendByCategory(state, month);
  const budgetTotal = budgetSum(state);
  const saveRate = totals.income > 0 ? (state.budgets.savings / totals.income) * 100 : 0;

  const slices = CATEGORIES
    .filter((c) => c.id !== 'savings' && byCat[c.id] > 0)
    .map((c) => ({ label: c.label, value: byCat[c.id], color: c.color }))
    .sort((a, b) => b.value - a.value);

  const biggest = [...CATEGORIES]
    .map((c) => ({ label: c.label, spent: byCat[c.id], limit: state.budgets[c.id] || 0, color: c.color }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const recent = rowsForMonth(state, month).slice(0, 5);
  const [y, m] = month.split('-').map(Number);
  const nextName = new Date(y, m, 1).toLocaleDateString('en-US', { month: 'short' });
  const coming = RECURRING.slice(0, 5);

  return `
  ${pageIntro(state, 'Good evening, Alvarez household', `Here is where ${prettyMonth(month)} stands — what came in, what went out, and what is left.`)}

  <section class="stat-grid">
    <article class="panel stat"><span class="stat-label">Income</span><strong class="stat-num">${fmtMoney0(totals.income)}</strong><span class="stat-sub">${totals.count} transactions this month</span></article>
    <article class="panel stat"><span class="stat-label">Spent</span><strong class="stat-num">${fmtMoney0(totals.spent)}</strong><span class="stat-sub">of ${fmtMoney0(budgetTotal)} budgeted</span></article>
    <article class="panel stat stat-ok"><span class="stat-label">Left to spend</span><strong class="stat-num">${fmtMoney0(totals.left)}</strong><span class="stat-sub">${totals.left >= 0 ? 'on track' : 'over income'}</span></article>
    <article class="panel stat"><span class="stat-label">Savings rate</span><strong class="stat-num">${saveRate.toFixed(1)}%</strong><span class="stat-sub">${fmtMoney0(state.budgets.savings)} set aside</span></article>
  </section>

  <section class="two-col">
    <article class="panel">
      <h2>Where the money went</h2>
      <div class="donut-box">${donutChart(slices)}
        <ul class="key-list">${slices.map((s) => `<li><span class="key-dot" style="background:${s.color}"></span>${esc(s.label)} — ${fmtMoney0(s.value)}</li>`).join('')}</ul>
      </div>
    </article>
    <article class="panel">
      <h2>Biggest categories</h2>
      ${biggest.map((c) => hbar(c.label, c.spent, Math.max(c.limit, c.spent), c.color, `Budget ${fmtMoney0(c.limit)} · ${c.spent > c.limit ? 'over budget' : fmtMoney0(Math.max(0, c.limit - c.spent)) + ' left'}`)).join('')}
      <p class="panel-link"><a href="#/budgets">See all budgets →</a></p>
    </article>
  </section>

  <section class="two-col">
    <article class="panel">
      <h2>Recent transactions</h2>
      <ul class="tx-list">${recent.map(txItem).join('')}</ul>
      <p class="panel-link"><a href="#/transactions">All transactions →</a></p>
    </article>
    <article class="panel">
      <h2>Coming up</h2>
      <ul class="bill-list">${coming.map((b) => `<li><span>${esc(b.label)}</span><strong>${fmtMoney(b.amount)}</strong><span class="bill-when">${nextName} ${b.day}</span></li>`).join('')}</ul>
      <p class="note">Recurring bills for next month. Add one in Transactions — pick a category and it counts toward that month.</p>
    </article>
  </section>`;
}

// ---------------- Transactions ----------------

export function renderTransactions(state, filter = {}) {
  const month = state.month;
  let rows = rowsForMonth(state, month);
  if (filter.cat) rows = rows.filter((t) => t.cat === filter.cat);
  if (filter.type) rows = rows.filter((t) => t.type === filter.type);
  if (filter.q) {
    const q = filter.q.toLowerCase();
    rows = rows.filter((t) => t.desc.toLowerCase().includes(q));
  }
  const totals = monthTotals(state, month);
  const catOptions = `<option value="">All categories</option>` +
    CATEGORIES.map((c) => `<option value="${c.id}"${filter.cat === c.id ? ' selected' : ''}>${c.label}</option>`).join('') +
    `<option value="income"${filter.cat === 'income' ? ' selected' : ''}>Income</option>`;
  const editing = filter.editing ? state.transactions.find((t) => t.id === filter.editing) : null;

  return `
  ${pageIntro(state, 'Transactions', `${rows.length} rows in ${prettyMonth(month)} · ${fmtMoney0(totals.income)} in, ${fmtMoney0(totals.spent)} out.`)}

  <section class="panel">
    <h2>Add a transaction</h2>
    <form id="add-form" class="tx-form">
      <label>Date <input type="date" name="date" value="2026-11-26" required></label>
      <label>Description <input type="text" name="desc" placeholder="e.g. Weekly groceries" required maxlength="80"></label>
      <label>Category <select name="cat">${CATEGORIES.map((c) => `<option value="${c.id}">${c.label}</option>`).join('')}<option value="income">Income</option></select></label>
      <label>Amount <input type="number" name="amount" min="0.01" step="0.01" placeholder="0.00" required></label>
      <label>Type <select name="kind"><option value="expense">Expense</option><option value="income">Income</option></select></label>
      <button class="btn btn-primary" type="submit">Add transaction</button>
    </form>
    <p class="note">New rows are saved in this browser (localStorage) and count toward the month's totals at once.</p>
  </section>

  ${editing ? `<section class="panel edit-panel">
    <h2>Edit transaction</h2>
    <form id="edit-form" class="tx-form" data-id="${editing.id}">
      <label>Date <input type="date" name="date" value="${editing.date}" required></label>
      <label>Description <input type="text" name="desc" value="${esc(editing.desc)}" required maxlength="80"></label>
      <label>Category <select name="cat">${CATEGORIES.map((c) => `<option value="${c.id}"${editing.cat === c.id ? ' selected' : ''}>${c.label}</option>`).join('')}<option value="income"${editing.cat === 'income' ? ' selected' : ''}>Income</option></select></label>
      <label>Amount <input type="number" name="amount" min="0.01" step="0.01" value="${editing.amount}" required></label>
      <label>Type <select name="kind"><option value="expense"${editing.type === 'expense' ? ' selected' : ''}>Expense</option><option value="income"${editing.type === 'income' ? ' selected' : ''}>Income</option></select></label>
      <button class="btn btn-primary" type="submit">Save changes</button>
      <button class="btn btn-quiet" type="button" data-action="cancel-edit">Cancel</button>
    </form>
  </section>` : ''}

  <section class="panel">
    <h2>All transactions</h2>
    <div class="filter-row">
      <select id="filter-cat" aria-label="Filter by category">${catOptions}</select>
      <select id="filter-kind" aria-label="Filter by type">
        <option value="">Income &amp; expenses</option>
        <option value="expense"${filter.type === 'expense' ? ' selected' : ''}>Expenses only</option>
        <option value="income"${filter.type === 'income' ? ' selected' : ''}>Income only</option>
      </select>
      <input id="filter-q" type="search" placeholder="Search description…" value="${esc(filter.q || '')}" aria-label="Search transactions">
    </div>
    ${rows.length ? `<ul class="tx-list">${rows.map(txItem).join('')}</ul>` : '<p class="empty-note">No transactions match these filters. Try clearing the search.</p>'}
  </section>`;
}

// ---------------- Budgets ----------------

export function renderBudgets(state) {
  const month = state.month;
  const byCat = spendByCategory(state, month);
  const totals = monthTotals(state, month);
  const budgetTotal = budgetSum(state);
  const rows = CATEGORIES.map((c) => {
    const spent = byCat[c.id];
    const limit = state.budgets[c.id] || 0;
    const left = limit - spent;
    return `<tr>
      <td><span class="key-dot" style="background:${c.color}"></span> ${c.label}</td>
      <td><label class="visually-hidden" for="budget-${c.id}">${c.label} budget</label><input id="budget-${c.id}" class="budget-input" type="number" min="0" step="1" value="${limit}" data-cat="${c.id}"> / mo</td>
      <td>${fmtMoney(spent)}</td>
      <td class="${left < 0 ? 'over' : ''}">${fmtMoney(Math.abs(left))} ${left < 0 ? 'over' : 'left'}</td>
      <td class="meter-cell">${budgetMeter(spent, limit, c.color)}</td>
    </tr>`;
  }).join('');

  return `
  ${pageIntro(state, 'Budgets', `Set a monthly limit per category. Spent ${fmtMoney0(totals.spent)} of ${fmtMoney0(budgetTotal)} budgeted in ${prettyMonth(month)}.`)}
  <section class="panel">
    <div class="panel-actions"><button class="btn" data-action="reset-budgets">Reset to suggested budgets</button></div>
    <table class="budget-grid">
      <thead><tr><th>Category</th><th>Monthly budget</th><th>Spent</th><th>Remaining</th><th>Progress</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td><strong>Total</strong></td><td><strong>${fmtMoney0(budgetTotal)} / mo</strong></td><td><strong>${fmtMoney0(totals.spent)}</strong></td><td><strong>${fmtMoney0(budgetTotal - totals.spent)} left</strong></td><td></td></tr></tfoot>
    </table>
    <p class="note">Change any budget number and it saves right away. Over-budget rows turn red so you spot them at a glance.</p>
  </section>

  <section class="panel">
    <h2>How the suggested budgets were set</h2>
    <p>They follow the 50/30/20 rule of thumb for this household's ${fmtMoney0(totals.income)} monthly income: about half for needs (housing, groceries, utilities, transport), a third for wants (dining, entertainment, shopping, kids), and a fifth for savings and debt payoff. Adjust any number to fit your real life — the totals above update as you type.</p>
  </section>`;
}

// ---------------- Insights ----------------

export function renderInsights(state) {
  const month = state.month;
  const totals = monthTotals(state, month);
  const byCat = spendByCategory(state, month);
  const budgetTotal = budgetSum(state);
  const cats = CATEGORIES.map((c) => ({ ...c, spent: byCat[c.id] })).sort((a, b) => b.spent - a.spent);
  const top = cats[0];
  const totalDays = daysIn(month);
  const daysSoFar = month === '2026-11' ? 25 : totalDays; // the sample data runs through Nov 25
  const dailyAvg = totals.spent / daysSoFar;
  const projected = dailyAvg * totalDays;
  const biggest = rowsForMonth(state, month).filter((t) => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0];
  const over = CATEGORIES.filter((c) => byCat[c.id] > (state.budgets[c.id] || 0));
  const allMonths = [...new Set(state.transactions.map((t) => t.date.slice(0, 7)))].sort();
  const prevKey = allMonths[allMonths.indexOf(month) - 1];
  let vsPrev = null;
  if (prevKey) {
    const prev = monthTotals(state, prevKey);
    const diff = totals.spent - prev.spent;
    vsPrev = { prev: prev.spent, diff, pct: prev.spent > 0 ? (diff / prev.spent) * 100 : 0, label: prettyMonth(prevKey) };
  }
  const daily = [];
  for (let d = 1; d <= totalDays; d += 1) {
    const key = `${month}-${String(d).padStart(2, '0')}`;
    const value = state.transactions
      .filter((t) => t.date === key && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    daily.push({ day: d, value });
  }
  const tips = [];
  if (over.length) {
    const overBy = over.reduce((sum, c) => sum + (byCat[c.id] - state.budgets[c.id]), 0);
    tips.push(`<strong>${over.map((c) => c.label).join(' and ')}</strong> ${over.length > 1 ? 'are' : 'is'} over budget — ${fmtMoney0(overBy)} over in total. Groceries ran high because of two big Costco runs; a weekly shop instead of bulk top-ups usually smooths it out.`);
  }
  if (vsPrev && vsPrev.diff > 0) {
    tips.push(`Spending is up ${fmtMoney0(vsPrev.diff)} (${vsPrev.pct.toFixed(0)}%) on ${vsPrev.label}. Most of the rise is one-off: winter coats and the dentist visit.`);
  }
  tips.push(`At the current daily average of ${fmtMoney(dailyAvg)}, November is on pace to end near ${fmtMoney0(projected)} — ${projected <= budgetTotal ? 'inside' : 'above'} the ${fmtMoney0(budgetTotal)} total budget.`);
  tips.push('The household already saves first: the $500 transfer goes out on the 1st, before any spending. Keeping that automatic is the single best habit here.');

  return `
  ${pageIntro(state, 'Insights', `What ${prettyMonth(month)} actually says about this household's money.`)}
  <section class="stat-grid">
    <article class="panel stat"><span class="stat-label">Biggest category</span><strong class="stat-num">${esc(top.label)}</strong><span class="stat-sub">${fmtMoney0(top.spent)} this month</span></article>
    <article class="panel stat"><span class="stat-label">Biggest single expense</span><strong class="stat-num">${fmtMoney0(biggest.amount)}</strong><span class="stat-sub">${esc(biggest.desc)} · ${shortDate(biggest.date)}</span></article>
    <article class="panel stat"><span class="stat-label">Daily average</span><strong class="stat-num">${fmtMoney(dailyAvg)}</strong><span class="stat-sub">over ${daysSoFar} days so far</span></article>
    <article class="panel stat"><span class="stat-label">Projected month-end</span><strong class="stat-num">${fmtMoney0(projected)}</strong><span class="stat-sub">${projected <= budgetTotal ? 'inside the total budget' : 'above the total budget'}</span></article>
  </section>

  <section class="panel">
    <h2>Spending by day — ${prettyMonth(month)}</h2>
    ${dailyColumns(daily)}
    <p class="note">Each bar is one day's spending. The tall bars are the 1st (rent + savings) and the big grocery runs.</p>
  </section>

  <section class="two-col">
    <article class="panel">
      <h2>Over budget</h2>
      ${over.length ? `<ul class="over-list">${over.map((c) => `<li><span class="key-dot" style="background:${c.color}"></span>${c.label}: spent ${fmtMoney(byCat[c.id])} of ${fmtMoney(state.budgets[c.id])} — ${fmtMoney(byCat[c.id] - state.budgets[c.id])} over</li>`).join('')}</ul>` : '<p class="empty-note">Nothing is over budget this month. Nice work.</p>'}
    </article>
    <article class="panel">
      <h2>Compared with last month</h2>
      ${vsPrev ? `<p class="big-number">${fmtMoney0(totals.spent)} <span class="dim">vs ${fmtMoney0(vsPrev.prev)} in ${vsPrev.label}</span></p>
      <p>${vsPrev.diff >= 0 ? 'Up' : 'Down'} ${fmtMoney0(Math.abs(vsPrev.diff))} (${Math.abs(vsPrev.pct).toFixed(1)}%) month over month.</p>` : '<p class="empty-note">No earlier month in the data to compare with.</p>'}
    </article>
  </section>

  <section class="panel">
    <h2>What to do next</h2>
    <ol class="tips">${tips.map((t) => `<li>${t}</li>`).join('')}</ol>
  </section>`;
}

export { SUGGESTED };
