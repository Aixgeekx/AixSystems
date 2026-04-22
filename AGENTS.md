# AI Agent Instructions for AixSystems

This file contains rules and context specifically tailored for AI coding agents working on the AixSystems app.

## Architecture & Project Structure
AixSystems is a local-first, offline time management system.
- `code/`: Vite + React 18 + TypeScript frontend (Browser App).
  - Routes in `src/pages/`, Reusable components in `src/components/`, Utilities in `src/utils/`, Zustand hooks in `src/stores/`, Dexie DB config in `src/db/`. 
- `desktop/`: Electron 31 shell, wraps the Vite build.
  - `main.cjs`: IPC handlers, `preload.cjs`: Browser bridges.
- `results/`: Windows user launch wrappers (`.bat`, `.ps1`), markdown docs.
- `data/`: JSON backups written directly to user disk. **Never commit these!**
- `Aix_tools/`: Auxiliary scripts and agent-generated tools/docs.

## AI Agent Workflow & Checklists

### 1. Build and Test Before Committing
Always test your changes by running the appropriate command. Change to the corresponding directory first!
- **Frontend changes**: 
  - Run `cd code && npm test` to ensure no Vitest regressions.
  - Run `cd code && npm run build` to verify TS types and Vite bundling.
- **Desktop changes**:
  - Run `cd desktop && npm run dist` to test Electron packaging if the desktop shell is edited. Note: This requires the frontend to be built first (`cd code && npm run build`).
  - Alternative desktop builds: `npm run dist:portable` (unstructured portable) or `npm run dist:portable-exe` (single-file portable executable).
  - Test development mode using `cd desktop && npm run dev` (uses `cross-env SGX_DEV=1 electron .`).

### 2. Coding Guidelines
- **TypeScript**: Strict typing required (per `code/tsconfig.json`).
- **Formatting**: 2-space indent, use semicolons and single quotes. Minimal comments unless the logic is complex. No formal linter is used, emulate nearby files.
- **Conventions**: PascalCase for UI components (e.g. `ItemCard.tsx`), lowercase for pages (e.g. `home`, `diary`).
- **Tech Stack**: Use Ant Design 5 (do not write raw HTML/CSS for UI elements), Dexie 4 for DB, TipTap 3 for Rich Text, and `echarts` / `@dnd-kit`.
- **Time & Dates**: Enforce usage of `dayjs`, `lunar-javascript`, and `rrule`. **Do NOT** use the native JS `Date` object to prevent offset/timezone edge cases.
- **Reuse**: Reuse existing utility modules in `src/utils/` instead of rewriting shared logic.

### 3. Modifying Business Logic
- When modifying business logic (time, crypto, lunar calendar, or export/import flows), **always write or update tests** in `*.test.ts(x)` alongside the subject files.
- AixSystems uses `jsdom` under Vitest. Mock browser state/IndexedDB appropriately.

### 4. Git & Release Workflow
- **Commit Messages**: Use Conventional Commits format (e.g., `feat: AixSystems v0.1.0 - ...`).
- **Documentation**: If the product functionality or workflow changes, update `README.md`.
- **Version Alignment**: Treat each completed iteration as a release candidate. Ensure `results/` wrappers remain aligned with scripts.

### 5. Security & Edge Cases
- **Local-First Constraints**: Do not try to introduce HTTP/Cloud network syncing unless explicitly asked. The app is zero-server, offline local.
- **Environment Bridging**: Remember that `code/` can execute bare in browser or wrapped inside Chromium for Electron. Check `window.electronAPI` safely.

### 6. File Encoding & Scripts
- **Batch Scripts (`.bat`)**: **NEVER edit `.bat` files in `results/` directly.** Editing them will mistakenly save as UTF-8, breaking execution in Windows `cmd.exe` which requires GBK (CP936). Any changes to batch wrappers must be made inside `Aix_tools/rebuild_bats.py` instead. After editing the python script, run `python Aix_tools/rebuild_bats.py` to regenerate the batch files safely.
- **PowerShell Scripts (`.ps1`)**: Use UTF-8 with BOM to remain backward compatible.
- **Application Source (`.ts`, `.tsx`, `.md`, `.py`)**: Use UTF-8 standard encoding.
