// 经期日历 - 工作台风格 (v0.24.0 完善升级)
import React from 'react';
import { Badge, Calendar, Card, Col, Row, Space, Statistic, Tag, Typography } from 'antd';
import { HeartOutlined, CalendarOutlined, ClockCircleOutlined, RiseOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { isSameDay } from '@/utils/time';
import { useThemeVariants } from '@/hooks/useVariants';

export default function AuntPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const items = useItems({ type: 'aunt' }) || [];
  const sorted = [...items].sort((a, b) => a.startTime - b.startTime);
  const lastStart = sorted[sorted.length - 1]?.startTime;
  const cycle = items[0]?.extra?.cycleDays || 28;
  const duration = items[0]?.extra?.durationDays || 5;
  const nextStart = lastStart ? lastStart + cycle * 86_400_000 : null;
  const daysUntilNext = nextStart ? Math.max(0, Math.ceil((nextStart - Date.now()) / 86_400_000)) : null;

  function cellRender(value: Dayjs) {
    const t = value.valueOf();
    for (const it of items) {
      const s = it.startTime;
      const e = s + ((it.extra?.durationDays || duration) - 1) * 86_400_000;
      if (t >= dayjs(s).startOf('day').valueOf() && t <= dayjs(e).endOf('day').valueOf())
        return <Badge color="#ff4d8f" text="经期" />;
    }
    if (nextStart) {
      const ps = nextStart, pe = ps + (duration - 1) * 86_400_000;
      if (t >= dayjs(ps).startOf('day').valueOf() && t <= dayjs(pe).endOf('day').valueOf())
        return <Badge color="#ffadd2" text="预测" />;
    }
    return null;
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(244,63,94,0.94), rgba(251,113,133,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(244,63,94,0.16)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
          <HeartOutlined /> 健康追踪
        </Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
          经期日历 · 记录与预测
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 0, color: 'rgba(226,232,240,0.84)' }}>
          创建「生理期」事项后自动展示历史记录与下次预测，数据完全本地存储。
        </Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '记录次数', value: items.length, color: '#fb7185', icon: <CalendarOutlined /> },
          { label: '周期(天)', value: cycle, color: '#38bdf8', icon: <ClockCircleOutlined /> },
          { label: '持续(天)', value: duration, color: '#a78bfa', icon: <RiseOutlined /> },
          { label: '距下次', value: daysUntilNext !== null ? `${daysUntilNext}天` : '-', color: '#f43f5e', icon: <HeartOutlined /> }
        ].map((s, i) => (
          <Col xs={12} md={6} key={s.label}>
            <Card bordered={false} className="anim-fade-in-up hover-lift"
              style={{ borderRadius: 22, background: cardBg, border: cardBorder, animationDelay: `${0.06 + i * 0.04}s` }}>
              <Statistic title={<span style={{ display: 'flex', alignItems: 'center', gap: 6, color: subColor }}>{s.icon} {s.label}</span>}
                value={s.value} valueStyle={{ fontSize: 28, fontWeight: 700, color: s.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Calendar fullscreen cellRender={(v, info) => info.type === 'date' ? cellRender(v as Dayjs) : null} />
      </Card>
    </Space>
  );
}
