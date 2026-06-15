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

### Phase 3 — The flagship: ML risk forecast  ⭐
- A small Python (FastAPI) service that learns risk per
  **(location cell × hour-of-day × day-of-week)** from the fused dataset.
- Start explainable (kernel-density / Poisson baseline), then upgrade to a
  gradient-boosted model (XGBoost) and compare.
- Make time-of-day actually matter (see the Phase 2 limitation): introduce a
  learned or criminological time-of-day prior so the score moves with the hour.
- Serve a **live, time-aware risk heat-layer** on the map plus a "Risk: 34/100"
  score that changes with the time of day.
- *Why:* this is the centrepiece — real, explainable machine learning.

### Phase 4 — The AI agent (built on Phase 3)
- Replace the single chat box with a real **agent loop** (tool use + memory).
- Tools: query incidents, fetch police data, get directions, call the risk model.
- Two flagship interactions:
  - **Safest route, not fastest** — routes scored against the risk model.
  - **Ask your data** — natural language → real database query → chart.

### Phase 5 — Companion features
- User accounts (saved routes, personal alerts, "my reports").
- Proactive, location-aware alerts ("a high-severity report just appeared nearby").
- Agentic report triage — auto-classify, de-duplicate, and validate new reports.
- Weekly AI safety digest for the community.

---

## Design principle

**Depth over breadth.** One accurate, explainable risk model and one genuine
agent are worth more than ten shallow chatbots. Every feature must serve the
*windshield* vision — predict and act, don't just report the past.
