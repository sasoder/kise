// ---------------------------------------------------------------------------
// NoBenchmarkForNice (sam-benchmaxxing, cut 18), REV 2 (user note 2026-10-29, notes/REV2_18_NoBenchmarkForNice.md:
// the nice tile's flat smile glyph becomes cut 9's OpenAI buddy, no rule under it). Cheeky Pint style carried into the AIR, as the Scott Kirby clips
// (styles/cheeky-pint.md; COMMON.md). The clip's world: benchShared's BenchStage (AirStage over the airfield apron),
// BenchTile, BenchColumn, Slot, ContactShadow, imported read-only; cut 9's OpenAI buddy (openaiBuddy3d.tsx
// OpenAIBuddyLayer, a WebGL layer in BenchStage's html slot), imported read-only.
// Opaque 1080x1920, 23.976 fps, 100 frames. RENDER WITH --gl=angle (AirStage is WebGL).
//
// CHECK LINE: "coding and maths have benchmark columns with a scale (SWE-bench, AIME); 'nice to work with' has only an
// empty dashed outline — there is no benchmark to fill it."
//
// THE LINE (Sam): "And I don't think we have great benchmarks for being enjoyable to work with."
// WORD -> FRAME: And 0 · I 5 · don't 16 · think 25 · we 28 · have 31 · great 35 · benchmarks 42 · for 53 · being 67 ·
// enjoyable 77 · to 85 · work 89 · with 93 · (back to Sam at 100) (BRIEF_18, ±2 f).
// DURATION: the slot 18.310 -> 22.481 s = 4.171 s x 24000/1001 = 100 frames (f0..f99).
//
// THE MOTION: a benchmark row on the apron, the tiles are benchmarks: the cream SWE-bench tile (code glyph) and the
// AIME tile (sigma glyph) stand on the apron, each with an AMBER glass column with rungs rising out of a slot in its top
// edge. f0 framed on SWE-bench with AIME beside it, both columns already rising (SWE f-4..26, AIME f0..30), settled at
// different heights while the camera creeps in. On "great benchmarks" the camera trucks right along the row in one
// eased move (glide f27-69, a small push in) and arrives on the third tile, the "nice to work with" tile (cut 9's
// card front at tile scale: the OpenAI blossom with a cute face over NICE TO / WORK WITH, no rule), on "being enjoyable". Its slot opens f60-70 and
// nothing rises: a bold dashed outline, its solid feet out of the slot, draws upward f70-84 (two tips climb the sides
// and meet across the top) to AIME's height, where a score would be, and a big bold ink "?" slides up into its middle
// f80-88. The buddy's one life beat: it blinks f86-91 and opens its eyes looking up at the "?" (glance f85-91, held). Living hold
// f88-100: AIME's amber column at the left edge (its tile dimmed toward board), the empty outline and "?" centred, the
// buddy tile below, the camera creeping in about the "?", sky drift, motes, grain.
// Cause before effect: the nice slot is open (f70) before the outline's first dash (f71); the outline is closed (f84)
// before the "?" is fully in (f88).
// AMBER = a score (the two benchmark fills only). Cream = the tiles. No numbers.
//
// SOURCES: benchmark names are real: SWE-bench (Princeton NLP's coding benchmark; "SWE-bench Verified" with OpenAI),
// AIME (the American Invitational Mathematics Examination). The column heights are not scores (no numbers on screen):
// AIME stands a little taller than SWE-bench, as frontier models score higher on AIME. Glyphs: Lucide "code", "sigma"
// (benchShared BENCH_GLYPHS). The OpenAI blossom: public/sam-benchmaxxing/openai_mark.svg (Commons File:OpenAI logo
// 2025 (symbol).svg, PD-textlogo) via openaiBuddy3d.tsx.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, FONT_LABEL, FONT_NUM, amberBandFor, clamp01, mixHex, rectPath } from "../kits/cheeky-pint/stoutShared";
import { BENCH_TILE, BenchColumn, BenchStage, BenchTile, ContactShadow, GROUND, Slot, SlotLip, benchCam, glassH, tileRadius, toScreenB, type Look } from "./benchShared";
import { BUDDY_ASPECT, OpenAIBuddyLayer } from "./openaiBuddy3d";

export const FPS = 24000 / 1001;
export const DURATION = 100;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
const win = (f: number, f0: number, f1: number) => clamp01((f - f0) / (f1 - f0));

// ---------------------------------------------------------------------------
// THE PLAN (chart px on benchShared's plane; screen = 540 + (x - look.x) k, 960 + (y - look.y) k)
// ---------------------------------------------------------------------------
export const BEAT = { great: 35, benchmarks: 42, being: 67, enjoyable: 77, work: 89, sam: 100 } as const;
/** the row: tile width W (BenchTile, h = 0.82 W), pitch P; tile centres SWE, AIME, NICE; columns COL wide */
export const W = 300;
export const TILE_H = W * BENCH_TILE.aspect;
export const P = 372;
export const X = { swe: 300, aime: 300 + P, nice: 300 + 2 * P } as const;
export const COL = 250;
export const RUNG = 112;
export const HEADROOM = 26;
/** fill in rungs: AIME a little taller than SWE-bench (no numbers on screen) */
export const RUNGS = { swe: 3.65, aime: 4.7 } as const;
/** the tile's top edge = the slot every column rises out of */
export const TILE_TOP = GROUND - TILE_H;
/** the empty outline's height: AIME's glass (where a score would be) */
export const EMPTY_H = glassH(RUNGS.aime, RUNG, HEADROOM);
export const Q_Y = TILE_TOP - EMPTY_H * 0.5;

/** the columns rise (eased in/out, already moving at f0) */
export const RISE = { swe: { f0: -12, f1: 22 }, aime: { f0: -8, f1: 27 } } as const;
/** the nice tile's slot opens, the dashed outline draws upward, the "?" slides up */
export const OPEN = { f0: 60, f1: 70 } as const;
export const DRAW = { f0: 70, f1: 84 } as const;
export const QMARK = { f0: 80, f1: 88 } as const;
/** the benchmark tiles recede toward board as the nice tile arrives (the comparison stays in shot, dimmed) */
export const DIM = { f0: 58, f1: 74, to: 0.5 } as const;

// ---------------------------------------------------------------------------
// THE CAMERA: absolute looks, turned into the house glides (benchCam = museShared makeClockCam, damped follower)
// ---------------------------------------------------------------------------
/** the look that puts world (wx, wy) at screen (sx, sy) at zoom k */
const lookFor = (wx: number, wy: number, sx: number, sy: number, k: number): Look => ({ x: wx - (sx - 540) / k, y: wy - (sy - 960) / k, k });
/** f0: SWE-bench at screen x 255 (AIME whole beside it, its right edge on the frame's), the tiles' floor at y 1480
 *  (SHORTS LIFT: every tile face's bottom edge <= y 1500 on every frame, clear of the YouTube Shorts username overlay
 *  below ~1520, as cuts 1 and 35; tile faces may cross the 1360-1460 caption band, accepted by the director) */
const L0 = lookFor(X.swe, GROUND, 255, 1480, 1.58);
/** the opening creep (in a touch) */
const L1 = lookFor(X.swe, GROUND, 243, 1484, 1.605);
/** the truck's end: the frame's left edge just past AIME's label (AIME_EDGE right of its centre), so only the right
 *  strip of its amber column and the blank corner of its tile stay in shot; the nice tile lands at screen x ~545; floor
 *  at y 1488 (the hold's creep about the "?" carries it to ~1495 by f99; the outline's top stays in frame) */
export const AIME_EDGE = 64;
export const FLOOR_END = 1488;
const L2 = lookFor(X.aime + AIME_EDGE, GROUND, 0, FLOOR_END, 1.78);
const NICE_SX = 540 + (X.nice - L2.x) * L2.k;
/** the hold's creep: in about the "?" (it stays put; the tile sinks away from the band) */
const qScreenY = FLOOR_END - (GROUND - Q_Y) * 1.78;
const L3 = lookFor(X.nice, Q_Y, NICE_SX, qScreenY, 1.83);
const glide = (a: Look, b: Look, f0: number, f1: number, warp?: number) => ({ f0, f1, dx: b.x - a.x, dy: b.y - a.y, k: b.k, warp });
export const CAM = benchCam(L0, [glide(L0, L1, -24, 44), glide(L1, L2, 27, 69), glide(L2, L3, 66, 150)], DURATION);

// ---------------------------------------------------------------------------
// THE NICE TILE: cut 9's card front (the OpenAI buddy over the two-line ink label, Kräftig caps, no rule) at BenchTile's size
// and material (benchShared TileBody's recipe: cream -> creamFoot, radius tileRadius(h) x 0.8, lit top edge)
// ---------------------------------------------------------------------------
/** layout as fractions of W (y from the tile top): label font so "WORK WITH" fills ~0.88 W; cap = 0.718 x font */
export const NICE_TILE = { buddyH: 0.38, buddyCy: 0.23, labelPx: 0.149, line2: 0.74, lineGap: 1.18, tracking: "0.02em" } as const;
const NiceTile: React.FC<{ x: number; floor: number; w: number; k: number; dim?: number }> = ({ x, floor, w, k, dim = 0 }) => {
  const uid = `nt${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const N = NICE_TILE;
  const h = w * BENCH_TILE.aspect;
  const y0 = floor - h;
  const r = tileRadius(Math.min(w, h)) * 0.8;
  const px = N.labelPx * w;
  const b2 = y0 + N.line2 * w;
  const b1 = b2 - N.lineGap * px;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y0 + h)}>
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, dim)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, dim)} />
        </linearGradient>
      </defs>
      <path d={rectPath(x - w / 2, y0, w, h, r)} fill={`url(#${uid}g)`} />
      <path
        d={`M${f3(x - w / 2 + r)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x + w / 2 - r)}`}
        stroke={COLOR.edge}
        strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dim)}
        strokeWidth={f3(EDGE.CREAM / k)}
      />
      {/* the buddy's soft shadow on the tile face (cut 9's "round" ObjectShadow at tile scale): down-right of it, and a
          contact pool under it; the buddy itself is a WebGL layer above the chart (BuddyOnTile) */}
      <ellipse
        cx={f3(x + N.buddyH * w * BUDDY_ASPECT * 0.1)}
        cy={f3(y0 + N.buddyCy * w + N.buddyH * w * 0.05)}
        rx={f3((N.buddyH * w * BUDDY_ASPECT) / 2)}
        ry={f3((N.buddyH * w) / 2)}
        fill={COLOR.shadow}
        opacity={0.2}
        style={{ filter: `blur(${f3(9 / Math.max(0.4, k))}px)` }}
      />
      <ellipse
        cx={f3(x + N.buddyH * w * BUDDY_ASPECT * 0.02)}
        cy={f3(y0 + (N.buddyCy + N.buddyH / 2) * w + 2 / k)}
        rx={f3(N.buddyH * w * BUDDY_ASPECT * 0.36)}
        ry={f3(5 / k)}
        fill={COLOR.shadow}
        opacity={0.36}
        style={{ filter: `blur(${f3(4 / Math.max(0.4, k))}px)` }}
      />
      {["NICE TO", "WORK WITH"].map((s, i) => (
        <text key={s} x={f3(x)} y={f3(i === 0 ? b1 : b2)} textAnchor="middle" fontFamily={FONT_LABEL} fontSize={f3(px)} letterSpacing={N.tracking} fill={COLOR.inkDark}>
          {s}
        </text>
      ))}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE EMPTY OUTLINE: the glass column's silhouette as a dashed line, drawn upward by two tips (one per side) that
// meet across the top. The dashes are fixed on the glass (a mask reveals them), so nothing crawls.
// ---------------------------------------------------------------------------
const OUTLINE = {
  color: mixHex(COLOR.inkDark, "#7A5638", 0.08),
  opacity: 0.96,
  width: 8, // screen px
  dash: 13, // chart px (~23 screen px, + the round caps)
  gap: 11, // chart px (~12 screen px clear between caps)
  radius: 10,
  foot: 16, // chart px: the solid foot of each side, rising out of the slot
} as const;
const EmptyOutline: React.FC<{ x: number; base: number; w: number; h: number; k: number; draw: number }> = ({ x, base, w, h, k, draw }) => {
  const uid = `eo${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  if (draw <= 0.0005) return null;
  const sw = OUTLINE.width / k;
  const xl = x - w / 2 + sw / 2;
  const xr = x + w / 2 - sw / 2;
  const top = base - h + sw / 2;
  const r = OUTLINE.radius;
  // each half: a solid foot out of the slot (from just under the lip), then dashes up the side, round the corner, to
  // the top's middle. The dashes start one gap above the foot, so the pattern opens on a whole dash.
  const fy = base - OUTLINE.foot;
  const dy0 = fy - OUTLINE.gap;
  const feet = `M${f3(xl)} ${f3(base + 2 / k)}V${f3(fy)}M${f3(xr)} ${f3(base + 2 / k)}V${f3(fy)}`;
  const dl = `M${f3(xl)} ${f3(dy0)}V${f3(top + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(xl + r)} ${f3(top)}H${f3(x)}`;
  const dr = `M${f3(xr)} ${f3(dy0)}V${f3(top + r)}A${f3(r)} ${f3(r)} 0 0 0 ${f3(xr - r)} ${f3(top)}H${f3(x)}`;
  const left = `M${f3(xl)} ${f3(base + 2 / k)}V${f3(top + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(xl + r)} ${f3(top)}H${f3(x)}`;
  const right = `M${f3(xr)} ${f3(base + 2 / k)}V${f3(top + r)}A${f3(r)} ${f3(r)} 0 0 0 ${f3(xr - r)} ${f3(top)}H${f3(x)}`;
  const d = clamp01(draw);
  return (
    <g>
      <defs>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(x - w)} y={f3(base - h * 1.5)} width={f3(w * 2)} height={f3(h * 2)}>
          {[left, right].map((p, i) => (
            <path key={i} d={p} pathLength={1} fill="none" stroke="#fff" strokeWidth={f3(sw * 4)} strokeLinecap="butt" strokeDasharray={`${f3(d)} 2`} />
          ))}
        </mask>
      </defs>
      <g mask={`url(#${uid}m)`} fill="none" stroke={OUTLINE.color} strokeOpacity={OUTLINE.opacity} strokeWidth={f3(sw)}>
        <path d={feet} strokeLinecap="butt" />
        <g strokeLinecap="round" strokeDasharray={`${OUTLINE.dash} ${OUTLINE.gap}`}>
          <path d={dl} />
          <path d={dr} />
        </g>
      </g>
    </g>
  );
};

/** the ink "?" (Söhne Dreiviertelfett) centred in the outline: slides up while fading in, then floats a few px */
const QuestionMark: React.FC<{ x: number; y: number; k: number; u: number; f: number }> = ({ x, y, k, u, f }) => {
  if (u <= 0.001) return null;
  const px = 230 / 1.78; // chart px: ~165 px cap height on screen at the end look (cap = 0.718 em)
  const slide = (1 - ss(u)) * (18 / k);
  const float = Math.sin((f - QMARK.f0) * 0.12) * (3 / k) * ss(win(f, QMARK.f1 - 4, QMARK.f1 + 8));
  return (
    <text
      x={f3(x)}
      y={f3(y + 0.718 * px * 0.5 + slide + float)}
      textAnchor="middle"
      fontFamily={FONT_NUM}
      fontWeight={700}
      fontSize={f3(px)}
      fill={COLOR.inkDark}
      opacity={f3(ss(u))}
    >
      ?
    </text>
  );
};

/** the buddy's one life beat as the "?" lands: a blink (f86-91) and it opens its eyes looking up at the "?" */
export const BUDDY_BEAT = { blink: { f0: 86, f1: 91 }, glance: { f0: 85, f1: 91, y: 1 } } as const;
const buddyPose = (f: number) => {
  const b = win(f, BUDDY_BEAT.blink.f0, BUDDY_BEAT.blink.f1);
  const blink = Math.sin(Math.PI * b) ** 2;
  const g = ss(win(f, BUDDY_BEAT.glance.f0, BUDDY_BEAT.glance.f1));
  return { squash: 0, sway: 0, tilt: 0, wink: 0, blink, glance: { x: 0, y: BUDDY_BEAT.glance.y * g } };
};
/** the buddy on the nice tile, in screen px for its WebGL layer (mounted only while the tile is in frame) */
const BuddyOnTile: React.FC<{ look: Look; f: number }> = ({ look, f }) => {
  const N = NICE_TILE;
  const c = toScreenB(look, X.nice, TILE_TOP + N.buddyCy * W);
  if (c.x < -300 || c.x > 1380) return null;
  return <OpenAIBuddyLayer x={c.x} cy={c.y} height={N.buddyH * W * look.k} pose={buddyPose(f)} tone="dark" />;
};

const NoBenchmarkForNice: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = CAM.at(f);
  const k = look.k;
  const band = amberBandFor(look);
  const dim = DIM.to * ss(win(f, DIM.f0, DIM.f1));
  const rungs = {
    swe: RUNGS.swe * ss(win(f, RISE.swe.f0, RISE.swe.f1)),
    aime: RUNGS.aime * ss(win(f, RISE.aime.f0, RISE.aime.f1)),
  };
  const open = ss(win(f, OPEN.f0, OPEN.f1));
  // the drawing tips: near-constant speed, a short ease at each end
  const draw = (() => {
    const u = win(f, DRAW.f0, DRAW.f1);
    return 0.82 * u + 0.18 * ss(u);
  })();
  const qu = win(f, QMARK.f0, QMARK.f1);
  return (
    <BenchStage look={look} S={f} rest={CAM.rest} html={<BuddyOnTile look={look} f={f} />}>
      {(["swe", "aime"] as const).map((id) => (
        <g key={id}>
          <ContactShadow x={X[id]} y={GROUND} w={W * 0.85} k={k} />
          <BenchTile id={id} x={X[id]} floor={GROUND} w={W} k={k} dim={dim} />
          <BenchColumn x={X[id]} base={TILE_TOP} w={COL} rungs={rungs[id]} fill="amber" k={k} band={band} rung={RUNG} headroom={HEADROOM} shadow={0} />
        </g>
      ))}
      <g>
        <ContactShadow x={X.nice} y={GROUND} w={W * 0.85} k={k} />
        <NiceTile x={X.nice} floor={GROUND} w={W} k={k} />
        <Slot x={X.nice} top={TILE_TOP} w={COL} k={k} open={open} />
        <EmptyOutline x={X.nice} base={TILE_TOP} w={COL} h={EMPTY_H} k={k} draw={draw} />
        <SlotLip x={X.nice} top={TILE_TOP} w={COL} k={k} />
        <QuestionMark x={X.nice} y={Q_Y} k={k} u={qu} f={f} />
      </g>
    </BenchStage>
  );
};

export default NoBenchmarkForNice;
