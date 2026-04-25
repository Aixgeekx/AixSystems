// 我的一周 - 工作台风格 (v0.24.0 完善升级)
import React, { useState } from 'react';
import { Button, Card, Col, DatePicker, Row, Space, Statistic, Tag, Typography, Divider } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, LeftOutlined, RightOutlined, ClockCircleOutlined, StarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { startOfWeek, endOfWeek, fmtDate, isSameDay } from '@/utils/time';
import { WEEK_FULL } from '@/config/constants';
import ItemCard from '@/components/ItemCard';
import { useThemeVariants } from '@/hooks/useVariants';

export default function MyWeekPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const [anchor, setAnchor] = useState(dayjs());
  const start = startOfWeek(anchor.valueOf());
  const end = endOfWeek(anchor.valueOf());
  const items = useItems({ startBetween: [start, end], pinnedFirst: true }) || [];

  const done = items.filter(i => i.completeStatus === 'done').length;
  const pending = items.filter(i => i.completeStatus === 'pending').length;
  const todayCount = items.filter(i => isSameDay(i.startTime, Date.now())).length;

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = dayjs(start).add(i, 'day');
    return { date: d, items: items.filter(it => isSameDay(it.startTime, d.valueOf())) };
  });

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(37,99,235,0.94), rgba(99,102,241,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(37,99,235,0.16)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={14}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
              <CalendarOutlined /> 周视图
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
              我的一周 · {fmtDate(start)} ~ {fmtDate(end)}
            </Typography.Title>
            <Space wrap size={10}>
              <Button icon={<LeftOutlined />} onClick={() => setAnchor(anchor.subtract(1, 'week'))}
                style={{ borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
              <DatePicker picker="week" value={anchor} onChange={v => v && setAnchor(v)} style={{ width: 170, borderRadius: 10 }} />
              <Button icon={<RightOutlined />} onClick={() => setAnchor(anchor.add(1, 'week'))}
                style={{ borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }} />
              <Button type="link" style={{ color: '#e0f2fe' }} onClick={() => setAnchor(dayjs())}>本周</Button>
            </Space>
          </Col>
          <Col xs={24} lg={10}>
            <Row gutter={[12, 12]}>
              {[
                { label: '本周事项', value: items.length, color: '#fff' },
                { label: '已完成', value: done, color: '#4ade80' },
                { label: '今日', value: todayCount, color: '#38bdf8' }
              ].map(s => (
                <Col span={8} key={s.label}>
                  <Card bordered={false} className="hover-lift" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.14)' }}>
                    <Statistic title={<span style={{ color: 'rgba(226,232,240,0.7)', fontSize: 12 }}>{s.label}</span>} value={s.value} valueStyle={{ color: s.color, fontSize: 24 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={8}>
        {days.map((d, i) => {
          const isToday = isSameDay(d.date.valueOf(), Date.now());
          const dayDone = d.items.filter(it => it.completeStatus === 'done').length;
          return (
            <Col key={i} span={Math.floor(24 / 7)} flex={1} style={{ minHeight: 400 }}>
              <Card bordered={false} className={`anim-fade-in-up${isToday ? ' hover-lift' : ''}`}
                style={{
                  borderRadius: 18, height: '100%', background: cardBg,
                  border: isToday ? `2px solid ${accent}` : cardBorder,
                  boxShadow: isToday ? `0 8px 24px ${accent}22` : 'none',
                  animationDelay: `${0.05 * i}s`
                }} bodyStyle={{ padding: 10 }}>
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, color: isToday ? accent : (isDark ? '#e2e8f0' : '#0f172a'), fontSize: 13 }}>
                    {WEEK_FULL[d.date.day()]}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: isToday ? accent : (isDark ? '#f8fafc' : '#1e293b') }}>
                    {d.date.format('DD')}
                  </div>
                  <div style={{ fontSize: 11, color: subColor }}>{d.date.format('MM月')}</div>
                  {d.items.length > 0 && (
                    <Space size={4} style={{ marginTop: 4 }}>
                      <Tag color="blue" style={{ borderRadius: 6, fontSize: 10, padding: '0 4px', lineHeight: '16px' }}>{d.items.length}</Tag>
                      {dayDone > 0 && <Tag color="green" style={{ borderRadius: 6, fontSize: 10, padding: '0 4px', lineHeight: '16px' }}>✓{dayDone}</Tag>}
                    </Space>
                  )}
                </div>
                <Divider style={{ margin: '4px 0 8px', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0' }} />
                {d.items.length === 0
                  ? <div style={{ color: isDark ? '#475569' : '#ccc', textAlign: 'center', fontSize: 12, padding: 12 }}>—</div>
                  : d.items.map(it => <ItemCard key={it.id} item={it} />)
                }
              </Card>
            </Col>
          );
        })}
      </Row>
    </Space>
  );
}
