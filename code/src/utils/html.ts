// 纯文本/HTML 互识 + 预览摘要
export function isHTML(s?: string): boolean {
  if (!s) return false;
  return /<(p|div|br|h[1-6]|ul|ol|li|blockquote|strong|em|code|img|a)\b/i.test(s);
}

export function plainOf(s?: string): string {                // HTML → 纯文本摘要
  if (!s) return '';
  if (!isHTML(s)) return s;
  const div = document.createElement('div');
  div.innerHTML = s;
  return (div.textContent || div.innerText || '').trim();
}

export function previewOf(s?: string, n = 60): string {
  const p = plainOf(s);
  return p.length > n ? p.slice(0, n) + '…' : p;
}
