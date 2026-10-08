// ---------------------------------------------------------------------------
// SoonerOrLaterABadKing: a MAP cut of the clip "Sheppard: East India kings"
// (Dwarkesh Patel with Si Sheppard, why the East India Company beat the Indian
// kingdoms). Dwarkesh map style: the Indian subcontinent c. 1756, north-up
// Lambert conformal conic, NO borders (the modern ones did not exist and we
// hold no period data). 1080x1920, 23.976 fps, opaque.
//
// LINE (Dwarkesh; word onsets in frames of this composition): "there's (5) this
// (11) monarchical (16) tradition (34) across (48) all (59) these (68)
// principalities (72) in (87) India (91), there's (103) just (111) going to be
// (116) sooner (124) or (130) later (136) a (140) bad (144) king (150). And
// (162) that (170) king (180) will (185) not (189) be able to (191) stop (199)
// the (206) British (212) incursion (219)." Cut back to the speaker at f234.
// DURATION = sequence frames 797 ... 1031 = 234 frames at 24000/1001 fps (9.76 s).
//
// CHECK LINE (what the viewer can say after this cut): "Every Indian kingdom
// rolled the dice at each succession; when Bengal's came up bad, the British
// walked in."
//
// THE MOTION (one continuous development; the camera never rests): engraved
// cream crowns stand on eight seats of hereditary rulers, arriving in one wave
// from the north-west to the south-east while the camera drifts from the north
// out to the whole subcontinent. Then the crown at each seat is handed on in a
// relay round the map (old one lifts away, a new sound one drops and settles)
// while the camera pushes toward Bengal; on "bad king" the succession at
// Murshidabad lands a cracked, crooked crown. ORANGE = the British (the East
// India Company) and nothing else: the fort mark at Calcutta from the first
// frame, then one bold advance in from the sea, north past Plassey that knocks the cracked
// crown off its seat (it lies fallen beside it); a Union Flag (orange and
// cream) is planted on the seat and a soft disc of orange hatch spreads round it and keeps
// creeping outward. The close frame creeps on, the flag in one slow wave.
//
// ELEMENT TYPES: the map, the seat + its crown, the orange (fort, advance,
// flag, hatch), one label (INDIA, on the word). No place names, no dates.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  INK_FULL,
  Mottle,
  PaperTop,
  SEA,
  WorldSvg,
  camTransform,
  clamp01,
  fellSC,
  labelSlide,
  mixColor,
  pchip,
  screenOf,
  smoothstep,
  swayCam,
  viewRect,
  type Cam,
} from "./incaShared";
import { ADVANCE, BENGAL_LAND_D, CALCUTTA, INDIA_AT, MURSHIDABAD, SEATS, type P2 } from "./SoonerOrLaterABadKingMapData";
import { LEVELS } from "./SoonerOrLaterABadKingLevels";

export const FPS = 24000 / 1001;
export const DURATION = 234; // sequence frames 797 ... 1031

export const schema = z.object({
  vignette: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---------------------------------------------------------------------------
// Timing (frames)
// ---------------------------------------------------------------------------
export const T = {
  label: 83, // INDIA slides up, landing on the word (f91)
  labelDim: [108, 122] as [number, number],
  badStart: 134, // the old crown at Murshidabad lifts; the bad one lands at ~f148
  advance: [156, 208] as [number, number], // the orange advance: the sea -> Calcutta -> Murshidabad
  knock: 205, // the cracked crown is struck off
  seatTurn: [206, 213] as [number, number],
  hatch: [207, 224] as [number, number], // then it keeps creeping outward
  flag: [206, 214] as [number, number], // the Union Flag is planted on the seat
};
const D_IN = 11; // a crown drops and settles
const D_OUT = 9; // a crown lifts away
const LEAD = 4; // the new crown starts this long after the old one lifts
const D_KNOCK = 12; // struck at f205, lying beside the seat by f217, still by ~f222

// ---------------------------------------------------------------------------
// THE CAMERA: a coarse keyed track (monotone cubic through the keys) followed
// by the house damper, so nothing pops and no key is a corner. Keys are the
// world point at the frame's true centre and the zoom.
// ---------------------------------------------------------------------------
const K_CLOSE = 4.2;
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;
const SEAT_Y = 716; // Murshidabad's seat on screen in the close frame
const KEYS: { f: number; k: number; cx: number; cy: number }[] = [
  { f: -80, k: 1.3, cx: 452, cy: 650 },
  { f: -4, k: 1.2, cx: 468, cy: 742 }, // the north, the Gujarat coast and the Arabian Sea in frame
  { f: 82, k: 1.0, cx: 556, cy: 960 }, // the whole subcontinent
  { f: 92, k: 1.0, cx: 572, cy: 955 },
  { f: 122, k: 1.5, cx: 715, cy: 880 },
  { f: 150, k: 2.75, cx: 852, cy: 812 },
  { f: 171, k: K_CLOSE, cx: MURSHIDABAD[0], cy: MURSHIDABAD[1] + (960 - SEAT_Y) / K_CLOSE },
  { f: 240, k: 4.5, cx: MURSHIDABAD[0], cy: MURSHIDABAD[1] + (960 - (SEAT_Y - 6)) / 4.5 },
];
const F_LO = -80;
const CAM_TRACK = (() => {
  const LK = pchip(KEYS.map((q) => [q.f, Math.log(q.k)] as [number, number]));
  const CX = pchip(KEYS.map((q) => [q.f, q.cx] as [number, number]));
  const CY = pchip(KEYS.map((q) => [q.f, q.cy] as [number, number]));
  const out: Cam[] = [];
  let lk = LK(F_LO);
  let cx = CX(F_LO);
  let cy = CY(F_LO);
  let vk = (LK(F_LO + 1) - LK(F_LO)) * 1;
  let vx = CX(F_LO + 1) - CX(F_LO);
  let vy = CY(F_LO + 1) - CY(F_LO);
  for (let f = F_LO; f <= DURATION + 4; f++) {
    out.push({ k: Math.exp(lk), cx, cy });
    vk += (LK(f + 1) - lk) * CAM_STIFF - vk * CAM_DAMP;
    lk += vk;
    vx += (CX(f + 1) - cx) * CAM_STIFF - vx * CAM_DAMP;
    cx += vx;
    vy += (CY(f + 1) - cy) * CAM_STIFF - vy * CAM_DAMP;
    cy += vy;
  }
  return out;
})();
export const cameraAt = (f: number): Cam => CAM_TRACK[Math.max(0, Math.min(CAM_TRACK.length - 1, Math.round(f) - F_LO))];

// ---------------------------------------------------------------------------
// THE MAP: the baked tiles (scripts/bake-badking-rasters.mjs) + mottle
// ---------------------------------------------------------------------------
const COVER_FADE = 48;
export const levelWeights = (cam: Cam) => {
  const v = viewRect(cam, 16);
  return LEVELS.map((L) => {
    if (!L.band) return 1;
    const kw = smoothstep(Math.log(cam.k / L.band[0]) / Math.log(L.band[1] / L.band[0]));
    if (kw <= 0) return 0;
    const inset = Math.min(v.x0 - L.x0, L.x0 + L.w - v.x1, v.y0 - L.y0, L.y0 + L.h - v.y1) * cam.k;
    return kw * smoothstep(inset / COVER_FADE);
  });
};
const MapStack: React.FC<{ cam: Cam }> = ({ cam }) => {
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const w = levelWeights(cam);
  const v = viewRect(cam, 24);
  return (
    <>
      {LEVELS.map((L, li) => {
        if (w[li] <= 0.001) return null;
        if (w.some((o, j) => j > li && o >= 0.999)) return null;
        const tiles = L.tiles.filter((t) => t.x0 < v.x1 && t.x0 + t.w > v.x0 && t.y0 < v.y1 && t.y0 + t.h > v.y0);
        return (
          <div key={L.name} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: w[li] }}>
            {tiles.map((t) => (
              <Img
                key={t.f}
                src={staticFile(`badking/${t.f}`)}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: t.W,
                  height: t.H,
                  transformOrigin: "0 0",
                  transform: `translate(${(tx + t.x0 * k).toFixed(3)}px, ${(ty + t.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
                }}
              />
            ))}
          </div>
        );
      })}
      <Mottle cam={cam} opacity={0.9} />
    </>
  );
};

// ---------------------------------------------------------------------------
// THE CROWN: an engraved open crown, drawn in a 100-wide box whose origin is
// the middle of its base (y up = negative). Sound, or (bad) cracked through
// with one point snapped, the two halves sprung apart.
// ---------------------------------------------------------------------------
const BODY_D = "M-40,-2Q0,7 40,-2L43,-22L50,-62L32,-38L25,-72L12,-40L0,-80L-12,-40L-25,-72L-32,-38L-50,-62L-43,-22Z";
// the bad one: the second point is a jagged stub
const BODY_BAD_D = "M-40,-2Q0,7 40,-2L43,-22L50,-62L32,-38L25,-72L12,-40L0,-80L-12,-40L-19,-55L-24,-49L-29,-54L-32,-38L-50,-62L-43,-22Z";
const BAND_D = "M-43,-22Q0,-13 43,-22";
const TIPS: P2[] = [
  [-50, -62],
  [-25, -72],
  [0, -80],
  [25, -72],
  [50, -62],
];
const HATCH_D = (() => {
  let d = "";
  for (let c = -40; c <= 120; c += 7.5) d += `M${c - 100},10L${c + 10},-100`;
  return d;
})();
const CRACK: P2[] = [
  [9, -100],
  [13, -41],
  [5, -30],
  [15, -20],
  [4, -10],
  [11, 14],
];
const CRACK_D = `M${CRACK.slice(1)
  .map(([x, y]) => `${x},${y}`)
  .join("L")}`;
const CLIP_L_D = `M-90,-110L${CRACK.map(([x, y]) => `${x},${y}`).join("L")}L-90,14Z`;
const CLIP_R_D = `M90,-110L${CRACK.map(([x, y]) => `${x},${y}`).join("L")}L90,14Z`;
const CROWN_W0 = 122; // px wide in the wide frame (k 1)
export const crownW = (k: number) => CROWN_W0 * Math.pow(k, 0.58);

const CrownDefs: React.FC = () => (
  <defs>
    <clipPath id="bkBody">
      <path d={BODY_D} />
    </clipPath>
    <clipPath id="bkBodyBad">
      <path d={BODY_BAD_D} />
    </clipPath>
    <clipPath id="bkShade">
      <rect x={6} y={-110} width={70} height={130} />
    </clipPath>
    <clipPath id="bkL">
      <path d={CLIP_L_D} />
    </clipPath>
    <clipPath id="bkR">
      <path d={CLIP_R_D} />
    </clipPath>
  </defs>
);
const CrownArt: React.FC<{ sw: number; casing: number; bad?: boolean }> = ({ sw, casing, bad = false }) => {
  const body = bad ? BODY_BAD_D : BODY_D;
  const tips = bad ? TIPS.filter((_, i) => i !== 1) : TIPS;
  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      <path d={body} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={sw + casing} />
      {tips.map(([x, y], i) => (
        <circle key={`pc${i}`} cx={x} cy={y - 4} r={5.6 + casing / 2} fill={DARK} fillOpacity={0.6} />
      ))}
      <path d={body} fill={mixColor(DARK, INK, 0.2)} />
      <g clipPath={`url(#${bad ? "bkBodyBad" : "bkBody"})`}>
        <g clipPath="url(#bkShade)">
          <path d={HATCH_D} fill="none" stroke={INK} strokeOpacity={0.62} strokeWidth={sw * 0.42} strokeLinecap="butt" />
        </g>
      </g>
      <path d={body} fill="none" stroke={INK} strokeWidth={sw} />
      <path d={BAND_D} fill="none" stroke={INK} strokeWidth={sw * 0.8} />
      {tips.map(([x, y], i) => (
        <circle key={`p${i}`} cx={x} cy={y - 4} r={5.6} fill={INK} />
      ))}
      <path d="M0,-13.5L5.5,-7.5L0,-1.5L-5.5,-7.5Z" fill={INK} />
      <circle cx={-24} cy={-9.5} r={3.4} fill={INK} />
      <circle cx={24} cy={-9.5} r={3.4} fill={INK} />
    </g>
  );
};
/** a crown whose base middle is at screen (x, y), w px wide */
const Crown: React.FC<{ x: number; y: number; w: number; rot?: number; opacity?: number; bad?: boolean }> = ({ x, y, w, rot = 0, opacity = 1, bad = false }) => {
  if (opacity <= 0.004) return null;
  const s = w / 111;
  const sw = (5 * Math.pow(s, 0.55)) / s;
  const casing = 5 / s;
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${rot.toFixed(2)}) scale(${s.toFixed(4)})`} opacity={opacity * INK_FULL}>
      {bad ? (
        <>
          <g transform="rotate(-2 10 -2)">
            <g clipPath="url(#bkL)">
              <CrownArt sw={sw} casing={casing} bad />
              <g clipPath="url(#bkBodyBad)">
                <path d={CRACK_D} fill="none" stroke={INK} strokeWidth={sw * 0.9} strokeLinejoin="miter" />
              </g>
            </g>
          </g>
          <g transform="rotate(8 10 -2)">
            <g clipPath="url(#bkR)">
              <CrownArt sw={sw} casing={casing} bad />
              <g clipPath="url(#bkBodyBad)">
                <path d={CRACK_D} fill="none" stroke={INK} strokeWidth={sw * 0.9} strokeLinejoin="miter" />
              </g>
            </g>
          </g>
        </>
      ) : (
        <CrownArt sw={sw} casing={casing} />
      )}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE SEATS and their successions
// ---------------------------------------------------------------------------
// where a crown stands relative to its seat, in crown widths: [dx, dy] of the
// base's middle from the seat's centre. Default = on the seat. Three are
// nudged beside their seats (a short leader tick joins them): Jaipur clears
// Delhi's crown; Srirangapatna and Arcot clear each other and the caption strip.
const PLACE: Record<string, { at: P2; tick: boolean }> = {
  jaipur: { at: [-0.64, 0.34], tick: true },
  srirangapatna: { at: [-0.66, 0.44], tick: true },
  arcot: { at: [0.66, 0.56], tick: true },
};
// the first wave (north-west -> south-east), then the relay of successions
const ARRIVE: Record<string, number> = { delhi: -16, jaipur: -10, faizabad: -4, pune: 16, hyderabad: 38, murshidabad: 43, srirangapatna: 51, arcot: 58 };
const RELAY: Record<string, number[]> = {
  pune: [95],
  srirangapatna: [99],
  arcot: [103],
  hyderabad: [107],
  jaipur: [111],
  delhi: [115],
  murshidabad: [118, T.badStart],
  faizabad: [124],
};
type CrownLife = { tIn: number; tOut: number; kind: "first" | "good" | "bad" };
const LIVES: CrownLife[][] = SEATS.map((s) => {
  const turns = RELAY[s.key] ?? [];
  const lives: CrownLife[] = [{ tIn: ARRIVE[s.key], tOut: turns[0] ?? 1e9, kind: "first" }];
  turns.forEach((t, i) => {
    const bad = s.key === "murshidabad" && t === T.badStart;
    lives.push({ tIn: t + LEAD, tOut: bad ? T.knock : (turns[i + 1] ?? 1e9), kind: bad ? "bad" : "good" });
  });
  return lives;
});
const ringR = (k: number) => 8.5 * Math.pow(k, 0.5);
const easeOut = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);

// ---------------------------------------------------------------------------
// THE ORANGE: the fort mark, the advance, the hatch
// ---------------------------------------------------------------------------
const FORT_D = (() => {
  // a four-bastion star fort, unit radius
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i - Math.PI / 4;
    const r = i % 2 === 0 ? 1 : 0.52;
    pts.push(`${(Math.cos(a) * r).toFixed(3)},${(Math.sin(a) * r).toFixed(3)}`);
  }
  return `M${pts.join("L")}Z`;
})();
const ADV_CUM = (() => {
  const c = [0];
  for (let i = 1; i < ADVANCE.length; i++) c.push(c[i - 1] + Math.hypot(ADVANCE[i][0] - ADVANCE[i - 1][0], ADVANCE[i][1] - ADVANCE[i - 1][1]));
  return c;
})();
const ADV_LEN = ADV_CUM[ADV_CUM.length - 1];
const advAt = (s: number): { p: P2; n: P2; t: P2 } => {
  const q = Math.max(0, Math.min(ADV_LEN, s));
  let i = 1;
  while (i < ADV_CUM.length - 1 && ADV_CUM[i] < q) i++;
  const a = ADVANCE[i - 1];
  const b = ADVANCE[i];
  const l = ADV_CUM[i] - ADV_CUM[i - 1] || 1;
  const u = (q - ADV_CUM[i - 1]) / l;
  const t: P2 = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
  return { p: [a[0] + (b[0] - a[0]) * u + t[0] * (s - q), a[1] + (b[1] - a[1]) * u + t[1] * (s - q)], n: [t[1], -t[0]], t };
};
const SHAFT_W = 26; // screen px
const HEAD_L = 70;
const HEAD_W = 78;
/** the advance as one barbed arrow from Calcutta to arclength `tip` (world px) */
const arrowD = (tip: number, k: number) => {
  const g = clamp01(tip / ((HEAD_L * 1.15) / k)); // the head grows out of the sea
  const hl = (HEAD_L * g) / k;
  const hw = (HEAD_W * g) / 2 / k;
  const sw = (SHAFT_W * (0.55 + 0.45 * g)) / 2 / k;
  const neck = tip - hl * 0.74;
  const left: P2[] = [];
  const right: P2[] = [];
  const N = 18;
  for (let i = 0; i <= N; i++) {
    const { p, n } = advAt((Math.max(0, neck) * i) / N);
    left.push([p[0] + n[0] * sw, p[1] + n[1] * sw]);
    right.push([p[0] - n[0] * sw, p[1] - n[1] * sw]);
  }
  const base = advAt(tip - hl);
  const top = advAt(tip);
  const head: P2[] = [
    [base.p[0] + base.n[0] * hw, base.p[1] + base.n[1] * hw],
    top.p,
    [base.p[0] - base.n[0] * hw, base.p[1] - base.n[1] * hw],
  ];
  return `M${[...left, ...head, ...right.reverse()].map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join("L")}Z`;
};
const HATCH_R = 64; // world px (~150 km): how far the hatch has spread when it slows to a creep
const HATCH_CREEP = 0.2; // world px per frame, to the last frame
const FLAG_H = 236; // screen px: the pole in the close frame
const FLAG_W = 250; // the Union Flag, 5:3
const FLAG_HT = 150;
const FLAG_SALTIRE = 18;
const FLAG_CROSS = 28;
const HATCH_P = 11.5 / K_CLOSE;
const HATCH_W = 2.9 / K_CLOSE;

const SoonerOrLaterABadKing: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(cameraAt(frame), frame);
  const k = cam.k;
  const W = crownW(k);
  const rr = ringR(k);

  // --- the advance
  const tipGap = (rr + 7) / k;
  const advU = clamp01((frame - T.advance[0]) / (T.advance[1] - T.advance[0]));
  const advP = 1 - Math.pow(1 - advU, 2); // under way at once, easing into the seat
  const tip = advP * (ADV_LEN - tipGap);
  const arrow = advU > 0 ? arrowD(tip, k) : "";
  const seatTurn = smoothstep((frame - T.seatTurn[0]) / (T.seatTurn[1] - T.seatTurn[0]));
  const hatchU = clamp01((frame - T.hatch[0]) / (T.hatch[1] - T.hatch[0]));
  const hatchR = HATCH_R * easeOut(hatchU) + HATCH_CREEP * Math.max(0, frame - T.hatch[0]);
  // --- the flag: a pre-1801 Union Flag in the house two tones (orange field, the saltire and
  // the cross in cream with dark casing); it rises out of the seat in one eased move, then
  // one slow wave runs along it
  const flagG = easeOut((frame - T.flag[0]) / (T.flag[1] - T.flag[0]));
  const [mx, my] = screenOf(MURSHIDABAD, cam);
  const poleH = FLAG_H * flagG;
  const flag = (() => {
    const y0 = -poleH + 6;
    const sy = 0.5 + 0.5 * flagG;
    const wave = (x: number) => 11 * (x / FLAG_W) * Math.sin((2 * Math.PI * x) / 270 - (2 * Math.PI * (frame - T.flag[0])) / 46) + 8 * (x / FLAG_W) * (x / FLAG_W);
    const M = (x: number, y: number) => `${(x * flagG).toFixed(2)},${(y0 + y * sy + wave(x)).toFixed(2)}`;
    // a straight band a -> b of width w (flag units), bent by the wave
    const band = (a: P2, b: P2, w: number) => {
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const n: P2 = [(-(b[1] - a[1]) / l) * (w / 2), ((b[0] - a[0]) / l) * (w / 2)];
      const one: string[] = [];
      const two: string[] = [];
      for (let i = 0; i <= 12; i++) {
        const x = a[0] + ((b[0] - a[0]) * i) / 12;
        const y = a[1] + ((b[1] - a[1]) * i) / 12;
        one.push(M(x + n[0], y + n[1]));
        two.push(M(x - n[0], y - n[1]));
      }
      return `M${one.join("L")}L${two.reverse().join("L")}Z`;
    };
    const W_ = FLAG_W;
    const H_ = FLAG_HT;
    const field = band([0, H_ / 2], [W_, H_ / 2], H_);
    const saltire = (w: number) => band([-10, -6], [W_ + 10, H_ + 6], w) + band([-10, H_ + 6], [W_ + 10, -6], w);
    const cross = (w: number) => band([-4, H_ / 2], [W_ + 4, H_ / 2], w) + band([W_ / 2, -4], [W_ / 2, H_ + 4], w);
    return { field, saltire, cross };
  })();

  // --- the label
  const sl = labelSlide(frame, T.label, 14, 9);
  const labelOp = sl.op * (1 - smoothstep((frame - T.labelDim[0]) / (T.labelDim[1] - T.labelDim[0])));
  const [lx, ly] = screenOf(INDIA_AT, cam);
  const SIZE = 96 * Math.pow(k, 0.45);
  const SPACING = 0.46;

  // --- seats, back to front
  const order = SEATS.map((s, i) => ({ s, i })).sort((a, b) => a.s.y - b.s.y);
  const [fx, fy] = screenOf(CALCUTTA, cam);
  const fortR = 24 * Math.pow(k, 0.5);

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />

      {/* THE ORANGE in the world: the hatch round the taken seat, the advance */}
      <WorldSvg cam={cam}>
        <defs>
          <clipPath id="bkLand">
            <path d={BENGAL_LAND_D} clipRule="evenodd" />
          </clipPath>
          <pattern id="bkHatch" patternUnits="userSpaceOnUse" width={HATCH_P} height={HATCH_P} patternTransform="rotate(45)">
            <line x1={0} y1={-1} x2={0} y2={HATCH_P + 1} stroke={ACCENT} strokeWidth={HATCH_W} />
            <line x1={HATCH_P} y1={-1} x2={HATCH_P} y2={HATCH_P + 1} stroke={ACCENT} strokeWidth={HATCH_W} />
          </pattern>
          <radialGradient id="bkDisc" gradientUnits="userSpaceOnUse" cx={MURSHIDABAD[0]} cy={MURSHIDABAD[1]} r={Math.max(0.01, hatchR)}>
            <stop offset={0} stopColor="#fff" />
            <stop offset={0.62} stopColor="#fff" />
            <stop offset={1} stopColor="#000" />
          </radialGradient>
          <mask id="bkDiscMask" maskUnits="userSpaceOnUse" x={MURSHIDABAD[0] - 90} y={MURSHIDABAD[1] - 90} width={180} height={180}>
            <rect x={MURSHIDABAD[0] - 90} y={MURSHIDABAD[1] - 90} width={180} height={180} fill="url(#bkDisc)" />
          </mask>
        </defs>
        {hatchU > 0 ? (
          <g clipPath="url(#bkLand)">
            <g mask="url(#bkDiscMask)">
              <circle cx={MURSHIDABAD[0]} cy={MURSHIDABAD[1]} r={88} fill={ACCENT_DEEP} fillOpacity={0.3} />
              <circle cx={MURSHIDABAD[0]} cy={MURSHIDABAD[1]} r={88} fill="url(#bkHatch)" opacity={0.9} />
            </g>
          </g>
        ) : null}
        {arrow ? (
          <>
            <path d={arrow} fill={DARK} fillOpacity={0.6} stroke={DARK} strokeOpacity={0.6} strokeWidth={6 / k} strokeLinejoin="round" />
            <path d={arrow} fill={ACCENT} stroke={ACCENT_DEEP} strokeWidth={1.6 / k} strokeLinejoin="round" />
          </>
        ) : null}
      </WorldSvg>

      {/* screen-sized symbols: the label, the seats, the fort, the crowns */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <CrownDefs />
        {labelOp > 0.002 ? (
          <text
            x={lx + (SIZE * SPACING) / 2}
            y={ly + sl.dy}
            textAnchor="middle"
            opacity={labelOp * INK_FULL}
            fill={INK}
            stroke={DARK}
            strokeOpacity={0.45}
            strokeWidth={SIZE * 0.09}
            strokeLinejoin="round"
            paintOrder="stroke"
            style={{ fontFamily: fellSC, fontSize: SIZE, letterSpacing: SIZE * SPACING }}
          >
            INDIA
          </text>
        ) : null}

        {/* the seats: a cream ring and dot (Murshidabad's turns orange when it is taken) */}
        {order.map(({ s, i }) => {
          const a = clamp01((frame - (ARRIVE[s.key] - 4)) / 8);
          if (a <= 0) return null;
          const [x, y] = screenOf([s.x, s.y], cam);
          if (x < -200 || x > FRAME_W + 200 || y < -200 || y > FRAME_H + 200) return null;
          const col = s.key === "murshidabad" ? mixColor(INK, ACCENT, seatTurn) : INK;
          const place = PLACE[s.key];
          const sw = 3.2 * Math.pow(k, 0.3);
          return (
            <g key={`seat${i}`} opacity={a}>
              {place?.tick ? (
                <line
                  x1={x + Math.sign(place.at[0]) * (rr + 3)}
                  y1={y + 2}
                  x2={x + Math.sign(place.at[0]) * (Math.abs(place.at[0]) * W - W * 0.46)}
                  y2={y + place.at[1] * W - W * 0.2}
                  stroke={INK}
                  strokeOpacity={0.8}
                  strokeWidth={sw * 0.8}
                  strokeLinecap="round"
                />
              ) : null}
              <circle cx={x} cy={y} r={rr + sw / 2 + 1.6} fill={DARK} fillOpacity={0.6} />
              <circle cx={x} cy={y} r={rr} fill={mixColor(DARK, "#3F3428", 0.5)} stroke={col} strokeWidth={sw} />
              <circle cx={x} cy={y} r={rr * 0.36} fill={col} />
            </g>
          );
        })}

        {/* the fort at Calcutta: orange from the first frame */}
        <g transform={`translate(${fx.toFixed(2)} ${fy.toFixed(2)}) scale(${fortR.toFixed(3)})`}>
          <path d={FORT_D} fill={DARK} fillOpacity={0.62} stroke={DARK} strokeOpacity={0.62} strokeWidth={5 / fortR} strokeLinejoin="round" />
          <path d={FORT_D} fill={ACCENT} stroke={ACCENT_DEEP} strokeWidth={1.4 / fortR} strokeLinejoin="round" />
          <rect x={-0.2} y={-0.2} width={0.4} height={0.4} fill={DARK} fillOpacity={0.75} />
        </g>

        {/* the crowns */}
        {order.map(({ s, i }) => {
          const [sx, sy] = screenOf([s.x, s.y], cam);
          if (sx < -400 || sx > FRAME_W + 400 || sy < -400 || sy > FRAME_H + 500) return null;
          const place = PLACE[s.key]?.at;
          const bx = sx + (place ? place[0] * W : 0);
          const by = sy + (place ? place[1] * W : -(rr + 5 + 0.03 * W));
          return LIVES[i].map((c, j) => {
            const u = (frame - c.tIn) / (c.kind === "first" ? 12 : D_IN);
            if (u <= 0) return null;
            const e = easeOut(u);
            const after = Math.max(0, frame - c.tIn - (c.kind === "first" ? 12 : D_IN)); // frames since it landed
            let dx = 0;
            let dy = 0;
            let rot = 0;
            let op = clamp01(u * 2.2);
            if (c.kind === "first") dy = -0.28 * W * (1 - e);
            else {
              dx = -0.46 * W * (1 - e);
              dy = -0.86 * W * (1 - e);
              rot = -11 * (1 - e);
            }
            // it settles: a small give as it lands
            dy += 0.028 * W * Math.sin(Math.PI * clamp01(after / 6)) * (c.kind === "first" ? 0 : 1);
            if (c.kind === "bad") {
              dx += 0.07 * W;
              dy += 0.02 * W;
              rot = u < 1 ? 26 * e - 6 * (1 - e) : 20 + 6 * Math.exp(-after / 5) * Math.cos(after * 0.75);
            }
            const v = (frame - c.tOut) / (c.kind === "bad" ? D_KNOCK : D_OUT);
            let dim = c.kind === "bad" ? 0.74 : 1;
            if (c.kind === "bad") {
              if (v > 0) {
                // struck from below: thrown up and over, it lands on its side just right of
                // the seat and lies there (fallen, dimmer) to the end
                const q = clamp01(v);
                const lain = Math.max(0, frame - c.tOut - D_KNOCK); // frames since it came to rest
                dx += 0.4 * W * (0.4 * q + 0.6 * smoothstep(q));
                dy += 0.36 * W * q * q - 0.5 * W * Math.sin(Math.PI * q);
                rot = 20 + 86 * q * q + (q >= 1 ? -6 * (1 - Math.exp(-lain / 2.2)) + 3 * Math.exp(-lain / 2.2) * Math.sin(lain * 1.2) : 0);
                dim = 0.74 - 0.19 * smoothstep(q);
              }
            } else {
              if (v >= 1) return null;
              if (v > 0) {
                const q = v * v;
                dx += 0.52 * W * q;
                dy -= 0.8 * W * q;
                rot += 10 * q;
                op *= 1 - smoothstep(v);
              }
            }
            return <Crown key={`c${i}-${j}`} x={bx + dx} y={by + dy} w={W} rot={rot} opacity={op * dim} bad={c.kind === "bad"} />;
          });
        })}

        {/* THE FLAG: the Union Flag of 1707 (no St Patrick's saltire), orange and cream, planted on the taken seat */}
        {flagG > 0.001 ? (
          <g transform={`translate(${mx.toFixed(2)} ${my.toFixed(2)})`} strokeLinejoin="round" strokeLinecap="round">
            <defs>
              <clipPath id="bkFlag">
                <path d={flag.field} />
              </clipPath>
            </defs>
            <line x1={0} y1={0} x2={0} y2={-poleH} stroke={DARK} strokeOpacity={0.62} strokeWidth={15} />
            <path d={flag.field} fill={DARK} fillOpacity={0.62} stroke={DARK} strokeOpacity={0.62} strokeWidth={7} />
            <path d={flag.field} fill={ACCENT} />
            <g clipPath="url(#bkFlag)">
              <path d={flag.saltire(FLAG_SALTIRE + 9)} fill={DARK} fillOpacity={0.8} />
              <path d={flag.saltire(FLAG_SALTIRE)} fill={INK} />
              <path d={flag.cross(FLAG_CROSS + 12)} fill={DARK} fillOpacity={0.88} />
              <path d={flag.cross(FLAG_CROSS)} fill={INK} />
            </g>
            <path d={flag.field} fill="none" stroke={ACCENT_DEEP} strokeWidth={2.5} />
            <line x1={0} y1={0} x2={0} y2={-poleH} stroke={ACCENT} strokeWidth={9} />
            <circle cx={0} cy={-poleH - 4} r={8} fill={ACCENT} stroke={DARK} strokeOpacity={0.62} strokeWidth={2.5} />
          </g>
        ) : null}
      </svg>

      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default SoonerOrLaterABadKing;
