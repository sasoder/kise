// ---------------------------------------------------------------------------
// chatScreen (wip-biblical, cut 0's): a chat drawn in the page's inks, laid onto a photographed laptop screen through a
// projective map. Screen space is SCREEN_W x SCREEN_H; `quadMatrix3d` maps it onto any four corners in plane px.
//   deep-green ink: the user's question bubble (at the top right) and the empty prompt bar (at the bottom)
//   red ink: the reply, word blocks printing on line by line, with a block cursor at the tip
// Text is drawn as word blocks, not letters: it reads as text at every size and is never read as a line of type.
// ---------------------------------------------------------------------------
import React from "react";
import { random } from "remotion";
import { InkPrint, RED, THEMES } from "../kits/works-in-progress/wipShared";

export const SCREEN_W = 1000;
export const SCREEN_H = 625;

export type Pt = [number, number];
/**
 * CSS matrix3d (transform-origin 0 0) that maps the w x h box onto the quad tl, tr, br, bl (plane px), as a camera would.
 */
export const quadMatrix3d = (w: number, h: number, [p0, p1, p2, p3]: [Pt, Pt, Pt, Pt]) => {
  const [x0, y0] = p0;
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / den;
  const hh = (dx1 * dy3 - dx3 * dy1) / den;
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + hh * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + hh * y3;
  // from unit square to the box's px
  const m = [a / w, d / w, 0, g / w, b / h, e / h, 0, hh / h, 0, 0, 1, 0, x0, y0, 0, 1];
  return `matrix3d(${m.join(",")})`;
};

// -- the reply: lines of word blocks ---------------------------------------------------------------------------
const LEFT = 60;
const RIGHT = 940;
const FIRST_Y = 168;
const LINE_DY = 60;
const BLOCK_H = 26;
const GAP = 18;
export const REPLY_LINES = 6;
type Word = { x: number; w: number };
const LINES: Word[][] = Array.from({ length: REPLY_LINES }, (_, li) => {
  // the last line of the paragraph is short; the others run nearly to the margin
  const end = li === REPLY_LINES - 1 ? LEFT + 0.42 * (RIGHT - LEFT) : RIGHT - random(`chat-end-${li}`) * 110;
  const words: Word[] = [];
  let x = LEFT;
  let k = 0;
  while (x < end - 30) {
    const w = Math.min(end - x, 48 + random(`chat-w-${li}-${k}`) ** 1.6 * 150);
    words.push({ x, w });
    x += w + GAP;
    k++;
  }
  return words;
});
/** Total word blocks, in reading order. */
export const REPLY_WORDS = LINES.reduce((s, l) => s + l.length, 0);

/**
 * The chat. `shown` = how many reply words have printed (fractional: the next word is printing), counted in reading
 * order; `cursor` 0..1 the block cursor's ink. Ink colours are for the mint page (they multiply).
 */
export const ChatScreen: React.FC<{ shown: number; cursor: number; seed?: string }> = ({ shown, cursor, seed = "chat" }) => {
  const deep = THEMES.mint.ink;
  let n = 0;
  let tip: { x: number; y: number } | null = null;
  const words: React.ReactNode[] = [];
  LINES.forEach((line, li) => {
    const y = FIRST_Y + li * LINE_DY;
    line.forEach((wd, wi) => {
      const p = Math.max(0, Math.min(1, shown - n));
      n++;
      if (p <= 0) return;
      // a word prints whole, at full ink: streamed text, word by word
      words.push(<rect key={`${li}-${wi}`} x={wd.x} y={y} width={wd.w} height={BLOCK_H} rx={3} fill="currentColor" />);
      tip = { x: wd.x + wd.w + GAP * 0.6, y };
    });
  });
  if (!tip) tip = { x: LEFT, y: FIRST_Y };
  const t = tip as { x: number; y: number };
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: SCREEN_W, height: SCREEN_H }}>
      {/* the question: a filled bubble at the top right with its words reversed out */}
      <InkPrint x={0} y={0} w={SCREEN_W} h={SCREEN_H} ink={deep} seed={`${seed}-q`} rough={1.2} wear={0.12} misregister={1}>
        <svg width={SCREEN_W} height={SCREEN_H} viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <path
            fill="currentColor"
            fillRule="evenodd"
            d={[
              "M480 34 H900 A44 44 0 0 1 900 122 H480 A44 44 0 0 1 480 34 Z",
              "M486 66 H584 V90 H486 Z",
              "M602 66 H738 V90 H602 Z",
              "M756 66 H826 V90 H756 Z",
              "M844 66 H904 V90 H844 Z",
            ].join(" ")}
          />
          {/* the prompt bar, empty, at the foot of the screen */}
          <path
            fill="currentColor"
            fillRule="evenodd"
            d={[
              "M100 528 H900 A40 40 0 0 1 900 608 H100 A40 40 0 0 1 100 528 Z",
              "M100 538 H900 A30 30 0 0 1 900 598 H100 A30 30 0 0 1 100 538 Z",
            ].join(" ")}
          />
          <circle cx={896} cy={568} r={24} fill="currentColor" />
        </svg>
      </InkPrint>
      {/* the reply, in red */}
      <InkPrint x={0} y={0} w={SCREEN_W} h={SCREEN_H} ink={RED} seed={`${seed}-r`} rough={1.2} wear={0.12} misregister={1}>
        <svg width={SCREEN_W} height={SCREEN_H} viewBox={`0 0 ${SCREEN_W} ${SCREEN_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
          {words}
          {cursor > 0 ? <rect x={t.x} y={t.y - 5} width={16} height={BLOCK_H + 10} fill="currentColor" opacity={cursor} /> : null}
        </svg>
      </InkPrint>
    </div>
  );
};
