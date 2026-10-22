// ---------------------------------------------------------------------------
// greekFolk — THE GREEK CAST of the Kyle Harper clip "Why Greek math and science stalled after Euclid"
// (kyle-greek-math), drawn in the picture-book GOUACHE of romeFolk and the pandemics folk: flat matte shapes, no
// outline, ONE soft crescent shadow per part from the upper-left light (FOLK_SHADE 0.4), the same gouache texture
// filter (pandemicFolkPaint folkTexDefs: grain, dry-brush mottling, hand-wobbly edges), a small round head on a pear
// body, dot eyes, a small nose, blush, mitten hands, small feet. People are never orange; ORANGE (#FFB000) = Greek
// mathematical knowledge only: the line diagrams on tablets and scrolls, the armillary rings (crisp glowing lines).
//
// UNITS AND PROPS: exactly RomeFolk's. Figure-local rig units, feet at (0, 0), up -y, a man ~312 to the top of the head
// (scaleForPx(px)); `at` = the feet in world px, `scale` = world px per unit; draw inside the cut's svg (WorldSvg).
// In the kit's air: const { at, scale } = A.P.at(X, Z); <Euclid pose at scale uid fog={A.folkFog(Z)} unitPx={A.k} />
//
// FIGURES  <Scholar variant 0..6 | Euclid | Diophantus | Citizen variant 0..5 ... />  or  <GreekFigure kind ... />
//   pose, at, scale, uid (unique per figure per frame), variant, fog {rgb, amount}, drain 0..1, inks (Partial<GreekInks>),
//   unitPx (cam.k), texture, tone, hideArm: as RomeFolk.
//   grip?: { L?, R? }        world points: that hand's grip lands exactly there (L = the rig's armL = HIS RIGHT hand)
//   held?: Held              what the hands hold, built from the hands every frame (they never let go):
//     { two: "tablet" | "scroll", diagram, tilt }  a wax tablet / an open scroll between the two hands; the hands are
//                            solved onto its two side edges (TABLET.w / SCROLL.w apart) wherever the pose puts it
//     { L | R: "dividers" | "pen" | "stick" | "scrollClosed" | "scrollHang" }  one-hand things (diagram for scrollHang)
//   diagram?: DiagramSpec    "thales" | "pythagoras" | "lunes" | "exhaustion" | "solids" | "elements" | "arithmetica"
//                            | { lines: P2[][] (unit square -1..1, y down), fills? }   (shorthand for held.diagram)
//   itemAt?: { c: P2, ang? } world centre (and screen angle, deg) of the two-hand thing: the hands land on its edges
//   stickTo?: P2             world point ON THE GROUND for the stick's tip: the stick hand is solved so the tip lands
//                            there (crouchDraw; drive it along a path); the tip always stays on the ground line
//   groundY?: number         world y of the ground for the stick (default at[1], the feet)
//   dividersOpen?: deg, hangAng?: deg (the hanging scroll's swing toward his facing), dress / hair / beard overrides
// LOOKS (palette and words in GREEK_FOLK_READY.md): Scholar 0 old bald white-bearded (Thales) · 1 long hair, white robe
//   (Pythagoras) · 2 curly dark beard · 3 young, beardless (Theaetetus) · 4 short grey beard · 5 broad, middle-aged ·
//   6 Alexandrian (later era: darker skin, fillet, linen chiton with pleats, bordered himation). Euclid (the hero:
//   cream himation, dusty-teal border, neat dark-brown lobed beard, calm). Diophantus (older, grey beard, slate
//   himation). Citizen 0 man in himation · 1 young man bare-armed (exomis) · 2 older man · 3 woman, himation over her
//   head · 4 woman, himation on her shoulders · 5 young woman, peplos.
// POSES (dir 1 = facing screen right, -1 left; pure; yaw where given turns the body-space pose to any view):
//   all of RomeFolk.POSES (front stand walk gesture point ...), plus
//   lookUp(dir, t)          the chin lifts (looking up the stair)
//   holdTablet(dir, yaw?)   the tablet at the chest, its face to us        -> held={{ two: "tablet", diagram }}
//   offerUp(dir, t, phase?) from holdTablet (t 0) to the tablet raised above the head toward the step above (t 1)
//   holdScroll(dir, yaw?)   EUCLID: the Elements hanging open from his left hand, the dividers raised in his right
//                           -> held={{ R: "scrollHang", L: "dividers" }} (EUCLID_HELD); yaw 0 front .. PI back
//   write(dir, phase, seated?)  DIOPHANTUS: the scroll hanging open in his left hand, the reed pen in his right
//                           writing along its lines (phase 0..1 = four lines) -> DIOPHANTUS_HELD; seated on a Stool
//                           (STOOL_SEAT) with seated = true
//   crouchDraw(dir, phase)  crouched, drawing in the sand with a long stick (the tip loops on the ground); with
//                           stickTo the cut drives the tip -> held={{ L: "stick" }} (dir 1: his right hand is near)
//   turnHead(q, yaw)        RomeFolk.headTurn: the head's yaw (absolute); a slow head turn never flips
//   standAt(yaw)            standing, arms hanging, at any body yaw 0 .. PI (RomeFolk's stand / front are fixed views)
// THE ARMS IN 3D: the new poses are GPose = FigPose + dz (each hand's camera-space depth, + toward us); the elbow is
//   solved in 3D and projected (a forearm coming at us foreshortens instead of folding sideways), and each arm's
//   upper part and forearm go in front of / behind the body by their own depth (crossfades, never pops). Blend and
//   mirror GPoses with THIS module's lerpFig / mirrorPose (RomeFolk's drop dz: the hands then fall back to their
//   shoulders' depth). RomeFolk's own poses (no dz) work as they are: hands at the shoulders' depth.
// ANCHORS greekAnchors(kind, pose, at, scale, { variant, grip, held, stickTo, itemAt, groundY }) -> world: headC headTop
//   headR, handL handR handNear handFar wristL wristR shoulderL shoulderR ankleL ankleR chest hip feet, stickTip,
//   tablet {c, corners}, scroll {c, corners}, penTip, dividersTips
// PROPS (same gouache; `at` = floor point unless said; scale like a man's; fog / unitPx / uid / tone):
//   Tablet {at = centre, diagram, angle?, tilt?}, Scroll {at = centre, open?, diagram, angle?}, Dividers {at = hinge,
//   angle?, open?}, Stick {at = one end, angle, len?}, ArmillarySphere {at, turn?, size?} (stand + ORANGE rings),
//   Stool {at, seat?} (a diphros), and RomeFolk's props re-exported.
// AIR: RomeContactShadow / the kit's AirShadow under every figure; fog as RomeFolk (A.folkFog(Z)).
// CROWDS: GREEK_CROWD (12 drawings, three scholars with small orange tablets / a scroll), ROMAN_CROWD (10, RomeFolk's
//   Freeman / Dominus / Slave / Overseer and women, no orange); crowdReq("greek" | "roman", i, hPx) -> SpriteReq;
//   crowdTier(hPx); useFolkSprites / blitFolk / FolkCanvas re-exported; crowdVeils(...) + drawCrowd(...) draw a few
//   hundred figures far to near with fog by depth band (TuberculosisToll's pattern). Probes: greekFolkProbe.tsx.
// ---------------------------------------------------------------------------
import React, { createContext, useContext } from "react";
import { add, mix, mul, norm, rot, sub } from "../kits/maps/stringsMotion";
import { type FigPose, type Spec } from "../kits/maps/texcocoFigures";
import { PAINT, blitFolk, folkTexDefs, mixC, type Shape, type Sprite, type SpriteReq } from "../kyle-pandemics/pandemicFolkPaint";
import { FOLK_SHADE, POSES as ROME_POSES, headTurn, lerpFig as lerpFig0, mirrorPose as mirrorPose0, type FolkFog, type RomeKind } from "../kyle-rome-slavery/romeFolk";
import { buildRomeFolk } from "../kyle-rome-slavery/romeFolkBody";
import {
  ACCENT,
  ACCENT_DEEP,
  BRONZE,
  DIVIDERS,
  FU,
  PAPYRUS,
  SCROLL,
  STICK,
  TABLET,
  WAX,
  WOOD,
  buildGreekFolk,
  defaultDz,
  diagramArt,
  greekArms,
  greekSpec,
  type GPose,
  type DiagramSpec,
  type GBeard,
  type GDress,
  type GHair,
  type GShape,
  type GreekInks,
  type GreekKind,
  type Held,
} from "./greekFolkBody";
import { closedD, ellD, lineD, tubeD } from "../kyle-rome-slavery/romeFolkBody";

export { ACCENT, ACCENT_DEEP, BRONZE, CLOTH, DIVIDERS, FU, GREEK_VARIANTS, HAIR, PAPYRUS, PEN, SCROLL, SKIN, STICK, TABLET, WAX, WOOD, MAN, WOMAN, diagramArt, greekLookOf, greekSpec } from "./greekFolkBody";
export type { DiagramSpec, Diagram, GBeard, GDress, GHair, GShape, GreekInks, GreekKind, Held, OneHeld, GLook, GPose, GArm } from "./greekFolkBody";
export { greekArms, defaultDz } from "./greekFolkBody";
// RomeFolk's plumbing (the same rig maths, idle, walk, mirror, scale) and its props, for the Roman side of cut F
export { headTurn, idle, scaleForPx, walkAdvance, walkPose, WALK_CYCLE, poseTrack, track, RomeContactShadow, AIR_SHADOW, FOLK_SHADE, DEAD, Amphora, Sack, Basket, CoinHeap, Couch, Hammer, Pick, Rod } from "../kyle-rome-slavery/romeFolk";
export type { FigPose, ArmPose, FolkFog } from "../kyle-rome-slavery/romeFolk";
export { useFolkSprites, blitFolk, FolkCanvas, type Sprite, type SpriteReq } from "../kyle-pandemics/pandemicFolkPaint";

type P2 = [number, number];
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => v * v * (3 - 2 * v);
const PI = Math.PI;
/** a Greek man's height in rig units (soles to the top of the head), as RomeFolk's ~325 */
export const MAN_UNITS = 325;

/** RomeFolk's lerpFig, carrying the hands' depth (GPose.dz; a pose without it has its hands at the shoulders' depth) */
export const lerpFig = (a: GPose, b: GPose, t: number): GPose => {
  const da = a.dz ?? defaultDz(a);
  const db = b.dz ?? defaultDz(b);
  return { ...lerpFig0(a, b, t), dz: [mix(da[0], db[0], t), mix(da[1], db[1], t)] };
};
/** RomeFolk's mirrorPose, carrying the hands' depth (the arms swap) */
export const mirrorPose = (q: GPose): GPose => (q.dz ? { ...mirrorPose0(q), dz: [q.dz[1], q.dz[0]] } : mirrorPose0(q));

// ===================================================================================================================
// FOG and THE PAINT (romeFolk's Paint, shape for shape, plus the glowing orange lines outside the texture)
// ===================================================================================================================
const rgbHex = (c: [number, number, number]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const fogHexOf = (f: FolkFog) => (typeof f.rgb === "string" ? f.rgb : rgbHex(f.rgb));
const isOrange = (c: string) => c === ACCENT || c === ACCENT_DEEP;
const applyFog = (shapes: GShape[], fog: FolkFog | null | undefined): GShape[] => {
  if (!fog || fog.amount <= 0.001) return shapes;
  const to = fogHexOf(fog);
  const t = c01(fog.amount);
  // orange (the one glowing material) takes half the fog, as the kit's toneO
  return shapes.map((s) => ({ ...s, fill: mixC(s.fill, to, s.glow !== undefined || s.gfill || isOrange(s.fill) ? 0.5 * t : t) }));
};
const TexCtx = createContext<{ shared: boolean }>({ shared: false });
/** one texture filter over a tight group of figures (as RomeFolkLayer) */
export const GreekFolkLayer: React.FC<{ uid: string; px?: number; unitPx?: number; children?: React.ReactNode }> = ({ uid, px = 0.4, unitPx = 1, children }) => (
  <TexCtx.Provider value={{ shared: true }}>
    <defs>{folkTexDefs(uid, px, unitPx)}</defs>
    <g filter={`url(#${uid}tx)`}>{children}</g>
  </TexCtx.Provider>
);
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
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
/** the halo of a glowing line: this many times its width, at this opacity */
export const GLOW = { halo: 3.2, haloOp: 0.2 };
const GPaint: React.FC<{ shapes: GShape[]; at: P2; scale: number; uid: string; tone?: number; fog?: FolkFog | null; unitPx?: number; texture?: boolean }> = ({ shapes, at, scale: sc0, uid, tone = 1, fog = null, unitPx = 1, texture }) => {
  const ctx = useContext(TexCtx);
  const tex = texture ?? !ctx.shared;
  const scale = sc0 / FU;
  const S = applyFog(shapes, fog);
  const pxf = (scale * unitPx * 512) / 860;
  const blurU = PAINT.shadeBlur / (scale * unitPx);
  const shade = (c: string) => mixC(c, FOLK_SHADE.to, FOLK_SHADE.amt);
  const off = PAINT.shadeOff;
  const pad = off * 1.2 + blurU * 3 + 2;
  const tfm = `translate(${n3(at[0])} ${n3(at[1])}) scale(${n3(scale)})`;
  const shapeEl = (s: GShape, i: number) => {
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
  };
  const glowEl = (s: GShape, i: number) => {
    const op = s.op ?? 1;
    if (op <= 0.002 || !s.d) return null;
    if (s.gfill) return <path key={i} d={s.d} fill={s.fill} opacity={op} />;
    const w = s.glow ?? 2;
    return (
      <g key={i}>
        <path d={s.d} fill="none" stroke={s.fill} strokeWidth={n3(w * GLOW.halo)} strokeLinecap="round" strokeLinejoin="round" opacity={n3(GLOW.haloOp * op)} />
        <path d={s.d} fill="none" stroke={s.fill} strokeWidth={n3(w)} strokeLinecap="round" strokeLinejoin="round" opacity={n3(op)} />
      </g>
    );
  };
  // runs of painted shapes (one texture filter, referenced per run) and of glowing shapes (crisp, no texture)
  const runs: { glow: boolean; items: [GShape, number][] }[] = [];
  S.forEach((s, i) => {
    const g = s.glow !== undefined || !!s.gfill;
    const last = runs[runs.length - 1];
    if (last && last.glow === g) last.items.push([s, i]);
    else runs.push({ glow: g, items: [[s, i]] });
  });
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
      {runs.map((rn, j) =>
        rn.glow ? (
          <g key={j} transform={tfm}>
            {rn.items.map(([s, i]) => glowEl(s, i))}
          </g>
        ) : (
          <g key={j} filter={tex ? `url(#${uid}tx)` : undefined}>
            <g transform={tfm}>{rn.items.map(([s, i]) => shapeEl(s, i))}</g>
          </g>
        ),
      )}
    </g>
  );
};

// ===================================================================================================================
// SOLVING THE HANDS (grips, the two-hand thing, the stick)
// ===================================================================================================================
/** romeCast's gripTo on a Greek build (the 3D arms' grips): the arms solved so the hand grips land on world points */
export const gripToG = (spec: Spec, pose: GPose, grip: { L?: P2; R?: P2 }, at: P2, scale: number): GPose => {
  let q = pose;
  for (let it = 0; it < 8; it++) {
    const ga = greekArms(spec, q);
    const solve = (T: P2 | undefined, ar: typeof ga.L, ap: FigPose["armL"]) => {
      if (!T) return ap;
      const t: P2 = [(T[0] - at[0]) / scale, (T[1] - at[1]) / scale];
      return { ...ap, w: sub(t, mul(ar.dir, 11 * spec.limb)) };
    };
    q = { ...q, armL: solve(grip.L, ga.L, q.armL), armR: solve(grip.R, ga.R, q.armR) };
  }
  return q;
};
export type SolveOpts = { variant?: number; grip?: { L?: P2; R?: P2 }; held?: Held; stickTo?: P2; itemAt?: { c: P2; ang?: number }; groundY?: number };
/** the pose a figure actually takes: the two-hand thing fitted (its edges in the hands), the stick's tip on its
 *  target, then explicit grips */
export const solveGreekPose = (kind: GreekKind, pose: GPose, at: P2, scale: number, o: SolveOpts = {}): GPose => {
  const spec = greekSpec(kind, o.variant ?? 0);
  let q = pose;
  const W = (p: P2): P2 => [at[0] + p[0] * scale, at[1] + p[1] * scale];
  const held = o.held ?? {};
  if (held.two) {
    const ga = greekArms(spec, q);
    const gl = ga.L.grip;
    const gr = ga.R.grip;
    const width = (held.two === "tablet" ? TABLET.w : SCROLL.w) - 6;
    let c: P2;
    let u: P2;
    if (o.itemAt) {
      c = [(o.itemAt.c[0] - at[0]) / scale, (o.itemAt.c[1] - at[1]) / scale];
      const a = ((o.itemAt.ang ?? 0) * PI) / 180;
      u = [Math.cos(a), Math.sin(a)];
    } else {
      c = [(gl[0] + gr[0]) / 2, (gl[1] + gr[1]) / 2];
      // the thing stays face-on and level-ish: tilted only by the hands' height difference (never spun round when
      // the hands come close on screen as he turns)
      const d = gl[0] <= gr[0] ? sub(gr, gl) : sub(gl, gr);
      const slope = Math.max(-0.3, Math.min(0.3, d[1] / Math.max(30, Math.abs(d[0]))));
      u = norm([1, slope]);
    }
    const left = add(c, mul(u, -width / 2));
    const right = add(c, mul(u, width / 2));
    // the hand that is on the left now takes the left edge (no crossing)
    const lFirst = gl[0] <= gr[0];
    q = gripToG(spec, q, { L: W(lFirst ? left : right), R: W(lFirst ? right : left) }, at, scale);
  }
  const stickKey = held.L === "stick" ? "L" : held.R === "stick" ? "R" : null;
  if (stickKey && o.stickTo) {
    const ga = greekArms(spec, q);
    const ar = ga[stickKey];
    const G = Math.sin(q.yaw) >= 0 ? 1 : -1;
    const T0: P2 = [(o.stickTo[0] - at[0]) / scale, (o.stickTo[1] - at[1]) / scale];
    // within the stick's reach in front of him (a soft clamp: the hand never passes under his shoulder)
    const fwdX = G * T0[0];
    const lo = STICK.reach[0];
    const hi = STICK.reach[1];
    const sc = (v: number) => (v < lo + 10 ? lo + 10 * Math.exp((v - lo - 10) / 10) : v > hi - 10 ? hi - 10 * Math.exp((hi - 10 - v) / 10) : v);
    const T: P2 = [G * sc(fwdX), T0[1]];
    const gy = ar.grip[1];
    const dy = T[1] - gy;
    const dx = Math.sqrt(Math.max(0, STICK.len * STICK.len - dy * dy));
    q = gripToG(spec, q, { [stickKey]: W([T[0] - G * dx, gy]) }, at, scale);
  }
  if (o.grip) q = gripToG(spec, q, o.grip, at, scale);
  return q;
};

// ===================================================================================================================
// THE CAST MEMBER
// ===================================================================================================================
export type GreekFigureProps = {
  kind: GreekKind;
  pose: GPose;
  at: P2;
  scale: number;
  uid: string;
  variant?: number;
  tone?: number;
  fog?: FolkFog;
  drain?: number;
  inks?: Partial<GreekInks>;
  unitPx?: number;
  texture?: boolean;
  grip?: { L?: P2; R?: P2 };
  held?: Held;
  diagram?: DiagramSpec;
  itemAt?: { c: P2; ang?: number };
  stickTo?: P2;
  groundY?: number;
  dividersOpen?: number;
  hangAng?: number;
  dress?: GDress;
  hair?: GHair;
  beard?: GBeard;
  hideArm?: "L" | "R";
};
const heldOf = (p: { held?: Held; diagram?: DiagramSpec }): Held | undefined => (p.held ? { ...p.held, diagram: p.held.diagram ?? p.diagram } : undefined);
export const GreekFigure: React.FC<GreekFigureProps> = (p) => {
  const held = heldOf(p);
  const q = solveGreekPose(p.kind, p.pose, p.at, p.scale, { variant: p.variant, grip: p.grip, held, stickTo: p.stickTo, itemAt: p.itemAt, groundY: p.groundY });
  const b = buildGreekFolk(p.kind, p.variant ?? 0, q, {
    held,
    inks: p.inks,
    drain: p.drain,
    dress: p.dress,
    hair: p.hair,
    beard: p.beard,
    groundY: p.groundY !== undefined ? (p.groundY - p.at[1]) / p.scale : 0,
    dividersOpen: p.dividersOpen,
    hangAng: p.hangAng,
    hideArm: p.hideArm,
  });
  return <GPaint shapes={b.shapes} at={p.at} scale={p.scale} uid={p.uid} tone={p.tone} fog={p.fog} unitPx={p.unitPx} texture={p.texture} />;
};
type CastProps = Omit<GreekFigureProps, "kind" | "uid"> & { uid?: string };
/** a Greek mathematician: variant 0..6 */
export const Scholar: React.FC<CastProps> = ({ uid = "sch", ...p }) => <GreekFigure kind="scholar" uid={uid} {...p} />;
/** EUCLID, the hero (pose holdScroll + held EUCLID_HELD for the Elements and the dividers) */
export const Euclid: React.FC<CastProps> = ({ uid = "euc", ...p }) => <GreekFigure kind="euclid" uid={uid} {...p} />;
/** Diophantus of Alexandria (pose write + held DIOPHANTUS_HELD) */
export const Diophantus: React.FC<CastProps> = ({ uid = "dio", ...p }) => <GreekFigure kind="diophantus" uid={uid} {...p} />;
/** an Athenian: variant 0..2 men, 3..5 women */
export const Citizen: React.FC<CastProps> = ({ uid = "cit", ...p }) => <GreekFigure kind="citizen" uid={uid} {...p} />;
/** Euclid's things: the Elements hanging open from his left hand (the rig's armR), the dividers in his right */
export const EUCLID_HELD: Held = { R: "scrollHang", L: "dividers", diagram: "elements" };
/** Diophantus' things: the Arithmetica hanging open from his left hand, the reed pen in his right */
export const DIOPHANTUS_HELD: Held = { R: "scrollHang", L: "pen", diagram: "arithmetica" };

/** world anchors (the same solve as the figure: pass the same held / grip / stickTo / itemAt) */
export const greekAnchors = (kind: GreekKind, pose: GPose, at: P2, scale: number, o: SolveOpts & { diagram?: DiagramSpec } = {}) => {
  const held = heldOf(o);
  const q = solveGreekPose(kind, pose, at, scale, { ...o, held });
  const spec = greekSpec(kind, o.variant ?? 0);
  const ga = greekArms(spec, q);
  const r = ga.rig;
  const b = buildGreekFolk(kind, o.variant ?? 0, q, { held, groundY: o.groundY !== undefined ? (o.groundY - at[1]) / scale : 0 });
  const w = (v: P2): P2 => [at[0] + v[0] * scale, at[1] + v[1] * scale];
  const G = r.s >= 0 ? 1 : -1;
  const it = b.items;
  return {
    pose: q,
    headC: w(b.headC),
    headTop: w(b.headTop),
    headR: b.headR * scale,
    handL: w(ga.L.grip),
    handR: w(ga.R.grip),
    handNear: w(G > 0 ? ga.L.grip : ga.R.grip),
    handFar: w(G > 0 ? ga.R.grip : ga.L.grip),
    wristL: w(r.armL.W),
    wristR: w(r.armR.W),
    shoulderL: w(r.armL.S),
    shoulderR: w(r.armR.S),
    ankleL: w(r.legL.A),
    ankleR: w(r.legR.A),
    chest: w(r.toFig([0, -spec.H * 0.7])),
    hip: w(r.hip),
    feet: at,
    stickTip: it.stickTip ? w(it.stickTip) : null,
    tablet: it.tablet ? { c: w(it.tablet.c), corners: it.tablet.corners.map(w) } : null,
    scroll: it.scroll ? { c: w(it.scroll.c), corners: it.scroll.corners.map(w) } : null,
    penTip: it.penTip ? w(it.penTip) : null,
    dividersTips: it.dividersTips ? (it.dividersTips.map(w) as [P2, P2]) : null,
  };
};

// ===================================================================================================================
// POSES (rig units; dir 1 = facing screen right). New poses are authored in BODY space (side + = his left, fwd + = in
// front of him, h = height) and turned to the screen by the body yaw, so any view (front .. back) is the same pose.
// ===================================================================================================================
type BArm = { side: number; h: number; fwd: number; out?: number; fist?: number; hand?: number };
const toArm = (yaw: number, sgn: -1 | 1, a: BArm): FigPose["armL"] => {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  const eo = a.out ?? 0.5;
  return { w: [a.side * c + a.fwd * s, a.h], elbow: [sgn * eo * c - 0.35 * s, 1], fist: a.fist ?? 0.4, hand: a.hand ?? 0 };
};
/** a hand's camera-space depth (+ toward us) from body space */
const depthOf = (yaw: number, a: BArm) => -a.side * Math.sin(yaw) + a.fwd * Math.cos(yaw);
const STAND0: FigPose = ROME_POSES.front();
/** a pose in body space: his right arm (the rig's armL, side < 0) and his left (armR); the hands' depths go in dz */
const bodyPose = (yaw: number, base: Partial<FigPose>, right: BArm, left: BArm): GPose => ({
  ...STAND0,
  footL: [0, 0],
  footR: [0, 0],
  ...base,
  yaw,
  headYaw: base.headYaw ?? yaw,
  armL: toArm(yaw, -1, right),
  armR: toArm(yaw, 1, left),
  dz: [depthOf(yaw, right), depthOf(yaw, left)],
});
const face = (q: GPose, dir: 1 | -1): GPose => (dir === 1 ? q : mirrorPose(q));
const frac = (v: number) => v - Math.floor(v);
const Y3 = 0.62;
/** the stool's seat height (rig units) for the seated write */
export const STOOL_SEAT = 84;
const feetOf = (yaw: number, back: number, fwd: number): Partial<FigPose> => ({ footL: [-back * Math.sin(yaw), 0], footR: [fwd * Math.sin(yaw), -2] });

/** the tablet's hands from the chest (t 0) forward and up past the face to above the head (t 1): a quadratic arc in
 *  body space, so the tablet rises in front of him and comes over his head (no straight line through his face) */
const offerP = (yaw: number, t: number, lift = 0): GPose => {
  const e = ease(c01(t));
  const bz = (a: number, m: number, b: number) => (1 - e) * (1 - e) * a + 2 * e * (1 - e) * m + e * e * b;
  const arm = (sg: -1 | 1): BArm => ({
    side: sg * bz(30, 28, 32),
    h: bz(-196, -330, -354 - lift),
    fwd: bz(46, 92, 20),
    fist: 0.5,
    hand: sg * bz(10, 14, 20),
    out: bz(0.5, 0.6, 0.8),
  });
  return bodyPose(yaw, { pitch: bz(6, -6, -18), lean: -3 * e * Math.sign(Math.sin(yaw) || 1), ...feetOf(yaw, mix(6, 10, e), mix(8, 10, e)), brow: bz(-0.1, -0.2, -0.25) }, arm(-1), arm(1));
};
const holdTabletP = (yaw = Y3): GPose => offerP(yaw, 0);
const scrollP = (yaw = 0.35): GPose =>
  bodyPose(yaw, { pitch: 3, ...feetOf(yaw, 4, 10), brow: -0.1 }, { side: -50, h: -208, fwd: 34, fist: 0.8, hand: -38, out: 0.75 }, { side: 22, h: -190, fwd: 34, fist: 0.8, hand: 0, out: 0.55 });
/** where the reed pen's tip sits on Diophantus' hanging sheet (body space): line 0..3, x 0..1 across */
const writeP = (dir: 1 | -1, phase: number, seated: boolean, yaw: number): GPose => {
  const drop = seated ? 152 - STOOL_SEAT - 6 : 0;
  const ln = Math.floor(frac(phase) * 4);
  const u = frac(frac(phase) * 4);
  // across the line, then the return to the next line's start (the last 26 %), dropping one line as it returns;
  // after the fourth line the hand rises back to the first (the loop)
  const ret = u < 0.74 ? 0 : ease((u - 0.74) / 0.26);
  const x = u < 0.74 ? ease(u / 0.74) : 1 - ret;
  const lineY = ln < 3 ? ln + ret : 3 * (1 - ret);
  const base: Partial<FigPose> = seated
    ? { crouch: drop, lean: 4, pitch: 22, footL: [40, 0], footR: [54, -2], liftL: -6, liftR: -6, brow: 0.15, lids: 0.35 }
    : { pitch: 22, lean: 3, ...feetOf(yaw, 6, 8), brow: 0.15, lids: 0.35 };
  // the scroll's top roller in his left hand at the chest; the pen hand writing on the sheet below it
  const left: BArm = { side: 18, h: -194 + drop, fwd: 40, fist: 0.85, out: 0.5 };
  const right: BArm = { side: mix(-6, 30, x) - 6, h: -166 + drop + lineY * 8 + 1.5 * Math.sin(PI * 8 * Math.min(u, 0.74)) * (u < 0.74 ? 1 : 0), fwd: 50, fist: 0.9, hand: 20, out: 0.55 };
  return face(bodyPose(yaw, base, right, left), dir);
};
const crouchP = (phase: number): GPose => {
  const yaw = 0.98;
  const ph = 2 * PI * phase;
  const tipX = 172 + 26 * Math.cos(ph);
  const hy = -110 + 3 * Math.sin(ph);
  const dx = Math.sqrt(STICK.len * STICK.len - hy * hy);
  const hx = tipX - dx;
  return {
    ...STAND0,
    yaw,
    headYaw: yaw - 0.05,
    lean: 26,
    crouch: 84,
    pitch: 24,
    roll: 0,
    footL: [-24, 0],
    footR: [22, 0],
    liftL: 38,
    liftR: 0,
    armL: { w: [hx - 10, hy + 4], elbow: [-0.3, 1], fist: 1, hand: 10 },
    armR: { w: [52, -96], elbow: [0.2, 1], fist: 0.3, hand: 20 },
    dz: [48, 4],
    brow: 0.2,
    lids: 0.3,
    mouth: 0,
    hem: 0,
  };
};

export const POSES = {
  ...ROME_POSES,
  /** t 0..1: the chin lifts to look up (the stair above) */
  lookUp: (dir: 1 | -1 = 1, t = 1) => {
    const q = ROME_POSES.stand(1);
    return face({ ...q, pitch: q.pitch - 26 * t, headYaw: q.headYaw - 0.12 * t, brow: -0.25 * t }, dir);
  },
  /** the wax tablet held at the chest, its face to us (held={{ two: "tablet", diagram }}); yaw: the body's turn */
  holdTablet: (dir: 1 | -1 = 1, yaw = Y3) => face(holdTabletP(yaw), dir),
  /** t 0..1: from holdTablet to the tablet raised above the head toward the step above; phase: a slow lift (loop) */
  offerUp: (dir: 1 | -1 = 1, t = 1, phase = 0, yaw = Y3) => face(offerP(yaw, t, 6 * ((1 - Math.cos(2 * PI * phase)) / 2) * c01(t)), dir),
  /** EUCLID: the Elements hanging open from his left hand at the chest, the dividers raised in his right
   *  (held EUCLID_HELD); yaw 0 = front, 0.35 = his three-quarter (default), PI/2 profile, PI = from behind */
  holdScroll: (dir: 1 | -1 = 1, yaw = 0.35) => face(scrollP(yaw), dir),
  /** DIOPHANTUS: the scroll hanging open from his left hand, the reed pen in his right writing along its lines
   *  (phase 0..1 = four lines, left to right, a quick return between); seated on a Stool (STOOL_SEAT) */
  write: (dir: 1 | -1 = 1, phase = 0, seated = false, yaw = 0.7) => writeP(dir, phase, seated, yaw),
  /** crouched, drawing in the sand with a long stick in his right (near) hand (held={{ L: "stick" }}), the other hand
   *  on his knee; phase 0..1 loops the tip on the ground ahead (or drive it with stickTo) */
  crouchDraw: (dir: 1 | -1 = 1, phase = 0) => face(crouchP(phase), dir),
  /** standing with the arms hanging at the sides, turned to any body yaw (0 front .. PI from behind): the arms in body
   *  space, so they never cross over at the back (added after READY; see SHARED_CHANGES.md) */
  standAt: (yaw = Y3) => bodyPose(yaw, { ...feetOf(yaw, 6, 8) }, { side: -54, h: -140, fwd: 4, fist: 0.3, out: 0.3 }, { side: 54, h: -140, fwd: 4, fist: 0.3, out: 0.3 }),
  /** the head's yaw (absolute, rad): a slow head turn never flips */
  turnHead: (q: GPose, yaw: number, nod = 0): GPose => ({ ...headTurn(q, yaw, nod), dz: q.dz }),
};
export type GreekPoseName = keyof typeof POSES;

// ===================================================================================================================
// PROPS
// ===================================================================================================================
type PropBase = { at: P2; scale: number; uid: string; tone?: number; fog?: FolkFog; unitPx?: number; texture?: boolean };
const PropPaint: React.FC<{ p: PropBase; shapes: GShape[] }> = ({ p, shapes }) => <GPaint shapes={shapes} at={p.at} scale={p.scale} uid={p.uid} tone={p.tone} fog={p.fog} unitPx={p.unitPx} texture={p.texture} />;
const glowL = (lines: P2[][], w: number, op = 1, col = ACCENT): GShape[] => (lines.length ? [{ d: lines.map((l) => lineD(l)).join(" "), fill: col, glow: w * FU, op }] : []);
/** a diagram's shapes on a face mapped by T (unit square -> rig units) */
const diagramShapes = (dg: DiagramSpec, T: (p: P2) => P2, size: number, onLight: boolean): GShape[] => {
  const art = diagramArt(dg);
  const w = Math.max(1.3, size * 0.034);
  const col = onLight ? ACCENT_DEEP : ACCENT;
  return [
    ...art.fills.map((f) => ({ d: closedD(f.map(T), 0.4), fill: ACCENT, gfill: true, op: onLight ? 0.35 : 0.28, sh: 0 }) as GShape),
    ...glowL(art.thin.map((l) => l.map(T)), w * 0.55, 0.7, col),
    ...glowL(art.lines.map((l) => l.map(T)), w, 1, col),
  ];
};
/** a wax tablet on its own (leaning, lying, carried by a cut): at = its centre, angle (deg), tilt 0..0.7 */
export const Tablet: React.FC<PropBase & { diagram?: DiagramSpec; angle?: number; tilt?: number; size?: number }> = (p) => {
  const k = p.size ?? 1;
  const a = ((p.angle ?? 0) * PI) / 180;
  const u: P2 = [Math.cos(a), Math.sin(a)];
  const nUp: P2 = [u[1], -u[0]];
  const hw = (TABLET.w / 2) * k;
  const hh = (TABLET.h / 2) * k * (1 - 0.6 * c01(p.tilt ?? 0));
  const M = (q: P2): P2 => add(mul(u, q[0] * hw), mul(nUp, -q[1] * hh));
  const S: GShape[] = [];
  S.push({ d: closedD([M([-1, 1]), M([1, 1]), add(M([1, 1]), mul(nUp, -4 * k)), add(M([-1, 1]), mul(nUp, -4 * k))], 0.3), fill: WOOD.dark, sh: 0 });
  S.push({ d: closedD([M([-1, -1]), M([1, -1]), M([1, 1]), M([-1, 1])], 0.18), fill: WOOD.mid });
  const fx = 1 - (TABLET.frame * k) / hw;
  const fy = 1 - (TABLET.frame * k) / hh;
  S.push({ d: closedD([M([-fx, -fy]), M([fx, -fy]), M([fx, fy]), M([-fx, fy])], 0.12), fill: WAX, sh: 0.5 });
  S.push(...diagramShapes(p.diagram ?? "thales", (q) => M([q[0] * fx * 0.86, q[1] * fy * 0.84]), Math.min(hw, hh) * 2, false));
  return <PropPaint p={p} shapes={S} />;
};
/** a scroll on its own: open (flat, the sheet between two rollers; at = centre) or closed (a roll; at = centre) */
export const Scroll: React.FC<PropBase & { open?: boolean; diagram?: DiagramSpec; angle?: number; size?: number }> = (p) => {
  const k = p.size ?? 1;
  const a = ((p.angle ?? 0) * PI) / 180;
  const u: P2 = [Math.cos(a), Math.sin(a)];
  const nUp: P2 = [u[1], -u[0]];
  const S: GShape[] = [];
  if (!p.open) {
    S.push({ d: tubeD([mul(u, -24 * k), mul(u, 24 * k)], [12 * k, 12 * k]), fill: PAPYRUS.lit });
    S.push({ d: ellD(mul(u, 25 * k), 4 * k, 6 * k, (a * 180) / PI), fill: PAPYRUS.dark, sh: 0 });
    return <PropPaint p={p} shapes={S} />;
  }
  const hw = (SCROLL.w / 2) * k;
  const hh = (SCROLL.h / 2) * k;
  const M = (q: P2): P2 => add(mul(u, q[0] * hw), mul(nUp, -q[1] * hh));
  S.push({ d: closedD([M([-1, -0.92]), M([0, -0.98]), M([1, -0.92]), M([1, 0.94]), M([0, 0.98]), M([-1, 0.94])], 0.35), fill: PAPYRUS.mid });
  for (const sg of [-1, 1]) S.push({ d: tubeD([M([sg, -1.2]), M([sg, 1.2])], [SCROLL.roll * 2 * k, SCROLL.roll * 2 * k]), fill: PAPYRUS.lit });
  const dg = p.diagram ?? "elements";
  if (dg === "arithmetica") {
    const art = diagramArt("arithmetica");
    void art;
    const T = (q: P2): P2 => M([mix(-0.82, 0.82, q[0]), mix(-0.78, 0.78, q[1])]);
    S.push(...glowL(glyphLines(5, 3).map((l) => l.map(T)), Math.max(1.2, hh * 0.075), 1, ACCENT_DEEP));
  } else {
    S.push(...diagramShapes(dg, (q) => M([-0.45 + q[0] * 0.42, q[1] * 0.78]), hh * 1.6, true));
    S.push(...glowL(noteLines(6, 2).map((l) => l.map((q) => M([mix(0.08, 0.86, q[0]), mix(-0.76, 0.76, q[1])]))), Math.max(1.0, hh * 0.05), 0.85, ACCENT_DEEP));
  }
  return <PropPaint p={p} shapes={S} />;
};
// (the scroll's notation, as greekFolkBody's private helpers: rows of algebra-like marks / short text lines)
const hsh = (i: number, seed: number) => {
  const s = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
const glyphLines = (rows: number, seed: number): P2[][] => {
  const out: P2[][] = [];
  for (let r = 0; r < rows; r++) {
    const y = (r + 0.5) / rows;
    const h = 0.42 / rows;
    let x = 0.04 + 0.04 * hsh(r, seed);
    let g = 0;
    while (x < 0.92) {
      const kind = Math.floor(hsh(r * 31 + g * 7, seed) * 5);
      const w = h * (kind === 3 ? 0.4 : 0.85);
      if (kind === 0) out.push([[x, y - h * 0.5], [x + w * 0.9, y - h * 0.5], [x + w * 0.2, y + h * 0.1], [x + w * 0.6, y + h * 0.5]]);
      else if (kind === 1) out.push([[x, y + h * 0.5], [x + w * 0.5, y - h * 0.5], [x + w, y + h * 0.5], [x, y + h * 0.5]]);
      else if (kind === 2) out.push([[x, y - h * 0.5], [x + w * 0.5, y], [x + w, y - h * 0.5]], [[x + w * 0.5, y], [x + w * 0.5, y + h * 0.5]]);
      else if (kind === 3) out.push([[x + w * 0.5, y - h * 0.5], [x + w * 0.5, y + h * 0.5]]);
      else out.push([[x, y + h * 0.4], [x + w * 0.3, y - h * 0.4], [x + w * 0.6, y + h * 0.4], [x + w, y - h * 0.4]]);
      x += w + h * 0.35;
      g++;
      if (hsh(r * 13 + g, seed) > 0.72) x += h * 0.9;
    }
  }
  return out;
};
const noteLines = (rows: number, seed: number): P2[][] => {
  const out: P2[][] = [];
  for (let r = 0; r < rows; r++) {
    const y = (r + 0.5) / rows;
    let x = 0.05;
    let g = 0;
    while (x < 0.89) {
      const w = 0.08 + 0.2 * hsh(r * 17 + g, seed + 9);
      out.push([[x, y], [Math.min(0.95, x + w), y]]);
      x += w + 0.05;
      g++;
    }
  }
  return out;
};
/** bronze dividers on their own: at = the hinge, angle (deg, 90 = legs pointing down), open (deg) */
export const Dividers: React.FC<PropBase & { angle?: number; open?: number; size?: number }> = (p) => {
  const k = p.size ?? 1;
  const d: P2 = rot([1, 0], p.angle ?? 90);
  const open = p.open ?? DIVIDERS.open;
  const S: GShape[] = [];
  [-1, 1].forEach((sg, i) => {
    const dd = rot(d, (sg * open) / 2);
    const tip = mul(dd, DIVIDERS.len * k);
    S.push({ d: tubeD([[0, 0], mul(dd, DIVIDERS.len * 0.55 * k), tip], [5.2 * k, 4.2 * k, 1.2 * k]), fill: i === 0 ? BRONZE.mid : BRONZE.lit, sh: 0.6 });
  });
  S.push({ d: ellD(mul(d, -3 * k), 5.2 * k, 5.2 * k), fill: BRONZE.lit, sh: 0.5 });
  return <PropPaint p={p} shapes={S} />;
};
/** a long stick on its own: at = one end, angle (deg, 0 = pointing screen right), len (rig units) */
export const Stick: React.FC<PropBase & { angle?: number; len?: number }> = (p) => {
  const L = p.len ?? STICK.len;
  const u = rot([1, 0], p.angle ?? 0);
  return <PropPaint p={p} shapes={[{ d: tubeD([[0, 0], mul(u, L * 0.5), mul(u, L)], [6.6, 5.4, 3.4]), fill: WOOD.mid, sh: 0.5 }]} />;
};
/** a diphros (a Greek stool): four turned legs, the seat at `seat` units (default STOOL_SEAT) */
export const Stool: React.FC<PropBase & { seat?: number }> = (p) => {
  const h = p.seat ?? STOOL_SEAT;
  const S: GShape[] = [];
  for (const [x, back] of [[-26, true], [30, true], [-34, false], [24, false]] as [number, boolean][]) {
    const x0 = x + (back ? 8 : 0);
    const y0 = back ? -6 : 0;
    S.push({ d: tubeD([[x0 * 0.9, -h + 6], [x0 * 0.94, mix(-h, y0, 0.3)], [x0 * 0.97, mix(-h, y0, 0.55)], [x0, y0]], [9, 12, 8, 9]), fill: back ? WOOD.dark : WOOD.mid });
  }
  S.push({ d: closedD([[-40, -h], [38, -h], [40, -h + 8], [-38, -h + 8]], 0.3), fill: WOOD.mid });
  S.push({ d: closedD([[-40, -h], [38, -h], [46, -h - 7], [-32, -h - 7]], 0.3), fill: "#C9B48E" });
  return <PropPaint p={p} shapes={S} />;
};
/** the armillary sphere: a turned wooden stand and bronze column, the ORANGE rings (meridian, equator, ecliptic,
 *  tropics) turning by `turn` (0..1 a full turn), a small cream globe at the centre; size = the rings' radius
 *  (default 62 rig units; the whole ~1.9 x size + the stand ~110 tall) */
export const ArmillarySphere: React.FC<PropBase & { turn?: number; size?: number; ringW?: number }> = (p) => {
  const R = p.size ?? 62;
  const H = 108;
  const cy = -H - R;
  const tilt = 0.22;
  const S: GShape[] = [];
  // the stand: a base, a turned column, a cradle
  S.push({ d: closedD([[-44, 0], [44, 0], [38, -10], [-38, -10]], 0.4), fill: WOOD.dark });
  S.push({ d: closedD([[-36, -10], [36, -10], [26, -20], [-26, -20]], 0.4), fill: WOOD.mid });
  S.push({ d: tubeD([[0, -20], [0, -50], [0, -80], [0, -H + 4]], [16, 11, 13, 9]), fill: BRONZE.mid });
  S.push({ d: closedD([[-R * 0.42, cy + R * 0.92], [R * 0.42, cy + R * 0.92], [10, -H + 2], [-10, -H + 2]], 0.6), fill: BRONZE.dark });
  // the rings: circles in 3D (normal n), turned about the vertical axis by `turn`, seen a little from above
  const turn = (p.turn ?? 0) * 2 * PI;
  const view = (v: [number, number, number]): { p: P2; z: number } => {
    const [x, y, z] = v;
    const xr = x * Math.cos(turn) + z * Math.sin(turn);
    const zr = -x * Math.sin(turn) + z * Math.cos(turn);
    const y2 = y * Math.cos(tilt) - zr * Math.sin(tilt);
    const z2 = y * Math.sin(tilt) + zr * Math.cos(tilt);
    return { p: [xr * R, cy + y2 * R], z: z2 };
  };
  const ring = (axisTilt: number, scaleR: number, yOff: number, axisTurn: number) => {
    const pts: { p: P2; z: number }[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * 2 * PI;
      // a circle in the x-z plane, raised by yOff, tilted about the x axis by axisTilt, turned by axisTurn
      let x = Math.cos(a) * scaleR;
      let y = yOff;
      let z = Math.sin(a) * scaleR;
      const y1 = y * Math.cos(axisTilt) - z * Math.sin(axisTilt);
      const z1 = y * Math.sin(axisTilt) + z * Math.cos(axisTilt);
      y = y1;
      z = z1;
      const x2 = x * Math.cos(axisTurn) + z * Math.sin(axisTurn);
      const z2 = -x * Math.sin(axisTurn) + z * Math.cos(axisTurn);
      x = x2;
      z = z2;
      pts.push(view([x, -y, z]));
    }
    return pts;
  };
  const OBL = 0.41;
  const rings = [
    ring(PI / 2, 1, 0, 0), // the meridian (vertical)
    ring(0.35, 1, 0, 0), // the equator, tilted by the latitude
    ring(0.35 + OBL, 0.98, 0, 0.5), // the ecliptic
    ring(0.35, Math.cos(OBL), -Math.sin(OBL), 0), // a tropic
    ring(0.35, Math.cos(OBL), Math.sin(OBL), 0), // the other tropic
  ];
  const w = p.ringW ?? 3.6;
  const back: P2[][] = [];
  const front: P2[][] = [];
  for (const rg of rings) {
    let cur: P2[] = [];
    let curBack: boolean | null = null;
    for (const pt of rg) {
      const isBack = pt.z < 0;
      if (curBack === null || isBack === curBack) cur.push(pt.p);
      else {
        cur.push(pt.p);
        (curBack ? back : front).push(cur);
        cur = [pt.p];
      }
      curBack = isBack;
    }
    if (cur.length > 1) (curBack ? back : front).push(cur);
  }
  S.push(...glowL(back, w * 0.7, 0.55, ACCENT_DEEP));
  // the axis and the small globe at the centre
  const ax = 0.35;
  S.push({ d: tubeD([[Math.sin(ax) * R * 1.15, cy - Math.cos(ax) * R * 1.15], [-Math.sin(ax) * R * 1.15, cy + Math.cos(ax) * R * 1.15]], [3, 3]), fill: BRONZE.dark, sh: 0 });
  S.push({ d: ellD([0, cy], R * 0.18, R * 0.18), fill: "#E9DEC4" });
  S.push(...glowL(front, w, 1, ACCENT));
  return <PropPaint p={p} shapes={S} />;
};

// ===================================================================================================================
// CROWD SPRITES (pandemicFolkCrowd's pattern: baked once per render tab with the gouache filter, blitted on a canvas)
// ===================================================================================================================
type CrowdDef = { label: string; build: () => Shape[] };
/** the glow shapes as the sprite painter's own kinds (a `det` line in its colour, an area) */
const toSpriteShapes = (shapes: GShape[]): Shape[] =>
  shapes.map((s) => {
    if (s.gfill) return { d: s.d, fill: s.fill, sh: 0, op: s.op };
    if (s.glow !== undefined) return { d: s.d, fill: s.fill, det: 2.6, keep: true, op: s.op ?? 1 };
    return s;
  });
const greekDef = (label: string, kind: GreekKind, variant: number, pose: GPose, held?: Held): CrowdDef => ({
  label,
  build: () => {
    const q = solveGreekPose(kind, pose, [0, 0], 1, { variant, held });
    return toSpriteShapes(buildGreekFolk(kind, variant, q, { held }).shapes);
  },
});
const romeDef = (label: string, kind: RomeKind, variant: number, pose: FigPose, opts: Parameters<typeof buildRomeFolk>[3] = {}): CrowdDef => ({
  label,
  build: () => buildRomeFolk(kind, variant, pose, opts).shapes,
});
const st = (d: 1 | -1) => ROME_POSES.stand(d);
const fr = () => ROME_POSES.front();
const tab = (dg: DiagramSpec): Held => ({ two: "tablet", diagram: dg });
/** the Athenians: men and women, a few scholars with a small orange tablet or a scroll (12 drawings) */
export const GREEK_CROWD: CrowdDef[] = [
  greekDef("man in himation, front", "citizen", 0, fr()),
  greekDef("young man (exomis), 3/4 right", "citizen", 1, st(1)),
  greekDef("older man, 3/4 left", "citizen", 2, st(-1)),
  greekDef("woman, veiled, front", "citizen", 3, fr()),
  greekDef("woman, shawl, 3/4 right", "citizen", 4, st(1)),
  greekDef("young woman, peplos, 3/4 left", "citizen", 5, st(-1)),
  greekDef("man in himation, 3/4 left", "citizen", 0, st(-1)),
  greekDef("woman, veiled, 3/4 right", "citizen", 3, st(1)),
  greekDef("scholar with a tablet (Pythagoras' figure)", "scholar", 4, POSES.holdTablet(1), tab("pythagoras")),
  greekDef("scholar with a tablet (circle)", "scholar", 2, POSES.holdTablet(-1), tab("exhaustion")),
  greekDef("young scholar with a tablet (Thales)", "scholar", 3, POSES.holdTablet(1, 0.25), tab("thales")),
  greekDef("Alexandrian scholar with a scroll", "scholar", 6, ROME_POSES.gesture(-1, 0.6), { R: "scrollClosed" }),
];
/** the Romans (RomeFolk's drawings; no orange anywhere): 10 drawings */
export const ROMAN_CROWD: CrowdDef[] = [
  romeDef("freeman, front", "freeman", 0, fr()),
  romeDef("freeman, 3/4 right", "freeman", 1, st(1)),
  romeDef("older freeman, 3/4 left", "freeman", 2, st(-1)),
  romeDef("freewoman", "freeman", 3, st(1)),
  romeDef("dominus in his toga, front", "dominus", 0, fr()),
  romeDef("dominus, 3/4 left", "dominus", 2, st(-1)),
  romeDef("slave, 3/4 right", "slave", 0, st(1)),
  romeDef("slave woman, front", "slave", 3, fr()),
  romeDef("overseer, 3/4 left", "overseer", 0, st(-1), { tool: "none" }),
  romeDef("slave, exomis, 3/4 left", "slave", 1, st(-1), { garb: "exomis" }),
];
/** a man's height in FOLK units (the sprites' common scale: hPx = a man's height in px; women and youths come out
 *  shorter, as they are) */
export const CROWD_H_UNITS = MAN_UNITS * FU;
/** the power-of-two size tiers (TuberculosisToll): a figure drawn at hPx uses the smallest tier >= hPx */
export const CROWD_TIERS = [512, 256, 128, 64, 32];
export const crowdTier = (hPx: number) => {
  let t = CROWD_TIERS[0];
  for (const T of CROWD_TIERS) if (T >= hPx) t = T;
  return t;
};
const SHAPES_CACHE = new Map<string, Shape[]>();
/** the sprite request for drawing i of the Greek or Roman crowd at a tier (use crowdTier(hPx)) */
export const crowdReq = (side: "greek" | "roman", i: number, tierPx: number): SpriteReq => {
  const defs = side === "greek" ? GREEK_CROWD : ROMAN_CROWD;
  const n = ((i % defs.length) + defs.length) % defs.length;
  const ck = `${side}|${n}`;
  let shapes = SHAPES_CACHE.get(ck);
  if (!shapes) {
    shapes = defs[n].build();
    SHAPES_CACHE.set(ck, shapes);
  }
  return { key: `${ck}|${tierPx}`, shapes, hPx: tierPx, hUnits: CROWD_H_UNITS, wUnits: 150 * FU };
};
export type CrowdVeil = { Z: number; color: string; alpha: number };
/** the crowd's fog by depth band (TuberculosisToll's crowdFogFor): veils at depths Zs (far -> near), each the air of
 *  its depth, compounding so a figure beyond Z_i ends at fogAt(Z_i) x strength. With the kit's AirWorld A:
 *  crowdVeils((Z) => A.figFog(Z), (Z) => A.airHex(Z, 150), [6000, 5000, ...]) */
export const crowdVeils = (fogAt: (Z: number) => number, airAt: (Z: number) => string, Zs: number[], strength = 1): CrowdVeil[] => {
  const fogs = Zs.map((Z) => c01(strength * fogAt(Z)));
  return Zs.map((Z, i) => {
    const next = i + 1 < fogs.length ? fogs[i + 1] : 0;
    return { Z, color: airAt(Z), alpha: c01(1 - (1 - fogs[i]) / Math.max(1e-3, 1 - next)) };
  });
};
export type CrowdFig = { x: number; y: number; hPx: number; Z: number; side: "greek" | "roman"; i: number; rot?: number; sy?: number; shadowW?: number };
/** draw crowd figures (screen px; sorted FAR to NEAR by Z) with a soft contact shadow each, the veils applied
 *  between the depth bands (source-atop: they tint only the figures already drawn) */
export const drawCrowd = (ctx: CanvasRenderingContext2D, figs: CrowdFig[], get: (key: string) => Sprite | undefined, veils: CrowdVeil[], shadowColor = "#22180F", width = 1080, height = 1920) => {
  let band = 0;
  const [r, g, b] = [1, 3, 5].map((kk) => parseInt(shadowColor.slice(kk, kk + 2), 16));
  for (const f of figs) {
    while (band < veils.length && f.Z < veils[band].Z) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = veils[band].alpha;
      ctx.fillStyle = veils[band].color;
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      band++;
    }
    const sw = (f.shadowW ?? 0.22) * f.hPx;
    if (sw > 0.5) {
      const cx = f.x + sw * 0.25;
      const gr = ctx.createRadialGradient(cx, f.y, 0, cx, f.y, sw);
      gr.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
      gr.addColorStop(0.6, `rgba(${r},${g},${b},0.3)`);
      gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.setTransform(1, 0, 0, 0.22, 0, f.y * 0.78);
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(cx, f.y, sw, 0, 2 * PI);
      ctx.fill();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    blitFolk(ctx, get(`${f.side}|${((f.i % (f.side === "greek" ? GREEK_CROWD.length : ROMAN_CROWD.length)) + (f.side === "greek" ? GREEK_CROWD.length : ROMAN_CROWD.length)) % (f.side === "greek" ? GREEK_CROWD.length : ROMAN_CROWD.length)}|${crowdTier(f.hPx)}`), f.x, f.y, f.hPx, { rot: f.rot, sy: f.sy });
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};
/** the sway idle (pandemicFolkCrowd's): a slow sway about the feet and a breath */
export { sway as crowdSway } from "../kyle-pandemics/pandemicFolkCrowd";
