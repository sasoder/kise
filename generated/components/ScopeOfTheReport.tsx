import { loadFont } from "@remotion/fonts";
import {
  AbsoluteFill,
  cancelRender,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

export const FPS = 24;
// Dwarkesh: "The investigation from METR and Redwood was limited in scope to
// how the second civilization of AIs breached Hugging Face, but its scope did
// not extend to this third civilization of AIs, which breached OpenAI itself,
// and this seems to me like the more concerning incident."
// SRT 23.339s -> 37.100s. round((37.100 - 23.339) * 24) = 330 frames of speech,
// plus a 16 frame tail so the resolved state holds = 346.
export const DURATION = 346;

const FONT = "Sohne";
const fontHandle = delayRender("Loading Sohne Kraftig");
loadFont({ family: FONT, url: staticFile("Sohne-Kraftig.otf"), weight: "600" })
  .then(() => continueRender(fontHandle))
  .catch((err) => cancelRender(err));

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
  threads: z.number(),
  investigatorLabel: z.string(),
  beats: z.object({
    investigation: z.number(), // "the investigation from METR and Redwood"
    limitedInScope: z.number(), // "was limited in scope to"
    secondCiv: z.number(), // "how the second civilization of AIs"
    breached: z.number(), // "breached"
    huggingFace: z.number(), // "Hugging Face"
    didNotExtend: z.number(), // "but its scope did not extend"
    thirdCiv: z.number(), // "to this third civilization of AIs"
    whichBreached: z.number(), // "which breached"
    openai: z.number(), // "OpenAI itself"
    moreConcerning: z.number(), // "and this seems to me like the more concerning incident"
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
  threads: 150,
  investigatorLabel: "METR · Redwood",
  beats: {
    investigation: 0,
    limitedInScope: 55,
    secondCiv: 84,
    breached: 133,
    huggingFace: 144,
    didNotExtend: 162,
    thirdCiv: 197,
    whichBreached: 243,
    openai: 255,
    moreConcerning: 276,
  },
});

type P = { x: number; y: number };

const WORLD_W = 1080;
const WORLD_H = 2600;

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

// ---------------------------------------------------------------------------
// The funnel, bottom to top: the crowd of 1,200; the band of the second
// civilization, which sits inside the box the report drew around its own
// scope; the third civilization above the box, outside it; the two
// investigators at the top. Nothing but position says who was looked at.
//
// The stack is packed tight — label to box top 48, box bottom to crowd 66 —
// so the opening frames investigators + box + crowd with nothing dead between
// them. The box is exactly the band plus the lane the breach flies through.
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

const BAND = { cx: 480, w: 660, top: 1330, h: 130, cols: 30, count: 300 };
// The box holds the band (1324-1467) and, above it, the lane the breach arcs
// climb through. Nothing else: no dead strip at either end.
const BOX = { x0: 90, x1: 990, y0: BAND.top - 162, y1: 1494 };
const TIER2 = { cx: 480, w: 660, top: 952, h: 128, cols: 26, count: 220 };
const HF = { x: 895, y: 1395, size: 108 };
const OAI = { x: 895, y: 1016, size: 108 };

// How much of each tier goes over the wall.
const POUR_A = 120;
const POUR_B = 95;
const POUR_A_AT = 135;
const POUR_B_AT = 242;
// The pour leaves in bursts rather than as an even stream, so the mark has
// something to swell against.
const BURSTS = 5;
const pourPlan = (i: number, salt: number, start: number) => {
  const g = Math.min(BURSTS - 1, Math.floor(hash(i, salt) * BURSTS));
  const launch = start + g * 6.5 + hash(i, salt + 1) * 3.6;
  const flight = 26 + g * 0.6 + hash(i, salt + 2) * 2.4;
  return { launch, arrive: launch + flight };
};

// The investigators start pressed against the top of the box and are pushed up
// by the third civilization arriving underneath them.
const INVEST = { size: 132, dx: 92 };
const INVEST_Y0 = BOX.y0 - 170;
const INVEST_Y1 = 680;

const bandRows = Math.ceil(BAND.count / BAND.cols);
const tier2Rows = Math.ceil(TIER2.count / TIER2.cols);

const tierPos = (
  t: { cx: number; w: number; top: number; h: number; cols: number },
  rows: number,
  slot: number,
  salt: number,
): P => {
  const c = slot % t.cols;
  const r = Math.floor(slot / t.cols);
  const sx = t.w / (t.cols - 1);
  const sy = t.h / Math.max(1, rows - 1);
  return {
    x: t.cx + (c - (t.cols - 1) / 2) * sx + (hash(slot, salt) - 0.5) * sx * 0.9,
    y: t.top + r * sy + (hash(slot, salt + 1) - 0.5) * sy * 0.9,
  };
};

const BAND_POS = Array.from({ length: BAND.count }, (_, s) => tierPos(BAND, bandRows, s, 14));
const TIER2_POS = Array.from({ length: TIER2.count }, (_, s) => tierPos(TIER2, tier2Rows, s, 16));

// -- who goes where. All of this is frame-independent, so it lives here. -----
const ALL = Array.from({ length: N }, (_, i) => i);

// The second civilization: a hashed subset of the crowd, its order also giving
// each agent its slot in the band.
const orderA = [...ALL].sort((a, b) => hash(a, 20) - hash(b, 20));
const A_SLOT = new Map<number, number>();
for (let k = 0; k < BAND.count; k++) A_SLOT.set(orderA[k], k);
const A_AT_SLOT: number[] = [];
A_SLOT.forEach((s, i) => {
  A_AT_SLOT[s] = i;
});

// The third civilization lifts out of the crowd's outer columns, so its arcs
// have somewhere to go that is not through the box.
const outer = ALL.filter((i) => {
  const c = i % COLS;
  return (c < 9 || c > 30) && !A_SLOT.has(i);
}).sort((a, b) => hash(a, 30) - hash(b, 30));
const bPicked = outer.slice(0, TIER2.count).sort((a, b) => CROWD_POS[a].x - CROWD_POS[b].x);
// Slots filled column by column so the left of the crowd lands on the left of
// the tier and the arcs never cross the frame.
const slotByColumn: number[] = [];
for (let c = 0; c < TIER2.cols; c++) {
  for (let r = 0; r < tier2Rows; r++) {
    const s = r * TIER2.cols + c;
    if (s < TIER2.count) slotByColumn.push(s);
  }
}
const B_SLOT = new Map<number, number>();
bPicked.forEach((i, k) => B_SLOT.set(i, slotByColumn[k]));
const B_AT_SLOT: number[] = [];
B_SLOT.forEach((s, i) => {
  B_AT_SLOT[s] = i;
});

// The breaches. Weighted toward the slots nearest the mark, so the tier is
// visibly thinned on that side once the pour is over.
const pourSet = (
  count: number,
  cols: number,
  take: number,
  atSlot: number[],
  salt: number,
) => {
  const slots = Array.from({ length: count }, (_, s) => s).sort(
    (a, b) =>
      ((b % cols) / (cols - 1)) * 0.55 +
      hash(b, salt) -
      (((a % cols) / (cols - 1)) * 0.55 + hash(a, salt)),
  );
  return new Set(slots.slice(0, take).map((s) => atSlot[s]));
};
const A_POUR = pourSet(BAND.count, BAND.cols, POUR_A, A_AT_SLOT, 21);
const B_POUR = pourSet(TIER2.count, TIER2.cols, POUR_B, B_AT_SLOT, 31);

// Camera: authored keys, damped. Every move is a short ramp that lands well
// before the word it serves, and holds in between. The opening key holds the
// whole stack — investigators, the space the box will claim, the crowd — and
// the long pull-back at 156-186 opens the room the third civilization arrives
// into, landing eleven frames before it lifts.
const CAM_F = [0, 26, 40, 58, 118, 138, 156, 186, DURATION];
const CAM_CY = [1588, 1588, 1568, 1568, 1568, 1512, 1512, 1449, 1449];
const CAM_K = [1.04, 1.04, 1.06, 1.06, 1.06, 1.09, 1.09, 0.88, 0.88];
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

// The perimeter of the scope box, so the drawing line can carry a white head.
const rectPt = (t: number): P => {
  const w = BOX.x1 - BOX.x0;
  const h = BOX.y1 - BOX.y0;
  let d = clamp01(t) * 2 * (w + h);
  if (d <= w) return { x: BOX.x0 + d, y: BOX.y0 };
  d -= w;
  if (d <= h) return { x: BOX.x1, y: BOX.y0 + d };
  d -= h;
  if (d <= w) return { x: BOX.x1 - d, y: BOX.y1 };
  d -= w;
  return { x: BOX.x0, y: BOX.y1 - d };
};

// A point travelling past the box gets pushed clear of it, so the third
// civilization's arcs go around the report's scope rather than through it.
const avoidBox = (x: number, y: number, side: number) => {
  const m = smooth(Math.min((BOX.y1 + 110 - y) / 110, (y - (BOX.y0 - 110)) / 110));
  if (m <= 0) return x;
  const target = side < 0 ? BOX.x0 - 36 : BOX.x1 + 36;
  return side < 0 ? x + m * Math.min(0, target - x) : x + m * Math.max(0, target - x);
};

type Agent = {
  x: number;
  y: number;
  tier: number;
  lift: number;
  moving: boolean;
  slot: number;
  pour: number;
};

const ScopeOfTheReport: React.FC<Props> = ({
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
  investigatorLabel,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // -- the box ---------------------------------------------------------------
  // Seven frames of anticipation so the head is already travelling when the
  // word lands, and the space between the investigators and the crowd is the
  // report's scope from as early as it can be.
  const boxDraw = interpolate(frame, [beats.limitedInScope - 7, beats.secondCiv - 4], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const boxClick = interpolate(
    frame,
    [beats.secondCiv - 4, beats.secondCiv - 2, beats.secondCiv + 4],
    [0, 1, 0],
    { ...clamp, easing: Easing.inOut(Easing.quad) },
  );
  // "did not extend": the sides reach up toward the investigators, the top
  // follows, and it all falls back to where it was.
  // The sides reach first and let go last, so they are always the ones out in
  // front and the top edge is never left stranded above them.
  const sideExt =
    interpolate(frame, [166, 181], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) -
    interpolate(frame, [196, 210], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const topExt =
    interpolate(frame, [176, 192], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) }) -
    interpolate(frame, [192, 206], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const settle = frame > 210 ? Math.sin((frame - 210) * 0.5) * Math.exp(-(frame - 210) / 9) * 8 : 0;
  const sideTop = BOX.y0 - 104 * sideExt + settle;
  const topY = BOX.y0 - 104 * topExt + settle;
  const straining = sideExt - topExt > 0.03;

  // -- the check sweep, which never leaves the box ---------------------------
  const sweepT = interpolate(frame, [150, 188], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const sweepX = BOX.x0 + 12 + (BOX.x1 - BOX.x0 - 24) * sweepT;
  const sweepOn = frame >= 150 && frame <= 190;

  // -- the last beat ---------------------------------------------------------
  const recede = interpolate(frame, [beats.moreConcerning, beats.moreConcerning + 22], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const dim1 = 1 - 0.7 * recede;
  const rise2 = interpolate(frame, [beats.moreConcerning + 2, beats.moreConcerning + 22], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });
  const flash2 = interpolate(frame, [284, 287, 300], [0, 0.85, 0], {
    ...clamp,
    easing: Easing.inOut(Easing.quad),
  });
  const ringDraw = interpolate(frame, [292, 314], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  // Fixed radius: a ring that grew while it drew read as off-centre.
  const ringR = 86;
  const ringLand = interpolate(frame, [312, 330], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.6)),
  });
  const ringClick = interpolate(frame, [312, 315, 322], [0, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const ripple = interpolate(frame, [318, 344], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });

  // -- agents ----------------------------------------------------------------
  let hfPulse = 0;
  let oaiPulse = 0;
  const bandSeats: { key: string; x: number; y: number; op: number }[] = [];

  const agents: Agent[] = CROWD_POS.map((p, i) => {
    const aSlot = A_SLOT.get(i);
    const bSlot = B_SLOT.get(i);

    if (aSlot !== undefined) {
      const liftAt = beats.secondCiv - 2 + hash(i, 21) * 30;
      const lift = interpolate(frame, [liftAt, liftAt + 22], [0, 1], {
        ...clamp,
        easing: Easing.inOut(Easing.cubic),
      });
      const b = BAND_POS[aSlot];
      const arc = Math.sin(Math.PI * lift) * (hash(i, 24) - 0.5) * 150;
      let x = p.x + (b.x - p.x) * lift + arc;
      let y = p.y + (b.y - p.y) * lift;
      let pour = 0;
      if (A_POUR.has(i)) {
        const pp = pourPlan(i, 60, POUR_A_AT);
        pour = interpolate(frame, [pp.launch, pp.arrive], [0, 1], {
          ...clamp,
          easing: Easing.inOut(Easing.quad),
        });
        if (pour > 0) {
          const ang = hash(i, 64) * Math.PI * 2;
          const rad = 8 + 20 * hash(i, 65);
          const ex = HF.x + Math.cos(ang) * rad;
          const ey = HF.y + Math.sin(ang) * rad;
          // High individual arcs, climbing well clear of the band into the
          // lane at the top of the box before dropping into the mark.
          const lane = BAND.top - (118 + 40 * hash(i, 66));
          const jx = (hash(i, 67) - 0.5) * 90;
          const c1x = x + (ex - x) * 0.25 + jx;
          const c2x = x + (ex - x) * 0.72 + jx * 0.5;
          const t = pour;
          const u = 1 - t;
          x = u * u * u * x + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * ex;
          y = u * u * u * y + 3 * u * u * t * lane + 3 * u * t * t * lane + t * t * t * ey;
          hfPulse += Math.max(0, 1 - Math.abs(frame - pp.arrive) / 6);
          bandSeats.push({
            key: `a${i}`,
            x: b.x,
            y: b.y,
            op: 0.16 * Math.min(1, pour * 4),
          });
        }
      }
      return { x, y, tier: lift > 0.5 ? 1 : 0, lift, moving: (lift > 0 && lift < 1) || pour > 0, slot: aSlot, pour };
    }

    if (bSlot !== undefined) {
      const liftAt = beats.thirdCiv - 4 + hash(i, 31) * 24;
      const lift = interpolate(frame, [liftAt, liftAt + 24], [0, 1], {
        ...clamp,
        easing: Easing.inOut(Easing.cubic),
      });
      const b = TIER2_POS[bSlot];
      const side = p.x < 540 ? -1 : 1;
      // Out past the box, up the outside of it, then in to the tier.
      const c1 = { x: side < 0 ? 20 : 1060, y: BOX.y1 + 60 };
      const c2 = { x: side < 0 ? 20 : 1060, y: BOX.y0 - 60 };
      const t = lift;
      const u = 1 - t;
      let x =
        u * u * u * p.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x;
      const y = u * u * u * p.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y;
      if (lift > 0 && lift < 1) x = avoidBox(x, y, side);
      let px = x;
      let py = y;
      let pour = 0;
      if (B_POUR.has(i)) {
        const pp = pourPlan(i, 70, POUR_B_AT);
        pour = interpolate(frame, [pp.launch, pp.arrive], [0, 1], {
          ...clamp,
          easing: Easing.inOut(Easing.quad),
        });
        if (pour > 0) {
          const ang = hash(i, 74) * Math.PI * 2;
          const rad = 8 + 20 * hash(i, 75);
          const ex = OAI.x + Math.cos(ang) * rad;
          const ey = OAI.y + Math.sin(ang) * rad;
          const lane = TIER2.top - (118 + 40 * hash(i, 76));
          const jx = (hash(i, 77) - 0.5) * 90;
          const c1x = px + (ex - px) * 0.25 + jx;
          const c2x = px + (ex - px) * 0.72 + jx * 0.5;
          const q = pour;
          const v = 1 - q;
          px = v * v * v * px + 3 * v * v * q * c1x + 3 * v * q * q * c2x + q * q * q * ex;
          py = v * v * v * py + 3 * v * v * q * lane + 3 * v * q * q * lane + q * q * q * ey;
          oaiPulse += Math.max(0, 1 - Math.abs(frame - pp.arrive) / 6);
          bandSeats.push({
            key: `b${i}`,
            x: b.x,
            y: b.y,
            op: 0.16 * Math.min(1, pour * 4),
          });
        }
      }
      return {
        x: px,
        y: py,
        tier: lift > 0.5 ? 2 : 0,
        lift,
        moving: (lift > 0 && lift < 1) || pour > 0,
        slot: bSlot,
        pour,
      };
    }

    return { x: p.x, y: p.y, tier: 0, lift: 0, moving: false, slot: -1, pour: 0 };
  });

  hfPulse = clamp01(hfPulse / 16);
  oaiPulse = clamp01(oaiPulse / 13);
  const hfSwell = interpolate(hfPulse, [0, 1], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.6)),
  });
  const oaiSwell = interpolate(oaiPulse, [0, 1], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.back(1.6)),
  });

  // -- threads: within a tier, never across, never while an agent moves ------
  const lit = new Float32Array(N);
  const threadEls: { key: number; x1: number; y1: number; x2: number; y2: number; op: number; drawn: number }[] = [];
  const reach = 5;
  for (let j = 0; j < threads; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * N);
    const A = agents[a];
    let b: number;
    if (A.tier === 1) {
      const sc = A.slot % BAND.cols;
      const sr = Math.floor(A.slot / BAND.cols);
      const nc = Math.max(0, Math.min(BAND.cols - 1, sc + Math.round((hash(seed, 7) - 0.5) * 6)));
      const nr = Math.max(0, Math.min(bandRows - 1, sr + Math.round((hash(seed, 8) - 0.5) * 4)));
      const partner = A_AT_SLOT[nr * BAND.cols + nc];
      if (partner === undefined) continue;
      b = partner;
    } else if (A.tier === 2) {
      // The third civilization is present but unread: it talks less, until it
      // is the thing being talked about.
      if (hash(seed, 10) > 0.45 + 0.5 * rise2) continue;
      const sc = A.slot % TIER2.cols;
      const sr = Math.floor(A.slot / TIER2.cols);
      const nc = Math.max(0, Math.min(TIER2.cols - 1, sc + Math.round((hash(seed, 7) - 0.5) * 6)));
      const nr = Math.max(0, Math.min(tier2Rows - 1, sr + Math.round((hash(seed, 8) - 0.5) * 4)));
      const partner = B_AT_SLOT[nr * TIER2.cols + nc];
      if (partner === undefined) continue;
      b = partner;
    } else {
      const ac = a % COLS;
      const ar = Math.floor(a / COLS);
      const bc = Math.max(0, Math.min(COLS - 1, ac + Math.round((hash(seed, 7) - 0.5) * 2 * reach)));
      const br = Math.max(0, Math.min(ROWS - 1, ar + Math.round((hash(seed, 8) - 0.5) * 2 * reach)));
      b = br * COLS + bc;
    }
    if (b === a) continue;
    const B = agents[b];
    if (A.moving || B.moving || A.tier !== B.tier) continue;
    const drawn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], drawn * fade);
    threadEls.push({
      key: j,
      x1: A.x,
      y1: A.y,
      x2: A.x + (B.x - A.x) * drawn,
      y2: A.y + (B.y - A.y) * drawn,
      op: (A.tier === 0 ? 0.5 : 0.85) * fade * (A.tier === 1 ? dim1 : 1),
      drawn,
    });
  }

  // -- the two investigators -------------------------------------------------
  // They stand on the lid of the box until the third civilization arrives
  // underneath them and pushes them up out of the way.
  const push =
    interpolate(frame, [199, 221], [0, 1.05], { ...clamp, easing: Easing.inOut(Easing.cubic) }) -
    interpolate(frame, [221, 235], [0, 0.05], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const investY = INVEST_Y0 + (INVEST_Y1 - INVEST_Y0) * push;
  const investIn = (k2: number) =>
    spring({ frame: frame - (4 + k2 * 8), fps, config: { damping: 13, stiffness: 130 } });
  const labelOp = interpolate(frame, [12, 34], [0, 0.6], clamp);
  const breath = 1 + 0.02 * Math.sin(frame / 17);
  const readKick = interpolate(frame, [150, 158, 196], [0, 1, 0], { ...clamp, easing: Easing.inOut(Easing.quad) });

  const hfIn = interpolate(frame, [beats.breached, beats.huggingFace + 2], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const oaiIn = interpolate(frame, [beats.whichBreached + 2, beats.openai + 3], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // -- camera ----------------------------------------------------------------
  const cam = camera(frame);
  const cy = cam.cy + 5 * Math.sin(frame / 19);
  const cx = 540 + 3 * Math.sin(frame / 23);
  const k = cam.k;
  const tx = 540 - cx * k;
  const ty = 960 - cy * k;
  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.3;
  const bgScale = 1 + (k - 1) * 0.3;

  const boxOp = 0.85 * dim1;

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

      <AbsoluteFill style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}>
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
            {/* the seats the lifted agents left behind */}
            {agents.map((g, i) =>
              g.slot >= 0 && g.lift > 0 ? (
                <circle
                  key={`s${i}`}
                  cx={CROWD_POS[i].x}
                  cy={CROWD_POS[i].y}
                  r={dotRadius * CROWD_POS[i].r}
                  fill="none"
                  stroke={ink}
                  strokeWidth={1.5}
                  opacity={0.14 * g.lift}
                />
              ) : null,
            )}
            {/* and the seats the breach left in its own tier */}
            {bandSeats.map((s) => (
              <circle
                key={s.key}
                cx={s.x}
                cy={s.y}
                r={dotRadius}
                fill="none"
                stroke={ink}
                strokeWidth={1.5}
                opacity={s.op * dim1}
              />
            ))}

            {/* the scope of the report */}
            {boxDraw > 0 && frame < beats.secondCiv + 2 ? (
              <g>
                <path
                  d={`M ${BOX.x0} ${BOX.y0} H ${BOX.x1} V ${BOX.y1} H ${BOX.x0} Z`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={3 + 1.5 * boxClick}
                  strokeLinecap="round"
                  pathLength={1000}
                  strokeDasharray={1000}
                  strokeDashoffset={1000 * (1 - boxDraw)}
                  opacity={Math.min(1, 0.55 + 0.45 * boxClick)}
                />
                {boxDraw < 1 ? (
                  <circle cx={rectPt(boxDraw).x} cy={rectPt(boxDraw).y} r={5.5} fill={ink} />
                ) : null}
              </g>
            ) : null}
            {frame >= beats.secondCiv + 2 ? (
              <g opacity={boxOp}>
                <path
                  d={`M ${BOX.x0} ${sideTop} V ${BOX.y1} H ${BOX.x1} V ${sideTop}`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line x1={BOX.x0} y1={topY} x2={BOX.x1} y2={topY} stroke={ink} strokeWidth={3} strokeLinecap="round" />
                {straining ? (
                  <g>
                    <circle cx={BOX.x0} cy={sideTop} r={5.5} fill={ink} />
                    <circle cx={BOX.x1} cy={sideTop} r={5.5} fill={ink} />
                  </g>
                ) : null}
              </g>
            ) : null}

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
              const arrived = g.pour > 0 ? smooth((g.pour - 0.88) / 0.12) : 0;
              if (arrived >= 1) return null;
              const bre = 1 + 0.05 * Math.sin(frame * 0.11 + hash(i, 9) * 6.28);
              const grow = g.tier === 2 ? 1 + 0.18 * rise2 : 1;
              // In the air the dot is bigger and fully lit for the whole
              // flight, not just at its midpoint, so the stream reads.
              const fly =
                g.pour > 0 && g.pour < 1 ? clamp01(Math.min(g.pour, 1 - g.pour) / 0.12) : 0;
              const r =
                dotRadius *
                CROWD_POS[i].r *
                bre *
                (1 + 0.35 * l) *
                (1 + 0.15 * g.lift) *
                grow *
                (1 + 0.5 * fly) *
                (1 - 0.5 * arrived);
              let op: number;
              let white = 0;
              if (g.tier === 1) {
                const swept = clamp01((sweepX - g.x + 30) / 60);
                op = Math.min(1, 0.45 + 0.55 * swept + 0.25 * l) * dim1;
                if (sweepOn) white = Math.max(0, 1 - Math.abs(sweepX - g.x) / 40);
              } else if (g.tier === 2) {
                op = Math.min(1, 0.45 + 0.55 * rise2 + 0.2 * l);
                white = flash2;
              } else {
                op = Math.min(1, 0.45 + 0.55 * l + 0.25 * g.lift) * (1 - 0.3 * recede);
              }
              if (fly > 0) op = Math.max(op, fly);
              op *= 1 - arrived;
              return (
                <g key={i}>
                  <circle cx={g.x} cy={g.y} r={r} fill={accent} opacity={op} />
                  {white > 0 ? <circle cx={g.x} cy={g.y} r={r} fill={ink} opacity={white * op} /> : null}
                </g>
              );
            })}

            {/* the check, reading everything inside the scope and nothing above it */}
            {sweepOn ? (
              <line
                x1={sweepX}
                y1={BOX.y0}
                x2={sweepX}
                y2={BOX.y1}
                stroke={ink}
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.6 * dim1}
              />
            ) : null}

            {/* the rim each mark takes as a burst lands in it */}
            {hfPulse > 0.01 ? (
              <circle
                cx={HF.x}
                cy={HF.y}
                r={HF.size / 2 + 8 + 6 * hfSwell}
                fill="none"
                stroke={ink}
                strokeWidth={3.5}
                opacity={0.7 * hfSwell * dim1}
              />
            ) : null}
            {oaiPulse > 0.01 ? (
              <circle
                cx={OAI.x}
                cy={OAI.y}
                r={OAI.size / 2 + 8 + 6 * oaiSwell}
                fill="none"
                stroke={ink}
                strokeWidth={3.5}
                opacity={0.7 * oaiSwell}
              />
            ) : null}

            {/* the ring the third breach earns */}
            {ringDraw > 0 ? (
              <circle
                cx={OAI.x}
                cy={OAI.y}
                r={ringR}
                fill="none"
                stroke={ink}
                strokeWidth={3.5 + 1.5 * ringClick}
                pathLength={1000}
                strokeDasharray={1000}
                strokeDashoffset={1000 * (1 - ringDraw)}
                transform={`rotate(-90 ${OAI.x} ${OAI.y})`}
                opacity={0.95}
              />
            ) : null}
            {ringDraw > 0 && ringDraw < 1 ? (
              <circle
                cx={OAI.x + ringR * Math.sin(ringDraw * Math.PI * 2)}
                cy={OAI.y - ringR * Math.cos(ringDraw * Math.PI * 2)}
                r={5.5}
                fill={ink}
              />
            ) : null}
            {ripple > 0 && ripple < 1 ? (
              <circle
                cx={OAI.x}
                cy={OAI.y}
                r={ringR + 78 * ripple}
                fill="none"
                stroke={ink}
                strokeWidth={3}
                opacity={0.45 * (1 - ripple)}
              />
            ) : null}
          </svg>

          {/* the two investigators */}
          {[-1, 1].map((s, idx) => (
            <Img
              key={idx}
              src={staticFile("person.png")}
              style={{
                position: "absolute",
                left: 540 + s * INVEST.dx - INVEST.size / 2,
                top: investY - INVEST.size / 2,
                width: INVEST.size,
                height: INVEST.size,
                filter: "brightness(0) invert(1)",
                opacity: Math.min(1, investIn(idx)),
                transform: `scale(${(0.86 + 0.14 * investIn(idx)) * breath * (1 + 0.05 * readKick)})`,
                transformOrigin: "center center",
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: investY + INVEST.size / 2 + 16,
              width: WORLD_W,
              textAlign: "center",
              color: ink,
              opacity: labelOp,
              fontFamily: FONT,
              fontSize: 32,
              fontWeight: 600,
              letterSpacing: "0.10em",
            }}
          >
            <span style={{ marginRight: "-0.10em" }}>{investigatorLabel.toUpperCase()}</span>
          </div>

          {/* what the report looked at */}
          <Img
            src={staticFile("hugging-face.webp")}
            style={{
              position: "absolute",
              left: HF.x - HF.size / 2,
              top: HF.y - HF.size / 2,
              width: HF.size,
              height: HF.size,
              filter: "grayscale(1) brightness(1.05) contrast(1.3)",
              opacity: hfIn * dim1,
              transform: `scale(${(0.8 + 0.2 * hfIn) * (1 + 0.1 * hfSwell)})`,
              transformOrigin: "center center",
            }}
          />

          {/* what it did not */}
          <Img
            src={staticFile("openai-logo.png")}
            style={{
              position: "absolute",
              left: OAI.x - OAI.size / 2,
              top: OAI.y - OAI.size / 2,
              width: OAI.size,
              height: OAI.size,
              filter: "brightness(0) invert(1)",
              opacity: oaiIn * Math.min(1, 0.55 + 0.45 * rise2 + flash2),
              transform: `scale(${(0.8 + 0.2 * oaiIn) * (1 + 0.1 * oaiSwell) * (1 + 0.05 * rise2) * (1 + 0.05 * ringLand)})`,
              transformOrigin: "center center",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default ScopeOfTheReport;
