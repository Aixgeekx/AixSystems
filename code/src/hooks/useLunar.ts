// 农历 hook - 按需加载 lunar-javascript，避免全局首包变重
import { useEffect, useState } from 'react';

interface LunarInfo {
  text: string;
  full: string;
  term: string | null;
  festival: string | null;
}

const EMPTY_LUNAR: LunarInfo = {
  text: '',
  full: '',
  term: null,
  festival: null
};

export function useLunar(t: number) {
  const [info, setInfo] = useState<LunarInfo>(EMPTY_LUNAR);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const lunar = await import('@/utils/lunar');
        const result = lunar.solar2Lunar(t);
        if (cancelled) return;
        setInfo({
          text: `${result.monthName}${result.dayName}`,
          full: `${result.yearGanZhi}(${result.animal})年 ${result.monthName}${result.dayName}`,
          term: lunar.getSolarTerm(t),
          festival: lunar.getLunarFestival(t)
        });
      } catch {
        if (!cancelled) setInfo(EMPTY_LUNAR);
      }
    })();

    return () => { cancelled = true; };
  }, [t]);

  return info;
}
