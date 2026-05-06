import { describe, it, expect } from 'vitest';
import { hashString, fingerprintDetail, buildAuditTickets, summarizeTickets, buildReplayPackage, summarizePowerShellLogs, buildCheckpointCapsule, verifyReplayPackage, parseCheckpointCapsule, buildPresetDrillSchedule, buildPresetTrendRows, buildAuditHeatmap, scanPowerShellBlacklist, buildRelayTree, buildAuditCsv, buildRelayTreeMarkdown, buildDailyChainSummary, clusterPresetFailures, findSleepingRelayBranches, buildDailyAnchorJson, expandFailureCluster, scoreRelayBranches, compareDailyAnchors, buildFailureFixHint, buildBranchHealthTrend, buildScopeDistribution, buildPresetGoldenPath, buildBranchRetroSubtasks, buildFullAuditSnapshot, verifyFullAuditSnapshot, buildHealthTrendCompare, buildGoldenPathMarkdown, summarizeRetroProgress, buildV1HealthCheck, buildPresetManualMarkdown, buildBranchHealthCsv, compareFullAuditSnapshots, buildAuditHourlyHeatmap, summarizePresetCost, buildRelayTreeMermaid } from './aixAudit';
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

describe('buildAuditHeatmap', () => {
  const fixedNow = new Date('2026-05-07T18:00:00Z').getTime();

  it('groups tickets into per-day low/mid/high counts', () => {
    const dayMs = 86_400_000;
    const dayStart = new Date(fixedNow);
    dayStart.setHours(0, 0, 0, 0);
    const start = dayStart.getTime();
    const tickets = buildAuditTickets([
      eventLog('a', 'aix-skill', start - 2 * dayMs + 1000),
      eventLog('b', 'aix-campaign', start - 2 * dayMs + 2000),
      eventLog('c', 'powershell-preset', start - dayMs + 3000),
      eventLog('d', 'agent', start + 4000)
    ]);
    const cells = buildAuditHeatmap(tickets, 5, fixedNow);
    expect(cells).toHaveLength(5);
    const today = cells[cells.length - 1];
    const yesterday = cells[cells.length - 2];
    const dayBefore = cells[cells.length - 3];
    expect(today.total).toBe(1);
    expect(today.mid).toBe(1);                                // agent → 中风险
    expect(yesterday.high).toBe(1);                           // powershell-preset → 需确认
    expect(dayBefore.low).toBeGreaterThanOrEqual(1);          // aix-skill → 低风险
    expect(dayBefore.mid).toBeGreaterThanOrEqual(1);          // aix-campaign → 中风险
  });
});

describe('scanPowerShellBlacklist', () => {
  it('flags dangerous keywords across logs and assigns severity', () => {
    const logs: EventLog[] = [
      eventLog('1', 'powershell-preset', 1000, {}, { preset: 'cleanup', script: 'Format C:', ok: true }),
      eventLog('2', 'powershell-preset', 2000, {}, { preset: 'kill-task', script: 'taskkill /pid 1234', ok: true }),
      eventLog('3', 'powershell-preset', 3000, {}, { preset: 'bench', script: 'Get-Process | Out-Null', ok: true })
    ];
    const findings = scanPowerShellBlacklist(logs);
    expect(findings.length).toBeGreaterThan(0);
    const hasFormat = findings.some(item => item.keyword.includes('format'));
    const hasTaskkill = findings.some(item => item.keyword === 'taskkill');
    expect(hasFormat).toBe(true);
    expect(hasTaskkill).toBe(true);
    const top = findings[0];
    expect(top.resume).toContain('Claude Code 续跑');
  });

  it('returns empty when no dangerous keyword present', () => {
    const logs: EventLog[] = [eventLog('1', 'powershell-preset', 1000, {}, { preset: 'safe', script: 'Get-ComputerInfo' })];
    expect(scanPowerShellBlacklist(logs)).toEqual([]);
  });
});

describe('buildRelayTree', () => {
  it('computes relay depth across multi-hop relayFrom chains', () => {
    const items = [
      { id: 'a', title: '原始 Agent', createdAt: 100, updatedAt: 100, subtasks: [{ done: true }, { done: false }], extra: { capsuleId: 'CAP-1' } },
      { id: 'b', title: '第二跳', createdAt: 200, updatedAt: 200, subtasks: [{ done: false }], extra: { relayFrom: 'CAP-1', capsuleId: 'CAP-2', risk: '低风险' } },
      { id: 'c', title: '第三跳', createdAt: 300, updatedAt: 300, subtasks: [{ done: true }], extra: { relayFrom: 'CAP-2', risk: '中风险' } }
    ];
    const tree = buildRelayTree(items);
    expect(tree).toHaveLength(2);
    const second = tree.find(node => node.id === 'b')!;
    const third = tree.find(node => node.id === 'c')!;
    expect(second.depth).toBe(1);
    expect(second.parentId).toBe('a');
    expect(third.depth).toBe(2);
    expect(third.parentId).toBe('b');
    expect(third.percent).toBe(100);
  });

  it('returns empty when no items have relayFrom', () => {
    expect(buildRelayTree([{ id: 'x', title: 'no relay', createdAt: 1, updatedAt: 1 }])).toEqual([]);
  });
});

describe('buildAuditCsv', () => {
  it('produces RFC4180-style CSV with header and quotes special chars', () => {
    const ticketsLogs: EventLog[] = [
      { id: 'a', level: 'info', message: 'aix, with comma', detail: { scope: 'aix-skill', note: 'inner "quote"' }, createdAt: 1000 },
      { id: 'b', level: 'info', message: 'plain', detail: { scope: 'aix-campaign' }, createdAt: 2000 }
    ];
    const tickets = buildAuditTickets(ticketsLogs);
    const csv = buildAuditCsv(tickets);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('id,timestamp,datetime,scope,level,risk,message,fingerprint,chainHash,prevHash');
    expect(lines).toHaveLength(3);
    const middle = lines.find(line => line.startsWith('a,'))!;
    expect(middle).toContain('aix-skill');
    expect(middle).toContain('"aix, with comma"');         // 含逗号的字段被双引号包围
  });
});

describe('buildRelayTreeMarkdown', () => {
  it('renders indented bullets per depth and reports max depth', () => {
    const md = buildRelayTreeMarkdown([
      { id: 'a', title: '一跳', capsuleId: 'CAP-1', depth: 1, risk: '低风险', percent: 50, parentId: 'origin', createdAt: 1 },
      { id: 'b', title: '二跳', capsuleId: 'CAP-2', depth: 2, risk: '中风险', percent: 80, parentId: 'a', createdAt: 2 }
    ]);
    expect(md).toContain('# Agent 接力深度追溯');
    expect(md).toContain('最深 2 跳');
    expect(md).toContain('- **一跳**');
    expect(md).toContain('  - **二跳**');                   // depth=2 → 2 个空格缩进
  });

  it('handles empty input with friendly message', () => {
    expect(buildRelayTreeMarkdown([])).toContain('空');
  });
});

describe('buildDailyChainSummary', () => {
  const fixedNow = new Date('2026-05-07T18:00:00Z').getTime();

  it('records last chain hash per day for the lookback window', () => {
    const dayMs = 86_400_000;
    const dayStart = new Date(fixedNow);
    dayStart.setHours(0, 0, 0, 0);
    const start = dayStart.getTime();
    const tickets = buildAuditTickets([
      eventLog('a', 'aix-skill', start - 2 * dayMs + 1000),
      eventLog('b', 'aix-campaign', start + 4000),
      eventLog('c', 'aix-skill', start + 5000)
    ]);
    const summary = buildDailyChainSummary(tickets, 4, fixedNow);
    expect(summary).toHaveLength(4);
    const today = summary[summary.length - 1];
    expect(today.count).toBe(2);
    expect(today.lastTicketId).toBe('c');
    expect(today.lastChainHash).toBeTruthy();
    const empty = summary[0];
    expect(empty.count).toBe(0);
    expect(empty.lastChainHash).toBe('');
  });
});

describe('clusterPresetFailures', () => {
  it('clusters log entries by keyword pattern', () => {
    const logs: EventLog[] = [
      { id: '1', level: 'warn', message: 'preset failed: Access Denied', detail: { scope: 'desktop-preset-drill', preset: 'startup', ok: false }, createdAt: 1000 },
      { id: '2', level: 'warn', message: 'preset failed: timeout after 5s', detail: { scope: 'desktop-preset-drill', preset: 'ports', ok: false }, createdAt: 2000 },
      { id: '3', level: 'warn', message: 'preset failed: Access Denied (admin only)', detail: { scope: 'desktop-preset-drill', preset: 'reg', ok: false }, createdAt: 3000 }
    ];
    const clusters = clusterPresetFailures(logs);
    expect(clusters.length).toBeGreaterThan(0);
    const accessDenied = clusters.find(c => c.label === '权限拒绝')!;
    expect(accessDenied.count).toBe(2);
    expect(accessDenied.presets).toEqual(expect.arrayContaining(['startup', 'reg']));
  });

  it('returns empty when no failures', () => {
    expect(clusterPresetFailures([{ id: 'a', level: 'info', message: 'ok', detail: { ok: true }, createdAt: 1 }])).toEqual([]);
  });
});

describe('findSleepingRelayBranches', () => {
  const fixedNow = new Date('2026-05-07T18:00:00Z').getTime();

  it('flags relay branches idle longer than threshold and not yet completed', () => {
    const items = [
      { id: 'fresh', title: '最近活跃', updatedAt: fixedNow - 3_600_000, subtasks: [{ done: false }], extra: { relayFrom: 'CAP-1', risk: '低风险' } },
      { id: 'idle', title: '沉睡 30h', updatedAt: fixedNow - 30 * 3_600_000, subtasks: [{ done: false }, { done: false }], extra: { relayFrom: 'CAP-2', risk: '中风险' } },
      { id: 'done', title: '已归档', updatedAt: fixedNow - 100 * 3_600_000, subtasks: [{ done: true }], extra: { relayFrom: 'CAP-3' } },
      { id: 'noRelay', title: '本地分支', updatedAt: fixedNow - 50 * 3_600_000, subtasks: [{ done: false }] }
    ];
    const sleeping = findSleepingRelayBranches(items, 24, fixedNow);
    expect(sleeping.map(branch => branch.id)).toEqual(['idle']);
    expect(sleeping[0].idleHours).toBeGreaterThanOrEqual(24);
  });
});


describe('buildDailyAnchorJson', () => {
  it('packages anchors with aggregate hash and schema metadata', () => {
    const anchors = [
      { dateLabel: '05-06', dayStart: 1000, count: 0, lastChainHash: '', lastTicketId: '' },
      { dateLabel: '05-07', dayStart: 86_401_000, count: 2, lastChainHash: 'hash-end', lastTicketId: 'tid' }
    ];
    const json = buildDailyAnchorJson(anchors, 'TEST-TOKEN');
    const parsed = JSON.parse(json);
    expect(parsed.schema).toBe('aix-daily-anchor-1.0');
    expect(parsed.controlTokenId).toBe('TEST-TOKEN');
    expect(parsed.days).toBe(2);
    expect(parsed.anchors).toHaveLength(2);
    expect(parsed.aggregateHash).toBeTruthy();
    expect(typeof parsed.aggregateHash).toBe('string');
  });
});

describe('expandFailureCluster', () => {
  it('returns matching log details sorted by recency', () => {
    const logs: EventLog[] = [
      { id: '1', level: 'warn', message: 'Access Denied while reading', detail: { scope: 'desktop-preset-drill', preset: 'startup', ok: false }, createdAt: 1000 },
      { id: '2', level: 'warn', message: 'timed out after 5s', detail: { ok: false, preset: 'ports' }, createdAt: 2000 },
      { id: '3', level: 'warn', message: 'permission required (admin)', detail: { ok: false, preset: 'reg' }, createdAt: 3000 }
    ];
    const accessDeniedDetails = expandFailureCluster(logs, '权限拒绝');
    expect(accessDeniedDetails).toHaveLength(1);
    expect(accessDeniedDetails[0].preset).toBe('startup');
  });

  it('returns empty array when label is unknown', () => {
    expect(expandFailureCluster([], '不存在的分类')).toEqual([]);
  });
});

describe('scoreRelayBranches', () => {
  const fixedNow = new Date('2026-05-07T18:00:00Z').getTime();

  it('penalizes idle hours, failure count and risk while rewarding progress', () => {
    const items = [
      { id: 'a', title: '健康分支', updatedAt: fixedNow - 2 * 3_600_000, subtasks: [{ done: true }, { done: true }, { done: false }], extra: { relayFrom: 'CAP-A', risk: '低风险' } },
      { id: 'b', title: '风险分支', updatedAt: fixedNow - 60 * 3_600_000, subtasks: [{ done: false }, { done: false }], extra: { relayFrom: 'CAP-B', risk: '红色' } }
    ];
    const logs: EventLog[] = [
      { id: 'f1', level: 'warn', message: 'fail', detail: { ok: false, relayFrom: 'CAP-B' }, createdAt: fixedNow - 1000 },
      { id: 'f2', level: 'error', message: 'fail', detail: { ok: false, relayFrom: 'CAP-B' }, createdAt: fixedNow - 500 }
    ];
    const scores = scoreRelayBranches(items, logs, fixedNow);
    expect(scores).toHaveLength(2);
    const a = scores.find(s => s.id === 'a')!;
    const b = scores.find(s => s.id === 'b')!;
    expect(a.score).toBeGreaterThan(b.score);
    expect(b.failureCount).toBe(2);
    expect(['健康', '关注', '风险']).toContain(a.band);
  });
});


describe('compareDailyAnchors', () => {
  it('returns ok when local and remote anchors fully match', () => {
    const anchors = [
      { dateLabel: '05-06', dayStart: 1000, count: 1, lastChainHash: 'h1', lastTicketId: 't1' },
      { dateLabel: '05-07', dayStart: 86_401_000, count: 2, lastChainHash: 'h2', lastTicketId: 't2' }
    ];
    const json = buildDailyAnchorJson(anchors, 'A');
    const result = compareDailyAnchors(anchors, json)!;
    expect(result.ok).toBe(true);
    expect(result.identical).toHaveLength(2);
    expect(result.mismatch).toHaveLength(0);
  });

  it('flags mismatched chain hashes between local and remote', () => {
    const local = [
      { dateLabel: '05-07', dayStart: 0, count: 1, lastChainHash: 'localHash', lastTicketId: 'tA' }
    ];
    const remote = [
      { dateLabel: '05-07', dayStart: 0, count: 1, lastChainHash: 'remoteHash', lastTicketId: 'tA' }
    ];
    const json = buildDailyAnchorJson(remote, 'B');
    const result = compareDailyAnchors(local, json)!;
    expect(result.ok).toBe(false);
    expect(result.mismatch[0].dateLabel).toBe('05-07');
  });

  it('returns null on invalid json', () => {
    expect(compareDailyAnchors([], 'not-json')).toBeNull();
  });
});

describe('buildFailureFixHint', () => {
  it('returns hint for known label', () => {
    expect(buildFailureFixHint('权限拒绝')).toContain('RunAs');
    expect(buildFailureFixHint('超时')).toContain('OperationTimeout');
  });

  it('returns generic hint for unknown label', () => {
    expect(buildFailureFixHint('火星语错误')).toContain('Microsoft Learn');
  });
});

describe('buildBranchHealthTrend', () => {
  const fixedNow = new Date('2026-05-07T18:00:00Z').getTime();

  it('produces day-by-day average score for the lookback window', () => {
    const items = [
      { id: 'a', title: '稳定接力', updatedAt: fixedNow - 6 * 3_600_000, subtasks: [{ done: true }], extra: { relayFrom: 'CAP-A', risk: '低风险' } }
    ];
    const trend = buildBranchHealthTrend(items, [], 5, fixedNow);
    expect(trend).toHaveLength(5);
    const today = trend[trend.length - 1];
    expect(today.count).toBe(1);
    expect(today.avgScore).toBeGreaterThan(0);
    expect(today.dateLabel).toMatch(/\d{2}-\d{2}/);
  });
});


describe('buildScopeDistribution', () => {
  it('computes percentage per scope', () => {
    const ticketLogs: EventLog[] = [
      { id: '1', level: 'info', message: 'a', detail: { scope: 'aix-skill' }, createdAt: 1 },
      { id: '2', level: 'info', message: 'b', detail: { scope: 'aix-skill' }, createdAt: 2 },
      { id: '3', level: 'info', message: 'c', detail: { scope: 'aix-campaign' }, createdAt: 3 }
    ];
    const tickets = buildAuditTickets(ticketLogs);
    const dist = buildScopeDistribution(tickets);
    expect(dist).toHaveLength(2);
    expect(dist[0].count).toBeGreaterThanOrEqual(dist[1].count);
    const total = dist.reduce((s, d) => s + d.percent, 0);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });

  it('handles empty input', () => {
    expect(buildScopeDistribution([])).toEqual([]);
  });
});

describe('buildPresetGoldenPath', () => {
  it('orders by level then success rate then avgMs', () => {
    const rows = [
      { preset: 'A', level: '红色', total: 10, ok: 5, avgMs: 200 },
      { preset: 'B', level: '绿色', total: 10, ok: 9, avgMs: 100 },
      { preset: 'C', level: '黄色', total: 10, ok: 8, avgMs: 50 }
    ];
    const path = buildPresetGoldenPath(rows);
    expect(path.map(p => p.preset)).toEqual(['B', 'C', 'A']);
    expect(path[0].order).toBe(1);
    expect(path[0].suggestion).toContain('基线');
  });
});

describe('buildBranchRetroSubtasks', () => {
  it('returns 3 actionable subtasks customized to branch state', () => {
    const subtasks = buildBranchRetroSubtasks({ title: '风险分支', band: '风险', idleHours: 80, failureCount: 3, percent: 20, risk: '红色' });
    expect(subtasks).toHaveLength(3);
    expect(subtasks[0]).toContain('失败 3 次');
    expect(subtasks[1]).toContain('改进');
    expect(subtasks[2]).toContain('验证');
  });
});


describe('buildFullAuditSnapshot', () => {
  it('packages all audit data with schema and totals', () => {
    const ticketLogs: EventLog[] = [
      { id: '1', level: 'info', message: 'a', detail: { scope: 'aix-skill' }, createdAt: 1 }
    ];
    const tickets = buildAuditTickets(ticketLogs);
    const json = buildFullAuditSnapshot({
      tickets,
      dailyAnchors: [{ dateLabel: '05-07', dayStart: 0, count: 1, lastChainHash: 'h', lastTicketId: '1' }],
      powerShellRisk: [{ preset: 'A', level: '绿色', riskScore: 90, total: 5, ok: 5, fail: 0, avgMs: 200 }],
      branchHealth: [{ id: 'x', title: 't', capsuleId: 'CAP-1', risk: '低风险', idleHours: 1, percent: 50, failureCount: 0, score: 80, band: '健康' }],
      scopeDistribution: [{ scope: 'aix-skill', label: '技能', color: '#3b82f6', count: 1, percent: 100 }]
    });
    const parsed = JSON.parse(json);
    expect(parsed.schema).toBe('aix-full-audit-snapshot-1.0');
    expect(parsed.totals.tickets).toBe(1);
    expect(parsed.totals.presets).toBe(1);
    expect(parsed.totals.branches).toBe(1);
    expect(parsed.totals.days).toBe(1);
  });
});


describe('verifyFullAuditSnapshot', () => {
  it('returns ok when schema and totals are valid', () => {
    const json = buildFullAuditSnapshot({
      tickets: [],
      dailyAnchors: [],
      powerShellRisk: [],
      branchHealth: [],
      scopeDistribution: []
    });
    const result = verifyFullAuditSnapshot(json);
    expect(result.ok).toBe(true);
    expect(result.schema).toBe('aix-full-audit-snapshot-1.0');
    expect(result.totals?.tickets).toBe(0);
  });

  it('flags invalid schema', () => {
    const result = verifyFullAuditSnapshot(JSON.stringify({ schema: 'wrong', totals: { tickets: 0 } }));
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('schema');
  });

  it('flags non-json input', () => {
    const result = verifyFullAuditSnapshot('not json');
    expect(result.ok).toBe(false);
    expect(result.reason).toContain('JSON');
  });
});

describe('buildHealthTrendCompare', () => {
  it('marks day-over-day delta with arrows', () => {
    const trend = [
      { dateLabel: '05-05', dayStart: 0, avgScore: 60, count: 1 },
      { dateLabel: '05-06', dayStart: 0, avgScore: 75, count: 1 },
      { dateLabel: '05-07', dayStart: 0, avgScore: 70, count: 1 }
    ];
    const compare = buildHealthTrendCompare(trend);
    expect(compare[0].arrow).toBe('→');
    expect(compare[1].arrow).toBe('↑');
    expect(compare[2].arrow).toBe('↓');
    expect(compare[1].delta).toBe(15);
  });
});


describe('buildGoldenPathMarkdown', () => {
  it('returns markdown table for steps', () => {
    const steps = [
      { order: 1, preset: 'A', level: '绿色', successRate: 90, avgMs: 100, suggestion: '稳定基线' },
      { order: 2, preset: 'B', level: '红色', successRate: 50, avgMs: 300, suggestion: '重点排查' }
    ];
    const md = buildGoldenPathMarkdown(steps);
    expect(md).toContain('# 演练黄金路径');
    expect(md).toContain('| 1 | 绿色 | A | 90% | 100ms');
    expect(md).toContain('| 2 | 红色 | B | 50%');
  });

  it('returns empty placeholder when no steps', () => {
    expect(buildGoldenPathMarkdown([])).toContain('当前没有可生成');
  });
});

describe('summarizeRetroProgress', () => {
  it('counts retro subtasks across items and progress logs', () => {
    const items = [
      { subtasks: [
        { title: '复盘原因：失败 2 次', done: true },
        { title: '改进策略：拆小步', done: false },
        { title: '验证方式：再演练一次', done: false },
        { title: '其它任务', done: true }
      ] }
    ];
    const logs: EventLog[] = [
      { id: '1', level: 'info', message: 'gen', detail: { scope: 'agent-retro-subtasks', count: 3, branchId: 'B1' }, createdAt: 1 }
    ];
    const stat = summarizeRetroProgress(logs, items);
    expect(stat.completed).toBe(1);
    expect(stat.pending).toBe(2);
    expect(stat.completionRate).toBe(33);
    expect(stat.branches).toBe(1);
    expect(stat.totalGenerated).toBeGreaterThanOrEqual(3);
  });
});

describe('compareFullAuditSnapshots', () => {
  const makeSnapshot = (totals: any, scopes: Array<{scope: string; count: number}>, riskLevels: string[], branchScores: number[], generatedAt: number) => JSON.stringify({
    schema: 'aix-full-audit-snapshot-1.0',
    generatedAt,
    totals,
    tickets: [],
    dailyAnchors: [],
    powerShellRisk: riskLevels.map(level => ({ preset: 'p', level, riskScore: 0, total: 0, ok: 0, fail: 0, avgMs: 0 })),
    branchHealth: branchScores.map(score => ({ id: 'b', title: 't', capsuleId: 'c', score, band: '健康', percent: 0, idleHours: 0, failureCount: 0, risk: '低风险' })),
    scopeDistribution: scopes
  });

  it('returns ok with totals/scope/risk/branch deltas', () => {
    const before = makeSnapshot({ tickets: 10, presets: 3, branches: 2, days: 7 }, [{ scope: 'aix-skill', count: 4 }, { scope: 'powershell-drill', count: 6 }], ['绿色', '黄色', '红色'], [80, 60], 1000);
    const after = makeSnapshot({ tickets: 15, presets: 3, branches: 3, days: 7 }, [{ scope: 'aix-skill', count: 6 }, { scope: 'powershell-drill', count: 9 }], ['绿色', '绿色', '绿色'], [82, 70, 65], 2000);
    const diff = compareFullAuditSnapshots(before, after);
    expect(diff.ok).toBe(true);
    const ticketsRow = diff.totals.find(t => t.key === 'tickets');
    expect(ticketsRow?.delta).toBe(5);
    expect(ticketsRow?.arrow).toBe('↑');
    expect(diff.scopeChanges.length).toBe(2);
    expect(diff.riskShift.beforeRedYellow).toBe(2);
    expect(diff.riskShift.afterRedYellow).toBe(0);
    expect(diff.riskShift.delta).toBe(-2);
    expect(diff.branchHealthShift.afterAvg).toBeGreaterThan(diff.branchHealthShift.beforeAvg);
  });

  it('refuses non-snapshot JSON', () => {
    expect(compareFullAuditSnapshots('{}', '{}').ok).toBe(false);
    expect(compareFullAuditSnapshots('not json', 'not json').ok).toBe(false);
  });
});


describe('buildV1HealthCheck', () => {
  it('returns ready=true when all three lines have healthy data', () => {
    const tickets = buildAuditTickets([
      { id: '1', level: 'info', message: 'a', detail: { scope: 'aix-skill' }, createdAt: 1 } as EventLog
    ]);
    const psRisk: any[] = [
      { preset: 'A', total: 10, ok: 9, fail: 1, fallback: 0, avgMs: 100, lastAt: Date.now(), riskScore: 90, level: '绿色', drill: 'd', resume: 'r' }
    ];
    const branchHealth: any[] = [
      { id: 'x', title: 't', capsuleId: 'CAP-1', risk: '低风险', idleHours: 1, percent: 90, failureCount: 0, score: 85, band: '健康' }
    ];
    const result = buildV1HealthCheck({ tickets, powerShellRisk: psRisk, branchHealthScores: branchHealth });
    expect(result.ready).toBe(true);
    expect(result.overall).toBeGreaterThanOrEqual(75);
    expect(result.blockers).toHaveLength(0);
  });

  it('lists blockers when any main line is empty', () => {
    const result = buildV1HealthCheck({ tickets: [], powerShellRisk: [], branchHealthScores: [] });
    expect(result.ready).toBe(false);
    expect(result.blockers.length).toBeGreaterThanOrEqual(3);
  });
});

describe('buildPresetManualMarkdown', () => {
  it('produces sectioned markdown per preset', () => {
    const rows: any[] = [
      { preset: 'A', total: 5, ok: 5, fail: 0, fallback: 0, avgMs: 100, lastAt: 0, riskScore: 90, level: '绿色', drill: '保持', resume: 'r1' },
      { preset: 'B', total: 5, ok: 2, fail: 3, fallback: 1, avgMs: 200, lastAt: 0, riskScore: 30, level: '红色', drill: '重点', resume: 'r2' }
    ];
    const md = buildPresetManualMarkdown(rows);
    expect(md).toContain('# PowerShell 预设维护手册');
    expect(md).toContain('## A');
    expect(md).toContain('## B');
    expect(md).toContain('风险评分 30/100');
  });

  it('handles empty list with placeholder', () => {
    expect(buildPresetManualMarkdown([])).toContain('暂无预设');
  });
});

describe('buildBranchHealthCsv', () => {
  it('outputs CSV with header and rows', () => {
    const scores: any[] = [
      { id: 'x', title: 't', capsuleId: 'CAP-1', risk: '低风险', idleHours: 5, percent: 80, failureCount: 0, score: 85, band: '健康' }
    ];
    const csv = buildBranchHealthCsv(scores);
    expect(csv).toContain('id,title,capsuleId,risk,band,score');
    expect(csv).toContain('x,t,CAP-1,低风险,健康,85');
  });

  it('escapes commas in title', () => {
    const scores: any[] = [
      { id: '1', title: 'a,b', capsuleId: 'CAP', risk: '低风险', idleHours: 0, percent: 0, failureCount: 0, score: 50, band: '关注' }
    ];
    const csv = buildBranchHealthCsv(scores);
    expect(csv).toContain('"a,b"');
  });
});

describe('buildAuditHourlyHeatmap', () => {
  it('returns 24 cells covering full day even when empty', () => {
    const cells = buildAuditHourlyHeatmap([]);
    expect(cells).toHaveLength(24);
    expect(cells[0]).toMatchObject({ hour: 0, count: 0, label: '00:00', share: 0 });
    expect(cells[23]).toMatchObject({ hour: 23, count: 0, label: '23:00', share: 0 });
  });

  it('aggregates ticket counts by local hour and computes share', () => {
    const now = new Date('2026-05-07T23:59:00').getTime();
    const at = (h: number) => new Date('2026-05-07').setHours(h, 0, 0, 0);
    const tickets: any[] = [
      { id: '1', timestamp: at(9), scope: 's', scopeLabel: 's', level: 'info', risk: '低风险', color: '#fff', message: 'a', fingerprint: 'f', chainHash: 'h', rollback: '', resume: '', prevHash: '0' },
      { id: '2', timestamp: at(9), scope: 's', scopeLabel: 's', level: 'info', risk: '低风险', color: '#fff', message: 'b', fingerprint: 'f', chainHash: 'h', rollback: '', resume: '', prevHash: '0' },
      { id: '3', timestamp: at(14), scope: 's', scopeLabel: 's', level: 'info', risk: '低风险', color: '#fff', message: 'c', fingerprint: 'f', chainHash: 'h', rollback: '', resume: '', prevHash: '0' }
    ];
    const cells = buildAuditHourlyHeatmap(tickets, 14, now);
    expect(cells[9].count).toBe(2);
    expect(cells[14].count).toBe(1);
    expect(cells[9].share).toBeCloseTo(66.7, 1);
    expect(cells[14].share).toBeCloseTo(33.3, 1);
  });

  it('drops tickets older than the cutoff window', () => {
    const now = new Date('2026-05-07T23:59:00').getTime();
    const old = now - 30 * 86_400_000;
    const recent = now - 1 * 86_400_000;
    const tickets: any[] = [
      { id: 'old', timestamp: old, scope: 's', scopeLabel: 's', level: 'info', risk: '低风险', color: '#fff', message: 'old', fingerprint: 'f', chainHash: 'h', rollback: '', resume: '', prevHash: '0' },
      { id: 'recent', timestamp: recent, scope: 's', scopeLabel: 's', level: 'info', risk: '低风险', color: '#fff', message: 'r', fingerprint: 'f', chainHash: 'h', rollback: '', resume: '', prevHash: '0' }
    ];
    const cells = buildAuditHourlyHeatmap(tickets, 14, now);
    const total = cells.reduce((sum, c) => sum + c.count, 0);
    expect(total).toBe(1);
  });
});

describe('summarizePresetCost', () => {
  it('ranks presets by cumulative milliseconds desc', () => {
    const rows = summarizePresetCost([
      { preset: 'a', total: 10, avgMs: 200 },                          // 2000ms
      { preset: 'b', total: 3, avgMs: 5000 },                          // 15000ms
      { preset: 'c', total: 5, avgMs: 1000 }                           // 5000ms
    ]);
    expect(rows.map(r => r.preset)).toEqual(['b', 'c', 'a']);
    expect(rows[0].costRank).toBe(1);
    expect(rows[0].totalMs).toBe(15000);
    expect(rows[0].totalMinutes).toBe(0);                              // 15000ms < 60_000ms
    expect(rows[2].costRank).toBe(3);
  });

  it('skips presets with zero runs or zero avgMs', () => {
    const rows = summarizePresetCost([
      { preset: 'never-run', total: 0, avgMs: 1000 },
      { preset: 'instant', total: 5, avgMs: 0 },
      { preset: 'real', total: 2, avgMs: 30_000 }                      // 60_000ms = 1min
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].preset).toBe('real');
    expect(rows[0].totalMinutes).toBe(1);
  });
});

describe('buildRelayTreeMermaid', () => {
  it('returns empty placeholder block when no nodes', () => {
    const text = buildRelayTreeMermaid([]);
    expect(text).toContain('graph TD');
    expect(text).toContain('暂无接力分支');
  });

  it('emits one node line per relay node and edge for each parent link', () => {
    const nodes: any[] = [
      { id: 'root1', title: '根任务', capsuleId: 'CAP-A', depth: 1, risk: '低风险', percent: 100, createdAt: 0 },
      { id: 'child1', title: '子任务1', capsuleId: 'CAP-B', depth: 2, risk: '中风险', percent: 50, parentId: 'root1', createdAt: 1 },
      { id: 'leaf1', title: '叶任务', capsuleId: 'CAP-C', depth: 3, risk: '低风险', percent: 30, parentId: 'child1', createdAt: 2 }
    ];
    const text = buildRelayTreeMermaid(nodes);
    expect(text.startsWith('```mermaid')).toBe(true);
    expect(text).toContain('graph TD');
    expect(text).toContain('根任务 · 100%');
    expect(text).toContain('叶任务 · 30%');
    expect(text).toMatch(/nroot1\s*-->\s*nchild1/);
    expect(text).toMatch(/nchild1\s*-->\s*nleaf1/);
  });

  it('escapes special characters in title', () => {
    const nodes: any[] = [
      { id: 'a', title: '含"引号"\n换行', capsuleId: 'CAP', depth: 1, risk: '低风险', percent: 0, createdAt: 0 }
    ];
    const text = buildRelayTreeMermaid(nodes);
    expect(text).toContain('含 引号  换行');
    expect(text).not.toMatch(/\n换行"/);
  });
});
