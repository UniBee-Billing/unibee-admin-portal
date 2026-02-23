# Development

Guidelines and commands for developing the UniBee Admin Portal.

## Repo and branches

- Use **Yarn** for all dependency changes: `yarn add <package>`. Do not use `npm install` for adding packages.
- Create a **feature branch** for your work. Open a **pull request** into the appropriate branch (e.g. `develop/v1.2.3`; check the repo for the current target).
- Ensure your branch is up to date with the target before submitting.

## Commands

| Command | Description |
|--------|-------------|
| `yarn dev` | Start Vite dev server at http://localhost:5175 |
| `yarn build` | Run TypeScript check and production build; output in `dist/` |
| `yarn preview` | Serve the production build locally |
| `yarn lint` | Run ESLint |
| `yarn lint:fix` | Run ESLint with auto-fix |
| `yarn prettier` | Check code formatting (Prettier) |
| `yarn prettier:fix` | Apply Prettier formatting |
| `yarn test` | Run the test suite |

Before submitting a PR, run at least:

- `yarn build`
- `yarn lint` (or `yarn lint:fix`)

and fix any errors. Run `yarn test` if the project has tests for the code you changed.

## Code style

- TypeScript and React follow the existing patterns in `src/`.
- Use the project’s Prettier and ESLint config; run `yarn prettier:fix` and `yarn lint:fix` to align with them.

## Adding features

If your pull request adds a user-facing feature or changes behavior, consider updating:

- **README.md:** Overview, capabilities, or setup steps if needed.
- **docs/:** Any of the guides (e.g. [GETTING_STARTED.md](GETTING_STARTED.md), [CONFIGURATION.md](CONFIGURATION.md)) if the change affects setup or configuration.

This keeps the docs aligned with the code and helps new developers complete a basic integration from the GitHub docs alone.
