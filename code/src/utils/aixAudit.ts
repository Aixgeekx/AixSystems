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

export interface PresetDayBucket {
  dateLabel: string;                                         // MM-DD
  dayStart: number;
  total: number;
  ok: number;
  fail: number;
  fallback: number;
  avgMs: number;
}

export interface PresetTrendRow {
  preset: string;
  buckets: PresetDayBucket[];
  successRatio: number;                                      // 0-1
  trend: '上升' | '持平' | '下降';
}

function bucketRatio(buckets: PresetDayBucket[]): number {
  const total = buckets.reduce((sum, bucket) => sum + bucket.total, 0);
  const ok = buckets.reduce((sum, bucket) => sum + bucket.ok, 0);
  return total ? ok / total : 0;
}

export interface AuditHeatCell {
  dayStart: number;
  dateLabel: string;                                         // MM-DD
  low: number;
  mid: number;
  high: number;
  total: number;
}

export function buildAuditHeatmap(tickets: AuditTicket[], days = 14, now = Date.now()): AuditHeatCell[] {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const cells: AuditHeatCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = dayStart.getTime() - i * 86_400_000;
    const end = start + 86_400_000;
    const within = tickets.filter(ticket => ticket.timestamp >= start && ticket.timestamp < end);
    const date = new Date(start);
    cells.push({
      dayStart: start,
      dateLabel: `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      low: within.filter(ticket => ticket.risk === '低风险').length,
      mid: within.filter(ticket => ticket.risk === '中风险').length,
      high: within.filter(ticket => ticket.risk === '需确认').length,
      total: within.length
    });
  }
  return cells;
}

const DANGEROUS_KEYWORDS = [
  'rm ', 'rm -', 'del ', 'remove-item', 'rmdir', 'rd /s', 'format ', 'mkfs', 'taskkill', 'stop-process', 'kill ',
  'shutdown', 'reboot', 'reg delete', 'reg add', 'set-acl', 'icacls', 'cacls', 'net user', 'net localgroup',
  'invoke-expression', 'iex ', 'invoke-webrequest', 'iwr ', 'curl ', 'wget ', 'start-process', 'cmd /c',
  '> $null', 'out-null', '-force', 'no-confirm', 'whoami /priv'
];

export interface BlacklistFinding {
  preset: string;
  keyword: string;
  count: number;
  lastAt: number;
  sample: string;
  severity: '低' | '中' | '高';
  resume: string;
}

export function scanPowerShellBlacklist(logs: EventLog[]): BlacklistFinding[] {
  const findings = new Map<string, BlacklistFinding>();
  for (const log of logs) {
    const corpus = `${log.message} ${JSON.stringify(log.detail || {}).toLowerCase()}`;
    for (const keyword of DANGEROUS_KEYWORDS) {
      if (!corpus.includes(keyword)) continue;
      const preset = String(log.detail?.preset || log.detail?.skill || log.message.slice(0, 40));
      const key = `${preset}::${keyword}`;
      const existing = findings.get(key);
      const severity: BlacklistFinding['severity'] = ['format ', 'mkfs', 'rm -', 'rmdir', 'rd /s', 'shutdown', 'reboot', 'reg delete', 'iex ', 'invoke-expression'].some(item => keyword.startsWith(item.trim().slice(0, 4))) ? '高' : ['taskkill', 'stop-process', 'set-acl', 'icacls', 'net user', 'net localgroup'].some(item => keyword.includes(item)) ? '中' : '低';
      const resume = `Claude Code 续跑：审查预设 ${preset} 中的关键字 "${keyword}"，确认是否在白名单允许范围；若否，立即清理或迁移到只读分支。`;
      if (existing) {
        existing.count += 1;
        if (log.createdAt > existing.lastAt) { existing.lastAt = log.createdAt; existing.sample = corpus.slice(0, 200); }
      } else {
        findings.set(key, { preset, keyword: keyword.trim(), count: 1, lastAt: log.createdAt, sample: corpus.slice(0, 200), severity, resume });
      }
    }
  }
  return [...findings.values()].sort((a, b) => (a.severity === b.severity ? b.count - a.count : (a.severity === '高' ? -1 : b.severity === '高' ? 1 : a.severity === '中' ? -1 : 1)));
}

export interface RelayDepthNode {
  id: string;
  title: string;
  capsuleId: string;
  depth: number;
  risk: string;
  percent: number;
  parentId?: string;
  createdAt: number;
}

export function buildRelayTree(items: Array<{ id: string; title: string; createdAt: number; updatedAt: number; subtasks?: Array<{ done: boolean }>; extra?: any }>): RelayDepthNode[] {
  const byId = new Map<string, typeof items[number]>();
  for (const item of items) byId.set(item.id, item);
  const nodes: RelayDepthNode[] = [];
  for (const item of items) {
    if (!item.extra?.relayFrom) continue;
    const subtasks = item.subtasks || [];
    const done = subtasks.filter(sub => sub.done).length;
    const total = subtasks.length || 1;
    const percent = Math.round(done / total * 100);
    let depth = 1;
    let parentId: string | undefined;
    let cursor: typeof items[number] | undefined = items.find(other => String(other.extra?.capsuleId || '') === String(item.extra?.relayFrom));
    if (cursor) parentId = cursor.id;
    while (cursor && cursor.extra?.relayFrom) {
      depth += 1;
      cursor = items.find(other => String(other.extra?.capsuleId || '') === String(cursor!.extra?.relayFrom));
      if (!cursor) break;
    }
    nodes.push({
      id: item.id,
      title: item.title,
      capsuleId: String(item.extra?.relayFrom || ''),
      depth,
      risk: String(item.extra?.risk || '低风险'),
      percent,
      parentId,
      createdAt: item.createdAt
    });
  }
  return nodes.sort((a, b) => a.depth - b.depth || a.createdAt - b.createdAt);
}

function csvCell(value: any): string {                     // CSV 转义：逗号 / 引号 / 换行
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildAuditCsv(tickets: AuditTicket[]): string {
  const header = ['id', 'timestamp', 'datetime', 'scope', 'level', 'risk', 'message', 'fingerprint', 'chainHash', 'prevHash'];
  const rows = tickets.map(ticket => [
    ticket.id,
    ticket.timestamp,
    new Date(ticket.timestamp).toISOString(),
    ticket.scope,
    ticket.level,
    ticket.risk,
    ticket.message,
    ticket.fingerprint,
    ticket.chainHash,
    ticket.prevHash
  ].map(csvCell).join(','));
  return [header.join(','), ...rows].join('\r\n');
}

export function buildRelayTreeMarkdown(nodes: RelayDepthNode[]): string {
  if (!nodes.length) return '# Agent 接力深度追溯（空）\n\n当前没有任何带 relayFrom 标记的 Agent 分支。\n';
  const lines = ['# Agent 接力深度追溯', '', `生成时间：${new Date().toISOString()}`, `节点总数：${nodes.length} · 最深 ${nodes.reduce((max, node) => Math.max(max, node.depth), 0)} 跳`, ''];
  for (const node of nodes) {
    const indent = '  '.repeat(Math.max(0, node.depth - 1));
    lines.push(`${indent}- **${node.title}** · 深度 ${node.depth} · 风险 ${node.risk} · 进度 ${node.percent}% · 来自 ${node.capsuleId} · 父分支 ${node.parentId || '原始胶囊源'}`);
  }
  return lines.join('\n') + '\n';
}

export interface DailyChainAnchor {
  dateLabel: string;
  dayStart: number;
  count: number;
  lastChainHash: string;
  lastTicketId: string;
}

export function buildDailyChainSummary(tickets: AuditTicket[], days = 7, now = Date.now()): DailyChainAnchor[] {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const result: DailyChainAnchor[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const start = dayStart.getTime() - i * 86_400_000;
    const end = start + 86_400_000;
    const within = tickets.filter(ticket => ticket.timestamp >= start && ticket.timestamp < end).sort((a, b) => a.timestamp - b.timestamp);
    const last = within[within.length - 1];
    const date = new Date(start);
    result.push({
      dateLabel: `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
      dayStart: start,
      count: within.length,
      lastChainHash: last?.chainHash || '',
      lastTicketId: last?.id || ''
    });
  }
  return result;
}

const FAILURE_PATTERNS: Array<{ keyword: string; label: string }> = [
  { keyword: 'access denied', label: '权限拒绝' },
  { keyword: 'permission', label: '权限不足' },
  { keyword: 'timeout', label: '超时' },
  { keyword: 'timed out', label: '超时' },
  { keyword: 'network', label: '网络异常' },
  { keyword: 'connection', label: '连接失败' },
  { keyword: 'not found', label: '资源缺失' },
  { keyword: 'cannot find', label: '资源缺失' },
  { keyword: 'execution policy', label: '执行策略限制' },
  { keyword: 'syntax', label: '语法错误' },
  { keyword: 'parameter', label: '参数错误' }
];

export interface FailureCluster {
  label: string;
  keyword: string;
  count: number;
  presets: string[];
  lastAt: number;
}

export function clusterPresetFailures(logs: EventLog[]): FailureCluster[] {
  const buckets = new Map<string, FailureCluster>();
  for (const log of logs) {
    if (log.detail?.ok !== false && log.level !== 'warn' && log.level !== 'error') continue;
    const haystack = `${log.message} ${JSON.stringify(log.detail || {})}`.toLowerCase();
    for (const pattern of FAILURE_PATTERNS) {
      if (!haystack.includes(pattern.keyword)) continue;
      const preset = String(log.detail?.preset || log.detail?.skill || log.message.slice(0, 40));
      const entry = buckets.get(pattern.label) || { label: pattern.label, keyword: pattern.keyword, count: 0, presets: [], lastAt: 0 };
      entry.count += 1;
      if (!entry.presets.includes(preset)) entry.presets.push(preset);
      if (log.createdAt > entry.lastAt) entry.lastAt = log.createdAt;
      buckets.set(pattern.label, entry);
      break;
    }
  }
  return [...buckets.values()].sort((a, b) => b.count - a.count);
}

export interface SleepingBranch {
  id: string;
  title: string;
  idleHours: number;
  risk: string;
  percent: number;
  capsuleId: string;
}

export function findSleepingRelayBranches(items: Array<{ id: string; title: string; updatedAt: number; subtasks?: Array<{ done: boolean }>; extra?: any }>, thresholdHours = 24, now = Date.now()): SleepingBranch[] {
  return items
    .filter(item => !!item.extra?.relayFrom)
    .map(item => {
      const subtasks = item.subtasks || [];
      const done = subtasks.filter(sub => sub.done).length;
      const total = subtasks.length || 1;
      const percent = Math.round(done / total * 100);
      const idleHours = (now - item.updatedAt) / 3_600_000;
      return { id: item.id, title: item.title, idleHours: Math.round(idleHours * 10) / 10, risk: String(item.extra?.risk || '低风险'), percent, capsuleId: String(item.extra?.relayFrom || '') };
    })
    .filter(branch => branch.idleHours >= thresholdHours && branch.percent < 100)
    .sort((a, b) => b.idleHours - a.idleHours);
}

export function buildPresetTrendRows(logs: EventLog[], presetNames: string[], days = 14, now = Date.now()): PresetTrendRow[] {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const buckets: number[] = [];
  for (let i = days - 1; i >= 0; i--) buckets.push(dayStart.getTime() - i * 86_400_000);
  return presetNames.map(preset => {
    const matches = logs.filter(log => String(log.detail?.preset || log.detail?.skill || '') === preset);
    const dayBuckets: PresetDayBucket[] = buckets.map(start => {
      const end = start + 86_400_000;
      const within = matches.filter(log => log.createdAt >= start && log.createdAt < end);
      const ok = within.filter(log => log.detail?.ok !== false).length;
      const fail = within.length - ok;
      const fallback = within.filter(log => log.detail?.fallback === true || log.detail?.shell === 'powershell.exe').length;
      const durations = within.map(log => Number(log.detail?.durationMs) || 0).filter(value => value > 0);
      const avgMs = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0;
      const date = new Date(start);
      const dateLabel = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      return { dateLabel, dayStart: start, total: within.length, ok, fail, fallback, avgMs };
    });
    const totalAll = dayBuckets.reduce((sum, bucket) => sum + bucket.total, 0);
    const okAll = dayBuckets.reduce((sum, bucket) => sum + bucket.ok, 0);
    const successRatio = totalAll ? okAll / totalAll : 0;
    const recentHalf = dayBuckets.slice(Math.max(0, dayBuckets.length - 7));
    const olderHalf = dayBuckets.slice(0, Math.max(0, dayBuckets.length - 7));
    const recentRatio = bucketRatio(recentHalf);
    const olderRatio = bucketRatio(olderHalf);
    const trend: PresetTrendRow['trend'] = recentRatio > olderRatio + 0.05 ? '上升' : recentRatio < olderRatio - 0.05 ? '下降' : '持平';
    return { preset, buckets: dayBuckets, successRatio, trend };
  });
}


