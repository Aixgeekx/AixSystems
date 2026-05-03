// 每日先知 - 天气时段 + 万年历聚合页
import React from 'react';
import { Card, Col, Progress, Row, Segmented, Space, Tag, Typography } from 'antd';
import { CalendarOutlined, CloudOutlined, CompassOutlined, ShareAltOutlined, VideoCameraOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useItems } from '@/hooks/useItems';
import { useLunar } from '@/hooks/useLunar';
import { useThemeVariants } from '@/hooks/useVariants';
import { WEEK_SHORT } from '@/config/constants';

const HOURS = [3, 4, 5, 6, 7, 8, 9].map((hour, index) => ({ hour, temp: [15, 15, 14, 15, 18, 15, 20][index] }));
const DAYS = Array.from({ length: 15 }, (_, index) => dayjs('2026-04-25').add(index, 'day'));

export default function DailyOraclePage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const today = dayjs('2026-04-25');
  const lunar = useLunar(today.valueOf());
  const items = useItems({ startBetween: [today.startOf('day').valueOf(), today.endOf('day').valueOf()], pinnedFirst: true }) || [];
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.94)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const titleColor = isDark ? '#f8fafc' : '#0f172a';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const holidays = new Set(['2026-04-04', '2026-04-05', '2026-04-06']);

  return (
    <Space direction="vertical" size={18} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 30,
        overflow: 'hidden',
        background: isDark ? `linear-gradient(135deg, ${accent}22, rgba(8,12,24,0.96))` : 'linear-gradient(135deg, #60a5fa, #2563eb 52%, #0f172a)',
        border: isDark ? `1px solid ${accent}33` : 'none',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(37,99,235,0.18)'
      }} bodyStyle={{ padding: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}><CompassOutlined /> 天心区 · 晴 · 降雨概率 0%</Typography.Text>
            <Typography.Title level={1} style={{ margin: '10px 0 4px', color: '#fff', fontSize: 58 }}>15°</Typography.Title>
            <Typography.Text style={{ color: 'rgba(226,232,240,0.86)' }}>14° / 28° · 适合晨读、出行与低强度训练</Typography.Text>
          </div>
          <Space align="start" size={10}>
            <Tag color="blue" icon={<CloudOutlined />} style={{ borderRadius: 999 }}>逐时预报</Tag>
            <Tag color="purple" icon={<ShareAltOutlined />} style={{ borderRadius: 999 }}>分享</Tag>
            <Tag color="gold" icon={<VideoCameraOutlined />} style={{ borderRadius: 999 }}>记录</Tag>
          </Space>
        </div>
        <Segmented options={['逐时预报', '15天预报']} defaultValue="逐时预报" style={{ marginTop: 18, borderRadius: 12 }} />
        <Row gutter={[10, 10]} style={{ marginTop: 16 }}>
          {HOURS.map(row => (
            <Col xs={12} sm={8} md={6} lg={3} key={row.hour}>
              <div style={{ borderRadius: 18, padding: 14, textAlign: 'center', background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.16)' }}>
                <div style={{ color: 'rgba(226,232,240,0.8)', fontSize: 12 }}>{row.hour}:00</div>
                <CloudOutlined style={{ color: '#fde68a', fontSize: 24, margin: '10px 0' }} />
                <div style={{ color: '#fff', fontWeight: 800 }}>{row.temp}°</div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder }}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div>
                <Typography.Text style={{ color: subColor }}><CalendarOutlined /> 万年历</Typography.Text>
                <Typography.Title level={3} style={{ margin: '4px 0 0', color: titleColor }}>2026 / 04 · {lunar.text || '农历'}</Typography.Title>
              </div>
              <Row gutter={[8, 8]}>
                {DAYS.map(day => {
                  const active = day.isSame(today, 'day');
                  const rest = holidays.has(day.format('YYYY-MM-DD'));
                  return (
                    <Col span={8} sm={6} md={4} key={day.valueOf()}>
                      <div style={{ borderRadius: 16, padding: 10, textAlign: 'center', background: active ? accent : (isDark ? 'rgba(255,255,255,0.06)' : '#f8fafc'), color: active ? '#fff' : titleColor, border: `1px solid ${active ? accent : (isDark ? `${accent}22` : '#e2e8f0')}` }}>
                        <div style={{ fontSize: 12, opacity: 0.72 }}>周{WEEK_SHORT[day.day()]}</div>
                        <div style={{ fontSize: 22, fontWeight: 900 }}>{day.date()}</div>
                        <div style={{ fontSize: 11, color: active ? '#fff' : rest ? '#ef4444' : subColor }}>{rest ? '休' : '班'}</div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} style={{ borderRadius: 24, background: cardBg, border: cardBorder, height: '100%' }}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Typography.Title level={4} style={{ margin: 0, color: titleColor }}>今日先知摘要</Typography.Title>
              <div style={{ borderRadius: 18, padding: 14, background: isDark ? `${accent}12` : '#eff6ff' }}>
                <Typography.Text style={{ color: subColor }}>节日</Typography.Text>
                <Typography.Title level={5} style={{ margin: '4px 0 0', color: titleColor }}>愚人节 · 清明节 · {lunar.term || '春季节气窗口'}</Typography.Title>
              </div>
              <div style={{ borderRadius: 18, padding: 14, background: isDark ? 'rgba(34,197,94,0.1)' : '#ecfdf5' }}>
                <Typography.Text style={{ color: subColor }}>当天事项</Typography.Text>
                <Typography.Title level={5} style={{ margin: '4px 0 10px', color: titleColor }}>{items.length} 个事项待安排</Typography.Title>
                <Progress percent={Math.min(100, items.filter(item => item.completeStatus === 'done').length / Math.max(1, items.length) * 100)} showInfo={false} strokeColor="#22c55e" />
              </div>
              {['上午适合困难科目', '下午适合阅读复盘', '晚间适合健身和整理'].map(text => <Tag key={text} color="cyan" style={{ width: 'fit-content', borderRadius: 999 }}>{text}</Tag>)}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
