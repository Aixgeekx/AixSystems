import { DEFAULT_THEME, THEMES } from '@/config/themes';

const DEFAULT_DAY_START = '07:00';
const DEFAULT_NIGHT_START = '19:00';

export function normalizeClock(value?: string | null, fallback = DEFAULT_DAY_START) {
  if (!value) return fallback;
  const match = value.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return fallback;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) return fallback;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function clockToMinutes(value?: string | null, fallback = DEFAULT_DAY_START) {
  const normalized = normalizeClock(value, fallback);
  const [hh, mm] = normalized.split(':').map(Number);
  return hh * 60 + mm;
}

export function isDayThemeTime(now: Date | number, dayStart?: string | null, nightStart?: string | null) {
  const date = typeof now === 'number' ? new Date(now) : now;
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const dayMinutes = clockToMinutes(dayStart, DEFAULT_DAY_START);
  const nightMinutes = clockToMinutes(nightStart, DEFAULT_NIGHT_START);
  if (dayMinutes === nightMinutes) return true;
  if (dayMinutes < nightMinutes) return currentMinutes >= dayMinutes && currentMinutes < nightMinutes;
  return currentMinutes >= dayMinutes || currentMinutes < nightMinutes;
}

export function sanitizeThemeKey(themeKey?: string | null, fallback = DEFAULT_THEME) {
  return THEMES.some(item => item.key === themeKey) ? themeKey! : fallback;
}

export function resolveAutoTheme(now: Date | number, dayTheme?: string | null, nightTheme?: string | null, dayStart?: string | null, nightStart?: string | null) {
  const validDay = sanitizeThemeKey(dayTheme, 'forest');
  const validNight = sanitizeThemeKey(nightTheme, DEFAULT_THEME);
  return isDayThemeTime(now, dayStart, nightStart) ? validDay : validNight;
}
