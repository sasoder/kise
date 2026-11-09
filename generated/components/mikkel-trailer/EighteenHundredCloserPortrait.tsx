// PORTRAIT ADAPTATION: 1080x1920; same 110 frames and relative orbital distance.
// Earth low and satellite high on an ascending diagonal. Retain original photos and 1800x crown.
// Caption clearance follows this project's actual caption position near y=1410.
// ---------------------------------------------------------------------------
// EighteenHundredCloserPortrait (mikkel-trailer, cut 12). Core Memory podcast style, the ARCHIVE COLLAGE at 16:9 (the Pushp /
// Airbound trailer look, on ./mikkelShared over ../neal-stephenson-trailer/nealShared). Opaque 2048x1080, 23.976 fps,
// 110 frames; finals --scale 2 (4096x2160).
//
// CHECK LINE: Sceye's airship floats right on the surface of the planet while a geostationary satellite sits enormously
// far out: the airship is ~1,800 times closer.
//
// THE LINE: "But we're 1,800 times closer to the surface of the planet than a geosatellite."
// WORD -> FRAME: we're 2 · 1,800 8 (to ~22) · times 27 · closer 38 · to 52 · the 58 · surface 61 · of 68 · the 73 ·
//   planet 74 · than 80 · a 85 · geosatellite 88 · speech ends ~103 · cut back to the speaker at f110.
// DURATION: the slot 12.095417 -> 16.683333 s = 4.588 s x 23.976 = 110 frames (f0..f109).
//
// THE MOTION: one continuous pull-back of the photo world (log-scale zoom on a smoothed key track: creeping from f0,
// accelerating from "times", settling by "geosatellite"). Close on the airship, under way above the curved limb (the ISS
// limb print, warped onto the planet's rim); the airship shrinks toward the limb as the limb curves round into the whole
// planet and the camera rolls a quarter turn, so the airship ends as a white airship silhouette on its hard shadow
// (never under 136 px long: hull and tail fins read at phone size), nose UP along the tangent, touching the planet's rim
// at 3 o'clock, its back to the satellite. The resolved frame sits on the frame's middle: the Earth (radius
// ~222, whole, left) - airship - dashed line - satellite axis at y 510, the 1,800x centred over the line above it. The
// pull-back opens the frame onto the geostationary satellite from the right edge (~f68), its body at its true distance
// (6.62 Earth radii from the centre), landing on "geosatellite"; a white dashed line is drawn from the airship marker
// out to the satellite's near wing tip (f80-92). Settled, living frame from f92: a slow creep, the satellite drifting.
// "1,800x" rises from behind the airship's hull in the chain sting (orange from f0, the core landing by ~f12) on the paper
// plane (it does not zoom with the photo world; the paper pans with the pull-back so it lands over the line) and keeps its
// crown to the last frame.
// CHAIN = Sceye's advantage (mikkelShared legend): here the 1,800x.
//
// SOURCES: GEO altitude 35,786 km, Earth's mean radius 6,371 km -> orbit radius 42,157 km = 6.62 Earth radii; Sceye
// flies at about 20 km (65,000 ft): 35,786 / 20 = 1,789 = ~1,800 (the speaker's number holds). Limb print: NASA,
// "Cloudscape Over the Philippine Sea" (Wikimedia Commons, public domain), warped by
// scripts/clips/mikkel-trailer/bake-limb.py. Whole Earth: NASA / Apollo 17, "The Blue Marble" (remastered, Wikimedia
// Commons, public domain; bake-photos.py earth). Airship: the Sceye HAPS from the IEEE Spectrum lead photo on the clip's
// news card (SoftBank), keyed and edge-rebuilt by bake-airship.py. Satellite: Wideband Global SATCOM (WGS), U.S.
// Strategic Command, public domain (Wikimedia Commons "Wideband_Global_SATCOM.png"; animation_source/assets/geo_sat_01.jpg,
// SOURCES.txt there), keyed off its white by bake-satellite.py.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { BLUE, CutOut, INK, ORANGE, PURPLE, SHADOW, Silhouette, clamp, type as typeStyle } from "../neal-stephenson-trailer/nealShared";
import { CaptionBands, H, MIKKEL_FILTER, MikkelFilmLife, MikkelPaper, W } from "./mikkelPortraitShared";

export const FPS = 24000 / 1001;
export const DURATION = 110;
export const schema = z.object({ bands: z.boolean().default(false) });
export const defaultProps = schema.parse({});

// -- assets ------------------------------------------------------------------------------------------------------------
/** The full-disc Earth: a square PNG, the disc centred, radius `r` px of `size`. */
const EARTH = { src: "mikkel-trailer/earth_disc.png", size: 2690, r: 1340.7 };
/** The airship, side-on, nose LEFT in the PNG and drawn as is (it flies nose-left, so after the roll its nose points up the rim); `belly` = how far below the image
 *  centre its lowest point sits, of the height. */
const AIRSHIP = { src: "mikkel-trailer/sceye_airship.png", w: 2016, h: 795, belly: 0.5 };
/** The satellite (bake-satellite.py), wings level in the image, the longer wing left; the body's centre and the left
 *  wing's tip as fractions of the image. */
const SAT = { src: "mikkel-trailer/geo_sat.png", w: 1800, h: 251, bodyX: 0.5289, bodyY: 0.5159, tipY: 0.4183 };
/** The limb print (bake-limb.py): an annular sector, 1:1 at rim radius R_PX, the arc centre at (w/2, R_PX + PAD). */
const LIMB = { src: "mikkel-trailer/limb_band.png", w: 3425, h: 1024, R: 4200, pad: 4 };

// -- tracks: coarse keys, linearly interpolated, box-smoothed per frame at module load (deterministic) ----------------
const PRE = 40;
const POST = 40;
const track = (keys: [number, number][], win: number) => {
  const F = keys.map((k) => k[0]);
  const V = keys.map((k) => k[1]);
  const raw: number[] = [];
  for (let f = -PRE - win; f <= DURATION + POST + win; f++) raw.push(interpolate(f, F, V, clamp));
  const out: number[] = [];
  for (let f = -PRE; f <= DURATION + POST; f++) {
    let s = 0;
    for (let i = -win; i <= win; i++) s += raw[f + PRE + win + i];
    out.push(s / (2 * win + 1));
  }
  return (f: number) => {
    const c = Math.max(-PRE, Math.min(DURATION + POST, f)) + PRE;
    const a = Math.floor(c);
    const b = Math.min(a + 1, out.length - 1);
    return out[a] + (out[b] - out[a]) * (c - a);
  };
};

// -- the world, in screen px -------------------------------------------------------------------------------------------
/** Earth's radius on screen at f0 and at the resolved frame. */
const RS0 = LIMB.R;
const R_END = 140; // the largest Earth that keeps the disc whole (left edge ~36) and the satellite inside x 1900
const U_END = Math.log(RS0 / R_END);
/** GEO orbit radius in Earth radii: (6,371 + 35,786) / 6,371. */
const GEO = 42157 / 6371;
/** u = ln(RS0 / Rs): the log of the pull-back. Creeping at f0, accelerating from "times" (27), settled by ~f88. */
const U = track(
  [
    [-40, -0.2],
    [0, 0],
    [24, 0.15],
    [38, 0.6],
    [50, 1.45],
    [60, 2.15],
    [68, 2.62],
    [78, 2.93],
    [85, U_END],
    [109, U_END + 0.028],
    [150, U_END + 0.06],
  ],
  6,
);
/** The camera's roll, degrees clockwise: the airship's "up" turns from screen-up to screen-right (toward the satellite). */
const ROLL = track(
  [
    [-40, 0],
    [31, 0],
    [62, 30],
    [150, 30],
  ],
  8,
);
/** The Earth turning under the airship (it flies nose-left, so the ground runs right under it): degrees clockwise per
 *  frame (negative = anticlockwise). ~2.5 px/f at the rim at f0, nothing visible once the planet is a disc. */
const SPIN = (2.5 / RS0) * (180 / Math.PI);

/** Airship screen centre: from close (f0) to the marker on the rim in the resolved frame. */
const A0 = { x: 540, y: 680 };
const EC_END = { x: 390, y: 1190 }; // the Earth-line-satellite axis on the frame's middle, clear of the caption bands
const AW0 = 830; // airship width on screen at f0
const AW_MIN = 136; // the marker's minimum length: hull and tail fins still read as an airship at phone size
const A_SHRINK = 1.25; // the airship shrinks faster than the planet (exp(-A_SHRINK u))
const GAP0 = 250; // the air between the belly and the limb at f0
const G_SHRINK = 1.75;
const softMax = (a: number, b: number) => Math.cbrt(a * a * a + b * b * b);

export const geom = (f: number) => {
  const u = U(f);
  const Rs = RS0 * Math.exp(-u);
  const p = Math.max(0, Math.min(1, u / U_END));
  const roll = ROLL(f);
  const rr = (roll * Math.PI) / 180;
  const up = { x: Math.sin(rr), y: -Math.cos(rr) }; // the airship's local up, on screen
  const awRaw = AW0 * Math.exp(-A_SHRINK * u);
  const aw = softMax(awRaw, AW_MIN);
  const ah = (aw * AIRSHIP.h) / AIRSHIP.w;
  const gap = GAP0 * Math.exp(-G_SHRINK * u);
  const off = gap + AIRSHIP.belly * ah; // airship centre above the rim
  // the airship's end point follows from the end geometry; its path eases with the zoom
  const endOff = GAP0 * Math.exp(-G_SHRINK * U_END) + AIRSHIP.belly * ((softMax(AW0 * Math.exp(-A_SHRINK * U_END), AW_MIN) * AIRSHIP.h) / AIRSHIP.w);
  const A1 = { x: EC_END.x + Math.sin(Math.PI/6)*(R_END+endOff), y: EC_END.y - Math.cos(Math.PI/6)*(R_END+endOff) };
  const s = Easing.inOut(Easing.sin)(p);
  // life: a slow bob while it is big; none once it is a marker on the rim
  const life = Math.max(0, Math.min(1, (awRaw - 120) / 600));
  const bob = life * 3 * Math.sin(f * 0.11 + 0.4);
  const A = { x: A0.x + (A1.x - A0.x) * s - up.x * bob, y: A0.y + (A1.y - A0.y) * s - up.y * bob };
  const rim = { x: A.x - up.x * off, y: A.y - up.y * off };
  const Ec = { x: rim.x - up.x * Rs, y: rim.y - up.y * Rs };
  const pitch = life * 0.7 * Math.sin(f * 0.09 + 1.1);
  return { u, Rs, p, roll, up, aw, awRaw, ah, gap, A, rim, Ec, pitch, spin: SPIN * f };
};

// -- the paper plane (the sky; the 1,800x lives on it) ----------------------------------------------------------------
// The paper pans with the airship's ease (a slower plane than the photo world), so the 1,800x, top-centre above the
// big hull at f0, lands centred over the distance line in the resolved frame (NUM_END, at the line's settle frame).
/** The 1,800x baseline centre at rest on the paper (where it rises at f0, above the hull, left of the tail fin). */
const NUM_REST = { x: 540, y: 480 };
export const NUM_END = { x: 330, y: 760 }; // baseline centre on screen at f88: caps ~y 175-329
const PAN_AT = 88;
const PAPER_SC_END = 0.95;
const PAN = {
  x: NUM_END.x - (W / 2 + PAPER_SC_END * (NUM_REST.x - W / 2)),
  y: NUM_END.y - (H / 2 + PAPER_SC_END * (NUM_REST.y - H / 2)) + 0.3 * PAN_AT,
};
export const paperAt = (f: number) => {
  const g = geom(f);
  const sc = 1 - (1 - PAPER_SC_END) * g.p;
  const s = Easing.inOut(Easing.sin)(g.p);
  return { sc, ox: PAN.x * s, oy: PAN.y * s - 0.3 * f };
};
/** A paper-plane point (rest coords) to screen. */
export const onPaper = (f: number, x: number, y: number) => {
  const pp = paperAt(f);
  return { x: W / 2 + pp.sc * (x - W / 2) + pp.ox, y: H / 2 + pp.sc * (y - H / 2) + pp.oy, s: pp.sc };
};

// -- 1,800x ---------------------------------------------------------------------------------------------------------------
const NUM = "1,800×";
export const NUM_SIZE = 158; // caps ~155 px
export const NUM_X = NUM_REST.x; // centre, paper rest coords
export const NUM_Y = NUM_REST.y; // baseline
const NUM_SHADOW = 8;
const CROWN = 8;
// The layers rise from fully behind the airship's hull (STING_RISE puts the glyphs inside its silhouette at f0).
const STING_START = 0;
const STING_STAGGER = 2;
const STING_TRAVEL = 15;
const STING_RISE = 215;
const EASE_STING = Easing.bezier(0.22, 0.85, 0.3, 1);

const Number1800: React.FC<{ frame: number }> = ({ frame }) => {
  const layers = [ORANGE, PURPLE, BLUE, INK];
  const q = onPaper(frame, NUM_X, NUM_Y);
  const size = NUM_SIZE * q.s;
  const prog = (i: number) => interpolate(frame, [STING_START + i * STING_STAGGER, STING_START + i * STING_STAGGER + STING_TRAVEL], [0, 1], { easing: EASE_STING, ...clamp });
  const t = (fill: string, y: number, dx = 0, key?: string) => (
    <text key={key} x={q.x + dx} y={y} textAnchor="middle" fill={fill} style={typeStyle(size, 900)}>
      {NUM}
    </text>
  );
  const coreStarted = frame > STING_START + 3 * STING_STAGGER;
  const coreY = q.y + STING_RISE * (1 - prog(3));
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {coreStarted ? t(SHADOW, coreY + NUM_SHADOW * q.s, NUM_SHADOW * q.s) : null}
      {layers.slice(0, 3).map((c, i) => {
        if (frame <= STING_START + i * STING_STAGGER) return null; // not rendered before it moves
        const y = q.y + STING_RISE * (1 - prog(i)) - (3 - i) * CROWN * q.s * prog(i);
        return t(c, y, 0, c);
      })}
      {coreStarted ? t(INK, coreY) : null}
    </svg>
  );
};

// -- a cut-out turned about its own centre, its hard shadow offset in SCREEN px (the light does not roll) --------------
// (nealShared's PhotoCutOut turns about the bottom centre even with anchor "center", so it is not used for turned pieces.)
const Turned: React.FC<{ src: string; aspect: number; x: number; y: number; w: number; rot: number; flip?: boolean; shadow?: number; core?: "photo" | "white" | "none"; mix?: number; filter?: string }> = ({
  src,
  aspect,
  x,
  y,
  w,
  rot,
  flip = false,
  shadow = 0,
  core = "photo",
  mix = 0,
  filter = MIKKEL_FILTER,
}) => {
  const h = w / aspect;
  const wrap = (dx: number, dy: number, node: React.ReactNode, opacity = 1) => (
    <div style={{ position: "absolute", left: x - w / 2 + dx, top: y - h / 2 + dy, width: w, height: h, transform: `rotate(${rot}deg)${flip ? " scaleX(-1)" : ""}`, transformOrigin: "50% 50%", opacity }}>{node}</div>
  );
  const at = { src, aspect, x: 0, y: 0, w, anchor: "top-left" as const };
  return (
    <>
      {shadow > 0 ? wrap(shadow, shadow, <Silhouette {...at} colour={SHADOW} />) : null}
      {core === "photo" && mix < 1 ? wrap(0, 0, <CutOut {...at} filter={filter} />, 1 - mix) : null}
      {core === "photo" && mix > 0 ? wrap(0, 0, <Silhouette {...at} colour={INK} />, mix) : null}
      {core === "white" ? wrap(0, 0, <Silhouette {...at} colour={INK} />) : null}
    </>
  );
};

// -- the planet ---------------------------------------------------------------------------------------------------------
const PHOTO_SHADOW = 5;
/** The disc photo's own turn, so the resolved planet (after the quarter-turn roll and the spin) reads upright, Africa up. */
const EARTH_BASE = -30 - SPIN * 100;
/** The close level of detail: the limb print lies over the disc near the airship and goes as the planet becomes a disc. */
const LIMB_OVER = 1.003;
const limbOpacity = (Rs: number) => interpolate(Rs, [620, 1250], [0, 1], { easing: Easing.inOut(Easing.sin), ...clamp });

const Planet: React.FC<{ frame: number }> = ({ frame }) => {
  const g = geom(frame);
  const diskW = (g.Rs * EARTH.size) / EARTH.r;
  const rot = g.roll + g.spin;
  const discRot = rot + EARTH_BASE;
  const ls = (g.Rs / LIMB.R) * LIMB_OVER; // a hair past the disc so its dark photo limb never shows at the rim
  const lo = limbOpacity(g.Rs);
  return (
    <>
      <Turned src={EARTH.src} aspect={1} x={g.Ec.x} y={g.Ec.y} w={diskW} rot={discRot} shadow={PHOTO_SHADOW} />
      {lo > 0 ? (
        <div
          style={{
            position: "absolute",
            left: g.Ec.x - (LIMB.w / 2) * ls,
            top: g.Ec.y - (LIMB.R + LIMB.pad) * ls,
            width: LIMB.w * ls,
            height: LIMB.h * ls,
            transformOrigin: `${(LIMB.w / 2) * ls}px ${(LIMB.R + LIMB.pad) * ls}px`,
            transform: `rotate(${rot}deg)`,
            opacity: lo,
          }}
        >
          <Img src={staticFile(LIMB.src)} style={{ position: "absolute", left: 0, top: 0, width: LIMB.w * ls, height: LIMB.h * ls, maxWidth: "none", filter: MIKKEL_FILTER }} />
        </div>
      ) : null}
    </>
  );
};

// -- the satellite and the distance line ---------------------------------------------------------------------------------
export const SAT_W_END = 300; // wingspan on screen in the resolved frame (an icon scale); it scales with the world
const SAT_TILT = 60; // the wings tilted off the line, right end up: body and both wings read as a satellite
const turn = (v: { x: number; y: number }, deg: number) => {
  const r = (deg * Math.PI) / 180;
  return { x: v.x * Math.cos(r) - v.y * Math.sin(r), y: v.x * Math.sin(r) + v.y * Math.cos(r) };
};
export const satAt = (f: number) => {
  const g = geom(f);
  const w = SAT_W_END * (g.Rs / R_END);
  const h = (w * SAT.h) / SAT.w;
  const settle = interpolate(f, [86, 100], [0, 1], clamp);
  const drift = settle * 4 * Math.sin((f - 86) * 0.09);
  const d = GEO * g.Rs;
  const rot = g.roll - 90 + SAT_TILT + settle * 1.5 * Math.sin((f - 86) * 0.07);
  // the BODY sits at the true distance on the ray (drift perpendicular to it: (-up.y, up.x)); the image centre follows
  const body = { x: g.Ec.x + g.up.x * d - g.up.y * drift, y: g.Ec.y + g.up.y * d + g.up.x * drift };
  const toC = turn({ x: (0.5 - SAT.bodyX) * w, y: (0.5 - SAT.bodyY) * h }, rot);
  const toTip = turn({ x: -SAT.bodyX * w, y: (SAT.tipY - SAT.bodyY) * h }, rot);
  const c = { x: body.x + toC.x, y: body.y + toC.y };
  const tip = { x: body.x + toTip.x, y: body.y + toTip.y };
  return { c, body, tip, w, h, rot, d };
};

const LINE_START = 80;
const LINE_END = 92;
const DASH = 20;
const DASH_GAP = 14;
const LINE_W = 6;

const DistanceLine: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame < LINE_START) return null;
  const g = geom(frame);
  const sat = satAt(frame);
  const pr = interpolate(frame, [LINE_START, LINE_END], [0, 1], { easing: Easing.inOut(Easing.quad), ...clamp });
  // from just past the airship marker (its far side) to just short of the satellite's near wing tip, along the ray
  const startD = g.Rs + (g.A.x - g.rim.x) * g.up.x + (g.A.y - g.rim.y) * g.up.y + g.ah / 2 + 10;
  const a = { x: g.Ec.x + g.up.x * startD, y: g.Ec.y + g.up.y * startD };
  const endD = (sat.tip.x - g.Ec.x) * g.up.x + (sat.tip.y - g.Ec.y) * g.up.y - 16;
  const b = { x: g.Ec.x + g.up.x * endD, y: g.Ec.y + g.up.y * endD };
  const tip = { x: a.x + (b.x - a.x) * pr, y: a.y + (b.y - a.y) * pr };
  const line = (c: string, o: number) => (
    <line x1={a.x + o} y1={a.y + o} x2={tip.x + o} y2={tip.y + o} stroke={c} strokeWidth={LINE_W} strokeDasharray={`${DASH} ${DASH_GAP}`} strokeLinecap="butt" />
  );
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {line(SHADOW, 4)}
      {line(INK, 0)}
    </svg>
  );
};

const Satellite: React.FC<{ frame: number }> = ({ frame }) => {
  const s = satAt(frame);
  if (s.c.x - s.w / 2 > W + 40) return null; // still beyond the right edge
  return <Turned src={SAT.src} aspect={SAT.w / SAT.h} x={s.c.x} y={s.c.y} w={s.w} rot={s.rot} shadow={PHOTO_SHADOW} />;
};

// -- the airship ------------------------------------------------------------------------------------------------------------
/** Photo while it is big; a white silhouette on its hard shadow once it is the marker (crossfade as it shrinks). */
const markerMix = (awRaw: number) => interpolate(awRaw, [130, 240], [1, 0], { easing: Easing.inOut(Easing.sin), ...clamp });

const Airship: React.FC<{ frame: number }> = ({ frame }) => {
  const g = geom(frame);
  const sh = interpolate(g.aw, [AW_MIN, 400], [4, PHOTO_SHADOW], clamp);
  return <Turned src={AIRSHIP.src} aspect={AIRSHIP.w / AIRSHIP.h} x={g.A.x} y={g.A.y} w={g.aw} rot={g.roll + g.pitch} shadow={sh} mix={markerMix(g.awRaw)} />;
};

// -- the cut ----------------------------------------------------------------------------------------------------------------
const EighteenHundredCloserPortrait: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <MikkelFilmLife frame={frame} seed="m12">
        <MikkelPaper frame={frame} cam={{x:540+frame*.2,y:960-frame*.2,k:1,x0:540,y0:960}} />
        <Number1800 frame={frame} />
        <Planet frame={frame} />
        <DistanceLine frame={frame} />
        <Satellite frame={frame} />
        <Airship frame={frame} />
      </MikkelFilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default EighteenHundredCloserPortrait;
