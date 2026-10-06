import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { INK, INK_HI, InkDiffuse, Label, PAPER, RED, Stage, clamp01, cumLen, enterU, lerp, pointAtLen, smoothstep, subPathD } from "./chinatalkShared";
import type { Pt } from "./chinatalkShared";
import { DataFrame, MWetLine, ModelGlyph, TargetSeal, framePoints, mStrokePx, targetColor } from "./mavenShared";
import {
  BOX_CUM,
  BOX_LAST_S,
  BOX_PERIM,
  BOX_PTS,
  BR_LOCK_SIDE,
  DATA_LABEL,
  DATA_WORD_S,
  DURATION,
  ENOUGH_LABEL,
  ENOUGH_WORD_S,
  FEEDS,
  FPS,
  FRAME_H,
  FRAME_W,
  FRAME_X,
  FRAME_Y,
  MODEL,
  MODEL_LABEL,
  MODEL_R,
  MODEL_WORD_S,
  N_TILES,
  OPS_SEED,
  OPS_TX,
  OPS_TY,
  REACH_S,
  REST_CAM,
  SEAL,
  SEAL_SIDE,
  TIE_PTS,
  TILE,
  TILE_H,
  USE_LABEL,
  USE_WORD_S,
  boxDraw,
  boxSolid,
  bracketAt,
  camAt,
  eyeSolid,
  eyeSquare,
  feedAt,
  frameDraw,
  frameWet,
  lockU,
  modelAppear,
  modelFill,
  pulseAt,
  sealUp,
  tieBead,
  tieLen,
  tieWet,
  tileAt,
} from "./tiedToTheDataTallGeom";
import type { TileState } from "./tiedToTheDataTallGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// TiedToTheDataTall -- Bharat, "Project Maven's data problem" (ChinaTalk), cut D
// of 5, the clip's payoff, PORTRAIT 1080x1920, 24 fps, opaque. The 9:16 redo of
// TiedToTheData (out/bharat-maven/briefs/TALL.md): recomposed as one vertical
// column of three stations on the portrait ChinaTalk Stage, with the picture
// primitives of mavenShared.
//
// LINE: "(understanding) the use case tied to the data and then getting enough
// of it to build performant models."
// IN = 883 (sequence frame), DURATION = 144 (the exact slot, no tail). Local
// word frames: understanding -2..9 · the 9 · use 26 · case 31 · tied 36 · to 44
// · the 48 · data 50 · and 58 · then 70 · getting 73 · enough 77 · of 84 · it 88
// · to 91 · build 96 · performant 102..130 · models 130 · end 144.
//
// ACCENT: vermilion = THE RELEVANT TARGET. The use case's seal is RED_DEEP (there,
// not found) until the model's bracket locks on it; every data tile is stamped
// with the same seal at the same place; the model's dashed square turns solid.
//
// ONE MOTION, down the column and back up: the use case (top, B's OPERATIONS
// frame, 620 px at the wide) sends a line DOWN to the data; the data fills a
// dashed box that is the amount needed (ENOUGH, 5 x 2 tiles); the model under it
// is built from it, and its eye goes back UP and finds the target. Five element
// types: frame, seal, bracket/model, line (tie + box), labels. Geometry, clocks
// and the camera live in tiedToTheDataTallGeom.ts.
//
// GESTURES (gesture -> word -> local frames)
// 1. "understanding the use case" (f0-34): open CLOSE on the use-case frame
//    (850 -> 900 px wide, filling the column), its outline still being written
//    (left edge wet, bead, done f13), the camera creeping toward the deep-red
//    seal (glide 1, S -16..38, k 1.36 -> 1.45). `USE CASE` lands f28.
// 2. "tied to the data" (f27-56): the tie is written straight DOWN from the
//    frame's bottom edge (S 27..44, bead leading), the camera following it down
//    the column (glide 2, S 26..64). The dashed ENOUGH box opens from the tie's
//    foot round both sides (S 38..54). The moment the tie lands, the first data
//    frame leaves its foot (S 44), glides to the first slot and is stamped with
//    the use case's seal (S 55..63); `DATA` lands f50 at the box's upper left.
// 3. "and then getting enough of it" (f44-91): small frames ride the tie down
//    from the use case, fan out inside the box and grow into their slots (bottom
//    row then top row, outside in, so none crosses a filled slot), each stamped
//    as it lands (arrivals 59, 60.75 ... 80). `ENOUGH` lands f76 at the box's
//    upper right; the last slot (top middle, under the tie's foot) fills at S 80
//    and the dashed outline turns SOLID, running round both ways from the tie's
//    foot (S 79..91). The model's rings are written under the box (S 62..76).
// 4. "to build performant models" (f80-135): three copies leave the box for the
//    model (the box stays full; arriving 94.5 / 96.5 / 98.5, "build" 96, where
//    `MODEL` lands beside the glyph); its wash rises red-tinted (full S ~103)
//    and its eye's dashed square turns solid (S 93.5..103.5). Then ONE arc: the
//    bracket comes out (S 94.5..129), goes UP round the outside of the box, into
//    the use-case frame, while the camera pulls back to the WIDE (glide 4,
//    S 89..130, k -> 1.0, all three stations). Its own red square fades (S
//    118..124) before the corners tighten on the seal (S 124..132); the seal
//    comes up RED_DEEP -> vermilion with its paper shadow (S 123..135, half-way
//    on "models" f129-130).
// 5. the held breath (f132-144): the lock perfectly still; one slow ink bead on
//    the tie line (S 126..152); the camera drifts in very slightly (k 1.0 -> 1.03).
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** screen stroke of the lines of this cut (the tie, the box) */
const LINE_PX = 5.5;
/** screen stroke of the small data frames */
const TILE_PX = 3.8;
/** screen stroke of the bracket */
const BRACKET_PX = 4.6;
/** the seal's side inside a data frame (bigger than a field tile's, so the red reads on a phone) */
const TILE_SEAL = TILE * 0.2;
/** every label: Source Sans 3 SemiBold caps at this SCREEN size */
const LABEL_PX = 54;

/** A warm paper shadow whose strength follows `u` (red elements only). */
const shadowOf = (k: number, u: number) =>
  u > 0.01 ? `drop-shadow(0 ${(4 / k).toFixed(3)}px ${(8 / k).toFixed(3)}px rgba(70,35,15,${(0.16 * clamp01(u)).toFixed(4)}))` : undefined;

/** THE USE CASE: B's OPERATIONS frame. mavenShared's DataFrame draws the wash
 *  and the terrain; its outline is masked out and written here in wet ink (the
 *  last edge is still wet on frame 0); the seal is drawn here so it can come up
 *  from RED_DEEP with its shadow in one crossfade. */
const UseCaseFrame: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const sp = mStrokePx(FRAME_W * k);
  const pts = framePoints(FRAME_W, FRAME_H).map((p) => ({ x: p.x + FRAME_X, y: p.y + FRAME_Y }));
  const closed = [...pts, pts[0]];
  const cum = cumLen(closed);
  const total = cum[cum.length - 1];
  const up = sealUp(S);
  const pad = 40;
  return (
    <g>
      <defs>
        <mask id="ttdt-frame-mask" maskUnits="userSpaceOnUse" x={FRAME_X - FRAME_W / 2 - pad} y={FRAME_Y - FRAME_H / 2 - pad} width={FRAME_W + 2 * pad} height={FRAME_H + 2 * pad}>
          <rect x={FRAME_X - FRAME_W / 2 - pad} y={FRAME_Y - FRAME_H / 2 - pad} width={FRAME_W + 2 * pad} height={FRAME_H + 2 * pad} fill="#FFFFFF" />
          <path d={`${subPathD(closed, cum, 0, total)}Z`} fill="none" stroke="#000000" strokeWidth={((sp + 2.5) / k).toFixed(3)} strokeLinejoin="round" />
        </mask>
      </defs>
      <g mask="url(#ttdt-frame-mask)">
        <DataFrame x={FRAME_X} y={FRAME_Y} w={FRAME_W} k={k} seed={OPS_SEED} target="none" />
      </g>
      <rect
        x={(SEAL.x - SEAL_SIDE / 2).toFixed(3)}
        y={(SEAL.y - SEAL_SIDE / 2).toFixed(3)}
        width={SEAL_SIDE.toFixed(3)}
        height={SEAL_SIDE.toFixed(3)}
        rx={Math.min(SEAL_SIDE * 0.16, 2.5 / k + SEAL_SIDE * 0.03).toFixed(3)}
        fill={targetColor(1 - up)}
        style={{ filter: shadowOf(k, up) }}
      />
      <MWetLine points={closed} k={k} strokePx={sp} len={total * frameDraw(S)} wet={frameWet(S)} bead={frameWet(S)} wetPx={150} />
    </g>
  );
};

// the box outline twice round, so any arc [a, a + len] is one sub-path
const BOX2: Pt[] = [...BOX_PTS, ...BOX_PTS.slice(1)];
const BOX2_CUM = cumLen(BOX2);
const boxArc = (a: number, len: number) => {
  const a0 = ((a % BOX_PERIM) + BOX_PERIM) % BOX_PERIM;
  return { d: subPathD(BOX2, BOX2_CUM, a0, a0 + len), a0 };
};

/** ENOUGH: a dashed ink box (dashed = the amount that is needed) that opens
 *  from the tie's foot round both sides; when its last slot is filled it turns
 *  SOLID, running round both ways from that corner (solid = what happened). */
const EnoughBox: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const dr = boxDraw(S);
  if (dr <= 0.002) return null;
  const w = LINE_PX / k;
  const dash = 18 / k;
  const gap = 14 / k;
  const period = dash + gap;
  const march = (S * 0.5) / k;
  const half = BOX_PERIM / 2;
  const s = S >= REACH_S - 1 ? half * boxSolid(S) : 0;
  const arcs: { d: string; a0: number }[] = [];
  if (s <= 0) {
    const reach = half * dr;
    arcs.push({ d: subPathD(BOX_PTS, BOX_CUM, 0, reach), a0: 0 });
    arcs.push({ d: subPathD(BOX_PTS, BOX_CUM, BOX_PERIM - reach, BOX_PERIM), a0: BOX_PERIM - reach });
  } else if (BOX_PERIM - 2 * s > 0.5) {
    arcs.push(boxArc(BOX_LAST_S + s, BOX_PERIM - 2 * s));
  }
  return (
    <g fill="none" stroke={INK} strokeOpacity={INK_HI} strokeWidth={w.toFixed(3)} strokeLinejoin="round">
      {arcs.map((a, i) => (
        <path key={i} d={a.d} strokeDasharray={`${dash.toFixed(3)} ${gap.toFixed(3)}`} strokeDashoffset={((a.a0 + march) % period).toFixed(3)} strokeLinecap="butt" />
      ))}
      {s > 0.5 ? <path d={boxArc(BOX_LAST_S - s, 2 * s).d} strokeLinecap="round" /> : null}
    </g>
  );
};

/** One piece of data: written in wet ink as it leaves the use case, stamped
 *  with the use case's seal (same place in the tile) as it lands in its slot. */
const DataTile: React.FC<{ t: TileState | null; seed: number; k: number }> = ({ t, seed, k }) => {
  if (!t) return null;
  const sx = t.x + (OPS_TX - 0.5) * TILE;
  const sy = t.y + (OPS_TY - 0.5) * TILE_H;
  const under = smoothstep(t.reveal / 0.5);
  return (
    <InkDiffuse u={t.diffuse} k={k} cx={t.x} cy={t.y}>
      <g transform={t.scale !== 1 ? `translate(${t.x.toFixed(3)} ${t.y.toFixed(3)}) scale(${t.scale.toFixed(4)}) translate(${(-t.x).toFixed(3)} ${(-t.y).toFixed(3)})` : undefined}>
        <rect x={(t.x - TILE / 2).toFixed(3)} y={(t.y - TILE_H / 2).toFixed(3)} width={TILE} height={TILE_H} rx={(TILE_H * 0.05).toFixed(3)} fill={PAPER} opacity={under.toFixed(4)} />
        <DataFrame x={t.x} y={t.y} w={TILE} k={k * t.scale} seed={seed} target="none" reveal={t.reveal} strokePx={TILE_PX * (0.55 + 0.45 * t.scale)} />
        <TargetSeal x={sx} y={sy} side={TILE_SEAL} k={k} grow={t.stamp} />
      </g>
    </InkDiffuse>
  );
};

/** THE MODEL'S EYE (mavenShared's Bracket, copied so the corners' tightening,
 *  the square's dashed -> solid and the square's fade are separate tracks). */
const EyeBracket: React.FC<{ x: number; y: number; size: number; k: number; S: number; tight: number; solid: number; square: number; opacity: number }> = ({
  x,
  y,
  size,
  k,
  S,
  tight,
  solid,
  square,
  opacity,
}) => {
  if (opacity <= 0.003) return null;
  const tg = smoothstep(tight);
  const side = lerp(size, BR_LOCK_SIDE, tg);
  const w = BRACKET_PX / k;
  const arm = side * 0.22;
  const hs = side / 2;
  const corners: string[] = [];
  for (const [sx, sy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ]) {
    const cx = x + sx * hs;
    const cy = y + sy * hs;
    corners.push(`M${(cx - sx * arm).toFixed(3)} ${cy.toFixed(3)}L${cx.toFixed(3)} ${cy.toFixed(3)}L${cx.toFixed(3)} ${(cy - sy * arm).toFixed(3)}`);
  }
  const es = size * 0.34;
  const eh = es / 2;
  const sl = smoothstep(solid);
  const period = (es * 4) / 12;
  const dashLen = period * lerp(0.56, 1.02, sl);
  const march = ((S * 0.9) / k) % period;
  const ew = Math.max(2.6 / k, w * 0.8);
  const sqOp = clamp01(square);
  return (
    <g opacity={opacity < 1 ? opacity.toFixed(4) : undefined}>
      {sqOp > 0.003 ? (
        <g opacity={sqOp.toFixed(4)} style={{ filter: shadowOf(k, sl) }}>
          {sl > 0.02 ? (
            <rect x={(x - eh).toFixed(3)} y={(y - eh).toFixed(3)} width={es.toFixed(3)} height={es.toFixed(3)} rx={Math.min(es * 0.16, 2.5 / k + es * 0.03).toFixed(3)} fill={RED} opacity={sl.toFixed(4)} />
          ) : null}
          {sl < 0.98 ? (
            <rect
              x={(x - eh).toFixed(3)}
              y={(y - eh).toFixed(3)}
              width={es.toFixed(3)}
              height={es.toFixed(3)}
              rx={(es * 0.08).toFixed(3)}
              fill="none"
              stroke={RED}
              strokeWidth={ew.toFixed(3)}
              strokeDasharray={`${dashLen.toFixed(3)} ${Math.max(0, period - dashLen).toFixed(3)}`}
              strokeDashoffset={(-march).toFixed(3)}
              opacity={(1 - sl).toFixed(4)}
            />
          ) : null}
        </g>
      ) : null}
      <path d={corners.join("")} fill="none" stroke={INK} strokeOpacity={INK_HI} strokeWidth={w.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** The hold's one travelling highlight: an ink bead riding the tie line. */
const TiePulse: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const p = pulseAt(S);
  if (!p || p.op <= 0.003) return null;
  const cum = cumLen(TIE_PTS);
  const at = pointAtLen(TIE_PTS, cum, p.s);
  const r = (LINE_PX * 1.25) / k;
  return (
    <g opacity={p.op.toFixed(4)}>
      <path d={subPathD(TIE_PTS, cum, Math.max(0, p.s - 44 / k), p.s)} fill="none" stroke={INK} strokeWidth={((LINE_PX * 1.3) / k).toFixed(3)} strokeLinecap="round" />
      <circle cx={at.x.toFixed(3)} cy={at.y.toFixed(3)} r={(2.6 * r).toFixed(3)} fill={INK} opacity={0.1} />
      <circle cx={at.x.toFixed(3)} cy={at.y.toFixed(3)} r={r.toFixed(3)} fill={INK} />
      <circle cx={(at.x - 0.36 * r).toFixed(3)} cy={(at.y - 0.36 * r).toFixed(3)} r={(0.28 * r).toFixed(3)} fill={PAPER} opacity={0.5} />
    </g>
  );
};

const TILE_IDS = Array.from({ length: N_TILES }, (_, i) => i);
const tileSeedOf = (i: number) => 300 + i * 17;

const TiedToTheDataTall: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const br = bracketAt(S);
  const mA = modelAppear(S);

  return (
    <Stage S={S} cam={cam} rest={REST_CAM}>
      {/* the tie: use case -> data */}
      <MWetLine points={TIE_PTS} k={k} strokePx={LINE_PX} len={tieLen(S)} wet={tieWet(S)} bead={tieBead(S)} wetPx={60} />
      <TiePulse S={S} k={k} />

      {/* the use case */}
      <UseCaseFrame S={S} k={k} />

      {/* the model (its eye is drawn last, so it can leave) */}
      <ModelGlyph id="ttdt-model" x={MODEL.x} y={MODEL.y} r={MODEL_R} k={k} S={S} fill={modelFill(S)} tint={1} eye={false} appear={mA} />

      {/* copies leaving the box for the model (under the box's own tiles) */}
      {FEEDS.map(([slot], j) => (
        <DataTile key={`f${j}`} t={feedAt(j, S)} seed={tileSeedOf(slot)} k={k} />
      ))}

      {/* ENOUGH: the amount that is needed */}
      <EnoughBox S={S} k={k} />

      {/* the data */}
      {TILE_IDS.map((i) => (
        <DataTile key={i} t={tileAt(i, S)} seed={tileSeedOf(i)} k={k} />
      ))}

      <Label text="use case" x={USE_LABEL.x} y={USE_LABEL.y} k={k} size="word" minPx={LABEL_PX} appear={enterU(S, USE_WORD_S)} />
      <Label text="data" x={DATA_LABEL.x} y={DATA_LABEL.y} k={k} size="word" minPx={LABEL_PX} anchor="start" appear={enterU(S, DATA_WORD_S)} />
      <Label text="enough" x={ENOUGH_LABEL.x} y={ENOUGH_LABEL.y} k={k} size="word" minPx={LABEL_PX} anchor="end" appear={enterU(S, ENOUGH_WORD_S)} />
      <Label text="model" x={MODEL_LABEL.x} y={MODEL_LABEL.y} k={k} size="word" minPx={LABEL_PX} anchor="end" appear={enterU(S, MODEL_WORD_S)} />

      {/* the model's eye: in the model, then up round the box onto the target */}
      <EyeBracket x={br.x} y={br.y} size={br.size} k={k} S={S} tight={lockU(S)} solid={eyeSolid(S)} square={eyeSquare(S)} opacity={smoothstep((mA - 0.4) / 0.6)} />
    </Stage>
  );
};

export default TiedToTheDataTall;
