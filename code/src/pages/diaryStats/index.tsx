// 日记统计 - 日记写作数据分析
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import { BookOutlined, CalendarOutlined, EditOutlined, HeartOutlined, StarOutlined, TrophyOutlined, CrownOutlined, BarChartOutlined, AimOutlined, LineChartOutlined, DashboardOutlined, GoldOutlined, SwapOutlined, ClockCircleOutlined, SafetyCertificateOutlined, RocketOutlined, RiseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';
import Empty from '@/components/Empty';

const MOOD_COLORS: Record<string, string> = {
  happy: '#22c55e', calm: '#3b82f6', excited: '#f59e0b', sad: '#6366f1',
  anxious: '#ef4444', angry: '#dc2626', tired: '#8b5cf6', grateful: '#14b8a6'
};
const MOOD_LABELS: Record<string, string> = {
  happy: '开心', calm: '平静', excited: '兴奋', sad: '难过',
  anxious: '焦虑', angry: '生气', tired: '疲惫', grateful: '感恩'
};

export default function DiaryStatsPage() {
  const nav = useNavigate();
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

    // 字数统计
    const wordCounts = all.map(d => (d.content || '').length);
    const avgWords = wordCounts.length ? Math.round(wordCounts.reduce((s, v) => s + v, 0) / wordCounts.length) : 0;
    const totalWords = wordCounts.reduce((s, v) => s + v, 0);

    // 天气统计
    const weathers: Record<string, number> = {};
    all.forEach(d => { if (d.weather) weathers[d.weather] = (weathers[d.weather] || 0) + 1; });

    // 标签频率统计
    const tagFreq: Record<string, number> = {};
    all.forEach(d => { (d.tags || []).forEach(t => { tagFreq[t] = (tagFreq[t] || 0) + 1; }); });

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

    // 近30天情绪强度趋势
    const intensityTrend: { date: string; avg: number; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = now.subtract(i, 'day');
      const dayDiaries = all.filter(di => dayjs(di.date).isSame(d, 'day') && di.moodIntensity != null);
      const avg = dayDiaries.length ? dayDiaries.reduce((s, di) => s + (di.moodIntensity || 0), 0) / dayDiaries.length : 0;
      intensityTrend.push({ date: d.format('MM/DD'), avg: Number(avg.toFixed(1)), count: dayDiaries.length });
    }

    // 周几写作分布
    const weekdayMap = Array(7).fill(0);
    all.forEach(d => weekdayMap[dayjs(d.date).day()]++);
    const weekdayLabels = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

    // 字数分布桶
    const wordBuckets = { '0-100': 0, '100-300': 0, '300-500': 0, '500-1000': 0, '1000+': 0 };
    wordCounts.forEach(w => {
      if (w < 100) wordBuckets['0-100']++;
      else if (w < 300) wordBuckets['100-300']++;
      else if (w < 500) wordBuckets['300-500']++;
      else if (w < 1000) wordBuckets['500-1000']++;
      else wordBuckets['1000+']++;
    });

    // 情绪过渡
    const moodTransitions: Record<string, number> = {};
    const sortedDiaries = all.slice().sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
    for (let i = 1; i < sortedDiaries.length; i++) {
      const prev = sortedDiaries[i - 1].mood;
      const curr = sortedDiaries[i].mood;
      if (prev && curr) {
        const key = `${prev}→${curr}`;
        moodTransitions[key] = (moodTransitions[key] || 0) + 1;
      }
    }

    // TOP 3 高产写作日
    const dayMap: Record<string, { count: number; words: number }> = {};
    all.forEach(d => {
      const key = dayjs(d.date).format('YYYY-MM-DD');
      if (!dayMap[key]) dayMap[key] = { count: 0, words: 0 };
      dayMap[key].count++;
      dayMap[key].words += (d.content || '').length;
    });
    const topDays = Object.entries(dayMap).sort((a, b) => b[1].count - a[1].count).slice(0, 3).map(([date, data]) => ({
      date, count: data.count, words: data.words, weekday: weekdayLabels[dayjs(date).day()]
    }));

    // 写作效率评分（字数40% + 频率30% + 连续性30%）
    const wordScore = Math.min(100, totalWords / 100);
    const freqScore = Math.min(100, total * 2);
    const streakScore = Math.min(100, streak * 5);
    const writingEfficiency = Math.round(wordScore * 0.4 + freqScore * 0.3 + streakScore * 0.3);

    // 时段偏好标签
    const morningCount = all.filter(d => { const h = dayjs(d.createdAt).hour(); return h >= 5 && h < 12; }).length;
    const nightCount = all.filter(d => { const h = dayjs(d.createdAt).hour(); return h >= 20 || h < 2; }).length;
    const noonCount = all.filter(d => { const h = dayjs(d.createdAt).hour(); return h >= 12 && h < 14; }).length;
    let timeTag = '暂无偏好';
    if (nightCount > morningCount && nightCount > noonCount) timeTag = '夜笔';
    else if (morningCount > nightCount && morningCount > noonCount) timeTag = '晨记';
    else if (noonCount >= morningCount && noonCount >= nightCount && noonCount > 0) timeTag = '午记';

    // 本月 vs 上月每日写作对比
    const thisMonthDays: { date: string; thisMonth: number; lastMonth: number }[] = [];
    const monthDayCount = now.daysInMonth();
    const lastMonthObj = now.subtract(1, 'month');
    const lastMonthDayCount = lastMonthObj.daysInMonth();
    for (let i = 1; i <= Math.min(monthDayCount, lastMonthDayCount); i++) {
      const thisDay = now.startOf('month').add(i - 1, 'day');
      const lastDay = lastMonthObj.startOf('month').add(i - 1, 'day');
      const thisCount = all.filter(d => dayjs(d.date).isSame(thisDay, 'day')).length;
      const lastCount = all.filter(d => dayjs(d.date).isSame(lastDay, 'day')).length;
      thisMonthDays.push({ date: `${i}日`, thisMonth: thisCount, lastMonth: lastCount });
    }

    // 字数里程碑
    const wordMilestone = totalWords >= 100000 ? '10万+' : totalWords >= 50000 ? '5万+' : totalWords >= 10000 ? '1万+' : totalWords >= 5000 ? '5千+' : totalWords >= 1000 ? '1千+' : '起步';

    // 最佳写作周
    const weekMap: Record<string, number> = {};
    all.forEach(d => { weekMap[dayjs(d.date).startOf('week').format('YYYY-MM-DD')] = (weekMap[dayjs(d.date).startOf('week').format('YYYY-MM-DD')] || 0) + 1; });
    const topWeek = Object.entries(weekMap).sort((a, b) => b[1] - a[1])[0];

    return { total, thisMonth: thisMonth.length, thisWeek: thisWeek.length, encrypted, pinned, moods, topMood, uniqueDays, streak, monthGrowth, avgIntensity, intensityTrend, avgWords, totalWords, weathers, tagFreq, weekdayLabels, weekdayMap, wordBuckets, moodTransitions, topDays, writingEfficiency, timeTag, thisMonthDays, wordMilestone, topWeek };
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

  // 写作时段分布
  const hourDistribution = useMemo(() => {
    const hourMap = Array(24).fill(0);
    (diaries || []).forEach(d => hourMap[dayjs(d.createdAt).hour()]++);
    return Array.from({ length: 24 }, (_, i) => ({ hour: `${i}时`, count: hourMap[i] }));
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

  const intensityOption = {
    tooltip: { trigger: 'axis' as const, formatter: (p: any) => `${p[0].axisValue}: 强度 ${p[0].value}` },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: stats.intensityTrend.map(d => d.date), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: stats.intensityTrend.map(d => d.avg), smooth: true, areaStyle: { color: '#ec489922' }, lineStyle: { color: '#ec4899', width: 2 }, itemStyle: { color: '#ec4899' }, showSymbol: false }]
  };

  const hourOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: hourDistribution.map(d => d.hour), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: hourDistribution.map(d => d.count), itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '60%' }]
  };

  const weatherOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie' as const, radius: ['40%', '70%'],
      data: Object.entries(stats.weathers).map(([k, v]) => ({ name: k, value: v, itemStyle: { color: ['#3b82f6', '#f59e0b', '#94a3b8', '#6366f1', '#22c55e'][Object.keys(stats.weathers).indexOf(k) % 5] } })),
      label: { color: subColor, fontSize: 12 }
    }]
  };

  const tagOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: Object.entries(stats.tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k]) => k), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: Object.entries(stats.tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([, v]) => v), itemStyle: { color: '#ec4899', borderRadius: [4, 4, 0, 0] }, barWidth: '50%' }]
  };

  const weekdayDistOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: stats.weekdayLabels, axisLabel: { color: subColor, fontSize: 12 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.weekdayMap, itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }, barWidth: '50%' }]
  };

  const wordBucketOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 80 },
    xAxis: { type: 'category' as const, data: Object.keys(stats.wordBuckets), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: Object.values(stats.wordBuckets), itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }, barWidth: '55%' }]
  };

  const moodTransOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie', radius: ['38%', '65%'],
      data: Object.entries(stats.moodTransitions).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => ({
        name: k, value: v,
        itemStyle: { color: MOOD_COLORS[k.split('→')[1]] || accent }
      })),
      label: { color: subColor, fontSize: 11 }
    }]
  };

  // 本月 vs 上月对比
  const monthCompareOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['本月', '上月'], textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: stats.thisMonthDays.map(d => d.date), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [
      { name: '本月', type: 'bar', data: stats.thisMonthDays.map(d => d.thisMonth), itemStyle: { color: accent, borderRadius: [3, 3, 0, 0] }, barWidth: '35%' },
      { name: '上月', type: 'bar', data: stats.thisMonthDays.map(d => d.lastMonth), itemStyle: { color: '#94a3b8', borderRadius: [3, 3, 0, 0] }, barWidth: '35%' }
    ]
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
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>累计 {stats.total} 篇日记 · {stats.uniqueDays} 天写作 · 效率评分 {stats.writingEfficiency} 分</Typography.Text>
      </Card>

      {(!diaries || diaries.length === 0) && (
        <Empty text="暂无日记数据" subtext="开始记录后会自动展示" />
      )}

      {(diaries && diaries.length > 0) && (
        <>
      <Row gutter={[16, 16]}>
        {[
          { label: '总日记数', value: stats.total, icon: <BookOutlined />, color: '#ec4899' },
          { label: '本月写作', value: stats.thisMonth, sub: <span style={{ color: stats.monthGrowth >= 0 ? '#22c55e' : '#ef4444', fontSize: 11 }}>{stats.monthGrowth > 0 ? '+' : ''}{stats.monthGrowth}%</span>, icon: <EditOutlined />, color: '#f59e0b' },
          { label: '连续写作', value: `${stats.streak}天`, icon: <CalendarOutlined />, color: '#3b82f6' },
          { label: '写作天数', value: stats.uniqueDays, icon: <TrophyOutlined />, color: '#22c55e' },
          { label: '平均字数', value: stats.avgWords, icon: <StarOutlined />, color: '#8b5cf6' },
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

      {/* 进阶指标 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#3b82f618', display: 'grid', placeItems: 'center', color: '#3b82f6' }}><SafetyCertificateOutlined /></div>
              <span style={{ color: subColor, fontSize: 11 }}>写作效率评分</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#3b82f6' }}>{stats.writingEfficiency}<span style={{ fontSize: 12, color: subColor, marginLeft: 4 }}>分</span></div>
            <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{stats.writingEfficiency >= 80 ? '高产作家' : stats.writingEfficiency >= 50 ? '稳定输出' : '起步积累'}</div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f59e0b18', display: 'grid', placeItems: 'center', color: '#f59e0b' }}><ClockCircleOutlined /></div>
              <span style={{ color: subColor, fontSize: 11 }}>时段偏好</span>
            </div>
            <Tag color={stats.timeTag === '夜笔' ? 'purple' : stats.timeTag === '晨记' ? 'blue' : stats.timeTag === '午记' ? 'orange' : 'default'}>{stats.timeTag}</Tag>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#22c55e18', display: 'grid', placeItems: 'center', color: '#22c55e' }}><RiseOutlined /></div>
              <span style={{ color: subColor, fontSize: 11 }}>字数里程碑</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#22c55e' }}>{stats.wordMilestone}</div>
            <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{stats.totalWords.toLocaleString()} 字</div>
          </Card>
        </Col>
        <Col xs={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ec489918', display: 'grid', placeItems: 'center', color: '#ec4899' }}><RocketOutlined /></div>
              <span style={{ color: subColor, fontSize: 11 }}>最佳写作周</span>
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#ec4899' }}>{stats.topWeek ? `${stats.topWeek[0].slice(5)}` : '-'}</div>
            <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{stats.topWeek ? `${stats.topWeek[1]} 篇` : '暂无'}</div>
          </Card>
        </Col>
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

      {/* 本月 vs 上月 + TOP 3 高产日 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>本月 vs 上月每日写作对比</Typography.Title>
            <ReactECharts option={monthCompareOption} style={{ height: 260 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>TOP 3 高产写作日</Typography.Title>
            <Row gutter={[12, 12]}>
              {stats.topDays.map((d, i) => (
                <Col xs={8} key={d.date}>
                  <Card bordered={false} style={{ borderRadius: 16, background: isDark ? `${['#f59e0b', '#94a3b8', '#b45309'][i]}14` : `${['#f59e0b', '#94a3b8', '#b45309'][i]}0f`, textAlign: 'center' }}>
                    <div style={{ fontSize: 24 }}>{['🥇', '🥈', '🥉'][i]}</div>
                    <div style={{ fontWeight: 700, color: titleColor, margin: '4px 0', fontSize: 12 }}>{d.date} {d.weekday}</div>
                    <div style={{ fontSize: 13, color: ['#f59e0b', '#94a3b8', '#b45309'][i] }}>{d.count} 篇 · {d.words} 字</div>
                  </Card>
                </Col>
              ))}
            </Row>
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
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 30 天情绪强度趋势</Typography.Title>
            <ReactECharts option={intensityOption} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><ClockCircleOutlined /> 写作时段分布</Typography.Title>
            <ReactECharts option={hourOption} style={{ height: 240 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><StarOutlined /> 日记属性</Typography.Title>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {[
                { label: '加密日记', value: stats.encrypted, color: '#8b5cf6' },
                { label: '置顶日记', value: stats.pinned, color: '#f59e0b' },
                { label: '有情绪记录', value: Object.keys(stats.moods).length, color: '#ec4899' },
                { label: '本周写作', value: stats.thisWeek, color: '#3b82f6' },
                { label: '平均字数', value: stats.avgWords, color: '#22c55e' },
                { label: '总字数', value: stats.totalWords.toLocaleString(), color: '#14b8a6' }
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: 12, borderRadius: 14, background: isDark ? `${item.color}14` : `${item.color}0f`, border: `1px solid ${item.color}22` }}>
                  <Typography.Text style={{ color: titleColor }}>{item.label}</Typography.Text>
                  <Tag color={item.color} style={{ borderRadius: 999 }}>{item.value}</Tag>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>天气分布</Typography.Title>
            {Object.keys(stats.weathers).length > 0 ? (
              <ReactECharts option={weatherOption} style={{ height: 220 }} />
            ) : (
              <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无天气数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>情绪标签 TOP10</Typography.Title>
            {Object.keys(stats.tagFreq).length > 0 ? (
              <ReactECharts option={tagOption} style={{ height: 220 }} />
            ) : (
              <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无标签数据</div>
            )}
          </Card>
        </Col>
      </Row>

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

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>周几写作分布</Typography.Title>
            <ReactECharts option={weekdayDistOption} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>字数分布</Typography.Title>
            <ReactECharts option={wordBucketOption} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>情绪过渡（相邻日情绪变化 TOP8）</Typography.Title>
        {Object.keys(stats.moodTransitions).length > 0 ? (
          <ReactECharts option={moodTransOption} style={{ height: 220 }} />
        ) : <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无情绪过渡数据</div>}
      </Card>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注排行榜', icon: <CrownOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_RANKING },
            { label: '习惯热力图', icon: <CalendarOutlined />, color: '#14b8a6', path: ROUTES.HABIT_HEATMAP },
            { label: '目标时间线', icon: <AimOutlined />, color: '#3b82f6', path: ROUTES.GOAL_TIMELINE },
            { label: '专注统计详情', icon: <BarChartOutlined />, color: '#22c55e', path: ROUTES.FOCUS_STATS },
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
