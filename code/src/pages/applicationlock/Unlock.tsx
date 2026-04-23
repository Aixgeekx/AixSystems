// 应用锁解锁页 - 独立路由,启动时若设置了锁则跳到此页 (v0.21.4 主题适配)
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settingsStore';
import { hashPassword } from '@/utils/crypto';
import { APP_NAME } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

export default function UnlockPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [pwd, setPwd] = useState('');
  const nav = useNavigate();
  const { appLockPasswordHash, startPage } = useSettingsStore();

  async function submit() {
    const h = await hashPassword(pwd);
    if (h === appLockPasswordHash) {
      sessionStorage.setItem('unlocked', '1');
      nav(startPage || ROUTES.TODAY_DAY);
    } else message.error('密码错误');
  }

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isDark ? `linear-gradient(135deg, ${accent}33 0%, #0f172a 100%)` : 'linear-gradient(135deg,#B4E0FA 0%,#2E86DE 100%)' }}>
      <Card style={{ width: 380, textAlign: 'center', background: isDark ? 'rgba(10,14,28,0.85)' : undefined, border: isDark ? `1px solid ${accent}44` : undefined }}>
        <LockOutlined style={{ fontSize: 40, color: isDark ? accent : '#1677ff', marginBottom: 16 }} />
        <h2 style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>{APP_NAME}</h2>
        <Input.Password value={pwd} onChange={e => setPwd(e.target.value)} placeholder="请输入解锁密码"
          onPressEnter={submit} autoFocus style={{ marginBottom: 12, background: isDark ? 'rgba(255,255,255,0.06)' : undefined }} />
        <Button type="primary" block onClick={submit} style={{ background: isDark ? accent : undefined, borderColor: isDark ? accent : undefined }}>解锁</Button>
      </Card>
    </div>
  );
}
