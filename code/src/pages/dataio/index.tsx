// 数据导入导出 - 兼容桌面版原生 FS 与浏览器下载 (v0.21.4 主题适配)
import React, { useState } from 'react';
import { Alert, Button, Card, Checkbox, Col, Empty as AntEmpty, Row, Space, Statistic, Tag, Typography, Upload, message } from 'antd';
import { DatabaseOutlined, DownloadOutlined, FolderOpenOutlined, UploadOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { downloadBackup, importAll, pickAndImport } from '@/utils/export';
import { getElectron, isElectron } from '@/utils/electron';
import { fmtDateTime, fmtFromNow } from '@/utils/time';
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';

export default function DataIOPage() {
  const electron = isElectron();
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const tintedBg = (color: string) => isDark ? `${color}1a` : `${color}12`;
  const dataModules = [
    { label: '事项与提醒', tables: ['items', 'reminderQueue'] },
    { label: '记录内容', tables: ['diaries', 'memos', 'attachments'] },
    { label: '成长系统', tables: ['habits', 'habitLogs', 'goals', 'focusSessions', 'focusRepeats'] },
    { label: '组织配置', tables: ['classifies', 'tags', 'folders', 'themes', 'settings', 'userProfile'] },
    { label: '系统状态', tables: ['eventLog', 'cacheKv'] }
  ];
  const [selectedModules, setSelectedModules] = useState<string[]>(dataModules.map(item => item.label));

  const stats = useLiveQuery(async () => {
    const next: Record<string, number> = {};
    for (const table of db.tables) next[table.name] = await table.count();
    return next;
  }, []) || {};
  const lastBackup = useLiveQuery(() => db.cacheKv.get('lastBackupMeta'), []);

  const totalRows = Object.values(stats).reduce((sum, count) => sum + count, 0);
  const selectedTables = dataModules.filter(item => selectedModules.includes(item.label)).flatMap(item => item.tables);
  const selectedRows = selectedTables.reduce((sum, table) => sum + (stats[table] || 0), 0);
  const sovereigntyScore = Math.min(100, 60 + (lastBackup?.value ? 20 : 0) + (selectedModules.length === dataModules.length ? 10 : 20));

  async function onBackup() {
    const result = await downloadBackup();
    if (result.ok) message.success(result.msg);
    else message.error(result.msg);
  }

  async function onPartialBackup() {
    if (!selectedTables.length) return message.warning('请至少选择一个导出模块');
    const result = await downloadBackup(selectedTables);
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
        className="anim-fade-in-up"
        style={{
          borderRadius: 28,
          overflow: 'hidden',
          background: isDark
            ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
            : 'linear-gradient(135deg, rgba(15,23,42,0.94), rgba(30,64,175,0.9) 52%, rgba(14,165,233,0.9) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(15, 23, 42, 0.16)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 18]} align="middle">
          <Col xs={24} lg={16}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(191,219,254,0.9)' }}>本地数据中心</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
              离线存储、实时刷新、手动备份
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
              所有核心数据都保存在本机。下面的统计会随本地数据库变化实时更新，不依赖任何远程服务。
            </Typography.Paragraph>
            <Space wrap size={8}>
              <Tag color="blue" style={{ background: isDark ? 'rgba(59,130,246,0.2)' : undefined }}>离线本地</Tag>
              <Tag color="green" style={{ background: isDark ? 'rgba(34,197,94,0.2)' : undefined }}>实时统计</Tag>
              <Tag color="gold" style={{ background: isDark ? 'rgba(245,158,11,0.2)' : undefined }}>{electron ? '桌面直写磁盘' : '浏览器下载备份'}</Tag>
            </Space>
          </Col>
          <Col xs={24} lg={8}>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Card bordered={false} className="hover-lift" style={{ borderRadius: 22, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                <Statistic title="总记录数" value={totalRows} valueStyle={{ color: '#fff' }} />
              </Card>
              <Card bordered={false} className="hover-lift" style={{ borderRadius: 22, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                <Statistic title="数据主权评分" value={sovereigntyScore} suffix="/100" valueStyle={{ color: '#86efac' }} />
              </Card>
            </Space>
          </Col>
        </Row>
      </Card>

      {electron ? (
        <Alert
          type="success"
          showIcon
          message={<>当前运行在桌面版环境 <Tag color="blue" style={{ background: isDark ? 'rgba(59,130,246,0.2)' : undefined }}>Electron</Tag>，备份文件会直接写入本地数据目录。</>}
          style={{ borderRadius: 12 }}
        />
      ) : (
        <Alert
          type="info"
          showIcon
          message="当前运行在浏览器环境，备份会以 JSON 文件形式下载到本地。"
          style={{ borderRadius: 12 }}
        />
      )}

      <Row gutter={[16, 16]}>
        {Object.keys(stats).length === 0 ? (
          <Col span={24}>
            <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
              <Empty text="暂无数据统计" />
            </Card>
          </Col>
        ) : Object.entries(stats).map(([name, value], i) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={name}>
            <Card
              bordered={false}
              className="anim-fade-in-up hover-lift"
              style={{
                borderRadius: 22,
                background: cardBg,
                border: cardBorder,
                animationDelay: `${i * 0.04}s`,
                transition: 'all 0.3s ease'
              }}
            >
              <Statistic
                title={<span style={{ color: subColor }}>{name}</span>}
                value={value}
                valueStyle={{ fontSize: 28, fontWeight: 700, color: titleColor }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-2 hover-lift"
            title={<span style={{ color: titleColor }}>导出备份</span>}
            style={{ borderRadius: 24, background: cardBg, border: cardBorder }}
          >
            <Typography.Paragraph style={{ color: subColor }}>
              备份会导出全部核心数据，适合换机、迁移或归档。建议在做大改动前先导出一份。
            </Typography.Paragraph>
            {lastBackup?.value ? (
              <div style={{ marginBottom: 14, padding: 12, borderRadius: 16, background: tintedBg('#3b82f6'), border: isDark ? `1px solid ${accent}22` : '1px solid transparent' }}>
                <Typography.Text strong style={{ color: titleColor }}>最近一次备份</Typography.Text>
                <Typography.Paragraph style={{ margin: '6px 0 0', color: subColor }}>
                  {fmtDateTime(lastBackup.value.exportedAt)} · {fmtFromNow(lastBackup.value.exportedAt)}
                </Typography.Paragraph>
                <Space wrap size={[8, 8]}>
                  <Tag color="blue" style={{ background: isDark ? 'rgba(59,130,246,0.2)' : undefined }}>{lastBackup.value.mode === 'electron' ? '桌面直写' : '浏览器下载'}</Tag>
                  <Tag style={{ background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>{Math.round((lastBackup.value.size || 0) / 1024)} KB</Tag>
                  {lastBackup.value.path ? <Tag style={{ background: isDark ? 'rgba(255,255,255,0.08)' : undefined }}>{lastBackup.value.path}</Tag> : null}
                </Space>
              </div>
            ) : null}
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space wrap>
                <Button type="primary" icon={<DownloadOutlined />} onClick={onBackup} style={{ borderRadius: 10, boxShadow: `0 8px 20px -4px ${accent}44` }}>
                  {electron ? '保存完整备份到本地' : '下载完整备份 JSON'}
                </Button>
                {electron ? (
                  <Button icon={<FolderOpenOutlined />} onClick={() => getElectron()?.openDataDir()} style={{ borderRadius: 10 }}>
                    打开数据目录
                  </Button>
                ) : null}
              </Space>
              <div style={{ padding: 12, borderRadius: 16, background: tintedBg('#14b8a6'), border: isDark ? `1px solid ${accent}22` : '1px solid transparent' }}>
                <Typography.Text strong style={{ color: titleColor }}>选择性导出</Typography.Text>
                <Typography.Paragraph style={{ margin: '6px 0 10px', color: subColor }}>只导出选中的模块，适合分享成长记录、迁移部分资料或做轻量归档；备份内会自动写入 manifest 清单。</Typography.Paragraph>
                <Space wrap size={[8, 8]} style={{ marginBottom: 10 }}>
                  <Tag color="green" style={{ background: isDark ? 'rgba(34,197,94,0.2)' : undefined }}>选中 {selectedTables.length} 张表</Tag>
                  <Tag color="blue" style={{ background: isDark ? 'rgba(59,130,246,0.2)' : undefined }}>预计 {selectedRows} 条记录</Tag>
                  <Tag color="purple" style={{ background: isDark ? 'rgba(139,92,246,0.2)' : undefined }}>Manifest 可审计</Tag>
                </Space>
                <Checkbox.Group
                  value={selectedModules}
                  onChange={value => setSelectedModules(value as string[])}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))', gap: 8, marginBottom: 12 }}
                  options={dataModules.map(item => ({ label: `${item.label} · ${item.tables.reduce((sum, table) => sum + (stats[table] || 0), 0)}`, value: item.label }))}
                />
                <Button icon={<DownloadOutlined />} onClick={onPartialBackup} style={{ borderRadius: 10 }}>
                  导出选中模块
                </Button>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            className="anim-fade-in-up stagger-3 hover-lift"
            title={<span style={{ color: titleColor }}>导入恢复</span>}
            style={{ borderRadius: 24, background: cardBg, border: cardBorder }}
          >
            <Typography.Paragraph style={{ color: subColor }}>
              导入会先清空当前数据，再从 JSON 全量恢复。执行前请确认已完成备份。
            </Typography.Paragraph>
            {electron ? (
              <Button icon={<UploadOutlined />} onClick={onPickImport} style={{ borderRadius: 10 }}>选择 JSON 文件</Button>
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
                <Button icon={<UploadOutlined />} style={{ borderRadius: 10 }}>选择 JSON 文件</Button>
              </Upload>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
