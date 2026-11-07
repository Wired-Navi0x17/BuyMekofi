import fs from "fs";
const { w, h, d } = JSON.parse(fs.readFileSync(process.argv[2]));
const strokes = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3])) : [];
let g = "";
for (let x = 0; x <= w; x += 25)
  g +=
    `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="${x % 100 ? "#ddd" : "#99f"}" stroke-width="1"/>` +
    (x % 100 ? `` : `<text x="${x + 2}" y="12" font-size="12" fill="#00f">${x}</text>`);
for (let y = 0; y <= h; y += 25)
  g +=
    `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${y % 100 ? "#ddd" : "#99f"}" stroke-width="1"/>` +
    (y % 100 ? `` : `<text x="2" y="${y - 2}" font-size="12" fill="#00f">${y}</text>`);
const colors = ["#e33", "#3a3", "#33e", "#e8a", "#a63", "#0aa", "#a0a", "#880"];
const s = strokes
  .map(
    (st, i) =>
      `<path d="${st.d}" fill="none" stroke="${colors[i % 8]}" stroke-opacity=".55" stroke-width="${st.w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${st.d}" fill="none" stroke="#000" stroke-width="2"/>`,
  )
  .join("");
fs.writeFileSync(
  process.argv[4],
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w * 2}" height="${h * 2}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#fff"/>${g}<path d="${d}" fill="#bbb" fill-opacity=".8"/>${s}</svg>`,
);
