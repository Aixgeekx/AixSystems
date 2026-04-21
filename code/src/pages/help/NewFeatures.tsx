// 新功能 - 更新日志
import React from 'react';
import { Timeline, Card, Typography, Tag } from 'antd';

const { Title, Paragraph } = Typography;

const UPDATES = [
  { ver: '0.1.0', date: '2026-04-21', items: [
    '完成 P0+P1 基础框架: 17 种事项类型 / 4 种视图 / 重复规则引擎 / 提醒系统',
    '17 款主题壁纸 + 亮度模糊调节',
    '日记 / 备忘录 / 番茄钟基础能力',
    '分类管理 / 回收站 / JSON 导入导出',
    '快捷键 (Ctrl+N/K/B/,//) 与浮动小部件'
  ]},
  { ver: '0.0.1', date: '2026-04-21', items: ['项目初始化'] }
];

export default function NewFeaturesPage() {
  return (
    <div style={{ maxWidth: 800 }}>
      <Typography><Title level={3}>更新日志</Title><Paragraph type="secondary">AixSystems 迭代记录。</Paragraph></Typography>
      <Card>
        <Timeline items={UPDATES.map(u => ({
          children: <div>
            <Tag color="blue">v{u.ver}</Tag><span style={{ color: '#888' }}>{u.date}</span>
            <ul style={{ marginTop: 8 }}>{u.items.map((it, i) => <li key={i}>{it}</li>)}</ul>
          </div>
        }))} />
      </Card>
    </div>
  );
}
