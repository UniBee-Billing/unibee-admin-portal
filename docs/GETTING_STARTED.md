# Getting started with UniBee Admin Portal

This guide walks you through setting up the Admin Portal so you can run it locally and connect it to a UniBee backend.

## What you need

- **Node.js** 18+ (20 recommended)
- **Yarn** (classic)
- A **UniBee API** instance (your own or a demo) so the app has something to talk to

## Step 1: Clone and install

```bash
git clone https://github.com/UniBee-Billing/unibee-admin-portal
cd unibee-admin-portal
yarn install
```

Do not use `npm install`; the project is set up for Yarn.

## Step 2: Set environment variables

Create a file named `.env.local` in the project root:

```env
VITE_API_URL=https://api.unibee.top
```

Replace `https://api.unibee.top` with your UniBee backend base URL (no trailing slash). If you run the backend locally, it might be something like `http://localhost:8080`.

Optional: if you use the analytics feature, add:

```env
VITE_ANALYTICS_API_URL=http://localhost:8888
```

Save the file. These variables are read at **build time** by Vite, so you must restart the dev server after changing them.

## Step 3: Start the dev server

```bash
yarn dev
```

Open **http://localhost:5175** in your browser. You should see the UniBee Admin Portal login page (or dashboard if you are already logged in).

## Step 4: Log in

Use the same credentials you use for the UniBee backend. The app sends requests to `VITE_API_URL` and stores the session token in the browser. If the backend is not reachable or returns errors, check:

- `VITE_API_URL` is correct and has no trailing slash
- The backend is running and CORS allows your dev origin (e.g. `http://localhost:5175`)

## Next steps

- **Configuration:** See [Configuration](CONFIGURATION.md) for all environment variables and deployment options.
- **Development:** See [Development](DEVELOPMENT.md) for scripts, linting, and how to contribute.

You can now complete a basic integration: run the app, point it at your UniBee API, and use the UI to manage subscriptions, plans, and customers.
