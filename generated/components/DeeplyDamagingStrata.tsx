import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 0:27.600 -> 0:32.939 of the cut: "and so even if future ai agents do much
// more deeply damaging things". Duration = round(5.339 * 30).
export const DURATION = 160;

// Everything lives in a centred band, roughly y 560 -> 1375 of the 1920 canvas.
const SURFACE_Y = 758.5;
const X0 = 105;
const X1 = 975;
const STRATA = [824.5, 890.5, 956.5, 1022.5, 1088.5, 1154.5, 1220.5, 1286.5];

// The incident already under discussion: shallow enough that it breaches no
// layer at all. It stays on screen, dimmed, so "much more" has a referent.
const NOTCH = {x: 200, depth: 810};

// Future agents. Depth accelerates left to right, so the tips trace a curve
// away from the notch; layers breached (1,2,3,4,6) climbs with it, which is
// the same quantity encoded a second time.
type Shaft = {
  x: number;
  depth: number;
  enter: number;
  // Frame the head breaks the surface. The strike is timed from this, not
  // from its release, so the visible damage lands on the word.
  cross: number;
  drive: number;
  bob: number;
  lift: number;
};
const SHAFTS: Shaft[] = [
  {x: 350, depth: 858, enter: 63, cross: 104, drive: 13, bob: 0.8, lift: 8},
  {x: 490, depth: 958, enter: 55, cross: 108, drive: 18, bob: 2.4, lift: -6},
  {x: 630, depth: 1068, enter: 33, cross: 112, drive: 23, bob: 0.0, lift: 0},
  {x: 770, depth: 1188, enter: 59, cross: 117, drive: 28, bob: 4.0, lift: -9},
  {x: 910, depth: 1313, enter: 67, cross: 122, drive: 33, bob: 1.6, lift: 6},
];

// Frames of free fall between release and the surface.
const FALL = 12;

const HOVER_Y = 622;
const CHARGE_RISE = 86;
// A layer is fully split once the head is this far past it.
const SPLIT = 34;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const gauss = (d: number, w: number) => Math.exp(-((d / w) * (d / w)));

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // Beat frames from the SRT at 30fps, relative to 00:00:27.600:
  //   0 "and so even" · 33 "if future" · 55 "ai agents" · 73 "do much more" ·
  //   106 "deeply damaging" · 133 "things" · 160 end
  beats: z.object({
    surface: z.number().int(),
    future: z.number().int(),
    agents: z.number().int(),
    charge: z.number().int(),
    strike: z.number().int(),
    things: z.number().int(),
  }),
});

export type DeeplyDamagingStrataProps = z.infer<typeof schema>;

export const defaultProps: DeeplyDamagingStrataProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  beats: {
    surface: 0,
    future: 33,
    agents: 55,
    charge: 73,
    strike: 106,
    things: 133,
  },
});

const DeeplyDamagingStrata: React.FC<DeeplyDamagingStrataProps> = ({
  ink,
  accent,
  shadow,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // ---- Charge: the agents rise and the ground is brought up out of the dark.
  const charge = interpolate(frame, [beats.charge, beats.charge + 17], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ---- Head positions. The descent value is monotonic and drives every
  // derived thing (splits, sag, the surface punch); the visual value carries
  // the recoil, so a wobbling shaft can never un-crack a layer.
  const heads = SHAFTS.map((s) => {
    const entryAt = (f: number) =>
      interpolate(f, [s.enter, s.enter + 15], [0, 1], {
        easing: Easing.out(Easing.cubic),
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    const hoverAt = (f: number) =>
      HOVER_Y +
      s.lift -
      58 * (1 - entryAt(f)) +
      5 * Math.sin(f / 9.5 + s.bob) -
      CHARGE_RISE *
        interpolate(f, [beats.charge, beats.charge + 17], [0, 1], {
          easing: Easing.inOut(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

    const entry = entryAt(frame);
    const release = s.cross - FALL;
    if (frame <= release) {
      const hover = hoverAt(frame);
      return {shaft: s, entry, descent: hover, visual: hover};
    }

    // Freeze the hover at release so the plunge starts where it stood.
    const hover0 = hoverAt(release);
    if (frame < s.cross) {
      const e = Easing.in(Easing.quad)((frame - release) / FALL);
      const y = hover0 + (SURFACE_Y - hover0) * e;
      return {shaft: s, entry, descent: y, visual: y};
    }

    // Below the surface the ground resists: the drive decelerates, so the
    // shallow strike stalls at once and only the deep ones keep going.
    const q = clamp01((frame - s.cross) / s.drive);
    const y = SURFACE_Y + (s.depth - SURFACE_Y) * Easing.out(Easing.quad)(q);
    const after = frame - (s.cross + s.drive);
    const creep = after > 0 ? 11 * Easing.out(Easing.cubic)(clamp01(after / 22)) : 0;
    const recoil = after > 0 ? -6 * Math.exp(-after / 5) * Math.sin(after * 0.65) : 0;
    return {shaft: s, entry, descent: y + creep, visual: y + creep + recoil};
  });

  // ---- Layer geometry. Sag is summed from the splits, so the ground deforms
  // only where something actually went through it.
  const splitOf = (headY: number, layerY: number) => clamp01((headY - layerY) / SPLIT);

  const quake = frame > 155 ? 4.5 * Math.exp(-(frame - 155) / 11) : 0;

  const layerY = (x: number, base: number, amp: number, ripple: number) => {
    let y = base;
    for (const h of heads) {
      const t = splitOf(h.descent, base);
      if (t > 0) {
        y += t * (amp * 0.26 * gauss(x - h.shaft.x, 82) + amp * gauss(x - h.shaft.x, 32));
      }
    }
    return y + ripple * quake * Math.sin(x / 240 - (frame - 155) * 0.42);
  };

  // Torn open at every crossing: the line stops short of the shaft on both
  // sides, and the free ends are the lowest points of the dip.
  const layerPath = (base: number, amp: number, ripple: number) => {
    let d = '';
    let broken = true;
    for (let x = X0; x <= X1; x += 6) {
      const cut = heads.some(
        (h) => splitOf(h.descent, base) > 0.02 && Math.abs(x - h.shaft.x) < 12,
      );
      if (cut) {
        broken = true;
        continue;
      }
      d += `${broken ? 'M' : 'L'}${x} ${layerY(x, base, amp, ripple).toFixed(2)} `;
      broken = false;
    }
    return d;
  };

  // ---- The depth scan: ambient accent life before the strike, and a reason
  // to expect one. It dies once real depth arrives.
  const scanFade = interpolate(frame, [96, 110], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scanIn = interpolate(frame, [14, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const scanY = 824 + 236 * (1 - Math.cos(((frame - 14) / 96) * Math.PI * 2));

  // ---- Surface draw-on, growing outward from centre.
  const grow = interpolate(frame, [beats.surface, beats.surface + 11], [0.26, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const notchLen = interpolate(frame, [11, 23], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const notchOp = interpolate(frame, [beats.charge, beats.charge + 24], [0.92, 0.64], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const echoFade =
    interpolate(frame, [26, 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
    interpolate(frame, [94, 114], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const echoes = [0, 23]
    .map((delay) => {
      const f = frame - 26 - delay;
      if (f < 0) return null;
      const t = (f % 46) / 46;
      return {r: 16 + 62 * t, op: 0.13 * (1 - t) * echoFade};
    })
    .filter((e): e is {r: number; op: number} => e !== null && e.op > 0.004);

  const surfaceHalves = [
    `M540 ${layerY(540, SURFACE_Y, 11, 0.5).toFixed(2)} ` +
      Array.from({length: 26}, (_, i) => {
        const x = 540 - (i + 1) * ((540 - X0) / 26);
        return `L${x.toFixed(0)} ${layerY(x, SURFACE_Y, 11, 0.5).toFixed(2)} `;
      }).join(''),
    `M540 ${layerY(540, SURFACE_Y, 11, 0.5).toFixed(2)} ` +
      Array.from({length: 26}, (_, i) => {
        const x = 540 + (i + 1) * ((X1 - 540) / 26);
        return `L${x.toFixed(0)} ${layerY(x, SURFACE_Y, 11, 0.5).toFixed(2)} `;
      }).join(''),
  ];

  const splitLines: React.ReactElement[] = [];
  [SURFACE_Y, ...STRATA].forEach((base, li) => {
    heads.forEach((h, hi) => {
      const t = splitOf(h.descent, base);
      if (t <= 0.01) return;
      const e = Easing.out(Easing.cubic)(t);
      const y = layerY(h.shaft.x, base, li === 0 ? 11 : 15, li === 0 ? 0.5 : 1);
      // Unequal arms, stable per (layer, shaft), so a row of splits never
      // resolves into one continuous rule.
      const jitter = (k: number) => {
        const v = Math.sin(li * 12.9898 + hi * 78.233 + k * 37.719) * 43758.5453;
        return 0.62 + 0.38 * (v - Math.floor(v));
      };
      const la = 15 * e * jitter(0);
      const lb = 15 * e * jitter(1);
      splitLines.push(
        <path
          key={`s${li}-${hi}`}
          d={`M${h.shaft.x - 12} ${y.toFixed(2)} L${(h.shaft.x - 12 - la).toFixed(1)} ${y.toFixed(2)} M${h.shaft.x + 12} ${y.toFixed(2)} L${(h.shaft.x + 12 + lb).toFixed(1)} ${y.toFixed(2)}`}
          stroke={accent}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.5 * e}
          fill="none"
        />,
      );
    });
  });

  return (
    <AbsoluteFill>
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{position: 'absolute', overflow: 'visible'}}
      >
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* Strata: unknown ground, lifted as the agents charge, lit locally
              by the scan and permanently by whatever breaks through them. */}
          {STRATA.map((base, i) => {
            const fade = interpolate(frame, [5 + i * 3.4, 18 + i * 3.4], [0, 1], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const scanLit = scanFade * scanIn * 0.42 * gauss(scanY - base, 42);
            const broken = Math.max(...heads.map((h) => splitOf(h.descent, base)));
            const op = Math.min(0.95, (0.17 + 0.22 * charge + scanLit + 0.24 * broken) * fade);
            return (
              <path
                key={`st${i}`}
                d={layerPath(base, 15, 1)}
                stroke={ink}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={op}
                fill="none"
              />
            );
          })}

          {scanFade * scanIn > 0.01 ? (
            <line
              x1={X0}
              y1={Math.round(scanY) + 0.5}
              x2={X1}
              y2={Math.round(scanY) + 0.5}
              stroke={accent}
              strokeWidth={3}
              opacity={0.3 * scanFade * scanIn}
            />
          ) : null}

          {/* The surface. */}
          {surfaceHalves.map((d, i) => (
            <path
              key={`sf${i}`}
              d={d}
              stroke={ink}
              strokeWidth={5}
              strokeLinecap="round"
              opacity={0.92}
              fill="none"
              pathLength={1}
              strokeDasharray={`${grow} ${1 - grow + 0.001}`}
            />
          ))}

          {echoes.map((e, i) => (
            <circle
              key={`e${i}`}
              cx={NOTCH.x}
              cy={SURFACE_Y}
              r={e.r}
              stroke={accent}
              strokeWidth={3}
              opacity={e.op}
              fill="none"
            />
          ))}

          {/* This incident. */}
          <line
            x1={NOTCH.x}
            y1={SURFACE_Y}
            x2={NOTCH.x}
            y2={SURFACE_Y + (NOTCH.depth - SURFACE_Y) * notchLen}
            stroke={accent}
            strokeWidth={10}
            strokeLinecap="round"
            opacity={notchOp * notchLen}
          />

          {heads.map((h, i) => {
            const {shaft: s} = h;
            const punch = clamp01((h.descent - SURFACE_Y) / 58);
            const plumbTop = Math.min(h.visual + 32, SURFACE_Y - 4);
            return (
              <g key={`h${i}`} opacity={h.entry}>
                {h.visual < SURFACE_Y - 6 ? (
                  <line
                    x1={s.x}
                    y1={plumbTop}
                    x2={s.x}
                    y2={SURFACE_Y - 4}
                    stroke={accent}
                    strokeWidth={3}
                    strokeDasharray="9 15"
                    strokeDashoffset={-frame * (1.6 + 2.2 * charge)}
                    opacity={0.22 + 0.45 * charge}
                  />
                ) : null}

                {h.visual > SURFACE_Y ? (
                  <line
                    x1={s.x}
                    y1={SURFACE_Y}
                    x2={s.x}
                    y2={h.visual}
                    stroke={accent}
                    strokeWidth={10}
                    strokeLinecap="butt"
                  />
                ) : null}

                {punch > 0 && punch < 1 ? (
                  <circle
                    cx={s.x}
                    cy={SURFACE_Y}
                    r={16 + 74 * punch}
                    stroke={accent}
                    strokeWidth={5}
                    opacity={0.55 * (1 - punch)}
                    fill="none"
                  />
                ) : null}

                <circle cx={s.x} cy={h.visual} r={13} fill={accent} />
                <path
                  d={`M${s.x - 9} ${h.visual + 8} L${s.x + 9} ${h.visual + 8} L${s.x} ${h.visual + 32} Z`}
                  fill={accent}
                />
              </g>
            );
          })}

          {splitLines}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default DeeplyDamagingStrata;
