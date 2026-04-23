// 系统设置 - 通知 / 启动页 / 快捷键 / 本地环境状态 (v0.21.4 主题适配)
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Divider, Row, Select, Space, Statistic, Tag, Typography, message } from 'antd';
import { CloudDownloadOutlined, DatabaseOutlined, NotificationOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { APP_NAME, APP_VERSION } from '@/config/constants';
import { MENU_GROUPS } from '@/config/routes';
import { useSettingsStore } from '@/stores/settingsStore';
import { db } from '@/db';
import { requestPerm } from '@/utils/notify';
import { getElectron, isElectron } from '@/utils/electron';
import { downloadBackup } from '@/utils/export';
import { fmtDateTime, fmtFromNow } from '@/utils/time';
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';

function formatMB(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function SystemPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const { startPage, setKV } = useSettingsStore();
  const [storageEstimate, setStorageEstimate] = useState<{ usage?: number; quota?: number }>({});
  const [permissionState, setPermissionState] = useState(Notification.permission);
  const electron = isElectron();
  const counts = useLiveQuery(async () => {
    const items = await db.items.count();
    const diaries = await db.diaries.count();
    const memos = await db.memos.count();
    return { items, diaries, memos, total: items + diaries + memos };
  }, []) || { items: 0, diaries: 0, memos: 0, total: 0 };
  const lastBackup = useLiveQuery(() => db.cacheKv.get('lastBackupMeta'), []);

  useEffect(() => {
    navigator.storage?.estimate?.().then(result => {
      setStorageEstimate({ usage: result.usage, quota: result.quota });
    }).catch(() => setStorageEstimate({}));
  }, []);

  async function askPerm() {
    const ok = await requestPerm();
    setPermissionState(Notification.permission);
    message[ok ? 'success' : 'error'](ok ? '已开启通知' : '通知权限被拒绝');
  }

  async function quickBackup() {
    const result = await downloadBackup();
    message[result.ok ? 'success' : 'error'](result.msg);
  }

  const allPages = MENU_GROUPS.flatMap(group => group.children).map(child => ({ value: child.path, label: child.label }));

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        className="anim-fade-in-up"
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(37,99,235,0.9) 46%, rgba(20,184,166,0.88) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(15,23,42,0.16)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(191,219,254,0.9)' }}>本地系统控制台</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
          离线运行、实时存储、简单可迁移
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
          这里集中管理通知、启动页、本地环境和备份状态。所有设置都保存在当前设备，不依赖云端账号。
        </Typography.Paragraph>
        <Space wrap size={8}>
          <Tag color="blue" style={{ background: isDark ? 'rgba(59,130,246,0.2)' : undefined }}>{electron ? 'Electron 桌面版' : '浏览器版'}</Tag>
          <Tag color="green" style={{ background: isDark ? 'rgba(34,197,94,0.2)' : undefined }}>本地离线</Tag>
          <Tag color="gold" style={{ background: isDark ? 'rgba(245,158,11,0.2)' : undefined }}>实时保存</Tag>
          <Tag color="purple" style={{ background: isDark ? 'rgba(168,85,247,0.2)' : undefined }}>可迁移备份</Tag>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 22, background: cardBg, border: cardBorder, transition: 'all 0.3s ease' }}>
            <Statistic title={<span style={{ color: subColor }}>事项</span>} value={counts.items} valueStyle={{ color: titleColor }} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 22, background: cardBg, border: cardBorder, transition: 'all 0.3s ease' }}>
            <Statistic title={<span style={{ color: subColor }}>日记</span>} value={counts.diaries} valueStyle={{ color: titleColor }} prefix={<CloudDownloadOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 22, background: cardBg, border: cardBorder, transition: 'all 0.3s ease' }}>
            <Statistic title={<span style={{ color: subColor }}>备忘录</span>} value={counts.memos} valueStyle={{ color: titleColor }} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 22, background: cardBg, border: cardBorder, transition: 'all 0.3s ease' }}>
            <Statistic title={<span style={{ color: subColor }}>本地总记录</span>} value={counts.total} valueStyle={{ color: titleColor }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Text style={{ color: subColor }}>通知能力</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>本地通知权限</Typography.Title>
            <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
              <Tag color={permissionState === 'granted' ? 'green' : permissionState === 'denied' ? 'red' : 'gold'} style={{ background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>
                {permissionState === 'granted' ? '已授权' : permissionState === 'denied' ? '已拒绝' : '待授权'}
              </Tag>
              <Tag style={{ background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>{electron ? '桌面版' : '浏览器版'}</Tag>
            </Space>
            <Typography.Paragraph style={{ color: subColor }}>
              浏览器通知用于事项到期提醒。桌面版同样依赖本地通知能力，不会经过远程服务器。
            </Typography.Paragraph>
            <Button type="primary" icon={<NotificationOutlined />} onClick={askPerm} style={{ borderRadius: 10, boxShadow: `0 8px 20px -4px ${accent}44` }}>
              开启浏览器通知
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Text style={{ color: subColor }}>启动偏好</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>启动页</Typography.Title>
            <Typography.Paragraph style={{ color: subColor }}>
              修改后会在下次启动或刷新时自动跳转到你选定的首页。
            </Typography.Paragraph>
            <Select
              style={{ width: '100%', borderRadius: 10 }}
              value={startPage}
              onChange={value => setKV('startPage', value)}
              options={allPages}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Text style={{ color: subColor }}>本地备份</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>快速导出</Typography.Title>
            <Typography.Paragraph style={{ color: subColor }}>
              所有核心数据都保存在当前设备。建议在重要修改前先导出一份 JSON 备份。
            </Typography.Paragraph>
            <Space wrap>
              <Button type="primary" onClick={quickBackup} style={{ borderRadius: 10, boxShadow: `0 8px 20px -4px ${accent}44` }}>立即备份</Button>
              {electron ? (
                <Button onClick={() => getElectron()?.openDataDir()} style={{ borderRadius: 10 }}>打开数据目录</Button>
              ) : null}
            </Space>
            {lastBackup?.value?.exportedAt ? (
              <div style={{ marginTop: 14, color: subColor }}>
                最近一次备份: {fmtDateTime(lastBackup.value.exportedAt)} · {fmtFromNow(lastBackup.value.exportedAt)}
              </div>
            ) : null}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Text style={{ color: subColor }}>快捷键</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>高频操作</Typography.Title>
            <Space wrap size={[8, 8]}>
              <Tag style={{ background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>Ctrl + N 新建事项</Tag>
              <Tag style={{ background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>Ctrl + K 命令面板</Tag>
              <Tag style={{ background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>Ctrl + B 折叠侧栏</Tag>
              <Tag style={{ background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>Ctrl + , 系统设置</Tag>
              <Tag style={{ background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>Ctrl + / 帮助中心</Tag>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Text style={{ color: subColor }}>本地环境</Typography.Text>
        <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>运行状态</Typography.Title>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="应用名称">{APP_NAME}</Descriptions.Item>
          <Descriptions.Item label="当前版本">v{APP_VERSION}</Descriptions.Item>
          <Descriptions.Item label="运行环境">{electron ? 'Electron 桌面版' : '浏览器版'}</Descriptions.Item>
          <Descriptions.Item label="数据模式">IndexedDB 本地存储，不上传服务器</Descriptions.Item>
          <Descriptions.Item label="断点续跑">专注会话会保存在本地，可在刷新后继续</Descriptions.Item>
          <Descriptions.Item label="存储占用">
            {storageEstimate.usage && storageEstimate.quota
              ? `${formatMB(storageEstimate.usage)} / ${formatMB(storageEstimate.quota)}`
              : '当前浏览器未提供存储估算'}
          </Descriptions.Item>
        </Descriptions>
        <Divider />
        <Alert
          type="info"
          showIcon
          style={{ borderRadius: 12 }}
          message="所有核心数据都保存在当前设备。需要迁移到其他电脑时，请定期导出 JSON 备份。"
        />
      </Card>
    </Space>
  );
}
