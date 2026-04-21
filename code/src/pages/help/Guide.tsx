// 新手引导 - 功能介绍卡片
import React from 'react';
import { Card, Row, Col, Typography, Space } from 'antd';
import * as Icons from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const STEPS = [
  { icon: 'PlusCircle', title: '快速添加事项', desc: '右上角「添加事项」或 Ctrl+N 即可新建。支持 17 种类型,按你的场景选择。' },
  { icon: 'Calendar',   title: '多视图查看',   desc: '我的一天/一周/一月/一年四种视图,从细到粗随时切换。' },
  { icon: 'Reload',     title: '智能重复',     desc: '支持每天/每周/每月/每年/工作日/记忆曲线等重复模式。' },
  { icon: 'Bell',       title: '提醒机制',     desc: '单条事项最多设置 5 个提醒,到时浏览器会自动弹窗通知。' },
  { icon: 'Appstore',   title: '四象限管理',   desc: '按重要紧急程度分 4 格,拖拽即可分配优先级。' },
  { icon: 'Fire',       title: '专注计时',     desc: '倒计时/正计时/番茄钟三种模式,严格模式禁止暂停。' },
  { icon: 'Lock',       title: '隐私保护',     desc: '应用锁 / 日记锁 / 备忘录锁,多级密码保护。' },
  { icon: 'Cloud',      title: '本地存储',     desc: '所有数据存在本机,可 JSON 导出备份,换机无忧。' }
];

export default function GuidePage() {
  return (
    <div style={{ maxWidth: 1100 }}>
      <Typography>
        <Title level={3}>新手引导</Title>
        <Paragraph type="secondary">8 个你需要知道的核心功能。</Paragraph>
      </Typography>
      <Row gutter={[16, 16]}>
        {STEPS.map((s, i) => {
          const I = (Icons as any)[s.icon + 'Outlined'];
          return (
            <Col key={i} span={12}>
              <Card size="small">
                <Space align="start">
                  {I && <I style={{ fontSize: 28, color: '#1677ff', marginRight: 12 }} />}
                  <div>
                    <strong>{s.title}</strong>
                    <div style={{ color: '#666', marginTop: 4 }}>{s.desc}</div>
                  </div>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
