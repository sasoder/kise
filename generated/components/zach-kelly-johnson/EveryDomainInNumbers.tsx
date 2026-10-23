// ---------------------------------------------------------------------------
// EveryDomainInNumbers (zach-kelly-johnson, cut 26). Core Memory, footage-matched variant: ARCHIVE COLLAGE
// (archiveShared.tsx). Opaque 1080x1920, 23.976 fps, 188 frames.
//
// CHECK LINE: "Warships, submarines and rockets — in every domain, one isn't enough; each has to come off the line in
// numbers."
//
// THE LINE: "If we need producible systems in any domain — surface, subsurface, space — they have to be producible.
// And this is being talked about across the defense industrial base."
// WORD -> FRAME (local): If -3 · we 3 · need 8 · producible 12 · systems 22 · in 29 · any 43 · domain 49 · surface 60 ·
// subsurface 72 · space 89 · they 101 · have 105 · to 108 · be 111 · producible 112 · And 122 · this 125 · being 128 ·
// talked 132 · about 137 · across 144 · the 154 · defense 164 · industrial 171 · base 176 · speech ends ~185.
// DURATION: the slot 26.27625 -> 34.117417 s (sequence frames 630 -> 818) = 188 frames (f0..f187).
//
// THE MOTION: one vertical cross-section of the world: space and sky at the top, the sea surface across the middle,
// the deep below. One camera pull-back from f0 (close on the destroyer already sailing in from the right edge, whole by
// ~f10) with a small pan right and a tilt down, one deceleration lobe landing at f110, then a slow pull-back creep to the
// end. The deep comes in through the bottom edge with the submarine gliding in it (~f44-f66, on "subsurface"); the
// rocket rises out from behind the horizon (nose ~f56, whole by ~f85, on "space") and brakes into a slow steady climb by
// f104. On "they have to be producible" (f100 to ~f120) each subject becomes a production run:
// copies step out from behind it, first as the chain (orange, purple, blue flat silhouettes of that cut-out), the
// archive photo landing on top of them: a column of destroyers in echelon receding astern, a staggered pack of subs, a
// row of rockets receding to the left. f122-f187: no new elements; all three runs keep sailing, gliding and climbing
// inside the creep. Ships and subs move at a constant 1.3 px a frame; the rocket's braking climb is the one eased
// travel (it has to clear the horizon by "space" and still be in frame at f187).
// THE SEA (revision 1): a lit sea in perspective, the cleaned sky plate's own reflection squashed toward a high horizon
// (y 700), a glint band at the horizon, drifting swell, darker toward us; ships cast soft reflections; the near water
// line is a soft bright underside with light shafts under it. The ship run recedes toward the horizon (scales 1.0, 0.72,
// 0.52, 0.38, waterlines rising, lighter with distance). Every rocket climbs on its exhaust: a white-hot flame and a
// smoke column that is its own past path (it hangs where it was made, so it lengthens as the rocket climbs, widening,
// softening and greying with age, back to the horizon); copies carry the same, fainter with distance.
// THE RUN (revision 2): copies of a run start 4 frames apart (f100, f104, f108, f112); each copy's chain steps 1 frame
// apart and is gone ~7 frames after its start, so at most two copies of a run are in colour at once; every chain layer
// is painted under every photo of its run (and under the subject), so a colour never lies over a photo. Subs carry a
// soft top-light from the surface; far destroyers haze toward mid-grey, darker than the water behind them.
// CHAIN = PRODUCTION (archiveShared legend): copies coming off the line. This cut's one chain moment is the run.
//
// Cause and effect: every copy starts exactly behind its subject (hidden by it) and steps out from there; the rocket is
// behind the horizon until it rises past it; the deep and its sub enter through the frame's bottom edge as the camera
// pulls back.
//
// SOURCES (refs/B/ASSETS_B_READY.md, refs/asset_sources.txt): USS O'Hare (DDR-889), US Navy NH 81826, PD. USS Skipjack
// (SS-184), US Navy 19-N-19053, 1938, PD. Mercury-Redstone 3, NASA S61-03158, 1961, PD. Milky Way: NPS Great Basin, PD.
// CREDITS REQUIRED (credit list): sea and clouds "FORTEPAN / Nagy Zita", CC BY-SA 3.0 (Fortepan 6333; specks removed
// by a median filter, see SEA below); underwater rays "Olivier Dugornay / Ifremer", CC BY 4.0.
// No figures on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ARCHIVE_FILTER, ArchiveCamera, type ArchiveCam, CHAIN, CaptionBands, DustMotes, FilmLife, Plate, archiveFilter, depthTransform } from "./archiveShared";
import {
  CUT_Y,
  D_NEAR,
  D_SEA,
  D_SKY,
  DURATION as PLAN_DURATION,
  H,
  HORIZON_Y,
  ROCKET_IMG,
  ROCKET_LEN,
  ROCKET_SLOTS,
  ROCKET_X,
  SHIP_IMG,
  SHIP_LEN,
  SHIP_SLOTS,
  SHIP_WL,
  SUB_IMG,
  SUB_LEN,
  SUB_SLOTS,
  SUB_Y,
  TRAIL_GROW,
  TRAIL_MAX_AGE,
  TRAIL_W0,
  type Slot,
  W,
  camAt,
  rocketSlotY,
  rocketY,
  runProgress,
  shipX,
  subX,
  toScreen,
} from "./everyDomainPlan";

export const FPS = 24000 / 1001;
export const DURATION = PLAN_DURATION;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// the plan's dolly must be archiveShared's dolly (the band checks run on the plan)
{
  const c = camAt(37);
  const a = depthTransform({ x: c.x, y: c.y, k: c.k }, D_SEA).toScreen(300, 700);
  const b = toScreen(37, D_SEA, 300, 700);
  if (Math.abs(a.x - b.x) > 1e-6 || Math.abs(a.y - b.y) > 1e-6) throw new Error("everyDomainPlan.toScreen drifted from depthTransform");
}

// ---- plates ----
// the Fortepan plate with its glass-plate specks taken out (median, baked once):
//   ffmpeg -i plate_sea_horizon_fortepan.jpg -vf "format=gray,median=radius=4,format=yuvj420p" -q:v 3 plate_sea_horizon_fortepan_clean.jpg
const SEA = "zach-kelly-johnson/B/plate_sea_horizon_fortepan_clean.jpg"; // 1800 x 1400, horizon at row 1049
const SEA_HZ = 1049; // the plate's horizon row
const REFL_SQ = 0.46; // the sky's reflection, squashed toward the horizon (perspective on the water)
const WATER_H = 520; // the lit sea, horizon down past the near water line
const SEA_W = 1500;
const SEA_S = SEA_W / 1800;
const SEA_X = -210;
const SEA_Y = HORIZON_Y - 1049 * SEA_S;
const SPACE = "zach-kelly-johnson/B/plate_nightsky_milkyway_pano.jpg"; // 2600 x 666, mountains along the bottom (cropped)
const DEEP = "zach-kelly-johnson/B/plate_underwater_sunrays.jpg"; // 1736 x 2600, the sun at (744, 440)
const DEEP_W = 1400;
const DEEP_S = DEEP_W / 1736;
const DEEP_SUN_Y = 770; // world y of the sun: just above the cut, so only its rays show below the surface
const DEEP_X = 540 - 744 * DEEP_S;
const DEEP_Y = DEEP_SUN_Y - 440 * DEEP_S;

// ---- tones (warm-neutral, the grade's own) ----
const AIR: [number, number, number] = [196, 191, 182]; // haze at the horizon: ships and rockets recede into it
const WATER: [number, number, number] = [58, 56, 52]; // the deep's own tone: subs recede into it
const SUB_BASE_AIR = 0.12; // every sub sits in water

// ---- poses ----
type Pose = { x: number; y: number; w: number }; // x: the subject's centre; y: waterline (ship, sub) or nozzle (rocket); w: visible length
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const poseAt = (lead: Pose, slot: Slot, p: number, yAt?: (p: number) => number): Pose => ({
  x: lead.x + slot.dx * p,
  y: yAt ? yAt(p) : lead.y + slot.dy * p,
  w: lead.w * lerp(1, slot.s, p),
});

// ---- filters: the chain floods (an <Img> through feFlood + feComposite "in": never a CSS mask-image, which can drop a
// layer on a frame) and the per-copy haze (feColorMatrix toward the air or the water) ----
const FLOOD_ID = (j: number) => `edn-flood-${j}`;
const FloodDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
    <defs>
      {CHAIN.map((c, j) => (
        <filter key={c} id={FLOOD_ID(j)} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feFlood floodColor={c} floodOpacity={1} result="flat" />
          <feComposite in="flat" in2="SourceAlpha" operator="in" />
        </filter>
      ))}
    </defs>
  </svg>
);
const HazeDef: React.FC<{ id: string; a: number; tone: [number, number, number] }> = ({ id, a, tone }) => {
  const m = 1 - a;
  const [r, g, b] = tone.map((v) => (a * v) / 255);
  return (
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
          <feColorMatrix type="matrix" values={`${m} 0 0 0 ${r} 0 ${m} 0 0 ${g} 0 0 ${m} 0 ${b} 0 0 0 1 0`} />
        </filter>
      </defs>
    </svg>
  );
};
/** The CSS filter of a photo body: the grade (with a little air softness), then the haze toward `tone`. */
const photoFilter = (hazeId: string | null, air: number, lift = 1) =>
  `${air > 0 ? archiveFilter({ air: 0.5 * air }) : ARCHIVE_FILTER}${lift !== 1 ? ` brightness(${lift})` : ""}${hazeId ? ` url(#${hazeId})` : ""}`;
const SUB_LIFT = 1.3; // the dark-grey hull, lit from the surface

// ---- the bodies: one drawing per subject, used for the photo core (filter = the grade + haze) and for each chain
// layer (filter = a flood) ----
type BodyProps = { pose: Pose; filter: string; lit?: boolean };
const full: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%", maxWidth: "none" };

const ShipBody: React.FC<BodyProps> = ({ pose, filter }) => {
  const sc = pose.w / SHIP_IMG.vis;
  return (
    <div
      style={{
        position: "absolute",
        left: pose.x - SHIP_IMG.ax * sc,
        top: pose.y - SHIP_IMG.ay * sc,
        width: SHIP_IMG.w * sc,
        height: SHIP_IMG.h * sc,
        transform: `rotate(${SHIP_IMG.level}deg)`,
        transformOrigin: `${SHIP_IMG.ax * sc}px ${SHIP_IMG.ay * sc}px`,
        filter,
      }}
    >
      <Img src={staticFile(SHIP_IMG.src)} style={full} />
    </div>
  );
};

/** The sub: the surfaced photo, levelled and turned to sail left, its hull side mirrored below the waterline as the
 * belly (darker, the underside out of the light), clipped to a half ellipse so the hull ends round off. */
const SubBody: React.FC<BodyProps & { belly?: boolean }> = ({ pose, filter, belly = true, lit = false }) => {
  const sc = pose.w / SUB_IMG.vis;
  const w = SUB_IMG.w * sc;
  const h = SUB_IMG.h * sc;
  const wl = SUB_IMG.wl * sc;
  const src = staticFile(SUB_IMG.src);
  return (
    <div
      style={{
        position: "absolute",
        left: pose.x - SUB_IMG.cx * sc,
        top: pose.y - wl,
        width: w,
        height: h + SUB_IMG.belly * sc,
        transform: "scaleX(-1)",
        transformOrigin: `${SUB_IMG.cx * sc}px ${wl}px`,
        filter,
      }}
    >
      <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h + SUB_IMG.belly * sc, transform: `rotate(${SUB_IMG.level}deg)`, transformOrigin: `${SUB_IMG.lx * sc}px ${wl}px` }}>
        <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, maxWidth: "none" }} />
        {/* the sail's hull number would read mirrored once the boat is turned to sail left: painted out in the sail's tone */}
        <div style={{ position: "absolute", left: 1138 * sc, top: 54 * sc, width: 56 * sc, height: 29 * sc, borderRadius: 3 * sc, background: "#343434", filter: `blur(${0.8 * sc}px)` }} />
        {lit ? (
          // top-light from the surface: the same boat brighter, through a gradient that keeps only its sail, deck and
          // upper hull (a gradient mask, no image url, so it cannot drop a frame)
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: w,
              height: h,
              filter: "brightness(2.5)",
              WebkitMaskImage: `linear-gradient(to bottom, rgba(0,0,0,0.95) ${58 * sc}px, rgba(0,0,0,0.75) ${118 * sc}px, rgba(0,0,0,0.25) ${142 * sc}px, rgba(0,0,0,0) ${160 * sc}px)`,
              maskImage: `linear-gradient(to bottom, rgba(0,0,0,0.95) ${58 * sc}px, rgba(0,0,0,0.75) ${118 * sc}px, rgba(0,0,0,0.25) ${142 * sc}px, rgba(0,0,0,0) ${160 * sc}px)`,
            }}
          >
            <Img src={src} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, maxWidth: "none" }} />
            <div style={{ position: "absolute", left: 1138 * sc, top: 54 * sc, width: 56 * sc, height: 29 * sc, borderRadius: 3 * sc, background: "#343434", filter: `blur(${0.8 * sc}px)` }} />
          </div>
        ) : null}
        {belly ? (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: wl - 0.6,
              width: w,
              height: SUB_IMG.belly * sc,
              overflow: "hidden",
              clipPath: `ellipse(${(850 / 1800) * 100}% 100% at ${(SUB_IMG.cx / 1800) * 100}% 0%)`,
            }}
          >
            <Img
              src={src}
              style={{ position: "absolute", left: 0, top: wl, width: w, height: h, maxWidth: "none", transform: "scaleY(-1)", transformOrigin: "50% 0%", filter: `brightness(0.42) blur(${0.9 * sc}px)` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

const RKT_SC = (w: number) => w / ROCKET_IMG.body; // pose.w = the body's width
const rocketW = (len: number) => (len / (ROCKET_IMG.used - ROCKET_IMG.top)) * ROCKET_IMG.body;
const ROCKET_CLIP = (() => {
  // image px of the used crop: keep the body and fins, cut the umbilical and steam right of the body along a mirror of
  // the left fin's edge, and everything below the fins' foot (the pad)
  const pts = [
    [0, 0],
    [416, 0],
    [416, 1380],
    [250, 1380],
    [250, 1452],
    [293, 1692],
    [53, 1692],
    [0, 1450],
  ];
  return `polygon(${pts.map(([x, y]) => `${((x / 416) * 100).toFixed(3)}% ${((y / ROCKET_IMG.used) * 100).toFixed(3)}%`).join(",")})`;
})();
const RocketBody: React.FC<BodyProps> = ({ pose, filter }) => {
  const sc = RKT_SC(pose.w);
  return (
    <div
      style={{
        position: "absolute",
        left: pose.x - ROCKET_IMG.cx * sc,
        top: pose.y - ROCKET_IMG.used * sc,
        width: ROCKET_IMG.w * sc,
        height: ROCKET_IMG.used * sc,
        clipPath: ROCKET_CLIP,
      }}
    >
      {/* the filter on an inner box, the crop on the outer one: a flood on the clipped box itself filled the box */}
      <div style={{ position: "absolute", left: 0, top: 0, width: ROCKET_IMG.w * sc, height: ROCKET_IMG.h * sc, filter }}>
        <Img src={staticFile(ROCKET_IMG.src)} style={full} />
      </div>
    </div>
  );
};

/** The flame: a white-hot tongue at the nozzle and a soft glow round it. Flickers per frame. */
const Flame: React.FC<{ x: number; y: number; w: number; frame: number; seed: string; k: number }> = ({ x, y, w, frame, seed, k }) => {
  const fl = 0.88 + 0.12 * random(`flame-${seed}-${Math.floor(frame)}`);
  const fw = w * 0.7;
  const fh = w * 2.9 * fl;
  const gw = w * 2.6;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - gw / 2,
          top: y - gw * 0.3,
          width: gw,
          height: gw * 1.3,
          background: `radial-gradient(ellipse 50% 50% at 50% 40%, rgba(255,250,240,${0.42 * k * fl}) 0%, rgba(250,244,232,${0.16 * k}) 45%, rgba(250,244,232,0) 100%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - fw / 2,
          top: y - w * 0.05,
          width: fw,
          height: fh,
          background: `radial-gradient(ellipse 50% 100% at 50% 0%, rgba(255,252,246,${k}) 0%, rgba(255,250,240,${0.95 * k}) 38%, rgba(244,238,226,${0.4 * k}) 72%, rgba(244,238,226,0) 100%)`,
          filter: `blur(${w * 0.05}px)`,
        }}
      />
    </>
  );
};

/**
 * The exhaust column: the smoke hangs where it was made, so the column below a rocket is the rocket's own past path.
 * A slice made `a` frames ago sits where the nozzle was then, TRAIL_W0 body widths wide plus TRAIL_GROW px per frame
 * of age (it widens and softens as it ages: the billow), drifting a little downwind. Bright and white near the nozzle,
 * greyer and thinner toward the horizon, shaded on its far side; ragged edges from a slowly rolling noise field.
 * `s` scales a copy's column; `k` its strength (fainter with distance).
 */
const Trail: React.FC<{ id: string; x: number; y: number; bodyW: number; s: number; frame: number; k: number }> = ({ id, x, y, bodyW, s, frame, k }) => {
  const y0 = rocketY(frame);
  const left: string[] = [];
  const right: string[] = [];
  let bottom = y;
  for (let a = 0; a <= TRAIL_MAX_AGE; a += a < 30 ? 1 : 2) {
    const yy = y + s * (rocketY(frame - a) - y0);
    const hw = (s * (TRAIL_W0 * bodyW / s + TRAIL_GROW * a)) / 2;
    const wob = 0.1 * hw * Math.sin(a * 0.37 + id.length) + 0.06 * hw * Math.sin(a * 0.91 + 1.7);
    const cx = x + s * 0.11 * a;
    left.push(`${(cx - hw + wob).toFixed(2)},${yy.toFixed(2)}`);
    right.push(`${(cx + hw + wob).toFixed(2)},${yy.toFixed(2)}`);
    bottom = yy;
    if (yy > HORIZON_Y + 40) break;
  }
  const d = `M${left.join(" L")} L${right.reverse().join(" L")} Z`;
  const fid = `edn-trail-${id}`;
  const top = y;
  const span = Math.max(1, bottom - top);
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} aria-hidden>
      <defs>
        <filter id={fid} x="-40%" y="-8%" width="180%" height="116%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency={`${0.03 / Math.max(0.5, s)} ${0.016 / Math.max(0.5, s)}`} numOctaves={2} seed={7} result="n" />
          <feOffset in="n" dx={0.25 * frame} dy={-0.35 * frame} result="n2" />
          <feDisplacementMap in="SourceGraphic" in2="n2" scale={16 * s} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={2.4 * s} />
        </filter>
        <linearGradient id={`${fid}-v`} gradientUnits="userSpaceOnUse" x1={0} y1={top} x2={0} y2={top + span}>
          <stop offset="0" stopColor="rgb(250,247,240)" stopOpacity={0.97 * k} />
          <stop offset={Math.min(0.9, (60 * s) / span)} stopColor="rgb(232,228,220)" stopOpacity={0.9 * k} />
          <stop offset="0.6" stopColor="rgb(196,192,184)" stopOpacity={0.78 * k} />
          <stop offset="1" stopColor="rgb(170,166,159)" stopOpacity={0.62 * k} />
        </linearGradient>
        <linearGradient id={`${fid}-h`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgb(255,255,255)" stopOpacity={0.18 * k} />
          <stop offset="0.45" stopColor="rgb(120,117,112)" stopOpacity={0} />
          <stop offset="1" stopColor="rgb(80,78,74)" stopOpacity={0.4 * k} />
        </linearGradient>
      </defs>
      <g filter={`url(#${fid})`}>
        <path d={d} fill={`url(#${fid}-v)`} />
        <path d={d} fill={`url(#${fid}-h)`} />
      </g>
    </svg>
  );
};

type Kind = "ship" | "sub" | "rocket";
const BODY: Record<Kind, React.FC<BodyProps>> = { ship: ShipBody, sub: SubBody, rocket: RocketBody };
const SHIP_AIR: [number, number, number] = [112, 109, 103]; // a far hull hazes toward mid-grey, still darker than the lit water behind it
const TONE: Record<Kind, [number, number, number]> = { ship: SHIP_AIR, sub: WATER, rocket: AIR };

/** A ship's reflection on the lit sea: its own picture flipped about the waterline, squashed, dark and soft, fading
 * away from the hull. The near water line (the deep, drawn over it) hides whatever falls below it. */
const ShipReflection: React.FC<{ pose: Pose; filter: string }> = ({ pose, filter }) => {
  const sc = pose.w / SHIP_IMG.vis;
  const fade = `linear-gradient(to bottom, rgba(0,0,0,0) ${420 * sc}px, rgba(0,0,0,1) ${SHIP_IMG.ay * sc}px)`;
  return (
    <div
      style={{
        position: "absolute",
        left: pose.x - SHIP_IMG.ax * sc,
        top: pose.y - SHIP_IMG.ay * sc + 1,
        width: SHIP_IMG.w * sc,
        height: SHIP_IMG.h * sc,
        transform: `rotate(${SHIP_IMG.level}deg) scaleY(-0.5)`,
        transformOrigin: `${SHIP_IMG.ax * sc}px ${SHIP_IMG.ay * sc}px`,
        opacity: 0.42,
        WebkitMaskImage: fade,
        maskImage: fade,
      }}
    >
      <div style={{ ...full, filter: `${filter} brightness(0.5) blur(${1.6}px)` }}>
        <Img src={staticFile(SHIP_IMG.src)} style={full} />
      </div>
    </div>
  );
};

/** One photo core: haze def + body (+ a ship's reflection under it, a rocket's exhaust under it). */
const Core: React.FC<{ kind: Kind; id: string; pose: Pose; air: number; frame: number }> = ({ kind, id, pose, air, frame }) => {
  const Body = BODY[kind];
  const a = kind === "sub" ? SUB_BASE_AIR + (1 - SUB_BASE_AIR) * air : kind === "ship" ? air * 0.5 : air * 0.6;
  const hazeId = a > 0.002 ? `edn-haze-${id}` : null;
  const filter = photoFilter(hazeId, air, kind === "sub" ? SUB_LIFT : 1);
  const s = kind === "rocket" ? pose.w / rocketW(ROCKET_LEN) : 1;
  const strength = 1 - 0.75 * air;
  return (
    <>
      {hazeId ? <HazeDef id={hazeId} a={a} tone={TONE[kind]} /> : null}
      {kind === "ship" ? <ShipReflection pose={pose} filter={filter} /> : null}
      {kind === "rocket" ? (
        <>
          <Trail id={id} x={pose.x} y={pose.y + pose.w * 0.6} bodyW={pose.w} s={s} frame={frame} k={strength} />
          <Flame x={pose.x} y={pose.y} w={pose.w} frame={frame} seed={id} k={strength} />
        </>
      ) : null}
      <Body pose={pose} filter={filter} lit={kind === "sub"} />
    </>
  );
};

/**
 * Copy i of a run: its chain layers (orange leads, then purple, blue) and the photo core last, each travelling from
 * the subject's own pose (hidden behind it) to the slot. The core lands on top of the colours and hides them; once it
 * has all but landed the colours are not drawn at all (no antialiased fringe in the hold).
 */
const RunCopy: React.FC<{ kind: Kind; part: "chain" | "core"; frame: number; i: number; lead: Pose; slot: Slot; yAt?: (p: number) => number }> = ({
  kind,
  part,
  frame,
  i,
  lead,
  slot,
  yAt,
}) => {
  const pr = runProgress(frame, i);
  const coreP = pr[3];
  const Body = BODY[kind];
  if (part === "chain") {
    return coreP < CHAIN_OFF ? (
      <>{CHAIN.map((c, j) => (pr[j] > 0 ? <Body key={c} pose={poseAt(lead, slot, pr[j], yAt)} filter={`url(#${FLOOD_ID(j)})`} /> : null))}</>
    ) : null;
  }
  return coreP > 0 ? <Core kind={kind} id={`${kind}-${i}`} pose={poseAt(lead, slot, coreP, yAt)} air={slot.air * coreP} frame={frame} /> : null;
};
/** The colours stop being drawn once the photo core is this far along (~7 frames after the copy's start). */
const CHAIN_OFF = 0.86;

/**
 * A whole run: every copy's chain first, then every copy's photo, farthest first, then the subject on top. So a colour
 * is never drawn over any photo (another copy's or the subject's): each copy's colours show only where no photo is.
 */
const Run: React.FC<{ kind: Kind; slots: Slot[]; frame: number; lead: Pose; yAt?: (s: Slot) => (p: number) => number }> = ({ kind, slots, frame, lead, yAt }) => {
  const order = slots.map((s, i) => ({ s, i })).sort((a, b) => a.s.s - b.s.s);
  return (
    <>
      {order.map(({ s, i }) => (
        <RunCopy key={`c${i}`} kind={kind} part="chain" frame={frame} i={i} lead={lead} slot={s} yAt={yAt ? yAt(s) : undefined} />
      ))}
      {order.map(({ s, i }) => (
        <RunCopy key={`p${i}`} kind={kind} part="core" frame={frame} i={i} lead={lead} slot={s} yAt={yAt ? yAt(s) : undefined} />
      ))}
      <Core kind={kind} id={`${kind}-lead`} pose={lead} air={0} frame={frame} />
    </>
  );
};

// ---- the surface line and the deep ----
const SURF_PTS = 60;
const surfaceY = (wx: number, frame: number) => CUT_Y + 2.2 * Math.sin(wx * 0.019 + frame * 0.17) + 1.1 * Math.sin(wx * 0.043 - frame * 0.27 + 1.3);
/** The deep's outline in its container's px (the container starts 400 px left of the world origin). */
const surfacePolygon = (frame: number) => {
  const pts: string[] = [];
  for (let i = 0; i <= SURF_PTS; i++) {
    const x = ((W + 800) * i) / SURF_PTS;
    pts.push(`${x}px ${surfaceY(x - 400, frame)}px`);
  }
  pts.push(`${W + 800}px ${H + 900}px`, `0px ${H + 900}px`);
  return `polygon(${pts.join(",")})`;
};

const Shafts: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    {[
      { x: 180, w: 110, a: 0.1, sk: 14, ph: 0.3 },
      { x: 400, w: 80, a: 0.08, sk: 6, ph: 1.7 },
      { x: 640, w: 120, a: 0.1, sk: -4, ph: 2.9 },
      { x: 900, w: 90, a: 0.08, sk: -12, ph: 4.2 },
    ].map((s, i) => {
      const sway = 14 * Math.sin(frame * 0.035 + s.ph);
      const a = s.a * (0.8 + 0.2 * Math.sin(frame * 0.09 + s.ph * 2));
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            left: s.x + sway - s.w / 2,
            top: CUT_Y,
            width: s.w,
            height: 620,
            transformOrigin: "50% 0%",
            transform: `skewX(${s.sk}deg)`,
            background: `linear-gradient(to bottom, rgba(232,226,214,${a}) 0%, rgba(232,226,214,${a * 0.45}) 18%, rgba(232,226,214,${a * 0.12}) 40%, rgba(232,226,214,0) 100%)`,
            filter: "blur(16px)",
          }}
        />
      );
    })}
  </>
);

/** One band of swell on the lit sea: a stretched noise field mapped to soft light crests (or dark troughs), drifting
 * slowly sideways. Finer and flatter toward the horizon (perspective) by stacking bands of rising frequency. */
const Swell: React.FC<{ id: string; top: number; h: number; fx: number; fy: number; light: boolean; amount: number; drift: number; frame: number; feather: number }> = ({
  id,
  top,
  h,
  fx,
  fy,
  light,
  amount,
  drift,
  frame,
  feather,
}) => {
  const fid = `edn-swell-${id}`;
  // alpha = gain * noise + bias: only the crests (or the troughs) of the noise show
  const gain = 5 * amount;
  const bias = light ? -2.9 * amount : 2.1 * amount;
  const g = light ? gain : -gain;
  const tone = light ? "0.96 0.95 0.92" : "0.12 0.115 0.11";
  const [r, gg, b] = tone.split(" ");
  const fade = `linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,1) ${feather}px, rgba(0,0,0,1) ${h - feather}px, rgba(0,0,0,0) ${h}px)`;
  return (
    <svg
      width={SEA_W}
      height={h}
      style={{ position: "absolute", left: 0, top, overflow: "hidden", WebkitMaskImage: fade, maskImage: fade }}
      aria-hidden
    >
      <defs>
        <filter id={fid} x={-300} y={0} width={SEA_W + 600} height={h} colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
          <feTurbulence type="fractalNoise" baseFrequency={`${fx} ${fy}`} numOctaves={3} seed={id.length * 13} />
          <feColorMatrix type="matrix" values={`0 0 0 0 ${r} 0 0 0 0 ${gg} 0 0 0 0 ${b} ${g} 0 0 0 ${bias}`} />
        </filter>
      </defs>
      <g transform={`translate(${-drift * frame} 0)`}>
        <rect x={-300} y={0} width={SEA_W + 600} height={h} filter={`url(#${fid})`} />
      </g>
    </svg>
  );
};

/** The lit sea, horizon down past the near water line: the sky's own reflection (the cleaned plate flipped about the
 * horizon and squashed), brightest in a glint band at the horizon, darker toward us, with drifting swell. */
const SeaSurface: React.FC<{ frame: number }> = ({ frame }) => (
  <div style={{ position: "absolute", left: SEA_X, top: HORIZON_Y, width: SEA_W, height: WATER_H, overflow: "hidden", backgroundColor: "#77736b" }}>
    <Img
      src={staticFile(SEA)}
      style={{
        position: "absolute",
        left: 0,
        top: -SEA_HZ * SEA_S,
        width: SEA_W,
        height: 1400 * SEA_S,
        maxWidth: "none",
        transformOrigin: `50% ${SEA_HZ * SEA_S}px`,
        transform: `scaleY(${-REFL_SQ})`,
        filter: `${ARCHIVE_FILTER} contrast(0.78) brightness(0.86) blur(1.4px)`,
      }}
    />
    {/* toward us the water reflects less sky: it darkens */}
    <div
      style={{
        ...full,
        background: "linear-gradient(to bottom, rgba(24,23,21,0) 0px, rgba(24,23,21,0.1) 70px, rgba(24,23,21,0.3) 190px, rgba(24,23,21,0.42) 300px, rgba(24,23,21,0.46) 100%)",
      }}
    />
    <Swell id="far" top={0} h={80} fx={0.01} fy={0.32} light amount={0.5} drift={0.12} frame={frame} feather={6} />
    <Swell id="mid" top={50} h={130} fx={0.006} fy={0.12} light amount={0.42} drift={0.2} frame={frame} feather={30} />
    <Swell id="near" top={150} h={190} fx={0.0035} fy={0.05} light amount={0.36} drift={0.3} frame={frame} feather={40} />
    <Swell id="trough" top={60} h={300} fx={0.004} fy={0.07} light={false} amount={0.3} drift={0.24} frame={frame} feather={40} />
    {/* the glint: the bright sky lying on the far water */}
    <div
      style={{
        ...full,
        background: "linear-gradient(to bottom, rgba(246,243,236,0.7) 0px, rgba(246,243,236,0.45) 6px, rgba(240,236,228,0.18) 26px, rgba(240,236,228,0) 60px)",
      }}
    />
  </div>
);

/** The near water line seen from below: a soft, brighter underside of the surface, and its rippled edge. */
const Underside: React.FC<{ frame: number }> = ({ frame }) => {
  const pts: string[] = [];
  for (let i = 0; i <= SURF_PTS; i++) {
    const x = -400 + ((W + 800) * i) / SURF_PTS;
    pts.push(`${x.toFixed(1)},${surfaceY(x, frame).toFixed(2)}`);
  }
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke="rgb(214,210,201)" strokeOpacity={0.55} strokeWidth={5} style={{ filter: "blur(2.5px)" }} />
      <polyline points={pts.join(" ")} fill="none" stroke="rgb(236,232,224)" strokeOpacity={0.5} strokeWidth={1.4} style={{ filter: "blur(0.6px)" }} />
    </svg>
  );
};

const EveryDomainInNumbers: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const c = camAt(frame);
  const cam: ArchiveCam = { x: c.x, y: c.y, k: c.k };

  const ship: Pose = { x: shipX(frame), y: SHIP_WL, w: SHIP_LEN };
  const sub: Pose = { x: subX(frame), y: SUB_Y, w: SUB_LEN };
  const rocket: Pose = { x: ROCKET_X, y: rocketY(frame), w: rocketW(ROCKET_LEN) };

  const skyMask = `linear-gradient(to bottom, rgba(0,0,0,0) ${20 - SEA_Y}px, rgba(0,0,0,1) ${165 - SEA_Y}px)`;

  return (
    <AbsoluteFill style={{ backgroundColor: "#141311" }}>
      <FloodDefs />
      <FilmLife frame={frame}>
        {/* SPACE: the star field above the sky */}
        <ArchiveCamera cam={cam} d={D_SKY}>
          <Plate src={SPACE} x={-210} y={-150} w={1500} h={330} objectPosition="50% 0%" />
        </ArchiveCamera>

        {/* SEA PLANE: the sky part of the sea plate (fading up into space), the rockets, then the water in front of them */}
        <ArchiveCamera cam={cam} d={D_SEA}>
          <div style={{ position: "absolute", left: SEA_X, top: SEA_Y, width: SEA_W, height: HORIZON_Y - SEA_Y, overflow: "hidden", WebkitMaskImage: skyMask, maskImage: skyMask }}>
            <Plate src={SEA} x={0} y={0} w={SEA_W} h={1400 * SEA_S} />
          </div>
          <Run kind="rocket" slots={ROCKET_SLOTS} frame={frame} lead={rocket} yAt={(s) => (p) => lerp(rocket.y, rocketSlotY(rocket.y, s.s), p)} />
          <SeaSurface frame={frame} />
        </ArchiveCamera>

        {/* NEAR: the ships on the surface */}
        <ArchiveCamera cam={cam} d={D_NEAR}>
          <Run kind="ship" slots={SHIP_SLOTS} frame={frame} lead={ship} />
        </ArchiveCamera>

        {/* NEAR: the deep, cut along the moving surface line */}
        <ArchiveCamera cam={cam} d={D_NEAR}>
          <div style={{ position: "absolute", left: -400, top: 0, width: W + 800, height: H + 900, clipPath: surfacePolygon(frame) }}>
            <div style={{ position: "absolute", left: 400, top: 0 }}>
              <Plate src={DEEP} x={DEEP_X} y={DEEP_Y} w={DEEP_W} h={2600 * DEEP_S} />
              <div
                style={{
                  position: "absolute",
                  left: -400,
                  top: CUT_Y - 10,
                  width: W + 800,
                  height: H - CUT_Y + 900,
                  background: `linear-gradient(to bottom, rgba(10,9,8,0.18) 0px, rgba(10,9,8,0.52) 110px, rgba(10,9,8,0.56) 480px, rgba(10,9,8,0.3) 760px, rgba(10,9,8,0.18) 100%)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: -400,
                  top: CUT_Y - 8,
                  width: W + 800,
                  height: 90,
                  background: "linear-gradient(to bottom, rgba(214,209,200,0.42) 0px, rgba(214,209,200,0.2) 18px, rgba(214,209,200,0.06) 50px, rgba(214,209,200,0) 90px)",
                }}
              />
              <Shafts frame={frame} />
              <DustMotes frame={frame} x={-200} y={CUT_Y + 40} w={W + 400} h={H - CUT_Y + 300} count={70} size={2.2} light={0.3} seed="deep" />
              <Run kind="sub" slots={SUB_SLOTS} frame={frame} lead={sub} />
            </div>
          </div>
          <Underside frame={frame} />
        </ArchiveCamera>
      </FilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default EveryDomainInNumbers;
