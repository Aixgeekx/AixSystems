// 备忘录 - TipTap 富文本 + 文件夹 + 置顶 + 回收站
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Button, Card, Input, List, Modal, Skeleton, Space, Tag, message } from 'antd';
import { DeleteOutlined, PlusOutlined, PushpinOutlined, ReloadOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { fmtDateTime } from '@/utils/time';
import { previewOf } from '@/utils/html';
import Empty from '@/components/Empty';

const RichEditor = lazy(() => import('@/components/RichEditor'));
const DRAFT_KEY = 'memo-draft';

interface MemoDraft {
  title: string;
  content: string;
}

function readDraft(): MemoDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function MemoPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hasDraft, setHasDraft] = useState(() => !!readDraft());

  const list = useLiveQuery(() => db.memos.filter(memo => !memo.deletedAt).reverse().sortBy('updatedAt'), []) || [];

  useEffect(() => {
    if (!open || editing) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content }));
    setHasDraft(!!(title || content));
  }, [open, editing, title, content]);

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  }

  function openNew() {
    setEditing(null);
    setTitle('');
    setContent('');
    setOpen(true);
  }

  function openEdit(memo: any) {
    setEditing(memo);
    setTitle(memo.title || '');
    setContent(memo.content || '');
    setOpen(true);
  }

  function restoreDraft() {
    const draft = readDraft();
    if (!draft) return;
    setEditing(null);
    setTitle(draft.title || '');
    setContent(draft.content || '');
    setOpen(true);
  }

  async function save() {
    if (!content || content.replace(/<[^>]+>/g, '').trim() === '') return message.warning('内容不能为空');
    const nowTs = Date.now();
    if (editing) {
      await db.memos.update(editing.id, { title, content, updatedAt: nowTs });
    } else {
      await db.memos.add({ id: nanoid(), title, content, createdAt: nowTs, updatedAt: nowTs });
      clearDraft();
    }
    setOpen(false);
  }

  async function del(id: string) {
    await db.memos.update(id, { deletedAt: Date.now() });
  }

  async function pin(memo: any) {
    await db.memos.update(memo.id, { pinned: !memo.pinned });
  }

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>添加备忘</Button>
        {hasDraft ? (
          <Button icon={<ReloadOutlined />} onClick={restoreDraft}>恢复未保存草稿</Button>
        ) : null}
      </Space>

      {list.length === 0 ? (
        <Empty text="暂无备忘" />
      ) : (
        <List
          dataSource={[...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))}
          renderItem={(memo: any) => (
            <Card
              key={memo.id}
              size="small"
              style={{ marginBottom: 8, cursor: 'pointer' }}
              onClick={() => openEdit(memo)}
              extra={(
                <Space>
                  <PushpinOutlined style={{ color: memo.pinned ? '#fa8c16' : '#ccc' }} onClick={e => { e.stopPropagation(); pin(memo); }} />
                  <DeleteOutlined onClick={e => { e.stopPropagation(); del(memo.id); }} />
                </Space>
              )}
            >
              <div><strong>{memo.title || '无标题备忘'}</strong></div>
              <div style={{ color: '#666', marginTop: 6, maxHeight: 60, overflow: 'hidden' }}>{previewOf(memo.content, 120)}</div>
              <Tag style={{ marginTop: 6 }}>{fmtDateTime(memo.updatedAt)}</Tag>
            </Card>
          )}
        />
      )}

      <Modal
        title={editing ? '编辑备忘' : '添加备忘'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
        width={720}
        destroyOnClose
      >
        {!editing && hasDraft ? (
          <Card size="small" style={{ marginBottom: 12, borderRadius: 16, background: 'rgba(15,23,42,0.03)' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <span>检测到本地未保存草稿，可继续编辑或忽略。</span>
              <Space>
                <Button size="small" onClick={restoreDraft}>恢复草稿</Button>
                <Button size="small" danger onClick={clearDraft}>清除草稿</Button>
              </Space>
            </Space>
          </Card>
        ) : null}
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="标题" style={{ marginBottom: 8 }} />
        <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
          <RichEditor value={content} onChange={setContent} placeholder="把事情记录下来..." minRows={10} />
        </Suspense>
      </Modal>
    </div>
  );
}
