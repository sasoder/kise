// ---------------------------------------------------------------------------
// TuberculosisToll (kyle-pandemics, cut 13). Dwarkesh map style (styles/dwarkesh-map.md), the umber page with no map,
// drawn in the 3D DEPTH manner of the Kyle London clip (DEPTH.md): one pinhole camera, a flagged ground plane, light
// from the upper left, contact shadows, atmospheric depth, parallax, painter's order. Opaque 1080x1920, 29.97 fps.
//
// CHECK LINE: "tuberculosis has killed over a billion people — a field of dead that dwarfs the 1918 flu, AIDS and
// COVID put side by side."
//
// THE LINE: "(…kind of like that.) I mean, tuberculosis has probably killed more people maybe than any other
// infectious disease. Like this horrible disease. And it's just this—"
// WORD -> FRAME: kind 4 · of 10 · like 14 · that 17 · I 22 · mean 23 · TUBERCULOSIS 26 · has 41 · probably 49 ·
// KILLED 55 · MORE 61 · PEOPLE 65 · maybe 74 · than 88 · ANY 95 · OTHER 109 · infectious 114 · DISEASE 123 · like 138 ·
// this 143 · HORRIBLE 147 · disease 155 · and 170 · it's 173 · just 176 · this 176 (the slot ends at 186).
// DURATION: the slot 13.080 -> 19.286 s = 6.206 s x 29.97 = 186 frames (f0..f185).
//
// THE MOTION: an isotype in depth, ONE FIGURE = ONE MILLION DEATHS. f0 is close on one orange-coated engraved man, the
// middle file of the front rank (~900 px tall, head at y ~450-600), his neighbours at the frame edges; the camera is
// already pulling back. One crane move (the eye rides one straight line back and up, h ~0.8 x its distance, so it
// climbs from his brow to ~17 men up; real parallax: the near ranks shrink fast, the far ones hardly) reveals that he
// is the front of an orange formation of 1,000 (25 files x 40 ranks) running back into the haze; through the reveal the
// camera holds on the block's middle, the block filling and overflowing the frame (f60-f90). From f84 it slides left as
// it keeps pulling back, and three small cream groups standing on the SAME FRONT LINE as the block, to its left, come
// into shot after "than" (f88): the 1918 flu's 50 from f95, HIV/AIDS's 44 from ~f108, COVID-19's 7 all in by f135. One
// front line, one spacing, one scale: the only difference is how far each group runs back. Left to right: COVID-19 (one
// rank of 7), HIV/AIDS (6 ranks of 7 + 2), the 1918 flu (7 ranks of 7 + 1), then TB (40 ranks of 25). The view ends
// ~38 deg down, the horizon at the top of the frame (the floor hazing into the page); the front line is centred across
// the frame (x ~33-1050, feet y ~878) and the TB block's area plainly dwarfs the cream groups. Labels slide up while
// fading in, in world space: on the floor in front of each cream group (the flu f124, AIDS f129, COVID f136), then
// TUBERCULOSIS · 1 billion+ · past 200 years in the field's middle distance (f140), all settled by ~f150; the camera then
// creeps back to the cut while every man breathes and rocks a hair. No key; no other numbers.
// Orange = the disease's toll: only the TB figures are orange; everything else is cream on the umber page.
// THE CAST: the plainest build for everyone (londonCastV2's Newton look: his own hair, a plain coat, the white band),
// ~12% with a hat under the arm, ~7% of the cream men bare-headed workers (none in the TB block: their orange is only a
// waistcoat sliver); the hair recoloured per man in the sprite (6 period tones); three head turns. Past the first ranks
// a crowd shows little more than heads, so each TB man is multiplied toward the orange by his rank (4 steps from rank 2
// back; the dark lines stay dark): the far field reads as a dense orange band.
// CAMERA (tollWorld.ts): every channel on one bell-shaped speed profile (one acceleration lobe, one deceleration lobe),
// no keys to stall on. Settled frame: horizon y ~20; the front line's feet y ~878; TB's back rank heads y ~473; the
// cream groups' back ranks y ~730-830; the labels end at y ~950 (clear of the caption bands); front-line men ~46 px.
//
// HOW: every man is one of 3 builds x 6 hair tones x 3 head turns x 2 inks (x 4 depth washes for TB), drawn ONCE by
// londonCastV2 (front pose, the form shadow on), rasterised to sprites at power-of-two sizes on demand and blitted far
// to near on one canvas with a contact shadow each (AllAdultMales' technique; pageFigures' sprite / blit idea). The
// floor is SVG on the same camera.
//
// SOURCES (verified for the brief):
//   Tuberculosis: over 1 billion deaths in the past 200 years: Paulson, "Epidemiology: A mortal foe", Nature 502,
//     S2-S3 (2013); repeated in NIH/NIAID's TB strategic plan ("more than malaria, influenza, smallpox, HIV/AIDS,
//     cholera and plague combined"). Drawn as 1,000 orange figures.
//   1918 influenza: at least 50 million deaths (CDC, "1918 Pandemic (H1N1 virus)" history page). 50 cream figures.
//   HIV/AIDS: 44.2 million deaths since the start of the epidemic (UNAIDS, Global HIV & AIDS statistics fact sheet,
//     July 2026). 44 cream figures.
//   COVID-19: more than 7 million deaths reported to WHO (WHO COVID-19 dashboard, 2024-26; reported, not excess).
//     7 cream figures.
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { z } from "zod";
import { TexcocoPage, WorldSvg, type Cam } from "../kits/maps/texcocoShared";
import { INK, LAND } from "../kits/maps/incaShared";
import { BOX, DURATION as SLOT, DZ, END_CAM, F, TB_MID_X, GROUPS, HAIRS, MEN, YAWS, cam3At, groupFrontZ, project, type Cam3, type Group, type Man } from "./tollWorld";
import { CREAM, DARK, Newton, ORANGE, POSES, Worker, headTurn, type FigPose } from "../kyle-london/londonCastV2";

export const FPS = 30000 / 1001;
export const DURATION = SLOT;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: fell } = loadFell("italic", { weights: ["400"], subsets: ["latin"] });
const { fontFamily: caslon } = loadCaslon("normal", { weights: ["400"], subsets: ["latin"] });

const FRAME_W = 1080;
const FRAME_H = 1920;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (v: number) => {
  const u = c01(v);
  return u * u * (3 - 2 * u);
};
const easeOut = (v: number) => 1 - Math.pow(1 - c01(v), 3);
const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

const END = cam3At(DURATION - 1);
const S_END = F / -END.cz;
/** the page's 2D camera (its mottle and grain ride on the front rank's plane) */
const pageCam = (c: Cam3): Cam => {
  const s = F / -c.cz;
  return { k: s / S_END, cx: 540 + (c.cx - END.cx) * S_END, cy: END.hy + S_END * ((960 - c.hy) / s - c.h + END.h) };
};

// ---------------------------------------------------------------------------
// THE FLOOR: flagstones in courses (running bond), the joints running to the VP and the rows compressing toward the
// horizon; a lighter umber near that sinks into the page with distance (atmospheric depth). Light from the upper left.
// ---------------------------------------------------------------------------
const FLAG = 300;
const FLOOR = { x0: -14000, x1: 14000, z0: -6000, zFar: 15000 };
const fadeZ = (Z: number) => 1 - c01((Z - 2500) / (FLOOR.zFar - 2500));
const Floor: React.FC<{ c: Cam3 }> = ({ c }) => {
  const zA = Math.max(FLOOR.z0, c.cz + 60);
  const pt = (X: number, Z: number) => {
    const p = project(c, X, 0, Z);
    return p ? `${p.x.toFixed(1)},${p.y.toFixed(1)}` : "0,0";
  };
  // the tone: bands from near to far
  const bands: React.ReactNode[] = [];
  const NB = 16;
  for (let i = 0; i < NB; i++) {
    const za = mix(zA, FLOOR.zFar, Math.pow(i / NB, 1.7));
    const zb = mix(zA, FLOOR.zFar, Math.pow((i + 1) / NB, 1.7));
    bands.push(<path key={i} d={`M${pt(FLOOR.x0, za)}L${pt(FLOOR.x1, za)}L${pt(FLOOR.x1, zb)}L${pt(FLOOR.x0, zb)}Z`} fill="#6A5838" opacity={0.34 * fadeZ((za + zb) / 2)} />);
  }
  // joints along Z, in depth pieces that fade and thin
  const lines: React.ReactNode[] = [];
  const pieces = 22;
  const zAt = (i: number) => mix(zA, FLOOR.zFar, Math.pow(i / pieces, 1.6));
  const sw = (Z: number) => Math.max(0.55, Math.min(3, 3.2 * (F / (Z - c.cz))));
  for (let i = 0; i < pieces; i++) {
    const za = zAt(i);
    const zb = zAt(i + 1);
    const zm = (za + zb) / 2;
    const a = fadeZ(zm);
    if (a < 0.02) continue;
    let d = "";
    for (let X = Math.ceil(FLOOR.x0 / FLAG) * FLAG; X <= FLOOR.x1; X += FLAG) d += `M${pt(X, za)}L${pt(X, zb)}`;
    lines.push(<path key={`l${i}`} d={d} fill="none" stroke={DARK} strokeWidth={sw(zm)} strokeOpacity={0.5 * a} />);
  }
  // the cross joints: one course per FLAG of depth, staggered by half a flag course to course
  const cross: Record<string, string> = {};
  for (let Z = Math.floor(zA / FLAG) * FLAG; Z < FLOOR.zFar; Z += FLAG) {
    if (Z < zA) continue;
    const a = fadeZ(Z);
    if (a < 0.03) continue;
    const key = `${Math.round(a * 8)}|${Math.round(sw(Z) * 4)}`;
    const off = (Math.round(Z / FLAG) % 2) * FLAG * 0.5;
    let d = "";
    for (let X = Math.ceil(FLOOR.x0 / FLAG) * FLAG + off; X < FLOOR.x1; X += FLAG) d += `M${pt(X, Z)}L${pt(X + FLAG, Z)}`;
    cross[key] = (cross[key] ?? "") + d;
  }
  Object.entries(cross).forEach(([key, d]) => {
    const [a8, w4] = key.split("|").map(Number);
    lines.push(<path key={`x${key}`} d={d} fill="none" stroke={DARK} strokeWidth={w4 / 4} strokeOpacity={0.45 * (a8 / 8)} />);
  });
  // the lit upper-left edge of each near flag: a faint cream line just inside the far joint
  let lit = "";
  for (let Z = Math.floor(zA / FLAG) * FLAG; Z < 3000; Z += FLAG) {
    if (Z < zA) continue;
    const off = (Math.round(Z / FLAG) % 2) * FLAG * 0.5;
    for (let X = Math.ceil(FLOOR.x0 / FLAG) * FLAG + off; X < FLOOR.x1; X += FLAG) lit += `M${pt(X + 14, Z + 16)}L${pt(X + FLAG - 30, Z + 16)}`;
  }
  return (
    <g>
      {bands}
      {lines}
      <path d={lit} fill="none" stroke={INK} strokeWidth={sw(800) * 0.6} strokeOpacity={0.07} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// SPRITES: kind x hair x yaw x ink x size, rasterised from londonCastV2's own SVG on demand
// ---------------------------------------------------------------------------
/** px per unit of each size; a man is blitted from the smallest sprite at least his size */
const TIERS = [3.2, 1.6, 0.8, 0.4, 0.2, 0.1, 0.05];
type Sprite = { c: HTMLCanvasElement; sc: number };
const SPRITES = new Map<number, Sprite>();
const LOADING = new Map<number, Promise<void>>();
/** the depth wash of the TB men: past the first ranks a dense crowd shows little more than heads, so the orange would
 *  be lost; each TB man is multiplied toward the orange by his rank (4 steps), the front ranks untouched */
const TINT = [0, 0.38, 0.62, 0.82];
const tintOf = (m: Man) => {
  if (!m.orange) return 0;
  const j = Math.round(m.Z / DZ);
  return j <= 1 ? 0 : j <= 3 ? 1 : j <= 6 ? 2 : 3;
};
const typeOf = (m: Man) => ((((m.kind * HAIRS + m.hair) * YAWS.length + m.yaw) * 2 + (m.orange ? 1 : 0)) * 4) + tintOf(m);
const typeParts = (type: number) => {
  const tint = type % 4;
  const q0 = Math.floor(type / 4);
  const orange = q0 % 2 === 1;
  const q = Math.floor(q0 / 2);
  return { orange, tint, yaw: q % YAWS.length, hair: Math.floor(q / YAWS.length) % HAIRS, kind: Math.floor(q / YAWS.length / HAIRS) };
};
/** Newton's own hair (greyBrown, at full cream ink) and the tones it is recoloured to in the sprite's SVG (londonCastV2's
 *  HAIR_TONES: greyBrown, darkBrown, chestnut, midBrown, blackBrown, fair), so the crowd is not one man's hair */
const HAIR_FROM = ["#d2c9b0", "#a99e86", "#7a715e"];
const HAIR_TO = [
  ["#d2c9b0", "#a99e86", "#7a715e"],
  ["#977b5c", "#6f5640", "#4a3828"],
  ["#b78e62", "#8c6745", "#5f4430"],
  ["#b59c77", "#8e7555", "#64513a"],
  ["#7e6650", "#58463a", "#3a2e24"],
  ["#e2d0a6", "#c6af82", "#98835c"],
];
const recolourHair = (svg: string, hair: number) => HAIR_FROM.reduce((acc, from, i) => acc.replace(new RegExp(from, "gi"), HAIR_TO[hair][i]), svg);
const keyOf = (type: number, tier: number) => type * 8 + tier;
const tierFor = (s: number) => {
  let t = 0;
  while (t < TIERS.length - 1 && TIERS[t + 1] >= s * 0.97) t++;
  return t;
};
const spriteSize = (key: number) => {
  const sc = TIERS[key & 7];
  return { type: key >> 3, sc, w: Math.ceil((BOX.x1 - BOX.x0) * sc) + 2, h: Math.ceil((BOX.y1 - BOX.y0) * sc) + 2 };
};
const ManArt: React.FC<{ type: number; at: [number, number]; scale: number; uid: string }> = ({ type, at, scale, uid }) => {
  const t = typeParts(type);
  const pose: FigPose = headTurn(POSES.front(), YAWS[t.yaw], 1);
  const coat = t.orange ? ORANGE : CREAM;
  // the plainest build for everyone: Newton's look (his own hair, a plain coat, the white band); a few with a hat under
  // the arm; a few bare-headed workers
  if (t.kind === 2) return <Worker pose={pose} at={at} scale={scale} coat={coat} uid={uid} shade={1} cap={false} />;
  return <Newton pose={pose} at={at} scale={scale} coat={coat} uid={uid} shade={1} hat={t.kind === 1} />;
};
const SpriteSource: React.FC<{ spriteKey: number }> = ({ spriteKey }) => {
  const { type, sc, w, h } = spriteSize(spriteKey);
  return (
    <svg data-sprite={spriteKey} xmlns="http://www.w3.org/2000/svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <ManArt type={type} at={[-BOX.x0 * sc + 1, -BOX.y0 * sc + 1]} scale={sc} uid={`tt${spriteKey}`} />
    </svg>
  );
};
const loadSprite = (key: number, node: Element): Promise<void> => {
  const had = LOADING.get(key);
  if (had) return had;
  const { sc, w, h } = spriteSize(key);
  const svg = recolourHair(new XMLSerializer().serializeToString(node), typeParts(key >> 3).hair);
  const p = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      const ctx = c.getContext("2d") as CanvasRenderingContext2D;
      // a small man's own outline is thinner than a pixel: a dark casing keeps a mass of them separate men
      const casing = Math.max(0, 0.95 - 1.5 * sc);
      if (casing > 0.05) {
        const sil = document.createElement("canvas");
        sil.width = w;
        sil.height = h;
        const sx = sil.getContext("2d") as CanvasRenderingContext2D;
        sx.drawImage(img, 0, 0, w, h);
        sx.globalCompositeOperation = "source-in";
        sx.fillStyle = DARK;
        sx.fillRect(0, 0, w, h);
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 8; i++) ctx.drawImage(sil, casing * Math.cos((i * Math.PI) / 4), casing * Math.sin((i * Math.PI) / 4));
        ctx.globalAlpha = 1;
      }
      ctx.drawImage(img, 0, 0, w, h);
      const tint = TINT[typeParts(key >> 3).tint];
      if (tint > 0) {
        // multiply toward the orange (cream -> orange, the dark lines stay dark), then restore the man's own alpha
        const base = document.createElement("canvas");
        base.width = w;
        base.height = h;
        (base.getContext("2d") as CanvasRenderingContext2D).drawImage(c, 0, 0);
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = mixHex("#FFFFFF", ORANGE.main, tint);
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(base, 0, 0);
        ctx.globalCompositeOperation = "source-over";
      }
      SPRITES.set(key, { c, sc });
      resolve();
    };
    img.onerror = () => reject(new Error(`TuberculosisToll: sprite ${key} did not rasterise`));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  LOADING.set(key, p);
  return p;
};
/** the contact shadow: a soft dark ellipse, rasterised once */
let SHADOW: HTMLCanvasElement | null = null;
const shadowSprite = () => {
  if (SHADOW) return SHADOW;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d") as CanvasRenderingContext2D;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(23,18,13,0.85)");
  g.addColorStop(0.6, "rgba(23,18,13,0.6)");
  g.addColorStop(1, "rgba(23,18,13,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  SHADOW = c;
  return c;
};

// ---------------------------------------------------------------------------
// A FRAME: who is in view, from which sprite; drawn far to near with a contact shadow each and depth veils
// ---------------------------------------------------------------------------
type Plan = { n: number; idx: Int32Array; sx: Float32Array; sy: Float32Array; s: Float32Array; key: Int32Array; keys: number[] };
const planAt = (f: number): Plan => {
  const c = cam3At(f);
  const N = MEN.length;
  const idx = new Int32Array(N);
  const sx = new Float32Array(N);
  const sy = new Float32Array(N);
  const ss = new Float32Array(N);
  const key = new Int32Array(N);
  const seen = new Set<number>();
  let n = 0;
  for (let i = 0; i < N; i++) {
    const m = MEN[i];
    const p = project(c, m.X, 0, m.Z);
    if (!p) continue;
    if (p.x + BOX.x1 * p.s < 0 || p.x + BOX.x0 * p.s > FRAME_W || p.y + BOX.y0 * p.s > FRAME_H || p.y + BOX.y1 * p.s < 0) continue;
    const k = keyOf(typeOf(m), tierFor(p.s));
    idx[n] = i;
    sx[n] = p.x;
    sy[n] = p.y;
    ss[n] = p.s;
    key[n] = k;
    seen.add(k);
    n++;
  }
  return { n, idx, sx, sy, s: ss, key, keys: [...seen] };
};
/** depth veils: once the men beyond each Z are drawn, a veil of the page over them (atmospheric depth) */
const HAZE_Z = [5200, 4400, 3600, 2800, 2000, 1200];
const drawPlan = (ctx: CanvasRenderingContext2D, p: Plan, f: number) => {
  const c = cam3At(f);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const sh = shadowSprite();
  let band = 0;
  for (let j = 0; j < p.n; j++) {
    const m = MEN[p.idx[j]];
    while (band < HAZE_Z.length && m.Z < HAZE_Z[band]) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "source-atop";
      ctx.globalAlpha = 0.075;
      ctx.fillStyle = LAND;
      ctx.fillRect(0, 0, FRAME_W, FRAME_H);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      band++;
    }
    const s = p.s[j];
    // the contact shadow on the floor, offset to the lower right (light from the upper left)
    const w = 78;
    const dd = 44;
    const ps = project(c, m.X + 0.2 * w, 0, m.Z - 0.2 * dd);
    const pf = project(c, m.X, 0, m.Z - dd);
    const pb = project(c, m.X, 0, m.Z + dd);
    if (ps && pf && pb) {
      const rx = w * ps.s;
      const ry = Math.max(0.8, (pf.y - pb.y) / 2);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(sh, ps.x - rx, ps.y - ry, 2 * rx, 2 * ry);
    }
    const sp = SPRITES.get(p.key[j]);
    if (!sp) continue;
    const q = s / sp.sc;
    const dw = sp.c.width * q;
    const dh = sp.c.height * q;
    const ox = (BOX.x0 * sp.sc - 1) * q;
    const oy = (BOX.y0 * sp.sc - 1) * q;
    // alive: a man rocks a hair about his feet and breathes, each on his own time
    const a = ((0.5 * Math.sin(f / 14.5 + m.ph) + 0.22 * Math.sin(f / 7.9 + 2.1 * m.ph)) * Math.PI) / 180;
    const br = 1 + 0.004 * Math.sin(f / 11 + 1.7 * m.ph);
    const co = Math.cos(a);
    const si = Math.sin(a);
    ctx.setTransform(co, si, -si * br, co * br, p.sx[j], p.sy[j]);
    ctx.drawImage(sp.c, ox, oy, dw, dh);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ---------------------------------------------------------------------------
// LABELS: in world space, standing on the floor in front of each group; slide up while fading in (12 frames)
// ---------------------------------------------------------------------------
/** sizes and gaps in screen px AT THE SETTLED END FRAME (converted to world units at the label's depth, so the label
 *  lives in world space and scales with the camera) */
type LabelLine = { text: string; font: string; size: number; spacing?: number; gap: number };
const WorldLabel: React.FC<{ c: Cam3; X: number; Z: number; Y?: number; lines: LabelLine[]; frame: number; f0: number; halo?: number }> = ({ c, X, Z, Y = 0, lines, frame, f0, halo = 0 }) => {
  const u = c01((frame - f0) / 12);
  const p0 = project(c, X, Y, Z);
  const sEnd = F / (Z - END_CAM.cz);
  const p = p0 ? { ...p0, s: p0.s / sEnd } : null;
  if (u <= 0 || !p) return null;
  const e = easeOut(u);
  let y = p.y;
  const els: React.ReactNode[] = [];
  lines.forEach((l, i) => {
    const size = l.size * p.s;
    y += (i === 0 ? size * 0.8 : l.gap * p.s);
    els.push(
      <text
        key={i}
        x={p.x + (l.spacing ?? 0) * size * 0.5}
        y={y}
        textAnchor="middle"
        fill={INK}
        stroke={DARK}
        strokeOpacity={0.8}
        strokeWidth={size * 0.16}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ fontFamily: l.font, fontSize: size, letterSpacing: (l.spacing ?? 0) * size, fontVariantNumeric: "lining-nums" }}
      >
        {/* digits always in Caslon's lining figures (Fell's old-style 1 reads as a letter) */}
        {l.text.split(/(\d+)/).map((run, k) =>
          /^\d+$/.test(run) && l.font !== caslon ? (
            <tspan key={k} style={{ fontFamily: caslon, letterSpacing: 0.04 * size }} fontSize={size * 0.9}>
              {run}
            </tspan>
          ) : (
            run
          ),
        )}
      </text>,
    );
  });
  const lift = 0.5 * lines[0].size * p.s * (1 - e);
  return (
    <g opacity={ease(u)} transform={`translate(0 ${lift.toFixed(2)})`}>
      {halo > 0 ? <ellipse cx={p.x} cy={(p.y + y) / 2 + 4 * p.s} rx={halo * p.s} ry={(y - p.y) * 0.95 + 6 * p.s} fill="url(#tt-halo)" /> : null}
      {els}
    </g>
  );
};

const TuberculosisToll: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const plan = useMemo(() => planAt(frame), [frame]);
  const ref = useRef<HTMLCanvasElement>(null);
  const bench = useRef<HTMLDivElement>(null);
  const waiting = useRef<number | null>(null);
  const [jobs, setJobs] = useState<number[]>([]);
  useLayoutEffect(() => {
    const missing = plan.keys.filter((k) => !SPRITES.has(k));
    if (!missing.length) {
      const ctx = ref.current?.getContext("2d");
      if (ctx) drawPlan(ctx, plan, frame);
      if (waiting.current !== null) {
        continueRender(waiting.current);
        waiting.current = null;
      }
      return;
    }
    if (waiting.current === null) waiting.current = delayRender("TuberculosisToll: rasterising the figure sprites", { timeoutInMilliseconds: 240000 });
    const nodes = new Map<number, Element>();
    bench.current?.querySelectorAll("svg[data-sprite]").forEach((el) => nodes.set(Number(el.getAttribute("data-sprite")), el));
    if (missing.some((k) => !nodes.has(k) && !LOADING.has(k))) {
      setJobs(missing);
      return;
    }
    Promise.all(missing.map((k) => loadSprite(k, nodes.get(k) as Element)))
      .then(() => setJobs([]))
      .catch((err) => cancelRender(err));
  }, [plan, frame, jobs]);
  const c = cam3At(frame);
  const id: Cam = { k: 1, cx: 540, cy: 960 };
  // the labels: the cream groups' on the floor in front of their front rows; TUBERCULOSIS on the field
  const groupLabel = (g: Group, i: number) => (
    <WorldLabel
      key={g.name}
      c={c}
      X={g.cx}
      Z={groupFrontZ(g) - 90}
      lines={[
        { text: g.name, font: fellSC, size: 29, spacing: 0.08, gap: 0 },
        { text: g.count, font: caslon, size: 27, gap: 32 },
      ]}
      frame={frame}
      f0={[136, 129, 124][i]}
    />
  );
  return (
    <AbsoluteFill>
      <TexcocoPage cam={pageCam(c)}>
        <WorldSvg cam={id}>
          <Floor c={c} />
        </WorldSvg>
        <canvas ref={ref} width={FRAME_W} height={FRAME_H} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
        <WorldSvg cam={id}>
          <defs>
            <radialGradient id="tt-halo">
              <stop offset="0" stopColor={DARK} stopOpacity={0.62} />
              <stop offset="0.65" stopColor={DARK} stopOpacity={0.4} />
              <stop offset="1" stopColor={DARK} stopOpacity={0} />
            </radialGradient>
          </defs>
          {GROUPS.map(groupLabel)}
          <WorldLabel
            c={c}
            X={TB_MID_X}
            Z={2300}
            Y={-330}
            halo={270}
            lines={[
              { text: "TUBERCULOSIS", font: fellSC, size: 34, spacing: 0.1, gap: 0 },
              { text: "1 billion+", font: caslon, size: 46, gap: 47 },
              { text: "past 200 years", font: fell, size: 26, gap: 33 },
            ]}
            frame={frame}
            f0={140}
          />
        </WorldSvg>
      </TexcocoPage>
      <div ref={bench} style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, overflow: "hidden", visibility: "hidden" }}>
        {jobs.map((k) => (
          <SpriteSource key={k} spriteKey={k} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

export default TuberculosisToll;
