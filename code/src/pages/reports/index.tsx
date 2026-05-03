// 报告中心 - 周期报告与数据分析
import React, { useMemo, useState } from 'react';
import { Card, Col, Progress, Row, Space, Statistic, Tabs, Tag, Typography } from 'antd';
import { BarChartOutlined, FileTextOutlined, LineChartOutlined, PieChartOutlined, TrophyOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

export default function ReportsPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const now = dayjs();
  const start = period === 'week' ? now.startOf('week') : now.startOf('month');
  const prevStart = period === 'week' ? now.subtract(1, 'week').startOf('week') : now.subtract(1, 'month').startOf('month');
  const prevEnd = start.subtract(1, 'ms');

  const data = useLiveQuery(async () => {
    const startMs = start.valueOf();
    const prevStartMs = prevStart.valueOf();
    const prevEndMs = prevEnd.valueOf();

    const [doneNow, donePrev, sessionsNow, sessionsPrev, diariesNow, diariesPrev, habitLogs, goals] = await Promise.all([
      db.items.filter(i => !i.deletedAt && i.completeStatus === 'done' && (i.updatedAt || 0) >= startMs).count(),
      db.items.filter(i => !i.deletedAt && i.completeStatus === 'done' && (i.updatedAt || 0) >= prevStartMs && (i.updatedAt || 0) <= prevEndMs).count(),
      db.focusSessions.filter(s => (s.startTime || 0) >= startMs).count(),
      db.focusSessions.filter(s => (s.startTime || 0) >= prevStartMs && (s.startTime || 0) <= prevEndMs).count(),
      db.diaries.filter(d => !d.deletedAt && d.createdAt >= startMs).count(),
      db.diaries.filter(d => !d.deletedAt && d.createdAt >= prevStartMs && d.createdAt <= prevEndMs).count(),
      db.habitLogs.toArray(),
      db.goals.filter(g => !g.deletedAt).toArray()
    ]);

    const startDayMs = start.startOf('day').valueOf();
    const prevStartDayMs = prevStart.startOf('day').valueOf();
    const prevEndDayMs = prevEnd.endOf('day').valueOf();
    const habitNowSet = new Set(habitLogs.filter(l => l.date >= startDayMs).map(l => `${l.habitId}-${l.date}`));
    const habitPrevSet = new Set(habitLogs.filter(l => l.date >= prevStartDayMs && l.date <= prevEndDayMs).map(l => `${l.habitId}-${l.date}`));

    const activeGoals = goals.filter(g => g.status !== 'completed');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const avgProgress = activeGoals.length ? Math.round(activeGoals.reduce((s, g) => {
      const total = g.milestones?.length || 1;
      const done = g.milestones?.filter(m => m.done).length || 0;
      return s + Math.round(done / total * 100);
    }, 0) / activeGoals.length) : 0;

    return {
      doneNow, donePrev, sessionsNow, sessionsPrev, diariesNow, diariesPrev,
      habitsNow: habitNowSet.size, habitsPrev: habitPrevSet.size,
      activeGoals: activeGoals.length, completedGoals: completedGoals.length, avgProgress
    };
  });

  const pct = (cur: number, prev: number) => prev === 0 ? (cur > 0 ? 100 : 0) : Math.round((cur - prev) / prev * 100);
  const pctColor = (v: number) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#94a3b8';
  const pctTag = (cur: number, prev: number) => {
    const v = pct(cur, prev);
    return <Tag color={pctColor(v)} style={{ borderRadius: 999, fontSize: 11 }}>{v > 0 ? '+' : ''}{v}%</Tag>;
  };

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const metrics = useMemo(() => [
    { label: '完成事项', icon: <TrophyOutlined />, current: data?.doneNow || 0, prev: data?.donePrev || 0, color: '#22c55e' },
    { label: '专注次数', icon: <BarChartOutlined />, current: data?.sessionsNow || 0, prev: data?.sessionsPrev || 0, color: '#f59e0b' },
    { label: '习惯打卡', icon: <LineChartOutlined />, current: data?.habitsNow || 0, prev: data?.habitsPrev || 0, color: '#8b5cf6' },
    { label: '日记篇数', icon: <FileTextOutlined />, current: data?.diariesNow || 0, prev: data?.diariesPrev || 0, color: '#ec4899' }
  ], [data]);

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, ${accent}, ${accent}cc 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><BarChartOutlined /> 报告中心</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 8px', color: '#fff' }}>周期数据报告</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>
          {period === 'week' ? `本周 (${start.format('MM/DD')} - ${now.format('MM/DD')})` : `本月 (${start.format('YYYY年MM月')})`}
        </Typography.Text>
      </Card>

      <Tabs activeKey={period} onChange={k => setPeriod(k as 'week' | 'month')} items={[
        { key: 'week', label: '本周报告' },
        { key: 'month', label: '本月报告' }
      ]} style={{ marginBottom: -8 }} />

      <Row gutter={[16, 16]}>
        {metrics.map(m => (
          <Col xs={12} lg={6} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 18 }}>{m.icon}</div>
                <span style={{ color: subColor, fontSize: 13 }}>{m.label}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: m.color }}>{m.current}</span>
                {pctTag(m.current, m.prev)}
              </div>
              <div style={{ color: subColor, fontSize: 11, marginTop: 4 }}>上期 {m.prev}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><PieChartOutlined /> 目标概览</Typography.Title>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: subColor }}>进行中目标</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: accent }}>{data?.activeGoals || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: subColor }}>已完成目标</span>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>{data?.completedGoals || 0}</span>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: subColor }}>平均进度</span>
                  <span style={{ fontWeight: 600, color: titleColor }}>{data?.avgProgress || 0}%</span>
                </div>
                <Progress percent={data?.avgProgress || 0} strokeColor={accent} showInfo={false} />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><LineChartOutlined /> 趋势摘要</Typography.Title>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {metrics.map(m => {
                const v = pct(m.current, m.prev);
                const width = Math.min(100, Math.max(5, (m.current / Math.max(m.current, m.prev, 1)) * 100));
                return (
                  <div key={m.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: subColor, fontSize: 12 }}>{m.label}</span>
                      <span style={{ fontSize: 12, color: pctColor(v), fontWeight: 600 }}>{v > 0 ? '+' : ''}{v}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                      <div style={{ height: '100%', width: `${width}%`, borderRadius: 3, background: m.color, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
