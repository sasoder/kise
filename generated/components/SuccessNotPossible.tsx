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
import { LAND, clamp01, hash, qbez, sgnPick } from "./cheekyPintSystem";

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
// redrawn or traced. Instead it is drawn several times over, each copy
// clipped to a different part of itself, so every piece that has to move is
// the artwork rather than an imitation of it.
//
// The three regions are disjoint, which is why each clip can stay a simple
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

const CX = ICON_X + STAR_CX;
const CY = ICON_Y + STAR_CY;

const SHARDS = 7;
const SLICE = 360 / SHARDS;
// One bisector points straight up, so the star's top point leaves as a point
// rather than being cut down the middle.
const bisect = (i: number) => -90 + i * SLICE;

const slicePath = (i: number) => {
  const a0 = rad(bisect(i) - SLICE / 2);
  const a1 = rad(bisect(i) + SLICE / 2);
  const x0 = STAR_CX + STAR_R * Math.cos(a0);
  const y0 = STAR_CY + STAR_R * Math.sin(a0);
  const x1 = STAR_CX + STAR_R * Math.cos(a1);
  const y1 = STAR_CY + STAR_R * Math.sin(a1);
  return `path('M ${STAR_CX.toFixed(2)} ${STAR_CY.toFixed(2)} L ${x0.toFixed(2)} ${y0.toFixed(2)} A ${STAR_R.toFixed(2)} ${STAR_R.toFixed(2)} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z')`;
};

// ---------------------------------------------------------------------------
// The set of possible outcomes
//
// It is an actual field with actual members, sitting where the star was held.
// Each shard flies out along its own slice's bearing and lands in it, so the
// set the star is not in ends up made of the star — every piece of it is a
// possible outcome and none of them is success.
// ---------------------------------------------------------------------------
const FIELD_CX = 540;
const FIELD_CY = 645;
const FIELD_RX = 200;
const FIELD_UP = 120;
const FIELD_DOWN = 78;
// The set is a bounded thing, so it gets a boundary — one hairline, barely
// there, drawn as the words name it.
const RING_RX = 215;
const RING_RY = 145;
const RING_CY = 640;

const fieldPoint = (deg: number, f: number) => {
  const a = rad(deg);
  const sy = Math.sin(a);
  return {
    x: FIELD_CX + FIELD_RX * Math.cos(a) * f,
    y: FIELD_CY + (sy < 0 ? FIELD_UP : FIELD_DOWN) * sy * f,
  };
};

const SHARD = Array.from({ length: SHARDS }, (_, i) => {
  const deg = bisect(i) + sgnPick(i * 3 + 1) * hash(i * 5 + 2) * 9;
  // Spread the distances hard. Seven pieces sent to the same radius land on a
  // ring and read as a wreath; a set has some things near the middle of it.
  const d = fieldPoint(deg, 0.34 + hash(i * 7 + 3) * 0.62);
  const dx = d.x - CX;
  const dy = d.y - CY;
  const len = Math.hypot(dx, dy) || 1;
  // Each piece sags off its own straight line, so seven leaving at once never
  // reads as one gesture performed seven times.
  const bow = sgnPick(i * 11 + 4) * (0.16 + hash(i * 13 + 5) * 0.16) * len;
  return {
    dx,
    dy,
    cx: dx / 2 + (-dy / len) * bow,
    cy: dy / 2 + (dx / len) * bow,
    rot: sgnPick(i * 17 + 6) * (11 + hash(i * 19 + 7) * 23),
    go: i * 2,
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
  figureOpacity: z.number().min(0).max(1),
  fieldOpacity: z.number().min(0).max(1),
  ringOpacity: z.number().min(0).max(0.6),
  beats: z.object({
    // Beat frames lifted from the SRT at 24fps, f0 = 00:00:32,159.
    //   f0 like i'll take   f21 drastic action   f39 only when i
    //   f57 conclude that   f71 success is       f87 not in a set of
    //   f100 possible       f108 outcomes (ends f124)
    star: z.number().int(),
    conclude: z.number().int(),
    success: z.number().int(),
    notIn: z.number().int(),
    set: z.number().int(),
  }),
});

export type SuccessNotPossibleProps = z.infer<typeof schema>;

export const defaultProps: SuccessNotPossibleProps = schema.parse({
  ink: "#FFFFFF",
  accent: "#FFC543",
  shadow: "rgba(0,0,0,0.28)",
  icon: "success.png",
  figureOpacity: 0.92,
  fieldOpacity: 0.45,
  ringOpacity: 0.12,
  beats: { star: -4, conclude: 39, success: 71, notIn: 87, set: 95 },
});

const FLIGHT = 28;

export const SuccessNotPossible: React.FC<SuccessNotPossibleProps> = ({
  ink,
  accent,
  shadow,
  icon,
  figureOpacity,
  fieldOpacity,
  ringOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const src = staticFile(icon);
  const [ir, ig, ib] = hex(ink);
  const [ar, ag, ab] = hex(accent);

  // He is already up and holding it when the cut arrives — the clip starts
  // mid-sentence, so the first frame is the end of a move, not the start.
  const bodyIn = interpolate(frame, [-10, 11], [0, 1], { ...CLAMP, easing: LAND });
  const starIn = interpolate(frame, [beats.star, beats.star + 14], [0, 1], {
    ...CLAMP,
    easing: LAND,
  });

  // The celebration strokes come out last and go back in first: the mood turns
  // at "only when i conclude that", a beat before anything breaks.
  const rayIn = (k: number) =>
    interpolate(frame, [beats.star + 6 + k * 3, beats.star + 20 + k * 3], [0, 1], {
      ...CLAMP,
      easing: LAND,
    });
  const rayOut = interpolate(frame, [beats.conclude, beats.conclude + 25], [1, 0], {
    ...CLAMP,
    easing: GLIDE,
  });

  // The figure breathes while it is still holding something, and goes
  // completely still the moment the star goes. The stillness is the resolve.
  const swayAmt =
    interpolate(frame, [20, 32], [0, 1], { ...CLAMP, easing: GLIDE }) *
    interpolate(frame, [beats.notIn - 8, beats.notIn + 4], [1, 0], { ...CLAMP, easing: GLIDE });
  const sway = Math.sin(frame / 26) * 0.85 * swayAmt;
  const breathe = 1 + Math.sin(frame / 31) * 0.008 * swayAmt;

  const toAccent = interpolate(frame, [beats.success, beats.success + 9], [0, 1], {
    ...CLAMP,
    easing: GLIDE,
  });
  const pulse = interpolate(frame, [beats.success, beats.success + 22], [0, 1], {
    ...CLAMP,
    easing: RISE,
  });

  const tint = (t: number) => {
    const r = ir + (ar - ir) * t;
    const g = ig + (ag - ig) * t;
    const b = ib + (ab - ib) * t;
    return `0 0 0 0 ${r.toFixed(4)} 0 0 0 0 ${g.toFixed(4)} 0 0 0 0 ${b.toFixed(4)} 0 0 0 1 0`;
  };

  const shards = SHARD.map((s, i) => {
    const t = interpolate(
      frame,
      [beats.notIn + s.go, beats.notIn + s.go + FLIGHT],
      [0, 1],
      { ...CLAMP, easing: RISE },
    );
    return {
      ...s,
      t,
      x: qbez(0, s.cx, s.dx, t),
      y: qbez(0, s.cy, s.dy, t),
      // It loses the accent on the way out: the piece is still there, it is
      // just no longer success.
      hue: toAccent * (1 - clamp01(t / 0.45)),
      o: interpolate(t, [0.15, 1], [0.95, fieldOpacity], CLAMP) * starIn,
      i,
    };
  });

  const piece = (
    key: string,
    clip: string,
    filt: string,
    opacity: number,
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
        opacity,
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
            <feColorMatrix type="matrix" values={tint(0)} />
          </filter>
          {shards.map((s) => (
            <filter key={s.i} id={`snp-s${s.i}`} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={tint(s.hue)} />
            </filter>
          ))}
        </defs>
      </svg>

      <AbsoluteFill style={{ filter: `drop-shadow(0 2px 6px ${shadow})` }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `rotate(${sway.toFixed(3)}deg) scale(${breathe.toFixed(4)})`,
            transformOrigin: `${CX}px ${ICON_Y + ICON_W * 0.72}px`,
          }}
        >
          {piece(
            "body",
            `inset(${BODY_TOP.toFixed(2)}px 0px 0px 0px)`,
            "snp-ink",
            figureOpacity * bodyIn,
            `translateY(${(1 - bodyIn) * 70}px)`,
            `${CX - ICON_X}px ${ICON_W}px`,
          )}

          {[0, 1].map((k) => {
            const left = k === 0;
            const inset = left
              ? `0px ${(ICON_W - 158 * S).toFixed(2)}px ${(ICON_W - 170 * S).toFixed(2)}px ${(40 * S).toFixed(2)}px`
              : `0px ${(ICON_W - 470 * S).toFixed(2)}px ${(ICON_W - 170 * S).toFixed(2)}px ${(350 * S).toFixed(2)}px`;
            const sc = 0.35 + 0.65 * rayIn(k);
            return piece(
              `ray${k}`,
              `inset(${inset})`,
              "snp-ink",
              figureOpacity * rayIn(k) * rayOut,
              `scale(${(sc * (0.55 + 0.45 * rayOut)).toFixed(4)})`,
              `${STAR_CX}px ${STAR_CY}px`,
            );
          })}

          <svg
            width={1080}
            height={1920}
            viewBox="0 0 1080 1920"
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {pulse > 0 && pulse < 1 ? (
              <circle
                cx={CX}
                cy={CY}
                r={STAR_R + 90 * pulse}
                fill="none"
                stroke={accent}
                strokeWidth={4}
                opacity={0.55 * (1 - pulse)}
              />
            ) : null}
            {(() => {
              const p = interpolate(frame, [beats.set, beats.set + 18], [0, 1], {
                ...CLAMP,
                easing: LAND,
              });
              if (p <= 0) return null;
              return (
                <ellipse
                  cx={FIELD_CX}
                  cy={RING_CY}
                  rx={RING_RX * (0.86 + 0.14 * p)}
                  ry={RING_RY * (0.86 + 0.14 * p)}
                  fill="none"
                  stroke={ink}
                  strokeWidth={3}
                  opacity={ringOpacity * p}
                />
              );
            })()}
          </svg>

          {shards.map((s) => {
            const drift = s.t >= 1 ? Math.sin(frame / 33 + s.i * 1.7) * 3 : 0;
            return piece(
              `sh${s.i}`,
              slicePath(s.i),
              `snp-s${s.i}`,
              s.o,
              `translate(${s.x.toFixed(2)}px, ${(s.y + drift).toFixed(2)}px) rotate(${(s.rot * s.t).toFixed(2)}deg) scale(${(0.35 + 0.65 * starIn).toFixed(4)})`,
              `${STAR_CX}px ${STAR_CY}px`,
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default SuccessNotPossible;
