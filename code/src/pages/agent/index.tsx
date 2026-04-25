// Agent 控制中枢 - 本地任务分支、恢复和权限日志
import React from 'react';
import { Alert, Button, Card, Col, Progress, Row, Space, Tag, Timeline, Typography, message } from 'antd';
import { BranchesOutlined, HistoryOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

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
