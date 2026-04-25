// 意见反馈 - 工作台风格 (v0.24.0 完善升级)
import React, { useState } from 'react';
import { Button, Card, Col, Input, List, Row, Select, Space, Statistic, Tag, Typography, Divider, message } from 'antd';
import { MessageOutlined, SendOutlined, HistoryOutlined, BulbOutlined, BugOutlined, ToolOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { nanoid } from 'nanoid';
import { fmtDateTime } from '@/utils/time';
import { useThemeVariants } from '@/hooks/useVariants';

const TYPE_MAP: Record<string, { icon: React.ReactNode; color: string }> = {
  '优化': { icon: <ToolOutlined />, color: '#3b82f6' },
  '新需求': { icon: <BulbOutlined />, color: '#22c55e' },
  'bug': { icon: <BugOutlined />, color: '#ef4444' },
  '其他': { icon: <MessageOutlined />, color: '#8b5cf6' }
};

export default function FeedbackPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const [type, setType] = useState('优化');
  const [content, setContent] = useState('');
  const logs = useLiveQuery(() => db.eventLog.where('level').equals('feedback').reverse().sortBy('createdAt'), []) || [];

  async function submit() {
    if (!content.trim()) return message.warning('请填写内容');
    await db.eventLog.add({ id: nanoid(), level: 'feedback', message: `[${type}] ${content}`, createdAt: Date.now() });
    message.success('已记录到本地日志');
    setContent('');
  }

  const typeCounts = Object.keys(TYPE_MAP).map(k => ({
    label: k, count: logs.filter(l => l.message.startsWith(`[${k}]`)).length, ...TYPE_MAP[k]
  }));

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(99,102,241,0.94), rgba(139,92,246,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(99,102,241,0.16)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
          <MessageOutlined /> 反馈中心
        </Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
          意见反馈 · 所有反馈本地存储
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 0, color: 'rgba(226,232,240,0.84)' }}>
          提交的反馈会写入本地日志，数据完全离线保存。
        </Typography.Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        {typeCounts.map((t, i) => (
          <Col xs={12} md={6} key={t.label}>
            <Card bordered={false} className="anim-fade-in-up hover-lift"
              style={{ borderRadius: 22, background: cardBg, border: cardBorder, animationDelay: `${0.06 + i * 0.04}s` }}>
              <Statistic
                title={<span style={{ display: 'flex', alignItems: 'center', gap: 6, color: subColor }}>{t.icon} {t.label}</span>}
                value={t.count} valueStyle={{ fontSize: 28, fontWeight: 700, color: t.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>提交反馈</Typography.Title>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Select value={type} onChange={setType} style={{ width: 160 }}
            options={Object.keys(TYPE_MAP).map(v => ({ value: v, label: v }))} />
          <Input.TextArea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="请输入问题描述或建议"
            style={{ borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.04)' : undefined }} />
          <Button type="primary" icon={<SendOutlined />} onClick={submit} style={{ borderRadius: 10 }}>提交</Button>
        </Space>
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-3" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}><HistoryOutlined /> 历史反馈</Typography.Title>
          <Tag color="blue">共 {logs.length} 条</Tag>
        </div>
        <Divider style={{ margin: '0 0 12px' }} />
        {logs.length === 0 ? <div style={{ color: subColor, padding: 24, textAlign: 'center' }}>暂无反馈记录</div> :
          <List split={false} dataSource={logs.slice(0, 20)} renderItem={(l: any) => {
            const matchType = l.message.match(/^\[(.+?)\]/)?.[1] || '其他';
            const meta = TYPE_MAP[matchType] || TYPE_MAP['其他'];
            return (
              <List.Item style={{ paddingInline: 0 }}>
                <div style={{
                  width: '100%', padding: '12px 16px', borderRadius: 14,
                  background: isDark ? `${meta.color}0d` : `${meta.color}08`,
                  border: `1px solid ${meta.color}22`
                }}>
                  <Space size={8}>
                    <Tag color={meta.color} style={{ borderRadius: 6 }}>{matchType}</Tag>
                    <Typography.Text style={{ color: subColor, fontSize: 12 }}>{fmtDateTime(l.createdAt)}</Typography.Text>
                  </Space>
                  <div style={{ marginTop: 6, color: titleColor }}>{l.message.replace(/^\[.+?\]\s*/, '')}</div>
                </div>
              </List.Item>
            );
          }} />
        }
      </Card>
    </Space>
  );
}
