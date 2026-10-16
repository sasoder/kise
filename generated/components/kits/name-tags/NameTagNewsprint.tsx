import React, { useEffect, useState } from "react";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { AbsoluteFill, Easing, Img, cancelRender, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  FIBRE_VINTAGE_SRC,
  FONT_SANS,
  FONT_SERIF,
  GRAIN_SRCS,
  HAIR,
  INK_HI,
  RED,
  RED_DEEP,
  V_INK,
  V_PRINT_WHITE,
} from "../chinatalk/chinatalkVintage";

/**
 * NameTagNewsprint — THE ChinaTalk name tag in the newsprint language
 * (chinatalkVintage.tsx, pass 2). A caption slip cut from the newspaper: the
 * kit's clipping paper with its fibre and specks, a red rule, the NAME, a hair
 * rule, the JOB. A template: props `name`, `job`, `durationInFrames` (and the
 * optional `variant`). First used for Kevin Rudd, "Former Prime Minister of
 * Australia", 89 frames (the slot at 28.375-32.083 s of "Brezhnev chose decay").
 *
 * TRANSPARENT 1080x1920 overlay, 24 fps: nothing but the tag. House name-tag
 * layout: bottom-left, left 84 / bottom 300 (below the caption strip, y
 * 1080-1250), left-aligned, the panel hugs its text (the longer line sets the
 * width). Proper capitalisation, as written.
 *
 * variant "slip" (default): ONE slip.
 *   paper   V_PRINT_WHITE + the kit's fibre map (hard-light, enlarged so the
 *           fibre and specks still show on a phone) + one FROZEN frame of the
 *           print grain, a fine ink keyline, the clipping's light contact
 *           shadow, square corners
 *   inside  red rule (RED, 6 px, the inner width) / name, Source Serif 4 Bold
 *           86, ink / hair ink rule / job, Source Serif 4 Medium Italic 42, ink
 *           at the high rung (the regular italic went thin at phone size).
 *           Optical margins: 42 at the sides (rules, stems), 40 above the red
 *           rule and under the job's baseline, 28 between rule, capitals,
 *           baseline, rule, capitals.
 *   as built for the defaults: the slip is x 84-830, y 1362-1620 (746 x 258).
 *   CONTRAST measured on the render (WCAG; worst case = the lightest 5 % of
 *   the ink on the darkest 1 % of the paper): name 13.8:1 (worst 10.0:1), job
 *   10.6:1 (worst 7.4:1); strips: paper caps on the red 9.2:1 (worst 7.2:1).
 * variant "strips" (the alternate): the layout of the earlier ChinaTalk tag in
 *   the new material: the name on a newsprint strip, the job on a narrower strip
 *   under it printed solid deep red (RED_DEEP inked 20 %), Source Sans 3
 *   SemiBold tracked caps knocked out in paper colour.
 *
 * MOTION (the house name-tag entrance, as approved on NameTagChinaTalk):
 *   f0-20   the slip slides up 64 px and fades in (ease out); everything
 *           printed on it rides with it
 *   f4-18   the red rule writes in from the left;  f10-24 the hair rule
 *   f3-18   the name slides up 24 px + fades + blurs 6 -> 0;  f12-27 the job
 *   f27-end a completely STATIC hold: no exit, no idle motion, no boiling
 *           grain (the grain is one frozen frame). The editor cuts away.
 *   (strips: paper strip f0-20, red strip f7-27, lines f3-18 / f12-27.)
 * At progress 1 no entrance style is left on anything, so every hold frame is
 * the same picture.
 */

export const FPS = 24;
export const VARIANTS = ["slip", "strips"] as const;
export const schema = z.object({
  name: z.string(),
  job: z.string(),
  durationInFrames: z.number().int().positive(),
  variant: z.enum(VARIANTS).optional(),
});
export type NameTagNewsprintProps = z.infer<typeof schema>;
export const defaultProps: NameTagNewsprintProps = schema.parse({
  name: "Kevin Rudd",
  job: "Former Prime Minister of Australia",
  durationInFrames: 89,
});

// ---- type ----
// The job is Source Serif 4 Italic at this weight (the kit's own italic is the 400 of its 30 px cutlines).
const JOB_WEIGHT = 500;
const JOB_ITALIC = loadSourceSerif4("italic", { weights: [String(JOB_WEIGHT) as "500"], subsets: ["latin"] }).fontFamily;
const NAME_PX = 86;
const JOB_PX = 42;
const CAPS_PX = 36; // the strips variant's job line
const LINE_HEIGHT = 1.08;
const TRACK_EM = 0.12;
// Every face the tag sets; nothing is drawn until all of them have loaded.
const FONT_FACES = [
  { family: FONT_SERIF, style: "normal", weight: 700, px: NAME_PX },
  { family: JOB_ITALIC, style: "italic", weight: JOB_WEIGHT, px: JOB_PX },
  { family: FONT_SANS, style: "normal", weight: 600, px: CAPS_PX },
];
const weightCovers = (w: string, want: number) => {
  const [lo, hi = lo] = w.split(" ").map(Number);
  return lo <= want && want <= hi;
};
let fontsLoaded: Promise<void> | null = null;
/** Resolves once every face above has loaded. Rejects (failing the render) if
 *  one is missing, instead of letting Chrome fake an italic or a weight. */
const fontsReady = () => {
  fontsLoaded ??= document.fonts.ready
    .then(() =>
      Promise.all(
        FONT_FACES.map(async (f) => {
          const faces = await document.fonts.load(`${f.style} ${f.weight} ${f.px}px "${f.family}"`);
          if (!faces.some((face) => face.style === f.style && weightCovers(face.weight, f.weight))) {
            throw new Error(`NameTagNewsprint: ${f.family} ${f.style} ${f.weight} did not load`);
          }
        }),
      ),
    )
    .then(() => undefined);
  return fontsLoaded;
};
/** Holds the render until the tag's fonts have loaded (the slip hugs its text,
 *  so its size is only right once they have). */
const useFontsGate = () => {
  const [ready, setReady] = useState(false);
  const [handle] = useState(() => delayRender("NameTagNewsprint: fonts"));
  useEffect(() => {
    let live = true;
    fontsReady()
      .then(() => {
        if (live) setReady(true);
      })
      .catch((err) => cancelRender(err));
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (ready) continueRender(handle);
  }, [ready, handle]);
  return ready;
};

const nameStyle: React.CSSProperties = {
  fontFamily: FONT_SERIF,
  fontWeight: 700,
  fontSize: NAME_PX,
  lineHeight: LINE_HEIGHT,
  letterSpacing: 0,
  fontVariantNumeric: "lining-nums",
  whiteSpace: "nowrap",
};
const jobStyle: React.CSSProperties = {
  fontFamily: JOB_ITALIC,
  fontStyle: "italic",
  fontWeight: JOB_WEIGHT,
  fontSize: JOB_PX,
  lineHeight: LINE_HEIGHT,
  letterSpacing: 0,
  fontVariantNumeric: "lining-nums",
  whiteSpace: "nowrap",
};
const capsStyle: React.CSSProperties = {
  fontFamily: FONT_SANS,
  fontWeight: 600,
  fontSize: CAPS_PX,
  lineHeight: LINE_HEIGHT,
  letterSpacing: `${TRACK_EM}em`,
  marginRight: `${-TRACK_EM}em`, // the last letter's tracking is not part of the line
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

// ---- layout (the house name tag) ----
const LEFT = 84;
const BOTTOM = 300;
// Where the ink sits inside each line box (px from its top; measured on the
// renders), so the margins are OPTICAL: to the capitals and the baselines.
const NAME_BOX = NAME_PX * LINE_HEIGHT; // 92.88
const NAME_CAP_TOP = 18.5;
const NAME_BASE = 76;
const JOB_BOX = JOB_PX * LINE_HEIGHT; // 45.36
const JOB_CAP_TOP = 8;
const JOB_BASE = 37;
const CAPS_BOX = CAPS_PX * LINE_HEIGHT; // 38.88
const CAPS_CAP_TOP = 6;
const CAPS_BASE = 30;
/** the first capital's stem sits this far inside its line box, the last letter's ink ends this far inside
 *  (the italic's foot and its last letter reach the edges of their box) */
const STEM = 3;
const END_BEARING = 1;
const ITALIC_STEM = 0;
const ITALIC_END = 1;
const M_H = 42; // optical margin at the sides (rules and stems)
const M_V = 40; // above the red rule / under the job's baseline
const GAP = 28; // rule -> capitals -> baseline -> rule -> capitals
const RED_RULE = 6;

// ---- material ----
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const INK_JOB = rgba(V_INK, INK_HI);
const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * t);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};
/** the strips variant's red: RED_DEEP inked 20 %, so the paper-coloured caps clear 7:1 on the fibre too */
const STRIP_RED = mixHex(RED_DEEP, V_INK, 0.2);
/** the clipping's light contact shadow and fine keyline (as VintagePhoto's "news" clipping) */
const SLIP_SHADOW = "0 4px 11px rgba(45,35,25,0.13), 0 1px 2px rgba(45,35,25,0.15)";
const KEYLINE = "inset 0 0 0 1.5px rgba(33,29,26,0.5)";
/** a slip's cut edges have toned a little */
const EDGE_TONE = "inset 0 0 30px rgba(120,96,60,0.10)";
/** the fibre map is drawn enlarged, so fibre and specks survive a phone screen */
const FIBRE_SCALE = 1.6;
const FIBRE_STRENGTH = 0.8;
const GRAIN_STRENGTH = 0.6;
const fill: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" };

/** Everything that makes a flat panel newsprint, laid OVER what is printed on
 *  it (so ink and red sit in the paper): the fibre map in hard-light, one frozen
 *  grain frame in soft-light, the toned edge and the keyline. `at` picks the
 *  patch of the fibre map (px in the enlarged map). */
const Newsprint: React.FC<{ at: { x: number; y: number }; keyline?: boolean }> = ({ at, keyline = true }) => (
  <div style={{ ...fill, overflow: "hidden", pointerEvents: "none" }}>
    <div style={{ ...fill, overflow: "hidden", mixBlendMode: "hard-light", opacity: FIBRE_STRENGTH }}>
      <Img
        src={staticFile(FIBRE_VINTAGE_SRC)}
        style={{ position: "absolute", left: -at.x, top: -at.y, width: 2400 * FIBRE_SCALE, height: 4200 * FIBRE_SCALE, maxWidth: "none" }}
      />
    </div>
    <Img
      src={staticFile(GRAIN_SRCS[0])}
      style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 2040, maxWidth: "none", mixBlendMode: "soft-light", opacity: GRAIN_STRENGTH }}
    />
    <div style={{ ...fill, boxShadow: keyline ? `${KEYLINE}, ${EDGE_TONE}` : EDGE_TONE }} />
  </div>
);

// ---- the entrance ----
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const progress = (frame: number, start: number, travel: number) =>
  interpolate(frame, [start, start + travel], [0, 1], { easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const SLIP_TRAVEL = 20;
const SLIP_RISE = 64;
const TEXT_TRAVEL = 15;
const TEXT_RISE = 24;
const TEXT_BLUR = 6;
const RULE_TRAVEL = 14;
const slipEnter = (t: number): React.CSSProperties | undefined =>
  t >= 1 ? undefined : { opacity: t, transform: `translateY(${((1 - t) * SLIP_RISE).toFixed(3)}px)` };
const textEnter = (t: number): React.CSSProperties | undefined =>
  t >= 1
    ? undefined
    : {
        opacity: t,
        transform: `translateY(${((1 - t) * TEXT_RISE).toFixed(3)}px)`,
        filter: `blur(${(TEXT_BLUR * (1 - t)).toFixed(3)}px)`,
      };

/** A line with its in-flow sizing copy (the house pattern): the hidden copy
 *  sizes the box, the visible copy paints on top of it and carries the entrance. */
const Line: React.FC<{ base: React.CSSProperties; color: string; t: number; stem?: number; end?: number; children: React.ReactNode }> = ({
  base,
  color,
  t,
  stem = STEM,
  end = END_BEARING,
  children,
}) => (
  <div style={{ position: "relative", marginLeft: -stem, marginRight: -end }}>
    <div style={{ ...base, visibility: "hidden" }}>{children}</div>
    <div style={{ ...base, position: "absolute", left: 0, top: 0, color, ...textEnter(t) }}>{children}</div>
  </div>
);
/** A rule the width of its container, written in from the left. */
const RuleLine: React.FC<{ height: number; color: string; t: number }> = ({ height, color, t }) => (
  <div style={{ height }}>
    <div style={{ height, width: `${(Math.min(1, Math.max(0, t)) * 100).toFixed(3)}%`, backgroundColor: color }} />
  </div>
);
/** A piece of newsprint that hugs its content and carries the slip entrance:
 *  the ground, what is printed on it, the paper's texture over both, the shadow. */
const Paper: React.FC<{
  ground: string;
  padding: string;
  t: number;
  at: { x: number; y: number };
  keyline?: boolean;
  children: React.ReactNode;
}> = ({ ground, padding, t, at, keyline, children }) => (
  <div style={{ position: "relative", isolation: "isolate", backgroundColor: ground, boxShadow: SLIP_SHADOW, ...slipEnter(t) }}>
    <div style={{ position: "relative", padding }}>{children}</div>
    <Newsprint at={at} keyline={keyline} />
  </div>
);

// ---- variant "slip" ----
const SLIP_PAD = `${M_V}px ${M_H}px ${(M_V - (JOB_BOX - JOB_BASE)).toFixed(2)}px ${M_H}px`;
const Slip: React.FC<{ name: string; job: string; frame: number }> = ({ name, job, frame }) => (
  <Paper ground={V_PRINT_WHITE} padding={SLIP_PAD} t={progress(frame, 0, SLIP_TRAVEL)} at={{ x: 1180, y: 2360 }}>
    <RuleLine height={RED_RULE} color={RED} t={progress(frame, 4, RULE_TRAVEL)} />
    <div style={{ height: GAP - NAME_CAP_TOP }} />
    <Line base={nameStyle} color={V_INK} t={progress(frame, 3, TEXT_TRAVEL)}>
      {name}
    </Line>
    <div style={{ height: GAP - (NAME_BOX - NAME_BASE) }} />
    <RuleLine height={HAIR} color={INK_JOB} t={progress(frame, 10, RULE_TRAVEL)} />
    <div style={{ height: GAP - JOB_CAP_TOP }} />
    <Line base={jobStyle} color={INK_JOB} t={progress(frame, 12, TEXT_TRAVEL)} stem={ITALIC_STEM} end={ITALIC_END}>
      {job}
    </Line>
  </Paper>
);

// ---- variant "strips" ----
// Both strips start at the same x and so do both lines (36 px to the stems).
// Name strip: 30 px over the capitals, 32 under the baseline. Job strip: 15 over
// the capitals and 15 under the baseline.
const STRIP_GAP = 10;
const STRIP_SIDE = 36;
const NAME_STRIP_PAD = `${(30 - NAME_CAP_TOP).toFixed(2)}px ${STRIP_SIDE}px ${(32 - (NAME_BOX - NAME_BASE)).toFixed(2)}px ${STRIP_SIDE}px`;
const JOB_STRIP_PAD = `${(15 - CAPS_CAP_TOP).toFixed(2)}px ${STRIP_SIDE}px ${(15 - (CAPS_BOX - CAPS_BASE)).toFixed(2)}px ${STRIP_SIDE}px`;
const Strips: React.FC<{ name: string; job: string; frame: number }> = ({ name, job, frame }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: STRIP_GAP }}>
    <Paper ground={V_PRINT_WHITE} padding={NAME_STRIP_PAD} t={progress(frame, 0, SLIP_TRAVEL)} at={{ x: 1180, y: 2360 }}>
      <Line base={nameStyle} color={V_INK} t={progress(frame, 3, TEXT_TRAVEL)}>
        {name}
      </Line>
    </Paper>
    <Paper ground={STRIP_RED} padding={JOB_STRIP_PAD} t={progress(frame, 7, SLIP_TRAVEL)} at={{ x: 2600, y: 900 }} keyline={false}>
      <Line base={capsStyle} color={V_PRINT_WHITE} t={progress(frame, 12, TEXT_TRAVEL)} end={0}>
        {job}
      </Line>
    </Paper>
  </div>
);

const NameTagNewsprint: React.FC<NameTagNewsprintProps> = ({ name, job, variant = "slip" }) => {
  const frame = useCurrentFrame();
  const ready = useFontsGate();
  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: LEFT,
          bottom: BOTTOM,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          visibility: ready ? "visible" : "hidden",
        }}
      >
        {variant === "strips" ? <Strips name={name} job={job} frame={frame} /> : <Slip name={name} job={job} frame={frame} />}
      </div>
    </AbsoluteFill>
  );
};

export default NameTagNewsprint;
