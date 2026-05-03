// 四象限 - 工作台风格 (v0.24.0 完善升级)
import React from 'react';
import { Card, Col, Row, Space, Statistic, Tag, Typography, Divider, Button, Select } from 'antd';
import { AppstoreOutlined, CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { useItems } from '@/hooks/useItems';
import { db } from '@/db';
import { IMPORTANCE_LABELS, IMPORTANCE_COLORS } from '@/config/constants';
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';
import { useAppStore } from '@/stores/appStore';
import { ROUTES } from '@/config/routes';

function DraggableItem({ item, isDark, accent }: { item: any; isDark: boolean; accent: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: item.id });
  const style = transform ? { transform: `translate(${transform.x}px,${transform.y}px)` } : undefined;
  const done = item.completeStatus === 'done';
  return (
    <div ref={setNodeRef} {...attributes} {...listeners} style={{
      padding: '10px 14px', background: isDark ? 'rgba(255,255,255,0.06)' : '#fff', borderRadius: 12, marginBottom: 8,
      cursor: 'grab', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #eee',
      color: isDark ? '#e2e8f0' : '#0f172a', transition: 'all 0.25s ease',
      textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.5 : 1, ...style
    }}>
      <div style={{ fontWeight: 500, fontSize: 13 }}>{item.title}</div>
      {item.subtasks?.length > 0 && (
        <div style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', marginTop: 4 }}>
          子任务 {item.subtasks.filter((s: any) => s.done).length}/{item.subtasks.length}
        </div>
      )}
    </div>
  );
}

function Quadrant({ index, items, isDark, accent, onAdd }: { index: number; items: any[]; isDark: boolean; accent: string; onAdd: () => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `q-${index}` });
  const done = items.filter(i => i.completeStatus === 'done').length;
  return (
    <Card ref={setNodeRef} bordered={false}
      title={
        <Space>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: IMPORTANCE_COLORS[index] }} />
          <span style={{ color: isDark ? '#f8fafc' : '#0f172a', fontWeight: 600 }}>{IMPORTANCE_LABELS[index]}</span>
          <Tag style={{ borderRadius: 6, marginInlineEnd: 0 }}>{items.length}</Tag>
          <Button size="small" type="text" icon={<PlusOutlined />} onClick={onAdd} />
        </Space>
      }
      style={{
        height: '100%', borderRadius: 20, minHeight: 300,
        background: isOver ? (isDark ? `${accent}18` : '#fffbe6') : (isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)'),
        border: isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)',
        transition: 'all 0.3s ease'
      }}
      bodyStyle={{ padding: 12 }}
    >
      {items.length === 0
        ? <Empty text="拖入事项" subtext="将事项拖拽到这里改变优先级" />
        : items.map(it => <DraggableItem key={it.id} item={it} isDark={isDark} accent={accent} />)
      }
      {done > 0 && (
        <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: isDark ? '#64748b' : '#94a3b8' }}>
          <CheckCircleOutlined /> 已完成 {done}/{items.length}
        </div>
      )}
    </Card>
  );
}

export default function ImportancePage() {
  const items = useItems() || [];
  const nav = useNavigate();
  const openItemForm = useAppStore(s => s.openItemForm);
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const quadrants = [0, 1, 2, 3].map(i => items.filter(it => it.importance === i));

  async function onEnd(e: DragEndEvent) {
    const over = e.over?.id as string | undefined;
    const id = e.active.id as string;
    if (!over) return;
    const newImp = parseInt(over.replace('q-', ''), 10);
    await db.items.update(id, { importance: newImp as any });
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(239,68,68,0.94), rgba(234,88,12,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(239,68,68,0.14)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={14}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
              <AppstoreOutlined /> 优先矩阵
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
              四象限 · 拖拽排列优先级
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 12, color: 'rgba(226,232,240,0.84)' }}>
              基于艾森豪威尔矩阵，拖拽事项到对应象限即可快速调整优先级。
            </Typography.Paragraph>
            <Select value="importance" style={{ width: 168 }} onChange={value => value === 'calendar' ? nav(ROUTES.MATTER_SCHEDULE) : value === 'all' ? nav(ROUTES.MATTER_ALL) : undefined} options={[{ label: '四象限视图', value: 'importance' }, { label: '日历视图', value: 'calendar' }, { label: '全部事项', value: 'all' }]} />
          </Col>
          <Col xs={24} lg={10}>
            <Row gutter={[12, 12]}>
              {quadrants.map((q, i) => (
                <Col span={12} key={i}>
                  <div style={{
                    borderRadius: 14, padding: '10px 14px', textAlign: 'center',
                    background: `${IMPORTANCE_COLORS[i]}18`, border: `1px solid ${IMPORTANCE_COLORS[i]}33`
                  }}>
                    <div style={{ color: 'rgba(226,232,240,0.7)', fontSize: 11 }}>{IMPORTANCE_LABELS[i]}</div>
                    <div style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>{q.length}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      <DndContext onDragEnd={onEnd}>
        <Row gutter={[16, 16]}>
          {[0, 1, 2, 3].map(i => (
            <Col key={i} xs={24} md={12}>
              <div className="anim-fade-in-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}>
                <Quadrant index={i} items={quadrants[i]} isDark={isDark} accent={accent} onAdd={() => openItemForm(undefined, 'schedule')} />
              </div>
            </Col>
          ))}
        </Row>
      </DndContext>
    </Space>
  );
}
