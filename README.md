# TransitOps — Smart Transport Operations Platform

A fleet operations console: vehicle & driver registry, trip dispatch with
business-rule validation, maintenance workflow, fuel/expense tracking, and
a KPI dashboard with charts + CSV reports.

Built for an 8-hour hackathon. Stack: **FastAPI + SQLAlchemy + SQLite**
(backend) and **React + Vite + Tailwind + Recharts** (frontend).

> SQLite is used instead of Postgres so it runs with zero setup on a judge's
> laptop. To switch to Postgres, change `SQLALCHEMY_DATABASE_URL` in
> `backend/app/database.py` — no other code needs to change.

## Quick start

### 1. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

python3 -m app.seed             # creates transitops.db + demo data
uvicorn app.main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://127.0.0.1:5173 (Vite proxies `/api` to `localhost:8000`, see `vite.config.js`)

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Fleet Manager | fleet@transitops.io | fleet123 |
| Safety Officer | safety@transitops.io | safety123 |
| Financial Analyst | finance@transitops.io | finance123 |
| Administrator | admin@transitops.io | admin123 |

The login screen also has one-click buttons to fill these in.

## What's implemented (mandatory deliverables)

- **RBAC auth** — JWT login, 4 roles, sidebar + write actions gated per role
  (`app/auth.py: require_roles`).
- **Vehicle & Driver CRUD** — unique registration/license numbers enforced.
- **Trip lifecycle** — Draft → Dispatched → Completed / Cancelled, with the
  validations from the spec: capacity vs cargo weight, vehicle/driver
  availability, license expiry, suspended drivers. See `routers/trips.py`.
- **Automatic status transitions** — dispatch flips vehicle+driver to
  `on_trip`; complete/cancel returns them to `available`; opening a
  maintenance record flips the vehicle to `in_shop` and pulls it from the
  dispatch dropdown; closing maintenance returns it (unless retired).
- **Maintenance workflow**, **fuel/expense logging**, **dashboard KPIs +
  charts** (trips/month, fuel trend, fleet status, vehicle usage), and
  **Reports** with fuel efficiency, fleet utilization, and Vehicle ROI, with
  CSV export for both the fleet and trip reports.

## Judging the trip business rules quickly

Log in as Fleet Manager → **Trips → + New trip**. The vehicle and driver
dropdowns only list what's actually available (or with a valid, non-expired
license). Try to overload cargo past a vehicle's capacity — the backend
rejects it with a clear message either way, even if you hit the API directly.

## Project structure

```
backend/
  app/
    models.py       SQLAlchemy models + status enums
    schemas.py       Pydantic request/response models
    auth.py           JWT + password hashing + RBAC dependency
    routers/          One router per module (vehicles, drivers, trips, ...)
    seed.py           Demo data
frontend/
  src/
    pages/            One page per module
    components/       Sidebar, Topbar, shared UI primitives
    context/           Auth state
    api/client.js      Axios instance with JWT header
```

## Bonus features not implemented (by design, to protect the deadline)

PDF export, email reminders for expiring licenses, dark mode. The license
expiry is already surfaced visually (amber/red) on the Drivers page as a
lower-effort substitute for email reminders.
