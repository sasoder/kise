// ---------------------------------------------------------------------------
// CompleteVideoGame (sam-kids-mind-blown, cut 16). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 79 frames.
//
// CHECK LINE: "A little kid, feet not even touching the floor, just built a whole working video game."
//
// THE LINE: "(and like) watching a, you know, eight or ten year old make a complete video game (with)"
// WORD -> FRAME: like 2 · watching 7 · a 19 · eight 24 · or 31 · ten 34 · year 37 · old 41 · make 44 · a 51 · complete 55 ·
//   video 62 · game 69 · with 76.
// DURATION: the slot 16.850 -> 20.145 s = 3.295 s x 23.976 = 79 frames (f0..f78).
//
// THE MOTION: one push-in from the kid to inside the game. The kid sits on a stool much too tall, feet swinging, tongue out then
// a grin, hands on the laptop; the camera eases past him from f0 while the lid squares up to us (yaw 30 -> 0). From f34 the blinking
// amber cursor grows into a column and sweeps the level left to right, slower, with the first ground and the stone tower up before
// "make": ground rising out of the screen's foot, the tower out of the ground, platforms and coins off the column; at its last stop
// (f63) the column IS the flagpole and the flag unfurls ("complete"). The kid sits back as it starts: hands to the lap, head, arms and
// knees off the left edge by about f50, feet hooked back under the stool. The end frame shows no body part, only the laptop on its
// table. On "video" a cat on a rocket comes up from behind the tower; on "game" (contact f69) it takes the first coin, the second at
// f73, and it flies on to the last frame. Every game pixel sits on one 80x50 grid: whole cells on the game's own clock.
// CONTACTS: cursor starts f34; column lands at the pole f63; flag complete f68; cat appears f62; first coin contact f69, rise from f70; second coin f73.
// AMBER = what gets made: coins, the cursor column / flagpole, the flag, the rocket flame, the screen's bloom; cream sky, board blocks; the rocket's nose cone.
//
// SOURCES: OpenAI blossom via kidsShared (ChatGPTGlyph, Commons "OpenAI logo 2025 (symbol)"). No figures.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, StoutStage, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, makeClockCam, makePoolTrack } from "../kits/cheeky-pint/museShared";
import { Desk, Kid, Laptop, Stool, amberGlowFilter, blinkAt, deskSil, laptopFrame, laptopSil, personSil, stoolSil, swingAt, worldToLocal } from "./kidsShared";

export const FPS = 24000 / 1001;
export const DURATION = 79;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE WORLD
// ---------------------------------------------------------------------------
const FLOOR_Y = 1290;
const DESK = { x0: 405, x1: 1050, y: 800, floorY: FLOOR_Y, depth: 110, legInset: 76 };
const LAP = { x: 660, y: 838, w: 340 };
const KID = { x: 350, y: 950, scale: 1.34 };
const STOOL = { x: KID.x - 10, seatY: KID.y, floorY: FLOOR_Y, w: 176 };
const YAW0 = 30;
const PITCH0 = 14;
const PITCH1 = 12;
const yawAt = (f: number) => lerp(YAW0, 0, smoothstep((f + 6) / 62));
const pitchAt = (f: number) => lerp(PITCH0, PITCH1, smoothstep((f + 6) / 62));

// the final framing: the screen spans 85 % of the frame, centred on y 790 (the ground bricks end above y 1080)
const lapEnd = laptopFrame({ ...LAP, yaw: 0, pitch: PITCH1 });
const K_END = (1080 * 0.85) / lapEnd.scr.w;
const scrMid = lapEnd.screenPoint(0.5, 0.5);
const LOOK_END = { x: scrMid[0], y: scrMid[1] + (960 - 790) / K_END };
const LOOK_0 = { x: 542, y: 815, k: 1.3 };
const CAM = makeClockCam(
  LOOK_0,
  [
    { f0: -14, f1: 66, k: K_END, dx: LOOK_END.x - LOOK_0.x, dy: LOOK_END.y - LOOK_0.y, warp: 0.92 },
    { f0: 58, f1: 96, k: K_END * 1.012 },
  ],
  DURATION,
);
const POOL = makePoolTrack({ x: 560, y: 760, strength: 1.5 }, [{ f0: 0, f1: 60, x: scrMid[0], y: scrMid[1] }], DURATION);

// ---------------------------------------------------------------------------
// THE GAME: one grid, 80 x 50 cells. Everything below is whole cells on the game's own clock.
// ---------------------------------------------------------------------------
const CELL_WORLD = lapEnd.scr.w / 80;
const COLS = 80;
const ROWS = 50;
const GROUND = 43; // the top row of the ground (the screen ends above band 1)
const SKY = COLOR.cream;
const INK = "#4A3122";
const BRICK = COLOR.board;
const BRICK_HI = mixHex(COLOR.board, COLOR.cream, 0.42);
const BRICK_LO = mixHex(COLOR.boardFoot, COLOR.ground, 0.32);
const GRID_DOT = mixHex(COLOR.creamFoot, COLOR.board, 0.45);
const AMB = COLOR.amberTop;
const AMB_LO = COLOR.amberFoot;
const AMB_HI = COLOR.amberHot;
const PIT: [number, number] = [41, 47];
const TOWER = { x0: 5, x1: 22, top: 29 };
const PLATFORMS = [
  { x0: 25, x1: 36, y: 34 },
  { x0: 52, x1: 63, y: 25 },
  { x0: 66, x1: 71, y: 34 },
];
const COINS = [
  { x: 30, y: 20 },
  { x: 38, y: 23 },
  { x: 54, y: 17 },
  { x: 60, y: 17 },
  { x: 67, y: 26 },
];
const POLE_X = 74;
const POLE_TOP = 10;
const FLAG = { w: 10, h: 8 };

// the sweep's front column on the game clock: starts on "make", one sweep, lands before "game"
const SWEEP = { f0: 34, f1: 63 };
const CURSOR_X = 3;
const frontAt = (f: number) => {
  const u = clamp01((f - SWEEP.f0) / (SWEEP.f1 - SWEEP.f0));
  // eases off the mark, constant, a short landing at the pole
  const e = u < 0.16 ? (u * u) / (2 * 0.16) / 0.92 : u > 0.84 ? 1 - ((1 - u) * (1 - u)) / (2 * 0.16) / 0.92 : (u - 0.08) / 0.92;
  return Math.floor(lerp(CURSOR_X, POLE_X, e));
};
/** the frame the front reaches column c */
const ARRIVE: number[] = (() => {
  const out = new Array(COLS + 1).fill(Infinity);
  for (let f = 0; f < DURATION; f++) {
    const c = f < SWEEP.f0 ? -1 : frontAt(f);
    for (let i = 0; i <= c; i++) if (out[i] === Infinity) out[i] = f;
  }
  // past the pole the ground runs on to the screen's edge, as the column lands
  for (let i = POLE_X + 1; i <= COLS; i++) out[i] = out[POLE_X] + Math.ceil((i - POLE_X) / 3);
  return out;
})();

type Cell = [number, number, string];
const rowsToPaths = (cells: Cell[]) => {
  // merge by colour and row into runs; a hair of overlap closes the seams under the moving camera
  const by = new Map<string, Map<number, number[]>>();
  for (const [x, y, c] of cells) {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) continue;
    let m = by.get(c);
    if (!m) by.set(c, (m = new Map()));
    let r = m.get(y);
    if (!r) m.set(y, (r = []));
    r.push(x);
  }
  const out: { c: string; d: string }[] = [];
  by.forEach((m, c) => {
    let d = "";
    m.forEach((xs, y) => {
      xs.sort((a, b) => a - b);
      let a = xs[0];
      let p = a;
      const flush = () => {
        d += `M${a - 0.02} ${y - 0.02}H${p + 1.02}V${y + 1.02}H${a - 0.02}Z`;
      };
      for (let i = 1; i < xs.length; i++) {
        if (xs[i] !== p && xs[i] !== p + 1) {
          flush();
          a = xs[i];
        }
        p = xs[i];
      }
      flush();
    });
    out.push({ c, d });
  });
  return out;
};
const Cells: React.FC<{ cells: Cell[] }> = ({ cells }) => (
  <>
    {rowsToPaths(cells).map((q) => (
      <path key={q.c} d={q.d} fill={q.c} />
    ))}
  </>
);

// plain big stones: a lit top row on the mass, one soft seam tone, courses staggered by half a stone
const BLOCK_SEAM = mixHex(BRICK, BRICK_LO, 0.38);
const brickAt = (x: number, y: number, top: number, bw = 8, bh = 8) => {
  if (y === top) return BRICK_HI;
  const v = y - top;
  const course = Math.floor(v / bh);
  return (x + course * Math.floor(bw / 2)) % bw === bw - 1 || v % bh === bh - 1 ? BLOCK_SEAM : BRICK;
};

// ---- the coin's four spin frames (5 x 6 cells) ----
const COIN_FRAMES = [
  [".AAA.", "AHHAL", "AHAAL", "AHAAL", "AAALL", ".LLL."],
  [".AAA.", ".AHL.", ".AHL.", ".AAL.", ".AAL.", ".LLL."],
  ["..AA.", "..AL.", "..AL.", "..AL.", "..AL.", "..LL."],
  [".AAA.", ".AHL.", ".AHL.", ".AAL.", ".AAL.", ".LLL."],
];
const TONE: Record<string, string> = { A: AMB, H: AMB_HI, L: AMB_LO, K: INK, C: SKY, B: BRICK, D: BRICK_LO, E: BRICK_HI };
const stamp = (rows: string[], x: number, y: number): Cell[] => {
  const out: Cell[] = [];
  rows.forEach((r, j) => {
    for (let i = 0; i < r.length; i++) if (r[i] !== ".") out.push([x + i, y + j, TONE[r[i]]]);
  });
  return out;
};

// ---- the cat astride its rocket, facing right: 20 x 15 cells. Pointed amber nose cone, two swept fins, one porthole ----
const CAT = [
  "...........K...K....",
  "...........KK.KK....",
  "...........KKKKK....",
  "....K......KCKCK....",
  "....K......KKKKK....",
  "....KK.....KKEKK....",
  ".DD..KKKKKKKKKK.....",
  ".DDD..KKKKKKKK......",
  "..DDEEEEEEEEEEEAA...",
  "..DEEEEKKKEEEEEAHA..",
  "..DBBBBKCKBBBBBAAAAA",
  "..DBBBBKKKBBBBBAAL..",
  "..DDDDDDDDDDDDDLL...",
  ".DDD................",
  ".DD.................",
];
const FLAME_A = ["", "", "", "", "", "", "", "", "", "....AA", "..AHHA", "....AL", ""];
const FLAME_B = ["", "", "", "", "", "", "", "", "", "...AAA", "AAHHHA", "...ALL", ""];
const CAT_NOSE = 19;
const CAT_H = CAT.length;

/** the cat's path, whole cells on the game clock: up from behind the tower from f62, then right at 2 cells a frame, a hop to the first coin
 *  (contact f69), easing down, bobbing on threes to the last frame */
const CAT_RISE: Record<number, number> = { 62: 27, 63: 22, 64: 18, 65: 14, 66: 13, 67: 12, 68: 12, 69: 12 };
const catAt = (f: number) => {
  if (f < 62) return null;
  const x = 3 + Math.max(0, f - 65) * 2;
  const y = f <= 69 ? CAT_RISE[f] : 12 + Math.round((f - 69) * 0.5) + (Math.floor(f / 3) % 2 ? -1 : 0);
  return { x, y };
};
const coinHitFrame = (c: { x: number; y: number }) => {
  for (let f = 62; f < DURATION; f++) {
    const a = catAt(f);
    if (a && c.x <= a.x + CAT_NOSE && c.x + 4 >= a.x + 3 && c.y + 5 >= a.y && c.y <= a.y + CAT_H - 1) return f;
  }
  return Infinity;
};
const COIN_HITS = COINS.map(coinHitFrame);

const Game: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const front = f < SWEEP.f0 ? -1 : frontAt(f);
  const blocks: Cell[] = [];
  const amber: Cell[] = [];
  // the empty level: the editor's grid of dots, wiped by the front
  const dots: Cell[] = [];
  for (let y = 4; y < ROWS; y += 6) for (let x = 3; x < COLS; x += 6) if (x > front + 1) dots.push([x, y, GRID_DOT]);
  // the ground: each column rises out of the foot of the screen when the front reaches it
  for (let x = 0; x < COLS; x++) {
    if (x > front) break;
    if (x >= PIT[0] && x < PIT[1]) continue;
    const rise = Math.max(0, ROWS - GROUND - (f - ARRIVE[x]) * 3);
    for (let y = GROUND; y < ROWS; y++) {
      const yy = y + rise;
      if (yy < ROWS) blocks.push([x, yy, brickAt(x, y, GROUND)]);
    }
  }
  // the stone tower, up out of the ground: plain blocks, three merlons; the cat comes up from behind it
  if (front >= TOWER.x0) {
    const age = f - ARRIVE[TOWER.x0];
    const rise = Math.max(0, GROUND - TOWER.top - age * 3);
    for (let x = TOWER.x0; x <= TOWER.x1; x++) {
      if (x > front) break;
      const merlon = (x - TOWER.x0) % 7 < 4;
      const y0 = TOWER.top + (merlon ? 0 : 2);
      for (let y = y0; y < GROUND - rise; y++) blocks.push([x, y + rise, y === y0 ? BRICK_HI : brickAt(x, y, TOWER.top + 2, 6, 6)]);
    }
  }
  // the platforms: laid by the column, each cell settling one cell as it lands
  for (const p of PLATFORMS) {
    for (let x = p.x0; x <= p.x1; x++) {
      if (x > front) break;
      const age = f - ARRIVE[x];
      const dy = age < 2 ? -1 : 0;
      for (let v = 0; v < 4; v++) blocks.push([x, p.y + v + dy, brickAt(x, p.y + v, p.y, 6, 8)]);
    }
  }
  // the coins: popped off the column, up three then down
  COINS.forEach((c, i) => {
    if (c.x + 2 > front) return;
    const hit = COIN_HITS[i];
    const age = f - ARRIVE[c.x + 2];
    const spin = COIN_FRAMES[Math.floor((f + i * 3) / 3) % 4];
    if (f >= hit) {
      // taken: flies up by whole cells, spinning fast, into three sparks, then gone
      const t = f - hit;
      if (t < 5) amber.push(...stamp(COIN_FRAMES[t % 4], c.x, c.y - t * 2));
      else if (t < 8) {
        const r = t - 4;
        const cy = c.y - 8;
        amber.push([c.x + 2 - r, cy, AMB], [c.x + 2 + r, cy, AMB], [c.x + 2, cy - r, AMB_HI]);
      }
      return;
    }
    const dy = age < 2 ? 3 : age < 4 ? -2 : age < 5 ? -1 : 0;
    amber.push(...stamp(spin, c.x, c.y + dy));
  });
  // the cursor: blinks in the empty level until "make", then grows to a full column and sweeps; at the pole it stays
  const growTop = f < SWEEP.f0 ? ROWS : Math.max(POLE_TOP, GROUND - 9 - (f - SWEEP.f0) * 7);
  if (f < SWEEP.f0) {
    if (Math.floor(f / 7) % 2 === 0 || f >= SWEEP.f0 - 3) for (let y = GROUND - 9; y < GROUND; y++) for (let x = CURSOR_X; x < CURSOR_X + 3; x++) amber.push([x, y, x === CURSOR_X ? AMB_HI : AMB]);
  } else {
    const at = Math.min(front, POLE_X);
    for (let y = growTop; y < GROUND; y++) for (let x = at; x < at + 2; x++) amber.push([x, y, x === at ? AMB_HI : AMB]);
  }
  // the flag: a pennant unfurling from the pole, cell by cell, as the column lands; its tip flutters on threes
  if (front >= POLE_X) {
    const age = f - ARRIVE[POLE_X];
    const wn = Math.min(FLAG.w + (Math.floor(f / 3) % 2), 1 + Math.floor(age * 2.5));
    for (let i = 1; i <= wn; i++) {
      const h = Math.max(1, Math.round(FLAG.h * (1 - (i - 1) / (FLAG.w + 1))));
      const y0 = POLE_TOP + 1 + Math.floor((FLAG.h - h) / 2);
      for (let j = 0; j < h; j++) amber.push([POLE_X - i, y0 + j, j === 0 ? AMB_HI : j === h - 1 ? AMB_LO : AMB]);
    }
  }
  // the cat: only what has cleared the tower's top shows; the flame the same
  const cat = catAt(f);
  const catCells: Cell[] = [];
  const flame: Cell[] = [];
  if (cat) {
    const cut = (c: Cell) => f > 65 || c[1] < TOWER.top;
    const isAmber = (c: Cell) => c[2] === AMB || c[2] === AMB_HI || c[2] === AMB_LO;
    const sprite = stamp(CAT, cat.x, cat.y).filter(cut);
    catCells.push(...sprite.filter((c) => !isAmber(c)));
    flame.push(...sprite.filter(isAmber));
    flame.push(...stamp(Math.floor(f / 2) % 2 ? FLAME_A : FLAME_B, cat.x - 4, cat.y).filter(cut));
  }
  const bloomK = k * CELL_WORLD;
  return (
    <g>
      <rect x={0} y={0} width={COLS} height={ROWS} fill={SKY} />
      <Cells cells={dots} />
      <Cells cells={blocks} />
      <g style={{ filter: amberGlowFilter(bloomK) }}>
        <Cells cells={amber} />
        <Cells cells={flame} />
      </g>
      <Cells cells={catCells} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE PICTURE
// ---------------------------------------------------------------------------
const CompleteVideoGame: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const yaw = yawAt(S);
  const pitch = pitchAt(S);
  // the kid is nearer the lens than the laptop: he and the stool slide off the left a little faster than the camera alone would carry them
  const kidX = KID.x - 30 * smoothstep((S - 30) / 22);
  const kid = { ...KID, x: kidX };
  const stool = { ...STOOL, x: STOOL.x + kidX - KID.x };
  const lap = { ...LAP, yaw, pitch };
  const F = laptopFrame(lap);
  // the hands tap on the deck; the targets move with the deck as it squares up
  const tap = (ph: number) => (Math.floor((S + ph) / 3) % 2 ? -3 : 0);
  // both hands leave the keys for the lap as the kid sits back to watch (far f26-44, near f34-48): off the frame's left edge with him
  const hN = F.deck(0.06, 0.55);
  const hFk = F.deck(0.16, 0.42);
  const lapN: [number, number] = [kidX + 34, KID.y - 30];
  const lapF: [number, number] = [kidX + 44, KID.y - 22];
  const leaveN = smoothstep((S - 34) / 14);
  const leaveF = smoothstep((S - 26) / 18);
  const near = worldToLocal([lerp(hN[0], lapN[0], leaveN), lerp(hN[1] + tap(0) * (1 - leaveN), lapN[1], leaveN)], kid);
  const far = worldToLocal([lerp(hFk[0], lapF[0], leaveF), lerp(hFk[1] + tap(1) * (1 - leaveF), lapF[1], leaveF)], kid);
  const glow = smoothstep((S - 34) / 30);
  const kidP = {
    ...kid,
    hand: near,
    farHand: far,
    // the pendulum; as the camera's edge reaches the knees the feet hook back under the stool, off the frame
    swing: lerp(swingAt(S, 17, 26, 4), -44, smoothstep((S - 40) / 14)),
    swingFar: lerp(swingAt(S, 17, 26, 17), -50, smoothstep((S - 40) / 14)),
    lean: lerp(2, -12, smoothstep((S - 28) / 22)),
    headTilt: lerp(6, 0, smoothstep(S / 60)) + 1.5 * Math.sin(S / 11),
    // tongue in before the head reaches the frame edge, a grin as the game starts
    tongue: 1 - smoothstep((S - 13) / 10),
    smile: lerp(0.6, 1, smoothstep((S - 18) / 16)),
    blink: blinkAt(S, 1, 61),
    amberLight: glow * 0.7,
  };
  const pool = POOL(S);
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={{ x: pool.x, y: pool.y, strength: pool.strength }}>
      <UnionShadow sil={[...stoolSil(stool), ...deskSil(DESK), ...laptopSil(lap), ...personSil(kidP)]} s={1.2} />
      <Stool {...stool} />
      <Desk {...DESK} />
      <Laptop {...lap} shadow={false} k={cam.k} glow={glow * 0.9} cols={COLS} rows={ROWS} screen={<Game f={S} k={cam.k} />} />
      <Kid {...kidP} shadow={false} />
    </StoutStage>
  );
};

export default CompleteVideoGame;
