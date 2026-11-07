import opentype from "opentype.js";
import fs from "fs";
const [, , fontPath, text, out] = process.argv;
const font = opentype.parse(
  ((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))(fs.readFileSync(fontPath)),
);
const size = 400;
const p = font.getPath(text, 0, 0, size);
const bb = p.getBoundingBox();
const pad = 20;
const tx = -bb.x1 + pad,
  ty = -bb.y1 + pad;
const moved = font.getPath(text, tx, ty, size);
const w = Math.ceil(bb.x2 - bb.x1 + 2 * pad),
  h = Math.ceil(bb.y2 - bb.y1 + 2 * pad);
const d = moved.toPathData(1);
fs.writeFileSync(out, JSON.stringify({ w, h, d }));
console.log(w, h, d.length);
