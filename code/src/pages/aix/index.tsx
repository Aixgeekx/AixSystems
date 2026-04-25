// Aix 主入口 - 私人便携 AI 中枢
import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Input, Modal, Progress, Row, Space, Tag, Timeline, Typography, message } from 'antd';
import { BranchesOutlined, CheckCircleOutlined, CloudSyncOutlined, ControlOutlined, DatabaseOutlined, RocketOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { callAixModel } from '@/utils/aixModel';
import { downloadBackup } from '@/utils/export';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeVariants } from '@/hooks/useVariants';

const SKILLS = [
  { key: 'growth-control', name: '成长控制技能', version: '1.0.0', risk: '低风险', color: '#10b981', input: '事项 / 目标 / 习惯 / 复习', output: '今日推进顺序与最小闭环' },
  { key: 'review-peak', name: '复习削峰技能', version: '1.0.0', risk: '低风险', color: '#8b5cf6', input: '提醒队列 / 记忆曲线', output: '未来高压日提前拆分策略' },
  { key: 'focus-operator', name: '专注作战技能', version: '1.0.0', risk: '低风险', color: '#f59e0b', input: '专注历史 / 今日缺口', output: '下一次专注场景与时长' },
  { key: 'desktop-readonly', name: '电脑只读扫描技能', version: '1.0.0', risk: '需确认', color: '#2563eb', input: 'Electron IPC / PowerShell 预设', output: '电脑健康建议与审计日志' },
  { key: 'portable-capsule', name: '私人便携胶囊技能', version: '1.0.0', risk: '低风险', color: '#14b8a6', input: 'IndexedDB / 备份 / 设置', output: '换机迁移与数据主权清单' },
  { key: 'provider-dispatch', name: 'Provider 调度技能', version: '1.1.0', risk: '中风险', color: '#ec4899', input: 'API / Key / 健康记录', output: '模型故障转移和策略来源' }
];

const PLUGIN_PROTOCOLS = [
  { key: 'openai', name: 'OpenAI Compatible', endpoint: '/v1/chat/completions', use: 'OpenAI / cc-switch / LiteLLM 网关' },
  { key: 'claude', name: 'Claude Messages', endpoint: '/v1/messages', use: 'Claude Code 风格专业 Agent 能力' },
  { key: 'ollama', name: 'Ollama Local', endpoint: '127.0.0.1:11434', use: '本地模型离线推理与便携部署' }
];

const CAMPAIGN_STEPS = [
  { key: 'triage', title: '失控清账', color: '#ef4444', desc: '先压逾期和今日待办，把不可控事项降到可处理范围。' },
  { key: 'growth', title: '成长推进', color: '#10b981', desc: '推进一个目标里程碑并修复中断习惯，保持长期增长不断线。' },
  { key: 'review', title: '复习削峰', color: '#8b5cf6', desc: '提前拆分未来 7 天复习压力，避免高峰日爆仓。' },
  { key: 'closure', title: '复盘封存', color: '#06b6d4', desc: '用短复盘封存今日策略，写入审计日志方便明天恢复。' }
];

const EVOLUTION_WINDOWS = [
  { key: '7d', title: '7 天稳态', color: '#10b981', focus: '先修复今日过载、习惯中断和复习峰值。' },
  { key: '30d', title: '30 天增强', color: '#8b5cf6', focus: '把控制战役、Agent 分支和 Provider 策略固定成日常流程。' },
  { key: '90d', title: '90 天全能化', color: '#06b6d4', focus: '扩展插件、桌面工具箱和移动端路线，形成私人便携系统。' }
];

const SKILL_TASK_GRAPH = [
  { key: 'sense', title: '感知数据', color: '#38bdf8', depends: 'IndexedDB / 日志 / Provider', output: '控制信号和风险输入' },
  { key: 'plan', title: '生成策略', color: '#8b5cf6', depends: 'Aix 技能库 / 本地规则 / 可选模型', output: '今日战役和技能动作' },
  { key: 'approve', title: '权限确认', color: '#f59e0b', depends: '权限合约 / 白名单 / 用户确认', output: '安全边界和可执行范围' },
  { key: 'execute', title: '执行归档', color: '#10b981', depends: '事项 / eventLog / 备份', output: '可恢复记录和下一步' }
];

function parseOpenclowManifest(name: string) {
  const clean = name.trim();
  const version = clean.match(/(\d+\.\d+\.\d+)/)?.[1] || 'local';
  const key = clean.toLowerCase().includes('desktop') ? 'desktop-readonly' : clean.toLowerCase().includes('provider') ? 'provider-dispatch' : clean.toLowerCase().includes('review') ? 'review-peak' : 'growth-control';
  const skill = SKILLS.find(item => item.key === key) || SKILLS[0];
  const risk = clean.toLowerCase().includes('ps') || clean.toLowerCase().includes('shell') ? '需确认' : skill.risk;
  const compatibility = clean.includes('openclow') || clean.includes('openclaw') || clean.endsWith('.json') || clean.endsWith('.zip') ? 96 : 72;
  return {
    name: clean,
    version,
    key,
    skill: skill.name,
    risk,
    compatibility,
    schema: `${skill.input} → ${skill.output}`,
    status: 'disabled-dry-run',
    sandbox: {
      permission: risk === '需确认' ? 'manual-approval' : 'readonly-dry-run',
      dryRun: true,
      enabled: false,
      allow: ['读取本地统计', '写入 eventLog 审计', '生成 Item 子任务草案'],
      deny: ['执行未知代码', '读取日记正文', '直通 PowerShell 任意命令'],
      resume: `Claude Code 续跑：校验 ${clean} manifest，保持禁用 dry-run，确认权限合约后再映射内置技能 ${skill.name}。`
    }
  };
}

export default function AixPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const { aixApiUrl, aixApiKey, aixModel, aixProviderProfiles, aixActiveProfile } = useSettingsStore();
  const [thinking, setThinking] = useState('');
  const [answer, setAnswer] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<typeof SKILLS[number] | null>(null);
  const [pluginPackage, setPluginPackage] = useState('');
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const skillState = useLiveQuery(() => db.cacheKv.get('aixSkillRegistry'), [])?.value as Record<string, boolean> | undefined;
  const skillLogs = useLiveQuery(() => db.eventLog.where('level').equals('info').reverse().sortBy('createdAt'), [])?.filter(log => log.detail?.scope === 'aix-skill').slice(0, 6) || [];
  const pluginManifests = useLiveQuery(() => db.eventLog.where('level').equals('info').reverse().sortBy('createdAt'), [])?.filter(log => log.detail?.scope === 'aix-plugin-manifest').slice(0, 4) || [];
  const campaignLogs = useLiveQuery(() => db.eventLog.where('level').equals('info').reverse().sortBy('createdAt'), [])?.filter(log => log.detail?.scope === 'aix-campaign').slice(0, 5) || [];
  const evolutionLogs = useLiveQuery(() => db.eventLog.where('level').equals('info').reverse().sortBy('createdAt'), [])?.filter(log => log.detail?.scope === 'aix-evolution').slice(0, 4) || [];
  const capsule = useLiveQuery(async () => {
    const now = Date.now();
    const todayStart = dayjs().startOf('day').valueOf();
    const weekEnd = dayjs().add(7, 'day').endOf('day').valueOf();
    const [items, goals, habits, habitLogs, queue, sessions, diaries, memos, lastBackup, logs] = await Promise.all([
      db.items.filter(i => !i.deletedAt).toArray(),
      db.goals.filter(g => !g.deletedAt && g.status === 'active').toArray(),
      db.habits.filter(h => !h.deletedAt).toArray(),
      db.habitLogs.toArray(),
      db.reminderQueue.toArray(),
      db.focusSessions.toArray(),
      db.diaries.filter(d => !d.deletedAt).toArray(),
      db.memos.filter(m => !m.deletedAt).toArray(),
      db.cacheKv.get('lastBackupMeta'),
      db.eventLog.orderBy('createdAt').reverse().limit(8).toArray()
    ]);
    const todayItems = items.filter(i => i.startTime >= todayStart && i.startTime <= dayjs().endOf('day').valueOf());
    const pending = todayItems.filter(i => i.completeStatus === 'pending').length;
    const done = todayItems.filter(i => i.completeStatus === 'done').length;
    const overdue = items.filter(i => i.completeStatus !== 'done' && i.startTime < todayStart).length;
    const focusMinutes = Math.round(sessions.filter(s => s.startTime >= todayStart).reduce((sum, s) => sum + s.actualMs / 60000, 0));
    const reviewPressure = queue.filter(q => !q.completedAt && q.fireAt >= todayStart && q.fireAt <= weekEnd).length;
    const brokenHabits = habits.filter(habit => {
      const last = habitLogs.filter(log => log.habitId === habit.id).sort((a, b) => b.date - a.date)[0];
      return !last || dayjs().startOf('day').diff(dayjs(last.date).startOf('day'), 'day') >= 3;
    }).length;
    const goalRisk = goals.filter(goal => {
      const ms = goal.milestones || [];
      const progress = ms.length ? Math.round(ms.filter(m => m.done).length / ms.length * 100) : 0;
      const expected = goal.targetDate ? Math.min(100, Math.max(0, Math.round((now - goal.createdAt) / Math.max(1, goal.targetDate - goal.createdAt) * 100))) : 0;
      return goal.targetDate && progress + 20 < expected;
    }).length;
    const dataScore = Math.min(100, 54 + (lastBackup?.value ? 18 : 0) + Math.min(18, Math.round((items.length + diaries.length + memos.length) / 20)) + (aixApiUrl ? 10 : 0));
    const controlScore = Math.max(0, 100 - overdue * 8 - pending * 4 - brokenHabits * 8 - goalRisk * 10 - Math.max(0, reviewPressure - 8));
    const controlToken = {
      id: `AIX-CORE-${dayjs().format('YYYYMMDD')}-${controlScore}`,
      score: controlScore,
      level: controlScore >= 78 ? '自主推进' : controlScore >= 52 ? '需要干预' : '进入控场',
      command: overdue || pending ? '先清事项债务' : goalRisk || brokenHabits ? '修复成长链路' : reviewPressure > 8 ? '提前削峰复习' : '封存今日复盘',
      resume: `Aix 控制令牌：控制力 ${controlScore}，逾期 ${overdue}，待办 ${pending}，目标风险 ${goalRisk}，习惯中断 ${brokenHabits}，复习压力 ${reviewPressure}。`
    };
    return { todayItems, pending, done, overdue, focusMinutes, reviewPressure, brokenHabits, goalRisk, goals: goals.length, habits: habits.length, diaries: diaries.length, memos: memos.length, dataScore, controlScore, controlToken, lastBackup: lastBackup?.value, logs };
  }, [aixApiUrl]);
  const providers = useMemo(() => {
    try { return JSON.parse(aixProviderProfiles || '[]') as Array<{ name: string; health?: string; official?: boolean; model?: string }>; } catch { return []; }
  }, [aixProviderProfiles]);
  const enabledSkillCount = SKILLS.filter(skill => skillState?.[skill.key] !== false).length;
  const failoverTarget = providers.find(provider => provider.name !== aixActiveProfile && provider.health?.startsWith('正常')) || providers.find(provider => provider.official);
  const campaignPlan = useMemo(() => {
    const overdue = capsule?.overdue || 0;
    const pending = capsule?.pending || 0;
    const goalRisk = capsule?.goalRisk || 0;
    const brokenHabits = capsule?.brokenHabits || 0;
    const reviewPressure = capsule?.reviewPressure || 0;
    const focusMinutes = capsule?.focusMinutes || 0;
    return CAMPAIGN_STEPS.map(step => ({
      ...step,
      score: step.key === 'triage' ? Math.min(100, overdue * 24 + pending * 12) : step.key === 'growth' ? Math.min(100, goalRisk * 32 + brokenHabits * 20) : step.key === 'review' ? Math.min(100, reviewPressure * 8) : Math.min(100, Math.max(20, focusMinutes)),
      action: step.key === 'triage'
        ? `处理 ${Math.max(1, overdue + pending)} 个高压事项，先完成最短闭环。`
        : step.key === 'growth'
          ? `推进 ${Math.max(1, goalRisk)} 个风险目标，恢复 ${Math.max(1, brokenHabits)} 个中断习惯。`
          : step.key === 'review'
            ? `把未来 7 天 ${reviewPressure} 个复习节点拆成提前预热。`
            : `记录 3 句复盘，封存今日控制战役和明日第一动作。`
    }));
  }, [capsule]);
  const evolutionPlan = useMemo(() => {
    const control = capsule?.controlScore || 0;
    const data = capsule?.dataScore || 0;
    const skillRatio = Math.round(enabledSkillCount / SKILLS.length * 100);
    const providerReady = aixApiUrl || failoverTarget ? 100 : 35;
    return EVOLUTION_WINDOWS.map((item, index) => ({
      ...item,
      percent: Math.min(100, Math.round((control + data + skillRatio + providerReady) / 4) + index * 6),
      action: item.key === '7d'
        ? `控制力 ${control}：每天生成一次控制战役，优先清逾期和复习峰值。`
        : item.key === '30d'
          ? `数据主权 ${data}：固定备份、Agent 恢复和 Provider 健康检查节奏。`
          : `技能启用 ${enabledSkillCount}/${SKILLS.length}：把插件、桌面工具箱和移动端发布纳入长期路线。`
    }));
  }, [aixApiUrl, capsule, enabledSkillCount, failoverTarget]);
  const skillTaskGraph = useMemo(() => {
    const readiness = capsule ? Math.round((capsule.controlScore + capsule.dataScore + enabledSkillCount / SKILLS.length * 100 + (aixApiUrl ? 100 : 42)) / 4) : 0;
    return SKILL_TASK_GRAPH.map((node, index) => ({
      ...node,
      readiness: Math.min(100, readiness + index * 4),
      next: index === 0 ? `读取 ${capsule?.todayItems.length || 0} 个今日事项和 ${capsule?.reviewPressure || 0} 个复习压力` : index === 1 ? `调度 ${enabledSkillCount} 个已启用技能生成任务链` : index === 2 ? '高风险电脑/模型动作必须经过权限合约确认' : '写入 eventLog，必要时生成事项或备份'
    }));
  }, [aixApiUrl, capsule, enabledSkillCount]);
  const skillAuditMatrix = useMemo(() => SKILLS.map(skill => {
    const enabled = skillState?.[skill.key] !== false;
    const providerNeed = skill.key === 'provider-dispatch' || skill.key === 'focus-operator';
    const desktopNeed = skill.key === 'desktop-readonly';
    const dataReady = capsule ? skill.key === 'portable-capsule' ? capsule.dataScore : skill.key === 'growth-control' ? Math.max(0, 100 - capsule.goalRisk * 16 - capsule.brokenHabits * 12) : skill.key === 'review-peak' ? Math.min(100, capsule.reviewPressure * 10 + 45) : 78 : 0;
    const providerReady = providerNeed ? (aixApiUrl || failoverTarget ? 96 : 38) : 82;
    const permissionReady = desktopNeed || skill.risk !== '低风险' ? 68 : 96;
    const logReady = skillLogs.some(log => log.detail?.skill === skill.key) ? 100 : 62;
    const score = Math.round((dataReady * 0.36 + providerReady * 0.24 + permissionReady * 0.22 + logReady * 0.18) * (enabled ? 1 : 0.72));
    return { ...skill, enabled, score, fix: !enabled ? '先启用技能' : score >= 82 ? '保持当前链路' : providerNeed && !aixApiUrl && !failoverTarget ? '配置 Provider 或官方回退' : desktopNeed ? '在桌面版执行白名单预检' : '执行一次技能并写入日志' };
  }), [aixApiUrl, capsule, failoverTarget, skillLogs, skillState]);

  async function setSkill(key: string, enabled: boolean) {
    const next = { ...(skillState || {}), [key]: enabled };
    await db.cacheKv.put({ key: 'aixSkillRegistry', value: next });
    message.success(enabled ? '技能已启用' : '技能已停用');
  }

  async function runSkill(skill: typeof SKILLS[number]) {
    const now = Date.now();
    await db.eventLog.add({ id: nanoid(), level: 'info', message: `Aix 技能执行：${skill.name}`, detail: { scope: 'aix-skill', skill: skill.key, risk: skill.risk, version: skill.version }, createdAt: now });
    message.success('技能执行记录已写入本地日志');
  }

  async function importPluginPackage() {
    const name = pluginPackage.trim();
    if (!name) return;
    const manifest = parseOpenclowManifest(name);
    await db.eventLog.add({ id: nanoid(), level: 'info', message: `openclow 技能清单归档：${manifest.name}`, detail: { scope: 'aix-plugin-manifest', manifest }, createdAt: Date.now() });
    setPluginPackage('');
    message.success('本地技能清单已校验并禁用归档');
  }

  async function askAix(intent: 'plan' | 'computer' | 'review') {
    if (!capsule) return;
    setThinking(intent);
    const fallback = intent === 'plan'
      ? `今日控制计划：先处理 ${capsule.overdue} 个逾期和 ${capsule.pending} 个待办，再完成 1 个目标里程碑，最后用 3 句日记复盘。`
      : intent === 'computer'
        ? '电脑建议：先进入超级管理器执行只读扫描，只查看自启、临时目录、端口和 PowerShell 预设，不做破坏性修改。'
        : `晚间复盘：今日完成 ${capsule.done}/${capsule.todayItems.length}，专注 ${capsule.focusMinutes} 分钟，记录一个失控点和一个明日最小动作。`;
    try {
      const text = await callAixModel({ apiUrl: aixApiUrl, apiKey: aixApiKey, model: aixModel }, [
        { role: 'system', content: '你是 AixSystems 内置 AI 中枢，融合 openclaw 的技能生态、Claude Code 的专业 Agent 流程、时光序的私人时间管理，只输出中文可执行建议。' },
        { role: 'user', content: JSON.stringify({ intent, capsule, enabledSkills: SKILLS.filter(skill => skillState?.[skill.key] !== false).map(skill => skill.name) }) }
      ]).catch(() => fallback);
      setAnswer(text);
      await db.eventLog.add({ id: nanoid(), level: 'info', message: `Aix 生成策略：${intent}`, detail: { scope: 'aix-core', intent, model: aixModel, provider: aixActiveProfile || '当前配置' }, createdAt: Date.now() });
    } finally {
      setThinking('');
    }
  }

  async function createCampaign() {
    if (!capsule) return;
    const now = Date.now();
    const id = nanoid();
    await db.items.add({
      id,
      type: 'work',
      title: `Aix 控制战役 · ${dayjs().format('MM-DD')}`,
      description: `控制力 ${capsule.controlScore}，令牌 ${capsule.controlToken.id}，逾期 ${capsule.overdue}，待办 ${capsule.pending}，目标风险 ${capsule.goalRisk}，复习压力 ${capsule.reviewPressure}`,
      startTime: now,
      allDay: false,
      isLunar: false,
      reminders: [],
      completeStatus: 'pending',
      importance: capsule.controlScore < 70 ? 0 : 1,
      subtasks: campaignPlan.map(step => ({ id: nanoid(), title: `${step.title}：${step.action}`, done: false })),
      extra: { aixCampaign: true, controlScore: capsule.controlScore, dataScore: capsule.dataScore, controlToken: capsule.controlToken, stages: campaignPlan },
      createdAt: now,
      updatedAt: now
    });
    await db.eventLog.add({ id: nanoid(), level: 'info', message: 'Aix 控制战役已编排', detail: { scope: 'aix-campaign', itemId: id, controlScore: capsule.controlScore, controlToken: capsule.controlToken, stages: campaignPlan.map(step => step.title) }, createdAt: now });
    message.success('Aix 控制战役已写入今日事项');
  }

  async function archiveEvolution() {
    await db.eventLog.add({ id: nanoid(), level: 'info', message: 'Aix 自进化路线图已归档', detail: { scope: 'aix-evolution', plan: evolutionPlan, provider: aixActiveProfile || '离线模式' }, createdAt: Date.now() });
    message.success('自进化路线图已写入本地日志');
  }

  async function archiveSkillGraph() {
    await db.eventLog.add({ id: nanoid(), level: 'info', message: 'Aix 技能任务图谱已归档', detail: { scope: 'aix-skill-graph', graph: skillTaskGraph, enabledSkillCount, provider: aixActiveProfile || '离线模式' }, createdAt: Date.now() });
    message.success('技能任务图谱已写入本地日志');
  }

  async function portableBackup() {
    const result = await downloadBackup();
    if (result.ok) message.success('私人便携胶囊已生成备份');
    else message.error(result.msg);
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 28, background: isDark ? `linear-gradient(135deg, ${accent}20, rgba(5,8,22,0.96))` : 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(79,70,229,0.9), rgba(20,184,166,0.86))' }} bodyStyle={{ padding: 24 }}>
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}><ThunderboltOutlined /> Aix 内置 AI 中枢</Typography.Text>
            <Typography.Title level={2} style={{ color: '#fff', margin: '8px 0 10px' }}>私人便携系统 · 技能生态 · 专业 Agent</Typography.Title>
            <Typography.Paragraph style={{ color: 'rgba(226,232,240,0.84)', marginBottom: 14 }}>Aix 结合 openclaw 的技能化、Claude Code 的工具/权限/恢复专业性、时光序的私人时间管理数据，成为用户自带 API/Key 驱动的本地 AI 控制中枢。</Typography.Paragraph>
            <Space wrap>
              <Tag color="blue">用户自带 API/Key</Tag>
              <Tag color="green">IndexedDB 本地私有</Tag>
              <Tag color="purple">技能可启停</Tag>
              <Tag color="gold">高风险需确认</Tag>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.14)' }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div><Typography.Text style={{ color: '#dbeafe' }}>当前模式</Typography.Text><Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>{aixApiUrl ? '有灵魂黑科技系统' : '离线全能系统工具'}</Typography.Title></div>
                <Tag color={aixApiUrl ? 'green' : 'gold'}>{aixApiUrl ? 'API 已配置' : '无 API 仍可使用大部分功能'}</Tag>
                <Typography.Text style={{ color: 'rgba(226,232,240,0.78)' }}>模型：{aixModel || '未配置模型'}</Typography.Text>
                <Button type="primary" onClick={() => nav(ROUTES.SYSTEM)} style={{ borderRadius: 12 }}>配置 Provider</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}><Card bordered={false} style={{ borderRadius: 22, background: cardBg, border: cardBorder }}><Typography.Text style={{ color: subColor }}>控制力</Typography.Text><Progress type="dashboard" percent={capsule?.controlScore || 0} strokeColor={accent} /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card bordered={false} style={{ borderRadius: 22, background: cardBg, border: cardBorder }}><Typography.Text style={{ color: subColor }}>数据主权</Typography.Text><Progress type="dashboard" percent={capsule?.dataScore || 0} strokeColor="#10b981" /></Card></Col>
        <Col xs={24} md={12} xl={6}><Card bordered={false} style={{ borderRadius: 22, background: cardBg, border: cardBorder }}><Typography.Text style={{ color: subColor }}>启用技能</Typography.Text><Typography.Title style={{ color: titleColor, margin: '10px 0 0' }}>{enabledSkillCount}/{SKILLS.length}</Typography.Title></Card></Col>
        <Col xs={24} md={12} xl={6}><Card bordered={false} style={{ borderRadius: 22, background: cardBg, border: cardBorder }}><Typography.Text style={{ color: subColor }}>Provider 槽</Typography.Text><Typography.Title style={{ color: titleColor, margin: '10px 0 0' }}>{providers.length}</Typography.Title></Card></Col>
      </Row>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}><ControlOutlined style={{ color: accent }} /><Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Aix 今日控制台</Typography.Title></Space>
        <Space wrap style={{ marginBottom: 14 }}>
          <Tag color="blue">今日 {capsule?.done || 0}/{capsule?.todayItems.length || 0}</Tag>
          <Tag color="red">逾期 {capsule?.overdue || 0}</Tag>
          <Tag color="green">专注 {capsule?.focusMinutes || 0} 分钟</Tag>
          <Tag color="purple">复习压力 {capsule?.reviewPressure || 0}</Tag>
          <Tag color="gold">目标风险 {capsule?.goalRisk || 0}</Tag>
        </Space>
        <Space wrap>
          <Button type="primary" loading={thinking === 'plan'} onClick={() => askAix('plan')} style={{ borderRadius: 12 }}>生成今日控制计划</Button>
          <Button loading={thinking === 'computer'} onClick={() => askAix('computer')} style={{ borderRadius: 12 }}>生成电脑健康建议</Button>
          <Button loading={thinking === 'review'} onClick={() => askAix('review')} style={{ borderRadius: 12 }}>生成晚间复盘</Button>
          <Button icon={<BranchesOutlined />} onClick={() => nav(ROUTES.AGENT)} style={{ borderRadius: 12 }}>进入 Agent 中枢</Button>
        </Space>
        {answer ? <Alert type="success" showIcon message="Aix 输出" description={<Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{answer}</Typography.Paragraph>} style={{ marginTop: 16, borderRadius: 12 }} /> : null}
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}><ControlOutlined style={{ color: accent }} /><Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Aix 黑科技总控令牌</Typography.Title></Space>
        <Typography.Paragraph style={{ color: subColor }}>把今日控制信号压成可被战役、技能和 Agent 恢复链复用的本地令牌；只包含统计信号，不读取日记正文。</Typography.Paragraph>
        <Space align="center" wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <div>
            <Typography.Title level={4} style={{ margin: '0 0 8px', color: titleColor }}>{capsule?.controlToken.id || 'AIX-CORE'} · {capsule?.controlToken.level || '加载中'}</Typography.Title>
            <Typography.Text style={{ color: subColor }}>{capsule?.controlToken.command || '等待控制信号'}</Typography.Text>
            <div style={{ color: subColor, fontSize: 12, marginTop: 8 }}>{capsule?.controlToken.resume || '本地令牌生成后可写入战役和 eventLog。'}</div>
          </div>
          <Progress type="dashboard" percent={capsule?.controlToken.score || 0} strokeColor={(capsule?.controlToken.score || 0) >= 78 ? '#10b981' : (capsule?.controlToken.score || 0) >= 52 ? '#f59e0b' : '#ef4444'} trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} />
        </Space>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}><SafetyCertificateOutlined style={{ color: accent }} /><Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Aix 技能自检矩阵</Typography.Title></Space>
        <Typography.Paragraph style={{ color: subColor }}>按启用状态、数据输入、Provider、权限边界和日志证据给每个技能打分，优先修复影响自主控制的断点。</Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {skillAuditMatrix.map(skill => <Col xs={24} md={12} xl={8} key={skill.key}>
            <div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? `${skill.color}12` : `${skill.color}08`, border: `1px solid ${skill.color}24` }}>
              <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}><Typography.Text strong style={{ color: titleColor }}>{skill.name}</Typography.Text><Tag color={skill.score >= 82 ? 'green' : skill.score >= 58 ? 'gold' : 'red'}>健康 {skill.score}</Tag></Space>
              <Progress percent={skill.score} showInfo={false} strokeColor={skill.color} trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} style={{ margin: '10px 0 6px' }} />
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>输入：{skill.input}</div>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>修复：{skill.fix}</div>
            </div>
          </Col>)}
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}><BranchesOutlined style={{ color: accent }} /><Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Aix 控制战役编排器</Typography.Title></Space>
        <Typography.Paragraph style={{ color: subColor }}>把今日事项、逾期债务、目标风险、习惯中断和复习压力合成四阶段战役；离线可直接生成本地事项，有 API 时再由 Aix 注入策略灵魂。</Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {campaignPlan.map(step => <Col xs={24} md={12} xl={6} key={step.key}>
            <div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? `${step.color}12` : `${step.color}08`, border: `1px solid ${step.color}22` }}>
              <Space wrap><Typography.Text strong style={{ color: titleColor }}>{step.title}</Typography.Text><Tag color="blue">压力 {step.score}</Tag></Space>
              <Progress percent={step.score} showInfo={false} strokeColor={step.color} trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} />
              <Typography.Paragraph style={{ color: subColor, margin: '8px 0 4px' }}>{step.desc}</Typography.Paragraph>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>动作：{step.action}</div>
            </div>
          </Col>)}
        </Row>
        <Space wrap style={{ marginTop: 14 }}>
          <Button type="primary" onClick={createCampaign} style={{ borderRadius: 12 }}>一键写入今日战役</Button>
          <Tag color="green">写入 Item 子任务</Tag>
          <Tag color="purple">写入 eventLog 审计</Tag>
          <Tag color="gold">可在 Agent 中枢恢复</Tag>
        </Space>
        {campaignLogs.length ? <div style={{ marginTop: 12 }}>{campaignLogs.map(log => <div key={log.id} style={{ color: subColor, lineHeight: 1.8 }}>· {log.message}</div>)}</div> : null}
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}><BranchesOutlined style={{ color: accent }} /><Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Aix 技能任务图谱</Typography.Title></Space>
        <Typography.Paragraph style={{ color: subColor }}>把数据感知、策略生成、权限确认和执行归档组织成可恢复任务链；无 API 时使用本地规则，有 API 后由 Aix 注入策略。</Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {skillTaskGraph.map((node, index) => <Col xs={24} md={12} xl={6} key={node.key}>
            <div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? `${node.color}12` : `${node.color}08`, border: `1px solid ${node.color}22` }}>
              <Space wrap><Tag color="blue">阶段 {index + 1}</Tag><Typography.Text strong style={{ color: titleColor }}>{node.title}</Typography.Text></Space>
              <Progress percent={node.readiness} showInfo={false} strokeColor={node.color} trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} />
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>依赖：{node.depends}</div>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>输出：{node.output}</div>
              <Typography.Paragraph style={{ color: subColor, margin: '8px 0 0', fontSize: 12 }}>{node.next}</Typography.Paragraph>
            </div>
          </Col>)}
        </Row>
        <Space wrap style={{ marginTop: 14 }}>
          <Button type="primary" onClick={archiveSkillGraph} style={{ borderRadius: 12 }}>归档任务图谱</Button>
          <Tag color="green">本地可恢复</Tag>
          <Tag color="gold">权限先行</Tag>
          <Tag color={aixApiUrl ? 'purple' : 'default'}>{aixApiUrl ? '模型增强' : '离线规则'}</Tag>
        </Space>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}><RocketOutlined style={{ color: accent }} /><Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Aix 自进化路线图</Typography.Title></Space>
        <Typography.Paragraph style={{ color: subColor }}>根据控制力、数据主权、技能启用和 Provider 状态，自动生成 7 / 30 / 90 天进化路线；没有 API 也能离线规划，有 API 后可继续让 Aix 深度改写策略。</Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {evolutionPlan.map(item => <Col xs={24} md={8} key={item.key}>
            <div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? `${item.color}12` : `${item.color}08`, border: `1px solid ${item.color}22` }}>
              <Space wrap><Typography.Text strong style={{ color: titleColor }}>{item.title}</Typography.Text><Tag color="green">成熟度 {item.percent}</Tag></Space>
              <Progress percent={item.percent} showInfo={false} strokeColor={item.color} trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} />
              <Typography.Paragraph style={{ color: subColor, margin: '8px 0 4px' }}>{item.focus}</Typography.Paragraph>
              <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>路线：{item.action}</div>
            </div>
          </Col>)}
        </Row>
        <Space wrap style={{ marginTop: 14 }}>
          <Button type="primary" onClick={archiveEvolution} style={{ borderRadius: 12 }}>归档路线图</Button>
          <Tag color={aixApiUrl ? 'green' : 'gold'}>{aixApiUrl ? 'API 灵魂增强' : '离线规划可用'}</Tag>
          <Tag color="purple">长期自进化</Tag>
        </Space>
        {evolutionLogs.length ? <div style={{ marginTop: 12 }}>{evolutionLogs.map(log => <div key={log.id} style={{ color: subColor, lineHeight: 1.8 }}>· {log.message}</div>)}</div> : null}
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}><RocketOutlined style={{ color: accent }} /><Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Aix 技能库 / Skill Registry</Typography.Title></Space>
        <Typography.Paragraph style={{ color: subColor, marginBottom: 12 }}>插件广场采用模块化能力清单，当前先内置官方技能，后续可扩展为本地插件包和版本归档；没有 API 也能执行大部分离线工具，有 API 后由 Aix 统一调度策略。</Typography.Paragraph>
        <Row gutter={[14, 14]}>
          {SKILLS.map(skill => {
            const enabled = skillState?.[skill.key] !== false;
            return <Col xs={24} md={12} xl={8} key={skill.key}><Card size="small" bordered={false} style={{ height: '100%', borderRadius: 18, background: isDark ? `${skill.color}12` : `${skill.color}0d`, border: `1px solid ${skill.color}33` }}>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Space wrap><CheckCircleOutlined style={{ color: skill.color }} /><Typography.Text strong style={{ color: titleColor }}>{skill.name}</Typography.Text><Tag>{skill.version}</Tag><Tag color={skill.risk === '低风险' ? 'green' : 'gold'}>{skill.risk}</Tag></Space>
                <Typography.Text style={{ color: subColor }}>输入：{skill.input}</Typography.Text>
                <Typography.Text style={{ color: subColor }}>输出：{skill.output}</Typography.Text>
                <Space wrap><Button size="small" type={enabled ? 'primary' : 'default'} onClick={() => setSkill(skill.key, !enabled)}>{enabled ? '已启用' : '已停用'}</Button><Button size="small" onClick={() => runSkill(skill)} disabled={!enabled}>记录执行</Button><Button size="small" onClick={() => setSelectedSkill(skill)}>详情 / Schema</Button></Space>
              </Space>
            </Card></Col>;
          })}
        </Row>
        <Modal open={!!selectedSkill} title="Aix 插件详情 / Schema" footer={null} onCancel={() => setSelectedSkill(null)}>
          {selectedSkill ? <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Alert type="info" showIcon message={`${selectedSkill.name} · ${selectedSkill.version} · ${selectedSkill.risk}`} />
            <Typography.Text>输入 Schema：{selectedSkill.input}</Typography.Text>
            <Typography.Text>输出 Schema：{selectedSkill.output}</Typography.Text>
            <Typography.Text>版本归档：当前 {selectedSkill.version}，本地插件包会按名称、版本、导入时间写入 eventLog。</Typography.Text>
          </Space> : null}
        </Modal>
        <Row gutter={[12, 12]} style={{ marginTop: 14 }}>
          <Col xs={24} lg={12}>
            <div style={{ padding: 14, borderRadius: 16, background: isDark ? `${accent}10` : `${accent}08`, border: `1px solid ${accent}22` }}>
              <Typography.Text strong style={{ color: titleColor }}>openclow 本地技能沙盒校验器</Typography.Text>
              <Typography.Paragraph style={{ color: subColor, margin: '8px 0' }}>导入 openclow/openclaw 插件包名后生成 manifest、兼容性、权限合约、dry-run 沙盒和 Claude Code 续跑提示，默认禁用不执行未知代码。</Typography.Paragraph>
              <Space.Compact style={{ width: '100%' }}><Input value={pluginPackage} onChange={event => setPluginPackage(event.target.value)} placeholder="例如 openclow-review-peak-1.2.0.zip" /><Button type="primary" onClick={importPluginPackage}>校验归档</Button></Space.Compact>
            </div>
          </Col>
          <Col xs={24} lg={12}>
            <div style={{ padding: 14, borderRadius: 16, background: isDark ? 'rgba(236,72,153,0.10)' : 'rgba(236,72,153,0.06)', border: '1px solid rgba(236,72,153,0.22)' }}>
              <Typography.Text strong style={{ color: titleColor }}>技能清单审计</Typography.Text>
              <Typography.Paragraph style={{ color: subColor, margin: '8px 0' }}>本地插件包只进入清单审计，不自动启用；能力必须映射到内置技能、权限合约和 eventLog 后才能被调度。</Typography.Paragraph>
              {pluginManifests.length ? pluginManifests.map(log => {
                const manifest = log.detail?.manifest;
                return <div key={log.id} style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>· {manifest?.name} / {manifest?.skill} / {manifest?.sandbox?.permission} / {manifest?.status}<br />Resume：{manifest?.sandbox?.resume}</div>;
              }) : <Typography.Text style={{ color: subColor }}>暂无 openclow 技能清单。</Typography.Text>}
            </div>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}><ThunderboltOutlined style={{ color: accent }} /><Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Aix 本地代理中心</Typography.Title></Space>
        <Typography.Paragraph style={{ color: subColor }}>统一管理 OpenAI、Claude、Ollama 三类协议能力：无 API 时保留离线工具，有 API 或本地模型时由 Aix 自动探活并给出故障转移目标。</Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {PLUGIN_PROTOCOLS.map(protocol => <Col xs={24} md={8} key={protocol.key}><div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? 'rgba(20,184,166,0.10)' : 'rgba(20,184,166,0.06)', border: '1px solid rgba(20,184,166,0.22)' }}>
            <Typography.Text strong style={{ color: titleColor }}>{protocol.name}</Typography.Text>
            <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>端点：{protocol.endpoint}</div>
            <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>用途：{protocol.use}</div>
          </div></Col>)}
        </Row>
        <Space wrap style={{ marginTop: 12 }}>
          <Tag color={aixApiUrl ? 'green' : 'gold'}>{aixApiUrl ? '当前 Provider 可探活' : '当前离线模式'}</Tag>
          <Tag color={failoverTarget ? 'blue' : 'default'}>故障转移目标：{failoverTarget?.name || '待配置'}</Tag>
          <Button onClick={() => nav(ROUTES.SYSTEM)} style={{ borderRadius: 12 }}>进入 Provider 管理</Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Space size={8} style={{ marginBottom: 12 }}><DatabaseOutlined style={{ color: accent }} /><Typography.Title level={4} style={{ margin: 0, color: titleColor }}>私人便携胶囊</Typography.Title></Space>
            <Typography.Paragraph style={{ color: subColor }}>把时光序式私人数据、Aix 技能状态、Provider 策略和日志审计打包成可迁移本地备份，方便换机、便携和离线归档。</Typography.Paragraph>
            <Space wrap>
              <Button type="primary" icon={<CloudSyncOutlined />} onClick={portableBackup} style={{ borderRadius: 12 }}>生成便携备份</Button>
              <Button onClick={() => nav(ROUTES.DATAIO)} style={{ borderRadius: 12 }}>进入数据中心</Button>
            </Space>
            <Timeline style={{ marginTop: 18 }} items={[
              { color: 'blue', children: 'Private：事项、日记、备忘、习惯、目标只保存在本地' },
              { color: 'purple', children: 'Portable：通过 JSON / 桌面 data 目录迁移整个系统' },
              { color: 'green', children: 'Auditable：技能、Agent、Provider 动作写入 eventLog' }
            ]} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Space size={8} style={{ marginBottom: 12 }}><SafetyCertificateOutlined style={{ color: accent }} /><Typography.Title level={4} style={{ margin: 0, color: titleColor }}>专业权限边界</Typography.Title></Space>
            <Alert type="info" showIcon message="默认只读，电脑控制必须确认、备份、回滚；Aix 不开放任意危险 PowerShell 直通。" style={{ borderRadius: 12, marginBottom: 12 }} />
            {skillLogs.length ? skillLogs.map(log => <div key={log.id} style={{ color: subColor, lineHeight: 1.9 }}>· {log.message}</div>) : <Typography.Text style={{ color: subColor }}>暂无技能执行日志。</Typography.Text>}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
