// 目标时间线 - 目标与里程碑可视化时间轴
import React, { useMemo, useState } from 'react';
import { Card, Col, Modal, Progress, Row, Space, Tag, Timeline, Typography } from 'antd';
import { AimOutlined, CheckCircleOutlined, ClockCircleOutlined, FlagOutlined, TrophyOutlined, CrownOutlined, BarChartOutlined, HeartOutlined, CalendarOutlined, DashboardOutlined, GoldOutlined, SwapOutlined, RiseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';
import Empty from '@/components/Empty';
import type { Goal } from '@/models';

const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: '进行中', color: '#3b82f6' },
  completed: { label: '已完成', color: '#22c55e' },
  archived: { label: '已归档', color: '#6b7280' }
};

export default function GoalTimelinePage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalGoal, setModalGoal] = useState<Goal | null>(null);
  const [modalMilestone, setModalMilestone] = useState<{ title: string; done: boolean; index: number } | null>(null);

  const now = dayjs();

  const goals = useLiveQuery(() => db.goals.filter(g => !g.deletedAt).toArray(), []);

  const sorted = useMemo(() => (goals || []).sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)), [goals]);

  // 目标创建时间线（按月份统计创建数）
  const creationTimeline = useMemo(() => {
    const map: Record<string, { created: number; completed: number }> = {};
    (goals || []).forEach(g => {
      const key = dayjs(g.createdAt).format('YYYY-MM');
      if (!map[key]) map[key] = { created: 0, completed: 0 };
      map[key].created++;
      if (g.status === 'completed') {
        const ckey = dayjs(g.updatedAt || g.createdAt).format('YYYY-MM');
        if (!map[ckey]) map[ckey] = { created: 0, completed: 0 };
        map[ckey].completed++;
      }
    });
    const keys = Object.keys(map).sort();
    return { months: keys, created: keys.map(k => map[k].created), completed: keys.map(k => map[k].completed) };
  }, [goals]);

  // 里程碑完成趋势（近8周）
  const milestoneTrend = useMemo(() => {
    const weeks: { label: string; done: number; total: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const ws = now.subtract(i, 'week').startOf('week');
      const we = ws.endOf('week');
      let done = 0, total = 0;
      (goals || []).forEach(g => {
        const ms = g.milestones || [];
        total += ms.length;
        if (g.status === 'completed' && g.updatedAt && g.updatedAt >= ws.valueOf() && g.updatedAt <= we.valueOf()) {
          done += ms.filter(m => m.done).length;
        }
      });
      weeks.push({ label: ws.format('MM/DD'), done, total });
    }
    return weeks;
  }, [goals]);

  // 目标周期分布（完成天数分组）
  const cycleDistribution = useMemo(() => {
    const buckets = ['<7天', '7-30天', '1-3月', '3-6月', '>6月'];
    const counts = [0, 0, 0, 0, 0];
    (goals || []).filter(g => g.status === 'completed').forEach(g => {
      const days = dayjs(g.updatedAt || g.createdAt).diff(dayjs(g.createdAt), 'day');
      if (days < 7) counts[0]++;
      else if (days < 30) counts[1]++;
      else if (days < 90) counts[2]++;
      else if (days < 180) counts[3]++;
      else counts[4]++;
    });
    return buckets.map((b, i) => ({ name: b, value: counts[i], itemStyle: { color: ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'][i] } }));
  }, [goals]);

  const active = sorted.filter(g => g.status === 'active');
  const completed = sorted.filter(g => g.status === 'completed');

  const totalMilestones = sorted.reduce((s, g) => s + (g.milestones?.length || 0), 0);
  const doneMilestones = sorted.reduce((s, g) => s + (g.milestones?.filter(m => m.done).length || 0), 0);
  const overallProgress = totalMilestones > 0 ? Math.round(doneMilestones / totalMilestones * 100) : 0;

  // 即将到期目标
  const upcoming = useMemo(() => {
    const now = dayjs();
    return active.filter(g => g.targetDate).filter(g => {
      const days = dayjs(g.targetDate).diff(now, 'day');
      return days >= 0 && days <= 30;
    }).sort((a, b) => (a.targetDate || 0) - (b.targetDate || 0));
  }, [active]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const creationOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: creationTimeline.months, axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [
      { name: '新建', type: 'bar' as const, data: creationTimeline.created, itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }, barWidth: '35%' },
      { name: '完成', type: 'bar' as const, data: creationTimeline.completed, itemStyle: { color: '#22c55e', borderRadius: [4, 4, 0, 0] }, barWidth: '35%' }
    ]
  };

  const milestoneOption = {
    tooltip: { trigger: 'axis' as const, formatter: (p: any) => { const d = p[0]; return `${d.name}<br/>已完成: ${d.dataIndex < milestoneTrend.length ? milestoneTrend[d.dataIndex].done : 0}<br/>累计: ${d.dataIndex < milestoneTrend.length ? milestoneTrend[d.dataIndex].total : 0}`; } },
    grid: { top: 20, right: 16, bottom: 28, left: 36 },
    xAxis: { type: 'category' as const, data: milestoneTrend.map(d => d.label), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, minInterval: 1, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'line', data: milestoneTrend.map(d => d.done), smooth: true, areaStyle: { color: `${accent}22` }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent }, markLine: { data: [{ type: 'average' as const, name: '均值', label: { color: subColor, fontSize: 10 } }], lineStyle: { color: '#f59e0b66', type: 'dashed' as const } } }]
  };

  const cycleOption = {
    tooltip: { trigger: 'item' as const },
    series: [{
      type: 'pie' as const, radius: ['40%', '70%'],
      data: cycleDistribution,
      label: { color: subColor, fontSize: 12 }
    }]
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #3b82f6, #2563eb 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><AimOutlined /> 目标时间线</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>目标与里程碑</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>{active.length} 个进行中 · {completed.length} 个已完成</Typography.Text>
      </Card>

      {(!goals || goals.length === 0) && (
        <Empty text="暂无目标数据" subtext="开始记录后会自动展示" />
      )}

      {(goals && goals.length > 0) && (
        <>
      <Row gutter={[16, 16]}>
        {[
          { label: '进行中', value: active.length, icon: <AimOutlined />, color: '#3b82f6' },
          { label: '已完成', value: completed.length, icon: <TrophyOutlined />, color: '#22c55e' },
          { label: '里程碑进度', value: `${doneMilestones}/${totalMilestones}`, icon: <FlagOutlined />, color: '#f59e0b' },
          { label: '整体进度', value: `${overallProgress}%`, icon: <CheckCircleOutlined />, color: '#ec4899' }
        ].map(m => (
          <Col xs={12} lg={6} key={m.label}>
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

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><RiseOutlined /> 目标创建与完成趋势</Typography.Title>
        {creationTimeline.months.length > 0 ? (
          <ReactECharts option={creationOption} style={{ height: 240 }} />
        ) : (
          <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无数据</div>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>里程碑完成趋势</Typography.Title>
            {milestoneTrend.length > 0 ? (
              <ReactECharts option={milestoneOption} style={{ height: 240 }} />
            ) : (
              <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无数据</div>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>目标周期分布</Typography.Title>
            {cycleDistribution.some(d => d.value > 0) ? (
              <ReactECharts option={cycleOption} style={{ height: 240 }} />
            ) : (
              <div style={{ textAlign: 'center', color: subColor, padding: 60 }}>暂无完成的目标</div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 即将到期 */}
      {upcoming.length > 0 && (
        <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>
            <ClockCircleOutlined /> 即将到期目标
          </Typography.Title>
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            {upcoming.map(g => {
              const daysLeft = dayjs(g.targetDate).diff(dayjs(), 'day');
              const progress = g.milestones?.length ? Math.round(g.milestones.filter(m => m.done).length / g.milestones.length * 100) : 0;
              return (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                  <div>
                    <Typography.Text style={{ fontWeight: 600, color: titleColor }}>{g.title}</Typography.Text>
                    <div style={{ color: subColor, fontSize: 11, marginTop: 2 }}>截止 {dayjs(g.targetDate).format('MM/DD')} · 剩余 {daysLeft} 天</div>
                  </div>
                  <Progress percent={progress} size="small" style={{ width: 100 }} strokeColor={g.color} />
                </div>
              );
            })}
          </Space>
        </Card>
      )}

      {/* 目标时间轴 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>
          <FlagOutlined /> 目标时间轴
        </Typography.Title>
        {sorted.length > 0 ? (
          <Timeline mode="left" items={sorted.map(g => {
            const meta = STATUS_META[g.status] || STATUS_META.active;
            const progress = g.milestones?.length ? Math.round(g.milestones.filter(m => m.done).length / g.milestones.length * 100) : 0;
            const ms = g.milestones || [];
            return {
              dot: <div style={{ width: 14, height: 14, borderRadius: '50%', background: g.color || meta.color, border: `3px solid ${g.color || meta.color}44` }} />,
              children: (
                <div style={{ padding: '4px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Typography.Text style={{ fontWeight: 700, color: titleColor, fontSize: 15 }}>{g.title}</Typography.Text>
                    <Tag style={{ borderRadius: 999, fontSize: 11, background: `${meta.color}18`, border: `1px solid ${meta.color}44`, color: meta.color }}>{meta.label}</Tag>
                  </div>
                  {g.description && <div style={{ color: subColor, fontSize: 12, marginBottom: 6 }}>{g.description}</div>}
                  <Progress percent={progress} strokeColor={g.color || accent} size="small" />
                  {ms.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      {ms.map((m, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, cursor: 'pointer' }} onClick={() => { setModalGoal(g); setModalMilestone({ ...m, index: i }); setModalOpen(true); }}>
                          <CheckCircleOutlined style={{ color: m.done ? '#22c55e' : '#d1d5db', fontSize: 14 }} />
                          <span style={{ color: m.done ? subColor : titleColor, fontSize: 12, textDecoration: m.done ? 'line-through' : 'none' }}>{m.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {g.targetDate && <div style={{ color: subColor, fontSize: 11, marginTop: 6 }}>截止日期：{dayjs(g.targetDate).format('YYYY-MM-DD')}</div>}
                </div>
              ),
              label: <span style={{ color: subColor, fontSize: 11 }}>{dayjs(g.updatedAt || g.createdAt).format('MM/DD')}</span>
            };
          })} />
        ) : (
          <div style={{ textAlign: 'center', color: subColor, padding: 40 }}>暂无目标，去目标管理创建一个吧</div>
        )}
      </Card>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注排行榜', icon: <CrownOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_RANKING },
            { label: '习惯热力图', icon: <CalendarOutlined />, color: '#14b8a6', path: ROUTES.HABIT_HEATMAP },
            { label: '心情日历', icon: <HeartOutlined />, color: '#ec4899', path: ROUTES.MOOD_CALENDAR },
            { label: '专注统计详情', icon: <BarChartOutlined />, color: '#3b82f6', path: ROUTES.FOCUS_STATS },
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
      {/* 里程碑详情弹窗 */}
      <Modal open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} title="里程碑详情" width={400}>
        {modalGoal && modalMilestone && (
          <Space direction="vertical" size={14} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircleOutlined style={{ color: modalMilestone.done ? '#22c55e' : '#d1d5db', fontSize: 22 }} />
              <Typography.Text style={{ fontWeight: 700, fontSize: 16, color: titleColor }}>{modalMilestone.title}</Typography.Text>
              <Tag style={{ borderRadius: 999, fontSize: 11, background: modalMilestone.done ? '#22c55e18' : '#f59e0b18', border: `1px solid ${modalMilestone.done ? '#22c55e44' : '#f59e0b44'}`, color: modalMilestone.done ? '#22c55e' : '#f59e0b' }}>{modalMilestone.done ? '已完成' : '进行中'}</Tag>
            </div>
            <div style={{ color: subColor, fontSize: 13 }}>所属目标：<Typography.Text style={{ fontWeight: 600, color: titleColor }}>{modalGoal.title}</Typography.Text></div>
            {modalGoal.description && <div style={{ color: subColor, fontSize: 13 }}>{modalGoal.description}</div>}
            {modalGoal.targetDate && <div style={{ color: subColor, fontSize: 13 }}>目标截止：{dayjs(modalGoal.targetDate).format('YYYY-MM-DD')}</div>}
            <div style={{ marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: subColor }}>
                <span>目标整体进度</span>
                <span>{Math.round((modalGoal.milestones?.filter(m => m.done).length || 0) / (modalGoal.milestones?.length || 1) * 100)}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }}>
                <div style={{ height: '100%', width: `${Math.round((modalGoal.milestones?.filter(m => m.done).length || 0) / (modalGoal.milestones?.length || 1) * 100)}%`, borderRadius: 4, background: modalGoal.color || accent, transition: 'width 0.5s' }} />
              </div>
            </div>
          </Space>
        )}
      </Modal>
      </>
      )}
    </Space>
  );
}
