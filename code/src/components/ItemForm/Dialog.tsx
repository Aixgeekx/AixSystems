// 事项表单弹窗 - 统一的新建/编辑入口,各 type 动态渲染 extra 字段
import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, Switch, InputNumber, Radio, message } from 'antd';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import { useAppStore } from '@/stores/appStore';
import { db } from '@/db';
import { ITEM_TYPES, ITEM_TYPE_MAP } from '@/config/itemTypes';
import type { ItemType } from '@/config/itemTypes';
import { useClassifies } from '@/hooks/useClassifies';
import RepeatPicker from '@/components/RepeatPicker';
import ReminderPicker from '@/components/ReminderPicker';
import ExtraFields from './ExtraFields';
import { rescheduleItemReminders } from '@/hooks/useReminder';
import { IMPORTANCE_LABELS } from '@/config/constants';
import type { Item } from '@/models';

const { TextArea } = Input;

export default function ItemFormDialog() {
  const { itemFormOpen, itemFormId, itemFormType, closeItemForm } = useAppStore();
  const [form] = Form.useForm();
  const [type, setType] = useState<ItemType>('schedule');
  const classifies = useClassifies() || [];

  useEffect(() => {
    if (!itemFormOpen) return;
    (async () => {
      if (itemFormId) {
        const it = await db.items.get(itemFormId);
        if (it) {
          setType(it.type);
          form.setFieldsValue({
            ...it,
            startTime: it.startTime ? dayjs(it.startTime) : null,
            endTime: it.endTime ? dayjs(it.endTime) : null
          });
        }
      } else {
        const initType = (itemFormType as ItemType) || 'schedule';
        setType(initType);
        form.resetFields();
        form.setFieldsValue({
          type: initType, startTime: dayjs().startOf('hour').add(1, 'hour'),
          allDay: false, isLunar: false, completeStatus: 'pending', reminders: [], importance: undefined
        });
      }
    })();
  }, [itemFormOpen, itemFormId, itemFormType]);

  const meta = ITEM_TYPE_MAP[type];

  async function onOk() {
    try {
      const v = await form.validateFields();
      const nowTs = Date.now();
      const item: Item = {
        id: itemFormId || nanoid(),
        type,
        title: v.title,
        description: v.description,
        startTime: v.startTime?.valueOf() || nowTs,
        endTime: v.endTime?.valueOf(),
        allDay: !!v.allDay,
        isLunar: !!v.isLunar,
        repeatRule: v.repeatRule,
        reminders: v.reminders || [],
        classifyId: v.classifyId,
        importance: v.importance,
        completeStatus: v.completeStatus || 'pending',
        extra: v.extra,
        createdAt: itemFormId ? (await db.items.get(itemFormId))?.createdAt || nowTs : nowTs,
        updatedAt: nowTs
      };
      await db.items.put(item);
      await rescheduleItemReminders(item.id);
      message.success(itemFormId ? '修改成功' : '事项创建成功');
      closeItemForm();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('保存失败: ' + (e?.message || e));
    }
  }

  async function onDelete() {
    if (!itemFormId) return;
    await db.items.update(itemFormId, { deletedAt: Date.now() });
    await db.reminderQueue.where('itemId').equals(itemFormId).delete();
    message.success('删除成功');
    closeItemForm();
  }

  return (
    <Modal title={itemFormId ? '编辑事项' : '添加事项'} open={itemFormOpen} onCancel={closeItemForm}
      onOk={onOk} width={640} destroyOnClose
      footer={[
        itemFormId ? <a key="del" onClick={onDelete} style={{ color: '#ff4d4f', marginRight: 'auto' }}>删除</a> : null,
        <a key="cancel" onClick={closeItemForm}>取消</a>,
        <a key="ok" onClick={onOk} style={{ marginLeft: 16, color: '#1677ff', fontWeight: 500 }}>保存</a>
      ]}>
      <Form form={form} layout="vertical">
        <Form.Item label="类型" name="type">
          <Select value={type} onChange={v => setType(v)} options={ITEM_TYPES.map(t => ({ value: t.key, label: t.label }))} />
        </Form.Item>
        <Form.Item label="标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
          <Input placeholder="写点什么..." maxLength={100} />
        </Form.Item>

        {meta.hasTime && (
          <>
            <Form.Item label="开始时间" name="startTime" rules={[{ required: true, message: '请选择时间' }]}>
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="结束时间" name="endTime">
              <DatePicker showTime format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="全天" name="allDay" valuePropName="checked"><Switch /></Form.Item>
          </>
        )}
        {!meta.hasTime && (
          <Form.Item label="日期" name="startTime">
            <DatePicker format="YYYY-MM-DD" style={{ width: '100%' }} />
          </Form.Item>
        )}

        {meta.hasLunar && (
          <Form.Item label="农历" name="isLunar" valuePropName="checked"><Switch /></Form.Item>
        )}

        {meta.hasRepeat && (
          <Form.Item label="重复" name="repeatRule">
            <RepeatPicker />
          </Form.Item>
        )}

        <Form.Item label="提醒" name="reminders">
          <ReminderPicker />
        </Form.Item>

        <Form.Item label="分类" name="classifyId">
          <Select allowClear placeholder="选择分类"
            options={classifies.map(c => ({ value: c.id, label: c.name }))} />
        </Form.Item>

        <Form.Item label="四象限" name="importance">
          <Radio.Group options={IMPORTANCE_LABELS.map((l, i) => ({ label: l, value: i }))} />
        </Form.Item>

        <ExtraFields type={type} />

        <Form.Item label="备注" name="description"><TextArea rows={3} maxLength={500} /></Form.Item>
      </Form>
    </Modal>
  );
}
