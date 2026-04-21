// 密码锁 - 设置/输入/验证,用 crypto.ts 派生 hash
import React, { useState } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { hashPassword } from '@/utils/crypto';

interface Props {
  mode: 'set' | 'verify';
  open: boolean;
  storedHash?: string;
  onSuccess: (pwd: string) => void;
  onClose: () => void;
  title?: string;
}

export default function PasswordLock({ mode, open, storedHash, onSuccess, onClose, title }: Props) {
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');

  async function submit() {
    if (!pwd) return message.warning('请输入密码');
    if (mode === 'set') {
      if (pwd !== confirm) return message.error('两次密码输入不一致');
      if (pwd.length < 4) return message.warning('密码至少 4 位');
      onSuccess(pwd);
      setPwd(''); setConfirm('');
    } else {
      const h = await hashPassword(pwd);
      if (h === storedHash) { onSuccess(pwd); setPwd(''); }
      else message.error('密码不正确');
    }
  }

  return (
    <Modal title={title || (mode === 'set' ? '设置密码' : '输入密码')} open={open} onCancel={onClose}
      footer={[<Button key="c" onClick={onClose}>取消</Button>, <Button key="o" type="primary" onClick={submit}>确定</Button>]}>
      <Input.Password value={pwd} onChange={e => setPwd(e.target.value)} placeholder="请输入密码" autoFocus />
      {mode === 'set' && <Input.Password value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="再次输入密码" style={{ marginTop: 12 }} />}
    </Modal>
  );
}
