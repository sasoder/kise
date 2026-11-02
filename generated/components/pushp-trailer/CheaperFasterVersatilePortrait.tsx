// ---------------------------------------------------------------------------
// CheaperFasterVersatilePortrait (pushp-trailer, cut 8, 9:16). The portrait twin of CheaperFasterVersatile. Core Memory
// podcast style, the ARCHIVE COLLAGE at 9:16 (../neal-stephenson-trailer/nealPortraitShared; the paper turned 90 deg).
// Opaque 1080x1920, 23.976 fps, 218 frames; finals --scale 2.
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
// THE MOTION: the squared paper is a tall sky over a deep sea of real-cloud flats, three rows at their own depths. One word
// at a time owns the frame, all at the size VERSATILE sets: each rises at the middle of the frame from behind the bank in
// the chain sting a few frames before its onset, then sinks back as the next rises. From f58 the 16:9's tilt becomes the
// portrait move: the camera tilts up and the bank falls from mid-frame to the bottom third, opening the sky for the pies,
// while the clouds keep sliding by. The pies stand staggered on a far plane, 80% upper left and 90% lower right, equal
// size, rising from behind the bank on their own easing, each wedge a window onto a black-and-white photograph that sweeps
// by itself; the chain crowns each payoff once. The aircraft is the through-line: under way at f0 and big, low over the
// clouds below the caption bands, dipping and rising on its own line, going away as it goes, then a shallow climb along its
// nose out past the right edge under its own speed. It never crosses a pie; its one soft shadow lies on the clouds.
//
// CHAIN MEANING: what Airbound's aircraft outdoes.
//
// SOURCES: these shares are the speaker's stated goal, not data, so no source lines. Clouds: plate_sky_cumulus (the Kelly
// Johnson clip's plate), cut by scripts/clips/pushp-trailer/bake-cfv-clouds.py. Pie photos: the clip's stills
// 11.5a ContainerShipKochiIndia2023 and 16.0a MumbaiLocalHangingOffDoors2006, same script. Aircraft: fk_aircraft.png, the
// same cleaned aircraft and grade as CheaperFasterVersatile (AI-made from Airbound's photos).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBands9x16, H9, NealFilmLife9x16, NealTallPaper, type TallCam, W9 } from "../neal-stephenson-trailer/nealPortraitShared";
import { BLUE, EASE_LAND, INK, NEAL_FILTER, ORANGE, PURPLE, SHADOW, clamp, depthScale, type as typeStyle } from "../neal-stephenson-trailer/nealShared";

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

// -- the camera: the clouds keep sliding by; the tilt carries words to pies --------------------------------------
const CAM_V = track([
  [-40, 6],
  [150, 6],
  [186, 2.5],
  [217, 1.8],
]);
const CAM_K = track(
  [
    [-40, 1],
    [48, 1],
    [92, 1.04],
    [122, 1.03],
    [176, 1],
    [217, 0.992],
  ],
  10,
);
/** The tilt: the bank falls from y ~880 to the bottom third. */
const TILT = 410;
const CAM_Y = track(
  [
    [-40, H9 / 2],
    [58, H9 / 2],
    [106, H9 / 2 - TILT],
    [217, H9 / 2 - TILT - 4],
  ],
  12,
);
const CAM_XS: number[] = [W9 / 2];
for (let f = 1; f <= PRE + DURATION; f++) CAM_XS.push(CAM_XS[f - 1] + CAM_V(f - PRE));
const camX = (f: number) => {
  const c = Math.max(0, Math.min(PRE + DURATION, f + PRE));
  const a = Math.floor(c);
  const b = Math.min(a + 1, CAM_XS.length - 1);
  return CAM_XS[a] + (CAM_XS[b] - CAM_XS[a]) * (c - a);
};
const X_REST = camX(0);
const CAM_END = camX(DURATION - 1);
const camAt = (f: number): TallCam => ({ x: camX(f), y: CAM_Y(f), k: CAM_K(f), x0: X_REST, y0: H9 / 2 });
const tfm = (cam: TallCam, d: number) => {
  const k = depthScale(cam.k, d);
  const xd = d === 1 ? cam.x : cam.x0 + (cam.x - cam.x0) / d;
  const yd = d === 1 ? cam.y : cam.y0 + (cam.y - cam.y0) / d;
  return { k, tx: W9 / 2 - xd * k, ty: H9 / 2 - yd * k };
};
/** The world x on plane d that sits at screen x `sx` at f0. */
const at0 = (d: number, sx: number) => {
  const t = tfm(camAt(0), d);
  return (sx - t.tx) / t.k;
};
const Plane: React.FC<{ cam: TallCam; d: number; children: React.ReactNode }> = ({ cam, d, children }) => {
  const t = tfm(cam, d);
  return <div style={{ position: "absolute", left: 0, top: 0, width: W9, height: H9, transformOrigin: "0 0", transform: `translate(${t.tx}px, ${t.ty}px) scale(${t.k})` }}>{children}</div>;
};
/** The far plane of the words and pies: about a seventh of the clouds' slide, plus the tilt. */
const FAR_SLIDE = 0.15;
const farX = (frame: number) => (CAM_END - camX(frame)) * FAR_SLIDE;

// -- the set: real-cloud flats, natural contour, base and sides dissolving, one soft shadow ------------------------
const FLATS = {
  shelfb: { w: 880, h: 810 },
  crest: { w: 1360, h: 810 },
} as const;
type FlatName = keyof typeof FLATS;

const Flat: React.FC<{ name: FlatName; x: number; y: number; s: number; flip?: boolean; air?: number; cast?: number }> = ({ name, x, y, s, flip, air = 0, cast = 20 }) => {
  const { w, h } = FLATS[name];
  const box: React.CSSProperties = { position: "absolute", left: x, top: y, width: w * s, height: h * s, maxWidth: "none", transform: flip ? "scaleX(-1)" : undefined };
  return (
    <>
      <Img src={staticFile(`pushp-trailer/cfv_${name}_natsoft.png`)} style={{ ...box, left: x + cast, top: y + cast * 1.25, opacity: air > 0 ? 0.65 : 1 }} />
      <Img src={staticFile(`pushp-trailer/cfv_${name}_nat.png`)} style={{ ...box, filter: air > 0 ? `contrast(${1 - 0.34 * air}) brightness(${1 + 0.1 * air})` : undefined }} />
    </>
  );
};

type Placed = { name: FlatName; sx: number; y: number; s: number; flip?: boolean; air?: number };
const Bank: React.FC<{ d: number; frame: number; items: Placed[] }> = ({ d, frame, items }) => (
  <Plane cam={camAt(frame)} d={d}>
    {items.map((p, i) => (
      <Flat key={`${p.name}${i}`} name={p.name} x={at0(d, p.sx)} y={p.y} s={p.s} flip={p.flip} air={p.air} />
    ))}
  </Plane>
);

const BACK_ITEMS: Placed[] = [
  { name: "crest", sx: -300, y: 770, s: 0.8, air: 0.35, flip: true },
  { name: "shelfb", sx: 480, y: 720, s: 1.1, air: 0.35 },
  { name: "crest", sx: 1320, y: 776, s: 0.84, air: 0.35 },
  { name: "shelfb", sx: 2260, y: 716, s: 1.14, air: 0.35, flip: true },
];
const ROW_A: Placed[] = [
  { name: "shelfb", sx: -420, y: 696, s: 1.34, flip: true },
  { name: "crest", sx: 240, y: 806, s: 0.94 },
  { name: "shelfb", sx: 1060, y: 716, s: 1.24 },
  { name: "shelfb", sx: 1560, y: 676, s: 1.46, flip: true },
  { name: "crest", sx: 2360, y: 816, s: 0.9, flip: true },
];
const ROW_B: Placed[] = [
  { name: "crest", sx: -360, y: 1110, s: 1.02, flip: true },
  { name: "shelfb", sx: 660, y: 1030, s: 1.4 },
  { name: "crest", sx: 1520, y: 1124, s: 0.98 },
  { name: "shelfb", sx: 2520, y: 1040, s: 1.34, flip: true },
];
const ROW_C: Placed[] = [
  { name: "shelfb", sx: -520, y: 1390, s: 1.6 },
  { name: "crest", sx: 700, y: 1500, s: 1.1, flip: true },
  { name: "shelfb", sx: 2000, y: 1400, s: 1.56, flip: true },
  { name: "crest", sx: 3000, y: 1490, s: 1.14 },
];
const D_BACK = 1.3;
const D_A = 0.92;
const D_B = 0.8;
const D_C = 0.68;

// -- the words: one size, set by VERSATILE ------------------------------------------------------------------------
const CHAIN_LAYERS = [ORANGE, PURPLE, BLUE];
const STING_TRAVEL = 16;
const STING_STAGGER = 2;
const WORD_SIZE = 192;
const WORD_DROP = 470;
const WORD_SHADOW = 7;
const WORD_BASE = 880;
const WORD_CLIP = 1180;

const Word: React.FC<{ text: string; frame: number; start: number; sinkAt: number; sinkEnd: number }> = ({ text, frame, start, sinkAt, sinkEnd }) => {
  if (frame < start || frame > sinkEnd) return null;
  const tilt = H9 / 2 - CAM_Y(frame);
  const x = W9 / 2 + farX(frame) - farX(40);
  const sink = interpolate(frame, [sinkAt, sinkEnd], [0, WORD_DROP], { easing: Easing.bezier(0.55, 0, 0.8, 0.5), ...clamp });
  const pos = (i: number) =>
    WORD_BASE + tilt + sink + WORD_DROP * (1 - interpolate(frame, [start + i * STING_STAGGER, start + i * STING_STAGGER + STING_TRAVEL], [0, 1], { easing: EASE_LAND, ...clamp }));
  const core = pos(3);
  const coreIn = frame >= start + 3 * STING_STAGGER;
  const colorsGone = frame > start + 3 * STING_STAGGER + 9;
  const t = (fill: string, y: number, dx = 0) => (
    <text x={x + dx} y={y} textAnchor="middle" fill={fill} style={typeStyle(WORD_SIZE, 900)}>
      {text}
    </text>
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W9, height: WORD_CLIP + tilt, overflow: "hidden" }}>
      <svg width={W9} height={H9} viewBox={`0 0 ${W9} ${H9}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {coreIn ? t(SHADOW, core + WORD_SHADOW, WORD_SHADOW) : null}
        {!colorsGone ? CHAIN_LAYERS.map((c, i) => (frame >= start + i * STING_STAGGER ? <React.Fragment key={c}>{t(c, pos(i))}</React.Fragment> : null)) : null}
        {coreIn ? t(INK, core) : null}
      </svg>
    </div>
  );
};

// -- the pies: staggered, 80% upper left and 90% lower right; numerals above the first caption band --------------
const PIE_R = 300;
const NUM_SIZE = 180;
/** The numeral hangs below the wedge vertex, so the vertex and the stripe's end stay clear above it. */
const NUM_DROP = 84;

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
  x0: number;
  y0: number;
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
}> = ({ frame, x0, y0, riseAt, riseEnd, riseBy, sweepAt, sweepEnd, deg, photo, label, numAt, crownAt }) => {
  if (frame < riseAt) return null;
  const x = x0 + farX(frame);
  const cy = y0 + riseBy * (1 - interpolate(frame, [riseAt, riseEnd], [0, 1], { easing: EASE_LAND, ...clamp }));
  const sweep = deg * interpolate(frame, [sweepAt, sweepEnd], [0, 1], { easing: Easing.bezier(0.42, 0, 0.18, 1), ...clamp });
  const r = PIE_R;
  const box: React.CSSProperties = { position: "absolute", left: x - r, top: cy - r, width: 2 * r, height: 2 * r };
  const poly = sweep > 0.05 ? wedgePolygon(r, sweep) : null;
  const a = ((sweep - 90) * Math.PI) / 180;
  const numT = interpolate(frame, [numAt, numAt + 12], [0, 1], { easing: Easing.bezier(0.2, 0.8, 0.3, 1), ...clamp });
  const svg = { position: "absolute", left: 0, top: 0, overflow: "visible" } as React.CSSProperties;
  return (
    <>
      <svg width={W9} height={H9} viewBox={`0 0 ${W9} ${H9}`} style={svg}>
        <circle cx={x + 6} cy={cy + 6} r={r} fill="none" stroke={SHADOW} strokeWidth={8} />
        <circle cx={x} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={8} />
      </svg>
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
      <svg width={W9} height={H9} viewBox={`0 0 ${W9} ${H9}`} style={svg}>
        <circle cx={x} cy={cy} r={r} fill="none" stroke={INK} strokeWidth={8} strokeDasharray={`${(sweep / 360) * 2 * Math.PI * r} ${2 * Math.PI * r}`} transform={`rotate(-90 ${x} ${cy})`} />
        {poly ? <path d={`M${x} ${cy - r} L${x} ${cy} L${x + r * Math.cos(a)} ${cy + r * Math.sin(a)}`} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" /> : null}
        {numT > 0 ? (
          <g opacity={numT} transform={`translate(0 ${(1 - numT) * 24})`}>
            <text x={x + 7} y={cy + NUM_SIZE * 0.33 + NUM_DROP + 7} textAnchor="middle" fill={SHADOW} style={typeStyle(NUM_SIZE, 900)}>
              {label}
            </text>
            <text x={x} y={cy + NUM_SIZE * 0.33 + NUM_DROP} textAnchor="middle" fill={INK} style={typeStyle(NUM_SIZE, 900)}>
              {label}
            </text>
          </g>
        ) : null}
      </svg>
    </>
  );
};

// -- the aircraft -------------------------------------------------------------
const AC_SRC = "pushp-trailer/fk_aircraft.png";
const AC_SHADOW = "pushp-trailer/cfv_aircraft_shadow_soft.png";
const AC_FILTER = "grayscale(1) sepia(0.14) contrast(1.12) brightness(1.02)"; // the same as CheaperFasterVersatile's
const AC_W = 1884;
const AC_H = 719;
const HULL = { x: 1150, y: 330 };
// Low over the clouds, under the caption bands, on a line of its own; then a shallow climb out past the right edge. Keys
// run past f217 so the smoothing never eases it to a stop. Nothing here is keyed to a pie.
const AC_X = track(
  [
    [-40, 360],
    [0, 530],
    [60, 640],
    [110, 780],
    [160, 850],
    [185, 1040],
    [200, 1290],
    [217, 1570],
    [240, 1960],
  ],
  10,
);
const AC_Y = track(
  [
    [-40, 1570],
    [0, 1610],
    [28, 1660],
    [60, 1600],
    [100, 1650],
    [140, 1600],
    [160, 1570],
    [185, 1480],
    [200, 1405],
    [217, 1310],
    [240, 1180],
  ],
  10,
);
const AC_WIDE = track(
  [
    [-40, 940],
    [0, 920],
    [60, 800],
    [110, 660],
    [160, 580],
    [195, 520],
    [217, 480],
    [240, 460],
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
  const heading = Math.max(-17, Math.min(10, (Math.atan2(dy, Math.max(20, dx)) * 180) / Math.PI));
  // The swings calm on the climb, so the on-screen rotation stays under about 20 degrees and the pose stays readable.
  const calm = interpolate(frame, [130, 160], [1, 0.4], clamp);
  const roll = heading * 0.95 + 6 * calm * Math.sin(frame / 14 + 0.6);
  const yaw = -8 + 12 * calm * Math.sin(frame / 19 + 1.3);
  const pitch = -10 * calm * Math.sin(frame / 17) + heading * 0.3;
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

/** One soft dark blur on the clouds it skims, softening away as it climbs. Baked, no filter. */
const AircraftShadow: React.FC<{ frame: number }> = ({ frame }) => {
  const { y, w, h, left, top, origin, tf, img } = acPose(frame);
  const lift = 34 + Math.max(0, 1700 - y) * 0.12;
  return (
    <div style={{ position: "absolute", left: left + lift * 0.75, top: top + lift, width: w, height: h, transformOrigin: origin, transform: tf, opacity: 0.25 * interpolate(y, [1420, 1560], [0, 1], clamp) }}>
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
    <div style={{ position: "absolute", left, top, width: w, height: h, transformOrigin: origin, transform: tf }}>
      <Img src={staticFile(AC_SRC)} style={{ ...img, filter: AC_FILTER }} />
      {rotors.map((r) => {
        const o = 0.1 + 0.08 * random(`cfvp-rotor-${r.seed}-${frame}`);
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
  );
};

// -- the cut -----------------------------------------------------------------
export const CheaperFasterVersatilePortrait: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <NealFilmLife9x16 frame={frame}>
        <NealTallPaper frame={frame} cam={camAt(frame)} />
        <Bank d={D_BACK} frame={frame} items={BACK_ITEMS} />
        <Pie frame={frame} x0={340} y0={372} riseAt={65} riseEnd={76} riseBy={830} sweepAt={66} sweepEnd={110} deg={288} photo="cfv_pie_freight.jpg" label="80%" numAt={66} crownAt={110} />
        <Pie frame={frame} x0={740} y0={920} riseAt={132} riseEnd={146} riseBy={720} sweepAt={144} sweepEnd={186} deg={324} photo="cfv_pie_people.jpg" label="90%" numAt={140} crownAt={186} />
        {/* latest first: the outgoing word stays in front while it sinks, so a rising sting never paints over it */}
        <Word text="VERSATILE" frame={frame} start={35} sinkAt={57} sinkEnd={70} />
        <Word text="FASTER" frame={frame} start={18} sinkAt={35} sinkEnd={44} />
        <Word text="CHEAPER" frame={frame} start={-6} sinkAt={18} sinkEnd={23} />
        <Bank d={D_A} frame={frame} items={ROW_A} />
        <Bank d={D_B} frame={frame} items={ROW_B} />
        <Bank d={D_C} frame={frame} items={ROW_C} />
        <AircraftShadow frame={frame} />
        <Aircraft frame={frame} />
        <AbsoluteFill style={{ background: "linear-gradient(to bottom, rgba(24,22,20,0) 84%, rgba(24,22,20,0.35) 94%, rgba(24,22,20,0.7) 100%)" }} />
      </NealFilmLife9x16>
      <CaptionBands9x16 on={bands} />
    </AbsoluteFill>
  );
};

export default CheaperFasterVersatilePortrait;
