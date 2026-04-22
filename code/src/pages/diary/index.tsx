// 日记列表/日历 - 加密锁 + 那年今日 + TipTap 富文本
import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Input, List, Modal, Row, Skeleton, Space, Statistic, Tabs, Tag, Typography, message } from 'antd';
import {
  DeleteOutlined,
  HistoryOutlined,
  LockOutlined,
  PlusOutlined,
  PushpinOutlined,
  ReloadOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { fmtDate, fmtDateTime, fmtFromNow, today0 } from '@/utils/time';
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
  const pinnedCount = useMemo(() => list.filter(diary => diary.pinned).length, [list]);
  const latestDiary = list[0];

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
      <Card
        bordered={false}
        style={{
          maxWidth: 560,
          margin: '64px auto',
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(124,58,237,0.92) 48%, rgba(236,72,153,0.88) 100%)',
          boxShadow: '0 30px 70px rgba(15,23,42,0.2)'
        }}
        bodyStyle={{ padding: 28, textAlign: 'center' }}
      >
        <LockOutlined style={{ fontSize: 52, color: '#fff' }} />
        <Typography.Title level={2} style={{ margin: '16px 0 8px', color: '#fff' }}>
          日记已加锁
        </Typography.Title>
        <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.82)' }}>
          你的日记内容仍保留在本地，只是在进入前需要先通过密码验证。
        </Typography.Paragraph>
        <Button type="primary" icon={<UnlockOutlined />} onClick={() => setPwdOpen('verify')}>
          输入密码解锁
        </Button>
        <PasswordLock
          mode="verify"
          open={pwdOpen === 'verify'}
          storedHash={diaryLockHash}
          onSuccess={() => { setLocked(false); setPwdOpen(null); }}
          onClose={() => setPwdOpen(null)}
        />
      </Card>
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(124,58,237,0.9) 46%, rgba(236,72,153,0.88) 100%)',
          boxShadow: '0 30px 70px rgba(15,23,42,0.18)'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: 'rgba(233,213,255,0.88)' }}>日记工作台</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff' }}>
              把每天的情绪、事件和想法，沉淀成可回看的本地记录
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(243,232,255,0.84)' }}>
              支持草稿恢复、单篇加密、整体锁和那年今日。你可以把这里当成一套真正可长期积累的离线日记系统。
            </Typography.Paragraph>
            <Space wrap size={10}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>写日记</Button>
              {hasDraft ? <Button icon={<ReloadOutlined />} onClick={restoreDraft}>恢复草稿</Button> : null}
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
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)' }}>
                  <Statistic title="总篇数" value={list.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)' }}>
                  <Statistic title="置顶" value={pinnedCount} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)' }}>
                  <Statistic title="那年今日" value={memories.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
            <Typography.Text type="secondary">写作状态</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px' }}>最近编辑</Typography.Title>
            {latestDiary ? (
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{latestDiary.title || '未命名日记'}</div>
                <div style={{ marginTop: 8, color: '#475569' }}>{fmtDateTime(latestDiary.updatedAt)}</div>
                <div style={{ color: '#94a3b8', marginTop: 4 }}>{fmtFromNow(latestDiary.updatedAt)}</div>
              </div>
            ) : (
              <div style={{ color: '#94a3b8' }}>还没有日记内容</div>
            )}
            {hasDraft ? (
              <Card size="small" style={{ marginTop: 16, borderRadius: 16, background: 'rgba(124,58,237,0.08)' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                  <span>检测到未保存草稿</span>
                  <Space>
                    <Button size="small" onClick={restoreDraft}>恢复</Button>
                    <Button size="small" danger onClick={clearDraft}>清除</Button>
                  </Space>
                </Space>
              </Card>
            ) : null}
          </Card>

          <Card bordered={false} style={{ marginTop: 16, borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
            <Typography.Text type="secondary">那年今日</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px' }}>同一天的旧记录</Typography.Title>
            {memories.length ? (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {memories.slice(0, 4).map(diary => (
                  <div key={diary.id} style={{ padding: 14, borderRadius: 18, background: 'rgba(236,72,153,0.08)' }}>
                    <div style={{ fontWeight: 700 }}>{diary.title || '无题'}</div>
                    <div style={{ marginTop: 6, color: '#64748b' }}>{previewOf(diary.content, 56)}</div>
                    <Tag color="purple" style={{ marginTop: 10 }}>{fmtDate(diary.date)}</Tag>
                  </div>
                ))}
              </Space>
            ) : (
              <div style={{ color: '#94a3b8' }}>那年今日暂无记录</div>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={15}>
          <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
            <Tabs
              activeKey={tab}
              onChange={setTab}
              items={[
                {
                  key: 'list',
                  label: '日记列表',
                  children: list.length === 0 ? (
                    <Empty text="暂无日记，今天就写第一篇吧。" />
                  ) : (
                    <Space direction="vertical" size={14} style={{ width: '100%' }}>
                      {[...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map((diary: any) => (
                        <Card
                          key={diary.id}
                          bordered={false}
                          style={{ borderRadius: 22, background: diary.pinned ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.94)', cursor: 'pointer' }}
                          onClick={() => openEdit(diary)}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <Typography.Title level={5} style={{ margin: 0 }}>{diary.title || '无题'}</Typography.Title>
                                <Tag>{fmtDate(diary.date)}</Tag>
                                {diary.pinned ? <Tag color="gold">置顶</Tag> : null}
                                {diary.encrypted ? <Tag color="red">已加密</Tag> : null}
                                {diary.mood ? <Tag color="magenta">{diary.mood}</Tag> : null}
                              </div>
                              <div style={{ marginTop: 8, color: '#475569' }}>
                                {diary.encrypted
                                  ? '此内容已加密，点击后输入密码查看。'
                                  : previewOf(diary.content, 180)}
                              </div>
                              <Space wrap size={[8, 8]} style={{ marginTop: 10 }}>
                                <Tag>{fmtDateTime(diary.updatedAt)}</Tag>
                                <Tag color="blue">{fmtFromNow(diary.updatedAt)}</Tag>
                              </Space>
                            </div>
                            <Space onClick={e => e.stopPropagation()}>
                              <LockOutlined style={{ color: diary.encrypted ? '#f59e0b' : '#94a3b8' }} onClick={() => toggleLockOne(diary)} />
                              <PushpinOutlined style={{ color: diary.pinned ? '#f59e0b' : '#94a3b8' }} onClick={() => togglePin(diary)} />
                              <DeleteOutlined onClick={() => del(diary.id)} />
                            </Space>
                          </div>
                        </Card>
                      ))}
                    </Space>
                  )
                },
                {
                  key: 'memory',
                  label: <><HistoryOutlined /> 那年今日</>,
                  children: memories.length === 0 ? (
                    <Empty text="那年今日暂无记录" />
                  ) : (
                    <Row gutter={[14, 14]}>
                      {memories.map(diary => (
                        <Col key={diary.id} xs={24} md={12}>
                          <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(124,58,237,0.08)' }}>
                            <Tag color="purple">{fmtDate(diary.date)}</Tag>
                            <Typography.Title level={5} style={{ margin: '10px 0 6px' }}>{diary.title || '无题'}</Typography.Title>
                            <Typography.Text style={{ color: '#475569' }}>
                              {diary.encrypted ? '【已加密】' : previewOf(diary.content, 120)}
                            </Typography.Text>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal title={editing ? '编辑日记' : '写日记'} open={open} onCancel={() => setOpen(false)} onOk={save} width={720} destroyOnClose>
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
    </Space>
  );
}
