import React, { useId } from "react";
import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, FONT_NUM, MercedesTile } from "./wolffShared";
import { KRAFT_BASE, KRAFT_BLUR, KRAFT_DIM, KRAFT_SRC, TILE_GRAD_BOTTOM, TILE_GRAD_TOP, TILE_SHADOW } from "./d1Shared";

/**
 * NameTagCheekyPint — Toto Wolff's name tag for the Cheeky Pint clip, in FIVE
 * options (the `variant` prop) for the user to choose from. STILLS FIRST: every
 * frame is the resolved tag; the entrance comes once an option is picked.
 *
 * Transparent 1080x1920 overlay, 24 fps, 96 f. The house name-tag layout
 * (NameTag / NameTagHumble): bottom-left at left 84 / bottom 300, an
 * inline-block panel that hugs the text, name over job, an in-flow sizing copy
 * of each line under the visible one. Proper capitalisation.
 *
 * Cheeky Pint material: Söhne Halbfett for the name (88 px), Söhne Kräftig
 * for the job (42 px); hard corners (radius 2, the tiles' floor); TILE_GRAD
 * white tiles + TILE_SHADOW; the kraft paper exactly as the cutaways show it
 * (brown-paper-backdrop.jpg, blur 13, dim 0.68); the MercedesTile star;
 * ACCENT #FFB000.
 *
 *   kraftBar  the house panel cut from the kraft paper, white name, job white
 *             at 0.8, the tile drop shadow
 *   knockout  a white TILE_GRAD tile with the name and job KNOCKED OUT as true
 *             transparency (the footage shows through the letters)
 *   badge     the MercedesTile star as a badge at the left, the two lines in
 *             white with the house's sharp offset shadow (3 / 2 px, 0 blur), no
 *             panel
 *   strips    THE CHOSEN DESIGN (v2, the user: "a lil hard to read, more
 *             contrast"): the name on a white tile strip, the job on a
 *             separate narrower amber strip, stacked like two cards, each with
 *             its own tile shadow; both lines in near-black warm brown #1A130D,
 *             the name in Söhne Dreiviertelfett 88, the job in Söhne Halbfett
 *             38; the white strip's gradient flattened to white -> #F1EDE6.
 *             The only option that animates (the house name-tag entrance):
 *               white strip  f0-20   slide up 64 px + fade in
 *               name         f3-18   slide up 24 px + fade in
 *               amber strip  f7-27   slide up 64 px + fade in (follows, never leads)
 *               job          f12-27  slide up 24 px + fade in
 *               f27-95       static hold, no outro, no idle motion
 *             all on Easing.bezier(0.16, 1, 0.3, 1), clamped. WCAG contrast
 *             (measured): name 18.4:1 on white (15.7:1 at the strip's foot),
 *             job 10.0:1 on #FFB000.
 *   card      one kraft card: the star tile, a thin vertical amber rule, the
 *             two lines
 */

export const FPS = 24;
export const DURATION = 96;

export const VARIANTS = ["kraftBar", "knockout", "badge", "strips", "card"] as const;
export type Variant = (typeof VARIANTS)[number];

export const schema = z.object({
  name: z.string(),
  job: z.string(),
  variant: z.enum(VARIANTS),
});
export type NameTagCheekyPintProps = z.infer<typeof schema>;
export const defaultProps: NameTagCheekyPintProps = schema.parse({
  name: "Toto Wolff",
  job: "Mercedes-AMG PETRONAS F1\nTeam Principal and CEO",
  variant: "strips",
});

// ---- type ----
const FONT_JOB = "NameTagSohneKraftig";
loadFont({ family: FONT_JOB, url: staticFile("Sohne-Kraftig.otf"), weight: "500" });
const NAME_PX = 88;
const JOB_PX = 42;
const LINE_HEIGHT = 1.08;
const LINE_GAP = 10;
const NAME_TRACK = -1;
// Söhne's hhea metrics (ascent 1.04, descent 0.234 em; USE_TYPO_METRICS off),
// which is what Chrome lays the line box out with: the baseline sits this far
// below the top of a LINE_HEIGHT line box. Used to put the knockout's SVG
// letters exactly where the HTML lines would be.
const baselineIn = (px: number) => px * (LINE_HEIGHT - (1.04 + 0.234)) / 2 + px * 1.04;

// ---- layout (the house name tag) ----
const LEFT = 84;
const BOTTOM = 300;
const PADDING = { t: 34, r: 52, b: 38, l: 52 };
const RADIUS = 2; // hard corners: the tiles' radius floor

// ---- Cheeky Pint colours ----
const WHITE = "#FFFFFF";
const JOB_ON_KRAFT = "rgba(255,255,255,0.8)";
const SHADOW_NAME = "0 3px 0 rgba(0,0,0,0.6)";
const SHADOW_JOB = "0 2px 0 rgba(0,0,0,0.6)";
const TILE_FILTER = TILE_SHADOW(1);

const nameStyle: React.CSSProperties = {
  fontFamily: FONT_NUM,
  fontWeight: 600,
  fontSize: NAME_PX,
  lineHeight: LINE_HEIGHT,
  letterSpacing: NAME_TRACK,
  whiteSpace: "nowrap",
};
const jobStyle: React.CSSProperties = {
  fontFamily: FONT_JOB,
  fontWeight: 500,
  fontSize: JOB_PX,
  lineHeight: LINE_HEIGHT,
  letterSpacing: 0,
  whiteSpace: "nowrap",
};

// A line with its in-flow sizing copy (the house pattern): the hidden copy
// sizes the box, the visible copy paints on top of it.
const Line: React.FC<{ text: string; base: React.CSSProperties; color: string; shadow?: string }> = ({
  text,
  base,
  color,
  shadow,
}) => (
  <div style={{ position: "relative" }}>
    <div style={{ ...base, visibility: "hidden" }}>{text}</div>
    <div style={{ ...base, position: "absolute", left: 0, top: 0, color, textShadow: shadow }}>{text}</div>
  </div>
);

const Lines: React.FC<{ name: string; job: string; nameColor: string; jobColor: string; shadows?: boolean }> = ({
  name,
  job,
  nameColor,
  jobColor,
  shadows = false,
}) => (
  <div>
    <Line text={name} base={nameStyle} color={nameColor} shadow={shadows ? SHADOW_NAME : undefined} />
    <div style={{ height: LINE_GAP }} />
    <Line text={job} base={jobStyle} color={jobColor} shadow={shadows ? SHADOW_JOB : undefined} />
  </div>
);

// The kraft sheet exactly as the cutaways show it: the same photo at the same
// scale (1.8x the frame, cover), blurred 13 and dimmed 0.68, clipped to the panel.
const KraftFill: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, borderRadius: RADIUS, overflow: "hidden", backgroundColor: KRAFT_BASE }}>
    <Img
      src={staticFile(KRAFT_SRC)}
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 1080 * 1.8,
        height: 1920 * 1.8,
        objectFit: "cover",
        transform: "translate(-50%, -50%)",
        filter: `blur(${KRAFT_BLUR}px) brightness(${KRAFT_DIM})`,
      }}
    />
  </div>
);

const StarTile: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", overflow: "visible", flex: "none" }}>
    <MercedesTile x={size / 2} y={size} k={1} size={size} contact={false} />
  </svg>
);

// ---- the five ----
const KraftBar: React.FC<{ name: string; job: string }> = ({ name, job }) => (
  <div style={{ position: "relative", display: "inline-block", filter: TILE_FILTER }}>
    <KraftFill />
    <div style={{ position: "relative", padding: `${PADDING.t}px ${PADDING.r}px ${PADDING.b}px ${PADDING.l}px` }}>
      <Lines name={name} job={job} nameColor={WHITE} jobColor={JOB_ON_KRAFT} />
    </div>
  </div>
);

const Knockout: React.FC<{ name: string; job: string }> = ({ name, job }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const nameBase = PADDING.t + baselineIn(NAME_PX);
  const jobBase = PADDING.t + NAME_PX * LINE_HEIGHT + LINE_GAP + baselineIn(JOB_PX);
  return (
    <div style={{ position: "relative", display: "inline-block", filter: TILE_FILTER }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TILE_GRAD_TOP} />
            <stop offset="100%" stopColor={TILE_GRAD_BOTTOM} />
          </linearGradient>
          <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x="-10%" y="-10%" width="120%" height="120%">
            <rect x="-10%" y="-10%" width="120%" height="120%" fill="#fff" />
            <text x={PADDING.l} y={nameBase} fill="#000" fontFamily={FONT_NUM} fontWeight={600} fontSize={NAME_PX} letterSpacing={NAME_TRACK}>
              {name}
            </text>
            <text x={PADDING.l} y={jobBase} fill="#000" fontFamily={FONT_JOB} fontWeight={500} fontSize={JOB_PX}>
              {job}
            </text>
          </mask>
        </defs>
        <rect width="100%" height="100%" rx={RADIUS} fill={`url(#${uid}g)`} mask={`url(#${uid}m)`} />
      </svg>
      {/* sizing only: the panel hugs these, nothing paints */}
      <div style={{ position: "relative", padding: `${PADDING.t}px ${PADDING.r}px ${PADDING.b}px ${PADDING.l}px`, visibility: "hidden" }}>
        <div style={nameStyle}>{name}</div>
        <div style={{ height: LINE_GAP }} />
        <div style={jobStyle}>{job}</div>
      </div>
    </div>
  );
};

const BADGE_SIZE = 136; // the star tile ~ the height of the two lines
const Badge: React.FC<{ name: string; job: string }> = ({ name, job }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 30 }}>
    <StarTile size={BADGE_SIZE} />
    <Lines name={name} job={job} nameColor={WHITE} jobColor={WHITE} shadows />
  </div>
);

// ---- strips (v2: more contrast, animated) ----
// Near-black warm brown, the kraft family taken almost to black. The asked
// #1C150F measures 9.85:1 on the flat amber; two steps darker (#1A130D, same
// hue, indistinguishable) clears the 10:1 target on both strips.
const STRIP_INK = "#1A130D";
const STRIP_GRAD = "linear-gradient(180deg, #FFFFFF 0%, #F1EDE6 100%)"; // flatter, so the letters' feet stay on white
const FONT_NAME_HEAVY = "NameTagSohneDreiviertelfett";
loadFont({ family: FONT_NAME_HEAVY, url: staticFile("Sohne-Dreiviertelfett.otf"), weight: "700" });
// The job at 40 would make the amber strip wider than the name strip (505 vs
// 492 px), so it is 38 (482 px): the narrower card under the name.
const STRIP_JOB_PX = 38;
const stripNameStyle: React.CSSProperties = { ...nameStyle, fontFamily: FONT_NAME_HEAVY, fontWeight: 700 };
// A long job breaks where the prop has a "\n" (v3, the client's full title on two lines).
const stripJobStyle: React.CSSProperties = { ...jobStyle, fontFamily: FONT_NUM, fontWeight: 600, fontSize: STRIP_JOB_PX, whiteSpace: "pre" };

// The entrance (the house name tag's, at 24 fps).
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const progress = (frame: number, start: number, travel: number) =>
  interpolate(frame, [start, start + travel], [0, 1], { easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const STRIP_TRAVEL = 20;
const STRIP_RISE = 64;
const TEXT_TRAVEL = 15;
const TEXT_RISE = 24;
const NAME_STRIP_START = 0;
const NAME_START = 3;
const JOB_STRIP_START = 7;
const JOB_START = 12;

// A strip: its background (with the tile shadow) slides and fades on its own;
// the line inside keeps the in-flow sizing copy and slides on its own.
const Strip: React.FC<{ background: string; padding: string; t: number; children: React.ReactNode }> = ({
  background,
  padding,
  t,
  children,
}) => (
  <div style={{ position: "relative", display: "inline-block" }}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        background,
        borderRadius: RADIUS,
        filter: TILE_FILTER,
        opacity: t,
        transform: `translateY(${((1 - t) * STRIP_RISE).toFixed(3)}px)`,
      }}
    />
    <div style={{ position: "relative", padding }}>{children}</div>
  </div>
);

const RisingLine: React.FC<{ text: string; base: React.CSSProperties; color: string; t: number }> = ({ text, base, color, t }) => (
  <div style={{ position: "relative" }}>
    <div style={{ ...base, visibility: "hidden" }}>{text}</div>
    <div
      style={{
        ...base,
        position: "absolute",
        left: 0,
        top: 0,
        color,
        opacity: t,
        transform: `translateY(${((1 - t) * TEXT_RISE).toFixed(3)}px)`,
      }}
    >
      {text}
    </div>
  </div>
);

const Strips: React.FC<{ name: string; job: string }> = ({ name, job }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
      <Strip background={STRIP_GRAD} padding="22px 40px 24px 38px" t={progress(frame, NAME_STRIP_START, STRIP_TRAVEL)}>
        <RisingLine text={name} base={stripNameStyle} color={STRIP_INK} t={progress(frame, NAME_START, TEXT_TRAVEL)} />
      </Strip>
      <Strip background={ACCENT} padding="10px 22px 12px 22px" t={progress(frame, JOB_STRIP_START, STRIP_TRAVEL)}>
        <RisingLine text={job} base={stripJobStyle} color={STRIP_INK} t={progress(frame, JOB_START, TEXT_TRAVEL)} />
      </Strip>
    </div>
  );
};

const CARD_STAR = 112;
const Card: React.FC<{ name: string; job: string }> = ({ name, job }) => (
  <div style={{ position: "relative", display: "inline-block", filter: TILE_FILTER }}>
    <KraftFill />
    <div style={{ position: "relative", display: "flex", alignItems: "center", padding: "30px 50px 34px 28px" }}>
      <StarTile size={CARD_STAR} />
      <div style={{ width: 3, alignSelf: "stretch", background: ACCENT, margin: "0 26px" }} />
      <Lines name={name} job={job} nameColor={WHITE} jobColor={JOB_ON_KRAFT} />
    </div>
  </div>
);

const NameTagCheekyPint: React.FC<NameTagCheekyPintProps> = ({ name, job, variant }) => (
  <AbsoluteFill>
    <div style={{ position: "absolute", left: LEFT, bottom: BOTTOM }}>
      {variant === "kraftBar" ? <KraftBar name={name} job={job} /> : null}
      {variant === "knockout" ? <Knockout name={name} job={job} /> : null}
      {variant === "badge" ? <Badge name={name} job={job} /> : null}
      {variant === "strips" ? <Strips name={name} job={job} /> : null}
      {variant === "card" ? <Card name={name} job={job} /> : null}
    </div>
  </AbsoluteFill>
);

export default NameTagCheekyPint;
