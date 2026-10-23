// ---------------------------------------------------------------------------
// LightningThreeMiles (scott-weather-fired, cut 7 "7_LightningThreeMiles"). Cheeky Pint style, the realistic "at sea"
// variant carried into the air (styles/cheeky-pint.md § Realistic ocean variant; the shared world denverWorld.tsx,
// imported read-only). Opaque 1080x1920, 23.976 fps, 120 frames.
//
// CHECK LINE: "a lightning bolt hit near Denver's airport, inside a three-mile ring around it, and that shut the ramp
// down."
//
// THE LINE: "Pop-up thunderstorms are what's hard. The reason is because if a lightning strikes within three miles of
// the airport,"
// WORD -> FRAME: Pop -4 (before the cut) · -up 4 · thunderstorms 9 · are 23 · what's 24 · hard 28 · The 32 · reason 36 ·
//                is 42 · because 46 · if 56 · a 66 · lightning 72 · strikes 80 · within 89 · three 94 · miles 99 ·
//                of 106 · the 108 · airport 110
// DURATION: the slot 7.174 -> 12.179 s = 5.005 s x 23.976 = 120 frames (f0..f119).
//
// THE MOTION: one continuous move. We open on cut 1's last frame (DEN_CAM_ESTABLISH, POPUP_END, story clock S = 64 + f)
// and the camera keeps gliding forward and down toward the strike side (CUT2_CAM_GOAL: the house damped follower
// restarted from cut 1's last state, so f0 is velocity-continuous; it arrives with the strike, ~f78-85, and holds
// alive with a slow orbit). The W cell becomes the nearest, separate storm, upper left, its base hanging beyond the
// ring's west edge. Cut 1's "DENVER" drains out f22-f34. On "the reason is because if" (f40-f70) the 3-mile ring draws
// itself on the ground around DEN, a cream hairline whose tip starts in the west. On "lightning strikes" the W cell
// drops one bolt (~170 px tall at full res) from under its base to the ground 0.6 mi inside the ring's WNW edge: the
// tip leaves the base at f75, CONTACT f78; FIRST REACTION f78 (an amber pool on the ground at the hit, the cell's base
// lit from inside, the amber closure leaving the ring at the strike's bearing). The closure runs both ways round the
// ring as an amber band and the two fronts meet on the east side at f104 (no "3 MI" label: cut on the user's note,
// the ring carries it on its own). As the ring closes the ramp brakes to a stop (rampActive
// 1 -> 0 over f104-f116). f110-f119: amber ring, stopped ramp, storms still boiling, the strike's afterglow gone.
// LIFE (revision 2): the push is front-loaded (moving from f1); the mature cells keep climbing past cut 1 (GROW_ON,
// f0-f90); two in-cloud flickers (NE f10 on "thunderstorms", W f61 before it strikes; none on f75-f80); the cream ring
// carries a soft underlay so it reads at 270 px.
// AMBER = the weather's reach (the strike, the closed ring = the ramp is closed); cream = the subject (storm tops, the
// terminal's peaks, the ring before it closes), the plains the context.
//
// JOINT: f0 = cut 1 (DenverPopUpStorms) f64 pixel for pixel: camera DEN_CAM_ESTABLISH, cells POPUP_END, S = 64, ramp
// travel 64, cut 1's DENVER_LABEL (imported) - asserted below and proven with a still-vs-still difference image.
//
// SOURCES: the 3-mile lightning rule is the speaker's line; DEN's layout per denverAirfield.ts (LAYOUT_SOURCE). No
// text or figures on screen after "DENVER" drains out.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AirStage,
  CUT1,
  CUT1_CAM,
  DEN_CAM_ESTABLISH,
  DEN_CAM_RING,
  LightningStrike,
  POPUP_END,
  RING_MI,
  STRIKE,
  TERMINAL,
  ThreeMileRing,
  cellPos,
  makeView,
  projectLine,
  projectPoly,
  flickerAt,
  popupCellsAt,
  rampTravelAt,
  smooth,
  strikeGlow,
  type DenCam,
} from "./denverWorld";
import { COLOR, Label, bloomFilter } from "../kits/cheeky-pint/stoutShared";
import { DENVER_LABEL } from "./DenverPopUpStorms";
import { CAM_DAMP, CAM_STIFF, camEase } from "../kits/cheeky-pint/oceanShared";

export const FPS = 24000 / 1001;
export const DURATION = 120;
export const schema = z.object({});
export const defaultProps = schema.parse({});

/** story clock: cut 1's frame = S, so this cut's f = S - 64 */
const S0 = CUT1.last;

// ---- the camera: cut 1's damped track, continued in one push toward the strike side ---------------------------------
// The house follower (oceanShared CAM_STIFF / CAM_DAMP, the same update denverCamera's track runs) restarted from cut
// 1's last state: position = CUT1_CAM at S 64, velocity = its last step, and its target at S 64 recovered from the
// track itself (the update solved for the target). From there the target eases over GLIDE_FRAMES to CUT2_CAM_GOAL, so
// position and velocity carry through the joint whatever cut 1's own glide is: one move forward, down and round toward
// the west cell that arrives with the strike (~f78-85) and settles; a slow orbit keeps the settled frame alive.
/** The strike view = the settle (cut-local; DEN_CAM_RING is the shared cut 3-4 view). Solved so the whole ring stays in
 *  frame (x ~50-1033, y ~650-1035, out of the caption band) while the bolt from the W cell to just inside the ring's
 *  WNW edge is as tall as that allows (~220 px at full res): looking N by W (heading -4), pitched down 28 deg, 8.5 mi
 *  out, aimed 2.3 mi south of the terminal. The W cell then stands as the nearest storm, upper left. */
export const CUT2_CAM_GOAL: DenCam = { tx: 0.6, ty: -1.5, dist: 9.75, pitch: 26, heading: -22, fov: DEN_CAM_RING.fov };
const GLIDE_FRAMES = 74;
const CREEP = { from: 40, frames: 230, heading: 2, distK: 1 };
const D2R = Math.PI / 180;
type Raw = number[]; // tx, ty, ln dist, pitch, heading, ln tan(fov / 2)
const toRaw = (c: DenCam): Raw => [c.tx, c.ty, Math.log(c.dist), c.pitch, c.heading, Math.log(Math.tan((c.fov * D2R) / 2))];
const fromRaw = (r: Raw): DenCam => ({ tx: r[0], ty: r[1], dist: Math.exp(r[2]), pitch: r[3], heading: r[4], fov: (2 * Math.atan(Math.exp(r[5]))) / D2R });
const CAM_TRACK: DenCam[] = (() => {
  const c62 = toRaw(CUT1_CAM.at(S0 - 2));
  const c63 = toRaw(CUT1_CAM.at(S0 - 1));
  let c = toRaw(CUT1_CAM.at(S0));
  let v = c.map((q, i) => q - c63[i]);
  const T0 = c63.map((q, i) => q + (v[i] - (c63[i] - c62[i]) * (1 - CAM_DAMP)) / CAM_STIFF);
  const G = toRaw(CUT2_CAM_GOAL);
  const creep = [0, 0, Math.log(CREEP.distK), 0, CREEP.heading, 0];
  const out: DenCam[] = [fromRaw(c)];
  for (let f = 1; f <= DURATION + 2; f++) {
    // front-loaded (ease-out): the push is already under way in the first second, then settles into the strike view
    const u = Math.min(1, f / GLIDE_FRAMES);
    const e = 1 - Math.pow(1 - u, 2.4);
    const ec = camEase((f - CREEP.from) / CREEP.frames, 1);
    const T = T0.map((q, i) => q + (G[i] - q) * e + creep[i] * ec);
    v = v.map((vi, i) => vi + (T[i] - c[i]) * CAM_STIFF - vi * CAM_DAMP);
    c = c.map((q, i) => q + v[i]);
    out.push(fromRaw(c));
  }
  return out;
})();
const camAt = (f: number): DenCam => CAM_TRACK[Math.max(0, Math.min(CAM_TRACK.length - 1, Math.round(f)))];

// ---- beats (cut frames) -------------------------------------------------------------------------------------------
const RING_DRAW = { f0: 40, f1: 70 };
/** the bolt's tip leaves the cell base here; it touches the ground STRIKE.contact frames later */
const STRIKE_F0 = 75;
/** in-cloud flicker (world flickerAt), cut frames: NE on "thunderstorms", the W cell once before it strikes; never on
 *  the strike frames (f75-f80) */
const FLICKERS: Record<string, number[]> = { NE: [10], W: [61] };
/** the storms keep billowing past cut 1: each mature cell climbs on from its cut-1 growth to GROW_ON over f0-f90
 *  (zero added at the joint, so f0 = POPUP_END), the top row visibly rising through the push */
const GROW_ON: Record<string, number> = { W: 1, NE: 1, SE: 0.95, NW: 1 };
const cellsAt = (S: number) =>
  popupCellsAt(S).map((c) => {
    const g1 = GROW_ON[c.id];
    const growth = g1 === undefined ? c.growth : c.growth + (g1 - c.growth) * smooth(S0, S0 + 90, S);
    const fl = FLICKERS[c.id] ? flickerAt(S, FLICKERS[c.id].map((f) => S0 + f)) : 0;
    return fl > 0 ? { ...c, growth, flicker: fl } : { ...c, growth };
  });
export const CONTACT = STRIKE_F0 + STRIKE.contact; // f78 = the first reaction frame too
const MEET = 104; // the two amber fronts meet in the east
const RAMP_STOP = { f0: 104, f1: 116 };
/** cut 1's "DENVER" world label (DenverPopUpStorms DENVER_LABEL, as it stands at cut 1's last frame), carried through
 *  the joint and drained out on "hard ... The" (f22-f34), before the ring draws */
const DENVER_EXIT = { f0: 22, f1: 34 };

// ---- the strike: from the west cell's base to the ground just inside the ring's west edge ---------------------------
const W_SPEC = POPUP_END.find((c) => c.id === "W");
if (!W_SPEC) throw new Error("LightningThreeMiles: no W cell in POPUP_END");
/** the W cell's ground position when the bolt leaves; the strike lands on the ring's radius toward it, 0.6 mi inside (clearly inside at this oblique) */
const W_AT = cellPos(W_SPEC, S0 + STRIKE_F0);
const STRIKE_BEARING = ((Math.atan2(W_AT.x - TERMINAL.x, W_AT.y - TERMINAL.y) * 180) / Math.PI + 360) % 360;
const STRIKE_R = RING_MI - 0.6;
const STRIKE_AT = {
  x: TERMINAL.x + Math.sin((STRIKE_BEARING * Math.PI) / 180) * STRIKE_R,
  y: TERMINAL.y + Math.cos((STRIKE_BEARING * Math.PI) / 180) * STRIKE_R,
};
/** the bolt leaves the base 0.55 mi from the cell's centre toward the ring (well under the base, so it reads as coming
 *  out of THAT storm) and slants down to the strike point */
const STRIKE_REACH = 0.55;
const STRIKE_FROM = (() => {
  const dx = STRIKE_AT.x - W_AT.x;
  const dy = STRIKE_AT.y - W_AT.y;
  const l = Math.hypot(dx, dy);
  const k = Math.max(0, Math.min(STRIKE_REACH, l - 0.25)) / (l || 1);
  return { x: W_AT.x + dx * k, y: W_AT.y + dy * k };
})();

/** A soft cream underlay under the world ring's 2 px hairline, so the cream ring reads at 270 px before the strike
 *  (~5 px, lower opacity; still far thinner than the lit amber band). Follows the same drawing tip from the west. */
const RingUnderlay: React.FC<{ v: ReturnType<typeof makeView>; draw: number }> = ({ v, draw }) => {
  const n = Math.max(2, Math.ceil(240 * draw));
  const arc: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const b = ((270 + (360 * draw * i) / n) * Math.PI) / 180;
    arc.push([TERMINAL.x + Math.sin(b) * RING_MI, TERMINAL.y + Math.cos(b) * RING_MI, 0]);
  }
  return (
    <g opacity={0.55}>
      {projectLine(v, arc).map((r, i) => (
        <path key={i} d={`M${r.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("L")}`} fill="none" stroke={COLOR.cream} strokeWidth={5} strokeLinecap="round" style={{ filter: "blur(0.8px)" }} />
      ))}
    </g>
  );
};

/** The strike's contact pool: a cut-local amber pool lying ON the ground around the contact point (a perspective-true
 *  disc, feathered, fixed bloom), so the hit reads on a phone as a mark on the ground inside the ring, not a dot. Full
 *  at contact (f78) for 2 frames, then it settles out over STRIKE.settle frames (gone by ~f95). Same timing as the
 *  world's own ground glow, which still draws its hot centre. */
const StrikePool: React.FC<{ v: ReturnType<typeof makeView>; t: number }> = ({ v, t }) => {
  const ct = t - STRIKE.contact;
  if (ct < 0) return null;
  const a = ct < 2 ? 1 : Math.pow(Math.max(0, 1 - (ct - 2) / STRIKE.settle), 1.4);
  if (a <= 0.003) return null;
  const disc = (r: number) => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 48; i++) pts.push([STRIKE_AT.x + Math.sin((i / 48) * 2 * Math.PI) * r, STRIKE_AT.y + Math.cos((i / 48) * 2 * Math.PI) * r, 0]);
    const q = projectPoly(v, pts);
    return q.length ? `M${q.map((p) => `${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("L")}Z` : "";
  };
  const px = v.scaleAt(STRIKE_AT.x, STRIKE_AT.y, 0);
  return (
    <g style={{ filter: bloomFilter(1) }}>
      <path d={disc(0.5)} fill={COLOR.amberTop} opacity={(0.42 * a).toFixed(3)} style={{ filter: `blur(${(px * 0.14).toFixed(2)}px)` }} />
      <path d={disc(0.2)} fill={COLOR.amberTop} opacity={(0.75 * a).toFixed(3)} style={{ filter: `blur(${(px * 0.06).toFixed(2)}px)` }} />
      <path d={disc(0.07)} fill={COLOR.amberHot} opacity={a.toFixed(3)} style={{ filter: `blur(${(px * 0.02).toFixed(2)}px)` }} />
    </g>
  );
};

const rampActiveAtS = (S: number) => 1 - smooth(S0 + RAMP_STOP.f0, S0 + RAMP_STOP.f1, S);

// ---- the joint with cut 1 (asserted at module load) ---------------------------------------------------------------
{
  if (CUT1.last !== 64) throw new Error("LightningThreeMiles: CUT1.last changed");
  const c0 = camAt(0);
  const ks = Object.keys(c0) as (keyof DenCam)[];
  if (ks.some((k) => Math.abs(c0[k] - DEN_CAM_ESTABLISH[k]) > 1e-9)) throw new Error("LightningThreeMiles: f0 camera != DEN_CAM_ESTABLISH");
  const cells = cellsAt(S0);
  if (cells.length !== POPUP_END.length || cells.some((s, i) => s.id !== POPUP_END[i].id || Math.abs(s.growth - POPUP_END[i].growth) > 1e-9)) {
    throw new Error("LightningThreeMiles: f0 cells != POPUP_END");
  }
  if (Math.abs(rampTravelAt(S0, rampActiveAtS) - S0) > 1e-9) throw new Error("LightningThreeMiles: f0 ramp travel != cut 1's");
}

const LightningThreeMiles: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = S0 + f;
  const v = makeView(camAt(f));
  const tStrike = f - STRIKE_F0;
  const cells = cellsAt(S).map((c) => (c.id === "W" && tStrike >= 0 ? { ...c, glow: strikeGlow(tStrike) } : c));

  // the ring draws itself (cream hairline, tip from the west), then the closure spreads from the strike both ways
  const draw = smooth(RING_DRAW.f0, RING_DRAW.f1, f);
  const u = Math.max(0, Math.min(1, (f - CONTACT + 1) / (MEET - CONTACT + 1)));
  const spread = f < CONTACT ? 0 : Math.sin((u * Math.PI) / 2);
  const back = STRIKE_BEARING - 180 * spread; // the counter-clockwise front
  const den = v.project(DENVER_LABEL.x, DENVER_LABEL.y, DENVER_LABEL.z);
  const denExit = smooth(DENVER_EXIT.f0, DENVER_EXIT.f1, f);
  const backDot = spread > 0.001 && spread < 0.999 ? v.project(TERMINAL.x + Math.sin((back * Math.PI) / 180) * RING_MI, TERMINAL.y + Math.cos((back * Math.PI) / 180) * RING_MI, 0) : null;

  return (
    <AirStage
      S={S}
      v={v}
      cells={cells}
      rampActive={rampActiveAtS(S)}
      rampTravel={rampTravelAt(S, rampActiveAtS)}
      ground={
        <>
          {draw > 0.0005 ? <RingUnderlay v={v} draw={draw} /> : null}
          {draw > 0.0005 ? <ThreeMileRing v={v} draw={draw} lit={0} /> : null}
          {spread > 0 ? <ThreeMileRing v={v} draw={spread} lit={1} from={back} /> : null}
          <StrikePool v={v} t={tStrike} />
          {backDot ? <circle cx={backDot.x} cy={backDot.y} r={3.2} fill={COLOR.amberHot} /> : null}
        </>
      }
      over={
        <>
          {den && denExit < 1 ? (
            <g>
              {/* cut 1's halo (WorldLabel halo 1: a soft deep-brown shadow, offset down-right), draining with the letters */}
              <g opacity={0.7} style={{ filter: `blur(${(DENVER_LABEL.px * 0.12).toFixed(3)}px)` }} transform={`translate(${(DENVER_LABEL.px * 0.04).toFixed(3)} ${(DENVER_LABEL.px * 0.08).toFixed(3)})`}>
                <Label x={den.x} y={den.y} k={1} text={DENVER_LABEL.text} tone="dark" enter={DENVER_LABEL.enterAtLast} exit={denExit} px={DENVER_LABEL.px} />
              </g>
              <Label x={den.x} y={den.y} k={1} text={DENVER_LABEL.text} tone="cream" enter={DENVER_LABEL.enterAtLast} exit={denExit} px={DENVER_LABEL.px} />
            </g>
          ) : null}
          <LightningStrike v={v} from={STRIKE_FROM} to={STRIKE_AT} t={tStrike} />
        </>
      }
    />
  );
};
export default LightningThreeMiles;
