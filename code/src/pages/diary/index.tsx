// 日记列表/日历 - 加密锁 + 那年今日 + TipTap 富文本 (v0.20.0 主题适配 + 动画)
import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Input, List, Modal, Row, Skeleton, Space, Statistic, Tabs, Tag, Typography, message } from 'antd';
import {
  DeleteOutlined,
  HistoryOutlined,
  LockOutlined,
  PlusOutlined,
  PushpinOutlined,
  ReloadOutlined,
  UnlockOutlined,
  EditOutlined
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
import { useThemeVariants } from '@/hooks/useVariants';

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

  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

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
  const moodDays = Array.from({ length: 14 }).map((_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - index));
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const dayEnd = dayStart + 86_399_999;
    const entries = list.filter(diary => diary.date >= dayStart && diary.date <= dayEnd && diary.mood);
    return { day: `${day.getMonth() + 1}/${day.getDate()}`, mood: entries[0]?.mood || '', count: entries.length };
  });
  const moodSummary = moodDays.filter(day => day.mood).slice(-7);

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

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const tintedBg = (color: string) => isDark ? `${color}1a` : `${color}12`;

  if (diaryLockHash && locked) {
    return (
      <Card
        bordered={false}
        className="anim-pop-in"
        style={{
          maxWidth: 560,
          margin: '64px auto',
          borderRadius: 28,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(124,58,237,0.92) 48%, rgba(236,72,153,0.88) 100%)',
          boxShadow: isDark
            ? `0 30px 70px rgba(0,0,0,0.4), 0 0 40px ${accent}20`
            : '0 30px 70px rgba(15,23,42,0.2)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 28, textAlign: 'center' }}
      >
        <LockOutlined style={{ fontSize: 52, color: '#fff', filter: `drop-shadow(0 0 20px ${accent}88)` }} />
        <Typography.Title level={2} style={{ margin: '16px 0 8px', color: '#fff' }}>
          日记已加锁
        </Typography.Title>
        <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.82)' }}>
          你的日记内容仍保留在本地，只是在进入前需要先通过密码验证。
        </Typography.Paragraph>
        <Button type="primary" icon={<UnlockOutlined />} onClick={() => setPwdOpen('verify')} style={{ borderRadius: 10, boxShadow: `0 8px 20px -4px ${accent}44` }}>
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
        className="anim-fade-in-up"
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(124,58,237,0.9) 46%, rgba(236,72,153,0.88) 100%)',
          boxShadow: isDark
            ? `0 30px 70px rgba(0,0,0,0.4), 0 0 40px ${accent}20`
            : '0 30px 70px rgba(15,23,42,0.18)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(233,213,255,0.88)' }}>日记工作台</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
              把每天的情绪、事件和想法，沉淀成可回看的本地记录
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(243,232,255,0.84)' }}>
              支持草稿恢复、单篇加密、整体锁和那年今日。你可以把这里当成一套真正可长期积累的离线日记系统。
            </Typography.Paragraph>
            <Space wrap size={10}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openNew} style={{ borderRadius: 10, boxShadow: `0 8px 20px -4px ${accent}44` }}>写日记</Button>
              {hasDraft ? <Button icon={<ReloadOutlined />} onClick={restoreDraft} style={{ borderRadius: 10 }}>恢复草稿</Button> : null}
              {!diaryLockHash ? (
                <Button icon={<LockOutlined />} onClick={() => setPwdOpen('setup')} style={{ borderRadius: 10 }}>设置整体锁</Button>
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
                  style={{ borderRadius: 10 }}
                >
                  关闭整体锁
                </Button>
              )}
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="总篇数" value={list.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="置顶" value={pinnedCount} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="那年今日" value={memories.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Text style={{ color: subColor }}>情绪趋势</Typography.Text>
        <Typography.Title level={4} style={{ margin: '4px 0 14px', color: titleColor }}>近 14 天情绪记录</Typography.Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, minmax(0, 1fr))', gap: 8 }}>
          {moodDays.map(day => (
            <div key={day.day} style={{ minHeight: 64, borderRadius: 14, padding: '8px 4px', textAlign: 'center', background: day.mood ? tintedBg('#a78bfa') : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)'), border: day.mood ? '1px solid rgba(167,139,250,0.35)' : '1px solid transparent' }}>
              <div style={{ color: subColor, fontSize: 11 }}>{day.day}</div>
              <div style={{ fontSize: 20, marginTop: 6 }}>{day.mood || '·'}</div>
            </div>
          ))}
        </div>
        <Typography.Paragraph style={{ margin: '12px 0 0', color: subColor }}>
          最近 7 条情绪：{moodSummary.length ? moodSummary.map(day => day.mood).join(' ') : '暂无记录'}。持续记录能帮助你看见情绪和行动之间的关系。
        </Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card bordered={false} className="anim-fade-in-up stagger-2 hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}>
            <Typography.Text style={{ color: subColor }}>写作状态</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>最近编辑</Typography.Title>
            {latestDiary ? (
              <div>
                <div style={{ fontWeight: 700, color: titleColor }}>{latestDiary.title || '未命名日记'}</div>
                <div style={{ marginTop: 8, color: subColor }}>{fmtDateTime(latestDiary.updatedAt)}</div>
                <div style={{ color: subColor, marginTop: 4, opacity: 0.7 }}>{fmtFromNow(latestDiary.updatedAt)}</div>
              </div>
            ) : (
              <div style={{ color: subColor }}>还没有日记内容</div>
            )}
            {hasDraft ? (
              <Card size="small" style={{ marginTop: 16, borderRadius: 16, background: isDark ? `${accent}0a` : 'rgba(124,58,237,0.08)', border: isDark ? `1px solid ${accent}22` : '1px solid transparent' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                  <span style={{ color: titleColor }}>检测到未保存草稿</span>
                  <Space>
                    <Button size="small" onClick={restoreDraft}>恢复</Button>
                    <Button size="small" danger onClick={clearDraft}>清除</Button>
                  </Space>
                </Space>
              </Card>
            ) : null}
          </Card>

          <Card bordered={false} className="anim-fade-in-up stagger-3 hover-lift" style={{ marginTop: 16, borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}>
            <Typography.Text style={{ color: subColor }}>那年今日</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>同一天的旧记录</Typography.Title>
            {memories.length ? (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {memories.slice(0, 4).map((diary, i) => (
                  <div
                    key={diary.id}
                    className="hover-lift"
                    style={{
                      padding: 14,
                      borderRadius: 18,
                      background: tintedBg('#a855f7'),
                      border: isDark ? `1px solid ${accent}18` : '1px solid transparent',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onClick={() => openEdit(diary)}
                  >
                    <div style={{ fontWeight: 700, color: titleColor }}>{diary.title || '无题'}</div>
                    <div style={{ marginTop: 6, color: subColor, fontSize: 13 }}>{previewOf(diary.content, 56)}</div>
                    <Tag color="purple" style={{ marginTop: 10, borderRadius: 6 }}>{fmtDate(diary.date)}</Tag>
                  </div>
                ))}
              </Space>
            ) : (
              <div style={{ color: subColor }}>那年今日暂无记录</div>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={15}>
          <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}>
            <Tabs
              activeKey={tab}
              onChange={setTab}
              items={[
                {
                  key: 'list',
                  label: '日记列表',
                  children: list.length === 0 ? (
                    <Empty text="暂无日记" subtext="今天就写第一篇吧" />
                  ) : (
                    <Space direction="vertical" size={14} style={{ width: '100%' }}>
                      {[...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)).map((diary: any, index: number) => (
                        <Card
                          key={diary.id}
                          bordered={false}
                          className="hover-lift anim-fade-in-up"
                          style={{
                            borderRadius: 22,
                            background: diary.pinned ? tintedBg('#f59e0b') : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.94)',
                            border: isDark ? `1px solid ${accent}15` : '1px solid rgba(148,163,184,0.12)',
                            cursor: 'pointer',
                            animationDelay: `${index * 0.04}s`,
                            transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                          }}
                          onClick={() => openEdit(diary)}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                                <Typography.Title level={5} style={{ margin: 0, color: titleColor }}>{diary.title || '无题'}</Typography.Title>
                                <Tag style={{ borderRadius: 6 }}>{fmtDate(diary.date)}</Tag>
                                {diary.pinned ? <Tag color="gold" style={{ borderRadius: 6 }}>置顶</Tag> : null}
                                {diary.encrypted ? <Tag color="red" style={{ borderRadius: 6 }}>已加密</Tag> : null}
                                {diary.mood ? <Tag color="magenta" style={{ borderRadius: 6 }}>{diary.mood}</Tag> : null}
                              </div>
                              <div style={{ marginTop: 8, color: isDark ? 'rgba(226,232,240,0.7)' : '#475569' }}>
                                {diary.encrypted
                                  ? '此内容已加密，点击后输入密码查看。'
                                  : previewOf(diary.content, 180)}
                              </div>
                              <Space wrap size={[8, 8]} style={{ marginTop: 10 }}>
                                <Tag style={{ borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>{fmtDateTime(diary.updatedAt)}</Tag>
                                <Tag color="blue" style={{ borderRadius: 6, background: isDark ? 'rgba(59,130,246,0.15)' : undefined }}>{fmtFromNow(diary.updatedAt)}</Tag>
                              </Space>
                            </div>
                            <Space onClick={e => e.stopPropagation()}>
                              <LockOutlined className="hover-scale" style={{ color: diary.encrypted ? '#f59e0b' : subColor, fontSize: 16, cursor: 'pointer', transition: 'all 0.25s ease' }} onClick={() => toggleLockOne(diary)} />
                              <PushpinOutlined className="hover-scale" style={{ color: diary.pinned ? '#f59e0b' : subColor, fontSize: 16, cursor: 'pointer', transition: 'all 0.25s ease' }} onClick={() => togglePin(diary)} />
                              <DeleteOutlined className="hover-scale" style={{ color: subColor, fontSize: 16, cursor: 'pointer', transition: 'all 0.25s ease' }} onClick={() => del(diary.id)} />
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
                    <Empty text="那年今日暂无记录" subtext="坚持写日记，明年今日就能看到回忆" />
                  ) : (
                    <Row gutter={[14, 14]}>
                      {memories.map((diary, i) => (
                        <Col key={diary.id} xs={24} md={12}>
                          <Card
                            bordered={false}
                            className="hover-lift anim-fade-in-up"
                            style={{
                              borderRadius: 20,
                              background: tintedBg('#a855f7'),
                              border: isDark ? `1px solid ${accent}18` : '1px solid transparent',
                              animationDelay: `${i * 0.06}s`,
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onClick={() => openEdit(diary)}
                          >
                            <Tag color="purple" style={{ borderRadius: 6 }}>{fmtDate(diary.date)}</Tag>
                            <Typography.Title level={5} style={{ margin: '10px 0 6px', color: titleColor }}>{diary.title || '无题'}</Typography.Title>
                            <Typography.Text style={{ color: isDark ? 'rgba(226,232,240,0.7)' : '#475569' }}>
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
          <Card size="small" style={{ marginBottom: 12, borderRadius: 16, background: isDark ? `${accent}0a` : 'rgba(15,23,42,0.03)', border: isDark ? `1px solid ${accent}22` : '1px solid transparent' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <span style={{ color: titleColor }}>检测到本地未保存草稿，可继续编辑或清除。</span>
              <Space>
                <Button size="small" onClick={restoreDraft}>恢复草稿</Button>
                <Button size="small" danger onClick={clearDraft}>清除草稿</Button>
              </Space>
            </Space>
          </Card>
        ) : null}
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="标题，可选" style={{ marginBottom: 8, borderRadius: 10 }} />
        <Input value={mood} onChange={e => setMood(e.target.value)} placeholder="今日心情，如 开心 / 平静 / 沉思" style={{ marginBottom: 8, borderRadius: 10 }} />
        <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
          <RichEditor value={content} onChange={setContent} placeholder="今天发生了哪些难忘的事？" minRows={10} />
        </Suspense>
      </Modal>

      <PasswordLock mode="set" open={pwdOpen === 'setup'} onSuccess={setupGlobalLock} onClose={() => setPwdOpen(null)} title="设置日记整体锁" />
    </Space>
  );
}
