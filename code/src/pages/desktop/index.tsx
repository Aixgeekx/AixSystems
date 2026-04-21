// 桌面小部件页 - Web 版用浮动窗替代真正的桌面嵌入
import React, { useState } from 'react';
import { Card, Button, Alert, Switch } from 'antd';
import FloatingReminder from '@/components/FloatingReminder';

export default function DesktopWidgetPage() {
  const [show, setShow] = useState(false);
  return (
    <div style={{ maxWidth: 700 }}>
      <Alert message="浏览器环境无法嵌入真实桌面,使用浮动提醒窗作为替代" type="info" showIcon style={{ marginBottom: 16 }} />
      <Card title="桌面小部件 (浮动窗)">
        <Switch checked={show} onChange={setShow} checkedChildren="显示" unCheckedChildren="隐藏" />
        <span style={{ marginLeft: 12, color: '#888' }}>显示后可在页面上拖动浮动小窗</span>
      </Card>
      {show && <FloatingReminder onClose={() => setShow(false)} />}
    </div>
  );
}
