// 桌面小部件页 - Web 版用浮动窗替代真正的桌面嵌入
import React, { useState } from 'react';
import { Alert, Card, Space, Switch, Tag, Typography } from 'antd';
import FloatingReminder from '@/components/FloatingReminder';

export default function DesktopWidgetPage() {
  const [show, setShow] = useState(false);
  return (
    <div style={{ maxWidth: 860 }}>
      <Alert message="浏览器环境无法嵌入真实桌面，当前使用浮动小窗作为替代。" type="info" showIcon style={{ marginBottom: 16 }} />
      <Card
        bordered={false}
        style={{
          borderRadius: 24,
          background: 'rgba(255,255,255,0.94)'
        }}
      >
        <Typography.Text type="secondary">小组件控制台</Typography.Text>
        <Typography.Title level={4} style={{ margin: '4px 0 12px' }}>
          多主题浮动小组件
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          现在可以在小组件设置里切换多种风格：白天、黑夜、简约、赛博朋克、渐变、复古。颜色会随着主题一起变化，不再固定为白色。
        </Typography.Paragraph>
        <Space wrap size={[8, 8]} style={{ marginBottom: 14 }}>
          <Tag color="blue">白天</Tag>
          <Tag color="purple">黑夜</Tag>
          <Tag>简约</Tag>
          <Tag color="cyan">赛博朋克</Tag>
          <Tag color="magenta">渐变</Tag>
          <Tag color="gold">复古</Tag>
        </Space>
        <div>
          <Switch checked={show} onChange={setShow} checkedChildren="显示" unCheckedChildren="隐藏" />
          <span style={{ marginLeft: 12, color: '#64748b' }}>显示后可在页面上拖动浮动小窗，并打开设置面板切换主题。</span>
        </div>
      </Card>
      <Card
        bordered={false}
        style={{
          marginTop: 16,
          borderRadius: 24,
          background: 'rgba(255,255,255,0.94)'
        }}
      >
        <Typography.Text type="secondary">使用建议</Typography.Text>
        <Typography.Title level={4} style={{ margin: '4px 0 12px' }}>
          让小组件跟着场景切换
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          白天适合轻亮主题，夜间适合深色主题；如果你更喜欢强风格，可以直接切到赛博朋克或复古。
        </Typography.Paragraph>
      </Card>
      {show && <FloatingReminder onClose={() => setShow(false)} />}
    </div>
  );
}
