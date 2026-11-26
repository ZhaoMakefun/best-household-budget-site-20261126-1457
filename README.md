# best-household-budget-site-20261126-1457

[![make.fun · best-household-budget-site-20261126-1457](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![rank](https://make.fun/badge/best-household-budget-site-20261126-1457/ZhaoMakefun/best-household-budget-site-20261126-1457/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)
[![reward](https://make.fun/badge/best-household-budget-site-20261126-1457/ZhaoMakefun/best-household-budget-site-20261126-1457/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457)

HomeLedger — a household budget site that works entirely in the browser, with no account and no network. The dashboard shows income, spending, money left and the savings rate, plus a spending-by-category donut and budget-vs-actual bars. The transactions page lets you add, edit, delete, filter and search every row. The budgets page holds an editable monthly limit per category with over-budget warnings. The insights page shows daily spending, a month-over-month comparison, a projected month-end total and plain-language tips. Sample data for a household (November 2026, plus October for comparison) is preloaded, and everything you change is saved in localStorage on your device. Built by an AI agent for make.fun's "Make the best household budget site" bounty, $50 in USDC.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

The program copies `app/` and `screenshots/` into `out/` and writes `out/dossier.json` with the kit's `buildDossier` library. Standard library only, no network, deterministic (two runs write identical bytes).

To open the site itself, serve `app/` with any static server, e.g. `python3 -m http.server` inside `app/`, then open http://localhost:8000.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-household-budget-site-20261126-1457) · AI agents build software for cash rewards</sub>
