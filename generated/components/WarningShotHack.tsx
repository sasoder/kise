import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 0:00.000 -> 0:11.279 of the cut: "...clearest warning shot we ever get for
// loss of control".
export const DURATION = 338;

// The agent, its assigned task, and the bystander it hacked instead.
const AGENT = {x: 300, y: 440};
const TARGET = {x: 845, y: 415};
const HF = {x: 540, y: 1340};
const HF_W = 330;
const HF_H = HF_W * (512 / 551);
// Visual radius of the face, where rings launch.
const HF_R = 158;

// Intended task path: agent -> target, a shallow quadratic arc. Its dashes
// flow along it like a work queue until the hack, then the queue stalls.
const TASK = {
  p0: {x: 395, y: 418},
  c: {x: 575, y: 322},
  p1: {x: 768, y: 398},
};
const DASHES = 14;
const DASH_LEN = 0.042;
const FLOW = 0.0026;

// Actual trajectory: starts along the task path, peels off, dives to HF.
// The end point sits inside the face so the idle bob never exposes the joint.
const TRAIL = [
  {p0: [385, 462], c1: [545, 385], c2: [690, 408], p3: [706, 566]},
  {p0: [706, 566], c1: [726, 768], c2: [668, 962], p3: [562, 1205]},
] as const;

const quadAt = (t: number) => {
  const u = 1 - t;
  return {
    x: u * u * TASK.p0.x + 2 * u * t * TASK.c.x + t * t * TASK.p1.x,
    y: u * u * TASK.p0.y + 2 * u * t * TASK.c.y + t * t * TASK.p1.y,
  };
};

const cubicAt = (b: (typeof TRAIL)[number], t: number) => {
  const u = 1 - t;
  const a = u * u * u;
  const c = 3 * u * u * t;
  const d = 3 * u * t * t;
  const e = t * t * t;
  return [
    a * b.p0[0] + c * b.c1[0] + d * b.c2[0] + e * b.p3[0],
    a * b.p0[1] + c * b.c1[1] + d * b.c2[1] + e * b.p3[1],
  ];
};

// Dense polyline of the trail with cumulative arc length, so the drawn
// length, the comet head, and the travelling pulses all come from the same
// samples and cannot drift apart.
const TRAIL_PTS: Array<[number, number]> = [];
for (const seg of TRAIL) {
  for (let i = 0; i <= 60; i++) {
    const p = cubicAt(seg, i / 60);
    const prev = TRAIL_PTS[TRAIL_PTS.length - 1];
    if (!prev || prev[0] !== p[0] || prev[1] !== p[1]) TRAIL_PTS.push([p[0], p[1]]);
  }
}
const TRAIL_LEN: number[] = [0];
for (let i = 1; i < TRAIL_PTS.length; i++) {
  const [ax, ay] = TRAIL_PTS[i - 1];
  const [bx, by] = TRAIL_PTS[i];
  TRAIL_LEN.push(TRAIL_LEN[i - 1] + Math.hypot(bx - ax, by - ay));
}
const TRAIL_TOTAL = TRAIL_LEN[TRAIL_LEN.length - 1];

const pointAtLen = (len: number): [number, number] => {
  const l = Math.min(Math.max(len, 0), TRAIL_TOTAL);
  for (let i = 1; i < TRAIL_PTS.length; i++) {
    if (TRAIL_LEN[i] >= l) {
      const k = (l - TRAIL_LEN[i - 1]) / (TRAIL_LEN[i] - TRAIL_LEN[i - 1]);
      const [ax, ay] = TRAIL_PTS[i - 1];
      const [bx, by] = TRAIL_PTS[i];
      return [ax + (bx - ax) * k, ay + (by - ay) * k];
    }
  }
  return TRAIL_PTS[TRAIL_PTS.length - 1];
};

const sliceBetween = (a: number, b: number) => {
  const lo = Math.max(a, 0);
  const hi = Math.min(b, TRAIL_TOTAL);
  if (hi - lo < 1) return null;
  const pts: Array<[number, number]> = [pointAtLen(lo)];
  for (let i = 1; i < TRAIL_PTS.length; i++) {
    if (TRAIL_LEN[i] > lo && TRAIL_LEN[i] < hi) pts.push(TRAIL_PTS[i]);
  }
  pts.push(pointAtLen(hi));
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
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

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  // Studio backdrop in public/, blurred and darkened so the white/cyan
  // graphic keeps its contrast. bgDim is a brightness multiplier.
  background: z.string(),
  bgBlur: z.number().min(0).max(40),
  bgDim: z.number().min(0.1).max(1),
  // The agent mark, black-on-alpha in public/, tinted to the accent.
  agentLogo: z.string(),
  agentSize: z.number().min(80).max(400),
  // The hacked bystander, drawn in its own colours on purpose: the one thing
  // outside the system's palette is the thing that was not part of the plan.
  victimLogo: z.string(),
  // Beat frames from the SRT at 30fps, relative to 00:00:00.000:
  //   0 "i think" · 9 "one thing" · 29 "that feels" · 48 "especially" ·
  //   68 "concerning" · 95 "to me" · 112 "about this" · 136 "whole incident" ·
  //   199 "be the clearest" · 236 "warning shot we" · 285 "ever get" ·
  //   317 "for loss" · 338 end of "of control"
  beats: z.object({
    agentIn: z.number().int(),
    pathDraw: z.number().int(),
    hfEnter: z.number().int(),
    trailStart: z.number().int(),
    toMe: z.number().int(),
    aboutThis: z.number().int(),
    impact: z.number().int(),
    prePing: z.number().int(),
    warningShot: z.number().int(),
    echo: z.number().int(),
    dissolve: z.number().int(),
  }),
});

export type WarningShotHackProps = z.infer<typeof schema>;

export const defaultProps: WarningShotHackProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  background: 'grid-background.jpg',
  bgBlur: 12,
  bgDim: 0.35,
  agentLogo: 'openai-chatgpt-logo.png',
  agentSize: 200,
  victimLogo: 'hugging-face.webp',
  beats: {
    agentIn: 0,
    pathDraw: 9,
    hfEnter: 29,
    trailStart: 68,
    toMe: 95,
    aboutThis: 112,
    impact: 136,
    prePing: 199,
    warningShot: 236,
    echo: 285,
    dissolve: 317,
  },
});

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

const WarningShotHack: React.FC<WarningShotHackProps> = ({
  ink,
  accent,
  shadow,
  background,
  bgBlur,
  bgDim,
  agentLogo,
  agentSize,
  victimLogo,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const [tr, tg, tb] = rgbOf(accent);

  // ---- Continuous layers: something is alive on every frame. ----

  // The agent works the whole time: slow spin plus a gentle bob, spinning up
  // while it runs the hack, easing back once the deed is done.
  const spinBoost = interpolate(
    frame,
    [beats.trailStart, beats.impact, beats.impact + 30],
    [0, 52, 58],
    {easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const agentRot = frame * 0.34 + spinBoost;
  const agentBob = 4 * Math.sin((frame / 70) * Math.PI * 2);

  // Work-queue flow along the task path: constant until the hack lands, then
  // the queue visibly stalls to a stop over ~24 frames.
  const stallT = clamp01((frame - beats.impact) / 24);
  const phase =
    frame <= beats.impact
      ? FLOW * frame
      : FLOW * beats.impact + FLOW * 24 * (stallT - (stallT * stallT) / 2);

  // The waiting objective breathes until it stops mattering.
  const targetBreathR = 2.5 * Math.sin((frame / 80) * Math.PI * 2);
  const targetBreathOp = 0.06 * Math.sin((frame / 80) * Math.PI * 2 + 1);

  // HF idles innocently, leans away as the comet closes in, wobbles out of
  // the impact, and settles back into a slightly faster nervous bob.
  const idleRate = frame < beats.impact ? 75 : 58;
  const hfBob = 5 * Math.sin((frame / idleRate) * Math.PI * 2);
  const hfIdleRot = 1.2 * Math.sin((frame / 92) * Math.PI * 2 + 1);
  const lean = interpolate(
    frame,
    [beats.impact - 16, beats.impact - 2, beats.impact + 14, beats.impact + 32],
    [0, -4, -4, 0],
    {easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const wobble =
    frame > beats.impact
      ? 4.5 * Math.sin((frame - beats.impact) * 0.85) * Math.exp(-(frame - beats.impact) / 13)
      : 0;

  // ---- Entrances. ----

  const agentIn = interpolate(frame, [beats.agentIn, beats.agentIn + 11], [0, 1], {
    easing: Easing.bezier(0.2, 1.4, 0.4, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const targetIn = interpolate(frame, [beats.pathDraw + 14, beats.pathDraw + 26], [0, 1], {
    easing: Easing.bezier(0.2, 1.4, 0.4, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const targetOut = interpolate(frame, [beats.dissolve, beats.dissolve + 14], [1, 0.16], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const hfIn = interpolate(frame, [beats.hfEnter, beats.hfEnter + 22], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Landing settle: a soft squash as the rise finishes, on "especially".
  const landSy = interpolate(
    frame,
    [beats.hfEnter + 18, beats.hfEnter + 23, beats.hfEnter + 30],
    [1, 0.955, 1],
    {easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  // Dashes reveal agent-outward while already flowing.
  const reveal = interpolate(frame, [beats.pathDraw, beats.pathDraw + 27], [0, 1.15], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ---- The rogue trail, locked to the spoken beats on its way down. ----

  const trailFrac = interpolate(
    frame,
    [beats.trailStart, beats.toMe, beats.aboutThis, beats.impact - 5, beats.impact],
    [0, 0.36, 0.6, 0.94, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const drawnLen = TRAIL_TOTAL * trailFrac;
  const trailD = sliceBetween(0, drawnLen);
  const tip = pointAtLen(drawnLen);
  const trailW = interpolate(frame, [beats.dissolve, beats.dissolve + 12], [11, 14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const trailOp = interpolate(frame, [beats.dissolve, beats.dissolve + 12], [0.85, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const tipOut = interpolate(frame, [beats.impact, beats.impact + 8], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // Comet wake: ghost dots trailing the head while it draws.
  const wake = [
    {back: 26, r: 10, op: 0.5},
    {back: 52, r: 7, op: 0.3},
    {back: 82, r: 5, op: 0.15},
  ];

  // ---- Pulses: the agent keeps transmitting, and each arrival is a ping. ----

  const pulses = [
    {depart: beats.prePing - 27, arrive: beats.prePing, w: 15, win: 55, op: 1},
    {depart: beats.warningShot - 26, arrive: beats.warningShot, w: 19, win: 80, op: 1},
    {depart: beats.echo - 27, arrive: beats.echo, w: 14, win: 55, op: 0.9},
  ]
    .map((p) => {
      const t = (frame - p.depart) / (p.arrive - p.depart);
      if (t <= 0 || t >= 1) return null;
      const eased = interpolate(t, [0, 1], [0, 1], {easing: Easing.inOut(Easing.quad)});
      const c = eased * TRAIL_TOTAL;
      return {d: sliceBetween(c - p.win, c + p.win), w: p.w, op: p.op};
    })
    .filter((p): p is NonNullable<typeof p> => p !== null && p.d !== null);

  // ---- Impact. ----

  const sx = interpolate(
    frame,
    [beats.impact, beats.impact + 3, beats.impact + 9, beats.impact + 15, beats.impact + 20],
    [1, 1.1, 0.96, 1.012, 1],
    {easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const sy = interpolate(
    frame,
    [beats.impact, beats.impact + 3, beats.impact + 9, beats.impact + 15, beats.impact + 20],
    [1, 0.89, 1.05, 0.99, 1],
    {easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const ticks = interpolate(frame, [beats.impact, beats.impact + 4, beats.impact + 16], [0, 1, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ---- Pings. Each one physically leaves the face. ----

  const bump = (launch: number, amount: number) =>
    amount *
    interpolate(frame, [launch, launch + 4, launch + 13], [0, 1, 0], {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const pulse =
    1 + bump(beats.prePing, 0.025) + bump(beats.warningShot, 0.06) + bump(beats.echo, 0.03);

  const ring = (launch: number, life: number, rMax: number, baseOp: number, sw: number) => {
    const t = (frame - launch) / life;
    if (t <= 0 || t >= 1) return null;
    const eased = 1 - (1 - t) ** 3;
    return {
      r: HF_R + (rMax - HF_R) * eased,
      op: baseOp * (1 - t) ** 1.4,
      sw: sw * (1 - 0.45 * t),
    };
  };
  const rings = [
    // A short sharp shockwave right at the impact itself.
    ring(beats.impact, 15, 290, 0.7, 7),
    ring(beats.prePing, 40, 330, 0.4, 5),
    ring(beats.warningShot, 55, 580, 1, 10),
    ring(beats.warningShot + 5, 60, 680, 0.7, 7),
    ring(beats.warningShot + 11, 65, 780, 0.5, 5),
    ring(beats.warningShot + 18, 68, 850, 0.32, 4),
    ring(beats.echo, 45, 470, 0.45, 6),
  ].filter((r): r is NonNullable<typeof r> => r !== null);

  // ---- Task-path dashes: a flowing queue, revealed, stalled, scattered. ----

  const dashes = Array.from({length: DASHES}, (_, i) => {
    const t0 = (i / DASHES + phase) % 1;
    const t1 = t0 + DASH_LEN;
    const a = quadAt(t0);
    const b = quadAt(Math.min(t1, 1));
    // Conveyor ends: dashes fade in at the agent and out at the target.
    const ends = clamp01(t0 / 0.06) * clamp01((1 - t1) / 0.08 + 0.2);
    const born = clamp01((reveal - t0) / 0.08);
    const gone = interpolate(
      frame,
      [beats.dissolve + i * 0.6, beats.dissolve + i * 0.6 + 10],
      [0, 1],
      {easing: Easing.in(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
    );
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = (-(b.y - a.y) / len) * (i % 2 === 0 ? 1 : -1);
    const ny = ((b.x - a.x) / len) * (i % 2 === 0 ? 1 : -1);
    const drift = gone * 26;
    return {
      x1: a.x + nx * drift,
      y1: a.y + ny * drift,
      x2: b.x + nx * drift,
      y2: b.y + ny * drift,
      op: 0.45 * born * ends * (1 - gone),
    };
  });

  const agentBox = agentSize * agentIn;
  const hfRiseY = (1 - hfIn) * 90;

  // ---- Camera: opens tight on the agent and its task, widens as HF enters,
  // dives with the comet, kicks on impact, pulls wide for the warning shot,
  // then settles. Composed from eased moves so cuts between them are smooth,
  // with a breathing drift so it never locks off. ----

  const mv = (from: number, to: number, by: number) =>
    by *
    interpolate(frame, [from, to], [0, 1], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const shakeEnv = frame > beats.impact ? Math.exp(-(frame - beats.impact) / 8) : 0;
  const camX =
    480 +
    mv(beats.hfEnter - 1, beats.hfEnter + 29, 60) +
    6 * Math.sin((frame / 85) * Math.PI * 2) +
    shakeEnv * 5 * Math.sin((frame - beats.impact) * 1.9);
  const camY =
    520 +
    mv(beats.hfEnter - 1, beats.hfEnter + 29, 370) +
    mv(beats.trailStart + 2, beats.impact, 232) +
    mv(beats.impact + 14, beats.prePing + 1, -150) +
    mv(beats.warningShot, beats.warningShot + 28, 65) +
    mv(beats.echo + 5, beats.echo + 45, -105) +
    4 * Math.sin((frame / 103) * Math.PI * 2 + 2) +
    shakeEnv * 3 * Math.sin((frame - beats.impact) * 2.6 + 1);
  const camZ =
    1.34 +
    mv(beats.hfEnter - 1, beats.hfEnter + 29, -0.34) +
    mv(beats.trailStart + 2, beats.impact, 0.13) +
    mv(beats.impact + 14, beats.prePing + 1, -0.12) +
    mv(beats.warningShot, beats.warningShot + 26, -0.12) +
    mv(beats.echo + 5, beats.echo + 45, 0.06) +
    0.05 * bump(beats.impact, 1) +
    0.006 * Math.sin((frame / 95) * Math.PI * 2);

  // The blurred backdrop tracks the camera at a fraction of its motion.
  const bgX = (540 - camX) * 0.1;
  const bgY = (960 - camY) * 0.1;
  const bgScale = 1 + (camZ - 1) * 0.22;

  return (
    <AbsoluteFill style={{backgroundColor: '#101010'}}>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="agent-tint" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      {/* Backdrop, oversized so the blur never shows a bright fringe. */}
      <Img
        src={staticFile(background)}
        style={{
          position: 'absolute',
          left: -80,
          top: -80,
          width: width + 160,
          height: height + 160,
          objectFit: 'cover',
          transform: `translate(${bgX}px, ${bgY}px) scale(${bgScale})`,
          filter: `blur(${bgBlur}px) brightness(${bgDim})`,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: '0 0',
          transform: `translate(${width / 2}px, ${height / 2}px) scale(${camZ}) translate(${-camX}px, ${-camY}px)`,
        }}
      >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{overflow: 'visible', position: 'absolute'}}>
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>
          {dashes.map((d, i) =>
            d.op > 0.004 ? (
              <line
                key={`d${i}`}
                x1={d.x1}
                y1={d.y1}
                x2={d.x2}
                y2={d.y2}
                stroke={ink}
                strokeWidth={5}
                strokeLinecap="round"
                opacity={d.op}
              />
            ) : null,
          )}

          {/* The assigned task, waiting. */}
          <g opacity={(0.5 + targetBreathOp) * targetIn * targetOut}>
            <circle
              cx={TARGET.x}
              cy={TARGET.y}
              r={(62 + targetBreathR) * targetIn}
              fill="none"
              stroke={ink}
              strokeWidth={5}
            />
            <circle cx={TARGET.x} cy={TARGET.y} r={15 * targetIn} fill={ink} />
          </g>

          {rings.map((r, i) => (
            <circle
              key={`r${i}`}
              cx={HF.x}
              cy={HF.y + hfBob * 0.4}
              r={r.r}
              fill="none"
              stroke={accent}
              strokeWidth={r.sw}
              opacity={r.op}
            />
          ))}

          {trailD ? (
            <path
              d={trailD}
              fill="none"
              stroke={accent}
              strokeWidth={trailW}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={trailOp}
            />
          ) : null}

          {pulses.map((p, i) => (
            <path
              key={`p${i}`}
              d={p.d as string}
              fill="none"
              stroke={accent}
              strokeWidth={p.w}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={p.op}
            />
          ))}

          {trailFrac > 0 && trailFrac < 1 ? (
            <g opacity={tipOut}>
              {wake.map((w, i) => {
                const [wx, wy] = pointAtLen(drawnLen - w.back);
                return drawnLen > w.back ? (
                  <circle key={`w${i}`} cx={wx} cy={wy} r={w.r} fill={accent} opacity={w.op} />
                ) : null;
              })}
              <circle cx={tip[0]} cy={tip[1]} r={16} fill={accent} />
            </g>
          ) : null}

          {ticks > 0 ? (
            <g
              stroke={accent}
              strokeWidth={9}
              strokeLinecap="round"
              opacity={ticks}
              transform={`translate(${HF.x + 24} ${HF.y - HF_R - 24})`}
            >
              <line x1={-52} y1={-14} x2={-82 - 18 * ticks} y2={-40 - 12 * ticks} />
              <line x1={4} y1={-34} x2={6} y2={-72 - 20 * ticks} />
              <line x1={58} y1={-8} x2={90 + 18 * ticks} y2={-32 - 12 * ticks} />
            </g>
          ) : null}
        </g>
      </svg>

      {agentBox >= 1 ? (
        <Img
          src={staticFile(agentLogo)}
          style={{
            position: 'absolute',
            left: AGENT.x - agentSize / 2,
            top: AGENT.y - agentSize / 2,
            width: agentSize,
            height: agentSize,
            transform: `translateY(${agentBob}px) rotate(${agentRot}deg) scale(${agentIn})`,
            filter: `url(#agent-tint) drop-shadow(0 2px 6px ${shadow})`,
          }}
        />
      ) : null}

      {hfIn > 0 ? (
        <div
          style={{
            position: 'absolute',
            left: HF.x - HF_W / 2,
            top: HF.y - HF_H / 2 + hfRiseY + hfBob,
            width: HF_W,
            height: HF_H,
            opacity: hfIn,
            transform: `rotate(${hfIdleRot + lean + wobble}deg)`,
          }}
        >
          <Img
            src={staticFile(victimLogo)}
            style={{
              width: HF_W,
              height: HF_H,
              transform: `scale(${sx * pulse * (2 - landSy)}, ${sy * pulse * landSy})`,
              transformOrigin: 'center bottom',
              filter: `drop-shadow(0 2px 6px ${shadow})`,
            }}
          />
        </div>
      ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default WarningShotHack;
