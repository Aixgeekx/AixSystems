// 我的一年 - 工作台风格 (v0.24.0 完善升级)
import React, { useState } from 'react';
import { Button, Card, Col, Row, Space, Statistic, Tag, Typography, Divider, Select } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, RiseOutlined, TrophyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { useThemeVariants } from '@/hooks/useVariants';

export default function MyYearPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const currentYear = dayjs().year();
  const [year, setYear] = useState(currentYear);
  const start = dayjs().year(year).startOf('year').valueOf();
  const end = dayjs().year(year).endOf('year').valueOf();
  const items = useItems({ startBetween: [start, end] }) || [];
  const done = items.filter(i => i.completeStatus === 'done').length;
  const completion = items.length ? Math.round(done / items.length * 100) : 0;
  const elapsed = year === currentYear ? dayjs().diff(dayjs().startOf('year'), 'day') + 1 : 365;
  const dailyAvg = elapsed > 0 ? (items.length / elapsed).toFixed(1) : '0';

  const months = Array.from({ length: 12 }).map((_, m) => {
    const ms = dayjs().year(year).month(m).startOf('month').valueOf();
    const me = dayjs().year(year).month(m).endOf('month').valueOf();
    const arr = items.filter(i => i.startTime >= ms && i.startTime <= me);
    const d = arr.filter(a => a.completeStatus === 'done').length;
    return { month: m + 1, total: arr.length, done: d, rate: arr.length ? Math.round(d / arr.length * 100) : 0 };
  });

  const bestMonth = months.reduce((best, m) => m.total > best.total ? m : best, months[0]);

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(245,158,11,0.94), rgba(234,88,12,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(245,158,11,0.16)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={14}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
              <CalendarOutlined /> 年度总览
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
              {year} 年 · 年度全景回顾
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
              全年 12 个月的事项分布和完成情况一览。
            </Typography.Paragraph>
            <Select value={year} onChange={setYear} style={{ width: 120 }}
              options={Array.from({ length: 5 }, (_, i) => ({ value: currentYear - 2 + i, label: `${currentYear - 2 + i} 年` }))} />
          </Col>
          <Col xs={24} lg={10}>
            <Row gutter={[12, 12]}>
              {[
                { label: '年度事项', value: items.length, color: '#fff' },
                { label: '已完成', value: done, color: '#4ade80' },
                { label: '完成率', value: `${completion}%`, color: '#38bdf8' }
              ].map(s => (
                <Col span={8} key={s.label}>
                  <Card bordered={false} className="hover-lift" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.14)' }}>
                    <Statistic title={<span style={{ color: 'rgba(226,232,240,0.7)', fontSize: 12 }}>{s.label}</span>} value={s.value} valueStyle={{ color: s.color, fontSize: 22 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '日均事项', value: dailyAvg, color: '#38bdf8', icon: <CalendarOutlined /> },
          { label: '最活跃月', value: `${bestMonth.month}月`, color: '#f59e0b', icon: <TrophyOutlined /> },
          { label: '年度完成', value: done, color: '#22c55e', icon: <CheckCircleOutlined /> },
          { label: '年度趋势', value: completion >= 60 ? '良好' : '待提升', color: '#8b5cf6', icon: <RiseOutlined /> }
        ].map((s, i) => (
          <Col xs={12} md={6} key={s.label}>
            <Card bordered={false} className="anim-fade-in-up hover-lift"
              style={{ borderRadius: 22, background: cardBg, border: cardBorder, animationDelay: `${0.06 + i * 0.04}s` }}>
              <Statistic title={<span style={{ display: 'flex', alignItems: 'center', gap: 6, color: subColor }}>{s.icon} {s.label}</span>}
                value={s.value} valueStyle={{ fontSize: 24, fontWeight: 700, color: s.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="anim-fade-in-up stagger-3" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>月度分布</Typography.Title>
        <Row gutter={[16, 16]}>
          {months.map((m, i) => (
            <Col key={m.month} xs={12} sm={8} md={6}>
              <Card bordered={false} className="anim-fade-in-up hover-lift"
                style={{
                  borderRadius: 20, background: isDark ? `${accent}08` : 'rgba(248,250,252,0.9)',
                  border: m.month === bestMonth.month ? `2px solid ${accent}` : cardBorder,
                  animationDelay: `${0.03 * i}s`
                }} bodyStyle={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Typography.Text strong style={{ fontSize: 16, color: titleColor }}>{m.month}月</Typography.Text>
                  {m.month === bestMonth.month && <Tag color="gold" style={{ borderRadius: 6, marginInlineEnd: 0 }}>最活跃</Tag>}
                </div>
                <div style={{ color: subColor, fontSize: 13 }}>事项 {m.total} · 完成 {m.done}</div>
                <div style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', height: 6, borderRadius: 3, marginTop: 10 }}>
                  <div style={{
                    background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
                    height: '100%',
                    width: m.total ? `${m.rate}%` : '0%',
                    borderRadius: 3,
                    transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                  }} />
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, color: subColor, marginTop: 4 }}>{m.rate}%</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </Space>
  );
}
