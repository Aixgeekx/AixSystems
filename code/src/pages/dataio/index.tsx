// 数据导入导出 - 兼容桌面版原生 FS 与浏览器下载
import React, { useState, useEffect } from 'react';
import { Card, Button, Upload, message, Alert, Typography, Space, Tag } from 'antd';
import { DownloadOutlined, UploadOutlined, DatabaseOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { downloadBackup, importAll, pickAndImport } from '@/utils/export';
import { isElectron, getElectron } from '@/utils/electron';
import { db } from '@/db';

const { Text } = Typography;

export default function DataIOPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const electron = isElectron();

  async function loadStats() {
    const s: Record<string, number> = {};
    for (const t of db.tables) s[t.name] = await t.count();
    setStats(s);
  }
  useEffect(() => { loadStats(); }, []);

  async function onBackup() {
    const r = await downloadBackup();
    if (r.ok) message.success(r.msg); else message.error(r.msg);
  }

  async function onPickImport() {
    const r = await pickAndImport(false);
    if (r.ok) { message.success(r.msg); loadStats(); } else message.warning(r.msg);
  }

  return (
    <div style={{ maxWidth: 800 }}>
      {electron && <Alert style={{ marginBottom: 16 }} type="success" showIcon
        message={<>当前运行在桌面版环境 <Tag color="blue">Electron</Tag>,备份直接写入本地磁盘</>} />}

      <Card title={<><DatabaseOutlined /> 当前数据统计</>} style={{ marginBottom: 16 }}>
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} style={{ display: 'inline-block', minWidth: 140, marginRight: 16, marginBottom: 8 }}>
            <Text type="secondary">{k}: </Text><Text strong>{v}</Text>
          </div>
        ))}
      </Card>

      <Card title="导出备份" style={{ marginBottom: 16 }}>
        <Alert message={electron ? '备份文件会保存到应用数据目录' : '浏览器版会触发下载'} type="info" showIcon style={{ marginBottom: 16 }} />
        <Space>
          <Button type="primary" icon={<DownloadOutlined />} onClick={onBackup}>
            {electron ? '保存备份到本地' : '下载备份 JSON'}
          </Button>
          {electron && <Button icon={<FolderOpenOutlined />} onClick={() => getElectron()?.openDataDir()}>打开数据目录</Button>}
        </Space>
      </Card>

      <Card title="导入恢复">
        <Alert message="导入将清空当前全部数据并从 JSON 恢复,请谨慎操作" type="warning" showIcon style={{ marginBottom: 16 }} />
        {electron ?
          <Button icon={<UploadOutlined />} onClick={onPickImport}>选择 JSON 文件</Button> :
          <Upload accept=".json" showUploadList={false} beforeUpload={async (file) => {
            const text = await file.text();
            const r = await importAll(text, false);
            if (r.ok) { message.success(r.msg); loadStats(); } else message.error(r.msg);
            return false;
          }}>
            <Button icon={<UploadOutlined />}>选择 JSON 文件</Button>
          </Upload>
        }
      </Card>
    </div>
  );
}
