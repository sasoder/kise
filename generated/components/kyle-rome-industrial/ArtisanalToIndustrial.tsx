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
// THE MOTION: one continuous, even pull-back and rise from f0 (one speed lobe: a gentle start, an even plateau f55-165,
// a long settle into a creep; zoom 4.2 -> 0.46). f0-92 close on ONE potter at his kick wheel, his hands and the rising
// bowl at the frame's middle (bowl y ~950), riding up its wall as the terracotta bowl rises out of the lump in three
// pulls (the artisan); a row of his finished bowls in the foreground, the district behind him only air. f80-172 the rise
// lifts the identical potters behind him out from behind his back and the neighbouring columns come in from the sides:
// column after column of identical men at identical wheels, boards of drying bowls between them, carriers walking boards
// of bowls on their heads toward the kiln; the kiln emerges out of the air. f172-252 the pull-back reaches the whole
// district: every column converges on one great barrel-vaulted brick kiln at the vanishing point, its front cut away to
// show the load inside (tiers of tall columns of nested bowls), the stoke hole glowing deep red-brown at its foot, smoke
// from its chimney, rows of tall stacks of upturned bowls around and in front of it, a handcart of crated bowls leaving;
// the full reveal lands on "industrial scale" (f217-252). The artisan ends as the first man of the central column
// (bowl x 560, y ~1045; his face <= 997 and hands <= 1051, out of the caption bands on every frame), dimmed 15 %.
// f252-262 settled and alive (wheels, pulls, carriers, cart, smoke, the camera's creep).
// BEATS: f0 the lump under his hands · f41 "scale" the bowl half drawn · f92 "and" the bowl finished, the first
// clones showing in the air · f130 rows on both sides, the kiln emerging · f172 "artisanal" the kiln and its load clear ·
// f217 "industrial" the district whole · f252 settled.
// CAUSE BEFORE EFFECT: the bowl grows only while his hands ride up its wall (heroRise / heroForm share the pulls).
// No orange in this cut (the clip rule: orange = technology; this scale is organisation, not a new machine). Clay and
// bowls terracotta red-brown (rims a lighter highlight), the kiln's brick a duller umber red-brown, the stoke hole a deep
// red-brown glow at most; people never orange.
//
// DEPTH: londonDepth with dRef 3000 at kRef 0.46, dolly 0.6 (Dc ~790 at f0 -> 3000 at the end); the 2D centre moves
// straight (cx on p, cy on p^2) so the vanishing point never swings; the eye rises on p^1.6 from 0.45 m (below the
// bowl: the clones behind him stay behind his back) to 5.6 m. Fog by world depth, its reach growing with the pull-back
// (fogVisAt / fogMaxAt / figVisAt: in the close-up the district dissolves completely). The artisan at X 0, Z 0;
// columns every 460 along X, potters every 600 along Z (none in front of him); boards of drying bowls in rows between
// the near rows; the stacking yard Z 1850-2650 (a lane up the middle) and beside the kiln to Z 5000; the kiln's cut face
// at Z 2900, its back wall 4300, centred on the camera's end line. The lower frame sinks into the dense low air (LowAir).
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
  camOf,
  camP,
  carrierX,
  depthOf,
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
  for (let Z = Y.side.z0; Z <= Y.side.z1; Z += Y.side.dz, k++) rows.push({ Z, Xs: stackXs(XK - Y.side.x1, XK + Y.side.x1, Y.dx, k % 2 ? Y.dx / 2 : 0, (X) => Math.abs(X - XK) < Y.side.x0) });
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
const CartArt: React.FC<{ A: AirWorld; f: number }> = ({ A, f }) => {
  const P = A.P;
  const Z = CART.Z;
  const Xf = cartX(f, XK);
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
const CarrierArt: React.FC<{ A: AirWorld; c: Carrier; f: number }> = ({ A, c, f }) => {
  const P = A.P;
  const X = carrierX(c, f);
  const { at, scale } = P.at(X, c.Z);
  const pose = RomeFolk.POSES.carry(c.dir, f / WALK_CYCLE + c.ph, 1);
  const an = RomeFolk.romeAnchors("slave", pose, at, scale, { variant: c.variant });
  // the board rides on his head (the near hand up at its edge steadying it), clear of his face
  const L = an.headTop as P2;
  const len = 200 * scale;
  const th = 9 * scale;
  const bx0 = L[0] - len * 0.5 - c.dir * 22 * scale;
  const by = L[1] - th + 3 * scale;
  // the near hand under the board's leading half (the near arm is L facing right, R facing left)
  const hold: P2 = [L[0] + c.dir * 34 * scale, by + th + 7 * scale];
  const grip = c.dir > 0 ? { L: hold } : { R: hold };
  const t = (hex: string) => A.tone(hex, c.Z, 280);
  let bowls = "";
  let mouths = "";
  for (let i = 0; i < 4; i++) {
    const cx = bx0 + len * (0.14 + 0.24 * i);
    const s = scale;
    bowls += `M${n2(cx - 13 * s)},${n2(by)}Q${n2(cx - 24 * s)},${n2(by - 8 * s)} ${n2(cx - 25 * s)},${n2(by - 24 * s)}L${n2(cx + 25 * s)},${n2(by - 24 * s)}Q${n2(cx + 24 * s)},${n2(by - 8 * s)} ${n2(cx + 13 * s)},${n2(by)}Z`;
    mouths += ellD(cx, by - 24 * s, 25 * s, 6 * s);
  }
  return (
    <g>
      <AirShadow A={A} X={X} Z={c.Z} w={58} d={28} uid={`cs${c.Z}${c.X0}`} amt={0.7} />
      <RomeFolk.Slave pose={pose} at={at} scale={scale} uid={`cr${c.Z}${c.X0}`} variant={c.variant} inks={{ tunic: "#94826A" }} grip={grip} fog={A.folkFog(c.Z)} unitPx={A.k} />
      <path d={`M${n2(bx0)},${n2(by)}h${n2(len)}v${n2(th)}h${n2(-len)}Z`} fill={t(PLANK.lit)} stroke={t("#3A2B1D")} strokeWidth={A.lw(1)} />
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
const REST = swayCam(camOf(0), 0);

const ArtisanalToIndustrial: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const p = camP(f);
  const cam = swayCam(camOf(p), f);
  const vis = fogVisAt(p);
  const A = airWorldOf({ cam, rest: REST, depth: depthOf(p), frame: f, fogBy: "depth", scene: { fogVis: vis, fogMax: fogMaxAt(p) }, figFog: { near: 150, vis: figVisAt(p), max: figMaxAt(p) } });
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
  if (onScreen(cartX(f, XK) - 40, cartX(f, XK) + 460, -380, CART.Z)) items.push({ Z: CART.Z, node: <CartArt key="cart" A={A} f={f} /> });
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
        <AirHorizonHazeW A={A} id="haze" />
        {items.map((it) => it.node)}
      </WorldSvg>
      <LowAir A={A} />
    </AirStage>
  );
};

export default ArtisanalToIndustrial;
