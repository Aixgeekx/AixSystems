// 我的一月 - 日历热力,每格显示事项数
import React, { useState } from 'react';
import { Calendar, Badge } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { startOfMonth, endOfMonth, isSameDay } from '@/utils/time';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';

export default function MyMonthPage() {
  const [anchor, setAnchor] = useState(dayjs());
  const items = useItems({ startBetween: [startOfMonth(anchor.valueOf()), endOfMonth(anchor.valueOf())] }) || [];
  const [selected, setSelected] = useState<Dayjs>(dayjs());

  function cellRender(value: Dayjs) {
    const d = items.filter(it => isSameDay(it.startTime, value.valueOf()));
    if (!d.length) return null;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {d.slice(0, 3).map(i => (<li key={i.id} style={{ fontSize: 11 }}><Badge status={i.completeStatus === 'done' ? 'success' : 'processing'} text={i.title.slice(0, 6)} /></li>))}
        {d.length > 3 && <li style={{ fontSize: 11, color: '#999' }}>+{d.length - 3}</li>}
      </ul>
    );
  }

  const selectedItems = items.filter(it => isSameDay(it.startTime, selected.valueOf()));

  return (
    <div style={{ display: 'flex', gap: 16 }}>
      <div style={{ flex: 1, background: '#fff', padding: 12, borderRadius: 8 }}>
        <Calendar fullscreen value={anchor} onPanelChange={setAnchor} onSelect={(d) => { setSelected(d); setAnchor(d); }}
          cellRender={(v, info) => info.type === 'date' ? cellRender(v as Dayjs) : null} />
      </div>
      <div style={{ width: 320 }}>
        <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 12 }}>{selected.format('YYYY-MM-DD')} 事项</div>
        {selectedItems.length === 0 ? <Empty text="当日暂无事项" /> :
          selectedItems.map(it => <ItemCard key={it.id} item={it} />)}
      </div>
    </div>
  );
}
