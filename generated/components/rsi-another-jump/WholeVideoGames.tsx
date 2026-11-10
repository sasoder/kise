// ---------------------------------------------------------------------------
// WholeVideoGames (rsi-another-jump, cut 7). Dwarkesh style (styles/dwarkesh.md).
// Opaque 1080x1920, 23.976 fps, 149 frames.
//
// CHECK LINE: "next to the little 2022 card, today's model pours out whole games and a flood of prize-worthy
// maths papers — so much that the old card is a speck in the corner."
//
// THE LINE: "Whereas [model] can build whole video games from scratch and churns out so many
// Fields-Medal-worthy mathematical contributions that" [we become totally desensitized] (bracket on the speaker).
// WORD -> FRAME: Whereas 0 · [model] 3 · can 12 · build 17 · whole 30 · video 34 · games 40 · from 48 · scratch 54 ·
//   and 61 · churns 72 · out 81 · so 82 · many 88 · Fields-Medal-worthy 94 · mathematical 116 · contributions 123 ·
//   that 139.
// DURATION: the slot 7.382 -> 13.597 s = 6.215 s x 23.976 = 149 frames (sequence f177 -> f326; f0..f148).
//
// THE MOTION: one continuous pull-back (k 0.995 -> 0.278, ~3.6x, fastest during the dive, creeping to the last
// frame) from cut 2's resolved card, which drains to ACCENT_DEEP / INK_LO and ends as a small dim card in the
// top-left corner. Today's model, an unbranded bright agent dot (the model name was heard as "Aster" and is
// unverified, so no name and no mark), drops in from above the frame past the card, fans eight carets out on
// threads to eight code files flanking where the game will be (f10-18, "can build"), and dives through the
// window's space, the white window outline opening from where it crossed in (f18-35). The files are written as
// indented code bars and every block of the first screen flies out of a file's caret as a code bar, morphs into
// its tile and lands (top down, bricks to ground, f35-50); the white runner drops in on "from scratch" and runs,
// jumps the pits and the little staircase, collects coins and heads for the white goal flag while the level scrolls (to the last frame). From f70 ("churns")
// proof pages, each a white card with bar-lines, a sum, an integral and the white Fields medal, are flung out of
// the model at a rate that rises to "contributions" and fall into a pile that rises up the bottom of the frame
// like a flood (f97-145), then trickles. Orange = the AI and what it makes; white = people, structure, the medal.
//
// CONTACTS: a tile is emitted on the frame its file's caret is at that spot and lands at fLand (BUILDS); a page
// leaves from behind the model on fEmit and lands on fLand (PAGES); a coin is collected on the frame the runner's
// body reaches it (coinCollectAt).
//
// SHARED WORLD: cut 2 (`PassableLimerick`) is imported, never edited: the card's geometry, bars and caret
// (`barsAt(PL_LAST)`), its header and cut 2's camera (`plCamAt`). f0 is cut 2's f81 exactly (camera, sway clock,
// grid clock, card); the camera then continues from cut 2's state. Everything this cut adds is in
// `videoGamesWorld.ts`.
//
// SOURCES: the OpenAI mark is brandGlyphs `OPENAI` (cut 2's). The Fields Medal is drawn as a plain white disc with
// an inner ring, hung from a short V of ribbon (no profile: it read as a blob at phone size). The game is a generic
// platformer (bricks, coins, a little staircase, a white goal flag), not any one real game. No figures, no text
// but the card's own "GPT-3.5" label.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  GridBackground,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  smoothstep,
  squirclePath,
  worldTransform,
} from "../kits/dwarkesh/fieldShared";
import { OPENAI } from "../kits/dwarkesh/brandGlyphs";
import { INK, INK_HI, INK_LO, Label } from "../kits/dwarkesh/alignShared";
import {
  CARD_H,
  CARD_STROKE,
  CARD_W,
  CARD_X0,
  CARD_Y0,
  CARET_H,
  CARET_LEAD,
  CARET_W,
  GRID_W0,
  LABEL_SIZE,
  LABEL_TEXT,
  LABEL_X,
  LABEL_Y,
  MARK_SIZE,
  MARK_TONE,
  MARK_X,
  MARK_Y,
  OUTPUT_ACCENT,
  PL_CY_REST,
  PL_FPS,
  PL_LAST,
  WORD_H,
  barsAt,
  caretAt,
  resolvedCamera,
} from "./outputShared";
import {
  AGENT_R,
  BAR_LEAVES,
  BLOCKS,
  BUILDS,
  BUILD_FLIGHT,
  BUILD_SLOT,
  COINS,
  CODE_CARET_H,
  CODE_CARET_W,
  CODE_H,
  FEEDS,
  GOAL_COL,
  F_DRAIN0,
  OUTLINE_D0,
  PAGES,
  PAGE_H,
  PAGE_STROKE,
  PAGE_W,
  PERIM,
  PL_F0,
  RUNNER_H,
  RUNNER_W,
  T,
  TILES,
  VG_DURATION,
  WIN_H,
  WIN_STROKE,
  WIN_W,
  WIN_X0,
  WIN_Y0,
  agentAt,
  blockCaretAt,
  camAt,
  cardStrokeMul,
  coinCollectAt,
  drainAt,
  easeOutBack,
  outlineAt,
  pageAt,
  perimPoint,
  runnerAt,
  viewAt,
  writtenAt,
  type Build,
  type Tile,
} from "./videoGamesWorld";

export const FPS = PL_FPS;
export const DURATION = VG_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the joined cut: asserted at module load ---------------------------------
{
  const c = camAt(0);
  const r = resolvedCamera;
  if (c.k !== r.k || c.cx !== r.cx || c.cy !== r.cy) {
    throw new Error(`WholeVideoGames: f0 camera ${JSON.stringify(c)} is not cut 2's resolved camera`);
  }
  const done = barsAt(PL_LAST).every((b) => b.w === b.full);
  if (!done) throw new Error("WholeVideoGames: cut 2's card is not complete at PL_LAST");
}

// The caption bands, asserted on every frame: the window (once its ground is in), the card and the model at
// rest stay above y 1080.
for (let f = 0; f < DURATION; f++) {
  const c = camAt(f);
  const sy = (wy: number) => 960 + (wy - c.cy) * c.k;
  if (sy(CARD_Y0 + CARD_H) > 1078 || sy(CARD_Y0) < 30) {
    throw new Error(`WholeVideoGames f${f}: the card leaves its air (${sy(CARD_Y0).toFixed(0)}-${sy(CARD_Y0 + CARD_H).toFixed(0)})`);
  }
  if (f >= 37 && sy(WIN_Y0 + WIN_H) > 1080) throw new Error(`WholeVideoGames f${f}: the game's ground is in the caption band`);
  if (f >= 12) {
    const a = agentAt(f);
    if (sy(a.y) + AGENT_R * c.k > 1080) throw new Error(`WholeVideoGames f${f}: the model is in the caption band`);
  }
}

const CARD_TONE = makeTone(OUTPUT_ACCENT, ACCENT_DEEP);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// A page's own flat fill, a step under the field, so a pile of them reads as stacked cards.
const PAGE_FILL = "#545454";
const TILE_GAP = 10;

// ---------------------------------------------------------------------------
// THE 2022 CARD: cut 2's `OutputCard2022` markup, drawn from cut 2's exports, with its tones draining. At
// d = 0 it is the same markup with the same values (proved by the f0 difference image).
// ---------------------------------------------------------------------------
const OldCard: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const d = drainAt(frame);
  const bars = barsAt(PL_LAST);
  const c = caretAt(PL_LAST);
  const s = MARK_SIZE / 24;
  const accent = d <= 0 ? OUTPUT_ACCENT : CARD_TONE(d);
  const inkOp = lerp(INK_HI, INK_LO, d);
  return (
    <>
      <path
        d={squirclePath(CARD_W, CARD_H)}
        transform={`translate(${CARD_X0} ${CARD_Y0})`}
        fill="none"
        stroke={INK}
        strokeWidth={CARD_STROKE * cardStrokeMul(frame)}
        opacity={inkOp}
        style={{ filter: iconShadow(k) }}
      />
      <g style={{ filter: iconShadow(k, undefined, undefined, 0.27) }}>
        <g transform={`translate(${MARK_X} ${MARK_Y}) scale(${s})`}>
          {OPENAI.paths.map((p, i) => (
            <path key={i} d={p} fill={MARK_TONE} fillRule="evenodd" />
          ))}
        </g>
      </g>
      {bars.map((b, i) =>
        b.w < 0.5 ? null : (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width={b.w}
            height={WORD_H}
            rx={WORD_H / 2}
            fill={b.kind === "def" ? INK : accent}
            opacity={b.kind === "def" ? inkOp : OP_UNREAD_DOT}
          />
        ),
      )}
      <rect
        x={c.x + CARET_LEAD - CARET_W / 2}
        y={c.y + WORD_H / 2 - CARET_H / 2}
        width={CARET_W}
        height={CARET_H}
        rx={CARET_W / 2}
        fill={accent}
        opacity={OP_UNREAD_DOT}
      />
    </>
  );
};

// ---------------------------------------------------------------------------
// THE CODE inside the window, and the carets that write it. A bar leaves the code on the frame it flies off to
// become (part of) a tile.
// ---------------------------------------------------------------------------
const Code: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    {BLOCKS.map((blk) => {
      if (frame < blk.fLaunch) return null;
      const n = writtenAt(blk, frame);
      const out: React.ReactNode[] = [];
      blk.bars.forEach((b, i) => {
        const g = clamp01(n - i);
        if (g <= 0) return;
        if (frame >= (BAR_LEAVES.get(b) ?? Infinity)) return;
        const w = b.w * g;
        if (w < 0.5) return;
        out.push(<rect key={`b${i}`} x={b.x} y={b.y} width={w} height={CODE_H} rx={CODE_H / 2} fill={ACCENT} />);
      });
      const c = blockCaretAt(blk, frame);
      if (c && c.s > 0.01) {
        const w = CODE_CARET_W * c.s;
        const h = CODE_CARET_H * c.s;
        out.push(<rect key="c" x={c.x - w / 2} y={c.y - h / 2} width={w} height={h} rx={w / 2} fill={ACCENT} />);
      }
      return <g key={blk.id}>{out}</g>;
    })}
  </g>
);

// ---------------------------------------------------------------------------
// THE GAME: tiles, coins and the runner, in tile units on the window's view.
// ---------------------------------------------------------------------------
const tileRects = (kind: Tile["kind"] | "coin", x: number, y: number, w: number) => {
  // x, y: the cell's top-left in world px; w in tiles. Returns rect specs.
  const g = TILE_GAP / 2;
  return [{ x: x + g, y: y + g, w: w * T - 2 * g, h: T - 2 * g }];
};

const COIN_R = 0.27 * T;
const COIN_COLLECT_F = 6;

const TileShape: React.FC<{ kind: Tile["kind"]; x: number; y: number; w: number }> = ({ kind, x, y, w }) => (
  <>
    {tileRects(kind, x, y, w).map((r, i) => (
      <path key={i} d={squirclePath(r.w, r.h)} transform={`translate(${r.x} ${r.y})`} fill={ACCENT} />
    ))}
  </>
);

const Runner: React.FC<{ frame: number; vx: number }> = ({ frame, vx }) => {
  if (frame < 46) return null;
  const r = runnerAt(frame);
  const cx = WIN_X0 + (r.x - vx) * T;
  const feet = WIN_Y0 + r.feet * T;
  const W = RUNNER_W * T;
  const Hh = RUNNER_H * T;
  const sq = r.squash;
  const bw = W * (1 + 0.12 * sq);
  const bh = Hh * 0.74 * (1 - 0.14 * sq);
  const footH = Hh * 0.2;
  const footW = W * 0.34;
  // the run cycle: feet swap every 3 frames on the ground; tucked in the air
  const phase = Math.sin(((frame - 52) / 6) * Math.PI * 2);
  const stride = r.air ? 0.12 : 0.2 * phase;
  const bodyY = feet - footH * 0.75 - bh;
  return (
    <g>
      <path d={squirclePath(footW, footH)} transform={`translate(${cx - W * 0.3 + stride * W - footW / 2} ${feet - footH})`} fill={INK} />
      <path d={squirclePath(footW, footH)} transform={`translate(${cx + W * 0.22 - stride * W - footW / 2} ${feet - footH})`} fill={INK} />
      <path d={squirclePath(bw, bh, 0.22)} transform={`translate(${cx - bw / 2} ${bodyY})`} fill={INK} />
      {/* the eye, looking where it runs */}
      <rect x={cx + bw * 0.12} y={bodyY + bh * 0.24} width={bw * 0.16} height={bh * 0.3} rx={bw * 0.08} fill={BG_BASE} />
    </g>
  );
};

/** A core bar's flight from its place in the code to its tile's slot, morphing from bar to block. */
const flightOf = (b: Build, frame: number) => {
  const a = { x: b.core.x + b.core.w / 2, y: b.core.y + CODE_H / 2 };
  const tgt = BUILD_SLOT(b);
  const u = clamp01((frame - b.fEmit) / BUILD_FLIGHT);
  const e = easeOutBack(u, 1.4);
  // a shallow arc over the straight line
  const lift = -0.15 * Math.hypot(tgt.x - a.x, tgt.y - a.y) * Math.sin(Math.PI * u);
  const x = a.x + (tgt.x - a.x) * e;
  const y = a.y + (tgt.y - a.y) * e + lift;
  const m = smoothstep(u * 1.15);
  return { x, y, m };
};

/** The level's end: a small white flag on a pole, standing on the ground at GOAL_COL. */
const GoalFlag: React.FC<{ frame: number; vx: number }> = ({ frame, vx }) => {
  const x = WIN_X0 + (GOAL_COL + 0.5 - vx) * T;
  if (x > WIN_X0 + WIN_W + T || x < WIN_X0 - T) return null;
  const base = WIN_Y0 + 10 * T + TILE_GAP / 2;
  const top = WIN_Y0 + 3.6 * T;
  const pw = WIN_STROKE;
  const fy0 = top + 0.3 * T;
  const fy1 = top + 1.25 * T;
  const tipY = (fy0 + fy1) / 2 + 0.07 * T * Math.sin(frame * 0.35);
  return (
    <g fill={INK}>
      <rect x={x - pw / 2} y={top} width={pw} height={base - top} rx={pw / 2} />
      <circle cx={x} cy={top} r={0.15 * T} />
      <path d={`M${x} ${fy0} L${x - 1.05 * T} ${tipY} L${x} ${fy1} Z`} strokeLinejoin="round" stroke={INK} strokeWidth={pw} />
    </g>
  );
};

const Game: React.FC<{ frame: number }> = ({ frame }) => {
  const vx = viewAt(frame);
  const landed = (b: Build) => frame >= b.fLand;
  const byKey = new Map(BUILDS.map((b) => [b.key, b]));
  const tiles: React.ReactNode[] = [];
  TILES.forEach((t, i) => {
    const b = byKey.get(`${t.kind}:${t.col}:${t.row}`);
    if (b && !landed(b)) return;
    const x = WIN_X0 + (t.col - vx) * T;
    if (x > WIN_X0 + WIN_W + T || x + t.w * T < WIN_X0 - T) return;
    tiles.push(<TileShape key={i} kind={t.kind} x={x} y={WIN_Y0 + t.row * T} w={t.w} />);
  });
  const coins: React.ReactNode[] = [];
  COINS.forEach((c, i) => {
    const b = byKey.get(`coin:${c.col}:${c.row}`);
    if (b && !landed(b)) return;
    const fc = coinCollectAt(c);
    const t = frame - fc;
    if (t >= COIN_COLLECT_F) return;
    const up = t > 0 ? 0.7 * T * Math.sin((clamp01(t / COIN_COLLECT_F) * Math.PI) / 2) : 0;
    const sc = t > 0 ? 1 - clamp01(t / COIN_COLLECT_F) : 1;
    const x = WIN_X0 + (c.col + 0.5 - vx) * T;
    if (x > WIN_X0 + WIN_W + T || x < WIN_X0 - T) return;
    const y = WIN_Y0 + (c.row + 0.5) * T - up;
    coins.push(
      <g key={i}>
        <circle cx={x} cy={y} r={COIN_R * sc} fill={ACCENT} />
        <rect x={x - COIN_R * 0.16 * sc} y={y - COIN_R * 0.52 * sc} width={COIN_R * 0.32 * sc} height={COIN_R * 1.04 * sc} rx={COIN_R * 0.16 * sc} fill={BG_BASE} opacity={0.35} />
      </g>,
    );
  });
  return (
    <g clipPath="url(#vgView)">
      {tiles}
      <GoalFlag frame={frame} vx={vx} />
      {coins}
      <Runner frame={frame} vx={vx} />
    </g>
  );
};

const TilesInFlight: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    {/* the feeds: every other bar of the code flies into its tile and shrinks into it */}
    {FEEDS.map((fd, i) => {
      if (frame < fd.fEmit || frame >= fd.fLand) return null;
      const bd = BUILDS[fd.build];
      const a = { x: fd.bar.x + fd.bar.w / 2, y: fd.bar.y + CODE_H / 2 };
      const tgt = BUILD_SLOT(bd);
      const u = clamp01((frame - fd.fEmit) / (fd.fLand - fd.fEmit));
      const e = u * u * (3 - 2 * u);
      const lift = -0.12 * Math.hypot(tgt.x - a.x, tgt.y - a.y) * Math.sin(Math.PI * u);
      const sc = 1 - smoothstep((u - 0.45) / 0.55);
      const w = fd.bar.w * sc;
      const h = CODE_H * Math.max(sc, 0.0001);
      if (w < 0.5) return null;
      const x = a.x + (tgt.x - a.x) * e;
      const y = a.y + (tgt.y - a.y) * e + lift;
      return <rect key={`f${i}`} x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={ACCENT} />;
    })}
    {/* the cores: a code bar becomes the block */}
    {BUILDS.map((b, i) => {
      if (frame < b.fEmit || frame >= b.fLand) return null;
      const { x, y, m } = flightOf(b, frame);
      const bw = b.core.w;
      if (b.kind === "coin") {
        const w = lerp(bw, 2 * COIN_R, m);
        const h = lerp(CODE_H, 2 * COIN_R, m);
        return <rect key={i} x={x - w / 2} y={y - h / 2} width={w} height={h} rx={Math.min(w, h) / 2} fill={ACCENT} />;
      }
      const rects = tileRects(b.kind, 0, 0, b.w);
      const cx0 = (b.w * T) / 2;
      const cy0 = T / 2;
      return (
        <g key={i}>
          {rects.map((r, j) => {
            const w = lerp(bw / rects.length, r.w, m);
            const h = lerp(CODE_H, r.h, m);
            const rx = x + (r.x + r.w / 2 - cx0) * m - w / 2;
            const ry = y + (r.y + r.h / 2 - cy0) * m - h / 2;
            const round = h / Math.min(w, h) > 0 && m < 0.5 ? 0.5 : 0.012;
            return <path key={j} d={squirclePath(w, h, round)} transform={`translate(${rx} ${ry})`} fill={ACCENT} />;
          })}
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------------------
// THE WINDOW OUTLINE: one squircle, revealed by a dash centred where the dive crossed the top edge.
// ---------------------------------------------------------------------------
const WindowOutline: React.FC<{ frame: number; k: number }> = ({ frame, k }) => {
  const u = outlineAt(frame);
  if (u <= 0) return null;
  const half = (u * PERIM) / 2;
  // squirclePath starts on the top edge at (w - p, 0), clockwise; positions below are clockwise from the
  // top-left corner, so shift by that start
  const r = Math.max(0.012 * Math.min(WIN_W, WIN_H), 2);
  const start = WIN_W - 1.6 * r;
  const norm = (d: number) => ((((d - start) % PERIM) + PERIM) % PERIM) / PERIM;
  const full = u >= 1;
  const heads = full ? [] : [perimPoint(OUTLINE_D0 - half), perimPoint(OUTLINE_D0 + half)];
  return (
    <g>
      <path
        d={squirclePath(WIN_W, WIN_H)}
        transform={`translate(${WIN_X0} ${WIN_Y0})`}
        fill="none"
        stroke={INK}
        strokeWidth={WIN_STROKE}
        opacity={INK_HI}
        pathLength={1}
        strokeDasharray={full ? undefined : `${u} ${Math.max(1e-4, 1 - u)}`}
        strokeDashoffset={full ? undefined : -norm(OUTLINE_D0 - half)}
        style={{ filter: iconShadow(k) }}
      />
      {heads.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={WIN_STROKE * 1.15} fill={ACCENT} />
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE PAGES: a proof page with its Fields medal. Local coordinates, centred.
// ---------------------------------------------------------------------------
const SIGMA = "M-30 -36 H30 V-24 M30 -36 H-30 L4 0 L-30 36 H30 V24";
const INTEGRAL = "M18 -40 C10 -46 2 -40 0 -26 L-2 26 C-4 40 -12 46 -20 40";
const MEDAL_R = 88;

/** stamp: 0 while the page flies (the medal is an empty white outline), 0 → 1 over STAMP_F frames from the landing. */
const STAMP_F = 3;
const PageCard: React.FC<{ seed: number; stamp: number }> = ({ seed, stamp }) => {
  const w = PAGE_W;
  const h = PAGE_H;
  const x0 = -w / 2;
  const y0 = -h / 2;
  const pad = 46;
  const H = (k: number) => hash(seed * 7 + 3, k);
  const lines: React.ReactNode[] = [];
  // the title, then prose lines
  lines.push(<rect key="t" x={x0 + pad} y={y0 + 52} width={(w - 2 * pad) * (0.5 + 0.25 * H(1))} height={30} rx={15} fill={ACCENT} />);
  for (let i = 0; i < 3; i++) {
    const lw = (w - 2 * pad) * (i === 2 ? 0.5 + 0.2 * H(3 + i) : 0.82 + 0.18 * H(3 + i));
    lines.push(<rect key={`l${i}`} x={x0 + pad} y={y0 + 120 + i * 44} width={lw} height={20} rx={10} fill={ACCENT} />);
  }
  // the maths line: a sum, a bar, an equals, an integral
  const my = y0 + 300;
  lines.push(
    <g key="m" transform={`translate(${x0 + pad + 34} ${my})`} fill="none" stroke={ACCENT} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round">
      <path d={SIGMA} />
      <rect x={52} y={-10} width={70 + 40 * H(9)} height={20} rx={10} fill={ACCENT} stroke="none" />
      <path d="M150 -10 H186 M150 12 H186" />
      <g transform="translate(222 0)">
        <path d={INTEGRAL} />
      </g>
      <rect x={250} y={-10} width={60} height={20} rx={10} fill={ACCENT} stroke="none" />
    </g>,
  );
  // two closing lines left of the medal
  lines.push(<rect key="c0" x={x0 + pad} y={y0 + 392} width={(w - 2 * pad) * 0.48} height={20} rx={10} fill={ACCENT} />);
  lines.push(<rect key="c1" x={x0 + pad} y={y0 + 436} width={(w - 2 * pad) * (0.3 + 0.15 * H(11))} height={20} rx={10} fill={ACCENT} />);
  // the medal, low on the right: a ribbon V and the disc
  const mx = x0 + w - pad - MEDAL_R;
  const myy = y0 + h - pad - MEDAL_R;
  // the ribbon: two short straps crossing into a V above the disc
  const rTop = myy - MEDAL_R - 60;
  const rBot = myy - MEDAL_R + 34;
  return (
    <g>
      <path d={squirclePath(w, h)} transform={`translate(${x0} ${y0})`} fill={PAGE_FILL} stroke={INK} strokeWidth={PAGE_STROKE} />
      {lines}
      {/* the medal, stamped on arrival: its outline flies with the page, the landing presses it in (white fill,
          a short punch about the disc) */}
      <g transform={`translate(${mx} ${myy}) scale(${1 + 0.2 * Math.sin(Math.PI * stamp)}) translate(${-mx} ${-myy})`}>
        <g fill={INK} fillOpacity={stamp} stroke={INK} strokeWidth={PAGE_STROKE} strokeLinejoin="round">
          <path d={`M${mx - 66} ${rTop} L${mx - 28} ${rTop} L${mx + 12} ${rBot} L${mx - 26} ${rBot} Z`} />
          <path d={`M${mx + 66} ${rTop} L${mx + 28} ${rTop} L${mx - 12} ${rBot} L${mx + 26} ${rBot} Z`} />
          <circle cx={mx} cy={myy} r={MEDAL_R} fill={stamp > 0 ? INK : PAGE_FILL} fillOpacity={1} />
        </g>
        {/* the inner ring, pressed in by the stamp */}
        {stamp > 0 && (
          <circle cx={mx} cy={myy} r={MEDAL_R * 0.6} fill="none" stroke={PAGE_FILL} strokeWidth={PAGE_STROKE * 1.1} opacity={stamp} />
        )}
      </g>
    </g>
  );
};

const Pages: React.FC<{ frame: number }> = ({ frame }) => (
  <g>
    {PAGES.map((p) => {
      const s = pageAt(p, frame);
      if (!s) return null;
      return (
        <g key={p.i} transform={`translate(${s.x.toFixed(2)} ${s.y.toFixed(2)}) rotate(${s.rot.toFixed(3)}) scale(${s.s.toFixed(4)})`}>
          <PageCard seed={p.i} stamp={clamp01((frame - p.fLand) / STAMP_F)} />
        </g>
      );
    })}
  </g>
);

// ---------------------------------------------------------------------------
// TODAY'S MODEL: one bright dot (a dot with a tail read as a falling drop, so it dives as a plain dot).
// ---------------------------------------------------------------------------
const Agent: React.FC<{ frame: number }> = ({ frame }) => {
  const p = agentAt(frame);
  return <circle cx={p.x} cy={p.y} r={AGENT_R * breath(frame, 0.37)} fill={ACCENT} />;
};

const WholeVideoGames: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const { cx, cy, k } = camAt(frame);
  const { tx, ty } = worldTransform(cx, cy, k);
  const cam0 = camAt(0);
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={GRID_W0 + PL_F0 + frame}
        cy={cy}
        cyRest={PL_CY_REST}
        cx={cx}
        cxRest={cam0.cx}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={1080}
            height={1920}
            viewBox="0 0 1080 1920"
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              <clipPath id="vgView" clipPathUnits="userSpaceOnUse">
                <rect x={WIN_X0} y={WIN_Y0} width={WIN_W} height={WIN_H} />
              </clipPath>
            </defs>
            <OldCard frame={frame} k={k} />
            {frame > F_DRAIN0 ? (
              <>
                <Code frame={frame} />
                <Game frame={frame} />
                <WindowOutline frame={frame} k={k} />
                <TilesInFlight frame={frame} />
                <Pages frame={frame} />
                <Agent frame={frame} />
              </>
            ) : null}
          </svg>
          <Label
            k={k}
            x={LABEL_X}
            y={LABEL_Y}
            text={LABEL_TEXT}
            inT={1}
            size={LABEL_SIZE}
            align="left"
            opacity={lerp(INK_HI, INK_LO, drainAt(frame))}
          />
        </div>
      </AbsoluteFill>
      <Vignette />
    </AbsoluteFill>
  );
};

export default WholeVideoGames;
