// 经期日历 - 经期事项的月历可视化 + 简单预测
import React from 'react';
import { Card, Calendar, Badge, Typography, Row, Col, Statistic } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { isSameDay } from '@/utils/time';

const { Title, Paragraph } = Typography;

export default function AuntPage() {
  const items = useItems({ type: 'aunt' }) || [];
  const sorted = [...items].sort((a, b) => a.startTime - b.startTime);

  const lastStart = sorted[sorted.length - 1]?.startTime;
  const cycle = items[0]?.extra?.cycleDays || 28;
  const duration = items[0]?.extra?.durationDays || 5;
  const nextStart = lastStart ? lastStart + cycle * 86_400_000 : null;

  function cellRender(value: Dayjs) {
    const t = value.valueOf();
    // 实际经期区间
    for (const it of items) {
      const s = it.startTime;
      const e = s + ((it.extra?.durationDays || duration) - 1) * 86_400_000;
      if (t >= dayjs(s).startOf('day').valueOf() && t <= dayjs(e).endOf('day').valueOf()) {
        return <Badge color="#ff4d8f" text="经期" />;
      }
    }
    // 预测下一次
    if (nextStart) {
      const ps = nextStart;
      const pe = ps + (duration - 1) * 86_400_000;
      if (t >= dayjs(ps).startOf('day').valueOf() && t <= dayjs(pe).endOf('day').valueOf()) {
        return <Badge color="#ffadd2" text="预测" />;
      }
    }
    return null;
  }

  return (
    <div>
      <Typography>
        <Title level={4}>经期日历</Title>
        <Paragraph type="secondary">创建「生理期」事项后,这里会展示历史记录与下次预测。</Paragraph>
      </Typography>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="记录次数" value={items.length} /></Card></Col>
        <Col span={6}><Card><Statistic title="周期(天)" value={cycle} /></Card></Col>
        <Col span={6}><Card><Statistic title="持续(天)" value={duration} /></Card></Col>
        <Col span={6}><Card><Statistic title="下次预计" value={nextStart ? dayjs(nextStart).format('MM-DD') : '-'} valueStyle={{ color: '#ff4d8f' }}/></Card></Col>
      </Row>

      <Card><Calendar fullscreen cellRender={(v, info) => info.type === 'date' ? cellRender(v as Dayjs) : null} /></Card>
    </div>
  );
}
