import React from "react";
import { useCurrentFrame } from "remotion";
import { loadFont as loadSourceSans3 } from "@remotion/google-fonts/SourceSans3";
import { z } from "zod";
import {
  Bead,
  DashedPath,
  FONT_SERIF,
  FeatherWipe,
  INK,
  INK_BEAD_R,
  INK_HI,
  INK_LO,
  INK_W,
  Label,
  PAPER,
  type Pt,
  RED,
  RED_WET,
  Stage,
  WET_DRY_F,
  WetLine,
  clamp01,
  easeOutCubic,
  enterU,
  evenEase,
  mixHex,
  paperShadow,
  rungAt,
  smoothstep,
  sz,
} from "./chinatalkShared";
import {
  AXIS_X0,
  AXIS_Y,
  CARD_BOT,
  CARD_CX,
  CARD_CY,
  CARD_PX_H,
  CARD_PX_W,
  CARD_TOP,
  CARD_W,
  COLS,
  COL_DX,
  HULL_HH,
  HULL_HW,
  CONTEXT_F,
  DOCK_F,
  DURATION,
  FILE_F0,
  FPS,
  FRAME_F0,
  FRAME_F1,
  GHOST_F0,
  HEAD,
  K0,
  LINKS,
  MODEL_CX,
  MODEL_CY,
  MODEL_F0,
  MODEL_F1,
  MODEL_X0,
  MODEL_X1,
  MODEL_Y0,
  MODEL_Y1,
  NODE_R,
  NOW_F0,
  NOW_F1,
  N_SQUARES,
  PATH_F0,
  PATH_F1,
  PATH_X0,
  PATH_Y,
  PITCH,
  REST_CAM,
  ROW_DY,
  DETAIL_OUT_F0,
  DETAIL_OUT_F1,
  LABEL_DROP,
  SIMPLE_F0,
  SIMPLE_F1,
  SQ,
  SQ_R,
  STEM_F0,
  STEM_F1,
  TICK_STEP,
  TIP_F1,
  W,
  X_FIELD,
  X_NOW,
  bornF,
  camAt,
  fileQ,
  filePoint,
  ghostScale,
  ghostX,
  pathLen,
  tipReachF,
  tipX,
  trainU,
} from "./titanPreTrainGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// TitanPreTrain -- Bharat, "Synthetic data needs real data" (ChinaTalk), cut B.
// ONE master composition delivered as two files cut by frame range:
//   15_TitanProgram.mov   = f 0-19   (the news card)
//   16_PreTrainModels.mov = f 20-197 (the card becomes the future end of a time axis)
// The f 19 | 20 cut is two consecutive frames of one motion (the pull-back).
//
// LINE: "(... when I was supporting) the TITAN program. | So before we even
// fielded some of these capabilities, I'm like, hey, let's see if we could
// pre-train models, let's see if we could do some things."
// IN = S 371, DURATION 198 f exactly (S 371 -> 569), 24 fps, 1080x1920, opaque.
// Local word frames: TITAN 0-8 · program 8-14 · So ~10-20 · before 21-30 ·
// we 30 · even 37 · fielded 42-69 · some of these 69-81 · capabilities 81-91 ·
// I'm like hey 96-105 · let's 107 · see 111 · if we could 121-127 ·
// pre-train 127-139 · models 139-147 · let's see if we could 150-170 · do 172 ·
// some 180 · things 184-191.
//
// IDEA: time is an axis. The TITAN news card is the capability standing at the
// FUTURE end of it, on a dashed stem (dashed = it has not happened yet). We
// travel back along the axis to 2022, where a model is pre-trained on a file of
// red synthetic squares, and its dashed copy is sent forward to wait under the
// card. RED = synthetic data and nothing else. Element types besides the card:
// axis (+ ticks / stem), labels, lattice, red squares, the dashed path + ghost.
// Geometry, clocks and the camera live in titanPreTrainGeom.ts.
//
// GESTURES (gesture -> word -> local frames)
// 1. "TITAN program" (0-19): the card (a printed clipping, built natively: ink
//    rule + DEFENSE NEWS + date, the verbatim Defense News headline, deck) is
//    already in on f 0 at 92 % scale / opacity 0.9, sliding up its last 30 px
//    with a 4 px blur gone by f 5; the headline lines settle 2 f apart; a wet
//    ink underline is written under TITAN in the deck (f 0-8). A slow creep
//    (camera k x1.035) runs under everything.
// 2. "So before" (10-52): ONE pull-back (glide 10-52, k 3.03 -> 1.8) to the card
//    on its stem as one centred group (card ~520 px wide); the article text
//    diffuses out (20-26), then the simple face slides up + blurs in (26-38:
//    masthead rule, TITAN, its underline, text bars) while the time axis writes itself left -> right under it in wet ink
//    (tip f 28-46 across the visible frame; solid up to "now", dashed and marching beyond it), small
//    ticks standing up as the tip passes, reaching the card's foot on f 46.
// 3. "we even fielded" (43-84, camera holds with a slow creep 44-78): from the axis the dashed stem rises to the
//    card's foot (43-63), FIELDED lands under it (lands 46), and the dashed
//    frame runs round the card from its foot (56-84) while its shadow lightens:
//    the capability is still projected.
// 4. "some of these capabilities, I'm like, hey" (66-104): the camera glides
//    LEFT along the axis, back in time, and pulls out (glide 66-104, k 1.83 -> 0.995); card, stem
//    and FIELDED drop to ink 0.42 (76-88); the 2022 tick grows solid (84-94)
//    and "2022" lands on 96. Between 2022 and FIELDED: the empty dashed stretch
//    of axis, the "before".
// 5. "let's see if we could pre-train models" (90-147): the wet caret starts
//    writing red squares at the far left, high above the model (f 80 on; each square emerges under the
//    bead wet and dries over 18 f) and the file runs down and round into the
//    model's inputs; the lattice (3-4-3, ink 0.42) writes in left -> right in one
//    wipe (91-111); as each square reaches an input (first on ~118) the ink 0.90
//    front moves one step left -> right through the lattice: the model fills
//    because the data reaches it (full by ~149). PRE-TRAIN lands on 127.
// 6. "let's see if we could do some things" (142-197): the trained model sends
//    a dashed path forward (142-162) and its dashed ghost (a marching hull round
//    open nodes) peels off, rides the
//    path and docks on the stem under the card on "do" (150-174); as it docks
//    the card, stem and FIELDED come back to ink 0.90 (166-178). The camera
//    eases to the final wide (146-190). Through "some things" every dashed line
//    marches and the red file keeps trickling in slowly.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const SANS = loadSourceSans3("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily;

const WORD_MIN = 44;
const VALUE_MIN = 58;
/** dashes march faster than the house default so a hold visibly moves */
const MARCH = 2.6;
const lineD = (a: Pt, b: Pt) => `M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${b.x.toFixed(2)} ${b.y.toFixed(2)}`;

// --- the news card ----------------------------------------------------------------
const PAD = 56;
const HEAD_LINES = ["US Army awards $72", "million for new phase", "in next-gen ground", "system effort"];
const HEAD_PX = 66;
const HEAD_Y0 = 226;
const HEAD_LEAD = 72;
const RULE_Y = 492;
const DECK_PX = 36;
const DECK_Y0 = 562;
const DECK_LEAD = 50;
// deck line 2 is set in three runs so TITAN's box is known (for its underline)
const DECK2_A_W = 222; // "a prototype of"
const TITAN_X = PAD + DECK2_A_W + 9;
const TITAN_W = 97;

const NewsCard: React.FC<{ f: number; k: number; rung: number }> = ({ f, k, rung }) => {
  // entrance: already mostly in on f 0
  const e = easeOutCubic(f / 8);
  const scale = 0.92 + 0.08 * e;
  const slide = (30 / k) * (1 - e);
  const blur = 2.4 * (1 - clamp01(f / 5));
  const op = 0.9 + 0.1 * smoothstep(f / 4);
  // it simplifies as it shrinks
  // (no double exposure: the article text diffuses out first, then the simple face slides up + blurs in)
  const out = clamp01((f - DETAIL_OUT_F0) / (DETAIL_OUT_F1 - DETAIL_OUT_F0));
  const detailOp = 1 - smoothstep(out);
  const sa = clamp01((f - SIMPLE_F0) / (SIMPLE_F1 - SIMPLE_F0));
  const simpleOp = smoothstep(sa);
  const toLocal = K0 / (k * scale); // screen px -> card px
  const simpleLift = 24 * toLocal * (1 - easeOutCubic(sa));
  // projected: the shadow lightens, the face lets a little paper through
  const proj = smoothstep((f - FRAME_F0) / (FRAME_F1 - FRAME_F0));
  const shadowA = 0.2 - 0.14 * proj;
  const faceOp = 1 - 0.3 * proj;
  const ink = rung / INK_HI;
  // the wet underline under TITAN
  const ul = smoothstep((f + 1.5) / 9.5);
  const ulY = DECK_Y0 + DECK_LEAD + 10;
  const ulX = TITAN_X + TITAN_W * ul;
  const ulBead = 1 - smoothstep((f - 7) / 5);
  return (
    <g
      transform={`translate(${CARD_CX.toFixed(3)} ${(CARD_CY + slide).toFixed(3)}) scale(${(scale / K0).toFixed(6)}) translate(${-CARD_PX_W / 2} ${-CARD_PX_H / 2})`}
      opacity={op < 1 ? op.toFixed(4) : undefined}
      style={blur > 0.02 ? { filter: `blur(${blur.toFixed(2)}px)` } : undefined}
    >
      <g style={{ filter: `drop-shadow(0 10px 24px rgba(70,35,15,${shadowA.toFixed(3)}))` }}>
        <rect x={0} y={0} width={CARD_PX_W} height={CARD_PX_H} rx={4} fill="#FFFFFF" opacity={faceOp.toFixed(4)} />
      </g>
      {detailOp > 0.002 ? (
        <g opacity={(detailOp * ink).toFixed(4)} style={out > 0.01 ? { filter: `blur(${(8 * toLocal * easeOutCubic(out)).toFixed(2)}px)` } : undefined}>
          <rect x={PAD} y={98} width={48} height={8} fill={INK} opacity={INK_HI} />
          <text x={PAD + 66} y={112} fontFamily={SANS} fontWeight={700} fontSize={27} letterSpacing="0.1em" fill={INK} fillOpacity={INK_HI}>
            DEFENSE NEWS
          </text>
          <text x={CARD_PX_W - PAD} y={112} fontFamily={SANS} fontWeight={400} fontSize={27} textAnchor="end" fill={INK} fillOpacity={INK_LO}>
            Jun 28, 2022
          </text>
          {HEAD_LINES.map((line, i) => {
            const u = clamp01((f + 7 - 2 * i) / 9);
            return (
              <text
                key={i}
                x={PAD}
                y={HEAD_Y0 + i * HEAD_LEAD + 16 * (1 - easeOutCubic(u))}
                fontFamily={FONT_SERIF}
                fontWeight={700}
                fontSize={HEAD_PX}
                letterSpacing="-0.01em"
                fill={INK}
                fillOpacity={(INK_HI * (0.72 + 0.28 * smoothstep(u))).toFixed(4)}
              >
                {line}
              </text>
            );
          })}
          <rect x={PAD} y={RULE_Y} width={CARD_PX_W - 2 * PAD} height={1.5} fill={INK} opacity={0.2} />
          <g fontFamily={SANS} fontSize={DECK_PX} fill={INK}>
            <text x={PAD} y={DECK_Y0} fontWeight={400} fillOpacity={0.6}>
              Palantir and Raytheon will each build
            </text>
            <text x={PAD} y={DECK_Y0 + DECK_LEAD} fontWeight={400} fillOpacity={0.6} textLength={DECK2_A_W} lengthAdjust="spacing">
              a prototype of
            </text>
            <text x={TITAN_X} y={DECK_Y0 + DECK_LEAD} fontWeight={700} fillOpacity={INK_HI} textLength={TITAN_W} lengthAdjust="spacing">
              TITAN
            </text>
            <text x={TITAN_X + TITAN_W} y={DECK_Y0 + DECK_LEAD} fontWeight={400} fillOpacity={0.6}>
              , the Tactical Intelligence
            </text>
            <text x={PAD} y={DECK_Y0 + 2 * DECK_LEAD} fontWeight={400} fillOpacity={0.6}>
              Targeting Access Node.
            </text>
          </g>
          {/* the underline, written in wet ink */}
          <path d={`M${TITAN_X} ${ulY}L${ulX.toFixed(2)} ${ulY}`} stroke={INK} strokeOpacity={INK_HI} strokeWidth={4} strokeLinecap="round" fill="none" />
          {ulBead > 0.01 ? <circle cx={ulX.toFixed(2)} cy={ulY} r={4.6} fill={INK} opacity={ulBead.toFixed(4)} /> : null}
        </g>
      ) : null}
      {simpleOp > 0.002 ? (
        <g
          opacity={(simpleOp * ink).toFixed(4)}
          transform={`translate(0 ${simpleLift.toFixed(2)})`}
          style={sa < 0.99 ? { filter: `blur(${(6 * toLocal * (1 - easeOutCubic(sa))).toFixed(2)}px)` } : undefined}
        >
          <rect x={64} y={84} width={150} height={24} fill={INK} opacity={INK_HI} />
          <text
            x={58}
            y={400}
            fontFamily={FONT_SERIF}
            fontWeight={700}
            fontSize={216}
            fill={INK}
            fillOpacity={INK_HI}
            textLength={672}
            lengthAdjust="spacingAndGlyphs"
          >
            TITAN
          </text>
          <rect x={64} y={446} width={660} height={15} rx={7.5} fill={INK} opacity={INK_HI} />
          <rect x={64} y={540} width={752} height={24} rx={3} fill={INK} opacity={0.28} />
          <rect x={64} y={596} width={752} height={24} rx={3} fill={INK} opacity={0.28} />
          <rect x={64} y={652} width={440} height={24} rx={3} fill={INK} opacity={0.28} />
        </g>
      ) : null}
    </g>
  );
};

// --- the model lattice ----------------------------------------------------------------
/** The 3-4-3 lattice in solid ink (drawn opaque: the caller sets the group opacity). */
const Lattice: React.FC<{ w: number }> = ({ w }) => (
  <g>
    <path d={LINKS.map(([a, b]) => lineD(a, b)).join("")} stroke={INK} strokeWidth={w.toFixed(3)} strokeLinecap="round" fill="none" />
    {COLS.flat().map((n, i) => (
      <circle key={i} cx={n.x} cy={n.y} r={NODE_R} fill={INK} />
    ))}
  </g>
);

/** Its dashed ghost (the model as a hope): the lattice's outline as one dashed,
 *  marching hull with the ten nodes as open rings inside it. */
const HULL: Pt[] = (() => {
  const fx = HULL_HW / COL_DX;
  const fy = HULL_HH / (1.5 * ROW_DY);
  const o = (p: Pt): Pt => ({ x: MODEL_CX + (p.x - MODEL_CX) * fx, y: MODEL_CY + (p.y - MODEL_CY) * fy });
  return [COLS[1][0], COLS[2][0], COLS[2][2], COLS[1][3], COLS[0][2], COLS[0][0]].map(o);
})();
const HULL_D = HULL.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("") + "Z";
const GhostLattice: React.FC<{ f: number; x: number; scale: number; w: number; opacity: number }> = ({ f, x, scale, w, opacity }) => {
  if (opacity <= 0.002) return null;
  const sw = w / scale;
  return (
    <g
      transform={`translate(${x.toFixed(3)} ${PATH_Y}) scale(${scale.toFixed(5)}) translate(${-MODEL_CX} ${-MODEL_CY})`}
      opacity={opacity.toFixed(4)}
      stroke={INK}
      fill="none"
    >
      <path
        d={HULL_D}
        strokeWidth={sw.toFixed(3)}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={`${(16.5 / scale).toFixed(2)} ${(12.5 / scale).toFixed(2)}`}
        strokeDashoffset={((-f * 1.3) / scale).toFixed(2)}
      />
      <path
        d={LINKS.map(([a, b]) => lineD(a, b)).join("")}
        strokeWidth={(sw * 0.4).toFixed(3)}
        strokeOpacity={0.4}
        strokeLinecap="round"
        strokeDasharray={`${(7 / scale).toFixed(2)} ${(7 / scale).toFixed(2)}`}
      />
      {COLS.flat().map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={NODE_R * 0.8} fill={PAPER} strokeWidth={(sw * 0.6).toFixed(3)} />
      ))}
    </g>
  );
};

// --- the red file -----------------------------------------------------------------------
const RedFile: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const q = fileQ(f);
  if (f < FILE_F0 - 6) return null;
  const squares: React.ReactNode[] = [];
  for (let i = 0; i < N_SQUARES; i++) {
    const lead = q - i * PITCH; // the leading edge's distance past the head
    if (lead <= 0) break;
    const sc = lead - SQ / 2;
    const left = pathLen(i) - sc;
    if (left <= 0) continue;
    const g = smoothstep(left / 46); // taken up by its input node
    const p = filePoint(i, sc);
    const side = SQ * g;
    const wet = 1 - smoothstep((f - bornF(i)) / WET_DRY_F);
    squares.push(
      <rect
        key={i}
        x={(p.x - side / 2).toFixed(3)}
        y={(p.y - side / 2).toFixed(3)}
        width={side.toFixed(3)}
        height={side.toFixed(3)}
        rx={(SQ_R * g).toFixed(3)}
        fill={mixHex(RED, RED_WET, wet)}
        opacity={g < 1 ? smoothstep(g / 0.5).toFixed(4) : undefined}
      />,
    );
  }
  const caret = smoothstep((f - (FILE_F0 - 5)) / 6);
  return (
    <g>
      <defs>
        <clipPath id="tpt-head">
          <rect x={HEAD.x - 400} y={HEAD.y} width={1200} height={1200} />
        </clipPath>
      </defs>
      <g style={{ filter: paperShadow(k) }}>
        <g clipPath="url(#tpt-head)">{squares}</g>
      </g>
      <Bead id="tpt-caret" x={HEAD.x} y={HEAD.y} r={10 * sz(k)} color={RED_WET} opacity={caret} />
    </g>
  );
};

const TitanPreTrain: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const s = sz(k);
  const w = W * s;

  // rungs: the card, its stem and FIELDED are context while we are back in time
  const cardRung = f < DOCK_F ? rungAt(f, CONTEXT_F, INK_HI, INK_LO) : rungAt(f, DOCK_F, INK_LO, INK_HI);

  // the axis
  const tip = tipX(f);
  const solidLen = Math.min(tip, X_NOW) - AXIS_X0;
  const futDraw = clamp01((tip - X_NOW) / (X_FIELD - X_NOW));
  const tipBead = 1 - smoothstep((f - (TIP_F1 - 4)) / 6);
  const beadR = INK_BEAD_R * (W / INK_W) * s;
  const nowU = smoothstep((f - NOW_F0) / (NOW_F1 - NOW_F0));

  // the stem and the card's dashed frame
  const stemDraw = evenEase((f - STEM_F0) / (STEM_F1 - STEM_F0), 0.25);
  const frameDraw = evenEase((f - FRAME_F0) / (FRAME_F1 - FRAME_F0), 0.25);
  const cx0 = CARD_CX - CARD_W / 2;
  const frameL: Pt[] = [
    { x: CARD_CX, y: CARD_BOT },
    { x: cx0, y: CARD_BOT },
    { x: cx0, y: CARD_TOP },
    { x: CARD_CX, y: CARD_TOP },
  ];
  const frameR: Pt[] = frameL.map((p) => ({ x: 2 * CARD_CX - p.x, y: p.y }));

  // the model
  const modelU = smoothstep((f - MODEL_F0) / (MODEL_F1 - MODEL_F0));
  const tU = trainU(f);
  const modelBox = { x0: MODEL_X0 - 6, y0: MODEL_Y0 - 6, x1: MODEL_X1 + 6, y1: MODEL_Y1 + 6 };

  // the ghost and its path
  const gx = ghostX(f);
  const gs = ghostScale(f);
  const ghw = HULL_HW * gs + 12;
  const ghh = HULL_HH * gs + 12;
  const ghostOp = INK_HI * smoothstep((f - GHOST_F0) / 5);
  const pathDraw = smoothstep((f - PATH_F0) / (PATH_F1 - PATH_F0));
  const pathPts: Pt[] = [
    { x: PATH_X0, y: PATH_Y },
    { x: X_FIELD, y: PATH_Y },
  ];

  return (
    <Stage S={f} cam={cam} rest={REST_CAM}>
      {/* time: solid up to now, dashed beyond it */}
      {[-3, -2, -1, 1, 2, 3, 4].map((n) => {
        const x = X_NOW + n * TICK_STEP;
        const g = easeOutCubic((f - tipReachF(x)) / 7);
        if (g <= 0.001) return null;
        return (
          <path
            key={n}
            d={`M${x.toFixed(2)} ${(AXIS_Y - 12 * g).toFixed(2)}L${x.toFixed(2)} ${(AXIS_Y + 12 * g).toFixed(2)}`}
            stroke={INK}
            strokeOpacity={INK_LO}
            strokeWidth={w.toFixed(3)}
            strokeLinecap="round"
          />
        );
      })}
      <WetLine
        id="tpt-axis"
        points={[
          { x: AXIS_X0, y: AXIS_Y },
          { x: X_NOW, y: AXIS_Y },
        ]}
        len={solidLen}
        k={k}
        ink
        rung={INK_HI}
        width={W}
        bead={tip < X_NOW ? 1 : 0}
        ageAt={(sLen) => f - tipReachF(AXIS_X0 + sLen)}
      />
      <DashedPath
        points={[
          { x: X_NOW, y: AXIS_Y },
          { x: X_FIELD, y: AXIS_Y },
        ]}
        k={k}
        S={f * MARCH}
        draw={futDraw}
        rung={cardRung}
        width={W}
      />
      {tip >= X_NOW ? <Bead id="tpt-tip" x={tip} y={AXIS_Y} r={beadR} color={INK} opacity={tipBead * INK_HI} /> : null}
      {/* the 2022 tick: small as the tip passes, solid and tall when we arrive */}
      {(() => {
        const g = easeOutCubic((f - tipReachF(X_NOW)) / 7);
        if (g <= 0.001) return null;
        const h = (12 + 18 * nowU) * g;
        return (
          <path
            d={`M${X_NOW} ${(AXIS_Y - h).toFixed(2)}L${X_NOW} ${(AXIS_Y + h).toFixed(2)}`}
            stroke={INK}
            strokeOpacity={(INK_LO + (INK_HI - INK_LO) * nowU).toFixed(4)}
            strokeWidth={w.toFixed(3)}
            strokeLinecap="round"
          />
        );
      })()}

      {/* FIELDED: a dashed stem from the axis to the card's foot */}
      <DashedPath
        points={[
          { x: X_FIELD, y: AXIS_Y },
          { x: X_FIELD, y: CARD_BOT },
        ]}
        k={k}
        S={f * MARCH}
        draw={stemDraw}
        rung={cardRung}
        width={W}
        dashMod={(_i, sMid) => {
          // the docked ghost stands on the stem: no dashes through it
          if (Math.abs(gx - X_FIELD) > ghw) return null;
          const dy = Math.abs(AXIS_Y - sMid - PATH_Y);
          return dy < ghh ? { opacity: 0 } : null;
        }}
      />

      {/* the model: written in at 0.42, filled to 0.90 as the data reaches it */}
      {modelU > 0.001 ? (
        <>
          <g opacity={INK_LO}>
            <FeatherWipe id="tpt-model" box={modelBox} u={modelU} feather={90} dir="right">
              <Lattice w={w} />
            </FeatherWipe>
          </g>
          {tU > 0.001 ? (
            <g opacity={((INK_HI - INK_LO) / (1 - INK_LO)).toFixed(4)}>
              <FeatherWipe id="tpt-train" box={modelBox} u={tU} feather={110} dir="right">
                <Lattice w={w} />
              </FeatherWipe>
            </g>
          ) : null}
        </>
      ) : null}

      {/* the hope: a dashed path forward, and the model's dashed ghost riding it */}
      <DashedPath
        points={pathPts}
        k={k}
        S={f * MARCH}
        draw={pathDraw}
        rung={INK_HI}
        width={W}
        dashMod={(_i, sMid) => {
          const x = PATH_X0 + sMid;
          return Math.abs(x - gx) < ghw ? { opacity: 0 } : null;
        }}
      />
      <GhostLattice f={f} x={gx} scale={gs} w={w} opacity={ghostOp} />

      {/* synthetic data: the red file */}
      <RedFile f={f} k={k} />

      {/* the card, and its dashed frame */}
      <NewsCard f={f} k={k} rung={cardRung} />
      <DashedPath points={frameL} k={k} S={f * MARCH} draw={frameDraw} rung={cardRung} width={W} />
      <DashedPath points={frameR} k={k} S={f * MARCH} draw={frameDraw} rung={cardRung} width={W} />

      {/* labels */}
      <Label text="fielded" x={X_FIELD} y={AXIS_Y + LABEL_DROP / k} k={k} size="word" minPx={WORD_MIN} rung={cardRung} appear={enterU(f, 46)} />
      <Label text="2022" x={X_NOW} y={AXIS_Y + (LABEL_DROP + 8) / k} k={k} size="value" minPx={VALUE_MIN} appear={enterU(f, 96)} />
      <Label text="pre-train" x={MODEL_CX} y={MODEL_Y0 - 56} k={k} size="word" minPx={WORD_MIN} appear={enterU(f, 127)} />
    </Stage>
  );
};

export default TitanPreTrain;
