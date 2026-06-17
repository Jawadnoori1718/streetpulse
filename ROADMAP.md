# StreetPulse — Product Roadmap

## Vision

> **StreetPulse is a predictive, personal safety companion for West London.**
> It doesn't just show you where crime *happened* — it predicts where risk is
> *likely* right now, routes you around it, and acts on your behalf.

The guiding shift: **from reporting → to predicting → to acting.**

Most crime-map apps are a *rear-view mirror* (here's what already happened).
StreetPulse aims to be a *windshield*: given the **time**, the **place**, and
**you**, here's the risk right now and what to do about it.

---

## Where it stands today

A working full-stack product:

- **Frontend** — React + TypeScript + Vite, Google Maps, Chart.js analytics.
- **Backend** — Spring Boot 3.2 (Java 17), H2 embedded database.
- **Data fusion** — community incident reports **+** real Police UK open data.
- **AI assistant** — Google Gemini with a graceful data-driven fallback.

What's missing (and where this roadmap goes): the "AI" today is a single
stateless chat box, and there is no machine learning — risk is hand-weighted.
The roadmap turns that into a real predictive model and a true AI **agent**.

---

## Phases

Each phase is a self-contained, demoable increment that can be committed and
pushed independently.

### Phase 1 — Foundation & hygiene  ✅ (this commit)
- Remove the hardcoded API key from source; load secrets from the environment.
- Accurate README and documentation.
- Hardened `.gitignore` (no database files or secrets committed).
- Roadmap committed so the direction is on record.

### Phase 2 — Data foundation & risk baseline  ✅
- Widen Police UK ingestion to **12 months** of history (configurable).
- Add **time-boxed caching** so repeated pulls don't hammer the upstream API,
  with background cache warming on startup.
- Build the **explainable risk baseline**: `GET /api/risk?lat=&lng=&hour=` returns
  a 0–100 spatiotemporal score (Gaussian spatial kernel × severity × recency),
  normalised against a data-derived reference, with the contributing factors.
- **Decision:** stayed on **H2** rather than migrating to PostgreSQL + PostGIS.
  At Uxbridge data volumes the in-memory computation is fast and zero-install;
  PostGIS is recorded as a *production-scaling* upgrade for later, not a need now.
- **Known limitation found in testing:** Police UK data has no time-of-day (only
  the month), and police records vastly outnumber community reports — so the
  hour-of-day signal is weak in the baseline. The score is currently mostly
  *spatial*. Addressing this is a goal of Phase 3.

### Phase 3 — The flagship: live risk heat-map  ⭐ ✅
- `GET /api/risk/grid?hour=` scores a grid across West London in a single pass
  (event set + normalisation built once, reused for every cell).
- A **Google Maps heat-layer** driven by that grid, with a **time-of-day slider**
  (00:00–23:00) and a colour legend, on the existing map.
- *Why:* this is the centrepiece — you can watch predicted risk across the area
  and scrub it through the day.
- **Stretch / future deepening:** replace the explainable baseline with a learned
  model — a small Python (FastAPI) service training a gradient-boosted model
  (XGBoost) on **(cell × hour × day-of-week)**, plus a time-of-day prior so the
  hour signal is strong even where police data (which lacks a time of day)
  dominates. The heat-map and slider already consume a clean grid API, so this
  swaps in behind the same contract.

### Phase 4 — The AI agent  ✅  (free — Gemini function-calling)
- A real **tool-using agent loop on Google Gemini's free tier** (function calling),
  replacing the single-shot chat box. Functions the agent can call:
  - `search_incidents` — query community reports by area / category / severity
  - `get_risk_score` — call the Phase 2/3 risk model for a point and hour
  - `get_police_crimes` — summarise official Police UK data
  - `get_stats` — community report statistics
- `POST /api/ai/agent` runs the loop and returns a grounded answer with a `mode`
  flag (`agent` vs `fallback`); the assistant UI shows which answered.
- **Free and graceful:** a free `GEMINI_API_KEY` enables the real tool-using
  agent; with no key the endpoint falls back to the data-driven analysis, so the
  app always works at zero cost. (No paid API anywhere in the project.)
- **Remaining / stretch:** "safest route, not fastest" (needs the Google
  Directions API) and a "render a chart from your question" path.

### Phase 5 — Companion features  ✅ (triage + alerts)
- **Agentic report triage** (runs on every submission):
  - *Severity escalation* — text describing danger (weapon, assault, being
    followed) forces HIGH severity regardless of what the reporter selected.
  - *De-duplication* — a near-identical report (same category, within ~150m, in
    the last 48h) is merged into the existing one (upvotes it) instead of
    creating a duplicate, keeping the data clean.
- **Live alerts** — `GET /api/alerts` surfaces recent high-priority activity; a
  Live Alerts panel on the map shows it and refreshes with the data poll.
- **Deferred (deliberate):** user accounts / saved routes and a weekly AI digest.
  Accounts add real auth + security surface and are best done as a focused,
  standalone piece rather than rushed in — left as a clean future add-on so the
  rest of Phase 5 ships solid.

---

## Design principle

**Depth over breadth.** One accurate, explainable risk model and one genuine
agent are worth more than ten shallow chatbots. Every feature must serve the
*windshield* vision — predict and act, don't just report the past.
