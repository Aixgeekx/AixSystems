import { describe, it, expect } from 'vitest';
import dayjs from 'dayjs';
import {
  computeTodaySaturation,
  computeHabitStreaks,
  computeTomorrowAgenda,
  computeWeeklySaturationTrend,
  classifyAgendaSlot,
  groupTomorrowAgenda
} from './dailyInsight';
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

  it('drops items where endTime is before startTime to keep itemCount honest', () => {
    const t = dayjs().startOf('day').add(10, 'hour').valueOf();
    const items = [
      baseItem('valid', 'schedule', t, t + 60 * 60_000),                     // 60min 计入
      baseItem('reverse', 'schedule', t + 2 * 60 * 60_000, t + 60 * 60_000)  // endTime < startTime → 跳过
    ];
    const stat = computeTodaySaturation(items);
    expect(stat.itemCount).toBe(1);
    expect(stat.plannedMinutes).toBe(60);
  });
});

describe('computeWeeklySaturationTrend', () => {
  it('returns 7 entries ending at today with isToday flag', () => {
    const trend = computeWeeklySaturationTrend([]);
    expect(trend).toHaveLength(7);
    expect(trend[6].isToday).toBe(true);
    expect(trend[5].isToday).toBe(false);
    expect(trend.every(d => d.plannedMinutes === 0 && d.ratio === 0)).toBe(true);
  });

  it('aggregates planned minutes per day across the 7-day window', () => {
    const today = dayjs().startOf('day').valueOf();
    const yesterday = dayjs().subtract(1, 'day').startOf('day').valueOf();
    const items = [
      baseItem('a', 'schedule', today + 9 * 3_600_000, today + 9 * 3_600_000 + 30 * 60_000),     // 今日 30min
      baseItem('b', 'work', today + 12 * 3_600_000, today + 12 * 3_600_000 + 60 * 60_000),       // 今日 60min
      baseItem('c', 'schedule', yesterday + 8 * 3_600_000, yesterday + 8 * 3_600_000 + 90 * 60_000), // 昨日 90min
      baseItem('d', 'diary', today + 15 * 3_600_000)                                              // 排除
    ];
    const trend = computeWeeklySaturationTrend(items);
    const todayEntry = trend.find(d => d.isToday)!;
    const yesterdayEntry = trend[trend.length - 2];
    expect(todayEntry.plannedMinutes).toBe(90);
    expect(yesterdayEntry.plannedMinutes).toBe(90);
    expect(trend[0].plannedMinutes).toBe(0);
  });

  it('formats date and weekday labels', () => {
    const trend = computeWeeklySaturationTrend([]);
    expect(trend[6].dateLabel).toBe(dayjs().format('MM-DD'));
    expect(['周日','周一','周二','周三','周四','周五','周六']).toContain(trend[6].weekdayLabel);
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
    expect(result[0].todayDone).toBe(true);
    expect(result[0].yesterdayDone).toBe(true);
    expect(result[0].breakDays).toBe(0);
  });

  it('marks yesterdayDone false when only today logged', () => {
    const today = dayjs().startOf('day').valueOf();
    const habit: Habit = { id: 'h1', name: '冥想', color: '#8b5cf6', frequency: 'daily', targetCount: 1, sortOrder: 0, createdAt: 0, updatedAt: 0 };
    const logs: HabitLog[] = [{ id: '1', habitId: 'h1', date: today, count: 1, createdAt: 0 }];
    const result = computeHabitStreaks([habit], logs);
    expect(result[0].todayDone).toBe(true);
    expect(result[0].yesterdayDone).toBe(false);
    expect(result[0].breakDays).toBe(0);
  });

  it('returns 0 streak when never logged', () => {
    const habit: Habit = { id: 'h2', name: '冥想', color: '#8b5cf6', frequency: 'daily', targetCount: 1, sortOrder: 0, createdAt: 0, updatedAt: 0 };
    const result = computeHabitStreaks([habit], []);
    expect(result[0].currentStreak).toBe(0);
    expect(result[0].longestStreak).toBe(0);
    expect(result[0].todayDone).toBe(false);
    expect(result[0].yesterdayDone).toBe(false);
    expect(result[0].breakDays).toBe(99);
  });

  it('computes breakDays from last log when streak already broken', () => {
    const today = dayjs().startOf('day').valueOf();
    const habit: Habit = { id: 'h3', name: '运动', color: '#f43f5e', frequency: 'daily', targetCount: 1, sortOrder: 0, createdAt: 0, updatedAt: 0 };
    const logs: HabitLog[] = [
      { id: 'a', habitId: 'h3', date: today - 5 * 86_400_000, count: 1, createdAt: 0 },
      { id: 'b', habitId: 'h3', date: today - 6 * 86_400_000, count: 1, createdAt: 0 }
    ];
    const result = computeHabitStreaks([habit], logs);
    expect(result[0].currentStreak).toBe(0);                                 // 已断
    expect(result[0].longestStreak).toBe(2);
    expect(result[0].breakDays).toBe(5);                                     // 最近一次打卡 = 5 天前
  });

  it('breakDays=1 when yesterday was last logged', () => {
    const today = dayjs().startOf('day').valueOf();
    const habit: Habit = { id: 'h4', name: '阅读', color: '#10b981', frequency: 'daily', targetCount: 1, sortOrder: 0, createdAt: 0, updatedAt: 0 };
    const logs: HabitLog[] = [
      { id: 'a', habitId: 'h4', date: today - 86_400_000, count: 1, createdAt: 0 }
    ];
    const result = computeHabitStreaks([habit], logs);
    expect(result[0].breakDays).toBe(1);
    expect(result[0].yesterdayDone).toBe(true);
    expect(result[0].todayDone).toBe(false);
  });
});

describe('classifyAgendaSlot', () => {
  it('maps hour ranges to four time slots', () => {
    expect(classifyAgendaSlot(6)).toBe('清晨');
    expect(classifyAgendaSlot(8)).toBe('清晨');
    expect(classifyAgendaSlot(9)).toBe('上午');
    expect(classifyAgendaSlot(11)).toBe('上午');
    expect(classifyAgendaSlot(12)).toBe('下午');
    expect(classifyAgendaSlot(17)).toBe('下午');
    expect(classifyAgendaSlot(18)).toBe('晚上');
    expect(classifyAgendaSlot(23)).toBe('晚上');
  });
});

describe('computeTomorrowAgenda', () => {
  it('returns tomorrow schedule items sorted by start time with timeSlot', () => {
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
    expect(result[0].timeSlot).toBe('清晨');
    expect(result[1].timeSlot).toBe('下午');
  });

  it('respects topN', () => {
    const items: Item[] = [];
    const tomorrow = dayjs().add(1, 'day').startOf('day').valueOf();
    for (let i = 0; i < 10; i++) items.push(baseItem('i' + i, 'schedule', tomorrow + i * 3600_000));
    const result = computeTomorrowAgenda(items, 3);
    expect(result).toHaveLength(3);
  });
});

describe('groupTomorrowAgenda', () => {
  it('groups entries by slot and keeps slot order, drops empty slots', () => {
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const t8 = tomorrow.add(8, 'hour').valueOf();
    const t10 = tomorrow.add(10, 'hour').valueOf();
    const t14 = tomorrow.add(14, 'hour').valueOf();
    const t20 = tomorrow.add(20, 'hour').valueOf();
    const entries = computeTomorrowAgenda([
      baseItem('a', 'schedule', t10),
      baseItem('b', 'schedule', t8),
      baseItem('c', 'schedule', t14),
      baseItem('d', 'schedule', t20)
    ]);
    const groups = groupTomorrowAgenda(entries);
    expect(groups.map(g => g.slot)).toEqual(['清晨', '上午', '下午', '晚上']);
    expect(groups[0].entries.map(e => e.itemId)).toEqual(['b']);
    expect(groups[1].entries.map(e => e.itemId)).toEqual(['a']);
  });

  it('returns empty array when no entries', () => {
    expect(groupTomorrowAgenda([])).toEqual([]);
  });
});
