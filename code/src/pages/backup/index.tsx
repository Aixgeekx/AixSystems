// 数据备份中心 - 本地备份状态与历史
import React, { useEffect, useState } from 'react';
import { Button, Card, Col, List, Progress, Row, Space, Tag, Typography, message } from 'antd';
import { CloudDownloadOutlined, CloudUploadOutlined, DatabaseOutlined, DeleteOutlined, DownloadOutlined, FileTextOutlined, HistoryOutlined, SafetyCertificateOutlined, SyncOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { downloadBackup } from '@/utils/export';
import { fmtDateTime } from '@/utils/time';
import { getElectron, isElectron } from '@/utils/electron';
import { useThemeVariants } from '@/hooks/useVariants';

export default function BackupPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const electron = isElectron();
  const [diskStats, setDiskStats] = useState<{ root: string; total: number; free: number; used: number } | null>(null);
  const [backing, setBacking] = useState(false);

  const backupMeta = useLiveQuery(() => db.cacheKv.get('lastBackupMeta'));
  const tableStats = useLiveQuery(async () => {
    const tables = [
      { name: '事项', table: db.items },
      { name: '日记', table: db.diaries },
      { name: '备忘录', table: db.memos },
      { name: '专注', table: db.focusSessions },
      { name: '习惯', table: db.habits },
      { name: '目标', table: db.goals },
      { name: '提醒', table: db.reminderQueue }
    ];
    const results = await Promise.all(tables.map(async t => ({ name: t.name, count: await t.table.count() })));
    return results;
  });

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  useEffect(() => {
    if (electron) getElectron()?.getStorageStats().then(setDiskStats).catch(() => setDiskStats(null));
  }, [electron]);

  const handleBackup = async () => {
    setBacking(true);
    try {
      await downloadBackup();
      message.success('备份已下载');
    } catch { message.error('备份失败'); }
    finally { setBacking(false); }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes < 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let v = bytes; let i = 0;
    while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
    return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
  };

  const totalRecords = tableStats?.reduce((s, t) => s + t.count, 0) || 0;
  const lastBackupTime = backupMeta?.value?.timestamp ? fmtDateTime(backupMeta.value.timestamp) : '尚未备份';
  const lastBackupSize = backupMeta?.value?.size ? formatBytes(backupMeta.value.size) : '-';

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : 'linear-gradient(135deg, #0ea5e9, #2563eb 52%, #0f172a)',
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(14,165,233,0.18)'
      }} bodyStyle={{ padding: 22 }}>
        <Row gutter={[18, 18]} align="middle">
          <Col xs={24} lg={16}>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><DatabaseOutlined /> 数据备份中心</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 8px', color: '#fff' }}>本地数据保护</Typography.Title>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>所有数据保存在本地 IndexedDB，定期备份防止数据丢失。</Typography.Text>
          </Col>
          <Col xs={24} lg={8}>
            <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button type="primary" icon={<DownloadOutlined />} loading={backing} onClick={handleBackup} style={{ borderRadius: 12 }}>立即备份</Button>
              {electron && <Button icon={<CloudUploadOutlined />} style={{ borderRadius: 12 }}>恢复备份</Button>}
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Typography.Title level={4} style={{ margin: 0, color: titleColor }}><SafetyCertificateOutlined /> 备份状态</Typography.Title>
              <div style={{ borderRadius: 18, padding: 14, background: isDark ? `${accent}12` : '#eff6ff' }}>
                <Typography.Text style={{ color: subColor }}>最近备份</Typography.Text>
                <Typography.Title level={5} style={{ margin: '4px 0 0', color: titleColor }}>{lastBackupTime}</Typography.Title>
              </div>
              <div style={{ borderRadius: 18, padding: 14, background: isDark ? 'rgba(34,197,94,0.1)' : '#ecfdf5' }}>
                <Typography.Text style={{ color: subColor }}>备份大小</Typography.Text>
                <Typography.Title level={5} style={{ margin: '4px 0 0', color: titleColor }}>{lastBackupSize}</Typography.Title>
              </div>
              <div style={{ borderRadius: 18, padding: 14, background: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb' }}>
                <Typography.Text style={{ color: subColor }}>总记录数</Typography.Text>
                <Typography.Title level={5} style={{ margin: '4px 0 0', color: titleColor }}>{totalRecords} 条</Typography.Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><FileTextOutlined /> 数据表统计</Typography.Title>
            <List
              dataSource={tableStats || []}
              renderItem={item => (
                <List.Item style={{ paddingInline: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Typography.Text style={{ color: titleColor, fontWeight: 600 }}>{item.name}</Typography.Text>
                    <Tag color="blue" style={{ borderRadius: 999 }}>{item.count} 条</Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {diskStats && (
        <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><HistoryOutlined /> 磁盘状态</Typography.Title>
          <Row gutter={[16, 16]}>
            {[
              { label: '磁盘总量', value: formatBytes(diskStats.total), color: '#3b82f6' },
              { label: '已使用', value: formatBytes(diskStats.used), color: '#ef4444' },
              { label: '可用空间', value: formatBytes(diskStats.free), color: '#22c55e' }
            ].map(item => (
              <Col xs={24} md={8} key={item.label}>
                <div style={{ borderRadius: 18, padding: 16, background: isDark ? `${item.color}14` : `${item.color}0f`, border: `1px solid ${item.color}22` }}>
                  <Typography.Text style={{ color: subColor }}>{item.label}</Typography.Text>
                  <Typography.Title level={4} style={{ margin: '4px 0 0', color: item.color }}>{item.value}</Typography.Title>
                </div>
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </Space>
  );
}
