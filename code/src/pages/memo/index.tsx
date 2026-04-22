// 备忘录 - TipTap 富文本 + 文件夹 + 置顶 + 回收站 (v0.20.0 主题适配 + 动画)
import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Input, List, Modal, Row, Skeleton, Space, Statistic, Tag, Typography, message } from 'antd';
import { DeleteOutlined, PlusOutlined, PushpinOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { fmtDateTime, fmtFromNow } from '@/utils/time';
import { previewOf } from '@/utils/html';
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';

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
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

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

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const tintedBg = (color: string) => isDark ? `${color}1a` : `${color}12`;

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
            : 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(20,184,166,0.92) 44%, rgba(14,165,233,0.9) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(20,184,166,0.16)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(204,251,241,0.9)' }}>
              备忘录工作台
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
              让灵感、草稿和长期信息有一个更稳定的落点
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(226,232,240,0.84)' }}>
              支持本地草稿恢复、置顶内容快速查看和富文本编辑。你可以把这里当成离线知识便签区。
            </Typography.Paragraph>
            <Space wrap size={10}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openNew} style={{ borderRadius: 10, boxShadow: `0 8px 20px -4px ${accent}44` }}>添加备忘</Button>
              {hasDraft ? <Button icon={<ReloadOutlined />} onClick={restoreDraft} style={{ borderRadius: 10 }}>恢复草稿</Button> : null}
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="总数" value={list.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="置顶" value={pinned.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="草稿" value={hasDraft ? 1 : 0} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card bordered={false} className="anim-fade-in-up stagger-2 hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}>
            <Typography.Text style={{ color: subColor }}>重点内容</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 14px', color: titleColor }}>置顶备忘</Typography.Title>
            {pinned.length ? (
              <List
                split={false}
                dataSource={pinned.slice(0, 5)}
                renderItem={(memo: any) => (
                  <List.Item style={{ paddingInline: 0 }}>
                    <button
                      type="button"
                      className="hover-lift"
                      onClick={() => openEdit(memo)}
                      style={{
                        width: '100%',
                        border: 'none',
                        textAlign: 'left',
                        padding: '14px 16px',
                        borderRadius: 18,
                        cursor: 'pointer',
                        background: tintedBg('#f59e0b'),
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ fontWeight: 700, color: titleColor }}>{memo.title || '无标题备忘'}</div>
                        <Tag color="gold" style={{ marginInlineEnd: 0, borderRadius: 6 }}>置顶</Tag>
                      </div>
                      <div style={{ marginTop: 6, color: subColor, fontSize: 13 }}>{previewOf(memo.content, 54)}</div>
                    </button>
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ color: subColor }}>暂无置顶备忘</div>
            )}
          </Card>

          <Card bordered={false} className="anim-fade-in-up stagger-3 hover-lift" style={{ marginTop: 16, borderRadius: 24, background: cardBg, border: cardBorder, boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)' }}>
            <Typography.Text style={{ color: subColor }}>最近活动</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>最后编辑记录</Typography.Title>
            {latest ? (
              <div>
                <div style={{ fontWeight: 700, color: titleColor }}>{latest.title || '无标题备忘'}</div>
                <div style={{ marginTop: 8, color: subColor }}>{fmtDateTime(latest.updatedAt)}</div>
                <div style={{ color: subColor, marginTop: 4, opacity: 0.7 }}>{fmtFromNow(latest.updatedAt)}</div>
              </div>
            ) : (
              <div style={{ color: subColor }}>还没有内容</div>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={15}>
          {list.length === 0 ? (
            <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
              <Empty text="暂无备忘" subtext="先写下一条重要提醒吧" />
            </Card>
          ) : (
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              {list.map((memo: any, index: number) => (
                <Card
                  key={memo.id}
                  bordered={false}
                  className="anim-fade-in-up hover-lift"
                  style={{
                    borderRadius: 22,
                    background: memo.pinned ? tintedBg('#f59e0b') : cardBg,
                    border: cardBorder,
                    cursor: 'pointer',
                    animationDelay: `${index * 0.04}s`,
                    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                  onClick={() => openEdit(memo)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        <Typography.Title level={5} style={{ margin: 0, color: titleColor }}>{memo.title || '无标题备忘'}</Typography.Title>
                        {memo.pinned ? <Tag color="gold" style={{ borderRadius: 6 }}>置顶</Tag> : null}
                      </div>
                      <div style={{ marginTop: 8, color: isDark ? 'rgba(226,232,240,0.7)' : '#475569' }}>{previewOf(memo.content, 160)}</div>
                      <Space wrap size={[8, 8]} style={{ marginTop: 10 }}>
                        <Tag style={{ borderRadius: 6, background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>{fmtDateTime(memo.updatedAt)}</Tag>
                        <Tag color="blue" style={{ borderRadius: 6, background: isDark ? 'rgba(59,130,246,0.15)' : undefined }}>{fmtFromNow(memo.updatedAt)}</Tag>
                      </Space>
                    </div>
                    <Space>
                      <PushpinOutlined
                        className="hover-scale"
                        style={{ color: memo.pinned ? '#f59e0b' : subColor, fontSize: 16, cursor: 'pointer', transition: 'all 0.25s ease' }}
                        onClick={e => { e.stopPropagation(); pin(memo); }}
                      />
                      <DeleteOutlined
                        className="hover-scale"
                        style={{ color: subColor, fontSize: 16, cursor: 'pointer', transition: 'all 0.25s ease' }}
                        onClick={e => { e.stopPropagation(); del(memo.id); }}
                      />
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
          <Card size="small" style={{ marginBottom: 12, borderRadius: 16, background: isDark ? `${accent}0a` : 'rgba(15,23,42,0.03)', border: isDark ? `1px solid ${accent}22` : '1px solid transparent' }}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
              <span style={{ color: titleColor }}>检测到本地未保存草稿，可继续编辑或忽略。</span>
              <Space>
                <Button size="small" onClick={restoreDraft}>恢复草稿</Button>
                <Button size="small" danger onClick={clearDraft}>清除草稿</Button>
              </Space>
            </Space>
          </Card>
        ) : null}
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="标题" style={{ marginBottom: 8, borderRadius: 10 }} />
        <Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
          <RichEditor value={content} onChange={setContent} placeholder="把事情记录下来..." minRows={10} />
        </Suspense>
      </Modal>
    </Space>
  );
}
