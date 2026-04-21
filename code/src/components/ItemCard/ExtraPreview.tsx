// 按 type 的辅助展示 - 在 ItemCard 底部显示差异化数据片段
import React from 'react';
import { Tag, Progress } from 'antd';
import { daysBetween } from '@/utils/time';
import dayjs from 'dayjs';
import type { Item } from '@/models';

export default function ItemExtraPreview({ item }: { item: Item }) {
  const e = item.extra || {};
  const now = Date.now();

  switch (item.type) {
    case 'loan': {                                          // 贷款还款进度
      const total = Number(e.periods || 0);
      const paid = Math.max(0, Math.floor(daysBetween(item.startTime, now) / 30));
      const pct = total ? Math.min(100, Math.round(paid / total * 100)) : 0;
      return <div style={{ marginTop: 6, maxWidth: 320 }}>
        {e.monthlyPayment && <Tag color="blue">月供 ¥{e.monthlyPayment}</Tag>}
        {total > 0 && <><Progress percent={pct} size="small" format={() => `${paid}/${total} 期`} /></>}
      </div>;
    }
    case 'bill':                                            // 信用卡还款金额
      return (<span style={{ marginLeft: 8 }}>
        {e.amount && <Tag color="geekblue">¥ {e.amount}</Tag>}
        {e.bank && <Tag>{e.bank}</Tag>}
        {e.cardNo && <Tag>尾号 {e.cardNo}</Tag>}
      </span>);
    case 'countdown': {                                     // 距今天数
      const d = daysBetween(now, item.startTime);
      const text = d === 0 ? '就是今天' : d > 0 ? `还有 ${d} 天` : `已过 ${-d} 天`;
      return <Tag color={d >= 0 ? 'red' : 'default'} style={{ marginLeft: 8 }}>{text}</Tag>;
    }
    case 'birthday': {                                      // 年龄
      const y = dayjs(item.startTime).year();
      const age = new Date().getFullYear() - y;
      return age > 0 ? <Tag color="gold" style={{ marginLeft: 8 }}>{age} 岁</Tag> : null;
    }
    case 'anniversary': {                                   // 纪念日已过多少天
      const d = daysBetween(item.startTime, now);
      return <Tag color="pink" style={{ marginLeft: 8 }}>已 {d} 天</Tag>;
    }
    case 'aunt':                                             // 经期信息
      return <span style={{ marginLeft: 8 }}>
        {e.cycleDays && <Tag color="magenta">周期 {e.cycleDays} 天</Tag>}
        {e.durationDays && <Tag>{e.durationDays} 天</Tag>}
      </span>;
    case 'run':                                              // 跑步距离
      return e.distance ? <Tag color="green" style={{ marginLeft: 8 }}>{e.distance} km</Tag> : null;
    case 'book':                                             // 书名
      return <span style={{ marginLeft: 8 }}>
        {e.bookName && <Tag color="purple">《{e.bookName}》</Tag>}
        {e.pages && <Tag>{e.pages} 页</Tag>}
      </span>;
    case 'syllabus':                                         // 课程
      return <span style={{ marginLeft: 8 }}>
        {e.classroom && <Tag>{e.classroom}</Tag>}
        {e.teacher && <Tag>{e.teacher}</Tag>}
      </span>;
    case 'medicine':                                         // 用药
      return <span style={{ marginLeft: 8 }}>
        {e.dosage && <Tag color="lime">{e.dosage}</Tag>}
        {e.frequency && <Tag>{e.frequency}</Tag>}
      </span>;
    default:
      return null;
  }
}
