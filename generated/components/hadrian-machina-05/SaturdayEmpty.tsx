import React from "react";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";

// ---------------------------------------------------------------------------
// "SATURDAY, EMPTY" — a TRANSPARENT overlay that sits right UNDER the 16:9
// video band (the band covers y 575-1209 of the 9:16 frame, over grey paper).
//
// CHECK LINE (what the viewer can say after this cut): "They went to two
// companies, Durin and Radiant, and both were empty."
//
// DURATION. The slot is sequence 00:00:12.542 - 00:00:23.750 at 24.000 fps:
// round((23.750 - 12.542) * 24) = round(11.208 * 24) = 269 frames.
//
// THE MOTION, one job, one little scoreboard: the Durin lockup slides up into
// the middle under the video (f0-10) and an orange EMPTY sticker is slapped
// onto it on "empty" (f89); on "Oh, this is Radiant" (f108-124) Durin, sticker
// attached, slides to the left slot while the Radiant lockup grows into the
// right slot, and it gets the same sticker on the second "Empty" (f189). Both
// then hold with a slow 2-3 px float, out of phase, to a settled f268.
//
// INK RULES (core memory, as CodeAndApps): white #FFFFFF ink, every shape on a
// hard black #000000 shadow, zero blur, +4 / +4 px, drawn as a translated copy
// of the shape. Raw hex, no glow, no blend modes, no opacity: things arrive by
// scale and position. No background, no camera: the root is transparent.
//
// THE STAGE. Everything stays inside x 70-1010, y 1250-1560.
// ---------------------------------------------------------------------------

const { fontFamily } = loadFont("normal", {
  weights: ["800", "900"],
  subsets: ["latin"],
});

export const FPS = 24;
export const DURATION = 269;
export const FRAME_W = 1080;
export const FRAME_H = 1920;

const WHITE = "#FFFFFF";
const BLACK = "#000000";
const ORANGE = "#FFB765";

const HOUSE = Easing.bezier(0.16, 1, 0.3, 1);
const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const schema = z.object({
  ink: z.string(),
  shadow: z.string(),
  sticker: z.string(),
  shadowOffset: z.number(),
  durinSrc: z.string(),
  radiantSrc: z.string(),
  // lockup sizes, px
  durinMark: z.number(), // the ring's diameter
  durinFont: z.number(), // DURIN, Barlow 800 caps
  durinGap: z.number(),
  radiantW: z.number(), // the full Radiant lockup (1461 x 292 source)
  // slots (lockup centres)
  rowY: z.number(),
  centreX: z.number(),
  leftX: z.number(),
  rightX: z.number(),
  // beats, local frames
  arriveEnd: z.number(),
  slapDurin: z.number(),
  joinStart: z.number(),
  joinEnd: z.number(),
  slapRadiant: z.number(),
  // the sticker
  stickerW: z.number(),
  stickerH: z.number(),
  stickerFont: z.number(),
  stickerDx: z.number(), // sticker centre, relative to the lockup centre
  durinStickerDy: z.number(),
  radiantStickerDy: z.number(),
  durinTilt: z.number(), // degrees
  radiantTilt: z.number(),
  floatPx: z.number(),
  floatPeriod: z.number(), // frames
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: WHITE,
  shadow: BLACK,
  sticker: ORANGE,
  shadowOffset: 4,
  durinSrc: "hadrian05/durin_mark_white.png",
  radiantSrc: "hadrian05/radiant_logo_white.png",
  durinMark: 106,
  durinFont: 88,
  durinGap: 22,
  radiantW: 430,
  rowY: 1360,
  centreX: 540,
  leftX: 290,
  rightX: 790,
  arriveEnd: 10,
  slapDurin: 89,
  joinStart: 108,
  joinEnd: 124,
  slapRadiant: 189,
  stickerW: 250,
  stickerH: 92,
  stickerFont: 66,
  stickerDx: 65,
  durinStickerDy: 88,
  radiantStickerDy: 80,
  durinTilt: -8,
  radiantTilt: 6,
  floatPx: 2.5,
  floatPeriod: 110,
});

const RADIANT_ASPECT = 1461 / 292;

// The slap: lands from 1.35 in LAND frames, then a short squash that settles.
const LAND = 4;
const slap = (frame: number, at: number) => {
  const t = frame - at;
  const on = t >= 0;
  const land = interpolate(t, [0, LAND], [0, 1], { ...CLAMP, easing: Easing.out(Easing.cubic) });
  const scale = 1.35 - 0.35 * land;
  // squash: peaks one frame after contact, gone three frames later
  const squash = interpolate(t, [LAND - 1, LAND, LAND + 3], [0, 1, 0], CLAMP);
  // how far above the surface the sticker still is (drives its shadow)
  const lift = 1 - land;
  // extra tilt that straightens as it lands
  const twist = 5 * (1 - land);
  // the logo underneath: a nudge at contact that springs back over ~8 frames
  const k = t - (LAND - 1);
  const nudge = k < 0 ? 0 : Math.exp(-k * 0.45) * Math.cos(k * 0.85) * (k > 9 ? 0 : 1);
  return { on, scale, squash, lift, twist, nudge };
};

const Sticker: React.FC<{ p: Props; s: ReturnType<typeof slap>; tilt: number; dy: number }> = ({ p, s, tilt, dy }) => {
  if (!s.on) return null;
  const sx = s.scale * (1 + 0.045 * s.squash);
  const sy = s.scale * (1 - 0.045 * s.squash);
  // The tilt turns about the sticker's centre; the landing scale and twist
  // pivot on its bottom-right corner, so it comes down from the upper left and
  // never grows past the stage's right or bottom edge.
  const land = `rotate(${tilt}deg)`;
  const hit = `rotate(${s.twist * Math.sign(tilt)}deg) scale(${sx}, ${sy})`;
  const off = p.shadowOffset + 7 * s.lift;
  const face: React.CSSProperties = {
    position: "absolute",
    left: p.stickerDx - p.stickerW / 2,
    top: dy - p.stickerH / 2,
    width: p.stickerW,
    height: p.stickerH,
    borderRadius: 16,
    transformOrigin: "50% 50%",
  };
  const inner: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: 16,
    transformOrigin: "100% 100%",
    transform: hit,
  };
  return (
    <>
      <div style={{ ...face, transform: `translate(${off}px, ${off}px) ${land}` }}>
        <div style={{ ...inner, background: p.shadow }} />
      </div>
      <div style={{ ...face, transform: land }}>
        <div
          style={{
            ...inner,
            background: p.sticker,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily,
            fontWeight: 900,
            fontSize: p.stickerFont,
            lineHeight: 1,
            letterSpacing: "0.04em",
            paddingLeft: "0.04em",
            boxSizing: "border-box",
            color: p.shadow,
            textTransform: "uppercase",
          }}
        >
          EMPTY
        </div>
      </div>
    </>
  );
};

// One ink pass of the Durin lockup: the ring PNG + DURIN. `black` draws the shadow copy.
const DurinInk: React.FC<{ p: Props; black: boolean }> = ({ p, black }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      top: 0,
      transform: `translate(-50%, -50%)${black ? ` translate(${p.shadowOffset}px, ${p.shadowOffset}px)` : ""}`,
      display: "flex",
      alignItems: "center",
      gap: p.durinGap,
      whiteSpace: "nowrap",
    }}
  >
    <Img
      src={staticFile(p.durinSrc)}
      style={{ width: p.durinMark, height: p.durinMark, display: "block", filter: black ? "brightness(0)" : undefined }}
    />
    <div
      style={{
        fontFamily,
        fontWeight: 800,
        fontSize: p.durinFont,
        lineHeight: 1,
        letterSpacing: "0.045em",
        color: black ? p.shadow : p.ink,
        textTransform: "uppercase",
      }}
    >
      DURIN
    </div>
  </div>
);

const RadiantInk: React.FC<{ p: Props; black: boolean }> = ({ p, black }) => {
  const w = p.radiantW;
  const h = w / RADIANT_ASPECT;
  const o = black ? p.shadowOffset : 0;
  return (
    <Img
      src={staticFile(p.radiantSrc)}
      style={{
        position: "absolute",
        left: -w / 2 + o,
        top: -h / 2 + o,
        width: w,
        height: h,
        filter: black ? "brightness(0)" : undefined,
      }}
    />
  );
};

const SaturdayEmpty: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();

  const float = (phase: number) => p.floatPx * Math.sin((frame / p.floatPeriod) * Math.PI * 2 + phase);

  // Durin: up into the middle, later across to the left slot
  const arrive = interpolate(frame, [0, p.arriveEnd], [0, 1], { ...CLAMP, easing: HOUSE });
  const join = interpolate(frame, [p.joinStart, p.joinEnd], [0, 1], { ...CLAMP, easing: HOUSE });
  const dSlap = slap(frame, p.slapDurin);
  const rSlap = slap(frame, p.slapRadiant);

  const dX = p.centreX + (p.leftX - p.centreX) * join;
  const dY = p.rowY + 60 * (1 - arrive) + float(0);
  const dScale = 0.85 + 0.15 * arrive;
  const dN = 3.5 * dSlap.nudge;

  // Radiant: grows into the right slot out of the space Durin leaves
  const rOn = frame >= p.joinStart;
  const rX = p.rightX - 110 * (1 - join);
  const rY = p.rowY + 36 * (1 - join) + float(2.2);
  const rScale = join;
  const rN = 3.5 * rSlap.nudge;

  const group = (x: number, y: number, s: number): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    transform: `translate(${x}px, ${y}px) scale(${s})`,
  });
  const nudged = (n: number): React.CSSProperties => ({
    position: "absolute",
    left: 0,
    top: 0,
    transform: `translate(${n}px, ${n}px)`,
  });

  return (
    <AbsoluteFill>
      <div style={group(dX, dY, dScale)}>
        <div style={nudged(dN)}>
          <DurinInk p={p} black />
          <DurinInk p={p} black={false} />
        </div>
        <Sticker p={p} s={dSlap} tilt={p.durinTilt} dy={p.durinStickerDy} />
      </div>
      {rOn ? (
        <div style={group(rX, rY, rScale)}>
          <div style={nudged(rN)}>
            <RadiantInk p={p} black />
            <RadiantInk p={p} black={false} />
          </div>
          <Sticker p={p} s={rSlap} tilt={p.radiantTilt} dy={p.radiantStickerDy} />
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export default SaturdayEmpty;
