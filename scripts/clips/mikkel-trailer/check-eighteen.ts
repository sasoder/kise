// Per-frame geometry checks for EighteenHundredCloser: the 1,800x box vs the planet, the satellite and the airship; the
// airship and the satellite vs the caption bands; the marker on the rim.   bun scripts/clips/mikkel-trailer/check-eighteen.ts
import { spawnSync } from "node:child_process";
import { CAPTION_BANDS } from "../../../generated/components/mikkel-trailer/mikkelShared";
import { DURATION, NUM_SIZE, NUM_X, NUM_Y, geom, onPaper, satAt } from "../../../generated/components/mikkel-trailer/EighteenHundredCloser";

// the airship's opaque pixels (every 4th), PNG coords centred, nose left in the PNG (drawn as is)
const AW = 2016;
const AH = 795;
const raw = spawnSync("ffmpeg", ["-v", "error", "-i", "public/mikkel-trailer/sceye_airship.png", "-f", "rawvideo", "-pix_fmt", "rgba", "-"], { maxBuffer: 1e8 }).stdout as Buffer;
const PTS: [number, number][] = [];
for (let y = 0; y < AH; y += 4) for (let x = 0; x < AW; x += 4) if (raw[(y * AW + x) * 4 + 3] > 128) PTS.push([x - AW / 2, y - AH / 2]);
const airPts = (f: number) => {
  const g = geom(f);
  const k = g.aw / AW;
  const r = ((g.roll + g.pitch) * Math.PI) / 180;
  return PTS.map(([x, y]) => {
    const lx = x * k; // drawn unmirrored: nose left, so nose UP on the 3 o'clock rim after the quarter-turn roll
    const ly = y * k;
    return [g.A.x + lx * Math.cos(r) - ly * Math.sin(r), g.A.y + lx * Math.sin(r) + ly * Math.cos(r)] as [number, number];
  });
};
const EM_W = 2.707; // "1,800×" width in em, Barlow 900 (measured on a render)
const CAP = 0.7;
const box = (f: number) => {
  const q = onPaper(f, NUM_X, NUM_Y);
  const s = NUM_SIZE * q.s;
  return { x0: q.x - (EM_W * s) / 2, x1: q.x + (EM_W * s) / 2, y0: q.y - CAP * s - 24 * q.s, y1: q.y + 8 * q.s };
};
const distBox = (b: { x0: number; x1: number; y0: number; y1: number }, x: number, y: number) => {
  const dx = Math.max(b.x0 - x, 0, x - b.x1);
  const dy = Math.max(b.y0 - y, 0, y - b.y1);
  return Math.hypot(dx, dy);
};
const inBand = (y0: number, y1: number) => CAPTION_BANDS.some(([a, b]) => y1 > a && y0 < b);
let worstEarth = 1e9;
let worstSat = 1e9;
for (let f = 0; f < DURATION; f++) {
  const g = geom(f);
  const b = box(f);
  const earth = distBox(b, g.Ec.x, g.Ec.y) - g.Rs;
  worstEarth = Math.min(worstEarth, earth);
  const s = satAt(f);
  const satR = s.w / 2;
  const sb = { x0: s.c.x - satR, x1: s.c.x + satR, y0: s.c.y - s.h / 2, y1: s.c.y + s.h / 2 };
  const sat = Math.max(sb.x0 - b.x1, b.x0 - sb.x1, sb.y0 - b.y1, b.y0 - sb.y1);
  if (s.c.x - satR < 2048) worstSat = Math.min(worstSat, sat);
  const pts = airPts(f);
  let airText = f >= 14 ? 1e9 : NaN;
  let ay0 = 1e9;
  let ay1 = -1e9;
  for (const [x, y] of pts) {
    if (f >= 14) airText = Math.min(airText, distBox(b, x, y));
    ay0 = Math.min(ay0, y);
    ay1 = Math.max(ay1, y);
  }
  const airBand = inBand(ay0, ay1);
  const satBand = s.c.x - satR < 2048 && inBand(sb.y0 - 6, sb.y1 + 6);
  const flag = [earth < 30 ? "EARTH~TEXT" : "", airText < 24 ? `AIR~TEXT ${airText.toFixed(0)}` : "", airBand ? "AIR-IN-BAND" : "", satBand ? "SAT-IN-BAND" : "", sat < 20 ? "SAT~TEXT" : ""].filter(Boolean).join(" ");
  if (f % 4 === 0 || flag)
    console.log(
      `f${f} Rs ${g.Rs.toFixed(0)} roll ${g.roll.toFixed(1)} A (${g.A.x.toFixed(0)},${g.A.y.toFixed(0)}) aw ${g.aw.toFixed(0)} gap ${g.gap.toFixed(1)} Ec (${g.Ec.x.toFixed(0)},${g.Ec.y.toFixed(0)}) earth-text ${earth.toFixed(0)} sat (${s.c.x.toFixed(0)},${s.c.y.toFixed(0)}) x ${sb.x0.toFixed(0)}-${sb.x1.toFixed(0)} y ${sb.y0.toFixed(0)}-${sb.y1.toFixed(0)} earthL ${(g.Ec.x - g.Rs).toFixed(0)} text ${b.x0.toFixed(0)}-${b.x1.toFixed(0)},${b.y0.toFixed(0)}-${b.y1.toFixed(0)} ${flag}`,
    );
}
console.log("min earth-text clearance", worstEarth.toFixed(1), "min sat-text clearance", worstSat.toFixed(1));
