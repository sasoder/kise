import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, camEase, CAM_LIFT, clamp01, hash } from "./fieldShared";
import {
  FONT_LABEL,
  INK,
  LABEL_IN,
  LABEL_RISE_PX,
  LABEL_TRACKING,
  LABEL_WEIGHT,
  STROKE_PX,
} from "./alignShared";

// ---------------------------------------------------------------------------
// WinAllTheBattles — YouTube war essay: "It is not whether you win all the
// battles…" (the war payoff comes later in the edit, not here).
//
// Orange Dwarkesh orange/white vocabulary as a TRANSPARENT overlay: no grid,
// no field, no vignette, no opaque fill. 1080x1920, 24 fps, 48 frames (2.0 s),
// holds resolved on the last frame (the editor owns the out).
//
// "All the battles" made literal and countable: five battles, each a Lucide
// `swords` (white outline). One continuous left-to-right wave wins every one —
// a Lucide `flag` in ripe orange is planted above each — and the count under
// the row reaches 5 / 5. "All" = the count full.
//
// GESTURES — each with the word it serves:
//   1. f0–15   "the battles"  five swords glyphs slide up 24 px + fade in,
//                             ease-out, 2 f stagger left→right (each 8 f).
//      f4–14   "the battles"  label BATTLES WON 0 / 5 slides up + fades in.
//   2. f10–36  "win"          the win wave: flag n starts at f10 + 4n; pole
//                             draws up from its base (5 f, ease-out), cloth
//                             unfurls from the pole (f+4 → f+10, scaleX from
//                             the pole edge, non-scaling stroke, with a flutter
//                             that decays into the idle wave).
//                             Overlapping — 2–3 flags in motion at once.
//                             Its swords glyph dips ≤3.5 px and back as the
//                             pole plants (the only reaction).
//      f18/22/26/30/34 "all"  the orange numerator hard-ticks 1…5 as each
//                             cloth lands (reads landed at 96%, 2 f before
//                             its ease ends; the last cloth settles by f36).
//   3. f36–47  (hold)         5 / 5, all flags up; the cloths keep a ≤2 px
//                             travelling wave, hashed phase + rate per flag.
//   4. f0–47   (camera)       one eased creep-in k 1.00 → 1.07 about the
//                             group centre (540, 835), still moving at f47.
//
// Nothing else. No sparkles, rings, flashes, glow, strike-through.
//
// SHADOW: swords, flags and label share ONE shadow, `battleShadow` —
// drop-shadow(0 2px 6px rgba(0,0,0,.45)) in screen px — stronger than the
// house iconShadow, because white outlines over bright footage need it.
//
// Cut 2 (AchieveTheObjective) joins on this cut's f47, so the row, the flag
// glyph, the camera transform, the shadow and the label style are exported
// and rendered by the same code in both cuts.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 48;

export const schema = z.object({
  previewBg: z.enum(["none", "dark", "light"]),
});
export const defaultProps = schema.parse({ previewBg: "none" });

export const PREVIEW_BG = { dark: "#2a2a2a", light: "#d8d4cc" } as const;
export const previewFill = (bg: z.infer<typeof schema>["previewBg"]) =>
  bg === "none" ? undefined : PREVIEW_BG[bg];

// --- Camera -----------------------------------------------------------------
// One creep over a virtual 62-frame span, so at f47 it has reached ~1.072 and
// is still moving (the hold is never parked). A direct eased curve rather than
// runCamera: over 48 frames the shared damper lags too far to land the move.
const CAM_SPAN = 62;
const K_TOP = 1.085;
export const kAt = (f: number) => 1 + (K_TOP - 1) * camEase(f / CAM_SPAN, 1);
export const K_END = kAt(DURATION - 1);
const K_MID = (1 + K_END) / 2;
export const CX = 540;
export const CY = 960 - CAM_LIFT; // 835: above the caption band

/** The camera: world point (CX, cy) lands on screen (CX, CY) at zoom k. Both
 *  cuts go through this one function, so at the join the transform string is
 *  identical (cy = CY gives a zero translate). */
export const cameraStyle = (k: number, cy: number = CY): React.CSSProperties => ({
  transformOrigin: `${CX}px ${CY}px`,
  transform: `translate(0px, ${((CY - cy) * k).toFixed(3)}px) scale(${k.toFixed(5)})`,
});

// --- Shadow -----------------------------------------------------------------
/** The one shadow for glyphs, flags and labels, in SCREEN px under zoom k. */
export const battleShadow = (k: number) =>
  `drop-shadow(0 ${(2 / k).toFixed(3)}px ${(6 / k).toFixed(3)}px rgba(0,0,0,0.45))`;

// --- Layout (world px; world = screen at k 1) --------------------------------
export const N = 5;
export const GLYPH = 140; // swords box
export const PITCH = 180; // 40 px gap between boxes, row span 860
export const FLAG = 112; // 0.8 x glyph
export const U_GLYPH = GLYPH / 24;
export const U_FLAG = FLAG / 24;
// One stroke weight: STROKE_PX on screen at the creep's mid zoom (±3.5%).
// World px, so it can be rescaled by a later camera (`strokeScale`).
export const SW_WORLD = STROKE_PX / K_MID;

export const Y_S = 769; // swords box top; group mass centred on y ≈ 835
const SWORDS_INK_TOP = Y_S + 3 * U_GLYPH;
const SWORDS_INK_BOT = Y_S + 21 * U_GLYPH;
const POLE_GAP = 20; // pole base → swords ink top
export const FLAG_TOP = SWORDS_INK_TOP - POLE_GAP - 22 * U_FLAG;
export const LABEL_TOP = SWORDS_INK_BOT + 64;
export const LABEL_SIZE = 50;
export const xOf = (n: number) => CX + (n - (N - 1) / 2) * PITCH;

// --- Timing -----------------------------------------------------------------
const IN_STAGGER = 2;
const IN_DUR = 8;
const LABEL_F0 = 4;
const PLANT_F0 = 10;
const PLANT_STEP = 4;
export const POLE_DUR = 5;
export const CLOTH_OFF = 4;
export const CLOTH_DUR = 6;
// The count ticks when the cloth READS as landed: the ease-out has it at 96%
// two frames before its last, and a tick on the mathematical end lagged the eye.
const LAND_OFF = CLOTH_OFF + CLOTH_DUR - 2;
const SETTLE_DUR = 8;
const SETTLE_PX = 3.5;

export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const plantStart = (n: number) => PLANT_F0 + n * PLANT_STEP;

// --- Lucide (lucide-static v1.46.0, ISC), inlined verbatim -------------------
export const SWORDS = [
  "m13 19 6-6",
  "M14.5 17.5 3.586 6.586A2 2 0 013 5.172V3h2.172a2 2 0 011.414.586L17.5 14.5",
  "m14.828 6.172 2.586-2.586A2 2 0 0118.828 3H21v2.172a2 2 0 01-.586 1.414l-2.586 2.586",
  "m16 16 4 4",
  "m19 21 2-2",
  "m5 14 4 4",
  "m5 21-2-2",
  "M7.5 16.5 4 20",
];
// `flag` is one path; it is split at (4, 4) into the pole (drawn bottom→top)
// and the cloth, written in absolute coordinates so each point can take the
// wave offset. With w ≡ 0 it is the original geometry exactly.
const POLE = "M4 22V4";
const POLE_LEN = 18;
const clothD = (w: (x: number) => number) => {
  const P = (x: number, y: number) => `${x} ${(y + w(x)).toFixed(3)}`;
  return (
    `M${P(4, 4)} A1 1 0 0 1 ${P(4.4, 3.2)} A6 6 0 0 1 ${P(8, 2)} ` +
    `C${P(11, 2)} ${P(13, 4)} ${P(15.333, 4)} Q${P(17.333, 4)} ${P(18.4, 3.2)} ` +
    `A1 1 0 0 1 ${P(20, 4)} L${P(20, 14)} A1 1 0 0 1 ${P(19.6, 14.8)} ` +
    `A6 6 0 0 1 ${P(16, 16)} C${P(13, 16)} ${P(11, 14)} ${P(8, 14)} ` +
    `A6 6 0 0 0 ${P(4, 15.528)}`
  );
};
// Idle wave at the fly end, in flag units: 0.32 u ≈ 1.6 screen px at k 1.07.
export const WAVE_IDLE = 0.32;
const WAVE_UNFURL = 0.9; // extra flutter while unfurling, decays to idle by landing

/** A cloth wave: travelling along the fly, zero at the pole, own rate/phase. */
export const clothWave = (frame: number, seed: number, tCloth: number, idle = WAVE_IDLE) => {
  const rate = 0.17 + 0.09 * hash(seed, 3);
  const phase = hash(seed, 7) * Math.PI * 2;
  const amp = idle + WAVE_UNFURL * (1 - tCloth);
  return (px: number) => amp * ((px - 4) / 16) * Math.sin(frame * rate + phase - 0.45 * (px - 4));
};

const svgBase: React.CSSProperties = { position: "absolute", overflow: "visible" };

/** A Lucide flag, pole drawn up then cloth unfurled out from the pole.
 *  `sw` is the stroke in WORLD px; `size` the 24-grid box in world px. */
export const FlagGlyph: React.FC<{
  left: number;
  top: number;
  size: number;
  color: string;
  sw: number;
  tPole: number;
  tCloth: number;
  w: (x: number) => number;
  filter: string;
}> = ({ left, top, size, color, sw, tPole, tCloth, w, filter }) => {
  if (tPole <= 0) return null;
  const u = size / 24;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      style={{ ...svgBase, left, top, opacity: clamp01(tPole * 3), filter }}
      fill="none"
      stroke={color}
      strokeWidth={sw / u}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={POLE} strokeDasharray={`${(POLE_LEN * tPole).toFixed(3)} 100`} />
      {tCloth > 0 ? (
        // Unfurl = the cloth scales out from the pole (x = 4). A clip wipe was
        // tried first and read as the letter F mid-reveal (top and bottom
        // edges before the fly end). non-scaling-stroke keeps the line at the
        // one weight while x is squashed; its width is then in the svg's CSS px.
        <g transform={`translate(4 0) scale(${(0.04 + 0.96 * tCloth).toFixed(4)} 1) translate(-4 0)`}>
          <path d={clothD(w)} vectorEffect="non-scaling-stroke" strokeWidth={sw} />
        </g>
      ) : null}
    </svg>
  );
};

/** The label type: Roboto Condensed Bold caps, white, one shadow. */
export const labelStyle = (k: number, size: number = LABEL_SIZE): React.CSSProperties => ({
  position: "absolute",
  left: CX - 600,
  width: 1200,
  textAlign: "center",
  fontFamily: FONT_LABEL,
  fontWeight: LABEL_WEIGHT,
  fontSize: size,
  lineHeight: 1,
  textTransform: "uppercase",
  letterSpacing: LABEL_TRACKING,
  fontVariantNumeric: "tabular-nums",
  color: INK,
  whiteSpace: "nowrap",
  filter: battleShadow(k),
});

/** Five battles, their flags and BATTLES WON n / 5, at cut-1 frame `frame`,
 *  under a camera of zoom k. Absolutely positioned world children; put it
 *  inside a `cameraStyle` wrapper. `strokeScale` rescales the world stroke. */
export const BattleRow: React.FC<{ frame: number; k: number; strokeScale?: number }> = ({
  frame,
  k,
  strokeScale = 1,
}) => {
  const shadow = battleShadow(k);
  const sw = SW_WORLD * strokeScale;
  let won = 0;
  const items = Array.from({ length: N }, (_, n) => {
    const x = xOf(n);
    // 1. entrance
    const tIn = easeOut((frame - n * IN_STAGGER) / IN_DUR);
    const rise = (LABEL_RISE_PX / k) * (1 - tIn);
    // 2. plant
    const s = plantStart(n);
    const tPole = easeOut((frame - s) / POLE_DUR);
    const tCloth = easeOut((frame - s - CLOTH_OFF) / CLOTH_DUR);
    if (frame >= s + LAND_OFF) won += 1;
    const u = (frame - s) / SETTLE_DUR;
    const dip = u > 0 && u < 1 ? SETTLE_PX * Math.sin(Math.PI * u) : 0;
    // 3. cloth wave
    const w = clothWave(frame, n, tCloth);
    return { n, x, tIn, rise, tPole, tCloth, dip, w };
  });

  const tLabel = easeOut((frame - LABEL_F0) / LABEL_IN);
  const labelRise = (LABEL_RISE_PX / k) * (1 - tLabel);

  return (
    <>
      {items.map(({ n, x, tIn, rise, tPole, tCloth, dip, w }) => (
        <React.Fragment key={n}>
          {tIn > 0 ? (
            <svg
              viewBox="0 0 24 24"
              width={GLYPH}
              height={GLYPH}
              style={{
                ...svgBase,
                left: x - GLYPH / 2,
                top: Y_S + rise + dip,
                opacity: tIn,
                filter: shadow,
              }}
              fill="none"
              stroke={INK}
              strokeWidth={sw / U_GLYPH}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {SWORDS.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>
          ) : null}
          <FlagGlyph
            left={x - FLAG / 2}
            top={FLAG_TOP + dip}
            size={FLAG}
            color={ACCENT}
            sw={sw}
            tPole={tPole}
            tCloth={tCloth}
            w={w}
            filter={shadow}
          />
        </React.Fragment>
      ))}

      {tLabel > 0 ? (
        <div style={{ ...labelStyle(k), top: LABEL_TOP + labelRise, opacity: tLabel }}>
          <span style={{ marginRight: `-${LABEL_TRACKING}` }}>
            Battles won
            <span style={{ display: "inline-block", width: "0.55em" }} />
            <span style={{ color: ACCENT }}>{won}</span> / {N}
          </span>
        </div>
      ) : null}
    </>
  );
};

const WinAllTheBattles: React.FC<z.infer<typeof schema>> = ({ previewBg }) => {
  const frame = useCurrentFrame();
  const k = kAt(frame);
  return (
    <AbsoluteFill style={{ backgroundColor: previewFill(previewBg) }}>
      <AbsoluteFill style={cameraStyle(k)}>
        <BattleRow frame={frame} k={k} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default WinAllTheBattles;
