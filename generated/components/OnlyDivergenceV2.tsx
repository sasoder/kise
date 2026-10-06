import React from "react";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  AZTEC_REALM,
  AztecRealm,
  CHAIN_LEN,
  CHAIN_S,
  ChainNode,
  DARK,
  FRAME_H,
  FRAME_W,
  INCA_REALM,
  INK,
  INK_FULL,
  IncaRealm,
  MapPage,
  NODE_LEAD,
  PlaybookChain,
  SITES,
  WorldSvg,
  camFor,
  chainWidth,
  clamp01,
  makeCamera,
  makeRoute,
  pchip,
  screenOf,
  smootherstep,
  smoothstep,
  swayCam,
  worldOf,
  type Cam,
  type CamKey,
  type P2,
} from "./vikAmericasShared";

// ---------------------------------------------------------------------------
// OnlyDivergenceV2 — cut C (second take) of the clip "Sheppard_Vikings"
// (Dwarkesh Patel with Si Sheppard), Dwarkesh map style, on the shared Americas
// world (vikAmericasShared.tsx, read-only here; cut A = LearningFromEachOther,
// cut B = IncasEvenKnewTheAztecs). It replaces the rejected timeline take.
//
// THE LINE (sequence 25.692 s -> 31.490 s): "(To go further back in time, I
// think the) only divergence that would have given pre-Columbian peoples a real
// long-term chance to hold off the Europeans." Then, on camera: "If we reverse
// the clock another 500 years back to Leif Erikson and the Norse in Greenland".
// DURATION = 139 interval frames (sequence f616 -> f755) + 2 tail frames = 141,
// 24 fps, 1080 x 1920, opaque.
//
// THE IDEA. The clock runs backwards and the conquest un-happens: on the map of
// cuts A and B a big year readout counts DOWN from 1532 while the orange chain
// retracts in the order history laid it, until the Americas stand untouched
// ("pre-Columbian"), and the clock keeps rewinding as we hand back.
// ACCENT: orange = what is passed on (the chain of conquest know-how; then the
// run-up that would have had to be passed on: the bar). Realms, coast, readout
// and the bar's rules are cream. One readout; nothing else is written.
//
// GESTURES (local frames; nothing else moves)
//   f0        opening state: cut A/B's wide (both realms in cream, the two
//             orange bows, three nodes alight), plus Columbus's track, one
//             orange line from the right frame edge to the Santo Domingo node;
//             the readout "1532" in the open Pacific; the digits, the chain's
//             end and the camera already moving.
//   f0-141    THE CAMERA: B's end framing (raised 55 px so the readout clears
//             the Peru bow), one continuous creep k 1.22 -> 1.293 (6 %) + the
//             house sway. No other move.                       [the whole line]
//   f0-56     orange beads ride the chain BACKWARDS (Peru -> Mexico ->
//             Hispaniola), only on the line that still exists.
//   f0-24     the readout rolls 1532 -> 1521 (odometer: each wheel slides down
//             one digit, only the wheels that change move) while the Peru bow
//             retracts from Cajamarca along its own curve to Tenochtitlan; the
//             Cajamarca node goes out as the line's end leaves it
//                                                  ["only divergence" f-1-19]
//   f24-56    the readout rolls 1521 -> 1493 while the Gulf bow retracts from
//             Tenochtitlan to Santo Domingo; the Tenochtitlan node goes out as
//             the end leaves it                  ["that would have given" f19-50]
//   f44-56    the scale bar (cream double rule, a tick per century) slides up
//             24 px and fades in under the readout, empty
//   f56-72    the readout passes 1492 on f57; the Santo Domingo node goes out
//             and Columbus's track retracts to the right frame edge, where its
//             end stops (f72) under a node mark: the Europeans, held off the
//             page                        ["pre" f50, "Columbian" f60, "peoples" f68]
//   f56-74    the two realms come up from the lower cream rung to full ink
//             with a slightly stronger wash as the last orange leaves them
//   f57-139   the readout keeps rolling back, faster (about 7.5 years a frame
//             f76-124), slowing over the last 15 frames to land on exactly
//             1000 on f139 (held for the 2 tail frames); the bar fills in
//             ORANGE from its right end (1492) leftwards in step with the
//             years: empty at 1492, full at 1000
//                   ["a real long-term chance" f76-112, "long-term" f92-105,
//                    "to hold off the Europeans" f112-134: nothing new]
//
// SOURCES. Cajamarca, 16 Nov 1532 (capture of Atahualpa); fall of Tenochtitlan,
// 13 Aug 1521; Columbus's first landfall 12 Oct 1492, reaching Hispaniola in
// Dec 1492. Santo Domingo 18.47 N 69.90 W; Tenochtitlan 19.43 N 99.13 W;
// Cajamarca 7.16 S 78.51 W. Aztec Empire c. 1519 after the Commons "Aztec
// Empire 1519 map-fr.svg"; Tawantinsuyu c. 1532 after the Commons "Inca
// Expansion.svg"; Natural Earth 10m coastlines. Leif Erikson's voyage c. 1000
// (CLIP_SPEC), which is where the clock is heading.
// ---------------------------------------------------------------------------
export const FPS = 24;
export const DURATION = 141;

export const schema = z.object({
  vignette: z.number(),
  /** false = IM Fell English (the house face; old-style figures). true = lining figures */
  lining: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  vignette: 0.55,
  lining: true,
});

const { fontFamily: fell } = loadFell("normal", {
  weights: ["400"],
  subsets: ["latin"],
});
const { fontFamily: caslon } = loadCaslon("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

const span = (f: number, a: number, b: number) => clamp01((f - a) / (b - a));
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

// -- the camera: cut B's end framing, raised 80 px so the readout clears the Peru
// bow; one creep whose still point is the readout, so the page grows round it ---
const K0 = 1.22;
const K1 = 1.293; // 6 %, under the 1.30 band
const CAM0: Cam = camFor([525.5, 813.6], K0, 540, 690);
const STILL: P2 = [40, 1000]; // screen
const STILL_W = worldOf(STILL, CAM0);
export const CAM_KEYS: CamKey[] = [
  { f: 0, k: K0, wx: STILL_W[0], wy: STILL_W[1], sx: STILL[0], sy: STILL[1] },
  {
    f: DURATION,
    k: K1,
    wx: STILL_W[0],
    wy: STILL_W[1],
    sx: STILL[0],
    sy: STILL[1],
  },
];
export const camAt = makeCamera(CAM_KEYS);
/** cut B ends on its clock 221 (sway and beads) */
const CLOCK0 = 222;

// -- the clock -----------------------------------------------------------------
export const YEAR_TOP = 1532;
export const YEAR_COLUMBUS = 1492;
export const YEAR_END = 1000;
const YEAR = pchip([
  [0, YEAR_TOP],
  [24, 1521],
  [57, YEAR_COLUMBUS],
  [66, 1480],
  [76, 1420],
  [124, 1052],
  [139, YEAR_END],
  [141, YEAR_END],
]);
export const yearAt = (f: number) => YEAR(Math.max(0, Math.min(DURATION, f)));

// -- the chain's end (arclength), retracting: Cajamarca f0 -> Tenochtitlan f24 -> Santo Domingo f56
const HEAD = pchip([
  [0, CHAIN_LEN],
  [24, CHAIN_S.tenochtitlan],
  [56, 0],
  [58, 0],
]);
export const headAt = (f: number) =>
  clamp01(HEAD(Math.max(0, Math.min(58, f))) / CHAIN_LEN);

// -- Columbus's track: one smooth line from Santo Domingo out to the east-north-east
// (toward Spain), far past the frame edge. s = 0 at Santo Domingo.
const SD: P2 = [SITES.santoDomingo.x, SITES.santoDomingo.y];
export const COLUMBUS = (() => {
  const p0 = SD;
  const p1: P2 = [SD[0] + 110, SD[1] - 28];
  const p2: P2 = [SD[0] + 230, SD[1] - 96];
  const pts: P2[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = i / 48;
    const a = (1 - t) * (1 - t);
    const b = 2 * t * (1 - t);
    const c = t * t;
    pts.push([
      a * p0[0] + b * p1[0] + c * p2[0],
      a * p0[1] + b * p1[1] + c * p2[1],
    ]);
  }
  let len = 0;
  for (let i = 1; i < pts.length; i++)
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return makeRoute({ pts, wpS: [0, len], len });
})();
/** where the retracting end stops: at the right frame edge of the last frame (screen x ~1040) */
export const WAIT_S = (() => {
  const cam = camAt(DURATION - 1);
  let s = 0;
  while (s < COLUMBUS.len && screenOf(COLUMBUS.pointAt(s), cam)[0] < 1040)
    s += 0.25;
  return s;
})();
const RETRACT = pchip(
  [
    [56, 0],
    [72, WAIT_S],
  ],
  true,
);
export const retractAt = (f: number) => RETRACT(Math.max(56, Math.min(72, f)));

// -- the readout and its bar (anchored to the page: laid out in screen px of f0,
// carried by the camera so they creep and sway with the map) ---------------------
// IM Fell English has old-style figures only (no lnum feature): 1 2 0 sit on the
// x-height (124 px here), 3 4 5 7 9 hang below the baseline, 6 8 rise above it,
// and its 1 is drawn like a small-cap I. `lining` swaps the wheels to Libre
// Caslon Text's lining figures (the director's choice and the default: Fell's 1 read as a letter).
type Face = {
  family: string;
  size: number;
  w: number;
  x: number;
  base: number;
  barDrop: number;
  haloTop: number;
  haloH: number;
};
const FACE_FELL: Face = {
  family: fell,
  size: 310,
  w: 122,
  x: 40,
  base: 1000,
  barDrop: 80,
  haloTop: 155,
  haloH: 205,
};
const FACE_LINING: Face = {
  family: caslon,
  size: 236,
  w: 122,
  x: 12,
  base: 1060,
  barDrop: 34,
  haloTop: 185,
  haloH: 205,
};
const WHEEL_PITCH = 160; // one digit of travel
export const BAR_GAP = 24;

/** a wheel's position (in digits) for the place value 10^n. Each step is an eased slide.
 *  A higher wheel turns one step while the wheel below makes its last step (w = 0.1 of
 *  its own cycle); when the years run faster than the wheel below can show (over one
 *  digit a frame) the carry spreads out so the wheel rolls instead of snapping. */
const step = (t: number) => smoothstep((t - 0.3) / 0.7);
const wheelPos = (f: number, n: number) => {
  const v = yearAt(f);
  const rate = Math.abs(yearAt(f + 0.5) - yearAt(f - 0.5));
  const u = v / Math.pow(10, n);
  const fl = Math.floor(u);
  if (n === 0) {
    const t = u - fl;
    const lin = smoothstep((rate - 0.8) / 1.2); // fast: the wheel simply spins
    return fl + step(t) * (1 - lin) + t * lin;
  }
  const below = rate / Math.pow(10, n - 1); // the wheel below, digits per frame
  const w = Math.min(1, 0.1 * Math.max(1, below));
  return fl + step(clamp01((u - fl - (1 - w)) / w));
};

/** the year, as four wheels. A digit is full ink on its seat and gone ~0.8 of a pitch
 *  away; a turning wheel is smeared along its travel in proportion to its speed (one
 *  vertical blur per wheel, never a stack of ghosts), so the fast wheels read as a
 *  soft spinning column and the slow ones stay sharp. */
const Readout: React.FC<{ frame: number; face: Face }> = ({ frame, face }) => {
  const wheels = [3, 2, 1, 0];
  const w = face.w * 4;
  // the wheels' window: from above the tallest figure to just short of the bar
  const top = face.base - 270;
  const bot = face.base + face.barDrop - 5;
  return (
    <g>
      <defs>
        <filter id="odv2-halo" x="-30%" y="-40%" width="160%" height="180%">
          <feGaussianBlur stdDeviation={30} />
        </filter>
        <linearGradient
          id="odv2-fade"
          x1="0"
          y1={top}
          x2="0"
          y2={bot}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset={0} stopColor="#fff" stopOpacity={0} />
          <stop offset={40 / (bot - top)} stopColor="#fff" stopOpacity={1} />
          <stop
            offset={1 - 12 / (bot - top)}
            stopColor="#fff"
            stopOpacity={1}
          />
          <stop offset={1} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask
          id="odv2-window"
          maskUnits="userSpaceOnUse"
          x={face.x - 40}
          y={top}
          width={w + 80}
          height={bot - top}
        >
          <rect
            x={face.x - 40}
            y={top}
            width={w + 80}
            height={bot - top}
            fill="url(#odv2-fade)"
          />
        </mask>
      </defs>
      <rect
        x={face.x}
        y={face.base - face.haloTop}
        width={w}
        height={face.haloH}
        rx={50}
        fill={DARK}
        fillOpacity={0.5}
        filter="url(#odv2-halo)"
      />
      <g mask="url(#odv2-window)">
        {wheels.map((n, col) => {
          const pos = wheelPos(frame, n);
          const speed = Math.abs(
            wheelPos(frame + 0.5, n) - wheelPos(frame - 0.5, n),
          ); // digits per frame
          const fast = clamp01(speed / 3);
          const blur = Math.min(
            52,
            Math.max(0, speed * WHEEL_PITCH * 0.11 - 7),
          );
          const reach = 0.58 + 0.5 * fast; // pitches over which a digit's ink runs out
          const j0 = Math.floor(pos);
          const x = face.x + face.w * (col + 0.5);
          const fid = `odv2-smear-${col}`;
          return (
            <g key={col} filter={blur > 0.6 ? `url(#${fid})` : undefined}>
              {blur > 0.6 ? (
                <defs>
                  <filter
                    id={fid}
                    filterUnits="userSpaceOnUse"
                    x={x - face.w}
                    y={face.base - 620}
                    width={face.w * 2}
                    height={1100}
                  >
                    <feGaussianBlur stdDeviation={`0 ${blur.toFixed(2)}`} />
                  </filter>
                </defs>
              ) : null}
              {[j0 - 2, j0 - 1, j0, j0 + 1, j0 + 2, j0 + 3].map((j) => {
                const dy = (j - pos) * WHEEL_PITCH;
                const ink =
                  (1 - smoothstep((Math.abs(dy) / WHEEL_PITCH - 0.2) / reach)) *
                  (1 - 0.35 * fast);
                if (ink <= 0.004) return null;
                return (
                  <text
                    key={j}
                    x={x}
                    y={face.base + dy}
                    textAnchor="middle"
                    opacity={ink}
                    fill={INK}
                    fillOpacity={INK_FULL}
                    stroke={DARK}
                    strokeOpacity={0.8}
                    strokeWidth={face.size * 0.05}
                    strokeLinejoin="round"
                    paintOrder="stroke"
                    style={{ fontFamily: face.family, fontSize: face.size }}
                  >
                    {(((j % 10) + 10) % 10).toString()}
                  </text>
                );
              })}
            </g>
          );
        })}
      </g>
    </g>
  );
};

const CENTURIES = [1400, 1300, 1200, 1100];
const Bar: React.FC<{ frame: number; face: Face }> = ({ frame, face }) => {
  const enter = span(frame, 44, 56);
  if (enter <= 0.002) return null;
  const year = yearAt(frame);
  const fill = clamp01((YEAR_COLUMBUS - year) / (YEAR_COLUMBUS - YEAR_END));
  const BAR_LEN = face.w * 4 - 8;
  const xL = face.x + 4;
  const xR = xL + BAR_LEN;
  const xOf = (y: number) =>
    xR - ((YEAR_COLUMBUS - y) / (YEAR_COLUMBUS - YEAR_END)) * BAR_LEN;
  const y0 = face.base + face.barDrop;
  const y1 = y0 + BAR_GAP;
  return (
    <g
      opacity={Math.min(1, enter / 0.75)}
      transform={`translate(0 ${(24 * (1 - easeOut(enter))).toFixed(2)})`}
    >
      <g
        stroke={DARK}
        strokeOpacity={0.6}
        strokeWidth={6.5}
        strokeLinecap="butt"
        fill="none"
      >
        <line x1={xL - 1.5} y1={y0} x2={xR + 1.5} y2={y0} />
        <line x1={xL - 1.5} y1={y1} x2={xR + 1.5} y2={y1} />
      </g>
      {fill > 0.0005 ? (
        <rect
          x={xR - fill * BAR_LEN}
          y={y0}
          width={fill * BAR_LEN}
          height={BAR_GAP}
          fill={ACCENT}
        />
      ) : null}
      <g
        stroke={INK}
        strokeOpacity={INK_FULL}
        strokeWidth={3}
        strokeLinecap="butt"
        fill="none"
      >
        <line x1={xL - 1.5} y1={y0} x2={xR + 1.5} y2={y0} />
        <line x1={xL - 1.5} y1={y1} x2={xR + 1.5} y2={y1} />
        <line x1={xL} y1={y0} x2={xL} y2={y1 + 11} />
        <line x1={xR} y1={y0} x2={xR} y2={y1 + 11} />
        {CENTURIES.map((c) => (
          <line key={c} x1={xOf(c)} y1={y0} x2={xOf(c)} y2={y1 + 9} />
        ))}
      </g>
    </g>
  );
};

/** the realms' lower rung at f0 (group opacity) and the extra wash they gain */
const REALM_RUNG = 0.78;
const REALM_WASH_GAIN = 0.13;

const OnlyDivergenceV2: React.FC<Props> = ({ vignette, lining }) => {
  const face = lining ? FACE_LINING : FACE_FELL;
  const frame = useCurrentFrame();
  const base = camAt(frame);
  const cam: Cam = swayCam(base, frame + CLOCK0);
  const cam0: Cam = CAM0;
  const px = (v: number) => v / cam.k;

  const p = headAt(frame);
  const retract = retractAt(frame);
  const sdLit = 1 - smoothstep(retract / NODE_LEAD);
  const waitLit = smoothstep((retract - (WAIT_S - NODE_LEAD)) / NODE_LEAD);
  const up = smootherstep(span(frame, 56, 74));
  const realmOp = REALM_RUNG + (1 - REALM_RUNG) * up;
  const w = chainWidth(cam.k);
  const trackD = COLUMBUS.partialD(retract, COLUMBUS.len);
  const [wx, wy] = COLUMBUS.pointAt(WAIT_S);

  // the page-anchored layer: screen px of f0, carried by the camera
  const [ox, oy] = screenOf([cam0.cx, cam0.cy], cam);
  const s = cam.k / cam0.k;
  const pageT = `translate(${ox.toFixed(3)} ${oy.toFixed(3)}) scale(${s.toFixed(6)}) translate(${-FRAME_W / 2} ${-FRAME_H / 2})`;

  return (
    <MapPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <AztecRealm cam={cam} opacity={realmOp} />
        <IncaRealm cam={cam} opacity={realmOp} />
        {up > 0.002 ? (
          <g fill={INK} fillOpacity={REALM_WASH_GAIN * up}>
            <path d={AZTEC_REALM.d} fillRule="evenodd" />
            <path d={INCA_REALM.d} fillRule="evenodd" />
          </g>
        ) : null}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d={trackD}
            stroke={DARK}
            strokeOpacity={0.62}
            strokeWidth={px(w + 3.6)}
          />
          <path d={trackD} stroke={ACCENT} strokeWidth={px(w)} />
        </g>
        {frame < 56 ? (
          <PlaybookChain cam={cam} progress={p} frame={CLOCK0 - frame} />
        ) : (
          <ChainNode x={SD[0]} y={SD[1]} cam={cam} lit={sdLit} />
        )}
        <ChainNode x={wx} y={wy} cam={cam} lit={waitLit} />
      </WorldSvg>
      <svg
        width={FRAME_W}
        height={FRAME_H}
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        <g transform={pageT}>
          <Readout frame={frame} face={face} />
          <Bar frame={frame} face={face} />
        </g>
      </svg>
    </MapPage>
  );
};

export default OnlyDivergenceV2;
