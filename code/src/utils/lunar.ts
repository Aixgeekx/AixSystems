// 农历工具 - 基于 lunar-javascript
import { Lunar, Solar } from 'lunar-javascript';
import { LUNAR_DAY, LUNAR_MONTH } from '@/config/festivals';

export function solar2Lunar(t: number): { year: number; month: number; day: number; monthName: string; dayName: string; yearGanZhi: string; animal: string } {
  const d = new Date(t);
  const solar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const lunar = solar.getLunar();
  return {
    year: lunar.getYear(),
    month: lunar.getMonth(),
    day: lunar.getDay(),
    monthName: LUNAR_MONTH[Math.abs(lunar.getMonth()) - 1] + '月',
    dayName: LUNAR_DAY[lunar.getDay() - 1],
    yearGanZhi: lunar.getYearInGanZhi(),
    animal: lunar.getYearShengXiao()
  };
}

export function lunar2SolarTime(year: number, month: number, day: number): number {
  const lunar = Lunar.fromYmd(year, month, day);
  const solar = lunar.getSolar();
  return new Date(solar.getYear(), solar.getMonth() - 1, solar.getDay()).getTime();
}

export function getSolarTerm(t: number): string | null {              // 当日节气
  try {
    const d = new Date(t);
    const solar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const term = solar.getLunar().getJieQi();
    return term || null;
  } catch { return null; }
}

export function getLunarFestival(t: number): string | null {          // 当日农历节日
  try {
    const d = new Date(t);
    const solar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const arr = solar.getLunar().getFestivals();
    return arr.length ? arr[0] : null;
  } catch { return null; }
}
