# AGENTS.md

This repository contains two separate runtimes:

- a Vite + React frontend in the project root (`src/`)
- an Express + Mongoose backend in `backend/`

Use the project documentation as the source of truth for domain rules and schema decisions:

- [README.md](README.md)
- [docs/DB_SCHEMA.md](docs/DB_SCHEMA.md)

## Project layout

- `src/`: frontend application. Main entry points are `src/main.tsx` and `src/App.tsx`; UI patterns live under `src/components/`.
- `backend/src/`: backend API code. Route and controller boundaries are split by domain: auth, client, store, and admin.
- `backend/src/server.js`: Express startup file and API mount points.
- `docs/`: database and product documentation.

## Working conventions

- Keep frontend and backend concerns separate. Do not mix Vite UI code with Express API logic.
- Treat the backend as the source of business rules and data access. Keep API routes under `/api/v1/*` and preserve existing controller/route boundaries.
- Prefer the existing component structure and naming patterns in `src/components/` when adding UI.
- For bookings and commerce logic, respect the project’s Oman-focused domain rules: OMR currency, customer/store/admin separation, and location-aware store behavior.
- When making schema or API changes, update the relevant docs and any frontend callers that depend on the contract.

## Commands

Run these from the project root unless noted otherwise:

```bash
npm install
npm run dev -- --host 0.0.0.0 --port 3000
npm run build
npm run check
npm run test
```

Backend commands:

```bash
npm --prefix backend install
npm --prefix backend start
npm --prefix backend run dev
npm --prefix backend run bootstrap:admin
npm --prefix backend run db:seed
npm --prefix backend run db:seed:admin-team
npm --prefix backend run db:seed:store-demo
npm --prefix backend run db:seed:story-qa
npm --prefix backend run db:seed:marketing
```

## Typical task guidance

- Frontend change: update the relevant React component, then validate with `npm run build` or the local Vite flow.
- Backend change: keep the Express route/controller hierarchy intact and validate the server startup path.
- Schema or domain logic change: review [docs/DB_SCHEMA.md](docs/DB_SCHEMA.md) and align any new fields or business rules with that documentation.
- Product/domain behavior: prefer the business context described in [README.md](README.md) over ad hoc assumptions.

## Avoid

- Do not duplicate the same logic in both frontend and backend when a single API contract should own it.
- Do not hardcode a different currency or region convention than the existing Omani DealBox flow.
- Do not introduce broad refactors in the same change as feature work unless the task explicitly requires it.
