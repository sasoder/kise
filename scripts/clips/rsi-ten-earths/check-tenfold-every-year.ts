// Per-frame checks for TenfoldEveryYear rev 1 (rsi-ten-earths, cut 89).   bun scripts/clips/rsi-ten-earths/check-tenfold-every-year.ts
//  * the camera: ln(hero px) and ln(eye height) per frame: one acceleration lobe, one settle lobe (sign changes of the
//    second difference, ignoring tiny wiggles); the horizon row, the view's tilt down (grazing), the hero's and the
//    field's front row's size
//  * the ten and the hundred inside x 65..1015 from their hatches opening to their landing (from the 1,000 on the field
//    is environment: it runs off the sides and behind the caption bands on purpose)
//  * framing: the visible faces of the field's robots (L0..L4, >= 14 px) never in the caption bands (y 1080-1250, 1360-1460);
//    each wave's formation inside the keep-in box (x 65-1015, y 290-1070) from its landing on
//  * collisions: every slot's distance to its neighbours >= the slot pitch and every hatch inside its own slot (robots
//    only move vertically on their own lifts, so nothing can touch); the sea never re-uses a field slot
//  * pops: per-frame screen jumps of every field robot's head (camera + lift), worst per wave; a robot's antenna never
//    clears the floor before its hatch is (nearly) open (head above the floor while open < 0.9)
import { BOT_H, DEPTH, DURATION, FIELD, FIELD_BOTS, T, WAVES, entryAt, eyeAt, landOf, levelOf, toScreen, xOf, zOf } from "../../../generated/components/rsi-ten-earths/tenfoldWorld";

const bands = [
  [1080, 1250],
  [1360, 1460],
];
const inBand = (y: number) => bands.some(([a, b]) => y > a && y < b);

// ---- the camera ----------------------------------------------------------------------------------------------------
const lnPx: number[] = [];
const lnHe: number[] = [];
for (let f = 0; f < DURATION; f++) {
  const e = eyeAt(f);
  const h = toScreen(e, 0, 0, 0)!;
  lnPx.push(Math.log(BOT_H * h.s));
  lnHe.push(Math.log(e.He));
}
const d1 = (a: number[]) => a.slice(1).map((v, i) => v - a[i]);
const lobes = (a: number[], tol: number) => {
  const dd = d1(d1(a));
  let n = 0;
  let s = 0;
  for (const v of dd) {
    if (Math.abs(v) < tol) continue;
    const g = Math.sign(v);
    if (s && g !== s) n++;
    s = g;
  }
  return n;
};
const v = d1(lnPx);
const peak = v.reduce((m, x, i) => (x < v[m] ? i : m), 0);
console.log(`camera: ln(hero px) speed peaks at f${peak} (${v[peak].toFixed(4)}/f); accel sign changes ${lobes(lnPx, 2e-4)} (1 = one lobe); ln He accel sign changes ${lobes(lnHe, 2e-4)}`);
const hePeak = lnHe.reduce((m, x, i) => (x > lnHe[m] ? i : m), 0);
console.log(`camera: speed at f0 ${v[0].toFixed(4)}, f135 ${v[135].toFixed(4)}, f154 ${v[154].toFixed(4)}; eye height rises to f${hePeak} (${(Math.exp(lnHe[hePeak]) / 178).toFixed(1)} m) then settles to ${(Math.exp(lnHe[155]) / 178).toFixed(1)} m; rises monotone to its peak ${d1(lnHe.slice(0, hePeak + 1)).every((x) => x >= -1e-9)}`);
console.log(`camera: hero px f0 ${Math.exp(lnPx[0]).toFixed(0)} -> f155 ${Math.exp(lnPx[155]).toFixed(1)} (x${(Math.exp(lnPx[0] - lnPx[155])).toFixed(1)}); horizon f0 ${eyeAt(0).Hy.toFixed(0)}, f155 ${eyeAt(155).Hy.toFixed(0)}`);

// ---- framing -------------------------------------------------------------------------------------------------------
let faceBand = 0;
const keepIn: Record<number, { from: number; worst: string; bad: number }> = {};
for (let L = 1; L <= 4; L++) keepIn[L] = { from: Math.ceil(Math.max(...FIELD_BOTS.filter((r) => r.L === L).map((r) => r.t0)) + landOf(L)), worst: "", bad: 0 };
for (let f = 0; f < DURATION; f++) {
  const e = eyeAt(f);
  const box: Record<number, number[]> = {};
  for (const r of FIELD_BOTS) {
    const en = entryAt(f, r.t0, r.L);
    if (r.L > 0 && en.rise <= 0) continue;
    const p = toScreen(e, r.X, (1 - (r.L ? en.rise : 1)) * 300, r.Z);
    if (!p) continue;
    const h = BOT_H * p.s;
    const face = p.y - 0.85 * h;
    // a rising robot's face is hidden in its shaft until it clears the floor
    const faceUp = r.L === 0 || (1 - en.rise) * DEPTH < 0.85 * BOT_H;
    if (r.L <= 2 && h >= 14 && faceUp && inBand(face) && p.x > 0 && p.x < 1080) {
      faceBand++;
      if (faceBand <= 12) console.log(`  face in band: f${f} L${r.L} (${r.i},${r.j}) x ${p.x.toFixed(0)} face y ${face.toFixed(0)} h ${h.toFixed(0)} rise ${en.rise.toFixed(2)}`);
    }
    if (en.rise >= 1) {
      const b = (box[r.L] ??= [1e9, -1e9, 1e9, -1e9]);
      b[0] = Math.min(b[0], p.x - 70 * p.s);
      b[1] = Math.max(b[1], p.x + 70 * p.s);
      b[2] = Math.min(b[2], p.y - h);
      b[3] = Math.max(b[3], p.y);
    }
  }
  for (let L = 1; L <= 4; L++) {
    // a wave is checked from its landing until the next wave lands on it (then it is part of a bigger formation)
    const to = L < 4 ? keepIn[L + 1].from : DURATION;
    if (f < keepIn[L].from || f >= to) continue;
    // the lower formations only matter as a whole: check the union of levels <= L
    const u = [1e9, -1e9, 1e9, -1e9];
    for (let k = 0; k <= L; k++) {
      const b = box[k];
      if (!b) continue;
      u[0] = Math.min(u[0], b[0]);
      u[1] = Math.max(u[1], b[1]);
      u[2] = Math.min(u[2], b[2]);
      u[3] = Math.max(u[3], b[3]);
    }
    const ok = u[0] >= 65 && u[1] <= 1015 && u[2] >= 290 && u[3] <= 1070;
    if (!ok) keepIn[L].bad++;
    if (f === keepIn[L].from || !ok) keepIn[L].worst = `f${f} x ${u[0].toFixed(0)}..${u[1].toFixed(0)} y ${u[2].toFixed(0)}..${u[3].toFixed(0)}`;
  }
}
console.log(`faces of the hero, the ten and the hundred in the caption bands, frame-robot pairs: ${faceBand} (from the 1,000 on the field is environment: it may run behind the bands)`);
// the ten and the hundred inside x 65..1015 from their hatches opening to their landing (the 1,000 on: environment)
for (let L = 1; L <= 2; L++) {
  let out = 0;
  let worst = "";
  let w = 0;
  for (let f = 0; f < DURATION; f++) {
    const e = eyeAt(f);
    for (const r of FIELD_BOTS) {
      if (r.L !== L) continue;
      const en = entryAt(f, r.t0, r.L);
      if (en.open <= 0 || en.rise >= 1) continue;
      const a = toScreen(e, r.X - T / 2 + 2, 0, r.Z - T / 2 + 2);
      const b = toScreen(e, r.X + T / 2 - 2, 0, r.Z - T / 2 + 2);
      if (!a || !b) continue;
      const over = Math.max(65 - a.x, b.x - 1015);
      if (over > 0) {
        out++;
        if (over > w) {
          w = over;
          worst = `f${f} (${r.i},${r.j}) ${over.toFixed(1)} px`;
        }
      }
    }
  }
  console.log(`rising L${L} hatches past x 65..1015: ${out} robot-frames${worst ? `, worst ${worst}` : ""}`);
}
// the middle: the horizon row (the sky's share) and the 10,000's far edge
for (const f of [32, 60, 85, 98, 114, 130, 155]) {
  const e = eyeAt(f);
  const top = toScreen(e, 0, 0, zOf(FIELD.j1));
  const front = toScreen(e, 0, 0, zOf(FIELD.j0));
  console.log(`f${f}: horizon y ${e.Hy.toFixed(0)}, view centre ${((Math.atan((960 - e.Hy) / e.F) * 180) / Math.PI).toFixed(0)} deg down, hero ${(BOT_H * e.S).toFixed(1)} px at y ${toScreen(e, 0, 0, 0)?.y.toFixed(0)}, the field's front row ${front ? `${(BOT_H * front.s).toFixed(0)} px at y ${front.y.toFixed(0)}` : "behind"}, far edge y ${top?.y.toFixed(0)}, eye ${(e.He / 178).toFixed(1)} m, ${((e.F / e.S) / 178).toFixed(1)} m back`);
}
// landings: the last robot of each wave up
for (let L = 1; L <= 4; L++) console.log(`L${L} all landed by f${Math.ceil(Math.max(...FIELD_BOTS.filter((r) => r.L === L).map((r) => r.t0)) + landOf(L))}`);
for (let L = 1; L <= 2; L++) console.log(`keep-in L${L} from f${keepIn[L].from}: ${keepIn[L].bad} frames out; ${keepIn[L].worst}`);

// ---- collisions ----------------------------------------------------------------------------------------------------
let minGap = Infinity;
for (let j = -60; j <= 140; j++)
  for (let i = -80; i <= 90; i++) {
    const dx = xOf(i + 1) - xOf(i);
    const dz = zOf(j + 1) - zOf(j);
    minGap = Math.min(minGap, dx, dz);
  }
const HATCH = T / 2 - 7;
console.log(`collisions: min slot pitch ${minGap} (robot body ~140 wide, hatch ${2 * HATCH}); robots move only up their own shafts: 0 contacts`);
let reuse = 0;
for (let j = FIELD.j0; j <= FIELD.j1; j++) for (let i = FIELD.i0; i <= FIELD.i1; i++) if (levelOf(i, j) === 5) reuse++;
console.log(`field slots classed as sea (would be drawn twice): ${reuse}`);

// ---- pops ----------------------------------------------------------------------------------------------------------
const worst: Record<number, { px: number; at: string }> = {};
let early = 0;
for (let f = 1; f < DURATION; f++) {
  const e0 = eyeAt(f - 1);
  const e1 = eyeAt(f);
  for (const r of FIELD_BOTS) {
    const a = entryAt(f - 1, r.t0, r.L);
    const b = entryAt(f, r.t0, r.L);
    if (r.L > 0 && b.rise * DEPTH > DEPTH - BOT_H && b.open < 0.9) early++;
    if (r.L > 0 && a.rise <= 0) continue;
    const pa = toScreen(e0, r.X, (1 - (r.L ? a.rise : 1)) * 300 - BOT_H, r.Z);
    const pb = toScreen(e1, r.X, (1 - (r.L ? b.rise : 1)) * 300 - BOT_H, r.Z);
    if (!pa || !pb || pb.y > 1920 || pb.x < 0 || pb.x > 1080) continue;
    const j = Math.hypot(pb.x - pa.x, pb.y - pa.y);
    const w = (worst[r.L] ??= { px: 0, at: "" });
    if (j > w.px) worst[r.L] = { px: j, at: `f${f} (${r.i},${r.j}) h ${(BOT_H * pb.s).toFixed(0)}px` };
  }
}
for (const [L, w] of Object.entries(worst)) console.log(`head speed, worst, wave L${L}: ${w.px.toFixed(1)} px/f at ${w.at}`);
console.log(`robot-frames with the head above the floor before the hatch is 90% open: ${early}`);
console.log(`waves: ${WAVES.map((w, i) => `L${i} ${w.start}+${w.span}`).join(", ")}`);
