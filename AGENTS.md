# Repository Guidelines

## Project Structure & Module Organization
This repository has two app packages. `code/` contains the Vite + React + TypeScript app: keep route screens in `src/pages/`, reusable UI in `src/components/`, shared logic in `src/utils/`, hooks in `src/hooks/`, state in `src/stores/`, and IndexedDB code in `src/db/`. `desktop/` is the Electron shell. `results/` contains Windows launch/build wrappers and end-user docs. `data/` stores backup JSON and should remain untracked.

## Build, Test, and Development Commands
Run commands from the relevant package directory, not the repo root.

- `cd code && npm install && npm run dev` starts the web app at `http://127.0.0.1:5173`.
- `cd code && npm run build` runs TypeScript build checks and outputs `code/dist/`.
- `cd code && npm test` runs Vitest once; `npm run test:watch` watches.
- `cd desktop && npm install && npm run dev` launches Electron in development mode.
- `cd desktop && npm start` opens the built web bundle in Electron.
- `cd desktop && npm run dist` creates a Windows installer in `desktop/dist-installer/`.

On Windows, `results/开发.bat`, `results/桌面版-开发.bat`, `results/启动.bat`, and `results/打包.bat` wrap the same flows.

## Coding Style & Naming Conventions
Use TypeScript with the strict settings in `code/tsconfig.json`. Match the current style: 2-space indentation, semicolons, single quotes, and short comments only where logic is not obvious. React component files use PascalCase names such as `App.tsx` and `MyWeek.tsx`; route directories are lowercase such as `pages/help` and `pages/loan`. Reuse existing utility modules instead of duplicating shared logic. No formatter or lint config is checked in, so keep edits consistent with nearby files.

## Testing Guidelines
Tests use Vitest with a `jsdom` environment and live alongside source files as `*.test.ts` or `*.test.tsx`. Existing examples are under `code/src/utils/`. Add or update tests for changed business logic, especially scheduling, recurrence, crypto, and import/export paths. No coverage threshold is enforced, so test depth should match the risk of the change.

## Commit & Pull Request Guidelines
The current history uses Conventional Commit prefixes, for example `feat: AixSystems v0.1.0 - ...`. Follow the same pattern with concise subjects. Pull requests should summarize user-visible changes, list the touched areas (`code`, `desktop`, scripts), note the commands you ran, and include screenshots for UI changes in browser or Electron views.

## Security & Configuration Tips
Do not commit `data/*.json`, `.env*`, or build output. Treat import/export and desktop file-system changes carefully: this app is local-first, and Electron writes backup files directly on the user machine.
