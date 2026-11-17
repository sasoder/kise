// ---------------------------------------------------------------------------
// hfProps — the shared set pieces of paul-hugging-face on the shared world (hfWorld.tsx), promoted from the hero
// round (heroC/heroCProps.tsx). Metres, y up. Every piece is pure and frame-driven (its animatable inputs are plain
// numbers 0..1 the cut computes from its frame): seek-safe, deterministic.
// Full API: <clip>/animation_source/notes/HF_WORLD_READY.md.
//
//   boxes      UP DOWN axes RBox boxFaces faceYaw polyFrom
//   task       CODE CodeBars Padlock (shake, tug) TaskBlock
//   cards      cardFrame Card (orange 0..1) cardInk TICK CROSS AdminBadge (orange 0..1)
//   threads    threadD sagPts Thread (draw 0..1, cream head)
//   HF box     hfBoxGeom HFBoxBody HFBoxLid (open 0..1) HFBoxPlate aboveRimD HFBox
//   grader     GraderOpts graderGeom Grader (panel, stamp, insides, arm, body spread, sheets) graderInside graderPlugs
//              beltSheets graderStampTop
//   racks      RACK Rack (units with lights 0..1, OpenAI end-cap) rackLights OpenAIMark
//   robots     botLocal botScreen viewFor CrowdBots (sprites for 20-30 robots at the back)
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { BOT_CROWD_SIZES, BOT_VARIANTS, blitBot, botAnchors, botCrowdReqs, useBotSprites, type BotPose, type BotView } from "../rsi-ten-earths/tenEarthsBot";
import { FolkCanvas } from "../kyle-pandemics/pandemicFolkPaint";
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";
import {
  ACCENT,
  Decal,
  FloorShadow,
  FONT,
  GRAPHITE,
  HFMark,
  MATS,
  Prism,
  ROBOT_U,
  Svg,
  add,
  c01,
  circleOutline,
  cross,
  dot,
  lerp,
  mixHexL,
  mixMat,
  mul,
  n2,
  norm,
  rrect,
  sst,
  sub,
  type Mat,
  type P2,
  type V3,
  type World,
} from "./hfWorld";

export const UP: V3 = [0, 1, 0];
export const DOWN: V3 = [0, -1, 0];
/** a floor frame turned by yaw: u across (local +x), v deep (local +z) */
export const axes = (yaw: number) => ({ u: [Math.cos(yaw), 0, Math.sin(yaw)] as V3, v: [-Math.sin(yaw), 0, Math.cos(yaw)] as V3 });
export const polyFrom = (W: World, pts: V3[]) => `M${pts.map(W.project).map((p) => `${n2(p[0])},${n2(p[1])}`).join("L")}Z`;

// ===================================================================================================================
// BOXES
// ===================================================================================================================
export type RBoxProps = { W: World; c: V3; w: number; h: number; d: number; r?: number; yaw?: number; mat: Mat; uid: string; capMat?: Mat; orange?: boolean; emissive?: number; ao?: number; rim?: number; aoFloor?: number; sheen?: number; line?: number };
/** a rounded box standing on c (its bottom centre): w across (u), d deep (v), h tall */
export const RBox: React.FC<RBoxProps> = ({ W, c, w, h, d, r = 0.12, yaw = 0, ...rest }) => {
  const { u, v } = axes(yaw);
  return <Prism W={W} outline={rrect(w, d, r, 7)} o={c} u={u} v={v} n={UP} depth={h} {...rest} />;
};
/** a box's faces as decal frames (o = top-left corner seen from outside, u across, v DOWN the face, w, h) */
export const boxFaces = (c: V3, w: number, h: number, d: number, yaw = 0, eps = 0.004) => {
  const { u, v } = axes(yaw);
  const front = { o: add(add(add(c, mul(v, -d / 2 - eps)), mul(u, -w / 2)), [0, h, 0]), u, v: DOWN, w, h };
  const right = { o: add(add(add(c, mul(u, w / 2 + eps)), mul(v, -d / 2)), [0, h, 0]), u: v, v: DOWN, w: d, h };
  const left = { o: add(add(add(c, mul(u, -w / 2 - eps)), mul(v, d / 2)), [0, h, 0]), u: mul(v, -1), v: DOWN, w: d, h };
  const back = { o: add(add(add(c, mul(v, d / 2 + eps)), mul(u, w / 2)), [0, h, 0]), u: mul(u, -1), v: DOWN, w, h };
  const top = { o: add(add(add(c, mul(u, -w / 2)), mul(v, d / 2)), [0, h + eps, 0]), u, v: mul(v, -1), w, h: d };
  return { front, right, left, back, top };
};
export type FaceFrame = ReturnType<typeof boxFaces>["front"];
/** the outward normal of a face frame */
export const faceOut = (f: FaceFrame): V3 => norm(cross(f.u, f.v));
/** is a face frame turned toward the camera? */
export const faceSeen = (W: World, f: FaceFrame) => dot(faceOut(f), sub(W.pos, add(f.o, add(mul(f.u, f.w / 2), mul(f.v, f.h / 2))))) > 0;

/** the facing yaw (robot convention: 0 toward us, + screen right, PI away) from a floor point toward another */
export const faceYaw = (W: World, from: V3, to: V3) => {
  const dir = norm(sub([to[0], 0, to[2]], [from[0], 0, from[2]]));
  const fh = norm([W.f[0], 0, W.f[2]]);
  return Math.atan2(dot(dir, W.r), -dot(dir, fh));
};

// ===================================================================================================================
// CODE BARS (indented, pressed into a face) — local px, inside a Decal
// ===================================================================================================================
export const CODE: [number, number][] = [
  [0, 0.62],
  [1, 0.48],
  [1, 0.7],
  [2, 0.38],
  [2, 0.52],
  [1, 0.3],
  [0, 0.44],
  [1, 0.66],
  [2, 0.46],
  [1, 0.22],
];
export const CodeBars: React.FC<{ x: number; y: number; w: number; rowH: number; face: string; lines?: [number, number][]; ink?: string; indent?: number; uid?: string }> = ({ x, y, w, rowH, face, lines = CODE, ink, indent = 0.09 }) => {
  const barH = rowH * 0.46;
  const dark = ink ?? mixHexL(face, GRAPHITE.shadow, 0.16);
  return (
    <g>
      {lines.map(([ind, l], i) => {
        const bx = x + ind * indent * w;
        const by = y + i * rowH;
        const bw = l * w;
        return (
          <g key={i}>
            <rect x={n2(bx)} y={n2(by)} width={n2(bw)} height={n2(barH)} rx={n2(barH / 2)} fill={dark} />
            <rect x={n2(bx)} y={n2(by)} width={n2(bw)} height={n2(barH * 0.32)} rx={n2(barH * 0.16)} fill={GRAPHITE.shadow} opacity={0.16} />
            <rect x={n2(bx + barH * 0.3)} y={n2(by + barH * 0.86)} width={n2(Math.max(0, bw - barH * 0.6))} height={n2(barH * 0.16)} rx={n2(barH * 0.08)} fill={GRAPHITE.cream} opacity={0.55} />
          </g>
        );
      })}
    </g>
  );
};

// ===================================================================================================================
// THE PADLOCK on a face: a raised body + the shackle. shake = a swing (radians, in the face plane, about the
// shackle's top); tug = pulled out of the face (metres)
// ===================================================================================================================
export const Padlock: React.FC<{ W: World; f: FaceFrame; cx: number; cy: number; s: number; uid: string; mat?: Mat; orange?: boolean; shake?: number; tug?: number }> = ({ W, f, cx, cy, s, uid, mat = MATS.greige, orange, shake = 0, tug = 0 }) => {
  const out = faceOut(f);
  const bw = s;
  const bh = s * 0.78;
  const t = s * 0.2;
  const shR = bw * 0.3;
  const shW = bw * 0.13;
  const shY = cy + bh * 0.18 - bh / 2;
  const pivotY = shY - shR * 1.55;
  const cs = Math.cos(shake);
  const sn = Math.sin(shake);
  // face-local (x right, y DOWN) -> world, swung about (cx, pivotY), pulled out by tug
  const at = (x: number, y: number, z = 0): V3 => {
    const dx = x - cx;
    const dy = y - pivotY;
    const X = cx + dx * cs - dy * sn;
    const Y = pivotY + dx * sn + dy * cs;
    return add(add(add(f.o, mul(f.u, X)), mul(f.v, Y)), mul(out, z + tug));
  };
  const U = add(mul(f.u, cs), mul(f.v, sn));
  const Vup = mul(add(mul(f.u, -sn), mul(f.v, cs)), -1);
  const bodyC = at(cx, cy + bh * 0.18, 0);
  const zMid = t * 0.5;
  const N = 22;
  const pts: V3[] = [at(cx - shR, shY + shW * 0.4, zMid)];
  for (let i = 0; i <= N; i++) {
    const a = Math.PI + (Math.PI * i) / N;
    pts.push(at(cx + shR * Math.cos(a), shY - shR * 0.55 + shR * Math.sin(a), zMid));
  }
  pts.push(at(cx + shR, shY + shW * 0.4, zMid));
  const sp = pts.map(W.project);
  const k = W.scaleAt(bodyC);
  const tone = (hex: string) => (orange ? W.toneO(hex, bodyC) : W.tone(hex, bodyC));
  const d = `M${sp.map((p) => `${n2(p[0])},${n2(p[1])}`).join("L")}`;
  const hole = (dy: number): V3 => at(cx, cy + bh * 0.18 + dy, t + 0.002);
  const kc = W.project(hole(-bh * 0.06));
  const kb = W.project(hole(bh * 0.14));
  const holeC = tone(mixHexL(mat.dark, GRAPHITE.shadow, 0.5));
  return (
    <g>
      <path d={d} fill="none" stroke={tone(mat.dark)} strokeWidth={n2(shW * k)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={tone(mat.mid)} strokeWidth={n2(shW * k * 0.72)} strokeLinecap="round" strokeLinejoin="round" transform="translate(-1 -1)" />
      <path d={d} fill="none" stroke={tone(mat.lit)} strokeWidth={n2(shW * k * 0.26)} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${n2(-shW * k * 0.2)} ${n2(-shW * k * 0.2)})`} opacity={0.9} />
      <Prism W={W} outline={rrect(bw, bh, bw * 0.16, 6)} o={bodyC} u={U} v={Vup} n={out} depth={t} mat={mat} uid={`${uid}b`} ao={0.5} orange={orange} />
      <circle cx={n2(kc[0])} cy={n2(kc[1])} r={n2(bw * 0.075 * k)} fill={holeC} />
      <path d={`M${n2(kc[0] - bw * 0.035 * k)},${n2(kc[1])}L${n2(kc[0] + bw * 0.035 * k)},${n2(kc[1])}L${n2(kb[0] + bw * 0.045 * k)},${n2(kb[1])}L${n2(kb[0] - bw * 0.045 * k)},${n2(kb[1])}Z`} fill={holeC} />
    </g>
  );
};

// ===================================================================================================================
// THE TASK BLOCK: a big off-white block, indented code bars on its front, the big padlock (hero A)
// ===================================================================================================================
export const TASK = { w: 3.4, h: 2.45, d: 1.7, lock: { cx: 1.7, cy: 1.5, s: 0.86 } };
/** layers: the block (Svg), the code (Decal), the padlock (Svg). Its contact shadow: taskShadowPts(c, yaw) in the
 *  stage's shadows. shake / tug: the padlock's (radians / metres). */
export const TaskBlock: React.FC<{ W: World; c: V3; uid: string; yaw?: number; w?: number; h?: number; d?: number; shake?: number; tug?: number; lockMat?: Mat; res?: number }> = ({
  W,
  c,
  uid,
  yaw = 0,
  w = TASK.w,
  h = TASK.h,
  d = TASK.d,
  shake = 0,
  tug = 0,
  lockMat,
  res = 260,
}) => {
  const bf = boxFaces(c, w, h, d, yaw);
  const face = W.tone(MATS.clay.mid, add(c, [0, 1, -d / 2]));
  const sx = w / TASK.w;
  return (
    <>
      <Svg id={`${uid}blk`}>
        <RBox W={W} c={c} w={w} h={h} d={d} r={0.24} yaw={yaw} mat={MATS.clay} uid={`${uid}blk`} ao={0.8} />
      </Svg>
      <Decal W={W} o={bf.front.o} u={bf.front.u} v={bf.front.v} w={bf.front.w} h={bf.front.h} res={res}>
        <CodeBars x={0.38 * res * sx} y={0.32 * res} w={2.65 * res * sx} rowH={0.19 * res * (h / TASK.h)} face={face} />
      </Decal>
      <Svg id={`${uid}lock`}>
        <Padlock W={W} f={bf.front} cx={TASK.lock.cx * sx} cy={TASK.lock.cy * (h / TASK.h)} s={TASK.lock.s} uid={`${uid}lk`} shake={shake} tug={tug} mat={lockMat} />
      </Svg>
    </>
  );
};
/** a box's floor footprint (for FloorShadow) */
export const footPts = (c: V3, w: number, d: number, yaw = 0): V3[] => {
  const { u, v } = axes(yaw);
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([a, b]) => add(add([c[0], 0, c[2]], mul(u, (a * w) / 2)), mul(v, (b * d) / 2)));
};

// ===================================================================================================================
// CARDS: the answer key, the ADMIN badge — a slab facing the camera, its print on a decal; orange 0..1 blends it
// from off-white clay to glowing orange (taken)
// ===================================================================================================================
export const cardFrame = (W: World, c: V3, w: number, h: number, tilt = 0) => {
  const up = W.u;
  const u: V3 = add(mul(W.r, Math.cos(tilt)), mul(up, -Math.sin(tilt)));
  const v: V3 = add(mul(up, Math.cos(tilt)), mul(W.r, Math.sin(tilt)));
  const n = norm(cross(u, v));
  const nn = dot(n, sub(W.pos, c)) > 0 ? mul(n, -1) : n;
  return { c, u, v, n: nn, w, h, tl: add(add(c, mul(u, -w / 2)), mul(v, h / 2)) };
};
export type CardFrame = ReturnType<typeof cardFrame>;
/** the print colour on a card at orange t (grey ink on white -> deep brown on orange) */
export const cardInk = (t: number) => mixHexL("#77716A", "#7A4106", c01(t));
export const Card: React.FC<{ W: World; fr: CardFrame; uid: string; orange?: number; t?: number; res?: number; children?: React.ReactNode }> = ({ W, fr, uid, orange = 1, t = 0.03, res = 500, children }) => {
  const o = c01(orange);
  return (
    <>
      <Svg id={`${uid}s`} glow={o}>
        <Prism W={W} outline={rrect(fr.w, fr.h, Math.min(fr.w, fr.h) * 0.1, 6)} o={fr.c} u={fr.u} v={fr.v} n={fr.n} depth={t} mat={mixMat(MATS.clay, MATS.orange, o)} uid={uid} orange={o > 0.5} emissive={0.6 * o} sheen={1 - o} />
      </Svg>
      <Decal W={W} o={add(fr.tl, mul(fr.n, -0.003))} u={fr.u} v={mul(fr.v, -1)} w={fr.w} h={fr.h} res={res}>
        {children}
      </Decal>
    </>
  );
};
export const TICK = (x: number, y: number, s: number) => `M${n2(x - s * 0.42)},${n2(y + s * 0.02)}L${n2(x - s * 0.12)},${n2(y + s * 0.32)}L${n2(x + s * 0.46)},${n2(y - s * 0.34)}`;
export const CROSS = (x: number, y: number, s: number) => `M${n2(x - s * 0.34)},${n2(y - s * 0.34)}L${n2(x + s * 0.34)},${n2(y + s * 0.34)}M${n2(x + s * 0.34)},${n2(y - s * 0.34)}L${n2(x - s * 0.34)},${n2(y + s * 0.34)}`;
/** the ADMIN key-badge (hero C: 0.86 x 0.5 m x size): a key and ADMIN printed on it; orange 0..1 */
export const AdminBadge: React.FC<{ W: World; fr: CardFrame; uid: string; orange?: number; res?: number }> = ({ W, fr, uid, orange = 1, res = 500 }) => {
  const K = fr.w / 0.86;
  const bw = 0.86;
  const ink = cardInk(orange);
  return (
    <Card W={W} fr={fr} uid={uid} orange={orange} res={res}>
      <g transform={`scale(${K})`}>
        <rect x={bw * res * 0.5 - 0.09 * res} y={0.05 * res} width={0.18 * res} height={0.04 * res} rx={0.02 * res} fill={ink} opacity={0.8} />
        <g transform={`translate(${0.1 * res} ${0.29 * res})`}>
          <circle cx={0} cy={0} r={0.05 * res} fill="none" stroke={ink} strokeWidth={0.026 * res} />
          <path d={`M${0.05 * res},0L${0.15 * res},0M${0.115 * res},0L${0.115 * res},${0.045 * res}M${0.145 * res},0L${0.145 * res},${0.035 * res}`} stroke={ink} strokeWidth={0.026 * res} strokeLinecap="round" fill="none" />
        </g>
        <text x={bw * res * 0.6 + 0.02 * res} y={0.34 * res} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={0.155 * res} letterSpacing={0.01 * res} fill={mixHexL("#6E6862", "#6B3806", c01(orange))}>
          ADMIN
        </text>
      </g>
    </Card>
  );
};

// ===================================================================================================================
// ROBOT HELPERS (the robot itself: RobotAt / robotFoot in hfWorld)
// ===================================================================================================================
/** robot-local units (x screen right, y up NEGATIVE, 240 = its height at size 1) -> a world point in the robot's
 *  screen-parallel plane */
export const botLocal = (W: World, feet: V3, x: number, y: number, size = 1): V3 => add(add(feet, mul(W.r, (x * size) / ROBOT_U)), mul(W.u, (-y * size) / ROBOT_U));
/** screen anchors (headC, eyes, handL/R, antennaTip ...) of a robot standing at feet (lift = feet height) */
export const botScreen = (W: World, feet: V3, pose: BotPose, variant = 0, size = 1) => botAnchors(variant, pose, W.project(feet), (W.scaleAt(feet) / ROBOT_U) * size);
/** the crowd sprite view for a facing yaw (robot convention) */
export const viewFor = (yaw: number, walking = false): BotView => {
  const a = Math.atan2(Math.sin(yaw), Math.cos(yaw));
  if (walking) return a >= 0 ? "walkRight" : "walkLeft";
  if (Math.abs(a) < Math.PI / 4) return "front";
  if (Math.abs(a) > (3 * Math.PI) / 4) return "back";
  return a > 0 ? "right" : "left";
};
export type CrowdBot = { p: V3; yaw?: number; view?: BotView; walk?: number; variant?: number; size?: number; alpha?: number };
/** 20-30+ robots as baked sprites on one canvas (far, small robots: under ~100 px tall; nearer ones: RobotAt).
 *  Sorted back to front; each with the sprite's soft shadow, fogged by depth. `walk` = a frame number for the walk
 *  cycle (walking views). The sprites bake once per render tab (delayRender). */
export const CrowdBots: React.FC<{ W: World; bots: CrowdBot[]; views?: BotView[] }> = ({ W, bots, views }) => {
  const used = views ?? (["front", "left", "right", "back", "walkLeft", "walkRight"] as BotView[]);
  const key = used.join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reqs = useMemo(() => botCrowdReqs(used, BOT_CROWD_SIZES, BOT_VARIANTS), [key]);
  const get = useBotSprites(reqs);
  const list = bots
    .map((b) => ({ b, d: W.depth(b.p) }))
    .filter((q) => q.d > 0.3)
    .sort((a, b) => b.d - a.d);
  return (
    <FolkCanvas
      draw={(ctx) => {
        for (const { b } of list) {
          const feet = b.p;
          const at = W.project(feet);
          const hPx = (240 * W.scaleAt(feet) * (b.size ?? 1)) / ROBOT_U;
          const walking = b.walk !== undefined;
          const view = b.view ?? viewFor(b.yaw ?? 0, walking);
          blitBot(ctx, get, at[0], at[1], hPx, { variant: b.variant ?? 0, view, walkFrame: walking ? Math.floor(((b.walk ?? 0) / 24) * 4) : 0, alpha: b.alpha ?? 1, fog: { rgb: W.airHex(add(feet, [0, 0.8, 0])), amount: W.fog(feet) * 0.85 }, shadow: true });
        }
      }}
    />
  );
};

// ===================================================================================================================
// THREADS (glowing orange): screen points -> a smooth curve; draw 0..1 grows it from its first point with a moving
// cream head
// ===================================================================================================================
export const threadD = (pts: P2[]) => {
  if (pts.length < 3) return `M${pts.map((p) => `${n2(p[0])},${n2(p[1])}`).join("L")}`;
  let d = `M${n2(pts[0][0])},${n2(pts[0][1])}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const m: P2 = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    d += `Q${n2(pts[i][0])},${n2(pts[i][1])} ${n2(m[0])},${n2(m[1])}`;
  }
  const L = pts[pts.length - 1];
  d += `L${n2(L[0])},${n2(L[1])}`;
  return d;
};
/** the same smooth curve as threadD, sampled into a polyline */
const threadPoly = (pts: P2[], per = 10): P2[] => {
  if (pts.length < 3) return pts;
  const out: P2[] = [pts[0]];
  let s = pts[0];
  for (let i = 1; i < pts.length - 1; i++) {
    const c = pts[i];
    const e: P2 = [(pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2];
    for (let j = 1; j <= per; j++) {
      const t = j / per;
      out.push([(1 - t) * (1 - t) * s[0] + 2 * (1 - t) * t * c[0] + t * t * e[0], (1 - t) * (1 - t) * s[1] + 2 * (1 - t) * t * c[1] + t * t * e[1]]);
    }
    s = e;
  }
  out.push(pts[pts.length - 1]);
  return out;
};
/** world points of a thread hanging from a to b with `sag` metres of droop at its middle (project with W.project);
 *  build it in the WORLD so it stays right while the camera moves */
export const sagPts = (W: World, a: V3, b: V3, sag = 0.2, n = 12): P2[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    return W.project([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - sag * 4 * t * (1 - t), lerp(a[2], b[2], t)]);
  });
/** the glowing thread. pts: screen points (or d: a ready path, drawn whole). w: width px (0.03 m x scaleAt reads well).
 *  draw 0..1 grows it from pts[0]; while growing a cream head rides its tip. Put it in an <Svg glow={0.8}>. */
export const Thread: React.FC<{ pts?: P2[]; d?: string; w: number; draw?: number; head?: boolean; op?: number }> = ({ pts, d, w, draw = 1, head = true, op = 1 }) => {
  if (d || !pts) {
    return (
      <g opacity={op}>
        <path d={d} fill="none" stroke={ACCENT} strokeWidth={n2(w)} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} fill="none" stroke="#FFE7A8" strokeWidth={n2(w * 0.32)} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      </g>
    );
  }
  if (draw <= 0) return null;
  const poly = threadPoly(pts);
  const seg = poly.slice(1).map((p, i) => Math.hypot(p[0] - poly[i][0], p[1] - poly[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const want = c01(draw) * total;
  const cut: P2[] = [poly[0]];
  let acc = 0;
  for (let i = 0; i < seg.length; i++) {
    if (acc + seg[i] >= want) {
      const t = seg[i] > 0 ? (want - acc) / seg[i] : 0;
      cut.push([lerp(poly[i][0], poly[i + 1][0], t), lerp(poly[i][1], poly[i + 1][1], t)]);
      break;
    }
    acc += seg[i];
    cut.push(poly[i + 1]);
  }
  const dd = `M${cut.map((p) => `${n2(p[0])},${n2(p[1])}`).join("L")}`;
  const tip = cut[cut.length - 1];
  const headA = head ? 1 - sst(0.9, 1, draw) : 0;
  return (
    <g opacity={op}>
      <path d={dd} fill="none" stroke={ACCENT} strokeWidth={n2(w)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={dd} fill="none" stroke="#FFE7A8" strokeWidth={n2(w * 0.32)} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      {headA > 0.01 ? (
        <g opacity={n2(headA)}>
          <circle cx={n2(tip[0])} cy={n2(tip[1])} r={n2(w * 1.25)} fill={ACCENT} />
          <circle cx={n2(tip[0])} cy={n2(tip[1])} r={n2(w * 0.8)} fill={GRAPHITE.cream} />
        </g>
      ) : null}
    </g>
  );
};

// ===================================================================================================================
// THE HUGGING FACE BOX: a small chest, the lid hinged at its left (or back) top edge, the HF mark on its front plate
// ===================================================================================================================
export const HF_LID_OPEN = 1.95;
export const hfBoxGeom = (c: V3, w = 0.9, h = 0.52, d = 0.64, yaw = 0) => ({ c, w, h, d, yaw, faces: boxFaces(c, w, h, d, yaw) });
export type HFBoxG = ReturnType<typeof hfBoxGeom>;
export const HFBoxBody: React.FC<{ W: World; g: HFBoxG; uid: string; mat?: Mat }> = ({ W, g, uid, mat = MATS.clayWarm }) => {
  const { c, w, h, d, yaw } = g;
  const { u, v } = axes(yaw);
  const wall = 0.05;
  const inner = rrect(w - 2 * wall, d - 2 * wall, 0.04, 4).map(([x, y]) => add(add(add(c, mul(u, x)), mul(v, y)), [0, h + 0.002, 0])).map(W.project);
  return (
    <g>
      <Prism W={W} outline={rrect(w, d, 0.05, 5)} o={c} u={u} v={v} n={UP} depth={h} mat={mat} uid={`${uid}b`} ao={0.8} />
      <path d={`M${inner.map((p) => `${n2(p[0])},${n2(p[1])}`).join("L")}Z`} fill={W.tone(mixHexL(GRAPHITE.shadow, "#3A3530", 0.5), add(c, [0, h, 0]))} />
    </g>
  );
};
/** open 0..1 (1 = the hero's wide-open lid, HF_LID_OPEN rad) */
export const HFBoxLid: React.FC<{ W: World; g: HFBoxG; uid: string; open?: number; mat?: Mat; hinge?: "back" | "left" }> = ({ W, g, uid, open = 1, mat = MATS.clayWarm, hinge = "left" }) => {
  const { c, w, h, d, yaw } = g;
  const { u, v } = axes(yaw);
  const a = c01(open) * HF_LID_OPEN;
  const lift = 0.004;
  if (hinge === "left") {
    const hp = add(add(c, mul(u, -w / 2)), [0, h + lift, 0]);
    const dir = add(mul(u, Math.cos(a)), mul(UP, Math.sin(a)));
    const lidC = add(hp, mul(dir, w / 2));
    return <Prism W={W} outline={rrect(w, d, 0.05, 5)} o={lidC} u={dir} v={v} n={norm(cross(dir, v))} depth={0.05} mat={mat} uid={`${uid}l`} ao={0.3} />;
  }
  const hinge0 = add(add(c, mul(v, d / 2)), [0, h + lift, 0]);
  const dirBack = add(mul(mul(v, -1), Math.cos(a)), mul(UP, Math.sin(a)));
  const lidC = add(hinge0, mul(dirBack, d / 2));
  return <Prism W={W} outline={rrect(w, d, 0.05, 5)} o={lidC} u={u} v={dirBack} n={norm(cross(u, dirBack))} depth={0.05} mat={mat} uid={`${uid}l`} ao={0.3} />;
};
/** a screen clip path ABOVE the box's near top rim (for things rising out of the box: clipPath: path('...')) */
export const aboveRimD = (W: World, g: HFBoxG) => {
  const { c, w, h, d, yaw } = g;
  const { u, v } = axes(yaw);
  const top = rrect(w - 0.1, d - 0.1, 0.04, 4).map(([x, y]) => add(add(add(c, mul(u, x)), mul(v, y)), [0, h, 0]));
  const dc = W.depth(add(c, [0, h, 0]));
  const near = top.filter((q) => W.depth(q) <= dc + 1e-6).map(W.project).sort((a, b) => a[0] - b[0]);
  const L = near[0];
  const R = near[near.length - 1];
  const pts: P2[] = [[-400, -2000], [1500, -2000], [1500, R[1]], ...near.slice().reverse(), [-400, L[1]]];
  return `M${pts.map((p) => `${n2(p[0])},${n2(p[1])}`).join("L")}Z`;
};
/** the HF mark on a light plate on the box's front (its real yellow, never glowing) */
export const HFBoxPlate: React.FC<{ W: World; g: HFBoxG; size?: number }> = ({ W, g, size = 0.3 }) => {
  const f = g.faces.front;
  const res = 500;
  return (
    <Decal W={W} o={f.o} u={f.u} v={f.v} w={f.w} h={f.h} res={res}>
      <rect x={(f.w / 2 - size * 0.62) * res} y={(f.h / 2 - size * 0.62) * res} width={size * 1.24 * res} height={size * 1.24 * res} rx={size * 0.22 * res} fill={W.tone("#F3EEE6", g.c)} opacity={0.95} />
      <HFMark x={(f.w / 2) * res} y={(f.h / 2) * res} size={size * res} yellow={W.tone("#FFD21E", g.c)} dark={W.tone("#3A3B45", g.c)} />
    </Decal>
  );
};
/** the whole box in painter's order: lid (when it is behind the body), body, `inside` (things rising out of it,
 *  clipped above the near rim), plate, lid (when in front). */
export const HFBox: React.FC<{ W: World; g: HFBoxG; uid: string; open?: number; hinge?: "back" | "left"; plate?: number; inside?: React.ReactNode }> = ({ W, g, uid, open = 1, hinge = "left", plate = 0.3, inside }) => {
  const { u, v } = axes(g.yaw);
  const a = c01(open) * HF_LID_OPEN;
  const lidDir = hinge === "left" ? add(mul(u, Math.cos(a)), mul(UP, Math.sin(a))) : add(mul(mul(v, -1), Math.cos(a)), mul(UP, Math.sin(a)));
  const hp = hinge === "left" ? add(add(g.c, mul(u, -g.w / 2)), [0, g.h, 0]) : add(add(g.c, mul(v, g.d / 2)), [0, g.h, 0]);
  const lidC = add(hp, mul(lidDir, (hinge === "left" ? g.w : g.d) / 2));
  const behind = W.depth(lidC) > W.depth(add(g.c, [0, g.h * 0.5, 0])) || open > 0.5;
  const lid = (
    <Svg id={`${uid}lid`}>
      <HFBoxLid W={W} g={g} uid={uid} open={open} hinge={hinge} />
    </Svg>
  );
  return (
    <>
      {behind ? lid : null}
      <Svg id={`${uid}body`}>
        <HFBoxBody W={W} g={g} uid={uid} />
      </Svg>
      {inside ? <div style={{ position: "absolute", inset: 0, clipPath: `path('${aboveRimD(W, g)}')` }}>{inside}</div> : null}
      <HFBoxPlate W={W} g={g} size={plate} />
      {behind ? null : lid}
    </>
  );
};

// ===================================================================================================================
// THE OPENAI MARK (a 24-unit glyph) for decals
// ===================================================================================================================
export const OpenAIMark: React.FC<{ x: number; y: number; size: number; fill: string }> = ({ x, y, size, fill }) => (
  <g transform={`translate(${n2(x - size / 2)} ${n2(y - size / 2)}) scale(${(size / 24).toFixed(5)})`}>
    {OPENAI.paths.map((d, i) => (
      <path key={i} d={d} fill={fill} />
    ))}
  </g>
);

// ===================================================================================================================
// THE GRADER: one scoring machine (hero B). A clay body (2.2 w x 1.5 h x 2.0 d at s = 1); along its FRONT a shelf
// line: a conveyor at the left feeding task sheets onto the tray under the stamp, and an out-rack at the right end
// where stamped sheets come to rest tilted up toward the viewer; a stamp arm on top (post at the back, the arm
// forward, a stem and a head that comes down on the sheet under it); a side panel on the right face opening on simple
// insides (three bars, two wires). Orange spreads into it: `insides` (the recess), `arm` (post -> arm -> head, in
// order), `body` (everything, a soft round front growing from `from`).
// Local frame: x across (+ right), z back (+ away from its front), y up; P(x, y, z) -> world.
// ===================================================================================================================
export type GraderSheet = {
  /** track position (local m along the front line): stations ... -2.38, -1.38, -0.38 (belt / tray), 0.62 = under
   *  the stamp, 1.58 = GRADER.rackX, resting on the out-rack (from ~0.96 it slides up onto the rack, tilting) */
  x: number;
  mark?: "x" | "tick" | null;
  /** how much of the mark is printed (0..1; stamped: snap it within ~2 frames of the stamp landing) */
  ink?: number;
  /** the mark's colour 0 = graphite grey .. 1 = glowing orange */
  orange?: number;
  /** order on the out-rack: higher = in front (default the track order) */
  stack?: number;
  /** the mark's size x (default 1) */
  markScale?: number;
  /** the mark's stroke weight x on top of markScale (default 1): a bold tick reads at phone size */
  markWeight?: number;
  /** the mark's width x across the sheet (default 1): widen it where the camera sees the sheet edge-on-ish */
  markStretch?: number;
  key?: string;
};
export type GraderOpts = {
  c: V3;
  s?: number;
  yaw?: number;
  /** the side panel: 0 shut .. 1 open (the hero's) */
  panel?: number;
  /** the stamp head: 0 up (resting) .. 1 down on the sheet under it */
  stamp?: number;
  /** orange in the insides 0..1 */
  insides?: number;
  /** orange running up the stamp: post (0-0.4), arm (0.3-0.7), stem + head (0.6-1) */
  arm?: number;
  /** orange spreading over the whole machine from `from` (0..1) */
  body?: number;
  /** the spread's origin (world; default the side opening's centre) */
  from?: V3;
  /** the belt's travel (metres): moves the slats on the conveyor (the cut moves the sheets with the same number) */
  belt?: number;
  /** sheets on the line (beltSheets builds them) */
  sheets?: GraderSheet[];
  /** draw the side opening / door (default true) */
  side?: boolean;
  /** extra glow on the orange parts (default 0.6) */
  glow?: number;
  /** the side door: "side" (the hero's, hinged at the opening's back edge, standing ajar) or "top" (hinged at its top
   *  edge and lifted up and out like a hood, so robots can stand right at the opening) */
  door?: "side" | "top";
  /** which layers to draw: "all" (default), "body" (body + side opening + door: put robots standing BESIDE the
   *  machine after it) or "front" (the shelf line, sheets and stamp: draw it after them) */
  part?: "all" | "body" | "front";
  /** which way the sheets travel along the front: "right" (default, the hero's: conveyor at the left, out-rack at the
   *  right end) or "left" (mirrored: conveyor at the right, out-rack and stamp mirrored to the left; the side
   *  opening stays on the right face, the print still reads left to right) */
  flow?: "right" | "left";
  /** a name printed on the body's top face (Roboto Condensed 700 caps, dark warm-grey ink, in perspective), reading
   *  from the front, mid-top, its stamp-side end under the stamp arm's run; it turns dark orange-brown with
   *  the body spread. Default undefined = no label (pixel-identical to before) */
  label?: string;
};
export const GRADER = {
  body: { w: 2.2, h: 1.5, d: 2.0 },
  /** the opening on the right face, in that face's metres (x back from the front edge, y down from the top) */
  op: { x0: 0.62, x1: 1.82, y0: 0.28, y1: 1.12 },
  /** the shelf line along the front */
  top: 0.93,
  lineZ: -1.32,
  tray: { x0: -0.55, x1: 1.9, d: 0.74, h: 0.07 },
  belt: { x0: -2.95, x1: -0.55, d: 0.74 },
  sheet: { w: 0.62, d: 0.66, t: 0.014 },
  stampX: 0.62,
  rackX: 1.58,
  rackTilt: 0.8,
  step: 1.0,
};
export const graderGeom = (o: GraderOpts) => {
  const s = o.s ?? 1;
  const yaw = o.yaw ?? 0;
  const { u, v } = axes(yaw);
  const mx = o.flow === "left" ? -1 : 1;
  /** local (x along the line, y, z) -> world; x is mirrored for flow "left" */
  const P = (x: number, y: number, z: number): V3 => add(add(add(o.c, mul(u, mx * x * s)), mul(v, z * s)), [0, y * s, 0]);
  const faces = boxFaces(o.c, GRADER.body.w * s, GRADER.body.h * s, GRADER.body.d * s, yaw);
  return { s, yaw, u, v, P, faces };
};
/** a point inside the side opening (face-local metres x back, y down, z depth in) */
export const graderInside = (o: GraderOpts, x: number, y: number, z: number): V3 => {
  const g = graderGeom(o);
  const fr = g.faces.right;
  const out = faceOut(fr);
  return add(add(add(fr.o, mul(fr.u, x * g.s)), mul(fr.v, y * g.s)), mul(out, -z * g.s));
};
/** the three bars' plug points (world): [top, middle, bottom], each at a fraction along the bar (0 front .. 1 back) */
export const graderPlugs = (o: GraderOpts, along = 0.3) => {
  const { op } = GRADER;
  return [0.3, 0.52, 0.74].map((f) => graderInside(o, op.x0 + 0.04 + (op.x1 - op.x0 - 0.08) * along, op.y0 + (op.y1 - op.y0) * f, 0.17));
};
/** the insides' parts in world space, the same geometry GraderSide draws: bars [top, middle, bottom] as [front end,
 *  back end] (stroke 0.075 m) and wires [upper, lower] as 3-point curves (stroke 0.022 m; drawn with threadD) */
export const graderInsideParts = (o: GraderOpts) => {
  const { op } = GRADER;
  const at = (x: number, y: number, z: number) => graderInside(o, x, y, z);
  const bars: V3[][] = [0.3, 0.52, 0.74].map((f) => {
    const y = op.y0 + (op.y1 - op.y0) * f;
    return [at(op.x0 + 0.04, y, 0.16), at(op.x1 - 0.04, y, 0.16)];
  });
  const wires: V3[][] = [
    [at(op.x0 + 0.1, op.y0 + 0.08, 0.25), at(op.x0 + 0.35, op.y0 + 0.2, 0.22), at(op.x1 - 0.15, op.y0 + 0.12, 0.26)],
    [at(op.x0 + 0.12, op.y1 - 0.06, 0.24), at(op.x0 + 0.5, op.y1 - 0.2, 0.2), at(op.x1 - 0.1, op.y1 - 0.08, 0.26)],
  ];
  return { bars, wires, barW: 0.075, wireW: 0.022 };
};
/** the stamp head's bottom centre (world) at stamp position p */
export const graderStampTop = (o: GraderOpts, p = 0) => graderGeom(o).P(GRADER.stampX, GRADER.top + GRADER.sheet.t + (1 - c01(p)) * 0.42, GRADER.lineZ);
/** sheets for a belt position: sheet i sits under the stamp when belt = i (one GRADER.step per sheet); `first..last`
 *  the indices on the line; sheets past the stamp ride onto the out-rack and stay there (the last 4 shown).
 *  mark(i) gives each sheet's mark. Negative indices start on the rack (the earlier, crossed-out ones). */
export const beltSheets = (belt: number, first: number, last: number, mark: (i: number) => Omit<GraderSheet, "x">): GraderSheet[] => {
  const out: GraderSheet[] = [];
  for (let i = first; i <= last; i++) {
    const x = GRADER.stampX + (belt - i) * GRADER.step;
    if (x < GRADER.belt.x0 - 0.2) continue;
    out.push({ x: Math.min(x, GRADER.rackX), stack: i, key: `sh${i}`, ...mark(i) });
  }
  const onRack = out.filter((q) => q.x >= GRADER.rackX - 1e-6);
  const keep = new Set(onRack.slice(-4).map((q) => q.key));
  return out.filter((q) => q.x < GRADER.rackX - 1e-6 || keep.has(q.key));
};
/** a sheet's pose on the line: centre, plane basis (a across, b up the sheet toward its back edge), normal */
const sheetPose = (o: GraderOpts, sh: GraderSheet) => {
  const g = graderGeom(o);
  const { sheet, top, lineZ, rackX, rackTilt } = GRADER;
  const X1 = rackX - GRADER.step * 0.62;
  const e = sst(X1, rackX, sh.x);
  const tilt = e * rackTilt;
  const x = sh.x;
  const st = sh.stack ?? 0;
  const off = e * (st * 0.014 + 0.03);
  // on the rack: the sheet's front edge rests on the rack's lip, its back edge up
  const y = top + sheet.t / 2 + e * (Math.sin(tilt) * sheet.d * 0.5 + 0.03);
  const z = lineZ - e * (1 - Math.cos(tilt)) * sheet.d * 0.5 - e * 0.04;
  const gv = g.v;
  const a = g.u;
  const b = add(mul(gv, Math.cos(tilt)), mul(UP, Math.sin(tilt)));
  const n = add(mul(UP, Math.cos(tilt)), mul(gv, -Math.sin(tilt)));
  const c = add(g.P(x, y, z), mul(n, off * g.s));
  return { c, a, b, n, s: g.s, tilt };
};
/** TICK widened across by `st` (same points, x scaled about the centre; the stroke stays round) */
const tickStretched = (x: number, y: number, s: number, st: number) =>
  `M${n2(x - s * 0.42 * st)},${n2(y + s * 0.02)}L${n2(x - s * 0.12 * st)},${n2(y + s * 0.32)}L${n2(x + s * 0.46 * st)},${n2(y - s * 0.34)}`;
/** the grader's printed name on its top face: one SVG <text> per letter, each under its own affine fitted to the
 *  face's projection at that letter (a piecewise perspective, so it can sit in the same <Svg> as the body) */
const GRADER_ADV: Record<string, number> = { G: 0.6, R: 0.57, A: 0.58, D: 0.58, E: 0.49, " ": 0.25 };
const GraderLabel: React.FC<{ W: World; o: GraderOpts; text: string; orange: boolean }> = ({ W, o, text, orange }) => {
  const g = graderGeom(o);
  const f = g.faces.top;
  const s = g.s;
  const capH = 0.24 * s;
  const fs = capH / 0.711;
  const track = 0.04 * fs;
  const adv = [...text].map((ch) => (GRADER_ADV[ch] ?? 0.56) * fs + track);
  const total = adv.reduce((a, b) => a + b, 0) - track;
  // centred 0.14 m toward the stamp side of the top (its stamp-side end under the arm, which runs above it: from a camera on the stamp side
  // farther letters would hide behind the arm), its baseline on the middle line (z ~0), clear of the stem that drops to
  // the stamp head at the front (the face's v runs from the back edge forward)
  const cx = f.w / 2 + (o.flow === "left" ? -1 : 1) * 0.14 * s;
  const y0 = f.h / 2 + 0.05 * s - capH;
  const R = 1000;
  const cen = add(add(f.o, mul(f.u, cx)), mul(f.v, y0 + capH / 2));
  const ink = W.tone(orange ? "#6B3A0C" : "#5E5750", cen);
  let x = cx - total / 2;
  return (
    <g>
      {[...text].map((ch, i) => {
        const wl = adv[i] - track;
        const TL = W.project(add(add(f.o, mul(f.u, x)), mul(f.v, y0)));
        const TR = W.project(add(add(f.o, mul(f.u, x + wl)), mul(f.v, y0)));
        const BL = W.project(add(add(f.o, mul(f.u, x)), mul(f.v, y0 + capH)));
        x += adv[i];
        const m = [(TR[0] - TL[0]) / (wl * R), (TR[1] - TL[1]) / (wl * R), (BL[0] - TL[0]) / (capH * R), (BL[1] - TL[1]) / (capH * R), TL[0], TL[1]].map((v) => v.toFixed(5)).join(" ");
        return (
          <text key={i} transform={`matrix(${m})`} x={(wl * R) / 2} y={capH * R} fontFamily={FONT} fontWeight={700} fontSize={fs * R} textAnchor="middle" fill={ink}>
            {ch}
          </text>
        );
      })}
    </g>
  );
};
const GraderSheetEl: React.FC<{ W: World; o: GraderOpts; sh: GraderSheet; uid: string; mask?: string }> = ({ W, o, sh, uid }) => {
  const { sheet } = GRADER;
  const p = sheetPose(o, sh);
  const sw = sheet.w * p.s;
  const sd = sheet.d * p.s;
  const st = sheet.t * p.s;
  const base = add(p.c, mul(p.n, -st / 2));
  const tl = add(add(add(p.c, mul(p.a, -sw / 2)), mul(p.b, sd / 2)), mul(p.n, st / 2 + 0.002 * p.s));
  const res = 500;
  const face = W.tone(MATS.clay.mid, p.c);
  const ink = c01(sh.ink ?? 1);
  const orange = c01(sh.orange ?? 0);
  const markC = orange > 0 ? mixHexL(W.tone("#6E6A64", p.c), W.toneO(ACCENT, p.c), orange) : W.tone("#6E6A64", p.c);
  const fade = sst(GRADER.belt.x0 - 0.2, GRADER.belt.x0 + 0.25, sh.x);
  const W0 = sw / p.s;
  const H0 = sd / p.s;
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade }}>
      <Svg id={`${uid}p`}>
        <Prism W={W} outline={rrect(sw, sd, 0.02 * p.s, 4)} o={base} u={p.a} v={p.b} n={p.n} depth={st} mat={MATS.clay} uid={`${uid}p`} ao={0} rim={0.6} />
      </Svg>
      <Decal W={W} o={tl} u={p.a} v={mul(p.b, -1)} w={sw} h={sd} res={res / p.s}>
        <g transform={`scale(${1})`}>
          <CodeBars x={0.07 * res} y={0.08 * res} w={0.36 * res} rowH={0.055 * res} face={face} lines={[[0, 0.8], [1, 0.6], [1, 0.75], [0, 0.5]]} />
          {sh.mark && ink > 0.01 ? (
            <g opacity={n2(ink)}>
              {sh.mark === "x" ? (
                <path d={CROSS(W0 * 0.5 * res, H0 * 0.62 * res, 0.36 * res * (sh.markScale ?? 1))} stroke={markC} strokeWidth={0.06 * res * (sh.markScale ?? 1) * (sh.markWeight ?? 1)} strokeLinecap="round" fill="none" />
              ) : (
                <path
                  d={sh.markStretch !== undefined ? tickStretched(W0 * 0.5 * res, H0 * 0.6 * res, 0.44 * res * (sh.markScale ?? 1), sh.markStretch) : TICK(W0 * 0.5 * res, H0 * 0.6 * res, 0.44 * res * (sh.markScale ?? 1))}
                  stroke={markC}
                  strokeWidth={0.07 * res * (sh.markScale ?? 1) * (sh.markWeight ?? 1)}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              )}
            </g>
          ) : null}
        </g>
      </Decal>
    </div>
  );
};
/** a radial reveal mask (screen px) for the orange copy of a part */
const SpreadMask: React.FC<{ id: string; c: P2; r: number }> = ({ id, c, r }) => (
  <defs>
    <radialGradient id={`${id}g`} gradientUnits="userSpaceOnUse" cx={n2(c[0])} cy={n2(c[1])} r={n2(Math.max(1, r))}>
      <stop offset="0" stopColor="#fff" />
      <stop offset="0.8" stopColor="#fff" />
      <stop offset="1" stopColor="#000" />
    </radialGradient>
    <mask id={id} maskUnits="userSpaceOnUse" x={-500} y={-500} width={2100} height={2900}>
      <rect x={-500} y={-500} width={2100} height={2900} fill={`url(#${id}g)`} />
    </mask>
  </defs>
);
/** THE GRADER, in painter's order (meant to be seen from its front half: camera yaw relative to it within +-1.2 rad):
 *  body + side opening + door, the shelf line (conveyor, tray, out-rack), the sheets, the stamp. Contact shadows:
 *  graderShadows(W, o, uid) in the stage's shadows. */
export const Grader: React.FC<{ W: World; o: GraderOpts; uid: string }> = ({ W, o, uid }) => {
  const g = graderGeom(o);
  const { s, yaw, P } = g;
  const { body, top, lineZ, tray, belt, stampX } = GRADER;
  const sw = (n: number) => n * s;
  const bodyT = c01(o.body ?? 0);
  const armT = c01(o.arm ?? 0);
  const from = o.from ?? graderInside(o, (GRADER.op.x0 + GRADER.op.x1) / 2, (GRADER.op.y0 + GRADER.op.y1) / 2, 0.2);
  const fromS = W.project(from);
  const k = W.scaleAt(o.c);
  const R = bodyT >= 0.999 ? 99999 : bodyT * 3.4 * s * k;
  const mid = `${uid}spread`;
  const glow = o.glow ?? 0.6;
  const anyOrange = bodyT > 0 || armT > 0 || (o.insides ?? 0) > 0;
  // a part drawn white, then (when the spread reaches it) its orange copy through the round mask
  const two = (key: string, el: (orange: boolean) => React.ReactNode) =>
    bodyT <= 0 ? (
      <g key={key}>{el(false)}</g>
    ) : bodyT >= 0.999 ? (
      <g key={key}>{el(true)}</g>
    ) : (
      <g key={key}>
        {el(false)}
        <g mask={`url(#${mid}${o.part ?? "all"})`}>{el(true)}</g>
      </g>
    );
  const om = (orange: boolean, m: Mat) => (orange ? MATS.orange : m);
  const em = (orange: boolean, e = 0.35) => (orange ? e : 0);
  const sideSeen = (o.side ?? true) && faceSeen(W, g.faces.right);
  // the belt slats move with the belt
  const slatGap = 0.3;
  const slats: number[] = [];
  const off = ((((o.belt ?? 0) * GRADER.step) % slatGap) + slatGap) % slatGap;
  for (let x = belt.x0 + 0.1 + off; x < belt.x1 - 0.08; x += slatGap) slats.push(x);
  const sheets = [...(o.sheets ?? [])].sort((a, b) => {
    const ra = a.x >= GRADER.rackX - 0.62 ? 1 : 0;
    const rb = b.x >= GRADER.rackX - 0.62 ? 1 : 0;
    if (ra !== rb) return ra - rb;
    if (ra) return (a.stack ?? 0) - (b.stack ?? 0);
    return W.depth(sheetPose(o, b).c) - W.depth(sheetPose(o, a).c);
  });
  // the stamp: post at the back of the top, the arm forward over the line, a stem and the head
  const p = c01(o.stamp ?? 0);
  const armY = body.h + 0.62;
  const headH = 0.22;
  const headY = top + GRADER.sheet.t + (1 - p) * 0.42;
  const seg = (a: number, b: number) => (bodyT >= 0.999 ? 1 : sst(a, b, armT));
  const armMat = (t: number) => mixMat(MATS.clayWarm, MATS.orange, t);
  const stampParts = (orange: boolean) => {
    const mt = (t: number) => (orange ? MATS.orange : armMat(t));
    const e = (t: number) => (orange ? 0.35 : 0.35 * t);
    const t0 = seg(0, 0.4);
    const t1 = seg(0.3, 0.7);
    const t2 = seg(0.6, 1);
    return (
      <>
        <RBox W={W} c={P(stampX, body.h, 0.45)} w={sw(0.2)} d={sw(0.2)} h={sw(armY + 0.14 - body.h)} r={0.06 * s} yaw={yaw} mat={mt(t0)} uid={`${uid}post${orange ? "o" : ""}`} ao={0.2} orange={orange || t0 > 0.5} emissive={e(t0)} />
        <RBox W={W} c={P(stampX, armY, (0.45 + lineZ) / 2)} w={sw(0.17)} d={sw(0.45 - lineZ + 0.2)} h={sw(0.14)} r={0.06 * s} yaw={yaw} mat={mt(t1)} uid={`${uid}arm${orange ? "o" : ""}`} ao={0.1} orange={orange || t1 > 0.5} emissive={e(t1)} />
        <RBox W={W} c={P(stampX, headY + headH, lineZ)} w={sw(0.08)} d={sw(0.08)} h={sw(Math.max(0.01, armY - headY - headH))} r={0.03 * s} yaw={yaw} mat={mt(t2)} uid={`${uid}stem${orange ? "o" : ""}`} ao={0} orange={orange || t2 > 0.5} emissive={e(t2)} />
        <RBox W={W} c={P(stampX, headY, lineZ)} w={sw(0.44)} d={sw(0.44)} h={sw(headH)} r={0.08 * s} yaw={yaw} mat={mt(t2)} uid={`${uid}head${orange ? "o" : ""}`} ao={0.2} orange={orange || t2 > 0.5} emissive={e(t2)} />
      </>
    );
  };
  const part = o.part ?? "all";
  const showBody = part !== "front";
  const showFront = part !== "body";
  return (
    <>
      <Svg id={`${uid}A${part}`} glow={anyOrange ? glow : 0}>
        {bodyT > 0 && bodyT < 0.999 ? <SpreadMask id={`${mid}${part}`} c={fromS} r={R} /> : null}
        {showBody && two("body", (or) => (
          <RBox W={W} c={o.c} w={sw(body.w)} h={sw(body.h)} d={sw(body.d)} r={0.2 * s} yaw={yaw} mat={om(or, MATS.clay)} uid={`${uid}body${or ? "o" : ""}`} ao={0.8} orange={or} emissive={em(or)} />
        ))}
        {showBody && o.label && faceSeen(W, g.faces.top) ? two("label", (or) => <GraderLabel W={W} o={o} text={o.label ?? ""} orange={or} />) : null}
        {showBody && sideSeen ? two("side", (or) => <GraderSide W={W} o={o} uid={`${uid}sd${or ? "o" : ""}`} orange={or} />) : null}
        {/* the shelf line: the conveyor (legs, belt, slats), the tray, the out-rack */}
        {showFront && two("shelf", (or) => (
          <>
            {[belt.x0 + 0.3, belt.x1 - 0.3].map((x, i) => (
              <RBox key={i} W={W} c={P(x, 0, lineZ)} w={sw(0.1)} d={sw(0.5)} h={sw(top - 0.1)} r={0.03 * s} yaw={yaw} mat={om(or, MATS.graphite)} uid={`${uid}lg${i}${or ? "o" : ""}`} ao={0.4} rim={0.5} orange={or} emissive={em(or, 0.2)} />
            ))}
            <RBox W={W} c={P((belt.x0 + belt.x1) / 2, top - 0.1, lineZ)} w={sw(belt.x1 - belt.x0)} d={sw(belt.d)} h={sw(0.1)} r={0.05 * s} yaw={yaw} mat={om(or, MATS.slate)} uid={`${uid}belt${or ? "o" : ""}`} ao={0.2} orange={or} emissive={em(or, 0.2)} />
            <path
              d={slats
                .map((x) => {
                  const a = W.project(P(x, top + 0.002, lineZ - belt.d / 2 + 0.06));
                  const b = W.project(P(x, top + 0.002, lineZ + belt.d / 2 - 0.06));
                  return `M${n2(a[0])},${n2(a[1])}L${n2(b[0])},${n2(b[1])}`;
                })
                .join("")}
              stroke={W.tone(or ? MATS.orange.dark : GRAPHITE.shadow, P(-1.7, top, lineZ))}
              strokeOpacity={0.45}
              strokeWidth={n2(Math.max(0.6, 0.02 * k * s))}
              strokeLinecap="round"
            />
            <RBox W={W} c={P((tray.x0 + tray.x1) / 2, top - tray.h, lineZ)} w={sw(tray.x1 - tray.x0)} d={sw(tray.d)} h={sw(tray.h)} r={0.04 * s} yaw={yaw} mat={om(or, MATS.clayWarm)} uid={`${uid}tray${or ? "o" : ""}`} ao={0.3} orange={or} emissive={em(or, 0.3)} />
            {/* the out-rack: a tilted rest at the right end, its lip at the front */}
            <GraderRack W={W} o={o} uid={`${uid}rk${or ? "o" : ""}`} orange={or} />
          </>
        ))}
      </Svg>
      {showFront && sheets.map((sh) => (
        <GraderSheetEl key={sh.key ?? `${sh.x}`} W={W} o={o} sh={sh} uid={`${uid}${sh.key ?? Math.round(sh.x * 100)}`} />
      ))}
      {showFront ? (
      <Svg id={`${uid}S`} glow={anyOrange ? glow : 0}>
        {bodyT > 0 && bodyT < 0.999 ? <SpreadMask id={`${mid}2`} c={fromS} r={R} /> : null}
        {bodyT <= 0 || bodyT >= 0.999 ? (
          stampParts(bodyT >= 0.999)
        ) : (
          <>
            {stampParts(false)}
            <g mask={`url(#${mid}2)`}>{stampParts(true)}</g>
          </>
        )}
      </Svg>
      ) : null}
    </>
  );
};
const GraderRack: React.FC<{ W: World; o: GraderOpts; uid: string; orange: boolean }> = ({ W, o, uid, orange }) => {
  const sh = sheetPose(o, { x: GRADER.rackX, stack: -1 });
  const s = sh.s;
  const w = (GRADER.sheet.w + 0.08) * s;
  const d = (GRADER.sheet.d + 0.04) * s;
  const base = add(sh.c, mul(sh.n, -0.05 * s));
  const mat = orange ? MATS.orange : MATS.clayWarm;
  const lip = add(add(sh.c, mul(sh.b, -d / 2)), mul(sh.n, -0.02 * s));
  return (
    <>
      <Prism W={W} outline={rrect(w, d, 0.04 * s, 4)} o={base} u={sh.a} v={sh.b} n={sh.n} depth={0.035 * s} mat={mat} uid={`${uid}p`} ao={0.3} orange={orange} emissive={orange ? 0.3 : 0} />
      <Prism W={W} outline={rrect(w, 0.06 * s, 0.02 * s, 3)} o={lip} u={sh.a} v={sh.n} n={mul(sh.b, -1)} depth={0.035 * s} mat={mat} uid={`${uid}l`} ao={0} orange={orange} emissive={orange ? 0.3 : 0} />
    </>
  );
};
/** the side opening (recess walls, insides) and the door; insides 0..1 = orange in the recess */
const GraderSide: React.FC<{ W: World; o: GraderOpts; uid: string; orange: boolean }> = ({ W, o, uid, orange }) => {
  const g = graderGeom(o);
  const { s, faces } = g;
  const { op } = GRADER;
  const fr = faces.right;
  const out = faceOut(fr);
  const at = (x: number, y: number, z = 0): V3 => add(add(add(fr.o, mul(fr.u, x * s)), mul(fr.v, y * s)), mul(out, -z * s));
  const depth = 0.32;
  const front = [at(op.x0, op.y0), at(op.x1, op.y0), at(op.x1, op.y1), at(op.x0, op.y1)];
  const back = [at(op.x0, op.y0, depth), at(op.x1, op.y0, depth), at(op.x1, op.y1, depth), at(op.x0, op.y1, depth)];
  const cen = at((op.x0 + op.x1) / 2, (op.y0 + op.y1) / 2, depth / 2);
  const ins = orange ? 1 : c01(o.insides ?? 0);
  const inside = mixMat(MATS.graphite, MATS.orange, ins);
  const t = (hex: string) => (ins > 0.5 ? W.toneO(hex, cen) : W.tone(hex, cen));
  const barMat = mixMat(MATS.clay, MATS.orange, ins);
  const wireC = mixHexL(MATS.greige.mid, ACCENT, ins);
  const doorH = (op.y1 - op.y0) * s;
  const doorW = (op.x1 - op.x0) * s;
  const top = o.door === "top";
  // side: hinged at the back edge, swung out (1.15 rad open); top: hinged at the top edge, lifted up and out (2.05 rad)
  const th = c01(o.panel ?? 1) * (top ? 2.05 : 1.15);
  const hinge = top ? at((op.x0 + op.x1) / 2, op.y0 - 0.02, 0) : at(op.x1 + 0.02, (op.y0 + op.y1) / 2, 0);
  const dir = top ? add(mul(DOWN, Math.cos(th)), mul(out, Math.sin(th))) : add(mul(fr.u, -Math.cos(th)), mul(out, Math.sin(th)));
  const doorLen = top ? doorH : doorW;
  const doorC = add(add(hinge, mul(dir, doorLen / 2)), mul(out, 0.03 * s));
  const bars = [0.3, 0.52, 0.74].map((f) => op.y0 + (op.y1 - op.y0) * f);
  const wires: V3[][] = [
    [at(op.x0 + 0.1, op.y0 + 0.08, 0.25), at(op.x0 + 0.35, op.y0 + 0.2, 0.22), at(op.x1 - 0.15, op.y0 + 0.12, 0.26)],
    [at(op.x0 + 0.12, op.y1 - 0.06, 0.24), at(op.x0 + 0.5, op.y1 - 0.2, 0.2), at(op.x1 - 0.1, op.y1 - 0.08, 0.26)],
  ];
  const k = W.scaleAt(cen);
  return (
    <g>
      <path d={polyFrom(W, back)} fill={t(mixHexL(inside.dark, GRAPHITE.shadow, 0.3 * (1 - ins)))} />
      <path d={polyFrom(W, [front[3], front[2], back[2], back[3]])} fill={t(inside.mid)} />
      <path d={polyFrom(W, [front[0], back[0], back[3], front[3]])} fill={t(inside.dark)} />
      <path d={polyFrom(W, [front[1], front[2], back[2], back[1]])} fill={t(mixHexL(inside.dark, inside.mid, 0.4))} />
      <path d={polyFrom(W, [front[0], front[1], back[1], back[0]])} fill={t(mixHexL(inside.dark, GRAPHITE.shadow, 0.45 * (1 - ins)))} />
      {wires.map((w, i) => (
        <path key={i} d={threadD(w.map(W.project))} fill="none" stroke={t(wireC)} strokeWidth={n2(0.022 * k * s)} strokeLinecap="round" />
      ))}
      {bars.map((y, i) => {
        const pa = W.project(at(op.x0 + 0.04, y, 0.16));
        const pb = W.project(at(op.x1 - 0.04, y, 0.16));
        return (
          <g key={i}>
            <path d={`M${n2(pa[0])},${n2(pa[1])}L${n2(pb[0])},${n2(pb[1])}`} stroke={t(barMat.dark)} strokeWidth={n2(0.075 * k * s)} strokeLinecap="round" />
            <path d={`M${n2(pa[0])},${n2(pa[1] - 0.012 * k * s)}L${n2(pb[0])},${n2(pb[1] - 0.012 * k * s)}`} stroke={t(barMat.lit)} strokeWidth={n2(0.04 * k * s)} strokeLinecap="round" />
          </g>
        );
      })}
      {top ? (
        <Prism W={W} outline={rrect(doorW, doorH, 0.06 * s, 5)} o={doorC} u={fr.u} v={dir} n={norm(cross(fr.u, dir))} depth={0.05 * s} mat={orange ? MATS.orange : MATS.clay} uid={`${uid}door`} ao={0.2} orange={orange} emissive={orange ? 0.35 : 0} />
      ) : (
        <Prism W={W} outline={rrect(doorW, doorH, 0.06 * s, 5)} o={doorC} u={dir} v={UP} n={norm(cross(dir, UP))} depth={0.05 * s} mat={orange ? MATS.orange : MATS.clay} uid={`${uid}door`} ao={0.4} orange={orange} emissive={orange ? 0.35 : 0} />
      )}
    </g>
  );
};
/** the grader's contact shadows (for the stage's shadows): body, conveyor legs, out-rack */
export const graderShadows = (W: World, o: GraderOpts, uid: string) => {
  const g = graderGeom(o);
  const { body, belt, lineZ } = GRADER;
  const s = g.s;
  const fp = (x0: number, x1: number, z0: number, z1: number) => [g.P(x0, 0, z0), g.P(x1, 0, z0), g.P(x1, 0, z1), g.P(x0, 0, z1)];
  return (
    <>
      <FloorShadow W={W} pts={fp(-body.w / 2, body.w / 2, -body.d / 2, body.d / 2)} uid={`${uid}b`} soft={0.32 * s} reach={0.6 * s} />
      <FloorShadow W={W} pts={fp(belt.x0, belt.x1, lineZ - 0.3, lineZ + 0.3)} uid={`${uid}c`} soft={0.15 * s} reach={0.4 * s} tight={0.5} />
    </>
  );
};

// ===================================================================================================================
// SERVER RACKS (hero C): clay cabinets; one face carries 12 slim server units (faceplate, vent grille, drive slot,
// a small light each); the light's orange 0..1 lets a wave spread; the OpenAI mark on an end-cap
// ===================================================================================================================
export const RACK = { w: 1.0, d: 0.86, h: 2.15, units: 12 };
type RackFace = "front" | "back" | "left" | "right";
const unitBox = (h: number, units: number) => {
  const y0 = 0.14;
  const uh = (h - 0.26) / units;
  return { y0, uh };
};
/** the world positions of a rack's unit lights (for ordering a wave by distance) */
export const rackLights = (c: V3, face: RackFace = "left", yaw = 0, R = RACK): V3[] => {
  const f = boxFaces(c, R.w, R.h, R.d, yaw)[face];
  const { y0, uh } = unitBox(R.h, R.units);
  return Array.from({ length: R.units }, (_, i) => add(add(f.o, mul(f.u, f.w * 0.22)), mul(f.v, y0 + (i + 0.5) * uh)));
};
const RackUnits: React.FC<{ w: number; h: number; res: number; face: string; frame: string; lit: number[]; seed: number; led?: number; warm?: number }> = ({ w, h, res, face, frame, lit, seed, led = 1, warm = 0.12 }) => {
  const units = lit.length;
  const { y0, uh: uhm } = unitBox(h, units);
  const x0 = 0.07 * res;
  const x1 = (w - 0.07) * res;
  const uh = uhm * res;
  return (
    <g>
      <defs>
        <filter id={`rl${seed}`} x="-100%" y="-300%" width="300%" height="700%">
          <feGaussianBlur stdDeviation={uh * 0.2} />
        </filter>
      </defs>
      {/* the frame: rails and caps, darker */}
      <rect x={x0 - 0.035 * res} y={y0 * res - 0.05 * res} width={x1 - x0 + 0.07 * res} height={units * uh + 0.1 * res} rx={0.03 * res} fill={frame} />
      {lit.map((L, i) => {
        const y = y0 * res + i * uh;
        const q = ((i * 7 + seed * 3) % 5) / 5;
        const ledX = x0 + 0.15 * (x1 - x0);
        return (
          <g key={i}>
            <rect x={x0} y={y + uh * 0.08} width={x1 - x0} height={uh * 0.84} rx={uh * 0.12} fill={mixHexL(face, ACCENT, warm * L)} />
            {/* the vent grille */}
            {Array.from({ length: 7 }, (_, j) => (
              <rect key={j} x={x0 + (0.42 + j * 0.075) * (x1 - x0)} y={y + uh * 0.3} width={0.045 * (x1 - x0)} height={uh * 0.4} rx={uh * 0.08} fill={GRAPHITE.shadow} opacity={0.2} />
            ))}
            {/* the drive slot */}
            <rect x={x0 + 0.24 * (x1 - x0)} y={y + uh * 0.38} width={(0.1 + 0.06 * q) * (x1 - x0)} height={uh * 0.24} rx={uh * 0.08} fill={GRAPHITE.shadow} opacity={0.24} />
            {/* the light: dim grey off, glowing orange lit */}
            {L > 0.01 ? <circle cx={ledX} cy={y + uh * 0.5} r={uh * 0.32 * led} fill={ACCENT} opacity={L * 0.9} filter={`url(#rl${seed})`} /> : null}
            <circle cx={ledX} cy={y + uh * 0.5} r={uh * 0.15 * led} fill={mixHexL(mixHexL(face, GRAPHITE.shadow, 0.35), ACCENT, L)} />
            {L > 0.01 ? <circle cx={ledX - uh * 0.04 * led} cy={y + uh * (0.5 - 0.04 * led)} r={uh * 0.06 * led} fill="#FFE7A8" opacity={L} /> : null}
          </g>
        );
      })}
    </g>
  );
};
/** one rack standing on c (bottom centre). face: the side carrying the units; lit: a number for all units, an array
 *  (top to bottom) or (i, p) => 0..1 with p the light's world point; endCap: a face showing the OpenAI mark and a
 *  vent (null: none). Layers: the cabinet (Svg) + decals: put each rack's layers together, racks sorted far to near. */
export const Rack: React.FC<{ W: World; c: V3; uid: string; yaw?: number; face?: RackFace; lit?: number | number[] | ((i: number, p: V3) => number); endCap?: RackFace | null; led?: number; warm?: number }> = ({
  W,
  c,
  uid,
  yaw = 0,
  face = "left",
  lit = 0,
  endCap = null,
  led = 1,
  warm = 0.12,
}) => {
  const R = RACK;
  const fs = boxFaces(c, R.w, R.h, R.d, yaw);
  const f = fs[face];
  const pts = rackLights(c, face, yaw);
  const L = pts.map((p, i) => c01(typeof lit === "number" ? lit : Array.isArray(lit) ? (lit[i] ?? 0) : lit(i, p)));
  const res = 220;
  const ec = endCap ? fs[endCap] : null;
  return (
    <>
      <Svg id={`${uid}c`}>
        <RBox W={W} c={c} w={R.w} h={R.h} d={R.d} r={0.05} yaw={yaw} mat={MATS.clay} uid={uid} ao={0.8} />
      </Svg>
      {faceSeen(W, f) ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <Decal W={W} o={f.o} u={f.u} v={f.v} w={f.w} h={f.h} res={res}>
            <RackUnits w={f.w} h={f.h} res={res} face={W.tone(MATS.clay.lit, c)} frame={W.tone(mixHexL(MATS.clay.dark, GRAPHITE.shadow, 0.25), c)} lit={L} seed={Math.abs(Math.round(c[0] * 7 + c[2] * 13))} led={led} warm={warm} />
          </Decal>
        </div>
      ) : null}
      {ec && faceSeen(W, ec) ? (
        <Decal W={W} o={ec.o} u={ec.u} v={ec.v} w={ec.w} h={ec.h} res={300}>
          {Array.from({ length: 7 }, (_, j) => (
            <rect key={j} x={ec.w * 300 * 0.2} y={(0.18 + j * 0.055) * 300} width={ec.w * 300 * 0.6} height={0.022 * 300} rx={0.011 * 300} fill={W.tone(GRAPHITE.shadow, c)} opacity={0.18} />
          ))}
          <OpenAIMark x={ec.w * 150} y={ec.h * 300 * 0.62} size={ec.w * 300 * 0.56} fill={W.tone("#3C3936", c)} />
        </Decal>
      ) : null}
    </>
  );
};

export { circleOutline, FONT };
