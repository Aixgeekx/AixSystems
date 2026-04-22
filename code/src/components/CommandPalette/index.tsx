import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Button, Input, Modal, Space, Tag, Typography } from 'antd';
import type { InputRef } from 'antd';
import {
  AppstoreOutlined,
  CalendarOutlined,
  CheckSquareOutlined,
  CustomerServiceOutlined,
  FireOutlined,
  MacCommandOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  SkinOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { MENU_GROUPS, ROUTES } from '@/config/routes';
import { ITEM_TYPES } from '@/config/itemTypes';
import { useAppStore } from '@/stores/appStore';

interface CommandItem {
  key: string;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ReactNode;
  keywords: string[];
  run: () => void;
}

export default function CommandPalette() {
  const nav = useNavigate();
  const inputRef = useRef<InputRef>(null);
  const {
    collapsed,
    setCollapsed,
    commandPaletteOpen,
    closeCommandPalette,
    openItemForm
  } = useAppStore();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);

  const pageCommands: CommandItem[] = MENU_GROUPS.flatMap(group =>
    group.children.map(child => ({
      key: `page:${child.path}`,
      title: child.label,
      subtitle: `${group.label} · 打开页面`,
      badge: '页面',
      icon: <AppstoreOutlined />,
      keywords: [group.label, child.label, child.key, child.path],
      run: () => nav(child.path)
    }))
  );

  const createCommands: CommandItem[] = ITEM_TYPES.slice(0, 8).map(type => ({
    key: `create:${type.key}`,
    title: `新建${type.label}`,
    subtitle: `快速创建一条${type.label}事项`,
    badge: '新建',
    icon: type.key === 'schedule' ? <CalendarOutlined /> : <PlusOutlined />,
    keywords: [type.label, type.key, '创建', '添加事项'],
    run: () => openItemForm(undefined, type.key)
  }));

  const actionCommands: CommandItem[] = [
    {
      key: 'action:search',
      title: '打开全局搜索',
      subtitle: '跳转到搜索页查看事项、日记、备忘录',
      badge: '动作',
      icon: <SearchOutlined />,
      keywords: ['搜索', 'search', '查找'],
      run: () => nav(ROUTES.SEARCH)
    },
    {
      key: 'action:focus',
      title: '开始专注',
      subtitle: '打开番茄专注页',
      badge: '动作',
      icon: <FireOutlined />,
      keywords: ['专注', '番茄钟', 'focus'],
      run: () => nav(ROUTES.FOCUS)
    },
    {
      key: 'action:theme',
      title: '切换主题',
      subtitle: '打开主题换肤页',
      badge: '动作',
      icon: <SkinOutlined />,
      keywords: ['主题', '换肤', '皮肤'],
      run: () => nav(ROUTES.THEMESKIN)
    },
    {
      key: 'action:settings',
      title: '打开系统设置',
      subtitle: '查看应用设置、锁屏与偏好',
      badge: '动作',
      icon: <SettingOutlined />,
      keywords: ['设置', '系统设置', 'preferences'],
      run: () => nav(ROUTES.SYSTEM)
    },
    {
      key: 'action:dataio',
      title: '导入导出数据',
      subtitle: '打开本地备份与恢复页',
      badge: '动作',
      icon: <CustomerServiceOutlined />,
      keywords: ['导出', '导入', '备份', '恢复'],
      run: () => nav(ROUTES.DATAIO)
    },
    {
      key: 'action:sidebar',
      title: collapsed ? '展开侧边栏' : '折叠侧边栏',
      subtitle: '切换左侧导航栏状态',
      badge: '动作',
      icon: <MacCommandOutlined />,
      keywords: ['侧边栏', '菜单', '导航', 'collapse'],
      run: () => setCollapsed(!collapsed)
    }
  ];

  const allCommands = [...pageCommands, ...createCommands, ...actionCommands];
  const normalized = deferredQuery.trim().toLowerCase();
  const commands = normalized
    ? allCommands.filter(item => [item.title, item.subtitle, ...item.keywords].some(text => text.toLowerCase().includes(normalized)))
    : allCommands;

  useEffect(() => {
    if (!commandPaletteOpen) return;
    setQuery('');
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [commandPaletteOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [normalized]);

  function close() {
    setQuery('');
    setActiveIndex(0);
    closeCommandPalette();
  }

  function runCommand(index: number) {
    const target = commands[index];
    if (!target) return;
    close();
    target.run();
  }

  return (
    <Modal
      open={commandPaletteOpen}
      onCancel={close}
      footer={null}
      width={760}
      centered
      title={null}
      styles={{
        content: {
          borderRadius: 28,
          padding: 0,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(247,250,252,0.98) 0%, rgba(238,244,255,0.96) 100%)',
          boxShadow: '0 32px 80px rgba(15, 23, 42, 0.22)'
        },
        body: { padding: 0 }
      }}
    >
      <div style={{ padding: 18, borderBottom: '1px solid rgba(148, 163, 184, 0.18)' }}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#0f172a' }}>命令面板</div>
              <Typography.Text type="secondary">搜索页面、动作和快捷创建入口</Typography.Text>
            </div>
            <Tag style={{ borderRadius: 999, padding: '6px 10px', marginInlineEnd: 0 }}>Ctrl + K</Tag>
          </div>

          <Input
            ref={inputRef}
            size="large"
            value={query}
            prefix={<SearchOutlined style={{ color: '#64748b' }} />}
            placeholder="例如：搜索 / 新建日程 / 打开专注 / 系统设置"
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(i => Math.min(i + 1, Math.max(commands.length - 1, 0)));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(i => Math.max(i - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                runCommand(activeIndex);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                close();
              }
            }}
            style={{
              borderRadius: 18,
              paddingBlock: 10,
              background: 'rgba(255,255,255,0.92)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)'
            }}
          />
        </Space>
      </div>

      <div style={{ maxHeight: 420, overflow: 'auto', padding: 10 }}>
        {commands.length === 0 ? (
          <div style={{ padding: 36, textAlign: 'center', color: '#64748b' }}>
            没找到匹配项，试试输入页面名、事项类型或常用动作。
          </div>
        ) : commands.map((item, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={item.key}
              type="button"
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => runCommand(index)}
              style={{
                width: '100%',
                border: 'none',
                background: active ? 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(59,130,246,0.18))' : 'transparent',
                borderRadius: 18,
                padding: '14px 16px',
                marginBottom: 8,
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: active ? '0 14px 28px rgba(59,130,246,0.12)' : 'none'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  display: 'grid',
                  placeItems: 'center',
                  background: active ? 'rgba(255,255,255,0.86)' : 'rgba(148, 163, 184, 0.12)',
                  color: active ? '#2563eb' : '#475569',
                  flexShrink: 0
                }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <Typography.Text strong style={{ fontSize: 15, color: '#0f172a' }}>{item.title}</Typography.Text>
                    <Tag color={item.badge === '新建' ? 'blue' : item.badge === '页面' ? 'gold' : 'green'} style={{ marginInlineEnd: 0 }}>
                      {item.badge}
                    </Tag>
                  </div>
                  <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                    {item.subtitle}
                  </Typography.Text>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 18px 18px',
        color: '#64748b'
      }}>
        <Space size={8} wrap>
          <Tag>Enter 执行</Tag>
          <Tag>↑ ↓ 选择</Tag>
          <Tag>Esc 关闭</Tag>
        </Space>
        <Button type="text" onClick={() => nav(ROUTES.SEARCH)}>转到完整搜索页</Button>
      </div>
    </Modal>
  );
}
