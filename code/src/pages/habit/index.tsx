// 习惯追踪 - 每日打卡 + 连续天数 + 统计 (v0.21.0 成长系统)
import React, { useState } from 'react';
import { Button, Card, Col, Input, Modal, Progress, Row, Space, Statistic, Tag, Typography, message } from 'antd';
import {
  CheckCircleOutlined,
  PlusOutlined,
  FireOutlined,
  TrophyOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import { db } from '@/db';
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';
import type { Habit, HabitLog } from '@/models';

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六'];

function getStreak(habitId: string, logs: HabitLog[]) {
  const sorted = logs
    .filter(l => l.habitId === habitId)
    .sort((a, b) => b.date - a.date);
  if (!sorted.length) return 0;
  let streak = 0;
  let checkDate = dayjs().startOf('day');
  for (const log of sorted) {
    const logDate = dayjs(log.date).startOf('day');
    if (logDate.isSame(checkDate, 'day')) {
      streak++;
      checkDate = checkDate.subtract(1, 'day');
    } else if (logDate.isSame(checkDate.subtract(1, 'day'), 'day')) {
      streak++;
      checkDate = logDate;
    } else {
      break;
    }
  }
  return streak;
}

function getMonthData(habitId: string, logs: HabitLog[], year: number, month: number) {
  const daysInMonth = dayjs(`${year}-${month + 1}`).daysInMonth();
  const monthLogs = logs.filter(l => {
    const d = dayjs(l.date);
    return l.habitId === habitId && d.year() === year && d.month() === month;
  });
  const data: Record<number, number> = {};
  for (let d = 1; d <= daysInMonth; d++) {
    data[d] = 0;
  }
  for (const log of monthLogs) {
    const day = dayjs(log.date).date();
    data[day] = (data[day] || 0) + log.count;
  }
  return data;
}

export default function HabitPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#2563eb');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [targetCount, setTargetCount] = useState(1);

  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const habits = useLiveQuery(() => db.habits.filter(h => !h.deletedAt).sortBy('sortOrder'), []) || [];
  const logs = useLiveQuery(() => db.habitLogs.toArray(), []) || [];

  const today = dayjs().startOf('day').valueOf();
  const todayLogs = logs.filter(l => dayjs(l.date).isSame(dayjs(), 'day'));

  async function save() {
    if (!name.trim()) return message.warning('习惯名称不能为空');
    const now = Date.now();
    if (editing) {
      await db.habits.update(editing.id, {
        name, color, frequency, targetCount, updatedAt: now
      });
    } else {
      await db.habits.add({
        id: nanoid(),
        name, color, frequency, targetCount,
        sortOrder: habits.length,
        createdAt: now,
        updatedAt: now
      });
    }
    setOpen(false);
    message.success('保存成功');
  }

  async function checkIn(habit: Habit) {
    const now = Date.now();
    const todayStart = dayjs().startOf('day').valueOf();
    const todayEnd = dayjs().endOf('day').valueOf();
    const existing = logs.filter(l =>
      l.habitId === habit.id && l.date >= todayStart && l.date <= todayEnd
    );
    const totalToday = existing.reduce((s, l) => s + l.count, 0);
    if (totalToday >= habit.targetCount) {
      message.info('今日已完成目标');
      return;
    }
    await db.habitLogs.add({
      id: nanoid(),
      habitId: habit.id,
      date: now,
      count: 1,
      createdAt: now
    });
    message.success('打卡成功');
  }

  async function del(habit: Habit) {
    await db.habits.update(habit.id, { deletedAt: Date.now() });
    message.success('已删除');
  }

  function openNew() {
    setEditing(null);
    setName('');
    setColor('#2563eb');
    setFrequency('daily');
    setTargetCount(1);
    setOpen(true);
  }

  function openEdit(habit: Habit) {
    setEditing(habit);
    setName(habit.name);
    setColor(habit.color);
    setFrequency(habit.frequency);
    setTargetCount(habit.targetCount);
    setOpen(true);
  }

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const totalChecks = logs.length;
  const totalHabits = habits.length;
  const activeToday = habits.filter(h => {
    const todayCount = todayLogs.filter(l => l.habitId === h.id).reduce((s, l) => s + l.count, 0);
    return todayCount >= h.targetCount;
  }).length;

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
            : 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(245,158,11,0.92) 44%, rgba(236,72,153,0.9) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(245,158,11,0.16)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(254,243,199,0.9)' }}>
              习惯追踪工作台
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
              用连续打卡的力量，把好习惯焊进日常
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(226,232,240,0.84)' }}>
              每天完成一个小习惯，积累起来就是巨大的成长。支持连续天数统计、月度热力图和多习惯并行追踪。
            </Typography.Paragraph>
            <Space wrap size={10}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openNew} style={{ borderRadius: 10, boxShadow: `0 8px 20px -4px ${accent}44` }}>
                新建习惯
              </Button>
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="习惯数" value={totalHabits} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="今日完成" value={activeToday} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="总打卡" value={totalChecks} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {habits.length === 0 ? (
        <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Empty text="还没有习惯" subtext="添加第一个习惯，比如「早起」「阅读30分钟」「运动」" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {habits.map((habit, index) => {
            const streak = getStreak(habit.id, logs);
            const todayCount = todayLogs.filter(l => l.habitId === habit.id).reduce((s, l) => s + l.count, 0);
            const isDone = todayCount >= habit.targetCount;
            const monthData = getMonthData(habit.id, logs, dayjs().year(), dayjs().month());

            return (
              <Col xs={24} md={12} xl={8} key={habit.id}>
                <Card
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
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        display: 'grid',
                        placeItems: 'center',
                        background: `${habit.color}22`,
                        color: habit.color,
                        fontSize: 20,
                        border: `1px solid ${habit.color}44`
                      }}>
                        <FireOutlined />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: titleColor, fontSize: 16 }}>{habit.name}</div>
                        <div style={{ color: subColor, fontSize: 12, marginTop: 2 }}>
                          {habit.frequency === 'daily' ? '每日' : habit.frequency === 'weekly' ? '每周' : '每月'}
                          · 目标 {habit.targetCount} 次
                        </div>
                      </div>
                    </div>
                    <Space>
                      <EditOutlined className="hover-scale" style={{ color: subColor, cursor: 'pointer' }} onClick={() => openEdit(habit)} />
                      <DeleteOutlined className="hover-scale" style={{ color: subColor, cursor: 'pointer' }} onClick={() => del(habit)} />
                    </Space>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: habit.color }}>{streak}</div>
                      <div style={{ fontSize: 12, color: subColor }}>连续天数</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: subColor, fontSize: 12 }}>今日进度</span>
                        <span style={{ color: isDone ? '#22c55e' : habit.color, fontWeight: 600, fontSize: 12 }}>
                          {todayCount} / {habit.targetCount}
                        </span>
                      </div>
                      <Progress
                        percent={Math.round((todayCount / habit.targetCount) * 100)}
                        strokeColor={isDone ? '#22c55e' : habit.color}
                        trailColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}
                        showInfo={false}
                        strokeLinecap="round"
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 14 }}>
                    {WEEK_DAYS.map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: 10, color: subColor }}>{d}</div>
                    ))}
                    {Array.from({ length: dayjs().startOf('month').day() }).map((_, i) => (
                      <div key={`pad-${i}`} />
                    ))}
                    {Array.from({ length: dayjs().daysInMonth() }).map((_, i) => {
                      const day = i + 1;
                      const count = monthData[day] || 0;
                      const intensity = Math.min(count / habit.targetCount, 1);
                      return (
                        <div
                          key={day}
                          style={{
                            aspectRatio: '1',
                            borderRadius: 4,
                            background: count > 0 ? `${habit.color}${Math.round(intensity * 255).toString(16).padStart(2, '0')}` : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)',
                            transition: 'all 0.2s ease'
                          }}
                          title={`${dayjs().format('YYYY-MM')}-${day.toString().padStart(2, '0')}: ${count}次`}
                        />
                      );
                    })}
                  </div>

                  <Button
                    type={isDone ? 'default' : 'primary'}
                    block
                    icon={<CheckCircleOutlined />}
                    onClick={() => checkIn(habit)}
                    disabled={isDone}
                    style={{
                      borderRadius: 10,
                      background: isDone ? 'rgba(34,197,94,0.15)' : undefined,
                      borderColor: isDone ? '#22c55e' : undefined,
                      color: isDone ? '#22c55e' : undefined
                    }}
                  >
                    {isDone ? '今日已完成' : '打卡'}
                  </Button>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      <Modal title={editing ? '编辑习惯' : '新建习惯'} open={open} onCancel={() => setOpen(false)} onOk={save} width={520} destroyOnClose>
        <Space direction="vertical" size={14} style={{ width: '100%', marginTop: 8 }}>
          <div>
            <div style={{ marginBottom: 6, fontSize: 14 }}>习惯名称</div>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="例如：早起、阅读、运动" />
          </div>
          <div>
            <div style={{ marginBottom: 6, fontSize: 14 }}>颜色</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'].map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: c,
                    border: color === c ? '2px solid #fff' : '2px solid transparent',
                    boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 6, fontSize: 14 }}>频率</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {([{ label: '每日', value: 'daily' }, { label: '每周', value: 'weekly' }, { label: '每月', value: 'monthly' }] as const).map(f => (
                <button
                  key={f.value}
                  onClick={() => setFrequency(f.value)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 8,
                    border: frequency === f.value ? `1px solid ${color}` : '1px solid #e2e8f0',
                    background: frequency === f.value ? `${color}15` : 'transparent',
                    color: frequency === f.value ? color : '#64748b',
                    cursor: 'pointer',
                    fontWeight: frequency === f.value ? 600 : 400,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 6, fontSize: 14 }}>每日目标次数</div>
            <Input type="number" min={1} max={99} value={targetCount} onChange={e => setTargetCount(Number(e.target.value) || 1)} />
          </div>
        </Space>
      </Modal>
    </Space>
  );
}
