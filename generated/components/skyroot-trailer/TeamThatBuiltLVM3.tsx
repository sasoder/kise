// ---------------------------------------------------------------------------
// TeamThatBuiltLVM3 (skyroot-trailer, cut 17). Core Memory podcast style, the ARCHIVE COLLAGE at 16:9 (the Pushp /
// Mikkel trailer look, on ./skyrootShared). Opaque 2048x1080, 23.976 fps, 141 frames; finals --scale 2 (4096x2160).
//
// CHECK LINE: the two founders were two of the ISRO engineers at the foot of LVM3: tiny people beside India's biggest
// rocket, which they helped build.
//
// THE LINE: "So we were in the space agency. We were part of the team which built India's largest rocket called LVM3."
// WORD -> FRAME: we 1 · were 5 · in the 7 · space 10 · agency 15 · we 32 · were 40 · part 41 · of the 47 · team 51 ·
//   which 58 · built 67 · India's 73 · largest 83 · rocket 90 · called 106 · LVM3 117 · speech ends ~135.
// DURATION: the slot 17.142 -> 23.023 s (sequence f411-f552) = 5.881 s x 23.976 = 141 frames (f0..f140).
//
// THE MOTION (rev 4, after the user's "make it more harmonious, write out the name, more going on"). ONE continuous
// pull-back from f0 to ~f104, then a slow creep. A log-zoom track u = ln k (keyed, box-smoothed) is already falling at
// f0, holds ~1.4 %/frame, accelerates to ~2.6 %/frame at f61 and settles by ~f104 (one acceleration lobe, one settle
// lobe); the look-at point A travels down the body from the mark to the founders on T, whose speed is shaped as 1 / k
// (moving at f0, easing out, arrived f54), so the descent's screen speed stays <= ~31 px/frame (the world point under
// the frame's centre; 2048 frame) while the zoom falls. f0: close on the white ISRO mark printed large on LVM3's core
// over the livery's own small logo (k 4.95, the mark ~386 px wide, centre y ~380). The body slides up past the frame as
// it shrinks; the team comes in at the bottom right at the rocket's foot: ONE row of eleven standing white full figures
// on the paper's ground line, shoulder to shoulder just right of the pad like a team photo, each rising whole from
// behind the ground line in a left-to-right ripple (f34-f50). f51 ("team", k 2.30): a team photo at the pad, the
// rocket's base left (x ~330-910), the row right (to x ~1750) on the ground at y ~782, figures ~119 px tall; the
// founders' chain crown rises from behind them (from f41, formed f51). "which built" (f56-f84): three b&w prints of
// LVM3 being built slide in one after another off the left frame edge and land pinned on the paper left of the rocket.
// The pull-back carries on: the nose enters at the top on "rocket" (~f90), settled by f117 (k ~1.000), then a creep out
// of ~0.07 % per frame to the last frame. "called" / "LVM3" (f103-f119): the name's rule is drawn, the name rises.
// CHAIN = SKYROOT'S OWN (skyrootShared legend): here the two founders (their crown from "team" to the end). The stack
// never changes: orange back (3 steps up), purple (2), blue (1), the hard shadow, the white core; the step is a constant
// 4.6 world px (10.6 px at f51, 4.6 px in the resolved frame), so all three colours show at both scales. No chain on
// the name: LVM3 is ISRO's.
// SCALE (CHEATED): LVM3 860 px nose to base. skyrootShared's VISIBLE_M gives the PNG's span as ~40 m, so a 1.75 m person
// would be ~38 px; the figures are 52 px (x1.37) so a full figure still reads as a person on a phone.
// COMPOSITION (no caption bands in this trailer; the resolved frame designed as one picture): the rocket left of
// centre (axis x 730, x 610-862, nose y 85, base 945) on its pad; the ground line at y 968 with the team row right of
// the pad (x 905-1228); the name LVM3 balancing the rocket on the right at its mid-height (ink x 1211-1831, y ~410-593,
// its rule to y 624); the three prints quiet on the paper at the left (x ~160-493, y ~120-843: >= 150 px from the
// frame's left edge, each overlapping its neighbour by <= 14 %), >= 72 px clear of the rocket's silhouette on every
// frame. Hierarchy: rocket, name, team, prints.
// SOURCES: the build prints: ISRO, GSLV Mk III-D1 campaign 2017 (GODL-India, via Wikimedia Commons; the working
// folder's images/18.5a-c, credits in images/image_sources.txt): S200 strap-ons integrated with the L110 core, the L110
// liquid stage and the C25 cryogenic stage at the stage preparation facility, baked by
// scripts/clips/skyroot-trailer/bake-lvm3-build-prints.py -> public/skyroot-trailer/lvm3_build_{a,b,c}.jpg.
// LVM3 43.4 m tall, India's heaviest operational launcher (Wikipedia "LVM3"; animation_source/assets/FACTS.txt
// item 4). The founders' ISRO background: Pawan Kumar Chandana, ISRO 2012-2018, worked on GSLV Mk III (= LVM3; Tribune,
// 19 Jul 2026); Naga Bharath Daka, avionics engineer at ISRO's VSSC 2012-2015 (Skyroot "About"); his own LVM3 link is not
// documented (FACTS.txt). Photo: LVM3-M6 on the Second Launch Pad (ISRO, GODL-India), cut by
// scripts/clips/skyroot-trailer/bake-cutouts.py (skyrootShared). The photo's own small logo is hidden under the mark by
// a body-tone patch from the same photo (scripts/clips/skyroot-trailer/bake-lvm3-logo-patch.py ->
// public/skyroot-trailer/lvm3_logo_patch.png). ISRO mark: the ISRO logo (Wikimedia Commons, PD; skyrootShared ISRO_LOGO),
// white on its hard shadow. People: drawn here (FigureGlyph), in the family of cerroShared Person.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { BARLOW_CAP, PaperGround } from "../kits/core-memory/cerroShared";
import {
  CHAIN,
  CutOut,
  EASE_LAND,
  H,
  INK,
  ISRO_LOGO,
  LVM3,
  LogoMark,
  RocketCutOut,
  SHADOW,
  STROKE,
  SKYROOT_FILTER,
  SkyrootFilmLife,
  W,
  clamp,
  fontFamily,
  logoAspect,
} from "./skyrootShared";

export const FPS = 24000 / 1001;
export const DURATION = 141;
export const schema = z.object({});
export const defaultProps = schema.parse({});

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

// -- the world: resolved-frame px (at k 1 the world IS the f117 screen) ---------------------------------------------------
/** The rocket cut-out (skyrootShared LVM3): fractions of the PNG. */
const LVM3_PNG = LVM3;
/** In the PNG: the core's centre line and the livery's ISRO logo (centre), src px. */
const CORE_X_SRC = 378;
const LOGO_Y_SRC = 1346;
export const X_R = 730; // the PNG's axis (axisX): the rocket stands left of centre (rev 3)
export const NOSE_Y = 85;
export const BASE_Y = 945; // the flat foot of the core and both strap-ons (one row in the PNG), standing on the pad
const RH_IMG = (BASE_Y - NOSE_Y) / (LVM3_PNG.baseY - LVM3_PNG.noseY); // the PNG's height in world px
const RW_IMG = (RH_IMG * LVM3_PNG.w) / LVM3_PNG.h;
const IMG_TOP = NOSE_Y - LVM3_PNG.noseY * RH_IMG;
const IMG_LEFT = X_R - LVM3_PNG.axisX * RW_IMG;
const ROCKET_SHADOW = 3;
/** The vehicle's outer edges (strap-ons, src x 7..767), world px. */
export const ROCKET_L = IMG_LEFT + (7 / LVM3_PNG.w) * RW_IMG;
export const ROCKET_R = IMG_LEFT + (767 / LVM3_PNG.w) * RW_IMG;

/** The white ISRO mark on the core, centred on the livery's own logo, printed large (~80 % of the core's width). */
export const MARK = { x: IMG_LEFT + (CORE_X_SRC / LVM3_PNG.w) * RW_IMG, y: IMG_TOP + (LOGO_Y_SRC / LVM3_PNG.h) * RH_IMG, w: 78, h: 78 / logoAspect(ISRO_LOGO) };
const MARK_SHADOW = 1.5;
/** The photo's own small logo, hidden under the mark by a body-tone patch (bake-lvm3-logo-patch.py), its box in src px. */
const PATCH = { src: "skyroot-trailer/lvm3_logo_patch.png", x0: 300, y0: 1302, x1: 456, y1: 1414 };

/** The paper's ground line (the team stands on it) and the pad. */
export const G = 968;
const LINE_T = 3;
const LINE_SH = 2;
const PAD = { x0: ROCKET_L - 30, x1: ROCKET_R + 30, top: BASE_Y };

// -- the team ------------------------------------------------------------------------------------------------------------
// ONE row of standing full-figure people on the ground line at the rocket's foot, like a team photo at the pad (review 2).
// Each figure is a chunky white glyph in cerroShared Person's family: a round head, a rounded torso with the shoulders,
// two legs; one flat white, on a hard black copy at +FIG_SHADOW, no outline. All the same size, evenly spaced.
/** Figure height, world px (= screen px in the resolved frame). True scale is ~39 px (1.75 m against VISIBLE_M 40 m over
 *  894 px); cheated up x1.33 so a full figure reads as a person on a phone. */
export const FIG_H = 52;
const FIG = {
  headR: 0.13 * FIG_H,
  torsoW: 0.42 * FIG_H,
  torsoTop: 0.29 * FIG_H, // below the figure's top
  torsoBot: 0.6 * FIG_H,
  torsoR: 0.13 * FIG_H,
  legW: 0.16 * FIG_H,
  legGap: 0.055 * FIG_H,
  legTop: 0.52 * FIG_H,
};
const FIG_SHADOW = 2;
/** One figure in one flat fill, feet centre at (x, y). */
const FigureGlyph: React.FC<{ x: number; y: number; fill: string }> = ({ x, y, fill }) => {
  const top = y - FIG_H;
  const lx = FIG.legGap / 2;
  return (
    <g fill={fill}>
      <circle cx={x} cy={top + FIG.headR} r={FIG.headR} />
      <rect x={x - FIG.torsoW / 2} y={top + FIG.torsoTop} width={FIG.torsoW} height={FIG.torsoBot - FIG.torsoTop} rx={FIG.torsoR} />
      <rect x={x - lx - FIG.legW} y={top + FIG.legTop} width={FIG.legW} height={FIG_H - FIG.legTop} rx={FIG.legW * 0.3} />
      <rect x={x + lx} y={top + FIG.legTop} width={FIG.legW} height={FIG_H - FIG.legTop} rx={FIG.legW * 0.3} />
    </g>
  );
};
export const PITCH = 30;
export const N_FIG = 11;
export const FX0 = PAD.x1 + 25; // the first figure's centre: the founder nearest the rocket, just clear of the pad
export const FOUNDERS = [0, 1];
export const FOUNDER_C = { x: FX0 + PITCH / 2, y: G - FIG_H / 2 };
type Fig = { x: number; i: number };
export const FIGS: Fig[] = Array.from({ length: N_FIG }, (_, i) => ({ x: FX0 + i * PITCH, i }));
const RISE_FRAMES = 10;
/** The ripple: left to right, each figure rising from behind the ground line as the camera brings it in. */
const RISE_F0 = 34;
const RISE_PER_PX = 6 / ((N_FIG - 1) * PITCH); // last figure up by f50
export const riseStart = (fg: Fig) => RISE_F0 + (fg.x - FX0) * RISE_PER_PX;
const riseOf = (fg: Fig, f: number) => interpolate(f, [riseStart(fg), riseStart(fg) + RISE_FRAMES], [0, 1], { easing: EASE_LAND, ...clamp });

/**
 * The founders' crown: orange (back, 3 steps up) / purple (2) / blue (1) / the white core, a constant stack. The three
 * colours rise together out from behind the core (1 frame apart) and land by "team" f51. The step is constant in world
 * px (~10.6 screen px at f51, 4.6 in the resolved frame), so all three stripes show at both scales.
 */
const CROWN_F = 41;
const CROWN_STAGGER = 1;
const CROWN_TRAVEL = 10;
export const CROWN_STEP_W = 4.6;

// -- the build prints (rev 3: "the team which built", made visible) -----------------------------------------------------
// Three b&w prints of LVM3 being built (ISRO 2017, GODL-India; bake-lvm3-build-prints.py) pinned on the paper to the
// left of the rocket: they live on the paper's plane (its parallax and scale), behind the world, and never touch the
// rocket's silhouette. Each slides in off the left frame edge at full size on "which built" (one after another),
// decelerating into place (ease-out quad, entering the frame at <= ~45 px/frame), turning its last degree as it lands.
// A thin white border (the one STROKE weight) on the hard shadow: a photo print.
const PRINT_SHADOW = 5;
const PRINT_BORDER = STROKE;
const PRINT_TRAVEL = 18;
/** Paper-plane px at rest (f117), top-left, size, resting turn (deg), slide start frame. */
const PRINTS = [
  { src: "skyroot-trailer/lvm3_build_a.jpg", x: 238, y: 158, w: 262, h: 349, rot: -1.6, f0: 56 },
  { src: "skyroot-trailer/lvm3_build_b.jpg", x: 216, y: 478, w: 320, h: 213, rot: 1.2, f0: 61 },
  { src: "skyroot-trailer/lvm3_build_c.jpg", x: 204, y: 662, w: 320, h: 213, rot: -0.9, f0: 66 },
] as const;
export const printSlide = (pr: (typeof PRINTS)[number], f: number) => {
  const t = interpolate(f, [pr.f0, pr.f0 + PRINT_TRAVEL], [0, 1], { easing: Easing.out(Easing.quad), ...clamp });
  return { dx: -(pr.x + pr.w + 80) * (1 - t), rot: pr.rot + 2.5 * (1 - t), t };
};
export const PRINT_BOXES = PRINTS;
const Prints: React.FC<{ frame: number; transform: string }> = ({ frame, transform }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "50% 50%", transform }}>
    {PRINTS.map((pr) => {
      const m = printSlide(pr, frame);
      if (m.t <= 0) return null;
      return (
        <div
          key={pr.src}
          style={{
            position: "absolute",
            left: pr.x + m.dx,
            top: pr.y,
            width: pr.w,
            height: pr.h,
            transform: `rotate(${m.rot}deg)`,
          }}
        >
          <div style={{ position: "absolute", left: PRINT_SHADOW, top: PRINT_SHADOW, width: pr.w, height: pr.h, background: SHADOW }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: pr.w, height: pr.h, background: INK, padding: PRINT_BORDER, boxSizing: "border-box" }}>
            <Img
              src={staticFile(pr.src)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: SKYROOT_FILTER }}
            />
          </div>
        </div>
      );
    })}
  </div>
);

// -- the name (rev 3: "since it's saying the name, it makes sense to write out a name") -----------------------------------
// LVM3 set big in world space, right of the rocket at about its mid-height: Barlow 900 uppercase, white on its hard
// shadow, over a white rule the word's width. The rule is drawn by its tip left to right (f103-f111, on "called" f106),
// then the word rises whole from behind it (f109-f119, ease-out cubic: 97 % up by f116, settled on "LVM3" f117). No
// chain: LVM3 is ISRO's. Cap height 183 px (Barlow 900 at 261 px, 0.9x of v3 so the rocket stays first), ink x 1211-1831,
// y ~410-593, centred on the rocket's mid-height.
/** ruleW / ruleDx: the rule spans the word's measured ink (world x 1211-1831), not its advance box. */
export const TITLE = { x: 1520, base: 584, size: 261, shadow: 6, ruleGap: 29, ruleW: 620, ruleDx: 1 };
const TITLE_CAP = TITLE.size * BARLOW_CAP;
const RULE_F0 = 103;
const RULE_FRAMES = 8;
const TITLE_F0 = 109;
const TITLE_FRAMES = 10;
const Title: React.FC<{ frame: number }> = ({ frame }) => {
  const r = interpolate(frame, [RULE_F0, RULE_F0 + RULE_FRAMES], [0, 1], { easing: Easing.inOut(Easing.cubic), ...clamp });
  if (r <= 0) return null;
  const t = interpolate(frame, [TITLE_F0, TITLE_F0 + TITLE_FRAMES], [0, 1], { easing: Easing.out(Easing.cubic), ...clamp });
  const ruleY = TITLE.base + TITLE.ruleGap;
  const x0 = TITLE.x + TITLE.ruleDx - TITLE.ruleW / 2;
  const dy = (1 - t) * (TITLE.ruleGap + TITLE_CAP + TITLE.shadow + 8);
  const txt = (fill: string, o: number) => (
    <text
      x={TITLE.x + o}
      y={TITLE.base + dy + o}
      fill={fill}
      textAnchor="middle"
      style={{ fontFamily, fontWeight: 900, fontSize: TITLE.size, textTransform: "uppercase" }}
    >
      LVM3
    </text>
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <defs>
        <clipPath id="t17-title">
          <rect x={-1000} y={-2000} width={5000} height={ruleY + 2000} />
        </clipPath>
      </defs>
      {t > 0 ? (
        <g clipPath="url(#t17-title)">
          {txt(SHADOW, TITLE.shadow)}
          {txt(INK, 0)}
        </g>
      ) : null}
      <rect x={x0 + TITLE.shadow} y={ruleY + TITLE.shadow} width={TITLE.ruleW * r} height={STROKE} fill={SHADOW} />
      <rect x={x0} y={ruleY} width={TITLE.ruleW * r} height={STROKE} fill={INK} />
    </svg>
  );
};

// -- the camera ----------------------------------------------------------------------------------------------------------
// ONE continuous pull-back from f0 (review 1: no whip). u = ln k falls from f0 (already moving), accelerates to ~f68 and
// settles by ~f104, then a slow creep. The look-at point A travels down the body from the mark to the founders on T
// (moving at f0, one accel lobe, one settle lobe, arrived ~f50) while the zoom is already falling, so the descent's screen
// speed stays low. A sits at screen S: from the mark's opening place to the founders' place at the team (T), then on to
// the founders' resting place as the zoom resolves (P).
export const K0 = 4.95; // the mark ~386 px wide at f0
const L0 = Math.log(K0);
export const K_ARRIVE = 2.42; // at f50, at the team: busts ~93 px
const U = track(
  [
    [-PRE, L0 + 0.55],
    [-20, L0 + 0.275],
    [0, L0],
    [24, L0 - 0.33],
    [50, Math.log(K_ARRIVE)],
    [62, 0.56],
    [74, 0.27],
    [86, 0.08],
    [96, 0.022],
    [104, 0.006],
    [117, 0],
    [DURATION, -0.017],
    [DURATION + POST, -0.047],
  ],
  10,
);
/**
 * The descent T (0 at the mark, 1 at the founders): its speed is shaped as 1 / k (so the screen speed of the descent stays
 * level while the zoom falls), already moving at f0 (0.55 of full speed), easing out over the last 18 frames to arrive
 * at f50. Integrated once at module load.
 */
const ARRIVE = 54;
const T_TABLE: number[] = (() => {
  const env = (f: number) => {
    const a = f < 10 ? 0.55 + 0.45 * (1 - Math.cos((Math.PI * f) / 10)) / 2 : 1;
    const e = f > ARRIVE - 14 ? (1 + Math.cos((Math.PI * Math.min(14, f - (ARRIVE - 14))) / 14)) / 2 : 1;
    return a * e;
  };
  const w = Array.from({ length: ARRIVE + 1 }, (_, f) => env(f) / Math.exp(U(f)));
  const cum = [0];
  for (let f = 1; f <= ARRIVE; f++) cum.push(cum[f - 1] + (w[f - 1] + w[f]) / 2);
  return cum.map((c) => c / cum[ARRIVE]);
})();
const T_V0 = T_TABLE[1] - T_TABLE[0];
const T = (f: number) => {
  if (f <= 0) return T_V0 * f; // already moving before the cut
  if (f >= ARRIVE) return 1;
  const a = Math.floor(f);
  return T_TABLE[a] + (T_TABLE[Math.min(a + 1, ARRIVE)] - T_TABLE[a]) * (f - a);
};
const S_MARK = { x: W / 2, y: 380 };
const S_TEAM = { x: 1070, y: 720 };
const U_TEAM = U(ARRIVE - 2);
const smooth = (t: number) => t * t * (3 - 2 * t);
export const camAt = (f: number) => {
  const u = U(f);
  const k = Math.exp(u);
  const t = T(f);
  const p = smooth(Math.max(0, Math.min(1, (U_TEAM - u) / U_TEAM)));
  const A = { x: MARK.x + (FOUNDER_C.x - MARK.x) * t, y: MARK.y + (FOUNDER_C.y - MARK.y) * t };
  const s0 = { x: S_MARK.x + (S_TEAM.x - S_MARK.x) * t, y: S_MARK.y + (S_TEAM.y - S_MARK.y) * t };
  const S = { x: s0.x + (FOUNDER_C.x - s0.x) * p, y: s0.y + (FOUNDER_C.y - s0.y) * p };
  return { x: A.x - (S.x - W / 2) / k, y: A.y - (S.y - H / 2) / k, k, u, t, p, A };
};
export const toScreen = (f: number, x: number, y: number) => {
  const c = camAt(f);
  return { x: W / 2 + (x - c.x) * c.k, y: H / 2 + (y - c.y) * c.k };
};
/** Screen velocity (px/frame) of the world point under the frame's centre. */
export const panVel = (f: number) => {
  const c = camAt(f);
  const a = toScreen(f - 0.5, c.x, c.y);
  const b = toScreen(f + 0.5, c.x, c.y);
  return { x: b.x - a.x, y: b.y - a.y };
};

// -- pieces --------------------------------------------------------------------------------------------------------------
const Team: React.FC<{ frame: number }> = ({ frame }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    <defs>
      <clipPath id="t17-ground">
        <rect x={-1000} y={-2000} width={5000} height={G + 2000} />
      </clipPath>
    </defs>
    {/* the pad */}
    <rect x={PAD.x0 + LINE_SH} y={PAD.top + LINE_SH} width={PAD.x1 - PAD.x0} height={G - PAD.top} fill={SHADOW} />
    <rect x={PAD.x0} y={PAD.top} width={PAD.x1 - PAD.x0} height={G - PAD.top} fill={INK} />
    {/* the team, rising from behind the ground line */}
    <g clipPath="url(#t17-ground)">
      {FIGS.map((fg) => {
        const pr = riseOf(fg, frame);
        if (pr <= 0) return null;
        const y = G - LINE_T / 2 + 0.5 + (1 - pr) * (FIG_H + FIG_SHADOW + 4);
        const founder = FOUNDERS.includes(fg.i);
        return (
          <g key={fg.i}>
            {founder
              ? CHAIN.map((c, ci) => {
                  const st = CROWN_F + ci * CROWN_STAGGER;
                  if (frame < st) return null;
                  const t = interpolate(frame, [st, st + CROWN_TRAVEL], [0, 1], { easing: EASE_LAND, ...clamp });
                  const n = 3 - ci; // orange 3 steps up, purple 2, blue 1
                  return <FigureGlyph key={c} x={fg.x} y={y - n * CROWN_STEP_W * t} fill={c} />;
                })
              : null}
            <FigureGlyph x={fg.x + FIG_SHADOW} y={y + FIG_SHADOW} fill={SHADOW} />
            <FigureGlyph x={fg.x} y={y} fill={INK} />
          </g>
        );
      })}
    </g>
    {/* the ground line */}
    <rect x={-600 + LINE_SH} y={G - LINE_T / 2 + LINE_SH} width={3300} height={LINE_T} fill={SHADOW} />
    <rect x={-600} y={G - LINE_T / 2} width={3300} height={LINE_T} fill={INK} />
  </svg>
);

/** LVM3 standing on its pad, graded, on its hard shadow; the white ISRO mark printed on its core. */
const Rocket: React.FC = () => (
  <>
    <RocketCutOut rocket={LVM3} x={X_R} y={BASE_Y} height={BASE_Y - NOSE_Y} shadow={ROCKET_SHADOW} />
    <CutOut
      src={PATCH.src}
      aspect={(PATCH.x1 - PATCH.x0) / (PATCH.y1 - PATCH.y0)}
      x={IMG_LEFT + (PATCH.x0 / LVM3_PNG.w) * RW_IMG}
      y={IMG_TOP + (PATCH.y0 / LVM3_PNG.h) * RH_IMG}
      w={((PATCH.x1 - PATCH.x0) / LVM3_PNG.w) * RW_IMG}
      anchor="top-left"
      filter={SKYROOT_FILTER}
    />
    <LogoMark logo={ISRO_LOGO} x={MARK.x - MARK.w / 2} y={MARK.y - MARK.h / 2} w={MARK.w} shadow={MARK_SHADOW} />
  </>
);

/** The paper's far plane: parallax 0.15 of the focus plane's travel, scale 1 + (k - 1) x 0.06 (never above 1.0x source). */
export const paperOffset = (f: number) => {
  const c = camAt(f);
  const c0 = camAt(0);
  return { x: -(c.x - c0.x) * c.k * 0.15, y: -(c.y - c0.y) * c.k * 0.15 };
};
/** The same plane for things pinned on the paper (PaperGround adds its own drift of -0.3 px/frame in y). */
export const paperTransform = (f: number) => {
  const o = paperOffset(f);
  return `translate(${o.x}px, ${o.y - f * 0.3}px) scale(${1 + (camAt(f).k - 1) * 0.06})`;
};

// -- the cut ----------------------------------------------------------------------------------------------------------------
const TeamThatBuiltLVM3: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const c = camAt(frame);
  const transform = `translate(${W / 2 - c.x * c.k}px, ${H / 2 - c.y * c.k}px) scale(${c.k})`;
  // the paper: a far plane (parallax 0.15 of the focus plane's travel, scale 1 + (k - 1) x 0.06: never above 1.0x source)
  const paperOff = paperOffset(frame);
  return (
    <AbsoluteFill>
      <SkyrootFilmLife frame={frame} seed="skyroot-17">
        <PaperGround frame={frame} cx={0} cy={0} cxRest={0} cyRest={0} k={1} offset={paperOff} scale={1 + (c.k - 1) * 0.06} />
        <Prints frame={frame} transform={paperTransform(frame)} />
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform }}>
            <Team frame={frame} />
            <Rocket />
            <Title frame={frame} />
          </div>
        </AbsoluteFill>
      </SkyrootFilmLife>
    </AbsoluteFill>
  );
};

export default TeamThatBuiltLVM3;
