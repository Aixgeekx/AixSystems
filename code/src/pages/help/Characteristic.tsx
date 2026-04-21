// 特色功能 - 宣传页
import React from 'react';
import { Card, Row, Col, Typography, Tag, Space } from 'antd';
import * as Icons from '@ant-design/icons';

const { Title, Paragraph } = Typography;

const FEATURES = [
  { name: '记忆曲线重复',    tag: '独家',   icon: 'BulbOutlined',     desc: '基于艾宾浩斯遗忘曲线 1/2/4/7/15/30 天间隔自动提醒,学生党最爱。' },
  { name: '17 种事项类型',   tag: '完整',   icon: 'AppstoreOutlined', desc: '从日程/清单到生理期/贷款/课程表,一个 App 管全部。' },
  { name: '双历提醒',         tag: '本土化', icon: 'CalendarOutlined', desc: '农历+阳历自动切换,春节/端午/生日一个都不漏。' },
  { name: '严格专注模式',    tag: '自律向', icon: 'FireOutlined',     desc: '开启后无法暂停与提前结束,逼自己专心。' },
  { name: '日记加密',         tag: '隐私',   icon: 'LockOutlined',     desc: '单条加密 + 整体锁,双重保护私密内容。' },
  { name: '17 款主题壁纸',   tag: '美观',   icon: 'SkinOutlined',     desc: '亮度/模糊自由调,随心情换风格。' },
  { name: '浮动桌面小部件', tag: 'PWA',    icon: 'DesktopOutlined',  desc: '拖拽浮动窗,随时查看今日事项。' },
  { name: '本地零依赖',      tag: '离线',   icon: 'CloudOutlined',    desc: '所有数据存在本机 IndexedDB,断网也能用。' }
];

export default function CharacteristicPage() {
  return (
    <div style={{ maxWidth: 1100 }}>
      <Typography><Title level={3}>特色功能</Title><Paragraph type="secondary">AixSystems 最具差异化的 8 个能力。</Paragraph></Typography>
      <Row gutter={[16, 16]}>
        {FEATURES.map((f, i) => {
          const I = (Icons as any)[f.icon];
          return (
            <Col key={i} span={12}>
              <Card size="small">
                <Space align="start">
                  {I && <I style={{ fontSize: 32, color: '#fa541c', marginRight: 12 }} />}
                  <div style={{ flex: 1 }}>
                    <Space><strong style={{ fontSize: 16 }}>{f.name}</strong><Tag color="orange">{f.tag}</Tag></Space>
                    <div style={{ color: '#666', marginTop: 6 }}>{f.desc}</div>
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
