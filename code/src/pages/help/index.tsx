// 帮助中心 - 静态内容
import React from 'react';
import { Card, Collapse, Typography } from 'antd';

const { Title, Paragraph } = Typography;

const FAQ = [
  { q: '数据存储在哪里?', a: '所有数据存储在浏览器的 IndexedDB 中,不会上传到任何服务器。清除浏览器数据会丢失,请通过"导入导出"页面定期备份。' },
  { q: '如何开启提醒?', a: '首次添加事项时浏览器会询问通知权限,允许即可。也可在"系统设置→通知"手动开启。' },
  { q: '支持哪些事项类型?', a: '共 17 种: 日程/清单/生日/纪念日/倒数日/节日/生理期/信用卡还款/贷款/吃药/起床闹钟/睡眠闹钟/作息/跑步/读书/穿衣搭配/课程表/上班打卡。' },
  { q: '什么是记忆曲线重复?', a: '基于艾宾浩斯遗忘曲线的智能复习间隔: 1/2/4/7/15/30 天后分别提醒,适合学生复习使用。' },
  { q: '如何更换主题?', a: '左侧菜单 → 主题换肤,共 17 款主题可选,支持亮度和模糊度调节。' },
  { q: '严格专注模式是什么?', a: '开启后无法暂停或提前结束专注,用于强化自律。' }
];

export default function HelpPage() {
  return (
    <div style={{ maxWidth: 900 }}>
      <Typography>
        <Title level={3}>帮助中心</Title>
        <Paragraph type="secondary">AixSystems 时间管理系统 · 离线本地版。</Paragraph>
      </Typography>
      <Card>
        <Collapse items={FAQ.map((f, i) => ({ key: i, label: f.q, children: <Paragraph>{f.a}</Paragraph> }))} />
      </Card>
    </div>
  );
}
