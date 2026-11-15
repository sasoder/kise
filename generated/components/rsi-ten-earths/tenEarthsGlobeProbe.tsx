// ---------------------------------------------------------------------------
// tenEarthsGlobeProbe (rsi-ten-earths): the probe of the shared Earth globe module (tenEarthsGlobe.tsx), not a cut.
// Dwarkesh 3D style (styles/dwarkesh-3d.md), 1080x1920, 23.976 fps.
// TenEarthsGlobeProbe, one state per frame:
//   f0 the hero Earth turned to China (r 350 = 700 px, centred y 820), china 0
//   f1 china 1 (China lit cream)        f2 cover 0.12 (exactly China)    f3 cover 0.5    f4 cover 1 (all land)
//   f5 cover 1 + sea 1 (a fully orange planet)    f6 ten OrangeEarths in a gentle arc (~120-170 px)
//   f7 close-up (r 1500, centred on China): the tide front at cover 0.07, made of tiny orange figures
//   f8 the hero at cover 0.16 (the front just past China's border)   f9 china 1 + cover 0.12 (as f2)
//   f10 china 0, cover 0.6 + sea 0.4 (both fronts at once)   f11 the budget case: the hero (700 px) + ten mid globes
//   f12 clipY: three OrangeEarths rising from behind a roof line at y 900
// TenEarthsGlobeSweep (90 frames): cover 0 -> 1 (f4-f60), then sea 0 -> 1 (f60-f88), with a slow turn (lon 92 -> 108),
// china 1: the every-frame preview for pops.
// The air: palette A, fog by depth; the hero at Z 400 (fog ~0.15), the ring of ten at Z 700-1300.
// ---------------------------------------------------------------------------
import React from "react";
import { interpolate, useCurrentFrame, Easing } from "remotion";
import { z } from "zod";
import { AirStage, airWorldOf, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CHINA_CENTROID, CHINA_FACE, GLOBE_DEBUG, GlobeLayer, drawGlobe, globeFog, type GlobeSpec } from "./tenEarthsGlobe";
import { useLayoutEffect, useRef } from "react";

export const FPS = 24000 / 1001;
export const PROBE_FRAMES = 13;
export const SWEEP_FRAMES = 90;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const DEPTH: DepthOpts = { eyeY: 1250, dRef: 1800, kRef: 1, dolly: 0.5 };
const CAM: Cam = { k: 1, cx: 540, cy: 960 };
const air = (frame: number) => airWorldOf({ cam: CAM, rest: CAM, depth: DEPTH, frame, fogBy: "depth" });

const HERO = { cx: 540, cy: 820, r: 350, ...CHINA_FACE };
type AW = ReturnType<typeof air>;
/** ten OrangeEarths in a gentle arch: a shallow ring seen from a little below its plane, so the middle (far) ones sit
 *  higher and smaller and the ends (near) lower and larger; painted far to near */
const tenArc = (A: AW): GlobeSpec[] =>
  Array.from({ length: 10 }, (_, i) => {
    const t = i / 9;
    const far = Math.sin(Math.PI * t); // 1 = the middle of the arch, the farthest
    const Z = 700 + 500 * far;
    const s = 1.12 - 0.22 * far;
    return { i, Z, cx: 110 + 860 * t, cy: 830 - 100 * far, r: 70 * s };
  })
    .sort((p, q) => q.Z - p.Z)
    .map((p) => ({ cx: p.cx, cy: p.cy, r: p.r, lon: 20 + p.i * 36, lat: 15, cover: 1, sea: 1, ...globeFog(A, p.Z, 600) }));

export const TenEarthsGlobeProbe: React.FC = () => {
  const frame = useCurrentFrame();
  const A = air(frame);
  const heroFog = globeFog(A, 400, 600);
  let globes: GlobeSpec[] = [];
  const hero = (o: Partial<GlobeSpec>): GlobeSpec => ({ ...HERO, ...heroFog, ...o });
  if (frame === 0) globes = [hero({ china: 0 })];
  else if (frame === 1) globes = [hero({ china: 1 })];
  else if (frame === 2) globes = [hero({ china: 1, cover: 0.12 })];
  else if (frame === 3) globes = [hero({ china: 1, cover: 0.5 })];
  else if (frame === 4) globes = [hero({ china: 1, cover: 1 })];
  else if (frame === 5) globes = [hero({ china: 1, cover: 1, sea: 1 })];
  else if (frame === 6) globes = tenArc(A);
  else if (frame === 7) globes = [{ cx: 540, cy: 820, r: 1500, lon: CHINA_CENTROID[0], lat: CHINA_CENTROID[1], china: 1, cover: 0.07, ...heroFog }];
  else if (frame === 8) globes = [hero({ china: 1, cover: 0.16 })];
  else if (frame === 9) globes = [hero({ china: 1, cover: 0.12 })];
  else if (frame === 10) globes = [hero({ china: 0, cover: 0.6, sea: 0.4 })];
  // f12: clipY, three OrangeEarths rising from behind a roof line at y 900
  else if (frame === 12) globes = [0, 1, 2].map((k) => ({ cx: 300 + 240 * k, cy: 960 - 110 * k, r: 100, lon: 40 + 60 * k, lat: 15, cover: 1, sea: 1, clipY: 900, ...globeFog(A, 900, 600) }));
  // f11: the budget case, one hero (700 px, the tide at its busiest) plus ten mid globes (~150 px) on one canvas
  else globes = [...tenArc(A).map((g) => ({ ...g, cy: g.cy - 330, r: g.r * 0.95 })), hero({ china: 1, cover: 0.6, sea: 0.5, cy: 980 })];
  return (
    <AirStage v={A.v} bloom={0.22}>
      <GlobeLayer globes={globes} logMs={`probe f${frame}`} />
    </AirStage>
  );
};

export const TenEarthsGlobeSweep: React.FC = () => {
  const frame = useCurrentFrame();
  const A = air(frame);
  const cover = interpolate(frame, [4, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  const sea = interpolate(frame, [60, 88], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  const lon = interpolate(frame, [0, SWEEP_FRAMES - 1], [92, 108]);
  return (
    <AirStage v={A.v} bloom={0.22}>
      <GlobeLayer globes={[{ ...HERO, ...globeFog(A, 400, 600), lon, china: 1, cover, sea }]} logMs={`sweep f${frame}`} />
    </AirStage>
  );
};

/** TenEarthsGlobeBench (1 frame): times drawGlobe variants on a CPU canvas, best of 5 each, to the console */
export const TenEarthsGlobeBench: React.FC = () => {
  const frame = useCurrentFrame();
  const ref = useRef<HTMLCanvasElement>(null);
  const A = air(frame);
  useLayoutEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
    const hf = globeFog(A, 400, 600);
    const hero = (o: Partial<GlobeSpec>): GlobeSpec => ({ ...HERO, ...hf, ...o });
    const cases: [string, GlobeSpec[]][] = [
      ["plain", [hero({})]],
      ["china0.12", [hero({ china: 1, cover: 0.12 })]],
      ["cover0.5", [hero({ china: 1, cover: 0.5 })]],
      ["cover1", [hero({ cover: 1 })]],
      ["cover0.6sea0.4", [hero({ cover: 0.6, sea: 0.4 })]],
      ["cover1sea0.5", [hero({ cover: 1, sea: 0.5 })]],
      ["sea1", [hero({ cover: 1, sea: 1 })]],
      ["ten", tenArc(A)],
      ["budget", [...tenArc(A), hero({ cover: 0.6, sea: 0.5, cy: 980 })]],
    ];
    const modes: [string, () => void][] = [
      ["auto", () => Object.assign(GLOBE_DEBUG, { blob: "auto", noDots: false, noMats: false })],
      ["arc", () => Object.assign(GLOBE_DEBUG, { blob: "arc", noDots: false, noMats: false })],

      ["noDots", () => Object.assign(GLOBE_DEBUG, { blob: "auto", noDots: true, noMats: false })],
      ["noMats", () => Object.assign(GLOBE_DEBUG, { blob: "auto", noDots: false, noMats: true })],
    ];
    for (const [mn, set] of modes) {
      set();
      for (const [cn, gs] of cases) {
        let best = 1e9;
        for (let k = 0; k < 5; k++) {
          const t0 = performance.now();
          ctx.clearRect(0, 0, c.width, c.height);
          for (const g of gs) drawGlobe(ctx, g);
          ctx.getImageData(0, 0, 1, 1);
          best = Math.min(best, performance.now() - t0);
        }
        console.log(`[globe-bench] ${mn} ${cn} ${best.toFixed(1)}`);
      }
    }
    Object.assign(GLOBE_DEBUG, { blob: "auto", noDots: false, noMats: false });
  });
  return <canvas ref={ref} width={1080} height={1920} />;
};
