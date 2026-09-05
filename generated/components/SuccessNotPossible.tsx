import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";
import { LAND, clamp01, hash, sgnPick } from "./cheekyPintSystem";

export const FPS = 24;
// 00:00:32,159 -> 00:00:37,320 of the source cut. round(5.161 * 24) = 124.
export const DURATION = 124;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const GLIDE = Easing.inOut(Easing.cubic);
const RISE = Easing.out(Easing.cubic);
const rad = (d: number) => (d * Math.PI) / 180;

// ---------------------------------------------------------------------------
// The supplied glyph
//
// success.png is one solid 512x512 mark: a figure with its arms up, a star
// above its head, and two celebration strokes flanking it. It is never
// redrawn or traced — it is drawn six times over, each copy clipped to a
// different part of itself, so every piece that moves is the artwork.
//
// Nothing is ever scaled. A solid mark scaled to 0.4 has strokes at 0.4 of
// their weight, which is the one thing that gives away that the pieces are
// not the same object as the figure. Everything animates by position,
// rotation and opacity only, and the whole piece stays one weight throughout.
//
// The three regions are disjoint, which is why each clip stays a simple
// shape: measured off the file, the body is everything below y 170, the
// strokes live outside x 158 and x 350 in the top band, and the star fits
// inside a disc of radius 94 about (253.5, 77) that clears both strokes.
// ---------------------------------------------------------------------------
const SRC = 512;
const ICON_W = 620;
const S = ICON_W / SRC;
const ICON_X = 233;
const ICON_Y = 590;

const STAR_CX = 253.5 * S;
const STAR_CY = 77 * S;
const STAR_R = 94 * S;
const BODY_TOP = 170 * S;

// ---------------------------------------------------------------------------
// The break
//
// Three pieces, not seven: a star that comes apart in three is read in one
// glance, and seven spikes leaving at once is just debris.
//
// The angles are deliberately unequal, so three wedges off one centre read as
// a break rather than as a pie chart. Each piece turns about its own ink
// centroid — turning them all about the star's centre swings them like hands
// on a clock and they climb over each other. And each wedge is widened by a
// hair at both ends so neighbours overlap instead of abutting: two clips that
// merely touch each leave a half-covered pixel along the join, and the star
// wears its own fracture lines for the whole minute before it breaks.
// ---------------------------------------------------------------------------
const CUTS = [-108, 12, 155];
const BLEED = 1.1;

const PIECES = CUTS.map((a0, i) => {
  const a1 = CUTS[(i + 1) % 3] + (i === 2 ? 360 : 0);
  const mid = (a0 + a1) / 2;
  const on = (deg: number) => ({
    x: STAR_CX + STAR_R * Math.cos(rad(deg)),
    y: STAR_CY + STAR_R * Math.sin(rad(deg)),
  });
  const p0 = on(a0 - BLEED);
  const p1 = on(a1 + BLEED);
  const large = a1 - a0 + 2 * BLEED > 180 ? 1 : 0;
  // The angular bleed goes to nothing at the apex, where all three clips
  // converge on one point and leave a tri-radiate mark. So each wedge starts
  // a little past the centre, on the far side of it, and the three of them
  // overlap across a small disc there instead of meeting at a point.
  const ax = STAR_CX - 7 * Math.cos(rad(mid));
  const ay = STAR_CY - 7 * Math.sin(rad(mid));
  return {
    // Bounded by the star's own disc, which is what keeps the wedge off the
    // strokes and the body without any of the clips having to subtract.
    clip: `path('M ${ax.toFixed(2)} ${ay.toFixed(2)} L ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${STAR_R.toFixed(2)} ${STAR_R.toFixed(2)} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)} Z')`,
    // Its own ink sits about half the star's radius out along the bisector.
    ox: STAR_CX + 52 * Math.cos(rad(mid)),
    oy: STAR_CY + 52 * Math.sin(rad(mid)),
    dx: Math.cos(rad(mid)),
    dy: Math.sin(rad(mid)),
    sep: 22 + hash(i * 7 + 3) * 20,
    rot: sgnPick(i * 11 + 4) * (9 + hash(i * 13 + 5) * 13),
    // Unequal masses fall at visibly different rates, which is what stops the
    // three of them dropping as one object.
    heavy: 0.82 + hash(i * 17 + 6) * 0.36,
  };
});

const hex = (h: string) => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  icon: z.string(),
  // Full weight, not 0.9: the pieces fall behind the body, and a body at less
  // than full opacity lets them show through it as they go past.
  figureOpacity: z.number().min(0).max(1),
  gravity: z.number().min(0.2).max(6),
  beats: z.object({
    // Beat frames lifted from the SRT at 24fps, f0 = 00:00:32,159.
    //   f0 like i'll take   f21 drastic action   f39 only when i
    //   f57 conclude that   f71 success is       f87 not in a set of
    //   f100 possible       f108 outcomes (ends f124)
    rays: z.number().int(),
    conclude: z.number().int(),
    success: z.number().int(),
    notIn: z.number().int(),
  }),
});

export type SuccessNotPossibleProps = z.infer<typeof schema>;

export const defaultProps: SuccessNotPossibleProps = schema.parse({
  ink: "#FFFFFF",
  accent: "#FFC543",
  shadow: "rgba(0,0,0,0.28)",
  icon: "success.png",
  figureOpacity: 1,
  gravity: 2.1,
  beats: { rays: 4, conclude: 39, success: 71, notIn: 86 },
});

const SEP_F = 11;
const FALL_AT = 4;

export const SuccessNotPossible: React.FC<SuccessNotPossibleProps> = ({
  ink,
  accent,
  shadow,
  icon,
  figureOpacity,
  gravity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const src = staticFile(icon);
  const [ir, ig, ib] = hex(ink);
  const [ar, ag, ab] = hex(accent);

  // The strokes slide out from behind the star and slide back into it — they
  // are never scaled, so their weight never drifts from the figure's. They are
  // drawn under the star, so it occludes them on the way in and out.
  const rayIn = (k: number) =>
    interpolate(frame, [beats.rays + k * 4, beats.rays + 18 + k * 4], [0, 1], {
      ...CLAMP,
      easing: RISE,
    });
  const rayOut = interpolate(frame, [beats.conclude, beats.conclude + 25], [1, 0], {
    ...CLAMP,
    easing: GLIDE,
  });

  // He breathes while he is still holding something and goes completely still
  // the moment the star goes. Rotation only — a scale pulse would breathe the
  // stroke weight along with it.
  const swayAmt =
    interpolate(frame, [0, 14], [0.4, 1], { ...CLAMP, easing: GLIDE }) *
    interpolate(frame, [beats.notIn - 10, beats.notIn + 2], [1, 0], { ...CLAMP, easing: GLIDE });
  const sway = Math.sin(frame / 26) * 0.9 * swayAmt;

  const toAccent = interpolate(frame, [beats.success, beats.success + 9], [0, 1], {
    ...CLAMP,
    easing: GLIDE,
  });
  const lift = interpolate(frame, [beats.success, beats.success + 13], [0, -7], {
    ...CLAMP,
    easing: LAND,
  });

  const broken = clamp01((frame - beats.notIn) / SEP_F);
  const fallT = Math.max(0, frame - (beats.notIn + FALL_AT));
  const hue = toAccent * (1 - clamp01((frame - beats.notIn) / 14));
  const starO =
    figureOpacity *
    interpolate(frame, [beats.notIn + 8, beats.notIn + 24], [1, 0], { ...CLAMP, easing: GLIDE });

  const r = ir + (ar - ir) * hue;
  const g = ig + (ag - ig) * hue;
  const b = ib + (ab - ib) * hue;

  const sepE = interpolate(broken, [0, 1], [0, 1], { ...CLAMP, easing: RISE });

  const piece = (
    key: string,
    clip: string,
    filt: string,
    transform: string,
    origin: string,
  ) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: ICON_X,
        top: ICON_Y,
        width: ICON_W,
        height: ICON_W,
        transform,
        transformOrigin: origin,
      }}
    >
      <Img
        src={src}
        style={{ width: ICON_W, height: ICON_W, clipPath: clip, filter: `url(#${filt})` }}
      />
    </div>
  );

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="snp-ink" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${ir} 0 0 0 0 ${ig} 0 0 0 0 ${ib} 0 0 0 1 0`}
            />
          </filter>
          <filter id="snp-star" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${r.toFixed(4)} 0 0 0 0 ${g.toFixed(4)} 0 0 0 0 ${b.toFixed(4)} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      <AbsoluteFill style={{ filter: `drop-shadow(0 2px 6px ${shadow})` }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `rotate(${sway.toFixed(3)}deg)`,
            transformOrigin: `${ICON_X + STAR_CX}px ${ICON_Y + ICON_W * 0.72}px`,
          }}
        >
          {[0, 1].map((k) => {
            const left = k === 0;
            const inset = left
              ? `0px ${(ICON_W - 158 * S).toFixed(2)}px ${(ICON_W - 170 * S).toFixed(2)}px ${(40 * S).toFixed(2)}px`
              : `0px ${(ICON_W - 470 * S).toFixed(2)}px ${(ICON_W - 170 * S).toFixed(2)}px ${(350 * S).toFixed(2)}px`;
            const out = rayIn(k) * rayOut;
            const tuck = (1 - out) * 30 * (left ? 1 : -1);
            return (
              <div key={`ray${k}`} style={{ opacity: figureOpacity * out }}>
                {piece(
                  `ray${k}i`,
                  `inset(${inset})`,
                  "snp-ink",
                  `translate(${tuck.toFixed(2)}px, ${(-(1 - out) * 5).toFixed(2)}px)`,
                  "0px 0px",
                )}
              </div>
            );
          })}

          {/* One opacity for the whole star, applied to the group rather than
              to each piece, so the overlap at the joins never shows as a
              brighter seam while they are still assembled. */}
          <div style={{ position: "absolute", inset: 0, opacity: starO }}>
            {PIECES.map((p, i) => {
              const sx = p.dx * p.sep * sepE;
              const sy = p.dy * p.sep * sepE + lift * (1 - broken);
              const drop = 0.5 * gravity * p.heavy * fallT * fallT;
              return piece(
                `st${i}`,
                p.clip,
                "snp-star",
                `translate(${sx.toFixed(2)}px, ${(sy + drop).toFixed(2)}px) rotate(${(p.rot * broken).toFixed(2)}deg)`,
                `${p.ox.toFixed(2)}px ${p.oy.toFixed(2)}px`,
              );
            })}
          </div>

          <div style={{ opacity: figureOpacity }}>
            {piece("body", `inset(${BODY_TOP.toFixed(2)}px 0px 0px 0px)`, "snp-ink", "none", "0px 0px")}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SuccessNotPossible;
