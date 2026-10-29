// ---------------------------------------------------------------------------
// NotToBenchmax (sam-benchmaxxing, cut 26), REV 2. Cheeky Pint style carried into the air like the Scott Kirby clips
// (styles/cheeky-pint.md; COMMON.md). The clip's world: benchShared (the apron GROUND_SPEC, BenchColumn, OpenAITile,
// glassH, ROW), imported read-only, under aircraftShared's AirStage. Plan and projection: notToBenchmax3d.ts.
// Opaque 1080x1920, 23.976 fps, 50 frames. RENDER WITH --gl=angle (AirStage is three.js).
//
// CHECK LINE: "the OpenAI tile rides its own amber column up the benchmark chart, the camera tight on that one bar,
// and as it settles it catches a glittering shine on 'benchmax'."
//
// THE LINE: "But we endeavor not to benchmax."
// WORD -> FRAME: But -1 · we 2 · endeavor 8 · not 19 · to 26 · bench 30 · max 35 · (John 41; cut back at 50)
// (notes/word_frames.txt, CUT 26; ±2 f).
// DURATION: the slot 26.068 -> 28.153 s = 2.085 s x 24000/1001 = 50 frames (f0..f49).
//
// THE MOTION: the same amber column as cuts 1 and 35 (benchShared BenchColumn: glass, rungs, hot top edge, bloom;
// OpenAI's tile riding its cap), seen from ANOTHER angle: low three-quarter from the front-right, ~30 deg off its face,
// looking up ~12 deg, tight on this one bar (the other labs' stubs are ~90 m below, out of frame). f0-26 ("we
// endeavor not to") the column climbs from 10.6 to 14 rungs, already climbing at f0, decelerating into its settle by
// f26; the camera rides up with the cap (an eased follow), so the tile stays large in the upper middle while the
// rungs stream down past us. Then the approved sparkle (sparkleShine.tsx): on "bench" (f30) one diagonal shine across
// the tile face (f30-38); on "max" (f33-44) the glints at the tile's corners and rim; f44-49 the last glint fading at
// the top-right corner on a settled, living frame (a slow camera arc ~3 deg around the column, sky, motes, grain).
// The column's front face is benchShared's 2D drawing mapped onto the screen by the exact homography of the chart
// plane under the AirCam (CSS matrix3d); the column's right side face is projected polygons in the same camera, and
// the tile slab's thickness is its back face (the same rounded square 4 m behind) mapped the same way.
// AMBER = the score (the column) and the shine. Cream = the tile. No text.
//
// SOURCES: the OpenAI blossom (2025 symbol) as macintoshShared draws it (its header: Commons "File:OpenAI logo 2025
// (symbol).svg"). No figures.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, STROKE, bloomFilter, mixHex, rectPath } from "../kits/cheeky-pint/stoutShared";
import { AirStage, type SideCam, type V3 } from "../scott-aircraft-order/aircraftShared";
import { BenchColumn, GROUND, GROUND_SPEC, OpenAITile, ROW, S0, ZC, tileRadius } from "./benchShared";
import { COL_M, TILE_M, TILE_T, cam26, capChartY, capM, chartPlaneMatrix3d, proj, rungsAt } from "./notToBenchmax3d";
import { Glint, ShineSweep, glintLife, sweepAt, type GlintSpec } from "./sparkleShine";

export const FPS = 24000 / 1001;
export const DURATION = 50;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

export const BEAT = { we: 2, endeavor: 8, not: 19, to: 26, bench: 30, max: 35, john: 41 } as const;
/** the shine sweep on "bench" (approved rev 2 timing) */
export const SWEEP = { f0: BEAT.bench - 1, frames: 9 } as const;
/** the glitter on "max" (approved rev 2 set): offsets in units of the tile's half size on its face (u right, v down) */
export const GLINTS: readonly GlintSpec[] = [
  // the hero: top-left corner, the biggest
  { u: -0.93, v: -0.93, at: 33, life: 11, r: 118, rot: 0, spin: 16 },
  { u: -0.5, v: -1.08, at: 34, life: 8, r: 24, rot: 20, cross: false, tone: "cream" },
  { u: 1.06, v: -0.38, at: 35, life: 10, r: 75, rot: 8, spin: -14, tone: "cream" },
  { u: 0.88, v: 0.8, at: 37, life: 11, r: 68, rot: -6, spin: 18 },
  { u: -1.06, v: 0.38, at: 39, life: 10, r: 68, rot: 12, tone: "cream" },
  { u: 1.06, v: 0.42, at: 41, life: 8, r: 22, rot: 30, cross: false },
  // the last glint: top-right corner, still clearly there as it fades through f44-49
  { u: 0.93, v: -0.93, at: 42, life: 13, r: 84, rot: 4, spin: 10 },
];

/** supersampling of the mapped tile-face layer. It is magnified ~2.55-2.8x on screen; the raster must stay BELOW the
 *  screen scale everywhere (a texture minified anywhere on the face picks a coarser mip there and shows a tone seam):
 *  2.4 x chart px. */
const SS = 2.4;
/** the column layer's chart-px window across: the column with room for its bloom */
const FACE_X0 = 540 - 150;
const FACE_W = 300;

/** the column's right side face: darker amber (it turns away from the key light, upper left) */
const SIDE = {
  top: mixHex(COLOR.amberFoot, COLOR.inkDark, 0.22),
  foot: mixHex(COLOR.amberFoot, COLOR.inkDark, 0.34),
  rung: mixHex(COLOR.rung, COLOR.inkDark, 0.35),
  tileEdge: mixHex(COLOR.creamFoot, COLOR.board, 0.5),
} as const;

const pts = (cam: SideCam, ps: V3[]) =>
  ps
    .map((p) => {
      const q = proj(cam, p);
      return `${f3(q.x)},${f3(q.y)}`;
    })
    .join(" ");

/** The column's right side face (x = +COL_M/2, z from ZC back to ZC + COL_M): glass, the amber fill, its rungs, the
 *  hot top edge, the glass hairlines. Screen px. */
const ColumnSide: React.FC<{ cam: SideCam; f: number }> = ({ cam, f }) => {
  const uid = `cs${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const xs = COL_M / 2;
  const z0 = ZC;
  const z1 = ZC + COL_M;
  const top = capM(f);
  const fillTop = (rungsAt(f) * ROW.rung) / S0;
  const k = proj(cam, [xs, top, z0]).s / S0;
  const a = proj(cam, [xs, fillTop, z0]);
  const b = proj(cam, [xs, fillTop - 60, z0]);
  const rungs: number[] = [];
  for (let i = 1; (i * ROW.rung) / S0 < fillTop - 0.8; i++) rungs.push((i * ROW.rung) / S0);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(a.y)} x2="0" y2={f3(b.y)}>
          <stop offset="0" stopColor={SIDE.top} />
          <stop offset="1" stopColor={SIDE.foot} />
        </linearGradient>
      </defs>
      {/* the glass box's side (tint) up to the cap */}
      <polygon points={pts(cam, [[xs, 0, z0], [xs, top, z0], [xs, top, z1], [xs, 0, z1]])} fill={COLOR.glass} fillOpacity={0.06} />
      <g style={{ filter: bloomFilter(k) }}>
        <polygon points={pts(cam, [[xs, 0, z0], [xs, fillTop, z0], [xs, fillTop, z1], [xs, 0, z1]])} fill={`url(#${uid}g)`} />
      </g>
      <g stroke={SIDE.rung} strokeWidth={STROKE.HAIRLINE}>
        {rungs.map((y) => {
          const p = proj(cam, [xs, y, z0]);
          const q = proj(cam, [xs, y, z1]);
          return <line key={y} x1={f3(p.x)} y1={f3(p.y)} x2={f3(q.x)} y2={f3(q.y)} />;
        })}
      </g>
      {/* the hot top edge carries round the corner, dimmer on the shaded side */}
      {(() => {
        const p = proj(cam, [xs, fillTop, z0]);
        const q = proj(cam, [xs, fillTop, z1]);
        return <line x1={f3(p.x)} y1={f3(p.y)} x2={f3(q.x)} y2={f3(q.y)} stroke={COLOR.amberHot} strokeOpacity={0.7} strokeWidth={2} />;
      })()}
      {/* glass hairlines: the back edge and the top edge of the side */}
      <polyline points={pts(cam, [[xs, 0, z1], [xs, top, z1], [xs, top, z0]])} fill="none" stroke={COLOR.glass} strokeOpacity={0.55} strokeWidth={STROKE.HAIRLINE} />
    </g>
  );
};

/** A chart-px window (x0, y0, w, h) of a plane parallel to the chart plane (at depth z), mapped onto the screen by
 *  that plane's homography (CSS matrix3d) and rastered at `ss` x chart px. Small windows: one big magnified layer
 *  rastered in tiles showed a tone seam across the tile face. */
const PlaneLayer: React.FC<{ cam: SideCam; x0: number; y0: number; w: number; h: number; ss: number; z?: number; children: React.ReactNode }> = ({
  cam,
  x0,
  y0,
  w,
  h,
  ss,
  z = ZC,
  children,
}) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: w * ss, height: h * ss, transformOrigin: "0 0", transform: chartPlaneMatrix3d(cam, x0, y0, ss, z) }}>
    <svg width={w * ss} height={h * ss} viewBox={`${f3(x0)} ${f3(y0)} ${f3(w)} ${f3(h)}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      {children}
    </svg>
  </div>
);

/** the tile slab: its window in chart px (the tile plus a margin for the shine and the lit edge) */
const TILE_PAD = 24;
const tileWin = (f: number) => {
  const cap = capChartY(f);
  return { x0: 540 - ROW.tile / 2 - TILE_PAD, y0: cap - ROW.tile - TILE_PAD, w: ROW.tile + 2 * TILE_PAD, h: ROW.tile + 2 * TILE_PAD, cap };
};
const tileFace = (cap: number) => rectPath(540 - ROW.tile / 2, cap - ROW.tile, ROW.tile, ROW.tile, tileRadius(ROW.tile));

/** The slab's back face (TILE_T behind the front, same rounded square) in the edge tone: from below and the right it
 *  shows as the tile's right edge and its overhang underside, the slab's thickness, joined round the corners. */
const TileBack: React.FC<{ cam: SideCam; f: number }> = ({ cam, f }) => {
  const w = tileWin(f);
  return (
    <PlaneLayer cam={cam} x0={w.x0} y0={w.y0} w={w.w} h={w.h} ss={2} z={ZC + TILE_T}>
      <path d={tileFace(w.cap)} fill={SIDE.tileEdge} />
    </PlaneLayer>
  );
};
/** The column's front face: benchShared's BenchColumn (the window runs from the cap down past the frame's bottom). */
const ColumnFront: React.FC<{ cam: SideCam; f: number; k: number }> = ({ cam, f, k }) => {
  const cap = capChartY(f);
  const y0 = cap - 40;
  return (
    <PlaneLayer cam={cam} x0={FACE_X0} y0={y0} w={FACE_W} h={760} ss={2}>
      <BenchColumn x={540} base={GROUND} rungs={rungsAt(f)} fill="amber" k={k} band={[cap - 40, cap + 900]} shadow={0} slot={false} />
    </PlaneLayer>
  );
};
/** The tile's front face: benchShared's OpenAITile and the shine. */
const TileFront: React.FC<{ cam: SideCam; f: number; k: number; sweep: number }> = ({ cam, f, k, sweep }) => {
  const w = tileWin(f);
  return (
    <PlaneLayer cam={cam} x0={w.x0} y0={w.y0} w={w.w} h={w.h} ss={SS}>
      <OpenAITile x={540} floor={w.cap} size={ROW.tile} k={k} shadow={0} />
      <ShineSweep clip={tileFace(w.cap)} box={{ x: 540 - ROW.tile / 2, y: w.cap - ROW.tile, w: ROW.tile, h: ROW.tile }} progress={sweep} />
    </PlaneLayer>
  );
};

/** The far edge of the apron (z = 760 m) meets the desert in a hard step (slanted under the yawed camera); a cut-side
 *  softener (the world untouched): a strip along that line, its backdrop blurred, feathered either side. */
const ApronEdgeSoftener: React.FC<{ cam: SideCam }> = ({ cam }) => {
  const zf = GROUND_SPEC.aprons[0][3];
  const p = proj(cam, [cam.x - 300, 0, zf]);
  const q = proj(cam, [cam.x + 300, 0, zf]);
  const mx = (p.x + q.x) / 2;
  const my = (p.y + q.y) / 2;
  if (my < -200 || my > 2100) return null;
  const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
  const h = 130;
  const w = 2600;
  const mask = "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 38%, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)";
  return (
    <div
      style={{
        position: "absolute",
        left: mx - w / 2,
        top: my - h / 2,
        width: w,
        height: h,
        transform: `rotate(${f3(ang)}deg)`,
        transformOrigin: "50% 50%",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
};

/** The glints, placed at their points on the tile face (projected), drawn upright in screen px. */
const TileGlitter: React.FC<{ cam: SideCam; f: number }> = ({ cam, f }) => {
  const y = capM(f);
  const h = TILE_M / 2;
  return (
    <g>
      {GLINTS.map((g, i) => {
        const L = glintLife(f, g.at, g.life);
        if (L <= 0) return null;
        const p = proj(cam, [g.u * h, y + h - g.v * h, ZC]);
        return (
          <Glint
            key={i}
            x={p.x}
            y={p.y}
            r={g.r}
            life01={L}
            t01={c01((f - g.at) / g.life)}
            rot={g.rot ?? 0}
            spin={g.spin ?? 18}
            tone={g.tone ?? "hot"}
            cross={g.cross ?? true}
          />
        );
      })}
    </g>
  );
};

const NotToBenchmax: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = cam26(f);
  const k = proj(cam, [0, capM(f), ZC]).s / S0;
  const sweep = sweepAt(f, SWEEP.f0, SWEEP.frames);
  return (
    <AirStage
      cam={cam}
      S={f}
      rest={cam26(0)}
      ground={GROUND_SPEC}
      overlay={
        <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, overflow: "hidden" }}>
          <ApronEdgeSoftener cam={cam} />
          {/* back to front: the slab's back face, the column's side, its front, the tile's face, the glints */}
          <TileBack cam={cam} f={f} />
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <ColumnSide cam={cam} f={f} />
          </svg>
          <ColumnFront cam={cam} f={f} k={k} />
          <TileFront cam={cam} f={f} k={k} sweep={sweep} />
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
            <TileGlitter cam={cam} f={f} />
          </svg>
        </div>
      }
    />
  );
};

export default NotToBenchmax;
