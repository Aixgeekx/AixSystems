// 浏览器通知封装 - 无服务器提醒核心
import { message, notification } from 'antd';

let permission: NotificationPermission = typeof Notification !== 'undefined' ? Notification.permission : 'denied';

export async function requestPerm(): Promise<boolean> {               // 请求通知权限
  if (typeof Notification === 'undefined') return false;
  if (permission === 'granted') return true;
  permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function notifyOs(title: string, body?: string, icon?: string) {  // 系统级通知
  if (permission === 'granted' && typeof Notification !== 'undefined') {
    try { new Notification(title, { body, icon, silent: false }); return true; } catch { /* ignore */ }
  }
  return false;
}

export function notifyApp(title: string, body?: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') {
  notification[type]({ message: title, description: body, placement: 'topRight', duration: 6 });
}

export function notify(title: string, body?: string) {                // 双通道提醒
  notifyOs(title, body);
  notifyApp(title, body);
}

export function toast(text: string, type: 'success'|'info'|'warning'|'error' = 'info') {
  message[type](text);
}
