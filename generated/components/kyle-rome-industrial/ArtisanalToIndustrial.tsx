// ---------------------------------------------------------------------------
// ArtisanalToIndustrial (kyle-rome-industrial, cut 65). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 263 frames. Numbers (layout, throwing, carriers, camera) in ./artisanalPlan.ts.
// One stage inside the misty teal air (AirStage, palette A) on a londonDepth one-point perspective, from the kit
// kits/dwarkesh-3d/dwarkesh3d (its header is the API).
//
// CHECK LINE: "Roman pottery went from one craftsman's wheel to mass production — rows of potters feeding one huge
// kiln that fires tens of thousands of identical bowls at once."
//
// THE LINE: "[there's] certainly like economies of scale where the production process and manufacturing is sort of
// moved from artisanal to sort of industrial scale. [But there's no takeoff…]"
// WORD -> FRAME (Whisper onsets, heard ~6 frames later): certainly 2 · like 8 · economies 17 · of 33 · scale 41 ·
// where 50 · the 59 · production 65 · process 79 · and 92 · manufacturing 101 · is 115 · sort 131 · of 150 ·
// moved 154 · from 164 · artisanal 172 · to 200 · sort 206 · of 211 · industrial 217 · scale 236 · But 258 (on camera)
// DURATION: the slot 65.165 -> 73.941 s = 8.776 s x 29.97 = 263 frames (f0..f262).
//
// THE MOTION (Rev 1, Oct 26: "not much going on ... then maybe it can pan to the side and something else shows"):
// one continuous camera. f0-~135 as approved: close on ONE potter at his kick wheel (bowl y ~950), the terracotta bowl
// rising under his hands in three pulls, then the even pull-back and rise: the identical potters behind him, columns
// of identical men at identical wheels, boards of drying bowls, carriers, the great cutaway brick kiln with its load of
// stacked bowls emerging out of the air. From f126 the pull-back fades out while the camera pans sideways (f126-194,
// smootherstep), past the kiln, and comes down low and oblique (eye ~2.6 m) onto the quay where the output ships out:
// towers of open crates packed with the kiln's stacked bowls marching back along the quay into the haze, dockers
// carrying crates on their heads up a gangplank onto a Roman merchant ship (corbita) moored stern-to, lying across the
// view: curved dark hull on a level waterline, planks and wale, a short dim rippled reflection, the swan-neck stern
// post, its cargo of the same crates inside its rails, mast and half-furled sail. A slow push-in lands "industrial
// scale" (f217-236); f236-262 settled and alive (walkers, ripples, the creep).
// BEATS: f0 the lump under his hands · f41 "scale" the bowl half drawn · f92 "and" the bowl finished, the first
// clones showing · f120 the district, the kiln emerging · f150 the pan past the kiln · f180 arriving at the quay ·
// f217 "industrial" the quay, the ship, the crates · f236 "scale" · f262 settled.
// CAUSE BEFORE EFFECT: the bowl grows only while his hands ride up its wall (heroRise / heroForm share the pulls); the
// walkers' feet are planted (constant pace), the gangplank rests on the quay's coping and the ship's stern.
// No orange in this cut (the clip rule: orange = technology; this scale is organisation, not a new machine). Clay and
// bowls terracotta red-brown (rims a lighter highlight), brick a duller umber red-brown, the stoke hole a deep
// red-brown glow at most; people never orange. Faces stay out of the caption bands where they settle (the potter's
// face <= 997 and hands <= 1051 through the pull-back; the dockers' faces settle at y ~810-980).
//
// DEPTH: londonDepth with dRef 3000 at kRef 0.46, dolly 0.6; camAtF (artisanalPlan): the approved pull-back for
// f0-~140, then the pan's blend to the quay landing (cx 3650, eye -470, zoom ~0.93). Fog by world depth, its reach
// growing with the pull-back. The artisan at X 0, Z 0; potter columns every 460 (to X 1840), rows every 600; the
// kiln's cut face Z 2900 on the camera's pull-back end line; the quay: deck from X 2250, the wall at 3350, the river
// beyond; crate towers at X 2430-3030 from Z 0 to 5120; the ship's centre line Z 480, stern X 3560, bow 6100.
//
// SOURCES (illustrative; nothing on screen): La Graufesenque (southern Gaul, 1st c. AD): terra sigillata workshops
// sharing huge kilns; the potters' firing lists scratched on plates record single firings of ~25,000-35,000 vessels
// (R. Marichal, Les graffites de La Graufesenque, Gallia suppl. 47, 1988). Stamped, standardised forms (Dragendorff 18,
// 27, 29) shipped across the empire. The kick wheel and potter staging after kyle-rome-slavery/SlavesInTheWorkshop.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirCyl, AirHorizonHazeW, AirShadow, AirStage, MAT, RomeFolk, WorldSvg, airWorldOf, lineOf, mixHex, swayCam, type AirWorld, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  CARRIERS,
  COL_MAX,
  COL_MIN,
  DURATION as PLAN_DURATION,
  BOARDS,
  CART,
  CARTS,
  DOCKERS,
  PLANK_RUN,
  QUAY,
  SHIP,
  standY,
  TOWERS,
  boardXs,
  cartX,
  KILN,
  ROW_MAX,
  ROW_MIN,
  STOOL_DX,
  WALK_CYCLE,
  WHEEL_DX,
  XK,
  XS,
  YARD_STACKS,
  ZS,
  camAtF,
  camP,
  carrierX,
  ease,
  fogMaxAt,
  figMaxAt,
  figVisAt,
  fogVisAt,
  h01,
  heroDim,
  heroForm,
  heroRise,
  mix,
  plazaHas,
  potterPhase,
  pullRise,
  wheelTurn,
  type Carrier,
} from "./artisanalPlan";

export const FPS = 30000 / 1001;
export const DURATION = 263;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (PLAN_DURATION !== DURATION) throw new Error("plan and cut disagree on DURATION");

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const n2 = (v: number) => v.toFixed(2);
const ellD = (cx: number, cy: number, rx: number, ry: number) => `M${n2(cx - rx)},${n2(cy)}a${n2(rx)},${n2(ry)} 0 1,0 ${n2(2 * rx)},0a${n2(rx)},${n2(ry)} 0 1,0 ${n2(-2 * rx)},0Z`;

// ---------------------------------------------------------------------------
// MATERIALS (local colours before fog; nothing near the orange hue)
// ---------------------------------------------------------------------------
/** terracotta red-brown: the clay and every bowl */
const CLAY = { lit: "#BE7C5C", mid: "#93513A", dark: "#5E3122", in: "#4A2619", line: "#45231A", rim: "#DDA582" };
/** the kiln's brick: warm umber red-brown, duller and darker than the bowls */
const BRICK: Mat = { lit: "#A56B4C", mid: "#764A34", dark: "#3C261B" };
const PLANK = { lit: "#9C7B56", mid: "#6E5439" };
/** the potters: one look for every man (identical), the artisan included */
const POTTER_LOOK = { kind: "freeman" as const, variant: 1, inks: { tunic: "#6F8E88" } };

// ---------------------------------------------------------------------------
// THE BOWL ON THE WHEEL (SlavesInTheWorkshop's ThrownBowl, kept terracotta): wheel-local units, the floor point under
// the wheel; the potter sits to its LEFT facing right. m 0 = the lump .. 1 = the open, flaring bowl.
// ---------------------------------------------------------------------------
const vessel = (m: number) => ({ by: -77, ry: mix(-97, -111, m), bw: mix(30, 24, m), rw: mix(27, 39, m), cx: mix(42, 41, m), cy: mix(-88, -82, m) });
const wallPt = (m: number, u: number): P2 => {
  const v = vessel(m);
  const s = 1 - u;
  return [s * s * v.bw + 2 * s * u * v.cx + u * u * v.rw, s * s * v.by + 2 * s * u * v.cy + u * u * v.ry];
};
const ThrownBowl: React.FC<{ at: P2; sc: number; m: number; turn: number; A: AirWorld; Z: number; lw: number }> = ({ at, sc, m, turn, A, Z, lw }) => {
  const v = vessel(m);
  const t = (hex: string) => A.tone(hex, Z, 90);
  const col = t(CLAY.mid);
  const lit = t(CLAY.lit);
  const deep = t(CLAY.dark);
  const inside = t(CLAY.in);
  const DARK = t(CLAY.line);
  const ryOf = (r: number) => r * 0.3;
  const wall = `M${-v.rw},${v.ry}Q${-v.cx},${v.cy} ${-v.bw},${v.by}A${v.bw},${ryOf(v.bw)} 0 0 0 ${v.bw},${v.by}Q${v.cx},${v.cy} ${v.rw},${v.ry}`;
  const body = `${wall}A${v.rw},${ryOf(v.rw)} 0 0 1 ${-v.rw},${v.ry}Z`;
  const rings = Array.from({ length: 3 }, (_, i) => {
    const u = frac1(i / 3 + turn * 1.5);
    const p = wallPt(m, 0.08 + 0.84 * u);
    return `M${(-p[0]).toFixed(2)},${p[1].toFixed(2)}Q0,${(p[1] + ryOf(p[0]) * 0.9).toFixed(2)} ${p[0].toFixed(2)},${p[1].toFixed(2)}`;
  }).join("");
  const sh = wallPt(m, 0.5);
  const hl = wallPt(m, 0.62);
  const w = lw / sc;
  return (
    <g transform={`translate(${Pt(at)}) scale(${sc.toFixed(5)})`}>
      <path d={body} fill={col} stroke={DARK} strokeWidth={2.2 * w} strokeLinejoin="round" />
      {/* the left, lit flank (light from the upper left) */}
      <path d={`M${(-v.rw * 0.92).toFixed(2)},${(v.ry + 2).toFixed(2)}Q${(-hl[0] * 1.02).toFixed(2)},${hl[1].toFixed(2)} ${(-v.bw * 0.95).toFixed(2)},${(v.by - 1).toFixed(2)}`} fill="none" stroke={lit} strokeWidth={4 * w} strokeLinecap="round" opacity={0.7} />
      {/* the right side in shade */}
      <path d={`M${(v.rw * 0.35).toFixed(2)},${(v.ry + ryOf(v.rw)).toFixed(2)}L${(v.rw * 0.97).toFixed(2)},${(v.ry + 1).toFixed(2)}Q${v.cx},${v.cy} ${v.bw},${v.by}L${(v.bw * 0.2).toFixed(2)},${(v.by + ryOf(v.bw) * 0.9).toFixed(2)}Q${(sh[0] * 0.35).toFixed(2)},${sh[1].toFixed(2)} ${(v.rw * 0.35).toFixed(2)},${(v.ry + ryOf(v.rw)).toFixed(2)}Z`} fill={deep} opacity={0.8} />
      <path d={rings} fill="none" stroke={DARK} strokeWidth={0.9 * w} strokeOpacity={mix(0.45, 0.22, m)} />
      {/* the open mouth: the inside seen from above, darker */}
      <ellipse cx={0} cy={v.ry} rx={v.rw} ry={ryOf(v.rw)} fill={col} stroke={DARK} strokeWidth={2 * w} />
      <ellipse cx={0} cy={v.ry + ryOf(v.rw) * 0.12} rx={v.rw * 0.84} ry={ryOf(v.rw) * 0.72} fill={inside} stroke={DARK} strokeWidth={1.1 * w} strokeOpacity={0.7} />
    </g>
  );
};
const frac1 = (v: number) => ((v % 1) + 1) % 1;

// ---------------------------------------------------------------------------
// A POTTER'S STATION: stool, kick wheel, the bowl, the seated potter with both hands on its wall
// ---------------------------------------------------------------------------
type Station = { X: number; Z: number; i: number; hero?: boolean };
const STATIONS: Station[] = (() => {
  const out: Station[] = [];
  let i = 0;
  for (let c = COL_MIN; c <= COL_MAX; c++)
    for (let j = ROW_MIN; j <= ROW_MAX; j++) {
      const X = c * XS;
      const Z = j * ZS;
      if (plazaHas(X, Z, XK)) continue;
      if (j < 0 && c === 0) continue;
      out.push({ X, Z, i: i++, hero: c === 0 && j === 0 });
    }
  return out;
})();

const StationArt: React.FC<{ A: AirWorld; st: Station; f: number }> = ({ A, st, f }) => {
  const P = A.P;
  const { X, Z } = st;
  const sc = P.r(Z);
  const wAt = P.p(X + WHEEL_DX, 0, Z - 4);
  const wSc = P.r(Z - 4);
  const m = st.hero ? heroForm(f) : 1;
  const rise = st.hero ? heroRise(f) : pullRise(potterPhase(st.i, f));
  const turn = wheelTurn(h01(st.i, 9), f);
  const extra = st.hero ? heroDim(f) : 0;
  const ff = A.folkFog(Z);
  const fog = { rgb: ff.rgb, amount: c01(ff.amount + extra * (1 - ff.amount)) };
  const pfog = (Zp: number, h: number) => ({ rgb: A.airHex(Zp, h), amount: c01(A.figFog(Zp) + extra * (1 - A.figFog(Zp))) });
  const base = RomeFolk.idle(RomeFolk.POSES.potter(1, 0.25), f, 13 + (st.i % 7), 0.4);
  // the hands ride the wall: the near hand (L) outside the near wall, the far hand (R) inside it
  const h = 0.12 + 0.8 * rise;
  const out = wallPt(m, h);
  const inn = wallPt(m, Math.min(1, h + 0.12));
  const toW = (q: P2): P2 => [wAt[0] + q[0] * wSc, wAt[1] + q[1] * wSc];
  const grip = { L: toW([-out[0] + 3, out[1]]), R: toW([-inn[0] + 9, inn[1] - 2]) };
  const at = P.p(X, 0, Z);
  const upx = A.k;
  const lw = A.lw(1.0);
  return (
    <g>
      <AirShadow A={A} X={X + WHEEL_DX} Z={Z} w={64} d={30} uid={`s${st.i}w`} amt={0.75} />
      <AirShadow A={A} X={X + STOOL_DX - 6} Z={Z} w={46} d={24} uid={`s${st.i}s`} amt={0.75} />
      <RomeFolk.Stool at={P.p(X + STOOL_DX, 0, Z + 4)} scale={P.r(Z + 4)} uid={`s${st.i}st`} fog={pfog(Z + 4, 30)} unitPx={upx} />
      <RomeFolk.PotterWheel at={wAt} scale={wSc} uid={`s${st.i}wh`} turn={turn} dir={1} clay={!st.hero && m <= 0} fog={pfog(Z - 4, 40)} unitPx={upx} />
      {m > 0 || st.hero ? <ThrownBowl at={wAt} sc={wSc} m={m} turn={turn} A={A} Z={Z - 4} lw={lw} /> : null}
      <RomeFolk.Freeman pose={base} at={at} scale={sc} uid={`s${st.i}p`} variant={POTTER_LOOK.variant} inks={POTTER_LOOK.inks} apron={false} pilleus={false} grip={grip} fog={fog} unitPx={upx} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// STACKED BOWLS (instanced rows, one path per role per row): three nested bowls, rim up
// ---------------------------------------------------------------------------
const SB = { bw: 16, rw: 30, bh: 28, step: 10 };
/** a row of stacks (or single bowls, n 1) at height Y and depth Z, at the given X positions */
const BowlRow: React.FC<{ A: AirWorld; Xs: number[]; Y: number; Z: number; n: number; uid: string; dull?: number }> = ({ A, Xs, Y, Z, n, dull = 0 }) => {
  const P = A.P;
  const r = P.r(Z);
  const top = -(SB.bh + (n - 1) * SB.step);
  const hgt = -Y - top / 2;
  const t = (hex: string) => A.tone(mixHex(hex, "#7A6A52", dull), Z, hgt);
  // the mouth's ellipse ratio from the view (a horizontal circle at this height and depth)
  const ryOf = (rad: number, yy: number) => Math.max(0.6, Math.abs(P.p(XK, Y + yy, Z - rad)[1] - P.p(XK, Y + yy, Z + rad)[1]) / 2);
  let body = "";
  let shade = "";
  let rims = "";
  let mouth = "";
  let lip = "";
  for (const X of Xs) {
    const b = P.p(X, Y, Z);
    const s = r;
    const x = (u: number) => b[0] + u * s;
    const y = (v: number) => b[1] + v * s;
    const ryB = ryOf(SB.bw, 0);
    const ryM = ryOf(SB.rw, top);
    body += `M${n2(x(-SB.bw))},${n2(y(0))}Q${n2(x(-SB.rw * 0.98))},${n2(y(-SB.bh * 0.3))} ${n2(x(-SB.rw))},${n2(y(-SB.bh))}L${n2(x(-SB.rw))},${n2(y(top))}L${n2(x(SB.rw))},${n2(y(top))}L${n2(x(SB.rw))},${n2(y(-SB.bh))}Q${n2(x(SB.rw * 0.98))},${n2(y(-SB.bh * 0.3))} ${n2(x(SB.bw))},${n2(y(0))}A${n2(SB.bw * s)},${n2(ryB)} 0 0 1 ${n2(x(-SB.bw))},${n2(y(0))}Z`;
    shade += `M${n2(x(SB.rw * 0.42))},${n2(y(top))}L${n2(x(SB.rw))},${n2(y(top))}L${n2(x(SB.rw))},${n2(y(-SB.bh))}Q${n2(x(SB.rw * 0.98))},${n2(y(-SB.bh * 0.3))} ${n2(x(SB.bw))},${n2(y(0))}L${n2(x(SB.bw * 0.3))},${n2(y(0))}Q${n2(x(SB.rw * 0.4))},${n2(y(-SB.bh * 0.5))} ${n2(x(SB.rw * 0.42))},${n2(y(top))}Z`;
    for (let k = 0; k < n - 1; k++) {
      const yy = -SB.bh - k * SB.step;
      const ry = ryOf(SB.rw, yy);
      rims += `M${n2(x(-SB.rw))},${n2(y(yy))}A${n2(SB.rw * s)},${n2(ry)} 0 0 0 ${n2(x(SB.rw))},${n2(y(yy))}`;
    }
    mouth += ellD(b[0], y(top), SB.rw * s, ryM);
    lip += `M${n2(x(-SB.rw))},${n2(y(top))}A${n2(SB.rw * s)},${n2(ryM)} 0 0 0 ${n2(x(SB.rw))},${n2(y(top))}`;
  }
  const lw = A.lw(1.1);
  return (
    <g>
      <path d={body} fill={t(CLAY.mid)} stroke={t(CLAY.line)} strokeWidth={lw} strokeLinejoin="round" />
      <path d={shade} fill={t(CLAY.dark)} opacity={0.55} />
      {rims ? <path d={rims} fill="none" stroke={t(CLAY.line)} strokeWidth={lw * 0.9} strokeOpacity={0.75} /> : null}
      <path d={mouth} fill={t(CLAY.in)} stroke={t(CLAY.line)} strokeWidth={lw} />
      <path d={lip} fill="none" stroke={t(CLAY.lit)} strokeWidth={lw * 1.3} strokeOpacity={0.8} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE KILN: a barrel-vaulted brick firing chamber over its firebox, the front cut away so the load shows: tiers of
// tall columns of nested bowls inside; the stoke hole at its foot a deep red-brown glow; a chimney and its smoke
// ---------------------------------------------------------------------------
/** tall stacks of identical upturned bowls (rim down, nested): a row of them, one path per role */
const SK = { rw: 30, foot: 14, bh: 24, step: 10 };
const StackRow: React.FC<{ A: AirWorld; Xs: number[]; Y: number; Z: number; n: number; fogZ?: number }> = ({ A, Xs, Y, Z, n, fogZ }) => {
  const P = A.P;
  const r = P.r(Z);
  const top = -(n - 1) * SK.step;
  const footY = top - SK.bh;
  // inside the chamber the air is thinner: the load keeps the colour of the cut face (fogZ)
  const t = (hex: string) => A.tone(hex, fogZ ?? Z, -Y + 60);
  const ryOf = (rad: number, yy: number) => Math.max(0.5, Math.abs(P.p(XK, Y + yy, Z - rad)[1] - P.p(XK, Y + yy, Z + rad)[1]) / 2);
  const ryB = ryOf(SK.rw, 0);
  const ryF = ryOf(SK.foot, footY);
  let body = "";
  let shade = "";
  let lit = "";
  let rims = "";
  let feet = "";
  let crown = "";
  for (const X of Xs) {
    const b = P.p(X, Y, Z);
    const x = (u: number) => n2(b[0] + u * r);
    const y = (v: number) => n2(b[1] + v * r);
    body += `M${x(-SK.rw)},${y(0)}A${n2(SK.rw * r)},${n2(ryB)} 0 0 0 ${x(SK.rw)},${y(0)}L${x(SK.rw)},${y(top)}C${x(SK.rw)},${y(top - SK.bh * 0.75)} ${x(SK.foot * 1.7)},${y(footY)} ${x(SK.foot)},${y(footY)}L${x(-SK.foot)},${y(footY)}C${x(-SK.foot * 1.7)},${y(footY)} ${x(-SK.rw)},${y(top - SK.bh * 0.75)} ${x(-SK.rw)},${y(top)}Z`;
    shade += `M${x(SK.rw * 0.42)},${y(ryB / r)}L${x(SK.rw)},${y(0)}L${x(SK.rw)},${y(top)}C${x(SK.rw)},${y(top - SK.bh * 0.75)} ${x(SK.foot * 1.7)},${y(footY)} ${x(SK.foot)},${y(footY)}L${x(SK.foot * 0.3)},${y(footY)}C${x(SK.rw * 0.3)},${y(top - SK.bh * 0.5)} ${x(SK.rw * 0.42)},${y(top)} ${x(SK.rw * 0.42)},${y(top + 4)}Z`;
    lit += `M${x(-SK.rw * 0.78)},${y(-2)}L${x(-SK.rw * 0.78)},${y(top)}C${x(-SK.rw * 0.78)},${y(top - SK.bh * 0.6)} ${x(-SK.foot * 1.3)},${y(footY + 3)} ${x(-SK.foot * 0.7)},${y(footY + 2)}`;
    for (let k = 0; k < n; k++) {
      const yy = -k * SK.step;
      rims += `M${x(-SK.rw)},${y(yy)}A${n2(SK.rw * r)},${n2(ryOf(SK.rw, yy))} 0 0 0 ${x(SK.rw)},${y(yy)}`;
    }
    feet += ellD(b[0], b[1] + footY * r, SK.foot * r, ryF);
    // the top bowl's shoulder catches the light: each column ends in a bowl, not a bench
    crown += `M${x(-SK.rw)},${y(top)}C${x(-SK.rw)},${y(top - SK.bh * 0.75)} ${x(-SK.foot * 1.7)},${y(footY)} ${x(-SK.foot)},${y(footY)}L${x(SK.foot * 0.6)},${y(footY)}`;
  }
  const lw = A.lw(1.0);
  return (
    <g>
      <path d={body} fill={t(CLAY.mid)} stroke={t(CLAY.line)} strokeWidth={lw} strokeLinejoin="round" />
      <path d={shade} fill={t(CLAY.dark)} opacity={0.5} />
      <path d={lit} fill="none" stroke={t(CLAY.lit)} strokeWidth={lw * 2} strokeOpacity={0.55} strokeLinecap="round" />
      <path d={rims} fill="none" stroke={t(CLAY.rim)} strokeWidth={lw * 1.25} strokeOpacity={0.9} />
      <path d={crown} fill="none" stroke={t(CLAY.rim)} strokeWidth={lw * 1.6} strokeOpacity={0.85} strokeLinecap="round" />
      <path d={feet} fill={t(CLAY.in)} stroke={t(CLAY.rim)} strokeWidth={lw * 1.3} />
    </g>
  );
};
const stackXs = (x0: number, x1: number, dx: number, off: number, skip: (X: number) => boolean) => {
  const out: number[] = [];
  for (let X = x0 + off; X <= x1; X += dx) if (!skip(X)) out.push(X);
  return out;
};

const SPRING = -(KILN.floor + KILN.wall);
/** the inner opening (or the outer outline, grown by g) of the vault's section, at depth Z */
const archPts = (P: AirWorld["P"], Z: number, g: number, base: number): P2[] => {
  const W = KILN.W + g;
  const out: P2[] = [P.p(XK - W, base, Z)];
  for (let i = 0; i <= 28; i++) {
    const a = (i / 28) * Math.PI;
    out.push(P.p(XK - W * Math.cos(a), SPRING - (KILN.rise + g) * Math.sin(a), Z));
  }
  out.push(P.p(XK + W, base, Z));
  return out;
};
const KILN_IN = { tiers: 4, h: 85 };

/** the kiln's inside: the vault's underside, the back wall warm with the fire below, the chamber floor and its load */
const KilnInside: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const { z0, z1, floor } = KILN;
  const t = (hex: string, Z: number, h = 600) => A.tone(hex, Z, h);
  const open = archPts(P, z0, 0, -floor);
  const back = archPts(P, z1, 0, -floor);
  const by0 = Math.min(...back.map((q) => q[1]));
  const by1 = back[0][1];
  const oy0 = Math.min(...open.map((q) => q[1]));
  const flick = 0.85 + 0.1 * Math.sin(f / 7.3) + 0.05 * Math.sin(f / 2.9 + 1.3);
  const els: React.ReactNode[] = [];
  els.push(
    <defs key="d">
      <linearGradient id="kvault" gradientUnits="userSpaceOnUse" x1="0" y1={n2(oy0)} x2="0" y2={n2(by1)}>
        <stop offset="0" stopColor={t("#5A3D2C", z0, 1200)} />
        <stop offset="1" stopColor={t("#3A2519", z1, 300)} />
      </linearGradient>
      <linearGradient id="kback" gradientUnits="userSpaceOnUse" x1="0" y1={n2(by0)} x2="0" y2={n2(by1)}>
        <stop offset="0" stopColor={t("#3E281D", z1, 1000)} />
        <stop offset="0.7" stopColor={t(mixHex("#4A2A1E", "#7A3424", 0.5 * flick), z1, 400)} />
        <stop offset="1" stopColor={t(mixHex("#5A2E20", "#8A3C26", 0.6 * flick), z1, 250)} />
      </linearGradient>
    </defs>,
  );
  els.push(<path key="vault" d={poly(open)} fill="url(#kvault)" />);
  // a few brick courses on the vault's underside (arches part-way in)
  let ribs = "";
  for (const u of [0.25, 0.5, 0.75]) ribs += `M${archPts(P, mix(z0, z1, u), 0, -floor).map(Pt).join("L")}`;
  els.push(<path key="ribs" d={ribs} fill="none" stroke={t("#2A1B13", z1)} strokeWidth={A.lw(1.4)} strokeOpacity={0.45} />);
  els.push(<path key="back" d={poly(back)} fill="url(#kback)" />);
  // the chamber floor, then the load in tiers rising to the back (back to front)
  els.push(<path key="fl" d={poly([P.p(XK - KILN.W, -floor, z0), P.p(XK + KILN.W, -floor, z0), P.p(XK + KILN.W, -floor, z1), P.p(XK - KILN.W, -floor, z1)])} fill={t("#3A2519", (z0 + z1) / 2, 250)} />);
  const span = z1 - z0 - 160;
  for (let i = KILN_IN.tiers - 1; i >= 0; i--) {
    const za = z0 + 140 + (span * i) / KILN_IN.tiers;
    const Yt = -floor - KILN_IN.h * i;
    if (i > 0) els.push(<AirBox key={`kt${i}`} A={A} X0={XK - KILN.W + 20} X1={XK + KILN.W - 20} Y0={Yt} Y1={-floor} Z0={za - 90} Z1={z1} mat={BRICK} uid={`kt${i}`} lw={A.lw(1)} rim={0.4} />);
    for (let rr = 1; rr >= 0; rr--) {
      const Z = za + rr * (span / KILN_IN.tiers) * 0.45;
      els.push(<StackRow key={`ks${i}${rr}`} A={A} Xs={stackXs(XK - KILN.W + 70, XK + KILN.W - 70, 120, (rr + i) % 2 ? 60 : 0, () => false)} Y={Yt} Z={Z} n={15} fogZ={z0} />);
    }
  }
  return <g>{els}</g>;
};

/** the kiln's cut face: the brick section of the vault and walls over the firebox, the stoke hole glowing at its foot */
const KilnFace: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const { z0, floor, T, W } = KILN;
  const t = (hex: string, h = 500) => A.tone(hex, z0, h);
  const outer = archPts(P, z0, T, 0);
  const inner = archPts(P, z0, 0, -floor);
  const xs = outer.map((q) => q[0]);
  const ys = outer.map((q) => q[1]);
  const bx0 = Math.min(...xs);
  const bx1 = Math.max(...xs);
  const by0 = Math.min(...ys);
  const by1 = Math.max(...ys);
  const ln = t(lineOf(BRICK));
  // brick courses across the face, clipped to it
  let courses = "";
  for (let Y = -60; Y > SPRING - KILN.rise - T; Y -= 95) courses += `M${Pt(P.p(XK - W - T, Y, z0 - 1))}L${Pt(P.p(XK + W + T, Y, z0 - 1))}`;
  // the stoke hole (praefurnium) at the firebox's foot
  const sh: P2[] = [P.p(XK - 175, 0, z0 - 2), P.p(XK - 175, -110, z0 - 2)];
  for (let i = 1; i < 14; i++) {
    const a = Math.PI - (i / 14) * Math.PI;
    sh.push(P.p(XK + 175 * Math.cos(a), -110 - 95 * Math.sin(a), z0 - 2));
  }
  sh.push(P.p(XK + 175, -110, z0 - 2), P.p(XK + 175, 0, z0 - 2));
  const mc = P.p(XK, -70, z0);
  const gr = Math.abs(sh[0][0] - sh[sh.length - 1][0]);
  const flick = 0.85 + 0.1 * Math.sin(f / 7.3) + 0.05 * Math.sin(f / 2.9 + 1.3);
  const sp = P.p(XK, 0, z0 - 160);
  return (
    <g>
      <defs>
        <linearGradient id="kface" gradientUnits="userSpaceOnUse" x1={n2(bx0)} y1={n2(by0)} x2={n2(bx1)} y2={n2(by1)}>
          <stop offset="0" stopColor={t(BRICK.lit, 900)} />
          <stop offset="0.55" stopColor={t(mixHex(BRICK.lit, BRICK.mid, 0.6), 600)} />
          <stop offset="1" stopColor={t(BRICK.mid, 200)} />
        </linearGradient>
        <clipPath id="kfaceclip">
          <path d={`${poly(outer)}${poly(inner)}`} clipRule="evenodd" />
        </clipPath>
        <radialGradient id="kstoke" gradientUnits="userSpaceOnUse" cx={n2(mc[0])} cy={n2(mc[1])} r={n2(gr * 0.7)}>
          <stop offset="0" stopColor={t(mixHex("#7A3524", "#9A4A30", 0.35 * flick), 100)} />
          <stop offset="0.6" stopColor={t("#4E2419", 100)} />
          <stop offset="1" stopColor={t("#2E1912", 100)} />
        </radialGradient>
        <radialGradient id="kspill2">
          <stop offset="0" stopColor={t("#8A4630", 0)} stopOpacity={0.45 * flick * (1 - A.fog(z0))} />
          <stop offset="1" stopColor={t("#8A4630", 0)} stopOpacity={0} />
        </radialGradient>
      </defs>
      <AirShadow A={A} X={XK} Z={z0 + 200} w={(W + T) * 1.05} d={400} uid="kfs" amt={0.6} />
      <path d={`${poly(outer)}${poly(inner)}`} fillRule="evenodd" fill="url(#kface)" stroke={ln} strokeWidth={A.lw(1.4)} strokeLinejoin="round" />
      <path d={courses} clipPath="url(#kfaceclip)" fill="none" stroke={ln} strokeWidth={A.lw(1)} strokeOpacity={0.35} />
      {/* the cream rim on the section's upper-left edge */}
      <path d={`M${outer.slice(1, 16).map(Pt).join("L")}`} fill="none" stroke="#F3EBDD" strokeWidth={A.lw(2)} strokeOpacity={0.35 * (1 - A.fog(z0))} strokeLinecap="round" />
      <path d={poly(sh)} fill="url(#kstoke)" stroke={ln} strokeWidth={A.lw(1.4)} />
      <ellipse cx={sp[0]} cy={sp[1]} rx={gr * 1.1} ry={gr * 0.3} fill="url(#kspill2)" />
    </g>
  );
};

/** the chimney on the vault's crown */
const CHIMNEY = { Z: KILN.z0 + 650, R: 150, top: SPRING - KILN.rise - KILN.T - 330 };
const Chimney: React.FC<{ A: AirWorld }> = ({ A }) => <AirCyl A={A} X={XK} Z={CHIMNEY.Z} R={CHIMNEY.R} Y0={CHIMNEY.top} Y1={SPRING - KILN.rise} mat={BRICK} uid="kchim" lw={A.lw(1.2)} />;

/** the stacking yard: rows of tall stacks in front of the kiln (a lane up the middle) and beside it, receding */
const yardRows = (() => {
  const rows: { Z: number; Xs: number[] }[] = [];
  const Y = YARD_STACKS;
  let k = 0;
  for (let Z = Y.z0; Z <= Y.z1; Z += Y.dz, k++) rows.push({ Z, Xs: stackXs(XK - Y.half, XK + Y.half, Y.dx, k % 2 ? Y.dx / 2 : 0, (X) => Math.abs(X - XK) < Y.lane) });
  for (let Z = Y.side.z0; Z <= Y.side.z1; Z += Y.side.dz, k++) rows.push({ Z, Xs: stackXs(XK - Y.side.x1, XK + Y.side.x1, Y.dx, k % 2 ? Y.dx / 2 : 0, (X) => Math.abs(X - XK) < Y.side.x0 || X > XK + 2000) });
  return rows;
})();

/** the smoke from the vent: soft puffs rising and leaning right, thinning as they climb */
const Smoke: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const life = 170;
  const every = 15;
  const puffs: React.ReactNode[] = [];
  const air = A.airHex(CHIMNEY.Z, 2000);
  for (let n = Math.floor((f - life) / every); n <= Math.floor(f / every); n++) {
    const age = f - n * every;
    if (age < 0 || age > life) continue;
    const u = age / life;
    const rise = 120 + 900 * Math.pow(u, 0.85);
    const drift = 380 * u * u + 40 * Math.sin(n * 1.7);
    const R = 90 + 260 * Math.pow(u, 0.7);
    const c = P.p(XK + drift, CHIMNEY.top - 40 - rise, CHIMNEY.Z);
    const rr = R * P.r(CHIMNEY.Z);
    const op = 0.5 * ease(age / 18) * Math.pow(1 - u, 1.2);
    if (op < 0.005) continue;
    const id = `smk${n}`;
    puffs.push(
      <g key={id}>
        <defs>
          <radialGradient id={id}>
            <stop offset="0" stopColor={mixHex("#7E766A", air, 0.3)} stopOpacity={op} />
            <stop offset="0.6" stopColor={mixHex("#857C70", air, 0.4)} stopOpacity={op * 0.55} />
            <stop offset="1" stopColor={air} stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={c[0]} cy={c[1]} rx={rr} ry={rr * 0.86} fill={`url(#${id})`} />
      </g>,
    );
  }
  return <g>{puffs}</g>;
};

// ---------------------------------------------------------------------------
// THE CART: two crates of finished bowls on a handcart, pushed away along the lane before the stacking yard
// ---------------------------------------------------------------------------
const CartArt: React.FC<{ A: AirWorld; f: number; Z: number; X0: number; uid: string }> = ({ A, f, Z: Zc, X0, uid }) => {
  const P = A.P;
  const Z = Zc;
  const Xf = cartX(f, X0);
  const { at, scale } = P.at(Xf, Z);
  const pose = RomeFolk.POSES.push(1, f / CART.cycle, 1);
  const t = (hex: string, h = 120) => A.tone(hex, Z, h);
  const lw = A.lw(1);
  const ln = t("#3A2B1D");
  const wood = { lit: "#9C7B56", mid: "#6E5439", dark: "#3A2B1D" };
  const crate = (x0: number, x1: number, k: string) => <AirBox key={k} A={A} X0={Xf + x0} X1={Xf + x1} Y0={-236} Y1={-122} Z0={Z - 60} Z1={Z + 60} mat={wood} uid={`cart${k}`} lw={lw} rim={0.5} />;
  // the near wheel turns with the distance travelled
  const wc = P.p(Xf + 290, -78, Z - 82);
  const wr = 78 * P.r(Z - 82);
  const ang = -(Xf - XK) / 78;
  let spokes = "";
  for (let i = 0; i < 6; i++) {
    const a = ang + (i * Math.PI) / 3;
    spokes += `M${n2(wc[0])},${n2(wc[1])}L${n2(wc[0] + Math.cos(a) * wr * 0.9)},${n2(wc[1] + Math.sin(a) * wr * 0.9)}`;
  }
  const hand = P.p(Xf + 104, -214, Z);
  const front = P.p(Xf + 160, -128, Z);
  return (
    <g>
      <AirShadow A={A} X={Xf + 250} Z={Z} w={220} d={70} uid="cartS" amt={0.7} />
      <AirBox A={A} X0={Xf + 150} X1={Xf + 430} Y0={-122} Y1={-100} Z0={Z - 75} Z1={Z + 75} mat={wood} uid="cartbed" lw={lw} rim={0.5} />
      {crate(165, 290, "a")}
      {crate(300, 420, "b")}
      <BowlRow A={A} Xs={[Xf + 198, Xf + 258, Xf + 333, Xf + 390]} Y={-236} Z={Z + 25} n={2} uid="cartb1" />
      <BowlRow A={A} Xs={[Xf + 198, Xf + 258, Xf + 333, Xf + 390]} Y={-236} Z={Z - 25} n={2} uid="cartb2" />
      <path d={`M${Pt(hand)}L${Pt(front)}`} stroke={t(wood.mid)} strokeWidth={9 * scale * A.k > 0 ? 9 * scale : 1} strokeLinecap="round" />
      <circle cx={wc[0]} cy={wc[1]} r={wr} fill="none" stroke={t(wood.dark)} strokeWidth={14 * P.r(Z - 82)} />
      <path d={spokes} stroke={t(wood.mid)} strokeWidth={6 * P.r(Z - 82)} strokeLinecap="round" />
      <circle cx={wc[0]} cy={wc[1]} r={wr * 0.16} fill={t(wood.dark)} stroke={ln} strokeWidth={lw} />
      <RomeFolk.Slave pose={pose} at={at} scale={scale} uid="cartman" variant={2} inks={{ tunic: "#94826A" }} grip={{ L: hand, R: P.p(Xf + 110, -219, Z) }} fog={A.folkFog(Z)} unitPx={A.k} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CARRIERS (a board of drying bowls on the near shoulder)
// ---------------------------------------------------------------------------
const CarrierArt: React.FC<{ A: AirWorld; c: Carrier; f: number; crate?: boolean }> = ({ A, c, f, crate }) => {
  const P = A.P;
  const X = carrierX(c, f);
  const at = P.p(X, standY(X, c.Z), c.Z);
  const scale = P.r(c.Z);
  const pose = RomeFolk.POSES.carry(c.dir, f / WALK_CYCLE + c.ph, 1);
  const an = RomeFolk.romeAnchors("slave", pose, at, scale, { variant: c.variant });
  // the board rides on his head (the near hand up at its edge steadying it), clear of his face
  const L = an.headTop as P2;
  const len = (crate ? 150 : 200) * scale;
  const th = (crate ? 62 : 9) * scale;
  const bx0 = L[0] - len * 0.5 - c.dir * (crate ? 10 : 22) * scale;
  const by = L[1] - th + 3 * scale;
  void crate;
  // the near hand under the board's leading half (the near arm is L facing right, R facing left)
  const hold: P2 = [L[0] + c.dir * (crate ? 40 : 34) * scale, by + th + (crate ? 2 : 7) * scale];
  const grip = c.dir > 0 ? { L: hold } : { R: hold };
  const t = (hex: string) => A.tone(hex, c.Z, 280);
  let bowls = "";
  let mouths = "";
  const nb = crate ? 3 : 4;
  for (let i = 0; i < nb; i++) {
    const cx = bx0 + len * (crate ? 0.19 + 0.31 * i : 0.14 + 0.24 * i);
    const s = scale;
    bowls += `M${n2(cx - 13 * s)},${n2(by)}Q${n2(cx - 24 * s)},${n2(by - 8 * s)} ${n2(cx - 25 * s)},${n2(by - 24 * s)}L${n2(cx + 25 * s)},${n2(by - 24 * s)}Q${n2(cx + 24 * s)},${n2(by - 8 * s)} ${n2(cx + 13 * s)},${n2(by)}Z`;
    mouths += ellD(cx, by - 24 * s, 25 * s, 6 * s);
  }
  return (
    <g>
      <AirShadow A={A} X={X} Z={c.Z} Y={standY(X, c.Z)} w={58} d={28} uid={`cs${c.Z}${c.X0}`} amt={0.7} />
      <RomeFolk.Slave pose={pose} at={at} scale={scale} uid={`cr${c.Z}${c.X0}`} variant={c.variant} inks={{ tunic: "#94826A" }} grip={grip} fog={A.folkFog(c.Z)} unitPx={A.k} />
      <path d={`M${n2(bx0)},${n2(by)}h${n2(len)}v${n2(th)}h${n2(-len)}Z`} fill={t(PLANK.lit)} stroke={t("#3A2B1D")} strokeWidth={A.lw(1)} />
      {crate ? <path d={`M${n2(bx0)},${n2(by + th * 0.5)}h${n2(len)}M${n2(bx0 + len * 0.5)},${n2(by)}v${n2(th)}`} stroke={t("#5A4330")} strokeWidth={A.lw(1.3)} /> : null}
      <path d={bowls} fill={t(CLAY.mid)} stroke={t(CLAY.line)} strokeWidth={A.lw(1)} />
      <path d={mouths} fill={t(CLAY.in)} stroke={t(CLAY.line)} strokeWidth={A.lw(1)} />
    </g>
  );
};

/** the floor: AirFloor's tone by depth (a little darker near, melting into the air far away), in bands even on
 *  screen (the close-up's short fog would step on AirFloor's few near bands), with faint course joints */
const Floor: React.FC<{ A: AirWorld; x0: number; x1: number; z1: number }> = ({ A, x0, x1, z1 }) => {
  const P = A.P;
  const mat = MAT.ground;
  const zA = P.zNear + 10;
  const rA = P.r(zA);
  const rB = P.r(z1);
  const N = 110;
  const Zof = (i: number) => P.Dc / mix(rA, rB, i / N) - P.Dc;
  const colAt = (Z: number) => {
    const near = c01(1 - (Z + 400) / 900);
    const local = mixHex(mixHex(mat.lit, mat.mid, 0.3), mat.dark, 0.2 * near);
    const melt = Math.pow(c01((Z - z1 * 0.6) / (z1 * 0.4)), 1.3);
    return mixHex(A.tone(local, Z, 0), A.screenAir(P.p(0, 0, Z)[1]), melt);
  };
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const za = Zof(i);
    const zb = Zof(i + 1);
    const zb2 = i < N - 1 ? zb + (zb - za) * 0.25 : zb;
    bands.push(<path key={i} d={poly([P.p(x0, 0, za), P.p(x1, 0, za), P.p(x1, 0, zb2), P.p(x0, 0, zb2)])} fill={colAt((za + zb) / 2)} />);
  }
  // faint joints along Z every 600 (between the columns' aisles) and across every 600, fading with the fog
  let d = "";
  const zs: number[] = [];
  for (let Z = Math.ceil(zA / 600) * 600 - 300; Z < 9000; Z += 600) zs.push(Z);
  for (const Z of zs) if (Z > zA) d += `M${Pt(P.p(x0, 0, Z))}L${Pt(P.p(x1, 0, Z))}`;
  return (
    <g>
      {bands}
      <path d={d} fill="none" stroke={A.tone(lineOf(mat), 600, 0)} strokeWidth={A.lw(1.1)} strokeOpacity={0.18 * (1 - A.fog(1500))} />
    </g>
  );
};

/** boards of drying bowls on the floor (the foreground's quiet texture): a plank on the floor, four bowls rim up */
const BoardRow: React.FC<{ A: AirWorld; Z: number; Xs: number[]; bare?: boolean }> = ({ A, Z, Xs, bare }) => {
  const P = A.P;
  const D = 70;
  let top = "";
  let front = "";
  const bowlXs: number[] = [];
  for (const X of Xs) {
    const x0 = X - BOARDS.len / 2;
    const x1 = X + BOARDS.len / 2;
    top += poly([P.p(x0, -14, Z - D / 2), P.p(x1, -14, Z - D / 2), P.p(x1, -14, Z + D / 2), P.p(x0, -14, Z + D / 2)]);
    front += poly([P.p(x0, -14, Z - D / 2), P.p(x1, -14, Z - D / 2), P.p(x1, 0, Z - D / 2), P.p(x0, 0, Z - D / 2)]);
    for (let b = 0; b < BOARDS.bowls; b++) bowlXs.push(x0 + (BOARDS.len / BOARDS.bowls) * (b + 0.5));
  }
  const t = (hex: string) => A.tone(hex, Z, 20);
  // the close-up's foreground row stands on the floor itself (no plank: no slab across the frame's foot)
  if (bare) return <BowlRow A={A} Xs={bowlXs} Y={0} Z={Z} n={1} uid={`bd${Z}`} dull={0.3} />;
  return (
    <g>
      <path d={front} fill={t(PLANK.mid)} stroke={t("#3A2B1D")} strokeWidth={A.lw(0.9)} />
      <path d={top} fill={t(PLANK.lit)} stroke={t("#3A2B1D")} strokeWidth={A.lw(0.9)} />
      <BowlRow A={A} Xs={bowlXs} Y={-14} Z={Z} n={1} uid={`bd${Z}`} dull={0.3} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// REV 1, THE QUAY: the river (water below the quay's edge), the stone quay wall, towers of open crates packed with
// the same stacked bowls, a barge being loaded at a gangplank
// ---------------------------------------------------------------------------
const WATER = { lit: "#5E7F7A", mid: "#43625E" };
const STONE: Mat = { lit: "#9B8B76", mid: "#6F6352", dark: "#3A3129" };
const River: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const x0 = QUAY.wall;
  const x1 = QUAY.river1;
  const Y = QUAY.water;
  const zA = Math.max(-2600, P.zNear + 20);
  const rA = P.r(zA);
  const rB = P.r(16000);
  const N = 60;
  const Zof = (i: number) => P.Dc / mix(rA, rB, i / N) - P.Dc;
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const za = Zof(i);
    const zb = Zof(i + 1);
    const zb2 = i < N - 1 ? zb + (zb - za) * 0.25 : zb;
    const zm = (za + zb) / 2;
    const melt = Math.pow(c01((zm - 9000) / 7000), 1.3);
    bands.push(<path key={i} d={poly([P.p(x0, Y, za), P.p(x1, Y, za), P.p(x1, Y, zb2), P.p(x0, Y, zb2)])} fill={mixHex(A.tone(mixHex(WATER.mid, WATER.lit, c01(1 - zm / 6000) * 0.4), zm, 0), A.screenAir(P.p(0, 0, zm)[1]), melt)} />);
  }
  // the current: short light dashes drifting downstream (toward us), seeded in the world
  let d = "";
  for (let i = 0; i < 170; i++) {
    const X = x0 + 120 + h01(i, 41) * 3600;
    const Z0 = -2200 + Math.pow(h01(i, 43), 1.4) * 9000;
    const Z = Z0 - ((f * 4 + h01(i, 47) * 900) % 900);
    if (Z < zA + 50) continue;
    const L = 60 + 80 * h01(i, 51);
    d += `M${Pt(P.p(X - L / 2, Y, Z))}L${Pt(P.p(X + L / 2, Y, Z))}`;
  }
  return (
    <g>
      {bands}
      <path d={d} fill="none" stroke="#C9D6CC" strokeWidth={A.lw(2)} strokeOpacity={0.3} strokeLinecap="round" />
    </g>
  );
};
const QuayWall: React.FC<{ A: AirWorld }> = ({ A }) => {
  const z0 = Math.max(-2600, A.P.zNear + 30);
  return <AirBox A={A} X0={QUAY.wall - QUAY.wallW} X1={QUAY.wall} Y0={-14} Y1={QUAY.water} Z0={z0} Z1={16000} mat={STONE} uid="qwall" lw={A.lw(1.2)} />;
};

/** an open crate (a timber cage) packed with three columns of the kiln's stacked bowls; Y = its floor */
const CR = { W: 230, D: 160, H: 118, n: 7 };
const Crate: React.FC<{ A: AirWorld; X: number; Y: number; Z: number }> = ({ A, X, Y, Z }) => {
  const P = A.P;
  const t = (hex: string) => A.tone(hex, Z, -Y + 60);
  const x0 = X - CR.W / 2;
  const x1 = X + CR.W / 2;
  const zf = Z - CR.D / 2;
  const zb = Z + CR.D / 2;
  const yt = Y - CR.H;
  const L = (a: [number, number, number], b: [number, number, number]) => `M${Pt(P.p(a[0], a[1], a[2]))}L${Pt(P.p(b[0], b[1], b[2]))}`;
  const back = L([x0, Y, zb], [x0, yt, zb]) + L([x1, Y, zb], [x1, yt, zb]) + L([x0, yt, zb], [x1, yt, zb]) + L([x0, yt, zf], [x0, yt, zb]) + L([x1, yt, zf], [x1, yt, zb]);
  const front = L([x0, Y, zf], [x0, yt, zf]) + L([x1, Y, zf], [x1, yt, zf]) + L([x0, yt, zf], [x1, yt, zf]) + L([x0, Y - 6, zf], [x1, Y - 6, zf]) + L([x0, Y - CR.H * 0.45, zf], [x1, Y - CR.H * 0.45, zf]);
  const floor = poly([P.p(x0, Y, zf), P.p(x1, Y, zf), P.p(x1, Y, zb), P.p(x0, Y, zb)]);
  const bw = 13 * P.r(Z);
  return (
    <g>
      <path d={floor} fill={t(PLANK.mid)} />
      <path d={back} stroke={t("#4A3626")} strokeWidth={bw} strokeLinecap="square" />
      <StackRow A={A} Xs={[X - 72, X, X + 72]} Y={Y - 4} Z={Z} n={CR.n} />
      <path d={front} stroke={t(PLANK.lit)} strokeWidth={bw} strokeLinecap="square" />
      <path d={front} stroke={t("#3A2B1D")} strokeWidth={bw * 0.25} strokeOpacity={0.5} />
    </g>
  );
};
const Tower: React.FC<{ A: AirWorld; X: number; Z: number; levels: number; Y?: number }> = ({ A, X, Z, levels, Y = 0 }) => (
  <g>
    <AirShadow A={A} X={X} Z={Z} w={150} d={100} Y={Y} uid={`tw${X}_${Z}`} amt={0.6} />
    {Array.from({ length: levels }, (_, k) => (
      <Crate key={k} A={A} X={X} Y={Y - k * (CR.H + 3)} Z={Z} />
    ))}
  </g>
);
/** the corbita moored stern-to the quay (the Mediterranean way), lying across the view so its long side shows: a curved
 *  dark hull on a level waterline (planks, wale, a short dim rippled reflection), the swan-neck stern post at the quay,
 *  the cargo of the same crates inside its rails, the mast with its yard braced round and the half-furled sail */
const Ship: React.FC<{ A: AirWorld; f: number; S: typeof SHIP; uid: string }> = ({ A, f, S, uid }) => {
  const P = A.P;
  const W = QUAY.water;
  const hull = { lit: "#6A4A34", mid: "#4A3325", dark: "#2A1D15" };
  const Xof = (u: number) => mix(S.xs, S.xb, u);
  const hb = (u: number) => S.B * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, u))), 0.5);
  const sheer = (u: number) => S.deck - 95 * Math.pow(1 - u, 6) - 120 * Math.pow(u, 6);
  const N = 48;
  const us = Array.from({ length: N + 1 }, (_, i) => i / N);
  const near = us.map((u): P2 => P.p(Xof(u), sheer(u), S.zc - hb(u)));
  const far = us.map((u): P2 => P.p(Xof(u), sheer(u), S.zc + hb(u)));
  const inW = us.filter((u) => u > 0.04 && u < 0.96);
  const wl = inW.map((u): P2 => P.p(Xof(u), W, S.zc - hb(u) * 0.86));
  const t = (hex: string, h = 100) => A.tone(hex, S.zc, h);
  const lw = A.lw(1.2);
  const ln = t(hull.dark);
  const els: React.ReactNode[] = [];
  // the reflection: a short dim mirror right under the waterline, broken into drifting strips
  const rd = (u: number) => (W - sheer(u)) * 0.3;
  const reflS = inW.map((u): P2 => P.p(Xof(u), W + rd(u), S.zc - hb(u) * 0.86));
  const ry0 = Math.min(...wl.map((q) => q[1]));
  const ry1 = Math.max(...reflS.map((q) => q[1]));
  const rx0 = Math.min(...wl.map((q) => q[0])) - 20;
  const rx1 = Math.max(...wl.map((q) => q[0])) + 20;
  let strips = "";
  const rN = 8;
  for (let i = 0; i < rN; i++) {
    const y = mix(ry0, ry1, (i + 0.5) / rN);
    const sh = (6 * Math.sin(f / 9 + i * 1.7)) / A.k;
    strips += `M${n2(rx0 + sh)},${n2(y)}L${n2(rx1 + sh)},${n2(y)}`;
  }
  els.push(
    <g key="refl">
      <defs>
        <clipPath id={`${uid}refl`}>
          <path d={`M${wl.map(Pt).join("L")}L${[...reflS].reverse().map(Pt).join("L")}Z`} />
        </clipPath>
      </defs>
      <path d={strips} clipPath={`url(#${uid}refl)`} stroke={t("#22302E", 0)} strokeWidth={((ry1 - ry0) / rN) * 0.62} strokeOpacity={0.32} strokeDasharray={`${n2(90 / A.k)} ${n2(22 / A.k)}`} />
    </g>,
  );
  // the deck (seen from just above) and the far rail
  els.push(<path key="deck" d={`M${near.map(Pt).join("L")}L${[...far].reverse().map(Pt).join("L")}Z`} fill={t("#8C6E50")} stroke={ln} strokeWidth={lw} />);
  els.push(<path key="farrail" d={`M${far.map(Pt).join("L")}`} fill="none" stroke={t(hull.mid)} strokeWidth={A.lw(4)} />);
  // the cargo: two lines of towers inside the rails (far line first), where the hull holds them with room to spare
  const cargo = (side: number) => {
    const out: React.ReactNode[] = [];
    for (let X = S.xs + 255; X <= S.xb - 380; X += 236) {
      const u = (X - S.xs) / (S.xb - S.xs);
      if (hb(u) < 95 + CR.D / 2 + 25) continue;
      if (Math.abs(X - S.mastX) < 110) continue;
      out.push(<Tower key={`${uid}${side}${X}`} A={A} X={X} Z={S.zc + side * 95} levels={2} Y={sheer(u) + 50} />);
    }
    return out;
  };
  els.push(...cargo(1));
  // the mast, its yard braced round at an angle, the sail half furled on it
  {
    const yY = S.mastTop + 160;
    const ang = 0.75;
    const ya = P.p(S.mastX - 560 * Math.sin(ang), yY, S.zc - 560 * Math.cos(ang));
    const yb = P.p(S.mastX + 560 * Math.sin(ang), yY, S.zc + 560 * Math.cos(ang));
    const pt = (s: number, dy: number, dz = 0) => P.p(S.mastX + s * 520 * Math.sin(ang), yY + dy, S.zc + s * 520 * Math.cos(ang) + dz);
    const r = P.r(S.zc);
    let folds = "";
    for (const s of [-0.6, -0.25, 0.1, 0.45]) folds += `M${Pt(pt(s, 30))}L${Pt(pt(s * 0.88, 300))}`;
    const sail = t("#CFC3A8", 1600);
    els.push(
      <g key="mast">
        <AirCyl A={A} X={S.mastX} Z={S.zc} R={22} Y0={S.mastTop} Y1={S.deck} mat={hull} uid={`${uid}mast`} lw={A.lw(1)} />
        <path d={`M${Pt(pt(-1, 20))}L${Pt(pt(1, 20))}L${Pt(pt(0.85, 310))}Q${Pt(pt(0, 350))} ${Pt(pt(-0.85, 310))}Z`} fill={sail} stroke={t("#8E8068", 1600)} strokeWidth={A.lw(1)} />
        <path d={folds} stroke={t("#A89A80", 1600)} strokeWidth={A.lw(1.2)} strokeOpacity={0.8} />
        <path d={`M${Pt(ya)}L${Pt(yb)}`} stroke={t(hull.mid, 1700)} strokeWidth={20 * r} strokeLinecap="round" />
        <path d={`M${Pt(pt(-1, 20))}Q${Pt(pt(0, 70))} ${Pt(pt(1, 20))}`} fill="none" stroke={sail} strokeWidth={40 * r} strokeLinecap="round" />
      </g>,
    );
  }
  els.push(...cargo(-1));
  // the near side of the hull, over the cargo's feet: dark wood, plank lines, a lighter wale, the level waterline
  const stemAt = (a: number, end: 0 | 1): P2 => {
    const u = end;
    const dx = (end === 0 ? -1 : 1) * 150 * (1 - Math.pow(Math.max(0, 1 - a), 2)) * 0.6;
    return P.p(Xof(u) + dx - (end === 0 ? -1 : 1) * 90, mix(W, sheer(u), a), S.zc);
  };
  const sternUp = Array.from({ length: 9 }, (_, i) => stemAt(i / 8, 0));
  const bowUp = Array.from({ length: 9 }, (_, i) => stemAt(1 - i / 8, 1));
  const side = `M${near.map(Pt).join("L")}L${bowUp.map(Pt).join("L")}L${[...wl].reverse().map(Pt).join("L")}L${sternUp.map(Pt).join("L")}Z`;
  let strakes = "";
  for (const v of [0.35, 0.6, 0.82]) strakes += `M${inW.map((u) => Pt(P.p(Xof(u), mix(sheer(u) + 45, W, v), S.zc - hb(u) * mix(0.98, 0.86, v)))).join("L")}`;
  const wale = inW.map((u): P2 => P.p(Xof(u), sheer(u) + 45, S.zc - hb(u) * 0.98));
  const wy0 = Math.min(...near.map((q) => q[1]));
  const wy1 = Math.max(...wl.map((q) => q[1]));
  // the swan-neck stern post at the quay end, the stem at the bow
  const post = (end: 0 | 1, h: number, curl: number) =>
    Array.from({ length: 15 }, (_, i) => {
      const a = i / 14;
      const s = end === 0 ? -1 : 1;
      return P.p(Xof(end) + s * (40 + 120 * Math.sin((a * Math.PI) / 2)) - s * curl * a * a * a, sheer(end) - h * Math.sin((a * Math.PI) / 2) - 40 * a * a, S.zc);
    });
  els.push(
    <g key="side">
      <defs>
        <linearGradient id={`${uid}side`} gradientUnits="userSpaceOnUse" x1="0" y1={n2(wy0)} x2="0" y2={n2(wy1)}>
          <stop offset="0" stopColor={t(hull.lit)} />
          <stop offset="0.5" stopColor={t(hull.mid)} />
          <stop offset="1" stopColor={t(hull.dark, 0)} />
        </linearGradient>
      </defs>
      <path d={`M${post(0, 330, 140).map(Pt).join("L")}`} fill="none" stroke={t(hull.mid, 400)} strokeWidth={24 * P.r(S.zc)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${post(1, 220, 60).map(Pt).join("L")}`} fill="none" stroke={t(hull.mid, 300)} strokeWidth={24 * P.r(S.zc)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={side} fill={`url(#${uid}side)`} stroke={ln} strokeWidth={lw} strokeLinejoin="round" />
      <path d={strakes} fill="none" stroke={t(hull.dark)} strokeWidth={A.lw(1.2)} strokeOpacity={0.55} />
      <path d={`M${wale.map(Pt).join("L")}`} fill="none" stroke={t("#8C6A4C")} strokeWidth={A.lw(3)} strokeOpacity={0.8} />
      <path d={`M${near.map(Pt).join("L")}`} fill="none" stroke="#F3EBDD" strokeWidth={A.lw(1.6)} strokeOpacity={0.35 * (1 - A.fog(S.zc))} />
      <path d={`M${wl.map(Pt).join("L")}`} fill="none" stroke="#C9D6CC" strokeWidth={A.lw(1.6)} strokeOpacity={0.45} />
    </g>,
  );
  return <g>{els}</g>;
};
/** the gangplank: resting on the quay's coping and on the ship's rail */
const Gangplank: React.FC<{ A: AirWorld }> = ({ A }) => {
  const P = A.P;
  const R = PLANK_RUN;
  const Z = SHIP.zc;
  const q = [P.p(R.X0 - 40, R.Y0, Z - 70), P.p(R.X1 + 30, R.Y1, Z - 70), P.p(R.X1 + 30, R.Y1, Z + 70), P.p(R.X0 - 40, R.Y0, Z + 70)];
  const fr = [P.p(R.X0 - 40, R.Y0, Z - 70), P.p(R.X1 + 30, R.Y1, Z - 70), P.p(R.X1 + 30, R.Y1 + 14, Z - 70), P.p(R.X0 - 40, R.Y0 + 14, Z - 70)];
  let cleats = "";
  for (let i = 1; i < 6; i++) {
    const u = i / 6;
    const X = mix(R.X0 - 40, R.X1 + 30, u);
    const Y = mix(R.Y0, R.Y1, u) - 3;
    cleats += `M${Pt(P.p(X, Y, Z - 66))}L${Pt(P.p(X, Y, Z + 66))}`;
  }
  return (
    <g>
      <path d={poly(fr)} fill={A.tone(PLANK.mid, Z, 0)} stroke={A.tone("#3A2B1D", Z, 0)} strokeWidth={A.lw(1)} />
      <path d={poly(q)} fill={A.tone(PLANK.lit, Z, 0)} stroke={A.tone("#3A2B1D", Z, 0)} strokeWidth={A.lw(1)} />
      <path d={cleats} stroke={A.tone("#5A4330", Z, 0)} strokeWidth={A.lw(1.4)} />
    </g>
  );
};

/** the lower frame sinks into the dense low air (the medium's height ramp, painted over the near floor) */
const LOW = { y0: 1120, y1: 1920, amt: 0.62 };
const LowAir: React.FC<{ A: AirWorld }> = ({ A }) => {
  const stops = [0, 0.25, 0.5, 0.75, 1].map((u) => {
    const y = mix(LOW.y0, LOW.y1, u);
    const c = A.v.airAtScreen(Math.min(1920, y + 200));
    return { u, c: `rgb(${c.map((v) => Math.round(v)).join(",")})`, a: LOW.amt * Math.pow(u, 1.3) };
  });
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id="lowair" gradientUnits="userSpaceOnUse" x1="0" y1={LOW.y0} x2="0" y2={LOW.y1}>
          {stops.map((s) => (
            <stop key={s.u} offset={s.u} stopColor={s.c} stopOpacity={s.a.toFixed(3)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={0} y={LOW.y0} width={1080} height={LOW.y1 - LOW.y0} fill="url(#lowair)" />
    </svg>
  );
};

// ---------------------------------------------------------------------------
// THE CUT
// ---------------------------------------------------------------------------
const REST = swayCam(camAtF(0).cam, 0);

const ArtisanalToIndustrial: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const p = camP(f);
  const CF = camAtF(f);
  const cam = swayCam(CF.cam, f);
  const vis = fogVisAt(p);
  const A = airWorldOf({ cam, rest: REST, depth: CF.depth, frame: f, fogBy: "depth", scene: { fogVis: vis, fogMax: fogMaxAt(p) }, figFog: { near: 150, vis: figVisAt(p), max: figMaxAt(p) } });
  const P = A.P;
  const k = cam.k;
  const toS = (q: P2): P2 => [540 + (q[0] - cam.cx) * k, 960 + (q[1] - cam.cy) * k];
  const onScreen = (X0: number, X1: number, Y0: number, Z: number, pad = 160) => {
    if (Z < P.zNear + 40) return false;
    const a = toS(P.p(X0, Y0, Z));
    const b = toS(P.p(X1, 0, Z));
    return b[0] > -pad && a[0] < 1080 + pad && b[1] > -pad && a[1] < 1920 + pad;
  };
  type Item = { Z: number; node: React.ReactNode };
  const items: Item[] = [];
  for (const st of STATIONS) {
    if (!onScreen(st.X - 90, st.X + WHEEL_DX + 70, -300, st.Z)) continue;
    items.push({ Z: st.Z, node: <StationArt key={`st${st.i}`} A={A} st={st} f={f} /> });
  }
  for (const c of CARRIERS) {
    const X = carrierX(c, f);
    if (!onScreen(X - 160, X + 160, -360, c.Z)) continue;
    items.push({ Z: c.Z, node: <CarrierArt key={`c${c.Z}${c.X0}`} A={A} c={c} f={f} /> });
  }
  items.push({ Z: CHIMNEY.Z, node: <Chimney key="chim" A={A} /> });
  for (const X of TOWERS.xs)
    for (let Z = TOWERS.z0; Z <= TOWERS.z1; Z += TOWERS.dz)
      if (onScreen(X - CR.W / 2, X + CR.W / 2, -TOWERS.levels * CR.H - 20, Z, 40)) items.push({ Z, node: <Tower key={`t${X}_${Z}`} A={A} X={X} Z={Z} levels={TOWERS.levels} /> });
  for (const c of DOCKERS) {
    const X = carrierX(c, f);
    if (onScreen(X - 160, X + 160, -420, c.Z)) items.push({ Z: c.Z, node: <CarrierArt key={`d${c.Z}_${c.X0}`} A={A} c={c} f={f} crate /> });
  }
  if (onScreen(SHIP.xs - 200, SHIP.xb, SHIP.mastTop, SHIP.zc - SHIP.B, 40)) {
    items.push({ Z: SHIP.zc + SHIP.B, node: <Ship key="ship" A={A} f={f} S={SHIP} uid="sh1" /> });
    items.push({ Z: SHIP.zc + 1, node: <Gangplank key="gang" A={A} /> });
  }
  [{ Z: CART.Z, X0: XK + CART.X0 }, ...CARTS].forEach((c, ci) => {
    const X = cartX(f, c.X0);
    if (onScreen(X - 40, X + 460, -380, c.Z)) items.push({ Z: c.Z, node: <CartArt key={`cart${ci}`} A={A} f={f} Z={c.Z} X0={c.X0} uid={`cart${ci}`} /> });
  });
  items.push({ Z: KILN.z0 + 1, node: <KilnInside key="kin" A={A} f={f} /> });
  items.push({ Z: KILN.z0, node: <KilnFace key="kface" A={A} f={f} /> });
  items.push({ Z: KILN.z0 - 1, node: <Smoke key="smoke" A={A} f={f} /> });
  yardRows.forEach((row, ri) => {
    const Xs = row.Xs.filter((X) => onScreen(X - 40, X + 40, -200, row.Z, 40));
    if (Xs.length) items.push({ Z: row.Z, node: <StackRow key={`yr${ri}`} A={A} Xs={Xs} Y={0} Z={row.Z} n={YARD_STACKS.n} /> });
  });
  BOARDS.zs.forEach((Z, bi) => {
    if (Z < P.zNear + 60) return;
    const Xs = boardXs(Z, XK - 6000, XK + 6000).filter((X) => onScreen(X - BOARDS.len / 2, X + BOARDS.len / 2, -80, Z, 40));
    if (Xs.length) items.push({ Z, node: <BoardRow key={`b${bi}`} A={A} Z={Z} Xs={Xs} bare={Z === -450} /> });
  });
  items.sort((a, b) => b.Z - a.Z);
  return (
    <AirStage v={A.v} bloom={0}>
      <WorldSvg cam={cam}>
        <Floor A={A} x0={XK - 12000} x1={XK + 12000} z1={16000} />
        <River A={A} f={f} />
        <QuayWall A={A} />
        <AirHorizonHazeW A={A} id="haze" />
        {items.map((it) => it.node)}
      </WorldSvg>
      <LowAir A={A} />
    </AirStage>
  );
};

export default ArtisanalToIndustrial;
