// 日记情绪趋势 - 情绪变化趋势分析
import React, { useMemo, useState } from 'react';
import { Card, Col, Row, Select, Space, Tag, Typography } from 'antd';
import { HeartOutlined, LineChartOutlined, SmileOutlined, RiseOutlined, BarChartOutlined, CrownOutlined, AimOutlined, CalendarOutlined, DashboardOutlined, GoldOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

const MOOD_SCORE: Record<string, number> = { happy: 5, excited: 5, grateful: 4, calm: 3, tired: 2, sad: 1, anxious: 1, angry: 0 };
const MOOD_LABELS: Record<string, string> = { happy: '开心', calm: '平静', excited: '兴奋', sad: '难过', anxious: '焦虑', angry: '生气', tired: '疲惫', grateful: '感恩' };
const MOOD_COLORS: Record<string, string> = { happy: '#22c55e', calm: '#3b82f6', excited: '#f59e0b', sad: '#6366f1', anxious: '#ef4444', angry: '#dc2626', tired: '#8b5cf6', grateful: '#14b8a6' };

export default function DiaryMoodTrendsPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const diaries = useLiveQuery(() => db.diaries.filter(d => !d.deletedAt).toArray(), []);

  const now = dayjs();
  const [compareYear, setCompareYear] = useState(now.year());

  // 近30天情绪趋势
  const trendData = useMemo(() => {
    const data: [string, number | null, string][] = [];
    for (let i = 29; i >= 0; i--) {
      const d = now.subtract(i, 'day').startOf('day');
      const diary = (diaries || []).find(di => dayjs(di.date).isSame(d, 'day') && di.mood);
      const score = diary?.mood ? (MOOD_SCORE[diary.mood] ?? 3) : null;
      data.push([d.format('MM/DD'), score, diary?.mood || '']);
    }
    return data;
  }, [diaries]);

  // 情绪分布统计
  const moodDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    (diaries || []).forEach(d => { if (d.mood) map[d.mood] = (map[d.mood] || 0) + 1; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [diaries]);

  // 情绪强度分布
  const intensityData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    (diaries || []).forEach(d => { if (d.moodIntensity && d.moodIntensity >= 1 && d.moodIntensity <= 5) counts[d.moodIntensity - 1]++; });
    return counts;
  }, [diaries]);

  // 情绪稳定性（近7天 vs 前7天）
  const stability = useMemo(() => {
    const getAvg = (start: number, end: number) => {
      const logs = (diaries || []).filter(d => {
        const t = dayjs(d.date).valueOf();
        return t >= start && t < end && d.mood;
      });
      if (!logs.length) return 0;
      return logs.reduce((s, d) => s + (MOOD_SCORE[d.mood!] ?? 3), 0) / logs.length;
    };
    const thisWeek = getAvg(now.startOf('week').valueOf(), now.endOf('week').valueOf());
    const lastWeek = getAvg(now.subtract(1, 'week').startOf('week').valueOf(), now.subtract(1, 'week').endOf('week').valueOf());
    return { thisWeek: thisWeek.toFixed(1), lastWeek: lastWeek.toFixed(1), diff: (thisWeek - lastWeek).toFixed(1) };
  }, [diaries]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const trendOption = {
    tooltip: {
      trigger: 'axis' as const,
      formatter: (params: any) => {
        const p = params[0];
        const mood = trendData[p.dataIndex]?.[2];
        return `${p.name}<br/>情绪分：${p.value ?? '-'}<br/>心情：${mood ? MOOD_LABELS[mood] || mood : '无记录'}`;
      }
    },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: trendData.map(d => d[0]), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, min: 0, max: 5, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{
      type: 'line', data: trendData.map(d => d[1]), connectNulls: true, smooth: true,
      areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent },
      markLine: { data: [{ type: 'average' as const, name: '均值', label: { color: subColor, fontSize: 10 } }], lineStyle: { color: '#f59e0b66', type: 'dashed' as const } }
    }]
  };

  const moodPieOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie', radius: ['42%', '70%'],
      data: moodDistribution.map(([mood, count]) => ({ name: MOOD_LABELS[mood] || mood, value: count, itemStyle: { color: MOOD_COLORS[mood] || accent } })),
      label: { color: subColor, fontSize: 12 }
    }]
  };

  // 年度情绪对比（按月聚合各情绪出现次数）
  const yearCompareData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const series = Object.keys(MOOD_COLORS).map(mood => {
      const data = months.map(m => {
        return (diaries || []).filter(d => {
          const dk = dayjs(d.date);
          return dk.year() === compareYear && dk.month() + 1 === m && d.mood === mood;
        }).length;
      });
      return { name: MOOD_LABELS[mood] || mood, type: 'bar' as const, stack: 'total' as const, data, itemStyle: { color: MOOD_COLORS[mood] } };
    });
    return { months: months.map(m => `${m}月`), series };
  }, [diaries, compareYear]);

  const yearCompareOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { bottom: 0, textStyle: { color: subColor, fontSize: 10 }, itemWidth: 10, itemHeight: 10 },
    grid: { top: 20, right: 16, bottom: 40, left: 36 },
    xAxis: { type: 'category' as const, data: yearCompareData.months, axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 10 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: yearCompareData.series
  };

  const intensityBarOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: ['很弱', '较弱', '一般', '较强', '很强'], axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: intensityData, itemStyle: { color: (p: any) => ['#6366f1', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'][p.dataIndex], borderRadius: [4, 4, 0, 0] }, barWidth: '50%' }]
  };

  // 周平均情绪分趋势（近8周）
  const weekScoreTrend = useMemo(() => {
    const weeks: { label: string; score: number; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const ws = now.subtract(i, 'week').startOf('week');
      const we = ws.endOf('week');
      const logs = (diaries || []).filter(d => d.mood && d.date >= ws.valueOf() && d.date <= we.valueOf());
      const avg = logs.length ? logs.reduce((s, d) => s + (MOOD_SCORE[d.mood!] ?? 3), 0) / logs.length : 0;
      weeks.push({ label: ws.format('MM/DD'), score: Number(avg.toFixed(2)), count: logs.length });
    }
    return weeks;
  }, [diaries]);

  // 星期关联分析
  const weekdayData = useMemo(() => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const data = days.map((_, i) => {
      const logs = (diaries || []).filter(d => d.mood && dayjs(d.date).day() === i);
      const avg = logs.length ? logs.reduce((s, d) => s + (MOOD_SCORE[d.mood!] ?? 3), 0) / logs.length : 0;
      return Number(avg.toFixed(2));
    });
    return { labels: days, data };
  }, [diaries]);

  const weekScoreOption = {
    tooltip: { trigger: 'axis' as const, formatter: (params: any) => { const p = params[0]; const w = weekScoreTrend[p.dataIndex]; return `${p.name}<br/>周均分：${p.value}<br/>记录：${w.count} 篇`; } },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: weekScoreTrend.map(d => d.label), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, min: 0, max: 5, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: weekScoreTrend.map(d => d.score), smooth: true, areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent }, markLine: { data: [{ type: 'average' as const, name: '均值', label: { color: subColor, fontSize: 10 } }], lineStyle: { color: '#f59e0b66', type: 'dashed' as const } } }]
  };

  const weekdayOption = {
    tooltip: {},
    radar: { indicator: weekdayData.labels.map(d => ({ name: d, max: 5 })), axisName: { color: subColor, fontSize: 11 }, splitArea: { areaStyle: { color: isDark ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] : ['#f8fafc', '#f1f5f9'] } } },
    series: [{ type: 'radar' as const, data: [{ value: weekdayData.data, areaStyle: { color: `${accent}33` }, lineStyle: { color: accent }, itemStyle: { color: accent } }] }]
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: now.year() - 2 + i, label: `${now.year() - 2 + i}年` }));

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #ec4899, #db2777 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><HeartOutlined /> 情绪趋势</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>日记情绪趋势分析</Typography.Title>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '本周情绪均分', value: stability.thisWeek, icon: <SmileOutlined />, color: '#22c55e' },
          { label: '上周情绪均分', value: stability.lastWeek, icon: <LineChartOutlined />, color: '#3b82f6' },
          { label: '情绪变化', value: `${Number(stability.diff) > 0 ? '+' : ''}${stability.diff}`, icon: <RiseOutlined />, color: Number(stability.diff) >= 0 ? '#22c55e' : '#ef4444' }
        ].map(m => (
          <Col xs={8} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 17 }}>{m.icon}</div>
                <span style={{ color: subColor, fontSize: 12 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 30 天情绪趋势</Typography.Title>
        <ReactECharts option={trendOption} style={{ height: 280 }} />
      </Card>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>{compareYear} 年情绪对比</Typography.Title>
          <Select value={compareYear} onChange={setCompareYear} options={yearOptions} style={{ width: 90 }} />
        </div>
        <ReactECharts option={yearCompareOption} style={{ height: 260 }} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>情绪分布</Typography.Title>
            {moodDistribution.length > 0 ? (
              <ReactECharts option={moodPieOption} style={{ height: 240 }} />
            ) : (
              <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无情绪数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>情绪强度分布</Typography.Title>
            <ReactECharts option={intensityBarOption} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 8 周情绪趋势</Typography.Title>
            <ReactECharts option={weekScoreOption} style={{ height: 260 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>星期情绪雷达</Typography.Title>
            <ReactECharts option={weekdayOption} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>情绪标签云</Typography.Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {moodDistribution.map(([mood, count]) => (
            <Tag key={mood} style={{
              borderRadius: 12, padding: '6px 14px', fontSize: 14,
              background: `${MOOD_COLORS[mood] || accent}18`,
              border: `1px solid ${MOOD_COLORS[mood] || accent}44`,
              color: MOOD_COLORS[mood] || accent,
              fontWeight: 600
            }}>
              {MOOD_LABELS[mood] || mood} × {count}
            </Tag>
          ))}
          {moodDistribution.length === 0 && <span style={{ color: subColor }}>暂无情绪标签</span>}
        </div>
      </Card>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注排行榜', icon: <CrownOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_RANKING },
            { label: '习惯热力图', icon: <CalendarOutlined />, color: '#14b8a6', path: ROUTES.HABIT_HEATMAP },
            { label: '心情日历', icon: <HeartOutlined />, color: '#ec4899', path: ROUTES.MOOD_CALENDAR },
            { label: '目标时间线', icon: <AimOutlined />, color: '#3b82f6', path: ROUTES.GOAL_TIMELINE },
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
    </Space>
  );
}
