// ---------------------------------------------------------------------------
// ReachingOutToHisPeople (cut E of the "strings" set). Dwarkesh Patel with Si
// Sheppard, "Why captured emperors cooperated". He = ATAHUALPA, the Inca
// emperor held by Pizarro at Cajamarca, 1532-33.
//   "At the same time, though, I think he was also reaching out to his own
//    people, and he was waiting, perhaps, for his opportunity to fully
//    mobilize them."
// Dwarkesh map style, "beyond maps" page; the world is stringsShared.tsx (used
// as-is). Opaque 1080x1920, 24 fps, 154 frames. In-point 52.177 s.
//
// WORD -> LOCAL FRAME
//   the 2 · same 5 · time 10-17 · though 19 · I 24 · think 26 · he 31 · was 34 ·
//   also 37 · REACHING 45 · OUT 52 · to 59 · his 64 · own 69 · PEOPLE 72-80 ·
//   and 83 · he 84 · was 86 · WAITING 89-95 · perhaps 98 · for 105 · his 107 ·
//   OPPORTUNITY 110-119 · to 120 · FULLY 129 · MOBILIZE 139-149 · them 149;
//   the cut ends f152 (f152-153 = safety tail).
//
// THE PICTURE: the Moctezuma cuts' composition (E3's upper half: the captor's
// gauntlet and bar, three taut orange strings to the emperor's head and
// wrists), but the emperor is the Inca variant, upright and composed, and under
// him there are no nobles.
//
// GESTURES (each with the words it serves). V2 (ROUND 3: action early, the
// payoff COMPLETE by f140, then a living hold; the frame filled):
//   1. f0-f16 the close opening: Atahualpa (>= 480 px on screen) held under the
//      three orange strings, "ATAHUALPA" under his feet (gone by f32); in each
//      fist three cord ends hang coiled, dormant.
//   2. f20-f54 "REACHING OUT" (f45, f52): the six knotted cords run out head-led
//      (launch f20 .. f33) and LAND f40 .. f54; the pull-back glide is f16-f56.
//      Each host wakes from its cord's landing point (0.28 -> 0.8, the men rise
//      to their feet); all lit by ~f61.
//   3. f58-f82 "to his own PEOPLE": the camera, wide, pushes 5 % toward the
//      lower half: the hosts are the subject (front ranks >= 96 px on screen).
//   4. f82-f104 "and he was WAITING": the spears come up, a ripple through each
//      host from the cord's landing point, host after host; then they STAND,
//      armed; the cords slack, swaying.
//   5. f108-f139 "for his OPPORTUNITY to FULLY MOBILIZE them": orange leaves his
//      hands and runs the WHOLE length of every cord (crisp fronts, 2.4 f apart,
//      slow then fast), each cord pulling taut behind its front; fronts arrive
//      f124 .. f130; as each arrives its host answers as one body: one step
//      toward him, leaning into the cord, spears tilting forward (9 f). Complete
//      by f139 (asserted below).
//   6. f140-f153 the living hold: six taut orange cords with highlights running
//      out along them, six hosts leaning in; the captor's three strings still
//      hold him from above; slow creep.
//   The captor's side strings tie on his FOREARMS (drawn here), so >= 30 px of
//   cream hand separates Pizarro's orange from the orange of his own cords.
//
// ACCENT: orange = the live hold only. Pizarro's three strings are orange
// throughout; Atahualpa's cords are cream until he pulls on them (gesture 5).
//
// HISTORY (nothing of it on screen): from captivity Atahualpa went on sending
// orders by runner; Inca records and messages were quipus, knotted cords; his
// field armies (Quizquiz, Chalcuchima, Ruminavi) were intact and the Spaniards
// feared he was summoning them; he was executed 26 July 1533 before any
// mobilisation. Sources: Hemming, The Conquest of the Incas (1970), ch. 3-4;
// Pedro Pizarro, Relacion (1571); Urton, Signs of the Inka Khipu (2003).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, CAPTION_TOP, DARK, FRAME_H, FRAME_W, INK, camFor, clamp01, hash, makeTrack, screenOf, smootherstep, smoothstep } from "./incaShared";
import { SpriteCanvas, blit, layerCanvas, type FigKey } from "./pageFigures";
import {
  Label,
  PuppetString,
  STRING_W,
  StringsPage,
  TONE,
  Tableau,
  EMPEROR_AT,
  WorldSvg,
  emperorAnchors,
  emperorRig,
  glintAt,
  handAnchors,
  mix,
  mix2,
  stringPoint,
  vlen,
  type Cam,
  type EmperorPose,
  type P2,
  type Scene,
  type StringGeom,
  type StringState,
} from "./stringsShared";

export const FPS = 24;
export const DURATION = 154;

export const schema = z.object({
  vignette: z.number(),
  /** true = the dormant hosts are on the page from f0 (default: they come up as the pull-back starts, f12-f28) */
  hostsFromStart: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, hostsFromStart: false });

// ---------------------------------------------------------------------------
// TIMELINE
// ---------------------------------------------------------------------------
const T = {
  labelDim: [8, 16] as [number, number],
  labelOut: [20, 32] as [number, number],
  reach: [17, 29] as [number, number],
  /** the six cords: L upper, R upper, L mid, R mid, L lower, R lower */
  launch: [20, 22.6, 25.2, 27.8, 30.4, 33],
  land: [40, 43, 46, 49, 51.5, 54],
  hostsIn: [12, 28] as [number, number],
  /** the spears come up: each host's ripple starts here */
  spears: [82, 83.6, 85.2, 86.8, 88.4, 90],
  /** the orange leaves his hands (the long lower cords first) and arrives at the host */
  orange: [117.6, 120, 112.8, 115.2, 108, 110.4],
  arrive: [128.8, 130, 126.4, 127.6, 124, 125.2],
  /** a host's answer (step, lean, spears forward), frames */
  answer: 9,
};
/** the orange front's progress 0..1 along cord c: slow at first, faster toward the end */
const orangeAt = (c: number, f: number) => Math.pow(clamp01((f - T.orange[c]) / (T.arrive[c] - T.orange[c])), 1.8);
/** host c's answer 0..1 */
const answerAt = (c: number, f: number) => smootherstep((f - T.arrive[c] + 1) / T.answer);
/** a host's brightening front (world px / f) and its spears' ripple */
const WAKE_V = 40;
const SPEAR_V = 30;
const STEP = 16; // the host's one step toward him, world px
const LEAN = 7; // and its lean into the cord, deg

// ---------------------------------------------------------------------------
// THE CAMERA: one keyed C1 track. Close creep -> ONE pull-back glide -> creep.
// focus = the world point held at screen (540, 835).
// ---------------------------------------------------------------------------
const K_OPEN = 1.5;
const K_WIDE = 1.0;
const LNK = (() => {
  const creep1: [number, number, number, number] = [-30, 24, Math.log(1.03), 0.25];
  const push: [number, number, number, number] = [58, 82, Math.log(1.05), 0.85];
  const creep2: [number, number, number, number] = [80, 230, Math.log(1.04), 0.2];
  const base = makeTrack([creep1, push, creep2], Math.log(K_OPEN));
  return makeTrack([creep1, [16, 56, Math.log(K_WIDE) - base(56), 0.9], push, creep2], Math.log(K_OPEN));
})();
const FOCUS_Y = makeTrack([[16, 56, 190, 0.9]], 600);
const camAt = (f: number): Cam => camFor([540, FOCUS_Y(f)], Math.exp(LNK(f)));

// ---------------------------------------------------------------------------
// ATAHUALPA: upright, composed, the hands low at his sides (a fist on three
// cords each); on "reaching" the hands open a little outward
// ---------------------------------------------------------------------------
const poseAt = (f: number): EmperorPose => {
  const r = smootherstep((f - T.reach[0]) / (T.reach[1] - T.reach[0]));
  return {
    head: 0.7 * Math.sin(f / 23),
    nod: 0,
    slump: 0,
    lean: 0,
    wristL: [-72 - 10 * r, -150 - 6 * r],
    wristR: [72 + 10 * r, -150 - 6 * r],
    fistL: 1,
    fistR: 1,
    hang: 0,
    limp: 0,
  };
};
const TAUT_LIVE: StringState = { slack: 0, base: 1, live: [0, 1] };
const NO_STRING: StringState = { slack: 0, base: 0, live: null, drawn: [0, 0] };
const sceneAt = (f: number): Scene => ({
  variant: "inca",
  emperor: poseAt(f),
  emperorTone: 1,
  nobles: Array.from({ length: 7 }, () => ({ bow: 0, tone: 0 })),
  stringsM: Array.from({ length: 7 }, () => NO_STRING),
  hand: { show: 1, bar: 1, tilt: 0, dy: 0 },
  // the two wrist strings are drawn here (ForearmStrings): tied on the forearms, clear of the cords in his fists
  stringsC: { head: TAUT_LIVE, wristL: null, wristR: null },
});

/** the captor's two side strings: bar end -> the forearm (above the wrist), so >= 30 px of cream hand lies between his orange and the cords' */
const ForearmStrings: React.FC<{ cam: Cam; frame: number; pose: EmperorPose }> = ({ cam, frame, pose }) => {
  const r = emperorRig(pose, "inca");
  const h = handAnchors({ bar: 1, tilt: 0 });
  const tie = (arm: { E: P2; W: P2 }): P2 => {
    const q = mix2(arm.E, arm.W, 0.42);
    return [EMPEROR_AT[0] + q[0], EMPEROR_AT[1] + q[1]];
  };
  return (
    <WorldSvg cam={cam}>
      <PuppetString from={h.barL} to={tie(r.armL)} slack={0} base={1} live={[0, 1]} highlight={glintAt(frame, 8)} k={cam.k} />
      <PuppetString from={h.barR} to={tie(r.armR)} slack={0} base={1} live={[0, 1]} highlight={glintAt(frame, 9)} k={cam.k} />
    </WorldSvg>
  );
};

// ---------------------------------------------------------------------------
// THE HOSTS: six hosts of 38 engraved warriors (pageFigures' Inca sprites, the
// two quiet variants: mace held low / sling hanging), three ranks in depth (each
// rank behind 20 px higher and 4 % smaller), a spear (1.4 x the man) in the free hand.
// ---------------------------------------------------------------------------
const MAN_H = 94; // front rank, world px (>= 72 px on screen at the wide's k 1.0 for every rank)
const RANKS = [7, 6, 6];
const DX = 29;
const RANK_DY = 21;
const RANK_DS = 0.04;
type HostDef = { cx: number; fy: number; side: -1 | 1; landRank: number; landCol: number };
const HALF: Omit<HostDef, "side">[] = [
  { cx: 190, fy: 715, landRank: 2, landCol: 5 }, // far out, at his waist's height
  { cx: 225, fy: 905, landRank: 2, landCol: 5 }, // lower
  { cx: 340, fy: 1093, landRank: 2, landCol: 3 }, // lowest, flanking the column under him
];
/** host order = cord order: L upper, R upper, L mid, R mid, L lower, R lower */
const HOSTS: HostDef[] = HALF.flatMap((h) => [
  { ...h, side: -1 as const },
  { ...h, cx: 1080 - h.cx, side: 1 as const, landCol: RANKS[h.landRank] - 1 - h.landCol },
]);
const KEYS: FigKey[][] = [2, 3].map((v) => ([-1, 0, 1] as const).map((lean) => ({ kind: "inca", v, lean, look: "cream" }) as FigKey));
/** the spear hand in glyph units (v 2: the left hand, v 3: the right) */
const SPEAR_HAND: P2[] = [
  [-14.6, -46],
  [18.6, -57],
];
type Man = { host: number; x: number; y: number; h: number; vi: number; lean: number; d: number; tiltLow: number; tiltUp: number };
const LANDS: P2[] = [];
const MEN: Man[] = (() => {
  const out: Man[] = [];
  HOSTS.forEach((H, hi) => {
    const mine: Man[] = [];
    let land: P2 = [H.cx, H.fy];
    RANKS.forEach((n, r) => {
      for (let c = 0; c < n; c++) {
        const id = hi * 100 + r * 12 + c;
        const s = (1 - r * RANK_DS) * (0.97 + 0.06 * hash(id, 41));
        const x = H.cx + (c - (n - 1) / 2) * DX + r * 1.5 * H.side + 3 * (hash(id, 42) - 0.5);
        const y = H.fy - r * RANK_DY + 2 * (hash(id, 43) - 0.5);
        const h = MAN_H * s;
        if (r === H.landRank && c === H.landCol) land = [x, y - 0.9 * h];
        mine.push({
          host: hi,
          x,
          y,
          h,
          vi: hash(id, 44) < 0.5 ? 0 : 1,
          lean: Math.floor(hash(id, 45) * 3),
          d: 0,
          tiltLow: H.side * (38 + 5 * hash(id, 46)),
          tiltUp: 5 * (hash(id, 47) - 0.5),
        });
      }
    });
    LANDS.push(land);
    for (const m of mine) m.d = Math.hypot(m.x - land[0], m.y - 0.5 * m.h - land[1]);
    out.push(...mine);
  });
  // painter's order: the further (higher) first
  return out.sort((a, b) => a.y - b.y);
})();
/** where cord c is tied at frame f: its man's head, carried by the host's step and lean */
const landAt = (c: number, f: number): P2 => {
  const ans = answerAt(c, f);
  return [LANDS[c][0] - HOSTS[c].side * (STEP + 10) * ans, LANDS[c][1] + 1.5 * ans];
};
const HOST_REACH = HOSTS.map((_, hi) => Math.max(...MEN.filter((m) => m.host === hi).map((m) => m.d)));
/** how far a man has risen to his feet (0 low .. 1 standing): the wake front passing him */
const riseOf = (m: Man, f: number) => smootherstep((f - T.land[m.host] - m.d / WAKE_V) / 7);
/** how far his spear has come upright */
const spearOf = (m: Man, f: number) => smootherstep((f - T.spears[m.host] - m.d / SPEAR_V) / 7);
const LOW = 0.8; // a dormant man's height (he sits low)
const WAKE_GAIN = 1 - (1 - 0.8) / (1 - TONE.dead); // a second pass over the dormant 0.28 that lands on 0.8

const Hosts: React.FC<{ cam: Cam; frame: number; vis: number }> = ({ cam, frame, vis }) => (
  <SpriteCanvas
    draw={(ctx) => {
      if (vis <= 0.003) return;
      const L0 = layerCanvas(0);
      const c0 = L0.getContext("2d") as CanvasRenderingContext2D;
      c0.setTransform(1, 0, 0, 1, 0, 0);
      c0.globalCompositeOperation = "source-over";
      c0.globalAlpha = 1;
      c0.clearRect(0, 0, FRAME_W, FRAME_H);
      c0.lineCap = "round";
      for (const m of MEN) {
        // the answer: the whole host takes one step toward him and leans into the cord
        const ans = answerAt(m.host, frame);
        const toward = -HOSTS[m.host].side;
        const [sx, sy] = screenOf([m.x + toward * STEP * ans, m.y - 3 * Math.sin(Math.PI * ans)], cam);
        const leanRad = (toward * LEAN * ans * Math.PI) / 180;
        const hPx = m.h * cam.k;
        if (sx < -2 * hPx || sx > FRAME_W + 2 * hPx || sy < -hPx || sy > FRAME_H + 2 * hPx) continue;
        const u = hPx / 100; // px per glyph unit
        const sY = mix(LOW, 1, riseOf(m, frame));
        const up = spearOf(m, frame);
        const [hx, hy] = SPEAR_HAND[m.vi];
        // the spear (behind the man): about his hand, sloped at rest, upright when the tension reaches him
        c0.save();
        c0.translate(sx, sy);
        c0.rotate(leanRad);
        c0.save();
        c0.translate(hx * u, hy * u * sY);
        c0.rotate(((mix(m.tiltLow, m.tiltUp, up) + toward * 16 * ans) * Math.PI) / 180);
        const y0 = -hy * u * sY * 0.98; // the butt, on the ground when upright
        const y1 = -(132 + hy) * u;
        c0.globalAlpha = 0.78;
        c0.strokeStyle = DARK;
        c0.lineWidth = 2.4 * u + 2;
        c0.beginPath();
        c0.moveTo(0, y0);
        c0.lineTo(0, y1 - 9 * u);
        c0.stroke();
        c0.globalAlpha = 1;
        c0.strokeStyle = "#CDBF9C";
        c0.lineWidth = 2.4 * u;
        c0.beginPath();
        c0.moveTo(0, y0);
        c0.lineTo(0, y1);
        c0.stroke();
        c0.fillStyle = INK;
        c0.beginPath();
        c0.moveTo(0, y1 - 13 * u);
        c0.lineTo(2.6 * u, y1 - 3 * u);
        c0.lineTo(0, y1 + 1.5 * u);
        c0.lineTo(-2.6 * u, y1 - 3 * u);
        c0.closePath();
        c0.fill();
        c0.restore();
        // the man
        c0.scale(1, sY);
        blit(c0, KEYS[m.vi][m.lean], 0, 0, hPx, 1);
        c0.restore();
      }
      c0.globalAlpha = 1;
      // dormant: the whole layer at 0.28
      ctx.globalAlpha = TONE.dead * vis;
      ctx.drawImage(L0, 0, 0);
      // awake: the same layer again inside each host's front (a disc growing from the cord's landing point)
      if (frame <= T.land[0]) return;
      const L1 = layerCanvas(1);
      const c1 = L1.getContext("2d") as CanvasRenderingContext2D;
      c1.setTransform(1, 0, 0, 1, 0, 0);
      c1.clearRect(0, 0, FRAME_W, FRAME_H);
      HOSTS.forEach((_, hi) => {
        const R = Math.min((frame - T.land[hi]) * WAKE_V, HOST_REACH[hi] + 120) * cam.k;
        if (R <= 0) return;
        const [lx, ly] = screenOf(landAt(hi, frame), cam);
        const g = c1.createRadialGradient(lx, ly, Math.max(0, R - 14), lx, ly, R);
        g.addColorStop(0, "rgba(0,0,0,1)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        c1.fillStyle = g;
        c1.beginPath();
        c1.arc(lx, ly, R, 0, 2 * Math.PI);
        c1.fill();
      });
      c0.globalCompositeOperation = "destination-in";
      c0.drawImage(L1, 0, 0);
      c0.globalCompositeOperation = "source-over";
      ctx.globalAlpha = WAKE_GAIN * vis;
      ctx.drawImage(L0, 0, 0);
    }}
  />
);

// ---------------------------------------------------------------------------
// THE SIX CORDS (quipu cords): from his fists (s = 0) to the hosts (s = 1).
// The curve is stringsShared's string (stringPoint), the line its PuppetString.
// ---------------------------------------------------------------------------
/** the dormant stubs: where each cord's end hangs under the fist (dx, length) */
const STUB: P2[] = [
  [-9, 58],
  [9, 58],
  [-2, 48],
  [2, 48],
  [6, 40],
  [-6, 40],
];
const KNOT_GAP = 60;
type CordState = { g: StringGeom; taut: boolean; p: number; base: number; headTone: number; q: number; e: number; knots: number[]; hang: P2 };
const cordAt = (c: number, f: number, fists: { L: P2; R: P2 }): CordState => {
  const left = c % 2 === 0;
  const j = Math.floor(c / 2) - 1; // -1, 0, 1 across the fist
  const fist = left ? fists.L : fists.R;
  const from: P2 = [fist[0] + j * 2.6 * (left ? -1 : 1), fist[1] + 8];
  const land = landAt(c, f);
  const hang: P2 = [from[0] + STUB[c][0] + 1.6 * Math.sin(f / 13 + c * 1.9), from[1] + STUB[c][1]];
  const t0 = T.launch[c];
  const t1 = T.land[c];
  const e = smootherstep((f - t0) / 9);
  const u = clamp01((f - t0) / (t1 - t0));
  // head-led: brisk out of the hand, easing onto the host
  const run = 1 - Math.pow(1 - u, 1.7) * (1 - 0.35 * u);
  const p = mix(1, run, e);
  const to = mix2(hang, land, e);
  // tension (gesture 5): the cord pulls taut behind its orange front, the hand's end first
  const q = orangeAt(c, f);
  const tight0 = 1 - 0.94 * smoothstep(q / 0.7);
  const tight1 = 1 - 0.94 * smoothstep((q - 0.3) / 0.7);
  const loose = mix(0.3, 0.8, e) + 0.2 * smoothstep((f - t1) / 10);
  const sway = e * (tight0 + tight1) * 0.5;
  const g: StringGeom = {
    from,
    to,
    slack: [loose * tight0, loose * tight1],
    sag: 0.24 * (1 + 0.07 * sway * Math.sin(f / 10 + c * 1.7)),
    side: (left ? -1 : 1) * (1 + 0.35 * sway * Math.sin(f / 12.5 + c * 2.3)),
  };
  const L = vlen([land[0] - from[0], land[1] - from[1]]);
  const knots: number[] = [];
  for (let d = KNOT_GAP; d < L * 0.93; d += KNOT_GAP) knots.push(d / L);
  return {
    g,
    taut: q >= 1,
    p,
    base: mix(TONE.dead, 1, smoothstep((f - t0) / 5)),
    headTone: mix(TONE.second, 1, smoothstep((f - t1) / 6)),
    q,
    e,
    knots,
    hang,
  };
};

const Cords: React.FC<{ cam: Cam; frame: number; fists: { L: P2; R: P2 } }> = ({ cam, frame, fists }) => {
  const k = cam.k;
  const w = STRING_W / k;
  return (
    <WorldSvg cam={cam}>
      {HOSTS.map((_, c) => {
        const s = cordAt(c, frame, fists);
        const live: [number, number] | null = s.q > 0.002 ? [0, s.q] : null;
        // behind the head the cord is at full tone; the last stretch steps down to the head's 0.55
        const segs: [number, number, number][] =
          s.headTone > 0.995 || s.e < 0.02
            ? [[0, s.p, s.base]]
            : [
                [0, Math.max(0, s.p - 0.16), s.base],
                [Math.max(0, s.p - 0.16), Math.max(0, s.p - 0.08), s.base * mix(s.headTone, 1, 0.5)],
                [Math.max(0, s.p - 0.08), s.p, s.base * s.headTone],
              ];
        const coil = 1 - s.e;
        return (
          <g key={c}>
            {segs.map(([a, b, tone], i) => (
              <PuppetString key={i} {...s.g} drawn={[a, b]} base={tone} live={live} highlight={s.taut ? glintAt(frame, c * 3, 34) : null} k={k} />
            ))}
            {coil > 0.02 ? (
              // the dormant end: a small coil of cord, unwinding as it leaves
              <circle
                cx={s.hang[0]}
                cy={s.hang[1] + 6.5}
                r={6.5}
                fill="none"
                stroke={INK}
                strokeOpacity={s.base}
                strokeWidth={w * 0.9}
                strokeDasharray={`${(41 * coil).toFixed(1)} 60`}
                transform={`rotate(-90 ${s.hang[0].toFixed(1)} ${(s.hang[1] + 6.5).toFixed(1)})`}
              />
            ) : null}
            {s.knots.map((sk, i) => {
              const grow = clamp01((s.p - sk - 0.02) / 0.05) * s.e;
              if (grow <= 0.01) return null;
              const [x, y] = stringPoint(s.g, sk);
              const on = s.q >= sk;
              return <circle key={i} cx={x} cy={y} r={((4.6 / k) * grow).toFixed(2)} fill={on ? ACCENT : INK} stroke={DARK} strokeOpacity={0.6} strokeWidth={1.3 / k} />;
            })}
          </g>
        );
      })}
    </WorldSvg>
  );
};

// ---------------------------------------------------------------------------
// CHECKS (module scope: a broken timeline fails before a frame is rendered)
// ---------------------------------------------------------------------------
(() => {
  // the payoff is COMPLETE by f140: every cord orange end to end, every spear up, every host leaning in
  HOSTS.forEach((_, c) => {
    if (orangeAt(c, 131) < 1 || answerAt(c, 140) < 1) throw new Error(`ReachingOutToHisPeople: cord / host ${c} is not finished by f140`);
    if (orangeAt(c, 107) > 0) throw new Error(`ReachingOutToHisPeople: cord ${c} is orange before f108`);
  });
  for (const m of MEN) if (spearOf(m, 104) < 0.999 || riseOf(m, 66) < 0.99) throw new Error("ReachingOutToHisPeople: a man is late (risen by f66, spear up by f104)");
  for (let f = 0; f < DURATION; f++) {
    const cam = camAt(f);
    // the label, while it is there, and (from the wide on) the hosts' feet stay above the caption band
    if (f < T.labelOut[1] && screenOf([540, 760], cam)[1] + 64 >= CAPTION_TOP) throw new Error(`ReachingOutToHisPeople: the label in the caption band at f${f}`);
    if (f >= 56) {
      for (const H of HOSTS) {
        const [sx, sy] = screenOf([H.cx, H.fy + 2], cam);
        if (sy >= CAPTION_TOP + 15) throw new Error(`ReachingOutToHisPeople: a host in the caption band at f${f} (y ${sy.toFixed(0)})`);
        const half = (((RANKS[0] - 1) / 2) * DX + 0.2 * MAN_H) * cam.k;
        if (sx - half < 40 || sx + half > FRAME_W - 40) throw new Error(`ReachingOutToHisPeople: a host within 40 px of the edge at f${f}`);
      }
    }
    // a running cord's head always has page ahead of it
    const a = emperorAnchors(poseAt(f), "inca");
    HOSTS.forEach((_, c) => {
      if (f < T.launch[c] || f > T.land[c]) return;
      const s = cordAt(c, f, { L: a.fistL, R: a.fistR });
      const [hx, hy] = screenOf(stringPoint(s.g, s.p), cam);
      if (hx < 50 || hx > FRAME_W - 50 || hy > FRAME_H - 200) throw new Error(`ReachingOutToHisPeople: cord ${c}'s head leaves the frame at f${f}`);
    });
  }
})();

const ReachingOutToHisPeople: React.FC<Props> = ({ vignette, hostsFromStart }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const scene = sceneAt(frame);
  const a = emperorAnchors(scene.emperor, "inca");
  const vis = hostsFromStart ? 1 : smoothstep((frame - T.hostsIn[0]) / (T.hostsIn[1] - T.hostsIn[0]));
  const labelOp =
    mix(1, TONE.second, smoothstep((frame - T.labelDim[0]) / (T.labelDim[1] - T.labelDim[0]))) * (1 - smoothstep((frame - T.labelOut[0]) / (T.labelOut[1] - T.labelOut[0])));
  return (
    <StringsPage cam={cam} vignette={vignette}>
      <Hosts cam={cam} frame={frame} vis={vis} />
      <Tableau scene={scene} cam={cam} frame={frame} uid="roe" />
      <ForearmStrings cam={cam} frame={frame} pose={scene.emperor} />
      <Cords cam={cam} frame={frame} fists={{ L: a.fistL, R: a.fistR }} />
      <Label text="ATAHUALPA" x={540} y={760} dy={64} cam={cam} frame={frame} f0={-40} opacity={labelOp} />
    </StringsPage>
  );
};

export default ReachingOutToHisPeople;
