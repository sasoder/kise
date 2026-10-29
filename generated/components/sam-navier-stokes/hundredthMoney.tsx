// ---------------------------------------------------------------------------
// hundredthMoney (sam-navier-stokes, cut 1, Rev 2b): the cost as banknote bundles standing on the newsprint page,
// under HundredthOfTheCost's pinhole camera (hundredthCamera.ts). A COPY (adapted to 3D boxes) of the bundle drawing in
// will-drone-cost/ShipDayRate.tsx (cream-sage notes, ONE amber bank strap round the middle, the note's engraving:
// border, portrait oval, seal, corner figures), stacked as in scott-aircraft-order/ListForFourHundredMillion.tsx
// (bundles in tall stacks). Those files are not imported or changed.
//
// A STACK is a box on the page: footprint w x d (x, y), t per bundle, n bundles high. The camera sees its TOP (the top
// note, face up, the strap across it: a CSS-3D plane at the stack's height), its SOUTH face (the bundles' long sides:
// the notes' edges, a seam per bundle, the strap) and the end toward the camera (both projected point by point).
// When it sinks into the page its top goes DOWN (the seams travel with it), and its tone runs from the note colours
// through a dimmed note into a printed outline in the paper's dim ink: tone and height, never opacity.
// ---------------------------------------------------------------------------
import React from "react";
import { BLOOM_LAYERS, COLOR, ELEVATION, clamp01, mixHex } from "../kits/cheeky-pint/stoutShared";
import { P3, planeCss, type View } from "./hundredthCamera";

export const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// --- the bundle ------------------------------------------------------------------------------------------------------
/** world px: footprint w x d, t per bundle (a big bundle: the one that stays must read at ~250 px in the wide end) */
export const BUNDLE = { w: 390, d: 166, t: 36, strap: 0.2 } as const;
/** the top note is drawn at ShipDayRate's reference size (150 x 64) and scaled up */
const REF = { w: 150, d: 64, r: 3 } as const;
const SC = BUNDLE.w / REF.w;
const NOTE = { hi: "#DCDFC6", mid: "#C3CAAC", lo: "#9AA287", edgeHi: "#EEEBDA", strapLo: "#C98600", strapInk: "#6E4A10", print: "#4F6250" } as const;
const SEAM = "#3A2A1C";
const SEAM_H = 3; // world px: the dark seam under each bundle
// --- the tone ladder: note -> dimmed note (toward board, the stout dim) -> the printed outline ---------------------------
/** what a sunk bundle prints as: a faint tint of dim ink for its fills, the dim ink itself for its lines */
export const PRINT_FILL = mixHex(COLOR.creamFoot, COLOR.board, 0.16);
export const PRINT_INK = mixHex(COLOR.creamFoot, COLOR.board, 0.55);
const dimOf = (a: string) => mixHex(a, COLOR.board, 0.45);
const ladder = (a: string, end: string, t: number) => (t < 0.5 ? mixHex(a, dimOf(a), 2 * t) : mixHex(dimOf(a), end, 2 * t - 1));
const fillT = (a: string, t: number) => ladder(a, PRINT_FILL, t);
const inkT = (a: string, t: number) => ladder(a, PRINT_INK, t);

export type StackSpec = { i: number; col: number; row: number; x: number; y: number; n: number; start: number; survivor: boolean };
export type StackState = { s: StackSpec; h: number; t: number };

type Pt = { x: number; y: number };
const pts = (p: Pt[]) => p.map((q) => `${f3(q.x)},${f3(q.y)}`).join(" ");

// --- one union shadow for the stacks (the stout rest recipe, its offsets growing with the height) ------------------------
/** the shadow per unit height: the rest recipe's offsets for a 40-px object x 3.6 (cut 1 Rev 1's cube scale) */
const SH = 3.6 / 40;
export const StackShadow: React.FC<{ stacks: StackState[] }> = ({ stacks }) => {
  const R = ELEVATION.rest;
  const layers = [R.amb, R.key];
  const hex = (x: number, y: number, ox: number, oy: number) =>
    pts([
      { x, y },
      { x: x + BUNDLE.w, y },
      { x: x + BUNDLE.w + ox, y: y + oy },
      { x: x + BUNDLE.w + ox, y: y + BUNDLE.d + oy },
      { x: x + ox, y: y + BUNDLE.d + oy },
      { x, y: y + BUNDLE.d },
    ]);
  return (
    <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
      {layers.map((l, li) => (
        <g key={li} opacity={f3(l.a)} style={{ filter: `blur(${f3(l.blur * 3.6 * 1.6)}px)` }}>
          {stacks.map(({ s, h }) =>
            h > 0.05 ? <polygon key={s.i} points={hex(s.x, s.y, l.dx * SH * h, l.dy * SH * h)} fillOpacity={f3(clamp01(h / (2 * BUNDLE.t)))} /> : null,
          )}
        </g>
      ))}
      {/* the contact: one tight occlusion at each stack's foot */}
      <g opacity={f3(R.contact ? R.contact.a * 0.6 : 0.4)} style={{ filter: "blur(2px)" }}>
        {stacks.map(({ s, h }) =>
          h > 0.05 ? <rect key={s.i} x={f3(s.x - 1)} y={f3(s.y + 1)} width={BUNDLE.w + 2} height={BUNDLE.d + 1} fillOpacity={f3(clamp01(h / BUNDLE.t))} /> : null,
        )}
      </g>
    </g>
  );
};

// --- the stack --------------------------------------------------------------------------------------------------------
/** The top note, face up, in REF units (150 x 64). */
const TopNote: React.FC<{ t: number; uid: string; k: number; glow: number }> = ({ t, uid, k, glow }) => {
  const { w, d } = REF;
  const x = 0;
  const y = 0;
  const sw = w * BUNDLE.strap;
  const cx = x + w / 2;
  const bx = x + 5;
  const bw = w - 10;
  const fh = d; // the note's face
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={fillT(NOTE.hi, t)} />
          <stop offset="0.55" stopColor={fillT(NOTE.mid, t)} />
          <stop offset="1" stopColor={fillT(NOTE.lo, t)} />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={inkT(COLOR.amberTop, t)} />
          <stop offset="1" stopColor={inkT(NOTE.strapLo, t)} />
        </linearGradient>
      </defs>
      <rect x={f3(x)} y={f3(y)} width={w} height={d} rx={REF.r} fill={`url(#${uid}n)`} />
      {/* the engraving: a border, an inner border, the portrait oval, the seal, the corner figures */}
      <rect x={f3(bx)} y={f3(y + 4)} width={f3(bw)} height={f3(fh - 8)} rx={2} fill="none" stroke={inkT(NOTE.print, t)} strokeWidth={1.6} />
      <rect x={f3(bx + 3)} y={f3(y + 7)} width={f3(bw - 6)} height={f3(fh - 14)} rx={1.5} fill="none" stroke={inkT(mixHex(NOTE.print, NOTE.mid, 0.5), t)} strokeWidth={0.8} />
      <ellipse cx={f3(x + w * 0.24)} cy={f3(y + fh / 2)} rx={12} ry={f3(fh * 0.3)} fill={fillT(mixHex(NOTE.mid, NOTE.print, 0.3), t)} stroke={inkT(NOTE.print, t)} strokeWidth={1.2} />
      <circle cx={f3(x + w * 0.8)} cy={f3(y + fh / 2)} r={f3(fh * 0.19)} fill="none" stroke={inkT(mixHex(NOTE.print, NOTE.mid, 0.35), t)} strokeWidth={1.1} />
      {[
        [bx + 6, y + 9],
        [bx + bw - 15, y + 9],
        [bx + 6, y + fh - 14],
        [bx + bw - 15, y + fh - 14],
      ].map(([qx, qy], j) => (
        <rect key={j} x={f3(qx)} y={f3(qy)} width={9} height={5} rx={1} fill={inkT(mixHex(NOTE.print, NOTE.mid, 0.4), t)} />
      ))}
      {/* the bank strap across the middle: the cost's amber (and its bloom while it is still money) */}
      {glow > 0.01 ? (
        <g opacity={f3(glow)} style={{ filter: `blur(${f3(BLOOM_LAYERS[0].blur / k / 1.6)}px)` }}>
          <rect x={f3(cx - sw / 2 - 2)} y={f3(y - 2)} width={f3(sw + 4)} height={d + 4} fill={COLOR.amberTop} />
        </g>
      ) : null}
      <rect x={f3(cx - sw / 2)} y={f3(y - 0.6)} width={f3(sw)} height={d + 1.2} fill={`url(#${uid}s)`} />
      <rect x={f3(cx - sw / 2)} y={f3(y - 0.6)} width={f3(sw)} height={f3(1.6)} fill={inkT(COLOR.amberHot, t)} />
      <rect x={f3(cx - sw / 2 + 4)} y={f3(y + fh / 2 - 2.5)} width={f3(sw - 8)} height={5} rx={1} fill={inkT(mixHex(NOTE.strapInk, NOTE.strapLo, 0.3), t)} />
      {/* the lip toward the light catches it */}
      <rect x={f3(x + 2)} y={f3(y + d - 1.6)} width={w - 4} height={1.4} fill={fillT("#FFFBEE", t)} />
    </g>
  );
};

/** the top note's element: REF units x Q css px (rasterised at >= its screen size), PAD units round it for the bloom */
const Q = 4;
const PAD = 8;

/**
 * One stack at its current height h, toned t, seen by the view v: an SVG of its sides (screen px) and a CSS-3D plane
 * for its top note. Layers are counted from the TOP (the stack goes down into the page, its top bundles last).
 * `lit` (0..1) raises the strap's bloom (the one that stays). k: the screen scale at the stack (for blur radii).
 */
export const Stack: React.FC<{ st: StackState; v: View; k: number; lit: number }> = ({ st, v, k, lit }) => {
  const { s, h, t } = st;
  const uid = `bn${s.i}`;
  const { w, d } = BUNDLE;
  const x0 = s.x;
  const x1 = s.x + w;
  const yS = s.y + d; // the south (near) edge
  const sw = w * BUNDLE.strap;
  const cx = s.x + w / 2;
  const glow = (1 - t) * (0.55 + 0.45 * lit);
  const P = (x: number, y: number, z: number) => P3(v, x, y, z);
  const layers: React.ReactNode[] = [];
  const showS = v.C[1] > yS;
  const showW = v.C[0] < x0;
  const showE = v.C[0] > x1;
  if (h > 0.05) {
    const n = Math.ceil(h / BUNDLE.t - 1e-6);
    for (let m = n - 1; m >= 0; m--) {
      const ht = h - m * BUNDLE.t;
      const hb = Math.max(0, h - (m + 1) * BUNDLE.t);
      if (showS) {
        const a0 = P(x0, yS, hb);
        const a1 = P(x1, yS, hb);
        const b1 = P(x1, yS, ht);
        const b0 = P(x0, yS, ht);
        // the long side: the notes' edges
        layers.push(<polygon key={`s${m}`} points={pts([a0, a1, b1, b0])} fill={`url(#${uid}side)`} />);
        [0.22, 0.4, 0.58, 0.76].forEach((q, j) => {
          const z = hb + (ht - hb) * q;
          if (z <= 0.2) return;
          const l0 = P(x0 + 3, yS, z);
          const l1 = P(x1 - 3, yS, z);
          layers.push(<line key={`l${m}_${j}`} x1={f3(l0.x)} y1={f3(l0.y)} x2={f3(l1.x)} y2={f3(l1.y)} stroke={fillT(mixHex(NOTE.edgeHi, NOTE.mid, 0.2), t)} strokeWidth={f3(1.3 * k)} />);
        });
        // the strap on the long side
        layers.push(<polygon key={`st${m}`} points={pts([P(cx - sw / 2, yS, hb), P(cx + sw / 2, yS, hb), P(cx + sw / 2, yS, ht), P(cx - sw / 2, yS, ht)])} fill={`url(#${uid}ss)`} />);
        // the seam under each bundle, and the lit lip at its top
        if (hb > 0.2) layers.push(<polygon key={`se${m}`} points={pts([a0, a1, P(x1, yS, hb + SEAM_H), P(x0, yS, hb + SEAM_H)])} fill={inkT(mixHex(NOTE.lo, SEAM, 0.6), t)} />);
        layers.push(<polygon key={`lp${m}`} points={pts([P(x0, yS, ht - 2), P(x1, yS, ht - 2), b1, b0])} fill={fillT("#F4F1E2", t)} />);
      }
      const end = (xe: number, dark: number, key: string) => {
        const c0 = P(xe, s.y, hb);
        const c1 = P(xe, s.y, ht);
        const e0 = P(xe, yS, hb);
        const e1 = P(xe, yS, ht);
        layers.push(<polygon key={`${key}${m}`} points={pts([c0, e0, e1, c1])} fill={fillT(mixHex(NOTE.lo, SEAM, dark), t)} />);
        [0.3, 0.55, 0.8].forEach((q, j) => {
          const z = hb + (ht - hb) * q;
          const l0 = P(xe, s.y + 3, z);
          const l1 = P(xe, yS - 3, z);
          layers.push(<line key={`${key}l${m}_${j}`} x1={f3(l0.x)} y1={f3(l0.y)} x2={f3(l1.x)} y2={f3(l1.y)} stroke={fillT(mixHex(NOTE.lo, NOTE.mid, 0.5), t)} strokeWidth={f3(1.1 * k)} />);
        });
        if (hb > 0.2) layers.push(<polygon key={`${key}se${m}`} points={pts([c0, e0, P(xe, yS, hb + SEAM_H), P(xe, s.y, hb + SEAM_H)])} fill={inkT(mixHex(NOTE.lo, SEAM, Math.min(0.85, dark + 0.4)), t)} />);
      };
      if (showW) end(x0, 0.16, "w");
      if (showE) end(x1, 0.36, "e");
    }
  }
  const topCss = planeCss(v, Math.max(0, h), s.x - PAD * SC, s.y - PAD * SC, SC / Q, SC / Q);
  return (
    <>
      {h > 0.05 ? (
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
          <defs>
            {/* the long side is in half-shade (the light is above): darker than the lit top note */}
            <linearGradient id={`${uid}side`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={fillT(mixHex(NOTE.edgeHi, NOTE.mid, 0.35), t)} />
              <stop offset="0.5" stopColor={fillT(mixHex(NOTE.mid, NOTE.lo, 0.4), t)} />
              <stop offset="1" stopColor={fillT(mixHex(NOTE.lo, SEAM, 0.12), t)} />
            </linearGradient>
            <linearGradient id={`${uid}ss`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={inkT(COLOR.amberFoot, t)} />
              <stop offset="1" stopColor={inkT(mixHex(NOTE.strapLo, COLOR.rung, 0.5), t)} />
            </linearGradient>
          </defs>
          {/* the strap's bloom down the long side (money's one glow) */}
          {glow > 0.01 && showS ? (
            <g opacity={f3(glow)} style={{ filter: `blur(${f3(BLOOM_LAYERS[1].blur / 2)}px)` }}>
              <polygon points={pts([P(cx - sw, yS, 0), P(cx + sw, yS, 0), P(cx + sw, yS, h), P(cx - sw, yS, h)])} fill={BLOOM_LAYERS[1].color} />
            </g>
          ) : null}
          {layers}
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: (REF.w + 2 * PAD) * Q,
          height: (REF.d + 2 * PAD) * Q,
          transformOrigin: "0 0",
          transform: topCss,
        }}
      >
        <svg width={(REF.w + 2 * PAD) * Q} height={(REF.d + 2 * PAD) * Q} viewBox={`${-PAD} ${-PAD} ${REF.w + 2 * PAD} ${REF.d + 2 * PAD}`} style={{ overflow: "visible" }}>
          <TopNote t={t} uid={uid} k={k * SC} glow={glow} />
        </svg>
      </div>
    </>
  );
};
