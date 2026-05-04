// 习惯统计 - 习惯数据分析
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Typography } from 'antd';
import { BarChartOutlined, CalendarOutlined, CheckCircleOutlined, FireOutlined, TrophyOutlined, CrownOutlined, AimOutlined, HeartOutlined, LineChartOutlined, DashboardOutlined, GoldOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';
import Empty from '@/components/Empty';

export default function HabitStatsPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const habits = useLiveQuery(() => db.habits.filter(h => !h.deletedAt).toArray(), []);
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), []);

  const now = dayjs();
  const weekStart = now.startOf('week').valueOf();
  const monthStart = now.startOf('month').valueOf();

  const stats = useMemo(() => {
    const h = habits || [];
    const logs = habitLogs || [];
    const total = h.length;
    const totalCheckins = logs.length;
    const thisWeek = logs.filter(l => l.date >= weekStart).length;
    const thisMonth = logs.filter(l => l.date >= monthStart).length;

    // 每个习惯的打卡次数
    const perHabit: Record<string, number> = {};
    logs.forEach(l => { perHabit[l.habitId] = (perHabit[l.habitId] || 0) + l.count; });

    // 连续天数计算
    const getMaxStreak = (habitId: string) => {
      const habitLogs = logs.filter(l => l.habitId === habitId).map(l => dayjs(l.date).startOf('day').valueOf()).sort((a, b) => b - a);
      let max = 0, streak = 0, check = now.startOf('day');
      for (const d of habitLogs) {
        const dd = dayjs(d).startOf('day');
        if (dd.isSame(check, 'day')) { streak++; max = Math.max(max, streak); check = check.subtract(1, 'day'); }
        else if (dd.isSame(check.subtract(1, 'day'), 'day')) { streak++; max = Math.max(max, streak); check = dd; }
        else break;
      }
      return max;
    };

    const streaks = h.map(habit => ({ id: habit.id, name: habit.name, color: habit.color, streak: getMaxStreak(habit.id), total: perHabit[habit.id] || 0 }));
    const bestStreak = streaks.reduce((max, s) => s.streak > max.streak ? s : max, { streak: 0, name: '-', color: '#94a3b8', id: '', total: 0 });

    // 近7天每日打卡数
    const dailyData: [string, number][] = [];
    for (let i = 6; i >= 0; i--) {
      const d = now.subtract(i, 'day').startOf('day').valueOf();
      const count = logs.filter(l => l.date >= d && l.date < d + 86400000).length;
      dailyData.push([now.subtract(i, 'day').format('MM/DD'), count]);
    }

    // 习惯完成率
    const completionRates = h.map(habit => {
      const habitLogCount = logs.filter(l => l.habitId === habit.id).length;
      const daysSinceCreation = Math.max(1, now.diff(dayjs(habit.createdAt), 'day'));
      const expected = habit.frequency === 'daily' ? daysSinceCreation : habit.frequency === 'weekly' ? Math.ceil(daysSinceCreation / 7) : Math.ceil(daysSinceCreation / 30);
      return { name: habit.name, color: habit.color, rate: Math.min(100, Math.round(habitLogCount / expected * 100)) };
    });

    // 本月打卡热力图数据
    const daysInMonth = now.daysInMonth();
    const monthHeatmap: [string, number][] = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = now.date(i).startOf('day');
      const count = logs.filter(l => dayjs(l.date).isSame(d, 'day')).length;
      monthHeatmap.push([d.format('YYYY-MM-DD'), count]);
    }

    // 近7周完成率趋势
    const weeklyRateTrend: [string, number][] = [];
    for (let w = 6; w >= 0; w--) {
      const ws = now.subtract(w, 'week').startOf('week');
      const we = ws.endOf('week');
      const weekLogs = logs.filter(l => l.date >= ws.valueOf() && l.date <= we.valueOf());
      const weekCount = weekLogs.length;
      const weekExpected = h.reduce((s, habit) => {
        const daysSince = Math.max(1, ws.diff(dayjs(habit.createdAt), 'day') + 1);
        return s + (habit.frequency === 'daily' ? 7 : habit.frequency === 'weekly' ? 1 : Math.ceil(7 / 30));
      }, 0);
      weeklyRateTrend.push([ws.format('MM/DD'), weekExpected ? Math.min(100, Math.round(weekCount / weekExpected * 100)) : 0]);
    }

    // 打卡时段分布
    const hourMap = Array(24).fill(0);
    logs.forEach(l => hourMap[dayjs(l.date).hour()]++);
    const hourDistribution = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}时`, count: hourMap[i] }));

    // 习惯本月打卡排名
    const monthRanking = h.map(habit => {
      const count = logs.filter(l => l.habitId === habit.id && l.date >= monthStart).length;
      return { name: habit.name, color: habit.color, count };
    }).sort((a, b) => b.count - a.count);

    return { total, totalCheckins, thisWeek, thisMonth, streaks, bestStreak, dailyData, completionRates, monthHeatmap, weeklyRateTrend, hourDistribution, monthRanking };
  }, [habits, habitLogs, weekStart, monthStart]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const dailyOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: stats.dailyData.map(d => d[0]), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.dailyData.map(d => d[1]), itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  const streakOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 60, left: 36 },
    xAxis: { type: 'category' as const, data: stats.streaks.map(s => s.name), axisLabel: { color: subColor, fontSize: 10, rotate: 30 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.streaks.map(s => ({ value: s.streak, itemStyle: { color: s.color } })), barWidth: '50%' }]
  };

  const heatmapOption = {
    tooltip: { trigger: 'item' as const, formatter: (p: any) => `${p.data[0]}: ${p.data[1]} 次打卡` },
    visualMap: { min: 0, max: Math.max(1, ...stats.monthHeatmap.map(d => d[1])), show: false, inRange: { color: [isDark ? '#1e293b' : '#e2e8f0', '#22c55e'] } },
    calendar: { top: 20, left: 40, cellSize: ['auto', 20], range: now.format('YYYY-MM'), dayLabel: { color: subColor, fontSize: 10 }, monthLabel: { show: false }, itemStyle: { borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } },
    series: [{ type: 'heatmap', coordinateSystem: 'calendar', data: stats.monthHeatmap, itemStyle: { borderRadius: 3 } }]
  };

  const weeklyRateOption = {
    tooltip: { trigger: 'axis' as const, formatter: (p: any) => `${p[0].name}<br/>完成率: ${p[0].value}%` },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: stats.weeklyRateTrend.map(d => d[0]), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, max: 100, axisLabel: { color: subColor, fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: stats.weeklyRateTrend.map(d => d[1]), smooth: true, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#22c55e66' }, { offset: 1, color: '#22c55e11' }] } }, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' }, symbol: 'circle', symbolSize: 4 }]
  };

  const hourOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: stats.hourDistribution.map(d => d.hour), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.hourDistribution.map(d => d.count), itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '60%' }]
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #22c55e, #16a34a 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><BarChartOutlined /> 习惯统计</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>习惯数据分析</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>{stats.total} 个习惯 · {stats.totalCheckins} 次打卡</Typography.Text>
      </Card>

      {(!habits || habits.length === 0) && (
        <Empty text="暂无习惯数据" subtext="开始记录后会自动展示" />
      )}

      {(habits && habits.length > 0) && (
        <>
      <Row gutter={[16, 16]}>
        {[
          { label: '活跃习惯', value: stats.total, icon: <CheckCircleOutlined />, color: '#22c55e' },
          { label: '总打卡次数', value: stats.totalCheckins, icon: <FireOutlined />, color: '#f59e0b' },
          { label: '本周打卡', value: stats.thisWeek, icon: <CalendarOutlined />, color: '#3b82f6' },
          { label: '本月打卡', value: stats.thisMonth, icon: <BarChartOutlined />, color: '#8b5cf6' },
          { label: '最长连续', value: `${stats.bestStreak.streak}天`, icon: <TrophyOutlined />, color: '#ec4899' }
        ].map(m => (
          <Col xs={12} lg={5} key={m.label}>
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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 7 天打卡频率</Typography.Title>
            <ReactECharts option={dailyOption} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>各习惯连续天数</Typography.Title>
            <ReactECharts option={streakOption} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>习惯完成率</Typography.Title>
        <Row gutter={[12, 12]}>
          {stats.completionRates.map(r => (
            <Col xs={12} sm={8} md={6} key={r.name}>
              <div style={{ textAlign: 'center', padding: 12, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                <Progress type="circle" percent={r.rate} strokeColor={r.color} size={64} format={() => `${r.rate}%`} />
                <div style={{ color: titleColor, fontWeight: 600, fontSize: 12, marginTop: 8 }}>{r.name}</div>
              </div>
            </Col>
          ))}
          {stats.completionRates.length === 0 && <Col span={24}><div style={{ textAlign: 'center', color: subColor, padding: 30 }}>暂无习惯数据</div></Col>}
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>本月打卡热力图</Typography.Title>
        <ReactECharts option={heatmapOption} style={{ height: 200 }} />
      </Card>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 7 周完成率趋势</Typography.Title>
        <ReactECharts option={weeklyRateOption} style={{ height: 220 }} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>打卡时段分布</Typography.Title>
            <ReactECharts option={hourOption} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>本月习惯排名</Typography.Title>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              {stats.monthRanking.map((h, i) => (
                <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center', fontWeight: 700, color: ['#f59e0b', '#94a3b8', '#cd7f32'][i] || subColor }}>{i + 1}</span>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: h.color }} />
                  <span style={{ flex: 1, fontSize: 13, color: titleColor, fontWeight: 600 }}>{h.name}</span>
                  <div style={{ flex: 1, maxWidth: 120 }}>
                    <div style={{ height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, h.count / Math.max(1, stats.monthRanking[0].count) * 100)}%`, borderRadius: 3, background: h.color, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: titleColor, fontSize: 13, minWidth: 30, textAlign: 'right' }}>{h.count}</span>
                </div>
              ))}
              {stats.monthRanking.length === 0 && <div style={{ textAlign: 'center', color: subColor, padding: 20 }}>暂无数据</div>}
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
            { label: '目标时间线', icon: <AimOutlined />, color: '#3b82f6', path: ROUTES.GOAL_TIMELINE },
            { label: '情绪趋势', icon: <HeartOutlined />, color: '#ec4899', path: ROUTES.DIARY_MOOD_TRENDS },
            { label: '专注统计详情', icon: <LineChartOutlined />, color: '#22c55e', path: ROUTES.FOCUS_STATS },
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
