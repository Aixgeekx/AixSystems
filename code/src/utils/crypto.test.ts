// 加密工具单元测试
import { describe, it, expect } from 'vitest';
import { encryptText, decryptText, hashPassword } from './crypto';

describe('crypto', () => {
  it('加解密往返一致', async () => {
    const plain = '私密日记内容 hello 2026';
    const pwd = 'passw0rd';
    const cipher = await encryptText(plain, pwd);
    expect(cipher).not.toContain(plain);
    const back = await decryptText(cipher, pwd);
    expect(back).toBe(plain);
  });

  it('密码错误应抛错', async () => {
    const cipher = await encryptText('x', 'a');
    await expect(decryptText(cipher, 'b')).rejects.toThrow();
  });

  it('hashPassword 相同密码输出相同哈希', async () => {
    const a = await hashPassword('abc');
    const b = await hashPassword('abc');
    const c = await hashPassword('abd');
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });
});
