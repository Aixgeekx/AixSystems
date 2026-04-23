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
| `data/` | Local backup JSON files (Electron writes here) |
| `results/` | Deliverables — `.bat` launcher scripts and user docs |

## Common commands

### Web app development (`code/`)

```bash
cd code
npm install
npm run dev        # Dev server http://127.0.0.1:5173
npm run build      # Production build → code/dist/
npm run preview    # Preview production build on http://127.0.0.1:4173
npm test           # Run Vitest unit tests
```

### Electron packaging (`desktop/`)

```bash
cd desktop
npm install
npm run dist                # NSIS installer → desktop/dist-installer/
npm run dist:portable       # Directory portable → desktop/dist-installer/win-unpacked/
npm run dist:portable-exe   # Single-file portable .exe
```

### Windows launch scripts (from `results/`)

The `results/` directory contains `.bat` scripts for everyday use. **Do not edit `.bat` files directly** — they must remain GBK-encoded. See "Encoding rules" below.

| Script | Purpose |
|---|---|
| `results/开发.bat` | Start Vite dev server |
| `results/桌面版.bat` | Launch Electron production build |
| `results/桌面版-开发.bat` | Launch Electron dev mode |
| `results/打包.bat` | Build NSIS installer |
| `results/打包-便携版.bat` | Build directory portable package |
| `results/_诊断.bat` | Environment diagnostics |

## High-level architecture

### Technology stack

- **Build**: Vite 5 with `@vitejs/plugin-react`
- **Frontend**: React 18 + TypeScript 5.6 + Ant Design 5 (zh_CN locale)
- **Database**: Dexie 4 (IndexedDB wrapper), 18 tables
- **State**: Zustand (`src/stores/settingsStore.ts`, `src/stores/appStore.ts`, etc.)
- **Routing**: React Router v6 with `HashRouter` (supports `file://` protocol for Electron)
- **Rich text**: TipTap 3 (`@tiptap/starter-kit` + image/link/placeholder extensions)
- **Time/calendar**: dayjs + lunar-javascript + rrule (RFC 5545 recurrence)
- **Charts**: ECharts 5 + `echarts-for-react`
- **Drag-and-drop**: `@dnd-kit/core` + `@dnd-kit/sortable`
- **Testing**: Vitest with jsdom environment

### Data layer

All data lives locally in the browser's IndexedDB. There is **no backend server**.

- **Database singleton**: `src/db/index.ts` exports `db` (instance of `ShiguangxuDB` extending Dexie)
- **Schema**: 18 tables defined in the Dexie constructor with indexed fields, including habits, habit logs, and goals for the growth system
- **Models**: `src/models/index.ts` — TypeScript interfaces for all entities (`Item`, `Diary`, `Memo`, `FocusSession`, `Classify`, `Tag`, `Folder`, etc.)
- **Reactivity**: Hooks like `useItems()` in `src/hooks/useItems.ts` use `useLiveQuery` from `dexie-react-hooks` for automatic UI updates when DB changes
- **Seeding**: `src/db/seed.ts` provides `seedIfEmpty()` — runs on app startup to create default classifications, themes, and user profile

The unified `Item` model supports 17 item types (schedule, checklist, birthday, anniversary, countdown, festival, period tracking, credit card, loan, medicine, alarm, sleep, routine, running, reading, clothing, course, work).

### Routing and page structure

`src/App.tsx` defines the `HashRouter` with lazy-loaded routes. Key routes:

- `/home/today/myDay` — "My Day" view (default start page)
- `/home/matter/all` — All items
- `/home/matter/importance` — Eisenhower matrix (drag-and-drop)
- `/home/memo` — Memos with rich text
- `/home/diary/calendar` — Diary calendar
- `/home/absorbed/tomatoAbsorbed` — Focus/timer
- `/home/desktop/dayPlugin` — Floating desktop widget
- `/home/growth` — Growth dashboard
- `/home/habit` — Habit tracker
- `/home/goal` — Goal management
- `/unlock` — App lock screen

The `AppShell` component enforces the app lock — if `appLocked` is true and session is not unlocked, redirects to `/unlock`.

### Reminder system

`src/hooks/useReminder.ts` mounts at the app root and polls the `reminderQueue` table every 30 seconds (`REMINDER_POLL_MS`). When a reminder's `fireAt` is reached, it triggers a browser `Notification` and marks the row as fired.

After any item is saved, `rescheduleItemReminders(itemId)` rebuilds that item's queue entries from its `reminders` array.

### Theme system

27 built-in themes defined in `src/config/themes.ts`. The `settingsStore` manages:
- Manual theme selection
- Auto theme switching (day/night based on configurable time windows)
- Brightness and blur adjustments

### Configuration centralization

All static constants are in `src/config/constants.ts` — app name, version, DB name/version, max reminders, pagination size, built-in classifications, focus modes, etc. Do not duplicate these values elsewhere.

### Electron integration

The Electron shell in `desktop/` loads the built web app. IPC is bridged through `desktop/preload.cjs` exposing `window.sgx` to the renderer. The web app checks `window.sgx` presence to determine if running in Electron (enables file system write for backups).

When accessing Electron APIs from the renderer, check `window.sgx` safely — `code/` runs both bare in browser and inside Chromium.

### Build output splitting

`vite.config.ts` configures `manualChunks` for code splitting:
- `react-core` — React + ReactDOM + React Router
- `data-layer` — Dexie
- `charts` — ECharts
- `editor` — TipTap + ProseMirror

## Encoding rules (critical for Windows)

| File type | Required encoding |
|---|---|
| `.bat` | **GBK (CP936)**, no BOM |
| `.ps1` | **UTF-8 with BOM** |
| `.py`, `.ts`, `.tsx`, `.md` | UTF-8 (no BOM) |

`.bat` files must not be edited directly in editors that default to UTF-8 — this causes Chinese characters to corrupt command parsing. To modify batch scripts, edit `Aix_tools/rebuild_bats.py` and run `python Aix_tools/rebuild_bats.py`.

## Pre-commit workflow

Before committing changes, run the appropriate verification command:

- **Frontend changes**: `cd code && npm test` (Vitest regressions), then `cd code && npm run build` (TypeScript + Vite bundling).
- **Desktop changes**: `cd desktop && npm run dist` (Electron packaging). Requires frontend to be built first (`cd code && npm run build`).
- **Desktop dev mode**: `cd desktop && npm run dev` (uses `cross-env SGX_DEV=1 electron .`).

## Coding conventions

- **TypeScript**: Strict mode is enabled (`code/tsconfig.json`). No implicit any.
- **Formatting**: 2-space indent, semicolons, single quotes. No formal linter — emulate nearby files.
- **Naming**: PascalCase for UI components (`ItemCard.tsx`), lowercase for page directories (`home/`, `diary/`).
- **UI**: Use Ant Design 5 components. Do not write raw HTML/CSS for UI elements.
- **Time & dates**: Always use `dayjs`, `lunar-javascript`, or `rrule`. **Never use native JS `Date`** to avoid timezone/offset edge cases.
- **Reuse**: Use existing utilities in `src/utils/` instead of rewriting shared logic.
- **Comments**: Minimal — only when logic is non-obvious. No redundant "what" comments.

## Testing

Tests use Vitest with jsdom. Configuration in `code/vitest.config.ts`:
- Test files: `src/**/*.test.ts` and `src/**/*.test.tsx`
- Globals enabled
- `@/` alias resolves to `src/`
- **Rule**: When modifying business logic (time, crypto, lunar calendar, export/import), always write or update accompanying `*.test.ts(x)` files.

## Security constraints

- **Local-first only**: Do not introduce HTTP/Cloud network syncing unless explicitly asked. The app is zero-server, offline local.
- **No backend**: There is no API server, no authentication flow, no cloud storage. All data stays in IndexedDB.

## Git & release conventions

- **Commit messages**: Use Conventional Commits (e.g. `feat: AixSystems v0.19.3 - ...`, `fix: ...`).
- **Version alignment**: Each completed iteration is a release candidate. Keep `results/` wrappers aligned with scripts.
- **Documentation**: Update `README.md`, `code/README.md`, and user-facing docs in `results/` when product functionality or workflow changes.

## Important file locations

| File | Purpose |
|---|---|
| `code/src/main.tsx` | Application entry point |
| `code/src/App.tsx` | Root component with routing, lock guard, theme auto-switch |
| `code/src/db/index.ts` | IndexedDB singleton and schema |
| `code/src/db/seed.ts` | Initial data seeding |
| `code/src/models/index.ts` | All TypeScript data interfaces |
| `code/src/config/constants.ts` | Centralized constants |
| `code/src/config/itemTypes.ts` | Item type definitions |
| `code/src/config/themes.ts` | Theme definitions |
| `code/src/hooks/useItems.ts` | Reactive item queries |
| `code/src/hooks/useReminder.ts` | Reminder polling logic |
| `code/src/stores/settingsStore.ts` | Zustand settings state |
| `desktop/main.cjs` | Electron main process |
| `desktop/preload.cjs` | Electron preload script |
| `Aix_tools/rebuild_bats.py` | Batch script generator (encoding-safe) |
