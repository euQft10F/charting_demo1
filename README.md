# Performance Charting demo

A prototype dashboard comparing a Strategy against a Benchmark over a chosen Window, using synthetic Index data. Domain terms are defined in [GLOSSARY.md](GLOSSARY.md); the full spec is GitHub issue #1.

- `backend/`: FastAPI (Python 3.14, uv). Generates the synthetic Indices in memory at startup and serves the analytics.
- `frontend/`: React 19 + TypeScript + Vite + shadcn/ui. A global switcher renders every chart with Lightweight Charts, Recharts, Apache ECharts or Plotly.js; workarounds each library needed are in [docs/charting-libraries.md](docs/charting-libraries.md). The Vite dev server proxies `/api` to the backend.

## Running

Start the backend (port 8000):

```sh
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

In another terminal, start the frontend (port 5173):

```sh
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173.

## Checks

Backend:

```sh
cd backend
uv run pytest
uv run ruff check . && uv run ruff format --check .
uv run ty check
```

Frontend:

```sh
cd frontend
npm run typecheck
npm run lint
npm test
```
