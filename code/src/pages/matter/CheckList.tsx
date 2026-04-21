// 清单视图 - 仅 checklist 类型
import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useItems } from '@/hooks/useItems';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';
import { useAppStore } from '@/stores/appStore';

export default function CheckListPage() {
  const items = useItems({ type: 'checklist', pinnedFirst: true }) || [];
  const openItemForm = useAppStore(s => s.openItemForm);
  return (
    <div>
      <Button type="primary" icon={<PlusOutlined />} onClick={() => openItemForm(undefined, 'checklist')} style={{ marginBottom: 16 }}>新建清单</Button>
      {items.length === 0 ? <Empty text="暂无清单" /> : items.map(it => <ItemCard key={it.id} item={it} />)}
    </div>
  );
}
