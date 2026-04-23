// 系统设置 - 通知 / 启动页 / 快捷键 / 本地环境状态 / 系统诊断 (v0.21.5 诊断面板)
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Divider, Row, Select, Space, Statistic, Tag, Typography, message } from 'antd';
import { CloudDownloadOutlined, DatabaseOutlined, NotificationOutlined, ThunderboltOutlined, DashboardOutlined, HistoryOutlined, WarningOutlined, CheckCircleOutlined, RiseOutlined, FallOutlined, FontSizeOutlined } from '@ant-design/icons';
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

  const { startPage, setKV, customFont } = useSettingsStore();
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

  const diagnostics = useLiveQuery(async () => {
    const now = Date.now();
    const day7 = now - 7 * 24 * 60 * 60 * 1000;
    const [
      itemsN, classifiesN, foldersN, tagsN, diariesN, memosN,
      focusSessionsN, focusRepeatsN, reminderQueueN, themesN, settingsN,
      habitsN, habitLogsN, goalsN, eventLogN
    ] = await Promise.all([
      db.items.count(), db.classifies.count(), db.folders.count(), db.tags.count(),
      db.diaries.count(), db.memos.count(), db.focusSessions.count(), db.focusRepeats.count(),
      db.reminderQueue.count(), db.themes.count(), db.settings.count(),
      db.habits.count(), db.habitLogs.count(), db.goals.count(), db.eventLog.count()
    ]);
    const [
      items7, diaries7, memos7, habitLogs7, focusSessions7
    ] = await Promise.all([
      db.items.filter(i => i.createdAt >= day7).count(),
      db.diaries.filter(d => d.createdAt >= day7).count(),
      db.memos.filter(m => m.createdAt >= day7).count(),
      db.habitLogs.filter(l => l.createdAt >= day7).count(),
      db.focusSessions.filter(s => s.createdAt >= day7).count()
    ]);
    const recentLogs = await db.eventLog.orderBy('createdAt').reverse().limit(8).toArray();
    return {
      tables: [
        { name: '事项', count: itemsN, color: '#38bdf8' },
        { name: '分类', count: classifiesN, color: '#a78bfa' },
        { name: '文件夹', count: foldersN, color: '#64748b' },
        { name: '标签', count: tagsN, color: '#f472b6' },
        { name: '日记', count: diariesN, color: '#34d399' },
        { name: '备忘', count: memosN, color: '#22c55e' },
        { name: '专注', count: focusSessionsN, color: '#f59e0b' },
        { name: '专注模板', count: focusRepeatsN, color: '#d97706' },
        { name: '提醒队列', count: reminderQueueN, color: '#ef4444' },
        { name: '主题', count: themesN, color: '#8b5cf6' },
        { name: '设置', count: settingsN, color: '#94a3b8' },
        { name: '习惯', count: habitsN, color: '#10b981' },
        { name: '打卡', count: habitLogsN, color: '#059669' },
        { name: '目标', count: goalsN, color: '#3b82f6' },
        { name: '日志', count: eventLogN, color: '#6366f1' }
      ],
      trends: [
        { name: '事项', count: items7, icon: <RiseOutlined /> },
        { name: '日记', count: diaries7, icon: <RiseOutlined /> },
        { name: '备忘', count: memos7, icon: <RiseOutlined /> },
        { name: '打卡', count: habitLogs7, icon: <RiseOutlined /> },
        { name: '专注', count: focusSessions7, icon: <RiseOutlined /> }
      ],
      recentLogs,
      totalRecords: itemsN + classifiesN + foldersN + tagsN + diariesN + memosN + focusSessionsN + focusRepeatsN + reminderQueueN + themesN + settingsN + habitsN + habitLogsN + goalsN + eventLogN
    };
  }, []) || { tables: [], trends: [], recentLogs: [], totalRecords: 0 };

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

        <Col xs={24} lg={12}>
          <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Typography.Text style={{ color: subColor }}>字体偏好</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>
              <FontSizeOutlined /> 界面字体
            </Typography.Title>
            <Typography.Paragraph style={{ color: subColor, marginBottom: 12 }}>
              修改后会即时生效。可选择系统常见字体，或使用内置的 Maple Mono 编程字体。
            </Typography.Paragraph>
            <Select
              style={{ width: '100%', borderRadius: 10 }}
              value={customFont || 'default'}
              onChange={value => setKV('customFont', value === 'default' ? '' : value)}
              options={[
                { value: 'default', label: '跟随主题默认' },
                { value: '"Maple Mono NF CN", monospace', label: 'Maple Mono NF CN（编程字体）' },
                { value: '"Segoe UI", "Microsoft YaHei", sans-serif', label: 'Segoe UI / 微软雅黑' },
                { value: '"PingFang SC", "Hiragino Sans GB", sans-serif', label: '苹方 / 冬青黑体' },
                { value: '"Source Han Sans SC", "Noto Sans SC", sans-serif', label: '思源黑体' },
                { value: '"SimSun", "Songti SC", serif', label: '宋体' },
                { value: '"SimHei", "Heiti SC", sans-serif', label: '黑体' },
                { value: '"Consolas", "Courier New", monospace', label: 'Consolas' },
                { value: '"Cascadia Code", "Fira Code", monospace', label: 'Cascadia Code' },
                { value: '"Orbitron", sans-serif', label: 'Orbitron（科幻感）' },
                { value: '"Georgia", "Times New Roman", serif', label: 'Georgia（衬线）' },
              ]}
            />
            {customFont ? (
              <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)', fontFamily: customFont, color: titleColor, fontSize: 14 }}>
                预览：AixSystems 时间管理系统 123 ABC
              </div>
            ) : null}
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

      {/* 系统诊断面板 */}
      <Card
        bordered={false}
        className="anim-fade-in-up hover-lift"
        style={{ borderRadius: 24, background: cardBg, border: cardBorder }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <DashboardOutlined style={{ color: accent, fontSize: 18 }} />
          <Typography.Text style={{ color: subColor }}>系统诊断面板</Typography.Text>
        </div>
        <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>
          数据库健康度与运行态势
        </Typography.Title>

        {/* 健康度评分 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} md={8}>
            <div style={{
              padding: 18,
              borderRadius: 18,
              background: isDark ? `${accent}12` : `${accent}10`,
              border: `1px solid ${accent}28`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 12, color: subColor, marginBottom: 6 }}>健康度评分</div>
              <div style={{
                fontSize: 40,
                fontWeight: 800,
                color: accent,
                textShadow: isDark ? `0 0 20px ${accent}55` : 'none'
              }}>
                {storageEstimate.quota
                  ? Math.max(0, Math.round(100 - (storageEstimate.usage! / storageEstimate.quota) * 30))
                  : 95}
              </div>
              <div style={{ fontSize: 12, color: subColor, marginTop: 4 }}>
                {storageEstimate.usage && storageEstimate.quota
                  ? `存储已用 ${((storageEstimate.usage / storageEstimate.quota) * 100).toFixed(1)}%`
                  : '存储状态良好'}
              </div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{
              padding: 18,
              borderRadius: 18,
              background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)',
              border: '1px solid rgba(59,130,246,0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 12, color: subColor, marginBottom: 6 }}>总记录数</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#3b82f6' }}>
                {diagnostics.totalRecords}
              </div>
              <div style={{ fontSize: 12, color: subColor, marginTop: 4 }}>15 张数据表</div>
            </div>
          </Col>
          <Col xs={24} md={8}>
            <div style={{
              padding: 18,
              borderRadius: 18,
              background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.2)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 12, color: subColor, marginBottom: 6 }}>近 7 天活跃</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#10b981' }}>
                {diagnostics.trends.reduce((s, t) => s + t.count, 0)}
              </div>
              <div style={{ fontSize: 12, color: subColor, marginTop: 4 }}>新增数据条目</div>
            </div>
          </Col>
        </Row>

        {/* 各表记录数 */}
        <Typography.Text strong style={{ color: titleColor, fontSize: 14 }}>各表记录数</Typography.Text>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 10,
          marginTop: 12,
          marginBottom: 20
        }}>
          {diagnostics.tables.map(t => (
            <div key={t.name} style={{
              padding: '10px 12px',
              borderRadius: 12,
              background: isDark ? `${t.color}12` : `${t.color}08`,
              border: `1px solid ${t.color}22`,
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: 11, color: subColor }}>{t.name}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: t.color, marginTop: 2 }}>{t.count}</div>
            </div>
          ))}
        </div>

        {/* 近7天趋势 */}
        <Typography.Text strong style={{ color: titleColor, fontSize: 14 }}>近 7 天数据增长</Typography.Text>
        <Row gutter={[12, 12]} style={{ marginTop: 12, marginBottom: 20 }}>
          {diagnostics.trends.map(t => (
            <Col xs={12} md={8} lg={6} xl={4} key={t.name}>
              <div style={{
                padding: '12px 14px',
                borderRadius: 12,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.03)',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(15,23,42,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 11, color: subColor }}>{t.name}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: titleColor, marginTop: 2 }}>{t.count}</div>
                </div>
                <span style={{ color: t.count > 0 ? '#22c55e' : subColor, fontSize: 14 }}>
                  {t.count > 0 ? <RiseOutlined /> : <FallOutlined />}
                </span>
              </div>
            </Col>
          ))}
        </Row>

        {/* 最近系统日志 */}
        <Typography.Text strong style={{ color: titleColor, fontSize: 14 }}>最近系统日志</Typography.Text>
        <div style={{ marginTop: 12 }}>
          {diagnostics.recentLogs.length === 0 ? (
            <div style={{ color: subColor, fontSize: 13 }}>暂无日志记录</div>
          ) : (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {diagnostics.recentLogs.map(log => (
                <div key={log.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(15,23,42,0.02)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {log.level === 'error' ? (
                      <WarningOutlined style={{ color: '#ef4444' }} />
                    ) : log.level === 'warn' ? (
                      <WarningOutlined style={{ color: '#f59e0b' }} />
                    ) : log.level === 'feedback' ? (
                      <CheckCircleOutlined style={{ color: '#3b82f6' }} />
                    ) : (
                      <HistoryOutlined style={{ color: subColor }} />
                    )}
                    <span style={{ color: titleColor, fontSize: 13 }}>{log.message}</span>
                  </div>
                  <span style={{ color: subColor, fontSize: 11, whiteSpace: 'nowrap' }}>
                    {fmtDateTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </Space>
          )}
        </div>
      </Card>
    </Space>
  );
}
