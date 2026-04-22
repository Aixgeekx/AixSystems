// 设置 store - 从 db.settings 同步并缓存
import { create } from 'zustand';
import { db } from '@/db';
import { DEFAULT_THEME } from '@/config/themes';
import { normalizeClock, sanitizeThemeKey } from '@/utils/themeAuto';

interface SettingsState {
  theme: string;                                          // 主题 key
  themeMode: 'manual' | 'auto';
  autoThemeDay: string;
  autoThemeNight: string;
  autoThemeDayStart: string;
  autoThemeNightStart: string;
  brightness: number;
  blur: number;
  appLocked: boolean;
  appLockPasswordHash?: string;
  startPage: string;                                      // 启动页路由
  setTheme: (k: string) => Promise<void>;
  setBrightness: (n: number) => Promise<void>;
  setBlur: (n: number) => Promise<void>;
  load: () => Promise<void>;
  setKV: (k: string, v: any) => Promise<void>;
}

async function save(key: string, value: any) {
  await db.settings.put({ key, value });
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: DEFAULT_THEME,
  themeMode: 'manual',
  autoThemeDay: 'forest',
  autoThemeNight: DEFAULT_THEME,
  autoThemeDayStart: '07:00',
  autoThemeNightStart: '19:00',
  brightness: 100,
  blur: 0,
  appLocked: false,
  startPage: '/home/index',
  async load() {
    const rows = await db.settings.toArray();
    const kv: Record<string, any> = {};
    rows.forEach(r => kv[r.key] = r.value);
    set({
      theme: sanitizeThemeKey(kv.theme, DEFAULT_THEME),
      themeMode: kv.themeMode === 'auto' ? 'auto' : 'manual',
      autoThemeDay: sanitizeThemeKey(kv.autoThemeDay, 'forest'),
      autoThemeNight: sanitizeThemeKey(kv.autoThemeNight, DEFAULT_THEME),
      autoThemeDayStart: normalizeClock(kv.autoThemeDayStart, '07:00'),
      autoThemeNightStart: normalizeClock(kv.autoThemeNightStart, '19:00'),
      brightness: kv.brightness ?? 100,
      blur: kv.blur ?? 0,
      appLocked: !!kv.appLockPasswordHash,
      appLockPasswordHash: kv.appLockPasswordHash,
      startPage: kv.startPage ?? '/home/index'
    });
  },
  async setTheme(k) { await save('theme', k); set({ theme: k }); },
  async setBrightness(n) { await save('brightness', n); set({ brightness: n }); },
  async setBlur(n) { await save('blur', n); set({ blur: n }); },
  async setKV(k, v) { await save(k, v); set({ [k]: v } as any); }
}));
