// 日记统计 - 日记写作数据分析
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import { BookOutlined, CalendarOutlined, EditOutlined, HeartOutlined, StarOutlined, TrophyOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

const MOOD_COLORS: Record<string, string> = {
  happy: '#22c55e', calm: '#3b82f6', excited: '#f59e0b', sad: '#6366f1',
  anxious: '#ef4444', angry: '#dc2626', tired: '#8b5cf6', grateful: '#14b8a6'
};
const MOOD_LABELS: Record<string, string> = {
  happy: '开心', calm: '平静', excited: '兴奋', sad: '难过',
  anxious: '焦虑', angry: '生气', tired: '疲惫', grateful: '感恩'
};

export default function DiaryStatsPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const diaries = useLiveQuery(() => db.diaries.filter(d => !d.deletedAt).toArray(), []);

  const now = dayjs();

  const stats = useMemo(() => {
    const all = diaries || [];
    const total = all.length;
    const thisMonth = all.filter(d => dayjs(d.date).isSame(now, 'month'));
    const thisWeek = all.filter(d => dayjs(d.date).isSame(now, 'week'));
    const lastMonth = all.filter(d => dayjs(d.date).isSame(now.subtract(1, 'month'), 'month'));
    const encrypted = all.filter(d => d.encrypted).length;
    const pinned = all.filter(d => d.pinned).length;

    // 情绪统计
    const moods: Record<string, number> = {};
    all.forEach(d => { if (d.mood) moods[d.mood] = (moods[d.mood] || 0) + 1; });
    const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0];

    // 写作天数
    const uniqueDays = new Set(all.map(d => dayjs(d.date).format('YYYY-MM-DD'))).size;

    // 连续写作天数
    let streak = 0;
    let d = now.startOf('day');
    const dateSet = new Set(all.map(di => dayjs(di.date).format('YYYY-MM-DD')));
    while (dateSet.has(d.format('YYYY-MM-DD'))) { streak++; d = d.subtract(1, 'day'); }

    // 月增长
    const monthGrowth = lastMonth.length > 0 ? Math.round((thisMonth.length - lastMonth.length) / lastMonth.length * 100) : thisMonth.length > 0 ? 100 : 0;

    // 情绪强度均值
    const intensities = all.filter(d => d.moodIntensity).map(d => d.moodIntensity!);
    const avgIntensity = intensities.length ? (intensities.reduce((s, v) => s + v, 0) / intensities.length).toFixed(1) : '-';

    return { total, thisMonth: thisMonth.length, thisWeek: thisWeek.length, encrypted, pinned, moods, topMood, uniqueDays, streak, monthGrowth, avgIntensity };
  }, [diaries]);

  // 近7天日记数
  const dailyData = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) map[now.subtract(i, 'day').format('MM/DD')] = 0;
    (diaries || []).forEach(d => {
      const key = dayjs(d.date).format('MM/DD');
      if (key in map) map[key]++;
    });
    return Object.entries(map);
  }, [diaries]);

  // 近6个月写作趋势
  const monthData = useMemo(() => {
    const data: [string, number][] = [];
    for (let i = 5; i >= 0; i--) {
      const m = now.subtract(i, 'month');
      const count = (diaries || []).filter(d => dayjs(d.date).isSame(m, 'month')).length;
      data.push([m.format('YY/MM'), count]);
    }
    return data;
  }, [diaries]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const dailyOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: dailyData.map(d => d[0]), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: dailyData.map(d => d[1]), itemStyle: { color: '#ec4899', borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  const monthOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: monthData.map(d => d[0]), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: monthData.map(d => d[1]), smooth: true, areaStyle: { color: '#ec489922' }, lineStyle: { color: '#ec4899', width: 2 }, itemStyle: { color: '#ec4899' } }]
  };

  const moodOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie', radius: ['42%', '70%'],
      data: Object.entries(stats.moods).map(([k, v]) => ({ name: MOOD_LABELS[k] || k, value: v, itemStyle: { color: MOOD_COLORS[k] || accent } })),
      label: { color: subColor, fontSize: 12 }
    }]
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #ec4899, #db2777 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><BookOutlined /> 日记统计</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>日记写作分析</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>累计 {stats.total} 篇日记 · {stats.uniqueDays} 天写作</Typography.Text>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '总日记数', value: stats.total, icon: <BookOutlined />, color: '#ec4899' },
          { label: '本月写作', value: stats.thisMonth, sub: <span style={{ color: stats.monthGrowth >= 0 ? '#22c55e' : '#ef4444', fontSize: 11 }}>{stats.monthGrowth > 0 ? '+' : ''}{stats.monthGrowth}%</span>, icon: <EditOutlined />, color: '#f59e0b' },
          { label: '连续写作', value: `${stats.streak}天`, icon: <CalendarOutlined />, color: '#3b82f6' },
          { label: '写作天数', value: stats.uniqueDays, icon: <TrophyOutlined />, color: '#22c55e' },
          { label: '加密日记', value: stats.encrypted, icon: <StarOutlined />, color: '#8b5cf6' },
          { label: '平均情绪强度', value: stats.avgIntensity, icon: <HeartOutlined />, color: '#14b8a6' }
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
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 7 天写作频率</Typography.Title>
            <ReactECharts option={dailyOption} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 6 个月趋势</Typography.Title>
            <ReactECharts option={monthOption} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>情绪分布</Typography.Title>
            {Object.keys(stats.moods).length > 0 ? (
              <ReactECharts option={moodOption} style={{ height: 220 }} />
            ) : (
              <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无情绪数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>情绪标签</Typography.Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {Object.entries(stats.moods).sort((a, b) => b[1] - a[1]).map(([mood, count]) => (
                <Tag key={mood} style={{ borderRadius: 12, padding: '4px 12px', fontSize: 13, background: `${MOOD_COLORS[mood] || accent}18`, border: `1px solid ${MOOD_COLORS[mood] || accent}44`, color: MOOD_COLORS[mood] || accent }}>
                  {MOOD_LABELS[mood] || mood} × {count}
                </Tag>
              ))}
              {Object.keys(stats.moods).length === 0 && <span style={{ color: subColor }}>暂无情绪标签</span>}
            </div>
            <div style={{ marginTop: 16 }}>
              <div style={{ color: subColor, fontSize: 12, marginBottom: 4 }}>主导情绪</div>
              {stats.topMood ? (
                <Tag style={{ borderRadius: 12, padding: '6px 16px', fontSize: 15, background: `${MOOD_COLORS[stats.topMood[0]] || accent}22`, border: `1px solid ${MOOD_COLORS[stats.topMood[0]] || accent}55`, color: MOOD_COLORS[stats.topMood[0]] || accent, fontWeight: 600 }}>
                  {MOOD_LABELS[stats.topMood[0]] || stats.topMood[0]} ({stats.topMood[1]} 次)
                </Tag>
              ) : <span style={{ color: subColor }}>暂无</span>}
            </div>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
