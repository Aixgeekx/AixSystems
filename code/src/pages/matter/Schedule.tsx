// 日程视图 - 工作台风格 (v0.24.0 完善升级)
import React, { useState, useMemo } from 'react';
import { Button, Card, Col, Input, Row, Space, Statistic, Tag, Typography, Divider, Segmented } from 'antd';
import { CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, PlusOutlined, SearchOutlined, StarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';
import { useAppStore } from '@/stores/appStore';
import { useThemeVariants } from '@/hooks/useVariants';

type TimeFilter = 'all' | 'today' | 'week' | 'month';

export default function SchedulePage() {
  const items = useItems({ type: 'schedule', pinnedFirst: true }) || [];
  const openItemForm = useAppStore(s => s.openItemForm);
  const [kw, setKw] = useState('');
  const [timeRange, setTimeRange] = useState<TimeFilter>('all');
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const filtered = useMemo(() => {
    let list = items;
    if (kw) list = list.filter(i => i.title.toLowerCase().includes(kw.toLowerCase()));
    const now = dayjs();
    if (timeRange === 'today') list = list.filter(i => dayjs(i.startTime).isSame(now, 'day'));
    else if (timeRange === 'week') list = list.filter(i => dayjs(i.startTime).isSame(now, 'week'));
    else if (timeRange === 'month') list = list.filter(i => dayjs(i.startTime).isSame(now, 'month'));
    return list;
  }, [items, kw, timeRange]);

  const done = items.filter(i => i.completeStatus === 'done').length;
  const todayCount = items.filter(i => dayjs(i.startTime).isSame(dayjs(), 'day')).length;
  const upcoming = items.filter(i => i.completeStatus === 'pending' && i.startTime > Date.now()).length;
  const overdue = items.filter(i => i.completeStatus === 'pending' && i.startTime < Date.now()).length;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        className="anim-fade-in-up"
        style={{
          borderRadius: 28, overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(14,165,233,0.94), rgba(59,130,246,0.9) 45%, rgba(15,23,42,0.92) 100%)',
          boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(14,165,233,0.16)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
              <CalendarOutlined /> 日程管理
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
              日程安排 · 按时间维度规划
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
              管理所有日程类事项。支持按时间范围筛选，快速查看今日、本周和本月日程。
            </Typography.Paragraph>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openItemForm(undefined, 'schedule')}
              style={{ borderRadius: 12, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
            >
              新建日程
            </Button>
          </Col>
          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 22, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title={<span style={{ color: 'rgba(226,232,240,0.7)' }}>今日日程</span>} value={todayCount} valueStyle={{ color: '#fff', fontSize: 28 }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 22, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title={<span style={{ color: 'rgba(226,232,240,0.7)' }}>完成率</span>} value={items.length ? Math.round(done / items.length * 100) : 0} suffix="%" valueStyle={{ color: '#fff', fontSize: 28 }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '全部日程', value: items.length, color: '#38bdf8', icon: <CalendarOutlined /> },
          { label: '已完成', value: done, color: '#22c55e', icon: <CheckCircleOutlined /> },
          { label: '即将到来', value: upcoming, color: '#8b5cf6', icon: <StarOutlined /> },
          { label: '已过期', value: overdue, color: '#ef4444', icon: <ClockCircleOutlined /> }
        ].map((s, i) => (
          <Col xs={12} md={6} key={s.label}>
            <Card bordered={false} className="anim-fade-in-up hover-lift"
              style={{ borderRadius: 22, background: cardBg, border: cardBorder, animationDelay: `${0.06 + i * 0.04}s` }}>
              <Statistic
                title={<span style={{ display: 'flex', alignItems: 'center', gap: 6, color: subColor }}>{s.icon} {s.label}</span>}
                value={s.value}
                valueStyle={{ fontSize: 28, fontWeight: 700, color: s.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space wrap size={10}>
          <Input
            prefix={<SearchOutlined style={{ color: subColor }} />}
            placeholder="搜索日程"
            value={kw}
            onChange={e => setKw(e.target.value)}
            allowClear
            style={{ width: 200, borderRadius: 12 }}
          />
          <Segmented
            value={timeRange}
            onChange={v => setTimeRange(v as TimeFilter)}
            options={[
              { label: '全部', value: 'all' },
              { label: '今日', value: 'today' },
              { label: '本周', value: 'week' },
              { label: '本月', value: 'month' }
            ]}
          />
        </Space>
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-3" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <Typography.Text style={{ color: subColor }}>日程列表</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 0', color: titleColor }}>
              {timeRange === 'today' ? '今日日程' : timeRange === 'week' ? '本周日程' : timeRange === 'month' ? '本月日程' : '全部日程'}
            </Typography.Title>
          </div>
          <Tag color="blue">共 {filtered.length} 条</Tag>
        </div>
        <Divider style={{ margin: '0 0 16px' }} />
        {filtered.length === 0
          ? <Empty text="暂无日程" subtext="点击上方按钮创建你的第一条日程" />
          : filtered.map((it, i) => <ItemCard key={it.id} item={it} showDate index={i} />)
        }
      </Card>
    </Space>
  );
}
