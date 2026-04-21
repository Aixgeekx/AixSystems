// 空状态占位
import React from 'react';
import { Empty as AntEmpty } from 'antd';

interface Props { text?: string; }

export default function Empty({ text = '暂无数据' }: Props) {
  return <AntEmpty image={AntEmpty.PRESENTED_IMAGE_SIMPLE} description={text} style={{ padding: 40 }} />;
}
