// 我的一周 - 7 列时间轴视图 (v0.21.4 主题适配)
import React, { useState } from 'react';
import { DatePicker, Button, Row, Col } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { startOfWeek, endOfWeek, fmtDate, isSameDay } from '@/utils/time';
import { WEEK_FULL } from '@/config/constants';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';

export default function MyWeekPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
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
        <span style={{ marginLeft: 'auto', color: isDark ? '#64748b' : '#888' }}>{fmtDate(start)} ~ {fmtDate(end)}</span>
      </Row>

      <Row gutter={8}>
        {days.map((d, i) => (
          <Col key={i} span={Math.floor(24 / 7)} flex={1} style={{ minHeight: 400 }}>
            <div style={{
              background: isSameDay(d.date.valueOf(), Date.now()) ? (isDark ? `${accent}18` : '#e6f4ff') : (isDark ? 'rgba(10,14,28,0.5)' : '#fafafa'),
              padding: 8, borderRadius: 6, minHeight: 400, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined
            }}>
              <div style={{ textAlign: 'center', fontWeight: 500, marginBottom: 8, color: isDark ? '#e2e8f0' : undefined }}>
                {WEEK_FULL[d.date.day()]}
                <div style={{ fontSize: 12, color: isDark ? '#64748b' : '#888' }}>{d.date.format('MM/DD')}</div>
              </div>
              {d.items.length === 0 ? <div style={{ color: isDark ? '#475569' : '#ccc', textAlign: 'center', fontSize: 12, padding: 12 }}>—</div> :
                d.items.map(it => <ItemCard key={it.id} item={it} />)}
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
}
