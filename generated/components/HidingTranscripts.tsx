import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  GridBackground,
  ICON_SHADOW_BLUR,
  ICON_SHADOW_OPACITY,
  ICON_SHADOW_Y,
  OP_UNREAD_DOT,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  camEase,
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
  CURVE_AT as curveAt,
  SPINE_OPACITY,
  STROKE,
  cometPath,
  spinePath,
} from "./GoodTrajectory";
import type { Drawn } from "./GoodTrajectory";
import { TIERS, tickHalf } from "./IncreasinglyCapable";
import {
  BEAD_MIN,
  BEAD_MUL,
  CHAINS,
  PITCH_MUL,
  RING_MUL,
  SK_MARKS,
  SkullGlyph,
  W0 as COT_W0,
  beadR,
  ringU,
  subAt,
  worldOf,
} from "./ChainOfThought";

export const FPS = 24;

// ---------------------------------------------------------------------------
// Noam, clip `Noam_Children`, cut `HidingTranscripts` — the FIFTH cut, and the
// first one to stay in CLOSE-UP on a single comet:
// "They're going to understand the concept of chain of thought, and they're
//  going to understand that, like, you know, just hiding some transcripts or
//  whatever"
//
// DURATION. The composition starts at 32.500 s and speech ends at 38.760 s:
//   DURATION = round((38.760 - 32.500) * 24) + 16 = 150 + 16 = 166
//
// Word onsets, frame = round((t - 32.500) * 24):
//   they're 0 · going 6 · to 9 · UNDERSTAND 12 · the 24 · CONCEPT 27 · of 33 ·
//   CHAIN 37 · of 40 · THOUGHT 43 (ends 48) · and 48 · they're 51 · going 55 ·
//   UNDERSTAND 57 · THAT 65 · like 69 · you 76 · know 79 · JUST 84 ·
//   HIDING 88 (held to 106) · SOME 106 · TRANSCRIPTS 121 (to 143) · or 143 ·
//   whatever 145 · speech ends 150 · tail 150-166.
export const DURATION = 166;

// ---------------------------------------------------------------------------
// EDITORIAL NOTE — WHY THIS CUT DOES NOT RESOLVE.
// At f150 the editor cuts to the speaker's face for "...is insufficient,
// because of chain of thought monitoring". So this cut must be CAUGHT
// MID-ACTION, not landed: at f150 the hiding is under way and nowhere near
// done — five beads hollow out of the chain's seven, the skull gone, the orange
// ring still travelling back between two beads, and our white ring still
// sitting on the comet watching it happen. The sixteen tail frames are the same
// motion continuing at the same rate; nothing lands on them, nothing is added
// for the line that follows, and there is no gesture anywhere in here that
// belongs to "monitoring" — the user cut exactly that kind of anticipation out
// of cut 2 and it is not coming back.
//
// ---------------------------------------------------------------------------
// CONTINUITY. This is ChainOfThought's `skull` variant's world, continued:
// cot frame = COT_OFFSET + f, which is 1.44 s of edit gap after that cut's
// speech ends. Subject 0, its white ring, its chain and its 150 px skull are
// read straight out of that module at that time — `subAt`, `ringU`, `CHAINS`,
// `beadR`, `SK_MARKS`, and the crowd from `worldOf("skull", ...)` — so the
// stream, the spine and the ladder flow behind exactly as they do there. By
// this point the comet's creep has saturated, so it is parked on its own chain
// and has absorbed the first bead; seven beads are left, which is what the
// hiding count below is measured against. Subjects 1 and 2 exist in the world
// and are never in frame (checked, every frame, in `ht/check.ts`).
//
// ---------------------------------------------------------------------------
// VOCABULARY. Carried over unchanged:
//   WHITE RING   WE see it. It sits on the comet for the whole cut and NEVER
//                reacts to anything that happens — that is the point of it.
//   ORANGE DOT   the AI. ORANGE BEAD its thought. The SKULL what the thought
//                is for.
// NEW, and the only new element in the cut:
//   ORANGE RING  IT sees. The deliberate rhyme of our ring, in the AI's own
//                colour: same stroke, same shadow, no fill, but 2.5 bead radii
//                at rest against the white ring's 4.6 comet radii — 23 world px
//                against 56, so the two can never be read as the same mark.
//                2.5 and not less: at 1.7 its inner edge landed on the bead it
//                was passing and the pair read as one fat bead. At 2.5 there
//                are 9 world px of clear grey inside it around a solid bead and
//                6.5 around a hollowed one, and it is still only 41% of the
//                white ring.
//                It is the AI's own attention, and it does to its chain exactly
//                what we did: travels along it and looks at each bead in turn.
//   HOLLOW BEAD  a thought that has been hidden. The bead's solid fill closes
//                down to nothing over 5 frames and leaves a thin ACCENT_DEEP
//                outline standing at the bead's own radius. No alpha is used
//                anywhere in it — the state is carried by the fill closing, the
//                set's rule — and the thread it hangs on is left alone, because
//                the thought still happened.
//
// ---------------------------------------------------------------------------
// GESTURES — one continuous motion. The orange ring never stops moving between
// f4 and f166 except for the held thought it is supposed to hold.
//
//  1. f0-48   "they're going to   THE EXAMINATION. We open already close on the
//             understand the      ringed comet with the stream flowing past at
//             concept of chain    frame left. At f4 the orange ring is born out
//             of thought"         of the comet's own dot — it grows from the
//             (f12/f27/f37/f43)   dot's radius to its resting radius over 8
//                                 frames while already moving — and travels OUT
//                                 ALONG ITS OWN CHAIN, on the chain's smooth
//                                 curve, passing through each bead's centre in
//                                 turn. It is out through the white ring by f13
//                                 and the two never touch again. One ease-in-
//                                 out travel, no stops. On CHAIN OF THOUGHT it
//                                 reaches the last bead, and on THOUGHT (f43-48)
//                                 it opens up and encloses the skull.
//  2. f48-84  "and they're going  THE HELD THOUGHT. Not a freeze. The ring
//             to understand       settles a little TIGHTER onto the skull over
//             that, like, you     UNDERSTAND THAT (f57-65) and stays there; the
//             know"               camera creeps in 4%; the stream keeps flowing
//             (f57/f65)           at frame left; the beads keep their own small
//                                 wander and the thread follows them. No new
//                                 object appears anywhere in this stretch.
//  3. f84-166 "just hiding some   THE HIDING. Inside the ring, the skull
//             transcripts or      UN-DRAWS across the long HIDING (f86-104) —
//             whatever"           the reverse of its own draw-on, sockets and
//             (f84/f88/f106/f121) nose first, then the outline retreating back
//                                 toward the chain. The ring closes down to its
//                                 resting radius and starts BACK along the
//                                 chain, and every bead its centre reaches goes
//                                 hollow. It does not hurry and it does not
//                                 finish. See MEASURED for the counts.
//
// ---------------------------------------------------------------------------
// MEASURED.
//   Camera        |dv| 0.767 at f18, peak |v| 3.6 screen px/f. The smallest
//                 track in the clip, which is what a close two-shot wants.
//   Framing       every point of comet, white ring, chain, orange ring and
//                 skull is inside the frame on all 166 frames; the lowest of
//                 them reaches y 997, well clear of the caption band. Subjects
//                 1 and 2 are never within 120 px of the frame.
//   The two rings never intersect at all after f14, and the orange one is clear
//                 of the white one from f14 on its way out and never re-enters
//                 it: the return runs out of cut first.
//   Ticks         no tick bar comes within 20 px of a ring or the skull.
//   Motion        mean moving ink per frame: 16.5k over the examination, 17.2k
//                 over the HELD THOUGHT, 18.3k over the hiding, 18.9k over the
//                 tail. The held thought is not a dip — the stream carries it.
//   The hiding    one steady rate. Bead 8 starts hollowing at f108 (done f113),
//                 then 120, 131, 143, 154, 166. At the editor's cut on f150:
//                 FOUR of the seven hollow — "some transcripts", with most of
//                 the chain still standing — the orange ring at p 5.35, between
//                 two beads and not on one, and still travelling. By f165 five
//                 are done and the sixth is starting. It never reaches the
//                 comet: at f165 it is still 112 world px out, and the white
//                 ring's band only reaches 79, so the two never meet again.
// KNOWN DEVIATIONS. The third bead hollows over f131-136 rather than the
// f121-130 first asked for: one steady rate cannot put the first bead at f113,
// the third inside f130 AND leave four of seven standing at f150, and the f150
// frame is the one the cut is built to hand over on. The
// return also starts at f93, while the skull still has a third of its outline
// left, rather than waiting for it: the un-draw retreats the outline toward the
// chain and the ring travels the same way, so they come off the skull together.
//
// ---------------------------------------------------------------------------
export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  iconShadowY: z.number(),
  iconShadowBlur: z.number(),
  iconShadowOpacity: z.number(),
  dotOpacity: z.number(),
  beats: z.object({
    understand: z.number(),
    concept: z.number(),
    chain: z.number(),
    thought: z.number(),
    that: z.number(),
    just: z.number(),
    hiding: z.number(),
    some: z.number(),
    transcripts: z.number(),
    cut: z.number(),
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
  dotOpacity: OP_UNREAD_DOT,
  beats: {
    understand: 12,
    concept: 27,
    chain: 37,
    thought: 43,
    that: 65,
    just: 84,
    hiding: 88,
    some: 106,
    transcripts: 121,
    cut: 150,
  },
});

const CX = FRAME_W / 2;
/** 1.44 s of face between that cut's last word and this one's first. */
export const COT_OFFSET = 136;
export const CF = (f: number) => COT_OFFSET + f;
/** World time, for the grid's parallax: cut 4 opened at 630. */
export const W0 = COT_W0 + COT_OFFSET;

const CHAIN = CHAINS[0];
const SKULL = SK_MARKS[0];
export const BEAD_R = Math.max(BEAD_MUL * CHAIN.r, BEAD_MIN);
const PITCH = PITCH_MUL * CHAIN.r;

// ---------------------------------------------------------------------------
// THE ROAD THE ORANGE RING TRAVELS. The ring has to pass through the CENTRE of
// every bead — that is what makes it read as examining them one at a time — so
// the road is a Catmull-Rom through the chain's own control points rather than
// a re-derivation of the chain's curve: the anchor, the nine bead centres, the
// skull's centre. Position along it is `p`, in units of one control point, so
// p = 0 is where the comet started thinking, p = n + 1 is bead n, and p = 10 is
// the skull. A spline through the points the beads are actually drawn at cannot
// drift away from them the way a re-integrated curve could.
// ---------------------------------------------------------------------------
type P2 = { x: number; y: number };
const ROAD: P2[] = [
  { x: CHAIN.ax, y: CHAIN.ay },
  ...CHAIN.pts,
  { x: SKULL.x, y: SKULL.y },
];
export const P_SKULL = ROAD.length - 1; // 10
export const P_TIP = P_SKULL - 1; // 9, the last bead

const roadAt = (p: number): P2 => {
  const t = Math.max(0, Math.min(P_SKULL, p));
  const i = Math.min(ROAD.length - 2, Math.floor(t));
  const u = t - i;
  const q = (n: number) => ROAD[Math.max(0, Math.min(ROAD.length - 1, n))];
  const p0 = q(i - 1);
  const p1 = q(i);
  const p2 = q(i + 1);
  const p3 = q(i + 2);
  const h = (a: number, b: number, c: number, d: number) =>
    0.5 *
    (2 * b + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  return { x: h(p0.x, p1.x, p2.x, p3.x), y: h(p0.y, p1.y, p2.y, p3.y) };
};

// ---------------------------------------------------------------------------
// THE RING'S SCHEDULE. Both tracks are built once, per frame, as tables: the
// position `p` and the radius. Everything downstream — which beads are hollow,
// where the camera leans, when the skull starts to go — is READ OFF these, so
// nothing in the cut is on a clock of its own.
// ---------------------------------------------------------------------------
const F_BORN = 4;
/** Front-loaded: the ring has to be clear of the white ring by f14 so the two
 *  marks are never tangled, and a symmetric ease left it straddling it at f16. */
const TRAVEL_WARP = 0.65;
const F_GROWN = 12;
const F_ARRIVE = 38; // it is on the last bead about here, on "chain"/"of"
const F_ENCLOSE = 48; // ...and is around the skull by the end of "thought"
const F_TIGHT: [number, number] = [57, 65]; // "understand that"
const F_UNDRAW: [number, number] = [86, 104]; // the long "hiding"
/** The ring starts sliding off the skull while the skull is still going: the
 *  un-draw retreats the outline TOWARD the chain and the ring is moving the
 *  same way, so they come off it together rather than one waiting for the
 *  other. */
const F_RETURN = 90;
const F_CLOSE: [number, number] = [97, 110];
/** Control points per frame on the way back, once the rate has eased in. One
 *  steady rate, set with the ramp below so the ring reaches the last bead at
 *  f108 and is caught BETWEEN two beads with FOUR of the seven hollow at the
 *  editor's cut — "some transcripts" has to leave most of the chain standing. */
const BACK_RATE = 0.087;
const BACK_EASE = 14;

const ease5 = (u: number) => {
  const t = clamp01(u);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export const P_AT: number[] = (() => {
  const out: number[] = [];
  let p = 0;
  for (let f = 0; f <= DURATION + 16; f++) {
    if (f <= F_BORN) p = 0;
    else if (f <= F_ENCLOSE) {
      // ONE travel, comet to skull, with no join in it. The first build stopped
      // it at the last bead and started a second ramp for the enclosure, and
      // because camEase is flat at both ends that put a six-frame stall right
      // before "thought" and then a 39 px/f snap on to the skull.
      p = P_SKULL * camEase((f - F_BORN) / (F_ENCLOSE - F_BORN), TRAVEL_WARP);
    } else if (f <= F_RETURN) p = P_SKULL;
    else p -= BACK_RATE * ease5((f - F_RETURN) / BACK_EASE);
    out.push(p);
  }
  return out;
})();
export const pAt = (f: number) => P_AT[Math.max(0, Math.min(P_AT.length - 1, Math.round(f)))];

/** Resting radius: 2.5 bead radii — 23 world px. At 1.7 it sat on the bead it
 *  was passing with no daylight between the two and read as a fat bead rather
 *  than a ring around one. It is still well under half the white ring's 56, so
 *  the two marks stay a size apart. Enclosing radius: just outside the skull's
 *  own half-extent, which is set by the skull and not by this. */
export const R_REST = 2.5 * BEAD_R;
const R_OPEN = SKULL.r + 9;
const R_TIGHT = SKULL.r + 2;

export const rAt = (f: number) => {
  if (f <= F_BORN) return 0;
  const born = CHAIN.r + (R_REST - CHAIN.r) * smoothstep(clamp01((f - F_BORN) / (F_GROWN - F_BORN)));
  const open = R_REST + (R_OPEN - R_REST) * camEase(clamp01((f - F_ARRIVE) / (F_ENCLOSE - F_ARRIVE)), 1);

  const tight = open + (R_TIGHT - R_OPEN) * smoothstep(clamp01((f - F_TIGHT[0]) / (F_TIGHT[1] - F_TIGHT[0])));
  const closed = tight + (R_REST - R_TIGHT) * camEase(clamp01((f - F_CLOSE[0]) / (F_CLOSE[1] - F_CLOSE[0])), 1);
  return f < F_GROWN ? born : closed;
};

export const ringAt = (f: number) => {
  const p = pAt(f);
  return { ...roadAt(p), r: rAt(f), p };
};

/** The skull goes because the ring is around it: the un-draw runs over the long
 *  "hiding", backwards through its own draw. */
export const skullLeft = (f: number) => 1 - smoothstep(clamp01((f - F_UNDRAW[0]) / (F_UNDRAW[1] - F_UNDRAW[0])));

// ---------------------------------------------------------------------------
// WHICH BEADS ARE HOLLOW. A bead is hidden BECAUSE the ring reached it: the
// frame it starts is the frame the ring's centre passes its control point on
// the way back, found once from the position table, and it takes 5 frames.
// Nothing here is a keyframe.
// ---------------------------------------------------------------------------
const HOLLOW_F = 5;
export const HIDDEN_AT: number[] = CHAIN.pts.map((_b, n) => {
  const target = n + 1;
  for (let f = F_RETURN; f <= DURATION + 16; f++) if (P_AT[f] <= target) return f;
  return Infinity;
});
export const hollowU = (n: number, f: number) => clamp01((f - HIDDEN_AT[n]) / HOLLOW_F);

// ---------------------------------------------------------------------------
// THE BEADS' OWN WANDER, carried over from cut 4's `follow` so the chain is
// never dead in the held thought: small, hashed, and the thread follows it.
// ---------------------------------------------------------------------------
const WANDER = 2.5;
export const beadAt = (n: number, f: number): P2 => {
  const b = CHAIN.pts[n];
  const p1 = 41 + 23 * hash(n, 7);
  const p2 = 57 + 31 * hash(n, 13);
  return {
    x: b.x + WANDER * Math.sin(((CF(f) + 60 * hash(n, 3)) / p1) * 2 * Math.PI),
    y: b.y + WANDER * Math.sin(((CF(f) + 60 * hash(n, 5)) / p2) * 2 * Math.PI),
  };
};

// ---------------------------------------------------------------------------
// THE CAMERA. A close two-shot, and the smallest track in the clip: one k
// segment set that only ever creeps, and a pan that holds the PAIR — comet and
// white ring at one end, skull at the other — in frame for all 166 frames and
// leans a quarter of the way toward the orange ring as it travels, so the frame
// is always weighted where the attention is without ever chasing it. The look
// point is biased left of the pair's centre so a slice of the stream the comet
// peeled from stays in frame the whole cut: that flow is the only thing in the
// picture that moves on its own, and without it the held thought is dead air.
// ---------------------------------------------------------------------------
const K0 = 1.44;
const K1 = 1.47;
const K2 = 1.53;
const K3 = 1.56;
const F_K1 = 48;
const F_K2 = 92;
const TRACK_F1 = DURATION + 16;
const LEAN = 0.25;
/** How far left of the pair's centre the camera sits, in world px. */
const LEFT_BIAS = 96;

type KSeg = { f0: number; f1: number; k0: number; k1: number; warp: number };
const kTrack = (segs: KSeg[]) => {
  const K: number[] = new Array(TRACK_F1 + 1).fill(segs[0].k0);
  segs.forEach((s, i) => {
    if (i > 0 && segs[i - 1].f1 !== s.f0) throw new Error("camera: k segments must meet");
    for (let f = s.f0; f <= Math.min(TRACK_F1, s.f1); f++) {
      K[f] = s.k0 + (s.k1 - s.k0) * camEase((f - s.f0) / (s.f1 - s.f0), s.warp);
    }
    for (let f = s.f1 + 1; f <= TRACK_F1; f++) K[f] = s.k1;
  });
  return K;
};

const K_TRACK = kTrack([
  { f0: 0, f1: F_K1, k0: K0, k1: K1, warp: 1.0 },
  { f0: F_K1, f1: F_K2, k0: K1, k1: K2, warp: 0.9 },
  { f0: F_K2, f1: TRACK_F1, k0: K2, k1: K3, warp: 0.5 },
]);

const pairAt = (f: number) => {
  const a = subAt(0, CF(f));
  return { x: (a.x + SKULL.x) / 2, y: (a.y + SKULL.y) / 2 };
};

const CAM = (() => {
  const F: number[] = [];
  const CXT: number[] = [];
  const CYT: number[] = [];
  for (let f = 0; f <= TRACK_F1; f++) {
    const k = K_TRACK[f];
    const c = pairAt(Math.min(DURATION, f));
    const r = ringAt(Math.min(DURATION, f));
    // the lean RAMPS in. Switching it on at f4 was a step in the camera's
    // target and rang up |dv| 5.9 on one frame.
    const lean = LEAN * ease5((f - F_BORN) / 16);
    F.push(f);
    CXT.push(c.x + (r.x - c.x) * lean - LEFT_BIAS);
    CYT.push(c.y + (r.y - c.y) * lean + CAM_LIFT / k);
  }
  return { F, K: K_TRACK, CX: CXT, CY: CYT };
})();

const dampX = (upto: number) => runCamera(upto, CAM.F, CAM.CX, CAM.K).cy;

const CAM_AT_F = (() => {
  const out: { cx: number; cy: number; k: number }[] = [];
  for (let f = 0; f <= DURATION + 2; f++) {
    const c = runCamera(f, CAM.F, CAM.CY, CAM.K);
    const d = sway(f);
    out.push({ cx: dampX(f) + d.dx, cy: c.cy + d.dy, k: c.k });
  }
  return out;
})();
export const CAM_AT = (f: number) => CAM_AT_F[Math.max(0, Math.min(DURATION + 2, Math.round(f)))];
export const SCREEN_AT = (f: number, wx: number, wy: number) => {
  const c = CAM_AT(f);
  return [CX + (wx - c.cx) * c.k, FRAME_H / 2 + (wy - c.cy) * c.k];
};

export const worldAt = (f: number): Drawn[] => worldOf("skull", CF(f));

// ---------------------------------------------------------------------------

const HidingTranscripts: React.FC<Props> = ({
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
  dotOpacity,
}) => {
  const frame = useCurrentFrame();
  const cf = CF(frame);

  const cam = runCamera(frame, CAM.F, CAM.CY, CAM.K);
  const camX = dampX(frame);
  const drift = sway(frame);
  const cy = cam.cy + drift.dy;
  const cx = camX + drift.dx;
  const k = cam.k;
  const { tx, ty } = worldTransform(cx, cy, k);
  const icon = iconShadow(k, iconShadowY, iconShadowBlur, iconShadowOpacity);

  const world = worldAt(frame);
  const toRipe = makeTone(accentDeep, accent);
  const spine = spinePath(0, 3900);
  const sub = subAt(0, cf);
  const ring = ringAt(frame);
  const skullU = skullLeft(frame);

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <GridBackground
        src={backgroundSrc}
        blur={backgroundBlur}
        dim={backgroundDim}
        frame={W0 + frame}
        cy={cy}
        cyRest={CAM.CY[0]}
        cx={cx}
        cxRest={CAM.CX[0]}
        k={k}
        parallax={parallax}
      />

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: FRAME_W,
            height: FRAME_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={FRAME_W}
            height={FRAME_H}
            viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {world.map((d) => {
              const p = cometPath(d);
              return p ? (
                <path key={d.key} d={p} fill={toRipe(d.tone)} opacity={dotOpacity} />
              ) : null;
            })}

            {/* the chain: thread, then the beads — solid until the orange ring
                reaches them, then a fill that closes down to an outline */}
            <g>
              {CHAIN.pts.map((_b, n) => {
                const a = n === 0 ? { x: sub.x, y: sub.y } : beadAt(n - 1, frame);
                const b = beadAt(n, frame);
                return (
                  <line
                    key={`t${n}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={accent}
                    strokeWidth={STROKE / 2}
                    strokeLinecap="round"
                    opacity={dotOpacity}
                  />
                );
              })}
              {CHAIN.pts.map((_b, n) => {
                const r = beadR(0, n, cf);
                if (r <= 0.05) return null;
                const q = beadAt(n, frame);
                const h = hollowU(n, frame);
                return (
                  <g key={`b${n}`}>
                    {h > 0 ? (
                      <circle
                        cx={q.x}
                        cy={q.y}
                        r={r}
                        fill="none"
                        stroke={accentDeep}
                        strokeWidth={STROKE / 2}
                        opacity={dotOpacity}
                      />
                    ) : null}
                    {h < 1 ? (
                      <circle cx={q.x} cy={q.y} r={r * (1 - h)} fill={accent} opacity={dotOpacity} />
                    ) : null}
                  </g>
                );
              })}
            </g>

            {/* IT sees: the AI's own ring, travelling its own chain */}
            {ring.r > 0.5 ? (
              <g style={{ filter: icon }}>
                <circle
                  cx={ring.x}
                  cy={ring.y}
                  r={ring.r}
                  fill="none"
                  stroke={accent}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={dotOpacity}
                />
              </g>
            ) : null}

            <SkullGlyph
              m={SKULL}
              u={skullU}
              accent={accent}
              opacity={dotOpacity}
              icon={icon}
            />

            <g style={{ filter: icon }}>
              <path
                d={spine.d}
                fill="none"
                stroke={ink}
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={SPINE_OPACITY}
              />

              {TIERS.map((t, i) => {
                const c = curveAt(t.s);
                const h = tickHalf(i);
                return (
                  <line
                    key={`k${i}`}
                    x1={c.x + c.ty * h}
                    y1={c.y - c.tx * h}
                    x2={c.x - c.ty * h}
                    y2={c.y + c.tx * h}
                    stroke={ink}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                    opacity={SPINE_OPACITY}
                  />
                );
              })}

              {/* WE see it: never reacts, never leaves */}
              {ringU(0, cf) > 0 ? (
                <circle
                  cx={sub.x}
                  cy={sub.y}
                  r={RING_MUL * sub.r}
                  fill="none"
                  stroke={ink}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  opacity={SPINE_OPACITY}
                />
              ) : null}
            </g>
          </svg>
        </div>
      </AbsoluteFill>

      <Vignette />
    </AbsoluteFill>
  );
};

export default HidingTranscripts;

export const STATS = {
  duration: DURATION,
  cotOffset: COT_OFFSET,
  beadR: Number(BEAD_R.toFixed(2)),
  pitch: Number(PITCH.toFixed(1)),
  rRest: Number(R_REST.toFixed(1)),
  rOpen: Number(R_OPEN.toFixed(1)),
  whiteR: Number((RING_MUL * CHAIN.r).toFixed(1)),
  skullR: Number(SKULL.r.toFixed(1)),
  visibleBeads: CHAIN.pts.filter((_b, n) => beadR(0, n, CF(0)) > 0.05).length,
  hiddenAt: HIDDEN_AT.map((v) => (Number.isFinite(v) ? v : null)),
  p: [0, 12, 24, 37, 43, 48, 84, 96, 110, 121, 150, 165].map((f) => [f, Number(pAt(f).toFixed(2))]),
  k: [0, 24, 48, 84, 104, 150, 165].map((f) => [f, Number(CAM_AT(f).k.toFixed(3))]),
};
