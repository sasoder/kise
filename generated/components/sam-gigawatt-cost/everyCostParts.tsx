// ---------------------------------------------------------------------------
// everyCostParts — cut 4's own pieces (EveryCostGoesDown, sam-gigawatt-cost): the three real things in the row,
// each a lit cream object in the Scott "air" medium standing on the apron just behind its cut edge, and the cost
// column beside each one (glass out of a slot in the apron, an amber fill that drains down into the slot).
//   * Pylon        a double-circuit lattice transmission tower on four footings, six insulator strings
//   * PowerLines   its conductors and earth wire (screen space, projected through the AirCam): one span along the
//                  row to the next tower off frame left, one span back-left to a far tower in the haze
//   * Chip         an AI accelerator package (die + four HBM stacks on a substrate, pins on its edges) standing in
//                  a cream socket block, its bottom pins plugged into the block
//   * ContainerStack  a stack of 20 ft shipping containers (corrugated sides, rails, corner castings)
//   * CostColumn   scott-radar-map/npsColumnsParts UpColumn's recipe (COPIED, adapted): the glass stays its full
//                  height, the fill is its own value, and the rungs are on the glass (dark in the amber, a faint
//                  hairline on the emptied glass above it)
// All geometry in world px of the chart plane (everyCostPlan.ts); `k` = the camera zoom (hairlines stay screen px).
// Local object coordinates: origin at the object's foot centre, x right, y DOWN (so heights are negative y).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { ALPHA, COLOR, EDGE, STROKE, bloomFilter, mixHex, rectPath } from "../kits/cheeky-pint/stoutShared";
import { AIR_COLOR, airProject, fogAmount, type AirCam } from "../scott-aircraft-order/aircraftShared";
import { BOX_H, BOX_W, FOOT, GROUND, S0, SUN_SHADOW, ZC, toWorld } from "./everyCostPlan";

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `ecg${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

/** The objects' tones: cream card under the key light, its turned-away side, the recesses, the cables; each mixed
 *  toward the haze by the object's fog. */
export const objTones = (fog: number) => {
  const a = (c: string) => mixHex(c, AIR_COLOR.haze, fog);
  return {
    lit: a(COLOR.cream),
    mid: a(COLOR.creamFoot),
    warm: a(mixHex(COLOR.creamFoot, COLOR.board, 0.32)),
    shade: a(mixHex(COLOR.creamFoot, COLOR.board, 0.62)),
    deep: a(mixHex(COLOR.board, COLOR.inkDark, 0.34)),
    sub: a(mixHex(COLOR.board, COLOR.creamFoot, 0.28)),
    subLo: a(mixHex(COLOR.board, COLOR.inkDark, 0.12)),
    line: a(mixHex(COLOR.board, COLOR.inkDark, 0.5)),
    concrete: a(mixHex(AIR_COLOR.concrete, COLOR.cream, 0.35)),
    concreteLo: a(AIR_COLOR.concreteLo),
    rim: COLOR.edge,
  };
};
type Tones = ReturnType<typeof objTones>;

/** One soft contact shadow where a foot meets the apron (the occlusion under the long cast shadow). World px. */
export const ContactShadow: React.FC<{ x: number; foot: number; w: number; a?: number }> = ({ x, foot, w, a = 0.42 }) => (
  <ellipse cx={f3(x + 8)} cy={f3(foot + 2)} rx={f3(w * 0.55)} ry={f3(5)} fill={COLOR.shadow} opacity={a} style={{ filter: "blur(4px)" }} />
);

// ===========================================================================
// THE PYLON
// ===========================================================================
/** leg outline (half-widths at heights), arms (height of the top chord, the bottom chord at the body, the tip) */
/** the tower's height scale over the base drawing (560 px to the peak at 1) */
const HS = 1.15;
const LEG: [number, number][] = [
  [78, 0],
  [30, 330 * HS],
  [20, 520 * HS],
];
const PEAK = 560 * HS;
const ARMS = [
  { top: 362 * HS, bot: 340 * HS, tip: 124 },
  { top: 440 * HS, bot: 418 * HS, tip: 140 },
  { top: 506 * HS, bot: 488 * HS, tip: 108 },
] as const;
const INSUL = 44;
const FOOTING = { w: 30, h: 14 } as const;
/** the leg's half-width at height h */
const legHalf = (h: number) => {
  if (h <= LEG[1][1]) return LEG[0][0] + ((LEG[1][0] - LEG[0][0]) * h) / LEG[1][1];
  if (h <= LEG[2][1]) return LEG[1][0] + ((LEG[2][0] - LEG[1][0]) * (h - LEG[1][1])) / (LEG[2][1] - LEG[1][1]);
  return LEG[2][0] * (1 - (h - LEG[2][1]) / (PEAK - LEG[2][1]));
};
const PANELS = [FOOTING.h, ...[96, 178, 252, 330, 362, 418, 440, 488, 520].map((h) => h * HS)];
/** where the conductors hang (local px: x, height above the foot): the insulator strings' lower ends, left side
 *  first (bottom, middle, top arm), then the right side, then the earth wire on the peak */
export const PYLON_ATTACH: [number, number][] = [
  ...ARMS.map((a) => [-a.tip + 4, a.top - INSUL] as [number, number]),
  ...ARMS.map((a) => [a.tip - 4, a.top - INSUL] as [number, number]),
  [0, PEAK],
];

/** Pylon in local px (foot centre at 0,0; y down). Each member is a cream bar over a darker underlay so the
 *  lattice holds its edge against the bright haze as well as the dusk. */
export const Pylon: React.FC<{ T: Tones; px: number }> = ({ T, px }) => {
  // px = screen px per local px (for the hairline minimums)
  const legW = 9;
  const memW = 4.6;
  const under = Math.max(2.2, 1.6 / px);
  const P = (x: number, h: number) => `${f3(x)} ${f3(-h)}`;
  const legs: string[] = [-1, 1].map((s) => `M${P(s * LEG[0][0], FOOTING.h)}L${P(s * legHalf(LEG[1][1]), LEG[1][1])}L${P(s * LEG[2][0], LEG[2][1])}L${P(0, PEAK)}`);
  const braces: { d: string; lit: boolean }[] = [];
  for (let i = 0; i < PANELS.length - 1; i++) {
    const h0 = PANELS[i];
    const h1 = PANELS[i + 1];
    const w0 = legHalf(h0);
    const w1 = legHalf(h1);
    braces.push({ d: `M${P(-w0, h0)}L${P(w1, h1)}`, lit: true });
    braces.push({ d: `M${P(w0, h0)}L${P(-w1, h1)}`, lit: false });
    if (i > 0) braces.push({ d: `M${P(-w0, h0)}L${P(w0, h0)}`, lit: true });
  }
  const arms: { d: string; lit: boolean; w: number }[] = [];
  for (const a of ARMS) {
    for (const s of [-1, 1]) {
      const wt = legHalf(a.top);
      const wb = legHalf(a.bot);
      arms.push({ d: `M${P(s * wt, a.top)}L${P(s * a.tip, a.top)}`, lit: true, w: 6 });
      arms.push({ d: `M${P(s * wb, a.bot)}L${P(s * a.tip, a.top - 3)}`, lit: false, w: 4.2 });
      const mx = (wt + a.tip) / 2;
      arms.push({ d: `M${P(s * mx, a.top)}L${P(s * (wb + (a.tip - wb) * 0.42), a.bot + (a.top - 3 - a.bot) * 0.42)}`, lit: false, w: 3.4 });
    }
  }
  // earth-wire peak: a short cross on top
  const peak = `M${P(-26, PEAK - 6)}L${P(26, PEAK - 6)}`;
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* footings */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={f3(s * LEG[0][0] - FOOTING.w / 2)} y={f3(-FOOTING.h)} width={FOOTING.w} height={FOOTING.h} fill={T.concrete} />
          <rect x={f3(s * LEG[0][0] - FOOTING.w / 2)} y={f3(-FOOTING.h)} width={FOOTING.w} height={f3(1.6)} fill={T.rim} opacity={0.6} />
          <rect x={f3(s * LEG[0][0] + FOOTING.w / 2 - 7)} y={f3(-FOOTING.h)} width={7} height={FOOTING.h} fill={T.concreteLo} opacity={0.7} />
        </g>
      ))}
      {/* underlay: every member in the deep tone, a touch wider */}
      <g stroke={T.deep} opacity={0.85}>
        {braces.map((b, i) => (
          <path key={`bu${i}`} d={b.d} strokeWidth={f3(memW + under)} />
        ))}
        {arms.map((b, i) => (
          <path key={`au${i}`} d={b.d} strokeWidth={f3(b.w + under)} />
        ))}
        {legs.map((d, i) => (
          <path key={`lu${i}`} d={d} strokeWidth={f3(legW + under)} />
        ))}
        <path d={peak} strokeWidth={f3(5 + under)} />
      </g>
      {/* the members: lit faces cream, the turned-away ones a shade down */}
      {braces.map((b, i) => (
        <path key={`b${i}`} d={b.d} stroke={b.lit ? T.mid : T.warm} strokeWidth={f3(memW)} />
      ))}
      {arms.map((b, i) => (
        <path key={`a${i}`} d={b.d} stroke={b.lit ? T.lit : T.mid} strokeWidth={f3(b.w)} />
      ))}
      <path d={legs[0]} stroke={T.lit} strokeWidth={legW} />
      <path d={legs[1]} stroke={T.warm} strokeWidth={legW} />
      <path d={peak} stroke={T.lit} strokeWidth={5} />
      {/* insulator strings: a stack of discs under each arm tip */}
      {ARMS.flatMap((a) =>
        [-1, 1].map((s) => {
          const x = s * (a.tip - 4);
          const discs = Array.from({ length: 6 }, (_, j) => -(a.top - 6 - j * ((INSUL - 10) / 5)));
          return (
            <g key={`${a.top}${s}`}>
              <path d={`M${P(x, a.top)}L${P(x, a.top - INSUL)}`} stroke={T.deep} strokeWidth={2.4} />
              {discs.map((y, j) => (
                <ellipse key={j} cx={f3(x)} cy={f3(y)} rx={7.5} ry={3.2} fill={j % 2 ? T.mid : T.lit} stroke={T.deep} strokeWidth={f3(Math.max(1.1, 1 / px))} />
              ))}
            </g>
          );
        }),
      )}
    </g>
  );
};

/** A placed pylon in 3D (metres): its local px scale onto the world at S0 px per metre. */
export type PylonAt = { X: number; Z: number };
/** the conductors' local attach points of a pylon placed at (X, Z), as world metres */
const attachOf = (p: PylonAt): [number, number, number][] => PYLON_ATTACH.map(([x, h]) => [p.X + x / S0, h / S0, p.Z]);

/**
 * PowerLines — SCREEN px (an SVG in screen space under the chart plane): the far towers (only drawn when on
 * screen), and the conductors from the front tower (`front`, local px on the chart plane) to each far tower,
 * each a sagging catenary sampled in 3D and projected through the AirCam, fogged by distance. `S` = the clock
 * (a slow sway of the sag).
 */
export const PowerLines: React.FC<{ cam: AirCam; frontX: number; frontFoot: number; towers: { at: PylonAt; sag: number }[]; S: number }> = ({ cam, frontX, frontFoot, towers, S }) => {
  const front: [number, number, number][] = PYLON_ATTACH.map(([x, h]) => toWorld(frontX + x, frontFoot - h));
  const N = 22;
  return (
    <g fill="none" strokeLinecap="round">
      {towers.map((t, ti) => {
        const far = attachOf(t.at);
        const footP = airProject(cam, [t.at.X, 0, t.at.Z]);
        const fogT = fogAmount(footP.d);
        const visible = footP.x > -200 && footP.x < 1280;
        return (
          <g key={ti}>
            {visible ? (
              <g transform={`translate(${f3(footP.x)} ${f3(footP.y)}) scale(${f3(footP.s / S0)})`}>
                <Pylon T={objTones(fogT)} px={footP.s / S0} />
              </g>
            ) : null}
            {front.map((A, i) => {
              const B = far[i];
              const sway = 1 + 0.035 * Math.sin(S * 0.09 + i * 0.7 + ti);
              const pts = Array.from({ length: N + 1 }, (_, j) => {
                const u = j / N;
                const p: [number, number, number] = [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u - t.sag * sway * 4 * u * (1 - u), A[2] + (B[2] - A[2]) * u];
                return airProject(cam, p);
              });
              const mid = pts[N >> 1];
              const tone = mixHex(mixHex(COLOR.board, COLOR.inkDark, 0.5), AIR_COLOR.haze, fogAmount(mid.d) * 0.9);
              const w = Math.max(1.4, (i === PYLON_ATTACH.length - 1 ? 0.2 : 0.3) * pts[0].s);
              return (
                <path
                  key={i}
                  d={pts.map((p, j) => `${j ? "L" : "M"}${f3(p.x)} ${f3(p.y)}`).join("")}
                  stroke={tone}
                  strokeWidth={f3(w)}
                  opacity={0.9}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
};

// ===========================================================================
// THE CHIP
// ===========================================================================
export const CHIP_GEO = { baseW: 340, baseH: 36, sub: 300, subBottom: 44, pin: 15, pinW: 12, pins: 8, die: 124, hbm: [38, 56] as const } as const;

/** Chip in local px: a cream socket block on the apron, the package standing in it face to the camera, its
 *  bottom pins going down into the block's slot. */
export const Chip: React.FC<{ T: Tones; k: number }> = ({ T, k }) => {
  const uid = uidOf(useId());
  const G = CHIP_GEO;
  const s = G.sub;
  const x0 = -s / 2;
  const y0 = -(G.subBottom + s);
  const hair = Math.max(1.4, 1.2 / k);
  const pinPitch = s / (G.pins + 1);
  const pins: React.ReactNode[] = [];
  for (let i = 1; i <= G.pins; i++) {
    const c = x0 + i * pinPitch;
    // top edge
    pins.push(<path key={`t${i}`} d={rectPath(c - G.pinW / 2, y0 - G.pin, G.pinW, G.pin + 2, 2, true, false)} fill={T.mid} stroke={T.deep} strokeWidth={hair} />);
    // bottom edge: into the socket
    pins.push(<path key={`b${i}`} d={rectPath(c - G.pinW / 2, -G.subBottom - 2, G.pinW, G.subBottom - G.baseH + 4, 0, false, false)} fill={T.warm} stroke={T.deep} strokeWidth={hair} />);
    const cy = y0 + i * pinPitch;
    // the sides
    pins.push(<path key={`l${i}`} d={rectPath(x0 - G.pin, cy - G.pinW / 2, G.pin + 2, G.pinW, 2, false, false)} fill={T.lit} stroke={T.deep} strokeWidth={hair} />);
    pins.push(<path key={`r${i}`} d={rectPath(x0 + s - 2, cy - G.pinW / 2, G.pin + 2, G.pinW, 2, false, false)} fill={T.warm} stroke={T.deep} strokeWidth={hair} />);
  }
  const die = G.die;
  const dx = -die / 2;
  const dy = y0 + (s - die) / 2;
  const [hw, hh] = G.hbm;
  const hbm = [-1, 1].flatMap((side) =>
    [-1, 1].map((v) => ({ x: side < 0 ? dx - 14 - hw : dx + die + 14, y: dy + die / 2 + (v < 0 ? -hh - 5 : 5) })),
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={mixHex(T.sub, T.mid, 0.25)} />
          <stop offset="1" stopColor={T.subLo} />
        </linearGradient>
        <linearGradient id={`${uid}d`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={T.lit} />
          <stop offset="1" stopColor={T.mid} />
        </linearGradient>
        <linearGradient id={`${uid}b`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={T.lit} />
          <stop offset="1" stopColor={T.mid} />
        </linearGradient>
      </defs>
      {pins}
      {/* the substrate */}
      <path d={rectPath(x0, y0, s, s, 8)} fill={`url(#${uid}s)`} stroke={T.deep} strokeWidth={hair * 1.4} />
      <rect x={f3(x0 + 8)} y={f3(y0)} width={f3(s - 16)} height={f3(EDGE.CREAM / k)} fill={T.rim} opacity={0.55} />
      {/* pin-1 mark */}
      <circle cx={f3(x0 + 20)} cy={f3(y0 + 20)} r={6} fill={T.subLo} stroke={T.deep} strokeWidth={hair} opacity={0.9} />
      {/* small capacitors along the substrate's lower and upper edge */}
      {[-3, -2, -1, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={f3(i * 30 - 6)} y={f3(-G.subBottom - 26)} width={12} height={8} rx={1.5} fill={T.mid} stroke={T.deep} strokeWidth={hair} />
          <rect x={f3(i * 30 - 6)} y={f3(y0 + 18)} width={12} height={8} rx={1.5} fill={T.mid} stroke={T.deep} strokeWidth={hair} />
        </g>
      ))}
      {/* HBM stacks, raised: one soft shadow each down-right */}
      {hbm.map((h, i) => (
        <g key={i}>
          <rect x={f3(h.x + 3)} y={f3(h.y + 4)} width={hw} height={hh} rx={3} fill={COLOR.shadow} opacity={0.35} style={{ filter: "blur(3px)" }} />
          <rect x={f3(h.x)} y={f3(h.y)} width={hw} height={hh} rx={3} fill={`url(#${uid}b)`} stroke={T.deep} strokeWidth={hair} />
          <rect x={f3(h.x + 3)} y={f3(h.y)} width={hw - 6} height={f3(EDGE.CREAM / k)} fill={T.rim} opacity={0.7} />
        </g>
      ))}
      {/* the die: the brightest, raised */}
      <rect x={f3(dx + 4)} y={f3(dy + 6)} width={die} height={die} rx={4} fill={COLOR.shadow} opacity={0.4} style={{ filter: "blur(5px)" }} />
      <rect x={f3(dx)} y={f3(dy)} width={die} height={die} rx={4} fill={`url(#${uid}d)`} stroke={T.deep} strokeWidth={hair} />
      <rect x={f3(dx + 12)} y={f3(dy + 12)} width={die - 24} height={die - 24} rx={2} fill="none" stroke={T.warm} strokeWidth={f3(Math.max(1.6, 1.4 / k))} opacity={0.8} />
      <rect x={f3(dx + 4)} y={f3(dy)} width={die - 8} height={f3(EDGE.CREAM / k)} fill={T.rim} opacity={0.85} />
      {/* the socket block on the apron (drawn last: the bottom pins go into it) */}
      <path d={rectPath(-G.baseW / 2, -G.baseH, G.baseW, G.baseH, 4, true, false)} fill={T.lit} stroke={T.deep} strokeWidth={hair} />
      <rect x={f3(-s / 2 - 4)} y={f3(-G.baseH)} width={f3(s + 8)} height={6} fill={T.deep} opacity={0.5} />
      <rect x={f3(-G.baseW / 2 + 4)} y={f3(-G.baseH)} width={f3(G.baseW - 8)} height={f3(EDGE.CREAM / k)} fill={T.rim} opacity={0.8} />
      <rect x={f3(G.baseW / 2 - 40)} y={f3(-G.baseH + 2)} width={38} height={f3(G.baseH - 2)} fill={T.shade} opacity={0.45} />
    </g>
  );
};

// ===========================================================================
// THE CONTAINER STACK
// ===========================================================================
const CW20 = BOX_W;
const CH = BOX_H;
/** container tones up a stack, by level (neighbouring boxes never share a tone) */
const STACK_TONES: (keyof Tones)[][] = [
  ["lit", "shade", "mid", "lit", "warm"],
  ["warm", "lit", "shade", "mid", "lit"],
];

const Container: React.FC<{ x: number; y: number; w: number; h: number; tone: string; T: Tones; k: number; shadowTop: boolean }> = ({ x, y, w, h, tone, T, k, shadowTop }) => {
  const uid = uidOf(useId());
  const post = 9;
  const railT = 7;
  const railB = 9;
  const pitch = 11.5;
  const n = Math.floor((w - 2 * post - 6) / pitch);
  const x0 = x + (w - n * pitch) / 2;
  const hair = Math.max(1.3, 1.1 / k);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixHex(tone, T.lit, 0.4)} />
          <stop offset="1" stopColor={mixHex(tone, T.shade, 0.35)} />
        </linearGradient>
      </defs>
      <rect x={f3(x)} y={f3(y)} width={f3(w)} height={f3(h)} fill={`url(#${uid}g)`} />
      {/* corrugation: a shade and a lit stripe per rib */}
      <g>
        {Array.from({ length: n }, (_, i) => (
          <g key={i}>
            <rect x={f3(x0 + i * pitch + 5.5)} y={f3(y + railT)} width={4.2} height={f3(h - railT - railB)} fill={T.shade} opacity={0.55} />
            <rect x={f3(x0 + i * pitch + 1)} y={f3(y + railT)} width={2.2} height={f3(h - railT - railB)} fill={T.rim} opacity={0.35} />
          </g>
        ))}
      </g>
      {/* rails and posts */}
      <rect x={f3(x)} y={f3(y)} width={f3(w)} height={railT} fill={mixHex(tone, T.lit, 0.6)} />
      <rect x={f3(x)} y={f3(y)} width={f3(w)} height={f3(EDGE.CREAM / k)} fill={T.rim} opacity={0.8} />
      <rect x={f3(x)} y={f3(y + h - railB)} width={f3(w)} height={railB} fill={mixHex(tone, T.shade, 0.6)} />
      <rect x={f3(x)} y={f3(y)} width={post} height={f3(h)} fill={mixHex(tone, T.lit, 0.3)} />
      <rect x={f3(x + w - post)} y={f3(y)} width={post} height={f3(h)} fill={mixHex(tone, T.shade, 0.55)} />
      {/* corner castings */}
      {[
        [x, y],
        [x + w - post, y],
        [x, y + h - post],
        [x + w - post, y + h - post],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <rect x={f3(cx)} y={f3(cy)} width={post} height={post} fill={T.shade} />
          <rect x={f3(cx + 2.5)} y={f3(cy + 3)} width={4} height={3} rx={1} fill={T.deep} />
        </g>
      ))}
      {/* the box above sits on this one: its contact shade along the top */}
      {shadowTop ? <rect x={f3(x)} y={f3(y)} width={f3(w)} height={8} fill={COLOR.shadow} opacity={0.22} style={{ filter: "blur(2px)" }} /> : null}
      <rect x={f3(x)} y={f3(y)} width={f3(w)} height={f3(h)} fill="none" stroke={T.deep} strokeWidth={hair} opacity={0.75} />
    </g>
  );
};

/** ContainerStack in local px: `levels` 20 ft containers stacked (the stack's centre on the foot); `variant` picks
 *  the tone order. */
export const ContainerStack: React.FC<{ T: Tones; k: number; levels: number; variant?: 0 | 1 }> = ({ T, k, levels, variant = 0 }) => (
  <g>
    {Array.from({ length: levels }, (_, lv) => (
      <Container key={lv} x={-CW20 / 2} y={-(lv + 1) * CH} w={CW20} h={CH - 1} tone={T[STACK_TONES[variant][lv % 5]]} T={T} k={k} shadowTop={lv < levels - 1} />
    ))}
  </g>
);

// ===========================================================================
// THE COST COLUMN (UpColumn's recipe, copied from scott-radar-map/npsColumnsParts.tsx and adapted)
// ===========================================================================
const RADIUS = 4;
const HotEdge: React.FC<{ x: number; y: number; w: number; k: number; id: string }> = ({ x, y, w, k, id }) => {
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, w, fall, 0, false, false)} fill={`url(#${id})`} />
      <path d={`M${f3(x)} ${f3(y + EDGE.HOT / k / 2)}H${f3(x + w)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
    </g>
  );
};
const glassPath = (x0: number, w: number, openY: number, endY: number, r: number, hw: number) => {
  const xl = x0 + hw;
  const xr = x0 + w - hw;
  const e = endY + hw;
  return `M${f3(xl)} ${f3(openY)}V${f3(e + r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(xl + r)} ${f3(e)}H${f3(xr - r)}A${f3(r)} ${f3(r)} 0 0 1 ${f3(xr)} ${f3(e + r)}V${f3(openY)}`;
};

/**
 * CostColumn — a glass column `h` tall out of its slot at `base`, the amber fill `fill` tall inside it (band
 * gradient, fixed bloom, the hot top edge). Rungs every `rung` from the base are marks on the glass: ink-amber
 * where the fill is, a faint cream hairline on the emptied glass above it (the old level stays readable).
 */
export const CostColumn: React.FC<{ x: number; base: number; w: number; h: number; fill: number; rung: number; k: number; band: [number, number] }> = ({ x, base, w, h, fill, rung, k, band }) => {
  const uid = uidOf(useId());
  const x0 = x - w / 2;
  const top = base - h;
  const fy = base - fill;
  const r = Math.min(RADIUS * 2, w / 2, h);
  const hair = Math.max(STROKE.HAIRLINE, 2) / k;
  const rungsIn: number[] = [];
  const rungsOut: number[] = [];
  for (let i = 1; i * rung < h - r; i++) {
    const y = base - i * rung;
    if (y > fy + (EDGE.HOT + 4) / k) rungsIn.push(y);
    else if (y < fy - 3 / k) rungsOut.push(y);
  }
  const sx = x0 + w * 0.13;
  const sw = Math.max(w * 0.09, 3 / k);
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(band[0])} x2="0" y2={f3(band[1])}>
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
        <linearGradient id={`${uid}ao`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
        <linearGradient id={`${uid}fs`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity="0.16" />
          <stop offset="0.3" stopColor={COLOR.amberHot} stopOpacity="0" />
          <stop offset="0.62" stopColor={COLOR.amberFoot} stopOpacity="0" />
          <stop offset="1" stopColor={mixHex(COLOR.amberFoot, COLOR.inkDark, 0.3)} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      <ellipse cx={f3(x + 6)} cy={f3(base - 1)} rx={f3(w * 0.62)} ry={f3(4)} fill={COLOR.shadow} opacity={0.5} style={{ filter: `blur(${f3(3 / k)}px)` }} />
      <path d={rectPath(x0, top, w, h, r, true, false)} fill={COLOR.glass} fillOpacity={ALPHA.glassTint * 1.5} />
      {fill > 0.05 ? (
        <g style={{ filter: bloomFilter(k) }}>
          <path d={rectPath(x0, fy, w, fill, 0, false, false)} fill={`url(#${uid}a)`} />
          <path d={rectPath(x0, fy, w, fill, 0, false, false)} fill={`url(#${uid}fs)`} />
        </g>
      ) : null}
      {rungsIn.length ? (
        <g stroke={COLOR.rung} strokeWidth={f3(STROKE.HAIRLINE / k)}>
          {rungsIn.map((y) => (
            <line key={y} x1={f3(x0)} x2={f3(x0 + w)} y1={f3(y)} y2={f3(y)} />
          ))}
        </g>
      ) : null}
      {rungsOut.length ? (
        <g stroke={COLOR.glass} strokeOpacity={0.4} strokeWidth={f3(STROKE.HAIRLINE / k)}>
          {rungsOut.map((y) => (
            <line key={y} x1={f3(x0 + 2 / k)} x2={f3(x0 + w - 2 / k)} y1={f3(y)} y2={f3(y)} />
          ))}
        </g>
      ) : null}
      {fill > 0.05 ? <HotEdge x={x0} y={fy} w={w} k={k} id={`${uid}h`} /> : null}
      <rect x={f3(x0)} y={f3(base - Math.min(h, EDGE.FOOT_AO / k))} width={f3(w)} height={f3(Math.min(h, EDGE.FOOT_AO / k))} fill={`url(#${uid}ao)`} />
      {h > r + 6 / k ? <rect x={f3(sx)} y={f3(top + r + 2 / k)} width={f3(sw)} height={f3(Math.max(0, h - r - 4 / k))} rx={f3(sw / 2)} fill={COLOR.glass} fillOpacity={0.12} /> : null}
      <path d={glassPath(x0, w, base, top, r, hair / 2)} fill="none" stroke={COLOR.glass} strokeOpacity={ALPHA.glassHi} strokeWidth={f3(hair)} />
    </g>
  );
};

// ===========================================================================
// CAST SHADOWS — the low sun's long shadows on the apron (rev 2), SCREEN px through the AirCam
// ===========================================================================
/** A shadow caster in chart-plane local px around its foot x: a line member (`w` its width) or a closed outline. */
export type Caster = { a: [number, number]; b: [number, number]; w: number } | { pts: [number, number][] };
/** the pylon's members as casters (the drawing's own geometry): legs, bracing, arms, insulator strings */
export const pylonCasters = (): Caster[] => {
  const out: Caster[] = [];
  const seg = (a: [number, number], b: [number, number], w: number) => out.push({ a, b, w });
  for (const s of [-1, 1]) {
    const L: [number, number][] = [
      [s * LEG[0][0], FOOTING.h],
      [s * legHalf(LEG[1][1]), LEG[1][1]],
      [s * LEG[2][0], LEG[2][1]],
      [0, PEAK],
    ];
    for (let i = 0; i < L.length - 1; i++) seg(L[i], L[i + 1], 9);
  }
  for (let i = 0; i < PANELS.length - 1; i++) {
    const h0 = PANELS[i];
    const h1 = PANELS[i + 1];
    seg([-legHalf(h0), h0], [legHalf(h1), h1], 4.6);
    seg([legHalf(h0), h0], [-legHalf(h1), h1], 4.6);
    if (i > 0) seg([-legHalf(h0), h0], [legHalf(h0), h0], 4.6);
  }
  for (const a of ARMS) {
    for (const s of [-1, 1]) {
      seg([s * legHalf(a.top), a.top], [s * a.tip, a.top], 6);
      seg([s * legHalf(a.bot), a.bot], [s * a.tip, a.top - 3], 4.2);
      seg([s * (a.tip - 4), a.top], [s * (a.tip - 4), a.top - INSUL], 9);
    }
  }
  seg([-26, PEAK - 6], [26, PEAK - 6], 5);
  return out;
};
/** a rectangle caster (x0..x1 wide, from height h0 to h1) */
export const rectCaster = (x0: number, x1: number, h0: number, h1: number): Caster => ({
  pts: [
    [x0, h0],
    [x1, h0],
    [x1, h1],
    [x0, h1],
  ],
});
/** the chip's outline: the socket block and the package (pins included) */
export const chipCasters = (): Caster[] => {
  const G = CHIP_GEO;
  const half = G.sub / 2 + G.pin;
  return [rectCaster(-G.baseW / 2, G.baseW / 2, 0, G.baseH), rectCaster(-half, half, G.baseH, G.subBottom + G.sub + G.pin)];
};
/** a container stack's outline */
export const stackCasters = (levels: number): Caster[] => [rectCaster(-BOX_W / 2, BOX_W / 2, 0, levels * BOX_H)];

/** where a point of the chart plane (local px x, height h above the foot, around foot x `ox`) lands on the apron */
const groundOf = (ox: number, x: number, h: number): [number, number, number] => {
  const [X, , Z] = toWorld(ox + x, FOOT);
  const Y = (h + GROUND - FOOT) / S0;
  return [X + Y * SUN_SHADOW.x, 0, Z + Y * SUN_SHADOW.z];
};

/**
 * CastShadows — every caster's shadow on the apron, projected through the AirCam, as ONE shadow layer (one light:
 * overlaps never double-darken; the group's opacity is the shadow's strength). The penumbra widens with the height
 * of the casting part (three blur bands). `items` = { x: the caster's foot x in chart px, casters, weight 0..1 }:
 * a lighter weight (glass, a liquid) gets its own fainter layer.
 */
export const CastShadows: React.FC<{ cam: AirCam; items: { x: number; casters: Caster[] }[]; opacity: number }> = ({ cam, items, opacity }) => {
  const bands: React.ReactNode[][] = [[], [], []];
  const bandOf = (h: number) => (h < 180 ? 0 : h < 420 ? 1 : 2);
  items.forEach((it, ii) =>
    it.casters.forEach((c, ci) => {
      const key = `${ii}-${ci}`;
      if ("pts" in c) {
        // an outline: split into horizontal strips so each strip takes the blur of its height
        const hs = c.pts.map((p) => p[1]);
        const h0 = Math.min(...hs);
        const h1 = Math.max(...hs);
        const xs = c.pts.map((p) => p[0]);
        const x0 = Math.min(...xs);
        const x1 = Math.max(...xs);
        const cuts = [h0, ...[180, 420].filter((v) => v > h0 && v < h1), h1];
        for (let j = 0; j < cuts.length - 1; j++) {
          const q = [groundOf(it.x, x0, cuts[j]), groundOf(it.x, x1, cuts[j]), groundOf(it.x, x1, cuts[j + 1]), groundOf(it.x, x0, cuts[j + 1])].map((g) => airProject(cam, g));
          bands[bandOf((cuts[j] + cuts[j + 1]) / 2)].push(<path key={`${key}-${j}`} d={q.map((p, k) => `${k ? "L" : "M"}${f3(p.x)} ${f3(p.y)}`).join("") + "Z"} />);
        }
      } else {
        const A = airProject(cam, groundOf(it.x, c.a[0], c.a[1]));
        const B = airProject(cam, groundOf(it.x, c.b[0], c.b[1]));
        const s = (A.s + B.s) / 2;
        bands[bandOf((c.a[1] + c.b[1]) / 2)].push(
          <line key={key} x1={f3(A.x)} y1={f3(A.y)} x2={f3(B.x)} y2={f3(B.y)} strokeWidth={f3(Math.max(0.8, (c.w / S0) * s * 1.1))} />,
        );
      }
    }),
  );
  const blur = [1.6, 3.6, 6.4];
  return (
    <g opacity={f3(opacity)}>
      {bands.map((b, i) => (
        <g key={i} fill={COLOR.shadow} stroke={COLOR.shadow} strokeLinecap="round" style={{ filter: `blur(${blur[i]}px)` }}>
          {b}
        </g>
      ))}
    </g>
  );
};
/** the apron's floor plane is at Z >= this many metres in front of the row (the camera's near apron edge) */
export const APRON_NEAR = ZC - 320;
