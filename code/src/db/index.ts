// Dexie 数据库 - 单例,所有模块通过此文件访问数据
import Dexie, { Table } from 'dexie';
import { DB_NAME, DB_VERSION } from '@/config/constants';
import type {
  Item, Classify, Folder, Tag, Diary, Memo, FocusSession, FocusRepeat,
  ReminderQueueItem, ThemeRecord, Setting, UserProfile, EventLog, CacheKV, AttachmentBlob,
  Habit, HabitLog, Goal
} from '@/models';

class ShiguangxuDB extends Dexie {
  items!: Table<Item, string>;
  classifies!: Table<Classify, string>;
  folders!: Table<Folder, string>;
  tags!: Table<Tag, string>;
  diaries!: Table<Diary, string>;
  memos!: Table<Memo, string>;
  focusSessions!: Table<FocusSession, string>;
  focusRepeats!: Table<FocusRepeat, string>;
  reminderQueue!: Table<ReminderQueueItem, string>;
  themes!: Table<ThemeRecord, string>;
  settings!: Table<Setting, string>;
  userProfile!: Table<UserProfile, number>;
  eventLog!: Table<EventLog, string>;
  cacheKv!: Table<CacheKV, string>;
  attachments!: Table<AttachmentBlob, string>;
  habits!: Table<Habit, string>;
  habitLogs!: Table<HabitLog, string>;
  goals!: Table<Goal, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      items:         'id, type, startTime, classifyId, deletedAt, pinned, completeStatus, importance',
      classifies:    'id, name, sortOrder, folderId, hidden',
      folders:       'id, parentId, kind, sortOrder',
      tags:          'id, name',
      diaries:       'id, date, pinned, deletedAt, updatedAt',
      memos:         'id, folderId, pinned, deletedAt, updatedAt, remindAt',
      focusSessions: 'id, startTime, itemId, focusRepeatId',
      focusRepeats:  'id, status, updatedAt',
      reminderQueue: 'id, fireAt, fired, itemId',
      themes:        'key, active',
      settings:      'key',
      userProfile:   'id',
      eventLog:      'id, level, createdAt',
      cacheKv:       'key',
      attachments:   'id, itemId, createdAt',
      habits:        'id, name, color, sortOrder, deletedAt',
      habitLogs:     'id, habitId, date, createdAt',
      goals:         'id, title, status, targetDate, sortOrder, deletedAt'
    });
  }
}

export const db = new ShiguangxuDB();                    // 全局单例
