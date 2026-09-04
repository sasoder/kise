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
import {z} from 'zod';

export const FPS = 30;
// 00:00:26.359 -> 00:00:38.880 of the source cut: round(12.521 * 30).
export const DURATION = 376;

// The merchant's own surface. It is drawn once and never moves again — the
// whole scene exists to establish a frame the redirect cannot break.
const P = {x: 170, y: 60, w: 740, h: 772, r: 40};
const PAD = 46;

// Everything Stripe brings sits inside that frame.
const ROW = {x: P.x + PAD, y: 500, w: P.w - PAD * 2, h: 104, r: 24};
const PAY = {x: P.x + PAD, y: 646, w: P.w - PAD * 2, h: 96, r: 24};

const BUBBLES = [
  {side: 'bot' as const, y: 150, w: 320, h: 86, born: 85},
  {side: 'user' as const, y: 262, w: 270, h: 78, born: 97},
  {side: 'bot' as const, y: 366, w: 350, h: 94, born: 109},
];

// The agent's own column, left of everything it says.
const BOT = {x: 226, y: 193, size: 88};
const BOT_LEFT = 290;

const LOGO = {w: 283, h: 118, y: 902};

const roundedRect = (x: number, y: number, w: number, h: number, r: number) =>
  [
    `M${x + r} ${y}`,
    `H${x + w - r}`,
    `A${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V${y + h - r}`,
    `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H${x + r}`,
    `A${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    `V${y + r}`,
    `A${r} ${r} 0 0 1 ${x + r} ${y}`,
    'Z',
  ].join(' ');

const rgbOf = (hex: string) => {
  const h = hex.replace('#', '');
  const n =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
};

const ease = (frame: number, from: number, to: number) =>
  interpolate(frame, [from, to], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  inkStrong: z.number().min(0).max(1),
  inkSoft: z.number().min(0).max(1),
  ghostOpacity: z.number().min(0).max(1),
  // Black glyphs in public/, recoloured by filter. The wordmark keeps its own
  // colour: it is a brand mark, not a shape.
  botIcon: z.string(),
  logo: z.string(),
  // How far the copy of the experience gets before it is pulled back.
  escape: z.number().min(0).max(600),
  // Beat frames from the SRT at 30fps, relative to 00:00:26.359:
  //   0 "the second is" · 48 "connecting" · 63 "their existing" · 85 "website chat"
  //   109 "experience or" · 133 "chatbots" (mark lands early, at 118)
  //   150 "to stripe" · 188 "customers to"
  //   217 "complete" · 232 "purchases" · 247 "within their existing experience"
  //   311 "the need to be" · 340 "redirected" · 362 "off of it"
  beats: z.object({
    panel: z.number().int(),
    panelEnd: z.number().int(),
    chat: z.number().int(),
    chatbots: z.number().int(),
    stripe: z.number().int(),
    customers: z.number().int(),
    within: z.number().int(),
    complete: z.number().int(),
    purchases: z.number().int(),
    leave: z.number().int(),
    redirected: z.number().int(),
    settle: z.number().int(),
  }),
});

export type ChatCheckoutNoRedirectProps = z.infer<typeof schema>;

export const defaultProps: ChatCheckoutNoRedirectProps = schema.parse({
  ink: '#FFFFFF',
  accent: '#635BFF',
  inkStrong: 0.9,
  inkSoft: 0.42,
  ghostOpacity: 0.46,
  botIcon: 'ai-sparkles.png',
  logo: 'stripe-wordmark.png',
  escape: 190,
  beats: {
    panel: 0,
    panelEnd: 66,
    chat: 85,
    chatbots: 118,
    stripe: 150,
    customers: 188,
    within: 247,
    complete: 217,
    purchases: 232,
    leave: 311,
    redirected: 340,
    settle: 362,
  },
});

const ChatCheckoutNoRedirect: React.FC<ChatCheckoutNoRedirectProps> = ({
  ink,
  accent,
  inkStrong,
  inkSoft,
  ghostOpacity,
  botIcon,
  logo,
  escape,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const [ir, ig, ib] = rgbOf(ink);

  // The frame draws itself: "connecting their existing…".
  const draw = interpolate(frame, [beats.panel, beats.panelEnd], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bot = ease(frame, beats.chatbots, beats.chatbots + 16);
  const stripe = ease(frame, beats.stripe, beats.stripe + 18);
  const wire = ease(frame, beats.stripe + 5, beats.stripe + 20);
  const row = ease(frame, beats.customers, beats.customers + 18);
  const pay = ease(frame, beats.complete - 12, beats.complete + 6);
  const check = interpolate(frame, [beats.purchases - 2, beats.purchases + 16], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const paid = interpolate(
    frame,
    [beats.purchases, beats.purchases + 9, beats.purchases + 30],
    [0, 1, 0],
    {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // The redirect that does not happen: a copy of the experience gets loose,
  // hits the edge on "redirected", and is pulled back inside.
  const out = interpolate(frame, [beats.leave, beats.redirected], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const back = interpolate(frame, [beats.redirected, beats.redirected + 18], [0, 1], {
    easing: Easing.bezier(0.4, 0, 0.2, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ghost = out * (1 - back);
  // The wall is derived from the copy's own travel, so the two cannot drift.
  const wall = interpolate(ghost, [0.55, 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // "within their existing experience", and again once the copy has been pulled
  // back: the frame reasserts itself instead of moving. Resolves before the
  // last frame so the end is held.
  const bump = (at: number, up: number, down: number) =>
    interpolate(frame, [at, at + up, at + up + down], [0, 1, 0], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  const emphasis = Math.max(bump(beats.within, 8, 26), bump(beats.settle, 6, 6));

  const panelPath = roundedRect(P.x, P.y, P.w, P.h, P.r);
  const bubbleOpacity = inkStrong;

  const checkPath = `M${PAY.x + PAY.w / 2 - 34} ${PAY.y + PAY.h / 2 + 2} L${
    PAY.x + PAY.w / 2 - 10
  } ${PAY.y + PAY.h / 2 + 24} L${PAY.x + PAY.w / 2 + 38} ${PAY.y + PAY.h / 2 - 24}`;

  return (
    <AbsoluteFill>
      <svg width={0} height={0} style={{position: 'absolute'}}>
        <defs>
          <filter id="chat-ink" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values={`0 0 0 0 ${ir} 0 0 0 0 ${ig} 0 0 0 0 ${ib} 0 0 0 1 0`}
            />
          </filter>
        </defs>
      </svg>

      {/* The copy that tries to leave. Outline only: it is not a real place. */}
      {ghost > 0.002 ? (
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{position: 'absolute'}}
        >
          <path
            d={panelPath}
            fill="none"
            stroke={ink}
            strokeWidth={7}
            opacity={ghostOpacity * Math.min(1, ghost * 2.4)}
            transform={
              `translate(${(escape * ghost).toFixed(2)} ${(-70 * ghost).toFixed(2)}) ` +
              `translate(540 446) scale(${(1 - 0.18 * ghost).toFixed(4)}) translate(-540 -446)`
            }
          />
        </svg>
      ) : null}

      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <g>
          {/* The frame itself. */}
          <path
            d={panelPath}
            fill="none"
            stroke={ink}
            strokeWidth={7 + 5 * emphasis}
            opacity={inkStrong + (1 - inkStrong) * emphasis}
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />

          {/* The wall that holds on "redirected". */}
          {wall > 0.002 ? (
            <path
              d={`M${P.x + P.w} ${P.y + P.r} V${P.y + P.h - P.r}`}
              fill="none"
              stroke={accent}
              strokeWidth={12 + 5 * wall}
              strokeLinecap="round"
              opacity={wall}
            />
          ) : null}

          {BUBBLES.map((b, i) => {
            const t = ease(frame, b.born, b.born + 16);
            if (t <= 0.002) return null;
            const x = b.side === 'bot' ? BOT_LEFT : P.x + P.w - PAD - b.w;
            const bars = b.side === 'bot' ? 2 : 1;
            return (
              <g
                key={i}
                opacity={t * bubbleOpacity}
                transform={`translate(0 ${(14 * (1 - t)).toFixed(2)})`}
              >
                <path
                  d={roundedRect(x, b.y, b.w, b.h, 28)}
                  fill="none"
                  stroke={ink}
                  strokeWidth={6}
                />
                {Array.from({length: bars}, (_, j) => (
                  <line
                    key={j}
                    x1={x + 30}
                    y1={b.y + b.h / 2 + (bars === 2 ? (j === 0 ? -18 : 18) : 0)}
                    x2={x + b.w - (j === 1 ? 96 : 30)}
                    y2={b.y + b.h / 2 + (bars === 2 ? (j === 0 ? -18 : 18) : 0)}
                    stroke={ink}
                    strokeWidth={12}
                    strokeLinecap="round"
                    opacity={inkSoft / inkStrong}
                  />
                ))}
              </g>
            );
          })}

          {/* What Stripe adds, in accent, inside the merchant's frame. */}
          {row > 0.002 ? (
            <g opacity={row} transform={`translate(0 ${(20 * (1 - row)).toFixed(2)})`}>
              <path
                d={roundedRect(ROW.x, ROW.y, ROW.w, ROW.h, ROW.r)}
                fill="none"
                stroke={accent}
                strokeWidth={6}
              />
              <path
                d={roundedRect(ROW.x + 22, ROW.y + 22, 60, 60, 16)}
                fill="none"
                stroke={accent}
                strokeWidth={6}
              />
              <line
                x1={ROW.x + 108}
                y1={ROW.y + 40}
                x2={ROW.x + 320}
                y2={ROW.y + 40}
                stroke={accent}
                strokeWidth={11}
                strokeLinecap="round"
                opacity={0.55}
              />
              <line
                x1={ROW.x + 108}
                y1={ROW.y + 70}
                x2={ROW.x + 238}
                y2={ROW.y + 70}
                stroke={accent}
                strokeWidth={11}
                strokeLinecap="round"
                opacity={0.55}
              />
            </g>
          ) : null}

          {pay > 0.002 ? (
            <g opacity={pay} transform={`translate(0 ${(20 * (1 - pay)).toFixed(2)})`}>
              <path
                d={roundedRect(
                  PAY.x - 9 * paid,
                  PAY.y - 9 * paid,
                  PAY.w + 18 * paid,
                  PAY.h + 18 * paid,
                  PAY.r + 4 * paid,
                )}
                fill="none"
                stroke={accent}
                strokeWidth={7}
              />
              {/* The label gives way to the completed purchase. */}
              <line
                x1={PAY.x + PAY.w / 2 - 78}
                y1={PAY.y + PAY.h / 2}
                x2={PAY.x + PAY.w / 2 + 78}
                y2={PAY.y + PAY.h / 2}
                stroke={accent}
                strokeWidth={13}
                strokeLinecap="round"
                opacity={0.6 * (1 - Math.min(1, check * 2.2))}
              />
              {check > 0.002 ? (
                <path
                  d={checkPath}
                  fill="none"
                  stroke={accent}
                  strokeWidth={14}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - check}
                />
              ) : null}
            </g>
          ) : null}

          {/* "to stripe": the connection into the frame. */}
          {wire > 0.002 ? (
            <path
              d={`M540 ${P.y + P.h} V${LOGO.y - 16}`}
              fill="none"
              stroke={ink}
              strokeWidth={7}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - wire}
            />
          ) : null}
        </g>
      </svg>

      {bot > 0.002 ? (
        <Img
          src={staticFile(botIcon)}
          style={{
            position: 'absolute',
            left: BOT.x - BOT.size / 2,
            top: BOT.y - BOT.size / 2,
            width: BOT.size,
            height: BOT.size,
            opacity: bot * inkStrong,
            transform: `scale(${(0.7 + 0.3 * bot).toFixed(4)})`,
            transformOrigin: 'center center',
            filter: 'url(#chat-ink)',
          }}
        />
      ) : null}

      {stripe > 0.002 ? (
        <Img
          src={staticFile(logo)}
          style={{
            position: 'absolute',
            left: 540 - LOGO.w / 2,
            top: LOGO.y + 18 * (1 - stripe),
            width: LOGO.w,
            height: LOGO.h,
            opacity: stripe,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

export default ChatCheckoutNoRedirect;
