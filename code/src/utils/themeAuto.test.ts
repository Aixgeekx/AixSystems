import { describe, expect, it } from 'vitest';
import { clockToMinutes, isDayThemeTime, normalizeClock, resolveAutoTheme, sanitizeThemeKey } from './themeAuto';

describe('themeAuto utils', () => {
  it('normalizeClock 会补零并兜底非法时间', () => {
    expect(normalizeClock('7:5')).toBe('07:05');
    expect(normalizeClock('99:99', '08:00')).toBe('08:00');
  });

  it('clockToMinutes 能正确换算分钟', () => {
    expect(clockToMinutes('07:30')).toBe(450);
  });

  it('白天区间内会命中日间主题', () => {
    expect(isDayThemeTime(new Date(2026, 3, 22, 9, 0), '07:00', '19:00')).toBe(true);
    expect(resolveAutoTheme(new Date(2026, 3, 22, 9, 0), 'forest', 'cyberpunk', '07:00', '19:00')).toBe('forest');
  });

  it('夜间区间会命中夜间主题', () => {
    expect(isDayThemeTime(new Date(2026, 3, 22, 22, 0), '07:00', '19:00')).toBe(false);
    expect(resolveAutoTheme(new Date(2026, 3, 22, 22, 0), 'forest', 'cyberpunk', '07:00', '19:00')).toBe('cyberpunk');
  });

  it('sanitizeThemeKey 会兜底不存在的主题', () => {
    expect(sanitizeThemeKey('not-exists', 'night')).toBe('night');
  });
});
