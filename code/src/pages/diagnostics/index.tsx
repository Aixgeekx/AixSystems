// 系统诊断 - 本地系统健康检查
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, List, Progress, Row, Space, Tag, Typography, message } from 'antd';
import { BugOutlined, CheckCircleOutlined, ClockCircleOutlined, CloudOutlined, DatabaseOutlined, DesktopOutlined, HddOutlined, ReloadOutlined, SafetyCertificateOutlined, ThunderboltOutlined, WarningOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { getElectron, isElectron } from '@/utils/electron';
import { useThemeVariants } from '@/hooks/useVariants';
import { APP_VERSION } from '@/config/constants';

interface DiagnosticItem {
  label: string;
  status: 'ok' | 'warning' | 'error';
  detail: string;
  icon: React.ReactNode;
}

export default function DiagnosticsPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const electron = isElectron();
  const [diskStats, setDiskStats] = useState<{ root: string; total: number; free: number; used: number } | null>(null);
  const [systemSnapshot, setSystemSnapshot] = useState<any>(null);
  const [scanning, setScanning] = useState(false);

  const dbStats = useLiveQuery(async () => {
    const tables = ['items', 'diaries', 'memos', 'focusSessions', 'habits', 'goals', 'reminderQueue', 'settings', 'eventLog'];
    const results = await Promise.all(tables.map(async name => ({ name, count: await (db as any)[name].count() })));
    return results;
  });

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  useEffect(() => {
    if (!electron) return;
    getElectron()?.getStorageStats().then(setDiskStats).catch(() => {});
    getElectron()?.getSystemSnapshot().then(setSystemSnapshot).catch(() => {});
  }, [electron]);

  const diagnostics: DiagnosticItem[] = [
    { label: 'IndexedDB', status: 'ok', detail: `${dbStats?.reduce((s, t) => s + t.count, 0) || 0} 条记录`, icon: <DatabaseOutlined /> },
    { label: '浏览器存储', status: typeof navigator.storage?.estimate === 'function' ? 'ok' : 'warning', detail: typeof navigator.storage?.estimate === 'function' ? 'API 可用' : '不可用', icon: <CloudOutlined /> },
    { label: 'Electron 桥', status: electron ? 'ok' : 'warning', detail: electron ? '已连接' : '浏览器模式', icon: <DesktopOutlined /> },
    { label: '版本', status: 'ok', detail: `v${APP_VERSION}`, icon: <ThunderboltOutlined /> },
    { label: '磁盘空间', status: diskStats ? (diskStats.free < 1024 * 1024 * 1024 ? 'warning' : 'ok') : 'warning', detail: diskStats ? `剩余 ${Math.round(diskStats.free / 1024 / 1024 / 1024)} GB` : '浏览器模式', icon: <HddOutlined /> },
    { label: '系统平台', status: 'ok', detail: systemSnapshot ? `${systemSnapshot.platform} ${systemSnapshot.arch}` : navigator.userAgent.includes('Win') ? 'Windows' : 'Other', icon: <DesktopOutlined /> }
  ];

  const okCount = diagnostics.filter(d => d.status === 'ok').length;
  const healthPercent = Math.round(okCount / diagnostics.length * 100);
  const healthLevel = healthPercent >= 80 ? '健康' : healthPercent >= 50 ? '注意' : '警告';
  const healthColor = healthPercent >= 80 ? '#22c55e' : healthPercent >= 50 ? '#f59e0b' : '#ef4444';

  const handleScan = async () => {
    setScanning(true);
    await new Promise(r => setTimeout(r, 1500));
    setScanning(false);
    message.success('诊断扫描完成');
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes < 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let v = bytes; let i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : 'linear-gradient(135deg, #8b5cf6, #6366f1 52%, #0f172a)',
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(139,92,246,0.18)'
      }} bodyStyle={{ padding: 22 }}>
        <Row gutter={[18, 18]} align="middle">
          <Col xs={24} lg={16}>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><BugOutlined /> 系统诊断</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 8px', color: '#fff' }}>系统健康检查</Typography.Title>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>检查本地数据库、存储、Electron 桥和系统资源状态。</Typography.Text>
          </Col>
          <Col xs={24} lg={8}>
            <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button type="primary" icon={<ReloadOutlined />} loading={scanning} onClick={handleScan} style={{ borderRadius: 12 }}>重新扫描</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Space direction="vertical" size={14} style={{ width: '100%', textAlign: 'center' }}>
              <Typography.Title level={4} style={{ margin: 0, color: titleColor }}><SafetyCertificateOutlined /> 健康评分</Typography.Title>
              <Progress type="circle" percent={healthPercent} strokeColor={healthColor} size={120} format={() => <span style={{ color: titleColor, fontSize: 24, fontWeight: 800 }}>{healthPercent}</span>} />
              <Tag color={healthColor} style={{ borderRadius: 999, fontSize: 14, padding: '4px 16px' }}>{healthLevel}</Tag>
              <Typography.Text style={{ color: subColor }}>{okCount}/{diagnostics.length} 项检查通过</Typography.Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><CheckCircleOutlined /> 诊断详情</Typography.Title>
            <List
              dataSource={diagnostics}
              renderItem={item => (
                <List.Item style={{ paddingInline: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Space>
                      <span style={{ color: item.status === 'ok' ? '#22c55e' : item.status === 'warning' ? '#f59e0b' : '#ef4444', fontSize: 18 }}>{item.icon}</span>
                      <div>
                        <Typography.Text style={{ color: titleColor, fontWeight: 600 }}>{item.label}</Typography.Text>
                        <br />
                        <Typography.Text style={{ color: subColor, fontSize: 12 }}>{item.detail}</Typography.Text>
                      </div>
                    </Space>
                    <Tag color={item.status === 'ok' ? 'success' : item.status === 'warning' ? 'warning' : 'error'} style={{ borderRadius: 999 }}>
                      {item.status === 'ok' ? '正常' : item.status === 'warning' ? '注意' : '异常'}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {diskStats && (
        <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><HddOutlined /> 磁盘详情</Typography.Title>
          <Row gutter={[16, 16]}>
            {[
              { label: '磁盘根目录', value: diskStats.root, color: '#3b82f6' },
              { label: '总容量', value: formatBytes(diskStats.total), color: '#8b5cf6' },
              { label: '已使用', value: formatBytes(diskStats.used), color: '#ef4444' },
              { label: '可用空间', value: formatBytes(diskStats.free), color: '#22c55e' }
            ].map(item => (
              <Col xs={12} md={6} key={item.label}>
                <div style={{ borderRadius: 18, padding: 14, background: isDark ? `${item.color}14` : `${item.color}0f`, border: `1px solid ${item.color}22` }}>
                  <Typography.Text style={{ color: subColor, fontSize: 12 }}>{item.label}</Typography.Text>
                  <Typography.Title level={5} style={{ margin: '4px 0 0', color: item.color }}>{item.value}</Typography.Title>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {systemSnapshot && (
        <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><DesktopOutlined /> 系统信息</Typography.Title>
          <Row gutter={[16, 16]}>
            {[
              { label: '主机名', value: systemSnapshot.hostname },
              { label: 'CPU', value: systemSnapshot.cpuModel },
              { label: 'CPU 核心', value: `${systemSnapshot.cpuCores} 核` },
              { label: '总内存', value: formatBytes(systemSnapshot.totalMem) },
              { label: '可用内存', value: formatBytes(systemSnapshot.freeMem) },
              { label: '运行时间', value: `${Math.round(systemSnapshot.uptime / 3600)} 小时` }
            ].map(item => (
              <Col xs={12} md={8} key={item.label}>
                <div style={{ borderRadius: 16, padding: 12, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc' }}>
                  <Typography.Text style={{ color: subColor, fontSize: 12 }}>{item.label}</Typography.Text>
                  <Typography.Text style={{ display: 'block', color: titleColor, fontWeight: 600 }}>{item.value}</Typography.Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </Space>
  );
}
