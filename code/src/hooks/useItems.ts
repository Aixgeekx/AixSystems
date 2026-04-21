// 事项查询 hook - 基于 dexie-react-hooks 响应式
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import type { Item } from '@/models';
import type { ItemType } from '@/config/itemTypes';

export function useItems(filter?: {                                   // 事项列表查询
  type?: ItemType | ItemType[];
  classifyId?: string;
  startBetween?: [number, number];
  completeStatus?: Item['completeStatus'];
  includeTrash?: boolean;
  importance?: 0 | 1 | 2 | 3;
  hasRepeat?: boolean;
  pinnedFirst?: boolean;
}) {
  return useLiveQuery(async () => {
    let c = db.items.toCollection();
    const arr = await c.toArray();
    let list = arr.filter(x => filter?.includeTrash ? true : !x.deletedAt);
    if (filter?.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      list = list.filter(x => types.includes(x.type));
    }
    if (filter?.classifyId) list = list.filter(x => x.classifyId === filter.classifyId);
    if (filter?.completeStatus) list = list.filter(x => x.completeStatus === filter.completeStatus);
    if (typeof filter?.importance === 'number') list = list.filter(x => x.importance === filter.importance);
    if (filter?.hasRepeat) list = list.filter(x => !!x.repeatRule);
    if (filter?.startBetween) {
      const [s, e] = filter.startBetween;
      list = list.filter(x => x.startTime >= s && x.startTime <= e);
    }
    list.sort((a, b) => {
      if (filter?.pinnedFirst && !!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return a.startTime - b.startTime;
    });
    return list;
  }, [JSON.stringify(filter)]);
}

export function useItemById(id?: string) {
  return useLiveQuery(() => id ? db.items.get(id) : undefined, [id]);
}
