// ---------------------------------------------------------------------------
// BenchmaxxedTower (sam-benchmaxxing, cut 1). Cheeky Pint style carried into the AIR, as the Scott Kirby clips
// (styles/cheeky-pint.md; the clip's world benchShared.tsx on scott-aircraft-order/aircraftShared AirStage).
// Opaque 1080x1920, 23.976 fps, 69 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: "on a benchmark chart where every lab stands at about the same height, OpenAI's amber column keeps going —
// so high it punches up through the clouds — while everyone else is left as stubs at the bottom."
//
// THE LINE (John): "Is that a real concern? Are OpenAI models benchmaxxed?"
// WORD -> FRAME: Is 0 · that 2 · a 5 · real 7 · concern 10 · Are 24 · OpenAI 29 · models 45 · bench 50 · maxxed 56 ·
// (cut back to John at 69) (notes/word_frames.txt, CUT 1_BenchmaxxedTower).
// DURATION: the slot 1.418 -> 4.296 s = 2.878 s x 23.976 = 69 frames (f0..f68).
//
// THE MOTION: a benchmark chart on the airfield apron: five glass columns rising out of slots in the apron edge, each
// lab's tile riding its column's cap (OpenAI's cream blossom tile in slot 3 of 5, four anonymous board tiles). It opens
// on the whole chart with the apron line in shot (y ~1860): the short columns already rising out of their slots as bars
// under each tile, settled level by f18-20 (a fair, even chart; the camera eases back a touch). On "OpenAI" (f29) OpenAI's amber column does not stop: it rises again (f27-59), its tile riding the cap,
// and the camera cranes up and pulls back with it in one eased move (glide f22-54 on the damped follower), so by
// "bench" (f50) the amber tower spans the frame and the other four are stubs at the bottom. As the camera cranes up it
// rises through a broken, sunlit stratocumulus band (the Scott cloud look in 2D: soft clumps torn by fractal noise into
// wisps and gaps, cream-lit crowns, warm tan
// undersides, low contrast, horizontal; never grey, never a plume): the band comes down into frame from the top edge
// f33-55 (a near layer, so it moves faster than the tower as the camera rises) and settles across the middle of the
// tower at y ~700-950, the amber column showing through and between the wisps. The cloud sits in FRONT of the glass but
// BEHIND every tile, so the OpenAI tile punches up through it and is never covered; in the end frame the tile is in open
// sky above it and the stubs and apron are below. On "maxxed" the OpenAI tile tips smugly (-6 deg about the cap's left
// corner, f52-62) looking down at the others, then holds. Living hold f60-68: sky drift, the cloud drifting slowly
// sideways (it drifts the whole cut), motes, grain, a slow light along the tower's hot top edge, a slow creep in.
// No aircraft in this cut (CUT1_JET / BenchJet stay exported in benchShared but are not rendered here).
// Cause before effect: OpenAI's column is touching its tile throughout (the tile's floor IS the glass top).
// AMBER = OpenAI's score (its column's fill); board/umber glass = the other labs' scores; cream = the OpenAI tile.
// No numbers, no axis, no names (the chart is a shape, not data).
//
// SOURCES: no figures. The OpenAI blossom from sam-macintosh-moment/macintoshShared.tsx (Commons "OpenAI logo 2025
// (symbol).svg"); the other labs are fictional marks (benchShared LAB_MARKS). The cloud palette is wifiSky's CloudDeck
// colours (scott-free-wifi), drawn here as a 2D band.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { amberBandFor, clamp01 } from "../kits/cheeky-pint/stoutShared";
import {
  BenchColumn,
  BenchStage,
  EVEN_RUNGS,
  GROUND,
  LAB_MARK_OF,
  LabTile,
  OPENAI_SLOT,
  OpenAITile,
  ROW,
  TOWER_CAM,
  capY,
  rowX,
} from "./benchShared";

export const FPS = 24000 / 1001;
export const DURATION = 69;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};
/** npsColumnsPlan's travel ease: a soft start, a long even middle, a weighty settle */
const travel = (u: number) => {
  const x = clamp01(u);
  const quad = x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
  return 0.55 * ss(x) + 0.45 * quad;
};

// ---------------------------------------------------------------------------
// BEATS
// ---------------------------------------------------------------------------
/** the even chart: every column rises out of its slot f-10..f18 (+ a frame or two of stagger), settled by f20 */
export const RISE = { f0: -10, f1: 18 } as const;
const STAGGER = [1, -1, 0, 2, -2] as const;
/** OpenAI's column rises again from f27 (it is moving on "OpenAI", f29) and lands at TOWER_RUNGS by f59 */
export const TOWER = { f0: 27, f1: 59 } as const;
export const TOWER_RUNGS = 21.2;
/** the smug tip on "maxxed": -6 deg about the cap's left corner, f52-62, then held */
export const LEAN = { f0: 52, f1: 62, deg: -6 } as const;
/** a slow light along the tower's hot top edge (left to right) through the hold */
export const GLINT = { f0: 50, f1: 76 } as const;

const rungsAt = (i: number, f: number) => {
  const base = EVEN_RUNGS[i] * travel((f - RISE.f0 - STAGGER[i]) / (RISE.f1 - RISE.f0));
  if (i !== OPENAI_SLOT) return base;
  return base + (TOWER_RUNGS - EVEN_RUNGS[i]) * travel((f - TOWER.f0) / (TOWER.f1 - TOWER.f0));
};

// ---------------------------------------------------------------------------
// THE CLOUD LAYER (screen px): a broken, sunlit stratocumulus band the camera rises through
// ---------------------------------------------------------------------------
/** yEnd = the band's centre in the end frame; half = half its thickness; par = how many screen px it moves per chart px
 *  of crane (a near layer: faster than the tower); the band's wisps sit above y ~0 until f33 (off frame in the opening). */
export const CLOUD = { yEnd: 826, half: 118, par: 8.5 } as const;
/** wifiSky CloudDeck's palette: sunlit cream tops, warm tan undersides, the cream aerial veil */
const CLOUD_COL = { lit: "#FFF7E6", mid: "#F1DDBA", foot: "#D9B98E", haze: "#F4E6CB" } as const;
const END_Y = TOWER_CAM.at(DURATION - 1).y;
export const cloudY = (f: number) => CLOUD.yEnd - (TOWER_CAM.at(f).y - END_Y) * CLOUD.par;

const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
/** one density clump (an ellipse, flattened, relative to the row's base line) */
type Clump = { x: number; dy: number; rx: number; ry: number; a: number };
/** clumps gather into irregular masses with sky between them: masses at uneven spacing, each a scatter of clumps of
 *  very different sizes (a dense core, smaller satellites, a thin skirt); nothing tiles or repeats */
const clumpsOf = (seed: number, x0: number, x1: number, masses: number, spread: number): Clump[] => {
  const out: Clump[] = [];
  let x = x0 + rnd(seed) * 120;
  for (let m = 0; m < masses && x < x1; m++) {
    const w = 150 + rnd(seed + m * 3.7) * 250; // the mass's width
    const n = 6 + Math.floor(rnd(seed + m * 5.1) * 6);
    for (let j = 0; j < n; j++) {
      const s = seed + m * 31 + j * 7;
      const u = rnd(s) * 2 - 1;
      const core = 1 - Math.abs(u);
      const rx = 30 + (40 + 110 * core) * (0.45 + rnd(s + 1));
      out.push({
        x: x + u * w * 0.55,
        dy: (rnd(s + 2) - 0.5) * spread - core * spread * 0.35,
        rx,
        ry: rx * (0.38 + 0.3 * rnd(s + 3)),
        a: 0.45 + 0.55 * rnd(s + 4) * (0.5 + 0.5 * core),
      });
    }
    x += w + 150 + rnd(seed + m * 9.3) * 260; // the sky gap to the next mass
  }
  return out;
};
const BACK_CLUMPS = clumpsOf(11, -380, 1520, 9, 70);
const FRONT_CLUMPS = clumpsOf(47, -360, 1500, 8, 56);
/** sideways drift, px/frame (the air moves right to left; the near row faster) */
const DRIFT = { back: 0.9, front: 1.7 } as const;

/** the volume filter: soft density -> edges torn by fractal noise into wisps -> holes eaten out of the thin parts
 *  (both noises live in the row's own space, so they drift with it) */
const CloudFilter: React.FC<{ id: string; blur: string; f1: string; f2: string; disp: number; seed: number; bite: number }> = ({ id, blur, f1, f2, disp, seed, bite }) => (
  <filter id={id} x="-25%" y="-120%" width="150%" height="340%" colorInterpolationFilters="sRGB">
    <feGaussianBlur in="SourceGraphic" stdDeviation={blur} result="soft" />
    <feTurbulence type="fractalNoise" baseFrequency={f1} numOctaves={4} seed={seed} result="n1" />
    <feDisplacementMap in="soft" in2="n1" scale={disp} xChannelSelector="R" yChannelSelector="G" result="torn" />
    <feTurbulence type="fractalNoise" baseFrequency={f2} numOctaves={3} seed={seed + 5} result="n2" />
    <feColorMatrix in="n2" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${bite} 0 0 0 ${-(bite * 0.5 - 0.62)}`} result="holes" />
    <feComposite in="torn" in2="holes" operator="in" result="eaten" />
    {/* the dense cores survive the holes; only the thin skirts break into wisps */}
    <feComponentTransfer in="torn" result="core">
      <feFuncA type="gamma" amplitude="1" exponent="2.4" offset="0" />
    </feComponentTransfer>
    <feMerge result="mass">
      <feMergeNode in="eaten" />
      <feMergeNode in="core" />
    </feMerge>
    <feGaussianBlur in="mass" stdDeviation="2.5" />
  </filter>
);

/** part "back" = the haze and the far row (behind the glass); "front" = the near wisps (in front of the glass) */
const CloudLayer: React.FC<{ f: number; part: "back" | "front" }> = ({ f, part }) => {
  const yc = cloudY(f);
  if (yc + CLOUD.half + 160 < 0 || yc - CLOUD.half - 200 > 1920) return null;
  const top = yc - CLOUD.half;
  const bot = yc + CLOUD.half;
  const id = (n: string) => `${n}${part}`;
  const back = part === "back";
  const base = back ? yc - 18 : bot - 34;
  const clumps = back ? BACK_CLUMPS : FRONT_CLUMPS;
  const dx = -(back ? DRIFT.back : DRIFT.front) * f;
  // shading in the row's own height: lit crowns, a mid body, warm tan bellies
  const g0 = base - (back ? 150 : 120);
  const g1 = base + (back ? 50 : 45);
  return (
    <g>
      <defs>
        <linearGradient id={id("tcHaze")} gradientUnits="userSpaceOnUse" x1="0" y1={top - 60} x2="0" y2={bot + 60}>
          <stop offset="0" stopColor={CLOUD_COL.haze} stopOpacity="0" />
          <stop offset="0.45" stopColor={CLOUD_COL.haze} stopOpacity="0.3" />
          <stop offset="0.8" stopColor={CLOUD_COL.mid} stopOpacity="0.22" />
          <stop offset="1" stopColor={CLOUD_COL.mid} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id("tcShade")} gradientUnits="userSpaceOnUse" x1="0" y1={g0} x2="0" y2={g1}>
          <stop offset="0" stopColor={CLOUD_COL.lit} />
          <stop offset="0.5" stopColor={CLOUD_COL.mid} />
          <stop offset="1" stopColor={CLOUD_COL.foot} />
        </linearGradient>
        <filter id={id("tcSoftH")} x="-10%" y="-80%" width="120%" height="260%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
        {back ? (
          <CloudFilter id={id("tcVol")} blur="22 13" f1="0.0035 0.009" f2="0.005 0.012" disp={110} seed={7} bite={2.0} />
        ) : (
          <CloudFilter id={id("tcVol")} blur="15 9" f1="0.005 0.012" f2="0.007 0.017" disp={95} seed={21} bite={2.2} />
        )}
      </defs>
      {back ? <rect x={-100} y={top - 60} width={1280} height={bot - top + 130} fill={`url(#${id("tcHaze")})`} filter={`url(#${id("tcSoftH")})`} /> : null}
      <g transform={`translate(${dx} 0)`}>
        <g filter={`url(#${id("tcVol")})`} opacity={back ? 0.82 : 0.72}>
          {/* an invisible frame so the filter region always spans the row */}
          <rect x={-420} y={base - 220} width={2000} height={320} fill="none" />
          {clumps.map((c, j) => (
            <ellipse key={j} cx={c.x} cy={base + c.dy} rx={c.rx} ry={c.ry} fill={`url(#${id("tcShade")})`} opacity={c.a} />
          ))}
        </g>
        {/* the sunlit crowns: the same clumps, smaller and lifted, in the lit cream, torn by the same noise */}
        <g filter={`url(#${id("tcVol")})`} opacity={back ? 0.5 : 0.6}>
          <rect x={-420} y={base - 220} width={2000} height={320} fill="none" />
          {clumps.map((c, j) => (
            <ellipse key={j} cx={c.x - c.rx * 0.08} cy={base + c.dy - c.ry * 0.5} rx={c.rx * 0.66} ry={c.ry * 0.55} fill={CLOUD_COL.lit} opacity={c.a * c.a} />
          ))}
        </g>
      </g>
    </g>
  );
};

const BenchmaxxedTower: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = TOWER_CAM.at(f);
  const k = look.k;
  const band = amberBandFor(look);
  const lean = LEAN.deg * ss((f - LEAN.f0) / (LEAN.f1 - LEAN.f0));
  const glint = f >= GLINT.f0 ? 0.12 + 0.76 * clamp01((f - GLINT.f0) / (GLINT.f1 - GLINT.f0)) : undefined;
  // the cloud is screen px: undo the chart transform for it
  const toScreen = `translate(${look.x} ${look.y}) scale(${1 / k}) translate(-540 -960)`;
  return (
    <BenchStage look={look} S={f} rest={TOWER_CAM.rest}>
      {/* the far cloud row and its haze, behind the glass */}
      <g transform={toScreen}>
        <CloudLayer f={f} part="back" />
      </g>
      {/* the glass (no caps yet) */}
      {EVEN_RUNGS.map((_, i) => {
        const isOpenAI = i === OPENAI_SLOT;
        return (
          <BenchColumn
            key={i}
            x={rowX(i)}
            base={GROUND}
            rungs={rungsAt(i, f)}
            fill={isOpenAI ? "amber" : "board"}
            k={k}
            band={band}
            glint={isOpenAI ? glint : undefined}
          />
        );
      })}
      {/* the near cloud row: in front of the glass, behind every tile */}
      <g transform={toScreen}>
        <CloudLayer f={f} part="front" />
      </g>
      {/* the tiles riding their caps (the cap top IS the glass top) */}
      {EVEN_RUNGS.map((_, i) => {
        const mark = LAB_MARK_OF[i];
        const x = rowX(i);
        const top = capY(rungsAt(i, f), GROUND);
        return mark ? (
          <LabTile key={i} x={x} floor={top} size={ROW.tile} k={k} mark={mark} />
        ) : (
          <OpenAITile key={i} x={x} floor={top} size={ROW.tile} k={k} lean={lean} pivotX={-ROW.col / 2} />
        );
      })}
    </BenchStage>
  );
};

export default BenchmaxxedTower;
