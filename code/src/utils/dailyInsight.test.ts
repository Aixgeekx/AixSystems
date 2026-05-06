import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import { computeTodaySaturation, computeHabitStreaks, computeTomorrowAgenda } from './dailyInsight';
import type { Item, Habit, HabitLog } from '@/models';

const baseItem = (id: string, type: string, startTime: number, endTime?: number, status: 'pending' | 'done' = 'pending'): Item => ({
  id,
  type: type as any,
  title: 't-' + id,
  startTime,
  endTime,
  allDay: false,
  isLunar: false,
  reminders: [],
  completeStatus: status,
  createdAt: 0,
  updatedAt: 0
});

describe('computeTodaySaturation', () => {
  it('counts schedule-class items today and returns level', () => {
    const t9 = dayjs().startOf('day').add(9, 'hour').valueOf();
    const t10 = dayjs().startOf('day').add(10, 'hour').valueOf();
    const items = [
      baseItem('a', 'schedule', t9, t9 + 60 * 60_000),       // 60 min
      baseItem('b', 'work', t10, t10 + 30 * 60_000),         // 30 min
      baseItem('c', 'diary', t9, t9 + 30 * 60_000)           // 排除（非 schedule 类）
    ];
    const stat = computeTodaySaturation(items);
    expect(stat.plannedMinutes).toBe(90);
    expect(stat.itemCount).toBe(2);
    expect(stat.level).toBe('空闲');
  });

  it('returns 空闲 for empty items', () => {
    const stat = computeTodaySaturation([]);
    expect(stat.plannedMinutes).toBe(0);
    expect(stat.level).toBe('空闲');
    expect(stat.ratio).toBe(0);
  });

  it('marks 超载 when planned >= 60% of 24h', () => {
    const today = dayjs().startOf('day').valueOf();
    const items = [baseItem('big', 'schedule', today + 3_600_000, today + 3_600_000 + 16 * 60 * 60_000)];  // 16h
    const stat = computeTodaySaturation(items);
    expect(stat.level).toBe('超载');
    expect(stat.ratio).toBeGreaterThanOrEqual(60);
  });
});

describe('computeHabitStreaks', () => {
  it('computes current and longest streak per habit', () => {
    const today = dayjs().startOf('day').valueOf();
    const habit: Habit = { id: 'h1', name: '阅读', color: '#10b981', frequency: 'daily', targetCount: 1, sortOrder: 0, createdAt: 0, updatedAt: 0 };
    const logs: HabitLog[] = [
      { id: '1', habitId: 'h1', date: today, count: 1, createdAt: 0 },
      { id: '2', habitId: 'h1', date: today - 86_400_000, count: 1, createdAt: 0 },
      { id: '3', habitId: 'h1', date: today - 86_400_000 * 2, count: 1, createdAt: 0 },
      { id: '4', habitId: 'h1', date: today - 86_400_000 * 5, count: 1, createdAt: 0 }
    ];
    const result = computeHabitStreaks([habit], logs);
    expect(result).toHaveLength(1);
    expect(result[0].currentStreak).toBe(3);
    expect(result[0].longestStreak).toBe(3);
  });

  it('returns 0 streak when never logged', () => {
    const habit: Habit = { id: 'h2', name: '冥想', color: '#8b5cf6', frequency: 'daily', targetCount: 1, sortOrder: 0, createdAt: 0, updatedAt: 0 };
    const result = computeHabitStreaks([habit], []);
    expect(result[0].currentStreak).toBe(0);
    expect(result[0].longestStreak).toBe(0);
  });
});

describe('computeTomorrowAgenda', () => {
  it('returns tomorrow schedule items sorted by start time', () => {
    const tomorrow8 = dayjs().add(1, 'day').startOf('day').add(8, 'hour').valueOf();
    const tomorrow15 = dayjs().add(1, 'day').startOf('day').add(15, 'hour').valueOf();
    const items = [
      baseItem('a', 'schedule', tomorrow15),
      baseItem('b', 'work', tomorrow8),
      baseItem('today', 'schedule', dayjs().startOf('day').add(9, 'hour').valueOf()),  // 今天，排除
      baseItem('done', 'schedule', tomorrow8, undefined, 'done')                       // 已完成，排除
    ];
    const result = computeTomorrowAgenda(items);
    expect(result.map(r => r.itemId)).toEqual(['b', 'a']);
    expect(result[0].startLabel).toBe('08:00');
  });

  it('respects topN', () => {
    const items: Item[] = [];
    const tomorrow = dayjs().add(1, 'day').startOf('day').valueOf();
    for (let i = 0; i < 10; i++) items.push(baseItem('i' + i, 'schedule', tomorrow + i * 3600_000));
    const result = computeTomorrowAgenda(items, 3);
    expect(result).toHaveLength(3);
  });
});
