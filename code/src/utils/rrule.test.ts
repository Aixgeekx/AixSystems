// RRULE 工具单元测试
import { describe, it, expect } from 'vitest';
import { buildMemoryCurveReminderPlan, buildRRule, describeRRule, expandRepeat, isMemoryCurve, expandMemoryCurve, MEMORY_CURVE_DAYS } from './rrule';

describe('buildRRule', () => {
  it('构造每日规则', () => {
    const s = buildRRule({ freq: 'daily' });
    expect(s).toContain('FREQ=DAILY');
  });
  it('构造带间隔的每周规则', () => {
    const s = buildRRule({ freq: 'weekly', interval: 2, byweekday: [0, 2] });
    expect(s).toContain('FREQ=WEEKLY');
    expect(s).toContain('INTERVAL=2');
  });
});

describe('describeRRule', () => {
  it('undefined 返回不重复', () => { expect(describeRRule(undefined)).toBe('不重复'); });
  it('memory_curve 返回记忆曲线说明', () => { expect(describeRRule('memory_curve')).toBe('记忆曲线 1/2/4/7/15/30 天'); });
});

describe('memoryCurve', () => {
  it('isMemoryCurve 识别', () => {
    expect(isMemoryCurve('memory_curve')).toBe(true);
    expect(isMemoryCurve('FREQ=DAILY')).toBe(false);
  });
  it('展开返回 6 个日期', () => {
    const start = Date.now();
    const arr = expandMemoryCurve(start);
    expect(arr.length).toBe(MEMORY_CURVE_DAYS.length);
    expect(arr[0]).toBe(start + MEMORY_CURVE_DAYS[0] * 86_400_000);
  });
});

describe('expandRepeat', () => {
  it('记忆曲线按范围过滤', () => {
    const start = Date.now();
    const all = expandRepeat('memory_curve', start, start, start + 3 * 86_400_000);
    expect(all.length).toBeLessThanOrEqual(MEMORY_CURVE_DAYS.length);
  });
  it('无效 RRULE 返回空数组', () => {
    const arr = expandRepeat('INVALID', Date.now(), Date.now(), Date.now() + 86_400_000);
    expect(arr).toEqual([]);
  });
});

describe('buildMemoryCurveReminderPlan', () => {
  it('没有提醒配置时默认生成 6 个准时复习提醒', () => {
    const start = new Date(2026, 3, 23, 9, 0, 0).getTime();
    const plan = buildMemoryCurveReminderPlan('i1', start, [], start - 1);
    expect(plan).toHaveLength(MEMORY_CURVE_DAYS.length);
    expect(plan[0]).toMatchObject({ id: 'i1_memory_1_0', curveDay: 1, label: '第 1 天复习 · 复习当天' });
  });

  it('有提前提醒配置时按每个复习节点生成提醒队列', () => {
    const start = new Date(2026, 3, 23, 9, 0, 0).getTime();
    const plan = buildMemoryCurveReminderPlan('i2', start, [{ offsetMs: -60_000, label: '提前 1 分钟' }], start - 1);
    expect(plan).toHaveLength(MEMORY_CURVE_DAYS.length);
    expect(plan[0].fireAt).toBe(expandMemoryCurve(start)[0] - 60_000);
  });

  it('会过滤已经过期的复习提醒', () => {
    const start = new Date(2026, 3, 1, 9, 0, 0).getTime();
    const now = new Date(2026, 3, 10, 9, 0, 0).getTime();
    const plan = buildMemoryCurveReminderPlan('i3', start, [], now);
    expect(plan.every(item => item.fireAt > now)).toBe(true);
    expect(plan.length).toBeLessThan(MEMORY_CURVE_DAYS.length);
  });
});
