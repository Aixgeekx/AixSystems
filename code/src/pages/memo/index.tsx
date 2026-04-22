// 备忘录 - TipTap 富文本 + 文件夹 + 置顶 + 回收站
import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Input, List, Modal, Row, Skeleton, Space, Statistic, Tag, Typography, message } from 'antd';
import { DeleteOutlined, PlusOutlined, PushpinOutlined, ReloadOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { fmtDateTime, fmtFromNow } from '@/utils/time';
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
  const pinned = useMemo(() => list.filter(item => item.pinned), [list]);
  const latest = list[0];

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
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(20,184,166,0.92) 44%, rgba(14,165,233,0.9) 100%)',
          boxShadow: '0 28px 60px rgba(20,184,166,0.16)'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: 'rgba(204,251,241,0.9)' }}>备忘录工作台</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff' }}>
              让灵感、草稿和长期信息有一个更稳定的落点
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(226,232,240,0.84)' }}>
              支持本地草稿恢复、置顶内容快速查看和富文本编辑。你可以把这里当成离线知识便签区。
            </Typography.Paragraph>
            <Space wrap size={10}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>添加备忘</Button>
              {hasDraft ? <Button icon={<ReloadOutlined />} onClick={restoreDraft}>恢复草稿</Button> : null}
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)' }}>
                  <Statistic title="总数" value={list.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)' }}>
                  <Statistic title="置顶" value={pinned.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)' }}>
                  <Statistic title="草稿" value={hasDraft ? 1 : 0} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
            <Typography.Text type="secondary">重点内容</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 14px' }}>置顶备忘</Typography.Title>
            {pinned.length ? (
              <List
                split={false}
                dataSource={pinned.slice(0, 5)}
                renderItem={(memo: any) => (
                  <List.Item style={{ paddingInline: 0 }}>
                    <button
                      type="button"
                      onClick={() => openEdit(memo)}
                      style={{
                        width: '100%',
                        border: 'none',
                        textAlign: 'left',
                        padding: '14px 16px',
                        borderRadius: 18,
                        cursor: 'pointer',
                        background: 'rgba(20,184,166,0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{memo.title || '无标题备忘'}</div>
                        <Tag color="gold" style={{ marginInlineEnd: 0 }}>置顶</Tag>
                      </div>
                      <div style={{ marginTop: 6, color: '#64748b' }}>{previewOf(memo.content, 54)}</div>
                    </button>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ color: '#94a3b8' }}>暂无置顶备忘</div>
            )}
          </Card>

          <Card bordered={false} style={{ marginTop: 16, borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
            <Typography.Text type="secondary">最近活动</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px' }}>最后编辑记录</Typography.Title>
            {latest ? (
              <div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{latest.title || '无标题备忘'}</div>
                <div style={{ marginTop: 8, color: '#64748b' }}>{fmtDateTime(latest.updatedAt)}</div>
                <div style={{ color: '#94a3b8', marginTop: 4 }}>{fmtFromNow(latest.updatedAt)}</div>
              </div>
            ) : (
              <div style={{ color: '#94a3b8' }}>还没有内容</div>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={15}>
          {list.length === 0 ? (
            <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
              <Empty text="暂无备忘，先写下一条重要提醒。" />
            </Card>
          ) : (
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {list.map((memo: any) => (
                <Card
                  key={memo.id}
                  bordered={false}
                  style={{ borderRadius: 22, background: memo.pinned ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.94)', cursor: 'pointer' }}
                  onClick={() => openEdit(memo)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <Typography.Title level={5} style={{ margin: 0 }}>{memo.title || '无标题备忘'}</Typography.Title>
                        {memo.pinned ? <Tag color="gold">置顶</Tag> : null}
                      </div>
                      <div style={{ marginTop: 8, color: '#475569' }}>{previewOf(memo.content, 160)}</div>
                      <Space wrap size={[8, 8]} style={{ marginTop: 10 }}>
                        <Tag>{fmtDateTime(memo.updatedAt)}</Tag>
                        <Tag color="blue">{fmtFromNow(memo.updatedAt)}</Tag>
                      </Space>
                    </div>
                    <Space>
                      <PushpinOutlined style={{ color: memo.pinned ? '#f59e0b' : '#94a3b8' }} onClick={e => { e.stopPropagation(); pin(memo); }} />
                      <DeleteOutlined onClick={e => { e.stopPropagation(); del(memo.id); }} />
                    </Space>
                  </div>
                </Card>
              ))}
            </Space>
          )}
        </Col>
      </Row>

      <Modal title={editing ? '编辑备忘' : '添加备忘'} open={open} onCancel={() => setOpen(false)} onOk={save} width={720} destroyOnClose>
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
    </Space>
  );
}
