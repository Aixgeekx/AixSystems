// 桌面小部件页 - 工作台风格 (v0.24.0 完善升级)
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Progress, Row, Space, Switch, Tag, Typography } from 'antd';
import { DesktopOutlined, BgColorsOutlined, ControlOutlined, EyeOutlined, SafetyCertificateOutlined, SyncOutlined } from '@ant-design/icons';
import FloatingReminder from '@/components/FloatingReminder';
import { useThemeVariants } from '@/hooks/useVariants';
import { getElectron, isElectron } from '@/utils/electron';

const WIDGET_THEMES = [
  { label: '跟随全局', color: 'default', key: 'global' },
  { label: '白天', color: 'blue', key: 'light' },
  { label: '黑夜', color: 'purple', key: 'dark' },
  { label: '简约', color: 'default', key: 'minimal' },
  { label: '赛博朋克', color: 'cyan', key: 'cyber' },
  { label: '渐变', color: 'magenta', key: 'gradient' },
  { label: '复古', color: 'gold', key: 'retro' }
];

function formatGB(bytes = 0) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function DesktopWidgetPage() {
  const [show, setShow] = useState(false);
  const [snapshot, setSnapshot] = useState<any>(null);
  const { theme, getPanelStyle } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const memUsage = snapshot ? Math.round((1 - snapshot.freeMem / snapshot.totalMem) * 100) : 0;
  const diskUsage = snapshot ? Math.round(snapshot.diskUsed / snapshot.diskTotal * 100) : 0;
  const electron = isElectron();

  async function refreshSnapshot() {
    const next = await getElectron()?.getSystemSnapshot?.();
    if (next) setSnapshot(next);
  }

  useEffect(() => {
    refreshSnapshot();
  }, []);

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(6,182,212,0.94), rgba(14,165,233,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(6,182,212,0.16)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
          <DesktopOutlined /> 小组件
        </Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
          桌面小部件 · 超级管理器中枢
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 0, color: 'rgba(226,232,240,0.84)' }}>
          逐步扩展电脑配置概览、性能监控、隐私清理和工具大全，先以安全只读方式接入桌面原生能力。
        </Typography.Paragraph>
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <SafetyCertificateOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Windows 超级管理器 · 配置概览</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>
          桌面端通过 Electron 安全桥读取电脑基础状态，后续再扩展自启管理、隐私清理、磁盘保护和文件扫描。
        </Typography.Paragraph>
        {electron && snapshot ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <div style={{ padding: 16, borderRadius: 18, background: isDark ? `${accent}12` : `${accent}0d`, border: `1px solid ${accent}22` }}>
                <Typography.Text style={{ color: subColor }}>处理器</Typography.Text>
                <Typography.Title level={5} style={{ margin: '6px 0', color: titleColor }}>{snapshot.cpuModel}</Typography.Title>
                <Tag color="blue">{snapshot.cpuCores} 线程</Tag><Tag>{snapshot.arch}</Tag>
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <div style={{ padding: 16, borderRadius: 18, background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Typography.Text style={{ color: subColor }}>内存占用</Typography.Text>
                <Progress percent={memUsage} strokeColor="#3b82f6" trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} />
                <Typography.Text style={{ color: subColor }}>{formatGB(snapshot.totalMem - snapshot.freeMem)} / {formatGB(snapshot.totalMem)}</Typography.Text>
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <div style={{ padding: 16, borderRadius: 18, background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Typography.Text style={{ color: subColor }}>磁盘占用 · {snapshot.diskRoot}</Typography.Text>
                <Progress percent={diskUsage} strokeColor="#10b981" trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} />
                <Typography.Text style={{ color: subColor }}>{formatGB(snapshot.diskUsed)} / {formatGB(snapshot.diskTotal)}</Typography.Text>
              </div>
            </Col>
          </Row>
        ) : (
          <Alert type="info" showIcon message="浏览器模式仅显示规划。打开桌面版后可读取本机 CPU、内存、磁盘和运行状态。" style={{ borderRadius: 12 }} />
        )}
        <Space wrap style={{ marginTop: 14 }}>
          <Button icon={<SyncOutlined />} onClick={refreshSnapshot} disabled={!electron} style={{ borderRadius: 10 }}>刷新电脑状态</Button>
          {['配置概览', '自启管理', '隐私清理', '磁盘保护', '文件扫描', '工具大全'].map(item => <Tag key={item} color={item === '配置概览' ? 'blue' : 'default'}>{item}</Tag>)}
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} className="anim-fade-in-up stagger-2 hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Space size={8} style={{ marginBottom: 12 }}>
              <ControlOutlined style={{ color: accent }} />
              <Typography.Title level={4} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>小组件控制台</Typography.Title>
            </Space>
            <Typography.Paragraph style={{ color: subColor }}>
              开启后会在页面上显示一个浮动小窗，可以拖动位置并在设置面板中切换主题。
            </Typography.Paragraph>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              borderRadius: 16, background: isDark ? `${accent}0d` : 'rgba(59,130,246,0.06)',
              border: `1px solid ${isDark ? `${accent}18` : 'transparent'}`
            }}>
              <Switch checked={show} onChange={setShow} checkedChildren="显示" unCheckedChildren="隐藏" />
              <Typography.Text style={{ color: isDark ? '#e2e8f0' : '#334155' }}>
                {show ? '小组件已开启，可在页面上拖动' : '点击开关显示浮动小窗'}
              </Typography.Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} className="anim-fade-in-up stagger-3 hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Space size={8} style={{ marginBottom: 12 }}>
              <BgColorsOutlined style={{ color: accent }} />
              <Typography.Title level={4} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>可用主题</Typography.Title>
            </Space>
            <Typography.Paragraph style={{ color: subColor }}>
              小组件支持跟随全局主题或独立切换以下风格：
            </Typography.Paragraph>
            <Space wrap size={[8, 10]}>
              {WIDGET_THEMES.map(t => (
                <Tag key={t.key} color={t.color} style={{
                  borderRadius: 10, padding: '4px 14px', fontSize: 13, cursor: 'default',
                  transition: 'all 0.25s ease'
                }}>
                  {t.label}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="anim-fade-in-up stagger-4" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <EyeOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>使用建议</Typography.Title>
        </Space>
        <Row gutter={[16, 12]}>
          {[
            { tip: '统一视觉', desc: '使用"跟随全局"让小组件始终和主界面保持一致' },
            { tip: '突出显示', desc: '手动切到赛博朋克或渐变让悬浮窗更醒目' },
            { tip: '透明度调节', desc: '在小组件设置面板中拖动滑块调整背景透明度' },
            { tip: '位置记忆', desc: '拖动后小组件会记住位置，下次打开自动还原' }
          ].map((item, i) => (
            <Col xs={24} sm={12} key={i}>
              <div style={{
                padding: '12px 16px', borderRadius: 14,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,252,0.9)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}`
              }}>
                <Typography.Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>{item.tip}</Typography.Text>
                <div style={{ marginTop: 4, color: subColor, fontSize: 12 }}>{item.desc}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {show && <FloatingReminder onClose={() => setShow(false)} />}
    </Space>
  );
}
