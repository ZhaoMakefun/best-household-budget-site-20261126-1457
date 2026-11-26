// HomeLedger — household data.
// Categories, the Alvarez household's seed ledger, the localStorage store,
// and the small arithmetic the pages need. Nothing here touches the network:
// every figure is local data plus sums.
//
// The seed ledger is one pipe-delimited table, one row per line:
//   date | description | category | amount | expense|income
// November 2026 is the live month (through the 25th); October is kept so the
// Insights page can compare month over month.

export const CATEGORIES = [
  { id: 'housing', label: 'Housing', color: '#2f6b4f', glyph: '⌂' },
  { id: 'groceries', label: 'Groceries', color: '#7a9e43', glyph: '◉' },
  { id: 'dining', label: 'Dining out', color: '#d97b29', glyph: '✦' },
  { id: 'transport', label: 'Transport', color: '#3e7ca6', glyph: '➤' },
  { id: 'utilities', label: 'Utilities', color: '#6a5a8c', glyph: '⚡' },
  { id: 'entertainment', label: 'Entertainment', color: '#c65d7b', glyph: '♪' },
  { id: 'health', label: 'Health', color: '#4a9b8e', glyph: '+' },
  { id: 'kids', label: 'Kids & school', color: '#b98a2f', glyph: '✎' },
  { id: 'shopping', label: 'Shopping', color: '#8a6d4b', glyph: '▣' },
  { id: 'savings', label: 'Savings', color: '#2f6b4f', glyph: '⬢' },
];

export const BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export const INCOME = 'income';

// Monthly limits the Budgets page offers as its "suggested" reset.
export const SUGGESTED = {
  housing: 1950, groceries: 720, dining: 260, transport: 310, utilities: 240,
  entertainment: 150, health: 180, kids: 220, shopping: 200, savings: 500,
};

// Bills that repeat every month, shown on the dashboard as coming up.
export const RECURRING = [
  { label: 'Rent — Alvarez household', amount: 1850, day: 1 },
  { label: 'Electric — City Power', amount: 110, day: 5 },
  { label: 'Internet — NorthLink', amount: 79.99, day: 10 },
  { label: 'Gym — Riverside Fitness', amount: 45, day: 10 },
  { label: 'Streaming — StreamBox', amount: 15.49, day: 14 },
  { label: 'Phone — MobileOne', amount: 65, day: 19 },
];

const STORAGE_KEY = 'homeledger-v1';

const SEED_TABLE = `
2026-11-01|Salary — Maya Alvarez|income|4850|income
2026-11-01|Salary — Jordan Alvarez|income|4200|income
2026-11-01|Rent — Alvarez household|housing|1850|expense
2026-11-01|Transfer to savings|savings|500|expense
2026-11-01|Metro monthly pass|transport|98|expense
2026-11-02|Whole Foods Market|groceries|148.20|expense
2026-11-02|Taco truck lunch|dining|24.50|expense
2026-11-03|Renter's insurance|housing|42|expense
2026-11-03|Kids soccer fees|kids|85|expense
2026-11-04|Pharmacy — cold medicine|health|28.90|expense
2026-11-05|Electric — City Power|utilities|112.40|expense
2026-11-06|Sushi night|dining|68|expense
2026-11-07|Trader Joe's|groceries|96.40|expense
2026-11-07|Movie night — cinema|entertainment|36|expense
2026-11-08|Gas — Shell|transport|46.20|expense
2026-11-08|Winter coats (2)|shopping|129.99|expense
2026-11-09|Costco run|groceries|212.75|expense
2026-11-10|Internet — NorthLink|utilities|79.99|expense
2026-11-10|Gym — Riverside Fitness|health|45|expense
2026-11-10|School supplies|kids|42.15|expense
2026-11-11|Pizza night|dining|31.75|expense
2026-11-12|Freelance design — Maya|income|640|income
2026-11-12|Water bill|utilities|46.30|expense
2026-11-13|Gas — Chevron|transport|41.80|expense
2026-11-14|Farmers market|groceries|58.30|expense
2026-11-14|Streaming — StreamBox|entertainment|15.49|expense
2026-11-15|Coffee & pastries|dining|18.40|expense
2026-11-16|Trader Joe's|groceries|121.55|expense
2026-11-17|Rideshare to airport|transport|22.40|expense
2026-11-17|Piano lesson — Sofia|kids|60|expense
2026-11-18|Utility refund|income|86|income
2026-11-18|Dentist copay|health|60|expense
2026-11-19|Thai takeout|dining|42.30|expense
2026-11-19|Phone — MobileOne|utilities|65|expense
2026-11-20|Sold old bike|income|120|income
2026-11-20|Household goods|shopping|54.20|expense
2026-11-21|Whole Foods Market|groceries|132.80|expense
2026-11-21|Board game café|entertainment|28|expense
2026-11-22|Gas — Shell|transport|48.60|expense
2026-11-23|Brunch with friends|dining|54.20|expense
2026-11-24|Costco run|groceries|98.60|expense
2026-10-01|Salary — Maya Alvarez|income|4850|income
2026-10-01|Salary — Jordan Alvarez|income|4200|income
2026-10-01|Rent — Alvarez household|housing|1850|expense
2026-10-01|Transfer to savings|savings|500|expense
2026-10-03|Whole Foods Market|groceries|141.10|expense
2026-10-05|Electric — City Power|utilities|98.60|expense
2026-10-06|Gas — Shell|transport|52.30|expense
2026-10-08|Trader Joe's|groceries|88.90|expense
2026-10-10|Internet — NorthLink|utilities|79.99|expense
2026-10-11|Sushi night|dining|61|expense
2026-10-12|Costco run|groceries|198.40|expense
2026-10-14|Movie night — cinema|entertainment|32|expense
2026-10-15|Kids soccer fees|kids|85|expense
2026-10-17|Gas — Chevron|transport|44.70|expense
2026-10-19|Whole Foods Market|groceries|126.30|expense
2026-10-20|Dentist checkup|health|45|expense
2026-10-22|Thai takeout|dining|38.50|expense
2026-10-24|Household goods|shopping|61.40|expense
2026-10-26|Farmers market|groceries|52.80|expense
2026-10-28|Rideshare|transport|19.80|expense
`.trim();

function parseSeed(table) {
  return table.split('\n').map((line, i) => {
    const [date, desc, cat, amount, type] = line.split('|');
    return { id: 'seed-' + String(i + 1).padStart(3, '0'), date, desc, cat, amount: Number(amount), type };
  });
}

function freshState() {
  return { version: 1, month: '2026-11', budgets: { ...SUGGESTED }, transactions: parseSeed(SEED_TABLE) };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshState();
    const saved = JSON.parse(raw);
    const ok = saved && Array.isArray(saved.transactions) && saved.budgets && typeof saved.month === 'string';
    return ok ? saved : freshState();
  } catch {
    return freshState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return freshState();
}

// ---- small pure helpers: state in, numbers out ----

export function monthOf(dateStr) {
  return dateStr.slice(0, 7);
}

function monthDate(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1);
}

export function prettyMonth(key) {
  return monthDate(key).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function shortMonth(key) {
  return monthDate(key).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function monthsIn(state) {
  return [...new Set(state.transactions.map((t) => monthOf(t.date)))].sort();
}

export function rowsForMonth(state, month) {
  const rows = state.transactions.filter((t) => monthOf(t.date) === month);
  rows.sort((a, b) => (b.date === a.date ? (b.id < a.id ? -1 : 1) : (b.date < a.date ? -1 : 1)));
  return rows;
}

export function monthTotals(state, month) {
  const rows = rowsForMonth(state, month);
  let income = 0;
  let spent = 0;
  for (const t of rows) {
    if (t.type === 'income') income += t.amount;
    else spent += t.amount;
  }
  return { income, spent, left: income - spent, count: rows.length };
}

export function spendByCategory(state, month) {
  const totals = {};
  for (const c of CATEGORIES) totals[c.id] = 0;
  for (const t of rowsForMonth(state, month)) {
    if (t.type === 'expense' && t.cat in totals) totals[t.cat] += t.amount;
  }
  return totals;
}

export function budgetSum(state) {
  return Object.values(state.budgets).reduce((sum, v) => sum + v, 0);
}

export function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function fmtMoney0(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}

export function freshId(state) {
  let n = state.transactions.length + 1;
  let id = 'u' + String(n).padStart(3, '0');
  while (state.transactions.some((t) => t.id === id)) {
    n += 1;
    id = 'u' + String(n).padStart(3, '0');
  }
  return id;
}

export function daysIn(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}
