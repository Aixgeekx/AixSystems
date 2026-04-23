// 重复事项 - 所有有 repeatRule 的事项 (v0.21.4 主题适配)
import React from 'react';
import { useItems } from '@/hooks/useItems';
import ItemCard from '@/components/ItemCard';
import Empty from '@/components/Empty';

export default function RepeatPage() {
  const items = useItems({ hasRepeat: true }) || [];
  return (
    <div>
      {items.length === 0 ? <Empty text="暂无重复事项" /> : items.map(it => <ItemCard key={it.id} item={it} showDate />)}
    </div>
  );
}
