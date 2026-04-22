// 主题换肤页 - 17 款主题切换 + 亮度/模糊调节
import React from 'react';
import { Card, Col, Row, Slider, Space, Statistic, Tag, Typography } from 'antd';
import { CheckCircleFilled, HighlightOutlined, BgColorsOutlined } from '@ant-design/icons';
import { THEMES } from '@/config/themes';
import { useSettingsStore } from '@/stores/settingsStore';

export default function ThemeSkinPage() {
  const { theme, brightness, blur, setTheme, setBrightness, setBlur } = useSettingsStore();
  const currentTheme = THEMES.find(item => item.key === theme) || THEMES[0];

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${currentTheme.gradient[0]} 0%, ${currentTheme.gradient[1]} 100%)`,
          boxShadow: `0 28px 60px ${currentTheme.accent}26`
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.82)' }}>主题工作台</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff' }}>
              把界面调成你愿意长期打开的样子
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(255,255,255,0.84)' }}>
              当前主题是「{currentTheme.label}」，可以继续微调背景亮度和模糊，让整套界面更贴合你的使用环境。
            </Typography.Paragraph>
            <Space wrap size={8}>
              <Tag color="blue">当前主题 {currentTheme.label}</Tag>
              <Tag color="green">亮度 {brightness}%</Tag>
              <Tag color="gold">模糊 {blur}</Tag>
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)' }}>
                  <Statistic title="主题数" value={THEMES.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={12}>
                <Card bordered={false} style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)' }}>
                  <Statistic title="主色" value={currentTheme.accent} valueStyle={{ color: '#fff', fontSize: 16 }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
        <Typography.Text type="secondary">选择主题</Typography.Text>
        <Typography.Title level={4} style={{ margin: '4px 0 16px' }}>17 款内置风格</Typography.Title>
        <Row gutter={[16, 16]}>
          {THEMES.map(item => (
            <Col key={item.key} xs={24} sm={12} lg={8} xl={6}>
              <button
                type="button"
                onClick={() => setTheme(item.key)}
                style={{
                  width: '100%',
                  border: theme === item.key ? `2px solid ${item.accent}` : '1px solid rgba(148,163,184,0.16)',
                  borderRadius: 22,
                  padding: 0,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: '#fff',
                  boxShadow: theme === item.key ? `0 18px 36px ${item.accent}24` : '0 10px 24px rgba(15,23,42,0.06)'
                }}
              >
                <div style={{ height: 128, background: `linear-gradient(135deg, ${item.gradient[0]} 0%, ${item.gradient[1]} 100%)` }} />
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{item.accent}</div>
                  </div>
                  {theme === item.key ? <CheckCircleFilled style={{ color: item.accent, fontSize: 18 }} /> : null}
                </div>
              </button>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Typography.Title level={4} style={{ margin: 0 }}><HighlightOutlined /> 亮度调节</Typography.Title>
              <Typography.Text type="secondary">高亮房间和夜晚使用的观感差别很大，建议按环境微调。</Typography.Text>
              <Slider min={30} max={150} value={brightness} onChange={setBrightness} />
              <Tag color="blue">当前亮度 {brightness}%</Tag>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.94)' }}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Typography.Title level={4} style={{ margin: 0 }}><BgColorsOutlined /> 模糊调节</Typography.Title>
              <Typography.Text type="secondary">适度模糊能让前景更聚焦，过高则会削弱主题的层次感。</Typography.Text>
              <Slider min={0} max={100} value={blur} onChange={setBlur} />
              <Tag color="purple">当前模糊 {blur}</Tag>
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
