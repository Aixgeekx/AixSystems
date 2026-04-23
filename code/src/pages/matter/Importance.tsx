// 四象限 - 2×2 网格,支持拖拽修改 importance (v0.21.4 主题适配)
import React from 'react';
import { Row, Col, Card } from 'antd';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { useItems } from '@/hooks/useItems';
import { db } from '@/db';
import { IMPORTANCE_LABELS, IMPORTANCE_COLORS } from '@/config/constants';
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';

function DraggableItem({ item, isDark }: { item: any; isDark: boolean }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: item.id });
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined;
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{
      padding: '6px 10px', background: isDark ? 'rgba(255,255,255,0.06)' : '#fff', borderRadius: 8, marginBottom: 6,
      cursor: 'grab', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee', color: isDark ? '#e2e8f0' : '#0f172a', ...style
    }}>{item.title}</div>
  );
}

function Quadrant({ index, items, isDark, accent }: { index: number; items: any[]; isDark: boolean; accent: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: `q-${index}` });
  return (
    <Card ref={setNodeRef} size="small" title={<span style={{ color: IMPORTANCE_COLORS[index] }}>{IMPORTANCE_LABELS[index]}</span>}
      style={{ height: '100%', background: isOver ? (isDark ? `${accent}18` : '#fffbe6') : (isDark ? 'rgba(10,14,28,0.5)' : '#fafafa'), minHeight: 280, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}>
      {items.length === 0 ? <Empty text="拖入事项" /> : items.map(it => <DraggableItem key={it.id} item={it} isDark={isDark} />)}
    </Card>
  );
}

export default function ImportancePage() {
  const items = useItems() || [];
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  async function onEnd(e: DragEndEvent) {
    const over = e.over?.id as string | undefined;
    const id = e.active.id as string;
    if (!over) return;
    const newImp = parseInt(over.replace('q-', ''), 10);
    await db.items.update(id, { importance: newImp as any });
  }
  return (
    <DndContext onDragEnd={onEnd}>
      <Row gutter={[16, 16]}>
        {[0, 1, 2, 3].map(i => (
          <Col key={i} span={12}>
            <Quadrant index={i} items={items.filter(it => it.importance === i)} isDark={isDark} accent={accent} />
          </Col>
        ))}
      </Row>
    </DndContext>
  );
}
