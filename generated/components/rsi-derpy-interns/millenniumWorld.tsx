import React from "react";
import { ACCENT, BG_DIM, clamp01, iconShadow, smoothstep, squirclePath } from "../kits/dwarkesh/fieldShared";
import { FONT_LABEL, INK, INK_HI, INK_LO, LABEL_WEIGHT, Label, MARCH_PX_PER_F, STROKE_PX, worldPx } from "../kits/dwarkesh/alignShared";
import {
  EYE_TONE,
  FACE_UNITS,
  FIGURE_TONE,
  FIGURE_TONE_FAR,
  FIGURE_TONE_TIE,
  FigurePose,
  GROUND_Y,
  HEAD_MARK,
  eyePath,
} from "../rsi-another-jump/timelineWorld";

// ---------------------------------------------------------------------------
// millenniumWorld — the Millennium Prize row that cut 97 (`SmarterCracksIt`)
// builds and cut 107 returns to (rsi-derpy-interns).
//
// THE WORLD. A white floor (the line the figures stand on, timelineWorld's
// GROUND_Y) with one straight row of seven white squircle cards floating above
// it, one per Millennium Prize problem, and at the row's right end one bigger
// card, CONTINUAL LEARNING. Today's intern (rsi-another-jump's AiFigure, age 1)
// stands in a gap in the row, just right of the card it solved (NAVIER-STOKES).
//
// A card is an outline at the style's one weight with a short Roboto Condensed
// label at the top and one glyph below it:
//   open    white outline, white padlock          (unsolved)
//   person  white outline, white check            (solved by a person: Poincare)
//   ai      ACCENT outline, ACCENT check          (solved by the AI: Navier-Stokes)
//   dashed  white marching dashed outline, white padlock (unsolved and not even
//           a real Millennium problem: the continual-learning breakthrough)
// `crack` 0..1 turns a dashed card into an ai card: the dashes close, ACCENT
// runs both ways round the outline from the contact point, the padlock's
// shackle springs open, the padlock cross-fades out while an ACCENT check
// writes itself in (crackParts gives the sub-phases).
//
// Every length is WORLD px, sized for MILL_K_REST (the resting zoom).
// ---------------------------------------------------------------------------

type P = { x: number; y: number };
const line = (pts: P[]) => `M${pts.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" L")}`;
const poly = (pts: P[]) => `${line(pts)} Z`;

/** the resting zoom the strokes and labels here are sized for */
export const MILL_K_REST = 0.86;
/** the style's one weight at MILL_K_REST (6.5 screen px) */
export const MILL_STROKE = worldPx(STROKE_PX, MILL_K_REST);

// --- the floor --------------------------------------------------------------------
/** the floor line: its top edge is GROUND_Y, so AiFigure's default feet stand on it */
export const FLOOR_Y = GROUND_Y + MILL_STROKE / 2;
export const Floor: React.FC<{ k: number; x0: number; x1: number; opacity?: number }> = ({ k, x0, x1, opacity = INK_LO }) => (
  <g style={{ filter: iconShadow(k) }} opacity={opacity}>
    <line x1={x0} y1={FLOOR_Y} x2={x1} y2={FLOOR_Y} stroke={INK} strokeWidth={MILL_STROKE} strokeLinecap="round" />
  </g>
);

// --- the cards ----------------------------------------------------------------------
export const CARD_W = 210;
export const CARD_H = 220;
export const CARD_GAP = 24;
export const CARD_PITCH = CARD_W + CARD_GAP;
/** a row card's bottom edge floats this far above GROUND_Y */
export const CARD_LIFT = 120;
export const CARD_BOTTOM = GROUND_Y - CARD_LIFT;
export const CARD_TOP = CARD_BOTTOM - CARD_H;
/** the label's text-box top below the card's top edge; label size; line pitch */
export const CARD_LABEL_DY = 26;
export const CARD_LABEL_SIZE = 38;
export const CARD_LINE_H = 1.04;
/** the glyph (padlock / check) box, centred this far above the card's bottom */
export const CARD_GLYPH = 76;
export const CARD_GLYPH_DY = 26 + CARD_GLYPH / 2;
/** the CONTINUAL LEARNING card is this many row cards big (its bottom on the row's bottom) */
export const CL_SCALE = 1.6;
export const CL_W = CARD_W * CL_SCALE;
export const CL_H = CARD_H * CL_SCALE;
export const CL_LABEL_SIZE = 52;
/** the dashed outline: dash and gap, world px */
export const CARD_DASH = 24;
export const CARD_DASH_GAP = 15;

export type CardState = "open" | "person" | "ai" | "dashed";
export type RowCard = { id: string; lines: string[]; state: CardState; x: number };

// --- the row layout -------------------------------------------------------------------
/** today's intern stands here (hip x), in the gap right of NAVIER-STOKES */
export const INTERN_X = 0;
/** NAVIER-STOKES' right edge and HODGE's left edge: the gap the intern stands in */
export const GAP_LEFT = INTERN_X - 85;
export const GAP_RIGHT = INTERN_X + 150;
const leftX = (i: number) => GAP_LEFT - CARD_W / 2 - i * CARD_PITCH; // i = 0 nearest the intern
const rightX = (i: number) => GAP_RIGHT + CARD_W / 2 + i * CARD_PITCH;
/** Left to right: the intern's own card, then the six it has not touched (Poincare solved by a person).
 *  BSD = Birch and Swinnerton-Dyer (the full name does not fit a card). */
export const ROW: RowCard[] = [
  { id: "navier", lines: ["NAVIER–", "STOKES"], state: "ai", x: leftX(0) },
  { id: "poincare", lines: ["POINCARÉ"], state: "person", x: rightX(0) },
  { id: "pnp", lines: ["P VS NP"], state: "open", x: rightX(1) },
  { id: "hodge", lines: ["HODGE"], state: "open", x: rightX(2) },
  { id: "riemann", lines: ["RIEMANN"], state: "open", x: rightX(3) },
  { id: "yangmills", lines: ["YANG–", "MILLS"], state: "open", x: rightX(4) },
  { id: "bsd", lines: ["BSD"], state: "open", x: rightX(5) },
];
export const ROW_LEFT = ROW[0].x - CARD_W / 2;
export const ROW_RIGHT = ROW[ROW.length - 1].x + CARD_W / 2;
/** where the bigger, smarter intern stops (hip x), clear of BSD */
export const GIANT_X = ROW_RIGHT + 95;
/** the CONTINUAL LEARNING card: its left edge, centre, and its bottom on the row's bottom */
export const CL_LEFT = GIANT_X + 190;
export const CL_X = CL_LEFT + CL_W / 2;
export const CL_BOTTOM = CARD_BOTTOM;
export const CL_TOP = CL_BOTTOM - CL_H;
export const CL_LINES = ["CONTINUAL", "LEARNING"];

// --- glyphs ---------------------------------------------------------------------------
/** lucide `check`, the three points its stroke is written through (24 box) */
export const CHECK_PTS: P[] = [
  { x: 4, y: 12 },
  { x: 9, y: 17 },
  { x: 20, y: 6 },
];

/** A check written by its tip (`progress` 0..1) in a `size` box centred on (x, y). */
export const CheckGlyph: React.FC<{ x: number; y: number; size: number; progress: number; color: string; sw: number }> = ({
  x,
  y,
  size,
  progress,
  color,
  sw,
}) => {
  const t = clamp01(progress);
  if (t <= 0) return null;
  const s = size / 24;
  const pts = CHECK_PTS.map((q) => ({ x: x + (q.x - 12) * s, y: y + (q.y - 12) * s }));
  const segs = [Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y), Math.hypot(pts[2].x - pts[1].x, pts[2].y - pts[1].y)];
  let left = (segs[0] + segs[1]) * t;
  const out: P[] = [pts[0]];
  for (let i = 0; i < 2; i++) {
    const u = Math.min(1, left / segs[i]);
    out.push({ x: pts[i].x + (pts[i + 1].x - pts[i].x) * u, y: pts[i].y + (pts[i + 1].y - pts[i].y) * u });
    left -= segs[i];
    if (left <= 0) break;
  }
  return <path d={line(out)} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />;
};

/**
 * A padlock (lucide `lock` geometry: an 18 x 11 body under a 10-wide shackle),
 * in a `size` box centred on (x, y). `open` 0..1 springs the shackle: it lifts
 * out of the body, then swivels about its left leg so the right leg comes free.
 */
export const LockGlyph: React.FC<{
  x: number;
  y: number;
  size: number;
  open?: number;
  color?: string;
  sw: number;
  opacity?: number;
}> = ({ x, y, size, open = 0, color = INK, sw, opacity = 1 }) => {
  if (opacity <= 0) return null;
  const s = size / 24;
  const lift = 3.2 * smoothstep(clamp01(open / 0.55));
  const swing = -24 * smoothstep(clamp01((open - 0.35) / 0.65));
  return (
    <g
      transform={`translate(${(x - 12 * s).toFixed(3)} ${(y - 12 * s).toFixed(3)}) scale(${s.toFixed(5)})`}
      fill="none"
      stroke={color}
      strokeWidth={sw / s}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    >
      <g transform={`rotate(${swing.toFixed(3)} 7 ${(11 - lift).toFixed(3)}) translate(0 ${(-lift).toFixed(3)})`}>
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </g>
      <path d={squirclePath(18, 11)} transform="translate(3 11)" />
    </g>
  );
};

// --- a card -----------------------------------------------------------------------------
/** The crack's sub-phases for `crack` 0..1 (all 0 at 0, all done at 1). */
export const crackParts = (crack: number) => {
  const c = clamp01(crack);
  return {
    /** the dashes' gap closes */
    close: smoothstep(clamp01(c / 0.45)),
    /** ACCENT runs round the outline both ways from the contact point (fraction of the whole outline) */
    run: smoothstep(clamp01(c / 0.6)),
    /** the shackle springs */
    pop: clamp01(c / 0.32),
    /** the padlock leaves (cross-fade) */
    lockOut: smoothstep(clamp01((c - 0.25) / 0.6)),
    /** the check writes itself in */
    check: smoothstep(clamp01((c - 0.25) / 0.45)),
  };
};

/** Where on a card's squirclePath outline (as a fraction of its length; the path starts on the top edge at its
 *  right corner and runs clockwise) a point on the LEFT edge, `fromTop` below the top, sits. The corners are
 *  tiny, so the rectangle's perimeter is exact to a pixel or two. */
export const leftEdgeFraction = (w: number, h: number, fromTop: number) => (w + 2 * h - fromTop) / (2 * (w + h));

/**
 * One card's shape and glyph. SVG, world px. (x, bottom) = the card's bottom centre. The label is a separate
 * DOM element (`CardLabel`) that goes in the world div. `contact` = where the crack starts on the outline
 * (a fraction from `leftEdgeFraction`).
 */
export const MillenniumCard: React.FC<{
  k: number;
  x: number;
  bottom: number;
  w: number;
  h: number;
  state: CardState;
  crack?: number;
  contact?: number;
  march?: number;
  glyph?: number;
  opacity?: number;
}> = ({ k, x, bottom, w, h, state, crack = 0, contact = 0.6, march = 0, glyph = CARD_GLYPH, opacity = INK_HI }) => {
  const left = x - w / 2;
  const top = bottom - h;
  const d = squirclePath(w, h);
  const gx = x;
  const gy = bottom - (26 * w) / CARD_W - glyph / 2;
  const cp = crackParts(state === "dashed" ? crack : 0);
  const lit = state === "ai" ? 1 : cp.run;
  const outlineColor = state === "ai" ? ACCENT : INK;
  const sw = MILL_STROKE;
  const half = lit / 2;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <g transform={`translate(${left.toFixed(3)} ${top.toFixed(3)})`}>
        {state === "dashed" ? (
          lit < 1 ? (
            <path
              d={d}
              fill="none"
              stroke={INK}
              strokeWidth={sw}
              strokeDasharray={`${CARD_DASH} ${(CARD_DASH_GAP * (1 - cp.close)).toFixed(3)}`}
              strokeDashoffset={-march}
            />
          ) : null
        ) : (
          <path d={d} fill="none" stroke={outlineColor} strokeWidth={sw} />
        )}
        {state === "dashed" && lit > 0 ? (
          <path
            d={d}
            fill="none"
            stroke={ACCENT}
            strokeWidth={sw}
            pathLength={1}
            strokeDasharray={lit >= 1 ? undefined : `${(2 * half).toFixed(5)} ${(1 - 2 * half).toFixed(5)}`}
            strokeDashoffset={lit >= 1 ? undefined : (-(contact - half)).toFixed(5)}
          />
        ) : null}
      </g>
      {state === "open" || state === "dashed" ? (
        <LockGlyph x={gx} y={gy} size={glyph} sw={sw} open={cp.pop} opacity={1 - cp.lockOut} />
      ) : null}
      {state === "person" ? <CheckGlyph x={gx} y={gy} size={glyph} progress={1} color={INK} sw={sw * 1.15} /> : null}
      {state === "ai" ? <CheckGlyph x={gx} y={gy} size={glyph} progress={1} color={ACCENT} sw={sw * 1.15} /> : null}
      {state === "dashed" ? <CheckGlyph x={gx} y={gy} size={glyph} progress={cp.check} color={ACCENT} sw={sw * 1.15} /> : null}
    </g>
  );
};

/** A card's label lines (DOM; goes in the world div), centred on x, the first line's top `CARD_LABEL_DY`
 *  (scaled with the card) under the card's top. Every card's first line shares one baseline. */
export const CardLabel: React.FC<{
  k: number;
  x: number;
  top: number;
  lines: string[];
  size?: number;
  scale?: number;
  opacity?: number;
}> = ({ k, x, top, lines, size = CARD_LABEL_SIZE, scale = 1, opacity = INK_HI }) => (
  <>
    {lines.map((t, i) => (
      <Label
        key={i}
        k={k}
        x={x}
        y={top + CARD_LABEL_DY * scale + i * size * CARD_LINE_H}
        text={t}
        inT={1}
        size={size}
        opacity={opacity}
      />
    ))}
  </>
);

/** The whole row, SVG part. */
export const MillenniumRow: React.FC<{ k: number; opacity?: number }> = ({ k, opacity }) => (
  <>
    {ROW.map((c) => (
      <MillenniumCard key={c.id} k={k} x={c.x} bottom={CARD_BOTTOM} w={CARD_W} h={CARD_H} state={c.state} opacity={opacity} />
    ))}
  </>
);
/** The whole row's labels (DOM). */
export const MillenniumRowLabels: React.FC<{ k: number; opacity?: number }> = ({ k, opacity }) => (
  <>
    {ROW.map((c) => (
      <CardLabel key={c.id} k={k} x={c.x} top={CARD_TOP} lines={c.lines} opacity={opacity} />
    ))}
  </>
);

/** The CONTINUAL LEARNING card, SVG part. `crack` 0 = dashed and locked, 1 = cracked (an ai card). */
export const ContinualCard: React.FC<{ k: number; crack: number; contact: number; march: number }> = ({
  k,
  crack,
  contact,
  march,
}) => (
  <MillenniumCard
    k={k}
    x={CL_X}
    bottom={CL_BOTTOM}
    w={CL_W}
    h={CL_H}
    state="dashed"
    crack={crack}
    contact={contact}
    march={march}
    glyph={CARD_GLYPH * CL_SCALE}
  />
);
export const ContinualLabel: React.FC<{ k: number }> = ({ k }) => (
  <CardLabel k={k} x={CL_X} top={CL_TOP} lines={CL_LINES} size={CL_LABEL_SIZE} scale={CL_SCALE} />
);
/** world px per frame the dashed outlines march */
export const CARD_MARCH = MARCH_PX_PER_F;

// --- a figure drawn from a pose ---------------------------------------------------------
/**
 * The far arm reaching for a point: shoulder -> elbow -> hand, the hand at `target` (world px), the elbow
 * bending down and back (two-bone IK, upper = forearm = armL / 2). Past the arm's reach the hand stops short.
 */
export const reachArm = (g: FigurePose, target: P): P[] => {
  const S = g.farArm[0];
  const l = g.p.armL / 2;
  const dx = target.x - S.x;
  const dy = target.y - S.y;
  const d = Math.max(1e-6, Math.hypot(dx, dy));
  const dd = Math.min(d, 2 * l * 0.99999);
  const ux = dx / d;
  const uy = dy / d;
  const along = dd / 2;
  const off = Math.sqrt(Math.max(0, l * l - along * along));
  const E = { x: S.x + ux * along - uy * off, y: S.y + uy * along + ux * off };
  const H = { x: S.x + ux * dd, y: S.y + uy * dd };
  return [S, E, H];
};

/** The pose with its far hand moved from where the pose put it toward `target`, `t` 0..1 (eased by the caller). */
export const withReach = (g: FigurePose, target: P, t: number): FigurePose => {
  if (t <= 0) return g;
  const h0 = g.farArm[2];
  const lift = Math.sin(Math.PI * clamp01(t)) * g.p.H * 0.02; // the hand rises a little on its way
  const h = { x: h0.x + (target.x - h0.x) * t, y: h0.y + (target.y - h0.y) * t - lift };
  return { ...g, farArm: reachArm(g, h) };
};

/**
 * timelineWorld's AiFigure (solid), drawn from a precomputed pose, so a cut can change the pose (a reaching
 * arm) before drawing it. Same parts, tones and layer order as AiFigure. SVG, world px.
 */
export const PoseFigure: React.FC<{ k: number; g: FigurePose; toneT?: number; eyes?: boolean; wink?: number; opacity?: number }> = ({
  k,
  g,
  toneT = 1,
  eyes = true,
  wink = 0,
  opacity = 1,
}) => {
  const near = FIGURE_TONE(toneT);
  const far = FIGURE_TONE_FAR(toneT);
  const tieC = FIGURE_TONE_TIE(toneT);
  const { p } = g;
  const limb = (pts: P[], w: number, color: string) => (
    <path d={line(pts)} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
  );
  const legPts = (side: "near" | "far") => {
    const l = g.legs.find((q) => q.side === side)!;
    return [l.hip, l.knee, l.ankle];
  };
  const rectAt = (r: { x: number; y: number; w: number; h: number }, fill: string) => (
    <path d={squirclePath(r.w, r.h)} transform={`translate(${r.x.toFixed(2)} ${r.y.toFixed(2)})`} fill={fill} />
  );
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      {limb(g.farArm, p.armT, far)}
      {limb(legPts("far"), p.legT, far)}
      <ellipse cx={g.footFar.cx} cy={g.footFar.cy} rx={g.footFar.rx} ry={g.footFar.ry} fill={far} />
      {g.id.child > 0.004 ? <path d={poly(g.backpack)} fill={INK} opacity={g.id.child} /> : null}
      {limb(g.neck, p.neckW, near)}
      <path d={poly(g.torso)} fill={near} />
      <g transform={`translate(${g.mark.x.toFixed(3)} ${g.mark.y.toFixed(3)}) scale(${(g.mark.size / 24).toFixed(5)})`}>
        {eyes ? <circle cx={FACE_UNITS.x} cy={FACE_UNITS.y} r={FACE_UNITS.r} fill={near} /> : null}
        {HEAD_MARK.paths.map((d, i) => (
          <path key={i} d={d} fill={near} fillRule="evenodd" />
        ))}
      </g>
      {eyes ? (
        <>
          <path d={eyePath(g.eyes.back.x, g.eyes.back.y, g.eyes.r, 0)} fill={EYE_TONE} />
          <path d={eyePath(g.eyes.front.x, g.eyes.front.y, g.eyes.r, wink)} fill={EYE_TONE} />
        </>
      ) : null}
      {limb(legPts("near"), p.legT, near)}
      <ellipse cx={g.footNear.cx} cy={g.footNear.cy} rx={g.footNear.rx} ry={g.footNear.ry} fill={near} />
      {g.id.tie > 0.004 ? (
        <g opacity={g.id.tie}>
          <path d={poly(g.collar)} fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth={p.H * 0.004} />
          <path d={poly(g.tie)} fill={tieC} />
        </g>
      ) : null}
      {g.id.child > 0.004 ? (
        <path
          d={line(g.strap)}
          fill="none"
          stroke={INK}
          strokeWidth={p.H * 0.024}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={g.id.child}
        />
      ) : null}
      {limb(g.nearArm, p.armT, near)}
      {g.id.badge > 0.004 ? (
        <g opacity={g.id.badge}>
          {g.lanyards.map((l, i) => (
            <path key={i} d={line(l)} fill="none" stroke={INK} strokeWidth={p.H * 0.009} strokeLinecap="round" />
          ))}
          {rectAt(g.badge, INK)}
          {rectAt(g.badgeSlot, far)}
          {rectAt(g.badgePhoto, far)}
        </g>
      ) : null}
      {g.strawL > 0.3 ? <path d={line(g.straw)} fill="none" stroke={INK} strokeWidth={p.H * 0.016} strokeLinecap="round" /> : null}
      <path d={poly(g.drinkBody)} fill={INK} strokeLinejoin="round" stroke={INK} strokeWidth={p.H * 0.004} />
      {g.lidH > 0.05 ? <path d={poly(g.lid)} fill={INK} stroke={INK} strokeWidth={p.H * 0.004} strokeLinejoin="round" /> : null}
    </g>
  );
};

// --- added after MILLENNIUM_READY (new names only; logged in notes/SHARED_CHANGES.md) --------------
/** grid-background.jpg's mean value (it is grey, R = G = B), measured off the file */
const FIELD_JPG_MEAN = 250.74;
/** The field's own mean tone: the grid jpg's mean at BG_DIM, the brightness GridBackground draws it at (the blur
 *  keeps the mean). A card filled with it looks like the outline on the field it always was, but hides whatever
 *  walks behind it. */
export const MILL_FIELD_TONE = (() => {
  const v = Math.round(FIELD_JPG_MEAN * BG_DIM);
  return `rgb(${v},${v},${v})`;
})();

/** A card's opaque flat fill (SVG, world px; (x, bottom) = the card's bottom centre), to its outline's centre line
 *  so it never shows outside the stroke. No shadow: the outline drawn over it keeps its own. */
export const CardFill: React.FC<{ x: number; bottom: number; w: number; h: number; fill?: string }> = ({
  x,
  bottom,
  w,
  h,
  fill = MILL_FIELD_TONE,
}) => <path d={squirclePath(w, h)} transform={`translate(${(x - w / 2).toFixed(3)} ${(bottom - h).toFixed(3)})`} fill={fill} />;

/** MillenniumCard over a CardFill: the same card, opaque, so a figure can pass BEHIND it. */
export const MillenniumCardFilled: React.FC<React.ComponentProps<typeof MillenniumCard> & { fill?: string }> = ({ fill, ...p }) => (
  <>
    <CardFill x={p.x} bottom={p.bottom} w={p.w} h={p.h} fill={fill} />
    <MillenniumCard {...p} />
  </>
);

/** The whole row, SVG part, filled (MillenniumCardFilled): draw it over a figure that walks behind the row,
 *  then MillenniumRowLabels over it. */
export const MillenniumRowFilled: React.FC<{ k: number; opacity?: number; fill?: string }> = ({ k, opacity, fill }) => (
  <>
    {ROW.map((c) => (
      <MillenniumCardFilled key={c.id} k={k} x={c.x} bottom={CARD_BOTTOM} w={CARD_W} h={CARD_H} state={c.state} opacity={opacity} fill={fill} />
    ))}
  </>
);

/** The row's BIG labels (cut 97's wide frame at k 0.77 needs >= 42 screen px: 56 world = 43 px there). Seven-letter
 *  names do not fit a 210 card at that size, so the long ones wrap at a syllable; BSD stays BSD (Birch and
 *  Swinnerton-Dyer is far too long). The glyph shrinks and the label rises so two big lines clear the padlock. */
export const ROW_LABEL_BIG = {
  size: 56,
  /** the first line's text-box top below the card's top */
  dy: 14,
  /** the padlock / check box for cards with big labels */
  glyph: 58,
  lines: {
    navier: ["NAVIER", "STOKES"], // "NAVIER–" overruns the card at 56
    poincare: ["POIN-", "CARÉ"],
    pnp: ["P VS", "NP"],
    hodge: ["HODGE"],
    riemann: ["RIE-", "MANN"],
    yangmills: ["YANG–", "MILLS"],
    bsd: ["BSD"],
  } as Record<string, string[]>,
  /** tracking for the big labels (Label's own is 0.04em; this keeps NAVIER– inside its card) */
  tracking: "0.01em",
};

/** MillenniumRowFilled with the smaller glyph that the big labels need. */
export const MillenniumRowFilledBig: React.FC<{ k: number; opacity?: number; fill?: string }> = ({ k, opacity, fill }) => (
  <>
    {ROW.map((c) => (
      <MillenniumCardFilled
        key={c.id}
        k={k}
        x={c.x}
        bottom={CARD_BOTTOM}
        w={CARD_W}
        h={CARD_H}
        state={c.state}
        opacity={opacity}
        fill={fill}
        glyph={ROW_LABEL_BIG.glyph}
      />
    ))}
  </>
);

/** The row's labels at ROW_LABEL_BIG (DOM; goes over MillenniumRowFilledBig). Same look as Label (font, weight,
 *  shadow, INK_HI), only bigger and a touch tighter. Every card's first line shares one baseline. */
export const MillenniumRowLabelsBig: React.FC<{ k: number; opacity?: number }> = ({ k, opacity = INK_HI }) => (
  <>
    {ROW.map((c) =>
      (ROW_LABEL_BIG.lines[c.id] ?? c.lines).map((t, i) => (
        <div
          key={`${c.id}${i}`}
          style={{
            position: "absolute",
            left: c.x - 600,
            top: CARD_TOP + ROW_LABEL_BIG.dy + i * ROW_LABEL_BIG.size * CARD_LINE_H,
            width: 1200,
            textAlign: "center",
            fontFamily: FONT_LABEL,
            fontWeight: LABEL_WEIGHT,
            fontSize: ROW_LABEL_BIG.size,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: ROW_LABEL_BIG.tracking,
            color: INK,
            opacity,
            whiteSpace: "nowrap",
            filter: iconShadow(k),
          }}
        >
          {t}
        </div>
      )),
    )}
  </>
);
