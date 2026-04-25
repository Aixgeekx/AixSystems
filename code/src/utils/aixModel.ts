export type AixMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export async function callAixModel(config: { apiUrl?: string; apiKey?: string; model?: string }, messages: AixMessage[]) {
  if (!config.apiUrl?.trim()) return '未配置 Aix API 接口地址，请先到系统设置中填写。';
  const res = await fetch(config.apiUrl.trim(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey?.trim() ? { Authorization: `Bearer ${config.apiKey.trim()}` } : {})
    },
    body: JSON.stringify({ model: config.model || 'aix-growth-control', messages })
  });
  if (!res.ok) throw new Error(`Aix API ${res.status}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || data?.content || data?.text || JSON.stringify(data);
}
