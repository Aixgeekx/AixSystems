// 数据总览 - 聚合所有模块核心指标的单页概览
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Typography } from 'antd';
import { BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined, FireOutlined, TrophyOutlined, BookOutlined, AimOutlined, HeartOutlined, RiseOutlined, CrownOutlined, CalendarOutlined, UnorderedListOutlined, LineChartOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

export default function DataOverviewPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const now = dayjs();

  const items = useLiveQuery(() => db.items.filter(i => !i.deletedAt).toArray(), []);
  const sessions = useLiveQuery(() => db.focusSessions.toArray(), []);
  const habits = useLiveQuery(() => db.habits.filter(h => !h.deletedAt).toArray(), []);
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), []);
  const diaries = useLiveQuery(() => db.diaries.filter(d => !d.deletedAt).toArray(), []);
  const goals = useLiveQuery(() => db.goals.filter(g => !g.deletedAt).toArray(), []);
  const memos = useLiveQuery(() => db.memos.filter(m => !m.deletedAt).toArray(), []);

  const stats = useMemo(() => {
    const allItems = items || [];
    const allSessions = sessions || [];
    const allHabits = habits || [];
    const allLogs = habitLogs || [];
    const allDiaries = diaries || [];
    const allGoals = goals || [];
    const allMemos = memos || [];

    // 事项
    const totalItems = allItems.length;
    const doneItems = allItems.filter(i => i.completeStatus === 'done').length;
    const overdueItems = allItems.filter(i => i.endTime && dayjs(i.endTime).isBefore(now, 'day') && i.completeStatus !== 'done').length;
    const todayItems = allItems.filter(i => i.startTime >= now.startOf('day').valueOf() && i.startTime <= now.endOf('day').valueOf()).length;
    const doneRate = totalItems > 0 ? Math.round(doneItems / totalItems * 100) : 0;

    // 专注
    const totalFocusMin = Math.round(allSessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const todaySessions = allSessions.filter(s => s.startTime >= now.startOf('day').valueOf());
    const todayFocusMin = Math.round(todaySessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const focusDays = new Set(allSessions.map(s => dayjs(s.startTime).format('YYYYMMDD'))).size;

    // 习惯
    const todayLogs = allLogs.filter(l => l.date >= now.startOf('day').valueOf());
    const todayHabitRate = allHabits.length > 0 ? Math.round(todayLogs.length / allHabits.length * 100) : 0;
    // 最长连续天数
    let maxStreak = 0;
    allHabits.forEach(h => {
      const hLogs = allLogs.filter(l => l.habitId === h.id).map(l => dayjs(l.date).format('YYYYMMDD'));
      const uniqueDays = [...new Set(hLogs)].sort();
      let streak = 0, max = 0;
      for (let i = 0; i < uniqueDays.length; i++) {
        if (i === 0 || dayjs(uniqueDays[i]).diff(dayjs(uniqueDays[i - 1]), 'day') === 1) { streak++; max = Math.max(max, streak); } else { streak = 1; }
      }
      maxStreak = Math.max(maxStreak, max);
    });

    // 日记
    const totalDiaries = allDiaries.length;
    const thisMonthDiaries = allDiaries.filter(d => d.date >= now.startOf('month').valueOf()).length;
    const moodMap: Record<string, number> = {};
    allDiaries.forEach(d => { if (d.mood) moodMap[d.mood] = (moodMap[d.mood] || 0) + 1; });

    // 目标
    const activeGoals = allGoals.filter(g => g.status === 'active');
    const completedGoals = allGoals.filter(g => g.status === 'completed');
    const totalMilestones = allGoals.reduce((s, g) => s + (g.milestones?.length || 0), 0);
    const doneMilestones = allGoals.reduce((s, g) => s + (g.milestones?.filter(m => m.done).length || 0), 0);

    // 备忘录
    const totalMemos = allMemos.length;
    const pinnedMemos = allMemos.filter(m => m.pinned).length;

    // 7天趋势
    const dailyData: { date: string; focus: number; items: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = now.subtract(i, 'day').startOf('day');
      const de = d.endOf('day');
      const focusMin = Math.round(allSessions.filter(s => s.startTime >= d.valueOf() && s.startTime <= de.valueOf()).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      const itemCount = allItems.filter(item => item.completeStatus === 'done' && item.updatedAt >= d.valueOf() && item.updatedAt <= de.valueOf()).length;
      dailyData.push({ date: d.format('MM/DD'), focus: focusMin, items: itemCount });
    }

    // 模块健康分
    const itemHealth = Math.min(doneRate, 100);
    const focusHealth = Math.min(Math.round(totalFocusMin / 50), 100);
    const habitHealth = todayHabitRate;
    const diaryHealth = Math.min(totalDiaries * 2, 100);
    const goalHealth = totalMilestones > 0 ? Math.round(doneMilestones / totalMilestones * 100) : (activeGoals.length > 0 ? 30 : 0);
    const overallHealth = Math.round((itemHealth + focusHealth + habitHealth + diaryHealth + goalHealth) / 5);

    return {
      totalItems, doneItems, overdueItems, todayItems, doneRate,
      totalFocusMin, todayFocusMin, focusDays, totalSessions: allSessions.length,
      totalHabits: allHabits.length, todayHabitRate, maxStreak,
      totalDiaries, thisMonthDiaries, moodMap,
      activeGoals: activeGoals.length, completedGoals: completedGoals.length, totalMilestones, doneMilestones,
      totalMemos, pinnedMemos,
      dailyData, overallHealth,
      itemHealth, focusHealth, habitHealth, diaryHealth, goalHealth
    };
  }, [items, sessions, habits, habitLogs, diaries, goals, memos]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  // 7天趋势双轴图
  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['专注(分钟)', '完成事项'], textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 40, bottom: 24, left: 40 },
    xAxis: { type: 'category' as const, data: stats.dailyData.map(d => d.date), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: [
      { type: 'value' as const, name: '分钟', axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
      { type: 'value' as const, name: '事项', axisLabel: { color: subColor, fontSize: 11 }, splitLine: { show: false } }
    ],
    series: [
      { name: '专注(分钟)', type: 'bar' as const, data: stats.dailyData.map(d => d.focus), itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }, barWidth: '35%' },
      { name: '完成事项', type: 'line' as const, yAxisIndex: 1, data: stats.dailyData.map(d => d.items), smooth: true, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' } }
    ]
  };

  // 模块健康雷达
  const radarOption = {
    radar: {
      indicator: [
        { name: '事项', max: 100 }, { name: '专注', max: 100 }, { name: '习惯', max: 100 },
        { name: '日记', max: 100 }, { name: '目标', max: 100 }
      ],
      axisName: { color: subColor, fontSize: 12 },
      splitArea: { areaStyle: { color: isDark ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] : ['#f8fafc', '#f1f5f9'] } }
    },
    series: [{
      type: 'radar' as const,
      data: [{
        value: [stats.itemHealth, stats.focusHealth, stats.habitHealth, stats.diaryHealth, stats.goalHealth],
        areaStyle: { color: `${accent}33` }, lineStyle: { color: accent }, itemStyle: { color: accent }
      }]
    }]
  };

  const modules = [
    { label: '事项', icon: <CheckCircleOutlined />, color: '#3b82f6', stats: [
      { label: '总数', value: stats.totalItems }, { label: '已完成', value: stats.doneItems },
      { label: '今日', value: stats.todayItems }, { label: '逾期', value: stats.overdueItems }
    ], path: ROUTES.MATTER_ALL },
    { label: '专注', icon: <FireOutlined />, color: '#f59e0b', stats: [
      { label: '总会话', value: stats.totalSessions }, { label: '累计分钟', value: stats.totalFocusMin },
      { label: '今日分钟', value: stats.todayFocusMin }, { label: '专注天数', value: stats.focusDays }
    ], path: ROUTES.FOCUS },
    { label: '习惯', icon: <TrophyOutlined />, color: '#22c55e', stats: [
      { label: '总习惯', value: stats.totalHabits }, { label: '今日完成率', value: `${stats.todayHabitRate}%` },
      { label: '最长连续', value: `${stats.maxStreak}天` }
    ], path: ROUTES.HABIT },
    { label: '日记', icon: <BookOutlined />, color: '#ec4899', stats: [
      { label: '总篇数', value: stats.totalDiaries }, { label: '本月', value: stats.thisMonthDiaries }
    ], path: ROUTES.DIARY_CAL },
    { label: '目标', icon: <AimOutlined />, color: '#8b5cf6', stats: [
      { label: '进行中', value: stats.activeGoals }, { label: '已完成', value: stats.completedGoals },
      { label: '里程碑', value: `${stats.doneMilestones}/${stats.totalMilestones}` }
    ], path: ROUTES.GOAL },
    { label: '备忘录', icon: <UnorderedListOutlined />, color: '#14b8a6', stats: [
      { label: '总数', value: stats.totalMemos }, { label: '置顶', value: stats.pinnedMemos }
    ], path: ROUTES.MEMO }
  ];

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #3b82f6, #1d4ed8 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><BarChartOutlined /> 数据总览</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>全模块核心指标</Typography.Title>
      </Card>

      {/* 综合健康分 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, textAlign: 'center' }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>系统健康度</Typography.Title>
        <Progress type="circle" percent={stats.overallHealth} size={140} strokeColor={stats.overallHealth >= 80 ? '#22c55e' : stats.overallHealth >= 50 ? '#f59e0b' : '#ef4444'}
          format={p => <span style={{ fontSize: 32, fontWeight: 800, color: stats.overallHealth >= 80 ? '#22c55e' : stats.overallHealth >= 50 ? '#f59e0b' : '#ef4444' }}>{p}</span>} />
        <div style={{ marginTop: 12, color: subColor, fontSize: 13 }}>
          事项 {stats.itemHealth} + 专注 {stats.focusHealth} + 习惯 {stats.habitHealth} + 日记 {stats.diaryHealth} + 目标 {stats.goalHealth}
        </div>
      </Card>

      {/* 各模块核心指标 */}
      <Row gutter={[16, 16]}>
        {modules.map(m => (
          <Col xs={12} lg={8} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%', cursor: 'pointer' }} onClick={() => nav(m.path)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 17 }}>{m.icon}</div>
                <span style={{ fontWeight: 700, fontSize: 15, color: titleColor }}>{m.label}</span>
              </div>
              <Row gutter={[8, 8]}>
                {m.stats.map(s => (
                  <Col span={Math.floor(24 / m.stats.length)} key={s.label}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: subColor }}>{s.label}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 7天趋势 */}
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 7 天趋势</Typography.Title>
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        {/* 模块健康雷达 */}
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>模块健康雷达</Typography.Title>
            <ReactECharts option={radarOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '成长仪表盘', icon: <RiseOutlined />, color: '#ec4899', path: ROUTES.GROWTH },
            { label: '报告中心', icon: <BarChartOutlined />, color: '#3b82f6', path: ROUTES.REPORTS },
            { label: '成就中心', icon: <TrophyOutlined />, color: '#f59e0b', path: ROUTES.ACHIEVEMENTS },
            { label: '数据统计', icon: <LineChartOutlined />, color: '#22c55e', path: ROUTES.STATISTICS },
          ].map(item => (
            <Col xs={12} sm={6} key={item.label}>
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
