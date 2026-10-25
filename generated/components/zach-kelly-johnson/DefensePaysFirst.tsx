// ---------------------------------------------------------------------------
// DefensePaysFirst (zach-kelly-johnson, cut 43), REVISION 2 ("harmonious"). Core memory podcast, ARCHIVE COLLAGE
// (footage-matched variant, archiveShared.tsx). Opaque 1080x1920, 23.976 fps, 130 frames.
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
// REVISION 2 (user: "a great idea, however ... a bit sloppily done ... not very harmonious"): one viewpoint (all
// side-on, one ground line), one era and material (natural-metal 1950s C-130As and Constellation, side views, the
// same way, graded alike, ~true relative scale), one axis (the payment point, the plumb riser and the airliner all
// on the frame's centre line x 540), a calm centred composition, the lower frame the clip's dark ramp.
//
// THE MOTION: open high in an old grey sky on a pale GHOST Constellation (see-through, not built yet), already tilting
// down; one eased vertical tilt (the camera never leaves the axis x 540) down to the side of a 1950s hangar, landing
// (k 1.5, f40) as the first C-130A's nose comes out of the open door from behind its right jamb (f41). The C-130As
// (one cut-out, one scale, 440 world px, one ground line) roll left at a constant 27.5 px/f, one every 20 frames (pitch
// 550 = 1.25 x the length). Each of the first three passes the payment point on the axis at f60, 80, 100 (CONTACT);
// on that frame a white "$" coin (72 px at the ground, on its hard shadow) rises out from behind its fuselage (FIRST REACTION)
// straight up a plumb white riser (the first coin carries the riser's tip up) into the airliner's belly, through a
// slot at its belly line (above that line the coin is inside it). The camera pulls back f56 -> f84 (k 1.47 -> 1.14,
// the resting frame: airliner ~y 500-640, wheels ~y 1060, C-130s ~500 px on screen, then a creep to k 1.165) while the
// airliner comes down out of reach to y ~600, directly above the payment point. Each coin's touch (f69, 89, 109)
// prints a third of it from the axis outward (8-frame soft wipe); whole, fins included, at f117. "first ... period":
// from f118 it FLIES off the way its nose points (left), easing to 27 px/f by f125; at f120 the riser lets go of the
// belly and runs back down to the apron by f128. The row keeps rolling (the living part), a slow creep, film life.
// Scale: Constellation 1.25 x the C-130A's length (true ratio ~1.2), a little farther (depth 1.8, slight air).
//
// SOURCES (public/zach-kelly-johnson/C2, details in refs/C2/ASSETS_C2_READY.md; retouch: scripts/clips/zach-kelly-
// johnson/bake-defense-pays-c2.py):
//   C-130A 56-0528, USAF photo c. 1958, public domain (Commons File:C-130_60528_Texas.JPG).
//   Lockheed R7V-2 (Super Constellation) in flight c. 1953-54, U.S. Navy / National Museum of Naval Aviation
//   2011.003.065.018, public domain; its "UNITED STATES NAVY" titles, insignia and nose type painted out.
//   Plattsburgh AFB Maintenance Hangar, HAER NY-326-O-4, Clayton B. Fraser 2000, public domain (Library of Congress);
//   the pickup in front of the door painted out.
//   Sky: Clouds, Fortepan 6333, CC BY-SA 3.0, credit "FORTEPAN / Nagy Zita".
// ---------------------------------------------------------------------------
import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import {
  ArchiveCamera,
  type ArchiveCam,
  CaptionBands,
  CutOut,
  FilmLife,
  archiveFilter,
  depthTransform,
  fontFamily,
} from "./archiveShared";

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

// ---- assets (public/zach-kelly-johnson/C2; the retouched files come from bake-defense-pays-c2.py) ----
const SRC_SKY = "zach-kelly-johnson/C2/plate_sky_clouds_fortepan_clean.jpg"; // 1800 x 930, specks healed
const SKY_ASPECT = 1800 / 930;
const SRC_HANGAR =
  "zach-kelly-johnson/C2/plate_hangar_side_plattsburgh_clean.jpg"; // 2600 x 2048, pickup removed
const SRC_C130 =
  "zach-kelly-johnson/C2/cutout_c130a_natural_metal_side_facing-left.png"; // 1687 x 626, nose left
const C130_GROUND_V = 616 / 626; // the main gear's bottom row
const SRC_AIR =
  "zach-kelly-johnson/C2/cutout_constellation_side_facing-left_clean.png"; // 1705 x 408, nose left, titles and insignia painted out

// ---- planes ----
const D_SKY = 4;
const D_AIR = 1.8; // the airliner: farther off and higher

// ---- the ground plane (at the rest camera, world px = screen px) ----
const AXIS_X = 540; // the one axis: the payment point, the riser, the airliner
const GROUND_Y = 1050; // the one ground line: every wheel on it
const DIR = -1; // the row rolls left (the way the cut-outs face)
const C130_LEN = 440;
const C130_ASPECT = 1687 / 626;
const C130_H = C130_LEN / C130_ASPECT;
const SPEED = 27.5; // world px per frame, constant
const CADENCE = 20; // pitch 550 = 1.25 x the length
const CROSS = [0, 1, 2, 3, 4].map((i) => 60 + CADENCE * i); // each middle passes the payment point
const N_COINS = 3;
const transportX = (f: number, i: number) =>
  AXIS_X - DIR * SPEED * (CROSS[i] - f);
// the hangar, side-on (Plattsburgh plate, plate px): door floor line y 1092, door jambs x 1066 / 1866, roof line from
// (62, 873) to (2505, 556), the near end's bottom corner (2522, 1082). Scale: the door ~1.25 x a C-130's height.
const HG_S = 0.59;
const HG_W = 2600 * HG_S;
const HG_H = 2048 * HG_S;
const HG_X = 390 - 1066 * HG_S; // the door's left jamb at world x 390
const HG_Y = GROUND_Y - 1092 * HG_S;
const DOOR_X = HG_X + 1866 * HG_S; // the right jamb: the transports come out from behind it
const poly = (pts: number[][]) =>
  `polygon(${pts.map(([x, y]) => `${x * HG_S}px ${y * HG_S}px`).join(", ")})`;
const HG_CLIP = poly([
  [0, 2048],
  [0, 1086],
  [62, 1086],
  [62, 873],
  [2505, 556],
  [2522, 1082],
  [2600, 1082],
  [2600, 2048],
]);
const HG_JAMB_CLIP = poly([
  [1866, 640],
  [2600, 640],
  [2600, 1096],
  [1866, 1096],
]);

// ---- coins and the riser ----
const COIN_T = 12;
const COIN_HOLD = 0; // the coin goes into the belly through the slot clip
const PRINT_LEAD = 3;
const FILL_T = 8;
const SEGMENTS = 3;
const COIN_R = 36;
const LINE_W = 9;
const COIN_START_Y = GROUND_Y - 0.32 * C130_H; // behind the fuselage
const RISER_FOOT_Y = GROUND_Y - 4;
const RELEASE_F = 120;
const RETRACT_F1 = 128;
const COIN_EASE = Easing.bezier(0.45, 0, 0.75, 1);

// ---- the airliner ----
const AIR_LEN = 1.25 * C130_LEN; // ~ true relative scale (a Constellation is ~1.2 x a C-130's length), a little farther
const AIR_ASPECT = 1705 / 408;
const AIR_H = AIR_LEN / AIR_ASPECT;
const AIR_Y = 600; // its centre at rest
const AIR_LIFT0 = -520; // it starts this much higher (out of reach) and comes down on the pull-back
const BELLY_V = 349 / 408; // the airliner's lowest edge on the axis (wing and nacelle), as a fraction of its box
const ENTRY_DY = (BELLY_V - 0.5) * AIR_H; // the riser meets its belly there, on the axis
const FLY_F0 = 118;
const FLY_F1 = 125;
const FLY_V = 27;

// ---- camera: one vertical axis (x stays 540), target keys + damped follow ----
type Cam = { y: number; k: number };
const REST = { x0: W / 2, y0: H / 2 };
const KEYS: [number, Cam][] = [
  [0, { y: -200, k: 1.1 }],
  [40, { y: 985, k: 1.5 }],
  [56, { y: 985, k: 1.47 }],
  [84, { y: 965, k: 1.14 }], // the resting frame: airliner ~y 500-640, wheels ~y 1060, C-130s ~500 px
  [130, { y: 963, k: 1.165 }],
];
const camTarget = (f: number): Cam => {
  if (f <= KEYS[0][0]) return KEYS[0][1];
  for (let i = 0; i < KEYS.length - 1; i++) {
    const [f0, a] = KEYS[i];
    const [f1, b] = KEYS[i + 1];
    if (f <= f1) {
      const t = smooth((f - f0) / (f1 - f0));
      return { y: lerp(a.y, b.y, t), k: lerp(a.k, b.k, t) };
    }
  }
  return KEYS[KEYS.length - 1][1];
};
const CAM_TRACK: Cam[] = (() => {
  const out: Cam[] = [];
  let c = { ...KEYS[0][1] };
  let v = { y: 5, k: 0 }; // already tilting down at f0
  out.push({ ...c });
  for (let f = 1; f <= DURATION + 2; f++) {
    const t = camTarget(f);
    v = {
      y: v.y + (t.y - c.y) * 0.16 - v.y * 0.55,
      k: v.k + (t.k - c.k) * 0.16 - v.k * 0.55,
    };
    c = { y: c.y + v.y, k: c.k + v.k };
    out.push({ ...c });
  }
  return out;
})();
export const camAt = (frame: number): ArchiveCam => {
  const fi = Math.max(0, Math.floor(frame));
  const a = CAM_TRACK[Math.min(fi, CAM_TRACK.length - 1)];
  const b = CAM_TRACK[Math.min(fi + 1, CAM_TRACK.length - 1)];
  const t = frame - fi;
  return { x: AXIS_X, y: lerp(a.y, b.y, t), k: lerp(a.k, b.k, t), ...REST };
};

// ---- the airliner: lift, flight, print ----
const airLift = (f: number) => AIR_LIFT0 * (1 - smooth((f - 50) / 42));
const FLY_D: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION + 2; f++)
    out.push(
      out[f - 1] + FLY_V * smooth((f - 0.5 - FLY_F0) / (FLY_F1 - FLY_F0)),
    );
  return out;
})();
const flown = (f: number) => {
  const fi = Math.max(0, Math.min(FLY_D.length - 2, Math.floor(f)));
  return lerp(FLY_D[fi], FLY_D[fi + 1], f - fi);
};
const AIR_FACES = DIR; // it faces the way the row rolls
const airPos = (f: number) => ({
  x: AXIS_X + AIR_FACES * flown(f),
  y: AIR_Y + airLift(f),
});
const arrival = (i: number) => CROSS[i] + COIN_T;
/** printed fraction, from the riser's entry outward to nose and tail: each coin prints a third */
const printed = (f: number) => {
  let u = 0;
  for (let j = 0; j < SEGMENTS; j++)
    u += smooth((f - arrival(j) + PRINT_LEAD) / FILL_T) / SEGMENTS;
  return u;
};
export const WHOLE = arrival(SEGMENTS - 1) - PRINT_LEAD + FILL_T; // f117

// ---- the riser: screen-space, plumb on the axis ----
const riser = (cam: ArchiveCam, f: number) => {
  const g = depthTransform(cam, 1);
  const ga = depthTransform(cam, D_AIR);
  const foot = g.toScreen(AXIS_X, RISER_FOOT_Y);
  const start = g.toScreen(AXIS_X, COIN_START_Y);
  const fe = Math.min(f, RELEASE_F); // after the release the top no longer follows the airliner
  const a = airPos(fe);
  const top = ga.toScreen(AXIS_X, a.y + ENTRY_DY);
  // the coin's travel ends with it wholly above the belly line (inside the airliner: the slot clip hides it)
  const end = top.y - (COIN_R + 4) * ga.k;
  return {
    x: foot.x,
    foot: foot.y,
    start: start.y,
    top: top.y,
    end,
    kg: g.k,
    ka: ga.k,
  };
};

// ---- pieces ----
const AirGrain: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      <filter
        id="dpf-air-grain"
        colorInterpolationFilters="sRGB"
        x="0"
        y="0"
        width="100%"
        height="100%"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves={2}
          seed={(Math.floor(frame) * 37) % 997}
          result="n"
        />
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
// one grade for both aircraft (natural metal, side-on); the airliner adds a little air for distance
const C130_FILTER = `${archiveFilter()} url(#dpf-air-grain)`;
const AIR_FILTER = `${archiveFilter({ air: 0.3, blur: 0.15 })} url(#dpf-air-grain)`;
const GHOST_FILTER = `${archiveFilter({ air: 0.3 })} contrast(0.4) brightness(1.4) url(#dpf-air-grain)`;

const Transport: React.FC<{ x: number }> = ({ x }) => (
  <CutOut
    src={SRC_C130}
    x={x}
    y={GROUND_Y + (1 - C130_GROUND_V) * C130_H}
    w={C130_LEN}
    aspect={C130_ASPECT}
    filter={C130_FILTER}
    shadow={[
      {
        x: -0.03 * C130_LEN,
        dy: -1,
        w: 0.9 * C130_LEN,
        h: 22,
        opacity: 0.45,
      },
      {
        x: -0.05 * C130_LEN,
        dy: -2,
        w: 0.22 * C130_LEN,
        h: 10,
        opacity: 0.75,
      },
      {
        x: -0.385 * C130_LEN,
        dy: -6,
        w: 0.05 * C130_LEN,
        h: 7,
        opacity: 0.7,
      },
    ]}
  />
);

/** the hangar plate cut to its outline (the blank sky goes); the back of the open door in deep shade (what is parked in
 *  there does not read); the grass below the apron goes soft */
const HangarPlate: React.FC<{ clip: string }> = ({ clip }) => {
  const img = (filter: string, mask?: string) => (
    <Img
      src={staticFile(SRC_HANGAR)}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: HG_W,
        height: HG_H,
        maxWidth: "none",
        filter,
        ...(mask ? { WebkitMaskImage: mask, maskImage: mask } : {}),
      }}
    />
  );
  return (
    <div
      style={{
        position: "absolute",
        left: HG_X,
        top: HG_Y,
        width: HG_W,
        height: HG_H,
        clipPath: clip,
        WebkitClipPath: clip,
      }}
    >
      {img(
        archiveFilter({ blur: 3 }),
        `linear-gradient(to bottom, transparent ${1130 * HG_S}px, black ${1260 * HG_S}px, black ${1780 * HG_S}px, transparent ${2040 * HG_S}px)`,
      )}
      {img(
        archiveFilter(),
        `linear-gradient(to bottom, black ${1130 * HG_S}px, transparent ${1260 * HG_S}px)`,
      )}
      <div
        style={{
          position: "absolute",
          left: 1066 * HG_S,
          top: 860 * HG_S,
          width: 800 * HG_S,
          height: (1094 - 860) * HG_S,
          background:
            "linear-gradient(to bottom, rgba(14,12,10,0) 0%, rgba(14,12,10,0.55) 35%, rgba(14,12,10,0.88) 62%, rgba(14,12,10,0.9) 100%)",
        }}
      />
    </div>
  );
};

/** below the plate: the same ground, flat, and over it all the clip's dark lower ramp (cut 6's values) */
const Apron: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: -1200,
      top: HG_Y + 1200 * HG_S,
      width: W + 2400,
      height: 1600,
      background: "#64625d",
      filter: archiveFilter({ blur: 3 }),
    }}
  />
);
const LowerRamp: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: -1200,
      top: GROUND_Y + 30,
      width: W + 2400,
      height: 1500,
      background:
        "linear-gradient(to bottom, rgba(44,38,32,0) 0%, rgba(44,38,32,0.32) 10%, rgba(42,36,30,0.62) 26%, rgba(40,34,28,0.8) 45%, rgba(38,32,27,0.86) 100%)",
    }}
  />
);

const DefensePaysFirst: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);

  // the airliner and its print, centre-out from the riser's entry
  const air = airPos(frame);
  const u = printed(frame);
  const feather = 70;
  const c = AIR_LEN / 2;
  const hw = u * (AIR_LEN / 2 + feather);
  const printMask =
    hw <= 0
      ? "linear-gradient(transparent, transparent)"
      : `linear-gradient(to right, transparent ${c - hw - feather / 2}px, black ${c - hw + feather / 2}px, black ${c + hw - feather / 2}px, transparent ${c + hw + feather / 2}px)`;

  // the row
  const transports = CROSS.map((_, i) => ({
    i,
    x: transportX(frame, i),
  })).filter(
    ({ x }) => x + C130_LEN / 2 > -60 && x - C130_LEN / 2 < DOOR_X + 4,
  );

  // the riser and the coins (screen space; the axis is plumb because the camera stays on it)
  const r = riser(cam, frame);
  const coinY = (i: number) =>
    lerp(r.start, r.end, COIN_EASE(clamp01((frame - CROSS[i]) / COIN_T)));
  const kAt = (y: number) =>
    lerp(r.kg, r.ka, clamp01((r.start - y) / Math.max(1, r.start - r.end)));
  const retract = smooth((frame - RELEASE_F) / (RETRACT_F1 - RELEASE_F));
  const tipY = frame >= CROSS[0] ? Math.max(r.top, coinY(0)) : r.foot; // the first coin carries the riser's tip up
  const riserTop = lerp(tipY, r.foot, retract);
  const lineW = LINE_W * cam.k;
  const coins = CROSS.slice(0, N_COINS)
    .map((cf, i) => ({
      i,
      live: frame >= cf && frame <= cf + COIN_T + COIN_HOLD,
    }))
    .filter((q) => q.live)
    .map((q) => {
      const y = coinY(q.i);
      const k = kAt(y);
      return { i: q.i, y, k };
    });

  return (
    <AbsoluteFill style={{ backgroundColor: "#3a3835" }}>
      <AirGrain frame={frame} />
      <FilmLife frame={frame}>
        {/* 1. sky */}
        <ArchiveCamera cam={cam} d={D_SKY}>
          <div
            style={{
              position: "absolute",
              left: -1360,
              top: -330,
              width: 3800,
              height: 2200,
              background: "#8a8782",
            }}
          />
          <Img
            src={staticFile(SRC_SKY)}
            style={{
              position: "absolute",
              left: -1360,
              top: -330,
              width: 3800,
              height: 3800 / SKY_ASPECT,
              maxWidth: "none",
              filter: archiveFilter({ air: 0.2 }),
            }}
          />
        </ArchiveCamera>
        {/* 2. the apron */}
        <ArchiveCamera cam={cam} d={1}>
          <Apron />
          <HangarPlate clip={HG_CLIP} />
          <LowerRamp />
        </ArchiveCamera>
        {/* 3. the riser and the coins: behind the airliner and the transports */}
        <svg
          width={W}
          height={H}
          style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
        >
          {riserTop < r.foot - 0.5 ? (
            <>
              <line
                x1={r.x + 4 * cam.k}
                y1={r.foot + 4 * cam.k}
                x2={r.x + 4 * cam.k}
                y2={riserTop + 4 * cam.k}
                stroke="#000"
                strokeWidth={lineW}
                strokeLinecap="round"
              />
              <line
                x1={r.x}
                y1={r.foot}
                x2={r.x}
                y2={riserTop}
                stroke="#fff"
                strokeWidth={lineW}
                strokeLinecap="round"
              />
            </>
          ) : null}
          {/* the slot: above the airliner's belly line a coin is inside it */}
          <defs>
            <clipPath id="dpf-slot">
              <rect x={-W} y={r.top} width={3 * W} height={3 * H} />
            </clipPath>
          </defs>
          <g clipPath="url(#dpf-slot)">
            {coins.map((q) => {
              const rr = COIN_R * q.k;
              const o = 4 * q.k;
              return (
                <g key={q.i}>
                  <circle cx={r.x + o} cy={q.y + o} r={rr} fill="#000" />
                  <circle cx={r.x} cy={q.y} r={rr} fill="#fff" />
                  <text
                    x={r.x}
                    y={q.y + rr * 0.5}
                    textAnchor="middle"
                    fontFamily={fontFamily}
                    fontWeight={900}
                    fontSize={rr * 1.45}
                    fill="#000"
                  >
                    $
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
        {/* 4. the airliner: ghost, then the print from the axis outward */}
        <ArchiveCamera cam={cam} d={D_AIR}>
          <div
            style={{
              position: "absolute",
              left: air.x - AIR_LEN / 2,
              top: air.y - AIR_H / 2,
              width: AIR_LEN,
              height: AIR_H,
            }}
          >
            <Img
              src={staticFile(SRC_AIR)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: AIR_LEN,
                height: AIR_H,
                maxWidth: "none",
                opacity: 0.4,
                filter: GHOST_FILTER,
              }}
            />
            <Img
              src={staticFile(SRC_AIR)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: AIR_LEN,
                height: AIR_H,
                maxWidth: "none",
                filter: AIR_FILTER,
                WebkitMaskImage: printMask,
                maskImage: printMask,
              }}
            />
          </div>
        </ArchiveCamera>
        {/* 5. the row, and the hangar they come out of (its end wall in front of the ones still inside) */}
        <ArchiveCamera cam={cam} d={1}>
          {transports.map(({ i, x }) => (
            <Transport key={i} x={x} />
          ))}
          <HangarPlate clip={HG_JAMB_CLIP} />
        </ArchiveCamera>
      </FilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default DefensePaysFirst;
