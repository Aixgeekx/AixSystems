// Agent 控制中枢 - 本地任务分支、恢复和权限日志
import React from 'react';
import { Alert, Button, Card, Col, Progress, Row, Space, Tag, Timeline, Typography, message } from 'antd';
import { BranchesOutlined, HistoryOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

const AGENT_TEMPLATES = [
  { title: '成长控制 Agent', desc: '拆解今日目标、习惯和复习压力，生成可恢复的行动分支', risk: '低风险', color: '#10b981' },
  { title: '电脑管理 Agent', desc: '先只读扫描系统状态，再等待人工授权执行控制动作', risk: '需授权', color: '#2563eb' },
  { title: '模型调度 Agent', desc: '记录 Provider 健康、故障转移和策略历史，保障 AI 调用稳定', risk: '中风险', color: '#8b5cf6' }
];

export default function AgentPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
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
      extra: { agent: true, risk: template.risk, recoverable: true },
      createdAt: now,
      updatedAt: now
    });
    await db.eventLog.add({ id: nanoid(), level: 'info', message: `Agent 任务已创建：${template.title}`, detail: { scope: 'agent', risk: template.risk, recoverable: true }, createdAt: now });
    message.success('已创建可恢复 Agent 任务');
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
