// 实用功能入口页 - 展示 17 种事项类型,点击直达创建 (v0.21.4 主题适配)
import React from 'react';
import { Card, Col, Row, Space, Tag, Typography } from 'antd';
import * as Icons from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ITEM_TYPES } from '@/config/itemTypes';
import type { ItemType } from '@/config/itemTypes';
import { useAppStore } from '@/stores/appStore';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

function iconOf(name: string) {
  const key = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Outlined';
  return (Icons as any)[key] || Icons.AppstoreOutlined;
}

const CATEGORIES: { name: string; desc: string; types: ItemType[] }[] = [
  { name: '日常规划', desc: '处理今天、明天和固定作息', types: ['schedule', 'checklist', 'clock_wakeup', 'clock_sleep', 'clock_workrest'] },
  { name: '生活纪念', desc: '让重要日期持续被记住', types: ['birthday', 'anniversary', 'countdown', 'festival'] },
  { name: '健康管理', desc: '围绕身体状态和习惯维护', types: ['aunt', 'medicine', 'run'] },
  { name: '财务管理', desc: '还款、贷款与金额提醒', types: ['bill', 'loan'] },
  { name: '学习工作', desc: '把学习与工作放进时间系统', types: ['book', 'syllabus', 'work', 'dress'] }
];

const OTHER_ENTRIES = [
  { label: '日记', path: ROUTES.DIARY_CAL, icon: 'read', color: '#7c3aed' },
  { label: '备忘录', path: ROUTES.MEMO, icon: 'file-text', color: '#14b8a6' },
  { label: '番茄专注', path: ROUTES.FOCUS, icon: 'fire', color: '#f97316' },
  { label: '分类管理', path: '/home/classify', icon: 'tags', color: '#2563eb' },
  { label: '回收站', path: '/home/trash', icon: 'delete', color: '#64748b' },
  { label: '导入导出', path: ROUTES.DATAIO, icon: 'cloud', color: '#22c55e' }
];

export default function FunctionsPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const nav = useNavigate();
  const openItemForm = useAppStore(s => s.openItemForm);

  function createBy(type: ItemType) {
    openItemForm(undefined, type);
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
            : 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(124,58,237,0.92) 46%, rgba(59,130,246,0.9) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(59,130,246,0.14)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(216,180,254,0.9)' }}>功能中枢</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
          一屏直达事项类型、工具模块和记录入口
        </Typography.Title>
        <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
          这里不是简单的入口列表，而是按使用场景分区的快捷操作中心。你可以直接新建事项，也可以跳去常用模块。
        </Typography.Paragraph>
        <Space wrap size={8}>
          <Tag color="blue" style={{ background: isDark ? 'rgba(59,130,246,0.2)' : undefined }}>17 种事项类型</Tag>
          <Tag color="purple" style={{ background: isDark ? 'rgba(168,85,247,0.2)' : undefined }}>多场景分组</Tag>
          <Tag color="gold" style={{ background: isDark ? 'rgba(245,158,11,0.2)' : undefined }}>点击即建</Tag>
        </Space>
      </Card>

      {CATEGORIES.map((category, ci) => (
        <Card key={category.name} bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder, animationDelay: `${ci * 0.05}s` }}>
          <Typography.Text style={{ color: subColor }}>{category.desc}</Typography.Text>
          <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>{category.name}</Typography.Title>
          <Row gutter={[12, 12]}>
            {category.types.map(typeKey => {
              const meta = ITEM_TYPES.find(item => item.key === typeKey);
              if (!meta) return null;
              const Icon = iconOf(meta.icon);
              return (
                <Col key={typeKey} xs={12} sm={8} lg={6} xl={4}>
                  <button
                    type="button"
                    onClick={() => createBy(typeKey)}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderRadius: 20,
                      padding: '18px 14px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      background: isDark ? `${meta.color}22` : `${meta.color}16`,
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      display: 'grid',
                      placeItems: 'center',
                      background: isDark ? 'rgba(10,14,28,0.6)' : '#fff',
                      color: meta.color,
                      boxShadow: isDark ? `0 8px 18px rgba(0,0,0,0.25)` : '0 8px 18px rgba(15,23,42,0.06)'
                    }}>
                      <Icon />
                    </div>
                    <div style={{ marginTop: 12, fontWeight: 700, color: titleColor }}>{meta.label}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: subColor }}>立即创建</div>
                  </button>
                </Col>
              );
            })}
          </Row>
        </Card>
      ))}

      <Card bordered={false} className="anim-fade-in-up hover-lift" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
        <Typography.Text style={{ color: subColor }}>工具与记录</Typography.Text>
        <Typography.Title level={4} style={{ margin: '4px 0 16px', color: titleColor }}>跨模块快速跳转</Typography.Title>
        <Row gutter={[12, 12]}>
          {OTHER_ENTRIES.map(entry => {
            const Icon = iconOf(entry.icon);
            return (
              <Col key={entry.path} xs={12} sm={8} lg={6} xl={4}>
                <button
                  type="button"
                  onClick={() => nav(entry.path)}
                  style={{
                    width: '100%',
                    border: 'none',
                    borderRadius: 20,
                    padding: '18px 14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    background: isDark ? `${entry.color}22` : `${entry.color}16`,
                    transition: 'all 0.25s ease'
                  }}
                >
                  <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    display: 'grid',
                    placeItems: 'center',
                    background: isDark ? 'rgba(10,14,28,0.6)' : '#fff',
                    color: entry.color,
                    boxShadow: isDark ? `0 8px 18px rgba(0,0,0,0.25)` : '0 8px 18px rgba(15,23,42,0.06)'
                  }}>
                    <Icon />
                  </div>
                  <div style={{ marginTop: 12, fontWeight: 700, color: titleColor }}>{entry.label}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: subColor }}>进入模块</div>
                </button>
              </Col>
            );
          })}
        </Row>
      </Card>
    </Space>
  );
}
