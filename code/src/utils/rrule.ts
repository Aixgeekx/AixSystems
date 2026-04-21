// 重复规则工具 - 基于 rrule + 自定义 记忆曲线
import { RRule, RRuleSet, rrulestr, Options, Frequency } from 'rrule';

export const MEMORY_CURVE_DAYS = [1, 2, 4, 7, 15, 30];                // 艾宾浩斯遗忘曲线间隔

export function isMemoryCurve(rule?: string): boolean {               // 判断是否记忆曲线
  return rule === 'memory_curve';
}

export function expandMemoryCurve(startTime: number): number[] {      // 展开记忆曲线日期
  return MEMORY_CURVE_DAYS.map(d => startTime + d * 86_400_000);
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
  if (isMemoryCurve(rule)) return '记忆曲线';
  try { return rrulestr(rule).toText(); } catch { return rule; }
}
