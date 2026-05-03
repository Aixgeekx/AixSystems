// 专注历史 - 专注记录分析与回顾
import React, { useMemo, useState } from 'react';
import { Card, Col, Empty, List, Row, Select, Space, Statistic, Tag, Typography } from 'antd';
import { BarChartOutlined, ClockCircleOutlined, FireOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

const MODE_MAP: Record<string, string> = { countdown: '倒计时', stopwatch: '正计时', pomodoro: '番茄钟' };
const MODE_COLORS: Record<string, string> = { countdown: '#3b82f6', stopwatch: '#22c55e', pomodoro: '#f59e0b' };

export default function FocusHistoryPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [range, setRange] = useState<7 | 14 | 30>(14);

  const sessions = useLiveQuery(() => db.focusSessions.orderBy('startTime').reverse().toArray(), []);

  const now = dayjs();
  const cutoff = now.subtract(range, 'day').startOf('day').valueOf();

  const filtered = useMemo(() => (sessions || []).filter(s => s.startTime >= cutoff), [sessions, cutoff]);
  const all = sessions || [];

  const totalMin = Math.round(filtered.reduce((s, v) => s + v.actualMs / 60_000, 0));
  const totalCount = filtered.length;
  const avgMin = totalCount ? Math.round(totalMin / totalCount) : 0;
  const strictCount = filtered.filter(s => s.strictMode).length;

  // 每日时长分布
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < range; i++) {
      map[now.subtract(i, 'day').format('MM/DD')] = 0;
    }
    filtered.forEach(s => {
      const key = dayjs(s.startTime).format('MM/DD');
      if (key in map) map[key] += Math.round(s.actualMs / 60_000);
    });
    return Object.entries(map).reverse();
  }, [filtered, range]);

  // 模式分布
  const modeData = useMemo(() => {
    const map: Record<string, number> = { countdown: 0, stopwatch: 0, pomodoro: 0 };
    filtered.forEach(s => { map[s.mode] = (map[s.mode] || 0) + 1; });
    return Object.entries(map).map(([k, v]) => ({ name: MODE_MAP[k] || k, value: v, itemStyle: { color: MODE_COLORS[k] || accent } }));
  }, [filtered]);

  // 小时分布
  const hourData = useMemo(() => {
    const hours = Array(24).fill(0);
    filtered.forEach(s => { hours[dayjs(s.startTime).hour()] += Math.round(s.actualMs / 60_000); });
    return hours;
  }, [filtered]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const dailyOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: dailyData.map(d => d[0]), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: dailyData.map(d => d[1]), itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '60%' }]
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
    series: [{ type: 'pie', radius: ['45%', '72%'], data: modeData, label: { color: subColor, fontSize: 12 }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } } }]
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, ${accent}, ${accent}cc 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><FireOutlined /> 专注历史</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>专注记录分析</Typography.Title>
          </div>
          <Select value={range} onChange={setRange} options={[{ value: 7, label: '近 7 天' }, { value: 14, label: '近 14 天' }, { value: 30, label: '近 30 天' }]} style={{ width: 110 }} />
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '总专注次数', value: totalCount, icon: <ThunderboltOutlined />, color: '#f59e0b' },
          { label: '总时长(分钟)', value: totalMin, icon: <ClockCircleOutlined />, color: '#3b82f6' },
          { label: '平均时长(分钟)', value: avgMin, icon: <BarChartOutlined />, color: '#22c55e' },
          { label: '严格模式次数', value: strictCount, icon: <FireOutlined />, color: '#ec4899' }
        ].map(m => (
          <Col xs={12} lg={6} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 17 }}>{m.icon}</div>
                <span style={{ color: subColor, fontSize: 13 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: m.color }}>{m.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>每日专注时长</Typography.Title>
            <ReactECharts option={dailyOption} style={{ height: 260 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>专注模式分布</Typography.Title>
            {totalCount > 0 ? (
              <ReactECharts option={modeOption} style={{ height: 260 }} />
            ) : (
              <Empty description="暂无专注记录" style={{ padding: '60px 0' }} />
            )}
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>时段能量分布</Typography.Title>
        <ReactECharts option={hourOption} style={{ height: 200 }} />
      </Card>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>最近专注记录</Typography.Title>
        {filtered.length > 0 ? (
          <List dataSource={filtered.slice(0, 20)} renderItem={s => (
            <List.Item style={{ padding: '10px 0', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div>
                  <Typography.Text style={{ color: titleColor, fontWeight: 600 }}>{s.title || '专注'}</Typography.Text>
                  <div style={{ color: subColor, fontSize: 12, marginTop: 2 }}>{dayjs(s.startTime).format('MM/DD HH:mm')}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Tag color={MODE_COLORS[s.mode]} style={{ borderRadius: 999, fontSize: 11 }}>{MODE_MAP[s.mode]}</Tag>
                  <span style={{ fontWeight: 700, color: accent, fontSize: 15 }}>{Math.round(s.actualMs / 60_000)}分</span>
                  {s.strictMode && <Tag color="red" style={{ borderRadius: 999, fontSize: 10 }}>严格</Tag>}
                </div>
              </div>
            </List.Item>
          )} />
        ) : (
          <Empty description="暂无专注记录" />
        )}
      </Card>
    </Space>
  );
}
