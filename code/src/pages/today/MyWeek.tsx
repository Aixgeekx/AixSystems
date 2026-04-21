// 我的一周 - 7 列时间轴视图
import React, { useState } from 'react';
import { DatePicker, Button, Row, Col } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { startOfWeek, endOfWeek, fmtDate, isSameDay } from '@/utils/time';
import { WEEK_FULL } from '@/config/constants';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';

export default function MyWeekPage() {
  const [anchor, setAnchor] = useState(dayjs());
  const start = startOfWeek(anchor.valueOf());
  const end = endOfWeek(anchor.valueOf());
  const items = useItems({ startBetween: [start, end], pinnedFirst: true }) || [];

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = dayjs(start).add(i, 'day');
    return { date: d, items: items.filter(it => isSameDay(it.startTime, d.valueOf())) };
  });

  return (
    <div>
      <Row align="middle" style={{ marginBottom: 16 }}>
        <Button icon={<LeftOutlined />} onClick={() => setAnchor(anchor.subtract(1, 'week'))} />
        <DatePicker picker="week" value={anchor} onChange={v => v && setAnchor(v)} style={{ margin: '0 8px' }} />
        <Button icon={<RightOutlined />} onClick={() => setAnchor(anchor.add(1, 'week'))} />
        <Button type="link" onClick={() => setAnchor(dayjs())}>本周</Button>
        <span style={{ marginLeft: 'auto', color: '#888' }}>{fmtDate(start)} ~ {fmtDate(end)}</span>
      </Row>

      <Row gutter={8}>
        {days.map((d, i) => (
          <Col key={i} span={Math.floor(24 / 7)} flex={1} style={{ minHeight: 400 }}>
            <div style={{
              background: isSameDay(d.date.valueOf(), Date.now()) ? '#e6f4ff' : '#fafafa',
              padding: 8, borderRadius: 6, minHeight: 400
            }}>
              <div style={{ textAlign: 'center', fontWeight: 500, marginBottom: 8 }}>
                {WEEK_FULL[d.date.day()]}
                <div style={{ fontSize: 12, color: '#888' }}>{d.date.format('MM/DD')}</div>
              </div>
              {d.items.length === 0 ? <div style={{ color: '#ccc', textAlign: 'center', fontSize: 12, padding: 12 }}>—</div> :
                d.items.map(it => <ItemCard key={it.id} item={it} />)}
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
}
