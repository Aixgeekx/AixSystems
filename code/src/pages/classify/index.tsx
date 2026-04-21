// 分类管理页 - 新增/编辑/删除/排序/图标/颜色
import React, { useState } from 'react';
import { Button, Card, Space, Modal, Input, message, ColorPicker, Tag, Popconfirm } from 'antd';
import * as Icons from '@ant-design/icons';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { nanoid } from 'nanoid';
import { db } from '@/db';
import { useAllClassifies } from '@/hooks/useClassifies';
import Empty from '@/components/Empty';

function renderIcon(name: string) {                             // AntD 图标动态解析
  const k = name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('') + 'Outlined';
  const I = (Icons as any)[k];
  return I ? React.createElement(I) : <Icons.TagOutlined />;
}

export default function ClassifyPage() {
  const list = useAllClassifies() || [];
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState('#1677ff');

  function openNew() { setEditing(null); setName(''); setIcon('tag'); setColor('#1677ff'); setOpen(true); }
  function openEdit(c: any) { setEditing(c); setName(c.name); setIcon(c.icon); setColor(c.color); setOpen(true); }

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
      message.warning(`该分类下有 ${count} 条事项,请先迁移`);
      return;
    }
    await db.classifies.delete(id);
  }

  async function move(id: string, delta: number) {
    const c = await db.classifies.get(id);
    if (!c) return;
    await db.classifies.update(id, { sortOrder: c.sortOrder + delta });
  }

  async function toggleHide(c: any) {
    await db.classifies.update(c.id, { hidden: !c.hidden });
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <Button type="primary" icon={<PlusOutlined />} onClick={openNew} style={{ marginBottom: 16 }}>新建分类</Button>
      {list.length === 0 ? <Empty text="暂无分类" /> :
        list.map((c, i) => (
          <Card key={c.id} size="small" style={{ marginBottom: 8 }} styles={{ body: { padding: '10px 16px' }}}>
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space>
                <span style={{ color: c.color, fontSize: 18 }}>{renderIcon(c.icon)}</span>
                <strong>{c.name}</strong>
                {c.hidden && <Tag>已隐藏</Tag>}
              </Space>
              <Space>
                <Button size="small" icon={<ArrowUpOutlined />} disabled={i === 0} onClick={() => move(c.id, -1.5)} />
                <Button size="small" icon={<ArrowDownOutlined />} disabled={i === list.length - 1} onClick={() => move(c.id, 1.5)} />
                <Button size="small" onClick={() => toggleHide(c)}>{c.hidden ? '显示' : '隐藏'}</Button>
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(c)} />
                <Popconfirm title="确定删除?" onConfirm={() => del(c.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            </Space>
          </Card>
        ))
      }

      <Modal title={editing ? '编辑分类' : '新建分类'} open={open} onCancel={() => setOpen(false)} onOk={save}>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="分类名称" maxLength={20} style={{ marginBottom: 12 }} />
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 4 }}>图标</div>
          <Space wrap>
            {['tag','star','heart','fire','trophy','bulb','coffee','car','book','home','rocket','thunderbolt','gift','smile','bell','shopping'].map(n => (
              <Button key={n} type={icon === n ? 'primary' : 'default'} onClick={() => setIcon(n)}>{renderIcon(n)}</Button>
            ))}
          </Space>
        </div>
        <div>
          <div style={{ marginBottom: 4 }}>颜色</div>
          <ColorPicker value={color} onChange={c => setColor(c.toHexString())} showText />
        </div>
      </Modal>
    </div>
  );
}
