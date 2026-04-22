// 我的一天 - 当日事项聚合 + 日期跳转 + 总览卡片 (v0.20.0 增强动画)
import React, { useState } from 'react';
import { Button, Card, Col, DatePicker, Divider, Progress, Row, Space, Statistic, Tag, Typography } from 'antd';
import { CalendarOutlined, LeftOutlined, PlusOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { useLunar } from '@/hooks/useLunar';
import { useAppStore } from '@/stores/appStore';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';
import { fmtDate, fmtTime } from '@/utils/time';
import { useThemeVariants } from '@/hooks/useVariants';

export default function MyDayPage() {
  const [date, setDate] = useState(dayjs().startOf('day'));
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
                <Typography.Text type="secondary">日程摘要</Typography.Text>
                <Typography.Title level={4} style={{ margin: '4px 0 0' }}>今天值得完成的重点</Typography.Title>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <div
                  className="hover-scale"
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    background: isDark ? `${accent}0d` : 'rgba(59,130,246,0.08)',
                    border: isDark ? `1px solid ${accent}18` : '1px solid transparent',
                    transition: 'all 0.3s ease',
                    cursor: 'default'
                  }}
                >
                  <Typography.Text strong>全天事项</Typography.Text>
                  <Typography.Paragraph style={{ margin: '6px 0 0', color: '#475569' }}>
                    今天有 {allDayCount} 项全天任务，适合拆成上午和下午两段完成。
                  </Typography.Paragraph>
                </div>
                <div
                  className="hover-scale"
                  style={{
                    padding: 14,
                    borderRadius: 18,
                    background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.08)',
                    border: isDark ? '1px solid rgba(16,185,129,0.15)' : '1px solid transparent',
                    transition: 'all 0.3s ease',
                    cursor: 'default'
                  }}
                >
                  <Typography.Text strong>快速开始</Typography.Text>
                  <Typography.Paragraph style={{ margin: '6px 0 12px', color: '#475569' }}>
                    先放入一条最重要的事项，会让整天的节奏更稳定。
                  </Typography.Paragraph>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => openItemForm(undefined, 'schedule')}
                    style={{ borderRadius: 10, boxShadow: '0 8px 20px -4px rgba(59,130,246,0.3)' }}
                  >
                    新建日程
                  </Button>
                </div>
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
