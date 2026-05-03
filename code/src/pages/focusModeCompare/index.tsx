// 专注模式对比 - countdown/stopwatch/pomodoro 效果分析
import React, { useMemo } from 'react';
import { Card, Col, Row, Space, Typography } from 'antd';
import { BarChartOutlined, ClockCircleOutlined, FireOutlined, ThunderboltOutlined, TrophyOutlined, BulbOutlined, LineChartOutlined, AimOutlined, UnorderedListOutlined, HeartOutlined, CalendarOutlined, CrownOutlined, RiseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

const MODE_LABELS: Record<string, string> = { countdown: '倒计时', stopwatch: '正计时', pomodoro: '番茄钟' };
const MODE_COLORS: Record<string, string> = { countdown: '#3b82f6', stopwatch: '#22c55e', pomodoro: '#f59e0b' };

export default function FocusModeComparePage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const sessions = useLiveQuery(() => db.focusSessions.toArray(), []);
  const now = dayjs();

  const stats = useMemo(() => {
    const all = sessions || [];
    const modes = ['countdown', 'stopwatch', 'pomodoro'] as const;
    const modeStats = modes.map(mode => {
      const ms = all.filter(s => s.mode === mode);
      const completed = ms.filter(s => !s.giveUp);
      const totalTime = completed.reduce((s, f) => s + (f.actualMs || 0), 0);
      const avgTime = completed.length > 0 ? Math.round(totalTime / completed.length) : 0;
      const strictCount = completed.filter(s => s.strictMode).length;
      const giveUpRate = ms.length > 0 ? Math.round((ms.length - completed.length) / ms.length * 100) : 0;
      const avgPlannedVsActual = completed.length > 0
        ? Math.round(completed.reduce((s, f) => s + (f.plannedMs > 0 ? f.actualMs / f.plannedMs * 100 : 100), 0) / completed.length)
        : 0;
      // 近7天每天数据
      const daily: { date: string; minutes: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = now.subtract(i, 'day').startOf('day');
        const de = d.endOf('day');
        const dayMs = completed.filter(s => s.startTime >= d.valueOf() && s.startTime <= de.valueOf());
        const mins = Math.round(dayMs.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
        daily.push({ date: d.format('MM/DD'), minutes: mins });
      }
      // 时段分布
      const hourMap: Record<number, number> = {};
      completed.forEach(s => { const h = dayjs(s.startTime).hour(); hourMap[h] = (hourMap[h] || 0) + (s.actualMs || 0); });
      return { mode, total: ms.length, completed: completed.length, totalTime, avgTime, strictCount, giveUpRate, avgPlannedVsActual, daily, hourMap };
    });
    return { modeStats, totalSessions: all.length };
  }, [sessions]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const barOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: stats.modeStats.map(m => MODE_LABELS[m.mode]), textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 12, bottom: 24, left: 36 },
    xAxis: { type: 'category' as const, data: stats.modeStats[0]?.daily.map(d => d.date) || [], axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, name: '分钟', axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: stats.modeStats.map(m => ({
      name: MODE_LABELS[m.mode], type: 'bar' as const, data: m.daily.map(d => d.minutes),
      itemStyle: { color: MODE_COLORS[m.mode], borderRadius: [4, 4, 0, 0] }, barWidth: '22%'
    }))
  };

  const radarOption = {
    radar: {
      indicator: [
        { name: '完成率', max: 100 }, { name: '平均时长', max: Math.max(...stats.modeStats.map(m => m.avgTime), 1) },
        { name: '严格模式率', max: 100 }, { name: '计划完成率', max: 120 },
        { name: '坚持率', max: 100 }
      ],
      axisName: { color: subColor, fontSize: 11 },
      splitArea: { areaStyle: { color: isDark ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] : ['#f8fafc', '#f1f5f9'] } }
    },
    legend: { data: stats.modeStats.map(m => MODE_LABELS[m.mode]), textStyle: { color: subColor, fontSize: 11 }, bottom: 0 },
    series: [{
      type: 'radar' as const,
      data: stats.modeStats.map(m => ({
        name: MODE_LABELS[m.mode],
        value: [
          m.total > 0 ? Math.round(m.completed / m.total * 100) : 0,
          m.avgTime / 60000,
          m.completed > 0 ? Math.round(m.strictCount / m.completed * 100) : 0,
          m.avgPlannedVsActual,
          100 - m.giveUpRate
        ],
        areaStyle: { color: `${MODE_COLORS[m.mode]}22` },
        lineStyle: { color: MODE_COLORS[m.mode] },
        itemStyle: { color: MODE_COLORS[m.mode] }
      }))
    }]
  };

  // 每模式近7天折线
  const lineOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: stats.modeStats.map(m => MODE_LABELS[m.mode]), textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 12, bottom: 24, left: 36 },
    xAxis: { type: 'category' as const, data: stats.modeStats[0]?.daily.map(d => d.date) || [], axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, name: '分钟', axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: stats.modeStats.map(m => ({
      name: MODE_LABELS[m.mode], type: 'line' as const, data: m.daily.map(d => d.minutes),
      smooth: true, lineStyle: { color: MODE_COLORS[m.mode], width: 2 }, itemStyle: { color: MODE_COLORS[m.mode] },
      areaStyle: { color: `${MODE_COLORS[m.mode]}18` }
    }))
  };

  // 每模式24小时能量分布
  const hourData = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
  const hourOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: stats.modeStats.map(m => MODE_LABELS[m.mode]), textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 12, bottom: 24, left: 40 },
    xAxis: { type: 'category' as const, data: hourData.map(h => `${h}时`), axisLabel: { color: subColor, fontSize: 10, interval: 2 } },
    yAxis: { type: 'value' as const, name: '分钟', axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: stats.modeStats.map(m => ({
      name: MODE_LABELS[m.mode], type: 'bar' as const,
      data: hourData.map(h => Math.round((m.hourMap[h] || 0) / 60000)),
      itemStyle: { color: MODE_COLORS[m.mode] }, barWidth: '20%'
    }))
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #f59e0b, #d97706 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><BarChartOutlined /> 专注模式对比</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>模式效果分析</Typography.Title>
      </Card>

      {/* 每模式核心指标 */}
      <Row gutter={[16, 16]}>
        {stats.modeStats.map(m => (
          <Col xs={24} md={8} key={m.mode}>
            <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: `2px solid ${MODE_COLORS[m.mode]}33`, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: `${MODE_COLORS[m.mode]}18`, display: 'grid', placeItems: 'center', color: MODE_COLORS[m.mode], fontSize: 20 }}>
                  {m.mode === 'countdown' ? <ClockCircleOutlined /> : m.mode === 'stopwatch' ? <ThunderboltOutlined /> : <FireOutlined />}
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: MODE_COLORS[m.mode] }}>{MODE_LABELS[m.mode]}</span>
              </div>
              <Row gutter={[8, 12]}>
                {[
                  { label: '总会话', value: m.total },
                  { label: '完成', value: m.completed },
                  { label: '总时长', value: `${Math.round(m.totalTime / 60000)}分` },
                  { label: '平均时长', value: `${Math.round(m.avgTime / 60000)}分` },
                  { label: '严格模式', value: `${m.completed > 0 ? Math.round(m.strictCount / m.completed * 100) : 0}%` },
                  { label: '放弃率', value: `${m.giveUpRate}%` },
                ].map(s => (
                  <Col span={8} key={s.label}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: titleColor }}>{s.value}</div>
                      <div style={{ fontSize: 11, color: subColor }}>{s.label}</div>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 近7天对比柱状 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 7 天模式对比</Typography.Title>
        <ReactECharts option={barOption} style={{ height: 280 }} />
      </Card>

      <Row gutter={[16, 16]}>
        {/* 雷达图 */}
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>综合能力雷达</Typography.Title>
            <ReactECharts option={radarOption} style={{ height: 320 }} />
          </Card>
        </Col>
        {/* 折线趋势 */}
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>趋势对比</Typography.Title>
            <ReactECharts option={lineOption} style={{ height: 320 }} />
          </Card>
        </Col>
      </Row>

      {/* 24小时能量分布 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>24 小时时段能量分布</Typography.Title>
        <ReactECharts option={hourOption} style={{ height: 260 }} />
      </Card>

      {/* 模式建议 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><BulbOutlined /> 模式使用建议</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { mode: 'countdown', tip: '适合有明确时长目标的任务，配合严格模式效果更佳' },
            { mode: 'stopwatch', tip: '适合需要灵活掌控节奏的深度工作，不设上限激发心流' },
            { mode: 'pomodoro', tip: '适合需要反复切换的短期任务，25分钟工作+5分钟休息保持高效' },
          ].map(t => (
            <Col xs={24} md={8} key={t.mode}>
              <div style={{ borderRadius: 16, padding: 16, background: isDark ? `${MODE_COLORS[t.mode]}14` : `${MODE_COLORS[t.mode]}0f`, border: `1px solid ${MODE_COLORS[t.mode]}22` }}>
                <div style={{ fontWeight: 600, color: MODE_COLORS[t.mode], marginBottom: 6 }}>{MODE_LABELS[t.mode]}</div>
                <div style={{ fontSize: 13, color: subColor, lineHeight: 1.6 }}>{t.tip}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注统计', icon: <BarChartOutlined />, color: '#3b82f6', path: ROUTES.FOCUS_STATS },
            { label: '专注趋势', icon: <LineChartOutlined />, color: '#22c55e', path: ROUTES.FOCUS_TRENDS },
            { label: '专注排行榜', icon: <TrophyOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_RANKING },
            { label: '成长仪表盘', icon: <RiseOutlined />, color: '#ec4899', path: ROUTES.GROWTH },
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
