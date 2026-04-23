// 意见反馈 - 写入本地 eventLog 表 (v0.21.4 主题适配)
import React, { useState } from 'react';
import { Card, Input, Button, Select, List, Tag, message } from 'antd';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db';
import { nanoid } from 'nanoid';
import { fmtDateTime } from '@/utils/time';
import { useThemeVariants } from '@/hooks/useVariants';

const { TextArea } = Input;

export default function FeedbackPage() {
  const { theme } = useThemeVariants();
  const isDark = theme.style === 'dark' || theme.style === 'cyberpunk' || theme.key === 'minimal_dark';
  const subColor = isDark ? '#64748b' : '#999';
  const [type, setType] = useState('优化');
  const [content, setContent] = useState('');
  const logs = useLiveQuery(() => db.eventLog.where('level').equals('feedback').reverse().sortBy('createdAt'), []) || [];

  async function submit() {
    if (!content.trim()) return message.warning('请填写内容');
    await db.eventLog.add({
      id: nanoid(), level: 'feedback', message: `[${type}] ${content}`, createdAt: Date.now()
    });
    message.success('已记录到本地日志');
    setContent('');
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <Card title="意见反馈 (写入本地日志)">
        <Select value={type} onChange={setType} style={{ width: 140, marginBottom: 8 }}
          options={['优化', '新需求', 'bug', '其他'].map(v => ({ value: v, label: v }))} />
        <TextArea value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="请输入问题描述或建议" />
        <Button type="primary" onClick={submit} style={{ marginTop: 12 }}>提交</Button>
      </Card>

      <Card title="历史反馈" style={{ marginTop: 16 }}>
        {logs.length === 0 ? <div style={{ color: subColor }}>暂无</div> :
          <List dataSource={logs} renderItem={(l: any) => (
            <List.Item><Tag>{fmtDateTime(l.createdAt)}</Tag> {l.message}</List.Item>
          )} />
        }
      </Card>
    </div>
  );
}
