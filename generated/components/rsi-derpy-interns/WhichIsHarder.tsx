// ---------------------------------------------------------------------------
// WhichIsHarder (rsi-derpy-interns, cut 85). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 44 frames.
//
// CHECK LINE: "Navier–Stokes and continual learning sit on a balance: which is harder? It wobbles, undecided."
//
// THE LINE: "… which would be harder to solve, [Navier-Stokes or continual learning,] it wouldn't have been
// obvious …" (the slot is the bracketed part; a Quanta news card on AI solving Navier–Stokes follows).
// WORD -> FRAME: Navier -1 · -Stokes 8 · or 15 · continual 22 · learning 31 (word_tables.md, composition frames;
//   Whisper reads 2-7 frames early).
// DURATION: the slot 85.002 -> 86.837 s = 1.835 s x 23.976 = 44 frames (f0..f43).
//
// THE MOTION: one white balance (post, beam, two hanging pans), a problem card standing in each pan, all in frame
// from f0. The beam is the one motion: a damped spring chasing a target angle. It is already tipping left at f0
// (NAVIER–STOKES, lit, goes down), swings right as CONTINUAL LEARNING lights on "continual" (f15-23), and from
// f28 it rocks in a small undecided see-saw that never settles, to the last frame. A slow push-in runs the whole
// slot, anchored so the foot holds just above the caption band.
// Neutral white only: neither card is the AI here (no orange). The cards are cut 97's (millenniumWorld) look:
// white squircle outline, Roboto Condensed label at the top, one glyph below; here lucide `wind` (fluid flow) for
// Navier–Stokes and lucide `refresh-cw` (a loop) for continual learning.
//
// SOURCES: none (no figures). Glyphs: lucide `wind`, `refresh-cw` (ISC), inlined on the 24 grid.
// ---------------------------------------------------------------------------
import { DERPY_SHIFT_Y } from "./screenShift";
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BG_BASE,
  BG_DIM,
  CAM_DAMP,
  CAM_STIFF,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
  clamp01,
  iconShadow,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { INK, INK_HI, INK_LO, Label, STROKE_PX, THREAD_PX, worldPx } from "../kits/dwarkesh/alignShared";

export const FPS = 24000 / 1001;
export const DURATION = 44;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the camera ------------------------------------------------------------------------------------------------
/** the resting zoom strokes and labels are sized for (mid push) */
const K_REST = 1.03;
const K0 = 1.0;
const K1 = 1.07;
/** the balance's foot (world y) holds at this screen y through the push, just above the 1080 band */
const FOOT_SCREEN = 1058;
const CX = 540;

// --- the balance (world px) ------------------------------------------------------------------------------------
const SW = worldPx(STROKE_PX, K_REST); // the one weight
const TW = worldPx(THREAD_PX, K_REST); // threads: half of it
const PIVOT_Y = 640;
const BEAM_HALF = 316;
const HANG = 290; // hang points, from the pivot along the beam
const KNOB_R = 15;
const HOOK_R = 8.5;
const FOOT_Y = 1040;
const FOOT_HALF = 115;
/** a pan: two threads from the hook to the card's top corners, the card standing in a shallow dish */
const V_DROP = 92;
const CARD_W = 272;
const CARD_H = 262;
const PAN_HALF = CARD_W / 2 + 16;
const BOWL = 26;
const LABEL_SIZE = 42;
const LABEL_DY = 26;
const GLYPH = 88;

// --- the beam: a damped spring chasing a target angle (deg, + = right side down) ---------------------------------
const TIP_L = -4.2; // "Navier-Stokes": left goes down
const TIP_R = 3.4; // "continual learning": right goes down
const SWING_F = 13; // the target crosses over just before "or"
const ROCK_F = 28; // from here the target itself see-saws
const ROCK_A = 1.8;
const ROCK_P = 17; // frames per see-saw cycle
const BEAM_STIFF = 0.075;
const BEAM_DAMP = 0.2;
const target = (f: number) => {
  const toR = smoothstep(clamp01((f - SWING_F) / 4));
  const toRock = smoothstep(clamp01((f - ROCK_F) / 5));
  const tip = TIP_L + (TIP_R - TIP_L) * toR;
  const rock = ROCK_A * Math.sin((2 * Math.PI * (f - ROCK_F)) / ROCK_P + Math.PI);
  return tip * (1 - toRock) + rock * toRock;
};
export const BEAM: number[] = (() => {
  // warm-started: "Navier" began a frame before the slot, so at f0 the beam is already leaving level
  let a = -1.4;
  let v = -0.55;
  const pre = 0;
  const out: number[] = [];
  for (let f = pre; f <= DURATION; f++) {
    out.push(a);
    v += (target(f) - a) * BEAM_STIFF - v * BEAM_DAMP;
    a += v;
  }
  return out;
})();
const beamAt = (f: number) => BEAM[Math.max(0, Math.min(DURATION, Math.round(f)))];

// --- the camera track ------------------------------------------------------------------------------------------
const cyFor = (k: number) => FOOT_Y - (FOOT_SCREEN - 960) / k;
const CAM: { k: number; cy: number }[] = (() => {
  const tk = (f: number) => K0 + (K1 - K0) * camEase(f / DURATION, 0.8);
  let k = K0;
  let cy = cyFor(K0);
  let vk = 0.0012; // already moving at f0
  let vy = 0;
  const out = [{ k, cy }];
  for (let f = 1; f <= DURATION; f++) {
    const t = tk(f);
    vk += (t - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    const ty = cyFor(k);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    out.push({ k, cy });
  }
  return out;
})();

// --- glyphs (lucide, 24 grid) ------------------------------------------------------------------------------------
const WIND = ["M12.8 19.6A2 2 0 1 0 14 16H2", "M17.5 8a2.5 2.5 0 1 1 2 4H2", "M9.8 4.4A2 2 0 1 1 11 8H2"];
const LOOP = [
  "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",
  "M21 3v5h-5",
  "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",
  "M8 16H3v5",
];
const Glyph: React.FC<{ x: number; y: number; size: number; paths: string[] }> = ({ x, y, size, paths }) => {
  const s = size / 24;
  return (
    <g
      transform={`translate(${(x - 12 * s).toFixed(3)} ${(y - 12 * s).toFixed(3)}) scale(${s.toFixed(5)})`}
      fill="none"
      stroke={INK}
      strokeWidth={SW / s}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  );
};

// --- one pan with its card -----------------------------------------------------------------------------------------
type Pan = { hx: number; hy: number };
const panGeom = ({ hy }: Pan) => {
  const cardTop = hy + V_DROP;
  const rim = cardTop + CARD_H + SW / 2;
  return { cardTop, rim };
};
const PanSvg: React.FC<{ p: Pan; lit: number; paths: string[] }> = ({ p, lit, paths }) => {
  const { cardTop, rim } = panGeom(p);
  const cl = p.hx - CARD_W / 2;
  const cr = p.hx + CARD_W / 2;
  const l = p.hx - PAN_HALF;
  const r = p.hx + PAN_HALF;
  const threads = `M${cl} ${cardTop} L${p.hx} ${p.hy} L${cr} ${cardTop}`;
  const bowl = `M${l} ${rim} L${r} ${rim} C${r - 34} ${rim + BOWL * 1.33} ${l + 34} ${rim + BOWL * 1.33} ${l} ${rim} Z`;
  const op = INK_LO + (INK_HI - INK_LO) * lit;
  return (
    <>
      <path d={threads} fill="none" stroke={INK} strokeWidth={TW} strokeLinejoin="round" strokeLinecap="round" />
      <path d={bowl} fill={INK} />
      <g opacity={op}>
        <path
          d={squirclePath(CARD_W, CARD_H)}
          transform={`translate(${(p.hx - CARD_W / 2).toFixed(3)} ${cardTop.toFixed(3)})`}
          fill="none"
          stroke={INK}
          strokeWidth={SW}
        />
        <Glyph x={p.hx} y={cardTop + CARD_H - 30 - GLYPH / 2} size={GLYPH} paths={paths} />
      </g>
    </>
  );
};
const PanLabel: React.FC<{ k: number; p: Pan; lit: number; lines: string[] }> = ({ k, p, lit, lines }) => {
  const { cardTop } = panGeom(p);
  const size = worldPx(LABEL_SIZE, K_REST);
  return (
    <>
      {lines.map((t, i) => (
        <Label
          key={i}
          k={k}
          x={p.hx}
          y={cardTop + LABEL_DY + i * size * 1.04}
          text={t}
          inT={1}
          size={size}
          opacity={INK_LO + (INK_HI - INK_LO) * lit}
        />
      ))}
    </>
  );
};

// --- lighting -------------------------------------------------------------------------------------------------------
/** CONTINUAL LEARNING lights on "continual" (Whisper 22, read early): f15-23 */
const LIGHT_R0 = 15;
const LIGHT_R1 = 23;

const WhichIsHarder: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = CAM[Math.max(0, Math.min(DURATION, frame))];
  const s = sway(frame);
  const k = cam.k;
  const { tx, ty } = worldTransform(CX + s.dx, cam.cy + s.dy, k);

  const a = beamAt(frame);
  const rad = (a * Math.PI) / 180;
  const along = (d: number) => ({ x: CX + d * Math.cos(rad), y: PIVOT_Y + d * Math.sin(rad) });
  const hl = along(-HANG);
  const hr = along(HANG);
  const panL: Pan = { hx: hl.x, hy: hl.y };
  const panR: Pan = { hx: hr.x, hy: hr.y };
  const litL = 1;
  const litR = smoothstep(clamp01((frame - LIGHT_R0) / (LIGHT_R1 - LIGHT_R0)));

  const world = {
    position: "absolute" as const,
    left: 0,
    top: 0,
    width: 1080,
    height: 1920,
    transformOrigin: "0 0",
    transform: `translate(${tx}px, ${ty + DERPY_SHIFT_Y}px) scale(${k})`,
  };
  const svgStyle = { position: "absolute" as const, left: 0, top: 0, overflow: "visible" as const };
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground src="grid-background.jpg" blur={13} dim={BG_DIM} frame={frame} cy={cam.cy} cyRest={CAM[0].cy} k={k} parallax={0.15} />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div style={world}>
          <svg width={1080} height={1920} style={svgStyle}>
            <g style={{ filter: iconShadow(k) }}>
              {/* the stand: foot and post */}
              <line x1={CX - FOOT_HALF} y1={FOOT_Y} x2={CX + FOOT_HALF} y2={FOOT_Y} stroke={INK} strokeWidth={SW} strokeLinecap="round" />
              <line x1={CX} y1={PIVOT_Y} x2={CX} y2={FOOT_Y} stroke={INK} strokeWidth={SW} strokeLinecap="round" />
              {/* the pans hang plumb from the hooks */}
              <PanSvg p={panL} lit={litL} paths={WIND} />
              <PanSvg p={panR} lit={litR} paths={LOOP} />
              {/* the beam, its hooks and the pivot knob */}
              <g transform={`rotate(${a.toFixed(4)} ${CX} ${PIVOT_Y})`}>
                <line x1={CX - BEAM_HALF} y1={PIVOT_Y} x2={CX + BEAM_HALF} y2={PIVOT_Y} stroke={INK} strokeWidth={SW} strokeLinecap="round" />
                <circle cx={CX - HANG} cy={PIVOT_Y} r={HOOK_R} fill={INK} />
                <circle cx={CX + HANG} cy={PIVOT_Y} r={HOOK_R} fill={INK} />
              </g>
              <circle cx={CX} cy={PIVOT_Y} r={KNOB_R} fill={INK} />
            </g>
          </svg>
          <PanLabel k={k} p={panL} lit={litL} lines={["NAVIER–", "STOKES"]} />
          <PanLabel k={k} p={panR} lit={litR} lines={["CONTINUAL", "LEARNING"]} />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default WhichIsHarder;
