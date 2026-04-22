// 应用外壳 Layout - 左侧菜单 + 顶部工作台 + 内容区
import React from 'react';
import { Layout as AntLayout, Menu, Button, Space, Dropdown, Avatar, Typography, Tag } from 'antd';
import * as Icons from '@ant-design/icons';
import dayjs from 'dayjs';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { MENU_GROUPS, ROUTES } from '@/config/routes';
import { APP_NAME, APP_SUB, APP_VERSION } from '@/config/constants';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { THEMES } from '@/config/themes';
import ThemeBackground from './ThemeBackground';
import CommandPalette from '@/components/CommandPalette';
import ItemFormDialog from '@/components/ItemForm/Dialog';
import { db } from '@/db';
import { useLiveQuery } from 'dexie-react-hooks';

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
    <AntLayout style={{ minHeight: '100vh', background: 'transparent' }}>
      <ThemeBackground theme={themeMeta} />

      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={248}
        style={{
          margin: 16,
          borderRadius: 28,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(30, 41, 59, 0.72))',
          border: '1px solid rgba(255,255,255,0.14)',
          boxShadow: '0 24px 54px rgba(15, 23, 42, 0.18)'
        }}
      >
        <div style={{ padding: collapsed ? '22px 10px' : '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              background: `linear-gradient(135deg, ${themeMeta.accent}, rgba(255,255,255,0.28))`,
              color: '#fff',
              boxShadow: `0 12px 26px ${themeMeta.accent}44`
            }}>
              <Icons.CalendarOutlined />
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0 }}>
                <Typography.Text strong style={{ display: 'block', fontSize: 18, color: '#f8fafc' }}>
                  {APP_NAME}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12, color: 'rgba(226,232,240,0.72)' }}>
                  {APP_SUB}
                </Typography.Text>
              </div>
            )}
          </div>

          {!collapsed && (
            <div style={{
              marginTop: 16,
              padding: '12px 14px',
              borderRadius: 18,
              background: 'rgba(255,255,255,0.08)',
              color: '#e2e8f0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Typography.Text style={{ color: '#e2e8f0' }}>工作台版本</Typography.Text>
                <Tag color="blue" style={{ marginInlineEnd: 0 }}>v{APP_VERSION}</Tag>
              </div>
              <Typography.Text style={{ display: 'block', marginTop: 6, color: 'rgba(226,232,240,0.7)', fontSize: 12 }}>
                Ctrl + K 打开命令面板，快速跳页与执行动作。
              </Typography.Text>
            </div>
          )}
        </div>

        <Menu
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
            marginBottom: 16,
            padding: '18px 22px',
            borderRadius: 28,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.86), rgba(248,250,252,0.72))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.48)',
            boxShadow: '0 18px 44px rgba(15, 23, 42, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16
          }}
        >
          <div style={{ minWidth: 0 }}>
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              {todayLabel}
            </Typography.Text>
            <Typography.Title level={3} style={{ margin: 0, color: '#0f172a' }}>
              {activeLabel}
            </Typography.Title>
            <Typography.Text type="secondary">
              把今天的事项、笔记和专注安排在一个工作台里完成。
            </Typography.Text>
            <Space wrap size={8} style={{ marginTop: 10 }}>
              <Tag color="blue">本地离线</Tag>
              <Tag color="green">实时保存</Tag>
              <Tag color="gold">便携交付</Tag>
            </Space>
          </div>

          <Space wrap size={10}>
            <Button icon={<Icons.MacCommandOutlined />} onClick={openCommandPalette}>
              命令面板
            </Button>
            <Button icon={<Icons.SearchOutlined />} onClick={() => nav(ROUTES.SEARCH)}>
              完整搜索
            </Button>
            <Button type="primary" icon={<Icons.PlusOutlined />} onClick={() => openItemForm()}>
              添加事项
            </Button>
            <Dropdown menu={{ items: [
              { key: 'user', label: '个人资料', onClick: () => nav(ROUTES.USER) },
              { key: 'theme', label: '主题换肤', onClick: () => nav(ROUTES.THEMESKIN) },
              { key: 'menuSort', label: '菜单排序', onClick: () => nav('/home/menusort') },
              { key: 'setting', label: '系统设置', onClick: () => nav(ROUTES.SYSTEM) }
            ] }}>
              <Avatar style={{ background: themeMeta.accent, cursor: 'pointer', boxShadow: `0 8px 20px ${themeMeta.accent}33` }} icon={<Icons.UserOutlined />} />
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            padding: 24,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.92), rgba(248,250,252,0.84))',
            borderRadius: 32,
            minHeight: 'calc(100vh - 132px)',
            overflow: 'auto',
            border: '1px solid rgba(255,255,255,0.48)',
            boxShadow: '0 26px 56px rgba(15, 23, 42, 0.1)'
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>

      <CommandPalette />
      <ItemFormDialog />
    </AntLayout>
  );
}
