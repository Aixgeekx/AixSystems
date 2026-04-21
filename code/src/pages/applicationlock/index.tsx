// 应用锁 - 设置/关闭
import React, { useState } from 'react';
import { Card, Button, Alert, Space, message } from 'antd';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useSettingsStore } from '@/stores/settingsStore';
import { hashPassword } from '@/utils/crypto';
import PasswordLock from '@/components/PasswordLock';

export default function AppLockPage() {
  const { appLocked, appLockPasswordHash, setKV } = useSettingsStore();
  const [open, setOpen] = useState<null | 'set' | 'off'>(null);

  async function onSet(pwd: string) {
    const h = await hashPassword(pwd);
    await setKV('appLockPasswordHash', h);
    message.success('应用锁已开启');
    setOpen(null);
  }
  async function onOff() {
    await setKV('appLockPasswordHash', undefined);
    message.success('应用锁已关闭');
    setOpen(null);
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Alert message="开启后,下次打开应用需要输入密码" type="info" showIcon style={{ marginBottom: 16 }} />
      <Card title={<><LockOutlined /> 应用锁</>}>
        <Space>
          {appLocked ? <>
            <Button danger icon={<UnlockOutlined />} onClick={() => setOpen('off')}>关闭应用锁</Button>
            <Button onClick={() => setOpen('set')}>修改密码</Button>
          </> :
            <Button type="primary" icon={<LockOutlined />} onClick={() => setOpen('set')}>开启应用锁</Button>
          }
        </Space>
      </Card>
      <PasswordLock mode="set" open={open === 'set'} onSuccess={onSet} onClose={() => setOpen(null)} />
      <PasswordLock mode="verify" open={open === 'off'} storedHash={appLockPasswordHash}
        onSuccess={onOff} onClose={() => setOpen(null)} title="验证原密码" />
    </div>
  );
}
