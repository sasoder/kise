import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 00:00:33.399 -> 00:00:40.780 of the source cut. round(7.381 * 30).
export const DURATION = 221;

// ---------------------------------------------------------------------------
// One capability, one probe, two identical systems. The probe finds the same
// entry point in both. On your own system the finding is welded shut; on the
// second — a literal duplicate that arrives late — the same finding is torn
// open and the contents walk out. Nothing is labelled: the systems being
// identical is the whole argument, so any difference between them would be a
// lie about what he is saying.
// ---------------------------------------------------------------------------
const CX = 540;
const LOGO_CY = 265;
const LOGO_SIZE = 168;

const SYS_W = 380;
const SYS_H = 310;
const SYS_TOP = 478;
const SOLO_CX = 540;
const LEFT_CX = 310;
const RIGHT_CX = 770;
const CORNER = 18;

// The way in, sitting on the perimeter, on the spine of the system.
const ENTRY_X = 190;
const ENTRY_R = 11;
const NODE_R = 10;
const BREACH_GAP = 128;
const WELD_W = 56;
const WELD_H = 9;

// A core with things hanging off it, in system-local coordinates. No edge
// crosses another: the shape has to be legible in one glance at 0.85 ink over
// arbitrary footage, and again as a copy of itself two seconds later.
const NODES = [
  {x: 190, y: 152}, // 0 core
  {x: 76, y: 80}, // 1
  {x: 304, y: 80}, // 2
  {x: 68, y: 236}, // 3
  {x: 312, y: 236}, // 4
  {x: 190, y: 262}, // 5
];

// Somebody else's: the same anatomy — same perimeter, same core, same way in —
// laid out differently, because it is a different system. The argument is that
// the evaluation is identical, not that the target is; the entry sits in the
// same place in both so the probe can be seen doing the same thing twice.
const NODES_B = [
  {x: 200, y: 166}, // 0 core
  {x: 80, y: 62}, // 1
  {x: 306, y: 100}, // 2
  {x: 62, y: 214}, // 3
  {x: 316, y: 208}, // 4
  {x: 162, y: 272}, // 5
];

// -1 is the entry node on the perimeter: the single edge crossing the boundary.
const EDGES: [number, number][] = [
  [-1, 0],
  [0, 1],
  [0, 2],
  [0, 3],
  [0, 4],
  [0, 5],
  [1, 3],
  [2, 4],
  [3, 5],
  [4, 5],
];

// What leaves, in the order it leaves. The core goes first, which takes every
// spoke with it; what stays behind is a perimeter with the middle missing.
const TAKEN = [
  {node: 0, delay: 0, rest: {x: 190, y: -128}},
  {node: 2, delay: 4, rest: {x: 280, y: -96}},
  {node: 5, delay: 8, rest: {x: 100, y: -96}},
];
const GAP_PT = {x: ENTRY_X, y: -6};
const THROUGH = 0.58;

const ease = {
  out: Easing.out(Easing.cubic),
  pop: Easing.bezier(0.2, 1.5, 0.4, 1),
};

const ramp = (
  frame: number,
  range: [number, number],
  out: [number, number],
  easing: (n: number) => number = ease.out,
) =>
  interpolate(frame, range, out, {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Forces the artwork to the accent colour while keeping its alpha, so the logo
// lands as exactly the accent rather than an approximation of it.
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

// Perimeter as one path with a parametric gap at the entry. Drawn W -> S -> E
// -> N so every corner sweeps the same way and the gap can open without the
// rest of the outline shifting.
const perimeter = (gap: number) => {
  const l = ENTRY_X - gap / 2;
  const r = ENTRY_X + gap / 2;
  const c = CORNER;
  return [
    `M ${l} 0`,
    `H ${c}`,
    `A ${c} ${c} 0 0 0 0 ${c}`,
    `V ${SYS_H - c}`,
    `A ${c} ${c} 0 0 0 ${c} ${SYS_H}`,
    `H ${SYS_W - c}`,
    `A ${c} ${c} 0 0 0 ${SYS_W} ${SYS_H - c}`,
    `V ${c}`,
    `A ${c} ${c} 0 0 0 ${SYS_W - c} 0`,
    `H ${r}`,
  ].join(' ');
};

export const schema = z.object({
  icon: z.string(),
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // Three states, in order: unknown -> read -> receded context.
  unknownOpacity: z.number().min(0).max(1),
  readOpacity: z.number().min(0).max(1),
  // The first system stays legible once the second arrives, but stops
  // competing with it. Annotation never goes on top of a bright ink field.
  recededOpacity: z.number().min(0).max(1),
  // Beat frames from the SRT at 30fps, relative to 00:00:33.399:
  //   0 "obviously" · 13 "it is a" · 25 "dual use" · 37 "use case right?"
  //   57 "like you" · 65 "want to be" · 77 "able to" · 82 "patch your"
  //   91 "own code" · 107 "if you do" · 133 "the same" · 152 "evaluation on"
  //   172 "somebody else's" · 186 "code you" · 197 "can hack their"
  //   209 "system" (ends 221)
  beats: z.object({
    logo: z.number().int(),
    pulse: z.number().int(),
    system: z.number().int(),
    read: z.number().int(),
    probe: z.number().int(),
    found: z.number().int(),
    weld: z.number().int(),
    retract: z.number().int(),
    recede: z.number().int(),
    copy: z.number().int(),
    probe2: z.number().int(),
    found2: z.number().int(),
    breach: z.number().int(),
  }),
});

export type DualUseSameProbeProps = z.infer<typeof schema>;

export const defaultProps: DualUseSameProbeProps = schema.parse({
  icon: 'claude.png',
  ink: '#FFFFFF',
  accent: '#C15F3C',
  shadow: 'rgba(0, 0, 0, 0.28)',
  unknownOpacity: 0.28,
  readOpacity: 0.85,
  recededOpacity: 0.5,
  beats: {
    logo: 0,
    pulse: 25,
    system: 37,
    read: 57,
    probe: 82,
    found: 91,
    weld: 100,
    retract: 133,
    recede: 152,
    copy: 172,
    probe2: 186,
    found2: 194,
    breach: 197,
  },
});

type SysProps = {
  ink: string;
  accent: string;
  inkOpacity: number;
  nodes: {x: number; y: number}[];
  nodeEnter: (i: number) => number;
  edgeEnter: number;
  gap: number;
  weld: number;
  // Per-entry travel of the three nodes that leave, 0 = home, 1 = outside.
  taken: number[];
};

const System: React.FC<SysProps> = ({
  ink,
  accent,
  inkOpacity,
  nodes,
  nodeEnter,
  edgeEnter,
  gap,
  weld,
  taken,
}) => {
  const travelOf = (i: number) => {
    const k = TAKEN.findIndex((t) => t.node === i);
    return k < 0 ? 0 : taken[k];
  };

  const posOf = (i: number) => {
    if (i < 0) return GAP_PT;
    const home = nodes[i];
    const k = TAKEN.findIndex((t) => t.node === i);
    if (k < 0) return home;
    const t = taken[k];
    if (t <= 0) return home;
    if (t < THROUGH) {
      const p = t / THROUGH;
      return {x: lerp(home.x, GAP_PT.x, p), y: lerp(home.y, GAP_PT.y, p)};
    }
    const p = (t - THROUGH) / (1 - THROUGH);
    const rest = TAKEN[k].rest;
    return {x: lerp(GAP_PT.x, rest.x, p), y: lerp(GAP_PT.y, rest.y, p)};
  };

  const entryPos = {x: ENTRY_X, y: 0};

  return (
    <g>
      <path
        d={perimeter(gap)}
        fill="none"
        stroke={ink}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={inkOpacity * 0.55 * edgeEnter}
      />

      {/* The weld: the finding filled in, flush with the boundary it was
          found in. Same object as the hole the other one loses. */}
      {weld > 0 ? (
        <rect
          x={ENTRY_X - (WELD_W * weld) / 2}
          y={-WELD_H / 2}
          width={WELD_W * weld}
          height={WELD_H}
          rx={WELD_H / 2}
          fill={accent}
        />
      ) : null}

      {EDGES.map(([a, b], i) => {
        const pa = a < 0 ? entryPos : posOf(a);
        const pb = b < 0 ? entryPos : posOf(b);
        // An edge dies when it is stretched between something leaving and
        // something staying. An edge whose ends both leave travels with them,
        // so what walks out is a connected piece of the system.
        const both = travelOf(a) > 0 && travelOf(b) > 0;
        const t = both ? 0 : Math.max(travelOf(a), travelOf(b));
        const alive = 1 - ramp(t, [0.06, 0.42], [0, 1], Easing.linear);
        const o = inkOpacity * edgeEnter * alive * Math.min(nodeEnter(a), nodeEnter(b));
        if (o <= 0.001) return null;
        return (
          <line
            key={i}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke={ink}
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={o}
          />
        );
      })}

      {nodes.map((_, i) => {
        const p = posOf(i);
        const e = nodeEnter(i);
        if (e <= 0) return null;
        return (
          <circle key={i} cx={p.x} cy={p.y} r={NODE_R * e} fill={ink} opacity={inkOpacity} />
        );
      })}

      {/* The entry itself: present while there is a boundary to enter, gone
          once the boundary is open. */}
      <circle
        cx={ENTRY_X}
        cy={0}
        r={ENTRY_R * nodeEnter(-1)}
        fill={weld > 0 ? interpolateColors(weld, [0, 1], [ink, accent]) : ink}
        opacity={(weld > 0 ? Math.max(inkOpacity, weld) : inkOpacity) * (1 - Math.min(gap / 40, 1))}
      />
    </g>
  );
};

const Owner: React.FC<{ink: string; opacity: number; enter: number}> = ({
  ink,
  opacity,
  enter,
}) => {
  if (enter <= 0) return null;
  const y = SYS_H + 36;
  return (
    <g opacity={opacity * enter}>
      <line
        x1={SYS_W / 2}
        y1={SYS_H + 4}
        x2={SYS_W / 2}
        y2={y}
        stroke={ink}
        strokeWidth={2}
        opacity={0.5}
      />
      <circle cx={SYS_W / 2} cy={y + 22} r={16} fill={ink} />
      <path
        d={`M ${SYS_W / 2 - 31} ${y + 82} a 31 31 0 0 1 62 0`}
        fill={ink}
      />
    </g>
  );
};

const DualUseSameProbe: React.FC<DualUseSameProbeProps> = ({
  icon,
  ink,
  accent,
  shadow,
  unknownOpacity,
  readOpacity,
  recededOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const [tr, tg, tb] = rgbOf(accent);

  const logoIn = ramp(frame, [beats.logo, beats.logo + 13], [0, 1], ease.pop);
  const pulse = ramp(frame, [beats.pulse, beats.pulse + 22], [0, 1], Easing.out(Easing.quad));

  // --- first system -------------------------------------------------------
  const sysEnter = ramp(frame, [beats.system, beats.system + 18], [0, 1]);
  const leftNodeEnter = (i: number) => {
    const k = i < 0 ? 0 : i + 1;
    return ramp(frame, [beats.system + k * 2.4, beats.system + k * 2.4 + 13], [0, 1]);
  };
  const leftInk = interpolate(
    frame,
    [beats.read, beats.read + 20, beats.recede, beats.recede + 18],
    [unknownOpacity, readOpacity, readOpacity, recededOpacity],
    {easing: ease.out, extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const weld = ramp(frame, [beats.weld, beats.weld + 15], [0, 1]);
  const leftCx = ramp(frame, [beats.recede, beats.copy], [SOLO_CX, LEFT_CX]);

  // --- the duplicate ------------------------------------------------------
  // It leaves the first system and travels to its own place, so it reads as a
  // copy of that system rather than a second, different one.
  const copy = ramp(frame, [beats.copy, beats.copy + 15], [0, 1]);
  // It arrives in its own place rather than travelling out of the first one —
  // the two are never drawn on top of each other, and nothing suggests the
  // second system came from the first.
  const rightRise = lerp(72, 0, copy);
  const rightNodeEnter = () => 1;

  const breach = ramp(frame, [beats.breach, beats.breach + 11], [0, 1]);
  const taken = TAKEN.map((t) =>
    ramp(frame, [beats.breach + 2 + t.delay, beats.breach + 2 + t.delay + 13], [0, 1]),
  );

  // --- the probe ----------------------------------------------------------
  // One object. It extends, retracts to the logo, and extends again — never a
  // second beam, because there is only ever one capability in the frame.
  const origin = {x: CX, y: LOGO_CY + LOGO_SIZE / 2 - 4};
  const reach1 =
    ramp(frame, [beats.probe, beats.probe + 12], [0, 1]) *
    (1 - ramp(frame, [beats.retract, beats.retract + 14], [0, 1]));
  const reach2 = ramp(frame, [beats.probe2, beats.probe2 + 11], [0, 1]);

  const ring1 =
    ramp(frame, [beats.found, beats.found + 8], [0, 1], ease.pop) * (1 - weld);
  const ring2 = ramp(frame, [beats.found2, beats.found2 + 7], [0, 1], ease.pop);
  // The reticle blows outward as the boundary opens: the lock, not the loot.
  const ring2R = lerp(17, 44, breach);

  const Beam: React.FC<{cx: number; lift?: number; reach: number}> = ({cx, lift = 0, reach}) => {
    if (reach <= 0.001) return null;
    const target = {x: cx - SYS_W / 2 + ENTRY_X, y: SYS_TOP - lift};
    return (
      <line
        x1={origin.x}
        y1={origin.y}
        x2={lerp(origin.x, target.x, reach)}
        y2={lerp(origin.y, target.y, reach)}
        stroke={accent}
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.9}
      />
    );
  };

  const logoSize = LOGO_SIZE * lerp(0.86, 1, logoIn);

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="claude-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {/* "dual use": the capability announcing itself, once. */}
          {pulse > 0 && pulse < 1 ? (
            <circle
              cx={CX}
              cy={LOGO_CY}
              r={lerp(LOGO_SIZE / 2, LOGO_SIZE / 2 + 118, pulse)}
              fill="none"
              stroke={accent}
              strokeWidth={3}
              opacity={0.55 * (1 - pulse)}
            />
          ) : null}

          <Beam cx={leftCx} reach={reach1} />
          <Beam cx={RIGHT_CX} lift={-rightRise} reach={reach2} />

          <g transform={`translate(${leftCx - SYS_W / 2}, ${SYS_TOP})`}>
            <System
              ink={ink}
              accent={accent}
              inkOpacity={leftInk}
              nodes={NODES}
              nodeEnter={leftNodeEnter}
              edgeEnter={sysEnter}
              gap={0}
              weld={weld}
              taken={[0, 0, 0]}
            />
            <Owner ink={ink} opacity={leftInk} enter={ramp(frame, [beats.read, beats.read + 14], [0, 1])} />
          </g>

          {copy > 0 ? (
            <g
              opacity={copy}
              transform={`translate(${RIGHT_CX - SYS_W / 2}, ${SYS_TOP + rightRise})`}
            >
              <System
                ink={ink}
                accent={accent}
                inkOpacity={readOpacity}
                nodes={NODES_B}
                nodeEnter={rightNodeEnter}
                edgeEnter={1}
                gap={BREACH_GAP * breach}
                weld={0}
                taken={taken}
              />
              <Owner ink={ink} opacity={readOpacity} enter={1} />
            </g>
          ) : null}

          {ring1 > 0.001 ? (
            <circle
              cx={leftCx - SYS_W / 2 + ENTRY_X}
              cy={SYS_TOP}
              r={lerp(44, 17, ring1)}
              fill="none"
              stroke={accent}
              strokeWidth={3}
              opacity={ring1}
            />
          ) : null}

          {ring2 > 0.001 ? (
            <circle
              cx={RIGHT_CX - SYS_W / 2 + ENTRY_X}
              cy={SYS_TOP + rightRise}
              r={lerp(44, ring2R, ring2)}
              fill="none"
              stroke={accent}
              strokeWidth={3}
              opacity={ring2 * (1 - breach)}
            />
          ) : null}
        </g>
      </svg>

      {logoIn > 0 ? (
        <Img
          src={staticFile(icon)}
          style={{
            position: 'absolute',
            left: CX - logoSize / 2,
            top: LOGO_CY - logoSize / 2,
            width: logoSize,
            height: logoSize,
            opacity: logoIn,
            filter: `url(#claude-tint) drop-shadow(0 2px 6px ${shadow})`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export default DualUseSameProbe;
