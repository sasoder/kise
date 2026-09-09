import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_READ,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  feather,
  hash,
  iconShadow,
  idleThreads,
  makeTone,
  runCamera,
  squirclePath,
  sway,
  wobble,
  worldTransform,
} from "./fieldShared";

export const FPS = 24;
// Dwarkesh clip `impossible-tasks`: "OpenAI accidentally gives its models
// impossible tasks. For example, the task might require internet access that
// OpenAI forgot to provide."
//
// SRT span 0:01.960 -> 0:08.939 at 24fps.
// round((8.939 - 1.960) * 24) = round(6.979 * 24) = round(167.496) = 168
// frames of speech, plus a 16 frame tail so the resolved state holds = 184.
export const DURATION = 184;

// ---------------------------------------------------------------------------
// "Impossible tasks". Orange Dwarkesh style: opaque grid cutaway, the crowd is
// the material, the human-made thing is ink geometry made of the field's own
// primitives.
//
// The sandbox is one ink box, 900 x 700, and the models live inside it. Five
// tasks are dealt in from the OpenAI mark above. Each task reaches straight up
// and stops dead against the wall — the deadness is the point, there is no
// click and no ripple, because nothing on the other side answers. The internet
// draws as a ring outside the box and the five reaches lean toward it, so what
// they were reaching FOR is now visible and still out of reach. Then the
// hundred and twenty pixels of wall under the ring go dashed: the gate OpenAI
// forgot to build was never there.
//
// Every gesture is one word. Nothing else happens.
//   the one camera move: open at k 1.50 inside the
//     box, crowd bleeding off both sides, mark above
//     the frame, and pull back to k 0.95 so the mark above and the whole
//     box are in frame. Keyed f0-9, on screen f0-16,
//     settled well before the deal                    — "OpenAI"          f0-16
//   five task tiles launch from the mark at f25, 28,
//     31, 34, 37, each on its own shallow lateral
//     bow, 12 frames, easing out; each lands with a
//     back-overshoot on a seat 34 px above its agent
//     and that agent goes deep -> ripe over 6 frames  — "gives its models" f25-49
//   from each tile's top edge an ink line rises
//     straight up at one speed and stops dead on the
//     inside face of the top wall. Starts two frames
//     after its own tile lands (f39, 42, 45, 48, 51);
//     the longest line therefore takes the longest,
//     and the last is against the wall by f57. No
//     click, no flash, no ripple on contact          — "impossible tasks"  f43-57
//   hold. Only idle threads, breath and sway          — (no word)          f57-96
//   the internet ring draws head-led and closes
//     outside the box, a wifi glyph (three arcs over
//     a dot, same stroke) fades in inside it as it
//     closes, and the five line tops then
//     slide along the wall toward it, so each reach
//     becomes a diagonal aimed under the ring
//                                     — "require internet access"          f96-116
//   the 120 px of wall under the ring crossfades
//     from solid to dashed: the gate was never built  — "forgot to provide" f143-152
//   hold resolved, never fades                        — tail                f168-184
//
// ambient: idle thread traffic across the crowd from f0 at the shared
// opacities, `breath` on every dot, `sway` on the camera. Not gestures; that is
// what this field is.
//
// Two things are derived rather than hand-set, and both are noted where they
// are computed: the deal ORDER is longest-line-first (which is scattered in x,
// never left-to-right) because the last line to leave has only six frames to
// reach the wall by f57; and LINE_SPEED is solved from the actual geometry with
// 28 px/frame as its floor, so "all at the same speed" and "against the wall by
// f57" are both true whatever the hashed seats do.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot
  accentDeep: z.string(), // deep: an unread dot
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotRadius: z.number(),
  dotUnread: z.number(), // the dot body's opacity; the state ladder is colour
  idleThreadCount: z.number(),
  markSrc: z.string(), // the OpenAI mark, tinted white
  markSize: z.number(), // world px, square
  beats: z.object({
    openai: z.number(), // "OpenAI"
    accidentally: z.number(), // "accidentally"
    givesIts: z.number(), // "gives its"
    models: z.number(), // "models"
    impossible: z.number(), // "impossible"
    tasks: z.number(), // "tasks"
    forExample: z.number(), // "for example"
    theTaskMight: z.number(), // "the task might"
    require: z.number(), // "require"
    internetAccess: z.number(), // "internet access"
    that: z.number(), // "that"
    openaiTwo: z.number(), // "OpenAI"
    forgotTo: z.number(), // "forgot to"
    provide: z.number(), // "provide"
    end: z.number(), // speech ends; tail to 184
  }),
});

export type Props = z.infer<typeof schema>;

const WORLD_W = 1080;
const WORLD_H = 2200;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const clampi = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// The sandbox. One ink box, 900 x 700, centred on world (540, 60): the top wall
// at y -290, the bottom at 410, the left at x 90, the right at 990. Stroke 3,
// so the wall's INSIDE face is 1.5 world px in from its centre line. It is drawn
// from f0 and never animates — it is not a gesture, it is where the agents live.
// ---------------------------------------------------------------------------
const CENTRE_X = 540;
const BOX_W = 900;
const BOX_H = 700;
const BOX_X0 = CENTRE_X - BOX_W / 2; // 90
const BOX_X1 = CENTRE_X + BOX_W / 2; // 990
const BOX_CY = 60;
const BOX_Y0 = BOX_CY - BOX_H / 2; // -290
const BOX_Y1 = BOX_CY + BOX_H / 2; // 410
const STROKE = 3;
const BOX_PATH = squirclePath(BOX_W, BOX_H);
// the inside face of the top wall, and where a round-capped line has to END so
// that its cap lands exactly on that face and never pokes through
const WALL_INNER = BOX_Y0 + STROKE / 2; // -288.5
const LINE_TIP_Y = WALL_INNER + STROKE / 2; // -287

// The OpenAI mark, above the box.
const MARK = { x: CENTRE_X, y: -560 };

// The internet: an ink ring between the mark and the top wall.
const RING = { x: CENTRE_X, y: -400, r: 40 };
// Inside it, the internet as the field would draw it: a wifi glyph of three
// ink arcs over a dot, one stroke weight, centred in the ring. The dot sits
// 15 px below the ring centre so the whole glyph (dot to outer arc) is centred.
const WIFI = { radii: [10, 19, 28], dot: 3.5, dy: 15, halfAngle: (50 * Math.PI) / 180 };
const WIFI_F0 = 106; // fades in as the ring closes (f108)
const WIFI_DUR = 6;

// The gate: the 120 px of top wall centred under the ring.
const GATE_X0 = CENTRE_X - 60; // 480
const GATE_X1 = CENTRE_X + 60; // 600

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is the whole of "OpenAI": open at k 1.50 with
// the content centre 80 px below the box centre (the mark fully above the frame), so the crowd bleeds off both sides and
// the box's side walls are outside the frame, and pull back to k 0.95 with the
// content centre on the composition's own middle — the midpoint of the mark's
// top and the box's bottom, world y -102.
//
// Keyed f0-9 rather than f0-16: `runCamera` damps the target, so a key track
// that ends at f16 is still 2% off its zoom at f16 and only stops around f24.
// Ending the keys at f9 puts the move ON SCREEN across f0-16 — at f16 the zoom
// is within 1.7% of final and drifting at under 0.2% a frame, an order of
// magnitude below the speed at which a zoom reads as a move at all — and every
// gesture after it happens under a still camera. Nothing new appears while it
// runs; the reveal IS the gesture.
//
// At the resolved camera: the mark's centre sits at screen y 446 and its top at
// 400, the ring spans 548-616, the box's top wall is at 675 and its bottom at
// 1270, and the content centre lands at 835 under the captions.
// ---------------------------------------------------------------------------
const K_OPEN = 1.5;
const K_FINAL = 0.95;
const CONTENT_OPEN = BOX_CY + 80; // 140: the mark is fully above the frame at the open
const CONTENT_FINAL = (MARK.y - 54 + BOX_Y1) / 2; // -102
const CY_FINAL = CONTENT_FINAL + 125 / K_FINAL;
const CAM = camMove({
  f0: 0,
  f1: 9,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CONTENT_OPEN,
  c1: CONTENT_FINAL,
  warp: 0.72,
});
const CAM_F = [...CAM.F, DURATION];
const CAM_K = [...CAM.K, K_FINAL];
const CAM_CY = [...CAM.CY, CY_FINAL];

// ---------------------------------------------------------------------------
// The crowd. The field's step in both axes, jitter 0.9, radius spread
// 0.75-1.25, deterministic hash — the reference field's material, laid inside
// the box only. Seats fill the interior with a 30 px inset.
//
// The density feathers toward ALL FOUR walls: the nominal boundary is that
// inset rectangle, undulating by `wobble`, and over CROWD_FEATHER steps inside it
// a seat only exists if its hash falls under `feather`, with the survivors
// drawn smaller. Without it the crowd is a box of agents inside a box, which
// reads as two edges where there is only one — the ink wall is the only hard
// edge in the piece.
// ---------------------------------------------------------------------------
const STEP = 940 / 39;
// director pass: the crowd presses up to the walls — 18 px inset, feathered over
// two steps instead of four, so the box reads as full rather than framed.
const CROWD_FEATHER = 2;
const INSET = 18;
const IN_X0 = BOX_X0 + INSET;
const IN_X1 = BOX_X1 - INSET;
const IN_Y0 = BOX_Y0 + INSET;
const IN_Y1 = BOX_Y1 - INSET;
// The undulation is held to 0.45 of a step (~11 world px) so the nominal edge
// can never wander out past the 30 px inset and put a seat on the wall.
const WOB_AMP = 0.4;
const edgeL = (y: number) => IN_X0 + wobble(y, 1.7) * WOB_AMP * STEP;
const edgeR = (y: number) => IN_X1 - wobble(y, 3.1) * WOB_AMP * STEP;
const edgeT = (x: number) => IN_Y0 + wobble(x, 2.3) * WOB_AMP * STEP;
const edgeB = (x: number) => IN_Y1 - wobble(x, 4.9) * WOB_AMP * STEP;

const COLS = Math.round((IN_X1 - IN_X0) / STEP) + 1;
const ROWS = Math.round((IN_Y1 - IN_Y0) / STEP) + 1;
const GRID_X0 = (IN_X0 + IN_X1) / 2 - ((COLS - 1) * STEP) / 2;
const GRID_Y0 = (IN_Y0 + IN_Y1) / 2 - ((ROWS - 1) * STEP) / 2;

type Seat = { x: number; y: number; r: number; rs: number; gc: number; gr: number };
const SEATS: Seat[] = (() => {
  const out: Seat[] = [];
  for (let gr = 0; gr < ROWS; gr++) {
    for (let gc = 0; gc < COLS; gc++) {
      const i = gr * COLS + gc;
      const x = GRID_X0 + gc * STEP + (hash(i, 11) - 0.5) * STEP * 0.9;
      const y = GRID_Y0 + gr * STEP + (hash(i, 12) - 0.5) * STEP * 0.9;
      const d = Math.min(
        (x - edgeL(y)) / STEP,
        (edgeR(y) - x) / STEP,
        (y - edgeT(x)) / STEP,
        (edgeB(x) - y) / STEP,
      );
      const fe = feather(d, CROWD_FEATHER);
      if (hash(i, 71) >= fe) continue;
      out.push({ x, y, r: 0.75 + 0.5 * hash(i, 13), rs: 0.7 + 0.3 * fe, gc, gr });
    }
  }
  return out;
})();
const NSEAT = SEATS.length;

// grid cell -> seat, so idle traffic can find a neighbour without a search
const SEAT_AT = new Int32Array(COLS * ROWS).fill(-1);
SEATS.forEach((s, i) => {
  SEAT_AT[s.gr * COLS + s.gc] = i;
});

// The props, now that the seat count exists: the idle traffic is scaled off it
// by the shared rule (180 threads per 1,200 agents), never hand-set.
export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  dotRadius: DOT_RADIUS,
  dotUnread: OP_UNREAD_DOT,
  idleThreadCount: idleThreads(NSEAT),
  markSrc: "openai-chatgpt-logo.png",
  markSize: 108,
  beats: {
    openai: 0,
    accidentally: 11,
    givesIts: 25,
    models: 35,
    impossible: 43,
    tasks: 57,
    forExample: 70,
    theTaskMight: 84,
    require: 98,
    internetAccess: 107,
    that: 127,
    openaiTwo: 133,
    forgotTo: 145,
    provide: 156,
    end: 168,
  },
});

// ---------------------------------------------------------------------------
// The five tasks. Their targets are five real seats, spread across the box's
// width off the anchors 250 / 390 / 540 / 690 / 830 with a hashed offset of at
// most 12 px, and across its height off a five-rung ladder handed out to those
// anchors by a hashed permutation, so height is not a function of x. The
// anchors are 140 px apart and the jitter and the seat snap together can move a
// tile by at most 24, so no two tiles can land within 90 px of each other.
//
// A tile's centre is 34 px ABOVE its agent's dot: the tile is 40 tall, so its
// bottom edge clears the dot's top by 7 px and the agent stays visible under
// its own task.
// ---------------------------------------------------------------------------
const TILE = 40;
const TILE_HALF = TILE / 2;
const TILE_PATH = squirclePath(TILE, TILE);
const TILE_LIFT = 34; // world px from the agent's dot up to the tile's centre
const ANCHOR_X = [250, 390, 540, 690, 830];
const LADDER_Y = [186, 118, 50, -18, -86];

type Tile = {
  seat: number; // index into SEATS
  x: number; // the tile's centre, in world px
  y: number;
  arc: number; // its lateral bow at mid-flight
  launch: number;
  land: number;
  lineFrom: number; // the frame its line starts rising
  len: number; // the line's length, straight up to the wall
  tipX: number; // where its tip ends up after the converge
};

const TILES: Tile[] = (() => {
  // the ladder, permuted onto the anchors by hash: height is not a function of x
  const perm = ANCHOR_X.map((_, i) => i).sort((a, b) => hash(a, 22) - hash(b, 22));
  const wanted = ANCHOR_X.map((ax, i) => ({
    x: ax + (hash(i, 20) - 0.5) * 24,
    y: LADDER_Y[perm[i]] + (hash(i, 21) - 0.5) * 24,
  }));

  // snap each to the nearest real seat, so a task always lands on an agent
  const seats = wanted.map((w) => {
    let best = 0;
    let bestD = Infinity;
    SEATS.forEach((s, i) => {
      const dd = Math.hypot(s.x - w.x, s.y - w.y);
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    });
    return best;
  });

  const raw = seats.map((si, i) => {
    const s = SEATS[si];
    const y = s.y - TILE_LIFT;
    return {
      seat: si,
      x: s.x,
      y,
      // its own bow, 45-90 px either way: shallow against a ~500 px run, and
      // never zero, so no two tiles travel the same path and none is straight
      arc: (hash(i, 65) < 0.5 ? -1 : 1) * (45 + 45 * hash(i, 66)),
      len: y - TILE_HALF - LINE_TIP_Y, // from the tile's top edge to the wall
    };
  });

  // The deal order. The five launch slots are 3 frames apart and a line leaves
  // 2 frames after its own tile lands, so the LAST tile dealt has only six
  // frames to get its line against the wall by "tasks" (f57) — and all five
  // lines run at one speed. Ordering the deal by descending line length is what
  // makes that possible: the long reaches leave first and take the longest, the
  // short one leaves last and takes the least. It is a scattered order in x
  // (the ladder is permuted onto the anchors by hash), never left-to-right.
  const order = raw.map((_, i) => i).sort((a, b) => raw[b].len - raw[a].len);

  // The tips, assigned by tile x order so the five diagonals never cross.
  const byX = raw.map((_, i) => i).sort((a, b) => raw[a].x - raw[b].x);
  const tipX: number[] = [];
  byX.forEach((i, rank) => {
    tipX[i] = CENTRE_X + (rank - 2) * 24;
  });

  const out: Tile[] = [];
  order.forEach((i, slot) => {
    const launch = 25 + slot * 3;
    const land = launch + 12;
    out[i] = { ...raw[i], launch, land, lineFrom: land + 2, tipX: tipX[i] };
  });
  return out;
})();

// One speed for all five lines, so a longer reach visibly takes longer. 28
// world px a frame is the floor; if the hashed seats ever put a long line in a
// late slot the speed is raised just enough that the last tip is against the
// wall on "tasks", which is the beat the whole gesture is cut to.
const LINE_DEADLINE = 57;
const LINE_SPEED = Math.max(
  28,
  ...TILES.map((t) => t.len / Math.max(1, LINE_DEADLINE - t.lineFrom)),
);

const DEAL_DUR = 12; // frames in flight
const TONE_DUR = 6; // deep -> ripe under a landed tile

// The internet ring, and the converge that follows it.
const RING_F0 = 96;
const RING_DUR = 12; // draws head-led and closes by f108
const CONV_F0 = 100; // the tips start sliding along the wall
const CONV_DUR = 12; // 12 frames each, staggered 1, so the last lands at f116

// The gate. The wall's own segment fades out under a mask while the dashed one
// fades in, so the two are one crossfade and never both solid.
const GATE_F0 = 143;
const GATE_DUR = 9;
const GATE_DASH = 14;
const GATE_GAP = 10;

const ImpossibleTasks: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  dotRadius,
  dotUnread,
  idleThreadCount,
  markSrc,
  markSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = unread (deep), 1 = lit (ripe). Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- the crowd's tone ------------------------------------------------------
  // Only the five agents under a landed tile ever go ripe, and they stay ripe.
  const seatTone = new Float32Array(NSEAT);
  TILES.forEach((t) => {
    seatTone[t.seat] = smooth((frame - t.land) / TONE_DUR);
  });

  // -- idle traffic ----------------------------------------------------------
  // The field's own ambient, from f0: a thread from one seat to a neighbour,
  // drawing head-led, holding, fading, brightening both ends as it goes.
  const lit = new Float32Array(NSEAT);
  type Th = { key: string; x1: number; y1: number; x2: number; y2: number; op: number; head: number };
  const threadEls: Th[] = [];

  const reach = 5;
  for (let j = 0; j < idleThreadCount; j++) {
    const period = 44 - 12 * hash(j, 4);
    const local = frame + hash(j, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = j * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * NSEAT);
    const sa = SEATS[a];
    const bc = clampi(sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, COLS - 1);
    const br = clampi(sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, ROWS - 1);
    const b = SEAT_AT[br * COLS + bc];
    if (b < 0 || b === a) continue;
    const sb = SEATS[b];
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    threadEls.push({
      key: `i${j}`,
      x1: sa.x,
      y1: sa.y,
      x2: sa.x + (sb.x - sa.x) * dn,
      y2: sa.y + (sb.y - sa.y) * dn,
      op: 0.4 * fade,
      head: dn,
    });
  }

  // -- the tasks: the deal, then the reach -----------------------------------
  const tiles = TILES.map((t, i) => {
    if (frame < t.launch) return null;
    const lin = clamp01((frame - t.launch) / DEAL_DUR);
    const e = Easing.out(Easing.cubic)(lin);
    const dx = t.x - MARK.x;
    const dy = t.y - MARK.y;
    const L = Math.hypot(dx, dy) || 1;
    // the bow is perpendicular to the run, so every tile arcs and no two arc
    // the same way — and none of them travels a straight line
    const bow = Math.sin(Math.PI * e) * t.arc;
    const x = MARK.x + dx * e + (-dy / L) * bow;
    const y = MARK.y + dy * e + (dx / L) * bow;
    // the one spring in the piece: the landing
    const scale = interpolate(frame, [t.land - 2, t.land + 7], [0.82, 1], {
      ...clamp,
      easing: Easing.out(Easing.back(1.6)),
    });
    return {
      key: i,
      x,
      y,
      scale,
      op: OP_READ * smooth(lin / 0.15),
    };
  });

  // The reach. It rises straight up from the tile's top edge at one speed and
  // stops on the wall's inside face; from f100 its TIP slides along the wall
  // toward a point under the ring, so the reach leans without the tile or the
  // agent moving. Nothing happens when it arrives.
  const lines = TILES.map((t, i) => {
    if (frame < t.lineFrom) return null;
    const drawn = clamp01(((frame - t.lineFrom) * LINE_SPEED) / t.len);
    const conv = smooth((frame - (CONV_F0 + i)) / CONV_DUR);
    const tipX = t.x + (t.tipX - t.x) * conv;
    const x1 = t.x;
    const y1 = t.y - TILE_HALF;
    return {
      key: i,
      x1,
      y1,
      x2: x1 + (tipX - x1) * drawn,
      y2: y1 + (LINE_TIP_Y - y1) * drawn,
    };
  });

  // -- the internet ring -----------------------------------------------------
  const ringDraw = interpolate(frame, [RING_F0, RING_F0 + RING_DUR], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });
  const RING_C = 2 * Math.PI * RING.r;
  const wifiIn = smooth((frame - WIFI_F0) / WIFI_DUR);
  const wifiCx = RING.x;
  const wifiCy = RING.y + WIFI.dy;

  // -- the gate --------------------------------------------------------------
  const gate = smooth((frame - GATE_F0) / GATE_DUR);

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the per-icon shadow ---------------------------------------------------
  // One small shadow on every icon: the box, the tiles, the reaches, the ring,
  // the dashed gate and the mark. Not the dots and not the threads — those are
  // the field. Its lengths are screen px divided by k, so it is the same shadow
  // at k 1.50 inside the box and at k 0.95 on the wide.
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

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
            <defs>
              {/* the gate's half of the crossfade: the wall's own segment is
                  masked away exactly as fast as the dashed one arrives */}
              <mask id="it-gate" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
                <rect x={-400} y={-900} width={1900} height={1900} fill="#fff" />
                <rect
                  x={GATE_X0}
                  y={BOX_Y0 - 6}
                  width={GATE_X1 - GATE_X0}
                  height={12}
                  fill="#000"
                  opacity={gate}
                />
              </mask>
            </defs>

            {/* the crowd */}
            {SEATS.map((s, i) => {
              const l = Math.max(lit[i], seatTone[i]);
              const r = dotRadius * s.r * s.rs * breath(frame, hash(i, 9)) * (1 + 0.35 * l);
              return <circle key={i} cx={s.x} cy={s.y} r={r} fill={tone(l)} opacity={dotUnread} />;
            })}

            {/* idle traffic, head-led */}
            {threadEls.map((t) => (
              <g key={t.key}>
                <line
                  x1={t.x1}
                  y1={t.y1}
                  x2={t.x2}
                  y2={t.y2}
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={t.op}
                />
                {t.head < 1 ? <circle cx={t.x2} cy={t.y2} r={4} fill={ink} opacity={t.op} /> : null}
              </g>
            ))}

            {/* the sandbox, with the gate masked out of its own wall */}
            <g style={{ filter: icon }}>
              <g mask="url(#it-gate)">
                <path
                  d={BOX_PATH}
                  transform={`translate(${BOX_X0} ${BOX_Y0})`}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  opacity={OP_READ}
                />
              </g>
              {/* the gate that was never built */}
              {gate > 0 ? (
                <line
                  x1={GATE_X0}
                  y1={BOX_Y0}
                  x2={GATE_X1}
                  y2={BOX_Y0}
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeDasharray={`${GATE_DASH} ${GATE_GAP}`}
                  opacity={OP_READ * gate}
                />
              ) : null}
            </g>

            {/* the internet: an ink ring outside the box, drawn head-led */}
            {ringDraw > 0 ? (
              <g style={{ filter: icon }}>
                <circle
                  cx={RING.x}
                  cy={RING.y}
                  r={RING.r}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - ringDraw)}
                  opacity={OP_READ}
                  transform={`rotate(-90 ${RING.x} ${RING.y})`}
                />
                {ringDraw < 1 ? (
                  <circle
                    cx={RING.x + RING.r * Math.sin(ringDraw * Math.PI * 2)}
                    cy={RING.y - RING.r * Math.cos(ringDraw * Math.PI * 2)}
                    r={4}
                    fill={ink}
                  />
                ) : null}
                {/* the wifi glyph inside the ring: one fade, no draw */}
                {wifiIn > 0 ? (
                  <g opacity={OP_READ * wifiIn} fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round">
                    {WIFI.radii.map((r) => (
                      <path
                        key={r}
                        d={`M ${wifiCx - r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)} A ${r} ${r} 0 0 1 ${wifiCx + r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)}`}
                      />
                    ))}
                    <circle cx={wifiCx} cy={wifiCy} r={WIFI.dot} fill={ink} stroke="none" />
                  </g>
                ) : null}
              </g>
            ) : null}

            {/* the reaches */}
            <g style={{ filter: icon }}>
              {lines.map((l) =>
                l ? (
                  <line
                    key={l.key}
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={OP_READ}
                  />
                ) : null,
              )}
            </g>

            {/* the tasks */}
            {tiles.map((t) =>
              t ? (
                <g key={t.key} style={{ filter: icon }}>
                  <path
                    d={TILE_PATH}
                    transform={`translate(${t.x} ${t.y}) scale(${t.scale}) translate(${-TILE_HALF} ${-TILE_HALF})`}
                    fill={ink}
                    opacity={t.op}
                  />
                </g>
              ) : null,
            )}
          </svg>

          {/* the OpenAI mark, tinted white, present from f0 */}
          <Img
            src={staticFile(markSrc)}
            style={{
              position: "absolute",
              left: MARK.x - markSize / 2,
              top: MARK.y - markSize / 2,
              width: markSize,
              height: markSize,
              filter: `brightness(0) invert(1) ${icon}`,
            }}
          />
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default ImpossibleTasks;
