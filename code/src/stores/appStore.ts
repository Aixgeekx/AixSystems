// 全局 UI store - 侧边栏折叠、全局模态框等
import { create } from 'zustand';

interface AppState {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  itemFormOpen: boolean;
  itemFormId?: string;                                    // 编辑时传 id
  itemFormType?: string;                                  // 新建时默认 type
  openItemForm: (id?: string, type?: string) => void;
  closeItemForm: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  collapsed: false,
  setCollapsed: (v) => set({ collapsed: v }),
  itemFormOpen: false,
  itemFormId: undefined,
  itemFormType: undefined,
  openItemForm: (id, type) => set({ itemFormOpen: true, itemFormId: id, itemFormType: type }),
  closeItemForm: () => set({ itemFormOpen: false, itemFormId: undefined, itemFormType: undefined })
}));
