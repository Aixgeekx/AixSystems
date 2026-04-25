// 全局常量配置 - 所有静态值唯一定义处 (遵循 CLAUDE.md: 变量统一配置)
export const APP_NAME = 'AixSystems';                                        // 应用名
export const APP_SUB = '时间管理系统';                                        // 副标题
export const APP_VERSION = '0.29.0';                                         // 版本
export const DB_NAME = 'aixsystems_db';                                      // IndexedDB 库名
export const DB_VERSION = 2;                                                 // schema 版本
export const MAX_REMINDERS = 5;                                              // 单事项最多提醒数
export const REMINDER_POLL_MS = 30_000;                                      // 提醒轮询间隔
export const DEFAULT_PAGE_SIZE = 50;                                         // 列表分页
export const ATTACHMENT_WARN_MB = 20;                                        // 附件警告阈值

export const WEEK_SHORT = ['日', '一', '二', '三', '四', '五', '六'];          // 星期简称
export const WEEK_FULL = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']; // 星期完整
export const MONTHS = ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'];

export const IMPORTANCE_LABELS = ['重要且紧急', '重要不紧急', '不重要紧急', '不重要不紧急'];
export const IMPORTANCE_COLORS = ['#ff4d4f', '#fa8c16', '#1890ff', '#52c41a'];

export const COMPLETE_STATUS_LABELS: Record<string, string> = {              // 完成状态文案
  pending: '未完成', done: '已完成', overdue: '已过期', postponed: '已顺延', failed: '已失败'
};

export const BUILT_IN_CLASSIFY = [                                           // 内置分类 (种子)
  { name: '私事', icon: 'user', color: '#1890ff' },
  { name: '工作', icon: 'briefcase', color: '#13c2c2' },
  { name: '健康', icon: 'heart', color: '#f5222d' },
  { name: '娱乐', icon: 'smile', color: '#fa8c16' },
  { name: '学习', icon: 'book', color: '#722ed1' }
];

export const FOCUS_MODES = ['countdown', 'stopwatch', 'pomodoro'] as const;  // 专注三模式
export const FOCUS_MODE_LABELS: Record<string, string> = {
  countdown: '倒计时专注', stopwatch: '正计时专注', pomodoro: '番茄钟专注'
};

export const WHITE_NOISE_SCENES = ['休息', '打扰', '信息', '洗手间'] as const; // 白噪音场景
