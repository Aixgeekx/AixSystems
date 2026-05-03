// 专注排行榜 - 专注时长排名与对比
import React, { useMemo } from 'react';
import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import { CrownOutlined, FireOutlined, TrophyOutlined, ThunderboltOutlined, BarChartOutlined, LineChartOutlined, AimOutlined, HeartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import ReactECharts from 'echarts-for-react';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

const MODE_LABELS: Record<string, string> = { countdown: '倒计时', stopwatch: '正计时', pomodoro: '番茄钟' };
const MODE_COLORS: Record<string, string> = { countdown: '#3b82f6', stopwatch: '#22c55e', pomodoro: '#f59e0b' };

export default function FocusRankingPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const sessions = useLiveQuery(() => db.focusSessions.toArray(), []);

  const now = dayjs();

  // 按天排名
  const dailyRanking = useMemo(() => {
    const map: Record<string, number> = {};
    (sessions || []).forEach(s => {
      const key = dayjs(s.startTime).format('YYYY-MM-DD');
      map[key] = (map[key] || 0) + Math.round(s.actualMs / 60_000);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [sessions]);

  // 按周排名
  const weeklyRanking = useMemo(() => {
    const map: Record<string, number> = {};
    (sessions || []).forEach(s => {
      const key = dayjs(s.startTime).startOf('week').format('YYYY-MM-DD');
      map[key] = (map[key] || 0) + Math.round(s.actualMs / 60_000);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [sessions]);

  // 按模式排名
  const modeRanking = useMemo(() => {
    const map: Record<string, number> = {};
    (sessions || []).forEach(s => {
      map[s.mode] = (map[s.mode] || 0) + Math.round(s.actualMs / 60_000);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [sessions]);

  // 按小时排名
  const hourRanking = useMemo(() => {
    const hours = Array(24).fill(0);
    (sessions || []).forEach(s => hours[dayjs(s.startTime).hour()] += Math.round(s.actualMs / 60_000));
    return hours.map((v, i) => [`${i}:00`, v] as [string, number]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [sessions]);

  const medalColors = ['#f59e0b', '#94a3b8', '#cd7f32'];
  const medalEmoji = ['🥇', '🥈', '🥉'];

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const dailyChartOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: dailyRanking.map(d => d[0].slice(5)), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: dailyRanking.map((d, i) => ({ value: d[1], itemStyle: { color: i < 3 ? medalColors[i] : accent, borderRadius: [4, 4, 0, 0] } })), barWidth: '60%' }]
  };

  const weeklyChartOption = {
    tooltip: { trigger: 'axis' as const },
    grid: { top: 20, right: 16, bottom: 28, left: 40 },
    xAxis: { type: 'category' as const, data: weeklyRanking.map(d => d[0].slice(5)), axisLabel: { color: subColor, fontSize: 10 } },
    yAxis: { type: 'value' as const, axisLabel: { color: subColor, fontSize: 11 }, splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' } } },
    series: [{ type: 'bar', data: weeklyRanking.map((d, i) => ({ value: d[1], itemStyle: { color: i < 3 ? medalColors[i] : accent, borderRadius: [4, 4, 0, 0] } })), barWidth: '55%' }]
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #f59e0b, #d97706 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><CrownOutlined /> 专注排行榜</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>专注时长排名</Typography.Title>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><TrophyOutlined /> 日专注 TOP 10</Typography.Title>
            <ReactECharts option={dailyChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><FireOutlined /> 周专注 TOP 8</Typography.Title>
            <ReactECharts option={weeklyChartOption} style={{ height: 280 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><ThunderboltOutlined /> 模式时长排名</Typography.Title>
            {modeRanking.map(([mode, min], i) => (
              <div key={mode} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{medalEmoji[i] || `${i + 1}`}</span>
                <Tag style={{ borderRadius: 999, fontSize: 12, background: `${MODE_COLORS[mode]}18`, border: `1px solid ${MODE_COLORS[mode]}44`, color: MODE_COLORS[mode] }}>{MODE_LABELS[mode]}</Tag>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                    <div style={{ height: '100%', width: `${Math.round(min / (modeRanking[0]?.[1] || 1) * 100)}%`, borderRadius: 4, background: MODE_COLORS[mode], transition: 'width 0.5s' }} />
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: titleColor, minWidth: 50, textAlign: 'right' }}>{min}分</span>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}><CrownOutlined /> 最佳专注时段</Typography.Title>
            {hourRanking.map(([hour, min], i) => (
              <div key={hour} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{medalEmoji[i] || `${i + 1}`}</span>
                <span style={{ fontWeight: 600, color: titleColor, minWidth: 50 }}>{hour}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9' }}>
                    <div style={{ height: '100%', width: `${Math.round(min / (hourRanking[0]?.[1] || 1) * 100)}%`, borderRadius: 4, background: accent, transition: 'width 0.5s' }} />
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: titleColor, minWidth: 50, textAlign: 'right' }}>{min}分</span>
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注统计详情', icon: <BarChartOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_STATS },
            { label: '习惯统计', icon: <LineChartOutlined />, color: '#22c55e', path: ROUTES.HABIT_STATS },
            { label: '目标时间线', icon: <AimOutlined />, color: '#3b82f6', path: ROUTES.GOAL_TIMELINE },
            { label: '情绪趋势', icon: <HeartOutlined />, color: '#ec4899', path: ROUTES.DIARY_MOOD_TRENDS }
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
