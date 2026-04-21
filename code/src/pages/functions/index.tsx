// 实用功能入口页 - 展示 17 种事项类型,点击直达创建
import React from 'react';
import { Card, Row, Col, Typography, Divider } from 'antd';
import * as Icons from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ITEM_TYPES } from '@/config/itemTypes';
import type { ItemType } from '@/config/itemTypes';
import { useAppStore } from '@/stores/appStore';
import { ROUTES } from '@/config/routes';

const { Title, Paragraph } = Typography;

function iconOf(name: string) {
  const k = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Outlined';
  return (Icons as any)[k] || Icons.AppstoreOutlined;
}

const CATEGORIES: { name: string; types: ItemType[] }[] = [
  { name: '日常规划', types: ['schedule', 'checklist', 'clock_wakeup', 'clock_sleep', 'clock_workrest'] },
  { name: '生活纪念', types: ['birthday', 'anniversary', 'countdown', 'festival'] },
  { name: '健康管理', types: ['aunt', 'medicine', 'run'] },
  { name: '财务管理', types: ['bill', 'loan'] },
  { name: '学习工作', types: ['book', 'syllabus', 'work', 'dress'] }
];

const OTHER_ENTRIES = [
  { label: '日记',     path: ROUTES.DIARY_CAL,          icon: 'read',          color: '#722ed1' },
  { label: '备忘录',   path: ROUTES.MEMO,               icon: 'file-text',     color: '#13c2c2' },
  { label: '番茄专注', path: ROUTES.FOCUS,              icon: 'fire',          color: '#fa541c' },
  { label: '分类管理', path: '/home/classify',          icon: 'tags',          color: '#1677ff' },
  { label: '回收站',   path: '/home/trash',             icon: 'delete',        color: '#8c8c8c' },
  { label: '导入导出', path: ROUTES.DATAIO,             icon: 'cloud',         color: '#52c41a' }
];

export default function FunctionsPage() {
  const nav = useNavigate();
  const openItemForm = useAppStore(s => s.openItemForm);

  function createBy(type: ItemType) { openItemForm(undefined, type); }

  return (
    <div style={{ maxWidth: 1100 }}>
      <Typography>
        <Title level={3}>实用功能</Title>
        <Paragraph type="secondary">17 种事项类型 + 工具模块,按场景直达。</Paragraph>
      </Typography>

      {CATEGORIES.map(cat => (
        <div key={cat.name} style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12 }}>{cat.name}</h4>
          <Row gutter={[12, 12]}>
            {cat.types.map(tk => {
              const meta = ITEM_TYPES.find(t => t.key === tk);
              if (!meta) return null;
              const I = iconOf(meta.icon);
              return (
                <Col key={tk} span={4}>
                  <Card hoverable size="small" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => createBy(tk)}>
                    <I style={{ fontSize: 28, color: meta.color }} />
                    <div style={{ marginTop: 8, fontWeight: 500 }}>{meta.label}</div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      ))}

      <Divider />
      <h4 style={{ marginBottom: 12 }}>工具与记录</h4>
      <Row gutter={[12, 12]}>
        {OTHER_ENTRIES.map(e => {
          const I = iconOf(e.icon);
          return (
            <Col key={e.path} span={4}>
              <Card hoverable size="small" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => nav(e.path)}>
                <I style={{ fontSize: 28, color: e.color }} />
                <div style={{ marginTop: 8, fontWeight: 500 }}>{e.label}</div>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
}
