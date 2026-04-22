// 全局搜索 - 跨 items/diaries/memos 的搜索工作台 (v0.21.3 主题适配)
import React, { useDeferredValue, useEffect, useState } from 'react';
import { Button, Card, Col, Empty as AntEmpty, Input, List, Row, Space, Statistic, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  HistoryOutlined,
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
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';

const SEARCH_HISTORY_KEY = 'aix-search-history';

function readHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function SearchPage() {
  const [kw, setKw] = useState('');
  const [history, setHistory] = useState<string[]>(() => readHistory());
  const deferredKw = useDeferredValue(kw.trim());
  const openItemForm = useAppStore(s => s.openItemForm);
  const nav = useNavigate();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const tintedBg = (color: string) => isDark ? `${color}1a` : `${color}12`;

  useEffect(() => {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history.slice(0, 8)));
  }, [history]);

  function commitHistory(term: string) {
    const next = term.trim();
    if (!next) return;
    setHistory(prev => [next, ...prev.filter(item => item !== next)].slice(0, 8));
  }

  function clearHistory() {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setHistory([]);
  }

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
        className="anim-fade-in-up"
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(30,64,175,0.9) 50%, rgba(14,165,233,0.9) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(15, 23, 42, 0.18)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(191,219,254,0.92)' }}>
              全局检索工作台
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
              一次搜索事项、日记和备忘录
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 18, color: 'rgba(226,232,240,0.84)' }}>
              支持跨内容快速定位。输入关键词后，最常用的信息会在一屏内分组呈现。
            </Typography.Paragraph>
            <Input
              size="large"
              prefix={<SearchOutlined style={{ color: subColor }} />}
              placeholder="搜索事项标题、描述、日记内容或备忘录"
              value={kw}
              onChange={e => setKw(e.target.value)}
              onPressEnter={() => commitHistory(kw)}
              style={{
                borderRadius: 18,
                background: isDark ? 'rgba(10,14,28,0.6)' : 'rgba(255,255,255,0.92)',
                borderColor: isDark ? `${accent}44` : undefined,
                color: titleColor
              }}
            />
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 22, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="命中总数" value={totalHits} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 22, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="当前关键字" value={deferredKw || '未输入'} valueStyle={{ color: '#fff', fontSize: 20 }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {!deferredKw ? (
        <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Text style={{ color: subColor }}>快捷入口</Typography.Text>
          <Typography.Title level={4} style={{ margin: '4px 0 14px', color: titleColor }}>
            没有关键词时，可以直接跳转到常用页面
          </Typography.Title>
          <Space wrap size={12}>
            <Button icon={<CalendarOutlined />} onClick={() => nav(ROUTES.MATTER_ALL)}>查看全部事项</Button>
            <Button icon={<ReadOutlined />} onClick={() => nav(ROUTES.DIARY_CAL)}>打开日记</Button>
            <Button icon={<FileTextOutlined />} onClick={() => nav(ROUTES.MEMO)}>打开备忘录</Button>
            <Button icon={<ThunderboltOutlined />} onClick={() => nav(ROUTES.FOCUS)}>开始专注</Button>
          </Space>
          {history.length ? (
            <div style={{ marginTop: 16 }}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
                <Typography.Text style={{ color: subColor }}><HistoryOutlined /> 最近搜索</Typography.Text>
                <Button size="small" type="link" onClick={clearHistory}>清空历史</Button>
              </Space>
              <Space wrap size={[8, 8]} style={{ marginTop: 10 }}>
                {history.map(item => (
                  <Tag key={item} style={{ cursor: 'pointer', borderRadius: 6 }} onClick={() => setKw(item)}>
                    {item}
                  </Tag>
                ))}
              </Space>
            </div>
          ) : null}
        </Card>
      ) : null}

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={8}>
          <Card
            title={<Space><CalendarOutlined /><span>事项 {result?.items.length || 0}</span></Space>}
            bordered={false}
            className="anim-fade-in-up stagger-2"
            style={{ borderRadius: 24, height: '100%', background: cardBg, border: cardBorder }}
          >
            {(result?.items.length || 0) === 0 ? (
              <Empty text="没有匹配的事项" />
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
                      <div style={{ width: '100%', padding: 14, borderRadius: 18, background: tintedBg('#3b82f6') }}>
                        <Space wrap size={[8, 8]}>
                          <Tag color={meta.color} style={{ borderRadius: 6 }}>{meta.label}</Tag>
                          <Tag style={{ borderRadius: 6 }}>{fmtDate(item.startTime)}</Tag>
                        </Space>
                        <Typography.Title level={5} style={{ margin: '10px 0 4px', color: titleColor }}>{item.title}</Typography.Title>
                        <Typography.Text style={{ color: subColor }}>
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
            className="anim-fade-in-up stagger-3"
            style={{ borderRadius: 24, height: '100%', background: cardBg, border: cardBorder }}
          >
            {(result?.diaries.length || 0) === 0 ? (
              <Empty text="没有匹配的日记" />
            ) : (
              <List
                split={false}
                dataSource={result?.diaries || []}
                renderItem={(diary: any) => (
                  <List.Item
                    style={{ paddingInline: 0 }}
                    actions={[<Button key="open" type="link" onClick={() => nav(ROUTES.DIARY_CAL)}>前往</Button>]}
                  >
                    <div style={{ width: '100%', padding: 14, borderRadius: 18, background: tintedBg('#16a34a') }}>
                      <Space wrap size={[8, 8]}>
                        <Tag color="green" style={{ borderRadius: 6 }}>日记</Tag>
                        <Tag style={{ borderRadius: 6 }}>{fmtDate(diary.date)}</Tag>
                      </Space>
                      <Typography.Title level={5} style={{ margin: '10px 0 4px', color: titleColor }}>
                        {diary.title || '未命名日记'}
                      </Typography.Title>
                      <Typography.Text style={{ color: subColor }}>
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
            className="anim-fade-in-up stagger-4"
            style={{ borderRadius: 24, height: '100%', background: cardBg, border: cardBorder }}
          >
            {(result?.memos.length || 0) === 0 ? (
              <Empty text="没有匹配的备忘录" />
            ) : (
              <List
                split={false}
                dataSource={result?.memos || []}
                renderItem={(memo: any) => (
                  <List.Item
                    style={{ paddingInline: 0 }}
                    actions={[<Button key="open" type="link" onClick={() => nav(ROUTES.MEMO)}>前往</Button>]}
                  >
                    <div style={{ width: '100%', padding: 14, borderRadius: 18, background: tintedBg('#f59e0b') }}>
                      <Space wrap size={[8, 8]}>
                        <Tag color="gold" style={{ borderRadius: 6 }}>备忘录</Tag>
                        <Tag style={{ borderRadius: 6 }}>{fmtDate(memo.updatedAt)}</Tag>
                      </Space>
                      <Typography.Title level={5} style={{ margin: '10px 0 4px', color: titleColor }}>
                        {memo.title || '未命名备忘'}
                      </Typography.Title>
                      <Typography.Text style={{ color: subColor }}>
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
        <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
            <div>
              <Typography.Text style={{ color: subColor }}>检索建议</Typography.Text>
              <Typography.Title level={5} style={{ margin: '4px 0 0', color: titleColor }}>
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
