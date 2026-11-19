// 앱 아이콘 만들기: node make-icons.js
// 파란 하늘 배경 + 해 + 흰 구름. 추가 프로그램 없이 Node 만으로 PNG 를 그림.
// maskable 아이콘은 폰이 둥글게 잘라도 그림이 안 잘리게 가운데(80%) 안에 그림.
const fs = require('fs'), zlib = require('zlib');

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// (u, v) 는 0~1. 그림 한 점의 색 [r, g, b, a]
function paint(u, v, opt) {
  const k = opt.safe, cu = (u - 0.5) / k + 0.5, cv = (v - 0.5) / k + 0.5;     // 그림을 가운데로 줄임
  // 배경: 둥근 네모 (maskable 은 꽉 찬 네모)
  const r = opt.round, inBox = (() => {
    if (!r) return true;
    const dx = Math.max(r - u, 0, u - (1 - r)), dy = Math.max(r - v, 0, v - (1 - r));
    return dx * dx + dy * dy <= r * r;
  })();
  if (!inBox) return [0, 0, 0, 0];
  const t = v;                                                    // 위는 진한 파랑, 아래는 하늘색
  let col = [47 + (143 - 47) * t, 128 + (211 - 128) * t, 237 + (255 - 237) * t];
  // 해 (빛 번짐 + 노란 동그라미)
  const sd = Math.hypot(cu - 0.4, cv - 0.38);
  if (sd < 0.3) { const g = (1 - sd / 0.3) * 0.35; col = col.map((c, i) => c + ([255, 230, 140][i] - c) * g); }
  if (sd < 0.19) col = sd < 0.17 ? [255, 210, 63] : [255, 190, 40];
  // 구름 (동그라미 여러 개 + 아래 평평)
  const blobs = [[0.46, 0.66, 0.15], [0.62, 0.58, 0.18], [0.78, 0.68, 0.12], [0.33, 0.72, 0.1]];
  let cloud = blobs.some(([x, y, rr]) => Math.hypot(cu - x, cv - y) < rr);
  // 구름 아래: 양 끝이 둥근 막대 (네모 모서리가 안 생기게)
  const bx = Math.max(0.36, Math.min(0.8, cu));
  if (Math.hypot(cu - bx, cv - 0.72) < 0.085) cloud = true;
  if (cloud) {
    const shade = cv > 0.76 ? 0.93 : 1;                            // 아래쪽은 살짝 그늘
    col = [255 * shade, 255 * shade, 255];
  }
  return [col[0], col[1], col[2], 255];
}

function render(size, opt) {
  const buf = Buffer.alloc(size * size * 4), S = 4;               // 4×4 번 찍어 평균 → 가장자리가 매끈
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const acc = [0, 0, 0, 0];
    for (let sy = 0; sy < S; sy++) for (let sx = 0; sx < S; sx++) {
      const c = paint((x + (sx + 0.5) / S) / size, (y + (sy + 0.5) / S) / size, opt);
      acc[0] += c[0] * c[3]; acc[1] += c[1] * c[3]; acc[2] += c[2] * c[3]; acc[3] += c[3];
    }
    const i = (y * size + x) * 4, a = acc[3] / (S * S);
    buf[i] = acc[3] ? acc[0] / acc[3] : 0; buf[i + 1] = acc[3] ? acc[1] / acc[3] : 0; buf[i + 2] = acc[3] ? acc[2] / acc[3] : 0; buf[i + 3] = a;
  }
  return png(size, buf);
}

fs.mkdirSync(__dirname + '/icons', { recursive: true });
const out = [
  ['icon-192.png', 192, { round: 0.2, safe: 1 }],
  ['icon-512.png', 512, { round: 0.2, safe: 1 }],
  ['icon-maskable-512.png', 512, { round: 0, safe: 0.8 }],
  ['apple-touch-icon.png', 180, { round: 0, safe: 0.9 }],
  ['favicon-32.png', 32, { round: 0.2, safe: 1 }],
];
for (const [name, size, opt] of out) {
  fs.writeFileSync(`${__dirname}/icons/${name}`, render(size, opt));
  console.log('만듦:', 'icons/' + name, size + '×' + size);
}
