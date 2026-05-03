// 习惯热力图 - GitHub 风格打卡热力图
import React, { useMemo, useState } from 'react';
import { Card, Col, Row, Select, Space, Statistic, Tag, Typography } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, FireOutlined, HeatMapOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

const LEVELS = [0, 1, 2, 3, 4]; // 打卡强度等级
const LEVEL_COLORS_LIGHT = ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'];
const LEVEL_COLORS_DARK = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

function getWeeksInRange(start: dayjs.Dayjs, end: dayjs.Dayjs) {
  const weeks: dayjs.Dayjs[][] = [];
  let cur = start.startOf('week');
  while (cur.isBefore(end) || cur.isSame(end, 'day')) {
    const week: dayjs.Dayjs[] = [];
    for (let d = 0; d < 7; d++) {
      const day = cur.add(d, 'day');
      if (day.isAfter(end)) break;
      week.push(day);
    }
    if (week.length) weeks.push(week);
    cur = cur.add(1, 'week');
  }
  return weeks;
}

export default function HabitHeatmapPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [selectedHabit, setSelectedHabit] = useState<string>('all');

  const habits = useLiveQuery(() => db.habits.filter(h => !h.deletedAt).toArray(), []);
  const habitLogs = useLiveQuery(() => db.habitLogs.toArray(), []);

  const now = dayjs();
  const start = now.subtract(6, 'month').startOf('week');
  const weeks = useMemo(() => getWeeksInRange(start, now), []);

  const logMap = useMemo(() => {
    const map: Record<string, number> = {};
    (habitLogs || []).forEach(l => {
      if (selectedHabit !== 'all' && l.habitId !== selectedHabit) return;
      const key = dayjs(l.date).format('YYYY-MM-DD');
      map[key] = (map[key] || 0) + l.count;
    });
    return map;
  }, [habitLogs, selectedHabit]);

  const maxCount = useMemo(() => Math.max(1, ...Object.values(logMap)), [logMap]);

  const getLevel = (count: number) => {
    if (count === 0) return 0;
    const ratio = count / maxCount;
    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;
    return 4;
  };

  const colors = isDark ? LEVEL_COLORS_DARK : LEVEL_COLORS_LIGHT;

  // 统计
  const totalCheckins = useMemo(() => Object.values(logMap).reduce((s, v) => s + v, 0), [logMap]);
  const activeDays = useMemo(() => Object.values(logMap).filter(v => v > 0).length, [logMap]);
  const currentStreak = useMemo(() => {
    let streak = 0;
    let d = now.startOf('day');
    while (true) {
      const key = d.format('YYYY-MM-DD');
      if ((logMap[key] || 0) > 0) { streak++; d = d.subtract(1, 'day'); }
      else break;
    }
    return streak;
  }, [logMap, now]);
  const maxStreak = useMemo(() => {
    let max = 0, streak = 0;
    let d = start.startOf('day');
    while (d.isBefore(now)) {
      const key = d.format('YYYY-MM-DD');
      if ((logMap[key] || 0) > 0) { streak++; max = Math.max(max, streak); }
      else streak = 0;
      d = d.add(1, 'day');
    }
    return max;
  }, [logMap, start, now]);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const months = useMemo(() => {
    const set = new Set<string>();
    weeks.forEach(w => w.forEach(d => set.add(d.format('MMM'))));
    return Array.from(set);
  }, [weeks]);

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #22c55e, #16a34a 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><CalendarOutlined /> 习惯热力图</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>打卡热力图</Typography.Title>
          </div>
          <Select value={selectedHabit} onChange={setSelectedHabit} style={{ width: 150 }}
            options={[{ value: 'all', label: '全部习惯' }, ...(habits || []).map(h => ({ value: h.id, label: h.name }))]} />
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '总打卡次数', value: totalCheckins, icon: <CheckCircleOutlined />, color: '#22c55e' },
          { label: '活跃天数', value: activeDays, icon: <CalendarOutlined />, color: '#3b82f6' },
          { label: '当前连续', value: `${currentStreak}天`, icon: <FireOutlined />, color: '#f59e0b' },
          { label: '最长连续', value: `${maxStreak}天`, icon: <HeatMapOutlined />, color: '#ec4899' }
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
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>近 6 个月打卡热力图</Typography.Title>
        <div style={{ overflowX: 'auto', padding: '8px 0' }}>
          {/* 月份标签 */}
          <div style={{ display: 'flex', marginLeft: 32, marginBottom: 4 }}>
            {months.map(m => (
              <span key={m} style={{ color: subColor, fontSize: 11, minWidth: 40 }}>{m}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {/* 星期标签 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4, paddingTop: 2 }}>
              {['日', '一', '二', '三', '四', '五', '六'].map((d, i) => (
                <div key={d} style={{ height: 14, display: 'flex', alignItems: 'center', color: subColor, fontSize: 10, visibility: i % 2 === 0 ? 'visible' : 'hidden' }}>{d}</div>
              ))}
            </div>
            {/* 热力图格子 */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {week.map(day => {
                  const key = day.format('YYYY-MM-DD');
                  const count = logMap[key] || 0;
                  const level = getLevel(count);
                  const isFuture = day.isAfter(now, 'day');
                  return (
                    <div key={key} title={`${key}: ${count}次`} style={{
                      width: 14, height: 14, borderRadius: 3,
                      background: isFuture ? 'transparent' : colors[level],
                      border: isFuture ? `1px dashed ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}` : 'none',
                      transition: 'background 0.2s'
                    }} />
                  );
                })}
              </div>
            ))}
          </div>
          {/* 图例 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, marginLeft: 32 }}>
            <span style={{ color: subColor, fontSize: 11 }}>少</span>
            {colors.map((c, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
            ))}
            <span style={{ color: subColor, fontSize: 11 }}>多</span>
          </div>
        </div>
      </Card>

      {/* 习惯列表 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>习惯打卡概览</Typography.Title>
        <Row gutter={[12, 12]}>
          {(habits || []).map(h => {
            const logs = (habitLogs || []).filter(l => l.habitId === h.id);
            const total = logs.reduce((s, l) => s + l.count, 0);
            const recentLogs = logs.filter(l => l.date >= now.subtract(7, 'day').startOf('day').valueOf());
            const weekCount = recentLogs.reduce((s, l) => s + l.count, 0);
            return (
              <Col xs={12} sm={8} md={6} key={h.id}>
                <div style={{
                  borderRadius: 16, padding: 14, textAlign: 'center',
                  background: isDark ? `${h.color}14` : `${h.color}0f`,
                  border: `1px solid ${h.color}22`
                }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{h.icon || '🎯'}</div>
                  <Typography.Text style={{ display: 'block', color: titleColor, fontWeight: 600, fontSize: 13 }}>{h.name}</Typography.Text>
                  <div style={{ color: subColor, fontSize: 11, marginTop: 4 }}>本周 {weekCount} 次 / 总计 {total} 次</div>
                  <div style={{ height: 4, borderRadius: 2, background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', marginTop: 8 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, weekCount / Math.max(1, h.targetCount * 7) * 100)}%`, borderRadius: 2, background: h.color, transition: 'width 0.5s' }} />
                  </div>
                </div>
              </Col>
            );
          })}
          {(!habits || habits.length === 0) && (
            <Col span={24}>
              <div style={{ textAlign: 'center', color: subColor, padding: 30 }}>暂无习惯，去习惯追踪创建一个吧</div>
            </Col>
          )}
        </Row>
      </Card>
    </Space>
  );
}
