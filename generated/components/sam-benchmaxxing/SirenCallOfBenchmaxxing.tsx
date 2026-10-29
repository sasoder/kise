// ---------------------------------------------------------------------------
// SirenCallOfBenchmaxxing (sam-benchmaxxing, cut 35). Cheeky Pint style carried into the AIR, as the Scott Kirby clips
// (styles/cheeky-pint.md; the clip's world benchShared.tsx on scott-aircraft-order/aircraftShared AirStage).
// Opaque 1080x1920, 23.976 fps, 76 frames. RENDER WITH --gl=angle.
//
// CHECK LINE: "back on cut 1's chart: this time the other labs' columns are lured up by the siren call of benchmaxxing
// while OpenAI's stays at a modest height, its logo humble and chill — the reverse of the opening."
//
// THE LINE (John): "...not getting sucked in by the siren call of benchmaxxing?" (Sam): "I believe we are better at that."
// WORD -> FRAME: (sucked -13) · in 3 · by 10 · the 21 · siren 24 · call 30 · of 35 · bench 39 · maxxing 43 · I 52 ·
// believe 52 · we 58 · are 61 · better 62 · at 67 · that 70 · (back on camera at 76) (notes/word_frames.txt, CUT 35).
// DURATION: the slot 35.702 -> 38.872 s = 3.170 s x 23.976 = 76 frames (f0..f75).
//
// THE MOTION: it opens on EXACTLY cut 1's even chart (EVEN_RUNGS at LIFT_EVEN_LOOK, cut 1's story clock at f20, so
// sky, motes and grain match): five tiles riding their columns' caps (Claude, Gemini, OpenAI, Grok, DeepSeek), OpenAI's cream blossom tile on its modest amber column
// in slot 3, the camera already creeping. From f1 a soft cream call comes down from above the frame: a ripple of three
// concentric sound-wave bands (feathered, ~16-24 px, brightest at the arc's centre, low contrast), evenly spaced and
// each wider than the one before, reaching down to the column tops as they start to rise (f24-40), gone by ~f46. On "siren call of benchmaxxing" (f24-52) the four other
// columns are drawn upward out of their slots in turn (inner pair first, 3-4 f apart), eager, damped, no overshoot, each
// carrying its tile up on its cap to ~5x its height, while the camera tilts up a little with them (f26-55), keeping
// OpenAI's tile low in frame. OpenAI's column never moves. On "I believe we are better at that" (f52-70) the OpenAI tile
// goes chill: an easy lean back (+6 deg about a point just inside the cap's right corner, the reverse of cut 1's smug tip), a slow gentle
// rock on that corner (period 40 f, ~5 px at the free edge: its bob, keeping contact with its cap) and a soft amber
// underglow settling in under it. REV 2: once the others have risen, the camera pushes in onto OpenAI's low tile in one
// eased move (f47-66), landing as it goes chill; living hold f66-75 close on it (tile ~440 px wide, face above y 1080),
// its modest amber column below, the bases of the tall Gemini and Grok columns framing it at the sides: sky drift,
// motes, grain, the rock, a slow creep in.
// Cause before effect: each lab's tile rides its own column's glass top (its floor IS the cap) the whole way up; the
// first wave reaches the column tops (~f24) as the first column starts to rise (f24): the call pulls them up.
// The resting tiles sit clear of the caption bands: the four tall tiles rest with their feet above y 1080 (~y 740-1040),
// OpenAI's tile below 1460 (~y 1520-1730). The tall columns cross the bands, as allowed; moving tiles pass through.
// AMBER = OpenAI's score (its column's fill, unchanged, modest, and its underglow); board/umber glass = the other labs'
// scores; cream = the OpenAI tile and the lure. No numbers, no text.
//
// REV 1 (user, 2026-10-29): lifted with cut 1 (benchShared LIFT_CAM / LIFT_EVEN_LOOK) so every tile face's bottom edge
// sits at or above y 1500 (the YouTube Shorts overlay; tile faces may cross the 1360-1460 band, accepted), and the
// four other labs carry their real marks (benchShared LAB_LOGOS: Claude, Gemini, Grok, DeepSeek). Nothing else changed.
//
// SOURCES: no figures. The OpenAI blossom from sam-macintosh-moment/macintoshShared.tsx via benchShared OpenAITile
// (Commons "OpenAI logo 2025 (symbol).svg"); the Claude, Gemini, Grok and DeepSeek marks from
// public/sam-benchmaxxing/*_mark.svg (Commons; see public/sam-benchmaxxing/LOGOS.md), drawn unchanged as ink stamps.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, amberBandFor, clamp01 } from "../kits/cheeky-pint/stoutShared";
import {
  BenchColumn,
  BenchStage,
  EVEN_F,
  EVEN_RUNGS,
  GROUND,
  LAB_LOGO_OF,
  LIFT_CAM,
  LIFT_EVEN_LOOK,
  LabTile,
  OPENAI_SLOT,
  OpenAITile,
  ROW,
  benchCam,
  capY,
  rowX,
  type Look,
} from "./benchShared";

export const FPS = 24000 / 1001;
export const DURATION = 76;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const ss = (v: number) => {
  const x = clamp01(v);
  return x * x * (3 - 2 * x);
};

// ---------------------------------------------------------------------------
// BEATS
// ---------------------------------------------------------------------------
/** the lure: a ripple of three sound-wave bands, concentric about a point (srcY) above the frame, coming down at a
 *  constant speed (chart px/f) so they stay evenly spaced; wave i's bottom crosses the frame top (chart y top) at
 *  enter + i * gap. Each band thickens as it travels (w0 -> w1 screen px, the lower one always the wider); it drains
 *  into the sky as its bottom passes fade0 -> fade1 (chart y: the rising column tops, well above OpenAI's tile). */
const LURE_V1 = { top: -120, speed: 36, fade1: 1060 } as const;
/** REV 1: the opening look is cut 1's LIFTED even chart (LIFT_EVEN_LOOK): the waves still enter through the frame top
 *  (top = the opening frame's top edge in chart px) and still drain at the same place among the rising columns
 *  (fade0..fade1, chart px), so they come a touch faster to keep the approved timing (reach the column tops f24-40). */
const LURE_TOP = LIFT_EVEN_LOOK.y - 960 / LIFT_EVEN_LOOK.k + 2;
export const LURE = {
  n: 3,
  enter: 1,
  gap: 6,
  top: LURE_TOP,
  speed: (LURE_V1.speed * (LURE_V1.fade1 - LURE_TOP)) / (LURE_V1.fade1 - LURE_V1.top),
  srcY: LURE_TOP - 600,
  halfW: 680,
  w0: 16,
  w1: 24,
  alpha: 0.4,
  fade0: 640,
  fade1: LURE_V1.fade1,
} as const;
/** the siren call: each other lab's column rises from its start frame over RISE.dur frames, to its final rungs */
export const RISE = { dur: 19 } as const;
/** start frames by slot (inner pair first: slot 1 on "siren", then 3, 0, 4) */
const RISE_F0 = [30, 24, 0, 27, 33] as const;
/** final fill per slot (OpenAI's stays at its EVEN_RUNGS): tall enough that every resting tile's foot clears y 1080 */
export const LURED_RUNGS = [10.9, 11.8, EVEN_RUNGS[OPENAI_SLOT], 11.3, 12.1] as const;
/** npsColumnsPlan's travel ease (as cut 1): a soft start, a long even middle, a weighty settle, no overshoot */
const riseEase = (u: number) => {
  const x = clamp01(u);
  const quad = x < 0.5 ? 2 * x * x : 1 - 2 * (1 - x) * (1 - x);
  return 0.55 * ss(x) + 0.45 * quad;
};
/** OpenAI goes chill on "I believe we are better at that" */
export const CHILL = { pivotX: ROW.col / 2 - 10, shift: -13, lean0: 52, lean1: 66, deg: 6, rock0: 60, rock1: 70, rockDeg: 1.2, period: 40, glow0: 53, glow1: 68, glow: 1 } as const;

export const rungsAt = (i: number, f: number) => {
  if (i === OPENAI_SLOT) return EVEN_RUNGS[i];
  const u = clamp01((f - RISE_F0[i]) / RISE.dur);
  return EVEN_RUNGS[i] + (LURED_RUNGS[i] - EVEN_RUNGS[i]) * riseEase(u);
};

// ---------------------------------------------------------------------------
// CAMERA: starts on LIFT_EVEN_LOOK (cut 1's lifted f20 look) exactly (the follower's f0 offset is removed), already
// creeping at f0, tilts up a little with the rising columns (f26-55); REV 2: then pushes in onto OpenAI's tile (PUSH)
// ---------------------------------------------------------------------------
const START = LIFT_EVEN_LOOK;
const RAW_CAM = benchCam(
  START,
  [
    { f0: -24, f1: 40, dy: -6, k: START.k * 1.016 },
    { f0: 26, f1: 55, dy: -26 },
    { f0: 50, f1: 116, dy: -6, k: START.k * 1.02 },
  ],
  DURATION,
);
const RAW0 = RAW_CAM.at(0);
/** rev 1's camera (approved; unchanged up to the push) */
const camV1 = (f: number): Look => {
  const c = RAW_CAM.at(f);
  return { x: c.x - RAW0.x + START.x, y: c.y - RAW0.y + START.y, k: (c.k / RAW0.k) * START.k };
};
/** REV 2 (user, 2026-10-29): once the others have risen, one eased push-in onto the low OpenAI tile (f47-66), landing
 *  as it goes chill: the zoom eases in log space while the tile's centre (`anchor`, chart px; x a touch left for the
 *  settle shift) travels in a straight line on screen to `at` (screen px), then a slow creep in about it to the cut.
 *  End: the tile ~440 px wide, its face resting above y 1080 (y ~570-1070), its amber column below, the bases of the
 *  tall Gemini and Grok columns framing it at the frame's sides. */
export const PUSH = { f0: 47, f1: 66, k: 2.3, anchor: { x: 534, y: capY(EVEN_RUNGS[OPENAI_SLOT]) - ROW.tile / 2 }, at: { x: 540, y: 830 }, creep: 0.003 } as const;
export const camAt = (f: number): Look => {
  const v = camV1(f);
  if (f <= PUSH.f0) return v;
  const e = ss((f - PUSH.f0) / (PUSH.f1 - PUSH.f0));
  const A = PUSH.anchor;
  const kT = PUSH.k * (1 + PUSH.creep * Math.max(0, f - PUSH.f1));
  const k = Math.exp(Math.log(v.k) + (Math.log(kT) - Math.log(v.k)) * e);
  // the anchor's screen position under rev 1's camera, eased to its landing spot
  const p1x = 540 + (A.x - v.x) * v.k;
  const p1y = 960 + (A.y - v.y) * v.k;
  const px = p1x + (PUSH.at.x - p1x) * e;
  const py = p1y + (PUSH.at.y - p1y) * e;
  return { x: A.x - (px - 540) / k, y: A.y - (py - 960) / k, k };
};

// ---------------------------------------------------------------------------
// THE LURE (chart px, in world space): soft cream sound-wave bands coming down from above in an even ripple
// ---------------------------------------------------------------------------
/** brightness along an arc (0 = its left end, 1 = its right end): brightest at the centre, feathered to nothing */
const ARC_PROFILE: [number, number][] = [
  [0, 0],
  [0.12, 0.18],
  [0.3, 0.68],
  [0.5, 1],
  [0.7, 0.68],
  [0.88, 0.18],
  [1, 0],
];
const Lure: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const L = LURE;
  const arcs: React.ReactNode[] = [];
  for (let i = 0; i < L.n; i++) {
    const age = f - (L.enter + i * L.gap);
    const bottom = L.top + L.speed * age;
    if (bottom < L.top - 40 || bottom > L.fade1) continue;
    // in through the frame top, out by draining into the sky as it reaches the column tops
    const a = L.alpha * ss((age + 1) / 6) * (1 - ss((bottom - L.fade0) / (L.fade1 - L.fade0)));
    if (a < 0.003) continue;
    const r = bottom - L.srcY;
    const hw = Math.min(L.halfW, r * 0.98);
    const x0 = 540 - hw;
    const x1 = 540 + hw;
    const y = L.srcY + Math.sqrt(r * r - hw * hw);
    const w = (L.w0 + (L.w1 - L.w0) * clamp01((bottom - L.top) / (L.fade1 - L.top))) / k;
    const id = `bnLure${i}`;
    const d = `M${f3(x0)} ${f3(y)}A${f3(r)} ${f3(r)} 0 0 0 ${f3(x1)} ${f3(y)}`;
    arcs.push(
      <g key={i}>
        <defs>
          <linearGradient id={id} gradientUnits="userSpaceOnUse" x1={f3(x0)} y1="0" x2={f3(x1)} y2="0">
            {ARC_PROFILE.map(([o, v]) => (
              <stop key={o} offset={o} stopColor={COLOR.cream} stopOpacity={v} />
            ))}
          </linearGradient>
        </defs>
        {/* heavily feathered: a wide faint halo, then the band's soft core */}
        <path d={d} fill="none" stroke={`url(#${id})`} strokeOpacity={f3(a * 0.45)} strokeWidth={f3(w * 2.6)} style={{ filter: `blur(${f3(w * 1.0)}px)` }} />
        <path d={d} fill="none" stroke={`url(#${id})`} strokeOpacity={f3(a)} strokeWidth={f3(w)} style={{ filter: `blur(${f3(w * 0.62)}px)` }} />
      </g>,
    );
  }
  return <g>{arcs}</g>;
};

const SirenCallOfBenchmaxxing: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const look = camAt(f);
  const k = look.k;
  const band = amberBandFor(look);
  const lean =
    CHILL.deg * ss((f - CHILL.lean0) / (CHILL.lean1 - CHILL.lean0)) +
    CHILL.rockDeg * Math.sin((2 * Math.PI * (f - CHILL.rock0)) / CHILL.period) * ss((f - CHILL.rock0) / (CHILL.rock1 - CHILL.rock0));
  const glow = CHILL.glow * ss((f - CHILL.glow0) / (CHILL.glow1 - CHILL.glow0));
  // as it tips back the tile's rounded corner would land on the glass's rounded corner (a visible gap): it settles
  // back a few px so the corner rests on the flat of the cap
  const shift = CHILL.shift * ss((f - CHILL.lean0) / (CHILL.lean1 - CHILL.lean0));
  return (
    // story clock continues cut 1's (its even chart is cut 1's f20); the ground's parallax origin is cut 1's rest
    <BenchStage look={look} S={EVEN_F + f} rest={LIFT_CAM.rest}>
      <Lure f={f} k={k} />
      {EVEN_RUNGS.map((_, i) => {
        const logo = LAB_LOGO_OF[i];
        const x = rowX(i);
        const isOpenAI = i === OPENAI_SLOT;
        return (
          <BenchColumn
            key={i}
            x={x}
            base={GROUND}
            rungs={rungsAt(i, f)}
            fill={isOpenAI ? "amber" : "board"}
            k={k}
            band={band}
            cap={(top) =>
              logo ? (
                <LabTile x={x} floor={top} size={ROW.tile} k={k} logo={logo} />
              ) : (
                <g transform={shift ? `translate(${f3(shift)} 0)` : undefined}>
                  <OpenAITile x={x} floor={top} size={ROW.tile} k={k} lean={lean} pivotX={CHILL.pivotX} glow={glow} />
                </g>
              )
            }
          />
        );
      })}
    </BenchStage>
  );
};

export default SirenCallOfBenchmaxxing;
