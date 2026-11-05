// ---------------------------------------------------------------------------
// TraditionalTechCompanies (nik-neobanks-us, cut 24). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Transparent overlay 1080x1920, 23.976 fps, 87 frames.
//
// CHECK LINE: "At f0 the frame is pixel-identical to the Apple Park still exactly as it sits in the edit now. One
// slow push drifts into the centre of the ring. Three cream logo tiles (Google, Apple, Meta) rise up out of the
// middle of the courtyard on 'tech companies' and settle in a screen-anchored row above it, clear of the caption
// bands." The viewer can say: the traditional tech companies (Google, Apple, Meta) come out of Big Tech's own campus.
//
// THE LINE: "The traditional tech companies, they don't want to be regulated because it kills their business."
// WORD -> FRAME (Whisper, may run ~5 f early): The f0 · traditional f2 · tech f18 · companies f24 · they f33 ·
// don't f34 · want f37 · to f39 · be f42 · regulated f44 · because f50 · it f60 · kills f64 · their f70 ·
// business f74 · (next line "And" f80).
// DURATION: the slot 24.775 -> 28.403 s (sequence frames 594 -> 681) = 87 frames (f0..f86).
//
// THE PHOTO (the still as it sits in the edit): Premiere Scale 28.125 %, Position 0.5 / 0.5, so the 3840 x 2564
// photo is 1080 x 721.125 px, centred: the WINDOW y 599.4375 .. 1320.5625 at full width. Everything outside the
// window is alpha 0 (the footage keeps showing). The window never moves; the push happens inside it (the image is
// clipped to the window and always covers it, so no edge shows).
//
// THE MOTION: f0 is the exact current framing (scale S0, look point = the photo's centre). One continuous push
// (velocity ramps up over f0-3, peaks ~f6, then eases into a slow drift that never stops) carries the look point to
// the centre of the ring's inner courtyard and the zoom to Z_END x by f86. The three tiles rise straight up out
// of the lawn at the courtyard's centre line (clipped below it, a contact shadow on the lawn while they breach),
// staggered left to right, then glide up and out into a screen-anchored row and hold, lifted, while the push
// keeps drifting under them. Breach (top edge crosses the line): Google ~f10, Apple ~f16 (Google clearly rising on
// "tech" f18), Meta ~f22 ("companies" f24). All three settled by f47 ("because" f50).
// Cause before effect: each tile is moving (below the lawn) from its start frame; the first visible frame is its top
// edge at the line, the contact shadow on the lawn under it on the same frame.
// AMBER = the neobank in this clip; none here (tech companies are cream tiles, ink marks).
//
// SOURCES:
//   Photo: the clip's still 24.8b_TraditionalTech_AppleParkAerial.jpg (images/ in the clip folder), copied to
//          public/nik-neobanks-us/apple-park-aerial.jpg (sRGB ICC). Courtyard centre measured on the 3840 x 2564
//          original (full-res crops of the four inner edges): inner roof edge x 835 .. 3010, visible lawn y 1010 (foot
//          of the far inner facade) .. 1698 (the near roof's inner edge) -> centre (1922, 1352) = (0.500, 0.527).
//   Logos (24-unit paths, inlined): Google public/logos/google.svg (Simple Icons); Apple public/logos/apple.svg
//          (Simple Icons); Meta public/logos/meta.svg (lobehub, evenodd). Ink boxes, fills and centroids measured
//          with resvg at 960 px (scratch measure.mjs).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, clamp01, lerp, opticalFit, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow, restToRest } from "../kits/cheeky-pint/museShared";

export const FPS = 24000 / 1001;
export const DURATION = 87;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE PHOTO WINDOW (screen px) and the push
// ---------------------------------------------------------------------------
const PHOTO = { src: "nik-neobanks-us/apple-park-aerial.jpg", w: 3840, h: 2564 } as const;
/**
 * The f0 bake (scripts/clips/nik-neobanks-us/bake-apple-park-f0.py): screen rows 599 .. 1320 of the still exactly as
 * the edit places it (Lanczos at the sub-pixel placement, edge rows as coverage alpha). Chrome's own downscale of the
 * 3840 photo is a touch softer than that, so f0 shows the bake alone (pixel-identical to the still in the edit); from
 * f1 the live photo sits under it and the bake, carried by the same camera, dissolves off by BAKE_OUT.
 */
const BAKE = { src: "nik-neobanks-us/apple-park-f0.png", top: 599 } as const;
const BAKE_OUT = 8;
/** Premiere's Scale 28.125 % */
const S0 = 0.28125;
const WIN = { top: 960 - (PHOTO.h * S0) / 2, bottom: 960 + (PHOTO.h * S0) / 2 }; // 599.4375 .. 1320.5625
/** The centre of the ring's inner courtyard (photo px; see SOURCES). */
const COURT = { x: 1922, y: 1352 } as const;
const Z_END = 1.5;

/**
 * The push's progress 0..1 (f0 -> f86): v(f) = (1 - e^(-f/1.5)) (e^(-f/12) + 0.08), integrated at load. Most of the
 * zoom lands early (z 1.15 at f10, 1.22 at f16, 1.27 at f22) so the courtyard is wide enough for the three tiles to
 * break the lawn side by side; then a slow drift (end speed ~11 % of the peak) that never stops.
 */
const PUSH = (() => {
  const steps = 40;
  const v = (f: number) => (1 - Math.exp(-f / 1.5)) * (Math.exp(-f / 12) + 0.08);
  const acc: number[] = [0];
  let sum = 0;
  for (let i = 1; i <= (DURATION - 1) * steps; i++) {
    sum += v((i - 0.5) / steps) / steps;
    acc.push(sum);
  }
  return (f: number) => {
    const x = Math.max(0, Math.min(DURATION - 1, f)) * steps;
    const i = Math.floor(x);
    const j = Math.min(acc.length - 1, i + 1);
    return lerp(acc[i], acc[j], x - i) / sum;
  };
})();
/** The camera on the photo at frame f: scale (photo px -> screen px) and the photo point at the window centre. */
const camAt = (f: number) => {
  const u = PUSH(f);
  const s = S0 * Math.exp(Math.log(Z_END) * u);
  const lx = lerp(PHOTO.w / 2, COURT.x, u);
  const ly = lerp(PHOTO.h / 2, COURT.y, u);
  return { s, lx, ly, tx: 540 - lx * s, ty: 960 - ly * s };
};

// ---------------------------------------------------------------------------
// THE TILES (screen px): cream card, ink stamp, the house lifted shadow
// ---------------------------------------------------------------------------
const T = 204;
const RADIUS = 0.16 * T;
const ROW = { top: 728, xs: [296, 540, 784] } as const; // 40 px gaps, row centre y 830
/** Where each tile breaks the lawn (its centre x): side by side about the courtyard centre, 10 px apart. */
const BREACH_X = [326, 540, 754] as const;
/** Each tile's move: from START_F[i] for RISE_F frames. It starts hidden (top below the lawn line). */
const START_F = [7, 13, 19] as const; // first visible (top edge above the line): f10, f16, f22 (measured on the render)
const RISE_F = 28;
const START_TOP = 1000; // below the lawn line at every frame (the line runs 979 -> 960)
/** The mark's optical box, as a share of the tile, before the family rule (opticalFit). */
const MARK_K = 0.84;
/** The crease where a card breaks the lawn (screen px; rx as a share of T): the house contact shadow made legible. */
const BREAK = { a: 0.78, rx: 0.56, ry: 10, dx: 3, dy: 4, blur: 5 } as const;

type Mark = { d: string; box: [number, number, number, number]; fill: number; cy: number; rule: "nonzero" | "evenodd" };
const MARKS: Mark[] = [
  {
    // Google — public/logos/google.svg (Simple Icons)
    d: "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z",
    box: [0.3, 0, 23.4, 24],
    fill: 0.389,
    cy: 0.023,
    rule: "nonzero",
  },
  {
    // Apple — public/logos/apple.svg (Simple Icons)
    d: "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701",
    box: [2.23, 0, 19.55, 24],
    fill: 0.634,
    cy: 0.097,
    rule: "nonzero",
  },
  {
    // Meta — public/logos/meta.svg (lobehub)
    d: "M6.897 4c1.915 0 3.516.932 5.43 3.376l.282-.373c.19-.246.383-.484.58-.71l.313-.35C14.588 4.788 15.792 4 17.225 4c1.273 0 2.469.557 3.491 1.516l.218.213c1.73 1.765 2.917 4.71 3.053 8.026l.011.392.002.25c0 1.501-.28 2.759-.818 3.7l-.14.23-.108.153c-.301.42-.664.758-1.086 1.009l-.265.142-.087.04a3.493 3.493 0 01-.302.118 4.117 4.117 0 01-1.33.208c-.524 0-.996-.067-1.438-.215-.614-.204-1.163-.56-1.726-1.116l-.227-.235c-.753-.812-1.534-1.976-2.493-3.586l-1.43-2.41-.544-.895-1.766 3.13-.343.592C7.597 19.156 6.227 20 4.356 20c-1.21 0-2.205-.42-2.936-1.182l-.168-.184c-.484-.573-.837-1.311-1.043-2.189l-.067-.32a8.69 8.69 0 01-.136-1.288L0 14.468c.002-.745.06-1.49.174-2.23l.1-.573c.298-1.53.828-2.958 1.536-4.157l.209-.34c1.177-1.83 2.789-3.053 4.615-3.16L6.897 4zm-.033 2.615l-.201.01c-.83.083-1.606.673-2.252 1.577l-.138.199-.01.018c-.67 1.017-1.185 2.378-1.456 3.845l-.004.022a12.591 12.591 0 00-.207 2.254l.002.188c.004.18.017.36.04.54l.043.291c.092.503.257.908.486 1.208l.117.137c.303.323.698.492 1.17.492 1.1 0 1.796-.676 3.696-3.641l2.175-3.4.454-.701-.139-.198C9.11 7.3 8.084 6.616 6.864 6.616zm10.196-.552l-.176.007c-.635.048-1.223.359-1.82.933l-.196.198c-.439.462-.887 1.064-1.367 1.807l.266.398c.18.274.362.56.55.858l.293.475 1.396 2.335.695 1.114c.583.926 1.03 1.6 1.408 2.082l.213.262c.282.326.529.54.777.673l.102.05c.227.1.457.138.718.138.176.002.35-.023.518-.073.338-.104.61-.32.813-.637l.095-.163.077-.162c.194-.459.29-1.06.29-1.785l-.006-.449c-.08-2.871-.938-5.372-2.2-6.798l-.176-.189c-.67-.683-1.444-1.074-2.27-1.074z",
    box: [0, 4, 24, 16],
    fill: 0.452,
    cy: 0.001,
    rule: "evenodd",
  },
];

const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();

/** A tile's pose at frame f: its top-left (screen), lift 0..1 (rest in the lawn -> lifted in the row). */
const tileAt = (i: number, f: number) => {
  const t = clamp01((f - START_F[i]) / RISE_F);
  const p = 1 - Math.pow(1 - t, 2.2); // breaks the lawn at speed, decelerates into the row
  const top = lerp(START_TOP, ROW.top, p);
  const g = restToRest((t - 0.6) / 0.4); // the glide out to the slot starts once it is clear of the lawn
  const cx = lerp(BREACH_X[i], ROW.xs[i], g);
  const lift = smoothstep((t - 0.45) / 0.4);
  return { x: cx - T / 2, top, cx, lift, t };
};

const MarkFigure: React.FC<{ m: Mark; x: number; y: number }> = ({ m, x, y }) => {
  const [bx, by, bw, bh] = m.box;
  const box = T * MARK_K;
  const fit = opticalFit(bw, bh, m.fill, m.cy, box);
  const cx = x + T / 2;
  const cy = y + T / 2 + (fit.cy - box / 2);
  const tx = cx - (bx + bw / 2) * fit.sc;
  const ty = cy - (by + bh / 2) * fit.sc;
  return (
    <g transform={`translate(${fx(tx)} ${fx(ty)}) scale(${fx(fit.sc)})`} fill={COLOR.inkDark}>
      <path d={m.d} fillRule={m.rule} />
    </g>
  );
};

const TraditionalTechCompanies: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  /** the lawn line: the courtyard centre's screen y this frame */
  const line = 960 + (COURT.y - cam.ly) * cam.s;
  const tiles = [0, 1, 2].map((i) => ({ i, ...tileAt(i, f) })).filter((q) => q.top < line);
  const s = T / 96; // the house elevation recipe is written for 96-px tiles
  // the bake rides the camera: f0 screen point p0 -> p = bk * p0 + (bx, by)
  const bk = cam.s / S0;
  const bx = 540 + (PHOTO.w / 2 - cam.lx) * cam.s - 540 * bk;
  const by = 960 + (PHOTO.h / 2 - cam.ly) * cam.s - 960 * bk;
  const bakeA = 1 - smoothstep(f / BAKE_OUT);

  return (
    <AbsoluteFill>
      {/* the photo, clipped to its window (from f1; f0 is the bake alone) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1080,
          height: 1920,
          overflow: "hidden",
          clipPath: `inset(${fx(WIN.top)}px 0px ${fx(1920 - WIN.bottom)}px 0px)`,
          opacity: f < 1 ? 0 : 1,
        }}
      >
        <Img
          src={staticFile(PHOTO.src)}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: PHOTO.w,
            height: PHOTO.h,
            transformOrigin: "0 0",
            transform: `translate(${fx(cam.tx)}px, ${fx(cam.ty)}px) scale(${fx(cam.s)})`,
          }}
        />
      </div>
      {/* the f0 bake, carried by the same camera (relative to f0), dissolving off over the first frames of the push */}
      {bakeA > 0 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 1080,
            height: 1920,
            transformOrigin: "0 0",
            transform: `matrix(${fx(bk)}, 0, 0, ${fx(bk)}, ${fx(bx)}, ${fx(by)})`,
            opacity: bakeA,
          }}
        >
          <Img src={staticFile(BAKE.src)} style={{ position: "absolute", left: 0, top: BAKE.top, width: 1080, height: 722 }} />
        </div>
      ) : null}
      <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="ttcAboveLawn">
            <rect x={0} y={0} width={1080} height={fx(line)} />
          </clipPath>
          <linearGradient id="ttcCard" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLOR.cream} />
            <stop offset="1" stopColor={COLOR.creamFoot} />
          </linearGradient>
          <linearGradient id="ttcAO" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
            <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO * 2} />
          </linearGradient>
        </defs>
        {/* shadows first: each tile's one shadow from its visible (above-lawn) silhouette */}
        {tiles.map((q) => {
          return (
            <UnionShadow
              key={`s${q.i}`}
              sil={[{ d: rectPath(q.x, q.top, T, T, RADIUS), clip: { x: q.x - 40, y: q.top - 40, w: T + 80, h: Math.max(0, line - q.top + 40) } }]}
              s={s}
              elevation="rest"
              lift={q.lift}
              contact={null}
            />
          );
        })}
        {/* where a card breaks the lawn: a soft dark crease on the lawn along its foot (the house contact shadow,
            stronger and wider so it reads on the busy aerial), gone once the foot is clear */}
        {tiles.map((q) => {
          const clear = clamp01((line - (q.top + T)) / 14);
          const a = BREAK.a * (1 - clear) * smoothstep((line - q.top) / 10);
          return a > 0.002 ? (
            <ellipse
              key={`c${q.i}`}
              cx={fx(q.cx + BREAK.dx)}
              cy={fx(line + BREAK.dy)}
              rx={fx(BREAK.rx * T)}
              ry={BREAK.ry}
              fill={COLOR.shadow}
              opacity={fx(a)}
              style={{ filter: `blur(${BREAK.blur}px)` }}
            />
          ) : null;
        })}
        {/* the cards, cut off at the lawn line */}
        <g clipPath="url(#ttcAboveLawn)">
          {tiles.map((q) => {
            const ao = Math.max(0, Math.min(EDGE.FOOT_AO * 2.4, q.top + T - line + EDGE.FOOT_AO * 2.4));
            return (
              <g key={`t${q.i}`}>
                <path d={rectPath(q.x, q.top, T, T, RADIUS)} fill="url(#ttcCard)" />
                <path d={`M${fx(q.x + RADIUS)} ${fx(q.top + EDGE.CREAM / 2)}H${fx(q.x + T - RADIUS)}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={EDGE.CREAM} />
                <MarkFigure m={MARKS[q.i]} x={q.x} y={q.top} />
                {q.top + T > line - EDGE.FOOT_AO * 2.4 ? <rect x={fx(q.x)} y={fx(line - ao)} width={T} height={fx(ao)} fill="url(#ttcAO)" /> : null}
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default TraditionalTechCompanies;
