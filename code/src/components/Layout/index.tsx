// 应用外壳 Layout - 左侧菜单 + 顶部工作台 + 内容区 (v0.20.0 增强动画)
import React from 'react';
import { Layout as AntLayout, Menu, Button, Space, Dropdown, Avatar, Typography, Tag, Drawer, message } from 'antd';
import * as Icons from '@ant-design/icons';
import dayjs from 'dayjs';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MENU_GROUPS, ROUTES } from '@/config/routes';
import { APP_NAME, APP_SUB, APP_VERSION } from '@/config/constants';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { THEMES } from '@/config/themes';
import { useThemeVariants } from '@/hooks/useVariants';
import ThemeBackground from './ThemeBackground';
import CommandPalette from '@/components/CommandPalette';
import ItemFormDialog from '@/components/ItemForm/Dialog';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { fmtFromNow } from '@/utils/time';
import { downloadBackup } from '@/utils/export';

const { Sider, Header, Content } = AntLayout;

function iconOf(name: string): React.ReactNode {
  const key = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Outlined';
  const Icon = (Icons as any)[key];
  return Icon ? React.createElement(Icon) : <Icons.AppstoreOutlined />;
}

export default function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const { collapsed, setCollapsed, openItemForm, openCommandPalette } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const theme = useSettingsStore(s => s.theme);
  const themeMeta = THEMES.find(t => t.key === theme) || THEMES[0];
  const { getPanelStyle } = useThemeVariants();
  const panelSkin = getPanelStyle() as any;
  const shellTitle = panelSkin.titleColor || panelSkin.color || (themeMeta.style === 'dark' || themeMeta.style === 'cyberpunk' ? '#f8fafc' : '#0f172a');
  const shellSub = panelSkin.subColor || (themeMeta.style === 'dark' || themeMeta.style === 'cyberpunk' ? 'rgba(226,232,240,0.74)' : '#64748b');
  const isDark = themeMeta.style === 'dark' || themeMeta.style === 'cyberpunk' || themeMeta.key === 'minimal_dark';

  const shellButtonStyle = {
    borderRadius: 12,
    fontWeight: 600,
    border: `1px solid ${themeMeta.accent}33`,
    background: isDark ? 'rgba(8,16,30,0.82)' : 'rgba(255,255,255,0.82)',
    color: shellTitle,
    boxShadow: isDark ? `0 0 16px ${themeMeta.accent}22` : '0 12px 24px rgba(15,23,42,0.08)',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  } as React.CSSProperties;

  const localPulse = useLiveQuery(async () => {
    const [items, diaries, memos] = await Promise.all([
      db.items.toArray(),
      db.diaries.toArray(),
      db.memos.toArray()
    ]);
    const allUpdates = [
      ...items.map(item => item.updatedAt || item.createdAt || 0),
      ...diaries.map(diary => diary.updatedAt || diary.createdAt || 0),
      ...memos.map(memo => memo.updatedAt || memo.createdAt || 0)
    ].filter(Boolean);
    return {
      items: items.filter(item => !item.deletedAt).length,
      diaries: diaries.filter(diary => !diary.deletedAt).length,
      memos: memos.filter(memo => !memo.deletedAt).length,
      lastUpdate: allUpdates.length ? Math.max(...allUpdates) : 0
    };
  }, []) || { items: 0, diaries: 0, memos: 0, lastUpdate: 0 };

  const lastBackup = useLiveQuery(() => db.cacheKv.get('lastBackupMeta'), []);

  async function quickBackup() {
    const result = await downloadBackup();
    if (result.ok) message.success(result.msg);
    else message.error(result.msg);
  }

  const menuPref = useLiveQuery(() => db.settings.get('menuOrder'), []);
  const orderMap: Record<string, number> = {};
  const hidden: Set<string> = new Set();
  if (menuPref?.value) {
    (menuPref.value.order as string[]).forEach((key, index) => { orderMap[key] = index; });
    (menuPref.value.hidden as string[] || []).forEach(key => hidden.add(key));
  }

  const menuItems = MENU_GROUPS.map(group => {
    const children = group.children
      .filter(child => !hidden.has(child.key + '@' + child.path))
      .map(child => ({
        key: child.path,
        icon: iconOf(child.icon),
        label: child.label,
        sort: orderMap[child.key + '@' + child.path] ?? 999
      }))
      .sort((a, b) => a.sort - b.sort);

    return {
      key: group.key,
      label: group.label,
      type: 'group' as const,
      children: children.map(({ sort, ...rest }) => rest)
    };
  }).filter(group => group.children.length > 0);

  const activeKey = loc.pathname;
  const menuNode = <Menu className="workspace-menu" mode="inline" theme="dark" selectedKeys={[activeKey]} items={menuItems} onClick={({ key }) => { nav(String(key)); setMobileMenuOpen(false); }} style={{ padding: 10, background: 'transparent', borderRight: 'none', color: '#e2e8f0' }} />;
  const activeLabel = MENU_GROUPS.flatMap(group => group.children).find(child => activeKey.startsWith(child.path))?.label || APP_NAME;
  const todayLabel = dayjs().format('YYYY 年 M 月 D 日 · dddd');

  return (
    <AntLayout className="workspace-shell" style={{ minHeight: '100vh', background: 'transparent' }}>
      <style>{`
        .workspace-shell {
          --menu-text: ${isDark ? themeMeta.accent + 'cc' : '#e2e8f0'};
          --menu-text-dim: ${isDark ? themeMeta.accent + '99' : 'rgba(255,255,255,0.7)'};
          --menu-text-group: ${isDark ? themeMeta.accent + '66' : 'rgba(255,255,255,0.45)'};
          --menu-hover-bg: ${isDark ? themeMeta.accent + '15' : 'rgba(255,255,255,0.08)'};
          --menu-selected-bg: ${isDark ? themeMeta.accent + '22' : 'rgba(255,255,255,0.15)'};
        }
        .workspace-shell .workspace-sider .ant-layout-sider-trigger {
          background: ${isDark ? themeMeta.accent + '11' : 'rgba(255,255,255,0.08)'};
          color: var(--menu-text);
          border-top: 1px solid ${isDark ? themeMeta.accent + '22' : 'rgba(255,255,255,0.08)'};
          transition: all 0.3s ease;
        }
        .workspace-shell .workspace-sider .ant-layout-sider-trigger:hover {
          background: ${isDark ? themeMeta.accent + '22' : 'rgba(255,255,255,0.15)'};
        }
        .workspace-shell .workspace-menu.ant-menu {
          background: transparent;
          color: var(--menu-text);
        }
        .workspace-shell .workspace-menu .ant-menu-item-group-title {
          padding: 18px 12px 8px;
          color: var(--menu-text-group);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          transition: color 0.3s ease;
        }
        .workspace-shell .workspace-menu .ant-menu-item {
          height: auto;
          line-height: 1.4;
          margin: 4px 12px;
          padding: 10px 14px;
          border-radius: 12px;
          color: var(--menu-text-dim);
          transition: all 0.32s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
          overflow: hidden;
        }
        .workspace-shell .workspace-menu .ant-menu-item::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, ${isDark ? themeMeta.accent + '08' : 'rgba(255,255,255,0.04)'}, transparent);
          transform: translateX(-100%);
          transition: transform 0.5s ease;
        }
        .workspace-shell .workspace-menu .ant-menu-item:hover::before {
          transform: translateX(100%);
        }
        .workspace-shell .workspace-menu .ant-menu-item:hover {
          background: var(--menu-hover-bg);
          color: ${isDark ? themeMeta.accent : '#fff'};
          transform: translateX(5px);
        }
        .workspace-shell .workspace-menu .ant-menu-item:active {
          transform: scale(0.97);
        }
        .workspace-shell .workspace-menu .ant-menu-item-selected {
          background: var(--menu-selected-bg) !important;
          color: ${isDark ? themeMeta.accent : '#fff'} !important;
          box-shadow: inset 0 1px 1px rgba(255,255,255,0.05), 0 2px 8px rgba(0, 0, 0, 0.08);
          font-weight: 600;
        }
        .workspace-shell .workspace-menu .ant-menu-item .ant-menu-title-content {
          font-weight: 500;
          transition: font-weight 0.2s ease;
        }
        .workspace-shell .workspace-menu .ant-menu-item-selected .ant-menu-title-content {
          font-weight: 600;
        }
        .workspace-shell .workspace-content {
          scrollbar-width: thin;
          scrollbar-color: ${isDark ? themeMeta.accent + '55' : 'rgba(59,130,246,0.35)'} rgba(148,163,184,0.1);
        }
        .workspace-shell .workspace-content::-webkit-scrollbar {
          width: 8px;
        }
        .workspace-shell .workspace-content::-webkit-scrollbar-track {
          background: transparent;
        }
        .workspace-shell .workspace-content::-webkit-scrollbar-thumb {
          background: ${isDark ? themeMeta.accent + '33' : 'rgba(148,163,184,0.2)'};
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .workspace-shell .workspace-content::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? themeMeta.accent + '55' : 'rgba(148,163,184,0.4)'};
        }
        .mobile-menu-button { display: none; }
        @media (max-width: 820px) {
          .workspace-shell { display: block !important; padding: 10px; }
          .workspace-sider { display: none; }
          .workspace-main { margin: 0 !important; }
          .workspace-header { padding: 18px !important; border-radius: 24px !important; align-items: flex-start !important; }
          .workspace-header-actions { width: 100%; }
          .workspace-header-actions .ant-btn { flex: 1 1 46%; }
          .workspace-content { padding: 0 2px 18px !important; }
          .mobile-menu-button { display: inline-flex; }
        }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      `}</style>
      <ThemeBackground theme={themeMeta} />

      <Sider
        className="workspace-sider"
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={260}
        style={{
          margin: 16,
          borderRadius: 24,
          overflow: 'hidden',
          transition: 'all 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          ...getPanelStyle()
        }}
      >
        {/* 背景装饰光晕 */}
        <div style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${themeMeta.accent}28 0%, transparent 60%)`,
          pointerEvents: 'none',
          transition: 'all 0.5s ease',
          animation: 'softPulse 6s ease-in-out infinite'
        }} />

        {/* Logo 区域 */}
        <div style={{
          padding: collapsed ? '26px 12px' : '28px 22px 22px',
          borderBottom: `1px solid ${themeMeta.accent}22`,
          transition: 'all 0.35s ease',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              className="hover-scale"
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'grid',
                placeItems: 'center',
                background: `linear-gradient(145deg, transparent, ${themeMeta.accent}15)`,
                color: themeMeta.accent,
                fontSize: 22,
                border: `1px solid ${themeMeta.accent}44`,
                boxShadow: `0 0 18px ${themeMeta.accent}44, inset 0 0 6px ${themeMeta.accent}22`,
                transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                transform: collapsed ? 'scale(0.88)' : 'scale(1)',
                cursor: 'pointer'
              }}
            >
              <Icons.CalendarOutlined />
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <Typography.Text strong style={{
                  display: 'block',
                  fontSize: 18,
                  color: shellTitle,
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2
                }}>
                  {APP_NAME}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12, color: shellSub }}>
                  {APP_SUB}
                </Typography.Text>
              </div>
            )}
          </div>

          {/* 版本提示 */}
          {!collapsed && (
            <div
              className="anim-fade-in-up"
              style={{
                marginTop: 16,
                padding: '12px 14px',
                borderRadius: 10,
                background: isDark ? `${themeMeta.accent}0a` : 'rgba(255,255,255,0.5)',
                border: `1px solid ${themeMeta.accent}22`,
                color: shellTitle,
                backdropFilter: 'blur(8px)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8
              }}>
                <Typography.Text style={{ color: shellTitle, fontSize: 12 }}>工作台版本</Typography.Text>
                <Tag
                  color="cyan"
                  style={{
                    marginInlineEnd: 0,
                    background: 'transparent',
                    border: `1px solid ${themeMeta.accent}66`,
                    color: shellTitle,
                    fontSize: 11
                  }}
                >
                  v{APP_VERSION}
                </Tag>
              </div>
              <Typography.Text style={{
                display: 'block',
                marginTop: 6,
                color: shellSub,
                fontSize: 11,
                lineHeight: 1.5
              }}>
                Ctrl + K 打开命令面板，快速跳页与执行动作。
              </Typography.Text>
            </div>
          )}
        </div>

        {menuNode}
      </Sider>

      {/* 右侧内容区 */}
      <AntLayout className="workspace-main" style={{ background: 'transparent', margin: '16px 16px 16px 0' }}>
        {/* 顶部 Header */}
        <Header
          className="anim-fade-in-down workspace-header"
          style={{
            height: 'auto',
            marginBottom: 24,
            padding: '24px 32px',
            borderRadius: 32,
            ...getPanelStyle(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* 背景微光 */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '40%',
            height: '200%',
            background: `radial-gradient(ellipse, ${themeMeta.accent}0d 0%, transparent 70%)`,
            pointerEvents: 'none'
          }} />

          <div style={{ minWidth: 0, position: 'relative', zIndex: 1 }}>
            <Button className="mobile-menu-button" icon={<Icons.MenuOutlined />} onClick={() => setMobileMenuOpen(true)} style={{ ...shellButtonStyle, marginBottom: 12 }}>
              手机版菜单
            </Button>
            <Typography.Text style={{
              display: 'block',
              marginBottom: 6,
              color: shellSub,
              fontWeight: 500,
              fontSize: 13,
              letterSpacing: '0.04em'
            }}>
              {todayLabel}
            </Typography.Text>
            <Typography.Title
              level={2}
              style={{
                margin: 0,
                color: shellTitle,
                fontWeight: 700,
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}
            >
              {activeLabel}
            </Typography.Title>
            <Typography.Text style={{ color: shellSub, fontSize: 14 }}>
              把今天的事项、笔记和专注安排在一个工作台里完成。
            </Typography.Text>
            <Space wrap size={10} style={{ marginTop: 14 }}>
              <Tag bordered={false} color="blue" style={{
                borderRadius: 6,
                fontWeight: 500,
                padding: '2px 8px',
                background: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'
              }}>本地离线</Tag>
              <Tag bordered={false} color="green" style={{
                borderRadius: 6,
                fontWeight: 500,
                padding: '2px 8px',
                background: isDark ? 'rgba(34,197,94,0.15)' : 'rgba(34,197,94,0.08)'
              }}>实时保存</Tag>
              <Tag bordered={false} color="gold" style={{
                borderRadius: 6,
                fontWeight: 500,
                padding: '2px 8px',
                background: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.08)'
              }}>便携交付</Tag>
            </Space>
          </div>

          <Space className="workspace-header-actions" wrap size={10} style={{ position: 'relative', zIndex: 1 }}>
            <Button
              size="large"
              className="hover-lift"
              style={shellButtonStyle}
              icon={<Icons.DownloadOutlined />}
              onClick={quickBackup}
            >
              快速备份
            </Button>
            <Button
              size="large"
              className="hover-lift"
              style={shellButtonStyle}
              icon={<Icons.MacCommandOutlined />}
              onClick={openCommandPalette}
            >
              命令面板
            </Button>
            <Button
              size="large"
              className="hover-lift"
              style={shellButtonStyle}
              icon={<Icons.SearchOutlined />}
              onClick={() => nav(ROUTES.SEARCH)}
            >
              完整搜索
            </Button>
            <Button
              size="large"
              type="primary"
              className="hover-lift"
              style={{
                borderRadius: 12,
                fontWeight: 600,
                boxShadow: `0 8px 16px -4px ${themeMeta.accent}66`,
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              icon={<Icons.PlusOutlined />}
              onClick={() => openItemForm()}
            >
              添加事项
            </Button>
            <Dropdown menu={{
              items: [
                { key: 'user', label: '个人资料', onClick: () => nav(ROUTES.USER) },
                { key: 'theme', label: '主题换肤', onClick: () => nav(ROUTES.THEMESKIN) },
                { key: 'menuSort', label: '菜单排序', onClick: () => nav('/home/menusort') },
                { key: 'setting', label: '系统设置', onClick: () => nav(ROUTES.SYSTEM) }
              ]
            }}>
              <Avatar
                className="hover-scale"
                style={{
                  marginLeft: 6,
                  width: 42,
                  height: 42,
                  background: `linear-gradient(135deg, ${themeMeta.accent}, rgba(255,255,255,0.4))`,
                  cursor: 'pointer',
                  boxShadow: `0 8px 24px -6px ${themeMeta.accent}88`,
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
                icon={<Icons.UserOutlined />}
              />
            </Dropdown>
          </Space>
        </Header>

        {/* 内容区域 */}
        <Content
          className="workspace-content"
          style={{
            padding: '32px 40px',
            background: panelSkin.background,
            backdropFilter: panelSkin.backdropFilter,
            WebkitBackdropFilter: panelSkin.WebkitBackdropFilter,
            borderRadius: 32,
            minHeight: 'calc(100vh - 132px)',
            overflow: 'auto',
            border: panelSkin.border,
            boxShadow: panelSkin.boxShadow,
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative'
          }}
        >
          {/* 数据栏 */}
          <div
            className="anim-fade-in-up"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 20,
              padding: '10px 18px',
              borderRadius: 16,
              background: isDark ? `${themeMeta.accent}06` : 'rgba(255,255,255,0.6)',
              border: `1px solid ${isDark ? `${themeMeta.accent}18` : 'rgba(255,255,255,0.85)'}`,
              backdropFilter: 'blur(12px)'
            }}
          >
            <Space wrap size={10}>
              {[
                { color: '#3b82f6', label: '事项', count: localPulse.items },
                { color: '#22c55e', label: '日记', count: localPulse.diaries },
                { color: '#f59e0b', label: '备忘', count: localPulse.memos }
              ].map(d => (
                <span key={d.label} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, color: shellSub, fontWeight: 500
                }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: d.color, display: 'inline-block',
                    boxShadow: `0 0 6px ${d.color}66`
                  }} />
                  {d.label} <b style={{ color: shellTitle }}>{d.count}</b>
                </span>
              ))}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: shellSub, fontWeight: 500
              }}>
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#a855f7', display: 'inline-block',
                  boxShadow: '0 0 6px rgba(168,85,247,0.6)'
                }} />
                {lastBackup?.value?.exportedAt
                  ? <>备份 <b style={{ color: shellTitle }}>{fmtFromNow(lastBackup.value.exportedAt)}</b></>
                  : '尚未备份'}
              </span>
            </Space>
            <Typography.Text style={{ color: shellSub, fontSize: 11, opacity: 0.7 }}>
              {localPulse.lastUpdate
                ? `最近更新 ${fmtFromNow(localPulse.lastUpdate)}`
                : '等待数据写入'}
            </Typography.Text>
          </div>

          {/* 页面内容 */}
          <div className="anim-page-enter" key={loc.pathname}>
            <Outlet />
          </div>
        </Content>
      </AntLayout>

      <CommandPalette />
      <Drawer title="AixSystems 手机版导航" placement="left" open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} bodyStyle={{ padding: 0, background: isDark ? '#0b1020' : '#111827' }}>
        {menuNode}
      </Drawer>
      <ItemFormDialog />
    </AntLayout>
  );
}
