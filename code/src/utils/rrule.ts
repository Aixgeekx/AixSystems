// 重复规则工具 - 基于 rrule + 自定义 记忆曲线
import { RRule, RRuleSet, rrulestr, Options, Frequency } from 'rrule';
import type { Reminder } from '@/models';
import { addDays } from './time';

export const MEMORY_CURVE_DAYS = [1, 2, 4, 7, 15, 30];                // 艾宾浩斯遗忘曲线间隔
export const DEFAULT_MEMORY_REMINDER: Reminder = { offsetMs: 0, label: '复习当天' };

export function isMemoryCurve(rule?: string): boolean {               // 判断是否记忆曲线
  return rule === 'memory_curve';
}

export function expandMemoryCurve(startTime: number): number[] {      // 展开记忆曲线日期
  return MEMORY_CURVE_DAYS.map(d => addDays(startTime, d));
}

export function buildMemoryCurveReminderPlan(
  itemId: string,
  startTime: number,
  reminders: Reminder[] = [],
  nowTs = Date.now()
) {
  const source = reminders.length
    ? reminders.filter((reminder, index, arr) => arr.findIndex(item => item.offsetMs === reminder.offsetMs) === index)
    : [DEFAULT_MEMORY_REMINDER];
  return expandMemoryCurve(startTime).flatMap((reviewAt, index) => (
    source.map(reminder => {
      const fireAt = reviewAt + reminder.offsetMs;
      const day = MEMORY_CURVE_DAYS[index];
      return {
        id: `${itemId}_memory_${day}_${reminder.offsetMs}`,
        itemId,
        fireAt,
        fired: false,
        label: `第 ${day} 天复习${reminder.label ? ` · ${reminder.label}` : ''}`,
        reviewAt,
        curveDay: day
      };
    })
  )).filter(entry => entry.fireAt > nowTs);
}

export function expandRepeat(rule: string, startTime: number, rangeStart: number, rangeEnd: number): number[] {
  if (isMemoryCurve(rule)) {
    return expandMemoryCurve(startTime).filter(t => t >= rangeStart && t <= rangeEnd);
  }
  try {
    const rr = rrulestr(rule, { dtstart: new Date(startTime) });
    return rr.between(new Date(rangeStart), new Date(rangeEnd), true).map(d => d.getTime());
  } catch { return []; }
}

export function buildRRule(opts: {                                    // 构造 RRULE 字符串
  freq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  byweekday?: number[];
  bymonthday?: number[];
  until?: number;
  count?: number;
}): string {
  const map = { daily: Frequency.DAILY, weekly: Frequency.WEEKLY, monthly: Frequency.MONTHLY, yearly: Frequency.YEARLY };
  const r = new RRule({
    freq: map[opts.freq],
    interval: opts.interval || 1,
    byweekday: opts.byweekday,
    bymonthday: opts.bymonthday,
    until: opts.until ? new Date(opts.until) : undefined,
    count: opts.count
  } as Partial<Options>);
  return r.toString();
}

export function describeRRule(rule?: string): string {                // 人类可读描述
  if (!rule) return '不重复';
  if (isMemoryCurve(rule)) return '记忆曲线 1/2/4/7/15/30 天';
  try { return rrulestr(rule).toText(); } catch { return rule; }
}
