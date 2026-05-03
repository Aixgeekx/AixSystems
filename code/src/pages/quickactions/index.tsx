// 快捷操作面板 - 常用功能快速入口
import React from 'react';
import { Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import {
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined, CloudDownloadOutlined,
  DatabaseOutlined, FileTextOutlined, FireOutlined, FlagOutlined, LockOutlined,
  ReadOutlined, ReloadOutlined, SearchOutlined, SettingOutlined, SkinOutlined,
  TrophyOutlined, BulbOutlined, MobileOutlined, BugOutlined, BarChartOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/stores/appStore';
import { ROUTES } from '@/config/routes';
import { useThemeVariants } from '@/hooks/useVariants';

interface QuickAction {
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  path?: string;
  action?: () => void;
}

export default function QuickActionsPage() {
  const nav = useNavigate();
  const openItemForm = useAppStore(s => s.openItemForm);
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;

  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  const quickActions: QuickAction[] = [
    { label: '新建日程', desc: '添加一条日程事项', icon: <CalendarOutlined />, color: '#3b82f6', action: () => openItemForm(undefined, 'schedule') },
    { label: '新建清单', desc: '创建待办清单', icon: <CheckCircleOutlined />, color: '#22c55e', action: () => openItemForm(undefined, 'checklist') },
    { label: '开始专注', desc: '启动番茄钟', icon: <FireOutlined />, color: '#ef4444', path: ROUTES.FOCUS },
    { label: '写日记', desc: '记录今天的心情', icon: <ReadOutlined />, color: '#ec4899', path: ROUTES.DIARY_CAL },
    { label: '备忘录', desc: '快速记录想法', icon: <FileTextOutlined />, color: '#14b8a6', path: ROUTES.MEMO },
    { label: '习惯打卡', desc: '完成今日习惯', icon: <TrophyOutlined />, color: '#f59e0b', path: ROUTES.HABIT },
    { label: '全局搜索', desc: '搜索所有内容', icon: <SearchOutlined />, color: '#6366f1', path: ROUTES.SEARCH },
    { label: '数据备份', desc: '备份本地数据', icon: <CloudDownloadOutlined />, color: '#0ea5e9', path: ROUTES.BACKUP },
    { label: '主题换肤', desc: '切换界面主题', icon: <SkinOutlined />, color: '#a855f7', path: ROUTES.THEMESKIN },
    { label: '系统设置', desc: '配置应用参数', icon: <SettingOutlined />, color: '#94a3b8', path: ROUTES.SYSTEM },
    { label: '数据迁移', desc: '换机迁移助手', icon: <MobileOutlined />, color: '#10b981', path: ROUTES.MIGRATION },
    { label: '系统诊断', desc: '检查系统健康', icon: <BugOutlined />, color: '#8b5cf6', path: ROUTES.DIAGNOSTICS },
    { label: '数据统计', desc: '查看数据分析', icon: <BarChartOutlined />, color: '#f59e0b', path: ROUTES.STATISTICS },
    { label: '应用锁', desc: '保护隐私数据', icon: <LockOutlined />, color: '#6366f1', path: ROUTES.APP_LOCK },
    { label: '每日先知', desc: '天气与日历', icon: <BulbOutlined />, color: '#ff4d6d', path: ROUTES.DAILY_ORACLE },
    { label: '健康作息', desc: '作息时间表', icon: <ClockCircleOutlined />, color: '#14b8a6', path: ROUTES.WORKREST }
  ];

  const handleClick = (action: QuickAction) => {
    if (action.action) action.action();
    else if (action.path) nav(action.path);
  };

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30, overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : 'linear-gradient(135deg, #6366f1, #4f46e5 52%, #0f172a)',
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(99,102,241,0.18)'
      }} bodyStyle={{ padding: 22 }}>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><FlagOutlined /> 快捷操作</Typography.Text>
        <Typography.Title level={2} style={{ margin: '8px 0 8px', color: '#fff' }}>常用功能入口</Typography.Title>
        <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>把高频操作集中到一个页面，减少点击路径。</Typography.Text>
      </Card>

      <Row gutter={[12, 12]}>
        {quickActions.map(action => (
          <Col xs={12} sm={8} md={6} key={action.label}>
            <button
              type="button"
              onClick={() => handleClick(action)}
              style={{
                width: '100%', minHeight: 110, border: cardBorder, borderRadius: 22,
                background: isDark ? `${action.color}18` : '#fff', cursor: 'pointer',
                color: titleColor, transition: 'all 0.3s', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 24px ${action.color}22`; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span style={{ color: action.color, fontSize: 28 }}>{action.icon}</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{action.label}</span>
              <span style={{ color: subColor, fontSize: 12 }}>{action.desc}</span>
            </button>
          </Col>
        ))}
      </Row>
    </Space>
  );
}
