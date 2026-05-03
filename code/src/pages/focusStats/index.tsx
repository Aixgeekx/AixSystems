// 专注统计详情 - 深度专注数据分析
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Statistic, Typography } from 'antd';
import { BarChartOutlined, ClockCircleOutlined, FireOutlined, StarOutlined, ThunderboltOutlined, TrophyOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

export default function FocusStatsPage() {
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

  const stats = useMemo(() => {
    const all = sessions || [];
    const thisWeek = all.filter(s => s.startTime >= weekStart);
    const thisMonth = all.filter(s => s.startTime >= monthStart);
    const lastWeek = all.filter(s => s.startTime >= lastWeekStart && s.startTime <= lastWeekEnd);
    const lastMonth = all.filter(s => s.startTime >= lastMonthStart && s.startTime <= lastMonthEnd);

    const totalMin = Math.round(all.reduce((s, v) => s + v.actualMs / 60_000, 0));
    const weekMin = Math.round(thisWeek.reduce((s, v) => s + v.actualMs / 60_000, 0));
    const monthMin = Math.round(thisMonth.reduce((s, v) => s + v.actualMs / 60_000, 0));
    const lastWeekMin = Math.round(lastWeek.reduce((s, v) => s + v.actualMs / 60_000, 0));
    const lastMonthMin = Math.round(lastMonth.reduce((s, v) => s + v.actualMs / 60_000, 0));

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

    // 周同比
    const weekGrowth = lastWeekMin > 0 ? Math.round((weekMin - lastWeekMin) / lastWeekMin * 100) : weekMin > 0 ? 100 : 0;
    const monthGrowth = lastMonthMin > 0 ? Math.round((monthMin - lastMonthMin) / lastMonthMin * 100) : monthMin > 0 ? 100 : 0;

    return { totalMin, weekMin, monthMin, avgMin, strictRate, giveUpRate, bestHour, modes, weekGrowth, monthGrowth, total: all.length, weekCount: thisWeek.length, monthCount: thisMonth.length };
  }, [sessions, weekStart, monthStart, lastWeekStart, lastWeekEnd, lastMonthStart, lastMonthEnd]);

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
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>累计专注 {stats.totalMin} 分钟 · {stats.total} 次</Typography.Text>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '总专注时长', value: `${Math.floor(stats.totalMin / 60)}h${stats.totalMin % 60}m`, icon: <ClockCircleOutlined />, color: '#3b82f6' },
          { label: '本周时长', value: `${stats.weekMin}分`, sub: <span style={{ color: pctColor(stats.weekGrowth), fontSize: 11 }}>{stats.weekGrowth > 0 ? '+' : ''}{stats.weekGrowth}%</span>, icon: <FireOutlined />, color: '#f59e0b' },
          { label: '本月时长', value: `${stats.monthMin}分`, sub: <span style={{ color: pctColor(stats.monthGrowth), fontSize: 11 }}>{stats.monthGrowth > 0 ? '+' : ''}{stats.monthGrowth}%</span>, icon: <BarChartOutlined />, color: '#22c55e' },
          { label: '平均时长', value: `${stats.avgMin}分`, icon: <StarOutlined />, color: '#8b5cf6' },
          { label: '严格模式率', value: `${stats.strictRate}%`, icon: <ThunderboltOutlined />, color: '#ec4899' },
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
    </Space>
  );
}
