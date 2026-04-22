// 专注运行时 store - 番茄钟计时器状态，支持本地断点续跑
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface FocusState {
  running: boolean;
  mode: 'countdown' | 'stopwatch' | 'pomodoro';
  plannedMs: number;
  elapsedMs: number;
  startAt: number;
  strictMode: boolean;
  title: string;
  onRest: boolean;
  pomodoroCount: number;
  start: (opts: { mode: FocusState['mode']; plannedMs: number; title: string; strict?: boolean }) => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const DEFAULT_PLANNED_MS = 25 * 60_000;

export const useFocusStore = create<FocusState>()(persist((set, get) => ({
  running: false,
  mode: 'pomodoro',
  plannedMs: DEFAULT_PLANNED_MS,
  elapsedMs: 0,
  startAt: 0,
  strictMode: false,
  title: '',
  onRest: false,
  pomodoroCount: 0,
  start(opts) {
    set({
      running: true,
      mode: opts.mode,
      plannedMs: opts.plannedMs,
      elapsedMs: 0,
      startAt: Date.now(),
      title: opts.title,
      strictMode: !!opts.strict,
      onRest: false,
      pomodoroCount: 0
    });
  },
  tick() {
    if (!get().running) return;
    set(state => ({ elapsedMs: Date.now() - state.startAt }));
  },
  pause() {
    if (!get().strictMode) set({ running: false });
  },
  resume() {
    set({ running: true, startAt: Date.now() - get().elapsedMs });
  },
  stop() {
    set({
      running: false,
      mode: 'pomodoro',
      plannedMs: DEFAULT_PLANNED_MS,
      elapsedMs: 0,
      startAt: 0,
      strictMode: false,
      title: '',
      onRest: false,
      pomodoroCount: 0
    });
  }
}), {
  name: 'aix-focus-runtime',
  storage: createJSONStorage(() => localStorage),
  partialize: state => ({
    running: state.running,
    mode: state.mode,
    plannedMs: state.plannedMs,
    elapsedMs: state.elapsedMs,
    startAt: state.startAt,
    strictMode: state.strictMode,
    title: state.title,
    onRest: state.onRest,
    pomodoroCount: state.pomodoroCount
  })
}));
