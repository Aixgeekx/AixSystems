// 全局 UI store - 侧边栏折叠、全局模态框等
import { create } from 'zustand';

interface AppState {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  commandPaletteOpen: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
  itemFormOpen: boolean;
  itemFormId?: string;                                    // 编辑时传 id
  itemFormType?: string;                                  // 新建时默认 type
  openItemForm: (id?: string, type?: string) => void;
  closeItemForm: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  collapsed: false,
  setCollapsed: (v) => set({ collapsed: v }),
  commandPaletteOpen: false,
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set(s => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  itemFormOpen: false,
  itemFormId: undefined,
  itemFormType: undefined,
  openItemForm: (id, type) => set({ itemFormOpen: true, itemFormId: id, itemFormType: type }),
  closeItemForm: () => set({ itemFormOpen: false, itemFormId: undefined, itemFormType: undefined })
}));
