// ---------------------------------------------------------------------------
// OneOrTwoVsEight (zach-superpower, cut 74). Core memory podcast style (styles/core-memory.md).
// Opaque 1080x1920, 23.976 fps, 183 frames.
// The graphic standard: flat white glyphs on their hard black shadow on squared paper. Chain echo once, at the
// payoff. Core Memory edits carry burned-in captions: no label for what the speaker says.
//
// CHECK LINE: "America's one or two different companies are the ones that actually take off; China's eight are the
// same copy, stamped out from the top down, and they stay on the ground."
//
// THE LINE (Zach Shore, Hermeus): "And those are the things that allow us to have one or two companies that have a
// higher probability of succeeding against eight companies that are just top-down copying."
// WORD -> FRAME (local, Whisper, may run ~0.2 s early): And f-2 · those are the things f3-f20 · that allow us to
//   have f20-f52 · ONE f52 · or TWO f62 · companies f67-f76 · that have a HIGHER PROBABILITY f91-f103 · of
//   SUCCEEDING f109-f115 · AGAINST f115 · EIGHT f129 · companies f137-f146 · that are just TOP-DOWN f157-f167 ·
//   COPYING f167-f174 · END f183.
// DURATION: the slot 74.3242 -> 81.9569 s (sequence frames 1782 -> 1965) = 7.633 s x 23.976 = 183 frames (f0..f182).
//
// THE MOTION (layout and numbers in oneOrTwoPlan.ts; director's review v1 applied). One camera move, one world.
//   f0-f90: CLOSE on America's two, standing side by side on their rule: the Falcon 9 (SPACEX print, ~790-830 px
//   tall) and the Hermeus jet (side view, mirrored nose-left, scaled up as a symbol to 45 % of the rocket's height),
//   the pair ~65 % of the frame width. A slow drift in (k 2.26 -> 2.40); the eye is nudged onto the rocket for
//   "one" (f52) and onto the jet for "two" (f62). Life: the fuelled rocket vents a small puff of vapour at the
//   interstage every 17 frames.
//   f74-f108: the jet rolls left, rotates and climbs away up-left at a shallow 30 deg (it stays a jet), leaving
//   frame left by ~f106 and laying down a short dashed contrail that thins with age. The Falcon 9 lifts off at
//   f91 straight up, its three-tongue flame coming out of the engines as they clear the rule; the camera pulls
//   back with it (k never more than keeps its nose 120 px under the top edge).
//   f102-f146: on "against" (f115) the pull-back carries on into a pan right to the resolved frame (k 0.82).
//   China's rule runs out from under the first copy as it lands, never alone, and eight IDENTICAL copies of one
//   rocket (the Falcon 9's bare silhouette, kept only its black interstage band so the row reads as rockets, not a
//   picket fence) fall tail-first from above the frame top, one every 4.8 frames left to right (landings f132 /
//   136.8 / 141.6 / 146.4 / 151.2 / 156 / 160.8 / 165.6: the eighth lands just before "copying" f167), each a
//   CHAIN ECHO drop (coreLeads: the white core leads, orange / purple / blue trail 22 px apart above it and close
//   up under it over 6 frames after it lands).
//   f146-f182: the resolved frame, a slow creep (k 0.82 -> 0.81): the Falcon 9 still climbing on its flame in the
//   upper left (base screen y 734 -> 514), America's empty rule under it, the eight copies standing in a perfect
//   row on China's rule (screen x ~360-1000, y ~760-1040). The jet and its contrail are out of shot by then.
//   Nothing fades. Nothing readable enters the caption bands at any frame (checked per frame from the plan).
// CONTACT: the flame touches the engines from the first frame it shows (f92); each copy's core lands dead on the
//   rule on its landing frame (first reaction: the colours start closing that frame, the rule reaches out).
// CHAIN = COPIES (the clip's legend): only the eight copies wear it, and only while they fall; it closes up under
// the white core as each lands, so at rest a copy is plain white on its shadow. Never on the Falcon 9 or the jet.
//
// SOURCES: none (no figures on screen). Glyphs: the Falcon 9 and its bare silhouette from superpowerRockets.tsx
// (see its header), the Hermeus jet (side view) from zach-shore-trailer/zachShared.tsx.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CHAIN,
  CaptionStripDebug,
  INK,
  PAPER_BASE,
  SHADOW,
  SHADOW_OFF,
  TallPaper,
  WorldTall,
  sway,
} from "../kits/core-memory/deathCountShared";
import { JET_SIDE_D } from "../zach-shore-trailer/zachShared";
import { DIAM_X, F9_GEOM, PX_PER_M, Rocket, RowRule, RuleClip, rocketEchoPath, rocketPath } from "./superpowerRockets";
import {
  COPY_N,
  COPY_X,
  DURATION as PLAN_DURATION,
  F9_LIFT,
  F9_X,
  JET_AIRBORNE,
  PAPER_REST,
  ROCKET_SCALE,
  RULE,
  RULE_B_Y,
  RULE_Y,
  cameraAt,
  copyDrop,
  f9At,
  jetNozzle,
  jetTransform,
  plumeLen,
  ruleBSpan,
} from "./oneOrTwoPlan";

export const FPS = 24000 / 1001;
export const DURATION = 183;
export const schema = z.object({ debugCaptions: z.boolean() });
export const defaultProps = schema.parse({ debugCaptions: false });

if (PLAN_DURATION !== DURATION) throw new Error("OneOrTwoVsEight: the plan's DURATION disagrees");

const ID = "o2v8";
/** the Falcon 9 silhouette at the cut's scale, axis x 0, base y 0 */
const F9_D = rocketPath("falcon9", 0, 0, ROCKET_SCALE);
const F9_ECHO_D = rocketEchoPath("falcon9", 0, 0, ROCKET_SCALE);

// -- the plume ----------------------------------------------------------------------------
// A short chunky flame in the rocket's own frame (base at 0, +y = away from the nose), a sliver of paper
// (PLUME_GAP) below the engines so it reads as its own shape: it flares out wider than the engine skirt, then
// ends in three tongues, the middle one longest. White on its hard shadow.
const PLUME_GAP = 5;
const PLUME_W0 = 12;
const PLUME_W1 = 25;
const plumePath = (len: number) => {
  const L = Math.max(0, len);
  const g = PLUME_GAP;
  const y = (u: number) => (g + u * L).toFixed(2);
  const w0 = PLUME_W0;
  const w1 = PLUME_W1;
  return [
    `M${-w0} ${y(0)}`,
    `C${-w1} ${y(0.08)} ${-w1 * 1.04} ${y(0.3)} ${-w1 * 0.86} ${y(0.5)}`,
    `L${-w1 * 0.7} ${y(0.74)}`, // the left tongue
    `L${-w1 * 0.3} ${y(0.58)}`,
    `L0 ${y(1)}`, // the middle tongue
    `L${w1 * 0.3} ${y(0.58)}`,
    `L${w1 * 0.7} ${y(0.74)}`, // the right tongue
    `L${w1 * 0.86} ${y(0.5)}`,
    `C${w1 * 1.04} ${y(0.3)} ${w1} ${y(0.08)} ${w0} ${y(0)}`,
    "Z",
  ].join(" ");
};

/** THE ORIGINAL in flight: the Falcon 9 (print on) and its plume, pitched about its base. */
const FlyingFalcon9: React.FC<{ frame: number }> = ({ frame }) => {
  const s = f9At(frame);
  const len = plumeLen(frame);
  const t = `translate(${s.x} ${s.y}) rotate(${s.pitch})`;
  const plume = len > 0.5 ? plumePath(len) : null;
  return (
    <g>
      {/* the hard shadows, +4/+4 world px whatever the pitch */}
      <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
        <g transform={t}>
          {plume ? <path d={plume} fill={SHADOW} /> : null}
          <path d={F9_D} fill={SHADOW} />
        </g>
      </g>
      <g transform={t}>
        {plume ? <path d={plume} fill={INK} /> : null}
        <Rocket kind="falcon9" x={0} y={0} scale={ROCKET_SCALE} shadow={false} />
      </g>
    </g>
  );
};

/** THE JET: zachShared's side-view glyph, MIRRORED (nose to the left) and scaled up as a symbol, on its hard
 *  shadow (+4/+4 world px, not mirrored). */
const MirroredJet: React.FC<{ frame: number }> = ({ frame }) => {
  const t = jetTransform(frame);
  return (
    <g>
      <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
        <path d={JET_SIDE_D} transform={t} fill={SHADOW} />
      </g>
      <path d={JET_SIDE_D} transform={t} fill={INK} />
    </g>
  );
};

// -- the contrail -------------------------------------------------------------------------
// Short white dashes laid down behind the jet's nozzle from the moment it leaves the rule, fixed in the world (the
// jet flies on, the trail stays), each thinning with its age to a hairline floor: its flight stays on screen after
// it has left the frame.
const TRAIL_PERIOD = 2; // frames of flight per dash + gap
const TRAIL_DASH = 1.15; // frames of flight a dash covers
const TRAIL_W0 = 6;
const TRAIL_W1 = 2.5;
const TRAIL_THIN_F = 60;
const Contrail: React.FC<{ frame: number }> = ({ frame }) => {
  if (frame <= JET_AIRBORNE + 0.5) return null;
  const dashes: { d: string; w: number }[] = [];
  for (let t0 = JET_AIRBORNE; t0 < frame - 0.6; t0 += TRAIL_PERIOD) {
    const t1 = Math.min(t0 + TRAIL_DASH, frame - 0.6);
    if (t1 <= t0 + 0.05) continue;
    const a = jetNozzle(t0);
    const b = jetNozzle(t1);
    const age = frame - (t0 + t1) / 2;
    const w = TRAIL_W1 + (TRAIL_W0 - TRAIL_W1) * Math.max(0, 1 - age / TRAIL_THIN_F);
    dashes.push({ d: `M${a.x.toFixed(2)} ${a.y.toFixed(2)} L${b.x.toFixed(2)} ${b.y.toFixed(2)}`, w });
  }
  return (
    <g fill="none" strokeLinecap="round">
      <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>
        {dashes.map((q, i) => (
          <path key={i} d={q.d} stroke={SHADOW} strokeWidth={q.w} />
        ))}
      </g>
      {dashes.map((q, i) => (
        <path key={i} d={q.d} stroke={INK} strokeWidth={q.w} />
      ))}
    </g>
  );
};

// -- the vent wisps -------------------------------------------------------------------------
// Before lift-off the fuelled Falcon 9 vents: a small puff of vapour comes out from behind its right edge at the
// interstage every WISP_EVERY frames, drifts off right and up, swells and thins away (a gas, so it may shrink to
// nothing). White on its hard shadow. None starts after lift-off.
const WISP_EVERY = 17;
const WISP_LIFE = 24;
const WISP_H = 41 * 8 * ROCKET_SCALE; // just under the black interstage band, world px above the base
const Wisps: React.FC<{ frame: number }> = ({ frame }) => {
  const s = f9At(frame);
  const out: React.ReactNode[] = [];
  for (let t0 = -WISP_EVERY + 5; t0 < F9_LIFT - 6; t0 += WISP_EVERY) {
    const a = frame - t0;
    if (a < 0 || a > WISP_LIFE) continue;
    const u = a / WISP_LIFE;
    const r = 15 * Math.sin(Math.PI * Math.pow(u, 0.7));
    if (r < 0.4) continue;
    const x = F9_X + 10 + 2.1 * a;
    const y = s.y - WISP_H - 0.9 * a - 4 * Math.sin(a / 5);
    out.push(
      <g key={t0}>
        <circle cx={x + SHADOW_OFF} cy={y + SHADOW_OFF} r={r} fill={SHADOW} />
        <circle cx={x + r * 0.7} cy={y + r * 0.25} r={r * 0.7} fill={SHADOW} transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`} />
        <circle cx={x} cy={y} r={r} fill={INK} />
        <circle cx={x + r * 0.7} cy={y + r * 0.25} r={r * 0.7} fill={INK} />
      </g>,
    );
  }
  return <g>{out}</g>;
};

/** The copies keep ONE mark of the original: its black interstage band (no wordmark, no legs), so the row reads
 *  as eight of the same rocket, not a white picket fence. Black print on white, no shadow. */
const COPY_BAND = true;
const F9_BODY_R = 1.83 * PX_PER_M * ROCKET_SCALE * DIAM_X;
const CopyBand: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const ppm = PX_PER_M * ROCKET_SCALE;
  const [i0, i1] = F9_GEOM.interstage;
  return <rect x={x - F9_BODY_R} y={y - i1 * ppm} width={2 * F9_BODY_R} height={(i1 - i0) * ppm} fill={SHADOW} />;
};

/** ONE COPY: the Falcon 9's bare silhouette falling tail-first onto China's rule (coreLeads: the white core
 *  leads, the three colours trail above it and close up under it once it has landed). */
const FallingCopy: React.FC<{ frame: number; i: number }> = ({ frame, i }) => {
  const d = copyDrop(i, frame);
  if (!d.visible) return null;
  const x = COPY_X[i];
  const y = RULE_B_Y - d.dy;
  const colours = d.closing && d.step > 0.3;
  const mid = `${ID}-copy${i}-out`;
  return (
    <g>
      {colours ? (
        <defs>
          <mask id={mid} maskUnits="userSpaceOnUse" x={x - 400} y={y - 1200} width={800} height={1300}>
            <rect x={x - 400} y={y - 1200} width={800} height={1300} fill="#FFFFFF" />
            <path d={F9_D} transform={`translate(${x} ${y})`} fill="#000000" stroke="#000000" strokeWidth={2} />
          </mask>
        </defs>
      ) : null}
      <path d={F9_D} transform={`translate(${x + SHADOW_OFF} ${y + SHADOW_OFF})`} fill={SHADOW} />
      {colours ? (
        <g mask={`url(#${mid})`}>
          {CHAIN.map((c, n) => {
            const back = 3 - n; // orange 3 steps behind, purple 2, blue 1
            return <path key={c} d={F9_ECHO_D} transform={`translate(${x} ${y - back * d.step})`} fill={c} />;
          })}
        </g>
      ) : null}
      <Rocket kind="falcon9" x={x} y={y} scale={ROCKET_SCALE} shadow={false} print={false} />
      {COPY_BAND ? <CopyBand x={x} y={y} /> : null}
    </g>
  );
};

const OneOrTwoVsEight: React.FC<z.infer<typeof schema>> = ({ debugCaptions }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const sw = sway(frame); // screen px
  const k = cam.k;
  const cx = cam.cx - sw.dx / k;
  const cy = cam.cy - sw.dy / k;
  const ruleB = ruleBSpan(frame);
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <TallPaper frame={frame} cx={cx} cy={cy} k={k} cxRest={PAPER_REST.cx} cyRest={PAPER_REST.cy} />
      <WorldTall cx={cx} cy={cy} k={k} id={ID}>
        <defs>
          <RuleClip id={`${ID}-ruleA`} x0={-4000} x1={6000} y={RULE_Y} />
        </defs>
        {/* China's rule runs out from under the first copy as it lands; the eight copies fall onto it */}
        {ruleB ? <RowRule x0={ruleB.x0} x1={ruleB.x1} y={RULE_B_Y} /> : null}
        {Array.from({ length: COPY_N }, (_, i) => (
          <FallingCopy key={i} frame={frame} i={i} />
        ))}
        {/* America's two: the Falcon 9 (venting; its plume comes out from behind the rule as it lifts) and the jet
            (its contrail behind it) */}
        <Wisps frame={frame} />
        <Contrail frame={frame} />
        <g clipPath={`url(#${ID}-ruleA)`}>
          <FlyingFalcon9 frame={frame} />
        </g>
        <RowRule x0={RULE.x0} x1={RULE.x1} y={RULE_Y} />
        <MirroredJet frame={frame} />
      </WorldTall>
      <CaptionStripDebug on={debugCaptions} />
    </AbsoluteFill>
  );
};

export default OneOrTwoVsEight;

// ---------------------------------------------------------------------------
// PROBE (stills only): f0 the pair at rest, big; f1 the Falcon 9 in flight with its plume.
// ---------------------------------------------------------------------------
export const PROBE_DURATION = 2;
export const OneOrTwoProbe: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER_BASE }}>
      <TallPaper frame={0} cx={540} cy={960} k={1} />
      <WorldTall cx={F9_X - 120} cy={RULE_Y - 200} k={2.6} id="probe">
        {frame === 0 ? (
          <g>
            <Wisps frame={30} />
            <FlyingFalcon9 frame={0} />
            <RowRule x0={RULE.x0} x1={RULE.x1} y={RULE_Y} />
            <MirroredJet frame={0} />
          </g>
        ) : null}
        {frame === 1 ? <FlyingFalcon9 frame={150} /> : null}
      </WorldTall>
    </AbsoluteFill>
  );
};
