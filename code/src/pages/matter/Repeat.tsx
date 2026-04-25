// 重复事项 - 工作台风格 (v0.24.0 完善升级)
import React, { useState, useMemo } from 'react';
import { Card, Col, Input, Row, Space, Statistic, Tag, Typography, Divider } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, ClockCircleOutlined, SearchOutlined, FieldTimeOutlined } from '@ant-design/icons';
import { useItems } from '@/hooks/useItems';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';
import { describeRRule } from '@/utils/rrule';

export default function RepeatPage() {
  const items = useItems({ hasRepeat: true }) || [];
  const [kw, setKw] = useState('');
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const filtered = useMemo(() => {
    if (!kw) return items;
    return items.filter(i => i.title.toLowerCase().includes(kw.toLowerCase()));
  }, [items, kw]);

  const done = items.filter(i => i.completeStatus === 'done').length;
  const memory = items.filter(i => i.repeatRule === 'memory_curve').length;
  const daily = items.filter(i => i.repeatRule?.includes('DAILY')).length;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(124,58,237,0.94), rgba(99,102,241,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(124,58,237,0.16)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
          <ReloadOutlined /> 循环事项
        </Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
          重复事项 · 持续推进的习惯
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
          所有设置了重复规则的事项都汇总在这里，包括每天/每周/每月/记忆曲线等模式。
        </Typography.Paragraph>
        <Space wrap size={8}>
          <Tag color="purple">RRULE 重复</Tag>
          <Tag color="cyan">记忆曲线</Tag>
          <Tag color="blue">每天/周/月/年</Tag>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '重复事项', value: items.length, color: '#8b5cf6', icon: <ReloadOutlined /> },
          { label: '已完成', value: done, color: '#22c55e', icon: <CheckCircleOutlined /> },
          { label: '记忆曲线', value: memory, color: '#06b6d4', icon: <FieldTimeOutlined /> },
          { label: '每日重复', value: daily, color: '#f59e0b', icon: <ClockCircleOutlined /> }
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
        <Input prefix={<SearchOutlined />} placeholder="搜索重复事项" value={kw} onChange={e => setKw(e.target.value)} allowClear style={{ width: 240, borderRadius: 12 }} />
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-3" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>重复事项列表</Typography.Title>
          <Tag color="purple">共 {filtered.length} 条</Tag>
        </div>
        <Divider style={{ margin: '0 0 16px' }} />
        {filtered.length === 0
          ? <Empty text="暂无重复事项" subtext="在创建事项时设置重复规则，它们会出现在这里" />
          : filtered.map((it, i) => <ItemCard key={it.id} item={it} showDate index={i} />)
        }
      </Card>
    </Space>
  );
}
