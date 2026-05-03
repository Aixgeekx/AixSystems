// 数据迁移助手 - 本地数据迁移与同步
import React, { useState } from 'react';
import { Button, Card, Col, List, Progress, Row, Space, Steps, Tag, Typography, message } from 'antd';
import { CheckCircleOutlined, CloudDownloadOutlined, CloudUploadOutlined, DatabaseOutlined, FileTextOutlined, MobileOutlined, SafetyCertificateOutlined, SyncOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '@/db';
import { downloadBackup } from '@/utils/export';
import { useThemeVariants } from '@/hooks/useVariants';

export default function MigrationPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const [currentStep, setCurrentStep] = useState(0);
  const [exporting, setExporting] = useState(false);

  const tableStats = useLiveQuery(async () => {
    const tables = [
      { name: '事项', table: db.items, icon: '📋' },
      { name: '日记', table: db.diaries, icon: '📝' },
      { name: '备忘录', table: db.memos, icon: '📄' },
      { name: '专注记录', table: db.focusSessions, icon: '⏱️' },
      { name: '习惯', table: db.habits, icon: '✅' },
      { name: '目标', table: db.goals, icon: '🎯' },
      { name: '提醒队列', table: db.reminderQueue, icon: '🔔' },
      { name: '设置', table: db.settings, icon: '⚙️' }
    ];
    return Promise.all(tables.map(async t => ({ ...t, count: await t.table.count() })));
  });

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const totalRecords = tableStats?.reduce((s, t) => s + t.count, 0) || 0;

  const steps = [
    { title: '准备', desc: '检查数据完整性' },
    { title: '导出', desc: '生成迁移包' },
    { title: '传输', desc: '复制到目标设备' },
    { title: '导入', desc: '在新设备恢复' }
  ];

  const handleExport = async () => {
    setExporting(true);
    try {
      await downloadBackup();
      message.success('迁移包已导出');
      setCurrentStep(2);
    } catch { message.error('导出失败'); }
    finally { setExporting(false); }
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : 'linear-gradient(135deg, #10b981, #059669 52%, #0f172a)',
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(16,185,129,0.18)'
      }} bodyStyle={{ padding: 22 }}>
        <Row gutter={[18, 18]} align="middle">
          <Col xs={24} lg={16}>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><MobileOutlined /> 数据迁移助手</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 8px', color: '#fff' }}>换机迁移</Typography.Title>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>把本地数据安全迁移到新设备，全程离线不经过云端。</Typography.Text>
          </Col>
          <Col xs={24} lg={8}>
            <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button type="primary" icon={<CloudDownloadOutlined />} loading={exporting} onClick={handleExport} style={{ borderRadius: 12 }}>导出迁移包</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Title level={4} style={{ margin: '0 0 24px', color: titleColor }}><SyncOutlined /> 迁移步骤</Typography.Title>
        <Steps current={currentStep} items={steps.map(s => ({ title: <span style={{ color: titleColor }}>{s.title}</span>, description: <span style={{ color: subColor }}>{s.desc}</span> }))} />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><DatabaseOutlined /> 数据概览</Typography.Title>
            <div style={{ borderRadius: 18, padding: 16, background: isDark ? `${accent}12` : '#eff6ff', marginBottom: 16 }}>
              <Typography.Text style={{ color: subColor }}>总记录数</Typography.Text>
              <Typography.Title level={3} style={{ margin: '4px 0 0', color: titleColor }}>{totalRecords} 条</Typography.Title>
            </div>
            <List
              dataSource={tableStats || []}
              renderItem={item => (
                <List.Item style={{ paddingInline: 0 }}>
                  <Space>
                    <span>{item.icon}</span>
                    <Typography.Text style={{ color: titleColor }}>{item.name}</Typography.Text>
                  </Space>
                  <Tag color="blue" style={{ borderRadius: 999 }}>{item.count}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Typography.Title level={4} style={{ margin: '0 0 16px', color: titleColor }}><SafetyCertificateOutlined /> 迁移说明</Typography.Title>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {[
                { title: '完全离线', desc: '数据通过本地文件传输，不经过任何服务器。', color: '#22c55e' },
                { title: '全量备份', desc: '导出包含所有事项、日记、备忘录和设置。', color: '#3b82f6' },
                { title: '新设备恢复', desc: '在新设备安装后导入 JSON 即可恢复全部数据。', color: '#8b5cf6' },
                { title: '版本兼容', desc: '建议在相同或更高版本的应用上恢复。', color: '#f59e0b' }
              ].map(item => (
                <div key={item.title} style={{ borderRadius: 16, padding: 14, background: isDark ? `${item.color}14` : `${item.color}0f`, border: `1px solid ${item.color}22` }}>
                  <Typography.Text style={{ color: titleColor, fontWeight: 600 }}>{item.title}</Typography.Text>
                  <Typography.Paragraph style={{ margin: '4px 0 0', color: subColor, marginBottom: 0 }}>{item.desc}</Typography.Paragraph>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
