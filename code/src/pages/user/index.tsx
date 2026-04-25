// 用户中心 - 工作台风格 (v0.24.0 完善升级)
import React, { useEffect, useState } from 'react';
import { Avatar, Button, Card, Col, Form, Input, Radio, Row, Space, Statistic, Tag, Typography, Upload, message, Divider } from 'antd';
import { UserOutlined, EditOutlined, CameraOutlined, SafetyCertificateOutlined, DatabaseOutlined } from '@ant-design/icons';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useThemeVariants } from '@/hooks/useVariants';

export default function UserPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const [form] = Form.useForm();
  const [avatar, setAvatar] = useState<string>('');

  const stats = useLiveQuery(async () => {
    const [items, diaries, memos, sessions] = await Promise.all([
      db.items.count(), db.diaries.count(), db.memos.count(), db.focusSessions.count()
    ]);
    return { items, diaries, memos, sessions };
  }, []) || { items: 0, diaries: 0, memos: 0, sessions: 0 };

  useEffect(() => {
    db.userProfile.get(1).then(u => {
      if (u) { form.setFieldsValue(u); setAvatar(u.avatar || ''); }
    });
  }, []);

  async function save() {
    const v = await form.validateFields();
    await db.userProfile.put({ id: 1, ...v, avatar });
    message.success('保存成功');
  }

  async function onAvatar(file: File) {
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
    return false;
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(14,165,233,0.94), rgba(56,189,248,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(14,165,233,0.16)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={6} style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Avatar size={96} src={avatar} icon={<UserOutlined />}
                style={{ border: '3px solid rgba(255,255,255,0.3)', boxShadow: `0 8px 24px ${accent}33` }} />
              <Upload accept="image/*" showUploadList={false} beforeUpload={onAvatar}>
                <Button size="small" shape="circle" icon={<CameraOutlined />}
                  style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(255,255,255,0.9)' }} />
              </Upload>
            </div>
          </Col>
          <Col xs={24} lg={18}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
              <UserOutlined /> 个人中心
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
              个人资料 · 本地用户档案
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 0, color: 'rgba(226,232,240,0.84)' }}>
              所有资料完全离线保存在本地，不会上传到任何服务器。
            </Typography.Paragraph>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {[
          { label: '事项总数', value: stats.items, color: '#38bdf8', icon: <DatabaseOutlined /> },
          { label: '日记篇数', value: stats.diaries, color: '#22c55e', icon: <EditOutlined /> },
          { label: '备忘录', value: stats.memos, color: '#f59e0b', icon: <SafetyCertificateOutlined /> },
          { label: '专注次数', value: stats.sessions, color: '#8b5cf6', icon: <UserOutlined /> }
        ].map((s, i) => (
          <Col xs={12} md={6} key={s.label}>
            <Card bordered={false} className="anim-fade-in-up hover-lift"
              style={{ borderRadius: 22, background: cardBg, border: cardBorder, animationDelay: `${0.06 + i * 0.04}s` }}>
              <Statistic title={<span style={{ display: 'flex', alignItems: 'center', gap: 6, color: subColor }}>{s.icon} {s.label}</span>}
                value={s.value} valueStyle={{ fontSize: 28, fontWeight: 700, color: s.color }} />
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder, maxWidth: 680 }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}>编辑资料</Typography.Title>
        <Form form={form} layout="vertical">
          <Form.Item label={<span style={{ color: isDark ? '#e2e8f0' : undefined }}>昵称</span>} name="nickname" rules={[{ required: true }]}>
            <Input placeholder="请输入昵称" style={{ borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : undefined }} />
          </Form.Item>
          <Form.Item label={<span style={{ color: isDark ? '#e2e8f0' : undefined }}>性别</span>} name="gender">
            <Radio.Group options={[{ value: 'male', label: '男' }, { value: 'female', label: '女' }, { value: 'other', label: '不公开' }]} />
          </Form.Item>
          <Form.Item label={<span style={{ color: isDark ? '#e2e8f0' : undefined }}>签名</span>} name="signature">
            <Input.TextArea rows={2} placeholder="请编辑签名" style={{ borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.06)' : undefined }} />
          </Form.Item>
          <Button type="primary" onClick={save} style={{ borderRadius: 10 }}>保存</Button>
        </Form>
      </Card>
    </Space>
  );
}
