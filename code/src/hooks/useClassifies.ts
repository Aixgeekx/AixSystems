// 分类 hook - 响应式查询分类列表
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';

export function useClassifies() {
  return useLiveQuery(() =>
    db.classifies.orderBy('sortOrder').filter(c => !c.hidden).toArray(), []
  );
}

export function useAllClassifies() {                                    // 含隐藏项
  return useLiveQuery(() => db.classifies.orderBy('sortOrder').toArray(), []);
}
