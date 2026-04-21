// 专注运行时 store - 番茄钟计时器状态
import { create } from 'zustand';

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

export const useFocusStore = create<FocusState>((set, get) => ({
  running: false, mode: 'pomodoro', plannedMs: 25 * 60_000, elapsedMs: 0,
  startAt: 0, strictMode: false, title: '', onRest: false, pomodoroCount: 0,
  start(opts) {
    set({
      running: true, mode: opts.mode, plannedMs: opts.plannedMs,
      elapsedMs: 0, startAt: Date.now(), title: opts.title,
      strictMode: !!opts.strict, onRest: false, pomodoroCount: 0
    });
  },
  tick() {
    if (!get().running) return;
    set(s => ({ elapsedMs: Date.now() - s.startAt }));
  },
  pause() { if (!get().strictMode) set({ running: false }); },
  resume() { set({ running: true, startAt: Date.now() - get().elapsedMs }); },
  stop() { set({ running: false, elapsedMs: 0, startAt: 0 }); }
}));
