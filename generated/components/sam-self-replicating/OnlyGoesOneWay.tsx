// ---------------------------------------------------------------------------
// OnlyGoesOneWay (sam-self-replicating, cut 21). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 119 frames.
//
// CHECK LINE: "When the model is good enough and the price is low enough, people pile in, and demand just climbs."
//
// THE LINE: "sufficiently capable models at a sufficiently low price, I think that trend only goes one way."
// WORD -> FRAME: capable 6 · models 23 · at 36 · a 45 · sufficiently 49 · low 59 · price 68 · I 80 · think 83 ·
//   that 88 · trend 92 · only 97 · goes 102 · one 107 · way 111 · And 118
// DURATION: the slot 21.230 -> 26.193 s = 4.963 s x 23.976 = 119 frames (f0..f118).
//
// THE MOTION: close on the OpenAI tile a tall ruled cream bar climbs out of its slot (capable). The camera drifts right
// and pulls back to tile and a kraft tag on its twine; the tag sinks on "low price" and lands f64 (contact). First
// reactions: a slit opens in the floor and the glass rises whole out of it (f64-f82), rows of busts rise off the frame's
// lower edge (f67), heads to the glass, and amber starts at the glass's foot (f74). Then a slow push-in with a slight
// rise while tile and tag slide out to the sides and the amber climbs on its own past the frame's middle, ~y 320 at
// "one way" (f107), near the frame top at the end, still rising, the crowd below it, heads tilted up, to the last frame.
// AMBER = compute demand, the fill only (the tag's sticker is cream here, its $ ink); cream = the subject, board = context.
//
// SOURCES: no figures. OpenAI blossom and tag cut-out via sam-pricing-tokens/pricingShared (read-only). The fill is an
// unlabelled proxy shape, not data.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, FONT_NUM, STROKE, StoutStage, TRACK, amberBandFor, bloomFilter, lerp, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
import {
  BUST,
  Bust,
  CROWD,
  CrowdShadow,
  OpenAISlotTile,
  PhotoCutOut,
  PALETTE_ROLES,
  StoutShadow,
  TAG_ART,
  blinkAt,
  photoCutOutSil,
  stickerBox,
  tagPose,
  type Cam,
} from "../sam-pricing-tokens/pricingShared";
import { ContactShadow, Slot, SlotLip } from "../sam-benchmaxxing/benchShared";

export const FPS = 24000 / 1001;
export const DURATION = 119;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- the world (k = 1 is the wide: tile, glass and tag side by side) ---------------------------------------------
const FLOOR = 1075;
const TILE_X = 180;
const TILE_SIZE = 260;
const SHADOW = 2; // pricingShared's SHADOW_S x this tile's 0.65 scale: one lamp, one offset
const BAR_W = 143; // 55 % of the tile
const BAR_H = 650; // 2.5 x the tile by f36
const BAR_RUNG = 108;
const GLASS_X = 542;
const GLASS_W = 300;
const GLASS_FLOOR = 1200; // a little in front of tile and tag: the push-in carries its foot behind the crowd
const GLASS_TOP = -150; // above the frame on the last frame: never reached
const GLASS_F0 = 64;
const GLASS_F1 = 82;
const RUNG = 120;
const TAG_X = 900;
const TAG_H = (0.65 * 330) / TAG_ART.aspect;
const TAG_W = TAG_H * TAG_ART.aspect;
const HOLE_TO_FOOT = (TAG_ART.footV - TAG_ART.holeV) * TAG_H;
const TAG_F0 = 41;
const TAG_LAND = 64;
const TAG_HANG_FOOT = 545;
const HOOK_Y = -3200;

// ---- the camera: one pull-back drift to the wide, overlapped by a slow push-in with a slight rise, alive at the end ----
const WIDE: Cam = { x: 540, y: 900, k: 1 }; // the ground's parallax origin
const CAM = makeClockCam(
  { x: 180, y: 950, k: 1.6 },
  [
    { f0: -4, f1: 65, dx: 360, dy: -50, k: 1.0, warp: 0.85 },
    { f0: 62, f1: 150, dy: -290, k: 1.55 },
  ],
  DURATION,
);
// tile and tag slide out to the sides as the column takes over
const slideAt = (f: number) => smoothstep((f - 78) / 28);
const TILE_SLIDE = -280;
const TAG_SLIDE = 240;

// ---- the amber: climbs on its own, its top solved on screen; monotonic in the world by construction -----------------
const AMBER_F0 = 74;
const AMBER_TOP: number[] = (() => {
  const out: number[] = [];
  let top = GLASS_FLOOR;
  const c0 = CAM.at(AMBER_F0);
  const s0 = 960 + (GLASS_FLOOR - c0.y) * c0.k;
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = CAM.at(f);
    const sy = lerp(s0, 40, smoothstep((f - AMBER_F0) / 48));
    if (f >= AMBER_F0) top = Math.min(top, c.y + (sy - 960) / c.k);
    out.push(top);
  }
  return out;
})();

// ---- the tag ------------------------------------------------------------------------------------------------------
const D2R = Math.PI / 180;
const tagAngle = (f: number) => {
  const P = 26;
  const main = Math.sin((2 * Math.PI * (f - TAG_LAND)) / P);
  const amp = f <= TAG_LAND ? 3.2 * smoothstep((f - (TAG_F0 - 12)) / 16) : 3.2 * Math.exp(-(f - TAG_LAND) / 13);
  return amp * main + 0.18 * Math.sin((2 * Math.PI * (f - TAG_LAND)) / 61);
};
const tagPoseAt = (f: number) => {
  const a = tagAngle(f);
  if (f < TAG_LAND) {
    const u = smoothstep((f - TAG_F0) / (TAG_LAND - TAG_F0));
    const foot = lerp(TAG_HANG_FOOT, FLOOR, u);
    return { x: TAG_X, y: foot - HOLE_TO_FOOT, a };
  }
  // landed: it rocks on its foot (the corner stays on the ground), the same angle curve across the contact
  const s = Math.sin(a * D2R);
  return { x: TAG_X + HOLE_TO_FOOT * s, y: FLOOR - HOLE_TO_FOOT * Math.cos(a * D2R) - (TAG_W / 2) * Math.abs(s) * smoothstep((f - TAG_LAND) / 2), a };
};

const Tag: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const pose = tagPoseAt(f);
  const dx = TAG_SLIDE * slideAt(f);
  const p = { ...pose, x: pose.x + dx };
  const lift = 1 - smoothstep((f - (TAG_LAND - 8)) / 8);
  const boxY = p.y - TAG_ART.holeV * TAG_H + TAG_H / 2;
  const origin = { x: p.x, y: p.y };
  const src = TAG_ART.src as string;
  const twine = `M${p.x} ${p.y}L${TAG_X + dx} ${HOOK_Y}`;
  const tw = 0.016 * TAG_H;
  const box = stickerBox(TAG_W, TAG_H);
  const fs = (0.6 * box.h) / 0.82;
  return (
    <g>
      <StoutShadow
        parts={[...photoCutOutSil({ src, x: p.x, y: boxY, h: TAG_H, aspect: TAG_ART.aspect, rotate: p.a, origin }), { d: twine, stroke: tw }]}
        s={SHADOW}
        elevation="rest"
        lift={lift}
        contact={{ x: TAG_X + dx, y: FLOOR, w: TAG_W }}
      />
      <PhotoCutOut src={src} x={p.x} y={boxY} h={TAG_H} aspect={TAG_ART.aspect} k={k} rotate={p.a} origin={origin} shadow={false} />
      <g transform={tagPose(p.x, p.y, p.a, "hole", TAG_H)}>
        <defs>
          <linearGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" x1="0" y1={box.y} x2="0" y2={box.y + box.h}>
            <stop offset="0" stopColor={COLOR.cream} />
            <stop offset="1" stopColor={COLOR.creamFoot} />
          </linearGradient>
        </defs>
        <path d={rectPath(box.x, box.y, box.w, box.h, box.r)} fill={`url(#${uid}s)`} />
        <text x={box.x + box.w / 2} y={box.y + box.h / 2 + (0.72 * fs) / 2 - 0.03 * fs} fontFamily={FONT_NUM} fontWeight={700} fontSize={fs} letterSpacing={`${TRACK.numeral}em`} textAnchor="middle" fill={COLOR.inkDark}>
          $
        </text>
      </g>
      <path d={twine} stroke={PALETTE_ROLES.twine} strokeWidth={tw} strokeLinecap="round" fill="none" />
    </g>
  );
};

// ---- the glass (benchShared BenchColumn's handling, its fill level free of its height) -----------------------------
const HotEdge: React.FC<{ x: number; y: number; w: number; k: number; id: string }> = ({ x, y, w, k, id }) => (
  <g>
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
        <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect x={x} y={y} width={w} height={EDGE.HOT_FALL / k} fill={`url(#${id})`} />
    <path d={`M${x} ${y + EDGE.HOT / k / 2}H${x + w}`} stroke={COLOR.amberHot} strokeWidth={EDGE.HOT / k} />
  </g>
);
const GLASS_EASE = Easing.bezier(0.3, 0.05, 0.2, 1);
const glassTopAt = (f: number) =>
  lerp(GLASS_FLOOR, GLASS_TOP, interpolate(f, [GLASS_F0, GLASS_F1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: GLASS_EASE }));
const Glass: React.FC<{ cam: Cam; f: number; level: number }> = ({ cam, f, level }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const open = smoothstep((f - (GLASS_F0 - 4)) / 4);
  if (open <= 0) return null;
  const k = cam.k;
  const x0 = GLASS_X - GLASS_W / 2;
  const hair = Math.max(STROKE.HAIRLINE, 2) / k;
  const top = glassTopAt(f);
  const risen = top < GLASS_FLOOR - 0.5;
  // only what the frame can see is drawn (the glass runs past the top of the frame)
  const viewTop = cam.y - 960 / k - 60;
  const capShown = top >= viewTop;
  const y0 = capShown ? top : viewTop;
  const y1 = Math.min(GLASS_FLOOR, cam.y + 960 / k + 60);
  const footVisible = y1 >= GLASS_FLOOR;
  const h = y1 - y0;
  const r = capShown ? Math.min(8, h / 2) : 0;
  const band = amberBandFor(cam);
  const hasAmber = level < GLASS_FLOOR - 0.05;
  const rungs: number[] = [];
  for (let i = 1; top + i * RUNG < y1; i++) if (top + i * RUNG > y0) rungs.push(top + i * RUNG);
  const xl = x0 + hair / 2;
  const xr = x0 + GLASS_W - hair / 2;
  const outline = capShown
    ? `M${xl} ${y1}V${y0 + r}A${r} ${r} 0 0 1 ${xl + r} ${y0 + hair / 2}H${xr - r}A${r} ${r} 0 0 1 ${xr} ${y0 + r}V${y1}`
    : `M${xl} ${y1}V${y0}M${xr} ${y0}V${y1}`;
  return (
    <g>
      {footVisible ? <Slot x={GLASS_X} top={GLASS_FLOOR} w={GLASS_W * Math.min(1, open * 1.02)} k={k} open={open} /> : null}
      {footVisible && risen ? <ContactShadow x={GLASS_X} y={GLASS_FLOOR} w={GLASS_W} k={k} strength={smoothstep((f - GLASS_F0) / 6)} /> : null}
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={band[0]} x2="0" y2={band[1]}>
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
        <linearGradient id={`${uid}f`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity="0.16" />
          <stop offset="0.3" stopColor={COLOR.cream} stopOpacity="0" />
          <stop offset="0.62" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor="#A16608" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${uid}t`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={COLOR.glass} stopOpacity="0" />
          <stop offset="0.5" stopColor={COLOR.glass} stopOpacity="0.09" />
          <stop offset="1" stopColor={COLOR.glass} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}o`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      {risen ? (
        <g>
          <path d={rectPath(x0, y0, GLASS_W, h, r, true, false)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint} />
          {rungs
            .filter((y) => y < level)
            .map((y) => (
              <line key={y} x1={x0} x2={x0 + GLASS_W} y1={y} y2={y} stroke={COLOR.glass} strokeOpacity={0.22} strokeWidth={STROKE.HAIRLINE / k} />
            ))}
          {hasAmber ? (
            <g style={{ filter: bloomFilter(k) }}>
              <rect x={x0} y={level} width={GLASS_W} height={Math.max(0, y1 - level)} fill={`url(#${uid}a)`} />
              <rect x={x0} y={level} width={GLASS_W} height={Math.max(0, y1 - level)} fill={`url(#${uid}f)`} />
            </g>
          ) : null}
          {rungs
            .filter((y) => y > level + (EDGE.HOT + 4) / k)
            .map((y) => (
              <line key={y} x1={x0} x2={x0 + GLASS_W} y1={y} y2={y} stroke={COLOR.rung} strokeWidth={STROKE.HAIRLINE / k} />
            ))}
          {hasAmber ? <HotEdge x={x0} y={level} w={GLASS_W} k={k} id={`${uid}h`} /> : null}
          {footVisible ? <rect x={x0} y={GLASS_FLOOR - Math.min(h, EDGE.FOOT_AO / k)} width={GLASS_W} height={Math.min(h, EDGE.FOOT_AO / k)} fill={`url(#${uid}o)`} /> : null}
          {h > 24 ? <rect x={x0 + GLASS_W * 0.1} y={y0 + 12} width={GLASS_W * 0.14} height={h - 12} fill={`url(#${uid}t)`} /> : null}
          <path d={outline} stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={hair} fill="none" />
        </g>
      ) : null}
      {footVisible ? <SlotLip x={GLASS_X} top={GLASS_FLOOR} w={GLASS_W * Math.min(1, open * 1.02)} k={k} /> : null}
    </g>
  );
};

// ---- the crowd: three rows, back to front, in SCREEN px (StoutStage's overlay) so it stays in shot to the last frame;
// each row rises off the frame's lower edge behind the row in front, then grows slowly with the push-in about the
// frame's foot (nearer rows faster). Values are the LAST frame's: R head radius, Y head centre.
type Row = { R: number; Y: number; pitch: number; n: number; f0: number; body: number; seed: number; grow: number };
const ROWS: Row[] = [
  { R: 56, Y: 1530, pitch: 208, n: 6, f0: 75, body: 560, seed: 5, grow: 0.05 },
  { R: 72, Y: 1606, pitch: 208, n: 7, f0: 71, body: 460, seed: 2, grow: 0.07 },
  { R: 85, Y: 1732, pitch: 208, n: 6, f0: 67, body: 420, seed: 0, grow: 0.1 },
];
const RISE_F = 15;
const riseEase = Easing.bezier(0.3, 0.1, 0.25, 1);
const growE = (f: number) => smoothstep((f - 66) / 74);
const END_E = growE(DURATION - 1);
const Crowd: React.FC<{ f: number }> = ({ f }) => {
  if (f < 66) return null;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "hidden" }}>
      {ROWS.map((row, ri) => {
        const Se = 1 + row.grow * END_E;
        const s = 1 + row.grow * growE(f);
        const r = row.R / Se;
        const yRest = 1920 - (1920 - row.Y) / Se;
        const busts = Array.from({ length: row.n }, (_, i) => {
          const x = 540 + ((i - (row.n - 1) / 2) * row.pitch) / Se;
          const st = row.f0 + ((i * 3 + row.seed) % 5);
          const u = interpolate(f, [st, st + RISE_F], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: riseEase });
          return { x, y: lerp(1920 + 1.3 * r + 12, yRest, u), r, facing: (x < GLASS_X ? 1 : -1) as -1 | 1, bodyLen: row.body };
        });
        return (
          <g key={ri} transform={`translate(540 1920) scale(${s}) translate(-540 -1920)`}>
            <CrowdShadow busts={busts} s={(r / BUST.R) * 1.6} elevation="lifted" />
            {busts.map((b, i) => {
              const n = (i * 3 + ri * 4 + row.seed) % CROWD.length;
              const tilt = -(5 + 19 * smoothstep((f - (80 + ((i * 5) % 7))) / 26)); // negative: the face turns up (Bust's rotation sign)
              return <Bust key={i} {...b} spec={CROWD[n]} pose={{ tilt, smile: 0.45, blink: blinkAt(n + ri * 10, f), bob: 1.6 * Math.sin((f + i * 11 + ri * 7) / 9) }} />;
            })}
          </g>
        );
      })}
    </svg>
  );
};

// ---- the tile and its bar -----------------------------------------------------------------------------------------
const barH = (f: number) => BAR_H * smoothstep((f + 6) / 44);
const TileAndBar: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const top = FLOOR - TILE_SIZE;
  const h = barH(f);
  const x = TILE_X + TILE_SLIDE * slideAt(f);
  const x0 = x - BAR_W / 2;
  const barTop = top - h;
  const d = rectPath(x0, barTop, BAR_W, h + 8, 8, true, false);
  const rungs: number[] = [];
  for (let i = 1; barTop + i * BAR_RUNG < top - 4; i++) rungs.push(barTop + i * BAR_RUNG);
  return (
    <OpenAISlotTile x={x} floor={FLOOR} k={k} size={TILE_SIZE} s={SHADOW} extraSil={[{ d }]} occupant={BAR_W}>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={barTop} x2="0" y2={top}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${uid}b)`} />
      {rungs.map((y) => (
        <line key={y} x1={x0} x2={x0 + BAR_W} y1={y} y2={y} stroke={COLOR.inkDark} strokeOpacity={0.16} strokeWidth={STROKE.HAIRLINE / k} />
      ))}
      <path d={`M${x0 + 8} ${barTop + EDGE.CREAM / k / 2}H${x0 + BAR_W - 8}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={EDGE.CREAM / k} />
    </OpenAISlotTile>
  );
};

const OnlyGoesOneWay: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const level = S < AMBER_F0 ? GLASS_FLOOR : AMBER_TOP[Math.min(S, AMBER_TOP.length - 1)];
  return (
    <StoutStage S={S} cam={cam} rest={WIDE} pool={{ x: cam.x, y: cam.y }} overlay={<Crowd f={S} />}>
      <Glass cam={cam} f={S} level={level} />
      <TileAndBar f={S} k={cam.k} />
      <Tag f={S} k={cam.k} />
    </StoutStage>
  );
};

export default OnlyGoesOneWay;
