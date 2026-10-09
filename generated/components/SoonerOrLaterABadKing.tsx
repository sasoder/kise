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
// India Company) and nothing else: an orange East Indiaman, far down the bay
// from the start, sails up to the Hooghly mouth and anchors; a column of orange
// dots, four abreast, leaves it rank by rank and marches inland; as its head
// reaches the seat the cracked
// crown off its seat (it lies fallen beside it); a Union Flag (orange and
// cream) is planted on the seat and a soft disc of orange hatch spreads round it and keeps
// creeping outward while the column wheels round the seat into concentric
// arcs, still marching, slower, in the last frame.
//
// ELEMENT TYPES: the map, the seat + its crown, the orange (ship, dots,
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
import { BENGAL_LAND_D, INDIA_AT, MURSHIDABAD, SEATS, SHIP_FROM, SHIP_STOP, type P2 } from "./SoonerOrLaterABadKingMapData";
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
  ship: [92, 156] as [number, number], // the ship sails up the bay and anchors
  march: 158, // the first rank leaves the ship
  slow: 214, // the head of the column begins to slow as it wheels round the seat
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
const K_CLOSE = 4.3;
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;
const SEAT_Y = 800; // Murshidabad's seat on screen in the close frame
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
// THE ORANGE: the ship, the column, the hatch
// ---------------------------------------------------------------------------
const hash = (i: number, q: number) => {
  const v = Math.sin(i * 12.9898 + q * 78.233) * 43758.5453;
  return v - Math.floor(v);
};
// THE COLUMN'S ROUTE (world px): it forms up just off the ship's bow (clear of her
// bowsprit), marches north up the river line, bears north-west and wheels clockwise round
// the seat (radius WHEEL_R) from the south-west to just short of the flag pole. A uniform
// Catmull-Rom through these points, by arclength.
const WHEEL_R = 50;
const ROUTE: P2[] = (() => {
  const M = MURSHIDABAD;
  const R0: P2 = [SHIP_STOP[0] - 29, SHIP_STOP[1] - 3]; // off the bow
  const ctl: P2[] = [R0, [M[0] + 7, M[1] + 116], [M[0] + 1, M[1] + 88], [M[0] - 14, M[1] + 58]];
  for (let th = 140; th <= 250.5; th += 13.75) ctl.push([M[0] + WHEEL_R * Math.cos((th * Math.PI) / 180), M[1] + WHEEL_R * Math.sin((th * Math.PI) / 180)]);
  const ext: P2[] = [[2 * ctl[0][0] - ctl[1][0], 2 * ctl[0][1] - ctl[1][1]], ...ctl, [2 * ctl[ctl.length - 1][0] - ctl[ctl.length - 2][0], 2 * ctl[ctl.length - 1][1] - ctl[ctl.length - 2][1]]];
  const out: P2[] = [ctl[0]];
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    for (let q = 1; q <= 20; q++) {
      const t = q / 20;
      const c = (a: number) => 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t * t + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t * t * t);
      out.push([c(0), c(1)]);
    }
  }
  return out;
})();
const ROUTE_CUM = (() => {
  const c = [0];
  for (let i = 1; i < ROUTE.length; i++) c.push(c[i - 1] + Math.hypot(ROUTE[i][0] - ROUTE[i - 1][0], ROUTE[i][1] - ROUTE[i - 1][1]));
  return c;
})();
export const ROUTE_LEN = ROUTE_CUM[ROUTE_CUM.length - 1];
const routeAt = (s: number): { p: P2; n: P2 } => {
  const q = Math.max(0, Math.min(ROUTE_LEN, s));
  let i = 1;
  while (i < ROUTE_CUM.length - 1 && ROUTE_CUM[i] < q) i++;
  const l = ROUTE_CUM[i] - ROUTE_CUM[i - 1] || 1;
  const u = (q - ROUTE_CUM[i - 1]) / l;
  // the tangent, smoothed over a short span so the ranks turn as a body
  const a = ROUTE[Math.max(0, i - 3)];
  const b = ROUTE[Math.min(ROUTE.length - 1, i + 2)];
  const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return { p: [ROUTE[i - 1][0] + (ROUTE[i][0] - ROUTE[i - 1][0]) * u, ROUTE[i - 1][1] + (ROUTE[i][1] - ROUTE[i - 1][1]) * u], n: [(b[1] - a[1]) / tl, -(b[0] - a[0]) / tl] };
};
// THE COLUMN: ranks of four abreast, RANK_GAP apart both ways, marching in step: one body
// whose head is at arclength headS(frame); it slows as it wheels round the seat and is still
// moving, slowly, in the last frame
const RANKS = 18;
const FILES = 4;
const DOT_D = 22; // screen px across in the close frame
const RANK_GAP = 8; // world px (~1.6 dot diameters in the close frame)
const SLOW_F = 26;
const MARCH_V = (ROUTE_LEN - 1.5) / (T.slow - T.march + (DURATION - 1 - T.slow) - ((DURATION - 1 - T.slow) * (DURATION - 1 - T.slow)) / (2 * SLOW_F));
const headS = (f: number) => {
  if (f <= T.march) return 0;
  if (f <= T.slow) return MARCH_V * (f - T.march);
  const d = Math.min(f - T.slow, SLOW_F);
  return MARCH_V * (T.slow - T.march + d - (d * d) / (2 * SLOW_F));
};
export const columnAt = (frame: number): { p: P2; g: number }[] => {
  const out: { p: P2; g: number }[] = [];
  const hs = headS(frame);
  for (let r = 0; r < RANKS; r++)
    for (let j = 0; j < FILES; j++) {
      const id = r * FILES + j;
      const s = hs - r * RANK_GAP + 0.3 * Math.sin(frame / 7 + 6.283 * hash(id, 1)); // a very slight lag of its own
      if (s <= 0.2) continue;
      const { p, n } = routeAt(s);
      const off = (j - (FILES - 1) / 2) * RANK_GAP + 0.25 * Math.sin(frame / 9 + 6.283 * hash(id, 2));
      out.push({ p: [p[0] + n[0] * off, p[1] + n[1] * off], g: clamp01(s / 6) });
    }
  return out;
};

// THE SHIP: a mid-18th-century East Indiaman, side-on, drawn bow to the right and mirrored (she heads west of north, bow to the left); a box whose
// origin is the bow at the waterline, the hull 300 long (x negative = aft, y negative = up)
const SHIP_LEN = 300; // screen px in the close frame
const sailD = (cx: number, yT: number, yB: number, hT: number, hB: number) =>
  `M${cx - hT},${yT}L${cx + hT},${yT}Q${cx + hB + 6},${(yT + yB) / 2} ${cx + hB},${yB}Q${cx},${yB - 10} ${cx - hB},${yB}Q${cx - hB - 3},${(yT + yB) / 2} ${cx - hT},${yT}Z`;
const SAILS: { d: string; cx: number; yT: number; yB: number; h: number }[] = [
  [-62, -104, -52, 31, 35],
  [-62, -152, -110, 22, 29],
  [-62, -186, -158, 14, 19],
  [-150, -112, -54, 35, 40],
  [-150, -166, -118, 24, 32],
  [-150, -206, -172, 15, 21],
  [-232, -152, -120, 15, 22],
].map(([cx, yT, yB, hT, hB]) => ({ d: sailD(cx, yT, yB, hT, hB), cx, yT, yB, h: hT }));
const SPANKER_D = "M-234,-64L-234,-114L-290,-132L-300,-74Z";
const JIB_D = "M52,-71L-58,-150L-56,-66Z";
const HULL_D = "M-2,-41C0,-18 -8,-1 -28,2L-270,2C-284,0 -292,-12 -294,-30L-301,-68L-250,-63L-244,-48L-192,-46L-186,-38L-72,-38L-66,-47L-10,-47Z";
const MASTS: [number, number, number][] = [
  [-62, -44, -200],
  [-150, -40, -222],
  [-232, -60, -172],
];
const Ship: React.FC<{ x: number; y: number; len: number; rot: number; wake: number }> = ({ x, y, len, rot, wake }) => {
  const s = len / 300;
  const cw = 5 / Math.pow(s, 0.6); // the dark casing, in ship units
  return (
    <g transform={`translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${(-s).toFixed(4)} ${s.toFixed(4)}) rotate(${rot.toFixed(2)} -150 0)`} strokeLinejoin="round" strokeLinecap="round">
      {/* the wake: short engraved strokes astern, only while she is under way */}
      {wake > 0.02 ? (
        <g fill="none" stroke={INK} strokeOpacity={0.7 * wake} strokeWidth={3.2 / Math.pow(s, 0.6)}>
          <path d="M-306,4q-22,-7 -44,1" />
          <path d="M-318,16q-26,-7 -52,2" />
          <path d="M-362,6q-18,-5 -36,1" />
        </g>
      ) : null}
      {/* dark casing under everything */}
      <g fill={DARK} fillOpacity={0.7} stroke={DARK} strokeOpacity={0.7} strokeWidth={cw}>
        <path d={HULL_D} />
        {SAILS.map((q, i) => (
          <path key={i} d={q.d} />
        ))}
        <path d={SPANKER_D} />
        <path d={JIB_D} />
      </g>
      <g fill="none" stroke={DARK} strokeOpacity={0.7} strokeWidth={cw + 4}>
        {MASTS.map(([mx, y0, y1], i) => (
          <line key={i} x1={mx} y1={y0} x2={mx} y2={y1} />
        ))}
        <line x1={-8} y1={-45} x2={60} y2={-75} />
      </g>
      {/* spars */}
      <g fill="none" stroke={ACCENT_DEEP} strokeWidth={5}>
        {MASTS.map(([mx, y0, y1], i) => (
          <line key={i} x1={mx} y1={y0} x2={mx} y2={y1} />
        ))}
        <line x1={-8} y1={-45} x2={60} y2={-75} />
      </g>
      {/* sails: orange, with their cloth seams */}
      <path d={JIB_D} fill={ACCENT} stroke={ACCENT_DEEP} strokeWidth={2.5} />
      <path d={SPANKER_D} fill={ACCENT} stroke={ACCENT_DEEP} strokeWidth={2.5} />
      {SAILS.map((q, i) => (
        <g key={i}>
          <path d={q.d} fill={ACCENT} stroke={ACCENT_DEEP} strokeWidth={2.5} />
          <path d={`M${q.cx - q.h * 0.4},${q.yT + 3}L${q.cx - q.h * 0.46},${q.yB - 8}M${q.cx + q.h * 0.4},${q.yT + 3}L${q.cx + q.h * 0.46},${q.yB - 8}`} fill="none" stroke={ACCENT_DEEP} strokeWidth={2.2} />
          <line x1={q.cx - q.h - 4} y1={q.yT} x2={q.cx + q.h + 4} y2={q.yT} stroke={DARK} strokeOpacity={0.85} strokeWidth={4} />
        </g>
      ))}
      <path d="M-150,-222l-26,5l26,5" fill={ACCENT} stroke={DARK} strokeOpacity={0.7} strokeWidth={2} />
      {/* the hull: deep orange, a cream wale, dark gun ports, the stern gallery */}
      <path d={HULL_D} fill={ACCENT_DEEP} />
      <path d="M-4,-36C-3,-28 -6,-22 -10,-18L-292,-22L-296,-40L-250,-40L-244,-34L-72,-30L-66,-36Z" fill={ACCENT} />
      <path d="M-10,-18L-292,-22" fill="none" stroke={INK} strokeWidth={3.4} />
      {[-34, -62, -90, -118, -146, -174, -202, -230].map((gx) => (
        <rect key={gx} x={gx - 4.5} y={-33} width={9} height={8} fill={DARK} fillOpacity={0.85} />
      ))}
      <rect x={-290} y={-58} width={9} height={10} fill={INK} />
      <rect x={-275} y={-57} width={9} height={10} fill={INK} />
      <rect x={-260} y={-56} width={9} height={10} fill={INK} />
      <path d="M-40,-8l-12,8M-90,-8l-12,8M-140,-8l-12,8M-190,-8l-12,8M-240,-8l-12,8" fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={2.4} />
      <path d={HULL_D} fill="none" stroke={DARK} strokeOpacity={0.55} strokeWidth={1.6} />
    </g>
  );
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
  const force = frame > T.march ? columnAt(frame) : [];
  const dotR = (DOT_D / 2) * Math.pow(k / 4.4, 0.6);
  // the ship: creeping north from the first frame, then up the bay; she eases to her anchorage
  const shipU = 0.06 * clamp01((frame + 20) / (T.ship[0] + 20)) + 0.94 * smoothstep((frame - T.ship[0]) / (T.ship[1] - T.ship[0]));
  const shipV = smoothstep((frame - T.ship[0]) / 10) * (1 - smoothstep((frame - (T.ship[1] - 14)) / 14));
  const [shx, shy] = screenOf([SHIP_FROM[0] + (SHIP_STOP[0] - SHIP_FROM[0]) * shipU, SHIP_FROM[1] + (SHIP_STOP[1] - SHIP_FROM[1]) * shipU], cam);
  const shipLen = SHIP_LEN * Math.pow(k / 4.4, 0.6);
  const shipRot = -2.5 * shipV + 1.1 * Math.sin(frame / 10);
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
              <circle cx={MURSHIDABAD[0]} cy={MURSHIDABAD[1]} r={88} fill={ACCENT_DEEP} fillOpacity={0.2} />
              <circle cx={MURSHIDABAD[0]} cy={MURSHIDABAD[1]} r={88} fill="url(#bkHatch)" opacity={0.6} />
            </g>
          </g>
        ) : null}
      </WorldSvg>

      {/* screen-sized symbols: the label, the seats, the column, the ship, the crowns */}
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

        {/* THE COLUMN: ranks of four, off the ship */}
        {force.map((d, i) => {
          const [x, y] = screenOf(d.p, cam);
          return <circle key={`fd${i}`} cx={x} cy={y} r={dotR * (0.35 + 0.65 * d.g) + 2.2} fill={DARK} fillOpacity={0.7 * d.g} />;
        })}
        {force.map((d, i) => {
          const [x, y] = screenOf(d.p, cam);
          return <circle key={`fo${i}`} cx={x} cy={y} r={dotR * (0.35 + 0.65 * d.g)} fill={ACCENT} fillOpacity={d.g} />;
        })}

        {/* THE SHIP: orange from the first frame she is in view */}
        {shx > -100 && shx < FRAME_W + 100 && shy > -100 && shy < FRAME_H + 400 ? <Ship x={shx} y={shy} len={shipLen} rot={shipRot} wake={shipV} /> : null}

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
