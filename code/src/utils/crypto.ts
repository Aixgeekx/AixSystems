// Web Crypto 加密工具 - 用于日记/备忘录密码锁
const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(password) as BufferSource, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100_000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

export async function encryptText(plain: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, enc.encode(plain) as BufferSource);
  const buf = new Uint8Array(salt.length + iv.length + ct.byteLength);
  buf.set(salt, 0); buf.set(iv, salt.length); buf.set(new Uint8Array(ct), salt.length + iv.length);
  return btoa(String.fromCharCode(...buf));
}

export async function decryptText(cipher: string, password: string): Promise<string> {
  const buf = Uint8Array.from(atob(cipher), c => c.charCodeAt(0));
  const salt = buf.slice(0, 16);
  const iv = buf.slice(16, 28);
  const ct = buf.slice(28);
  const key = await deriveKey(password, salt);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, key, ct as BufferSource);
  return dec.decode(pt);
}

export async function hashPassword(password: string): Promise<string> {     // 校验用哈希
  const salt = enc.encode('aixsystems-local-salt');
  const payload = new Uint8Array([...salt, ...enc.encode(password)]);
  const buf = await crypto.subtle.digest('SHA-256', payload as BufferSource);
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
