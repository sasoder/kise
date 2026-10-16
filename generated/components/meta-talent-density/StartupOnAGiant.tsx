import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  ELEVATION,
  GEO,
  LightSweep,
  STROKE,
  StoutStage,
  amberBandFor,
  bloomFilter,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  type Elevation,
} from "../kits/cheeky-pint/stoutShared";
import { META_BOX, MetaMark, PEG, TeamTile, teamTileLayout } from "../kits/cheeky-pint/talentShared";

// ===========================================================================
// StartupOnAGiant — cut 3 of the Cheeky Pint S4E03 (Meta) clip "Talent density beat team size", in the
// stout system (stoutShared.tsx) with the clip's vocabulary (talentShared.tsx).
//
// CHECK LINE: "MSL is a small startup-sized team standing on top of a giant company that holds it
// steady and feeds it resources."
//
// THE LINE (Mark Zuckerberg): "[in some ways it has all] the benefits of a startup with the stability
// and resources of a larger company".
// DURATION: slot = round(4.129 x 23.976) = 99 frames, + a 12-frame living tail = 111.
// ONSETS (f): the benefits 3-6 · of a 12 · startup 19 · with 27 · the 38 · stability 41 · and 50 ·
// resources 58 · of 66 · a larger 76 · company 82.
//
// ONE MOTION: the small team tile (six amber pegs) is airborne: it darts across the frame, light and
// unanchored, its shadow thrown well clear of it on the ground, and comes to hover over one spot. The
// camera eases back and a massive cream pillar with the Meta mark knocked out of its face rises out of
// a slot in the ground under it, meets the tile (f 49: the tile goes dead still, its shadow closes to a
// contact shadow) and carries it a little higher. Then amber rises inside the pillar from below — up
// the glass channel, through the mark, up the channel again — to the team, whose pegs step up to full
// amber; one light sweep runs down the giant's face.
//
// FRAMES
//   0-33    the tile at FLOAT darts left-right-left across the frame (three direction changes, each a
//           smooth turn), leaning into its glide, and arrives over the spot
//   33-48   it hovers there with a small quick sway (zero on f 49, at speed: it stops dead)
//   0-32    the camera eases back (k 1.26 -> 0.92) and tilts down to show the ground under the tile
//   26-29   the slot opens in the ground
//   28-68   the pillar rises out of the slot, full width, at speed from its first frame (a solid block
//           from f 29), a long soft landing
//   49      CONTACT: the pillar's top edge meets the tile's bottom edge; from here the tile rides it
//   30-62   the camera comes back up with the pillar; the tile settles at screen y ~880
//   58-80   the amber front rises from the slot to the pillar's top (channel, mark, channel)
//   79-91   the pegs answer: their amber and bloom step up to full (tone, no pulse)
//   84-97   THE ONE LIGHT SWEEP, down the pillar's face across the mark
//   50-     a slow push (4.5 %) through the hold and the tail; sway and grain
// ===========================================================================

export const FPS = 24000 / 1001;
export const SLOT_FRAMES = 99;
export const TAIL = 12;
export const DURATION = SLOT_FRAMES + TAIL; // 111

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const f6 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `sg${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// --- the world (WORLD px) -----------------------------------------------------------------------------
const X = 540;
const TILE = teamTileLayout({ x: X, y: 960, peg: PEG.M }); // 471 x 356: the team, floating at (540, 960)
const TILE_BOTTOM = 960 + TILE.h / 2;
// the giant: 1032 wide (2.2 team tiles), 1000 tall when it stands (it runs off the frame's bottom)
const PIL = { w: 1032, h: 1000 } as const;
const T = {
  slot: [26, 29],
  rise: [28, 68],
  contact: 49,
  fill: [58, 80],
  answer: [79, 91],
  sweep: [84, 97],
} as const;
/** The pillar's rise 0..1: velocity ∝ (u + a)(1 - u)^2 — it leaves the slot already at speed (a block ~40 px
 *  tall on its first frame), peaks early (~44 world px/f) and has a long soft landing. */
const RISE_A = 0.3;
const riseAt = (f: number) => {
  const u = clamp01((f - T.rise[0]) / (T.rise[1] - T.rise[0]));
  const w = 1 - u;
  return (((1 + RISE_A) * (1 - w * w * w)) / 3 - (1 - w * w * w * w) / 4) / ((1 + RISE_A) / 3 - 1 / 4);
};
/** The slot lies where the rising pillar's top meets the floating tile exactly on the contact frame. */
const SLOT_Y = TILE_BOTTOM + PIL.h * riseAt(T.contact);
const pillarTopAt = (f: number) => SLOT_Y - PIL.h * riseAt(f);
// the mark on the face: its centre below the pillar's top, its height (the logo ~540 world px wide; its top clears the slot only when a third of the pillar is out)
const MARK = { cy: 500, h: 358 } as const;
const MARK_W = (MARK.h * META_BOX.w) / META_BOX.h;
// the face card MetaMark draws: centred on the mark, so its top edge is the pillar's top
const FACE_H = 2 * MARK.cy;
// the glass channel in the face: from the slot up to the mark, and from the mark up to the tile
// (`cap`: the face closes over the channel just under the top edge, so the pillar is one slab, never two)
const CH = { w: 88, inset: 7, gap: 48, rung: 64, cap: 18 } as const;
// the pegs before the resources reach them: amber, clearly a step under full (and under full bloom)
const PEG_BEFORE = 0.62;

// The Meta infinity's three shapes (Wikimedia "Meta Platforms Inc. logo (cropped)", public/cheekypint2/
// meta4/): the same paths talentShared.MetaMark knocks out (not exported there); here only as the
// clip shape of the amber seen THROUGH that knock-out.
const META_D = [
  "m31.06,125.96c0,10.98 2.41,19.41 5.56,24.51 4.13,6.68 10.29,9.51 16.57,9.51 8.1,0 15.51-2.01 29.79-21.76 11.44-15.83 24.92-38.05 33.99-51.98l15.36-23.6c10.67-16.39 23.02-34.61 37.18-46.96 11.56-10.08 24.03-15.68 36.58-15.68 21.07,0 41.14,12.21 56.5,35.11 16.81,25.08 24.97,56.67 24.97,89.27 0,19.38-3.82,33.62-10.32,44.87-6.28,10.88-18.52,21.75-39.11,21.75l0-31.02c17.63,0 22.03-16.2 22.03-34.74 0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16.05c-18.2,32.27-22.81,39.62-31.91,51.75-15.95,21.24-29.57,29.29-47.5,29.29-21.27,0-34.72-9.21-43.05-23.09-6.8-11.31-10.14-26.15-10.14-43.06z",
  "m24.49,37.3c14.24-21.95 34.79-37.3 58.36-37.3 13.65,0 27.22,4.04 41.39,15.61 15.5,12.65 32.02,33.48 52.63,67.81l7.39,12.32c17.84,29.72 27.99,45.01 33.93,52.22 7.64,9.26 12.99,12.02 19.94,12.02 17.63,0 22.03-16.2 22.03-34.74l27.4-.86c0,19.38-3.82,33.62-10.32,44.87-6.28,10.88-18.52,21.75-39.11,21.75-12.8,0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71l-25.79-43.08c-12.94-21.62-24.81-37.74-31.68-45.04-7.39-7.85-16.89-17.33-32.05-17.33-12.27,0-22.69,8.61-31.41,21.78z",
  "m82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78-12.33,18.61-19.88,46.33-19.88,72.95 0,10.98 2.41,19.41 5.56,24.51l-26.48,17.44c-6.8-11.31-10.14-26.15-10.14-43.06 0-30.75 8.44-62.8 24.49-87.55 14.24-21.95 34.79-37.3 58.36-37.3z",
];

// --- the camera -----------------------------------------------------------------------------------------
const K0 = 1.26; // the tile 594 px wide (55 % of the frame)
const PUSH = 1.045; // the slow push of the hold and the tail
const K_END = 0.963; // the last frame: the tile 454 px wide (42 %), the pillar 994 px (92 %)
const K1 = K_END / PUSH;
const TILT = 170; // how far the camera looks down (world px) to show the slot before the pillar leaves it
const TILE_END_Y = SLOT_Y - PIL.h - TILE.h / 2; // the tile's centre when the pillar stands
const CAM_END_Y = TILE_END_Y + (960 - 880) / K_END; // the tile's centre at screen y 880 on the last frame
export const camAt = (f: number): Cam => {
  const a = smoothstep(Math.pow(clamp01(f / 32), 1.6)); // back and down: alive from f 0
  const b = smoothstep((f - 30) / 32); // back up with the pillar
  const w = clamp01((f - 50) / 60);
  const push = w * w * (2 - w);
  return {
    x: X,
    y: 960 + TILT * a - (960 + TILT - CAM_END_Y) * b,
    k: Math.exp(lerp(Math.log(K0), Math.log(K1), a) + Math.log(PUSH) * push),
  };
};

// the tile's glide while it floats: [frame, dx, dy] turning points (world px from the spot); it eases
// from one to the next (a smooth turn at each, no overshoot) and ends over the spot
const GLIDE: [number, number, number][] = [
  [-6, -160, -26],
  [8, 118, 32],
  [17, -112, -34],
  [25, 70, 16],
  [33, 0, 0],
];
const glideAt = (f: number) => {
  const last = GLIDE[GLIDE.length - 1];
  if (f >= last[0]) return { x: 0, y: 0 };
  let i = 0;
  while (i < GLIDE.length - 2 && f >= GLIDE[i + 1][0]) i++;
  const [f0, x0, y0] = GLIDE[i];
  const [f1, x1, y1] = GLIDE[i + 1];
  const e = smoothstep((f - f0) / (f1 - f0));
  return { x: lerp(x0, x1, e), y: lerp(y0, y1, e) };
};
/** The tile: where its centre is and how it is tilted. Before contact it is airborne: the glide, a small
 *  quick sway on top (every term zero ON the contact frame and still moving the frame before: it stops
 *  dead), leaning a little into its own speed. From contact it stands on the pillar's top. */
const tileAt = (f: number) => {
  if (f >= T.contact) return { x: X, y: pillarTopAt(f) - TILE.h / 2, rot: 0 };
  const d = f - T.contact;
  const s = (period: number) => Math.sin((2 * Math.PI * d) / period);
  const g = glideAt(f);
  const vx = glideAt(f + 0.5).x - glideAt(f - 0.5).x;
  return {
    x: X + g.x + 7 * s(14) + 3 * s(7),
    y: 960 + g.y + 6 * s(10.5) + 3 * s(6),
    rot: 0.045 * vx + 0.7 * s(12),
  };
};

/** The tile's shadow: FLOAT until the pillar's top is nearly there, closing through LIFTED to REST (with
 *  its contact shadow) exactly on the contact frame. */
const tileShadowAt = (f: number): { elevation: Elevation; lift: number } => {
  const t = clamp01((f - (T.contact - 4)) / 4);
  if (t <= 0) return { elevation: "float", lift: 0 };
  if (t < 0.5) return { elevation: "lifted", lift: 1 - 2 * t };
  return { elevation: "rest", lift: 2 - 2 * t };
};

// airborne: the tile's shadow thrown clear of it on the ground (the one light: down and a little right)
const FLOAT = [
  { dx: 70, dy: 150, blur: 60, a: 0.22 },
  { dx: 56, dy: 132, blur: 20, a: 0.4 },
] as const;
// the same light on a much larger object: the stout rest shadow, scaled to the pillar
const BIG = 3;

const Giant: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const uid = uidOf(useId());
  const k = cam.k;
  const band = amberBandFor(cam);
  const top = pillarTopAt(f);
  const vis = SLOT_Y - top;
  const x0 = X - PIL.w / 2;
  const slot = smoothstep((f - T.slot[0]) / (T.slot[1] - T.slot[0]));
  const slotW = (PIL.w + (2 * EDGE.SLOT_LIP) / k) * slot;
  const slotH = (3 * EDGE.SLOT) / k; // an open pocket (as an empty PegSlot on a card)
  const slotMark =
    slot > 0.001 ? (
      <g>
        <rect x={f2(X - slotW / 2)} y={f2(SLOT_Y - slotH / 2)} width={f2(slotW)} height={f2(slotH)} fill={COLOR.shadow} fillOpacity={0.9} />
        <rect x={f2(X - slotW / 2)} y={f2(SLOT_Y + slotH / 2)} width={f2(slotW)} height={f2(1 / k)} fill={COLOR.board} fillOpacity={0.3} />
      </g>
    ) : null;
  if (vis <= 0.3) return slotMark;

  const markCy = top + MARK.cy;
  const markTop = markCy - MARK.h / 2;
  const markBot = markCy + MARK.h / 2;
  const sc = MARK.h / META_BOX.h;
  const lx = X - MARK_W / 2;
  // the channel's two runs (world y): B from just under the pillar's top down to the mark, A from the mark to the slot
  const runs = [
    { y0: top + CH.cap, y1: markTop - CH.gap },
    { y0: markBot + CH.gap, y1: SLOT_Y },
  ].filter((r) => r.y1 - r.y0 > 0.5 && r.y0 < SLOT_Y);
  const cx0 = X - CH.w / 2;
  // the amber front
  const u = clamp01((f - T.fill[0]) / (T.fill[1] - T.fill[0]));
  const fe = lerp(u, 1 - (1 - u) * (1 - u), 0.6);
  const front = SLOT_Y - fe * (vis - CH.cap);
  const filling = u > 0;
  const moving = u > 0 && u < 1;
  const amber = `url(#${uid}a)`;
  const hot = EDGE.HOT / k;
  const fall = EDGE.HOT_FALL / k;
  const recess = mixHex(COLOR.ground, COLOR.shadow, 0.45);
  const sStrength = clamp01(vis / 80);
  const R = ELEVATION.rest;
  const sil = rectPath(x0, top, PIL.w, vis, GEO.RADIUS, true, false);
  const ao = Math.min(vis, (3 * EDGE.FOOT_AO) / k);
  const sweep = (f - T.sweep[0]) / (T.sweep[1] - T.sweep[0]);
  // rungs ride the pillar: every CH.rung from its top
  const rungs: number[] = [];
  if (filling) {
    for (let y = top + CH.rung; y < SLOT_Y; y += CH.rung) {
      if (y > front + (EDGE.HOT + 3) / k && runs.some((r) => y > r.y0 + 2 && y < r.y1 - 2)) rungs.push(y);
    }
  }
  const pcx = X;
  const pcy = top + vis / 2;
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <clipPath id={`${uid}g`}>
          <rect x={f2(x0 - PIL.w)} y={f2(top - 400)} width={f2(3 * PIL.w)} height={f2(vis + 400)} />
        </clipPath>
        <clipPath id={`${uid}m`}>
          {META_D.map((d, i) => (
            <path key={i} d={d} transform={`translate(${f2(lx)} ${f2(markTop)}) scale(${f6(sc)})`} />
          ))}
        </clipPath>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        <linearGradient id={`${uid}hf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}in`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0.5" />
          <stop offset="0.35" stopColor={COLOR.shadow} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. the giant's one shadow: the stout rest shadow scaled to it, and its contact at the slot */}
      <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
        {R.contact ? (
          <ellipse cx={X + R.contact.dx * BIG} cy={SLOT_Y} rx={PIL.w * 0.52} ry={3 * BIG} opacity={f2(R.contact.a * sStrength)} style={{ filter: `blur(${f2(R.contact.blur * BIG)}px)` }} />
        ) : null}
        {[R.amb, R.key].map((l, i) => (
          <g key={i} opacity={f2(l.a * sStrength)} transform={`translate(${f2(l.dx * BIG)} ${f2(l.dy * BIG)})`} style={{ filter: `blur(${f2(l.blur * BIG)}px)` }}>
            <path d={sil} />
          </g>
        ))}
      </g>

      {/* 2. the face: MetaMark's card (the mark knocked out of it), cut at the slot line it rises from */}
      <g clipPath={`url(#${uid}g)`}>
        <MetaMark x={X} y={markCy} k={k} w={PIL.w} h={FACE_H} logoH={MARK.h} />
        {/* the channel: a recess in the face (the same dark as the knock-out), glass over it */}
        {runs.map((r, i) => (
          <g key={i}>
            <rect x={f2(cx0)} y={f2(r.y0)} width={CH.w} height={f2(r.y1 - r.y0)} fill={recess} />
            <rect x={f2(cx0)} y={f2(r.y0)} width={CH.w} height={f2(r.y1 - r.y0)} fill={`url(#${uid}in)`} />
            <rect x={f2(cx0)} y={f2(r.y0)} width={CH.w} height={f2(r.y1 - r.y0)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
          </g>
        ))}

        {/* 3. the amber, below the front: in the channel's runs and seen through the mark — one glow pass */}
        {filling ? (
          <>
            <g style={{ filter: bloomFilter(k) }}>
              {runs.map((r, i) => {
                const y = Math.max(r.y0, front);
                return r.y1 - y > 0.3 ? <rect key={i} x={f2(cx0 + CH.inset)} y={f2(y)} width={CH.w - 2 * CH.inset} height={f2(r.y1 - y)} fill={amber} /> : null;
              })}
              {front < markBot ? (
                <g clipPath={`url(#${uid}m)`}>
                  <rect x={f2(lx - 4)} y={f2(Math.max(markTop - 4, front))} width={f2(MARK_W + 8)} height={f2(markBot + 4 - Math.max(markTop - 4, front))} fill={amber} />
                </g>
              ) : null}
            </g>
            {rungs.length ? (
              <g stroke={COLOR.rung} strokeWidth={f2(STROKE.HAIRLINE / k)}>
                {rungs.map((y) => (
                  <line key={y} x1={f2(cx0 + CH.inset)} x2={f2(cx0 + CH.w - CH.inset)} y1={f2(y)} y2={f2(y)} />
                ))}
              </g>
            ) : null}
            {/* the front's hot edge: across the channel, or across the mark while it passes through it */}
            {runs.some((r) => front >= r.y0 - 0.01 && front < r.y1) ? (
              <g>
                <rect x={f2(cx0 + CH.inset)} y={f2(front)} width={CH.w - 2 * CH.inset} height={f2(Math.min(fall, SLOT_Y - front))} fill={`url(#${uid}hf)`} />
                <rect x={f2(cx0 + CH.inset)} y={f2(front)} width={CH.w - 2 * CH.inset} height={f2(hot)} fill={COLOR.amberHot} />
              </g>
            ) : moving && front > markTop && front < markBot ? (
              <g clipPath={`url(#${uid}m)`}>
                <rect x={f2(lx)} y={f2(front)} width={f2(MARK_W)} height={f2(fall)} fill={`url(#${uid}hf)`} />
                <rect x={f2(lx)} y={f2(front)} width={f2(MARK_W)} height={f2(hot)} fill={COLOR.amberHot} />
              </g>
            ) : null}
          </>
        ) : null}

        {/* the glass hairlines down the channel's sides (open at both ends) */}
        {runs.map((r, i) => (
          <path
            key={i}
            d={`M${f2(cx0 + STROKE.HAIRLINE / k / 2)} ${f2(r.y0)}V${f2(r.y1)}M${f2(cx0 + CH.w - STROKE.HAIRLINE / k / 2)} ${f2(r.y0)}V${f2(r.y1)}`}
            fill="none"
            stroke={COLOR.glass}
            strokeOpacity={ALPHA.glassLo}
            strokeWidth={f2(STROKE.HAIRLINE / k)}
          />
        ))}

        {/* the foot: a short occlusion above the slot */}
        <rect x={f2(x0)} y={f2(SLOT_Y - ao)} width={PIL.w} height={f2(ao)} fill={`url(#${uid}ao)`} />

        {/* THE ONE LIGHT SWEEP: down the face, across the mark (the house sweep turned a quarter, its band
            scaled with the object it crosses) */}
        {sweep > 0 && sweep < 1 ? (
          <g transform={`rotate(90 ${f2(pcx)} ${f2(pcy)})`}>
            <LightSweep x={pcx - vis / 2} y={pcy - PIL.w / 2} w={vis} h={PIL.w} k={k / 3} t={sweep} on="cream" r={0} />
          </g>
        ) : null}
      </g>

      {/* 4. the joint: the slot line across the pillar's foot */}
      {slotMark}
    </g>
  );
};

const StartupOnAGiant: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const rest = camAt(0);
  const k = cam.k;
  const band = amberBandFor(cam);
  const tile = tileAt(f);
  const sh = tileShadowAt(f);
  const answer = smoothstep((f - T.answer[0]) / (T.answer[1] - T.answer[0]));
  const blend = lerp(PEG_BEFORE, 1, answer);
  const air = 1 - smoothstep((f - (T.contact - 7)) / 7); // 1 floating .. 0 on the contact frame
  const poolDown = smoothstep((f - 42) / 30);
  const seated = Array.from({ length: 6 }, () => ({ tone: "amber" as const, blend }));
  return (
    <AbsoluteFill>
      <StoutStage S={f} cam={cam} rest={rest} pool={{ x: lerp(tile.x, X, 0.5), y: tile.y + 300 * poolDown }}>
        <Giant f={f} cam={cam} />
        <g transform={tile.rot ? `rotate(${f6(tile.rot)} ${f2(tile.x)} ${f2(tile.y)})` : undefined}>
          {/* while it is airborne: its shadow on the ground, well clear of it; it closes under the tile as
              the pillar's top arrives */}
          {air > 0.004 ? (
            <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
              {FLOAT.map((l, i) => (
                <g key={i} opacity={f2(l.a * Math.min(1, air * 1.5))} transform={`translate(${f2(l.dx * air)} ${f2(l.dy * air)})`} style={{ filter: `blur(${f2(l.blur * lerp(0.4, 1, air))}px)` }}>
                  <path d={rectPath(tile.x - TILE.w / 2, tile.y - TILE.h / 2, TILE.w, TILE.h)} />
                </g>
              ))}
            </g>
          ) : null}
          <TeamTile x={tile.x} y={tile.y} peg={PEG.M} k={k} seated={seated} elevation={sh.elevation} lift={sh.lift} amberBand={band} />
        </g>
      </StoutStage>
    </AbsoluteFill>
  );
};

export default StartupOnAGiant;
