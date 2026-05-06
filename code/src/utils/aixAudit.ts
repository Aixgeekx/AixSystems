// Aix 审计工具 - 本地优先：链式哈希 + 票据合成 + 回放包，所有计算只用元数据
import type { EventLog } from '@/models';

const SCOPE_MAP: Record<string, { label: string; risk: '低风险' | '中风险' | '需确认'; color: string }> = {
  'aix-core': { label: 'Aix 控制台', risk: '低风险', color: '#38bdf8' },
  'aix-skill': { label: 'Aix 技能', risk: '低风险', color: '#10b981' },
  'aix-skill-graph': { label: '技能图谱', risk: '低风险', color: '#0ea5e9' },
  'aix-campaign': { label: '控制战役', risk: '中风险', color: '#8b5cf6' },
  'aix-evolution': { label: '自进化路线', risk: '低风险', color: '#06b6d4' },
  'aix-plugin-manifest': { label: '插件清单', risk: '中风险', color: '#ec4899' },
  'agent': { label: 'Agent 任务', risk: '中风险', color: '#f59e0b' },
  'powershell-preset': { label: 'PowerShell 预设', risk: '需确认', color: '#ef4444' },
  'desktop-preset': { label: '桌面预设', risk: '需确认', color: '#ef4444' }
};

export function hashString(input: string): string {        // cyrb53 轻量 hash，本地票据指纹
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(13, '0');
}

export function fingerprintDetail(detail: any): string {   // 输入指纹：序列化后哈希，不包含原文
  if (!detail) return '0000000000000';
  try {
    return hashString(JSON.stringify(detail).slice(0, 4096));
  } catch {
    return hashString(String(detail).slice(0, 1024));
  }
}

export interface AuditTicket {
  id: string;
  scope: string;
  scopeLabel: string;
  level: EventLog['level'];
  risk: '低风险' | '中风险' | '需确认';
  color: string;
  timestamp: number;
  message: string;
  fingerprint: string;
  chainHash: string;
  rollback: string;
  resume: string;
  prevHash: string;
}

export function buildAuditTickets(logs: EventLog[]): AuditTicket[] {  // 按时间倒序生成链式票据
  const sorted = [...logs].sort((a, b) => a.createdAt - b.createdAt);
  const result: AuditTicket[] = [];
  let prev = '0000000000000';
  for (const log of sorted) {
    const scope = String(log.detail?.scope || 'general');
    const meta = SCOPE_MAP[scope] || { label: scope, risk: '低风险' as const, color: '#94a3b8' };
    const fingerprint = fingerprintDetail(log.detail);
    const chainHash = hashString(prev + log.id + fingerprint + log.createdAt);
    const rollback = scope.startsWith('aix-campaign')
      ? '在事项页面把战役任务标记完成或删除，再清掉对应 eventLog 即可回滚。'
      : scope.startsWith('agent')
        ? '在 Agent 中枢驾驶舱归档分支，必要时在事项中删除对应 Item.extra。'
        : scope.startsWith('powershell') || scope.startsWith('desktop')
          ? '桌面预设全部为只读，无需回滚；如需复盘可清除该 eventLog 条目。'
          : '只写入了本地 eventLog，可直接删除该条目完成回滚。';
    const resume = `Claude Code 续跑：定位 eventLog ${log.id}，scope=${scope}，risk=${meta.risk}，fingerprint=${fingerprint}，先核对链式哈希再决定继续或回滚。`;
    result.push({
      id: log.id,
      scope,
      scopeLabel: meta.label,
      level: log.level,
      risk: meta.risk,
      color: meta.color,
      timestamp: log.createdAt,
      message: log.message,
      fingerprint,
      chainHash,
      rollback,
      resume,
      prevHash: prev
    });
    prev = chainHash;
  }
  return result.reverse();                                  // 最新在前，便于 UI 展示
}

export function summarizeTickets(tickets: AuditTicket[]) {  // 按 scope 汇总
  const byScope = new Map<string, { scope: string; label: string; color: string; count: number; lastAt: number }>();
  for (const ticket of tickets) {
    const entry = byScope.get(ticket.scope) || { scope: ticket.scope, label: ticket.scopeLabel, color: ticket.color, count: 0, lastAt: 0 };
    entry.count += 1;
    if (ticket.timestamp > entry.lastAt) entry.lastAt = ticket.timestamp;
    byScope.set(ticket.scope, entry);
  }
  return [...byScope.values()].sort((a, b) => b.count - a.count);
}

export function buildReplayPackage(tickets: AuditTicket[], capsuleSummary: Record<string, any>): string {
  const head = tickets[0];
  const tail = tickets[tickets.length - 1];
  const pack = {
    version: 'aix-audit-replay-1.0',
    generatedAt: Date.now(),
    headHash: head?.chainHash || '0',
    tailHash: tail?.chainHash || '0',
    integrity: tickets.length ? 'chained-sha-lite' : 'empty',
    summary: summarizeTickets(tickets),
    capsule: capsuleSummary,
    tickets: tickets.map(ticket => ({
      id: ticket.id,
      scope: ticket.scope,
      level: ticket.level,
      risk: ticket.risk,
      timestamp: ticket.timestamp,
      message: ticket.message,
      fingerprint: ticket.fingerprint,
      chainHash: ticket.chainHash,
      prevHash: ticket.prevHash,
      rollback: ticket.rollback,
      resume: ticket.resume
    }))
  };
  return JSON.stringify(pack, null, 2);
}

export interface PowerShellRiskEntry {
  preset: string;
  total: number;
  ok: number;
  fail: number;
  fallback: number;
  avgMs: number;
  lastAt: number;
  riskScore: number;                                        // 0-100，越高越安全
  level: '绿色' | '黄色' | '红色';
  drill: string;
  resume: string;
}

export function summarizePowerShellLogs(logs: EventLog[], presetNames: string[]): PowerShellRiskEntry[] {
  const buckets = new Map<string, EventLog[]>();
  for (const log of logs) {
    const preset = String(log.detail?.preset || log.detail?.skill || log.message.slice(0, 40));
    if (!buckets.has(preset)) buckets.set(preset, []);
    buckets.get(preset)!.push(log);
  }
  const ensured = presetNames.length ? presetNames : [...buckets.keys()];
  if (!ensured.length) return [];
  return ensured.map(preset => {
    const entries = buckets.get(preset) || [];
    const total = entries.length;
    const ok = entries.filter(item => item.detail?.ok !== false).length;
    const fail = total - ok;
    const fallback = entries.filter(item => item.detail?.fallback === true || item.detail?.shell === 'powershell.exe').length;
    const durations = entries.map(item => Number(item.detail?.durationMs) || 0).filter(value => value > 0);
    const avgMs = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0;
    const lastAt = entries.length ? entries[entries.length - 1].createdAt : 0;
    const successRatio = total ? ok / total : 1;
    const fallbackRatio = total ? fallback / total : 0;
    const stale = lastAt ? Math.min(40, Math.max(0, (Date.now() - lastAt) / 86_400_000) * 4) : 28;
    const riskScore = Math.max(0, Math.min(100, Math.round(successRatio * 60 + (1 - fallbackRatio) * 24 + (avgMs && avgMs <= 1500 ? 14 : avgMs ? 6 : 12) - stale)));
    const level: PowerShellRiskEntry['level'] = riskScore >= 78 ? '绿色' : riskScore >= 52 ? '黄色' : '红色';
    const drill = level === '绿色'
      ? '保持每周一次只读演练即可。'
      : level === '黄色'
        ? '本周内安排一次只读演练，确认 fallback 比例下降。'
        : '今天就执行一次只读演练，并复盘失败原因。';
    const resume = `Claude Code 续跑：检查 PowerShell 预设 ${preset}，成功率=${Math.round(successRatio * 100)}%，fallback=${Math.round(fallbackRatio * 100)}%，平均 ${avgMs}ms，建议 ${drill}`;
    return { preset, total, ok, fail, fallback, avgMs, lastAt, riskScore, level, drill, resume };
  }).sort((a, b) => a.riskScore - b.riskScore);
}

export interface CheckpointBranch {
  id: string;
  title: string;
  risk: string;
  percent: number;
  breakpoint: string;
  resume: string;
  next: string;
  proof: string;
}

export function buildCheckpointCapsule(branches: CheckpointBranch[]) {
  const generatedAt = Date.now();
  const capsuleId = `AIX-CKPT-${new Date(generatedAt).toISOString().slice(0, 10).replace(/-/g, '')}-${branches.length}`;
  const summary = {
    total: branches.length,
    pending: branches.filter(branch => branch.percent < 100).length,
    archived: branches.filter(branch => branch.percent === 100).length,
    needsApproval: branches.filter(branch => branch.risk !== '低风险' && branch.percent < 67).length
  };
  const json = JSON.stringify({
    version: 'aix-cli-checkpoint-1.0',
    capsuleId,
    generatedAt,
    summary,
    branches
  }, null, 2);
  const prompt = [
    `# Claude Code CLI 续跑胶囊 ${capsuleId}`,
    `生成时间：${new Date(generatedAt).toISOString()}`,
    `总分支：${summary.total}（待续跑 ${summary.pending} / 待授权 ${summary.needsApproval} / 可归档 ${summary.archived}）`,
    '',
    ...branches.map((branch, index) => [
      `## #${index + 1} ${branch.title}`,
      `- 风险：${branch.risk}`,
      `- 进度：${branch.percent}%`,
      `- 断点：${branch.breakpoint}`,
      `- 下一步：${branch.next}`,
      `- 续跑：${branch.resume}`,
      `- 证据：${branch.proof}`
    ].join('\n'))
  ].join('\n');
  return { capsuleId, generatedAt, summary, json, prompt };
}

export interface ReplayVerification {
  ok: boolean;
  version: string;
  count: number;
  brokenAt: number;                                         // -1 表示链式完整
  headHash: string;
  tailHash: string;
  summary: ReturnType<typeof summarizeTickets>;
  generatedAt: number;
  capsule: Record<string, any>;
  reason: string;
}

export function verifyReplayPackage(json: string): ReplayVerification {
  let parsed: any;
  try { parsed = JSON.parse(json); }
  catch { return { ok: false, version: '', count: 0, brokenAt: 0, headHash: '0', tailHash: '0', summary: [], generatedAt: 0, capsule: {}, reason: 'JSON 解析失败' }; }
  if (!parsed || parsed.version !== 'aix-audit-replay-1.0') {
    return { ok: false, version: String(parsed?.version || ''), count: 0, brokenAt: 0, headHash: '0', tailHash: '0', summary: [], generatedAt: Number(parsed?.generatedAt) || 0, capsule: parsed?.capsule || {}, reason: '版本不匹配，期望 aix-audit-replay-1.0' };
  }
  const ticketsRaw: any[] = Array.isArray(parsed.tickets) ? parsed.tickets : [];
  const sorted = [...ticketsRaw].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
  let prev = '0000000000000';
  let brokenAt = -1;
  for (let i = 0; i < sorted.length; i++) {
    const ticket = sorted[i];
    const expected = hashString(prev + String(ticket.id) + String(ticket.fingerprint) + Number(ticket.timestamp));
    const claimedPrev = String(ticket.prevHash || '');
    const claimedHash = String(ticket.chainHash || '');
    if (claimedPrev !== prev || claimedHash !== expected) { brokenAt = i; break; }
    prev = claimedHash;
  }
  const recoveredTickets: AuditTicket[] = sorted.map(ticket => ({
    id: String(ticket.id),
    scope: String(ticket.scope || 'general'),
    scopeLabel: String(ticket.scope || 'general'),
    level: (ticket.level as AuditTicket['level']) || 'info',
    risk: (ticket.risk as AuditTicket['risk']) || '低风险',
    color: '#94a3b8',
    timestamp: Number(ticket.timestamp) || 0,
    message: String(ticket.message || ''),
    fingerprint: String(ticket.fingerprint || ''),
    chainHash: String(ticket.chainHash || ''),
    prevHash: String(ticket.prevHash || ''),
    rollback: String(ticket.rollback || ''),
    resume: String(ticket.resume || '')
  }));
  const summary = summarizeTickets(recoveredTickets);
  const head = sorted[sorted.length - 1];
  const tail = sorted[0];
  return {
    ok: brokenAt < 0,
    version: 'aix-audit-replay-1.0',
    count: sorted.length,
    brokenAt,
    headHash: head?.chainHash || '0',
    tailHash: tail?.chainHash || '0',
    summary,
    generatedAt: Number(parsed.generatedAt) || 0,
    capsule: parsed.capsule || {},
    reason: brokenAt < 0 ? '链式哈希完整' : `第 ${brokenAt + 1} 张票据链式哈希不一致，可能被篡改或部分丢失`
  };
}

export interface ParsedCapsule {
  ok: boolean;
  capsuleId: string;
  generatedAt: number;
  summary: { total: number; pending: number; archived: number; needsApproval: number };
  branches: CheckpointBranch[];
  reason: string;
}

export function parseCheckpointCapsule(json: string): ParsedCapsule {
  let parsed: any;
  try { parsed = JSON.parse(json); }
  catch { return { ok: false, capsuleId: '', generatedAt: 0, summary: { total: 0, pending: 0, archived: 0, needsApproval: 0 }, branches: [], reason: 'JSON 解析失败' }; }
  if (!parsed || parsed.version !== 'aix-cli-checkpoint-1.0') {
    return { ok: false, capsuleId: String(parsed?.capsuleId || ''), generatedAt: Number(parsed?.generatedAt) || 0, summary: { total: 0, pending: 0, archived: 0, needsApproval: 0 }, branches: [], reason: '版本不匹配，期望 aix-cli-checkpoint-1.0' };
  }
  const branches: CheckpointBranch[] = Array.isArray(parsed.branches) ? parsed.branches.map((branch: any) => ({
    id: String(branch.id || ''),
    title: String(branch.title || '未命名分支'),
    risk: String(branch.risk || '低风险'),
    percent: Math.max(0, Math.min(100, Number(branch.percent) || 0)),
    breakpoint: String(branch.breakpoint || 'Resume'),
    resume: String(branch.resume || ''),
    next: String(branch.next || '继续推进未完成子任务'),
    proof: String(branch.proof || '')
  })) : [];
  return {
    ok: true,
    capsuleId: String(parsed.capsuleId || ''),
    generatedAt: Number(parsed.generatedAt) || 0,
    summary: {
      total: branches.length,
      pending: branches.filter(branch => branch.percent < 100).length,
      archived: branches.filter(branch => branch.percent === 100).length,
      needsApproval: branches.filter(branch => branch.risk !== '低风险' && branch.percent < 67).length
    },
    branches,
    reason: branches.length ? `胶囊解析成功，共 ${branches.length} 个分支` : '胶囊有效但没有分支'
  };
}

export interface PresetDrillPlan {
  preset: string;
  level: PowerShellRiskEntry['level'];
  scheduleAt: number;                                        // 演练时间戳
  scheduleLabel: string;
  importance: 0 | 1 | 2 | 3;
  drill: string;
}

export function buildPresetDrillSchedule(rows: PowerShellRiskEntry[], now = Date.now()): PresetDrillPlan[] {
  const today16 = new Date(now);
  today16.setHours(16, 0, 0, 0);
  if (today16.getTime() < now) today16.setDate(today16.getDate() + 1);
  return rows.map(row => {
    const offsetDays = row.level === '红色' ? 0 : row.level === '黄色' ? 3 : 7;
    const fire = new Date(today16);
    fire.setDate(today16.getDate() + offsetDays);
    const importance = row.level === '红色' ? 0 : row.level === '黄色' ? 1 : 2;
    return {
      preset: row.preset,
      level: row.level,
      scheduleAt: fire.getTime(),
      scheduleLabel: offsetDays === 0 ? '今日 16:00 演练' : offsetDays === 3 ? '本周内演练' : '一周后演练',
      importance,
      drill: row.drill
    };
  });
}

