// 回收站 - 事项/日记/备忘录已删除列表,可恢复或彻底删除 (v0.21.4 主题适配)
import React, { useState } from 'react';
import { Tabs, Button, List, Tag, Space, Popconfirm, message } from 'antd';
import { DeleteOutlined, UndoOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { fmtDate, fmtDateTime } from '@/utils/time';
import Empty from '@/components/Empty';
import { ITEM_TYPE_MAP } from '@/config/itemTypes';
import { useThemeVariants } from '@/hooks/useVariants';

export default function TrashPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const subColor = isDark ? '#64748b' : '#888';
  const [tab, setTab] = useState('items');
  const items = useLiveQuery(() => db.items.filter(x => !!x.deletedAt).toArray(), []) || [];
  const diaries = useLiveQuery(() => db.diaries.filter(x => !!x.deletedAt).toArray(), []) || [];
  const memos = useLiveQuery(() => db.memos.filter(x => !!x.deletedAt).toArray(), []) || [];

  async function restore(table: any, id: string) {
    await table.update(id, { deletedAt: undefined });
    message.success('已恢复');
  }
  async function purge(table: any, id: string) {
    await table.delete(id);
    message.success('已彻底删除');
  }
  async function purgeAll(table: any, rows: any[]) {
    await table.bulkDelete(rows.map(r => r.id));
    message.success('已清空');
  }

  const ItemList = ({ rows, table, render }: any) => rows.length === 0 ? <Empty text="空空如也" /> : (
    <>
      <Popconfirm title="确定清空全部?" onConfirm={() => purgeAll(table, rows)}>
        <Button danger size="small" style={{ marginBottom: 12 }}>清空全部</Button>
      </Popconfirm>
      <List dataSource={rows} renderItem={(r: any) => (
        <List.Item actions={[
          <Button key="r" size="small" icon={<UndoOutlined />} onClick={() => restore(table, r.id)}>恢复</Button>,
          <Popconfirm key="p" title="彻底删除?此操作不可撤销" onConfirm={() => purge(table, r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>彻底删除</Button>
          </Popconfirm>
        ]}>
          {render(r)}
        </List.Item>
      )} />
    </>
  );

  return (
    <div>
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'items', label: `事项 (${items.length})`, children: (
          <ItemList rows={items} table={db.items} render={(r: any) => (
            <Space><Tag color={ITEM_TYPE_MAP[r.type as keyof typeof ITEM_TYPE_MAP]?.color}>{ITEM_TYPE_MAP[r.type as keyof typeof ITEM_TYPE_MAP]?.label}</Tag>
              <strong>{r.title}</strong>
              <span style={{ color: subColor }}>{fmtDate(r.startTime)}</span></Space>
          )} />
        )},
        { key: 'diaries', label: `日记 (${diaries.length})`, children: (
          <ItemList rows={diaries} table={db.diaries} render={(r: any) => (
            <Space><Tag>{fmtDate(r.date)}</Tag><strong>{r.title || '无题'}</strong>
              <span style={{ color: subColor, maxWidth: 300, overflow: 'hidden' }}>{r.content?.slice(0, 40)}</span></Space>
          )} />
        )},
        { key: 'memos', label: `备忘 (${memos.length})`, children: (
          <ItemList rows={memos} table={db.memos} render={(r: any) => (
            <Space><Tag>{fmtDateTime(r.updatedAt)}</Tag><strong>{r.title || '无标题'}</strong>
              <span style={{ color: subColor, maxWidth: 300, overflow: 'hidden' }}>{r.content?.slice(0, 40)}</span></Space>
          )} />
        )}
      ]} />
    </div>
  );
}
