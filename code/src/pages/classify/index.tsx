// 分类管理页 - 新增/编辑/删除/排序/图标/颜色 (v0.21.4 主题适配)
import React, { useMemo, useState } from 'react';
import { Button, Card, Col, ColorPicker, Input, Modal, Popconfirm, Row, Space, Statistic, Tag, Typography, message } from 'antd';
import * as Icons from '@ant-design/icons';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useLiveQuery } from 'dexie-react-hooks';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { useAllClassifies } from '@/hooks/useClassifies';
import Empty from '@/components/Empty';
import { useThemeVariants } from '@/hooks/useVariants';

function renderIcon(name: string) {
  const key = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Outlined';
  const Icon = (Icons as any)[key];
  return Icon ? React.createElement(Icon) : <Icons.TagOutlined />;
}

const ICON_OPTIONS = ['tag','star','heart','fire','trophy','bulb','coffee','car','book','home','rocket','thunderbolt','gift','smile','bell','shopping'];

export default function ClassifyPage() {
  const list = useAllClassifies() || [];
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const tintedBg = (color: string) => isDark ? `${color}1a` : `${color}12`;

  const itemCounts = useLiveQuery(async () => {
    const items = await db.items.toArray();
    return items.reduce<Record<string, number>>((acc, item) => {
      if (!item.deletedAt && item.classifyId) acc[item.classifyId] = (acc[item.classifyId] || 0) + 1;
      return acc;
    }, {});
  }, []) || {};

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState('#1677ff');

  const hiddenCount = list.filter(item => item.hidden).length;
  const activeCount = list.length - hiddenCount;
  const totalBoundItems = useMemo(
    () => Object.values(itemCounts).reduce((sum, count) => sum + count, 0),
    [itemCounts]
  );

  function openNew() {
    setEditing(null);
    setName('');
    setIcon('tag');
    setColor('#1677ff');
    setOpen(true);
  }

  function openEdit(classify: any) {
    setEditing(classify);
    setName(classify.name);
    setIcon(classify.icon);
    setColor(classify.color);
    setOpen(true);
  }

  async function save() {
    if (!name.trim()) return message.warning('请输入分类名称');
    if (editing) {
      await db.classifies.update(editing.id, { name, icon, color });
    } else {
      const order = (list[list.length - 1]?.sortOrder || 0) + 1;
      await db.classifies.add({ id: nanoid(), name, icon, color, sortOrder: order });
    }
    setOpen(false);
  }

  async function del(id: string) {
    const count = await db.items.where('classifyId').equals(id).count();
    if (count > 0) {
      message.warning(`该分类下有 ${count} 条事项，请先迁移`);
      return;
    }
    await db.classifies.delete(id);
  }

  async function move(id: string, delta: number) {
    const classify = await db.classifies.get(id);
    if (!classify) return;
    await db.classifies.update(id, { sortOrder: classify.sortOrder + delta });
  }

  async function toggleHide(classify: any) {
    await db.classifies.update(classify.id, { hidden: !classify.hidden });
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
            : 'linear-gradient(135deg, rgba(15,23,42,0.95), rgba(37,99,235,0.92) 44%, rgba(14,165,233,0.9) 100%)',
          boxShadow: isDark
            ? `0 28px 60px ${accent}24, 0 0 40px ${accent}10`
            : '0 28px 60px rgba(15,23,42,0.16)',
          border: isDark ? `1px solid ${accent}33` : 'none'
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(191,219,254,0.9)' }}>分类工作台</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#fff', textShadow: isDark ? `0 0 20px ${accent}44` : 'none' }}>
              用更清晰的分类结构，让事项系统更耐用
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 16, color: 'rgba(226,232,240,0.84)' }}>
              你可以在这里整理分类、隐藏不常用项、调整顺序，并通过颜色和图标做出更容易识别的层级。
            </Typography.Paragraph>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNew} style={{ borderRadius: 10, boxShadow: `0 8px 20px -4px ${accent}44` }}>新建分类</Button>
          </Col>

          <Col xs={24} lg={9}>
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="分类数" value={list.length} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="启用中" value={activeCount} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false} className="hover-lift" style={{ borderRadius: 20, background: 'rgba(255,255,255,0.14)', transition: 'all 0.3s ease' }}>
                  <Statistic title="已绑定事项" value={totalBoundItems} valueStyle={{ color: '#fff' }} />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {list.length === 0 ? (
        <Card bordered={false} className="anim-fade-in-up" style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
          <Empty text="暂无分类" subtext="先创建一个用于整理事项" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {list.map((classify, index) => (
            <Col key={classify.id} xs={24} md={12} xl={8}>
              <Card
                bordered={false}
                className="hover-lift"
                style={{
                  borderRadius: 24,
                  height: '100%',
                  background: cardBg,
                  border: cardBorder,
                  boxShadow: isDark ? `0 12px 30px -10px rgba(0,0,0,0.3)` : '0 12px 28px rgba(15,23,42,0.06)',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <Space align="start">
                      <div style={{
                        width: 46,
                        height: 46,
                        borderRadius: 16,
                        display: 'grid',
                        placeItems: 'center',
                        background: `${classify.color}18`,
                        color: classify.color,
                        fontSize: 20
                      }}>
                        {renderIcon(classify.icon)}
                      </div>
                      <div>
                        <Typography.Title level={5} style={{ margin: 0, color: titleColor }}>{classify.name}</Typography.Title>
                        <Space wrap size={[8, 8]} style={{ marginTop: 8 }}>
                          {classify.hidden ? <Tag icon={<EyeInvisibleOutlined />} style={{ borderRadius: 6 }}>已隐藏</Tag> : <Tag icon={<EyeOutlined />} style={{ borderRadius: 6 }}>可见</Tag>}
                          <Tag color="blue" style={{ borderRadius: 6, background: isDark ? 'rgba(59,130,246,0.15)' : undefined }}>{itemCounts[classify.id] || 0} 条事项</Tag>
                        </Space>
                      </div>
                    </Space>
                    <Tag style={{ marginInlineEnd: 0, borderRadius: 6 }}>#{index + 1}</Tag>
                  </div>

                  <div style={{ padding: 14, borderRadius: 18, background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.035)', border: isDark ? `1px solid ${accent}15` : '1px solid transparent' }}>
                    <Typography.Text style={{ color: subColor }}>当前配色</Typography.Text>
                    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: classify.color, display: 'inline-block' }} />
                      <Typography.Text style={{ color: titleColor }}>{classify.color}</Typography.Text>
                    </div>
                  </div>

                  <Space wrap>
                    <Button size="small" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => move(classify.id, -1.5)} />
                    <Button size="small" icon={<ArrowDownOutlined />} disabled={index === list.length - 1} onClick={() => move(classify.id, 1.5)} />
                    <Button size="small" onClick={() => toggleHide(classify)}>{classify.hidden ? '显示' : '隐藏'}</Button>
                    <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(classify)}>编辑</Button>
                    <Popconfirm title="确定删除?" onConfirm={() => del(classify.id)}>
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  </Space>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editing ? '编辑分类' : '新建分类'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={save}
      >
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="分类名称" maxLength={20} style={{ marginBottom: 12, borderRadius: 10 }} />
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 8, color: titleColor }}>图标</div>
          <Space wrap>
            {ICON_OPTIONS.map(option => (
              <Button key={option} type={icon === option ? 'primary' : 'default'} onClick={() => setIcon(option)} style={{ borderRadius: 8 }}>
                {renderIcon(option)}
              </Button>
            ))}
          </Space>
        </div>
        <div>
          <div style={{ marginBottom: 8, color: titleColor }}>颜色</div>
          <ColorPicker value={color} onChange={value => setColor(value.toHexString())} showText />
        </div>
      </Modal>
    </Space>
  );
}
