import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01, sway } from "./fieldShared";

// ---------------------------------------------------------------------------
// WatchHereV3 — WatchHereV2 with ONE change: the arrow's geometry.
//
// The note back on V2 was "I like V2. However the arrow bends in a way too
// dramatic way. The arrow could easily be just a little bit curved. Now it goes
// up and then takes a super drastic turn. Make it a bit smoother."
//
// V2's `bottomLeft` shaft left the headline heading -21 deg (right and UP),
// arced over to x 794 and came back down-left at 135 deg: 156 degrees of turn,
// most of it spent in a hairpin around the apex. Read at speed that is a hook,
// not a gesture.
//
// V3's RULE, and the only thing that changed in this file:
//   ONE GENTLE ARC. The tangent direction turns MONOTONICALLY by at most 35 deg
//   from tail to tip — no reversal, no apex, no hairpin — and the bow (the
//   greatest distance from the chord) is 8-10% of the chord length. That is the
//   shape a relaxed hand draws in one pass.
//
// Everything else is V2 byte-for-byte in behaviour: canvas 900x274, the two
// Söhne faces at the same sizes on the same rows, the same beats (f0-8 kicker,
// f2-16 headline, f8-26 shaft, f22-28 head), the same `flow`/`overshoot`
// easing, the same living hold on a 24-frame period with its pulse and its 7 px
// nudge, the same single group `drop-shadow` and the same `sway`. Only the
// curve, the head's leg length and the pulse's dash footprint moved, and those
// last two only because they are measured off the curve.
//
// HOW THE CURVE IS BUILT. Each target is a SINGLE symmetric cubic named by four
// numbers — tail, tip, half-turn `phi`, and the bow as a fraction of the chord —
// rather than by four hand-placed control points, because the rule above is a
// statement about those numbers and not about control points:
//   * the tangent at the tail is (chord angle - side*phi), at the tip
//     (chord angle + side*phi), so the TOTAL turn is exactly 2*phi and it is
//     monotone as long as the chord is longer than 2*h*cos(phi) (which puts the
//     hodograph's three control vectors all forward along the chord). That
//     margin is asserted below.
//   * for such a cubic the bow is exactly 0.75*h*sin(phi), so the handle length
//     `h` is SOLVED from the bow the brief asks for instead of guessed.
//
//   bottomLeft  the YouTube Shorts / Reels handle, bottom-left. Tail x 735,
//               y 76 — to the right of the headline's ink (which ends at x 679)
//               and above its cap top, so the stroke never comes near the
//               letters — falling away at 105 deg (just past straight down) and
//               easing round to a tip at (650, 224) heading 134.9 deg
//               (down-left at 45). Chord 171, path 174 px, turn 30 deg, bow
//               15.4 px = 9.0% of the chord, and the closest the stroke's EDGE
//               ever comes to the headline's ink rectangle (x 60..679,
//               y 74..155) is 20.6 px, nudge and chevron included.
//               The tail sits higher than the cap-mid line V2 left from because
//               the four constraints pin it there: with the tip at y 224, a
//               path of ~170 px and a tip heading held at or under 135 deg, a
//               9% bow leaves tail y ~ 75 and nothing else. Starting lower
//               either shortens the arc under 165 px or pushes the tip past
//               135 deg into a hook again.
//   rightRail   the TikTok avatar on the right rail. Tail (705, 130), just
//               right of the ink and below cap-mid, leaving at 5 deg, bowing
//               14.3 px DOWN and coming back up into a tip at (845, 100)
//               heading -29.6 deg (up-right). Chord 143, path 147 px, turn
//               35 deg, bow 10.0%, stroke edge 22.5 px clear of the type.
//
// The shorter shaft is matched by a shorter head (leg 40, was 50) and a shorter
// pulse (a ~64 px footprint, was ~90) so the proportions hold. Peak pulse speed
// falls with the path: 17.7 px/frame on `bottomLeft`, 15.0 on `rightRail`,
// both far under the 45 px/frame cap.
//
// MEASURED off the rendered alpha across every frame of both targets, with the
// nudge applied, the miter counted, the sway at its extreme and the drop shadow
// included, the drawn extent is inside x 45..861, y 30..242 — so HEIGHT stays
// 274 (V3's tip reaches 236 against V2's 244, so there is MORE bottom air, not
// less) and WIDTH stays 900.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 96;
export const WIDTH = 900;
export const HEIGHT = 274;

// -- type --------------------------------------------------------------------
// Söhne, two faces, at module scope so a font failure surfaces before a frame is
// drawn. Own family names (`...WH3`) so this piece cannot collide with V1/V2's
// registrations or with `explainerShared.tsx`, and no fallback stack on purpose.
const KICKER_FONT = "SohneBuchWH3";
const HEAD_FONT = "SohneDreiviertelfettWH3";
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
// Unchanged from V2. Left-aligned, not centred: the arrow needs the right-hand
// half of the canvas. Every number below is either the brief's or MEASURED off a
// still — the two `*_INK_DY` / `*_INK_DX` constants are the delta between the
// CSS line box and the ink, so the arrow can be placed off the INK.
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
// The house set, lifted from V2 unchanged: a flat-topped travel and a settle
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
const STROKE = 7;
const HEAD_LEG = 40; // V2's 50, scaled with the shorter shaft
const HEAD_HALF_ANGLE = (45 * Math.PI) / 180;
const DEG = Math.PI / 180;

type Pt = { x: number; y: number };
type Cubic = [Pt, Pt, Pt, Pt];
type Target = "bottomLeft" | "rightRail";

// tail, tip, the HALF turn in degrees, the bow as a fraction of the chord, and
// which side of the chord the arc bows to: `side` +1 bows toward the chord
// direction rotated +90 deg (screen space, y down), -1 toward -90 deg. See the
// header — these five numbers ARE the rule, and the control points fall out.
type Geo = { tail: Pt; tip: Pt; phi: number; bowFrac: number; side: 1 | -1 };

const GEOS: Record<Target, Geo> = {
  // falls away just past vertical, eases round to 134.9 deg (down-left at 45)
  bottomLeft: { tail: { x: 735, y: 76 }, tip: { x: 650, y: 224 }, phi: 15, bowFrac: 0.09, side: -1 },
  // leaves level, bows 14 px down, comes back up into -29.6 deg (up-right)
  rightRail: { tail: { x: 705, y: 130 }, tip: { x: 845, y: 100 }, phi: 17.5, bowFrac: 0.1, side: 1 },
};

const cubicOf = (g: Geo): Cubic => {
  const dx = g.tip.x - g.tail.x;
  const dy = g.tip.y - g.tail.y;
  const chord = Math.hypot(dx, dy);
  const alpha = Math.atan2(dy, dx);
  const phi = g.phi * DEG;
  // A symmetric cubic's bow is exactly 0.75 * h * sin(phi) — solve for h.
  const h = (g.bowFrac * chord) / (0.75 * Math.sin(phi));
  // The turn is monotone iff all three hodograph control vectors point forward
  // along the chord, i.e. iff the middle one, chord - 2h*cos(phi), is positive.
  if (chord - 2 * h * Math.cos(phi) <= 0) {
    throw new Error("WatchHereV3: bow/phi would fold the tangent back on itself");
  }
  const a0 = alpha + g.side * phi; // tangent at the tail
  const a1 = alpha - g.side * phi; // tangent at the tip
  return [
    g.tail,
    { x: g.tail.x + h * Math.cos(a0), y: g.tail.y + h * Math.sin(a0) },
    { x: g.tip.x - h * Math.cos(a1), y: g.tip.y - h * Math.sin(a1) },
    g.tip,
  ];
};

const CURVES: Record<Target, Cubic> = {
  bottomLeft: cubicOf(GEOS.bottomLeft),
  rightRail: cubicOf(GEOS.rightRail),
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
const NUDGE_SPAN = 50;
const NUDGE_PX = 7;

// The rule's second half, ASSERTED rather than eyeballed: the stroke's edge must
// stay at least MIN_CLEAR px outside the headline's ink rectangle, everywhere on
// the shaft and on both chevron legs, with the hold's nudge at full extent. This
// runs once at module scope, so a future tweak to a tail or a bow that grazes
// `HERE` fails before a frame is drawn instead of shipping.
const INK_RECT = {
  x0: TEXT_X,
  x1: HEAD_INK_RIGHT,
  y0: HEAD_BASELINE - HEAD_CAP - 7, // cap top, with 7 px for the `O`-style overshoot
  y1: HEAD_BASELINE,
};
const MIN_CLEAR = 18;
const clearOf = (p: Pt) =>
  Math.hypot(
    Math.max(INK_RECT.x0 - p.x, 0, p.x - INK_RECT.x1),
    Math.max(INK_RECT.y0 - p.y, 0, p.y - INK_RECT.y1),
  ) -
  STROKE / 2;
for (const lut of [LUTS.bottomLeft, LUTS.rightRail]) {
  let worst = Infinity;
  for (const nudge of [0, NUDGE_PX]) {
    for (let i = 0; i <= LUT_N; i++) {
      const w = nudge === 0 ? 0 : smooth((lut.cum[i] - (lut.len - NUDGE_SPAN)) / NUDGE_SPAN);
      worst = Math.min(
        worst,
        clearOf({ x: lut.pts[i].x + lut.tan.x * nudge * w, y: lut.pts[i].y + lut.tan.y * nudge * w }),
      );
    }
    const tx = lut.tip.x + lut.tan.x * nudge;
    const ty = lut.tip.y + lut.tan.y * nudge;
    const back = Math.atan2(-lut.tan.y, -lut.tan.x);
    for (const sgn of [-1, 1]) {
      const a = back + sgn * HEAD_HALF_ANGLE;
      for (let k = 0; k <= 64; k++) {
        const L = ((HEAD_LEG + STROKE / 2) * k) / 64;
        worst = Math.min(worst, clearOf({ x: tx + L * Math.cos(a), y: ty + L * Math.sin(a) }));
      }
    }
  }
  if (worst < MIN_CLEAR) {
    throw new Error(`WatchHereV3: the arrow comes within ${worst.toFixed(1)} px of the headline ink`);
  }
}

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

const WatchHereV3 = ({ target, kicker, accent, ink }: Props) => {
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
    pulseS = lut.drawLen * flow(pu, 0.3); // peak 17.7 px/frame, under the 45 cap
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
                  as one ~64 px dash peaking at 0.9 with soft ends, instead of a
                  hard tick with two cut edges. (V2's 90/64/32, re-derived for
                  this shorter path so the pulse keeps the same proportion of
                  shaft it had at 305 px.) */}
              {[
                [64, 0.25],
                [46, 0.3],
                [23, 0.35],
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

export default WatchHereV3;
