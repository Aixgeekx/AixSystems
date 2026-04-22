// 事项卡片 - 时间线/列表共用的单行渲染 (v0.20.0 增强动画与视觉)
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

interface Props { item: Item; showDate?: boolean; index?: number; }

export default function ItemCard({ item, showDate, index = 0 }: Props) {
  const meta = ITEM_TYPE_MAP[item.type];
  const openItemForm = useAppStore(s => s.openItemForm);
  const done = item.completeStatus === 'done';
  const [hovered, setHovered] = useState(false);
  const themeKey = useSettingsStore(s => s.theme);
  const themeMeta = THEMES.find(t => t.key === themeKey) || THEMES[0];
  const { getItemCardStyle } = useThemeVariants();
  const cardStyle = getItemCardStyle(done, hovered, meta.color);

  // 计算stagger延迟
  const staggerDelay = Math.min(index * 0.05, 0.4);

  async function toggle(e: any) {
    e?.stopPropagation?.();
    const next = done ? 'pending' : 'done';
    await db.items.update(item.id, { completeStatus: next, completeTime: next === 'done' ? Date.now() : undefined });
  }

  return (
    <div
      className="anim-fade-in-up"
      onClick={() => openItemForm(item.id)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: '14px 18px',
        marginBottom: 12,
        borderRadius: 14,
        cursor: 'pointer',
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden',
        animationDelay: `${staggerDelay}s`,
        ...cardStyle
      }}
      onMouseEnter={() => !done && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 左侧动态指示条 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 4,
        borderRadius: '4px 0 0 4px',
        background: `linear-gradient(180deg, ${meta.color}, ${meta.color}66)`,
        opacity: done ? 0.15 : 1,
        transition: 'all 0.3s ease',
        boxShadow: done ? 'none' : `0 0 12px ${meta.color}88`
      }} />

      {/* 悬浮光效层 */}
      {!done && hovered && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(circle at 80% 50%, ${meta.color}0d 0%, transparent 60%)`,
          pointerEvents: 'none',
          transition: 'opacity 0.3s ease'
        }} />
      )}

      <Checkbox
        checked={done}
        onChange={toggle}
        onClick={e => e.stopPropagation()}
        style={{
          marginTop: 2,
          marginRight: 16,
          transform: hovered && !done ? 'scale(1.22)' : 'scale(1.15)',
          transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      />

      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div style={{
          textDecoration: done ? 'line-through' : 'none',
          color: done ? `${themeMeta.accent}66` : themeMeta.accent,
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: '-0.01em',
          transition: 'all 0.3s ease',
          marginBottom: 6,
          textShadow: done ? 'none' : `0 0 10px ${themeMeta.accent}44`,
          opacity: done ? 0.6 : 1
        }}>
          {item.title}
        </div>

        <Space size={6} wrap style={{ opacity: done ? 0.5 : 1, transition: 'opacity 0.3s ease' }}>
          <Tag
            bordered={false}
            color={meta.color}
            style={{
              borderRadius: 6,
              fontWeight: 500,
              padding: '1px 8px',
              transition: 'all 0.25s ease',
              transform: hovered && !done ? 'translateY(-1px)' : 'translateY(0)'
            }}
          >
            {meta.label}
          </Tag>

          {showDate && (
            <Tag
              bordered={false}
              style={{
                borderRadius: 6,
                background: 'rgba(100,100,100,0.08)',
                color: 'inherit',
                fontWeight: 500
              }}
            >
              {fmtDate(item.startTime)}
            </Tag>
          )}

          {!item.allDay && (
            <Tag
              bordered={false}
              style={{
                borderRadius: 6,
                background: 'rgba(100,100,100,0.08)',
                color: 'inherit',
                fontWeight: 500
              }}
            >
              {fmtTime(item.startTime)}
            </Tag>
          )}

          {item.repeatRule && (
            <Tag
              bordered={false}
              color="purple"
              style={{
                borderRadius: 6,
                fontWeight: 500,
                transition: 'all 0.25s ease',
                transform: hovered && !done ? 'translateY(-1px)' : 'translateY(0)'
              }}
            >
              ↻ {describeRRule(item.repeatRule)}
            </Tag>
          )}

          {typeof item.importance === 'number' && (
            <Tag
              bordered={false}
              color="red"
              style={{
                borderRadius: 6,
                fontWeight: 500,
                transition: 'all 0.25s ease',
                transform: hovered && !done ? 'translateY(-1px)' : 'translateY(0)'
              }}
            >
              象限 {item.importance + 1}
            </Tag>
          )}

          <ExtraPreview item={item} />
        </Space>

        {/* 子任务进度指示 */}
        {item.subtasks && item.subtasks.length > 0 && (
          <div style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: done ? `${themeMeta.accent}55` : themeMeta.accent + 'aa'
          }}>
            <div style={{
              flex: 1,
              height: 3,
              borderRadius: 999,
              background: 'rgba(100,100,100,0.1)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.round(item.subtasks.filter(s => s.done).length / item.subtasks.length * 100)}%`,
                height: '100%',
                borderRadius: 999,
                background: meta.color,
                transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
              }} />
            </div>
            <span>{item.subtasks.filter(s => s.done).length}/{item.subtasks.length}</span>
          </div>
        )}
      </div>
    </div>
  );
}
