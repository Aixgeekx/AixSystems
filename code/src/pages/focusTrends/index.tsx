// 专注趋势 - 专注时间趋势可视化与能量分析
import React, { useMemo, useState } from 'react';
import { Card, Col, Radio, Row, Space, Tag, Typography } from 'antd';
import { ClockCircleOutlined, FireOutlined, LineChartOutlined, RiseOutlined, CrownOutlined, BarChartOutlined, AimOutlined, HeartOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

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
    const data: { date: string; minutes: number; count: number }[] = [];
    let totalMin = 0, totalCount = 0, prevTotalMin = 0;

    for (let i = days - 1; i >= 0; i--) {
      const d = now.subtract(i, 'day').startOf('day');
      const dayEnd = d.endOf('day');
      const daySessions = (sessions || []).filter(s => s.startTime >= d.valueOf() && s.startTime <= dayEnd.valueOf());
      const mins = Math.round(daySessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      data.push({ date: d.format('MM/DD'), minutes: mins, count: daySessions.length });
      totalMin += mins;
      totalCount += daySessions.length;
    }

    // 上期对比
    const prevStart = now.subtract(days * 2, 'day').startOf('day');
    const prevEnd = now.subtract(days, 'day').endOf('day');
    const prevSessions = (sessions || []).filter(s => s.startTime >= prevStart.valueOf() && s.startTime <= prevEnd.valueOf());
    prevTotalMin = Math.round(prevSessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);

    // 时段能量分布
    const hourMap = new Array(24).fill(0);
    (sessions || []).forEach(s => {
      const h = dayjs(s.startTime).hour();
      hourMap[h] += (s.actualMs || 0) / 60000;
    });

    // 模式分布
    const modeMap: Record<string, number> = {};
    (sessions || []).forEach(s => {
      modeMap[s.mode] = (modeMap[s.mode] || 0) + 1;
    });

    // 连续专注天数
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = now.subtract(i, 'day').startOf('day');
      const dayEnd = d.endOf('day');
      const hasSession = (sessions || []).some(s => s.startTime >= d.valueOf() && s.startTime <= dayEnd.valueOf());
      if (hasSession) streak++;
      else break;
    }

    // 最长单次
    const longest = (sessions || []).reduce((max, s) => Math.max(max, (s.actualMs || 0) / 60000), 0);

    return { data, totalMin, totalCount, prevTotalMin, hourMap, modeMap, streak, longest, avgDay: days > 0 ? Math.round(totalMin / days) : 0 };
  }, [sessions, range]);

  const diffColor = stats.totalMin >= stats.prevTotalMin ? '#22c55e' : '#ef4444';
  const diffText = `${stats.totalMin - stats.prevTotalMin > 0 ? '+' : ''}${stats.totalMin - stats.prevTotalMin}分`;

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
      </Card>

      <Radio.Group value={range} onChange={e => setRange(e.target.value)} style={{ alignSelf: 'flex-end' }}>
        <Radio.Button value="7">7 天</Radio.Button>
        <Radio.Button value="14">14 天</Radio.Button>
        <Radio.Button value="30">30 天</Radio.Button>
      </Radio.Group>

      {/* 核心指标 */}
      <Row gutter={[16, 16]}>
        {[
          { label: '总专注时长', value: `${stats.totalMin}分`, icon: <ClockCircleOutlined />, color: '#f59e0b', sub: diffText, subColor: diffColor },
          { label: '日均专注', value: `${stats.avgDay}分`, icon: <RiseOutlined />, color: '#3b82f6' },
          { label: '连续专注', value: `${stats.streak}天`, icon: <FireOutlined />, color: '#ef4444' },
          { label: '最长单次', value: `${Math.round(stats.longest)}分`, icon: <CrownOutlined />, color: '#8b5cf6' }
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

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注排行榜', icon: <CrownOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_RANKING },
            { label: '习惯热力图', icon: <CalendarOutlined />, color: '#14b8a6', path: ROUTES.HABIT_HEATMAP },
            { label: '目标时间线', icon: <AimOutlined />, color: '#3b82f6', path: ROUTES.GOAL_TIMELINE },
            { label: '情绪趋势', icon: <HeartOutlined />, color: '#ec4899', path: ROUTES.DIARY_MOOD_TRENDS }
          ].map(item => (
            <Col xs={12} sm={6} key={item.label}>
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
