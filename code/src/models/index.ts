// 核心数据模型 - 统一 Item 超集 + 独立 Diary/Memo 等
import type { ItemType } from '@/config/itemTypes';

export interface Reminder {                                // 单条提醒
  offsetMs: number;                                        // 相对事项开始时间的提前量(负数)
  label?: string;                                          // 准时/提前N分钟显示名
}

export interface Attachment {                              // 附件引用
  id: string;
  name: string;
  mime: string;
  size: number;
}

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
  completeTime?: number;
}

export type CompleteStatus = 'pending' | 'done' | 'overdue' | 'postponed' | 'failed';

export interface Item {                                    // 统一事项模型 (所有 17 种事项共用表)
  id: string;
  type: ItemType;
  title: string;
  description?: string;

  startTime: number;                                       // Unix ms
  endTime?: number;
  allDay: boolean;
  isLunar: boolean;

  repeatRule?: string;                                     // RRULE 字符串 或 'memory_curve'
  repeatEndTime?: number;
  skipHoliday?: boolean;
  skipWorkday?: boolean;

  reminders: Reminder[];
  classifyId?: string;
  tagIds?: string[];
  importance?: 0 | 1 | 2 | 3;                              // 四象限
  attachments?: Attachment[];
  location?: { lat: number; lng: number; name: string };
  weather?: string;
  mood?: string;

  completeStatus: CompleteStatus;
  completeTime?: number;
  impression?: string;                                     // 完成感想

  subtasks?: Subtask[];
  parentId?: string;
  pinned?: boolean;
  deletedAt?: number;

  extra?: Record<string, any>;                             // 每种 type 特有字段
  createdAt: number;
  updatedAt: number;
}

export interface Classify {                                // 事项分类
  id: string;
  name: string;
  icon: string;
  color: string;
  sortOrder: number;
  folderId?: string;
  hidden?: boolean;
}

export interface Folder {                                  // 文件夹(嵌套)
  id: string;
  name: string;
  parentId?: string;
  kind: 'classify' | 'memo' | 'diary';
  sortOrder: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Diary {                                   // 日记
  id: string;
  title?: string;
  content: string;                                         // TipTap JSON 或 HTML
  date: number;                                            // 当日 0 点
  mood?: string;
  weather?: string;
  location?: { lat: number; lng: number; name: string };
  tagIds?: string[];
  attachments?: Attachment[];
  paperId?: string;                                        // 日记本
  pinned?: boolean;
  encrypted?: boolean;
  cipher?: string;                                         // 加密后的 content
  deletedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Memo {                                    // 备忘录
  id: string;
  title?: string;
  content: string;
  folderId?: string;
  tagIds?: string[];
  pinned?: boolean;
  encrypted?: boolean;
  cipher?: string;
  remindAt?: number;
  deletedAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface FocusSession {                            // 单次专注记录
  id: string;
  mode: 'countdown' | 'stopwatch' | 'pomodoro';
  title: string;
  itemId?: string;                                         // 关联事项
  focusRepeatId?: string;
  plannedMs: number;
  actualMs: number;
  startTime: number;
  endTime: number;
  giveUp?: boolean;
  strictMode?: boolean;
  pomodoroCount?: number;
  impression?: string;
  createdAt: number;
}

export interface FocusRepeat {                             // 可重复专注模板
  id: string;
  title: string;
  mode: 'countdown' | 'stopwatch' | 'pomodoro';
  plannedMs: number;
  restMs?: number;
  repeatRule?: string;
  strictMode?: boolean;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
}

export interface ReminderQueueItem {                        // 提醒队列(加速扫描)
  id: string;
  itemId: string;
  fireAt: number;                                           // 触发时间
  fired: boolean;
  label?: string;
  reviewAt?: number;
  completedAt?: number;
  reviewFeedback?: 'mastered' | 'fuzzy';
  reinforcementFromId?: string;
  curveDay?: number;
}

export interface ThemeRecord {                              // 主题记录
  key: string;
  label: string;
  isBuiltIn: boolean;
  brightness?: number;                                      // 0-100
  blur?: number;                                            // 0-100
  active?: boolean;
}

export interface Setting {                                  // 单条 KV 设置
  key: string;
  value: any;
}

export interface UserProfile {                              // 本地单用户
  id: 1;
  nickname: string;
  avatar?: string;                                          // base64
  gender?: 'male' | 'female' | 'other';
  signature?: string;
  invitationCode?: string;
}

export interface EventLog {                                 // 本地日志 / 意见反馈
  id: string;
  level: 'info' | 'warn' | 'error' | 'feedback';
  message: string;
  detail?: any;
  createdAt: number;
}

export interface CacheKV {                                  // 杂项 KV
  key: string;
  value: any;
}

export interface AttachmentBlob {                           // 附件 Blob
  id: string;
  itemId?: string;
  name: string;
  mime: string;
  size: number;
  blob: Blob;
  createdAt: number;
}

export interface Habit {                                     // 习惯
  id: string;
  name: string;
  icon?: string;
  color: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  weekDays?: number[];
  sortOrder: number;
  deletedAt?: number;
  extra?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface HabitLog {                                  // 习惯打卡记录
  id: string;
  habitId: string;
  date: number;
  count: number;
  note?: string;
  createdAt: number;
}

export interface Goal {                                      // 目标
  id: string;
  title: string;
  description?: string;
  color: string;
  status: 'active' | 'completed' | 'archived';
  targetDate?: number;
  milestones?: { title: string; done: boolean }[];
  sortOrder: number;
  deletedAt?: number;
  createdAt: number;
  updatedAt: number;
}
