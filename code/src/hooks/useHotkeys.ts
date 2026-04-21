// 快捷键 - Ctrl+N 新建事项 / Ctrl+K 搜索 / Ctrl+B 折叠侧栏 / Ctrl+, 设置
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { ROUTES } from '@/config/routes';

export function useHotkeys() {
  const nav = useNavigate();
  const { openItemForm, collapsed, setCollapsed } = useAppStore();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (['INPUT', 'TEXTAREA'].includes(tag)) return;       // 输入框内不触发

      if (e.key === 'n') { e.preventDefault(); openItemForm(); }
      else if (e.key === 'k') { e.preventDefault(); nav(ROUTES.SEARCH); }
      else if (e.key === 'b') { e.preventDefault(); setCollapsed(!collapsed); }
      else if (e.key === ',') { e.preventDefault(); nav(ROUTES.SYSTEM); }
      else if (e.key === '/') { e.preventDefault(); nav(ROUTES.HELP); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nav, openItemForm, collapsed, setCollapsed]);
}
