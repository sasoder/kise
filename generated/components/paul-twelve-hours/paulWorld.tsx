// ===================================================================================================================
// paulWorld — THE SHARED WORLD of paul-twelve-hours, LOOK C "GRAPHITE AIR" (approved Nov 17), frame-driven.
// Built from heroC/heroCShared.tsx (left as it is: the record of the approved stills) with the user's notes applied:
// more contrast (brighter lit faces, deeper core shadows, a darker floor pool under the subjects, less sepia), flags
// and logos in true colour (a second pass over the shafts and haze, out of the fog), denser darker low air with a soft
// foreground below the keep-in box, short soft contact shadows, plates that stay legible (cap >= 48 px).
//
// THE MEDIUM (this file)
//   <PaulStage spec cam frame? overlay? air? />   one frame of the world: the kit's AirStage (graphite) around a
//       three.js layer that is BUILT ONCE per render tab (spec.build) and UPDATED + RENDERED every frame.
//       spec = { fog?, light?, floor?, build(w) => (frame, cam) => void }   define it at MODULE level (built once).
//       cam  = the CamDef of this frame (use orbitCam(living(track(f), f))).
//       overlay(P, cam) => SVG content (people), P = projector(cam): world point -> screen [x, y, dist].
//       air  = { shafts 0.6, motes 0.45, bloom 0.22, lowAir 1, foreground 1, fgSeed 0, trueColour 0.92, grade 0.85 }.
//   World (w, handed to build): { scene, T (textures), K (clay kit), renderer, legible(obj, capH, minPx), tc(obj) }
//       w.tc(obj)           marks a mesh (and its children) TRUE COLOUR: drawn again over the haze, no fog
//       w.legible(o, capH)  o's cap height (world m at scale 1) is kept >= minPx (48) on screen: scaled up when small
// UNITS: metres, y up, floor y = 0, the camera usually on +z looking toward -z. Frames at 23.976 fps.
// THE CAMERA
//   Orbit { target, dist, yaw, pitch, fov, roll? }   yaw 0 = camera on +z; +yaw swings it toward +x; pitch = elevation
//       (deg, + above). dist = dolly (m), fov = lens zoom (deg, vertical).
//   orbitCam(o) -> CamDef      camTrack(start, moves) -> (f) => Orbit   moves: { from, to, key: Partial<Orbit> } — each
//       move is ONE smooth lobe (raised-cosine velocity) from the previous key to its key; overlapping moves add.
//       dist eases in log space.
//   living(o, f, amt = 1)      the living drift (a few px of slow orbit, a breath of dolly); pass the GLOBAL frame.
//   lobe(t), ease01(a, b, f)   the lobe easing; a clamped lobe between frames a and b.
//   projector(cam), horizonOf(cam), screenScale(cam, p) (px per metre at p)
// Sets: paulWorldSets.tsx. People: paulFolk.tsx. Probes: paulWorldProbe.tsx (src/Root.PaulWorld.tsx).
// ===================================================================================================================
import React, { useLayoutEffect, useRef } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/RobotoCondensed";
// three.js ships without type declarations here (no @types/three installed)
// @ts-expect-error untyped module
import * as THREE from "three";
// @ts-expect-error untyped module
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { AirStage, MOODS, c01, hexRgb, lerp, mixRgb, rgbHex, type AirPalette, type AirView, type RGB } from "../kits/dwarkesh-3d/dwarkesh3d";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any = any;
export type V3 = [number, number, number];
export { THREE };
export const FPS = 24000 / 1001;
export const W = 1080;
export const H = 1920;
export const D2R = Math.PI / 180;
export const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix3 = (a: V3, b: V3, t: number): V3 => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

const { fontFamily: COND, waitUntilDone } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
export const FONT = COND;

// ===================================================================================================================
// THE PALETTE (graphite: neutral warm grey, less sepia than the hero stills; lighter near the light, deeper low)
// ===================================================================================================================
export const GRAPHITE: AirPalette = {
  label: "C graphite-air (world)",
  ramp: [
    [0, "#E3E0D9"],
    [0.03, "#CDCAC3"],
    [0.077, "#B2AFA9"],
    [0.138, "#97948F"],
    [0.215, "#807D79"],
    [0.308, "#6B6965"],
    [0.423, "#5A5855"],
    [0.554, "#4C4A47"],
    [0.708, "#41403D"],
    [1, "#363533"],
  ],
  eyeT: 0.12,
  cream: "#F5F1E8",
  creamLo: "#DAD5CA",
  shadow: "#1F1D1B",
  line: "#2A2826",
  vignette: "27,26,24",
  grade: { top: "rgba(246,244,238,0.42)", mid: "rgba(128,126,122,0.08)", bottom: "rgba(34,32,30,0.55)" },
  orange: "#FFB000",
  orangeDeep: "#D98A0C",
  orangeHot: "#FFE7A8",
  ground: { lit: "#8A8782", mid: "#74716C", dark: "#43413E" },
  stone: { lit: "#9B988F", mid: "#77746D", dark: "#3E3C39" },
  body: { lit: "#EFEBE3", mid: "#D5D0C6", dark: "#8D8982" },
};
/** the volumes' local colours (sRGB, before light) */
export const C = {
  clay: "#EEEAE2",
  clayAlt: "#E4DFD6",
  clayWarm: "#D2CCC2",
  stone: "#A5A098",
  slate: "#6C6964",
  slateDeep: "#57544F",
  ink: "#2F2C29",
  floor: "#7E7B76",
  orange: "#FFB000",
  orangeDeep: "#D98A0C",
  cream: GRAPHITE.cream,
  shadow: GRAPHITE.shadow,
};
/** true colours (flags, marks): drawn over the haze in the true-colour pass */
export const TRUE = {
  usRed: "#B22234",
  usBlue: "#3C3B6E",
  usWhite: "#FFFFFF",
  cnRed: "#DE2910",
  cnYellow: "#FFDE00",
};

// ===================================================================================================================
// THE AIR VIEW (makeAirView's maths on the GRAPHITE ramp)
// ===================================================================================================================
export const rampAt = (t: number): RGB => {
  const R = GRAPHITE.ramp;
  if (t <= R[0][0]) return hexRgb(R[0][1]);
  for (let i = 1; i < R.length; i++) if (t <= R[i][0]) return mixRgb(hexRgb(R[i - 1][1]), hexRgb(R[i][1]), (t - R[i - 1][0]) / (R[i][0] - R[i - 1][0]));
  return hexRgb(R[R.length - 1][1]);
};
export const makeGraphiteView = (o: { frame: number; horizon: number; F: number; eyeT?: number; fogVis?: number }): AirView => {
  const mood = MOODS.day;
  const eyeT = (o.eyeT ?? GRAPHITE.eyeT) + mood.tBias;
  const scene = { look: "A" as const, mood: "day" as const, F: o.F, fogNear: 4, fogVis: o.fogVis ?? 18, fogMax: 0.92, hLow: 0, hHigh: 6, moteUnit: 1 };
  const airAtScreen = (sy: number) => rampAt(eyeT + (mood.gain * (sy - o.horizon)) / 1250);
  const fogAt = (d: number) => scene.fogMax * (1 - Math.exp(-Math.max(0, d - scene.fogNear) / scene.fogVis));
  const airAt = (d: number, h = 0) => {
    const hn = c01((h - scene.hLow) / (scene.hHigh - scene.hLow));
    const tH = lerp(eyeT + 0.22, eyeT - 0.18, hn);
    const w = 1 - Math.exp(-Math.max(0, d) / (2.5 * scene.fogVis + scene.fogNear));
    return rampAt(lerp(tH, eyeT, w));
  };
  return { scene, pal: GRAPHITE, mood, frame: o.frame, horizon: o.horizon, eyeT, travel: { x: 0, y: 0, z: 0 }, airAtScreen, airAt, fogAt };
};

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
export type CamDef = { pos: V3; target: V3; fov: number; roll?: number };
export type Orbit = { target: V3; dist: number; yaw: number; pitch: number; fov: number; roll?: number };
export const orbitCam = (o: Orbit): CamDef => {
  const cp = Math.cos(o.pitch * D2R);
  return {
    pos: [o.target[0] + o.dist * Math.sin(o.yaw * D2R) * cp, o.target[1] + o.dist * Math.sin(o.pitch * D2R), o.target[2] + o.dist * Math.cos(o.yaw * D2R) * cp],
    target: o.target,
    fov: o.fov,
    roll: o.roll ?? 0,
  };
};
/** one smooth lobe: the integral of a raised-cosine velocity (0 -> 1, at rest at both ends) */
export const lobe = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t - Math.sin(2 * Math.PI * t) / (2 * Math.PI));
/** the lobe between frames a and b */
export const ease01 = (a: number, b: number, f: number) => lobe((f - a) / Math.max(1e-6, b - a));
export type CamMove = { from: number; to: number; key: Partial<Orbit> };
/** the keyed camera: each move eases (one lobe) from the previous key to its own; overlapping moves add */
export const camTrack = (start: Orbit, moves: CamMove[]) => {
  // resolve each move's full key (the previous key with this move's fields)
  const keys: Orbit[] = [start];
  moves.forEach((m) => keys.push({ ...keys[keys.length - 1], ...m.key, target: m.key.target ?? keys[keys.length - 1].target }));
  return (f: number): Orbit => {
    const o: Orbit = { ...start, target: [...start.target] as V3 };
    let lnD = Math.log(start.dist);
    moves.forEach((m, i) => {
      const u = ease01(m.from, m.to, f);
      if (u <= 0) return;
      const a = keys[i];
      const b = keys[i + 1];
      for (let j = 0; j < 3; j++) o.target[j] += (b.target[j] - a.target[j]) * u;
      lnD += (Math.log(b.dist) - Math.log(a.dist)) * u;
      o.yaw += (b.yaw - a.yaw) * u;
      o.pitch += (b.pitch - a.pitch) * u;
      o.fov += (b.fov - a.fov) * u;
      o.roll = (o.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * u;
    });
    o.dist = Math.exp(lnD);
    return o;
  };
};
/** the living drift (pass the GLOBAL frame): ~4 px of slow orbit, ~3 px of tilt, a breath of dolly */
export const living = (o: Orbit, f: number, amt = 1): Orbit => ({
  ...o,
  yaw: o.yaw + 0.075 * amt * Math.sin(f / 41 + 0.3),
  pitch: o.pitch + 0.05 * amt * Math.sin(f / 53 + 1.1),
  dist: o.dist * (1 + 0.0035 * amt * Math.sin(f / 67 + 2.0)),
  target: [o.target[0] + 0.006 * amt * Math.sin(f / 37), o.target[1] + 0.004 * amt * Math.sin(f / 47 + 0.7), o.target[2]],
});
export const makeCam = (c: CamDef) => {
  const cam = new THREE.PerspectiveCamera(c.fov, W / H, 0.05, 400);
  cam.position.set(...c.pos);
  const fwd = new THREE.Vector3(...c.target).sub(new THREE.Vector3(...c.pos)).normalize();
  const up = new THREE.Vector3(0, 1, 0).applyAxisAngle(fwd, -(c.roll ?? 0) * D2R);
  cam.up.copy(up);
  cam.lookAt(new THREE.Vector3(...c.target));
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  return cam;
};
/** world point -> screen px [x, y] and the camera distance */
export type Projector = (p: V3) => [number, number, number];
export const projector = (c: CamDef): Projector => {
  const cam = makeCam(c);
  return (p: V3) => {
    const v = new THREE.Vector3(...p);
    const d = v.distanceTo(cam.position);
    v.project(cam);
    return [((v.x + 1) / 2) * W, ((1 - v.y) / 2) * H, d];
  };
};
/** the focal length in px of a camera, and its horizon row */
export const horizonOf = (c: CamDef) => {
  const cam = makeCam(c);
  const dir = new THREE.Vector3();
  cam.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();
  const far = cam.position.clone().add(dir.multiplyScalar(1e4));
  far.project(cam);
  const F = H / 2 / Math.tan((c.fov * D2R) / 2);
  return { horizon: ((1 - far.y) / 2) * H, F };
};
/** screen px per metre at a world point (for sizing plates and people) */
export const screenScale = (c: CamDef, p: V3) => {
  const cam = makeCam(c);
  const fwd = new THREE.Vector3();
  cam.getWorldDirection(fwd);
  const depth = new THREE.Vector3(...p).sub(cam.position).dot(fwd);
  return H / 2 / Math.tan((c.fov * D2R) / 2) / Math.max(0.05, depth);
};

// ===================================================================================================================
// TEXTURES (canvas)
// ===================================================================================================================
const canvasTex = (cv: HTMLCanvasElement, renderer: Any, srgb = true) => {
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
};
export const mkCanvas = (w: number, h: number) => {
  const cv = document.createElement("canvas");
  cv.width = Math.max(4, Math.round(w));
  cv.height = Math.max(4, Math.round(h));
  return cv;
};
/** a texture and its aspect (w / h); capFrac = the cap height as a share of the texture's height (text only) */
export type Tex = { tex: Any; aspect: number; capFrac?: number };
export type TexKit = {
  /** a line of caps in Roboto Condensed 700, tracking 0.04em */
  text: (s: string, o?: { color?: string; px?: number; pad?: number; tracking?: number }) => Tex;
  /** a brand mark from paths (viewBox units, evenodd), one ink or per-path fills */
  glyph: (paths: string[], o?: { color?: string; px?: number; viewBox?: [number, number, number, number]; fills?: string[] }) => Tex;
  /** a free drawing on a canvas of w x h px */
  draw: (w: number, h: number, fn: (ctx: CanvasRenderingContext2D) => void) => Tex;
  /** an image file from public/ (svg or png), drawn into a canvas of `px` wide; tint recolours every pixel; pad in px */
  image: (path: string, aspect: number, o?: { px?: number; tint?: string; pad?: number; bg?: string }) => Tex;
  grid: Any;
  mottle: Any;
  blob: Any;
  /** every async load (images); the stage waits for them before the first render */
  pending: Promise<unknown>[];
};
export const makeTexKit = (renderer: Any): TexKit => {
  const pending: Promise<unknown>[] = [];
  const text: TexKit["text"] = (s, o = {}) => {
    const px = o.px ?? 160;
    const pad = o.pad ?? 0.18;
    const tr = o.tracking ?? 0.04;
    const m = mkCanvas(8, 8).getContext("2d") as Any;
    m.font = `700 ${px}px "${COND}"`;
    m.letterSpacing = `${tr * px}px`;
    const tw = m.measureText(s).width;
    const cv = mkCanvas(tw + 2 * pad * px, px * (1 + 2 * pad));
    const ctx = cv.getContext("2d") as Any;
    ctx.font = `700 ${px}px "${COND}"`;
    ctx.letterSpacing = `${tr * px}px`;
    ctx.fillStyle = o.color ?? C.ink;
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(s, cv.width / 2 + (tr * px) / 2, cv.height / 2 + px * 0.04);
    // Roboto Condensed caps are ~0.711 em
    return { tex: canvasTex(cv, renderer), aspect: cv.width / cv.height, capFrac: (0.711 * px) / cv.height };
  };
  const glyph: TexKit["glyph"] = (paths, o = {}) => {
    const px = o.px ?? 1024;
    const vb = o.viewBox ?? [0, 0, 24, 24];
    const cv = mkCanvas(px, (px * vb[3]) / vb[2]);
    const ctx = cv.getContext("2d") as Any;
    const s = px / vb[2];
    ctx.setTransform(s, 0, 0, s, -vb[0] * s, -vb[1] * s);
    paths.forEach((d, i) => {
      ctx.fillStyle = o.fills?.[i] ?? o.color ?? C.ink;
      ctx.fill(new Path2D(d), "evenodd");
    });
    return { tex: canvasTex(cv, renderer), aspect: vb[2] / vb[3] };
  };
  const draw: TexKit["draw"] = (w, h, fn) => {
    const cv = mkCanvas(w, h);
    fn(cv.getContext("2d") as CanvasRenderingContext2D);
    return { tex: canvasTex(cv, renderer), aspect: w / h };
  };
  const image: TexKit["image"] = (path, aspect, o = {}) => {
    const px = o.px ?? 1600;
    const pad = o.pad ?? 0;
    const iw = px - 2 * pad;
    const ih = iw / aspect;
    const cv = mkCanvas(px, ih + 2 * pad);
    const tex = canvasTex(cv, renderer);
    const p = (async () => {
      const url = staticFile(path);
      let src = url;
      if (path.toLowerCase().endsWith(".svg")) {
        // give the svg an explicit pixel size (viewBox-only files rasterise at 150 px otherwise)
        const txt = await (await fetch(url)).text();
        const sized = txt.replace(/<svg\b([^>]*)>/, (m0, attrs: string) => {
          // no viewBox: make one from the file's own width / height, so the drawing scales to the canvas
          const ow = /\swidth="([\d.]+)/.exec(attrs)?.[1];
          const oh = /\sheight="([\d.]+)/.exec(attrs)?.[1];
          const vb = /viewBox=/.test(attrs) || !ow || !oh ? "" : ` viewBox="0 0 ${ow} ${oh}"`;
          return `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, "")}${vb} width="${Math.round(iw)}" height="${Math.round(ih)}" preserveAspectRatio="xMidYMid meet">`;
        });
        src = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error(`paulWorld: image ${path} failed`));
        img.src = src;
      });
      const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
      if (o.bg) {
        ctx.fillStyle = o.bg;
        ctx.fillRect(0, 0, cv.width, cv.height);
      }
      ctx.drawImage(img, pad, pad, iw, ih);
      if (o.tint) {
        ctx.globalCompositeOperation = "source-in";
        ctx.fillStyle = o.tint;
        ctx.fillRect(0, 0, cv.width, cv.height);
        ctx.globalCompositeOperation = "source-over";
      }
      tex.needsUpdate = true;
    })();
    pending.push(p);
    return { tex, aspect: cv.width / cv.height };
  };
  // the Dwarkesh grid, painted faintly: white field (the material colour), lines a little darker than the field
  const gcv = mkCanvas(512, 512);
  const g = gcv.getContext("2d") as CanvasRenderingContext2D;
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = "#cbc8c3";
  g.fillRect(0, 0, 512, 6);
  g.fillRect(0, 0, 6, 512);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${hash01(i) > 0.5 ? "255,255,255" : "120,118,114"},${(0.03 + 0.05 * hash01(i + 9)).toFixed(3)})`;
    g.fillRect(hash01(i + 3) * 512, hash01(i + 5) * 512, 3 + 9 * hash01(i + 7), 3 + 9 * hash01(i + 8));
  }
  const grid = canvasTex(gcv, renderer);
  grid.wrapS = grid.wrapT = THREE.RepeatWrapping;
  // the clay's faint mottle (albedo multiplier)
  const mcv = mkCanvas(512, 512);
  const mc = mcv.getContext("2d") as CanvasRenderingContext2D;
  mc.fillStyle = "#ffffff";
  mc.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5000; i++) {
    const r = 2 + 14 * hash01(i + 0.5);
    mc.fillStyle = `rgba(${hash01(i + 1.1) > 0.5 ? "255,255,255" : "150,146,140"},${(0.025 + 0.04 * hash01(i + 2.2)).toFixed(3)})`;
    mc.beginPath();
    mc.arc(hash01(i + 3.3) * 512, hash01(i + 4.4) * 512, r, 0, 6.283);
    mc.fill();
  }
  const mottle = canvasTex(mcv, renderer);
  mottle.wrapS = mottle.wrapT = THREE.RepeatWrapping;
  // the soft contact blob (alphaMap reads the colour channels: grey on black)
  const bcv = mkCanvas(256, 256);
  const bc = bcv.getContext("2d") as CanvasRenderingContext2D;
  bc.fillStyle = "#000";
  bc.fillRect(0, 0, 256, 256);
  const rg = bc.createRadialGradient(128, 128, 0, 128, 128, 128);
  rg.addColorStop(0, "rgb(255,255,255)");
  rg.addColorStop(0.3, "rgb(200,200,200)");
  rg.addColorStop(0.62, "rgb(70,70,70)");
  rg.addColorStop(1, "rgb(0,0,0)");
  bc.fillStyle = rg;
  bc.fillRect(0, 0, 256, 256);
  const blob = canvasTex(bcv, renderer, false);
  return { text, glyph, draw, image, grid, mottle, blob, pending };
};

// ===================================================================================================================
// THE CLAY KIT (three.js): clay volumes, prints, contact blobs, dashes, tubes
// ===================================================================================================================
export type ClayKit = ReturnType<typeof makeClayKit>;
export const makeClayKit = (scene: Any, T: TexKit) => {
  const mats = new Map<string, Any>();
  /** matte clay in a local colour (a faint mottle) */
  const clay = (color: string, o: { rough?: number; mottle?: boolean } = {}) => {
    const key = `c${color}${o.rough ?? ""}${o.mottle ?? ""}`;
    if (!mats.has(key)) {
      const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), roughness: o.rough ?? 0.88, metalness: 0 });
      if (o.mottle !== false) m.map = T.mottle;
      mats.set(key, m);
    }
    return mats.get(key);
  };
  /** the one glowing material: the labs' secrets (a fresh material when `own`, so a cut can animate its glow) */
  const orange = (glow = 0.55, own = false) => {
    const make = () => new THREE.MeshStandardMaterial({ color: new THREE.Color(C.orange), emissive: new THREE.Color("#FF9A00"), emissiveIntensity: glow, roughness: 0.55, metalness: 0 });
    if (own) return make();
    const key = `o${glow}`;
    if (!mats.has(key)) mats.set(key, make());
    return mats.get(key);
  };
  const place = (o: Any, pos: V3, rot: V3 = [0, 0, 0], parent: Any = scene) => {
    o.position.set(...pos);
    o.rotation.set(rot[0] * D2R, rot[1] * D2R, rot[2] * D2R);
    parent.add(o);
    return o;
  };
  /** a rounded box, centred at pos */
  const box = (size: V3, mat: Any, pos: V3, o: { r?: number; rot?: V3; parent?: Any; shadow?: boolean; seg?: number } = {}) => {
    const r = Math.min(o.r ?? 0.05, size[0] / 2 - 0.002, size[1] / 2 - 0.002, size[2] / 2 - 0.002);
    const geo = new RoundedBoxGeometry(size[0], size[1], size[2], o.seg ?? 5, Math.max(0.001, r));
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = o.shadow !== false;
    m.receiveShadow = true;
    return place(m, pos, o.rot, o.parent);
  };
  const cyl = (rTop: number, rBot: number, h: number, mat: Any, pos: V3, o: { rot?: V3; parent?: Any; seg?: number; shadow?: boolean } = {}) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, o.seg ?? 64, 1), mat);
    m.castShadow = o.shadow !== false;
    m.receiveShadow = true;
    return place(m, pos, o.rot, o.parent);
  };
  /** a puck with a soft rounded edge (lathe), base at pos */
  const puck = (r: number, h: number, bevel: number, mat: Any, pos: V3, o: { rot?: V3; parent?: Any } = {}) => {
    const pts: Any[] = [new THREE.Vector2(0, 0)];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const a = (-Math.PI / 2) * (1 - i / n);
      pts.push(new THREE.Vector2(r - bevel + bevel * Math.cos(a), bevel + bevel * Math.sin(a)));
    }
    for (let i = 0; i <= n; i++) {
      const a = (Math.PI / 2) * (i / n);
      pts.push(new THREE.Vector2(r - bevel + bevel * Math.cos(a), h - bevel + bevel * Math.sin(a)));
    }
    pts.push(new THREE.Vector2(0, h));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 72), mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return place(m, pos, o.rot, o.parent);
  };
  const sphere = (r: number, mat: Any, pos: V3, parent: Any = scene) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), mat);
    m.castShadow = true;
    m.receiveShadow = true;
    return place(m, pos, [0, 0, 0], parent);
  };
  /** a print on a face: a plane of w (height from the texture's aspect unless h), lit like the face it sits on.
   *  trueColour: a mark kept in its own colours (lifted by an emissive copy of itself, out of the fog) */
  const print = (t: Tex, w: number, pos: V3, rot: V3 = [0, 0, 0], o: { h?: number; parent?: Any; opacity?: number; trueColour?: boolean } = {}) => {
    const h = o.h ?? w / t.aspect;
    const mat = new THREE.MeshStandardMaterial({ map: t.tex, transparent: true, opacity: o.opacity ?? 1, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    if (o.trueColour) {
      mat.emissive = new THREE.Color("#ffffff");
      mat.emissiveMap = t.tex;
      mat.emissiveIntensity = 0.42;
      mat.fog = false;
    }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.receiveShadow = true;
    if (o.trueColour) m.userData.tc = true;
    return place(m, pos, rot, o.parent);
  };
  /** a soft contact blob on the floor (or a surface at y) */
  const blob = (x: number, z: number, w: number, d: number, amt = 0.55, y = 0.004, parent: Any = scene) => {
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.shadow), alphaMap: T.blob, transparent: true, opacity: amt, depthWrite: false, fog: true });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.renderOrder = 1;
    return place(m, [x, y, z], [-90, 0, 0], parent);
  };
  /** the floor pool: a wide soft darkening of the floor under a set, so it separates from the ground */
  const pool = (x: number, z: number, r: number, amt = 0.22, parent: Any = scene) => blob(x, z, r * 2, r * 2, amt, 0.002, parent);
  /** a dashed line through points: small rounded bars (dash, gap in metres) */
  const dashes = (pts: V3[], o: { dash?: number; gap?: number; r?: number; mat?: Any; parent?: Any; phase?: number; upTo?: number } = {}) => {
    const dash = o.dash ?? 0.12;
    const gap = o.gap ?? 0.08;
    const r = o.r ?? 0.016;
    const mat = o.mat ?? clay(C.cream, { mottle: false });
    const parent = o.parent ?? scene;
    let total = 0;
    for (let i = 0; i < pts.length - 1; i++) total += new THREE.Vector3(...pts[i]).distanceTo(new THREE.Vector3(...pts[i + 1]));
    const limit = (o.upTo ?? 1) * total;
    let carry = o.phase ?? 0;
    let run = 0;
    const out: Any[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = new THREE.Vector3(...pts[i]);
      const b = new THREE.Vector3(...pts[i + 1]);
      const L = a.distanceTo(b);
      const dir = b.clone().sub(a).normalize();
      let s = -carry;
      while (s < L) {
        const s0 = Math.max(0, s);
        const s1 = Math.min(L, s + dash, limit - run);
        if (s1 - s0 > r) {
          const len = s1 - s0;
          const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 6, 12), mat);
          m.castShadow = true;
          m.position.copy(a.clone().add(dir.clone().multiplyScalar((s0 + s1) / 2)));
          m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          parent.add(m);
          out.push(m);
        }
        s += dash + gap;
      }
      carry = s - L;
      run += L;
    }
    return out;
  };
  /** a smooth tube along a curve of points */
  const tube = (pts: V3[], r: number, mat: Any, parent: Any = scene, seg = 160) => {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal");
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, seg, r, 12, false), mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return { mesh: m, curve };
  };
  /** a solid rod between two points (capsule) */
  const rod = (a: V3, b: V3, r: number, mat: Any, parent: Any = scene) => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const L = Math.max(0.001, A.distanceTo(B));
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, L, 8, 16), mat);
    m.position.copy(A.clone().add(B).multiplyScalar(0.5));
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const group = (parent: Any = scene, pos: V3 = [0, 0, 0], yawDeg = 0) => {
    const g = new THREE.Group();
    g.position.set(...pos);
    g.rotation.y = yawDeg * D2R;
    parent.add(g);
    return g;
  };
  /** remove and dispose everything under a group (for sets that rebuild their geometry on a change) */
  const clear = (g: Any) => {
    while (g.children.length) {
      const c = g.children.pop();
      c.traverse((o: Any) => {
        if (o.geometry) o.geometry.dispose();
      });
    }
  };
  return { clay, orange, place, box, cyl, puck, sphere, print, blob, pool, dashes, tube, rod, group, clear };
};

// ===================================================================================================================
// LIGHT AND GROUND
// ===================================================================================================================
export type LightOpts = { center?: V3; span?: number; key?: number; hemi?: number; rim?: number; keyDir?: V3; shadow?: number };
/** key from the upper left, high (short, soft shadows), a cream rim from behind-left, a faint fill from the right */
export const addLights = (scene: Any, o: LightOpts = {}) => {
  const c = new THREE.Vector3(...(o.center ?? [0, 0, 0]));
  const span = o.span ?? 8;
  const hemi = new THREE.HemisphereLight(new THREE.Color("#EFEBE4"), new THREE.Color("#363532"), o.hemi ?? 0.72);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(new THREE.Color("#FFF8EE"), o.key ?? 3.25);
  const kd = new THREE.Vector3(...(o.keyDir ?? [-0.55, 1.0, 0.32])).normalize();
  key.position.copy(c.clone().add(kd.multiplyScalar(span * 2)));
  key.target.position.copy(c);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
  key.shadow.camera.left = -span;
  key.shadow.camera.right = span;
  key.shadow.camera.top = span;
  key.shadow.camera.bottom = -span;
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = span * 5;
  key.shadow.radius = 10;
  key.shadow.blurSamples = 28;
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.02;
  if ("intensity" in key.shadow) key.shadow.intensity = o.shadow ?? 0.82;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(new THREE.Color("#FFF7EC"), o.rim ?? 1.15);
  rim.position.copy(c.clone().add(new THREE.Vector3(-0.35, 0.5, -1).normalize().multiplyScalar(span * 2)));
  rim.target.position.copy(c);
  scene.add(rim, rim.target);
  const fill = new THREE.DirectionalLight(new THREE.Color("#D2CEC6"), 0.2);
  fill.position.copy(c.clone().add(new THREE.Vector3(1, 0.25, 0.8).normalize().multiplyScalar(span * 2)));
  fill.target.position.copy(c);
  scene.add(fill, fill.target);
  return { hemi, key, rim, fill };
};
export type FloorOpts = { cell?: number; size?: number; color?: string; center?: [number, number] };
/** the floor: a big plane with the Dwarkesh grid painted faintly on it (cell in metres) */
export const addFloor = (scene: Any, T: TexKit, o: FloorOpts = {}) => {
  const size = o.size ?? 160;
  const cell = o.cell ?? 0.6;
  const tex = T.grid.clone();
  tex.needsUpdate = true;
  tex.repeat.set(size / cell, size / cell);
  const ce = o.center ?? [0, 0];
  tex.offset.set((-ce[0] / cell) % 1, (ce[1] / cell) % 1);
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(o.color ?? C.floor), map: tex, roughness: 0.95, metalness: 0 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  m.rotation.set(-Math.PI / 2, 0, 0);
  m.position.set(ce[0], 0, ce[1]);
  m.receiveShadow = true;
  scene.add(m);
  return m;
};

// ===================================================================================================================
// THE WORLD (what spec.build receives) and THE THREE LAYER (built once, rendered per frame, two passes)
// ===================================================================================================================
export type World = {
  scene: Any;
  T: TexKit;
  K: ClayKit;
  renderer: Any;
  /** mark a mesh and its children TRUE COLOUR (redrawn over the haze, no fog) */
  tc: (o: Any) => void;
  /** keep o's cap height (capH m at scale 1) at >= minPx on screen; o is scaled about its own origin */
  legible: (o: Any, capH: number | (() => number), minPx?: number) => void;
};
export type WorldSpec = {
  fog?: { near: number; far: number };
  light?: LightOpts;
  floor?: FloorOpts | false;
  /** build once; return the per-frame update (set every animated state from the frame: frames come in any order) */
  build: (w: World) => (frame: number, cam: CamDef) => void;
};
const SS = 2;
type Built = { renderer: Any; scene: Any; update: (f: number, c: CamDef) => void; wall: Any; legibles: { o: Any; capH: number | (() => number); minPx: number; base: number }[] };
const ThreeWorld: React.FC<{ spec: WorldSpec; cam: CamDef; frame: number; fogColor: string; baseRef: React.RefObject<HTMLCanvasElement | null>; glRef: React.RefObject<HTMLCanvasElement | null> }> = ({
  spec,
  cam,
  frame,
  fogColor,
  baseRef,
  glRef,
}) => {
  const built = useRef<Promise<Built> | null>(null);
  const camKey = JSON.stringify(cam);
  useLayoutEffect(() => {
    const handle = delayRender(`paulWorld frame ${frame}`, { timeoutInMilliseconds: 180000 });
    if (!built.current) {
      built.current = (async (): Promise<Built> => {
        await waitUntilDone();
        await document.fonts.load(`700 120px "${COND}"`);
        const renderer = new THREE.WebGLRenderer({ canvas: glRef.current, antialias: true, alpha: true, preserveDrawingBuffer: true });
        renderer.setPixelRatio(SS);
        renderer.setSize(W, H, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.NoToneMapping;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.VSMShadowMap;
        renderer.setClearColor(0x000000, 0);
        const scene = new THREE.Scene();
        const fog = spec.fog ?? { near: 12, far: 40 };
        scene.fog = new THREE.Fog(new THREE.Color(fogColor), fog.near, fog.far);
        const T = makeTexKit(renderer);
        const K = makeClayKit(scene, T);
        addLights(scene, spec.light ?? {});
        if (spec.floor !== false) addFloor(scene, T, spec.floor ?? {});
        const legibles: Built["legibles"] = [];
        const world: World = {
          scene,
          T,
          K,
          renderer,
          tc: (o) =>
            o.traverse((m: Any) => {
              m.userData.tc = true;
              if (m.material) m.material.fog = false;
            }),
          legible: (o, capH, minPx = 48) => legibles.push({ o, capH, minPx, base: o.scale.x }),
        };
        const update = spec.build(world);
        // the horizon as a soft zone: a far wall in the fog colour, opaque at the floor, fading up into the backdrop
        const hw = mkCanvas(4, 256);
        const hc = hw.getContext("2d") as CanvasRenderingContext2D;
        const gr = hc.createLinearGradient(0, 0, 0, 256);
        gr.addColorStop(0, "rgb(0,0,0)");
        gr.addColorStop(0.35, "rgb(60,60,60)");
        gr.addColorStop(0.7, "rgb(200,200,200)");
        gr.addColorStop(0.85, "rgb(255,255,255)");
        gr.addColorStop(1, "rgb(255,255,255)");
        hc.fillStyle = gr;
        hc.fillRect(0, 0, 4, 256);
        const dist = fog.far * 1.15;
        const fade = dist * 0.16;
        const wall = new THREE.Mesh(
          new THREE.PlaneGeometry(dist * 6, fade * 1.25),
          new THREE.MeshBasicMaterial({ color: new THREE.Color(fogColor), alphaMap: new THREE.CanvasTexture(hw), transparent: true, depthWrite: false, fog: false }),
        );
        wall.userData.dist = dist;
        wall.userData.fade = fade;
        scene.add(wall);
        await Promise.all(T.pending);
        return { renderer, scene, update, wall, legibles };
      })();
    }
    let cancelled = false;
    built.current
      .then((b) => {
        if (cancelled) return;
        const c3 = makeCam(cam);
        b.scene.fog.color.set(fogColor);
        b.wall.material.color.set(fogColor);
        b.update(frame, cam);
        // keep the plates legible
        const fwd = new THREE.Vector3();
        c3.getWorldDirection(fwd);
        const F = H / 2 / Math.tan((cam.fov * D2R) / 2);
        b.legibles.forEach((L) => {
          L.o.scale.setScalar(L.base);
          L.o.updateMatrixWorld(true);
          const wp = new THREE.Vector3();
          L.o.getWorldPosition(wp);
          const ws = new THREE.Vector3();
          L.o.getWorldScale(ws);
          const depth = Math.max(0.05, wp.sub(c3.position).dot(fwd));
          const px = ((typeof L.capH === "function" ? L.capH() : L.capH) * ws.x * F) / depth;
          if (px > 0 && px < L.minPx) L.o.scale.setScalar(L.base * (L.minPx / px));
        });
        // the haze wall follows the camera
        const dir = new THREE.Vector3();
        c3.getWorldDirection(dir);
        dir.y = 0;
        dir.normalize();
        b.wall.position.copy(c3.position.clone().add(dir.multiplyScalar(b.wall.userData.dist)));
        b.wall.position.y = b.wall.userData.fade * 1.25 * 0.5 - b.wall.userData.fade * 0.25;
        b.wall.lookAt(new THREE.Vector3(c3.position.x, b.wall.position.y, c3.position.z));
        // pass 1: the whole world -> the base canvas (under the shafts and haze)
        b.renderer.shadowMap.autoUpdate = true;
        b.renderer.render(b.scene, c3);
        const base = baseRef.current;
        if (base) {
          const ctx = base.getContext("2d") as CanvasRenderingContext2D;
          ctx.clearRect(0, 0, base.width, base.height);
          ctx.drawImage(b.renderer.domElement, 0, 0, base.width, base.height);
        }
        // pass 2: only the true-colour marks (everything else writes depth only) -> the gl canvas, over the haze
        const hidden: Any[] = [];
        const swapped: [Any, Any][] = [];
        const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
        b.scene.traverse((o: Any) => {
          if (!o.isMesh || !o.visible || o.userData.tc) return;
          const m = o.material;
          if (Array.isArray(m) || m.transparent || m.depthWrite === false) {
            o.visible = false;
            hidden.push(o);
          } else {
            swapped.push([o, m]);
            o.material = depthOnly;
          }
        });
        b.renderer.shadowMap.autoUpdate = false;
        b.renderer.render(b.scene, c3);
        b.renderer.shadowMap.autoUpdate = true;
        hidden.forEach((o) => (o.visible = true));
        swapped.forEach(([o, m]) => (o.material = m));
        depthOnly.dispose();
        continueRender(handle);
      })
      .catch((e) => {
        console.error(e);
        continueRender(handle);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, camKey, fogColor]);
  // free the GL context when the stage unmounts (a probe sheet mounts several worlds in one tab)
  useLayoutEffect(
    () => () => {
      built.current?.then((b) => {
        b.renderer.dispose();
        b.renderer.forceContextLoss();
      });
    },
    [],
  );
  return null;
};

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
export type AirOpts = { shafts?: number; motes?: number; bloom?: number; lowAir?: number; foreground?: number; fgSeed?: number; trueColour?: number; grade?: number };
/** soft defocused foreground: a few big dark rounded shapes along the bottom edge (near clay blocks out of focus),
 *  sliding a little against the camera's yaw (parallax) */
const Foreground: React.FC<{ amt: number; seed: number; shift: number }> = ({ amt, seed, shift }) => {
  if (amt <= 0) return null;
  const col = rgbHex(rampAt(0.95));
  const shapes = Array.from({ length: 4 }, (_, i) => {
    const s = seed * 7.13 + i * 3.7;
    const x = -160 + (i / 3) * 1400 + (hash01(s) - 0.5) * 240 + shift;
    const w = 340 + 300 * hash01(s + 1);
    const h = 170 + 190 * hash01(s + 2);
    const y = 1920 - h * (0.55 + 0.4 * hash01(s + 3));
    return { x, y, w, h, r: 50 + 50 * hash01(s + 4), o: 0.7 + 0.25 * hash01(s + 5) };
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <filter id="pwFgBlur" x="-30%" y="-60%" width="160%" height="220%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
      </defs>
      <g filter="url(#pwFgBlur)" opacity={amt}>
        {shapes.map((q, i) => (
          <rect key={i} x={q.x - q.w / 2} y={q.y} width={q.w} height={q.h * 2} rx={q.r} fill={col} opacity={q.o} />
        ))}
      </g>
    </svg>
  );
};
export const PaulStage: React.FC<{
  spec: WorldSpec;
  cam: CamDef;
  frame?: number;
  overlay?: (P: Projector, cam: CamDef) => React.ReactNode;
  /** people or anything drawn OVER the true-colour marks (rare) */
  top?: (P: Projector, cam: CamDef) => React.ReactNode;
  air?: AirOpts;
}> = ({ spec, cam, frame, overlay, top, air = {} }) => {
  const cur = useCurrentFrame();
  const f = frame ?? cur;
  const baseRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<HTMLCanvasElement>(null);
  const P = projector(cam);
  const { horizon, F } = horizonOf(cam);
  const v = makeGraphiteView({ frame: f, horizon, F });
  const fogColor = rgbHex(v.airAtScreen(horizon));
  const low = rgbHex(rampAt(0.9));
  const lowAir = air.lowAir ?? 1;
  const a2h = (a: number) => Math.round(clamp01(a) * 255).toString(16).padStart(2, "0");
  // the yaw of the camera for the foreground parallax
  const yawCam = Math.atan2(cam.pos[0] - cam.target[0], cam.pos[2] - cam.target[2]) / D2R;
  return (
    <AirStage
      v={v}
      shafts={air.shafts ?? 0.6}
      motes={air.motes ?? 0.45}
      bloom={air.bloom ?? 0.22}
      grade={air.grade ?? 0.85}
      overlay={
        <>
          {/* the low air: below the keep-in box the near floor sinks into denser, darker air */}
          <AbsoluteFill
            style={{
              background: `linear-gradient(to bottom, ${low}00 0%, ${low}00 52%, ${low}${a2h(0.28 * lowAir)} 60%, ${low}${a2h(0.62 * lowAir)} 72%, ${low}${a2h(0.8 * lowAir)} 86%, ${low}${a2h(0.88 * lowAir)} 100%)`,
            }}
          />
          <Foreground amt={air.foreground ?? 1} seed={air.fgSeed ?? 0} shift={-yawCam * 9} />
          <canvas ref={glRef} style={{ position: "absolute", left: 0, top: 0, width: W, height: H, opacity: air.trueColour ?? 0.92 }} />
          {top ? (
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
              {top(P, cam)}
            </svg>
          ) : null}
        </>
      }
    >
      <canvas ref={baseRef} width={W * SS} height={H * SS} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />
      <ThreeWorld spec={spec} cam={cam} frame={f} fogColor={fogColor} baseRef={baseRef} glRef={glRef} />
      {overlay ? (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {overlay(P, cam)}
        </svg>
      ) : null}
    </AirStage>
  );
};
