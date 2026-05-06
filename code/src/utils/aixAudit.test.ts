import { describe, it, expect } from 'vitest';
import { hashString, fingerprintDetail, buildAuditTickets, summarizeTickets, buildReplayPackage, summarizePowerShellLogs, buildCheckpointCapsule, verifyReplayPackage, parseCheckpointCapsule, buildPresetDrillSchedule, buildPresetTrendRows } from './aixAudit';
import type { EventLog } from '@/models';

const eventLog = (id: string, scope: string, ts: number, extra: Partial<EventLog> = {}, detail: Record<string, any> = {}): EventLog => ({
  id,
  level: 'info',
  message: `${scope} log ${id}`,
  detail: { scope, ...detail },
  createdAt: ts,
  ...extra
});

describe('hashString / fingerprintDetail', () => {
  it('produces stable hex output for same input', () => {
    expect(hashString('aix-control-token')).toBe(hashString('aix-control-token'));
    expect(hashString('aix-control-token')).toMatch(/^[0-9a-f]{12,14}$/);
  });

  it('different input produces different hash', () => {
    expect(hashString('a')).not.toBe(hashString('b'));
  });

  it('handles undefined and circular detail gracefully', () => {
    expect(fingerprintDetail(undefined)).toBe('0000000000000');
    const circular: any = { name: 'c' };
    circular.self = circular;
    expect(fingerprintDetail(circular)).toMatch(/^[0-9a-f]{12,14}$/);
  });
});

describe('buildAuditTickets', () => {
  it('produces newest-first list with linked chain hashes', () => {
    const logs: EventLog[] = [
      eventLog('a', 'aix-skill', 1000),
      eventLog('b', 'aix-campaign', 2000),
      eventLog('c', 'agent', 3000)
    ];
    const tickets = buildAuditTickets(logs);
    expect(tickets.map(t => t.id)).toEqual(['c', 'b', 'a']);
    expect(tickets[2].prevHash).toBe('0000000000000');
    expect(tickets[1].prevHash).toBe(tickets[2].chainHash);
    expect(tickets[0].prevHash).toBe(tickets[1].chainHash);
    expect(tickets[0].chainHash).not.toBe(tickets[1].chainHash);
  });

  it('attaches scope-specific rollback guidance and resume prompt', () => {
    const tickets = buildAuditTickets([
      eventLog('a', 'aix-campaign', 1000),
      eventLog('b', 'powershell-preset', 2000),
      eventLog('c', 'agent', 3000),
      eventLog('d', 'aix-skill', 4000)
    ]);
    expect(tickets.find(t => t.id === 'a')!.rollback).toContain('战役');
    expect(tickets.find(t => t.id === 'b')!.rollback).toContain('只读');
    expect(tickets.find(t => t.id === 'c')!.rollback).toContain('Agent');
    expect(tickets.find(t => t.id === 'd')!.rollback).toContain('eventLog');
    expect(tickets[0].resume).toContain('Claude Code 续跑');
  });
});

describe('summarizeTickets / buildReplayPackage', () => {
  it('summarises tickets by scope and produces replay JSON', () => {
    const tickets = buildAuditTickets([
      eventLog('a', 'aix-skill', 1000),
      eventLog('b', 'aix-skill', 2000),
      eventLog('c', 'agent', 3000)
    ]);
    const summary = summarizeTickets(tickets);
    expect(summary[0].scope).toBe('aix-skill');
    expect(summary[0].count).toBe(2);
    expect(summary[1].count).toBe(1);
    const replay = JSON.parse(buildReplayPackage(tickets, { capsuleId: 'AIX-CORE' }));
    expect(replay.version).toBe('aix-audit-replay-1.0');
    expect(replay.tickets).toHaveLength(3);
    expect(replay.capsule.capsuleId).toBe('AIX-CORE');
    expect(replay.headHash).toBe(tickets[0].chainHash);
    expect(replay.tailHash).toBe(tickets[tickets.length - 1].chainHash);
  });
});

describe('summarizePowerShellLogs', () => {
  it('aggregates success ratio, fallback rate, and avg duration', () => {
    const logs: EventLog[] = [
      eventLog('1', 'powershell-preset', Date.now() - 3 * 86_400_000, {}, { preset: 'check-startup', ok: true, durationMs: 800 }),
      eventLog('2', 'powershell-preset', Date.now() - 2 * 86_400_000, {}, { preset: 'check-startup', ok: false, durationMs: 1200, fallback: true, shell: 'powershell.exe' }),
      eventLog('3', 'powershell-preset', Date.now() - 86_400_000, {}, { preset: 'check-startup', ok: true, durationMs: 700 })
    ];
    const result = summarizePowerShellLogs(logs, ['check-startup']);
    expect(result).toHaveLength(1);
    const entry = result[0];
    expect(entry.preset).toBe('check-startup');
    expect(entry.total).toBe(3);
    expect(entry.ok).toBe(2);
    expect(entry.fail).toBe(1);
    expect(entry.fallback).toBe(1);
    expect(entry.avgMs).toBeGreaterThan(0);
    expect(entry.lastAt).toBeGreaterThan(0);
    expect(['绿色', '黄色', '红色']).toContain(entry.level);
    expect(entry.resume).toContain('Claude Code 续跑');
  });

  it('returns empty array when no presets nor logs', () => {
    expect(summarizePowerShellLogs([], [])).toEqual([]);
  });
});

describe('buildCheckpointCapsule', () => {
  it('builds capsule json + cli prompt covering all branches', () => {
    const result = buildCheckpointCapsule([
      { id: 't1', title: '成长 Agent', risk: '低风险', percent: 33, breakpoint: 'Resume', resume: 'recover', next: '执行只读', proof: 'progress=33%' },
      { id: 't2', title: '电脑 Agent', risk: '需授权', percent: 100, breakpoint: 'Archive', resume: 'archive', next: '归档', proof: 'progress=100%' }
    ]);
    expect(result.summary.total).toBe(2);
    expect(result.summary.pending).toBe(1);
    expect(result.summary.archived).toBe(1);
    expect(result.summary.needsApproval).toBe(0);
    const parsed = JSON.parse(result.json);
    expect(parsed.version).toBe('aix-cli-checkpoint-1.0');
    expect(parsed.branches).toHaveLength(2);
    expect(result.prompt).toContain('成长 Agent');
    expect(result.prompt).toContain('电脑 Agent');
    expect(result.capsuleId).toMatch(/^AIX-CKPT-\d{8}-2$/);
  });
});

describe('verifyReplayPackage', () => {
  it('accepts a freshly exported replay package', () => {
    const tickets = buildAuditTickets([
      eventLog('a', 'aix-skill', 1000),
      eventLog('b', 'aix-campaign', 2000),
      eventLog('c', 'agent', 3000)
    ]);
    const pack = buildReplayPackage(tickets, { capsuleId: 'AIX-CORE' });
    const verified = verifyReplayPackage(pack);
    expect(verified.ok).toBe(true);
    expect(verified.brokenAt).toBe(-1);
    expect(verified.count).toBe(3);
    expect(verified.summary.length).toBeGreaterThan(0);
    expect(verified.reason).toContain('完整');
  });

  it('detects tampered chain hashes', () => {
    const tickets = buildAuditTickets([
      eventLog('a', 'aix-skill', 1000),
      eventLog('b', 'aix-campaign', 2000)
    ]);
    const json = JSON.parse(buildReplayPackage(tickets, {}));
    json.tickets[1].fingerprint = 'tampered';                // 篡改第二张票据
    const verified = verifyReplayPackage(JSON.stringify(json));
    expect(verified.ok).toBe(false);
    expect(verified.brokenAt).toBeGreaterThanOrEqual(0);
    expect(verified.reason).toContain('不一致');
  });

  it('rejects wrong version or invalid JSON', () => {
    expect(verifyReplayPackage('not json').ok).toBe(false);
    expect(verifyReplayPackage(JSON.stringify({ version: 'aix-other-1.0' })).ok).toBe(false);
  });
});

describe('parseCheckpointCapsule', () => {
  it('round-trips a capsule produced by buildCheckpointCapsule', () => {
    const built = buildCheckpointCapsule([
      { id: 't1', title: '复盘 Agent', risk: '中风险', percent: 50, breakpoint: 'Resume', resume: '继续', next: '复盘 1', proof: 'progress=50%' }
    ]);
    const parsed = parseCheckpointCapsule(built.json);
    expect(parsed.ok).toBe(true);
    expect(parsed.branches).toHaveLength(1);
    expect(parsed.branches[0].title).toBe('复盘 Agent');
    expect(parsed.summary.pending).toBe(1);
  });

  it('rejects wrong version capsules', () => {
    const parsed = parseCheckpointCapsule(JSON.stringify({ version: 'wrong', branches: [] }));
    expect(parsed.ok).toBe(false);
    expect(parsed.reason).toContain('版本');
  });
});

describe('buildPresetDrillSchedule', () => {
  const fixedNow = new Date('2026-05-07T08:30:00Z').getTime();   // 14:30 UTC+8

  it('schedules red presets today, yellow this week, green next week', () => {
    const rows = [
      { preset: 'red-preset', total: 1, ok: 0, fail: 1, fallback: 1, avgMs: 200, lastAt: fixedNow, riskScore: 30, level: '红色' as const, drill: '今天再演练', resume: '' },
      { preset: 'yellow-preset', total: 1, ok: 1, fail: 0, fallback: 0, avgMs: 200, lastAt: fixedNow, riskScore: 60, level: '黄色' as const, drill: '本周演练', resume: '' },
      { preset: 'green-preset', total: 1, ok: 1, fail: 0, fallback: 0, avgMs: 200, lastAt: fixedNow, riskScore: 90, level: '绿色' as const, drill: '保持节奏', resume: '' }
    ];
    const schedule = buildPresetDrillSchedule(rows, fixedNow);
    expect(schedule).toHaveLength(3);
    const today16Local = new Date(fixedNow);
    today16Local.setHours(16, 0, 0, 0);
    const todayMatch = today16Local.getTime() < fixedNow ? today16Local.getTime() + 86_400_000 : today16Local.getTime();
    expect(schedule[0].preset).toBe('red-preset');
    expect(schedule[0].scheduleAt).toBe(todayMatch);
    expect(schedule[0].importance).toBe(0);
    expect(schedule[1].scheduleAt).toBe(todayMatch + 3 * 86_400_000);
    expect(schedule[2].scheduleAt).toBe(todayMatch + 7 * 86_400_000);
    expect(schedule.map(item => item.scheduleLabel)).toEqual(['今日 16:00 演练', '本周内演练', '一周后演练']);
  });
});

describe('buildPresetTrendRows', () => {
  const fixedNow = new Date('2026-05-07T18:00:00Z').getTime();

  it('groups logs into day buckets, computes success ratio and trend', () => {
    const dayMs = 86_400_000;
    const dayStart = new Date(fixedNow);
    dayStart.setHours(0, 0, 0, 0);
    const start = dayStart.getTime();
    const logs: EventLog[] = [
      eventLog('1', 'powershell-preset', start - 12 * dayMs + 3_600_000, {}, { preset: 'core-disk', ok: false, durationMs: 1200, fallback: true, shell: 'powershell.exe' }),
      eventLog('2', 'powershell-preset', start - 11 * dayMs + 4_000_000, {}, { preset: 'core-disk', ok: false, durationMs: 1300 }),
      eventLog('3', 'powershell-preset', start - 5 * dayMs + 1_000_000, {}, { preset: 'core-disk', ok: true, durationMs: 800 }),
      eventLog('4', 'powershell-preset', start - 2 * dayMs + 5_000_000, {}, { preset: 'core-disk', ok: true, durationMs: 700 })
    ];
    const rows = buildPresetTrendRows(logs, ['core-disk'], 14, fixedNow);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.buckets).toHaveLength(14);
    expect(row.buckets.filter(b => b.total > 0)).toHaveLength(4);
    expect(row.buckets.find(b => b.dayStart === start - 12 * dayMs)?.fallback).toBe(1);
    expect(row.successRatio).toBeCloseTo(0.5);
    expect(row.trend).toBe('上升');                                // 后半周成功率高于前半周
  });

  it('returns zeroed buckets when no logs exist', () => {
    const rows = buildPresetTrendRows([], ['empty-preset'], 7, fixedNow);
    expect(rows[0].successRatio).toBe(0);
    expect(rows[0].trend).toBe('持平');
    expect(rows[0].buckets.every(bucket => bucket.total === 0)).toBe(true);
  });
});
