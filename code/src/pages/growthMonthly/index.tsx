// 成长月报 - 月度综合成长报告
import React, { useMemo } from 'react';
import { Button, Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, FireOutlined, TrophyOutlined, BookOutlined, AimOutlined, HeartOutlined, BarChartOutlined, RiseOutlined, CrownOutlined, BulbOutlined, LineChartOutlined, UnorderedListOutlined, ThunderboltOutlined, DashboardOutlined, GoldOutlined, SwapOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';
import Empty from '@/components/Empty';

export default function GrowthMonthlyPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const now = dayjs();
  const monthStart = now.startOf('month');
  const lastMonthStart = monthStart.subtract(1, 'month');
  const lastMonthEnd = monthStart.subtract(1, 'day').endOf('day');

  const items = useLiveQuery(() => db.items.filter(i => !i.deletedAt).toArray(), []);
  const sessions = useLiveQuery(() => db.focusSessions.toArray(), []);
  const habits = useLiveQuery(() => db.habits.filter(h => !h.deletedAt).toArray(), []);
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), []);
  const diaries = useLiveQuery(() => db.diaries.filter(d => !d.deletedAt).toArray(), []);
  const goals = useLiveQuery(() => db.goals.filter(g => !g.deletedAt).toArray(), []);

  const stats = useMemo(() => {
    const thisMonth = (items || []).filter(i => i.updatedAt >= monthStart.valueOf());
    const lastMonth = (items || []).filter(i => i.updatedAt >= lastMonthStart.valueOf() && i.updatedAt <= lastMonthEnd.valueOf());
    const doneThisMonth = thisMonth.filter(i => i.completeStatus === 'done').length;
    const doneLastMonth = lastMonth.filter(i => i.completeStatus === 'done').length;
    const overdueThisMonth = thisMonth.filter(i => i.endTime && dayjs(i.endTime).isBefore(now, 'day') && i.completeStatus !== 'done').length;

    // 专注
    const focusThis = (sessions || []).filter(s => s.startTime >= monthStart.valueOf());
    const focusLast = (sessions || []).filter(s => s.startTime >= lastMonthStart.valueOf() && s.startTime <= lastMonthEnd.valueOf());
    const focusMinThis = Math.round(focusThis.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const focusMinLast = Math.round(focusLast.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const focusDays = new Set(focusThis.map(s => dayjs(s.startTime).format('YYYYMMDD'))).size;

    // 习惯
    const hLogsThis = (habitLogs || []).filter(l => l.date >= monthStart.valueOf() && l.date <= now.valueOf());
    const hLogsLast = (habitLogs || []).filter(l => l.date >= lastMonthStart.valueOf() && l.date <= lastMonthEnd.valueOf());
    const totalHabits = (habits || []).length;
    const daysInMonth = now.date();
    const habitRate = totalHabits > 0 && daysInMonth > 0 ? Math.round(hLogsThis.length / (totalHabits * daysInMonth) * 100) : 0;
    const habitRateLast = totalHabits > 0 ? Math.round(hLogsLast.length / (totalHabits * lastMonthEnd.date()) * 100) : 0;

    // 日记
    const diaryThis = (diaries || []).filter(d => d.date >= monthStart.valueOf());
    const diaryLast = (diaries || []).filter(d => d.date >= lastMonthStart.valueOf() && d.date <= lastMonthEnd.valueOf());

    // 目标
    const activeGoals = (goals || []).filter(g => g.status === 'active');
    const completedGoals = (goals || []).filter(g => g.status === 'completed' && g.updatedAt >= monthStart.valueOf());
    const goalMilestonesTotal = activeGoals.reduce((s, g) => s + (g.milestones?.length || 0), 0);
    const goalMilestonesDone = activeGoals.reduce((s, g) => s + (g.milestones?.filter(m => m.done).length || 0), 0);

    // 每日专注分布
    const dailyFocus: { date: string; minutes: number }[] = [];
    for (let i = 0; i < daysInMonth; i++) {
      const d = monthStart.add(i, 'day');
      if (d.isAfter(now)) break;
      const de = d.endOf('day');
      const mins = Math.round(focusThis.filter(s => s.startTime >= d.valueOf() && s.startTime <= de.valueOf()).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      dailyFocus.push({ date: d.format('DD'), minutes: mins });
    }

    // 近6个月得分趋势（用已有数据回算）
    const monthlyTrend: { month: string; score: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ms = now.subtract(i, 'month').startOf('month');
      const me = ms.endOf('month');
      const mItems = (items || []).filter(item => item.updatedAt >= ms.valueOf() && item.updatedAt <= me.valueOf());
      const mDone = mItems.filter(i => i.completeStatus === 'done').length;
      const mFocusMin = Math.round((sessions || []).filter(s => s.startTime >= ms.valueOf() && s.startTime <= me.valueOf()).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      const mLogs = (habitLogs || []).filter(l => l.date >= ms.valueOf() && l.date <= me.valueOf());
      const mDiaries = (diaries || []).filter(d => d.date >= ms.valueOf() && d.date <= me.valueOf());
      const mItemScore = mDone > 0 ? Math.min(mDone * 5, 30) : 0;
      const mFocusScore = Math.min(Math.round(mFocusMin / 10), 30);
      const mHabitScore = totalHabits > 0 ? Math.min(Math.round(Math.round(mLogs.length / Math.max(1, totalHabits * me.date()) * 100) * 0.25), 25) : 0;
      const mDiaryScore = Math.min(mDiaries.length * 2, 15);
      monthlyTrend.push({ month: ms.format('M月'), score: Math.min(mItemScore + mFocusScore + mHabitScore + mDiaryScore, 100) });
    }

    // 本月习惯每周打卡柱状图
    const habitWeeks: { week: string; count: number }[] = [];
    const weekCount = Math.ceil(daysInMonth / 7);
    for (let w = 0; w < weekCount; w++) {
      const ws = monthStart.add(w * 7, 'day');
      const we = ws.add(6, 'day').endOf('day');
      const realEnd = we.isAfter(now) ? now : we;
      const count = hLogsThis.filter(l => l.date >= ws.valueOf() && l.date <= realEnd.valueOf()).length;
      habitWeeks.push({ week: `第${w + 1}周`, count });
    }

    // 专注模式分布
    const focusModeDist: Record<string, number> = {};
    focusThis.forEach(s => { focusModeDist[s.mode] = (focusModeDist[s.mode] || 0) + 1; });

    // 星期分布
    const weekdayDist: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    focusThis.forEach(s => { const wd = dayjs(s.startTime).format('ddd'); weekdayDist[wd] = (weekdayDist[wd] || 0) + Math.round((s.actualMs || 0) / 60000); });

    // 事项类型分布
    const itemTypeDist: Record<string, number> = {};
    thisMonth.forEach(i => { const t = i.type || '未分类'; itemTypeDist[t] = (itemTypeDist[t] || 0) + 1; });

    // TOP专注日（专注分钟最多的3天）
    const dailyFocusSorted = [...dailyFocus].sort((a, b) => b.minutes - a.minutes);
    const topFocusDays = dailyFocusSorted.slice(0, 3);

    // 综合得分（百分制）
    const itemScore = doneThisMonth > 0 ? Math.min(doneThisMonth * 5, 30) : 0; // 最高30分
    const focusScore = Math.min(Math.round(focusMinThis / 10), 30); // 最高30分
    const habitScore = Math.min(Math.round(habitRate * 0.25), 25); // 最高25分
    const diaryScore = Math.min(diaryThis.length * 2, 15); // 最高15分
    const totalScore = Math.min(itemScore + focusScore + habitScore + diaryScore, 100);

    return {
      doneThisMonth, doneLastMonth, overdueThisMonth,
      focusMinThis, focusMinLast, focusDays,
      habitRate, habitRateLast, totalHabits,
      diaryThis: diaryThis.length, diaryLast: diaryLast.length,
      activeGoals: activeGoals.length, completedGoals: completedGoals.length,
      goalMilestonesTotal, goalMilestonesDone,
      dailyFocus,
      totalScore, itemScore, focusScore, habitScore, diaryScore,
      monthlyTrend,
      habitWeeks,
      daysInMonth,
      focusModeDist,
      weekdayDist,
      itemTypeDist,
      topFocusDays,
      // 环比
      itemChange: doneLastMonth > 0 ? Math.round((doneThisMonth - doneLastMonth) / doneLastMonth * 100) : (doneThisMonth > 0 ? 100 : 0),
      focusChange: focusMinLast > 0 ? Math.round((focusMinThis - focusMinLast) / focusMinLast * 100) : (focusMinThis > 0 ? 100 : 0),
      habitChange: habitRateLast > 0 ? Math.round((habitRate - habitRateLast) / habitRateLast * 100) : (habitRate > 0 ? 100 : 0),
      diaryChange: diaryLast.length > 0 ? Math.round((diaryThis.length - diaryLast.length) / diaryLast.length * 100) : (diaryThis.length > 0 ? 100 : 0),
    };
  }, [items, sessions, habits, habitLogs, diaries, goals]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const changeColor = (v: number) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : subColor;
  const changeText = (v: number) => v > 0 ? `↑${v}%` : v < 0 ? `↓${Math.abs(v)}%` : '持平';

  const handleExportMarkdown = () => {
    const lines = [
      `# AixSystems ${now.format('YYYY年M月')} 成长月报`,
      '',
      `> 生成时间: ${dayjs().format('YYYY-MM-DD HH:mm')}`,
      '',
      '## 综合得分',
      `- 本月成长得分: ${stats.totalScore}/100`,
      `  - 事项完成: ${stats.itemScore}/30`,
      `  - 专注时长: ${stats.focusScore}/30`,
      `  - 习惯打卡: ${stats.habitScore}/25`,
      `  - 日记写作: ${stats.diaryScore}/15`,
      '',
      '## 核心指标',
      `- 完成事项: ${stats.doneThisMonth} (环比 ${changeText(stats.itemChange).replace(/[↑↓]/, m => m === '↑' ? '+' : '-')})`,
      `- 专注时长: ${stats.focusMinThis} 分钟 (环比 ${changeText(stats.focusChange).replace(/[↑↓]/, m => m === '↑' ? '+' : '-')})`,
      `- 习惯完成率: ${stats.habitRate}% (环比 ${changeText(stats.habitChange).replace(/[↑↓]/, m => m === '↑' ? '+' : '-')})`,
      `- 日记篇数: ${stats.diaryThis} (环比 ${changeText(stats.diaryChange).replace(/[↑↓]/, m => m === '↑' ? '+' : '-')})`,
      `- 逾期事项: ${stats.overdueThisMonth}`,
      '',
      '## 目标进度',
      `- 进行中目标: ${stats.activeGoals}`,
      `- 本月完成目标: ${stats.completedGoals}`,
      `- 里程碑进度: ${stats.goalMilestonesDone}/${stats.goalMilestonesTotal}`,
      '',
      '## 本月亮点',
    ];
    const badges = [
      stats.focusDays >= 20 && `专注达人: 本月已专注 ${stats.focusDays} 天`,
      stats.doneThisMonth >= 30 && `事项达人: 本月完成 ${stats.doneThisMonth} 项`,
      stats.habitRate >= 80 && `习惯之星: 习惯完成率 ${stats.habitRate}%`,
      stats.diaryThis >= 20 && `日记达人: 本月写了 ${stats.diaryThis} 篇`,
      stats.focusMinThis >= 1000 && `千分专注: 累计 ${stats.focusMinThis} 分钟`,
      stats.totalScore >= 80 && `全能学霸: 综合得分 ${stats.totalScore}`,
    ].filter(Boolean);
    if (badges.length) lines.push(...badges.map(b => `- ${b}`), '');
    else lines.push('- 继续努力，各项成就正在解锁中...', '');
    lines.push('---', '由 AixSystems 自动生成');
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AixSystems-${now.format('YYYY-MM')}-成长月报.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 每日专注柱状图
  const dailyOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 16, right: 12, bottom: 24, left: 40 },
    xAxis: { type: 'category' as const, data: stats.dailyFocus.map(d => d.date), axisLabel: { color: subColor, fontSize: 10, interval: 2 } },
    yAxis: { type: 'value' as const, name: '分钟', axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.dailyFocus.map(d => d.minutes), itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }, barWidth: '60%' }]
  };

  // 维度得分雷达
  const radarOption = {
    radar: {
      indicator: [
        { name: '事项完成', max: 30 }, { name: '专注时长', max: 30 },
        { name: '习惯打卡', max: 25 }, { name: '日记写作', max: 15 }
      ],
      axisName: { color: subColor, fontSize: 12 },
      splitArea: { areaStyle: { color: isDark ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] : ['#f8fafc', '#f1f5f9'] } }
    },
    series: [{
      type: 'radar' as const,
      data: [{ value: [stats.itemScore, stats.focusScore, stats.habitScore, stats.diaryScore], areaStyle: { color: `${accent}33` }, lineStyle: { color: accent }, itemStyle: { color: accent } }]
    }]
  };

  // 近6个月得分趋势
  const monthlyTrendOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: stats.monthlyTrend.map(d => d.month), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, max: 100, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: stats.monthlyTrend.map(d => d.score), smooth: true, areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent } }]
  };

  // 本月习惯周打卡柱状图
  const habitWeekOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: stats.habitWeeks.map(d => d.week), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.habitWeeks.map(d => d.count), itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  const focusModeOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie' as const, radius: ['40%', '70%'],
      data: Object.entries(stats.focusModeDist).map(([k, v]) => ({ name: ['countdown', 'stopwatch', 'pomodoro'][k as any] || k, value: v, itemStyle: { color: ['#3b82f6', '#22c55e', '#f59e0b'][['countdown', 'stopwatch', 'pomodoro'].indexOf(k)] || accent } })),
      label: { color: subColor, fontSize: 12 }
    }]
  };

  const weekdayDistOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 16, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, name: '分钟', axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(k => stats.weekdayDist[k] || 0), itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  const itemTypeOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie' as const, radius: ['40%', '70%'],
      data: Object.entries(stats.itemTypeDist).map(([k, v]) => ({ name: k, value: v, itemStyle: { color: ['#3b82f6', '#f59e0b', '#22c55e', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4'][Object.keys(stats.itemTypeDist).indexOf(k) % 9] } })),
      label: { color: subColor, fontSize: 11 }
    }]
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #8b5cf6, #7c3aed 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><CalendarOutlined /> 成长月报</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>{now.format('YYYY年M月')} 成长报告</Typography.Title>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.6)', fontSize: 13 }}>截至今日第 {stats.daysInMonth} 天</Typography.Text>
          </div>
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportMarkdown} style={{ borderRadius: 12, background: '#fff', color: '#0f172a', border: 'none' }}>导出 Markdown</Button>
        </div>
      </Card>

      {(!items?.length && !sessions?.length && !habits?.length && !diaries?.length) && (
        <Empty text="暂无成长数据" subtext="开始记录后会自动展示" />
      )}

      {(items?.length || sessions?.length || habits?.length || diaries?.length) && (
        <>
      {/* 综合得分 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, textAlign: 'center' }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>本月成长得分</Typography.Title>
        <Progress type="circle" percent={stats.totalScore} size={140} strokeColor={accent} format={p => <span style={{ fontSize: 32, fontWeight: 800, color: accent }}>{p}</span>} />
        <div style={{ marginTop: 12, color: subColor, fontSize: 13 }}>
          事项 {stats.itemScore} + 专注 {stats.focusScore} + 习惯 {stats.habitScore} + 日记 {stats.diaryScore}
        </div>
      </Card>

      {/* 核心指标 + 环比 */}
      <Row gutter={[16, 16]}>
        {[
          { label: '完成事项', value: stats.doneThisMonth, change: stats.itemChange, icon: <CheckCircleOutlined />, color: '#22c55e' },
          { label: '专注(分钟)', value: stats.focusMinThis, change: stats.focusChange, icon: <FireOutlined />, color: '#f59e0b' },
          { label: '习惯完成率', value: `${stats.habitRate}%`, change: stats.habitChange, icon: <TrophyOutlined />, color: '#8b5cf6' },
          { label: '日记篇数', value: stats.diaryThis, change: stats.diaryChange, icon: <BookOutlined />, color: '#ec4899' },
        ].map(m => (
          <Col xs={12} lg={6} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 17 }}>{m.icon}</div>
                <span style={{ color: subColor, fontSize: 12 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 12, color: changeColor(m.change), marginTop: 4 }}>{changeText(m.change)} 环比上月</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 每日专注分布 */}
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>每日专注分布</Typography.Title>
            <ReactECharts option={dailyOption} style={{ height: 260 }} />
          </Card>
        </Col>
        {/* 维度得分雷达 */}
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>维度得分雷达</Typography.Title>
            <ReactECharts option={radarOption} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>

      {/* 目标进度 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><AimOutlined /> 目标进度</Typography.Title>
        <Row gutter={[16, 16]}>
          <Col xs={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>{stats.activeGoals}</div>
              <div style={{ color: subColor, fontSize: 12 }}>进行中</div>
            </div>
          </Col>
          <Col xs={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{stats.completedGoals}</div>
              <div style={{ color: subColor, fontSize: 12 }}>本月完成</div>
            </div>
          </Col>
          <Col xs={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress type="circle" percent={stats.goalMilestonesTotal > 0 ? Math.round(stats.goalMilestonesDone / stats.goalMilestonesTotal * 100) : 0} size={60} strokeColor="#f59e0b" />
              <div style={{ color: subColor, fontSize: 12, marginTop: 4 }}>里程碑 {stats.goalMilestonesDone}/{stats.goalMilestonesTotal}</div>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 6 个月得分趋势</Typography.Title>
            <ReactECharts option={monthlyTrendOption} style={{ height: 260 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>本月习惯每周打卡</Typography.Title>
            <ReactECharts option={habitWeekOption} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>专注模式分布</Typography.Title>
            {Object.keys(stats.focusModeDist).length > 0 ? (
              <ReactECharts option={focusModeOption} style={{ height: 240 }} />
            ) : <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无专注数据</div>}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>星期专注分布</Typography.Title>
            <ReactECharts option={weekdayDistOption} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>本月事项类型分布</Typography.Title>
            {Object.keys(stats.itemTypeDist).length > 0 ? (
              <ReactECharts option={itemTypeOption} style={{ height: 240 }} />
            ) : <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无事项数据</div>}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>本月 TOP 专注日</Typography.Title>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {stats.topFocusDays.length > 0 ? stats.topFocusDays.map((d, i) => (
                <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: isDark ? `${accent}10` : `${accent}08`, border: `1px solid ${accent}20` }}>
                  <span style={{ fontSize: 20 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: titleColor, fontWeight: 600 }}>{monthStart.format('MM')}月{d.date}日</div>
                    <div style={{ color: subColor, fontSize: 12 }}>{now.subtract(now.date() - parseInt(d.date), 'day').format('dddd')}</div>
                  </div>
                  <Tag color={accent} style={{ borderRadius: 6 }}>{d.minutes} 分钟</Tag>
                </div>
              )) : <div style={{ textAlign: 'center', color: subColor, padding: 40 }}>暂无专注记录</div>}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 本月亮点 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><CrownOutlined /> 本月亮点</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            stats.focusDays >= 20 && { label: '专注达人', desc: `本月已专注 ${stats.focusDays} 天`, color: '#f59e0b', icon: <FireOutlined /> },
            stats.doneThisMonth >= 30 && { label: '事项达人', desc: `本月完成 ${stats.doneThisMonth} 项`, color: '#22c55e', icon: <CheckCircleOutlined /> },
            stats.habitRate >= 80 && { label: '习惯之星', desc: `习惯完成率 ${stats.habitRate}%`, color: '#8b5cf6', icon: <TrophyOutlined /> },
            stats.diaryThis >= 20 && { label: '日记达人', desc: `本月写了 ${stats.diaryThis} 篇`, color: '#ec4899', icon: <BookOutlined /> },
            stats.focusMinThis >= 1000 && { label: '千分专注', desc: `累计 ${stats.focusMinThis} 分钟`, color: '#3b82f6', icon: <ThunderboltOutlined /> },
            stats.totalScore >= 80 && { label: '全能学霸', desc: `综合得分 ${stats.totalScore}`, color: accent, icon: <CrownOutlined /> },
          ].filter(Boolean).map((b: any) => (
            <Col xs={12} sm={8} key={b.label}>
              <div style={{ borderRadius: 16, padding: 16, textAlign: 'center', background: isDark ? `${b.color}14` : `${b.color}0f`, border: `1px solid ${b.color}22` }}>
                <div style={{ fontSize: 28, color: b.color, marginBottom: 6 }}>{b.icon}</div>
                <div style={{ fontWeight: 700, color: titleColor, fontSize: 14 }}>{b.label}</div>
                <div style={{ color: subColor, fontSize: 12, marginTop: 4 }}>{b.desc}</div>
              </div>
            </Col>
          ))}
          {[stats.focusDays >= 20, stats.doneThisMonth >= 30, stats.habitRate >= 80, stats.diaryThis >= 20, stats.focusMinThis >= 1000, stats.totalScore >= 80].filter(Boolean).length === 0 && (
            <Col span={24}><div style={{ textAlign: 'center', color: subColor, padding: 20 }}>继续努力，各项成就正在解锁中...</div></Col>
          )}
        </Row>
      </Card>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '成长仪表盘', icon: <RiseOutlined />, color: '#ec4899', path: ROUTES.GROWTH },
            { label: '报告中心', icon: <BarChartOutlined />, color: '#3b82f6', path: ROUTES.REPORTS },
            { label: '成就中心', icon: <TrophyOutlined />, color: '#f59e0b', path: ROUTES.ACHIEVEMENTS },
            { label: '周复盘', icon: <CalendarOutlined />, color: '#22c55e', path: ROUTES.WEEKLY_REVIEW },
            { label: '数据总览', icon: <DashboardOutlined />, color: '#3b82f6', path: ROUTES.DATA_OVERVIEW },
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
      </>
      )}
    </Space>
  );
}
