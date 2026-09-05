import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import {
  FLASH,
  FLASH_DENSE_INK,
  GROUND_LIFT,
  GROUND_O,
  GROUND_W,
  RISE,
  backdropStyle,
  clamp01,
  hash,
  runCamera,
} from "./cheekyPintSystem";

export const FPS = 24;
// "if the progress in models stopped, the way we built products would change
// instantly" — SRT 0.000s -> 4.879s at 24fps.
export const DURATION = 117;

// ---------------------------------------------------------------------------
// The models come from above, and stop
//
// The payoff noun is "the way" — a method, not a product. So the piece shows
// one manner of building and then a different one, and the switch is instant.
//
// Deliberately inverted against the other cut in this edit, which is a narrow
// ink column standing on a wide amber floor. Here there is no floor at all:
// the accent falls from above, the ink is a compact mass in the middle, and
// the camera pushes in rather than pulling back. Same colour grammar, same
// 22px module, opposite geometry — otherwise the two read as one graphic.
//
// A model lands on the product and the product is rebuilt: same nine pieces,
// a different rough shape, nothing gained. Three times. The fourth model stops
// dead in mid-air and withdraws, and that is the whole event — progress is not
// announced as stopped, it visibly stops. What follows is the changed method:
// unhurried, the mass stops being rearranged and starts being added to, nine
// pieces to sixteen, and on "instantly" every one of them snaps exact at once.
// ---------------------------------------------------------------------------
const G = 22;
const RX = 11;
const RX_COARSE = 16; // provisional pieces are soft; a full pill reads as a pebble

const UNIT_H = 2 * G; // 44
const WORLD_W = 2400;
const WORLD_H = 2600;
const X0 = 1200;

// Sixteen pieces on four rows. Every row's widths are drawn from the same
// three module sizes and every row sums to the same total, so the finished
// object is exact and varied at once rather than a lattice of identical
// squares — which is what a repeated unit reads as when nothing varies.
const ROWS = [
  [5 * G, 2 * G, 2 * G, 3 * G],
  [2 * G, 4 * G, 4 * G, 2 * G],
  [3 * G, 2 * G, 3 * G, 4 * G],
  [2 * G, 3 * G, 5 * G, 2 * G],
];
const N = 16;
const uRow = (i: number) => Math.floor(i / 4);
const uCol = (i: number) => i % 4;
const uW = (i: number) => ROWS[uRow(i)][uCol(i)];

const BLOCK_BOTTOM = 1621;
const rowY = (r: number) => BLOCK_BOTTOM - (r + 1) * UNIT_H - r * G;

// The nine it starts with: three rows of three. The seven it gains: the fourth
// column, then the fourth row. Nine to sixteen, three squared to four squared,
// so the growth is countable rather than asserted.
const BASE9 = [0, 1, 2, 4, 5, 6, 8, 9, 10];
const ADDS: { u: number; at: number }[] = [
  { u: 3, at: 62 },
  { u: 7, at: 68 },
  { u: 11, at: 74 },
  { u: 12, at: 80 },
  { u: 13, at: 86 },
  { u: 14, at: 92 },
  { u: 15, at: 97 },
];
const ADD_T = 8;

// Three models land. The fourth is released on the third's landing, is caught
// in mid-air at "stopped", holds there, and goes back up.
const LANDINGS = [2, 13, 24];
const FALL_T = 11;
const FALL = 380;
const TOKEN_W = 6 * G; // 132 — the same amber unit the other cut lies down flat
const CLUSTER_TOP = 1621 - 3 * UNIT_H - 2 * G; // 1445, three rows of it
const HELD = 24; // the fourth release — two thirds down when it is caught
const STOP = 33;
const WITHDRAW = 46; // thirteen frames of hanging there before it goes back
const WITHDRAW_T = 20;

const BASE_Y = BLOCK_BOTTOM;
const BASE_HALF = (4 * G + 3 * (3 * G) + 3 * G) / 2 + 2 * G; // half the widest row, plus air
const MARK_SIZE = 6 * G; // 132
const MARK_TOP = BLOCK_BOTTOM + 4 * G; // 1709

const FILL_AT = 100; // "instantly"
const SNAP_T = 2;

const ANTHROPIC_D =
  "M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z";

const ez = (e: (t: number) => number, x: number) => e(clamp01(x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// A rough arrangement, seeded per piece per rebuild. Same nine pieces every
// time, a different shape every time.
const scat = (i: number, e: number) => {
  const k = i * 31 + e * 7;
  return {
    dx: (hash(k + 1) - 0.5) * 40,
    dy: (hash(k + 5) - 0.5) * 36,
    rot: (hash(k + 9) - 0.5) * 11,
    sc: 0.9 + hash(k + 13) * 0.2,
  };
};
const coarseInk = (i: number) => 0.6 + hash(i * 7 + 3) * 0.22;
const exactInk = (i: number) => 0.78 + uRow(i) * 0.05;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  markOpacity: z.number(),
  // Beat frames lifted from the SRT at 24fps:
  //   0 "if the progress" · 19 "in models" · 33 "stopped" · 54 "the way we"
  //   68 "built products" · 85 "would change" · 100 "instantly" · 117 end
  beats: z.object({
    inModels: z.number().int(),
    stopped: z.number().int(),
    theWayWe: z.number().int(),
    builtProducts: z.number().int(),
    wouldChange: z.number().int(),
    instantly: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#FFC543",
  backgroundBase: "#2B2118",
  backgroundSrc: "brown-paper-backdrop.jpg",
  backgroundBlur: 16,
  backgroundDim: 0.68,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  markOpacity: 0.88,
  beats: {
    inModels: 19,
    stopped: 33,
    theWayWe: 54,
    builtProducts: 68,
    wouldChange: 85,
    instantly: 100,
  },
});

const ModelsStopFalling: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  shadowY,
  shadowBlur,
  shadowOpacity,
  markOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();

  // A push-in, not a pull-back: the falling models need headroom while they
  // are still coming, and once they stop that headroom is the point — the
  // frame closes on what is left. Keyed to the envelope of the fall rather
  // than to any one token, so the camera never chases.
  const CAM_F = [0, 20, 34, 50, 74, 96, DURATION];
  const CAM_K = [1.35, 1.36, 1.42, 1.55, 1.58, 1.6, 1.6];
  const CAM_CY = [1560, 1562, 1590, 1725, 1702, 1688, 1688];
  const { cy, k } = React.useMemo(
    () => runCamera(frame, CAM_F, CAM_K, CAM_CY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [frame],
  );

  const tx = 540 - X0 * k;
  const ty = 960 - cy * k;

  const exact = ez(Easing.out(Easing.cubic), (frame - FILL_AT) / SNAP_T);
  const click =
    frame >= FILL_AT ? clamp01(1 - (frame - FILL_AT) / FLASH) : 0;

  // Which rebuild we are in, and how far through it.
  const epoch = LANDINGS.filter((t) => frame >= t).length;
  const since = epoch > 0 ? frame - LANDINGS[epoch - 1] : 999;
  // Nothing has disturbed it since the stop, so the rough shape loosens its
  // grip — the first time in the piece it is allowed to come to rest.
  const calm = 1 - 0.35 * clamp01((frame - 36) / 18);

  const born = (i: number) => {
    if (BASE9.includes(i)) return 1;
    const a = ADDS.find((x) => x.u === i);
    return a ? ez(RISE, (frame - a.at) / ADD_T) : 0;
  };

  // Each row centres itself on the axis, so gaining a piece spreads the row
  // outward from the middle instead of growing off to one side.
  const rowCentres = (r: number) => {
    let total = -G;
    for (let c = 0; c < 4; c++) {
      const p = born(r * 4 + c);
      total += ROWS[r][c] * p + G * p;
    }
    const out: number[] = [];
    let x = X0 - total / 2;
    for (let c = 0; c < 4; c++) {
      const p = born(r * 4 + c);
      out.push(x + (ROWS[r][c] * p) / 2);
      x += ROWS[r][c] * p + G * p;
    }
    return out;
  };
  const centres = [0, 1, 2, 3].map(rowCentres);

  // The falling model. Three land; the fourth is caught in the air.
  const tokens = LANDINGS.map((land) => {
    const rel = land - FALL_T;
    if (frame < rel) return null;
    const drop = ez(Easing.in(Easing.quad), (frame - rel) / FALL_T);
    const bottom = CLUSTER_TOP - FALL + FALL * drop;
    const age = frame - land;
    if (age > 8) return null;
    const paint = age >= 0 && age < 3 ? FLASH_DENSE_INK : accent;
    const o = age <= 0 ? 1 : 1 - clamp01(age / 8);
    return { bottom, o, paint };
  }).filter(Boolean) as { bottom: number; o: number; paint: string }[];

  const heldDrop = ez(Easing.in(Easing.quad), (STOP - HELD) / FALL_T);
  const back = ez(Easing.inOut(Easing.cubic), (frame - WITHDRAW) / WITHDRAW_T);
  const heldProgress =
    frame < STOP
      ? ez(Easing.in(Easing.quad), (frame - HELD) / FALL_T)
      : heldDrop * (1 - back);
  const heldBottom = CLUSTER_TOP - FALL + FALL * heldProgress;
  const heldO =
    frame < HELD
      ? 0
      : frame < WITHDRAW
        ? 1
        : // Gone well before it gets back to where it came from — the whole
          // rise would carry it out of the top of the frame, and the point is
          // that it leaves, not where it goes.
          1 - ez(Easing.inOut(Easing.quad), (frame - WITHDRAW) / (WITHDRAW_T * 0.55));

  const baseOpacity = mix(GROUND_O, GROUND_LIFT, exact);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={backdropStyle(
            frame,
            cy,
            k,
            CAM_CY[0],
            backgroundBlur,
            backgroundDim,
          )}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {tokens.map((t, idx) => (
              <rect
                key={`tok-${idx}`}
                x={X0 - TOKEN_W / 2}
                y={t.bottom - UNIT_H}
                width={TOKEN_W}
                height={UNIT_H}
                rx={RX}
                fill={t.paint}
                opacity={t.o}
              />
            ))}

            {heldO > 0.01 ? (
              <rect
                x={X0 - TOKEN_W / 2}
                y={heldBottom - UNIT_H}
                width={TOKEN_W}
                height={UNIT_H}
                rx={RX}
                fill={accent}
                opacity={heldO}
              />
            ) : null}

            {Array.from({ length: N }, (_, i) => {
              const p = born(i);
              if (p <= 0.01) return null;
              const r = uRow(i);
              const c = uCol(i);

              // Where it is in the current rough shape, gliding out of the
              // previous one. Staggered by index so the whole thing reshuffles
              // rather than switching.
              const t =
                epoch === 0 ? 1 : clamp01((since - i * 0.25) / 9);
              const e = ez(Easing.inOut(Easing.cubic), t);
              const a = scat(i, Math.max(0, epoch - 1));
              const b = scat(i, epoch);
              const drift = Math.sin(frame / 41 + i * 1.7) * 3;

              const dx = mix(a.dx, b.dx, e) * calm * (1 - exact);
              const dy = (mix(a.dy, b.dy, e) * calm + drift) * (1 - exact);
              const rot = mix(a.rot, b.rot, e) * calm * (1 - exact);
              const sc = mix(mix(a.sc, b.sc, e), 1, exact) * mix(0.55, 1, p);

              const cx = centres[r][c] + dx;
              const ccy = rowY(r) + UNIT_H / 2 + dy;
              const w = uW(i) * sc;
              const h = UNIT_H * sc;
              const rest = mix(coarseInk(i), exactInk(i), exact);
              const addAge = BASE9.includes(i)
                ? 99
                : frame - (ADDS.find((x) => x.u === i)?.at ?? 0);
              const addClick =
                addAge >= 0 && addAge < FLASH ? 1 - addAge / FLASH : 0;
              const bright = Math.max(click, addClick);

              return (
                <rect
                  key={`u-${i}`}
                  x={cx - w / 2}
                  y={ccy - h / 2}
                  width={w}
                  height={h}
                  rx={mix(RX_COARSE, RX, exact)}
                  transform={`rotate(${rot.toFixed(2)} ${cx.toFixed(2)} ${ccy.toFixed(2)})`}
                  fill={ink}
                  opacity={(rest + (1 - rest) * bright) * clamp01(p * 1.6)}
                />
              );
            })}

            <rect
              x={X0 - BASE_HALF}
              y={BASE_Y}
              width={BASE_HALF * 2}
              height={GROUND_W}
              fill={ink}
              opacity={baseOpacity}
            />

            <g
              transform={`translate(${X0} ${MARK_TOP + MARK_SIZE / 2}) scale(${MARK_SIZE / 24}) translate(-12 -12)`}
              opacity={markOpacity}
            >
              <path d={ANTHROPIC_D} fill={ink} />
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ModelsStopFalling;
