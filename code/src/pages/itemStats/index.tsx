// 事项统计 - 事项完成数据分析
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, UnorderedListOutlined, TrophyOutlined, RiseOutlined, CrownOutlined, BarChartOutlined, AimOutlined, HeartOutlined, CalendarOutlined, FireOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';
import { ITEM_TYPES } from '@/config/itemTypes';

const TYPE_MAP: Record<string, { label: string; color: string }> = {};
ITEM_TYPES.forEach(t => { TYPE_MAP[t.key] = { label: t.label, color: t.color }; });
const STATUS_LABELS: Record<string, string> = { pending: '待办', done: '已完成', overdue: '已逾期', postponed: '已延期', failed: '已失败' };
const STATUS_COLORS: Record<string, string> = { pending: '#6b7280', done: '#22c55e', overdue: '#ef4444', postponed: '#f59e0b', failed: '#dc2626' };

export default function ItemStatsPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const items = useLiveQuery(() => db.items.filter(i => !i.deletedAt).toArray(), []);
  const now = dayjs();

  const stats = useMemo(() => {
    const all = items || [];
    const total = all.length;
    const done = all.filter(i => i.completeStatus === 'done').length;
    const doing = all.filter(i => i.completeStatus === 'pending').length;
    const todo = all.filter(i => i.completeStatus === 'overdue').length;
    const overdue = all.filter(i => i.endTime && dayjs(i.endTime).isBefore(now, 'day') && i.completeStatus !== 'done').length;

    // 近7天完成趋势
    const dailyDone: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = now.subtract(i, 'day').startOf('day');
      const dayEnd = d.endOf('day');
      const count = all.filter(i => i.completeStatus === 'done' && i.updatedAt >= d.valueOf() && i.updatedAt <= dayEnd.valueOf()).length;
      dailyDone.push({ date: d.format('MM/DD'), count });
    }

    // 类型分布
    const typeMap: Record<string, number> = {};
    all.forEach(i => { typeMap[i.type] = (typeMap[i.type] || 0) + 1; });

    // 状态分布
    const statusMap: Record<string, number> = {};
    all.forEach(i => { statusMap[i.completeStatus] = (statusMap[i.completeStatus] || 0) + 1; });

    // 子任务统计
    const withSubtasks = all.filter(i => i.subtasks && i.subtasks.length > 0);
    const totalSubtasks = withSubtasks.reduce((s, i) => s + (i.subtasks?.length || 0), 0);
    const doneSubtasks = withSubtasks.reduce((s, i) => s + (i.subtasks?.filter(st => st.done).length || 0), 0);

    // 月趋势
    const monthMap: Record<string, number> = {};
    all.filter(i => i.completeStatus === 'done').forEach(i => {
      const m = dayjs(i.updatedAt).format('YYYY/MM');
      monthMap[m] = (monthMap[m] || 0) + 1;
    });
    const monthTrend = Object.entries(monthMap).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);

    return { total, done, doing, todo, overdue, dailyDone, typeMap, statusMap, totalSubtasks, doneSubtasks, monthTrend, doneRate: total > 0 ? Math.round(done / total * 100) : 0 };
  }, [items]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const dailyOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 16, right: 12, bottom: 24, left: 36 },
    xAxis: { type: 'category' as const, data: stats.dailyDone.map(d => d.date), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.dailyDone.map(d => d.count), itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] }, barWidth: '45%' }]
  };

  const statusPie = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie', radius: ['42%', '70%'],
      data: Object.entries(stats.statusMap).map(([s, c]) => ({ name: STATUS_LABELS[s] || s, value: c, itemStyle: { color: STATUS_COLORS[s] || accent } })),
      label: { color: subColor, fontSize: 12 }
    }]
  };

  const monthOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 16, right: 12, bottom: 24, left: 36 },
    xAxis: { type: 'category' as const, data: stats.monthTrend.map(d => d[0]), axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: stats.monthTrend.map(d => d[1]), smooth: true, areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent } }]
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #22c55e, #16a34a 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><UnorderedListOutlined /> 事项统计</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>事项数据分析</Typography.Title>
      </Card>

      {/* 核心指标 */}
      <Row gutter={[16, 16]}>
        {[
          { label: '总事项数', value: stats.total, icon: <UnorderedListOutlined />, color: '#3b82f6' },
          { label: '已完成', value: stats.done, icon: <CheckCircleOutlined />, color: '#22c55e' },
          { label: '逾期事项', value: stats.overdue, icon: <ClockCircleOutlined />, color: '#ef4444' },
          { label: '完成率', value: `${stats.doneRate}%`, icon: <TrophyOutlined />, color: '#f59e0b' }
        ].map(m => (
          <Col xs={12} lg={6} key={m.label}>
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

      <Row gutter={[16, 16]}>
        {/* 近7天完成趋势 */}
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>近 7 天完成趋势</Typography.Title>
            <ReactECharts option={dailyOption} style={{ height: 240 }} />
          </Card>
        </Col>
        {/* 状态分布 */}
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>状态分布</Typography.Title>
            <ReactECharts option={statusPie} style={{ height: 240 }} />
          </Card>
        </Col>
      </Row>

      {/* 月完成趋势 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>月完成趋势</Typography.Title>
        <ReactECharts option={monthOption} style={{ height: 220 }} />
      </Card>

      {/* 类型分布 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>类型分布</Typography.Title>
        <Row gutter={[12, 12]}>
          {Object.entries(stats.typeMap).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
            const meta = TYPE_MAP[type];
            return (
              <Col xs={12} sm={8} md={6} key={type}>
                <div style={{
                  borderRadius: 16, padding: 14, textAlign: 'center',
                  background: isDark ? `${meta?.color || accent}14` : `${meta?.color || accent}0f`,
                  border: `1px solid ${meta?.color || accent}22`
                }}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: meta?.color || accent }}>{count}</div>
                  <div style={{ color: subColor, fontSize: 12, marginTop: 4 }}>{meta?.label || type}</div>
                </div>
              </Col>
            );
          })}
          {Object.keys(stats.typeMap).length === 0 && <Col span={24}><div style={{ textAlign: 'center', color: subColor, padding: 30 }}>暂无事项数据</div></Col>}
        </Row>
      </Card>

      {/* 子任务统计 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>子任务进度</Typography.Title>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Progress type="circle" percent={stats.totalSubtasks > 0 ? Math.round(stats.doneSubtasks / stats.totalSubtasks * 100) : 0} strokeColor="#22c55e" size={80} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: titleColor }}>{stats.doneSubtasks}/{stats.totalSubtasks}</div>
            <div style={{ color: subColor, fontSize: 13 }}>已完成子任务 / 总子任务</div>
          </div>
        </div>
      </Card>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '事项时间线', icon: <ClockCircleOutlined />, color: '#3b82f6', path: ROUTES.ITEM_TIMELINE },
            { label: '目标时间线', icon: <AimOutlined />, color: '#22c55e', path: ROUTES.GOAL_TIMELINE },
            { label: '习惯热力图', icon: <CalendarOutlined />, color: '#14b8a6', path: ROUTES.HABIT_HEATMAP },
            { label: '专注趋势', icon: <FireOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_TRENDS }
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
