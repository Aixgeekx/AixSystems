# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This workspace is **not a single codebase** — it is a multi-directory project with distinct parts:

| Directory | Purpose |
|---|---|
| `code/` | Web application source (Vite + React + TypeScript + Ant Design) |
| `desktop/` | Electron shell packaging the web app for Windows desktop |
| `Aix_tools/` | Agent-authored helper scripts, build tools, project docs |
| `title/` | Research materials, raw scraped data, investigation notes |
| `data/` | Local backup JSON files (Electron writes here; gitignored) |
| `results/` | Deliverables — `.bat` launcher scripts, packaged installers, user docs |

Two parallel guidance files live alongside this one:
- `README.md` — user-facing product documentation and version changelog (most recent in `code/README.md`).
- `AGENTS.md` — older AI-agent rule sheet that overlaps with this file. If guidance disagrees, this `CLAUDE.md` is authoritative.

## Common commands

### Web app development (`code/`)

```bash
cd code
npm install
npm run dev        # Dev server http://127.0.0.1:5173
npm run build      # tsc -b && vite build → code/dist/
npm run preview    # Preview production build on http://127.0.0.1:4173
npm test           # Run Vitest unit tests once
npm run test:watch # Run Vitest in watch mode
npx vitest run src/path/to/file.test.ts  # Run a single test file
```

There is no lint script in `code/package.json`; the verification gates are `npm test` and `npm run build`.

### Electron packaging (`desktop/`)

```bash
cd desktop
npm install
npm start                  # Launch Electron against built app
npm run dev                # Launch Electron dev mode (cross-env SGX_DEV=1 electron .)
npm run dist               # NSIS installer → desktop/dist-installer/AixSystems-{version}-Setup.exe
npm run dist:portable      # Directory portable → desktop/dist-installer/win-unpacked/
npm run dist:portable-exe  # Single-file portable .exe → AixSystems-{version}-portable.exe
```

`npm run dist*` requires `cd code && npm run build` first — `electron-builder` reads `code/dist/` via the `extraResources` mapping (`from: "../code/dist", to: "app-dist"`).

### Windows launch scripts (from `results/`)

The `results/` directory contains `.bat` scripts for everyday use. **Do not edit `.bat` files directly** — they must remain GBK-encoded. See "Encoding rules" below.

| Script | Purpose |
|---|---|
| `results/启动.bat` | Build + browser preview |
| `results/开发.bat` | Start Vite dev server |
| `results/桌面版.bat` | Launch Electron production build |
| `results/桌面版-开发.bat` | Launch Electron dev mode (`SGX_DEV=1`) |
| `results/打包.bat` | Build NSIS installer |
| `results/打包-便携版.bat` | Build directory portable package |
| `results/打包-单文件便携版.bat` | Build single-file portable `.exe` |
| `results/创建桌面快捷方式.bat` | Drop a Windows desktop shortcut (calls the `.ps1`) |
| `results/_诊断.bat` | Environment diagnostics |

## High-level architecture

### Technology stack

- **Build**: Vite 5 with `@vitejs/plugin-react` (`base: './'` so the same bundle works under `http(s)` and `file://`)
- **Frontend**: React 18 + TypeScript 5.6 (strict) + Ant Design 5 (zh_CN locale)
- **Database**: Dexie 4 (IndexedDB wrapper) — 18 tables, schema in `src/db/index.ts`
- **State**: Zustand (`src/stores/settingsStore.ts`, `appStore.ts`, etc.)
- **Routing**: React Router v6 with `HashRouter` (works under `file://` for Electron); paths centralized in `src/config/routes.ts`
- **Rich text**: TipTap 3 (`@tiptap/starter-kit` + image/link/placeholder)
- **Time/calendar**: dayjs + lunar-javascript + rrule (RFC 5545 recurrence)
- **Charts**: ECharts 5 + `echarts-for-react`
- **Drag-and-drop**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Testing**: Vitest with jsdom

### Data layer

All data lives locally in the browser's IndexedDB. There is **no backend server**.

- **Singleton**: `src/db/index.ts` exports `db` (instance of `ShiguangxuDB extends Dexie`); DB name and `version()` come from `src/config/constants.ts` (`DB_NAME`, `DB_VERSION`).
- **18 tables**: `items`, `classifies`, `folders`, `tags`, `diaries`, `memos`, `focusSessions`, `focusRepeats`, `reminderQueue`, `themes`, `settings`, `userProfile`, `eventLog`, `cacheKv`, `attachments`, `habits`, `habitLogs`, `goals`.
- **Models**: `src/models/index.ts` — TypeScript interfaces for every table row.
- **Reactivity**: hooks like `useItems()` use `useLiveQuery` from `dexie-react-hooks` to auto-rerender on DB changes.
- **Seeding**: `src/db/seed.ts` exposes `seedIfEmpty()`; runs from `App.tsx` on first load to populate built-in classifications, themes, and user profile.

The unified `Item` model supports 17 item types (schedule / checklist / birthday / anniversary / countdown / festival / period / credit card / loan / medicine / wakeup-alarm / sleep-alarm / routine / running / reading / clothing / course / work-clock).

### Routing and page structure

`src/App.tsx` defines the `HashRouter` with **lazy-loaded** route components (60+ pages). All path strings are centralized in `src/config/routes.ts` (`ROUTES.*`) and grouped for the sidebar in the same file (`MENU_GROUPS`). When adding a route, register it in **both** `routes.ts` and `App.tsx` and consider adding it to a `MENU_GROUPS` group.

Top-level routes worth knowing:
- `/home/today/myDay` — default start page
- `/home/index` — dashboard workbench
- `/home/aix` — Aix 主入口 (skill catalog + provider routing)
- `/home/agent` — Agent 中枢 (local agent task branches)
- `/home/matter/importance` — Eisenhower matrix (drag-and-drop)
- `/home/diary/calendar`, `/home/memo` — diary & memos
- `/home/absorbed/tomatoAbsorbed` — focus / pomodoro
- `/home/desktop/dayPlugin` — floating desktop widget
- `/home/growth` — growth dashboard (with 16+ deep-analysis sub-pages: `focusStats`, `habitStats`, `weeklyReview`, `annualReview`, …)
- `/home/habit`, `/home/goal`, `/home/review` — growth core
- `/unlock` — app lock screen

`AppShell` enforces the app lock: if `appLocked` is true and `sessionStorage.unlocked !== '1'`, it redirects to `/unlock`.

### Reminder system

`src/hooks/useReminder.ts` mounts at the app root and polls `reminderQueue` every `REMINDER_POLL_MS` (30 s). When a row's `fireAt` is reached, it triggers a browser `Notification` and marks `fired=true`.

After any item save, `rescheduleItemReminders(itemId)` rebuilds queue entries from `item.reminders`. Memory-curve recurrences (the v0.22.0 feature) take a special path through `buildMemoryCurveReminderPlan` in `src/utils/rrule.ts`, generating 1/2/4/7/15/30-day review reminders.

### Theme system

27 built-in themes live in `src/config/themes.ts`. `settingsStore` manages manual selection, automatic day/night switching (configurable time windows; checked once per minute), brightness, blur and custom font.

### Configuration centralization

All static constants (app name, version, DB name/version, max reminders, poll intervals, built-in classifications, focus modes, week/month labels, importance labels) live in `src/config/constants.ts` — **never duplicate these values elsewhere**. The web app version is the `APP_VERSION` constant; the desktop shell version is in `desktop/package.json` (kept in sync with web each release).

### Electron integration

The Electron main process (`desktop/main.cjs`) loads `code/dist/index.html` (or `app-dist/index.html` once packaged). The renderer talks to native code only through `desktop/preload.cjs`, which exposes `window.sgx` via `contextBridge`:

| `window.sgx.*` | Purpose |
|---|---|
| `isElectron`, `platform`, `getVersion()` | Environment introspection |
| `saveBackup(json)`, `pickImport()`, `openDataDir()` | JSON backup IO into `data/` |
| `getStorageStats()`, `getSystemSnapshot()`, `getSystemManagerPlan()` | Read-only system metrics |
| `scanSystemControl()`, `getEmergencyToolkit()` | Read-only diagnostics |
| `getPowerShellPresets()`, `runPowerShellPreset(preset)` | Whitelisted PowerShell 7 presets only — no arbitrary commands |

Renderer code must always check `window.sgx` exists before calling — the same bundle runs unchanged in a normal browser. Never add a new `window.sgx.*` method that accepts arbitrary user-supplied commands; keep it whitelist-driven.

**Portable userData redirect**: when `desktop/main.cjs` finds `AixSystems.portable` or `portable.flag` next to the `.exe` (or `PORTABLE_EXECUTABLE_DIR` is set), it forces `app.setPath('userData', <exe-dir>/userData)` so portable installs keep their data alongside the binary.

### Aix model integration

The local-first product gains an optional cloud-model layer when the user provides an API endpoint.

- **Central caller**: `src/utils/aixModel.ts` — `callAixModel(config, messages)` POSTs to the user-configured URL. `inferAixProtocol(url)` auto-detects OpenAI / Claude (`/v1/messages`, anthropic) / Ollama (`11434`); `buildAixBody` adapts the body shape (`max_tokens` for Claude); `probeAixProvider` returns `{ ok, latency, error }` for health checks.
- **Local settings**: `src/stores/settingsStore.ts` persists `aixApiUrl`, `aixApiKey`, `aixModel` and provider presets/history into the `settings` table only. **Never log, copy, or commit API keys.**
- **Configuration UI**: system settings page exposes API URL, optional Bearer key, and model name; cc-switch-style provider preset switcher and health-check live there too.
- **Consumers**: home dashboard assistant, growth dashboard 30-day simulator, and Aix 中枢 / Agent 中枢 pages call the model and fall back to local heuristics when the endpoint is missing or fails.

### Build output splitting

`vite.config.ts` configures `manualChunks` for code splitting:
- `react-core` — React + ReactDOM + React Router
- `data-layer` — Dexie
- `charts` — ECharts (+ wrapper)
- `editor` — TipTap + ProseMirror

Combined with the lazy-loaded routes, this keeps the offline portable build's first paint small.

## Encoding rules (critical for Windows)

| File type | Required encoding |
|---|---|
| `.bat` | **GBK (CP936)**, no BOM |
| `.ps1` | **UTF-8 with BOM** |
| `.py`, `.ts`, `.tsx`, `.md` | UTF-8 (no BOM) |

`.bat` files must not be edited directly in editors that default to UTF-8 — Chinese characters corrupt and `cmd.exe` mis-parses lines. To modify batch scripts, edit `Aix_tools/rebuild_bats.py` and run `python Aix_tools/rebuild_bats.py` to regenerate them.

## Pre-commit workflow

- **Frontend changes**: `cd code && npm test`, then `cd code && npm run build`.
- **Desktop changes**: build the frontend first (`cd code && npm run build`), then `cd desktop && npm run dist` (or `dist:portable` / `dist:portable-exe`).
- **Desktop dev mode**: `cd desktop && npm run dev` (uses `cross-env SGX_DEV=1 electron .`).
- **Version alignment**: when bumping a release, keep `code/package.json#version`, `code/src/config/constants.ts#APP_VERSION`, and `desktop/package.json#version` in lock-step. The README changelog gets a matching entry.

## Coding conventions

- **TypeScript**: strict mode (`code/tsconfig.json`); no implicit any.
- **Formatting**: 2-space indent, semicolons, single quotes, no formal linter — emulate nearby files.
- **Naming**: PascalCase for UI components (`ItemCard.tsx`), lowercase for page directories (`home/`, `diary/`).
- **UI**: prefer Ant Design 5 components; do not write raw HTML/CSS for primitives.
- **Time & dates**: always use `dayjs`, `lunar-javascript`, or `rrule`. **Never use native JS `Date`** to avoid timezone/offset edge cases.
- **Reuse**: use existing utilities in `src/utils/` (e.g. `aixModel`, `notify`, `rrule`, `crypto`, `themeAuto`) rather than rewriting shared logic.
- **Comments**: minimal — only when the why is non-obvious. The repo style places single-line comments to the right of a line and one-line file/function headers; emulate this rather than writing block JSDoc.

## Testing

Tests use Vitest with jsdom (`code/vitest.config.ts`):
- Test files: `src/**/*.test.ts` and `src/**/*.test.tsx`
- Globals enabled
- `@/` alias resolves to `src/`

When modifying business logic (time, crypto, lunar calendar, rrule, export/import), always write or update the matching `*.test.ts(x)`.

## Security & privacy constraints

- **Local-first core**: never add server sync, authentication flows, or cloud storage unless explicitly asked. Product data stays in IndexedDB.
- **Optional model endpoint**: HTTP calls are limited to the user-configured Aix API URL; API keys are local settings only — never log them, never put them into commits, READMEs, or example configs.
- **Aix diary boundary**: Aix and the model layer must not read raw diary text. They may consume local statistics, mood tags, and non-reversible metadata only — see existing patterns in `src/pages/diary` and the analyses under `src/pages/diaryStats`/`diaryMoodTrends`.
- **Electron bridge**: renderer code accesses desktop features only through `window.sgx` and must remain safe when running in a normal browser. The PowerShell channel is whitelist-only — do not add an "exec arbitrary command" route.
- **Never commit**: anything under `data/*.json` (user backups; already in `.gitignore`), API keys, account exports, or installer artifacts (`results/*.exe`, `results/*.zip`, `desktop/dist-installer/`).

## Git & release conventions

- **Commit messages**: Conventional Commits, frequently scoped to a version bump (`feat: AixSystems v0.85.0 - ...`, `fix: ...`).
- **Documentation**: update `README.md`, `code/README.md`, and `results/使用说明.md` whenever product functionality or workflow changes.
- **Releases**: each completed iteration ships an installer + portable + source zip into `results/AixSystems-{version}-{Setup|portable|project}.{exe|zip}` and is committed as a release point.

## Important file locations

| File | Purpose |
|---|---|
| `code/src/main.tsx` | Application entry point |
| `code/src/App.tsx` | Root component: routing, lock guard, theme auto-switch |
| `code/src/config/constants.ts` | Single source for app name, version, DB version, intervals, labels |
| `code/src/config/routes.ts` | All route paths (`ROUTES.*`) and sidebar groups (`MENU_GROUPS`) |
| `code/src/config/itemTypes.ts` | 17 item type definitions |
| `code/src/config/themes.ts` | 27 themes |
| `code/src/db/index.ts` | Dexie singleton + 18-table schema |
| `code/src/db/seed.ts` | Initial data seeding (`seedIfEmpty`) |
| `code/src/models/index.ts` | All TypeScript data interfaces |
| `code/src/hooks/useItems.ts` | Reactive item queries |
| `code/src/hooks/useReminder.ts` | Reminder polling + memory-curve rescheduling |
| `code/src/stores/settingsStore.ts` | Zustand settings state (incl. Aix provider config) |
| `code/src/utils/aixModel.ts` | Multi-protocol Aix model caller + provider probe |
| `desktop/main.cjs` | Electron main process (IPC, portable redirect, system manager) |
| `desktop/preload.cjs` | `window.sgx` contextBridge surface |
| `Aix_tools/rebuild_bats.py` | Batch script regenerator (encoding-safe) |
