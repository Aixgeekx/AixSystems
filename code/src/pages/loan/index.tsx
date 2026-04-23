// 贷款还款计划 - 按月展开列表 + 进度 (v0.21.4 主题适配)
import React from 'react';
import { Card, Table, Typography, Tag, Progress, Row, Col, Statistic } from 'antd';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { daysBetween } from '@/utils/time';
import { useThemeVariants } from '@/hooks/useVariants';

const { Title, Paragraph } = Typography;

export default function LoanPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const items = useItems({ type: 'loan' }) || [];

  const rows = items.flatMap(it => {
    const total = Number(it.extra?.periods || 0);
    const mp = Number(it.extra?.monthlyPayment || 0);
    const paid = Math.max(0, Math.floor(daysBetween(it.startTime, Date.now()) / 30));
    return Array.from({ length: total }).map((_, i) => ({
      key: it.id + '_' + i,
      title: it.title,
      date: dayjs(it.startTime).add(i, 'month').format('YYYY-MM-DD'),
      period: `${i + 1}/${total}`,
      amount: mp,
      status: i < paid ? '已还' : (i === paid ? '本期' : '未到期')
    }));
  });

  const totalAmount = items.reduce((s, it) => s + Number(it.extra?.monthlyPayment || 0) * Number(it.extra?.periods || 0), 0);

  return (
    <div>
      <Typography>
        <Title level={4} style={{ color: isDark ? '#f8fafc' : undefined }}>贷款还款计划</Title>
        <Paragraph type="secondary" style={{ color: isDark ? '#94a3b8' : undefined }}>基于「贷款」类型事项的期数 + 月供自动展开。</Paragraph>
      </Typography>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>贷款笔数</span>} value={items.length} valueStyle={{ color: isDark ? '#f8fafc' : undefined }} /></Card></Col>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>总期数</span>} value={items.reduce((s, it) => s + Number(it.extra?.periods || 0), 0)} valueStyle={{ color: isDark ? '#f8fafc' : undefined }} /></Card></Col>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>总金额</span>} value={totalAmount} prefix="¥" valueStyle={{ color: isDark ? '#f8fafc' : undefined }} /></Card></Col>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>本月共需</span>} value={items.reduce((s, it) => s + Number(it.extra?.monthlyPayment || 0), 0)} prefix="¥" valueStyle={{ color: isDark ? '#f8fafc' : undefined }} /></Card></Col>
      </Row>

      <Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}>
        <Table size="small" dataSource={rows} pagination={{ pageSize: 15 }} columns={[
          { title: '贷款', dataIndex: 'title' },
          { title: '应还日期', dataIndex: 'date' },
          { title: '期数', dataIndex: 'period' },
          { title: '金额', dataIndex: 'amount', render: (a: number) => `¥ ${a}` },
          { title: '状态', dataIndex: 'status', render: (s: string) => {
            const color = s === '已还' ? 'success' : s === '本期' ? 'processing' : 'default';
            return <Tag color={color}>{s}</Tag>;
          }}
        ]} />
      </Card>
    </div>
  );
}
