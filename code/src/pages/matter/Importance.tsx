// 四象限 - 2×2 网格,支持拖拽修改 importance
import React from 'react';
import { Row, Col, Card } from 'antd';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { useItems } from '@/hooks/useItems';
import { db } from '@/db';
import { IMPORTANCE_LABELS, IMPORTANCE_COLORS } from '@/config/constants';
import Empty from '@/components/Empty';

function DraggableItem({ item }: { item: any }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: item.id });
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined;
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{
      padding: '6px 10px', background: '#fff', borderRadius: 4, marginBottom: 6,
      cursor: 'grab', border: '1px solid #eee', ...style
    }}>{item.title}</div>
  );
}

function Quadrant({ index, items }: { index: number; items: any[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: `q-${index}` });
  return (
    <Card ref={setNodeRef} size="small" title={<span style={{ color: IMPORTANCE_COLORS[index] }}>{IMPORTANCE_LABELS[index]}</span>}
      style={{ height: '100%', background: isOver ? '#fffbe6' : '#fafafa', minHeight: 280 }}>
      {items.length === 0 ? <Empty text="拖入事项" /> : items.map(it => <DraggableItem key={it.id} item={it} />)}
    </Card>
  );
}

export default function ImportancePage() {
  const items = useItems() || [];
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
            <Quadrant index={i} items={items.filter(it => it.importance === i)} />
          </Col>
        ))}
      </Row>
    </DndContext>
  );
}
