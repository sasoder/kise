import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Barlow';
import {z} from 'zod';

// Seamus Blackley emails Bill Gates for a job.
// A compose card typed live on the beats. Two rows only: a "To" line and the
// body. The show's chain colours appear once, in the card's entrance; the
// caret is a plain white block (the coloured trail was tried and cut).
//
// 1. Card rises (bar slides up + fades in; "To" label + hairline enter with the
//    chain slide-up) — "and I wrote an email"
// 2. Address types `billg` / `@` / `microsoft.com` on the beats — "bill g at microsoft"
// 3. Caret returns to the body line — "I'm like"
// 4. Body types `Hey, could` / ` I have a job?` on the beats — "hey could I have a job?"
// 5. Caret blinks whenever idle — the writer's pause; the ambient layer that
//    keeps the holds alive.

const {fontFamily} = loadFont('normal', {
  weights: ['700', '800'],
  subsets: ['latin'],
});

export const FPS = 24;
export const DURATION = 125;

export const schema = z.object({
  address: z.string(),
  body: z.string(),
  // Where the "hey could" burst ends and the "I have a job?" burst begins.
  bodySplitIndex: z.number().int().min(1),
  cardWidth: z.number().min(400).max(1040),
  centerY: z.number().min(200).max(1720),
  fontSize: z.number().min(40).max(80),
  beats: z.object({
    wroteAn: z.number(), // "and i wrote an"
    emailBill: z.number(), // "email bill"
    gAt: z.number(), // "g at"
    microsoft: z.number(), // "microsoft"
    imLike: z.number(), // "i'm like"
    heyCould: z.number(), // "hey could"
    iHaveAJob: z.number(), // "i have a job?"
    end: z.number(), // cue 25 ends
  }),
});

export type BillGEmailProps = z.infer<typeof schema>;

export const defaultProps: BillGEmailProps = schema.parse({
  address: 'billg@microsoft.com',
  body: 'Hey, could I have a job?',
  bodySplitIndex: 10, // "Hey, could" | " I have a job?"
  cardWidth: 940,
  centerY: 560,
  fontSize: 60,
  beats: {
    wroteAn: 0,
    emailBill: 13,
    gAt: 24,
    microsoft: 38,
    imLike: 55,
    heyCould: 67,
    iHaveAJob: 82,
    end: 101,
  },
});

// ---- Card geometry ----
const PAD_X = 60;
const PAD_Y = 44;
const LABEL_SIZE = 34;
const LABEL_GAP = 28;
const RULE_PAD = 22;
const RULE_H = 2;

// ---- Caret ----
const CARET_W = 7;
const CARET_GAP = 6; // gap after the last typed glyph; 0 on an empty line
const CARET_DROP = 6; // how far the caret hangs below the baseline
const CARET_IN = 6; // the caret cuts in with the white core

// ---- Chain entrance (core memory podcast style) ----
const CHAIN_COLORS = ['#FFB765', '#BC37FF', '#0046FF']; // orange, purple, blue
const STAGGER = 2;
const TRAVEL = 22;
const RISE = 90;
const CORE_DELAY = CHAIN_COLORS.length * STAGGER; // 6
// The core is translucent (0.55), so the colours would show through it forever.
// They stop being rendered the frame the core has landed.
const CHAIN_CUTOFF = CORE_DELAY + TRAVEL; // 28

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Characters of one burst land evenly across its window; a character is either
// on or off. `end` is 2 frames before the next beat, so the word is finished
// before the next one is spoken.
const landFrames = (start: number, end: number, n: number): number[] => {
  if (n <= 0) return [];
  if (n === 1) return [start];
  const step = Math.max(1, (end - start) / (n - 1));
  return Array.from({length: n}, (_, i) => Math.round(start + i * step));
};

const typedCount = (frame: number, frames: number[]): number => {
  let n = 0;
  for (const f of frames) {
    if (f <= frame) n++;
  }
  return n;
};

type CaretState = {row: 0 | 1; prefix: string; t: number};

const BillGEmail: React.FC<BillGEmailProps> = ({
  address,
  body,
  bodySplitIndex,
  cardWidth,
  centerY,
  fontSize,
  beats,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // ---- Layout ----
  const innerW = cardWidth - PAD_X * 2;
  const rowH = Math.round(fontSize * 1.2);
  const ruleY = rowH + RULE_PAD;
  const row2Y = ruleY + RULE_H + RULE_PAD;
  const innerH = row2Y + rowH;
  const cardH = innerH + PAD_Y * 2;
  const caretH = fontSize * 0.78;

  // ---- Typing schedule, all derived from `beats` ----
  const at = address.indexOf('@');
  const local = address.slice(0, at); // "billg"
  const domain = address.slice(at + 1); // "microsoft.com"
  const addressFrames = [
    ...landFrames(beats.emailBill, beats.gAt - 2, local.length), // 13 -> 22
    ...landFrames(beats.gAt, beats.gAt, 1), // "@" lands on the beat, then idles
    ...landFrames(beats.microsoft, beats.imLike - 2, domain.length), // 38 -> 53
  ];
  const bodyFrames = [
    ...landFrames(beats.heyCould, beats.iHaveAJob - 2, bodySplitIndex), // 67 -> 80
    // The "?" lands 3 frames before the cue ends so the sentence is complete
    // and still on screen while the line is finishing.
    ...landFrames(beats.iHaveAJob, beats.end - 3, body.length - bodySplitIndex), // 82 -> 98
  ];

  // ---- Caret position at any frame ----
  const returnEnd = beats.imLike + 8; // the row-return runs f55 -> f63
  const caretStateAt = (f: number): CaretState => {
    if (f < beats.imLike) {
      return {row: 0, prefix: address.slice(0, typedCount(f, addressFrames)), t: 0};
    }
    if (f < returnEnd) {
      return {
        row: 0,
        prefix: address,
        t: interpolate(f, [beats.imLike, returnEnd], [0, 1], {
          easing: EASE,
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      };
    }
    return {row: 1, prefix: body.slice(0, typedCount(f, bodyFrames)), t: 0};
  };

  // ---- Blink: the caret rests ON for 8 idle frames, then 10 off / 14 on.
  // Anchored to the last move, so the writer's pause after "@" blinks once
  // (off f32-f37) and the final hold lands ON at the last frame. ----
  let lastMove = CARET_IN;
  for (const f of addressFrames) {
    if (f <= frame && f > lastMove) lastMove = f;
  }
  for (const f of bodyFrames) {
    if (f <= frame && f > lastMove) lastMove = f;
  }
  if (frame >= beats.imLike) {
    lastMove = Math.max(lastMove, Math.min(frame, returnEnd));
  }
  const idle = frame - lastMove;
  const blinkOn = idle < 8 || (idle - 8) % 24 >= 10;

  // ---- Entrance ----
  const barEnter = spring({
    frame,
    fps,
    config: {damping: 30, stiffness: 95, mass: 1},
  });
  const barSlide = interpolate(barEnter, [0, 1], [64, 0], {
    extrapolateRight: 'clamp',
  });
  const barOpacity = interpolate(barEnter, [0, 0.45], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // One shared slide sampled at a different start frame per layer. Nothing
  // fades: a layer simply is not rendered before its start frame.
  const chainOffset = (delay: number) => {
    const t = interpolate(frame, [delay, delay + TRAVEL], [0, 1], {
      easing: EASE,
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    return (1 - t) * RISE;
  };
  const coreOffset = chainOffset(CORE_DELAY);

  // ---- Shared type styles; the hidden measuring copies use the same objects
  // so a measured caret x is exactly the visible glyph advance. ----
  const textStyle: React.CSSProperties = {
    fontFamily,
    fontSize,
    fontWeight: 800,
    letterSpacing: -1,
    whiteSpace: 'pre',
  };
  const labelStyle: React.CSSProperties = {
    fontFamily,
    fontSize: LABEL_SIZE,
    fontWeight: 700,
    letterSpacing: 0,
    whiteSpace: 'pre',
  };
  const rowStyle = (top: number): React.CSSProperties => ({
    position: 'absolute',
    left: 0,
    top,
    height: rowH,
    lineHeight: `${rowH}px`,
    whiteSpace: 'pre',
    ...textStyle,
  });

  // The "To" label and the hairline are one subtree, duplicated per chain
  // layer in a flat colour.
  const LabelRule = (
    color: string,
    labelOpacity: number,
    ruleOpacity: number,
    dx: number,
    dy: number,
    key: string,
  ) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        inset: 0,
        transform: `translate(${dx}px, ${dy}px)`,
      }}
    >
      <div style={{...rowStyle(0), color}}>
        <span style={{...labelStyle, opacity: labelOpacity}}>To</span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: ruleY,
          width: innerW,
          height: RULE_H,
          backgroundColor: color,
          opacity: ruleOpacity,
        }}
      />
    </div>
  );

  // One hidden measuring row per caret layer: the typed prefix is rendered in
  // the real type at visibility:hidden and the caret block follows it inline,
  // so the caret lands on the true glyph advance with no JS measuring.
  const Caret = (color: string, dx: number, dy: number, key: string) => {
    const s = caretStateAt(Math.max(CARET_IN, frame));
    const top = (s.row === 0 ? 0 : row2Y) + dy;
    const gap = s.prefix.length > 0 ? CARET_GAP : 0;
    // translateX(-100%) of the wrapper is exactly -(caretX + CARET_W), so
    // adding t*CARET_W back lands the caret on the row-2 start x.
    const tx = `calc(${-s.t * 100}% + ${s.t * CARET_W}px)`;
    return (
      <div key={key} style={{...rowStyle(top), left: dx}}>
        <span
          style={{
            display: 'inline-block',
            transform: `translate(${tx}, ${s.t * row2Y}px)`,
          }}
        >
          {s.row === 0 ? (
            <>
              <span style={{...labelStyle, visibility: 'hidden'}}>To</span>
              <span style={{display: 'inline-block', width: LABEL_GAP}} />
            </>
          ) : null}
          <span style={{...textStyle, visibility: 'hidden'}}>{s.prefix}</span>
          <span
            style={{
              display: 'inline-block',
              verticalAlign: 'baseline',
              width: CARET_W,
              height: caretH,
              marginLeft: gap,
              marginBottom: -CARET_DROP,
              backgroundColor: color,
            }}
          />
        </span>
      </div>
    );
  };

  const typedAddress = address.slice(0, typedCount(frame, addressFrames));
  const typedBody = body.slice(0, typedCount(frame, bodyFrames));

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 540 - cardWidth / 2,
          top: centerY - cardH / 2,
          width: cardWidth,
          height: cardH,
          filter: 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.28))',
        }}
      >
        {/* Backing bar: slides up and fades in, exactly like the name tag. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: 14,
            opacity: barOpacity,
            transform: `translateY(${barSlide}px)`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: PAD_X,
            top: PAD_Y,
            width: innerW,
            height: innerH,
          }}
        >
          {/* Hard black copy of the core, at the very back, riding with it. */}
          {frame >= CORE_DELAY
            ? LabelRule('#000000', 1, 0.5, 2, coreOffset + 2, 'shadow')
            : null}

          {/* Chain: orange f0, purple f2, blue f4 — all land on the identical
              position, then stop being rendered once the core has landed. */}
          {CHAIN_COLORS.map((color, i) =>
            frame >= i * STAGGER && frame < CHAIN_CUTOFF
              ? LabelRule(color, 1, 1, 0, chainOffset(i * STAGGER), color)
              : null,
          )}

          {/* White core, last to arrive and on top. */}
          {frame >= CORE_DELAY
            ? LabelRule('#FFFFFF', 0.55, 0.22, 0, coreOffset, 'core')
            : null}

          {/* Row 1: the label's slot is reserved (the visible label is the core
              layer above) so the address starts on the true advance. */}
          <div style={rowStyle(0)}>
            <span style={{...labelStyle, visibility: 'hidden'}}>To</span>
            <span style={{display: 'inline-block', width: LABEL_GAP}} />
            <span
              style={{
                ...textStyle,
                color: '#FFFFFF',
                textShadow: '3px 3px 0 #000',
              }}
            >
              {typedAddress}
            </span>
          </div>

          {/* Row 2: the body. */}
          <div style={rowStyle(row2Y)}>
            <span
              style={{
                ...textStyle,
                color: '#FFFFFF',
                textShadow: '3px 3px 0 #000',
              }}
            >
              {typedBody}
            </span>
          </div>

          {/* The caret: a hard black shadow under a white block. */}
          {frame >= CARET_IN ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translateY(${coreOffset}px)`,
                opacity: blinkOn ? 1 : 0,
              }}
            >
              {Caret('#000000', 3, 3, 'caret-shadow')}
              {Caret('#FFFFFF', 0, 0, 'caret-core')}
            </div>
          ) : null}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default BillGEmail;
