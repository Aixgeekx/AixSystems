// 专注统计详情 - 深度专注数据分析
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Statistic, Typography, Tag } from 'antd';
import { BarChartOutlined, ClockCircleOutlined, FireOutlined, StarOutlined, ThunderboltOutlined, TrophyOutlined, CrownOutlined, LineChartOutlined, AimOutlined, HeartOutlined, DashboardOutlined, GoldOutlined, SwapOutlined, CalendarOutlined, RocketOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

export default function FocusStatsPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const sessions = useLiveQuery(() => db.focusSessions.orderBy('startTime').reverse().toArray(), []);

  const now = dayjs();
  const weekStart = now.startOf('week').valueOf();
  const monthStart = now.startOf('month').valueOf();
  const lastWeekStart = now.subtract(1, 'week').startOf('week').valueOf();
  const lastWeekEnd = weekStart - 1;
  const lastMonthStart = now.subtract(1, 'month').startOf('month').valueOf();
  const lastMonthEnd = monthStart - 1;
  const todayStart = now.startOf('day').valueOf();
  const yesterdayStart = now.subtract(1, 'day').startOf('day').valueOf();
  const yesterdayEnd = todayStart - 1;

  const stats = useMemo(() => {
    const all = sessions || [];
    const thisWeek = all.filter(s => s.startTime >= weekStart);
    const thisMonth = all.filter(s => s.startTime >= monthStart);
    const lastWeek = all.filter(s => s.startTime >= lastWeekStart && s.startTime <= lastWeekEnd);
    const lastMonth = all.filter(s => s.startTime >= lastMonthStart && s.startTime <= lastMonthEnd);
    const today = all.filter(s => s.startTime >= todayStart);
    const yesterday = all.filter(s => s.startTime >= yesterdayStart && s.startTime <= yesterdayEnd);

    const totalMin = Math.round(all.reduce((s, v) => s + v.actualMs / 60_000, 0));
    const weekMin = Math.round(thisWeek.reduce((s, v) => s + v.actualMs / 60_000, 0));
    const monthMin = Math.round(thisMonth.reduce((s, v) => s + v.actualMs / 60_000, 0));
    const lastWeekMin = Math.round(lastWeek.reduce((s, v) => s + v.actualMs / 60_000, 0));
    const lastMonthMin = Math.round(lastMonth.reduce((s, v) => s + v.actualMs / 60_000, 0));
    const todayMin = Math.round(today.reduce((s, v) => s + v.actualMs / 60_000, 0));
    const yesterdayMin = Math.round(yesterday.reduce((s, v) => s + v.actualMs / 60_000, 0));

    const avgMin = all.length ? Math.round(totalMin / all.length) : 0;
    const strictRate = all.length ? Math.round(all.filter(s => s.strictMode).length / all.length * 100) : 0;
    const giveUpRate = all.length ? Math.round(all.filter(s => s.giveUp).length / all.length * 100) : 0;

    // 最佳时段
    const hourMap = Array(24).fill(0);
    all.forEach(s => hourMap[dayjs(s.startTime).hour()] += s.actualMs / 60_000);
    const bestHour = hourMap.indexOf(Math.max(...hourMap));

    // 模式分布
    const modes = { countdown: 0, stopwatch: 0, pomodoro: 0 };
    all.forEach(s => modes[s.mode as keyof typeof modes]++);

    // 周同比 / 月同比 / 日同比
    const weekGrowth = lastWeekMin > 0 ? Math.round((weekMin - lastWeekMin) / lastWeekMin * 100) : weekMin > 0 ? 100 : 0;
    const monthGrowth = lastMonthMin > 0 ? Math.round((monthMin - lastMonthMin) / lastMonthMin * 100) : monthMin > 0 ? 100 : 0;
    const dayGrowth = yesterdayMin > 0 ? Math.round((todayMin - yesterdayMin) / yesterdayMin * 100) : todayMin > 0 ? 100 : 0;

    // 周几专注分布（0=周日）
    const weekdayMap = Array(7).fill(0);
    all.forEach(s => weekdayMap[dayjs(s.startTime).day()] += s.actualMs / 60_000);
    const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    // 单次专注时长分桶（分钟）
    const buckets = { '0-15': 0, '15-30': 0, '30-60': 0, '60+': 0 };
    all.forEach(s => {
      const m = s.actualMs / 60_000;
      if (m < 15) buckets['0-15']++;
      else if (m < 30) buckets['15-30']++;
      else if (m < 60) buckets['30-60']++;
      else buckets['60+']++;
    });

    // 连续专注天数 streak
    const daySet = new Set(all.map(s => dayjs(s.startTime).format('YYYY-MM-DD')));
    const sortedDays = Array.from(daySet).sort();
    let streak = 0;
    for (let i = sortedDays.length - 1; i >= 0; i--) {
      const d = dayjs(sortedDays[i]);
      if (i === sortedDays.length - 1 || d.add(1, 'day').format('YYYY-MM-DD') === sortedDays[i + 1]) streak++;
      else break;
    }

    // 最高单次专注时长
    const maxSingleMin = all.length ? Math.round(Math.max(...all.map(s => s.actualMs / 60_000))) : 0;

    // 时段偏好标签
    const morningMin = all.filter(s => { const h = dayjs(s.startTime).hour(); return h >= 5 && h < 12; }).reduce((s, v) => s + v.actualMs / 60_000, 0);
    const nightMin = all.filter(s => { const h = dayjs(s.startTime).hour(); return h >= 20 || h < 2; }).reduce((s, v) => s + v.actualMs / 60_000, 0);
    const timeTag = nightMin > morningMin ? '夜猫子' : morningMin > 0 ? '早鸟' : '暂无偏好';

    // TOP 3 专注日
    const dayMap: Record<string, number> = {};
    all.forEach(s => { const d = dayjs(s.startTime).format('YYYY-MM-DD'); dayMap[d] = (dayMap[d] || 0) + s.actualMs / 60_000; });
    const topDays = Object.entries(dayMap).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([d, m]) => ({ date: d, minutes: Math.round(m), weekday: weekdayLabels[dayjs(d).day()] }));

    // 效率评分：完成率60% + 严格率30% + 长时段占比10%
    const longRate = all.length ? Math.round(all.filter(s => s.actualMs >= 60 * 60_000).length / all.length * 100) : 0;
    const efficiency = Math.round((100 - giveUpRate) * 0.6 + strictRate * 0.3 + longRate * 0.1);

    // 月度目标进度（目标 20h = 1200min）
    const monthGoal = 1200;
    const monthGoalPct = Math.min(100, Math.round(monthMin / monthGoal * 100));

    return { totalMin, weekMin, monthMin, avgMin, strictRate, giveUpRate, bestHour, modes, weekGrowth, monthGrowth, dayGrowth, total: all.length, weekCount: thisWeek.length, monthCount: thisMonth.length, weekdayMap, weekdayLabels, buckets, todayMin, yesterdayMin, streak, maxSingleMin, timeTag, topDays, efficiency, monthGoalPct };
  }, [sessions, weekStart, monthStart, lastWeekStart, lastWeekEnd, lastMonthStart, lastMonthEnd, todayStart, yesterdayStart, yesterdayEnd]);

  // 近7天每日时长
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) map[now.subtract(i, 'day').format('MM/DD')] = 0;
    (sessions || []).forEach(s => {
      if (s.startTime >= now.subtract(6, 'day').startOf('day').valueOf()) {
        map[dayjs(s.startTime).format('MM/DD')] = (map[dayjs(s.startTime).format('MM/DD')] || 0) + Math.round(s.actualMs / 60_000);
      }
    });
    return Object.entries(map);
  }, [sessions]);

  // 时段分布
  const hourData = useMemo(() => {
    const hours = Array(24).fill(0);
    (sessions || []).forEach(s => hours[dayjs(s.startTime).hour()] += Math.round(s.actualMs / 60_000));
    return hours;
  }, [sessions]);

  // 24小时热力图数据（近7天 × 24小时）
  const heatmapData = useMemo(() => {
    const data: [number, number, number][] = [];
    const days = 7;
    for (let d = 0; d < days; d++) {
      const day = now.subtract(days - 1 - d, 'day');
      for (let h = 0; h < 24; h++) {
        const min = (sessions || []).filter(s => {
          const t = dayjs(s.startTime);
          return t.isSame(day, 'day') && t.hour() === h;
        }).reduce((s, v) => s + v.actualMs / 60_000, 0);
        data.push([d, h, Math.round(min)]);
      }
    }
    return { data, days, yLabels: Array.from({ length: 24 }, (_, i) => `${i}时`), xLabels: Array.from({ length: days }, (_, i) => now.subtract(days - 1 - i, 'day').format('MM/DD')) };
  }, [sessions]);

  // 近6个月专注时长趋势
  const monthlyFocusData = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const m = now.subtract(i, 'month');
      const start = m.startOf('month').valueOf();
      const end = m.endOf('month').valueOf();
      const min = (sessions || []).filter(s => s.startTime >= start && s.startTime <= end).reduce((s, v) => s + v.actualMs / 60_000, 0);
      map[m.format('YYYY-MM')] = Math.round(min);
    }
    return Object.entries(map).map(([k, v]) => ({ month: `${Number(k.slice(5))}月`, value: v }));
  }, [sessions]);

  // 时段分布环形图
  const periodData = useMemo(() => {
    const periods = [
      { name: '凌晨(0-6)', range: [0, 6], color: '#6366f1' },
      { name: '上午(6-12)', range: [6, 12], color: '#3b82f6' },
      { name: '下午(12-18)', range: [12, 18], color: '#f59e0b' },
      { name: '晚上(18-24)', range: [18, 24], color: '#ec4899' }
    ];
    return periods.map(p => ({
      name: p.name,
      value: Math.round((sessions || []).filter(s => {
        const h = dayjs(s.startTime).hour();
        return h >= p.range[0] && h < p.range[1];
      }).reduce((s, v) => s + v.actualMs / 60_000, 0)),
      itemStyle: { color: p.color }
    }));
  }, [sessions]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const pctColor = (v: number) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : '#94a3b8';

  const dailyOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: dailyData.map(d => d[0]), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: dailyData.map(d => d[1]), itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  const hourOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: Array.from({ length: 24 }, (_, i) => `${i}时`), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: hourData, smooth: true, areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent } }]
  };

  const modeOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie', radius: ['42%', '70%'],
      data: [
        { name: '倒计时', value: stats.modes.countdown, itemStyle: { color: '#3b82f6' } },
        { name: '正计时', value: stats.modes.stopwatch, itemStyle: { color: '#22c55e' } },
        { name: '番茄钟', value: stats.modes.pomodoro, itemStyle: { color: '#f59e0b' } }
      ],
      label: { color: subColor, fontSize: 12 }
    }]
  };

  const heatmapOption = {
    tooltip: { position: 'top' as const },
    grid: { top: 10, right: 16, bottom: 28, left: 48 },
    xAxis: { type: 'category' as const, data: heatmapData.xLabels, axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'category' as const, data: heatmapData.yLabels, axisLabel: { color: subColor, fontSize: 10 } },
    visualMap: {
      min: 0, max: Math.max(1, ...heatmapData.data.map(v => v[2])),
      calculable: true,
      orient: 'horizontal' as const, left: 'center', bottom: 0,
      inRange: { color: isDark ? ['rgba(255,255,255,0.04)', accent] : ['#f1f5f9', accent] },
      textStyle: { color: subColor }
    },
    series: [{
      type: 'heatmap' as const,
      data: heatmapData.data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } }
    }]
  };

  const monthlyOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: monthlyFocusData.map(d => d.month), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: monthlyFocusData.map(d => d.value), smooth: true, areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent } }]
  };

  const periodOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie' as const, radius: ['40%', '70%'],
      data: periodData,
      label: { color: subColor, fontSize: 12 }
    }]
  };

  const weekdayOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: stats.weekdayLabels, axisLabel: { color: subColor, fontSize: 12 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.weekdayMap.map(v => Math.round(v)), itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  const bucketsOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: ['<15分钟', '15-30分', '30-60分', '60+分'], axisLabel: { color: subColor, fontSize: 12 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: [stats.buckets['0-15'], stats.buckets['15-30'], stats.buckets['30-60'], stats.buckets['60+']], itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #f59e0b, #d97706 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><BarChartOutlined /> 专注统计</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>深度专注分析</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>累计专注 {stats.totalMin} 分钟 · {stats.total} 次 · 效率评分 {stats.efficiency} 分</Typography.Text>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '总专注时长', value: `${Math.floor(stats.totalMin / 60)}h${stats.totalMin % 60}m`, icon: <ClockCircleOutlined />, color: '#3b82f6' },
          { label: '今日专注', value: `${stats.todayMin}分`, sub: <span style={{ color: pctColor(stats.dayGrowth), fontSize: 11 }}>{stats.dayGrowth > 0 ? '+' : ''}{stats.dayGrowth}%</span>, icon: <CalendarOutlined />, color: '#ec4899' },
          { label: '本周时长', value: `${stats.weekMin}分`, sub: <span style={{ color: pctColor(stats.weekGrowth), fontSize: 11 }}>{stats.weekGrowth > 0 ? '+' : ''}{stats.weekGrowth}%</span>, icon: <FireOutlined />, color: '#f59e0b' },
          { label: '本月时长', value: `${stats.monthMin}分`, sub: <span style={{ color: pctColor(stats.monthGrowth), fontSize: 11 }}>{stats.monthGrowth > 0 ? '+' : ''}{stats.monthGrowth}%</span>, icon: <BarChartOutlined />, color: '#22c55e' },
          { label: '平均时长', value: `${stats.avgMin}分`, icon: <StarOutlined />, color: '#8b5cf6' },
          { label: '最佳时段', value: `${stats.bestHour}:00`, icon: <TrophyOutlined />, color: '#14b8a6' }
        ].map(m => (
          <Col xs={12} lg={4} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 15 }}>{m.icon}</div>
                <span style={{ color: subColor, fontSize: 11 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
              {m.sub && <div style={{ marginTop: 2 }}>{m.sub}</div>}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 7 天专注时长</Typography.Title>
            <ReactECharts option={dailyOption} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>专注模式分布</Typography.Title>
            <ReactECharts option={modeOption} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>时段能量曲线</Typography.Title>
        <ReactECharts option={hourOption} style={{ height: 200 }} />
      </Card>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>24小时专注热力图</Typography.Title>
        <ReactECharts option={heatmapOption} style={{ height: 320 }} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>周几专注分布</Typography.Title>
            <ReactECharts option={weekdayOption} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>专注时长分布</Typography.Title>
            <ReactECharts option={bucketsOption} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 6 个月专注时长趋势</Typography.Title>
            <ReactECharts option={monthlyOption} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>时段分布</Typography.Title>
            <ReactECharts option={periodOption} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>

      {/* 新增：进阶数据卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f59e0b18', display: 'grid', placeItems: 'center', color: '#f59e0b' }}><RocketOutlined /></div>
              <span style={{ color: subColor, fontSize: 11 }}>连续专注天数</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b' }}>{stats.streak}<span style={{ fontSize: 12, color: subColor, marginLeft: 4 }}>天</span></div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ec489918', display: 'grid', placeItems: 'center', color: '#ec4899' }}><GoldOutlined /></div>
              <span style={{ color: subColor, fontSize: 11 }}>最高单次专注</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#ec4899' }}>{stats.maxSingleMin}<span style={{ fontSize: 12, color: subColor, marginLeft: 4 }}>分</span></div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#3b82f618', display: 'grid', placeItems: 'center', color: '#3b82f6' }}><SafetyCertificateOutlined /></div>
              <span style={{ color: subColor, fontSize: 11 }}>效率评分</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#3b82f6' }}>{stats.efficiency}<span style={{ fontSize: 12, color: subColor, marginLeft: 4 }}>分</span></div>
            <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{stats.efficiency >= 80 ? '优秀' : stats.efficiency >= 60 ? '良好' : '加油'}</div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#14b8a618', display: 'grid', placeItems: 'center', color: '#14b8a6' }}><CalendarOutlined /></div>
              <span style={{ color: subColor, fontSize: 11 }}>时段偏好</span>
            </div>
            <Tag color={stats.timeTag === '夜猫子' ? 'purple' : stats.timeTag === '早鸟' ? 'blue' : 'default'}>{stats.timeTag}</Tag>
          </Card>
        </Col>
      </Row>

      {/* 本月目标进度 */}
      <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: titleColor, fontWeight: 600 }}><RocketOutlined style={{ color: '#f59e0b', marginRight: 8 }} />本月目标进度</span>
          <span style={{ color: subColor, fontSize: 12 }}>{stats.monthMin} / 1200 分钟</span>
        </div>
        <Progress percent={stats.monthGoalPct} strokeColor={stats.monthGoalPct >= 100 ? '#22c55e' : accent} showInfo={false} />
        <div style={{ color: subColor, fontSize: 11, marginTop: 4, textAlign: 'right' }}>目标 20 小时 · 已完成 {stats.monthGoalPct}%</div>
      </Card>

      {/* TOP 3 专注日 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>TOP 3 专注日</Typography.Title>
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

      <Row gutter={[16, 16]}>
        <Col xs={12}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, textAlign: 'center' }}>
            <Progress type="circle" percent={100 - stats.giveUpRate} strokeColor="#22c55e" format={() => `${100 - stats.giveUpRate}%`} />
            <div style={{ color: subColor, fontSize: 12, marginTop: 8 }}>完成率</div>
          </Card>
        </Col>
        <Col xs={12}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, textAlign: 'center' }}>
            <Progress type="circle" percent={stats.strictRate} strokeColor="#f59e0b" format={() => `${stats.strictRate}%`} />
            <div style={{ color: subColor, fontSize: 12, marginTop: 8 }}>严格模式使用率</div>
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
    </Space>
  );
}
