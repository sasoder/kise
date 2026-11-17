// ---------------------------------------------------------------------------
// GrantsAcrossTheWorld (shruti-trailer, cut 42). Core memory podcast style (styles/core-memory.md), the clip's ARCHIVE
// COLLAGE at 16:9 on the Neal base (../neal-stephenson-trailer/nealShared). Opaque 1920x1080, 23.976 fps, 105 frames.
//
// CHECK LINE: "Grants fly out from one place and land all over the world, more and more, until the map is dotted
// everywhere." (Sound off: "they've handed out grants to people all over the world.")
//
// THE LINE (Shruti Rajagopalan, Emergent Ventures India): "Roughly, we've given about 1,600 grants across the world."
// WORD -> FRAME (from the composition start): Roughly 8 · we've 19 · given 25 · about 30 · 1 35 · ,600 39 ·
//   grants 53 · across 65 · the 79 · world 91 · next line ("The contrarian ideas", Shruti on camera) 103.
// DURATION: the slot 42.918 -> 47.297 s (sequence f1029 -> f1134) = 4.379 s x 23.976 = 105 frames (f0..f104).
//
// THE MOTION: a printed world map (black ink on an off-white sheet, a cut-out with the hard shadow) lies on the
// squared paper. From ONE source, Arlington VA, small white grant envelopes fly out on smooth arcs, each trailing a
// thin white line that fades along its length, and land all over the populated world (India dense); each landing
// folds the envelope into a small white dot (a soft settle and a ring that grows and fades) that stays. f0 a few
// envelopes are already in flight (3 at f0); the launch rate rises smoothly to its peak by "1,600" (73 in flight at f35,
// ~110 at f45-53 on "grants"), then tapers, so the dots flood in through "across the world" (74 landed at f65, 125 at
// f79, 157 of 166 at f91) and f95-104 is a settled,
// living frame (a few still in flight, dots twinkling faintly, film life). The camera is one slow push-in from f0 to
// the end (k 1.00 -> 1.06, a little drift right), no holds. No labels, counter, numbers or flags; no chain.
// CHAIN = India's outliers (COMMON.md); none in this cut.
//
// SOURCES: land = world-atlas land-50m (Natural Earth 1:50m, public domain), plate carree centred on lon 10, baked by
// scripts/clips/shruti-trailer/GrantsAcrossTheWorld-bake.mjs to public/shruti-trailer/GrantsAcrossTheWorld_map.png
// (the brief's NASA map 43.3b was not used: it is a day/night composite with ocean labels). The source point is
// Arlington, Virginia (the Mercatus Center, which runs Emergent Ventures). Destinations are an impression (166
// points jittered round real cities, each checked on land), not the real grant list; no figure goes on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { INK, type NealCam, NealFilmLife, NealPaper, NealPlane, SHADOW, SHADOW_OFF, W, H } from "../neal-stephenson-trailer/nealShared";
import {
  GRANTS_MAP_MARGIN,
  GRANTS_SHEET_H,
  GRANTS_SHEET_PNG,
  GRANTS_SHEET_W,
  GRANTS_SOURCE,
  GRANT_FLIGHTS,
  type GrantFlight,
} from "./GrantsAcrossTheWorldData";

export const FPS = 24000 / 1001;
export const DURATION = 105;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- the sheet, in world px (centred on the frame's true middle at rest) -----------------------------------------
const SHEET_X = W / 2 - GRANTS_SHEET_W / 2;
const SHEET_Y = H / 2 - GRANTS_SHEET_H / 2;
const SHEET_TURN = -0.5; // deg: the sheet lies a touch askew on the paper

// ---- the camera: one slow push-in, already moving at f0 and still creeping at f104 --------------------------------
const smoother = (f: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (f - a) / (b - a)));
  return t * t * t * (t * (6 * t - 15) + 10);
};
const camRaw = (f: number) => {
  const g = smoother(f, -34, 150);
  return { x: W / 2 + 22 * g, y: H / 2 + 8 * g, k: 0.996 + 0.072 * g };
};
const C0 = camRaw(0);
export const camAt = (f: number): NealCam => ({ ...camRaw(f), x0: C0.x, y0: C0.y });

// ---- a flight ------------------------------------------------------------------------------------------------------
const S = GRANTS_SOURCE;
/** progress along the arc: a tiny launch out of the source, a cruise, a soft landing */
const flyEase = Easing.bezier(0.32, 0.035, 0.36, 1);
const TRAIL_LAG = 8; // frames the trail's tail runs behind the envelope (it then draws itself into the dot)
const TRAIL_SEGS = 10;
const TRAIL_W = 3;
const TRAIL_SHADOW = 2.5;
const TRAIL_OP = 0.85;
const LAND_F = 5; // the envelope folds into its dot over its last LAND_F frames
const DOT_R = 4.8;
const DOT_SHADOW = 2.5;
const RING_F = 14;
const RING_GROW = 16;
const ENV_W = 24;
const ENV_H = 16;
const HUB_R = 12; // the source disc: an envelope at launch scale is wholly behind it
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
      <path d={flap} stroke={SHADOW} strokeWidth={1.7} fill="none" strokeLinejoin="round" />
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
    <circle cx={S.x + SHADOW_OFF} cy={S.y + SHADOW_OFF} r={18} stroke={SHADOW} strokeWidth={3.5} fill="none" />
    <circle cx={S.x + SHADOW_OFF} cy={S.y + SHADOW_OFF} r={HUB_R} fill={SHADOW} />
    <circle cx={S.x} cy={S.y} r={18} stroke={INK} strokeWidth={3.5} fill="none" />
    <circle cx={S.x} cy={S.y} r={HUB_R} fill={INK} />
  </g>
);

const GrantsAcrossTheWorld: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <AbsoluteFill>
      <NealFilmLife frame={frame}>
        <NealPaper frame={frame} cam={cam} />
        <NealPlane cam={cam}>
          <div
            style={{
              position: "absolute",
              left: SHEET_X,
              top: SHEET_Y,
              width: GRANTS_SHEET_W,
              height: GRANTS_SHEET_H,
              transform: `rotate(${SHEET_TURN}deg)`,
              transformOrigin: "50% 50%",
            }}
          >
            <div style={{ position: "absolute", left: SHADOW_OFF, top: SHADOW_OFF, width: GRANTS_SHEET_W, height: GRANTS_SHEET_H, background: SHADOW }} />
            <Img
              src={staticFile(GRANTS_SHEET_PNG)}
              style={{ position: "absolute", left: 0, top: 0, width: GRANTS_SHEET_W, height: GRANTS_SHEET_H, maxWidth: "none" }}
            />
            <svg
              width={GRANTS_SHEET_W}
              height={GRANTS_SHEET_H}
              viewBox={`0 0 ${GRANTS_SHEET_W} ${GRANTS_SHEET_H}`}
              style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
            >
              <g transform={`translate(${GRANTS_MAP_MARGIN} ${GRANTS_MAP_MARGIN})`}>
                <Flights f={frame} />
                <Hub />
              </g>
            </svg>
          </div>
        </NealPlane>
      </NealFilmLife>
    </AbsoluteFill>
  );
};

export default GrantsAcrossTheWorld;
