// 我的一年 - 12 月方块 + 年度统计
import React, { useState } from 'react';
import { Row, Col, Card, Statistic } from 'antd';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { startOfYear, endOfYear } from '@/utils/time';

export default function MyYearPage() {
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
        <Col span={6}><Card><Statistic title={`${year} 年总事项`} value={items.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="已完成" value={done} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="完成率" value={items.length ? Math.round(done / items.length * 100) : 0} suffix="%" /></Card></Col>
        <Col span={6}><Card><Statistic title="日均" value={(items.length / 365).toFixed(1)} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        {months.map(m => (
          <Col key={m.month} span={6}>
            <Card size="small" title={`${m.month} 月`} styles={{ body: { padding: 16 }}}>
              <div>事项 {m.total} 条</div>
              <div style={{ color: '#52c41a' }}>完成 {m.done} 条</div>
              <div style={{ background: '#f0f0f0', height: 6, borderRadius: 3, marginTop: 8 }}>
                <div style={{ background: '#52c41a', height: '100%', width: m.total ? (m.done / m.total * 100) + '%' : '0%', borderRadius: 3 }} />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
