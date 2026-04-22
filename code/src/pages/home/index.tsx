// 首页工作台 - 全局概览 + 快捷入口 + 本地模式信息 (v0.20.0 增强动画)
import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, List, Progress, Row, Space, Tag, Typography } from 'antd';
import {
  DatabaseOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FireOutlined,
  HddOutlined,
  PlusOutlined,
  ReadOutlined,
  SearchOutlined,
  ArrowRightOutlined
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
import { getElectron, isElectron } from '@/utils/electron';
import { useThemeVariants } from '@/hooks/useVariants';

function formatBytes(bytes?: number) {
  if (!bytes || bytes < 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export default function HomePage() {
  const nav = useNavigate();
  const openItemForm = useAppStore(s => s.openItemForm);
  const electron = isElectron();
  const { theme, style, getPanelStyle } = useThemeVariants();
  const isDark = style === 'cyberpunk' || style === 'dark' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [originStorage, setOriginStorage] = useState<{ usage?: number; quota?: number }>({});
  const [diskStats, setDiskStats] = useState<{ root: string; total: number; free: number; used: number } | null>(null);

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
  const diskPercent = diskStats?.total ? Math.round((diskStats.used / diskStats.total) * 100) : 0;
  const appPercent = originStorage.quota ? Math.round(((originStorage.usage || 0) / originStorage.quota) * 100) : 0;

  useEffect(() => {
    navigator.storage?.estimate?.().then(result => {
      setOriginStorage({ usage: result.usage, quota: result.quota });
    }).catch(() => setOriginStorage({}));
  }, []);

  useEffect(() => {
    if (!electron) return;
    getElectron()?.getStorageStats().then(setDiskStats).catch(() => setDiskStats(null));
  }, [electron]);

  const storageCards = useMemo(() => ([
    {
      title: '应用占用',
      value: formatBytes(originStorage.usage),
      desc: originStorage.quota ? `当前源配额 ${formatBytes(originStorage.quota)}` : '当前环境未返回配额信息',
      percent: appPercent,
      icon: <DatabaseOutlined />,
      color: '#2563eb'
    },
    {
      title: '磁盘已用',
      value: diskStats ? formatBytes(diskStats.used) : (electron ? '读取中' : '浏览器不可用'),
      desc: diskStats ? `${diskStats.root} 总量 ${formatBytes(diskStats.total)}` : (electron ? '正在读取本机磁盘状态' : '浏览器无法直接访问系统磁盘'),
      percent: diskPercent,
      icon: <HddOutlined />,
      color: '#7c3aed'
    },
    {
      title: '磁盘剩余',
      value: diskStats ? formatBytes(diskStats.free) : (electron ? '读取中' : '浏览器不可用'),
      desc: diskStats ? `可用空间 ${formatBytes(diskStats.free)}` : '用于评估备份和便携运行空间',
      percent: diskStats?.total ? 100 - diskPercent : 0,
      icon: <DownloadOutlined />,
      color: '#16a34a'
    }
  ]), [appPercent, diskPercent, diskStats, electron, originStorage.quota, originStorage.usage]);

  const shell = getPanelStyle() as any;
  const titleColor = shell.titleColor || shell.color || (isDark ? '#f8fafc' : '#0f172a');
  const textColor = shell.color || titleColor;
  const subColor = shell.subColor || (isDark ? 'rgba(226,232,240,0.74)' : '#64748b');
  const borderColor = isDark ? `${accent}33` : 'rgba(148,163,184,0.18)';
  const innerBg = isDark ? 'rgba(8,16,30,0.74)' : 'rgba(255,255,255,0.82)';
  const innerStrongBg = isDark ? 'rgba(6,12,24,0.9)' : 'rgba(255,255,255,0.92)';
  const tintedBg = (color: string) => isDark ? `${color}1a` : `${color}12`;

  const cardStyle: React.CSSProperties = {
    background: shell.background,
    backdropFilter: shell.backdropFilter,
    WebkitBackdropFilter: shell.WebkitBackdropFilter,
    border: shell.border,
    boxShadow: shell.boxShadow,
    color: textColor,
    borderRadius: 24,
    transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  const heroStyle: React.CSSProperties = {
    borderRadius: 30,
    overflow: 'hidden',
    background: isDark
      ? `linear-gradient(135deg, ${accent}15 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
      : `linear-gradient(135deg, ${theme.gradient[0]} 0%, ${theme.gradient[1]} 100%)`,
    boxShadow: isDark
      ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
      : `0 28px 60px ${accent}20`,
    border: isDark ? `1px solid ${accent}33` : 'none'
  };

  const actionButtonStyle: React.CSSProperties = {
    borderRadius: 14,
    fontWeight: 600,
    height: 42,
    border: `1px solid ${borderColor}`,
    background: innerStrongBg,
    color: titleColor,
    boxShadow: isDark ? `0 0 18px ${accent}18` : '0 14px 28px rgba(15,23,42,0.08)',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  const statTiles = [
    { label: '今日事项', value: dashboard?.todayItems.length || 0, icon: <CalendarOutlined />, color: '#38bdf8' },
    { label: '已完成', value: dashboard?.done || 0, icon: <CheckCircleOutlined />, color: '#22c55e' },
    { label: '待处理', value: dashboard?.pending || 0, icon: <ClockCircleOutlined />, color: '#60a5fa' },
    { label: '专注时长', value: `${Math.round(dashboard?.focusMinutes || 0)} 分`, icon: <FireOutlined />, color: '#f59e0b' }
  ];

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      {/* Hero */}
      <Card
        bordered={false}
        className="anim-fade-in-up"
        style={heroStyle}
        bodyStyle={{ padding: 22 }}
      >
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} xl={15}>
            <Typography.Text style={{ color: subColor }}>
              {dayjs().format('YYYY 年 M 月 D 日 · dddd')}
            </Typography.Text>
            <Typography.Title
              level={2}
              style={{
                margin: '8px 0 10px',
                color: titleColor,
                lineHeight: 1.12,
                fontFamily: theme.fontFamily,
                textShadow: isDark ? `0 0 20px ${accent}44` : 'none'
              }}
            >
              首页工作台
            </Typography.Title>
            <Typography.Paragraph
              style={{
                marginBottom: 14,
                color: subColor,
                fontSize: 14,
                maxWidth: 720
              }}
            >
              打开后直接看到今日事项、专注状态、存储占用和最近内容。首页现在优先强调可读性，不再让大块空白和白卡抢掉视线。
            </Typography.Paragraph>
            <Space wrap size={[10, 10]}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                className="hover-scale"
                style={{
                  borderRadius: 14,
                  height: 42,
                  fontWeight: 700,
                  boxShadow: `0 10px 26px ${accent}44`,
                  transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                onClick={() => openItemForm(undefined, 'schedule')}
              >
                新建日程
              </Button>
              <Button
                icon={<SearchOutlined />}
                className="hover-lift"
                style={actionButtonStyle}
                onClick={() => nav(ROUTES.SEARCH)}
              >
                全局搜索
              </Button>
              <Button
                icon={<DownloadOutlined />}
                className="hover-lift"
                style={actionButtonStyle}
                onClick={quickBackup}
              >
                快速备份
              </Button>
            </Space>
            <Space wrap size={[8, 8]} style={{ marginTop: 14 }}>
              <Tag
                bordered={false}
                style={{
                  background: tintedBg('#3b82f6'),
                  color: isDark ? '#93c5fd' : '#2563eb',
                  borderRadius: 6
                }}
              >
                本地离线
              </Tag>
              <Tag
                bordered={false}
                style={{
                  background: tintedBg('#16a34a'),
                  color: isDark ? '#86efac' : '#15803d',
                  borderRadius: 6
                }}
              >
                实时保存
              </Tag>
              <Tag
                bordered={false}
                style={{
                  background: tintedBg('#f59e0b'),
                  color: isDark ? '#fde68a' : '#b45309',
                  borderRadius: 6
                }}
              >
                便携运行
              </Tag>
            </Space>
          </Col>

          <Col xs={24} xl={9}>
            <div
              className="anim-fade-in-up stagger-2"
              style={{
                borderRadius: 24,
                padding: 16,
                background: innerBg,
                border: `1px solid ${borderColor}`,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.3s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 12
                }}
              >
                <Typography.Text strong style={{ color: titleColor }}>
                  今日完成率
                </Typography.Text>
                <Tag
                  bordered={false}
                  style={{
                    background: tintedBg(accent),
                    color: titleColor,
                    marginInlineEnd: 0,
                    borderRadius: 6
                  }}
                >
                  {completion}%
                </Tag>
              </div>
              <Progress
                percent={completion}
                strokeColor={accent}
                trailColor={isDark ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.08)'}
                showInfo={false}
                strokeLinecap="round"
              />
              <Row gutter={[10, 10]} style={{ marginTop: 12 }}>
                {statTiles.map(tile => (
                  <Col span={12} key={tile.label}>
                    <div
                      className="hover-scale"
                      style={{
                        borderRadius: 18,
                        padding: '12px 12px 10px',
                        background: innerStrongBg,
                        border: `1px solid ${borderColor}`,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          color: tile.color,
                          fontSize: 16
                        }}
                      >
                        {tile.icon}
                        <span style={{ fontSize: 12, color: subColor }}>
                          {tile.label}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 24,
                          fontWeight: 700,
                          color: titleColor
                        }}
                      >
                        {tile.value}
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>
              <Typography.Text
                style={{
                  display: 'block',
                  marginTop: 12,
                  color: subColor,
                  fontSize: 12
                }}
              >
                {dashboard?.lastBackup?.value?.exportedAt
                  ? `最近备份 ${fmtFromNow(dashboard.lastBackup.value.exportedAt)}`
                  : '建议先创建第一份本地备份'}
              </Typography.Text>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {/* 快捷入口 */}
        <Col xs={24} xl={9}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-2 hover-lift"
            style={{
              ...cardStyle,
              height: '100%'
            }}
            bodyStyle={{ padding: 18 }}
          >
            <Typography.Text style={{ color: subColor }}>
              快捷入口
            </Typography.Text>
            <Typography.Title
              level={4}
              style={{ margin: '4px 0 14px', color: titleColor }}
            >
              常用模块直接进入
            </Typography.Title>
            <Row gutter={[10, 10]}>
              {[
                { label: '我的一天', path: ROUTES.TODAY_DAY, icon: <CalendarOutlined />, color: '#38bdf8' },
                { label: '备忘录', path: ROUTES.MEMO, icon: <ReadOutlined />, color: '#34d399' },
                { label: '日记', path: ROUTES.DIARY_CAL, icon: <ReadOutlined />, color: '#a78bfa' },
                { label: '番茄专注', path: ROUTES.FOCUS, icon: <FireOutlined />, color: '#f59e0b' },
                { label: '导入导出', path: ROUTES.DATAIO, icon: <DownloadOutlined />, color: '#22d3ee' },
                { label: '系统设置', path: ROUTES.SYSTEM, icon: <ClockCircleOutlined />, color: '#94a3b8' }
              ].map(entry => (
                <Col xs={12} key={entry.path}>
                  <button
                    type="button"
                    className="hover-lift"
                    onClick={() => nav(entry.path)}
                    style={{
                      width: '100%',
                      border: `1px solid ${borderColor}`,
                      textAlign: 'left',
                      padding: '14px 12px',
                      borderRadius: 18,
                      cursor: 'pointer',
                      background: innerStrongBg,
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        display: 'grid',
                        placeItems: 'center',
                        background: tintedBg(entry.color),
                        color: entry.color,
                        fontSize: 18,
                        flexShrink: 0
                      }}
                    >
                      {entry.icon}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: titleColor
                      }}
                    >
                      {entry.label}
                    </span>
                  </button>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        {/* 存储控件 */}
        <Col xs={24} xl={15}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-3 hover-lift"
            style={cardStyle}
            bodyStyle={{ padding: 18 }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                marginBottom: 14
              }}
            >
              <div>
                <Typography.Text style={{ color: subColor }}>
                  存储控件
                </Typography.Text>
                <Typography.Title
                  level={4}
                  style={{ margin: '4px 0 0', color: titleColor }}
                >
                  应用存储与设备空间
                </Typography.Title>
              </div>
              <Tag
                bordered={false}
                style={{
                  background: tintedBg(accent),
                  color: titleColor,
                  marginInlineEnd: 0,
                  borderRadius: 6
                }}
              >
                {electron ? '桌面版实时读取' : '浏览器环境'}
              </Tag>
            </div>
            <Row gutter={[12, 12]}>
              {storageCards.map(card => (
                <Col key={card.title} xs={24} md={8}>
                  <div
                    className="hover-lift"
                    style={{
                      borderRadius: 20,
                      padding: 14,
                      background: tintedBg(card.color),
                      border: `1px solid ${borderColor}`,
                      minHeight: 168,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          display: 'grid',
                          placeItems: 'center',
                          background: innerStrongBg,
                          color: card.color
                        }}
                      >
                        {card.icon}
                      </div>
                      <Tag
                        bordered={false}
                        style={{
                          background: innerStrongBg,
                          color: titleColor,
                          marginInlineEnd: 0,
                          borderRadius: 6
                        }}
                      >
                        {card.percent}%
                      </Tag>
                    </div>
                    <div
                      style={{
                        marginTop: 14,
                        color: subColor,
                        fontSize: 12
                      }}
                    >
                      {card.title}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 24,
                        fontWeight: 700,
                        color: titleColor
                      }}
                    >
                      {card.value}
                    </div>
                    <Progress
                      percent={card.percent}
                      strokeColor={card.color}
                      showInfo={false}
                      style={{ margin: '12px 0 6px' }}
                      trailColor={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'}
                      strokeLinecap="round"
                    />
                    <Typography.Text
                      style={{
                        color: subColor,
                        fontSize: 12
                      }}
                    >
                      {card.desc}
                    </Typography.Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      {/* 本地内容速览 */}
      <Card
        bordered={false}
        className="anim-fade-in-up stagger-4"
        style={cardStyle}
        bodyStyle={{ padding: 18 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            marginBottom: 14
          }}
        >
          <div>
            <Typography.Text style={{ color: subColor }}>
              本地内容速览
            </Typography.Text>
            <Typography.Title
              level={4}
              style={{ margin: '4px 0 0', color: titleColor }}
            >
              最近记录与备份状态
            </Typography.Title>
          </div>
          <Typography.Text style={{ color: subColor, fontSize: 13 }}>
            {dashboard?.lastBackup?.value?.exportedAt
              ? `最近备份 ${fmtDateTime(dashboard.lastBackup.value.exportedAt)}`
              : '暂无备份记录'}
          </Typography.Text>
        </div>

        <Row gutter={[14, 14]}>
          <Col xs={24} lg={12}>
            <div
              className="hover-lift"
              style={{
                borderRadius: 20,
                padding: 16,
                background: tintedBg('#2563eb'),
                border: `1px solid ${borderColor}`,
                transition: 'all 0.3s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10
                }}
              >
                <Typography.Text strong style={{ color: titleColor }}>
                  置顶备忘录
                </Typography.Text>
                <Button
                  type="link"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  onClick={() => nav(ROUTES.MEMO)}
                  style={{ color: accent, padding: 0 }}
                >
                  查看全部
                </Button>
              </div>
              {dashboard?.pinnedNotes?.length ? (
                <List
                  split={false}
                  dataSource={dashboard.pinnedNotes}
                  renderItem={(memo: any) => (
                    <List.Item style={{ paddingInline: 0, paddingBlock: 10 }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ fontWeight: 600, color: titleColor }}>
                          {memo.title || '无标题备忘'}
                        </div>
                        <div style={{ color: subColor, marginTop: 4, fontSize: 13 }}>
                          {previewOf(memo.content, 56)}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ marginTop: 12, color: subColor, fontSize: 13 }}>
                  暂无置顶备忘录
                </div>
              )}
            </div>
          </Col>

          <Col xs={24} lg={12}>
            <div
              className="hover-lift"
              style={{
                borderRadius: 20,
                padding: 16,
                background: tintedBg('#16a34a'),
                border: `1px solid ${borderColor}`,
                transition: 'all 0.3s ease'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 10
                }}
              >
                <Typography.Text strong style={{ color: titleColor }}>
                  最近日记
                </Typography.Text>
                <Button
                  type="link"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  onClick={() => nav(ROUTES.DIARY_CAL)}
                  style={{ color: accent, padding: 0 }}
                >
                  查看全部
                </Button>
              </div>
              {dashboard?.recentDiaries?.length ? (
                <List
                  split={false}
                  dataSource={dashboard.recentDiaries}
                  renderItem={(diary: any) => (
                    <List.Item style={{ paddingInline: 0, paddingBlock: 10 }}>
                      <div style={{ width: '100%' }}>
                        <div style={{ fontWeight: 600, color: titleColor }}>
                          {diary.title || '未命名日记'}
                        </div>
                        <div style={{ color: subColor, marginTop: 4, fontSize: 13 }}>
                          {previewOf(diary.content, 56)}
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div style={{ marginTop: 12, color: subColor, fontSize: 13 }}>
                  暂无日记内容
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>
    </Space>
  );
}
