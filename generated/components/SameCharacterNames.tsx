import { loadFont } from "@remotion/fonts";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame } from "remotion";
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
import { CLAUDE, DEEPSEEK, MINIMAX, MOONSHOT, type BrandGlyph } from "./brandGlyphs";

export const FPS = 24;
// John / Charles / Beren, clip `JohnCharlesBeren_Claude_Distilled`, cut 2:
// "...and they sort of develop these ticks... you find that they're reusing
// certain themes, and they're using the same character names all the time."
//
// SRT span 0:15.480 ("they're reusing") -> 0:20.019 (the end of "the time") at
// 24fps. round((20.019 - 15.480) * 24) = round(4.539 * 24) = round(108.94) =
// 109 frames of speech, plus a 16 frame tail so the resolved state holds = 125.
export const DURATION = 125;

// ---------------------------------------------------------------------------
// "The name comes down the wire". Cut 1 ended with the siphon running: Claude
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
// block, and where it lands the bar becomes a name in Söhne: Elara, the same
// name in all three blocks. Then again, and again: "all the time".
//
// Everything is the field's own material: white marks with the per-icon
// shadow, accent threads at stroke 3, white packets, white bars, one Söhne
// word. No boxes, no arrows, no cursors, no props, no flashes, no rings.
//
// Every gesture is one word. Nothing else happens.
//   the three blocks write, line by line, top to
//     bottom — each bar grows from width 0 over 5
//     frames, a new line every 3.5 frames, the
//     three blocks a beat apart (0, 1, 2 frames)
//     so they read as one event and never as
//     unison                                       — "certain themes" f17-45
//   THE ONE CAMERA MOVE: k 1.35 -> 1.41, content
//     centre 900 -> 800, warp 0.72, keyed f56-76
//     so the damper has it settled by f80 — the
//     words are read at ~45px on screen and the
//     content's own centre lands on 835           — "using the same" f56-80
//   three name packets leave Claude together, one
//     per thread, the same 5px white bead as the
//     ambient siphon; they run the wire, pass
//     straight through their mark and land on
//     line 3 at f80                                — "using the same" f63-80
//   on landing, line 3's bar collapses into its
//     right end while `Elara` wipes in from the
//     left — one ease, 6 frames, all three blocks
//     together                                     — "names"          f80-86
//   two more name packets per thread, launched f75
//     and f82, land on line 1 at f92 and line 5 at
//     f99 and convert the same way; the ambient
//     packets keep running between them            — "all" / "the time"
//                                                                     f75-105
//   hold resolved: three identical blocks reading
//     Elara / bar / Elara / bar / Elara / bar / bar,
//     the siphon still running                     — tail             f105-125
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
// ---------------------------------------------------------------------------

// -- type --------------------------------------------------------------------
// Söhne Kräftig, at module scope, the way `explainerShared.tsx` loads it and
// the way cut 1 loads it, so a font failure surfaces before a single frame is
// drawn. One word, one weight, no fallback stack: if it does not load the
// render is wrong and should look wrong.
const NAME_FONT = "SohneKraftig";
loadFont({
  family: NAME_FONT,
  url: staticFile("Sohne-Kraftig.otf"),
  weight: "500",
});

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
  name: z.string(),
  beats: z.object({
    reusing: z.number(), // "they're reusing"
    certainThemes: z.number(), // "certain themes"
    andTheyre: z.number(), // "and they're"
    usingTheSame: z.number(), // "using the same"
    character: z.number(), // "character"
    names: z.number(), // "names"
    all: z.number(), // "all"
    theTime: z.number(), // "the time"
    end: z.number(), // speech ends; tail to 125
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
  name: "Elara",
  beats: {
    reusing: 0,
    certainThemes: 17,
    andTheyre: 47,
    usingTheSame: 63,
    character: 77,
    names: 86,
    all: 92,
    theTime: 99,
    end: 109,
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// Layout, in world px. Every value down to `PKT_R` is cut 1's, copied rather
// than re-decided: this is the same composition seconds later in the same edit,
// so a mark that moved or a thread that changed weight would read as a mistake.
// Phone-first, one centred column on x = 540.
// ---------------------------------------------------------------------------
const AXIS = 540;

const CLAUDE_Y = 560;
const CLAUDE_SIZE = 150;
const CLAUDE_BOTTOM = CLAUDE_Y + CLAUDE_SIZE / 2; // 635

const MARK_Y = 840;
const MARK_SIZE = 104;

const MODELS: { name: string; glyph: BrandGlyph; x: number }[] = [
  { name: "DeepSeek", glyph: DEEPSEEK, x: 300 },
  { name: "Moonshot", glyph: MOONSHOT, x: AXIS },
  { name: "MiniMax", glyph: MINIMAX, x: 780 },
];

const THREAD_Y0 = CLAUDE_BOTTOM + 5; // 640, just clear of Claude's bottom edge
const THREAD_Y1 = 780; // 60px above a mark's centre, 8px above its top edge

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

// The name. Söhne Kräftig 32px, white, left-aligned on the bar's own left edge,
// baseline set so the word's x-height sits in the band the bar sat in — at this
// size Kräftig's x-height is ~16.6px against a 14px bar, so a baseline one pixel
// under the bar's bottom edge puts the letter bodies on the bar's line.
const NAME_SIZE = 32;
const NAME_BASELINE_DROP = BAR_H + 1;
// The reveal's own width: `Elara` at 32px Kräftig, measured off the render, plus
// a pixel of slack so the final `a` is never shaved by the clip.
const NAME_W = 80;

// Which line becomes the name, in order. A packet leaves Claude, runs the wire,
// passes straight through its mark and lands in the block; the conversion
// starts from that landing and from nothing else, so the bead is visibly the
// thing that does it and the two cannot drift if this is retimed. Every run is
// PKT_RUN frames, so the launch is the landing counted backwards and the three
// beads of a round always leave together.
const CONV_DUR = 6;
const PKT_RUN = 17;

// The write-on: a new line every 3.5 frames, each bar growing over 5 frames on
// one ease-out, the three blocks a beat apart so they are never in unison.
const WRITE_STAGGER = 3.5;
const WRITE_DUR = 5;
const BLOCK_OFFSET = [0, 1, 2];

// The siphon, exactly cut 1's: a 5px ink bead every 6 frames down each thread,
// 14 frames per transit, the three threads offset by 2 frames so they never
// pulse together. It has been running since cut 1, so it starts mid-flight.
const PKT_PERIOD = 6;
const PKT_LIFE = 14;
const PKT_R = 5;
const PKT_N0 = -3; // enough history that f0 already has beads on every wire

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
const K_OPEN = 1.35;
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

// A brand mark, drawn as its own paths inside the world SVG — cut 1's helper,
// with its arrival dropped: in this cut every mark is already landed on frame 0.
const Mark: React.FC<{
  glyph: BrandGlyph;
  x: number;
  y: number;
  size: number;
  ink: string;
  shadow: string;
}> = ({ glyph, x, y, size, ink, shadow }) => {
  const s = size / 24;
  return (
    <g style={{ filter: shadow }}>
      <g transform={`translate(${x} ${y}) scale(${s.toFixed(5)}) translate(-12 -12)`}>
        {glyph.paths.map((d, i) => (
          <path key={i} d={d} fill={ink} fillRule="evenodd" />
        ))}
      </g>
    </g>
  );
};

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
  name,
  beats,
}) => {
  const frame = useCurrentFrame();

  // The three name rounds, each read straight off a word: line 3 lands six
  // frames before "names" so the 6-frame conversion completes ON the word, line
  // 1 lands on "all", line 5 on "the time".
  const nameEvents = [
    { line: 2, land: beats.names - CONV_DUR }, // 80, converted by "names" (86)
    { line: 0, land: beats.all }, // 92
    { line: 4, land: beats.theTime }, // 99
  ];

  // -- the siphon ------------------------------------------------------------
  // Ambient, unchanged from cut 1 and running before this piece starts, so the
  // beads are placed off their own age and nothing else.
  const packets: { key: string; x: number; y: number }[] = [];
  MODELS.forEach((mod, t) => {
    for (let n = PKT_N0; ; n++) {
      const sf = t * 2 + n * PKT_PERIOD;
      if (sf > frame) break;
      const age = frame - sf;
      if (age >= PKT_LIFE) continue;
      const p = age / (PKT_LIFE - 1);
      packets.push({
        key: `p${t}-${n}`,
        x: AXIS + (mod.x - AXIS) * p,
        y: THREAD_Y0 + (THREAD_Y1 - THREAD_Y0) * p,
      });
    }
  });

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
        const p = arc / legA;
        packets.push({
          key: `n${t}-${e}`,
          x: AXIS + (mod.x - AXIS) * p,
          y: THREAD_Y0 + (THREAD_Y1 - THREAD_Y0) * p,
        });
      } else {
        packets.push({ key: `n${t}-${e}`, x: mod.x, y: THREAD_Y1 + (arc - legA) });
      }
    });
  });

  // -- the blocks ------------------------------------------------------------
  // Per line: how far it has been written, and how far it has been converted.
  // The conversion is read off its packet's landing frame, not off a beat of its
  // own, so the bead is visibly the thing that does it.
  const convOf = (l: number) => {
    const ev = nameEvents.find((n) => n.line === l);
    if (!ev) return 0;
    return smoothstep((frame - ev.land) / CONV_DUR);
  };

  const blocks = MODELS.map((mod, m) =>
    BAR_W.map((w, l) => {
      const t0 = beats.certainThemes + l * WRITE_STAGGER + BLOCK_OFFSET[m];
      const write = interpolate(frame, [t0, t0 + WRITE_DUR], [0, 1], {
        ...clamp,
        easing: Easing.out(Easing.cubic),
      });
      const conv = convOf(l);
      const left = mod.x - BLOCK_HALF;
      // written: the left edge is fixed and the bar grows right.
      // converted: the right edge is fixed and the bar collapses into it, while
      // the name wipes in from the left behind it. The name is ~80 wide against
      // a 96-170 wide bar, so the wipe front never catches the collapsing bar.
      const barW = conv > 0 ? w * (1 - conv) : w * write;
      const barX = conv > 0 ? left + w * conv : left;
      return { left, top: lineTop(l), barX, barW, conv };
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
                        width={Math.max(0.01, NAME_W * b.conv)}
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
                strokeWidth={3}
                strokeLinecap="round"
                opacity={0.95}
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
                        fontFamily={NAME_FONT}
                        fontWeight={500}
                        fontSize={NAME_SIZE}
                        letterSpacing="-0.01em"
                      >
                        {name}
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
