import React from "react";
import { useCurrentFrame } from "remotion";
import { loadFont as loadSourceSans3 } from "@remotion/google-fonts/SourceSans3";
import { z } from "zod";
import {
  DashedPath,
  FONT_SERIF,
  FeatherWipe,
  INK,
  INK_HI,
  INK_LO,
  Label,
  type Pt,
  RED,
  RED_WET,
  Stage,
  WET_DRY_F,
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
  CARD_BOT,
  CARD_CY,
  CARD_PX_H,
  CARD_PX_W,
  CARD_TOP,
  CARD_W,
  CONTEXT_F,
  CX,
  DURATION,
  FACE_F0,
  FACE_F1,
  FADE_IN,
  FILE_F0,
  FPS,
  FRAME_F0,
  FRAME_F1,
  HEAD_Y,
  INLET,
  K0,
  LABEL_CLEAR,
  LABEL_Y,
  LINKS,
  LINK_F0,
  LINK_F1,
  LINK_Y0,
  LINK_Y1,
  MODEL_F0,
  MODEL_F1,
  MODEL_X0,
  MODEL_X1,
  MODEL_Y0,
  MODEL_Y1,
  NODE_R,
  N_SQUARES,
  PATH_LEN,
  PITCH,
  REST_CAM,
  ROWS,
  SQ,
  SQ_R,
  W,
  bornF,
  camAt,
  fileQ,
  trainU,
} from "./titanPreTrainGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// TitanPreTrain (V2, reimagined) -- Bharat, "Synthetic data needs real data"
// (ChinaTalk), cut B, delivered as ONE file 14_TitanPreTrain.mov.
//
// LINE: "(... I think around 2022) when I was supporting the TITAN program. So
// before we even fielded some of these capabilities, I'm like, hey, let's see if
// we could pre-train models, let's see if we could do some things."
// IN = S 324, DURATION 245 f exactly (S 324 -> 569), 24 fps, 1080x1920, opaque.
// Local word frames: around 3 · 2022 6-19 · when 19 · I was 31-34 ·
// supporting 34-42 · the 42 · TITAN 47-55 · program 55-61 · So 57-67 ·
// before 68-77 · we 77 · even 84 · fielded 89-116 · some of these 116-128 ·
// capabilities 128-138 · I'm like hey 143-152 · let's 154 · see 158 ·
// if we could 168-174 · pre-train 174-186 · models 186-194 · let's see if we
// could 197-217 · do 219 · some 227 · things 231-238.
//
// IDEA: one vertical column on x 540, three things. The newspaper card (the
// TITAN capability) at the top; it is not here yet, so its paper diffuses away
// and only a dashed outline is left. Below it a model is trained by a file of
// red synthetic squares rising up the centre axis; the trained model then
// reaches up to the dashed card with a dashed line: ready and waiting.
// RED = synthetic data only. Element types: card, dashed outline / link,
// lattice, red squares, labels. One stroke weight. Geometry, clocks and the
// camera live in titanPreTrainGeom.ts.
//
// GESTURES (gesture -> word -> local frames)
// 1. "around 2022 when I was supporting the TITAN program" (0-65): the card
//    (ink rule + BREAKING DEFENSE + date, a 3-line headline, nothing else)
//    slides up 40 px, fades and clears its blur over f 0-12 (already under way
//    on f 0), headline lines 2 f apart; on "2022" the date June 2022 comes up
//    from ink 0.42 to 0.90 (6-18, one crossfade); the card holds with a slow
//    creep (k x1.04, to f 71); the wet ink underline is written under TITAN on
//    "TITAN" (46-55).
// 2. "So before we even" (59-93): ONE glide: the card eases up to the top of
//    the composition and shrinks (880 -> ~630 px wide, top edge y 300). Scale
//    only, no content swap.
// 3. "fielded" (85-116): the card's paper face and shadow diffuse away like ink
//    (89-109) while a dashed outline writes itself round the same rectangle from
//    the top centre down both sides (85-116, marching); the headline and date
//    drop to ink 0.42 (91-103). NOT YET FIELDED lands on 89, centred under the card.
// 4. "some of these capabilities, I'm like, hey" (115-153): ONE tilt down
//    (glide 115-153); the model lattice (3-4-3 rows, ink 0.42, 520 px wide)
//    writes in from the bottom up in one soft wave (129-153); the red file
//    starts rising from below (f 130 on).
// 5. "let's see if we could pre-train models" (154-194): the red squares rise
//    straight up the centre axis into the input row (first arrives ~f 159); with
//    each arrival the ink 0.90 front climbs one step bottom -> top (full ~f 185).
//    PRE-TRAIN lands on 174 at the lattice's left shoulder.
// 6. "let's see if we could do some things" (193-245): a dashed line writes
//    itself from the model's top node straight up to the card's foot (197-217,
//    broken round the label, marching upward) while the camera eases to the final
//    column (193-233) and on into a slow creep (+1.5 %, 212 -> past the last
//    frame). To the end: dashes march, the red file trickles in.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const SANS = loadSourceSans3("normal", { weights: ["400", "700"], subsets: ["latin"] }).fontFamily;

const WORD_MIN = 46;
/** dashes march faster than the house default so a hold visibly moves */
const MARCH = 2.6;
const lineD = (a: Pt, b: Pt) => `M${a.x.toFixed(2)} ${a.y.toFixed(2)}L${b.x.toFixed(2)} ${b.y.toFixed(2)}`;

// --- the news card -----------------------------------------------------------------
const PAD = 58;
const HEAD_PX = 64;
const HEAD_Y0 = 218;
const HEAD_LEAD = 78;
const HEAD_LINES = ["Army moves ahead with", "Palantir and Raytheon"];
// line 3 is set in two runs so TITAN's box is known (for its underline)
const LINE3_A = "for next phase of";
const LINE3_A_W = 513;
const TITAN_X = PAD + LINE3_A_W + 16;
const TITAN_W = 197;
const DEBUG_MEASURE = false;

const NewsCard: React.FC<{ f: number; k: number; rung: number }> = ({ f, k, rung }) => {
  // entrance: slide up 40 px + fade + blur clearing over f 0-12 (already under way on f 0)
  const u = clamp01((f + 4) / 16);
  const e = easeOutCubic(u);
  const slide = (40 / k) * (1 - e);
  const blur = 5 * (1 - e);
  const op = 0.3 + 0.7 * smoothstep(u);
  // "fielded": the paper face and its shadow diffuse away like ink
  const gone = clamp01((f - FACE_F0) / (FACE_F1 - FACE_F0));
  const faceOp = 1 - smoothstep(gone);
  const faceBlur = 14 * easeOutCubic(gone);
  const ink = rung / INK_HI;
  // "2022": the date comes up from context to full ink (one eased 12 f crossfade)
  const dateRung = INK_LO + (INK_HI - INK_LO) * smoothstep((f - 6) / 12);
  const lineY = (i: number) => HEAD_Y0 + i * HEAD_LEAD;
  const lineU = (i: number) => clamp01((f + 3 - 2 * i) / 13);
  const lineProps = (i: number) => ({
    y: lineY(i) + 18 * (1 - easeOutCubic(lineU(i))),
    fillOpacity: (INK_HI * (0.6 + 0.4 * smoothstep(lineU(i)))).toFixed(4),
  });
  // the wet underline under TITAN, written on the word
  const ul = smoothstep((f - 46) / 9);
  const ulY = lineY(2) + 15;
  const ulX = TITAN_X + TITAN_W * ul;
  const ulBead = smoothstep((f - 45) / 2) * (1 - smoothstep((f - 54) / 5));
  return (
    <g
      transform={`translate(${CX} ${(CARD_CY + slide).toFixed(3)}) scale(${(1 / K0).toFixed(6)}) translate(${-CARD_PX_W / 2} ${-CARD_PX_H / 2})`}
      opacity={op < 1 ? op.toFixed(4) : undefined}
      style={blur > 0.02 ? { filter: `blur(${blur.toFixed(2)}px)` } : undefined}
    >
      {faceOp > 0.002 ? (
        <g opacity={faceOp.toFixed(4)} style={{ filter: `${faceBlur > 0.05 ? `blur(${faceBlur.toFixed(2)}px) ` : ""}drop-shadow(0 10px 24px rgba(70,35,15,0.20))` }}>
          <rect x={0} y={0} width={CARD_PX_W} height={CARD_PX_H} rx={4} fill="#FFFFFF" />
        </g>
      ) : null}
      <g opacity={ink.toFixed(4)}>
        <rect x={PAD} y={92} width={48} height={8} fill={INK} opacity={INK_HI} />
        <text x={PAD + 66} y={106} fontFamily={SANS} fontWeight={700} fontSize={27} letterSpacing="0.1em" fill={INK} fillOpacity={INK_HI}>
          BREAKING DEFENSE
        </text>
        <text x={CARD_PX_W - PAD} y={106} fontFamily={SANS} fontWeight={400} fontSize={27} textAnchor="end" fill={INK} fillOpacity={dateRung.toFixed(4)}>
          June 2022
        </text>
        <g fontFamily={FONT_SERIF} fontWeight={700} fontSize={HEAD_PX} letterSpacing="-0.01em" fill={INK}>
          {HEAD_LINES.map((line, i) => (
            <text key={i} x={PAD} {...lineProps(i)}>
              {line}
            </text>
          ))}
          {DEBUG_MEASURE ? (
            <text x={PAD} y={lineY(2)}>
              {LINE3_A} <tspan fill="#FF0000">TITAN</tspan>
            </text>
          ) : (
            <>
              <text x={PAD} {...lineProps(2)} textLength={LINE3_A_W} lengthAdjust="spacing">
                {LINE3_A}
              </text>
              <text x={TITAN_X} {...lineProps(2)} textLength={TITAN_W} lengthAdjust="spacing">
                TITAN
              </text>
            </>
          )}
        </g>
        {ul > 0.001 ? (
          <path d={`M${TITAN_X + 2} ${ulY}L${ulX.toFixed(2)} ${ulY}`} stroke={INK} strokeOpacity={INK_HI} strokeWidth={6} strokeLinecap="round" fill="none" />
        ) : null}
        {ulBead > 0.01 ? <circle cx={ulX.toFixed(2)} cy={ulY} r={6.5} fill={INK} opacity={ulBead.toFixed(4)} /> : null}
      </g>
    </g>
  );
};

// --- the model lattice -----------------------------------------------------------------
/** The 3-4-3 lattice in solid ink (drawn opaque: the caller sets the group opacity). */
const Lattice: React.FC<{ w: number }> = ({ w }) => (
  <g>
    <path d={LINKS.map(([a, b]) => lineD(a, b)).join("")} stroke={INK} strokeWidth={w.toFixed(3)} strokeLinecap="round" fill="none" />
    {ROWS.flat().map((n, i) => (
      <circle key={i} cx={n.x} cy={n.y} r={NODE_R} fill={INK} />
    ))}
  </g>
);

// --- the red file -----------------------------------------------------------------------
const RedFile: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  if (f < FILE_F0) return null;
  const q = fileQ(f);
  const squares: React.ReactNode[] = [];
  for (let i = 0; i < N_SQUARES; i++) {
    const s = q - i * PITCH; // distance risen from the write head
    if (s <= 0) break;
    const left = PATH_LEN - s;
    if (left <= 0) continue;
    const g = smoothstep(left / 50); // taken up by the input node
    const side = SQ * g;
    const y = HEAD_Y - s;
    const wet = 1 - smoothstep((f - bornF(i)) / WET_DRY_F);
    const op = smoothstep(s / FADE_IN) * smoothstep(g / 0.5);
    squares.push(
      <rect
        key={i}
        x={(INLET.x - side / 2).toFixed(3)}
        y={(y - side / 2).toFixed(3)}
        width={side.toFixed(3)}
        height={side.toFixed(3)}
        rx={(SQ_R * g).toFixed(3)}
        fill={mixHex(RED, RED_WET, wet)}
        opacity={op < 1 ? op.toFixed(4) : undefined}
      />,
    );
  }
  return <g style={{ filter: paperShadow(k) }}>{squares}</g>;
};

const TitanPreTrain: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const w = W * sz(k);

  // the capability is not here yet: the card's content is context from "fielded"
  const cardRung = rungAt(f, CONTEXT_F, INK_HI, INK_LO);

  // the dashed outline, written from the top centre down both sides to the foot
  const frameDraw = evenEase((f - FRAME_F0) / (FRAME_F1 - FRAME_F0), 0.25);
  const x0 = CX - CARD_W / 2;
  const frameL: Pt[] = [
    { x: CX, y: CARD_TOP },
    { x: x0, y: CARD_TOP },
    { x: x0, y: CARD_BOT },
    { x: CX, y: CARD_BOT },
  ];
  const frameR: Pt[] = frameL.map((p) => ({ x: 2 * CX - p.x, y: p.y }));

  // the model
  const modelU = smoothstep((f - MODEL_F0) / (MODEL_F1 - MODEL_F0));
  const tU = trainU(f);
  const modelBox = { x0: MODEL_X0 - 6, y0: MODEL_Y0 - 6, x1: MODEL_X1 + 6, y1: MODEL_Y1 + 6 };

  // the dashed link
  const linkDraw = smoothstep((f - LINK_F0) / (LINK_F1 - LINK_F0));
  const labelClear = LABEL_CLEAR * Math.max(1, 1 / k);

  return (
    <Stage S={f} cam={cam} rest={REST_CAM}>
      {/* the model: written in at 0.42 from the bottom up, filled to 0.90 as the data reaches it */}
      {modelU > 0.001 ? (
        <>
          <g opacity={INK_LO}>
            <FeatherWipe id="tpt-model" box={modelBox} u={modelU} feather={110} dir="up">
              <Lattice w={w} />
            </FeatherWipe>
          </g>
          {tU > 0.001 ? (
            <g opacity={((INK_HI - INK_LO) / (1 - INK_LO)).toFixed(4)}>
              <FeatherWipe id="tpt-train" box={modelBox} u={tU} feather={120} dir="up">
                <Lattice w={w} />
              </FeatherWipe>
            </g>
          ) : null}
        </>
      ) : null}

      {/* synthetic data: the red file rising up the centre axis */}
      <RedFile f={f} k={k} />

      {/* ready and waiting: the dashed link from the model's top node to the card's foot */}
      <DashedPath
        points={[
          { x: CX, y: LINK_Y0 },
          { x: CX, y: LINK_Y1 },
        ]}
        k={k}
        S={f * MARCH}
        draw={linkDraw}
        rung={INK_HI}
        width={W}
        dashMod={(_i, sMid) => (Math.abs(LINK_Y0 - sMid - LABEL_Y) < labelClear ? { opacity: 0 } : null)}
      />

      {/* the card and its dashed outline */}
      <NewsCard f={f} k={k} rung={cardRung} />
      <DashedPath points={frameL} k={k} S={f * MARCH} draw={frameDraw} rung={INK_HI} width={W} />
      <DashedPath points={frameR} k={k} S={f * MARCH} draw={frameDraw} rung={INK_HI} width={W} />

      {/* labels */}
      <Label text="not yet fielded" x={CX} y={LABEL_Y} k={k} size="word" minPx={WORD_MIN} appear={enterU(f, 89)} />
      <Label text="pre-train" x={ROWS[0][0].x - NODE_R - 26} y={ROWS[0][0].y - 6} k={k} size="word" minPx={WORD_MIN} anchor="end" appear={enterU(f, 174)} />
    </Stage>
  );
};

export default TitanPreTrain;
