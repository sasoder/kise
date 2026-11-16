// ---------------------------------------------------------------------------
// tenEarthsBot — THE ROBOT of rsi-ten-earths (brief W4; replaces the Genius): one AI drawn as a small, friendly
// picture-book TOY ROBOT in the house orange, in the gouache hand of the approved casts (pandemicFolkPaint's texture
// filter, ONE soft crescent shadow per part from the upper left, no outline). A rounded-square head a bit wider than
// tall on a short neck; its face a dark petrol SCREEN with two CREAM dot eyes (they blink and squint happily) and a tiny
// cream smile; a short antenna with a CREAM bulb (v0); a soft barrel torso with one small cream panel; tube arms with
// orange-cream mitten hands; short legs with small rounded feet. 240 units = 1.35 m (U = 178 per metre). The body is
// ACCENT #FFB000, its crescent toward the deep orange; joints and hands a light warm orange-cream. It is the ONLY
// orange thing in the clip; the medium's bloom (<AirStage bloom={0.22}>) makes it glow faintly through the air.
// Geometry and poses: tenEarthsBotBody.ts. Contract: <notes>/BOT_READY.md.
//
// IT KEEPS THE GENIUS'S API (rename Genius -> Bot, GENIUS_ -> BOT_, genius -> bot): the POSE TYPE IS THE GENIUS'S
//   (covidFolk's CovidPose + pencil, + `boot`), so a cut's own pose code (GENIUS_POSES, covidFolk POSES, lerpPose,
//   breathe, mirrorPose) drives the robot unchanged; it is solved on covidFolk's rig and retargeted onto the short body.
//
// UNITS: robot units = the cast's, feet at (0, 0), up -y. `at` = the feet in world px, `scale` = world px per unit.
//   On the depth kit: const { at, scale } = A.P.at(X, Z); screen px per unit = scale * cam.k (WorldSvg).
//   botScaleForPx(px) = px / 240 (soles to head top; the antenna adds ~25).
//   On a phone (1080 x 1920), the body's height:
//   HERO 300-520 px (scale*k 1.25-2.2): screen, eyes, smile, antenna bulb, ear discs, chest panel, mittens all read.
//   MID 100-180 px (0.42-0.75): the screen as a dark band with two cream dots, the antenna, the panel as a light fleck.
//   CROWD 9-40 px: sprites from ~14 px up (the head block, screen band and bean read), the dot LOD below (an orange
//     bean with a head block), crossfaded 11..16 px.
//
// THE FIGURE
//   <Bot variant pose at scale uid frame? fog? unitPx? tone? texture? aura? drain? />
//     variant 0..4 (BOT_LOOKS): v0 THE Bot (antenna, ear discs, chest plate: use it whenever ONE robot is meant),
//       v1 no antenna, v2 no ears + a dial, v3 vents, v4 no antenna + a dial. One model: only these details differ.
//     pose: a BotPose (= GeniusPose) from BOT_POSES (or any GENIUS_POSES / covidFolk POSES pose).
//     frame: the cut's frame (the antenna's small sway). fog: A.folkFog(Z): the orange takes half the fog (it glows),
//       the joints and the screen all of it. aura 0..1: a faint orange haze for a hero beat. unitPx: cam.k.
//   Contact shadow: <AirShadow A={A} X={X} Z={Z} w={BOT_SHADOW.w} d={BOT_SHADOW.d} amt={BOT_SHADOW.amt} /> (w 56, d 26).
//   Live SVG figures: a build is ~1 ms; ~15-20 live figures per frame are fine (one gouache filter each); for more,
//   the crowd sprites (or <BotLayer> to share one filter over a tight group drawn texture={false}).
//
// POSES (BOT_POSES; GENIUS_POSES's names, timings and anchors; pure, frame-driven, seek-safe; dir 1 = facing right)
//   stand(dir, frame, seed?)   three-quarter, a slow idle bob, a blink every ~4 s (seeded)
//   front(frame, seed?)        facing us.   turnTo(yaw, frame, seed?): any yaw (0 front .. PI back)
//   walk(dir, frame, amount?)  planted feet: BOT_WALK_CYCLE = 24 frames per two steps; move `at` by
//                              botWalkAdvance(scale) px per frame (0.42 x the Genius's: short legs). Cross the frame.
//   stepOut(dir, t)            t 0..1 over STEP_OUT_FRAMES (44): three steps, then the turn to us; move `at` by
//                              stepOutShift(dir, t) * scale px (integrated from the robot's own ankles).
//   typeAtDesk(dir, frame, seed?)  seated (the barrel on the seat, the short legs dangling), mittens on the keys,
//                              tapping in bursts. `at` = the floor under its hips. BOT_DESK (units from `at`, facing
//                              right): seatH 84 (the hall chair 82 fits), deskH 132, keys [[58,-138],[64,-141]] (the
//                              mittens land there exactly), knees x ~26..41 y ~-92, dangling soles y ~-57, the barrel's front x ~50: the hall's profile
//                              desk (front edge 52 ahead, keyboard centre 82) fits. Eyes ~[44..62, -226] (as the Genius's).
//   writeTick(dir, t, frame?)  the pencil comes up and draws a tick on a sheet in front of its chest: BOT_TICK
//                              (p0 [54,-128] -> p1 [60,-118] -> p2 [78,-141], units from `at`, facing right; LOWER
//                              than GENIUS_TICK: it is 1.35 m). tickDrawn(dir, t) = the drawn polyline; the anchors'
//                              pencilTip is exactly on it while drawing. Give it ~40-48 frames.
//   cheer(frame, amount, yaw?)  arms up in a V, an 18-frame bounce, the happy squint (^ ^). Ramp amount over 14+ frames.
//   bootUp(t, yaw?, frame?)    NEW: it switches on, t 0..1 over ~BOOT_FRAMES (16): screen dark and head bowed -> the
//                              bulb lights -> the eyes open from a line -> one blink (0.68..0.88), the head lifts, the smile. Over any
//                              other pose: { ...pose, boot: t } (e.g. a new copy appearing seated or three-quarter).
//   + breathe, lerpPose, mirrorPose (covidFolk's) work on these poses; botGripTo(pose, {L?, R?}) puts the mittens on
//     figure-local points (the result is a plain pose that lerps).
//
// ANCHORS: botAnchors(variant, pose, at, scale) -> world px: headC headR headTop mouth eyes screen antennaTip chest
//   shoulderL/R wristL/R handL/R (= mittenL/R, the grip points) hip kneeL/R ankleL/R toeL/R heelL/R hemL/R pencilTip.
//
// CROWDS (1,000-10,000+; in SCREEN px inside <FolkCanvas draw />)
//   const reqs = useMemo(() => botCrowdReqs(), []);  const get = useBotSprites(reqs);
//   blitBot(ctx, get, x, y, hPx, { variant, view, walkFrame, alpha, fog, shadow })  x, y = the feet on screen, hPx =
//     240 * scale * cam.k. Picks the smallest baked size >= hPx / 1.15 (BOT_CROWD_SIZES 24 / 48 / 96), under ~15 px
//     crossfades to the DOT (dot only under 11 px). fog applied at half strength (the orange glows), cached per step.
//   views: front | left | right | back | walkLeft | walkRight (walkFrame 0..3 = frame / BOT_WALK_CYCLE * 4) | cheer.
//   drawBotDot(ctx, x, y, hPx, alpha?, fog?)  the dot LOD alone. Cost: see BOT_READY.md.
// Probe: tenEarthsBotProbe.tsx (src/Root.TenEarthsBot.tsx + src/entry.TenEarthsBot.ts).
// ---------------------------------------------------------------------------
import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
// @ts-expect-error react-dom ships no types for its server entry here (nothing may be installed); typed below
import * as ReactDomServer from "react-dom/server";
import { PAINT, folkTexDefs, mixC, type Sprite } from "../kyle-pandemics/pandemicFolkPaint";
import { ACCENT, BOT_LOOKS, BOT_POSES, BOT_SCREEN, BOT_SKIN, BOT_UNITS, BOT_VARIANTS, BOT_WALK_CYCLE, FU, ORANGE_SHADE, buildBot, type BotAnchors, type BotPose, type CShape, type P2 } from "./tenEarthsBotBody";

const renderToStaticMarkup = (ReactDomServer as { renderToStaticMarkup: (el: React.ReactElement) => string }).renderToStaticMarkup;

export {
  ACCENT,
  ACCENT_DEEP,
  BOOT_FRAMES,
  BOT_DESK,
  BOT_EYE,
  BOT_FPS,
  BOT_HIP_SEATED,
  BOT_JOINT,
  BOT_LOOKS,
  BOT_POSES,
  BOT_SCREEN,
  BOT_SKIN,
  BOT_TICK,
  BOT_UNITS,
  BOT_VARIANTS,
  BOT_WALK_CYCLE,
  ORANGE_SHADE,
  PENCIL_TIP,
  STEP_OUT_FRAMES,
  U,
  botAnchorsLocal,
  botBlink,
  botGripTo,
  botInks,
  botRig,
  botScaleForPx,
  botStepOutShift,
  botTickDrawn,
  botWalkAdvance,
  buildBot,
  stepOutShift,
  tickDrawn,
  type BotAnchors,
  type BotBuild,
  type BotBuildOpts,
  type BotLook,
  type BotPose,
} from "./tenEarthsBotBody";
export { breathe, lerpPose, mirrorPose } from "../kyle-covid/covidFolkBody";
export { blitFolk, FolkCanvas, type Sprite } from "../kyle-pandemics/pandemicFolkPaint";

/** the contact shadow at its feet: <AirShadow A X Z w={BOT_SHADOW.w} d={BOT_SHADOW.d} amt={BOT_SHADOW.amt} /> */
export const BOT_SHADOW = { w: 56, d: 26, amt: 0.8 };

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ===================================================================================================================
// FOG AND THE WARM SHADE (as the Genius's: the orange takes half the fog and a deep-orange crescent)
// ===================================================================================================================
export type FolkFog = { rgb: [number, number, number] | string; amount: number };
const toHex = (c: number[]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const hexRgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const fogHexOf = (f: FolkFog) => (typeof f.rgb === "string" ? f.rgb : toHex(f.rgb));
const hsv = (h: string) => {
  const [r, g, b] = hexRgb(h).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let hue = 0;
  if (d > 1e-6) {
    if (mx === r) hue = 60 * (((g - b) / d) % 6);
    else if (mx === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
  }
  if (hue < 0) hue += 360;
  return { h: hue, s: mx > 0 ? d / mx : 0, v: mx };
};
const isOrange = (c: string) => {
  const o = hsv(c);
  return o.h >= 18 && o.h <= 52 && o.s >= 0.55 && o.v >= 0.35;
};
const isWarmLight = (c: string) => {
  const o = hsv(c);
  return o.h >= 15 && o.h <= 50 && o.s < 0.55 && o.v > 0.7;
};
/** the crescent shadow: orange toward the deep orange; the orange-cream joints toward a warm tan; else the cast's */
export const botShade = (c: string) => (isOrange(c) ? mixC(c, ORANGE_SHADE, 0.4) : isWarmLight(c) ? mixC(c, "#C27E48", 0.3) : mixC(c, "#2C3433", 0.4));
const applyFog = (shapes: CShape[], fog: FolkFog | null | undefined): CShape[] => {
  if (!fog || fog.amount <= 0.001) return shapes;
  const to = fogHexOf(fog);
  const t = c01(fog.amount);
  return shapes.map((s) => {
    const k = isOrange(s.fill) || s.glow ? 0.5 * t : t;
    return { ...s, fill: mixC(s.fill, to, k), shadeFrom: s.fill } as CShape & { shadeFrom: string };
  });
};

// ===================================================================================================================
// THE PAINT (the Genius's GeniusPaint, shape for shape)
// ===================================================================================================================
const TexCtx = createContext<{ shared: boolean }>({ shared: false });
/** one gouache texture filter over a tight group of robots (texture={false} figures inside) */
export const BotLayer: React.FC<{ uid: string; px?: number; unitPx?: number; children?: React.ReactNode }> = ({ uid, px = 0.4, unitPx = 1, children }) => (
  <TexCtx.Provider value={{ shared: true }}>
    <defs>{folkTexDefs(uid, px, unitPx)}</defs>
    <g filter={`url(#${uid}tx)`}>{children}</g>
  </TexCtx.Provider>
);
const boxOf = (d: string): [number, number, number, number] => {
  const v = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < v.length; i += 2) {
    if (v[i] < x0) x0 = v[i];
    if (v[i] > x1) x1 = v[i];
    if (v[i + 1] < y0) y0 = v[i + 1];
    if (v[i + 1] > y1) y1 = v[i + 1];
  }
  return [x0, y0, x1, y1];
};
export const BotPaint: React.FC<{ shapes: CShape[]; at: P2; scale: number; uid: string; tone?: number; fog?: FolkFog | null; unitPx?: number; texture?: boolean }> = ({ shapes, at, scale: sc0, uid, tone = 1, fog = null, unitPx = 1, texture }) => {
  const ctx = useContext(TexCtx);
  const tex = texture ?? !ctx.shared;
  const scale = sc0 / FU;
  const S = applyFog(shapes, fog) as (CShape & { shadeFrom?: string })[];
  // the texture's size factor as a 312-unit man's (the robot is painted by the same hand at the same grain)
  const pxf = (scale * unitPx * 512) / 860;
  const blurU = PAINT.shadeBlur / (scale * unitPx);
  const shadeOfS = (s: CShape & { shadeFrom?: string }) => {
    if (!s.shadeFrom || !fog) return botShade(s.fill);
    const k = isOrange(s.shadeFrom) ? 0.5 * c01(fog.amount) : c01(fog.amount);
    return mixC(botShade(s.shadeFrom), fogHexOf(fog), k);
  };
  const off = PAINT.shadeOff;
  const pad = off * 1.2 + blurU * 3 + 2;
  const blurs = Array.from(new Set(S.filter((s) => s.blur !== undefined).map((s) => Math.round((s.blur ?? 0) * 10) / 10)));
  const blurId = (b: number) => `${uid}gb${blurs.indexOf(Math.round(b * 10) / 10)}`;
  return (
    <g opacity={tone}>
      <defs>
        {tex ? folkTexDefs(uid, pxf, unitPx) : null}
        <filter id={`${uid}su`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU).toFixed(3)} />
        </filter>
        {blurs.map((b, i) => (
          <filter key={i} id={`${uid}gb${i}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={Math.max(0.01, b * FU).toFixed(3)} />
          </filter>
        ))}
      </defs>
      <g filter={tex ? `url(#${uid}tx)` : undefined}>
        <g transform={`translate(${n3(at[0])} ${n3(at[1])}) scale(${n3(scale)})`}>
          {S.map((s, i) => {
            const op = s.op ?? 1;
            if (op <= 0.002) return null;
            const clipId = s.clip ? `${uid}c${i}` : undefined;
            const wrap = (el: React.ReactNode) =>
              clipId ? (
                <g key={i}>
                  <clipPath id={clipId}>
                    <path d={s.clip} />
                  </clipPath>
                  <g clipPath={`url(#${clipId})`}>{el}</g>
                </g>
              ) : (
                <g key={i}>{el}</g>
              );
            if (s.blur !== undefined && s.blur > 0.05) return wrap(<path d={s.d} fill={s.fill} opacity={op} filter={`url(#${blurId(s.blur)})`} />);
            const sh = s.sh ?? 1;
            if (sh <= 0) return wrap(<path d={s.d} fill={s.fill} opacity={op} />);
            const [bx0, by0, bx1, by1] = boxOf(s.d);
            const mx = bx0 - pad;
            const my = by0 - pad;
            const mw = bx1 - bx0 + 2 * pad;
            const mh = by1 - by0 + 2 * pad;
            const mid = `${uid}m${i}`;
            return wrap(
              <>
                <path d={s.d} fill={s.fill} opacity={op} />
                <mask id={mid} maskUnits="userSpaceOnUse" x={n3(mx)} y={n3(my)} width={n3(mw)} height={n3(mh)}>
                  <path d={s.d} fill="#fff" />
                  <path d={s.d} fill="#000" transform={`translate(${n3(-off * sh)} ${n3(-off * sh * 1.05)})`} filter={`url(#${uid}su)`} />
                </mask>
                <rect x={n3(mx)} y={n3(my)} width={n3(mw)} height={n3(mh)} mask={`url(#${mid})`} fill={shadeOfS(s)} opacity={op} />
              </>,
            );
          })}
        </g>
      </g>
    </g>
  );
};

// ===================================================================================================================
// THE ROBOT
// ===================================================================================================================
export type BotProps = {
  variant?: number;
  pose: BotPose;
  at: P2;
  scale: number;
  /** unique per figure per frame */
  uid: string;
  frame?: number;
  fog?: FolkFog;
  drain?: number;
  tone?: number;
  unitPx?: number;
  texture?: boolean;
  /** 0..1 a faint orange haze behind it (a hero moment; the medium's bloom usually suffices) */
  aura?: number;
};
export const Bot: React.FC<BotProps> = ({ variant = 0, pose, at, scale, uid, frame, fog, drain, tone, unitPx, texture, aura = 0 }) => {
  const b = buildBot(variant, pose, { frame, drain });
  const a = c01(aura) * (1 - 0.5 * c01(fog?.amount ?? 0));
  const cx = at[0] + b.anchors.chest[0] * scale;
  const cy = at[1] + (b.anchors.chest[1] - 30) * scale;
  return (
    <g>
      {a > 0.005 ? (
        <g>
          <defs>
            <radialGradient id={`${uid}au`}>
              <stop offset="0" stopColor={ACCENT} stopOpacity={0.32 * a} />
              <stop offset="0.5" stopColor={ACCENT} stopOpacity={0.12 * a} />
              <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={cx} cy={cy} rx={130 * scale} ry={180 * scale} fill={`url(#${uid}au)`} />
        </g>
      ) : null}
      <BotPaint shapes={b.shapes} at={at} scale={scale} uid={uid} tone={tone} fog={fog} unitPx={unitPx} texture={texture} />
    </g>
  );
};

/** the anchors in WORLD px of a robot in a pose */
export const botAnchors = (variant: number, pose: BotPose, at: P2, scale: number): BotAnchors => {
  const a = buildBot(variant, pose).anchors;
  const out = {} as Record<string, unknown>;
  for (const [key, v] of Object.entries(a)) {
    if (key === "mouthDir") out[key] = v;
    else if (key === "headR") out[key] = (v as number) * scale;
    else if (key === "eyes") out[key] = (v as P2[]).map((e) => [at[0] + e[0] * scale, at[1] + e[1] * scale]);
    else out[key] = [at[0] + (v as P2)[0] * scale, at[1] + (v as P2)[1] * scale];
  }
  return out as BotAnchors;
};

// ===================================================================================================================
// CROWD SPRITES (the gouache filter baked in, once per render tab) AND THE DOT LOD
// ===================================================================================================================
export type BotView = "front" | "left" | "right" | "back" | "walkLeft" | "walkRight" | "cheer";
export const BOT_VIEWS: BotView[] = ["front", "left", "right", "back", "walkLeft", "walkRight", "cheer"];
/** the baked heights (px of a robot, soles to head top): blitBot picks the smallest >= the screen height / 1.15 */
export const BOT_CROWD_SIZES = [24, 48, 96];
export type BotSpriteReq = { key: string; variant: number; view: BotView; walkFrame: number; hPx: number; scale: number; wUnits: number; hUnits: number };
const crowdPose = (view: BotView, walkFrame: number): BotPose => {
  switch (view) {
    case "left":
      return BOT_POSES.stand(-1, 0);
    case "right":
      return BOT_POSES.stand(1, 0);
    case "back":
      return BOT_POSES.turnTo(Math.PI, 0);
    case "walkLeft":
      return BOT_POSES.walk(-1, ((walkFrame % 4) / 4 + 0.05) * BOT_WALK_CYCLE);
    case "walkRight":
      return BOT_POSES.walk(1, ((walkFrame % 4) / 4 + 0.05) * BOT_WALK_CYCLE);
    case "cheer":
      return BOT_POSES.cheer(9, 1);
    default:
      return BOT_POSES.front(0);
  }
};
export const botSpriteReq = (variant: number, view: BotView, hPx: number, walkFrame = 0): BotSpriteReq => {
  const v = ((Math.round(variant) % BOT_VARIANTS) + BOT_VARIANTS) % BOT_VARIANTS;
  const wf = view === "walkLeft" || view === "walkRight" ? ((walkFrame % 4) + 4) % 4 : 0;
  return { key: `bt|${v}|${view}|${wf}|${Math.round(hPx)}`, variant: v, view, walkFrame: wf, hPx, scale: hPx / BOT_UNITS, wUnits: 120, hUnits: 300 };
};
const SHAPES = new Map<string, CShape[]>();
const spriteShapes = (r: BotSpriteReq) => {
  const k = `${r.variant}|${r.view}|${r.walkFrame}`;
  let sh = SHAPES.get(k);
  if (!sh) {
    sh = buildBot(r.variant, crowdPose(r.view, r.walkFrame)).shapes;
    SHAPES.set(k, sh);
  }
  return sh;
};
/** every sprite a crowd may ask for: views x variants x walk frames x sizes (memoise it: useMemo(..., [])) */
export const botCrowdReqs = (views: BotView[] = BOT_VIEWS, sizes: number[] = BOT_CROWD_SIZES, variants = BOT_VARIANTS): BotSpriteReq[] => {
  const out: BotSpriteReq[] = [];
  for (const hPx of sizes)
    for (let v = 0; v < variants; v++)
      for (const view of views) {
        const nwf = view === "walkLeft" || view === "walkRight" ? 4 : 1;
        for (let wf = 0; wf < nwf; wf++) out.push(botSpriteReq(v, view, hPx, wf));
      }
  return out;
};
const SPRITES = new Map<string, Sprite>();
const PENDING = new Map<string, Promise<Sprite>>();
const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
};
const yieldTick = () => new Promise<void>((res) => setTimeout(res, 0));
const bakeNow = (r: BotSpriteReq): Promise<Sprite> => {
  const shapes = spriteShapes(r);
  const halfW = r.wUnits * r.scale;
  const pad = Math.ceil(10 + r.hPx * 0.05);
  const W = Math.ceil(halfW * 2 + pad * 2);
  const H = Math.ceil(r.hUnits * r.scale + pad * 2);
  const ax = W / 2;
  const ay = H - pad;
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <BotPaint shapes={shapes} at={[ax, ay]} scale={r.scale} uid={`bs${Math.abs(hashStr(r.key))}`} />
    </svg>,
  );
  return new Promise<Sprite>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d") as CanvasRenderingContext2D;
      ctx.drawImage(img, 0, 0);
      const sp: Sprite = { c, ax, ay, px: r.hPx, unitsPerPx: 1 / r.scale };
      SPRITES.set(r.key, sp);
      PENDING.delete(r.key);
      resolve(sp);
    };
    img.onerror = (e) => reject(e);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
};
const bake = (r: BotSpriteReq): Promise<Sprite> => {
  const hit = SPRITES.get(r.key);
  if (hit) return Promise.resolve(hit);
  const pend = PENDING.get(r.key);
  if (pend) return pend;
  const p = yieldTick().then(() => bakeNow(r));
  PENDING.set(r.key, p);
  return p;
};
/** bake the requested sprites once per render tab (delayRender until ready, one at a time) and return a lookup */
export const useBotSprites = (reqs: BotSpriteReq[]) => {
  const allReady = reqs.every((r) => SPRITES.has(r.key));
  const [handle] = useState(() => (allReady ? null : delayRender("baking bot sprites", { timeoutInMilliseconds: 240000 })));
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    if (handle === null) return;
    let alive = true;
    (async () => {
      for (const r of reqs) await bake(r);
    })().then(
      () => {
        if (alive) setTick((t) => t + 1);
        continueRender(handle);
      },
      () => continueRender(handle),
    );
    return () => {
      alive = false;
    };
  }, [handle, reqs]);
  return useMemo(() => (key: string) => SPRITES.get(key), []);
};

// ---- fogged copies of a sprite (cached by sprite x fog step) --------------------------------------------------------
const FOGGED = new Map<string, HTMLCanvasElement>();
const qRgb = (f: FolkFog) => {
  const c = typeof f.rgb === "string" ? hexRgb(f.rgb) : f.rgb;
  return c.map((v) => Math.round(v / 6) * 6);
};
const fogged = (key: string, src: HTMLCanvasElement, fog: FolkFog | undefined, strength: number): HTMLCanvasElement => {
  const amt = Math.round(c01((fog?.amount ?? 0) * strength) * 32) / 32;
  if (!fog || amt <= 0) return src;
  const rgb = qRgb(fog);
  const k = `${key}|${amt}|${rgb.join(",")}`;
  const hit = FOGGED.get(k);
  if (hit) return hit;
  if (FOGGED.size > 6000) FOGGED.clear();
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

// ---- the dot LOD: an orange bean with a head block (baked once at 40 px, drawn down) -----------------------------------
const DOT_PX = 40;
let DOT: { c: HTMLCanvasElement; ax: number; ay: number } | null = null;
const rrect = (g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
};
const dotSprite = () => {
  if (DOT) return DOT;
  const W = 40;
  const H = 52;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const ax = W / 2;
  const ay = H - 4;
  const s = DOT_PX / 40;
  // two stubby legs
  g.fillStyle = "#E8940A";
  g.fillRect(ax - 5.5 * s, ay - 6 * s, 3.6 * s, 6 * s);
  g.fillRect(ax + 1.9 * s, ay - 6 * s, 3.6 * s, 6 * s);
  // the barrel
  g.fillStyle = ACCENT;
  rrect(g, ax - 6.8 * s, ay - 22 * s, 13.6 * s, 17 * s, 6 * s);
  g.fill();
  // the head block (wider than the body), a little neck gap
  rrect(g, ax - 8.2 * s, ay - 36.5 * s, 16.4 * s, 13 * s, 4.2 * s);
  g.fill();
  // the soft shade toward the lower right
  const sh = g.createLinearGradient(ax - 8 * s, ay - 36 * s, ax + 9 * s, ay);
  sh.addColorStop(0, "rgba(168,90,8,0)");
  sh.addColorStop(0.55, "rgba(168,90,8,0)");
  sh.addColorStop(1, "rgba(168,90,8,0.5)");
  g.globalCompositeOperation = "source-atop";
  g.fillStyle = sh;
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
  // the screen band (dark petrol) on the head
  g.fillStyle = BOT_SCREEN;
  rrect(g, ax - 5.6 * s, ay - 33.2 * s, 11.2 * s, 6.6 * s, 2.4 * s);
  g.fill();
  DOT = { c, ax, ay };
  return DOT;
};
/** the dot LOD at screen (x, y) = the feet, hPx tall */
export const drawBotDot = (ctx: CanvasRenderingContext2D, x: number, y: number, hPx: number, alpha = 1, fog?: FolkFog) => {
  if (alpha <= 0.003) return;
  const d = dotSprite();
  const src = fogged("dot", d.c, fog, 0.5);
  const f = hPx / DOT_PX;
  ctx.globalAlpha = alpha;
  ctx.drawImage(src, x - d.ax * f, y - d.ay * f, d.c.width * f, d.c.height * f);
  ctx.globalAlpha = 1;
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

export type BlitBotOpts = { variant?: number; view?: BotView; walkFrame?: number; alpha?: number; fog?: FolkFog; shadow?: boolean };
/** draw one crowd robot at screen (x, y) = its feet, hPx tall on screen; picks the sprite size or the dot */
export const blitBot = (ctx: CanvasRenderingContext2D, get: (key: string) => Sprite | undefined, x: number, y: number, hPx: number, o: BlitBotOpts = {}) => {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0.003 || hPx <= 0.5) return;
  const fogAmt = c01(o.fog?.amount ?? 0);
  if (o.shadow) {
    const s = shadowSprite();
    const w = hPx * 0.5;
    ctx.globalAlpha = alpha * (1 - fogAmt);
    ctx.drawImage(s, x - w * 0.42, y - w * 0.12, w, w * (20 / 64));
    ctx.globalAlpha = 1;
  }
  const spriteA = sst(11, 15, hPx);
  const dotA = 1 - sst(13, 16, hPx);
  if (dotA > 0.003) drawBotDot(ctx, x, y, hPx, alpha * dotA, o.fog);
  if (spriteA <= 0.003) return;
  const view = o.view ?? "front";
  const v = ((Math.round(o.variant ?? 0) % BOT_VARIANTS) + BOT_VARIANTS) % BOT_VARIANTS;
  const wf = view === "walkLeft" || view === "walkRight" ? (((o.walkFrame ?? 0) % 4) + 4) % 4 : 0;
  const size = BOT_CROWD_SIZES.find((s) => s >= hPx / 1.15) ?? BOT_CROWD_SIZES[BOT_CROWD_SIZES.length - 1];
  const key = `bt|${v}|${view}|${wf}|${size}`;
  const sp = get(key);
  if (!sp) return;
  const src = fogged(key, sp.c, o.fog, 0.5);
  const f = hPx / sp.px;
  ctx.globalAlpha = alpha * spriteA;
  ctx.drawImage(src, x - sp.ax * f, y - sp.ay * f, sp.c.width * f, sp.c.height * f);
  ctx.globalAlpha = 1;
};
/** the look list (for sheets) */
export const botLookName = (v: number) => BOT_LOOKS[((v % BOT_VARIANTS) + BOT_VARIANTS) % BOT_VARIANTS].name;
/** the joint / hand colour (the Genius's GENIUS_SKIN counterpart) */
export const BOT_HAND = BOT_SKIN;
