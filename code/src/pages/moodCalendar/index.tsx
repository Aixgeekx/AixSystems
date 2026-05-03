// 心情日历 - 日记情绪可视化日历
import React, { useMemo, useState } from 'react';
import { Card, Col, Row, Select, Space, Tag, Typography } from 'antd';
import { HeartOutlined, CalendarOutlined, SmileOutlined, FrownOutlined, MehOutlined, CrownOutlined, BarChartOutlined, AimOutlined, LineChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

const MOOD_META: Record<string, { label: string; color: string; emoji: string }> = {
  happy: { label: '开心', color: '#22c55e', emoji: '😊' },
  calm: { label: '平静', color: '#3b82f6', emoji: '😌' },
  excited: { label: '兴奋', color: '#f59e0b', emoji: '🤩' },
  sad: { label: '难过', color: '#6366f1', emoji: '😢' },
  anxious: { label: '焦虑', color: '#ef4444', emoji: '😰' },
  angry: { label: '生气', color: '#dc2626', emoji: '😡' },
  tired: { label: '疲惫', color: '#8b5cf6', emoji: '😩' },
  grateful: { label: '感恩', color: '#14b8a6', emoji: '🙏' }
};

function buildCalendarDays(year: number, month: number) {
  const first = dayjs().year(year).month(month).startOf('month');
  const daysInMonth = first.daysInMonth();
  const startWeekday = first.day();
  const days: (dayjs.Dayjs | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let i = 0; i < daysInMonth; i++) days.push(first.add(i, 'day'));
  return days;
}

export default function MoodCalendarPage() {
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const now = dayjs();
  const [month, setMonth] = useState(now.month());
  const [year, setYear] = useState(now.year());

  const diaries = useLiveQuery(() => db.diaries.filter(d => !d.deletedAt).toArray(), []);

  const moodMap = useMemo(() => {
    const map: Record<string, string> = {};
    (diaries || []).forEach(d => {
      if (d.mood) map[dayjs(d.date).format('YYYY-MM-DD')] = d.mood;
    });
    return map;
  }, [diaries]);

  const days = useMemo(() => buildCalendarDays(year, month), [year, month]);

  // 统计
  const monthKey = dayjs().year(year).month(month).format('YYYY-MM');
  const moodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    (diaries || []).forEach(d => {
      const dk = dayjs(d.date).format('YYYY-MM');
      if (dk === monthKey && d.mood) counts[d.mood] = (counts[d.mood] || 0) + 1;
    });
    return counts;
  }, [diaries, monthKey]);

  const diaryDays = (diaries || []).filter(d => dayjs(d.date).format('YYYY-MM') === monthKey).length;
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${i + 1}月` }));
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({ value: now.year() - 2 + i, label: `${now.year() - 2 + i}年` }));

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : `linear-gradient(135deg, #ec4899, #db2777 52%, #0f172a)`,
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: `0 28px 60px ${accent}20`
      }} bodyStyle={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><HeartOutlined /> 心情日历</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 0', color: '#fff' }}>情绪可视化</Typography.Title>
          </div>
          <Space>
            <Select value={year} onChange={setYear} options={yearOptions} style={{ width: 90 }} />
            <Select value={month} onChange={setMonth} options={monthOptions} style={{ width: 80 }} />
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={8}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📝</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: accent }}>{diaryDays}</div>
            <div style={{ color: subColor, fontSize: 12 }}>本月日记</div>
          </Card>
        </Col>
        <Col xs={8}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{topMood ? MOOD_META[topMood[0]]?.emoji : '❓'}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: topMood ? MOOD_META[topMood[0]]?.color : subColor }}>{topMood ? MOOD_META[topMood[0]]?.label : '无'}</div>
            <div style={{ color: subColor, fontSize: 12 }}>主导情绪</div>
          </Card>
        </Col>
        <Col xs={8}>
          <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>📊</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: titleColor }}>{Object.keys(moodCounts).length}</div>
            <div style={{ color: subColor, fontSize: 12 }}>情绪种类</div>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>
          <CalendarOutlined /> {year}年{month + 1}月心情日历
        </Typography.Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {['日', '一', '二', '三', '四', '五', '六'].map(d => (
            <div key={d} style={{ textAlign: 'center', color: subColor, fontSize: 12, fontWeight: 600, padding: 4 }}>{d}</div>
          ))}
          {days.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} />;
            const key = day.format('YYYY-MM-DD');
            const mood = moodMap[key];
            const meta = mood ? MOOD_META[mood] : null;
            const isToday = day.isSame(now, 'day');
            return (
              <div key={key} style={{
                textAlign: 'center', padding: '6px 2px', borderRadius: 12,
                background: meta ? `${meta.color}18` : (isToday ? `${accent}12` : 'transparent'),
                border: isToday ? `2px solid ${accent}` : meta ? `1px solid ${meta.color}33` : `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'}`,
                minHeight: 52
              }}>
                <div style={{ fontSize: 14, fontWeight: isToday ? 700 : 500, color: titleColor }}>{day.date()}</div>
                {meta && <div style={{ fontSize: 18, lineHeight: 1 }}>{meta.emoji}</div>}
              </div>
            );
          })}
        </div>
      </Card>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>本月情绪分布</Typography.Title>
        <Row gutter={[12, 12]}>
          {Object.entries(moodCounts).sort((a, b) => b[1] - a[1]).map(([mood, count]) => {
            const meta = MOOD_META[mood];
            if (!meta) return null;
            return (
              <Col xs={12} sm={6} key={mood}>
                <div style={{
                  borderRadius: 14, padding: 12, textAlign: 'center',
                  background: `${meta.color}14`, border: `1px solid ${meta.color}33`
                }}>
                  <div style={{ fontSize: 28 }}>{meta.emoji}</div>
                  <div style={{ fontWeight: 600, color: meta.color, fontSize: 14, marginTop: 4 }}>{meta.label}</div>
                  <div style={{ color: subColor, fontSize: 12 }}>{count} 次</div>
                </div>
              </Col>
            );
          })}
          {Object.keys(moodCounts).length === 0 && (
            <Col span={24}>
              <div style={{ textAlign: 'center', color: subColor, padding: 24 }}>本月暂无带情绪的日记</div>
            </Col>
          )}
        </Row>
      </Card>

      {/* 图例 */}
      <Card bordered={false} style={{ borderRadius: 20, background: cardBg, border: cardBorder }}>
        <Typography.Text style={{ color: subColor, fontSize: 12 }}>情绪图例：</Typography.Text>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
          {Object.entries(MOOD_META).map(([key, meta]) => (
            <Tag key={key} style={{ borderRadius: 999, fontSize: 11, background: `${meta.color}18`, border: `1px solid ${meta.color}44`, color: meta.color }}>
              {meta.emoji} {meta.label}
            </Tag>
          ))}
        </div>
      </Card>

      {/* 深度分析导航 */}
      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>深度分析</Typography.Title>
        <Row gutter={[12, 12]}>
          {[
            { label: '专注排行榜', icon: <CrownOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_RANKING },
            { label: '习惯热力图', icon: <CalendarOutlined />, color: '#14b8a6', path: ROUTES.HABIT_HEATMAP },
            { label: '目标时间线', icon: <AimOutlined />, color: '#3b82f6', path: ROUTES.GOAL_TIMELINE },
            { label: '专注统计详情', icon: <BarChartOutlined />, color: '#f59e0b', path: ROUTES.FOCUS_STATS }
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
