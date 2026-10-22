// ---------------------------------------------------------------------------
// pandemicFolkPaint — the PAINT of the drawn cast (kyle-pandemics V3, take 2, style A "gouache"): renders a list of
// flat shapes the way the approved style frames do (pandemicFolkSketch FolkFigure), with the extras the moving cast
// needs, and bakes crowds into sprites with the gouache filter baked in.
//   Shape         { d (path, figure units), fill (#hex), sh (crescent shadow x, 0 none), op, cast (soft blurred shadow
//                 shape), det (a stroke-only line, px at an 860 px figure; `keep` = in its own colour), clip (a path d:
//                 the shape is clipped to it, e.g. eyes to the head), see (belongs to the see-through body block) }
//   <FolkPaint shapes x y scale uid see? inside? edge? />   one figure in a full-frame <svg> (screen px). Shapes are
//                 painted back to front: one soft crescent shadow per shape from the upper-left light (a darker local
//                 colour), then the gouache texture over the whole figure (fine grain, a short multidirectional
//                 dry-brush mottling, a few pale specks, hand-wobbly edges), all in screen px.
//                 see 0..1 = SEE-THROUGH: the `see` block (contiguous) is composited as one layer at (1 - 0.65 see)
//                 opacity, `inside` (SVG in figure units, e.g. glass lungs and the orange disease) is drawn over it, and
//                 the block's outer edge is kept at full strength as a soft band (`edge` px) in its own colours;
//                 `inside` fades in with `see` (full by 0.6) unless insideOpacity is given.
//   folkTexDefs(uid, px)   the texture filter on its own (px = size factor, 1 at an 860 px figure)
// SPRITES (crowds of hundreds: the filter is baked once per sprite, never run per figure per frame)
//   useFolkSprites(reqs)   bake every requested sprite once per render tab (async: delayRender until ready) and
//                 return a lookup; req = { key, shapes, hPx (figure height px), hUnits (the figure's height in units),
//                 wUnits? (half width) }. Cached by key at module level.
//   blitFolk(ctx, sprite, x, y, hPx, { alpha, rot (deg, about the pivot), pivot ([px, py] in figure units, default
//                 the feet), sx, sy })   draw a sprite with its feet at (x, y)
//   <FolkCanvas draw width height />   a full-frame canvas layer whose draw(ctx) runs every frame
// ---------------------------------------------------------------------------
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";
// @ts-expect-error react-dom ships no types for its server entry here (nothing may be installed); typed below
import * as ReactDomServer from "react-dom/server";

const renderToStaticMarkup = (ReactDomServer as { renderToStaticMarkup: (el: React.ReactElement) => string }).renderToStaticMarkup;

export type Shape = {
  d: string;
  fill: string;
  sh?: number;
  op?: number;
  cast?: boolean;
  det?: number;
  keep?: boolean;
  clip?: string;
  see?: boolean;
  /** an SVG transform for this shape (figure units), e.g. a tilt about the hip */
  tf?: string;
};

// ---- colour ------------------------------------------------------------------------------------------------------
const hx = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const toHex = (c: number[]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
export const mixC = (a: string, b: string, t: number) => {
  const A = hx(a);
  const B = hx(b);
  return toHex(A.map((v, i) => v + (B[i] - v) * Math.max(0, Math.min(1, t))));
};
/** the style's paint constants (A, gouache; the approved style frames) */
export const PAINT = {
  shadeOff: 7,
  shadeBlur: 3.2,
  shadeAmt: 0.3,
  shadeTo: "#2C3433",
  grain: 0.11,
  blotch: 0.06,
  wobble: 3,
  speck: 0.16,
  speckColor: "#F6EEDC",
};
export const shadeOf = (c: string) => mixC(c, PAINT.shadeTo, PAINT.shadeAmt);
const sst = (a: number, b: number, v: number) => {
  const u = Math.max(0, Math.min(1, (v - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ---- the texture filter (screen px) --------------------------------------------------------------------------------
const GREY = "0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1";
export const folkTexDefs = (uid: string, px: number, unitPx = 1) => {
  const k = Math.max(0.2, Math.min(1.4, px));
  // the filter runs in the user units of the svg it lives in: frequencies x unitPx, displacement / unitPx keep the
  // texture in screen px under a zoom (WorldSvg: unitPx = cam.k)
  const u = unitPx;
  const f = (v: number) => (v * u).toFixed(5);
  const wob = (PAINT.wobble * k) / u;
  const g = PAINT.grain;
  const b = PAINT.blotch;
  return (
    <filter id={`${uid}tx`} x="-8%" y="-8%" width="116%" height="116%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={f(0.02 / Math.max(0.45, k))} numOctaves={2} seed={11} result="wn" />
      <feDisplacementMap in="SourceGraphic" in2="wn" scale={wob.toFixed(4)} xChannelSelector="R" yChannelSelector="G" result="wb" />
      <feTurbulence type="fractalNoise" baseFrequency={f(0.9)} numOctaves={2} seed={5} result="gn" />
      <feColorMatrix in="gn" type="matrix" values={GREY} result="gg" />
      <feTurbulence type="fractalNoise" baseFrequency={f(0.11 / Math.max(0.6, k))} numOctaves={3} seed={23} result="bn" />
      <feColorMatrix in="bn" type="matrix" values={GREY} result="bb" />
      <feComposite in="wb" in2="gg" operator="arithmetic" k1={(2 * g).toFixed(3)} k2={(1 - g).toFixed(3)} k3="0" k4="0" result="t1" />
      <feComposite in="t1" in2="bb" operator="arithmetic" k1={(2 * b).toFixed(3)} k2={(1 - b).toFixed(3)} k3="0" k4="0" result="t2" />
      <feTurbulence type="fractalNoise" baseFrequency={f(0.5)} numOctaves={1} seed={41} result="pn" />
      <feComponentTransfer in="pn" result="pk">
        <feFuncA type="discrete" tableValues={`0 0 0 0 0 0 0 0 0 0 0 0 0 ${PAINT.speck.toFixed(2)}`} />
      </feComponentTransfer>
      <feFlood floodColor={PAINT.speckColor} result="pc" />
      <feComposite in="pc" in2="pk" operator="in" result="pp" />
      <feMerge result="t3">
        <feMergeNode in="t2" />
        <feMergeNode in="pp" />
      </feMerge>
      <feComposite in="t3" in2="wb" operator="in" />
    </filter>
  );
};

// ---- one shape ---------------------------------------------------------------------------------------------------
type ShadeFn = (c: string) => string;
const ShapeEl: React.FC<{ s: Shape; i: number; uid: string; px: number; shade?: ShadeFn }> = ({ s, i, uid, px, shade = shadeOf }) => {
  const clipId = s.clip ? `${uid}c${i}` : undefined;
  const clipDef = s.clip ? (
    <clipPath id={clipId}>
      <path d={s.clip} />
    </clipPath>
  ) : null;
  const wrap = (el: React.ReactNode) =>
    clipId ? (
      <g key={i} transform={s.tf}>
        {clipDef}
        <g clipPath={`url(#${clipId})`}>{el}</g>
      </g>
    ) : (
      <g key={i} transform={s.tf}>
        {el}
      </g>
    );
  if ((s.op ?? 1) <= 0.002) return null;
  if (s.det !== undefined) {
    return wrap(
      <path
        d={s.d}
        fill="none"
        stroke={s.keep ? s.fill : mixC(s.fill, "#1E1611", 0.32)}
        strokeWidth={(s.det * Math.max(0.45, Math.min(1.3, px))).toFixed(2)}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={s.op ?? 0.55}
      />,
    );
  }
  if (s.cast) return wrap(<path d={s.d} fill={shade(s.fill)} opacity={s.op ?? 0.8} filter={`url(#${uid}cu)`} />);
  const sh = s.sh ?? 1;
  const mid = `${uid}m${i}`;
  return wrap(
    <>
      <path d={s.d} fill={s.fill} opacity={s.op ?? 1} />
      {sh > 0 ? (
        <>
          <mask id={mid} maskUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000">
            <path d={s.d} fill="#fff" />
            <path d={s.d} fill="#000" transform={`translate(${n3(-PAINT.shadeOff * sh)} ${n3(-PAINT.shadeOff * sh * 1.05)})`} filter={`url(#${uid}su)`} />
          </mask>
          <rect x={-3000} y={-3000} width={6000} height={6000} mask={`url(#${mid})`} fill={shade(s.fill)} opacity={s.op ?? 1} />
        </>
      ) : null}
    </>,
  );
};

/** one figure: shapes in figure units, feet at screen (x, y), `scale` px per unit */
export const FolkPaint: React.FC<{
  shapes: Shape[];
  x: number;
  y: number;
  scale: number;
  uid: string;
  /** px size factor for the texture (default from scale with a 512-unit man) */
  px?: number;
  opacity?: number;
  see?: number;
  inside?: React.ReactNode;
  /** see-through edge band, px */
  edge?: number;
  texture?: boolean;
  /** screen px per user unit of the svg this lives in (WorldSvg: cam.k), so texture, shadow softness and the
   *  see-through edge stay in screen px */
  unitPx?: number;
  /** the crescent shadow's strength and colour (default PAINT: 0.3 toward a deep teal); night scenes go darker */
  shade?: { amt: number; to: string };
  /** the inside content's opacity (default: rises with `see`, full by see 0.6) */
  insideOpacity?: number;
}> = ({ shapes, x, y, scale, uid, px, opacity = 1, see = 0, inside, edge = 7, texture = true, insideOpacity, unitPx = 1, shade }) => {
  const shadeFn: ShadeFn | undefined = shade ? (c) => mixC(c, shade.to, shade.amt) : undefined;
  const pxf = px ?? (scale * unitPx * 512) / 860;
  const blurU = PAINT.shadeBlur / (scale * unitPx);
  // the see-through block: the contiguous run of `see` shapes
  const s0 = shapes.findIndex((s) => s.see);
  let s1 = s0;
  if (s0 >= 0) while (s1 + 1 < shapes.length && shapes[s1 + 1].see) s1++;
  const pre = s0 >= 0 ? shapes.slice(0, s0) : shapes;
  const block = s0 >= 0 ? shapes.slice(s0, s1 + 1) : [];
  const post = s0 >= 0 ? shapes.slice(s1 + 1) : [];
  const el = (arr: Shape[], off: number) => arr.map((s, i) => <ShapeEl key={off + i} s={s} i={off + i} uid={uid} px={pxf} shade={shadeFn} />);
  const seeOn = see > 0.001 && block.length > 0;
  const erodeU = edge / (scale * unitPx);
  return (
    <g opacity={opacity}>
      <defs>
        {texture ? folkTexDefs(uid, pxf, unitPx) : null}
        <filter id={`${uid}su`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU).toFixed(3)} />
        </filter>
        <filter id={`${uid}cu`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU * 2.2).toFixed(3)} />
        </filter>
        {seeOn ? (
          <filter id={`${uid}ed`} x="-10%" y="-10%" width="120%" height="120%">
            <feMorphology in="SourceAlpha" operator="erode" radius={n3(erodeU)} result="er" />
            <feGaussianBlur in="er" stdDeviation={n3(erodeU * 0.45)} result="erb" />
            <feComposite in="SourceGraphic" in2="erb" operator="out" />
          </filter>
        ) : null}
      </defs>
      <g filter={texture ? `url(#${uid}tx)` : undefined}>
        <g transform={`translate(${n3(x)} ${n3(y)}) scale(${n3(scale)})`}>
          {el(pre, 0)}
          {block.length ? (
            seeOn ? (
              <>
                <g opacity={n3(1 - 0.65 * Math.min(1, see))}>{el(block, s0)}</g>
                <g opacity={n3(insideOpacity ?? sst(0, 0.6, see))}>{inside}</g>
                <g filter={`url(#${uid}ed)`} opacity={n3(Math.min(1, see))}>
                  {el(block, s0 + 10000)}
                </g>
              </>
            ) : (
              el(block, s0)
            )
          ) : null}
          {el(post, s1 + 1)}
        </g>
      </g>
    </g>
  );
};

// ===================================================================================================================
// SPRITES
// ===================================================================================================================
export type SpriteReq = { key: string; shapes: Shape[]; hPx: number; hUnits: number; wUnits?: number };
export type Sprite = { c: HTMLCanvasElement; ax: number; ay: number; px: number; unitsPerPx: number };
const SPRITES = new Map<string, Sprite>();
const PENDING = new Map<string, Promise<Sprite>>();

const bake = (r: SpriteReq): Promise<Sprite> => {
  const hit = SPRITES.get(r.key);
  if (hit) return Promise.resolve(hit);
  const pend = PENDING.get(r.key);
  if (pend) return pend;
  const scale = r.hPx / r.hUnits;
  const halfW = (r.wUnits ?? r.hUnits * 0.36) * scale;
  const pad = Math.ceil(10 + r.hPx * 0.04);
  const W = Math.ceil(halfW * 2 + pad * 2);
  const H = Math.ceil(r.hPx * 1.06 + pad * 2);
  const ax = W / 2;
  const ay = H - pad;
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <FolkPaint shapes={r.shapes} x={ax} y={ay} scale={scale} uid={`sp${Math.abs(hashStr(r.key))}`} />
    </svg>,
  );
  const p = new Promise<Sprite>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d") as CanvasRenderingContext2D;
      ctx.drawImage(img, 0, 0);
      const sp: Sprite = { c, ax, ay, px: r.hPx, unitsPerPx: 1 / scale };
      SPRITES.set(r.key, sp);
      PENDING.delete(r.key);
      resolve(sp);
    };
    img.onerror = (e) => reject(e);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  PENDING.set(r.key, p);
  return p;
};
const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
};

/** bake the requested sprites (once per render tab) and return a lookup by key; `reqs` must be stable (memoise it) */
export const useFolkSprites = (reqs: SpriteReq[]) => {
  const allReady = reqs.every((r) => SPRITES.has(r.key));
  const [handle] = useState(() => (allReady ? null : delayRender("baking folk sprites", { timeoutInMilliseconds: 120000 })));
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    if (handle === null) return;
    let alive = true;
    Promise.all(reqs.map(bake)).then(
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

/** draw a sprite with its feet at (x, y), hPx tall; rot (deg) about `pivot` (figure units from the feet) */
export const blitFolk = (
  ctx: CanvasRenderingContext2D,
  sp: Sprite | undefined,
  x: number,
  y: number,
  hPx: number,
  o: { alpha?: number; rot?: number; pivot?: [number, number]; sx?: number; sy?: number } = {},
) => {
  if (!sp) return;
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const f = hPx / sp.px;
  const pu = sp.unitsPerPx; // figure units per sprite px
  const piv = o.pivot ?? [0, 0];
  const ppx = (piv[0] / pu) * f;
  const ppy = (piv[1] / pu) * f;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x + ppx, y + ppy);
  if (o.rot) ctx.rotate((o.rot * Math.PI) / 180);
  ctx.scale(o.sx ?? 1, o.sy ?? 1);
  ctx.translate(-ppx, -ppy);
  ctx.drawImage(sp.c, -sp.ax * f, -sp.ay * f, sp.c.width * f, sp.c.height * f);
  ctx.restore();
};

/** a full-frame canvas whose draw(ctx) runs every frame */
export const FolkCanvas: React.FC<{ draw: (ctx: CanvasRenderingContext2D) => void; width?: number; height?: number }> = ({ draw, width = 1080, height = 1920 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    draw(ctx);
    ctx.globalAlpha = 1;
  });
  return <canvas ref={ref} width={width} height={height} style={{ position: "absolute", left: 0, top: 0, width, height }} />;
};
