// 时间工具 - 基于 dayjs 封装
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(relativeTime);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.extend(customParseFormat);
dayjs.locale('zh-cn');

export { dayjs };

export const now = () => Date.now();                                   // 当前时间戳
export const today0 = () => dayjs().startOf('day').valueOf();          // 今日 0 点
export const startOfWeek = (d?: number) => dayjs(d).startOf('week').valueOf();
export const endOfWeek = (d?: number) => dayjs(d).endOf('week').valueOf();
export const startOfMonth = (d?: number) => dayjs(d).startOf('month').valueOf();
export const endOfMonth = (d?: number) => dayjs(d).endOf('month').valueOf();
export const startOfYear = (d?: number) => dayjs(d).startOf('year').valueOf();
export const endOfYear = (d?: number) => dayjs(d).endOf('year').valueOf();

export const fmtDate = (t?: number) => t ? dayjs(t).format('YYYY-MM-DD') : '';
export const fmtTime = (t?: number) => t ? dayjs(t).format('HH:mm') : '';
export const fmtDateTime = (t?: number) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '';
export const fmtFromNow = (t?: number) => t ? dayjs(t).fromNow() : '';

export function isSameDay(a: number, b: number): boolean {            // 同一天
  return dayjs(a).isSame(dayjs(b), 'day');
}

export function daysBetween(a: number, b: number): number {           // 相差天数
  return dayjs(b).startOf('day').diff(dayjs(a).startOf('day'), 'day');
}

export function addMinutes(t: number, m: number) { return t + m * 60_000; }
export function addHours(t: number, h: number) { return t + h * 3_600_000; }
export function addDays(t: number, d: number) { return dayjs(t).add(d, 'day').valueOf(); }

export function weekIndex(d: Dayjs): number { return d.day(); }        // 0-6 周日到周六
