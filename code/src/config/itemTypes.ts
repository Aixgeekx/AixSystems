// 17 种事项类型元数据 - 所有 type 相关行为的单一来源
export type ItemType =
  | 'schedule' | 'checklist' | 'birthday' | 'anniversary' | 'countdown'
  | 'festival' | 'aunt' | 'bill' | 'loan' | 'medicine'
  | 'clock_wakeup' | 'clock_sleep' | 'clock_workrest'
  | 'run' | 'book' | 'dress' | 'syllabus' | 'work';

export interface ItemTypeMeta {                        // 事项类型元信息
  key: ItemType;
  label: string;
  icon: string;                                        // AntD 图标名
  color: string;
  hasTime: boolean;                                    // 是否有具体时间点
  hasRepeat: boolean;                                  // 是否支持重复规则
  hasLunar: boolean;                                   // 是否支持农历
  extraFields?: string[];                              // 每类特有字段 (extra 对象的 key)
}

export const ITEM_TYPES: ItemTypeMeta[] = [
  { key: 'schedule',     label: '日程',       icon: 'calendar',     color: '#3B82F6', hasTime: true,  hasRepeat: true,  hasLunar: true },
  { key: 'checklist',    label: '清单',       icon: 'check-square', color: '#10B981', hasTime: false, hasRepeat: false, hasLunar: false },
  { key: 'birthday',     label: '生日',       icon: 'gift',         color: '#F59E0B', hasTime: false, hasRepeat: false, hasLunar: true },
  { key: 'anniversary',  label: '纪念日',     icon: 'heart',        color: '#EC4899', hasTime: false, hasRepeat: false, hasLunar: true },
  { key: 'countdown',    label: '倒数日',     icon: 'hourglass',    color: '#EF4444', hasTime: true,  hasRepeat: false, hasLunar: true },
  { key: 'festival',     label: '节日',       icon: 'flag',         color: '#F97316', hasTime: false, hasRepeat: true,  hasLunar: true },
  { key: 'aunt',         label: '生理期',     icon: 'medicine-box', color: '#DB2777', hasTime: false, hasRepeat: true,  hasLunar: false, extraFields: ['cycleDays','durationDays'] },
  { key: 'bill',         label: '信用卡还款', icon: 'credit-card',  color: '#6366F1', hasTime: true,  hasRepeat: true,  hasLunar: false, extraFields: ['cardNo','amount','bank'] },
  { key: 'loan',         label: '贷款',       icon: 'bank',         color: '#0EA5E9', hasTime: true,  hasRepeat: true,  hasLunar: false, extraFields: ['totalAmount','periods','monthlyPayment'] },
  { key: 'medicine',     label: '吃药',       icon: 'medicine-box', color: '#84CC16', hasTime: true,  hasRepeat: true,  hasLunar: false, extraFields: ['dosage','frequency'] },
  { key: 'clock_wakeup', label: '起床闹钟',   icon: 'sun',          color: '#FACC15', hasTime: true,  hasRepeat: true,  hasLunar: false },
  { key: 'clock_sleep',  label: '睡眠闹钟',   icon: 'moon',         color: '#6366F1', hasTime: true,  hasRepeat: true,  hasLunar: false },
  { key: 'clock_workrest',label:'作息',        icon: 'clock-circle', color: '#14B8A6', hasTime: true,  hasRepeat: true,  hasLunar: false, extraFields: ['schedule'] },
  { key: 'run',          label: '跑步',       icon: 'thunderbolt',  color: '#22C55E', hasTime: true,  hasRepeat: true,  hasLunar: false, extraFields: ['distance','duration'] },
  { key: 'book',         label: '读书',       icon: 'book',         color: '#8B5CF6', hasTime: true,  hasRepeat: true,  hasLunar: false, extraFields: ['bookName','pages'] },
  { key: 'dress',        label: '穿衣搭配',   icon: 'skin',         color: '#F472B6', hasTime: false, hasRepeat: true,  hasLunar: false },
  { key: 'syllabus',     label: '课程表',     icon: 'read',         color: '#0891B2', hasTime: true,  hasRepeat: true,  hasLunar: false, extraFields: ['classroom','teacher','weeks'] },
  { key: 'work',         label: '上班打卡',   icon: 'solution',     color: '#64748B', hasTime: true,  hasRepeat: true,  hasLunar: false }
];

export const ITEM_TYPE_MAP: Record<ItemType, ItemTypeMeta> =                 // 查询映射
  ITEM_TYPES.reduce((m, t) => { m[t.key] = t; return m; }, {} as any);
