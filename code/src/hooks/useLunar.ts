// 农历 hook - 给到任意时间戳返回中文农历描述
import { useMemo } from 'react';
import { solar2Lunar, getSolarTerm, getLunarFestival } from '@/utils/lunar';

export function useLunar(t: number) {
  return useMemo(() => {
    try {
      const l = solar2Lunar(t);
      return {
        text: `${l.monthName}${l.dayName}`,
        full: `${l.yearGanZhi}(${l.animal})年 ${l.monthName}${l.dayName}`,
        term: getSolarTerm(t),
        festival: getLunarFestival(t)
      };
    } catch { return { text: '', full: '', term: null, festival: null }; }
  }, [t]);
}
