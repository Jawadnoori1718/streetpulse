# StreetPulse

**Community-powered urban safety intelligence for Uxbridge & West London.**

StreetPulse fuses resident-submitted incident reports with real Police UK open
data on a single live map, surfaces trends through an analytics dashboard, and
answers safety questions with an AI assistant grounded in that data.

> 📍 See [ROADMAP.md](./ROADMAP.md) for where this is heading — a predictive,
> agentic safety companion (ML risk forecasting + an AI agent that routes you
> around risk).

---

## What it does

- **Live incident map** — lighting failures, physical hazards, and suspicious
  activity, pinned at street level (Google Maps).
- **Police UK overlay** — verified crime records for the Uxbridge area, pulled
  live from the official open-data API.
- **Analytics dashboard** — crime-type breakdowns, monthly trends, hotspot
  streets, area risk scoring, and case-outcome status (Chart.js).
- **AI Safety Assistant** — ask about any route, street, or area; answers are
  grounded in live community + police data, with a data-driven fallback when no
  AI key is configured.
- **GDPR-aware reporting** — anonymous by default; optional reporter email is
  write-only and never returned by the API.

---

## Tech stack

| Layer     | Technology                                                        |
|-----------|-------------------------------------------------------------------|
| Frontend  | React 18, TypeScript, Vite, Google Maps, Chart.js                 |
| Backend   | Spring Boot 3.2 (Java 17), Spring Data JPA                        |
| Database  | H2 embedded (file-based — no separate install needed)             |
| AI        | Google Gemini (optional; graceful fallback without a key)         |
| Crime data| Police UK open data API (no key required)                         |

---

## Prerequisites

- Java 17
- Maven 3.8+
- Node.js 18+
- A Google Maps JavaScript API key (for the frontend map)

> No database install is required — H2 runs embedded and creates its own file
> on first launch.

---

## Setup

### 1. Backend (terminal 1)

```bash
cd backend

# Optional: enable the Gemini-powered AI assistant.
# Without this, the app uses its built-in data-driven analysis instead.
export GEMINI_API_KEY=your_key_here

mvn clean spring-boot:run
```

The backend starts on **http://localhost:8080**. On first run it seeds ~20
sample incidents so the map and analytics aren't empty.

### 2. Frontend (terminal 2)

```bash
cd frontend
cp .env.example .env          # then add your Google Maps key
npm install
npm run dev
```

Open **http://localhost:5173**.

---

## Environment variables

| Variable                | Where           | Description                                            |
|-------------------------|-----------------|--------------------------------------------------------|
| `GEMINI_API_KEY`        | Backend env     | Google Gemini key. Optional — fallback works without it.|
| `VITE_GOOGLE_MAPS_KEY`  | `frontend/.env` | Google Maps JavaScript API key (required for the map). |
| `VITE_API_URL`          | `frontend/.env` | Backend base URL (optional; Vite proxies `/api` in dev).|

**Never commit real keys.** Secrets are supplied via environment variables and
`.env` files, which are git-ignored. `application.properties` ships with empty
defaults only.

---

## Architecture

```
Browser (React + Google Maps + Chart.js)
    |
    |  /api/*  (Vite dev proxy → no CORS issues)
    v
Spring Boot REST API (port 8080)
    |                |                    |
H2 database     Police UK API       Google Gemini API
                (data.police.uk)    (server-side only)
```

The Vite dev proxy routes `/api` calls to Spring Boot. The Gemini key is used
**server-side only** and is never exposed in client JavaScript.

---

## Data sources

- **Community reports** — submitted by users via the in-app Report form.
- **Police UK open data** — https://data.police.uk · published monthly with a
  2–3 month lag · Open Government Licence v3.0.

---

## Privacy

- Coordinates stored to ~4 decimal places (street-level, not pinpoint).
- Reporter emails are optional and **write-only** — never returned via the API.
- No tracking cookies; no location tracking.
- Police data used under the Open Government Licence v3.0.
