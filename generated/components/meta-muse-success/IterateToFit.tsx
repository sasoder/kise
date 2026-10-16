import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  COLOR,
  EDGE,
  ElevationShadow,
  GEO,
  Label,
  LightSweep,
  StoutStage,
  amberBandFor,
  bloomFilter,
  camFor,
  clamp01,
  lerp,
  smoothstep,
  type Silhouette,
} from "../kits/cheeky-pint/stoutShared";

// ---------------------------------------------------------------------------
// IterateToFit — Cheeky Pint S4 (stout system, stoutShared.tsx, palette B1).
// 1080x1920, 23.976 fps (the Premiere sequence), opaque.
//
// CHECK LINE (what the viewer can say after this cut): "Normally a product does
// not fit its market at first: you reshape it a few times until it drops in, and
// only then does it grow."
//
// THE LINE (Mark Zuckerberg): "it's fine, (f0-13) and you have to like iterate
// (f13-41) a few times (f41-58) to get product market fit (f58-85; 'fit' f77-85)
// before you really grow. (f85-110; 'grow' f101-110)".
//
// THE MOTION: a square cream block (PRODUCT) sits jammed, askew, across a
// round-bottomed socket cut into a kraft slab (MARKET), a sliver of amber at its
// top. The same block is pulled out, trimmed and rounded, and pushed back in,
// three times in one lift-reshape-lower rhythm: twice it jams over a dark gap,
// the third time it drops in flush on "fit". Only then the amber bar rises out
// of the slot in its top and climbs, the camera easing out with it.
//
// DURATION: the slot is 4.922 s x 23.976 = 118 frames, + a 16-frame tail = 134.
// The idea is complete by ~f108; f108-134 is a living hold (amber creeping, the
// camera drifting in).
//
// BEATS (f): jammed f0-7 · try 1 f7-30 (trimmed, small radii: jams 22 of 76
// deep, lolls right, held to f35) · try 2 f35-55 (clearly rounder: jams 48 deep,
// lolls left, held to f59) · try 3 lift f59-68 (a full half-round), drops f71-78
// and seats; the slab gives under it f78-82 · amber rises f81-108 · light sweep
// f100-110 · hold f108-134.
//
// LABELS: PRODUCT on the piece's face (it rides and tilts with it) and MARKET on
// the slab, both ink, from f0, printed on the cards (world-fixed: 40 px on screen
// in the tries, ~30 px after the ease-out); both stay above the caption strip.
//
// THE WORLD (world px): the slab's top edge is y 0, the socket's axis x 0. The
// piece and the slab are coplanar cards under the one key light: the piece's one
// shadow (piece + amber, a union) falls on the ground above the slab and on the
// socket's floor, never on the slab's face.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 134;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- geometry (world px) ------------------------------------------------------------------------
const R = 66; // the socket: straight walls WALL deep, then a half circle of radius R
const WALL = 10;
const RP = R; // the fitted piece's half width and bottom radius (no seam: the fit is the gap closing)
const H = 116; // the piece's height (seated, it stands 40 proud: the band that carries its label)
const W0 = 150; // the block as it starts: wider than the socket, square-cornered
const W1 = 2 * RP;
const RT = GEO.RADIUS; // the piece's top corners, always
const BAR = 104; // the amber bar: nearly the piece's top
const SLAB = { x0: -160, x1: 160, h: 110 };
/** How deep a piece of the socket's width with bottom corners r sinks (its bottom below the slab's top). */
const depthOf = (r: number) => WALL + r;
const R1 = 12;
const R2 = 38;
const D1 = depthOf(R1);
const D2 = depthOf(R2);
const D3 = depthOf(RP);
/** Labels are printed on the cards: a world size that is 40 SCREEN px at the tries' camera. */
const K_TRY = 3.3;
const K_END = 2.44;
const LABEL_W = 40 / K_TRY;

// --- the jammed opening pose: tilted 5 deg, its left corner against the socket's left wall, its
// bottom edge on the right rim -------------------------------------------------------------------
const TILT0 = -5;
const CX0 = -R + (W0 / 2) * Math.cos((TILT0 * Math.PI) / 180) + 0.3;
const BY0 = (R - CX0) * Math.tan((-TILT0 * Math.PI) / 180);

// --- timing (frames) ------------------------------------------------------------------------------
const T = {
  lift1: 7, peak1: 18, land1: 30,
  lift2: 35, peak2: 45, land2: 55,
  lift3: 59, peak3: 68, drop: 71, seat: 78,
  grow: 81, growF: 27,
  cam: 79, camF: 22,
  sweep: 100, sweepF: 10,
} as const;
const PEAK = -48; // the piece's bottom at the top of a lift (well clear of the slab)

const seg = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const easeOut3 = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);
/** A constant-velocity ramp that eases in over d frames from a (0 before; C1). */
const ramp = (f: number, a: number, d: number) => {
  const u = clamp01((f - a) / d);
  return f >= a + d ? f - a - d / 2 : d * (u * u * u - (u * u * u * u) / 2);
};
/** Rest to rest with the speed peaking a quarter of the way in (velocity ∝ t (1 - t)^3). */
const riseEase = (u: number) => {
  const x = clamp01(u);
  return 1 - Math.pow(1 - x, 4) * (1 + 4 * x);
};

/** The piece's bottom-centre y (world). Lifts ease in and out; lowering accelerates and stops on contact. */
const bottomY = (f: number) => {
  if (f <= T.lift1) return BY0;
  if (f <= T.peak1) return lerp(BY0, PEAK, smoothstep(seg(f, T.lift1, T.peak1)));
  if (f <= T.land1) return lerp(PEAK, D1, Math.pow(seg(f, T.peak1, T.land1), 1.7));
  if (f <= T.lift2) return D1;
  if (f <= T.peak2) return lerp(D1, PEAK, smoothstep(seg(f, T.lift2, T.peak2)));
  if (f <= T.land2) return lerp(PEAK, D2, Math.pow(seg(f, T.peak2, T.land2), 1.7));
  if (f <= T.lift3) return D2;
  if (f <= T.peak3) return lerp(D2, PEAK, smoothstep(seg(f, T.lift3, T.peak3)));
  if (f <= T.drop) return PEAK;
  if (f <= T.seat) return lerp(PEAK, D3, Math.pow(seg(f, T.drop, T.seat), 2.2));
  return D3;
};
/** Tilt (deg): jammed, squared up in the air, lolling to one side when it does not seat. */
const tiltOf = (f: number) => {
  const a = TILT0 * (1 - smoothstep(seg(f, T.lift1, T.peak1)));
  const b = 3.6 * (easeOut3(seg(f, T.land1, T.land1 + 4)) - smoothstep(seg(f, T.lift2 + 1, T.peak2 - 1)));
  const c = -2.6 * (easeOut3(seg(f, T.land2, T.land2 + 3)) - smoothstep(seg(f, T.lift3 + 1, T.peak3 - 1)));
  return a + b + c;
};
/** The reshaping, in the air: the width trimmed to the socket's, the bottom corners rounded toward it. */
const shapeOf = (f: number) => {
  const s1 = smoothstep(seg(f, T.lift1 + 2, T.peak1 + 5));
  const s2 = smoothstep(seg(f, T.lift2 + 1, T.peak2 + 4));
  const s3 = smoothstep(seg(f, T.lift3 + 1, T.drop - 1));
  return { w: lerp(W0, W1, s1), r: RT + (R1 - RT) * s1 + (R2 - R1) * s2 + (RP - R2) * s3 };
};
/** The slab gives under the piece's weight: a little under each jammed try (released as the piece is
 *  pulled out), and for good under the seated piece (no rebound). */
const pressOf = (f: number) =>
  1.2 * (easeOut3(seg(f, T.land1, T.land1 + 3)) - smoothstep(seg(f, T.lift2, T.lift2 + 5))) +
  1.2 * (easeOut3(seg(f, T.land2, T.land2 + 3)) - smoothstep(seg(f, T.lift3, T.lift3 + 5))) +
  2 * easeOut3(seg(f, T.seat, T.seat + 4));
/** The amber bar's height: a sliver until the piece is seated, then the rise and a creep. */
const amberOf = (f: number) => 5 + 172 * riseEase(seg(f, T.grow, T.grow + T.growF)) + 0.75 * ramp(f, 98, 12);

const camOf = (f: number) => {
  const p = smoothstep(seg(f, T.cam, T.cam + T.camF));
  const push = smoothstep(seg(f, 0, 76));
  const k = lerp(3.2, K_TRY, push) * Math.pow(K_END / K_TRY, p) * Math.exp(0.0009 * ramp(f, 102, 12));
  const sy = 930 + 75 * p - 0.3 * ramp(f, 102, 12);
  return camFor(0, 0, 540, sy, k);
};
const CAM_REST = camOf(0);

/** The light pool follows the subject (the piece, then the bar's middle) with a lag. */
const poolTarget = (f: number) => {
  const by = bottomY(f) + pressOf(f);
  const h = amberOf(f);
  return by - H / 2 - Math.max(0, h - 5) * 0.5;
};
const POOL_TRACK: number[] = (() => {
  const out: number[] = [];
  let p = poolTarget(0);
  for (let f = 0; f <= DURATION; f++) {
    p += (poolTarget(f) - p) * 0.14;
    out.push(p);
  }
  return out;
})();

// --- paths ----------------------------------------------------------------------------------------
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const n6 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
type Map2 = (x: number, y: number) => string;
const ident: Map2 = (x, y) => `${n3(x)} ${n3(y)}`;
/** The piece (local: bottom centre at 0 0, up is -y): top corners RT, bottom corners r. */
const piecePath = (w: number, r: number, m: Map2 = ident) => {
  const a = w / 2;
  const rb = Math.min(r, a);
  return (
    `M${m(-a + RT, -H)}L${m(a - RT, -H)}A${RT} ${RT} 0 0 1 ${m(a, -H + RT)}L${m(a, -rb)}` +
    `A${n3(rb)} ${n3(rb)} 0 0 1 ${m(a - rb, 0)}L${m(-a + rb, 0)}A${n3(rb)} ${n3(rb)} 0 0 1 ${m(-a, -rb)}` +
    `L${m(-a, -H + RT)}A${RT} ${RT} 0 0 1 ${m(-a + RT, -H)}Z`
  );
};
/** The amber bar (local): from the piece's top edge up h, top corners rounded; `foot` extends it down (silhouettes). */
const barPath = (h: number, m: Map2 = ident, foot = 0) => {
  const a = BAR / 2;
  const rt = Math.min(RT, h / 2);
  const y0 = -H - h;
  return (
    `M${m(-a + rt, y0)}L${m(a - rt, y0)}A${n3(rt)} ${n3(rt)} 0 0 1 ${m(a, y0 + rt)}L${m(a, -H + foot)}L${m(-a, -H + foot)}` +
    `L${m(-a, y0 + rt)}A${n3(rt)} ${n3(rt)} 0 0 1 ${m(-a + rt, y0)}Z`
  );
};
const SOCKET_D = `M${-R} 0V${WALL}A${R} ${R} 0 0 0 ${R} ${WALL}V0Z`;
const SLAB_D =
  `M${SLAB.x0 + RT} 0H${-R}V${WALL}A${R} ${R} 0 0 0 ${R} ${WALL}V0H${SLAB.x1 - RT}A${RT} ${RT} 0 0 1 ${SLAB.x1} ${RT}` +
  `V${SLAB.h - RT}A${RT} ${RT} 0 0 1 ${SLAB.x1 - RT} ${SLAB.h}H${SLAB.x0 + RT}A${RT} ${RT} 0 0 1 ${SLAB.x0} ${SLAB.h - RT}` +
  `V${RT}A${RT} ${RT} 0 0 1 ${SLAB.x0 + RT} 0Z`;
/** Where the piece's shadow may fall: the ground above the slab, and the socket's floor. */
const SHADOW_CLIP_D = `M-3000 -4000H3000V0H-3000Z ${SOCKET_D}`;

const IterateToFit: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const uid = `itf${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const cam = camOf(frame);
  const k = cam.k;
  const press = pressOf(frame);
  const by = bottomY(frame);
  const tilt = tiltOf(frame);
  const cx = CX0 * (1 - smoothstep(seg(frame, T.lift1, T.peak1)));
  const { w, r } = shapeOf(frame);
  const h = amberOf(frame);
  // one level up while it travels: the shadow deepens with the piece's height over the slab
  const lift = smoothstep(clamp01((4 - by) / 30));
  const band = amberBandFor(cam);

  const th = (tilt * Math.PI) / 180;
  const cos = Math.cos(th);
  const sin = Math.sin(th);
  const toWorld: Map2 = (x, y) => `${n3(cx + x * cos - y * sin)} ${n3(by + x * sin + y * cos)}`;
  const sil: Silhouette = [{ d: piecePath(w, r, toWorld) }, { d: barPath(h, toWorld, RT) }];

  const slotW = BAR + (2 * EDGE.SLOT_LIP) / k;
  const slotH = EDGE.SLOT / k;
  const edgeY = -H + EDGE.CREAM / k / 2;
  const fall = Math.min(EDGE.HOT_FALL / k, h);
  const ao = Math.min(h, EDGE.FOOT_AO / k);
  const barRt = Math.min(RT, h / 2);

  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.ground }}>
      <StoutStage S={frame} cam={cam} rest={CAM_REST} pool={{ x: 0, y: POOL_TRACK[Math.max(0, Math.min(DURATION, Math.round(frame)))] }}>
        <defs>
          <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={SLAB.h}>
            <stop offset="0" stopColor={COLOR.board} />
            <stop offset="1" stopColor={COLOR.boardFoot} />
          </linearGradient>
          <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={WALL + R}>
            <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0.7" />
            <stop offset="0.3" stopColor={COLOR.shadow} stopOpacity="0.82" />
            <stop offset="1" stopColor={COLOR.shadow} stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={-H} x2="0" y2="0">
            <stop offset="0" stopColor={COLOR.cream} />
            <stop offset="1" stopColor={COLOR.creamFoot} />
          </linearGradient>
          <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={n3(band[0] - by - press)} x2="0" y2={n3(band[1] - by - press)}>
            <stop offset="0" stopColor={COLOR.amberTop} />
            <stop offset="1" stopColor={COLOR.amberFoot} />
          </linearGradient>
          <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
            <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
            <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
          </linearGradient>
          <clipPath id={`${uid}sc`}>
            <path d={SOCKET_D} />
          </clipPath>
          <clipPath id={`${uid}pc`}>
            <path d={SHADOW_CLIP_D} />
          </clipPath>
        </defs>

        <g transform={`translate(0 ${n6(press)})`}>
          {/* THE MARKET: the kraft slab, one shadow, its socket a cut-out down to the shadowed ground */}
          <ElevationShadow silhouette={[{ d: SLAB_D }]} elevation="rest" />
          <path d={SOCKET_D} fill={`url(#${uid}s)`} />
          <g clipPath={`url(#${uid}sc)`}>
            {/* the socket's left wall shades its floor (the same key light) */}
            <path d={SLAB_D} fill={COLOR.shadow} fillOpacity={0.5} transform="translate(3.5 5)" style={{ filter: "blur(3px)" }} />
          </g>
          <path d={SLAB_D} fill={`url(#${uid}b)`} />
          <path
            d={`M${SLAB.x0 + RT} ${n3(EDGE.CREAM / k / 2)}H${-R}M${R} ${n3(EDGE.CREAM / k / 2)}H${SLAB.x1 - RT}`}
            stroke={COLOR.edge}
            strokeOpacity={ALPHA.edgeBoard}
            strokeWidth={n3(EDGE.CREAM / k)}
          />

          <Label x={(SLAB.x0 - R) / 2} y={14 + 0.718 * LABEL_W} k={k} px={LABEL_W * k} text="MARKET" tone="dark" />

          {/* THE PRODUCT: the cream piece and its amber, one object, one shadow */}
          <g clipPath={`url(#${uid}pc)`}>
            <ElevationShadow silhouette={sil} elevation="rest" lift={lift} />
          </g>
          <g transform={`translate(${n6(cx)} ${n6(by)}) rotate(${n6(tilt)})`}>
            <path d={piecePath(w, r)} fill={`url(#${uid}c)`} />
            <g style={{ filter: bloomFilter(k) }}>
              <path d={barPath(h)} fill={`url(#${uid}a)`} />
            </g>
            {/* the hot top edge */}
            <path
              d={`M${n3(-BAR / 2 + barRt)} ${n3(-H - h)}H${n3(BAR / 2 - barRt)}A${n3(barRt)} ${n3(barRt)} 0 0 1 ${BAR / 2} ${n3(-H - h + barRt)}V${n3(-H - h + fall)}H${-BAR / 2}V${n3(-H - h + barRt)}A${n3(barRt)} ${n3(barRt)} 0 0 1 ${n3(-BAR / 2 + barRt)} ${n3(-H - h)}Z`}
              fill={`url(#${uid}h)`}
            />
            <path d={`M${n3(-BAR / 2 + barRt)} ${n3(-H - h + EDGE.HOT / k / 2)}H${n3(BAR / 2 - barRt)}`} stroke={COLOR.amberHot} strokeWidth={n3(EDGE.HOT / k)} />
            {/* the piece's lit top edge stops at the slot */}
            <path
              d={`M${n3(-w / 2 + RT)} ${n3(edgeY)}H${n3(-slotW / 2)}M${n3(slotW / 2)} ${n3(edgeY)}H${n3(w / 2 - RT)}`}
              stroke={COLOR.edge}
              strokeOpacity={ALPHA.edge}
              strokeWidth={n3(EDGE.CREAM / k)}
            />
            <Label x={0} y={-H + 15 + 0.718 * LABEL_W} k={k} px={LABEL_W * k} text="PRODUCT" tone="dark" />
            {/* the joint: the bar's foot occlusion and the slot line across it */}
            <rect x={-BAR / 2} y={n3(-H - ao)} width={BAR} height={n3(ao)} fill={`url(#${uid}ao)`} />
            <rect x={n3(-slotW / 2)} y={n3(-H - slotH / 2)} width={n3(slotW)} height={n3(slotH)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
          </g>
          {/* the one click: a light sweep on the amber as it tops out */}
          <LightSweep x={-BAR / 2} y={by - H - h} w={BAR} h={h} k={k} t={(frame - T.sweep) / T.sweepF} on="amber" />
        </g>
      </StoutStage>
    </AbsoluteFill>
  );
};

export default IterateToFit;
