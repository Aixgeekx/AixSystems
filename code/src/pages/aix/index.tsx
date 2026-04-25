// Aix 主入口 - 私人便携 AI 中枢
import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Progress, Row, Space, Tag, Timeline, Typography, message } from 'antd';
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
  { key: 'provider-dispatch', name: 'Provider 调度技能', version: '1.0.0', risk: '中风险', color: '#ec4899', input: 'API / Key / 健康记录', output: '模型故障转移和策略来源' }
];

export default function AixPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const { aixApiUrl, aixApiKey, aixModel, aixProviderProfiles, aixActiveProfile } = useSettingsStore();
  const [thinking, setThinking] = useState('');
  const [answer, setAnswer] = useState('');
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const skillState = useLiveQuery(() => db.cacheKv.get('aixSkillRegistry'), [])?.value as Record<string, boolean> | undefined;
  const skillLogs = useLiveQuery(() => db.eventLog.where('level').equals('info').reverse().sortBy('createdAt'), [])?.filter(log => log.detail?.scope === 'aix-skill').slice(0, 6) || [];
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
    return { todayItems, pending, done, overdue, focusMinutes, reviewPressure, brokenHabits, goalRisk, goals: goals.length, habits: habits.length, diaries: diaries.length, memos: memos.length, dataScore, controlScore, lastBackup: lastBackup?.value, logs };
  }, [aixApiUrl]);
  const providers = useMemo(() => {
    try { return JSON.parse(aixProviderProfiles || '[]') as Array<{ name: string; health?: string; official?: boolean; model?: string }>; } catch { return []; }
  }, [aixProviderProfiles]);
  const enabledSkillCount = SKILLS.filter(skill => skillState?.[skill.key] !== false).length;

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
                <Space wrap><Button size="small" type={enabled ? 'primary' : 'default'} onClick={() => setSkill(skill.key, !enabled)}>{enabled ? '已启用' : '已停用'}</Button><Button size="small" onClick={() => runSkill(skill)} disabled={!enabled}>记录执行</Button></Space>
              </Space>
            </Card></Col>;
          })}
        </Row>
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
