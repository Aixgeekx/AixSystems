// 回收站 - 工作台风格 (v0.24.0 完善升级)
import React, { useState } from 'react';
import { Button, Card, Col, List, Popconfirm, Row, Space, Statistic, Tabs, Tag, Typography, Divider, message } from 'antd';
import { DeleteOutlined, UndoOutlined, InboxOutlined, CalendarOutlined, ReadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { fmtDate, fmtDateTime } from '@/utils/time';
import Empty from '@/components/Empty';
import { ITEM_TYPE_MAP } from '@/config/itemTypes';
import { useThemeVariants } from '@/hooks/useVariants';

export default function TrashPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const [tab, setTab] = useState('items');
  const items = useLiveQuery(() => db.items.filter(x => !!x.deletedAt).toArray(), []) || [];
  const diaries = useLiveQuery(() => db.diaries.filter(x => !!x.deletedAt).toArray(), []) || [];
  const memos = useLiveQuery(() => db.memos.filter(x => !!x.deletedAt).toArray(), []) || [];
  const total = items.length + diaries.length + memos.length;

  async function restore(table: any, id: string) { await table.update(id, { deletedAt: undefined }); message.success('已恢复'); }
  async function purge(table: any, id: string) { await table.delete(id); message.success('已彻底删除'); }
  async function purgeAll(table: any, rows: any[]) { await table.bulkDelete(rows.map((r: any) => r.id)); message.success('已清空'); }

  const renderRow = (r: any, table: any, content: React.ReactNode) => (
    <List.Item style={{ paddingInline: 0 }}>
      <div style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        padding: '12px 16px', borderRadius: 14,
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,252,0.9)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}`
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>{content}</div>
        <Space size={6}>
          <Button size="small" icon={<UndoOutlined />} onClick={() => restore(table, r.id)} style={{ borderRadius: 8 }}>恢复</Button>
          <Popconfirm title="彻底删除? 不可撤销" onConfirm={() => purge(table, r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} style={{ borderRadius: 8 }}>删除</Button>
          </Popconfirm>
        </Space>
      </div>
    </List.Item>
  );

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(100,116,139,0.94), rgba(71,85,105,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(100,116,139,0.14)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
          <DeleteOutlined /> 数据回收
        </Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
          回收站 · 恢复或彻底清除
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 0, color: 'rgba(226,232,240,0.84)' }}>
          删除的事项、日记和备忘录会暂存在这里，你可以恢复或彻底清除。
        </Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '回收总数', value: total, color: '#64748b', icon: <InboxOutlined /> },
          { label: '事项', value: items.length, color: '#38bdf8', icon: <CalendarOutlined /> },
          { label: '日记', value: diaries.length, color: '#22c55e', icon: <ReadOutlined /> },
          { label: '备忘录', value: memos.length, color: '#f59e0b', icon: <FileTextOutlined /> }
        ].map((s, i) => (
          <Col xs={12} md={6} key={s.label}>
            <Card bordered={false} className="anim-fade-in-up hover-lift"
              style={{ borderRadius: 22, background: cardBg, border: cardBorder, animationDelay: `${0.06 + i * 0.04}s` }}>
              <Statistic title={<span style={{ display: 'flex', alignItems: 'center', gap: 6, color: subColor }}>{s.icon} {s.label}</span>}
                value={s.value} valueStyle={{ fontSize: 28, fontWeight: 700, color: s.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="anim-fade-in-up stagger-3" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Tabs activeKey={tab} onChange={setTab} items={[
          { key: 'items', label: <Space><CalendarOutlined />事项 ({items.length})</Space>, children: (
            <>
              {items.length > 0 && (
                <Popconfirm title={`清空全部 ${items.length} 条事项?`} onConfirm={() => purgeAll(db.items, items)}>
                  <Button danger size="small" style={{ marginBottom: 12, borderRadius: 8 }}>清空全部</Button>
                </Popconfirm>
              )}
              {items.length === 0 ? <Empty text="空空如也" subtext="回收站没有已删除的事项" /> :
                <List split={false} dataSource={items} renderItem={(r: any) => renderRow(r, db.items,
                  <Space wrap size={[8, 4]}>
                    <Tag color={ITEM_TYPE_MAP[r.type as keyof typeof ITEM_TYPE_MAP]?.color} style={{ borderRadius: 6 }}>
                      {ITEM_TYPE_MAP[r.type as keyof typeof ITEM_TYPE_MAP]?.label}
                    </Tag>
                    <Typography.Text strong style={{ color: titleColor }}>{r.title}</Typography.Text>
                    <Typography.Text style={{ color: subColor, fontSize: 12 }}>{fmtDate(r.startTime)}</Typography.Text>
                  </Space>
                )} />
              }
            </>
          )},
          { key: 'diaries', label: <Space><ReadOutlined />日记 ({diaries.length})</Space>, children: (
            <>
              {diaries.length > 0 && (
                <Popconfirm title={`清空全部 ${diaries.length} 篇日记?`} onConfirm={() => purgeAll(db.diaries, diaries)}>
                  <Button danger size="small" style={{ marginBottom: 12, borderRadius: 8 }}>清空全部</Button>
                </Popconfirm>
              )}
              {diaries.length === 0 ? <Empty text="空空如也" subtext="回收站没有已删除的日记" /> :
                <List split={false} dataSource={diaries} renderItem={(r: any) => renderRow(r, db.diaries,
                  <Space wrap size={[8, 4]}>
                    <Tag color="green" style={{ borderRadius: 6 }}>日记</Tag>
                    <Typography.Text strong style={{ color: titleColor }}>{r.title || '无题'}</Typography.Text>
                    <Typography.Text style={{ color: subColor, fontSize: 12 }}>{fmtDate(r.date)}</Typography.Text>
                  </Space>
                )} />
              }
            </>
          )},
          { key: 'memos', label: <Space><FileTextOutlined />备忘 ({memos.length})</Space>, children: (
            <>
              {memos.length > 0 && (
                <Popconfirm title={`清空全部 ${memos.length} 条备忘?`} onConfirm={() => purgeAll(db.memos, memos)}>
                  <Button danger size="small" style={{ marginBottom: 12, borderRadius: 8 }}>清空全部</Button>
                </Popconfirm>
              )}
              {memos.length === 0 ? <Empty text="空空如也" subtext="回收站没有已删除的备忘录" /> :
                <List split={false} dataSource={memos} renderItem={(r: any) => renderRow(r, db.memos,
                  <Space wrap size={[8, 4]}>
                    <Tag color="gold" style={{ borderRadius: 6 }}>备忘</Tag>
                    <Typography.Text strong style={{ color: titleColor }}>{r.title || '无标题'}</Typography.Text>
                    <Typography.Text style={{ color: subColor, fontSize: 12 }}>{fmtDateTime(r.updatedAt)}</Typography.Text>
                  </Space>
                )} />
              }
            </>
          )}
        ]} />
      </Card>
    </Space>
  );
}
