import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01, sway } from "./fieldShared";

// ---------------------------------------------------------------------------
// WatchHereV2 — the compact revision of `WatchHere`.
//
// V1 was a full-bleed 1080x1920 overlay whose motion resolved at f54 (2.25 s).
// The note back was "looks great, however the animation is pretty slow and it
// takes up the entire screen almost — this is something I will put in a small
// place, in the middle of the screen or at the bottom under the captions". So
// V2 is the SAME piece — same two faces, same accent, same one-stroke arrow,
// same pulse-and-nudge hold — cut down to a tight badge the editor can drop
// anywhere and scale, and run about four times faster into its resting state.
// Nothing about the motion LANGUAGE changed; only the canvas and the clock.
//
// CANVAS — 900 x 274, transparent, 24 fps.
//   The lockup is one horizontal line: kicker over a single-line headline, the
//   arrow leaving the end of the headline. Measured off the render, not guessed:
//   at 98 px `WATCH HERE` is 619 px of ink (x 60..679) with a 74 px cap height,
//   and the kicker is 24 px of ink. Stacked with the brief's 14 px gap the ink
//   runs y 43..155 (baseline) and the arrow's tip lands at y 218.
//   MEASURED off the rendered alpha across every frame of both targets, with
//   the hold's 7 px nudge applied, the chevron's miter counted, the sway at its
//   extreme and the one drop shadow included, the drawn extent is
//   x 45..849, y 30..244 — so a 900 x 274 frame leaves 30 px of clear air above
//   and below, 45 px to the left of the `W` and 51 px past the furthest the
//   arrow ever reaches. Anything shorter clips the shadow; anything taller is
//   padding the editor has to crop.
//   (V1's headline size of ~118 px would have made the one-line headline 745 px
//   of ink, which does not leave the arrow anywhere to go inside 900 px. 98 px
//   is the size that hits the brief's ~620 px line width.)
//
// DURATION
//   4 s at 24 fps = 96 frames. The motion resolves at f28 (1.17 s, against V1's
//   f54) and f28..f95 is the living hold, period 24 frames, loop-safe from f28:
//   every quantity in the hold is zero with zero slope at phase 0 and phase 24,
//   so the editor can cut anywhere after f28 with no jump. 68 held frames is
//   2.83 periods.
//
// THE GESTURES — the same three beats as V1 and nothing else, on a 4x clock.
//   f0  .. f8    kicker `FULL EPISODE` rises 14 px into place, opacity 0 -> 1,
//                on `flow`.
//   f2  .. f16   headline `WATCH HERE` rises 40 px as ONE block on `flow`,
//                opacity in over 6 frames, settling on the house zero-sloped
//                back(0.75) bump. No per-letter stagger — it is one object.
//   f8  .. f26   the arrow draws itself tail -> tip on `flow` via
//                dasharray/dashoffset over a module-scope arc-length LUT. The
//                pen is already moving while the headline is still settling, so
//                the two read as one stroke.
//   f22 .. f28   the head — ONE mitered chevron, leg -> vertex -> leg — draws
//                OUTWARD from the tip on the same `flow`, the same pen carrying
//                on. Both the shaft and the head are gated on their own
//                progress, because a square cap on a zero-length dash still
//                paints a 7x7 blob.
//   f28 .. f95   living hold, period 24. A lighter pulse `#FFF1C2` (~90 px
//                footprint) travels tail -> tip over 14 frames and fades as it
//                arrives; at phase 11..14 the head and the last 50 px of the
//                curve nudge 7 px along the tip direction and ease back over
//                the next 10 frames. Peak pulse speed is 30 px/frame on
//                `bottomLeft` and 22 on `rightRail`, both under the 45 px/frame
//                cap. Nothing else pulses, breathes or scales.
//
// The whole lockup carries `sway(frame)` scaled to this canvas (dy 3, dx 2) and
// ONE `drop-shadow(0 2px 9px rgba(0,0,0,0.30))` on the group — never per
// element.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 96;
export const WIDTH = 900;
export const HEIGHT = 274;

// -- type --------------------------------------------------------------------
// Söhne, two faces, at module scope so a font failure surfaces before a frame is
// drawn. Own family names (`...WH2`) so this piece cannot collide with V1's
// registrations or with `explainerShared.tsx`, and no fallback stack on purpose.
const KICKER_FONT = "SohneBuchWH2";
const HEAD_FONT = "SohneDreiviertelfettWH2";
loadFont({
  family: KICKER_FONT,
  url: staticFile("Sohne-Buch.otf"),
  weight: "400",
});
loadFont({
  family: HEAD_FONT,
  url: staticFile("Sohne-Dreiviertelfett.otf"),
  weight: "700",
});

// -- palette -----------------------------------------------------------------
const INK = "#FFFFFF";
const ACCENT = "#FFC543";
const PULSE = "#FFF1C2";
const SEPARATION = "drop-shadow(0 2px 9px rgba(0,0,0,0.30))";

// -- layout ------------------------------------------------------------------
// Left-aligned, not centred: the arrow needs the right-hand half of the canvas.
// Every number below is either the brief's or MEASURED off a still — the two
// `*_INK_DY` / `*_INK_DX` constants are the delta between the CSS line box and
// the ink, so the arrow's tail can be placed off the INK and not off the box.
const TEXT_X = 60; // where the ink starts, both rows

const KICKER_SIZE = 30;
const KICKER_INK_DX = 2; // measured: `F` starts 2 px inside the line box
const KICKER_INK_DY = 4; // measured: cap top is 4 px below the line box top
const KICKER_CAP = 24; // measured ink height (the `O`/`S` overshoot included)
const KICKER_INK_TOP = 43;

const HEAD_SIZE = 98; // measured: `WATCH HERE` is 619 px of ink at this size
const HEAD_INK_DX = 0; // measured: the `W` starts on the line box's left edge
const HEAD_INK_DY = HEAD_SIZE * 0.161; // measured 19 px at 98/118 -> 15.8
const HEAD_CAP = HEAD_SIZE * 0.754; // measured 89 px at 118 -> 73.9
const HEAD_GAP = 14; // brief: kicker sits ~14 px above the cap height
const HEAD_CAP_TOP = KICKER_INK_TOP + KICKER_CAP + HEAD_GAP; // 81
const HEAD_BASELINE = HEAD_CAP_TOP + HEAD_CAP; // 155
const HEAD_INK_RIGHT = 679; // measured: 60 + 619
const HEAD_TEXT = "WATCH HERE";

// -- easing ------------------------------------------------------------------
// The house set, lifted from V1 unchanged: a flat-topped travel and a settle
// that is flat to second order at both ends, so neither adds a step in speed.
const FLOW_A = 0.28;
const flow = (u: number, a: number = FLOW_A) => {
  const x = clamp01(u);
  const area = 1 - a;
  if (x < a) {
    const g = x / a;
    return (a * (g * g * g - (g * g * g * g) / 2)) / area;
  }
  if (x <= 1 - a) return (a * 0.5 + (x - a)) / area;
  const g = (1 - x) / a;
  return (area - a * (g * g * g - (g * g * g * g) / 2)) / area;
};
const SETTLE_U0 = 4 / 7;
const overshoot = (u: number) => {
  const w = clamp01((clamp01(u) - SETTLE_U0) / (1 - SETTLE_U0));
  return 64 * w ** 3 * (1 - w) ** 3;
};
const smooth = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const seg = (f: number, f0: number, f1: number) => clamp01((f - f0) / (f1 - f0));

// -- the arrow ---------------------------------------------------------------
// One hand-drawn curve per target, authored as a SINGLE cubic so there is no
// join anywhere on it and therefore no kink. Stroke 7, scaled from V1's 9 with
// the type (98/176 of the size would be 5, but the arrow has to hold its own
// against a 98 px headline, so it is scaled with the stroke ratio the V1 render
// was approved at rather than with the point size).
//
// Both leave the headline from the SAME tail — 20 px past the last `E`, at mid
// cap height — so the two targets are visibly the same hand, and both were
// tuned numerically against three constraints: total path length, the tip
// heading, and a minimum 20 px clearance from the headline's ink rectangle
// (x 60..679, y 74..148) so nothing ever crosses the letters.
//
//   bottomLeft  the YouTube Shorts / Reels handle, bottom-left. Leaves right
//               and UP, arcs over to x 794, then swings back DOWN-LEFT in one
//               long open stroke and ends under the last `E` of `HERE`, 63 px
//               below the baseline, heading exactly 135 degrees (down-left at
//               45). The head's legs therefore point straight up and straight
//               right, like Lucide's `move-down-left`, and the tip is the
//               lowest ink in the frame: it reads as "tap below-left", not as
//               an underline flourish. Path 305 px, min clearance from the type
//               20 px. (A tighter version with the turn at x 807 and the tip
//               only 53 px down was tried first and the doubled-back stroke
//               pinched into a wedge at the turn — the open turn is what makes
//               it read as a drawn gesture rather than a crease.)
//   rightRail   the TikTok avatar on the right rail. Leaves the headline
//               straight DOWN — an S-free hook — bellies 77 px to y 195 and
//               comes back up into the tip heading up-right at 40 degrees,
//               151 px past the end of the text. Path 220 px.
const STROKE = 7;
const HEAD_LEG = 50; // V1's 64, scaled by the stroke ratio 7/9
const HEAD_HALF_ANGLE = (45 * Math.PI) / 180;

const TAIL = { x: HEAD_INK_RIGHT + 20, y: HEAD_CAP_TOP + HEAD_CAP / 2 }; // 699, 118

type Pt = { x: number; y: number };
type Cubic = [Pt, Pt, Pt, Pt];

const CURVES: Record<"bottomLeft" | "rightRail", Cubic> = {
  bottomLeft: [
    TAIL,
    { x: 860, y: 55 },
    { x: 799, y: 63 }, // tip + 155*(1,-1): the tip heading is exactly 135 deg
    { x: 644, y: HEAD_BASELINE + 63 }, // tip, under the last `E` of `HERE`
  ],
  rightRail: [
    TAIL,
    { x: 700, y: TAIL.y + 140 }, // straight down out of the headline
    { x: 761.06, y: TAIL.y + 57.85 }, // tip - 90*(cos40, -sin40): tip heading -40 deg
    { x: 830, y: TAIL.y }, // tip, 151 px right of the text
  ],
};

// The arc-length LUT. Computed once at module scope from the cubic — no
// `getTotalLength`, so it is identical in the Studio, in SSR and in the
// renderer, and it doubles as the geometry the pulse and the nudge read off.
const LUT_N = 480;
const buildLut = (c: Cubic) => {
  const pts: Pt[] = [];
  const cum: number[] = [];
  for (let i = 0; i <= LUT_N; i++) {
    const t = i / LUT_N;
    const m = 1 - t;
    const x =
      m * m * m * c[0].x + 3 * m * m * t * c[1].x + 3 * m * t * t * c[2].x + t * t * t * c[3].x;
    const y =
      m * m * m * c[0].y + 3 * m * m * t * c[1].y + 3 * m * t * t * c[2].y + t * t * t * c[3].y;
    pts.push({ x, y });
    if (i === 0) cum.push(0);
    else {
      const p = pts[i - 1];
      cum.push(cum[i - 1] + Math.hypot(x - p.x, y - p.y));
    }
  }
  const len = cum[LUT_N];
  // The unit tangent at the tip, from the last control leg (exact for a cubic).
  const tvx = c[3].x - c[2].x;
  const tvy = c[3].y - c[2].y;
  const tn = Math.hypot(tvx, tvy);
  // The shaft is drawn over `drawLen`, half a stroke SHORT of the tip: a square
  // cap extends strokeWidth/2 past the end of the path, so a shaft drawn to the
  // full length pokes a 3.5 px spur through the chevron's vertex. Trimmed, the
  // cap lands exactly on the vertex and the two read as one mark.
  return {
    pts,
    cum,
    len,
    drawLen: len - STROKE / 2,
    tip: c[3],
    tan: { x: tvx / tn, y: tvy / tn },
  };
};
const LUTS = {
  bottomLeft: buildLut(CURVES.bottomLeft),
  rightRail: buildLut(CURVES.rightRail),
};

// The nudge shape along the path: 0 until the last `NUDGE_SPAN` px, then a
// smoothstep to 1 at the tip. Applied to the LUT points themselves, so the curve
// BENDS with the head instead of the head sliding off a static line.
const NUDGE_SPAN = 50; // V1's 80, scaled to this canvas
const NUDGE_PX = 7; // V1's 10

type Lut = ReturnType<typeof buildLut>;

const polyD = (lut: Lut, nudge: number) => {
  let d = "";
  for (let i = 0; i <= LUT_N; i += 2) {
    if (lut.cum[i] > lut.drawLen) break;
    const p = lut.pts[i];
    const w = nudge === 0 ? 0 : smooth((lut.cum[i] - (lut.len - NUDGE_SPAN)) / NUDGE_SPAN);
    const x = p.x + lut.tan.x * nudge * w;
    const y = p.y + lut.tan.y * nudge * w;
    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
};

// The chevron: ONE path, leg -> vertex -> leg, so the vertex is a real MITER and
// not two square start-caps spurring past each other. It still draws outward
// from the tip, by revealing a dash symmetrically about the path's midpoint.
const CHEV_LEN = HEAD_LEG * 2;
const chevronD = (lut: Lut, nudge: number) => {
  const tx = lut.tip.x + lut.tan.x * nudge;
  const ty = lut.tip.y + lut.tan.y * nudge;
  const back = Math.atan2(-lut.tan.y, -lut.tan.x);
  const arm = (a: number) =>
    `${(tx + HEAD_LEG * Math.cos(a)).toFixed(2)} ${(ty + HEAD_LEG * Math.sin(a)).toFixed(2)}`;
  return `M${arm(back - HEAD_HALF_ANGLE)}L${tx.toFixed(2)} ${ty.toFixed(2)}L${arm(
    back + HEAD_HALF_ANGLE,
  )}`;
};
// Reveal [HEAD_LEG - g, HEAD_LEG + g] of a CHEV_LEN path: a dash of 2g starting
// at HEAD_LEG - g, which is dashoffset g - HEAD_LEG.
const chevronDash = (g: number) => ({
  strokeDasharray: `${(2 * g).toFixed(2)} ${CHEV_LEN}`,
  strokeDashoffset: (g - HEAD_LEG).toFixed(2),
});

// -- beats -------------------------------------------------------------------
const KICK_F0 = 0;
const KICK_F1 = 8;
const HEAD_F0 = 2;
const HEAD_F1 = 16;
const DRAW_F0 = 8;
const DRAW_F1 = 26;
const TIPS_F0 = 22;
const TIPS_F1 = 28;
const HOLD_F0 = 28;
const PERIOD = 24;
const PULSE_FRAMES = 14;

export const schema = z.object({
  target: z.enum(["bottomLeft", "rightRail"]).default("bottomLeft"),
  kicker: z.string().default("FULL EPISODE"),
  accent: z.string().default(ACCENT),
  ink: z.string().default(INK),
});
export const defaultProps = schema.parse({});

type Props = z.infer<typeof schema>;

const WatchHereV2 = ({ target, kicker, accent, ink }: Props) => {
  const frame = useCurrentFrame();
  const lut = LUTS[target];
  // V1's sway, scaled to this canvas: dy 5 -> 3, dx 3 -> 2.
  const base = sway(frame);
  const drift = { dx: base.dx * (2 / 3), dy: base.dy * 0.6 };

  // 1. the kicker
  const kickU = flow(seg(frame, KICK_F0, KICK_F1));
  const kickDy = 14 * (1 - kickU);
  const kickOp = kickU;

  // 2. the headline, one block
  const headU = seg(frame, HEAD_F0, HEAD_F1);
  const headDy = 40 * (1 - flow(headU)) - 3 * overshoot(headU);
  const headOp = clamp01((frame - HEAD_F0) / 6);

  // 5. the living hold — computed first, because the nudge bends the curve that
  //    phases 3 and 4 draw along.
  const phase = frame < HOLD_F0 ? -1 : (frame - HOLD_F0) % PERIOD;
  let nudge = 0;
  let pulseS = 0;
  let pulseOp = 0;
  if (phase >= 0) {
    // the pulse: tail -> tip over PULSE_FRAMES, in and out at zero opacity so
    // phase 0 and phase PERIOD are the same picture.
    const pu = clamp01(phase / PULSE_FRAMES);
    pulseS = lut.drawLen * flow(pu, 0.3); // peak 30 px/frame, under the 45 cap
    pulseOp = smooth(clamp01(phase / 2)) * (1 - smooth(clamp01((phase - 9) / 5)));
    // the nudge: out over phase 11..14 as the pulse arrives, back over 14..24,
    // zero with zero slope at both ends of the period.
    nudge =
      phase < 11
        ? 0
        : phase < 14
          ? NUDGE_PX * smooth((phase - 11) / 3)
          : NUDGE_PX * (1 - smooth((phase - 14) / 10));
  }

  const d = polyD(lut, nudge);
  const chev = chevronD(lut, nudge);

  // 3. the draw, tail -> tip
  const drawP = flow(seg(frame, DRAW_F0, DRAW_F1));
  // 4. the head strokes, outward from the tip. `flow`, not an ease-out: an
  //    ease-out cubic has slope 3 at u = 0, so the legs would leave the tip from
  //    a standstill at a step in velocity, i.e. a second event. `flow` is flat
  //    at both ends, so the head is the pen carrying on.
  const tipsP = flow(seg(frame, TIPS_F0, TIPS_F1));

  return (
    <AbsoluteFill style={{ backgroundColor: "transparent" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          filter: SEPARATION,
          transform: `translate(${drift.dx.toFixed(2)}px, ${drift.dy.toFixed(2)}px)`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: TEXT_X - KICKER_INK_DX,
            top: KICKER_INK_TOP - KICKER_INK_DY,
            whiteSpace: "nowrap",
            fontFamily: KICKER_FONT,
            fontSize: KICKER_SIZE,
            lineHeight: 1,
            letterSpacing: "0.2em",
            color: ink,
            opacity: kickOp,
            transform: `translateY(${kickDy.toFixed(2)}px)`,
          }}
        >
          {kicker}
        </div>

        <div
          style={{
            position: "absolute",
            left: TEXT_X - HEAD_INK_DX,
            top: HEAD_CAP_TOP - HEAD_INK_DY,
            whiteSpace: "nowrap",
            fontFamily: HEAD_FONT,
            fontSize: HEAD_SIZE,
            lineHeight: 1,
            color: accent,
            opacity: headOp,
            transform: `translateY(${headDy.toFixed(2)}px)`,
          }}
        >
          {HEAD_TEXT}
        </div>

        <svg
          width={WIDTH}
          height={HEIGHT}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <g
            fill="none"
            stroke={accent}
            strokeWidth={STROKE}
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            {/* A square cap on a ZERO-length dash still paints a 7x7 square, so
                the shaft and the chevron are each gated on their own progress:
                until the pen is down there is nothing on the path at all. */}
            {drawP > 0 ? (
              <path
                d={d}
                strokeDasharray={lut.drawLen}
                strokeDashoffset={(lut.drawLen * (1 - drawP)).toFixed(2)}
              />
            ) : null}
            {tipsP > 0 ? <path d={chev} {...chevronDash(HEAD_LEG * tipsP)} /> : null}
          </g>
          {pulseOp > 0.001 ? (
            <g
              fill="none"
              stroke={PULSE}
              strokeLinecap="butt"
              strokeLinejoin="miter"
              strokeWidth={STROKE}
            >
              {/* Three concentric dashes centred on the same arc position: a wide
                  faint skirt, a mid body and a narrow core. Overlapped they read
                  as one ~90 px dash peaking at 0.9 with soft ends, instead of a
                  hard tick with two cut edges. (V1's 140/100/50, scaled.) */}
              {[
                [90, 0.25],
                [64, 0.3],
                [32, 0.35],
              ].map(([w, a], i) => (
                <path
                  key={i}
                  d={d}
                  strokeDasharray={`${w} ${lut.drawLen + w}`}
                  strokeDashoffset={(w / 2 - pulseS).toFixed(2)}
                  opacity={(a * pulseOp).toFixed(3)}
                />
              ))}
            </g>
          ) : null}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export default WatchHereV2;
