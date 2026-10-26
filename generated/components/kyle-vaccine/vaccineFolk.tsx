// ---------------------------------------------------------------------------
// vaccineFolk — THE CAST of the Kyle Harper clip "Why the first vaccine took so long to discover" (kyle-vaccine):
// Georgian England (Edward Jenner 1796, the children, the inoculators, the parents) and Louis Pasteur (1880s), in the
// picture-book GOUACHE hand of the approved casts (romeFolk, pandemicFolk, greekFolk, covidFolk): flat matte shapes,
// no outline, ONE soft crescent shadow per part from the upper-left light, pandemicFolkPaint's gouache filter (grain,
// dry-brush mottling, hand-wobbly edges), a small round head on a pear body (~4.4 heads), dot eyes, a small nose, a
// blush dot, mitten hands, small feet; muted earthy local colours. People are NEVER orange: orange (#FFB000 /
// #D98A0C) is THE VACCINE (the clip's ORANGE RULE); POX (#8E4552, deep #6A2E3A) is smallpox.
// Built on the texcoco rig with romeFolk's skeleton and proportions (a man ~312 units = 1.75 m), so it stands beside
// the Rome, Greek, pandemics and covid figures as one hand. Geometry: vaccineFolkBody.ts. Contract for cut builders:
// <notes>/VACCINE_FOLK_READY.md.
//
// UNITS: rig units, feet at (0, 0), up is -y, a man ~312 to the top of the skull (scaleForPx(px) = px / 312);
// `at` = the feet in world px, `scale` = world px per unit (a depth camera: const { at, scale } = A.P.at(X, Z)).
// Draw inside the cut's svg (WorldSvg). unitPx = screen px per svg unit (WorldSvg: cam.k).
//
// KINDS (variant v; v0 is the hero look where there is one):
//   Jenner      Dr Edward Jenner, 1796: dark slate-blue TAILCOAT (the tails hang behind the legs), cream waistcoat,
//               white stock and jabot, buff knee breeches, pale stockings, buckled shoes; his own hair powdered
//               grey-white with side rolls and a short queue tied with a dark ribbon; middle-aged, clean-shaven, kind
//               neutral brows. One look (the viewer must know him again across cuts 53-68).
//   Child       Georgian children (~0.63-0.7 of a man, bigger heads): v0 boy (James Phipps: cream shirt, umber
//               waistcoat, breeches, stockings) · v1 girl (mob cap, oatmeal dress, bib apron) · v2 boy (smock) ·
//               v3 girl (bonnet, dusty-teal dress) · v4 boy (red-brown waistcoat, olive skin, curls) · v5 girl
//               (red-brown dress, plait, apron) · v6 boy (short slate jacket, flaxen) · v7 girl (oatmeal dress,
//               khaki shawl, mob cap) · v8 boy (khaki smock, deep skin) · v9 girl (slate-blue dress, umber bonnet).
//               v1, v4, v7, v8 are the younger build (~5-6). Ten distinct children for a row (cut 41).
//   Inoculator  v0 an older woman, the folk practitioner (head-wrap, red-brown shawl, umber-grey dress, apron;
//               the LANCET in her near hand) · v1 a Georgian surgeon-inoculator (brown coat, oatmeal waistcoat, white
//               stock, his own brown hair tied back; the lancet, a leather case in the other hand).
//   Parent      v0 mother (mob cap, khaki shawl, slate skirt, apron) · v1 father / labourer (smock, breeches, boots,
//               stubble) · v2 townswoman (bonnet, dusty-teal cape, brown dress) · v3 townsman (brown coat, buff
//               breeches, dark tricorne).
//   Pasteur     Louis Pasteur, 1880s: a deep brown-charcoal frock coat (lit side), dark waistcoat, white collar, dark
//               cravat bow, grey-brown trousers; receding grey-brown hair, a short grey-brown beard and moustache as
//               a LIGHTER textured shape (never a dark blob), serious kind brows.
//   <VaccineFigure kind variant pose at scale uid ... />  or  <Jenner .../> <Child .../> <Inoculator .../>
//   <Parent .../> <Pasteur .../>. Props:
//     pose: VPose           a texcoco FigPose + the cast's fields (look, open, worry, squeeze, sit/seatH, handTo,
//                           hunch, bare, bookTurn, reach)
//     grip?: { L?, R? }     world points the hand grips land on (a parent's hand on a child's: see handMeet)
//     hold?: { L?, R? }     what the hands hold: "lancet" | "flask" | "book" | "candle" | "case" | "none"
//                           (L = the rig's armL = his own right = the NEAR hand facing right)
//     holdNear?, holdFar?   the same by facing (resolved from the pose's yaw: use L / R for a figure that turns)
//     lancetTo? / flaskTo? / bookTo? (= reachTo)   a WORLD point the reaching hand's prop key lands on, in the poses
//                           inoculate (the lancet's blade TIP), placeFlask (the flask's BASE), shelveBook (the book's
//                           FOOT: the middle of its bottom edge)
//     charge?: { kind: "pox" | "vaccine", amt }   a tiny speck on the lancet's tip (plum matter / orange lymph)
//     pox?: 0..1            SMALLPOX: raised plum domes (POX, each a tiny dome with a lighter top) over the face, neck,
//                           hands and bare arms in a stable seeded pattern (they never move or swap; each appears at its
//                           own threshold, so ramp pox to spread them); the skin pales, droopy lids, worried brows
//                           (never a frown), the shoulders sink a little. Never orange, never glowing, never gore.
//     drain?: 0..1          toward DEAD #8A7B62 (cloth and hair), the skin greying; with `fog` / `tone` the figure sinks
//                           into the air (a death; never a body on the ground)
//     glowArm?: 0..1        the vaccinated arm's small soft orange glow on the upper arm (glowSide "L" | "R"; default
//                           the near arm); pair with a sleeve pushed up (pose.bare / POSES.sleeveUp)
//     flaskFill?, flaskFillC?   the flask's fill 0..1 (default colour the vaccine orange, glowing)
//     sick?: 0..1 (covidFolk's: pale, droopy, worried, a sweat drop), frame?, fog?: { rgb, amount } (A.folkFog(Z)),
//     inks?, tone?, unitPx?, texture? (false = no per-figure gouache filter)
//   POSES (pure; dir 1 = facing screen right; L = the near arm facing right):
//     front() stand(dir) turnTo(yaw) back() walk(dir, phase, amount) turnHead(q, yaw, nod) point(dir, t)
//     gesture(dir, frame, amount) chat(base, frame, toward) nod(base, t) wave(dir, frame, amount) sit(dir, seatH)
//     holdHand(base, side, t, up?)  inoculate(dir, phase)  examineFlask(dir, phase)  placeFlask(dir, phase)
//     holdBook(dir, read?)  shelveBook(dir, phase)  sleeveUp(dir, t)  flinch(base, t)  wilt(dir, t, seatH)
//     slump(dir, frame, seatH)  + breathe(q, frame), walkPose, lerpPose, mirrorPose, standAt, sitDown
//     walk: phase = frames / WALK_CYCLE (30); advance `at` by walkAdvance(scale * strideK(kind, v)) px per frame.
//     sit: the hips on a seat seatH units high (SEAT.h = 82 = a 46 cm bench); `at` UNDER THE HIPS; a child on a seat
//       above dangleSeat(kind, v) dangles its feet. wilt: keep the feet planted by moving `at` back wiltBack(t) units.
//   ANCHORS: vaccineAnchors(kind, pose, at, scale, { variant, grip, hold, reachTo }) -> world px: headC headR headTop
//     mouth eyes chest shoulderL/R elbowL/R wristL/R handL/R mittenL/R armSpotL/R (the vaccination spot on the upper
//     arm) keyL/R (each hand's prop key: the lancet TIP, the flask base, the book foot) hip kneeL/R ankleL/R toeL/R
//     heelL/R hemL/R, plus `placed` (a set-down prop's key), `pose` (the solved pose) and `reachShort` (world px the
//     reach target was pulled in by: > 0 means the point is beyond the arm's reach, stand the figure closer).
//   PROPS on their own (same paint; `at` as said): Lancet {at = tip, angle}, Flask {at = base, fill?, fillC?},
//     Book {at = foot, turn?, tilt?, color?}, Candle {at = dish}, Bench {at = the front edge's middle on the floor, seatH?, w?}.
//   <VaccineContactShadow at scale w? amount? uid /> for flat sheets; in a perspective use the kit's AirShadow.
// Probes: vaccineFolkProbe.tsx (src/Root.VaccineFolk.tsx, src/entry.VaccineFolk.ts).
// ---------------------------------------------------------------------------
import React, { createContext, useContext } from "react";
import { PAINT, folkTexDefs, mixC } from "../kyle-pandemics/pandemicFolkPaint";
import {
  BOOK,
  FU,
  LANCET,
  STEEL,
  bookShapes,
  buildVaccineFolk,
  candleShapes,
  flaskShapes,
  closedD,
  ellD,
  lineD,
  tubeD,
  vaccineGripTo,
  vaccineKeys,
  vaccineRig,
  vaccineSpec,
  defaultHold,
  type BuildOpts,
  type CShape,
  type Charge,
  type HandProp,
  type P2,
  type VPose,
  type VaccineAnchors,
  type VaccineInks,
  type VaccineKind,
} from "./vaccineFolkBody";

export {
  BOOK,
  FLASK,
  FU,
  HAIR,
  HEAD_R,
  LANCET,
  MAN,
  POSES,
  POX,
  POX_DEEP,
  SEAT,
  SKIN,
  VACCINE_KINDS,
  VACCINE_VARIANTS,
  WALK_CYCLE,
  breathe,
  buildVaccineFolk,
  dangleSeat,
  defaultHold,
  isFemale,
  lerpPose,
  lookOf,
  mirrorPose,
  rigPose,
  seatFootX,
  sitBack,
  sitDown,
  standAt,
  strideK,
  vaccineGripTo,
  vaccineKeys,
  vaccineRig,
  vaccineSpec,
  walkAdvance,
  walkPose,
  wiltBack,
} from "./vaccineFolkBody";
export type { BuildOpts, CShape, Charge, HairKind, HandProp, HandTarget, HandTo, P2, Reach, VPose, VaccineAnchors, VaccineInks, VaccineKind } from "./vaccineFolkBody";
export { idle } from "../kits/maps/texcocoShared";

/** the clip's sequence rate */
export const FPS = 30000 / 1001;
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const DEAD = "#8A7B62";
/** palette A's shadow colour (contact shadows in the air) */
export const AIR_SHADOW = "#22180F";
/** a man's height in rig units (soles to the top of the skull) */
export const MAN_UNITS = 312;
export const scaleForPx = (px: number) => px / MAN_UNITS;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const add = (a: P2, b: P2): P2 => [a[0] + b[0], a[1] + b[1]];
const sub = (a: P2, b: P2): P2 => [a[0] - b[0], a[1] - b[1]];
const mul = (a: P2, s: number): P2 => [a[0] * s, a[1] * s];
const mix2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

// ===================================================================================================================
// FOG
// ===================================================================================================================
export type FolkFog = { rgb: [number, number, number] | string; amount: number };
const rgbHex = (c: [number, number, number]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const fogHexOf = (f: FolkFog) => (typeof f.rgb === "string" ? f.rgb : rgbHex(f.rgb));
const applyFog = (shapes: CShape[], fog: FolkFog | null | undefined): CShape[] => {
  if (!fog || fog.amount <= 0.001) return shapes;
  const to = fogHexOf(fog);
  const t = c01(fog.amount);
  // orange is the one glowing material: it takes half the fog
  return shapes.map((s) => {
    const k = s.glow ? 0.5 * t : t;
    return { ...s, fill: mixC(s.fill, to, k), grad: s.grad ? { ...s.grad, stops: s.grad.stops.map(([o, c, a]) => [o, mixC(c, to, k), a] as [number, string, number]) } : undefined };
  });
};

// ===================================================================================================================
// THE PAINT: covidFolk's (romeFolk's Paint shape for shape, each crescent's mask on the shape's own box) plus soft
// blurred glows (the vaccine's bloom)
// ===================================================================================================================
/** the crescent shadow (romeFolk's FOLK_SHADE) */
export const FOLK_SHADE = { amt: 0.4, to: "#2C3433" };
const TexCtx = createContext<{ shared: boolean }>({ shared: false });
/** one gouache texture filter over a tight cluster of figures */
export const VaccineFolkLayer: React.FC<{ uid: string; px?: number; unitPx?: number; children?: React.ReactNode }> = ({ uid, px = 0.4, unitPx = 1, children }) => (
  <TexCtx.Provider value={{ shared: true }}>
    <defs>{folkTexDefs(uid, px, unitPx)}</defs>
    <g filter={`url(#${uid}tx)`}>{children}</g>
  </TexCtx.Provider>
);
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
export const VaccinePaint: React.FC<{ shapes: CShape[]; at: P2; scale: number; uid: string; tone?: number; fog?: FolkFog | null; unitPx?: number; texture?: boolean }> = ({ shapes, at, scale: sc0, uid, tone = 1, fog = null, unitPx = 1, texture }) => {
  const ctx = useContext(TexCtx);
  const tex = texture ?? !ctx.shared;
  const scale = sc0 / FU;
  const S = applyFog(shapes, fog);
  const pxf = (scale * unitPx * 512) / 860;
  const blurU = PAINT.shadeBlur / (scale * unitPx);
  const shade = (c: string) => mixC(c, FOLK_SHADE.to, FOLK_SHADE.amt);
  const off = PAINT.shadeOff;
  const pad = off * 1.2 + blurU * 3 + 2;
  const blurs = Array.from(new Set(S.filter((s) => s.blur !== undefined).map((s) => Math.round((s.blur ?? 0) * 10) / 10)));
  const blurId = (b: number) => `${uid}gb${blurs.indexOf(Math.round(b * 10) / 10)}`;
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
        {blurs.map((b, i) => (
          <filter key={i} id={`${uid}gb${i}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={Math.max(0.01, b * FU).toFixed(3)} />
          </filter>
        ))}
      </defs>
      <g filter={tex ? `url(#${uid}tx)` : undefined}>
        <g transform={`translate(${n3(at[0])} ${n3(at[1])}) scale(${n3(scale)})`}>
          {S.map((s, i) => {
            const op = s.op ?? 1;
            if (op <= 0.002 || !s.d) return null;
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
            if (s.glow || s.blur !== undefined) {
              const gid = s.grad ? `${uid}rg${i}` : undefined;
              return wrap(
                <>
                  {s.grad ? (
                    <defs>
                      <radialGradient id={gid} cx={s.grad.cx ?? 0.5} cy={s.grad.cy ?? 0.5} r={s.grad.r ?? 0.5}>
                        {s.grad.stops.map(([o, c, a], j) => (
                          <stop key={j} offset={o} stopColor={c} stopOpacity={a} />
                        ))}
                      </radialGradient>
                    </defs>
                  ) : null}
                  <path d={s.d} fill={gid ? `url(#${gid})` : s.fill} opacity={op} filter={s.blur !== undefined && s.blur > 0.05 ? `url(#${blurId(s.blur)})` : undefined} style={s.blend === "screen" ? { mixBlendMode: "screen" } : undefined} />
                </>,
              );
            }
            if (s.det !== undefined)
              return wrap(
                <path d={s.d} fill="none" stroke={s.keep ? s.fill : mixC(s.fill, "#1E1611", 0.32)} strokeWidth={(s.det * Math.max(0.45, Math.min(1.3, pxf))).toFixed(2)} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" opacity={s.op ?? 0.55} />,
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
// SOLVING THE HANDS: grips, the reach (a prop's key point onto a world point), the release
// ===================================================================================================================
export type SolveOpts = { variant?: number; grip?: { L?: P2; R?: P2 }; hold?: { L?: HandProp; R?: HandProp }; reachTo?: P2 };
export type Solved = { q: VPose; placed?: { prop: HandProp; key: P2; turn?: number }; hold: { L: HandProp; R: HandProp }; /** world px the reach target was pulled in by (beyond the arm's reach: stand the figure closer) */ short?: number };
/** the pose a figure actually takes: explicit grips, then the reaching hand's prop key on `reachTo` (or the pose's own
 *  reach plus its offset), then a release (the prop stays put, the hand lifts off and goes back to its rest) */
export const solveVaccinePose = (kind: VaccineKind, pose: VPose, at: P2, scale: number, o: SolveOpts = {}): Solved => {
  const v = o.variant ?? 0;
  const dh = defaultHold(kind, v);
  const hold = { L: o.hold?.L ?? dh.L, R: o.hold?.R ?? dh.R };
  let q = pose;
  if (o.grip && (o.grip.L || o.grip.R)) q = vaccineGripTo(kind, v, q, o.grip, at, scale);
  const R = pose.reach;
  if (!R || (R.amt <= 0.0005 && (R.release ?? 0) <= 0.0005 && !(R.off && (R.off[0] || R.off[1])))) return { q, hold };
  const side = R.arm;
  const armKey = side === "L" ? "armL" : "armR";
  const W = (p: P2): P2 => [at[0] + p[0] * scale, at[1] + p[1] * scale];
  const keyOf = (qq: VPose) => {
    const kk = vaccineKeys(kind, v, qq, hold);
    return { key: W(kk[side]), grip: W(side === "L" ? kk.gripL : kk.gripR) };
  };
  const solveTo = (qq: VPose, T: P2): VPose => {
    let x = qq;
    for (let it = 0; it < 5; it++) {
      const { key, grip } = keyOf(x);
      const g2 = add(grip, sub(T, key));
      x = vaccineGripTo(kind, v, x, { [side]: g2 }, at, scale);
    }
    return x;
  };
  const off = mul(R.off ?? [0, 0], scale);
  const kq = keyOf(q);
  const k0 = kq.key;
  let T = o.reachTo ? mix2(k0, add(o.reachTo, off), c01(R.amt)) : add(k0, mul(off, c01(R.amt)));
  // a point beyond the arm's reach: the hand eases to the end of its reach instead of stalling (no kink)
  const sp = vaccineSpec(kind, v);
  const S = W(vaccineRig(kind, v, q).r[armKey].S);
  const Rmax = (sp.arm[0] + sp.arm[1] + 11 * sp.limb) * scale + Math.hypot(k0[0] - kq.grip[0], k0[1] - kq.grip[1]);
  const dv = sub(T, S);
  const dist = Math.hypot(dv[0], dv[1]);
  const a0 = 0.93 * Rmax;
  let short = 0;
  if (dist > a0) {
    const b = 0.07 * Rmax;
    const d2 = a0 + b * (1 - Math.exp(-(dist - a0) / b));
    T = add(S, mul(dv, d2 / dist));
    short = dist - d2;
  }
  q = solveTo(q, T);
  const rel = c01(R.release ?? 0);
  if (rel <= 0.0005) return { q, hold, short };
  // the release: the prop stays where it was set down; the hand lifts off and goes back to the pose's rest arm
  const place = keyOf(q);
  const placed = { prop: hold[side], key: [(place.key[0] - at[0]) / scale, (place.key[1] - at[1]) / scale] as P2, turn: pose.bookTurn ?? 1 };
  const Gs = Math.sin(q.yaw) >= 0 ? 1 : -1;
  q = vaccineGripTo(kind, v, q, { [side]: add(place.grip, mul([-Gs * 9 * rel, -10 * rel], scale)) }, at, scale);
  const arm0 = q[armKey];
  let arm = { ...arm0, fist: arm0.fist + (0.3 - arm0.fist) * rel };
  const ret = ease(R.ret ?? 0);
  if (R.rest && ret > 0.0005) arm = { w: mix2(arm.w, R.rest.w, ret), elbow: mix2(arm.elbow, R.rest.elbow, ret), fist: arm.fist + (R.rest.fist - arm.fist) * ret, hand: arm.hand + (R.rest.hand - arm.hand) * ret };
  q = { ...q, [armKey]: arm };
  return { q, placed, hold, short };
};

// ===================================================================================================================
// THE CAST MEMBER
// ===================================================================================================================
export type VaccineFigureProps = {
  kind: VaccineKind;
  pose: VPose;
  at: P2;
  scale: number;
  /** unique per figure per frame */
  uid: string;
  variant?: number;
  grip?: { L?: P2; R?: P2 };
  hold?: { L?: HandProp; R?: HandProp };
  holdNear?: HandProp;
  holdFar?: HandProp;
  reachTo?: P2;
  lancetTo?: P2;
  flaskTo?: P2;
  bookTo?: P2;
  charge?: Charge;
  pox?: number;
  sick?: number;
  drain?: number;
  glowArm?: number;
  glowSide?: "L" | "R";
  flaskFill?: number;
  flaskFillC?: string;
  frame?: number;
  fog?: FolkFog;
  inks?: Partial<VaccineInks>;
  tone?: number;
  unitPx?: number;
  texture?: boolean;
};
const holdOf = (p: Pick<VaccineFigureProps, "hold" | "holdNear" | "holdFar" | "pose">): { L?: HandProp; R?: HandProp } => {
  const h = { ...(p.hold ?? {}) };
  const nearL = Math.sin(p.pose.yaw) >= 0;
  if (p.holdNear) h[nearL ? "L" : "R"] = p.holdNear;
  if (p.holdFar) h[nearL ? "R" : "L"] = p.holdFar;
  return h;
};
const solveFor = (p: VaccineFigureProps) =>
  solveVaccinePose(p.kind, p.pose, p.at, p.scale, { variant: p.variant, grip: p.grip, hold: holdOf(p), reachTo: p.reachTo ?? p.lancetTo ?? p.flaskTo ?? p.bookTo });
export const VaccineFigure: React.FC<VaccineFigureProps> = (p) => {
  const s = solveFor(p);
  const o: BuildOpts = { inks: p.inks, hold: s.hold, pox: p.pox, sick: p.sick, drain: p.drain, glowArm: p.glowArm, glowSide: p.glowSide, charge: p.charge, flaskFill: p.flaskFill, flaskFillC: p.flaskFillC, placed: s.placed, frame: p.frame };
  const b = buildVaccineFolk(p.kind, p.variant ?? 0, s.q, o);
  return <VaccinePaint shapes={b.shapes} at={p.at} scale={p.scale} uid={p.uid} tone={p.tone} fog={p.fog} unitPx={p.unitPx} texture={p.texture} />;
};
type CastProps = Omit<VaccineFigureProps, "kind" | "uid"> & { uid?: string };
/** Dr Edward Jenner, 1796 */
export const Jenner: React.FC<CastProps> = ({ uid = "jen", ...p }) => <VaccineFigure kind="jenner" uid={uid} {...p} />;
/** a Georgian child, variant 0..9 */
export const Child: React.FC<CastProps> = ({ uid = "chd", ...p }) => <VaccineFigure kind="child" uid={uid} {...p} />;
/** the variolator: v0 the folk practitioner (a woman), v1 a Georgian surgeon */
export const Inoculator: React.FC<CastProps> = ({ uid = "ino", ...p }) => <VaccineFigure kind="inoculator" uid={uid} {...p} />;
/** Georgian adults: v0 mother, v1 father, v2 townswoman, v3 townsman */
export const Parent: React.FC<CastProps> = ({ uid = "par", ...p }) => <VaccineFigure kind="parent" uid={uid} {...p} />;
/** Louis Pasteur, 1880s */
export const Pasteur: React.FC<CastProps> = ({ uid = "pas", ...p }) => <VaccineFigure kind="pasteur" uid={uid} {...p} />;

/** the anchors in WORLD px of a cast member in a pose (pass the same variant / grip / hold / reachTo it gets) */
export const vaccineAnchors = (
  kind: VaccineKind,
  pose: VPose,
  at: P2,
  scale: number,
  opts: { variant?: number; grip?: { L?: P2; R?: P2 }; hold?: { L?: HandProp; R?: HandProp }; reachTo?: P2 } = {},
): VaccineAnchors & { placed: P2 | null; pose: VPose; reachShort: number } => {
  const s = solveVaccinePose(kind, pose, at, scale, opts);
  const a = buildVaccineFolk(kind, opts.variant ?? 0, s.q, { hold: s.hold, placed: s.placed }).anchors;
  const out = {} as Record<string, unknown>;
  for (const [key, v] of Object.entries(a)) {
    if (key === "headR") out[key] = (v as number) * scale;
    else if (key === "eyes") out[key] = (v as P2[]).map((e) => [at[0] + e[0] * scale, at[1] + e[1] * scale]);
    else out[key] = [at[0] + (v as P2)[0] * scale, at[1] + (v as P2)[1] * scale];
  }
  out.placed = s.placed ? [at[0] + s.placed.key[0] * scale, at[1] + s.placed.key[1] * scale] : null;
  out.pose = s.q;
  out.reachShort = s.short ?? 0;
  return out as VaccineAnchors & { placed: P2 | null; pose: VPose; reachShort: number };
};
/** where two hands meet when a parent holds a child's hand: between their two natural hands (world px), a little
 *  toward the child's (its arm is shorter). Pass it as the grip of both hands (the adult's hand over the child's) */
export const handMeet = (adultHand: P2, childHand: P2, t = 0.62): P2 => mix2(adultHand, childHand, t);

/** a soft contact shadow under a figure on a flat sheet, in the air's shadow colour */
export const VaccineContactShadow: React.FC<{ at: P2; scale: number; w?: number; amount?: number; uid: string; color?: string }> = ({ at, scale, w = 62, amount = 1, uid, color = AIR_SHADOW }) => (
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
// PROPS on their own (the same paint)
// ===================================================================================================================
type PropBase = { at: P2; scale: number; uid: string; tone?: number; fog?: FolkFog; unitPx?: number; texture?: boolean };
const PropPaint: React.FC<{ p: PropBase; shapes: CShape[] }> = ({ p, shapes }) => <VaccinePaint shapes={shapes} at={p.at} scale={p.scale} uid={p.uid} tone={p.tone} fog={p.fog} unitPx={p.unitPx} texture={p.texture} />;
/** a flask standing on its base (at = the base point); fill 0..1 (default colour the vaccine orange) */
export const Flask: React.FC<PropBase & { fill?: number; fillC?: string }> = (p) => <PropPaint p={p} shapes={flaskShapes([0, 0], p.fill ?? 0, p.fillC ?? ACCENT)} />;
/** a closed octavo book standing on its foot (at = the middle of its bottom edge): turn 0 cover .. 1 spine, tilt deg */
export const Book: React.FC<PropBase & { turn?: number; tilt?: number; color?: string }> = (p) => <PropPaint p={p} shapes={bookShapes([0, 0], p.turn ?? 0, p.tilt ?? 0, p.color ?? "#6A5040")} />;
/** a candle in a dish (at = the dish), a pale cream flame (never orange) */
export const Candle: React.FC<PropBase> = (p) => <PropPaint p={p} shapes={candleShapes([0, 0])} />;
/** a lancet lying or held free (at = the blade tip, angle deg = the direction it points, 0 = screen right) */
export const Lancet: React.FC<PropBase & { angle?: number; charge?: Charge }> = (p) => {
  const a = ((p.angle ?? 0) * Math.PI) / 180;
  const d: P2 = [Math.cos(a), Math.sin(a)];
  const nn: P2 = [-d[1], d[0]];
  const tip: P2 = [0, 0];
  const h1 = add(tip, mul(d, -LANCET.blade));
  const h0 = add(h1, mul(d, -LANCET.handle - 8));
  const S: CShape[] = [
    { d: tubeD([h0, mix2(h0, h1, 0.5), h1], [LANCET.w, LANCET.w * 1.05, LANCET.w * 0.92]), fill: "#E9DFC8", sh: 0.5 },
    { d: tubeD([add(h1, mul(d, -0.6)), add(h1, mul(d, LANCET.blade * 0.45)), tip], [LANCET.w * 0.95, LANCET.w * 0.82, 0.35]), fill: STEEL.mid, sh: 0 },
    { d: lineD([add(add(h1, mul(d, 0.6)), mul(nn, -0.5)), add(tip, mul(nn, -0.15))]), fill: STEEL.lit, det: 1.3, keep: true, op: 0.95 },
  ];
  if (p.charge && p.charge.amt > 0.01) {
    const vac = p.charge.kind === "vaccine";
    const c = add(tip, mul(d, -1.6));
    if (vac) S.push({ d: ellD(c, 4.2, 4.2), fill: ACCENT, glow: true, blur: 2.4, op: 0.55 * p.charge.amt, sh: 0 });
    S.push({ d: ellD(c, 1.9, 1.9), fill: vac ? ACCENT : "#8E4552", glow: vac, sh: 0, op: c01(p.charge.amt) });
  }
  return <PropPaint p={p} shapes={S} />;
};
/** a plain Georgian bench (at = the floor point under the middle of its front edge; seatH units; w units wide) */
export const Bench: React.FC<PropBase & { seatH?: number; w?: number; color?: string }> = (p) => {
  const h = p.seatH ?? 82;
  const w = p.w ?? 150;
  const c = p.color ?? "#7A5E42";
  const dark = mixC(c, "#2C3433", 0.25);
  const S: CShape[] = [];
  for (const [x, back] of [[-w / 2 + 12, true], [w / 2 - 6, true], [-w / 2 + 6, false], [w / 2 - 12, false]] as [number, boolean][]) {
    const x0 = x + (back ? 8 : 0);
    const y0 = back ? -8 : 0;
    S.push({ d: closedD([[x0 - 4.5, -h + 6], [x0 + 4.5, -h + 6], [x0 + 5, y0], [x0 - 5, y0]], 0.2), fill: back ? dark : c });
  }
  S.push({ d: closedD([[-w / 2, -h], [w / 2, -h], [w / 2, -h + 9], [-w / 2, -h + 9]], 0.2), fill: c });
  S.push({ d: closedD([[-w / 2, -h], [w / 2, -h], [w / 2 + 8, -h - 8], [-w / 2 + 8, -h - 8]], 0.2), fill: mixC(c, "#F3EBDD", 0.18) });
  return <PropPaint p={p} shapes={S} />;
};
void BOOK;
