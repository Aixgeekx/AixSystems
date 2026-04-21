// 用纯 Node 生成 256×256 PNG + ICO (无外部依赖) - AixSystems 小写 x 图标
// 蓝色渐变圆底 + 白色粗笔画小写 x
const fs = require('node:fs');
const zlib = require('node:zlib');
const path = require('node:path');

const W = 256, H = 256;
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function buildPng(pixels) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const p = (y * W + x) * 4;
      const q = y * (W * 4 + 1) + 1 + x * 4;
      raw[q]     = pixels[p];
      raw[q + 1] = pixels[p + 1];
      raw[q + 2] = pixels[p + 2];
      raw[q + 3] = pixels[p + 3];
    }
  }
  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

function makeIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = 0; entry[1] = 0;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);
  return Buffer.concat([header, entry, png]);
}

// 距离点 p 到线段 ab 的距离
function distToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const qx = ax + t * dx, qy = ay + t * dy;
  return Math.hypot(px - qx, py - qy);
}

// 像素渲染: 渐变蓝圆底 + 白色小写 x
function render() {
  const buf = new Uint8Array(W * H * 4);
  const cx = W / 2, cy = H / 2, rOuter = W / 2 - 4;
  const strokeHalf = 20;
  const pad = W * 0.28;
  const ax1 = pad, ay1 = pad, bx1 = W - pad, by1 = H - pad;          // \ 线
  const ax2 = W - pad, ay2 = pad, bx2 = pad, by2 = H - pad;          // / 线

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > rOuter) { buf[i] = 0; buf[i+1] = 0; buf[i+2] = 0; buf[i+3] = 0; continue; }

      // 渐变蓝底 (从左上浅蓝到右下深蓝)
      const t = (x + y) / (W + H);
      let r = Math.round(30 + t * 30);
      let g = Math.round(126 + t * 20);
      let b = Math.round(240 - t * 30);
      let a = 255;

      // 判断是否在 x 笔画内
      const d1 = distToSegment(x, y, ax1, ay1, bx1, by1);
      const d2 = distToSegment(x, y, ax2, ay2, bx2, by2);
      const dMin = Math.min(d1, d2);

      if (dMin <= strokeHalf) {
        const edge = Math.max(0, Math.min(1, (strokeHalf - dMin) / 1.5));
        r = Math.round(r * (1 - edge) + 255 * edge);
        g = Math.round(g * (1 - edge) + 255 * edge);
        b = Math.round(b * (1 - edge) + 255 * edge);
      }

      // 圆边缘抗锯齿
      if (dist > rOuter - 2) {
        const fade = (rOuter - dist) / 2;
        a = Math.round(255 * Math.max(0, Math.min(1, fade)));
      }

      buf[i] = r; buf[i+1] = g; buf[i+2] = b; buf[i+3] = a;
    }
  }
  return buf;
}

const outDir = path.resolve(__dirname, '..', 'desktop', 'build');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const pixels = render();
const png = buildPng(pixels);
fs.writeFileSync(path.join(outDir, 'icon.png'), png);
fs.writeFileSync(path.join(outDir, 'icon.ico'), makeIco(png));

const pubIconDir = path.resolve(__dirname, '..', 'code', 'public', 'icons');
if (!fs.existsSync(pubIconDir)) fs.mkdirSync(pubIconDir, { recursive: true });
fs.writeFileSync(path.join(pubIconDir, 'icon-192.png'), png);
fs.writeFileSync(path.join(pubIconDir, 'icon-512.png'), png);

console.log('AixSystems 图标已生成 (小写 x):');
console.log('  ' + path.join(outDir, 'icon.png'));
console.log('  ' + path.join(outDir, 'icon.ico'));
console.log('  ' + path.join(pubIconDir, 'icon-192.png'));
console.log('  ' + path.join(pubIconDir, 'icon-512.png'));
