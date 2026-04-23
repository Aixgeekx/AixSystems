// 经期日历 - 经期事项的月历可视化 + 简单预测 (v0.21.4 主题适配)
import React from 'react';
import { Card, Calendar, Badge, Typography, Row, Col, Statistic } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { isSameDay } from '@/utils/time';
import { useThemeVariants } from '@/hooks/useVariants';

const { Title, Paragraph } = Typography;

export default function AuntPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
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
        <Title level={4} style={{ color: isDark ? '#f8fafc' : undefined }}>经期日历</Title>
        <Paragraph type="secondary" style={{ color: isDark ? '#94a3b8' : undefined }}>创建「生理期」事项后,这里会展示历史记录与下次预测。</Paragraph>
      </Typography>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>记录次数</span>} value={items.length} valueStyle={{ color: isDark ? '#f8fafc' : undefined }} /></Card></Col>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>周期(天)</span>} value={cycle} valueStyle={{ color: isDark ? '#f8fafc' : undefined }} /></Card></Col>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>持续(天)</span>} value={duration} valueStyle={{ color: isDark ? '#f8fafc' : undefined }} /></Card></Col>
        <Col span={6}><Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Statistic title={<span style={{ color: isDark ? '#94a3b8' : undefined }}>下次预计</span>} value={nextStart ? dayjs(nextStart).format('MM-DD') : '-'} valueStyle={{ color: isDark ? '#fb7185' : '#ff4d8f' }}/></Card></Col>
      </Row>

      <Card style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}><Calendar fullscreen cellRender={(v, info) => info.type === 'date' ? cellRender(v as Dayjs) : null} /></Card>
    </div>
  );
}
