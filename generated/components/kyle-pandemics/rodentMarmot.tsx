// ---------------------------------------------------------------------------
// rodentMarmot: the steppe things of RodentFromCentralAsia (kyle-pandemics, cut 1), drawn in SVG through the cut's
// one camera (rodentCamera.ts): the grey marmot (Marmota baibacina, the Tian Shan plague reservoir; grizzled
// cream-umber fur, broad flat head, small low ears, incisors) sitting up on its burrow of loose earth (an irregular
// heap, an apron of thrown-out soil with clods and pebbles, the mouth in its front slope), the orange welling out of
// the mouth as one broad wet tongue that parts into lobes and pools on the ground, contact shadows, sparse grass tufts
// standing on the ground plane. One light from the upper left (fixed in the world). Painter's order by depth.
// When the marmot is smaller than a mark it becomes one: a small cream dot on a dark casing at the origin.
// ---------------------------------------------------------------------------
import React from "react";
import { AWAY, HOLE, MARMOT, MOUND, RIGHT, RIVULETS, WELL, hazeAt, moundY, steppeAt, toScreen, type Cam } from "./rodentCamera";
import { FALL_ANG, SPOIL, earthRadius } from "./rodentPlace";

const INK = "#E9DDBF";
const DARK = "#17120D";
const LAND = "#3F3428";
const ACCENT = "#FFB000";
const ACCENT_DEEP = "#D98A0C";
const EARTH_LIT = "#8A7350";
const EARTH = "#68563C";
const EARTH_SH = "#2B231A";

type P = [number, number];
const f2 = (v: number) => (Math.round(v * 100) / 100).toString();
const pd = (pts: P[], close = true) => `M${pts.map((p) => `${f2(p[0])},${f2(p[1])}`).join("L")}${close ? "Z" : ""}`;
const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * Math.max(0, Math.min(1, t)))).join(",")})`;
};
const hatchD = (box: [number, number, number, number], angle: number, gap: number) => {
  const [x0, y0, x1, y1] = box;
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2 + 2;
  let d = "";
  for (let s = -R; s <= R; s += gap) d += `M${f2(cx - dy * s - dx * R)},${f2(cy + dx * s - dy * R)}L${f2(cx - dy * s + dx * R)},${f2(cy + dx * s + dy * R)}`;
  return d;
};
const bbox = (pts: P[]): [number, number, number, number] => [Math.min(...pts.map((p) => p[0])), Math.min(...pts.map((p) => p[1])), Math.max(...pts.map((p) => p[0])), Math.max(...pts.map((p) => p[1]))];



// ---------------------------------------------------------------------------
// THE MARMOT (drawing units: 100 tall, feet at (0, 0), up is - y; facing a little left, toward the west)
// ---------------------------------------------------------------------------
/** the body from the neck down (the head is its own rig, below) */
const BODY =
  "M-30,0C-38,-4,-41,-22,-35,-36C-31,-46,-26,-54,-22,-60C-19,-65,-18,-68,-17,-71C-12,-79,10,-80,18,-68C24,-58,32,-40,36,-24C39,-12,36,-2,28,0Z";
/** grizzled fur: the lit front (cream), the umber-ochre back, the shaded side, the pale belly */
const LIT = "M-40,-80C-28,-80,-14,-76,-8,-68C-4,-52,-6,-34,-10,-18C-14,-8,-20,-2,-40,2Z";
const SHADE = "M8,-78C14,-77,17,-72,18.5,-68C24.5,-58,32.5,-40,36.5,-24C39.5,-12,36.5,-2,28,0.5L14,0.5C20,-10,21,-24,17,-40C13,-52,11,-62,8,-78Z";
const BELLY = "M-22,-58C-27,-50,-31,-38,-30,-24C-29,-14,-24,-6,-16,-4C-10,-14,-10,-34,-13,-48C-15,-55,-18,-59,-22,-58Z";
const ARM_B = "M3,-66C-2,-62,-7,-57,-11,-50C-13,-46,-9,-43,-6,-46C-3,-52,1,-57,7,-61Z";
const ARM_F = "M-6,-68C-13,-63,-20,-58,-22,-50C-23,-45,-18,-42,-15,-46C-13,-52,-9,-57,-1,-62Z";
const FOOT = "M-33,-1C-40,0,-42.5,3.5,-36.5,4.5L-17,4.5C-14.5,2.5,-19,-1,-24,-1Z";
const TAIL = "M26,-5C33,-6.5,39,-5,42,1C38,4,33,3.5,27,2.5Z";
const TAIL_TIP = "M38,-3.5C41,-3,43.5,-1,44.5,1.5C42.5,3.5,40,3.6,37.5,3Z";
const THIGH = "M-12,-1.5C-7,-14,6,-19,20,-12";
const FUR_LIT = "#E4D6B1";
const FUR_MID = "#A68C5F";
const FUR_SH = "#76603F";
const FUR_PALE = "#EEE3C6";
const TIP = "#33281C";
/** the grizzle: short ticks over the back and flanks, dark and light, in the body's own units */
const GRIZZLE = (() => {
  let dk = "";
  let lt = "";
  for (let i = 0; i < 140; i++) {
    const x = -34 + hash(i, 1) * 70;
    const y = -76 + hash(i, 2) * 74;
    if (x < -14 + (y + 76) * 0.05 && y > -62) continue; // not on the belly / lit front
    const l = 2 + hash(i, 3) * 2.2;
    const a = 1.2 + hash(i, 4) * 0.5; // fur lies down and back
    const seg = `M${f2(x)},${f2(y)}l${f2(Math.cos(a) * l)},${f2(Math.sin(a) * l)}`;
    if (hash(i, 5) < 0.6) dk += seg;
    else lt += seg;
  }
  return { dk, lt };
})();
const NECK: P = [-1, -73];
const mixN = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (u: number) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const win = (f: number, a: number, b: number) => ease((f - a) / (b - a));
/** the head's life: turn (0 = three-quarter to the left, toward the west; 1 = to the camera), nod (deg), sniff 0..1 */
export const headAt = (f: number) => {
  const turn = win(f, 22, 36) * (1 - win(f, 56, 70));
  const sniff = Math.max(win(f, 3, 7) * (1 - win(f, 17, 21)), win(f, 73, 77) * (1 - win(f, 86, 90)));
  const nod = -2.6 * sniff * Math.sin(f * 1.9) + 5 * Math.sin(Math.PI * win(f, 44, 52)) - 4 * win(f, 66, 76);
  const blink = 1 - 0.9 * Math.max(0, Math.sin(Math.max(0, Math.min(1, (f - 47) / 5)) * Math.PI));
  return { turn, sniff, nod, blink };
};
let HN = 0;
/** a marmot's head: broad and flat, small low ears, small dark eyes set high, a pale muzzle with a dark nose and two
 *  cream incisors; the crown grizzled umber-ochre, lit at the upper left */
const Head: React.FC<{ id: string; sw: number; frame: number }> = ({ id, sw, frame }) => {
  const { turn: u, sniff, nod, blink } = headAt(frame);
  const tw = sniff * 0.6 * Math.sin(frame * 2.3);
  const sk = { cx: mixN(0, -1, u), cy: -10.5, rx: 16.5, ry: 10.2 };
  const mz = { cx: mixN(-14.5, -1.5, u), cy: mixN(-6.8, -5.2, u) + tw * 0.3, rx: mixN(7.2, 7.6, u), ry: 5.3 };
  const nose: P = [mixN(-21, -1.5, u), mixN(-8, -6.6, u) + tw];
  const earN: P = [mixN(4.5, -12.8, u), mixN(-16.8, -15.6, u)];
  const earF: P = [mixN(12.5, 10.8, u), mixN(-16.4, -15.6, u)];
  const eyeN: P = [mixN(-8.6, -5.6, u), -14.6];
  const eyeF: P = [mixN(3.6, 3.8, u), -14.6];
  const farA = ease((u - 0.25) / 0.45);
  const shadeX = mixN(5, 8, u);
  const eye = (c: P, a: number, k: string) =>
    a <= 0.01 ? null : (
      <g key={k} opacity={a}>
        <ellipse cx={c[0]} cy={c[1]} rx={1.65} ry={Math.max(0.25, 1.5 * blink)} fill={DARK} />
        {blink > 0.6 ? <circle cx={c[0] - 0.5} cy={c[1] - 0.5} r={0.42} fill={FUR_PALE} /> : null}
      </g>
    );
  const shapes = (
    <>
      <ellipse cx={earF[0]} cy={earF[1]} rx={2.3} ry={1.8} />
      <ellipse cx={earN[0]} cy={earN[1]} rx={2.3} ry={1.8} />
      <ellipse cx={sk.cx} cy={sk.cy} rx={sk.rx} ry={sk.ry} />
      <ellipse cx={mz.cx} cy={mz.cy} rx={mz.rx} ry={mz.ry} />
    </>
  );
  // the incisors: two small cream teeth under the nose
  const tx = nose[0] + mixN(1.2, 0, u);
  const ty = nose[1] + 3.6;
  return (
    <g transform={`translate(${NECK[0]},${NECK[1]}) rotate(${nod.toFixed(2)})`}>
      <defs>
        <clipPath id={`${id}-hd`}>{shapes}</clipPath>
      </defs>
      <g fill={DARK} stroke={DARK} strokeWidth={sw * 2.2}>
        {shapes}
      </g>
      <g fill={FUR_MID}>{shapes}</g>
      <g clipPath={`url(#${id}-hd)`}>
        <ellipse cx={sk.cx - 6} cy={sk.cy - 3} rx={10} ry={5.5} fill={FUR_LIT} opacity={0.85} />
        <rect x={shadeX} y={-26} width={30} height={30} fill={FUR_SH} />
        <path d={hatchD([shadeX - 2, -26, shadeX + 20, 2], 112, 2.3)} fill="none" stroke={DARK} strokeWidth={sw * 0.4} strokeOpacity={0.5} />
        <path d={hatchD([-18, -22, 6, -6], 64, 3)} fill="none" stroke={DARK} strokeWidth={sw * 0.3} strokeOpacity={0.3} />
        <ellipse cx={mz.cx} cy={mz.cy + 0.5} rx={mz.rx} ry={mz.ry} fill={FUR_PALE} />
        <ellipse cx={mixN(-6, -4, u)} cy={-6.5} rx={5} ry={3} fill={FUR_PALE} opacity={0.6} />
      </g>
      <ellipse cx={earN[0] + 0.2} cy={earN[1] + 0.3} rx={1.1} ry={0.8} fill={TIP} opacity={0.7} />
      <ellipse cx={earF[0] + 0.2} cy={earF[1] + 0.3} rx={1.1} ry={0.8} fill={TIP} opacity={0.3 + 0.4 * u} />
      {eye(eyeN, 1, "n")}
      {eye(eyeF, farA, "f")}
      <path d={`M${f2(nose[0] - 2.2)},${f2(nose[1] - 0.8)}Q${f2(nose[0])},${f2(nose[1] - 2.2)} ${f2(nose[0] + 2.2)},${f2(nose[1] - 0.8)}Q${f2(nose[0] + 1.4)},${f2(nose[1] + 1.3)} ${f2(nose[0])},${f2(nose[1] + 1.3)}Q${f2(nose[0] - 1.4)},${f2(nose[1] + 1.3)} ${f2(nose[0] - 2.2)},${f2(nose[1] - 0.8)}Z`} fill={TIP} />
      <path d={`M${f2(nose[0])},${f2(nose[1] + 1.3)}L${f2(nose[0])},${f2(nose[1] + 2.6)}`} stroke={DARK} strokeWidth={sw * 0.4} />
      <rect x={tx - 1.25} y={ty - 0.7} width={1.2} height={2.4} fill={FUR_PALE} stroke={DARK} strokeWidth={sw * 0.28} />
      <rect x={tx + 0.05} y={ty - 0.7} width={1.2} height={2.4} fill={FUR_PALE} stroke={DARK} strokeWidth={sw * 0.28} />
      <path
        d={`M${f2(nose[0] + 2.6)},${f2(nose[1] + 1.4)}l${f2(8 - 2 * u)},${f2(-1.5 + tw)}M${f2(nose[0] + 2.6)},${f2(nose[1] + 2.2)}l${f2(8 - 2 * u)},${f2(1.2 + tw)}M${f2(nose[0] - 2.6)},${f2(nose[1] + 1.4)}l${f2(-6 * u - 2)},${f2(-1.2)}`}
        fill="none"
        stroke={DARK}
        strokeWidth={sw * 0.28}
        strokeOpacity={0.5}
      />
    </g>
  );
};
const MarmotArt: React.FC<{ uid: string; sw: number; frame: number }> = ({ uid, sw, frame }) => {
  const id = `${uid}-${HN++ % 1}`;
  // life: a slow sway and breathing about the feet, a tail flick, and the head (headAt)
  const lean = 1.2 * Math.sin(frame / 21) + 0.5 * Math.sin(frame / 9.3);
  const breath = 1 + 0.012 * Math.sin(frame / 6.5);
  const flick = (f0: number) => Math.max(0, Math.sin(Math.max(0, Math.min(1, (frame - f0) / 10)) * Math.PI));
  const tail = 9 * flick(14) + 7 * flick(62);
  return (
    <g strokeLinejoin="round" strokeLinecap="round" transform={`rotate(${lean.toFixed(3)}) scale(1,${breath.toFixed(4)})`}>
      <defs>
        <clipPath id={`${id}-body`}>
          <path d={BODY} />
        </clipPath>
      </defs>
      {/* the short tail on the ground behind, dark-tipped */}
      <g transform={`rotate(${(-tail).toFixed(2)},27,0)`}>
        <path d={TAIL} fill={FUR_MID} stroke={DARK} strokeWidth={sw} />
        <path d={TAIL_TIP} fill={TIP} />
      </g>
      {/* the body: casing, umber-ochre fur, the cream lit front, the pale belly, the shaded side, the grizzle */}
      <path d={BODY} fill={DARK} stroke={DARK} strokeWidth={sw * 2.2} />
      <path d={BODY} fill={FUR_MID} />
      <g clipPath={`url(#${id}-body)`}>
        <path d={LIT} fill={FUR_LIT} />
        <path d={BELLY} fill={FUR_PALE} />
        <path d={SHADE} fill={FUR_SH} />
        <path d={hatchD([10, -80, 42, 2], 112, 2.5)} fill="none" stroke={DARK} strokeWidth={sw * 0.42} strokeOpacity={0.5} />
        <path d={GRIZZLE.dk} fill="none" stroke={DARK} strokeWidth={sw * 0.45} strokeOpacity={0.5} />
        <path d={GRIZZLE.lt} fill="none" stroke={FUR_PALE} strokeWidth={sw * 0.45} strokeOpacity={0.55} />
      </g>
      <path d={THIGH} fill="none" stroke={DARK} strokeWidth={sw * 0.7} strokeOpacity={0.75} />
      <path d={BODY} fill="none" stroke={DARK} strokeWidth={sw} />
      <Head id={`${id}-h`} sw={sw} frame={frame} />
      {/* the forepaws held at the chest, the hind foot */}
      <path d={ARM_B} fill={FUR_MID} stroke={DARK} strokeWidth={sw * 0.8} />
      <path d={ARM_F} fill={FUR_LIT} stroke={DARK} strokeWidth={sw * 0.8} />
      <path d="M-21,-45L-19.5,-47M-18.5,-43.5L-17.5,-45.6M-10,-45L-8.8,-47" stroke={DARK} strokeWidth={sw * 0.4} strokeOpacity={0.7} />
      <path d={FOOT} fill={FUR_LIT} stroke={DARK} strokeWidth={sw} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE BURROW: loose earth (an irregular heap and the apron of thrown-out soil in front of the mouth, clods and
// pebbles), lit from the upper left (a flat lit tone, a flat shade tone with the house hatch), no hard rim
// ---------------------------------------------------------------------------
const SECT = 72;
const LEVELS = [0, 0.12, 0.3, 0.5, 0.7, 0.86, 0.96];
/** the earth's contour at height h (fraction of the top), as 3D points */
const contourAt = (frac: number): [number, number, number][] => {
  const out: [number, number, number][] = [];
  for (let j = 0; j < SECT; j++) {
    const th = (j / SECT) * Math.PI * 2;
    const ux = RIGHT[0] * Math.cos(th) + AWAY[0] * Math.sin(th);
    const uy = RIGHT[1] * Math.cos(th) + AWAY[1] * Math.sin(th);
    const target = frac * MOUND.h;
    let lo = 0;
    let hi = MOUND.R * 2;
    if (frac <= 0) {
      const r = earthRadius(th);
      out.push([MOUND.c[0] + ux * r, 0, MOUND.c[1] + uy * r]);
      continue;
    }
    // the outermost radius still at or above the target height
    const at = (r: number) => moundY(MOUND.c[0] + ux * r, MOUND.c[1] + uy * r);
    for (let i = 0; i < 20; i++) {
      const m = (lo + hi) / 2;
      if (at(m) >= target) lo = m;
      else hi = m;
    }
    out.push([MOUND.c[0] + ux * lo, target, MOUND.c[1] + uy * lo]);
  }
  return out;
};
const CONTOURS = LEVELS.map(contourAt);
/** clods and pebbles on the apron and round the foot (map px, size, kind) */
const BITS = (() => {
  const out: { x: number; y: number; r: number; pebble: boolean; seed: number }[] = [];
  for (let i = 0; i < 70; i++) {
    const onApron = i < 44;
    let x: number;
    let y: number;
    if (onApron) {
      const a = (hash(i, 7) - 0.5) * 1.9;
      const d = SPOIL.r * (0.3 + 0.95 * Math.sqrt(hash(i, 8)));
      const dirx = Math.cos(FALL_ANG + a);
      const diry = Math.sin(FALL_ANG + a);
      x = SPOIL.c[0] + (RIGHT[0] * dirx + AWAY[0] * diry) * d;
      y = SPOIL.c[1] + (RIGHT[1] * dirx + AWAY[1] * diry) * d;
    } else {
      const th = hash(i, 9) * Math.PI * 2;
      const r = earthRadius(th) * (0.92 + 0.2 * hash(i, 10));
      x = MOUND.c[0] + (RIGHT[0] * Math.cos(th) + AWAY[0] * Math.sin(th)) * r;
      y = MOUND.c[1] + (RIGHT[1] * Math.cos(th) + AWAY[1] * Math.sin(th)) * r;
    }
    if (Math.hypot(x - HOLE.at[0], y - HOLE.at[1]) < HOLE.r * 1.6) continue;
    out.push({ x, y, r: 0.45 + 0.9 * hash(i, 11), pebble: hash(i, 12) < 0.4, seed: i });
  }
  return out;
})();
/** a circle on the earth's surface (centre c map px, radius r), as screen points */
const surfaceCircle = (cam: Cam, c: P, r: number, lift = 0.15, n = 28): P[] => {
  const pts: P[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const x = c[0] + Math.cos(a) * r;
    const y = c[1] + Math.sin(a) * r;
    const s = toScreen(cam, x, moundY(x, y) + lift, y);
    pts.push([s.x, s.y]);
  }
  return pts;
};
/** a soft dark ellipse on the ground / surface at (x, y), radius rx (map px), offset to the lower right of the light */
const Shadow: React.FC<{ cam: Cam; x: number; y: number; r: number; amt: number; id: string; lift?: number }> = ({ cam, x, y, r, amt, id, lift = 0.05 }) => {
  const cx = x + RIGHT[0] * r * 0.25 - AWAY[0] * r * 0.15;
  const cy = y + RIGHT[1] * r * 0.25 - AWAY[1] * r * 0.15;
  const pts: P[] = [];
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    const s = toScreen(cam, px, moundY(px, py) + lift, py);
    pts.push([s.x, s.y]);
  }
  const b = bbox(pts);
  const c = toScreen(cam, cx, moundY(cx, cy) + lift, cy);
  return (
    <g>
      <defs>
        <radialGradient id={id} cx={c.x} cy={c.y} r={Math.max(1, (b[2] - b[0]) / 2)} gradientUnits="userSpaceOnUse" gradientTransform={`translate(${f2(c.x)},${f2(c.y)}) scale(1,${f2(Math.max(0.05, (b[3] - b[1]) / Math.max(1, b[2] - b[0])))}) translate(${f2(-c.x)},${f2(-c.y)})`}>
          <stop offset="0" stopColor={DARK} stopOpacity={0.8 * amt} />
          <stop offset="0.6" stopColor={DARK} stopOpacity={0.5 * amt} />
          <stop offset="1" stopColor={DARK} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={pd(pts)} fill={`url(#${id})`} />
    </g>
  );
};

/** THE SEEP: orange wells up in the mouth, brims over the lower lip as ONE broad wet tongue down the fall line over
 *  the apron, which splits only near the bottom into lobes; each lobe pools on the ground (the ground shader opens
 *  its pool on its arrival frame, with a crisp organic edge) */
const Seep: React.FC<{ cam: Cam; frame: number; holeIn: P[] }> = ({ cam, frame, holeIn }) => {
  const well = ease((frame - WELL[0]) / (WELL[1] - WELL[0]));
  if (well <= 0) return null;
  const hc = holeIn.reduce((acc, q) => [acc[0] + q[0] / holeIn.length, acc[1] + q[1] / holeIn.length] as P, [0, 0] as P);
  const fill = holeIn.map((q) => [hc[0] + (q[0] - hc[0]) * well, hc[1] + (q[1] - hc[1]) * (0.35 + 0.65 * well) + (1 - well) * 2] as P);
  const sc = toScreen(cam, HOLE.at[0], 0, HOLE.at[1]).s;
  const lipR = HOLE.r * 0.55;
  const fx = RIGHT[0] * Math.cos(FALL_ANG) + AWAY[0] * Math.sin(FALL_ANG);
  const fy = RIGHT[1] * Math.cos(FALL_ANG) + AWAY[1] * Math.sin(FALL_ANG);
  const nx = -fy;
  const ny = fx;
  const lip: P = [HOLE.at[0] + fx * lipR, HOLE.at[1] + fy * lipR];
  // the tongue's reach: from the lip to the lobes' ends along the fall line
  const L = Math.hypot(RIVULETS[1].end[0] - lip[0], RIVULETS[1].end[1] - lip[1]);
  const t0 = Math.min(...RIVULETS.map((r) => r.start));
  const t1 = Math.max(...RIVULETS.map((r) => r.arrive));
  const g = ease((frame - t0) / (RIVULETS[1].arrive - t0));
  if (g <= 0) return <path d={pd(fill)} fill="#A9690A" stroke={ACCENT_DEEP} strokeWidth={Math.max(0.6, 0.2 * sc)} strokeLinejoin="round" />;
  const len = L * g * 0.9;
  const scr = (x: number, y: number): P => {
    const q = toScreen(cam, x, moundY(x, y) + 0.3, y);
    return [q.x, q.y];
  };
  const width = (t: number) => HOLE.r * (1.25 + 1.1 * t) * (1 + 0.08 * Math.sin(t * 11 + 1.3));
  const left: P[] = [];
  const right: P[] = [];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const d = (len * i) / N;
    const t = d / L;
    const w = width(t) * (i === 0 ? 0.85 : 1);
    const wobL = 0.5 * Math.sin(t * 17 + 0.4) + 0.3 * Math.sin(t * 31 + 1.1);
    const wobR = 0.5 * Math.sin(t * 13 + 2.2) + 0.3 * Math.sin(t * 27 + 0.3);
    left.push(scr(lip[0] + fx * d + nx * (w * 0.5 + wobL), lip[1] + fy * d + ny * (w * 0.5 + wobL)));
    right.push(scr(lip[0] + fx * d - nx * (w * 0.5 + wobR), lip[1] + fy * d - ny * (w * 0.5 + wobR)));
  }
  // the lobes: near the bottom the tongue parts; each lobe runs on to its end and rounds off
  const lobes = RIVULETS.map((rv, k) => {
    const gl = ease((frame - (rv.start + (rv.arrive - rv.start) * 0.6)) / ((rv.arrive - rv.start) * 0.4));
    if (gl <= 0) return null;
    const from: P = [lip[0] + fx * L * 0.72, lip[1] + fy * L * 0.72];
    const tip: P = [from[0] + (rv.end[0] - from[0]) * gl, from[1] + (rv.end[1] - from[1]) * gl];
    const ldx = tip[0] - from[0];
    const ldy = tip[1] - from[1];
    const ll = Math.hypot(ldx, ldy) || 1;
    const ux = ldx / ll;
    const uy = ldy / ll;
    const w0 = rv.w * 1.05;
    const pts: P[] = [];
    const M = 10;
    for (let i = 0; i <= M; i++) {
      const t = i / M;
      const w = w0 * (1 - 0.25 * t);
      pts.push(scr(from[0] + ldx * t - uy * w * 0.5, from[1] + ldy * t + ux * w * 0.5));
    }
    for (let i = 1; i < 8; i++) {
      const th = (i / 8) * Math.PI;
      const w = w0 * 0.75 * 0.5;
      pts.push(scr(tip[0] - uy * Math.cos(th) * w + ux * Math.sin(th) * w * 0.9, tip[1] + ux * Math.cos(th) * w + uy * Math.sin(th) * w * 0.9));
    }
    for (let i = M; i >= 0; i--) {
      const t = i / M;
      const w = w0 * (1 - 0.25 * t);
      pts.push(scr(from[0] + ldx * t + uy * w * 0.5, from[1] + ldy * t - ux * w * 0.5));
    }
    return <path key={k} d={pd(pts)} fill={ACCENT_DEEP} />;
  });
  void t1;
  const sheet = [...left, ...right.slice().reverse()];
  return (
    <g strokeLinejoin="round">
      {/* the wet edge (a darker orange), the sheet, its lobes, a sheen down its lit side */}
      <path d={pd(sheet)} fill={ACCENT_DEEP} stroke="#9A600A" strokeWidth={Math.max(0.8, 0.3 * sc)} />
      {lobes}
      <path d={pd(left.slice(1), false)} fill="none" stroke={ACCENT} strokeWidth={Math.max(0.7, 0.35 * sc)} strokeOpacity={0.85} strokeLinecap="round" />
      <path d={pd(fill)} fill="#A9690A" stroke={ACCENT_DEEP} strokeWidth={Math.max(0.6, 0.2 * sc)} />
    </g>
  );
};

const Mound: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const sc = toScreen(cam, MOUND.c[0], 0, MOUND.c[1]).s;
  // the earth as stacked contours (their union is the silhouette: irregular, no hard rim)
  const rings = CONTOURS.map((ring) => ring.map((q) => toScreen(cam, q[0], q[1], q[2])).map((q) => [q.x, q.y] as P));
  const allPts = rings.flat();
  const box = bbox(allPts);
  const wpx = box[2] - box[0];
  const hpx = box[3] - box[1];
  const unionD = rings.map((r) => pd(r)).join("");
  const litD = rings.map((r) => pd(r.map(([x, y]) => [x - 0.16 * wpx, y - 0.4 * hpx] as P))).join("");
  const hole = surfaceCircle(cam, HOLE.at, HOLE.r, 0.1);
  const holeIn = surfaceCircle(cam, [HOLE.at[0] - AWAY[0] * 0.7, HOLE.at[1] - AWAY[1] * 0.7], HOLE.r * 0.74, 0.1);
  const uid = "rm";
  const bits = BITS.map((b) => {
    const q = toScreen(cam, b.x, moundY(b.x, b.y) + 0.15, b.y);
    const rr = Math.max(0.7, b.r * q.s);
    const ry = rr * (0.55 + 0.2 * hash(b.seed, 13));
    return (
      <ellipse key={b.seed} cx={q.x} cy={q.y} rx={rr} ry={ry} fill={b.pebble ? "#8E7B58" : "#3A2F22"} stroke={DARK} strokeWidth={Math.max(0.4, 0.12 * q.s)} strokeOpacity={b.pebble ? 0.8 : 0.4} />
    );
  });
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-sil`}>
          <path d={unionD} />
        </clipPath>
        <clipPath id={`${uid}-lit`}>
          <path d={litD} />
        </clipPath>
      </defs>
      {/* the heap's outline: every contour cased, then filled over, so only the irregular outer edge stays */}
      <path d={unionD} fill={DARK} stroke={DARK} strokeWidth={Math.max(1.2, 0.5 * sc)} strokeLinejoin="round" />
      {/* the shade tone over the whole heap, the house hatch on it, then the lit tone where the light reaches */}
      <g clipPath={`url(#${uid}-sil)`}>
        <rect x={box[0] - 2} y={box[1] - 2} width={wpx + 4} height={hpx + 4} fill={EARTH_SH} />
        <path d={hatchD(box, 112, Math.max(2, 0.75 * sc))} fill="none" stroke={DARK} strokeWidth={Math.max(0.5, 0.16 * sc)} strokeOpacity={0.55} />
        <g clipPath={`url(#${uid}-lit)`}>
          <rect x={box[0] - 2} y={box[1] - 2} width={wpx + 4} height={hpx + 4} fill={EARTH} />
          <path d={rings.slice(3).map((r) => pd(r.map(([x, y]) => [x - 0.22 * wpx, y - 0.5 * hpx] as P))).join("")} fill={EARTH_LIT} opacity={0.75} />
        </g>
        {/* the contours as broken engraved soil lines (loose earth, not a rim) */}
        {rings.slice(1).map((r, i) => (
          <path key={i} d={pd(r, false)} fill="none" stroke={DARK} strokeWidth={Math.max(0.4, 0.1 * sc)} strokeOpacity={0.35} strokeDasharray={`${f2(sc * 1.6)} ${f2(sc * 1.9)}`} />
        ))}
      </g>
      {bits}
      {/* the burrow mouth: a dark opening in the front slope */}
      <path d={pd(hole)} fill={EARTH_SH} stroke={DARK} strokeWidth={Math.max(0.7, 0.35 * sc)} />
      <path d={pd(holeIn)} fill="#0E0B08" />
      <Seep cam={cam} frame={frame} holeIn={holeIn} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// GRASS TUFTS: sparse, standing on the ground plane, fading with distance and with the steppe
// ---------------------------------------------------------------------------
type Tuft = { x: number; y: number; h: number; seed: number };
const TUFTS: Tuft[] = (() => {
  const out: Tuft[] = [];
  const G = 9;
  const Rr = 300;
  let n = 0;
  for (let i = -Rr; i <= Rr; i += G)
    for (let j = -Rr; j <= Rr; j += G) {
      n++;
      if (hash(n, 1) > 0.16) continue;
      const x = MOUND.c[0] + i + (hash(n, 2) - 0.5) * G * 0.9;
      const y = MOUND.c[1] + j + (hash(n, 3) - 0.5) * G * 0.9;
      const r = Math.hypot(x - MOUND.c[0], y - MOUND.c[1]);
      if (r > Rr || r < MOUND.R + 3) continue;
      out.push({ x, y, h: 4.2 + 3.4 * hash(n, 4), seed: n });
    }
  return out;
})();
const tuftD = (seed: number, s: number, h: number, bx: number, by: number, frame: number) => {
  const wind = 0.09 * Math.sin(frame / 13 + bx * 0.004 + seed * 0.7) + 0.05 * Math.sin(frame / 5.3 + seed);
  let d = "";
  const nb = 5 + Math.floor(hash(seed, 5) * 3);
  for (let b = 0; b < nb; b++) {
    const lean = (b / (nb - 1) - 0.5) * 1.6 + (hash(seed, 10 + b) - 0.5) * 0.4;
    const hh = h * (0.55 + 0.45 * hash(seed, 20 + b)) * s;
    const x0 = bx + (b / (nb - 1) - 0.5) * 1.2 * s;
    const tipX = x0 + lean * hh * 0.55 + wind * hh;
    const tipY = by - hh;
    const cx = x0 + lean * hh * 0.1;
    const cy = by - hh * 0.65;
    d += `M${f2(x0)},${f2(by)}Q${f2(cx)},${f2(cy)} ${f2(tipX)},${f2(tipY)}`;
  }
  return d;
};

// ---------------------------------------------------------------------------
// THE STEPPE LAYER
// ---------------------------------------------------------------------------
export const SteppeThings: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const st = steppeAt(cam.D);
  // the tufts go before the ground's streaks do: once they are a few px they read as specks
  const tu = Math.max(0, Math.min(1, (cam.D - 175) / (330 - 175)));
  const tuftA = st * (1 - tu * tu * (3 - 2 * tu));
  const items: { z: number; el: React.ReactNode }[] = [];
  // tufts, in two layers: behind the mound and in front of it
  const centre = toScreen(cam, MOUND.c[0], 0, MOUND.c[1]);
  if (tuftA > 0.01) {
    const sets = [0, 1].map(() => ({ c: "", n: "", f: "" }));
    for (const t of TUFTS) {
      const s = toScreen(cam, t.x, 0, t.y);
      if (s.z < 4 || s.x < -60 || s.x > 1140 || s.y < -40 || s.y > 2000) continue;
      if (t.h * s.s < 8) continue;
      const haze = hazeAt(Math.hypot(t.x - cam.C[0], cam.C[1], t.y - cam.C[2]), cam.D);
      if (haze > 0.3) continue;
      const d = tuftD(t.seed, s.s, t.h, s.x, s.y, frame);
      const set = sets[s.z < centre.z ? 1 : 0];
      set.c += d;
      if (haze < 0.3) set.n += d;
      else set.f += d;
    }
    sets.forEach((q, i) =>
      items.push({
        z: i === 0 ? 1e9 : -1e9,
        el: (
          <g key={`tufts${i}`} opacity={tuftA} fill="none" strokeLinecap="round">
            <path d={q.c} stroke={DARK} strokeWidth={2.6} strokeOpacity={0.55} />
            <path d={q.f} stroke={mixHex(LAND, INK, 0.22)} strokeWidth={1} />
            <path d={q.n} stroke={mixHex(LAND, INK, 0.55)} strokeWidth={1.3} />
          </g>
        ),
      }),
    );
  }
  // the mound + marmot, or the mark
  const feetY = moundY(MARMOT.at[0], MARMOT.at[1]);
  const feet = toScreen(cam, MARMOT.at[0], feetY, MARMOT.at[1]);
  const hPx = MARMOT.h * feet.s;
  const markT = Math.max(0, Math.min(1, (24 - hPx) / 12)); // 24 px -> marmot, 12 px -> mark
  if (markT < 1) {
    const sc = (MARMOT.h * feet.s) / 100;
    items.push({
      z: centre.z,
      el: (
        <g key="mm" opacity={1 - markT}>
          <Shadow cam={cam} x={MOUND.c[0]} y={MOUND.c[1]} r={MOUND.R * 1.12} amt={0.75} id="rm-msh" lift={0.02} />
          <Mound cam={cam} frame={frame} />
          <Shadow cam={cam} x={MARMOT.at[0] + 2} y={MARMOT.at[1]} r={11} amt={0.85} id="rm-ash" lift={0.3} />
          <g transform={`translate(${f2(feet.x)},${f2(feet.y)}) scale(${sc.toFixed(5)})`}>
            <MarmotArt uid="mar" sw={Math.max(0.47, 0.8 / Math.max(sc, 0.01))} frame={frame} />
          </g>
        </g>
      ),
    });
  }
  if (markT > 0) {
    items.push({
      z: centre.z,
      el: (
        <g key="mark" opacity={markT}>
          <circle cx={centre.x} cy={centre.y} r={6.4} fill={DARK} />
          <circle cx={centre.x} cy={centre.y} r={4.2} fill={INK} />
        </g>
      ),
    });
  }
  items.sort((a, b) => b.z - a.z);
  return <>{items.map((q) => q.el)}</>;
};
