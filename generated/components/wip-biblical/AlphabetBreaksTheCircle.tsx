// ---------------------------------------------------------------------------
// AlphabetBreaksTheCircle (wip-biblical, cut 23). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx). The tribe lives in ./tribeShared.tsx (cut 16's world).
// Opaque 1080x1920, 24 fps, 138 frames.
//
// CHECK LINE: "Writing broke up the circle: each person came out on his own, lined up one after another like letters."
// With no sound: the listening circle from cut 16 snaps open, and its people are lifted out one by one into a straight
// row, each under an alphabet letter.
//
// THE LINE: "The invention of the phonetic alphabet detached people from that collective structure and encouraged them
// to think sequentially."
// WORD -> FRAME: The 1 · invention 3 · of 7 · the 15 · phonetic 17 · alphabet 26 · detached 33 · people 44 · from 56 ·
// that 64 · collective 67 · structure 75 · and 83 · encouraged 92 · them 100 · to 107 · think 111 · sequentially 116;
// next sentence "The" 132.
// DURATION: the slot 23.708 -> 29.458 s = 5.750 s x 24 = 138 frames (f0..f137). Cut to the speaker at f138.
//
// THE MOTION: one change, circle -> line. It opens on cut 16's last frame (its camera, its grain sequence, its rings in
// flight; the voice has stopped). The real Phoenician stone slides down from the top over the storyteller as the camera
// eases back a little, while one straight indigo rule is ruled left to right above the circle; six letters (aleph, bet,
// gimel, dalet, he, waw) lift off its inscription in indigo and spread out both ways onto the rule, outermost first, so
// the rule reads aleph..waw left to right; the stone slides back out the top. On "detached" the red rim (and the rings still in it) snaps open at its front, the two ends spring apart and the
// halves slide off the left and right edges. On an even rhythm (every 7 frames from f42) the listeners are picked up
// (lift, shadow spreads, red tint drains) and set down in a straight row, each on its own spot under its letter, all one
// height, left to right in the order they sat; the storyteller dims and sinks out of the band before the middle spots
// fill. The last lands on "encouraged"; the camera, a little in and left of centre during the lifts, then tracks right
// along the row and settles with the whole row in frame; settled living frame to f137.
// Contact frames: the rim snaps on f33 (BREAK), first spring-apart frame f34; halves start sliding f35. Each glyph leaves
// the stone on its lift frame (GLYPH_LIFT) and touches the rule on lift + GLYPH_T. Each person leaves the page on its pick
// frame (PICK) and is down on pick + CARRY_T.
// SPOT INK: red = the bond of the tribe (rim and rings), broken and gone; indigo = the printed letters and their rule.
//
// SOURCES: people: cut 16's prints from "En Bretagne. Vieux conteur breton, auditoire attentif" (postcard no. 294, E.L.D.,
// 1910s, PD). The stone: marble cippus with a Phoenician inscription, Kition (Cyprus), ca. 362-312 BC, The Metropolitan
// Museum of Art 74.51.2294 (Cesnola Collection), CC0, animation_source/assets_raw/alphabet/
// Phoenician_MarbleCippusInscription_Kition_4thC-BC_Met74.51.2294_front.jpg (museum's painted number "I." retouched off,
// Apple Vision matte, one grade: scripts/clips/wip-biblical/bake-alphabet-23.py). Letters: Phoenician aleph..waw, outlines
// from Noto Sans Phoenician (SIL OFL), generated/components/wip-biblical/alphabetGlyphs.ts. The row runs left to right
// (the viewer's reading direction); real Phoenician was written right to left.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionBandsDebug,
  CutOut,
  INDIGO,
  InkPrint,
  PaperGround,
  RED,
  WipCam,
  WipFilmLife,
  WipPlane,
  paperEase,
  runWipCamera,
} from "../kits/works-in-progress/wipShared";
import { PHOENICIAN } from "./alphabetGlyphs";
import { GBS_LAST_CAM, GBS_LAST_FRAME, camAt as gbsCamAt } from "./GovernedBySound";
import {
  FLAT,
  LISTENERS,
  RIM_MERGE,
  RIM_RX,
  RIM_RY,
  STORYTELLER,
  STORYTELLER_BORDER,
  TRIBE_CX,
  TRIBE_CY,
  TRIBE_DRAW_ORDER,
  TribeFigure,
  VOICE_INK_BOX,
  VOICE_WEIGHT,
  VoiceInk,
  figureBox,
  listenerTint,
  ringCentre,
  voiceRings,
} from "./tribeShared";

export const FPS = 24;
export const DURATION = 138;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const smooth = (t: number) => {
  const u = Math.min(1, Math.max(0, t));
  return u * u * (3 - 2 * u);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Cut 16's frame numbers: this cut's f0 is its f88 (grain, rings). */
export const G0 = GBS_LAST_FRAME + 1;
/** The voice has stopped: no ring born after cut 16's last frame. */
const LAST_BIRTH = GBS_LAST_FRAME;

// -- the world, read from cut 16 -----------------------------------------------------------------------------------------
const K0 = GBS_LAST_CAM.k;
/** The tribe's top (tallest print's top) and the rim's front, world px. */
const TRIBE_TOP = Math.min(...TRIBE_DRAW_ORDER.map((f) => f.feetY - f.h));
const RIM_FRONT = TRIBE_CY + RIM_RY;

// The layout is designed in screen px at the settled camera (K_END), then carried into world px.
/** Screen px: the letters' height, the rule (y), the row's print height and feet (y), the row's span (x). */
const S_GLYPH_H = 72;
const S_RULE_Y = 356;
const S_ROW_FEET = 646;
const S_ROW_L = 82;
const S_ROW_R = 998;
/** Screen px between neighbours in the row (edge to edge of the photos; the paper borders take ~10 of it). */
const S_ROW_GAP = 26;
/** The opening framing (f~24): letters' top and the rim's front on screen. The zoom that fits both, then the end zoom. */
const S_MID_TOP = 150;
const S_MID_FRONT = 742;
/** The rule, world px: just above the tallest print of the circle, so the letters print on bare paper. */
const RULE_GAP_W = 24 / K0;
export const RULE_Y = TRIBE_TOP - RULE_GAP_W;
const LETTERS_TOP_W = (y: number, k: number) => y - (8 + S_GLYPH_H) / k;
export const K_MID = Math.min(K0, (S_MID_FRONT - S_MID_TOP) / (RIM_FRONT - LETTERS_TOP_W(RULE_Y, K0)));
export const K_END = K_MID;
/** World height of the letters and the row's prints. */
const GLYPH_H = S_GLYPH_H / K_END;

// -- the camera -----------------------------------------------------------------------------------------------------------
// End: the rule at S_RULE_Y, centred on the tribe's centre line. Mid: letters' top at S_MID_TOP. During the lifts the
// camera sits a little in and left (the row fills from the left), then tracks right as the last one lands.
const camY = (worldY: number, screenY: number, k: number) => worldY - (screenY - 960) / k;
const LETTERS_TOP = RULE_Y - (8 + S_GLYPH_H) / K_END;
const MID = { x: TRIBE_CX, y: camY(LETTERS_TOP, S_MID_TOP, K_MID), k: K_MID };
export const END = { x: TRIBE_CX, y: camY(RULE_Y, S_RULE_Y, K_END), k: K_END };
const LIFTS = { x: TRIBE_CX - 34 / K_END, y: lerp(MID.y, END.y, 0.55), k: K_END * 1.045 };
const myCam = runWipCamera(
  [
    { f: -24, x: GBS_LAST_CAM.x, y: GBS_LAST_CAM.y, k: K0 },
    { f: 0, x: GBS_LAST_CAM.x, y: GBS_LAST_CAM.y, k: K0, ease: "linear" },
    { f: 16, x: MID.x, y: MID.y, k: MID.k },
    { f: 52, x: LIFTS.x, y: LIFTS.y, k: LIFTS.k },
    { f: 104, x: END.x, y: END.y, k: END.k },
    { f: 200, x: END.x, y: END.y - 6 / K_END, k: END.k * 1.012, ease: "linear" },
  ],
  DURATION,
);
/** Cut 16's camera carries on into this one (its creep), handing over to this cut's track by f14. */
const BLEND = 14;
export const camAt = (frame: number): WipCam => {
  const b = myCam(frame);
  const w = smooth(frame / BLEND);
  if (w >= 1) return { x: b.x, y: b.y, k: b.k, x0: 540, y0: 960 };
  const a = gbsCamAt(G0 + frame);
  return {
    x: lerp(a.x, b.x, w),
    y: lerp(a.y, b.y, w),
    k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), w)),
    x0: 540,
    y0: 960,
  };
};
const toScreen = (cam: WipCam, x: number, y: number) => ({ x: 540 + (x - cam.x) * cam.k, y: 960 + (y - cam.y) * cam.k });
const toWorldX = (cam: { x: number; k: number }, sx: number) => cam.x + (sx - 540) / cam.k;

// -- the row ----------------------------------------------------------------------------------------------------------
/** Picked left to right in the order they sit round the circle (by x), so each lands near where it sat. */
const ORDER = [...LISTENERS].sort((a, b) => a.x - b.x);
const ROW_L = toWorldX(END, S_ROW_L);
const ROW_R = toWorldX(END, S_ROW_R);
const ROW_FEET = END.y + (S_ROW_FEET - 960) / K_END;
/** One height for every print in the row (world px): the widest that fits the span with the gaps. */
const ROW_GAP = S_ROW_GAP / K_END;
export const ROW_H = (ROW_R - ROW_L - ROW_GAP * (ORDER.length - 1)) / ORDER.reduce((s, f) => s + f.aspect, 0);
const rowW = ORDER.map((f) => ROW_H * f.aspect);
export const SPOTS = ORDER.map((f, i) => {
  const left = ROW_L + rowW.slice(0, i).reduce((s, v) => s + v + ROW_GAP, 0);
  return { f, left, w: rowW[i], cx: left + rowW[i] / 2, top: ROW_FEET - ROW_H, h: ROW_H };
});
/** Pick frames (an even rhythm from "people") and the carry. */
export const PICK0 = 42;
export const PICK_EVERY = 7;
export const CARRY_T = 18;
export const pickOf = (i: number) => PICK0 + i * PICK_EVERY;

/** Where listener i's print is on `frame`: centre, width, lift 0..1, carry progress u (0 in the circle, 1 in the row). */
export const listenerAt = (i: number, frame: number) => {
  const s = SPOTS[i];
  const b = figureBox(s.f);
  const c0 = { x: b.left + b.w / 2, y: b.top + b.h / 2, w: b.w };
  const c1 = { x: s.cx, y: s.top + s.h / 2, w: s.w };
  const u = interpolate(frame, [pickOf(i), pickOf(i) + CARRY_T], [0, 1], clamp);
  // sideways first (lifted over the circle), then down into its spot from above: it never slides across a seated print
  const ex = interpolate(u, [0, 0.82], [0, 1], { ...clamp, easing: paperEase });
  const ey = interpolate(u, [0.12, 1], [0, 1], { ...clamp, easing: paperEase });
  const ew = interpolate(u, [0, 0.9], [0, 1], { ...clamp, easing: paperEase });
  const lift = smooth(u / 0.22) * (1 - smooth((u - 0.72) / 0.28));
  const grow = 1 + 0.035 * lift; // nearer the camera while carried
  return { x: lerp(c0.x, c1.x, ex), y: lerp(c0.y, c1.y, ey), w: lerp(c0.w, c1.w, ew) * grow, lift, u };
};

// -- the storyteller: dimmed once the rim breaks, then sinks out of the band before the middle spots fill ---------------
export const ST_DIM = 0.42;
export const ST_SINK0 = 46;
export const ST_SINK_T = 34;
const stBox = figureBox(STORYTELLER);
const ST_SINK_D = END.y + 960 / K_END - stBox.top + 30 / K_END;
export const storytellerAt = (frame: number) => {
  const dim = interpolate(frame, [BREAK_F + 2, BREAK_F + 14], [1, ST_DIM], { ...clamp, easing: paperEase });
  const t = interpolate(frame, [ST_SINK0, ST_SINK0 + ST_SINK_T], [0, 1], clamp);
  const dy = ST_SINK_D * t * t * (1.6 - 0.6 * t); // eases in, leaves the frame still moving
  return { dim, dy };
};

// -- the rim snaps -----------------------------------------------------------------------------------------------------
export const BREAK_F = 33;
const SLIDE0 = 35;
const SLIDE_T = 22;
/** The rings in flight when it snaps, held where they were (the voice is gone): centre, radii, weight. */
const RINGS_AT_BREAK = voiceRings(G0 + BREAK_F, LAST_BIRTH).map((r) => {
  const c = ringCentre(r.s);
  return { cx: c.x, cy: c.y, rx: r.s, ry: r.s * FLAT, w: VOICE_WEIGHT * Math.min(1, (RIM_RX - r.s) / RIM_MERGE) };
});
const ELLIPSES = [...RINGS_AT_BREAK, { cx: TRIBE_CX, cy: TRIBE_CY, rx: RIM_RX, ry: RIM_RY, w: VOICE_WEIGHT }];
/** The ends spring apart (deg each side of the front), damped. */
const springGap = (frame: number) => {
  const t = frame - BREAK_F;
  if (t <= 0) return 0;
  return 5.5 * (1 - Math.exp(-t / 2.2) * Math.cos(t * 0.95));
};
/** Half ellipse as a path, from angle a0 to a1 (deg, 0 right, 90 front), sampled. */
const halfPath = (e: { cx: number; cy: number; rx: number; ry: number }, a0: number, a1: number) => {
  const n = 72;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    pts.push(`${(e.cx + e.rx * Math.cos(a)).toFixed(3)} ${(e.cy + e.ry * Math.sin(a)).toFixed(3)}`);
  }
  return `M${pts.join("L")}`;
};
const SLIDE_D = 600 / K_END + RIM_RX * 0.1;
const BrokenRim: React.FC<{ frame: number }> = ({ frame }) => {
  const g = springGap(frame);
  const t = interpolate(frame, [SLIDE0, SLIDE0 + SLIDE_T], [0, 1], clamp);
  const dx = SLIDE_D * t * t * (1.5 - 0.5 * t);
  const box = VOICE_INK_BOX;
  // the back is where the two halves part second (behind the storyteller's print)
  const halves = [
    { side: -1, a0: 90 + g, a1: 270 },
    { side: 1, a0: -90, a1: 90 - g },
  ];
  return (
    <>
      {halves.map(({ side, a0, a1 }) => (
        <InkPrint key={side} x={box.x + side * dx} y={box.y} w={box.w} h={box.h} ink={RED} seed={box.seed} rough={1.1} wear={0.15} misregister={1.1}>
          <svg width={box.w} height={box.h} viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {ELLIPSES.map((e, i) => (
              <path key={i} d={halfPath(e, a0, a1)} fill="none" stroke="currentColor" strokeWidth={e.w} strokeLinecap="round" />
            ))}
          </svg>
        </InkPrint>
      ))}
    </>
  );
};

// -- the stone and the letters ----------------------------------------------------------------------------------------
const CIP_ASPECT = 0.6108; // public/wip-biblical/ab_cippus.png, 733 x 1200
const CIP_W = 236 / K_END;
const CIP_H = CIP_W / CIP_ASPECT;
/** The stone rests over the storyteller, its top just under the rule. */
const CIP_X = STORYTELLER.x;
const CIP_Y = RULE_Y + 16 / K_END + CIP_H / 2;
const CIP_IN = { f0: 0, t: 16 };
const CIP_OUT = { f0: 28, t: 16 };
// fully above the frame at f0 coming in, and at the end of its exit going out
const CIP_FROM = -(CIP_Y + CIP_H / 2 - (GBS_LAST_CAM.y - 960 / K0)) - 40 / K_END;
const camOut = myCam(CIP_OUT.f0 + CIP_OUT.t);
const CIP_TO = -(CIP_Y + CIP_H / 2 - (camOut.y - 960 / camOut.k)) - 40 / K_END;
export const cippusAt = (frame: number) => {
  const tin = interpolate(frame, [CIP_IN.f0, CIP_IN.f0 + CIP_IN.t], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0.3, 0.2, 1) });
  const tout = interpolate(frame, [CIP_OUT.f0, CIP_OUT.f0 + CIP_OUT.t], [0, 1], { ...clamp, easing: Easing.bezier(0.55, 0, 0.8, 0.4) });
  const lift = interpolate(frame, [CIP_IN.f0 + CIP_IN.t - 4, CIP_IN.f0 + CIP_IN.t + 1, CIP_OUT.f0, CIP_OUT.f0 + 4], [0.6, 0, 0, 0.6], clamp);
  return { x: CIP_X, y: CIP_Y + CIP_FROM * (1 - tin) + CIP_TO * tout, lift, on: frame <= CIP_OUT.f0 + CIP_OUT.t + 2 };
};
/** Where each letter leaves the inscription (fractions of the stone print, on real letters of lines 3-5). */
const GLYPH_FROM: [number, number][] = [
  [0.2, 0.51],
  [0.3, 0.41],
  [0.4, 0.51],
  [0.5, 0.41],
  [0.6, 0.51],
  [0.7, 0.41],
];
/** The letters' size on the stone (an engraved letter) as a fraction of their size on the rule. */
const GLYPH_S0 = (0.05 * CIP_H) / GLYPH_H;
export const GLYPH_LIFT0 = 10;
export const GLYPH_EVERY = 2.6;
/** Lift order: the letters spread out from the stone both ways, the outermost on each side first (aleph and waw, then bet
 *  and he, then gimel and dalet), so no letter ever overtakes another; the row itself reads aleph..waw left to right. */
const GLYPH_RANK = PHOENICIAN.map((_, i) => {
  const side = SPOTS.filter((s, j) => Math.sign(s.cx - CIP_X) === Math.sign(SPOTS[i].cx - CIP_X) && Math.abs(s.cx - CIP_X) > Math.abs(SPOTS[i].cx - CIP_X) && j !== i);
  return side.length;
});
/** Flight time: a base plus the distance at one speed, so a later letter going farther never overtakes an earlier one. */
const GLYPH_T0 = 2;
const GLYPH_SPEED = 31; // screen px a frame, flight average beyond the base
const glyphLift = (i: number) => GLYPH_LIFT0 + GLYPH_RANK[i] * GLYPH_EVERY;
const glyphT = (i: number) => {
  const c = cippusAt(glyphLift(i));
  const [fx, fy] = GLYPH_FROM[i];
  const dx = SPOTS[i].cx - (c.x + (fx - 0.5) * CIP_W);
  const dy = RULE_Y - 8 / K_END - GLYPH_H / 2 - (c.y + (fy - 0.5) * CIP_H);
  return GLYPH_T0 + (Math.hypot(dx, dy) * K_END) / GLYPH_SPEED;
};
export const GLYPH_T = PHOENICIAN.map((_, i) => glyphT(i));
const GSCALE = GLYPH_H / 737; // font units -> world px (cap height of these glyphs ~ 737 units)
/** Letter i on `frame`: centre (x, y), scale (1 on the rule), progress u, landed. */
export const glyphAt = (i: number, frame: number) => {
  const c = cippusAt(Math.min(frame, glyphLift(i)));
  const [fx, fy] = GLYPH_FROM[i];
  const p0 = { x: c.x + (fx - 0.5) * CIP_W, y: c.y + (fy - 0.5) * CIP_H };
  const p1 = { x: SPOTS[i].cx, y: RULE_Y - 8 / K_END - GLYPH_H / 2 };
  const u = interpolate(frame, [glyphLift(i), glyphLift(i) + GLYPH_T[i]], [0, 1], clamp);
  const ex = interpolate(u, [0, 1], [0, 1], { ...clamp, easing: paperEase });
  const ey = interpolate(u, [0, 0.55], [0, 1], { ...clamp, easing: Easing.bezier(0.3, 0, 0.3, 1) });
  const s = lerp(GLYPH_S0, 1, interpolate(u, [0, 0.7], [0, 1], { ...clamp, easing: paperEase }));
  return { x: lerp(p0.x, p1.x, ex), y: lerp(p0.y, p1.y, ey), s, u, lifted: frame >= glyphLift(i), landed: u >= 1 };
};
/** The rule is ruled left to right (reading direction) across the band while the stone comes in, ahead of the letters. */
const RULE_PAD = 4 / K_END;
export const RULE_IN = { f0: 3, t: 17 };
const ruleAt = (frame: number) => {
  const l = ROW_L - RULE_PAD;
  const r = lerp(l, ROW_R + RULE_PAD, interpolate(frame, [RULE_IN.f0, RULE_IN.f0 + RULE_IN.t], [0, 1], { ...clamp, easing: paperEase }));
  return { l, r, on: frame > RULE_IN.f0 };
};
const RULE_W = 3.6 / K_END;

const Glyph: React.FC<{ i: number; x: number; y: number; s: number }> = ({ i, x, y, s }) => {
  const gl = PHOENICIAN[i];
  const [x0, y0, x1, y1] = gl.bounds;
  const pad = 30;
  const w = (x1 - x0 + 2 * pad) * GSCALE;
  const h = (y1 - y0 + 2 * pad) * GSCALE;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `scale(${s})`, transformOrigin: "50% 50%" }}>
      <InkPrint w={w} h={h} ink={INDIGO} seed={`ab-glyph-${i}`} rough={1} wear={0.2} misregister={1}>
        <svg width={w} height={h} viewBox={`${x0 - pad} ${-(y1 + pad)} ${x1 - x0 + 2 * pad} ${y1 - y0 + 2 * pad}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <path d={gl.d} transform="scale(1 -1)" fill="currentColor" />
        </svg>
      </InkPrint>
    </div>
  );
};

const Rule: React.FC<{ frame: number }> = ({ frame }) => {
  const r = ruleAt(frame);
  if (!r.on || r.r - r.l < 1) return null;
  const pad = 12;
  return (
    <InkPrint x={r.l - pad} y={RULE_Y - RULE_W / 2 - pad} w={r.r - r.l + 2 * pad} h={RULE_W + 2 * pad} ink={INDIGO} seed="ab-rule" rough={0.8} wear={0.05} misregister={0.8}>
      <div style={{ position: "absolute", left: pad, top: pad, width: r.r - r.l, height: RULE_W, background: "currentColor", borderRadius: RULE_W / 2 }} />
    </InkPrint>
  );
};

// -- a print on the page (cut 16's Person, plus lift, dim and a free box) -------------------------------------------------
const Print: React.FC<{ f: TribeFigure; x: number; y: number; w: number; lift?: number; tint?: number; dim?: number; border?: number }> = ({
  f,
  x,
  y,
  w,
  lift = 0,
  tint = 0,
  dim = 1,
  border = 5,
}) => {
  const h = w / f.aspect;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, opacity: dim }}>
      <CutOut src={f.src} x={x} y={y} w={w} aspect={f.aspect} flipX={f.flipX} border={border} lift={lift} seed={f.name} />
      {tint > 0.002 ? (
        <Img
          src={staticFile(f.sil)}
          style={{
            position: "absolute",
            left: x - w / 2,
            top: y - h / 2,
            width: w,
            height: h,
            maxWidth: "none",
            opacity: tint,
            mixBlendMode: "multiply",
            transform: f.flipX ? "scaleX(-1)" : undefined,
          }}
        />
      ) : null}
    </div>
  );
};

const AlphabetBreaksTheCircle: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const g = G0 + frame;
  // the red tint on the listeners: cut 16's rings until the snap, then it drains with the bond
  const tintFrame = Math.min(g, G0 + BREAK_F);
  const tintDrain = interpolate(frame, [BREAK_F, BREAK_F + 14], [1, 0], clamp);
  const st = storytellerAt(frame);
  const cip = cippusAt(frame);
  const people = SPOTS.map((s, i) => ({ i, s, at: listenerAt(i, frame) }));
  const glyphs = PHOENICIAN.map((_, i) => ({ i, at: glyphAt(i, frame) }));
  const order = TRIBE_DRAW_ORDER.map((f) => f.name);
  return (
    <>
      <WipFilmLife frame={g}>
        <PaperGround cam={cam} />
        {/* ink on the page: the voice (then its broken rim), the rule and the letters that have landed */}
        <WipPlane cam={cam} ink>
          {frame < BREAK_F ? <VoiceInk frame={g} lastBirth={LAST_BIRTH} /> : frame < SLIDE0 + SLIDE_T + 1 ? <BrokenRim frame={frame} /> : null}
          <Rule frame={frame} />
          {glyphs.filter((q) => q.at.landed).map((q) => <Glyph key={q.i} i={q.i} x={q.at.x} y={q.at.y} s={q.at.s} />)}
        </WipPlane>
        {/* the prints lying on the page: the circle (far to near), the storyteller, then the row */}
        <WipPlane cam={cam}>
          {order.map((name) => {
            if (name === STORYTELLER.name) {
              return (
                <Print
                  key={name}
                  f={STORYTELLER}
                  x={stBox.left + stBox.w / 2}
                  y={stBox.top + stBox.h / 2 + st.dy}
                  w={stBox.w}
                  dim={st.dim}
                  border={STORYTELLER_BORDER}
                />
              );
            }
            const p = people.find((q) => q.s.f.name === name)!;
            if (p.at.u > 0) return null;
            return (
              <Print key={name} f={p.s.f} x={p.at.x} y={p.at.y} w={p.at.w} tint={listenerTint(p.s.f, tintFrame, LAST_BIRTH) * tintDrain} />
            );
          })}
          {people.filter((p) => p.at.u >= 1).map((p) => <Print key={p.s.f.name} f={p.s.f} x={p.at.x} y={p.at.y} w={p.at.w} />)}
        </WipPlane>
        {/* the stone, lying over the storyteller while the letters leave it */}
        {cip.on ? (
          <WipPlane cam={cam}>
            <CutOut src="wip-biblical/ab_cippus.png" x={cip.x} y={cip.y} w={CIP_W} aspect={CIP_ASPECT} lift={cip.lift} seed="ab-cippus" />
          </WipPlane>
        ) : null}
        {/* letters in flight, printed over the stone and the page */}
        <WipPlane cam={cam} ink>
          {glyphs.filter((q) => q.at.lifted && !q.at.landed).map((q) => <Glyph key={q.i} i={q.i} x={q.at.x} y={q.at.y} s={q.at.s} />)}
        </WipPlane>
        {/* people being carried: above everything */}
        <WipPlane cam={cam}>
          {people
            .filter((p) => p.at.u > 0 && p.at.u < 1)
            .map((p) => (
              <Print key={p.s.f.name} f={p.s.f} x={p.at.x} y={p.at.y} w={p.at.w} lift={p.at.lift} tint={listenerTint(p.s.f, tintFrame, LAST_BIRTH) * tintDrain * (1 - p.at.u)} />
            ))}
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

/** For the collision checks: every box on the page (world px) and the camera, on `frame`. */
export const layoutAt = (frame: number) => {
  const cam = camAt(frame);
  const people = SPOTS.map((s, i) => {
    const at = listenerAt(i, frame);
    const h = at.w / s.f.aspect;
    return { name: s.f.name, l: at.x - at.w / 2, t: at.y - h / 2, r: at.x + at.w / 2, b: at.y + h / 2, u: at.u };
  });
  const st = storytellerAt(frame);
  return {
    cam,
    people,
    storyteller: { l: stBox.left, r: stBox.left + stBox.w, t: stBox.top + st.dy, b: stBox.top + stBox.h + st.dy },
    toScreen: (x: number, y: number) => toScreen(cam, x, y),
  };
};

export default AlphabetBreaksTheCircle;
