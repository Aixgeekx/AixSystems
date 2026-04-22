// 系统设置 - 通知 / 启动页 / 快捷键 / 本地环境状态
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Divider, Row, Select, Space, Statistic, Tag, Typography, message } from 'antd';
import { CloudDownloadOutlined, DatabaseOutlined, NotificationOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { APP_NAME, APP_VERSION } from '@/config/constants';
import { MENU_GROUPS } from '@/config/routes';
import { useSettingsStore } from '@/stores/settingsStore';
import { db } from '@/db';
import { requestPerm } from '@/utils/notify';
import { isElectron } from '@/utils/electron';

function formatMB(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function SystemPage() {
  const { startPage, setKV } = useSettingsStore();
  const [storageEstimate, setStorageEstimate] = useState<{ usage?: number; quota?: number }>({});
  const electron = isElectron();
  const counts = useLiveQuery(async () => {
    const items = await db.items.count();
    const diaries = await db.diaries.count();
    const memos = await db.memos.count();
    return { items, diaries, memos, total: items + diaries + memos };
  }, []) || { items: 0, diaries: 0, memos: 0, total: 0 };

  useEffect(() => {
    navigator.storage?.estimate?.().then(result => {
      setStorageEstimate({ usage: result.usage, quota: result.quota });
    }).catch(() => setStorageEstimate({}));
  }, []);

  async function askPerm() {
    const ok = await requestPerm();
    message[ok ? 'success' : 'error'](ok ? '已开启通知' : '通知权限被拒绝');
  }

  const allPages = MENU_GROUPS.flatMap(group => group.children).map(child => ({ value: child.path, label: child.label }));

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.94), rgba(37,99,235,0.9) 54%, rgba(20,184,166,0.9) 100%)',
          boxShadow: '0 28px 60px rgba(15, 23, 42, 0.16)'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Typography.Text style={{ color: 'rgba(191,219,254,0.9)' }}>本地系统控制台</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
          离线运行、实时存储、简单可迁移
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
          这里集中管理通知、启动页、本地环境和存储状态。所有设置都保存在当前设备，不依赖云端账号。
        </Typography.Paragraph>
        <Space wrap size={8}>
          <Tag color="blue">{electron ? 'Electron 桌面版' : '浏览器版'}</Tag>
          <Tag color="green">本地离线</Tag>
          <Tag color="gold">实时保存</Tag>
          <Tag color="purple">可迁移备份</Tag>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.92)' }}>
            <Statistic title="事项" value={counts.items} prefix={<DatabaseOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.92)' }}>
            <Statistic title="日记" value={counts.diaries} prefix={<CloudDownloadOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.92)' }}>
            <Statistic title="备忘录" value={counts.memos} prefix={<ThunderboltOutlined />} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.92)' }}>
            <Statistic title="本地总记录" value={counts.total} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="通知权限" bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.92)' }}>
            <Typography.Paragraph type="secondary">
              浏览器通知用于事项到期提醒。桌面版同样依赖本地通知能力。
            </Typography.Paragraph>
            <Button type="primary" icon={<NotificationOutlined />} onClick={askPerm}>
              开启浏览器通知
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="启动页" bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.92)' }}>
            <Typography.Paragraph type="secondary">
              修改后会在下次启动或刷新时自动跳转到你选定的首页。
            </Typography.Paragraph>
            <Select
              style={{ width: '100%' }}
              value={startPage}
              onChange={value => setKV('startPage', value)}
              options={allPages}
            />
          </Card>
        </Col>
      </Row>

      <Card title="快捷键" bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.92)' }}>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="新建事项"><Tag>Ctrl + N</Tag></Descriptions.Item>
          <Descriptions.Item label="命令面板"><Tag>Ctrl + K</Tag></Descriptions.Item>
          <Descriptions.Item label="折叠侧栏"><Tag>Ctrl + B</Tag></Descriptions.Item>
          <Descriptions.Item label="系统设置"><Tag>Ctrl + ,</Tag></Descriptions.Item>
          <Descriptions.Item label="帮助中心"><Tag>Ctrl + /</Tag></Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="本地环境" bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.92)' }}>
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
          message="所有核心数据都保存在当前设备。需要迁移到其他电脑时，请定期导出 JSON 备份。"
        />
      </Card>
    </Space>
  );
}
