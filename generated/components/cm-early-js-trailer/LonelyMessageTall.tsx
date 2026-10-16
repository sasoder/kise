import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { CAM_DAMP, CAM_STIFF, camMove169 } from "../kits/core-memory/cerroShared";
import {
  BLACK,
  BLUE,
  CHAIN_STAGGER,
  CROWN_STEP,
  EASE_LAND,
  FRAME_H,
  FRAME_W,
  ORANGE,
  OP_LOW,
  PURPLE,
  SHADOW_OFF,
  STROKE,
  TallPaper,
  WHITE,
  clamp,
  fontFamily,
  sway,
  worldTransformTall,
} from "../kits/core-memory/deathCountShared";
import { DURATION, FPS, defaultProps, schema, type Props } from "./LonelyMessage";

// ---------------------------------------------------------------------------
// "LONELY MESSAGE", PORTRAIT — the approved 16:9 LonelyMessage recomposed for
// the vertical cut: 1080 x 1920, 24000/1001 fps, 109 frames, opaque, no audio.
// Same content, style and cue frames as LonelyMessage.tsx (its schema, props,
// FPS and DURATION are imported; its word timings are copied exactly).
//
// CHECK LINE: "This is a real message a stranger sends him: 'I'm so lonely,
// can you please design and sell something to me that will solve my
// loneliness?' And it is one of many."
//
// THE PICTURE: the same messaging window as a phone-shaped column, x 70-1010,
// y 140-1240. The INBOX is a compact band across the TOP: "INBOX" + the blue
// counter, and the unread messages as one row of chips (blue avatar + source
// badge). Under it the open conversation: its header ("in" tile + bars), three
// faint earlier bar-bubbles, and the message typed in a compose box along the
// BOTTOM, nearly the full panel width, black Barlow 800 at 78 px, re-wrapped
// on five lines:
//   I'm so lonely. / Can you please design / and sell something /
//   to me that will solve / my loneliness?
// Below y 1240 there is only paper (the caption zone).
//
// CUES — identical to the 16:9 final:
//   every word is fully typed on the same frame (so f1, lonely. f3, Can f13,
//   you f15, please f19, design f23, and f32, sell f37, something f41, to f47,
//   me f54, that f56, will f60, solve f64, my f83, loneliness? f91);
//   SENT f91: squash f91-96, travel up f92-102 (180 px here), plane f92-101,
//   check f97-103, the sixth inbox chip f93-103, counter 5 -> 6 f95-101, echo
//   orange f91 / purple f93 / blue f95, 11 f each, home at f106.
// What differs is only the wrap: the compose box opens a line at f8, f19, f42
// and f60 (each ahead of the line's first letter, and early enough that the
// send disc on the last line is clear of the line above as it fills).
//
// THE CAMERA: the house damped tracker, zooming about the panel's centre:
//   EASE BACK f-16..82  k 1.04 -> 1.00, the panel's bottom edge held at
//                       screen y <= 1240 throughout.
//   CREEP     f84..125  k 1.00 -> 0.982.
// ---------------------------------------------------------------------------

export { DURATION, FPS, defaultProps, schema };

// ---------------------------------------------------------------------------
// THE MESSAGE: [word, typing starts, fully typed] — the 16:9 timings, re-wrapped
// ---------------------------------------------------------------------------
type Word = readonly [string, number, number];
const LINES: ReadonlyArray<ReadonlyArray<Word>> = [
  [
    ["I'm", -9, -6],
    ["so", 0, 1],
    ["lonely.", 1, 3],
  ],
  [
    ["Can", 11, 13],
    ["you", 13, 15],
    ["please", 16, 19],
    ["design", 20, 23],
  ],
  [
    ["and", 30, 32],
    ["sell", 35, 37],
    ["something", 37, 41],
  ],
  [
    ["to", 45, 47],
    ["me", 52, 54],
    ["that", 54, 56],
    ["will", 58, 60],
    ["solve", 61, 64],
  ],
  [
    ["my", 81, 83],
    ["loneliness?", 85, 91],
  ],
];
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
/** frames at which lines 2..5 start to open */
const LINE_OPEN = [8, 19, 42, 60];
const LINE_OPEN_FRAMES = 10;

// ---------------------------------------------------------------------------
// GEOMETRY (world px = screen px at k 1)
// ---------------------------------------------------------------------------
const PANEL = { x: 70, y: 140, w: 940, h: 1100, r: 30 };
const PANEL_R = PANEL.x + PANEL.w;
const PANEL_B = PANEL.y + PANEL.h;
const PANEL_C = PANEL.y + PANEL.h / 2;
const INBOX_Y = 240; // rule under "INBOX"
const CHIPS_Y = 352; // rule under the chips
const HEAD_Y = 446; // rule under the conversation header

// the inbox chips: avatar + badge, six slots across
const CHIP_PITCH = (PANEL.w - 8) / 6;
const CHIP_X0 = PANEL.x + 4;
const CHIP_AV_R = 34;
const CHIP_CY = (INBOX_Y + CHIPS_Y) / 2;
type Kind = "in" | "mail";
const CHIPS: ReadonlyArray<Kind> = ["mail", "in", "mail", "in", "mail"];
const NEW_CHIP: Kind = "in";

// the conversation
const AV_R = 32;
const AV_X = PANEL.x + 14 + AV_R;
const FONT = 78;
const LINE_H = 94;
const PAD_Y = 28;
const PAD_X = 32;
const BUB = { x: AV_X + AV_R + 16, r: 36, w: 0 };
BUB.w = PANEL_R - 16 - BUB.x;
const COMPOSE_B = PANEL_B - 18;
const bubbleH = (lines: number) => 2 * PAD_Y + lines * LINE_H;
const SEND_R = 36;
const SEND_X = BUB.x + BUB.w - 18 - SEND_R;
const SLIDE_UP = 180;
// the earlier bubbles, nearest first: [width, height, bar widths]
const EARLIER: ReadonlyArray<readonly [number, number, ReadonlyArray<number>]> = [
  [520, 108, [400]],
  [720, 152, [600, 340]],
  [600, 152, [480, 420]],
];
const EARLIER_GAP = 30;
const ECHO_TRAVEL = 11;

// ---------------------------------------------------------------------------
// THE CAMERA (the panel's centre sits on screen y PANEL_C)
// ---------------------------------------------------------------------------
const CAM_F0 = -16;
const K_OPEN = 1.04;
const M0 = camMove169({
  f0: CAM_F0,
  f1: 82,
  k0: K_OPEN,
  k1: 1.0,
  // keeps the panel's bottom edge on screen y 1240 at the open
  c0: PANEL_B - PANEL.h / 2 / K_OPEN,
  c1: PANEL_C,
  x0: FRAME_W / 2,
  x1: FRAME_W / 2,
  lift: 0,
});
const M1 = camMove169({
  f0: 84,
  f1: 125,
  k0: 1.0,
  k1: 0.982,
  c0: PANEL_C,
  c1: PANEL_C,
  x0: FRAME_W / 2,
  x1: FRAME_W / 2,
  lift: 0,
});
export const CAM = {
  F: [...M0.F, ...M1.F],
  K: [...M0.K, ...M1.K],
  CY: [...M0.CY, ...M1.CY],
  CX: [...M0.CX, ...M1.CX],
};
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
// PARTS (the 16:9 drawing, unchanged)
// ---------------------------------------------------------------------------
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

const Badge: React.FC<{ kind: Kind; x: number; y: number }> = ({ kind, x, y }) =>
  kind === "in" ? (
    <g>
      <rect x={x - 24} y={y - 24} width={48} height={48} rx={9} fill={BLACK} />
      <text x={x} y={y + 12} textAnchor="middle" fill={WHITE} style={{ fontFamily, fontWeight: 900, fontSize: 35 }}>
        in
      </text>
    </g>
  ) : (
    <g fill="none" stroke={BLACK} strokeWidth={STROKE} strokeLinejoin="round">
      <rect x={x - 25} y={y - 17} width={50} height={34} rx={3} />
      <path d={`M${x - 25} ${y - 15} L${x} ${y + 3} L${x + 25} ${y - 15}`} />
    </g>
  );

/** one unread message as a chip: avatar + source badge; `slot` may be fractional */
const Chip: React.FC<{ slot: number; kind: Kind; id: string }> = ({ slot, kind, id }) => {
  const x = CHIP_X0 + slot * CHIP_PITCH;
  return (
    <g>
      <Avatar x={x + 14 + CHIP_AV_R} y={CHIP_CY} r={CHIP_AV_R} id={id} />
      <Badge kind={kind} x={x + 14 + 2 * CHIP_AV_R + 12 + 25} y={CHIP_CY} />
    </g>
  );
};

const SEND_EASE = Easing.bezier(0.3, 0, 0.2, 1);
const PLANE = "M-19 -17 L23 0 L-19 17 L-9 0 Z";

const LonelyMessageTall: React.FC<Props> = ({ inboxCount, beats }) => {
  const frame = useCurrentFrame();
  const send = beats.send;

  // -- the camera ------------------------------------------------------------
  const cam = camAt(frame);
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx + drift.dx;
  const cy = cam.cy + drift.dy;
  const world = worldTransformTall(cx, cy, k, FRAME_W / 2, PANEL_C);

  // -- the bubble: grows upward a line at a time, compresses, travels up -------
  const lines =
    1 +
    LINE_OPEN.reduce(
      (n, f0) => n + interpolate(frame, [f0, f0 + LINE_OPEN_FRAMES], [0, 1], { easing: EASE_LAND, ...clamp }),
      0,
    );
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

  const shape = (fill: string, g: number, tail = true) => (
    <g fill={fill} stroke={g ? fill : "none"} strokeWidth={2 * g} strokeLinejoin="round">
      <rect x={BUB.x} y={top} width={BUB.w} height={H} rx={BUB.r} />
      {tail ? <path d={`M${BUB.x} ${bot - 56} L${BUB.x - 16} ${bot} L${BUB.x + 44} ${bot} Z`} /> : null}
    </g>
  );

  // the earlier bubbles ride above the compose box and scroll out on the send
  const earlierShift = -(H - bubbleH(1)) + slide * 1.35;
  const composeTop1 = bot - bubbleH(1);
  const earlier = EARLIER.reduce<{ y: number; w: number; h: number; bars: ReadonlyArray<number> }[]>(
    (acc, [w, h, bars]) => {
      const below = acc.length ? acc[acc.length - 1].y : composeTop1;
      acc.push({ y: below - EARLIER_GAP - h, w, h, bars });
      return acc;
    },
    [],
  );

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

  // -- sent: the plane, the check, the inbox chip, the counter --------------------
  const sendY = bot - PAD_Y - LINE_H / 2;
  const planeT = interpolate(frame, [send + 1, send + 11], [0, 1], {
    easing: Easing.in(Easing.quad),
    ...clamp,
  });
  const planeAt = `translate(${(SEND_X + 320 * planeT).toFixed(2)} ${(sendY - 150 * planeT).toFixed(2)}) rotate(${(-25 * Math.min(1, planeT * 4)).toFixed(2)}) scale(${(1 + 0.7 * Math.min(1, planeT * 4)).toFixed(3)})`;
  const planeRest = `translate(${SEND_X} ${sendY})`;
  const checkT = interpolate(frame, [send + 6, send + 12], [0, 1], {
    easing: Easing.out(Easing.cubic),
    ...clamp,
  });
  const push = interpolate(frame, [send + 2, send + 12], [0, 1], { easing: EASE_LAND, ...clamp });
  const roll = interpolate(frame, [send + 4, send + 10], [0, 1], { easing: EASE_LAND, ...clamp });
  const CHECK_LEN = 56;
  const BADGE = { x: PANEL.x + 290, y: (PANEL.y + INBOX_Y) / 2 + 2, r: 36 };
  const HEAD_C = (CHIPS_Y + HEAD_Y) / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: "#C0C0C0" }}>
      <TallPaper frame={frame} cx={cx} cy={cy} k={k} cxRest={CAM.CX[0]} cyRest={CAM.CY[0]} />
      <AbsoluteFill>
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: world.css,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              <clipPath id="lmt-chips">
                <rect x={PANEL.x} y={INBOX_Y + 3} width={PANEL.w} height={CHIPS_Y - INBOX_Y - 6} />
              </clipPath>
              <clipPath id="lmt-thread">
                <rect x={PANEL.x} y={HEAD_Y + 3} width={PANEL.w} height={PANEL_B - HEAD_Y - 3} />
              </clipPath>
              <clipPath id="lmt-count">
                <circle cx={BADGE.x} cy={BADGE.y} r={BADGE.r} />
              </clipPath>
              <clipPath id="lmt-send">
                <circle cx={SEND_X} cy={sendY} r={SEND_R} />
              </clipPath>
            </defs>

            {/* THE WINDOW */}
            <rect
              x={PANEL.x + SHADOW_OFF}
              y={PANEL.y + SHADOW_OFF}
              width={PANEL.w}
              height={PANEL.h}
              rx={PANEL.r}
              fill={BLACK}
            />
            <rect x={PANEL.x} y={PANEL.y} width={PANEL.w} height={PANEL.h} rx={PANEL.r} fill={WHITE} />
            {[INBOX_Y, CHIPS_Y, HEAD_Y].map((y, i) => (
              <rect
                key={y}
                x={PANEL.x}
                y={y - STROKE / 2}
                width={PANEL.w}
                height={STROKE}
                fill={BLACK}
                opacity={i === 0 ? OP_LOW : 1}
              />
            ))}

            {/* inbox band: the word and the counter */}
            <text
              x={PANEL.x + 30}
              y={BADGE.y + 22}
              fill={BLACK}
              style={{ fontFamily, fontWeight: 900, fontSize: 62, letterSpacing: "0.02em" }}
            >
              INBOX
            </text>
            <circle cx={BADGE.x + SHADOW_OFF} cy={BADGE.y + SHADOW_OFF} r={BADGE.r} fill={BLACK} />
            <circle cx={BADGE.x} cy={BADGE.y} r={BADGE.r} fill={BLUE} />
            <g clipPath="url(#lmt-count)">
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

            {/* the unread messages as chips; the sixth pushes in from the left */}
            <g clipPath="url(#lmt-chips)">
              <Chip slot={push - 1} kind={NEW_CHIP} id="lmt-av-new" />
              {CHIPS.map((kind, i) => (
                <Chip key={i} slot={i + push} kind={kind} id={`lmt-av-${i}`} />
              ))}
            </g>

            {/* conversation header: where this thread lives, no name */}
            <Badge kind="in" x={PANEL.x + 54} y={HEAD_C} />
            <rect x={PANEL.x + 98} y={HEAD_C - 24} width={260} height={20} fill={BLACK} />
            <rect x={PANEL.x + 98} y={HEAD_C + 8} width={156} height={20} fill={BLACK} opacity={OP_LOW} />

            {/* the thread: faint earlier bubbles, as bars */}
            <g clipPath="url(#lmt-thread)">
              <g transform={`translate(0 ${earlierShift.toFixed(3)})`} opacity={OP_LOW}>
                {earlier.map((e, i) => (
                  <g key={i}>
                    <rect
                      x={BUB.x}
                      y={e.y}
                      width={e.w}
                      height={e.h}
                      rx={BUB.r}
                      fill={WHITE}
                      stroke={BLACK}
                      strokeWidth={STROKE}
                    />
                    {e.bars.map((bw, j) => (
                      <rect key={j} x={BUB.x + PAD_X} y={e.y + 42 + j * 44} width={bw} height={24} fill={BLACK} />
                    ))}
                  </g>
                ))}
              </g>
            </g>

            {/* the empty compose box the sent bubble leaves behind */}
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
              width={300}
              height={24}
              fill={BLACK}
              opacity={OP_LOW}
            />

            {/* THE MESSAGE */}
            <g transform={`translate(0 ${slide.toFixed(3)})`}>
              <Avatar x={AV_X} y={bot - AV_R + 2} r={AV_R} id="lmt-av-main" />
            </g>
            <g transform={bubbleTransform}>
              <g transform={`translate(${SHADOW_OFF} ${SHADOW_OFF})`}>{shape(BLACK, STROKE)}</g>
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

              {planeT > 0 ? <path d={PLANE} transform={planeAt} fill={BLACK} /> : null}
              <circle cx={SEND_X} cy={sendY} r={SEND_R} fill={BLACK} />
              <g clipPath="url(#lmt-send)">
                <path d={PLANE} transform={planeT > 0 ? planeAt : planeRest} fill={WHITE} />
                {checkT > 0 ? (
                  <path
                    d={`M${SEND_X - 18} ${sendY + 1} L${SEND_X - 5} ${sendY + 14} L${SEND_X + 19} ${sendY - 12}`}
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

export default LonelyMessageTall;
