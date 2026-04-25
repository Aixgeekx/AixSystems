// 事项卡片 - 时间线/列表共用 (v0.24.0 Premium 视觉)
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
  const isDark = themeMeta.style === 'dark' || themeMeta.style === 'cyberpunk' || themeMeta.key === 'minimal_dark';
  const staggerDelay = Math.min(index * 0.04, 0.35);

  async function toggle(e: any) {
    e?.stopPropagation?.();
    const next = done ? 'pending' : 'done';
    await db.items.update(item.id, { completeStatus: next, completeTime: next === 'done' ? Date.now() : undefined });
  }

  const isOverdue = !done && item.startTime < Date.now();

  return (
    <div
      className="anim-fade-in-up"
      onClick={() => openItemForm(item.id)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        padding: '14px 18px',
        marginBottom: 10,
        borderRadius: 16,
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
      {/* 左侧指示条 - 渐变色 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
        borderRadius: '3px 0 0 3px',
        background: `linear-gradient(180deg, ${meta.color}, ${meta.color}55)`,
        opacity: done ? 0.12 : 1,
        transition: 'all 0.35s ease',
        boxShadow: done ? 'none' : `0 0 10px ${meta.color}66`
      }} />

      {/* 悬浮光效 */}
      {!done && hovered && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 85% 50%, ${meta.color}0c 0%, transparent 55%)`,
          pointerEvents: 'none', transition: 'opacity 0.4s ease'
        }} />
      )}

      {/* 完成打钩动画容器 */}
      <div style={{
        marginTop: 3, marginRight: 14, position: 'relative', zIndex: 1,
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        transform: hovered && !done ? 'scale(1.2)' : 'scale(1)'
      }}>
        <Checkbox
          checked={done}
          onChange={toggle}
          onClick={e => e.stopPropagation()}
        />
        {/* 完成时的光环 */}
        {done && (
          <div style={{
            position: 'absolute', inset: -4, borderRadius: '50%',
            border: `1.5px solid ${meta.color}33`, pointerEvents: 'none'
          }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        {/* 标题行 */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6
        }}>
          <span style={{
            textDecoration: done ? 'line-through' : 'none',
            color: done ? (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)') : (isDark ? '#f1f5f9' : '#1e293b'),
            fontWeight: 600, fontSize: 15,
            letterSpacing: '-0.01em',
            transition: 'all 0.3s ease',
            flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {item.title}
          </span>
          {isOverdue && (
            <Tag bordered={false} color="error" style={{
              borderRadius: 8, fontSize: 11, padding: '0 6px', lineHeight: '18px',
              marginInlineEnd: 0, flexShrink: 0
            }}>
              逾期
            </Tag>
          )}
          {item.pinned && (
            <Tag bordered={false} color="warning" style={{
              borderRadius: 8, fontSize: 11, padding: '0 6px', lineHeight: '18px',
              marginInlineEnd: 0, flexShrink: 0
            }}>
              📌
            </Tag>
          )}
        </div>

        {/* 标签行 */}
        <Space size={5} wrap style={{ opacity: done ? 0.4 : 1, transition: 'opacity 0.3s ease' }}>
          <Tag
            bordered={false}
            color={meta.color}
            style={{
              borderRadius: 8, fontWeight: 500, padding: '1px 8px', fontSize: 12,
              transition: 'all 0.25s ease',
              transform: hovered && !done ? 'translateY(-1px)' : 'translateY(0)'
            }}
          >
            {meta.label}
          </Tag>

          {showDate && (
            <Tag bordered={false} style={{
              borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: isDark ? 'rgba(226,232,240,0.7)' : '#64748b', fontWeight: 500, fontSize: 12
            }}>
              {fmtDate(item.startTime)}
            </Tag>
          )}

          {!item.allDay && (
            <Tag bordered={false} style={{
              borderRadius: 8, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              color: isDark ? 'rgba(226,232,240,0.7)' : '#64748b', fontWeight: 500, fontSize: 12
            }}>
              {fmtTime(item.startTime)}
            </Tag>
          )}

          {item.repeatRule && (
            <Tag bordered={false} color="purple" style={{
              borderRadius: 8, fontWeight: 500, fontSize: 12,
              transition: 'all 0.25s ease',
              transform: hovered && !done ? 'translateY(-1px)' : 'translateY(0)'
            }}>
              ↻ {describeRRule(item.repeatRule)}
            </Tag>
          )}

          {typeof item.importance === 'number' && (
            <Tag bordered={false} color="red" style={{
              borderRadius: 8, fontWeight: 500, fontSize: 12,
              transition: 'all 0.25s ease',
              transform: hovered && !done ? 'translateY(-1px)' : 'translateY(0)'
            }}>
              Q{item.importance + 1}
            </Tag>
          )}

          <ExtraPreview item={item} />
        </Space>

        {/* 子任务进度 - 增强渐变条 */}
        {item.subtasks && item.subtasks.length > 0 && (
          <div style={{
            marginTop: 10, display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: done ? (isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)') : (isDark ? 'rgba(226,232,240,0.6)' : '#94a3b8')
          }}>
            <div style={{
              flex: 1, height: 4, borderRadius: 999,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.round(item.subtasks.filter(s => s.done).length / item.subtasks.length * 100)}%`,
                height: '100%', borderRadius: 999,
                background: `linear-gradient(90deg, ${meta.color}, ${meta.color}aa)`,
                transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: `0 0 8px ${meta.color}44`
              }} />
            </div>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500 }}>
              {item.subtasks.filter(s => s.done).length}/{item.subtasks.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
