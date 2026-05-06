// Agent 控制中枢 - 本地任务分支、恢复和权限日志
import React, { useState } from 'react';
import { Alert, Button, Card, Col, Input, Progress, Row, Space, Tag, Timeline, Typography, message } from 'antd';
import { BranchesOutlined, HistoryOutlined, SafetyCertificateOutlined, ThunderboltOutlined, CodeOutlined } from '@ant-design/icons';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';
import { buildCheckpointCapsule, parseCheckpointCapsule, buildRelayTree, buildRelayTreeMarkdown, findSleepingRelayBranches, scoreRelayBranches, buildBranchHealthTrend } from '@/utils/aixAudit';
import type { ParsedCapsule } from '@/utils/aixAudit';

const AGENT_TEMPLATES = [
  { title: '成长控制 Agent', desc: '拆解今日目标、习惯和复习压力，生成可恢复的行动分支', risk: '低风险', color: '#10b981', allow: '读写事项/目标/习惯/复习队列', deny: '禁止删除私人数据或跳过复盘', evidence: '今日数据、里程碑、提醒队列' },
  { title: '电脑管理 Agent', desc: '先只读扫描系统状态，再等待人工授权执行控制动作', risk: '需授权', color: '#2563eb', allow: '读取系统状态和白名单 PowerShell', deny: '禁止任意命令、删除文件、结束进程', evidence: '系统快照、端口、自启、确认日志' },
  { title: '模型调度 Agent', desc: '记录 Provider 健康、故障转移和策略历史，保障 AI 调用稳定', risk: '中风险', color: '#8b5cf6', allow: '切换已保存 Provider 和探活', deny: '禁止暴露 API Key 或上传本地数据', evidence: 'Provider 健康、延迟、回退记录' }
];

const RISK_WEIGHT: Record<string, number> = { '低风险': 18, '中风险': 42, '需授权': 68 };

const CLI_WORKFLOW_STEPS = [
  { title: 'Plan', desc: '生成可复制计划和任务边界', color: '#38bdf8' },
  { title: 'Permission', desc: '列出允许工具、禁止动作和授权阶段', color: '#f59e0b' },
  { title: 'Checkpoint', desc: '记录验证证据、恢复点和下一步', color: '#10b981' },
  { title: 'Resume', desc: '沉淀 CLI 续跑提示和交接说明', color: '#8b5cf6' }
];

export default function AgentPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const [relayInput, setRelayInput] = useState('');
  const [parsedRelay, setParsedRelay] = useState<ParsedCapsule | null>(null);
  const agentLogs = useLiveQuery(() => db.eventLog.where('level').equals('info').reverse().sortBy('createdAt'), [])?.filter(log => log.detail?.scope === 'agent').slice(0, 8) || [];
  const agentTasks = useLiveQuery(() => db.items.filter(item => !item.deletedAt && (!!item.extra?.agent || !!item.extra?.aixCampaign)).toArray(), []) || [];
  const recoveryQueue = agentTasks.map(task => {
    const subtasks = task.subtasks || [];
    const done = subtasks.filter(item => item.done).length;
    const percent = subtasks.length ? Math.round(done / subtasks.length * 100) : 0;
    const phase = percent === 100 ? '可归档' : task.extra?.aixCampaign ? '战役恢复' : task.extra?.risk === '低风险' ? '执行中' : '待授权';
    const next = subtasks.find(item => !item.done)?.title || '等待复盘归档';
    return { task, done, total: subtasks.length, percent, phase, next };
  }).sort((a, b) => b.task.updatedAt - a.task.updatedAt).slice(0, 6);
  const autonomyQueue = agentTasks.map(task => {
    const subtasks = task.subtasks || [];
    const done = subtasks.filter(item => item.done).length;
    const percent = subtasks.length ? Math.round(done / subtasks.length * 100) : 0;
    const risk = String(task.extra?.risk || (task.extra?.aixCampaign ? '中风险' : '低风险'));
    const needsApproval = risk !== '低风险' && percent < 67;
    const urgency = Math.min(100, (RISK_WEIGHT[risk] || 30) + (100 - percent) * 0.46 + (Date.now() - task.updatedAt > 86_400_000 ? 14 : 0));
    return {
      task,
      percent,
      urgency: Math.round(urgency),
      phase: needsApproval ? '等待授权' : percent === 100 ? '归档复盘' : task.extra?.aixCampaign ? '战役续跑' : '自动推进',
      next: subtasks.find(item => !item.done)?.title || '归档执行证据',
      color: needsApproval ? '#f59e0b' : percent === 100 ? '#22c55e' : '#38bdf8'
    };
  }).sort((a, b) => b.urgency - a.urgency).slice(0, 5);
  const autonomyScore = autonomyQueue.length ? Math.max(0, Math.round(100 - autonomyQueue.reduce((sum, item) => sum + item.urgency, 0) / autonomyQueue.length * 0.58)) : 100;
  const cliResumeRadar = agentTasks.map(task => {
    const workflow = task.extra?.claudeWorkflow || {};
    const subtasks = task.subtasks || [];
    const done = subtasks.filter(item => item.done).length;
    const percent = subtasks.length ? Math.round(done / subtasks.length * 100) : 0;
    const risk = String(task.extra?.risk || (task.extra?.aixCampaign ? '中风险' : '低风险'));
    const workflowScore = ['plan', 'tools', 'checkpoint', 'resume'].filter(key => workflow[key]).length * 25;
    const missing = CLI_WORKFLOW_STEPS.filter(step => step.title === 'Plan' ? !workflow.plan : step.title === 'Permission' ? !workflow.tools && !workflow.forbidden : step.title === 'Checkpoint' ? !workflow.checkpoint : !workflow.resume).map(step => step.title);
    const breakpoint = missing[0] || (percent === 100 ? 'Archive' : 'Resume');
    const priority = Math.min(100, Math.round((RISK_WEIGHT[risk] || 30) * 0.34 + (100 - percent) * 0.38 + (100 - workflowScore) * 0.28));
    return { task, percent, risk, workflowScore, breakpoint, priority, resume: workflow.resume || `claude code cli 续跑：读取 ${task.title} 的 Item.extra 和未完成子任务，从 ${breakpoint} 断点继续。`, next: subtasks.find(item => !item.done)?.title || '归档执行证据' };
  }).sort((a, b) => b.priority - a.priority).slice(0, 5);
  const evidenceBundle = cliResumeRadar.map(item => ({
    title: item.task.title,
    checkpoint: item.task.extra?.claudeWorkflow?.checkpoint || item.task.extra?.contract?.evidence || '等待证据写入',
    resume: item.resume,
    proof: `risk=${item.risk}; progress=${item.percent}%; breakpoint=${item.breakpoint}; priority=${item.priority}`,
    exportText: `### ${item.task.title}\n- Checkpoint: ${item.task.extra?.claudeWorkflow?.checkpoint || '待补充'}\n- Resume: ${item.resume}\n- Proof: risk=${item.risk}; progress=${item.percent}%; breakpoint=${item.breakpoint}`
  }));
  const checkpointBranches = cliResumeRadar.map(item => ({
    id: item.task.id,
    title: item.task.title,
    risk: item.risk,
    percent: item.percent,
    breakpoint: item.breakpoint,
    resume: item.resume,
    next: item.next,
    proof: `progress=${item.percent}%; risk=${item.risk}; priority=${item.priority}`
  }));
  const checkpointCapsule = buildCheckpointCapsule(checkpointBranches);
  const relayChains = agentTasks
    .filter(task => !!task.extra?.relayFrom)
    .reduce<Record<string, typeof agentTasks>>((map, task) => {
      const key = String(task.extra?.relayFrom);
      if (!map[key]) map[key] = [];
      map[key].push(task);
      return map;
    }, {});
  const relayChainList = Object.entries(relayChains)
    .map(([capsuleId, tasks]) => ({
      capsuleId,
      tasks: [...tasks].sort((a, b) => a.createdAt - b.createdAt),
      latestAt: Math.max(...tasks.map(task => task.updatedAt))
    }))
    .sort((a, b) => b.latestAt - a.latestAt)
    .slice(0, 6);
  const relayTree = buildRelayTree(agentTasks);
  const relayMaxDepth = relayTree.reduce((max, node) => Math.max(max, node.depth), 0);
  const capsuleLogs = useLiveQuery(() => db.eventLog.where('level').equals('info').reverse().sortBy('createdAt'), [])?.filter(log => {
    const scope = String(log.detail?.scope || '');
    return scope === 'agent-checkpoint-capsule' || scope === 'agent-checkpoint-relay';
  }) || [];
  const referencedCapsules = new Set(agentTasks.map(task => String(task.extra?.relayFrom || '')).filter(Boolean));
  const orphanCapsuleLogs = capsuleLogs.filter(log => {
    const capsuleId = String(log.detail?.capsuleId || '');
    return capsuleId && !referencedCapsules.has(capsuleId);
  });
  const sleepingBranches = findSleepingRelayBranches(agentTasks, 24);
  const relayFailureLogs = useLiveQuery(() => db.eventLog.toArray(), []) || [];
  const branchHealthScores = scoreRelayBranches(agentTasks, relayFailureLogs);
  const branchHealthTrend = buildBranchHealthTrend(agentTasks, relayFailureLogs, 7);

  const disciplineCoach = autonomyQueue.map(item => ({
    title: item.task.title,
    risk: String(item.task.extra?.risk || (item.task.extra?.aixCampaign ? '中风险' : '低风险')),
    action: item.phase === '等待授权' ? '先补权限确认和禁止动作清单，不自动执行。' : item.percent === 100 ? '今天只做归档复盘，把证据写入恢复日志。' : `今天只完成：${item.next}`,
    token: `coach://${item.task.id}?phase=${encodeURIComponent(item.phase)}&mode=min-step`,
    color: item.color
  }));

  async function createAgentTask(template: typeof AGENT_TEMPLATES[number]) {
    const now = Date.now();
    await db.items.add({
      id: nanoid(),
      type: 'work',
      title: template.title,
      description: template.desc,
      startTime: now,
      allDay: false,
      isLunar: false,
      reminders: [],
      completeStatus: 'pending',
      importance: template.risk === '低风险' ? 1 : 0,
      subtasks: [
        { id: nanoid(), title: '只读分析当前状态', done: false },
        { id: nanoid(), title: '等待人工确认权限', done: false },
        { id: nanoid(), title: '执行后写入恢复日志', done: false }
      ],
      extra: { agent: true, risk: template.risk, recoverable: true, contract: { allow: template.allow, deny: template.deny, evidence: template.evidence, approval: template.risk === '低风险' ? '自动记录' : '人工确认' }, claudeWorkflow: { plan: template.desc, tools: template.allow, forbidden: template.deny, checkpoint: template.evidence, resume: `claude code cli 续跑：恢复 ${template.title}，先读本地 Item.extra.contract，再按子任务继续。` } },
      createdAt: now,
      updatedAt: now
    });
    await db.eventLog.add({ id: nanoid(), level: 'info', message: `Agent 任务已创建：${template.title}`, detail: { scope: 'agent', risk: template.risk, recoverable: true }, createdAt: now });
    message.success('已创建可恢复 Agent 任务');
  }

  async function copyText(text: string, hint = '内容已复制') {
    try {
      await navigator.clipboard.writeText(text);
      message.success(hint);
    } catch {
      message.error('剪贴板不可用，请手动选择文本复制');
    }
  }

  function downloadCapsule() {
    const filename = `${checkpointCapsule.capsuleId}.json`;
    const blob = new Blob([checkpointCapsule.json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    message.success(`Checkpoint 胶囊已下载：${filename}`);
  }

  async function archiveCapsule() {
    await db.eventLog.add({ id: nanoid(), level: 'info', message: `Agent Checkpoint 胶囊已归档：${checkpointCapsule.capsuleId}`, detail: { scope: 'agent-checkpoint-capsule', capsuleId: checkpointCapsule.capsuleId, summary: checkpointCapsule.summary }, createdAt: Date.now() });
    message.success('胶囊已写入本地审计日志');
  }

  function parseRelayInput() {
    const trimmed = relayInput.trim();
    if (!trimmed) { message.warning('请粘贴一段 aix-cli-checkpoint-1.0 胶囊 JSON'); return; }
    const result = parseCheckpointCapsule(trimmed);
    setParsedRelay(result);
    message[result.ok ? 'success' : 'error'](result.reason);
  }

  async function pickRelayFile() {
    return new Promise<void>(resolve => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) { resolve(); return; }
        const reader = new FileReader();
        reader.onload = () => {
          setRelayInput(String(reader.result || ''));
          resolve();
        };
        reader.onerror = () => { message.error('读取文件失败'); resolve(); };
        reader.readAsText(file);
      };
      input.click();
    });
  }

  async function relayBranches() {
    if (!parsedRelay?.ok || !parsedRelay.branches.length) { message.warning('请先解析有效的胶囊 JSON'); return; }
    const now = Date.now();
    for (const branch of parsedRelay.branches) {
      await db.items.add({
        id: nanoid(),
        type: 'work',
        title: `接力 · ${branch.title}`,
        description: `胶囊 ${parsedRelay.capsuleId} · ${branch.breakpoint} · 进度 ${branch.percent}%`,
        startTime: now,
        allDay: false,
        isLunar: false,
        reminders: [],
        completeStatus: 'pending',
        importance: branch.risk === '低风险' ? 1 : 0,
        subtasks: [
          { id: nanoid(), title: `恢复点：${branch.breakpoint}`, done: false },
          { id: nanoid(), title: `下一步：${branch.next}`, done: false },
          { id: nanoid(), title: '执行后写入恢复证据', done: false }
        ],
        extra: { agent: true, relayFrom: parsedRelay.capsuleId, risk: branch.risk, recoverable: true, claudeWorkflow: { plan: `接力恢复来自 ${parsedRelay.capsuleId}`, tools: '本地 Item 恢复', forbidden: '禁止读取日记正文', checkpoint: `progress=${branch.percent}%`, resume: branch.resume } },
        createdAt: now,
        updatedAt: now
      });
    }
    await db.eventLog.add({ id: nanoid(), level: 'info', message: `Agent 接力胶囊导入：${parsedRelay.branches.length} 个分支`, detail: { scope: 'agent-checkpoint-relay', capsuleId: parsedRelay.capsuleId, summary: parsedRelay.summary }, createdAt: now });
    message.success(`已接力创建 ${parsedRelay.branches.length} 个 Agent 分支`);
  }

  function exportRelayMarkdown() {
    if (!relayChainList.length) { message.warning('暂无接力链路可导出'); return; }
    const md = relayChainList.map(chain => {
      const lines = [`## ${chain.capsuleId}（${chain.tasks.length} 个分支，最近 ${dayjs(chain.latestAt).format('MM-DD HH:mm')}）`];
      for (const task of chain.tasks) {
        const subtasks = task.subtasks || [];
        const done = subtasks.filter(item => item.done).length;
        const total = subtasks.length || 1;
        const percent = Math.round(done / total * 100);
        lines.push(`- **${task.title}** · 风险 ${String(task.extra?.risk || '低风险')} · 进度 ${percent}% · 创建 ${dayjs(task.createdAt).format('MM-DD HH:mm')}`);
        if (task.extra?.claudeWorkflow?.resume) lines.push(`  - 续跑：${String(task.extra?.claudeWorkflow?.resume).slice(0, 200)}`);
      }
      return lines.join('\n');
    }).join('\n\n');
    const filename = `agent-relay-chain-${dayjs().format('YYYYMMDD-HHmm')}.md`;
    const blob = new Blob([`# Agent 接力链路导出 ${dayjs().format('YYYY-MM-DD HH:mm')}\n\n${md}\n`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    message.success(`接力链路 Markdown 已下载：${filename}`);
  }

  function exportRelayDepthMarkdown() {
    if (!relayTree.length) { message.warning('当前没有多跳接力分支'); return; }
    const md = buildRelayTreeMarkdown(relayTree);
    const filename = `agent-relay-depth-${dayjs().format('YYYYMMDD-HHmm')}.md`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    message.success(`接力深度树 Markdown 已下载：${filename}`);
  }

  async function cleanOrphanCapsules() {
    if (!orphanCapsuleLogs.length) { message.info('暂无失效胶囊日志可清理'); return; }
    await db.eventLog.bulkDelete(orphanCapsuleLogs.map(log => log.id));
    await db.eventLog.add({ id: nanoid(), level: 'info', message: `Agent 失效胶囊清理：${orphanCapsuleLogs.length} 条`, detail: { scope: 'agent-orphan-cleanup', count: orphanCapsuleLogs.length }, createdAt: Date.now() });
    message.success(`已清理 ${orphanCapsuleLogs.length} 条失效胶囊日志`);
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 28, background: isDark ? `linear-gradient(135deg, ${accent}18, rgba(10,14,28,0.96))` : 'linear-gradient(135deg, rgba(37,99,235,0.94), rgba(15,23,42,0.9))' }} bodyStyle={{ padding: 24 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.84)' }}><ThunderboltOutlined /> Aix Agent 中枢</Typography.Text>
        <Typography.Title level={2} style={{ color: '#fff', margin: '8px 0 10px' }}>任务分支 · 权限确认 · 可恢复执行</Typography.Title>
        <Typography.Paragraph style={{ color: 'rgba(226,232,240,0.84)', marginBottom: 0 }}>把个人成长、电脑控制和模型调度统一成可观测 Agent 流程，先记录、再授权、后执行。</Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        {AGENT_TEMPLATES.map(template => (
          <Col xs={24} lg={8} key={template.title}>
            <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ height: '100%', borderRadius: 24, background: cardBg, border: `1px solid ${template.color}22` }}>
              <Space size={8} style={{ marginBottom: 10 }}>
                <BranchesOutlined style={{ color: template.color }} />
                <Typography.Text strong style={{ color: titleColor }}>{template.title}</Typography.Text>
              </Space>
              <Typography.Paragraph style={{ color: subColor }}>{template.desc}</Typography.Paragraph>
              <Space wrap>
                <Tag color={template.risk === '低风险' ? 'green' : 'gold'}>{template.risk}</Tag>
                <Tag>可恢复</Tag>
                <Tag>写日志</Tag>
              </Space>
              <Button type="primary" block onClick={() => createAgentTask(template)} style={{ marginTop: 14, borderRadius: 12 }}>创建 Agent 分支</Button>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: `1px solid ${accent}22` }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <ThunderboltOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Claude Code CLI 工作流交接舱</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>把每个 Agent 分支压成 Claude Code 式计划、权限、检查点和 Resume 提示，方便中断后从本地任务继续。</Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {CLI_WORKFLOW_STEPS.map((step, index) => <Col xs={24} md={12} xl={6} key={step.title}>
            <div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? `${step.color}12` : `${step.color}08`, border: `1px solid ${step.color}24` }}>
              <Space wrap><Tag color="blue">#{index + 1}</Tag><Typography.Text strong style={{ color: titleColor }}>{step.title}</Typography.Text></Space>
              <Typography.Paragraph style={{ color: subColor, margin: '8px 0 0', fontSize: 12 }}>{step.desc}</Typography.Paragraph>
            </div>
          </Col>)}
        </Row>
        <Space direction="vertical" size={8} style={{ width: '100%', marginTop: 14 }}>
          {recoveryQueue.slice(0, 3).map(item => {
            const workflow = item.task.extra?.claudeWorkflow;
            return <div key={item.task.id} style={{ padding: 12, borderRadius: 16, background: isDark ? 'rgba(56,189,248,0.10)' : 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.22)' }}>
              <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}><Typography.Text strong style={{ color: titleColor }}>{item.task.title}</Typography.Text><Tag color={workflow ? 'green' : 'gold'}>{workflow ? 'CLI 交接已生成' : '等待新建工作流'}</Tag></Space>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>Resume：{workflow?.resume || `读取任务 ${item.task.id}，按未完成子任务继续执行。`}</div>
            </div>;
          })}
          {!recoveryQueue.length ? <Alert type="info" showIcon message="创建 Agent 分支后会自动生成 CLI 工作流交接信息。" style={{ borderRadius: 12 }} /> : null}
        </Space>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: `1px solid ${accent}22` }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <HistoryOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Claude Code CLI 续跑雷达</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>自动读取 Plan / Permission / Checkpoint / Resume 断点、子任务进度和风险权重，排序最该恢复的 Agent 分支。</Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {cliResumeRadar.length ? cliResumeRadar.map((item, index) => <Col xs={24} md={12} xl={8} key={item.task.id}>
            <div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.24)' }}>
              <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}><Space wrap><Tag color={index === 0 ? 'red' : 'blue'}>#{index + 1}</Tag><Typography.Text strong style={{ color: titleColor }}>{item.task.title}</Typography.Text></Space><Tag color={item.priority >= 72 ? 'red' : item.priority >= 48 ? 'gold' : 'green'}>恢复 {item.priority}</Tag></Space>
              <Progress percent={item.percent} size="small" strokeColor="#8b5cf6" trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} style={{ marginTop: 8 }} />
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>断点：{item.breakpoint} · 工作流 {item.workflowScore}</div>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>下一步：{item.next}</div>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>Resume：{item.resume}</div>
            </div>
          </Col>) : <Col span={24}><Alert type="info" showIcon message="创建 Agent 分支后会生成 CLI 续跑雷达。" style={{ borderRadius: 12 }} /></Col>}
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: `1px solid ${accent}22` }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <HistoryOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>CLI 续跑证据链打包</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>把 Checkpoint、Resume、风险和子任务进度打成可复制证据链，便于 Claude Code 断点恢复；只输出文本，不自动执行。</Typography.Paragraph>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          {evidenceBundle.length ? evidenceBundle.map(item => <div key={item.title} style={{ padding: 14, borderRadius: 16, background: isDark ? 'rgba(56,189,248,0.10)' : 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.22)' }}>
            <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}><Typography.Text strong style={{ color: titleColor }}>{item.title}</Typography.Text><Tag color="blue">可复制证据链</Tag></Space>
            <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>Checkpoint：{item.checkpoint}</div>
            <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>Resume：{item.resume}</div>
            <pre style={{ margin: '8px 0 0', padding: 10, borderRadius: 12, whiteSpace: 'pre-wrap', color: titleColor, background: isDark ? 'rgba(0,0,0,0.22)' : 'rgba(15,23,42,0.04)' }}>{item.exportText}</pre>
          </div>) : <Alert type="info" showIcon message="暂无可打包 Agent 证据链；创建 Agent 分支后会自动生成。" style={{ borderRadius: 12 }} />}
        </Space>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: `1px solid ${accent}22` }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <CodeOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>CLI 续跑 Checkpoint 胶囊</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>把所有 Agent 分支的 Plan / Permission / Checkpoint / Resume 压成单个可粘贴回 Claude Code CLI 的胶囊：JSON 一键下载，Prompt 一键复制；只用本地 Item 元数据，不读取日记正文。</Typography.Paragraph>
        <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 14 }}>
          <Col xs={24} md={8}>
            <div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? `${accent}10` : `${accent}08`, border: `1px solid ${accent}22` }}>
              <Typography.Text style={{ color: subColor }}>{checkpointCapsule.capsuleId}</Typography.Text>
              <Typography.Title level={4} style={{ color: titleColor, margin: '6px 0 10px' }}>{dayjs(checkpointCapsule.generatedAt).format('MM-DD HH:mm:ss')}</Typography.Title>
              <Space wrap>
                <Tag color="blue">总分支 {checkpointCapsule.summary.total}</Tag>
                <Tag color="purple">待续跑 {checkpointCapsule.summary.pending}</Tag>
                <Tag color="gold">待授权 {checkpointCapsule.summary.needsApproval}</Tag>
                <Tag color="green">可归档 {checkpointCapsule.summary.archived}</Tag>
              </Space>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <Space wrap>
              <Button type="primary" disabled={!checkpointBranches.length} onClick={() => copyText(checkpointCapsule.prompt, 'CLI Prompt 已复制')} style={{ borderRadius: 12 }}>复制 CLI 续跑 Prompt</Button>
              <Button disabled={!checkpointBranches.length} onClick={() => copyText(checkpointCapsule.json, '胶囊 JSON 已复制')} style={{ borderRadius: 12 }}>复制 JSON</Button>
              <Button disabled={!checkpointBranches.length} onClick={downloadCapsule} style={{ borderRadius: 12 }}>下载胶囊文件</Button>
              <Button disabled={!checkpointBranches.length} onClick={archiveCapsule} style={{ borderRadius: 12 }}>归档到本地审计</Button>
            </Space>
            <Alert type="info" showIcon style={{ marginTop: 12, borderRadius: 12 }} message="胶囊只包含分支元数据：风险、进度、断点、续跑提示；不包含子任务原文以外的私人正文，不调用 Aix API。" />
          </Col>
        </Row>
        {checkpointBranches.length ? (
          <pre style={{ margin: 0, padding: 12, borderRadius: 14, maxHeight: 240, overflow: 'auto', whiteSpace: 'pre-wrap', color: titleColor, background: isDark ? 'rgba(0,0,0,0.32)' : 'rgba(15,23,42,0.05)', border: `1px solid ${accent}22` }}>{checkpointCapsule.prompt}</pre>
        ) : <Alert type="info" showIcon message="尚无 Agent 分支；创建分支后此处会生成可粘贴回 Claude Code 的胶囊文本。" style={{ borderRadius: 12 }} />}
        <div style={{ marginTop: 18, padding: 14, borderRadius: 16, background: isDark ? 'rgba(139,92,246,0.10)' : 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.22)' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>
            <Typography.Text strong style={{ color: titleColor }}>接力导入：胶囊一键展开为 Agent 分支</Typography.Text>
            <Tag color="purple">aix-cli-checkpoint-1.0</Tag>
          </Space>
          <Typography.Paragraph style={{ color: subColor, marginBottom: 10, fontSize: 12 }}>粘贴或选择别人导出的胶囊 JSON，校验版本后一键创建对应数量的 Agent 接力分支；只用胶囊里的元数据，不自动执行未知动作，每条 Item 携带 relayFrom 标记便于审计。</Typography.Paragraph>
          <Input.TextArea rows={4} value={relayInput} onChange={event => setRelayInput(event.target.value)} placeholder='粘贴 AIX-CKPT-*.json 内容' style={{ borderRadius: 12 }} />
          <Space wrap style={{ marginTop: 10 }}>
            <Button type="primary" onClick={parseRelayInput} style={{ borderRadius: 12 }}>解析胶囊</Button>
            <Button onClick={pickRelayFile} style={{ borderRadius: 12 }}>选择 JSON 文件</Button>
            <Button disabled={!parsedRelay?.ok || !parsedRelay.branches.length} onClick={relayBranches} style={{ borderRadius: 12 }}>一键创建 {parsedRelay?.branches.length || 0} 个接力分支</Button>
            <Button onClick={() => { setRelayInput(''); setParsedRelay(null); }} style={{ borderRadius: 12 }}>清空</Button>
          </Space>
          {parsedRelay ? (
            <div style={{ marginTop: 12 }}>
              <Space wrap>
                <Tag color={parsedRelay.ok ? 'green' : 'red'}>{parsedRelay.ok ? '版本匹配' : '版本不匹配'}</Tag>
                {parsedRelay.capsuleId ? <Tag color="blue">{parsedRelay.capsuleId}</Tag> : null}
                <Tag color="default">总分支 {parsedRelay.summary.total}</Tag>
                <Tag color="purple">待续跑 {parsedRelay.summary.pending}</Tag>
                <Tag color="gold">待授权 {parsedRelay.summary.needsApproval}</Tag>
                <Tag color="green">可归档 {parsedRelay.summary.archived}</Tag>
              </Space>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8, marginTop: 6 }}>{parsedRelay.reason}</div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: `1px solid ${accent}22` }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <BranchesOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Agent 接力链路时间线</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>把通过胶囊接力创建的 Agent 分支按 capsuleId 聚合并按时间排序，让多人协作链路一眼可见；只读取本地 Item.extra.relayFrom 标记，不上传任何数据。</Typography.Paragraph>
        <Space wrap style={{ marginBottom: 12 }}>
          <Button disabled={!relayChainList.length} onClick={exportRelayMarkdown} style={{ borderRadius: 12 }}>导出接力链路 Markdown</Button>
          <Button disabled={!relayTree.length} onClick={exportRelayDepthMarkdown} style={{ borderRadius: 12 }}>导出深度树 Markdown</Button>
          <Tag color="purple">只导出元数据，不含日记正文</Tag>
        </Space>
        {relayChainList.length ? (
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            {relayChainList.map(chain => (
              <div key={chain.capsuleId} style={{ padding: 14, borderRadius: 16, background: isDark ? 'rgba(139,92,246,0.10)' : 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.22)' }}>
                <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Space wrap>
                    <Tag color="purple">{chain.capsuleId}</Tag>
                    <Typography.Text strong style={{ color: titleColor }}>{chain.tasks.length} 个接力分支</Typography.Text>
                  </Space>
                  <Tag color="blue">最近活动 {dayjs(chain.latestAt).format('MM-DD HH:mm')}</Tag>
                </Space>
                <Timeline items={chain.tasks.map(task => {
                  const subtasks = task.subtasks || [];
                  const done = subtasks.filter(item => item.done).length;
                  const total = subtasks.length || 1;
                  const percent = Math.round(done / total * 100);
                  return {
                    color: percent === 100 ? 'green' : percent >= 50 ? 'blue' : 'gray',
                    children: (
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Space wrap>
                          <Typography.Text strong style={{ color: titleColor }}>{task.title}</Typography.Text>
                          <Tag color={String(task.extra?.risk || '低风险') === '低风险' ? 'green' : 'gold'}>{String(task.extra?.risk || '低风险')}</Tag>
                          <Tag color={percent === 100 ? 'green' : percent >= 50 ? 'blue' : 'default'}>进度 {percent}%</Tag>
                        </Space>
                        <Typography.Text style={{ color: subColor, fontSize: 12 }}>创建：{dayjs(task.createdAt).format('MM-DD HH:mm')} · 更新：{dayjs(task.updatedAt).format('MM-DD HH:mm')}</Typography.Text>
                        {task.extra?.claudeWorkflow?.resume ? <Typography.Text style={{ color: subColor, fontSize: 12 }}>续跑：{String(task.extra?.claudeWorkflow?.resume).slice(0, 96)}…</Typography.Text> : null}
                      </Space>
                    )
                  };
                })} />
              </div>
            ))}
          </Space>
        ) : <Alert type="info" showIcon message="暂无接力分支；从其他人导入的 Checkpoint 胶囊会出现在这里。" style={{ borderRadius: 12 }} />}
        <div style={{ marginTop: 18, padding: 14, borderRadius: 16, background: isDark ? 'rgba(56,189,248,0.10)' : 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.22)' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>
            <Typography.Text strong style={{ color: titleColor }}>接力深度追溯（多跳追踪）</Typography.Text>
            <Tag color="blue">最深 {relayMaxDepth} 跳</Tag>
          </Space>
          <Typography.Paragraph style={{ color: subColor, marginBottom: 10, fontSize: 12 }}>从 Item.extra.relayFrom 递归回溯每个接力分支的源头，缩进展示深度链路；让 A→B→C 多跳协作一目了然，深度越大说明接力链越长，越需要复盘起点。</Typography.Paragraph>
          {relayTree.length ? (
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {relayTree.slice(0, 12).map(node => (
                <div key={node.id} style={{ marginLeft: 18 * Math.max(0, node.depth - 1), padding: '8px 12px', borderRadius: 12, background: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.18)' }}>
                  <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space wrap>
                      <Tag color="blue">深度 {node.depth}</Tag>
                      <Typography.Text strong style={{ color: titleColor }}>{node.title}</Typography.Text>
                      <Tag color={node.risk === '低风险' ? 'green' : 'gold'}>{node.risk}</Tag>
                    </Space>
                    <Tag color={node.percent === 100 ? 'green' : node.percent >= 50 ? 'blue' : 'default'}>进度 {node.percent}%</Tag>
                  </Space>
                  <Typography.Text style={{ color: subColor, fontSize: 12 }}>来自 {node.capsuleId} · 父分支 {node.parentId || '本地胶囊源'}</Typography.Text>
                </div>
              ))}
            </Space>
          ) : <Alert type="success" showIcon message="当前没有多跳接力，所有 Agent 都在本地原始胶囊上推进。" style={{ borderRadius: 12 }} />}
        </div>
        <div style={{ marginTop: 18, padding: 14, borderRadius: 16, background: isDark ? 'rgba(244,114,182,0.10)' : 'rgba(244,114,182,0.06)', border: '1px solid rgba(244,114,182,0.22)' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>
            <Typography.Text strong style={{ color: titleColor }}>失效胶囊审计清理</Typography.Text>
            <Tag color="magenta">孤儿胶囊 {orphanCapsuleLogs.length}</Tag>
          </Space>
          <Typography.Paragraph style={{ color: subColor, marginBottom: 10, fontSize: 12 }}>找出 eventLog 中 scope=agent-checkpoint-capsule / agent-checkpoint-relay 但 capsuleId 已不被任何当前 Agent Item.extra.relayFrom 引用的孤儿日志，可一键批量清理释放空间。</Typography.Paragraph>
          <Space wrap>
            <Button danger disabled={!orphanCapsuleLogs.length} onClick={cleanOrphanCapsules} style={{ borderRadius: 12 }}>清理 {orphanCapsuleLogs.length} 条孤儿日志</Button>
            <Tag color="default">写入 scope=agent-orphan-cleanup 审计</Tag>
          </Space>
        </div>
        <div style={{ marginTop: 18, padding: 14, borderRadius: 16, background: isDark ? 'rgba(245,158,11,0.10)' : 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.22)' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>
            <Typography.Text strong style={{ color: titleColor }}>接力分支 SLA 沉睡告警（≥ 24h）</Typography.Text>
            <Tag color="gold">沉睡 {sleepingBranches.length}</Tag>
          </Space>
          <Typography.Paragraph style={{ color: subColor, marginBottom: 10, fontSize: 12 }}>把超过 24 小时未推进且未归档（进度 &lt; 100%）的接力分支挑出来，提示需要复盘或人工接力；时间从 Item.updatedAt 计算，纯本地。</Typography.Paragraph>
          {sleepingBranches.length ? sleepingBranches.slice(0, 6).map(branch => (
            <div key={branch.id} style={{ marginBottom: 6, padding: 10, borderRadius: 12, background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space wrap>
                  <Tag color={branch.idleHours >= 72 ? 'red' : branch.idleHours >= 48 ? 'gold' : 'orange'}>沉睡 {branch.idleHours}h</Tag>
                  <Typography.Text strong style={{ color: titleColor }}>{branch.title}</Typography.Text>
                  <Tag color={branch.risk === '低风险' ? 'green' : 'gold'}>{branch.risk}</Tag>
                </Space>
                <Typography.Text style={{ color: subColor, fontSize: 12 }}>胶囊 {branch.capsuleId} · 进度 {branch.percent}%</Typography.Text>
              </Space>
            </div>
          )) : <Alert type="success" showIcon message="所有接力分支都在 24 小时内有推进，SLA 健康。" style={{ borderRadius: 12 }} />}
        </div>
        <div style={{ marginTop: 18, padding: 14, borderRadius: 16, background: isDark ? 'rgba(56,189,248,0.10)' : 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.22)' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>
            <Typography.Text strong style={{ color: titleColor }}>接力分支健康度评分</Typography.Text>
            <Tag color="blue">综合 idleHours / percent / 失败次数 / 风险</Tag>
          </Space>
          <Typography.Paragraph style={{ color: subColor, marginBottom: 10, fontSize: 12 }}>每条接力分支按"100 - 空闲时长 × 0.5 - 失败次数 × 8 - 风险扣减 + 进度 × 0.2"加权打分；≥75 健康、≥45 关注、否则风险，便于一眼定位最需要复盘的分支。</Typography.Paragraph>
          {branchHealthScores.length ? branchHealthScores.slice(0, 6).map(branch => (
            <div key={branch.id} style={{ marginBottom: 6, padding: 10, borderRadius: 12, background: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.18)' }}>
              <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space wrap>
                  <Tag color={branch.band === '健康' ? 'green' : branch.band === '关注' ? 'gold' : 'red'}>{branch.score} 分 · {branch.band}</Tag>
                  <Typography.Text strong style={{ color: titleColor }}>{branch.title}</Typography.Text>
                </Space>
                <Typography.Text style={{ color: subColor, fontSize: 12 }}>胶囊 {branch.capsuleId} · 空闲 {branch.idleHours}h · 进度 {branch.percent}% · 失败 {branch.failureCount}</Typography.Text>
              </Space>
            </div>
          )) : <Alert type="info" showIcon message="暂无接力分支可评分；导入胶囊或开始接力后会自动出现。" style={{ borderRadius: 12 }} />}
        </div>
        <div style={{ marginTop: 18, padding: 14, borderRadius: 16, background: isDark ? 'rgba(34,197,94,0.10)' : 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.22)' }}>
          <Space wrap style={{ width: '100%', justifyContent: 'space-between', marginBottom: 10 }}>
            <Typography.Text strong style={{ color: titleColor }}>近 7 天健康度趋势</Typography.Text>
            <Tag color="green">分支平均分 · 绿/黄/红三档</Tag>
          </Space>
          <Typography.Paragraph style={{ color: subColor, marginBottom: 10, fontSize: 12 }}>把每天截止当日的所有接力分支健康度做平均，画成 7 天柱条；&ge;75 绿、&ge;45 黄、否则红，便于看出整体接力健康度是回升还是下滑。</Typography.Paragraph>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 80 }}>
            {branchHealthTrend.map(cell => (
              <div key={cell.dayStart} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div title={`${cell.dateLabel}: 平均 ${cell.avgScore} 分 · ${cell.count} 条分支`} style={{ width: '100%', height: cell.count ? `${Math.max(8, cell.avgScore * 0.6)}px` : '4px', borderRadius: 6, background: !cell.count ? 'rgba(148,163,184,0.32)' : cell.avgScore >= 75 ? 'rgba(34,197,94,0.78)' : cell.avgScore >= 45 ? 'rgba(245,158,11,0.78)' : 'rgba(239,68,68,0.78)' }} />
                <Typography.Text style={{ color: subColor, fontSize: 10 }}>{cell.dateLabel}</Typography.Text>
                <Typography.Text style={{ color: titleColor, fontSize: 10, fontWeight: 600 }}>{cell.count ? `${cell.avgScore}` : '—'}</Typography.Text>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: `1px solid ${accent}22` }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <SafetyCertificateOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Agent 自律教练</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>把自治队列和 CLI 续跑雷达压成今日最小下一步；中高风险只补权限和证据，不自动执行。</Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {disciplineCoach.length ? disciplineCoach.map(item => <Col xs={24} md={12} xl={8} key={item.token}>
            <div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? `${item.color}12` : `${item.color}08`, border: `1px solid ${item.color}28` }}>
              <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}><Typography.Text strong style={{ color: titleColor }}>{item.title}</Typography.Text><Tag color={item.risk === '低风险' ? 'green' : 'gold'}>{item.risk}</Tag></Space>
              <Typography.Paragraph style={{ color: subColor, margin: '8px 0', fontSize: 12 }}>{item.action}</Typography.Paragraph>
              <div style={{ color: subColor, fontSize: 12 }}>{item.token}</div>
            </div>
          </Col>) : <Col span={24}><Alert type="success" showIcon message="暂无停滞 Agent，今日保持低摩擦自律节奏。" style={{ borderRadius: 12 }} /></Col>}
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: `1px solid ${accent}22` }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <ThunderboltOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Agent 自治队列</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>按风险、权限阶段、恢复进度和停滞时间自动排序，让 Aix 知道哪个 Agent 分支该先续跑、授权或归档。</Typography.Paragraph>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <div style={{ height: '100%', padding: 16, borderRadius: 18, background: isDark ? `${accent}12` : `${accent}08`, border: `1px solid ${accent}22` }}>
              <Typography.Text style={{ color: subColor }}>自治健康分</Typography.Text>
              <div style={{ marginTop: 10 }}><Progress type="circle" percent={autonomyScore} strokeColor={autonomyScore >= 75 ? '#22c55e' : autonomyScore >= 48 ? '#f59e0b' : '#ef4444'} trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} /></div>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {autonomyQueue.length ? autonomyQueue.map((item, index) => (
                <div key={item.task.id} style={{ padding: 12, borderRadius: 16, background: isDark ? `${item.color}12` : `${item.color}08`, border: `1px solid ${item.color}28` }}>
                  <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Space wrap><Tag color={index === 0 ? 'red' : 'blue'}>#{index + 1}</Tag><Typography.Text strong style={{ color: titleColor }}>{item.task.title}</Typography.Text><Tag color={item.phase === '等待授权' ? 'gold' : item.phase === '归档复盘' ? 'green' : 'blue'}>{item.phase}</Tag></Space>
                    <Tag color={item.urgency >= 72 ? 'red' : item.urgency >= 46 ? 'gold' : 'green'}>优先级 {item.urgency}</Tag>
                  </Space>
                  <Progress percent={item.percent} size="small" strokeColor={item.color} trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} />
                  <Typography.Text style={{ color: subColor, fontSize: 12 }}>下一步：{item.next}</Typography.Text>
                </div>
              )) : <Alert type="success" showIcon message="当前没有待续跑 Agent，自治队列健康。" style={{ borderRadius: 12 }} />}
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: `1px solid ${accent}22` }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <BranchesOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Agent 恢复驾驶舱</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>自动读取 Agent 分支和 Aix 控制战役，把权限阶段、恢复进度和下一步动作集中展示；中断后可从本地 Item 与 eventLog 恢复。</Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {recoveryQueue.length ? recoveryQueue.map(item => <Col xs={24} md={12} xl={8} key={item.task.id}>
            <div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? `${accent}10` : `${accent}08`, border: `1px solid ${accent}22` }}>
              <Space wrap><Typography.Text strong style={{ color: titleColor }}>{item.task.title}</Typography.Text><Tag color={item.phase === '待授权' ? 'gold' : item.phase === '可归档' ? 'green' : 'blue'}>{item.phase}</Tag></Space>
              <Progress percent={item.percent} size="small" strokeColor={accent} trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} />
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>进度：{item.done}/{item.total || 1}</div>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>下一步：{item.next}</div>
            </div>
          </Col>) : <Col span={24}><Alert type="info" showIcon message="暂无可恢复 Agent 分支；可先创建 Agent 或在 Aix 中枢生成控制战役。" style={{ borderRadius: 12 }} /></Col>}
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: `1px solid ${accent}22` }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <SafetyCertificateOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Agent 权限合约</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>每个 Agent 都必须带权限范围、禁止动作、证据来源和审批阶段；合约随任务写入 Item.extra，恢复时能看到边界。</Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {AGENT_TEMPLATES.map(template => <Col xs={24} md={8} key={template.title}>
            <div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? `${template.color}12` : `${template.color}08`, border: `1px solid ${template.color}22` }}>
              <Space wrap><Typography.Text strong style={{ color: titleColor }}>{template.title}</Typography.Text><Tag color={template.risk === '低风险' ? 'green' : 'gold'}>{template.risk}</Tag></Space>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8, marginTop: 8 }}>允许：{template.allow}</div>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>禁止：{template.deny}</div>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>证据：{template.evidence}</div>
            </div>
          </Col>)}
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: `1px solid ${accent}22` }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <SafetyCertificateOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>权限与恢复策略</Typography.Title>
        </Space>
        <Alert type="info" showIcon message="所有高风险 Agent 只创建计划和日志，不直接改系统；真正控制动作必须走确认、备份、回滚三段式。" style={{ borderRadius: 12, marginBottom: 16 }} />
        <Timeline items={[
          { color: 'blue', children: 'Fork：把目标拆成可追踪 Item 和子任务' },
          { color: 'gold', children: 'Permission：按风险等待人工确认' },
          { color: 'green', children: 'Resume：从 EventLog 和事项状态恢复执行' }
        ]} />
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: `1px solid ${accent}22` }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <HistoryOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>最近 Agent 日志</Typography.Title>
        </Space>
        {agentLogs.length ? agentLogs.map(log => <div key={log.id} style={{ color: subColor, lineHeight: 1.9 }}>· {log.message}</div>) : <div style={{ color: subColor }}>暂无 Agent 执行日志。</div>}
      </Card>
    </Space>
  );
}
