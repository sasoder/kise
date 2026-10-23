// ---------------------------------------------------------------------------
// NoSustainedProgress (kyle-greek-math, cut 38). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 188 frames. In the Stair of Greek mathematics (./greekStairWorld.tsx, shared with cuts
// A and C; contract <notes>/STAIR_READY.md, read-only). Camera, the never-built stair's lines and schedule, Euclid's
// turn and the world options: ./noSustainedProgressPlan.ts.
//
// CHECK LINE: "After Euclid the stair simply stops: the steady climb that should have followed was never built — only a
// few lone columns stand far off in the fog."
//
// THE LINE: "[But it just sort of feels like after] him, you fail to get that kind of sustained, continuous progress and
// advance. [So maybe sort of back to that big question…]"
// WORD -> FRAME (Whisper onsets, ~0.2 s early): him 6 · you 17 · fail 21 · to get 29-43 · that kind 43-57 · of 57 ·
// sustained 65-86 · continuous 97-122 · progress 122-147 · and advance 147-166 · So maybe sort 172-190
// DURATION: the slot 38.739 -> 45.012 s; 1349 - 1161 = 188 frames at 29.97 (f0..f187).
//
// THE MOTION: f0 is cut C's last frame exactly (C_END: camera, world clock, rest camera, options, Euclid's pose;
// asserted at module load; the join proved by a still-vs-still difference of C f228 and D f0: byte-identical). One
// crane (one velocity lobe from C's own end velocity, peak ~f35, through the kit's damped follow) up the stair toward
// Euclid and over his landing: the generations sink out of the bottom of the frame, the fog sea at the foot drains
// on and thins away (gone by f46) as the eye rises, and the lens widens as the eye closes in (F 3744 -> 1032), so the
// world opens out round him: by "fail to get" (f29-43) the eye is level with his landing, by f53 over it, seeing that
// the stair simply stops at him: the landing's back edge, a sheer drop, fog and empty air beyond, the lone columns
// small and far apart in the haze. Euclid turns from the generations (and us) round to his right until he faces the
// emptiness beyond the landing (the head leads f0-80, the body follows f4-90; slow, no flip: the cast's pop audit is
// clean but one 0.34 crossfade step of the far eye at f42); seen from behind he looks up where the stair should go on,
// the Elements glowing round him. From f53 two bright orange tips leave the landing's back corners and draw the stair
// that was never built in DASHED orange (greekStairWorld NEVER_BUILT, continued in its rhythm and taper to 8 steps):
// up each riser, back along each tread, each nosing and each tread's back edge drawn in from both ends; the first
// step lands ~f67-75 ("sustained"), the run steady (0.146 m per frame) through "continuous", climbing on into the
// light and out of the top of the frame ~f150 ("progress and advance"). The dashed steps are empty. CAUSE: each dash
// exists only where a tip has passed; the tips start on the landing's back corners (contact f53). The crane
// decelerates (~99 % by f122) into a calm creep: a slow lens zoom about the row y 1305, so the gap between the caption
// bands keeps its contents still. As Euclid turns away, Eudoxus (the generation just under him) slowly lowers his
// tablet from its offer up to the landing down to his hips (f62-108; the plan's eudoxusD, drawn here through the
// world's renderFigure), his gaze still up on the landing: the offer up the stair has ended, and the carved EUCLID
// reads whole from f95 (the raised tablet's corner had covered the E). f150-187 settled and living: Euclid at the edge
// looking out, the dashed stair glowing faintly, motes, shafts, the figures' idle.
// Orange = Greek mathematical knowledge (solid: the tablets, the Elements); DASHED orange = the progress that never
// came. People never orange. No text but EUCLID carved in the landing's riser (the world's).
//
// DEPTH: the world's level pinhole (StairCam: eye X, height E, depth Zc, focal F, horizon row hy), U = 178 per metre.
// f0: C_END (eye 6 m up, 26.3 m in front of Euclid, F 3744). The resolved framing (~f120 on): eye 15 m up, 6.5 m in
// front of Euclid (over the stair's foot), F 1032; Euclid ~300-317 px in the lower middle (head y ~818, his face,
// hands and the Elements above the caption band, his feet in it); the dashed stair from the landing's back edge
// (y ~860) out of the top of the frame; Archimedes, Ptolemy and Apollonius small in the haze either side; Eudoxus's
// face and the carved EUCLID in the gap between the bands (y ~1263-1356 from f106 on), his lowered tablet and hands
// below the lower band (y >= 1460); Theaetetus and the rest below the frame. Diophantus's column stays down in the low air (rise 0: from the stair it would stand right on
// Apollonius's head) and the aqueduct is hidden. Painter's order: the far world (the light, the columns), the dashed
// lines, the stair with its figures and the fog, then the drawing tips (never within 49 px of Euclid).
//
// SOURCES: none on screen (the world's diagrams: see greekStairWorld's header).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, AIR, c01 } from "../kits/dwarkesh-3d/dwarkesh3d";
import * as GF from "./greekFolk";
import { C_END, DASH, GENERATIONS, GEN_LOOK, GreekStairWorld, NEAR, StairStage, U, stairAirOf, type Line3, type StairAir, type StairCam, type V3, type WorldOpts } from "./greekStairWorld";
import { D_DURATION, EUDOXUS, NB_BACKS, NB_LEFT, NB_NOSINGS, NB_RIGHT, backProg, cameraD, eudoxusD, lowerU, nosingProg, optsD, tipS } from "./noSustainedProgressPlan";

export const FPS = 30000 / 1001;
export const DURATION = 188;
if (DURATION !== D_DURATION) throw new Error("NoSustainedProgress: DURATION != plan");
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
  /** probe only: a camera "E,Dz,F,headY,X" (metres, px) instead of the cut's */
  probeCam: z.string().default(""),
  /** probe only: Euclid's turn "body,head,nod" (absolute yaws, rad; nod deg) instead of the cut's */
  probeTurn: z.string().default(""),
  /** probe only: draw Eudoxus through the cut's own renderer even before he lowers his tablet (the switch test) */
  probeEudoxus: z.boolean().default(false),
});
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const Pt = (v: [number, number]) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;

/** a point at arc length s along a line */
const atLen = (ln: Line3, s: number): V3 => {
  let k = 1;
  while (k < ln.len.length - 1 && ln.len[k] < s) k++;
  const a = ln.pts[k - 1];
  const b = ln.pts[k];
  const u = (s - ln.len[k - 1]) / Math.max(1e-6, ln.len[k] - ln.len[k - 1]);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
};
const visZ = (S: StairAir, Z: number) => Z - S.c.Zc > NEAR;

/** dashes along a line from 0 to `upto` (world-anchored: period DASH.on + DASH.off from the line's start; a dash
 *  rounds a corner) as one path */
const dashPath = (S: StairAir, ln: Line3, upto: number, period = DASH.on + DASH.off, on = DASH.on) => {
  let d = "";
  for (let s0 = 0; s0 < upto - 1e-6; s0 += period) {
    const s1 = Math.min(upto, s0 + on);
    const pts: V3[] = [atLen(ln, s0)];
    for (let k = 1; k < ln.len.length - 1; k++) if (ln.len[k] > s0 && ln.len[k] < s1) pts.push(ln.pts[k]);
    pts.push(atLen(ln, s1));
    if (pts.some((p) => !visZ(S, p[2]))) continue;
    d += `M${pts.map((p) => Pt(S.q(p[0], p[1], p[2]))).join("L")}`;
  }
  return d;
};

/** THE NEVER-BUILT STAIR, drawn by the tips: two side profiles (zig-zags) climbing together, each nosing drawn from
 *  both ends in to the middle; dashed orange with a faint glow under, a soft bright tip at each drawing front */
const NeverBuiltDrawn: React.FC<{ S: StairAir; f: number; part: "lines" | "tips" }> = ({ S, f, part }) => {
  const s = tipS(f);
  if (s <= 0) return null;
  const lines: { d: string; Z: number; H: number }[] = [];
  const tips: { p: V3; r: number }[] = [];
  for (const prof of [NB_LEFT, NB_RIGHT]) {
    const L = prof.line.len[prof.line.len.length - 1];
    const upto = Math.min(L, s);
    const mid = atLen(prof.line, upto / 2);
    lines.push({ d: dashPath(S, prof.line, upto), Z: mid[2], H: mid[1] });
    if (s < L) tips.push({ p: atLen(prof.line, upto), r: 1 });
  }
  const edges = [...NB_NOSINGS.map((n) => ({ ...n, q: nosingProg(n.s, f) })), ...NB_BACKS.map((n) => ({ ...n, q: backProg(n.s, f) }))];
  for (const n of edges) {
    const q = n.q;
    if (q <= 0) continue;
    // each half from its outer end in to the middle, a whole number of dashes per half (meeting with one gap)
    const per0 = DASH.on + DASH.off;
    const cnt = Math.max(1, Math.round((n.hw + DASH.off / 2) / per0));
    const per = (n.hw + DASH.off / 2) / cnt;
    const on = per * (DASH.on / per0);
    for (const side of [-1, 1]) {
      const half: Line3 = { pts: [[side * n.hw, n.H, n.Z], [0, n.H, n.Z]], len: [0, n.hw] };
      lines.push({ d: dashPath(S, half, q * n.hw, per, on), Z: n.Z, H: n.H });
      if (q < 1) tips.push({ p: atLen(half, q * n.hw), r: 0.62 });
    }
  }
  const glowW = (Z: number) => Math.max(1.3 / S.k, 0.03 * U * S.P.r(Z));
  if (part === "tips")
    return (
      <g>
        <defs>
          <radialGradient id="nbd-tip">
            <stop offset="0" stopColor={PAL.orangeHot} stopOpacity={0.95} />
            <stop offset="0.3" stopColor={PAL.orange} stopOpacity={0.6} />
            <stop offset="1" stopColor={PAL.orange} stopOpacity={0} />
          </radialGradient>
        </defs>
        {tips.map((t, i) => {
          if (!visZ(S, t.p[2])) return null;
          const c = S.q(t.p[0], t.p[1], t.p[2]);
          const r = 0.17 * U * t.r * S.P.r(t.p[2]);
          return <circle key={`t${i}`} cx={c[0]} cy={c[1]} r={r} fill="url(#nbd-tip)" />;
        })}
      </g>
    );
  return (
    <g>
      {lines.map((l, i) =>
        l.d ? (
          <g key={i}>
            <path d={l.d} fill="none" stroke={S.toneO(ACCENT, l.Z, l.H)} strokeWidth={glowW(l.Z) * 3.2} strokeOpacity={0.16} strokeLinecap="round" strokeLinejoin="round" />
            <path d={l.d} fill="none" stroke={S.toneO(ACCENT, l.Z, l.H)} strokeWidth={glowW(l.Z)} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null,
      )}
    </g>
  );
};

/** the world's tablet flare (greekStairWorld's Flare, not exported; the same drawing): a warm halo on a held diagram */
const TabletFlare: React.FC<{ S: StairAir; c: [number, number]; Z: number; H: number; R: number; glow: number; uid: string }> = ({ S, c, Z, H, R, glow, uid }) => {
  const fl = c01(glow - 1);
  if (fl < 0.01) return null;
  const r = R * S.P.r(Z) * (1 + 0.5 * fl);
  const a = fl * (1 - S.fogAmt(Z, H));
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-fl`}>
          <stop offset="0" stopColor={PAL.orangeHot} stopOpacity={0.5 * a} />
          <stop offset="0.3" stopColor={PAL.orange} stopOpacity={0.28 * a} />
          <stop offset="1" stopColor={PAL.orange} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={r} ry={r * 0.85} fill={`url(#${uid}-fl)`} />
    </g>
  );
};
/** EUDOXUS LOWERING HIS TABLET (the world's GenerationFig drawing, with the plan's pose and tablet point; the world
 *  keeps his wall and contact shadows) */
const EudoxusLowering: React.FC<{ S: StairAir; f: number }> = ({ S, f }) => {
  const g = EUDOXUS;
  if (g.Z - S.c.Zc <= NEAR + 0.3 * U) return null;
  const veil = S.figVeil(g.Z, g.H);
  if (veil.tone < 0.01) return null;
  const { pose, tab } = eudoxusD(f);
  const look = GEN_LOOK[g.id];
  const c = S.q(tab.X, tab.H, tab.Z);
  return (
    <g>
      <GF.GreekFigure kind="scholar" variant={look.variant} pose={pose} at={S.q(g.X, g.H, g.Z)} scale={S.P.r(g.Z)} uid={`fg-${g.id}`} fog={veil.fog} tone={veil.tone} unitPx={S.k} held={{ two: "tablet", diagram: look.diagram, tilt: tab.tilt }} itemAt={{ c, ang: tab.rot }} />
      <TabletFlare S={S} c={c} Z={tab.Z} H={tab.H} R={0.55 * U} glow={S.opts.glow?.[g.id] ?? 1} uid={`fl-${g.id}`} />
    </g>
  );
};

const probeCamOf = (s: string): StairCam | null => {
  if (!s) return null;
  const [E, Dz, F, headY, X] = s.split(",").map(Number);
  const Zc = 6.5 * U - Dz * U;
  const head = 9.6 * U + 312;
  return { X: X * U, E: E * U, Zc, F, hy: headY + (F * (head - E * U)) / (Dz * U) };
};

const ALL_GEN = GENERATIONS.map((g) => g.id);
const NoSustainedProgress: React.FC<z.infer<typeof schema>> = ({ camFrame, probeCam, probeTurn, probeEudoxus }) => {
  const frame = useCurrentFrame();
  const cam = probeCamOf(probeCam) ?? cameraD(camFrame >= 0 ? camFrame : frame);
  const t = C_END.t + frame;
  const pt = probeTurn ? probeTurn.split(",").map(Number) : null;
  const o = optsD(frame, pt ? { body: pt[0], head: pt[1], nod: pt[2] ?? 0 } : undefined);
  const hide = o.hide ?? [];
  // the far world (the light, the columns), then the never-built stair's dashes, then the stair, its figures and the
  // fog, then the drawing tips (their glow spills over the landing's back edge where they start; they never pass
  // over a figure)
  const farOpts: WorldOpts = { ...o, hide: [...hide, "stair", "cloud", "euclid", ...ALL_GEN] };
  const ownEudoxus = probeEudoxus || lowerU(frame) > 0;
  const nearOpts: WorldOpts = {
    ...o,
    hide: [...hide, "light", "aqueduct", "columns"],
    renderFigure: (id, S) => (id === EUDOXUS.id && ownEudoxus ? <EudoxusLowering S={S} f={frame} /> : undefined),
  };
  const Sf = stairAirOf(cam, t, C_END.rest, farOpts);
  const Sn = stairAirOf(cam, t, C_END.rest, nearOpts);
  return (
    <StairStage S={Sn}>
      <GreekStairWorld S={Sf} />
      <NeverBuiltDrawn S={Sn} f={frame} part="lines" />
      <GreekStairWorld S={Sn} />
      <NeverBuiltDrawn S={Sn} f={frame} part="tips" />
    </StairStage>
  );
};

export default NoSustainedProgress;
