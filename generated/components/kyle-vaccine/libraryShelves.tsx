// ---------------------------------------------------------------------------
// libraryShelves: the BOOKS of the kyle-vaccine library (libraryWorld.tsx is the API; this file is its shelf art).
// One "case section" = one bay-wide piece of a bookcase face, drawn FRONTAL in its own local units (x right 0..SEC_W,
// y down 0..CASE_H from the case top): the top board, six compartments with a dark back, shelf boards, a plinth, the
// half-uprights at both edges, and the books standing on each shelf as air-lit spines (muted local colours, varied
// heights and widths, runs of a set, small gaps, a few leaning volumes, slight tilts), seeded and stable.
// All spines of a section draw as ~20 merged paths (one per colour + the shared light / shade / band layers), so a
// live section is cheap; every non-hero section is BAKED once per render tab to a JPEG blob (useShelfTextures) and
// blitted as an <image>. The live hero sections (the vaccine slot's) use the same art, so they match.
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";
// @ts-expect-error react-dom ships no types for its server entry here (nothing may be installed); typed below
import * as ReactDomServer from "react-dom/server";
import { mixHex } from "../kits/dwarkesh-3d/dwarkesh3d";

const renderToStaticMarkup = (ReactDomServer as { renderToStaticMarkup: (el: React.ReactElement) => string }).renderToStaticMarkup;

// ---- the case section ---------------------------------------------------------------------------------------------
export const SEC_W = 220;
export const CASE_H = 450;
export const NSH = 6;
export const TOPB = 14;
export const PLINTH = 26;
export const BOARD = 5;
export const UPR = 4.5;
/** compartment pitch */
export const CH = (CASE_H - TOPB - PLINTH) / NSH;
/** local y (down from the case top) of shelf j's standing surface, and of its compartment's ceiling */
export const shelfFloorY = (j: number) => TOPB + (j + 1) * CH - (j < NSH - 1 ? BOARD : 0);
export const shelfCeilY = (j: number) => TOPB + j * CH;

/** the timber of the cases (a dark warm oak) and the compartments' dark backs */
export const OAK = { lit: "#93714D", mid: "#674B33", dark: "#34261A" };
export const CASE_BACK = "#2B2019";
const SHADOW = "#22180F";
const CREAM = "#F3EBDD";

/** book cloth and leather: muted local colours (umber, oatmeal, slate, dusty teal, muted red-brown, cream, khaki ...);
 *  nothing near the orange hue (THE ORANGE RULE: only the vaccine book glows) */
export const BOOK_COLS = ["#7A5A3E", "#CDBB98", "#5E6B70", "#5F8580", "#8A4E3C", "#E2D6BE", "#9A9070", "#4F5E52", "#4A3828", "#6E7B6A", "#A08A6A", "#7B4A3A", "#56606A", "#B9A98A", "#3F4A4C", "#8C7B66"];

export type SBook = { x: number; w: number; h: number; c: number; tilt: number; band: number; label: boolean };

// a small seeded generator (mulberry32)
const rngOf = (seed: number) => {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** a gap kept free on one shelf: [x0, x1] local, books beside it stand upright */
export type Gap = { shelf: number; x0: number; x1: number };

const shelfBooks = (seed: number, shelf: number, gap?: Gap): SBook[] => {
  const r = rngOf(seed * 131 + shelf * 17 + 7);
  const maxH = shelfFloorY(shelf) - shelfCeilY(shelf) - 3.5;
  const out: SBook[] = [];
  const x1 = SEC_W - UPR - 0.6;
  let x = UPR + 0.4 + r() * 2.5;
  // a row may open with a short empty stretch and a leaning book (one in five rows)
  let pendingLean = r() < 0.2;
  while (x < x1 - 3) {
    if (gap && x + 3 > gap.x0 && x < gap.x1) {
      x = gap.x1;
      continue;
    }
    const n = 1 + Math.floor(Math.pow(r(), 1.6) * 8);
    const c = Math.floor(r() * BOOK_COLS.length);
    const hh = maxH * (0.7 + 0.28 * Math.pow(r(), 0.6));
    const ww = 4.2 + Math.pow(r(), 1.8) * 9;
    const band = r() < 0.7 ? (r() < 0.5 ? 1 : 2) : 0;
    const label = r() < 0.45;
    let placed = 0;
    let hitGap = false;
    for (let i = 0; i < n; i++) {
      const w = ww * (0.88 + 0.24 * r());
      const h = Math.min(maxH, hh * (0.97 + 0.05 * r()));
      if (x + w > x1) break;
      if (gap && x + w > gap.x0 - 0.3 && x < gap.x1) {
        hitGap = true;
        break;
      }
      placed++;
      const nearGap = gap && (Math.abs(x + w - gap.x0) < 16 || Math.abs(x - gap.x1) < 16);
      out.push({ x, w, h, c, tilt: nearGap ? 0 : (r() - 0.5) * 1.4, band, label });
      x += w + 0.15 + r() * 0.35;
    }
    if (hitGap && gap) {
      // close the row up to the slot with one fitting volume, so the slot is exactly the book's width
      const room = gap.x0 - 0.3 - x;
      if (room > 3.2) out.push({ x, w: Math.min(room, 14), h: maxH * (0.8 + 0.12 * r()), c: Math.floor(r() * BOOK_COLS.length), tilt: 0, band: 1, label: false });
      x = gap.x1 + 0.3;
      continue;
    }
    if (!placed) break;
    // now and then: a small gap and a leaning volume resting on its right neighbour
    if ((pendingLean || r() < 0.1) && x < x1 - 40 && !(gap && Math.abs(x - gap.x0) < 50)) {
      pendingLean = false;
      const h = maxH * (0.72 + 0.22 * r());
      const w = 5 + r() * 6;
      const t = 9 + r() * 12;
      const gx = x + 1 + r() * 3;
      out.push({ x: gx, w, h, c: Math.floor(r() * BOOK_COLS.length), tilt: t, band: r() < 0.5 ? 1 : 0, label: false });
      x = gx + w + h * Math.sin((t * Math.PI) / 180) * 0.98 + 0.6;
    }
  }
  return out;
};

/** the books of one case section, per shelf (seeded by the variant; `gap` keeps a slot free) */
const LAYOUTS = new Map<string, SBook[][]>();
export const caseBooks = (variant: number, gap?: Gap): SBook[][] => {
  const key = `${variant}|${gap ? `${gap.shelf},${gap.x0},${gap.x1}` : ""}`;
  const hit = LAYOUTS.get(key);
  if (hit) return hit;
  const v = Array.from({ length: NSH }, (_, j) => shelfBooks(variant + 1, j, gap && gap.shelf === j ? gap : undefined));
  LAYOUTS.set(key, v);
  return v;
};

// ---- drawing ------------------------------------------------------------------------------------------------------
const f2 = (v: number) => v.toFixed(2);
/** a rect (x, y, w, h) rotated by deg about (px, py), as a path */
const rq = (x: number, y: number, w: number, h: number, deg: number, px: number, py: number) => {
  if (Math.abs(deg) < 1e-3) return `M${f2(x)} ${f2(y)}h${f2(w)}v${f2(h)}h${f2(-w)}Z`;
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const t = (X: number, Y: number) => {
    const dx = X - px;
    const dy = Y - py;
    return `${f2(px + dx * c - dy * s)} ${f2(py + dx * s + dy * c)}`;
  };
  return `M${t(x, y)}L${t(x + w, y)}L${t(x + w, y + h)}L${t(x, y + h)}Z`;
};

/** one case section, frontal, local units (x 0..SEC_W, y 0..CASE_H down). `books` from caseBooks. */
export const ShelfSectionArt: React.FC<{ books: SBook[][]; uid: string }> = ({ books, uid }) => {
  const byCol: string[] = BOOK_COLS.map(() => "");
  let lit = "";
  let shade = "";
  let bandD = "";
  let bandL = "";
  let lab = "";
  let cap = "";
  let gaps = "";
  books.forEach((row, j) => {
    const yb = shelfFloorY(j);
    row.forEach((b) => {
      const y = yb - b.h;
      // pivot: a leaning book turns about its bottom-right corner, a slight tilt about its bottom centre
      const lean = b.tilt > 5;
      const px = lean ? b.x + b.w : b.x + b.w / 2;
      const T = (x: number, yy: number, w: number, h: number) => rq(x, yy, w, h, b.tilt, px, yb);
      byCol[b.c] += T(b.x, y, b.w, b.h);
      lit += T(b.x, y, b.w * 0.2, b.h);
      shade += T(b.x + b.w * 0.72, y, b.w * 0.28, b.h);
      cap += T(b.x, y, b.w, Math.min(1.1, b.h * 0.03));
      if (b.band) {
        const dark = b.c % 3 !== 0;
        const d = T(b.x, y + b.h * 0.09, b.w, 1.3) + T(b.x, y + b.h * 0.86, b.w, 1.3) + (b.band === 2 ? T(b.x, y + b.h * 0.13, b.w, 0.8) : "");
        if (dark) bandD += d;
        else bandL += d;
      }
      if (b.label) lab += T(b.x + b.w * 0.16, y + b.h * 0.2, b.w * 0.66, b.h * 0.11);
      // the dark sliver between a leaning book and its base
      if (lean) gaps += rq(b.x - 1, yb - 3, 3, 3, 0, 0, 0);
    });
  });
  // the case: back, boards, uprights, plinth
  let boards = "";
  let boardRim = "";
  for (let j = 0; j < NSH - 1; j++) {
    const yb = shelfFloorY(j);
    boards += `M${UPR} ${f2(yb)}H${SEC_W - UPR}V${f2(yb + BOARD)}H${UPR}Z`;
    boardRim += `M${UPR} ${f2(yb + 0.4)}H${SEC_W - UPR}`;
  }
  const gid = `${uid}u`;
  return (
    <g>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SHADOW} stopOpacity="0.75" />
          <stop offset="1" stopColor={SHADOW} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={SEC_W} height={CASE_H} fill={CASE_BACK} />
      {byCol.map((d, i) => (d ? <path key={i} d={d} fill={BOOK_COLS[i]} /> : null))}
      <path d={lit} fill={CREAM} opacity={0.16} />
      <path d={shade} fill={SHADOW} opacity={0.3} />
      <path d={bandD} fill={SHADOW} opacity={0.35} />
      <path d={bandL} fill={CREAM} opacity={0.32} />
      <path d={lab} fill={CREAM} opacity={0.2} />
      <path d={cap} fill={CREAM} opacity={0.3} />
      {gaps ? <path d={gaps} fill={SHADOW} opacity={0.5} /> : null}
      {/* the shadow under each shelf above (and under the top board) */}
      {Array.from({ length: NSH }, (_, j) => (
        <rect key={`u${j}`} x={UPR} y={shelfCeilY(j)} width={SEC_W - 2 * UPR} height={10} fill={`url(#${gid})`} />
      ))}
      <path d={boards} fill={OAK.mid} />
      <path d={boardRim} stroke={CREAM} strokeWidth={0.7} strokeOpacity={0.35} />
      {/* top board, plinth, half-uprights */}
      <rect x={0} y={0} width={SEC_W} height={TOPB} fill={OAK.mid} />
      <rect x={0} y={0} width={SEC_W} height={1.2} fill={CREAM} opacity={0.35} />
      <rect x={0} y={TOPB - 2.5} width={SEC_W} height={2.5} fill={OAK.dark} opacity={0.6} />
      <rect x={0} y={CASE_H - PLINTH} width={SEC_W} height={PLINTH} fill={mixHex(OAK.mid, OAK.dark, 0.35)} />
      <rect x={0} y={CASE_H - PLINTH} width={SEC_W} height={1.2} fill={CREAM} opacity={0.25} />
      <rect x={0} y={0} width={UPR} height={CASE_H} fill={mixHex(OAK.mid, OAK.dark, 0.25)} />
      <rect x={SEC_W - UPR} y={0} width={UPR} height={CASE_H} fill={OAK.mid} />
      <rect x={SEC_W - UPR} y={0} width={0.9} height={CASE_H} fill={CREAM} opacity={0.3} />
    </g>
  );
};

// ---- the bake -----------------------------------------------------------------------------------------------------
/** baked variants and their resolution (px per unit) */
export const NVAR = 10;
export const PXU = 4;
const TEX = new Map<number, string>();
let PENDING: Promise<void> | null = null;
const bakeOne = (v: number) =>
  new Promise<void>((resolve, reject) => {
    const W = SEC_W * PXU;
    const H = CASE_H * PXU;
    const svg = renderToStaticMarkup(
      <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${SEC_W} ${CASE_H}`}>
        <ShelfSectionArt books={caseBooks(v)} uid={`bk${v}`} />
      </svg>,
    );
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d") as CanvasRenderingContext2D;
      ctx.drawImage(img, 0, 0);
      c.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("bake failed"));
          const url = URL.createObjectURL(blob);
          const pre = new Image();
          pre.onload = () => {
            TEX.set(v, url);
            resolve();
          };
          pre.onerror = reject;
          pre.src = url;
        },
        "image/jpeg",
        0.92,
      );
    };
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
const bakeAll = () => {
  if (!PENDING) PENDING = Promise.all(Array.from({ length: NVAR }, (_, v) => bakeOne(v))).then(() => undefined);
  return PENDING;
};
/** the baked shelf textures (blob URLs by variant), baked once per render tab; delays the render until ready */
export const useShelfTextures = (): Map<number, string> => {
  const ready = TEX.size === NVAR;
  const [handle] = useState(() => (ready ? null : delayRender("baking library shelves", { timeoutInMilliseconds: 120000 })));
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    if (handle === null) return;
    let alive = true;
    bakeAll().then(
      () => {
        if (alive) setTick((t) => t + 1);
        continueRender(handle);
      },
      () => continueRender(handle),
    );
    return () => {
      alive = false;
    };
  }, [handle]);
  return TEX;
};
