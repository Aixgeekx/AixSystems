// 全部事项 - 按分类聚合 (v0.21.4 主题适配)
import React, { useState } from 'react';
import { Input, Space, Select, Button } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useItems } from '@/hooks/useItems';
import { useClassifies } from '@/hooks/useClassifies';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';
import { ITEM_TYPES } from '@/config/itemTypes';
import type { ItemType } from '@/config/itemTypes';
import { useAppStore } from '@/stores/appStore';

export default function AllPage() {
  const [type, setType] = useState<ItemType | undefined>();
  const [classifyId, setClassifyId] = useState<string | undefined>();
  const [kw, setKw] = useState('');
  const items = useItems({ type, classifyId, pinnedFirst: true }) || [];
  const classifies = useClassifies() || [];
  const openItemForm = useAppStore(s => s.openItemForm);
  const filtered = kw ? items.filter(i => i.title.includes(kw)) : items;

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input prefix={<SearchOutlined />} placeholder="搜索标题" value={kw} onChange={e => setKw(e.target.value)} style={{ width: 200 }} />
        <Select placeholder="所有类型" allowClear value={type} onChange={setType} style={{ width: 140 }}
          options={ITEM_TYPES.map(t => ({ value: t.key, label: t.label }))} />
        <Select placeholder="所有分类" allowClear value={classifyId} onChange={setClassifyId} style={{ width: 140 }}
          options={classifies.map(c => ({ value: c.id, label: c.name }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openItemForm()}>新建</Button>
      </Space>

      {filtered.length === 0 ? <Empty /> : filtered.map(it => <ItemCard key={it.id} item={it} showDate />)}
    </div>
  );
}
