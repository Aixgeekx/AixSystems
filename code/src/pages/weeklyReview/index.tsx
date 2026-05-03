// 周复盘 - 自动周度数据汇总与趋势对比
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, FireOutlined, TrophyOutlined, RiseOutlined, ClockCircleOutlined, BookOutlined, AimOutlined, CrownOutlined, BarChartOutlined, HeartOutlined, LineChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

const MOOD_LABELS: Record<string, string> = { happy: '开心', calm: '平静', excited: '兴奋', sad: '难过', anxious: '焦虑', angry: '生气', tired: '疲惫', grateful: '感恩' };

export default function WeeklyReviewPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const sessions = useLiveQuery(() => db.focusSessions.toArray(), []);
  const habits = useLiveQuery(() => db.habits.filter(h => !h.deletedAt).toArray(), []);
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), []);
  const goals = useLiveQuery(() => db.goals.filter(g => !g.deletedAt).toArray(), []);
  const diaries = useLiveQuery(() => db.diaries.filter(d => !d.deletedAt).toArray(), []);
  const items = useLiveQuery(() => db.items.filter(i => !i.deletedAt).toArray(), []);

  const now = dayjs();
  const weekStart = now.startOf('week');
  const lastWeekStart = weekStart.subtract(1, 'week');
  const lastWeekEnd = weekStart.subtract(1, 'millisecond');

  const stats = useMemo(() => {
    // 专注
    const thisWeekSessions = (sessions || []).filter(s => s.startTime >= weekStart.valueOf());
    const lastWeekSessions = (sessions || []).filter(s => s.startTime >= lastWeekStart.valueOf() && s.startTime < weekStart.valueOf());
    const thisWeekFocusMin = Math.round(thisWeekSessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const lastWeekFocusMin = Math.round(lastWeekSessions.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);

    // 习惯
    const thisWeekLogs = (habitLogs || []).filter(l => l.date >= weekStart.valueOf());
    const lastWeekLogs = (habitLogs || []).filter(l => l.date >= lastWeekStart.valueOf() && l.date < weekStart.valueOf());
    const habitCount = (habits || []).length;
    const thisWeekHabitRate = habitCount > 0 ? Math.round(thisWeekLogs.length / (habitCount * 7) * 100) : 0;
    const lastWeekHabitRate = habitCount > 0 ? Math.round(lastWeekLogs.length / (habitCount * 7) * 100) : 0;

    // 目标
    const activeGoals = (goals || []).filter(g => g.status === 'active');
    const goalProgress = activeGoals.map(g => {
      const total = g.milestones?.length || 0;
      const done = g.milestones?.filter(m => m.done).length || 0;
      return { name: g.title, progress: total > 0 ? Math.round(done / total * 100) : 0, color: g.color || accent };
    });

    // 日记
    const thisWeekDiaries = (diaries || []).filter(d => dayjs(d.date).valueOf() >= weekStart.valueOf());
    const lastWeekDiaries = (diaries || []).filter(d => dayjs(d.date).valueOf() >= lastWeekStart.valueOf() && dayjs(d.date).valueOf() < weekStart.valueOf());
    const moods: Record<string, number> = {};
    thisWeekDiaries.forEach(d => { if (d.mood) moods[d.mood] = (moods[d.mood] || 0) + 1; });
    const topMood = Object.entries(moods).sort((a, b) => b[1] - a[1])[0];

    // 事项
    const thisWeekDone = (items || []).filter(i => i.completeStatus === 'done' && i.updatedAt >= weekStart.valueOf()).length;
    const lastWeekDone = (items || []).filter(i => i.completeStatus === 'done' && i.updatedAt >= lastWeekStart.valueOf() && i.updatedAt < weekStart.valueOf()).length;

    // 每日专注分布
    const dailyFocus: number[] = [];
    for (let i = 0; i < 7; i++) {
      const day = weekStart.add(i, 'day');
      const dayEnd = day.endOf('day');
      const mins = Math.round(thisWeekSessions.filter(s => s.startTime >= day.valueOf() && s.startTime <= dayEnd.valueOf()).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      dailyFocus.push(mins);
    }

    return {
      thisWeekFocusMin, lastWeekFocusMin, thisWeekHabitRate, lastWeekHabitRate,
      goalProgress, thisWeekDiaries: thisWeekDiaries.length, lastWeekDiaries: lastWeekDiaries.length,
      topMood, thisWeekDone, lastWeekDone, dailyFocus, thisWeekSessions: thisWeekSessions.length
    };
  }, [sessions, habits, habitLogs, goals, diaries, items]);

  const diff = (cur: number, prev: number) => {
    const d = cur - prev;
    return { text: `${d > 0 ? '+' : ''}${d}`, color: d >= 0 ? '#22c55e' : '#ef4444' };
  };

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const focusChartOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 16, right: 12, bottom: 24, left: 36 },
    xAxis: { type: 'category' as const, data: ['一', '二', '三', '四', '五', '六', '日'], axisLabel: { color: subColor, fontSize: 11 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.dailyFocus, itemStyle: { color: accent, borderRadius: [4, 4, 0, 0] }, barWidth: '45%' }]
  };

  const weekLabel = `${weekStart.format('MM/DD')} - ${now.format('MM/DD')}`;

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #8b5cf6, #7c3aed 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><CalendarOutlined /> 周复盘</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>{weekLabel} 周度总结</Typography.Title>
      </Card>

      {/* 核心指标 */}
      <Row gutter={[16, 16]}>
        {[
          { label: '本周专注', value: `${stats.thisWeekFocusMin}分`, sub: `上周 ${stats.lastWeekFocusMin}分`, diff: diff(stats.thisWeekFocusMin, stats.lastWeekFocusMin), icon: <ClockCircleOutlined />, color: '#f59e0b' },
          { label: '习惯完成率', value: `${stats.thisWeekHabitRate}%`, sub: `上周 ${stats.lastWeekHabitRate}%`, diff: diff(stats.thisWeekHabitRate, stats.lastWeekHabitRate), icon: <FireOutlined />, color: '#22c55e' },
          { label: '完成事项', value: `${stats.thisWeekDone}`, sub: `上周 ${stats.lastWeekDone}`, diff: diff(stats.thisWeekDone, stats.lastWeekDone), icon: <CheckCircleOutlined />, color: '#3b82f6' },
          { label: '日记篇数', value: `${stats.thisWeekDiaries}`, sub: `上周 ${stats.lastWeekDiaries}`, diff: diff(stats.thisWeekDiaries, stats.lastWeekDiaries), icon: <BookOutlined />, color: '#ec4899' }
        ].map(m => (
          <Col xs={12} lg={6} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 17 }}>{m.icon}</div>
                <span style={{ color: subColor, fontSize: 12 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <span style={{ color: subColor, fontSize: 11 }}>{m.sub}</span>
                <Tag style={{ borderRadius: 999, fontSize: 11, background: `${m.diff.color}18`, border: `1px solid ${m.diff.color}44`, color: m.diff.color }}>{m.diff.text}</Tag>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 每日专注分布 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><BarChartOutlined /> 每日专注分布</Typography.Title>
        <ReactECharts option={focusChartOption} style={{ height: 220 }} />
      </Card>

      {/* 目标进度 */}
      {stats.goalProgress.length > 0 && (
        <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><AimOutlined /> 目标进度</Typography.Title>
          <Row gutter={[12, 12]}>
            {stats.goalProgress.map(g => (
              <Col xs={12} sm={8} md={6} key={g.name}>
                <div style={{ textAlign: 'center', padding: 12, borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                  <Progress type="circle" percent={g.progress} strokeColor={g.color} size={64} format={() => `${g.progress}%`} />
                  <div style={{ color: titleColor, fontWeight: 600, fontSize: 12, marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* 情绪概览 */}
      {stats.topMood && (
        <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><HeartOutlined /> 本周情绪</Typography.Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 48 }}>{
              stats.topMood[0] === 'happy' ? '😊' : stats.topMood[0] === 'calm' ? '😌' : stats.topMood[0] === 'excited' ? '🤩' :
              stats.topMood[0] === 'sad' ? '😢' : stats.topMood[0] === 'anxious' ? '😰' : stats.topMood[0] === 'angry' ? '😠' :
              stats.topMood[0] === 'tired' ? '😩' : stats.topMood[0] === 'grateful' ? '🙏' : '😐'
            }</div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: titleColor }}>主导情绪：{MOOD_LABELS[stats.topMood[0]] || stats.topMood[0]}</div>
              <div style={{ color: subColor, fontSize: 13 }}>出现 {stats.topMood[1]} 次</div>
            </div>
          </div>
        </Card>
      )}

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注排行榜', icon: <CrownOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_RANKING },
            { label: '习惯热力图', icon: <CalendarOutlined />, color: '#14b8a6', path: ROUTES.HABIT_HEATMAP },
            { label: '目标时间线', icon: <AimOutlined />, color: '#3b82f6', path: ROUTES.GOAL_TIMELINE },
            { label: '情绪趋势', icon: <HeartOutlined />, color: '#ec4899', path: ROUTES.DIARY_MOOD_TRENDS },
            { label: '专注统计详情', icon: <BarChartOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_STATS },
            { label: '习惯统计', icon: <LineChartOutlined />, color: '#22c55e', path: ROUTES.HABIT_STATS },
            { label: '日记统计', icon: <BookOutlined />, color: '#8b5cf6', path: ROUTES.DIARY_STATS },
            { label: '心情日历', icon: <HeartOutlined />, color: '#ec4899', path: ROUTES.MOOD_CALENDAR }
          ].map(item => (
            <Col xs={12} sm={6} key={item.label}>
              <div onClick={() => nav(item.path)} style={{
                borderRadius: 16, padding: 14, textAlign: 'center', cursor: 'pointer',
                background: isDark ? `${item.color}14` : `${item.color}0f`,
                border: `1px solid ${item.color}22`, transition: 'all 0.2s'
              }}>
                <div style={{ fontSize: 22, color: item.color, marginBottom: 4 }}>{item.icon}</div>
                <Typography.Text style={{ color: titleColor, fontWeight: 600, fontSize: 12 }}>{item.label}</Typography.Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </Space>
  );
}
