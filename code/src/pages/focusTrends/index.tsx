// 专注趋势 - 专注时间趋势可视化与能量分析
import React, { useMemo, useState } from 'react';
import { Card, Col, Radio, Row, Space, Tag, Typography } from 'antd';
import { ClockCircleOutlined, FireOutlined, LineChartOutlined, RiseOutlined, CrownOutlined, BarChartOutlined, AimOutlined, HeartOutlined, CalendarOutlined, DashboardOutlined, GoldOutlined, SwapOutlined, ThunderboltOutlined, StarOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';
import Empty from '@/components/Empty';

const MODE_LABELS: Record<string, string> = { countdown: '倒计时', stopwatch: '正计时', pomodoro: '番茄钟' };

export default function FocusTrendsPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [range, setRange] = useState<'7' | '14' | '30'>('14');

  const sessions = useLiveQuery(() => db.focusSessions.toArray(), []);
  const now = dayjs();

  const stats = useMemo(() => {
    const days = Number(range);
    const all = sessions || [];
    const data: { date: string; minutes: number; count: number }[] = [];
    let totalMin = 0, totalCount = 0, prevTotalMin = 0;
    let bestDay = { date: '-', minutes: 0 };

    for (let i = days - 1; i >= 0; i--) {
      const d = now.subtract(i, 'day').startOf('day');
      const dayEnd = d.endOf('day');
      const daySessions = all.filter(s => s.startTime >= d.valueOf() && s.startTime <= dayEnd.valueOf());
      const mins = Math.round(daySessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      data.push({ date: d.format('MM/DD'), minutes: mins, count: daySessions.length });
      totalMin += mins;
      totalCount += daySessions.length;
      if (mins > bestDay.minutes) bestDay = { date: d.format('MM/DD'), minutes: mins };
    }

    // 上期对比
    const prevStart = now.subtract(days * 2, 'day').startOf('day');
    const prevEnd = now.subtract(days, 'day').endOf('day');
    const prevSessions = all.filter(s => s.startTime >= prevStart.valueOf() && s.startTime <= prevEnd.valueOf());
    prevTotalMin = Math.round(prevSessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);

    // 时段能量分布
    const hourMap = new Array(24).fill(0);
    all.forEach(s => { hourMap[dayjs(s.startTime).hour()] += (s.actualMs || 0) / 60000; });

    // 模式分布
    const modeMap: Record<string, number> = {};
    all.forEach(s => { modeMap[s.mode] = (modeMap[s.mode] || 0) + 1; });

    // 连续专注天数
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = now.subtract(i, 'day').startOf('day');
      const dayEnd = d.endOf('day');
      const hasSession = all.some(s => s.startTime >= d.valueOf() && s.startTime <= dayEnd.valueOf());
      if (hasSession) streak++; else break;
    }

    // 最长单次
    const longest = all.reduce((max, s) => Math.max(max, (s.actualMs || 0) / 60000), 0);

    // 完成率
    const allCount = all.length;
    const giveUpCount = all.filter(s => s.giveUp).length;
    const completionRate = allCount > 0 ? Math.round((allCount - giveUpCount) / allCount * 100) : 0;

    // 时段偏好标签
    const morningMin = all.filter(s => { const h = dayjs(s.startTime).hour(); return h >= 5 && h < 12; }).reduce((s, v) => s + (v.actualMs || 0) / 60000, 0);
    const noonMin = all.filter(s => { const h = dayjs(s.startTime).hour(); return h >= 12 && h < 14; }).reduce((s, v) => s + (v.actualMs || 0) / 60000, 0);
    const nightMin = all.filter(s => { const h = dayjs(s.startTime).hour(); return h >= 20 || h < 2; }).reduce((s, v) => s + (v.actualMs || 0) / 60000, 0);
    let timeTag = '暂无偏好';
    if (nightMin > morningMin && nightMin > noonMin) timeTag = '夜猫子';
    else if (morningMin > nightMin && morningMin > noonMin) timeTag = '早鸟';
    else if (noonMin >= morningMin && noonMin >= nightMin && noonMin > 0) timeTag = '午休派';

    // 月度对比（本月 vs 上月每日）
    const thisMonthDays: { date: string; thisMonth: number; lastMonth: number }[] = [];
    const monthDayCount = now.daysInMonth();
    const lastMonth = now.subtract(1, 'month');
    const lastMonthDays = lastMonth.daysInMonth();
    for (let i = 1; i <= Math.min(monthDayCount, lastMonthDays); i++) {
      const thisDay = now.startOf('month').add(i - 1, 'day');
      const lastDay = lastMonth.startOf('month').add(i - 1, 'day');
      const thisMin = Math.round(all.filter(s => dayjs(s.startTime).isSame(thisDay, 'day')).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      const lastMin = Math.round(all.filter(s => dayjs(s.startTime).isSame(lastDay, 'day')).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      thisMonthDays.push({ date: `${i}日`, thisMonth: thisMin, lastMonth: lastMin });
    }

    // 每日效率趋势（在选中的日期范围内）
    const efficiencyData: { date: string; rate: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = now.subtract(i, 'day').startOf('day');
      const dayEnd = d.endOf('day');
      const daySess = all.filter(s => s.startTime >= d.valueOf() && s.startTime <= dayEnd.valueOf());
      const rate = daySess.length > 0 ? Math.round((daySess.length - daySess.filter(s => s.giveUp).length) / daySess.length * 100) : 0;
      efficiencyData.push({ date: d.format('MM/DD'), rate });
    }

    // TOP 3 最佳专注日（全历史）
    const dayMap: Record<string, number> = {};
    all.forEach(s => { const d = dayjs(s.startTime).format('YYYY-MM-DD'); dayMap[d] = (dayMap[d] || 0) + (s.actualMs || 0) / 60000; });
    const topDays = Object.entries(dayMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d, m]) => ({ date: d, minutes: Math.round(m), weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dayjs(d).day()] }));

    // 专注稳定性评分（变异系数逆序）
    const dayMins = Object.values(dayMap);
    const avgDayMin = dayMins.length > 0 ? dayMins.reduce((s, v) => s + v, 0) / dayMins.length : 0;
    const variance = dayMins.length > 0 ? dayMins.reduce((s, v) => s + Math.pow(v - avgDayMin, 2), 0) / dayMins.length : 0;
    const cv = avgDayMin > 0 ? Math.sqrt(variance) / avgDayMin : 0;
    const stability = Math.max(0, Math.min(100, Math.round(100 - cv * 100)));

    return { data, totalMin, totalCount, prevTotalMin, hourMap, modeMap, streak, longest, avgDay: days > 0 ? Math.round(totalMin / days) : 0, bestDay, completionRate, timeTag, thisMonthDays, efficiencyData, topDays, stability };
  }, [sessions, range]);

  const diffColor = stats.totalMin >= stats.prevTotalMin ? '#22c55e' : '#ef4444';
  const diffText = `${stats.totalMin - stats.prevTotalMin > 0 ? '+' : ''}${stats.totalMin - stats.prevTotalMin}分`;
  const diffPct = stats.prevTotalMin > 0 ? Math.round((stats.totalMin - stats.prevTotalMin) / stats.prevTotalMin * 100) : 0;
  const diffPctText = `${diffPct > 0 ? '+' : ''}${diffPct}%`;

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const trendOption = {
    tooltip: { trigger: 'axis' as const, formatter: (params: any) => `${params[0].name}<br/>${params[0].value} 分钟` },
    grid: { top: 16, right: 12, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: stats.data.map(d => d.date), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{
      type: 'line', data: stats.data.map(d => d.minutes), smooth: true, connectNulls: true,
      areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent },
      markLine: { data: [{ type: 'average' as const, name: '均值', label: { color: subColor, fontSize: 10 } }], lineStyle: { color: '#f59e0b66', type: 'dashed' as const } }
    }]
  };

  const hourOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 16, right: 12, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: Array.from({ length: 24 }, (_, i) => `${i}时`), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.hourMap.map(v => Math.round(v)), itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '50%' }]
  };

  const peakHour = stats.hourMap.indexOf(Math.max(...stats.hourMap));

  // 近3周每周总时长
  const weeklyCompareData = useMemo(() => {
    const weeks: { label: string; min: number }[] = [];
    for (let w = 2; w >= 0; w--) {
      const start = now.subtract(w * 7, 'day').startOf('week');
      const end = start.endOf('week');
      const min = Math.round((sessions || []).filter(s => s.startTime >= start.valueOf() && s.startTime <= end.valueOf()).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      weeks.push({ label: `第${3 - w}周`, min });
    }
    return weeks;
  }, [sessions]);

  // 周几专注分布（近30天）
  const weekdayDist = useMemo(() => {
    const map = Array(7).fill(0);
    const cutoff = now.subtract(29, 'day').startOf('day').valueOf();
    (sessions || []).filter(s => s.startTime >= cutoff).forEach(s => { map[dayjs(s.startTime).day()] += (s.actualMs || 0) / 60000; });
    return { labels: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'], values: map.map(v => Math.round(v)) };
  }, [sessions]);

  const weeklyCompareOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: weeklyCompareData.map(w => w.label), axisLabel: { color: subColor, fontSize: 12 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: weeklyCompareData.map(w => w.min), itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  const weekdayDistOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 16, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: weekdayDist.labels, axisLabel: { color: subColor, fontSize: 12 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: weekdayDist.values, itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  // 本月 vs 上月对比
  const monthCompareOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['本月', '上月'], textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: stats.thisMonthDays.map(d => d.date), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [
      { name: '本月', type: 'bar', data: stats.thisMonthDays.map(d => d.thisMonth), itemStyle: { color: accent, borderRadius: [3, 3, 0, 0] }, barWidth: '35%' },
      { name: '上月', type: 'bar', data: stats.thisMonthDays.map(d => d.lastMonth), itemStyle: { color: '#94a3b8', borderRadius: [3, 3, 0, 0] }, barWidth: '35%' }
    ]
  };

  // 每日效率趋势
  const efficiencyOption = {
    tooltip: { trigger: 'axis' as const, formatter: (params: any) => `${params[0].name}<br/>完成率 ${params[0].value}%` },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: stats.efficiencyData.map(d => d.date), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, max: 100, axisLabel: { color: subColor, fontSize: 11, formatter: '{value}%' }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: stats.efficiencyData.map(d => d.rate), smooth: true, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' }, areaStyle: { color: '#22c55e22' } }]
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #3b82f6, #2563eb 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><LineChartOutlined /> 专注趋势</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>专注时间趋势分析</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>稳定性评分 {stats.stability} 分 · 偏好时段：{stats.timeTag}</Typography.Text>
      </Card>

      {(!sessions || sessions.length === 0) && (
        <Empty text="暂无专注数据" subtext="开始记录后会自动展示" />
      )}

      {(sessions && sessions.length > 0) && (
        <>
      <Radio.Group value={range} onChange={e => setRange(e.target.value)} style={{ alignSelf: 'flex-end' }}>
        <Radio.Button value="7">7 天</Radio.Button>
        <Radio.Button value="14">14 天</Radio.Button>
        <Radio.Button value="30">30 天</Radio.Button>
      </Radio.Group>

      {/* 核心指标 */}
      <Row gutter={[16, 16]}>
        {[
          { label: '总专注时长', value: `${stats.totalMin}分`, icon: <ClockCircleOutlined />, color: '#f59e0b', sub: `${diffText} (${diffPctText})`, subColor: diffColor },
          { label: '日均专注', value: `${stats.avgDay}分`, icon: <RiseOutlined />, color: '#3b82f6' },
          { label: '最长单次', value: `${Math.round(stats.longest)}分`, icon: <CrownOutlined />, color: '#8b5cf6' },
          { label: '完成率', value: `${stats.completionRate}%`, icon: <FireOutlined />, color: '#22c55e' }
        ].map(m => (
          <Col xs={12} lg={6} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 17 }}>{m.icon}</div>
                <span style={{ color: subColor, fontSize: 12 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
              {m.sub && <Tag style={{ borderRadius: 999, fontSize: 11, marginTop: 4, background: `${m.subColor}18`, border: `1px solid ${m.subColor}44`, color: m.subColor }}>{m.sub}</Tag>}
            </Card>
          </Col>
        ))}
      </Row>

      {/* 趋势图 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>专注时长趋势</Typography.Title>
        <ReactECharts option={trendOption} style={{ height: 280 }} />
      </Card>

      {/* 时段能量分布 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>
          时段能量分布
          <Tag style={{ marginLeft: 8, borderRadius: 999, fontSize: 11, background: '#f59e0b18', border: '1px solid #f59e0b44', color: '#f59e0b' }}>
            高能时段：{peakHour}:00
          </Tag>
        </Typography.Title>
        <ReactECharts option={hourOption} style={{ height: 220 }} />
      </Card>

      {/* 本月 vs 上月 + 每日效率趋势 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>本月 vs 上月每日专注对比</Typography.Title>
            <ReactECharts option={monthCompareOption} style={{ height: 260 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>每日完成率趋势</Typography.Title>
            <ReactECharts option={efficiencyOption} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>

      {/* 模式分布 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>模式使用分布</Typography.Title>
        <Row gutter={[12, 12]}>
          {Object.entries(stats.modeMap).sort((a, b) => b[1] - a[1]).map(([mode, count]) => (
            <Col xs={8} key={mode}>
              <div style={{ borderRadius: 16, padding: 16, textAlign: 'center', background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>{count}</div>
                <div style={{ color: subColor, fontSize: 13, marginTop: 4 }}>{MODE_LABELS[mode] || mode}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 近3周对比 + 周几分布 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 3 周每周专注时长</Typography.Title>
            <ReactECharts option={weeklyCompareOption} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 30 天周几专注分布</Typography.Title>
            <ReactECharts option={weekdayDistOption} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>

      {/* TOP 3 专注日 + 稳定性 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>TOP 3 最佳专注日</Typography.Title>
            <Row gutter={[12, 12]}>
              {stats.topDays.map((d, i) => (
                <Col xs={8} key={d.date}>
                  <Card bordered={false} style={{ borderRadius: 16, background: isDark ? `${['#f59e0b', '#94a3b8', '#b45309'][i]}14` : `${['#f59e0b', '#94a3b8', '#b45309'][i]}0f`, textAlign: 'center' }}>
                    <div style={{ fontSize: 24 }}>{['🥇', '🥈', '🥉'][i]}</div>
                    <div style={{ fontWeight: 700, color: titleColor, margin: '4px 0' }}>{d.date} {d.weekday}</div>
                    <div style={{ fontSize: 13, color: ['#f59e0b', '#94a3b8', '#b45309'][i] }}>{d.minutes} 分钟</div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, textAlign: 'center', height: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#3b82f618', display: 'grid', placeItems: 'center', color: '#3b82f6' }}><SafetyCertificateOutlined /></div>
            </div>
            <div style={{ fontSize: 13, color: subColor, marginBottom: 4 }}>专注稳定性评分</div>
            <div style={{ fontSize: 42, fontWeight: 800, color: stats.stability >= 80 ? '#22c55e' : stats.stability >= 50 ? '#f59e0b' : '#ef4444' }}>{stats.stability}</div>
            <div style={{ fontSize: 12, color: subColor, marginTop: 4 }}>{stats.stability >= 80 ? '非常稳定' : stats.stability >= 50 ? '波动较大' : '极不规律'}</div>
          </Card>
        </Col>
      </Row>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注排行榜', icon: <CrownOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_RANKING },
            { label: '习惯热力图', icon: <CalendarOutlined />, color: '#14b8a6', path: ROUTES.HABIT_HEATMAP },
            { label: '目标时间线', icon: <AimOutlined />, color: '#3b82f6', path: ROUTES.GOAL_TIMELINE },
            { label: '情绪趋势', icon: <HeartOutlined />, color: '#ec4899', path: ROUTES.DIARY_MOOD_TRENDS },
            { label: '专注模式对比', icon: <SwapOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_MODE_COMPARE },
            { label: '数据总览', icon: <DashboardOutlined />, color: '#3b82f6', path: ROUTES.DATA_OVERVIEW },
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
