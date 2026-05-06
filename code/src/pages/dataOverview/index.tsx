// 数据总览 - 聚合所有模块核心指标的单页概览
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import { BarChartOutlined, CheckCircleOutlined, ClockCircleOutlined, FireOutlined, TrophyOutlined, BookOutlined, AimOutlined, HeartOutlined, RiseOutlined, CrownOutlined, CalendarOutlined, UnorderedListOutlined, LineChartOutlined, ThunderboltOutlined, DashboardOutlined, GoldOutlined, SwapOutlined, StarOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';
import Empty from '@/components/Empty';

export default function DataOverviewPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const now = dayjs();
  const yearStart = now.startOf('year').valueOf();

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
    const thisMonthItems = allItems.filter(i => i.createdAt >= now.startOf('month').valueOf()).length;
    const thisYearItems = allItems.filter(i => i.createdAt >= yearStart).length;
    const doneRate = totalItems > 0 ? Math.round(doneItems / totalItems * 100) : 0;

    // 专注
    const totalFocusMin = Math.round(allSessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const todaySessions = allSessions.filter(s => s.startTime >= now.startOf('day').valueOf());
    const todayFocusMin = Math.round(todaySessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const thisMonthFocusMin = Math.round(allSessions.filter(s => s.startTime >= now.startOf('month').valueOf()).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const thisYearFocusMin = Math.round(allSessions.filter(s => s.startTime >= yearStart).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const focusDays = new Set(allSessions.map(s => dayjs(s.startTime).format('YYYYMMDD'))).size;

    // 习惯
    const todayLogs = allLogs.filter(l => l.date >= now.startOf('day').valueOf());
    const todayHabitRate = allHabits.length > 0 ? Math.round(todayLogs.length / allHabits.length * 100) : 0;
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
    const thisYearDiaries = allDiaries.filter(d => d.date >= yearStart).length;
    const moodMap: Record<string, number> = {};
    allDiaries.forEach(d => { if (d.mood) moodMap[d.mood] = (moodMap[d.mood] || 0) + 1; });

    // 目标
    const activeGoals = allGoals.filter(g => g.status === 'active');
    const completedGoals = allGoals.filter(g => g.status === 'completed');
    const totalMilestones = allGoals.reduce((s, g) => s + (g.milestones?.length || 0), 0);
    const doneMilestones = allGoals.reduce((s, g) => s + (g.milestones?.filter(m => m.done).length || 0), 0);
    const thisYearGoals = allGoals.filter(g => g.createdAt >= yearStart).length;

    // 备忘录
    const totalMemos = allMemos.length;
    const pinnedMemos = allMemos.filter(m => m.pinned).length;
    const thisMonthMemos = allMemos.filter(m => m.createdAt >= now.startOf('month').valueOf()).length;

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

    // 模块增长率（本月 vs 上月）
    const lastMonthStart = now.subtract(1, 'month').startOf('month').valueOf();
    const lastMonthEnd = now.startOf('month').valueOf() - 1;
    const itemGrowth = Math.round((thisMonthItems - allItems.filter(i => i.createdAt >= lastMonthStart && i.createdAt <= lastMonthEnd).length) / Math.max(1, allItems.filter(i => i.createdAt >= lastMonthStart && i.createdAt <= lastMonthEnd).length) * 100);
    const focusGrowth = Math.round((thisMonthFocusMin - Math.round(allSessions.filter(s => s.startTime >= lastMonthStart && s.startTime <= lastMonthEnd).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000)) / Math.max(1, Math.round(allSessions.filter(s => s.startTime >= lastMonthStart && s.startTime <= lastMonthEnd).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000)) * 100);
    const diaryGrowth = Math.round((thisMonthDiaries - allDiaries.filter(d => d.date >= lastMonthStart && d.date <= lastMonthEnd).length) / Math.max(1, allDiaries.filter(d => d.date >= lastMonthStart && d.date <= lastMonthEnd).length) * 100);

    // 事项重要性分布
    const importanceDist: Record<number, number> = {};
    allItems.forEach(i => { importanceDist[i.importance || 0] = (importanceDist[i.importance || 0] || 0) + 1; });

    // 近7天活跃度
    const activity7: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = now.subtract(i, 'day').startOf('day');
      const de = d.endOf('day');
      const count =
        allItems.filter(item => item.createdAt >= d.valueOf() && item.createdAt <= de.valueOf()).length +
        allSessions.filter(s => s.startTime >= d.valueOf() && s.startTime <= de.valueOf()).length +
        allLogs.filter(l => l.date >= d.valueOf() && l.date <= de.valueOf()).length +
        allDiaries.filter(di => di.date >= d.valueOf() && di.date <= de.valueOf()).length +
        allGoals.filter(g => g.createdAt >= d.valueOf() && g.createdAt <= de.valueOf()).length +
        allMemos.filter(m => m.createdAt >= d.valueOf() && m.createdAt <= de.valueOf()).length;
      activity7.push({ date: d.format('MM/DD'), count });
    }

    // 近7天模块健康分趋势
    const healthTrend: { date: string; item: number; focus: number; habit: number; diary: number; goal: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = now.subtract(i, 'day').startOf('day');
      const de = d.endOf('day');
      const dayItems = allItems.filter(item => item.updatedAt >= d.valueOf() && item.updatedAt <= de.valueOf());
      const dayDone = dayItems.filter(item => item.completeStatus === 'done').length;
      const dayTotal = dayItems.length || allItems.length || 1;
      const dayItemHealth = Math.min(Math.round(dayDone / dayTotal * 100), 100);
      const dayFocusMin = Math.round(allSessions.filter(s => s.startTime >= d.valueOf() && s.startTime <= de.valueOf()).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      const dayFocusHealth = Math.min(Math.round(dayFocusMin / 10), 100);
      const dayLogs = allLogs.filter(l => l.date >= d.valueOf() && l.date <= de.valueOf());
      const dayHabitRate = allHabits.length > 0 ? Math.round(dayLogs.length / allHabits.length * 100) : 0;
      const dayDiaries = allDiaries.filter(di => di.date >= d.valueOf() && di.date <= de.valueOf()).length;
      const dayDiaryHealth = Math.min(dayDiaries * 10, 100);
      const dayGoalHealth = goalHealth;
      healthTrend.push({ date: d.format('MM/DD'), item: dayItemHealth, focus: dayFocusHealth, habit: dayHabitRate, diary: dayDiaryHealth, goal: dayGoalHealth });
    }

    // 24小时活跃热力图
    const heatmapData: [number, number, number][] = [];
    const days = 7;
    for (let d = 0; d < days; d++) {
      const dayStart = now.subtract(days - 1 - d, 'day').startOf('day');
      for (let h = 0; h < 24; h++) {
        const hourStart = dayStart.add(h, 'hour');
        const hourEnd = hourStart.endOf('hour');
        const count =
          allSessions.filter(s => s.startTime >= hourStart.valueOf() && s.startTime <= hourEnd.valueOf()).length +
          allLogs.filter(l => l.date >= hourStart.valueOf() && l.date <= hourEnd.valueOf()).length;
        heatmapData.push([d, h, count]);
      }
    }

    // 事项类型分布
    const itemTypeDist: Record<string, number> = {};
    allItems.forEach(i => { const t = i.type || '未分类'; itemTypeDist[t] = (itemTypeDist[t] || 0) + 1; });

    // 专注模式分布
    const focusModeDist: Record<string, number> = {};
    allSessions.forEach(s => { focusModeDist[s.mode] = (focusModeDist[s.mode] || 0) + 1; });

    // 年度累计数据
    const yearDoneItems = allItems.filter(i => i.completeStatus === 'done' && i.updatedAt >= yearStart).length;
    const yearFocusDays = new Set(allSessions.filter(s => s.startTime >= yearStart).map(s => dayjs(s.startTime).format('YYYYMMDD'))).size;

    return {
      totalItems, doneItems, overdueItems, todayItems, thisMonthItems, thisYearItems, doneRate,
      totalFocusMin, todayFocusMin, thisMonthFocusMin, thisYearFocusMin, focusDays,
      totalHabits: allHabits.length, todayHabitRate, maxStreak,
      totalDiaries, thisMonthDiaries, thisYearDiaries, moodMap,
      activeGoals: activeGoals.length, completedGoals: completedGoals.length, totalMilestones, doneMilestones, thisYearGoals,
      totalMemos, pinnedMemos, thisMonthMemos,
      dailyData, overallHealth,
      itemHealth, focusHealth, habitHealth, diaryHealth, goalHealth,
      healthTrend,
      importanceDist,
      activity7,
      weekGrowth: itemGrowth, focusGrowth, diaryGrowth,
      heatmapData,
      itemTypeDist,
      focusModeDist,
      yearDoneItems, yearFocusDays
    };
  }, [items, sessions, habits, habitLogs, diaries, goals, memos, yearStart]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const pctColor = (v: number) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#94a3b8';

  // 月度活跃趋势
  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    const add = (t: number) => { const k = dayjs(t).format('YYYY-MM'); map[k] = (map[k] || 0) + 1; };
    (items || []).forEach(i => add(i.createdAt));
    (sessions || []).forEach(s => add(s.startTime));
    (habitLogs || []).forEach(l => add(l.date));
    (diaries || []).forEach(d => add(d.date));
    (goals || []).forEach(g => add(g.createdAt));
    (memos || []).forEach(m => add(m.createdAt));
    const keys = Object.keys(map).sort().slice(-6);
    return { months: keys.map(k => `${k.slice(5)}月`), values: keys.map(k => map[k]) };
  }, [items, sessions, habitLogs, diaries, goals, memos]);

  const monthlyOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: monthlyData.months, axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: monthlyData.values, itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '50%' }]
  };

  // 模块占比
  const moduleComposition = useMemo(() => {
    const allItems = (items || []).length;
    const allSessions = (sessions || []).length;
    const allLogs = (habitLogs || []).length;
    const allDiaries = (diaries || []).length;
    const allGoals = (goals || []).length;
    const allMemos = (memos || []).length;
    return [
      { name: '事项', value: allItems, color: '#3b82f6' },
      { name: '专注', value: allSessions, color: '#f59e0b' },
      { name: '习惯', value: allLogs, color: '#22c55e' },
      { name: '日记', value: allDiaries, color: '#ec4899' },
      { name: '目标', value: allGoals, color: '#8b5cf6' },
      { name: '备忘录', value: allMemos, color: '#14b8a6' }
    ].filter(m => m.value > 0);
  }, [items, sessions, habitLogs, diaries, goals, memos]);

  const compositionOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie' as const, radius: ['40%', '70%'],
      data: moduleComposition.map(m => ({ name: m.name, value: m.value, itemStyle: { color: m.color } })),
      label: { color: subColor, fontSize: 12 }
    }]
  };

  // 30天活跃趋势
  const daily30Data = useMemo(() => {
    const map: Record<string, number> = {};
    const add = (t: number) => { const k = dayjs(t).format('MM/DD'); map[k] = (map[k] || 0) + 1; };
    (items || []).forEach(i => add(i.createdAt));
    (sessions || []).forEach(s => add(s.startTime));
    (habitLogs || []).forEach(l => add(l.date));
    (diaries || []).forEach(d => add(d.date));
    (goals || []).forEach(g => add(g.createdAt));
    (memos || []).forEach(m => add(m.createdAt));
    const keys = Object.keys(map).sort().slice(-30);
    return { dates: keys, values: keys.map(k => map[k]) };
  }, [items, sessions, habitLogs, diaries, goals, memos]);

  const daily30Option = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: daily30Data.dates, axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: daily30Data.values, smooth: true, areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent } }]
  };

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

  // 模块健康得分趋势折线图
  const healthTrendOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['事项', '专注', '习惯', '日记', '目标'], textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 34, right: 16, bottom: 24, left: 36 },
    xAxis: { type: 'category' as const, data: stats.healthTrend.map(d => d.date), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, max: 100, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [
      { name: '事项', type: 'line' as const, data: stats.healthTrend.map(d => d.item), smooth: true, lineStyle: { color: '#3b82f6', width: 2 }, itemStyle: { color: '#3b82f6' }, showSymbol: false },
      { name: '专注', type: 'line' as const, data: stats.healthTrend.map(d => d.focus), smooth: true, lineStyle: { color: '#f59e0b', width: 2 }, itemStyle: { color: '#f59e0b' }, showSymbol: false },
      { name: '习惯', type: 'line' as const, data: stats.healthTrend.map(d => d.habit), smooth: true, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' }, showSymbol: false },
      { name: '日记', type: 'line' as const, data: stats.healthTrend.map(d => d.diary), smooth: true, lineStyle: { color: '#ec4899', width: 2 }, itemStyle: { color: '#ec4899' }, showSymbol: false },
      { name: '目标', type: 'line' as const, data: stats.healthTrend.map(d => d.goal), smooth: true, lineStyle: { color: '#8b5cf6', width: 2 }, itemStyle: { color: '#8b5cf6' }, showSymbol: false }
    ]
  };

  // 事项重要性分布
  const importanceOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie' as const, radius: ['40%', '70%'],
      data: Object.entries(stats.importanceDist).map(([k, v]) => ({ name: ['重要且紧急', '重要不紧急', '不重要紧急', '不重要不紧急'][Number(k)] || '未设置', value: v, itemStyle: { color: ['#ff4d4f', '#fa8c16', '#1890ff', '#52c41a', '#94a3b8'][Number(k)] } })),
      label: { color: subColor, fontSize: 12 }
    }]
  };

  // 近7天活跃度
  const activity7Option = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: stats.activity7.map(d => d.date), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.activity7.map(d => d.count), itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '50%' }]
  };

  const heatmapOption = {
    tooltip: { position: 'top' as const },
    grid: { top: 10, right: 16, bottom: 28, left: 48 },
    xAxis: { type: 'category' as const, data: Array.from({ length: 7 }, (_, i) => now.subtract(6 - i, 'day').format('MM/DD')), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'category' as const, data: Array.from({ length: 24 }, (_, i) => `${i}时`), axisLabel: { color: subColor, fontSize: 10 } },
    visualMap: { min: 0, max: Math.max(1, ...stats.heatmapData.map(v => v[2])), calculable: true, orient: 'horizontal' as const, left: 'center', bottom: 0, inRange: { color: isDark ? ['rgba(255,255,255,0.04)', accent] : ['#f1f5f9', accent] }, textStyle: { color: subColor } },
    series: [{ type: 'heatmap' as const, data: stats.heatmapData, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } } }]
  };

  const itemTypeOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie' as const, radius: ['40%', '70%'],
      data: Object.entries(stats.itemTypeDist).map(([k, v]) => ({ name: k, value: v, itemStyle: { color: ['#3b82f6', '#f59e0b', '#22c55e', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4'][Object.keys(stats.itemTypeDist).indexOf(k) % 9] } })),
      label: { color: subColor, fontSize: 11 }
    }]
  };

  const focusModeOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie' as const, radius: ['40%', '70%'],
      data: Object.entries(stats.focusModeDist).map(([k, v]) => ({ name: { countdown: '倒计时', stopwatch: '正计时', pomodoro: '番茄钟' }[k] || k, value: v, itemStyle: { color: { countdown: '#3b82f6', stopwatch: '#22c55e', pomodoro: '#f59e0b' }[k] || accent } })),
      label: { color: subColor, fontSize: 12 }
    }]
  };

  // 活跃时段雷达（24小时分布）
  const hourDist = useMemo(() => {
    const hours = Array(24).fill(0);
    (sessions || []).forEach(s => hours[dayjs(s.startTime).hour()]++);
    (habitLogs || []).forEach(l => hours[dayjs(l.date).hour()]++);
    (diaries || []).forEach(d => hours[dayjs(d.date).hour()]++);
    const max = Math.max(1, ...hours);
    return hours.map(v => Math.round(v / max * 100));
  }, [sessions, habitLogs, diaries]);

  const hourRadarOption = {
    radar: {
      indicator: Array.from({ length: 24 }, (_, i) => ({ name: `${i}时`, max: 100 })),
      axisName: { color: subColor, fontSize: 10 },
      splitArea: { areaStyle: { color: isDark ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] : ['#f8fafc', '#f1f5f9'] } },
      radius: '65%'
    },
    series: [{
      type: 'radar' as const,
      data: [{
        value: hourDist,
        areaStyle: { color: `${accent}33` }, lineStyle: { color: accent, width: 1 }, itemStyle: { color: accent }, symbol: 'none'
      }]
    }]
  };

  const modules = [
    { label: '事项', icon: <CheckCircleOutlined />, color: '#3b82f6', stats: [
      { label: '总数', value: stats.totalItems }, { label: '已完成', value: stats.doneItems },
      { label: '本月', value: stats.thisMonthItems }, { label: '本年', value: stats.thisYearItems }
    ], path: ROUTES.MATTER_ALL },
    { label: '专注', icon: <FireOutlined />, color: '#f59e0b', stats: [
      { label: '总会话', value: (sessions || []).length }, { label: '累计分钟', value: stats.totalFocusMin },
      { label: '今日分钟', value: stats.todayFocusMin }, { label: '专注天数', value: stats.focusDays }
    ], path: ROUTES.FOCUS },
    { label: '习惯', icon: <TrophyOutlined />, color: '#22c55e', stats: [
      { label: '总习惯', value: stats.totalHabits }, { label: '今日完成率', value: `${stats.todayHabitRate}%` },
      { label: '最长连续', value: `${stats.maxStreak}天` }
    ], path: ROUTES.HABIT },
    { label: '日记', icon: <BookOutlined />, color: '#ec4899', stats: [
      { label: '总篇数', value: stats.totalDiaries }, { label: '本月', value: stats.thisMonthDiaries },
      { label: '本年', value: stats.thisYearDiaries }
    ], path: ROUTES.DIARY_CAL },
    { label: '目标', icon: <AimOutlined />, color: '#8b5cf6', stats: [
      { label: '进行中', value: stats.activeGoals }, { label: '已完成', value: stats.completedGoals },
      { label: '里程碑', value: `${stats.doneMilestones}/${stats.totalMilestones}` }
    ], path: ROUTES.GOAL },
    { label: '备忘录', icon: <UnorderedListOutlined />, color: '#14b8a6', stats: [
      { label: '总数', value: stats.totalMemos }, { label: '置顶', value: stats.pinnedMemos },
      { label: '本月', value: stats.thisMonthMemos }
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
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>
          综合健康度 {stats.overallHealth}% · 本月增长 事项{stats.weekGrowth >= 0 ? '+' : ''}{stats.weekGrowth}% 专注{stats.focusGrowth >= 0 ? '+' : ''}{stats.focusGrowth}% 日记{stats.diaryGrowth >= 0 ? '+' : ''}{stats.diaryGrowth}%
        </Typography.Text>
      </Card>

      {/* 今日/本月/本年 快速指标 */}
      <Row gutter={[16, 16]}>
        {[
          { label: '今日事项', value: stats.todayItems, icon: <CalendarOutlined />, color: '#3b82f6' },
          { label: '今日专注', value: `${stats.todayFocusMin}分`, icon: <ClockCircleOutlined />, color: '#f59e0b' },
          { label: '习惯打卡', value: `${stats.todayHabitRate}%`, icon: <CheckCircleOutlined />, color: '#22c55e' },
          { label: '本月日记', value: stats.thisMonthDiaries, icon: <BookOutlined />, color: '#ec4899' },
          { label: '本年目标', value: stats.thisYearGoals, icon: <AimOutlined />, color: '#8b5cf6' },
          { label: '本年专注天', value: stats.yearFocusDays, icon: <StarOutlined />, color: '#f59e0b' }
        ].map(m => (
          <Col xs={12} lg={4} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 15 }}>{m.icon}</div>
                <span style={{ color: subColor, fontSize: 11 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 综合健康分 + 模块细分 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, textAlign: 'center', height: '100%' }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>系统健康度</Typography.Title>
            <Progress type="circle" percent={stats.overallHealth} size={140} strokeColor={stats.overallHealth >= 80 ? '#22c55e' : stats.overallHealth >= 50 ? '#f59e0b' : '#ef4444'}
              format={p => <span style={{ fontSize: 32, fontWeight: 800, color: stats.overallHealth >= 80 ? '#22c55e' : stats.overallHealth >= 50 ? '#f59e0b' : '#ef4444' }}>{p}</span>} />
            <div style={{ marginTop: 12, color: subColor, fontSize: 13 }}>综合评分 = (事项 + 专注 + 习惯 + 日记 + 目标) / 5</div>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>模块健康明细</Typography.Title>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {[
                { label: '事项完成率', value: stats.itemHealth, color: '#3b82f6', desc: `${stats.doneItems}/${stats.totalItems} 已完成` },
                { label: '专注积累', value: stats.focusHealth, color: '#f59e0b', desc: `${stats.totalFocusMin} 分钟累计` },
                { label: '习惯今日打卡', value: stats.habitHealth, color: '#22c55e', desc: `${stats.todayHabitRate}% 已打卡` },
                { label: '日记沉淀', value: stats.diaryHealth, color: '#ec4899', desc: `${stats.totalDiaries} 篇` },
                { label: '目标推进', value: stats.goalHealth, color: '#8b5cf6', desc: `${stats.doneMilestones}/${stats.totalMilestones} 里程碑` }
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: titleColor, fontWeight: 600 }}>{m.label}</span>
                    <span style={{ fontSize: 12, color: subColor }}>{m.desc}</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', overflow: 'hidden' }}>
                    <div style={{ width: `${m.value}%`, height: '100%', borderRadius: 4, background: m.value >= 70 ? m.color : m.value >= 40 ? '#f59e0b' : '#ef4444', transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 各模块核心指标 */}
      <Row gutter={[16, 16]}>
        {modules.map(m => (
          <Col xs={12} lg={8} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%', cursor: 'pointer' }} onClick={() => nav(m.path)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 17 }}>{m.icon}</div>
                <span style={{ fontWeight: 700, fontSize: 15, color: titleColor }}>{m.label}</span>
                {m.label === '事项' && stats.weekGrowth !== 0 && <Tag style={{ borderRadius: 999, fontSize: 11, background: `${pctColor(stats.weekGrowth)}18`, border: `1px solid ${pctColor(stats.weekGrowth)}44`, color: pctColor(stats.weekGrowth) }}>{stats.weekGrowth > 0 ? '+' : ''}{stats.weekGrowth}%</Tag>}
                {m.label === '专注' && stats.focusGrowth !== 0 && <Tag style={{ borderRadius: 999, fontSize: 11, background: `${pctColor(stats.focusGrowth)}18`, border: `1px solid ${pctColor(stats.focusGrowth)}44`, color: pctColor(stats.focusGrowth) }}>{stats.focusGrowth > 0 ? '+' : ''}{stats.focusGrowth}%</Tag>}
                {m.label === '日记' && stats.diaryGrowth !== 0 && <Tag style={{ borderRadius: 999, fontSize: 11, background: `${pctColor(stats.diaryGrowth)}18`, border: `1px solid ${pctColor(stats.diaryGrowth)}44`, color: pctColor(stats.diaryGrowth) }}>{stats.diaryGrowth > 0 ? '+' : ''}{stats.diaryGrowth}%</Tag>}
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

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 7 天模块健康得分趋势</Typography.Title>
        <ReactECharts option={healthTrendOption} style={{ height: 260 }} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>活跃时段雷达（24小时）</Typography.Title>
            <ReactECharts option={hourRadarOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 30 天活跃趋势</Typography.Title>
            <ReactECharts option={daily30Option} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 6 个月活跃度趋势</Typography.Title>
        <ReactECharts option={monthlyOption} style={{ height: 240 }} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>模块数据占比</Typography.Title>
            <ReactECharts option={compositionOption} style={{ height: 260 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 7 天综合活跃度</Typography.Title>
            <ReactECharts option={activity7Option} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>事项重要性分布</Typography.Title>
            {Object.keys(stats.importanceDist).length > 0 ? (
              <ReactECharts option={importanceOption} style={{ height: 260 }} />
            ) : (
              <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无事项数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>事项类型分布</Typography.Title>
            {Object.keys(stats.itemTypeDist).length > 0 ? (
              <ReactECharts option={itemTypeOption} style={{ height: 260 }} />
            ) : <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无事项数据</div>}
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>24小时活跃热力图（近7天）</Typography.Title>
        <ReactECharts option={heatmapOption} style={{ height: 320 }} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>专注模式分布</Typography.Title>
            {Object.keys(stats.focusModeDist).length > 0 ? (
              <ReactECharts option={focusModeOption} style={{ height: 260 }} />
            ) : <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无专注数据</div>}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>年度成就</Typography.Title>
            <Space direction="vertical" size={14} style={{ width: '100%', padding: '20px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: isDark ? '#3b82f614' : '#3b82f60f', border: '1px solid #3b82f622' }}>
                <span style={{ color: titleColor, fontWeight: 600 }}><CheckCircleOutlined style={{ color: '#3b82f6', marginRight: 8 }} />本年已完成事项</span>
                <span style={{ color: '#3b82f6', fontWeight: 800, fontSize: 18 }}>{stats.yearDoneItems}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: isDark ? '#f59e0b14' : '#f59e0b0f', border: '1px solid #f59e0b22' }}>
                <span style={{ color: titleColor, fontWeight: 600 }}><ClockCircleOutlined style={{ color: '#f59e0b', marginRight: 8 }} />本年专注天数</span>
                <span style={{ color: '#f59e0b', fontWeight: 800, fontSize: 18 }}>{stats.yearFocusDays} 天</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: isDark ? '#22c55e14' : '#22c55e0f', border: '1px solid #22c55e22' }}>
                <span style={{ color: titleColor, fontWeight: 600 }}><SafetyCertificateOutlined style={{ color: '#22c55e', marginRight: 8 }} />本年累计专注</span>
                <span style={{ color: '#22c55e', fontWeight: 800, fontSize: 18 }}>{Math.floor(stats.thisYearFocusMin / 60)}h{stats.thisYearFocusMin % 60}m</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 14, background: isDark ? '#ec489914' : '#ec48990f', border: '1px solid #ec489922' }}>
                <span style={{ color: titleColor, fontWeight: 600 }}><BookOutlined style={{ color: '#ec4899', marginRight: 8 }} />本年日记篇数</span>
                <span style={{ color: '#ec4899', fontWeight: 800, fontSize: 18 }}>{stats.thisYearDiaries} 篇</span>
              </div>
            </Space>
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
            { label: '成长月报', icon: <GoldOutlined />, color: '#8b5cf6', path: ROUTES.GROWTH_MONTHLY },
            { label: '专注模式对比', icon: <SwapOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_MODE_COMPARE },
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
