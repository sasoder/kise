// ---------------------------------------------------------------------------
// The tribe (wip-biblical). Owned by cut 16, GovernedBySound; cut 23 opens on its settled frame and breaks the rim,
// cut 54 echoes the layout with a model where the storyteller sits. Exports stay stable once reported in
// animation_source/notes/TRIBE_READY.md; later additions get NEW names and a line in SHARED_CHANGES.md.
//
// WORLD: plane d = 1 px. At the rest camera {x 540, y 960, k 1} world px = screen px (GovernedBySound settles at k ~1.6,
//   GBS_LAST_CAM).
// THE GROUND: the circle of the tribe is an ellipse on the page seen at one perspective, flattening FLAT = RIM_RY / RIM_RX.
//   A ground point at "ring radius" s and angle a (0 = right, 90 deg = towards the viewer) sits at
//   (TRIBE_CX + s cos a, TRIBE_CY + s FLAT sin a).
// THE VOICE: red ink rings leave the storyteller's mouth at VOICE_SPEED ring px a frame, one every VOICE_EVERY frames.
//   A ring is born at the mouth and descends to the ground as it widens (a cone of sound settling on the page), ground
//   level from s = VOICE_LAND. The ink lies on the page under every print, so a ring still in the air shows only where it
//   leaves his face (he faces left). The first ring stops at the rim (RIM_FORMED) and stays printed there as the boundary;
//   every later ring thins into it over its last RIM_MERGE ring px and ends there.
// THE PEOPLE (rev 3, cavemen): wood engravings from Louis Figuier, "Primitive Man" (1876; Emile Bayard; PD): the
//   storyteller (bearded, in skins, standing, facing left, his arm flung back) and six listeners of all ages, each a print hand-cut straight
//   across where the plate goes on behind a neighbour; each print's height is set per seat (SEATS) so faces read at phone size.
// LAYERS, bottom to top (TribeLayers draws them all): paper | ink plane: the rings and the rim, printed on the page |
//   the people, far to near (TRIBE_DRAW_ORDER), the storyteller among them by his feet's depth.
// ---------------------------------------------------------------------------
import React from "react";
import { Img, interpolate, staticFile } from "remotion";
import { CutOut, InkPrint, RED, WipCam, WipPlane } from "../kits/works-in-progress/wipShared";
// the figure table, from the baked cut-outs (scripts/clips/wip-biblical/bake-tribe.py writes it)
import { TRIBE_BAKE } from "./tribeBake";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// -- the ground circle -----------------------------------------------------------------------------------------------
export const TRIBE_CX = 540;
export const TRIBE_CY = 420;
/** The rim: the edge of the world his voice reaches, as printed once settled. */
export const RIM_RX = 281.25;
export const RIM_RY = 137.5;
export const FLAT = RIM_RY / RIM_RX;
/** The listeners' feet stand on this ring (ring px, i.e. its x radius). */
export const LISTEN_R = 225;
/** A ground point on the ellipse of ring radius s at angle `deg` (0 right, 90 towards the viewer). */
export const groundAt = (s: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: TRIBE_CX + s * Math.cos(a), y: TRIBE_CY + s * FLAT * Math.sin(a) };
};
/** The ring radius of a ground point (inverse of groundAt). */
export const ringRadiusOf = (x: number, y: number) => Math.hypot(x - TRIBE_CX, (y - TRIBE_CY) / FLAT);

// -- the people --------------------------------------------------------------------------------------------------------
/**
 * A print standing on the page. `src` under public/, `aspect` = w / h of the PNG, `sil` its flat red silhouette (the ink's
 * tint), (x, feetY) = the middle of its cut bottom on the ground, `h` world px tall. `row`: behind or in front of the
 * ground's centre line.
 */
export type TribeFigure = {
  name: string;
  src: string;
  sil: string;
  aspect: number;
  x: number;
  feetY: number;
  h: number;
  flipX: boolean;
  row: "back" | "front";
  /** baked: fraction of the PNG's height where the figure touches the ground (1 = the bottom edge) */
  footF: number;
};

const st = TRIBE_BAKE.storyteller;
/** Where his mouth is (world px): fixed since rev 2, because GovernedBySound's camera is framed on it (its opening, and
 * GBS_LAST_CAM, which cut 23 opens on). A new print is fitted to this point, not the other way round. */
const MOUTH_AT = { x: 496.58130024, y: 269.7172 };
const ST_FEET_Y = TRIBE_CY + 5;
/** The storyteller's print height (world px): standing in the middle, hair to the hand-cut bottom at his thighs (rev 3:
 * the height that puts his mouth on MOUTH_AT, about 190). */
export const STORYTELLER_H = (ST_FEET_Y - MOUTH_AT.y) / (1 - st.mouthFy);
/** World px per plate px of the storyteller's engraving (the listeners' heights are set per seat, not by this). */
export const TRIBE_SCALE = STORYTELLER_H / st.srcH;
const stW = STORYTELLER_H * st.aspect;
/** The storyteller: in the middle, his print's cut bottom at the ground's centre, facing left, his mouth on MOUTH_AT
 * (which puts his body, not his arm flung back, on the ground's centre). */
export const STORYTELLER: TribeFigure & { mouth: { x: number; y: number } } = {
  name: st.name,
  src: `wip-biblical/tr_${st.name}.png`,
  sil: `wip-biblical/tr_${st.name}_sil.png`,
  aspect: st.aspect,
  x: MOUTH_AT.x - (st.mouthFx - 0.5) * stW,
  feetY: ST_FEET_Y,
  h: STORYTELLER_H,
  flipX: false,
  row: "back",
  footF: 1,
  mouth: MOUTH_AT,
};

/** Depth on the ellipse: the back of the circle a little smaller, the front a little larger. */
export const depthFactor = (feetY: number) =>
  interpolate(feetY, [TRIBE_CY - LISTEN_R * FLAT, TRIBE_CY + LISTEN_R * FLAT], [0.9, 1.15], clamp);

/** Where each listener sits (angle on the LISTEN_R ring) so that each looks in towards him. */
// h = the print's world height, chosen per listener: the back three are busts, so their heads read at phone size (about
// 120 screen px at the settled zoom 1.6). He faces left: the space before his mouth (left and back-left) stays open for
// the voice; his arm goes back towards the woman behind his shoulder and ends in open paper, about 35 world px (58 screen
// px settled) short of her print.
const SEATS: { name: keyof typeof TRIBE_BAKE.listeners; deg: number; h: number }[] = [
  { name: "mother", deg: 140, h: 175 },
  { name: "carver", deg: 215, h: 130 },
  { name: "seated_woman", deg: 335, h: 145 },
  { name: "crouching_boy", deg: 50, h: 120 },
  { name: "reclining_man", deg: 20, h: 115 },
  { name: "child", deg: 82, h: 160 },
];

/** The listeners, far to near. */
export const LISTENERS: TribeFigure[] = SEATS.map(({ name, deg, h }) => {
  const b = TRIBE_BAKE.listeners[name];
  const p = groundAt(LISTEN_R, deg);
  return {
    name,
    src: `wip-biblical/tr_${name}.png`,
    sil: `wip-biblical/tr_${name}_sil.png`,
    aspect: b.aspect,
    x: p.x,
    feetY: p.y,
    h,
    flipX: false,
    row: (p.y < TRIBE_CY ? "back" : "front") as "back" | "front",
    footF: 1,
  };
}).sort((a, b) => a.feetY - b.feetY);

/** Everyone, far to near (by feet y): the order the prints are pasted. */
export const TRIBE_DRAW_ORDER: TribeFigure[] = [...LISTENERS, STORYTELLER].sort((a, b) => a.feetY - b.feetY);
/** Paper border round a print, world px. */
export const STORYTELLER_BORDER = 4;

/** The box of a figure's PNG in world px. */
export const figureBox = (f: TribeFigure) => {
  const ph = f.h / f.footF; // the PNG's full height
  const pw = ph * f.aspect;
  return { left: f.x - pw / 2, top: f.feetY - f.h, w: pw, h: ph };
};

// -- the voice ---------------------------------------------------------------------------------------------------------
/** Ring px a frame (constant: sound spreads at one speed). */
export const VOICE_SPEED = 3.65;
/** A new ring leaves the mouth every VOICE_EVERY frames. */
export const VOICE_EVERY = 20;
/** The first ring's birth frame (GovernedBySound's frames). It reaches the rim at VOICE_FIRST + RIM_RX / VOICE_SPEED. */
export const VOICE_FIRST = -29;
/** The frame the first ring reaches the rim and stays there. */
export const RIM_FORMED = VOICE_FIRST + RIM_RX / VOICE_SPEED;
/** Ring radius at which a ring has come down to the ground. */
export const VOICE_LAND = 150;
/** Ring px over which a ring arriving at the rim thins into it. */
export const RIM_MERGE = 17;
/** Ring line weight, world px. */
export const VOICE_WEIGHT = 2.6;

/** Ring radius of the ring born at `birth`, on `frame`; null before its birth or once it has met the rim. */
export const ringRadius = (frame: number, birth: number) => {
  const s = (frame - birth) * VOICE_SPEED;
  if (s <= 0 || s >= RIM_RX) return null;
  return s;
};
/** The ring's centre: at the mouth while it is small, on the ground's centre from VOICE_LAND. */
export const ringCentre = (s: number) => {
  const t = Math.min(1, s / VOICE_LAND);
  const e = t * t * (3 - 2 * t);
  return { x: STORYTELLER.mouth.x + (TRIBE_CX - STORYTELLER.mouth.x) * e, y: STORYTELLER.mouth.y + (TRIBE_CY - STORYTELLER.mouth.y) * e };
};
/**
 * Every ring alive on `frame`. `lastBirth`: no ring is born after this frame (cut 23: the voice has stopped). Rings born
 * before VOICE_FIRST never exist.
 */
export const voiceRings = (frame: number, lastBirth = Infinity) => {
  const out: { birth: number; s: number }[] = [];
  for (let b = VOICE_FIRST; b <= Math.min(frame, lastBirth); b += VOICE_EVERY) {
    const s = ringRadius(frame, b);
    if (s !== null) out.push({ birth: b, s });
  }
  return out;
};
/** 0..1: how much of the rim is printed (0 before the first ring arrives, 1 after). */
export const rimOn = (frame: number) => (frame >= RIM_FORMED ? 1 : 0);

// The ink box: every ring and the rim lie inside it (world px). Fixed, so the ink's tooth stays put on the paper.
const INK_X = TRIBE_CX - RIM_RX - 24;
const INK_Y = Math.min(STORYTELLER.mouth.y, TRIBE_CY - RIM_RY) - 24;
const INK_W = 2 * RIM_RX + 48;
const INK_H = TRIBE_CY + RIM_RY + 24 - INK_Y;

/** A whole ellipse as an SVG path. */
export const rimArc = (cx: number, cy: number, rx: number, ry: number) => arc(cx, cy, rx, ry);
function arc(cx: number, cy: number, rx: number, ry: number) {
  const L = `${(cx - rx).toFixed(3)} ${cy.toFixed(3)}`;
  const R = `${(cx + rx).toFixed(3)} ${cy.toFixed(3)}`;
  const A = `A${rx.toFixed(3)} ${ry.toFixed(3)} 0 0 1`;
  return `M${L} ${A} ${R} ${A} ${L}Z`;
}

/**
 * The voice in ink, on an `ink` WipPlane under all the people: every ring alive and the rim, printed on the page. A ring
 * still in the air passes behind the storyteller's print (his print lies over it), so from the front it leaves his mouth
 * and opens round him; landed, it lies on the ground under everyone's feet. `rim` 0..1 overrides rimOn (cut 23 breaks it:
 * pass rim={0} and draw the broken rim yourself with `rimArc`).
 */
export const VoiceInk: React.FC<{
  frame: number;
  lastBirth?: number;
  rim?: number;
  weight?: number;
}> = ({ frame, lastBirth, rim, weight = VOICE_WEIGHT }) => {
  // a ring thins into the rim over its last RIM_MERGE ring px, so it ends there without a thick double line; the first
  // ring keeps its weight, since it becomes the rim itself
  const paths = voiceRings(frame, lastBirth).map((r) => {
    const c = ringCentre(r.s);
    const w = r.birth === VOICE_FIRST ? weight : weight * Math.min(1, (RIM_RX - r.s) / RIM_MERGE);
    return { d: arc(c.x, c.y, r.s, r.s * FLAT), w };
  });
  if ((rim ?? rimOn(frame)) > 0) paths.push({ d: arc(TRIBE_CX, TRIBE_CY, RIM_RX, RIM_RY), w: weight });
  return (
    <InkPrint x={INK_X} y={INK_Y} w={INK_W} h={INK_H} ink={RED} seed="tribe-voice" rough={1.1} wear={0.15} misregister={1.1}>
      <svg width={INK_W} height={INK_H} viewBox={`${INK_X} ${INK_Y} ${INK_W} ${INK_H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill="none" stroke="currentColor" strokeWidth={p.w} strokeLinecap="round" />
        ))}
      </svg>
    </InkPrint>
  );
};
/** The ink box of the voice (world px): VoiceInk's InkPrint box, for a cut that prints its own rim in the same tooth. */
export const VOICE_INK_BOX = { x: INK_X, y: INK_Y, w: INK_W, h: INK_H, seed: "tribe-voice" } as const;

// -- the ink reaching a listener ---------------------------------------------------------------------------------------
/** Peak opacity of the red multiply on a listener's print while a ring passes under his feet, and what stays after. */
export const TINT_PEAK = 0.16;
export const TINT_REST = 0.04;
/** Rev 3: the strength of that red multiply on the engraved prints, as a factor on listenerTint (the engravings are mostly
 * white paper, so the full strength read as a pink cast; half reads as a faint red ink pass on the lights). */
export const TINT_ENGRAVING = 0.5;
const TINT_W = 17; // ring px either side of his feet over which the passing ring lights him
/** How much red ink lies on this listener's print on `frame`, derived from the rings passing his feet. */
export const listenerTint = (f: TribeFigure, frame: number, lastBirth?: number) => {
  const q = ringRadiusOf(f.x, f.feetY);
  let passing = 0;
  for (const r of voiceRings(frame, lastBirth)) {
    const d = (r.s - q) / TINT_W;
    passing = Math.max(passing, Math.exp(-d * d));
  }
  // reached at all yet? (the first ring has passed his feet)
  const firstS = (frame - VOICE_FIRST) * VOICE_SPEED;
  const reached = interpolate(firstS - q, [0, TINT_W * 1.2], [0, 1], clamp);
  return Math.max(TINT_REST * reached, TINT_PEAK * passing);
};

/** One person on the page: the graded cut-out with its paper border, plus the red ink's tint (0..1 opacity). */
export const Person: React.FC<{ f: TribeFigure; tint?: number; border?: number; seed?: string }> = ({ f, tint = 0, border = 5, seed }) => {
  const b = figureBox(f);
  return (
    <>
      <CutOut src={f.src} x={b.left + b.w / 2} y={b.top + b.h / 2} w={b.w} aspect={f.aspect} flipX={f.flipX} border={border} seed={seed ?? f.name} />
      {tint > 0.002 ? (
        <Img
          src={staticFile(f.sil)}
          style={{
            position: "absolute",
            left: b.left,
            top: b.top,
            width: b.w,
            height: b.h,
            maxWidth: "none",
            opacity: tint * TINT_ENGRAVING,
            mixBlendMode: "multiply",
            transform: f.flipX ? "scaleX(-1)" : undefined,
          }}
        />
      ) : null}
    </>
  );
};

/**
 * The whole tribe on `frame`: the voice's ink on the page, then the listeners far to near with the storyteller in his
 * place. Cuts that open on it pass their own camera and the global frame (GovernedBySound's frame numbers: cut 23's
 * f0 = 88 here). `storyteller` false leaves his place empty (cut 54 puts the model there); `voice` false draws no rings
 * or rim.
 */
export const TribeLayers: React.FC<{
  cam: WipCam;
  frame: number;
  lastBirth?: number;
  storyteller?: boolean;
  voice?: boolean;
  rim?: number;
}> = ({ cam, frame, lastBirth, storyteller = true, voice = true, rim }) => (
  <>
    {voice ? (
      <WipPlane cam={cam} ink>
        <VoiceInk frame={frame} lastBirth={lastBirth} rim={rim} />
      </WipPlane>
    ) : null}
    <WipPlane cam={cam}>
      {TRIBE_DRAW_ORDER.map((f) =>
        f.name === STORYTELLER.name ? (
          storyteller ? <Person key={f.name} f={f} border={STORYTELLER_BORDER} /> : null
        ) : (
          <Person key={f.name} f={f} tint={voice ? listenerTint(f, frame, lastBirth) : 0} />
        ),
      )}
    </WipPlane>
  </>
);
