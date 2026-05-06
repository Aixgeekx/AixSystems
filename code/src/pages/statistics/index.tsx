// 数据统计中心 - 本地数据可视化分析
import React, { Suspense, lazy, useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { BarChartOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined, FireOutlined, TrophyOutlined, CrownOutlined, LineChartOutlined, AimOutlined, HeartOutlined, DashboardOutlined, GoldOutlined, ThunderboltOutlined, RiseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';
import Empty from '@/components/Empty';

const ReactECharts = lazy(() => import('echarts-for-react'));

export default function StatisticsPage() {
  const nav = useNavigate();
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
    const now = dayjs();
    const todayStart = now.startOf('day').valueOf();
    const todayItems = activeItems.filter(i => i.startTime >= todayStart && i.startTime <= now.endOf('day').valueOf());
    const totalFocusMin = Math.round(sessions.reduce((s, f) => s + f.actualMs / 60000, 0));
    const todayFocusMin = Math.round(sessions.filter(s => s.startTime >= todayStart).reduce((s, f) => s + f.actualMs / 60000, 0));
    const activeHabits = habits.filter(h => !h.deletedAt);
    const totalCheckins = habitLogs.length;
    const activeGoals = goals.filter(g => !g.deletedAt && g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');

    // 30天活跃趋势
    const daily30Map: Record<string, number> = {};
    const add = (t: number) => { const k = dayjs(t).format('MM/DD'); daily30Map[k] = (daily30Map[k] || 0) + 1; };
    activeItems.forEach(i => add(i.createdAt));
    sessions.forEach(s => add(s.startTime));
    habitLogs.forEach(l => add(l.date));
    diaries.filter(d => !d.deletedAt).forEach(d => add(d.date));
    goals.filter(g => !g.deletedAt).forEach(g => add(g.createdAt));
    memos.filter(m => !m.deletedAt).forEach(m => add(m.createdAt));
    const daily30Keys = Object.keys(daily30Map).sort().slice(-30);
    const daily30 = { dates: daily30Keys, values: daily30Keys.map(k => daily30Map[k]) };

    // 模块占比
    const modulePie = [
      { name: '事项', value: activeItems.length, itemStyle: { color: '#3b82f6' } },
      { name: '专注', value: sessions.length, itemStyle: { color: '#f59e0b' } },
      { name: '习惯', value: habitLogs.length, itemStyle: { color: '#22c55e' } },
      { name: '日记', value: diaries.filter(d => !d.deletedAt).length, itemStyle: { color: '#ec4899' } },
      { name: '目标', value: goals.filter(g => !g.deletedAt).length, itemStyle: { color: '#8b5cf6' } },
      { name: '备忘', value: memos.filter(m => !m.deletedAt).length, itemStyle: { color: '#14b8a6' } }
    ].filter(m => m.value > 0);

    // 7天趋势
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = now.subtract(i, 'day');
      const start = d.startOf('day').valueOf();
      const end = d.endOf('day').valueOf();
      return {
        date: d.format('MM-DD'),
        items: activeItems.filter(item => item.startTime >= start && item.startTime <= end).length,
        focus: Math.round(sessions.filter(s => s.startTime >= start && s.startTime <= end).reduce((sum, s) => sum + s.actualMs / 60000, 0)),
        checkins: habitLogs.filter(l => l.date >= start && l.date <= end).length
      };
    }).reverse();

    // 周同比
    const weekStart = now.startOf('week').valueOf();
    const lastWeekStart = now.subtract(1, 'week').startOf('week').valueOf();
    const lastWeekEnd = now.subtract(1, 'week').endOf('week').valueOf();
    const thisWeekItems = activeItems.filter(i => i.createdAt >= weekStart).length;
    const lastWeekItems = activeItems.filter(i => i.createdAt >= lastWeekStart && i.createdAt <= lastWeekEnd).length;
    const weekGrowth = lastWeekItems > 0 ? Math.round((thisWeekItems - lastWeekItems) / lastWeekItems * 100) : thisWeekItems > 0 ? 100 : 0;

    // 近4周周分布
    const weeklyDist = Array.from({ length: 4 }, (_, i) => {
      const d = now.subtract(3 - i, 'week');
      const ws = d.startOf('week').valueOf();
      const we = d.endOf('week').valueOf();
      return {
        label: `第${4 - i}周`,
        items: activeItems.filter(it => it.createdAt >= ws && it.createdAt <= we).length,
        focus: Math.round(sessions.filter(s => s.startTime >= ws && s.startTime <= we).reduce((sum, s) => sum + s.actualMs / 60000, 0)),
        checkins: habitLogs.filter(l => l.date >= ws && l.date <= we).length
      };
    });

    // 24小时活跃分布
    const hourlyDist: number[] = Array(24).fill(0);
    sessions.forEach(s => { const h = dayjs(s.startTime).hour(); hourlyDist[h]++; });
    habitLogs.forEach(l => { const h = dayjs(l.date).hour(); hourlyDist[h]++; });

    // 模块增长率（本月 vs 上月）
    const monthStart = now.startOf('month').valueOf();
    const lastMonthStart = now.subtract(1, 'month').startOf('month').valueOf();
    const lastMonthEnd = now.subtract(1, 'month').endOf('month').valueOf();
    const moduleGrowth = [
      { name: '事项', thisMonth: activeItems.filter(i => i.createdAt >= monthStart).length, lastMonth: activeItems.filter(i => i.createdAt >= lastMonthStart && i.createdAt <= lastMonthEnd).length },
      { name: '专注', thisMonth: sessions.filter(s => s.startTime >= monthStart).length, lastMonth: sessions.filter(s => s.startTime >= lastMonthStart && s.startTime <= lastMonthEnd).length },
      { name: '习惯', thisMonth: habitLogs.filter(l => l.date >= monthStart).length, lastMonth: habitLogs.filter(l => l.date >= lastMonthStart && l.date <= lastMonthEnd).length },
      { name: '日记', thisMonth: diaries.filter(d => !d.deletedAt && d.createdAt >= monthStart).length, lastMonth: diaries.filter(d => !d.deletedAt && d.createdAt >= lastMonthStart && d.createdAt <= lastMonthEnd).length }
    ];

    // 完成率趋势（近30天）
    const completionTrend: { date: string; rate: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = now.subtract(i, 'day');
      const ds = d.startOf('day').valueOf();
      const de = d.endOf('day').valueOf();
      const dayItems = activeItems.filter(it => it.startTime >= ds && it.startTime <= de);
      const rate = dayItems.length > 0 ? Math.round(dayItems.filter(it => it.completeStatus === 'done').length / dayItems.length * 100) : 0;
      completionTrend.push({ date: d.format('MM/DD'), rate });
    }

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
      last7Days,
      daily30,
      modulePie,
      weekGrowth,
      weeklyDist,
      hourlyDist,
      moduleGrowth,
      completionTrend
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

  const daily30Option = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: stats?.daily30?.dates || [], axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: stats?.daily30?.values || [], smooth: true, areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent }, showSymbol: false }]
  };

  const moduleOption = {
    tooltip: { trigger: 'item' as const },
    series: [{ type: 'pie' as const, radius: ['40%', '70%'], data: stats?.modulePie || [], label: { color: subColor, fontSize: 12 } }]
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

  const weeklyDistOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['事项', '专注(分)', '打卡'], textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 12, bottom: 24, left: 36 },
    xAxis: { type: 'category' as const, data: stats?.weeklyDist.map(d => d.label) || [], axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: [
      { type: 'value' as const, name: '事项/打卡', axisLabel: { color: subColor, fontSize: 10 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
      { type: 'value' as const, name: '分钟', axisLabel: { color: subColor, fontSize: 10 }, splitLine: { show: false } }
    ],
    series: [
      { name: '事项', type: 'bar' as const, data: stats?.weeklyDist.map(d => d.items) || [], itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' },
      { name: '专注(分)', type: 'bar' as const, data: stats?.weeklyDist.map(d => d.focus) || [], itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' },
      { name: '打卡', type: 'line' as const, yAxisIndex: 0, data: stats?.weeklyDist.map(d => d.checkins) || [], smooth: true, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' }, showSymbol: false }
    ]
  };

  const hourlyDistOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 16, right: 12, bottom: 24, left: 36 },
    xAxis: { type: 'category' as const, data: Array.from({ length: 24 }, (_, i) => `${i}时`), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 10 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats?.hourlyDist || [], itemStyle: { color: accent, borderRadius: [3, 3, 0, 0] }, barWidth: '70%' }]
  };

  const moduleGrowthOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['本月', '上月'], textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 12, bottom: 24, left: 36 },
    xAxis: { type: 'category' as const, data: stats?.moduleGrowth.map(d => d.name) || [], axisLabel: { color: subColor, fontSize: 12 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [
      { name: '本月', type: 'bar' as const, data: stats?.moduleGrowth.map(d => d.thisMonth) || [], itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' },
      { name: '上月', type: 'bar' as const, data: stats?.moduleGrowth.map(d => d.lastMonth) || [], itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' }
    ]
  };

  const completionTrendOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 16, right: 12, bottom: 24, left: 36 },
    xAxis: { type: 'category' as const, data: stats?.completionTrend.map(d => d.date) || [], axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, minInterval: 1, max: 100, axisLabel: { color: subColor, fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: stats?.completionTrend.map(d => d.rate) || [], smooth: true, areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent }, showSymbol: false }]
  };

  // Peak hour
  const peakHour = stats?.hourlyDist ? stats.hourlyDist.indexOf(Math.max(...stats.hourlyDist)) : null;
  const peakValue = peakHour !== null ? stats?.hourlyDist[peakHour] : 0;

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

      {(!stats || (stats.totalItems === 0 && stats.totalSessions === 0 && stats.totalDiaries === 0 && stats.totalMemos === 0 && stats.activeHabits === 0 && stats.activeGoals === 0 && stats.completedGoals === 0)) && (
        <Empty text="暂无统计数据" subtext="开始记录后会自动展示" />
      )}

      {(stats && (stats.totalItems || stats.totalSessions || stats.totalDiaries || stats.totalMemos || stats.activeHabits || stats.activeGoals || stats.completedGoals)) && (
        <>
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

      {/* 周同比 + 峰值小时 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>
              <ThunderboltOutlined /> 周同比指标
            </Typography.Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Progress type="dashboard" percent={Math.min(100, Math.abs(stats?.weekGrowth || 0))} strokeColor={(stats?.weekGrowth || 0) >= 0 ? '#22c55e' : '#ef4444'} size={90} format={() => ''} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: (stats?.weekGrowth || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                  {(stats?.weekGrowth || 0) > 0 ? '+' : ''}{stats?.weekGrowth || 0}%
                </div>
                <div style={{ color: subColor, fontSize: 12 }}>事项周环比</div>
                <Tag color={(stats?.weekGrowth || 0) >= 0 ? 'green' : 'red'} style={{ marginTop: 4, borderRadius: 6 }}>
                  {(stats?.weekGrowth || 0) >= 0 ? <RiseOutlined /> : <BarChartOutlined />} {(stats?.weekGrowth || 0) >= 0 ? '增长' : '下降'}
                </Tag>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>
              <FireOutlined /> 活动峰值小时
            </Typography.Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: accent }}>{peakHour !== null ? peakHour : '--'}</div>
              <div>
                <div style={{ color: subColor, fontSize: 12 }}>活跃峰值时段</div>
                <div style={{ color: titleColor, fontSize: 18, fontWeight: 700 }}>{peakHour !== null ? `${peakHour}:00 - ${peakHour + 1}:00` : '无数据'}</div>
                <div style={{ color: subColor, fontSize: 12 }}>共 {peakValue} 条记录</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>
              <CheckCircleOutlined /> 综合完成率
            </Typography.Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Progress type="circle" percent={stats?.completionRate || 0} strokeColor={stats?.completionRate >= 70 ? '#22c55e' : stats?.completionRate >= 40 ? '#f59e0b' : '#ef4444'} size={90} />
              <div>
                <div style={{ color: subColor, fontSize: 12 }}>所有事项完成率</div>
                <div style={{ color: titleColor, fontSize: 18, fontWeight: 700 }}>{stats?.doneItems || 0} / {stats?.totalItems || 0}</div>
                <div style={{ color: subColor, fontSize: 12 }}>已完成 / 总数</div>
              </div>
            </div>
          </Card>
        </Col>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>近 30 天活跃趋势</Typography.Title>
            <Suspense fallback={<div style={{ height: 260, display: 'grid', placeItems: 'center', color: subColor }}>加载图表...</div>}>
              <ReactECharts option={daily30Option} style={{ height: 260 }} />
            </Suspense>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>近 30 天完成率趋势</Typography.Title>
            <Suspense fallback={<div style={{ height: 260, display: 'grid', placeItems: 'center', color: subColor }}>加载图表...</div>}>
              <ReactECharts option={completionTrendOption} style={{ height: 260 }} />
            </Suspense>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>近 4 周分布</Typography.Title>
            <Suspense fallback={<div style={{ height: 240, display: 'grid', placeItems: 'center', color: subColor }}>加载图表...</div>}>
              <ReactECharts option={weeklyDistOption} style={{ height: 240 }} />
            </Suspense>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>24 小时活跃分布</Typography.Title>
            <Suspense fallback={<div style={{ height: 240, display: 'grid', placeItems: 'center', color: subColor }}>加载图表...</div>}>
              <ReactECharts option={hourlyDistOption} style={{ height: 240 }} />
            </Suspense>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>模块月增长率（本月 vs 上月）</Typography.Title>
        <Suspense fallback={<div style={{ height: 240, display: 'grid', placeItems: 'center', color: subColor }}>加载图表...</div>}>
          <ReactECharts option={moduleGrowthOption} style={{ height: 240 }} />
        </Suspense>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>模块占比</Typography.Title>
            <Suspense fallback={<div style={{ height: 260, display: 'grid', placeItems: 'center', color: subColor }}>加载图表...</div>}>
              <ReactECharts option={moduleOption} style={{ height: 260 }} />
            </Suspense>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>本周数据明细</Typography.Title>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {stats?.weeklyDist.map(w => (
                <div key={w.label} style={{ padding: '10px 14px', borderRadius: 14, background: isDark ? `${accent}10` : `${accent}08`, border: `1px solid ${accent}20` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Typography.Text strong style={{ color: titleColor }}>{w.label}</Typography.Text>
                    <Tag color={accent} style={{ borderRadius: 6 }}>{w.items} 项</Tag>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: subColor, fontSize: 12 }}><FireOutlined style={{ color: '#f59e0b' }} /> {w.focus} 分钟</span>
                    <span style={{ color: subColor, fontSize: 12 }}><CheckCircleOutlined style={{ color: '#22c55e' }} /> {w.checkins} 打卡</span>
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注排行榜', icon: <CrownOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_RANKING },
            { label: '习惯统计', icon: <LineChartOutlined />, color: '#22c55e', path: ROUTES.HABIT_STATS },
            { label: '目标时间线', icon: <AimOutlined />, color: '#3b82f6', path: ROUTES.GOAL_TIMELINE },
            { label: '情绪趋势', icon: <HeartOutlined />, color: '#ec4899', path: ROUTES.DIARY_MOOD_TRENDS },
            { label: '数据总览', icon: <DashboardOutlined />, color: '#3b82f6', path: ROUTES.DATA_OVERVIEW },
            { label: '成长月报', icon: <GoldOutlined />, color: '#8b5cf6', path: ROUTES.GROWTH_MONTHLY },
          ].map(item => (
            <Col xs={12} sm={4} key={item.label}>
              <div onClick={() => nav(item.path)} style={{
                borderRadius: 16, padding: 16, textAlign: 'center', cursor: 'pointer',
                background: isDark ? `${item.color}14` : `${item.color}0f`,
                border: `1px solid ${item.color}22`, transition: 'all 0.2s'
              }}>
                <div style={{ fontSize: 24, color: item.color, marginBottom: 6 }}>{item.icon}</div>
                <Typography.Text style={{ color: titleColor, fontWeight: 600, fontSize: 13 }}>{item.label}</Typography.Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
      </>
      )}
    </Space>
  );
}
