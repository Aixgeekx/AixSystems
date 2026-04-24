// 目标管理 - 目标设定 + 里程碑 + 进度追踪 (v0.21.0 成长系统)
import React, { useState } from 'react';
import { Button, Card, Col, Input, Modal, Progress, Row, Space, Statistic, Tag, Typography, message, Checkbox } from 'antd';
import {
  PlusOutlined,
  TrophyOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  FlagOutlined
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import { db } from '@/db';
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';
import type { Goal } from '@/models';

export default function GoalPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [targetDate, setTargetDate] = useState('');
  const [milestones, setMilestones] = useState<{ title: string; done: boolean }[]>([]);

  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const goals = useLiveQuery(() => db.goals.filter(g => !g.deletedAt).sortBy('sortOrder'), []) || [];

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const riskGoals = activeGoals.map(goal => {
    const ms = goal.milestones || [];
    const progress = ms.length ? Math.round(ms.filter(m => m.done).length / ms.length * 100) : 0;
    const daysLeft = goal.targetDate ? dayjs(goal.targetDate).diff(dayjs().startOf('day'), 'day') : 999;
    const expected = goal.targetDate ? Math.min(100, Math.max(0, Math.round((Date.now() - goal.createdAt) / Math.max(1, goal.targetDate - goal.createdAt) * 100))) : 0;
    const level = daysLeft < 0 ? '已逾期' : goal.targetDate && progress + 20 < expected ? '高风险' : goal.targetDate && daysLeft <= 7 && progress < 80 ? '临期' : '稳定';
    return { goal, progress, daysLeft, expected, level };
  }).filter(item => item.level !== '稳定').slice(0, 3);

  async function save() {
    if (!title.trim()) return message.warning('目标标题不能为空');
    const now = Date.now();
    const ms = milestones.filter(m => m.title.trim()).map(m => ({ ...m }));
    if (editing) {
      await db.goals.update(editing.id, {
        title, description, color,
        targetDate: targetDate ? dayjs(targetDate).valueOf() : undefined,
        milestones: ms, updatedAt: now
      });
    } else {
      await db.goals.add({
        id: nanoid(),
        title, description, color,
        targetDate: targetDate ? dayjs(targetDate).valueOf() : undefined,
        milestones: ms,
        status: 'active',
        sortOrder: goals.length,
        createdAt: now, updatedAt: now
      });
    }
    setOpen(false);
    message.success('保存成功');
  }

  async function toggleMilestone(goal: Goal, index: number) {
    const ms = [...(goal.milestones || [])];
    if (ms[index]) {
      ms[index] = { ...ms[index], done: !ms[index].done };
      const allDone = ms.length > 0 && ms.every(m => m.done);
      await db.goals.update(goal.id, {
        milestones: ms,
        status: allDone ? 'completed' : 'active',
        updatedAt: Date.now()
      });
    }
  }

  async function del(goal: Goal) {
    await db.goals.update(goal.id, { deletedAt: Date.now() });
    message.success('已删除');
  }

  async function archive(goal: Goal) {
    await db.goals.update(goal.id, { status: 'archived', updatedAt: Date.now() });
    message.success('已归档');
  }

  function openNew() {
    setEditing(null);
    setTitle('');
    setDescription('');
    setColor('#2563eb');
    setTargetDate('');
    setMilestones([]);
    setOpen(true);
  }

  function openEdit(goal: Goal) {
    setEditing(goal);
    setTitle(goal.title);
    setDescription(goal.description || '');
    setColor(goal.color);
    setTargetDate(goal.targetDate ? dayjs(goal.targetDate).format('YYYY-MM-DD') : '');
    setMilestones(goal.milestones?.length ? [...goal.milestones] : []);
    setOpen(true);
  }

  function addMilestone() {
    setMilestones([...milestones, { title: '', done: false }]);
  }

  function updateMilestone(index: number, title: string) {
    const ms = [...milestones];
    ms[index] = { ...ms[index], title };
    setMilestones(ms);
  }

  function removeMilestone(index: number) {
    setMilestones(milestones.filter((_, i) => i !== index));
  }

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  function renderGoalCard(goal: Goal, index: number) {
    const ms = goal.milestones || [];
    const doneCount = ms.filter(m => m.done).length;
    const progress = ms.length ? Math.round((doneCount / ms.length) * 100) : 0;
    const isOverdue = goal.targetDate && goal.status === 'active' && goal.targetDate < Date.now();

    return (
      <Card
        key={goal.id}
        bordered={false}
        className="anim-fade-in-up hover-lift"
        style={{
          borderRadius: 24,
          background: cardBg,
          border: cardBorder,
          boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)',
          animationDelay: `${index * 0.06}s`,
          transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              display: 'grid', placeItems: 'center',
              background: `${goal.color}22`,
              color: goal.color, fontSize: 20,
              border: `1px solid ${goal.color}44`
            }}>
              <FlagOutlined />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: titleColor, fontSize: 16 }}>{goal.title}</div>
              <div style={{ color: subColor, fontSize: 12, marginTop: 2 }}>
                {goal.targetDate ? `截止 ${dayjs(goal.targetDate).format('YYYY-MM-DD')}` : '无截止日期'}
                {isOverdue ? <span style={{ color: '#ef4444', marginLeft: 8 }}>已逾期</span> : null}
              </div>
            </div>
          </div>
          <Space>
            <EditOutlined className="hover-scale" style={{ color: subColor, cursor: 'pointer' }} onClick={() => openEdit(goal)} />
            {goal.status === 'active' && (
              <CheckCircleOutlined className="hover-scale" style={{ color: '#22c55e', cursor: 'pointer' }} onClick={() => archive(goal)} />
            )}
            <DeleteOutlined className="hover-scale" style={{ color: subColor, cursor: 'pointer' }} onClick={() => del(goal)} />
          </Space>
        </div>

        {goal.description ? (
          <Typography.Paragraph style={{ color: subColor, marginBottom: 14, fontSize: 13 }}>
            {goal.description}
          </Typography.Paragraph>
        ) : null}

        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: subColor, fontSize: 12 }}>里程碑进度</span>
            <span style={{ color: goal.color, fontWeight: 600, fontSize: 12 }}>{doneCount} / {ms.length}</span>
          </div>
          <Progress
            percent={progress}
            strokeColor={goal.color}
            trailColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}
            showInfo={false}
            strokeLinecap="round"
          />
        </div>

        {ms.length > 0 && (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {ms.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Checkbox
                  checked={m.done}
                  onChange={() => toggleMilestone(goal, i)}
                  style={{ color: m.done ? subColor : titleColor, textDecoration: m.done ? 'line-through' : 'none' }}
                >
                  {m.title}
                </Checkbox>
              </div>
            ))}
          </Space>
        )}
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        className="anim-fade-in-up"
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(59,130,246,0.92) 44%, rgba(14,165,233,0.9) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(59,130,246,0.16)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(219,234,254,0.9)' }}>目标管理工作台</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
              把长远愿景拆成可执行的里程碑
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(226,232,240,0.84)' }}>
              设定目标、拆解里程碑、追踪完成进度。每一个勾选都在把你推向想成为的自己。
            </Typography.Paragraph>
            <Space wrap size={10}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openNew} style={{ borderRadius: 10, boxShadow: `0 8px 20px -4px ${accent}44` }}>新建目标</Button>
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="总目标" value={goals.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="进行中" value={activeGoals.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="已完成" value={completedGoals.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {riskGoals.length > 0 && (
        <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Text style={{ color: subColor }}>目标风险预警</Typography.Text>
          <Typography.Title level={4} style={{ margin: '4px 0 14px', color: titleColor }}>可能延期的目标</Typography.Title>
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            {riskGoals.map(item => (
              <div key={item.goal.id} style={{ padding: 12, borderRadius: 16, background: item.level === '高风险' || item.level === '已逾期' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${(item.level === '高风险' || item.level === '已逾期') ? '#ef444455' : '#f59e0b55'}` }}>
                <Space wrap size={8} style={{ width: '100%', justifyContent: 'space-between' }}>
                  <Typography.Text strong style={{ color: titleColor }}>{item.goal.title}</Typography.Text>
                  <Tag color={item.level === '高风险' || item.level === '已逾期' ? 'red' : 'gold'}>{item.level}</Tag>
                </Space>
                <Typography.Paragraph style={{ margin: '6px 0 0', color: subColor, fontSize: 12 }}>
                  当前 {item.progress}% / 期望 {item.expected}%，{item.daysLeft >= 0 ? `剩余 ${item.daysLeft} 天` : `已超期 ${Math.abs(item.daysLeft)} 天`}，建议今天至少推进 1 个里程碑。
                </Typography.Paragraph>
              </div>
            ))}
          </Space>
        </Card>
      )}

      {activeGoals.length > 0 && (
        <div className="anim-fade-in-up stagger-2">
          <Typography.Title level={4} style={{ color: titleColor, marginBottom: 16 }}>进行中</Typography.Title>
          <Row gutter={[16, 16]}>
            {activeGoals.map((goal, i) => (
              <Col xs={24} md={12} key={goal.id}>{renderGoalCard(goal, i)}</Col>
            ))}
          </Row>
        </div>
      )}

      {completedGoals.length > 0 && (
        <div className="anim-fade-in-up stagger-3" style={{ marginTop: 20 }}>
          <Typography.Title level={4} style={{ color: titleColor, marginBottom: 16 }}>已完成</Typography.Title>
          <Row gutter={[16, 16]}>
            {completedGoals.map((goal, i) => (
              <Col xs={24} md={12} key={goal.id}>{renderGoalCard(goal, i)}</Col>
            ))}
          </Row>
        </div>
      )}

      {goals.length === 0 && (
        <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Empty text="还没有目标" subtext="设定一个目标，比如「三个月内学会一门新技能」" />
        </Card>
      )}

      <Modal title={editing ? '编辑目标' : '新建目标'} open={open} onCancel={() => setOpen(false)} onOk={save} width={560} destroyOnClose>
        <Space direction="vertical" size={14} style={{ width: '100%', marginTop: 8 }}>
          <div>
            <div style={{ marginBottom: 6, fontSize: 14 }}>目标标题</div>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：三个月内读完 12 本书" />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontSize: 14 }}>描述</div>
            <Input.TextArea value={description} onChange={e => setDescription(e.target.value)} placeholder="补充说明..." rows={2} />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontSize: 14 }}>颜色</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'].map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 32, height: 32, borderRadius: 8, background: c,
                  border: color === c ? '2px solid #fff' : '2px solid transparent',
                  boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                  cursor: 'pointer', transition: 'all 0.2s ease'
                }} />
              ))}
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 6, fontSize: 14 }}>截止日期</div>
            <Input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14 }}>里程碑</span>
              <Button size="small" onClick={addMilestone}>+ 添加</Button>
            </div>
            <Space direction="vertical" size={6} style={{ width: '100%' }}>
              {milestones.map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Input value={m.title} onChange={e => updateMilestone(i, e.target.value)} placeholder={`里程碑 ${i + 1}`} style={{ flex: 1 }} />
                  <Button size="small" danger onClick={() => removeMilestone(i)}>删除</Button>
                </div>
              ))}
            </Space>
          </div>
        </Space>
      </Modal>
    </Space>
  );
}
