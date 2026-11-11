import React from "react";
import { ACCENT, clamp01, hash, iconShadow, makeTone, smoothstep } from "../kits/dwarkesh/fieldShared";
import { INK } from "../kits/dwarkesh/alignShared";
import { HIGHLIGHT } from "../kits/dwarkesh/levelUp";
import { threadPackets } from "../kits/dwarkesh/trapShared";
import { AiFigure, GROUND_Y, figurePose } from "../rsi-another-jump/timelineWorld";
import { HUMAN_FAR } from "../rsi-another-jump/jumpWorld";

// ---------------------------------------------------------------------------
// firstDayWorld — the vertical company of cut 27 (`FirstDayAtTheCompany`,
// rsi-years-in-days). One world, world px, the CEO's floor in the middle:
//   * the floor: GROUND_Y of the sister clip's timelineWorld (so AiFigure and
//     HumanFigure stand on it untranslated), a platform centred on the pair and
//     the chart's trunk; the CEO (white HumanFigure) and the orange intern
//     (AiFigure, age 1) stand on it, a white wall clock over them;
//   * ABOVE: the records wall — rows of big white tiles (Lucide `mail`, the Slack
//     mark, Lucide `file-text`, then the three mixed) on thin white shelves,
//     bottom to top in the order of the words, ~9 columns across the wide frame;
//   * BELOW: the org chart hanging from the floor: CEO -> 3 -> 9 -> four crowd
//     rows; and a small separate group of clients beside the first level.
// Every seat is a PAIR: a white person (facing left) and, once a copy has
// reached it, an orange intern copy (facing right) a hand's width in front of
// them on one short floor line, a talk link between their heads. A travelling
// copy is the intern's head alone (the intern drawn once, clipped to its head);
// when it parks, the clip opens downward and the body comes out of the head.
// Everything static is built once at module load (paths, tiles, routes).
// ---------------------------------------------------------------------------

type P = { x: number; y: number };
const f2 = (v: number) => v.toFixed(2);
const linePath = (pts: P[]) => `M${pts.map((p) => `${f2(p.x)} ${f2(p.y)}`).join(" L")}`;
const polyPath = (pts: P[]) => `${linePath(pts)} Z`;

export const G = GROUND_Y; // the CEO's floor (feet stand on it)

// --- the pair --------------------------------------------------------------------
export const INTERN_X = 420;
export const CEO_X = 700;
const INTERN_REST = figurePose({ x: INTERN_X, age: 1 });
/** the copies are the intern's own head size */
export const MARK = INTERN_REST.mark.size;
export const HEAD_C: P = { x: INTERN_REST.mark.x + MARK / 2, y: INTERN_REST.mark.y + MARK / 2 };
export const HEAD_TOP: P = { x: INTERN_REST.head.x, y: INTERN_REST.top };

/** HumanFigure's pose, as HumanFigure builds it (jumpWorld), at x and breath t */
const humanPose = (x: number, breathT = 0) =>
  figurePose({ x, age: 1, breathT, identity: { badge: 0, tie: 0, child: 0, bun: 1, drink: 1 } });
const humanNearArm = (g: ReturnType<typeof humanPose>): P[] => {
  const { p } = g;
  const [fs, fe, fh] = g.farArm;
  const sh = g.nearArm[0];
  const dx = sh.x - fs.x + p.torsoW * 0.05;
  return [sh, { x: fe.x + dx, y: fe.y }, { x: fh.x + dx - p.torsoW * 0.04, y: fh.y }];
};

// the gap between the intern's cup and the CEO's back: the copies drop through it
const CUP_RIGHT = Math.max(...INTERN_REST.drinkBody.map((q) => q.x), ...INTERN_REST.lid.map((q) => q.x));
const CEO_REST = humanPose(CEO_X);
const CEO_BACK = Math.min(
  ...CEO_REST.torso.map((q) => q.x),
  ...CEO_REST.farArm.map((q) => q.x - CEO_REST.p.armT / 2),
  CEO_REST.footFar.cx - CEO_REST.footFar.rx,
);
export const ROOT_X = (CUP_RIGHT + CEO_BACK) / 2;
export const GAP_CLEAR = (CEO_BACK - CUP_RIGHT - MARK) / 2; // world px either side of a passing copy

// --- the floor, the clock ---------------------------------------------------------
export const FLOOR_SW = 9;
export const FLOOR_Y = G + FLOOR_SW / 2; // the floor line's centre
// a platform centred on the trunk (ROOT_X), long enough on the left for the walk-in
export const FLOOR_HALF = 580;
export const FLOOR_X0 = ROOT_X - FLOOR_HALF;
export const FLOOR_X1 = ROOT_X + FLOOR_HALF;
export const CLOCK = { x: 560, y: 318, r: 95 };
export const CLOCK_SW = 9;

/** the wall clock: hours as a number (9 = 9:00, 17 = 5:00) */
export const Clock: React.FC<{ k: number; hours: number }> = ({ k, hours }) => {
  const { x, y, r } = CLOCK;
  const ticks: string[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r0 = r * (i % 3 === 0 ? 0.66 : 0.76);
    const r1 = r * 0.88;
    ticks.push(`M${f2(x + Math.sin(a) * r0)} ${f2(y - Math.cos(a) * r0)} L${f2(x + Math.sin(a) * r1)} ${f2(y - Math.cos(a) * r1)}`);
  }
  const hA = ((hours % 12) / 12) * Math.PI * 2;
  const mA = (hours % 1) * Math.PI * 2;
  const hand = (a: number, len: number, w: number) => (
    <line
      x1={x - Math.sin(a) * w * 0.9}
      y1={y + Math.cos(a) * w * 0.9}
      x2={x + Math.sin(a) * len}
      y2={y - Math.cos(a) * len}
      stroke={INK}
      strokeWidth={w}
      strokeLinecap="round"
    />
  );
  return (
    <g style={{ filter: iconShadow(k) }}>
      <circle cx={x} cy={y} r={r} fill="none" stroke={INK} strokeWidth={CLOCK_SW} />
      <path d={ticks.join(" ")} stroke={INK} strokeWidth={6} strokeLinecap="round" fill="none" />
      {hand(hA, r * 0.5, 13)}
      {hand(mA, r * 0.8, 9)}
      <circle cx={x} cy={y} r={10} fill={INK} />
    </g>
  );
};

// --- the records wall -------------------------------------------------------------
// big tiles, few of them: ~9 columns across the wide frame (k ~0.49), a tile ~80 screen px there
export const WALL_BASE = -200; // the lowest shelf's centre line
export const ROW_H = 210;
export const TILE = 163; // a tile's 24-unit box, world px
export const COL_W = 245;
export const SHELF_SW = 5;
export const CONTACT: P = { x: 330, y: WALL_BASE };
const ROWS = 18;
const COL_MIN = -7;
const COL_MAX = 8;
export const SHELF_X0 = CONTACT.x + COL_MIN * COL_W - COL_W;
export const SHELF_X1 = CONTACT.x + COL_MAX * COL_W + COL_W;
export type TileKind = "mail" | "slack" | "doc";
// rows by the wave's arrival (see waveFront): envelopes f80-~96, Slack ~f103-123, pages ~f128-148, mixed above
export const KIND_ROWS = { mail: [0, 1], slack: [2, 3], doc: [4, 6] } as const;
const kindForRow = (r: number, c: number): TileKind => {
  if (r <= KIND_ROWS.mail[1]) return "mail";
  if (r <= KIND_ROWS.slack[1]) return "slack";
  if (r <= KIND_ROWS.doc[1]) return "doc";
  const h = hash(r * 61 + c, 13);
  return h < 0.34 ? "mail" : h < 0.67 ? "slack" : "doc";
};
export type Tile = { kind: TileKind; x: number; y: number; row: number; reach: number };
export const shelfY = (r: number) => WALL_BASE - r * ROW_H;
const tileCentreY = (r: number) => shelfY(r) - SHELF_SW / 2 - 10 - TILE / 2;
export const TILES: Tile[] = (() => {
  const out: Tile[] = [];
  const d0 = Math.hypot(0, tileCentreY(0) - CONTACT.y);
  for (let r = 0; r < ROWS; r++) {
    const off = r % 2 === 0 ? 0 : COL_W / 2;
    for (let c = COL_MIN; c <= COL_MAX; c++) {
      const id = r * 100 + c;
      // a few gaps on the shelves, never at the contact tile
      if (!(r === 0 && c === 0) && hash(id, 5) < 0.05) continue;
      const x = CONTACT.x + c * COL_W + off + (r === 0 && c === 0 ? 0 : (hash(id, 7) - 0.5) * 16);
      const y = tileCentreY(r);
      const jit = r === 0 && c === 0 ? 0 : hash(id, 9) * 70;
      const dist = Math.hypot(x - CONTACT.x, y - CONTACT.y);
      out.push({ kind: kindForRow(r, c), x, y, row: r, reach: dist - d0 + jit });
    }
  }
  return out;
})();

/** the reading wave: how far (world px, from the contact tile) the front has
 *  reached `t` frames after contact. One curve, accelerating all the way. */
export const WAVE_A = 18;
export const WAVE_B = 1.75e-9;
export const WAVE_P = 6.1;
export const waveFront = (t: number) => (t < 0 ? -1e9 : WAVE_A * t + WAVE_B * Math.pow(t, WAVE_P));
export const WAVE_W = 90; // world px over which one tile turns

// Lucide (ISC), 24 grid: `mail`, `file-text`. Slack: Wikimedia Commons "Slack icon 2019.svg"
// (assets-src/rsi-years-in-days/slack_icon_2019.svg), the four paths on its 127 box, one fill.
const ICON_MAIL = ["m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7", "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"];
const ICON_DOC = [
  "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",
  "M14 2v4a2 2 0 0 0 2 2h4",
  "M10 9H8",
  "M16 13H8",
  "M16 17H8",
];
const SLACK = [
  "M27.2 80c0 7.3-5.9 13.2-13.2 13.2C6.7 93.2.8 87.3.8 80c0-7.3 5.9-13.2 13.2-13.2h13.2V80zm6.6 0c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V80z",
  "M47 27c-7.3 0-13.2-5.9-13.2-13.2C33.8 6.5 39.7.6 47 .6c7.3 0 13.2 5.9 13.2 13.2V27H47zm0 6.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H13.9C6.6 60.1.7 54.2.7 46.9c0-7.3 5.9-13.2 13.2-13.2H47z",
  "M99.9 46.9c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H99.9V46.9zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V13.8C66.9 6.5 72.8.6 80.1.6c7.3 0 13.2 5.9 13.2 13.2v33.1z",
  "M80.1 99.8c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2V99.8h13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33.1c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2H80.1z",
];
const ICON_SW = 2.0; // Lucide units
const SLACK_FRAC = 0.8; // the mark's ink box against the tile box (Lucide's ink is ~20/24)
export const TILE_TONE = makeTone("#F2F2F2", ACCENT);

/** the tile glyphs, once, at the origin (top-left of the tile box) */
export const TileDefs: React.FC = () => (
  <defs>
    <g id="fd-mail" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {ICON_MAIL.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
    <g id="fd-doc" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {ICON_DOC.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
    <g id="fd-slack" stroke="none">
      {SLACK.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </g>
  </defs>
);

const S_LUCIDE = TILE / 24;
const S_SLACK = (TILE * SLACK_FRAC) / 127;
export const TileUse: React.FC<{ t: Tile; tone: number }> = ({ t, tone }) => {
  const c = TILE_TONE(tone);
  if (t.kind === "slack") {
    const w = 127 * S_SLACK;
    return (
      <use
        href="#fd-slack"
        transform={`translate(${f2(t.x - w / 2)} ${f2(t.y - w / 2)}) scale(${S_SLACK.toFixed(5)})`}
        fill={c}
      />
    );
  }
  return (
    <use
      href={t.kind === "mail" ? "#fd-mail" : "#fd-doc"}
      transform={`translate(${f2(t.x - TILE / 2)} ${f2(t.y - TILE / 2)}) scale(${S_LUCIDE.toFixed(5)})`}
      stroke={c}
      strokeWidth={ICON_SW}
    />
  );
};

// --- people and intern copies, drawn once ----------------------------------------
// HumanFigure (jumpWorld) drawn once at x 0, feet on y 0, then placed by <use>
// (translate + uniform scale, mirrored to face left). Same parts, same order,
// same colours as HumanFigure. The intern copy is the real AiFigure (age 1) drawn
// once at x 0, feet on y 0 (static pose), placed the same way facing right.
const PERSON = humanPose(0);
const PERSON_NEAR_ARM = humanNearArm(PERSON);
/** local (feet at 0, x 0) geometry shared by both figures (same skeleton) */
export const LOC = {
  headX: PERSON.head.x, // the head's centre x (facing right)
  headY: PERSON.top + PERSON.p.headD / 2 - G, // the person's head centre y
  headR: PERSON.p.headD / 2,
  markTop: INTERN_REST.mark.y - G,
  markX: INTERN_REST.mark.x - INTERN_X + MARK / 2, // the mark's centre x
  markY: INTERN_REST.mark.y - G + MARK / 2,
  back: -44.3, // torso back edge
  front: 104, // cup / hand, the front-most point
  top: PERSON.top - G,
};
export const FigureDefs: React.FC<{ k: number }> = ({ k }) => {
  const g = PERSON;
  const { p } = g;
  const legPts = (side: "near" | "far") => {
    const l = g.legs.find((q) => q.side === side)!;
    return [l.hip, l.knee, l.ankle];
  };
  const limb = (pts: P[], w: number, c: string) => (
    <path d={linePath(pts)} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  return (
    <defs>
      <g id="fd-person" transform={`translate(0 ${f2(-G)})`}>
        {limb(g.farArm, p.armT, HUMAN_FAR)}
        {limb(legPts("far"), p.legT, HUMAN_FAR)}
        <ellipse cx={g.footFar.cx} cy={g.footFar.cy} rx={g.footFar.rx} ry={g.footFar.ry} fill={HUMAN_FAR} />
        {limb(g.neck, p.neckW, INK)}
        <path d={polyPath(g.torso)} fill={INK} />
        <circle cx={g.head.x} cy={g.top + p.headD / 2} r={p.headD / 2} fill={INK} />
        {limb(legPts("near"), p.legT, INK)}
        <ellipse cx={g.footNear.cx} cy={g.footNear.cy} rx={g.footNear.rx} ry={g.footNear.ry} fill={INK} />
        {limb(PERSON_NEAR_ARM, p.armT, INK)}
      </g>
      <g id="fd-intern" transform={`translate(0 ${f2(-G)})`}>
        {/* k here only sizes the figure's own drop shadow (in its local units) */}
        <AiFigure id="fd-intern-fig" k={k} x={0} age={1} breathT={0} />
      </g>
      {/* a travelling copy: the intern clipped to its head (the mark box, with a margin for the shadow) */}
      <clipPath id="fd-headclip" clipPathUnits="userSpaceOnUse">
        <rect x={LOC.markX - MARK * 0.6} y={LOC.markTop - MARK * 0.1} width={MARK * 1.2} height={MARK * 1.1} />
      </clipPath>
    </defs>
  );
};

// --- the resolved frame (the cut's last camera, before its creep) ----------------
export const K_END = 0.47;
export const FLOOR_SCREEN_END = 500;
export const CX_END = 650;
export const CY_END = G - (FLOOR_SCREEN_END - 960) / K_END;
/** world y of a screen y in the resolved frame */
const wy = (sy: number) => CY_END + (sy - 960) / K_END;

// --- seats: a person and its intern copy -------------------------------------------
export type Seat = {
  id: string;
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 L1, 1 L2, 2-5 crowd rows A-D, 6 client
  s: number;
  ix: number; // the intern's x (its ground centre), facing right
  px: number; // the person's x, facing left (mirrored)
  feetY: number;
  /** the line's x = the intern's head centre */
  lx: number;
  park: P; // the intern's head (mark) centre
  headTop: number; // the intern's mark top
  linkFrom: P;
  linkTo: P;
  floor: [number, number];
};
const HAND = 45; // front-to-front gap between the two, local units (a hand's width)
/** a pair centred on c (x), feet on feetY, scale s: intern on the left facing right, person on the right facing left */
const makeSeat = (id: string, level: Seat["level"], c: number, feetY: number, s: number): Seat => {
  const ix = c - (LOC.front + HAND / 2) * s;
  const px = c + (LOC.front + HAND / 2) * s;
  const park = { x: ix + LOC.markX * s, y: feetY + LOC.markY * s };
  const pHead = { x: px - LOC.headX * s, y: feetY + LOC.headY * s };
  const half = (LOC.front + HAND / 2 - LOC.back) * s;
  return {
    id,
    level,
    s,
    ix,
    px,
    feetY,
    lx: park.x,
    park,
    headTop: feetY + LOC.markTop * s,
    linkFrom: { x: park.x + MARK * 0.47 * s, y: park.y },
    linkTo: { x: pHead.x - LOC.headR * s - 3 * s, y: park.y },
    floor: [c - half - 14 * s, c + half + 14 * s],
  };
};
/** a seat placed by its head top (so the line's drop length is set) */
const seatByTop = (id: string, level: Seat["level"], c: number, topY: number, s: number) =>
  makeSeat(id, level, c, topY - LOC.markTop * s, s);

// --- the org chart --------------------------------------------------------------------
export const LINE_W = 8; // the chart's connectors
export const LINK_W = 8; // a talk link
export const PACKET_R = 11; // ~10 screen px across at the resolved frame
export const PACKET_CORE = 4.5;
export const PAIR_FLOOR_SW = 6;

export const S1 = 0.52;
export const S2 = 0.42;
export const S3 = 0.36;
export const SC = 0.42; // clients

// everything below the CEO's floor stays out of the open's frame (it sees ~G + 483 at k 1.5)
export const BUS1_Y = wy(735);
const L1_TOP = wy(760);
const BUS2_SY = 902;
const L2_TOP = wy(924);
const BUSA_SY = 1036;
const ROW_TOP_SY = [1050, 1260, 1475, 1690];
const JOG_SY = [1196, 1410, 1625];
const L1_C = [-1, 0, 1].map((i) => ROOT_X - (LOC.markX - LOC.front - HAND / 2) * S1 + i * 430);
const L2_PITCH = 236;
const CROWD_P = 222;

// the settled frame's edges (the cut's camera at f285-301: k 0.467-0.469, cx ~651): a crowd pair that the frame
// edge would split (a person in, its intern out, or either cut through) is nudged the least distance to all-in or
// all-out
const K_LAST = 0.467;
const CX_LAST = 651;
const EDGE_MARGIN = 14;
const edgeClean = (c: number, s: number) => {
  const half = (LOC.front + HAND / 2 - LOC.back) * s;
  const inner = (HAND / 2) * s; // the gap between the two figures, either side of c
  const fig = half - inner; // one figure's width
  const L = CX_LAST - 540 / K_LAST;
  const R = CX_LAST + 540 / K_LAST;
  const ok = (cc: number) => {
    const vis = (a: number, b: number) => Math.max(0, Math.min(R, b) - Math.max(L, a)) / (b - a);
    const vi = vis(cc - half, cc - inner);
    const vp = vis(cc + inner, cc + half);
    return (vi >= 0.75 && vp >= 0.75) || (vi === 0 && vp === 0);
  };
  if (ok(c)) return c;
  for (let d = 1; d < 3 * fig; d++) {
    for (const cc of [c - d, c + d]) {
      if (ok(cc - EDGE_MARGIN) && ok(cc + EDGE_MARGIN)) return cc;
    }
  }
  return c;
};

export type Node = {
  seat: Seat;
  parent: number; // -1 = the root junction (bus 1)
  /** the copy's way in: from the parent's junction along the bus and down to the head */
  inPath: ReturnType<typeof makePolyline>;
  /** on from the head to its own junction (levels 0-1: down behind the body to the next bus) */
  rail: ReturnType<typeof makePolyline> | null;
  junction: P;
  sFrom: number; // scale of the copy where it enters inPath
};

/** a polyline sampled by arc length */
export function makePolyline(pts: P[]) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const len = cum[cum.length - 1];
  const at = (d: number): P => {
    const dd = Math.max(0, Math.min(len, d));
    let i = 1;
    while (i < pts.length - 1 && cum[i] < dd) i++;
    const w = (dd - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
    return { x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * w, y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * w };
  };
  return { len, at, pts };
}

const dedupe = (pts: P[]) => pts.filter((q, i) => i === 0 || Math.hypot(q.x - pts[i - 1].x, q.y - pts[i - 1].y) > 0.01);

export const NODES: Node[] = (() => {
  const out: Node[] = [];
  const add = (seat: Seat, parent: number, inPts: P[], railTo: P | null, sFrom: number) => {
    const inPath = makePolyline(dedupe(inPts));
    const rail = railTo ? makePolyline([seat.park, railTo]) : null;
    out.push({ seat, parent, inPath, rail, junction: railTo ?? seat.park, sFrom });
    return out.length - 1;
  };
  // level 1: three managers under bus 1
  const l1: number[] = [];
  L1_C.forEach((c, i) => {
    const seat = seatByTop(`L1${i}`, 0, c, L1_TOP, S1);
    const busY = wy(BUS2_SY + (hash(i, 31) - 0.5) * 14);
    l1.push(
      add(seat, -1, [{ x: ROOT_X, y: BUS1_Y }, { x: seat.lx, y: BUS1_Y }, { x: seat.lx, y: seat.headTop }, seat.park], { x: seat.lx, y: busY }, 1),
    );
  });
  // level 2: nine, three per manager, one even pitch centred under the trunk
  const l2: number[] = [];
  for (let j = 0; j < 9; j++) {
    const c = ROOT_X - (LOC.markX - LOC.front - HAND / 2) * S2 + (j - 4) * L2_PITCH + (hash(j, 33) - 0.5) * 16;
    const top = L2_TOP + (hash(j, 35) - 0.5) * 16;
    const seat = seatByTop(`L2${j}`, 1, c, top, S2);
    const par = l1[Math.floor(j / 3)];
    const J = out[par].junction;
    const busY = wy(BUSA_SY + (hash(j, 37) - 0.5) * 16);
    l2.push(add(seat, par, [J, { x: seat.lx, y: J.y }, { x: seat.lx, y: seat.headTop }, seat.park], { x: seat.lx, y: busY }, S1));
  }
  // the crowd: one column of four seats (rows A-D) per crowd pitch, each column hanging from the nearest
  // level-2 person's bus; a row's seat hangs from the seat above it (the line runs on behind its body, a short
  // jog, down to the next head). Rows shift a little against each other and every seat is jittered.
  const ROW_SHIFT = [0, -10, -6, 8];
  const C0 = ROOT_X - 2 * CROWD_P - 40; // a column centre
  for (let col = -7; col <= 8; col++) {
    const base = C0 + col * CROWD_P;
    // the nearest level-2 line
    let best = l2[0];
    l2.forEach((n) => {
      if (Math.abs(out[n].seat.lx - (base - (LOC.front + HAND / 2 - LOC.markX) * S3)) < Math.abs(out[best].seat.lx - (base - (LOC.front + HAND / 2 - LOC.markX) * S3)))
        best = n;
    });
    let par = best;
    for (let r = 0; r < 4; r++) {
      const id = 700 + col * 7 + r;
      const s = S3 * (1 + (hash(id, 3) - 0.5) * 0.08);
      const c = edgeClean(base + ROW_SHIFT[r] + (hash(id, 6) - 0.5) * 14, s);
      const top = wy(ROW_TOP_SY[r] + (hash(id, 4) - 0.5) * 14);
      const seat = seatByTop(`C${r}_${col}`, (2 + r) as Seat["level"], c, top, s);
      const J = out[par].junction;
      const inPts =
        r === 0
          ? [J, { x: seat.lx, y: J.y }, { x: seat.lx, y: seat.headTop }, seat.park]
          : (() => {
              const jy = wy(JOG_SY[r - 1] + (hash(id, 8) - 0.5) * 12);
              return [J, { x: J.x, y: jy }, { x: seat.lx, y: jy }, { x: seat.lx, y: seat.headTop }, seat.park];
            })();
      par = add(seat, par, inPts, null, r === 0 ? S2 : out[par].seat.s);
    }
  }
  return out;
})();

// the clients: right of the first level, on a short floor of their own, no connector reaches them
export const CLIENT_SEATS: Seat[] = [0, 1, 2].map((i) => {
  const right = L1_C[2] + (LOC.front + HAND / 2 - LOC.back) * S1;
  const half = (LOC.front + HAND / 2 - LOC.back) * SC;
  const c = right + 60 + half + i * (2 * half + 18);
  return seatByTop(`K${i}`, 6, c, L1_TOP + 6 * (i - 1), SC);
});
export const CLIENT_FLOOR = {
  x0: CLIENT_SEATS[0].floor[0],
  x1: CLIENT_SEATS[2].floor[1],
  y: Math.max(...CLIENT_SEATS.map((q) => q.feetY)),
};
// the clients stand on one floor: re-seat them with their feet on it
CLIENT_SEATS.forEach((q, i) => {
  const c = (q.floor[0] + q.floor[1]) / 2;
  CLIENT_SEATS[i] = makeSeat(q.id, 6, c, CLIENT_FLOOR.y, SC);
});

/** the connectors, one path string: the root, every bus, drop, rail and jog */
export const CHART_PATH = (() => {
  const segs: string[] = [linePath([{ x: ROOT_X, y: FLOOR_Y }, { x: ROOT_X, y: BUS1_Y }])];
  NODES.forEach((n) => {
    const pts = n.inPath.pts.slice(0, -1); // stop at the head's top (the head covers the rest)
    segs.push(linePath(pts));
    if (n.rail) segs.push(linePath(n.rail.pts));
  });
  // a crowd seat's line runs on behind its own body to the jog below (drawn by the next row's inPath from its head)
  return segs.join(" ");
})();
/** the short floor under every pair, one path */
export const PAIR_FLOORS = [...NODES.map((n) => n.seat), ...CLIENT_SEATS]
  .map((q) => `M${f2(q.floor[0])} ${f2(q.feetY + PAIR_FLOOR_SW / 2)} L${f2(q.floor[1])} ${f2(q.feetY + PAIR_FLOOR_SW / 2)}`)
  .join(" ");

// --- the copies' routes ---------------------------------------------------------------
/** out from behind the head (forward), round a corner, down the gap, down the root to the first junction */
const CORNER = 70;
export const ROOT_ROUTE = (() => {
  const pts: P[] = [{ x: HEAD_C.x, y: HEAD_C.y }, { x: ROOT_X - CORNER, y: HEAD_C.y }];
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * (Math.PI / 2);
    pts.push({ x: ROOT_X - CORNER + Math.sin(a) * CORNER, y: HEAD_C.y + CORNER - Math.cos(a) * CORNER });
  }
  pts.push({ x: ROOT_X, y: BUS1_Y });
  return makePolyline(pts);
})();
/** distance along a copy's route (from the head): where each node's way in starts, its head, its junction */
export const ROUTE_S = (() => {
  const out: { s0: number; park: number; bus: number }[] = [];
  NODES.forEach((n) => {
    const s0 = n.parent < 0 ? ROOT_ROUTE.len : out[n.parent].bus;
    const park = s0 + n.inPath.len;
    const bus = n.rail ? park + n.rail.len : park;
    out.push({ s0, park, bus });
  });
  return out;
})();

/** the copies' one speed (world px / frame) and the ramp off the head */
export const COPY_V = 88;
export const COPY_RAMP = 10;
export const copyDist = (t: number, v = COPY_V, ramp = COPY_RAMP) => {
  if (t <= 0) return 0;
  if (t < ramp) {
    const u = t / ramp;
    return v * ramp * (u * u * u - (u * u * u * u) / 2);
  }
  return v * ramp * 0.5 + v * (t - ramp);
};
export const copyTime = (s: number, v = COPY_V, ramp = COPY_RAMP) => {
  const sr = v * ramp * 0.5;
  if (s >= sr) return ramp + (s - sr) / v;
  let lo = 0;
  let hi = ramp;
  for (let i = 0; i < 40; i++) {
    const m = (lo + hi) / 2;
    if (copyDist(m, v, ramp) < s) lo = m;
    else hi = m;
  }
  return hi;
};

/** the train: three copies slide out one after another; copy 0 seats level 1, copy 1 level 2, copy 2 the crowd
 *  (at each crowd head one stays and one rides on down) */
export const EMIT = [199, 203, 207];
export const copyFor = (level: number) => Math.min(level, 2);
export const parkFrame = (i: number) => EMIT[copyFor(NODES[i].seat.level)] + copyTime(ROUTE_S[i].park);

// clients: three copies slide out from behind the right-hand manager's head and arc across
export const CLIENT_SRC = NODES.findIndex((n) => n.seat.id === "L12");
export const CLIENT_V = 72;
export const CLIENT_RAMP = 6;
export const CLIENT_EMIT = [264, 266, 268];
export const CLIENT_ROUTES = CLIENT_SEATS.map((c) => {
  const a = NODES[CLIENT_SRC].seat.park;
  const b = c.park;
  // a shallow arc over the gap
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const L = Math.hypot(dx, dy);
  const ctrl = { x: mx + (dy / L) * 0.18 * L, y: my - (dx / L) * 0.18 * L };
  const pts: P[] = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    pts.push({
      x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * ctrl.x + t * t * b.x,
      y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * ctrl.y + t * t * b.y,
    });
  }
  return makePolyline(pts);
});
export const clientParkFrame = (i: number) => CLIENT_EMIT[i] + copyTime(CLIENT_ROUTES[i].len, CLIENT_V, CLIENT_RAMP);

// --- drawing the figures ------------------------------------------------------------
/** the intern, placed with its head centre at (x, y) at scale s (a travelling copy = head only) */
export const internAtHead = (x: number, y: number, s: number) =>
  `translate(${f2(x - LOC.markX * s)} ${f2(y - LOC.markY * s)}) scale(${s.toFixed(4)})`;
export const internAt = (q: Seat) => `translate(${f2(q.ix)} ${f2(q.feetY)}) scale(${q.s.toFixed(4)})`;
export const personAt = (q: Seat) => `translate(${f2(q.px)} ${f2(q.feetY)}) scale(${(-q.s).toFixed(4)} ${q.s.toFixed(4)})`;
/** the body's reveal: the clip's bottom edge (local units) runs from the mark's bottom to below the feet */
export const REVEAL = 7;
export const revealClipH = (u: number) => MARK * 1.1 + smoothstep(clamp01(u)) * (-LOC.markTop - MARK + 40);

// --- talk links ---------------------------------------------------------------------
export const LINK_DRAW = 4; // frames for a talk link to draw from the copy's head to the person's
export const LINK_DELAY = 3; // after the copy parks
export const TALK_PERIOD = 12; // one global clock: every link pulses in the same phase
export const LINK_BRIGHT = makeTone(ACCENT, HIGHLIGHT);
export const TalkLink: React.FC<{ frame: number; k: number; from: P; to: P; t0: number; tone: string }> = ({
  frame,
  k,
  from,
  to,
  t0,
  tone,
}) => {
  const pr = clamp01((frame - t0) / LINK_DRAW);
  if (pr <= 0) return null;
  const tip = { x: from.x + (to.x - from.x) * pr, y: from.y + (to.y - from.y) * pr };
  const pk = pr >= 1 ? threadPackets({ frame, k, from, to, period: TALK_PERIOD, speed: 7, phase: 0 }) : [];
  return (
    <g>
      <line x1={from.x} y1={from.y} x2={tip.x} y2={tip.y} stroke={tone} strokeWidth={LINK_W} strokeLinecap="round" />
      {pk.map((q, i) => (
        <g key={i}>
          <circle cx={q.x} cy={q.y} r={PACKET_R} fill={ACCENT} />
          <circle cx={q.x} cy={q.y} r={PACKET_CORE} fill={INK} />
        </g>
      ))}
    </g>
  );
};

export const smooth01 = (v: number) => smoothstep(clamp01(v));
