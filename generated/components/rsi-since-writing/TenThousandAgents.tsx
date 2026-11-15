// ---------------------------------------------------------------------------
// TenThousandAgents (rsi-since-writing, cut 69). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 88 frames.
// One stage inside the misty teal air (AirStage, palette A) on a one-point pinhole crane (tenThousandAgentsPlan.ts,
// mapped onto the kit's londonDepth perspective every frame), from the kit kits/dwarkesh-3d/dwarkesh3d.
//
// CHECK LINE: "The work was split across ten thousand AI agents running side by side."
//
// THE LINE: "Now, this thinking was split up across 10,000 different parallel agents,"
// WORD -> FRAME: invented -11 · Now, -1 · this 5 · thinking 15 · was 21 · split 27 · up 34 · across 38 · 10,000 43 ·
// different 58 · parallel 62 · agents, 72 · and 86 (Whisper; may run ~0.2-0.4 s early).
// DURATION: the slot 69.3610 -> 73.0313 s = 3.670 s x 23.976 = 88 frames (f0..f87).
//
// THE MOTION: f0 one Genius (v0, THE AI) ~560 px tall facing us on the sand floor, the air empty around him. From f3
// ("this") his two copies side-step out from behind him to his left and right (live figures, planted feet, full size)
// and stand clear of him (a third of a figure's width between) from ~f12, facing us by f17. Then the field doubles
// outward and backward in seven SPLIT beats (tenThousandAgentsPlan.ts), each landing before the next starts (f17,
// 22, 27, 32, 36, 40, 44): every agent splits in two, its copy sliding out from exactly behind it one cell outward and
// one row back while the ranks spread to make room (3, 10, 36, 136, 528, 2080, 6400, 10000). ONE dolly straight back
// and up from the hero ends on a low crowd view: the front row ~255 px tall, feet at y ~1050, faces ~y 850, the rows
// receding as heads and shoulders to a straight haze horizon at y ~520, the field bleeding off both sides. The 100 x
// 100 field stands complete at f49 (on "10,000", heard ~f48-52); the plate "10,000" (numerals ~95 px) rises in the air
// above the horizon (y ~380-420) from f43; through "different parallel agents" the camera settles, every agent idling
// (a seeded sway), still creeping at the cut. Only the hero and his two first copies are live SVG figures (breathing);
// the other 9,997 are the Genius crowd sprites (v0: copies of the one AI) blitted far to near on one canvas with
// contact shadows and the fog of their depth.
// Orange = the AIs only (COMMON.md): every Genius; the floor, air and plate are the medium's own colours.
// Cause before effect: each copy starts at its source's exact position, EPS deeper (hidden by it); its first visible
// frame is the frame after it starts to slide out from behind.
//
// DEPTH: fog by world depth (fogBy "depth"); the pinhole has F = 1000 px and no pitch; f0 the eye 1.4 m up, 3.1 m from
// the hero (the horizon at his eyes); f87 3.6 m up, 6.9 m back. The field: 100 columns 180 apart (1 m) x 100 rows
// 240 apart (1.35 m), Z 0..23,760 (133 m deep); the far rows sink into the haze at the horizon. The plate floats at
// Z 4000, 6.6 m up.
//
// SOURCES: "10,000 parallel agents": the speaker's account of the OpenAI run (COMMON.md); no other figures.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirFloor, AirHorizonHazeW, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, makeAirView, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { FolkCanvas, GENIUS_POSES as G, Genius, blitGenius, geniusCrowdReqs, useGeniusSprites, type FolkFog, type GeniusPose, type Sprite } from "../rsi-ten-earths/tenEarthsGenius";
import { YearPlate, yearPlateT } from "../rsi-ten-earths/tenEarthsHall";
import { AGENTS, DURATION as PLAN_DURATION, F, N, PLATE, SETTLED, cam3At, fieldAt, liveT, sidePose, type Cam3, type Field } from "./tenThousandAgentsPlan";

export const FPS = 24000 / 1001;
export const DURATION = 88;
export const schema = z.object({});
export const defaultProps = schema.parse({});
if (PLAN_DURATION !== DURATION) throw new Error("plan duration");

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};

// ---- the camera on the kit: the pinhole as a londonDepth perspective (Dc = d, k = F / d, the horizon at hy) ----
const kitCam = (c: Cam3): { cam: Cam; depth: DepthOpts } => {
  const k = F / c.d;
  return { cam: { k, cx: c.cx, cy: (960 - c.hy) / k - c.h }, depth: { eyeY: -c.h, dRef: c.d, kRef: k, dolly: 1 } };
};
/** the people's fog by depth: the near rows keep their local colour, the far ones sink into the haze */
const FIG_FOG = { near: 450, vis: 6500, max: 0.82 };
const SCENE = { fogVis: 5200, hHigh: 2600 };
const C0 = cam3At(0);

// ---- the crowd: sprites (v0 front, the crowd sizes plus two big ones for the near rows), the idle ----
const BIG = [192, 384];
const SIZES = [24, 48, 96, ...BIG];
const IDLE = Array.from({ length: N }, (_, i) => ({ ph: random(`ta-ph-${i}`) * Math.PI * 2, per: 62 + random(`ta-per-${i}`) * 40, amp: 0.006 + random(`ta-amp-${i}`) * 0.008 }));
/** the idle comes in once the field stands (it never moves a copy while it is still hidden behind its source) */
const idleAmt = (f: number) => sst(SETTLED - 2, SETTLED + 14, f);
/** a permanent tiny depth bias: within a row the outer agent is behind (the order the fans dealt them in) */
const BIAS = AGENTS.map((a) => 0.01 * Math.abs(a.k));

// the big sizes are drawn here with blitGenius's own rules (fog at half strength, the same soft contact shadow)
const FOGGED = new Map<string, HTMLCanvasElement>();
const fogQ = (fog: FolkFog) => {
  const rgb = typeof fog.rgb === "string" ? [1, 3, 5].map((k) => parseInt((fog.rgb as string).slice(k, k + 2), 16)) : fog.rgb;
  return rgb.map((v) => Math.round(v / 6) * 6);
};
const foggedBig = (key: string, src: HTMLCanvasElement, fog: FolkFog) => {
  const amt = Math.round(c01(fog.amount * 0.5) * 32) / 32;
  if (amt <= 0) return src;
  const rgb = fogQ(fog);
  const k = `${key}|${amt}|${rgb.join(",")}`;
  const hit = FOGGED.get(k);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = "source-atop";
  g.fillStyle = `rgba(${rgb.join(",")},${amt})`;
  g.fillRect(0, 0, c.width, c.height);
  FOGGED.set(k, c);
  return c;
};
let SHADOW: HTMLCanvasElement | null = null;
const shadowSprite = () => {
  if (SHADOW) return SHADOW;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 20;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const gr = g.createRadialGradient(32, 10, 0, 32, 10, 32);
  gr.addColorStop(0, "rgba(34,24,15,0.55)");
  gr.addColorStop(0.6, "rgba(34,24,15,0.3)");
  gr.addColorStop(1, "rgba(34,24,15,0)");
  g.fillStyle = gr;
  g.save();
  g.scale(1, 10 / 32);
  g.beginPath();
  g.arc(32, 32, 32, 0, Math.PI * 2);
  g.fill();
  g.restore();
  SHADOW = c;
  return c;
};
const blitBig = (ctx: CanvasRenderingContext2D, get: (key: string) => Sprite | undefined, hPx: number, fog: FolkFog) => {
  const s = shadowSprite();
  const w = hPx * 0.42;
  ctx.globalAlpha = 1 - c01(fog.amount);
  ctx.drawImage(s, -w * 0.38, -w * 0.12, w, w * (20 / 64));
  ctx.globalAlpha = 1;
  const size = BIG.find((b) => b >= hPx / 1.15) ?? BIG[BIG.length - 1];
  const key = `ge|0|front|0|${size}`;
  const sp = get(key);
  if (!sp) return;
  const src = foggedBig(key, sp.c, fog);
  const f = hPx / sp.px;
  ctx.drawImage(src, -sp.ax * f, -sp.ay * f, sp.c.width * f, sp.c.height * f);
};

const ORDER = new Int32Array(N);
const KEYZ = new Float64Array(N);
const drawCrowd = (ctx: CanvasRenderingContext2D, A: AirWorld, c: Cam3, fd: Field, f: number, get: (key: string) => Sprite | undefined) => {
  let n = 0;
  for (let i = 0; i < N; i++) {
    if (AGENTS[i].kind !== 3 || !fd.born[i]) continue;
    KEYZ[i] = fd.Z[i] + BIAS[i];
    ORDER[n++] = i;
  }
  const ord = Array.from(ORDER.subarray(0, n)).sort((a, b) => KEYZ[b] - KEYZ[a] || b - a);
  const ia = idleAmt(f);
  for (const i of ord) {
    const Z = fd.Z[i];
    const s = F / (Z + c.d);
    const x = 540 + (fd.X[i] - c.cx) * s;
    const y = c.hy + c.h * s;
    const hPx = 312 * s;
    if (x < -hPx || x > 1080 + hPx || y < 0 || y - 1.25 * hPx > 1920) continue;
    const id = IDLE[i];
    const w = (2 * Math.PI * f) / id.per + id.ph;
    const rot = ia * id.amp * Math.sin(w);
    const sy = 1 + ia * 0.006 * Math.sin(w * 0.5 + 1.3);
    const cr = Math.cos(rot);
    const sr = Math.sin(rot);
    ctx.setTransform(cr, sr, -sr * sy, cr * sy, x, y);
    const fog = A.folkFog(Z);
    if (hPx > 110) blitBig(ctx, get, hPx, fog);
    else blitGenius(ctx, get, 0, 0, hPx, { variant: 0, view: "front", fog, shadow: true });
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
};

// ---- the live figures: the hero and his two first copies ----
/** the hero's copies side-step out (tenThousandAgentsPlan's sidePose: planted feet) and close up facing us, each with
 *  its own breath seed */
const livePose = (dir: 1 | -1, f: number): GeniusPose => sidePose(dir, liveT(f), f, dir === 1 ? 2 : 1);

const TenThousandAgents: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const c = cam3At(frame);
  const { cam, depth } = kitCam(c);
  const rest = kitCam(C0);
  const A = airWorldOf({ cam, rest: rest.cam, depth, frame, fogBy: "depth", scene: SCENE, figFog: FIG_FOG });
  // the stage's air with the motes and shafts parallaxing against the f0 camera
  const v = makeAirView({
    scene: { ...A.v.scene },
    frame,
    horizon: c.hy,
    cam: { x: c.cx, y: c.h, z: -c.d },
    rest: { x: C0.cx, y: C0.h, z: -C0.d },
  });
  const reqs = useMemo(() => geniusCrowdReqs(["front"], SIZES, 1), []);
  const get = useGeniusSprites(reqs);
  const fd = useMemo(() => fieldAt(frame), [frame]);
  // the live three, far to near (the copies step out from behind him: deeper until they reach his row)
  const live = [1, 2, 0]
    .filter((i) => fd.born[i])
    .map((i) => ({ i, X: fd.X[i], Z: fd.Z[i], pose: i === 0 ? G.front(frame) : livePose(i === 1 ? -1 : 1, frame) }))
    .sort((a, b) => b.Z - a.Z || (a.i === 0 ? 1 : b.i === 0 ? -1 : 0));
  const plateT = yearPlateT(frame, PLATE.f0, PLATE.dur);
  return (
    <AirStage v={v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-40000} x1={40000} z0={-4000} z1={30000} mat={MAT.ground} course={280} jointAmt={0.35} melt={0.4} />
        <AirHorizonHazeW A={A} id="ta-haze" />
        {live.map((g) => (
          <AirShadow key={`s${g.i}`} A={A} X={g.X} Z={g.Z} w={62} d={30} uid={`ta-s${g.i}`} amt={0.8} />
        ))}
      </WorldSvg>
      <FolkCanvas draw={(ctx) => drawCrowd(ctx, A, c, fd, frame, get)} />
      <WorldSvg cam={cam}>
        {live.map((g) => {
          const { at, scale } = A.P.at(g.X, g.Z);
          return <Genius key={`g${g.i}`} variant={0} pose={g.pose} at={at} scale={scale} uid={`ta-g${g.i}`} frame={frame} fog={A.folkFog(g.Z)} unitPx={cam.k} />;
        })}
        <YearPlate A={A} X={PLATE.X} Y={PLATE.Y} Z={PLATE.Z} text="10,000" t={plateT} uid="ta-plate" size={PLATE.size} />
      </WorldSvg>
    </AirStage>
  );
};

export default TenThousandAgents;
