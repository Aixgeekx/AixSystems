// 我的一月 - 工作台风格 (v0.24.0 完善升级)
import React, { useState } from 'react';
import { Badge, Calendar, Card, Col, Row, Space, Statistic, Tag, Typography, Divider } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, StarOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { startOfMonth, endOfMonth, isSameDay } from '@/utils/time';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';

export default function MyMonthPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const [anchor, setAnchor] = useState(dayjs());
  const [selected, setSelected] = useState<Dayjs>(dayjs());
  const items = useItems({ startBetween: [startOfMonth(anchor.valueOf()), endOfMonth(anchor.valueOf())] }) || [];

  const done = items.filter(i => i.completeStatus === 'done').length;
  const pending = items.filter(i => i.completeStatus === 'pending').length;
  const completion = items.length ? Math.round(done / items.length * 100) : 0;
  const selectedItems = items.filter(it => isSameDay(it.startTime, selected.valueOf()));

  function cellRender(value: Dayjs) {
    const d = items.filter(it => isSameDay(it.startTime, value.valueOf()));
    if (!d.length) return null;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {d.slice(0, 3).map(i => (
          <li key={i.id} style={{ fontSize: 11 }}>
            <Badge status={i.completeStatus === 'done' ? 'success' : 'processing'} text={i.title.slice(0, 6)} />
          </li>
        ))}
        {d.length > 3 && <li style={{ fontSize: 11, color: subColor }}>+{d.length - 3}</li>}
      </ul>
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(16,185,129,0.94), rgba(5,150,105,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(16,185,129,0.16)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={14}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
              <CalendarOutlined /> 月视图
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
              我的一月 · {anchor.format('YYYY 年 M 月')}
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 0, color: 'rgba(226,232,240,0.84)' }}>
              日历热力视图，每个日期显示事项数量和完成状态。点击日期查看详情。
            </Typography.Paragraph>
          </Col>
          <Col xs={24} lg={10}>
            <Row gutter={[12, 12]}>
              {[
                { label: '本月事项', value: items.length, color: '#fff' },
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
        <Col xs={24} lg={16}>
          <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Calendar
              fullscreen
              value={anchor}
              onPanelChange={setAnchor}
              onSelect={(d) => { setSelected(d); setAnchor(d); }}
              cellRender={(v, info) => info.type === 'date' ? cellRender(v as Dayjs) : null}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} className="anim-fade-in-up stagger-3" style={{ borderRadius: 24, background: cardBg, border: cardBorder, position: 'sticky', top: 16 }}>
            <Typography.Text style={{ color: subColor }}>选中日期</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>
              {selected.format('YYYY-MM-DD dddd')}
            </Typography.Title>
            <Space size={8} style={{ marginBottom: 12 }}>
              <Tag color="blue">共 {selectedItems.length} 条</Tag>
              <Tag color="green">完成 {selectedItems.filter(i => i.completeStatus === 'done').length}</Tag>
            </Space>
            <Divider style={{ margin: '0 0 12px' }} />
            {selectedItems.length === 0
              ? <Empty text="当日暂无事项" subtext="点击日历上的日期查看事项" />
              : selectedItems.map((it, i) => <ItemCard key={it.id} item={it} index={i} />)
            }
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
