// TimelineToTheDataCenter (rsi-ten-earths, cut 17, rev 1) per-frame checks, from the pure world (timelineDcWorld.ts):
//  - the camera: one acceleration lobe and one deceleration lobe on the road, through the door, the forward speed
//    reaching zero only once (the crane's swing back), no jerk spikes; the crane's climb smooth; the eye clear of the
//    door's frame and slab;
//  - the painted years: on the beat each one is inside x 65-1015 with its near edge above y 1070 and its type >= 150
//    px tall (2026, 2027); frames a year's paint crosses a caption band are listed with its screen speed there; the
//    paint is at <= 36 % when the figure's middle reaches y 1080;
//  - the robots: every face (head box, >= 8 px) out of the caption bands y 1080-1250 / 1360-1460 on every frame it is
//    on screen (and, outside, inside the door's opening); from f150 every robot on screen stands with its feet at
//    y <= 1060; the hero pair's frames with its body in y 1080-1250 are listed (the crane carries it up through);
//  - collisions, every frame: walkers and robots at racks vs each other, the desks, chairs and racks (floor
//    footprints), and the eye vs every object.
// Screen maths without the sway (a few px). Run: bun scripts/clips/rsi-ten-earths/check-timeline-to-dc.ts
import { BOT_POSES, botAnchorsLocal, botWalkAdvance, type BotPose } from "../../../generated/components/rsi-ten-earths/tenEarthsBotBody";
import { RACK } from "../../../generated/components/rsi-ten-earths/tenEarthsHall";
import {
  DESKS,
  DOOR,
  DURATION,
  EZ0,
  F_DOOR,
  HALL_IN,
  RACKS_IN,
  RACK_DZ,
  RACK_HANDS,
  RACK_HAND_GAP,
  WALKERS,
  YEARS,
  CRANE_F0,
  deskPose,
  yearFade,
  aisleZ,
  doorOpen,
  eyeAt,
  rowZ,
  speedAt,
  toScreen,
  yearWidth,
} from "../../../generated/components/rsi-ten-earths/timelineDcWorld";

const issues: string[] = [];
const log: string[] = [];
const bandHit = (y0: number, y1: number) => !(y1 < 1080 || y0 > 1460 || (y0 > 1250 && y1 < 1360));

// ---- the camera ------------------------------------------------------------------------------------------------------
let peak = 0;
for (let f = 0; f < 110; f++) if (speedAt(f) > speedAt(peak)) peak = f;
let zeroes = 0;
for (let f = 0; f < DURATION; f++) {
  const v0 = speedAt(f);
  const v1 = speedAt(f + 1);
  if (f < peak && v1 < v0 - 0.05) issues.push(`speed dips before the peak at f${f}`);
  if (f > peak && f < 145 && v1 > v0 + 0.05) issues.push(`speed rises after the peak at f${f}`);
  if (v0 > 0 && v1 <= 0) zeroes++;
  const j = speedAt(f + 1) - 2 * speedAt(f) + speedAt(f - 1);
  if (Math.abs(j) > (f < CRANE_F0 ? 1.6 : 2.5)) issues.push(`camera jerk ${j.toFixed(2)} at f${f}`);
  const hj = eyeAt(f + 1).He - 2 * eyeAt(f).He + eyeAt(f - 1).He;
  if (f >= 100 && Math.abs(hj) > 3) issues.push(`crane height jerk ${hj.toFixed(2)} at f${f}`);
}
if (zeroes !== 1) issues.push(`forward speed crosses zero ${zeroes} times`);
log.push(`camera: f0 speed ${speedAt(0).toFixed(1)}, peak f${peak} ${speedAt(peak).toFixed(1)} u/f, door f${F_DOOR}, Ze f0 ${eyeAt(0).Ze.toFixed(0)}, max ${Math.max(...Array.from({ length: DURATION }, (_, f) => eyeAt(f).Ze)).toFixed(0)}, f172 ${eyeAt(172).Ze.toFixed(0)}`);
for (let f = 0; f < DURATION; f++) {
  const e = eyeAt(f);
  const dDoor = EZ0 - e.Ze;
  // the slab must be fully up before the eye is within 600 units of the opening
  if (dDoor < 600 && dDoor > -60 && doorOpen(f) < 0.999) issues.push(`f${f}: the slab is not up (open ${doorOpen(f).toFixed(2)}) with the eye ${dDoor.toFixed(0)} from the door`);
  // through the opening: the eye clear of its frame
  if (f < 118 && e.Ze > EZ0 - 40 && e.Ze < 40 && (Math.abs(e.X) > DOOR.w2 - 120 || e.He > DOOR.h - 120)) issues.push(`f${f}: the eye passes the opening too near its frame (He ${e.He.toFixed(0)})`);
}

// ---- the painted years -----------------------------------------------------------------------------------------------
for (const y of YEARS) {
  const w = yearWidth(y) / 2;
  const at = (f: number) => {
    const e = eyeAt(f);
    const n0 = toScreen(e, -w, 0, y.Z);
    const n1 = toScreen(e, w, 0, y.Z);
    const fa = toScreen(e, 0, 0, y.Z + y.L);
    return n0 && n1 && fa ? { x0: n0.x, x1: n1.x, near: n0.y, far: fa.y, h: n0.y - fa.y } : null;
  };
  const b = at(y.beat);
  if (!b) {
    issues.push(`${y.text}: behind the eye on its beat`);
    continue;
  }
  log.push(`${y.text}: beat f${y.beat} x ${b.x0.toFixed(0)}..${b.x1.toFixed(0)} near y ${b.near.toFixed(0)} type ${b.h.toFixed(0)} px`);
  if (b.x0 < 65 || b.x1 > 1015) issues.push(`${y.text}: outside x 65-1015 on its beat`);
  if (b.near > 1070) issues.push(`${y.text}: near edge ${b.near.toFixed(0)} below 1070 on its beat`);
  if (y.scale >= 0.99 && b.h < 150) issues.push(`${y.text}: type only ${b.h.toFixed(0)} px on its beat`);
  // readable window: type >= 60 px with the whole figure above y 1070
  const win: number[] = [];
  const bands: string[] = [];
  for (let f = 0; f < DURATION; f++) {
    const q = at(f);
    if (!q) continue;
    if (q.h >= 60 && q.near <= 1070 && q.x0 >= 40) win.push(f);
    if (bandHit(q.far, Math.min(1920, q.near)) && q.far < 1920) {
      const q1 = at(f + 1);
      bands.push(`f${f} (${q1 ? (q1.far - q.far).toFixed(0) : "-"} px/f)`);
    }
  }
  log.push(`  readable f${win[0]}-f${win[win.length - 1]} (${win.length} f); in a band: ${bands.join(" ")}`);
  // the paint's strength when the figure's middle reaches the first band
  for (let f = 0; f < DURATION; f++) {
    const m = toScreen(eyeAt(f), 0, 0, y.Z + y.L / 2);
    if (m && m.y >= 1080) {
      const a = yearFade(eyeAt(f), y);
      log.push(`  middle at y 1080 on f${f}: paint at ${(a * 100).toFixed(0)} %`);
      if (a > 0.36) issues.push(`${y.text}: paint still at ${(a * 100).toFixed(0)} % with its middle in the band`);
      break;
    }
  }
}

// ---- the robots: faces, collisions ------------------------------------------------------------------------------------
type Fig = { kind: string; X: number; Z: number; pose: BotPose; variant: number; moving: boolean };
const WALK_U = botWalkAdvance(1);
const figsAt = (f: number): Fig[] => {
  const out: Fig[] = [];
  for (const d of DESKS) out.push({ kind: `desk r${d.k} p${d.pair}${d.side < 0 ? "L" : "R"}`, X: d.botX, Z: d.botZ, pose: deskPose(d, f), variant: d.variant, moving: false });
  WALKERS.forEach((w, i) => out.push({ kind: `walker${i}`, X: w.X0 + w.dir * WALK_U * f, Z: aisleZ(w.k), pose: BOT_POSES.walk(w.dir, f + w.phase), variant: w.variant, moving: true }));
  RACK_HANDS.forEach((h, i) => out.push({ kind: `rackhand${i}`, X: h.colX + h.dX, Z: rowZ(h.k + 1) + RACK_DZ - RACK_HAND_GAP, pose: BOT_POSES.turnTo(Math.PI, f, h.seed), variant: h.variant, moving: false }));
  return out;
};
const faceIssues = new Map<string, number[]>();
const feetIssues = new Map<string, number[]>();
const heroBand: number[] = [];
let nearestFaceAtReveal = 0;
for (let f = 0; f < DURATION; f++) {
  const e = eyeAt(f);
  const passed = f >= 118;
  const doorway = !passed && e.Ze < 0;
  if (!passed && e.Ze < EZ0 && doorOpen(f) <= 0.002) continue;
  // the opening's screen box (the inner face) while outside or in the doorway
  const o0 = toScreen(e, -DOOR.w2, -DOOR.h, 0);
  const o1 = toScreen(e, DOOR.w2, 0, 0);
  const yb = e.Ze < EZ0 ? toScreen(e, 0, -DOOR.h * doorOpen(f), -16) : o0;
  for (const g of figsAt(f)) {
    const d = g.Z - e.Ze;
    if (d < 160) continue;
    const s = e.F / d;
    const hPx = 240 * s;
    const fx = 540 + (g.X - e.X) * s;
    const fy = e.Hy + e.He * s;
    if (fx < -60 || fx > 1140 || fy - hPx > 1920 || fy < 0) continue;
    if (doorway && o0 && o1 && yb && (fx < o0.x || fx > o1.x || fy < yb.y)) continue;
    // from f150 the feet of every robot on screen at y <= 1060
    if (f >= 150 && fy > 1060 && fy - hPx < 1920) {
      const l = feetIssues.get(g.kind) ?? [];
      l.push(f);
      feetIssues.set(g.kind, l);
    }
    if (hPx < 20) continue;
    const an = botAnchorsLocal(g.variant, g.pose);
    const top = fy + an.headTop[1] * s;
    const bot = fy + (an.headC[1] + an.headR * 0.9) * s;
    const x = fx + an.headC[0] * s;
    if (x < -40 || x > 1120) continue;
    if (doorway && o0 && o1 && yb && (x < o0.x || x > o1.x || bot < o0.y || top > Math.min(o1.y, yb.y))) continue;
    if (bot - top < 8) continue;
    if (bandHit(top, bot)) {
      const l = faceIssues.get(g.kind) ?? [];
      l.push(f);
      faceIssues.set(g.kind, l);
    }
    if (g.kind === "desk r0 p0R" && fy > 1080 && top < 1250 && f >= 118) heroBand.push(f);
    if (f >= 133 && f <= 143) nearestFaceAtReveal = Math.max(nearestFaceAtReveal, bot);
  }
}
for (const [k, fs] of faceIssues) issues.push(`face in a caption band: ${k} f${fs[0]}-f${fs[fs.length - 1]} (${fs.length} f)`);
for (const [k, fs] of feetIssues) issues.push(`feet below y 1060 after f150: ${k} f${fs[0]}-f${fs[fs.length - 1]}`);
log.push(`lowest face bottom on the reveal (f133-143): y ${nearestFaceAtReveal.toFixed(0)}`);
log.push(`hero pair's body in y 1080-1250: ${heroBand.length ? `f${heroBand[0]}-f${heroBand[heroBand.length - 1]} (${heroBand.length} f)` : "never"}`);
log.push(`crane from f${CRANE_F0}: eye at f150 He ${eyeAt(150).He.toFixed(0)} Ze ${eyeAt(150).Ze.toFixed(0)}, f172 He ${eyeAt(172).He.toFixed(0)} Ze ${eyeAt(172).Ze.toFixed(0)}`);

// floor footprints (X0, X1, Z0, Z1): desks, chairs, racks; moving robots ~0.5 x 0.4 m
type Box = { name: string; x0: number; x1: number; z0: number; z1: number };
const statics: Box[] = [];
for (const d of DESKS) {
  statics.push({ name: `desk r${d.k} p${d.pair}${d.side}`, x0: d.deskX - 62.5, x1: d.deskX + 62.5, z0: d.Z, z1: d.Z + 249 });
  statics.push({ name: `chair r${d.k} p${d.pair}${d.side}`, x0: d.botX - 52, x1: d.botX + 52, z0: d.botZ - 52, z1: d.botZ + 52 });
}
for (const r of RACKS_IN) statics.push({ name: `rack ${r.id}`, x0: r.X - RACK.w / 2, x1: r.X + RACK.w / 2, z0: r.Z, z1: r.Z + RACK.d });
const hit = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.z0 < b.z1 && b.z0 < a.z1;
const coll = new Set<string>();
for (let f = 0; f < DURATION; f++) {
  const movers = figsAt(f).filter((g) => g.moving || g.kind.startsWith("rackhand")).map((g) => ({ name: g.kind, x0: g.X - 46, x1: g.X + 46, z0: g.Z - 36, z1: g.Z + 36 }));
  for (let i = 0; i < movers.length; i++) {
    const m = movers[i];
    if (m.x0 < HALL_IN.x0 + 60 || m.x1 > HALL_IN.x1 - 60) coll.add(`${m.name} reaches a wall at f${f}`);
    for (const s of statics) if (Math.abs(s.z0 - m.z0) < 800 && hit(m, s)) coll.add(`${m.name} x ${s.name} (first f${f})`);
    for (let j = i + 1; j < movers.length; j++) if (hit(m, movers[j])) coll.add(`${m.name} x ${movers[j].name} (first f${f})`);
  }
  // the eye vs everything inside
  const e = eyeAt(f);
  if (e.Ze > 0) for (const s of statics) if (s.z0 < 3000 && e.Ze > s.z0 - 150 && Math.abs(s.x0 + s.x1) / 2 < 300) coll.add(`the eye within 150 of ${s.name} at f${f}`);
}
const seen = new Set<string>();
for (const c of coll) {
  const key = c.replace(/\(first f\d+\)|at f\d+/, "");
  if (seen.has(key)) continue;
  seen.add(key);
  issues.push(`collision: ${c}`);
}

console.log(log.join("\n"));
console.log(issues.length ? `ISSUES (${issues.length}):\n${issues.join("\n")}` : "OK: no issues");
