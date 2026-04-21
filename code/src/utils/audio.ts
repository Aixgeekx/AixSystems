// 白噪音 - 用 Web Audio API 实时合成,无需外部音频文件
// 支持白噪 / 粉噪 / 棕噪 / 键盘声 / 雨声(近似)

type NoiseKind = 'white' | 'pink' | 'brown' | 'rain' | 'keyboard';

let ctx: AudioContext | null = null;
let source: AudioBufferSourceNode | null = null;
let gain: GainNode | null = null;
let current: NoiseKind | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}

function buildBuffer(kind: NoiseKind, duration = 4): AudioBuffer {
  const c = getCtx();
  const length = c.sampleRate * duration;
  const buf = c.createBuffer(1, length, c.sampleRate);
  const data = buf.getChannelData(0);

  if (kind === 'white') {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  } else if (kind === 'pink') {                             // Paul Kellet 近似算法
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179;
      b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520;
      b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522;
      b5 = -0.7616 * b5 - w * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  } else if (kind === 'brown') {                            // 棕噪: 积分白噪
    let last = 0;
    for (let i = 0; i < length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  } else if (kind === 'rain') {                             // 雨声: 高频突变 + 白噪
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (0.3 + 0.7 * Math.abs(Math.sin(i * 0.002)));
    }
  } else if (kind === 'keyboard') {                         // 机械键盘: 随机短脉冲
    data.fill(0);
    for (let i = 0; i < length; i += Math.floor(c.sampleRate * (0.15 + Math.random() * 0.4))) {
      const dur = Math.floor(c.sampleRate * 0.03);
      for (let j = 0; j < dur && i + j < length; j++) {
        const env = Math.exp(-j / dur * 5);
        data[i + j] = (Math.random() * 2 - 1) * env * 0.6;
      }
    }
  }
  return buf;
}

export function playNoise(kind: NoiseKind, volume = 0.3) {
  stopNoise();
  const c = getCtx();
  const buf = buildBuffer(kind, 4);
  source = c.createBufferSource();
  source.buffer = buf;
  source.loop = true;
  gain = c.createGain();
  gain.gain.value = volume;
  source.connect(gain).connect(c.destination);
  source.start();
  current = kind;
}

export function stopNoise() {
  if (source) { try { source.stop(); } catch {} source.disconnect(); source = null; }
  if (gain) { gain.disconnect(); gain = null; }
  current = null;
}

export function setVolume(v: number) { if (gain) gain.gain.value = Math.max(0, Math.min(1, v)); }

export function currentNoise(): NoiseKind | null { return current; }

export const NOISE_LABELS: Record<NoiseKind, string> = {
  white: '白噪音', pink: '粉噪音', brown: '棕噪音', rain: '雨声', keyboard: '键盘声'
};
