// 我的一天 - 当日事项聚合 + 日期跳转 + 总览卡片 (v0.20.0 增强动画)
import React, { useState } from 'react';
import { Button, Card, Col, DatePicker, Divider, List, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { BookOutlined, CalendarOutlined, FireOutlined, FlagOutlined, LeftOutlined, PlusOutlined, ReadOutlined, RightOutlined, RiseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { useLunar } from '@/hooks/useLunar';
import { useAppStore } from '@/stores/appStore';
import { useNavigate } from 'react-router-dom';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';
import { fmtDate, fmtTime } from '@/utils/time';
import { useThemeVariants } from '@/hooks/useVariants';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { ROUTES } from '@/config/routes';

export default function MyDayPage() {
  const [date, setDate] = useState(dayjs().startOf('day'));
  const nav = useNavigate();
  const openItemForm = useAppStore(s => s.openItemForm);
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const start = date.valueOf();
  const end = date.endOf('day').valueOf();
  const items = useItems({ startBetween: [start, end], pinnedFirst: true }) || [];
  const lunar = useLunar(start);
  const done = items.filter(item => item.completeStatus === 'done').length;
  const pending = items.filter(item => item.completeStatus === 'pending').length;
  const completion = items.length ? Math.round(done / items.length * 100) : 0;
  const nextItem = items.find(item => item.completeStatus !== 'done');
  const allDayCount = items.filter(item => item.allDay).length;
  const repeatCount = items.filter(item => !!item.repeatRule).length;

  const todayStart = dayjs().startOf('day').valueOf();
  const todayEnd = dayjs().endOf('day').valueOf();
  const growth = useLiveQuery(async () => {
    const [habits, habitLogs, sessions, goals, diaries, queue] = await Promise.all([
      db.habits.filter(h => !h.deletedAt).toArray(),
      db.habitLogs.toArray(),
      db.focusSessions.filter(s => s.startTime >= todayStart && s.startTime <= todayEnd).toArray(),
      db.goals.filter(g => !g.deletedAt && g.status === 'active').toArray(),
      db.diaries.filter(d => !d.deletedAt && d.date >= todayStart && d.date <= todayEnd).toArray(),
      db.reminderQueue.toArray()
    ]);
    const todayHabitLogs = habitLogs.filter(l => l.date >= todayStart && l.date <= todayEnd);
    const activeHabits = habits.filter(h => {
      const count = todayHabitLogs.filter(l => l.habitId === h.id).reduce((s, l) => s + l.count, 0);
      return count >= h.targetCount;
    }).length;
    const focusMin = sessions.reduce((sum, s) => sum + s.actualMs / 60_000, 0);
    const reviewDue = queue.filter(q => q.curveDay && !q.completedAt && q.fireAt <= todayEnd).length;
    return {
      habitDone: activeHabits,
      habitTotal: habits.length,
      focusMin: Math.round(focusMin),
      activeGoals: goals.length,
      hasDiary: diaries.length > 0,
      reviewDue,
      plan: [
        { label: '先清空最早待办', text: nextItem?.title || '新建一条关键日程', color: '#38bdf8' },
        { label: '补齐习惯控制', text: activeHabits >= habits.length ? '习惯已完成' : `还有 ${Math.max(0, habits.length - activeHabits)} 个习惯待打卡`, color: '#22c55e' },
        { label: '安排深度专注', text: focusMin >= 50 ? '今日专注已达标' : `还需 ${Math.max(0, 50 - Math.round(focusMin))} 分钟专注`, color: '#f59e0b' },
        { label: '收口成长记录', text: diaries.length ? '今日日记已记录' : '写一篇今日复盘日记', color: '#a78bfa' }
      ]
    };
  }, [nextItem?.id]) || { habitDone: 0, habitTotal: 0, focusMin: 0, activeGoals: 0, hasDiary: false, reviewDue: 0, plan: [] };

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      {/* Hero 卡片 */}
      <Card
        bordered={false}
        className="anim-fade-in-up"
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 50%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(14,165,233,0.94), rgba(37,99,235,0.9) 45%, rgba(15,23,42,0.92) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}20, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(37,99,235,0.2)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
              今日工作台
            </Typography.Text>
            <Typography.Title
              level={2}
              style={{
                marginTop: 8,
                marginBottom: 10,
                color: '#f8fafc',
                textShadow: isDark ? `0 0 20px ${accent}66` : 'none'
              }}
            >
              {date.format('M 月 D 日 dddd')}
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(226,232,240,0.82)' }}>
              {lunar.full}{lunar.term ? ` · ${lunar.term}` : ''}{lunar.festival ? ` · ${lunar.festival}` : ''}
            </Typography.Paragraph>

            <Space wrap size={10}>
              <Button
                icon={<LeftOutlined />}
                onClick={() => setDate(date.subtract(1, 'day'))}
                style={{ borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
              />
              <DatePicker
                value={date}
                onChange={value => value && setDate(value)}
                allowClear={false}
                style={{ width: 170, borderRadius: 10 }}
              />
              <Button
                icon={<RightOutlined />}
                onClick={() => setDate(date.add(1, 'day'))}
                style={{ borderRadius: 10, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff' }}
              />
              <Button
                type="link"
                style={{ color: '#e0f2fe' }}
                onClick={() => setDate(dayjs().startOf('day'))}
              >
                回到今天
              </Button>
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <div
              className="anim-fade-in-up stagger-2"
              style={{
                borderRadius: 24,
                padding: 18,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <Typography.Text strong style={{ color: '#f8fafc' }}>
                  下一件事
                </Typography.Text>
                <Tag color={nextItem ? 'cyan' : 'default'} style={{ marginInlineEnd: 0 }}>
                  {nextItem ? '准备开始' : '已清空'}
                </Tag>
              </div>

              <Typography.Title level={4} style={{ margin: '14px 0 6px', color: '#fff' }}>
                {nextItem?.title || '今天暂时没有待办'}
              </Typography.Title>
              <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>
                {nextItem ? `${fmtDate(nextItem.startTime)} ${nextItem.allDay ? '全天' : fmtTime(nextItem.startTime)}` : '现在就可以规划一件重要事项。'}
              </Typography.Text>

              <Divider style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '16px 0' }} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <Typography.Text style={{ color: 'rgba(226,232,240,0.8)' }}>今日完成率</Typography.Text>
                  <Typography.Title level={3} style={{ margin: '4px 0 0', color: '#fff' }}>
                    {completion}%
                  </Typography.Title>
                </div>
                <Progress
                  type="circle"
                  percent={completion}
                  size={72}
                  strokeColor="#f8fafc"
                  trailColor="rgba(255,255,255,0.14)"
                  format={value => <span style={{ color: '#fff', fontSize: 14 }}>{value}%</span>}
                />
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        {[
          { title: '今日事项', value: items.length, icon: <CalendarOutlined />, color: '#38bdf8', key: 'total' },
          { title: '已完成', value: done, valueStyle: { color: '#16a34a' }, key: 'done' },
          { title: '待处理', value: pending, valueStyle: { color: '#2563eb' }, key: 'pending' },
          { title: '重复事项', value: repeatCount, valueStyle: { color: '#7c3aed' }, key: 'repeat' }
        ].map((stat, i) => (
          <Col xs={24} md={12} xl={6} key={stat.key}>
            <Card
              bordered={false}
              className="anim-fade-in-up hover-lift"
              style={{
                borderRadius: 22,
                background: isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)',
                border: isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)',
                boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)',
                animationDelay: `${0.08 + i * 0.06}s`
              }}
            >
              <Statistic
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: isDark ? `${accent}aa` : '#64748b' }}>
                    {stat.icon} {stat.title}
                  </span>
                }
                value={stat.value}
                valueStyle={{ fontSize: 32, fontWeight: 700, ...stat.valueStyle }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 内容区 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-2 hover-lift"
            style={{
              borderRadius: 24,
              height: '100%',
              background: isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)',
              border: isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)',
              boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)'
            }}
          >
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div>
                <Typography.Text type="secondary">成长控制面板</Typography.Text>
                <Typography.Title level={4} style={{ margin: '4px 0 0', color: isDark ? '#f8fafc' : '#0f172a' }}>今日状态总览</Typography.Title>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  { icon: <CheckCircleOutlined />, label: '习惯打卡', value: `${growth.habitDone} / ${growth.habitTotal}`, color: '#22c55e', bg: isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)' },
                  { icon: <FireOutlined />, label: '专注时长', value: `${growth.focusMin} 分钟`, color: '#f59e0b', bg: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)' },
                  { icon: <FlagOutlined />, label: '进行中目标', value: `${growth.activeGoals} 个`, color: '#3b82f6', bg: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)' },
                  { icon: <BookOutlined />, label: '待复习', value: `${growth.reviewDue} 条`, color: '#8b5cf6', bg: isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.08)' },
                  { icon: <RiseOutlined />, label: '今日日记', value: growth.hasDiary ? '已记录' : '未记录', color: growth.hasDiary ? '#a78bfa' : '#64748b', bg: isDark ? 'rgba(167,139,250,0.1)' : 'rgba(167,139,250,0.08)' }
                ].map((row, i) => (
                  <div
                    key={i}
                    className="hover-scale"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: row.bg,
                      border: isDark ? `1px solid ${row.color}22` : '1px solid transparent',
                      transition: 'all 0.3s ease',
                      cursor: 'default'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: row.color, fontSize: 16 }}>{row.icon}</span>
                      <span style={{ color: isDark ? '#e2e8f0' : '#334155', fontSize: 14 }}>{row.label}</span>
                    </div>
                    <span style={{ color: row.color, fontWeight: 700, fontSize: 14 }}>{row.value}</span>
                  </div>
                ))}
              </div>

              <div
                className="hover-scale"
                style={{
                  padding: 14,
                  borderRadius: 18,
                  background: isDark ? `${accent}0d` : 'rgba(59,130,246,0.06)',
                  border: isDark ? `1px solid ${accent}18` : '1px solid transparent',
                  transition: 'all 0.3s ease',
                  cursor: 'default'
                }}
              >
                <Typography.Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>AI 日计划编排</Typography.Text>
                <List
                  size="small"
                  dataSource={growth.plan}
                  renderItem={(row: any, index) => (
                    <List.Item style={{ paddingInline: 0, borderBlockEnd: index === growth.plan.length - 1 ? 'none' : undefined }}>
                      <div style={{ width: '100%' }}>
                        <Tag color="blue" style={{ borderRadius: 6 }}>#{index + 1}</Tag>
                        <Typography.Text strong style={{ color: row.color }}>{row.label}</Typography.Text>
                        <div style={{ marginTop: 4, color: isDark ? '#94a3b8' : '#475569', fontSize: 12 }}>{row.text}</div>
                      </div>
                    </List.Item>
                  )}
                />
              </div>

              <div
                className="hover-scale"
                style={{
                  padding: 14,
                  borderRadius: 18,
                  background: isDark ? 'rgba(15,23,42,0.72)' : 'rgba(248,250,252,0.86)',
                  border: isDark ? `1px solid ${accent}18` : '1px solid transparent',
                  transition: 'all 0.3s ease'
                }}
              >
                <Typography.Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>自动化执行面板</Typography.Text>
                <Space wrap size={8} style={{ marginTop: 12 }}>
                  <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => openItemForm(undefined, 'schedule')} style={{ borderRadius: 10 }}>新建日程</Button>
                  <Button size="small" icon={<FireOutlined />} onClick={() => nav(ROUTES.FOCUS)} style={{ borderRadius: 10 }}>开始专注</Button>
                  <Button size="small" icon={<BookOutlined />} onClick={() => nav(ROUTES.REVIEW)} style={{ borderRadius: 10 }}>处理复习</Button>
                  <Button size="small" icon={<ReadOutlined />} onClick={() => nav(ROUTES.DIARY_CAL)} style={{ borderRadius: 10 }}>写日记</Button>
                </Space>
                <Typography.Paragraph style={{ margin: '10px 0 0', color: isDark ? '#94a3b8' : '#475569', fontSize: 12 }}>
                  今天有 {allDayCount} 项全天任务，适合拆成上午和下午两段完成。
                </Typography.Paragraph>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-3"
            style={{
              borderRadius: 24,
              background: isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)',
              border: isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)',
              boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 30px -10px rgba(0,0,0,0.05)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div>
                <Typography.Text type="secondary">今日清单</Typography.Text>
                <Typography.Title level={4} style={{ margin: '4px 0 0' }}>按时间顺序处理今天的事项</Typography.Title>
              </div>
              <Space wrap size={8}>
                <Tag color="blue">总数 {items.length}</Tag>
                <Tag color="green">完成 {done}</Tag>
                <Tag color="gold">待办 {pending}</Tag>
              </Space>
            </div>

            <Divider style={{ margin: '0 0 16px' }} />

            {items.length === 0 ? (
              <Empty text="今天暂无事项" subtext="先创建一条高优先级任务吧" />
            ) : items.map((item, i) => (
              <ItemCard key={item.id} item={item} index={i} />
            ))}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
