import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { WOBBLE_R, feather, hash, smoothstep, wobble } from "./fieldShared";
import { CLAUDE, DEEPSEEK, MINIMAX, MOONSHOT, type BrandGlyph } from "./brandGlyphs";

// ---------------------------------------------------------------------------
// What the three cuts of `JohnCharlesBeren_Claude_Distilled` share.
//
// `fieldShared.tsx` is the house style: the palette, the ladder, the camera's
// damping, the grid, the vignette — everything every orange-Dwarkesh piece is
// made of. This file is one level down: it is what THIS CLIP is made of. The
// three cuts are seconds apart in one edit and stand in one world, so the marks,
// the output blob, the column it combs into, the threads and their packets, and
// the one Söhne face are single definitions here rather than three copies that
// can drift by a hair.
//
//   cut 1  `LowerAfterRL.tsx`        the siphon; marks at y 560 / 840,
//                                    blobs centred 1010, columns from 920
//   cut 2  `SameCharacterNames.tsx`  the same world seconds later; no blobs
//   cut 3  `ClaudeifiedByRL.tsx`     the same material lifted 280px: marks at
//                                    y 560, blobs centred 730, columns from 640
//
// The geometry is identical in all three; only the OFFSET differs, so everything
// that depends on where the group sits is a parameter (`makeSeats({ blobCy,
// colTop, markBottom })`) and everything that does not is a constant.
//
// Cut 1 is the source of truth wherever the three copies differed by a hair.
// ---------------------------------------------------------------------------

// -- type --------------------------------------------------------------------
// Söhne Kräftig, at module scope, the way `explainerShared.tsx` loads it, so a
// font failure surfaces before a single frame is drawn. One face, one weight,
// no fallback stack: if it does not load the render is wrong and should look
// wrong. Loaded HERE, once, so importing this module is what gets you the font.
export const LABEL_FONT = "SohneKraftig";
loadFont({
  family: LABEL_FONT,
  url: staticFile("Sohne-Kraftig.otf"),
  weight: "500",
});

/** Every readout in the clip: the label, the name, the `RL` rule's tag. */
export const readoutStyle = (fontSize: number) => ({
  fontFamily: LABEL_FONT,
  fontWeight: 500,
  fontSize,
  letterSpacing: "-0.01em",
});

// ---------------------------------------------------------------------------
// The marks. Phone-first: ONE centred column on x = 540, the three open-weight
// models left to right on 300 / 540 / 780, nothing parked at an edge.
//
// Claude is 150 on the 24-unit em box and a model is 104 — the same em for all
// four, so `size` is the box and the family reads as one set at any zoom.
// ---------------------------------------------------------------------------
export const AXIS = 540;
export const CLAUDE_SIZE = 150;
export const MARK_SIZE = 104;
export const MARK_X = [300, AXIS, 780];

export const MODELS: { name: string; glyph: BrandGlyph; x: number }[] = [
  { name: "DeepSeek", glyph: DEEPSEEK, x: MARK_X[0] },
  { name: "Moonshot", glyph: MOONSHOT, x: MARK_X[1] },
  { name: "MiniMax", glyph: MINIMAX, x: MARK_X[2] },
];

export { CLAUDE };

// The siphon world (cuts 1 and 2): Claude above, the model row below it, and
// the thread that runs between them. Cut 3 has no threads and lifts its marks
// to y 560 — it passes its own `markBottom` to `makeSeats` and ignores these.
export const CLAUDE_Y = 560;
export const CLAUDE_BOTTOM = CLAUDE_Y + CLAUDE_SIZE / 2; // 635
export const MARK_Y = 840;
export const MARK_BOTTOM = MARK_Y + MARK_SIZE / 2; // 892
export const THREAD_Y0 = CLAUDE_BOTTOM + 5; // 640, just clear of Claude's bottom edge
export const THREAD_Y1 = 780; // 60px above a mark's centre, 8px above its top edge
export const THREAD_W = 3;
export const THREAD_OPACITY = 0.95;

/** The camera's resting zoom, shared by all three cuts so they cut together. */
export const K_REST = 1.35;

// ---------------------------------------------------------------------------
// A brand mark, drawn as its own paths inside the world SVG — never as an
// `<image>` or an `<Img>`, which races frame capture and flashes for a frame or
// two. Uniform scale about the 24-unit box's centre (12, 12).
//
// `Glyph` is the bare geometry, for a piece that needs to clip or composite the
// halves itself and put the shadow on the wrapper. `Mark` is the whole icon:
// the glyph, the per-icon shadow, and its arrival — `landed` runs opacity 0 -> 1
// and scale 0.94 -> 1, and defaults to 1 for a piece whose marks are already
// seated on frame 0.
// ---------------------------------------------------------------------------
const fmt = (v: number) => String(Number(v.toFixed(3)));

export const Glyph: React.FC<{
  glyph: BrandGlyph;
  x: number;
  y: number;
  size: number;
  ink: string;
  scale?: number;
}> = ({ glyph, x, y, size, ink, scale = 1 }) => (
  <g
    transform={`translate(${fmt(x)} ${fmt(y)}) scale(${(scale * (size / 24)).toFixed(
      5,
    )}) translate(-12 -12)`}
  >
    {glyph.paths.map((d, i) => (
      <path key={i} d={d} fill={ink} fillRule="evenodd" />
    ))}
  </g>
);

export const Mark: React.FC<{
  glyph: BrandGlyph;
  x: number;
  y: number;
  size: number;
  ink: string;
  shadow: string;
  landed?: number;
}> = ({ glyph, x, y, size, ink, shadow, landed = 1 }) => {
  if (landed <= 0) return null;
  return (
    <g style={{ filter: shadow }} opacity={landed}>
      <Glyph glyph={glyph} x={x} y={y} size={size} ink={ink} scale={0.94 + 0.06 * landed} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// The outputs. 64 seats per model inside its blob, and the same 64 re-seated in
// its column, laid out once at module scope off the stable hash.
//
// The blob is a superellipse — |dx/a|^n + |dy/b|^n = 1 at n 2.4 — sampled by
// rejection out of its bounding box, so the density is uniform everywhere
// inside and there is no pointed end anywhere on it. Its boundary is the two
// things the style requires of every crowd edge that is ever seen: it undulates
// (`wobble` on the nominal edge, by angle so the loop has no seam) and the
// density falls off toward it (`feather`, over 3 seat steps ≈ 33 world px), so
// no row of dots ever traces the outline. Seats keep 16 world px apart ACROSS
// all three blobs, so the scatter is organic without clumping and the ~10px
// gaps at x 415/425 and 655/665 stay open.
//
// The radius is DOT_RADIUS for every seat, in both states, with no taper at the
// feathered edge: the count and the radius are what must be seen to be
// unchanged when the blob becomes the column, so only the DENSITY falls off.
//
// The column is the same 64, three wide at a 14px pitch — two wide at 11 read
// as a solid bar at this zoom — ranked by blob depth so the blob folds into it
// without crossing, each row of three kept in its own left-to-right order so no
// two paths cross inside a row either. 64 over three is 22 rows, and the last
// row holds one dot, centred rather than left in the left-hand slot.
// ---------------------------------------------------------------------------
export const BLOB_N = 64; // dots per model
export const BLOB_A = 115; // half-width
export const BLOB_B = 90; // half-height
export const BLOB_POW = 2.4; // the superellipse exponent: rounder than an ellipse, no corners
export const SEAT_STEP = 11; // world px, the unit `feather` measures its falloff in
export const BLOB_FEATHER = 3; // steps; ~33 world px of dissolve at the blob's edge
export const MIN_SEP = 16; // world px between any two seats, in any blob
export const EDGE_WOBBLE = 1.8; // world px of undulation on a blob boundary

export const COL_DX = 13;
export const COL_PITCH = 14;
export const COL_WIDE = 3;
export const COL_ROWS = Math.ceil(BLOB_N / COL_WIDE); // 22

export type Seat = {
  m: number; // which model
  i: number; // its index into the hash, so a piece can key its own timings off it
  fx: number; // its blob seat
  fy: number;
  v: number; // 0 at the top of the blob, 1 at the bottom
  cx: number; // its column seat
  cy: number;
  ripe: number; // 1 = ACCENT, 0 = ACCENT_DEEP — the mixed tone IS the diversity
  sx: number; // where it leaves the mark's bottom edge
  sy: number;
  travel: number; // how far that flight is
  arc: number; // perpendicular offset at mid-flight
  seed: number;
};

/**
 * The 3 x 64 seats, blob and column, for a group whose blob is centred on
 * `blobCy`, whose column's top row is `colTop`, and whose dots leave a mark's
 * bottom edge at `markBottom`. The seat SELECTION is independent of all three:
 * every offset is applied after the rejection sampling, so the three cuts hold
 * the same crowd in the same arrangement wherever the group sits.
 */
export const makeSeats = ({
  blobCy,
  colTop,
  markBottom,
}: {
  blobCy: number;
  colTop: number;
  markBottom: number;
}): Seat[] => {
  const blobTop = blobCy - BLOB_B;
  const out: Seat[] = [];
  for (let m = 0; m < MODELS.length; m++) {
    const cxm = MODELS[m].x;
    const mine: { x: number; y: number; v: number; i: number }[] = [];
    for (let i = 0; mine.length < BLOB_N && i < 60000; i++) {
      const dx = (2 * hash(i, 20 + m * 3) - 1) * BLOB_A;
      const dy = (2 * hash(i, 21 + m * 3) - 1) * BLOB_B;
      const x = cxm + dx;
      const y = blobCy + dy;
      // How far out this seat is, as a fraction of the boundary along its own
      // ray: 1 is exactly on the edge. The distance left to the edge is then
      // |d| * (1/r - 1), which is world px and is what `feather` wants.
      const r = Math.pow(
        Math.pow(Math.abs(dx) / BLOB_A, BLOB_POW) + Math.pow(Math.abs(dy) / BLOB_B, BLOB_POW),
        1 / BLOB_POW,
      );
      const d = Math.hypot(dx, dy);
      const toEdge = r < 1e-6 ? BLOB_B : d * (1 / r - 1);
      // the nominal edge undulates, by angle, so it is periodic around the loop
      const inSteps =
        (toEdge + wobble(Math.atan2(dy, dx) * WOBBLE_R, 0.9 + m) * EDGE_WOBBLE) / SEAT_STEP;
      if (hash(i, 71 + m) >= feather(inSteps, BLOB_FEATHER)) continue;
      // no clumps, and no interleaving where two blobs come close
      let clash = false;
      for (const s of out) {
        if (Math.hypot(s.fx - x, s.fy - y) < MIN_SEP) {
          clash = true;
          break;
        }
      }
      if (!clash) {
        for (const s of mine) {
          if (Math.hypot(s.x - x, s.y - y) < MIN_SEP) {
            clash = true;
            break;
          }
        }
      }
      if (clash) continue;
      // 0 at the top of the blob, 1 at the bottom: its arrival rank, and the
      // shape of its flight
      mine.push({ x, y, v: (y - blobTop) / (2 * BLOB_B), i });
      // pushed into `out` below, once the column seats are known
    }

    // The column: the same 64, ranked by depth so the blob folds into it
    // without crossing — the top dots take the top rows, the bottom dots the
    // bottom. Three per row, and a row keeps its dots in their own left-to-
    // right order so no two paths cross inside a row either.
    const rank = mine.map((_, n) => n).sort((a, b) => mine[a].y - mine[b].y);
    for (let r = 0; r < rank.length; r += COL_WIDE) {
      const row = rank.slice(r, r + COL_WIDE).sort((a, b) => mine[a].x - mine[b].x);
      row.forEach((n, j) => {
        rank[r + j] = n;
      });
    }

    rank.forEach((n, r) => {
      const s = mine[n];
      const row = Math.floor(r / COL_WIDE);
      const i = s.i;
      // it leaves the mark's own bottom edge, spread across its width
      const sx = cxm + (hash(i, 30 + m) - 0.5) * 70;
      const sy = markBottom;
      const travel = Math.hypot(s.x - sx, s.y - sy);
      out.push({
        m,
        i,
        fx: s.x,
        fy: s.y,
        v: s.v,
        // three wide: -COL_DX, 0, +COL_DX, in the row's own left-to-right
        // order. 64 is not a multiple of three, so the last row holds one dot
        // and it is centred rather than left in the left-hand slot.
        cx:
          cxm +
          ((r % COL_WIDE) - (Math.min(COL_WIDE, rank.length - row * COL_WIDE) - 1) / 2) * COL_DX,
        cy: colTop + row * COL_PITCH,
        ripe: hash(i, 33 + m) < 0.5 ? 1 : 0,
        sx,
        sy,
        travel,
        arc: (hash(i, 35 + m) - 0.5) * Math.min(90, travel * 0.32),
        seed: i * 7 + m,
      });
    });
  }
  // The one thing every cut rests on, checked once rather than trusted: every
  // model kept all 64 of its seats.
  if (out.length !== BLOB_N * MODELS.length) {
    throw new Error(`makeSeats: ${out.length} seats, expected ${BLOB_N * MODELS.length}`);
  }
  return out;
};

// ---------------------------------------------------------------------------
// A dot's FLIGHT, from the mark's bottom edge to its blob seat. Cuts 1 and 3
// spray the same 3 x 64 dots with the same mechanism, so the curve and the
// length of that flight are one definition here rather than two that can drift.
//
// v3 pass. The flight was an ease-out cubic, which spends most of a short
// flight on its first frame: over the 2.6-frame flights at the top of the blob
// that is 77% of the distance in one frame, and the spray peaked at 73.7 screen
// px/frame while the dot was at least half opaque (cut 1, k 1.35) and 70.9 in
// cut 3 — over the house cap of 45, with 102 and 151 of 192 dots over it. Two
// changes, and they are the only two:
//
//   * `flightEase` is a SMOOTHSTEP, which starts at zero speed, so no dot
//     arrives most of the way on the frame it appears. On its own that took the
//     peaks to 56.9 and 55.9 — better, still over the cap.
//   * `FLIGHT_EXTRA` adds the SAME two frames to every flight, which is what
//     took them under: 41.7 (cut 1) and 39.4 (cut 3), 0 of 192 dots over 45.
//     It is added to `dur` and never to `t0`, so the histogram of START frames
//     is untouched and the last arrival moves by exactly two frames in both
//     cuts (cut 1 f66.7 -> f68.7, still inside "outputs" and well clear of
//     "is" at f75; cut 3 f34.5 -> f36.5, well clear of "definitely" at f45).
//
// Nothing else about the spray moved: the arc, the fade, the seat field, the
// arrival rank and the per-dot hashes are exactly what they were.
// ---------------------------------------------------------------------------
export const flightEase = smoothstep;
export const FLIGHT_EXTRA = 2;

// ---------------------------------------------------------------------------
// The siphon. A 5px ink bead every 6 frames down each thread, 14 frames per
// transit, the three threads offset by 2 frames so they never pulse together.
// Direction — Claude -> model — is the whole point of the gesture, so a bead is
// placed off its own age and nothing else.
// ---------------------------------------------------------------------------
export const PKT_PERIOD = 6;
export const PKT_LIFE = 14;
export const PKT_R = 5;
export const PKT_OFFSET = 2; // frames between one thread's beads and the next's

export type Packet = { key: string; x: number; y: number };

/** Where a bead `p` of the way down the thread to a mark at `mx` sits. */
export const packetAt = (mx: number, p: number) => ({
  x: AXIS + (mx - AXIS) * p,
  y: THREAD_Y0 + (THREAD_Y1 - THREAD_Y0) * p,
});

/**
 * Every ambient bead alive on frame `frame`. `start` is the frame the siphon
 * begins (cut 1 starts it on "models, right?"); `n0` seeds it with history, so
 * a cut that opens on an already-running siphon has beads on every wire at f0.
 */
export const siphonPackets = (
  frame: number,
  { start = 0, n0 = 0 }: { start?: number; n0?: number } = {},
): Packet[] => {
  const out: Packet[] = [];
  MODELS.forEach((mod, t) => {
    for (let n = n0; ; n++) {
      const sf = start + t * PKT_OFFSET + n * PKT_PERIOD;
      if (sf > frame) break;
      const age = frame - sf;
      if (age >= PKT_LIFE) continue;
      out.push({ key: `p${t}-${n}`, ...packetAt(mod.x, age / (PKT_LIFE - 1)) });
    }
  });
  return out;
};
