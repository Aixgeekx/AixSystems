// 专注排行榜 - 专注时长排名与对比
import React, { useMemo } from 'react';
import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import { CrownOutlined, FireOutlined, TrophyOutlined, ThunderboltOutlined, BarChartOutlined, LineChartOutlined, AimOutlined, HeartOutlined, DashboardOutlined, GoldOutlined, SwapOutlined, ClockCircleOutlined, StarOutlined, RiseOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';
import Empty from '@/components/Empty';

const MODE_LABELS: Record<string, string> = { countdown: '倒计时', stopwatch: '正计时', pomodoro: '番茄钟' };
const MODE_COLORS: Record<string, string> = { countdown: '#3b82f6', stopwatch: '#22c55e', pomodoro: '#f59e0b' };

export default function FocusRankingPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const sessions = useLiveQuery(() => db.focusSessions.toArray(), []);

  const now = dayjs();
  const weekStart = now.startOf('week').valueOf();
  const lastWeekStart = now.subtract(1, 'week').startOf('week').valueOf();
  const lastWeekEnd = weekStart - 1;

  const stats = useMemo(() => {
    const all = sessions || [];

    // 按天排名
    const dayMap: Record<string, number> = {};
    all.forEach(s => { dayMap[dayjs(s.startTime).format('YYYY-MM-DD')] = (dayMap[dayjs(s.startTime).format('YYYY-MM-DD')] || 0) + Math.round(s.actualMs / 60_000); });
    const dailyRanking = Object.entries(dayMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // 按周排名
    const weekMap: Record<string, number> = {};
    all.forEach(s => { weekMap[dayjs(s.startTime).startOf('week').format('YYYY-MM-DD')] = (weekMap[dayjs(s.startTime).startOf('week').format('YYYY-MM-DD')] || 0) + Math.round(s.actualMs / 60_000); });
    const weeklyRanking = Object.entries(weekMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

    // 按模式排名
    const modeMap: Record<string, number> = {};
    all.forEach(s => { modeMap[s.mode] = (modeMap[s.mode] || 0) + Math.round(s.actualMs / 60_000); });
    const modeRanking = Object.entries(modeMap).sort((a, b) => b[1] - a[1]);

    // 每种模式的日 TOP 排名
    const modeDailyTop: Record<string, [string, number][]> = {};
    ['countdown', 'stopwatch', 'pomodoro'].forEach(mode => {
      const m: Record<string, number> = {};
      all.filter(s => s.mode === mode).forEach(s => { m[dayjs(s.startTime).format('YYYY-MM-DD')] = (m[dayjs(s.startTime).format('YYYY-MM-DD')] || 0) + Math.round(s.actualMs / 60_000); });
      modeDailyTop[mode] = Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5);
    });

    // 按小时排名
    const hours = Array(24).fill(0);
    all.forEach(s => hours[dayjs(s.startTime).hour()] += Math.round(s.actualMs / 60_000));
    const hourRanking = hours.map((v, i) => [`${i}:00`, v] as [string, number]).sort((a, b) => b[1] - a[1]).slice(0, 6);

    // 近30天专注趋势
    const trend30: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) trend30[now.subtract(i, 'day').format('MM/DD')] = 0;
    all.forEach(s => {
      if (s.startTime >= now.subtract(29, 'day').startOf('day').valueOf()) {
        trend30[dayjs(s.startTime).format('MM/DD')] = (trend30[dayjs(s.startTime).format('MM/DD')] || 0) + Math.round(s.actualMs / 60_000);
      }
    });
    const trend30Data = Object.entries(trend30);

    // 连续专注天数
    let streak = 0;
    let d = now.startOf('day');
    while (true) {
      const key = d.format('YYYY-MM-DD');
      const has = all.some(s => dayjs(s.startTime).format('YYYY-MM-DD') === key);
      if (has) { streak++; d = d.subtract(1, 'day'); } else break;
    }

    // 月度分布
    const monthlyDist = [];
    for (let i = 5; i >= 0; i--) {
      const m = now.subtract(i, 'month');
      const key = m.format('YYYY-MM');
      const min = all.filter(s => dayjs(s.startTime).format('YYYY-MM') === key).reduce((s, f) => s + f.actualMs / 60000, 0);
      monthlyDist.push({ label: `${Number(key.slice(5))}月`, value: Math.round(min) });
    }

    // 最佳单次专注 TOP 10
    const sessionTop10 = all.slice().sort((a, b) => b.actualMs - a.actualMs).slice(0, 10).map(s => ({
      date: dayjs(s.startTime).format('MM/DD HH:mm'), min: Math.round(s.actualMs / 60000), mode: s.mode
    }));

    // 本周 vs 上周
    const thisWeekMin = Math.round(all.filter(s => s.startTime >= weekStart).reduce((s, v) => s + v.actualMs / 60_000, 0));
    const lastWeekMin = Math.round(all.filter(s => s.startTime >= lastWeekStart && s.startTime <= lastWeekEnd).reduce((s, v) => s + v.actualMs / 60_000, 0));
    const weekGrowth = lastWeekMin > 0 ? Math.round((thisWeekMin - lastWeekMin) / lastWeekMin * 100) : thisWeekMin > 0 ? 100 : 0;

    // 效率评分
    const strictRate = all.length ? Math.round(all.filter(s => s.strictMode).length / all.length * 100) : 0;
    const giveUpRate = all.length ? Math.round(all.filter(s => s.giveUp).length / all.length * 100) : 0;
    const longRate = all.length ? Math.round(all.filter(s => s.actualMs >= 60 * 60_000).length / all.length * 100) : 0;
    const efficiency = Math.round((100 - giveUpRate) * 0.6 + strictRate * 0.3 + longRate * 0.1);

    // 时段偏好
    const morningMin = all.filter(s => { const h = dayjs(s.startTime).hour(); return h >= 5 && h < 12; }).reduce((s, v) => s + v.actualMs / 60_000, 0);
    const nightMin = all.filter(s => { const h = dayjs(s.startTime).hour(); return h >= 20 || h < 2; }).reduce((s, v) => s + v.actualMs / 60_000, 0);
    const timeTag = nightMin > morningMin ? '夜猫子' : morningMin > 0 ? '早鸟' : '暂无偏好';

    // 专注天数分布（近30天哪天专注过）
    const activeDays30 = new Set(all.filter(s => s.startTime >= now.subtract(29, 'day').startOf('day').valueOf()).map(s => dayjs(s.startTime).format('MM/DD'))).size;

    return { dailyRanking, weeklyRanking, modeRanking, modeDailyTop, hourRanking, trend30Data, streak, monthlyDist, sessionTop10, totalSessions: all.length, totalFocusMin: Math.round(all.reduce((s, v) => s + v.actualMs / 60_000, 0)), avgFocusMin: all.length ? Math.round(all.reduce((s, v) => s + v.actualMs / 60_000, 0) / all.length) : 0, thisWeekMin, lastWeekMin, weekGrowth, efficiency, timeTag, activeDays30 };
  }, [sessions, weekStart, lastWeekStart, lastWeekEnd]);

  const totalSessions = stats.totalSessions;
  const totalFocusMin = stats.totalFocusMin;
  const avgFocusMin = stats.avgFocusMin;
  const focusStreak = stats.streak;
  const dailyRanking = stats.dailyRanking;
  const weeklyRanking = stats.weeklyRanking;
  const modeRanking = stats.modeRanking;
  const modeDailyTop = stats.modeDailyTop;
  const hourRanking = stats.hourRanking;
  const trend30Data = stats.trend30Data;
  const monthlyDist = stats.monthlyDist;
  const sessionTop10 = stats.sessionTop10;
  const medalColors = ['#f59e0b', '#94a3b8', '#cd7f32'];
  const medalEmoji = ['🥇', '🥈', '🥉'];

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const dailyChartOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: dailyRanking.map(d => d[0].slice(5)), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: dailyRanking.map((d, i) => ({ value: d[1], itemStyle: { color: i < 3 ? medalColors[i] : accent, borderRadius: [4, 4, 0, 0] } })), barWidth: '60%' }]
  };

  const weeklyChartOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: weeklyRanking.map(d => d[0].slice(5)), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: weeklyRanking.map((d, i) => ({ value: d[1], itemStyle: { color: i < 3 ? medalColors[i] : accent, borderRadius: [4, 4, 0, 0] } })), barWidth: '55%' }]
  };

  const trend30Option = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: trend30Data.map(d => d[0]), axisLabel: { color: subColor, fontSize: 10, interval: 4 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: trend30Data.map(d => d[1]), smooth: true, areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent } }]
  };

  const monthlyDistOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: monthlyDist.map(m => m.label), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: monthlyDist.map(m => m.value), itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  const modePieOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie' as const, radius: ['40%', '70%'],
      data: modeRanking.map(([mode, min]) => ({ name: MODE_LABELS[mode], value: min, itemStyle: { color: MODE_COLORS[mode] } })),
      label: { color: subColor, fontSize: 12 }
    }]
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #f59e0b, #d97706 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><CrownOutlined /> 专注排行榜</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>专注时长排名</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>效率评分 {stats.efficiency} 分 · 时段偏好：{stats.timeTag} · 近30天活跃 {stats.activeDays30} 天</Typography.Text>
      </Card>

      {(!sessions || sessions.length === 0) && (
        <Empty text="暂无专注数据" subtext="开始记录后会自动展示" />
      )}

      {(sessions && sessions.length > 0) && (
        <>
      {/* 核心指标 */}
      <Row gutter={[16, 16]}>
        {[
          { label: '总专注次数', value: totalSessions, icon: <ThunderboltOutlined />, color: '#f59e0b' },
          { label: '总时长(分钟)', value: totalFocusMin, icon: <ClockCircleOutlined />, color: '#3b82f6' },
          { label: '平均时长(分钟)', value: avgFocusMin, icon: <BarChartOutlined />, color: '#22c55e' },
          { label: '连续专注(天)', value: focusStreak, icon: <FireOutlined />, color: '#ec4899' }
        ].map(m => (
          <Col xs={12} lg={6} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 17 }}>{m.icon}</div>
                <span style={{ color: subColor, fontSize: 13 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 本周 vs 上周 + 效率评分 + 活跃度 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={8}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f59e0b18', display: 'grid', placeItems: 'center', color: '#f59e0b' }}><RiseOutlined /></div>
              <span style={{ color: subColor, fontSize: 11 }}>本周 vs 上周</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#f59e0b' }}>{stats.thisWeekMin}<span style={{ fontSize: 12, color: subColor, marginLeft: 4 }}>分</span></div>
            <div style={{ fontSize: 11, color: stats.weekGrowth >= 0 ? '#22c55e' : '#ef4444', marginTop: 2 }}>{stats.weekGrowth >= 0 ? '+' : ''}{stats.weekGrowth}%</div>
          </Card>
        </Col>
        <Col xs={12} lg={8}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#3b82f618', display: 'grid', placeItems: 'center', color: '#3b82f6' }}><SafetyCertificateOutlined /></div>
              <span style={{ color: subColor, fontSize: 11 }}>效率评分</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#3b82f6' }}>{stats.efficiency}<span style={{ fontSize: 12, color: subColor, marginLeft: 4 }}>分</span></div>
            <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{stats.efficiency >= 80 ? '优秀' : stats.efficiency >= 60 ? '良好' : '加油'}</div>
          </Card>
        </Col>
        <Col xs={12} lg={8}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#22c55e18', display: 'grid', placeItems: 'center', color: '#22c55e' }}><StarOutlined /></div>
              <span style={{ color: subColor, fontSize: 11 }}>近30天活跃天数</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#22c55e' }}>{stats.activeDays30}<span style={{ fontSize: 12, color: subColor, marginLeft: 4 }}>天</span></div>
            <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>共30天</div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><TrophyOutlined /> 日专注 TOP 10</Typography.Title>
            <ReactECharts option={dailyChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><FireOutlined /> 周专注 TOP 8</Typography.Title>
            <ReactECharts option={weeklyChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><ThunderboltOutlined /> 模式时长排名</Typography.Title>
            {modeRanking.map(([mode, min], i) => (
              <div key={mode} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{medalEmoji[i] || `${i + 1}`}</span>
                <Tag style={{ borderRadius: 999, fontSize: 12, background: `${MODE_COLORS[mode]}18`, border: `1px solid ${MODE_COLORS[mode]}44`, color: MODE_COLORS[mode] }}>{MODE_LABELS[mode]}</Tag>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                    <div style={{ height: '100%', width: `${Math.round(min / (modeRanking[0]?.[1] || 1) * 100)}%`, borderRadius: 4, background: MODE_COLORS[mode], transition: 'width 0.5s' }} />
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: titleColor, minWidth: 50, textAlign: 'right' }}>{min}分</span>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><CrownOutlined /> 最佳专注时段</Typography.Title>
            {hourRanking.map(([hour, min], i) => (
              <div key={hour} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{medalEmoji[i] || `${i + 1}`}</span>
                <span style={{ fontWeight: 600, color: titleColor, minWidth: 50 }}>{hour}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                    <div style={{ height: '100%', width: `${Math.round(min / (hourRanking[0]?.[1] || 1) * 100)}%`, borderRadius: 4, background: accent, transition: 'width 0.5s' }} />
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: titleColor, minWidth: 50, textAlign: 'right' }}>{min}分</span>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* 近30天趋势 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 30 天专注趋势</Typography.Title>
        <ReactECharts option={trend30Option} style={{ height: 260 }} />
      </Card>

      {/* 月度分布 + 模式占比 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><CrownOutlined /> 近 6 月月度专注</Typography.Title>
            <ReactECharts option={monthlyDistOption} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>专注模式占比</Typography.Title>
            <ReactECharts option={modePieOption} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>

      {/* 最佳单次 + 各模式日 TOP */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><TrophyOutlined /> 最佳单次专注 TOP 10</Typography.Title>
            {sessionTop10.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{medalEmoji[i] || `${i + 1}`}</span>
                <Tag style={{ borderRadius: 999, fontSize: 11, background: `${MODE_COLORS[s.mode]}18`, border: `1px solid ${MODE_COLORS[s.mode]}44`, color: MODE_COLORS[s.mode] }}>{MODE_LABELS[s.mode]}</Tag>
                <span style={{ color: subColor, fontSize: 12, minWidth: 80 }}>{s.date}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                    <div style={{ height: '100%', width: `${Math.round(s.min / (sessionTop10[0]?.min || 1) * 100)}%`, borderRadius: 3, background: accent, transition: 'width 0.5s' }} />
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: titleColor, minWidth: 40, textAlign: 'right', fontSize: 13 }}>{s.min}分</span>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><ThunderboltOutlined /> 模式日 TOP 5</Typography.Title>
            {(['countdown', 'stopwatch', 'pomodoro'] as const).map((mode, mi) => {
              const list = modeDailyTop[mode] || [];
              return (
                <div key={mode} style={{ marginBottom: mi < 2 ? 12 : 0 }}>
                  <div style={{ fontSize: 12, color: MODE_COLORS[mode], fontWeight: 600, marginBottom: 6 }}>{MODE_LABELS[mode]}</div>
                  {list.length === 0 && <div style={{ color: subColor, fontSize: 11, padding: '4px 0' }}>暂无数据</div>}
                  {list.map(([date, min], i) => (
                    <div key={date} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                      <span style={{ fontSize: 12, width: 20, textAlign: 'center', color: subColor }}>{medalEmoji[i] || i + 1}</span>
                      <span style={{ fontSize: 12, color: subColor, minWidth: 60 }}>{date.slice(5)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: 5, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                          <div style={{ height: '100%', width: `${Math.round(min / (list[0]?.[1] || 1) * 100)}%`, borderRadius: 2, background: MODE_COLORS[mode] }} />
                        </div>
                      </div>
                      <span style={{ fontWeight: 600, color: titleColor, minWidth: 35, textAlign: 'right', fontSize: 12 }}>{min}分</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注统计详情', icon: <BarChartOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_STATS },
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
      </>
      )}
    </Space>
  );
}
