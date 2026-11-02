// ---------------------------------------------------------------------------
// DifferentTastes (wip-anthropic, cut 28). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 52 frames.
//
// CHECK LINE: "Anthropic's CEO is quietly eyeing a shrimp. The viewer laughs: this is what the new money might care about."
//
// THE LINE: "But this new money might have different tastes."
// WORD -> FRAME: but 0 · this 3 · new 5 · money 9 · might 17 · have 22 · different 26 · tastes 32
// DURATION: the slot 28.042 -> 30.208 s = 2.167 s x 24 = 52 frames (f0..f51).
//
// THE MOTION: a real shrimp in a gold necklace, large on the mint page, presented like a portrait subject; it only
// sways by a fraction of a degree. From f4 Dario Amodei slides straight up from below the frame on one slow paper move, face
// in view before "different" (f26), settled by f34 just after "tastes", looking up at it. Nothing else happens: f34-51 hold on a
// slow camera creep. The camera tilts down the page as he rises, so the shrimp opens nearer the middle and makes room.
// THE GLISTEN: on "new money" light runs along the chain, f5-16, with three crisp glints, the biggest on the pendant at f11.
// Contact frames: none, nothing lands.
// SPOT INK: none. Colour: the shrimp in its real, slightly muted colour (the style's exception for a real material whose
// colour is the point) and its gold chain (a callback to "shrimp decked out in Cartier" at 3 s). Dario stays black and white.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt): shrimp/Pandalus_Hakkeijima.jpg, Pandalus borealis, Totti, CC BY-SA 4.0
// (commons File:Pandalus_borealis_Hakkeijima.jpg). dario/Dario_Disrupt04.jpg, Dario Amodei at TechCrunch Disrupt 2023,
// TechCrunch, CC BY 2.0 (commons File:Dario_Amodei_at_TechCrunch_Disrupt_2023_04.jpg). Mattes: Apple Vision, then
// scripts/clips/wip-anthropic/clean-matte-28.py to drop the interviewer's hand; bake-photo.py. The chain is drawn here.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, CutOut, PaperGround, WipFilmLife, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 52;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: 790, k: 1 },
    { f: 4, x: 540, y: 790, k: 1 },
    { f: 26, x: 536, y: 968, k: 1.012 },
    { f: DURATION, x: 532, y: 974, k: 1.045, ease: "linear" },
  ],
  DURATION,
);

// The shrimp: facing left as shot, head upper left, up on its toes.
const SHRIMP = "wip-anthropic/dt_shrimp_colour.png"; // scripts/clips/wip-anthropic/bake-shrimp-28.py
const SHRIMP_ASPECT = 1.3129;
const SHRIMP_W = 980;
const SHRIMP_H = SHRIMP_W / SHRIMP_ASPECT;
const SHRIMP_X = 540;
const SHRIMP_Y = 303;
const SHRIMP_TILT = -5;

// Dario: gaze up and left, as shot. Eyes rest about y 860 at the shrimp's left side; his chin stays above the caption bands.
const DARIO = "wip-anthropic/dt_dario.png";
const DARIO_ASPECT = 0.8261;
const DARIO_W = 1196;
const DARIO_X = 753;
const DARIO_Y = 1284;
const DARIO_TILT = 9;
const DARIO_FROM = 1140; // fully below the frame, border and shadow included
const SLIDE_START = 4;
const SLIDE_DUR = 30;
const SLIDE_EASE = Easing.bezier(0.42, 0, 0.5, 1); // paper ease, gentler at the peak: about 71 px a frame, so it reads as a slide

// The chain, in the shrimp print's own 1100 x 838 space.
const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F7E29A";
const CHAIN_P0 = [414, 404];
const CHAIN_P1 = [432, 512];
const CHAIN_P2 = [338, 470];
const LINKS = 15;
const GOLD_EDGE = "#5E430E";
const chainAt = (t: number) => {
  const u = 1 - t;
  return {
    x: u * u * CHAIN_P0[0] + 2 * u * t * CHAIN_P1[0] + t * t * CHAIN_P2[0],
    y: u * u * CHAIN_P0[1] + 2 * u * t * CHAIN_P1[1] + t * t * CHAIN_P2[1],
  };
};

// The glisten on "new money": light runs along the chain from the neck's top to its end, f5-16, and catches as three
// crisp glints, the biggest on the pendant on "money". Nothing is drawn outside these frames.
const GLINT_WARM = "#FFF8E2";
const RUN_START = 5;
const RUN_END = 16;
const RUN_WIDTH = 0.13; // of the chain's length
const envelope = (frame: number, peak: number, half: number) => {
  const d = Math.abs(frame - peak) / half;
  return d >= 1 ? 0 : Math.cos((d * Math.PI) / 2) ** 2;
};
const starPath = (r: number, waist: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rr = i % 2 === 0 ? r : waist;
    pts.push(`${(Math.sin(a) * rr).toFixed(3)} ${(-Math.cos(a) * rr).toFixed(3)}`);
  }
  return `M ${pts.join(" L ")} Z`;
};
const Glint: React.FC<{ x: number; y: number; r: number; env: number; deg: number }> = ({ x, y, r, env, deg }) =>
  env <= 0 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${deg}) scale(${0.25 + 0.75 * env})`}>
      <path d={starPath(r, r * 0.09)} fill={GLINT_WARM} />
      <path d={starPath(r * 0.4, r * 0.06)} fill={GLINT_WARM} transform="rotate(45)" />
    </g>
  );

const GoldChain: React.FC<{ frame: number }> = ({ frame }) => {
  const links = Array.from({ length: LINKS }, (_, i) => {
    const t = i / (LINKS - 1);
    const a = chainAt(Math.max(0, t - 0.01));
    const b = chainAt(Math.min(1, t + 0.01));
    return { ...chainAt(t), deg: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI, odd: i % 2 === 1 };
  });
  // the jewel hangs straight down the page whatever the print's tilt
  const low = chainAt(0.56);
  const rad = (-SHRIMP_TILT * Math.PI) / 180;
  const down = { x: -Math.sin(rad), y: Math.cos(rad) };
  const stem = { x: low.x + down.x * 18, y: low.y + down.y * 18 };
  const jewel = { x: low.x + down.x * 40, y: low.y + down.y * 40 };
  const running = frame >= RUN_START && frame <= RUN_END;
  const runAt = -0.1 + (1.2 * (frame - RUN_START)) / (RUN_END - RUN_START);
  const flash = envelope(frame, 11, 3.5);
  return (
    <svg viewBox="0 0 1100 838" width={SHRIMP_W} height={SHRIMP_H} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {/* where it presses on the body */}
      <g opacity={0.4} transform="translate(2 5)">
        {links.map((l, i) => (
          <ellipse key={i} cx={l.x} cy={l.y} rx={12} ry={9} fill="#2A0F06" />
        ))}
        <circle cx={jewel.x} cy={jewel.y} r={25} fill="#2A0F06" />
      </g>
      {/* a dark keyline, so gold holds on the shrimp's colour */}
      {links.map((l, i) => (
        <ellipse key={i} cx={l.x} cy={l.y} rx={l.odd ? 12.5 : 11.5} ry={l.odd ? 7 : 9.5} fill={GOLD_EDGE} transform={`rotate(${l.deg} ${l.x} ${l.y})`} />
      ))}
      <line x1={low.x} y1={low.y} x2={stem.x} y2={stem.y} stroke={GOLD_EDGE} strokeWidth={10} />
      <circle cx={jewel.x} cy={jewel.y} r={25} fill={GOLD_EDGE} />
      {links.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.deg})`}>
          <ellipse rx={l.odd ? 10.5 : 9.5} ry={l.odd ? 5 : 7.5} fill={GOLD} />
          <ellipse cx={-1} cy={-2} rx={5} ry={1.9} fill={GOLD_LIGHT} />
        </g>
      ))}
      <line x1={low.x} y1={low.y} x2={stem.x} y2={stem.y} stroke={GOLD} strokeWidth={6} />
      <circle cx={jewel.x} cy={jewel.y} r={22.5} fill={GOLD} />
      <path d={`M ${jewel.x - 13} ${jewel.y - 4} A 14 14 0 0 1 ${jewel.x - 2} ${jewel.y - 14}`} fill="none" stroke={GOLD_LIGHT} strokeWidth={5} strokeLinecap="round" />
      {running
        ? links.map((l, i) => {
            const on = Math.exp(-(((i / (LINKS - 1) - runAt) / RUN_WIDTH) ** 2));
            return on < 0.02 ? null : (
              <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.deg})`}>
                <ellipse rx={l.odd ? 10.5 : 9.5} ry={l.odd ? 5 : 7.5} fill={GLINT_WARM} opacity={on} />
              </g>
            );
          })
        : null}
      {flash > 0 ? <circle cx={jewel.x} cy={jewel.y} r={22.5} fill={GLINT_WARM} opacity={flash * 0.55} /> : null}
      <Glint {...chainAt(0.22)} r={36} env={envelope(frame, 8, 2.5)} deg={8 + (frame - 8) * 3} />
      <Glint x={jewel.x + 6} y={jewel.y - 8} r={72} env={flash} deg={-6 + (frame - 11) * 2.5} />
      <Glint {...chainAt(0.9)} r={38} env={envelope(frame, 14.5, 2.5)} deg={14 + (frame - 14.5) * 3} />
    </svg>
  );
};

/** The shrimp's colour print: the kit's print grain and contact shadow without its greyscale. The border is in the bake. */
const ColourPrint: React.FC = () => (
  <div style={{ position: "absolute", inset: 0 }}>
    <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
      <defs>
        <filter id="dt-shrimp-print" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.55 0.95" numOctaves={2} seed={28} result="n0" />
          <feColorMatrix in="n0" type="matrix" values="2.4 0 0 0 -0.7  2.4 0 0 0 -0.7  2.4 0 0 0 -0.7  0 0 0 0 1" result="n" />
          <feComposite in="SourceGraphic" in2="n" operator="arithmetic" k1={0.18} k2={0.91} k3={0.032} k4={-0.016} result="grained" />
          <feComposite in="grained" in2="SourceAlpha" operator="in" result="print" />
          <feGaussianBlur in="SourceAlpha" stdDeviation={1.6} result="sa" />
          <feOffset in="sa" dy={1.5} result="sa2" />
          <feFlood floodColor="#0E1F1A" floodOpacity={0.36} result="ca" />
          <feComposite in="ca" in2="sa2" operator="in" result="s1" />
          <feGaussianBlur in="SourceAlpha" stdDeviation={8} result="sb" />
          <feOffset in="sb" dy={6} result="sb2" />
          <feFlood floodColor="#0E1F1A" floodOpacity={0.24} result="cb" />
          <feComposite in="cb" in2="sb2" operator="in" result="s2" />
          <feMerge>
            <feMergeNode in="s2" />
            <feMergeNode in="s1" />
            <feMergeNode in="print" />
          </feMerge>
        </filter>
      </defs>
    </svg>
    <div style={{ position: "absolute", inset: 0, filter: "url(#dt-shrimp-print)" }}>
      <Img src={staticFile(SHRIMP)} style={{ position: "absolute", inset: 0, width: SHRIMP_W, height: SHRIMP_H, maxWidth: "none" }} />
    </div>
  </div>
);

const DifferentTastes: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const up = interpolate(frame, [SLIDE_START, SLIDE_START + SLIDE_DUR], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: SLIDE_EASE });
  const sway = Math.sin(frame / 6.5) * 0.34;
  const bob = Math.sin(frame / 6.5 + 0.8) * 1.2;
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        <WipPlane cam={cam}>
          <div
            style={{
              position: "absolute",
              left: SHRIMP_X - SHRIMP_W / 2,
              top: SHRIMP_Y - SHRIMP_H / 2 + bob,
              width: SHRIMP_W,
              height: SHRIMP_H,
              transformOrigin: "42% 62%",
              transform: `rotate(${SHRIMP_TILT + sway}deg)`,
            }}
          >
            <ColourPrint />
            <GoldChain frame={frame} />
          </div>
        </WipPlane>
        <WipPlane cam={cam}>
          <CutOut
            src={DARIO}
            x={DARIO_X}
            y={DARIO_Y + (1 - up) * DARIO_FROM}
            w={DARIO_W}
            aspect={DARIO_ASPECT}
            rotate={DARIO_TILT}
            border={8}
            gamma={1.15}
            grain={0.09}
            lift={(1 - up) * 0.5}
            seed="dario"
          />
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default DifferentTastes;
