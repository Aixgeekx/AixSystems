// 应用外壳 Layout - 左侧菜单 + 顶部 + 内容区(支持菜单排序与隐藏)
import React, { useEffect, useState } from 'react';
import { Layout as AntLayout, Menu, Button, Space, Dropdown, Avatar } from 'antd';
import * as Icons from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MENU_GROUPS, ROUTES } from '@/config/routes';
import { APP_NAME, APP_SUB } from '@/config/constants';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { THEMES } from '@/config/themes';
import ThemeBackground from './ThemeBackground';
import ItemFormDialog from '@/components/ItemForm/Dialog';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';

const { Sider, Header, Content } = AntLayout;

function iconOf(name: string): React.ReactNode {
  const key = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Outlined';
  const I = (Icons as any)[key];
  return I ? React.createElement(I) : null;
}

export default function Layout() {
  const nav = useNavigate();
  const loc = useLocation();
  const { collapsed, setCollapsed, openItemForm } = useAppStore();
  const theme = useSettingsStore(s => s.theme);
  const themeMeta = THEMES.find(t => t.key === theme) || THEMES[0];

  const menuPref = useLiveQuery(() => db.settings.get('menuOrder'), []);
  const orderMap: Record<string, number> = {};
  const hidden: Set<string> = new Set();
  if (menuPref?.value) {
    (menuPref.value.order as string[]).forEach((k, i) => { orderMap[k] = i; });
    (menuPref.value.hidden as string[] || []).forEach(k => hidden.add(k));
  }

  const menuItems = MENU_GROUPS.map(g => {
    const children = g.children
      .filter(c => !hidden.has(c.key + '@' + c.path))
      .map(c => ({ key: c.path, icon: iconOf(c.icon), label: c.label, sort: orderMap[c.key + '@' + c.path] ?? 999 }))
      .sort((a, b) => a.sort - b.sort);
    return { key: g.key, label: g.label, type: 'group' as const, children: children.map(({ sort, ...rest }) => rest) };
  }).filter(g => g.children.length > 0);

  const activeKey = loc.pathname;
  const activeLabel = MENU_GROUPS.flatMap(g => g.children).find(c => activeKey.startsWith(c.path))?.label || APP_NAME;

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <ThemeBackground theme={themeMeta} />
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} width={220}
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
        <div style={{ padding: 16, textAlign: 'center', borderBottom: '1px solid #eee' }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: themeMeta.accent }}>{APP_NAME}</div>
          {!collapsed && <div style={{ fontSize: 12, color: '#888' }}>{APP_SUB}</div>}
        </div>
        <Menu mode="inline" selectedKeys={[activeKey]} items={menuItems}
          onClick={({ key }) => nav(String(key))}
          style={{ background: 'transparent', borderRight: 'none' }} />
      </Sider>

      <AntLayout style={{ background: 'transparent' }}>
        <Header style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)',
          padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>{activeLabel}</div>
          <Space>
            <Button icon={<Icons.SearchOutlined />} onClick={() => nav(ROUTES.SEARCH)}>搜索</Button>
            <Button type="primary" icon={<Icons.PlusOutlined />} onClick={() => openItemForm()}>添加事项</Button>
            <Dropdown menu={{ items: [
              { key: 'user', label: '个人资料', onClick: () => nav(ROUTES.USER) },
              { key: 'theme', label: '主题换肤', onClick: () => nav(ROUTES.THEMESKIN) },
              { key: 'menuSort', label: '菜单排序', onClick: () => nav('/home/menusort') },
              { key: 'setting', label: '系统设置', onClick: () => nav(ROUTES.SYSTEM) }
            ]}}>
              <Avatar style={{ background: themeMeta.accent, cursor: 'pointer' }} icon={<Icons.UserOutlined />} />
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ margin: 16, padding: 24, background: 'rgba(255,255,255,0.9)',
          borderRadius: 8, minHeight: 'calc(100vh - 96px)', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </AntLayout>

      <ItemFormDialog />
    </AntLayout>
  );
}
