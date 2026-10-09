import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BEAD_RATIO,
  Bead,
  CUTLINE_BAND,
  FRAME_H,
  FRAME_W,
  PHOTO_BORDER,
  PICTOS,
  Pictogram,
  RED,
  RED_HI,
  RED_WET,
  RedGroup,
  Rule,
  VStage,
  VintagePhoto,
  WET_DRY_F,
  WET_LEN,
  WetLine,
  clamp01,
  lerp,
  mixHex,
  paperShadow,
  redW,
  runVCamera,
  shootEase,
  smoothstep,
} from "./chinatalkVintage";
import type { Cam, Pt, VCamKey } from "./chinatalkVintage";

// ---------------------------------------------------------------------------
// TechnologyAllocates (take 2, rebuilt from scratch) — cut C of Logan Wright,
// "Brezhnev chose decay" (ChinaTalk, newsprint kit chinatalkVintage).
//
// CHECK LINE: the Soviet planners' bet: one big computer in the middle hands
// the economy's resources to every sector, and every sector is supplied.
//
// LINE: "So we're going to be able to use technology to allocate resources
// effectively." (the Soviet planners, 1960s)
// IN = edit frame 597 (24.875 s). Slot 84 f + 12 f living tail = 96 f, 24 fps,
// 1080x1920, opaque. Local words: technology 26-38 · allocate 43-51 ·
// resources 51-66 · effectively 66-79.
//
// RED = resources. Nothing else is red.
//
// THE PICTURE: a newspaper figure. A halftone clipping of the real machine (a
// BESM-6, the flagship Soviet mainframe of the 1960s; photo Victor R. Ruiz,
// CC BY 2.0, Science Museum London) lies across the middle of the page; six
// solid pictograms of the economy's sectors stand around it (industry, energy,
// space above; farming, housing, transport below the caption strip).
//
// THE MOTION (one continuous flood): six red ink feeds come out from UNDER the
// clipping, each written by its bead (shootEase: out fast, slowing toward its
// pictogram), while the camera pulls back from the clipping (k 1.14 at f0,
// the whole clipping and all six sectors in frame) to the wide framing
// (k 0.975 at f44). On the frame a bead touches a silhouette (clockwise:
// industry f26, energy f32, space f38, transport f44, housing f50, farming
// f56) the bead drains into it and the red soaks through the shape from the
// point of contact (16 f, a clean ink front, wet just behind it), then one
// soft highlight crosses the printed shape. One highlight leaves the machine
// along all six feeds at f38 and is taken up by the last sector at f84. The
// last sector is full at f72, inside "effectively"; the tail is only the slow
// drift in (k 1.02 at f95) and drying ink.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const SLOT = 84;
export const TAIL = 12;
export const DURATION = SLOT + TAIL;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the page (world px; the wide framing shows the world about 1:1) ----------
/** the PICTURE window of the clipping */
const PHOTO = { x: 90, y: 580, w: 900, h: 420 };
const PHOTO_SRC = "brezhnev/besm6.jpg";
const PHOTO_FOCUS = { x: 0.5, y: 0.585 };
const PHOTO_ZOOM = 1.05;
const CUTLINE = "BESM-6, the Soviet mainframe of the 1960s";
/** the clipping's outer edges (its paper margin and the cutline band included) */
export const CLIP = {
  x0: PHOTO.x - PHOTO_BORDER,
  y0: PHOTO.y - PHOTO_BORDER,
  x1: PHOTO.x + PHOTO.w + PHOTO_BORDER,
  y1: PHOTO.y + PHOTO.h + PHOTO_BORDER + CUTLINE_BAND,
};
/** every feed starts at the machine, under the clipping */
const SOURCE_Y = PHOTO.y + PHOTO.h / 2;
/** a pictogram's 256 box, world px */
const PICTO = 246;
const SC = PICTO / 256;
const COLS = [190, 540, 890];
const ROW_UP = 290;
const ROW_DOWN = 1550;
/** an unsupplied sector: a solid shape in a light ink tint */
const WAITING = 0.14;
/** page furniture: one double rule over the figure, one hair rule under it */
const RULE_TOP_Y = 94;
const RULE_BOTTOM_Y = 1820;

// --- the camera: in close on the whole clipping (cutline and all six sectors in
// frame), one eased pull-back to the wide framing, then a slow drift in
const CAM_KEYS: VCamKey[] = [
  { f: -24, x: 540, y: 969, k: 1.19 },
  { f: 41, x: 540, y: 962, k: 0.972 },
  { f: DURATION - 1, x: 540, y: 960, k: 1.022, ease: "linear" },
];
export const camAt = runVCamera(CAM_KEYS, DURATION);

// --- the six sectors, clockwise from the upper left ---------------------------
/** the lightning bolt is stood on its tip: both of its tips on the feed's axis */
const BOLT_TILT = -(Math.atan2(64, 224) * 180) / Math.PI;
/** centre of the bolt's box -> the centre of a tip's rounding, box units */
const BOLT_HALF = Math.hypot(32, 112);
type SectorDef = {
  id: string;
  d: string;
  x: number;
  y: number;
  rotate: number;
  /** box y where the feed's axis meets the silhouette's edge */
  touch: number;
  /** box y where the feed's round end comes to rest, inside the silhouette */
  seat: number;
  /** the silhouette's farthest point from the touch point, box units */
  far: number;
  /** the frame the bead touches the silhouette */
  contact: number;
  /** how far the feed's tip is already out from under the clipping on frame 0, world px */
  out0: number;
  /** phases of the soaking front's irregular edge */
  ph: [number, number, number];
};
const DEFS: SectorDef[] = [
  { id: "industry", d: PICTOS.factory, x: COLS[0], y: ROW_UP, rotate: 0, touch: 224, seat: 216, far: 218, contact: 26, out0: 26, ph: [0.4, 2.1, 4.4] },
  {
    id: "energy",
    d: PICTOS.lightning,
    x: COLS[1],
    y: ROW_UP,
    rotate: BOLT_TILT,
    touch: 128 + BOLT_HALF + 8,
    seat: 128 + BOLT_HALF,
    far: 249,
    contact: 32,
    out0: 14,
    ph: [1.7, 0.3, 2.9],
  },
  { id: "space", d: PICTOS.rocket, x: COLS[2], y: ROW_UP, rotate: 0, touch: 232, seat: 224, far: 224, contact: 38, out0: 6, ph: [3.1, 5.2, 0.8] },
  { id: "transport", d: PICTOS.train, x: COLS[2], y: ROW_DOWN, rotate: 0, touch: 24, seat: 33, far: 233, contact: 44, out0: 66, ph: [5.0, 1.2, 3.6] },
  { id: "housing", d: PICTOS.buildings, x: COLS[1], y: ROW_DOWN, rotate: 0, touch: 16, seat: 25, far: 241, contact: 50, out0: 46, ph: [2.4, 4.0, 1.5] },
  { id: "farming", d: PICTOS.tractor, x: COLS[0], y: ROW_DOWN, rotate: 0, touch: 40, seat: 48, far: 207, contact: 56, out0: 28, ph: [0.9, 3.3, 5.6] },
];

// --- the flood ------------------------------------------------------------------
/** frames for the red to soak through one silhouette */
const FLOOD_F = 16;
/** the first seep shows on the touch frame itself */
const FLOOD_LEAD = 0.5;
/** the soaking front is a clean ink edge with a narrow feather: a gaussian sigma (world px), an edge about 8 px wide */
const FEATHER = 2.2;
/** the front's slightly irregular edge: harmonics of the angle and their amplitudes as fractions of the radius */
const WOBBLE_N = [2, 3, 5, 9];
const WOBBLE = [0.02, 0.02, 0.012, 0.006];
const WOBBLE_MAX = WOBBLE.reduce((a, b) => a + b, 0);
/** ink soaking into paper: fastest at the touch, slowing as it spreads */
const SOAK_P = 1.6;
const soak = (u: number) => 1 - Math.pow(1 - clamp01(u), SOAK_P);
const soakInv = (e: number) => 1 - Math.pow(1 - clamp01(e), 1 / SOAK_P);
/** the printed highlight that crosses a sector once it is full */
const SWEEP_F = 10;
const SWEEP_BAND = 64;
const SWEEP_TILT = (-22 * Math.PI) / 180;
/** one highlight leaves the machine along all six feeds at constant speed and is taken up by the last sector on PULSE_END */
const PULSE_START = 38;
const PULSE_END = 84;
const PULSE_LEN = 80;

/** frames from the touch until the feed's tip is seated inside its silhouette */
const SEAT_F = 10;
/** the feeds' ease is laid over this multiple of their length: the short upper
 *  feeds use all of it (out fast from frame 0, easing into the landing), the
 *  long lower feeds settle a little past their seat (they touch at about 4 px per frame) */
const RUN_ON_UP = 1;
const RUN_ON_DOWN = 1.06;

const invOf = (ease: (u: number) => number) => (e: number) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 34; i++) {
    const mid = (lo + hi) / 2;
    if (ease(mid) < e) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};
const shootInv = invOf(shootEase);

export type Sector = SectorDef & {
  dir: -1 | 1;
  touchY: number;
  seatY: number;
  /** the feed's whole run, source -> seat, world px */
  L: number;
  /** the feed's run under the clipping */
  hidden: number;
  /** the bead's radius on the contact frame */
  beadC: number;
  /** the tip's run when the bead's front edge reaches the silhouette */
  sTouch: number;
  t0: number;
  T: number;
  /** the run the launch-then-settle ease is laid over (it would settle a little past the seat) */
  run: number;
  /** the tip's speed on the contact frame, world px per frame */
  vTouch: number;
  /** the soaking front's final radius */
  rEnd: number;
  transform: string;
};
const buildSector = (def: SectorDef): Sector => {
  const dir: -1 | 1 = def.y < SOURCE_Y ? -1 : 1;
  const touchY = def.y + (def.touch - 128) * SC;
  const seatY = def.y + (def.seat - 128) * SC;
  const edgeY = dir < 0 ? CLIP.y0 : CLIP.y1;
  const L = Math.abs(seatY - SOURCE_Y);
  const hidden = Math.abs(edgeY - SOURCE_Y);
  const beadC = BEAD_RATIO * redW(camAt(def.contact).k);
  const sTouch = Math.abs(touchY - SOURCE_Y) - beadC;
  // shootEase over the feed's run (times RUN_ON): the launch happens under the
  // clipping, so what shows is a tip that comes out fast and slows toward its
  // pictogram, still moving when it touches
  const run = L * (dir < 0 ? RUN_ON_UP : RUN_ON_DOWN);
  const u0 = shootInv((hidden + def.out0) / run);
  const uc = shootInv(sTouch / run);
  const T = def.contact / (uc - u0);
  return {
    ...def,
    dir,
    touchY,
    seatY,
    L,
    hidden,
    beadC,
    sTouch,
    t0: -u0 * T,
    T,
    run,
    vTouch: (run / T) * 12 * uc * Math.pow(1 - uc, 2),
    rEnd: (def.far * SC + 3 * FEATHER + 2) / (1 - WOBBLE_MAX),
    transform: `translate(${def.x} ${def.y})${def.rotate ? ` rotate(${def.rotate.toFixed(4)})` : ""} scale(${SC.toFixed(5)}) translate(-128 -128)`,
  };
};
export const SECTORS: Sector[] = DEFS.map(buildSector);
/** a feed's run from the clipping's edge to its silhouette */
const openRun = (s: Sector) => s.sTouch + s.beadC - s.hidden;
/** the highlight's constant speed, world px per frame: its tail enters the farthest silhouette on PULSE_END */
export const PULSE_SPEED = (Math.max(...SECTORS.map(openRun)) + PULSE_LEN) / (PULSE_END - PULSE_START);

/** After the touch the paper draws the ink in: the tip runs on from its touch
 *  speed into its seat inside the silhouette and stops there (a cubic that
 *  leaves at the touch speed and arrives at rest), SEAT_F frames. */
const seatRun = (s: Sector, tau: number) => {
  const x = clamp01(tau);
  const m0 = s.vTouch * SEAT_F;
  return (2 * x * x * x - 3 * x * x + 1) * s.sTouch + (x * x * x - 2 * x * x + x) * m0 + (-2 * x * x * x + 3 * x * x) * s.L;
};
/** the feed's drawn length at S, world px of its run from the source */
export const feedLen = (s: Sector, S: number) => (S <= s.contact ? s.run * shootEase((S - s.t0) / s.T) : seatRun(s, (S - s.contact) / SEAT_F));
/** the frame at which the feed's tip passed run length `at` (what was drawn
 *  after the touch counts as drawn at the touch: the whole feed dries together) */
const feedTimeAt = (s: Sector, at: number) => Math.min(s.contact, s.t0 + s.T * shootInv(at / s.run));

const blobD = (cx: number, cy: number, r: number, ph: [number, number, number]) => {
  const n = 160;
  const phase = [ph[0], ph[1], ph[2], ph[0] + ph[1]];
  const parts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let w = 1;
    for (let j = 0; j < WOBBLE.length; j++) w += WOBBLE[j] * Math.sin(WOBBLE_N[j] * a + phase[j]);
    parts.push(`${i ? "L" : "M"}${(cx + r * w * Math.cos(a)).toFixed(2)} ${(cy + r * w * Math.sin(a)).toFixed(2)}`);
  }
  return parts.join("") + "Z";
};

const ID = "ta";
const WET_STOPS = 18;

/** One feed: the wet line from the machine, and the highlight that later travels out along it. */
const Feed: React.FC<{ s: Sector; S: number; k: number }> = ({ s, S, k }) => {
  const len = feedLen(s, S);
  const pts: Pt[] = [
    { x: s.x, y: SOURCE_Y },
    { x: s.x, y: s.seatY },
  ];
  const pulseHead = s.hidden + (S - PULSE_START) * PULSE_SPEED;
  const p0 = Math.max(s.hidden - 4, pulseHead - PULSE_LEN);
  const p1 = Math.min(len, pulseHead);
  const y = (run: number) => SOURCE_Y + s.dir * run;
  return (
    <g>
      <WetLine id={`${ID}-${s.id}-feed`} points={pts} len={len} k={k} ageAt={(at) => S - feedTimeAt(s, at)} shadow={false} />
      {p1 - p0 > 0.5 ? (
        <>
          <defs>
            <linearGradient
              id={`${ID}-${s.id}-pulse`}
              gradientUnits="userSpaceOnUse"
              x1={s.x}
              y1={y(pulseHead - PULSE_LEN).toFixed(2)}
              x2={s.x}
              y2={y(pulseHead).toFixed(2)}
            >
              <stop offset={0} stopColor={RED_HI} stopOpacity={0} />
              <stop offset={0.3} stopColor={RED_HI} stopOpacity={0.36} />
              <stop offset={0.58} stopColor={RED_HI} stopOpacity={0.72} />
              <stop offset={0.84} stopColor={RED_HI} stopOpacity={0.36} />
              <stop offset={1} stopColor={RED_HI} stopOpacity={0} />
            </linearGradient>
          </defs>
          <rect
            x={(s.x - redW(k) / 2).toFixed(3)}
            y={Math.min(y(p0), y(p1)).toFixed(2)}
            width={redW(k).toFixed(3)}
            height={(p1 - p0).toFixed(2)}
            fill={`url(#${ID}-${s.id}-pulse)`}
          />
        </>
      ) : null}
    </g>
  );
};

/** The bead that writes a feed. On the touch frame its front edge meets the
 *  silhouette; from there it drains into the shape as the tip runs on to its seat. */
const FeedBead: React.FC<{ s: Sector; S: number; k: number }> = ({ s, S, k }) => {
  const len = feedLen(s, S);
  const w = redW(k);
  const full = BEAD_RATIO * w;
  const drain = S < s.contact ? 0 : clamp01((len - s.sTouch) / s.beadC);
  if (drain >= 1) return null;
  const r = lerp(full, w / 2, drain);
  const y = SOURCE_Y + s.dir * len;
  return (
    <g>
      {drain > 0 ? <circle cx={s.x} cy={y.toFixed(3)} r={r.toFixed(3)} fill={RED} /> : null}
      <Bead id={`${ID}-${s.id}-bead`} x={s.x} y={y} k={k} r={r} opacity={1 - smoothstep(drain)} />
    </g>
  );
};

/** the square that holds a pictogram with room for its shadow */
const HALF = PICTO * 0.7;
/** Per sector, always there: the silhouette as a clip, and a mask of everything OUTSIDE it. */
const SectorDefs: React.FC<{ s: Sector }> = ({ s }) => (
  <defs>
    <clipPath id={`${ID}-${s.id}-shape`}>
      <path d={s.d} transform={s.transform} />
    </clipPath>
    <mask id={`${ID}-${s.id}-outside`} maskUnits="userSpaceOnUse" x={s.x - HALF} y={s.y - HALF} width={2 * HALF} height={2 * HALF}>
      <rect x={s.x - HALF} y={s.y - HALF} width={2 * HALF} height={2 * HALF} fill="#FFFFFF" />
      <path d={s.d} transform={s.transform} fill="#000000" />
    </mask>
  </defs>
);

/** The soaked part of a silhouette at S: a clean, slightly irregular ink front
 *  with a narrow feather that grows from the point of contact, clipped to the
 *  shape (so its knocked-out details stay paper and nothing spills outside). */
const Soaked: React.FC<{ s: Sector; S: number; fill: string }> = ({ s, S, fill }) => {
  const u = (S - s.contact + FLOOD_LEAD) / FLOOD_F;
  if (u <= 0) return null;
  return (
    <g clipPath={`url(#${ID}-${s.id}-shape)`}>
      {u < 1 ? (
        <path d={blobD(s.x, s.touchY, s.rEnd * soak(u), s.ph)} fill={fill} style={{ filter: `blur(${FEATHER}px)` }} />
      ) : (
        <rect x={s.x - HALF} y={s.y - HALF} width={2 * HALF} height={2 * HALF} fill={fill} />
      )}
    </g>
  );
};

/** The paper shadow of the red in one sector. It is the shadow of the soaked
 *  part only where it falls OUTSIDE the silhouette: ink soaking through paper
 *  casts no shadow at its own front. */
const FloodShadow: React.FC<{ s: Sector; S: number; k: number }> = ({ s, S, k }) => {
  if (S - s.contact + FLOOD_LEAD <= 0) return null;
  return (
    <g mask={`url(#${ID}-${s.id}-outside)`}>
      <g style={{ filter: paperShadow(k) }}>
        <Soaked s={s} S={S} fill={RED} />
      </g>
    </g>
  );
};

/** The red in one sector: it soaks through the silhouette from the point of
 *  contact; the band just behind the front is wet (RED_WET) and dries to RED;
 *  then one soft highlight crosses the printed shape. */
const Flood: React.FC<{ s: Sector; S: number }> = ({ s, S }) => {
  const t = S - s.contact + FLOOD_LEAD;
  if (t <= 0) return null;
  const r = s.rEnd * soak(t / FLOOD_F);
  const wetOn = t < FLOOD_F + WET_DRY_F;
  const stops: React.ReactNode[] = [];
  if (wetOn) {
    for (let i = 0; i <= WET_STOPS; i++) {
      const frac = i / WET_STOPS;
      // wet where the front has just passed: by age (it dries over WET_DRY_F) and by distance behind the front (WET_LEN)
      const age = Math.max(0, t - FLOOD_F * soakInv(frac));
      const behind = Math.max(0, r - frac * s.rEnd);
      const wet = (1 - smoothstep(age / WET_DRY_F)) * (1 - smoothstep(behind / WET_LEN));
      stops.push(<stop key={i} offset={frac.toFixed(4)} stopColor={mixHex(RED, RED_WET, wet)} />);
    }
  }
  const sw = (t - FLOOD_F + 2) / SWEEP_F;
  const sweepOn = sw > 0 && sw < 1;
  const span = PICTO * 0.62 + SWEEP_BAND;
  const sx = s.x - span + 2 * span * sw;
  const ux = Math.cos(SWEEP_TILT);
  const uy = Math.sin(SWEEP_TILT);
  return (
    <g>
      <defs>
        {wetOn ? (
          <radialGradient id={`${ID}-${s.id}-wet`} gradientUnits="userSpaceOnUse" cx={s.x} cy={s.touchY.toFixed(2)} r={s.rEnd.toFixed(2)}>
            {stops}
          </radialGradient>
        ) : null}
        {sweepOn ? (
          <linearGradient
            id={`${ID}-${s.id}-sweep`}
            gradientUnits="userSpaceOnUse"
            x1={(sx - SWEEP_BAND * ux).toFixed(2)}
            y1={(s.y - SWEEP_BAND * uy).toFixed(2)}
            x2={(sx + SWEEP_BAND * ux).toFixed(2)}
            y2={(s.y + SWEEP_BAND * uy).toFixed(2)}
          >
            <stop offset={0} stopColor={RED_HI} stopOpacity={0} />
            <stop offset={0.5} stopColor={RED_HI} stopOpacity={0.8} />
            <stop offset={1} stopColor={RED_HI} stopOpacity={0} />
          </linearGradient>
        ) : null}
      </defs>
      <Soaked s={s} S={S} fill={wetOn ? `url(#${ID}-${s.id}-wet)` : RED} />
      {sweepOn ? (
        <g clipPath={`url(#${ID}-${s.id}-shape)`}>
          <rect x={s.x - HALF} y={s.y - HALF} width={2 * HALF} height={2 * HALF} fill={`url(#${ID}-${s.id}-sweep)`} />
        </g>
      ) : null}
    </g>
  );
};

/** Everything that lies UNDER the clipping: the waiting silhouettes, the feeds
 *  (with their beads) and, over them, the red soaking into each sector. It is drawn in the stage's photo layer, before the photograph,
 *  so the clipping really covers where the feeds come from (and its contact
 *  shadow falls on them). World px, same camera as the drawing. */
const UnderClipping: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  const k = cam.k;
  return (
    <svg
      width={FRAME_W}
      height={FRAME_H}
      viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {SECTORS.map((s) => (
        <SectorDefs key={s.id} s={s} />
      ))}
      {SECTORS.map((s) => (
        <Pictogram key={s.id} d={s.d} x={s.x} y={s.y} size={PICTO} rotate={s.rotate} rung={WAITING} />
      ))}
      {SECTORS.map((s) => (
        <FloodShadow key={s.id} s={s} S={S} k={k} />
      ))}
      <RedGroup k={k}>
        {SECTORS.map((s) => (
          <Feed key={s.id} s={s} S={S} k={k} />
        ))}
        {SECTORS.map((s) => (
          <FeedBead key={s.id} s={s} S={S} k={k} />
        ))}
      </RedGroup>
      {SECTORS.map((s) => (
        <Flood key={s.id} s={s} S={S} />
      ))}
    </svg>
  );
};

const TechnologyAllocates: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  return (
    <VStage
      S={S}
      cam={cam}
      photos={
        <>
          <UnderClipping S={S} cam={cam} />
          <VintagePhoto src={PHOTO_SRC} box={PHOTO} focus={PHOTO_FOCUS} zoom={PHOTO_ZOOM} cutline={CUTLINE} />
        </>
      }
    >
      <Rule from={{ x: CLIP.x0, y: RULE_TOP_Y }} to={{ x: CLIP.x1, y: RULE_TOP_Y }} k={k} kind="double" />
      <Rule from={{ x: CLIP.x0, y: RULE_BOTTOM_Y }} to={{ x: CLIP.x1, y: RULE_BOTTOM_Y }} k={k} kind="hair" />
    </VStage>
  );
};

export default TechnologyAllocates;
