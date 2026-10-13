// TALENT_SHARED_READY
import React, { useId } from "react";
import { AbsoluteFill } from "remotion";
import type { Cam } from "./outgrowShared";
import {
  ALPHA,
  BLOOM_LAYERS,
  COLOR,
  EDGE,
  ELEVATION,
  ElevationShadow,
  GEO,
  StoutStage,
  amberBandFor,
  clamp01,
  lerp,
  mixHex,
  opticalFit,
  rectPath,
  type Elevation,
  type ShadowLayer,
} from "./stoutShared";

// ===========================================================================
// talentShared — the vocabulary of the "Talent density beat team size" clip (Cheeky Pint S4E03, Meta /
// MSL), in the stout system (stoutShared.tsx: every colour, radius, edge, shadow and bloom below is one
// of its tokens). API notes: out/talent/SHARED_READY.md.
//
//   PersonPeg   a person: head + shoulders, cut from card, top-lit, standing in a SLOT of the surface
//               it is on. KRAFT = anybody (context). AMBER = one of the picked (the stout amber band,
//               the fixed bloom, the hot top edge). `sink` lowers it INTO its slot (clipped at the slot
//               line: it never shrinks or fades).
//   PegSlot     the slot mark a peg stands in / leaves behind.
//   PegShadows  ONE shadow for any number of pegs (a crowd is one layer, never 70 stacked blurs).
//   TeamTile    a cream card with cols x rows peg slots; the picked sit in it shoulder to shoulder and
//               the filled tile is ONE object with ONE shadow (the pegs stand inside the tile's own
//               outline, so the union silhouette is the tile). teamTileLayout() gives the slot feet.
//   MetaMark    the Meta infinity knocked out of a cream tile to the ground (the FourThings treatment).
//   Label       = stoutShared's Label (Söhne Kräftig caps, TYPE.LABEL, blur-in + 24 px slide-up).
//
// THE VIEW. The board is seen from the front and a little above, like pieces on a game board: a peg's
// (x, y) is where its FEET stand; a peg further "back" is simply higher up the frame. World px under
// StoutStage's camera; edges, slot lines and bloom are SCREEN px (pass the camera's k).
// ===========================================================================

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `tl${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// --- shared sizes (WORLD px) ---------------------------------------------------------------------
/** A peg's size = its height = its shoulder width. S: a face in a crowd (still a person at 270 px wide
 *  when ~70 px tall on screen); M: a named few; L: a hero. */
export const PEG = { S: 72, M: 128, L: 224 } as const;
/** A team tile's slot grid, in peg sizes: pitch between slot centres (x) and slot lines (y), padding
 *  from the outer pegs to the tile's edge. Shoulder to shoulder: a tenth of a peg between neighbours. */
export const SLOT = { pitchX: 1.1, pitchY: 1.24, padX: 0.24, padTop: 0.24, padBottom: 0.3 } as const;
/** How deep a seated peg stands in its slot (of its size): the `sink` of a peg at rest in a TeamTile. */
export const SEAT = 0.05;
/** Frames a peg takes to change tone (kraft <-> amber), = stoutShared RUNG_F. */
export const PEG_TONE_F = 12;

// --- the figure (the house bust of the META4 set, fourThingsShared.personPath: a 429-unit box) ------
const U = 429;
const HEAD = { cy: 327, r: 102 }; // centre above the feet, radius
const SH_H = 204; // the shoulders' height above the feet
/** The head as a path (a circle), for a peg `size` tall with its feet on (x, y). `inset` (world px)
 *  shrinks it toward its bottom: the body under the lit rim. */
const headPath = (x: number, y: number, size: number, inset = 0) => {
  const u = size / U;
  const r = HEAD.r * u - inset / 2;
  const cy = y - HEAD.cy * u + inset / 2;
  return `M${f2(x + r)} ${f2(cy)}A${f2(r)} ${f2(r)} 0 1 1 ${f2(x - r)} ${f2(cy)}A${f2(r)} ${f2(r)} 0 1 1 ${f2(x + r)} ${f2(cy)}Z`;
};
/** The shoulders as a path. `inset` (world px) lowers the top, keeping the base. */
const shoulderPath = (x: number, y: number, size: number, inset = 0) => {
  const u = size / U;
  const q = (SH_H * u - inset) / (SH_H * u);
  const X = (a: number) => f2(x + (a - 255.5) * u);
  const Y = (b: number) => f2(y + (b - 470) * u * q);
  return (
    `M${X(41)} ${Y(458)}C${X(41)} ${Y(352)} ${X(126)} ${Y(266)} ${X(232)} ${Y(266)}L${X(279)} ${Y(266)}` +
    `C${X(385)} ${Y(266)} ${X(470)} ${Y(352)} ${X(470)} ${Y(458)}L${X(470)} ${Y(462)}Q${X(470)} ${Y(470)} ${X(462)} ${Y(470)}` +
    `L${X(49)} ${Y(470)}Q${X(41)} ${Y(470)} ${X(41)} ${Y(462)}Z`
  );
};
/** A peg's whole outline (head + shoulders) as ONE path, feet on (x, y): for union silhouettes. */
export const pegPath = (x: number, y: number, size: number = PEG.S) => headPath(x, y, size) + shoulderPath(x, y, size);
/** Where a peg's parts are (world px): its top, its head's centre and radius, the shoulders' top. */
export const pegGeometry = (x: number, y: number, size: number = PEG.S) => {
  const u = size / U;
  return { top: y - size, head: { x, y: y - HEAD.cy * u, r: HEAD.r * u }, shoulderTop: y - SH_H * u, left: x - size / 2, right: x + size / 2 };
};
/** How far a peg at `sink` stands below its slot line (world px). At sink 1 nothing shows. */
export const sinkDepth = (sink: number, size: number = PEG.S) => clamp01(sink) * (size + 2);

// ===========================================================================
// SHADOWS — any number of pegs, one layer (the stout elevations, stoutShared ELEVATION)
// ===========================================================================
export type PegShadowSpec = { x: number; y: number; size?: number; sink?: number; strength?: number };
/**
 * PegShadows — ONE shadow for a set of pegs at one elevation: every peg's silhouette (cut at its slot
 * line when it is sunk) is filled once per layer, so neighbours never stack. Draw it BEFORE the pegs.
 * `lift` 0..1 eases toward the next elevation (a peg that travels lifts one level). A peg at rest also
 * gets the contact shadow at its feet.
 */
export const PegShadows: React.FC<{ pegs: PegShadowSpec[]; elevation?: Elevation; lift?: number; strength?: number }> = ({
  pegs,
  elevation = "rest",
  lift = 0,
  strength = 1,
}) => {
  const uid = uidOf(useId());
  const next: Record<Elevation, Elevation> = { rest: "lifted", lifted: "float", float: "float" };
  const A = ELEVATION[elevation];
  const B = ELEVATION[next[elevation]];
  const t = clamp01(lift);
  const mix = (a: ShadowLayer, b: ShadowLayer): ShadowLayer => ({ dx: lerp(a.dx, b.dx, t), dy: lerp(a.dy, b.dy, t), blur: lerp(a.blur, b.blur, t), a: lerp(a.a, b.a, t) });
  const layers = [mix(A.amb, B.amb), mix(A.key, B.key)];
  const live = pegs.map((p, i) => ({ ...p, i, size: p.size ?? PEG.S, sink: clamp01(p.sink ?? 0) })).filter((p) => p.sink < 0.995 && (p.strength ?? 1) > 0.004);
  if (!live.length || strength <= 0.004) return null;
  const c = A.contact;
  const body = live.map((p) => (
    <path
      key={p.i}
      d={pegPath(p.x, p.y + sinkDepth(p.sink, p.size), p.size)}
      fillOpacity={p.strength ?? 1}
      clipPath={p.sink > 0 ? `url(#${uid}c${p.i})` : undefined}
    />
  ));
  return (
    <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
      <defs>
        {live.map((p) =>
          p.sink > 0 ? (
            <clipPath key={p.i} id={`${uid}c${p.i}`}>
              <rect x={f2(p.x - p.size)} y={f2(p.y - 2 * p.size)} width={f2(2 * p.size)} height={f2(2 * p.size)} />
            </clipPath>
          ) : null,
        )}
      </defs>
      {c && t < 0.999 ? (
        <g opacity={f2(c.a * (1 - t) * strength)} style={{ filter: `blur(${f2(c.blur)}px)` }}>
          {live.map((p) => (
            <ellipse key={p.i} cx={f2(p.x + c.dx)} cy={f2(p.y)} rx={f2(p.size * 0.5 * (1 - 0.5 * p.sink))} ry={3} fillOpacity={(p.strength ?? 1) * (1 - p.sink)} />
          ))}
        </g>
      ) : null}
      {layers.map((l, i) => (
        <g key={i} opacity={f2(l.a * strength)} transform={`translate(${f2(l.dx)} ${f2(l.dy)})`} style={{ filter: `blur(${f2(l.blur)}px)` }}>
          {body}
        </g>
      ))}
    </g>
  );
};

// ===========================================================================
// THE SLOT
// ===========================================================================
/**
 * PegSlot — the slot a peg stands in: the stout slot line (EDGE.SLOT screen px, a lip each side) at the
 * peg's feet (x, y). On the GROUND it also carries a faint lit lower lip, so an empty slot still reads
 * as a cut in the board; on CREAM it is the plain stout joint. `open` = an EMPTY slot on a card: a
 * slightly taller pocket (TeamTile draws its empty slots so).
 */
export const PegSlot: React.FC<{ x: number; y: number; size?: number; k: number; on?: "ground" | "cream"; open?: boolean }> = ({ x, y, size = PEG.S, k, on = "ground", open = false }) => {
  const w = size * (1 - 16 / U) + (2 * EDGE.SLOT_LIP) / k;
  // an OPEN (empty) slot on a card is a pocket you see into: a little taller than the joint line
  const h = open ? Math.max(EDGE.SLOT / k, 0.05 * size) : EDGE.SLOT / k;
  return (
    <g>
      <rect
        x={f2(x - w / 2)}
        y={f2(y - h / 2)}
        width={f2(w)}
        height={f2(h)}
        rx={open ? f2(Math.min(h / 2, GEO.RADIUS / 2)) : 0}
        fill={on === "ground" ? COLOR.shadow : COLOR.inkDark}
        fillOpacity={on === "ground" ? 0.9 : open ? 0.78 : ALPHA.slot}
      />
      {on === "ground" ? <rect x={f2(x - w / 2)} y={f2(y + h / 2)} width={f2(w)} height={f2(1 / k)} fill={COLOR.board} fillOpacity={0.3} /> : null}
    </g>
  );
};

// ===========================================================================
// THE PERSON PEG
// ===========================================================================
export type PegTone = "kraft" | "amber";
export type PersonPegProps = {
  /** where its feet stand = its slot line (world px) */
  x: number;
  y: number;
  /** height = shoulder width (world px); PEG.S / M / L */
  size?: number;
  /** current camera zoom (edges, slot, bloom are SCREEN px) */
  k: number;
  tone?: PegTone;
  /** 0 = kraft .. 1 = amber, by TONE (overrides `tone`); drive it over PEG_TONE_F frames */
  blend?: number;
  /** 0..1: a kraft peg loses the light (its tone falls toward the ground's); context going away */
  shade?: number;
  /** 0..1: lowered INTO its slot (cut at the slot line; 1 = gone, only the slot is left) */
  sink?: number;
  elevation?: Elevation;
  /** 0..1 toward the next elevation */
  lift?: number;
  /** false when a group draws ONE shadow for it (PegShadows, TeamTile) */
  shadow?: boolean;
  shadowStrength?: number;
  /** draw the slot it stands in (the lips show either side of its feet) */
  slot?: "ground" | "cream" | null;
  /** amberBandFor(cam): every amber body of a frame shares one gradient */
  amberBand?: [number, number];
};
const bloomAt = (k: number, a: number) =>
  BLOOM_LAYERS.map((l) => `drop-shadow(0 0 ${f2(l.blur / k)}px ${l.color.replace(/,([\d.]+)\)$/, (_m, v: string) => `,${f2(parseFloat(v) * a)})`)})`).join(" ");

/**
 * PersonPeg — one person. Card material lit from above: a top-to-foot gradient (kraft board, or the
 * amber band), a lit rim on the top of the head and of the shoulders (the cream edge in shadow for
 * kraft; the hot edge + its falloff for amber), the fixed bloom on amber, a foot occlusion where it
 * meets its slot, and the stout shadow of its elevation. No outlines anywhere.
 */
export const PersonPeg: React.FC<PersonPegProps> = ({
  x,
  y,
  size = PEG.S,
  k,
  tone = "kraft",
  blend,
  shade = 0,
  sink = 0,
  elevation = "rest",
  lift = 0,
  shadow = true,
  shadowStrength = 1,
  slot = null,
  amberBand,
}) => {
  const uid = uidOf(useId());
  const b = clamp01(blend ?? (tone === "amber" ? 1 : 0));
  const s = clamp01(sink);
  const sh = clamp01(shade);
  const dy = sinkDepth(s, size);
  const g = pegGeometry(x, y + dy, size);
  const feet = y + dy;
  const band = amberBand ?? [g.top, feet];
  const amberAt = (yy: number) => mixHex(COLOR.amberTop, COLOR.amberFoot, (yy - band[0]) / Math.max(1e-6, band[1] - band[0]));
  const kTop = mixHex(COLOR.board, COLOR.ground, sh * 0.7);
  const kFoot = mixHex(COLOR.boardFoot, COLOR.ground, sh * 0.7);
  const top = mixHex(kTop, amberAt(g.top), b);
  const foot = mixHex(kFoot, amberAt(feet), b);
  // the lit rim: the cream edge at a board's strength (kraft) .. the hot edge (amber)
  const e = lerp(EDGE.CREAM, EDGE.HOT, b) / k;
  const rim = (base: string) => mixHex(mixHex(base, COLOR.edge, ALPHA.edgeBoard * (1 - 0.6 * sh)), COLOR.amberHot, b);
  const fallHead = Math.min(EDGE.HOT_FALL / k, 0.7 * g.head.r);
  const fallSh = Math.min(EDGE.HOT_FALL / k, 0.3 * (feet - g.shoulderTop));
  const ao = Math.min(EDGE.FOOT_AO / k, 0.2 * size);
  const gone = s >= 0.995;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(g.top)} x2="0" y2={f2(feet)}>
          <stop offset="0" stopColor={top} />
          <stop offset="1" stopColor={foot} />
        </linearGradient>
        {b > 0.01 ? (
          <>
            <linearGradient id={`${uid}h1`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(g.top)} x2="0" y2={f2(g.top + fallHead)}>
              <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall * b} />
              <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={`${uid}h2`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(g.shoulderTop)} x2="0" y2={f2(g.shoulderTop + fallSh)}>
              <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall * b} />
              <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
            </linearGradient>
          </>
        ) : null}
        <linearGradient id={`${uid}ao`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y - ao)} x2="0" y2={f2(y)}>
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO * (slot || s > 0 ? 1.6 : 1)} />
        </linearGradient>
        <clipPath id={`${uid}s`}>
          <path d={pegPath(x, feet, size)} />
        </clipPath>
        {s > 0 ? (
          <clipPath id={`${uid}c`}>
            <rect x={f2(x - size)} y={f2(y - 2 * size)} width={f2(2 * size)} height={f2(2 * size)} />
          </clipPath>
        ) : null}
      </defs>
      {shadow && !gone ? <PegShadows pegs={[{ x, y, size, sink: s }]} elevation={elevation} lift={lift} strength={shadowStrength} /> : null}
      {gone ? null : (
        <g clipPath={s > 0 ? `url(#${uid}c)` : undefined}>
          <g style={b > 0.01 ? { filter: bloomAt(k, b) } : undefined}>
            <path d={headPath(x, feet, size)} fill={rim(top)} />
            <path d={shoulderPath(x, feet, size)} fill={rim(mixHex(top, foot, 0.5))} />
          </g>
          <path d={headPath(x, feet, size, e)} fill={`url(#${uid}b)`} />
          <path d={shoulderPath(x, feet, size, e)} fill={`url(#${uid}b)`} />
          {b > 0.01 ? (
            <>
              <path d={headPath(x, feet, size, e)} fill={`url(#${uid}h1)`} />
              <path d={shoulderPath(x, feet, size, e)} fill={`url(#${uid}h2)`} />
            </>
          ) : null}
          {/* where it meets its slot: a short occlusion (fixed at the slot line while it sinks) */}
          <rect x={f2(x - size / 2 + (8 * size) / U)} y={f2(y - ao)} width={f2(size * (1 - 16 / U))} height={f2(ao)} fill={`url(#${uid}ao)`} clipPath={`url(#${uid}s)`} />
        </g>
      )}
      {slot ? <PegSlot x={x} y={y} size={size} k={k} on={slot} /> : null}
    </g>
  );
};

// ===========================================================================
// THE TEAM TILE
// ===========================================================================
export type TeamTileSpec = { x: number; y: number; cols?: number; rows?: number; peg?: number };
/** A team tile's rect (centred on x, y) and its slots, row-major from the top-left: each slot's (x, y)
 *  is where a peg's FEET go (pass them to PersonPeg). */
export const teamTileLayout = ({ x, y, cols = 3, rows = 2, peg = PEG.S }: TeamTileSpec) => {
  const w = peg * ((cols - 1) * SLOT.pitchX + 1 + 2 * SLOT.padX);
  const h = peg * (SLOT.padTop + 1 + (rows - 1) * SLOT.pitchY + SLOT.padBottom);
  const x0 = x - w / 2;
  const y0 = y - h / 2;
  const slots: { x: number; y: number; col: number; row: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({ x: x + (c - (cols - 1) / 2) * SLOT.pitchX * peg, y: y0 + peg * (SLOT.padTop + 1 + r * SLOT.pitchY), col: c, row: r });
    }
  }
  return { x0, y0, w, h, x, y, peg, cols, rows, slots };
};
export type Seat = PegTone | { tone?: PegTone; blend?: number } | null | undefined;
/**
 * TeamTile — a cream card with cols x rows peg slots. `seated[i]` puts a peg in slot i (row-major): it
 * stands SEAT deep in its slot, shoulder to shoulder with its neighbours, and casts no shadow of its
 * own — the filled tile is ONE object with ONE shadow. A peg still on its way is drawn by the cut
 * (PersonPeg, lifted) and handed over to `seated` on the frame it lands. `dim` 0..1 takes the card
 * from cream to kraft board by tone.
 */
export const TeamTile: React.FC<
  TeamTileSpec & {
    k: number;
    seated?: Seat[];
    dim?: number;
    elevation?: Elevation;
    lift?: number;
    amberBand?: [number, number];
  }
> = ({ k, seated = [], dim = 0, elevation = "rest", lift = 0, amberBand, ...spec }) => {
  const uid = uidOf(useId());
  const L = teamTileLayout(spec);
  const r = GEO.RADIUS;
  const d = rectPath(L.x0, L.y0, L.w, L.h, r);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(L.y0)} x2="0" y2={f2(L.y0 + L.h)}>
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, dim)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, dim)} />
        </linearGradient>
      </defs>
      <ElevationShadow silhouette={[{ d }]} elevation={elevation} lift={lift} contact={elevation === "rest" ? { x: L.x, y: L.y0 + L.h, w: L.w * 0.86 } : null} />
      <path d={d} fill={`url(#${uid}c)`} />
      <path d={`M${f2(L.x0 + r)} ${f2(L.y0 + EDGE.CREAM / k / 2)}H${f2(L.x0 + L.w - r)}`} stroke={COLOR.edge} strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dim)} strokeWidth={f2(EDGE.CREAM / k)} />
      {L.slots.map((s, i) => {
        const seat = seated[i];
        if (!seat) return <PegSlot key={i} x={s.x} y={s.y} size={L.peg} k={k} on="cream" open />;
        const p = typeof seat === "string" ? { tone: seat } : seat;
        return <PersonPeg key={i} x={s.x} y={s.y} size={L.peg} k={k} tone={p.tone} blend={p.blend} sink={SEAT} shadow={false} slot="cream" amberBand={amberBand} />;
      })}
    </g>
  );
};

// ===========================================================================
// THE META MARK
// ===========================================================================
// The Meta infinity (Wikimedia "Meta Platforms Inc. logo (cropped)", public/cheekypint2/meta4/, 287.56 x
// 191): its three shapes drawn as one silhouette — the same paths and the same knock-out as
// fourThingsScene1 (they are not exported there).
const META_D = [
  "m31.06,125.96c0,10.98 2.41,19.41 5.56,24.51 4.13,6.68 10.29,9.51 16.57,9.51 8.1,0 15.51-2.01 29.79-21.76 11.44-15.83 24.92-38.05 33.99-51.98l15.36-23.6c10.67-16.39 23.02-34.61 37.18-46.96 11.56-10.08 24.03-15.68 36.58-15.68 21.07,0 41.14,12.21 56.5,35.11 16.81,25.08 24.97,56.67 24.97,89.27 0,19.38-3.82,33.62-10.32,44.87-6.28,10.88-18.52,21.75-39.11,21.75l0-31.02c17.63,0 22.03-16.2 22.03-34.74 0-26.42-6.16-55.74-19.73-76.69-9.63-14.86-22.11-23.94-35.84-23.94-14.85,0-26.8,11.2-40.23,31.17-7.14,10.61-14.47,23.54-22.7,38.13l-9.06,16.05c-18.2,32.27-22.81,39.62-31.91,51.75-15.95,21.24-29.57,29.29-47.5,29.29-21.27,0-34.72-9.21-43.05-23.09-6.8-11.31-10.14-26.15-10.14-43.06z",
  "m24.49,37.3c14.24-21.95 34.79-37.3 58.36-37.3 13.65,0 27.22,4.04 41.39,15.61 15.5,12.65 32.02,33.48 52.63,67.81l7.39,12.32c17.84,29.72 27.99,45.01 33.93,52.22 7.64,9.26 12.99,12.02 19.94,12.02 17.63,0 22.03-16.2 22.03-34.74l27.4-.86c0,19.38-3.82,33.62-10.32,44.87-6.28,10.88-18.52,21.75-39.11,21.75-12.8,0-24.14-2.78-36.68-14.61-9.64-9.08-20.91-25.21-29.58-39.71l-25.79-43.08c-12.94-21.62-24.81-37.74-31.68-45.04-7.39-7.85-16.89-17.33-32.05-17.33-12.27,0-22.69,8.61-31.41,21.78z",
  "m82.35,31.23c-12.27,0-22.69,8.61-31.41,21.78-12.33,18.61-19.88,46.33-19.88,72.95 0,10.98 2.41,19.41 5.56,24.51l-26.48,17.44c-6.8-11.31-10.14-26.15-10.14-43.06 0-30.75 8.44-62.8 24.49-87.55 14.24-21.95 34.79-37.3 58.36-37.3z",
];
export const META_BOX = { w: 287.56, h: 191 } as const;
const META_FILL = 0.42; // the ribbon's silhouette / its box (the stout optical rule: an airy mark is drawn larger)
/**
 * MetaMark — the Meta infinity knocked out of a cream tile to the ground, as crests are in the stout
 * set. Centred on (x, y); a square of `size` (default GEO.TILE) or `w` x `h`. The logo is sized by the
 * stout optical rule (opticalFit) on the tile's shorter side, or pass `logoH` (world px). `dim` 0..1
 * takes the card to kraft board by tone. One shadow at its elevation.
 */
export const MetaMark: React.FC<{
  x: number;
  y: number;
  k: number;
  size?: number;
  w?: number;
  h?: number;
  logoH?: number;
  dim?: number;
  elevation?: Elevation;
  lift?: number;
}> = ({ x, y, k, size = GEO.TILE, w = size, h = size, logoH, dim = 0, elevation = "rest", lift = 0 }) => {
  const uid = uidOf(useId());
  const r = GEO.RADIUS;
  const x0 = x - w / 2;
  const y0 = y - h / 2;
  const d = rectPath(x0, y0, w, h, r);
  const sc = logoH ? logoH / META_BOX.h : opticalFit(META_BOX.w, META_BOX.h, META_FILL, 0, Math.min(w, h)).sc;
  const lx = x - (META_BOX.w * sc) / 2;
  const ly = y - (META_BOX.h * sc) / 2;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y0)} x2="0" y2={f2(y0 + h)}>
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, dim)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, dim)} />
        </linearGradient>
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={f2(x0)} y={f2(y0)} width={f2(w)} height={f2(h)}>
          <rect x={f2(x0)} y={f2(y0)} width={f2(w)} height={f2(h)} fill="#fff" />
          <g transform={`translate(${f2(lx)} ${f2(ly)}) scale(${(Math.round(sc * 1e6) / 1e6).toString()})`} fill="#000">
            {META_D.map((p, i) => (
              <path key={i} d={p} />
            ))}
          </g>
        </mask>
      </defs>
      <ElevationShadow silhouette={[{ d }]} elevation={elevation} lift={lift} contact={elevation === "rest" ? { x, y: y0 + h, w: w * 0.86 } : null} />
      <path d={d} fill={`url(#${uid}c)`} mask={`url(#${uid}k)`} />
      <path d={`M${f2(x0 + r)} ${f2(y0 + EDGE.CREAM / k / 2)}H${f2(x0 + w - r)}`} stroke={COLOR.edge} strokeOpacity={lerp(ALPHA.edge, ALPHA.edgeBoard, dim)} strokeWidth={f2(EDGE.CREAM / k)} />
    </g>
  );
};

export { Label } from "./stoutShared";

// ===========================================================================
// THE STYLE FRAME (a still: every part of the vocabulary once; registered by src/Root.TalentDensity.tsx
// as "TalentStyleFrame")
// ===========================================================================
export const TalentStyleFrame: React.FC = () => {
  const cam: Cam = { x: 540, y: 960, k: 1 };
  const k = cam.k;
  const band = amberBandFor(cam);
  const row = (y: number, size: number, xs: number[]) => (
    <>
      <PersonPeg x={xs[0]} y={y} size={size} k={k} tone="kraft" slot="ground" amberBand={band} />
      <PersonPeg x={xs[1]} y={y} size={size} k={k} tone="amber" slot="ground" amberBand={band} />
      <PersonPeg x={xs[2]} y={y} size={size} k={k} tone="kraft" sink={0.5} shade={0.5} slot="ground" amberBand={band} />
      <PersonPeg x={xs[3]} y={y} size={size} k={k} tone="amber" sink={0.5} slot="ground" amberBand={band} />
    </>
  );
  return (
    <AbsoluteFill>
      <StoutStage S={0} cam={cam} pool={{ x: 540, y: 900 }} sway={false}>
        {row(250, PEG.S, [110, 230, 350, 470])}
        <PersonPeg x={610} y={250} k={k} blend={0.5} slot="ground" amberBand={band} />
        <PersonPeg x={730} y={250} k={k} tone="amber" elevation="lifted" amberBand={band} />
        <PersonPeg x={850} y={250} k={k} tone="amber" elevation="float" amberBand={band} />
        <PegSlot x={970} y={250} k={k} />
        {row(480, PEG.M, [130, 330, 530, 730])}
        <PersonPeg x={930} y={480} size={PEG.M} k={k} tone="kraft" sink={1} slot="ground" />
        {row(800, PEG.L, [150, 410, 670, 930])}
        <TeamTile x={220} y={1010} k={k} amberBand={band} />
        <TeamTile x={220} y={1290} k={k} seated={["amber", "amber", "amber", "amber", null, "kraft"]} amberBand={band} />
        <TeamTile x={700} y={1150} peg={PEG.M} k={k} seated={["amber", "amber", "amber", "amber", "amber", "amber"]} amberBand={band} />
        <MetaMark x={160} y={1620} k={k} size={192} />
        <MetaMark x={470} y={1620} k={k} w={360} h={150} />
        <MetaMark x={760} y={1620} k={k} size={GEO.TILE} />
        <MetaMark x={930} y={1620} k={k} size={192} dim={1} />
      </StoutStage>
    </AbsoluteFill>
  );
};
