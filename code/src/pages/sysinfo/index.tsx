// 系统信息 - 应用与环境信息展示
import React, { useEffect, useState } from 'react';
import { Card, Col, Descriptions, Row, Space, Tag, Typography } from 'antd';
import { AppstoreOutlined, DesktopOutlined, GlobalOutlined, InfoCircleOutlined, MobileOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useThemeVariants } from '@/hooks/useVariants';
import { getElectron, isElectron } from '@/utils/electron';
import { APP_NAME, APP_VERSION, DB_NAME, DB_VERSION } from '@/config/constants';

export default function SysInfoPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const electron = isElectron();
  const [systemSnapshot, setSystemSnapshot] = useState<any>(null);

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  useEffect(() => {
    if (electron) getElectron()?.getSystemSnapshot().then(setSystemSnapshot).catch(() => {});
  }, [electron]);

  const appInfo = [
    { label: '应用名称', children: APP_NAME },
    { label: '版本号', children: `v${APP_VERSION}` },
    { label: '数据库', children: `${DB_NAME} v${DB_VERSION}` },
    { label: '运行模式', children: electron ? 'Electron 桌面' : '浏览器' },
    { label: '主题', children: theme.label || theme.key },
    { label: '用户代理', children: navigator.userAgent.slice(0, 80) + '...' }
  ];

  const envInfo = [
    { label: '平台', children: systemSnapshot?.platform || navigator.platform },
    { label: '架构', children: systemSnapshot?.arch || '-' },
    { label: 'CPU', children: systemSnapshot?.cpuModel || '-' },
    { label: 'CPU 核心', children: systemSnapshot ? `${systemSnapshot.cpuCores} 核` : '-' },
    { label: '总内存', children: systemSnapshot ? `${Math.round(systemSnapshot.totalMem / 1024 / 1024 / 1024)} GB` : '-' },
    { label: '可用内存', children: systemSnapshot ? `${Math.round(systemSnapshot.freeMem / 1024 / 1024 / 1024)} GB` : '-' },
    { label: '运行时间', children: systemSnapshot ? `${Math.round(systemSnapshot.uptime / 3600)} 小时` : '-' }
  ];

  const features = [
    { name: '本地存储', status: 'ok', desc: 'IndexedDB 完全离线' },
    { name: 'Electron 桥', status: electron ? 'ok' : 'disabled', desc: electron ? '已连接' : '浏览器模式' },
    { name: '通知权限', status: typeof Notification !== 'undefined' && Notification.permission === 'granted' ? 'ok' : 'warning', desc: typeof Notification !== 'undefined' ? Notification.permission : '不可用' },
    { name: 'Service Worker', status: 'serviceWorker' in navigator ? 'ok' : 'disabled', desc: 'serviceWorker' in navigator ? '支持' : '不支持' }
  ];

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : 'linear-gradient(135deg, #6366f1, #4f46e5 52%, #0f172a)',
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(99,102,241,0.18)'
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><InfoCircleOutlined /> 系统信息</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 8px', color: '#fff' }}>{APP_NAME} v{APP_VERSION}</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>离线本地时间管理系统 · 零服务器依赖</Typography.Text>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><AppstoreOutlined /> 应用信息</Typography.Title>
            <Descriptions column={1} size="small" items={appInfo.map(item => ({ label: <span style={{ color: subColor }}>{item.label}</span>, children: <span style={{ color: titleColor }}>{item.children}</span> }))} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><DesktopOutlined /> 环境信息</Typography.Title>
            <Descriptions column={1} size="small" items={envInfo.map(item => ({ label: <span style={{ color: subColor }}>{item.label}</span>, children: <span style={{ color: titleColor }}>{item.children}</span> }))} />
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><SafetyCertificateOutlined /> 功能支持</Typography.Title>
        <Row gutter={[16, 16]}>
          {features.map(f => (
            <Col xs={12} md={6} key={f.name}>
              <div style={{ borderRadius: 18, padding: 16, textAlign: 'center', background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: `1px solid ${f.status === 'ok' ? '#22c55e33' : f.status === 'warning' ? '#f59e0b33' : '#94a3b833'}` }}>
                <Tag color={f.status === 'ok' ? 'success' : f.status === 'warning' ? 'warning' : 'default'} style={{ borderRadius: 999, marginBottom: 8 }}>{f.status === 'ok' ? '正常' : f.status === 'warning' ? '注意' : '禁用'}</Tag>
                <Typography.Text style={{ display: 'block', color: titleColor, fontWeight: 600 }}>{f.name}</Typography.Text>
                <Typography.Text style={{ color: subColor, fontSize: 12 }}>{f.desc}</Typography.Text>
              </div>
            </Col>
          ))}
        </Row>
      </Card>
    </Space>
  );
}
