// 健康作息 - 时间段作息模板页
import React from 'react';
import { Button, Card, Col, Row, Space, Tag, Timeline, Typography, message } from 'antd';
import { ClockCircleOutlined, EditOutlined, MenuOutlined, ShareAltOutlined } from '@ant-design/icons';
import { useAppStore } from '@/stores/appStore';
import { useThemeVariants } from '@/hooks/useVariants';

const WORKREST_ROWS = [
  ['07:30-08:00', '起床洗漱护肤', '#38bdf8'],
  ['08:00-08:30', '吃早餐听新闻', '#22c55e'],
  ['08:30-10:00', '思考困难科目', '#8b5cf6'],
  ['10:20-11:50', '练听力练口语', '#6366f1'],
  ['12:00-12:30', '吃午餐', '#f59e0b'],
  ['13:00-14:00', '午休', '#64748b'],
  ['14:00-15:00', '学喜欢的科目', '#06b6d4'],
  ['15:00-15:30', '下午茶', '#f97316'],
  ['15:30-17:30', '阅读看书', '#22c55e'],
  ['17:30-18:30', '吃晚餐', '#fb7185'],
  ['18:45-20:00', '健身 / 减脂 / 塑形', '#ef4444']
];

export default function WorkrestPage() {
  const openItemForm = useAppStore(s => s.openItemForm);
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30,
        background: isDark ? `linear-gradient(135deg, ${accent}20, rgba(8,12,24,0.96))` : 'linear-gradient(135deg, #10b981, #06b6d4 48%, #0f172a)',
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(16,185,129,0.16)'
      }} bodyStyle={{ padding: 22 }}>
        <Row gutter={[18, 18]} align="middle">
          <Col xs={24} lg={15}>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><MenuOutlined /> 健康作息</Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 8px', color: '#fff' }}>哲学嘉假期作息表</Typography.Title>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.82)' }}>把起床、学习、休息、阅读和健身压成连续时间段，减少临时决策损耗。</Typography.Text>
          </Col>
          <Col xs={24} lg={9}>
            <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button icon={<EditOutlined />} onClick={() => openItemForm(undefined, 'clock_workrest')} style={{ borderRadius: 12 }}>编辑作息</Button>
              <Button icon={<ShareAltOutlined />} onClick={() => message.success('已生成本地作息分享摘要')} style={{ borderRadius: 12 }}>分享</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Timeline
              items={WORKREST_ROWS.map(([time, title, color]) => ({
                color,
                dot: <ClockCircleOutlined style={{ color }} />,
                children: (
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                      <Typography.Text style={{ color: subColor }}>{time}</Typography.Text>
                      <Typography.Title level={5} style={{ margin: '4px 0 0', color: titleColor }}>{title}</Typography.Title>
                    </div>
                    <Tag style={{ borderRadius: 999, color, borderColor: `${color}55`, background: isDark ? `${color}18` : `${color}10` }}>执行</Tag>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>作息强度</Typography.Title>
              {[
                ['学习块', '4 段 · 300 分钟', '#8b5cf6'],
                ['恢复块', '3 段 · 120 分钟', '#22c55e'],
                ['生活块', '3 段 · 90 分钟', '#f59e0b'],
                ['训练块', '1 段 · 75 分钟', '#ef4444']
              ].map(([label, value, color]) => (
                <div key={label} style={{ padding: 14, borderRadius: 16, background: isDark ? `${color}14` : `${color}0f`, border: `1px solid ${color}22` }}>
                  <Typography.Text style={{ color: subColor }}>{label}</Typography.Text>
                  <Typography.Title level={5} style={{ margin: '4px 0 0', color }}>{value}</Typography.Title>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
