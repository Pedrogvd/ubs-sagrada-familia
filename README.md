# UBS Sagrada Família — Patient Management System (containerized version)

Portfolio variant of the **UBS Riacho Estado** project, fully containerized with Docker: backend, frontend, and a self-managed 3-node Elasticsearch cluster, all running in containers, with no dependency on external managed services (Bonsai, Render, Cloudflare Pages).

The goal of this project is to demonstrate hands-on Elasticsearch cluster operations (shard allocation, replicas, node-failure resilience, data persistence), as well as full containerization of a real full-stack application.

## Architecture

```
┌─────────────┐      ┌─────────────┐      ┌──────────────────────────────┐
│  frontend   │ HTTP │   backend   │ HTTP │   Elasticsearch cluster       │
│  (nginx)    │ ───► │  (Express)  │ ───► │   es01 + es02 + es03          │
│  :4200      │      │  :3000      │      │   (replicas, shards,          │
└─────────────┘      └─────────────┘      │    persistent volumes)        │
                                           └──────────────────────────────┘
```

All services run on the same Docker network (`ubs-elastic`) and reach each other by container name (`es01`, `backend`, etc).

## Tech stack

**Backend:** Node.js, Express 5, TypeScript, Elasticsearch, JWT (authentication), bcrypt (password hashing).

**Frontend:** Angular 21 (standalone components, signals, `@if`/`@for` control flow), TypeScript, SCSS, served in production via nginx.

**Infrastructure:** Docker, Docker Compose, 3-node Elasticsearch cluster with persistent volumes.

## Repository structure

- `/` — backend (REST API) + `docker-compose.yml` (orchestrates everything)
- `/ubs-frontend` — frontend (Angular)

## Features

- Role-based authentication (admin / health professional)
- Patient registration, editing, and listing — priority, chronic conditions, active/inactive status, and overdue-visit alerts
- Visit scheduling (monthly calendar), with planned and already-recorded visits
- Visit logging with clinical data (blood pressure, weight, blood glucose, referral needed)
- "Who needs a visit" screen — active patients with no visit scheduled yet
- "Users" screen (admin) — manages patients and professionals, with admin/active permissions
- Dashboard with daily indicators and monthly report (visits by outcome, ranking by community health worker, chronic conditions treated, new patients)
- Role-based access control, enforced on the backend too (not just hidden in the UI)
- Fully responsive (desktop and mobile)

## Prerequisites

- Docker Desktop installed and running

## Running the whole project (production/deploy mode)

```bash
cp .env.example .env
# edit .env and set a JWT_SECRET (a long random string — e.g. openssl rand -hex 32)

docker compose up -d --build
```

This starts 5 containers: `es01`, `es02`, `es03` (Elasticsearch cluster), `backend`, and `frontend`.

- Frontend: http://localhost:4200
- Backend: http://localhost:3000
- Elasticsearch: http://localhost:9200

### Creating the first admin user

```bash
npm install
npx tsx scripts/seedAdmin.ts
```

The temporary password is printed to the console. Use it to log in, then change it via the `PATCH /health-professionals/me/password` route.

## Local development (fast iteration, no rebuild on every change)

For day-to-day development, it's faster to run backend and frontend outside Docker (with hot-reload), keeping only Elasticsearch in Docker:

```bash
# backend
npm run dev

# frontend (in another terminal)
cd ubs-frontend
npm install
npm start
```

In this mode, `.env` should point to `ES_URL=http://localhost:9200` (instead of `http://es01:9200`, which only works from inside another container).

### Environment variables

| Variable     | Description                                                                 |
|--------------|-----------------------------------------------------------------------------|
| `JWT_SECRET` | Key used to sign and validate authentication tokens. Required — the server won't start without it. |
| `ES_URL`     | Elasticsearch address. `http://localhost:9200` outside Docker, `http://es01:9200` inside Docker (already set in `docker-compose.yml`). |

## Useful scripts

- `npx tsx scripts/seedAdmin.ts` — creates the initial admin account
- `npx tsx scripts/clearData.ts` — deletes all patients, visits, and professionals (keeps the indices)

## Data persistence

Elasticsearch data lives in named Docker volumes (`es01data`, `es02data`, `es03data`), so it survives `docker compose down` and Docker Desktop restarts (but is deleted if the volumes are explicitly removed).

## Project status

Decision history and remaining work are documented in `BACKLOG.md`.
