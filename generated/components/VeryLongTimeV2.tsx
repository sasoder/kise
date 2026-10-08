// ---------------------------------------------------------------------------
// VeryLongTimeV2: a quick map cut of the clip "Sheppard: centralized empires
// fell fast" (Dwarkesh with Si Sheppard). Dwarkesh map style. 1080x1920,
// 24 fps, opaque. It follows a still of Geronimo (1887 photograph).
// V2: SOLDIERS marching on a REINFORCED BORDER replace V1's arc fronts.
//
// LINE (sequence 3.045-5.839 s): "(...other native forces who) resist European
// powers for a very long time."
// DURATION = round(2.794 s x 24) = 67 frames (the edit fixes it).
// CHECK LINE: "Geronimo's people, the Apache, held their country for nearly
// three centuries against one army after another - Spanish, then Mexican, then
// American - until 1886."
//
// CLIP RULE: ORANGE = the Apache: their country, its border, and the riflemen
// who hold it. The armies and the year are neutral cream.
//
// ONE CONTINUOUS MOTION (words: resist f2, European f14, powers f29, for f38,
// very f47, long f51, time f56, end f67): the count rolls 1600 -> 1886 while
// army after army marches on the country. Wherever one is about to arrive,
// ORANGE RIFLEMEN (kneeling, the pose of the photograph before this cut) are
// already there just inside the line; the column closes up against the border,
// the border thickens there (line 4 -> 8 px, teeth 9 -> 20 px), and the column
// turns and marches away. The country never moves. A slow push-in (5 %).
//   f0      established: the country in orange hatch behind its toothed border,
//           APACHE inside it, a clean 1600 above, a Spanish column (pikemen,
//           two lancers at its head) on the march from the south, riflemen
//           coming up to the southern line.
//   f8, f17 SPANISH (1600s): from the south, then the south-east.
//   f25, f33 FRONTIER LANCERS (1700s-1820s: flat hats, long lances, shields):
//           from the south-south-west, then the east.
//   f41, f46 UNITED STATES CAVALRY (1840s-86: kepis, carbines, riflemen behind):
//           from the south-south-east, then the east-south-east.
//   f50     PAYOFF, before "long" f51: the count is on 1886 (exact from f50),
//           the last column pressed on a stretch lined with orange riflemen.
//   f52-62  that column turns and marches away.
//   f62-67  the riflemen still stand along the border of a whole country.
//   (Each column: on the march from where its whole body is >= 40 px inside
//   the frame, 6 frames against the border, then away at 10 px/frame, fading
//   only over its last 6 frames.)
//
// FACTS
//   Spanish presence from the New Mexico colony of 1598 (the count starts at
//   the ROUND year 1600: approximate); the presidial "soldados de cuera"
//   (leather-jacket lancers) of New Spain's northern frontier in the 1700s;
//   Mexico from 1821 (its frontier troops kept the lance and the flat hat, so
//   one figure stands for both); United States Army campaigns c. 1849-1886;
//   Geronimo surrendered at Skeleton Canyon on 4 September 1886 (firm).
//   SCHEMATIC: the orange blob (an approximate historical range, held constant;
//   in fact the Apache range shifted over these centuries), the border (no
//   wall existed: it stands for resistance), the kneeling riflemen (after the
//   1887 photograph of Geronimo; they stand for the defence), the columns (their directions and
//   dates are gestures, not campaigns; an army's years on the count are only
//   roughly those of its era). Land: Natural Earth 10m; no borders, no rivers.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  APACHERIA,
  APACHERIA_C,
  FortifiedEdge,
  MapLabel,
  MapPage,
  OrangeCountry,
  WorldSvg,
  YearOdometer,
  clamp01,
  hash,
  screenOf,
  smoothstep,
  swayCam,
  type Cam,
  type P2,
} from "./apacheShared";
import { KNEEL_UNITS, blitArmy, type ArmyKind } from "./apacheFigures";
import { SpriteCanvas } from "./pageFigures";

export const FPS = 24;
export const DURATION = 67; // round(2.794 s x 24)

export const schema = z.object({ vignette: z.number().min(0).max(1) });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---------------------------------------------------------------------------
// The count: a clean 1600 for two frames, a short ease in, an even run (so the
// armies' eras fall where their columns are), a long ease onto 1886 by f50.
// ---------------------------------------------------------------------------
const Y0 = 1600;
const Y1 = 1886;
const COUNT_START = 2;
const COUNT_END = 50;
const speedShape = (t: number) => {
  if (t <= 0 || t >= 1) return 0;
  if (t < 0.14) return smoothstep(t / 0.14);
  if (t < 0.72) return 1;
  return Math.pow((1 - t) / 0.28, 1.5);
};
const SUB = 16;
const N_SUB = (COUNT_END - COUNT_START) * SUB;
const SHAPE_SUM = (() => {
  let acc = 0;
  for (let i = 0; i < N_SUB; i++) acc += speedShape((i + 0.5) / N_SUB) / SUB;
  return acc;
})();
const speedAt = (f: number) => ((Y1 - Y0) * speedShape((f - COUNT_START) / (COUNT_END - COUNT_START))) / SHAPE_SUM;
const integrate = (speed: (f: number) => number) => {
  const out = [0];
  for (let i = 0; i < N_SUB; i++) out.push(out[i] + speed(COUNT_START + (i + 0.5) / SUB) / SUB);
  return out;
};
const lookup = (table: number[], f: number) => {
  if (f <= COUNT_START) return 0;
  if (f >= COUNT_END) return table[N_SUB];
  const p = (f - COUNT_START) * SUB;
  const i = Math.floor(p);
  return table[i] + (table[i + 1] - table[i]) * (p - i);
};
const YEAR_TABLE = integrate(speedAt);
export const yearAt = (f: number) => Y0 + lookup(YEAR_TABLE, f);
// THE WHEELS: a TRUE odometer (R1). Every wheel shows its true digit of the
// current year with proper carry: the tens wheel turns only while the units
// wheel runs 9 -> 0, and so on up. The units wheel dwells on each year and
// turns over in the middle 40 % of it (so most frames show whole digits and a
// still reads the real year, or a real mid-turn between two adjacent years).
const dwell = (fr: number) => smoothstep((fr - 0.3) / 0.4);
export const columnsAt = (f: number) => {
  const y = yearAt(f);
  const whole = Math.floor(y + 1e-9);
  const pos: number[] = [(whole % 10) + dwell(y - whole)];
  for (let i = 1; i < 4; i++) pos.push((Math.floor(whole / Math.pow(10, i)) % 10) + clamp01(pos[i - 1] - 9));
  return pos;
};

// ---------------------------------------------------------------------------
// The camera: one slow push-in; the country sits 40 px left and 30 px up of the
// frame's centre (room for the eastern columns, less empty top)
// ---------------------------------------------------------------------------
const CAM_C: P2 = [580, 990];
export const cameraAt = (f: number): Cam => ({ k: 1 + 0.05 * (f / DURATION), cx: CAM_C[0], cy: CAM_C[1] });
const K_MAX = 1.05;
/** the frame less 40 px, in world px at the tightest zoom */
const SAFE = { x0: CAM_C[0] - 500 / K_MAX, x1: CAM_C[0] + 500 / K_MAX, y0: CAM_C[1] - 920 / K_MAX, y1: CAM_C[1] + 880 / K_MAX };
const READ_X = 500;
const READ_TOP = 425;
/** the year's box in world px (with a margin) */
const YEAR_BOX = { x0: READ_X - 150 + 40, x1: READ_X + 150 + 40, y0: READ_TOP - 10 + 30, y1: READ_TOP + 170 + 30 };

// ---------------------------------------------------------------------------
// THE ARMIES
// ---------------------------------------------------------------------------
const MAN = 60; // a man's height on screen (px); a horseman 75
const PRESS_F = 6; // frames a column leans on the border
const AWAY_V = 10; // px / frame: a turned column marches away
const AWAY_FADE = 6; // frames: it fades only over its last frames, clear of the border
type Army = { era: "spanish" | "cuera" | "us"; from: number; hit: number; v: number; horse: number; foot: number; keep?: boolean };
// Every contact is on the country's southern and eastern flanks: with 60 px figures
// kept >= 40 px inside the frame there is no room for a column west of the country
// (182 px to the frame's edge) and the year stands over its north.
export const ARMIES: Army[] = [
  { era: "spanish", from: 190, hit: 8, v: 10, horse: 2, foot: 9 },
  { era: "spanish", from: 132, hit: 17, v: 10, horse: 2, foot: 9 },
  { era: "cuera", from: 208, hit: 25, v: 11, horse: 10, foot: 0 },
  { era: "cuera", from: 86, hit: 33, v: 11, horse: 10, foot: 0 },
  { era: "us", from: 165, hit: 41, v: 11, horse: 5, foot: 6, keep: true },
  { era: "us", from: 112, hit: 46, v: 10, horse: 5, foot: 6, keep: true },
];
const dirOf = (deg: number): P2 => [Math.sin((deg * Math.PI) / 180), -Math.cos((deg * Math.PI) / 180)];
const angOf = (p: P2) => Math.atan2(p[0] - APACHERIA_C[0], -(p[1] - APACHERIA_C[1]));
/** the index of the border point on a bearing from the centroid */
const contactIdx = (deg: number) => {
  const a = (deg * Math.PI) / 180;
  let best = 0;
  let bd = Infinity;
  APACHERIA.forEach((p, i) => {
    const raw = angOf(p) - a;
    const d = Math.abs(raw - 2 * Math.PI * Math.round(raw / (2 * Math.PI)));
    if (d < bd) [bd, best] = [d, i];
  });
  return best;
};
/** a figure's reach on the page round its feet (screen px at MAN): half width, height */
const extent = (kind: ArmyKind): [number, number] =>
  kind === "cuera" ? [54, 140] : kind === "lancer" ? [54, 120] : kind === "trooper" ? [54, 86] : kind === "foot" ? [20, 86] : [16, 74];
type Man = { kind: ArmyKind; along: number; lat: number; ph: number; seed: number };
type Column = Army & { dir: P2; perp: P2; contact: P2; men: Man[]; turn: number; reach: number; tIn: number; tOut: number };
export const COLUMNS: Column[] = ARMIES.map((a, ci) => {
  const dir = dirOf(a.from);
  const perp: P2 = [-dir[1], dir[0]];
  const flat = Math.abs(dir[0]);
  // a figure's room on the page: a horse is long, a man is narrow
  const gaps = (horse: boolean) => {
    const c: P2 = horse ? [92, 44] : [38, 38];
    return { along: Math.abs(dir[0]) * c[0] + Math.abs(dir[1]) * c[1], lat: Math.abs(perp[0]) * c[0] + Math.abs(perp[1]) * c[1] };
  };
  const horseKind: ArmyKind = a.era === "spanish" ? "lancer" : a.era === "cuera" ? "cuera" : "trooper";
  const footKind: ArmyKind = a.era === "us" ? "rifle" : "foot";
  const men: Man[] = [];
  let along = 0;
  const lay = (count: number, horse: boolean, abreast: number, kind: ArmyKind) => {
    const g = gaps(horse);
    for (let i = 0; i < count; ) {
      const inRank = Math.min(abreast, count - i);
      for (let j = 0; j < inRank; j++, i++) {
        const seed = ci * 100 + men.length;
        men.push({
          kind,
          along: along + (hash(seed, 1) - 0.5) * g.along * 0.26,
          lat: (j - (inRank - 1) / 2) * g.lat + (hash(seed, 2) - 0.5) * g.lat * 0.24,
          ph: Math.floor(hash(seed, 3) * 8),
          seed,
        });
      }
      along += g.along;
    }
  };
  // a column coming in from the side forms wide and shallow (the frame is narrow there)
  lay(a.horse, true, flat > 0.85 ? 5 : flat > 0.3 ? 4 : 3, horseKind);
  lay(a.foot, false, flat > 0.85 ? 6 : flat > 0.3 ? 5 : 4, footKind);
  const contact = APACHERIA[contactIdx(a.from)];
  // how far out its head may stand with every man still >= 40 px inside the frame and clear of the year
  const fits = (head: number) =>
    men.every((m) => {
      const x = contact[0] + dir[0] * (head + m.along) + perp[0] * m.lat;
      const y = contact[1] + dir[1] * (head + m.along) + perp[1] * m.lat;
      const [hw, hh] = extent(m.kind);
      if (x - hw < SAFE.x0 || x + hw > SAFE.x1 || y - hh < SAFE.y0 || y + 8 > SAFE.y1) return false;
      return !(x + hw > YEAR_BOX.x0 && x - hw < YEAR_BOX.x1 && y > YEAR_BOX.y0 && y - hh < YEAR_BOX.y1);
    });
  let reach = 0;
  for (let h = 30; h <= 100; h += 5) {
    if (!fits(h)) break;
    reach = h;
  }
  const turn = a.hit + PRESS_F;
  return { ...a, dir, perp, contact, men, turn, reach, tIn: a.hit - reach / a.v - 1.5, tOut: turn + reach / AWAY_V + 1.5 };
});
/** is the world point inside the country, or within `margin` of its border? */
const tooClose = (x: number, y: number, margin: number) => {
  let inside = false;
  let near = false;
  for (let i = 0, j = APACHERIA.length - 1; i < APACHERIA.length; j = i++) {
    const [xi, yi] = APACHERIA[i];
    const [xj, yj] = APACHERIA[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    if (!near && Math.hypot(xi - x, yi - y) < margin) near = true;
  }
  return inside || near;
};
/** the column at frame f: its head's distance from the border (world px), how closed up it
 *  is, whether it has turned, its opacity, and how hard it leans on the border */
export const columnState = (c: Column, f: number) => {
  let head: number;
  let close = 1 - 0.36 * smoothstep((f - (c.hit - 3)) / 8);
  let alpha = smoothstep((f - (c.tIn - 4)) / 5);
  if (f <= c.turn) {
    const u = c.hit - f;
    head = Math.min(c.reach, u > 3 ? c.v * (u - 1.5) : u > 0 ? (c.v * u * u) / 6 : 0);
  } else {
    const t = f - c.turn;
    head = Math.min(c.reach, t < 3 ? (AWAY_V * t * t) / 6 : AWAY_V * (t - 1.5));
    close = 0.64 + 0.36 * smoothstep(t / 8);
    alpha = 1 - smoothstep((f - (c.tOut - AWAY_FADE)) / AWAY_FADE);
  }
  const lean = smoothstep((f - (c.hit - 3)) / 6) * (1 - smoothstep((f - (c.turn + 2)) / 6));
  return { head: head + 6, close, turned: f > c.turn, alpha, lean };
};

// ---------------------------------------------------------------------------
// THE DEFENDERS: orange riflemen, kneeling just inside the border wherever a
// column is about to arrive, facing outward
// ---------------------------------------------------------------------------
const KNEEL_H = 54; // the kneeling man's height on screen (px)
const RING_N = APACHERIA.length;
const RING_STEP = (() => {
  let L = 0;
  for (let i = 0; i < RING_N; i++) {
    const a = APACHERIA[i];
    const b = APACHERIA[(i + 1) % RING_N];
    L += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return L / RING_N; // the ring is sampled evenly enough: px per vertex
})();
type Defender = { p: P2; inward: P2; left: boolean; seed: number };
export const DEFENDERS: Defender[][] = COLUMNS.map((c, ci) => {
  const i0 = contactIdx(c.from);
  return [-100, -60, -20, 20, 60, 100].map((off, j) => {
    const seed = ci * 50 + j;
    const i = (((i0 + Math.round((off + (hash(seed, 7) - 0.5) * 14) / RING_STEP)) % RING_N) + RING_N) % RING_N;
    const a = APACHERIA[(i - 2 + RING_N) % RING_N];
    const b = APACHERIA[(i + 2) % RING_N];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    let n: P2 = [(b[1] - a[1]) / l, -(b[0] - a[0]) / l];
    const p = APACHERIA[i];
    if (n[0] * (APACHERIA_C[0] - p[0]) + n[1] * (APACHERIA_C[1] - p[1]) < 0) n = [-n[0], -n[1]];
    // his feet stand far enough in for the whole kneeling figure to be inside the line
    const d = 18 + Math.max(0, n[1]) * (KNEEL_H + 4) + Math.abs(n[0]) * 14 + 6 * hash(seed, 8);
    return { p: [p[0] + n[0] * d, p[1] + n[1] * d] as P2, inward: n, left: n[0] > 0, seed };
  });
});
/** how present (0..1) column ci's defenders are at frame f */
export const defenderState = (ci: number, f: number) => {
  const c = COLUMNS[ci];
  const come = smoothstep((f - (c.hit - 12)) / 8);
  const go = c.keep ? 0 : smoothstep((f - (c.turn + 5)) / 8);
  return come * (1 - go);
};

const VeryLongTimeV2: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(cameraAt(frame), frame);
  const states = COLUMNS.map((c) => columnState(c, frame));

  // the border thickens along ~200 px where a column leans on it
  const press = (p: P2) => {
    let w = 0;
    COLUMNS.forEach((c, i) => {
      if (states[i].lean <= 0.001) return;
      const d = Math.hypot(p[0] - c.contact[0], p[1] - c.contact[1]);
      w = Math.max(w, states[i].lean * Math.exp(-Math.pow(d / 92, 2)));
    });
    return w;
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    const list: { x: number; y: number; kind: ArmyKind; pose: 0 | 1 | 2; left: boolean; a: number; h: number }[] = [];
    // the defenders
    DEFENDERS.forEach((ds, ci) => {
      const pr = defenderState(ci, frame);
      if (pr <= 0.01) return;
      for (const d of ds) {
        const back = 56 * (1 - pr);
        const [sx, sy] = screenOf([d.p[0] + d.inward[0] * back, d.p[1] + d.inward[1] * back], cam);
        list.push({ x: sx, y: sy, kind: "apache", pose: 0, left: d.left, a: smoothstep(pr * 1.6), h: (KNEEL_H / KNEEL_UNITS) * 100 * cam.k });
      }
    });
    // the armies
    COLUMNS.forEach((c, ci) => {
      const st = states[ci];
      if (st.alpha <= 0.01) return;
      for (const m of c.men) {
        // no man ever stands in the country: each stops against the border in front of HIM
        let along = st.head + m.along * st.close;
        const tall = extent(m.kind)[1] * 0.62;
        const stand = 14 + Math.max(0, c.dir[1]) * tall;
        let wx = 0;
        let wy = 0;
        for (let it = 0; it < 60; it++) {
          wx = c.contact[0] + c.dir[0] * along + c.perp[0] * m.lat;
          wy = c.contact[1] + c.dir[1] * along + c.perp[1] * m.lat;
          if (!tooClose(wx, wy - stand * 0.5, stand * 0.5 + 10)) break;
          along += 5;
        }
        const [sx, sy] = screenOf([wx, wy], cam);
        // each man's own step: two poses, four frames each, a small bob
        const step = frame + m.ph;
        const pose = (1 + (Math.floor(step / 4) % 2)) as 1 | 2;
        const bob = 1.9 * Math.abs(Math.sin((Math.PI * step) / 4));
        // a horseman looks the way he rides: toward the country, then away
        const toward = Math.abs(c.dir[0]) > 0.22 ? c.dir[0] > 0 : ci % 2 === 0;
        const turned = st.turned && frame > c.turn + 1.5 * hash(m.seed, 4);
        list.push({ x: sx, y: sy - bob, kind: m.kind, pose, left: toward !== turned, a: st.alpha, h: MAN * cam.k });
      }
    });
    list.sort((p, q) => p.y - q.y);
    for (const m of list) blitArmy(ctx, { kind: m.kind, pose: m.pose, left: m.left }, m.x, m.y, m.h, m.a);
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B2226" }}>
      <MapPage cam={cam} vignette={vignette}>
        <WorldSvg cam={cam}>
          <OrangeCountry ring={APACHERIA} cam={cam} highlight={clamp01((((frame + 18) % 72) + 72) % 72 / 72)} edge={false} />
          <FortifiedEdge ring={APACHERIA} cam={cam} press={press} lineMax={8} toothMax={20} />
        </WorldSvg>
        <SpriteCanvas draw={draw} />
        <MapLabel text="APACHE" x={APACHERIA_C[0] + 14} y={APACHERIA_C[1] - 40} cam={cam} frame={frame} f0={-40} size={66} spacing={0.42} />
        <YearOdometer frame={frame} yearAt={yearAt} columnsAt={columnsAt} maxBlur={8} samples={1} fadePx={6} x={READ_X} top={READ_TOP} size={130} />
      </MapPage>
    </AbsoluteFill>
  );
};

export default VeryLongTimeV2;
