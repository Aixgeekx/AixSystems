// 复习中心 - 聚合记忆曲线的今日待复习、未来复习与最近已触发提醒
import React from 'react';
import { Button, Card, Col, List, Radio, Row, Space, Statistic, Tag, Typography } from 'antd';
import { BookOutlined, CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, NotificationOutlined, ReloadOutlined } from '@ant-design/icons';
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
  const reinforceDays = useLiveQuery(async () => (await db.cacheKv.get('review_reinforce_days'))?.value || 1, []);

  const dashboard = useLiveQuery(async () => {
    const [queue, items] = await Promise.all([
      db.reminderQueue.toArray(),
      db.items.toArray()
    ]);
    const todayStart = dayjs().startOf('day').valueOf();
    const todayEnd = dayjs().endOf('day').valueOf();
    const itemMap = new Map(items.map(item => [item.id, item]));
    const reviewQueue = queue
      .filter(entry => entry.curveDay)
      .map(entry => ({
        ...entry,
        completedAt: entry.completedAt || (entry.reviewFeedback ? entry.reviewAt : undefined),
        item: itemMap.get(entry.itemId)
      }))
      .filter(entry => entry.item && !entry.item.deletedAt)
      .sort((a, b) => a.fireAt - b.fireAt);

    const openQueue = reviewQueue.filter(entry => !entry.completedAt);
    const todayPending = openQueue.filter(entry => entry.fireAt >= todayStart && entry.fireAt <= todayEnd);
    const overdue = openQueue.filter(entry => entry.fireAt < todayStart);
    const upcoming = openQueue.filter(entry => entry.fireAt > todayEnd).slice(0, 12);
    const recentFired = reviewQueue.filter(entry => entry.fired && !entry.completedAt).slice(-12).reverse();
    const completed = reviewQueue.filter(entry => entry.completedAt).sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));
    const mastered = completed.filter(entry => entry.reviewFeedback === 'mastered').length;
    const fuzzy = completed.filter(entry => entry.reviewFeedback === 'fuzzy').length;
    const recommendedDays = fuzzy >= mastered ? 1 : fuzzy * 3 >= mastered ? 2 : fuzzy ? 3 : 7;

    const byDay = Array.from({ length: 7 }).map((_, i) => {
      const d = dayjs().add(i, 'day');
      const start = d.startOf('day').valueOf();
      const end = d.endOf('day').valueOf();
      const count = openQueue.filter(entry => entry.fireAt >= start && entry.fireAt <= end).length;
      return { day: d.format('M/D'), count };
    });
    const heatmap = Array.from({ length: 30 }).map((_, i) => {
      const d = dayjs().add(i, 'day');
      const start = d.startOf('day').valueOf();
      const end = d.endOf('day').valueOf();
      const count = openQueue.filter(entry => entry.fireAt >= start && entry.fireAt <= end).length;
      const level = count >= 6 ? '爆发' : count >= 3 ? '高压' : count >= 1 ? '轻压' : '空闲';
      return { day: d.format('M/D'), date: d.format('YYYY-MM-DD'), count, level };
    });

    return { todayPending, overdue, upcoming, recentFired, completed, mastered, fuzzy, recommendedDays, byDay, heatmap, total: reviewQueue.length };
  }, []);

  const statCards = [
    { label: '今日待复习', value: dashboard?.todayPending.length || 0, color: '#22c55e', icon: <BookOutlined /> },
    { label: '已过期', value: dashboard?.overdue.length || 0, color: '#ef4444', icon: <ClockCircleOutlined /> },
    { label: '已完成复习', value: dashboard?.completed.length || 0, color: '#38bdf8', icon: <CheckCircleOutlined /> },
    { label: '掌握率', value: dashboard?.completed.length ? Math.round(dashboard.mastered / dashboard.completed.length * 100) : 0, suffix: '%', color: '#f59e0b', icon: <NotificationOutlined /> }
  ];

  const updateReinforceDays = async (value: number) => {
    await db.cacheKv.put({ key: 'review_reinforce_days', value });
  };

  const completeReview = async (entry: any, reviewFeedback: 'mastered' | 'fuzzy') => {
    const completedAt = Date.now();
    await db.reminderQueue.update(entry.id, { fired: true, completedAt, reviewFeedback });
    if (reviewFeedback === 'fuzzy') {
      const fireAt = dayjs(completedAt).add(reinforceDays || 1, 'day').startOf('hour').valueOf();
      await db.reminderQueue.put({
        id: `${entry.id}_reinforce_${fireAt}`,
        itemId: entry.itemId,
        fireAt,
        fired: false,
        label: `巩固复习 · ${entry.label || `D${entry.curveDay}`}`,
        reinforcementFromId: entry.id,
        curveDay: entry.curveDay
      });
    }
  };

  const renderQueueItem = (entry: any, muted = false, actionable = true) => (
    <List.Item style={{ paddingInline: 0 }}>
      <div
        style={{
          width: '100%',
          borderRadius: 18,
          padding: '14px 16px',
          background: muted ? (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)') : (isDark ? `${accent}10` : `${accent}08`),
          border: `1px solid ${cardBorder}`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div onClick={() => openItemForm(entry.itemId)} style={{ minWidth: 0, flex: 1, cursor: 'pointer' }}>
            <div style={{ fontWeight: 700, color: titleColor }}>{entry.item?.title || '已删除事项'}</div>
            <div style={{ color: subColor, fontSize: 12, marginTop: 4 }}>
              {entry.label || `第 ${entry.curveDay} 天复习`} · {fmtDateTime(entry.fireAt)} · {entry.completedAt ? `完成于 ${fmtDateTime(entry.completedAt)}` : fmtFromNow(entry.fireAt)}
            </div>
          </div>
          <Space size={8} wrap>
            {entry.reinforcementFromId ? <Tag color="purple" style={{ marginInlineEnd: 0, borderRadius: 6 }}>巩固回流</Tag> : null}
            {entry.reviewFeedback ? <Tag color={entry.reviewFeedback === 'mastered' ? 'green' : 'orange'} style={{ marginInlineEnd: 0, borderRadius: 6 }}>{entry.reviewFeedback === 'mastered' ? '已掌握' : '需巩固'}</Tag> : null}
            <Tag color={muted ? 'default' : 'cyan'} style={{ marginInlineEnd: 0, borderRadius: 6 }}>D{entry.curveDay}</Tag>
            {actionable ? (
              <Space.Compact>
                <Button size="small" type="primary" onClick={() => completeReview(entry, 'mastered')}>已掌握</Button>
                <Button size="small" onClick={() => completeReview(entry, 'fuzzy')}>需巩固</Button>
              </Space.Compact>
            ) : null}
          </Space>
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
          这里会自动汇总今天待复习、未来复习、已触发提醒和掌握反馈，让记忆曲线不只在后台排队，而是能被你真正执行和复盘。
        </Typography.Paragraph>
        <Space wrap size={8}>
          <Tag color="blue">1/2/4/7/15/30 天</Tag>
          <Tag color="green">今日待复习</Tag>
          <Tag color="purple">未来节点</Tag>
          <Tag color="gold">掌握反馈</Tag>
          <Tag color="purple">巩固回流</Tag>
        </Space>
      </Card>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>复习强度配置</Typography.Title>
            <Typography.Text style={{ color: subColor }}>标记“需巩固”后，系统会按这里的间隔生成下一次巩固回流。</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="gold" style={{ borderRadius: 6 }}>AI 推荐 {dashboard?.recommendedDays || 7} 天</Tag>
              <Tag color="orange" style={{ borderRadius: 6 }}>需巩固 {dashboard?.fuzzy || 0} 次</Tag>
              <Button size="small" type="link" onClick={() => updateReinforceDays(dashboard?.recommendedDays || 7)} style={{ paddingInline: 0 }}>应用推荐</Button>
            </div>
          </div>
          <Radio.Group
            value={reinforceDays || 1}
            optionType="button"
            buttonStyle="solid"
            onChange={e => updateReinforceDays(e.target.value)}
            options={[
              { label: '1 天', value: 1 },
              { label: '2 天', value: 2 },
              { label: '3 天', value: 3 },
              { label: '7 天', value: 7 }
            ]}
          />
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {statCards.map(card => (
          <Col xs={24} md={12} xl={6} key={card.label}>
            <Card bordered={false} style={{ borderRadius: 22, background: cardBg, border: cardBorder }}>
              <Statistic title={<span style={{ color: subColor }}>{card.icon} {card.label}</span>} value={card.value} suffix={(card as any).suffix} valueStyle={{ color: card.color, fontWeight: 700 }} />
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

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>未来 30 天复习压力热力图</Typography.Title>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(54px, 1fr))', gap: 8 }}>
          {dashboard?.heatmap.map(day => {
            const color = day.count >= 6 ? '#ef4444' : day.count >= 3 ? '#f59e0b' : day.count >= 1 ? '#22c55e' : '#94a3b8';
            return (
              <div key={day.date} title={`${day.date} · ${day.count} 条`} style={{ borderRadius: 14, padding: '10px 6px', textAlign: 'center', background: isDark ? `${color}18` : `${color}12`, border: `1px solid ${color}44` }}>
                <div style={{ color: subColor, fontSize: 11 }}>{day.day}</div>
                <div style={{ color, fontWeight: 800, fontSize: 18 }}>{day.count}</div>
                <div style={{ color: subColor, fontSize: 10 }}>{day.level}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>未来复习</Typography.Title>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 10, marginBottom: 12 }}>
              {dashboard?.byDay.map(day => (
                <div key={day.day} style={{ borderRadius: 16, padding: '14px 8px', textAlign: 'center', background: isDark ? `${accent}10` : `${accent}08`, border: `1px solid ${cardBorder}` }}>
                  <div style={{ color: subColor, fontSize: 12 }}>{day.day}</div>
                  <div style={{ marginTop: 8, fontSize: 22, fontWeight: 700, color: titleColor }}>{day.count}</div>
                </div>
              ))}
            </div>
            {dashboard?.upcoming.length ? (
              <List dataSource={dashboard.upcoming.slice(0, 5)} split={false} renderItem={item => renderQueueItem(item, true)} />
            ) : null}
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>待反馈提醒</Typography.Title>
            {dashboard?.recentFired.length ? (
              <List dataSource={dashboard.recentFired} split={false} renderItem={item => renderQueueItem(item, true)} />
            ) : (
              <Empty text="没有待反馈提醒" subtext="已触发但尚未标记掌握状态的复习会出现在这里。" />
            )}
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 12px', color: titleColor }}>最近完成复习</Typography.Title>
        {dashboard?.completed.length ? (
          <List dataSource={dashboard.completed.slice(0, 12)} split={false} renderItem={item => renderQueueItem(item, true, false)} />
        ) : (
          <Empty text="还没有完成记录" subtext="在今日、过期或已触发复习中标记掌握状态后，这里会形成复习闭环；需巩固会自动回流到下一次复习。" />
        )}
      </Card>
    </Space>
  );
}
