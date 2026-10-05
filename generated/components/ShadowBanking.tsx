import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Bead,
  DOT_R,
  HATCH_PITCH,
  INK,
  INK_HI,
  INK_LO,
  INK_W,
  Label,
  PAPER,
  RED,
  RED_DEEP,
  RED_HI,
  RED_WET,
  Seal,
  Stage,
  clamp01,
  enterU,
  mixHex,
  paperShadow,
  pointAtLen,
  rungAt,
  smoothstep,
  subPathD,
  worldBlur,
  sz,
} from "./chinatalkShared";
import type { Pt } from "./chinatalkShared";
import {
  BANK_GAP,
  BANK_L,
  BANK_U,
  CAM_REST,
  CH_X0,
  CH_X1,
  CH_Y,
  FLOW_H,
  DURATION,
  FPS,
  HL,
  LABEL_WORD_F,
  LABEL_Y,
  NETWORK,
  OPENS,
  ageOn,
  beadGrow,
  camAt,
  edgeFronts,
  gAt,
  pulseXs,
  sealSide,
  tAtG,
} from "./shadowBankingGeom";
import type { Edge } from "./shadowBankingGeom";

// ---------------------------------------------------------------------------
// ShadowBanking — Logan Wright, "The biggest credit boom in history" (ChinaTalk
// style), V2 cut 5 of 5, delivered as 44_ShadowBanking.mov.
//
// Line: "You had a variety of different developments that took place that
// facilitated the growth of the shadow banking system."
// IN = 1056 (S of "you"). "system" ends at S 1211 -> local 155, + 16 f tail =
// DURATION 171 f at 24 fps, 1080x1920, opaque.
//
// Idea: credit leaking out of the official channel into a hidden network that
// grows underneath. RED = China's credit (the channel's flow, the seals where
// it breaks out, the seeps); RED_DEEP = the same credit gone hidden (the seeps
// darken with depth, the network, its junction seals, its bleed and hatch).
// Ink carries the banks, the shadow wash and the label.
//
// Gestures (each with its word, local frames) — pass 2 (director review):
//  1. the channel already flowing: a broad red credit flow (44 world, ~82 screen
//     px at k 1.85) between ink banks at screen y ~650, empty paper below; one
//     #F2604A pulse runs it left -> right (15 screen px/f)       — "you had a"   0–15
//  2. the bank parts behind the pulse: five red seal-square notches spring one
//     after another, five different sizes (40–70 px, all five in frame by f55)
//                                    — "a variety of different developments"  15–55
//  3. the notches widen (one scattered group move, to 44–95 px) and a red bead
//     swells through each, stretching on its neck; the ink shadow starts to
//     bloom under the openings                            — "that took place"  57–86
//  4. the beads let go: seeps run down, turning RED_DEEP within ~60 px, bleeding
//     into the paper; the camera tilts down with them (glide 62–104)
//                                                            — "facilitated"   82–106
//  5. the seeps branch and join into an asymmetric RED_DEEP network (deep
//     junction seals, deeper lines softer), under a feathered ink shadow cloud
//     (core 0.16) spreading with it; the banks step back to 0.42; the camera
//     pulls back (glide 80–134, k -> 0.83) so the shadow takes the column under
//     a now-thin channel                        — "the growth of the shadow"  104–145
//     "SHADOW BANKING" (ink 0.90, >= 50 px) slides up under it, landed above
//     y 1300                                                — "banking"      116–128
//  6. tail: five tendril tips keep creeping outward, the shadow keeps diffusing
//     outward, the pulse keeps running, the camera drifts slowly    145–171
// Element types: channel (banks + red flow + pulse), seal squares, seep lines
// with bead tips, washes (shadow cloud / bleed / hatch), the label.
// ---------------------------------------------------------------------------

export { DURATION, FPS };
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

/** the colour of the seep network at depth y: RED at the bank, RED_DEEP by ~y 830 */
const DEEP_Y0 = 648;
const DEEP_Y1 = 712;
const rgbOf = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mixRgb = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => {
  const u = clamp01(t);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
};
const css = (c: [number, number, number]) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
const C_RED = rgbOf(RED);
const C_DEEP = rgbOf(RED_DEEP);
const C_WET = rgbOf(RED_WET);
const depthU = (y: number) => smoothstep((y - DEEP_Y0) / (DEEP_Y1 - DEEP_Y0));
/** the line's dry colour at depth y, and its wet colour (one step brighter) */
const dryAt = (y: number) => mixRgb(C_RED, C_DEEP, depthU(y));
const C_DEEP_WET = mixRgb(C_DEEP, C_RED, 0.4);
const wetAt = (y: number) => mixRgb(C_WET, C_DEEP_WET, depthU(y));
/** deeper = softer: 0 near the bank, 1 at the network's foot */
const softU = (y: number) => smoothstep((y - 860) / 460);
const colorAtY = (y: number) => css(dryAt(y));
const WET_LEN = 64;
const WET_DRY = 18;
const TIP_R = 0.55 * DOT_R;
/** solid ink at ~7 screen px (director, phone weight) */
const BANK_W = 5.8;
const NODE_R = 0.68 * DOT_R;
/** the shadow cloud's core ink opacity and its feather (world px) */
const SHADOW_CORE = 0.16;
const CLOUD_BLUR = 48;

type Piece = { e: Edge; s0: number; s1: number; tipAt: number | null; fromV: boolean; gap: number };

/** The red flow, the pulse, the banks and the openings. */
const Channel: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const s = sz(k);
  const bankRung = rungAt(f, 100, INK_HI, INK_LO);
  const bankW = BANK_W * s;
  // the lower bank, parted at every opening
  const cuts = OPENS.map((o) => ({ x: o.x, h: sealSide(o, f) / 2 }))
    .filter((c) => c.h > 0.3)
    .sort((a, b) => a.x - b.x);
  const lower: string[] = [];
  let x = CH_X0;
  for (const c of cuts) {
    const x1 = c.x - c.h - BANK_GAP - bankW / 2;
    if (x1 > x) lower.push(`M${x.toFixed(2)} ${BANK_L}L${x1.toFixed(2)} ${BANK_L}`);
    x = c.x + c.h + BANK_GAP + bankW / 2;
  }
  lower.push(`M${x.toFixed(2)} ${BANK_L}L${CH_X1} ${BANK_L}`);
  return (
    <g>
      {/* the banks */}
      <g opacity={bankRung.toFixed(4)} stroke={INK} strokeWidth={bankW.toFixed(3)} strokeLinecap="round" fill="none">
        <path d={`M${CH_X0} ${BANK_U}L${CH_X1} ${BANK_U}`} />
        <path d={lower.join("")} />
      </g>
      {/* the credit flow, and its one travelling pulse */}
      <g style={{ filter: paperShadow(k) }}>
        <rect x={CH_X0} y={CH_Y - FLOW_H / 2} width={CH_X1 - CH_X0} height={FLOW_H} rx={FLOW_H / 2} fill={RED} />
        {pulseXs(f).map((hx, n) => (
          <g key={n}>
            <defs>
              <linearGradient id={`sb-pulse-${n}`} gradientUnits="userSpaceOnUse" x1={hx - HL} y1={0} x2={hx + HL} y2={0}>
                <stop offset={0} stopColor={RED_HI} stopOpacity={0} />
                <stop offset={0.62} stopColor={RED_HI} stopOpacity={0.9} />
                <stop offset={0.86} stopColor={RED_HI} stopOpacity={1} />
                <stop offset={1} stopColor={RED_HI} stopOpacity={0} />
              </linearGradient>
            </defs>
            <rect x={(hx - HL).toFixed(2)} y={CH_Y - FLOW_H / 2} width={2 * HL} height={FLOW_H} fill={`url(#sb-pulse-${n})`} />
          </g>
        ))}
        {/* the openings: a red seal square where the bank parts */}
        {OPENS.map((o) => {
          const side = sealSide(o, f);
          if (side < 0.3) return null;
          const rr = Math.min(side / 2, 2 * s);
          return (
            <rect
              key={o.i}
              x={(o.x - side / 2).toFixed(3)}
              y={(BANK_L - side / 2).toFixed(3)}
              width={side.toFixed(3)}
              height={side.toFixed(3)}
              rx={rr.toFixed(3)}
              fill={RED}
            />
          );
        })}
      </g>
    </g>
  );
};

/** Which stretches of every network edge are drawn at frame f. */
const piecesAt = (f: number): Piece[] => {
  const g = gAt(f);
  const out: Piece[] = [];
  for (const e of NETWORK.edges) {
    if (e.seep !== undefined && beadGrow(OPENS[e.seep], f) <= 0) continue;
    const { a, b, full } = edgeFronts(e, g, f);
    if (full) {
      out.push({ e, s0: 0, s1: e.L, tipAt: null, fromV: false, gap: 0 });
      continue;
    }
    const gap = e.L - a - b;
    if (a > 0.05) out.push({ e, s0: 0, s1: a, tipAt: a, fromV: false, gap });
    if (b > 0.05) out.push({ e, s0: e.L - b, s1: e.L, tipAt: b, fromV: true, gap });
  }
  return out;
};

const pieceD = (p: Piece) => subPathD(p.e.pts, p.e.cum, p.s0, p.s1);

/** The seep network, its washes, junction seals and tip beads. */
const Network: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const s = sz(k);
  const pieces = piecesAt(f);
  if (!pieces.length) return null;
  const allD = pieces.map(pieceD).join("");
  // washes grow as the ink soaks: the bleed widens with time since the seeps began
  const soak = smoothstep((f - 86) / 60);
  const bleedW = 18 + 22 * soak;
  const hatchW = 30 + 34 * soak;
  // the shadow: one feathered ink cloud (core ~0.15) blooming under the
  // openings and spreading with the network, its edge diffusing outward
  const shadowOp = SHADOW_CORE * smoothstep((f - 64) / 26);
  const cloudW = 150 + 90 * soak;
  const bleedOp = 0.16 * smoothstep((f - 74) / 18);
  const pitch = HATCH_PITCH * s * 0.8;
  const wetSegs: React.ReactNode[] = [];
  const beads: React.ReactNode[] = [];
  for (const p of pieces) {
    if (p.tipAt === null) continue;
    const e = p.e;
    const w = e.w * s;
    // the wet stretch behind the tip
    const step = WET_LEN / 12;
    for (let d0 = Math.max(0, p.tipAt - WET_LEN); d0 < p.tipAt - 0.05; d0 += step) {
      const d1 = Math.min(p.tipAt, d0 + step);
      const mid = (d0 + d1) / 2;
      const age = Math.max(0, ageOn(e, mid, f, p.fromV));
      const wet = (1 - smoothstep(age / WET_DRY)) * (1 - smoothstep((p.tipAt - mid) / WET_LEN));
      if (wet < 0.02) continue;
      const sa = p.fromV ? e.L - d1 : d0;
      const sb = p.fromV ? e.L - d0 : d1;
      const pm = pointAtLen(e.pts, e.cum, p.fromV ? e.L - mid : mid);
      wetSegs.push(
        <path
          key={`${e.id}-${p.fromV ? "v" : "u"}-${d0.toFixed(1)}`}
          d={subPathD(e.pts, e.cum, sa, sb)}
          stroke={css(mixRgb(dryAt(pm.y), wetAt(pm.y), wet))}
          strokeWidth={(w * (1 + 0.15 * wet)).toFixed(3)}
          strokeLinecap="round"
          fill="none"
        />,
      );
    }
    // the bead at the tip
    const tip = pointAtLen(e.pts, e.cum, p.fromV ? e.L - p.tipAt : p.tipAt);
    const closing = smoothstep(p.gap / 18);
    if (e.seep !== undefined) {
      const o = OPENS[e.seep];
      const r = o.R * beadGrow(o, f) * (sz(k) / sz(2.3));
      beads.push(<Bead key={e.id} id={`sb-bd-${e.id}`} x={tip.x} y={tip.y} r={r} color={colorAtY(tip.y)} opacity={closing} />);
    } else {
      const op = closing * smoothstep(p.tipAt / 10);
      beads.push(
        <Bead
          key={`${e.id}-${p.fromV ? "v" : "u"}`}
          id={`sb-bd-${e.id}-${p.fromV ? "v" : "u"}`}
          x={tip.x}
          y={tip.y}
          r={TIP_R * s}
          color={colorAtY(tip.y)}
          opacity={op}
        />,
      );
    }
  }
  // junction seals, grown as the front reaches them
  const seals: React.ReactNode[] = [];
  for (const n of Object.values(NETWORK.nodes)) {
    if (n.kind === "src" || n.kind === "tip") continue;
    const grow = clamp01((f - tAtG(n.D)) / 7);
    if (grow <= 0) continue;
    seals.push(<Seal key={n.id} x={n.p.x} y={n.p.y} k={k} grow={grow} r={NODE_R} color={RED_DEEP} />);
  }
  const blobs: React.ReactNode[] = [];
  for (const o of OPENS) {
    const u = smoothstep((f - o.tb) / 44);
    if (u > 0) blobs.push(<circle key={`o${o.i}`} cx={o.x} cy={BANK_L + 46} r={(36 + 70 * u).toFixed(2)} />);
  }
  for (const n of Object.values(NETWORK.nodes)) {
    if (n.kind === "src" || n.kind === "tip") continue;
    const age = f - tAtG(n.D);
    const u = smoothstep(age / 40);
    // keeps diffusing outward after it lands (the tail's slow spread)
    if (u > 0) blobs.push(<circle key={n.id} cx={n.p.x} cy={n.p.y} r={(30 + 100 * u + 0.6 * Math.max(0, age - 30)).toFixed(2)} />);
  }
  const box = { x: -300, y: BANK_L, w: 1680, h: 1100 };
  return (
    <g>
      <defs>
        <clipPath id="sb-below">
          <rect x={box.x} y={BANK_L + 2} width={box.w} height={box.h} />
        </clipPath>
        <linearGradient id="sb-deep" gradientUnits="userSpaceOnUse" x1={0} y1={DEEP_Y0} x2={0} y2={DEEP_Y1}>
          <stop offset={0} stopColor={RED} />
          <stop offset={0.5} stopColor={mixHex(RED, RED_DEEP, 0.5)} />
          <stop offset={1} stopColor={RED_DEEP} />
        </linearGradient>
        <pattern id="sb-hatch" patternUnits="userSpaceOnUse" width={pitch.toFixed(3)} height={pitch.toFixed(3)} patternTransform="rotate(45)">
          <rect x={0} y={0} width={(INK_W * 0.55 * s).toFixed(3)} height={pitch.toFixed(3)} fill={RED_DEEP} />
        </pattern>
        <mask id="sb-hmask" maskUnits="userSpaceOnUse" x={box.x} y={box.y} width={box.w} height={box.h}>
          <g style={{ filter: `blur(${(10).toFixed(2)}px)` }}>
            <path d={allD} stroke="#FFFFFF" strokeWidth={hatchW.toFixed(2)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        </mask>
      </defs>
      <g clipPath="url(#sb-below)">
        {/* the shadow: a soft ink wash spreading over the hidden network */}
        <g opacity={shadowOp.toFixed(4)} style={{ filter: `blur(${CLOUD_BLUR}px)` }}>
          <path d={allD} stroke={INK} strokeWidth={cloudW.toFixed(2)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <g fill={INK}>{blobs}</g>
        </g>
        {/* the bleed: deep red soaking out of every seep */}
        <g opacity={bleedOp.toFixed(4)} style={{ filter: `blur(9px)` }}>
          <path d={allD} stroke={RED_DEEP} strokeWidth={bleedW.toFixed(2)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>
        {/* the fine deep-red hatch, at reduced strength */}
        <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="url(#sb-hatch)" mask="url(#sb-hmask)" opacity={(0.32 * smoothstep((f - 84) / 18)).toFixed(4)} />
      </g>
      {/* hidden: no paper shadow, and the deeper lines sit softer in the shadow */}
      <g>
        {pieces.map((p) => {
          const su = softU(p.e.midY);
          return (
            <path
              key={`${p.e.id}-${p.fromV ? "v" : "u"}`}
              d={pieceD(p)}
              stroke="url(#sb-deep)"
              strokeWidth={(p.e.w * s).toFixed(3)}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity={(1 - 0.32 * su).toFixed(4)}
              style={su > 0.05 ? { filter: worldBlur(1.1 * su, k) } : undefined}
            />
          );
        })}
        {wetSegs}
        {seals}
        {beads}
      </g>
    </g>
  );
};

const ShadowBanking: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const labelPt: Pt = { x: 540, y: LABEL_Y };
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: PAPER }}>
      <Stage S={f} cam={cam} rest={CAM_REST}>
        <Network f={f} k={k} />
        <Channel f={f} k={k} />
        <Label text="Shadow banking" x={labelPt.x} y={labelPt.y} k={k} size="word" appear={enterU(f, LABEL_WORD_F)} minPx={50} />
      </Stage>
    </div>
  );
};

export default ShadowBanking;
