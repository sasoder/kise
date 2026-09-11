import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camMove,
  clamp,
  iconShadow,
  runCamera,
  smoothstep,
  squirclePath,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  AXIS,
  CLAUDE_SIZE,
  CLAUDE_Y,
  K_REST,
  MARK_SIZE,
  MARK_Y,
  MODELS,
  Mark,
  PKT_R,
  THREAD_Y0,
  THREAD_Y1,
  THREAD_OPACITY,
  THREAD_W,
  packetAt,
  readoutStyle,
  siphonPackets,
  type Packet,
} from "./claudeDistilledShared";
import { CLAUDE } from "./brandGlyphs";

export const FPS = 24;
// John / Charles / Beren, clip `JohnCharlesBeren_Claude_Distilled`, cut 2:
// "...and they sort of develop these ticks... you find that they're reusing
// certain themes, and they're using the same character names all the time."
//
// The beats are a WORD-LEVEL transcription of the audio, not the SRT's cue
// boundaries — the SRT put the out-point at 20.019 and the words run 0.1s
// short of it. In-point is "they're" at 15.480, and a word's frame is
// round((t - 15.480) * 24):
//
//   word        f        word        f
//   they're     0        the        68
//   reusing     6        same       72
//   certain    17        character  77
//   themes     32        names      86
//   and        47        all        94
//   they're    55        the        99
//   using      63        time      102
//                        time ends 107  (19.920)
//
// `DURATION = 107 + 48 = 155`: speech ends at f107 and the editor gets a
// 2-second resolved hold to trim into rather than the 16 frames it had. The
// siphon and `sway` run through the tail, so it is never a still frame.
export const DURATION = 155;

// ---------------------------------------------------------------------------
// "The phrase comes down the wire". Cut 1 ended with the siphon running: Claude
// at the top, three open-weight marks hanging off it on accent threads, white
// packets flowing DOWN the wires into the models, continuously. This piece
// opens on exactly that world — same marks, same sizes, same positions, same
// threads, same packets, camera at rest where cut 1 left it (k 1.35, content
// centre 900) — and asks what comes OUT of the three models.
//
// What comes out writes as a text block under each mark: white bars, seven
// lines, and all three blocks have the identical silhouette — the same bar
// widths in the same order. That is "reusing certain themes". Then a packet
// comes down the wire, passes straight through the model and lands in the
// block, and where it lands the bar becomes a word in Söhne. Then again, and
// again: "all the time".
//
// The three landings are three different words and they land TOP TO BOTTOM —
// line 1, line 3, line 5 — so they assemble in speech order and the block
// reads down as one phrase at the end: `You're / absolutely / right!`. The
// same phrase, word for word, in all three blocks: that is the joke and it is
// also the line — the same output, every time, whoever you ask.
//
// Everything is the field's own material: white marks with the per-icon
// shadow, accent threads at stroke 3, white packets, white bars, three Söhne
// words. No boxes, no arrows, no cursors, no props, no flashes, no rings.
//
// Every gesture is one word. Nothing else happens.
//   the three blocks write, line by line, top to
//     bottom — each bar grows from width 0 over 6
//     frames, a new line every 3.5 frames, the
//     three blocks a beat apart (0, 1, 2 frames)
//     so they read as one event and never as
//     unison                                       — "certain themes" f17-46
//   THE ONE CAMERA MOVE: k 1.35 -> 1.41, content
//     centre 900 -> 800, warp 0.72, keyed f56-76
//     so the damper has it settled by f80 — the
//     words are read at ~45px on screen and the
//     content's own centre lands on 835           — "using the same" f56-80
//   three name packets leave Claude together, one
//     per thread, the same 5px white bead as the
//     ambient siphon; they run the wire, pass
//     straight through their mark and land on
//     line 1 at f80                                — "using the same" f63-80
//   on landing, line 1's bar collapses into its
//     right end while `You're` wipes in from the
//     left — one ease, 6 frames, all three blocks
//     together                                     — "names"          f80-86
//   two more name packets per thread, launched f77
//     and f84, land on line 3 at f94 (`absolutely`)
//     and line 5 at f101 (`right!`) and convert the
//     same way; the ambient packets keep running
//     between them                                 — "all" / "the time"
//                                                                     f77-107
//   hold resolved: three identical blocks reading
//     You're / bar / absolutely / bar / right! /
//     bar / bar, the siphon still running          — tail             f107-155
//
// ambient: `sway` on the camera and the siphon on the threads, f0 to the last
// frame. Not gestures; the siphon is what a running thing looks like.
//
// v2 pass: framing only. The camera inherited cut 1's content centre of 900,
// but this cut's content spans world y 485..1114 and centres on 800, so the
// whole piece sat ~100 world px high with the field empty below it, and the
// push to k 1.5 took the blocks out to screen x 30..1050 — inside the 60px side
// margin. The single move is now k 1.35 -> 1.41 and c 900 -> 800 on the same
// frames, the same warp and the same damper: f56 is still cut 1's last frame
// pixel-for-pixel, the push still reads, the blocks rest at screen x 60.6..1019
// and the content's own centre lands on screen y 835. Nothing else changed.
//
// harmony pass: everything this cut shares with cuts 1 and 3 now lives in
// `claudeDistilledShared.tsx` and is imported, never restated — the mark
// positions and sizes and the `Mark` helper, the thread geometry, the packet
// constants and `siphonPackets`, the Söhne face and its readout style, and
// `K_REST`. Not one number moved; the rewire renders to the byte.
//
// The same pass retimed the piece to a word-level transcription of the audio:
// the second and third name landings went f92 -> f94 ("all") and f99 -> f101
// ("the time"), their launches with them, and the tail went from 16 frames to
// 48 so the editor has two seconds of resolved hold to trim. The first landing
// (f80, converted by "names" at f86), the write-on, the camera and every
// mechanism are untouched. A bar's own growth went 5 frames to 6, the one
// transition in the piece short enough to read as a snap.
//
// And, on the director's note, the one name became three words. It was `Elara`
// three times; it is now `You're` / `absolutely` / `right!`, and the landings
// run top to bottom (line 1 f80, line 3 f94, line 5 f101) instead of middle,
// top, bottom, so the phrase assembles in speech order and reads down the
// block at the end. Same face, same size, same bar-to-word wipe, same three
// identical blocks, same landing frames — only which line each round lands on
// and what it writes there. The wipe width is now per word rather than one
// number, because the three are not the same length.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // the three threads, exactly as cut 1 draws them
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  // the per-icon shadow, in SCREEN px; divided by the camera's k at draw time
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  // the three landings, top to bottom: line 1, line 3, line 5
  words: z.array(z.string()).length(3),
  beats: z.object({
    reusing: z.number(), // "they're reusing"
    certainThemes: z.number(), // "certain themes"
    andTheyre: z.number(), // "and they're"
    usingTheSame: z.number(), // "using the same"
    character: z.number(), // "character"
    names: z.number(), // "names"
    all: z.number(), // "all"
    theTime: z.number(), // "the" — the last landing is this + 2
    end: z.number(), // speech ends; tail to 155
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  backgroundBase: BG_BASE,
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
  shadowY: SHADOW_Y,
  shadowBlur: SHADOW_BLUR,
  shadowOpacity: SHADOW_OPACITY,
  iconShadowY: ICON_SHADOW_Y,
  iconShadowBlur: ICON_SHADOW_BLUR,
  iconShadowOpacity: ICON_SHADOW_OPACITY,
  // a typographic apostrophe, not a typewriter one: this is display type at
  // 45 screen px and a straight quote reads as a stray tick at that size
  words: ["You\u2019re", "absolutely", "right!"],
  beats: {
    reusing: 0,
    certainThemes: 17,
    andTheyre: 47,
    usingTheSame: 63,
    character: 77,
    names: 86,
    all: 94,
    theTime: 99, // "the"; "time" is f102, and the third landing sits at 101
    end: 107, // "time" ends 19.920; the tail runs to 155
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// Layout, in world px. Everything above the blocks — Claude at (540, 560) at
// 150, the three marks at 104 on y 840, the thread from 640 to 780 and the
// beads that run it — is `claudeDistilledShared.tsx`, imported rather than
// re-decided: this is the same composition seconds later in the same edit, so a
// mark that moved or a thread that changed weight would read as a mistake.
// Phone-first, one centred column on x = 540.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// The blocks. One under each mark: seven lines of white bar, left-aligned 100px
// left of the mark's axis so each block is 200 wide (200..400, 440..640,
// 680..880) — three columns that read as three separate outputs and never
// touch. The bar widths are THE SAME in all three, in the same order: that
// identical silhouette is the whole of "they're reusing certain themes", and it
// has to be legible as identical at 270px wide.
//
// A bar is the field's own white shape, so its corners are `squirclePath` at
// the shared ratio — on a 14px-tall bar that is the 2px floor, a corner that is
// softened rather than drawn, the same as every other white shape in the set.
// ---------------------------------------------------------------------------
const BLOCK_TOP = 920; // the top of line 1
const LINE_PITCH = 30;
const BAR_H = 14;
const BAR_W = [150, 118, 170, 96, 140, 124, 160];
const BLOCK_HALF = 100;

const lineTop = (l: number) => BLOCK_TOP + l * LINE_PITCH;
const lineMid = (l: number) => lineTop(l) + BAR_H / 2;

// The phrase. Söhne Kräftig 32px, white, left-aligned on the bar's own left
// edge, baseline set so the word's x-height sits in the band the bar sat in —
// at this size Kräftig's x-height is ~16.6px against a 14px bar, so a baseline
// one pixel under the bar's bottom edge puts the letter bodies on the bar's
// line.
const NAME_SIZE = 32;
const NAME_BASELINE_DROP = BAR_H + 1;
// Each word's reveal width, measured off the render at 32px Kräftig with the
// piece's own -0.01em tracking, plus 2px of slack so a final letter is never
// shaved by the clip. Each one has to stay UNDER its own bar's width, because
// the bar collapses into its right end while the word wipes in from the left
// and the wipe front must never catch the bar's left edge:
// Measured off a full-res render of the resolved frame, as the ink's right edge
// in world px from the block's left edge:
//   line 1  "You’re"       85.8  vs a 150 bar
//   line 3  "absolutely"  146.1  vs a 170 bar  — the long one, and the one that
//                                                decides whether the phrase
//                                                fits at 32px. It does, with
//                                                24 world px to spare, so all
//                                                three stay at 32.
//   line 5  "right!"       73.1  vs a 140 bar
const NAME_W = [89, 149, 76];

// Which line becomes the name, in order. A packet leaves Claude, runs the wire,
// passes straight through its mark and lands in the block; the conversion
// starts from that landing and from nothing else, so the bead is visibly the
// thing that does it and the two cannot drift if this is retimed. Every run is
// PKT_RUN frames, so the launch is the landing counted backwards and the three
// beads of a round always leave together.
const CONV_DUR = 6;
const PKT_RUN = 17;

// The write-on: a new line every 3.5 frames, each bar growing on one ease-out,
// the three blocks a beat apart so they are never in unison.
//
// harmony pass: the growth was 5 frames and is 6. Nothing else in the piece
// moves in under 6 frames — the conversion is 6, the camera's settle is 25 —
// and a 5-frame bar was the one transition short enough to read as a snap
// rather than a stroke. The last bar (block 3, line 7) now starts at f40 and
// completes at f46, still clear of "and" at f47, so the write-on is still the
// whole of "certain themes" and nothing after it moved.
const WRITE_STAGGER = 3.5;
const WRITE_DUR = 6;
const BLOCK_OFFSET = [0, 1, 2];

// The siphon is cut 1's, `siphonPackets`. It has been running since cut 1, so
// it starts mid-flight: `PKT_N0` seeds it with enough history that f0 already
// has beads on every wire.
const PKT_N0 = -3;

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is a push-in that also tilts down. It opens
// exactly where cut 1 v2 stops — k 1.35, content centre 900 — because the two
// are seconds apart in one edit and the end frame of one IS the start frame of
// the next: every mark sits on the same screen pixel across the cut. It pushes
// to k 1.41 on "using the same", so the 32px word is read at 45px on screen
// when it arrives, and it walks the content centre from cut 1's inherited 900
// to this cut's own 800 (the content spans y 485..1114) so the piece is centred
// on the caption-safe line at screen y 835 instead of riding ~100px high over
// an empty field. k 1.41 is also the largest push this layout takes: the blocks
// run world x 200..880, which at 1.41 rests at screen x 60.6..1019.4, exactly
// on the 60px side margin. 1.5 put them at 30..1050, outside it.
//
// It is keyed f56-76 rather than f60-80. `runCamera` is a damped tracker, so
// the frame it is handed a key is not the frame the move is over: keyed f60-80
// the zoom was only 90% of the way at f80 and did not settle until ~f86, which
// is "names" — a camera still moving under the gesture it was supposed to make
// room for. Keyed four frames earlier the same eased curve is 97.5% there at
// f80 (the last 2.5% is 0.0006 k a frame, an order of magnitude under what
// reads as motion) and settled before "names". Nothing else moves the camera.
// ---------------------------------------------------------------------------
const K_OPEN = K_REST;
const K_CLOSE = 1.41;
const C_OPEN = 900;
const C_CLOSE = 800;
const CAM = camMove({
  f0: 56,
  f1: 76,
  k0: K_OPEN,
  k1: K_CLOSE,
  c0: C_OPEN,
  c1: C_CLOSE,
  warp: 0.72,
});
const CAM_F = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_CLOSE];
const CAM_CY = [C_OPEN + CAM_LIFT / K_OPEN, ...CAM.CY, C_CLOSE + CAM_LIFT / K_CLOSE];

const SameCharacterNames: React.FC<Props> = ({
  ink,
  accent,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  iconShadowY,
  iconShadowBlur,
  iconShadowOpacity,
  words,
  beats,
}) => {
  const frame = useCurrentFrame();

  // The three name rounds, each read straight off a word, and they land TOP TO
  // BOTTOM — line 1, then line 3, then line 5 — so the three words assemble in
  // speech order and the block reads down as one phrase at the end. Line 1
  // lands six frames before "names" so its 6-frame conversion completes ON the
  // word; line 3 lands on "all" (f94); line 5 lands at f101, in the gap between
  // "the" (f99) and "time" (f102), so the last word is written across the
  // phrase that closes the line rather than after it. Every launch is its
  // landing counted back PKT_RUN frames, so the three beads of a round always
  // leave together: f63, f77, f84.
  const nameEvents = [
    { line: 0, word: words[0], w: NAME_W[0], land: beats.names - CONV_DUR }, // 80, by "names" (86)
    { line: 2, word: words[1], w: NAME_W[1], land: beats.all }, // 94, on "all"
    { line: 4, word: words[2], w: NAME_W[2], land: beats.theTime + 2 }, // 101, across "the time"
  ];

  // -- the siphon ------------------------------------------------------------
  // Ambient, unchanged from cut 1 and running before this piece starts, so the
  // beads are placed off their own age and nothing else.
  const packets: Packet[] = siphonPackets(frame, { n0: PKT_N0 });

  // -- the name packets ------------------------------------------------------
  // The same bead as the siphon — same radius, same ink, same shadow; the
  // gesture is that THREE of them leave at once and keep going where the
  // ambient ones stop. Each runs a two-leg polyline (the wire, then straight
  // down through its own mark into the block) at ONE constant speed from launch
  // to landing: parameterising it by arc length is what keeps it from tripling
  // its speed as it leaves the wire, which at 24fps reads as a teleport rather
  // than as a dive.
  MODELS.forEach((mod, t) => {
    const legA = Math.hypot(mod.x - AXIS, THREAD_Y1 - THREAD_Y0);
    nameEvents.forEach((ev, e) => {
      const launch = ev.land - PKT_RUN;
      if (frame < launch || frame >= ev.land) return;
      const legB = lineMid(ev.line) - THREAD_Y1;
      const total = legA + legB;
      const arc = ((frame - launch) / PKT_RUN) * total;
      if (arc <= legA) {
        packets.push({ key: `n${t}-${e}`, ...packetAt(mod.x, arc / legA) });
      } else {
        packets.push({ key: `n${t}-${e}`, x: mod.x, y: THREAD_Y1 + (arc - legA) });
      }
    });
  });

  // -- the blocks ------------------------------------------------------------
  // Per line: how far it has been written, and how far it has been converted.
  // The conversion is read off its packet's landing frame, not off a beat of its
  // own, so the bead is visibly the thing that does it.
  const evOf = (l: number) => nameEvents.find((n) => n.line === l);

  const blocks = MODELS.map((mod, m) =>
    BAR_W.map((w, l) => {
      const t0 = beats.certainThemes + l * WRITE_STAGGER + BLOCK_OFFSET[m];
      const write = interpolate(frame, [t0, t0 + WRITE_DUR], [0, 1], {
        ...clamp,
        easing: Easing.out(Easing.cubic),
      });
      const ev = evOf(l);
      const conv = ev ? smoothstep((frame - ev.land) / CONV_DUR) : 0;
      const left = mod.x - BLOCK_HALF;
      // written: the left edge is fixed and the bar grows right.
      // converted: the right edge is fixed and the bar collapses into it, while
      // the name wipes in from the left behind it. The name is ~80 wide against
      // a 96-170 wide bar, so the wipe front never catches the collapsing bar.
      const barW = conv > 0 ? w * (1 - conv) : w * write;
      const barX = conv > 0 ? left + w * conv : left;
      return {
        left,
        top: lineTop(l),
        barX,
        barW,
        conv,
        word: ev ? ev.word : "",
        nameW: ev ? ev.w : 0,
      };
    }),
  );

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = AXIS + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the per-icon shadow ---------------------------------------------------
  // On every icon — the four marks, the beads, the bars and the names. Its
  // lengths are screen px divided by the camera's k, so it is the same shadow
  // before and after the push-in. The threads are the field, not icons.
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={frame}
        cy={cy}
        cyRest={CAM_CY[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{ filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))` }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            <defs>
              {blocks.map((blk, m) =>
                blk.map((b, l) =>
                  b.conv > 0 ? (
                    <clipPath key={`c${m}-${l}`} id={`scn-${m}-${l}`}>
                      <rect
                        x={b.left}
                        y={b.top - NAME_SIZE}
                        width={Math.max(0.01, b.nameW * b.conv)}
                        height={NAME_SIZE * 2}
                      />
                    </clipPath>
                  ) : null,
                ),
              )}
            </defs>

            {/* the threads, held where cut 1 left them */}
            {MODELS.map((mod, i) => (
              <line
                key={`t${i}`}
                x1={AXIS}
                y1={THREAD_Y0}
                x2={mod.x}
                y2={THREAD_Y1}
                stroke={accent}
                strokeWidth={THREAD_W}
                strokeLinecap="round"
                opacity={THREAD_OPACITY}
              />
            ))}

            {/* the siphon, plus the three name beads riding it */}
            <g style={{ filter: icon }}>
              {packets.map((p) => (
                <circle key={p.key} cx={p.x} cy={p.y} r={PKT_R} fill={ink} />
              ))}
            </g>

            {/* the marks */}
            <Mark glyph={CLAUDE} x={AXIS} y={CLAUDE_Y} size={CLAUDE_SIZE} ink={ink} shadow={icon} />
            {MODELS.map((mod, i) => (
              <Mark
                key={`m${i}`}
                glyph={mod.glyph}
                x={mod.x}
                y={MARK_Y}
                size={MARK_SIZE}
                ink={ink}
                shadow={icon}
              />
            ))}

            {/* the three blocks: identical silhouettes, and the one name */}
            <g style={{ filter: icon }}>
              {blocks.map((blk, m) =>
                blk.map((b, l) => (
                  <g key={`b${m}-${l}`}>
                    {b.barW > 0.5 ? (
                      <path
                        d={squirclePath(b.barW, BAR_H)}
                        transform={`translate(${b.barX.toFixed(2)} ${b.top})`}
                        fill={ink}
                      />
                    ) : null}
                    {b.conv > 0 ? (
                      <text
                        x={b.left}
                        y={b.top + NAME_BASELINE_DROP}
                        clipPath={`url(#scn-${m}-${l})`}
                        fill={ink}
                        style={readoutStyle(NAME_SIZE)}
                      >
                        {b.word}
                      </text>
                    ) : null}
                  </g>
                )),
              )}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default SameCharacterNames;
