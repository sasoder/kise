// ---------------------------------------------------------------------------
// DefensePaysFirst (zach-kelly-johnson, cut 43). Core memory podcast, ARCHIVE COLLAGE (footage-matched variant,
// archiveShared.tsx). Opaque 1080x1920, 23.976 fps, 130 frames.
//
// CHECK LINE: "A steady line of military planes rolls out first, and the money from each one is what builds the
// airliner waiting above."
//
// THE LINE: "the economic hurdles you have ahead of you mean you need to create a stable, cash-flowing defense
// business first, period."
// WORD -> FRAME: the -2 · economic 0 · hurdles 10 · you 25 · have 31 · ahead 34 · of 39 · you 43 · mean 46 · you 52 ·
// need 56 · to 59 · create 63 · a 71 · stable 77 · cash 86 · flowing 92 · defense 97 · business 105 · first 114 ·
// period 125 · cut at f130.
// DURATION: the slot 43.001 -> 48.423 s = 5.422 s x 23.976 = 130 frames (f0..f129).
//
// THE MOTION: open high in the clouds on a pale GHOST of a Constellation (washed out, see-through: not built yet),
// already tilting down; one eased tilt (damped follow of keys f0 -> f40) runs down through the sky to a hangar's open
// mouth, landing (k 1.5) as the first C-130's nose comes out from behind the right door jamb (f41). The transports
// (the same cut-out, same scale, same plane, 450 px) roll left at a constant 27.5 px/f, one every 20 frames (pitch
// 550 = 1.22 x the length: always a clear gap), lit by a soft daylight rim in the dark mouth, into daylight past the
// left jamb, and leave frame left. The first three cross the painted stripe at f60, 80, 100 (CONTACT); on that frame
// a white "$" coin rises out from behind its fuselage (FIRST REACTION, same frame), the first one drawing
// the white flow line up into the airliner's nose; the camera pulls back f56 -> f84 to show both ends while the
// airliner comes down out of reach into the top of the frame. Each arrival (f72, 92, 112) prints one third of the
// airliner, nose -> tail, from ghost to the full print (8-frame soft wipe from the coin's touch, 3 frames before);
// fully opaque, fins included, at f117.
// Each coin (72 px, a short white taper under it pointing back down the line) carries the line's tip upward and goes
// INTO the nose, behind it. "first ... period": from f118 it FLIES off the way its nose points (left, a little down),
// easing up to a 27 px/f cruise by f125, prop discs hinting; at f120 the line lets go of the nose and runs back down
// into the apron by f128. f120 -> f129: no coin travelling; the row keeps rolling (the living part), a slow camera
// creep, film life. No text, no numbers, no chain.
//
// SOURCES (public/zach-kelly-johnson/C, details in refs/C/ASSETS_C_READY.md):
//   C-130B 58-0746, USAF photo c. 1972, public domain (Commons File:Lockheed_C-130B-LM_Hercules_58-0746.jpg).
//   Air France L-049 Constellation F-BAZB in flight, 1946, NARA RG 286 (286-MP-fra-04536), public domain.
//   Selfridge Field Building 3566 hangar, doors open, HAER MI (LoC mi0574), Robert Benton 1996, public domain.
//   Cumulus congestus over Gåseberg (b&w), W.carter, Commons, CC0.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ArchiveCamera, type ArchiveCam, CaptionBands, CutOut, FilmLife, archiveFilter, depthTransform, fontFamily } from "./archiveShared";

export const FPS = 24000 / 1001;
export const DURATION = 130;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const W = 1080;
const H = 1920;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (6 * t - 15) + 10);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---- assets (public/zach-kelly-johnson/C, see ASSETS_C_READY.md) ----
const SRC_HANGAR = "zach-kelly-johnson/C/plate_hangar_mouth_selfridge.jpg"; // 2600 x 2136, dead-on, doors open
const SRC_SKY = "zach-kelly-johnson/C/plate_sky_cumulus.jpg"; // 2600 x 1788
const SRC_C130 = "zach-kelly-johnson/C/cutout_c130b_side_facing-left.png"; // 1607 x 623, nose left
const SRC_AIR = "zach-kelly-johnson/C/cutout_constellation_l049_airfrance_inflight_3q_facing-left_alt.png"; // 1800 x 691

// ---- planes (archiveShared depth: 1 = the apron, the hangar and the transports) ----
const D_SKY = 4;
const D_AIR = 1.8; // the airliner: far off, high up

// ---- the ground plane (at the rest camera, world px = screen px) ----
const GROUND_Y = 1035; // where the transports' wheels meet the apron (the hangar's floor line)
// the hangar plate, in its own px: floor line y 1500, apex (1248, 272), mouth jambs x 240 / 2248
const HG_S = 0.44;
const HG_W = 2600 * HG_S;
const HG_H = 2136 * HG_S;
const HG_X = 540 - 1252 * HG_S; // the apex on the frame's middle
const HG_Y = GROUND_Y - 1500 * HG_S;
const hx = (px: number) => HG_X + px * HG_S;
const JAMB_L = hx(240);
const JAMB_R = hx(2248);
// the hangar's outline (plate px): the sky and the wires above it go, the neighbours stay
const HG_OUTLINE = [
  [0, 2112],
  [0, 815],
  [100, 885],
  [120, 890],
  [540, 660],
  [525, 500],
  [1248, 270],
  [1975, 512],
  [1962, 670],
  [2405, 910],
  [2420, 990],
  [2600, 965],
  [2600, 2112],
];
const HG_CLIP = `polygon(${HG_OUTLINE.map(([x, y]) => `${x * HG_S}px ${y * HG_S}px`).join(", ")})`;
// the hangar's right door jamb and wall, in front of the transports still inside
const HG_JAMB_CLIP = `polygon(${[
  [2248, 1000],
  [2600, 1000],
  [2600, 1508],
  [2248, 1508],
]
  .map(([x, y]) => `${x * HG_S}px ${y * HG_S}px`)
  .join(", ")})`;

const X_LINE = 680; // the painted line on the apron, in front of the mouth
const C130_LEN = 450;
const C130_ASPECT = 1607 / 623;
const C130_H = C130_LEN / C130_ASPECT;
const SPEED = 27.5; // world px per frame, constant: the line marches (to the left, the way they point)
const CADENCE = 20; // pitch = 550 px = 1.22 x the length: a clear gap between a tail and the next nose
const CROSS = [0, 1, 2, 3, 4].map((i) => 60 + CADENCE * i); // f60, 80, 100, 120, 140: each middle crosses the line, a coin leaves it
const COIN_T = 12; // frames a coin rides the flow line
const FILL_T = 8; // frames a segment takes to print
const SEGMENTS = 3;
const transportX = (f: number, i: number) => X_LINE - SPEED * (f - CROSS[i]);

// ---- the airliner plane ----
const AIR_LEN = 810;
const AIR_ASPECT = 1800 / 691;
const AIR_H = AIR_LEN / AIR_ASPECT;
const AIR_X = 540;
const AIR_Y = 300;
const AIR_DRIFT = 0.7; // world px per frame, the way it points (left)
const AIR_LIFT0 = -300; // it starts this much higher (out of reach) and comes down on the pull-back
const ENTRY = { u: 0.08, v: 0.7 }; // inside its nose (the coin goes in behind it), as fractions of the cut-out's box

// ---- camera: target keys, followed by a damped tracker ----
type Cam = { x: number; y: number; k: number };
const REST = { x0: W / 2, y0: H / 2 };
const KEYS: [number, Cam][] = [
  [0, { x: 540, y: -392, k: 1.1 }],
  [40, { x: 760, y: 972, k: 1.5 }],
  [56, { x: 752, y: 972, k: 1.47 }],
  [84, { x: 540, y: 960, k: 1.0 }],
  [130, { x: 540, y: 950, k: 1.035 }],
];
const camTarget = (f: number): Cam => {
  if (f <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [f0, a] = KEYS[i];
    const [f1, b] = KEYS[i + 1];
    if (f <= f1) {
      const t = smooth((f - f0) / (f1 - f0));
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), k: lerp(a.k, b.k, t) };
    }
  }
  return KEYS[KEYS.length - 1][1];
};
const STIFF = 0.16;
const DAMP = 0.55;
const CAM_TRACK: Cam[] = (() => {
  const out: Cam[] = [];
  let c = { ...KEYS[0][1] };
  let v = { x: 0, y: 5, k: 0 }; // already tilting down at f0
  out.push({ ...c });
  for (let f = 1; f <= DURATION + 2; f++) {
    const t = camTarget(f);
    v = {
      x: v.x + (t.x - c.x) * STIFF - v.x * DAMP,
      y: v.y + (t.y - c.y) * STIFF - v.y * DAMP,
      k: v.k + (t.k - c.k) * STIFF - v.k * DAMP,
    };
    c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    out.push({ ...c });
  }
  return out;
})();
export const camAt = (frame: number): ArchiveCam => {
  const fi = Math.max(0, Math.floor(frame));
  const a = CAM_TRACK[Math.min(fi, CAM_TRACK.length - 1)];
  const b = CAM_TRACK[Math.min(fi + 1, CAM_TRACK.length - 1)];
  const t = frame - fi;
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), k: lerp(a.k, b.k, t), ...REST };
};

// ---- the airliner: lift, drift, print ----
const airLift = (f: number) => AIR_LIFT0 * (1 - smooth((f - 50) / 42));
// once whole it FLIES: it moves off the way its nose points (the fuselage axis of the 3/4 cut-out, left and a little
// down), its speed easing from 0 at FLY_F0 to a cruise of FLY_V by FLY_F1
const FLY_F0 = 118;
const FLY_F1 = 125;
const FLY_V = 27; // world px per frame
const FLY_DIR = (() => {
  const dx = 30 - 1450; // tail cone (1450, 250) -> nose (30, 560), cut-out px
  const dy = 560 - 250;
  const n = Math.hypot(dx, dy);
  return { x: dx / n, y: dy / n };
})();
const FLY_D: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION + 2; f++) out.push(out[f - 1] + FLY_V * smooth((f - 0.5 - FLY_F0) / (FLY_F1 - FLY_F0)));
  return out;
})();
const flown = (f: number) => {
  const fi = Math.max(0, Math.min(FLY_D.length - 2, Math.floor(f)));
  return lerp(FLY_D[fi], FLY_D[fi + 1], f - fi);
};
const airPos = (f: number) => {
  const d = flown(f);
  return { x: AIR_X - AIR_DRIFT * (f - 100) + FLY_DIR.x * d, y: AIR_Y + airLift(f) + FLY_DIR.y * d };
};
// the prop discs (cut-out px: spinner centre, disc radii), a hint once the engines run up for the flight
const PROPS = [
  { x: 140, y: 366, rx: 34, ry: 104, rot: 8 },
  { x: 585, y: 594, rx: 40, ry: 118, rot: 8 },
  { x: 815, y: 619, rx: 40, ry: 118, rot: 8 },
];
const entryWorld = (f: number) => {
  const a = airPos(f);
  return { x: a.x - AIR_LEN / 2 + ENTRY.u * AIR_LEN, y: a.y - AIR_H / 2 + ENTRY.v * AIR_H };
};
const arrival = (i: number) => CROSS[i] + COIN_T;
// the coin's edge touches the nose this many frames before its centre is home: the print starts on the touch, and the
// coin stays (hidden in the nose) until the print has gone opaque over it
const PRINT_LEAD = 3;
const COIN_HOLD = 5;
/** the printed fraction of the airliner, nose -> tail: each coin's arrival prints one segment */
const printed = (f: number) => {
  let u = 0;
  for (let j = 0; j < SEGMENTS; j++) u += smooth((f - arrival(j) + PRINT_LEAD) / FILL_T) / SEGMENTS;
  return u;
};
export const WHOLE = arrival(SEGMENTS - 1) + FILL_T; // f120: the airliner is whole

// ---- the flow line: a cubic from the painted line up into the airliner (screen space, between two planes) ----
const LINE_FOOT_Y = GROUND_Y - 16; // the painted line's far end, where the flow line rises
// the stripe on the ground runs toward the vanishing point (the plate's eye level, plate y 1300, frame x 540)
const VP = { x: 540, y: HG_Y + 1300 * HG_S };
const PAINT = (() => {
  const near = GROUND_Y + 64;
  const at = (y: number) => X_LINE + ((X_LINE - VP.x) * (y - LINE_FOOT_Y)) / (LINE_FOOT_Y - VP.y);
  const hw = (y: number) => 3 + (5 * (y - LINE_FOOT_Y)) / (near - LINE_FOOT_Y);
  return `${at(LINE_FOOT_Y) - hw(LINE_FOOT_Y)},${LINE_FOOT_Y} ${at(LINE_FOOT_Y) + hw(LINE_FOOT_Y)},${LINE_FOOT_Y} ${at(near) + hw(near)},${near} ${at(near) - hw(near)},${near}`;
})();
const COIN_START_Y = GROUND_Y - 0.3 * C130_H; // the coin starts behind the fuselage's middle
const COIN_R = 36; // 72 px across at rest
const LINE_W = 9; // world px: 1.5 x the house STROKE
const N_COINS = 3; // one per transport that pays for a third of the airliner; none travelling at the end
// "period": the line lets go of the nose as it flies off and runs back down into the apron
const RELEASE_F = 120;
const RETRACT_F1 = 128;
const bez = (p0: number, p1: number, p2: number, p3: number, t: number) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
};
type Pt = { x: number; y: number; k: number };
const N_FLOW = 96;
const flowPath = (cam: ArchiveCam, f: number) => {
  // after the release the line keeps the shape it had, where it was, and no longer follows the nose
  const g = depthTransform(cam, 1);
  const ga = depthTransform(cam, D_AIR);
  const at = (t: ReturnType<typeof depthTransform>, x: number, y: number): Pt => ({ ...t.toScreen(x, y), k: t.k });
  const a = at(g, X_LINE, LINE_FOOT_Y);
  const a1 = at(g, X_LINE, GROUND_Y - 420);
  const e = entryWorld(Math.min(f, RELEASE_F));
  const b = at(ga, e.x, e.y);
  const b1 = at(ga, e.x + 40, e.y + 200);
  const pts: Pt[] = Array.from({ length: N_FLOW + 1 }, (_, i) => {
    const t = i / N_FLOW;
    return { x: bez(a.x, a1.x, b1.x, b.x, t), y: bez(a.y, a1.y, b1.y, b.y, t), k: lerp(a.k, b.k, t) };
  });
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return { pts, s, start: at(g, X_LINE, COIN_START_Y) };
};
const atLength = (path: ReturnType<typeof flowPath>, d: number): Pt => {
  const { pts, s } = path;
  const dd = Math.min(s[s.length - 1], Math.max(0, d));
  let i = 1;
  while (i < s.length - 1 && s[i] < dd) i++;
  const t = (dd - s[i - 1]) / Math.max(1e-6, s[i] - s[i - 1]);
  return { x: lerp(pts[i - 1].x, pts[i].x, t), y: lerp(pts[i - 1].y, pts[i].y, t), k: lerp(pts[i - 1].k, pts[i].k, t) };
};
const COIN_EASE = Easing.bezier(0.45, 0, 0.75, 1);

// ---- pieces ----
// Grain on the airliner: the cut-out is a clean scan, so it gets its own fine noise (new every frame), overlaid
// through its own alpha, to sit in the plate's grain.
const AirGrain: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <filter id="dpf-air-grain" colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={(Math.floor(frame) * 37) % 997} result="n" />
        <feColorMatrix in="n" type="saturate" values="0" result="g" />
        <feComponentTransfer in="g" result="gs">
          <feFuncR type="linear" slope={0.5} intercept={0.25} />
          <feFuncG type="linear" slope={0.5} intercept={0.25} />
          <feFuncB type="linear" slope={0.5} intercept={0.25} />
        </feComponentTransfer>
        <feBlend in="SourceGraphic" in2="gs" mode="overlay" result="b" />
        <feComposite in="b" in2="SourceAlpha" operator="in" />
      </filter>
    </defs>
  </svg>
);
// the airliner graded into the sky: flatter, a little air and softness, then the grain
const AIR_FILTER = `${archiveFilter({ air: 0.4, blur: 0.12 })} contrast(0.88) url(#dpf-air-grain)`;
const GHOST_FILTER = `${archiveFilter({ air: 0.4 })} contrast(0.4) brightness(1.4) url(#dpf-air-grain)`;

/** the hangar plate, cut to its outline; the floor of the mouth sits in deep shade (its parked vehicles go dark) */
const HangarPlate: React.FC<{ clip: string }> = ({ clip }) => (
  <div style={{ position: "absolute", left: HG_X, top: HG_Y, width: HG_W, height: HG_H, clipPath: clip, WebkitClipPath: clip }}>
    <Img src={staticFile(SRC_HANGAR)} style={{ position: "absolute", left: 0, top: 0, width: HG_W, height: HG_H, maxWidth: "none", filter: archiveFilter() }} />
    {/* the back of the mouth, under the door: dark, so what is parked in there does not read */}
    <div
      style={{
        position: "absolute",
        left: 250 * HG_S,
        top: 1140 * HG_S,
        width: (2240 - 250) * HG_S,
        height: (1498 - 1140) * HG_S,
        background: "linear-gradient(to bottom, rgba(14,12,10,0) 0%, rgba(14,12,10,0.86) 28%, rgba(14,12,10,0.9) 88%, rgba(14,12,10,0.6) 100%)",
      }}
    />
  </div>
);

/** the apron below the plate: its own clean concrete, one strip flipped (seamless at the plate's edge) and stretched
 *  as the near floor, going soft toward the bottom; then (ApronShade) the whole near apron sinks into deep grey-brown */
const STRIP_TOP = 1770; // plate px: clean concrete below the wet stains
const STRIP_BOT = 2110; // plate px: above the scan's last rows
const EXT_Y = HG_Y + STRIP_BOT * HG_S;
const EXT_H = 960;
const ApronExtension: React.FC = () => {
  const stripH = (STRIP_BOT - STRIP_TOP) * HG_S;
  const sy = EXT_H / stripH;
  const img = (blur: number, mask?: string) => (
    <div style={{ position: "absolute", inset: 0, transform: "scaleY(-1)", ...(mask ? { WebkitMaskImage: mask, maskImage: mask } : {}) }}>
      <Img
        src={staticFile(SRC_HANGAR)}
        style={{
          position: "absolute",
          left: -0.15 * HG_W,
          top: EXT_H - STRIP_BOT * HG_S * sy,
          width: 1.3 * HG_W,
          height: HG_H * sy,
          maxWidth: "none",
          filter: archiveFilter({ blur }),
        }}
      />
    </div>
  );
  return (
    <div style={{ position: "absolute", left: HG_X, top: EXT_Y - 0.5, width: HG_W, height: EXT_H, overflow: "hidden" }}>
      {img(6)}
      {/* sharp only where it meets the plate (the mask is in the flipped box: its bottom is the top on screen) */}
      {img(0, "linear-gradient(to top, black 0px, transparent 130px)")}
    </div>
  );
};
const SHADE_Y = GROUND_Y + 62;
const ApronShade: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: HG_X,
      top: SHADE_Y,
      width: HG_W,
      height: EXT_Y + EXT_H - SHADE_Y,
      background:
        "linear-gradient(to bottom, rgba(44,38,32,0) 0%, rgba(44,38,32,0.26) 18%, rgba(42,36,30,0.58) 42%, rgba(40,34,28,0.78) 66%, rgba(38,32,27,0.86) 100%)",
    }}
  />
);

// a touch more exposure, and a soft rim of daylight along its upper edges so the silhouette reads in the dark mouth
const C130_FILTER = `${archiveFilter()} brightness(1.12) drop-shadow(-1px -2px 1.4px rgba(238,232,220,0.62))`;
const C130: React.FC<{ x: number }> = ({ x }) => {
  const left = x - C130_LEN / 2;
  // inside the mouth, under the door, it is in shade; it comes out into the daylight past the left jamb
  const a = JAMB_L + 10 - left;
  const b = JAMB_L + 120 - left;
  const shade = `linear-gradient(to right, rgba(12,10,8,0) ${a}px, rgba(12,10,8,0.14) ${b}px)`;
  return (
    <CutOut
      src={SRC_C130}
      x={x}
      y={GROUND_Y}
      w={C130_LEN}
      aspect={C130_ASPECT}
      shade={shade}
      filter={C130_FILTER}
      shadow={[
        { x: -0.02 * C130_LEN, dy: -1, w: 0.87 * C130_LEN, h: 24, opacity: 0.5 },
        { x: -0.037 * C130_LEN, dy: -2, w: 0.2 * C130_LEN, h: 11, opacity: 0.8 },
        { x: -0.37 * C130_LEN, dy: -6, w: 0.08 * C130_LEN, h: 8, opacity: 0.7 },
      ]}
    />
  );
};

const DefensePaysFirst: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);

  // the airliner
  const air = airPos(frame);
  const u = printed(frame);
  const feather = 90;
  const front = u * (AIR_LEN + feather) - feather / 2; // px from the nose (left)
  const printMask = `linear-gradient(to right, black ${front - feather / 2}px, transparent ${front + feather / 2}px)`;
  const props = 0.17 * smooth((frame - (FLY_F0 - 4)) / 8); // the prop discs as the engines run up
  const PS = AIR_LEN / 1800;

  // the transports: one production row, the same cut-out, constant speed, leaving frame left
  const transports = CROSS.map((_, i) => ({ i, x: transportX(frame, i) })).filter(({ x }) => x - C130_LEN / 2 < JAMB_R + 4 && x + C130_LEN / 2 > -700);

  // the flow line and the coins
  const path = flowPath(cam, frame);
  const total = path.s[path.s.length - 1];
  let startD = 0;
  {
    let bd = 1e9;
    path.pts.forEach((p, i) => {
      const d = Math.abs(p.y - path.start.y);
      if (d < bd) {
        bd = d;
        startD = path.s[i];
      }
    });
  }
  const coinD = (i: number) => startD + (total - startD) * COIN_EASE(clamp01((frame - CROSS[i]) / COIN_T));
  // the first coin draws the line upward (its tip is the coin); after the release it runs back down into the apron
  const retract = smooth((frame - RELEASE_F) / (RETRACT_F1 - RELEASE_F));
  const drawn = frame >= CROSS[0] ? coinD(0) * (1 - retract) : 0;
  const linePts: Pt[] = path.pts.filter((_, i) => path.s[i] <= drawn);
  if (drawn > 0.5 && drawn < total) linePts.push(atLength(path, drawn));
  const polyline = linePts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const lineW = LINE_W * cam.k;
  const coins = CROSS.slice(0, N_COINS)
    .map((c, i) => ({ i, live: frame >= c && frame <= c + COIN_T + COIN_HOLD }))
    .filter((c) => c.live)
    .map((c) => {
      const d = coinD(c.i);
      const at = atLength(path, d);
      // a short white taper under the rising coin, pointing back down the line: the travel reads in a still
      const len = Math.min(2.4 * COIN_R * at.k, Math.max(0, d - startD));
      const n = 10;
      const left: string[] = [];
      const right: string[] = [];
      for (let j = 0; j <= n; j++) {
        const t = j / n; // 0 at the coin, 1 at the trail's end
        const q = atLength(path, d - t * len);
        const q2 = atLength(path, d - t * len - 2);
        const tx = q.x - q2.x;
        const ty = q.y - q2.y;
        const tn = Math.hypot(tx, ty) || 1;
        const hw = 0.62 * COIN_R * at.k * (1 - t);
        left.push(`${(q.x - (ty / tn) * hw).toFixed(2)},${(q.y + (tx / tn) * hw).toFixed(2)}`);
        right.push(`${(q.x + (ty / tn) * hw).toFixed(2)},${(q.y - (tx / tn) * hw).toFixed(2)}`);
      }
      return { ...at, i: c.i, trail: len > 4 ? [...left, ...right.reverse()].join(" ") : null };
    });

  return (
    <AbsoluteFill style={{ backgroundColor: "#3a3835" }}>
      <AirGrain frame={frame} />
      <FilmLife frame={frame}>
        {/* 1. sky */}
        <ArchiveCamera cam={cam} d={D_SKY}>
          <div style={{ position: "absolute", left: -910, top: -380, width: 2900, height: 2100, background: "#4a4844" }} />
          <Img
            src={staticFile(SRC_SKY)}
            style={{ position: "absolute", left: -910, top: -380, width: 2900, height: (2900 * 1788) / 2600, maxWidth: "none", filter: archiveFilter({ air: 0.35 }) }}
          />
        </ArchiveCamera>
        {/* 2. the hangar and the apron, with the painted line */}
        <ArchiveCamera cam={cam} d={1}>
          <ApronExtension />
          <HangarPlate clip={HG_CLIP} />
          <ApronShade />
          <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={W} height={H}>
            {/* a worn paint stripe across the taxiway, receding to the horizon's vanishing point */}
            <polygon points={PAINT} fill="#dedad2" opacity={0.5} style={{ filter: "blur(0.8px)" }} />
          </svg>
        </ArchiveCamera>
        {/* 3. the flow line and the coins: behind the airliner and the transports */}
        <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          {linePts.length > 1 ? (
            <>
              <polyline points={polyline} fill="none" stroke="#000" strokeWidth={lineW} strokeLinecap="round" strokeLinejoin="round" transform={`translate(${4 * cam.k} ${4 * cam.k})`} />
              <polyline points={polyline} fill="none" stroke="#fff" strokeWidth={lineW} strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : null}
          {coins.map((c) => {
            const r = COIN_R * c.k;
            const o = 4 * c.k;
            return (
              <g key={c.i}>
                {c.trail ? <polygon points={c.trail} fill="#000" transform={`translate(${o} ${o})`} /> : null}
                <circle cx={c.x + o} cy={c.y + o} r={r} fill="#000" />
                {c.trail ? <polygon points={c.trail} fill="#fff" /> : null}
                <circle cx={c.x} cy={c.y} r={r} fill="#fff" />
                <text x={c.x} y={c.y + r * 0.5} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={r * 1.45} fill="#000">
                  $
                </text>
              </g>
            );
          })}
        </svg>
        {/* 4. the airliner: ghost, print (with its prop discs once it is whole) */}
        <ArchiveCamera cam={cam} d={D_AIR}>
          <div style={{ position: "absolute", left: air.x - AIR_LEN / 2, top: air.y - AIR_H / 2, width: AIR_LEN, height: AIR_H }}>
            <Img src={staticFile(SRC_AIR)} style={{ position: "absolute", left: 0, top: 0, width: AIR_LEN, height: AIR_H, maxWidth: "none", opacity: 0.4, filter: GHOST_FILTER }} />
            <Img
              src={staticFile(SRC_AIR)}
              style={{ position: "absolute", left: 0, top: 0, width: AIR_LEN, height: AIR_H, maxWidth: "none", filter: AIR_FILTER, WebkitMaskImage: printMask, maskImage: printMask }}
            />
            {props > 0.002 ? (
              <svg width={AIR_LEN} height={AIR_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
                {PROPS.map((p, i) => (
                  <ellipse
                    key={i}
                    cx={p.x * PS}
                    cy={p.y * PS}
                    rx={p.rx * PS}
                    ry={p.ry * PS}
                    transform={`rotate(${p.rot} ${p.x * PS} ${p.y * PS})`}
                    fill={`rgba(206,201,192,${props})`}
                    style={{ filter: "blur(1.6px)" }}
                  />
                ))}
              </svg>
            ) : null}
          </div>
        </ArchiveCamera>
        {/* 5. the transports, then the hangar's right jamb in front of the ones still inside */}
        <ArchiveCamera cam={cam} d={1}>
          {transports.map(({ i, x }) => (
            <C130 key={i} x={x} />
          ))}
          <HangarPlate clip={HG_JAMB_CLIP} />
        </ArchiveCamera>
      </FilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default DefensePaysFirst;
