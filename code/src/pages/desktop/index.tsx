// 桌面小部件页 - 工作台风格 (v0.24.0 完善升级)
import React, { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Modal, Progress, Row, Space, Switch, Tag, Typography } from 'antd';
import { DesktopOutlined, BgColorsOutlined, ControlOutlined, EyeOutlined, SafetyCertificateOutlined, SyncOutlined, RocketOutlined, ClearOutlined, HddOutlined, FileSearchOutlined, ToolOutlined } from '@ant-design/icons';
import FloatingReminder from '@/components/FloatingReminder';
import { useThemeVariants } from '@/hooks/useVariants';
import { getElectron, isElectron } from '@/utils/electron';

const WIDGET_THEMES = [
  { label: '跟随全局', color: 'default', key: 'global' },
  { label: '白天', color: 'blue', key: 'light' },
  { label: '黑夜', color: 'purple', key: 'dark' },
  { label: '简约', color: 'default', key: 'minimal' },
  { label: '赛博朋克', color: 'cyan', key: 'cyber' },
  { label: '渐变', color: 'magenta', key: 'gradient' },
  { label: '复古', color: 'gold', key: 'retro' }
];

const MANAGER_MODULES = [
  { key: 'startup', title: '自启管理', icon: <RocketOutlined />, color: '#2563eb' },
  { key: 'privacy', title: '隐私清理', icon: <ClearOutlined />, color: '#8b5cf6' },
  { key: 'disk', title: '磁盘保护', icon: <HddOutlined />, color: '#10b981' },
  { key: 'scan', title: '文件扫描', icon: <FileSearchOutlined />, color: '#f59e0b' },
  { key: 'tools', title: '工具大全', icon: <ToolOutlined />, color: '#06b6d4' }
];

function formatGB(bytes = 0) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

export default function DesktopWidgetPage() {
  const [show, setShow] = useState(false);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [controlScan, setControlScan] = useState<any>(null);
  const [powershellResult, setPowerShellResult] = useState<any>(null);
  const [powerShellPresets, setPowerShellPresets] = useState<any[]>([]);
  const [confirmingPreset, setConfirmingPreset] = useState<any>(null);
  const [managerPlan, setManagerPlan] = useState<Record<string, string[]>>({});
  const { theme, getPanelStyle } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const memUsage = snapshot ? Math.round((1 - snapshot.freeMem / snapshot.totalMem) * 100) : 0;
  const diskUsage = snapshot ? Math.round(snapshot.diskUsed / snapshot.diskTotal * 100) : 0;
  const electron = isElectron();

  async function refreshSnapshot() {
    const next = await getElectron()?.getSystemSnapshot?.();
    const plan = await getElectron()?.getSystemManagerPlan?.();
    const scan = await getElectron()?.scanSystemControl?.();
    const presets = await getElectron()?.getPowerShellPresets?.();
    if (next) setSnapshot(next);
    if (plan) setManagerPlan(plan);
    if (scan) setControlScan(scan);
    if (presets) setPowerShellPresets(presets);
  }

  async function runPowerShell(preset: 'computer' | 'processes' | 'services') {
    const result = await getElectron()?.runPowerShellPreset?.(preset);
    if (result) setPowerShellResult(result);
    setConfirmingPreset(null);
  }

  useEffect(() => {
    refreshSnapshot();
  }, []);

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(6,182,212,0.94), rgba(14,165,233,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(6,182,212,0.16)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
          <DesktopOutlined /> 小组件
        </Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
          桌面小部件 · 超级管理器中枢
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 0, color: 'rgba(226,232,240,0.84)' }}>
          逐步扩展电脑配置概览、性能监控、隐私清理和工具大全，先以安全只读方式接入桌面原生能力。
        </Typography.Paragraph>
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <SafetyCertificateOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>Windows 超级管理器 · 配置概览</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>
          桌面端通过 Electron 安全桥读取电脑基础状态，后续再扩展自启管理、隐私清理、磁盘保护和文件扫描。
        </Typography.Paragraph>
        {electron && snapshot ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <div style={{ padding: 16, borderRadius: 18, background: isDark ? `${accent}12` : `${accent}0d`, border: `1px solid ${accent}22` }}>
                <Typography.Text style={{ color: subColor }}>处理器</Typography.Text>
                <Typography.Title level={5} style={{ margin: '6px 0', color: titleColor }}>{snapshot.cpuModel}</Typography.Title>
                <Tag color="blue">{snapshot.cpuCores} 线程</Tag><Tag>{snapshot.arch}</Tag>
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <div style={{ padding: 16, borderRadius: 18, background: isDark ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Typography.Text style={{ color: subColor }}>内存占用</Typography.Text>
                <Progress percent={memUsage} strokeColor="#3b82f6" trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} />
                <Typography.Text style={{ color: subColor }}>{formatGB(snapshot.totalMem - snapshot.freeMem)} / {formatGB(snapshot.totalMem)}</Typography.Text>
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <div style={{ padding: 16, borderRadius: 18, background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Typography.Text style={{ color: subColor }}>磁盘占用 · {snapshot.diskRoot}</Typography.Text>
                <Progress percent={diskUsage} strokeColor="#10b981" trailColor={isDark ? 'rgba(255,255,255,0.08)' : undefined} />
                <Typography.Text style={{ color: subColor }}>{formatGB(snapshot.diskUsed)} / {formatGB(snapshot.diskTotal)}</Typography.Text>
              </div>
            </Col>
          </Row>
        ) : (
          <Alert type="info" showIcon message="浏览器模式仅显示规划。打开桌面版后可读取本机 CPU、内存、磁盘和运行状态。" style={{ borderRadius: 12 }} />
        )}
        <Space wrap style={{ marginTop: 14 }}>
          <Button icon={<SyncOutlined />} onClick={refreshSnapshot} disabled={!electron} style={{ borderRadius: 10 }}>刷新电脑状态</Button>
          {['配置概览', '自启管理', '隐私清理', '磁盘保护', '文件扫描', '工具大全'].map(item => <Tag key={item} color={item === '配置概览' ? 'blue' : 'default'}>{item}</Tag>)}
        </Space>
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-3" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <ToolOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>超级管理器二期 · 安全控制矩阵</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>
          先做只读扫描和建议，所有会改系统的动作后续都走确认、备份、回滚三段式，避免误删和误改。
        </Typography.Paragraph>
        <Row gutter={[12, 12]}>
          {MANAGER_MODULES.map(module => (
            <Col xs={24} md={12} xl={8} key={module.key}>
              <div style={{ height: '100%', padding: 16, borderRadius: 18, background: isDark ? `${module.color}12` : `${module.color}08`, border: `1px solid ${module.color}22` }}>
                <Space size={8} style={{ marginBottom: 8 }}>
                  <span style={{ color: module.color, fontSize: 18 }}>{module.icon}</span>
                  <Typography.Text strong style={{ color: titleColor }}>{module.title}</Typography.Text>
                </Space>
                {(managerPlan[module.key] || ['桌面版启动后生成控制计划']).slice(0, 3).map(item => (
                  <div key={item} style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>· {item}</div>
                ))}
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-3" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <ToolOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>超级管理器三期 · 只读控制扫描</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>
          桌面端先以只读方式枚举自启入口、临时目录和端口占用，后续任何修改都必须经过确认、备份和回滚。
        </Typography.Paragraph>
        {electron && controlScan ? (
          <Row gutter={[12, 12]}>
            <Col xs={24} md={8}>
              <div style={{ padding: 16, borderRadius: 18, background: isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.22)' }}>
                <Typography.Text style={{ color: subColor }}>自启入口</Typography.Text>
                <Typography.Title level={4} style={{ color: titleColor, margin: '4px 0' }}>{controlScan.startup?.length || 0}</Typography.Title>
                {(controlScan.startup || []).slice(0, 3).map((item: any) => <div key={`${item.source}-${item.name}`} style={{ color: subColor, fontSize: 12 }}>· {item.source} / {item.name}</div>)}
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ padding: 16, borderRadius: 18, background: isDark ? 'rgba(139,92,246,0.12)' : 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.22)' }}>
                <Typography.Text style={{ color: subColor }}>临时目录</Typography.Text>
                <Typography.Title level={4} style={{ color: titleColor, margin: '4px 0' }}>{controlScan.temp?.count || 0} 项</Typography.Title>
                <div style={{ color: subColor, fontSize: 12 }}>7 天前项目 {controlScan.temp?.oldCount || 0} · 采样 {formatGB(controlScan.temp?.totalBytes || 0)}</div>
              </div>
            </Col>
            <Col xs={24} md={8}>
              <div style={{ padding: 16, borderRadius: 18, background: isDark ? 'rgba(6,182,212,0.12)' : 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.22)' }}>
                <Typography.Text style={{ color: subColor }}>端口占用</Typography.Text>
                <Typography.Title level={4} style={{ color: titleColor, margin: '4px 0' }}>{controlScan.ports?.length || 0}</Typography.Title>
                {(controlScan.ports || []).slice(0, 3).map((item: any) => <div key={`${item.local}-${item.pid}`} style={{ color: subColor, fontSize: 12 }}>· {item.protocol} {item.local} / PID {item.pid}</div>)}
              </div>
            </Col>
          </Row>
        ) : (
          <Alert type="info" showIcon message="桌面版启动后可执行只读扫描；浏览器模式不会访问系统自启、临时目录或端口。" style={{ borderRadius: 12 }} />
        )}
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-3" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <ToolOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>内置 PowerShell · 安全预设通道</Typography.Title>
        </Space>
        <Typography.Paragraph style={{ color: subColor }}>
          只允许白名单 PowerShell 预设，每个预设都有风险分、执行前确认、备份说明和回滚说明；暂不提供任意命令输入，避免误操作。
        </Typography.Paragraph>
        <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
          {(powerShellPresets.length ? powerShellPresets : [
            { key: 'computer', title: '电脑信息', risk: 12, level: '只读低风险', backup: '桌面版加载后显示', rollback: '无需回滚' },
            { key: 'processes', title: '高占用进程', risk: 18, level: '只读低风险', backup: '桌面版加载后显示', rollback: '无需回滚' },
            { key: 'services', title: '运行服务', risk: 22, level: '只读低风险', backup: '桌面版加载后显示', rollback: '无需回滚' }
          ]).map(preset => (
            <Col xs={24} md={8} key={preset.key}>
              <div style={{ height: '100%', padding: 14, borderRadius: 16, background: isDark ? 'rgba(59,130,246,0.10)' : 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Space wrap><Typography.Text strong style={{ color: titleColor }}>{preset.title}</Typography.Text><Tag color="green">{preset.level}</Tag><Tag color="gold">风险 {preset.risk}</Tag></Space>
                <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8, marginTop: 8 }}>备份：{preset.backup}</div>
                <div style={{ color: subColor, fontSize: 12, lineHeight: 1.8 }}>回滚：{preset.rollback}</div>
                <Button size="small" onClick={() => setConfirmingPreset(preset)} disabled={!electron} style={{ marginTop: 10, borderRadius: 10 }}>确认后执行</Button>
              </div>
            </Col>
          ))}
        </Row>
        <Modal open={!!confirmingPreset} title="确认执行 PowerShell 白名单预设" okText="确认执行" cancelText="取消" onCancel={() => setConfirmingPreset(null)} onOk={() => confirmingPreset && runPowerShell(confirmingPreset.key)}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Alert type="info" showIcon message={`${confirmingPreset?.title || ''} · ${confirmingPreset?.level || ''} · 风险 ${confirmingPreset?.risk || 0}`} />
            <Typography.Text>备份计划：{confirmingPreset?.backup}</Typography.Text>
            <Typography.Text>回滚计划：{confirmingPreset?.rollback}</Typography.Text>
            <Typography.Text type="secondary">AixSystems 只执行内置只读脚本，不接收任意 PowerShell 命令。</Typography.Text>
          </Space>
        </Modal>
        {powershellResult ? (
          <pre style={{ maxHeight: 220, overflow: 'auto', margin: 0, padding: 12, borderRadius: 14, color: titleColor, background: isDark ? 'rgba(0,0,0,0.28)' : 'rgba(15,23,42,0.04)', whiteSpace: 'pre-wrap' }}>
            {powershellResult.error || powershellResult.output}
          </pre>
        ) : <Alert type="info" showIcon message="桌面版可调用系统 PowerShell 只读预设；浏览器模式不可用。" style={{ borderRadius: 12 }} />}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} className="anim-fade-in-up stagger-2 hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Space size={8} style={{ marginBottom: 12 }}>
              <ControlOutlined style={{ color: accent }} />
              <Typography.Title level={4} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>小组件控制台</Typography.Title>
            </Space>
            <Typography.Paragraph style={{ color: subColor }}>
              开启后会在页面上显示一个浮动小窗，可以拖动位置并在设置面板中切换主题。
            </Typography.Paragraph>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
              borderRadius: 16, background: isDark ? `${accent}0d` : 'rgba(59,130,246,0.06)',
              border: `1px solid ${isDark ? `${accent}18` : 'transparent'}`
            }}>
              <Switch checked={show} onChange={setShow} checkedChildren="显示" unCheckedChildren="隐藏" />
              <Typography.Text style={{ color: isDark ? '#e2e8f0' : '#334155' }}>
                {show ? '小组件已开启，可在页面上拖动' : '点击开关显示浮动小窗'}
              </Typography.Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} className="anim-fade-in-up stagger-3 hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Space size={8} style={{ marginBottom: 12 }}>
              <BgColorsOutlined style={{ color: accent }} />
              <Typography.Title level={4} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>可用主题</Typography.Title>
            </Space>
            <Typography.Paragraph style={{ color: subColor }}>
              小组件支持跟随全局主题或独立切换以下风格：
            </Typography.Paragraph>
            <Space wrap size={[8, 10]}>
              {WIDGET_THEMES.map(t => (
                <Tag key={t.key} color={t.color} style={{
                  borderRadius: 10, padding: '4px 14px', fontSize: 13, cursor: 'default',
                  transition: 'all 0.25s ease'
                }}>
                  {t.label}
                </Tag>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} className="anim-fade-in-up stagger-4" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Space size={8} style={{ marginBottom: 12 }}>
          <EyeOutlined style={{ color: accent }} />
          <Typography.Title level={4} style={{ margin: 0, color: isDark ? '#f8fafc' : '#0f172a' }}>使用建议</Typography.Title>
        </Space>
        <Row gutter={[16, 12]}>
          {[
            { tip: '统一视觉', desc: '使用"跟随全局"让小组件始终和主界面保持一致' },
            { tip: '突出显示', desc: '手动切到赛博朋克或渐变让悬浮窗更醒目' },
            { tip: '透明度调节', desc: '在小组件设置面板中拖动滑块调整背景透明度' },
            { tip: '位置记忆', desc: '拖动后小组件会记住位置，下次打开自动还原' }
          ].map((item, i) => (
            <Col xs={24} sm={12} key={i}>
              <div style={{
                padding: '12px 16px', borderRadius: 14,
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(248,250,252,0.9)',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0'}`
              }}>
                <Typography.Text strong style={{ color: isDark ? '#f8fafc' : '#0f172a' }}>{item.tip}</Typography.Text>
                <div style={{ marginTop: 4, color: subColor, fontSize: 12 }}>{item.desc}</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {show && <FloatingReminder onClose={() => setShow(false)} />}
    </Space>
  );
}
