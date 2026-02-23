# UniBee Admin Portal

A single-page web application that serves as the **frontend for the UniBee Billing admin and merchant management system**. Use it to manage subscriptions, plans, customers, invoices, payments, and configuration for your UniBee billing backend.

---

## Overview

The Admin Portal is the main UI for merchants and operators to:

- **Manage subscriptions:** View, create, and manage customer subscriptions and usage-based billing.
- **Configure plans and pricing:** Define products, plans, billable metrics, and discount codes.
- **Handle customers:** Manage user accounts, payment methods, promo credits, and notes.
- **Process payments and invoices:** View payments, refunds, and invoices; trigger actions (e.g. new invoice, extend subscription).
- **Configure the system:** Set up webhooks, integrations (e.g. SendGrid, VAT Sense), multi-currency, and gateway settings.

The app talks to the UniBee backend over REST. All configuration is driven by environment variables; no backend code lives in this repository.

---

## Core capabilities

| Area | Features |
|------|----------|
| **Subscriptions** | List and detail views, change plan, cancel/resume, usage events, metered billing |
| **Plans & products** | Plan list and editor, billable metrics (including metered), product catalog |
| **Customers** | User list and detail, assign subscription, payment methods, promo credits, notes |
| **Billing** | Invoices, payments, refunds, one-time purchases |
| **Configuration** | Webhooks, API keys, email (SendGrid), VAT (VAT Sense), multi-currency, gateways |
| **Other** | Discount codes, bulk discount codes, reports, activity logs, analytics (revenue) |

---

## Tech stack

- **Language:** TypeScript  
- **UI:** React 18, Ant Design 5, Tailwind CSS  
- **Build:** Vite 7  
- **State:** Zustand  
- **HTTP:** Axios (REST client for UniBee API)

The project uses **Yarn** for dependencies; use `yarn` (not `npm`) for install and scripts.

---

## Prerequisites

- **Node.js** 18 or higher (20 is used in the provided Docker image)
- **Yarn** (classic)

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/UniBee-Billing/unibee-admin-portal
cd unibee-admin-portal
yarn install
```

### 2. Configure environment

Create a `.env` file in the project root (or use `.env.local` for local development). The app needs the UniBee API base URL; analytics is optional.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Base URL of the UniBee backend API (e.g. `https://api.unibee.top` or `http://localhost:8080`) |
| `VITE_ANALYTICS_API_URL` | No | Base URL for the analytics service (e.g. `http://localhost:8888`) |

Example `.env.local`:

```env
VITE_API_URL=https://api.unibee.top
VITE_ANALYTICS_API_URL=http://localhost:8888
```

Use `.env.local` for development and `.env.production` (or your CI/deploy env) for production builds.

### 3. Run the app

```bash
yarn dev
```

The dev server runs at **http://localhost:5175** (see `vite.config.ts`).

### 4. Build for production

```bash
yarn build
```

Output is in the `dist/` folder (static assets). You can serve them with any static host or use the included Docker setup.

---

## Documentation and guides

| Document | Description |
|----------|-------------|
| [Getting started guide](docs/GETTING_STARTED.md) | Step-by-step setup and first run |
| [Configuration](docs/CONFIGURATION.md) | Environment variables and deployment options |
| [Development](docs/DEVELOPMENT.md) | Scripts, tooling, and contribution workflow |

New developers can get a basic integration running using only the README and the **Getting started** guide.

---

## Docker

You can build and run the app with Docker. The image builds the Vite app and serves it with Nginx.

**Build:**

```bash
docker build -t unibee-admin-portal .
```

**Run (production):**  
The container expects these environment variables at runtime (injected into the built JS):

- `UNIBEE_API_URL`: Backend API base URL
- `UNIBEE_ANALYTICS_API_URL`: Analytics API base URL (optional)
- `BASE_PATH`: Base path for static assets (e.g. `/app/` for subpath deployment)

Example:

```bash
docker run -p 80:80 \
  -e UNIBEE_API_URL=https://api.unibee.top \
  -e UNIBEE_ANALYTICS_API_URL=https://analytics.example.com \
  -e BASE_PATH=/ \
  unibee-admin-portal
```

---

## Project structure (high level)

```
unibee-admin-portal/
├── src/
│   ├── components/     # React UI (subscription, user, plan, settings, etc.)
│   ├── requests/       # API client and service calls (REST)
│   ├── stores/         # Zustand state
│   ├── hooks/          # Shared React hooks
│   ├── utils/          # Helpers, formatters, etc.
│   ├── routes.tsx      # App routes
│   └── main.tsx
├── docs/               # Documentation and guides
├── vite.config.ts
├── Dockerfile
└── nginx.conf          # Used by Docker serve
```

The app uses a single REST client (`src/requests/client.ts`) with `VITE_API_URL` and `VITE_ANALYTICS_API_URL`. Authentication is via `Authorization` header (merchant token in `localStorage`).

---

## Development

- Use **Yarn** for dependencies: `yarn add <package>` (do not use `npm install` for adding packages).
- Create a feature branch and open a PR into the appropriate release branch (e.g. `develop/v1.2.3`; check repo for the current target).
- Before submitting:
  - Run `yarn build`
  - Run `yarn lint` and `yarn prettier:fix` if applicable
  - Run `yarn test` if tests exist

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for more detail.

---

## Scripts

| Command | Description |
|--------|-------------|
| `yarn dev` | Start Vite dev server (port 5175) |
| `yarn build` | TypeScript check and production build; output in `dist/` |
| `yarn preview` | Preview production build locally |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Run ESLint with auto-fix |
| `yarn prettier` | Check formatting |
| `yarn prettier:fix` | Apply Prettier |
| `yarn test` | Run tests |

---

## License

AGPLv3.
