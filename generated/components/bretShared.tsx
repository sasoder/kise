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
  OP_READ,
  SQUIRCLE_RATIO,
  SQUIRCLE_SMOOTH,
  iconShadow,
  squirclePath,
} from "./fieldShared";

// ---------------------------------------------------------------------------
// bretShared V2 — the world the Bret Taylor / OpenAI-board cuts share.
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
// V2 CHANGED THREE THINGS AND NOTHING ELSE (director, 2026-09-16):
//
//  1. THE CAST IS A TRIANGLE, NOT A ROW. V1 stood all three on one foot line,
//     which caps every one of them at a third of the frame's width and leaves
//     a 1920-tall frame empty above and below. Here Bret stands LOW and
//     CENTRE, the bench sits UPPER-LEFT and Sam UPPER-RIGHT, and the threads
//     run diagonally down to him. Nothing shares a foot line any more: each
//     piece stands on its own contact shadow at its own FOOT_Y, which is what
//     "no ground line" was always for.
//
//  2. EVERY CUTOUT DISSOLVES INTO ITS SHADOW. A bust that ends on a straight
//     edge reads as a pasted photograph, so the alpha ramp is BAKED into the
//     PNG (a CSS mask on an <Img> inside the SVG path is not deterministic at
//     frame-capture time): the bottom 12% of each file fades out, and the
//     ramp bites SOONER toward the sides, so the two bottom corners go first
//     and the silhouette ends on nothing along its whole boundary.
//
//  3. A PORTRAIT IS SIZED BY ITS HEAD, NOT BY ITS BOX. The two photographs are
//     framed differently — Bret is a medium shot of a seated man (his head is
//     63% of the crop), Sam is a straight-on bust (73%) — so sizing them by
//     total height sizes them wrongly. Each cutout carries its own measured
//     geometry below and the cut asks for a head size; the box follows.
//
// THE CAST:
//   * a PORTRAIT is a photographic cutout (transparent PNG), its contact
//     shadow, and its name in Söhne Buch under it. Nothing else — the photo is
//     the noun.
//   * the BOARD is one wide house tile with three Lucide "user" glyphs KNOCKED
//     OUT of it (the CompanyCard recipe: square caps, stroke 2.6, the paper
//     shows through). A bench of people, no label. It stands on its own little
//     ground, with its own contact shadow.
//   * a THREAD is the house thread: 2.5 px, ACCENT, 0.95, live from the frame
//     it is drawn. Geometric — source to Bret — so when a side moves the thread
//     follows it with no extra track.
// ---------------------------------------------------------------------------

// -- type -------------------------------------------------------------------
// Söhne Buch, vendored, loaded at module scope so a font failure surfaces
// before a frame is drawn. One weight: a name label is the only type in the cut.
export const FONT_LABEL = "SohneBuchAU";
loadFont({ family: FONT_LABEL, url: staticFile("Sohne-Buch.otf"), weight: "400" });

export const LABEL_SIZE = 26; // world px, the house axis/label size
export const LABEL_OP = 0.55; // ink at rest
export const LABEL_GAP = 35; // top of the label box, below its owner's foot
export const LABEL_LINE = 26;
export const LABEL_TRACK = 0.2;

// -- the world --------------------------------------------------------------
export const WORLD_W = 1080;
export const WORLD_H = 1450;

// ---------------------------------------------------------------------------
// THE TWO CUTOUTS, measured off the PNGs in public/heads by the build script
// kept beside this cut's preview (scratchpad au2/heads/build_heads.py):
//   aspect   width / height of the file
//   headF    the head's height (hair top -> chin) as a fraction of the file's
//   hcF      the head's centre, as a fraction of the file's height
//   hcxF     the head's centre across, as a fraction of the file's width
//   ink*     the bbox of everything at alpha > 64, as fractions of the file
//
// Bret: "TechCrunch Disrupt 2024 D2 Bret Taylor-5 (54102610062).jpg" (CC BY
// 2.0, TechCrunch, 2048x1366), cut with rembg and cropped x1055-1395 /
// y155-470. V1's photograph had a microphone painted out under the chin and
// the repair showed as a blur patch; this one has nothing under the chin, no
// raised hand and a clean quarter-zip collar, so nothing is retouched at all.
//
// Sam: the same cutout V1 used, re-cropped (x240-930 / y55-720) so the foot
// ramp has a whole bust to eat instead of ending on his jaw — V1's crop left
// him a head on a neck beside a man with shoulders.
// ---------------------------------------------------------------------------
export const BRET_ASPECT = 1.07949;
export const BRET_HEAD_F = 0.6254;
export const BRET_HEAD_CENTRE_F = 0.44286;
export const BRET_HEAD_CX_F = 0.55882;
export const BRET_INK_X0 = 0.0285;
export const BRET_INK_X1 = 0.9406;
export const BRET_INK_Y0 = 0.1192;
export const BRET_INK_Y1 = 0.9603;

export const SAM_ASPECT = 1.03718;
export const SAM_HEAD_F = 0.67669;
export const SAM_HEAD_CENTRE_F = 0.3985;
export const SAM_INK_X0 = 0.0804;
export const SAM_INK_X1 = 0.9444;
export const SAM_INK_Y0 = 0.0615;
export const SAM_INK_Y1 = 0.9603;

// The one size the cut chooses: how tall Bret's HEAD is in world px. Everything
// else follows. Sam's head is 0.85 of it — he is the further of the two.
export const BRET_HEAD = 290;
export const SAM_HEAD_RATIO = 0.82;

export const BRET_H = BRET_HEAD / BRET_HEAD_F; // 463.7
export const BRET_W = BRET_H * BRET_ASPECT; // 500.5
export const SAM_H = (SAM_HEAD_RATIO * BRET_HEAD) / SAM_HEAD_F; // 351.4
export const SAM_W = SAM_H * SAM_ASPECT; // 364.5

// Bret is placed by his HEAD, which is not his box's centre (he is turned to
// his left and the crop keeps his whole shoulder). His head is at x 540 on
// every frame of every cut, so the camera never has to pan to hold his face.
export const BRET_X = 540; // his HEAD's centre across; never moves
export const BRET_FOOT = 1210; // the bottom of his box — where his shadow is
export const BRET_BOX_CX = BRET_X - (BRET_HEAD_CX_F - 0.5) * BRET_W; // 510.6
export const BRET_BOX_LEFT = BRET_BOX_CX - BRET_W / 2;
export const BRET_BOX_TOP = BRET_FOOT - BRET_H; // 746.3
export const BRET_HEAD_Y = BRET_BOX_TOP + BRET_HEAD_CENTRE_F * BRET_H; // 951.7
export const BRET_CHIN = BRET_HEAD_Y + BRET_HEAD / 2; // 1096.7

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
// inlined — nothing is installed and nothing is fetched at render time. One
// path per seat; the bench is three of them in a row.
export const USER_GLYPH = `<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />`;
export const BENCH_GLYPHS = [USER_GLYPH, USER_GLYPH, USER_GLYPH];

// ---------------------------------------------------------------------------
// BRET'S SILHOUETTE, sampled off bret.png every 2.5% of its height at alpha >
// 96: [yFraction, xLeftFraction, xRightFraction]. V1 could clip a thread with
// one measured row because the sides stood BESIDE him and the threads ran
// almost horizontally. In the triangle they come down at a steep angle, so
// where a thread meets him depends on where its source is, and the only honest
// answer is to walk the line until it is inside him.
// ---------------------------------------------------------------------------
export const BRET_SIL: [number, number, number][] = [
  [0.0, 0.5, 0.5], [0.025, 0.5, 0.5], [0.05, 0.5, 0.5], [0.075, 0.5, 0.5],
  [0.1, 0.5, 0.5], [0.125, 0.5285, 0.6176], [0.15, 0.4727, 0.6758],
  [0.175, 0.4442, 0.7102], [0.2, 0.424, 0.7304], [0.225, 0.4074, 0.7506],
  [0.25, 0.3955, 0.766], [0.275, 0.3907, 0.7732], [0.3, 0.3848, 0.7767],
  [0.325, 0.3789, 0.7755], [0.35, 0.3789, 0.7696], [0.375, 0.361, 0.7672],
  [0.4, 0.3551, 0.7625], [0.425, 0.3599, 0.7589], [0.45, 0.361, 0.7708],
  [0.475, 0.3622, 0.7732], [0.5, 0.3705, 0.7672], [0.525, 0.3729, 0.7577],
  [0.55, 0.3729, 0.747], [0.575, 0.3599, 0.7233], [0.6, 0.3468, 0.6817],
  [0.625, 0.3373, 0.6746], [0.65, 0.3254, 0.6865], [0.675, 0.3064, 0.7078],
  [0.7, 0.272, 0.7173], [0.725, 0.2245, 0.6924], [0.75, 0.1734, 0.7031],
  [0.775, 0.1235, 0.7637], [0.8, 0.0867, 0.8563], [0.825, 0.0618, 0.8884],
  [0.85, 0.0451, 0.9121], [0.875, 0.038, 0.9252], [0.9, 0.0309, 0.9335],
  [0.925, 0.2933, 0.7067], [0.95, 0.5, 0.5], [0.975, 0.5, 0.5], [1.0, 0.5, 0.5],
];

// Is (x, y) inside Bret, for a bust whose box is at (boxLeft, boxTop)?
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

// How far along `from -> aim` the thread is drawn: to the point where it first
// meets him, plus THREAD_BITE px INSIDE his outline. Drawn all the way to his
// centre the two threads overlap across his chest and the convergence is lost.
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
// Where each side hands its thread over, and where each thread aims. Both are
// measured off the tile / cutout rather than typed as world points, so they
// travel with their owner and no extra track is needed.
//
// The bench lets go of its bottom-right corner region; Sam off his lower-left
// shoulder. Each aims at the far edge of Bret's chest — the LEFT thread at his
// left outline, the RIGHT one at his right — so the two come down either side
// of his head and meet him on opposite shoulders. Aimed at his centre instead,
// both lines run straight through his face.
export const BENCH_ANCHOR_DX = BOARD_W / 2 - 26;
export const BOARD_ANCHOR = (x: number, y: number) => ({
  x: x + BENCH_ANCHOR_DX,
  y: y + BOARD_H / 2,
});
export const SAM_ANCHOR_FX = 0.27; // across his box
export const SAM_ANCHOR_FY = 0.88; // down his box
export const SAM_ANCHOR = (x: number, y: number) => ({
  x: x + (SAM_ANCHOR_FX - 0.5) * SAM_W,
  y: y + (SAM_ANCHOR_FY - 0.5) * SAM_H,
});
export const CHEST_FY = 0.845; // the row of Bret the threads aim at
export const CHEST_L_FX = 0.0451; // his outline on that row, left and right
export const CHEST_R_FX = 0.9121;
export const chestAim = (bx: number, by: number, left: boolean) => ({
  x: bx - BRET_W / 2 + (left ? CHEST_L_FX : CHEST_R_FX) * BRET_W,
  y: by + CHEST_FY * BRET_H,
});

// -- the resolved picture ---------------------------------------------------
// What a later cut of this clip opens on. Solved in AgreedUpon against the
// padding box (screen x 120-960, y 300-1350, 30-60 px of air) and the world
// band, then measured off the render by au-band.py.
export const BOARD_X_FINAL = 363.35;
export const BOARD_Y_FINAL = 615;
export const SAM_X_FINAL = 753.35;
export const SAM_Y_FINAL = 650;
export const K_FINAL = 1.1;
export const CX_FINAL = 540;
export const CY_FINAL = 894; // the CONTENT centre; the camera's cy adds CAM_LIFT / k

// What actually READS as ink against the kraft, as opposed to what has a non-
// zero alpha. The foot ramp's tail is a dark bust at 10-40% over a mid-brown
// sheet, which au-band.py's local-contrast test does not see and the eye does
// not either, so the layout is solved against these rather than against
// SAM_INK_X1 — measured off the render at f199 and checked every re-render.
export const SAM_VIS_X1 = 0.858;
export const SAM_VIS_Y1 = 0.93; // the CONTENT centre; the camera's cy adds CAM_LIFT / k

// A portrait's contact shadow is its footprint, not its shoulder span: a bust
// is widest at the shoulders and narrowest where it would touch the ground.
export const PORTRAIT_SHADOW_RX = 0.4;

// ---------------------------------------------------------------------------
// A PORTRAIT. HTML, not SVG: an SVG <image> pointing at staticFile races frame
// capture and flashes (MEMORY), while Remotion's <Img> holds the frame until
// the bitmap is decoded. It lives in a layer that carries the EXACT same world
// transform as the SVG layer, so a world px is a world px in both.
//
// `x` is the cutout BOX's centre across and `footY` the bottom of its box —
// each portrait stands on its own spot, never on a shared line.
// `labelColor` / `labelOpacity` carry the one ink click of the cut, and
// `labelX` lets Bret's name sit under his FACE rather than under his box.
// ---------------------------------------------------------------------------
export const Portrait: React.FC<{
  src: string;
  x: number;
  footY: number;
  height: number;
  aspect: number;
  label: string;
  labelX?: number;
  k: number;
  labelColor: string;
  labelOpacity: number;
  shadowOpacity?: number;
}> = ({
  src,
  x,
  footY,
  height,
  aspect,
  label,
  labelX,
  k,
  labelColor,
  labelOpacity,
  shadowOpacity = CONTACT_SHADOW_OP,
}) => {
  const w = height * aspect;
  const rx = w * PORTRAIT_SHADOW_RX;
  return (
    <>
      {/* the contact shadow it stands on — under the cutout, never a ground line */}
      <div
        style={{
          position: "absolute",
          left: x - rx,
          top: footY - CONTACT_SHADOW_RY,
          width: rx * 2,
          height: CONTACT_SHADOW_RY * 2,
          borderRadius: "50%",
          backgroundColor: "#000",
          opacity: shadowOpacity,
          filter: "blur(3px)",
        }}
      />
      <Img
        src={staticFile(src)}
        style={{
          position: "absolute",
          left: x - w / 2,
          top: footY - height,
          width: w,
          height,
          filter: iconShadow(k),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: labelX === undefined ? x : labelX,
          top: footY + LABEL_GAP,
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
// threads that leave it. `y` is the tile's CENTRE: it stands in the air on its
// own contact shadow, like everything else in the triangle.
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
// A THREAD, drawn tip-first from its source toward Bret. `reach` 0..1 is how
// far the tip has travelled; `sag` bows it by that many world px, perpendicular
// to its own run, so a landed thread can strain without moving its ends.
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
