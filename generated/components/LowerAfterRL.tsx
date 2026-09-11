import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  DOT_RADIUS,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  breath,
  camMove,
  clamp,
  clamp01,
  hash,
  iconShadow,
  makeTone,
  runCamera,
  smoothstep,
  sway,
  worldTransform,
} from "./fieldShared";
import {
  AXIS,
  BLOB_B,
  CLAUDE_SIZE,
  CLAUDE_Y,
  FLIGHT_EXTRA,
  K_REST,
  MARK_BOTTOM,
  MARK_SIZE,
  MARK_Y,
  MODELS,
  Mark,
  PKT_R,
  THREAD_Y0,
  THREAD_Y1,
  THREAD_OPACITY,
  THREAD_W,
  flightEase,
  makeSeats,
  readoutStyle,
  siphonPackets,
} from "./claudeDistilledShared";
import { CLAUDE } from "./brandGlyphs";

export const FPS = 24;
// John / Charles / Beren, clip `JohnCharlesBeren_Claude_Distilled`, cut 1:
// "...people are distilling mostly from Claude, like all the open weight
// models, right? The diversity of their outputs is a lot lower after RL..."
//
// The beats are a WORD-LEVEL transcription of the audio, not the SRT's cue
// boundaries — the SRT put the span at 3.259 -> 8.179 and the words sit a
// frame or two off that. In-point is "Claude" at 3.260, and a word's frame is
// round((t - 3.260) * 24):
//
//   word        f        word        f
//   Claude      0        is         75
//   like       13        a          84
//   all        17        lot        88
//   open       23        lower      90
//   weight     26        after      97
//   models     32        RL        104
//   right?     44        RL ends   115  (8.040)
//   The        49        "and"     118  (the next word, not in this cut)
//   diversity  51
//   of         59
//   their      64
//   outputs    66
//
// Every gesture already sits on those words within a frame or two, so none of
// them moved in this pass. What changed is the tail: speech ends at f115 and
// `DURATION = 115 + 48 = 163` gives the editor a 2-second resolved hold to
// trim into rather than the 24 frames it had. The resolved state holds under
// `sway`, `breath` and the packets, so the tail is never a still frame.
export const DURATION = 163;

// ---------------------------------------------------------------------------
// "The siphon". Claude is the source: the three open-weight models named in the
// news hang off it on threads and the distillate flows DOWN into them,
// continuously, for the whole piece. Their outputs spread out wide in two tones;
// then RL squeezes every spread into one narrow column of the same dots, all one
// tone. The count never changes — only the spread does, and that is the line.
//
// Everything is the field's own material: white glyphs with the per-icon
// shadow, accent threads at stroke 3, white packets, solid two-tone dots, one
// Söhne label. No boxes, no arrows, no props, no rings, no flashes.
//
// Every gesture is one word. Nothing else happens.
//   the Claude mark lands, opacity and scale on
//     one ease-out, camera tight on it at k 1.8    — "Claude"          f0-8
//   the ONE camera move: k 1.8 -> 1.35, content
//     centre 560 -> 900, warp 0.72, keyed f6-21;
//     through the damper it leaves f10 and lands
//     f24, eight frames ahead of "models"           — "like all the
//                                                     open weight"     f10-24
//   three threads draw head-led from Claude's
//     bottom edge down to the three marks, never
//     in unison (6, 8 and 10 frames); each mark
//     lands under its own thread's head over 6
//     frames as it arrives                         — "the open weight" f21-37
//   packets start running down the threads,
//     Claude -> model, and never stop              — "models, right?"  f40
//   64 dots per model leave the bottom edge of
//     their mark on shallow arcs and take their
//     blob seats, top seats first, bottom seats
//     last, each already in its own tone           — "the diversity of
//                                                     their outputs"   f49-70
//   THE ONE BIG MOTION: every blob dot travels to
//     its column seat on one shared smoothstep
//     (hashed delay <= 3 frames, no spring, no
//     overshoot) and every ripe dot ramps to deep
//     over the same window. Same 64 dots, same
//     radius; the spread is gone                   — "a lot lower"     f84-100
//   the label rises 10px and fades in, and holds   — "after RL"        f99-107
//   hold resolved, never fades                     — tail              f115-163
//
// ambient: `sway` on the camera, `breath` on every seated dot, and the packets
// on the threads from f40 to the last frame. They are not gestures; the siphon
// is what a running thing looks like.
//
// --- harmony pass ----------------------------------------------------------
// Everything this cut has in common with cuts 2 and 3 now lives in
// `claudeDistilledShared.tsx` and is imported, never restated: the mark
// positions and sizes and the `Mark` helper, the blob and column seat
// generator, the thread geometry and the packet constants, the Söhne face and
// its readout style, and `K_REST`. Not one number moved — the rewired piece was
// rendered against the frames it replaced and differs from them by zero pixels.
//
// The same pass retimed the clip to a word-level transcription of the audio.
// Every gesture here was already on its word within a frame or two, so nothing
// was re-keyed; the only change is the tail, 24 frames -> 48, so the editor has
// two seconds of resolved hold to trim into.
//
// --- v2 pass ---------------------------------------------------------------
// Three things, and nothing else moved. Beats, gesture list, mechanisms, tone
// ramp, timings, mark sizes, thread weight, packet size and DOT_RADIUS are all
// exactly as they were.
//
//  1. THE OUTPUTS ARE A BLOB, NOT A FAN. A downward triangle of dots under a
//     mark with an asterisk above it read as a Christmas tree. The outputs are
//     now the style's fleet shape: a wide feathered superellipse (n 2.4) centred
//     on (x_mark, 1010), 230 x 180 world px, so the three leave a ~10px gap at
//     x 415/425 and 655/665. Same 64 dots, same radius, same mixed tone by hash,
//     same 16px seat separation, same arrival mechanism and timing (t0 = 49 +
//     8v, dur = 3 + 8v, 3-frame fade; measured first arrival f51.9, last f66.7,
//     the last landing on "outputs" at f66 — the feathered edge keeps the
//     deepest seat a shade off v = 1) — only the seat field changed, and with
//     it the arrival rank, which now runs top-of-blob first instead of apex
//     first.
//  2. THE COMPOSITION IS BIGGER IN FRAME. The columns went 2 wide at an 11px
//     pitch — which read as a solid bar — to 3 wide at x_mark + {-13, 0, +13}
//     with a 14px pitch, top row 920, 22 rows, bottom 1214. The label moved
//     1380 -> 1300. The content span is now 485..1320 (centre 900) instead of
//     485..1400 (centre 960), and the camera resolves at k 1.35 instead of 1.0:
//     `camMove({f0: 6, f1: 21, k0: 1.8, k1: 1.35, c0: 560, c1: 900, warp: .72})`
//     — same frames, same warp, same damper, one move still. At rest the content
//     centre lands at screen y 835 and the composition spans screen y 275..1402,
//     clear of the caption band. Nothing was scaled in world px.
//  3. THE CONTRACTION GATHERS A BLOB. Unchanged in code — one shared smoothstep
//     f84 (+ hashed 0-3) -> f100, ripe -> deep on the same window — but it now
//     folds the blob rather than a fan. Peak screen speed measured at 19.4 px
//     a frame (f93) at k 1.35, well under the 45 px/frame close-up cap.
//
// --- v3 pass ---------------------------------------------------------------
// ONE change, and cut 3 takes exactly the same one: the blob arrival's flights
// are no longer front-loaded. The curve a dot flies on was an ease-out cubic,
// which over the 2.6-frame flights at the top of the blob spends 77% of the
// distance on the first frame; the spray peaked at 73.7 screen px/frame with
// the dot at least half opaque, with 102 of 192 dots over the house's 45
// px/frame, and read as dots snapping into place rather than settling.
//
// The flight is now `flightEase` — a smoothstep, shared with cut 3 in
// `claudeDistilledShared.tsx` — plus `FLIGHT_EXTRA`, the same two frames added
// to every flight. Measured on the drawn frames at this cut's own k:
//   peak while >= 50% opaque   73.7 -> 41.7 screen px/frame
//   dots over 45 px/frame      102 of 192 -> 0 of 192
// The smoothstep alone took it to 56.9, still over the cap, which is what the
// two frames are for.
//
// Every `t0` is untouched, so the histogram of START frames is exactly what it
// was and no dot leaves its mark a frame early or late; only the landings move,
// all by the same two frames (first arrival f51.9 -> f53.9, last f66.7 ->
// f68.7, still inside "outputs" and eight frames clear of "is" at f75). The
// arc, the 3-frame fade, the seat field, the arrival rank, the tone mix, the
// contraction, the camera and every other beat are untouched.
// ---------------------------------------------------------------------------

export const schema = z.object({
  ink: z.string(),
  accent: z.string(), // ripe: half the blob, and every thread
  accentDeep: z.string(), // deep: the other half, and every dot after RL
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
  dotRadius: z.number(),
  label: z.string(),
  beats: z.object({
    claude: z.number(), // "Claude"
    likeAll: z.number(), // "like all"
    openWeight: z.number(), // "the open weight"
    modelsRight: z.number(), // "models, right?"
    diversity: z.number(), // "the diversity"
    ofTheir: z.number(), // "of their"
    outputs: z.number(), // "outputs is"
    aLotLower: z.number(), // "a lot lower"
    after: z.number(), // "after"
    rl: z.number(), // "RL"
    end: z.number(), // speech ends; tail to 163
  }),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
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
  dotRadius: DOT_RADIUS,
  label: "RL — reinforcement learning",
  beats: {
    claude: 0,
    likeAll: 9,
    openWeight: 21,
    modelsRight: 32,
    diversity: 49,
    ofTheir: 59,
    outputs: 66,
    aLotLower: 85,
    after: 97,
    rl: 105,
    end: 115, // "RL" ends 8.040; the tail runs to 163
  },
});

const WORLD_W = 1080;
const WORLD_H = 2200;

// ---------------------------------------------------------------------------
// Layout, in world px. Phone-first: ONE centred column on x = 540, nothing
// parked at an edge, every label centred on the same axis. The composition
// spans y 485 (the top of the Claude mark) to 1320 (under the label), so its
// centre is 900 — that is the camera's resolved content centre.
// ---------------------------------------------------------------------------
// The marks, the thread geometry, the blob and the column all come from
// `claudeDistilledShared.tsx`: Claude 150 at (540, 560), the three models 104 at
// y 840 on x 300 / 540 / 780, the thread from 640 to 780. What is this cut's
// own is where the blob and the column sit under them, and how long each
// thread takes to reach its mark.
//
// `drawDur`, per model: the centre one is half the distance of the outer two,
// so they are given 6 / 8 / 10 frames rather than one speed — three heads
// arriving together reads as a machine, not as three things happening.
const THREAD_DRAW = [8, 6, 10];

// The outputs: a wide feathered blob under each mark — the style's fleet shape,
// a superellipse at n 2.4, 230 x 180 world px. Its top edge sits at 920, just
// under the mark, and half-width 115 leaves the three blobs a ~10px gap at
// x 415/425 and 655/665, so they read as three clouds and never touch.
const BLOB_CY = 1010;
const BLOB_TOP = BLOB_CY - BLOB_B; // 920

// The column after RL: the same 64 dots, three wide at a 14px pitch, hung from
// the blob's own top. Two wide at 11 read as a solid bar at this zoom; three
// wide at 14 is a countable column of dots. 22 rows, 920 -> 1214.
const COL_TOP = BLOB_TOP; // 920

const LABEL_Y = 1300;
const LABEL_SIZE = 48;

const CONTENT_CENTRE = 900;

// ---------------------------------------------------------------------------
// The camera. ONE move, and it is the whole of "like all the open weight": the
// piece opens tight on the Claude mark alone at k 1.8 with the mark at the
// content centre, and pulls back to k 1.35 with the whole siphon at the content
// centre. `camMove` writes it as a warped smoothstep, one key per frame, and
// takes cy from the eased k so the composition never sags against its own zoom;
// `runCamera` damps it. Warp 0.72 puts the speed early in the move so it is
// travelling while "like all" is still being said and settling under "the open
// weight". Nothing moves the camera again — the siphon carries the rest.
//
// It is keyed f6-21, not f6-24, because the damper lags its target: keyed to
// f24 the zoom was still running at 1.3% a frame ON f24 and did not fall under
// 1% a frame — the speed at which a zoom stops reading as a move at all —
// until f26, four frames later than the landing this move is supposed to have.
// Keyed to f21 it leaves at f10 (one frame after "like all", f9), peaks at
// 2.36% a frame, and is under 1% a frame from f24: the landing frame the move
// was written for, eight frames ahead of "models" (f32). Same k, same content
// centres, same warp, same shape — one deceleration lobe and one settle lobe —
// and it is fully at rest by f31.
//
// v2: the whole move was scaled up by a third — 1.35 -> 1.0 became 1.8 -> 1.35,
// and the content centre 960 -> 900 with the label and the columns pulled up —
// because the composition sat small in the frame. The ratio k0/k1 is unchanged
// (1.333), so the move's shape, its speed profile and its landing frame are
// exactly the ones diagnosed above. At rest the content centre (900) lands at
// screen y 960 + (900 - cy) * k = 835 and the composition (485..1320) spans
// screen y 275..1402, above the caption band.
// ---------------------------------------------------------------------------
const K_OPEN = 1.8;
const K_FINAL = K_REST;
const CAM = camMove({
  f0: 6,
  f1: 21,
  k0: K_OPEN,
  k1: K_FINAL,
  c0: CLAUDE_Y,
  c1: CONTENT_CENTRE,
  warp: 0.72,
});
const CAM_F = [0, ...CAM.F, DURATION];
const CAM_K = [K_OPEN, ...CAM.K, K_FINAL];
const CAM_CY = [CLAUDE_Y + CAM_LIFT / K_OPEN, ...CAM.CY, CONTENT_CENTRE + CAM_LIFT / K_FINAL];

// ---------------------------------------------------------------------------
// The outputs. `makeSeats` lays out the 3 x 64 seats — the feathered
// superellipse blob and the three-wide column it folds into — once, at module
// scope, off the stable hash; this cut only says WHERE (blob centred 1010,
// column from 920, dots leaving the mark's bottom edge at 892) and WHEN.
//
// When, per seat, is read off its depth `v` (0 at the top of the blob, 1 at the
// bottom): nearest seats first, furthest last, so arrivals run 52 -> 68 and a
// deeper seat both leaves later and travels longer. `delay` is its hashed
// stagger into the contraction.
// ---------------------------------------------------------------------------
const SEATS = makeSeats({ blobCy: BLOB_CY, colTop: COL_TOP, markBottom: MARK_BOTTOM }).map((s) => ({
  ...s,
  t0: 49 + 8 * s.v,
  // v3: `FLIGHT_EXTRA` is on `dur` only — every dot leaves on exactly the frame
  // it always left on, and only the landing is two frames later.
  dur: 3 + 8 * s.v + (hash(s.i, 34 + s.m) - 0.5) * 1.4 + FLIGHT_EXTRA,
  delay: hash(s.i, 40 + s.m) * 3,
}));

// The contraction: ONE shared smoothstep for all 192 dots, hashed delay only.
const SQUEEZE_F0 = 84;
const SQUEEZE_F1 = 100;

// The siphon starts on "models, right?" and never stops. Its shape — a 5px ink
// bead every 6 frames down each thread, 14 frames per transit, the three
// threads offset by 2 — is `siphonPackets`.
const PKT_START = 40;

const LowerAfterRL: React.FC<Props> = ({
  ink,
  accent,
  accentDeep,
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
  dotRadius,
  label,
  beats,
}) => {
  const frame = useCurrentFrame();
  // 0 = deep, 1 = ripe. Built once per frame, read per dot.
  const tone = makeTone(accentDeep, accent);

  // -- the Claude mark -------------------------------------------------------
  const claudeIn = interpolate(frame, [beats.claude, beats.claude + 8], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // -- the threads and the marks they carry ----------------------------------
  // Each thread draws head-led from Claude's bottom edge to its mark, and the
  // mark lands from the frame its own head arrives — not from a parallel timer.
  const threads = MODELS.map((mod, i) => {
    const t0 = beats.openWeight;
    const drawDur = THREAD_DRAW[i];
    const drawn = interpolate(frame, [t0, t0 + drawDur], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    const arrive = t0 + drawDur;
    const landed = interpolate(frame, [arrive, arrive + 6], [0, 1], {
      ...clamp,
      easing: Easing.out(Easing.cubic),
    });
    return { x: mod.x, glyph: mod.glyph, drawn, landed };
  });

  // -- the siphon ------------------------------------------------------------
  // Packets run DOWN, Claude -> model, from f40 to the last frame. Direction is
  // the whole point of the gesture, so they are placed off their own age and
  // nothing else.
  const packets = siphonPackets(frame, { start: PKT_START });

  // -- the outputs -----------------------------------------------------------
  // A dot's position is its own arrival progress, then the one shared squeeze.
  // Nothing here runs on a timer that could drift from the words.
  const dots = SEATS.map((s) => {
    if (frame < s.t0) return null;
    const lin = clamp01((frame - s.t0) / s.dur);
    const e = flightEase(lin);
    const dx = s.fx - s.sx;
    const dy = s.fy - s.sy;
    const L = Math.hypot(dx, dy) || 1;
    const bow = Math.sin(Math.PI * e) * s.arc;
    const ax = s.sx + dx * e + (-dy / L) * bow;
    const ay = s.sy + dy * e + (dx / L) * bow;
    // the squeeze: one smoothstep, per-dot delay <= 3 frames, no overshoot
    const q = smoothstep((frame - (SQUEEZE_F0 + s.delay)) / (SQUEEZE_F1 - (SQUEEZE_F0 + s.delay)));
    return {
      x: ax + (s.cx - ax) * q,
      y: ay + (s.cy - ay) * q,
      // every ripe dot ramps to deep across the same window
      tone: s.ripe * (1 - q),
      // a fixed 3-frame ramp, not a fraction of `dur`: the shortest flight in
      // the blob is 5 frames long, and a fade over a fifth of that is a dot
      // appearing at full strength in one frame — a pop
      fade: smoothstep((frame - s.t0) / 3),
      seated: lin >= 1,
      seed: s.seed,
    };
  });

  // -- the label -------------------------------------------------------------
  const labelIn = interpolate(frame, [beats.after + 2, beats.rl + 2], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

  // -- camera ----------------------------------------------------------------
  const cam = runCamera(frame, CAM_F, CAM_CY, CAM_K);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = AXIS + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);

  // -- the per-icon shadow ---------------------------------------------------
  // On every icon — the four marks, the packets, the label. Its lengths are
  // screen px divided by the camera's k, so it is the same shadow at k 1.35 on
  // the Claude mark alone and at k 1.0 on the whole siphon. The dots and the
  // threads are the field, not icons, and get nothing.
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
            {/* the threads, head-led, then held at 0.95 for the whole piece */}
            {threads.map((t, i) =>
              t.drawn > 0 ? (
                <g key={`t${i}`}>
                  <line
                    x1={AXIS}
                    y1={THREAD_Y0}
                    x2={AXIS + (t.x - AXIS) * t.drawn}
                    y2={THREAD_Y0 + (THREAD_Y1 - THREAD_Y0) * t.drawn}
                    stroke={accent}
                    strokeWidth={THREAD_W}
                    strokeLinecap="round"
                    opacity={THREAD_OPACITY}
                  />
                  {t.drawn < 1 ? (
                    <circle
                      cx={AXIS + (t.x - AXIS) * t.drawn}
                      cy={THREAD_Y0 + (THREAD_Y1 - THREAD_Y0) * t.drawn}
                      r={4}
                      fill={ink}
                    />
                  ) : null}
                </g>
              ) : null,
            )}

            {/* the siphon: white beads running down the wires, Claude -> model */}
            <g style={{ filter: icon }}>
              {packets.map((p) => (
                <circle key={p.key} cx={p.x} cy={p.y} r={PKT_R} fill={ink} />
              ))}
            </g>

            {/* the outputs: the blobs, and then the columns */}
            {dots.map((d, i) =>
              d ? (
                <circle
                  key={i}
                  cx={d.x}
                  cy={d.y}
                  r={dotRadius * (d.seated ? breath(frame, hash(d.seed, 9)) : 1)}
                  fill={tone(d.tone)}
                  opacity={d.fade}
                />
              ) : null,
            )}

            {/* the marks */}
            <Mark
              glyph={CLAUDE}
              x={AXIS}
              y={CLAUDE_Y}
              size={CLAUDE_SIZE}
              landed={claudeIn}
              ink={ink}
              shadow={icon}
            />
            {threads.map((t, i) => (
              <Mark
                key={`m${i}`}
                glyph={t.glyph}
                x={t.x}
                y={MARK_Y}
                size={MARK_SIZE}
                landed={t.landed}
                ink={ink}
                shadow={icon}
              />
            ))}
          </svg>

          {/* the cause, named once. Söhne Kräftig, white, centred on the same
              column axis as everything else, with the marks' own shadow. */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: LABEL_Y + 10 * (1 - labelIn),
              width: WORLD_W,
              transform: "translateY(-50%)",
              textAlign: "center",
              ...readoutStyle(LABEL_SIZE),
              lineHeight: 1,
              color: ink,
              opacity: labelIn,
              filter: icon,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default LowerAfterRL;
