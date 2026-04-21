// 事项卡片 - 时间线/列表共用的单行渲染
import React from 'react';
import { Tag, Checkbox, Space } from 'antd';
import { fmtTime, fmtDate, daysBetween } from '@/utils/time';
import { ITEM_TYPE_MAP } from '@/config/itemTypes';
import { describeRRule } from '@/utils/rrule';
import type { Item } from '@/models';
import { db } from '@/db';
import { useAppStore } from '@/stores/appStore';
import ExtraPreview from './ExtraPreview';

interface Props { item: Item; showDate?: boolean; }

export default function ItemCard({ item, showDate }: Props) {
  const meta = ITEM_TYPE_MAP[item.type];
  const openItemForm = useAppStore(s => s.openItemForm);
  const done = item.completeStatus === 'done';

  async function toggle(e: any) {
    e?.stopPropagation?.();
    const next = done ? 'pending' : 'done';
    await db.items.update(item.id, { completeStatus: next, completeTime: next === 'done' ? Date.now() : undefined });
  }

  return (
    <div onClick={() => openItemForm(item.id)} style={{
      display: 'flex', alignItems: 'center', padding: '10px 12px', marginBottom: 6,
      background: '#fff', borderRadius: 6, border: '1px solid #f0f0f0',
      cursor: 'pointer', borderLeft: `3px solid ${meta.color}`
    }}>
      <Checkbox checked={done} onChange={toggle} onClick={e => e.stopPropagation()} style={{ marginRight: 10 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ textDecoration: done ? 'line-through' : 'none', color: done ? '#bbb' : '#333', fontWeight: 500 }}>
          {item.title}
        </div>
        <Space size={4} wrap style={{ marginTop: 4 }}>
          <Tag color={meta.color}>{meta.label}</Tag>
          {showDate && <Tag>{fmtDate(item.startTime)}</Tag>}
          {!item.allDay && <Tag>{fmtTime(item.startTime)}</Tag>}
          {item.repeatRule && <Tag color="purple">↻ {describeRRule(item.repeatRule)}</Tag>}
          {typeof item.importance === 'number' && <Tag color="red">象限 {item.importance + 1}</Tag>}
          <ExtraPreview item={item} />
        </Space>
      </div>
    </div>
  );
}
