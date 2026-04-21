// 备忘录 - TipTap 富文本 + 文件夹 + 置顶 + 回收站
import React, { useState } from 'react';
import { Card, Input, Button, List, Space, Modal, message, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, PushpinOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { nanoid } from 'nanoid';
import { fmtDateTime } from '@/utils/time';
import { previewOf } from '@/utils/html';
import Empty from '@/components/Empty';
import RichEditor from '@/components/RichEditor';

export default function MemoPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const list = useLiveQuery(() => db.memos.filter(m => !m.deletedAt).reverse().sortBy('updatedAt'), []) || [];

  function openNew() { setEditing(null); setTitle(''); setContent(''); setOpen(true); }
  function openEdit(m: any) { setEditing(m); setTitle(m.title || ''); setContent(m.content || ''); setOpen(true); }

  async function save() {
    if (!content || content.replace(/<[^>]+>/g, '').trim() === '') return message.warning('内容不能为空');
    const nowTs = Date.now();
    if (editing) {
      await db.memos.update(editing.id, { title, content, updatedAt: nowTs });
    } else {
      await db.memos.add({ id: nanoid(), title, content, createdAt: nowTs, updatedAt: nowTs });
    }
    setOpen(false);
  }

  async function del(id: string) { await db.memos.update(id, { deletedAt: Date.now() }); }
  async function pin(m: any) { await db.memos.update(m.id, { pinned: !m.pinned }); }

  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={openNew} style={{ marginBottom: 16 }}>添加备忘</Button>
      {list.length === 0 ? <Empty text="暂无备忘" /> :
        <List dataSource={[...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))} renderItem={(m: any) => (
          <Card key={m.id} size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => openEdit(m)}
            extra={<Space>
              <PushpinOutlined style={{ color: m.pinned ? '#fa8c16' : '#ccc' }} onClick={e => { e.stopPropagation(); pin(m); }} />
              <DeleteOutlined onClick={e => { e.stopPropagation(); del(m.id); }} />
            </Space>}>
            <div><strong>{m.title || '无标题备忘'}</strong></div>
            <div style={{ color: '#666', marginTop: 6, maxHeight: 60, overflow: 'hidden' }}>{previewOf(m.content, 120)}</div>
            <Tag style={{ marginTop: 6 }}>{fmtDateTime(m.updatedAt)}</Tag>
          </Card>
        )} />
      }

      <Modal title={editing ? '编辑备忘' : '添加备忘'} open={open} onCancel={() => setOpen(false)} onOk={save} width={720} destroyOnClose>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="标题" style={{ marginBottom: 8 }} />
        <RichEditor value={content} onChange={setContent} placeholder="把事情记录下来..." minRows={10} />
      </Modal>
    </div>
  );
}
