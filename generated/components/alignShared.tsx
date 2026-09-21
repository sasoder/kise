import { Img, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";
import {
  ACCENT,
  ACCENT_DEEP,
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  clamp01,
  feather,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
} from "./fieldShared";

// ---------------------------------------------------------------------------
// `Noam_Alignment` — the world the four cuts of this clip stand in.
//
// Noam Brown (OpenAI): the agents are already super aligned WITH EACH OTHER;
// can similar techniques align them WITH PEOPLE? The experiment: tell the other
// agents that the user is Agent A, and honesty and instruction following go up.
//
// Orange Dwarkesh, WITH the grid background. 24 fps, 1080x1920, opaque. Every
// value that decides how the clip LOOKS is here; a cut decides what happens.
//
// THE VOCABULARY, binding for all four cuts:
//
//   ORANGE = THE AGENTS, and nothing else. A solid comet, no stroke; its state
//     is TONE and never alpha (`AGENT_TONE`): `ACCENT_DEEP` = not tightly
//     aligned, `ACCENT` = tightly aligned right now. The links BETWEEN agents,
//     the packets on them and the eval beads the agents produce are the agents'
//     own work, so they are accent too. Nothing decorative is ever orange.
//
//   ALIGNMENT = HEADING. A comet's nose is where it is going. "Aligned with
//     each other" = parallel headings. "Aligned with a person" = a heading
//     parallel to that person's white arrow. Alignment always happens as a
//     SHORTEST-ARC rotation (`turn`), and it happens to an agent when the wave
//     travelling through the links REACHES it — order keyed on DISTANCE from
//     the source with a small hashed jitter (`waveArrival`), never on BFS hops,
//     never in unison, never off a timer.
//
//   WHITE INK = PEOPLE AND WHAT WE BUILD, at exactly two opacities: `INK_HI`
//     1.0 for the subject and `INK_LO` 0.55 for context. The USER SEAT is a
//     white station ring with `person.png` inside it and a white ARROW rising
//     from it — the arrow is what the user WANTS. Seat-to-agent links are
//     white, and they are the SAME geometry, width and packets as the agents'
//     own links: that sameness is the line's "similar techniques". Paths,
//     guides, barriers and labels are white.
//
//   FORMATION IN FLIGHT. The agents fly as a feathered superellipse blob
//     (`buildFormation`, n = 2.4 — never a box), the seat at its head.
//     Everything co-moves and the camera tracks it, so ON SCREEN the formation
//     holds and the GRID SLIDES under it (`travel` + `PARALLAX`). That slide,
//     plus per-agent wander and heading jitter, plus packets on live links,
//     plus marching dashes, is the motion floor: no frame of any cut is still.
//
// ---------------------------------------------------------------------------
export const FPS = 24;

export const TWO_PI = Math.PI * 2;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// --- ink --------------------------------------------------------------------
export const INK = "#FFFFFF";
export const INK_HI = 1.0; // the subject
export const INK_LO = 0.55; // context

/** deep -> ripe. An agent's state is this ramp, never its alpha. */
export const AGENT_TONE = makeTone(ACCENT_DEEP, ACCENT);

// --- the resting zoom -------------------------------------------------------
// Every length in this clip is written as SCREEN px at K_WIDE and divided by
// the live k through `worldPx`, so a stroke is the same weight at every zoom in
// every cut.
//
// K_WIDE is SOLVED, then rounded down. The set's resting composition is the
// formation blob (BLOB_RX x BLOB_RY world px, i.e. 700 x 620 screen px at k 1)
// with the user seat SEAT_GAP above its centre and the arrow reaching
// ARROW_LEN_PX beyond that, against the caption-safe band (screen x 110..970,
// y 200..1400):
//     width  = 2 * BLOB_RX + DOT_D_PX            = 716  -> 860 / 716  = 1.201
//     height = ARROW_LEN_PX + SEAT_GAP + BLOB_RY = 1080 -> 1200 / 1080 = 1.111
// so the fit is 1.111 on the tighter axis. It is fixed at 1.0 instead, which
// leaves 10% of headroom for the things the box above does not contain — the
// feathered edge's outliers, the +-4 px wander, a packet mid-flight on a white
// link — and makes world px and screen px the same number at rest, so the four
// cuts cannot drift apart in arithmetic. Every cut opens closer than this and
// resolves at or near it.
export const K_WIDE = 1.0;

export const worldPx = (px: number, k: number = K_WIDE) => px / k;

// --- sizes, as SCREEN px at K_WIDE ------------------------------------------
export const DOT_D_PX = 16; // an agent comet's body diameter
export const STROKE_PX = 6.5; // rings, arrows, paths — ONE weight
export const THREAD_PX = 3.25; // a link: half stroke, both kinds
export const PACKET_R_PX = 4.5; // a packet on a link
export const PERSON_H_PX = 118; // person.png's box (its ink is 0.84 of it)
export const SEAT_R_PX = 78; // the user seat's ring radius
/** The arrow rising from the seat, measured from the RING CENTRE to the TIP —
 *  so ~152 px of it is visible outside the ring, which at STROKE_PX with a head
 *  reads as an arrow rather than as a tick. Measuring it from the ring's EDGE
 *  instead would put its tip 78 px higher and there is no framing of the seat
 *  and the blob together that then keeps the tip inside the caption-safe band. */
export const ARROW_LEN_PX = 230;
export const LABEL_PX = 40; // a Söhne label's size
export const BEAD_R_PX = 9; // an eval bead
/** Agent A — the one the others are told is the user — is drawn this much
 *  bigger than its neighbours, so it is the same object one size up rather than
 *  a new one. */
export const AGENT_A_SCALE = 1.35;

export const DOT_R = worldPx(DOT_D_PX) / 2;
export const STROKE_W = worldPx(STROKE_PX);
export const THREAD_W = worldPx(THREAD_PX);
export const PACKET_R = worldPx(PACKET_R_PX);
export const PERSON_H = worldPx(PERSON_H_PX);
export const SEAT_R = worldPx(SEAT_R_PX);
export const ARROW_LEN = worldPx(ARROW_LEN_PX);
export const BEAD_R = worldPx(BEAD_R_PX);

// --- the blob, and where the seat sits above it -----------------------------
/** The formation at rest: 700 x 620 SCREEN px at K_WIDE. */
export const BLOB_RX = worldPx(350);
export const BLOB_RY = worldPx(310);
/** The superellipse's exponent. 2.4 is the set's fleet shape: rounder than an
 *  ellipse at the shoulders, never a box. */
export const BLOB_N = 2.4;
/** The user seat's centre, above the blob's centre, in world px. */
export const SEAT_GAP = worldPx(540);

// --- dashes, for anything that marches --------------------------------------
export const DASH_ON_PX = 26;
export const DASH_OFF_PX = 18;
export const MARCH_PX_PER_F = 0.6;
export const DASH_ON = worldPx(DASH_ON_PX);
export const DASH_OFF = worldPx(DASH_OFF_PX);
export const MARCH_W = worldPx(MARCH_PX_PER_F);

// --- headings ---------------------------------------------------------------
/** The user's arrow points STRAIGHT UP, so this is the heading an agent
 *  aligned with the person is pointing along. World y is down. */
export const H_USER = -Math.PI / 2;

/** The shortest signed arc from a to b, in (-pi, pi]. */
export const arcTo = (a: number, b: number) => {
  let d = b - a;
  while (d > Math.PI) d -= TWO_PI;
  while (d < -Math.PI) d += TWO_PI;
  return d;
};

/** a, rotated the SHORT way toward b by t in 0..1. Every alignment in the clip
 *  goes through this: turning 190 degrees the long way round reads as a stunt. */
export const turn = (a: number, b: number, t: number) => a + arcTo(a, b) * clamp01(t);

// ---------------------------------------------------------------------------
// THE COMET. A dot and its tail are ONE path — the two sides of the tail are
// the TANGENT LINES from the tip back to the body, so the outline has no
// shoulder where they meet and the shape reads as a body with a wake instead of
// a map pin. Lifted from `GoodTrajectory`, which is the approved construction:
//
//   tip T at distance L = tipMul * 2r from the centre, opposite the heading
//   the tangent point is at phi = acos(r / L) off the centre->tip axis
//   outline: P1 -> the MAJOR arc round the FRONT of the body -> P2 -> T -> close
//
// L is driven by STATE, never by a measured velocity, so a comet's tail cannot
// flicker when its frame-to-frame speed dips.
// ---------------------------------------------------------------------------
export const TIP_LOOSE = 1.6; // x diameter: an agent not tightly aligned
export const TIP_TIGHT = 2.6; // x diameter: an agent aligned right now

export const cometPath = (
  x: number,
  y: number,
  heading: number,
  r: number,
  tipMul: number = TIP_TIGHT,
): string | null => {
  if (r < 0.05) return null;
  const L = 2 * r * tipMul;
  if (L <= r * 1.05) return null;
  const ux = -Math.cos(heading);
  const uy = -Math.sin(heading);
  const nx = -uy;
  const ny = ux;
  const cp = r / L;
  const sp = Math.sqrt(1 - cp * cp);
  const n = (v: number) => v.toFixed(2);
  const p1x = x + r * (cp * ux + sp * nx);
  const p1y = y + r * (cp * uy + sp * ny);
  const p2x = x + r * (cp * ux - sp * nx);
  const p2y = y + r * (cp * uy - sp * ny);
  return (
    `M${n(p1x)} ${n(p1y)} A${n(r)} ${n(r)} 0 1 1 ${n(p2x)} ${n(p2y)} ` +
    `L${n(x + ux * L)} ${n(y + uy * L)} Z`
  );
};

export const Comet: React.FC<{
  x: number;
  y: number;
  heading: number;
  r?: number;
  /** 0 = ACCENT_DEEP and a short tail, 1 = ACCENT and a long one. */
  tone?: number;
  tipMul?: number;
  opacity?: number;
}> = ({ x, y, heading, r = DOT_R, tone = 0, tipMul, opacity = 1 }) => {
  const t = clamp01(tone);
  const d = cometPath(x, y, heading, r, tipMul ?? lerp(TIP_LOOSE, TIP_TIGHT, t));
  return d ? <path d={d} fill={AGENT_TONE(t)} opacity={opacity} /> : null;
};

// ---------------------------------------------------------------------------
// THE LINK. The clip's whole argument is that ONE technique is being pointed at
// two different things, so an agent-to-agent link and a seat-to-agent link are
// the SAME object: same width, same dash, same packet period, same speed, same
// geometry. Only the COLOUR differs — accent (the agents' own) or white (ours).
// If you find yourself giving the white one a different shape, the cut has
// stopped making the point.
//
// `live` 0..1 is the link's state, not a switch: it ramps the opacity from idle
// to lit and it ramps the packet traffic with it, so a link that lights because
// the wave reached it lights continuously.
// ---------------------------------------------------------------------------
export const LINK_IDLE = 0.4;
export const LINK_LIVE = 0.95;
export const PACKET_PERIOD = 15; // frames between launches on one link
export const PACKET_SPEED = 14; // world px/frame
/** An idle link's period is this multiple of a live one's. 1.6 puts roughly 25
 *  packets in flight across a 150-link formation at any frame — sparse (one
 *  link in six) and still a real part of the motion floor. At 2.2 it was 18,
 *  and measured on cut 1 the held frames read as still. */
export const PACKET_IDLE_MUL = 1.6;
const SPEED_CAP_SCREEN = 45;

/** Every packet in flight on `from -> to` at `frame`. Pure and derived from the
 *  geometry, so it retimes with the link and never needs its own clock. */
export const linkPackets = ({
  frame,
  k,
  from,
  to,
  period = PACKET_PERIOD,
  speed = PACKET_SPEED,
  phase = 0,
}: {
  frame: number;
  k: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  period?: number;
  speed?: number;
  phase?: number;
}): { x: number; y: number; u: number }[] => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy);
  if (len <= 0 || period <= 0) return [];
  const v = Math.min(speed, SPEED_CAP_SCREEN / Math.max(k, 1e-4));
  const travel = len / v;
  const out: { x: number; y: number; u: number }[] = [];
  const nMax = Math.floor((frame - phase) / period);
  const nMin = Math.ceil((frame - phase - travel) / period);
  for (let n = nMin; n <= nMax; n++) {
    const t = frame - (phase + n * period);
    if (t < 0 || t > travel) continue;
    const u = t / travel;
    out.push({ x: from.x + dx * u, y: from.y + dy * u, u });
  }
  return out;
};

export const Link: React.FC<{
  frame: number;
  k: number;
  kind: "agent" | "seat";
  from: { x: number; y: number };
  to: { x: number; y: number };
  /** 0 = idle, 1 = lit. Continuous. */
  live?: number;
  /** 0..1: the link drawing on from `from`. */
  progress?: number;
  packets?: boolean;
  period?: number;
  phase?: number;
  width?: number;
  /** multiplies the whole link, for a cut that has to recede one. */
  opacity?: number;
}> = ({
  frame,
  k,
  kind,
  from,
  to,
  live = 0,
  progress = 1,
  packets = true,
  period = PACKET_PERIOD,
  phase = 0,
  width = THREAD_W,
  opacity = 1,
}) => {
  const p = clamp01(progress);
  if (p <= 0) return null;
  const lv = clamp01(live);
  const colour = kind === "agent" ? ACCENT : INK;
  const tip = { x: lerp(from.x, to.x, p), y: lerp(from.y, to.y, p) };
  // The traffic ramps with `live`: idle links carry a sparse stream, a lit one
  // carries it at full rate. The period is what changes, not a visibility flag,
  // so nothing about a link ever pops.
  const per = period * lerp(PACKET_IDLE_MUL, 1, lv);
  const pk =
    packets && p >= 1 ? linkPackets({ frame, k, from, to, period: per, phase }) : [];
  const op = opacity * lerp(LINK_IDLE, LINK_LIVE, lv);
  return (
    <g opacity={op}>
      <line
        x1={from.x}
        y1={from.y}
        x2={tip.x}
        y2={tip.y}
        stroke={colour}
        strokeWidth={width}
        strokeLinecap="round"
      />
      {pk.map((q, i) => (
        <circle key={`p${i}`} cx={q.x} cy={q.y} r={PACKET_R} fill={colour} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FORMATION. Seats in FORMATION-LOCAL coordinates: the origin is the blob's
// centre and -y is the HEAD, so a formation flying at heading h is the same
// seats rotated by `h - H_USER` (`formationAt`).
//
// The shape is a superellipse |x/rx|^n + |y/ry|^n <= 1 at n = BLOB_N, populated
// from a jittered lattice, FEATHERED at the edge (the chance a seat exists and
// its radius both fall off, radius to 0.6x), then RELAXED until no two centres
// are closer than SEP_K mean radii. A jittered lattice alone puts pairs on top
// of each other and two comets a few px apart do not read as two comets: they
// fuse into one lumpy body. The relaxation is deterministic — fixed pass count,
// fixed order, no randomness — and it relaxes the SEATS, which is the thing the
// whole clip is made of; the wander is a small offset on top.
//
// Every seat also carries its own hashed WANDER phases and a heading-jitter
// phase, so the blob is alive on every frame without anything being keyed.
// ---------------------------------------------------------------------------
export type Seat = {
  /** formation-local, origin = blob centre, -y = the head */
  x: number;
  y: number;
  /** radius, already tapered by the feather */
  r: number;
  /** r / DOT_R */
  rs: number;
  /** the feather at this seat: 1 deep inside, -> 0 at the edge */
  f: number;
  /** hashed wander phases and a heading-jitter phase */
  wpx: number;
  wpy: number;
  wpa: number;
  /** hashed per-agent multipliers: wander amplitude, rotation frames */
  wamp: number;
  rotF: number;
  /** a stable index, for anything that needs its own hash */
  i: number;
};

export type Formation = {
  seats: Seat[];
  /** unordered pairs of seat indices; 2-3 nearest neighbours, deduped */
  links: [number, number][];
  rx: number;
  ry: number;
  /** distance from a formation-local point to every seat, and each seat's rank
   *  by that distance (0 = nearest). The clip's waves are keyed on THIS, never
   *  on link hops. */
  distFrom: (p: { x: number; y: number }) => { dist: number[]; rank: number[] };
};

/** No two seats closer than this many mean radii. 3.0 leaves a full body of
 *  space between neighbours, which is what keeps a 90-comet blob reading as 90
 *  comets at k 1. */
export const SEP_K = 3.0;
const SEP_RELAX = 0.6;
const SEP_PASSES = 40;
/** Cells of falloff at the blob's edge. */
const FEATHER_W = 2.6;
/** The radius a seat out at the feathered edge tapers to. */
const EDGE_TAPER = 0.6;

/** The superellipse's value at a local point: <= 1 is inside. */
export const blobAt = (x: number, y: number, rx: number, ry: number) =>
  Math.pow(Math.abs(x / rx), BLOB_N) + Math.pow(Math.abs(y / ry), BLOB_N);

export const buildFormation = ({
  n,
  seed = 0,
  rx = BLOB_RX,
  ry = BLOB_RY,
}: {
  n: number;
  seed?: number;
  rx?: number;
  ry?: number;
}): Formation => {
  // -- the lattice, feathered -------------------------------------------------
  // The cell is sized so the lattice offers comfortably more candidates than
  // `n`, and the exact count is then taken by hashed rank WEIGHTED BY THE
  // FEATHER, so the count is a fact and the shape is still the feather's.
  const area = Math.PI * rx * ry * 0.92; // the superellipse's, near enough
  const cell = Math.sqrt(area / (n * 1.55));
  type Cand = { x: number; y: number; f: number; i: number };
  const cands: Cand[] = [];
  const cols = Math.ceil((2 * rx) / cell) + 2;
  const rows = Math.ceil((2 * ry) / cell) + 2;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const i = (c * rows + r) * 7 + seed * 104729;
      const x = -rx - cell / 2 + c * cell + (hash(i, 11) - 0.5) * cell * 0.9;
      const y = -ry - cell / 2 + r * cell + (hash(i, 12) - 0.5) * cell * 0.9;
      const v = blobAt(x, y, rx, ry);
      // signed distance to the boundary, in cells: the superellipse's value
      // converted to a radial fraction and scaled by the local radius
      const rad = Math.hypot(x, y);
      const edge = rad <= 1e-6 ? rx : rad / Math.max(1e-6, Math.pow(v, 1 / BLOB_N));
      const f = feather((edge - rad) / cell + 0.5, FEATHER_W);
      if (f <= 0) continue;
      cands.push({ x, y, f, i });
    }
  }
  cands.sort((a, b) => hash(a.i, 71) / a.f - hash(b.i, 71) / b.f);
  const seats: Seat[] = cands.slice(0, Math.min(n, cands.length)).map((c) => {
    const rs = (0.86 + 0.28 * hash(c.i, 13)) * (EDGE_TAPER + (1 - EDGE_TAPER) * c.f);
    return {
      x: c.x,
      y: c.y,
      r: DOT_R * rs,
      rs,
      f: c.f,
      wpx: hash(c.i, 21) * TWO_PI,
      wpy: hash(c.i, 22) * TWO_PI,
      wpa: hash(c.i, 23) * TWO_PI,
      wamp: 0.6 + 0.8 * hash(c.i, 24),
      rotF: 8 + 5 * hash(c.i, 25),
      i: c.i,
    };
  });

  // -- the minimum-separation pass -------------------------------------------
  seats.sort((a, b) => a.x - b.x);
  for (let pass = 0; pass < SEP_PASSES; pass++) {
    let moved = 0;
    for (let i = 0; i < seats.length; i++) {
      for (let j = i + 1; j < seats.length; j++) {
        if (seats[j].x - seats[i].x > 4 * cell) break; // sorted by x
        const dx = seats[j].x - seats[i].x;
        const dy = seats[j].y - seats[i].y;
        const dist = Math.hypot(dx, dy);
        const need = SEP_K * 0.5 * (seats[i].r + seats[j].r);
        if (dist >= need || dist < 1e-6) continue;
        const push = ((need - dist) / 2) * SEP_RELAX;
        const ex = dx / dist;
        const ey = dy / dist;
        seats[i].x -= ex * push;
        seats[i].y -= ey * push;
        seats[j].x += ex * push;
        seats[j].y += ey * push;
        moved++;
      }
    }
    if (moved === 0) break;
    seats.sort((a, b) => a.x - b.x);
  }
  // The head comes first, so a cut that wants "the five front agents" can take
  // `seats.slice(0, 5)` and mean it.
  seats.sort((a, b) => a.y - b.y);

  // -- the links -------------------------------------------------------------
  // 2-3 nearest neighbours each, deduped, and NONE THAT CROSSES THE BLOB'S
  // OUTSIDE: two seats on opposite sides of a concave stretch of the feathered
  // edge would otherwise be joined by a line that leaves the crowd and comes
  // back, which reads as a stray wire rather than as a link. The test is the
  // midpoint's own superellipse value.
  const key = (a: number, b: number) => (a < b ? `${a}:${b}` : `${b}:${a}`);
  const seen = new Set<string>();
  const links: [number, number][] = [];
  const MAX_LEN = 3.6 * cell;
  seats.forEach((s, i) => {
    const near = seats
      .map((t, j) => ({ j, d: Math.hypot(t.x - s.x, t.y - s.y) }))
      .filter((q) => q.j !== i && q.d <= MAX_LEN)
      .sort((a, b) => a.d - b.d);
    const want = 2 + (hash(s.i, 33) < 0.5 ? 1 : 0);
    let taken = 0;
    for (const q of near) {
      if (taken >= want) break;
      const t = seats[q.j];
      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2;
      if (blobAt(mx, my, rx, ry) > 1.06) continue; // it would bow outside
      const kk = key(i, q.j);
      if (seen.has(kk)) {
        taken++;
        continue;
      }
      seen.add(kk);
      links.push([i, q.j]);
      taken++;
    }
  });

  const distFrom = (p: { x: number; y: number }) => {
    const dist = seats.map((s) => Math.hypot(s.x - p.x, s.y - p.y));
    const order = dist.map((_, i) => i).sort((a, b) => dist[a] - dist[b]);
    const rank = new Array<number>(dist.length);
    order.forEach((i, r) => {
      rank[i] = r;
    });
    return { dist, rank };
  };

  return { seats, links, rx, ry, distFrom };
};

/** A formation-local point placed in the world: the blob at `centre` flying at
 *  `heading`, with -y local pointing along that heading. */
export const formationAt = (
  p: { x: number; y: number },
  centre: { x: number; y: number },
  heading: number,
) => {
  const a = heading - H_USER;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: centre.x + p.x * c - p.y * s, y: centre.y + p.x * s + p.y * c };
};

// ---------------------------------------------------------------------------
// THE WANDER. Per agent, hashed, slow, and never off. It is the reason the blob
// is alive on a held frame: +-WANDER_PX of slow drift on each axis and
// +-JITTER_DEG of heading noise, all on the seat's own phases at its own
// amplitude. Nothing about it is keyed and nothing about it ever stops.
// ---------------------------------------------------------------------------
export const WANDER_PX = 3.5;
export const JITTER_DEG = 3;
export const WANDER_RATE = 0.055;
export const JITTER_RATE = 0.041;

export const wanderOf = (s: Seat, f: number) => ({
  dx: worldPx(WANDER_PX) * s.wamp * Math.sin(f * WANDER_RATE + s.wpx),
  dy: worldPx(WANDER_PX) * s.wamp * Math.sin(f * WANDER_RATE * 1.21 + s.wpy),
  da: ((JITTER_DEG * Math.PI) / 180) * s.wamp * Math.sin(f * JITTER_RATE + s.wpa),
});

// ---------------------------------------------------------------------------
// THE WAVE. An alignment reaches an agent when the thing travelling through the
// links gets to it, and "gets to it" is DISTANCE from the source plus a small
// hashed jitter — never a BFS hop count (which quantises the crowd into visible
// shells), never a timer, never unison.
//
// `waveArrival(dist, i, f0, speed, jitter)` is the frame that agent's turn
// starts. `speed` is world px per frame of wave travel.
// ---------------------------------------------------------------------------
export const waveArrival = (
  dist: number,
  i: number,
  f0: number,
  speed: number,
  jitter: number,
) => f0 + dist / speed + (hash(i, 61) - 0.5) * 2 * jitter;

// ---------------------------------------------------------------------------
// THE GRID SLIDE. Everything in a cut co-moves and the camera tracks it, so on
// screen the formation HOLDS. What has to move is the ground: the whole world
// travels along the formation's mean heading at SLIDE_V world px/frame, and the
// grid — which sits at PARALLAX of the camera — therefore slides under the held
// formation at PARALLAX * SLIDE_V ~= 2.6 screen px/frame at k 1, which is the
// briefed 2-3 px/frame. (The set's usual 0.15 parallax against a 2.6 px/frame
// travel gives 0.4 px/frame, which is not a slide, it is a rounding error; and
// the camera's lateral travel here is small enough that 0.32 never pulls a
// background edge in at BG_OVERSIZE 1.8 — checked per cut.)
//
// `travel(f, headingAt)` integrates it: the world offset at frame f, given the
// mean heading at each frame. Add it to the formation's anchor AND to the
// camera's centre, and the two cannot drift apart.
// ---------------------------------------------------------------------------
export const SLIDE_V = 8.0; // world px/frame
export const PARALLAX = 0.32;

export const travel = (f: number, headingAt: (f: number) => number) => {
  let x = 0;
  let y = 0;
  const n = Math.max(0, Math.round(f));
  for (let i = 1; i <= n; i++) {
    const h = headingAt(i - 0.5);
    x += Math.cos(h) * SLIDE_V;
    y += Math.sin(h) * SLIDE_V;
  }
  return { x, y };
};

// ---------------------------------------------------------------------------
// TYPE. Söhne Kraftig, vendored, loaded at module scope so a font failure
// surfaces before a frame is drawn. White, lowercase except "A" — the label is
// a caption on a thing, not a title.
//
// TEXT NEVER POPS: a label slides up LABEL_RISE px while fading in over
// LABEL_IN frames. `Label` is a DOM element, so it goes in the world <div>
// beside the <svg>, never inside it.
// ---------------------------------------------------------------------------
export const FONT_LABEL = "SohneKraftigAL";
loadFont({ family: FONT_LABEL, url: staticFile("Sohne-Kraftig.otf"), weight: "600" });

export const LABEL_SIZE = worldPx(LABEL_PX);
export const LABEL_RISE_PX = 24;
export const LABEL_IN = 10;

export const labelIn = (frame: number, f0: number) =>
  smoothstep(clamp01((frame - f0) / LABEL_IN));

export const Label: React.FC<{
  k: number;
  x: number;
  y: number;
  text: string;
  /** the frame it starts sliding up on */
  f0?: number;
  frame?: number;
  /** or drive it directly, 0..1 */
  inT?: number;
  size?: number;
  opacity?: number;
  align?: "center" | "left";
}> = ({
  k,
  x,
  y,
  text,
  f0 = 0,
  frame = 0,
  inT,
  size = LABEL_SIZE,
  opacity = INK_HI,
  align = "center",
}) => {
  const t = inT === undefined ? labelIn(frame, f0) : clamp01(inT);
  if (t <= 0) return null;
  const rise = worldPx(LABEL_RISE_PX) * (1 - t);
  return (
    <div
      style={{
        position: "absolute",
        left: align === "center" ? x - 600 : x,
        top: y + rise,
        width: align === "center" ? 1200 : undefined,
        textAlign: align === "center" ? "center" : "left",
        fontFamily: FONT_LABEL,
        fontSize: size,
        lineHeight: 1,
        color: INK,
        opacity: opacity * t,
        whiteSpace: "nowrap",
        filter: iconShadow(k),
      }}
    >
      {text}
    </div>
  );
};

// ---------------------------------------------------------------------------
// THE USER SEAT. A white station ring with `person.png` inside it and a white
// ARROW rising straight up out of it: the ring is the seat, the person is who
// is in it, the arrow is WHAT THEY WANT. `occupant` swaps the person for an
// agent comet — which is the whole experiment in cut 3, "tell the other agents
// that the user is Agent A": the same seat, the same arrow, a different thing
// sitting in it.
//
// It renders a DOM wrapper (person.png must be a Remotion <Img>, never an SVG
// <image> on staticFile, which races frame capture), so it goes in the world
// <div>, not the world <svg>.
// ---------------------------------------------------------------------------
export const SeatArrow: React.FC<{
  k: number;
  cx: number;
  cy: number;
  /** 0..1: the arrow growing out of the ring */
  grow?: number;
  heading?: number;
  len?: number;
  opacity?: number;
}> = ({ k, cx, cy, grow = 1, heading = H_USER, len = ARROW_LEN, opacity = INK_HI }) => {
  const g = clamp01(grow);
  if (g <= 0) return null;
  const ux = Math.cos(heading);
  const uy = Math.sin(heading);
  const x0 = cx + ux * SEAT_R * 0.92;
  const y0 = cy + uy * SEAT_R * 0.92;
  const L = (len - SEAT_R * 0.92) * g;
  const x1 = x0 + ux * L;
  const y1 = y0 + uy * L;
  const head = STROKE_W * 3.1;
  const a = heading + Math.PI * 0.82;
  const b = heading - Math.PI * 0.82;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <line
        x1={x0}
        y1={y0}
        x2={x1}
        y2={y1}
        stroke={INK}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
      />
      {g > 0.45 ? (
        <path
          d={
            `M${(x1 + Math.cos(a) * head).toFixed(2)} ${(y1 + Math.sin(a) * head).toFixed(2)} ` +
            `L${x1.toFixed(2)} ${y1.toFixed(2)} ` +
            `L${(x1 + Math.cos(b) * head).toFixed(2)} ${(y1 + Math.sin(b) * head).toFixed(2)}`
          }
          fill="none"
          stroke={INK}
          strokeWidth={STROKE_W}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={clamp01((g - 0.45) / 0.3)}
        />
      ) : null}
    </g>
  );
};

export const UserSeat: React.FC<{
  k: number;
  x: number;
  y: number;
  frame: number;
  occupant?: "person" | "agent" | "none";
  /** 0..1: the arrow rising out of the ring */
  arrow?: number;
  /** 0..1: the ring drawing on, clockwise from the top */
  ringDraw?: number;
  r?: number;
  label?: string;
  labelF0?: number;
  /** the occupant agent's tone and heading, when `occupant` is "agent" */
  agentTone?: number;
  agentHeading?: number;
  agentScale?: number;
  opacity?: number;
}> = ({
  k,
  x,
  y,
  frame,
  occupant = "person",
  arrow = 1,
  ringDraw = 1,
  r = SEAT_R,
  label,
  labelF0 = 0,
  agentTone = 1,
  agentHeading = H_USER,
  agentScale = AGENT_A_SCALE,
  opacity = INK_HI,
}) => {
  const d = clamp01(ringDraw);
  if (d <= 0) return null;
  const pad = r + ARROW_LEN + STROKE_W * 4;
  const a0 = -Math.PI / 2;
  const a1 = a0 + TWO_PI * d;
  const large = TWO_PI * d > Math.PI ? 1 : 0;
  const ring =
    d >= 0.999
      ? `M${(pad - r).toFixed(2)} ${pad.toFixed(2)} a${r.toFixed(2)} ${r.toFixed(
          2,
        )} 0 1 0 ${(2 * r).toFixed(2)} 0 a${r.toFixed(2)} ${r.toFixed(2)} 0 1 0 ${(
          -2 * r
        ).toFixed(2)} 0`
      : `M${(pad + Math.cos(a0) * r).toFixed(2)} ${(pad + Math.sin(a0) * r).toFixed(2)} ` +
        `A${r.toFixed(2)} ${r.toFixed(2)} 0 ${large} 1 ${(pad + Math.cos(a1) * r).toFixed(
          2,
        )} ${(pad + Math.sin(a1) * r).toFixed(2)}`;
  return (
    <>
      {occupant === "person" ? (
        <Img
          src={staticFile("person.png")}
          style={{
            position: "absolute",
            left: x - PERSON_H / 2,
            top: y - PERSON_H / 2,
            width: PERSON_H,
            height: PERSON_H,
            opacity,
            filter: `brightness(0) invert(1) ${iconShadow(k)}`,
          }}
        />
      ) : null}
      <svg
        width={2 * pad}
        height={2 * pad}
        viewBox={`0 0 ${2 * pad} ${2 * pad}`}
        style={{ position: "absolute", left: x - pad, top: y - pad, overflow: "visible" }}
      >
        <g style={{ filter: iconShadow(k) }}>
          <path
            d={ring}
            fill="none"
            stroke={INK}
            strokeWidth={STROKE_W}
            strokeLinecap="round"
            opacity={opacity}
          />
        </g>
        {occupant === "agent" ? (
          <Comet
            x={pad}
            y={pad}
            heading={agentHeading}
            r={DOT_R * agentScale}
            tone={agentTone}
          />
        ) : null}
        <SeatArrow k={k} cx={pad} cy={pad} grow={arrow} opacity={opacity} />
      </svg>
      {label ? (
        <Label
          k={k}
          x={x}
          y={y + r + worldPx(34)}
          text={label}
          f0={labelF0}
          frame={frame}
          opacity={opacity * INK_LO}
        />
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// THE EVAL COLUMN. "honesty and instruction following go up" — a score, and the
// only honest way to draw a score going up in this vocabulary is to STACK what
// the agents produced on top of what was there before. So: rows of three beads,
// the BEFORE rows hollow and white at INK_LO (that is what we measured, it is
// ours), and the AFTER rows solid ACCENT stacking up on top of them (the agents
// made those). A row lands one bead at a time on its own hashed frame, each one
// sliding up EVAL_RISE px while it fades in — beads never pop either.
//
// The label sits centred under the baseline tick, lowercase, INK_LO.
// ---------------------------------------------------------------------------
export const EVAL_COLS = 3;
export const EVAL_ROW_H = worldPx(30);
export const EVAL_COL_W = worldPx(30);
export const EVAL_RISE = worldPx(18);
export const EVAL_BEAD_IN = 7; // frames for one bead to arrive
export const EVAL_BEAD_STEP = 2.2; // frames between beads within a row
export const EVAL_ROW_STEP = 5; // frames between rows

/** The number of SOLID rows standing at frame f: rows arrive one after another
 *  from `f0`, and the count is continuous so a cut can read a part-built row. */
export const evalRowsAt = (f: number, f0: number, rows: number) =>
  clamp01((f - f0) / Math.max(1e-6, rows * EVAL_ROW_STEP)) * rows;

export const EvalColumn: React.FC<{
  k: number;
  x: number;
  /** the BASELINE's y: hollow rows sit below it, solid rows stack above. */
  y: number;
  frame: number;
  label?: string;
  labelF0?: number;
  /** rows of the score that was already there */
  rowsHollow: number;
  /** rows the agents added, continuous — use `evalRowsAt` */
  rowsSolid: number;
  seed?: number;
  opacity?: number;
}> = ({
  k,
  x,
  y,
  frame,
  label,
  labelF0 = 0,
  rowsHollow,
  rowsSolid,
  seed = 0,
  opacity = 1,
}) => {
  const cols = EVAL_COLS;
  const w = (cols - 1) * EVAL_COL_W;
  const beads: React.ReactNode[] = [];
  const put = (row: number, solid: boolean, t: number) => {
    for (let c = 0; c < cols; c++) {
      const bt = clamp01((t - c * EVAL_BEAD_STEP * (1 / EVAL_BEAD_IN)) / 1);
      const a = smoothstep(bt);
      if (a <= 0) continue;
      const bx = x - w / 2 + c * EVAL_COL_W;
      const by = (solid ? y - (row + 1) * EVAL_ROW_H : y + (row + 0.5) * EVAL_ROW_H) +
        EVAL_RISE * (1 - a);
      beads.push(
        solid ? (
          <circle
            key={`s${row}-${c}`}
            cx={bx}
            cy={by}
            r={BEAD_R}
            fill={ACCENT}
            opacity={opacity * a}
          />
        ) : (
          <circle
            key={`h${row}-${c}`}
            cx={bx}
            cy={by}
            r={BEAD_R - STROKE_W * 0.35}
            fill="none"
            stroke={INK}
            strokeWidth={STROKE_W * 0.7}
            opacity={opacity * INK_LO * a}
          />
        ),
      );
    }
  };
  for (let r = 0; r < rowsHollow; r++) put(r, false, 1);
  const full = Math.floor(rowsSolid);
  for (let r = 0; r < full; r++) put(r, true, 1);
  const partial = rowsSolid - full;
  if (partial > 0) {
    // the row being built: its beads land on their own frames, and `partial` is
    // where the row is, so the arrival is continuous and retimes with the cut
    for (let c = 0; c < cols; c++) {
      // each bead on its own hashed frame within the row, off the column's seed
      const a = smoothstep(clamp01(partial * cols - c - 0.22 * hash(seed * 13 + c, 44)));
      if (a <= 0) continue;
      const bx = x - w / 2 + c * EVAL_COL_W;
      const by = y - (full + 1) * EVAL_ROW_H + EVAL_RISE * (1 - a);
      beads.push(
        <circle
          key={`p${c}`}
          cx={bx}
          cy={by}
          r={BEAD_R}
          fill={ACCENT}
          opacity={opacity * a}
        />,
      );
    }
  }
  // the baseline tick, ours, white: what the score was before anything moved
  const tick = w / 2 + EVAL_COL_W * 0.45;
  return (
    <>
      <g style={{ filter: iconShadow(k) }}>
        <line
          x1={x - tick}
          y1={y}
          x2={x + tick}
          y2={y}
          stroke={INK}
          strokeWidth={STROKE_W * 0.55}
          strokeLinecap="round"
          opacity={opacity * INK_LO}
        />
      </g>
      {beads}
      {label ? (
        <text
          x={x}
          y={y + Math.max(1, rowsHollow) * EVAL_ROW_H + LABEL_SIZE * 1.25}
          textAnchor="middle"
          fill={INK}
          opacity={opacity * INK_LO * labelIn(frame, labelF0)}
          style={{ fontFamily: FONT_LABEL, fontSize: LABEL_SIZE * 0.8 }}
          transform={`translate(0 ${(EVAL_RISE * (1 - labelIn(frame, labelF0))).toFixed(2)})`}
        >
          {label}
        </text>
      ) : null}
    </>
  );
};

/** A column's own hash, for a cut that wants a second thing keyed off the same
 *  seed the beads are (a tick's length, a label's lag). */
export const evalSeedOf = (seed: number) => hash(seed, 91);

// ---- added by AlignedWithPeople -------------------------------------------
// THE CAMERA, for all four cuts: knots on ONE monotone cubic Hermite
// (Fritsch-Carlson tangents, so a track can never overshoot a knot and
// reverse), sampled to one key per frame, through the shared damper with the
// shared constants. Three channels, because every cut of this clip pans as well
// as zooms — `camMove` has two. Lifted from `trapShared`, which is where the
// construction was approved; it lives here so this clip has one camera and
// importing it does not drag another clip's whole world in.
//
// This is an ADDITION: nothing above it moved.
export const hermite = (xs: number[], ys: number[]) => {
  const n = xs.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const h = a * a + b * b;
    if (h > 9) {
      const t = 3 / Math.sqrt(h);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x: number) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * ys[i] +
      (t3 - 2 * t2 + t) * h * m[i] +
      (-2 * t3 + 3 * t2) * ys[i + 1] +
      (t3 - t2) * h * m[i + 1]
    );
  };
};

export type CamKnot = { f: number; k: number; x: number; y: number };

/** One key per frame from f = 0 to `last`, off the Hermite through `knots`. CY
 *  is taken off that frame's own k (cy = y + CAM_LIFT / k) so the framing and
 *  the zoom settle together instead of the composition sagging through a move. */
export const camKnots3 = (knots: CamKnot[], last: number) => {
  const kf = knots.map((n) => n.f);
  const kOf = hermite(
    kf,
    knots.map((n) => n.k),
  );
  const xOf = hermite(
    kf,
    knots.map((n) => n.x),
  );
  const yOf = hermite(
    kf,
    knots.map((n) => n.y),
  );
  const K: number[] = [];
  const CX: number[] = [];
  const CY: number[] = [];
  for (let f = 0; f <= last; f++) {
    const kk = kOf(f);
    K.push(kk);
    CX.push(xOf(f));
    CY.push(yOf(f) + CAM_LIFT / kk);
  }
  return { K, CX, CY };
};

/** `runCamera` with a third channel. Arrays are indexed BY FRAME, clamped at
 *  both ends. */
export const runCam3 = (upto: number, CX: number[], CY: number[], K: number[]) => {
  const at = (a: number[], f: number) => a[Math.max(0, Math.min(a.length - 1, f))];
  let cx = CX[0];
  let cy = CY[0];
  let k = K[0];
  let vx = 0;
  let vy = 0;
  let vk = 0;
  const n = Math.max(0, Math.round(upto));
  for (let f = 1; f <= n; f++) {
    vx += (at(CX, f) - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (at(CY, f) - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vk += (at(K, f) - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cx, cy, k };
};

/** The circular mean of a set of headings. The clip's grid slide runs along the
 *  formation's MEAN heading, and a plain arithmetic mean of angles near the
 *  -pi/+pi seam is nonsense. */
export const meanAngle = (angles: number[]) => {
  let sx = 0;
  let sy = 0;
  for (const a of angles) {
    sx += Math.cos(a);
    sy += Math.sin(a);
  }
  return Math.atan2(sy, sx);
};

/** The UNDERDAMPED step, which is how a LOOSE alignment turns: it reaches its
 *  target, overshoots by `over` of the way, and hunts either side of it with a
 *  decaying amplitude instead of arriving. `t0Peak` is the frame the first
 *  overshoot peaks on. Returns 0 at t <= 0 and oscillates about 1 after.
 *
 *  Standard second-order step response, u(t) = 1 - e^{-s t}(cos(w t) +
 *  (s/w) sin(w t)), with the peak overshoot exp(-s*pi/w) = over and the first
 *  peak at t = pi/w — so the two parameters below fix s and w exactly. */
export const huntStep = (t: number, over: number, t0Peak: number) => {
  if (t <= 0) return 0;
  const w = Math.PI / Math.max(1e-6, t0Peak);
  const s = (-Math.log(Math.max(1e-6, over)) * w) / Math.PI;
  return 1 - Math.exp(-s * t) * (Math.cos(w * t) + (s / w) * Math.sin(w * t));
};

/** The frames after arrival at which `huntStep` is permanently inside `tol` of
 *  its target: the envelope e^{-s t} sqrt(1 + (s/w)^2) drops below tol. */
export const huntSettle = (over: number, t0Peak: number, tol: number) => {
  const w = Math.PI / Math.max(1e-6, t0Peak);
  const s = (-Math.log(Math.max(1e-6, over)) * w) / Math.PI;
  return Math.log(Math.sqrt(1 + (s / w) ** 2) / tol) / s;
};

// ---------------------------------------------------------------------------
// THE FLOCK WANDER — use this, not `wanderOf`, on a crowd at this density.
//
// `wanderOf` gives every agent its own independent drift, and at 90 agents
// relaxed to SEP_K = 3.0 mean radii that is a measured mistake: the gap between
// two floor-separated comets is 8 world px, two independent +-3.5 px drifts can
// close it from both sides at once, and the pair fuses into one lumpy body.
// Measured on cut 1's formation with `wanderOf`: two comets 1.56 mean radii
// apart on f0, against a floor of 2.6.
//
// A flock's wander is not independent anyway — it is COHERENT. So this is a
// slow spatial field, two long plane waves per axis, sampled at the agent's own
// seat: neighbours drift TOGETHER and the blob undulates as a body, while the
// relative displacement between two seats g apart is only the field's gradient
// times g, which for these wavelengths is under 0.85 px at g = 24. On top of it
// each agent keeps a small INDEPENDENT drift for life, and that one is capped
// per agent by its own measured clearance:
//
//     slack_i   = min_j ( d_ij - SEP_FLOOR * mean radius )
//     allowed_i = max(0, slack_i - COHERENT_BOUND) / 2 / sqrt(2)
//
// — so the tightest pairs in the crowd wander a little and the roomy ones
// wander fully, and the pair bound holds either way because each seat's
// amplitude is capped against its own worst neighbour. `flockWanderCaps` does
// that measurement once, at module scope, off the formation.
// ---------------------------------------------------------------------------
/** The separation the caps are solved against; the cut asserts 2.6. */
export const SEP_FLOOR = 2.62;
// Amplitude and wavelength were raised together (2.0/980 and 1.2/640 -> these)
// on the motion-energy pass: the gradient A * 2pi / L is what the separation
// bound depends on and it is UNCHANGED at 0.0128 + 0.0118 = 0.0246 per px, but
// the drift the eye sees is the amplitude times the rate, and at 2.0 px on a
// 0.047/frame clock that was 0.09 px/frame — a standstill. At 5.0 px on
// 0.10/frame it is 0.5 px/frame per axis, and because the waves are longer than
// the blob the crowd reads as breathing rather than as fizzing.
export const COHERENT_A1 = 5.0;
export const COHERENT_L1 = 2450;
export const COHERENT_A2 = 3.0;
export const COHERENT_L2 = 1600;
/** The worst relative displacement the coherent field can produce between two
 *  seats at the relaxation's floor: (A1*2pi/L1 + A2*2pi/L2) * g * sqrt(2). */
export const COHERENT_BOUND = 0.85;
/** The independent part's amplitude, before the per-agent cap. */
export const SOLO_A = 1.6;

export const flockWanderCaps = (f: Formation) =>
  f.seats.map((s) => {
    let slack = Infinity;
    for (const t of f.seats) {
      if (t === s) continue;
      const d = Math.hypot(s.x - t.x, s.y - t.y);
      slack = Math.min(slack, d - SEP_FLOOR * 0.5 * (s.r + t.r));
    }
    const allowed = Math.max(0, slack - COHERENT_BOUND) / 2 / Math.SQRT2;
    return Math.min(1, allowed / Math.max(1e-6, worldPx(SOLO_A) * s.wamp));
  });

/** The coherent field plus the capped independent drift, plus the heading
 *  jitter, which needs no cap because it moves nothing. `cap` is the agent's
 *  entry from `flockWanderCaps`. */
export const flockWander = (s: Seat, f: number, cap: number) => {
  const k1 = TWO_PI / worldPx(COHERENT_L1);
  const k2 = TWO_PI / worldPx(COHERENT_L2);
  const a1 = worldPx(COHERENT_A1);
  const a2 = worldPx(COHERENT_A2);
  const solo = worldPx(SOLO_A) * s.wamp * cap;
  return {
    dx:
      a1 * Math.sin(s.x * k1 + f * 0.101 + 0.7) +
      a2 * Math.sin(s.y * k2 - f * 0.073 + 2.1) +
      solo * Math.sin(f * WANDER_RATE + s.wpx),
    dy:
      a1 * Math.sin(s.y * k1 - f * 0.088 + 1.9) +
      a2 * Math.sin(s.x * k2 + f * 0.064 + 4.4) +
      solo * Math.sin(f * WANDER_RATE * 1.21 + s.wpy),
    da: ((JITTER_DEG * Math.PI) / 180) * s.wamp * Math.sin(f * JITTER_RATE + s.wpa),
  };
};
