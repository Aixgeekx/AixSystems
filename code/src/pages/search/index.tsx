// 全局搜索 - 跨 items/diaries/memos
import React, { useState } from 'react';
import { Input, Card, List, Tag, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { fmtDate } from '@/utils/time';
import { useAppStore } from '@/stores/appStore';

export default function SearchPage() {
  const [kw, setKw] = useState('');
  const openItemForm = useAppStore(s => s.openItemForm);
  const result = useLiveQuery(async () => {
    if (!kw) return { items: [], diaries: [], memos: [] };
    const items = (await db.items.toArray()).filter(i => !i.deletedAt && (i.title.includes(kw) || i.description?.includes(kw)));
    const diaries = (await db.diaries.toArray()).filter(d => !d.deletedAt && (d.title?.includes(kw) || d.content?.includes(kw)));
    const memos = (await db.memos.toArray()).filter(m => !m.deletedAt && (m.title?.includes(kw) || m.content?.includes(kw)));
    return { items, diaries, memos };
  }, [kw]);

  return (
    <div>
      <Input size="large" prefix={<SearchOutlined />} placeholder="搜索事项/日记/备忘录"
        value={kw} onChange={e => setKw(e.target.value)} style={{ marginBottom: 16 }} />

      <Card title={`事项 ${result?.items?.length || 0}`} size="small" style={{ marginBottom: 12 }}>
        <List size="small" dataSource={result?.items || []} renderItem={(i: any) => (
          <List.Item onClick={() => openItemForm(i.id)} style={{ cursor: 'pointer' }}>
            <Space><Tag>{fmtDate(i.startTime)}</Tag>{i.title}</Space>
          </List.Item>
        )} />
      </Card>
      <Card title={`日记 ${result?.diaries?.length || 0}`} size="small" style={{ marginBottom: 12 }}>
        <List size="small" dataSource={result?.diaries || []} renderItem={(d: any) => (
          <List.Item><Space><Tag>{fmtDate(d.date)}</Tag>{d.title || d.content.slice(0, 30)}</Space></List.Item>
        )} />
      </Card>
      <Card title={`备忘 ${result?.memos?.length || 0}`} size="small">
        <List size="small" dataSource={result?.memos || []} renderItem={(m: any) => (
          <List.Item><Space><Tag>{fmtDate(m.updatedAt)}</Tag>{m.title || m.content.slice(0, 30)}</Space></List.Item>
        )} />
      </Card>
    </div>
  );
}
