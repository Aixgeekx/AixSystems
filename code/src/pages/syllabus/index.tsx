// 课程表网格 - 7 天 × N 节的时间表 (v0.21.4 主题适配)
import React from 'react';
import { Card, Typography } from 'antd';
import { useItems } from '@/hooks/useItems';
import type { Item } from '@/models';
import { WEEK_FULL } from '@/config/constants';
import dayjs from 'dayjs';
import { useAppStore } from '@/stores/appStore';
import { useNavigate } from 'react-router-dom';
import { useThemeVariants } from '@/hooks/useVariants';

const { Title, Paragraph } = Typography;

const PERIODS = [                                           // 8 节标准课表
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
  const items = useItems({ type: 'syllabus' }) || [];
  const { openItemForm } = useAppStore();

  // 每个 item 根据 startTime 的星期和小时分配到格子
  const grid: (Item | null)[][] = Array.from({ length: 8 }, () => Array(7).fill(null));
  for (const it of items) {
    const d = dayjs(it.startTime);
    const dow = d.day();                                    // 0-6 周日到周六
    const col = dow === 0 ? 6 : dow - 1;                    // 列 0-6 周一到周日
    const mm = d.hour() * 60 + d.minute();
    const row = PERIODS.findIndex(p => mm >= toMin(p.start) - 10 && mm <= toMin(p.end));
    if (row >= 0) grid[row][col] = it;
  }

  return (
    <div>
      <Typography>
        <Title level={4}>课程表</Title>
        <Paragraph type="secondary">按「课程表」类型创建事项后会自动排到此网格。点击空白格可添加一节课。</Paragraph>
      </Typography>

      <Card size="small" style={{ overflowX: 'auto', background: isDark ? 'rgba(10,14,28,0.5)' : undefined, border: isDark ? '1px solid rgba(255,255,255,0.08)' : undefined }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ width: 80, padding: 8, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee', color: isDark ? '#e2e8f0' : undefined }}>节次</th>
              {WEEK_FULL.slice(1).concat(WEEK_FULL[0]).map(w => (
                <th key={w} style={{ padding: 8, background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee', color: isDark ? '#e2e8f0' : undefined }}>{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p, r) => (
              <tr key={r}>
                <td style={{ padding: 8, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee', background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafa', textAlign: 'center' }}>
                  <div style={{ fontWeight: 500, color: isDark ? '#e2e8f0' : undefined }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: isDark ? '#64748b' : '#888' }}>{p.start}-{p.end}</div>
                </td>
                {Array.from({ length: 7 }).map((_, c) => {
                  const cell = grid[r][c];
                  return (
                    <td key={c} onClick={() => cell ? openItemForm(cell.id) : openItemForm(undefined, 'syllabus')}
                      style={{ padding: 6, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #eee', height: 60, cursor: 'pointer',
                        background: cell ? (isDark ? `${accent}18` : '#e6f4ff') : (isDark ? 'rgba(10,14,28,0.3)' : '#fff'), verticalAlign: 'top', color: isDark ? '#e2e8f0' : undefined }}>
                      {cell && <>
                        <div style={{ fontWeight: 500 }}>{cell.title}</div>
                        <div style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#666' }}>{cell.extra?.classroom} {cell.extra?.teacher}</div>
                      </>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
