import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

export const FPS = 30;
// 0:38.359 -> 0:47.740 of the cut: "resulting in the hack of some external
// party that wasn't actually frankly very important for these agents to hack,
// and then like lead to this moment where there's some investigation".
export const DURATION = 281;

// ---------------------------------------------------------------------------
// World. Same cast as the 0:00 scene (WarningShotHackTight): cyan agent,
// dashed goal path, Hugging Face in its own colours. New here: the vertical
// thread the consequence climbs, and the ink magnifier waiting at the top.
// ---------------------------------------------------------------------------
const WORLD_W = 1080;
const WORLD_H = 3400;

const AGENT = {x: 245, y: 1860};
const TARGET = {x: 470, y: 1645, r: 40};
const HF = {x: 540, y: 2680};
const HF_W = 330;
const HF_H = HF_W * (512 / 551);
const HF_R = 158;
// The supplied icon is 512px with the lens circle centred at ~(207, 207) and
// an outer lens radius of ~207px. Scaled so the lens radius lands at MAG.r,
// which keeps the thread's end (MAG.y + MAG.r) exactly on the rim.
const MAG = {x: 540, y: 500, r: 200};
const MAG_SIZE = 512 * (MAG.r / 207);
const MAG_LENS_FRAC = 207 / 512;

// The assigned task: a short, direct hop. Its brevity is the argument —
// the detour below is both longer and slower.
const TASK = {
  p0: {x: 315, y: 1790},
  c: {x: 355, y: 1690},
  p1: {x: 435, y: 1665},
};
const DASHES = 7;
const DASH_LEN = 0.07;
const FLOW = 0.0008;

// The pointless detour: sweeps far right, then hooks down into the face.
const TRAIL = [
  {p0: [300, 1935], c1: [560, 2065], c2: [800, 2130], p3: [845, 2330]},
  {p0: [845, 2330], c1: [880, 2500], c2: [770, 2620], p3: [610, 2630]},
] as const;

// The thread the pulse climbs: from behind the face up to the lens rim.
const THREAD = [{p0: [540, 2545], c1: [570, 2100], c2: [510, 1350], p3: [540, 700]}] as const;

// Equally unimportant bystanders — the point of "wasn't very important" is
// that HF sits among them, not on the path.
const BYSTANDERS = [
  {x: 150, y: 2330, r: 24},
  {x: 865, y: 2430, r: 20},
  {x: 790, y: 2150, r: 18},
  {x: 850, y: 2920, r: 26},
  {x: 205, y: 2940, r: 22},
];

const quadAt = (t: number) => {
  const u = 1 - t;
  return {
    x: u * u * TASK.p0.x + 2 * u * t * TASK.c.x + t * t * TASK.p1.x,
    y: u * u * TASK.p0.y + 2 * u * t * TASK.c.y + t * t * TASK.p1.y,
  };
};

type Seg = {p0: readonly number[]; c1: readonly number[]; c2: readonly number[]; p3: readonly number[]};

const cubicAt = (b: Seg, t: number): [number, number] => {
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

// Dense polyline + cumulative arc length, so drawn length, comet heads and
// travelling pulses all come from the same samples and cannot drift apart.
const samplePolyline = (segs: readonly Seg[]) => {
  const pts: Array<[number, number]> = [];
  for (const seg of segs) {
    for (let i = 0; i <= 60; i++) {
      const p = cubicAt(seg, i / 60);
      const prev = pts[pts.length - 1];
      if (!prev || prev[0] !== p[0] || prev[1] !== p[1]) pts.push(p);
    }
  }
  const len: number[] = [0];
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    len.push(len[i - 1] + Math.hypot(bx - ax, by - ay));
  }
  return {pts, len, total: len[len.length - 1]};
};

type Line = ReturnType<typeof samplePolyline>;

const pointAtLen = (line: Line, l0: number): [number, number] => {
  const l = Math.min(Math.max(l0, 0), line.total);
  for (let i = 1; i < line.pts.length; i++) {
    if (line.len[i] >= l) {
      const k = (l - line.len[i - 1]) / (line.len[i] - line.len[i - 1]);
      const [ax, ay] = line.pts[i - 1];
      const [bx, by] = line.pts[i];
      return [ax + (bx - ax) * k, ay + (by - ay) * k];
    }
  }
  return line.pts[line.pts.length - 1];
};

const sliceBetween = (line: Line, a: number, b: number) => {
  const lo = Math.max(a, 0);
  const hi = Math.min(b, line.total);
  if (hi - lo < 1) return null;
  const pts: Array<[number, number]> = [pointAtLen(line, lo)];
  for (let i = 1; i < line.pts.length; i++) {
    if (line.len[i] > lo && line.len[i] < hi) pts.push(line.pts[i]);
  }
  pts.push(pointAtLen(line, hi));
  return pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
};

const TRAIL_LINE = samplePolyline(TRAIL);
const THREAD_LINE = samplePolyline(THREAD);

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
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  agentLogo: z.string(),
  agentSize: z.number().min(80).max(400),
  victimLogo: z.string(),
  // Beat frames from the SRT at 30fps, relative to 00:38.359:
  //   0 "resulting" · 8 "in the hack of" · 37 "some external" · 60 "party
  //   that" · 80 "wasn't actually" · 116 "frankly very" · 137 "important" ·
  //   149 "for these" · 162 "agents to hack" · 187 "and then" · 208 "like
  //   lead" · 225 "to this moment" · 242 "where there's" · 254 "some" ·
  //   258 "investigation" · 281 end.
  beats: z.object({
    diveStart: z.number().int(),
    impact: z.number().int(),
    pullOut: z.number().int(),
    franklyVery: z.number().int(),
    important: z.number().int(),
    forThese: z.number().int(),
    agentsToHack: z.number().int(),
    andThen: z.number().int(),
    likeLead: z.number().int(),
    toThisMoment: z.number().int(),
    whereTheres: z.number().int(),
    investigation: z.number().int(),
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  backgroundBase: '#232323',
  backgroundSrc: 'grid-background.jpg',
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  agentLogo: 'openai-chatgpt-logo.png',
  agentSize: 190,
  victimLogo: 'hugging-face.webp',
  beats: {
    diveStart: 8,
    impact: 52,
    pullOut: 80,
    franklyVery: 116,
    important: 137,
    forThese: 149,
    agentsToHack: 162,
    andThen: 187,
    likeLead: 208,
    toThisMoment: 225,
    whereTheres: 242,
    investigation: 258,
  },
});

// ---------------------------------------------------------------------------
// Camera. Authored as its own coarse key track — it never chases the pulse.
// Tight on the strike, a wide reveal for "wasn't very important", a hold while
// the detour re-marches, a climb alongside the thread, a hold for the arrival,
// then it stays with the glass: no pull-back, just a slow push-in through the
// arrival so the hold never goes static.
// ---------------------------------------------------------------------------
const CAM_F = [0, 40, 52, 80, 137, 190, 210, 230, 248, 258, DURATION];
const CAM_CY = [2330, 2400, 2430, 2430, 2245, 2245, 1800, 1150, 640, 600, 545];
const CAM_K = [1.28, 1.3, 1.32, 1.32, 0.8, 0.8, 0.84, 0.9, 0.95, 0.98, 1.06];

const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468; // zeta ~0.78

const camera = (upto: number) => {
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vcy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const tcy = interpolate(f, CAM_F, CAM_CY, {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const tk = interpolate(f, CAM_F, CAM_K, {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    vcy += (tcy - cy) * CAM_STIFF - vcy * CAM_DAMP;
    cy += vcy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return {cy, k};
};

const BG_OVERSIZE = 1.8;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

const WarningShotInvestigation: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  agentLogo,
  agentSize,
  victimLogo,
  beats,
}) => {
  const frame = useCurrentFrame();
  const [tr, tg, tb] = rgbOf(accent);

  // The scene is a continuation, not an entrance — it settles in fast and is
  // never blank on the cut frame.
  const enterFade = interpolate(frame, [0, 6], [0.35, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ---- Continuous layers: something is alive on every frame. ----

  const spinBoost = interpolate(
    frame,
    [beats.diveStart, beats.impact, beats.impact + 30],
    [0, 52, 58],
    {easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const agentRot = frame * 0.34 + spinBoost;
  const agentBob = 4 * Math.sin((frame / 70) * Math.PI * 2);

  // Idle queue on the abandoned task path — barely creeping, going nowhere.
  const phase = FLOW * frame;
  const targetBreathR = 2.5 * Math.sin((frame / 80) * Math.PI * 2);
  const targetBreathOp = 0.06 * Math.sin((frame / 80) * Math.PI * 2 + 1);

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

  // ---- The dive, resuming mid-flight, landing on "external party". ----

  const trailFrac = interpolate(
    frame,
    [0, beats.diveStart, 37, beats.impact],
    [0.12, 0.18, 0.82, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const drawnLen = TRAIL_LINE.total * trailFrac;
  const trailD = sliceBetween(TRAIL_LINE, 0, drawnLen);
  const tip = pointAtLen(TRAIL_LINE, drawnLen);
  const tipOut = interpolate(frame, [beats.impact, beats.impact + 8], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const wake = [
    {back: 26, r: 10, op: 0.5},
    {back: 52, r: 7, op: 0.3},
    {back: 82, r: 5, op: 0.15},
  ];

  // "for these agents to hack": the solid detour recedes and re-draws as a
  // marching dash-flow — the same pointless route, still being worked.
  const marchIn = interpolate(frame, [beats.forThese, beats.agentsToHack], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const marchCalm = interpolate(frame, [beats.andThen, beats.andThen + 18], [1, 0.45], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const trailSolidOp = 0.85 - 0.5 * marchIn;

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
    ring(beats.impact, 15, 290, 0.7, 7),
    ring(beats.impact + 4, 45, 430, 0.5, 6),
    ring(beats.impact + 10, 55, 540, 0.35, 4),
    // The noise does not stop — it keeps ringing until someone looks.
    ring(beats.franklyVery, 40, 340, 0.35, 5),
    ring(beats.agentsToHack, 40, 310, 0.3, 4),
    ring(beats.andThen, 34, 300, 0.35, 5),
  ].filter((r): r is NonNullable<typeof r> => r !== null);

  // A departure bump as the pulse leaves.
  const bump =
    0.04 *
    interpolate(frame, [beats.andThen + 3, beats.andThen + 7, beats.andThen + 16], [0, 1, 0], {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  // ---- "wasn't very important": the wide reveal. ----

  const bystanderIn = (i: number) =>
    interpolate(frame, [beats.pullOut + 4 + i * 9, beats.pullOut + 16 + i * 9], [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  // "important": the path that mattered flashes once, bright and short.
  const flashT = interpolate(frame, [beats.important, beats.important + 14], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flashOn = frame >= beats.important && frame <= beats.important + 16;
  const taskGlowUp = interpolate(
    frame,
    [beats.important - 4, beats.important + 4, beats.important + 26],
    [0, 1, 0.35],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const targetPop = interpolate(
    frame,
    [beats.important, beats.important + 5, beats.important + 14],
    [1, 1.16, 1],
    {easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // ---- The climb: thread grows, the consequence travels it. ----

  const threadFrac = interpolate(frame, [beats.andThen, beats.andThen + 45], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const threadD = sliceBetween(THREAD_LINE, 0, THREAD_LINE.total * threadFrac);

  const pulseT = interpolate(frame, [beats.andThen + 3, beats.investigation - 2], [0, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pulseLen = THREAD_LINE.total * pulseT;
  const pulseOn = frame > beats.andThen + 3 && frame < beats.investigation + 2;
  const pulseP = pointAtLen(THREAD_LINE, pulseLen);
  const pulseTailD = pulseOn ? sliceBetween(THREAD_LINE, pulseLen - 110, pulseLen) : null;

  // ---- The investigation. ----

  // Faint anticipation on "where there's"; the icon snaps to full presence
  // with a small pop when the pulse arrives.
  const magOp = interpolate(
    frame,
    [
      beats.whereTheres,
      beats.whereTheres + 10,
      beats.investigation - 2,
      beats.investigation + 8,
    ],
    [0, 0.22, 0.22, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const magScale = interpolate(
    frame,
    [beats.investigation - 2, beats.investigation + 6, beats.investigation + 14],
    [0.94, 1.045, 1],
    {easing: Easing.inOut(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const swayAmp = clamp01((frame - (beats.investigation + 10)) / 20);
  const magSway = swayAmp * 1.0 * Math.sin((frame - beats.investigation) / 25);

  // Arrival: the dot slides from the rim to the lens centre and stays —
  // the evidence, finally under the glass.
  const seenT = interpolate(frame, [beats.investigation - 2, beats.investigation + 8], [0, 1], {
    easing: Easing.out(Easing.quad),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const seenY = interpolate(seenT, [0, 1], [MAG.y + MAG.r, MAG.y]);
  const seenBreath = 1 + 0.06 * Math.sin((frame - beats.investigation) / 11);
  const arrivalRing = (() => {
    const t = (frame - beats.investigation) / 20;
    if (t <= 0 || t >= 1) return null;
    return {r: 14 + 150 * (1 - (1 - t) ** 3), op: 0.6 * (1 - t) ** 1.3};
  })();

  // ---- Camera. ----

  const {cy, k} = camera(frame);
  const shakeEnv = frame > beats.impact ? Math.exp(-(frame - beats.impact) / 8) : 0;
  const shakeY = shakeEnv * 6 * Math.sin((frame - beats.impact) * 2.1);
  const tx = 540 - 540 * k;
  const ty = 960 - (cy + shakeY) * k;

  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.3;
  const bgScale = 1 + (k - 1) * 0.3;

  // ---- Task-path dashes. ----

  const dashes = Array.from({length: DASHES}, (_, i) => {
    const t0 = (i / DASHES + phase) % 1;
    const t1 = t0 + DASH_LEN;
    const a = quadAt(t0);
    const b = quadAt(Math.min(t1, 1));
    const ends = clamp01(t0 / 0.06) * clamp01((1 - t1) / 0.08 + 0.2);
    return {x1: a.x, y1: a.y, x2: b.x, y2: b.y, op: (0.4 + 0.55 * taskGlowUp) * ends};
  });

  const flashLen = 0.16;
  const flashA = quadAt(Math.max(0, flashT - flashLen));
  const flashB = quadAt(flashT);

  return (
    <AbsoluteFill style={{backgroundColor: backgroundBase}}>
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img
          src={staticFile(backgroundSrc)}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: WORLD_W * BG_OVERSIZE,
            height: 1920 * BG_OVERSIZE,
            objectFit: 'cover',
            transform: `translate(-50%, -50%) translateY(${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
            filter: `blur(${backgroundBlur}px) brightness(${backgroundDim})`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: '0 0',
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
            opacity: enterFade,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}
          >
            <defs>
              <filter id="wsi-agent-tint">
                <feColorMatrix
                  type="matrix"
                  values={`0 0 0 0 ${tr} 0 0 0 0 ${tg} 0 0 0 0 ${tb} 0 0 0 1 0`}
                />
              </filter>
            </defs>

            {/* The thread up to the investigation, under everything else. */}
            {threadD ? (
              <path
                d={threadD}
                fill="none"
                stroke={ink}
                strokeWidth={7}
                strokeLinecap="round"
                opacity={0.7}
              />
            ) : null}

            {/* Bystanders: dim, equal, unimportant. */}
            {BYSTANDERS.map((b, i) => {
              const inn = bystanderIn(i);
              return (
                <circle
                  key={`b${i}`}
                  cx={b.x}
                  cy={b.y}
                  r={b.r * (0.9 + 0.1 * inn)}
                  fill="none"
                  stroke={ink}
                  strokeWidth={5}
                  opacity={0.18 * inn}
                />
              );
            })}

            {/* Assigned task: short dashed hop to a waiting objective. */}
            {dashes.map((d, i) => (
              <line
                key={`d${i}`}
                x1={d.x1}
                y1={d.y1}
                x2={d.x2}
                y2={d.y2}
                stroke={ink}
                strokeWidth={9}
                strokeLinecap="round"
                opacity={d.op}
              />
            ))}
            {flashOn ? (
              <line
                x1={flashA.x}
                y1={flashA.y}
                x2={flashB.x}
                y2={flashB.y}
                stroke={ink}
                strokeWidth={13}
                strokeLinecap="round"
                opacity={0.95}
              />
            ) : null}
            <circle
              cx={TARGET.x}
              cy={TARGET.y}
              r={(TARGET.r + targetBreathR) * targetPop}
              fill="none"
              stroke={ink}
              strokeWidth={8}
              opacity={0.55 + 0.4 * taskGlowUp + targetBreathOp}
            />

            {/* The detour: solid while it happens, a marching flow after. */}
            {trailD ? (
              <path
                d={trailD}
                fill="none"
                stroke={accent}
                strokeWidth={11}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={trailSolidOp}
              />
            ) : null}
            {marchIn > 0 && trailD ? (
              <path
                d={trailD}
                fill="none"
                stroke={accent}
                strokeWidth={11}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="30 42"
                strokeDashoffset={-(frame * 2.4)}
                opacity={marchIn * marchCalm}
              />
            ) : null}

            {/* Comet head + wake while the dive draws. */}
            {tipOut > 0 && trailFrac > 0.13 ? (
              <>
                {wake.map((w, i) => {
                  const p = pointAtLen(TRAIL_LINE, drawnLen - w.back);
                  return (
                    <circle
                      key={`w${i}`}
                      cx={p[0]}
                      cy={p[1]}
                      r={w.r}
                      fill={accent}
                      opacity={w.op * tipOut}
                    />
                  );
                })}
                <circle cx={tip[0]} cy={tip[1]} r={16} fill={accent} opacity={tipOut} />
              </>
            ) : null}

            {/* Impact rings and the later echoes. */}
            {rings.map((r, i) => (
              <circle
                key={`r${i}`}
                cx={HF.x}
                cy={HF.y + hfBob}
                r={r.r}
                fill="none"
                stroke={ink}
                strokeWidth={r.sw}
                opacity={r.op}
              />
            ))}

            {/* The consequence climbing the thread. */}
            {pulseTailD ? (
              <path
                d={pulseTailD}
                fill="none"
                stroke={accent}
                strokeWidth={10}
                strokeLinecap="round"
                opacity={0.55}
              />
            ) : null}
            {pulseOn ? <circle cx={pulseP[0]} cy={pulseP[1]} r={15} fill={accent} /> : null}

            {/* The investigation's arrival, under the icon: the evidence
                slides from the rim to the lens centre and stays. */}
            {arrivalRing ? (
              <circle
                cx={MAG.x}
                cy={MAG.y}
                r={arrivalRing.r}
                fill="none"
                stroke={accent}
                strokeWidth={6}
                opacity={arrivalRing.op}
              />
            ) : null}
            {seenT > 0 ? (
              <circle cx={MAG.x} cy={seenY} r={13 * seenBreath} fill={accent} opacity={0.95} />
            ) : null}
          </svg>

          <Img
            src={staticFile(victimLogo)}
            style={{
              position: 'absolute',
              left: HF.x - HF_W / 2,
              top: HF.y - HF_H / 2 + hfBob,
              width: HF_W,
              height: HF_H,
              transform: `rotate(${(hfIdleRot + lean + wobble).toFixed(2)}deg) scale(${(
                sx *
                (1 + bump)
              ).toFixed(3)}, ${(sy * (1 + bump)).toFixed(3)})`,
              transformOrigin: 'center center',
            }}
          />

          {magOp > 0 ? (
            <Img
              src={staticFile('magnifying-glass.png')}
              style={{
                position: 'absolute',
                left: MAG.x - MAG_SIZE * MAG_LENS_FRAC,
                top: MAG.y - MAG_SIZE * MAG_LENS_FRAC,
                width: MAG_SIZE,
                height: MAG_SIZE,
                // Black-on-alpha icon forced to ink: the investigation is
                // the humans'.
                filter: 'brightness(0) invert(1)',
                opacity: magOp,
                transform: `rotate(${magSway.toFixed(2)}deg) scale(${magScale.toFixed(3)})`,
                transformOrigin: `${MAG_LENS_FRAC * 100}% ${MAG_LENS_FRAC * 100}%`,
              }}
            />
          ) : null}

          <Img
            src={staticFile(agentLogo)}
            style={{
              position: 'absolute',
              left: AGENT.x - agentSize / 2,
              top: AGENT.y - agentSize / 2 + agentBob,
              width: agentSize,
              height: agentSize,
              filter: 'url(#wsi-agent-tint)',
              transform: `rotate(${agentRot.toFixed(1)}deg)`,
              transformOrigin: 'center center',
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default WarningShotInvestigation;
