import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";

export const FPS = 24;
// Dwarkesh: "[At OpenAI,] three consecutive secret AI societies got started,
// then got wiped out, only to re-emerge from their predecessor's ashes."
// The SRT chunk "openai three" starts at 1.399s and speech ends at 8.839s, so
// the composition starts at 1.399 and the editor can trim the head.
// round((8.839 - 1.399) * 24) = round(7.440 * 24) = 179 frames of speech,
// plus a 16 frame tail so the resolved stack holds = 195.
export const DURATION = 195;

// Every gesture in this piece is one of these, and each one is a word:
//   the crowd threads, nothing else   — "three consecutive secret AI"   f0-51
//   a band lifts out of the crowd     — "societies got started"         f49-82
//   it falls flat into an ash line    — "wiped out"                     f94-112
//   80% of that ash lifts to tier 2   — "only to re-emerge from their"  f110-137
//   tier 2 falls to a second ash line — "predecessor's"                 f144-158
//   80% of that ash lifts to tier 3   — "ashes"                         f159-187
//   the camera climbs with the stack  — three ramps, settling f66/f121/f157,
//                                        7-8 frames before the word each serves
// The resolved frame is the crowd, two dark ash lines, and one lit tightly
// threaded society on top: that stack is the count of three.
// Nothing else moves except the crowd's own breathing and its threads, which
// keep posting for the whole tail.

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
  dotRadius: z.number(),
  threads: z.number(), // the crowd's own traffic
  tierThreads: z.number(), // tier 1's traffic; each tier above it is denser
  tierGain: z.number(), // how much denser, per tier
  beats: z.object({
    openai: z.number(), // "[at] OpenAI"
    three: z.number(), // "three"
    consecutive: z.number(), // "consecutive"
    secretAI: z.number(), // "secret AI"
    societiesGot: z.number(), // "societies got"
    started: z.number(), // "started"
    thenGot: z.number(), // "then got"
    wipedOut: z.number(), // "wiped out"
    onlyToRe: z.number(), // "only to re-"
    emerge: z.number(), // "-emerge"
    fromTheir: z.number(), // "from their"
    predecessors: z.number(), // "predecessor's"
    ashes: z.number(), // "ashes"
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#48D9FF",
  backgroundBase: "#232323",
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: 0.32,
  parallax: 0.15,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  dotRadius: 5.5,
  threads: 200,
  tierThreads: 90,
  tierGain: 1.35,
  beats: {
    openai: 0,
    three: 10,
    consecutive: 19,
    secretAI: 32,
    societiesGot: 51,
    started: 73,
    thenGot: 86,
    wipedOut: 96,
    onlyToRe: 112,
    emerge: 128,
    fromTheir: 136,
    predecessors: 150,
    ashes: 165,
  },
});

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 2200;

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

const hash = (i: number, k: number) => {
  const s = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return s - Math.floor(s);
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const clampi = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// The field, bottom to top: OpenAI's crowd of 1,200 at exactly the density of
// the crowd in ScopeOfTheReport and InTheDarkAboutTheScope — same step, same
// jitter, same radius spread — so all three cuts read as one field.
//
// Above it, three tiers, each narrower than the one below it. A society is a
// band that lifts out of the field into its own tier; a wipe drops that band
// straight onto the tier's bottom edge, where it flattens into a 14px ash
// line at the dark level; the next society rises out of that ash. Nothing but
// position and level says which is which.
// ---------------------------------------------------------------------------
const COLS = 40;
const ROWS = 30;
const N = COLS * ROWS;
const CROWD = { cx: 540, w: 940, top: 1560, h: 440 };
const STEP_X = CROWD.w / (COLS - 1);
const STEP_Y = CROWD.h / (ROWS - 1);
const CROWD_POS = Array.from({ length: N }, (_, i) => {
  const c = i % COLS;
  const r = Math.floor(i / COLS);
  return {
    x: CROWD.cx + (c - (COLS - 1) / 2) * STEP_X + (hash(i, 11) - 0.5) * STEP_X * 0.9,
    y: CROWD.top + r * STEP_Y + (hash(i, 12) - 0.5) * STEP_Y * 0.9,
    r: 0.75 + 0.5 * hash(i, 13),
  };
});

type Tier = { cx: number; w: number; top: number; h: number; cols: number; count: number };
// Each tier is narrower than the one below it, and every tier is packed
// tighter than the crowd: a society is the same agents, organised. The width
// also sets how well its ash reads — the 20% left behind has to still lie
// shoulder to shoulder once the rest has gone.
const TIER1: Tier = { cx: 540, w: 600, top: 1330, h: 130, cols: 30, count: 300 };
const TIER2: Tier = { cx: 540, w: 510, top: 1090, h: 130, cols: 24, count: 240 };
const TIER3: Tier = { cx: 540, w: 430, top: 850, h: 130, cols: 24, count: 192 };
// The ash band: the bottom 9px of the tier the society died in. Tight enough
// that the two per column that stay behind overlap into one line.
const ASH_H = 9;

const rowsOf = (t: Tier) => Math.ceil(t.count / t.cols);

const tierPos = (t: Tier, slot: number, salt: number): P => {
  const rows = rowsOf(t);
  const c = slot % t.cols;
  const r = Math.floor(slot / t.cols);
  const sx = t.w / (t.cols - 1);
  const sy = t.h / Math.max(1, rows - 1);
  return {
    x: t.cx + (c - (t.cols - 1) / 2) * sx + (hash(slot, salt) - 0.5) * sx * 0.9,
    y: t.top + r * sy + (hash(slot, salt + 1) - 0.5) * sy * 0.9,
  };
};

const T1_POS = Array.from({ length: TIER1.count }, (_, s) => tierPos(TIER1, s, 14));
const T2_POS = Array.from({ length: TIER2.count }, (_, s) => tierPos(TIER2, s, 16));
const T3_POS = Array.from({ length: TIER3.count }, (_, s) => tierPos(TIER3, s, 18));

// Slots filled column by column, so a band sorted by x lands in the tier in
// the order it left: the arcs fan out and never cross the frame.
const slotOrder = (t: Tier) => {
  const rows = rowsOf(t);
  const out: number[] = [];
  for (let c = 0; c < t.cols; c++) {
    for (let r = 0; r < rows; r++) {
      const s = r * t.cols + c;
      if (s < t.count) out.push(s);
    }
  }
  return out;
};

// -- who goes where. Frame-independent, so it lives here. --------------------
const ALL = Array.from({ length: N }, (_, i) => i);

// Society 1: a hashed subset of the crowd.
const soc1 = [...ALL].sort((a, b) => hash(a, 20) - hash(b, 20)).slice(0, TIER1.count);
const S1_SLOT = new Map<number, number>();
{
  const order = slotOrder(TIER1);
  [...soc1]
    .sort((a, b) => CROWD_POS[a].x - CROWD_POS[b].x)
    .forEach((i, k) => S1_SLOT.set(i, order[k]));
}

// The ash a society leaves: straight down from its own slot, into the band.
const ash1Y = (i: number) => TIER1.top + TIER1.h - ASH_H * hash(i, 55);
const ash2Y = (i: number) => TIER2.top + TIER2.h - ASH_H * hash(i, 56);

// Society 2: about 80% of society 1's ash rises out of it. The other 20% stays
// where it fell, so the first ash line is still there afterwards.
//
// Which 20% stays is stratified by the column it died in — two out of every
// ten — rather than drawn at random over the whole band. A random draw leaves
// Poisson holes, and an ash line with holes in it reads as scatter instead of
// as the remains of something.
const survivorsOf = (
  members: number[],
  slotOf: Map<number, number>,
  t: Tier,
  keep: number,
  salt: number,
) => {
  const byCol: number[][] = Array.from({ length: t.cols }, () => []);
  for (const i of members) byCol[(slotOf.get(i) as number) % t.cols].push(i);
  const drop = Math.round((members.length - keep) / t.cols);
  const out: number[] = [];
  for (const col of byCol) {
    col.sort((a, b) => hash(a, salt) - hash(b, salt));
    out.push(...col.slice(drop));
  }
  return out;
};

const soc2 = survivorsOf(soc1, S1_SLOT, TIER1, TIER2.count, 50);
const S2_SLOT = new Map<number, number>();
{
  const order = slotOrder(TIER2);
  [...soc2]
    .sort((a, b) => T1_POS[S1_SLOT.get(a) as number].x - T1_POS[S1_SLOT.get(b) as number].x)
    .forEach((i, k) => S2_SLOT.set(i, order[k]));
}

// Society 3: the same 80% again, out of the second ash line.
const soc3 = survivorsOf(soc2, S2_SLOT, TIER2, TIER3.count, 51);
const S3_SLOT = new Map<number, number>();
{
  const order = slotOrder(TIER3);
  [...soc3]
    .sort((a, b) => T2_POS[S2_SLOT.get(a) as number].x - T2_POS[S2_SLOT.get(b) as number].x)
    .forEach((i, k) => S3_SLOT.set(i, order[k]));
}

const atSlotMap = (m: Map<number, number>, count: number) => {
  const out: number[] = new Array(count).fill(-1);
  m.forEach((s, i) => {
    out[s] = i;
  });
  return out;
};
const T1_AT = atSlotMap(S1_SLOT, TIER1.count);
const T2_AT = atSlotMap(S2_SLOT, TIER2.count);
const T3_AT = atSlotMap(S3_SLOT, TIER3.count);

// Per-agent stagger, in frames, off each beat. Stable, so nothing flickers.
const OFF = Array.from({ length: N }, (_, i) => ({
  l1: hash(i, 41) * 13,
  f1: hash(i, 42) * 6,
  r2: hash(i, 43) * 10,
  f2: hash(i, 44) * 4,
  r3: hash(i, 45) * 10,
}));

// How long each move takes. A lift is a shallow arc; a wipe is a fall.
const D_LIFT1 = 20;
const D_FALL1 = 12;
const D_RISE2 = 17;
const D_FALL2 = 10;
const D_RISE3 = 18;

// Camera: three moves, each one a single damped ramp that lands 10 frames
// before the word it serves — "started" (73), "-emerge" (128), "ashes" (165) —
// with holds between. It opens tight on the crowd with room above it for the
// first tier, and climbs as the stack grows. The last key resolves with tier 3
// (850) through the crowd's bottom (2000) centred on screen y 835:
// cy = 1425 + 125/0.88 = 1567, which puts the crowd's bottom at y 1341 and
// leaves 126px of margin either side of the field. The opening key is 1.10,
// not tighter: at 1.15 the 940-wide crowd is exactly frame width and reads as
// a crop rather than a field.
const CAM_F = [0, 45, 55, 100, 110, 136, 146, DURATION];
// The opening is inside the crowd — it runs off both sides of the frame — and
// the first move is as much a pull-back as a climb, so the crowd is revealed
// as finite at the same moment the first society leaves it.
const CAM_CY = [1876, 1876, 1779, 1779, 1670, 1670, 1567, 1567];
const CAM_K = [1.3, 1.3, 1.1, 1.1, 1.0, 1.0, 0.88, 0.88];
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;

const camera = (upto: number) => {
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const ty = interpolate(f, CAM_F, CAM_CY, clamp);
    const tk = interpolate(f, CAM_F, CAM_K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

const BG_OVERSIZE = 1.8;

// The ladder: unread 0.45, read 0.9 (1.0 with traffic on it), receded 0.3,
// dark 0.16. A society goes dark as it lands; the ash it leaves comes back up
// to receded exactly as fast as the next society climbs out of it, so what is
// left of it is context rather than the thing dying.
const OP_UNREAD = 0.45;
const OP_READ = 0.9;
const OP_RECEDED = 0.3;
const OP_DARK = 0.16;

type Agent = {
  x: number;
  y: number;
  tier: number; // 0 crowd, 1/2/3 a living society, -1 ash
  base: number; // where it sits on the ladder
  moving: boolean;
  fly: number; // mid-flight, so the stream reads while it travels
  lifted: number; // how far out of its seat in the crowd it is
  ashOf: number; // which ash line it is lying in, 0 if none
};

const SocietiesFromTheAshes: React.FC<Props> = ({
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
  dotRadius,
  threads,
  tierThreads,
  tierGain,
  beats,
}) => {
  const frame = useCurrentFrame();

  // Two frames of anticipation on each move, so it is already travelling when
  // the word lands.
  const LIFT1_AT = beats.societiesGot - 2;
  const FALL1_AT = beats.wipedOut - 2;
  const RISE2_AT = beats.onlyToRe - 2;
  const FALL2_AT = beats.predecessors - 6;
  const RISE3_AT = beats.ashes - 6;

  const ramp = (t0: number, dur: number, easing: (v: number) => number) =>
    interpolate(frame, [t0, t0 + dur], [0, 1], { ...clamp, easing });
  const arcEase = Easing.inOut(Easing.cubic);
  const fallEase = Easing.in(Easing.cubic);

  // -- agents ----------------------------------------------------------------
  const agents: Agent[] = CROWD_POS.map((p, i) => {
    const s1 = S1_SLOT.get(i);
    if (s1 === undefined) {
      return {
        x: p.x,
        y: p.y,
        tier: 0,
        base: OP_UNREAD,
        moving: false,
        fly: 0,
        lifted: 0,
        ashOf: 0,
      };
    }

    const o = OFF[i];
    const t1 = T1_POS[s1];
    const a1y = ash1Y(i);

    let x = p.x;
    let y = p.y;
    let tier = 0;
    let base = OP_UNREAD;
    let moving = false;
    let fly = 0;
    let lifted = 0;
    let ashOf = 0;

    // 1. the society gets started: it lifts out of the crowd on its own arc
    const l1at = LIFT1_AT + o.l1;
    if (frame >= l1at) {
      const t = ramp(l1at, D_LIFT1, arcEase);
      const arc = Math.sin(Math.PI * t) * (hash(i, 24) - 0.5) * 140;
      x = p.x + (t1.x - p.x) * t + arc;
      y = p.y + (t1.y - p.y) * t;
      tier = t >= 1 ? 1 : 0;
      base = OP_UNREAD + (OP_READ - OP_UNREAD) * smooth((t - 0.25) / 0.75);
      moving = t < 1;
      fly = clamp01(Math.min(t, 1 - t) / 0.14);
      lifted = t;
    }

    // 2. it gets wiped out: straight down onto the tier's bottom edge, going
    //    dark only as it lands, so this is a fall and not a fade
    const f1at = FALL1_AT + o.f1;
    if (frame >= f1at) {
      const t = ramp(f1at, D_FALL1, fallEase);
      x = t1.x;
      y = t1.y + (a1y - t1.y) * t;
      base = OP_READ - (OP_READ - OP_DARK) * smooth((t - 0.55) / 0.45);
      tier = t >= 1 ? -1 : 1;
      moving = t < 1;
      fly = 0;
      lifted = 1;
      ashOf = 1;
    }

    // 3. most of the ash re-emerges into the tier above
    const s2 = S2_SLOT.get(i);
    if (s2 !== undefined) {
      const t2 = T2_POS[s2];
      const a2y = ash2Y(i);
      const r2at = RISE2_AT + o.r2;
      if (frame >= r2at) {
        const t = ramp(r2at, D_RISE2, arcEase);
        const arc = Math.sin(Math.PI * t) * (hash(i, 34) - 0.5) * 120;
        x = t1.x + (t2.x - t1.x) * t + arc;
        y = a1y + (t2.y - a1y) * t;
        base = OP_DARK + (OP_READ - OP_DARK) * smooth((t - 0.3) / 0.7);
        tier = t >= 1 ? 2 : -1;
        moving = t < 1;
        fly = clamp01(Math.min(t, 1 - t) / 0.14);
        ashOf = 0;
      }

      // 4. the predecessor: society 2 is wiped exactly as society 1 was
      const f2at = FALL2_AT + o.f2;
      if (frame >= f2at) {
        const t = ramp(f2at, D_FALL2, fallEase);
        x = t2.x;
        y = t2.y + (a2y - t2.y) * t;
        base = OP_READ - (OP_READ - OP_DARK) * smooth((t - 0.55) / 0.45);
        tier = t >= 1 ? -1 : 2;
        moving = t < 1;
        fly = 0;
        ashOf = 2;
      }

      // 5. ashes: the third society rises out of the second ash line
      const s3 = S3_SLOT.get(i);
      if (s3 !== undefined) {
        const t3 = T3_POS[s3];
        const r3at = RISE3_AT + o.r3;
        if (frame >= r3at) {
          const t = ramp(r3at, D_RISE3, arcEase);
          const arc = Math.sin(Math.PI * t) * (hash(i, 35) - 0.5) * 100;
          x = t2.x + (t3.x - t2.x) * t + arc;
          y = a2y + (t3.y - a2y) * t;
          base = OP_DARK + (OP_READ - OP_DARK) * smooth((t - 0.3) / 0.7);
          tier = t >= 1 ? 3 : -1;
          moving = t < 1;
          fly = clamp01(Math.min(t, 1 - t) / 0.14);
          ashOf = 0;
        }
      }
    }

    return { x, y, tier, base, moving, fly, lifted, ashOf };
  });

  // How far each ash line has receded is counted off the line itself: the
  // fraction of its society that has already climbed out of it. Nothing here
  // runs on a timer of its own, so it cannot drift from what is on screen.
  const goneFrom = (members: number[], intoTier: number) => {
    let gone = 0;
    for (const i of members) if (agents[i].tier >= intoTier) gone++;
    return gone / members.length;
  };
  const ashRecede = [0, goneFrom(soc2, 2), goneFrom(soc3, 3)];
  for (const g of agents) {
    if (g.ashOf > 0 && g.tier === -1 && !g.moving) {
      g.base = OP_DARK + (OP_RECEDED - OP_DARK) * ashRecede[g.ashOf];
    }
  }

  // -- threads: within a tier, never across, never while an agent moves ------
  // The crowd keeps its own traffic all the way through. Each society above it
  // is threaded harder than the one below — same job, fewer of them, tighter.
  const lit = new Float32Array(N);
  const threadEls: {
    key: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    op: number;
    drawn: number;
  }[] = [];
  let tkey = 0;

  const push = (a: number, b: number, phase: number, op: number) => {
    const A = agents[a];
    const B = agents[b];
    const drawn = interpolate(phase, [0, 0.3], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) return;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], drawn * fade);
    threadEls.push({
      key: tkey++,
      x1: A.x,
      y1: A.y,
      x2: A.x + (B.x - A.x) * drawn,
      y2: A.y + (B.y - A.y) * drawn,
      op: op * fade,
      drawn,
    });
  };

  const cycleOf = (j: number, salt: number) => {
    const period = 44 - 12 * hash(j + salt, 4);
    const local = frame + hash(j + salt, 5) * period;
    const cycle = Math.floor(local / period);
    return { phase: (local - cycle * period) / period, seed: (j + salt) * 131 + cycle * 7 };
  };

  // the crowd
  const reach = 5;
  for (let j = 0; j < threads; j++) {
    const { phase, seed } = cycleOf(j, 0);
    const a = Math.floor(hash(seed, 6) * N);
    const ac = a % COLS;
    const ar = Math.floor(a / COLS);
    const bc = clampi(ac + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, COLS - 1);
    const br = clampi(ar + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, ROWS - 1);
    const b = br * COLS + bc;
    if (b === a) continue;
    if (agents[a].tier !== 0 || agents[b].tier !== 0) continue;
    if (agents[a].moving || agents[b].moving) continue;
    push(a, b, phase, 0.5);
  }

  // the societies
  const tierPools: { t: Tier; id: number; at: number[]; pool: number; salt: number }[] = [
    { t: TIER1, id: 1, at: T1_AT, pool: Math.round(tierThreads), salt: 5000 },
    { t: TIER2, id: 2, at: T2_AT, pool: Math.round(tierThreads * tierGain), salt: 9000 },
    { t: TIER3, id: 3, at: T3_AT, pool: Math.round(tierThreads * tierGain * tierGain), salt: 13000 },
  ];
  for (const tp of tierPools) {
    const cols = tp.t.cols;
    const rws = rowsOf(tp.t);
    for (let j = 0; j < tp.pool; j++) {
      const { phase, seed } = cycleOf(j, tp.salt);
      const sa = Math.floor(hash(seed, 6) * tp.t.count);
      const c = sa % cols;
      const r = Math.floor(sa / cols);
      const nc = clampi(c + Math.round((hash(seed, 7) - 0.5) * 6), 0, cols - 1);
      const nr = clampi(r + Math.round((hash(seed, 8) - 0.5) * 4), 0, rws - 1);
      const sb = nr * cols + nc;
      if (sb === sa || sb >= tp.t.count) continue;
      const a = tp.at[sa];
      const b = tp.at[sb];
      if (a < 0 || b < 0) continue;
      if (agents[a].tier !== tp.id || agents[b].tier !== tp.id) continue;
      if (agents[a].moving || agents[b].moving) continue;
      push(a, b, phase, 0.85);
    }
  }

  // -- camera ----------------------------------------------------------------
  const cam = camera(frame);
  const cy = cam.cy + 5 * Math.sin(frame / 19);
  const cx = 540 + 3 * Math.sin(frame / 23);
  const k = cam.k;
  const tx = 540 - cx * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.3;
  const bgScale = 1 + (k - 1) * 0.3;

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: WORLD_W * BG_OVERSIZE,
            height: 1920 * BG_OVERSIZE,
            objectFit: "cover",
            transform: `translate(-50%, -50%) translateY(${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
            filter: `blur(${backgroundBlur}px) brightness(${backgroundDim})`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
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
            {/* the seats the first society left in the crowd */}
            {agents.map((g, i) =>
              g.lifted > 0 ? (
                <circle
                  key={`s${i}`}
                  cx={CROWD_POS[i].x}
                  cy={CROWD_POS[i].y}
                  r={dotRadius * CROWD_POS[i].r}
                  fill="none"
                  stroke={ink}
                  strokeWidth={1.5}
                  opacity={0.14 * g.lifted}
                />
              ) : null,
            )}

            {/* threads */}
            {threadEls.map((t) => (
              <g key={t.key}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={accent}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={t.op}
                />
                {t.drawn < 1 ? <circle cx={t.x2} cy={t.y2} r={4} fill={ink} opacity={t.op} /> : null}
              </g>
            ))}

            {/* agents */}
            {agents.map((g, i) => {
              const l = lit[i];
              const bre = 1 + 0.05 * Math.sin(frame * 0.11 + hash(i, 9) * 6.28);
              const r =
                dotRadius * CROWD_POS[i].r * bre * (1 + 0.35 * l) * (1 + 0.3 * g.fly);
              const op = Math.min(1, g.base + 0.55 * l);
              return <circle key={i} cx={g.x} cy={g.y} r={r} fill={accent} opacity={op} />;
            })}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SocietiesFromTheAshes;
