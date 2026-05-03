// 成长月报 - 月度综合成长报告
import React, { useMemo } from 'react';
import { Card, Col, Progress, Row, Space, Typography } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, FireOutlined, TrophyOutlined, BookOutlined, AimOutlined, HeartOutlined, BarChartOutlined, RiseOutlined, CrownOutlined, BulbOutlined, LineChartOutlined, UnorderedListOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

export default function GrowthMonthlyPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const now = dayjs();
  const monthStart = now.startOf('month');
  const lastMonthStart = monthStart.subtract(1, 'month');
  const lastMonthEnd = monthStart.subtract(1, 'day').endOf('day');

  const items = useLiveQuery(() => db.items.filter(i => !i.deletedAt).toArray(), []);
  const sessions = useLiveQuery(() => db.focusSessions.toArray(), []);
  const habits = useLiveQuery(() => db.habits.filter(h => !h.deletedAt).toArray(), []);
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), []);
  const diaries = useLiveQuery(() => db.diaries.filter(d => !d.deletedAt).toArray(), []);
  const goals = useLiveQuery(() => db.goals.filter(g => !g.deletedAt).toArray(), []);

  const stats = useMemo(() => {
    const thisMonth = (items || []).filter(i => i.updatedAt >= monthStart.valueOf());
    const lastMonth = (items || []).filter(i => i.updatedAt >= lastMonthStart.valueOf() && i.updatedAt <= lastMonthEnd.valueOf());
    const doneThisMonth = thisMonth.filter(i => i.completeStatus === 'done').length;
    const doneLastMonth = lastMonth.filter(i => i.completeStatus === 'done').length;
    const overdueThisMonth = thisMonth.filter(i => i.endTime && dayjs(i.endTime).isBefore(now, 'day') && i.completeStatus !== 'done').length;

    // 专注
    const focusThis = (sessions || []).filter(s => s.startTime >= monthStart.valueOf());
    const focusLast = (sessions || []).filter(s => s.startTime >= lastMonthStart.valueOf() && s.startTime <= lastMonthEnd.valueOf());
    const focusMinThis = Math.round(focusThis.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const focusMinLast = Math.round(focusLast.reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
    const focusDays = new Set(focusThis.map(s => dayjs(s.startTime).format('YYYYMMDD'))).size;

    // 习惯
    const hLogsThis = (habitLogs || []).filter(l => l.date >= monthStart.valueOf() && l.date <= now.valueOf());
    const hLogsLast = (habitLogs || []).filter(l => l.date >= lastMonthStart.valueOf() && l.date <= lastMonthEnd.valueOf());
    const totalHabits = (habits || []).length;
    const daysInMonth = now.date();
    const habitRate = totalHabits > 0 && daysInMonth > 0 ? Math.round(hLogsThis.length / (totalHabits * daysInMonth) * 100) : 0;
    const habitRateLast = totalHabits > 0 ? Math.round(hLogsLast.length / (totalHabits * lastMonthEnd.date()) * 100) : 0;

    // 日记
    const diaryThis = (diaries || []).filter(d => d.date >= monthStart.valueOf());
    const diaryLast = (diaries || []).filter(d => d.date >= lastMonthStart.valueOf() && d.date <= lastMonthEnd.valueOf());

    // 目标
    const activeGoals = (goals || []).filter(g => g.status === 'active');
    const completedGoals = (goals || []).filter(g => g.status === 'completed' && g.updatedAt >= monthStart.valueOf());
    const goalMilestonesTotal = activeGoals.reduce((s, g) => s + (g.milestones?.length || 0), 0);
    const goalMilestonesDone = activeGoals.reduce((s, g) => s + (g.milestones?.filter(m => m.done).length || 0), 0);

    // 每日专注分布
    const dailyFocus: { date: string; minutes: number }[] = [];
    for (let i = 0; i < daysInMonth; i++) {
      const d = monthStart.add(i, 'day');
      if (d.isAfter(now)) break;
      const de = d.endOf('day');
      const mins = Math.round(focusThis.filter(s => s.startTime >= d.valueOf() && s.startTime <= de.valueOf()).reduce((s, f) => s + (f.actualMs || 0), 0) / 60000);
      dailyFocus.push({ date: d.format('DD'), minutes: mins });
    }

    // 综合得分（百分制）
    const itemScore = doneThisMonth > 0 ? Math.min(doneThisMonth * 5, 30) : 0; // 最高30分
    const focusScore = Math.min(Math.round(focusMinThis / 10), 30); // 最高30分
    const habitScore = Math.min(Math.round(habitRate * 0.25), 25); // 最高25分
    const diaryScore = Math.min(diaryThis.length * 2, 15); // 最高15分
    const totalScore = Math.min(itemScore + focusScore + habitScore + diaryScore, 100);

    return {
      doneThisMonth, doneLastMonth, overdueThisMonth,
      focusMinThis, focusMinLast, focusDays,
      habitRate, habitRateLast, totalHabits,
      diaryThis: diaryThis.length, diaryLast: diaryLast.length,
      activeGoals: activeGoals.length, completedGoals: completedGoals.length,
      goalMilestonesTotal, goalMilestonesDone,
      dailyFocus,
      totalScore, itemScore, focusScore, habitScore, diaryScore,
      daysInMonth,
      // 环比
      itemChange: doneLastMonth > 0 ? Math.round((doneThisMonth - doneLastMonth) / doneLastMonth * 100) : (doneThisMonth > 0 ? 100 : 0),
      focusChange: focusMinLast > 0 ? Math.round((focusMinThis - focusMinLast) / focusMinLast * 100) : (focusMinThis > 0 ? 100 : 0),
      habitChange: habitRateLast > 0 ? Math.round((habitRate - habitRateLast) / habitRateLast * 100) : (habitRate > 0 ? 100 : 0),
      diaryChange: diaryLast.length > 0 ? Math.round((diaryThis.length - diaryLast.length) / diaryLast.length * 100) : (diaryThis.length > 0 ? 100 : 0),
    };
  }, [items, sessions, habits, habitLogs, diaries, goals]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const changeColor = (v: number) => v > 0 ? '#22c55e' : v < 0 ? '#ef4444' : subColor;
  const changeText = (v: number) => v > 0 ? `↑${v}%` : v < 0 ? `↓${Math.abs(v)}%` : '持平';

  // 每日专注柱状图
  const dailyOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 16, right: 12, bottom: 24, left: 40 },
    xAxis: { type: 'category' as const, data: stats.dailyFocus.map(d => d.date), axisLabel: { color: subColor, fontSize: 10, interval: 2 } },
    yAxis: { type: 'value' as const, name: '分钟', axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: stats.dailyFocus.map(d => d.minutes), itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] }, barWidth: '60%' }]
  };

  // 维度得分雷达
  const radarOption = {
    radar: {
      indicator: [
        { name: '事项完成', max: 30 }, { name: '专注时长', max: 30 },
        { name: '习惯打卡', max: 25 }, { name: '日记写作', max: 15 }
      ],
      axisName: { color: subColor, fontSize: 12 },
      splitArea: { areaStyle: { color: isDark ? ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.04)'] : ['#f8fafc', '#f1f5f9'] } }
    },
    series: [{
      type: 'radar' as const,
      data: [{ value: [stats.itemScore, stats.focusScore, stats.habitScore, stats.diaryScore], areaStyle: { color: `${accent}33` }, lineStyle: { color: accent }, itemStyle: { color: accent } }]
    }]
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #8b5cf6, #7c3aed 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><CalendarOutlined /> 成长月报</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>{now.format('YYYY年M月')} 成长报告</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.6)', fontSize: 13 }}>截至今日第 {stats.daysInMonth} 天</Typography.Text>
      </Card>

      {/* 综合得分 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, textAlign: 'center' }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>本月成长得分</Typography.Title>
        <Progress type="circle" percent={stats.totalScore} size={140} strokeColor={accent} format={p => <span style={{ fontSize: 32, fontWeight: 800, color: accent }}>{p}</span>} />
        <div style={{ marginTop: 12, color: subColor, fontSize: 13 }}>
          事项 {stats.itemScore} + 专注 {stats.focusScore} + 习惯 {stats.habitScore} + 日记 {stats.diaryScore}
        </div>
      </Card>

      {/* 核心指标 + 环比 */}
      <Row gutter={[16, 16]}>
        {[
          { label: '完成事项', value: stats.doneThisMonth, change: stats.itemChange, icon: <CheckCircleOutlined />, color: '#22c55e' },
          { label: '专注(分钟)', value: stats.focusMinThis, change: stats.focusChange, icon: <FireOutlined />, color: '#f59e0b' },
          { label: '习惯完成率', value: `${stats.habitRate}%`, change: stats.habitChange, icon: <TrophyOutlined />, color: '#8b5cf6' },
          { label: '日记篇数', value: stats.diaryThis, change: stats.diaryChange, icon: <BookOutlined />, color: '#ec4899' },
        ].map(m => (
          <Col xs={12} lg={6} key={m.label}>
            <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, height: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${m.color}18`, display: 'grid', placeItems: 'center', color: m.color, fontSize: 17 }}>{m.icon}</div>
                <span style={{ color: subColor, fontSize: 12 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: 12, color: changeColor(m.change), marginTop: 4 }}>{changeText(m.change)} 环比上月</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* 每日专注分布 */}
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>每日专注分布</Typography.Title>
            <ReactECharts option={dailyOption} style={{ height: 260 }} />
          </Card>
        </Col>
        {/* 维度得分雷达 */}
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>维度得分雷达</Typography.Title>
            <ReactECharts option={radarOption} style={{ height: 260 }} />
          </Card>
        </Col>
      </Row>

      {/* 目标进度 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><AimOutlined /> 目标进度</Typography.Title>
        <Row gutter={[16, 16]}>
          <Col xs={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#3b82f6' }}>{stats.activeGoals}</div>
              <div style={{ color: subColor, fontSize: 12 }}>进行中</div>
            </div>
          </Col>
          <Col xs={8}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#22c55e' }}>{stats.completedGoals}</div>
              <div style={{ color: subColor, fontSize: 12 }}>本月完成</div>
            </div>
          </Col>
          <Col xs={8}>
            <div style={{ textAlign: 'center' }}>
              <Progress type="circle" percent={stats.goalMilestonesTotal > 0 ? Math.round(stats.goalMilestonesDone / stats.goalMilestonesTotal * 100) : 0} size={60} strokeColor="#f59e0b" />
              <div style={{ color: subColor, fontSize: 12, marginTop: 4 }}>里程碑 {stats.goalMilestonesDone}/{stats.goalMilestonesTotal}</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 本月亮点 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><CrownOutlined /> 本月亮点</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            stats.focusDays >= 20 && { label: '专注达人', desc: `本月已专注 ${stats.focusDays} 天`, color: '#f59e0b', icon: <FireOutlined /> },
            stats.doneThisMonth >= 30 && { label: '事项达人', desc: `本月完成 ${stats.doneThisMonth} 项`, color: '#22c55e', icon: <CheckCircleOutlined /> },
            stats.habitRate >= 80 && { label: '习惯之星', desc: `习惯完成率 ${stats.habitRate}%`, color: '#8b5cf6', icon: <TrophyOutlined /> },
            stats.diaryThis >= 20 && { label: '日记达人', desc: `本月写了 ${stats.diaryThis} 篇`, color: '#ec4899', icon: <BookOutlined /> },
            stats.focusMinThis >= 1000 && { label: '千分专注', desc: `累计 ${stats.focusMinThis} 分钟`, color: '#3b82f6', icon: <ThunderboltOutlined /> },
            stats.totalScore >= 80 && { label: '全能学霸', desc: `综合得分 ${stats.totalScore}`, color: accent, icon: <CrownOutlined /> },
          ].filter(Boolean).map((b: any) => (
            <Col xs={12} sm={8} key={b.label}>
              <div style={{ borderRadius: 16, padding: 16, textAlign: 'center', background: isDark ? `${b.color}14` : `${b.color}0f`, border: `1px solid ${b.color}22` }}>
                <div style={{ fontSize: 28, color: b.color, marginBottom: 6 }}>{b.icon}</div>
                <div style={{ fontWeight: 700, color: titleColor, fontSize: 14 }}>{b.label}</div>
                <div style={{ color: subColor, fontSize: 12, marginTop: 4 }}>{b.desc}</div>
              </div>
            </Col>
          ))}
          {[stats.focusDays >= 20, stats.doneThisMonth >= 30, stats.habitRate >= 80, stats.diaryThis >= 20, stats.focusMinThis >= 1000, stats.totalScore >= 80].filter(Boolean).length === 0 && (
            <Col span={24}><div style={{ textAlign: 'center', color: subColor, padding: 20 }}>继续努力，各项成就正在解锁中...</div></Col>
          )}
        </Row>
      </Card>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '成长仪表盘', icon: <RiseOutlined />, color: '#ec4899', path: ROUTES.GROWTH },
            { label: '报告中心', icon: <BarChartOutlined />, color: '#3b82f6', path: ROUTES.REPORTS },
            { label: '成就中心', icon: <TrophyOutlined />, color: '#f59e0b', path: ROUTES.ACHIEVEMENTS },
            { label: '周复盘', icon: <CalendarOutlined />, color: '#22c55e', path: ROUTES.WEEKLY_REVIEW },
          ].map(item => (
            <Col xs={12} sm={6} key={item.label}>
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
