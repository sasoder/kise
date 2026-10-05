import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Bead,
  DOT_R,
  INK,
  INK_HI,
  INK_LO,
  INK_W,
  InkDiffuse,
  InkPath,
  Label,
  PAPER,
  RED,
  K_REF,
  Stage,
  subPathD,
  cumLen,
  easeOutCubic,
  enterU,
  lerp,
  paperShadow,
  pointAtLen,
  smoothstep,
  sz,
} from "./chinatalkShared";
import {
  CAM_REST,
  DASH_DIFF_F,
  DASH_DIFF_F0,
  DURATION,
  FPS,
  GROUND_F,
  GROUND_F0,
  GROUND_X0,
  GROUND_X1,
  GROUND_Y,
  DASH_W,
  HAND_W,
  LABEL_WORD_F,
  LABEL_Y,
  LINE_W,
  MID,
  PILLAR_W,
  PILLAR_X,
  PULL_DX,
  PULL_DY,
  baseY,
  camAt,
  dashDraw,
  dashPoints,
  fAtX,
  gripAt,
  handPos,
  linePoints,
  pillarRise,
  pullAt,
} from "./tooDifficultGeom";

// ---------------------------------------------------------------------------
// TooDifficultToShutDown — Logan Wright, "the biggest credit boom in history"
// (ChinaTalk), V2 cut 4 of 5. ChinaTalk style, 1080x1920, 24 fps, opaque.
//
// Line: "Growth was strong, it was dependent upon investment, and then it became
// too difficult for authorities to shut down."
// IN = S 794 ("growth"). "down" ends at S 948 -> 154 f + 28-frame tail = 182 f.
// Local word frames: growth 0 · strong 16-25 · dependent 39 · upon 47 ·
// investment 55-69 · and 69 · then 79 · became 86 · too 93 · difficult 99 ·
// for 110 · authorities 119-129 · to 129 · shut 136 · down 142-154.
//
// Idea: growth stands on credit-funded pillars; pulling one out would bring it
// down. RED = China's credit (the investment pillars), ink carries the rest.
// Geometry, clocks and camera live in tooDifficultGeom.ts.
//
// Gestures (gesture -> word -> local frames):
// 1. the growth line is written up-right in wet ink, bead tip, camera riding the
//    tip -> "growth was strong" -> f0-46 (velocity peaks f22; the tip never stops,
//    it inches up 0.62 px/f for the rest of the cut)
// 2. the ground hairline draws out from the centre, then five red pillars rise
//    from it and seat under the line, one wave left -> right (hashed offsets) ->
//    "dependent upon investment" -> ground f22-38, pillars f33-68; INVESTMENT lands
//    on "investment" f55; camera settles wide on line + colonnade f32-76
// 3. held breath: an even camera creep toward the middle pillar while the tip
//    inches -> "and then it became too difficult" -> f76-130
// 4. a slim ink hand (cuff, forearm off-frame left) reaches in to the middle
//    pillar -> "for authorities" -> f98-128; fingers close round it f123-136
// 5. the hand slides the pillar out (down-left); the line sags into the gap
//    (soft-min of the drop, ~34 px) and a dashed projection falls steeply ahead of
//    the tip -> "to shut down" -> pull f135-154, dashes f139-158; camera follows
//    the fall a touch f132-172
// 6. tail: the hand stops, then eases the pillar back in; the line lifts back
//    onto it; the dashed projection diffuses like ink -> (tail) -> stop f154-159,
//    back f159-179, diffusion f160-181. Last frame: hand on the pillar, line held.
// ---------------------------------------------------------------------------

export { DURATION, FPS };
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the colonnade -----------------------------------------------------------
const Pillar: React.FC<{ i: number; f: number; k: number }> = ({ i, f, k }) => {
  const rise = pillarRise(f, i);
  if (rise <= 0.001) return null;
  const x = PILLAR_X[i];
  const w = PILLAR_W;
  // seat: the pill's crown touches the underside of the RESTING line
  const top = baseY(x) + (LINE_W * sz(k)) / 2 - 1;
  const fullH = GROUND_Y - top;
  const h = fullH * rise;
  const p = i === MID ? pullAt(f) : 0;
  const dx = PULL_DX * p;
  const dy = PULL_DY * p;
  const r = Math.min(w / 2, h / 2);
  return (
    <rect
      x={(x - w / 2 + dx).toFixed(3)}
      y={(GROUND_Y - h + dy).toFixed(3)}
      width={w.toFixed(3)}
      height={h.toFixed(3)}
      rx={r.toFixed(3)}
      fill={RED}
    />
  );
};

const Ground: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const u = easeOutCubic((f - GROUND_F0) / GROUND_F);
  if (u <= 0.001) return null;
  const cx = (GROUND_X0 + GROUND_X1) / 2;
  const half = ((GROUND_X1 - GROUND_X0) / 2) * u;
  return (
    <InkPath
      points={[
        { x: cx - half, y: GROUND_Y },
        { x: cx + half, y: GROUND_Y },
      ]}
      k={k}
      rung={INK_LO}
      width={INK_W}
    />
  );
};

// --- the growth line ---------------------------------------------------------
const WET_LEN_G = 90;
const WET_DRY = 18;
const GrowthLine: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const pts = linePoints(f);
  if (pts.length < 2) return null;
  const cum = cumLen(pts);
  const L = cum[cum.length - 1];
  const w = LINE_W * sz(k);
  const ageAt = (s: number) => f - fAtX(pointAtLen(pts, cum, s).x);
  const segs: React.ReactNode[] = [];
  const step = WET_LEN_G / 14;
  for (let s0 = Math.max(0, L - WET_LEN_G); s0 < L - 0.05; s0 += step) {
    const s1 = Math.min(L, s0 + step);
    const mid = (s0 + s1) / 2;
    const wet = (1 - smoothstep(ageAt(mid) / WET_DRY)) * (1 - smoothstep((L - mid) / WET_LEN_G));
    if (wet < 0.02) continue;
    const a = pointAtLen(pts, cum, s0);
    const b = pointAtLen(pts, cum, s1);
    segs.push(
      <line
        key={s0.toFixed(1)}
        x1={a.x.toFixed(2)}
        y1={a.y.toFixed(2)}
        x2={b.x.toFixed(2)}
        y2={b.y.toFixed(2)}
        stroke={INK}
        strokeOpacity={(wet * (1 - INK_HI) + INK_HI).toFixed(4)}
        strokeWidth={(w * (1 + 0.15 * wet)).toFixed(3)}
        strokeLinecap="round"
      />,
    );
  }
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("");
  const tip = pts[pts.length - 1];
  const beadR = (DOT_R / 4.5) * (LINE_W / 2) * sz(k);
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeOpacity={INK_HI} strokeWidth={w.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
      {segs}
      <Bead id="tdsd-tip" x={tip.x} y={tip.y} r={beadR} color={INK} opacity={INK_HI} />
    </g>
  );
};

// --- the dashed projection ----------------------------------------------------
/** dashes for phone (director note): ~22 / 14 SCREEN px at K_REF, ~6 px wide,
 *  through the size law; they march toward the head. */
const PROJ_DASH = 22 / K_REF;
const PROJ_GAP = 14 / K_REF;
const PROJ_MARCH = 0.6;
const Projection: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const draw = dashDraw(f);
  if (draw <= 0.001) return null;
  const pts = dashPoints(f);
  const cum = cumLen(pts);
  const L = cum[cum.length - 1] * draw;
  const diff = (f - DASH_DIFF_F0) / DASH_DIFF_F;
  const c = pts[Math.floor(pts.length / 2)];
  const s = sz(k);
  return (
    <InkDiffuse u={diff} k={k} cx={c.x} cy={c.y}>
      <path
        d={subPathD(pts, cum, 0, L)}
        fill="none"
        stroke={INK}
        strokeOpacity={INK_HI}
        strokeWidth={(DASH_W * s).toFixed(3)}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${(PROJ_DASH * s).toFixed(3)} ${(PROJ_GAP * s).toFixed(3)}`}
        strokeDashoffset={(-PROJ_MARCH * f * s).toFixed(3)}
      />
    </InkDiffuse>
  );
};

// --- the hand ------------------------------------------------------------------
const FINGER_OPEN_Y = [-36, -12, 12, 36];
const FINGER_GRIP_Y = [-33, -11, 11, 33];
/** The hand's silhouette (local origin = the pillar's axis at the grip): back of
 *  the hand from the wrist, four knuckle bumps down its front that reach past
 *  the pillar while it reaches (open) and close round it (grip). One closed
 *  outline on Lucide's grammar (round joins), paper inside so it covers the red. */
const handOutline = (g: number) => {
  const fy = FINGER_OPEN_Y.map((y, i) => lerp(y, FINGER_GRIP_Y[i], g));
  const r = lerp(12, 11, g);
  const R = lerp(56, 30, g); // the bumps' outer apex x
  const c = R - r;
  const top = fy[0] - r;
  const bot = fy[3] + r;
  const parts = [`M-86 ${(-38).toFixed(2)}`, `Q-82 ${(top - 2).toFixed(2)} -58 ${(top - 1).toFixed(2)}`, `L${c.toFixed(2)} ${top.toFixed(2)}`];
  for (let i = 0; i < 4; i++) {
    const y0 = i === 0 ? top : (fy[i - 1] + fy[i]) / 2;
    const y1 = i === 3 ? bot : (fy[i] + fy[i + 1]) / 2;
    if (i === 0) parts.push(`L${c.toFixed(2)} ${y0.toFixed(2)}`);
    // a knuckle: a rounded bump from y0 to y1 bulging right to R
    parts.push(`C${(R + 0.2 * r).toFixed(2)} ${(y0 - 0.1 * r).toFixed(2)} ${(R + 0.2 * r).toFixed(2)} ${(y1 + 0.1 * r).toFixed(2)} ${c.toFixed(2)} ${y1.toFixed(2)}`);
  }
  parts.push(`L-52 ${bot.toFixed(2)}`, `Q-80 ${(bot + 1).toFixed(2)} -86 38`, "Z");
  const creases = [0, 1, 2].map((i) => {
    const y = (fy[i] + fy[i + 1]) / 2;
    return `M${(c - 16).toFixed(2)} ${y.toFixed(2)}L${(c - 2).toFixed(2)} ${y.toFixed(2)}`;
  });
  // the thumb lying across the index finger
  const thumb = `M-60 ${(fy[0] + 4).toFixed(2)}Q${(-34).toFixed(2)} ${(fy[0] + 12).toFixed(2)} ${(c - 18).toFixed(2)} ${(fy[0] + 2).toFixed(2)}`;
  return { body: parts.join(""), detail: creases.join("") + thumb };
};
/** A slim ink hand: forearm as two lines running off-frame left, a cuff, the
 *  hand closing round the middle pillar. */
const Hand: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  if (f < 95) return null;
  const pos = handPos(f);
  const g = gripAt(f);
  const sw = HAND_W * sz(k);
  const ink = { stroke: INK, strokeOpacity: INK_HI, strokeWidth: sw, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  const ARM = 1500;
  const AH = 30;
  const o = handOutline(g);
  return (
    <g transform={`translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)})`}>
      {/* forearm: paper core + two ink lines off-frame */}
      <rect x={-ARM} y={-AH} width={ARM - 108} height={2 * AH} fill={PAPER} />
      <line x1={-ARM} y1={-AH} x2={-110} y2={-AH} {...ink} />
      <line x1={-ARM} y1={AH} x2={-110} y2={AH} {...ink} />
      <path d={o.body} fill={PAPER} {...ink} />
      <path d={o.detail} fill="none" {...ink} />
      {/* cuff */}
      <rect x={-112} y={-41} width={24} height={82} rx={5} fill={PAPER} {...ink} />
    </g>
  );
};

const TooDifficultToShutDown: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  return (
    <Stage S={f} cam={cam} rest={CAM_REST}>
      <Ground f={f} k={k} />
      <g style={{ filter: paperShadow(k) }}>
        {PILLAR_X.map((_, i) => (
          <Pillar key={i} i={i} f={f} k={k} />
        ))}
      </g>
      <GrowthLine f={f} k={k} />
      <Projection f={f} k={k} />
      <Label text="Investment" x={(GROUND_X0 + GROUND_X1) / 2} y={LABEL_Y} k={k} size="word" appear={enterU(f, LABEL_WORD_F)} minPx={44} />
      <Hand f={f} k={k} />
    </Stage>
  );
};

export default TooDifficultToShutDown;
