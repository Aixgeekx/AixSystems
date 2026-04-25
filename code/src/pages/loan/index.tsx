// 贷款还款计划 - 工作台风格 (v0.24.0 完善升级)
import React from 'react';
import { Card, Col, Row, Space, Statistic, Table, Tag, Typography } from 'antd';
import { DollarOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { daysBetween } from '@/utils/time';
import { useThemeVariants } from '@/hooks/useVariants';

export default function LoanPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const items = useItems({ type: 'loan' }) || [];

  const rows = items.flatMap(it => {
    const total = Number(it.extra?.periods || 0);
    const mp = Number(it.extra?.monthlyPayment || 0);
    const paid = Math.max(0, Math.floor(daysBetween(it.startTime, Date.now()) / 30));
    return Array.from({ length: total }).map((_, i) => ({
      key: it.id + '_' + i, title: it.title,
      date: dayjs(it.startTime).add(i, 'month').format('YYYY-MM-DD'),
      period: `${i + 1}/${total}`, amount: mp,
      status: i < paid ? '已还' : (i === paid ? '本期' : '未到期')
    }));
  });

  const totalAmount = items.reduce((s, it) => s + Number(it.extra?.monthlyPayment || 0) * Number(it.extra?.periods || 0), 0);
  const totalPeriods = items.reduce((s, it) => s + Number(it.extra?.periods || 0), 0);
  const monthlyTotal = items.reduce((s, it) => s + Number(it.extra?.monthlyPayment || 0), 0);
  const paidCount = rows.filter(r => r.status === '已还').length;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(34,197,94,0.94), rgba(22,163,74,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(34,197,94,0.14)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
          <DollarOutlined /> 财务管理
        </Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
          贷款还款计划 · 自动展开月供
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 0, color: 'rgba(226,232,240,0.84)' }}>
          基于「贷款」类型事项的期数和月供自动展开还款计划表。
        </Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '贷款笔数', value: items.length, color: '#38bdf8', icon: <DollarOutlined /> },
          { label: '总期数', value: totalPeriods, color: '#22c55e', icon: <CalendarOutlined /> },
          { label: '总金额', value: `¥${totalAmount.toLocaleString()}`, color: '#f59e0b', icon: <CheckCircleOutlined /> },
          { label: '本月需还', value: `¥${monthlyTotal.toLocaleString()}`, color: '#ef4444', icon: <ClockCircleOutlined /> }
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

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Typography.Title level={4} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>还款明细</Typography.Title>
          <Space size={8}>
            <Tag color="blue">已还 {paidCount} 期</Tag>
            <Tag color="gold">剩余 {totalPeriods - paidCount} 期</Tag>
          </Space>
        </div>
        <Table size="small" dataSource={rows} pagination={{ pageSize: 15 }} columns={[
          { title: '贷款', dataIndex: 'title' },
          { title: '应还日期', dataIndex: 'date' },
          { title: '期数', dataIndex: 'period' },
          { title: '金额', dataIndex: 'amount', render: (a: number) => `¥ ${a.toLocaleString()}` },
          { title: '状态', dataIndex: 'status', render: (s: string) => {
            const color = s === '已还' ? 'success' : s === '本期' ? 'processing' : 'default';
            return <Tag color={color} style={{ borderRadius: 6 }}>{s}</Tag>;
          }}
        ]} />
      </Card>
    </Space>
  );
}
