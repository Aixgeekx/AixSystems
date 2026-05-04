// 复习统计 - 记忆曲线复习效果趋势与掌握率分析
import React, { useMemo } from 'react';
import { Card, Col, Row, Space, Statistic, Typography, Tag } from 'antd';
import { BookOutlined, CheckCircleOutlined, ClockCircleOutlined, RiseOutlined, BarChartOutlined, CrownOutlined, CalendarOutlined, HeartOutlined, DashboardOutlined, GoldOutlined, SwapOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

export default function ReviewStatsPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const now = dayjs();

  const queue = useLiveQuery(() => db.reminderQueue.toArray(), []);

  const stats = useMemo(() => {
    const all = queue || [];
    const reviewEntries = all.filter(e => e.curveDay);
    const completed = reviewEntries.filter(e => e.completedAt);
    const mastered = completed.filter(e => e.reviewFeedback === 'mastered');
    const fuzzy = completed.filter(e => e.reviewFeedback === 'fuzzy');

    // 近 14 天每日完成数与掌握数
    const daily = Array.from({ length: 14 }).map((_, i) => {
      const d = now.subtract(13 - i, 'day');
      const s = d.startOf('day').valueOf();
      const e = d.endOf('day').valueOf();
      const c = completed.filter(x => x.completedAt! >= s && x.completedAt! <= e);
      return { date: d.format('MM/DD'), done: c.length, mastered: c.filter(x => x.reviewFeedback === 'mastered').length };
    });

    // curveDay 分布
    const curveMap: Record<number, { total: number; mastered: number; fuzzy: number }> = {};
    completed.forEach(e => {
      const d = e.curveDay || 0;
      if (!curveMap[d]) curveMap[d] = { total: 0, mastered: 0, fuzzy: 0 };
      curveMap[d].total++;
      if (e.reviewFeedback === 'mastered') curveMap[d].mastered++;
      else curveMap[d].fuzzy++;
    });
    const curveDays = Object.keys(curveMap).map(Number).sort((a, b) => a - b);

    // 近 7 天 vs 前 7 天
    const last7s = now.subtract(7, 'day').startOf('day').valueOf();
    const last7e = now.endOf('day').valueOf();
    const prev7s = now.subtract(14, 'day').startOf('day').valueOf();
    const prev7e = now.subtract(8, 'day').endOf('day').valueOf();
    const last7 = completed.filter(e => e.completedAt! >= last7s && e.completedAt! <= last7e).length;
    const prev7 = completed.filter(e => e.completedAt! >= prev7s && e.completedAt! <= prev7e).length;

    // 连续复习天数
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = now.subtract(i, 'day');
      const s = d.startOf('day').valueOf();
      const e = d.endOf('day').valueOf();
      if (completed.some(x => x.completedAt! >= s && x.completedAt! <= e)) streak++;
      else break;
    }

    return { total: reviewEntries.length, completed: completed.length, mastered: mastered.length, fuzzy: fuzzy.length, daily, curveMap, curveDays, last7, prev7, streak };
  }, [queue]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const trendOption = {
    tooltip: { trigger: 'axis' as const },
    legend: { data: ['已完成', '已掌握'], textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 12, bottom: 24, left: 40 },
    xAxis: { type: 'category' as const, data: stats.daily.map(d => d.date), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [
      { name: '已完成', type: 'bar' as const, data: stats.daily.map(d => d.done), itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: '40%' },
      { name: '已掌握', type: 'line' as const, data: stats.daily.map(d => d.mastered), smooth: true, lineStyle: { color: '#22c55e', width: 2 }, itemStyle: { color: '#22c55e' } }
    ]
  };

  const curveOption = {
    tooltip: { trigger: 'axis' as const, formatter: (p: any) => `${p[0].name}<br/>总复习 ${p[0].value}<br/>掌握 ${p[1].value}<br/>需巩固 ${p[2].value}` },
    legend: { data: ['总复习', '掌握', '需巩固'], textStyle: { color: subColor, fontSize: 11 }, top: 0 },
    grid: { top: 30, right: 12, bottom: 24, left: 40 },
    xAxis: { type: 'category' as const, data: stats.curveDays.map(d => `D${d}`), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [
      { name: '总复习', type: 'bar' as const, data: stats.curveDays.map(d => stats.curveMap[d].total), itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }, barWidth: '35%' },
      { name: '掌握', type: 'bar' as const, data: stats.curveDays.map(d => stats.curveMap[d].mastered), itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] }, barWidth: '35%' },
      { name: '需巩固', type: 'bar' as const, data: stats.curveDays.map(d => stats.curveMap[d].fuzzy), itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] }, barWidth: '35%' }
    ]
  };

  const diffColor = stats.last7 >= stats.prev7 ? '#22c55e' : '#ef4444';
  const diffText = `${stats.last7 - stats.prev7 > 0 ? '+' : ''}${stats.last7 - stats.prev7} 次`;
  const masteryRate = stats.completed > 0 ? Math.round(stats.mastered / stats.completed * 100) : 0;

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #22c55e, #16a34a 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><BookOutlined /> 复习统计</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>记忆曲线复习效果分析</Typography.Title>
      </Card>

      {/* 核心指标 */}
      <Row gutter={[16, 16]}>
        {[
          { label: '总复习数', value: stats.total, icon: <BookOutlined />, color: '#3b82f6' },
          { label: '已完成', value: stats.completed, sub: `${masteryRate}% 掌握率`, subColor: masteryRate >= 70 ? '#22c55e' : '#f59e0b', icon: <CheckCircleOutlined />, color: '#22c55e' },
          { label: '已掌握', value: stats.mastered, sub: `需巩固 ${stats.fuzzy}`, subColor: '#f59e0b', icon: <RiseOutlined />, color: '#8b5cf6' },
          { label: '近 7 天', value: stats.last7, sub: diffText, subColor: diffColor, icon: <ClockCircleOutlined />, color: '#f59e0b' },
          { label: '连续复习', value: `${stats.streak}天`, icon: <CrownOutlined />, color: '#ef4444' }
        ].map(s => (
          <Col xs={12} lg={8} key={s.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
              <Statistic title={<span style={{ color: subColor, fontSize: 12 }}>{s.label}</span>} value={s.value}
                valueStyle={{ color: s.color, fontSize: 24, fontWeight: 800 }} prefix={<span style={{ color: s.color, marginRight: 6 }}>{s.icon}</span>} />
              {s.sub ? <div style={{ fontSize: 12, color: s.subColor, marginTop: 4 }}>{s.sub}</div> : null}
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 14 天复习趋势</Typography.Title>
            <ReactECharts option={trendOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>记忆曲线节点分布</Typography.Title>
            <ReactECharts option={curveOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '复习中心', icon: <BookOutlined />, color: '#22c55e', path: ROUTES.REVIEW },
            { label: '成长仪表盘', icon: <RiseOutlined />, color: '#ec4899', path: ROUTES.GROWTH },
            { label: '数据总览', icon: <DashboardOutlined />, color: '#3b82f6', path: ROUTES.DATA_OVERVIEW },
            { label: '成就中心', icon: <CrownOutlined />, color: '#f59e0b', path: ROUTES.ACHIEVEMENTS },
            { label: '成长月报', icon: <GoldOutlined />, color: '#8b5cf6', path: ROUTES.GROWTH_MONTHLY },
            { label: '专注模式对比', icon: <SwapOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_MODE_COMPARE }
          ].map(item => (
            <Col xs={12} sm={4} key={item.label}>
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
