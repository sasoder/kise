import React from "react";
import { loadFont } from "@remotion/fonts";
import { Img, staticFile } from "remotion";
import {
  CONTACT_SHADOW_OP,
  CONTACT_SHADOW_RX,
  CONTACT_SHADOW_RY,
  TILE_GRAD_BOTTOM,
  TILE_GRAD_TOP,
  TILE_SHADOW,
} from "./d1Shared";
import { OPENAI } from "./brandGlyphs";
import {
  ACCENT,
  OP_READ,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  clamp01,
  iconShadow,
  smoothstep,
  squirclePath,
} from "./fieldShared";

// ---------------------------------------------------------------------------
// bretShared V3b — the world the Bret Taylor / OpenAI-board cuts share.
//
// The clip is Cheeky Pint style (MEMORY, rewritten 2026-09-15): kraft sheet,
// white ink, one amber, one tile material, threads, damped camera, opaque.
// This file holds the CAST and the RESOLVED PICTURE so a later cut of the same
// clip can open on this one's last frame without restating a number.
//
// THE CLIP'S ONE VISUAL RULE: many converge on one point, and amber is that
// point. Here the two sides of the November 2023 OpenAI board fight — the
// existing board (a bench of three) and Sam — converge on Bret.
//
// V3b CHANGED THREE THINGS AND NOTHING ELSE (director, 2026-09-16, reviewing
// the V3 preview). The duotone heads, the mirror triangle and its tracks, the
// two threads' launch and landing frames, the minted dot, the one ink click,
// the camera's shape and the alive hold are all V3's and are untouched.
//
//  1. A HEAD IS A CUTOUT, NOT A THING STANDING ON THE GROUND. V3 floated each
//     head ~88 px above a thin contact shadow, and that shadow — hanging under
//     nothing, Sam's reading as a stray dash — was the single worst thing in
//     the frame. Both the float (V3's HEAD_FLOAT_F) and the head contact
//     shadows are GONE. A head is now exactly its own alpha: its box bottom IS
//     its lowest alpha pixel, and it carries only the house TILE_SHADOW, the
//     same soft lift every tile gets. The BENCH keeps its contact shadow — it
//     is a tile and it stands.
//
//  2. THE THREADS RUN BEHIND BRET'S HEAD AND THE V'S APEX PEEKS OUT UNDER HIS
//     CHIN. V3 had to hold the amber point 88 px clear of his jaw so two
//     straight lines could reach it without crossing his face; with the float
//     gone the point sits DOT_CHIN_GAP (12 px) under his lowest alpha pixel and
//     the two threads are simply drawn in a layer BELOW his head. Each one
//     disappears behind his jaw and the apex, with its minted dot, shows under
//     his chin: the head SITS ON the apex of the V. Nothing is routed around
//     his outline any more.
//
//  3. THE LABELS SIT TIGHT UNDER THE HEADS. "Bret Taylor" hangs
//     BRET_LABEL_GAP under the dot, so the dot sits between his chin and his
//     name; "Sam Altman" hangs SAM_LABEL_GAP under Sam's lowest alpha pixel.
//
// THE CAST:
//   * a PORTRAIT is a duotoned head cutout and its name in Söhne Buch under it.
//     Nothing else — the head is the noun, and it casts no shadow on a ground
//     it is not standing on.
//   * the BOARD is one wide house tile with three Lucide "user" glyphs KNOCKED
//     OUT of it (the CompanyCard recipe: square caps, stroke 2.6, the paper
//     shows through). A bench of people, no label. It stands, so it keeps its
//     contact shadow.
//   * a THREAD is the house thread: 2.5 px, ACCENT, 0.95, live from the frame
//     it is drawn. Geometric — source to the dot — so when a side moves the
//     thread follows it and shortens on the draw-in with no extra track.
//   * the DOT is the point they agree on: a solid ACCENT disc, MINTED (the coin
//     recipe, a 5-frame scale-in) on the frame the two threads land.
// ---------------------------------------------------------------------------

// -- type -------------------------------------------------------------------
// Söhne Buch, vendored, loaded at module scope so a font failure surfaces
// before a frame is drawn. One weight: a name label is the only type in the cut.
export const FONT_LABEL = "SohneBuchAU";
loadFont({ family: FONT_LABEL, url: staticFile("Sohne-Buch.otf"), weight: "400" });

export const LABEL_SIZE = 30; // world px; at the resolved k this is the house 26 SCREEN px
export const LABEL_OP = 0.55; // ink at rest
export const LABEL_LINE = 30;
// Where a 30 px Söhne Buch line's INK actually sits inside its box, measured
// full-res off the render: the cap tops 6 world px below the box top and the
// "y" of "Taylor" reaching 40 below it. The resolved framing is solved against
// these, not against the CSS line box, or the picture sits ~7 screen px low.
export const LABEL_INK_TOP = 6;
export const LABEL_INK_BOT = 40;
export const LABEL_TRACK = 0.2;
export const LABEL_HALF = 74; // measured full-res off the render: "Bret Taylor" is 144 world px wide, plus 2
export const SAM_LABEL_HALF = 82; // measured full-res off the render: "Sam Altman" is 163 world px wide
// Portrait's default gap, kept at V2's value so the superseded V2 cut still
// renders as delivered. V3b passes BRET_LABEL_GAP / SAM_LABEL_GAP explicitly.
export const LABEL_GAP = 41;

// -- the world --------------------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1450;

// ---------------------------------------------------------------------------
// THE TWO CUTOUTS. Both are the user's own head-only PNGs (800x800 RGBA, hard
// alpha, no shoulders), trimmed to their alpha bbox and duotoned by
// au3/build_heads.py. Because they are trimmed, the FILE IS THE HEAD: hair top
// to chin is the whole height, the head's centre is the box's centre, and — the
// number V3b turns on — THE BOX'S BOTTOM EDGE IS THE LOWEST ALPHA PIXEL. So the
// V2 head-fraction constants are all 1.0 / 0.5 and are kept only so the V2 cut
// still compiles.
//   bret.png  474 x 643   sam.png  519 x 652
// ---------------------------------------------------------------------------
export const BRET_ASPECT = 474 / 643; // 0.73717
export const BRET_HEAD_F = 1;
export const BRET_HEAD_CENTRE_F = 0.5;
export const BRET_HEAD_CX_F = 0.5;
export const BRET_INK_X0 = 0;
export const BRET_INK_X1 = 1;
export const BRET_INK_Y0 = 0;
export const BRET_INK_Y1 = 1;

export const SAM_ASPECT = 519 / 652; // 0.79601
export const SAM_HEAD_F = 1;
export const SAM_HEAD_CENTRE_F = 0.5;
export const SAM_INK_X0 = 0;
export const SAM_INK_X1 = 1;
export const SAM_INK_Y0 = 0;
export const SAM_INK_Y1 = 1;
// V2 solved its layout against what READ as ink rather than against alpha,
// because its cutouts ended in a baked foot ramp. V3's alpha is hard, so the
// visible edge and the alpha edge are the same thing.
export const SAM_VIS_X1 = 1;
export const SAM_VIS_Y1 = 1;

// Sam's head is TURNED: his lowest alpha pixel — his chin — is not under the
// middle of his box but at x 0.734 of it (measured on sam.png, alpha > 0, the
// bottom row runs cols 360..402 of 519). Bret's is dead centre, 0.499. That one
// measurement is what puts his name under his chin rather than under his ear.
export const SAM_CHIN_FX = 0.7341;
export const BRET_CHIN_FX = 0.4989;

// The one size the cut chooses: how tall Bret's head is in world px. Sam's is
// 0.82 of it — he is the further of the two.
export const BRET_HEAD = 340;
export const SAM_HEAD_RATIO = 0.82;

export const BRET_H = BRET_HEAD; // the box IS the head
export const BRET_W = BRET_H * BRET_ASPECT; // 250.64
export const SAM_H = SAM_HEAD_RATIO * BRET_HEAD; // 278.8
export const SAM_W = SAM_H * SAM_ASPECT; // 221.93
export const SAM_CHIN_DX = (SAM_CHIN_FX - 0.5) * SAM_W; // 51.95: his chin, off his axis

// -- Bret: low, centre, and he never moves ----------------------------------
export const BRET_X = 540; // his head's centre across; the mirror's axis
export const BRET_HEAD_Y = 980; // his head's centre down
export const BRET_BOX_CX = BRET_X;
export const BRET_TOP = BRET_HEAD_Y - BRET_H / 2; // 810
export const BRET_CHIN = BRET_HEAD_Y + BRET_H / 2; // 1150 — his lowest alpha pixel
export const BRET_FOOT = BRET_CHIN; // the bottom of his box (V2 name)

// -- the amber point --------------------------------------------------------
// JUST under his chin, on his axis. The threads reach it from behind his head,
// so this number is a LOOK (how much of the apex shows) and not, as it was in
// V3, a clearance the whole layout had to be solved around.
export const DOT_CHIN_GAP = 12;
export const DOT_X = BRET_X;
export const DOT_Y = BRET_CHIN + DOT_CHIN_GAP; // 1162
export const DOT_R = 7;
export const DOT_MINT = 5; // frames of scale-in, the coin recipe
export const DOT_OVER = 0.18; // the settle past 1, as a zero-sloped bump

// -- the labels -------------------------------------------------------------
// Both hang off the thing above them, tight. Bret's is measured from the DOT,
// so the dot reads as sitting between his chin and his name.
export const BRET_LABEL_GAP = 30; // the label box's top, below the dot's centre
export const BRET_LABEL_FROM_CHIN = DOT_CHIN_GAP + BRET_LABEL_GAP; // 42, below his chin
export const SAM_LABEL_GAP = 28; // the label box's top, below his lowest alpha pixel
// His name is centred under his CHIN, not under his box (see SAM_CHIN_FX). It
// is also what keeps the thread off the glyphs: the thread leaves his box
// centre and runs down-left, so a name centred on the box centre has the thread
// through its first two letters — rendered and measured, au3b/nudge0_f199.png.
// His name is 163 world px wide, so SAM_CHIN_DX alone still leaves the thread
// ON the "S"; 17 px past it — just outside his chin's own right edge, which
// runs +43..+61 — leaves 9.9 world px of kraft to the label BOX, and 8.9 SCREEN
// px to the glyphs themselves at the closest frame of the whole cut, measured
// on the render (au3b/thread-vs-label.txt).
export const SAM_LABEL_CLEAR = 17;
export const SAM_LABEL_NUDGE = SAM_CHIN_DX + SAM_LABEL_CLEAR; // 68.95

// -- the board bench --------------------------------------------------------
export const BOARD_W = 330;
export const BOARD_H = 110;
export const BENCH_SEATS = 3;
export const SEAT_GLYPH_F = 0.6; // the 24-unit glyph fills this much of the cell
export const GLYPH_STROKE = 2.6; // CompanyCard's weight
export const GLYPH_CAP = "square" as const;
export const GLYPH_JOIN = "miter" as const;

// Lucide "user" (ISC), fetched raw from
// https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/user.svg and
// inlined — nothing is installed and nothing is fetched at render time.
export const USER_GLYPH = `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />`;
export const BENCH_GLYPHS = [USER_GLYPH, USER_GLYPH, USER_GLYPH];

// -- the mirror -------------------------------------------------------------
// The two sides are ONE track, read twice. `d` is each side's distance from
// BRET_X and `anchorY` the height at which both hand their thread over: the
// bench's BOTTOM EDGE and the point directly under Sam's head. So their thread
// sources are (BRET_X - d, anchorY) and (BRET_X + d, anchorY) — exact mirrors —
// and the two threads to DOT form a symmetric V on every frame.
//
// With the float gone, the anchor IS each side's own foot: the bench's bottom
// edge and Sam's lowest alpha pixel. Nothing hangs in mid-air.
export const anchorToSamHeadY = (anchorY: number) => anchorY - SAM_H / 2;
export const anchorToBoardY = (anchorY: number) => anchorY - BOARD_H / 2;

// -- the resolved picture ---------------------------------------------------
// What a later cut of this clip opens on. The mirror track (D_FINAL,
// ANCHOR_Y_FINAL) is V3's, unchanged; the camera is re-solved for V3b's ink box
// — no float means Sam's head drops 72 px and the dot rises 76 — against the
// padding contract (screen x 120-960, y 300-1350, 30-60 px of air) and then
// measured off the render by au-band.py.
export const D_FINAL = 303; // each side's distance from the axis, resolved
export const ANCHOR_Y_FINAL = 792.4;
export const BOARD_X_FINAL = BRET_X - D_FINAL; // 237
export const BOARD_Y_FINAL = anchorToBoardY(ANCHOR_Y_FINAL); // 737.4
export const SAM_X_FINAL = BRET_X + D_FINAL; // 843
export const SAM_Y_FINAL = anchorToSamHeadY(ANCHOR_Y_FINAL); // 653.0
export const K_FINAL = 0.833;
export const CX_FINAL = 532.975; // the ink's own centre across
export const CY_FINAL = 872.8; // the CONTENT centre; the camera's cy adds CAM_LIFT / k

// ---------------------------------------------------------------------------
// BRET'S SILHOUETTE, sampled off bret.png every 2.5% of its height at alpha >
// 96: [yFraction, xLeftFraction, xRightFraction]. V3b does NOT use it: its
// threads run behind his head on purpose, so there is nothing to route around
// and no clearance to solve. It is kept only because the superseded V2 cut
// imports `bretEntry` and `chestAim`, which are built on it.
// ---------------------------------------------------------------------------
export const BRET_SIL: [number, number, number][] = [
  [0, 0.5, 0.5], [0.025, 0.3523, 0.6118], [0.05, 0.2743, 0.7089], [0.075, 0.23, 0.7468],
  [0.1, 0.1857, 0.789], [0.125, 0.1519, 0.8249], [0.15, 0.1329, 0.8544], [0.175, 0.1055, 0.8797],
  [0.2, 0.0865, 0.8987], [0.225, 0.0675, 0.9093], [0.25, 0.0612, 0.9177], [0.275, 0.057, 0.9262],
  [0.3, 0.0527, 0.9346], [0.325, 0.0464, 0.9325], [0.35, 0.0464, 0.9325], [0.375, 0.0506, 0.9367],
  [0.4, 0.0506, 0.9451], [0.425, 0.0506, 0.9536], [0.45, 0.0464, 0.9852], [0.475, 0.0274, 0.9958],
  [0.5, 0.0042, 0.9979], [0.525, 0, 0.9937], [0.55, 0.0042, 0.9895], [0.575, 0.0148, 0.9831],
  [0.6, 0.0274, 0.9768], [0.625, 0.038, 0.9662], [0.65, 0.0506, 0.9473], [0.675, 0.0823, 0.9177],
  [0.7, 0.1392, 0.8861], [0.725, 0.1435, 0.8819], [0.75, 0.1477, 0.8734], [0.775, 0.1561, 0.8629],
  [0.8, 0.1603, 0.846], [0.825, 0.1814, 0.8291], [0.85, 0.2004, 0.808], [0.875, 0.2152, 0.7848],
  [0.9, 0.2511, 0.7595], [0.925, 0.308, 0.7257], [0.95, 0.3481, 0.692], [0.975, 0.3861, 0.6456],
  [1, 0.5, 0.5],
];

// Is (x, y) inside Bret, for a head whose box is at (boxLeft, boxTop)? V2 only.
export const bretInside = (x: number, y: number, boxLeft: number, boxTop: number) => {
  const f = (y - boxTop) / BRET_H;
  if (f <= 0 || f >= 1) return false;
  const i = Math.min(BRET_SIL.length - 2, Math.floor(f / 0.025));
  const t = (f - BRET_SIL[i][0]) / (BRET_SIL[i + 1][0] - BRET_SIL[i][0]);
  const l = BRET_SIL[i][1] + (BRET_SIL[i + 1][1] - BRET_SIL[i][1]) * t;
  const r = BRET_SIL[i][2] + (BRET_SIL[i + 1][2] - BRET_SIL[i][2]) * t;
  if (r - l < 0.02) return false; // the empty headroom rows
  return x >= boxLeft + l * BRET_W && x <= boxLeft + r * BRET_W;
};

// How far along `from -> aim` a line is drawn before it meets him, plus
// THREAD_BITE px inside his outline. V2 only.
export const THREAD_BITE = 20;
export const bretEntry = (
  from: { x: number; y: number },
  aim: { x: number; y: number },
  boxLeft: number,
  boxTop: number,
) => {
  const dx = aim.x - from.x;
  const dy = aim.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const steps = 240;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (bretInside(from.x + dx * t, from.y + dy * t, boxLeft, boxTop)) {
      return Math.min(1, t + THREAD_BITE / len);
    }
  }
  return 1;
};

// -- threads ----------------------------------------------------------------
export const THREAD_W = 2.5;
export const THREAD_LIVE = 0.95;

// Where each side hands its thread over. Both are measured off the owner rather
// than typed as world points, so they travel with it and no extra track is
// needed — and both are the SAME offset from the owner's own centre, which is
// what keeps the V a mirror: the bench's bottom edge, and the bottom edge of
// Sam's head box.
export const BOARD_ANCHOR = (x: number, y: number) => ({ x, y: y + BOARD_H / 2 });
export const SAM_ANCHOR = (x: number, y: number) => ({ x, y: y + SAM_H / 2 });

// V2 aimed each thread at a row of Bret's chest rather than at one point. V3b
// does not use this; it is kept because the V2 cut imports it.
export const CHEST_FY = 0.845;
export const CHEST_L_FX = 0.0451;
export const CHEST_R_FX = 0.9121;
export const chestAim = (bx: number, by: number, left: boolean) => ({
  x: bx - BRET_W / 2 + (left ? CHEST_L_FX : CHEST_R_FX) * BRET_W,
  y: by + CHEST_FY * BRET_H,
});

// ---------------------------------------------------------------------------
// A PORTRAIT. HTML, not SVG: an SVG <image> pointing at staticFile races frame
// capture and flashes (MEMORY), while Remotion's <Img> holds the frame until
// the bitmap is decoded. It lives in a layer that carries the EXACT same world
// transform as the SVG layer, so a world px is a world px in both.
//
// `x` is the head box's centre across and `footY` the bottom of the box — the
// LOWEST ALPHA PIXEL. The name hangs `labelGap` under that, and `labelX` lets it
// sit off its owner's box axis (Sam's head is turned, so his name is centred
// under his chin). `labelColor` / `labelOpacity` carry the one ink click.
//
// NO CONTACT SHADOW. A head is a cutout, not a thing standing on the ground:
// it takes the house TILE_SHADOW — the same soft lift every tile gets — and
// nothing else. V3's thin ellipse hung under nothing and read as a stray dash.
// ---------------------------------------------------------------------------
export const Portrait: React.FC<{
  src: string;
  x: number;
  footY: number;
  height: number;
  aspect: number;
  label: string;
  labelX?: number;
  labelGap?: number;
  k: number;
  labelColor: string;
  labelOpacity: number;
}> = ({
  src,
  x,
  footY,
  height,
  aspect,
  label,
  labelX,
  labelGap = LABEL_GAP,
  k,
  labelColor,
  labelOpacity,
}) => {
  const w = height * aspect;
  return (
    <>
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: x - w / 2,
          top: footY - height,
          width: w,
          height,
          filter: TILE_SHADOW(k),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: labelX === undefined ? x : labelX,
          top: footY + labelGap,
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          fontFamily: FONT_LABEL,
          fontSize: LABEL_SIZE,
          lineHeight: `${LABEL_LINE}px`,
          letterSpacing: LABEL_TRACK,
          color: labelColor,
          opacity: labelOpacity,
          filter: iconShadow(k),
        }}
      >
        {label}
      </div>
    </>
  );
};

// ---------------------------------------------------------------------------
// THE BOARD BENCH. One wide house tile with three "user" glyphs knocked out of
// it, exactly the way CompanyCard knocks out its sector glyph: a mask whose
// white rect is the tile and whose black strokes are the figure, so the kraft
// shows through the people. SVG, because it is drawn in the same layer as the
// threads that leave it. `y` is the tile's CENTRE: it STANDS, so unlike the
// heads it keeps its contact shadow.
// ---------------------------------------------------------------------------
export const BoardBench: React.FC<{
  x: number;
  y: number;
  k: number;
  opacity?: number;
  contact?: boolean;
}> = ({ x, y, k, opacity = OP_READ, contact = true }) => {
  const tile = squirclePath(BOARD_W, BOARD_H, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH);
  const cell = BOARD_W / BENCH_SEATS;
  const g = BOARD_H * SEAT_GLYPH_F;
  const s = g / 24;
  const id = `bench-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g
      transform={`translate(${(x - BOARD_W / 2).toFixed(2)} ${(y - BOARD_H / 2).toFixed(2)})`}
      style={{ filter: TILE_SHADOW(k) }}
    >
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={0} y={0} width={BOARD_W} height={BOARD_H}>
          <rect width={BOARD_W} height={BOARD_H} fill="#fff" />
          {BENCH_GLYPHS.map((glyph, i) => (
            <g
              key={i}
              transform={`translate(${(i + 0.5) * cell - g / 2} ${(BOARD_H - g) / 2}) scale(${s})`}
              fill="none"
              stroke="#000"
              strokeWidth={GLYPH_STROKE}
              strokeLinecap={GLYPH_CAP}
              strokeLinejoin={GLYPH_JOIN}
              dangerouslySetInnerHTML={{ __html: glyph }}
            />
          ))}
        </mask>
      </defs>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={TILE_GRAD_TOP} />
        <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
      </linearGradient>
      {contact && (
        <ellipse
          cx={BOARD_W / 2}
          cy={BOARD_H + 1}
          rx={BOARD_W * 0.52}
          ry={CONTACT_SHADOW_RY}
          fill="#000"
          opacity={CONTACT_SHADOW_OP}
          style={{ filter: "blur(3px)" }}
        />
      )}
      <path d={tile} fill={`url(#${id}-g)`} opacity={opacity} mask={`url(#${id})`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// A THREAD, drawn tip-first from its source toward the point. `reach` 0..1 is
// how far the tip has travelled; `sag` bows it by that many world px,
// perpendicular to its own run, so a landed thread can strain without moving
// its ends.
// ---------------------------------------------------------------------------
export const Thread: React.FC<{
  from: { x: number; y: number };
  to: { x: number; y: number };
  reach: number;
  sag: number;
  color: string;
  k: number;
  clip?: number; // the fraction of the run at which it meets its target
}> = ({ from, to, reach, sag, color, k, clip = 1 }) => {
  const r = reach * clip;
  if (r <= 0) return null;
  const tip = { x: from.x + (to.x - from.x) * r, y: from.y + (to.y - from.y) * r };
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  // perpendicular, pointing down-ish: a thread sags under its own weight
  const px = -dy / len;
  const py = dx / len;
  const sgn = py >= 0 ? 1 : -1;
  const cx = (from.x + tip.x) / 2 + px * sgn * sag * 2;
  const cy = (from.y + tip.y) / 2 + py * sgn * sag * 2;
  const d =
    sag > 0.01
      ? `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`
      : `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} L ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`;
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeOpacity={THREAD_LIVE}
      strokeWidth={THREAD_W}
      strokeLinecap="butt"
      style={{ filter: iconShadow(k) }}
    />
  );
};

// ---------------------------------------------------------------------------
// THE POINT THEY AGREE ON. A solid ACCENT disc, MINTED the frame the two
// threads land: the coin recipe from d1Shared — a short scale-in with a
// zero-sloped settle past 1, so it is struck rather than faded up. It does not
// exist before `land`.
// ---------------------------------------------------------------------------
export const dotScale = (frame: number, land: number) => {
  if (frame < land) return 0;
  const u = clamp01((frame - land) / DOT_MINT);
  const s = Math.sin(Math.PI * u);
  return smoothstep(u) * (1 + DOT_OVER * s * s);
};

export const AgreePoint: React.FC<{ x: number; y: number; scale: number; k: number }> = ({
  x,
  y,
  scale,
  k,
}) => {
  if (scale <= 0) return null;
  return (
    <circle
      cx={x}
      cy={y}
      r={DOT_R * scale}
      fill={ACCENT}
      style={{ filter: iconShadow(k) }}
    />
  );
};

// ===========================================================================
// V4 — THE BOARDROOM TABLE, AND WHAT THE POP-UP CUT RESOLVES TO.
//
// Director, 2026-09-16 on the V3b preview: "I'm not the biggest fan of how you
// visualized the board — it's a bit boring and slightly out of place." The
// bench (one wide tile, three user glyphs in a row) is kept above, because
// AgreedUponV3 is the trail and still has to render; V4 replaces it with a
// BOARDROOM TABLE SEEN FROM ABOVE, which is a thing rather than a diagram:
//
//   * an OVAL of the house tile material — the same white vertical gradient and
//     the same TILE_SHADOW as every other tile in the clip, clipped to an
//     ellipse 360 x 200 world px — with the OPENAI mark KNOCKED OUT of its
//     centre exactly the way CompanyCard knocks out its sector glyph. It is the
//     OpenAI board's table, and the kraft shows through the mark.
//   * SIX SEATS around it at six even angles, each a small 34 x 34 house
//     squircle sitting TABLE_SEAT_GAP outside the oval's rim along the
//     ellipse's own outward normal, with a Lucide "user" knocked out of it.
//   * FIVE of them are occupied. The sixth — the one at the RIGHT END of the
//     oval, the seat nearest Sam — is NOT DRAWN AT ALL. The gap is the point of
//     the whole cut: this is the board with Sam's chair empty.
//   * ONE contact shadow under the lot (the house ellipse, CONTACT_SHADOW_*
//     scaled to the oval's width), because the table stands.
//
// The thread to Bret leaves the oval's BOTTOM-CENTRE RIM, where the bench's
// left from its bottom edge — so the mirror is untouched: `anchorToTableY` and
// `TABLE_ANCHOR` are the same offset read both ways, exactly like the bench's.
// ===========================================================================

export const TABLE_OVAL_RX = 168;
export const TABLE_OVAL_RY = 94;
export const TABLE_MARK = 76; // the OPENAI mark, drawn on its 24-unit box
export const TABLE_SEAT = 52; // was 34 (director: too small to read as chairs)
// Kraft between the oval's rim and the seat's near edge, along the ellipse's
// own outward normal. RENDERED AT 14 AND BROUGHT IN TO 9 (au4/zoom2x_f199_table,
// first pass): the ellipse is flat, so at +-60 degrees its normal is almost
// vertical and a 14 px gap throws the four corner seats up and away from the
// table — they stopped reading as chairs pulled up to it and read as icons
// scattered round an oval. At 9 the gap is still plainly kraft and the seats
// belong to the table.
export const TABLE_SEAT_GAP = 10;
export const TABLE_SEAT_OFF = TABLE_SEAT_GAP + TABLE_SEAT / 2; // 31, along the normal
export const TABLE_SEAT_GLYPH = 30;
// The knocked-out figure in a 34 px seat is a tenth of the area of a
// CompanyCard's, so CARD_GLYPH_STROKE 2.6 on the 24-unit box comes out at 2.17
// world px — under a screen px and a half at the resolved k, which reads as a
// smudge rather than a person. 3.0 puts it at 2.5 world px: the same weight as
// a thread, which is the thinnest line this clip already draws.
export const TABLE_GLYPH_STROKE = 2.8;
// Six even angles, measured the SVG way (y down): 0 is the oval's right end,
// 60 bottom-right, 120 bottom-left, 180 the left end, 240 top-left, 300
// top-right. 0 IS MISSING ON PURPOSE — it is the seat nearest Sam.
export const TABLE_SEAT_ANGLES = [60, 120, 180, 240, 300];
export const TABLE_EMPTY_ANGLE = 0;

// A seat's centre, relative to the oval's centre: the point on the rim plus
// TABLE_SEAT_OFF along the ellipse's outward normal there.
export const tableSeat = (deg: number) => {
  const t = (deg * Math.PI) / 180;
  const px = TABLE_OVAL_RX * Math.cos(t);
  const py = TABLE_OVAL_RY * Math.sin(t);
  let nx = Math.cos(t) / TABLE_OVAL_RX;
  let ny = Math.sin(t) / TABLE_OVAL_RY;
  const l = Math.hypot(nx, ny) || 1;
  nx /= l;
  ny /= l;
  return { x: px + TABLE_SEAT_OFF * nx, y: py + TABLE_SEAT_OFF * ny };
};

// The footprint, measured off the geometry above rather than typed: the left
// end's seat reaches furthest (the right end has none), so the table's ink is
// 223 left / 180 right of the oval's centre and 128.36 either way vertically —
// 403 x 257 world px, and 43 px wider on the left than on the right.
const seatExtent = (() => {
  let l = TABLE_OVAL_RX;
  let r = TABLE_OVAL_RX;
  let t = TABLE_OVAL_RY;
  let b = TABLE_OVAL_RY;
  for (const a of [...TABLE_SEAT_ANGLES, TABLE_EMPTY_ANGLE]) {
    const c = tableSeat(a);
    l = Math.max(l, -(c.x - TABLE_SEAT / 2));
    r = Math.max(r, c.x + TABLE_SEAT / 2);
    t = Math.max(t, -(c.y - TABLE_SEAT / 2));
    b = Math.max(b, c.y + TABLE_SEAT / 2);
  }
  return { l, r, t, b };
})();
export const TABLE_INK_L = seatExtent.l; // 223
export const TABLE_INK_R = seatExtent.r; // 180
export const TABLE_INK_T = seatExtent.t; // 128.36
export const TABLE_INK_B = seatExtent.b; // 128.36
// THE ONE CONTACT SHADOW. The house ellipse is CONTACT_SHADOW_RY 5 px tall and
// CONTACT_SHADOW_RX 0.62 of the width, which under this table is 223 x 5 — and
// rendered (au4, first pass) that is a straight dark rule running right across
// the frame under the oval, with nothing above most of it. The house has no
// ground lines, and V3b's worst note was a shadow hanging under nothing.
//
// A table seen from above does not stand on an edge, it LIES ON THE SHEET, so
// its one contact shadow is its own footprint: the same ellipse, dropped
// TABLE_SHADOW_CY px, blurred, at a shade under the house opacity. It shows as
// a soft crescent under the table's foot and is hidden by the table everywhere
// else — contact, not a rule. CONTACT_SHADOW_RX is still what sets its spread
// against the oval's width; it is just read as a scale rather than a bar.
export const TABLE_SHADOW_CY = 12;
export const TABLE_SHADOW_RX = TABLE_OVAL_RX;
export const TABLE_SHADOW_RY = TABLE_OVAL_RY;
export const TABLE_SHADOW_OP = CONTACT_SHADOW_OP * 0.8; // 0.24
export const TABLE_SHADOW_BLUR = 8;
// A 34 px seat with the full TILE_SHADOW reads as floating; the same shadow
// asked for a tile 1.7x smaller is the "small" one.
export const TABLE_SEAT_SHADOW_K = 1.7;

// The mirror, read for the table: both sides still hand their thread over at
// ONE anchor height, so the V stays an exact mirror. For the table that height
// is the oval's bottom-centre rim.
export const anchorToTableY = (anchorY: number) => anchorY - TABLE_OVAL_RY;
export const TABLE_ANCHOR = (x: number, y: number) => ({ x, y: y + TABLE_OVAL_RY });

// -- the V4 resolved picture ------------------------------------------------
// Re-solved for the table's ink box. V3's D_FINAL / CX_FINAL / K_FINAL above are
// LEFT ALONE so the trail still renders; these are V4's.
//
// The table is 73 px wider than the bench, so the sides come in 40 px to keep
// Bret's head the size it was on screen (283 px): D 303 -> 263. ANCHOR_Y_FINAL
// and CY_FINAL do not move — the table's top (anchor - 228) is still above
// nothing, Sam's hair is still the ink's ceiling, and Bret's descender is still
// its floor. CX_FINAL does move, and a long way: with the right-hand seat
// missing the table's ink is 43 px wider on its left than on its right, so the
// ink's own centre sits 36 px LEFT of Bret's axis. The camera centres the INK,
// which is the house rule, so Bret's head resolves 30 screen px right of the
// frame's centre and the table's five seats balance him.
// SUPERSEDED BY V4b (the huddle) BELOW. The table's distance and ink centre are
// kept under their own names so this block still describes the delivered V4
// exactly, while the LIVE D_FINAL_V4 / K_FINAL_V4 / CX_FINAL_V4 are re-solved
// for the huddle at the end of this file.
export const D_TABLE_FINAL = 263;
export const TABLE_X_FINAL = BRET_X - D_TABLE_FINAL; // 277
export const TABLE_Y_FINAL = anchorToTableY(ANCHOR_Y_FINAL); // 692.4
export const SAM_X_TABLE_FINAL = BRET_X + D_TABLE_FINAL; // 803
export const SAM_Y_FINAL_V4 = anchorToSamHeadY(ANCHOR_Y_FINAL); // 653.0 — independent of d
export const CX_TABLE_FINAL = 500.475; // the table's ink centre; its left seat made it lopsided

// -- THE MINT ---------------------------------------------------------------
// The coin recipe from d1Shared, read for a whole object: a POP_MINT-frame
// scale-in from POP_FROM to 1 with the house's zero-sloped back(0.75) settle
// (a sin^2 bump, never a kinked max()), and the opacity arriving over the first
// POP_FADE frames so nothing flashes. Its shadow arrives with it, because the
// shadow is a filter on the group the scale is applied to.
export const POP_MINT = 6;
export const POP_FROM = 0.6;
export const POP_OVER = 0.18;
export const POP_FADE = 3;
export const popScale = (frame: number, at: number) => {
  if (frame < at) return 0;
  const u = clamp01((frame - at) / POP_MINT);
  const s = Math.sin(Math.PI * u);
  return POP_FROM + (1 - POP_FROM) * smoothstep(u) * (1 + POP_OVER * s * s);
};
export const popFade = (frame: number, at: number) =>
  frame < at ? 0 : clamp01((frame - at) / POP_FADE);

// ---------------------------------------------------------------------------
// THE BOARDROOM TABLE, TOP-DOWN. SVG, in the same layer as the threads that
// leave it. `x`, `y` are the OVAL's centre; `pop` is the mint's scale about
// that centre and `fade` its opacity, so the whole object — table, seats,
// contact shadow — is struck as one thing.
//
// The knock-outs follow CompanyCard exactly: a mask whose white shape is the
// tile and whose black figure is what the kraft shows through. Each mask lives
// inside the translated <g> that uses it, so `userSpaceOnUse` resolves in that
// group's own coordinates — the recipe the rest of this clip already renders.
// ---------------------------------------------------------------------------
export const BoardTable: React.FC<{
  x: number;
  y: number;
  k: number;
  opacity?: number;
  contact?: boolean;
  pop?: number;
  fade?: number;
}> = ({ x, y, k, opacity = OP_READ, contact = true, pop = 1, fade = 1 }) => {
  if (pop <= 0 || fade <= 0) return null;
  const id = `btable-${Math.round(x)}-${Math.round(y)}`;
  const m = TABLE_MARK / 24;
  const seatTile = squirclePath(TABLE_SEAT, TABLE_SEAT, SQUIRCLE_RATIO, SQUIRCLE_SMOOTH);
  const gs = TABLE_SEAT_GLYPH / 24;
  const go = (TABLE_SEAT - TABLE_SEAT_GLYPH) / 2;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${pop.toFixed(4)})`} opacity={fade}>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={TILE_GRAD_TOP} />
        <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
      </linearGradient>
      {contact && (
        <ellipse
          cx={0}
          cy={TABLE_SHADOW_CY}
          rx={TABLE_SHADOW_RX}
          ry={TABLE_SHADOW_RY}
          fill="#000"
          opacity={TABLE_SHADOW_OP}
          style={{ filter: `blur(${TABLE_SHADOW_BLUR}px)` }}
        />
      )}
      <defs>
        <mask
          id={`${id}-top`}
          maskUnits="userSpaceOnUse"
          x={-TABLE_OVAL_RX}
          y={-TABLE_OVAL_RY}
          width={TABLE_OVAL_RX * 2}
          height={TABLE_OVAL_RY * 2}
        >
          <ellipse cx={0} cy={0} rx={TABLE_OVAL_RX} ry={TABLE_OVAL_RY} fill="#fff" />
          <g transform={`translate(${-TABLE_MARK / 2} ${-TABLE_MARK / 2}) scale(${m})`}>
            {OPENAI.paths.map((d, i) => (
              <path key={i} d={d} fill="#000" fillRule="evenodd" />
            ))}
          </g>
        </mask>
      </defs>
      <ellipse
        cx={0}
        cy={0}
        rx={TABLE_OVAL_RX}
        ry={TABLE_OVAL_RY}
        fill={`url(#${id}-g)`}
        opacity={opacity}
        mask={`url(#${id}-top)`}
        style={{ filter: TILE_SHADOW(k) }}
      />
      {(() => {
        // The empty chair: a blank seat tile at TABLE_EMPTY_ANGLE (nearest Sam),
        // no figure knocked out. Director's note on the first V4 pass: an
        // absent seat read as nothing at all; a blank one reads as empty.
        const c = tableSeat(TABLE_EMPTY_ANGLE);
        return (
          <g
            transform={`translate(${(c.x - TABLE_SEAT / 2).toFixed(2)} ${(c.y - TABLE_SEAT / 2).toFixed(2)})`}
            style={{ filter: TILE_SHADOW(k * TABLE_SEAT_SHADOW_K) }}
          >
            <path d={seatTile} fill={`url(#${id}-g)`} opacity={opacity} />
          </g>
        );
      })()}
      {TABLE_SEAT_ANGLES.map((a) => {
        const c = tableSeat(a);
        const sid = `${id}-s${a}`;
        return (
          <g
            key={a}
            transform={`translate(${(c.x - TABLE_SEAT / 2).toFixed(2)} ${(c.y - TABLE_SEAT / 2).toFixed(2)})`}
            style={{ filter: TILE_SHADOW(k * TABLE_SEAT_SHADOW_K) }}
          >
            <defs>
              <mask id={sid} maskUnits="userSpaceOnUse" x={0} y={0} width={TABLE_SEAT} height={TABLE_SEAT}>
                <rect width={TABLE_SEAT} height={TABLE_SEAT} fill="#fff" />
                <g
                  transform={`translate(${go} ${go}) scale(${gs})`}
                  fill="none"
                  stroke="#000"
                  strokeWidth={TABLE_GLYPH_STROKE}
                  strokeLinecap={GLYPH_CAP}
                  strokeLinejoin={GLYPH_JOIN}
                  dangerouslySetInnerHTML={{ __html: USER_GLYPH }}
                />
              </mask>
            </defs>
            <path d={seatTile} fill={`url(#${id}-g)`} opacity={opacity} mask={`url(#${sid})`} />
          </g>
        );
      })}
    </g>
  );
};

// ===========================================================================
// V4b — THE BOARD IS A HUDDLE OF PALE PEOPLE.
//
// Director, 2026-09-16 on the delivered V4: "I don't think it makes sense that
// one square is not filled; I don't like mixing an oval shape with square
// shapes, it doesn't look harmonious, it looks like Microsoft Paint. Maybe
// instead of boxes with people icons it can just be the people icons in the
// pale white colour."
//
// So the table, the oval, the seat tiles and the blank empty seat are all gone.
// `BoardTable` is kept above (the trail still has to render); the board is now
// `BoardHuddle`: FIVE PERSON SILHOUETTES standing in a group photo. No tiles,
// no oval, no boxes, no empty slot, no label.
//
// A silhouette is SVG GEOMETRY, never an <image> (an SVG <image> on a
// staticFile races frame capture — MEMORY). Its proportions are MEASURED off
// public/person.png rather than invented, so the five read as the same person
// glyph the rest of the house uses. Measured on its alpha (> 96), which is a
// square 430 x 430 ink box:
//
//   head    a circle, diameter 0.4744 of the box (widest rows 0.2628..0.7349),
//           centred at x 0.4989 (call it dead centre) and y 0.2372 — i.e. the
//           circle is tangent to the box's top edge.
//   gap     head bottom 0.4744, shoulders top 0.5111 — 0.0367 of kraft between
//           the chin and the shoulders.
//   shoulders  a HALF-ELLIPSE slab: rx 0.5 of the box, ry 0.4419, centred at
//           y 0.953, straight down to the foot at 1.0, with a 2 px radius at
//           the base. Fitted to the real outline, not guessed: at y 0.605 the
//           measured half-width is 0.30815 and the ellipse gives 0.3082; at
//           0.721 measured 0.4221, ellipse 0.4227; at 0.884 measured 0.48955,
//           ellipse 0.4899. (A true semicircle misses the top by 58 px.)
//
// The brief called the head "~40% of the body width"; the file says 47.4%, and
// the file wins — these are the proportions of the glyph this clip's other
// people are drawn from.
// ===========================================================================

export const PERSON_HEAD_F = 0.2372; // head RADIUS, as a fraction of the figure's height
export const PERSON_HEAD_CY_F = 0.2372; // head centre, below the figure's top
export const PERSON_SHOULDER_RX_F = 0.5;
export const PERSON_SHOULDER_RY_F = 0.4419;
export const PERSON_SHOULDER_CY_F = 0.953;
export const PERSON_BASE_R = 2; // the slab's base corners
export const PERSON_ASPECT = 1; // person.png's ink box is square

// The shoulders, as one path: up the left side, over the dome, down the right
// side, across the flat base with its 2 px corners. `footY` is the figure's
// lowest pixel and `h` its full height; the width follows from PERSON_ASPECT.
export const personShoulders = (cx: number, footY: number, h: number) => {
  const w = h * PERSON_ASPECT;
  const top = footY - h;
  const L = cx - w / 2;
  const R = cx + w / 2;
  const rx = w * PERSON_SHOULDER_RX_F;
  const ry = h * PERSON_SHOULDER_RY_F;
  const ey = top + h * PERSON_SHOULDER_CY_F; // the dome's own centre line
  const rr = Math.min(PERSON_BASE_R, (footY - ey) / 2);
  const n = (v: number) => v.toFixed(2);
  return [
    `M ${n(L)} ${n(footY - rr)}`,
    `L ${n(L)} ${n(ey)}`,
    `A ${n(rx)} ${n(ry)} 0 0 1 ${n(R)} ${n(ey)}`,
    `L ${n(R)} ${n(footY - rr)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(R - rr)} ${n(footY)}`,
    `L ${n(L + rr)} ${n(footY)}`,
    `A ${n(rr)} ${n(rr)} 0 0 1 ${n(L)} ${n(footY - rr)}`,
    "Z",
  ].join(" ");
};

export const personHeadCY = (footY: number, h: number) => footY - h + h * PERSON_HEAD_CY_F;
export const personHeadR = (h: number) => h * PERSON_HEAD_F;

// -- the group photo --------------------------------------------------------
// A back row of three and a front row of two standing in the gaps. The back row
// is SMALLER and LIFTED (further away reads as higher up the sheet), which is
// what makes the five read as one huddle rather than a line of five.
export const HUDDLE_BACK_H = 150;
export const HUDDLE_FRONT_H = 170;
export const HUDDLE_PITCH = 90; // between neighbours in a row: heads clear (71 wide), shoulders overlap
export const HUDDLE_BACK_LIFT = 80; // the back row's feet, above the front row's

// Local coordinates, ground line at y = 0, the group's axis at x = 0.
const HUDDLE_RAW: { x: number; h: number; foot: number }[] = [
  { x: -HUDDLE_PITCH, h: HUDDLE_BACK_H, foot: -HUDDLE_BACK_LIFT },
  { x: 0, h: HUDDLE_BACK_H, foot: -HUDDLE_BACK_LIFT },
  { x: HUDDLE_PITCH, h: HUDDLE_BACK_H, foot: -HUDDLE_BACK_LIFT },
  { x: -HUDDLE_PITCH / 2, h: HUDDLE_FRONT_H, foot: 0 },
  { x: HUDDLE_PITCH / 2, h: HUDDLE_FRONT_H, foot: 0 },
];

// Measured off the five figures rather than typed: 330 x 230 world px, the back
// row setting the width and the height, the front row setting the ground.
const huddleExtent = (() => {
  let l = 0;
  let r = 0;
  let t = 0;
  let b = 0;
  for (const f of HUDDLE_RAW) {
    const w = f.h * PERSON_ASPECT;
    l = Math.max(l, -(f.x - w / 2));
    r = Math.max(r, f.x + w / 2);
    t = Math.max(t, -(f.foot - f.h));
    b = Math.max(b, f.foot);
  }
  return { l, r, t, b };
})();

export const HUDDLE_W = huddleExtent.l + huddleExtent.r; // 330
export const HUDDLE_H = huddleExtent.t + huddleExtent.b; // 230
export const HUDDLE_INK_L = HUDDLE_W / 2; // 165 — symmetric, unlike the table
export const HUDDLE_INK_R = HUDDLE_W / 2; // 165
export const HUDDLE_INK_T = HUDDLE_H / 2; // 115
export const HUDDLE_INK_B = HUDDLE_H / 2; // 115
// The ground line, measured DOWN from the ink box's centre — which is where the
// component's (x, y) sits, so a huddle is placed by its ink like every other
// object in the clip.
export const HUDDLE_GROUND = (huddleExtent.b + huddleExtent.t) / 2; // 115
export const HUDDLE_FIGURES = HUDDLE_RAW.map((f) => ({ ...f, foot: f.foot + HUDDLE_GROUND }));
export const HUDDLE_SEATS = HUDDLE_FIGURES.length; // five
// Back row first (so the front row stands in front of it), and within each row
// RIGHT TO LEFT — see `huddleDrop`: the per-figure hard drop goes down-right, so
// a figure only separates from its neighbour if that neighbour is already down.
export const HUDDLE_DRAW_ORDER = HUDDLE_FIGURES.map((_, i) => i).sort((a, b) => {
  const A = HUDDLE_FIGURES[a];
  const B = HUDDLE_FIGURES[b];
  return A.foot === B.foot ? B.x - A.x : A.foot - B.foot;
});

// What actually stands on the ground is the FRONT ROW: 260 world px across.
export const HUDDLE_FOOT_W = HUDDLE_PITCH + HUDDLE_FRONT_H; // 260
// The house contact ellipse, scaled to that footprint rather than to the
// huddle's full 330: 0.62 of the width is the house ratio and it is kept, but
// it belongs to the part of the object that touches the sheet. At 0.62 x 330
// the ellipse reaches 75 px past the outermost foot on each side with nothing
// above it, which is the dark rule the table's first pass was rejected for; at
// 0.62 x 260 it overhangs by 31 px — 12% of the width each side, exactly a
// CompanyCard's proportion.
export const HUDDLE_SHADOW_RX = CONTACT_SHADOW_RX * HUDDLE_FOOT_W; // 161.2

// A hard 2 SCREEN px drop per figure, so the five separate where they overlap.
// It goes DOWN AND RIGHT, and both components earn their place — rendered with
// a straight-down drop first (au4b, first pass), the two front figures merged
// into one wide two-headed body, because the boundary between two neighbours
// standing side by side is near VERTICAL and a straight-down shadow lands on it
// with no offset at all. Down separates the rows (each head's jaw drops into its
// own neck gap, where the figure behind shows through) and right separates the
// neighbours in a row, so each row is drawn RIGHT TO LEFT and every figure casts
// onto the one beside it. Down-right is also the house's own light: the Coin's
// highlight in d1Shared sits at 35% / 30%, i.e. top-left.
//
// This is a SEPARATOR, not the house shadow — the huddle's house shadow is the
// group's TILE_SHADOW, which is still straight down. Lengths are screen px, so
// it divides by k like every other shadow here.
export const HUDDLE_DROP = 2;
export const HUDDLE_DROP_OP = 0.34;
export const huddleDrop = (k: number) =>
  `drop-shadow(${(HUDDLE_DROP / k).toFixed(2)}px ${(HUDDLE_DROP / k).toFixed(2)}px 0 rgba(0,0,0,${HUDDLE_DROP_OP}))`;

// The mirror, read for the huddle. Both sides still hand their thread over at
// ONE anchor height, so the V stays an exact mirror; for the huddle that height
// is the GROUND — the front row's feet, on the contact shadow. A group of
// people stands, so the thread leaves from between their feet.
export const anchorToHuddleY = (anchorY: number) => anchorY - HUDDLE_GROUND;
export const HUDDLE_ANCHOR = (x: number, y: number) => ({ x, y: y + HUDDLE_GROUND });

// ---------------------------------------------------------------------------
// THE HUDDLE. SVG, in the same layer as the thread that leaves it. `x`, `y` are
// the INK BOX's centre; `pop` is the mint's scale about that centre and `fade`
// its opacity, so the whole group — five figures and the one contact shadow —
// is struck as one object exactly the way the table was.
//
// The pale is the house tile gradient, TILE_GRAD_TOP -> TILE_GRAD_BOTTOM, run
// PER FIGURE from that figure's own top to its own foot (userSpaceOnUse, so the
// head circle and the shoulder slab share one ramp). The group's ink opacity is
// on the GROUP, never per figure: at 0.9 each, an overlapping figure would show
// 10% of its neighbour through itself and the huddle would read as ghosts.
// ---------------------------------------------------------------------------
export const BoardHuddle: React.FC<{
  x: number;
  y: number;
  k: number;
  opacity?: number;
  contact?: boolean;
  pop?: number;
  fade?: number;
}> = ({ x, y, k, opacity = OP_READ, contact = true, pop = 1, fade = 1 }) => {
  if (pop <= 0 || fade <= 0) return null;
  const id = `bhud-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${pop.toFixed(4)})`} opacity={fade}>
      {contact && (
        <ellipse
          cx={0}
          cy={HUDDLE_GROUND}
          rx={HUDDLE_SHADOW_RX}
          ry={CONTACT_SHADOW_RY}
          fill="#000"
          opacity={CONTACT_SHADOW_OP}
          style={{ filter: "blur(3px)" }}
        />
      )}
      <defs>
        {HUDDLE_FIGURES.map((f, i) => (
          <linearGradient
            key={i}
            id={`${id}-g${i}`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={f.foot - f.h}
            x2={0}
            y2={f.foot}
          >
            <stop offset="0%" stopColor={TILE_GRAD_TOP} />
            <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
          </linearGradient>
        ))}
      </defs>
      {/* The back row is drawn first, so the front row stands in front of it;
          within a row the order is RIGHT TO LEFT, so each figure's down-right
          hard drop lands on its neighbour rather than inside itself. */}
      <g style={{ filter: TILE_SHADOW(k) }} opacity={opacity}>
        {HUDDLE_DRAW_ORDER.map((i) => HUDDLE_FIGURES[i]).map((f, n) => (
          <g key={n} style={{ filter: huddleDrop(k) }}>
            <circle
              cx={f.x}
              cy={personHeadCY(f.foot, f.h)}
              r={personHeadR(f.h)}
              fill={`url(#${id}-g${HUDDLE_DRAW_ORDER[n]})`}
            />
            <path d={personShoulders(f.x, f.foot, f.h)} fill={`url(#${id}-g${HUDDLE_DRAW_ORDER[n]})`} />
          </g>
        ))}
      </g>
    </g>
  );
};

// -- the V4b resolved picture ------------------------------------------------
// Re-solved for the huddle's ink box, which is 330 x 230 and SYMMETRIC — the
// table's was 460 x 283 and lopsided. Two consequences, both good:
//
//   * the sides go back OUT. The huddle is 130 px narrower than the table, so
//     to keep Bret's head at the 283 screen px it has been at since V3b (i.e.
//     K_FINAL_V4 unchanged at 0.8334) the mirror distance grows 263 -> 292.
//   * the camera stops leaning left. The table's ink centre sat 36 px left of
//     Bret's axis; the huddle's is on it, so the only thing still pulling the
//     resolved ink centre off 540 is Sam's name, and CX_FINAL_V4 comes back to
//     532.975 — the same number the bench world resolved to.
//
// ANCHOR_Y_FINAL, CY_FINAL, DOT_*, BRET_* and Sam's whole label solve are
// untouched: the huddle's top (anchor - 230) is still above nothing, Sam's hair
// is still the ink's ceiling and Bret's descender still its floor.
export const D_FINAL_V4 = 292;
export const HUDDLE_X_FINAL = BRET_X - D_FINAL_V4; // 248
export const HUDDLE_Y_FINAL = anchorToHuddleY(ANCHOR_Y_FINAL); // 677.4
export const SAM_X_FINAL_V4 = BRET_X + D_FINAL_V4; // 832
export const K_FINAL_V4 = 0.8334; // unchanged: Bret's head stays 283 screen px
export const CX_FINAL_V4 = 532.975; // the resolved ink's own centre across
