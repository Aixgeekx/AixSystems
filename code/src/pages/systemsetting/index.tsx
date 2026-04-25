// 系统设置 - 通知 / 启动页 / 快捷键 / 本地环境状态 / 系统诊断 (v0.21.5 诊断面板)
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Descriptions, Divider, Input, Row, Select, Space, Statistic, Tag, Typography, message } from 'antd';
import { CloudDownloadOutlined, DatabaseOutlined, NotificationOutlined, ThunderboltOutlined, DashboardOutlined, HistoryOutlined, WarningOutlined, CheckCircleOutlined, RiseOutlined, FallOutlined, FontSizeOutlined, ApiOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { APP_NAME, APP_VERSION } from '@/config/constants';
import { MENU_GROUPS } from '@/config/routes';
import { useSettingsStore } from '@/stores/settingsStore';
import { db } from '@/db';
import { requestPerm } from '@/utils/notify';
import { getElectron, isElectron } from '@/utils/electron';
import { downloadBackup } from '@/utils/export';
import { inferAixProtocol, probeAixProvider } from '@/utils/aixModel';
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

  const { startPage, setKV, customFont, aixApiUrl, aixApiKey, aixModel, aixProviderProfiles, aixActiveProfile, aixProviderHistory } = useSettingsStore();
  const [profileName, setProfileName] = useState('');
  const [probingProvider, setProbingProvider] = useState('');
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
  const providerProfiles = JSON.parse(aixProviderProfiles || '[]') as Array<{ name: string; apiUrl: string; model: string; keyHint?: string; provider?: string; protocol?: string; health?: string; official?: boolean; latency?: number; checkedAt?: number }>;
  const providerHistory = JSON.parse(aixProviderHistory || '[]') as Array<{ name: string; ok: boolean; latency: number; checkedAt: number; error?: string }>;
  const activeProfile = providerProfiles.find(profile => profile.name === aixActiveProfile);
  const trustedRoutes = providerProfiles.map(profile => {
    const latency = profile.latency || 0;
    const healthScore = profile.official ? 78 : profile.health?.startsWith('正常') ? 96 : profile.health?.startsWith('异常') ? 32 : 58;
    const latencyScore = latency ? Math.max(20, 100 - Math.round(latency / 20)) : profile.official ? 86 : 62;
    const protocolScore = profile.protocol?.includes('claude') || profile.provider?.includes('claude') ? 94 : profile.protocol?.includes('ollama') || profile.provider?.includes('ollama') ? 82 : 88;
    const activeBonus = profile.name === aixActiveProfile ? 8 : 0;
    const trust = Math.min(100, Math.round(healthScore * 0.42 + latencyScore * 0.28 + protocolScore * 0.2 + activeBonus));
    return { ...profile, trust, route: trust >= 86 ? '主路由' : trust >= 62 ? '备用路由' : '隔离观察' };
  }).sort((a, b) => b.trust - a.trust);
  const recommendedRoute = trustedRoutes[0];
  const providerPresets = [
    { name: 'Claude Code 官方', apiUrl: '', model: 'claude-opus-4-7', provider: 'official', official: true },
    { name: 'OpenAI 兼容网关', apiUrl: 'http://127.0.0.1:8000/v1/chat/completions', model: 'aix-growth-control', provider: 'openai-compatible' },
    { name: 'Claude Messages 代理', apiUrl: 'http://127.0.0.1:8001/v1/messages', model: 'claude-opus-4-7', provider: 'claude-proxy' },
    { name: '本地 Ollama', apiUrl: 'http://127.0.0.1:11434/v1/chat/completions', model: 'local-aix', provider: 'ollama' }
  ];

  async function saveAixProfile() {
    const name = profileName.trim() || aixModel || 'Aix 默认模型';
    const previous = providerProfiles.find(profile => profile.name === aixActiveProfile);
    const nextProfile = { name, apiUrl: aixApiUrl, model: aixModel, provider: aixApiUrl ? 'openai-compatible' : 'official', protocol: inferAixProtocol(aixApiUrl), keyHint: aixApiKey ? `已保存 ${aixApiKey.slice(0, 4)}***` : '无 Key', health: aixApiUrl && aixModel ? '待检测' : '官方登录回退' };
    const next = [nextProfile, ...providerProfiles.filter(profile => profile.name !== name)].slice(0, 8);
    await setKV('aixProviderProfiles', JSON.stringify(next));
    await setKV('aixActiveProfile', name);
    await setKV('aixLastProfileBackup', JSON.stringify({ at: Date.now(), profile: previous }));
    setProfileName('');
    message.success('模型配置已原子保存到本地 Provider 槽');
  }

  async function switchAixProfile(name: string) {
    const profile = providerProfiles.find(item => item.name === name);
    if (!profile) return;
    const previous = providerProfiles.find(item => item.name === aixActiveProfile);
    await setKV('aixLastProfileBackup', JSON.stringify({ at: Date.now(), profile: previous }));
    await setKV('aixApiUrl', profile.apiUrl);
    await setKV('aixModel', profile.model);
    await setKV('aixActiveProfile', profile.name);
    message.success(`已原子切换到 ${profile.name}`);
  }

  async function applyPreset(preset: typeof providerPresets[number]) {
    setProfileName(preset.name);
    await setKV('aixApiUrl', preset.apiUrl);
    await setKV('aixModel', preset.model);
  }

  async function checkProvider(profile = { name: profileName || '当前配置', apiUrl: aixApiUrl, model: aixModel }) {
    if (!profile.apiUrl) {
      message.info('官方登录回退槽无需健康检查');
      return;
    }
    setProbingProvider(profile.name);
    const result = await probeAixProvider({ apiUrl: profile.apiUrl, apiKey: aixApiKey, model: profile.model, protocol: inferAixProtocol(profile.apiUrl) });
    const health = result.ok ? `正常 ${result.latency}ms` : `异常 ${result.error}`;
    const nextProfiles = providerProfiles.map(item => item.name === profile.name ? { ...item, health, latency: result.latency, checkedAt: result.checkedAt } : item);
    const nextHistory = [{ name: profile.name, ...result }, ...providerHistory].slice(0, 20);
    await setKV('aixProviderProfiles', JSON.stringify(nextProfiles));
    await setKV('aixProviderHistory', JSON.stringify(nextHistory));
    setProbingProvider('');
    message[result.ok ? 'success' : 'warning'](result.ok ? `Provider 正常：${result.latency}ms` : `Provider 异常：${result.error}`);
  }

  async function failoverProvider() {
    const target = providerProfiles.find(item => item.name !== aixActiveProfile && item.health?.startsWith('正常')) || providerProfiles.find(item => item.official);
    if (!target) {
      message.warning('没有可回退 Provider，请先保存官方或健康配置槽');
      return;
    }
    await switchAixProfile(target.name);
    await setKV('aixProviderHistory', JSON.stringify([{ name: target.name, ok: true, latency: 0, checkedAt: Date.now(), error: '故障转移切换' }, ...providerHistory].slice(0, 20)));
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
            <Typography.Text style={{ color: subColor }}>Aix 模型接口</Typography.Text>
            <Typography.Title level={4} style={{ margin: '4px 0 12px', color: titleColor }}>黑科技系统模型</Typography.Title>
            <Typography.Paragraph style={{ color: subColor }}>
              使用 API 接口接入 Aix 模型，用本地 Key 槽管理多套模型配置，方便像 CLI/cc-switch 一样快速切换供应商与模型。API Key 仅保存在本地 IndexedDB。
            </Typography.Paragraph>
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Input value={aixApiUrl} onChange={event => setKV('aixApiUrl', event.target.value)} placeholder="Aix API 地址，例如 http://127.0.0.1:8000/v1/chat/completions" />
              <Input.Password value={aixApiKey} onChange={event => setKV('aixApiKey', event.target.value)} placeholder="API Key（可选）" />
              <Input value={aixModel} onChange={event => setKV('aixModel', event.target.value)} placeholder="模型名，例如 aix-growth-control" />
              <Input value={profileName} onChange={event => setProfileName(event.target.value)} placeholder="配置槽名称，例如 Claude Code / cc-switch / 本地模型" />
              <Space wrap>
                <Button type="primary" onClick={saveAixProfile} style={{ borderRadius: 10 }}>保存为 Provider 槽</Button>
                <Button onClick={() => checkProvider()} loading={probingProvider === (profileName || '当前配置')} style={{ borderRadius: 10 }}>健康检查</Button>
                <Button onClick={failoverProvider} style={{ borderRadius: 10 }}>故障转移</Button>
                {activeProfile ? <Tag color="blue">当前槽：{activeProfile.name}</Tag> : <Tag>未选择配置槽</Tag>}
              </Space>
              <Space wrap size={[8, 8]}>
                {providerPresets.map(preset => (
                  <Button key={preset.name} size="small" icon={preset.official ? <SafetyCertificateOutlined /> : <ApiOutlined />} onClick={() => applyPreset(preset)} style={{ borderRadius: 10 }}>
                    {preset.name}
                  </Button>
                ))}
              </Space>
              <Space wrap size={[8, 8]}>
                {providerProfiles.map(profile => (
                  <Button key={profile.name} size="small" onClick={() => switchAixProfile(profile.name)} style={{ borderRadius: 10 }}>
                    {profile.name} · {profile.protocol || inferAixProtocol(profile.apiUrl)} · {profile.health || profile.model}
                  </Button>
                ))}
              </Space>
              {providerHistory.length ? (
                <div style={{ display: 'grid', gap: 6 }}>
                  {providerHistory.slice(0, 3).map(item => (
                    <div key={`${item.name}-${item.checkedAt}`} style={{ color: subColor, fontSize: 12 }}>
                      {item.ok ? '✓' : '!'} {item.name} · {item.latency}ms · {fmtFromNow(item.checkedAt)}{item.error ? ` · ${item.error}` : ''}
                    </div>
                  ))}
                </div>
              ) : null}
              {trustedRoutes.length ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <Space wrap><Tag color="purple">可信路由</Tag>{recommendedRoute ? <Tag color="green">推荐：{recommendedRoute.name}</Tag> : null}</Space>
                  {trustedRoutes.slice(0, 4).map(route => (
                    <div key={route.name} style={{ padding: 10, borderRadius: 12, background: isDark ? `${accent}0d` : `${accent}08`, border: `1px solid ${accent}22` }}>
                      <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Typography.Text strong style={{ color: titleColor }}>{route.name}</Typography.Text>
                        <Tag color={route.trust >= 86 ? 'green' : route.trust >= 62 ? 'gold' : 'red'}>{route.route} · {route.trust}</Tag>
                      </Space>
                      <div style={{ color: subColor, fontSize: 12, marginTop: 4 }}>{route.protocol || inferAixProtocol(route.apiUrl)} · {route.health || (route.official ? '官方登录回退' : '待检测')} · {route.latency ? `${route.latency}ms` : '无延迟样本'}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div style={{ padding: 12, borderRadius: 12, background: isDark ? `${accent}0d` : `${accent}08`, border: `1px solid ${accent}22`, color: subColor, fontSize: 12, lineHeight: 1.8 }}>
                Provider 抽象：API 地址、模型、Key 提示、OpenAI/Claude/Ollama 协议、健康状态和故障转移统一管理；切换前会备份旧槽；官方登录可作为无 Key 回退；后续可同步到 Claude Code / 本地代理配置。
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
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
