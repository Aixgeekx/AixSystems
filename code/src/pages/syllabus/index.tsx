// 课程表网格 - 工作台风格 (v0.24.0 完善升级)
import React from 'react';
import { Button, Card, Col, Row, Space, Statistic, Tag, Typography } from 'antd';
import { ScheduleOutlined, PlusOutlined, BookOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useItems } from '@/hooks/useItems';
import type { Item } from '@/models';
import { WEEK_FULL } from '@/config/constants';
import dayjs from 'dayjs';
import { useAppStore } from '@/stores/appStore';
import { useThemeVariants } from '@/hooks/useVariants';

const PERIODS = [
  { label: '第 1 节', start: '08:00', end: '08:45' },
  { label: '第 2 节', start: '08:55', end: '09:40' },
  { label: '第 3 节', start: '10:00', end: '10:45' },
  { label: '第 4 节', start: '10:55', end: '11:40' },
  { label: '第 5 节', start: '14:00', end: '14:45' },
  { label: '第 6 节', start: '14:55', end: '15:40' },
  { label: '第 7 节', start: '16:00', end: '16:45' },
  { label: '第 8 节', start: '19:00', end: '19:45' }
];

function toMin(t: string) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }

export default function SyllabusPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const accent = theme.accent;
  const cardBg = isDark ? 'rgba(10,14,28,0.72)' : 'rgba(255,255,255,0.92)';
  const cardBorder = isDark ? `1px solid ${accent}22` : '1px solid rgba(255,255,255,0.8)';
  const subColor = isDark ? 'rgba(226,232,240,0.74)' : '#64748b';
  const items = useItems({ type: 'syllabus' }) || [];
  const { openItemForm } = useAppStore();

  const grid: (Item | null)[][] = Array.from({ length: 8 }, () => Array(7).fill(null));
  const uniqueCourses = new Set<string>();
  for (const it of items) {
    uniqueCourses.add(it.title);
    const d = dayjs(it.startTime);
    const dow = d.day();
    const col = dow === 0 ? 6 : dow - 1;
    const mm = d.hour() * 60 + d.minute();
    const row = PERIODS.findIndex(p => mm >= toMin(p.start) - 10 && mm <= toMin(p.end));
    if (row >= 0) grid[row][col] = it;
  }
  const filledCount = grid.flat().filter(Boolean).length;

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} className="anim-fade-in-up" style={{
        borderRadius: 28, overflow: 'hidden',
        background: isDark
          ? `linear-gradient(135deg, ${accent}18 0%, rgba(10,14,28,0.95) 46%, rgba(6,8,18,0.98) 100%)`
          : 'linear-gradient(135deg, rgba(59,130,246,0.94), rgba(99,102,241,0.9) 45%, rgba(15,23,42,0.92) 100%)',
        boxShadow: isDark ? `0 28px 60px ${accent}20` : '0 28px 60px rgba(59,130,246,0.16)',
        border: isDark ? `1px solid ${accent}33` : 'none'
      }} bodyStyle={{ padding: 24 }}>
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={16}>
            <Typography.Text style={{ color: isDark ? `${accent}aa` : 'rgba(224,242,254,0.85)' }}>
              <ScheduleOutlined /> 课程安排
            </Typography.Text>
            <Typography.Title level={2} style={{ margin: '8px 0 10px', color: '#f8fafc' }}>
              课程表 · 一周课程总览
            </Typography.Title>
            <Typography.Paragraph style={{ marginBottom: 14, color: 'rgba(226,232,240,0.84)' }}>
              按「课程表」类型创建事项后会自动排到此网格。点击空白格可添加一节课。
            </Typography.Paragraph>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openItemForm(undefined, 'syllabus')}
              style={{ borderRadius: 12, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}>
              添加课程
            </Button>
          </Col>
          <Col xs={24} lg={8}>
            <Row gutter={[12, 12]}>
              {[
                { label: '课程数', value: uniqueCourses.size, color: '#fff' },
                { label: '排课节数', value: filledCount, color: '#4ade80' }
              ].map(s => (
                <Col span={12} key={s.label}>
                  <Card bordered={false} className="hover-lift" style={{ borderRadius: 18, background: 'rgba(255,255,255,0.14)' }}>
                    <Statistic title={<span style={{ color: 'rgba(226,232,240,0.7)', fontSize: 12 }}>{s.label}</span>} value={s.value} valueStyle={{ color: s.color, fontSize: 24 }} />
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} className="anim-fade-in-up stagger-2" style={{ borderRadius: 24, background: cardBg, border: cardBorder, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 6, minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ width: 80, padding: 10, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: isDark ? '#e2e8f0' : '#475569', fontSize: 13 }}>节次</th>
              {WEEK_FULL.slice(1).concat(WEEK_FULL[0]).map(w => (
                <th key={w} style={{ padding: 10, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: isDark ? '#e2e8f0' : '#475569', fontSize: 13 }}>{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p, r) => (
              <tr key={r}>
                <td style={{ padding: 10, borderRadius: 10, background: isDark ? 'rgba(255,255,255,0.03)' : '#fafafa', textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, color: isDark ? '#e2e8f0' : '#334155', fontSize: 12 }}>{p.label}</div>
                  <div style={{ fontSize: 10, color: subColor }}>{p.start}-{p.end}</div>
                </td>
                {Array.from({ length: 7 }).map((_, c) => {
                  const cell = grid[r][c];
                  return (
                    <td key={c} onClick={() => cell ? openItemForm(cell.id) : openItemForm(undefined, 'syllabus')}
                      style={{
                        padding: 8, borderRadius: 12, height: 64, cursor: 'pointer', verticalAlign: 'top',
                        background: cell ? (isDark ? `${accent}18` : '#eff6ff') : (isDark ? 'rgba(10,14,28,0.3)' : '#fff'),
                        border: cell ? `1px solid ${accent}33` : (isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid #f0f0f0'),
                        transition: 'all 0.25s ease'
                      }}>
                      {cell && <>
                        <div style={{ fontWeight: 600, fontSize: 13, color: isDark ? '#f8fafc' : '#1e293b' }}>{cell.title}</div>
                        <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{cell.extra?.classroom} {cell.extra?.teacher}</div>
                      </>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </Space>
  );
}
