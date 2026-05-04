// 年度回顾 - 全年多维数据聚合与趋势对比
import React, { useMemo, useState } from 'react';
import { Card, Col, Row, Space, Statistic, Typography } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, FireOutlined, TrophyOutlined, BookOutlined, AimOutlined, CrownOutlined, RiseOutlined, BarChartOutlined, DashboardOutlined, GoldOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

export default function AnnualReviewPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [year, setYear] = useState(dayjs().year());

  const items = useLiveQuery(() => db.items.filter(i => !i.deletedAt).toArray(), []);
  const sessions = useLiveQuery(() => db.focusSessions.toArray(), []);
  const habits = useLiveQuery(() => db.habits.filter(h => !h.deletedAt).toArray(), []);
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), []);
  const diaries = useLiveQuery(() => db.diaries.filter(d => !d.deletedAt).toArray(), []);
  const goals = useLiveQuery(() => db.goals.filter(g => !g.deletedAt).toArray(), []);

  const stats = useMemo(() => {
    const ys = dayjs().year(year).startOf('year').valueOf();
    const ye = dayjs().year(year).endOf('year').valueOf();
    const allItems = (items || []).filter(i => i.createdAt >= ys && i.createdAt <= ye);
    const allSessions = (sessions || []).filter(s => s.startTime >= ys && s.startTime <= ye);
    const allDiaries = (diaries || []).filter(d => d.date >= ys && d.date <= ye);
    const allLogs = (habitLogs || []).filter(l => l.date >= ys && l.date <= ye);
    const allGoals = (goals || []).filter(g => g.createdAt >= ys && g.createdAt <= ye);

    const doneItems = allItems.filter(i => i.completeStatus === 'done').length;
    const overdueItems = allItems.filter(i => i.endTime && dayjs(i.endTime).isBefore(dayjs(), 'day') && i.completeStatus !== 'done').length;
    const totalFocusMin = Math.round(allSessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const focusDays = new Set(allSessions.map(s => dayjs(s.startTime).format('YYYYMMDD'))).size;
    const habitDays = new Set(allLogs.map(l => dayjs(l.date).format('YYYYMMDD'))).size;
    const activeGoals = allGoals.filter(g => g.status === 'active').length;
    const completedGoals = allGoals.filter(g => g.status === 'completed').length;
    const totalMilestones = allGoals.reduce((s, g) => s + (g.milestones?.length || 0), 0);
    const doneMilestones = allGoals.reduce((s, g) => s + (g.milestones?.filter(m => m.done).length || 0), 0);

    const monthly = Array.from({ length: 12 }).map((_, m) => {
      const ms = dayjs().year(year).month(m).startOf('month').valueOf();
      const me = dayjs().year(year).month(m).endOf('month').valueOf();
      const mi = allItems.filter(i => i.startTime >= ms && i.startTime <= me);
      const md = mi.filter(i => i.completeStatus === 'done').length;
      const mf = allSessions.filter(s => s.startTime >= ms && s.startTime <= me);
      const mfm = Math.round(mf.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      const mh = allLogs.filter(l => l.date >= ms && l.date <= me).length;
      const mdi = allDiaries.filter(d => d.date >= ms && d.date <= me).length;
      return { month: `${m + 1}月`, items: mi.length, done: md, focus: mfm, habits: mh, diaries: mdi };
    });

    const totalHabits = (habits || []).length;
    const habitRate = totalHabits > 0 ? Math.round(habitDays / (totalHabits * 365) * 100) : 0;
    const moodMap: Record<string, number> = {};
    allDiaries.forEach(d => { if (d.mood) moodMap[d.mood] = (moodMap[d.mood] || 0) + 1; });
    const topMood = Object.entries(moodMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return { totalItems: allItems.length, doneItems, overdueItems, totalFocusMin, focusDays, habitDays, totalDiaries: allDiaries.length, activeGoals, completedGoals, totalMilestones, doneMilestones, monthly, habitRate, topMood, totalSessions: allSessions.length };
  }, [items, sessions, habits, habitLogs, diaries, goals, year]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['事项', '专注(分)', '习惯打卡', '日记'], textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 12, bottom: 24, left: 40 },
    xAxis: { type: 'category' as const, data: stats.monthly.map(m => m.month), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [
      { name: '事项', type: 'bar' as const, data: stats.monthly.map(m => m.items), itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: '18%' },
      { name: '专注(分)', type: 'bar' as const, data: stats.monthly.map(m => m.focus), itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }, barWidth: '18%' },
      { name: '习惯打卡', type: 'line' as const, data: stats.monthly.map(m => m.habits), smooth: true, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' } },
      { name: '日记', type: 'line' as const, data: stats.monthly.map(m => m.diaries), smooth: true, lineStyle: { color: '#ec4899', width: 2 }, itemStyle: { color: '#ec4899' } }
    ]
  };

  const completionOption = {
    tooltip: { trigger: 'axis' as const, formatter: (p: any) => `${p[0].name}<br/>完成率 ${p[0].value}%` },
    grid: { top: 16, right: 12, bottom: 24, left: 40 },
    xAxis: { type: 'category' as const, data: stats.monthly.map(m => m.month), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, max: 100, axisLabel: { color: subColor, fontSize: 11, formatter: '{value}%' }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line' as const, data: stats.monthly.map(m => m.items > 0 ? Math.round(m.done / m.items * 100) : 0), smooth: true, areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent } }]
  };

  const bestMonth = stats.monthly.reduce((best, m) => m.focus > best.focus ? m : best, stats.monthly[0]);

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #8b5cf6, #7c3aed 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><CalendarOutlined /> 年度回顾</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>{year} 年度数据复盘</Typography.Title>
      </Card>

      {/* 年份切换 */}
      <Row gutter={[8, 8]}>
        {[year - 1, year, year + 1].map(y => (
          <Col key={y}>
            <div onClick={() => setYear(y)} style={{
              padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: 700,
              background: y === year ? accent : isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
              color: y === year ? '#fff' : subColor
            }}>{y}</div>
          </Col>
        ))}
      </Row>

      {/* 核心指标 */}
      <Row gutter={[16, 16]}>
        {[
          { label: '全年事项', value: stats.totalItems, suffix: `完成 ${stats.doneItems}`, icon: <CheckCircleOutlined />, color: '#3b82f6' },
          { label: '全年专注', value: `${stats.totalFocusMin}分`, suffix: `${stats.focusDays} 天`, icon: <FireOutlined />, color: '#f59e0b' },
          { label: '习惯打卡', value: stats.habitDays, suffix: `率 ${stats.habitRate}%`, icon: <TrophyOutlined />, color: '#22c55e' },
          { label: '日记篇数', value: stats.totalDiaries, suffix: `主导情绪 ${stats.topMood}`, icon: <BookOutlined />, color: '#ec4899' },
          { label: '目标进度', value: `${stats.doneMilestones}/${stats.totalMilestones}`, suffix: `${stats.completedGoals} 完成`, icon: <AimOutlined />, color: '#8b5cf6' },
          { label: '最高产月', value: bestMonth?.month || '-', suffix: `${bestMonth?.focus || 0} 分`, icon: <CrownOutlined />, color: '#14b8a6' }
        ].map(s => (
          <Col xs={12} lg={8} key={s.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
              <Statistic title={<span style={{ color: subColor, fontSize: 12 }}>{s.label}</span>} value={s.value} suffix={<span style={{ color: subColor, fontSize: 12, marginLeft: 6 }}>{s.suffix}</span>}
                valueStyle={{ color: s.color, fontSize: 22, fontWeight: 800 }} prefix={<span style={{ color: s.color, marginRight: 6 }}>{s.icon}</span>} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>月度趋势</Typography.Title>
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>事项完成率走势</Typography.Title>
            <ReactECharts option={completionOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '成长仪表盘', icon: <RiseOutlined />, color: '#ec4899', path: ROUTES.GROWTH },
            { label: '数据总览', icon: <DashboardOutlined />, color: '#3b82f6', path: ROUTES.DATA_OVERVIEW },
            { label: '成长月报', icon: <GoldOutlined />, color: '#8b5cf6', path: ROUTES.GROWTH_MONTHLY },
            { label: '专注模式对比', icon: <SwapOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_MODE_COMPARE },
            { label: '报告中心', icon: <BarChartOutlined />, color: '#22c55e', path: ROUTES.REPORTS },
            { label: '成就中心', icon: <CrownOutlined />, color: '#f59e0b', path: ROUTES.ACHIEVEMENTS }
          ].map(item => (
            <Col xs={12} sm={4} key={item.label}>
              <div onClick={() => nav(item.path)} style={{ borderRadius: 16, padding: 16, textAlign: 'center', cursor: 'pointer', background: isDark ? `${item.color}14` : `${item.color}0f`, border: `1px solid ${item.color}22`, transition: 'all 0.2s' }}>
                <div style={{ fontSize: 24, color: item.color, marginBottom: 6 }}>{item.icon}</div>
                <Typography.Text style={{ color: titleColor, fontWeight: 600, fontSize: 13 }}>{item.label}</Typography.Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </Space>
  );
}
