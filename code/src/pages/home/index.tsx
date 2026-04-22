// 首页工作台 - 全局概览 + 快捷入口 + 本地模式信息
import React from 'react';
import { Button, Card, Col, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FireOutlined,
  PlusOutlined,
  ReadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useAppStore } from '@/stores/appStore';
import { downloadBackup } from '@/utils/export';
import { fmtDateTime, fmtFromNow } from '@/utils/time';
import { previewOf } from '@/utils/html';

export default function HomePage() {
  const nav = useNavigate();
  const openItemForm = useAppStore(s => s.openItemForm);

  const dashboard = useLiveQuery(async () => {
    const [items, diaries, memos, sessions, lastBackup] = await Promise.all([
      db.items.toArray(),
      db.diaries.toArray(),
      db.memos.toArray(),
      db.focusSessions.orderBy('startTime').reverse().limit(6).toArray(),
      db.cacheKv.get('lastBackupMeta')
    ]);

    const activeItems = items.filter(item => !item.deletedAt);
    const todayStart = dayjs().startOf('day').valueOf();
    const todayEnd = dayjs().endOf('day').valueOf();
    const todayItems = activeItems.filter(item => item.startTime >= todayStart && item.startTime <= todayEnd);
    const done = todayItems.filter(item => item.completeStatus === 'done').length;
    const pending = todayItems.filter(item => item.completeStatus === 'pending').length;
    const pinnedNotes = memos.filter(memo => !memo.deletedAt && memo.pinned).slice(0, 4);
    const recentDiaries = diaries.filter(diary => !diary.deletedAt).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 4);
    const focusMinutes = sessions.reduce((sum, session) => sum + session.actualMs / 60_000, 0);

    return {
      activeItems,
      todayItems,
      done,
      pending,
      pinnedNotes,
      recentDiaries,
      sessions,
      focusMinutes,
      lastBackup
    };
  }, []);

  async function quickBackup() {
    await downloadBackup();
  }

  const total = dashboard?.todayItems.length || 0;
  const completion = total ? Math.round(((dashboard?.done || 0) / total) * 100) : 0;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 32,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.96), rgba(37,99,235,0.92) 46%, rgba(14,165,233,0.9) 100%)',
          boxShadow: '0 32px 70px rgba(15,23,42,0.18)'
        }}
        bodyStyle={{ padding: 28 }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: 'rgba(191,219,254,0.92)' }}>首页工作台</Typography.Text>
            <Typography.Title level={1} style={{ margin: '8px 0 12px', color: '#f8fafc', lineHeight: 1.15 }}>
              本地离线、实时保存、打开即用的时间管理主场
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 18, color: 'rgba(226,232,240,0.84)', fontSize: 15 }}>
              在一屏里查看今日节奏、最近记录、专注状态和本地备份，让首页真正承担“打开软件后的第一站”。
            </Typography.Paragraph>
            <Space wrap size={10}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openItemForm(undefined, 'schedule')}>
                新建日程
              </Button>
              <Button icon={<SearchOutlined />} onClick={() => nav(ROUTES.SEARCH)}>全局搜索</Button>
              <Button icon={<DownloadOutlined />} onClick={quickBackup}>快速备份</Button>
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <div style={{
              borderRadius: 24,
              padding: 18,
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.16)',
              backdropFilter: 'blur(14px)'
            }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <Typography.Text strong style={{ color: '#f8fafc' }}>今日完成率</Typography.Text>
                  <Tag color="cyan" style={{ marginInlineEnd: 0 }}>{completion}%</Tag>
                </div>
                <Progress percent={completion} strokeColor="#f8fafc" trailColor="rgba(255,255,255,0.16)" />
                <Space wrap size={8}>
                  <Tag color="blue">本地离线</Tag>
                  <Tag color="green">实时保存</Tag>
                  <Tag color="gold">便携运行</Tag>
                </Space>
                <Typography.Text style={{ color: 'rgba(226,232,240,0.8)' }}>
                  {dashboard?.lastBackup?.value?.exportedAt
                    ? `最近备份 ${fmtFromNow(dashboard.lastBackup.value.exportedAt)}`
                    : '建议尽快创建第一份本地备份'}
                </Typography.Text>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.94)' }}>
            <Statistic title="今日事项" value={dashboard?.todayItems.length || 0} prefix={<CalendarOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.94)' }}>
            <Statistic title="已完成" value={dashboard?.done || 0} valueStyle={{ color: '#16a34a' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.94)' }}>
            <Statistic title="待处理" value={dashboard?.pending || 0} valueStyle={{ color: '#2563eb' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.94)' }}>
            <Statistic title="专注时长" value={Math.round(dashboard?.focusMinutes || 0)} suffix="分" prefix={<FireOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
            <Typography.Text type="secondary">快捷入口</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 16px' }}>从首页直接去常用模块</Typography.Title>
            <Row gutter={[12, 12]}>
              {[
                { label: '我的一天', path: ROUTES.TODAY_DAY, icon: <CalendarOutlined />, color: 'rgba(59,130,246,0.1)' },
                { label: '备忘录', path: ROUTES.MEMO, icon: <ReadOutlined />, color: 'rgba(16,185,129,0.1)' },
                { label: '日记', path: ROUTES.DIARY_CAL, icon: <ReadOutlined />, color: 'rgba(124,58,237,0.1)' },
                { label: '番茄专注', path: ROUTES.FOCUS, icon: <FireOutlined />, color: 'rgba(249,115,22,0.12)' },
                { label: '导入导出', path: ROUTES.DATAIO, icon: <DownloadOutlined />, color: 'rgba(14,165,233,0.1)' },
                { label: '系统设置', path: ROUTES.SYSTEM, icon: <ClockCircleOutlined />, color: 'rgba(15,23,42,0.06)' }
              ].map(entry => (
                <Col xs={12} key={entry.path}>
                  <button
                    type="button"
                    onClick={() => nav(entry.path)}
                    style={{
                      width: '100%',
                      border: 'none',
                      textAlign: 'left',
                      padding: '16px 14px',
                      borderRadius: 20,
                      cursor: 'pointer',
                      background: entry.color
                    }}
                  >
                    <div style={{ fontSize: 22, marginBottom: 10 }}>{entry.icon}</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{entry.label}</div>
                  </button>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
            <Typography.Text type="secondary">本地内容速览</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 16px' }}>最近记录和固定内容</Typography.Title>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Card size="small" bordered={false} style={{ borderRadius: 18, background: 'rgba(59,130,246,0.06)' }}>
                  <Typography.Text strong>置顶备忘录</Typography.Text>
                  {dashboard?.pinnedNotes?.length ? (
                    <List
                      split={false}
                      dataSource={dashboard.pinnedNotes}
                      renderItem={(memo: any) => (
                        <List.Item style={{ paddingInline: 0 }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{memo.title || '无标题备忘'}</div>
                            <div style={{ color: '#64748b', marginTop: 4 }}>{previewOf(memo.content, 48)}</div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ marginTop: 12, color: '#94a3b8' }}>暂无置顶备忘录</div>
                  )}
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card size="small" bordered={false} style={{ borderRadius: 18, background: 'rgba(16,185,129,0.06)' }}>
                  <Typography.Text strong>最近日记</Typography.Text>
                  {dashboard?.recentDiaries?.length ? (
                    <List
                      split={false}
                      dataSource={dashboard.recentDiaries}
                      renderItem={(diary: any) => (
                        <List.Item style={{ paddingInline: 0 }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{diary.title || '未命名日记'}</div>
                            <div style={{ color: '#64748b', marginTop: 4 }}>{previewOf(diary.content, 48)}</div>
                          </div>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <div style={{ marginTop: 12, color: '#94a3b8' }}>暂无日记内容</div>
                  )}
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <Typography.Text type="secondary">本地备份状态</Typography.Text>
          <Typography.Title level={4} style={{ margin: 0 }}>数据安全与可迁移性</Typography.Title>
          {dashboard?.lastBackup?.value?.exportedAt ? (
            <div style={{ color: '#475569' }}>
              最近一次备份于 {fmtDateTime(dashboard.lastBackup.value.exportedAt)}
              {dashboard.lastBackup.value.path ? `，保存到 ${dashboard.lastBackup.value.path}` : '，已通过浏览器下载保存到本地。'}
            </div>
          ) : (
            <div style={{ color: '#475569' }}>
              还没有备份记录。建议在开始长期使用前先保存一份本地 JSON 备份。
            </div>
          )}
        </Space>
      </Card>
    </Space>
  );
}
