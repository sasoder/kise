// ---------------------------------------------------------------------------
// HowTotoRunsMercedes (toto-twenty-person, cut 0). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Transparent overlay 1080x1920, 25 fps, 54 frames. The clip's title card, from the user's sequence marker
// "for kise" at 0.000-2.160 s: a textbox saying "How Toto runs Mercedes F1".
// Palette B1 (the stoutShared default; never pass palette "stout").
//
// CHECK LINE: "This clip is Toto explaining how he runs Mercedes F1."
//
// THE LINE: "I run it like a 20 people organization, and every team is different, but for example when"
//   (on camera throughout; the card titles the opening).
// WORD -> FRAME: run f0 · it f8 · like f12 · a f17 · 20 f20 (ends f26). The card is not timed to words: it is the
//   title over the opening, in by f10 (before "like"), out f46-f53.
// DURATION: the slot 0.000 -> 2.160 s = 2.160 s x 25 = 54 frames (f0..f53).
//
// THE MOTION: one cream stout card (lit cream, ink Söhne Kräftig, one lifted shadow) centred at y 256-552 with
// "How Toto runs" / "Mercedes F1" in sentence case. In f0-10 with the stout entrance: the card blurs in (6 -> 0 px)
// while it slides up 24 px and fades in, its words follow f2-10 (a further 12 px slide + blur); the card's one
// shadow lifts while it travels and settles as it lands, no overshoot. Living hold f10-46: the whole card (words
// locked to it) drifts up ~3 px at constant speed and its shadow breathes one slow half-step toward float. Out
// f46-53 reversing the entrance (words f46-51, card f46-53, ease-in), so f53 is fully transparent.
// AMBER = the power to decide (COMMON.md); none here: a plain cream card with ink, as the brief allows.
//
// SOURCES: none (the title text is the user's marker, verbatim). Advances measured with hb-shape on
// public/Sohne-Kraftig.otf (1000 upem): "How Toto runs" 6.390 em, "Mercedes F1" 5.616 em.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ALPHA,
  COLOR,
  ELEVATION,
  EDGE,
  FONT_LABEL,
  GEO,
  METRIC,
  OVERLAY_K,
  TRACK,
  clamp01,
  easeOutCubic,
  lerp,
  mixHex,
  rectPath,
  type ShadowLayer,
} from "../kits/cheeky-pint/stoutShared";

export const FPS = 25;
export const DURATION = 54;
export const schema = z.object({
  line1: z.string(),
  line2: z.string(),
});
export const defaultProps = schema.parse({ line1: "How Toto runs", line2: "Mercedes F1" });

// --- the card (SCREEN px; an overlay keeps a static camera, world px = screen px) -------------------------------
/** Title type: Söhne Kräftig 92 px, cap height 66 px (0.718 em). */
const PX = 92;
const CAP = PX * METRIC.cap;
/** Baseline pitch of the two lines (1.22 em: the cap-to-cap gap ~46 px). */
const PITCH = 112;
/** Measured advances (hb-shape, em) for the longest line; tracking TRACK.tag (-0.01 em) on top. */
const ADV_EM: Record<string, number> = { "How Toto runs": 6.39, "Mercedes F1": 5.616 };
const lineW = (t: string) => (ADV_EM[t] ?? t.length * 0.5) * PX + TRACK.tag * PX * (t.length - 1);
const INSET_X = 80;
const CARD_H = 296;
const CARD_Y = 256; // spans y 256-552 (brief: roughly 250-560; clear of the caption bands 1080-1250, 1360-1460)
const R = GEO.RADIUS * OVERLAY_K;

/** Timings (frames). */
const IN = { card: 0, cardF: 10, text: 2, textF: 8 } as const;
const OUT = { text: 46, textF: 5, card: 46, cardF: 7 } as const; // card reaches 0 at f53 (the last frame)
const SLIDE = 24; // the card's slide
const TEXT_SLIDE = 12; // the words' extra slide inside the card
const BLUR = 6; // the stout blur-in (px)
const DRIFT = 0.08; // px per frame, up, constant (the living hold)

const easeInCubic = (v: number) => Math.pow(clamp01(v), 3);

const HowTotoRunsMercedes: React.FC<z.infer<typeof schema>> = ({ line1, line2 }) => {
  const frame = useCurrentFrame();
  const uid = `ht${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;

  const w = Math.ceil((Math.max(lineW(line1), lineW(line2)) + 2 * INSET_X) / 8) * 8;
  const x = 540 - w / 2;

  // presence 0..1 of the card and of its words: in (ease-out), out (ease-in, the entrance reversed)
  const cardIn = easeOutCubic((frame - IN.card) / IN.cardF);
  const cardOut = 1 - easeInCubic((frame - OUT.card) / OUT.cardF);
  const textIn = easeOutCubic((frame - IN.text) / IN.textF);
  const textOut = 1 - easeInCubic((frame - OUT.text) / OUT.textF);
  const c = Math.min(cardIn, cardOut);
  const t = Math.min(textIn, textOut);

  // the card's travel: the slide, plus one constant drift up through the whole slot (no hold-move-hold)
  const dy = (1 - c) * SLIDE - DRIFT * frame;
  const tdy = (1 - t) * TEXT_SLIDE;

  // one shadow: lifted at rest; it lifts toward float while the card travels, and breathes a half-step in the hold
  const travel = c > 0 && c < 1 ? Math.sin(Math.PI * c) : 0;
  const breath = 0.25 * Math.pow(Math.sin(Math.PI * clamp01((frame - IN.cardF) / (OUT.card - IN.cardF))), 2);
  const lift = clamp01(Math.max(travel, breath));
  const A = ELEVATION.lifted;
  const B = ELEVATION.float;
  const mixL = (a: ShadowLayer, b: ShadowLayer): ShadowLayer => ({
    dx: lerp(a.dx, b.dx, lift) * OVERLAY_K,
    dy: lerp(a.dy, b.dy, lift) * OVERLAY_K,
    blur: lerp(a.blur, b.blur, lift) * OVERLAY_K,
    a: lerp(a.a, b.a, lift),
  });
  const shadows = [mixL(A.amb, B.amb), mixL(A.key, B.key)];

  const card = rectPath(x, CARD_Y, w, CARD_H, R);
  // the two baselines, centred on the card optically (no descenders in either line)
  const base1 = CARD_Y + CARD_H / 2 - PITCH / 2 + CAP / 2;
  const base2 = base1 + PITCH;

  if (c <= 0.001) return <AbsoluteFill />;

  const blurCard = BLUR * (1 - c);
  const blurText = BLUR * (1 - t);
  return (
    <AbsoluteFill
      style={{
        opacity: c,
        transform: `translateY(${dy}px)`,
        filter: blurCard > 0.01 ? `blur(${blurCard}px)` : undefined,
      }}
    >
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <linearGradient id={`${uid}c`} x1="0" y1={CARD_Y} x2="0" y2={CARD_Y + CARD_H} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={COLOR.cream} />
            <stop offset="1" stopColor={mixHex(COLOR.cream, COLOR.creamFoot, 0.5)} />
          </linearGradient>
        </defs>
        {/* the card's one shadow (ambient + key) */}
        <g fill={COLOR.shadow}>
          {shadows.map((l, i) => (
            <g key={i} opacity={l.a} transform={`translate(${l.dx} ${l.dy})`} style={{ filter: `blur(${l.blur}px)` }}>
              <path d={card} />
            </g>
          ))}
        </g>
        {/* lit cream card and its lit top edge */}
        <path d={card} fill={`url(#${uid}c)`} />
        <path d={`M${x + R} ${CARD_Y + EDGE.CREAM / 2}H${x + w - R}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edge} strokeWidth={EDGE.CREAM} />
        {/* the title in ink, locked to the card once in */}
        <g
          opacity={t}
          transform={`translate(0 ${tdy})`}
          style={{ filter: blurText > 0.01 ? `blur(${blurText}px)` : undefined }}
          fontFamily={FONT_LABEL}
          fontWeight={500}
          fontSize={PX}
          letterSpacing={`${TRACK.tag}em`}
          textAnchor="middle"
          fill={COLOR.inkDark}
        >
          <text x={540} y={base1} style={{ fontFeatureSettings: '"kern" 1' }}>
            {line1}
          </text>
          <text x={540} y={base2} style={{ fontFeatureSettings: '"kern" 1' }}>
            {line2}
          </text>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default HowTotoRunsMercedes;
