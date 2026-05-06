export type AixMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type AixProviderProtocol = 'openai' | 'claude' | 'ollama';

export const NOT_CONFIGURED_HINT = '未配置 Aix API 接口地址，请先到系统设置中填写。';

export function inferAixProtocol(apiUrl?: string): AixProviderProtocol {
  const url = apiUrl?.toLowerCase() || '';
  if (url.includes('11434') || url.includes('ollama')) return 'ollama';
  if (url.includes('/v1/messages') || url.includes('anthropic') || url.includes('claude')) return 'claude';
  return 'openai';
}

export function buildAixBody(protocol: AixProviderProtocol, model: string, messages: AixMessage[]) {
  if (protocol === 'claude') return { model, max_tokens: 1200, messages };
  if (protocol === 'ollama') return { model, messages, stream: false };       // 修：Ollama 默认 stream=true 会返回 NDJSON 导致 res.json() 失败
  return { model, messages };
}

export async function callAixModel(config: { apiUrl?: string; apiKey?: string; model?: string; timeoutMs?: number; protocol?: AixProviderProtocol }, messages: AixMessage[]) {
  if (!config.apiUrl?.trim()) return NOT_CONFIGURED_HINT;
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), config.timeoutMs || 15000);
  const protocol = config.protocol || inferAixProtocol(config.apiUrl);
  try {
    const res = await fetch(config.apiUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey?.trim() ? { Authorization: `Bearer ${config.apiKey.trim()}`, 'x-api-key': config.apiKey.trim() } : {})
      },
      body: JSON.stringify(buildAixBody(protocol, config.model || 'aix-growth-control', messages)),
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`Aix API ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || data?.content?.[0]?.text || data?.content || data?.message?.content || data?.text || JSON.stringify(data);
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new Error(`Aix API 请求超时（${config.timeoutMs || 15000}ms）`);  // 修：AbortError 给出可读消息
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function probeAixProvider(config: { apiUrl?: string; apiKey?: string; model?: string; protocol?: AixProviderProtocol }) {
  const startedAt = Date.now();
  if (!config.apiUrl?.trim()) {                                                // 修：apiUrl 空时 callAixModel 返回提示字符串而非 throw，导致 try 路径假阳性
    return { ok: false, latency: 0, checkedAt: Date.now(), error: '未配置 API 地址' };
  }
  try {
    const reply = await callAixModel({ ...config, timeoutMs: 6000 }, [{ role: 'user', content: 'health' }]);
    if (reply === NOT_CONFIGURED_HINT) {                                       // 双保险：万一 callAixModel 内部 trim 后又判定为空
      return { ok: false, latency: Date.now() - startedAt, checkedAt: Date.now(), error: '未配置 API 地址' };
    }
    return { ok: true, latency: Date.now() - startedAt, checkedAt: Date.now(), error: '' };
  } catch (error: any) {
    return { ok: false, latency: Date.now() - startedAt, checkedAt: Date.now(), error: error?.message || '检测失败' };
  }
}
