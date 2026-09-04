import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:01.899 -> 00:00:09.400 of the source cut: "is just how much of the
// world's future labor supply ends up in very few companies".
export const DURATION = 225;

// Square canvas: the editor pans a 1080x1920 window across it left to right
// and parks in the middle, so the holders are centred on the canvas and the
// field has to be live all the way out to both edges.
const W = 1920;
const H = 1920;
// The supply arrives from the left-middle edge, ahead of the pan.
const SRC_X = 0;
const SRC_Y = 960;
const MAX_R = Math.hypot(W - SRC_X, Math.max(SRC_Y, H - SRC_Y));

// The field: the world's labor supply, evenly distributed because that is the
// state being destroyed. 22 x 42 so it packs exactly into the two holders.
const FIELD_COLS = 40;
const FIELD_ROWS = 42;
const FIELD_X0 = 60;
const FIELD_X1 = 1860;
const FIELD_Y0 = 90;
const FIELD_Y1 = 1830;
const JITTER = 11;

const BOXES = 2;
const BOX_COLS = 28;
const BOX_ROWS = 30; // 2 * 28 * 30 = 1680 slots, one per dot exactly.
const PAD = 14;
// Holder size is fixed — it is the composition the user approved — so the
// wider field packs onto a tighter pitch instead. The dots shrink as they
// land, which is the concentration said twice.
const BOX_W = 208;
const BOX_H = 217;
const PACK_X = (BOX_W - PAD * 2) / (BOX_COLS - 1);
const PACK_Y = (BOX_H - PAD * 2) / (BOX_ROWS - 1);
const BOX_GAP = 60;
const BOX_Y = 891.5; // half-pixel so the long horizontal edges stay even
const BOX_X0 = (W - (BOXES * BOX_W + (BOXES - 1) * BOX_GAP)) / 2;
const PERIM = 2 * (BOX_W + BOX_H);
const LOGO = 92;
const LOGO_GAP = 34;

const boxX = (b: number) => BOX_X0 + b * (BOX_W + BOX_GAP);

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const rgbOf = (hex: string) => {
  const h = hex.replace('#', '');
  const n =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
};

type Dot = {
  x: number;
  y: number;
  r: number; // distance from centre, drives the arrival wave
  tx: number;
  ty: number;
  rank: number;
  bow: number;
  p1: number;
  p2: number;
};

// Built once at module scope: the geometry is fixed, only the read of it moves.
const DOTS: Dot[] = (() => {
  const field: {x: number; y: number}[] = [];
  for (let r = 0; r < FIELD_ROWS; r++) {
    for (let c = 0; c < FIELD_COLS; c++) {
      const x =
        FIELD_X0 +
        ((FIELD_X1 - FIELD_X0) * c) / (FIELD_COLS - 1) +
        (hash(c, r) - 0.5) * 2 * JITTER;
      const y =
        FIELD_Y0 +
        ((FIELD_Y1 - FIELD_Y0) * r) / (FIELD_ROWS - 1) +
        (hash(r, c + 7) - 0.5) * 2 * JITTER;
      field.push({x, y});
    }
  }

  // Slots fill bottom-up and centre-out, both holders in step, so they read as
  // vessels filling rather than as two separate events.
  const colOrder = Array.from({length: BOX_COLS}, (_, i) => i).sort(
    (a, b) => Math.abs(a - (BOX_COLS - 1) / 2) - Math.abs(b - (BOX_COLS - 1) / 2),
  );
  const slots: {x: number; y: number}[] = [];
  for (let r = BOX_ROWS - 1; r >= 0; r--) {
    for (const c of colOrder) {
      for (let b = 0; b < BOXES; b++) {
        slots.push({x: boxX(b) + PAD + c * PACK_X, y: BOX_Y + PAD + r * PACK_Y});
      }
    }
  }

  // Nearest goes first: the collapse starts under the holders and keeps
  // reaching further out, so the frame empties from the middle outward.
  const order = field
    .map((p, i) => ({i, d: Math.hypot(p.x - W / 2, p.y - BOX_Y - BOX_H / 2)}))
    .sort((a, b) => a.d - b.d);

  const dots: Dot[] = new Array(field.length);
  order.forEach((o, rank) => {
    const p = field[o.i];
    const s = slots[rank];
    dots[o.i] = {
      x: p.x,
      y: p.y,
      r: Math.hypot(p.x - SRC_X, p.y - SRC_Y),
      tx: s.x,
      ty: s.y,
      rank: rank / (field.length - 1),
      bow: (hash(o.i, 3) - 0.5) * 70,
      p1: hash(o.i, 5) * Math.PI * 2,
      p2: hash(o.i, 9) * Math.PI * 2,
    };
  });
  return dots;
})();

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  dimOpacity: z.number().min(0).max(1),
  litOpacity: z.number().min(0).max(1),
  dotRadius: z.number().min(1).max(8),
  // Radius once packed: the tighter pitch inside a holder needs the smaller
  // dot, and the shrink itself reads as compression.
  packedRadius: z.number().min(0.5).max(8),
  // Nothing in the field is ever perfectly still: a live supply, not a texture.
  driftAmp: z.number().min(0).max(20),
  // How long one dot takes to cross, and how far apart the first and last
  // departures are. Quantity is encoded twice: more dots is both a denser
  // field and a longer drain.
  travel: z.number().int().min(8).max(90),
  spread: z.number().int().min(8).max(120),
  // One per holder, in public/. Accent-tinted, so they read as structure.
  icons: z.array(z.string()).length(BOXES),
  // Beat frames from the SRT at 30fps, relative to 00:00:01.899:
  //   0 "is just" · 35 "how much of the" · 87 "world's future"
  //   108 "labor supply" · 137 "ends up in" · 172 "very few" · 204 "companies"
  beats: z.object({
    field: z.number().int(),
    wave: z.number().int(),
    read: z.number().int(),
    holders: z.number().int(),
    collapse: z.number().int(),
    few: z.number().int(),
  }),
});

export type LaborSupplyCollapseProps = z.infer<typeof schema>;

export const defaultProps: LaborSupplyCollapseProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  dimOpacity: 0.15,
  litOpacity: 0.88,
  dotRadius: 3.4,
  packedRadius: 2.5,
  driftAmp: 5.5,
  travel: 32,
  spread: 44,
  icons: ['openai-logo.png', 'anthropic-logo.png'],
  beats: {field: 0, wave: 78, read: 87, holders: 137, collapse: 142, few: 172},
});

const ease = Easing.bezier(0.45, 0, 0.25, 1);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const LaborSupplyCollapse: React.FC<LaborSupplyCollapseProps> = ({
  ink,
  accent,
  shadow,
  dimOpacity,
  litOpacity,
  dotRadius,
  packedRadius,
  driftAmp,
  travel,
  spread,
  icons,
  beats,
}) => {
  const frame = useCurrentFrame();
  const [tr, tg, tb] = rgbOf(accent);

  // "is just how much of the": the supply arrives as a front expanding out of
  // the left-middle edge at a constant rate, so it enters ahead of the pan and
  // the answer to "how much" is still being delivered four seconds in.
  const front = interpolate(frame, [beats.field, beats.wave], [0, MAX_R + 90], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // "world's future labor supply": a second pass, top to bottom, taking the
  // whole field in before any of it moves.
  const band = interpolate(frame, [beats.read, beats.read + 32], [-160, H + 160], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: 'transparent'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="holder-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
      >
        {Array.from({length: BOXES}, (_, b) => {
          const draw = interpolate(
            frame,
            [beats.holders + b * 5, beats.holders + b * 5 + 16],
            [0, 1],
            {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
          );
          // "very few": the outlines assert themselves once, so the count is
          // stated at the moment he says it.
          const pulse = interpolate(frame, [beats.few, beats.few + 8, beats.few + 26], [0, 1, 0], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          return (
            <rect
              key={b}
              x={boxX(b)}
              y={BOX_Y}
              width={BOX_W}
              height={BOX_H}
              rx={7}
              fill="none"
              stroke={accent}
              strokeWidth={3 + pulse * 1.5}
              strokeDasharray={PERIM}
              strokeDashoffset={PERIM * (1 - draw)}
              opacity={draw * (0.62 + pulse * 0.38)}
            />
          );
        })}

        {DOTS.map((d, i) => {
          const t = interpolate(
            frame,
            [beats.collapse + d.rank * spread, beats.collapse + d.rank * spread + travel],
            [0, 1],
            {easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
          );

          // Arrival: a crest of brightness and size rides the front, so the
          // wave itself is visible rather than just its wake.
          const dr = front - d.r;
          const appear = clamp01(dr / 80);
          const crest = clamp01(1 - Math.abs(dr) / 70);
          const read = clamp01((band - d.y) / 130);
          const readCrest = clamp01(1 - Math.abs(band - d.y) / 100);

          // Settled dots stop drifting, so the packed blocks resolve crisp.
          const amp = driftAmp * appear * (1 - t);
          const dxDrift = Math.sin(frame * 0.055 + d.p1) * amp;
          const dyDrift = Math.sin(frame * 0.043 + d.p2) * amp * 0.8;

          const dx = d.tx - d.x;
          const dy = d.ty - d.y;
          const len = Math.max(Math.hypot(dx, dy), 1);
          const bow = Math.sin(Math.PI * t) * d.bow;
          const x = d.x + dx * t + (-dy / len) * bow + dxDrift;
          const y = d.y + dy * t + (dx / len) * bow + dyDrift;

          // Ink until it is actually inside a holder — the flip is read off the
          // position, so it can never drift from the picture when retimed.
          // Gated on having left: a dot that merely started life on top of a
          // holder has not been captured by it.
          const b = Math.floor((x - BOX_X0) / (BOX_W + BOX_GAP));
          const inside =
            t > 0.02 &&
            b >= 0 &&
            b < BOXES &&
            x >= boxX(b) &&
            x <= boxX(b) + BOX_W &&
            y >= BOX_Y &&
            y <= BOX_Y + BOX_H;

          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={
                (dotRadius + (packedRadius - dotRadius) * t) *
                (1 + 0.45 * crest * (1 - t))
              }
              fill={inside ? accent : ink}
              opacity={
                inside
                  ? 0.95
                  : appear *
                    Math.min(
                      1,
                      dimOpacity +
                        (litOpacity - dimOpacity) * read +
                        crest * 0.34 +
                        readCrest * 0.1,
                    )
              }
            />
          );
        })}
      </svg>

      {icons.map((icon, b) => {
        const show = interpolate(
          frame,
          [beats.holders + b * 5 + 8, beats.holders + b * 5 + 26],
          [0, 1],
          {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        );
        const pulse = interpolate(frame, [beats.few, beats.few + 8, beats.few + 26], [0, 1, 0], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <Img
            key={icon}
            src={staticFile(icon)}
            style={{
              position: 'absolute',
              left: boxX(b) + BOX_W / 2 - LOGO / 2,
              top: BOX_Y - LOGO_GAP - LOGO + (1 - show) * 14,
              width: LOGO,
              height: LOGO,
              opacity: show * (0.82 + pulse * 0.18),
              filter: `url(#holder-tint) drop-shadow(0 2px 6px ${shadow})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export default LaborSupplyCollapse;
