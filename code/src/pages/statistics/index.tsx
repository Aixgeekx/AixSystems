// 数据统计中心 - 本地数据可视化分析
import React, { Suspense, lazy } from 'react';
import { Card, Col, Row, Space, Statistic, Tag, Typography } from 'antd';
import { BarChartOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, FireOutlined, TrophyOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

const ReactECharts = lazy(() => import('echarts-for-react'));

export default function StatisticsPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const stats = useLiveQuery(async () => {
    const [items, diaries, memos, sessions, habits, habitLogs, goals] = await Promise.all([
      db.items.toArray(),
      db.diaries.toArray(),
      db.memos.toArray(),
      db.focusSessions.toArray(),
      db.habits.toArray(),
      db.habitLogs.toArray(),
      db.goals.toArray()
    ]);

    const activeItems = items.filter(i => !i.deletedAt);
    const doneItems = activeItems.filter(i => i.completeStatus === 'done');
    const todayStart = dayjs().startOf('day').valueOf();
    const todayItems = activeItems.filter(i => i.startTime >= todayStart && i.startTime <= dayjs().endOf('day').valueOf());
    const totalFocusMin = Math.round(sessions.reduce((s, f) => s + f.actualMs / 60000, 0));
    const todayFocusMin = Math.round(sessions.filter(s => s.startTime >= todayStart).reduce((s, f) => s + f.actualMs / 60000, 0));
    const activeHabits = habits.filter(h => !h.deletedAt);
    const totalCheckins = habitLogs.length;
    const activeGoals = goals.filter(g => !g.deletedAt && g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    // 7天趋势
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = dayjs().subtract(i, 'day');
      const start = d.startOf('day').valueOf();
      const end = d.endOf('day').valueOf();
      return {
        date: d.format('MM-DD'),
        items: activeItems.filter(item => item.startTime >= start && item.startTime <= end).length,
        focus: Math.round(sessions.filter(s => s.startTime >= start && s.startTime <= end).reduce((sum, s) => sum + s.actualMs / 60000, 0)),
        checkins: habitLogs.filter(l => l.date >= start && l.date <= end).length
      };
    }).reverse();

    return {
      totalItems: activeItems.length,
      doneItems: doneItems.length,
      todayItems: todayItems.length,
      totalDiaries: diaries.filter(d => !d.deletedAt).length,
      totalMemos: memos.filter(m => !m.deletedAt).length,
      totalFocusMin,
      todayFocusMin,
      totalSessions: sessions.length,
      activeHabits: activeHabits.length,
      totalCheckins,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      completionRate: activeItems.length ? Math.round(doneItems.length / activeItems.length * 100) : 0,
      last7Days
    };
  });

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    xAxis: { type: 'category' as const, data: stats?.last7Days.map(d => d.date) || [], axisLabel: { color: subColor } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor } },
    series: [
      { name: '事项', type: 'bar', data: stats?.last7Days.map(d => d.items) || [], itemStyle: { color: '#38bdf8', borderRadius: [4, 4, 0, 0] } },
      { name: '专注(分)', type: 'line', data: stats?.last7Days.map(d => d.focus) || [], smooth: true, itemStyle: { color: '#f59e0b' } }
    ],
    grid: { left: 40, right: 20, top: 40, bottom: 30 }
  };

  const summaryCards = [
    { label: '总事项', value: stats?.totalItems || 0, icon: <CalendarOutlined />, color: '#38bdf8' },
    { label: '已完成', value: stats?.doneItems || 0, icon: <CheckCircleOutlined />, color: '#22c55e' },
    { label: '完成率', value: `${stats?.completionRate || 0}%`, icon: <TrophyOutlined />, color: '#f59e0b' },
    { label: '今日事项', value: stats?.todayItems || 0, icon: <CalendarOutlined />, color: '#8b5cf6' },
    { label: '总专注', value: `${stats?.totalFocusMin || 0}分`, icon: <FireOutlined />, color: '#ef4444' },
    { label: '今日专注', value: `${stats?.todayFocusMin || 0}分`, icon: <ClockCircleOutlined />, color: '#06b6d4' },
    { label: '日记', value: stats?.totalDiaries || 0, icon: <FileTextOutlined />, color: '#ec4899' },
    { label: '备忘录', value: stats?.totalMemos || 0, icon: <FileTextOutlined />, color: '#14b8a6' }
  ];

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : 'linear-gradient(135deg, #f59e0b, #d97706 52%, #0f172a)',
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(245,158,11,0.18)'
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><BarChartOutlined /> 数据统计中心</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 8px', color: '#fff' }}>本地数据可视化</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>基于 IndexedDB 的完全离线数据分析，无需联网。</Typography.Text>
      </Card>

      <Row gutter={[12, 12]}>
        {summaryCards.map(card => (
          <Col xs={12} md={6} key={card.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
              <Space>
                <span style={{ color: card.color, fontSize: 24 }}>{card.icon}</span>
                <div>
                  <Typography.Text style={{ color: subColor, fontSize: 12 }}>{card.label}</Typography.Text>
                  <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>{card.value}</Typography.Title>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>近 7 天趋势</Typography.Title>
            <Suspense fallback={<div style={{ height: 300, display: 'grid', placeItems: 'center', color: subColor }}>加载图表...</div>}>
              <ReactECharts option={trendOption} style={{ height: 300 }} />
            </Suspense>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>成长指标</Typography.Title>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {[
                { label: '活跃习惯', value: stats?.activeHabits || 0, color: '#22c55e' },
                { label: '总打卡', value: stats?.totalCheckins || 0, color: '#8b5cf6' },
                { label: '进行中目标', value: stats?.activeGoals || 0, color: '#3b82f6' },
                { label: '已完成目标', value: stats?.completedGoals || 0, color: '#f59e0b' }
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 14, background: isDark ? `${item.color}14` : `${item.color}0f`, border: `1px solid ${item.color}22` }}>
                  <Typography.Text style={{ color: titleColor }}>{item.label}</Typography.Text>
                  <Tag color={item.color} style={{ borderRadius: 999 }}>{item.value}</Tag>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
