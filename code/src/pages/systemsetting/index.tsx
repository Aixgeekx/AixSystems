// 系统设置 - 通知权限 / 菜单 / 启动页 / 热键 / 版本信息
import React from 'react';
import { Card, Switch, Button, Divider, Select, message, Descriptions, Tag } from 'antd';
import { useSettingsStore } from '@/stores/settingsStore';
import { requestPerm } from '@/utils/notify';
import { APP_VERSION, APP_NAME } from '@/config/constants';
import { MENU_GROUPS } from '@/config/routes';

export default function SystemPage() {
  const { startPage, setKV } = useSettingsStore();

  async function askPerm() {
    const ok = await requestPerm();
    message[ok ? 'success' : 'error'](ok ? '已开启通知' : '通知权限被拒绝');
  }

  const allPages = MENU_GROUPS.flatMap(g => g.children).map(c => ({ value: c.path, label: c.label }));

  return (
    <div style={{ maxWidth: 700 }}>
      <Card title="通知" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>浏览器通知用于事项到期提醒,首次使用需要授权。</div>
        <Button onClick={askPerm}>开启浏览器通知</Button>
      </Card>

      <Card title="启动页" style={{ marginBottom: 16 }}>
        <Select style={{ width: 260 }} value={startPage} onChange={v => setKV('startPage', v)} options={allPages} />
      </Card>

      <Card title="快捷键" style={{ marginBottom: 16 }}>
        <Descriptions column={1} size="small" bordered>
          <Descriptions.Item label="新建事项"><Tag>Ctrl + N</Tag></Descriptions.Item>
          <Descriptions.Item label="全局搜索"><Tag>Ctrl + K</Tag></Descriptions.Item>
          <Descriptions.Item label="折叠侧栏"><Tag>Ctrl + B</Tag></Descriptions.Item>
          <Descriptions.Item label="系统设置"><Tag>Ctrl + ,</Tag></Descriptions.Item>
          <Descriptions.Item label="帮助中心"><Tag>Ctrl + /</Tag></Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="关于">
        <div>{APP_NAME} 本地版</div>
        <div style={{ color: '#888' }}>版本 {APP_VERSION}</div>
        <Divider />
        <div style={{ color: '#888', fontSize: 12 }}>
          数据全部保存在浏览器 IndexedDB,不会上传到任何服务器。清除浏览器数据会丢失,请定期导出备份。
        </div>
      </Card>
    </div>
  );
}
