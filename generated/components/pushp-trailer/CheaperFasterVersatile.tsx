// ---------------------------------------------------------------------------
// CheaperFasterVersatile (pushp-trailer, cut 8), round 2. Core Memory podcast style, the ARCHIVE COLLAGE at 16:9
// (../neal-stephenson-trailer/nealShared). Opaque 1920x1080, 23.976 fps, 218 frames; finals --scale 2.
//
// CHECK LINE: Airbound's aircraft flies on through the sky while what it beats, most of logistics and nearly all human
// transport, becomes real around it.
//
// THE LINE: "that are cheaper, faster, and more versatile than 80% of the entire logistics market and 90% of the human
// transportation market."
// WORD -> FRAME: cheaper 8, faster 27, and 40, more 44, versatile 48, than 55, 80 68, % 77, entire 101, logistics 109,
// market 124, and 135, 90 144, % 151, human 176, transportation 189, market 200, speech ends ~205.
// DURATION: the slot 8.634 -> 17.726 s = 9.092 s x 23.976 = 218 frames (f0..f217).
//
// THE MOTION: the squared paper is a long sky above a sea of real-cloud flats (natural contour, soft shadow). One word at
// a time owns the frame: each rises centred and huge from behind the bank in the chain sting a few frames before its
// onset, then sinks back behind the clouds as the next rises (all word pixels gone by f70). The camera creeps right over
// the words, then from f56 tilts up and keeps running: the bank falls to the bottom quarter of the frame as pie one comes
// up, a move that carries words to pies with no cut. Each pie rises from behind the clouds on its own easing, unlinked to
// the aircraft; its wedge is a window onto a black-and-white photograph (freight, then the Mumbai local) that sweeps by
// itself; the chain marks each payoff once (a crown on the finished wedge). The aircraft is the through-line: under way
// at f0, travelling right across the words, on one shallow line low across pie one, through the gap and low across pie
// two, then climbing away to the right of it into the clear paper upper right, whole and still moving at f217, banking along its heading, its one soft shadow on the paper falling further off as it
// climbs.
//
// CHAIN MEANING: what Airbound's aircraft outdoes.
//
// SOURCES: these shares are the speaker's stated goal, not data, so no source lines. Clouds: plate_sky_cumulus (the Kelly
// Johnson clip's plate), cut by scripts/clips/pushp-trailer/bake-cfv-clouds.py. Pie photos: the clip's stills
// 11.5a ContainerShipKochiIndia2023 and 16.0a MumbaiLocalHangingOffDoors2006, same script. Aircraft: fk_aircraft.png, the
// same cleaned aircraft and grade as FiveKilosThreeKilo (AI-made from Airbound's photos).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLUE,
  CaptionBands,
  EASE_LAND,
  INK,
  NEAL_FILTER,
  type NealCam,
  NealFilmLife,
  NealPlane,
  NealSvg,
  ORANGE,
  PURPLE,
  PaperGround,
  SHADOW,
  clamp,
  depthTransform,
  type as typeStyle,
} from "../neal-stephenson-trailer/nealShared";

export const FPS = 24000 / 1001;
export const DURATION = 218;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// ---------------------------------------------------------------------------
// Tracks: coarse keys, linearly interpolated, then box-smoothed per frame at module load (deterministic).
// ---------------------------------------------------------------------------
const PRE = 40;
const track = (keys: [number, number][], win = 7) => {
  const F = keys.map((k) => k[0]);
  const V = keys.map((k) => k[1]);
  const raw: number[] = [];
  for (let f = -PRE - win; f <= DURATION + win; f++) raw.push(interpolate(f, F, V, clamp));
  const out: number[] = [];
  for (let f = -PRE; f <= DURATION; f++) {
    let s = 0;
    for (let i = -win; i <= win; i++) s += raw[f + PRE + win + i];
    out.push(s / (2 * win + 1));
  }
  return (f: number) => {
    const c = Math.max(-PRE, Math.min(DURATION, f)) + PRE;
    const a = Math.floor(c);
    const b = Math.min(a + 1, out.length - 1);
    return out[a] + (out[b] - out[a]) * (c - a);
  };
};

// -- the camera --------------------------------------------------------------
const CAM_V = track([
  [-40, 6],
  [54, 6],
  [68, 9],
  [106, 5],
  [126, 9],
  [150, 6],
  [186, 1.5],
  [217, 0.9],
]);
const CAM_K = track(
  [
    [-40, 1],
    [48, 1],
    [92, 1.05],
    [122, 1.04],
    [176, 1],
    [217, 0.992],
  ],
  10,
);
/** The tilt: the camera rises so the bank falls from y ~570 to the bottom quarter. */
const TILT = 244;
const CAM_Y = track(
  [
    [-40, 540],
    [58, 540],
    [106, 540 - TILT],
    [217, 540 - TILT - 3],
  ],
  12,
);
const CAM_XS: number[] = [960];
for (let f = 1; f <= PRE + DURATION; f++) CAM_XS.push(CAM_XS[f - 1] + CAM_V(f - PRE));
const camX = (f: number) => {
  const c = Math.max(0, Math.min(PRE + DURATION, f + PRE));
  const a = Math.floor(c);
  const b = Math.min(a + 1, CAM_XS.length - 1);
  return CAM_XS[a] + (CAM_XS[b] - CAM_XS[a]) * (c - a);
};
const X_REST = camX(0);
const CAM_END = camX(DURATION - 1);
const camAt = (f: number): NealCam => ({ x: camX(f), y: CAM_Y(f), k: CAM_K(f), x0: X_REST, y0: 540 });
/** The world x on plane d that sits at screen x `sx` on frame f. */
const at = (f: number, d: number, sx: number) => {
  const t = depthTransform(camAt(f), d);
  return (sx - t.tx) / t.k;
};

// -- the set: real-cloud flats, natural contour, base and sides dissolving, one soft shadow ------------------------
const FLATS = {
  tower: { w: 1680, h: 1250 },
  shelfb: { w: 880, h: 810 },
  crest: { w: 1360, h: 810 },
  knob: { w: 780, h: 650 },
  lump: { w: 580, h: 430 },
} as const;
type FlatName = keyof typeof FLATS;

const Flat: React.FC<{ name: FlatName; x: number; y: number; s: number; flip?: boolean; air?: number; cast?: number; soft?: number }> = ({
  name,
  x,
  y,
  s,
  flip,
  air = 0,
  cast = 20,
  soft = 0,
}) => {
  const { w, h } = FLATS[name];
  const box: React.CSSProperties = {
    position: "absolute",
    left: x,
    top: y,
    width: w * s,
    height: h * s,
    maxWidth: "none",
    transform: flip ? "scaleX(-1)" : undefined,
  };
  const parts: string[] = [];
  if (air > 0) parts.push(`contrast(${1 - 0.34 * air}) brightness(${1 + 0.1 * air})`);
  if (soft > 0) parts.push(`blur(${soft}px)`);
  return (
    <>
      <Img src={staticFile(`pushp-trailer/cfv_${name}_natsoft.png`)} style={{ ...box, left: x + cast, top: y + cast * 1.25, opacity: air > 0 ? 0.65 : 1 }} />
      <Img src={staticFile(`pushp-trailer/cfv_${name}_nat.png`)} style={{ ...box, filter: parts.length ? parts.join(" ") : undefined }} />
    </>
  );
};

type Placed = { name: FlatName; f: number; sx: number; y: number; s: number; flip?: boolean; air?: number };
const Bank: React.FC<{ d: number; frame: number; drift?: number; items: Placed[]; soft?: number }> = ({ d, frame, drift = 0, items, soft }) => (
  <NealPlane cam={camAt(frame)} d={d}>
    {items.map((p, i) => (
      <Flat key={`${p.name}${i}`} name={p.name} x={at(p.f, d, p.sx) + drift * frame * (i % 2 ? 1 : 0.7)} y={p.y} s={p.s} flip={p.flip} air={p.air} soft={soft} />
    ))}
  </NealPlane>
);

const D_BACK = 1.3;
const D_FRONT = 0.92;
const D_NEAR = 0.62;

const BACK_ITEMS: Placed[] = [
  { name: "crest", f: 0, sx: -300, y: 440, s: 0.92, air: 0.35, flip: true },
  { name: "shelfb", f: 0, sx: 420, y: 400, s: 1.3, air: 0.35 },
  { name: "crest", f: 0, sx: 1120, y: 446, s: 0.96, air: 0.35 },
  { name: "shelfb", f: 0, sx: 1960, y: 396, s: 1.34, air: 0.35, flip: true },
  { name: "crest", f: 0, sx: 2640, y: 442, s: 0.94, air: 0.35, flip: true },
];
// Flats overlap by more than their dissolving sides, so the sea has no seam and nothing shows through it.
const FRONT_ITEMS: Placed[] = [
  { name: "shelfb", f: 0, sx: -640, y: 322, s: 1.72, flip: true },
  { name: "crest", f: 0, sx: -20, y: 470, s: 1.2 },
  { name: "shelfb", f: 0, sx: 800, y: 350, s: 1.58 },
  { name: "shelfb", f: 0, sx: 1330, y: 296, s: 1.9, flip: true },
  { name: "crest", f: 0, sx: 2120, y: 482, s: 1.14, flip: true },
  { name: "shelfb", f: 0, sx: 2850, y: 336, s: 1.64 },
  { name: "crest", f: 0, sx: 3400, y: 464, s: 1.24 },
];
const NEAR_ITEMS: Placed[] = [{ name: "crest", f: 24, sx: 540, y: 640, s: 1.2 }];

// -- the words ---------------------------------------------------------------
const CHAIN_LAYERS = [ORANGE, PURPLE, BLUE];
const STING_TRAVEL = 16;
const STING_STAGGER = 2;
const WORD_DROP = 470; // far enough below the bank that no word pixel is left
const WORD_SHADOW = 9;
const WORD_BASE = 578;
const WORD_CLIP = 760;

/** Centred, huge; rises in the chain sting, then is swallowed by the clouds. Nothing fades. */
const Word: React.FC<{ text: string; frame: number; start: number; centreAt: number; size: number; sinkAt: number; sinkEnd: number }> = ({
  text,
  frame,
  start,
  centreAt,
  size,
  sinkAt,
  sinkEnd,
}) => {
  if (frame < start || frame > sinkEnd) return null;
  const x = at(centreAt, 1, 960);
  const sink = interpolate(frame, [sinkAt, sinkEnd], [0, WORD_DROP], { easing: Easing.bezier(0.55, 0, 0.8, 0.5), ...clamp });
  const pos = (i: number) =>
    WORD_BASE + sink + WORD_DROP * (1 - interpolate(frame, [start + i * STING_STAGGER, start + i * STING_STAGGER + STING_TRAVEL], [0, 1], { easing: EASE_LAND, ...clamp }));
  const core = pos(3);
  const coreIn = frame >= start + 3 * STING_STAGGER;
  const colorsGone = frame > start + 3 * STING_STAGGER + 9;
  const t = (fill: string, y: number, dx = 0) => (
    <text x={x + dx} y={y} textAnchor="middle" fill={fill} style={typeStyle(size, 900)}>
      {text}
    </text>
  );
  return (
    <div style={{ position: "absolute", left: -2000, top: -1000, width: 12000, height: 1000 + WORD_CLIP, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 2000, top: 1000 }}>
        <NealSvg>
          {coreIn ? t(SHADOW, core + WORD_SHADOW, WORD_SHADOW) : null}
          {!colorsGone ? CHAIN_LAYERS.map((c, i) => (frame >= start + i * STING_STAGGER ? <React.Fragment key={c}>{t(c, pos(i))}</React.Fragment> : null)) : null}
          {coreIn ? t(INK, core) : null}
        </NealSvg>
      </div>
    </div>
  );
};

// -- the pies ----------------------------------------------------------------
const PIE_R = 292;
const PIE_SCREEN_Y = 456;
const PIE_1X = CAM_END - 586;
const PIE_2X = CAM_END + 264;
/** The numeral hangs below the wedge vertex, so the vertex and the stripe's end stay clear above it. Baseline y 596. */
const NUM_DROP = 82;

const wedgePolygon = (r: number, deg: number) => {
  const pts = [`${r}px ${r}px`];
  const n = Math.max(2, Math.ceil(deg / 3));
  for (let i = 0; i <= n; i++) {
    const a = ((deg * i) / n - 90) * (Math.PI / 180);
    pts.push(`${(r + r * Math.cos(a)).toFixed(2)}px ${(r + r * Math.sin(a)).toFixed(2)}px`);
  }
  return `polygon(${pts.join(",")})`;
};

const Pie: React.FC<{
  frame: number;
  x: number;
  riseAt: number;
  riseEnd: number;
  riseBy: number;
  sweepAt: number;
  sweepEnd: number;
  deg: number;
  photo: string;
  label: string;
  numAt: number;
  crownAt: number;
}> = ({ frame, x, riseAt, riseEnd, riseBy, sweepAt, sweepEnd, deg, photo, label, numAt, crownAt }) => {
  if (frame < riseAt) return null;
  // Held at its screen height while the camera tilts past it, so the bank falls away from under it; world-fixed once the
  // tilt is done.
  const rise = riseBy * (1 - interpolate(frame, [riseAt, riseEnd], [0, 1], { easing: EASE_LAND, ...clamp }));
  const cy = PIE_SCREEN_Y + rise - (540 - CAM_Y(frame));
  const sweep = deg * interpolate(frame, [sweepAt, sweepEnd], [0, 1], { easing: Easing.bezier(0.42, 0, 0.18, 1), ...clamp });
  const r = PIE_R;
  const box: React.CSSProperties = { position: "absolute", left: x - r, top: cy - r, width: 2 * r, height: 2 * r };
  const poly = sweep > 0.05 ? wedgePolygon(r, sweep) : null;
  const a = ((sweep - 90) * Math.PI) / 180;
  const numT = interpolate(frame, [numAt, numAt + 12], [0, 1], { easing: Easing.bezier(0.2, 0.8, 0.3, 1), ...clamp });
  const size = 176;
  return (
    <>
      <NealSvg>
        <circle cx={x + 6} cy={cy + 6} r={r} fill="none" stroke={SHADOW} strokeWidth={8} />
        <circle cx={x} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={8} />
      </NealSvg>
      {poly ? <div style={{ ...box, left: x - r + 8, top: cy - r + 8, background: SHADOW, clipPath: poly }} /> : null}
      {poly
        ? CHAIN_LAYERS.map((c, i) => {
            const p = interpolate(frame, [crownAt + i * 2, crownAt + i * 2 + 16], [0, 1], { easing: EASE_LAND, ...clamp });
            if (p <= 0) return null;
            return <div key={c} style={{ ...box, top: cy - r - (3 - i) * 12 * p, background: c, clipPath: poly }} />;
          })
        : null}
      {poly ? (
        <div style={{ ...box, clipPath: poly, overflow: "hidden" }}>
          <Img src={staticFile(`pushp-trailer/${photo}`)} style={{ position: "absolute", left: 0, top: 0, width: 2 * r, height: 2 * r, maxWidth: "none", filter: NEAL_FILTER }} />
        </div>
      ) : null}
      <NealSvg>
        <circle cx={x} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={8} strokeDasharray={`${(sweep / 360) * 2 * Math.PI * r} ${2 * Math.PI * r}`} transform={`rotate(-90 ${x} ${cy})`} />
        {poly ? <path d={`M${x} ${cy - r} L${x} ${cy} L${x + r * Math.cos(a)} ${cy + r * Math.sin(a)}`} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" /> : null}
        {numT > 0 ? (
          <g opacity={numT} transform={`translate(0 ${(1 - numT) * 24})`}>
            <text x={x + 7} y={cy + size * 0.33 + NUM_DROP + 7} textAnchor="middle" fill={SHADOW} style={typeStyle(size, 900)}>
              {label}
            </text>
            <text x={x} y={cy + size * 0.33 + NUM_DROP} textAnchor="middle" fill={INK} style={typeStyle(size, 900)}>
              {label}
            </text>
          </g>
        ) : null}
      </NealSvg>
    </>
  );
};

// -- the aircraft -------------------------------------------------------------
const AC_SRC = "pushp-trailer/fk_aircraft.png";
const AC_SHADOW = "pushp-trailer/cfv_aircraft_shadow_soft.png";
const AC_FILTER = "grayscale(1) sepia(0.14) contrast(1.12) brightness(1.02)"; // the same as FiveKilosThreeKilo's AIRCRAFT_FILTER
const AC_W = 1884;
const AC_H = 719;
const HULL = { x: 1150, y: 330 };
// One shallow line low across both pies, then the climb; keys run past f217 so the smoothing never eases it to a stop.
const AC_X = track(
  [
    [-40, 40],
    [0, 430],
    [60, 960],
    [110, 1100],
    [150, 1290],
    [178, 1580],
    [195, 1632],
    [217, 1677],
    [240, 1772],
  ],
  10,
);
const AC_Y = track(
  [
    [-40, 724],
    [0, 720],
    [60, 714],
    [110, 708],
    [150, 704],
    [172, 690],
    [195, 545],
    [217, 130],
    [240, -175],
  ],
  10,
);
const AC_WIDE = track(
  [
    [-40, 780],
    [0, 760],
    [60, 690],
    [110, 600],
    [160, 520],
    [217, 410],
    [240, 395],
  ],
  8,
);

const acPose = (frame: number) => {
  const x = AC_X(frame);
  const y = AC_Y(frame);
  const w = AC_WIDE(frame);
  const h = (w * AC_H) / AC_W;
  const dx = AC_X(frame + 2) - AC_X(frame - 2) + 4 * CAM_V(frame);
  const dy = AC_Y(frame + 2) - AC_Y(frame - 2);
  const heading = Math.max(-20, Math.min(4, (Math.atan2(dy, Math.max(20, dx)) * 180) / Math.PI));
  const roll = heading * 0.92 + 2.4 * Math.sin(frame / 16 + 0.6);
  const yaw = -8 + 6 * Math.sin(frame / 26 + 1.3);
  const pitch = -5 * Math.sin(frame / 21) + heading * 0.3;
  return {
    y,
    w,
    h,
    left: x - (HULL.x / AC_W) * w,
    top: y - (HULL.y / AC_H) * h,
    origin: `${(HULL.x / AC_W) * w}px ${(HULL.y / AC_H) * h}px`,
    tf: `perspective(${w * 2.2}px) rotateZ(${roll}deg) rotateY(${yaw}deg) rotateX(${pitch}deg)`,
    img: { position: "absolute", left: 0, top: 0, width: w, height: h, maxWidth: "none" } as React.CSSProperties,
  };
};

/** One soft dark blur on the paper, under the words, pies and bank; further off the higher it flies. Baked, no filter. */
const AircraftShadow: React.FC<{ frame: number }> = ({ frame }) => {
  const { y, w, h, left, top, origin, tf, img } = acPose(frame);
  const lift = 26 + Math.max(0, 760 - y) * 0.15;
  return (
    <div style={{ position: "absolute", left: left + lift * 0.75, top: top + lift, width: w, height: h, transformOrigin: origin, transform: tf, opacity: 0.25 }}>
      <Img src={staticFile(AC_SHADOW)} style={img} />
    </div>
  );
};

const Aircraft: React.FC<{ frame: number }> = ({ frame }) => {
  const { w, h, left, top, origin, tf, img } = acPose(frame);
  const rotors = [
    { px: 640, py: 118, rx: 150, ry: 26, tilt: 18, seed: "a" },
    { px: 1685, py: 372, rx: 96, ry: 18, tilt: 14, seed: "b" },
  ];
  const k = w / AC_W;
  return (
    <>
      <div style={{ position: "absolute", left, top, width: w, height: h, transformOrigin: origin, transform: tf }}>
        <Img src={staticFile(AC_SRC)} style={{ ...img, filter: AC_FILTER }} />
        {rotors.map((r) => {
          const o = 0.1 + 0.08 * random(`cfv-rotor-${r.seed}-${frame}`);
          return (
            <div
              key={r.seed}
              style={{
                position: "absolute",
                left: (r.px - r.rx) * k,
                top: (r.py - r.ry) * k,
                width: 2 * r.rx * k,
                height: 2 * r.ry * k,
                borderRadius: "50%",
                background: `rgba(30,30,30,${o})`,
                transform: `rotate(${r.tilt}deg)`,
                filter: `blur(${Math.max(1, 6 * k)}px)`,
              }}
            />
          );
        })}
      </div>
    </>
  );
};

// -- the cut -----------------------------------------------------------------
export const CheaperFasterVersatile: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <AbsoluteFill>
      <NealFilmLife frame={frame} seed="cfv" vignette={0.24}>
        <PaperGround frame={frame} cx={cam.x} cy={cam.y} cxRest={(camX(0) + CAM_END) / 2} cyRest={420} k={cam.k} />
        <AircraftShadow frame={frame} />
        <Bank d={D_BACK} frame={frame} drift={-0.08} items={BACK_ITEMS} />
        <NealPlane cam={cam} d={1}>
          <Pie frame={frame} x={PIE_1X} riseAt={50} riseEnd={72} riseBy={450} sweepAt={66} sweepEnd={110} deg={288} photo="cfv_pie_freight.jpg" label="80%" numAt={66} crownAt={110} />
          <Pie frame={frame} x={PIE_2X} riseAt={116} riseEnd={148} riseBy={700} sweepAt={144} sweepEnd={186} deg={324} photo="cfv_pie_people.jpg" label="90%" numAt={138} crownAt={186} />
          {/* latest first: the outgoing word stays in front while it sinks, so a rising sting never paints over it */}
          <Word text="VERSATILE" frame={frame} start={35} centreAt={52} size={340} sinkAt={57} sinkEnd={70} />
          <Word text="FASTER" frame={frame} start={18} centreAt={31} size={480} sinkAt={35} sinkEnd={44} />
          <Word text="CHEAPER" frame={frame} start={-6} centreAt={12} size={400} sinkAt={18} sinkEnd={23} />
        </NealPlane>
        <Bank d={D_FRONT} frame={frame} drift={-0.1} items={FRONT_ITEMS} />
        <Aircraft frame={frame} />
        <Bank d={D_NEAR} frame={frame} items={NEAR_ITEMS} soft={2} />
        <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(24,22,20,0) 76%, rgba(24,22,20,0.42) 90%, rgba(24,22,20,0.8) 100%)" }} />
      </NealFilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default CheaperFasterVersatile;
