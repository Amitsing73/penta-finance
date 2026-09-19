# Penta — Personal Finance Dashboard

Dark-themed ledger for tracking income, expenses, counterparties, CSV import/export, and alerts. Runs entirely in the browser (no backend, no database). Data is stored in `localStorage`.

## Demo login

| Email | Password |
| --- | --- |
| `alex@penta.finance` | `demo1234` |

You can also create a new local account from the Sign up tab.

## Run in VS Code

### 1. Prerequisites

- [Node.js 20+](https://nodejs.org/) (LTS)
- [VS Code](https://code.visualstudio.com/)
- Optional: recommended extensions (`dbaeumer.vscode-eslint`, `bradlc.vscode-tailwindcss`)

### 2. Open the project

1. Unzip `penta-finance.zip`
2. In VS Code: **File → Open Folder…** and select the `penta-finance` folder (the one that contains `package.json`)

### 3. Install and start

Open the integrated terminal (`Ctrl+`` ` / `Cmd+`` `) and run:

```bash
npm install
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`). Click it, or press `Ctrl/Cmd` and click the link in the terminal.

Sign in with the demo account above.

### 4. Other commands

```bash
npm run build       # production build into dist/
npm run preview     # serve the production build
npm run typecheck   # TypeScript only
```

### 5. Reset local data

**Setting → Restore sample data** reloads the 2024 sample ledger.  
**Setting → Delete my data** wipes transactions, alerts, and uploads.

## What to try 

- Dashboard KPIs, monthly/quarterly trend, donut breakdowns
- **Budgets** — envelope caps with burn bars; edit monthly limits
- **Anomaly radar** — Odd badge when amount is 2x that person's usual average
- Search + type/status/date filters on the ledger
- **Add** a pending or failed payment → appears under **Message**
- **Export CSV** with column picker
- **Upload** a CSV (Date, Amount, Category, Status, Name)
- Switch display currency (USD / EUR / GBP / INR)

## Tech stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · React Router · TanStack Query · Recharts · Radix UI

Ledger logic lives in `src/lib/finance/engine.ts` (filter, sort, aggregate, import/export). UI is in `src/pages` and `src/components`.

## Project structure

```
src/
  components/     layout, charts, transaction table, UI primitives
  data/           sample-transactions.json (2024 seed)
  lib/finance/    types, formatting, CSV, query engine
  pages/          dashboard, ledger, wallet, analytics, upload, alerts, settings
  main.tsx        router + query client
```
