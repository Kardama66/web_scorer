# SitePulse - Website Audit Demo SaaS

Demo SaaS that scores websites using a local Node + Express backend (Puppeteer + Lighthouse) and an Angular 21 standalone frontend.

## Prerequisites

- Node.js 20+ and npm
- A Chrome/Chromium-compatible environment (Puppeteer downloads Chromium on install)

## Setup

```bash
npm install
```

Optional: create a local env file for the backend:

```bash
copy backend\.env.example backend\.env
```

## Run locally

```bash
npm run dev
```

- Frontend: http://localhost:4200
- Backend: http://localhost:3001

The frontend proxies `/api` requests to the backend in dev mode.

## Project structure

- `frontend/` Angular 21 standalone app
- `backend/` Express + TypeScript audit service
- `shared/` shared API types

## Notes on Lighthouse/Puppeteer

- Puppeteer downloads Chromium during `npm install` (make sure your environment allows it).
- Some environments require additional system dependencies for headless Chrome.
- Increase `TIMEOUT_MS` or `LIGHTHOUSE_TIMEOUT_MS` in `backend/.env` for slower sites.
- Set `FAST_MODE=true` to speed up audits by skipping heavy resources during the DOM scan.
- Set `LIGHTHOUSE_ENABLED=false` to skip Lighthouse entirely (still returns heuristic scores).

## Tests

```bash
npm run test
```
