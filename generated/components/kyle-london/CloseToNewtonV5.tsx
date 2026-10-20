// ---------------------------------------------------------------------------
// CloseToNewtonV5 (kyle-london, cut 22, V5: the DEPTH pass of V4; DEPTH.md). Everything that happens is V4's: the same
// 148 frames, word timing, staging, labels and camera path. What changed is how the room is drawn in space:
//   ONE CAMERA: one-point perspective riding on the 2D camera (londonDepth.perspective): eye / horizon at world
//   y = -747 (the height the old floor rows already implied), VP on the camera's centre line; dRef 1500 at the wide
//   (k 1.32), dolly 0.4, so the pull-back f88 -> f128 moves the front pair faster than the rear row (parallax).
//   GROUND PLANE: oak boards running to the VP, cross joints compressing toward the horizon, fading with depth.
//   DEPTH PLACEMENT: every figure stands at its own Z (placeAtRef reproduces V4's wide exactly at f147): Pepys and
//   Newton Z 0, the front flanks Z 79, the rear flanks Z 265, the table's front edge Z 375; painter's order by Z.
//   SHADOWS: contact shadows on the boards under every figure and the table (lower right, light upper left); the cast's
//   form shadow (shade 1) on every figure.
//   THE TABLE is a volume in the same perspective (londonDepth Box / Cylinder): a lit top slab, the cloth's front and its
//   lit left side, turned legs as cylinders, the globe and reflector standing on the top at their depth.
//   ATMOSPHERE: depthTint sinks the rear row toward the page tone, beyond V4's context dim.
// (V4: CloseToNewton (the version the user likes) with the redesigned cast
// londonCastV2: designed wigs and faces, new hands. Same 148 frames, timing, staging, camera, labels and table; only
// what the new proportions break is fixed (see V4 FIXES below). The character scene. Dwarkesh map style (styles/dwarkesh-map.md), the
// umber page with no map (kits/maps TexcocoPage), the engraved London cast, redesigned (londonCastV2.tsx).
// Opaque 1080x1920, 29.97 fps, 148 frames. (V1, the portrait medallions, stays buildable as CloseToNewtonMedallions.)
//
// CHECK LINE: "Pepys, the diarist, stood shoulder to shoulder with Newton in the Royal Society's circle."
//
// THE LINE: "[...the very famous Diary of Samuel Pepys, who's this incredible] figure and is like very close to
// Newton and that social group. And his"
// WORD -> FRAME: incredible 4 · figure 15 · and 37 · is 50 · like 53 · very 62 · close 71 · to 81 · Newton 88 ·
// and 95 · that 103 · social 109 · group 119 · And 131 · his 142 (cut back to the speaker at 148)
// DURATION: the slot 22.155 -> 27.094 s (in frame 664 -> out frame 812 at 29.97) = 148 frames (f0..f147).
//
// THE MOTION: one continuous camera. f0 is close on Pepys (cream, a dark periwig, the rich coat), already walking in
// from the left in a three-quarter view (the upright gentleman's stroll, POSES.strollGent); PEPYS slides up over his head (f6 -> f16). The camera travels with him and
// eases back as he walks up to Newton (orange coat: the new science), who stands by the Society's table with its
// globe and reflecting telescope; Pepys slows and stops at his side, shoulder to shoulder (stops f84), and Newton
// turns his head to him with a small nod (f80 -> f98); NEWTON slides up f78 -> f88. "that social group": the camera
// pulls back (f88 -> f128) while four Fellows (dimmer cream: the circle) step in from the frame edges (f94 -> f127, in a
// stagger), two in front and two behind, and turn toward the pair, a loose semicircle in depth with Pepys inside it
// next to Newton. Then the settled frame breathes (idle, head turns) and the camera creeps to the cut.
// Orange = the new science: Newton's coat is the ONLY orange. Pepys is full-bright cream with his label; the circle is
// cream at the context level (a step dimmer), so the picture reads "Pepys and Newton at the centre of their circle".
//
// V4 FIXES: none were needed. Checked on every frame of the preview: the labels clear the taller wigs (at f88 about
// 28 units between NEWTON / PEPYS and the wig tops; at f0, 66 px on screen); the pair's contact is shoulder to shoulder,
// with Newton's hair just over Pepys's far side; the circle overlaps as in V1, and every face stays visible; faces and
// labels stay out of the caption bands on every frame; no head turn crosses the front view, so no lock swaps layer.
// SOURCES: costume after Hayls's Pepys (1666), Kneller's Newton (1689), Kneller's Wren (1711), Murray's Halley
// (c.1690), Kerseboom's Boyle (1689) and Hollar's frontispiece to Sprat's History of the Royal Society (1667), as
// listed in <working>/animation_source/refs/refs_sources.txt and images/image_sources.txt; the reflector after
// Newton's 1668 telescope (images/42.5_FundamentalDiscoveries_NewtonReflectingTelescope1668.jpg). No figures or dates.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg, makeCamera, type Cam } from "../kits/maps/texcocoShared";
import { INK, fellSC, swayCam } from "../kits/maps/incaShared";
import {
  DARK,
  Fellow,
  Globe,
  Newton,
  ORANGE,
  GENT_STRIDE,
  POSES,
  Pepys,
  Reflector,
  TABLE,
  CREAM,
  WALK_CYCLE,
  headTurn,
  idle,
  lerpFig,
  shadeInk,
  walkPose,
  type FigPose,
} from "./londonCastV2";
import { Box, ContactShadow, Cylinder, GroundPlane, depthTint, perspective, placeAtRef, tintInk, volInk, type DepthOpts, type Persp } from "./londonDepth";

export const FPS = 30000 / 1001;
export const DURATION = 148;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const easeOut = (v: number) => 1 - Math.pow(1 - c01(v), 3);
type P2 = [number, number];

// ---------------------------------------------------------------------------
// WORLD: world px = figure units (a man ~310 tall, scale 1 in the front row); the floor of the front row is y = 0,
// figures further back stand higher (y < 0) and smaller.
// ---------------------------------------------------------------------------
const PEPYS_X = -56;
const NEWTON_X = 58;
const TABLE_AT: P2 = [180, -152];
const TABLE_S = 0.8;

/** a walker that comes in at speed v (units / frame) and slows to a stop at xEnd on fStop over `brake` frames */
const walker = (xEnd: number, dir: 1 | -1, fStop: number, v: number, brake: number) => {
  const dBrake = (v * brake) / 2;
  const dist = (f: number) => {
    // distance still to go at frame f (>= 0)
    if (f >= fStop) return 0;
    if (f >= fStop - brake) {
      const u = (fStop - f) / brake;
      return dBrake * u * u;
    }
    return dBrake + v * (fStop - brake - f);
  };
  return {
    x: (f: number) => xEnd - dir * dist(f),
    /** how much he is still walking (1 = full stride) */
    amount: (f: number) => (f >= fStop ? 0 : f >= fStop - brake ? Math.sqrt((fStop - f) / brake) : 1),
    /** distance covered from an arbitrary origin (for the stride phase) */
    covered: (f: number) => -dist(f),
  };
};

// Pepys: the gentleman's stroll (2 x GENT_STRIDE units per 30-frame cycle), braking from f60 to stop at f84
const PEPYS_V = (2 * GENT_STRIDE) / WALK_CYCLE;
const pepysWalk = walker(PEPYS_X, 1, 84, PEPYS_V, 24);

// the four Fellows: front flanks and rear flanks of the semicircle (x, floor y, depth scale, the side they come from)
type FellowSpec = { variant: number; x: number; y: number; s: number; dir: 1 | -1; fStop: number; seed: number };
const FELLOWS: FellowSpec[] = [
  { variant: 2, x: -298, y: -24, s: 0.95, dir: 1, fStop: 116, seed: 1 },
  { variant: 3, x: -200, y: -112, s: 0.85, dir: 1, fStop: 122, seed: 2 },
  { variant: 1, x: 232, y: -112, s: 0.85, dir: -1, fStop: 126, seed: 3 },
  { variant: 4, x: 318, y: -20, s: 0.95, dir: -1, fStop: 119, seed: 4 },
];
const FELLOW_STRIDE = 46;
// the circle at the style's context level (a step dimmer than the cream in play)
const CONTEXT_COAT = shadeInk(0.66);
const CONTEXT_INK = shadeInk(0.72);
const FELLOW_V = (2 * FELLOW_STRIDE) / WALK_CYCLE; // 4 units / frame at scale 1
// DEPTH: each Fellow's place in the room, from his V4 placement at the wide (cam cx 4, k 1.32); he walks along X at
// his Z at FELLOW_V units / frame (the same pace as V4's on screen at the wide)
export const DEPTH: DepthOpts = { eyeY: -747, dRef: 1500, kRef: 1.32, dolly: 0.4 };
const CX_REF = 4;
const FELLOW_3D = FELLOWS.map((F) => placeAtRef(DEPTH, CX_REF, F.x, F.s));
const fellowWalks = FELLOWS.map((F, i) => walker(FELLOW_3D[i].X, F.dir, F.fStop, FELLOW_V, 14));
// the table: V4's 2D placement at the wide -> its front edge depth and centre; the globe and reflector on its top
const TABLE_3D = placeAtRef(DEPTH, CX_REF, TABLE_AT[0], TABLE_S);
const TBL = { X: TABLE_3D.X, Z0: TABLE_3D.Z, w: TABLE.w * 0.86, d: 110, h: TABLE.h };
const GLOBE_X = placeAtRef(DEPTH, CX_REF, TABLE_AT[0] + 150 * TABLE_S, TABLE_S).X;
const REFL_X = placeAtRef(DEPTH, CX_REF, TABLE_AT[0] + 50 * TABLE_S, TABLE_S).X;

/** the Society's table as a volume: turned legs (cylinders), a stretcher, the top slab, the cloth's lit left side and
 *  its front with folds; the globe and the reflector stand on the top */
const PerspTable: React.FC<{ P: Persp; frame: number }> = ({ P: pp, frame }) => {
  const X0 = TBL.X - TBL.w / 2;
  const X1 = TBL.X + TBL.w / 2;
  const Z0 = TBL.Z0;
  const Z1 = TBL.Z0 + TBL.d;
  const H = TBL.h;
  const clothY = -H + 62;
  // the table is context: sunk a step toward the page by its depth, so its lit top does not out-shine the pair
  const ink = volInk(tintInk(CREAM, depthTint(Z0) * 0.9));
  const p = pp.p;
  const legs = (Z: number) =>
    [X0 + 30, X1 - 30].map((X) => (
      <g key={`${X}${Z}`}>
        <Cylinder P={pp} X={X} Z={Z} R={9} Y0={clothY - 6} Y1={-38} ink={ink} uid={`tl${Math.round(X)}${Math.round(Z)}`} />
        <Cylinder P={pp} X={X} Z={Z} R={11.5} Y0={-38} Y1={-26} ink={ink} uid={`tb${Math.round(X)}${Math.round(Z)}`} />
        <Cylinder P={pp} X={X} Z={Z} R={7} Y0={-26} Y1={0} ink={ink} uid={`tf${Math.round(X)}${Math.round(Z)}`} />
      </g>
    ));
  // the cloth: a front face and the left side (lit), hanging from the top's edge, a soft scalloped hem
  const hem = (Xa: number, Xb: number, Za: number, Zb: number, n: number) =>
    Array.from({ length: n + 1 }, (_, i) => {
      const u = i / n;
      return p(mix(Xa, Xb, u), clothY + 4 * Math.sin(u * Math.PI * n), mix(Za, Zb, u));
    });
  const PP = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
  const front = [p(X0 - 6, -H, Z0 - 3), p(X1 + 6, -H, Z0 - 3), ...hem(X1 + 6, X0 - 6, Z0 - 3, Z0 - 3, 9)];
  const sideSeen = X0 - 6 > pp.vp[0];
  const side = [p(X0 - 6, -H, Z1), p(X0 - 6, -H, Z0 - 3), ...hem(X0 - 6, X0 - 6, Z0 - 3, Z1, 3)];
  const folds = Array.from({ length: 9 }, (_, i) => {
    const X = X0 + 20 + i * ((TBL.w - 40) / 8);
    return `M${PP(p(X, -H + 6, Z0 - 3))}Q${PP(p(X + 4, -H + 34, Z0 - 3))} ${PP(p(X + 2, clothY - 1, Z0 - 3))}`;
  }).join("");
  const sw = 2.3 * pp.r(Z0);
  // standing ON the top (Y = -H - 8), not on the floor
  const onTop = (X: number, Z: number) => ({ at: p(X, -H - 8, Z), scale: pp.r(Z) });
  const globe = onTop(GLOBE_X, Z0 + 62);
  // (shifted 50 to the right of V4's spot: standing on the top it rises into the NEWTON label at f88)
  const refl = onTop(REFL_X + 50, Z0 + 40);
  return (
    <g>
      <ContactShadow P={pp} X={TBL.X} Z={(Z0 + Z1) / 2} w={TBL.w * 0.62} d={TBL.d * 0.75} uid="tbl-cs" amt={0.8} />
      {legs(Z1)}
      <Box P={pp} X0={X0 + 30} X1={X1 - 30} Y0={-34} Y1={-27} Z0={(Z0 + Z1) / 2 - 3} Z1={(Z0 + Z1) / 2 + 3} ink={ink} uid="tbl-st" hatch={false} />
      {legs(Z0 + 4)}
      <Box P={pp} X0={X0} X1={X1} Y0={-H - 8} Y1={-H} Z0={Z0} Z1={Z1} ink={ink} uid="tbl-top" />
      {sideSeen ? <path d={`M${side.map(PP).join("L")}Z`} fill={ink.lit} stroke={DARK} strokeWidth={sw} strokeLinejoin="round" /> : null}
      <path d={`M${front.map(PP).join("L")}Z`} fill={ink.mid} stroke={DARK} strokeWidth={sw} strokeLinejoin="round" />
      <path d={folds} fill="none" stroke={DARK} strokeWidth={1.2 * pp.r(Z0)} strokeOpacity={0.55} />
      <Reflector at={refl.at} scale={refl.scale * TABLE_S / 0.8} uid="ctn-rfl" dir={-1} />
      <Globe at={globe.at} scale={globe.scale * TABLE_S / 0.8} uid="ctn-glb" turn={18 + frame * 0.12} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// CAMERA: close on Pepys walking (f0), travelling with him onto the pair (f88), then one pull-back to the circle
// (f128) and a slow creep. (wx, wy) lands on screen (540, sy) at zoom k.
// ---------------------------------------------------------------------------
const HEAD_Y = -292; // a front-row head's middle
const camAt = makeCamera([
  { f: 0, k: 4.0, wx: pepysWalk.x(0) + 30, wy: HEAD_Y, sy: 716 },
  { f: 44, k: 3.38, wx: pepysWalk.x(44) + 28, wy: HEAD_Y, sy: 708 },
  { f: 88, k: 2.82, wx: (PEPYS_X + NEWTON_X) / 2, wy: HEAD_Y, sy: 702 },
  { f: 128, k: 1.36, wx: 4, wy: 0, sy: 1060 },
  { f: 147, k: 1.32, wx: 4, wy: 0, sy: 1062 },
]);
const camOf = (frame: number): Cam => swayCam(camAt(frame), frame);
const screenX = (cam: Cam, x: number) => 540 + (x - cam.cx) * cam.k;

// ---------------------------------------------------------------------------
// LABEL: IM Fell English SC, cream, widely spaced, in world space; slides up while it fades in (10 frames)
// ---------------------------------------------------------------------------
const NameLabel: React.FC<{ text: string; x: number; y: number; size: number; frame: number; f0: number }> = ({ text, x, y, size, frame, f0 }) => {
  const u = c01((frame - f0) / 10);
  if (u <= 0) return null;
  const e = easeOut(u);
  return (
    <text
      x={x + size * 0.11}
      y={y + size * 0.45 * (1 - e)}
      textAnchor="middle"
      opacity={ease(u)}
      fill={INK}
      stroke={DARK}
      strokeOpacity={0.75}
      strokeWidth={size * 0.13}
      strokeLinejoin="round"
      paintOrder="stroke"
      style={{ fontFamily: fellSC, fontSize: size, letterSpacing: size * 0.22 }}
    >
      {text}
    </text>
  );
};

const CloseToNewtonV5: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const g = frame;

  // ---- Pepys: walking in, braking, standing at Newton's side; he looks to Newton ------------------
  const pX = pepysWalk.x(frame);
  const pAmt = pepysWalk.amount(frame);
  const pPhase = pepysWalk.covered(frame) / (2 * GENT_STRIDE) + 0.15;
  const pWalk = POSES.strollGent(1, pPhase, pAmt);
  const pStand = headTurn(POSES.stand(1), 0.78, 2);
  const pPose: FigPose = idle(lerpFig(pWalk, pStand, ease((frame - 70) / 22)), g, 1, ease((frame - 84) / 16));

  // ---- Newton: standing by the table, three-quarter to screen left; he turns his head to Pepys and nods -----
  const nBase = POSES.stand(-1);
  const turn = ease((frame - 78) / 16);
  const nod = 7 * Math.sin(Math.PI * c01((frame - 84) / 18));
  const nPose: FigPose = idle(headTurn(nBase, -0.22 - 0.62 * turn, 1 + nod), g, 2, 1);

  // ---- the Fellows: walking in from the edges, stopping, turning to the pair ------------------------
  const fellows = FELLOWS.map((F, i) => {
    const w = fellowWalks[i];
    const x = w.x(frame);
    const amt = w.amount(frame);
    const ph = w.covered(frame) / (2 * FELLOW_STRIDE) + 0.37 * i;
    const walkQ = walkPose(POSES.walk(F.dir, 0, 0), ph, amt, FELLOW_STRIDE);
    const toPair = F.dir; // the pair is on his facing side
    const standQ = headTurn(POSES.stand(toPair), toPair * (0.7 + 0.08 * i), 1 + (i % 2) * 2);
    let q = lerpFig(walkQ, standQ, ease((frame - (F.fStop - 8)) / 18));
    // a later small head turn, so the settled frame lives
    q = headTurn(q, q.headYaw + toPair * -0.18 * ease((frame - (134 + i * 3)) / 14) * (i % 2 ? 1 : -1), q.pitch);
    if (F.variant === 3) q = POSES.stoop(q, toPair);
    q = idle(q, g, 3 + i, ease((frame - F.fStop) / 14));
    return { F, x, Z: FELLOW_3D[i].Z, q, on: frame >= F.fStop - 60 };
  });

  // draw far to near (by the floor y they stand on): the Fellow behind the table, the table, the others, Newton, Pepys
  const order = [...fellows].sort((a, b) => b.Z - a.Z);
  const rear = order.filter((o) => o.Z > TBL.Z0);
  const front = order.filter((o) => o.Z <= TBL.Z0);
  const P = perspective(cam, DEPTH);
  const fellowEl = (o: (typeof fellows)[number], i: number) => {
    if (!o.on) return null;
    const a = P.at(o.x, o.Z);
    const t = depthTint(o.Z);
    return (
      <g key={`f${o.F.variant}`}>
        <ContactShadow P={P} X={o.x} Z={o.Z} uid={`fcs${o.F.variant}`} />
        <Fellow variant={o.F.variant} pose={o.q} at={a.at} scale={a.scale} uid={`fl${i}${o.F.variant}`} coat={tintInk(CONTEXT_COAT, t)} ink={tintInk(CONTEXT_INK, t)} shade={1} />
      </g>
    );
  };

  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        {/* the floor of the room: oak boards to the VP */}
        <GroundPlane P={P} kind="boards" uid="ctn-gp" />
        {rear.map(fellowEl)}
        <PerspTable P={P} frame={frame} />
        {front.map(fellowEl)}
        <ContactShadow P={P} X={NEWTON_X} Z={0} uid="ctn-ncs" />
        <Newton pose={nPose} at={P.at(NEWTON_X, 0).at} scale={1} uid="ctn-nwt" coat={ORANGE} shade={1} />
        <ContactShadow P={P} X={pX} Z={0} uid="ctn-pcs" />
        <Pepys pose={pPose} at={P.at(pX, 0).at} scale={1} uid="ctn-pep" shade={1} />
        {/* the names, over their heads, in world space */}
        <NameLabel text="PEPYS" x={pX - 12} y={HEAD_Y - 68} size={23} frame={frame} f0={6} />
        <NameLabel text="NEWTON" x={NEWTON_X + 24} y={HEAD_Y - 68} size={23} frame={frame} f0={78} />
      </WorldSvg>
    </TexcocoPage>
  );
};

/** for checks: where the Fellows stand on screen at a frame (their feet x) */
export const fellowScreenX = (frame: number) => {
  const cam = camOf(frame);
  return fellowWalks.map((w) => screenX(cam, w.x(frame)));
};

export default CloseToNewtonV5;
