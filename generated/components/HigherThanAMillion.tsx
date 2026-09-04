import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/RobotoCondensed';
import {z} from 'zod';

const roboto = loadFont('normal', {weights: ['700'], subsets: ['latin']});

export const FPS = 30;
// 00:00:16.359 -> 00:00:28.260 of the source cut. round((28.260 - 16.359) * 30).
export const DURATION = 357;

// Geometry inherited verbatim from GigawattHundredBillion so the two clips can be
// butt-cut: this scene opens on that scene's last frame and pushes into it.
const SQ = 760;
const SQ_X0 = 160;
const SQ_X1 = SQ_X0 + SQ;
const SQ_Y0 = 620;
const N2 = 100;
const C2 = SQ / N2; // 7.6px cells — the 1,000,000 lattice

// The lone human's cell in the previous scene, snapped onto the C2 lattice. The
// push-in is anchored here, so the unit we go inside is the one the last scene
// left standing: it turns out to be a card, not a person.
const MX = SQ_X0 + 54.5 * C2;
const MY = SQ_Y0 + 54.5 * C2;

const K_MAX = 22; // cell pitch reaches 167px on screen
// The camera rests below 1:1 rather than the scene being drawn smaller, so the
// push-in still ends at 22x and the lattice still fills the frame on the way.
const K_REST = 0.86;

const COUNT_Y = 500;
const CAPTION_Y = 584;
const GW_Y = 1372;

const CARD = staticFile('h100.png');
const CARD_AR = 467 / 569;
const CARD_W = 580;
const HERO_H = CARD_W * CARD_AR;
const HERO_CX = 540; // the hero shot is centred on the frame, not on the cell
const HERO_CY = 950;

// ---------------------------------------------------------------------------
// What the card is doing, drawn the way code is drawn elsewhere in this cut:
// indented rounded bars, no glyphs. It writes at exactly the rate the label
// claims, so the number is encoded twice — once as type, once as the speed the
// text actually advances.
// ---------------------------------------------------------------------------
const CODE_X0 = 170;
// The card has been running long before we look at it, so the block is already
// full when it fades up: we join the stream rather than watch it start.
const PREFILL = 380;
const CODE_TOP = 676;
const WRITE_Y = 1300; // the live edge sits below the card, never behind it
const LINE_H = 36;
const BAR_H = 13;
const TOKEN_W = 26;
const INDENT = 42;
const ROWS = Math.ceil((WRITE_Y - CODE_TOP) / LINE_H) + 2;

// Stable per-line scatter: same shape every frame and every render.
const lineHash = (i: number, k: number) => {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// Enough lines to outrun the clip. Level 0 opens a block, the body sits one or
// two levels in — reads as code without drawing a single character.
const STREAM = (() => {
  const rows: {tokens: number; x: number; start: number}[] = [];
  let start = 0;
  for (let i = 0; i < 260; i++) {
    const tokens = 8 + Math.floor(lineHash(i, 7) * 19);
    const level = i % 7 === 0 ? 0 : lineHash(i, 3) > 0.76 ? 2 : 1;
    rows.push({tokens, x: CODE_X0 + level * INDENT, start});
    start += tokens;
  }
  return rows;
})();

const ease = {
  easing: Easing.inOut(Easing.cubic),
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;
const out = {
  easing: Easing.out(Easing.cubic),
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp',
} as const;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const mix = (a: string, b: string, t: number) => {
  const ch = (h: string, i: number) => parseInt(h.slice(i, i + 2), 16);
  const c = (i: number) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * t);
  return `rgb(${c(1)}, ${c(3)}, ${c(5)})`;
};

const face = (size: number, tracking: number) =>
  ({
    fontFamily: roboto.fontFamily,
    fontWeight: 700,
    fontSize: size,
    lineHeight: 1,
    letterSpacing: `${tracking}em`,
    marginRight: `${-tracking}em`,
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'pre',
  }) as const;

const Line: React.FC<{
  text: string;
  size: number;
  color: string;
  opacity: number;
  reveal: (i: number) => number;
  shadow: string;
  tracking?: number;
}> = ({text, size, color, opacity, reveal, shadow, tracking = 0.06}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'baseline',
      ...face(size, tracking),
      color,
      opacity,
      filter: `drop-shadow(0 2px 6px ${shadow})`,
    }}
  >
    {text.split('').map((c, i) => {
      const p = reveal(i);
      return (
        <span
          key={`${i}-${c}`}
          style={{opacity: p, transform: `translateY(${(1 - p) * 14}px)`, display: 'inline-block'}}
        >
          {c}
        </span>
      );
    })}
  </div>
);

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  shadow: z.string(),
  fieldAlpha: z.number().min(0).max(1),
  fusedRadius: z.number().min(4).max(7),
  boostRadius: z.number().min(4).max(7.6),
  unitRadius: z.number().min(1).max(3.2),
  cardWidth: z.number().min(400).max(900),
  tokensPerSecond: z.number().min(10).max(120),
  // Beat frames from the SRT at 30fps, relative to 00:00:16.359:
  //   0 "i think it" · 26 "might be higher" · 38 "than a million" · 53 "right?"
  //   58 "because" · 68 "one h100" · 91 "should be" · 112 "able to like do"
  //   136 "one trillion" · 162 "active" · 170 "parameters" · 186 "at like 50"
  //   204 "tokens a second" · 224 "or something" · 244 "and so yeah"
  //   276 "but then" · 307 "gigawatts are" · 323 "getting better"
  //   335 "and better" · 341 "hardware"
  beats: z.object({
    question: z.number().int(), // "might be higher" — the million is reopened
    claim: z.number().int(), // "than a million" — the ">" lands
    mark: z.number().int(), // "than a million" — one cell is singled out
    push: z.number().int(), // "because" — camera starts moving in
    pushEnd: z.number().int(), // "one h100" — the cell is a card
    hero: z.number().int(), // card fully open
    params: z.number().int(), // "one trillion"
    paramsWord: z.number().int(), // "active parameters"
    rate: z.number().int(), // "at like 50"
    rateWord: z.number().int(), // "tokens a second"
    pull: z.number().int(), // "and so yeah" — camera starts leaving
    pullEnd: z.number().int(),
    resolve: z.number().int(), // "but then" — the count becomes the claim
    better: z.number().int(), // "gigawatts are getting better hardware"
    betterEnd: z.number().int(),
  }),
});

export type HigherThanAMillionProps = z.infer<typeof schema>;

export const defaultProps: HigherThanAMillionProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#48D9FF',
  shadow: 'rgba(0, 0, 0, 0.28)',
  fieldAlpha: 0.95,
  fusedRadius: 5.2,
  boostRadius: 6.4,
  unitRadius: 1.9,
  cardWidth: CARD_W,
  tokensPerSecond: 50,
  beats: {
    question: 26,
    claim: 38,
    mark: 48,
    push: 56,
    pushEnd: 86,
    hero: 112,
    params: 136,
    paramsWord: 162,
    rate: 186,
    rateWord: 204,
    pull: 244,
    pullEnd: 290,
    resolve: 286,
    better: 307,
    betterEnd: 345,
  },
});

const HigherThanAMillion: React.FC<HigherThanAMillionProps> = ({
  ink,
  accent,
  shadow,
  fieldAlpha,
  fusedRadius,
  boostRadius,
  unitRadius,
  cardWidth,
  tokensPerSecond,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();

  // One camera value drives the whole scene. Everything else is read off it, so
  // the field, the card and the lattice cannot drift apart if this is retimed.
  const k = interpolate(
    frame,
    [beats.push, beats.pushEnd, beats.pull, beats.pullEnd],
    [K_REST, K_MAX, K_MAX, K_REST],
    ease,
  );

  // Close in, the fused million stops being a surface and becomes countable
  // units again. Derived from k, never from a parallel timer.
  const unfuse = interpolate(k, [1, 6], [0, 1], clamp);
  const packR = fusedRadius + (unitRadius - fusedRadius) * unfuse;
  const boostR = boostRadius + (unitRadius - boostRadius) * unfuse;

  const better = interpolate(frame, [beats.better, beats.betterEnd], [0, 1], ease);

  // The field holds most of its weight until after the swap, then clears the
  // frame fast. It cannot be read off k: a 22x push spends its last doubling in
  // six frames, which is far too brief for the reveal to land on "one h100".
  const fieldOn =
    Math.max(
      interpolate(frame, [beats.push + 2, beats.pushEnd - 12, beats.pushEnd + 6], [1, 0.8, 0], ease),
      interpolate(frame, [beats.pull + 10, beats.pull + 30, beats.pull + 46], [0, 0.8, 1], ease),
    ) *
    // Once the lattice is wider than the frame it is a wall, not a footprint.
    // Hold it back so the marked cell can be read against it.
    interpolate(k, [1, 3, 12], [1, 0.9, 0.5], clamp);

  // The lone human from the previous scene, still holding his cell — until we
  // are close enough to see what the cell actually holds. He does not come
  // back on the way out: that is the whole point of having gone in.
  const humanP = interpolate(frame, [beats.pushEnd - 22, beats.pushEnd - 8], [1, 0], ease);

  // Card: opens out of that cell and returns to it. Its start and end size are
  // whatever one cell measures on screen right now, so the swap is seamless at
  // any zoom the camera happens to be at.
  const cardP =
    interpolate(frame, [beats.pushEnd - 22, beats.pushEnd - 6], [0, 1], ease) *
    interpolate(frame, [beats.pull + 8, beats.pull + 20], [1, 0], ease);
  const grow = interpolate(
    frame,
    [beats.pushEnd - 20, beats.hero, beats.pull + 4, beats.pull + 28],
    [0, 1, 1, 0],
    ease,
  );
  const cardW = C2 * k + (cardWidth - C2 * k) * grow;
  const cardH = cardW * CARD_AR;
  // Leaves the cell it came out of and takes the middle of the frame, then goes
  // back the same way, so the swap is seamless at both ends.
  const cardX = MX + (HERO_CX - MX) * grow;
  const cardY = MY + (HERO_CY - MY) * grow;

  const labelP =
    interpolate(frame, [beats.pushEnd + 2, beats.pushEnd + 20], [0, 1], out) *
    interpolate(frame, [beats.pull, beats.pull + 16], [1, 0], ease);
  // What the count counts, and what the box is. Present whenever the box is.
  const captionP =
    interpolate(frame, [beats.push + 8, beats.push + 30], [1, 0], ease) +
    interpolate(frame, [beats.pullEnd - 6, beats.pullEnd + 18], [0, 1], out);
  const capP = Math.min(1, captionP);
  const arrowP = interpolate(frame, [beats.better + 12, beats.better + 34], [0, 1], out);
  const specP = interpolate(frame, [beats.pull + 2, beats.pull + 20], [1, 0], ease);

  const resolve = interpolate(frame, [beats.resolve, beats.resolve + 22], [0, 1], out);
  // He says "higher than a million" long before he has finished arguing it, so
  // the ">" lands on those words in the read state and only turns over to the
  // accent once the argument closes.
  const gtP = interpolate(frame, [beats.claim, beats.claim + 14], [0, 1], out);

  // The count is the through-line: it opens exactly as the last scene left it
  // (dim, settled), is lifted back into question, and resolves as the claim.
  const countAlpha = interpolate(
    frame,
    [0, beats.question, beats.question + 20],
    [0.26, 0.26, 0.9],
    ease,
  );
  const countColor = mix(ink, accent, resolve);
  const countScale =
    1 +
    0.1 *
      interpolate(frame, [beats.resolve, beats.resolve + 14, beats.resolve + 32], [0, 1, 0.7], out);

  const markP =
    interpolate(frame, [beats.mark, beats.mark + 14], [0, 1], out) *
    interpolate(frame, [beats.push + 6, beats.push + 22], [1, 0], ease);

  // The card writes from the moment it opens until the camera leaves, at
  // exactly tokensPerSecond. Frozen at the pull so it is not still racing while
  // it fades.
  const codeP =
    interpolate(frame, [beats.hero - 16, beats.hero + 8], [0, 1], ease) *
    interpolate(frame, [beats.pull + 2, beats.pull + 18], [1, 0], ease);
  const written =
    PREFILL +
    Math.max(0, Math.min(frame, beats.pull) - beats.hero) * (tokensPerSecond / FPS);
  let head = 0;
  while (head + 1 < STREAM.length && STREAM[head + 1].start <= written) head++;
  const frac = (written - STREAM[head].start) / STREAM[head].tokens;

  const code: React.ReactNode[] = [];
  if (codeP > 0.01) {
    for (let i = head; i > head - ROWS && i >= 0; i--) {
      const row = STREAM[i];
      // The head holds station at WRITE_Y and the block scrolls up under it, so
      // the live edge is always in the open band below the card.
      const y = WRITE_Y - (head - i) * LINE_H - frac * LINE_H;
      const w = (i === head ? written - row.start : row.tokens) * TOKEN_W;
      if (w <= 0) continue;
      // Fresh output is the machine's; it settles to raw material behind it.
      const fresh = Math.max(0, 1 - (head - i) / 2.2);
      const fade = interpolate(y, [CODE_TOP, CODE_TOP + 112], [0, 1], clamp);
      code.push(
        <rect
          key={i}
          x={row.x}
          y={y - BAR_H / 2}
          width={w}
          height={BAR_H}
          rx={BAR_H / 2}
          fill={mix(ink, accent, fresh)}
          opacity={(0.4 + 0.52 * fresh) * fade * codeP}
        />,
      );
    }
    code.push(
      <rect
        key="caret"
        x={STREAM[head].x + (written - STREAM[head].start) * TOKEN_W + 6}
        y={WRITE_Y - BAR_H / 2 - 4}
        width={5}
        height={BAR_H + 8}
        fill={accent}
        opacity={0.9 * codeP}
      />,
    );
  }

  const sweepX = interpolate(frame, [beats.better, beats.betterEnd], [SQ_X0 - 140, SQ_X1 + 140], ease);

  return (
    <AbsoluteFill>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <clipPath id="hm-sq" clipPathUnits="userSpaceOnUse">
            <rect x={SQ_X0} y={SQ_Y0} width={SQ} height={SQ} />
          </clipPath>
          <pattern
            id="hm-lattice"
            x={SQ_X0}
            y={SQ_Y0}
            width={C2}
            height={C2}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={C2 / 2} cy={C2 / 2} r={packR} fill={accent} />
          </pattern>
          <pattern
            id="hm-boost"
            x={SQ_X0}
            y={SQ_Y0}
            width={C2}
            height={C2}
            patternUnits="userSpaceOnUse"
          >
            <circle cx={C2 / 2} cy={C2 / 2} r={boostR} fill={accent} />
          </pattern>
          <linearGradient id="hm-sweep" gradientUnits="userSpaceOnUse" x1={sweepX - 130} x2={sweepX}>
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="hm-swept" maskUnits="userSpaceOnUse" x={SQ_X0} y={SQ_Y0} width={SQ} height={SQ}>
            <rect x={SQ_X0} y={SQ_Y0} width={SQ} height={SQ} fill="url(#hm-sweep)" />
          </mask>
          {/* The leading edge of the upgrade: a pass of light, not a colour. */}
          <linearGradient id="hm-band" gradientUnits="userSpaceOnUse" x1={sweepX - 170} x2={sweepX + 130}>
            <stop offset="0" stopColor="#000" />
            <stop offset="0.46" stopColor="#fff" />
            <stop offset="0.62" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <mask id="hm-banded" maskUnits="userSpaceOnUse" x={SQ_X0} y={SQ_Y0} width={SQ} height={SQ}>
            <rect x={SQ_X0} y={SQ_Y0} width={SQ} height={SQ} fill="url(#hm-band)" />
          </mask>
        </defs>

        {/* Shadow lives outside the camera transform, or its blur would scale
            with the push-in and bloom. */}
        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}} opacity={fieldOn}>
          {/* The gigawatt, entered and left. Clipping happens inside the camera
              transform, so the footprint's edges leave frame as we go in. */}
          <g transform={`translate(${MX} ${MY}) scale(${k}) translate(${-MX} ${-MY})`}>
            <g clipPath="url(#hm-sq)">
              <rect
                x={SQ_X0}
                y={SQ_Y0}
                width={SQ}
                height={SQ}
                fill="url(#hm-lattice)"
                opacity={fieldAlpha}
              />
              {/* Better hardware inside the same footprint: the field saturates
                  behind a sweep rather than spreading past its own boundary. */}
              {better > 0 && better < 1 ? (
                <>
                  <rect
                    x={SQ_X0}
                    y={SQ_Y0}
                    width={SQ}
                    height={SQ}
                    fill="url(#hm-boost)"
                    mask="url(#hm-swept)"
                    opacity={fieldAlpha}
                  />
                  <rect
                    x={SQ_X0}
                    y={SQ_Y0}
                    width={SQ}
                    height={SQ}
                    fill={mix(accent, ink, 0.5)}
                    mask="url(#hm-banded)"
                    opacity={0.62}
                  />
                </>
              ) : null}
              {better >= 1 ? (
                <rect
                  x={SQ_X0}
                  y={SQ_Y0}
                  width={SQ}
                  height={SQ}
                  fill="url(#hm-boost)"
                  opacity={fieldAlpha}
                />
              ) : null}
              {/* The one human, still in his cell until we are close enough to
                  see what the cell actually holds. */}
              <rect
                x={MX - C2 / 2}
                y={MY - C2 / 2}
                width={C2}
                height={C2}
                fill={ink}
                opacity={0.98 * humanP}
              />
            </g>

            <rect
              x={SQ_X0}
              y={SQ_Y0}
              width={SQ}
              height={SQ}
              fill="none"
              stroke={accent}
              strokeWidth={4}
              opacity={0.92}
            />
          </g>
        </g>

        {/* Corner brackets on the cell we are about to enter. */}
        {markP > 0 ? (
          <g
            stroke={ink}
            strokeWidth={3}
            fill="none"
            opacity={0.55 * markP}
            strokeLinecap="round"
            style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
          >
            {[
              [-1, -1],
              [1, -1],
              [-1, 1],
              [1, 1],
            ].map(([sx, sy], i) => (
              <path
                key={i}
                d={`M${MX + sx * 38 - sx * 17} ${MY + sy * 38} L${MX + sx * 38} ${MY + sy * 38} L${
                  MX + sx * 38
                } ${MY + sy * 38 - sy * 17}`}
              />
            ))}
          </g>
        ) : null}

        <g style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}>{code}</g>

        {/* Better hardware, in the same gigawatt: the count is not just past a
            million, it is still moving. */}
        {arrowP > 0.01 ? (
          <g
            stroke={accent}
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={arrowP}
            style={{filter: `drop-shadow(0 2px 6px ${shadow})`}}
            transform={`translate(0 ${(1 - arrowP) * 16})`}
          >
            <path d={`M765 ${COUNT_Y + 60} L765 ${COUNT_Y + 8}`} />
            <path d={`M747 ${COUNT_Y + 25} L765 ${COUNT_Y + 6} L783 ${COUNT_Y + 25}`} />
          </g>
        ) : null}
      </svg>

      {/* The unit, at the size the lattice said it was. Remotion's <Img> is what
          makes every frame wait for the photograph to decode. */}
      {cardP > 0.01 ? (
        <div
          style={{
            position: 'absolute',
            left: cardX - cardW / 2,
            top: cardY - cardH / 2,
            width: cardW,
            height: cardH,
            opacity: cardP,
            filter: `drop-shadow(0 2px 6px ${shadow})`,
          }}
        >
          <Img src={CARD} style={{width: '100%', height: '100%'}} />
        </div>
      ) : null}

      {/* The count. The ">" opens a slot rather than being reserved, so frame 0
          is centred exactly where the previous scene left the number. */}
      <div
        style={{
          position: 'absolute',
          top: COUNT_Y,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            ...face(62, 0.06),
            color: countColor,
            opacity: countAlpha,
            transform: `scale(${countScale})`,
            filter: `drop-shadow(0 2px 6px ${shadow})`,
          }}
        >
          {/* The slot opens on the word, nudging the digits across: right-
              aligned inside it so the glyph is never caught half-drawn. */}
          <span
            style={{
              display: 'inline-flex',
              justifyContent: 'flex-end',
              overflow: 'hidden',
              width: gtP * 60,
              opacity: gtP,
            }}
          >
            <span style={{marginRight: 16}}>{'>'}</span>
          </span>
          1,000,000
        </div>
      </div>

      <div style={{position: 'absolute', top: CAPTION_Y, left: 0, right: 0}}>
        <Line
          text="WHITE COLLAR WORKERS"
          size={38}
          color={ink}
          opacity={0.48 * capP}
          reveal={() => 1}
          shadow={shadow}
          tracking={0.11}
        />
      </div>

      <div style={{position: 'absolute', top: GW_Y, left: 0, right: 0}}>
        <Line
          text="1 GIGAWATT"
          size={44}
          color={ink}
          opacity={0.5 * capP}
          reveal={() => 1}
          shadow={shadow}
          tracking={0.11}
        />
      </div>

      <div style={{position: 'absolute', top: HERO_CY - HERO_H / 2 - 100, left: 0, right: 0}}>
        <Line
          text="1 × H100"
          size={48}
          color={ink}
          opacity={0.82 * labelP}
          reveal={() => 1}
          shadow={shadow}
          tracking={0.11}
        />
      </div>

      <div style={{position: 'absolute', top: 1392, left: 0, right: 0}}>
        <Line
          text="1T ACTIVE PARAMETERS"
          size={52}
          color={ink}
          opacity={0.88 * specP}
          reveal={(i) =>
            i < 2
              ? interpolate(frame, [beats.params, beats.params + 12], [0, 1], out)
              : interpolate(
                  frame,
                  [beats.paramsWord + i * 0.8, beats.paramsWord + i * 0.8 + 10],
                  [0, 1],
                  out,
                )
          }
          shadow={shadow}
          tracking={0.11}
        />
      </div>

      <div style={{position: 'absolute', top: 1472, left: 0, right: 0}}>
        <Line
          text="50 TOKENS / SEC"
          size={52}
          color={accent}
          opacity={0.95 * specP}
          reveal={(i) =>
            i < 2
              ? interpolate(frame, [beats.rate, beats.rate + 12], [0, 1], out)
              : interpolate(
                  frame,
                  [beats.rateWord + i * 0.8, beats.rateWord + i * 0.8 + 10],
                  [0, 1],
                  out,
                )
          }
          shadow={shadow}
          tracking={0.11}
        />
      </div>

    </AbsoluteFill>
  );
};

export default HigherThanAMillion;
