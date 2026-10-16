import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AgentTile,
  CAPTION_Y0,
  CAPTION_Y1,
  CUTS,
  DeadlinePost,
  FPS,
  FRAME_W,
  LightSweep,
  MuseStage,
  POST,
  SIDE_MARGIN,
  TILE,
  TONE_F,
  UnionShadow,
  WeekRail,
  amberBandM,
  camCheck,
  dayX,
  makeClockCam,
  makePoolTrack,
  productPiece,
  restToRest,
  toScreenM,
  tone,
  travel,
  winU,
  type Glide,
} from "../kits/cheeky-pint/museShared";
import { SWEEP, clamp01, labelWidth } from "../kits/cheeky-pint/stoutShared";

// ---------------------------------------------------------------------------
// ByWednesday — cut 4 of Alexandr Wang, "Alex on agentic commerce" (Cheeky Pint S4E03, the Meta episode),
// Cheeky Pint S4 style on the clip's shared module (museShared.tsx; brief out/musecommerce/briefs/BRIEF.md;
// out/musecommerce/WORLD_READY.md). 1080x1920 (9:16), 23.976 fps (24000/1001), opaque.
//
// CHECK LINE: Give the agent a deadline and everything that would arrive later is simply out of the search.
//
// THE LINE: "hey, I need something by Wednesday. So, you know, the agent will only look for things that could
// get to me by Wednesday. But"
// ONSETS (f): hey, -1 · I 5 · need 7 · something 11 · by 17 · Wednesday. 25 · So, 42 · you 50 · know, 57 ·
// the 59 · agent 61 · will 66 · only 69 · look 73 · for 77 · things 80 · that 84 · could 87 · get 89 · to 92 ·
// me 95 · by 97 · Wednesday. 100 · But 111 · (slot ends 112)
// WINDOW: seq 40.082 -> 44.753, span 4.671 s. DURATION = round(4.671 x 23.976) = 112, + 16-frame tail = 128.
//
// ONE MOTION: an amber deadline post comes up out of the delivery week's rail just after Wednesday; the
// columns of parcels beyond it go dark and sink into the rail, and the agent, gliding along under the day
// names, searches only as far as Wednesday. The camera follows it in to Monday - Wednesday.
//
// THE PICTURE (revision 2: recomposed for the vertical frame): the week is a DELIVERY BOARD. Each day is a
// COLUMN of parcel tiles stacked on the rail (MON 2, TUE 4, WED 3, THU 2, FRI 2 = 13). The rail sits BELOW the
// caption strip (screen y ~1290) with the day names under it; the columns rise up through the strip to the
// frame's middle and above. Wide view: the five columns span ~900 px (tiles 150 px). Resolved view: MON-WED +
// the post fill the width (tiles 230 px), the post's head near the top of the frame.
//
// GESTURES (gesture -> words -> frames)
//   f0: the whole week on its rail, thirteen cream parcels in five columns, the amber agent under MON's name;
//     a slow left-to-right drift and creep is running -> f0-56
//   the amber deadline post rises out of its slot in the rail at the WED | THU boundary, to above the tallest
//     column (rest to rest, a long soft landing; fully up f30) -> "I need something by Wednesday" -> f6-30
//   the WED label turns amber by tone as the post tops out -> "Wednesday" (f25) -> f24-36
//   the light slides from the post down to the agent (the quiet words "So, you know") -> f36-56
//   the parcels beyond the post turn board tone, outward and upward from the post (THU f59, f62; FRI f66,
//     f69; 12 f of tone each), and each column sinks into the rail (16 f) -> "the agent will only look" -> f59-82
//   the agent lifts one elevation and glides along under the day names, MON -> TUE -> WED, and settles under
//     Wednesday, short of the post's line -> "the agent will only look for things that could get to me by"
//     -> f56-97; the camera glides left and pushes in (f56-95) to MON-WED + the post
//   THE ONE CLICK: one LightSweep crosses Wednesday's column (one band over its three parcels) as the agent
//     settles under it -> "Wednesday" (f100) -> f94-106
//   f106-127: settled and alive: three days of cream columns, the post closing the right side, Thursday's
//     dark column sunk beyond it; a slow creep in.
// Nothing else.
//
// THE AGENT'S LANE: under the day names (below the caption strip, clear of the labels), as the brief's
// "glides along the rail under MON-WED".
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = CUTS.ByWednesday.duration; // 128
const F_END = DURATION - 1;

export const schema = z.object({
  /** draw the caption strip's bounds (measurement only) */
  strip: z.boolean().default(false),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the world (world px; the rail's top edge is y = 0) ----------------------------------------------
const X0 = 0;
const PITCH = 120;
const X1 = X0 + 5 * PITCH;
const RY = 0;
/** a parcel tile, and the gap between two in a column */
const PT = TILE;
const STACK_GAP = 6;
const STEP = PT + STACK_GAP;
/** parcels per day: the delivery board */
const COUNTS = [2, 4, 3, 2, 2] as const;
const colH = (n: number) => n * PT + (n - 1) * STACK_GAP;
const DAY = (i: number) => dayX(X0, X1, i);
/** how far a late column sinks into the rail (world px) */
const SINK = PT * 0.42;
/** the deadline: the boundary just after WED */
const POST_X = X0 + 3 * PITCH;
/** the post is drawn POST_S larger than the module's (a stouter bar for tiles this size) */
const POST_S = 1.35;
/** above the tallest column, its head clear */
const POST_H = colH(Math.max(...COUNTS)) + 34 + POST.headH * POST_S;
const AGENT = TILE;
/** the agent's lane: under the day names */
const AGENT_TOP = RY + 80;
const AGENT_FLOOR = AGENT_TOP + AGENT;

// --- the clock --------------------------------------------------------------------------------------
const T = {
  post: [6, 30],
  wed: 24,
  /** [day] -> the frame each of its parcels turns, bottom to top */
  late: { 3: [59, 62], 4: [66, 69] } as Record<number, readonly number[]>,
  sinkF: 16,
  agent: [56, 97],
  sweep: [94, 106],
} as const;

// --- the camera (look = the world point on the frame's middle) ------------------------------------------
const K0 = 1.5; // tiles 144 px, the five columns 864 px (creeping to 147 / 881: MON's name keeps its 90 px margin)
const K1 = 2.4; // tiles 230 px
/** the rail's top edge on screen: under the caption strip */
const RAIL_SY = 1290;
/** MON's left edge on screen in the resolved view */
const END_LEFT = 92;
const START = { x: (X0 + X1) / 2 - 14, y: RY - (RAIL_SY - 960) / K0, k: K0 };
const END = { x: DAY(0) - PT / 2 + (FRAME_W / 2 - END_LEFT) / K1, y: RY - (RAIL_SY - 960) / K1, k: K1 };
const DRIFT = 10;
const CREEP0 = 1.02;
const GLIDES: Glide[] = [
  // f0-56: the drift left to right and a creep in, already running at f0
  { f0: -30, f1: 60, dx: DRIFT, dy: (RAIL_SY - 960) / K0 - (RAIL_SY - 960) / (K0 * CREEP0), k: K0 * CREEP0 },
  // f56-95: glides left and pushes in with the agent to MON-WED + the post
  { f0: 56, f1: 95, dx: END.x - START.x - DRIFT, dy: END.y - (RY - (RAIL_SY - 960) / (K0 * CREEP0)), k: K1, warp: 1.15 },
  // the tail: a slow creep in (the rail holds its line)
  { f0: 98, f1: F_END + 30, dx: -2, dy: (RAIL_SY - 960) / K1 - (RAIL_SY - 960) / (K1 * 1.03), k: K1 * 1.03 },
];
const CAM = makeClockCam(START, GLIDES, F_END + 2);
export const CAM_CHECK = camCheck(CAM.at, 0, F_END);

/** the day names' size (SCREEN px): 64 wide (cap 46), 88 after the push (cap 63) */
const labelPx = (k: number) => 64 + ((k - K0) / (K1 - K0)) * 24;
/** the day names' bottom under the rail (world px; WeekRail: LEDGE_H 7 + a 12 px tick + 16 px + the caps) */
const labelBottom = (k: number) => 7 + (12 + 16 + labelPx(k) * 0.718) / k;

// --- the light pool -----------------------------------------------------------------------------------
const POOL = makePoolTrack(
  { x: DAY(1), y: RY - 170 },
  [
    { f0: 2, f1: 28, x: POST_X - 20, y: RY - 300 }, // up the post as it rises
    { f0: 36, f1: 56, x: DAY(0) + 30, y: RY + 40 }, // down to the agent
    { f0: 58, f1: 98, x: DAY(2) - 20, y: RY - 130 }, // with the agent to Wednesday
  ],
  F_END + 2,
);

// --- the agent ----------------------------------------------------------------------------------------
const agentAt = (f: number) => travel({ x: DAY(0), y: AGENT_FLOOR }, { x: DAY(2), y: AGENT_FLOOR }, f, T.agent[0], T.agent[1], { p: 2.2, settleFrom: 0.78 });

// --- load-time checks: the camera caps, the rail and the names under the caption strip, the side margins ---
{
  const fail = (m: string): never => {
    throw new Error(`ByWednesday: ${m}`);
  };
  if (CAM_CHECK.maxA > 2.5) fail(`camera |dv| ${CAM_CHECK.maxA.toFixed(2)} px/f^2 at f${CAM_CHECK.atA}`);
  if (CAM_CHECK.maxV > 45) fail(`camera ${CAM_CHECK.maxV.toFixed(1)} px/f at f${CAM_CHECK.atV}`);
  for (let f = 0; f <= F_END; f++) {
    const c = CAM.at(f);
    // the rail (and so the names under it) stays under the caption strip
    const rail = toScreenM(c, 0, RY).y;
    if (rail < CAPTION_Y1 + 4) fail(`the rail is at y ${rail.toFixed(0)} on f${f}`);
    // the agent stays clear of the names above it and of the frame's foot
    const a = agentAt(f);
    if (AGENT_TOP - 6 - labelBottom(c.k) < 12 / c.k) fail(`the agent touches the day names on f${f}`);
    if (toScreenM(c, 0, AGENT_FLOOR).y > 1800) fail(`the agent's foot is at y ${toScreenM(c, 0, AGENT_FLOOR).y.toFixed(0)} on f${f}`);
    // MON's name inside the side margin (MON is always in frame)
    const mon = toScreenM(c, DAY(0), 0).x - labelWidth("MON", labelPx(c.k)) / 2;
    // (the full margin in both held framings; while the camera travels between them it may dip a few px)
    if (mon < (f <= T.agent[0] || f >= T.agent[1] ? SIDE_MARGIN : SIDE_MARGIN - 12)) fail(`MON's name starts at x ${mon.toFixed(0)} on f${f}`);
    // neighbouring names never touch
    if (PITCH * c.k - labelWidth("MON", labelPx(c.k)) < 20) fail(`the day names touch on f${f}`);
    // the agent never passes the post's line
    if (a.x + AGENT / 2 > POST_X - (POST.w * POST_S) / 2) fail(`the agent passes the post on f${f}`);
    // the post's head stays inside the frame
    if (toScreenM(c, 0, RY - POST_H).y < 60) fail(`the post's head is at y ${toScreenM(c, 0, RY - POST_H).y.toFixed(0)} on f${f}`);
  }
  const c0 = CAM.at(0);
  if (toScreenM(c0, DAY(4) + PT / 2, 0).x > FRAME_W - 40 || toScreenM(c0, DAY(0) - PT / 2, 0).x < 40) fail("the week is not whole in frame at f0");
}

// --- a parcel of a column: a parcel tile `up` above the rail, clipped at the rail's top edge (a late column
// sinks into its slot), one shadow
const PARCEL_PIECE = productPiece("parcel", PT);
const RailParcel: React.FC<{ x: number; up: number; k: number; dim: number; sink: number }> = ({ x, up, k, dim, sink }) => {
  const uid = `bw${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const clip = { x: x - 4000, y: RY - 8000, w: 8000, h: 8000 };
  const bottom = RY - up + sink;
  if (bottom - PT >= RY) return null;
  const r = PARCEL_PIECE.render({ cx: x, bottom, s: 1, k, dim: clamp01(dim), uid });
  return (
    <g>
      <defs>
        <clipPath id={`${uid}cl`}>
          <rect x={clip.x} y={clip.y} width={clip.w} height={clip.h} />
        </clipPath>
      </defs>
      <UnionShadow sil={r.sil.map((q) => ({ ...q, clip }))} contact={up === 0 ? { x, y: RY, w: PT } : null} />
      <g clipPath={`url(#${uid}cl)`}>{r.body}</g>
    </g>
  );
};

const ByWednesday: React.FC<Props> = ({ strip }) => {
  const f = useCurrentFrame();
  const cam = CAM.at(f);
  const k = cam.k;
  const band = amberBandM(cam);
  const pool = POOL(f);

  const postRise = restToRest(winU(f, T.post[0], T.post[1]), 2.2);
  const wedAmber = 1 - tone(f, T.wed, 1, 0, TONE_F);
  const agent = agentAt(f);

  // THE ONE CLICK: ONE band crossing Wednesday's column (each parcel clips its own stretch of the same band)
  const st = winU(f, T.sweep[0], T.sweep[1]);
  const sweepBand = SWEEP.band / k;
  const tan = Math.tan((SWEEP.angle * Math.PI) / 180);
  const skew1 = tan * PT;
  const wedL = DAY(2) - PT / 2;
  const wedH = colH(COUNTS[2]);
  // the band's centre on the rail's line
  const sweepX = (wedL - sweepBand - tan * wedH) * (1 - st) + (wedL + PT + sweepBand) * st;
  const sweepT = (up: number) => (sweepX + tan * up - (wedL - sweepBand - skew1)) / (PT + 2 * sweepBand + 2 * skew1);

  return (
    <AbsoluteFill>
      <MuseStage S={f} cam={cam} rest={CAM.rest} pool={{ x: pool.x, y: pool.y, strength: pool.strength }}>
        <WeekRail
          x0={X0}
          x1={X1}
          y={RY}
          k={k}
          px={labelPx(k)}
          amber={[0, 0, wedAmber, 0, 0]}
          slots={[[POST_X, POST.headW * POST_S], ...COUNTS.map((_, d) => [DAY(d), PT] as [number, number])]}
        />
        {COUNTS.map((n, d) => {
          const late = T.late[d];
          const sink = late ? SINK * restToRest(winU(f, late[0], late[0] + T.sinkF), 2.2) : 0;
          return Array.from({ length: n }, (_, j) => <RailParcel key={`${d}-${j}`} x={DAY(d)} up={j * STEP} k={k} dim={late ? tone(f, late[j], 0, 1) : 0} sink={sink} />);
        })}
        {st > 0 && st < 1
          ? Array.from({ length: COUNTS[2] }, (_, j) => <LightSweep key={j} x={wedL} y={RY - j * STEP - PT} w={PT} h={PT} k={k} t={sweepT(j * STEP)} on="cream" />)
          : null}
        <g transform={`translate(${POST_X} ${RY}) scale(${POST_S})`}>
          <DeadlinePost x={0} baseY={0} k={k * POST_S} rise={postRise} H={POST_H / POST_S} band={[(band[0] - RY) / POST_S, (band[1] - RY) / POST_S]} />
        </g>
        <AgentTile x={agent.x} floor={agent.y} k={k} size={AGENT} band={band} lift={agent.lift} slot={false} />
      </MuseStage>
      {strip ? (
        <AbsoluteFill>
          <div style={{ position: "absolute", left: 0, right: 0, top: CAPTION_Y0, height: CAPTION_Y1 - CAPTION_Y0, border: "2px dashed rgba(243,235,221,0.5)" }} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

export default ByWednesday;
