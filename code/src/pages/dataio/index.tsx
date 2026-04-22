// 数据导入导出 - 兼容桌面版原生 FS 与浏览器下载
import React from 'react';
import { Alert, Button, Card, Col, Empty, Row, Space, Statistic, Tag, Typography, Upload, message } from 'antd';
import { DatabaseOutlined, DownloadOutlined, FolderOpenOutlined, UploadOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { downloadBackup, importAll, pickAndImport } from '@/utils/export';
import { getElectron, isElectron } from '@/utils/electron';

export default function DataIOPage() {
  const electron = isElectron();
  const stats = useLiveQuery(async () => {
    const next: Record<string, number> = {};
    for (const table of db.tables) next[table.name] = await table.count();
    return next;
  }, []) || {};

  const totalRows = Object.values(stats).reduce((sum, count) => sum + count, 0);

  async function onBackup() {
    const result = await downloadBackup();
    if (result.ok) message.success(result.msg);
    else message.error(result.msg);
  }

  async function onPickImport() {
    const result = await pickAndImport(false);
    if (result.ok) message.success(result.msg);
    else message.warning(result.msg);
  }

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card
        bordered={false}
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(15,23,42,0.94), rgba(30,64,175,0.9) 52%, rgba(14,165,233,0.9) 100%)',
          boxShadow: '0 28px 60px rgba(15, 23, 42, 0.16)'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 18]} align="middle">
          <Col xs={24} lg={16}>
            <Typography.Text style={{ color: 'rgba(191,219,254,0.9)' }}>本地数据中心</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
              离线存储、实时刷新、手动备份
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
              所有核心数据都保存在本机。下面的统计会随本地数据库变化实时更新，不依赖任何远程服务。
            </Typography.Paragraph>
            <Space wrap size={8}>
              <Tag color="blue">离线本地</Tag>
              <Tag color="green">实时统计</Tag>
              <Tag color="gold">{electron ? '桌面直写磁盘' : '浏览器下载备份'}</Tag>
            </Space>
          </Col>
          <Col xs={24} lg={8}>
            <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.12)' }}>
              <Statistic title="总记录数" value={totalRows} valueStyle={{ color: '#fff' }} />
            </Card>
          </Col>
        </Row>
      </Card>

      {electron ? (
        <Alert
          type="success"
          showIcon
          message={<>当前运行在桌面版环境 <Tag color="blue">Electron</Tag>，备份文件会直接写入本地数据目录。</>}
        />
      ) : (
        <Alert
          type="info"
          showIcon
          message="当前运行在浏览器环境，备份会以 JSON 文件形式下载到本地。"
        />
      )}

      <Row gutter={[16, 16]}>
        {Object.keys(stats).length === 0 ? (
          <Col span={24}>
            <Card bordered={false} style={{ borderRadius: 24, background: 'rgba(255,255,255,0.92)' }}>
              <Empty description="暂无数据统计" />
            </Card>
          </Col>
        ) : Object.entries(stats).map(([name, value]) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={name}>
            <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.92)' }}>
              <Statistic title={name} value={value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} title="导出备份" style={{ borderRadius: 24, background: 'rgba(255,255,255,0.92)' }}>
            <Typography.Paragraph type="secondary">
              备份会导出全部核心数据，适合换机、迁移或归档。建议在做大改动前先导出一份。
            </Typography.Paragraph>
            <Space wrap>
              <Button type="primary" icon={<DownloadOutlined />} onClick={onBackup}>
                {electron ? '保存备份到本地' : '下载备份 JSON'}
              </Button>
              {electron ? (
                <Button icon={<FolderOpenOutlined />} onClick={() => getElectron()?.openDataDir()}>
                  打开数据目录
                </Button>
              ) : null}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card bordered={false} title="导入恢复" style={{ borderRadius: 24, background: 'rgba(255,255,255,0.92)' }}>
            <Typography.Paragraph type="secondary">
              导入会先清空当前数据，再从 JSON 全量恢复。执行前请确认已完成备份。
            </Typography.Paragraph>
            {electron ? (
              <Button icon={<UploadOutlined />} onClick={onPickImport}>选择 JSON 文件</Button>
            ) : (
              <Upload
                accept=".json"
                showUploadList={false}
                beforeUpload={async file => {
                  const text = await file.text();
                  const result = await importAll(text, false);
                  if (result.ok) message.success(result.msg);
                  else message.error(result.msg);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />}>选择 JSON 文件</Button>
              </Upload>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
