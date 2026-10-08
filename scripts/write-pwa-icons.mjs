import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[i] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcBuf = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, paint) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = paint(x, y, size);
      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function dist(x, y, cx, cy) {
  return Math.hypot(x - cx, y - cy);
}

function paintMark(x, y, size, padRatio) {
  const carbon = [26, 33, 30];
  const paper = [255, 255, 255];
  const red = [169, 34, 34];
  const pad = size * padRatio;
  const top = pad;
  const bottom = size - pad;
  const left = pad;
  const height = bottom - top;
  const stem = Math.max(8, height * 0.18);
  const bowlCx = left + stem + height * 0.16;
  const bowlCy = (top + bottom) / 2;
  const outerR = height * 0.38;
  const innerR = outerR - stem;
  const stemRight = left + stem;
  const accent = Math.max(4, stem * 0.28);

  const inStem = x >= left && x <= stemRight && y >= top && y <= bottom;
  const inAccent = x >= left && x <= left + accent && y >= top && y <= bottom;
  const inOuterBowl = dist(x, y, bowlCx, bowlCy) <= outerR && x >= stemRight - 2;
  const inInnerBowl = dist(x, y, bowlCx, bowlCy) <= innerR && x >= stemRight + stem * 0.2;
  const inD = (inStem || inOuterBowl) && !inInnerBowl;
  if (inAccent && inD) return red;
  if (inD) return paper;
  return carbon;
}

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "icon-192.png"), encodePng(192, (x, y, s) => paintMark(x, y, s, 0.18)));
writeFileSync(join(outDir, "icon-512.png"), encodePng(512, (x, y, s) => paintMark(x, y, s, 0.16)));
writeFileSync(join(outDir, "icon-maskable.png"), encodePng(512, (x, y, s) => paintMark(x, y, s, 0.22)));
console.log("wrote", outDir);
