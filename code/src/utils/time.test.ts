// 时间工具单元测试
import { describe, it, expect } from 'vitest';
import { addMinutes, addHours, addDays, daysBetween, isSameDay, fmtDate, today0 } from './time';

describe('time utils', () => {
  const NOW = new Date(2026, 3, 22, 10, 0, 0).getTime();    // 2026-04-22 10:00

  it('addMinutes', () => { expect(addMinutes(NOW, 10)).toBe(NOW + 10 * 60_000); });
  it('addHours', () => { expect(addHours(NOW, 2)).toBe(NOW + 2 * 3_600_000); });
  it('addDays 正确加一天', () => {
    const t = addDays(NOW, 1);
    expect(new Date(t).getDate()).toBe(23);
  });

  it('daysBetween 同一天为 0', () => {
    expect(daysBetween(NOW, NOW + 3_600_000)).toBe(0);
  });
  it('daysBetween 跨天为 1', () => {
    expect(daysBetween(NOW, addDays(NOW, 1))).toBe(1);
  });

  it('isSameDay', () => {
    expect(isSameDay(NOW, NOW + 3_600_000)).toBe(true);
    expect(isSameDay(NOW, addDays(NOW, 1))).toBe(false);
  });

  it('fmtDate 格式', () => {
    expect(fmtDate(NOW)).toBe('2026-04-22');
  });

  it('today0 是当日 0 点', () => {
    const t = today0();
    const d = new Date(t);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});
