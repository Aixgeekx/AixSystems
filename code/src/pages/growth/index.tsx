// 成长仪表盘 - 整合习惯、目标、专注、事项的成长可视化 (v0.21.2)
import React, { Suspense, lazy } from 'react';
import { Card, Col, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  FireOutlined,
  FlagOutlined,
  TrophyOutlined,
  RiseOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

const ReactECharts = lazy(() => import('echarts-for-react'));

export default function GrowthPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const dashboard = useLiveQuery(async () => {
    const [items, diaries, memos, sessions, habits, habitLogs, goals] = await Promise.all([
      db.items.toArray(),
      db.diaries.toArray(),
      db.memos.toArray(),
      db.focusSessions.toArray(),
      db.habits.filter(h => !h.deletedAt).toArray(),
      db.habitLogs.toArray(),
      db.goals.filter(g => !g.deletedAt).toArray()
    ]);

    const todayStart = dayjs().startOf('day').valueOf();
    const weekStart = dayjs().startOf('week').valueOf();
    const monthStart = dayjs().startOf('month').valueOf();

    const todayItems = items.filter(i => !i.deletedAt && i.startTime >= todayStart && i.startTime <= dayjs().endOf('day').valueOf());
    const weekFocus = sessions.filter(s => s.startTime >= weekStart).reduce((s, v) => s + v.actualMs / 60_000, 0);
    const monthFocus = sessions.filter(s => s.startTime >= monthStart).reduce((s, v) => s + v.actualMs / 60_000, 0);

    const activeGoals = goals.filter(g => g.status === 'active');
    const completedGoals = goals.filter(g => g.status === 'completed');
    const activeGoalsList = activeGoals.slice(0, 4).map(g => ({
      id: g.id,
      title: g.title,
      color: g.color,
      progress: g.milestones?.length ? Math.round((g.milestones.filter(m => m.done).length / g.milestones.length) * 100) : 0,
      doneCount: g.milestones?.filter(m => m.done).length || 0,
      totalCount: g.milestones?.length || 0
    }));

    // 习惯本周打卡分布
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = dayjs().subtract(6 - i, 'day');
      const start = d.startOf('day').valueOf();
      const end = d.endOf('day').valueOf();
      const count = habitLogs.filter(l => l.date >= start && l.date <= end).length;
      return { day: d.format('ddd'), count };
    });

    return {
      totalItems: items.filter(i => !i.deletedAt).length,
      todayDone: todayItems.filter(i => i.completeStatus === 'done').length,
      todayTotal: todayItems.length,
      totalDiaries: diaries.filter(d => !d.deletedAt).length,
      totalMemos: memos.filter(m => !m.deletedAt).length,
      totalFocusMin: sessions.reduce((s, v) => s + v.actualMs / 60_000, 0),
      weekFocusMin: weekFocus,
      monthFocusMin: monthFocus,
      totalHabits: habits.length,
      totalGoals: goals.length,
      activeGoals: activeGoals.length,
      completedGoals: completedGoals.length,
      activeGoalsList,
      weekDays
    };
  }, []);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const tintedBg = (color: string) => isDark ? `${color}1a` : `${color}12`;

  const barOpt = {
    grid: { top: 24, right: 16, bottom: 30, left: 40 },
    xAxis: {
      type: 'category',
      data: dashboard?.weekDays.map(d => d.day) || [],
      axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1' } },
      axisLabel: { color: isDark ? 'rgba(255,255,255,0.6)' : '#64748b' }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(148,163,184,0.18)' } },
      axisLabel: { color: isDark ? 'rgba(255,255,255,0.5)' : '#94a3b8' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? 'rgba(10,14,28,0.9)' : 'rgba(255,255,255,0.95)',
      borderColor: isDark ? accent + '44' : '#e2e8f0',
      textStyle: { color: isDark ? '#f8fafc' : '#0f172a' }
    },
    series: [{
      type: 'bar',
      data: dashboard?.weekDays.map(d => d.count) || [],
      itemStyle: { color: accent, borderRadius: [6, 6, 0, 0] }
    }]
  };

  const statCards = [
    { label: '总事项', value: dashboard?.totalItems || 0, icon: <CalendarOutlined />, color: '#38bdf8' },
    { label: '日记篇数', value: dashboard?.totalDiaries || 0, icon: <RiseOutlined />, color: '#a78bfa' },
    { label: '备忘条数', value: dashboard?.totalMemos || 0, icon: <CheckCircleOutlined />, color: '#34d399' },
    { label: '专注时长', value: `${Math.round(dashboard?.totalFocusMin || 0)} 分`, icon: <FireOutlined />, color: '#f59e0b' }
  ];

  const todayCompletion = dashboard?.todayTotal ? Math.round((dashboard.todayDone / dashboard.todayTotal) * 100) : 0;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        className="anim-fade-in-up"
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(139,92,246,0.92) 44%, rgba(236,72,153,0.9) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(139,92,246,0.16)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(233,213,255,0.9)' }}>
              成长仪表盘
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
              看见自己的成长轨迹
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(226,232,240,0.84)' }}>
              整合习惯、目标、专注和事项数据，用一个页面看清自己每天都在向哪个方向前进。
            </Typography.Paragraph>
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="习惯数" value={dashboard?.totalHabits || 0} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="目标数" value={dashboard?.totalGoals || 0} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="已完成目标" value={dashboard?.completedGoals || 0} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {statCards.map((stat, i) => (
          <Col xs={24} md={12} xl={6} key={stat.label}>
            <Card
              bordered={false}
              className="anim-fade-in-up hover-lift"
              style={{
                borderRadius: 22,
                background: cardBg,
                border: cardBorder,
                boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)',
                animationDelay: `${0.08 + i * 0.06}s`
              }}
            >
              <Statistic
                title={<span style={{ display: 'flex', alignItems: 'center', gap: 6, color: subColor }}>{stat.icon} {stat.label}</span>}
                value={stat.value}
                valueStyle={{ fontSize: 32, fontWeight: 700, color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-2 hover-lift"
            style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
          >
            <Typography.Text style={{ color: subColor }}>今日状态</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>事项完成率</Typography.Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <Progress
                type="circle"
                percent={todayCompletion}
                size={120}
                strokeColor={accent}
                trailColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'}
                format={v => <span style={{ color: titleColor, fontSize: 24, fontWeight: 700 }}>{v}%</span>}
              />
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: titleColor }}>{dashboard?.todayDone || 0} / {dashboard?.todayTotal || 0}</div>
                <div style={{ color: subColor, marginTop: 4 }}>今日事项已完成</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-3 hover-lift"
            style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
          >
            <Typography.Text style={{ color: subColor }}>专注统计</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>本周 / 本月</Typography.Title>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ padding: 16, borderRadius: 16, background: tintedBg('#38bdf8'), border: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#38bdf8', marginBottom: 8 }}>
                    <ClockCircleOutlined /> <span style={{ fontSize: 12, color: subColor }}>本周专注</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: titleColor }}>
                    {Math.round(dashboard?.weekFocusMin || 0)}
                  </div>
                  <div style={{ color: subColor, fontSize: 12 }}>分钟</div>
                </div>
              </Col>
              <Col span={12}>
                <div style={{ padding: 16, borderRadius: 16, background: tintedBg('#f59e0b'), border: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#f59e0b', marginBottom: 8 }}>
                    <FireOutlined /> <span style={{ fontSize: 12, color: subColor }}>本月专注</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: titleColor }}>
                    {Math.round(dashboard?.monthFocusMin || 0)}
                  </div>
                  <div style={{ color: subColor, fontSize: 12 }}>分钟</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-4"
            style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
          >
            <Typography.Text style={{ color: subColor }}>习惯打卡</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>近 7 天打卡分布</Typography.Title>
            <Suspense fallback={<div style={{ height: 240, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)', borderRadius: 12 }} />}>
              <ReactECharts option={barOpt} style={{ height: 240 }} theme={isDark ? 'dark' : undefined} />
            </Suspense>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-5"
            style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}
          >
            <Typography.Text style={{ color: subColor }}>目标进度</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>进行中目标概览</Typography.Title>
            {dashboard?.activeGoalsList ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {dashboard.activeGoalsList.length > 0 ? (
                  dashboard.activeGoalsList.map(goal => (
                    <div key={goal.id}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: goal.color }} />
                          <span style={{ color: titleColor, fontSize: 14, fontWeight: 500 }}>{goal.title}</span>
                        </div>
                        <span style={{ color: subColor, fontSize: 12 }}>{goal.doneCount} / {goal.totalCount}</span>
                      </div>
                      <Progress percent={goal.progress} strokeColor={goal.color} trailColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)'} showInfo={false} strokeLinecap="round" size={{ height: 6 }} />
                    </div>
                  ))
                ) : (
                  <Tag style={{ borderRadius: 6 }}>暂无进行中的目标</Tag>
                )}
                {dashboard.completedGoals > 0 && (
                  <Tag color="green" style={{ borderRadius: 6, fontSize: 14, padding: '4px 12px' }}>
                    已达成 {dashboard.completedGoals} 个目标
                  </Tag>
                )}
              </Space>
            ) : (
              <div style={{ color: subColor }}>加载中...</div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
