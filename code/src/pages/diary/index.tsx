// 日记列表/日历 - 加密锁 + 那年今日 + TipTap 富文本
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, List, Tag, Modal, Space, message, Alert, Tabs } from 'antd';
import { PlusOutlined, DeleteOutlined, PushpinOutlined, LockOutlined, UnlockOutlined, HistoryOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { nanoid } from 'nanoid';
import { fmtDate, today0 } from '@/utils/time';
import { previewOf } from '@/utils/html';
import Empty from '@/components/Empty';
import PasswordLock from '@/components/PasswordLock';
import RichEditor from '@/components/RichEditor';
import { encryptText, decryptText, hashPassword } from '@/utils/crypto';
import { useSettingsStore } from '@/stores/settingsStore';

export default function DiaryPage() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState('');
  const [locked, setLocked] = useState(true);
  const [pwdOpen, setPwdOpen] = useState<null | 'setup' | 'verify'>(null);
  const [tab, setTab] = useState('list');

  const { setKV } = useSettingsStore();
  const diaryLockHash = useLiveQuery(() => db.settings.get('diaryLockHash').then(r => r?.value), []) as string | undefined;

  const list = useLiveQuery(() => db.diaries.filter(d => !d.deletedAt).reverse().sortBy('date'), []) || [];

  useEffect(() => { if (!diaryLockHash) setLocked(false); }, [diaryLockHash]);

  const today = new Date();
  const memories = list.filter(d => {
    const dd = new Date(d.date);
    return dd.getMonth() === today.getMonth() && dd.getDate() === today.getDate() && dd.getFullYear() !== today.getFullYear();
  });

  function openNew() { setEditing(null); setTitle(''); setContent(''); setMood(''); setOpen(true); }
  async function openEdit(d: any) {
    if (d.encrypted && d.cipher) {
      const pwd = prompt('请输入该日记密码');
      if (!pwd) return;
      try { const plain = await decryptText(d.cipher, pwd); setContent(plain); }
      catch { return message.error('密码错误'); }
    } else setContent(d.content || '');
    setEditing(d); setTitle(d.title || ''); setMood(d.mood || ''); setOpen(true);
  }

  async function save() {
    if (!content || content.replace(/<[^>]+>/g, '').trim() === '') return message.warning('内容不能为空');
    const nowTs = Date.now();
    if (editing) {
      await db.diaries.update(editing.id, { title, content, mood, updatedAt: nowTs });
    } else {
      await db.diaries.add({ id: nanoid(), title, content, mood, date: today0(), createdAt: nowTs, updatedAt: nowTs });
    }
    message.success('保存成功');
    setOpen(false);
  }

  async function del(id: string) { await db.diaries.update(id, { deletedAt: Date.now() }); message.success('已移入回收站'); }
  async function togglePin(d: any) { await db.diaries.update(d.id, { pinned: !d.pinned }); }

  async function toggleLockOne(d: any) {
    if (d.encrypted) {
      const pwd = prompt('输入密码取消加密');
      if (!pwd) return;
      try {
        const plain = await decryptText(d.cipher!, pwd);
        await db.diaries.update(d.id, { encrypted: false, cipher: undefined, content: plain });
        message.success('已取消加密');
      } catch { message.error('密码错误'); }
    } else {
      const pwd = prompt('设置本条密码 (至少 4 位)');
      if (!pwd || pwd.length < 4) return;
      const cipher = await encryptText(d.content, pwd);
      await db.diaries.update(d.id, { encrypted: true, cipher, content: '<p>【已加密】</p>' });
      message.success('已加密');
    }
  }

  async function setupGlobalLock(pwd: string) {
    const h = await hashPassword(pwd);
    await setKV('diaryLockHash', h);
    message.success('日记整体锁已开启');
    setPwdOpen(null);
  }

  if (diaryLockHash && locked) {
    return (
      <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center' }}>
        <LockOutlined style={{ fontSize: 48, color: '#1677ff' }} />
        <h2>日记已加锁</h2>
        <Button type="primary" icon={<UnlockOutlined />} onClick={() => setPwdOpen('verify')}>输入密码解锁</Button>
        <PasswordLock mode="verify" open={pwdOpen === 'verify'} storedHash={diaryLockHash}
          onSuccess={() => { setLocked(false); setPwdOpen(null); }} onClose={() => setPwdOpen(null)} />
      </div>
    );
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>写日记</Button>
        {!diaryLockHash ?
          <Button icon={<LockOutlined />} onClick={() => setPwdOpen('setup')}>设置整体锁</Button> :
          <Button icon={<UnlockOutlined />} onClick={async () => {
            const pwd = prompt('输入密码关闭整体锁');
            if (!pwd) return;
            const h = await hashPassword(pwd);
            if (h === diaryLockHash) { await setKV('diaryLockHash', undefined); message.success('已关闭整体锁'); }
            else message.error('密码错误');
          }}>关闭整体锁</Button>
        }
      </Space>

      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'list', label: '日记列表', children: list.length === 0 ? <Empty text="暂无日记" /> :
          <List dataSource={[...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))} renderItem={(d: any) => (
            <Card key={d.id} size="small" style={{ marginBottom: 8, cursor: 'pointer' }} onClick={() => openEdit(d)}
              extra={<Space onClick={e => e.stopPropagation()}>
                <LockOutlined style={{ color: d.encrypted ? '#fa8c16' : '#ccc' }} onClick={() => toggleLockOne(d)} />
                <PushpinOutlined style={{ color: d.pinned ? '#fa8c16' : '#ccc' }} onClick={() => togglePin(d)} />
                <DeleteOutlined onClick={() => del(d.id)} />
              </Space>}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{d.title || '无题'}</strong>
                <Tag>{fmtDate(d.date)}</Tag>
              </div>
              <div style={{ color: '#666', marginTop: 8, maxHeight: 60, overflow: 'hidden' }}>
                {d.encrypted ? <Alert message="已加密,点击输入密码查看" type="warning" showIcon /> : previewOf(d.content, 120)}
              </div>
              {d.mood && <Tag color="pink" style={{ marginTop: 8 }}>{d.mood}</Tag>}
            </Card>
          )} />
        },
        { key: 'memory', label: <><HistoryOutlined /> 那年今日 ({memories.length})</>, children: memories.length === 0 ?
          <Empty text="那年今日暂无记录" /> :
          memories.map(d => (
            <Card key={d.id} size="small" style={{ marginBottom: 8 }}>
              <Tag color="purple">{fmtDate(d.date)}</Tag>
              <strong style={{ marginLeft: 8 }}>{d.title || '无题'}</strong>
              <div style={{ color: '#666', marginTop: 8 }}>{d.encrypted ? '【已加密】' : previewOf(d.content, 200)}</div>
            </Card>
          ))
        }
      ]} />

      <Modal title={editing ? '编辑日记' : '写日记'} open={open} onCancel={() => setOpen(false)} onOk={save} width={720} destroyOnClose>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="标题(可选)" style={{ marginBottom: 8 }} />
        <Input value={mood} onChange={e => setMood(e.target.value)} placeholder="今日心情(如:开心/平静/沉思)" style={{ marginBottom: 8 }} />
        <RichEditor value={content} onChange={setContent} placeholder="今天发生了哪些难忘的事?" minRows={10} />
      </Modal>

      <PasswordLock mode="set" open={pwdOpen === 'setup'} onSuccess={setupGlobalLock} onClose={() => setPwdOpen(null)} title="设置日记整体锁" />
    </div>
  );
}
