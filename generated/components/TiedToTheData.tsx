import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DataFrame,
  INK,
  INK_HI,
  InkDiffuse,
  MLabel,
  MStage,
  MWetLine,
  ModelGlyph,
  PAPER,
  RED,
  TargetSeal,
  clamp01,
  cumLen,
  enterU,
  framePoints,
  lerp,
  mStrokePx,
  pointAtLen,
  smoothstep,
  subPathD,
  targetColor,
} from "./mavenShared";
import {
  BR_LOCK_SIDE,
  COL_X,
  DATA_LABEL,
  DATA_WORD_S,
  DURATION,
  ENOUGH_LABEL,
  ENOUGH_WORD_S,
  FPS,
  FRAME_H,
  FRAME_W,
  FRAME_X,
  FRAME_Y,
  LINE_X0,
  LINE_X1,
  LINE_Y,
  MODEL,
  MODEL_LABEL,
  MODEL_R,
  MODEL_WORD_S,
  N_TILES,
  OPS_SEED,
  OPS_TX,
  OPS_TY,
  REST_CAM,
  SEAL,
  SEAL_SIDE,
  TIE_PTS,
  TILE,
  TILE_H,
  USE_LABEL,
  bracketAt,
  camAt,
  eyeSolid,
  eyeSquare,
  frameDraw,
  frameWet,
  lineDraw,
  lineSolid,
  lockU,
  modelFill,
  pulseAt,
  sealUp,
  tieBead,
  tieLen,
  tieWet,
  tileAt,
} from "./TiedToTheDataGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// TiedToTheData -- Bharat, "Project Maven's data problem" (ChinaTalk), cut D of
// 5, the clip's payoff. LANDSCAPE 1920x1080, 24 fps, opaque, on mavenShared.
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
// with the same seal (RED); the model's dashed expected square turns solid.
//
// ONE MOTION, left to right and back: the use case sends a line to the data,
// the data piles up until it is enough, and the model that comes out of it goes
// back and finds the target. Three stations on one axis: THE USE CASE (B's
// OPERATIONS frame, 520 world px), THE DATA (a column of 104 px frames that is
// pushed up from its foot, under a dashed ENOUGH level) and THE MODEL. Five
// element types: frame, seal, bracket/model, line, labels. Geometry, clocks and
// the camera live in TiedToTheDataGeom.ts.
//
// GESTURES (gesture -> word -> local frames)
// 1. "understanding the use case" (f0-34): open CLOSE on the use-case frame
//    (~770 px wide on frame 0), its outline still being written (left edge wet,
//    bead, done f13) and the camera creeping in toward the deep-red seal
//    (glide 1, S -16..38, k 1.48 -> 1.575). `USE CASE` lands f28 (use 26 / case 31).
// 2. "tied to the data" (f28-56): the tie line is written in wet ink from the
//    frame's right edge (S 28..48, bead leading), the camera following the bead
//    to the right (glide 2, S 27..60). It lands on the column's foot just ahead
//    of "data" (f50): the first data frame is written there (S 45..53) and
//    stamped with the use case's seal (S 48..55); `DATA` lands f50 under the foot.
// 3. "and then getting enough of it" (f50-83): frames ride the tie line from
//    the use case (arrivals 58.5, 63.5, 68.5, 73.5, then 78.5, 83.5, 88.5; each
//    written in wet ink as it leaves, stamped as it arrives) and slide in under
//    the stack, which is pushed up one place each time. The dashed ENOUGH level
//    opens from the column outward (S 56..68), `ENOUGH` lands f75 (enough 77);
//    the fifth frame puts the stack's top under the level at S 71.5 and the
//    dashed line turns solid from the stack outward (S 71.5..82.5). The camera
//    eases back to hold the column and the model (glide 3, S 52..96, k -> 1.32).
// 4. "to build performant models" (f70-135): every further frame pushes the top
//    one over the level and it arcs into the model (three, individual arcs,
//    arriving 89.5 / 94.5 / 99.5, around "build" 96, where `MODEL` lands above
//    the glyph); the model's wash rises
//    red-tinted one step each (full S ~104) and its eye's dashed square turns
//    solid red (S 94.5..104.5). Then ONE arc: the bracket comes out of the model
//    (S 100..129, smoothstep), back across the data (its centre passes over one
//    data frame's seal) into the use-case frame; its own red square fades over
//    6 f as it closes in (S 120..126); meanwhile the camera pulls back to the WIDE
//    (glide 4, S 99..131, k -> 1.2, all three stations centred). It reaches the
//    seal and LOCKS (corners tighten S 124..132) and the seal comes up from
//    RED_DEEP to vermilion with its paper shadow (one crossfade, S 123..135,
//    half-way on "models" f129-130).
// 5. the held breath (f132-144): the locked bracket is perfectly still; one ink
//    bead travels slowly along the tie line (S 124..154) and the camera drifts in
//    very slightly (glide 5, k 1.2 -> 1.235).
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** screen stroke of the lines of this cut (the tie line, the level) */
const LINE_PX = 5;
/** screen stroke of the small data frames */
const TILE_PX = 3.4;
/** screen stroke of the bracket, in the model and out of it */
const BRACKET_PX = 4.3;
/** the seal's side inside a data frame (bigger than a field tile's, so the red reads small) */
const TILE_SEAL = TILE * 0.19;

/** A warm paper shadow whose strength follows `u` (red elements only). */
const shadowOf = (k: number, u: number) =>
  u > 0.01 ? `drop-shadow(0 ${(4 / k).toFixed(3)}px ${(8 / k).toFixed(3)}px rgba(70,35,15,${(0.16 * clamp01(u)).toFixed(4)}))` : undefined;

/** THE USE CASE: B's OPERATIONS frame. mavenShared's DataFrame draws the wash
 *  and the terrain; its outline is masked out and written here in wet ink (so
 *  the last edge can still be wet on frame 0), and the seal is drawn here so it
 *  can come up from RED_DEEP with its shadow in one crossfade. */
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
        <mask
          id="ttd-frame-mask"
          maskUnits="userSpaceOnUse"
          x={FRAME_X - FRAME_W / 2 - pad}
          y={FRAME_Y - FRAME_H / 2 - pad}
          width={FRAME_W + 2 * pad}
          height={FRAME_H + 2 * pad}
        >
          <rect x={FRAME_X - FRAME_W / 2 - pad} y={FRAME_Y - FRAME_H / 2 - pad} width={FRAME_W + 2 * pad} height={FRAME_H + 2 * pad} fill="#FFFFFF" />
          <path d={`${subPathD(closed, cum, 0, total)}Z`} fill="none" stroke="#000000" strokeWidth={((sp + 2.5) / k).toFixed(3)} strokeLinejoin="round" />
        </mask>
      </defs>
      <g mask="url(#ttd-frame-mask)">
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

/** The ENOUGH level: a dashed ink line (dashed = expected) that opens from the
 *  column outward and, once the stack reaches it, turns SOLID from the stack
 *  outward (solid = what happened). */
const LevelLine: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const dr = lineDraw(S);
  if (dr <= 0.002) return null;
  const half = (LINE_X1 - LINE_X0) / 2;
  const reach = half * dr;
  const solid = Math.min(reach, half * lineSolid(S));
  const w = LINE_PX / k;
  const dash = 17 / k;
  const gap = 13 / k;
  const march = ((S * 0.5) / k) % (dash + gap);
  const y = LINE_Y.toFixed(3);
  return (
    <g fill="none" stroke={INK} strokeOpacity={INK_HI} strokeWidth={w.toFixed(3)} strokeLinecap="round">
      {reach - solid > 0.5 ? (
        <g strokeDasharray={`${dash.toFixed(3)} ${gap.toFixed(3)}`} strokeDashoffset={march.toFixed(3)} strokeLinecap="butt">
          <path d={`M${(COL_X - reach).toFixed(3)} ${y}L${(COL_X - solid).toFixed(3)} ${y}`} />
          <path d={`M${(COL_X + reach).toFixed(3)} ${y}L${(COL_X + solid).toFixed(3)} ${y}`} />
        </g>
      ) : null}
      {solid > 0.5 ? <path d={`M${(COL_X - solid).toFixed(3)} ${y}L${(COL_X + solid).toFixed(3)} ${y}`} /> : null}
    </g>
  );
};

/** One piece of data on its way: written in wet ink as it leaves the use case,
 *  stamped with the use case's seal as it arrives at the column. */
const DataTile: React.FC<{ i: number; S: number; k: number }> = ({ i, S, k }) => {
  const t = tileAt(i, S);
  if (!t) return null;
  const sx = t.x + (OPS_TX - 0.5) * TILE;
  const sy = t.y + (OPS_TY - 0.5) * TILE_H;
  const under = smoothstep(t.reveal / 0.5);
  const body = (
    <g transform={t.scale !== 1 ? `translate(${t.x.toFixed(3)} ${t.y.toFixed(3)}) scale(${t.scale.toFixed(4)}) translate(${(-t.x).toFixed(3)} ${(-t.y).toFixed(3)})` : undefined}>
      <rect
        x={(t.x - TILE / 2).toFixed(3)}
        y={(t.y - TILE_H / 2).toFixed(3)}
        width={TILE}
        height={TILE_H}
        rx={(TILE_H * 0.05).toFixed(3)}
        fill={PAPER}
        opacity={under.toFixed(4)}
      />
      <DataFrame x={t.x} y={t.y} w={TILE} k={k} seed={300 + i * 17} target="none" reveal={t.reveal} strokePx={TILE_PX * (0.6 + 0.4 * t.scale)} />
      <TargetSeal x={sx} y={sy} side={TILE_SEAL} k={k} grow={t.stamp} />
    </g>
  );
  return (
    <InkDiffuse u={t.diffuse} k={k} cx={t.x} cy={t.y}>
      {body}
    </InkDiffuse>
  );
};

/** THE MODEL'S EYE out of the model (mavenShared's Bracket, copied so the
 *  corners' tightening and the square's dashed -> solid are separate tracks):
 *  four ink corner marks `size` world px a side, tightening to `lockSide` with
 *  `tight`; the red expected square is dashed at `solid` 0 and a solid seal at
 *  `solid` 1; at the lock it grows to the real seal's side and hands over to it. */
const EyeBracket: React.FC<{ x: number; y: number; size: number; k: number; S: number; tight: number; solid: number; square: number }> = ({
  x,
  y,
  size,
  k,
  S,
  tight,
  solid,
  square,
}) => {
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
  const es = lerp(size * 0.3, SEAL_SIDE, tg);
  const eh = es / 2;
  const sl = smoothstep(solid);
  const nDash = 12;
  const period = (es * 4) / nDash;
  const dashLen = period * lerp(0.56, 1.02, sl);
  const march = ((S * 0.9) / k) % period;
  const ew = Math.max(2.2 / k, w * 0.8);
  // the square has faded by the time the corners tighten: only the real seal is red at the lock
  const sqOp = clamp01(square);
  return (
    <g>
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
  const tail = 70 / k;
  return (
    <g opacity={p.op.toFixed(4)}>
      <path
        d={subPathD(TIE_PTS, cum, Math.max(0, p.s - tail), p.s)}
        fill="none"
        stroke={INK}
        strokeWidth={((LINE_PX * 1.3) / k).toFixed(3)}
        strokeLinecap="round"
      />
      <circle cx={at.x.toFixed(3)} cy={at.y.toFixed(3)} r={(2.6 * r).toFixed(3)} fill={INK} opacity={0.1} />
      <circle cx={at.x.toFixed(3)} cy={at.y.toFixed(3)} r={r.toFixed(3)} fill={INK} />
      <circle cx={(at.x - 0.36 * r).toFixed(3)} cy={(at.y - 0.36 * r).toFixed(3)} r={(0.28 * r).toFixed(3)} fill={PAPER} opacity={0.5} />
    </g>
  );
};

const TILE_IDS = Array.from({ length: N_TILES }, (_, i) => i);

const TiedToTheData: React.FC<Props> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;
  const br = bracketAt(S);

  return (
    <MStage S={S} cam={cam} rest={REST_CAM}>
      {/* the tie: use case -> data */}
      <MWetLine points={TIE_PTS} k={k} strokePx={LINE_PX} len={tieLen(S)} wet={tieWet(S)} bead={tieBead(S)} />
      <TiePulse S={S} k={k} />

      {/* ENOUGH: the expected level */}
      <LevelLine S={S} k={k} />

      {/* the use case */}
      <UseCaseFrame S={S} k={k} />

      {/* the model (its eye is drawn below, so it can leave) */}
      <ModelGlyph id="ttd-model" x={MODEL.x} y={MODEL.y} r={MODEL_R} k={k} S={S} fill={modelFill(S)} tint={1} eye={false} />

      {/* the data */}
      {TILE_IDS.map((i) => (
        <DataTile key={i} i={i} S={S} k={k} />
      ))}

      <MLabel text="use case" x={USE_LABEL.x} y={USE_LABEL.y} k={k} appear={enterU(S, 28)} />
      <MLabel text="data" x={DATA_LABEL.x} y={DATA_LABEL.y} k={k} appear={enterU(S, DATA_WORD_S)} />
      <MLabel text="model" x={MODEL_LABEL.x} y={MODEL_LABEL.y} k={k} appear={enterU(S, MODEL_WORD_S)} />
      <MLabel text="enough" x={ENOUGH_LABEL.x} y={ENOUGH_LABEL.y} k={k} anchor="end" appear={enterU(S, ENOUGH_WORD_S)} />

      {/* the model's eye: in the model, then back along the tie onto the target */}
      <EyeBracket x={br.x} y={br.y} size={br.size} k={k} S={S} tight={lockU(S)} solid={eyeSolid(S)} square={eyeSquare(S)} />
    </MStage>
  );
};

export default TiedToTheData;
