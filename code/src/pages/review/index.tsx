// 复习中心 - 聚合记忆曲线的今日待复习、未来复习与最近已触发提醒
import React from 'react';
import { Button, Card, Col, List, Row, Space, Statistic, Tag, Typography } from 'antd';
import { BookOutlined, CalendarOutlined, ClockCircleOutlined, NotificationOutlined, ReloadOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import Empty from '@/components/Empty';
import { fmtDateTime, fmtFromNow } from '@/utils/time';
import { useAppStore } from '@/stores/appStore';
import { useThemeVariants } from '@/hooks/useVariants';

export default function ReviewCenterPage() {
  const openItemForm = useAppStore(s => s.openItemForm);
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';

  const dashboard = useLiveQuery(async () => {
    const [queue, items] = await Promise.all([
      db.reminderQueue.toArray(),
      db.items.toArray()
    ]);
    const now = Date.now();
    const todayStart = dayjs().startOf('day').valueOf();
    const todayEnd = dayjs().endOf('day').valueOf();
    const itemMap = new Map(items.map(item => [item.id, item]));
    const reviewQueue = queue
      .filter(entry => entry.curveDay)
      .map(entry => ({
        ...entry,
        item: itemMap.get(entry.itemId)
      }))
      .filter(entry => entry.item && !entry.item.deletedAt)
      .sort((a, b) => a.fireAt - b.fireAt);

    const todayPending = reviewQueue.filter(entry => !entry.fired && entry.fireAt >= todayStart && entry.fireAt <= todayEnd);
    const overdue = reviewQueue.filter(entry => !entry.fired && entry.fireAt < todayStart);
    const upcoming = reviewQueue.filter(entry => !entry.fired && entry.fireAt > todayEnd).slice(0, 12);
    const recentDone = reviewQueue.filter(entry => entry.fired).slice(-12).reverse();

    const byDay = Array.from({ length: 7 }).map((_, i) => {
      const d = dayjs().add(i, 'day');
      const start = d.startOf('day').valueOf();
      const end = d.endOf('day').valueOf();
      const count = reviewQueue.filter(entry => !entry.fired && entry.fireAt >= start && entry.fireAt <= end).length;
      return { day: d.format('M/D'), count };
    });

    return { todayPending, overdue, upcoming, recentDone, byDay, total: reviewQueue.length };
  }, []);

  const statCards = [
    { label: '今日待复习', value: dashboard?.todayPending.length || 0, color: '#22c55e', icon: <BookOutlined /> },
    { label: '已过期', value: dashboard?.overdue.length || 0, color: '#ef4444', icon: <ClockCircleOutlined /> },
    { label: '未来 7 天', value: dashboard?.byDay.reduce((sum, item) => sum + item.count, 0) || 0, color: '#38bdf8', icon: <CalendarOutlined /> },
    { label: '已触发提醒', value: dashboard?.recentDone.length || 0, color: '#f59e0b', icon: <NotificationOutlined /> }
  ];

  const renderQueueItem = (entry: any, muted = false) => (
    <List.Item style={{ paddingInline: 0 }}>
      <div
        onClick={() => openItemForm(entry.itemId)}
        style={{
          width: '100%',
          borderRadius: 18,
          padding: '14px 16px',
          background: muted ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)') : (isDark ? `${accent}10` : `${accent}08`),
          border: `1px solid ${cardBorder}`,
          cursor: 'pointer'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, color: titleColor }}>{entry.item?.title || '已删除事项'}</div>
            <div style={{ color: subColor, fontSize: 12, marginTop: 4 }}>
              {entry.label || `第 ${entry.curveDay} 天复习`} · {fmtDateTime(entry.fireAt)} · {fmtFromNow(entry.fireAt)}
            </div>
          </div>
          <Tag color={muted ? 'default' : 'cyan'} style={{ marginInlineEnd: 0, borderRadius: 6 }}>
            D{entry.curveDay}
          </Tag>
        </div>
      </div>
    </List.Item>
  );

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(59,130,246,0.92) 44%, rgba(16,185,129,0.88) 100%)',
          boxShadow: isDark ? `0 28px 60px ${accent}24` : '0 28px 60px rgba(59,130,246,0.14)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(191,219,254,0.92)' }}>复习中心</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff' }}>
          把记忆曲线真正变成可执行的复习清单
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
          这里会自动汇总今天待复习、未来复习和已触发提醒，让记忆曲线不只在后台排队，而是能被你真正看到和执行。
        </Typography.Paragraph>
        <Space wrap size={8}>
          <Tag color="blue">1/2/4/7/15/30 天</Tag>
          <Tag color="green">今日待复习</Tag>
          <Tag color="purple">未来节点</Tag>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        {statCards.map(card => (
          <Col xs={24} md={12} xl={6} key={card.label}>
            <Card bordered={false} style={{ borderRadius: 22, background: cardBg, border: cardBorder }}>
              <Statistic title={<span style={{ color: subColor }}>{card.icon} {card.label}</span>} value={card.value} valueStyle={{ color: card.color, fontWeight: 700 }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>今日待复习</Typography.Title>
              <Button size="small" icon={<ReloadOutlined />} onClick={() => location.reload()}>刷新</Button>
            </div>
            {dashboard?.todayPending.length ? (
              <List dataSource={dashboard.todayPending} split={false} renderItem={item => renderQueueItem(item)} />
            ) : (
              <Empty text="今天没有待复习内容" subtext="继续保持，系统会在新的记忆曲线节点到来时自动出现。" />
            )}
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>已过期复习</Typography.Title>
            {dashboard?.overdue.length ? (
              <List dataSource={dashboard.overdue.slice(0, 10)} split={false} renderItem={item => renderQueueItem(item, true)} />
            ) : (
              <Empty text="没有过期复习" subtext="当前所有记忆曲线节点都按时排队中。" />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>未来 7 天复习分布</Typography.Title>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 10 }}>
              {dashboard?.byDay.map(day => (
                <div key={day.day} style={{ borderRadius: 16, padding: '14px 8px', textAlign: 'center', background: isDark ? `${accent}10` : `${accent}08`, border: `1px solid ${cardBorder}` }}>
                  <div style={{ color: subColor, fontSize: 12 }}>{day.day}</div>
                  <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700, color: titleColor }}>{day.count}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>最近已触发提醒</Typography.Title>
            {dashboard?.recentDone.length ? (
              <List dataSource={dashboard.recentDone} split={false} renderItem={item => renderQueueItem(item, true)} />
            ) : (
              <Empty text="还没有已触发提醒" subtext="当记忆曲线节点到点触发后，这里会显示最近完成的复习提醒。" />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
