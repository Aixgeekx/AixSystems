// 我的一年 - 12 月方块 + 年度统计 (v0.21.4 主题适配)
import React, { useState } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { startOfYear, endOfYear } from '@/utils/time';
import { useThemeVariants } from '@/hooks/useVariants';

export default function MyYearPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [year] = useState(dayjs().year());
  const start = dayjs().year(year).startOf('year').valueOf();
  const end = dayjs().year(year).endOf('year').valueOf();
  const items = useItems({ startBetween: [start, end] }) || [];
  const done = items.filter(i => i.completeStatus === 'done').length;

  const months = Array.from({ length: 12 }).map((_, m) => {
    const ms = dayjs().year(year).month(m).startOf('month').valueOf();
    const me = dayjs().year(year).month(m).endOf('month').valueOf();
    const arr = items.filter(i => i.startTime >= ms && i.startTime <= me);
    return { month: m + 1, total: arr.length, done: arr.filter(a => a.completeStatus === 'done').length };
  });

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>{`${year} 年总事项`}</span>} value={items.length} valueStyle={{ color: isDark ? '#f8fafc' : undefined }} /></Card></Col>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>已完成</span>} value={done} valueStyle={{ color: isDark ? '#4ade80' : '#52c41a' }} /></Card></Col>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>完成率</span>} value={items.length ? Math.round(done / items.length * 100) : 0} suffix="%" valueStyle={{ color: isDark ? '#f8fafc' : undefined }} /></Card></Col>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>日均</span>} value={(items.length / 365).toFixed(1)} valueStyle={{ color: isDark ? '#f8fafc' : undefined }} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        {months.map(m => (
          <Col key={m.month} span={6}>
            <Card size="small" title={`${m.month} 月`} styles={{ body: { padding: 16 }}}
              style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}
              headStyle={{ color: isDark ? '#f8fafc' : undefined }}
            >
              <div style={{ color: isDark ? '#e2e8f0' : undefined }}>事项 {m.total} 条</div>
              <div style={{ color: isDark ? '#4ade80' : '#52c41a' }}>完成 {m.done} 条</div>
              <div style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0', height: 6, borderRadius: 3, marginTop: 8 }}>
                <div style={{ background: isDark ? accent : '#52c41a', height: '100%', width: m.total ? (m.done / m.total * 100) + '%' : '0%', borderRadius: 3 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
