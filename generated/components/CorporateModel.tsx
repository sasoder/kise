import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACT_A_POOL_STRENGTH,
  CAPTION_Y,
  FLOOR,
  FPS,
  FRAME_W,
  MJPillar,
  MX,
  MercJobWorld,
  REST_STATE_B,
  TILE,
  TILE_TOP,
  TOP_CLEAR,
  TOTO_H,
  TOTO_HOME,
  WX,
  camCheckL,
  entranceOf,
  makeClockCam,
  makePoolTrack,
  restToRest,
  toScreenL,
  type Cam,
  type Glide,
  type WorldState,
} from "./mercJobShared";
import { ALPHA, COLOR, STROKE, clamp01, easeOutCubic, smoothstep } from "./stoutShared";

// ---------------------------------------------------------------------------
// CorporateModel — an extra cut of Toto Wolff, "how he got the Mercedes job" (Cheeky Pint S4E01), Cheeky
// Pint S4 style on the clip's one 9:16 world (mercJobShared.tsx). 1080x1920, 24 fps, opaque.
//
// THE LINE: "(we) think our model, the corporate running a Formula One team, doesn't function"
// (before: "So eventually they came back and said, we"; after: "because it needs to be much more
// entrepreneurially led ... we want you to run this")
// WINDOW: seq 45.56 -> 49.80, span 4.24 s. DURATION = round(4.24 x 24) = 102, + 16-frame tail = 118.
// STORY CLOCK: its own, S = f (0 .. 117); adjacent to no other cut, so it opens on a fresh rest state
// of the world (both tiles cream, no bars, Toto at HOME, the industry not drawn).
// ONSETS (f): think 0 · our 9 · model 16 · (the) 32 · corporate 37 · running 55 · Formula 70 · One 75 ·
// team 77 · doesn't 82 · function 88 · ends 102.
//
// ONE MOTION: the corporate runs the team, and the line breaks.
// GESTURES (gesture -> word -> frames)
//   f0: the pair at its floor (Williams fully in frame, Toto amber at HOME, the listener, beside
//     Mercedes); a slow creep runs UPWARD from f0 (f-24 -> f40), the frame gaining headroom above the
//     tiles -> "think our model" -> f0-30
//   the CORPORATE tile (a cream card 1.3x the team tiles, Lucide building-2 knocked out, no text) settles
//     in high over the pair: fade-rise 24 px at FLOAT elevation (its own shadow), f30 -> f44; the pool
//     rises onto it -> "corporate" (f37)
//   one cream reporting line (the set's RULE) draws DOWN from the corporate tile's bottom edge, across,
//     and down into the Mercedes tile's top edge (an org-chart elbow: the corporate tile is the column's
//     centre, Mercedes its right), decelerating, landing f78; the pool follows it down onto Mercedes ->
//     "running Formula One team" (f55-77)
//   THE CLICK: the line SNAPS at its midpoint (f84): the two halves retract 16 world px toward their
//     tiles, decelerating, and stop (f84-94); no bounce, spark, flash or sweep -> "doesn't" (f82)
//   the Mercedes tile tones cream -> board over 12 f, the line's end having left it -> "function"
//     (f88) -> f90-102
//   the camera: after the rise, a slow push (k 2.30 -> 2.36, f36-122) through the tail. End picture: the corporate
//     tile above, two broken stubs, Mercedes dimmed, Toto amber.
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = 118;

// --- the corporate tile and the reporting line (world px) -----------------------------------------
/** The column's centre: the pair's centre (Williams' left edge to Mercedes' right edge). */
const CX = (WX - TILE / 2 + MX + TILE / 2) / 2; // 1866
export const CORP = { x: CX, size: 1.3 * TILE, top: 120 } as const;
const CORP_BOTTOM = CORP.top + CORP.size; // 244.8
/** The elbow: down from the corporate tile, across to Mercedes, down into its top edge. */
const ELBOW_Y = 360;
const PTS: [number, number][] = [
  [CX, CORP_BOTTOM],
  [CX, ELBOW_Y],
  [MX, ELBOW_Y],
  [MX, TILE_TOP],
];
const SEG = PTS.slice(1).map((p, i) => Math.hypot(p[0] - PTS[i][0], p[1] - PTS[i][1]));
const LEN = SEG.reduce((a, b) => a + b, 0);
const MID = LEN / 2;
/** The polyline between arc lengths s0 and s1 (sharp, org-chart corners). */
const subPath = (s0: number, s1: number) => {
  if (s1 - s0 < 0.05) return null;
  const at = (s: number): [number, number] => {
    let acc = 0;
    for (let i = 0; i < SEG.length; i++) {
      if (s <= acc + SEG[i] || i === SEG.length - 1) {
        const t = clamp01((s - acc) / SEG[i]);
        return [PTS[i][0] + (PTS[i + 1][0] - PTS[i][0]) * t, PTS[i][1] + (PTS[i + 1][1] - PTS[i][1]) * t];
      }
      acc += SEG[i];
    }
    return PTS[PTS.length - 1];
  };
  const pts: [number, number][] = [at(s0)];
  let acc = 0;
  for (let i = 0; i < SEG.length - 1; i++) {
    acc += SEG[i];
    if (acc > s0 && acc < s1) pts.push(PTS[i + 1]);
  }
  pts.push(at(s1));
  return `M${pts.map(([x, y]) => `${(Math.round(x * 1000) / 1000).toString()} ${(Math.round(y * 1000) / 1000).toString()}`).join("L")}`;
};

// --- the gestures on the clock --------------------------------------------------------------------
export const GEST = {
  corpIn: [30, 44], // "corporate" f37
  draw: [52, 78], // "running Formula One team": lands with "team" f77
  snap: 84, // "doesn't" f82: the click
  retract: [84, 94],
  mercDim: [90, 102], // "function" f88
} as const;
const RETRACT = 16;
const winU = (S: number, w: readonly [number, number]) => (S - w[0]) / (w[1] - w[0]);
const drawnAt = (S: number) => LEN * restToRest(winU(S, GEST.draw), 2.5);
const gapAt = (S: number) => (S < GEST.snap ? 0 : RETRACT * easeOutCubic(winU(S, GEST.retract)));

// --- the camera (look = the world point on screen (540, 835)) -------------------------------------
/** f0: the pair at its floor, centred (tiles ~223 px). */
const LOOK_OPEN = { x: CX, y: (TILE_TOP + FLOOR) / 2, k: 2.32 };
/** The column: the corporate tile's top to the floor, centred (Mercedes ~221-227 px). */
const LOOK_COL = { y: 364, k: 2.3 };
const GLIDES: Glide[] = [
  // f-24 -> f40: the slow creep upward (already moving on f0), gaining headroom above the tiles as the corporate tile arrives
  { f0: -24, f1: 40, dy: LOOK_COL.y - LOOK_OPEN.y, k: LOOK_COL.k },
  // f36 -> f122: the slow push in on the column, easing toward Mercedes (through the line, the snap and the tail)
  { f0: 36, f1: 122, dx: 3, dy: 3, k: 2.36 },
];
const CAM = makeClockCam(LOOK_OPEN, GLIDES, DURATION + 2);
export const camAt = CAM.at;
export const CAM_CHECK = camCheckL(CAM.at, 0, DURATION - 1);

// --- the pool -------------------------------------------------------------------------------------
const poolAt = makePoolTrack(
  { x: (TOTO_HOME.x + MX) / 2, y: FLOOR - 40 },
  [
    { S0: 26, S1: 46, x: CX, y: CORP.top + CORP.size / 2 }, // up onto the corporate tile
    { S0: 52, S1: 80, x: (CX + MX) / 2, y: (ELBOW_Y + TILE_TOP) / 2 }, // down the line onto Mercedes
    { S0: 86, S1: 112, x: (CX + MX) / 2, y: (CORP.top + FLOOR) / 2, spread: 1.2 }, // after the snap: the whole picture
  ],
  DURATION + 2,
);

// --- the state ------------------------------------------------------------------------------------
const stateAt = (S: number): WorldState => ({
  ...REST_STATE_B,
  row: null,
  mercDim: smoothstep(winU(S, GEST.mercDim)),
});

const Column: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  const k = cam.k;
  const en = entranceOf(clamp01(winU(S, GEST.corpIn)));
  const drawn = drawnAt(S);
  const gap = gapAt(S);
  const sw = (STROKE.RULE / k).toString();
  const line = (d: string | null, key: string) =>
    d ? <path key={key} d={d} fill="none" stroke={COLOR.inkCream} strokeOpacity={ALPHA.glassHi} strokeWidth={sw} strokeLinecap="butt" strokeLinejoin="miter" /> : null;
  const parts =
    S < GEST.snap ? [line(subPath(0, drawn), "a")] : [line(subPath(0, MID - gap), "a"), line(subPath(MID + gap, LEN), "b")];
  return (
    <g>
      {parts}
      {en.opacity > 0.002 ? (
        <g opacity={en.opacity < 1 ? (Math.round(en.opacity * 1000) / 1000).toString() : undefined} transform={en.lift > 0.01 ? `translate(0 ${(Math.round((en.lift / k) * 1000) / 1000).toString()})` : undefined}>
          <MJPillar x={CORP.x} floor={CORP_BOTTOM} k={k} tile={CORP.size} mark="building" elevation="float" />
        </g>
      ) : null}
    </g>
  );
};

export const CorporateWorld: React.FC<{ S: number }> = ({ S }) => {
  const cam = camAt(S);
  const p = poolAt(S);
  return (
    <MercJobWorld S={S} cam={cam} rest={CAM.rest} pool={{ x: p.x, y: p.y, spread: p.spread, strength: ACT_A_POOL_STRENGTH }} state={stateAt(S)}>
      <Column S={S} cam={cam} />
    </MercJobWorld>
  );
};

// --- load-time checks: the camera caps, the caption band, the top clearance, the side margins, the
// Mercedes tile's size in the column ---------------------------------------------------------------
{
  const probe = (globalThis as { __MJ_PROBE__?: string[] }).__MJ_PROBE__;
  const rule = (ok: boolean, m: string) => {
    if (ok) return;
    if (probe) probe.push(m);
    else throw new Error(`CorporateModel: ${m}`);
  };
  rule(CAM_CHECK.maxA <= 2.5, `camera |dv| ${CAM_CHECK.maxA.toFixed(2)} at S ${CAM_CHECK.atA}`);
  rule(CAM_CHECK.maxV <= 45, `camera ${CAM_CHECK.maxV.toFixed(1)} px/f at S ${CAM_CHECK.atV}`);
  for (let S = 0; S < DURATION; S++) {
    const c = camAt(S);
    rule(toScreenL(c, MX, FLOOR + 4).y + 5 <= CAPTION_Y, `the floor at y ${toScreenL(c, MX, FLOOR + 4).y.toFixed(0)} on S ${S}`);
    if (S >= GEST.corpIn[0]) rule(toScreenL(c, CX, CORP.top).y >= TOP_CLEAR, `the corporate tile's top at y ${toScreenL(c, CX, CORP.top).y.toFixed(0)} on S ${S}`);
    const l = toScreenL(c, WX - TILE / 2, 0).x;
    const r = FRAME_W - toScreenL(c, MX + TILE / 2, 0).x;
    rule(Math.min(l, r) >= 64, `side margin ${Math.min(l, r).toFixed(0)} px on S ${S}`);
    if (S >= GEST.draw[0]) rule(TILE * c.k >= 220 && TILE * c.k <= 250, `Mercedes ${(TILE * c.k).toFixed(0)} px on S ${S}`);
  }
  rule(Math.abs(TOTO_HOME.x - TOTO_H / 2 - (WX + TILE / 2)) > 10, "Toto at HOME clear of Williams");
}

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const CorporateModel: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <CorporateWorld S={frame} />
    </AbsoluteFill>
  );
};

export default CorporateModel;
