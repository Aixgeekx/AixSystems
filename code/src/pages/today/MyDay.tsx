// 我的一天 - 当日事项聚合 + 日期跳转
import React, { useState } from 'react';
import { DatePicker, Button, Divider, Statistic, Row, Col } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { useLunar } from '@/hooks/useLunar';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';
import { fmtDate } from '@/utils/time';

export default function MyDayPage() {
  const [date, setDate] = useState(dayjs().startOf('day'));
  const start = date.valueOf();
  const end = date.endOf('day').valueOf();
  const items = useItems({ startBetween: [start, end], pinnedFirst: true }) || [];
  const lunar = useLunar(start);
  const done = items.filter(i => i.completeStatus === 'done').length;
  const pending = items.filter(i => i.completeStatus === 'pending').length;

  return (
    <div>
      <Row align="middle" justify="space-between" style={{ marginBottom: 16 }}>
        <Col>
          <Button icon={<LeftOutlined />} onClick={() => setDate(date.subtract(1, 'day'))} />
          <DatePicker value={date} onChange={v => v && setDate(v)} allowClear={false} style={{ margin: '0 8px', width: 160 }} />
          <Button icon={<RightOutlined />} onClick={() => setDate(date.add(1, 'day'))} />
          <Button type="link" onClick={() => setDate(dayjs().startOf('day'))}>回到今天</Button>
        </Col>
        <Col>
          <span style={{ color: '#888' }}>{lunar.full}{lunar.term && `  ${lunar.term}`}{lunar.festival && `  ${lunar.festival}`}</span>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Statistic title="今日事项" value={items.length} /></Col>
        <Col span={6}><Statistic title="已完成" value={done} valueStyle={{ color: '#52c41a' }} /></Col>
        <Col span={6}><Statistic title="待处理" value={pending} valueStyle={{ color: '#1677ff' }} /></Col>
        <Col span={6}><Statistic title="完成率" value={items.length ? Math.round(done / items.length * 100) : 0} suffix="%" /></Col>
      </Row>

      <Divider style={{ margin: '12px 0' }} />

      {items.length === 0 ? <Empty text="今天暂无事项,添加一个吧!" /> :
        items.map(it => <ItemCard key={it.id} item={it} />)}
    </div>
  );
}
