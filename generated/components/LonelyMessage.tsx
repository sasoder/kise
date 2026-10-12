import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  BLACK,
  BLUE,
  CAM_DAMP,
  CAM_STIFF,
  CHAIN_STAGGER,
  CROWN_STEP,
  EASE_LAND,
  ORANGE,
  OP_LOW,
  PURPLE,
  PaperGround,
  SHADOW_OFF,
  STROKE,
  WHITE,
  camMove169,
  clamp,
  fontFamily,
  sway,
} from "./cerroShared";

// ---------------------------------------------------------------------------
// "LONELY MESSAGE" — CM_EARLY_JS trailer (Core Memory podcast), 16:9 round.
// 2048 x 1080 (the 4096 x 2160 sequence at half size; final is --scale 2),
// 24000/1001 fps, opaque, no audio. Sequence 41.583-46.129 s, 109 frames.
//
// CHECK LINE: "This is a real message a stranger sends him: 'I'm so lonely,
// can you please design and sell something to me that will solve my
// loneliness?' And it is one of many."
//
// THE PICTURE: a messaging window in the core memory look: one wide white
// panel on its hard black shadow on the dimmed squared paper. LEFT, narrow:
// the inbox column: "INBOX" + a blue counter badge, and five unread rows, each
// a small BLUE person avatar, two text-bars and a flat one-colour source badge
// (an "in" tile or an envelope). RIGHT, wide: the open conversation. The
// message is typed in a compose box along the BOTTOM of the thread, nearly the
// full width of the conversation, black Barlow 800 at 85 px, three lines; the
// thread above it carries two faint earlier bubbles from the same sender, as
// unreadable grey bars. BLUE = a lonely person. No name, photo, date, emoji.
//
// v2 (director's notes): message ~20% larger and nearly full width; compose
// box at the bottom growing upward; two faint earlier bubbles; the send
// travels 200 px and leaves an empty compose box behind; a paper plane flies
// off; send at f91, everything landed by f106; inbox wider, nothing at the
// frame edge at f0.
//
// WORD -> FRAME (spoken onset, local) and when the word is fully typed:
//   I'm          0    there at f0, with the caret
//   so           2    f1          lonely.      6    f3
//   Can          17   f13         you          19   f15
//   please       23   f19         design       27   f23   (line 2 opens f17-27)
//   and          36   f32         sell         41   f37
//   something    45   f41         to           51   f47
//   me           58   f54         that         60   f56   (line 3 opens f49-59)
//   will         64   f60         solve        68   f64
//   my           87   f83         loneliness?  94   f91
//   SENT         91-106           END 109
//
// ONE CONTINUOUS MOTION:
//   f0-91   TYPED: each word is a quick run of letters landing 3-5 f before
//           its spoken onset; the caret rides the end of the text (solid while
//           typing, blinking in the pauses). The compose box grows UPWARD one
//           line at a time on EASE_LAND, pushing the two earlier bubbles up
//           the thread (they pass under the header rule).
//   f91     SENT: the caret goes; the bubble compresses 3.5% and releases
//           (f91-96) and travels 200 px up into the thread (f92-102), its
//           avatar with it; the earlier bubbles scroll out under the header.
//           An empty compose box is left where it was (it was behind the
//           bubble all along). The paper plane leaves the send disc and flies
//           off up and to the right, out of the frame (f92-102); a check mark DRAWS
//           in the disc (f97-103). In the inbox a sixth row (this message)
//           pushes in from under the header and the five move down one slot
//           (f93-103); the counter's 5 rolls out, the 6 rolls in (f95-101).
//   f91     THE ECHO, the cut's one chain moment: three copies of the bubble,
//           orange f91 / purple f93 / blue f95, rise 36 / 24 / 12 px from
//           behind it (11 f each, EASE_LAND; shortened from the house 22 so
//           the blue is home at f106) into a crown along its top edge.
//   f106-109 hold: slow camera creep, paper drift.
//
// THE CAMERA: the house damped tracker (CAM_STIFF / CAM_DAMP) on two keyed
// moves; the whole window is in frame from f0 (the compose box is at the
// bottom of it, so a tighter open would push the panel off the frame).
//   EASE BACK f-16..82  k 1.07 -> 1.00, the panel settling onto screen
//                       y 75-865; already moving at f0.
//   CREEP     f84..125  k 1.00 -> 0.982, the same direction, slower.
// The caption band (y > 880) stays empty throughout.
//
// 2048 FRAME: this file lays out its own 2048 x 1080 world (cerroShared's
// World is 1920 wide), camera centre on screen x 1024. PaperGround's image box
// is 3072 px wide and centred, so it covers the full 2048 with no bars.
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 109;
export const WIDTH = 2048;
export const HEIGHT = 1080;

export const schema = z.object({
  inboxCount: z.number().int(),
  beats: z.object({
    send: z.number(), // just ahead of "loneliness" — the bubble is sent
  }),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  inboxCount: 5,
  beats: { send: 91 },
});

// ---------------------------------------------------------------------------
// THE MESSAGE: [word, typing starts, fully typed]. A word's leading space is
// typed with it.
// ---------------------------------------------------------------------------
type Word = readonly [string, number, number];
const LINES: ReadonlyArray<ReadonlyArray<Word>> = [
  [
    ["I'm", -9, -6],
    ["so", 0, 1],
    ["lonely.", 1, 3],
    ["Can", 11, 13],
    ["you", 13, 15],
    ["please", 16, 19],
  ],
  [
    ["design", 20, 23],
    ["and", 30, 32],
    ["sell", 35, 37],
    ["something", 37, 41],
    ["to", 45, 47],
    ["me", 52, 54],
  ],
  [
    ["that", 54, 56],
    ["will", 58, 60],
    ["solve", 61, 64],
    ["my", 81, 83],
    ["loneliness?", 85, 91],
  ],
];
/** per line: the full string and each character's reveal frame */
const TYPED = LINES.map((words) => {
  let text = "";
  const at: number[] = [];
  words.forEach(([w, s, e], i) => {
    const chunk = (i === 0 ? "" : " ") + w;
    for (let j = 0; j < chunk.length; j++) {
      at.push(s + ((j + 1) * (e - s)) / chunk.length);
    }
    text += chunk;
  });
  return { text, at };
});
const TYPING_SPANS = LINES.flat().map(([, s, e]) => [s, e] as const);
/** frames at which lines 2 and 3 start to open (ahead of their first letter;
 *  line 3 early enough that the send disc is clear of "me") */
const LINE_OPEN = [-100, 17, 49];
const LINE_OPEN_FRAMES = 10;

// ---------------------------------------------------------------------------
// GEOMETRY (world px = screen px at k 1; the world is 2048 x 1080)
// ---------------------------------------------------------------------------
const PANEL = { x: 92, y: 70, w: 1864, h: 790, r: 30 };
const PANEL_B = PANEL.y + PANEL.h;
const HEAD_Y = 182; // the header rule
const COL_R = 496; // the inbox column's right rule

// inbox rows
const ROW_TOP = HEAD_Y + 5;
const ROW_H = (PANEL_B - 6 - ROW_TOP) / 6;
const ROW_AV_R = 38;
const ROW_AV_X = PANEL.x + 64;
const ROW_BAR_X = ROW_AV_X + ROW_AV_R + 22;
const ROW_BADGE_X = COL_R - 52; // the badge's centre
type RowSpec = readonly [number, number, "in" | "mail"];
// [first bar width, second bar width, badge] for the five earlier messages
const ROWS: ReadonlyArray<RowSpec> = [
  [156, 100, "mail"],
  [122, 156, "in"],
  [166, 74, "mail"],
  [108, 132, "in"],
  [148, 112, "mail"],
];
const NEW_ROW: RowSpec = [162, 128, "in"];

// the conversation
const AV_R = 44;
const AV_X = COL_R + 24 + AV_R;
const FONT = 85;
const LINE_H = 102;
const PAD_Y = 32;
const PAD_X = 40;
const BUB = { x: AV_X + AV_R + 24, w: 1302, r: 38 };
const COMPOSE_B = 842; // the compose box's bottom edge
const bubbleH = (lines: number) => 2 * PAD_Y + lines * LINE_H;
const SEND_R = 40;
const SEND_X = BUB.x + BUB.w - 22 - SEND_R;
const SLIDE_UP = 200;
const PANEL_C = PANEL.y + PANEL.h / 2;
// the two earlier bubbles, nearest first: [width, height, bar widths]
const EARLIER: ReadonlyArray<readonly [number, number, ReadonlyArray<number>]> = [
  [620, 112, [500]],
  [860, 156, [740, 420]],
];
const EARLIER_GAP = 36;
const ECHO_TRAVEL = 11;

// ---------------------------------------------------------------------------
// THE CAMERA
// ---------------------------------------------------------------------------
const LIFT = 70; // content centre on screen y 470
const CAM_F0 = -16;
const M0 = camMove169({
  f0: CAM_F0,
  f1: 82,
  k0: 1.07,
  k1: 1.0,
  c0: PANEL_C + 14,
  c1: PANEL_C,
  x0: WIDTH / 2,
  x1: WIDTH / 2,
  lift: LIFT,
});
const M1 = camMove169({
  f0: 84,
  f1: 125,
  k0: 1.0,
  k1: 0.982,
  c0: PANEL_C,
  c1: PANEL_C,
  x0: WIDTH / 2,
  x1: WIDTH / 2,
  lift: LIFT,
});
export const CAM = {
  F: [...M0.F, ...M1.F],
  K: [...M0.K, ...M1.K],
  CY: [...M0.CY, ...M1.CY],
  CX: [...M0.CX, ...M1.CX],
};
/** The house tracker, started at the first key (f-16) so f0 is in motion. */
export const camAt = (upto: number) => {
  let cy = CAM.CY[0];
  let cx = CAM.CX[0];
  let k = CAM.K[0];
  let vy = 0;
  let vx = 0;
  let vk = 0;
  for (let f = CAM_F0 + 1; f <= upto; f++) {
    const ty = interpolate(f, CAM.F, CAM.CY, clamp);
    const tx = interpolate(f, CAM.F, CAM.CX, clamp);
    const tk = interpolate(f, CAM.F, CAM.K, clamp);
    vy += (ty - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
    vx += (tx - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, cx, k };
};

// ---------------------------------------------------------------------------
// PARTS
// ---------------------------------------------------------------------------
/** A blue person avatar: a disc on its hard shadow, a white head and shoulders. */
const Avatar: React.FC<{ x: number; y: number; r: number; id: string }> = ({ x, y, r, id }) => (
  <g>
    <defs>
      <clipPath id={id}>
        <circle cx={x} cy={y} r={r} />
      </clipPath>
    </defs>
    <circle cx={x + SHADOW_OFF} cy={y + SHADOW_OFF} r={r} fill={BLACK} />
    <circle cx={x} cy={y} r={r} fill={BLUE} />
    <g clipPath={`url(#${id})`}>
      <circle cx={x} cy={y - r * 0.2} r={r * 0.34} fill={WHITE} />
      <ellipse cx={x} cy={y + r * 0.92} rx={r * 0.64} ry={r * 0.58} fill={WHITE} />
    </g>
  </g>
);

/** The flat source badges, one colour, 48 px, centred on (x, y). */
const Badge: React.FC<{ kind: "in" | "mail"; x: number; y: number }> = ({ kind, x, y }) =>
  kind === "in" ? (
    <g>
      <rect x={x - 24} y={y - 24} width={48} height={48} rx={9} fill={BLACK} />
      <text
        x={x}
        y={y + 12}
        textAnchor="middle"
        fill={WHITE}
        style={{ fontFamily, fontWeight: 900, fontSize: 35 }}
      >
        in
      </text>
    </g>
  ) : (
    <g fill="none" stroke={BLACK} strokeWidth={STROKE} strokeLinejoin="round">
      <rect x={x - 25} y={y - 17} width={50} height={34} rx={3} />
      <path d={`M${x - 25} ${y - 15} L${x} ${y + 3} L${x + 25} ${y - 15}`} />
    </g>
  );

const Row: React.FC<{ top: number; spec: RowSpec; id: string }> = ({ top, spec, id }) => {
  const cy = top + ROW_H / 2;
  return (
    <g>
      <Avatar x={ROW_AV_X} y={cy} r={ROW_AV_R} id={id} />
      <rect x={ROW_BAR_X} y={cy - 26} width={spec[0]} height={20} fill={BLACK} />
      <rect x={ROW_BAR_X} y={cy + 8} width={spec[1]} height={20} fill={BLACK} opacity={OP_LOW} />
      <Badge kind={spec[2]} x={ROW_BADGE_X} y={cy} />
    </g>
  );
};

const SEND_EASE = Easing.bezier(0.3, 0, 0.2, 1);
// the paper plane, pointing right, centred on the origin
const PLANE = "M-19 -17 L23 0 L-19 17 L-9 0 Z";

const LonelyMessage: React.FC<Props> = ({ inboxCount, beats }) => {
  const frame = useCurrentFrame();
  const send = beats.send;

  // -- the camera ------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const tx = WIDTH / 2 - cx * k;
  const ty = HEIGHT / 2 - cy * k;

  // -- the bubble: grows upward a line at a time, compresses, travels up -------
  const lines =
    1 +
    interpolate(frame, [LINE_OPEN[1], LINE_OPEN[1] + LINE_OPEN_FRAMES], [0, 1], {
      easing: EASE_LAND,
      ...clamp,
    }) +
    interpolate(frame, [LINE_OPEN[2], LINE_OPEN[2] + LINE_OPEN_FRAMES], [0, 1], {
      easing: EASE_LAND,
      ...clamp,
    });
  const H = bubbleH(lines);
  const bot = COMPOSE_B;
  const top = bot - H;
  const slideT = interpolate(frame, [send + 1, send + 11], [0, 1], { easing: SEND_EASE, ...clamp });
  const slide = -SLIDE_UP * slideT;
  const squash = interpolate(frame, [send, send + 2, send + 5], [1, 0.965, 1], {
    easing: Easing.inOut(Easing.quad),
    ...clamp,
  });
  const bcx = BUB.x + BUB.w / 2;
  const bcy = top + H / 2;
  const bubbleTransform = `translate(0 ${slide.toFixed(3)}) translate(${bcx} ${bcy}) scale(${squash.toFixed(4)}) translate(${-bcx} ${-bcy})`;

  // the bubble's silhouette (rounded box + the tail toward the avatar),
  // grown by `g` world px all round: g = STROKE draws the black outline
  const shape = (fill: string, g: number, tail = true) => (
    <g fill={fill} stroke={g ? fill : "none"} strokeWidth={2 * g} strokeLinejoin="round">
      <rect x={BUB.x} y={top} width={BUB.w} height={H} rx={BUB.r} />
      {tail ? <path d={`M${BUB.x} ${bot - 62} L${BUB.x - 22} ${bot} L${BUB.x + 46} ${bot} Z`} /> : null}
    </g>
  );

  // the earlier bubbles ride above the compose box and scroll out on the send
  const earlierShift = -(H - bubbleH(1)) + slide * 1.35;
  const composeTop1 = bot - bubbleH(1);

  // -- typing -------------------------------------------------------------------
  const typed = TYPED.map((l) => {
    let n = 0;
    while (n < l.at.length && l.at[n] <= frame + 1e-6) n++;
    return l.text.slice(0, n);
  });
  let caretLine = 0;
  typed.forEach((t, i) => {
    if (t.length) caretLine = i;
  });
  const typingNow = TYPING_SPANS.some(([s, e]) => frame >= s - 1 && frame <= e + 3);
  const caretOn = frame < send && (typingNow || frame % 12 < 7);

  // -- sent: the plane, the check, the inbox row, the counter ---------------------
  const sendY = bot - PAD_Y - LINE_H / 2;
  const planeT = interpolate(frame, [send + 1, send + 11], [0, 1], {
    easing: Easing.in(Easing.quad),
    ...clamp,
  });
  // up and to the right, growing a little as it leaves the disc
  const planeAt = `translate(${(SEND_X + 320 * planeT).toFixed(2)} ${(sendY - 150 * planeT).toFixed(2)}) rotate(${(-25 * Math.min(1, planeT * 4)).toFixed(2)}) scale(${(1 + 0.7 * Math.min(1, planeT * 4)).toFixed(3)})`;
  const planeRest = `translate(${SEND_X} ${sendY})`;
  const checkT = interpolate(frame, [send + 6, send + 12], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const push = interpolate(frame, [send + 2, send + 12], [0, 1], { easing: EASE_LAND, ...clamp });
  const roll = interpolate(frame, [send + 4, send + 10], [0, 1], { easing: EASE_LAND, ...clamp });
  const CHECK_LEN = 62;
  const BADGE = { x: COL_R - 78, y: (PANEL.y + HEAD_Y) / 2 + 2, r: 36 };

  let earlierY = composeTop1 - EARLIER_GAP;

  return (
    <AbsoluteFill style={{ backgroundColor: "#C0C0C0" }}>
      <PaperGround frame={frame} cx={cx} cy={cy} cxRest={CAM.CX[0]} cyRest={CAM.CY[0]} k={k} />
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WIDTH,
            height: HEIGHT,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WIDTH}
            height={HEIGHT}
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              <clipPath id="lm-rows">
                <rect x={PANEL.x} y={HEAD_Y + 3} width={COL_R - PANEL.x} height={PANEL_B - HEAD_Y - 3} />
              </clipPath>
              <clipPath id="lm-thread">
                <rect x={COL_R + 3} y={HEAD_Y + 3} width={PANEL.x + PANEL.w - COL_R - 3} height={PANEL_B - HEAD_Y - 3} />
              </clipPath>
              <clipPath id="lm-count">
                <circle cx={BADGE.x} cy={BADGE.y} r={BADGE.r} />
              </clipPath>
              <clipPath id="lm-send">
                <circle cx={SEND_X} cy={sendY} r={SEND_R} />
              </clipPath>
            </defs>

            {/* THE WINDOW: one white panel on its hard shadow */}
            <rect
              x={PANEL.x + SHADOW_OFF}
              y={PANEL.y + SHADOW_OFF}
              width={PANEL.w}
              height={PANEL.h}
              rx={PANEL.r}
              fill={BLACK}
            />
            <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={PANEL.r} fill={WHITE} />
            <rect x={PANEL.x} y={HEAD_Y - STROKE / 2} width={PANEL.w} height={STROKE} fill={BLACK} />
            <rect x={COL_R - STROKE / 2} y={PANEL.y} width={STROKE} height={PANEL.h} fill={BLACK} />

            {/* inbox header: the word and the counter */}
            <text
              x={PANEL.x + 30}
              y={BADGE.y + 21}
              fill={BLACK}
              style={{ fontFamily, fontWeight: 900, fontSize: 58, letterSpacing: "0.02em" }}
            >
              INBOX
            </text>
            <circle cx={BADGE.x + SHADOW_OFF} cy={BADGE.y + SHADOW_OFF} r={BADGE.r} fill={BLACK} />
            <circle cx={BADGE.x} cy={BADGE.y} r={BADGE.r} fill={BLUE} />
            <g clipPath="url(#lm-count)">
              {[inboxCount, inboxCount + 1].map((n, i) => (
                <text
                  key={n}
                  x={BADGE.x}
                  y={BADGE.y + 17 + (i - roll) * 2 * BADGE.r}
                  textAnchor="middle"
                  fill={WHITE}
                  style={{ fontFamily, fontWeight: 900, fontSize: 48 }}
                >
                  {n}
                </text>
              ))}
            </g>

            {/* conversation header: where this thread lives, no name */}
            <Badge kind="in" x={COL_R + 60} y={BADGE.y} />
            <rect x={COL_R + 104} y={BADGE.y - 24} width={260} height={20} fill={BLACK} />
            <rect x={COL_R + 104} y={BADGE.y + 8} width={156} height={20} fill={BLACK} opacity={OP_LOW} />

            {/* the inbox rows; the sixth pushes in from under the header */}
            <g clipPath="url(#lm-rows)">
              <Row top={ROW_TOP + (push - 1) * ROW_H} spec={NEW_ROW} id="lm-av-new" />
              {ROWS.map((spec, i) => (
                <Row key={i} top={ROW_TOP + (i + push) * ROW_H} spec={spec} id={`lm-av-${i}`} />
              ))}
            </g>

            {/* the thread: two faint earlier bubbles, as bars */}
            <g clipPath="url(#lm-thread)">
              <g transform={`translate(0 ${earlierShift.toFixed(3)})`} opacity={OP_LOW}>
                {EARLIER.map(([w, h, bars], i) => {
                  const y = earlierY - h;
                  earlierY = y - EARLIER_GAP + 12;
                  return (
                    <g key={i}>
                      <rect
                        x={BUB.x}
                        y={y}
                        width={w}
                        height={h}
                        rx={BUB.r}
                        fill={WHITE}
                        stroke={BLACK}
                        strokeWidth={STROKE}
                      />
                      {bars.map((bw, j) => (
                        <rect key={j} x={BUB.x + PAD_X} y={y + 44 + j * 44} width={bw} height={24} fill={BLACK} />
                      ))}
                    </g>
                  );
                })}
              </g>
            </g>

            {/* the empty compose box the sent bubble leaves behind (it sits
                behind the bubble until the bubble travels up) */}
            <rect
              x={BUB.x}
              y={composeTop1}
              width={BUB.w}
              height={bubbleH(1)}
              rx={BUB.r}
              fill={WHITE}
              stroke={BLACK}
              strokeWidth={STROKE}
            />
            <rect
              x={BUB.x + PAD_X}
              y={composeTop1 + bubbleH(1) / 2 - 12}
              width={360}
              height={24}
              fill={BLACK}
              opacity={OP_LOW}
            />

            {/* THE MESSAGE */}
            <g transform={`translate(0 ${slide.toFixed(3)})`}>
              <Avatar x={AV_X} y={bot - AV_R + 2} r={AV_R} id="lm-av-main" />
            </g>
            <g transform={bubbleTransform}>
              <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>{shape(BLACK, STROKE)}</g>
              {/* the echo: orange / purple / blue rise from behind the bubble */}
              {[ORANGE, PURPLE, BLUE].map((col, i) => {
                const f0 = send + i * CHAIN_STAGGER;
                if (frame < f0) return null;
                const t = interpolate(frame, [f0, f0 + ECHO_TRAVEL], [0, 1], {
                  easing: EASE_LAND,
                  ...clamp,
                });
                return (
                  <g key={col} transform={`translate(0 ${(-t * CROWN_STEP * (3 - i)).toFixed(3)})`}>
                    {shape(col, STROKE, false)}
                  </g>
                );
              })}
              {shape(BLACK, STROKE)}
              {shape(WHITE, 0)}

              {/* the send disc: the plane flies off up and right (black once
                  it is outside the disc), then the check draws */}
              {planeT > 0 ? <path d={PLANE} transform={planeAt} fill={BLACK} /> : null}
              <circle cx={SEND_X} cy={sendY} r={SEND_R} fill={BLACK} />
              <g clipPath="url(#lm-send)">
                <path d={PLANE} transform={planeT > 0 ? planeAt : planeRest} fill={WHITE} />
                {checkT > 0 ? (
                  <path
                    d={`M${SEND_X - 20} ${sendY + 1} L${SEND_X - 6} ${sendY + 15} L${SEND_X + 21} ${sendY - 14}`}
                    fill="none"
                    stroke={WHITE}
                    strokeWidth={STROKE + 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={`${CHECK_LEN} ${CHECK_LEN}`}
                    strokeDashoffset={CHECK_LEN * (1 - checkT)}
                  />
                ) : null}
              </g>
            </g>
          </svg>

          {/* the typed text, on the bubble, under the bubble's own transform */}
          <div
            style={{
              position: "absolute",
              left: BUB.x + PAD_X,
              top: top + PAD_Y,
              transformOrigin: `${bcx - BUB.x - PAD_X}px ${bcy - top - PAD_Y}px`,
              transform: `translate(0px, ${slide.toFixed(3)}px) scale(${squash.toFixed(4)})`,
              fontFamily,
              fontWeight: 800,
              fontSize: FONT,
              lineHeight: `${LINE_H}px`,
              color: BLACK,
              whiteSpace: "pre",
            }}
          >
            {typed.map((t, i) =>
              t.length ? (
                <div key={i} style={{ height: LINE_H }}>
                  {t}
                  {i === caretLine && frame < send ? (
                    <span
                      style={{
                        display: "inline-block",
                        width: 8,
                        height: FONT * 0.92,
                        marginLeft: 6,
                        verticalAlign: "-0.14em",
                        backgroundColor: caretOn ? BLUE : "transparent",
                      }}
                    />
                  ) : null}
                </div>
              ) : null,
            )}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default LonelyMessage;
