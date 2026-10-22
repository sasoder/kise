// ---------------------------------------------------------------------------
// romeFolk — the Roman cast of the Kyle Harper clip "Slavery didn't stop Rome from industrializing" (kyle-rome-slavery,
// V3), redrawn in the pandemics clip's picture-book GOUACHE ("style A", pandemicFolk*): flat matte shapes, no outline,
// ONE soft crescent shadow per part from the upper-left light, the gouache grain + dry-brush mottling + hand-wobbly
// edges (pandemicFolkPaint's own filter: both clips painted by the same hand), a small round head on a pear body,
// dot eyes, a small nose, a blush dot, mitten hands, small feet; muted earthy colours. People are never orange.
//
// A DROP-IN for romeCast: the same exports, signatures and meanings. A cut changes `from "./romeCast"` to
// `from "./romeFolk"` and keeps working (poses, grips, anchors, props, constants are romeCast's; every drawn shape is
// new). The skeleton is romeCast's (texcoco rig, romeSpec, gripTo): feet, hips, hands, grips, contacts, walk phases
// and every constant are unchanged. Contract and what a cut must adjust: <notes>/ROME_FOLK_READY.md.
//
// UNITS: as romeCast: figure-local, feet at (0, 0), up is -y, a man ~312 units to the top of the head
// (scaleForPx(px)); `at` = the feet in world px, `scale` = world px per unit. Drawn inside the cut's svg.
//
// FIGURES  <Slave|Freeman|Dominus|Overseer ... />  or  <RomeFigure kind ... />  — romeCast's props, plus:
//   fog?: { rgb: [r,g,b] | "#hex", amount }   sink the figure into the medium (pandemicAir: fogRgb / v.airAt(d, h)
//                                         and v.fogAt(d)); every paint colour is mixed toward rgb by amount
//   drain?: 0..1                          misery / the dead: cloth and hair sink to DEAD #8A7B62, the skin greys
//   chalk?: boolean                       (Slave) chalk-whitened bare feet (the sale of imported slaves)
//   titulus?: boolean                     (any) the blank sale board on a cord at the neck
//   inks?: Partial<FolkInks>              colour overrides (skin, hair, tunic, belt, over, trim, leather, cap, iron, wood)
//   unitPx?: number                       screen px per user unit of the enclosing svg (WorldSvg: cam.k), so the gouache
//                                         texture and the shadow softness stay in screen px under a zoom
//   texture?: boolean                     false = no per-figure texture filter (for <RomeFolkLayer>; the default
//                                         per-figure filter is the faster one for spread-out figures)
//   ink / cloth (romeCast's Ink)          still accepted: a dimmed ink (shadeInk / tintInk / depthTint) becomes a fog
//                                         toward the old umber page by its dimness. V3 cuts: pass `fog` instead.
//   shade                                 accepted and ignored (the crescent shadow is the style, always on)
//   tone                                  opacity (as before)
// The kinds' looks (palette in ROME_FOLK_READY.md): Slave 0..4 (3 = woman, long tunic, bun) undyed oatmeal /
//   grey-brown tunic with a soft ragged hem, rope belt, bare feet; garb tunic | exomis | loincloth; fetters (slate
//   cuffs + a chain that follows the feet), collar. Freeman 0..3 (3 = woman shopkeeper with a palla): dusty teal /
//   ochre / muted red-brown tunics, leather apron, the felt pilleus, sandals. Dominus 0..2: ivory toga (balteus,
//   sinus, end panel, the wrapped left arm), a muted red-brown border (broad + clavi with `stripe`), a ring, curly
//   hair, plump and pleased; shoes. Overseer 0..2: umber tunic, a short slate / dark-teal cloak with a brooch, strapped
//   sandals, the vine rod (or whip, or none).
// POSES, mirrorPose, walkPose / walkAdvance / pushAdvance, gripTo + the `grip` prop, romeAnchors, every constant:
//   romeCast's (re-exported). romeAnchors' headTop follows the folk head (within ~2 units of romeCast's).
// PROPS (Amphora, Sack, Basket, Chain, CoinHeap, Couch, PotterWheel, RotaryQuern, Stool, Hammer, Pick, Rod): romeCast's
//   geometry and anchors (quernHandle, POTTER, COUCH, reclineAt), redrawn in the same gouache; props take `fog` too.
//   Orange only where it is the clip's orange: CoinHeap's coins (default orange; `ink` CREAM for the cream heap).
// AIR: <RomeContactShadow at scale w? amount? uid /> a soft contact shadow in palette A's shadow colour (#22180F);
//   in a perspective use pandemicAir's AirContactShadow (or londonDepth's ContactShadow) the same way.
// Probes: romeFolkProbe.tsx (src/Root.RomeFolk.tsx, src/entry.RomeFolk.ts).
// ---------------------------------------------------------------------------
import React, { createContext, useContext } from "react";
import { add, mix, rot } from "../kits/maps/stringsMotion";
import { figureRig, type FigPose } from "../kits/maps/texcocoFigures";
import { PAINT, folkTexDefs, mixC, type Shape } from "../kyle-pandemics/pandemicFolkPaint";
import {
  CREAM,
  COUCH,
  POTTER,
  QUERN,
  romeAnchors as castAnchors,
  gripTo,
  romeSpec,
  type Garb,
  type Ink,
  type RomeKind,
  type RomeLoad,
  type RomeTool,
} from "./romeCast";
import { AMPHORA, FU, HEAD_R, HEAD_UP, SACK, WICKER, buildRomeFolk, chainLinks, closedD, ellD, folkLookOf, lineD, loadArt, toolGeomOf, tubeD, type FolkInks } from "./romeFolkBody";

// ---- re-exports: romeCast's plumbing (poses, rig maths, constants, types) ------------------------------------------
export {
  CREAM,
  COUCH,
  DARK,
  FPS,
  GRIND,
  HAUL,
  MAN_UNITS,
  ORANGE,
  POSES,
  POTTER,
  PUSH,
  QUERN,
  ROME_VARIANTS,
  STAND,
  TOOL_LEN,
  TREAD,
  WALK,
  WALK_CYCLE,
  gripTo,
  headTurn,
  idle,
  isFemale,
  lerpFig,
  mirrorPose,
  mixInk,
  poseTrack,
  pushAdvance,
  quernHandle,
  reclineAt,
  romeSpec,
  scaleForPx,
  shadeInk,
  track,
  walkAdvance,
  walkPose,
} from "./romeCast";
export type { ArmPose, FigPose, Garb, Ink, RomeKind, RomeLoad, RomeTool } from "./romeCast";
export { FU, HEAD_R, HEAD_UP, skirtOutlineOf, folkLookOf, type FolkInks, type HairKind, type BeardKind } from "./romeFolkBody";
export const ORANGE_DEEP = "#D98A0C";
export const DEAD = "#8A7B62";
/** palette A's shadow colour (contact and cast shadows in the air) */
export const AIR_SHADOW = "#22180F";

type P2 = [number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));

// ===================================================================================================================
// FOG (the medium) and the legacy inks
// ===================================================================================================================
export type FolkFog = { rgb: [number, number, number] | string; amount: number };
const rgbHex = (c: [number, number, number]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const fogHexOf = (f: FolkFog) => (typeof f.rgb === "string" ? f.rgb : rgbHex(f.rgb));
const lum = (h: string) => {
  const m = h.match(/^#([0-9a-f]{6})$/i);
  let c = [0, 0, 0];
  if (m) c = [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  else {
    const r = h.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (r) c = [1, 2, 3].map((i) => Number(r[i]));
  }
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const PAGE = "#3F3428";
/** a romeCast ink (CREAM dimmed toward the page) as a fog amount toward the page */
const legacyFog = (ink?: Ink, cloth?: Ink): FolkFog | null => {
  const amt = (i?: Ink) => (i ? c01(1 - (lum(i.main) - lum(PAGE)) / (lum(CREAM.main) - lum(PAGE))) : 0);
  const a = Math.max(amt(ink), amt(cloth));
  return a > 0.01 ? { rgb: "#4A3F31", amount: a * 0.85 } : null;
};
const applyFog = (shapes: Shape[], fog: FolkFog | null): Shape[] => {
  if (!fog || fog.amount <= 0.001) return shapes;
  const to = fogHexOf(fog);
  const t = c01(fog.amount);
  return shapes.map((s) => ({ ...s, fill: mixC(s.fill, to, t) }));
};

// ===================================================================================================================
// THE PAINT: one figure (or a prop) through pandemicFolkPaint's FolkPaint, in folk units (the Worker's 513)
// ===================================================================================================================
/** the crescent shadow: a little stronger than PAINT's default (0.3), so it reads like the Worker's on muted cloth */
export const FOLK_SHADE = { amt: 0.4, to: "#2C3433" };
const TexCtx = createContext<{ shared: boolean }>({ shared: false });
/** one gouache texture filter over a whole group of figures: children drawn inside skip their own filter. px = the
 *  group's size factor (1 at an ~860 px figure; pass ~figure px / 860). Measured: for figures spread over the frame it
 *  is SLOWER than one filter per figure (the default; 30 walkers ~0.5 s/frame vs ~1.2 s with one layer), because the
 *  layer's filter region is the whole group's box; use it only for a tight cluster. */
export const RomeFolkLayer: React.FC<{ uid: string; px?: number; unitPx?: number; children?: React.ReactNode }> = ({ uid, px = 0.4, unitPx = 1, children }) => (
  <TexCtx.Provider value={{ shared: true }}>
    <defs>{folkTexDefs(uid, px, unitPx)}</defs>
    <g filter={`url(#${uid}tx)`}>{children}</g>
  </TexCtx.Provider>
);
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
/** a shape's box (figure units; control points included, so it is generous) */
const boxOf = (d: string): [number, number, number, number] => {
  const v = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < v.length; i += 2) {
    if (v[i] < x0) x0 = v[i];
    if (v[i] > x1) x1 = v[i];
    if (v[i + 1] < y0) y0 = v[i + 1];
    if (v[i + 1] > y1) y1 = v[i + 1];
  }
  return [x0, y0, x1, y1];
};
/** pandemicFolkPaint's FolkPaint, shape for shape (the same crescent: the shape minus itself shifted up-left by
 *  PAINT.shadeOff and blurred by PAINT.shadeBlur px, in the shade colour; the same `det` strokes and `cast` shapes;
 *  the same gouache texture filter, folkTexDefs, over the whole figure), with one change for speed: each crescent's
 *  mask and fill cover the shape's own box instead of a +-3000-unit square (30 figures: ~29 s -> a few s per frame) */
const Paint: React.FC<{ shapes: Shape[]; at: P2; scale: number; uid: string; tone?: number; fog?: FolkFog | null; unitPx?: number; texture?: boolean }> = ({ shapes, at, scale: sc0, uid, tone = 1, fog = null, unitPx = 1, texture }) => {
  const ctx = useContext(TexCtx);
  const tex = texture ?? !ctx.shared;
  const scale = sc0 / FU;
  const S = applyFog(shapes, fog);
  const pxf = (scale * unitPx * 512) / 860;
  const blurU = PAINT.shadeBlur / (scale * unitPx);
  const shade = (c: string) => mixC(c, FOLK_SHADE.to, FOLK_SHADE.amt);
  const off = PAINT.shadeOff;
  const pad = off * 1.2 + blurU * 3 + 2;
  return (
    <g opacity={tone}>
      <defs>
        {tex ? folkTexDefs(uid, pxf, unitPx) : null}
        <filter id={`${uid}su`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU).toFixed(3)} />
        </filter>
        <filter id={`${uid}cu`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU * 2.2).toFixed(3)} />
        </filter>
      </defs>
      <g filter={tex ? `url(#${uid}tx)` : undefined}>
        <g transform={`translate(${n3(at[0])} ${n3(at[1])}) scale(${n3(scale)})`}>
          {S.map((s, i) => {
            const op = s.op ?? 1;
            if (op <= 0.002) return null;
            const clipId = s.clip ? `${uid}c${i}` : undefined;
            const wrap = (el: React.ReactNode) =>
              clipId ? (
                <g key={i}>
                  <clipPath id={clipId}>
                    <path d={s.clip} />
                  </clipPath>
                  <g clipPath={`url(#${clipId})`}>{el}</g>
                </g>
              ) : (
                <g key={i}>{el}</g>
              );
            if (s.det !== undefined)
              return wrap(
                <path
                  d={s.d}
                  fill="none"
                  stroke={s.keep ? s.fill : mixC(s.fill, "#1E1611", 0.32)}
                  strokeWidth={(s.det * Math.max(0.45, Math.min(1.3, pxf))).toFixed(2)}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={s.op ?? 0.55}
                />,
              );
            if (s.cast) return wrap(<path d={s.d} fill={shade(s.fill)} opacity={s.op ?? 0.8} filter={`url(#${uid}cu)`} />);
            const sh = s.sh ?? 1;
            if (sh <= 0) return wrap(<path d={s.d} fill={s.fill} opacity={op} />);
            const [bx0, by0, bx1, by1] = boxOf(s.d);
            const mx = bx0 - pad;
            const my = by0 - pad;
            const mw = bx1 - bx0 + 2 * pad;
            const mh = by1 - by0 + 2 * pad;
            const mid = `${uid}m${i}`;
            return wrap(
              <>
                <path d={s.d} fill={s.fill} opacity={op} />
                <mask id={mid} maskUnits="userSpaceOnUse" x={n3(mx)} y={n3(my)} width={n3(mw)} height={n3(mh)}>
                  <path d={s.d} fill="#fff" />
                  <path d={s.d} fill="#000" transform={`translate(${n3(-off * sh)} ${n3(-off * sh * 1.05)})`} filter={`url(#${uid}su)`} />
                </mask>
                <rect x={n3(mx)} y={n3(my)} width={n3(mw)} height={n3(mh)} mask={`url(#${mid})`} fill={shade(s.fill)} opacity={op} />
              </>,
            );
          })}
        </g>
      </g>
    </g>
  );
};

// ===================================================================================================================
// THE CAST MEMBER
// ===================================================================================================================
export type RomeFigureProps = {
  kind: RomeKind;
  pose: FigPose;
  at: P2;
  scale: number;
  /** unique per figure per frame */
  uid: string;
  variant?: number;
  /** (romeCast) dimmed inks still work as a fog toward the page; V3: pass `fog` */
  ink?: Ink;
  cloth?: Ink;
  tone?: number;
  /** (romeCast) accepted and ignored: the crescent shadow is always on */
  shade?: number;
  grip?: { L?: P2; R?: P2 };
  garb?: Garb;
  fetters?: boolean;
  chainLen?: number;
  collar?: boolean;
  apron?: boolean;
  pilleus?: boolean;
  stripe?: boolean;
  ring?: boolean;
  tool?: RomeTool;
  toolIn?: "near" | "far";
  toolSway?: number;
  held?: "none" | "cup";
  load?: RomeLoad;
  onlyArm?: "L" | "R";
  hideArm?: "L" | "R";
  // ---- new in romeFolk ----
  /** sink the figure into the medium: every colour mixed toward rgb by amount */
  fog?: FolkFog;
  /** 0..1 toward DEAD (cloth and hair), the skin greying */
  drain?: number;
  /** Slave: chalk-whitened bare feet */
  chalk?: boolean;
  /** the blank sale board (titulus) on a cord at the neck */
  titulus?: boolean;
  inks?: Partial<FolkInks>;
  unitPx?: number;
  texture?: boolean;
};
export const RomeFigure: React.FC<RomeFigureProps> = (p) => {
  const variant = p.variant ?? 0;
  const q = p.grip ? gripTo(p.kind, variant, p.pose, p.grip, p.at, p.scale) : p.pose;
  const b = buildRomeFolk(p.kind, variant, q, {
    garb: p.garb,
    fetters: p.fetters,
    chainLen: p.chainLen,
    collar: p.collar,
    chalk: p.chalk,
    titulus: p.titulus,
    apron: p.apron,
    pilleus: p.pilleus,
    stripe: p.stripe,
    ring: p.ring,
    tool: p.tool,
    toolIn: p.toolIn,
    toolSway: p.toolSway,
    held: p.held,
    load: p.load,
    onlyArm: p.onlyArm,
    hideArm: p.hideArm,
    inks: p.inks,
    drain: p.drain,
  });
  const fog = p.fog ?? legacyFog(p.ink, p.cloth);
  return <Paint shapes={b.shapes} at={p.at} scale={p.scale} uid={p.uid} tone={p.tone} fog={fog} unitPx={p.unitPx} texture={p.texture} />;
};
type CastProps = Omit<RomeFigureProps, "kind" | "uid"> & { uid?: string };
/** a slave: undyed tunic (garb), bare feet; fetters, collar, chalk; variant 3 = a woman */
export const Slave: React.FC<CastProps> = ({ uid = "slv", ...p }) => <RomeFigure kind="slave" uid={uid} {...p} />;
/** a free worker: coloured tunic, apron, pilleus, sandals; variant 3 = a woman shopkeeper */
export const Freeman: React.FC<CastProps> = ({ uid = "frm", ...p }) => <RomeFigure kind="freeman" uid={uid} {...p} />;
/** a rich Roman in his toga */
export const Dominus: React.FC<CastProps> = ({ uid = "dom", ...p }) => <RomeFigure kind="dominus" uid={uid} {...p} />;
/** the overseer: umber tunic, short cloak, the vine rod */
export const Overseer: React.FC<CastProps> = ({ uid = "ovs", ...p }) => <RomeFigure kind="overseer" uid={uid} {...p} />;

/** romeCast's anchors (the same rig: grips, hands, feet, tool head, load) with headTop following the folk head
 *  (the top of the hair, or of the pilleus) */
export const romeAnchors = (
  kind: RomeKind,
  pose: FigPose,
  at: P2,
  scale: number,
  opts: { variant?: number; grip?: { L?: P2; R?: P2 }; tool?: RomeTool; toolIn?: "near" | "far" } = {},
) => {
  const a = castAnchors(kind, pose, at, scale, opts);
  const variant = opts.variant ?? 0;
  const look = folkLookOf(kind, variant);
  const q = opts.grip ? gripTo(kind, variant, pose, opts.grip, at, scale) : pose;
  const r = figureRig(romeSpec(kind, variant), q);
  const fem = look.hair === "bun";
  const HR = HEAD_R * look.head * (fem ? 0.96 : 1);
  const pil = kind === "freeman" && !fem;
  const hc = add(r.headC, rot([0, -HEAD_UP], r.headAngle));
  const top = add(hc, rot([0, (pil ? -1.4 : -1.07) * HR], r.headAngle));
  const w = (v: P2): P2 => [at[0] + v[0] * scale, at[1] + v[1] * scale];
  // the tool's head from the folk tool geometry (continuous where romeCast's flipped; identical elsewhere)
  const tool = opts.tool ?? (kind === "overseer" ? "rod" : "none");
  const tg = toolGeomOf(r, tool, r.s >= 0 ? 1 : -1, opts.toolIn ?? "near", romeSpec(kind, variant).limb, q);
  return { ...a, headC: w(hc), headTop: w(top), headR: HR * scale, toolHead: tg ? w(tg.head) : null };
};

/** a soft contact shadow under a figure or prop, in the air's shadow colour (flat sheets; a perspective cut uses
 *  pandemicAir's AirContactShadow at the feet) */
export const RomeContactShadow: React.FC<{ at: P2; scale: number; w?: number; amount?: number; uid: string; color?: string }> = ({ at, scale, w = 62, amount = 1, uid, color = AIR_SHADOW }) => (
  <g>
    <defs>
      <radialGradient id={`${uid}cs`}>
        <stop offset="0" stopColor={color} stopOpacity={0.7 * amount} />
        <stop offset="0.55" stopColor={color} stopOpacity={0.4 * amount} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={at[0] + 8 * scale} cy={at[1] + 1 * scale} rx={w * scale} ry={w * 0.16 * scale} fill={`url(#${uid}cs)`} />
  </g>
);

// ===================================================================================================================
// PROPS (romeCast's geometry; rig units, `at` = the floor point, scale = px per unit like a man's)
// ===================================================================================================================
type PropBase = { at: P2; scale: number; ink?: Ink; uid: string; tone?: number; fog?: FolkFog; unitPx?: number; texture?: boolean };
const propFog = (p: PropBase) => p.fog ?? legacyFog(p.ink);
const PropPaint: React.FC<{ p: PropBase; shapes: Shape[] }> = ({ p, shapes }) => <Paint shapes={shapes} at={p.at} scale={p.scale} uid={p.uid} tone={p.tone} fog={propFog(p)} unitPx={p.unitPx} texture={p.texture} />;
const rotT = (deg: number, off: P2 = [0, 0]) => (v: P2): P2 => add(off, rot(v, deg));

/** a transport amphora standing on its toe, ~132 units tall; angle tilts it (deg) */
export const Amphora: React.FC<PropBase & { angle?: number }> = (p) => {
  const T = (v: P2): P2 => rot(add([0, -66], rot(v, -90)), p.angle ?? 0);
  return <PropPaint p={p} shapes={loadArt("amphora", T, false)} />;
};
/** a full sack standing on the floor, ~78 units tall */
export const Sack: React.FC<PropBase> = (p) => <PropPaint p={p} shapes={loadArt("sack", (v) => add([0, -34], v), false)} />;
/** a wicker basket on the floor, ~56 units tall; `full` heaps grain in it (0..1) */
export const Basket: React.FC<PropBase & { full?: number }> = (p) => {
  const full = p.full ?? 0.7;
  const T = (v: P2): P2 => add([0, -26], v);
  const heap: Shape[] = full > 0 ? [{ d: closedD([T([-27, -26]), T([-14, -26 - 16 * full]), T([0, -26 - 22 * full]), T([14, -26 - 16 * full]), T([27, -26])], 0.9), fill: "#CDB98E" }] : [];
  return <PropPaint p={p} shapes={[...heap, ...loadArt("basket", T, false)]} />;
};
/** an iron chain between two world points, sagging (len world px, or slack x the distance), lying on groundY */
export const Chain: React.FC<{ a: P2; b: P2; len?: number; slack?: number; groundY?: number; link?: number; ink?: Ink; uid: string; tone?: number; fog?: FolkFog; unitPx?: number }> = ({ a, b, len, slack = 1.15, groundY = Infinity, link = 6, ink, uid, tone = 1, fog, unitPx }) => {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const L0 = len ?? d * slack;
  const h = d >= L0 ? 0 : Math.sqrt((3 * d * Math.max(0, L0 - d)) / 8 + ((L0 - d) / 2) ** 2 * Math.exp(-d / 8));
  const n = Math.max(6, Math.ceil(L0 / 3));
  const pts: P2[] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    pts.push([mix(a[0], b[0], u), Math.min(groundY, mix(a[1], b[1], u) + 4 * h * u * (1 - u))]);
  }
  const count = len !== undefined ? Math.max(2, Math.round(len / link)) : Math.max(2, Math.round(L0 / link));
  // painted about `a` (the paint's mask region is local)
  const shapes = chainLinks(pts.map((q): P2 => [q[0] - a[0], q[1] - a[1]]), count, link).map((s) => ({ ...s, fill: "#5A6266" }));
  return <Paint shapes={shapes} at={a} scale={1} uid={uid} tone={tone} fog={fog ?? legacyFog(ink)} unitPx={unitPx} />;
};

/** a heap of coins: amount 0..1 grows it from the base by adding coins on top (the next one dropping in); ~220 x 100.
 *  Default ORANGE (the clip's wealth); pass ink={CREAM} for the cream (extracted) heap. */
const COIN_N = 260;
const hashN = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const heapW = (amt: number) => 104 * Math.min(1, Math.sqrt(c01(amt) * 5)) + 6;
const heapH = (amt: number) => 100 * Math.pow(c01(amt), 1.25);
const COINS = Array.from({ length: COIN_N }, (_, i) => {
  const am = i / COIN_N;
  const W = heapW(am);
  const rho = W * Math.sqrt(hashN(i, 902)) * 0.96;
  const a = hashN(i, 901) * Math.PI * 2;
  const x = Math.cos(a) * rho;
  const z = Math.sin(a) * rho * 0.3;
  const y = -heapH(am) * Math.pow(Math.max(0, 1 - (x / W) ** 2), 0.7) - 2;
  return { x, z, y, t: i };
});
export const CoinHeap: React.FC<PropBase & { amount: number }> = (p) => {
  const cream = p.ink === CREAM;
  const top = cream ? "#EDE3CC" : "#FFB000";
  const edge = cream ? "#C9BA98" : "#D98A0C";
  const n = COIN_N * c01(p.amount);
  const whole = Math.floor(n);
  const fr = n - whole;
  const shown = COINS.slice(0, Math.min(COIN_N, whole + (fr > 0.02 ? 1 : 0)));
  const Wb = heapW(p.amount);
  const H = heapH(p.amount);
  const shapes: Shape[] = [];
  if (shown.length > 6) {
    const dome: P2[] = [];
    for (let i = 0; i <= 20; i++) {
      const u = -1 + (2 * i) / 20;
      dome.push([u * Wb, -H * Math.pow(Math.max(0, 1 - u * u), 0.7) - 2]);
    }
    for (let i = 1; i < 10; i++) {
      const u = 1 - (2 * i) / 10;
      dome.push([u * Wb, Wb * 0.3 * Math.sqrt(Math.max(0, 1 - u * u)) - 2]);
    }
    shapes.push({ d: closedD(dome, 0.9), fill: edge });
  }
  shown.forEach((cn, i) => {
    const drop = i === whole ? (1 - fr * fr * (3 - 2 * fr)) * 60 : 0;
    const cy = cn.y + cn.z - drop;
    const tilt = (hashN(cn.t, 903) - 0.5) * 34 + cn.x * 0.12;
    shapes.push({ d: ellD([cn.x, cy + 2.2], 9.5, 3.6, tilt), fill: edge, sh: 0 });
    shapes.push({ d: ellD([cn.x, cy], 9.5, 3.6, tilt), fill: top, sh: 0 });
  });
  return <PropPaint p={p} shapes={shapes} />;
};

/** the lectus (dining couch): turned legs, a frame, a mattress with a cushion, the curved fulcrum at the head end;
 *  dir 1 = the head end at screen LEFT (a diner reclines facing right). Units: COUCH. */
export const Couch: React.FC<PropBase & { dir?: 1 | -1 }> = (p) => {
  const dir = p.dir ?? 1;
  const X = (v: P2): P2 => [v[0] * dir, v[1]];
  const hl = COUCH.len / 2;
  const sk = 22;
  const dp = COUCH.depth * 0.3;
  const wood = "#6E5440";
  const woodBack = "#584334";
  const S: Shape[] = [];
  const leg = (x: number, back: boolean) => {
    const xx = x + (back ? sk * 0.8 : 0);
    const y0 = COUCH.frameY + (back ? -8 : 0);
    const y1 = back ? -10 : 0;
    S.push({ d: tubeD([X([xx, y0]), X([xx, mix(y0, y1, 0.25)]), X([xx, mix(y0, y1, 0.45)]), X([xx, mix(y0, y1, 0.7)]), X([xx, y1])], [14, 19, 11, 16, 12]), fill: back ? woodBack : wood });
  };
  [-hl + 24, hl - 24].forEach((x) => leg(x, true));
  S.push({ d: closedD([X([-hl - 4, COUCH.frameY - 2]), X([hl + 4, COUCH.frameY - 2]), X([hl + 4, COUCH.frameY + 12]), X([-hl - 4, COUCH.frameY + 12])], 0.3), fill: wood });
  [-hl + 24, hl - 24].forEach((x) => leg(x, false));
  // the fulcrum (head-rest) at the head end
  S.push({ d: closedD([X([-hl + 2, COUCH.seatY + 4]), X([-hl - 6, COUCH.seatY - 30]), X([-hl + 6, COUCH.seatY - 56]), X([-hl + 34, COUCH.seatY - 62]), X([-hl + 40, COUCH.seatY - 52]), X([-hl + 18, COUCH.seatY - 44]), X([-hl + 16, COUCH.seatY - 20]), X([-hl + 18, COUCH.seatY + 4])], 0.7), fill: wood });
  // the mattress: top (lit) and front, two stripes; the cushion
  S.push({ d: closedD([X([-hl, COUCH.seatY]), X([hl, COUCH.seatY]), X([hl + sk, COUCH.seatY - dp]), X([-hl + sk, COUCH.seatY - dp])], 0.25), fill: "#E8DFCB" });
  const FRONT = closedD([X([-hl, COUCH.seatY]), X([hl, COUCH.seatY]), X([hl + 5, (COUCH.seatY + COUCH.frameY) / 2]), X([hl, COUCH.frameY + 2]), X([-hl, COUCH.frameY + 2]), X([-hl - 5, (COUCH.seatY + COUCH.frameY) / 2])], 0.35);
  S.push({ d: FRONT, fill: "#D4C6A6" });
  S.push({ d: [0.38, 0.66].map((u) => lineD([X([-hl + 2, mix(COUCH.seatY, COUCH.frameY, u)]), X([hl - 2, mix(COUCH.seatY, COUCH.frameY, u)])])).join(" "), fill: "#8C4E42", det: 2.4, keep: true, op: 0.7 });
  S.push({ d: closedD([X([-hl + 16, COUCH.seatY - 2]), X([-hl + 12, COUCH.seatY - 30]), X([-hl + 56, COUCH.seatY - 40]), X([-hl + 96, COUCH.seatY - 22]), X([-hl + 92, COUCH.seatY - 4]), X([-hl + 70, COUCH.seatY + 2])], 0.8), fill: "#9A6555" });
  return <PropPaint p={p} shapes={S} />;
};
/** a low stool (the potter's seat), ~56 units tall */
export const Stool: React.FC<PropBase> = (p) => {
  const S: Shape[] = [];
  for (const x of [-22, 22]) S.push({ d: tubeD([[x * 0.8, -48], [x, 0]], [9, 8]), fill: x > 0 ? "#584334" : "#6E5440" });
  S.push({ d: closedD([[-32, -56], [32, -56], [36, -48], [-28, -48]], 0.3), fill: "#5E4836" });
  S.push({ d: closedD([[-32, -56], [32, -56], [28, -62], [-28, -62]], 0.3), fill: "#7D6250" });
  return <PropPaint p={p} shapes={S} />;
};
/** the potter's wheel: kick wheel, shaft, wheel head, the clay lump (POTTER.clayTop); turn = phase; dir mirrors */
export const PotterWheel: React.FC<PropBase & { turn?: number; clay?: boolean; dir?: 1 | -1 }> = (p) => {
  const dir = p.dir ?? 1;
  const turn = p.turn ?? 0;
  const X = (v: P2): P2 => [v[0] * dir, v[1]];
  const S: Shape[] = [];
  const wood = "#6E5440";
  const disc = (cy: number, rx: number, th: number, fill: string) => {
    const ry = rx * 0.3;
    const side: P2[] = [];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI;
      side.push(X([rx * Math.cos(a), cy + th + ry * Math.sin(a)]));
    }
    S.push({ d: closedD([X([rx, cy]), ...side, X([-rx, cy])], 0.6), fill: mixC(fill, "#2C2420", 0.25) });
    S.push({ d: ellD(X([0, cy]), rx, ry), fill });
    const marks = Array.from({ length: 6 }, (_, i) => (i / 6 + turn) * Math.PI * 2).filter((a) => Math.sin(a) > 0.1);
    if (marks.length) S.push({ d: marks.map((a) => lineD([X([rx * Math.cos(a), cy + ry * Math.sin(a)]), X([rx * Math.cos(a), cy + ry * Math.sin(a) + th])])).join(" "), fill: wood, det: 1.6, op: 0.6 });
  };
  disc(-16, 60, 12, wood);
  S.push({ d: tubeD([X([0, -16]), X([0, POTTER.headY])], [11, 11]), fill: wood });
  disc(POTTER.headY - 6, 38, 7, "#7A604C");
  if (p.clay ?? true) {
    const cT = POTTER.clayTop;
    const cB = POTTER.headY;
    S.push({ d: closedD([X([-22, cB - 7]), X([-20, cB - 18]), X([-12, cT + 4]), X([0, cT - 2]), X([12, cT + 4]), X([20, cB - 18]), X([22, cB - 7])], 0.8), fill: "#9C6B52" });
    const sp = Array.from({ length: 3 }, (_, i) => { const v = i / 3 + turn * 1.5; return v - Math.floor(v); });
    S.push({ d: sp.map((u) => { const y = mix(cB - 10, cT + 4, u); const w = mix(19, 11, u); return lineD([X([-w, y]), X([0, y + 2.5]), X([w, y])]); }).join(" "), fill: "#9C6B52", det: 1.4, op: 0.45 });
  }
  return <PropPaint p={p} shapes={S} />;
};
/** the rotary quern (a hand mill on the ground): lower stone, the runner, the upright handle at quernHandle(...) */
export const RotaryQuern: React.FC<PropBase & { turn?: number; dir?: 1 | -1 }> = (p) => {
  const dir = p.dir ?? 1;
  const turn = p.turn ?? 0;
  const X = (v: P2): P2 => [v[0] * dir, v[1]];
  const { R, r: rr, h0, h1, tilt } = QUERN;
  const S: Shape[] = [];
  const cyl = (y0: number, y1: number, rad: number, fill: string, top: boolean) => {
    const ry = rad * tilt;
    const side: P2[] = [];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI;
      side.push(X([rad * Math.cos(a), y1 + ry * Math.sin(a)]));
    }
    S.push({ d: closedD([X([rad, y0]), ...side, X([-rad, y0])], 0.6), fill });
    if (top) S.push({ d: ellD(X([0, y0]), rad, ry), fill: mixC(fill, "#E8DCC4", 0.25) });
  };
  cyl(-h0, 0, R, "#7C6E5E", false);
  S.push({ d: lineD([X([-R - 3, -h0 + 4]), X([0, -h0 + 10]), X([R + 3, -h0 + 4])]), fill: "#E8DCC4", det: 2.6, keep: true, op: 0.55 });
  const yTop = -(h0 + h1);
  cyl(yTop, -h0, rr, "#938270", true);
  S.push({ d: ellD(X([0, yTop]), 6.5, 6.5 * tilt), fill: "#3A3029", sh: 0 });
  const a = turn * Math.PI * 2;
  const hx = QUERN.handleR * Math.cos(a);
  const hyB = yTop + QUERN.handleR * tilt * Math.sin(a);
  S.push({ d: tubeD([X([hx, hyB + 2]), X([hx, hyB - QUERN.peg])], [7.5, 6.5]), fill: "#6E5440" });
  return <PropPaint p={p} shapes={S} />;
};
const toolProp = (kind: "hammer" | "pick" | "rod") => {
  const C: React.FC<PropBase & { angle?: number }> = (p) => {
    const T = rotT(p.angle ?? 0);
    const S: Shape[] = [];
    if (kind === "rod") S.push({ d: tubeD([T([-14, 0]), T([50, 0]), T([112, 0])], [7.2, 6, 4.6]), fill: "#6E5440", sh: 0.5 });
    else {
      const L0 = kind === "hammer" ? 118 : 116;
      S.push({ d: tubeD([T([-10, 0]), T([L0 * 0.5, 0]), T([L0 + 6, 0])], [7.4, 7, 7.6]), fill: "#6E5440", sh: 0.5 });
      if (kind === "hammer") S.push({ d: closedD([T([L0 - 12, -23]), T([L0 + 14, -25]), T([L0 + 15, 24]), T([L0 - 12, 23])], 0.35), fill: "#5A6266" });
      else S.push({ d: closedD([T([L0 - 4, -6]), T([L0 + 6, -30]), T([L0 + 4, -58]), T([L0 + 10, -56]), T([L0 + 16, -30]), T([L0 + 11, -4]), T([L0 + 11, 6]), T([L0 + 17, 28]), T([L0 + 14, 46]), T([L0 + 4, 44]), T([L0 + 7, 26]), T([L0 - 4, 6])], 0.5), fill: "#5A6266" });
    }
    return <PropPaint p={p} shapes={S} />;
  };
  return C;
};
/** free tools (lying or leaning): `at` = the handle's end (world), angle deg (0 = the shaft pointing screen right) */
export const Hammer = toolProp("hammer");
export const Pick = toolProp("pick");
export const Rod = toolProp("rod");
/** the props' material colours (for matching scenery) */
export const FOLK_MATERIALS = { amphora: AMPHORA, sack: SACK, wicker: WICKER, wood: "#6E5440", iron: "#5A6266", clay: "#9C6B52", stone: "#938270", mattress: "#E8DFCB" };
