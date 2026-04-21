// 主题换肤页 - 17 款主题切换 + 亮度/模糊调节
import React from 'react';
import { Card, Row, Col, Slider, Divider } from 'antd';
import { CheckCircleFilled } from '@ant-design/icons';
import { THEMES } from '@/config/themes';
import { useSettingsStore } from '@/stores/settingsStore';

export default function ThemeSkinPage() {
  const { theme, brightness, blur, setTheme, setBrightness, setBlur } = useSettingsStore();

  return (
    <div>
      <h3>选择主题</h3>
      <Row gutter={[16, 16]}>
        {THEMES.map(t => (
          <Col key={t.key} span={6}>
            <Card hoverable onClick={() => setTheme(t.key)}
              style={{ cursor: 'pointer', border: theme === t.key ? `2px solid ${t.accent}` : '1px solid #eee' }}
              styles={{ body: { padding: 0, position: 'relative' }}}>
              <div style={{ height: 120, background: `linear-gradient(135deg, ${t.gradient[0]} 0%, ${t.gradient[1]} 100%)` }} />
              <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
                <span>{t.label}</span>
                {theme === t.key && <CheckCircleFilled style={{ color: t.accent }} />}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Divider />
      <h3>视觉调节</h3>
      <div style={{ maxWidth: 500 }}>
        <div style={{ marginBottom: 16 }}>
          <div>亮度: {brightness}%</div>
          <Slider min={30} max={150} value={brightness} onChange={setBrightness} />
        </div>
        <div>
          <div>模糊: {blur}</div>
          <Slider min={0} max={100} value={blur} onChange={setBlur} />
        </div>
      </div>
    </div>
  );
}
