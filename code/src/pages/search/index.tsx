// 全局搜索 - 跨 items/diaries/memos 的搜索工作台
import React, { useDeferredValue, useState } from 'react';
import { Button, Card, Col, Empty, Input, List, Row, Space, Statistic, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  FileTextOutlined,
  ReadOutlined,
  RightOutlined,
  SearchOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { fmtDate } from '@/utils/time';
import { previewOf } from '@/utils/html';
import { ITEM_TYPE_MAP } from '@/config/itemTypes';
import { ROUTES } from '@/config/routes';
import { useAppStore } from '@/stores/appStore';

export default function SearchPage() {
  const [kw, setKw] = useState('');
  const deferredKw = useDeferredValue(kw.trim());
  const openItemForm = useAppStore(s => s.openItemForm);
  const nav = useNavigate();

  const result = useLiveQuery(async () => {
    if (!deferredKw) return { items: [], diaries: [], memos: [] };
    const query = deferredKw.toLowerCase();
    const contains = (text?: string) => !!text?.toLowerCase().includes(query);

    const items = (await db.items.toArray()).filter(item =>
      !item.deletedAt && (contains(item.title) || contains(item.description))
    );
    const diaries = (await db.diaries.toArray()).filter(diary =>
      !diary.deletedAt && (contains(diary.title) || contains(previewOf(diary.content, 120)))
    );
    const memos = (await db.memos.toArray()).filter(memo =>
      !memo.deletedAt && (contains(memo.title) || contains(previewOf(memo.content, 120)))
    );
    return { items, diaries, memos };
  }, [deferredKw]);

  const totalHits = (result?.items.length || 0) + (result?.diaries.length || 0) + (result?.memos.length || 0);

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,64,175,0.9) 50%, rgba(14,165,233,0.9) 100%)',
          boxShadow: '0 28px 60px rgba(15, 23, 42, 0.18)'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: 'rgba(191,219,254,0.92)' }}>全局检索工作台</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
              一次搜索事项、日记和备忘录
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 18, color: 'rgba(226,232,240,0.84)' }}>
              支持跨内容快速定位。输入关键词后，最常用的信息会在一屏内分组呈现。
            </Typography.Paragraph>
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: '#64748b' }} />}
              placeholder="搜索事项标题、描述、日记内容或备忘录"
              value={kw}
              onChange={e => setKw(e.target.value)}
              style={{
                borderRadius: 18,
                background: 'rgba(255,255,255,0.92)'
              }}
            />
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.14)' }}>
                  <Statistic title="命中总数" value={totalHits} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.14)' }}>
                  <Statistic title="当前关键字" value={deferredKw || '未输入'} valueStyle={{ color: '#fff', fontSize: 20 }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {!deferredKw ? (
        <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.9)' }}>
          <Typography.Text type="secondary">快捷入口</Typography.Text>
          <Typography.Title level={4} style={{ margin: '4px 0 14px' }}>
            没有关键词时，可以直接跳转到常用页面
          </Typography.Title>
          <Space wrap size={12}>
            <Button icon={<CalendarOutlined />} onClick={() => nav(ROUTES.MATTER_ALL)}>查看全部事项</Button>
            <Button icon={<ReadOutlined />} onClick={() => nav(ROUTES.DIARY_CAL)}>打开日记</Button>
            <Button icon={<FileTextOutlined />} onClick={() => nav(ROUTES.MEMO)}>打开备忘录</Button>
            <Button icon={<ThunderboltOutlined />} onClick={() => nav(ROUTES.FOCUS)}>开始专注</Button>
          </Space>
        </Card>
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card
            title={<Space><CalendarOutlined /><span>事项 {result?.items.length || 0}</span></Space>}
            bordered={false}
            style={{ borderRadius: 24, height: '100%', background: 'rgba(255,255,255,0.92)' }}
          >
            {(result?.items.length || 0) === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的事项" />
            ) : (
              <List
                split={false}
                dataSource={result?.items || []}
                renderItem={(item: any) => {
                  const meta = ITEM_TYPE_MAP[item.type as keyof typeof ITEM_TYPE_MAP];
                  return (
                    <List.Item
                      style={{ paddingInline: 0 }}
                      actions={[<Button key="open" type="link" onClick={() => openItemForm(item.id)}>打开</Button>]}
                    >
                      <div style={{ width: '100%', padding: 14, borderRadius: 18, background: 'rgba(59,130,246,0.06)' }}>
                        <Space wrap size={[8, 8]}>
                          <Tag color={meta.color}>{meta.label}</Tag>
                          <Tag>{fmtDate(item.startTime)}</Tag>
                        </Space>
                        <Typography.Title level={5} style={{ margin: '10px 0 4px' }}>{item.title}</Typography.Title>
                        <Typography.Text type="secondary">
                          {previewOf(item.description || item.title, 56)}
                        </Typography.Text>
                      </div>
                    </List.Item>
                  );
                }}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card
            title={<Space><ReadOutlined /><span>日记 {result?.diaries.length || 0}</span></Space>}
            bordered={false}
            style={{ borderRadius: 24, height: '100%', background: 'rgba(255,255,255,0.92)' }}
          >
            {(result?.diaries.length || 0) === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的日记" />
            ) : (
              <List
                split={false}
                dataSource={result?.diaries || []}
                renderItem={(diary: any) => (
                  <List.Item
                    style={{ paddingInline: 0 }}
                    actions={[<Button key="open" type="link" onClick={() => nav(ROUTES.DIARY_CAL)}>前往</Button>]}
                  >
                    <div style={{ width: '100%', padding: 14, borderRadius: 18, background: 'rgba(16,185,129,0.07)' }}>
                      <Space wrap size={[8, 8]}>
                        <Tag color="green">日记</Tag>
                        <Tag>{fmtDate(diary.date)}</Tag>
                      </Space>
                      <Typography.Title level={5} style={{ margin: '10px 0 4px' }}>
                        {diary.title || '未命名日记'}
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        {previewOf(diary.content, 72)}
                      </Typography.Text>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card
            title={<Space><FileTextOutlined /><span>备忘录 {result?.memos.length || 0}</span></Space>}
            bordered={false}
            style={{ borderRadius: 24, height: '100%', background: 'rgba(255,255,255,0.92)' }}
          >
            {(result?.memos.length || 0) === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="没有匹配的备忘录" />
            ) : (
              <List
                split={false}
                dataSource={result?.memos || []}
                renderItem={(memo: any) => (
                  <List.Item
                    style={{ paddingInline: 0 }}
                    actions={[<Button key="open" type="link" onClick={() => nav(ROUTES.MEMO)}>前往</Button>]}
                  >
                    <div style={{ width: '100%', padding: 14, borderRadius: 18, background: 'rgba(245,158,11,0.08)' }}>
                      <Space wrap size={[8, 8]}>
                        <Tag color="gold">备忘录</Tag>
                        <Tag>{fmtDate(memo.updatedAt)}</Tag>
                      </Space>
                      <Typography.Title level={5} style={{ margin: '10px 0 4px' }}>
                        {memo.title || '未命名备忘'}
                      </Typography.Title>
                      <Typography.Text type="secondary">
                        {previewOf(memo.content, 72)}
                      </Typography.Text>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {deferredKw ? (
        <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.9)' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <div>
              <Typography.Text type="secondary">检索建议</Typography.Text>
              <Typography.Title level={5} style={{ margin: '4px 0 0' }}>
                没找到想要的内容时，换一个更具体的词，通常效果更好。
              </Typography.Title>
            </div>
            <Button type="link" icon={<RightOutlined />} onClick={() => nav(ROUTES.MATTER_ALL)}>
              直接浏览全部事项
            </Button>
          </Space>
        </Card>
      ) : null}
    </Space>
  );
}
