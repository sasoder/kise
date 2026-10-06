import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Bead,
  DOT_R,
  DashedPath,
  INK,
  INK_HI,
  INK_LO,
  Label,
  RED,
  RED_WET,
  Stage,
  WET_DRY_F,
  WetLine,
  clamp01,
  enterU,
  mixHex,
  paperShadow,
  smoothstep,
  sz,
} from "./chinatalkShared";
import {
  CELLS,
  CORNER,
  DOMAINS,
  DOMAIN_LABEL_DY,
  DOMAIN_LABEL_LAND,
  DOMAIN_R,
  DOMAIN_STAGGER_F,
  DOMAIN_SWEEP_F,
  DURATION,
  FPS,
  LABEL_MIN_PX,
  LINKS,
  LINK_S0,
  N_FILE,
  PATH_LEN,
  PATH_PTS,
  REAL_LABEL_S,
  REAL_LABEL_Y,
  REAL_MIN_PX,
  REST_CAM,
  RING_LEN,
  RING_PHI0,
  RING_PTS,
  RING_S1,
  SIDE,
  SYNTH_LABEL_S,
  SYNTH_LABEL_Y,
  W,
  WRITE_END,
  caretOpacity,
  caretPos,
  headOpacity,
  headPos,
  camAt,
  fileSquare,
  linkDraw,
  linkPts,
  passS,
  pathLen,
  ringLen,
  ringPoint,
  ringReachS,
  squareDoneS,
  squareWipe,
} from "./howUsefulGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// HowUsefulRealWorld -- Bharat, "Synthetic data needs real data" (ChinaTalk),
// cut A of 3, delivered as 3_HowUsefulRealWorld.mov.
//
// LINE (host): "How useful is this for the sort of targeting, autonomy,
// physical, real-world stuff that we're talking about in this context?"
// IN = edit frame 80. DURATION = 175 f exactly (S 80 -> 255), 24 fps,
// 1080x1920, opaque. Local word frames: (how -9) · useful 2-20 · is 20 ·
// this 28-36 · for 36 · the sort of 45-62 · targeting ~62-70 (clipped) ·
// autonomy 72-89 · physical 89-107 · real 107 · world 122 · stuff 129 ·
// that we're talking about 137-157 · in this 157-163 · context 163-170.
//
// IDEA: synthetic data is written on the page; can it reach the real world?
// RED = synthetic data and nothing else. One red bead writes a block of seal
// squares; a DASHED (hoped) line runs down to the real world -- a big ink
// ring holding a row of three domains (concentric ink rings) -- and the squares that
// follow it collect OUTSIDE the rim; the links into the domains stay dashed and
// stop short. Five element types: red squares, the dashed red line, ink rings,
// labels, the bead. One stroke weight (W = 5 world px, ~6 screen px at k 1.2).
// Geometry, clocks and the camera live in howUsefulGeom.ts.
//
// GESTURES (gesture -> word -> local frames)
// 1. "How useful is this" (0-36): the frame is filled by the synthetic block
//    (6 x 5 RED seal squares, ~620 screen px wide), 17 written on f 0; the wet
//    caret (red bead) keeps writing the last two rows as a snake and clears the
//    last square on f 30 ("this"); each square is laid down under the caret and
//    dries RED_WET -> RED over 18 f. SYNTHETIC DATA slides up over the block,
//    landing on "this" (f 20-32). Camera creeps in (k 2.58 -> 2.6) until the pull-back takes over at f 14.
// 2. "for the sort of" (32-76): a new red bead leaves the block's bottom-centre
//    2 f after the last square and writes a dashed red line straight down the
//    centre axis (head f 32-~62, speed-capped at 42 screen px / f, dashes
//    marching); the camera follows it in one long glide (pull-back f 14-48 to
//    k 1.2, travel f 26-76). The real world enters from below, being written:
//    one ink bead runs counter-clockwise round the big ring (f 32-94.6, 42
//    screen px / f); inside it, one row of three domains at ink 0.42.
// 3. "targeting / autonomy / physical" (56-110): the ring-writing bead IS the
//    travelling thing: as it passes 9 o'clock (f 56.3) TARGETING, 6 o'clock
//    (f 72) AUTONOMY and 3 o'clock (f 87.7) PHYSICAL, that domain's three rings
//    are re-written at ink 0.90 from the side facing the bead (two tips, 16 f,
//    outer -> inner 3 f apart) and its label lands (62 / 76 / 95). The ring
//    closes at f 94.6.
// 4. "real-world stuff" (99-125): REAL WORLD lands under the closed ring on
//    "real" (f 99-111). A file of seven red squares travels down the dashed
//    line and fans out along the rim, outside it, outermost first, to seven
//    evenly spread slots; the outer two sit straight above the outer domains.
// 5. "that we're talking about in this context" (134-175): from the rim squares
//    above each domain three parallel dashed red links drop straight down and
//    stop 24 screen px above the domain's outer ring, left -> right 5 f apart
//    (134-156, 139-167, 144-166), open ends, dashes marching; the squares
//    gently ride the rim; a slow creep (k 1.2 -> 1.23) decays into the last
//    frame. An open question, still moving.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** dashes march three times the house pace (1.5 world px / frame) */
const MARCH = 3;

const circleArcD = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const n = Math.max(4, Math.ceil(Math.abs(a1 - a0) / 0.12));
  const parts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    parts.push(`${i ? "L" : "M"}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return parts.join("");
};

/** One seal square (side SIDE, corners CORNER), optionally partly laid down. */
const SealRect: React.FC<{ x: number; y: number; rot?: number; color: string; wipe?: number; vertical?: boolean; dir?: 1 | -1 }> = ({
  x,
  y,
  rot = 0,
  color,
  wipe = 1,
  vertical = false,
  dir = 1,
}) => {
  if (wipe <= 0.001) return null;
  const h = SIDE / 2;
  const w = SIDE * wipe;
  const rx = Math.min(CORNER, w / 2);
  const rect = vertical ? (
    <rect x={(x - h).toFixed(3)} y={(y - h).toFixed(3)} width={SIDE} height={w.toFixed(3)} rx={rx.toFixed(3)} fill={color} />
  ) : (
    <rect x={(dir === 1 ? x - h : x + h - w).toFixed(3)} y={(y - h).toFixed(3)} width={w.toFixed(3)} height={SIDE} rx={rx.toFixed(3)} fill={color} />
  );
  if (Math.abs(rot) < 0.01) return rect;
  return <g transform={`rotate(${rot.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)})`}>{rect}</g>;
};

const HowUsefulRealWorld: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const S = frame;
  const cam = camAt(S);
  const k = cam.k;
  const sw = W * sz(k);

  const pLen = pathLen(S);

  // the ring-writing ink bead
  const rLen = ringLen(S);
  const ringBead = S < RING_S1 ? 1 : 1 - smoothstep((S - RING_S1) / 8);
  const ringTip = ringPoint(RING_PHI0 - (360 * rLen) / RING_LEN);

  return (
    <Stage S={S} cam={cam} rest={REST_CAM}>
      {/* the three domains: concentric ink rings at 0.42, re-written at 0.90 as the bead passes */}
      {DOMAINS.map((d) => {
        const t0 = passS(d);
        // the direction facing the rim point where the bead passes
        const rp = ringPoint(d.phi);
        const a0 = Math.atan2(rp.y - d.y, rp.x - d.x);
        return (
          <g key={d.name} fill="none" stroke={INK} strokeWidth={sw.toFixed(3)} strokeLinecap="round">
            {DOMAIN_R.map((r, j) => {
              const u = clamp01((S - t0 - j * DOMAIN_STAGGER_F) / DOMAIN_SWEEP_F);
              const e = smoothstep(u);
              const wet = u > 0 && u < 1 ? 1 + 0.15 * (1 - u) : 1;
              return (
                <g key={j}>
                  <circle cx={d.x.toFixed(2)} cy={d.y.toFixed(2)} r={r} strokeOpacity={INK_LO} />
                  {e > 0.001 ? (
                    <path
                      d={circleArcD(d.x, d.y, r, a0 - Math.PI * e, a0 + Math.PI * e)}
                      strokeOpacity={0.828}
                      strokeWidth={(sw * wet).toFixed(3)}
                    />
                  ) : null}
                </g>
              );
            })}
          </g>
        );
      })}

      {/* the real world: one big ink ring, written by one bead */}
      <WetLine id="hu-ring" points={RING_PTS} len={rLen} k={k} ink rung={INK_HI} width={W} ageAt={(s) => S - ringReachS(s)} wetLen={90} />
      {rLen > 0.5 ? <Bead id="hu-ring-bead" x={ringTip.x} y={ringTip.y} r={1.5 * sw} color={INK} opacity={ringBead * INK_HI} /> : null}
      {DOMAINS.map((d, di) => (
        <Label
          key={d.name}
          text={d.name}
          x={d.x}
          y={d.y + DOMAIN_LABEL_DY}
          k={k}
          size="word"
          rung={INK_HI}
          appear={enterU(S, DOMAIN_LABEL_LAND[di])}
          minPx={LABEL_MIN_PX}
        />
      ))}
      <Label text="REAL WORLD" x={0} y={REAL_LABEL_Y} k={k} size="word" rung={INK_HI} appear={enterU(S, REAL_LABEL_S)} minPx={REAL_MIN_PX} />

      {/* everything red: synthetic data */}
      <g style={{ filter: paperShadow(k) }}>
        {/* the dashed line to the real world, and the three links that stop short */}
        <DashedPath points={PATH_PTS} k={k} S={S * MARCH} draw={pLen / PATH_LEN} rung={1} width={W} color={RED} />
        {S > LINK_S0
          ? LINKS.map((l) => (
              <DashedPath key={l.slot} points={linkPts(l)} k={k} S={S * MARCH} draw={linkDraw(l, S)} rung={1} width={W} color={RED} />
            ))
          : null}

        {/* the block, written as a snake by the caret */}
        {CELLS.map((c, n) => {
          const wipe = squareWipe(n, S);
          if (wipe <= 0) return null;
          const wet = 1 - smoothstep((S - squareDoneS(n)) / WET_DRY_F);
          return (
            <SealRect
              key={n}
              x={c.x}
              y={c.y}
              color={mixHex(RED, RED_WET, wet)}
              wipe={wipe}
              vertical={c.j === 0 && c.row > 0}
              dir={c.dir}
            />
          );
        })}

        {/* the file of seven on the dashed line, collecting on the rim */}
        {Array.from({ length: N_FILE }, (_, i) => {
          const p = fileSquare(i, S);
          return p ? <SealRect key={i} x={p.x} y={p.y} rot={p.rot} color={RED} /> : null;
        })}
      </g>

      {/* the beads: the caret, then the head of the dashed line */}
      {S <= WRITE_END + 4 ? (
        <Bead id="hu-caret" x={caretPos(Math.min(S, WRITE_END)).x} y={caretPos(Math.min(S, WRITE_END)).y} r={0.82 * DOT_R * sz(k)} color={RED_WET} opacity={caretOpacity(S)} />
      ) : null}
      <Bead id="hu-head" x={headPos(S).x} y={headPos(S).y} r={0.82 * DOT_R * sz(k)} color={RED} opacity={headOpacity(S)} />

      <Label text="SYNTHETIC DATA" x={0} y={SYNTH_LABEL_Y} k={k} size="word" rung={INK_HI} appear={enterU(S, SYNTH_LABEL_S)} />
    </Stage>
  );
};

export default HowUsefulRealWorld;
