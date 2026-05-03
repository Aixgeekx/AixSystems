// 用户中心 - 工作台风格 (v0.24.0 完善升级)
import React, { useEffect, useState } from 'react';
import { Avatar, Button, Card, Col, Form, Input, Radio, Row, Space, Statistic, Tag, Typography, Upload, message, Divider, List } from 'antd';
import { UserOutlined, EditOutlined, CameraOutlined, SafetyCertificateOutlined, DatabaseOutlined, AppstoreOutlined, DesktopOutlined, GiftOutlined, MessageOutlined, SettingOutlined, ShareAltOutlined, QrcodeOutlined, CrownOutlined, HeartOutlined, CustomerServiceOutlined, MobileOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { db } from '@/db';
import { ROUTES } from '@/config/routes';
import { useLiveQuery } from 'dexie-react-hooks';
import { useThemeVariants } from '@/hooks/useVariants';

export default function UserPage() {
  const { theme } = useThemeVariants();
  const nav = useNavigate();
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

  const profileActions = [
    { label: '自定义APP', icon: <AppstoreOutlined />, path: '/home/menusort', color: '#38bdf8' },
    { label: '应用管理', icon: <SettingOutlined />, path: ROUTES.SYSTEM, color: '#22c55e' },
    { label: '高级功能', icon: <CrownOutlined />, path: '/home/functions', color: '#f59e0b' },
    { label: '桌面小组', icon: <DesktopOutlined />, path: ROUTES.DESKTOP_WIDGET, color: '#8b5cf6' }
  ];
  const centerEntries = [
    { label: '活动中心', desc: '查看本地功能活动与版本权益', icon: <GiftOutlined />, path: '/newFeatures/index' },
    { label: '我的消息', desc: '提醒、反馈和本地事件入口', icon: <MessageOutlined />, path: ROUTES.FEEDBACK },
    { label: '我的设备', desc: '桌面端与浏览器存储状态', icon: <MobileOutlined />, path: ROUTES.DATAIO },
    { label: '让时光序更好', desc: '记录建议、打赏与反馈', icon: <HeartOutlined />, path: ROUTES.FEEDBACK },
    { label: '邀请好友', desc: '复制离线版体验说明', icon: <ShareAltOutlined />, path: ROUTES.HELP },
    { label: '帮助中心', desc: '新手引导和常见功能说明', icon: <CustomerServiceOutlined />, path: ROUTES.HELP },
    { label: '设置', desc: '主题、数据、安全和模型配置', icon: <SettingOutlined />, path: ROUTES.SYSTEM }
  ];

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
              <UserOutlined /> 我的中心 · ID AIX-LOCAL-001
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
              {form.getFieldValue('nickname') || 'AixSystems 用户'}
            </Typography.Title>
            <Space wrap size={8}>
              <Tag color="gold" icon={<CrownOutlined />} style={{ borderRadius: 999 }}>VIP · 本地全功能</Tag>
              <Tag color="blue" icon={<QrcodeOutlined />} style={{ borderRadius: 999 }}>扫码入口</Tag>
              <Tag color="green" style={{ borderRadius: 999 }}>数据只保存在本机</Tag>
            </Space>
            <Typography.Paragraph style={{ margin: '12px 0 0', color: 'rgba(226,232,240,0.84)' }}>
              {form.getFieldValue('signature') || '一句签名，把今天变成可控的一天。'}
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

      <Row gutter={[12, 12]}>
        {profileActions.map(action => (
          <Col xs={12} md={6} key={action.label}>
            <button type="button" onClick={() => nav(action.path)} className="hover-lift" style={{ width: '100%', minHeight: 96, border: cardBorder, borderRadius: 22, background: isDark ? `${action.color}18` : '#fff', cursor: 'pointer', color: titleColor }}>
              <div style={{ color: action.color, fontSize: 26 }}>{action.icon}</div>
              <div style={{ marginTop: 8, fontWeight: 800 }}>{action.label}</div>
            </button>
          </Col>
        ))}
      </Row>

      <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <List
          itemLayout="horizontal"
          dataSource={centerEntries}
          renderItem={entry => (
            <List.Item onClick={() => nav(entry.path)} style={{ cursor: 'pointer', paddingInline: 4 }}>
              <List.Item.Meta
                avatar={<Avatar style={{ background: isDark ? `${accent}33` : '#eff6ff', color: accent }}>{entry.icon}</Avatar>}
                title={<span style={{ color: titleColor, fontWeight: 800 }}>{entry.label}</span>}
                description={<span style={{ color: subColor }}>{entry.desc}</span>}
              />
            </List.Item>
          )}
        />
      </Card>

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
