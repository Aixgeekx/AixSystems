// 目标时间线 - 目标与里程碑可视化时间轴
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Tag, Timeline, Typography } from 'antd';
import { AimOutlined, CheckCircleOutlined, ClockCircleOutlined, FlagOutlined, TrophyOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: '进行中', color: '#3b82f6' },
  completed: { label: '已完成', color: '#22c55e' },
  archived: { label: '已归档', color: '#6b7280' }
};

export default function GoalTimelinePage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const goals = useLiveQuery(() => db.goals.filter(g => !g.deletedAt).toArray(), []);

  const sorted = useMemo(() => (goals || []).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)), [goals]);

  const active = sorted.filter(g => g.status === 'active');
  const completed = sorted.filter(g => g.status === 'completed');

  const totalMilestones = sorted.reduce((s, g) => s + (g.milestones?.length || 0), 0);
  const doneMilestones = sorted.reduce((s, g) => s + (g.milestones?.filter(m => m.done).length || 0), 0);
  const overallProgress = totalMilestones > 0 ? Math.round(doneMilestones / totalMilestones * 100) : 0;

  // 即将到期目标
  const upcoming = useMemo(() => {
    const now = dayjs();
    return active.filter(g => g.targetDate).filter(g => {
      const days = dayjs(g.targetDate).diff(now, 'day');
      return days >= 0 && days <= 30;
    }).sort((a, b) => (a.targetDate || 0) - (b.targetDate || 0));
  }, [active]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #3b82f6, #2563eb 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><AimOutlined /> 目标时间线</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>目标与里程碑</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>{active.length} 个进行中 · {completed.length} 个已完成</Typography.Text>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '进行中', value: active.length, icon: <AimOutlined />, color: '#3b82f6' },
          { label: '已完成', value: completed.length, icon: <TrophyOutlined />, color: '#22c55e' },
          { label: '里程碑进度', value: `${doneMilestones}/${totalMilestones}`, icon: <FlagOutlined />, color: '#f59e0b' },
          { label: '整体进度', value: `${overallProgress}%`, icon: <CheckCircleOutlined />, color: '#ec4899' }
        ].map(m => (
          <Col xs={12} lg={6} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 17 }}>{m.icon}</div>
                <span style={{ color: subColor, fontSize: 13 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 即将到期 */}
      {upcoming.length > 0 && (
        <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>
            <ClockCircleOutlined /> 即将到期目标
          </Typography.Title>
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            {upcoming.map(g => {
              const daysLeft = dayjs(g.targetDate).diff(dayjs(), 'day');
              const progress = g.milestones?.length ? Math.round(g.milestones.filter(m => m.done).length / g.milestones.length * 100) : 0;
              return (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                  <div>
                    <Typography.Text style={{ fontWeight: 600, color: titleColor }}>{g.title}</Typography.Text>
                    <div style={{ color: subColor, fontSize: 11, marginTop: 2 }}>截止 {dayjs(g.targetDate).format('MM/DD')} · 剩余 {daysLeft} 天</div>
                  </div>
                  <Progress percent={progress} size="small" style={{ width: 100 }} strokeColor={g.color} />
                </div>
              );
            })}
          </Space>
        </Card>
      )}

      {/* 目标时间轴 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>
          <FlagOutlined /> 目标时间轴
        </Typography.Title>
        {sorted.length > 0 ? (
          <Timeline mode="left" items={sorted.map(g => {
            const meta = STATUS_META[g.status] || STATUS_META.active;
            const progress = g.milestones?.length ? Math.round(g.milestones.filter(m => m.done).length / g.milestones.length * 100) : 0;
            const ms = g.milestones || [];
            return {
              dot: <div style={{ width: 14, height: 14, borderRadius: '50%', background: g.color || meta.color, border: `3px solid ${g.color || meta.color}44` }} />,
              children: (
                <div style={{ padding: '4px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Typography.Text style={{ fontWeight: 700, color: titleColor, fontSize: 15 }}>{g.title}</Typography.Text>
                    <Tag style={{ borderRadius: 999, fontSize: 11, background: `${meta.color}18`, border: `1px solid ${meta.color}44`, color: meta.color }}>{meta.label}</Tag>
                  </div>
                  {g.description && <div style={{ color: subColor, fontSize: 12, marginBottom: 6 }}>{g.description}</div>}
                  <Progress percent={progress} strokeColor={g.color || accent} size="small" />
                  {ms.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {ms.map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <CheckCircleOutlined style={{ color: m.done ? '#22c55e' : '#d1d5db', fontSize: 14 }} />
                          <span style={{ color: m.done ? subColor : titleColor, fontSize: 12, textDecoration: m.done ? 'line-through' : 'none' }}>{m.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {g.targetDate && <div style={{ color: subColor, fontSize: 11, marginTop: 6 }}>截止日期：{dayjs(g.targetDate).format('YYYY-MM-DD')}</div>}
                </div>
              ),
              label: <span style={{ color: subColor, fontSize: 11 }}>{dayjs(g.updatedAt || g.createdAt).format('MM/DD')}</span>
            };
          })} />
        ) : (
          <div style={{ textAlign: 'center', color: subColor, padding: 40 }}>暂无目标，去目标管理创建一个吧</div>
        )}
      </Card>
    </Space>
  );
}
