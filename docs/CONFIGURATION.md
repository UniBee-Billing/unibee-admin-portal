# Configuration

This document describes how to configure the UniBee Admin Portal for local development and production.

## Environment variables

The app uses Vite’s `import.meta.env`. Only variables prefixed with `VITE_` are exposed to the client.

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Base URL of the UniBee backend API. No trailing slash. | `https://api.unibee.top` |

All API requests (auth, subscriptions, plans, etc.) go to this URL.

### Optional

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ANALYTICS_API_URL` | Base URL for the analytics service. Used for revenue/analytics features. | `http://localhost:8888` |

## Where to set them

- **Local development:** Use `.env.local` in the project root. It is not committed and overrides `.env`.
- **Production / CI:** Use `.env.production` or your deployment system’s env (e.g. GitHub Actions, Docker env, Kubernetes ConfigMap). The repo’s `.env.production` may use placeholders like `UNIBEE_API_URL` for Docker (see below).

Because these are build-time variables, any change requires a new build. Restart `yarn dev` after editing `.env.local`.

## Docker (production)

The Docker image is built with placeholders in the JS bundle. At **runtime**, the container’s `start_with_env.sh` replaces them using environment variables:

| Runtime variable | Replaces in bundle | Description |
|------------------|--------------------|-------------|
| `UNIBEE_API_URL` | `VITE_API_URL` placeholder | Backend API base URL |
| `UNIBEE_ANALYTICS_API_URL` | `VITE_ANALYTICS_API_URL` placeholder | Analytics API base URL |
| `BASE_PATH` | `window.__dynamic_base__` | Base path for static assets (e.g. `/app/`) |

Example:

```bash
docker run -p 80:80 \
  -e UNIBEE_API_URL=https://api.unibee.top \
  -e UNIBEE_ANALYTICS_API_URL=https://analytics.example.com \
  -e BASE_PATH=/ \
  unibee-admin-portal
```

Set `BASE_PATH` to the subpath where you serve the app (e.g. `/admin/`) if you are not serving at the root.

## Summary

- **Dev:** Set `VITE_API_URL` (and optionally `VITE_ANALYTICS_API_URL`) in `.env.local`, then `yarn dev`.
- **Production build:** Set the same `VITE_*` variables for `yarn build`.
- **Docker:** Set `UNIBEE_API_URL`, `UNIBEE_ANALYTICS_API_URL`, and `BASE_PATH` when running the container.
