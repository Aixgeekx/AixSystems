// 事项卡片 - 时间线/列表共用的单行渲染
import React, { useState } from 'react';
import { Tag, Checkbox, Space } from 'antd';
import { fmtTime, fmtDate, daysBetween } from '@/utils/time';
import { ITEM_TYPE_MAP } from '@/config/itemTypes';
import { describeRRule } from '@/utils/rrule';
import type { Item } from '@/models';
import { db } from '@/db';
import { useAppStore } from '@/stores/appStore';
import ExtraPreview from './ExtraPreview';
import { useThemeVariants } from '@/hooks/useVariants';
import { THEMES } from '@/config/themes';
import { useSettingsStore } from '@/stores/settingsStore';

interface Props { item: Item; showDate?: boolean; }

export default function ItemCard({ item, showDate }: Props) {
  const meta = ITEM_TYPE_MAP[item.type];
  const openItemForm = useAppStore(s => s.openItemForm);
  const done = item.completeStatus === 'done';
  const [hovered, setHovered] = useState(false);
  const themeKey = useSettingsStore(s => s.theme);
  const themeMeta = THEMES.find(t => t.key === themeKey) || THEMES[0];
  const { getItemCardStyle } = useThemeVariants();
  const cardStyle = getItemCardStyle(done, hovered, meta.color);

  async function toggle(e: any) {
    e?.stopPropagation?.();
    const next = done ? 'pending' : 'done';
    await db.items.update(item.id, { completeStatus: next, completeTime: next === 'done' ? Date.now() : undefined });
  }

  return (
    <div onClick={() => openItemForm(item.id)} style={{
      display: 'flex', alignItems: 'flex-start', padding: '14px 18px', marginBottom: 12,
      borderRadius: 8, 
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
      overflow: 'hidden',
      ...cardStyle
    }}
    onMouseEnter={() => !done && setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 4,
        background: `linear-gradient(180deg, ${meta.color}, transparent)`,
        opacity: done ? 0.2 : 1, transition: 'opacity 0.3s ease',
        boxShadow: done ? 'none' : `0 0 10px ${meta.color}`
      }} />
      <Checkbox checked={done} onChange={toggle} onClick={e => e.stopPropagation()} style={{ marginTop: 2, marginRight: 16, transform: 'scale(1.15)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          textDecoration: done ? 'line-through' : 'none', 
          color: done ? `${themeMeta.accent}66` : themeMeta.accent, 
          fontWeight: 600, 
          fontSize: 16,
          letterSpacing: '-0.01em',
          transition: 'all 0.3s ease',
          marginBottom: 6,
          textShadow: done ? 'none' : `0 0 8px ${themeMeta.accent}66`
        }}>
          {item.title}
        </div>
        <Space size={6} wrap style={{ opacity: done ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>
          <Tag bordered={false} color={meta.color} style={{ borderRadius: 6, fontWeight: 500, padding: '1px 8px' }}>{meta.label}</Tag>
          {showDate && <Tag bordered={false} style={{ borderRadius: 6, background: 'rgba(100,100,100,0.1)', color: 'inherited', fontWeight: 500 }}>{fmtDate(item.startTime)}</Tag>}
          {!item.allDay && <Tag bordered={false} style={{ borderRadius: 6, background: 'rgba(100,100,100,0.1)', color: 'inherited', fontWeight: 500 }}>{fmtTime(item.startTime)}</Tag>}
          {item.repeatRule && <Tag bordered={false} color="purple" style={{ borderRadius: 6, fontWeight: 500 }}>↻ {describeRRule(item.repeatRule)}</Tag>}
          {typeof item.importance === 'number' && <Tag bordered={false} color="red" style={{ borderRadius: 6, fontWeight: 500 }}>象限 {item.importance + 1}</Tag>}
          <ExtraPreview item={item} />
        </Space>
      </div>
    </div>
  );
}
