// ---------------------------------------------------------------------------
// HundredthOfTheCost (sam-navier-stokes, cut 1). Cheeky Pint style (stout) (styles/cheeky-pint.md), with the user's
// real vortex picture blended in as a 2.5D cut-out (the reality-plus-graphic idea of the Kelly Johnson clip, in
// Cheeky Pint material). Opaque 1080x1920, 23.976 fps, 96 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "A year on, the same Navier–Stokes proof could be redone for a hundredth of what it first cost."
//
// THE LINE: "[I bet we could redo Navier-]Stokes at 1/100th of the cost a year from when it was done."
// WORD -> FRAME (from the composition start): (Navier -10) · Stokes 8 · at 16 · 1 29 · 100th 37 · of 51 · the 54 ·
//   cost 56 · a 65 · year 72 · from 79 · when 82 · it 85 · was 86 · done 89 · (next line "So" 96).
// DURATION: the slot 1.334667 -> 5.338667 s = 4.004 s x 23.976 = 96 frames (f0..f95).
//
// THE MOTION: one minimal newsprint page in warm light, everything in shot at f0 under a slow continuous push (k 1 ->
// ~1.06, anchored near y 1150 so the photo rises a touch and the block stays put) with a slight drift. Top to bottom: the double masthead rule, the dateline SEPT 2026, the headline
// NAVIER–STOKES, the user's vortex photo as the page's picture (standing H_PHOTO proud of the page on its own plane,
// one soft stout shadow on the paper), the caption bands left as plain paper, and under them the cost: a wide 20 x 5
// block of 100 amber cubes (40 px) standing on the paper with one union shadow. On "1/100th of the cost" a wave starts under the block's
// bottom edge (centre) at f25 (visible from ~f30) and runs up across it: 99 cubes sink into the page (the height leads) and tone from amber
// through dimmed amber into flat printed squares in the paper's dim ink (tone and height, never opacity), the last
// ones lying flat on "cost" (f56); ONE cube, the centre of the row facing the vortex, stays standing, amber and lit.
// On "year" the dateline's last digit rolls 6 -> 7 on a feathered drum (f63 -> f71, landing a frame before the word).
// f72-95: settled and living, the push continuing.
// Cause before effect: the wave front is the cause; a cube's first sinking frame is its start_i = f25 + perPitch x its
// distance (in pitches) from the source, its flat frame start_i + SINK (the farthest: f56).
// AMBER = money spent on compute for the math (the cost). The photo = the proof itself. Board/dim ink = spent cost.
//
// THE 2.5D: a shifted-eye perspective (an architectural shift lens): the page is seen square-on, and a point at height
// h above it projects toward the eye point E (EYE_DY world px below the frame centre) by Z / (Z - h), Z = Z0 / k (the
// push is a dolly). So the cubes show their tops and south faces, the photo floats a little proud of the page, and
// the push and drift give real parallax between paper, cubes and photo. (pricingShared's DepthPlane puts the eye at
// the frame centre and makes every plane coincide at rest: a cube would show no side at all, so this cut projects
// with the same formula but the shifted eye; PhotoCutOut and StoutShadow are used as they are.)
//
// SOURCES: the vortex picture is OpenAI's own illustration of the Navier–Stokes blow-up (the original of the user's
// reference; assets-src/sam-navier-stokes/openai_vortex_hires.png, 1300x1452, unlabelled), cut out by
// assets-src/sam-navier-stokes/make_vortex_cutout.py -> vortexData.ts. The paper tile: make_paper_tile.py ->
// paperData.ts. The dates: OpenAI published the Navier–Stokes result on Sept 8 2026 (COMMON.md facts); "a year from
// when it was done" -> SEPT 2027. No dollar figures on screen.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLOOM_LAYERS,
  COLOR,
  ELEVATION,
  FONT_LABEL,
  FONT_NUM,
  Label,
  StoutStage,
  TNUM_ADV,
  TRACK,
  clamp01,
  labelWidth,
  mixHex,
  smoothstep,
} from "../kits/cheeky-pint/stoutShared";
import { makeClockCam } from "../kits/cheeky-pint/museShared";
import { PhotoCutOut, StoutShadow, photoCutOutSil } from "../sam-pricing-tokens/pricingShared";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { VORTEX_AXIS_U, VORTEX_BOX, VORTEX_H, VORTEX_SRC, VORTEX_W } from "./vortexData";
import { PAPER_SRC, PAPER_TILE } from "./paperData";

export const FPS = 24000 / 1001;
export const DURATION = 96;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the camera: one slow push with a slight drift, already moving at f0, never settling inside the slot -----------
// The push is anchored near screen y ANCHOR (between the photo and the block): the photo rises a little, the block stays
// put instead of sliding toward the frame bottom. dy keeps the world point under ANCHOR on ANCHOR at the target k.
const ANCHOR = 1150;
const K_TARGET = 1.075; // eased over f-30..f140: ~1.06 at f95
const CAM = makeClockCam({ x: 540, y: 960, k: 1 }, [{ f0: -30, f1: 140, k: K_TARGET, dx: 6, dy: ANCHOR - (ANCHOR - 960) / K_TARGET - 960 }], DURATION);

// --- the eye (2.5D) ---------------------------------------------------------------------------------------------------
const Z0 = 2400; // eye height over the page at k = 1 (world px)
const EYE_DY = 1500; // the eye's nadir sits this far below the frame centre (world px at k = 1)
const eyeOf = (cam: Cam) => ({ x: cam.x, y: cam.y + EYE_DY / cam.k, Z: Z0 / cam.k });
type Eye = ReturnType<typeof eyeOf>;
/** apparent page-world point of (x, y) at height h */
const proj = (e: Eye, x: number, y: number, h: number) => {
  const s = e.Z / (e.Z - h);
  return { x: e.x + (x - e.x) * s, y: e.y + (y - e.y) * s, s };
};

// --- the page -------------------------------------------------------------------------------------------------------
const PAGE = { x0: -400, y0: -500, x1: 1480, y1: 2500 } as const;
const MARGIN = 96; // the page's text measure: x 96 .. 984
const RULE = { y: 128, thick: 3, thin: 1.25, gap: 5 } as const; // the double masthead rule
const DATE = { base: 184, px: 44 } as const; // dateline baseline, size (world px)
const HAIR = { y: 204, w: 1.25 } as const; // the rule under the dateline
const HEAD = { base: 284, px: 84 } as const; // the headline

// --- the photo: the vortex, standing H_PHOTO proud of the page ---------------------------------------------------------
const H_PHOTO = 40;
const PHOTO_ASPECT = VORTEX_W / VORTEX_H;
// placed so that at f0 its CONTENT box (VORTEX_BOX) appears from y APP_TOP to APP_BOT, its axis on x 540
const APP_TOP = 294;
const APP_BOT = 1068;
const AXIS_U = VORTEX_AXIS_U; // the vortex's straight axis line, as a share of the PNG's width (measured by the cut-out script)
const PHOTO = (() => {
  const e = eyeOf(CAM.at(0));
  const s = e.Z / (e.Z - H_PHOTO);
  const top = e.y + (APP_TOP - e.y) / s; // true (page-plane) y of the content's top and bottom
  const bot = e.y + (APP_BOT - e.y) / s;
  const u0 = VORTEX_BOX[1] / VORTEX_H;
  const u1 = VORTEX_BOX[3] / VORTEX_H;
  const h = (bot - top) / (u1 - u0); // the PNG's height (true world px)
  const y = top - u0 * h; // the PNG's top
  const w = h * PHOTO_ASPECT;
  const axisX = e.x + (540 - e.x) / s;
  return { x: axisX - (AXIS_U - 0.5) * w, cy: y + h / 2, h, w };
})();

// --- the cost: 100 amber cubes ----------------------------------------------------------------------------------------
const CUBE = 40; // world px (>= 40 screen px from f0 on: k >= 1): the survivor reads at phone size
const GAP = 6;
const PITCH = CUBE + GAP;
const NX = 20; // a wide, shallow block: 20 x 5 = 100
const NY = 5;
const SURV = { col: 10, row: 0 }; // the one that stays: the centre of the row facing the vortex (23 px right of the axis)
const BLOCK = { x0: 540 - (NX * PITCH - GAP) / 2, y0: 1486 } as const; // y0 = the top row's upper edge: under the lower caption band
const BLOCK_Y0 = BLOCK.y0;
const BLOCK_Y1 = BLOCK_Y0 + NY * PITCH - GAP;
const SINK = 10;
const WAVE_SRC = { x: 540, y: BLOCK_Y1 + PITCH * 0.5 }; // the wave starts under the block's far (bottom) edge and runs toward the survivor
const distOf = (col: number, row: number) => Math.hypot(BLOCK.x0 + col * PITCH + CUBE / 2 - WAVE_SRC.x, BLOCK_Y0 + row * PITCH + CUBE / 2 - WAVE_SRC.y) / PITCH;
const MAX_D = Math.max(distOf(0, 0), distOf(NX - 1, 0));
/** the wave: f25 at the source (its first cube reads as changed by f30), the farthest cube starting so that it lies flat on "cost" (f56) */
const WAVE_F0 = 25; // the first cube visibly turns on "1" (f29)
const WAVE = { f0: WAVE_F0, f1: 56, perPitch: (56 - SINK - WAVE_F0) / MAX_D } as const;
const IMPRINT = mixHex(COLOR.creamFoot, COLOR.board, 0.5); // the printed square: the paper's dim ink tone
/** the tone ladder of a sinking cube: amber -> dimmed amber (toward board, the stout dim) -> the printed square */
const DIM_AMBER = mixHex(COLOR.amberFoot, COLOR.board, 0.55);
const toneOf = (a: string, t: number) => (t < 0.5 ? mixHex(a, mixHex(DIM_AMBER, a, 0.25), 2 * t) : mixHex(mixHex(DIM_AMBER, a, 0.25), IMPRINT, 2 * t - 1));
const SOUTH = mixHex(COLOR.amberFoot, COLOR.rung, 0.5); // the shade faces (light from above-left)
const EAST = mixHex(COLOR.amberFoot, COLOR.rung, 0.32);
const WEST = mixHex(COLOR.amberTop, COLOR.amberFoot, 0.55);
/** a top face's foot: the stout band from amberTop toward amberFoot, over each lit face (the block sits below the
 *  frame-wide band, where every face would be flat foot-amber) */
const FACE_FOOT = mixHex(COLOR.amberTop, COLOR.amberFoot, 0.65);
type CubeSpec = { i: number; col: number; row: number; x: number; y: number; start: number; survivor: boolean };
const CUBES: CubeSpec[] = (() => {
  const out: CubeSpec[] = [];
  for (let row = 0; row < NY; row++) {
    for (let col = 0; col < NX; col++) {
      const x = BLOCK.x0 + col * PITCH;
      const y = BLOCK_Y0 + row * PITCH;
      out.push({ i: row * NX + col, col, row, x, y, start: WAVE.f0 + distOf(col, row) * WAVE.perPitch, survivor: col === SURV.col && row === SURV.row });
    }
  }
  return out;
})();
const LAST_FLAT = Math.max(...CUBES.filter((c) => !c.survivor).map((c) => c.start)) + SINK;
if (LAST_FLAT > 56.5) throw new Error(`HundredthOfTheCost: the drain ends at f${LAST_FLAT.toFixed(1)}, after "cost" (f56)`);
/** a cube's state at frame f: height (world px) and tone (0 amber .. 1 imprint) */
const cubeAt = (c: CubeSpec, f: number) => {
  if (c.survivor) return { h: CUBE, t: 0 };
  const u = clamp01((f - c.start) / SINK);
  const h = CUBE * (1 - smoothstep(u));
  const t = smoothstep(clamp01((f - c.start - 1) / (SINK - 1))); // the height leads by a frame, the tone follows
  return { h, t };
};

// --- the dateline drum: SEPT 202[6 -> 7] ------------------------------------------------------------------------------
const ROLL = { f0: 63, f1: 71 } as const;
const rollAt = (f: number) => smoothstep((f - ROLL.f0) / (ROLL.f1 - ROLL.f0));

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

const Dateline: React.FC<{ f: number }> = ({ f }) => {
  const uid = `dl${useId().replace(/[^A-Za-z0-9]/g, "")}`;
  const fs = DATE.px;
  const sept = labelWidth("SEPT", fs);
  const space = 0.36 * fs;
  const adv = TNUM_ADV * fs + TRACK.numeral * fs;
  const yearW = 4 * adv - TRACK.numeral * fs;
  const x0 = 540 - (sept + space + yearW) / 2;
  const yx = x0 + sept + space; // the year's left edge
  const digitX = (i: number) => yx + i * adv + (TNUM_ADV * fs) / 2;
  const r = rollAt(f);
  const lineH = fs;
  const speed = (rollAt(f + 0.5) - rollAt(f - 0.5)) * lineH; // world px per frame
  const blur = 0.32 * speed;
  // the drum's window: the resting digit's cap box + a feather F above and below (the resting digit is never feathered)
  const F = 0.16 * fs;
  const top = DATE.base - 0.729 * fs - F;
  const bot = DATE.base + F;
  const fe = F / (bot - top);
  const numStyle: React.CSSProperties = { fontFeatureSettings: '"tnum" 1, "lnum" 1' };
  return (
    <g fill={COLOR.inkDark}>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(top)} x2="0" y2={f3(bot)}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset={f3(fe)} stopColor="#fff" stopOpacity="1" />
          <stop offset={f3(1 - fe)} stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(digitX(3) - fs)} y={f3(top)} width={f3(2 * fs)} height={f3(bot - top)}>
          <rect x={f3(digitX(3) - fs)} y={f3(top)} width={f3(2 * fs)} height={f3(bot - top)} fill={`url(#${uid}g)`} />
        </mask>
        <filter id={`${uid}b`} x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur stdDeviation={`0 ${f3(blur)}`} />
        </filter>
      </defs>
      <text x={f3(x0)} y={f3(DATE.base)} fontFamily={FONT_LABEL} fontWeight={500} fontSize={f3(fs)} letterSpacing={`${TRACK.label}em`} style={{ fontFeatureSettings: '"case" 1' }}>
        SEPT
      </text>
      {["2", "0", "2"].map((d, i) => (
        <text key={i} x={f3(digitX(i))} y={f3(DATE.base)} textAnchor="middle" fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(fs)} style={numStyle}>
          {d}
        </text>
      ))}
      <g mask={`url(#${uid}m)`}>
        <g filter={blur > 0.05 ? `url(#${uid}b)` : undefined} fontFamily={FONT_NUM} fontWeight={700} fontSize={f3(fs)} style={numStyle}>
          {r < 1 ? (
            <text x={f3(digitX(3))} y={f3(DATE.base - r * lineH)} textAnchor="middle">
              6
            </text>
          ) : null}
          {r > 0 ? (
            <text x={f3(digitX(3))} y={f3(DATE.base + (1 - r) * lineH)} textAnchor="middle">
              7
            </text>
          ) : null}
        </g>
      </g>
    </g>
  );
};

// --- the cubes --------------------------------------------------------------------------------------------------------
type Drawn = { c: CubeSpec; h: number; t: number; top: { x: number; y: number; s: number } };
const pts = (p: [number, number][]) => p.map(([x, y]) => `${f3(x)},${f3(y)}`).join(" ");

const CubeShadow: React.FC<{ cubes: Drawn[] }> = ({ cubes }) => {
  const S = 3.6; // the stout rest recipe scaled so a 40-px cube's key shadow falls as far per unit height as the photo's
  const R = ELEVATION.rest;
  const layers = [R.amb, R.key];
  return (
    <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
      {layers.map((l, li) => (
        <g key={li} opacity={f3(l.a)} style={{ filter: `blur(${f3(l.blur * S)}px)` }}>
          {cubes.map(({ c, h }) =>
            h > 0.05 ? (
              <rect key={c.i} x={f3(c.x + (l.dx * S * h) / CUBE)} y={f3(c.y + (l.dy * S * h) / CUBE)} width={CUBE} height={CUBE} rx={2} fillOpacity={f3(h / CUBE)} />
            ) : null,
          )}
        </g>
      ))}
      {/* the contact: one tight occlusion at the block's foot */}
      <g opacity={f3(R.contact ? R.contact.a * 0.6 : 0.36)} style={{ filter: "blur(1.6px)" }}>
        {cubes.map(({ c, h }) => (h > 0.05 ? <rect key={c.i} x={f3(c.x - 0.5)} y={f3(c.y + 0.5)} width={CUBE + 1} height={CUBE + 0.5} fillOpacity={f3(h / CUBE)} /> : null))}
      </g>
    </g>
  );
};

const CubeBloom: React.FC<{ cubes: Drawn[]; k: number }> = ({ cubes, k }) => (
  <g style={{ pointerEvents: "none" }}>
    {BLOOM_LAYERS.map((l, li) => (
      <g key={li} style={{ filter: `blur(${f3(l.blur / k / 2)}px)` }}>
        {cubes.map(({ c, t, top }) =>
          t < 0.999 ? <rect key={c.i} x={f3(top.x)} y={f3(top.y)} width={f3(CUBE * top.s)} height={f3(CUBE * top.s)} fill={l.color} opacity={f3(1 - t)} /> : null,
        )}
      </g>
    ))}
  </g>
);

const CubeBody: React.FC<{ d: Drawn; cam: Cam }> = ({ d, cam }) => {
  const { c, t, top } = d;
  const w = CUBE * top.s;
  const bx = c.x;
  const by = c.y;
  const tx = top.x;
  const ty = top.y;
  const tone = (a: string) => toneOf(a, t);
  const faces: React.ReactNode[] = [];
  if (ty + w < by + CUBE - 0.01) faces.push(<polygon key="s" points={pts([[bx, by + CUBE], [bx + CUBE, by + CUBE], [tx + w, ty + w], [tx, ty + w]])} fill={tone(SOUTH)} />);
  if (tx + w < bx + CUBE - 0.01) faces.push(<polygon key="e" points={pts([[bx + CUBE, by], [bx + CUBE, by + CUBE], [tx + w, ty + w], [tx + w, ty]])} fill={tone(EAST)} />);
  if (tx > bx + 0.01) faces.push(<polygon key="w" points={pts([[bx, by], [bx, by + CUBE], [tx, ty + w], [tx, ty]])} fill={tone(WEST)} />);
  const hot = 2 / cam.k; // 2 SCREEN px
  return (
    <g>
      {faces}
      <defs>
        <linearGradient id={`hc${c.i}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tone(COLOR.amberTop)} />
          <stop offset="1" stopColor={tone(FACE_FOOT)} />
        </linearGradient>
      </defs>
      <rect x={f3(tx)} y={f3(ty)} width={f3(w)} height={f3(w)} rx={3} fill={`url(#hc${c.i})`} />
      <rect x={f3(tx + 1)} y={f3(ty)} width={f3(w - 2)} height={f3(hot)} fill={tone(COLOR.amberHot)} />
    </g>
  );
};

// --- the page ---------------------------------------------------------------------------------------------------------
const Page: React.FC = () => {
  const uid = `pg${useId().replace(/[^A-Za-z0-9]/g, "")}`;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}p`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1920">
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <radialGradient id={`${uid}k`} gradientUnits="userSpaceOnUse" cx="260" cy="260" r="1500">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity="0.2" />
          <stop offset="0.5" stopColor={COLOR.amberHot} stopOpacity="0.07" />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </radialGradient>
        <pattern id={`${uid}f`} patternUnits="userSpaceOnUse" x="0" y="0" width={PAPER_TILE} height={PAPER_TILE}>
          <image href={PAPER_SRC} x="0" y="0" width={PAPER_TILE} height={PAPER_TILE} />
        </pattern>
      </defs>
      <rect x={PAGE.x0} y={PAGE.y0} width={PAGE.x1 - PAGE.x0} height={PAGE.y1 - PAGE.y0} fill={`url(#${uid}p)`} />
      <rect x={PAGE.x0} y={PAGE.y0} width={PAGE.x1 - PAGE.x0} height={PAGE.y1 - PAGE.y0} fill={`url(#${uid}f)`} style={{ mixBlendMode: "multiply" }} />
      <rect x={PAGE.x0} y={PAGE.y0} width={PAGE.x1 - PAGE.x0} height={PAGE.y1 - PAGE.y0} fill={`url(#${uid}k)`} />
      {/* masthead: the thin double rule */}
      <rect x={MARGIN} y={RULE.y} width={1080 - 2 * MARGIN} height={RULE.thick} fill={COLOR.inkDark} />
      <rect x={MARGIN} y={RULE.y + RULE.thick + RULE.gap} width={1080 - 2 * MARGIN} height={RULE.thin} fill={COLOR.inkDark} />
      <rect x={MARGIN} y={HAIR.y} width={1080 - 2 * MARGIN} height={HAIR.w} fill={COLOR.inkDark} />
    </g>
  );
};

const HundredthOfTheCost: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = CAM.at(f);
  const e = eyeOf(cam);
  const drawn: Drawn[] = CUBES.map((c) => {
    const { h, t } = cubeAt(c, f);
    return { c, h, t, top: proj(e, c.x, c.y, h) };
  });
  // painter's order: farthest from the eye first (the eye's nadir is below the block)
  const order = [...drawn].sort((a, b) => a.c.y - b.c.y || Math.abs(b.c.x + CUBE / 2 - e.x) - Math.abs(a.c.x + CUBE / 2 - e.x));
  const ph = proj(e, 0, 0, H_PHOTO);
  const photoTf = `translate(${f3(e.x * (1 - ph.s))} ${f3(e.y * (1 - ph.s))}) scale(${(Math.round(ph.s * 1e6) / 1e6).toString()})`;
  const sil = photoCutOutSil({ src: VORTEX_SRC, x: PHOTO.x, y: PHOTO.cy, h: PHOTO.h, aspect: PHOTO_ASPECT });
  return (
    <StoutStage S={f} cam={cam} rest={CAM.rest} pool={{ x: 540, y: 760 }}>
      <Page />
      <Dateline f={f} />
      <Label x={540} y={HEAD.base} k={cam.k} px={HEAD.px * cam.k} text="NAVIER–STOKES" tone="dark" />
      <CubeShadow cubes={drawn} />
      <CubeBloom cubes={drawn} k={cam.k} />
      {order.map((d) => (
        <CubeBody key={d.c.i} d={d} cam={cam} />
      ))}
      {/* the photo's one shadow, on the page (and over the cubes it floats above) */}
      <StoutShadow parts={sil} s={1.5} elevation="lifted" />
      <g transform={photoTf}>
        <PhotoCutOut src={VORTEX_SRC} x={PHOTO.x} y={PHOTO.cy} h={PHOTO.h} aspect={PHOTO_ASPECT} k={cam.k * ph.s} shadow={false} />
      </g>
    </StoutStage>
  );
};

export default HundredthOfTheCost;
