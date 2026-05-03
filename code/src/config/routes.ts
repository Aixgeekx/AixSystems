// 路由常量 - 对齐原版 /home/* 结构 + 新增 dataio/unlock
export const ROUTES = {
  HOME: '/home',
  HOME_DASH: '/home/index',                            // 首页工作台
  AIX: '/home/aix',                                    // Aix 主入口
  TODAY_DAY: '/home/today/myDay',                      // 我的一天
  TODAY_WEEK: '/home/today/myWeek',                    // 我的一周
  TODAY_MONTH: '/home/today/myMonth',                  // 我的一月
  TODAY_YEAR: '/home/today/myYear',                    // 我的一年
  MATTER_ALL: '/home/matter/all',                      // 全部事项
  MATTER_SCHEDULE: '/home/matter/schedule',            // 日程
  MATTER_CHECKLIST: '/home/matter/checkList',          // 清单
  MATTER_IMPORTANCE: '/home/matter/importance',        // 四象限
  MATTER_REPEAT: '/home/matter/repeat',                // 重复
  MEMO: '/home/memo',                                  // 备忘录
  DIARY_CAL: '/home/diary/calendar',                   // 日记日历
  DIARY_LIST: '/home/diary/list',                      // 日记列表
  FOCUS: '/home/absorbed/tomatoAbsorbed',              // 专注
  APP_LOCK: '/home/applicationlock',                   // 应用锁
  DESKTOP_WIDGET: '/home/desktop/dayPlugin',           // 桌面小部件
  THEMESKIN: '/home/themeskin',                        // 主题换肤
  SYSTEM: '/home/systemsetting',                       // 系统设置
  FEEDBACK: '/home/feedback',                          // 意见反馈
  USER: '/home/user',                                  // 用户中心
  SEARCH: '/search/index',                             // 全局搜索
  HELP: '/help',                                       // 帮助
  COMMON_QUESTION: '/commonProblem/index',             // 常见问题
  GUIDE: '/newcomerGuide/newcomerGuide',               // 新手引导
  NEW_FEATURES: '/newFeatures/index',                  // 新功能
  CHARACTERISTIC: '/characteristic/index',             // 特色功能
  DATAIO: '/dataio',                                   // 导入导出(新增)
  HABIT: '/home/habit',                                // 习惯追踪
  GOAL: '/home/goal',                                  // 目标管理
  GROWTH: '/home/growth',                              // 成长仪表盘
  GROWTH_REPORT: '/home/growth/report',                // 智能周期报告
  REVIEW: '/home/review',                              // 复习中心
  DAILY_ORACLE: '/home/dailyOracle',                    // 每日先知
  WORKREST: '/home/workrest',                            // 健康作息
  BACKUP: '/home/backup',                              // 数据备份中心
  DIAGNOSTICS: '/home/diagnostics',                    // 系统诊断
  MIGRATION: '/home/migration',                        // 数据迁移
  SYSINFO: '/home/sysinfo',                            // 系统信息
  STATISTICS: '/home/statistics',                      // 数据统计
  QUICKACTIONS: '/home/quickactions',                  // 快捷操作
  ACHIEVEMENTS: '/home/achievements',                  // 成就中心
  REPORTS: '/home/reports',                            // 报告中心
  FOCUS_HISTORY: '/home/focusHistory',                 // 专注历史
  HABIT_HEATMAP: '/home/habitHeatmap',                 // 习惯热力图
  MOOD_CALENDAR: '/home/moodCalendar',                 // 心情日历
  ITEM_TIMELINE: '/home/itemTimeline',                  // 事项时间线
  FOCUS_STATS: '/home/focusStats',                     // 专注统计详情
  DIARY_STATS: '/home/diaryStats',                     // 日记统计
  GOAL_TIMELINE: '/home/goalTimeline',                 // 目标时间线
  HABIT_STATS: '/home/habitStats',                     // 习惯统计
  FOCUS_RANKING: '/home/focusRanking',                 // 专注排行榜
  DIARY_MOOD_TRENDS: '/home/diaryMoodTrends',          // 日记情绪趋势
  WEEKLY_REVIEW: '/home/weeklyReview',                 // 周复盘
  FOCUS_TRENDS: '/home/focusTrends',                   // 专注趋势
  ITEM_STATS: '/home/itemStats',                       // 事项统计
  FOCUS_MODE_COMPARE: '/home/focusModeCompare',        // 专注模式对比
  GROWTH_MONTHLY: '/home/growthMonthly',               // 成长月报
  DATA_OVERVIEW: '/home/dataOverview',                 // 数据总览
  AGENT: '/home/agent',                                // Agent 中枢
  UNLOCK: '/unlock'                                    // 应用锁解锁页
};

export const MENU_GROUPS = [                            // 左侧菜单分组
  {
    key: 'aix', label: 'Aix 中枢',
    children: [
      { key: 'aix', label: 'Aix 主入口', path: ROUTES.AIX, icon: 'thunderbolt' },
      { key: 'agent', label: 'Agent 中枢', path: ROUTES.AGENT, icon: 'branches' }
    ]
  },
  {
    key: 'home', label: '首页',
    children: [
      { key: 'dashboard', label: '首页工作台', path: ROUTES.HOME_DASH, icon: 'home' }
    ]
  },
  {
    key: 'today', label: '今日规划',
    children: [
      { key: 'myDay', label: '我的一天', path: ROUTES.TODAY_DAY, icon: 'sun' },
      { key: 'myWeek', label: '我的一周', path: ROUTES.TODAY_WEEK, icon: 'week' },
      { key: 'myMonth', label: '我的一月', path: ROUTES.TODAY_MONTH, icon: 'month' },
      { key: 'myYear', label: '我的一年', path: ROUTES.TODAY_YEAR, icon: 'year' }
    ]
  },
  {
    key: 'matter', label: '事项',
    children: [
      { key: 'all', label: '全部', path: ROUTES.MATTER_ALL, icon: 'ordered-list' },
      { key: 'schedule', label: '日程', path: ROUTES.MATTER_SCHEDULE, icon: 'calendar' },
      { key: 'checkList', label: '清单', path: ROUTES.MATTER_CHECKLIST, icon: 'check-square' },
      { key: 'importance', label: '四象限', path: ROUTES.MATTER_IMPORTANCE, icon: 'appstore' },
      { key: 'repeat', label: '重复', path: ROUTES.MATTER_REPEAT, icon: 'reload' }
    ]
  },
  {
    key: 'growth', label: '成长系统',
    children: [
      { key: 'growth', label: '成长仪表盘', path: ROUTES.GROWTH, icon: 'dashboard' },
      { key: 'habit', label: '习惯追踪', path: ROUTES.HABIT, icon: 'check-circle' },
      { key: 'goal', label: '目标管理', path: ROUTES.GOAL, icon: 'trophy' },
      { key: 'review', label: '复习中心', path: ROUTES.REVIEW, icon: 'book' },
      { key: 'achievements', label: '成就中心', path: ROUTES.ACHIEVEMENTS, icon: 'crown' },
      { key: 'reports', label: '报告中心', path: ROUTES.REPORTS, icon: 'file-search' },
      { key: 'focusHistory', label: '专注历史', path: ROUTES.FOCUS_HISTORY, icon: 'history' },
      { key: 'habitHeatmap', label: '习惯热力图', path: ROUTES.HABIT_HEATMAP, icon: 'heat-map' },
      { key: 'moodCalendar', label: '心情日历', path: ROUTES.MOOD_CALENDAR, icon: 'heart' },
      { key: 'itemTimeline', label: '事项时间线', path: ROUTES.ITEM_TIMELINE, icon: 'clock-circle' },
      { key: 'focusStats', label: '专注统计详情', path: ROUTES.FOCUS_STATS, icon: 'bar-chart' },
      { key: 'diaryStats', label: '日记统计', path: ROUTES.DIARY_STATS, icon: 'line-chart' },
      { key: 'goalTimeline', label: '目标时间线', path: ROUTES.GOAL_TIMELINE, icon: 'aim' },
      { key: 'habitStats', label: '习惯统计', path: ROUTES.HABIT_STATS, icon: 'check-circle' },
      { key: 'focusRanking', label: '专注排行榜', path: ROUTES.FOCUS_RANKING, icon: 'crown' },
      { key: 'diaryMoodTrends', label: '情绪趋势', path: ROUTES.DIARY_MOOD_TRENDS, icon: 'heart' },
      { key: 'weeklyReview', label: '周复盘', path: ROUTES.WEEKLY_REVIEW, icon: 'calendar' },
      { key: 'focusTrends', label: '专注趋势', path: ROUTES.FOCUS_TRENDS, icon: 'line-chart' },
      { key: 'itemStats', label: '事项统计', path: ROUTES.ITEM_STATS, icon: 'ordered-list' },
      { key: 'focusModeCompare', label: '专注模式对比', path: ROUTES.FOCUS_MODE_COMPARE, icon: 'bar-chart' },
      { key: 'growthMonthly', label: '成长月报', path: ROUTES.GROWTH_MONTHLY, icon: 'calendar' }
    ]
  },
  {
    key: 'notes', label: '记录',
    children: [
      { key: 'memo', label: '备忘录', path: ROUTES.MEMO, icon: 'file-text' },
      { key: 'diary', label: '日记', path: ROUTES.DIARY_CAL, icon: 'read' }
    ]
  },
  {
    key: 'tools', label: '工具',
    children: [
      { key: 'functions', label: '实用功能', path: '/home/functions', icon: 'appstore' },
      { key: 'dailyOracle', label: '每日先知', path: ROUTES.DAILY_ORACLE, icon: 'bulb' },
      { key: 'workrest', label: '健康作息', path: ROUTES.WORKREST, icon: 'clock-circle' },
      { key: 'backup', label: '数据备份', path: ROUTES.BACKUP, icon: 'cloud-download' },
      { key: 'diagnostics', label: '系统诊断', path: ROUTES.DIAGNOSTICS, icon: 'bug' },
      { key: 'migration', label: '数据迁移', path: ROUTES.MIGRATION, icon: 'mobile' },
      { key: 'sysinfo', label: '系统信息', path: ROUTES.SYSINFO, icon: 'info-circle' },
      { key: 'statistics', label: '数据统计', path: ROUTES.STATISTICS, icon: 'bar-chart' },
      { key: 'dataOverview', label: '数据总览', path: ROUTES.DATA_OVERVIEW, icon: 'dashboard' },
      { key: 'quickactions', label: '快捷操作', path: ROUTES.QUICKACTIONS, icon: 'flag' },
      { key: 'focus', label: '番茄专注', path: ROUTES.FOCUS, icon: 'fire' },
      { key: 'widget', label: '桌面小部件', path: ROUTES.DESKTOP_WIDGET, icon: 'desktop' },
      { key: 'lock', label: '应用锁', path: ROUTES.APP_LOCK, icon: 'lock' },
      { key: 'search', label: '搜索', path: ROUTES.SEARCH, icon: 'search' }
    ]
  },
  {
    key: 'settings', label: '设置',
    children: [
      { key: 'theme', label: '主题换肤', path: ROUTES.THEMESKIN, icon: 'skin' },
      { key: 'classify', label: '分类管理', path: '/home/classify', icon: 'tags' },
      { key: 'menusort', label: '菜单排序', path: '/home/menusort', icon: 'menu' },
      { key: 'trash', label: '回收站', path: '/home/trash', icon: 'delete' },
      { key: 'system', label: '系统设置', path: ROUTES.SYSTEM, icon: 'setting' },
      { key: 'dataio', label: '导入导出', path: ROUTES.DATAIO, icon: 'cloud' },
      { key: 'feedback', label: '意见反馈', path: ROUTES.FEEDBACK, icon: 'message' },
      { key: 'user', label: '个人资料', path: ROUTES.USER, icon: 'user' },
      { key: 'help', label: '帮助中心', path: ROUTES.HELP, icon: 'question-circle' }
    ]
  }
];
