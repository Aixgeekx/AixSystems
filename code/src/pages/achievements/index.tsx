// 成就中心 - 本地成就徽章展示 + 快捷导航
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import { CrownOutlined, FireOutlined, StarOutlined, TrophyOutlined, BarChartOutlined, LineChartOutlined, AimOutlined, HeartOutlined, DashboardOutlined, GoldOutlined, PieChartOutlined, SwapOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';
import { useAchievements } from '@/hooks/useAchievements';
import { useGameLevel } from '@/hooks/useGameLevel';

export default function AchievementsPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const achievements = useAchievements();
  const level = useGameLevel();

  const stats = useLiveQuery(async () => {
    const [items, sessions, habits, habitLogs, goals, diaries] = await Promise.all([
      db.items.filter(i => !i.deletedAt && i.completeStatus === 'done').count(),
      db.focusSessions.count(),
      db.habits.filter(h => !h.deletedAt).count(),
      db.habitLogs.count(),
      db.goals.filter(g => g.status === 'completed').count(),
      db.diaries.filter(d => !d.deletedAt).count()
    ]);
    return { doneItems: items, sessions, habits, checkins: habitLogs, completedGoals: goals, diaries };
  });

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const achievementList = achievements?.list || [];
  const unlockedCount = achievements?.unlockedCount || 0;
  const totalCount = achievements?.total || 0;
  const xpPercent = level?.levelProgress || 0;

  // 近期解锁（按解锁时间倒序）
  const recentUnlocked = achievementList
    .filter(a => a.unlocked && a.unlockedAt)
    .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
    .slice(0, 5);

  // 解锁趋势（近30天）
  const unlockTrend = useMemo(() => {
    const map: Record<string, number> = {};
    const today = dayjs().startOf('day');
    for (let i = 29; i >= 0; i--) {
      map[today.subtract(i, 'day').format('MM/DD')] = 0;
    }
    achievementList.forEach(a => {
      if (a.unlocked && a.unlockedAt) {
        const k = dayjs(a.unlockedAt).format('MM/DD');
        if (k in map) map[k]++;
      }
    });
    return Object.entries(map);
  }, [achievementList]);

  // 待解锁进度
  const lockProgress = useMemo(() => {
    return achievementList.filter(a => !a.unlocked).slice(0, 6).map(a => {
      let pct = 0;
      const done = stats?.doneItems || 0;
      const ses = stats?.sessions || 0;
      const chk = stats?.checkins || 0;
      const di = stats?.diaries || 0;
      const cg = stats?.completedGoals || 0;
      const tr = (stats?.doneItems || 0) + ses + chk + di + cg + (stats?.habits || 0);
      if (a.id === 'streak_7') pct = Math.min(100, Math.round((chk / 7) * 100));
      else if (a.id === 'streak_30') pct = Math.min(100, Math.round((chk / 30) * 100));
      else if (a.id === 'streak_60') pct = Math.min(100, Math.round((chk / 60) * 100));
      else if (a.id === 'streak_100') pct = Math.min(100, Math.round((chk / 100) * 100));
      else if (a.id === 'focus_10h') pct = Math.min(100, Math.round((ses / 600) * 100));
      else if (a.id === 'focus_100h') pct = Math.min(100, Math.round((ses / 3600) * 100));
      else if (a.id === 'focus_1000h') pct = Math.min(100, Math.round(((ses * 10 / 60) / 1000) * 100));
      else if (a.id === 'diary_30') pct = Math.min(100, Math.round((di / 30) * 100));
      else if (a.id === 'diary_100') pct = Math.min(100, Math.round((di / 100) * 100));
      else if (a.id === 'goal_5') pct = Math.min(100, Math.round((cg / 5) * 100));
      else if (a.id === 'goal_10') pct = Math.min(100, Math.round((cg / 10) * 100));
      else if (a.id === 'records_100') pct = Math.min(100, Math.round((tr / 100) * 100));
      else if (a.id === 'records_1000') pct = Math.min(100, Math.round((tr / 1000) * 100));
      return { ...a, progress: pct };
    });
  }, [achievementList, stats]);
  const categoryPie = useMemo(() => {
    const cats: Record<string, { name: string; color: string; value: number }> = {
      habit: { name: '习惯', color: '#22c55e', value: 0 },
      focus: { name: '专注', color: '#f59e0b', value: 0 },
      diary: { name: '日记', color: '#8b5cf6', value: 0 },
      goal: { name: '目标', color: '#3b82f6', value: 0 },
      milestone: { name: '里程碑', color: '#ec4899', value: 0 },
    };
    achievementList.forEach(a => {
      const cat = a.id.split('_')[0];
      if (cats[cat]) cats[cat].value++;
      else cats.milestone.value++;
    });
    return Object.values(cats).filter(c => c.value > 0);
  }, [achievementList]);

  const trendOption = useMemo(() => {
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, top: 24, bottom: 24 },
      xAxis: { type: 'category', data: unlockTrend.map(d => d[0]), axisLine: { lineStyle: { color: isDark ? '#ffffff44' : '#00000033' } }, axisLabel: { color: subColor, fontSize: 10 } },
      yAxis: { type: 'value', minInterval: 1, axisLine: { show: false }, splitLine: { lineStyle: { color: isDark ? '#ffffff11' : '#0000000d' } }, axisLabel: { color: subColor, fontSize: 10 } },
      series: [{ data: unlockTrend.map(d => d[1]), type: 'line', smooth: true, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${accent}88` }, { offset: 1, color: `${accent}11` }] } }, lineStyle: { color: accent, width: 2 }, itemStyle: { color: accent }, symbol: 'circle', symbolSize: 4 }]
    };
  }, [unlockTrend, accent, subColor, isDark]);

  const pieOption = useMemo(() => {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, textStyle: { color: subColor, fontSize: 11 }, itemWidth: 10, itemHeight: 10 },
      series: [{
        type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
        label: { show: true, color: titleColor, fontSize: 11, formatter: '{b}\n{c}' },
        labelLine: { lineStyle: { color: isDark ? '#ffffff44' : '#00000033' } },
        data: categoryPie.map(c => ({ value: c.value, name: c.name, itemStyle: { color: c.color } }))
      }]
    };
  }, [categoryPie, subColor, titleColor, isDark]);

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : 'linear-gradient(135deg, #f59e0b, #d97706 52%, #0f172a)',
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(245,158,11,0.18)'
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><TrophyOutlined /> 成就中心</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 8px', color: '#fff' }}>成就徽章墙</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>已解锁 {unlockedCount}/{totalCount} 枚成就徽章</Typography.Text>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Space direction="vertical" size={16} style={{ width: '100%', textAlign: 'center' }}>
              <Typography.Title level={4} style={{ margin: 0, color: titleColor }}><CrownOutlined /> 等级</Typography.Title>
              <div style={{ fontSize: 64, fontWeight: 900, color: accent }}>{level?.level || 1}</div>
              <Progress percent={xpPercent} strokeColor={accent} format={() => `${level?.totalXp || 0} XP`} />
              <Tag color="gold" style={{ borderRadius: 999, padding: '4px 16px' }}>Lv.{level?.level || 1} {level?.title || '新手'}</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><StarOutlined /> 数据总览</Typography.Title>
            <Row gutter={[12, 12]}>
              {[
                { label: '已完成事项', value: stats?.doneItems || 0, color: '#22c55e' },
                { label: '专注次数', value: stats?.sessions || 0, color: '#f59e0b' },
                { label: '习惯打卡', value: stats?.checkins || 0, color: '#8b5cf6' },
                { label: '完成目标', value: stats?.completedGoals || 0, color: '#3b82f6' },
                { label: '日记篇数', value: stats?.diaries || 0, color: '#ec4899' },
                { label: '活跃习惯', value: stats?.habits || 0, color: '#14b8a6' }
              ].map(item => (
                <Col xs={12} md={8} key={item.label}>
                  <div style={{ borderRadius: 16, padding: 14, textAlign: 'center', background: isDark ? `${item.color}14` : `${item.color}0f`, border: `1px solid ${item.color}22` }}>
                    <Typography.Title level={4} style={{ margin: 0, color: item.color }}>{item.value}</Typography.Title>
                    <Typography.Text style={{ color: subColor, fontSize: 12 }}>{item.label}</Typography.Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><LineChartOutlined /> 近30天解锁趋势</Typography.Title>
            <ReactECharts option={trendOption} style={{ height: 220 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><PieChartOutlined /> 成就分类分布</Typography.Title>
            <ReactECharts option={pieOption} style={{ height: 220 }} />
          </Card>
        </Col>
      </Row>

      {/* 待解锁进度 */}
      {lockProgress.length > 0 && (
        <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><SwapOutlined /> 待解锁进度</Typography.Title>
          <Row gutter={[12, 12]}>
            {lockProgress.map(a => (
              <Col xs={24} sm={12} md={8} key={a.id}>
                <div style={{ borderRadius: 14, padding: 14, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 20, opacity: 0.5 }}>{a.icon}</span>
                    <div>
                      <Typography.Text style={{ display: 'block', color: titleColor, fontWeight: 600, fontSize: 13 }}>{a.name}</Typography.Text>
                      <Typography.Text style={{ color: subColor, fontSize: 11 }}>{a.desc}</Typography.Text>
                    </div>
                  </div>
                  <Progress percent={a.progress} strokeColor={a.color} showInfo size="small" />
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><FireOutlined /> 徽章墙</Typography.Title>
        <Row gutter={[12, 12]}>
          {achievementList.map(a => (
            <Col xs={12} sm={8} md={6} lg={4} key={a.id}>
              <div style={{
                borderRadius: 18, padding: 16, textAlign: 'center',
                background: a.unlocked ? (isDark ? `${a.color}22` : `${a.color}12`) : (isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'),
                border: `1px solid ${a.unlocked ? `${a.color}44` : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0')}`,
                opacity: a.unlocked ? 1 : 0.5
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{a.icon}</div>
                <Typography.Text style={{ display: 'block', color: titleColor, fontWeight: 600, fontSize: 13 }}>{a.name}</Typography.Text>
                <Typography.Text style={{ color: subColor, fontSize: 11 }}>{a.desc}</Typography.Text>
                {a.unlocked && <Tag color="success" style={{ marginTop: 8, borderRadius: 999, fontSize: 11 }}>已解锁</Tag>}
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 近期解锁动态 */}
      {recentUnlocked.length > 0 && (
        <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><FireOutlined /> 近期解锁</Typography.Title>
          <Row gutter={[12, 12]}>
            {recentUnlocked.map(a => (
              <Col xs={12} sm={8} md={6} lg={4} key={a.id}>
                <div style={{
                  borderRadius: 18, padding: 14, textAlign: 'center',
                  background: isDark ? `${a.color}22` : `${a.color}12`,
                  border: `1px solid ${a.color}44`
                }}>
                  <div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div>
                  <Typography.Text style={{ display: 'block', color: titleColor, fontWeight: 600, fontSize: 13 }}>{a.name}</Typography.Text>
                  <Typography.Text style={{ color: subColor, fontSize: 11 }}>{a.unlockedAt ? dayjs(a.unlockedAt).format('MM/DD HH:mm') : ''}</Typography.Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 快捷导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注统计详情', icon: <BarChartOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_STATS },
            { label: '习惯统计', icon: <LineChartOutlined />, color: '#22c55e', path: ROUTES.HABIT_STATS },
            { label: '目标时间线', icon: <AimOutlined />, color: '#3b82f6', path: ROUTES.GOAL_TIMELINE },
            { label: '情绪趋势', icon: <HeartOutlined />, color: '#ec4899', path: ROUTES.DIARY_MOOD_TRENDS },
            { label: '数据总览', icon: <DashboardOutlined />, color: '#3b82f6', path: ROUTES.DATA_OVERVIEW },
            { label: '成长月报', icon: <GoldOutlined />, color: '#8b5cf6', path: ROUTES.GROWTH_MONTHLY },
          ].map(item => (
            <Col xs={12} sm={4} key={item.label}>
              <div onClick={() => nav(item.path)} style={{
                borderRadius: 16, padding: 16, textAlign: 'center', cursor: 'pointer',
                background: isDark ? `${item.color}14` : `${item.color}0f`,
                border: `1px solid ${item.color}22`,
                transition: 'all 0.2s'
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
