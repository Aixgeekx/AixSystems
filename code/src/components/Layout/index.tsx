// 应用外壳 Layout - 左侧菜单 + 顶部工作台 + 内容区
import React from 'react';
import { Layout as AntLayout, Menu, Button, Space, Dropdown, Avatar, Typography, Tag, message } from 'antd';
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
  const theme = useSettingsStore(s => s.theme);
  const themeMeta = THEMES.find(t => t.key === theme) || THEMES[0];
  const { getPanelStyle } = useThemeVariants();
  const panelSkin = getPanelStyle() as any;
  const shellTitle = panelSkin.titleColor || panelSkin.color || (themeMeta.style === 'dark' || themeMeta.style === 'cyberpunk' ? '#f8fafc' : '#0f172a');
  const shellSub = panelSkin.subColor || (themeMeta.style === 'dark' || themeMeta.style === 'cyberpunk' ? 'rgba(226,232,240,0.74)' : '#64748b');
  const shellButtonStyle = {
    borderRadius: 12,
    fontWeight: 600,
    border: `1px solid ${themeMeta.accent}33`,
    background: themeMeta.style === 'dark' || themeMeta.style === 'cyberpunk' ? 'rgba(8,16,30,0.82)' : 'rgba(255,255,255,0.82)',
    color: shellTitle,
    boxShadow: themeMeta.style === 'dark' || themeMeta.style === 'cyberpunk' ? `0 0 16px ${themeMeta.accent}22` : '0 12px 24px rgba(15,23,42,0.08)'
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
  const activeLabel = MENU_GROUPS.flatMap(group => group.children).find(child => activeKey.startsWith(child.path))?.label || APP_NAME;
  const todayLabel = dayjs().format('YYYY 年 M 月 D 日 · dddd');

  return (
    <AntLayout className="workspace-shell" style={{ minHeight: '100vh', background: 'transparent' }}>
      <style>{`
        .workspace-shell .workspace-sider .ant-layout-sider-trigger {
          background: rgba(255,255,255,0.08);
          color: #e2e8f0;
          border-top: 1px solid rgba(255,255,255,0.08);
        }
        .workspace-shell .workspace-menu.ant-menu {
          background: 'transparent',
          color: '#e2e8f0'
        }
        .workspace-shell .workspace-menu .ant-menu-item-group-title {
          padding: 18px 12px 8px;
          color: rgba(255,255,255,0.45);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }
        .workspace-shell .workspace-menu .ant-menu-item {
          height: auto;
          line-height: 1.4;
          margin: 6px 8px;
          padding: 10px 14px;
          border-radius: 12px;
          color: rgba(255,255,255,0.7);
          transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .workspace-shell .workspace-menu .ant-menu-item:hover {
          background: rgba(255,255,255,0.05);
          color: #fff;
          transform: translateX(4px);
        }
        .workspace-shell .workspace-menu .ant-menu-item:active {
          transform: scale(0.96);
        }
        .workspace-shell .workspace-menu .ant-menu-item-selected {
          background: rgba(255, 255, 255, 0.15) !important;
          color: #fff !important;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1), 0 8px 16px rgba(0, 0, 0, 0.12);
        }
        .workspace-shell .workspace-menu .ant-menu-item .ant-menu-title-content {
          font-weight: 500;
          transition: font-weight 0.2s ease;
        }
        .workspace-shell .workspace-menu .ant-menu-item-selected .ant-menu-title-content {
          font-weight: 600;
          text-shadow: 0 0 16px rgba(255,255,255,0.4);
        }
        .workspace-shell .workspace-content {
          scrollbar-width: thin;
          scrollbar-color: rgba(59,130,246,0.4) rgba(148,163,184,0.12);
        }
        .workspace-shell .workspace-content::-webkit-scrollbar {
          width: 10px;
        }
        .workspace-shell .workspace-content::-webkit-scrollbar-track {
          background: rgba(148,163,184,0.08);
          border-radius: 999px;
        }
        .workspace-shell .workspace-content::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(59,130,246,0.45), rgba(14,165,233,0.42));
          border-radius: 999px;
        }
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
          borderRadius: 8,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          ...getPanelStyle()
        }}
      >
        <div style={{
          position: 'absolute',
          top: -80,
          right: -60,
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${themeMeta.accent}33 0%, transparent 60%)`,
          pointerEvents: 'none',
          transition: 'all 0.4s ease'
          }} />
        <div style={{ 
          padding: collapsed ? '26px 12px' : '28px 22px 22px', 
            borderBottom: `1px solid ${themeMeta.accent}33`,
            transition: 'all 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                display: 'grid',
                placeItems: 'center',
                background: `linear-gradient(145deg, transparent, ${themeMeta.accent}11)`,
                color: themeMeta.accent,
                fontSize: 22,
                border: '1px solid currentColor',
                boxShadow: `0 0 15px ${themeMeta.accent}44, inset 0 0 5px ${themeMeta.accent}22`,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                transform: collapsed ? 'scale(0.9)' : 'scale(1)'
              }}>
                <Icons.CalendarOutlined />
              </div>
              {!collapsed && (
                <div style={{ minWidth: 0 }}>
                  <Typography.Text strong style={{ display: 'block', fontSize: 18, color: shellTitle, textShadow: panelSkin.textShadow || 'none' }}>
                    {APP_NAME}
                  </Typography.Text>
                  <Typography.Text style={{ fontSize: 12, color: shellSub }}>
                    {APP_SUB}
                  </Typography.Text>
                </div>
              )}
            </div>
  
            {!collapsed && (
              <div style={{
                marginTop: 16,
                padding: '12px 14px',
                borderRadius: 8,
                background: themeMeta.style === 'dark' || themeMeta.style === 'cyberpunk' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255,255,255,0.45)',
                border: `1px solid ${themeMeta.accent}33`,
                color: shellTitle
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <Typography.Text style={{ color: shellTitle }}>工作台版本</Typography.Text>
                  <Tag color="cyan" style={{ marginInlineEnd: 0, background: 'transparent', border: `1px solid ${themeMeta.accent}`, color: shellTitle }}>v{APP_VERSION}</Tag>
                </div>
                <Typography.Text style={{ display: 'block', marginTop: 6, color: shellSub, fontSize: 12 }}>
                  Ctrl + K 打开命令面板，快速跳页与执行动作。
                </Typography.Text>
              </div>
            )}
          </div>

        <Menu
          className="workspace-menu"
          mode="inline"
          theme="dark"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => nav(String(key))}
          style={{
            padding: 10,
            background: 'transparent',
            borderRight: 'none',
            color: '#e2e8f0'
          }}
        />
      </Sider>

      <AntLayout style={{ background: 'transparent', margin: '16px 16px 16px 0' }}>
        <Header
          style={{
            height: 'auto',
            marginBottom: 20,
            padding: '20px 28px',
            borderRadius: 8,
            ...getPanelStyle(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div style={{ minWidth: 0, animation: 'fadeIn 0.6s ease' }}>
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
            <Typography.Title level={2} style={{ margin: 0, color: shellTitle, textShadow: panelSkin.textShadow || 'none', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {activeLabel}
            </Typography.Title>
            <Typography.Text style={{ color: shellSub, fontSize: 14 }}>
              把今天的事项、笔记和专注安排在一个工作台里完成。
            </Typography.Text>
            <Space wrap size={10} style={{ marginTop: 14 }}>
              <Tag bordered={false} color="blue" style={{ borderRadius: 6, fontWeight: 500, padding: '2px 8px' }}>本地离线</Tag>
              <Tag bordered={false} color="green" style={{ borderRadius: 6, fontWeight: 500, padding: '2px 8px' }}>实时保存</Tag>
              <Tag bordered={false} color="gold" style={{ borderRadius: 6, fontWeight: 500, padding: '2px 8px' }}>便携交付</Tag>
            </Space>
          </div>

          <Space wrap size={10}>
            <Button size="large" style={shellButtonStyle} icon={<Icons.DownloadOutlined />} onClick={quickBackup}>
              快速备份
            </Button>
            <Button size="large" style={shellButtonStyle} icon={<Icons.MacCommandOutlined />} onClick={openCommandPalette}>
              命令面板
            </Button>
            <Button size="large" style={shellButtonStyle} icon={<Icons.SearchOutlined />} onClick={() => nav(ROUTES.SEARCH)}>
              完整搜索
            </Button>
            <Button size="large" type="primary" style={{ borderRadius: 12, fontWeight: 600, boxShadow: `0 8px 16px -4px ${themeMeta.accent}66` }} icon={<Icons.PlusOutlined />} onClick={() => openItemForm()}>
              添加事项
            </Button>
            <Dropdown menu={{ items: [
              { key: 'user', label: '个人资料', onClick: () => nav(ROUTES.USER) },
              { key: 'theme', label: '主题换肤', onClick: () => nav(ROUTES.THEMESKIN) },
              { key: 'menuSort', label: '菜单排序', onClick: () => nav('/home/menusort') },
              { key: 'setting', label: '系统设置', onClick: () => nav(ROUTES.SYSTEM) }
            ] }}>
              <Avatar style={{ marginLeft: 6, width: 42, height: 42, background: `linear-gradient(135deg, ${themeMeta.accent}, rgba(255,255,255,0.4))`, cursor: 'pointer', boxShadow: `0 8px 24px -6px ${themeMeta.accent}88`, transform: 'scale(1)', transition: 'transform 0.2s ease' }} icon={<Icons.UserOutlined />} />
            </Dropdown>
          </Space>
        </Header>

        <Content
          className="workspace-content"
          style={{
            padding: '24px 32px',
            background: panelSkin.background,
            backdropFilter: panelSkin.backdropFilter,
            WebkitBackdropFilter: panelSkin.WebkitBackdropFilter,
            borderRadius: 8,
            minHeight: 'calc(100vh - 132px)',
            overflow: 'auto',
            border: panelSkin.border,
            boxShadow: panelSkin.boxShadow,
            animation: 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            position: 'relative'
          }}
        >
          <style>{`
            @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }
          `}</style>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 18,
            padding: '12px 16px',
            borderRadius: 8,
            background: themeMeta.style === 'dark' || themeMeta.style === 'cyberpunk' ? 'rgba(0, 240, 255, 0.05)' : 'rgba(255,255,255,0.45)',
            border: `1px solid ${themeMeta.accent}33`
          }}>
            <Space wrap size={8}>
              <Tag color="blue">事项 {localPulse.items}</Tag>
              <Tag color="green">日记 {localPulse.diaries}</Tag>
              <Tag color="gold">备忘录 {localPulse.memos}</Tag>
              {lastBackup?.value?.exportedAt ? (
                <Tag color="purple">最近备份 {fmtFromNow(lastBackup.value.exportedAt)}</Tag>
              ) : (
                <Tag>尚未备份</Tag>
              )}
            </Space>
            <Typography.Text style={{ color: shellSub }}>
              {localPulse.lastUpdate ? `本地最近更新 ${fmtFromNow(localPulse.lastUpdate)}` : '等待本地数据写入'}
            </Typography.Text>
          </div>
          <Outlet />
        </Content>
      </AntLayout>

      <CommandPalette />
      <ItemFormDialog />
    </AntLayout>
  );
}
