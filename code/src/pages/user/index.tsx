// 用户中心 - 本地单用户资料 (v0.21.4 主题适配)
import React, { useEffect, useState } from 'react';
import { Card, Input, Form, Button, Avatar, Upload, message, Radio } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { db } from '@/db';
import { useThemeVariants } from '@/hooks/useVariants';

export default function UserPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const [form] = Form.useForm();
  const [avatar, setAvatar] = useState<string>('');

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
    <div style={{ maxWidth: 600 }}>
      <Card title={<span style={{ color: isDark ? '#f8fafc' : undefined }}>个人资料</span>} style={{ background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}>
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Avatar size={80} src={avatar} icon={<UserOutlined />} />
          <div style={{ marginTop: 8 }}>
            <Upload accept="image/*" showUploadList={false} beforeUpload={onAvatar}>
              <Button size="small">修改头像</Button>
            </Upload>
          </div>
        </div>
        <Form form={form} layout="vertical">
          <Form.Item label={<span style={{ color: isDark ? '#e2e8f0' : undefined }}>昵称</span>} name="nickname" rules={[{ required: true }]}><Input placeholder="请输入昵称" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : undefined }} /></Form.Item>
          <Form.Item label={<span style={{ color: isDark ? '#e2e8f0' : undefined }}>性别</span>} name="gender">
            <Radio.Group options={[{ value: 'male', label: '男' }, { value: 'female', label: '女' }, { value: 'other', label: '不公开' }]} />
          </Form.Item>
          <Form.Item label={<span style={{ color: isDark ? '#e2e8f0' : undefined }}>签名</span>} name="signature"><Input.TextArea rows={2} placeholder="请编辑签名" style={{ background: isDark ? 'rgba(255,255,255,0.06)' : undefined }} /></Form.Item>
          <Button type="primary" onClick={save}>保存</Button>
        </Form>
      </Card>
    </div>
  );
}
