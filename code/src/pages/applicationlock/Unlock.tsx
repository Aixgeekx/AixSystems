// 应用锁解锁页 - 独立路由,启动时若设置了锁则跳到此页
import React, { useState, useEffect } from 'react';
import { Card, Input, Button, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '@/stores/settingsStore';
import { hashPassword } from '@/utils/crypto';
import { APP_NAME } from '@/config/constants';
import { ROUTES } from '@/config/routes';

export default function UnlockPage() {
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
      background: 'linear-gradient(135deg,#B4E0FA 0%,#2E86DE 100%)' }}>
      <Card style={{ width: 380, textAlign: 'center' }}>
        <LockOutlined style={{ fontSize: 40, color: '#1677ff', marginBottom: 16 }} />
        <h2>{APP_NAME}</h2>
        <Input.Password value={pwd} onChange={e => setPwd(e.target.value)} placeholder="请输入解锁密码"
          onPressEnter={submit} autoFocus style={{ marginBottom: 12 }} />
        <Button type="primary" block onClick={submit}>解锁</Button>
      </Card>
    </div>
  );
}
