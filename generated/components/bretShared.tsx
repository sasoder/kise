import React from "react";
import { loadFont } from "@remotion/fonts";
import { Img, staticFile } from "remotion";
import {
  CONTACT_SHADOW_OP,
  CONTACT_SHADOW_RY,
  TILE_GRAD_BOTTOM,
  TILE_GRAD_TOP,
  TILE_SHADOW,
} from "./d1Shared";
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
