import { loadFont as loadMono } from "@remotion/google-fonts/DMMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/Newsreader";
import React, { useId, useMemo } from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile } from "remotion";
import { INK_TILE, INK_TILE_SIZE } from "./wipInkData";

// ---------------------------------------------------------------------------
// WORKS IN PROGRESS KIT (styles/works-in-progress.md). 1080 x 1920, opaque.
// Real things in black and white are placed on a printed page and inked over: the graphic and the real thing make one
// picture. A cut decides what happens; this file decides what it is made of.
//
// STACK, bottom to top, inside <WipFilmLife>:
//   <PaperGround cam={cam} />              the sheet, at its own parallax
//   <WipPlane cam={cam}> stamps, cut-outs  pasted things (a normal plane)
//   <WipPlane cam={cam} ink> postmarks     INK MUST SIT ON AN `ink` PLANE to multiply into the paper and what lies
//                                          under it: a CSS transform makes a plane its own blend group, so an ordinary
//                                          plane's ink would multiply only with that plane. Later planes cover earlier ink.
//
// Baked by scripts/clips/wip-anthropic/bake-paper.py: public/wip-anthropic/paper_<theme>.jpg, stamp_paper.jpg,
// film_grain.png, and ./wipInkData.ts. Photographs: scripts/clips/wip-anthropic/bake-photo.py gives matched levels.
// Usage of every export: the clip's notes/KIT_READY.md. Probe: ../../wip-anthropic/WipKitProbe.tsx.
// ---------------------------------------------------------------------------

export const W = 1080;
export const H = 1920;

// -- tokens ----------------------------------------------------------------------
/** The site's theme pairs. One pair per clip. */
export const THEMES = {
  mint: { paper: "#CEE0DC", ink: "#073429" },
  pink: { paper: "#F8E6EA", ink: "#E20A39" },
  lilac: { paper: "#D8D9F1", ink: "#363B8F" },
  yellow: { paper: "#F4D06F", ink: "#4C3906" },
  offwhite: { paper: "#FFF7F4", ink: "#121212" },
} as const;
export type WipTheme = keyof typeof THEMES;
/** Spot inks, printing over any paper like a two-colour press. */
export const RED = "#E20A39";
export const INDIGO = "#363B8F";
/** Anthropic's mark only. */
export const CLAY = "#D97757";
/** The stamp's border stock (baked, stamp_paper.jpg) and a cut-out's paper border. */
export const STOCK = "#EFE9DB";
/** The ends of every printed photograph: the page's black and white, never pure. */
export const PHOTO_BLACK = "#14191A";
export const PHOTO_WHITE = "#EEEDE4";

const { fontFamily: serifFamily } = loadSerif("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: monoFamily } = loadMono("normal", { weights: ["300", "400", "500"], subsets: ["latin"] });
/** Names and big words, weight SERIF_WEIGHT. Stand-in for the site's Editor Bold: Newsreader Bold, the nearest in contrast, lining figures. */
export const SERIF = serifFamily;
export const SERIF_WEIGHT = 700;
/** Small labels and postmark lettering. Stand-in for GT America Mono (DM Mono, a grotesque mono like it): 300 for labels, 500 inside a postmark. */
export const MONO = monoFamily;

const hexRgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
/** The ink to lay down so that, multiplied into this paper, the page shows `colour` (as near as 8 bits allow). */
export const inkOn = (colour: string, theme: WipTheme = "mint") => {
  const paper = hexRgb(THEMES[theme].paper);
  const c = hexRgb(colour).map((v, i) => Math.min(255, Math.round((v * 255) / paper[i])));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};

// -- motion ----------------------------------------------------------------------
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Paper's one ease: slid, dealt, lifted. */
export const paperEase = Easing.bezier(0.45, 0, 0.18, 1);
/** 0..1 over `dur` frames from `start`, on paperEase. One family of speeds: dur about 14-24 for a page-sized slide. */
export const slide = (frame: number, start: number, dur = 18) =>
  interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: paperEase });
/** Text's entrance: spread on a text node. Slides up while fading in. */
export const textRise = (frame: number, start: number, dur = 12, dist = 16): React.CSSProperties => {
  const t = slide(frame, start, dur);
  return { opacity: t, transform: `translateY(${(1 - t) * dist}px)` };
};
/**
 * A stamp's press for `press=` on <Stamp>. `contact` is the frame it touches the page (write it in the header): falling
 * for `fall` frames before, pressed flat for `settle` after. Returns 0 (up) .. 0.7 (contact) .. 1 (flat).
 */
export const stampPress = (frame: number, contact: number, fall = 7, settle = 5) =>
  frame < contact
    ? interpolate(frame, [contact - fall, contact], [0, 0.7], clamp)
    : interpolate(frame, [contact, contact + settle], [0.7, 1], clamp);
/** A rubber stamp's ink for `press=` on <Postmark>: nothing until `contact`, the ink taking over `dur` frames. */
export const inkPress = (frame: number, contact: number, dur = 3) =>
  frame < contact ? 0 : interpolate(frame, [contact, contact + dur], [0.45, 1], clamp);

// -- the camera ------------------------------------------------------------------
/**
 * A dolly. (x, y) = the focus-plane (d = 1) world point at the frame's centre; k = the focus plane's scale. (x0, y0) =
 * the rest camera at which every plane's world px equal screen px (runWipCamera sets it to the opening key).
 * d > 1 is farther: scales and slides less; d < 1 is nearer.
 */
export type WipCam = { x: number; y: number; k: number; x0?: number; y0?: number };
export type WipCamKey = { f: number; x: number; y: number; k: number; ease?: "inout" | "linear" };

export const CAM_STIFF = 0.09;
export const CAM_DAMP = 0.468;

/**
 * The damped tracker over a coarse keyed track: `const camAt = runWipCamera(keys, DURATION); const cam = camAt(frame);`
 * Between keys the target eases (or runs "linear": the ease of the LATER key decides), and the follower lags it by about
 * 8-10 frames, so key early, with a first key before f0 so the move is running at f0. Never rounds; call at module scope.
 */
export const runWipCamera = (keys: WipCamKey[], lastFrame: number) => {
  const ks = [...keys].sort((a, b) => a.f - b.f);
  if (ks.length === 0) throw new Error("runWipCamera: no keys");
  const f0 = Math.floor(ks[0].f);
  const f1 = Math.max(Math.ceil(ks[ks.length - 1].f), lastFrame);
  const target = (f: number): [number, number, number] => {
    if (f <= ks[0].f) return [ks[0].x, ks[0].y, ks[0].k];
    for (let i = 1; i < ks.length; i++) {
      if (f <= ks[i].f) {
        const a = ks[i - 1];
        const b = ks[i];
        const u = (f - a.f) / (b.f - a.f);
        const t = b.ease === "linear" ? u : u * u * (3 - 2 * u);
        // the zoom interpolates in log space, so it reads as one speed
        return [a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.k * (b.k / a.k) ** t];
      }
    }
    const z = ks[ks.length - 1];
    return [z.x, z.y, z.k];
  };
  const track: [number, number, number][] = [];
  let p = target(f0);
  let v: [number, number, number] = [0, 0, 0];
  for (let f = f0; f <= f1; f++) {
    const t = target(f);
    v = [
      v[0] + (t[0] - p[0]) * CAM_STIFF - v[0] * CAM_DAMP,
      v[1] + (t[1] - p[1]) * CAM_STIFF - v[1] * CAM_DAMP,
      v[2] + (t[2] - p[2]) * CAM_STIFF - v[2] * CAM_DAMP,
    ];
    p = [p[0] + v[0], p[1] + v[1], p[2] + v[2]];
    track.push(p);
  }
  const x0 = ks[0].x;
  const y0 = ks[0].y;
  return (frame: number): WipCam => {
    const i = Math.max(0, Math.min(track.length - 1, frame - f0));
    const lo = Math.floor(i);
    const hi = Math.min(track.length - 1, lo + 1);
    const u = i - lo;
    const at = (c: 0 | 1 | 2) => track[lo][c] + (track[hi][c] - track[lo][c]) * u;
    return { x: at(0), y: at(1), k: at(2), x0, y0 };
  };
};

export const depthScale = (k: number, d: number) => {
  if (d === 1) return k;
  const den = d - (1 - 1 / k);
  if (den <= 0.02) throw new Error(`depthScale: the camera (k ${k}) has passed the plane at depth ${d}`);
  return d / den;
};
/** The transform of a plane at depth d: scale, translation, CSS transform (origin 0 0), toScreen(x, y). */
export const depthTransform = (cam: WipCam, d = 1) => {
  const x0 = cam.x0 ?? W / 2;
  const y0 = cam.y0 ?? H / 2;
  const kd = depthScale(cam.k, d);
  const xd = d === 1 ? cam.x : x0 + (cam.x - x0) / d;
  const yd = d === 1 ? cam.y : y0 + (cam.y - y0) / d;
  const tx = W / 2 - xd * kd;
  const ty = H / 2 - yd * kd;
  return {
    k: kd,
    tx,
    ty,
    transform: `translate(${tx}px, ${ty}px) scale(${kd})`,
    toScreen: (x: number, y: number) => ({ x: tx + x * kd, y: ty + y * kd }),
  };
};

/**
 * A plane at depth d: children sit in that plane's world px (top-left origin, absolute). `ink`: the whole plane
 * multiplies into everything below it (the paper, earlier planes). Put postmarks and InkPrints here.
 */
export const WipPlane: React.FC<{ cam: WipCam; d?: number; ink?: boolean; children: React.ReactNode; style?: React.CSSProperties }> = ({
  cam,
  d = 1,
  ink = false,
  children,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      width: W,
      height: H,
      transformOrigin: "0 0",
      transform: depthTransform(cam, d).transform,
      mixBlendMode: ink ? "multiply" : undefined,
      ...style,
    }}
  >
    {children}
  </div>
);

// -- the ground ------------------------------------------------------------------
export const PAPER_W = 2200;
export const PAPER_H = 3800;
/** The sheet's own depth: objects at d = 1 slide over it. */
export const PAPER_D = 1.35;

/** The tinted sheet: a baked scan of printed paper. World centre (540, 960) at rest; it throws if the camera outruns it. */
export const PaperGround: React.FC<{ cam: WipCam; theme?: WipTheme; d?: number }> = ({ cam, theme = "mint", d = PAPER_D }) => {
  const t = depthTransform(cam, d);
  const left = W / 2 - PAPER_W / 2;
  const top = H / 2 - PAPER_H / 2;
  // the sheet's rest position is about the rest camera, so at rest world px = screen px on every plane
  const ax = (cam.x0 ?? W / 2) - W / 2;
  const ay = (cam.y0 ?? H / 2) - H / 2;
  const a = t.toScreen(left + ax, top + ay);
  const b = t.toScreen(left + ax + PAPER_W, top + ay + PAPER_H);
  if (a.x > 0 || a.y > 0 || b.x < W || b.y < H) {
    throw new Error(`PaperGround: camera (${cam.x}, ${cam.y}, k ${cam.k}) leaves the ${PAPER_W}x${PAPER_H} sheet`);
  }
  return (
    <AbsoluteFill style={{ backgroundColor: THEMES[theme].paper }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: t.transform }}>
        <Img
          src={staticFile(`wip-anthropic/paper_${theme}.jpg`)}
          style={{ position: "absolute", left: left + ax, top: top + ay, width: PAPER_W, height: PAPER_H, maxWidth: "none" }}
        />
      </div>
    </AbsoluteFill>
  );
};

// -- film life -------------------------------------------------------------------
const GRAIN_W = 1400;
const GRAIN_H = 2300;
/**
 * Faint grain, new each frame, in screen space over everything (no weave, no glow, no vignette). Wrap the whole scene:
 * it is the blend group the ink planes multiply within. Joined cuts pass a global frame.
 */
export const WipFilmLife: React.FC<{ frame: number; children?: React.ReactNode; grain?: number; theme?: WipTheme; seed?: string }> = ({
  frame,
  children,
  grain = 0.13,
  theme = "mint",
  seed = "wip",
}) => {
  const f = Math.floor(frame);
  const gx = Math.floor(random(`${seed}-gx-${f}`) * (GRAIN_W - W));
  const gy = Math.floor(random(`${seed}-gy-${f}`) * (GRAIN_H - H));
  const fx = random(`${seed}-fx-${f}`) < 0.5 ? -1 : 1;
  const fy = random(`${seed}-fy-${f}`) < 0.5 ? -1 : 1;
  return (
    <AbsoluteFill style={{ overflow: "hidden", isolation: "isolate", backgroundColor: THEMES[theme].paper }}>
      {children}
      <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity: grain, pointerEvents: "none" }}>
        <Img
          src={staticFile("wip-anthropic/film_grain.png")}
          style={{
            position: "absolute",
            left: -gx,
            top: -gy,
            width: GRAIN_W,
            height: GRAIN_H,
            maxWidth: "none",
            transform: `scale(${fx}, ${fy})`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// -- caption bands ---------------------------------------------------------------
/** The burned-in captions' SCREEN y ranges (of 1920). Nothing readable here on any camera state. */
export const CAPTION_BANDS: readonly (readonly [number, number])[] = [
  [1080, 1250],
  [1360, 1460],
];
export const inCaptionBand = (y0: number, y1: number) => CAPTION_BANDS.some(([a, b]) => y1 > a && y0 < b);
/** Preview aid: the caption bands as translucent strips, in screen space, outside WipFilmLife. Off by default; never on in a final. */
export const CaptionBandsDebug: React.FC<{ on?: boolean }> = ({ on = false }) =>
  on ? (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {CAPTION_BANDS.map(([a, b]) => (
        <div key={a} style={{ position: "absolute", left: 0, top: a, width: W, height: b - a, background: "rgba(255,0,180,0.22)" }} />
      ))}
    </AbsoluteFill>
  ) : null;

// -- the print finish on a photograph ------------------------------------------------
const seedInt = (seed: string | number, salt: string) => 1 + Math.floor(random(`${seed}-${salt}`) * 9973);
const toneTable = (black: number, white: number, gamma: number) =>
  Array.from({ length: 17 }, (_, i) => (black + (white - black) * (i / 16) ** gamma).toFixed(4)).join(" ");

/** The SVG primitives of the one grade: greyscale, levels onto the page's black and white, print grain. In: SourceGraphic. Out: `result`. */
const PrintGrade: React.FC<{ result: string; seed: string | number; gamma: number; grain: number }> = ({ result, seed, gamma, grain }) => {
  const b = hexRgb(PHOTO_BLACK).map((v) => v / 255);
  const w = hexRgb(PHOTO_WHITE).map((v) => v / 255);
  return (
    <>
      <feColorMatrix in="SourceGraphic" type="saturate" values="0" result="grey" />
      <feComponentTransfer in="grey" result="toned">
        <feFuncR type="table" tableValues={toneTable(b[0], w[0], gamma)} />
        <feFuncG type="table" tableValues={toneTable(b[1], w[1], gamma)} />
        <feFuncB type="table" tableValues={toneTable(b[2], w[2], gamma)} />
      </feComponentTransfer>
      {/* a fine stipple with a faint horizontal weave, as on the magazine's stamps */}
      <feTurbulence type="fractalNoise" baseFrequency="0.55 0.95" numOctaves={2} seed={seedInt(seed, "grain")} result="n0" />
      <feColorMatrix in="n0" type="matrix" values="2.4 0 0 0 -0.7  2.4 0 0 0 -0.7  2.4 0 0 0 -0.7  0 0 0 0 1" result="n" />
      {/* multiply the grain into the lights, add a little into the blacks */}
      <feComposite in="toned" in2="n" operator="arithmetic" k1={2 * grain} k2={1 - grain} k3={0.09 * grain * 4} k4={-0.045 * grain * 4} result="grained" />
      <feComposite in="grained" in2="SourceAlpha" operator="in" result={result} />
    </>
  );
};

/** A paper lying on the page: a tight contact line and a soft low falloff, from `alpha`. Never a hard offset. */
const ContactShade: React.FC<{ alpha: string; lift: number; result: string; strength: number }> = ({ alpha, lift, result, strength }) => {
  const near = 1.6 + 6 * lift;
  const far = 8 + 26 * lift;
  return (
    <>
      <feGaussianBlur in={alpha} stdDeviation={near} result="sa" />
      <feOffset in="sa" dy={1.5 + 8 * lift} result="sa2" />
      <feFlood floodColor="#0E1F1A" floodOpacity={0.36 * strength * (1 - 0.4 * lift)} result="ca" />
      <feComposite in="ca" in2="sa2" operator="in" result="s1" />
      <feGaussianBlur in={alpha} stdDeviation={far} result="sb" />
      <feOffset in="sb" dy={6 + 26 * lift} result="sb2" />
      <feFlood floodColor="#0E1F1A" floodOpacity={0.24 * strength} result="cb" />
      <feComposite in="cb" in2="sb2" operator="in" result="s2" />
      <feMerge result={result}>
        <feMergeNode in="s2" />
        <feMergeNode in="s1" />
      </feMerge>
    </>
  );
};

const useFilterId = (name: string) => `wip-${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

/** A rectangular print filling its parent, graded (for inside a Stamp or a Plate). `src` under public/. */
export const PrintPhoto: React.FC<{
  src: string;
  fit?: "cover" | "contain";
  position?: string;
  scale?: number;
  gamma?: number;
  grain?: number;
  seed?: string | number;
}> = ({ src, fit = "cover", position = "50% 50%", scale = 1, gamma = 1, grain = 0.13, seed = src }) => {
  const id = useFilterId("print");
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <PrintGrade result="out" seed={seed} gamma={gamma} grain={grain} />
          </filter>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", filter: `url(#${id})` }}>
        <Img
          src={staticFile(src)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            maxWidth: "none",
            objectFit: fit,
            objectPosition: position,
            transform: scale === 1 ? undefined : `scale(${scale})`,
          }}
        />
      </div>
    </>
  );
};

/**
 * A b&w real photo cut out, sitting ON the paper: the one grade, an optional thin hand-cut paper border, a soft low
 * contact shadow that stays low whatever the rotation. `src` = PNG with alpha under public/ (bake-photo.py). `w` world
 * px wide; `aspect` = its width / height. (x, y) = centre. `lift` 0 lying flat .. 1 being carried (shadow spreads).
 * `border` world px (0 = none). Entrances per CRAFT: slide it in from an edge or from behind something, at full size.
 */
export const CutOut: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  aspect: number;
  rotate?: number;
  flipX?: boolean;
  border?: number;
  lift?: number;
  shadow?: number;
  gamma?: number;
  grain?: number;
  seed?: string | number;
}> = ({ src, x, y, w, aspect, rotate = 0, flipX = false, border = 0, lift = 0, shadow = 1, gamma = 1, grain = 0.13, seed = src }) => {
  const id = useFilterId("cut");
  const h = w / aspect;
  return (
    <div style={{ position: "absolute", left: x - w / 2, top: y - h / 2, width: w, height: h }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={id} colorInterpolationFilters="sRGB" x="-45%" y="-45%" width="190%" height="190%">
            <PrintGrade result="photo" seed={seed} gamma={gamma} grain={grain} />
            {border > 0 ? (
              <>
                <feMorphology in="SourceAlpha" operator="dilate" radius={border} result="fat" />
                <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seedInt(seed, "cut")} result="cutN" />
                <feDisplacementMap in="fat" in2="cutN" scale={border * 1.1} xChannelSelector="R" yChannelSelector="G" result="fat2" />
                <feFlood floodColor={STOCK} result="stock" />
                <feComposite in="stock" in2="fat2" operator="in" result="paper" />
              </>
            ) : null}
            <ContactShade alpha={border > 0 ? "paper" : "SourceAlpha"} lift={lift} result="shade" strength={shadow} />
            <feMerge>
              <feMergeNode in="shade" />
              {border > 0 ? <feMergeNode in="paper" /> : null}
              <feMergeNode in="photo" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, filter: `url(#${id})` }}>
        <Img
          src={staticFile(src)}
          style={{
            position: "absolute",
            inset: 0,
            width: w,
            height: h,
            maxWidth: "none",
            transform: rotate || flipX ? `rotate(${rotate}deg) scaleX(${flipX ? -1 : 1})` : undefined,
          }}
        />
      </div>
    </div>
  );
};

// -- the stamp ---------------------------------------------------------------------
/**
 * The stamp's outline: a rectangle with semicircular holes bitten out of every side, a whole number of holes per side
 * so it stays symmetric at any size, with a square tooth at each corner. In the stamp's own px.
 */
export const perforationPath = (w: number, h: number, pitch: number, holeR = 0.3) => {
  const nx = Math.max(2, Math.round(w / pitch));
  const ny = Math.max(2, Math.round(h / pitch));
  const px = w / nx;
  const py = h / ny;
  const r = holeR * Math.min(px, py);
  const n = (v: number) => v.toFixed(3);
  const d: string[] = ["M0 0"];
  for (let i = 0; i < nx; i++) {
    const c = (i + 0.5) * px;
    d.push(`L${n(c - r)} 0 A${n(r)} ${n(r)} 0 0 0 ${n(c + r)} 0`);
  }
  d.push(`L${n(w)} 0`);
  for (let i = 0; i < ny; i++) {
    const c = (i + 0.5) * py;
    d.push(`L${n(w)} ${n(c - r)} A${n(r)} ${n(r)} 0 0 0 ${n(w)} ${n(c + r)}`);
  }
  d.push(`L${n(w)} ${n(h)}`);
  for (let i = nx - 1; i >= 0; i--) {
    const c = (i + 0.5) * px;
    d.push(`L${n(c + r)} ${n(h)} A${n(r)} ${n(r)} 0 0 0 ${n(c - r)} ${n(h)}`);
  }
  d.push(`L0 ${n(h)}`);
  for (let i = ny - 1; i >= 0; i--) {
    const c = (i + 0.5) * py;
    d.push(`L0 ${n(c + r)} A${n(r)} ${n(r)} 0 0 0 0 ${n(c - r)}`);
  }
  d.push("Z");
  return d.join(" ");
};

/**
 * A perforated postage stamp. (x, y) = centre; w x h world px of the whole stamp, border included. Real negative holes:
 * the page, or whatever is under it, shows through them. Children fill the picture window (a <PrintPhoto> or a logo).
 * `press` from stampPress(): 0 up in the air (at `from`, a world offset, full size and opaque: keep it off frame or
 * behind something), 0.7 touching, 1 flat. A short press, no bounce. `shadow` 0..1 scales the soft shadow.
 */
export const Stamp: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  rotate?: number;
  press?: number;
  from?: { x: number; y: number };
  border?: number;
  pitch?: number;
  shadow?: number;
  window?: string;
  seed?: string | number;
  children?: React.ReactNode;
}> = ({ x, y, w, h, rotate = 0, press = 1, from, border, pitch, shadow = 1, window: windowTone = "#DDD9CC", seed = "stamp", children }) => {
  const b = border ?? Math.min(w, h) * 0.055;
  const p = pitch ?? Math.min(w, h) / 13;
  const path = useMemo(() => perforationPath(w, h, p), [w, h, p]);
  const fallen = Math.min(1, Math.max(0, press) / 0.7);
  const height = 1 - fallen * fallen; // 1 up .. 0 touching: it accelerates down, like a hand putting it down
  const pressed = press > 0.7 ? Math.sin(((press - 0.7) / 0.3) * Math.PI) : 0;
  const scale = 1 + 0.13 * height - 0.012 * pressed;
  const dx = (from?.x ?? 0) * height;
  const dy = (from?.y ?? 0) * height;
  const sh = (a: number, y0: number, blur: number) => `drop-shadow(0 ${y0}px ${blur}px rgba(14,31,26,${(a * shadow).toFixed(3)}))`;
  const filter =
    shadow > 0
      ? `${sh(0.3 * (1 - 0.5 * height), 1 + 16 * height, 1.4 + 9 * height)} ${sh(0.2, 5 + 34 * height, 8 + 26 * height)}`
      : undefined;
  const tx = Math.floor(random(`${seed}-px`) * 300);
  const ty = Math.floor(random(`${seed}-py`) * 300);
  return (
    <div
      style={{
        position: "absolute",
        left: x - w / 2,
        top: y - h / 2,
        width: w,
        height: h,
        transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg) scale(${scale})`,
        filter,
      }}
    >
      <div style={{ position: "absolute", inset: 0, clipPath: `path("${path}")`, backgroundColor: STOCK }}>
        <Img
          src={staticFile("wip-anthropic/stamp_paper.jpg")}
          style={{ position: "absolute", left: -tx, top: -ty, width: 900, height: 900, maxWidth: "none" }}
        />
        <div style={{ position: "absolute", left: b, top: b, width: w - 2 * b, height: h - 2 * b, overflow: "hidden", backgroundColor: windowTone }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// -- ink ---------------------------------------------------------------------------
/**
 * Gives any child the rough rubber-stamp treatment, in spot ink: wobbling edges with ink gain, a baked density mask
 * (dry patches, pin-holes), one side of the print heavier than the other, a faint misregistered second strike, and
 * multiply. Deterministic per `seed`. Children draw with `currentColor` (fill="currentColor"), or pass a function that
 * receives the ink colour; they are drawn twice, once per strike. (x, y) = top-left in plane px, w x h = its box.
 *
 * `ink` = the colour wanted on the page. It is compensated for `theme` so it lands on that colour after multiplying
 * into the paper: use it on an `ink` WipPlane. `rough` world px of edge wobble; `wear` 0 solid .. 1 very worn;
 * `misregister` world px of the second strike (0 = none); `tile` the mask's scale; `press` from inkPress().
 */
export const InkPrint: React.FC<{
  x?: number;
  y?: number;
  w: number;
  h: number;
  ink?: string;
  theme?: WipTheme;
  seed?: string | number;
  rotate?: number;
  rough?: number;
  wear?: number;
  misregister?: number;
  tile?: number;
  press?: number;
  children: React.ReactNode | ((ink: string) => React.ReactNode);
}> = ({ x = 0, y = 0, w, h, ink = INDIGO, theme = "mint", seed = "ink", rotate = 0, rough = 2.4, wear = 0.5, misregister = 1.6, tile = 1, press = 1, children }) => {
  const id = useFilterId("ink");
  if (press <= 0) return null;
  const colour = inkOn(ink, theme);
  const pad = Math.max(12, rough * 6);
  const gain = -1.0 - (1 - press) * 1.6;
  const size = INK_TILE_SIZE * tile;
  // both strikes share one mask: where the rubber was dry it was dry for both, so the second strike shows only at the edges
  const strike = (key: string, opacity: number, dx: number, dy: number) => {
    // wear: the tile is hard edged, so coverage rises by a union of copies of it at other offsets, never by a fade
    const layers = wear < 0.34 ? 3 : wear < 0.75 ? 2 : 1;
    const url = `url(${INK_TILE})`;
    const pos = Array.from({ length: layers }, (_, i) => `${Math.floor(random(`${seed}-mx${i}`) * size)}px ${Math.floor(random(`${seed}-my${i}`) * size)}px`);
    const images = pos.map(() => url).join(", ");
    const sizes = pos.map(() => `${size}px ${size}px`).join(", ");
    const mask: React.CSSProperties = {
      maskImage: images,
      maskSize: sizes,
      maskPosition: pos.join(", "),
      maskRepeat: "repeat",
      maskComposite: "add",
      WebkitMaskImage: images,
      WebkitMaskSize: sizes,
      WebkitMaskPosition: pos.join(", "),
      WebkitMaskRepeat: "repeat",
    };
    return (
      <div key={key} style={{ position: "absolute", left: -pad + dx, top: -pad + dy, width: w + 2 * pad, height: h + 2 * pad, opacity, ...mask }}>
        <div style={{ position: "absolute", left: pad, top: pad, width: w, height: h, color: colour, filter: `url(#${id})` }}>
          {typeof children === "function" ? children(colour) : children}
        </div>
      </div>
    );
  };
  const ma = random(`${seed}-mis`) * Math.PI * 2;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        mixBlendMode: "multiply",
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={id} colorInterpolationFilters="sRGB" x="-8%" y="-8%" width="116%" height="116%">
            <feTurbulence type="fractalNoise" baseFrequency="0.085" numOctaves={3} seed={seedInt(seed, "edge")} result="edge" />
            <feDisplacementMap in="SourceGraphic" in2="edge" scale={rough * 2} xChannelSelector="R" yChannelSelector="G" result="wobble" />
            <feGaussianBlur in="wobble" stdDeviation={Math.min(0.75, 0.2 + rough * 0.25)} result="soft" />
            {/* the ink gain: re-threshold the softened edge, so corners round and thin strokes thicken like wet ink */}
            <feComponentTransfer in="soft">
              <feFuncA type="linear" slope={3.2} intercept={gain} />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      {misregister > 0 ? strike("ghost", 0.26, Math.cos(ma) * misregister, Math.sin(ma) * misregister) : null}
      {strike("main", 1, 0, 0)}
    </div>
  );
};

/** A closed ring (fill with evenodd), both edges wobbling independently, so its weight varies round the circle as a real one does. */
const ringPath = (rx: number, ry: number, weight: number, seed: string) => {
  const phase = (s: string) => random(`${seed}-${s}`) * Math.PI * 2;
  const [a1, a2, a3, b1, b2, b3] = ["a1", "a2", "a3", "b1", "b2", "b3"].map(phase);
  const u = weight * 0.14;
  const rad = (t: number, p1: number, p2: number, p3: number) => u * (Math.sin(3 * t + p1) + 0.7 * Math.sin(7 * t + p2) + 0.5 * Math.sin(13 * t + p3));
  const loop = (r0x: number, r0y: number, p1: number, p2: number, p3: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 180; i++) {
      const t = (i / 180) * Math.PI * 2;
      const off = rad(t, p1, p2, p3);
      pts.push(`${(Math.cos(t) * (r0x + off)).toFixed(2)} ${(Math.sin(t) * (r0y + off)).toFixed(2)}`);
    }
    return `M${pts.join("L")}Z`;
  };
  return `${loop(rx + weight / 2, ry + weight / 2, a1, a2, a3)} ${loop(rx - weight / 2, ry - weight / 2, b1, b2, b3)}`;
};

// The mono's advance is 0.6 em.
const MONO_ADV = 0.6;

/** One line on an ellipse's arc, letter by letter, each with a small jitter of the rubber. `at` is the arc's centre angle. */
const ArcText: React.FC<{
  text: string;
  rx: number;
  ry: number;
  size: number;
  at: number;
  span: number;
  inward: boolean;
  seed: string;
  weight: number;
}> = ({ text, rx, ry, size, at, span, inward, seed, weight }) => {
  const r = (rx + ry) / 2;
  const chars = [...text];
  const maxSize = (span * r) / (chars.length * MONO_ADV * 0.98);
  const fs = Math.min(size, maxSize);
  const track = Math.min((span * r) / chars.length, fs * MONO_ADV * 1.18);
  const dir = inward ? -1 : 1;
  return (
    <>
      {chars.map((c, i) => {
        if (c === " ") return null;
        const off = (i - (chars.length - 1) / 2) * (track / r) * dir;
        const t = at + off;
        const jr = (random(`${seed}-r-${i}`) - 0.5) * fs * 0.05;
        const ja = (random(`${seed}-a-${i}`) - 0.5) * 3.2;
        const px = Math.cos(t) * (rx + jr);
        const py = Math.sin(t) * (ry + jr);
        const deg = (t * 180) / Math.PI + (inward ? -90 : 90) + ja;
        return (
          <text
            key={i}
            transform={`translate(${px.toFixed(2)} ${py.toFixed(2)}) rotate(${deg.toFixed(2)})`}
            textAnchor="middle"
            dominantBaseline="central"
            fontFamily={MONO}
            fontWeight={500}
            fontSize={fs}
            fill="currentColor"
            stroke="currentColor"
            strokeWidth={weight}
            strokeLinejoin="round"
          >
            {c}
          </text>
        );
      })}
    </>
  );
};

const Line: React.FC<{ text: string; y: number; size: number; weight: number; tracking?: number; seed: string }> = ({ text, y, size, weight, tracking = 0, seed }) => (
  <text
    x={0}
    y={y}
    textAnchor="middle"
    dominantBaseline="central"
    fontFamily={MONO}
    fontWeight={500}
    fontSize={size}
    letterSpacing={tracking}
    fill="currentColor"
    stroke="currentColor"
    strokeWidth={weight}
    strokeLinejoin="round"
    transform={`rotate(${((random(`${seed}-tilt`) - 0.5) * 2.4).toFixed(2)})`}
  >
    {text}
  </text>
);

/** Five-pointed star, for the classic postmark's row of stars. */
const starPath = (cx: number, cy: number, r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const q = i % 2 ? r * 0.42 : r;
    pts.push(`${(cx + Math.cos(a) * q).toFixed(2)} ${(cy + Math.sin(a) * q).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
};

/**
 * A cancellation mark in spot ink, on an `ink` WipPlane. (x, y) = the ring's centre; `size` = the ring's outer diameter
 * in world px (at least about 300 to read at phone size).
 *   top / bottom  mono lettering on the ring's band, uppercase. (Leave `bottom` empty for one long `top`.)
 *   date / sub    the centre's big line and the smaller one under it. `stars` a row of stars under them (1-3).
 *   shape         "round" (double ring) | "single" (one ring, lettering inside) | "oval"
 *   bars          "none" | "wavy" (the machine cancel's waves, running off the ring's right side) | "straight"
 *   seed          fixes rotation (unless `rotate`), wobble, wear and letter jitter; two marks with different seeds differ.
 *   press         inkPress(frame, contact); `wear`, `rough`, `misregister` as InkPrint.
 */
export const Postmark: React.FC<{
  x: number;
  y: number;
  size?: number;
  ink?: string;
  theme?: WipTheme;
  seed?: string | number;
  rotate?: number;
  top?: string;
  bottom?: string;
  date?: string;
  sub?: string;
  stars?: number;
  shape?: "round" | "single" | "oval";
  bars?: "none" | "wavy" | "straight";
  wear?: number;
  rough?: number;
  misregister?: number;
  press?: number;
}> = ({ x, y, size = 420, ink = RED, theme = "mint", seed = "mark", rotate, top = "", bottom = "", date = "", sub = "", stars = 0, shape = "round", bars = "none", wear = 0.55, rough, misregister, press = 1 }) => {
  const s = String(seed);
  const oval = shape === "oval";
  const R = size / 2;
  const u = size / 420; // the type and ring weights were drawn at 420
  const rx = oval ? R : R * 0.97;
  const ry = oval ? R * 0.68 : R * 0.97;
  const ring = 10.5 * u;
  const stroke = 2.4 * u;
  const barLen = bars === "wavy" ? size * 1.15 : 0;
  const boxW = size + 40 * u + barLen;
  const boxH = size + 40 * u;
  const cx = (size + 40 * u) / 2;
  const cy = boxH / 2;
  const r = rotate ?? (random(`${s}-rot`) - 0.5) * 22;
  const double = shape === "round" || oval;
  const innerK = 0.66;
  const bandR = double ? (1 + innerK) / 2 : 0.8;
  const hasBoth = Boolean(top && bottom);
  const topSpan = hasBoth ? (double ? 2.75 : 2.4) : 4.9;
  const fs = (double ? 54 : 48) * u;
  const centreTop = !date ? 0 : sub ? -30 * u : -2 * u;
  const dateSize = (date.length <= 3 ? 96 : double ? 60 : 66) * u;
  const subSize = (double ? 42 : 46) * u;
  return (
    <InkPrint
      x={x - cx}
      y={y - cy}
      w={boxW}
      h={boxH}
      ink={ink}
      theme={theme}
      seed={s}
      rotate={r}
      wear={wear}
      rough={rough ?? 2.2 * Math.sqrt(u)}
      misregister={misregister ?? 1.4 * u}
      press={press}
    >
      <svg width={boxW} height={boxH} viewBox={`0 0 ${boxW} ${boxH}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${cx} ${cy})`}>
          <path d={ringPath(rx - ring / 2, ry - ring / 2, ring, `${s}-o`)} fill="currentColor" fillRule="evenodd" />
          {double ? <path d={ringPath(rx * innerK, ry * innerK, ring * 0.78, `${s}-i`)} fill="currentColor" fillRule="evenodd" /> : null}
          {top ? (
            <ArcText text={top} rx={rx * bandR} ry={ry * bandR} size={fs} at={-Math.PI / 2} span={topSpan} inward={false} seed={`${s}-t`} weight={stroke} />
          ) : null}
          {bottom ? (
            <ArcText text={bottom} rx={rx * bandR} ry={ry * bandR} size={fs} at={Math.PI / 2} span={hasBoth ? (double ? 2.1 : 1.9) : 4.9} inward seed={`${s}-b`} weight={stroke} />
          ) : null}
          {date ? <Line text={date} y={centreTop} size={dateSize} weight={stroke} seed={`${s}-d`} tracking={-1 * u} /> : null}
          {sub ? <Line text={sub} y={centreTop + dateSize * 0.5 + subSize * 0.72} size={subSize} weight={stroke * 0.55} seed={`${s}-e`} /> : null}
          {stars > 0
            ? Array.from({ length: stars }, (_, i) => (
                <path
                  key={i}
                  d={starPath(
                    (i - (stars - 1) / 2) * 46 * u,
                    (date ? centreTop + dateSize * 0.5 + (sub ? subSize * 1.6 : 28 * u) + 24 * u : 0) + (random(`${s}-s-${i}`) - 0.5) * 5 * u,
                    25 * u,
                  )}
                  fill="currentColor"
                />
              ))
            : null}
          {bars === "wavy"
            ? Array.from({ length: 6 }, (_, i) => {
                const yy = (i - 2.5) * 34 * u;
                const x0 = Math.sqrt(Math.max(0, 1 - (yy / ry) ** 2)) * rx + 8 * u;
                const pts: string[] = [];
                const amp = 14 * u;
                const wl = 118 * u;
                for (let px = x0; px <= rx + barLen; px += 8 * u) {
                  pts.push(`${px.toFixed(1)} ${(yy + amp * Math.sin((px / wl) * Math.PI * 2 + 0.7)).toFixed(2)}`);
                }
                return <path key={i} d={`M${pts.join("L")}`} fill="none" stroke="currentColor" strokeWidth={8 * u} strokeLinecap="butt" />;
              })
            : null}
          {bars === "straight"
            ? Array.from({ length: 5 }, (_, i) => {
                const yy = (i - 2) * 30 * u;
                const half = rx * innerK * Math.sqrt(Math.max(0, 1 - (yy / (ry * innerK)) ** 2)) - 6 * u;
                return <rect key={i} x={-half} y={yy - 7 * u} width={2 * half} height={14 * u} fill="currentColor" />;
              })
            : null}
        </g>
      </svg>
    </InkPrint>
  );
};
