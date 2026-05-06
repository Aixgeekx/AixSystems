// 年度回顾 - 全年多维数据聚合与趋势对比
import React, { useMemo, useState } from 'react';
import { Button, Card, Col, Row, Space, Statistic, Tag, Typography } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, FireOutlined, TrophyOutlined, BookOutlined, AimOutlined, CrownOutlined, RiseOutlined, BarChartOutlined, DashboardOutlined, GoldOutlined, SwapOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';
import Empty from '@/components/Empty';

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
    const pys = dayjs().year(year - 1).startOf('year').valueOf();
    const pye = dayjs().year(year - 1).endOf('year').valueOf();
    const allItems = (items || []).filter(i => i.createdAt >= ys && i.createdAt <= ye);
    const allSessions = (sessions || []).filter(s => s.startTime >= ys && s.startTime <= ye);
    const allDiaries = (diaries || []).filter(d => d.date >= ys && d.date <= ye);
    const allLogs = (habitLogs || []).filter(l => l.date >= ys && l.date <= ye);
    const allGoals = (goals || []).filter(g => g.createdAt >= ys && g.createdAt <= ye);
    const prevItems = (items || []).filter(i => i.createdAt >= pys && i.createdAt <= pye);
    const prevSessions = (sessions || []).filter(s => s.startTime >= pys && s.startTime <= pye);
    const prevDiaries = (diaries || []).filter(d => d.date >= pys && d.date <= pye);
    const prevLogs = (habitLogs || []).filter(l => l.date >= pys && l.date <= pye);

    const doneItems = allItems.filter(i => i.completeStatus === 'done').length;
    const overdueItems = allItems.filter(i => i.endTime && dayjs(i.endTime).isBefore(dayjs(), 'day') && i.completeStatus !== 'done').length;
    const totalFocusMin = Math.round(allSessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const focusDays = new Set(allSessions.map(s => dayjs(s.startTime).format('YYYYMMDD'))).size;
    const habitDays = new Set(allLogs.map(l => dayjs(l.date).format('YYYYMMDD'))).size;
    const activeGoals = allGoals.filter(g => g.status === 'active').length;
    const completedGoals = allGoals.filter(g => g.status === 'completed').length;
    const totalMilestones = allGoals.reduce((s, g) => s + (g.milestones?.length || 0), 0);
    const doneMilestones = allGoals.reduce((s, g) => s + (g.milestones?.filter(m => m.done).length || 0), 0);

    const prevDone = prevItems.filter(i => i.completeStatus === 'done').length;
    const prevFocusMin = Math.round(prevSessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const prevHabitDays = new Set(prevLogs.map(l => dayjs(l.date).format('YYYYMMDD'))).size;
    const prevDiariesCount = prevDiaries.length;

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

    // 专注模式分布
    const focusModeDist: Record<string, number> = {};
    allSessions.forEach(s => { focusModeDist[s.mode] = (focusModeDist[s.mode] || 0) + 1; });

    // 星期分布
    const weekdayDist: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    allSessions.forEach(s => { const wd = dayjs(s.startTime).format('ddd'); weekdayDist[wd] = (weekdayDist[wd] || 0) + Math.round((s.actualMs || 0) / 60000); });

    // 季度汇总
    const quarters = [
      { label: 'Q1', months: [0, 1, 2], icon: '🌸' },
      { label: 'Q2', months: [3, 4, 5], icon: '🌿' },
      { label: 'Q3', months: [6, 7, 8], icon: '☀️' },
      { label: 'Q4', months: [9, 10, 11], icon: '❄️' }
    ].map(q => {
      const ms = q.months.map(m => monthly[m]);
      return {
        label: q.label,
        icon: q.icon,
        focus: ms.reduce((s, m) => s + m.focus, 0),
        items: ms.reduce((s, m) => s + m.items, 0),
        done: ms.reduce((s, m) => s + m.done, 0),
        diaries: ms.reduce((s, m) => s + m.diaries, 0),
        habits: ms.reduce((s, m) => s + m.habits, 0)
      };
    });

    // TOP月排名
    const topMonths = [...monthly].filter(m => m.focus > 0).sort((a, b) => b.focus - a.focus).slice(0, 3);

    // 事项类型分布
    const itemTypeDist: Record<string, number> = {};
    allItems.forEach(i => { const t = i.type || '未分类'; itemTypeDist[t] = (itemTypeDist[t] || 0) + 1; });

    // 每年专注天数 vs 上年
    const yearlyFocusDays = focusDays;
    const prevFocusDays = new Set(prevSessions.map(s => dayjs(s.startTime).format('YYYYMMDD'))).size;

    const totalHabits = (habits || []).length;
    const habitRate = totalHabits > 0 ? Math.round(habitDays / (totalHabits * 365) * 100) : 0;
    const moodMap: Record<string, number> = {};
    allDiaries.forEach(d => { if (d.mood) moodMap[d.mood] = (moodMap[d.mood] || 0) + 1; });
    const topMood = Object.entries(moodMap).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return { totalItems: allItems.length, doneItems, overdueItems, totalFocusMin, focusDays: yearlyFocusDays, habitDays, totalDiaries: allDiaries.length, activeGoals, completedGoals, totalMilestones, doneMilestones, monthly, habitRate, topMood, totalSessions: allSessions.length, prevDone, prevFocusMin, prevHabitDays, prevDiariesCount, focusModeDist, weekdayDist, quarters, topMonths, itemTypeDist, prevFocusDays };
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
    grid: { top: 16, right: 12, bottom: 24, left: 36 },
    xAxis: { type: 'category' as const, data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, name: '分钟', axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(k => stats.weekdayDist[k] || 0), itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  const quarterOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['专注(分)', '完成事项'], textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 12, bottom: 24, left: 40 },
    xAxis: { type: 'category' as const, data: stats.quarters.map(q => `${q.icon} ${q.label}`), axisLabel: { color: subColor, fontSize: 12 } },
    yAxis: [
      { type: 'value' as const, name: '分钟', axisLabel: { color: subColor, fontSize: 10 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
      { type: 'value' as const, name: '事项', axisLabel: { color: subColor, fontSize: 10 }, splitLine: { show: false } }
    ],
    series: [
      { name: '专注(分)', type: 'bar' as const, data: stats.quarters.map(q => q.focus), itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' },
      { name: '完成事项', type: 'bar' as const, data: stats.quarters.map(q => q.done), itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' }
    ]
  };

  const itemTypeOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie' as const, radius: ['40%', '70%'],
      data: Object.entries(stats.itemTypeDist).map(([k, v]) => ({ name: k, value: v, itemStyle: { color: ['#3b82f6', '#f59e0b', '#22c55e', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4'][Object.keys(stats.itemTypeDist).indexOf(k) % 9] } })),
      label: { color: subColor, fontSize: 11 }
    }]
  };

  const bestMonth = stats.monthly.reduce((best, m) => m.focus > best.focus ? m : best, stats.monthly[0]);

  const diffPct = (now: number, prev: number) => prev === 0 ? (now > 0 ? 100 : 0) : Math.round((now - prev) / prev * 100);
  const diffTag = (label: string, now: number, prev: number, unit: string) => {
    if (year >= dayjs().year()) return null;
    const pct = diffPct(now, prev);
    const color = pct > 0 ? '#22c55e' : pct < 0 ? '#ef4444' : '#94a3b8';
    return <Tag color={color} style={{ marginLeft: 8, fontSize: 11 }}>较上年 {pct > 0 ? '+' : ''}{pct}% {unit}</Tag>;
  };

  const handleExport = () => {
    const lines = [
      `# ${year} 年度数据复盘`,
      '',
      `> 导出时间: ${dayjs().format('YYYY-MM-DD HH:mm')}`,
      '',
      '## 全年核心指标',
      '',
      `- 事项总数: ${stats.totalItems} (完成 ${stats.doneItems})`,
      `- 专注时长: ${stats.totalFocusMin} 分钟 (${stats.focusDays} 天)`,
      `- 习惯打卡: ${stats.habitDays} 次 (打卡率 ${stats.habitRate}%)`,
      `- 日记篇数: ${stats.totalDiaries} (主导情绪: ${stats.topMood})`,
      `- 目标进度: ${stats.doneMilestones}/${stats.totalMilestones} 里程碑 (${stats.completedGoals} 完成)`,
      '',
      '## 月度趋势',
      '',
      '| 月份 | 事项 | 完成 | 专注(分) | 习惯 | 日记 | 完成率 |',
      '|------|------|------|----------|------|------|--------|',
      ...stats.monthly.map(m =>
        `| ${m.month} | ${m.items} | ${m.done} | ${m.focus} | ${m.habits} | ${m.diaries} | ${m.items > 0 ? Math.round(m.done / m.items * 100) : 0}% |`
      ),
      '',
      '## 年度总结',
      '',
      `最高产月份: ${bestMonth?.month || '-'} (专注 ${bestMonth?.focus || 0} 分钟)`,
      stats.totalFocusMin > 3000 ? '今年保持了相当高的专注投入，继续保持！' : '专注时长还有提升空间，建议每天固定一段深度专注时间。',
      '',
      '---',
      '由 AixSystems 自动生成',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AixSystems-${year}-年度复盘.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasData = stats.totalItems > 0 || stats.totalFocusMin > 0 || stats.totalDiaries > 0 || stats.totalMilestones > 0;

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
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><CalendarOutlined /> 年度回顾</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>{year} 年度数据复盘</Typography.Title>
          </div>
          {hasData && <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport} style={{ background: '#fff', color: '#0f172a', borderRadius: 20 }}>导出 Markdown</Button>}
        </div>
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

      {!hasData ? (
        <Empty text="暂无年度数据" subtext="选择其他年份或开始记录吧" />
      ) : (
        <>
          {/* 核心指标 */}
          <Row gutter={[16, 16]}>
            <Col xs={12} lg={8}>
              <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <Statistic title={<span style={{ color: subColor, fontSize: 12 }}>全年事项</span>} value={stats.totalItems} suffix={<span style={{ color: subColor, fontSize: 12, marginLeft: 6 }}>完成 {stats.doneItems}</span>}
                    valueStyle={{ color: '#3b82f6', fontSize: 22, fontWeight: 800 }} prefix={<span style={{ color: '#3b82f6', marginRight: 6 }}><CheckCircleOutlined /></span>} />
                </div>
                {diffTag('事项', stats.doneItems, stats.prevDone, '事项完成')}
              </Card>
            </Col>
            <Col xs={12} lg={8}>
              <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <Statistic title={<span style={{ color: subColor, fontSize: 12 }}>全年专注</span>} value={`${stats.totalFocusMin}分`} suffix={<span style={{ color: subColor, fontSize: 12, marginLeft: 6 }}>{stats.focusDays} 天</span>}
                    valueStyle={{ color: '#f59e0b', fontSize: 22, fontWeight: 800 }} prefix={<span style={{ color: '#f59e0b', marginRight: 6 }}><FireOutlined /></span>} />
                </div>
                {diffTag('专注', stats.totalFocusMin, stats.prevFocusMin, '专注分钟')}
              </Card>
            </Col>
            <Col xs={12} lg={8}>
              <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <Statistic title={<span style={{ color: subColor, fontSize: 12 }}>习惯打卡</span>} value={stats.habitDays} suffix={<span style={{ color: subColor, fontSize: 12, marginLeft: 6 }}>率 {stats.habitRate}%</span>}
                    valueStyle={{ color: '#22c55e', fontSize: 22, fontWeight: 800 }} prefix={<span style={{ color: '#22c55e', marginRight: 6 }}><TrophyOutlined /></span>} />
                </div>
                {diffTag('习惯', stats.habitDays, stats.prevHabitDays, '打卡天数')}
              </Card>
            </Col>
            <Col xs={12} lg={8}>
              <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                  <Statistic title={<span style={{ color: subColor, fontSize: 12 }}>日记篇数</span>} value={stats.totalDiaries} suffix={<span style={{ color: subColor, fontSize: 12, marginLeft: 6 }}>主导情绪 {stats.topMood}</span>}
                    valueStyle={{ color: '#ec4899', fontSize: 22, fontWeight: 800 }} prefix={<span style={{ color: '#ec4899', marginRight: 6 }}><BookOutlined /></span>} />
                </div>
                {diffTag('日记', stats.totalDiaries, stats.prevDiariesCount, '篇数')}
              </Card>
            </Col>
            <Col xs={12} lg={8}>
              <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
                <Statistic title={<span style={{ color: subColor, fontSize: 12 }}>目标进度</span>} value={`${stats.doneMilestones}/${stats.totalMilestones}`} suffix={<span style={{ color: subColor, fontSize: 12, marginLeft: 6 }}>{stats.completedGoals} 完成</span>}
                  valueStyle={{ color: '#8b5cf6', fontSize: 22, fontWeight: 800 }} prefix={<span style={{ color: '#8b5cf6', marginRight: 6 }}><AimOutlined /></span>} />
              </Card>
            </Col>
            <Col xs={12} lg={8}>
              <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
                <Statistic title={<span style={{ color: subColor, fontSize: 12 }}>最高产月</span>} value={bestMonth?.month || '-'} suffix={<span style={{ color: subColor, fontSize: 12, marginLeft: 6 }}>{bestMonth?.focus || 0} 分</span>}
                  valueStyle={{ color: '#14b8a6', fontSize: 22, fontWeight: 800 }} prefix={<span style={{ color: '#14b8a6', marginRight: 6 }}><CrownOutlined /></span>} />
              </Card>
            </Col>
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

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
                <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>季度专注对比</Typography.Title>
                <ReactECharts option={quarterOption} style={{ height: 240 }} />
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
                <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>专注模式分布</Typography.Title>
                {Object.keys(stats.focusModeDist).length > 0 ? (
                  <ReactECharts option={focusModeOption} style={{ height: 240 }} />
                ) : <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无专注数据</div>}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
                <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>TOP 专注月</Typography.Title>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {stats.topMonths.length > 0 ? stats.topMonths.map((m, i) => (
                    <div key={m.month} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: isDark ? `${accent}10` : `${accent}08`, border: `1px solid ${accent}20` }}>
                      <span style={{ fontSize: 20 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: titleColor, fontWeight: 600 }}>{year}年 {m.month}</div>
                        <div style={{ color: subColor, fontSize: 12 }}>{m.done} 项完成 · {m.diaries} 篇日记</div>
                      </div>
                      <Tag color="#f59e0b" style={{ borderRadius: 6 }}>{m.focus} 分钟</Tag>
                    </div>
                  )) : <div style={{ textAlign: 'center', color: subColor, padding: 40 }}>暂无数据</div>}
                </Space>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
                <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>事项类型分布</Typography.Title>
                {Object.keys(stats.itemTypeDist).length > 0 ? (
                  <ReactECharts option={itemTypeOption} style={{ height: 240 }} />
                ) : <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无事项数据</div>}
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
                <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>年度专注天数</Typography.Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ fontSize: 52, fontWeight: 900, color: accent }}>{stats.focusDays}</div>
                  <div>
                    <div style={{ color: titleColor, fontSize: 18, fontWeight: 700 }}>天有专注记录</div>
                    {year < dayjs().year() && (
                      <div style={{ color: stats.focusDays > stats.prevFocusDays ? '#22c55e' : '#ef4444', fontSize: 13 }}>
                        {stats.focusDays > stats.prevFocusDays ? `+${stats.focusDays - stats.prevFocusDays}` : stats.focusDays < stats.prevFocusDays ? `${stats.focusDays - stats.prevFocusDays}` : '0'} 天较上年
                      </div>
                    )}
                  </div>
                </div>
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
        </>
      )}
    </Space>
  );
}
