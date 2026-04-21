// 课程表网格 - 7 天 × N 节的时间表
import React from 'react';
import { Card, Typography } from 'antd';
import { useItems } from '@/hooks/useItems';
import type { Item } from '@/models';
import { WEEK_FULL } from '@/config/constants';
import dayjs from 'dayjs';
import { useAppStore } from '@/stores/appStore';
import { useNavigate } from 'react-router-dom';

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

      <Card size="small" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={{ width: 80, padding: 8, background: '#fafafa', border: '1px solid #eee' }}>节次</th>
              {WEEK_FULL.slice(1).concat(WEEK_FULL[0]).map(w => (
                <th key={w} style={{ padding: 8, background: '#fafafa', border: '1px solid #eee' }}>{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((p, r) => (
              <tr key={r}>
                <td style={{ padding: 8, border: '1px solid #eee', background: '#fafafa', textAlign: 'center' }}>
                  <div style={{ fontWeight: 500 }}>{p.label}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{p.start}-{p.end}</div>
                </td>
                {Array.from({ length: 7 }).map((_, c) => {
                  const cell = grid[r][c];
                  return (
                    <td key={c} onClick={() => cell ? openItemForm(cell.id) : openItemForm(undefined, 'syllabus')}
                      style={{ padding: 6, border: '1px solid #eee', height: 60, cursor: 'pointer',
                        background: cell ? '#e6f4ff' : '#fff', verticalAlign: 'top' }}>
                      {cell && <>
                        <div style={{ fontWeight: 500 }}>{cell.title}</div>
                        <div style={{ fontSize: 11, color: '#666' }}>{cell.extra?.classroom} {cell.extra?.teacher}</div>
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
