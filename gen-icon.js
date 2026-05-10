const zlib = require('zlib');
const fs = require('fs');

const W = 128, H = 128;
const pixels = Buffer.alloc(W * H * 4);

// Background: #0d1117 (dark)
const BG = [13, 17, 23, 255];
// Accent: #cc785c (Claude orange-ish)
const ORANGE = [204, 120, 92, 255];
// White
const WHITE = [255, 255, 255, 255];
// Mid gray
const GRAY = [139, 148, 158, 255];

function setPixel(x, y, c) {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 4;
  pixels[i] = c[0]; pixels[i+1] = c[1]; pixels[i+2] = c[2]; pixels[i+3] = c[3];
}

function fillRect(x, y, w, h, c) {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++)
      setPixel(x + dx, y + dy, c);
}

function fillRoundRect(x, y, w, h, r, c) {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const px = x + dx, py = y + dy;
      const inCorner =
        (dx < r && dy < r && (dx - r) ** 2 + (dy - r) ** 2 > r * r) ||
        (dx >= w - r && dy < r && (dx - (w - r - 1)) ** 2 + (dy - r) ** 2 > r * r) ||
        (dx < r && dy >= h - r && (dx - r) ** 2 + (dy - (h - r - 1)) ** 2 > r * r) ||
        (dx >= w - r && dy >= h - r && (dx - (w - r - 1)) ** 2 + (dy - (h - r - 1)) ** 2 > r * r);
      if (!inCorner) setPixel(px, py, c);
    }
  }
}

// Fill background
for (let i = 0; i < W * H * 4; i += 4) {
  pixels[i] = BG[0]; pixels[i+1] = BG[1]; pixels[i+2] = BG[2]; pixels[i+3] = BG[3];
}

// Clipboard body
fillRoundRect(32, 36, 64, 76, 8, [30, 38, 50, 255]);

// Clipboard header bar
fillRoundRect(32, 36, 64, 18, 6, [40, 50, 66, 255]);

// Clip notch at top center
fillRoundRect(50, 28, 28, 16, 5, [13, 17, 23, 255]);
fillRoundRect(53, 30, 22, 12, 4, [40, 50, 66, 255]);

// @ symbol — drawn as pixel art at scale, centered
// Using a pre-defined 11x11 bitmap for "@"
const atBitmap = [
  [0,0,1,1,1,1,1,0,0],
  [0,1,1,0,0,0,1,1,0],
  [1,1,0,0,1,1,0,1,1],
  [1,0,0,1,1,1,0,0,1],
  [1,0,0,1,1,1,1,0,1],
  [1,0,0,1,1,0,1,0,1],
  [1,1,0,0,1,1,1,1,0],
  [0,1,1,0,0,0,0,0,0],
  [0,0,1,1,1,1,1,0,0],
];
const atW = atBitmap[0].length, atH = atBitmap.length;
const scale = 5;
const offX = Math.floor((W - atW * scale) / 2);
const offY = Math.floor(52 + (48 - atH * scale) / 2);

for (let row = 0; row < atH; row++) {
  for (let col = 0; col < atW; col++) {
    if (atBitmap[row][col]) {
      fillRect(offX + col * scale, offY + row * scale, scale, scale, ORANGE);
    }
  }
}

// Build PNG
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])));
  return Buffer.concat([len, typeB, data, crcB]);
}

const sig = Buffer.from([137,80,78,71,13,10,26,10]);

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; ihdr[9] = 2; // 8-bit, RGB (drop alpha for simplicity, fill bg instead)

// Build raw scanlines (filter byte 0 + RGB data)
// Actually use RGBA with color type 6
ihdr[9] = 6; // RGBA

const raw = [];
for (let y = 0; y < H; y++) {
  raw.push(0); // filter none
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    raw.push(pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]);
  }
}

const compressed = zlib.deflateSync(Buffer.from(raw));
const png = Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
fs.writeFileSync('./icon.png', png);
console.log('icon.png written');
