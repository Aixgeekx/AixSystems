import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { inferAixProtocol, buildAixBody, callAixModel, probeAixProvider, NOT_CONFIGURED_HINT } from './aixModel';

describe('inferAixProtocol', () => {
  it('detects ollama by 11434 port or ollama keyword', () => {
    expect(inferAixProtocol('http://localhost:11434/api/chat')).toBe('ollama');
    expect(inferAixProtocol('https://my-ollama-host/v1/chat')).toBe('ollama');
    expect(inferAixProtocol('https://Ollama.example/api')).toBe('ollama');
  });

  it('detects claude by anthropic / messages / claude markers', () => {
    expect(inferAixProtocol('https://api.anthropic.com/v1/messages')).toBe('claude');
    expect(inferAixProtocol('https://proxy/v1/messages')).toBe('claude');
    expect(inferAixProtocol('https://claude.example.com/api')).toBe('claude');
  });

  it('falls back to openai for unknown / empty input', () => {
    expect(inferAixProtocol('https://api.openai.com/v1/chat/completions')).toBe('openai');
    expect(inferAixProtocol('https://my-proxy/v1/chat')).toBe('openai');
    expect(inferAixProtocol('')).toBe('openai');
    expect(inferAixProtocol(undefined)).toBe('openai');
  });
});

describe('buildAixBody', () => {
  const messages = [{ role: 'user' as const, content: 'hi' }];

  it('claude body has max_tokens but no stream flag', () => {
    const body = buildAixBody('claude', 'claude-haiku-4-5', messages);
    expect(body).toMatchObject({ model: 'claude-haiku-4-5', max_tokens: 1200, messages });
    expect((body as any).stream).toBeUndefined();
  });

  it('ollama body includes stream:false to avoid NDJSON', () => {              // bug fix: 默认 stream=true 会让 fetch.json() 失败
    const body = buildAixBody('ollama', 'llama3', messages);
    expect(body).toMatchObject({ model: 'llama3', messages, stream: false });
    expect((body as any).max_tokens).toBeUndefined();
  });

  it('openai body is plain { model, messages }', () => {
    const body = buildAixBody('openai', 'gpt-4', messages);
    expect(body).toEqual({ model: 'gpt-4', messages });
  });
});

describe('callAixModel', () => {
  const realFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = realFetch;
  });

  it('returns NOT_CONFIGURED_HINT when apiUrl missing or whitespace', async () => {
    expect(await callAixModel({}, [])).toBe(NOT_CONFIGURED_HINT);
    expect(await callAixModel({ apiUrl: '   ' }, [])).toBe(NOT_CONFIGURED_HINT);
  });

  it('parses OpenAI choices[0].message.content', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hello-openai' } }] })
    }) as any);
    const reply = await callAixModel({ apiUrl: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4' }, [{ role: 'user', content: 'hi' }]);
    expect(reply).toBe('hello-openai');
  });

  it('parses Claude content[0].text', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ content: [{ type: 'text', text: 'hello-claude' }] })
    }) as any);
    const reply = await callAixModel({ apiUrl: 'https://api.anthropic.com/v1/messages', model: 'claude-haiku-4-5' }, []);
    expect(reply).toBe('hello-claude');
  });

  it('parses Ollama message.content', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ message: { content: 'hello-ollama' } })
    }) as any);
    global.fetch = fetchMock;
    const reply = await callAixModel({ apiUrl: 'http://localhost:11434/api/chat', model: 'llama3' }, []);
    expect(reply).toBe('hello-ollama');
    const body = JSON.parse((fetchMock.mock.calls[0] as any[])[1].body);          // 校验请求体含 stream:false
    expect(body.stream).toBe(false);
  });

  it('throws "Aix API <status>" on non-200', async () => {
    global.fetch = vi.fn(async () => ({ ok: false, status: 500 }) as any);
    await expect(callAixModel({ apiUrl: 'https://x' }, [])).rejects.toThrow('Aix API 500');
  });

  it('rewrites AbortError to a friendly timeout message', async () => {
    global.fetch = vi.fn(async () => {
      const err = new Error('aborted');
      (err as any).name = 'AbortError';
      throw err;
    });
    await expect(callAixModel({ apiUrl: 'https://x', timeoutMs: 8000 }, [])).rejects.toThrow('Aix API 请求超时（8000ms）');
  });
});

describe('probeAixProvider', () => {
  const realFetch = global.fetch;

  afterEach(() => {
    global.fetch = realFetch;
  });

  it('returns ok:false WITHOUT calling fetch when apiUrl is empty (was false-positive ok:true)', async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as any;
    const result = await probeAixProvider({});
    expect(result.ok).toBe(false);
    expect(result.error).toBe('未配置 API 地址');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns ok:true with latency on healthy 200 response', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'pong' } }] })
    }) as any);
    const result = await probeAixProvider({ apiUrl: 'https://api.example.com/v1/chat/completions' });
    expect(result.ok).toBe(true);
    expect(result.error).toBe('');
    expect(result.latency).toBeGreaterThanOrEqual(0);
  });

  it('returns ok:false with error message when fetch throws', async () => {
    global.fetch = vi.fn(async () => { throw new Error('network down'); });
    const result = await probeAixProvider({ apiUrl: 'https://api.example.com/v1/chat/completions' });
    expect(result.ok).toBe(false);
    expect(result.error).toBe('network down');
  });
});
