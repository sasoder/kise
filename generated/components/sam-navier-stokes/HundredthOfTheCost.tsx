// ---------------------------------------------------------------------------
// HundredthOfTheCost (sam-navier-stokes, cut 1), Rev 2. Cheeky Pint style (stout) (styles/cheeky-pint.md), with the
// user's real vortex picture blended in as a 2.5D cut-out (the reality-plus-graphic idea of the Kelly Johnson clip,
// in Cheeky Pint material). Opaque 1080x1920, 23.976 fps, 96 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "A year on, the same Navier–Stokes proof could be redone for a hundredth of what it first cost."
//
// THE LINE: "[I bet we could redo Navier-]Stokes at 1/100th of the cost a year from when it was done."
// WORD -> FRAME (from the composition start): (Navier -10) · Stokes 8 · at 16 · 1 29 · 100th 37 · of 51 · the 54 ·
//   cost 56 · a 65 · year 72 · from 79 · when 82 · it 85 · was 86 · done 89 · (next line "So" 96).
// DURATION: the slot 1.334667 -> 5.338667 s = 4.004 s x 23.976 = 96 frames (f0..f95).
//
// REV 2 (the user: "pretty boring ... the camera can be more dynamic ... stacks of money to show the cost ... start
// with the navier stokes thing in the middle and then it pans to the right"): the same newsprint page, vortex
// cut-out, masthead (headline left, dateline right) and a new staging, cost object and camera. Rev 2b (the director's
// review of 2a): a real pinhole camera (hundredthCamera.ts), so the money stands tall and shows its tops and one side;
// the money holds the frame through "1/100th of the cost"; the end is a deliberate two-shot.
//
// THE MOTION: ONE continuous camera track (raised-cosine moves summed: slow at the ends, fastest mid-truck, never
// still). f0: tight on the vortex photo (k 1.5, the vortex filling the width), the headline above it, already moving
// right. "Stokes at" (f0-f30): the camera trucks RIGHT, lifts and lowers its angle (phi 64 -> ~48), and
// reveals the cost standing on the paper beside the photo: 100 banknote bundles in a stepped mound of 2 columns x 5
// rows (stacks of 14 / 12 / 10 / 8 / 6 from back to front), the bundles from hundredthMoney.tsx (cream-sage notes,
// ONE amber bank strap each), ~85% of the frame width at f37. "1/100th of the cost" (f30-f56): a slow push and drift
// on the money while a wave runs from the mound's front-right corner to its back-left; stack by stack the bundles
// sink into the page (the top goes down, the seams with it) and tone from notes through dimmed notes into printed
// outlines in the paper's dim ink (tone and height, never opacity); the back-left stack (nearest the photo) sinks
// last and keeps ONE bundle standing, amber-strapped and lit, on "cost" (f56). f56-f70: the camera pulls back LEFT and
// rises toward top-down until the dateline is whole (~f62); on "year" its last digit rolls 6 -> 7 on a feathered drum
// (f63 -> f71). f72-95: the two-shot (the vortex left of centre, the lit bundle ~240 px wide right of it, the whole
// imprint footprint, the masthead above), on a slow drift that never stops. The roll is derived from the camera's x
// velocity, so it returns to zero.
// Cause before effect: the wave front is the cause; a stack's first sinking frame is start_i = WAVE.f0 + perPitch x
// its distance from the source, its last start_i + SINK (the one that stays: f56).
// AMBER = money spent on compute for the math (the cost: the bank straps). The photo = the proof itself. Dim ink =
// spent cost.
//
// THE 3D: the page is the plane z = 0; the camera is a pinhole (F 2000) at elevation phi and azimuth psi. Every plane
// parallel to the page (the paper and its type, the photo 40 px proud, each bundle's top note) is drawn with a CSS
// matrix3d homography; the bundles' sides, straps and seams are projected point by point; painter's order by depth.
// camCheck3 (the house numbers in screen space): max |dv| 2.38 px/f^2 (f10), max speed 52 px/f at f1 (the opening is a
// fast mid-move, easing from f0; under 45 from f10), min speed 0.42 px/f.
//
// SOURCES: the vortex picture is OpenAI's own illustration of the Navier–Stokes blow-up (the original of the user's
// reference; assets-src/sam-navier-stokes/openai_vortex_hires.png, 1300x1452, unlabelled), cut out by
// assets-src/sam-navier-stokes/make_vortex_cutout.py -> vortexData.ts. The paper tile: make_paper_tile.py ->
// paperData.ts. The dates: OpenAI published the Navier–Stokes result on Sept 8 2026 (COMMON.md facts); "a year from
// when it was done" -> SEPT 2027. No dollar figures, numbers or arrows on screen besides the dateline.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, FONT_LABEL, FONT_NUM, Label, StoutStage, TNUM_ADV, TRACK, clamp01, labelWidth, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { PhotoCutOut, StoutShadow, photoCutOutSil } from "../sam-pricing-tokens/pricingShared";
import { VORTEX_AXIS_U, VORTEX_BOX, VORTEX_H, VORTEX_SRC, VORTEX_W } from "./vortexData";
import { PAPER_SRC, PAPER_TILE } from "./paperData";
import { BUNDLE, Stack, StackShadow, f3, type StackSpec, type StackState } from "./hundredthMoney";
import { F, depthOf, makeTrack, planeCss, viewOf, type Move, type Shot, type View } from "./hundredthCamera";

export const FPS = 24000 / 1001;
export const DURATION = 96;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the camera: a real pinhole camera (hundredthCamera.ts), ONE track of raised-cosine moves -------------------------------
// f0: tight on the vortex from high above (phi 62), already trucking right. The truck lowers the camera (phi -> ~38),
// swings it (psi) and pulls a little out as it lands on the money (~f30); a slow push holds the mound while 99 go
// (f30-56); then it rises (phi ~52), comes back left and pulls out to the two-shot (f56-88); a slow drift to the end.
const SHOT0: Shot = { tx: 540, ty: 749, tz: 0, k: 1.5, phi: 64, psi: 0, rho: 0 };
const MOVES: Move[] = [
  { c: -6, w: 26, tx: 660, ty: 170, tz: 110, k: 0.72, phi: -14, psi: -4 }, // the truck right, at speed at f0 ...
  { c: 17, w: 26, tx: 640, ty: 170, tz: 150, k: 0.67, phi: -13, psi: -5 }, // ... and its long settle on the money (to ~f39)
  { c: 46, w: 26, tx: 20, k: 1.05, psi: 2 }, // the slow push on the mound while 99 go
  { c: 73, w: 20, tx: -405, ty: -80, tz: -260, k: 0.63, phi: 26, psi: 5 }, // up, back left and out to the two-shot (f53..f93)
  { c: 110, w: 50, tx: -30, k: 0.97, phi: 2 }, // the drift under the end
];
const track = makeTrack(SHOT0, MOVES);
const ROLL = 0.025; // degrees of roll per world px / frame of the target's x velocity: the camera banks into the truck
export const shotAt = (f: number): Shot => {
  const s = track(f);
  return { ...s, rho: ROLL * (track(f + 0.5).tx - track(f - 0.5).tx) };
};

// --- the page -------------------------------------------------------------------------------------------------------
const PAGE = { x0: -900, y0: -3200, x1: 2900, y1: 2500 } as const;
const PW = PAGE.x1 - PAGE.x0;
const PH = PAGE.y1 - PAGE.y0;
// the masthead over the spread: the headline flush left over the photo, the dateline flush right over the money
const TEXT_L = 240;
const TEXT_R = 1741;
const RULE = { y: 236, thick: 3, thin: 1.25, gap: 5 } as const; // the double masthead rule
const DATE = { base: 340, px: 92, right: TEXT_R } as const; // dateline baseline, size (world px)
const HEAD = { base: 340, px: 88, left: TEXT_L } as const; // the headline

// --- the photo: the vortex, standing H_PHOTO proud of the page ---------------------------------------------------------
const H_PHOTO = 40;
const PHOTO_ASPECT = VORTEX_W / VORTEX_H;
const CONTENT = { w: 600, top: 420 } as const; // the content box (VORTEX_BOX): 600 wide, its axis on x 540
const PHOTO = (() => {
  const w = CONTENT.w / ((VORTEX_BOX[2] - VORTEX_BOX[0]) / VORTEX_W);
  const h = w / PHOTO_ASPECT;
  const y = CONTENT.top - (VORTEX_BOX[1] / VORTEX_H) * h;
  return { x: 540 - (VORTEX_AXIS_U - 0.5) * w, cy: y + h / 2, h, w };
})();
const PHOTO_PAD = 60;
const PHOTO_Q = 2; // css px per world px of the photo's plane (rasterised at >= its screen size)
const PHOTO_BOX = { x0: PHOTO.x - PHOTO.w / 2 - PHOTO_PAD, y0: PHOTO.cy - PHOTO.h / 2 - PHOTO_PAD, w: PHOTO.w + 2 * PHOTO_PAD, h: PHOTO.h + 2 * PHOTO_PAD };

// --- the cost: 100 bundles in a stepped mound of 10 stacks (2 across, 5 deep), right of the photo -----------------------
// rows back -> front hold 14, 12, 10, 8, 6 bundles a stack (2 x 50 = 100): the back rows tower over the front ones
const COLS = 2;
const ROWS = 5;
const ROW_N = [14, 12, 10, 8, 6] as const;
const GX = 16;
const GY = 18;
const WALL = { x0: 945, yFront: 1500 } as const; // x0: just off the tight f0 frame (screen x ~1121 at f0); yFront: the front row's near edge
const WALL_W = COLS * BUNDLE.w + (COLS - 1) * GX;
const SURV = { col: 0, row: 0 } as const; // the one that stays: the back-left stack, nearest the photo (beside it in the two-shot)
const SINK = 12;
const stackXY = (col: number, row: number) => ({ x: WALL.x0 + col * (BUNDLE.w + GX), y: WALL.yFront - BUNDLE.d - (ROWS - 1 - row) * (BUNDLE.d + GY) });
// the wave starts at the mound's front-right corner (nearest the eye) and runs back and left across it; its far end
// is the one that stays (back row, nearest the photo)
const WAVE_SRC = { x: WALL.x0 + WALL_W + 20, y: WALL.yFront + 20 };
const distOf = (col: number, row: number) => {
  const p = stackXY(col, row);
  return Math.hypot(p.x + BUNDLE.w / 2 - WAVE_SRC.x, p.y + BUNDLE.d / 2 - WAVE_SRC.y) / (BUNDLE.w + GX);
};
const ALL: { col: number; row: number }[] = [];
for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) ALL.push({ col, row });
const D_MIN = Math.min(...ALL.map((p) => distOf(p.col, p.row)));
const D_SURV = distOf(SURV.col, SURV.row);
/** the wave: its first stack starts sinking on "1" (f29), the one that stays finishes on "cost" (f56) */
const WAVE = { f0: 29, f1: 56, perPitch: (56 - SINK - 29) / (D_SURV - D_MIN) } as const;
const STACKS: StackSpec[] = ALL.map(({ col, row }, i) => {
  const p = stackXY(col, row);
  return { i, col, row, x: p.x, y: p.y, n: ROW_N[row], start: WAVE.f0 + (distOf(col, row) - D_MIN) * WAVE.perPitch, survivor: col === SURV.col && row === SURV.row };
});
const SURV_START = WAVE.f0 + (D_SURV - D_MIN) * WAVE.perPitch;
const LAST = Math.max(...STACKS.map((s) => s.start)) + SINK;
if (LAST > 56.5) throw new Error(`HundredthOfTheCost: the drain ends at f${LAST.toFixed(1)}, after "cost" (f56)`);
if (STACKS.some((s) => !s.survivor && s.start > SURV_START)) throw new Error("HundredthOfTheCost: the one that stays is not the wave's last");
if (STACKS.reduce((a, s) => a + s.n, 0) !== 100) throw new Error("HundredthOfTheCost: not 100 bundles");
/** a stack's state at frame f: height (world px) and tone (0 notes .. 1 printed outline) */
const stackAt = (s: StackSpec, f: number): StackState => {
  const u = smoothstep(clamp01((f - s.start) / SINK));
  const H = s.n * BUNDLE.t;
  if (s.survivor) return { s, h: H - (H - BUNDLE.t) * u, t: 0 };
  const t = smoothstep(clamp01((f - s.start - 1.5) / (SINK - 1.5))); // the height leads, the tone follows
  return { s, h: H * (1 - u), t };
};
const SURV_SPEC = STACKS.find((s) => s.survivor) as StackSpec;
/** the one that stays is lit: its light comes up as the wave reaches it */
const litAt = (f: number) => smoothstep(clamp01((f - (SURV_SPEC.start + 2)) / 14));

// --- the dateline drum: SEPT 202[6 -> 7] ------------------------------------------------------------------------------
const ROLL_F = { f0: 63, f1: 71 } as const;
const rollAt = (f: number) => smoothstep((f - ROLL_F.f0) / (ROLL_F.f1 - ROLL_F.f0));

const Dateline: React.FC<{ f: number }> = ({ f }) => {
  const uid = `dl${useId().replace(/[^A-Za-z0-9]/g, "")}`;
  const fs = DATE.px;
  const sept = labelWidth("SEPT", fs);
  const space = 0.36 * fs;
  const adv = TNUM_ADV * fs + TRACK.numeral * fs;
  const yearW = 4 * adv - TRACK.numeral * fs;
  const x0 = DATE.right - (sept + space + yearW);
  const yx = x0 + sept + space; // the year's left edge
  const digitX = (i: number) => yx + i * adv + (TNUM_ADV * fs) / 2;
  const r = rollAt(f);
  const lineH = fs;
  const speed = (rollAt(f + 0.5) - rollAt(f - 0.5)) * lineH; // world px per frame
  const blur = 0.32 * speed;
  // the drum's window: the resting digit's cap box + a feather F above and below (the resting digit is never feathered)
  const F = 0.16 * fs;
  const top = DATE.base - 0.729 * fs - F;
  const bot = DATE.base + F;
  const fe = F / (bot - top);
  const numStyle: React.CSSProperties = { fontFeatureSettings: '"tnum" 1, "lnum" 1' };
  return (
    <g fill={COLOR.inkDark}>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(bot)}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset={f3(fe)} stopColor="#fff" stopOpacity="1" />
          <stop offset={f3(1 - fe)} stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(digitX(3) - fs)} y={f3(top)} width={f3(2 * fs)} height={f3(bot - top)}>
          <rect x={f3(digitX(3) - fs)} y={f3(top)} width={f3(2 * fs)} height={f3(bot - top)} fill={`url(#${uid}g)`} />
        </mask>
        <filter id={`${uid}b`} x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur stdDeviation={`0 ${f3(blur)}`} />
        </filter>
      </defs>
      <text x={f3(x0)} y={f3(DATE.base)} fontFamily={FONT_LABEL} fontWeight={500} fontSize={f3(fs)} letterSpacing={`${TRACK.label}em`} style={{ fontFeatureSettings: '"case" 1' }}>
        SEPT
      </text>
      {["2", "0", "2"].map((d, i) => (
        <text key={i} x={f3(digitX(i))} y={f3(DATE.base)} textAnchor="middle" fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(fs)} style={numStyle}>
          {d}
        </text>
      ))}
      <g mask={`url(#${uid}m)`}>
        <g filter={blur > 0.05 ? `url(#${uid}b)` : undefined} fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(fs)} style={numStyle}>
          {r < 1 ? (
            <text x={f3(digitX(3))} y={f3(DATE.base - r * lineH)} textAnchor="middle">
              6
            </text>
          ) : null}
          {r > 0 ? (
            <text x={f3(digitX(3))} y={f3(DATE.base + (1 - r) * lineH)} textAnchor="middle">
              7
            </text>
          ) : null}
        </g>
      </g>
    </g>
  );
};

// --- the page ---------------------------------------------------------------------------------------------------------
const MONEY_LIGHT = { x: WALL.x0 + WALL_W * 0.5, y: WALL.yFront - 450, r: 1100 } as const;
const Page: React.FC = () => {
  const uid = `pg${useId().replace(/[^A-Za-z0-9]/g, "")}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}p`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1920">
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <radialGradient id={`${uid}k`} gradientUnits="userSpaceOnUse" cx="260" cy="260" r="1500">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity="0.2" />
          <stop offset="0.5" stopColor={COLOR.amberHot} stopOpacity="0.07" />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </radialGradient>
        {/* a warm light over the money column */}
        <radialGradient id={`${uid}m`} gradientUnits="userSpaceOnUse" cx={MONEY_LIGHT.x} cy={MONEY_LIGHT.y} r={MONEY_LIGHT.r}>
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity="0.16" />
          <stop offset="0.55" stopColor={COLOR.amberHot} stopOpacity="0.05" />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </radialGradient>
        <pattern id={`${uid}f`} patternUnits="userSpaceOnUse" x="0" y="0" width={PAPER_TILE} height={PAPER_TILE}>
          <image href={PAPER_SRC} x="0" y="0" width={PAPER_TILE} height={PAPER_TILE} />
        </pattern>
      </defs>
      <rect x={PAGE.x0} y={PAGE.y0} width={PAGE.x1 - PAGE.x0} height={PAGE.y1 - PAGE.y0} fill={`url(#${uid}p)`} />
      <rect x={PAGE.x0} y={PAGE.y0} width={PAGE.x1 - PAGE.x0} height={PAGE.y1 - PAGE.y0} fill={`url(#${uid}f)`} style={{ mixBlendMode: "multiply" }} />
      <rect x={PAGE.x0} y={PAGE.y0} width={PAGE.x1 - PAGE.x0} height={PAGE.y1 - PAGE.y0} fill={`url(#${uid}k)`} />
      <rect x={PAGE.x0} y={PAGE.y0} width={PAGE.x1 - PAGE.x0} height={PAGE.y1 - PAGE.y0} fill={`url(#${uid}m)`} />
      {/* masthead: the thin double rule, across both columns */}
      <rect x={TEXT_L} y={RULE.y} width={TEXT_R - TEXT_L} height={RULE.thick} fill={COLOR.inkDark} />
      <rect x={TEXT_L} y={RULE.y + RULE.thick + RULE.gap} width={TEXT_R - TEXT_L} height={RULE.thin} fill={COLOR.inkDark} />
    </g>
  );
};

/** the light on the paper round the one that stays */
const SurvivorGlow: React.FC<{ lit: number }> = ({ lit }) => {
  if (lit < 0.005) return null;
  const s = SURV_SPEC;
  return (
    <g>
      <defs>
        <radialGradient id="hsGlow" gradientUnits="userSpaceOnUse" cx={s.x + BUNDLE.w / 2} cy={s.y + BUNDLE.d / 2} r={520}>
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={f3(0.6 * lit)} />
          <stop offset="0.45" stopColor={COLOR.amberHot} stopOpacity={f3(0.22 * lit)} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={s.x + BUNDLE.w / 2} cy={s.y + BUNDLE.d / 2} rx={620} ry={520} fill="url(#hsGlow)" />
    </g>
  );
};

export const PROBE = () => ({ STACKS, stackAt, BUNDLE, labelWidth, HEAD, DATE, PHOTO });

/** a plane of the page world drawn by CSS 3D (local px = world px x q) */
const Plane: React.FC<{ v: View; h: number; box: { x0: number; y0: number; w: number; h: number }; q?: number; children: React.ReactNode }> = ({ v, h, box, q = 1, children }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: box.w * q, height: box.h * q, transformOrigin: "0 0", transform: planeCss(v, h, box.x0, box.y0, 1 / q, 1 / q) }}>
    <svg width={box.w * q} height={box.h * q} viewBox={`${f3(box.x0)} ${f3(box.y0)} ${f3(box.w)} ${f3(box.h)}`} style={{ display: "block", overflow: "visible" }}>
      {children}
    </svg>
  </div>
);

const HundredthOfTheCost: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const shot = shotAt(f);
  const v = viewOf(shot);
  const states = STACKS.map((s) => stackAt(s, f));
  // painter's order: the farthest from the camera first
  const order = [...states].sort((a, b) => depthOf(v, b.s.x + BUNDLE.w / 2, b.s.y + BUNDLE.d / 2, b.h / 2) - depthOf(v, a.s.x + BUNDLE.w / 2, a.s.y + BUNDLE.d / 2, a.h / 2));
  const sil = photoCutOutSil({ src: VORTEX_SRC, x: PHOTO.x, y: PHOTO.cy, h: PHOTO.h, aspect: PHOTO_ASPECT });
  const lit = litAt(f);
  const kAt = (x: number, y: number) => F / depthOf(v, x, y, 0); // screen px per world px there
  const scene = (
    <AbsoluteFill>
      <Plane v={v} h={0} box={{ x0: PAGE.x0, y0: PAGE.y0, w: PW, h: PH }}>
        <Page />
        <Dateline f={f} />
        <Label x={HEAD.left} y={HEAD.base} k={1} px={HEAD.px} text="NAVIER–STOKES" tone="dark" anchor="start" />
        <SurvivorGlow lit={lit} />
        <StackShadow stacks={states} />
        <StoutShadow parts={sil} s={1.5} elevation="lifted" />
      </Plane>
      <Plane v={v} h={H_PHOTO} box={PHOTO_BOX} q={PHOTO_Q}>
        <PhotoCutOut src={VORTEX_SRC} x={PHOTO.x} y={PHOTO.cy} h={PHOTO.h} aspect={PHOTO_ASPECT} k={1} shadow={false} />
      </Plane>
      {order.map((st) => (
        <Stack key={st.s.i} st={st} v={v} k={kAt(st.s.x + BUNDLE.w / 2, st.s.y + BUNDLE.d)} lit={st.s.survivor ? lit : 0} />
      ))}
    </AbsoluteFill>
  );
  return <StoutStage S={f} cam={{ x: 540, y: 960, k: 1 }} sway={false} overlay={scene} />;
};

export default HundredthOfTheCost;
