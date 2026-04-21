// HTML 工具单元测试
import { describe, it, expect } from 'vitest';
import { isHTML, plainOf, previewOf } from './html';

describe('isHTML', () => {
  it('识别 HTML', () => {
    expect(isHTML('<p>hi</p>')).toBe(true);
    expect(isHTML('<strong>x</strong>')).toBe(true);
  });
  it('纯文本返回 false', () => {
    expect(isHTML('hello world')).toBe(false);
  });
  it('空/undefined 返回 false', () => {
    expect(isHTML(undefined)).toBe(false);
    expect(isHTML('')).toBe(false);
  });
});

describe('plainOf & previewOf', () => {
  it('剥离 HTML 标签', () => {
    expect(plainOf('<p>hello <b>world</b></p>')).toBe('hello world');
  });
  it('纯文本直接返回', () => {
    expect(plainOf('hi')).toBe('hi');
  });
  it('previewOf 截断', () => {
    const long = 'a'.repeat(200);
    const p = previewOf(long, 10);
    expect(p.length).toBeLessThanOrEqual(11);                // 10 + 省略号
    expect(p.endsWith('…')).toBe(true);
  });
});
