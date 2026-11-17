// GrantsAcrossTheWorldPortrait — approved SHRUTI grants mechanism recomposed for 1080x1920.
// CHECK: grants travel from one source to destinations across the whole world.
// LINE: "Roughly we've given about 1,600 grants across the world."
// WORD -> FRAME: roughly8; we've19; given25; about30; 1,60035–39; grants53; across65; the79; world91.
// DURATION: latest timeline42.917875–46.880166667 =95frames at24000/1001. The approved105frame flight curve
// is compressed into95frames, so its final arrivals settle before the cut. A gentle push stays live throughout.
// Portrait layout keeps the complete atlas in x95–985,y510–895 (including rotation and the final push).
// Enlarged envelopes and slightly heavier trails retain the original appearance at phone size. Full portrait
// squared-paper ground, archive grain and hard shadows; no labels/counters or additional facts.
// SOURCE: original GrantsAcrossTheWorldData.ts; Natural Earth50m map, Mercatus/Arlington source position.
// Destinations are an illustrative distribution of166 points, not a factual grant list or quantity encoding.
import { PortraitFilmLife, TallPaper } from "./ShrutiPortraitShared";
import React from "react";
import { AbsoluteFill, Easing, Img, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { INK, SHADOW, SHADOW_OFF } from "../neal-stephenson-trailer/nealShared";
import {
  GRANTS_MAP_MARGIN,
  GRANTS_SHEET_H,
  GRANTS_SHEET_PNG,
  GRANTS_SHEET_W,
  GRANTS_SOURCE,
  GRANT_FLIGHTS,
  type GrantFlight,
} from "../shruti-trailer/GrantsAcrossTheWorldData";

export const FPS = 24000 / 1001;
export const DURATION = 95;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// Portrait atlas: the whole world remains visible. Broad geography stays broad, with larger envelopes
// and a controlled push. World points are still the exact approved map coordinates.
export const SHEET_SCALE = 0.51;
export const SHEET_TURN = -1.1;
export const sheetCamera = (f: number) => ({ x: 540 - 3 * f / 94, y: 705 - 5 * f / 94, k: SHEET_SCALE * (1 + 0.035 * f / 94) });

// ---- a flight ------------------------------------------------------------------------------------------------------
const S = GRANTS_SOURCE;
/** progress along the arc: a tiny launch out of the source, a cruise, a soft landing */
const flyEase = Easing.bezier(0.32, 0.035, 0.36, 1);
const TRAIL_LAG = 8; // frames the trail's tail runs behind the envelope (it then draws itself into the dot)
const TRAIL_SEGS = 10;
const TRAIL_W = 4.5;
const TRAIL_SHADOW = 2.5;
const TRAIL_OP = 0.85;
const LAND_F = 5; // the envelope folds into its dot over its last LAND_F frames
const DOT_R = 6.2;
const DOT_SHADOW = 2.5;
const RING_F = 14;
const RING_GROW = 16;
const ENV_W = 42;
const ENV_H = 28;
const HUB_R = 21; // the source disc: an envelope at launch scale is wholly behind it
const HUB_R_LAUNCH = 0.75; // the envelope's scale as it leaves the source (half-diagonal 24 x 16 x 0.75 / 2 = 10.8 < HUB_R)

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const bez = (g: GrantFlight, t: number) => {
  const u = 1 - t;
  return { x: u * u * S.x + 2 * u * t * g.cx + t * t * g.x, y: u * u * S.y + 2 * u * t * g.cy + t * t * g.y };
};
const bezTan = (g: GrantFlight, t: number) => ({
  dx: 2 * (1 - t) * (g.cx - S.x) + 2 * t * (g.x - g.cx),
  dy: 2 * (1 - t) * (g.cy - S.y) + 2 * t * (g.y - g.cy),
});

/** the state of grant i at frame f (pure) */
export const grantAt = (i: number, f: number) => {
  const g = GRANT_FLIGHTS[i];
  const t = (f - g.launch) / g.dur;
  const head = flyEase(clamp01(t));
  const tail = flyEase(clamp01((f - g.launch - TRAIL_LAG) / g.dur));
  const land = g.launch + g.dur;
  return { g, t, head, tail, u: f - land, started: t >= 0, flying: t >= 0 && t < 1 };
};

const Trail: React.FC<{ g: GrantFlight; head: number; tail: number; colour: string; off: number }> = ({ g, head, tail, colour, off }) => {
  if (head - tail < 1e-4) return null;
  const segs: React.ReactNode[] = [];
  for (let s = 0; s < TRAIL_SEGS; s++) {
    const a = tail + ((head - tail) * s) / TRAIL_SEGS;
    const b = tail + ((head - tail) * (s + 1)) / TRAIL_SEGS;
    const p0 = bez(g, a);
    const pm = bez(g, (a + b) / 2);
    const p1 = bez(g, b);
    const op = TRAIL_OP * Math.pow((s + 1) / TRAIL_SEGS, 1.3);
    segs.push(
      <path
        key={s}
        d={`M${p0.x + off} ${p0.y + off} L${pm.x + off} ${pm.y + off} L${p1.x + off} ${p1.y + off}`}
        stroke={colour}
        strokeOpacity={op}
        strokeWidth={TRAIL_W}
        strokeLinecap="butt"
        strokeLinejoin="round"
        fill="none"
      />,
    );
  }
  return <>{segs}</>;
};

const Envelope: React.FC<{ x: number; y: number; scale: number; rot: number; opacity: number }> = ({ x, y, scale, rot, opacity }) => {
  const w = ENV_W;
  const h = ENV_H;
  const flap = `M${-w / 2 + 2.2} ${-h / 2 + 2} L0 ${1.6} L${w / 2 - 2.2} ${-h / 2 + 2}`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${scale})`} opacity={opacity < 1 ? opacity : undefined}>
      <rect x={-w / 2 + 3} y={-h / 2 + 3} width={w} height={h} rx={1.6} fill={SHADOW} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={1.6} fill={INK} />
      <path d={flap} stroke={SHADOW} strokeWidth={2.7} fill="none" strokeLinejoin="round" />
    </g>
  );
};

const Flights: React.FC<{ f: number }> = ({ f }) => {
  const states = GRANT_FLIGHTS.map((_, i) => grantAt(i, f)).filter((s) => s.started);
  const trailShadows: React.ReactNode[] = [];
  const trailInks: React.ReactNode[] = [];
  const rings: React.ReactNode[] = [];
  const dotShadows: React.ReactNode[] = [];
  const dots: React.ReactNode[] = [];
  const letters: React.ReactNode[] = [];
  states.forEach((s, n) => {
    const { g, head, tail, u } = s;
    trailShadows.push(<Trail key={n} g={g} head={head} tail={tail} colour={SHADOW} off={TRAIL_SHADOW} />);
    trailInks.push(<Trail key={n} g={g} head={head} tail={tail} colour={INK} off={0} />);
    // the envelope: out from behind the hub (0.8 -> 1 over its first 5 frames), folding into the dot at the end
    if (s.flying) {
      const p = bez(g, head);
      const tan = bezTan(g, head);
      const rot = Math.max(-22, Math.min(22, (Math.atan(tan.dy / (Math.abs(tan.dx) < 1e-6 ? 1e-6 : tan.dx)) * 180) / Math.PI * 0.4));
      const age = f - g.launch;
      const launchK = HUB_R_LAUNCH + (1 - HUB_R_LAUNCH) * Easing.out(Easing.cubic)(clamp01(age / 5));
      const fold = clamp01((-u) / LAND_F); // 1 in flight, -> 0 at the landing
      const foldE = Easing.inOut(Easing.cubic)(fold);
      letters.push(<Envelope key={n} x={p.x} y={p.y} scale={launchK * (0.35 + 0.65 * foldE)} rot={rot * foldE} opacity={foldE} />);
    }
    // the dot: in as the envelope folds (crossfade), a soft overshoot settle, then a faint slow twinkle
    if (u >= -3) {
      const i = GRANT_FLIGHTS.indexOf(g);
      const fadeIn = clamp01((u + 3) / 4);
      const swell = u < 1 ? Easing.out(Easing.quad)(clamp01((u + 3) / 4)) : 1 - Easing.out(Easing.cubic)(clamp01((u - 1) / 8));
      const period = 34 + 28 * random(`grant-tw-p-${i}`);
      const phase = 2 * Math.PI * random(`grant-tw-ph-${i}`);
      const twIn = clamp01((u - 9) / 12);
      const tw = 0.5 + 0.5 * Math.sin((2 * Math.PI * f) / period + phase);
      const r = DOT_R * (1 + 0.32 * swell + 0.07 * twIn * tw);
      const op = fadeIn * (1 - 0.16 * twIn * tw);
      dotShadows.push(<circle key={n} cx={g.x + DOT_SHADOW} cy={g.y + DOT_SHADOW} r={r} fill={SHADOW} opacity={fadeIn < 1 ? fadeIn : undefined} />);
      dots.push(<circle key={n} cx={g.x} cy={g.y} r={r} fill={INK} opacity={op < 1 ? op : undefined} />);
      if (u >= 0 && u <= RING_F) {
        const q = u / RING_F;
        const rr = DOT_R + 2 + RING_GROW * Easing.out(Easing.cubic)(q);
        const ro = 0.8 * Math.pow(1 - q, 1.4);
        rings.push(
          <g key={n} opacity={ro}>
            <circle cx={g.x + 2} cy={g.y + 2} r={rr} stroke={SHADOW} strokeWidth={2.2} fill="none" />
            <circle cx={g.x} cy={g.y} r={rr} stroke={INK} strokeWidth={2.2} fill="none" />
          </g>,
        );
      }
    }
  });
  return (
    <>
      <g>{trailShadows}</g>
      <g>{trailInks}</g>
      <g>{rings}</g>
      <g>{dotShadows}</g>
      <g>{dots}</g>
      <g>{letters}</g>
    </>
  );
};

/** the source: Arlington, VA. The envelopes come out from behind it. */
const Hub: React.FC = () => (
  <g>
    <circle cx={S.x + SHADOW_OFF} cy={S.y + SHADOW_OFF} r={30} stroke={SHADOW} strokeWidth={3.5} fill="none" />
    <circle cx={S.x + SHADOW_OFF} cy={S.y + SHADOW_OFF} r={HUB_R} fill={SHADOW} />
    <circle cx={S.x} cy={S.y} r={30} stroke={INK} strokeWidth={3.5} fill="none" />
    <circle cx={S.x} cy={S.y} r={HUB_R} fill={INK} />
  </g>
);

const GrantsAcrossTheWorldPortrait: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const c = sheetCamera(frame);
  const flightFrame = frame * 104 / 94;
  return (
    <AbsoluteFill>
      <PortraitFilmLife frame={frame} seed="shruti-grants-tall">
        <TallPaper frame={frame} cx={540 + frame * 0.04} cy={960 + frame * 0.03} cxRest={540} cyRest={960} k={1 + frame * 0.00035} />
        <div style={{ position: "absolute", left: c.x, top: c.y, width: GRANTS_SHEET_W, height: GRANTS_SHEET_H,
          transform: `scale(${c.k}) rotate(${SHEET_TURN}deg) translate(-50%, -50%)`, transformOrigin: "0 0" }}>
          <div style={{ position: "absolute", left: SHADOW_OFF, top: SHADOW_OFF, width: GRANTS_SHEET_W, height: GRANTS_SHEET_H, background: SHADOW }} />
          <Img src={staticFile(GRANTS_SHEET_PNG)} style={{ position: "absolute", left: 0, top: 0, width: GRANTS_SHEET_W, height: GRANTS_SHEET_H, maxWidth: "none" }} />
          <svg width={GRANTS_SHEET_W} height={GRANTS_SHEET_H} viewBox={`0 0 ${GRANTS_SHEET_W} ${GRANTS_SHEET_H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            <g transform={`translate(${GRANTS_MAP_MARGIN} ${GRANTS_MAP_MARGIN})`}><Flights f={flightFrame} /><Hub /></g>
          </svg>
        </div>
      </PortraitFilmLife>
    </AbsoluteFill>
  );
};
export default GrantsAcrossTheWorldPortrait;
