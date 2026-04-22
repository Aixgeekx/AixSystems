// 日记列表/日历 - 加密锁 + 那年今日 + TipTap 富文本
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Alert, Button, Card, Input, List, Modal, Skeleton, Space, Tabs, Tag, message } from 'antd';
import { DeleteOutlined, HistoryOutlined, LockOutlined, PlusOutlined, PushpinOutlined, ReloadOutlined, UnlockOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { fmtDate, today0 } from '@/utils/time';
import { previewOf } from '@/utils/html';
import Empty from '@/components/Empty';
import PasswordLock from '@/components/PasswordLock';
import { decryptText, encryptText, hashPassword } from '@/utils/crypto';
import { useSettingsStore } from '@/stores/settingsStore';

const RichEditor = lazy(() => import('@/components/RichEditor'));
const DRAFT_KEY = 'diary-draft';

interface DiaryDraft {
  title: string;
  content: string;
  mood: string;
}

function readDraft(): DiaryDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function DiaryPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [locked, setLocked] = useState(true);
  const [pwdOpen, setPwdOpen] = useState<null | 'setup' | 'verify'>(null);
  const [tab, setTab] = useState('list');
  const [hasDraft, setHasDraft] = useState(() => !!readDraft());

  const { setKV } = useSettingsStore();
  const diaryLockHash = useLiveQuery(() => db.settings.get('diaryLockHash').then(row => row?.value), []) as string | undefined;
  const list = useLiveQuery(() => db.diaries.filter(diary => !diary.deletedAt).reverse().sortBy('date'), []) || [];

  useEffect(() => {
    if (!diaryLockHash) setLocked(false);
  }, [diaryLockHash]);

  useEffect(() => {
    if (!open || editing) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, mood }));
    setHasDraft(!!(title || content || mood));
  }, [open, editing, title, content, mood]);

  const today = new Date();
  const memories = list.filter(diary => {
    const date = new Date(diary.date);
    return date.getMonth() === today.getMonth() && date.getDate() === today.getDate() && date.getFullYear() !== today.getFullYear();
  });

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setHasDraft(false);
  }

  function openNew() {
    setEditing(null);
    setTitle('');
    setContent('');
    setMood('');
    setOpen(true);
  }

  async function openEdit(diary: any) {
    if (diary.encrypted && diary.cipher) {
      const pwd = prompt('请输入该日记密码');
      if (!pwd) return;
      try {
        const plain = await decryptText(diary.cipher, pwd);
        setContent(plain);
      } catch {
        return message.error('密码错误');
      }
    } else {
      setContent(diary.content || '');
    }
    setEditing(diary);
    setTitle(diary.title || '');
    setMood(diary.mood || '');
    setOpen(true);
  }

  function restoreDraft() {
    const draft = readDraft();
    if (!draft) return;
    setEditing(null);
    setTitle(draft.title || '');
    setContent(draft.content || '');
    setMood(draft.mood || '');
    setOpen(true);
  }

  async function save() {
    if (!content || content.replace(/<[^>]+>/g, '').trim() === '') return message.warning('内容不能为空');
    const nowTs = Date.now();
    if (editing) {
      await db.diaries.update(editing.id, { title, content, mood, updatedAt: nowTs });
    } else {
      await db.diaries.add({ id: nanoid(), title, content, mood, date: today0(), createdAt: nowTs, updatedAt: nowTs });
      clearDraft();
    }
    message.success('保存成功');
    setOpen(false);
  }

  async function del(id: string) {
    await db.diaries.update(id, { deletedAt: Date.now() });
    message.success('已移入回收站');
  }

  async function togglePin(diary: any) {
    await db.diaries.update(diary.id, { pinned: !diary.pinned });
  }

  async function toggleLockOne(diary: any) {
    if (diary.encrypted) {
      const pwd = prompt('输入密码取消加密');
      if (!pwd) return;
      try {
        const plain = await decryptText(diary.cipher!, pwd);
        await db.diaries.update(diary.id, { encrypted: false, cipher: undefined, content: plain });
        message.success('已取消加密');
      } catch {
        message.error('密码错误');
      }
    } else {
      const pwd = prompt('设置本条密码，至少 4 位');
      if (!pwd || pwd.length < 4) return;
      const cipher = await encryptText(diary.content, pwd);
      await db.diaries.update(diary.id, { encrypted: true, cipher, content: '<p>【已加密】</p>' });
      message.success('已加密');
    }
  }

  async function setupGlobalLock(pwd: string) {
    const hash = await hashPassword(pwd);
    await setKV('diaryLockHash', hash);
    message.success('日记整体锁已开启');
    setPwdOpen(null);
  }

  if (diaryLockHash && locked) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
        <LockOutlined style={{ fontSize: 48, color: '#1677ff' }} />
        <h2>日记已加锁</h2>
        <Button type="primary" icon={<UnlockOutlined />} onClick={() => setPwdOpen('verify')}>输入密码解锁</Button>
        <PasswordLock
          mode="verify"
          open={pwdOpen === 'verify'}
          storedHash={diaryLockHash}
          onSuccess={() => { setLocked(false); setPwdOpen(null); }}
          onClose={() => setPwdOpen(null)}
        />
      </div>
    );
  }

  return (
    <div>
      <Space wrap style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>写日记</Button>
        {hasDraft ? (
          <Button icon={<ReloadOutlined />} onClick={restoreDraft}>恢复未保存草稿</Button>
        ) : null}
        {!diaryLockHash ? (
          <Button icon={<LockOutlined />} onClick={() => setPwdOpen('setup')}>设置整体锁</Button>
        ) : (
          <Button
            icon={<UnlockOutlined />}
            onClick={async () => {
              const pwd = prompt('输入密码关闭整体锁');
              if (!pwd) return;
              const hash = await hashPassword(pwd);
              if (hash === diaryLockHash) {
                await setKV('diaryLockHash', undefined);
                message.success('已关闭整体锁');
              } else {
                message.error('密码错误');
              }
            }}
          >
            关闭整体锁
          </Button>
        )}
      </Space>

      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'list',
            label: '日记列表',
            children: list.length === 0 ? <Empty text="暂无日记" /> : (
              <List
                dataSource={[...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))}
                renderItem={(diary: any) => (
                  <Card
                    key={diary.id}
                    size="small"
                    style={{ marginBottom: 8, cursor: 'pointer' }}
                    onClick={() => openEdit(diary)}
                    extra={(
                      <Space onClick={e => e.stopPropagation()}>
                        <LockOutlined style={{ color: diary.encrypted ? '#fa8c16' : '#ccc' }} onClick={() => toggleLockOne(diary)} />
                        <PushpinOutlined style={{ color: diary.pinned ? '#fa8c16' : '#ccc' }} onClick={() => togglePin(diary)} />
                        <DeleteOutlined onClick={() => del(diary.id)} />
                      </Space>
                    )}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{diary.title || '无题'}</strong>
                      <Tag>{fmtDate(diary.date)}</Tag>
                    </div>
                    <div style={{ color: '#666', marginTop: 8, maxHeight: 60, overflow: 'hidden' }}>
                      {diary.encrypted ? <Alert message="已加密，点击输入密码查看" type="warning" showIcon /> : previewOf(diary.content, 120)}
                    </div>
                    {diary.mood && <Tag color="pink" style={{ marginTop: 8 }}>{diary.mood}</Tag>}
                  </Card>
                )}
              />
            )
          },
          {
            key: 'memory',
            label: <><HistoryOutlined /> 那年今日 ({memories.length})</>,
            children: memories.length === 0 ? <Empty text="那年今日暂无记录" /> : (
              memories.map(diary => (
                <Card key={diary.id} size="small" style={{ marginBottom: 8 }}>
                  <Tag color="purple">{fmtDate(diary.date)}</Tag>
                  <strong style={{ marginLeft: 8 }}>{diary.title || '无题'}</strong>
                  <div style={{ color: '#666', marginTop: 8 }}>{diary.encrypted ? '【已加密】' : previewOf(diary.content, 200)}</div>
                </Card>
              ))
            )
          }
        ]}
      />

      <Modal
        title={editing ? '编辑日记' : '写日记'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
        width={720}
        destroyOnClose
      >
        {!editing && hasDraft ? (
          <Card size="small" style={{ marginBottom: 12, borderRadius: 16, background: 'rgba(15,23,42,0.03)' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <span>检测到本地未保存草稿，可继续编辑或清除。</span>
              <Space>
                <Button size="small" onClick={restoreDraft}>恢复草稿</Button>
                <Button size="small" danger onClick={clearDraft}>清除草稿</Button>
              </Space>
            </Space>
          </Card>
        ) : null}
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="标题，可选" style={{ marginBottom: 8 }} />
        <Input value={mood} onChange={e => setMood(e.target.value)} placeholder="今日心情，如 开心 / 平静 / 沉思" style={{ marginBottom: 8 }} />
        <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
          <RichEditor value={content} onChange={setContent} placeholder="今天发生了哪些难忘的事？" minRows={10} />
        </Suspense>
      </Modal>

      <PasswordLock mode="set" open={pwdOpen === 'setup'} onSuccess={setupGlobalLock} onClose={() => setPwdOpen(null)} title="设置日记整体锁" />
    </div>
  );
}
