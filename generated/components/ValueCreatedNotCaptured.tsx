import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:32.100 -> 00:00:40.399 of the source cut. round((40.399 - 32.100) * 30).
export const DURATION = 249;

// Three identical containers: what the models made, what the labs kept, what the
// users got. Same width, same grid, same grain size — so the only thing that can
// differ between them is how many units are inside, and no number is needed.
const COLS = 15;
const ROWS = 16;
const W = 380;
const CELL = W / COLS;
const H = ROWS * CELL;
const G = 20; // one unit of value
const PAD = (CELL - G) / 2;
const N = COLS * ROWS; // 240 units

const RES_X0 = 350;
const RES_Y1 = 775;
const RES_Y0 = RES_Y1 - H;
const EMIT_Y = 336;

const BIN_Y1 = 1475;
const BIN_Y0 = BIN_Y1 - H;
const LABS_X0 = 90;
const USERS_X0 = 610;

const LABEL_Y = 1524;
const LABEL_H = 86;

const FLIGHT_IN = 14;
const FLIGHT_OUT = 26;
const THROAT_Y = 905; // where the falling unit stops falling and starts diverting

const OPENAI = staticFile('openai.png');
const ANTHROPIC = staticFile('anthropic.png');
const PERSON = staticFile('person.png');

const ease = {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const out = {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const fall = {easing: Easing.in(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const mix = (a: string, b: string, t: number) => {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const c = (i: number) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t);
  return `rgb(${c(1)}, ${c(3)}, ${c(5)})`;
};

// Painted as a colour behind the artwork's own alpha. Deliberately not an SVG
// filter reference: when Chrome fails to resolve one on a frame the element
// paints as nothing at all, which showed up as whole-field dropouts before.
const mark = (src: string, color: string): React.CSSProperties => ({
  backgroundColor: color,
  maskImage: `url(${src})`,
  WebkitMaskImage: `url(${src})`,
  maskSize: 'contain',
  WebkitMaskSize: 'contain',
  maskPosition: 'center',
  WebkitMaskPosition: 'center',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
});

// Rules land on a half pixel with an odd stroke, or identical lines antialias
// anywhere from 4% to 13% alpha and the whole field shimmers.
const snap = (v: number) => Math.round(v) + 0.5;

const Box: React.FC<{x: number; color: string; opacity: number}> = ({x, color, opacity}) => (
  <rect
    x={snap(x)}
    y={snap(BIN_Y0)}
    width={Math.round(W)}
    height={Math.round(H)}
    fill="none"
    stroke={color}
    strokeWidth={3}
    opacity={opacity}
  />
);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  ghost: z.number().min(0).max(0.3),
  // How many of the fifteen columns the blade skims off. The captured share is
  // this over COLS, so the funnel mouth, the unit count and the fill height all
  // state the same number and cannot drift apart.
  splitColumns: z.number().int().min(1).max(4),
  showHeadroom: z.boolean(),
  // Beat frames from the SRT at 30fps, relative to 00:00:32.100:
  //   33 "most of" · 57 "the value" · 77 "models generate" · 94 "does not"
  //   108 "get given" · 121 "to openai" · 134 "anthropik" · 152 "thankfully"
  //   165 "so far it" · 195 "just being" · 235 "the users" · 249 "right?"
  beats: z.object({
    fill: z.number().int(),
    fillEnd: z.number().int(),
    blade: z.number().int(),
    drain: z.number().int(),
    drainEnd: z.number().int(),
    labs: z.number().int(),
    headroom: z.number().int(),
    users: z.number().int(),
    total: z.number().int(),
  }),
});

export type ValueCreatedNotCapturedProps = z.infer<typeof schema>;

export const defaultProps: ValueCreatedNotCapturedProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  ghost: 0.1,
  splitColumns: 1,
  showHeadroom: true,
  beats: {
    fill: 33,
    fillEnd: 77,
    blade: 94,
    drain: 108,
    drainEnd: 209,
    labs: 121,
    headroom: 152,
    users: 195,
    total: 249,
  },
});

const ValueCreatedNotCaptured: React.FC<ValueCreatedNotCapturedProps> = ({
  ink,
  accent,
  shadow,
  ghost,
  splitColumns,
  showHeadroom,
  beats,
}) => {
  const frame = useCurrentFrame();

  const SPLIT_X = RES_X0 + splitColumns * CELL;
  const perLabs = splitColumns;
  const perUsers = COLS - splitColumns;

  const emitP = interpolate(frame, [0, 14], [0.34, 1], out);
  const resP = interpolate(frame, [0, 20], [0.5, 1], out);
  const binP = interpolate(frame, [0, 30], [0.4, 1], out);
  const bladeP = interpolate(frame, [beats.blade, beats.blade + 12], [0, 1], out);
  const funnelP = interpolate(frame, [beats.blade + 4, beats.blade + 22], [0, 1], out);
  const labsP = interpolate(frame, [beats.labs, beats.labs + 19], [0, 1], out);
  const usersP = interpolate(frame, [beats.users, beats.users + 22], [0, 1], out);
  const headP = showHeadroom ? interpolate(frame, [beats.headroom, beats.headroom + 18], [0, 1], out) : 0;

  // The emitter is only alive while it is actually emitting.
  const emitLive = interpolate(frame, [beats.fill - 4, beats.fill + 6, beats.fillEnd, beats.fillEnd + 20], [0.3, 1, 1, 0.2], ease);

  const grains: React.ReactElement[] = [];
  for (let i = 0; i < N; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const toLabs = col < splitColumns;

    const releaseT = beats.fill + (i / N) * (beats.fillEnd - beats.fill);
    const departT = beats.drain + (i / N) * (beats.drainEnd - beats.drain);
    if (frame < releaseT) continue;

    const colX = RES_X0 + col * CELL + PAD;
    const floorY = RES_Y1 - CELL + PAD;

    let x: number;
    let y: number;
    let color = ink;
    let opacity = 0.9;
    let scale = 1;

    if (frame < departT) {
      // Falling into the reservoir, then settling downward as the units below
      // it leave. The stack height is read off the queue, not off a timer.
      const p = interpolate(frame, [releaseT, releaseT + FLIGHT_IN], [0, 1], fall);
      const drained = interpolate(frame, [beats.drain, beats.drainEnd], [0, N], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
      const rowF = Math.max(0, row - drained / COLS);
      const settledY = RES_Y1 - (rowF + 1) * CELL + PAD;
      x = colX;
      y = EMIT_Y + (settledY - EMIT_Y) * p;
      opacity = 0.9 * interpolate(p, [0, 0.25], [0, 1], {extrapolateRight: 'clamp'});
    } else {
      const k = toLabs ? row * perLabs + col : row * perUsers + (col - splitColumns);
      const bx = (toLabs ? LABS_X0 : USERS_X0) + (k % COLS) * CELL + PAD;
      const by = BIN_Y1 - (Math.floor(k / COLS) + 1) * CELL + PAD;
      const p = interpolate(frame, [departT, departT + FLIGHT_OUT], [0, 1], ease);
      // Straight down out of the reservoir, then deflected by the funnel wall.
      const q = 1 - p;
      x = q * q * colX + 2 * q * p * colX + p * p * bx;
      y = q * q * floorY + 2 * q * p * THROAT_Y + p * p * by;
      if (toLabs) color = mix(ink, accent, interpolate(p, [0.12, 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
      opacity = toLabs ? 1 : 0.9;
      // A short settle on landing, so the last beat has weight.
      const s = interpolate(frame, [departT + FLIGHT_OUT, departT + FLIGHT_OUT + 5], [1.16, 1], out);
      scale = p >= 1 ? s : 1;
    }

    grains.push(
      <rect
        key={i}
        x={x}
        y={y}
        width={G}
        height={G}
        rx={4}
        fill={color}
        opacity={opacity}
        style={scale === 1 ? undefined : {transformOrigin: `${x + G / 2}px ${y + G / 2}px`, transform: `scale(${scale})`}}
      />,
    );
  }

  const funnel = (x0: number, x1: number, bx0: number, bx1: number) => (
    <>
      <path d={`M ${x0} ${RES_Y1} L ${bx0} ${BIN_Y0}`} stroke={ink} strokeWidth={2} opacity={ghost * 1.6 * funnelP} fill="none" />
      <path d={`M ${x1} ${RES_Y1} L ${bx1} ${BIN_Y0}`} stroke={ink} strokeWidth={2} opacity={ghost * 1.6 * funnelP} fill="none" />
    </>
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
          {/* The models, emitting. */}
          <rect
            x={RES_X0}
            y={EMIT_Y}
            width={W * emitP}
            height={9}
            rx={4.5}
            fill={accent}
            opacity={emitLive}
          />

          {/* What the models generate. */}
          <rect
            x={snap(RES_X0)}
            y={snap(RES_Y0)}
            width={Math.round(W)}
            height={Math.round(H)}
            fill="none"
            stroke={ink}
            strokeWidth={3}
            opacity={ghost * resP}
          />

          {funnel(RES_X0, SPLIT_X, LABS_X0, LABS_X0 + W)}
          {funnel(SPLIT_X, RES_X0 + W, USERS_X0, USERS_X0 + W)}

          {/* The blade. One column in fifteen is skimmed off the stream. */}
          <path
            d={`M ${SPLIT_X} ${RES_Y1 - 26 + (1 - bladeP) * -34} L ${SPLIT_X + 11} ${RES_Y1 + 8 + (1 - bladeP) * -34} L ${SPLIT_X - 11} ${RES_Y1 + 8 + (1 - bladeP) * -34} Z`}
            fill={accent}
            opacity={0.85 * bladeP}
          />

          <Box x={LABS_X0} color={frame >= beats.labs ? accent : ink} opacity={(frame >= beats.labs ? ghost + labsP * 0.5 : ghost) * binP} />
          <Box x={USERS_X0} color={ink} opacity={(ghost + usersP * 0.38) * binP} />

          {/* "thankfully — so far": the headroom the labs are not taking. */}
          <path
            d={`M ${snap(LABS_X0 + 8)} ${snap(BIN_Y1 - 6 * CELL)} L ${snap(LABS_X0 + W - 8)} ${snap(BIN_Y1 - 6 * CELL)}`}
            stroke={accent}
            strokeWidth={3}
            strokeDasharray="10 14"
            opacity={0.34 * headP}
            fill="none"
          />

          {grains}

          <path d={`M ${snap(LABS_X0)} ${snap(BIN_Y1)} L ${snap(LABS_X0 + W)} ${snap(BIN_Y1)}`} stroke={accent} strokeWidth={3} opacity={0.5 * binP} />
          <path d={`M ${snap(USERS_X0)} ${snap(BIN_Y1)} L ${snap(USERS_X0 + W)} ${snap(BIN_Y1)}`} stroke={ink} strokeWidth={3} opacity={(0.42 + usersP * 0.24) * binP} />
        </svg>

        {/* Who each container belongs to. No type: the VO names them both. */}
        <div
          style={{
            position: 'absolute',
            left: LABS_X0,
            top: LABEL_Y,
            width: W,
            height: LABEL_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 44,
            opacity: labsP,
            transform: `translateY(${(1 - labsP) * 14}px)`,
          }}
        >
          <div style={{...mark(OPENAI, accent), width: 78, height: 78}} />
          <div style={{...mark(ANTHROPIC, accent), width: 92, height: 92}} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: USERS_X0,
            top: LABEL_Y,
            width: W,
            height: LABEL_H,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
          }}
        >
          {[0, 1, 2, 3, 4].map((n) => {
            const p = interpolate(frame, [beats.users + n * 8, beats.users + n * 8 + 16], [0, 1], out);
            return (
              <div
                key={n}
                style={{...mark(PERSON, ink), width: 64, height: 64, opacity: 0.92 * p, transform: `translateY(${(1 - p) * 14}px)`}}
              />
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ValueCreatedNotCaptured;
