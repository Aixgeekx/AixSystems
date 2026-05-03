// 成就中心 - 本地成就徽章展示
import React from 'react';
import { Card, Col, Progress, Row, Space, Tag, Typography } from 'antd';
import { CrownOutlined, FireOutlined, StarOutlined, TrophyOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';
import { useAchievements } from '@/hooks/useAchievements';
import { useGameLevel } from '@/hooks/useGameLevel';

export default function AchievementsPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const achievements = useAchievements();
  const level = useGameLevel();

  const stats = useLiveQuery(async () => {
    const [items, sessions, habits, habitLogs, goals, diaries] = await Promise.all([
      db.items.filter(i => !i.deletedAt && i.completeStatus === 'done').count(),
      db.focusSessions.count(),
      db.habits.filter(h => !h.deletedAt).count(),
      db.habitLogs.count(),
      db.goals.filter(g => g.status === 'completed').count(),
      db.diaries.filter(d => !d.deletedAt).count()
    ]);
    return { doneItems: items, sessions, habits, checkins: habitLogs, completedGoals: goals, diaries };
  });

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const achievementList = achievements?.list || [];
  const unlockedCount = achievements?.unlockedCount || 0;
  const totalCount = achievements?.total || 0;
  const xpPercent = level?.levelProgress || 0;

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : 'linear-gradient(135deg, #f59e0b, #d97706 52%, #0f172a)',
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(245,158,11,0.18)'
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><TrophyOutlined /> 成就中心</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 8px', color: '#fff' }}>成就徽章墙</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>已解锁 {unlockedCount}/{totalCount} 枚成就徽章</Typography.Text>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Space direction="vertical" size={16} style={{ width: '100%', textAlign: 'center' }}>
              <Typography.Title level={4} style={{ margin: 0, color: titleColor }}><CrownOutlined /> 等级</Typography.Title>
              <div style={{ fontSize: 64, fontWeight: 900, color: accent }}>{level?.level || 1}</div>
              <Progress percent={xpPercent} strokeColor={accent} format={() => `${level?.totalXp || 0} XP`} />
              <Tag color="gold" style={{ borderRadius: 999, padding: '4px 16px' }}>Lv.{level?.level || 1} {level?.title || '新手'}</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><StarOutlined /> 数据总览</Typography.Title>
            <Row gutter={[12, 12]}>
              {[
                { label: '已完成事项', value: stats?.doneItems || 0, color: '#22c55e' },
                { label: '专注次数', value: stats?.sessions || 0, color: '#f59e0b' },
                { label: '习惯打卡', value: stats?.checkins || 0, color: '#8b5cf6' },
                { label: '完成目标', value: stats?.completedGoals || 0, color: '#3b82f6' },
                { label: '日记篇数', value: stats?.diaries || 0, color: '#ec4899' },
                { label: '活跃习惯', value: stats?.habits || 0, color: '#14b8a6' }
              ].map(item => (
                <Col xs={12} md={8} key={item.label}>
                  <div style={{ borderRadius: 16, padding: 14, textAlign: 'center', background: isDark ? `${item.color}14` : `${item.color}0f`, border: `1px solid ${item.color}22` }}>
                    <Typography.Title level={4} style={{ margin: 0, color: item.color }}>{item.value}</Typography.Title>
                    <Typography.Text style={{ color: subColor, fontSize: 12 }}>{item.label}</Typography.Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><FireOutlined /> 徽章墙</Typography.Title>
        <Row gutter={[12, 12]}>
          {achievementList.map(a => (
            <Col xs={12} sm={8} md={6} lg={4} key={a.id}>
              <div style={{
                borderRadius: 18, padding: 16, textAlign: 'center',
                background: a.unlocked ? (isDark ? `${a.color}22` : `${a.color}12`) : (isDark ? 'rgba(255,255,255,0.04)' : '#f1f5f9'),
                border: `1px solid ${a.unlocked ? `${a.color}44` : (isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0')}`,
                opacity: a.unlocked ? 1 : 0.5
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{a.icon}</div>
                <Typography.Text style={{ display: 'block', color: titleColor, fontWeight: 600, fontSize: 13 }}>{a.name}</Typography.Text>
                <Typography.Text style={{ color: subColor, fontSize: 11 }}>{a.desc}</Typography.Text>
                {a.unlocked && <Tag color="success" style={{ marginTop: 8, borderRadius: 999, fontSize: 11 }}>已解锁</Tag>}
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </Space>
  );
}
