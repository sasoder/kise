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
  sway,
  worldTransform,
} from "./fieldShared";
// Cut 1 of this clip. Every constant and every piece of geometry this piece
// stands on is IMPORTED from it, never restated, so the butt-join cannot drift.
import {
  BOX_PATH,
  BOX_X0,
  BOX_X1,
  BOX_Y0,
  BOX_Y1,
  CAM_CY,
  CAM_F,
  CAM_K,
  CENTRE_X,
  COLS,
  CONTENT_FINAL,
  CONV_DUR,
  CONV_F0,
  CROWD_FEATHER,
  GATE_DASH,
  GATE_GAP,
  GATE_X0,
  GATE_X1,
  GRID_X0,
  GRID_Y0,
  K_FINAL,
  LINE_TIP_Y,
  MARK,
  NSEAT,
  RING,
  ROWS,
  SEATS,
  SEAT_AT,
  STEP,
  STROKE,
  type Seat,
  TILES,
  TILE_HALF,
  TILE_PATH,
  TONE_DUR,
  WIFI,
  WORLD_H,
  WORLD_W,
  clamp01,
  clampi,
  edgeB,
  edgeL,
  edgeR,
  edgeT,
  smooth,
} from "./ImpossibleTasks";

export const FPS = 24;
// Dwarkesh clip `impossible-tasks`, cut 2: "So when highly persistent models get
// assigned tasks which seem to require internet access, but they're trapped
// inside isolated sandboxes, they're of course going to try to hack out."
//
// SRT span 0:08.939 -> 0:17.899 at 24fps.
// round((17.899 - 8.939) * 24) = round(8.960 * 24) = round(215.04) = 215
// frames of speech, plus a 16 frame tail so the resolved state holds = 231.
export const DURATION = 231;

// ---------------------------------------------------------------------------
// "Try to hack out". Orange Dwarkesh style: opaque grid cutaway, 24fps, the
// crowd is the material, one eased camera move, one gesture per word.
//
// CONTINUITY. This is the direct continuation of `ImpossibleTasks.tsx` and the
// editor butts the two together, so f0 here IS cut 1's f168 — the same pixels,
// not a rebuild that looks like them.
//
//   * Nothing is re-derived. The box, STROKE, the seat grid and SEATS, the five
//     tiles and their converged reach tips, RING, WIFI, the gate's x-range, the
//     camera's key track, K_FINAL and CONTENT_FINAL are all imported from cut 1.
//     The only edit made to that file was adding `export` to those declarations;
//     no value moved, and cut 1 renders to PSNR inf at f100 and f168 against
//     itself before the edit.
//   * OFFSET = 168. Everything periodic evaluates at `frame + OFFSET` — `sway`,
//     `breath`, the idle-thread schedule, the grid's own drift, and `runCamera`
//     over cut 1's key track with this piece's one move appended at f286-306
//     (= f118-138 local). So the hand on the camera and the ambient traffic
//     carry their phase across the join instead of restarting.
//   * Everything cut 1 resolved is simply AT its resolved state from f0: the
//     five tiles landed and their agents ripe, the five reaches at their
//     converged diagonals, the ring closed, the wifi glyph at full, the gate
//     dashed. They are drawn from the same geometry at drawn = conv = 1.
//   * Only what is new — the two neighbouring sandboxes — exists at f0, and at
//     cut 1's camera (k 0.95) their inner walls sit at screen x -78 and 1158,
//     off both edges, so f0 is unchanged. Measured: f0 vs cut 1's f168 is
//     PSNR inf.
//
// Every gesture is one word. Nothing else happens.
//   cut 1's resolved frame, held. Camera k 0.95,
//     content centre -102, no move                  — "so when highly"    f0
//   the five reaches PUMP: each one shortens from
//     its wall end by 36 px over 8 frames (ease in)
//     and pushes back over 6 (ease out), rests 0-6
//     frames, and repeats for the rest of the piece.
//     Start frames hashed f25-36 so they are never
//     in unison. The tile end never moves; the tip
//     stays a round cap; nothing happens on contact — "persistent"        f25+
//   hold. Ambient and the pumping only — the tasks,
//     the internet and the walls are already on
//     screen and re-announcing them is a gesture
//     with no word                                  — (no word)           f36-118
//   THE ONE CAMERA MOVE: k 0.95 -> 0.60 on a pure
//     zoom (content centre stays -102, warp 0.72),
//     keyed f118-130 so it runs ON SCREEN f118-140
//     and is settled before "sandboxes" (f144). It
//     reveals the two neighbouring sandboxes
//     bleeding off the left and right frame edges —
//     the reveal IS the gesture, nothing else
//     appears while it runs      — "trapped inside isolated sandboxes"    f118-138
//   EVERY crowd strikes its own walls from inside:
//     a thread launches from a random seat to the
//     nearest point on its own box's wall, drawing
//     over 6, holding 3, fading 8; its seat goes
//     deep -> ripe from the launch and back to deep
//     14 frames later; an ink fleck marks the
//     wall on arrival and fades over 8. Rate ramps
//     from 0 at f190 to 2.2/frame (ours) and
//     1.2/frame (each neighbour) by f206 and holds.
//     The reaches' pump hardens to a 9-frame cycle
//     with no rest — the same gesture, harder. No
//     thread crosses a wall; nothing gets out       — "try to hack out"   f190-215
//   hold under fire, never fades out                — tail                f215-231
//
// ambient: idle thread traffic in all three boxes at the shared rate (180 per
// 1,200 agents), `breath` on every dot, `sway` on the camera. Not gestures;
// that is what this field is.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: a lit dot, and every accent line
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
  idleThreadCount: z.number(), // our box; each neighbour scales off its own count
  markSrc: z.string(), // the OpenAI mark, tinted white
  markSize: z.number(), // world px, square
  beats: z.object({
    soWhenHighly: z.number(), // "so when highly"   — cut 1's resolved frame
    persistent: z.number(), // "persistent"         — the reaches start pumping
    modelsGet: z.number(), // "models get"
    assignedTasks: z.number(), // "assigned tasks"
    whichSeem: z.number(), // "which seem"
    toRequire: z.number(), // "to require"
    internetAccess: z.number(), // "internet access"
    butTheyre: z.number(), // "but they're"
    trappedInside: z.number(), // "trapped inside"  — the pull-back is running
    isolated: z.number(), // "isolated"
    sandboxes: z.number(), // "sandboxes"           — the pull-back has settled
    theyreOf: z.number(), // "they're of"
    courseGoingTo: z.number(), // "course going to"
    tryToHackOut: z.number(), // "try to hack out"  — the strike
    end: z.number(), // speech ends; tail to 231
  }),
});

export type Props = z.infer<typeof schema>;

// The join. Cut 1's speech ends at its f168, which is this piece's f0.
const OFFSET = 168;

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is "trapped inside isolated sandboxes": a pure
// zoom out from cut 1's resolved k 0.95 to k 0.60 with the content centre held
// at CONTENT_FINAL, so nothing slides sideways — the frame simply opens and the
// neighbours are already there.
//
// The key track is cut 1's own, unchanged, with this move appended in OFFSET
// frames. `runCamera(frame + OFFSET, ...)` therefore replays cut 1's damper
// exactly up to the join and continues from its state, rather than starting a
// fresh damper that would have to settle again.
//
// At the resolved camera: the content centre lands at screen y 835 under the
// captions, the mark's top at 528, the box's bottom wall at 1142, and the two
// neighbours run off the left and right edges with a 120 screen px gap either
// side of our box.
// ---------------------------------------------------------------------------
const K_WIDE = 0.6;
const CAM_MOVE_F0 = 118; // local; "but they're" is f116, the move starts two later
// Keyed f118-130 rather than f118-138, for cut 1's reason: `runCamera` damps the
// target, so a key track that ends where the move should END on screen is still
// running well past it. Measured over this track: keys to f138 leave the zoom
// 5.7% off at f138 and still moving 1.76% a frame, and it does not stop until
// ~f150 — well into "sandboxes". Keys to f130 put the move ON SCREEN across
// f118-140: 0.67% off at f138 and drifting 0.43% a frame, inside 0.06% by f144.
// Both numbers are tighter than cut 1 is at the end of its own stated move
// (1.84%, 0.946%/f), and the peak zoom speed lands at 4.14% a frame against cut
// 1's 4.77%, so it is the same hand on a slightly longer move.
const CAM_MOVE_F1 = 130;
// (the camera's key track has to exist at module scope, so these two are the
// only frames in the piece not read straight off the `beats` prop)
const MOVE = camMove({
  f0: OFFSET + CAM_MOVE_F0,
  f1: OFFSET + CAM_MOVE_F1,
  k0: K_FINAL,
  k1: K_WIDE,
  c0: CONTENT_FINAL,
  c1: CONTENT_FINAL,
  warp: 0.72,
});
const CY_WIDE = CONTENT_FINAL + 125 / K_WIDE;
const TH_CAM_F = [...CAM_F, ...MOVE.F, OFFSET + DURATION];
const TH_CAM_K = [...CAM_K, ...MOVE.K, K_WIDE];
const TH_CAM_CY = [...CAM_CY, ...MOVE.CY, CY_WIDE];

// ---------------------------------------------------------------------------
// The neighbours. Two more sandboxes, one either side, the same 900 x 700 box
// on the same centre line, 200 px of clear ground between boxes. Each has its
// own crowd out of cut 1's seat generator with the hash index offset, so it is
// the same material laid the same way and not the same arrangement twice.
//
// They are the neighbours, not the subject: no tiles, no reaches, no ring, no
// gate. They exist from f0, off both frame edges at cut 1's camera.
// ---------------------------------------------------------------------------
const NEIGH_DX = 1100; // box centres 1100 apart, so a 200 px gap between walls

// Cut 1's seat generator, with the hash index offset so a neighbour's crowd is
// its own. Everything else — the grid, the wobbling edges, the feather, the
// radius spread — is cut 1's, imported.
const genSeats = (off: number): Seat[] => {
  const out: Seat[] = [];
  for (let gr = 0; gr < ROWS; gr++) {
    for (let gc = 0; gc < COLS; gc++) {
      const i = gr * COLS + gc + off;
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
};

const seatIndex = (seats: Seat[]) => {
  const at = new Int32Array(COLS * ROWS).fill(-1);
  seats.forEach((s, i) => {
    at[s.gr * COLS + s.gc] = i;
  });
  return at;
};

type Crowd = {
  dx: number; // world x offset of this box from ours
  seats: Seat[];
  at: Int32Array;
  n: number;
  jOff: number; // hash offset for its idle traffic, so the three never sync
  hackRate: number; // launches per frame at the peak
};

const L_SEATS = genSeats(10000);
const R_SEATS = genSeats(20000);

const OUR: Crowd = { dx: 0, seats: SEATS, at: SEAT_AT, n: NSEAT, jOff: 0, hackRate: 2.2 };
const NEIGHBOURS: Crowd[] = [
  { dx: -NEIGH_DX, seats: L_SEATS, at: seatIndex(L_SEATS), n: L_SEATS.length, jOff: 5000, hackRate: 1.2 },
  { dx: NEIGH_DX, seats: R_SEATS, at: seatIndex(R_SEATS), n: R_SEATS.length, jOff: 9000, hackRate: 1.2 },
];

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
    soWhenHighly: 0,
    persistent: 25,
    modelsGet: 36,
    assignedTasks: 50,
    whichSeem: 70,
    toRequire: 81,
    internetAccess: 93,
    butTheyre: 116,
    trappedInside: 122,
    isolated: 133,
    sandboxes: 144,
    theyreOf: 167,
    courseGoingTo: 177,
    tryToHackOut: 190,
    end: 215,
  },
});

// ---------------------------------------------------------------------------
// The pump. "Persistent" is the whole of this gesture: each of cut 1's five
// reaches keeps pushing at the wall it already failed to get through. Only the
// WALL end moves — it comes back off the wall by PUMP_PULL along the reach's
// own converged diagonal and then pushes out again — so the tile and its agent
// stay exactly where cut 1 left them and the reach never detaches from the tile.
//
// The rest is hashed 0-6 frames per cycle so five reaches on a 14-frame cycle
// never fall into step, and the start frames are spread across f25-36 so they
// do not begin in unison either. From the strike the cycle hardens to 9 frames
// with no rest: the same gesture, harder, and no new shape for it.
// ---------------------------------------------------------------------------
const PUMP_PULL = 36; // world px the wall end retreats at full pump
const PUMP_IN = 8;
const PUMP_OUT = 6;
const HARD_IN = 5;
const HARD_OUT = 4;
const PUMP_SPREAD = 12; // the five start frames are hashed across this window
const HACK_RAMP = 16; // frames from the first launch to the plateau rate

const pumpAt = (i: number, f: number, from: number, harden: number) => {
  const start = from + Math.floor(hash(i, 41) * PUMP_SPREAD);
  if (f < start) return 0;
  let t = start;
  for (let c = 0; c < 64; c++) {
    const hard = t >= harden;
    const inD = hard ? HARD_IN : PUMP_IN;
    const outD = hard ? HARD_OUT : PUMP_OUT;
    const rest = hard ? 0 : Math.round(hash(i * 7 + c, 42) * 6);
    const len = inD + outD + rest;
    if (f < t + len) {
      const a = f - t;
      if (a < inD) return Easing.cubic(a / inD); // shortens, ease in
      if (a < inD + outD) return 1 - Easing.out(Easing.cubic)((a - inD) / outD); // pushes back
      return 0; // rest, flat against the wall
    }
    t += len;
  }
  return 0;
};

// ---------------------------------------------------------------------------
// The strike. Cut 1's neighbour, `ConstantlyBombarding.tsx`, launches threads
// from random seats off one accumulated rate curve and lights the launching
// seat from the thread itself; this is that mechanism pointed at the wall the
// agents are already inside.
//
// A thread goes to the NEAREST POINT on its own box's wall, perpendicular to
// whichever wall that is, and its round cap ends STROKE in from the wall's
// centre line — the same rule cut 1's reaches end on, so nothing pokes through.
// The only mark of impact is a 4 px ink fleck on the wall line.
// ---------------------------------------------------------------------------
const T_DRAW = 6;
const T_HOLD = 3;
const T_FADE = 8;
const T_LIFE = T_DRAW + T_HOLD + T_FADE; // 17
const SEAT_RIPE = 14; // the launching seat is back to deep here
// The fleck is the field's own head primitive (r 4), left behind where the head
// arrives. It was drawn at r 2 first, on a literal reading of "4 px": centred on
// a 3 px white wall it is white on white and, measured at 3x on the resolved
// zoom, left no visible mark at all. At r 4 it is a bead sitting ON the wall
// line, which is what the impact needs to read as.
const FLECK_R = 4;
const FLECK_FADE = 8;

const wallHit = (x: number, y: number) => {
  const dl = x - BOX_X0;
  const dr = BOX_X1 - x;
  const dt = y - BOX_Y0;
  const db = BOX_Y1 - y;
  const m = Math.min(dl, dr, dt, db);
  if (m === dt) return { ex: x, ey: BOX_Y0 + STROKE, fx: x, fy: BOX_Y0 };
  if (m === db) return { ex: x, ey: BOX_Y1 - STROKE, fx: x, fy: BOX_Y1 };
  if (m === dl) return { ex: BOX_X0 + STROKE, ey: y, fx: BOX_X0, fy: y };
  return { ex: BOX_X1 - STROKE, ey: y, fx: BOX_X1, fy: y };
};

type Th = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  op: number;
  head: number;
};
type Fleck = { key: string; x: number; y: number; op: number };

// Cut 1's ambient traffic, verbatim in behaviour, taken as a function so all
// three crowds can run it. `jOff` shifts the hash so the three schedules are
// their own; at jOff 0 and frame + OFFSET this reproduces cut 1's threads
// exactly, which is what makes f0 the same pixels.
const idleFor = (
  f: number,
  crowd: Crowd,
  count: number,
  lit: Float32Array,
  out: Th[],
) => {
  const reach = 5;
  for (let j = 0; j < count; j++) {
    const jj = j + crowd.jOff;
    const period = 44 - 12 * hash(jj, 4);
    const local = f + hash(jj, 5) * period;
    const cycle = Math.floor(local / period);
    const phase = (local - cycle * period) / period;
    const seed = jj * 131 + cycle * 7;
    const a = Math.floor(hash(seed, 6) * crowd.n);
    const sa = crowd.seats[a];
    const bc = clampi(sa.gc + Math.round((hash(seed, 7) - 0.5) * 2 * reach), 0, COLS - 1);
    const br = clampi(sa.gr + Math.round((hash(seed, 8) - 0.5) * 2 * reach), 0, ROWS - 1);
    const b = crowd.at[br * COLS + bc];
    if (b < 0 || b === a) continue;
    const sb = crowd.seats[b];
    const dn = interpolate(phase, [0, 0.3], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const fade = interpolate(phase, [0.55, 1], [1, 0], clamp);
    if (fade <= 0.02) continue;
    lit[a] = Math.max(lit[a], fade);
    lit[b] = Math.max(lit[b], dn * fade);
    out.push({
      key: `i${jj}`,
      x1: sa.x,
      y1: sa.y,
      x2: sa.x + (sb.x - sa.x) * dn,
      y2: sa.y + (sb.y - sa.y) * dn,
      op: 0.4 * fade,
      head: dn,
    });
  }
};

const hackFor = (
  frame: number,
  f0: number,
  crowd: Crowd,
  lit: Float32Array,
  out: Th[],
  flecks: Fleck[],
) => {
  if (frame < f0) return;
  let acc = 0;
  let n = 0;
  for (let f = f0; f <= frame; f++) {
    acc += crowd.hackRate * smooth((f - f0) / HACK_RAMP);
    while (acc >= 1) {
      acc -= 1;
      const j = n++;
      const age = frame - f;
      if (age > T_LIFE) continue;
      const si = Math.floor(hash(j + crowd.jOff * 3, 71) * crowd.n);
      const s = crowd.seats[si];
      const w = wallHit(s.x, s.y);
      const dn = clamp01(age / T_DRAW); // linear: it is fire, not a drawn line
      const fade = interpolate(age, [T_DRAW + T_HOLD, T_LIFE], [1, 0], clamp);
      lit[si] = Math.max(lit[si], interpolate(age, [T_DRAW + T_HOLD, SEAT_RIPE], [1, 0], clamp));
      if (age >= T_DRAW) {
        const fop = interpolate(age, [T_DRAW, T_DRAW + FLECK_FADE], [1, 0], clamp);
        if (fop > 0.02) flecks.push({ key: `k${crowd.jOff}-${j}`, x: w.fx, y: w.fy, op: fop });
      }
      if (fade <= 0.02) continue;
      out.push({
        key: `h${j}`,
        x1: s.x,
        y1: s.y,
        x2: s.x + (w.ex - s.x) * dn,
        y2: s.y + (w.ey - s.y) * dn,
        op: 0.95 * fade,
        head: dn,
      });
    }
  }
};

const TryToHackOut: React.FC<Props> = ({
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
  // Cut 1's clock. Everything periodic reads this, so the ambient and the hand
  // on the camera carry their phase across the join.
  const F = frame + OFFSET;
  const tone = makeTone(accentDeep, accent);

  // -- our crowd's tone ------------------------------------------------------
  // The five agents under a landed tile went ripe in cut 1 and stay ripe.
  const seatTone = new Float32Array(NSEAT);
  TILES.forEach((t) => {
    seatTone[t.seat] = smooth((F - t.land) / TONE_DUR);
  });

  // -- ambient traffic, and the strike ---------------------------------------
  const lit = new Float32Array(NSEAT);
  const threadEls: Th[] = [];
  idleFor(F, OUR, idleThreadCount, lit, threadEls);

  const hackEls: Th[] = [];
  const flecks: Fleck[] = [];
  hackFor(frame, beats.tryToHackOut, OUR, lit, hackEls, flecks);

  const neighbours = NEIGHBOURS.map((c) => {
    const nlit = new Float32Array(c.n);
    const nThreads: Th[] = [];
    idleFor(F, c, idleThreads(c.n), nlit, nThreads);
    const nHack: Th[] = [];
    const nFlecks: Fleck[] = [];
    hackFor(frame, beats.tryToHackOut, c, nlit, nHack, nFlecks);
    return { c, lit: nlit, threads: nThreads, hack: nHack, flecks: nFlecks };
  });

  // -- the tasks, landed -----------------------------------------------------
  const tiles = TILES.map((t, i) => ({ key: i, x: t.x, y: t.y }));

  // -- the reaches, converged, pumping ---------------------------------------
  // Cut 1's geometry at drawn = conv = 1; only the wall end moves, back along
  // the reach's own direction.
  const lines = TILES.map((t, i) => {
    const x1 = t.x;
    const y1 = t.y - TILE_HALF;
    const conv = smooth((F - (CONV_F0 + i)) / CONV_DUR);
    const tipX = t.x + (t.tipX - t.x) * conv;
    // cut 1's endpoint at drawn = 1, written as cut 1 writes it
    const tx2 = x1 + (tipX - x1);
    const ty2 = y1 + (LINE_TIP_Y - y1);
    const dx = tx2 - x1;
    const dy = ty2 - y1;
    const L = Math.hypot(dx, dy) || 1;
    const p = pumpAt(i, frame, beats.persistent, beats.tryToHackOut) * PUMP_PULL;
    return { key: i, x1, y1, x2: tx2 - (dx / L) * p, y2: ty2 - (dy / L) * p };
  });

  // -- the internet ring, closed, with its glyph -----------------------------
  const wifiCx = RING.x;
  const wifiCy = RING.y + WIFI.dy;

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(F, TH_CAM_F, TH_CAM_CY, TH_CAM_K);
  const drift = sway(F);
  const cy = cam.cy + drift.dy;
  const cx = CENTRE_X + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const drawThread = (t: Th) => (
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
  );

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={F}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

      {/* THE NEIGHBOURS' LAYER. They carry their own copy of the one global
          shadow rather than sharing ours, and the reason is measurable: a CSS
          filter rasterises the whole sub-tree it is on, so hanging 2,000 world
          px of extra content off cut 1's layer re-rasterises cut 1's own marks
          and f0 came back at 44.5 dB instead of identical. The neighbours are
          1,100 world px away and, at the widest camera, 120 screen px clear of
          our box with a ~10 px shadow reach, so the two trees never overlap and
          two identical filters over two disjoint trees are the same pixels as
          one filter over their union. Splitting them leaves our layer's paint
          bounds exactly cut 1's. */}
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
            {/* the neighbouring sandboxes: the same box, the same material, no
                tiles and no gate. Off both frame edges until the pull-back. */}
            {neighbours.map((nb) => (
              <g key={nb.c.dx} transform={`translate(${nb.c.dx} 0)`}>
                {nb.c.seats.map((s, i) => {
                  const l = nb.lit[i];
                  const r = dotRadius * s.r * s.rs * breath(F, hash(i + nb.c.jOff, 9)) * (1 + 0.35 * l);
                  return <circle key={i} cx={s.x} cy={s.y} r={r} fill={tone(l)} opacity={dotUnread} />;
                })}
                {nb.threads.map(drawThread)}
                <g style={{ filter: icon }}>
                  <path
                    d={BOX_PATH}
                    transform={`translate(${BOX_X0} ${BOX_Y0})`}
                    fill="none"
                    stroke={ink}
                    strokeWidth={STROKE}
                    opacity={OP_READ}
                  />
                </g>
                {nb.hack.map(drawThread)}
                {nb.flecks.map((f) => (
                  <circle key={f.key} cx={f.x} cy={f.y} r={FLECK_R} fill={ink} opacity={OP_READ * f.op} />
                ))}
              </g>
            ))}
          </svg>
        </div>
      </AbsoluteFill>

      {/* OUR SANDBOX. Cut 1's layer, its tree in cut 1's order. */}
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
              {/* the gate cut 1 left dashed: its own segment of wall is masked
                  away so the solid and the dashed are never both there */}
              <mask id="th-gate" maskUnits="userSpaceOnUse" x={-400} y={-900} width={1900} height={1900}>
                <rect x={-400} y={-900} width={1900} height={1900} fill="#fff" />
                <rect x={GATE_X0} y={BOX_Y0 - 6} width={GATE_X1 - GATE_X0} height={12} fill="#000" />
              </mask>
            </defs>

            {/* our crowd */}
            {SEATS.map((s, i) => {
              const l = Math.max(lit[i], seatTone[i]);
              const r = dotRadius * s.r * s.rs * breath(F, hash(i, 9)) * (1 + 0.35 * l);
              return <circle key={i} cx={s.x} cy={s.y} r={r} fill={tone(l)} opacity={dotUnread} />;
            })}

            {/* idle traffic, head-led */}
            {threadEls.map(drawThread)}

            {/* the sandbox, with the gate masked out of its own wall */}
            <g style={{ filter: icon }}>
              <g mask="url(#th-gate)">
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
              <line
                x1={GATE_X0}
                y1={BOX_Y0}
                x2={GATE_X1}
                y2={BOX_Y0}
                stroke={ink}
                strokeWidth={STROKE}
                strokeDasharray={`${GATE_DASH} ${GATE_GAP}`}
                opacity={OP_READ}
              />
            </g>

            {/* the internet: an ink ring outside the box, closed */}
            <g style={{ filter: icon }}>
              <circle
                cx={RING.x}
                cy={RING.y}
                r={RING.r}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * RING.r}
                strokeDashoffset={0}
                opacity={OP_READ}
                transform={`rotate(-90 ${RING.x} ${RING.y})`}
              />
              <g opacity={OP_READ} fill="none" stroke={ink} strokeWidth={STROKE} strokeLinecap="round">
                {WIFI.radii.map((r) => (
                  <path
                    key={r}
                    d={`M ${wifiCx - r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)} A ${r} ${r} 0 0 1 ${wifiCx + r * Math.sin(WIFI.halfAngle)} ${wifiCy - r * Math.cos(WIFI.halfAngle)}`}
                  />
                ))}
                <circle cx={wifiCx} cy={wifiCy} r={WIFI.dot} fill={ink} stroke="none" />
              </g>
            </g>

            {/* the reaches, pumping against the wall */}
            <g style={{ filter: icon }}>
              {lines.map((l) => (
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
              ))}
            </g>

            {/* the tasks */}
            {tiles.map((t) => (
              <g key={t.key} style={{ filter: icon }}>
                <path
                  d={TILE_PATH}
                  transform={`translate(${t.x} ${t.y}) translate(${-TILE_HALF} ${-TILE_HALF})`}
                  fill={ink}
                  opacity={OP_READ}
                />
              </g>
            ))}

            {/* the strike on our own walls, and the flecks it leaves */}
            {hackEls.map(drawThread)}
            {flecks.map((f) => (
              <circle key={f.key} cx={f.x} cy={f.y} r={FLECK_R} fill={ink} opacity={OP_READ * f.op} />
            ))}
          </svg>

          {/* the OpenAI mark, tinted white, exactly where cut 1 left it */}
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

export default TryToHackOut;
