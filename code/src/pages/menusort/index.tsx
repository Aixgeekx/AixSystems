// 菜单排序 - 拖拽排序 + 显示/隐藏,写入 settings (v0.21.4 主题适配)
import React, { useEffect, useState } from 'react';
import { Card, Switch, Typography, Button, message } from 'antd';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import * as Icons from '@ant-design/icons';
import { MenuOutlined, UndoOutlined } from '@ant-design/icons';
import { MENU_GROUPS } from '@/config/routes';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

const { Title, Paragraph } = Typography;

function iconOf(name: string) {                              // 动态 AntD 图标
  const k = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Outlined';
  const I = (Icons as any)[k];
  return I ? React.createElement(I) : null;
}

interface Row { key: string; label: string; icon?: string; path: string; hidden: boolean; }

function SortableRow({ row, onToggle, isDark }: { row: Row; onToggle: (k: string) => void; isDark: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: row.key });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={{ ...style, display: 'flex', alignItems: 'center', padding: '10px 12px',
      background: isDark ? 'rgba(255,255,255,0.06)' : '#fff', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0f0f0', borderRadius: 8, marginBottom: 6, color: isDark ? '#e2e8f0' : undefined }}>
      <span {...attributes} {...listeners} style={{ cursor: 'grab', marginRight: 10, color: isDark ? '#64748b' : '#bbb' }}><MenuOutlined /></span>
      {row.icon && <span style={{ marginRight: 8 }}>{iconOf(row.icon)}</span>}
      <span style={{ flex: 1 }}>{row.label}</span>
      <Switch size="small" checked={!row.hidden} onChange={() => onToggle(row.key)} />
    </div>
  );
}

export default function MenuSortPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const saved = await db.settings.get('menuOrder');
      const all = MENU_GROUPS.flatMap(g => g.children.map(c => ({
        key: c.key + '@' + c.path, label: g.label + ' · ' + c.label, icon: c.icon, path: c.path, hidden: false
      })));
      if (saved?.value) {
        const map: Record<string, number> = {};
        (saved.value.order as string[]).forEach((k, i) => { map[k] = i; });
        const hide: string[] = saved.value.hidden || [];
        all.forEach(r => { r.hidden = hide.includes(r.key); });
        all.sort((a, b) => (map[a.key] ?? 999) - (map[b.key] ?? 999));
      }
      setRows(all);
    })();
  }, []);

  async function persist(next: Row[]) {
    setRows(next);
    await db.settings.put({ key: 'menuOrder', value: {
      order: next.map(r => r.key),
      hidden: next.filter(r => r.hidden).map(r => r.key)
    }});
  }

  function onEnd(e: DragEndEvent) {
    if (!e.over || e.active.id === e.over.id) return;
    const oldIdx = rows.findIndex(r => r.key === e.active.id);
    const newIdx = rows.findIndex(r => r.key === e.over!.id);
    persist(arrayMove(rows, oldIdx, newIdx));
  }

  async function reset() {
    await db.settings.delete('menuOrder');
    message.success('已恢复默认排序,刷新生效');
    setTimeout(() => window.location.reload(), 500);
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <Typography>
        <Title level={3}>菜单排序</Title>
        <Paragraph type="secondary">拖拽排序 / 开关显示。设置保存到本地,下次启动生效。</Paragraph>
      </Typography>
      <Card>
        <DndContext collisionDetection={closestCenter} onDragEnd={onEnd}>
          <SortableContext items={rows.map(r => r.key)} strategy={verticalListSortingStrategy}>
            {rows.map(r => <SortableRow key={r.key} row={r} isDark={isDark} onToggle={(k) => persist(rows.map(x => x.key === k ? { ...x, hidden: !x.hidden } : x))} />)}
          </SortableContext>
        </DndContext>
      </Card>
      <Button style={{ marginTop: 12 }} icon={<UndoOutlined />} onClick={reset}>恢复默认</Button>
    </div>
  );
}
