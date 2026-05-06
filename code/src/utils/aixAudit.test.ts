import { describe, it, expect } from 'vitest';
import { hashString, fingerprintDetail, buildAuditTickets, summarizeTickets, buildReplayPackage, summarizePowerShellLogs, buildCheckpointCapsule } from './aixAudit';
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
