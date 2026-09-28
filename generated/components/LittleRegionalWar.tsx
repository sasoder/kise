import React from "react";
import { AbsoluteFill, Easing, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CAM_DAMP,
  CAM_LIFT,
  CAM_STIFF,
  FRAME_H,
  FRAME_W,
  camEase,
  clamp01,
  hash,
  smoothstep,
  sway,
} from "./fieldShared";
// The same 1914 world as EverybodyWants (scripts/build-ww1-map.mjs: Natural
// Earth 10m + hand-corrected 1914 polities on a north-up Lambert azimuthal
// equal-area centred 15 E, 25 N). The static land and borders are RGBA rasters
// baked by scripts/bake-lrw-rasters.mjs; the pushed borders are vectors.
import { LRW_PLACES, PUSHES } from "./lrwOverlay";
import { LEVELS } from "./lrwLevels";

export const FPS = 24;
// In-point 3.60 s of the clip SRT = f0; frame = round((t - 3.60) * 24).
// The line ends with "europe" at 10.94 s: round((10.94 - 3.60) * 24) = 176,
// + the 16-frame house tail = 192.
export const DURATION = 192;

// ---------------------------------------------------------------------------
// Sarah Paine: "Everyone before World War I thinks they're going to run a
// little regional war, and they're going to poach some territory from
// somebody else in Europe."
//
// TRANSPARENT overlay, 1080x1920, 24 fps: only the land masses, in the Dwarkesh
// map style, over the editor's footage. The sea is alpha 0: no sea fill, no
// water-lines, no graticule, no vignette.
//   land   #3F3428, hand-coloured rim #6A5838 inside the coast, cream coast
//          #E9DDBF, world-space mottle and grain clipped to land, and one soft
//          contact shadow under it (black, offset down, blurred, 0.3) baked
//          into the raster's alpha so the land reads over busy footage
//   ink    the 1914 borders, fine dashed cream 0.5 (colonial 0.32)
//   accent #FFB000 / #D98A0C = POACHED TERRITORY, and nothing else: the orange
//          hatch with the dashed orange edge, exactly as in EverybodyWants
//   ladder a border line is 0.5 (normal), 0.2 (outside the little war), 0.25
//          (the ghost of where it was); one stroke weight per line kind
// No text, no capital dots, no ties, no arrows.
//
// THE GESTURES, each with its word (frames from the SRT):
//   1. f0-56   a Europe wide (k 1.22, Europe centred near y 835; its lowest
//      land, the Peloponnese, above y 1150), a floating island of Europe
//      (the land feathers out over ~300 km beyond it), a slow creep in. Calm;
//      nothing orange
//                                                  — "everyone before World War I thinks"
//   2. f56-100 one damped glide pushes in to the Austria-Hungary / Serbia
//      border, the July 1914 war (k 3.4, lands ~f80). On "regional" (f84-94) the
//      1914 borders outside a ~260 km radius of it fade to 0.2; the local
//      border stays at 0.5                     — "run a little regional war"
//   3. f121-150 the Austro-Serbian border itself moves: the dashed line along
//      the Drina, the Sava and the Danube slides south-east into Serbia as one
//      smooth bulge (115 km deepest, towards Kragujevac), the orange hatch filling the ground it
//      sweeps BEHIND the moving line (the line is the front), its old place a
//      faint dashed ghost (0.25). Starts on "poach" f121, ~2/3 on "territory"
//      f133, settled f150          — "poach some territory from somebody else"
//   4. f146-192 the camera pulls back to the Europe wide in one damped glide
//      (lands ~f168); the other borders return to full (f150-168); the SAME
//      push happens at seven more borders, starts hashed f150-172, each
//      settling in 18 f: France into Alsace-Lorraine, Italy north into the
//      Trentino and the Tyrol,
//      Russia into Galicia, Germany into Russian Poland, Romania into
//      Transylvania, Bulgaria into Macedonia. By f176
//      every border in Europe is being pushed at once. Hold: ~3% creep and a
//      faint highlight travelling the orange edges to the end
//                                                        — "somebody else in Europe"
// Nothing else: no flashes, pulses, labels or icons.
// ---------------------------------------------------------------------------

export const LAND = "#3F3428";
export const LAND_RIM = "#6A5838";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
export const SHADOW = 0.3;
const HILITE = "#FFE3A6";

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  /** preview only: a backdrop to judge the alpha against; the delivery is transparent */
  backdrop: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backdrop: "transparent",
});

export const T = {
  regional: [84, 94] as const, // "regional": the rest of Europe fades down
  poach: [121, 150] as const, // "poach" .. settled; ~2/3 on "territory" f133
  undim: [150, 168] as const, // the borders return to full as the camera pulls back
  others: [150, 172] as const, // the other pushes start, hashed, in this window
  otherDur: 18,
  hold: [172, 192] as const, // the edge highlight
};
const ramp = (f: number, a: number, b: number) => smoothstep((f - a) / (b - a));

// ---------------------------------------------------------------------------
// THE CAMERA: holds that creep, van Wijk glides between them under the house
// ease, damped by the house spring (log k, x, cy). cy = c + CAM_LIFT / k puts
// the content centre c on screen y 835.
// ---------------------------------------------------------------------------
type View = { k: number; x: number; c: number };
const V = (p: { x: number; y: number }, k: number): View => ({ k, x: p.x, c: p.y });
const SHOTS = {
  wide: V(LRW_PLACES.shotWide, 1.22),
  serbia: V(LRW_PLACES.shotSerbia, 3.4),
};
// [shot, hold start, hold end, creep]
const PLAN: [keyof typeof SHOTS, number, number, number][] = [
  ["wide", 0, 56, 0.025],
  ["serbia", 72, 146, 0.02],
  ["wide", 162, DURATION, 0.03],
];
const RHO = 1.25;
const zoomPath = (a: View, b: View) => {
  const w0 = FRAME_W / a.k;
  const w1 = FRAME_W / b.k;
  const dx = b.x - a.x;
  const dy = b.c - a.c;
  const d2 = dx * dx + dy * dy;
  const r2 = RHO * RHO;
  if (d2 < 1e-6) {
    const S = Math.log(w1 / w0) / RHO;
    return (t: number): View => ({ x: a.x + t * dx, c: a.c + t * dy, k: FRAME_W / (w0 * Math.exp(RHO * t * S)) });
  }
  const d1 = Math.sqrt(d2);
  const b0 = (w1 * w1 - w0 * w0 + r2 * r2 * d2) / (2 * w0 * r2 * d1);
  const b1 = (w1 * w1 - w0 * w0 - r2 * r2 * d2) / (2 * w1 * r2 * d1);
  const q0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0);
  const q1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
  const S = (q1 - q0) / RHO;
  return (t: number): View => {
    const s = t * S;
    const u = (w0 / (r2 * d1)) * (Math.cosh(q0) * Math.tanh(RHO * s + q0) - Math.sinh(q0));
    const w = (w0 * Math.cosh(q0)) / Math.cosh(RHO * s + q0);
    return { x: a.x + u * dx, c: a.c + u * dy, k: FRAME_W / w };
  };
};
const creepAt = (i: number, f: number) => {
  const [, h0, h1, amt] = PLAN[i];
  const u = clamp01((f - h0) / Math.max(1, h1 - h0));
  return 1 + amt * u * u * (1.5 - 0.5 * u);
};
const camTarget = (f: number): View => {
  for (let i = 0; i < PLAN.length; i++) {
    const [name, h0, h1] = PLAN[i];
    const s = SHOTS[name];
    if (f >= h0 && f <= h1) return { ...s, k: s.k * creepAt(i, f) };
    const next = PLAN[i + 1];
    if (next && f > h1 && f < next[1]) {
      const from = { ...s, k: s.k * creepAt(i, h1) };
      return zoomPath(from, SHOTS[next[0]])(camEase((f - h1) / (next[1] - h1), 0.85));
    }
  }
  return SHOTS.wide;
};
export const CAM_TRACK = (() => {
  const out: { k: number; cx: number; cy: number }[] = [];
  const t0 = camTarget(0);
  let lk = Math.log(t0.k);
  let cx = t0.x;
  let cy = t0.c + CAM_LIFT / t0.k;
  let vk = 0;
  let vx = 0;
  let vy = 0;
  out.push({ k: t0.k, cx, cy });
  for (let f = 1; f <= DURATION; f++) {
    const t = camTarget(f);
    vk += (Math.log(t.k) - lk) * CAM_STIFF - vk * CAM_DAMP;
    lk += vk;
    vx += (t.x - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (t.c + CAM_LIFT / t.k - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    out.push({ k: Math.exp(lk), cx, cy });
  }
  return out;
})();

// ---------------------------------------------------------------------------
// The raster levels. `serbia` sits over `wide`. With alpha, a plain crossfade
// would thin the land mid-fade, so the two are staged: the crop fades in over
// the full wide (f67-72, k 2.0-2.8), then the wide fades out under the full
// crop (f72-77); on the way out the wide fades back in under the crop
// (f148-153), then the crop fades out over it (f153-158). Land alpha never dips.
// ---------------------------------------------------------------------------
const levelOp = (name: string, f: number) =>
  name === "wide"
    ? Math.max(1 - ramp(f, 72, 77), ramp(f, 148, 153))
    : ramp(f, 67, 72) * (1 - ramp(f, 153, 158));

// ---------------------------------------------------------------------------
// The pushes. Each is a 1914 border stretch (world px) moved along ONE
// direction into the victim by depth * bump * e, bump = sin^2 of the vertex's
// position across that direction (baked), e the push's progress. A shear:
// the moved line can never cross itself.
// ---------------------------------------------------------------------------
type P2 = [number, number];
const PUSH = PUSHES.map((p) => {
  const cum = [0];
  for (let i = 1; i < p.pts.length; i++) cum.push(cum[i - 1] + Math.hypot(p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1]));
  const L = cum[cum.length - 1] || 1;
  let mx = 0;
  let my = 0;
  for (const [x, y] of p.pts) {
    mx += x;
    my += y;
  }
  return { ...p, L, mid: { x: mx / p.pts.length, y: my / p.pts.length } };
});
const OTHERS = PUSH.filter((p) => p.id !== "serbia").map((p) => p.id);
const OTHER_START: Record<string, number> = {};
[...OTHERS]
  .sort((a, b) => hash(a.charCodeAt(0) * 7 + a.length, 13) - hash(b.charCodeAt(0) * 7 + b.length, 13))
  .forEach((id, i) => {
    OTHER_START[id] = T.others[0] + ((T.others[1] - T.others[0]) * i) / (OTHERS.length - 1);
  });
/** 0 (not started) .. 1 (settled) */
const progress = (id: string, f: number) => {
  if (id === "serbia") {
    // starts on "poach" with speed, ~2/3 on "territory", settles by f150
    const u = clamp01((f - T.poach[0]) / (T.poach[1] - T.poach[0]));
    return 1 - (1 - u) * (1 - u);
  }
  const s = OTHER_START[id];
  return Easing.inOut(Easing.cubic)(clamp01((f - s) / T.otherDur));
};

// "a little regional war": everything outside this radius fades to 0.2
const REGION_R = 260 * 0.2637; // world px (~260 km)
const REGION_FEATHER = 60 * 0.2637;
const DIM = 0.2 / 0.5; // the ladder: 0.5 -> 0.2

const dOf = (pts: P2[]) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;

// ---------------------------------------------------------------------------
const LittleRegionalWar: React.FC<Props> = ({ ink, accent, accentDeep, backdrop }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(DURATION, Math.max(0, Math.round(frame)));
  const cam = CAM_TRACK[fi];
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx / k;
  const cy = cam.cy + drift.dy / k;
  const tx = FRAME_W / 2 - cx * k;
  const ty = FRAME_H / 2 - cy * k;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  const px = (v: number) => v / k;

  // the rest of Europe's borders: down on "regional", back as the camera leaves
  const dimT = ramp(frame, T.regional[0], T.regional[1]) * (1 - ramp(frame, T.undim[0], T.undim[1]));
  const outerA = 1 - (1 - DIM) * dimT; // multiplier outside the region
  const dimAt = (p: { x: number; y: number }) => {
    const d = Math.hypot(p.x - LRW_PLACES.regionCentre.x, p.y - LRW_PLACES.regionCentre.y);
    return 1 - (1 - outerA) * smoothstep((d - REGION_R) / REGION_FEATHER);
  };

  const levelImg = (L: (typeof LEVELS)[number], layer: "land" | "borders", op: number) => {
    let mask: string | undefined;
    if (layer === "borders" && outerA < 0.999) {
      const lx = (LRW_PLACES.regionCentre.x - L.x0) * L.s;
      const ly = (LRW_PLACES.regionCentre.y - L.y0) * L.s;
      const r0 = REGION_R * L.s;
      const r1 = (REGION_R + REGION_FEATHER) * L.s;
      mask = `radial-gradient(circle at ${lx.toFixed(1)}px ${ly.toFixed(1)}px, #000 ${r0.toFixed(1)}px, rgba(0,0,0,${outerA.toFixed(3)}) ${r1.toFixed(1)}px)`;
    }
    return (
      <Img
        key={`${L.name}-${layer}`}
        src={staticFile(`lrw/${L.name}-${layer}.png`)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: L.W,
          height: L.H,
          transformOrigin: "0 0",
          transform: `translate(${(tx + L.x0 * k).toFixed(3)}px, ${(ty + L.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
          opacity: op,
          WebkitMaskImage: mask,
          maskImage: mask,
        }}
      />
    );
  };

  // hatch octaves, as in EverybodyWants: screen spacing 11-22 px
  const L2 = Math.log2(k);
  const oct = Math.floor(L2);
  const octT = smoothstep(L2 - oct);
  const HS = 11 / Math.pow(2, oct);
  const dash = `${px(8)} ${px(5)}`;

  const holdT = ramp(frame, T.hold[0], T.hold[0] + 8);

  return (
    <AbsoluteFill style={{ backgroundColor: backdrop }}>
      {/* the static land, then the static borders (the region mask dims them) */}
      {LEVELS.map((L) => {
        const op = levelOp(L.name, frame);
        return op > 0.001 ? levelImg(L, "land", op) : null;
      })}
      {LEVELS.map((L) => {
        const op = levelOp(L.name, frame);
        return op > 0.001 ? levelImg(L, "borders", op) : null;
      })}

      {/* the pushed borders */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
        <defs>
          <pattern id="hA" patternUnits="userSpaceOnUse" width={HS} height={HS} patternTransform="rotate(45)">
            <line x1={HS / 2} y1={0} x2={HS / 2} y2={HS} stroke={accent} strokeWidth={px(2)} />
          </pattern>
          <pattern id="hB" patternUnits="userSpaceOnUse" width={HS} height={HS} patternTransform="rotate(45)">
            <line x1={0} y1={0} x2={0} y2={HS} stroke={accent} strokeWidth={px(2)} />
            <line x1={HS} y1={0} x2={HS} y2={HS} stroke={accent} strokeWidth={px(2)} />
          </pattern>
        </defs>
        <g transform={camT}>
          {PUSH.map((p) => {
            const e = progress(p.id, frame);
            const dimF = dimAt(p.mid);
            // the 1914 line: full until the push starts, then its ghost
            const ghost = (
              <path
                key={`${p.id}-g`}
                d={dOf(p.pts)}
                fill="none"
                stroke={ink}
                strokeOpacity={(0.5 - 0.25 * smoothstep(e / 0.3)) * dimF}
                strokeWidth={px(1.7)}
                strokeDasharray={dash}
                strokeLinecap="round"
              />
            );
            // the REVEAL rule: nothing at e = 0
            if (e <= 0) return ghost;
            const cur: P2[] = p.pts.map(([x, y], i) => [x + p.dir[0] * p.depth * p.bump[i] * e, y + p.dir[1] * p.depth * p.bump[i] * e]);
            const region = `${dOf(p.pts)}L${[...cur]
              .reverse()
              .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
              .join("L")}Z`;
            const curD = dOf(cur);
            // the hold's travelling highlight
            const ph = ((((frame - T.hold[0]) * 1.4 + hash(p.id.length, 3) * 30) % 40) + 40) % 40 / 40;
            const shOp = holdT * Math.sin(Math.PI * ph) * 0.55;
            return (
              <g key={p.id}>
                {ghost}
                <path d={region} fill={accentDeep} fillOpacity={0.2} fillRule="evenodd" />
                <path d={region} fill="url(#hA)" fillRule="evenodd" opacity={0.85} />
                {octT > 0.01 ? <path d={region} fill="url(#hB)" fillRule="evenodd" opacity={0.85 * octT} /> : null}
                {/* the new border: cream dashes, the orange edge in their gaps */}
                <path d={curD} fill="none" stroke={accent} strokeWidth={px(2.2)} strokeDasharray={`${px(6.5)} ${px(6.5)}`} strokeDashoffset={-px(6.5)} strokeLinecap="round" />
                <path d={curD} fill="none" stroke={ink} strokeOpacity={0.5 * dimF + 0.35} strokeWidth={px(1.7)} strokeDasharray={`${px(6.5)} ${px(6.5)}`} strokeLinecap="round" />
                {shOp > 0.01 ? (
                  <path
                    d={curD}
                    fill="none"
                    stroke={HILITE}
                    strokeOpacity={shOp}
                    strokeWidth={px(2.6)}
                    pathLength={1}
                    strokeDasharray="0.16 2"
                    strokeDashoffset={-(ph * 1.16 - 0.16)}
                    strokeLinecap="round"
                  />
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default LittleRegionalWar;
