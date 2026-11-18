// ---------------------------------------------------------------------------
// CrazyUplift (toto-worth-twelve, cut 11). Cheeky Pint style, the STOUT BOARD (styles/cheeky-pint.md).
// Opaque 1080x1920, 25 fps, 148 frames. Builder C (brief notes/brief_C_uplift.md). Palette B1.
//
// CHECK LINE: "American NFL and NBA team values have just shot up far beyond what their earnings would
// justify, way past Mercedes'."
//
// THE LINE: "When we compare our multiples to | the NFL or the NBA in its latest crazy uplift of valuation
// in, | I don't know..."
// WORD -> FRAME: the 3 · NFL 13 · or 20 · the 26 · NBA 29 · in 37 · its 53 · latest 58 · crazy 91 ·
// uplift 105 · of 119 · valuation 129 · in 136 (words.json, sequence s - 11.280, x 25).
// DURATION: the slot 11.280 -> 17.200 s = 5.92 s x 25 = 148 frames (f0..f147).
//
// THE MOTION: one surge. Mercedes' tile stands in the middle with its modest amber value column already
// settled; the camera, close on it, eases back as the NFL tile (the shield) slides in from the left ("NFL",
// lands f22) and the NBA tile (its logo) from the right ("NBA", lands f38), each lifted while it travels and
// settling on its contact shadow, then a cream column rises out of each slot to a bit above Mercedes'
// (f18-40, f34-56). Calm beat ("in its latest"): the camera creeps in and a faint board marker line is
// drawn out from Mercedes' top across both cream columns (f60-80), so its level is marked. On "crazy
// uplift" (f88-126) both cream columns surge: fast and long, out through the top of the frame; the camera
// tilts up after them (no pull-back: the payoff stays big) but can't keep up, so the tops leave the frame while
// Mercedes' amber top and the marker line sink into the lower picture (the tiles stay above y 1440 after dy). Resolved (f126-147): the two
// tall cream columns still creep up, the camera still drifts after them, rungs streaming down past.
// Gestures: tile slides f8-22 (NFL) and f24-38 (NBA); column rises (contact = the tile's slot, first
// reaction = the glass leaving it) f18 / f34; marker f60-80; surge NFL f88, NBA f90 (2 f apart, so the
// two are one gesture but not a mirror); camera tilt f88-170 (still creeping at f147). No click: the
// payoff is cream (a sweep on cream is invisible) and the amber is not the subject here.
// AMBER = Mercedes' money (here its value); cream = the leagues the line names; board = the marker.
// No numbers, no text: the real NFL shield and NBA logo, stamped in ink on the league tiles (leagueLogos.ts),
// carry NFL / NBA (user note, Nov 18).
//
// SOURCES / DATA: heights are illustrative of direction only (brief): Mercedes' column is its $6B
// valuation at worthShared VALUE (Kurtz deal, Nov 2025: GBP 4.57B / $5.97B, CNBC 20 Nov 2025); the
// league columns start a rung above it (US league values rose ~20-40% in a year: Forbes 2025 NFL / NBA
// lists, Celtics $6.1B, Lakers $10B) and their surge is the "crazy", not a figure. No numeral on screen.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, GEO, STROKE, StoutStage, amberBandFor, clamp01, easeOutCubic, lerp, opticalFit, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack } from "../kits/cheeky-pint/museShared";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { DATA, DY, FIG, FLOOR, PITCH, TILE_TOP, ValueColumn, X_MERC, sxOf, syOf, valueH } from "./worthShared";
import { NBA_STAMP, NFL_STAMP, type LeagueStamp } from "./leagueLogos";

export const FPS = 25;
export const DURATION = 148;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the world ---------------------------------------------------------------------------------------
const XM = X_MERC;
const XL = XM - PITCH; // the NFL tile
const XR = XM + PITCH; // the NBA tile
const HM = valueH(DATA.MERC_VALUE_YEAR_AGO); // 75: Mercedes' column ($6B), settled
const MERC_TOP = TILE_TOP - HM;

// --- the beats (frames) -------------------------------------------------------------------------------
export const BEAT = {
  slideL: 8, // NFL tile from the left frame edge ("NFL" 13)
  slideR: 24, // NBA tile from the right ("NBA" 29)
  slideF: 14,
  riseL: 18, // the cream column leaves the slot
  riseR: 34,
  riseF: 22,
  creep0: 54, // calm creep ("its latest")
  mark0: 60, // the marker line drawn out from Mercedes' top
  markF: 20,
  surgeL: 88, // the surge ("crazy" 91, "uplift" 105)
  surgeR: 90,
  surgeF: 38,
} as const;

/** A league column's height (world): rise out of the slot, a calm creep, the surge, a still-creeping tail. */
const LEAGUE = [
  { start: valueH(8.0), rise: BEAT.riseL, surge: BEAT.surgeL, gain: 980 },
  { start: valueH(7.6), rise: BEAT.riseR, surge: BEAT.surgeR, gain: 940 },
];
const SURGE_TAIL = 3.2; // world px per frame after the surge: the creep (screen ~6 px/f at k 2)
export const leagueH = (f: number, i: 0 | 1) => {
  const L = LEAGUE[i];
  const r = (f - L.rise) / BEAT.riseF;
  if (r <= 0) return 0;
  const rise = L.start * smoothstep(r);
  const creep = valueH(0.25) * smoothstep((f - BEAT.creep0) / 40);
  // the surge: velocity rises from rest, holds high through "uplift", decays into the creep's speed
  const u = clamp01((f - L.surge) / BEAT.surgeF);
  const shape = (t: number) => {
    // smoothstep on a warped clock: slow start, fast middle; then a long ease-out
    const w = Math.pow(t, 1.35);
    return w * w * (3 - 2 * w);
  };
  const surge = L.gain * shape(u);
  const tail = SURGE_TAIL * Math.max(0, f - (L.surge + BEAT.surgeF));
  return rise + creep + surge + tail;
};

// --- the camera (pre-dy: the keep-in box's centre is y 680) ----------------------------------------------
const camAt = (wx: number, wy: number, sx: number, sy: number, k: number) => ({ x: wx - (sx - 540) / k, y: wy - (sy - 960) / k, k });
const K0 = 3.0; // close on Mercedes alone
const C0 = camAt(XM, (MERC_TOP + FLOOR) / 2, 540, 690, K0);
const K1 = 2.3; // the three tiles: ~810 px of the keep-in width
const C1 = camAt(XM, (TILE_TOP - LEAGUE[0].start + FLOOR) / 2, 540, 690, K1);
const K2 = 2.38; // the calm creep in
const K3 = 2.4; // after the surge, no pull-back (the payoff stays big). C3 (director, Nov 18): Mercedes' level heads for y 840 (1030 after dy) so at f147 the line is at ~1006 and all three tiles end above y ~1410 after dy
const C3 = camAt(XM, MERC_TOP, 540, 840, K3);
const CAM = makeClockCam(
  { x: C0.x, y: C0.y, k: K0 },
  [
    { f0: -12, f1: 50, k: K1, dx: C1.x - C0.x, dy: C1.y - C0.y },
    { f0: 46, f1: 92, k: K2 },
    { f0: 92, f1: 158, k: K3, dx: C3.x - C1.x, dy: C3.y - C1.y, warp: 0.8 },
  ],
  DURATION,
);
// the light pool: on Mercedes, out over the three, then up the surging columns (its own lag)
const POOL = makePoolTrack(
  { x: XM, y: TILE_TOP - HM * 0.6 },
  [
    { f0: 10, f1: 50, x: XM, y: TILE_TOP - 60 },
    { f0: 92, f1: 140, x: XM, y: MERC_TOP - 260 },
  ],
  DURATION,
);

const slide = (f: number, f0: number, from: number, to: number) => lerp(from, to, easeOutCubic((f - f0) / BEAT.slideF));
/** The x a tile enters from: fully outside the frame edge at its first frame (shadow included). */
const offLeft = (c: Cam) => c.x - 540 / c.k - GEO.TILE / 2 - 24;
const offRight = (c: Cam) => c.x + 540 / c.k + GEO.TILE / 2 + 24;
const X_IN_L = offLeft(CAM.at(BEAT.slideL));
const X_IN_R = offRight(CAM.at(BEAT.slideR));

// --- the league marks (user note, Nov 18: "add the NBA and NFL logos") -------------------------------------
// The league tiles are blank ValueColumn tiles (figure "none"); the real mark is stamped on them in
// COLOR.inkDark (dark parts ink, light parts tile, background dropped), sized by the kit's opticalFit so the
// shield and the NBA logo read as one family with the Mercedes lockup. Measured: the kit's knocked-out marks
// show the ground at ~rgb(48,34,14) on the rendered tile, inkDark is (46,30,20): the same stamp.
/** worthShared ValueColumn's LIFT_DY (not exported): a lifted body rises 6 world px by smoothstep(lift). */
const VC_LIFT_DY = 6;
const fitOf = (s: LeagueStamp) => {
  const [bx, by, bw, bh] = s.box;
  const fit = opticalFit(bw, bh, s.fill, s.cy, GEO.TILE);
  return { sc: fit.sc, ox: fit.cx - (bx + bw / 2) * fit.sc, oy: fit.cy - (by + bh / 2) * fit.sc };
};
const FIT = { NFL: fitOf(NFL_STAMP), NBA: fitOf(NBA_STAMP) };
const LeagueMark: React.FC<{ x: number; lift: number; stamp: LeagueStamp; fit: { sc: number; ox: number; oy: number } }> = ({ x, lift, stamp, fit }) => {
  const id = `lg${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const T = GEO.TILE;
  const x0 = x - T / 2;
  const y0 = FLOOR - VC_LIFT_DY * smoothstep(lift) - T;
  return (
    <g>
      <defs>
        <mask id={id} maskUnits="userSpaceOnUse" x={x0} y={y0} width={T} height={T}>
          <g transform={`translate(${x0 + fit.ox} ${y0 + fit.oy}) scale(${fit.sc})`}>
            <g transform={stamp.transform}>
              {stamp.ink.map((d, i) => (
                <path key={`i${i}`} d={d} fill="#fff" />
              ))}
              {stamp.holes.map((d, i) => (
                <path key={`h${i}`} d={d} fill="#000" />
              ))}
            </g>
          </g>
        </mask>
      </defs>
      <rect x={x0} y={y0} width={T} height={T} fill={COLOR.inkDark} mask={`url(#${id})`} />
    </g>
  );
};

const CrazyUplift: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = CAM.at(f);
  const k = cam.k;
  const band = amberBandFor(cam);
  const leagues = [
    { x: slide(f, BEAT.slideL, X_IN_L, XL), t: (f - BEAT.slideL) / BEAT.slideF, h: leagueH(f, 0), stamp: NFL_STAMP, fit: FIT.NFL },
    { x: slide(f, BEAT.slideR, X_IN_R, XR), t: (f - BEAT.slideR) / BEAT.slideF, h: leagueH(f, 1), stamp: NBA_STAMP, fit: FIT.NBA },
  ];
  // the marker: drawn out both ways from Mercedes' top edge by a moving tip
  const m = smoothstep((f - BEAT.mark0) / BEAT.markF);
  const reach = XR - XM + GEO.BAR / 2 + 56;
  const mx0 = XM - GEO.BAR / 2 - (reach - GEO.BAR / 2) * m;
  const mx1 = XM + GEO.BAR / 2 + (reach - GEO.BAR / 2) * m;
  return (
    <StoutStage S={f} cam={cam} rest={CAM.rest} pool={POOL(f)} dy={DY}>
      <ValueColumn x={XM} k={k} figure={FIG.MERC} glass={HM} fill={HM} fillTone="amber" glassHi={1} amberBand={band} />
      {leagues.map((L, i) =>
        L.t <= 0 ? null : (
          <g key={i}>
            <ValueColumn
              x={L.x}
              k={k}
              figure={{ kind: "none" }}
              glass={L.h}
              fill={L.h}
              fillTone="cream"
              glassHi={1}
              lift={1 - smoothstep(L.t)}
              amberBand={band}
            />
            <LeagueMark x={L.x} lift={1 - smoothstep(L.t)} stamp={L.stamp} fit={L.fit} />
          </g>
        ),
      )}
      {m > 0 ? (
        <line x1={mx0} x2={mx1} y1={MERC_TOP} y2={MERC_TOP} stroke={COLOR.board} strokeOpacity={0.85} strokeWidth={STROKE.RULE / k} strokeLinecap="butt" />
      ) : null}
    </StoutStage>
  );
};

export default CrazyUplift;

// --- load-time checks ----------------------------------------------------------------------------------------
{
  const fail = (msg: string) => {
    throw new Error(`CrazyUplift: ${msg}`);
  };
  // the tiles enter from fully off-frame
  if (sxOf(CAM.at(BEAT.slideL), X_IN_L) + (GEO.TILE / 2) * CAM.at(BEAT.slideL).k > 0) fail("the NFL tile is visible before it slides in");
  if (sxOf(CAM.at(BEAT.slideR), X_IN_R) - (GEO.TILE / 2) * CAM.at(BEAT.slideR).k < 1080) fail("the NBA tile is visible before it slides in");
  // the calm frame: the three tiles + columns inside the keep-in box (pre-dy)
  const c = CAM.at(80);
  if (sxOf(c, XL - GEO.TILE / 2) < 65 || sxOf(c, XR + GEO.TILE / 2) > 1015) fail("the calm row runs out of the keep-in width");
  if (syOf(c, TILE_TOP - leagueH(80, 0)) < 290 || syOf(c, FLOOR) > 1070) fail("the calm row runs out of the keep-in height");
  // the end: both columns out through the top of the visible frame (post-dy)
  const e = CAM.at(DURATION - 1);
  for (const i of [0, 1] as const) if (syOf(e, TILE_TOP - leagueH(DURATION - 1, i)) + DY > -20) fail(`column ${i} does not leave the top`);
}
