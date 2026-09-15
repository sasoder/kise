import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01, sway } from "./fieldShared";

// ---------------------------------------------------------------------------
// WatchHere — the end card for a Cheeky Pint short.
//
// Cheeky Pint style WITHOUT the kraft sheet: there is no sheet at all. This is a
// transparent 1080x1920 overlay that the editor lays over the last seconds of the
// short, so the only things on screen are the ink (`#FFFFFF`), the one accent
// (`#FFC543`) and the single separation shadow that lifts both off whatever
// footage is underneath. Söhne, flat, one continuous motion, nothing else.
//
// DURATION
//   6 s at 24 fps = 144 frames. The motion resolves at f54 (2.25 s) and f54..143
//   is a living hold with a period of 36 frames, loop-safe from f54: every
//   quantity in the hold is zero with zero slope at phase 0 and phase 36, so the
//   editor can trim anywhere after f54 and the cut shows no jump. 90 held frames
//   is 2.5 periods — the last frame is mid-travel of the third pulse, with the
//   kicker, the headline and the arrow all fully resolved.
//
// THE GESTURES — one motion, in four overlapping phases, and nothing else.
//   f0  .. f18   kicker `FULL EPISODE` rises 24 px into place, opacity 0 -> 1,
//                ease-out cubic (not a spring).
//   f6  .. f32   headline `WATCH` / `HERE` rises TOGETHER as one block from
//                +70 px on `flow`, opacity 0 -> 1 over the first 10 frames,
//                settling with a back(0.75)-style overshoot written as the house
//                zero-sloped bump. No per-letter stagger — it is one object.
//   f24 .. f52   the arrow draws itself tail -> tip on `flow` (ease-in-out) via
//                stroke-dasharray/dashoffset over a precomputed arc-length LUT.
//                The tail starts under the headline block and the pen is already
//                moving while the headline is still settling, so the two read as
//                one stroke rather than two events.
//   f46 .. f54   the head — ONE mitered chevron path, leg -> vertex -> leg —
//                draws OUTWARD from the tip on the same `flow`, continuing the
//                same pen: the head is the end of the draw, not a new mark.
//   f54 .. f143  living hold, period 36. A lighter pulse `#FFF1C2` travels the
//                path tail -> tip over 22 frames and fades as it reaches the
//                head; as it arrives (phase 18..22) the head and the last 80 px
//                of the curve nudge 10 px along the tip direction and ease back
//                over the next 14 frames (phase 22..36). Nothing else pulses,
//                breathes or scales. (The pulse's arc position parks at the tip
//                from phase 22 and resets at 36; it is at zero opacity for that
//                whole span, so the reset is never on screen.)
//
// The whole lockup carries `sway(frame)` from `fieldShared` as a translate, so it
// is never dead-still, and ONE `drop-shadow(0 2px 9px rgba(0,0,0,0.30))` on the
// group (text + arrow together) — never per element.
//
// The band: everything lives inside x 60..1020 and y 200..1450. Captions sit
// below 1450, so the arrow tip is the lowest ink in the frame.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 144;

// -- type --------------------------------------------------------------------
// Söhne, two faces, at module scope so a font failure surfaces before a frame is
// drawn. Own family names (`...WH`) so this piece cannot collide with the
// registrations in `explainerShared.tsx`, and no fallback stack on purpose: if
// these do not load the render is wrong and should look wrong.
const KICKER_FONT = "SohneBuchWH";
const HEAD_FONT = "SohneDreiviertelfettWH";
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
// ONE accent, this exact hex — not the fieldShared amber, which is a different,
// hotter yellow and reads as a different show.
const INK = "#FFFFFF";
const ACCENT = "#FFC543";
const PULSE = "#FFF1C2";
const SEPARATION = "drop-shadow(0 2px 9px rgba(0,0,0,0.30))";

// -- layout ------------------------------------------------------------------
// Centred on x 540. The two y anchors are the brief's, moved apart by the amount
// the type actually needs. MEASURED off the render, not guessed: at 176 px with
// line-height 0.9 the headline's ink runs 165 px below its block anchor and 138
// above it, and `WATCH` — the wider line — is 626 px, comfortably inside the
// 900 px ceiling. A kicker whose ink centre sat at 700 with the headline ink
// centred at 870 would have overlapped it, so the pair opens to the smallest
// spacing that still reads as two objects: kicker ink centre 690, headline ink
// centre 908, a 50 px gap between them.
//
// Every offset below is the measured delta between the CSS anchor and the ink,
// so the arrow's tail can be placed off the ink and not off the line box.
// (the text rows are centred by `textAlign: center` on a full-width row, so the
// column axis x 540 is implicit rather than a constant.)
const KICKER_SIZE = 44;
const KICKER_CY = 683; // ink centre lands at 690 (+7 from the line box)
const HEAD_SIZE = 176; // measured: `WATCH` is the wider line, well under 900 px
const HEAD_LEADING = 0.9;
const HEAD_BLOCK_CY = 894; // ink centre lands at 908 (+13.5 from the line box)
const HEAD_LINES = ["WATCH", "HERE"];
// The line box of the two-line block, used to position the div. The ink inside it
// is narrower than the box (Söhne's cap height is ~0.72 em), which is why the
// arrow tail is measured off the INK bottom below, not off the box.
const HEAD_BOX_H = HEAD_SIZE * HEAD_LEADING * HEAD_LINES.length; // 316.8
const HEAD_INK_BOTTOM = HEAD_BLOCK_CY + HEAD_SIZE * 0.938; // 1059, measured

// -- easing ------------------------------------------------------------------
// The house set, same hand as the D1 cuts: a flat-topped travel and a settle that
// is flat to second order at both ends, so neither adds a step in speed.
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
const easeOutCubic = (u: number) => 1 - (1 - clamp01(u)) ** 3;
const smooth = (u: number) => {
  const x = clamp01(u);
  return x * x * (3 - 2 * x);
};
const seg = (f: number, f0: number, f1: number) => clamp01((f - f0) / (f1 - f0));

// -- the arrow ---------------------------------------------------------------
// One hand-drawn curve per target, authored as a single cubic so there is no
// join anywhere on it and therefore no kink: the only way to get a corner in a
// cubic is to hit a cusp, and neither of these comes near one. Both were tuned by
// hand against the render, not laid out on a compass — each leaves the headline
// going down and slightly out, bellies, and comes into the tip on a different
// heading than it left on.
//
//   bottomLeft  the YouTube Shorts / Reels handle, bottom-left. The curve swings
//               out right, crosses back over and comes into the tip heading
//               down-left at 47 degrees, so the head sits like Lucide's
//               `move-down-left` (legs horizontal and vertical).
//   rightRail   the TikTok avatar on the right rail. Leaves the headline almost
//               straight down — the same exit as `bottomLeft`, so the two targets
//               are the same hand — bellies 180 px to y 1285 and hooks back up
//               into the tip heading up-right at 56 degrees, at the avatar. A
//               shallow version of this was tried first and read as a decorative
//               flourish under the type rather than as an arrow: the depth of the
//               belly is what makes it a drawn gesture.
const STROKE = 9;
const HEAD_LEG = 64;
const HEAD_HALF_ANGLE = (45 * Math.PI) / 180;

type Pt = { x: number; y: number };
type Cubic = [Pt, Pt, Pt, Pt];

const CURVES: Record<"bottomLeft" | "rightRail", Cubic> = {
  bottomLeft: [
    { x: 600, y: HEAD_INK_BOTTOM + 40 }, // tail, 40 px under the headline ink
    { x: 700, y: 1210 },
    { x: 430, y: 1260 },
    { x: 300, y: 1400 }, // tip
  ],
  rightRail: [
    { x: 620, y: HEAD_INK_BOTTOM + 40 },
    { x: 648, y: 1350 },
    { x: 832, y: 1322 },
    { x: 970, y: 1120 }, // tip, heading up-right at 56 degrees
  ],
};


// The arc-length LUT. Computed once at module scope from the cubic — no
// `getTotalLength`, so it is identical in the Studio, in SSR and in the renderer,
// and it doubles as the geometry the pulse and the nudge are read off.
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
  // full length pokes a 4.5 px spur through the chevron's vertex. Trimmed, the
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
const NUDGE_SPAN = 80;
const NUDGE_PX = 10;

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
// not two square start-caps spurring past each other. It still draws outward from
// the tip, by revealing a dash symmetrically about the path's midpoint (see
// `chevronDash`), so the head is the pen carrying on rather than two new marks.
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
const KICK_F1 = 18;
const HEAD_F0 = 6;
const HEAD_F1 = 32;
const DRAW_F0 = 24;
const DRAW_F1 = 52;
const TIPS_F0 = 46;
const TIPS_F1 = 54;
const HOLD_F0 = 54;
const PERIOD = 36;
const PULSE_FRAMES = 22;

export const schema = z.object({
  target: z.enum(["bottomLeft", "rightRail"]).default("bottomLeft"),
  kicker: z.string().default("FULL EPISODE"),
  accent: z.string().default(ACCENT),
  ink: z.string().default(INK),
});
export const defaultProps = schema.parse({});

type Props = z.infer<typeof schema>;

const WatchHere = ({ target, kicker, accent, ink }: Props) => {
  const frame = useCurrentFrame();
  const lut = LUTS[target];
  const drift = sway(frame);

  // 1. the kicker
  const kickU = seg(frame, KICK_F0, KICK_F1);
  const kickDy = 24 * (1 - easeOutCubic(kickU));
  const kickOp = easeOutCubic(kickU);

  // 2. the headline, one block
  const headU = seg(frame, HEAD_F0, HEAD_F1);
  const headDy = 70 * (1 - flow(headU)) - 5 * overshoot(headU);
  const headOp = clamp01((frame - HEAD_F0) / 10);

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
    pulseS = lut.drawLen * flow(pu, 0.3); // peak 39 px/frame, under the 45 cap
    pulseOp = smooth(clamp01(phase / 3)) * (1 - smooth(clamp01((phase - 15) / 7)));
    // the nudge: out over phase 18..22 as the pulse arrives, back over 22..36,
    // zero with zero slope at both ends of the period.
    nudge =
      phase < 18
        ? 0
        : phase < 22
          ? NUDGE_PX * smooth((phase - 18) / 4)
          : NUDGE_PX * (1 - smooth((phase - 22) / 14));
  }

  const d = polyD(lut, nudge);
  const chev = chevronD(lut, nudge);

  // 3. the draw, tail -> tip
  const drawP = flow(seg(frame, DRAW_F0, DRAW_F1));
  // 4. the head strokes, outward from the tip. `flow`, not an ease-out: an
  //    ease-out cubic has slope 3 at u = 0, so the legs would leave the tip at
  //    24 px/frame from a standstill — a step in velocity, i.e. a second event.
  //    `flow` is flat at both ends, so the head is the pen carrying on.
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
            left: 0,
            right: 0,
            top: KICKER_CY - KICKER_SIZE * 0.7,
            textAlign: "center",
            fontFamily: KICKER_FONT,
            fontSize: KICKER_SIZE,
            lineHeight: 1.4,
            letterSpacing: "0.2em",
            marginRight: "-0.2em",
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
            left: 0,
            right: 0,
            top: HEAD_BLOCK_CY - HEAD_BOX_H / 2,
            textAlign: "center",
            fontFamily: HEAD_FONT,
            fontSize: HEAD_SIZE,
            lineHeight: HEAD_LEADING,
            color: accent,
            opacity: headOp,
            transform: `translateY(${headDy.toFixed(2)}px)`,
          }}
        >
          {HEAD_LINES.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </div>

        <svg
          width={1080}
          height={1920}
          viewBox="0 0 1080 1920"
          style={{ position: "absolute", left: 0, top: 0 }}
        >
          <g
            fill="none"
            stroke={accent}
            strokeWidth={STROKE}
            strokeLinecap="square"
            strokeLinejoin="miter"
          >
            {/* A square cap on a ZERO-length dash still paints a 9x9 square, so
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
                  as one ~140 px dash peaking at 0.9 with soft ends, instead of
                  a hard tick with two cut edges. */}
              {[
                [140, 0.25],
                [100, 0.3],
                [50, 0.35],
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

export default WatchHere;
