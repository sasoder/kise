import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Commoner,
  DARK,
  HierPage,
  INK,
  INK_CONTEXT,
  INK_FULL,
  LINK_CASING,
  LINK_W,
  Official,
  Ruler,
  TREE,
  Tree,
  WorldSvg,
  linkPathBetween,
  swayCam,
} from "./hierShared";
import { S, SEAT, TREE_X, TREE_Y, cubicD, cubicLen, type P2 } from "./takingMotion";
import {
  BANDS,
  DURATION,
  FPS,
  PULSE_LEN,
  RULER_PX,
  bandSway,
  camAt,
  linkStateAt,
  loyaltyAt,
  nodeStateAt,
  rulerAt,
  seatOpAt,
  sweepAt,
  sweepPoint,
  topLinkAt,
} from "./soCentralizedMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// SoCentralized (the FIRST graphic of the set). Dwarkesh Patel with Si
// Sheppard, clip "Centralized empires fell fast". Dwarkesh map style, a PAGE
// cut (the dark land page, world-space: it travels with the camera). Opaque
// 1080x1920, 24 fps. No text.
//
// THE LINE (sequence 9.593-16.517 s; Dwarkesh's question):
//   "It does seem to me that they, like, maybe just because they were so
//    centralized, you get the emperor and the whole thing falls, whereas other
//    tribes were more dispersed."
//   It f0 · seem f6 · they f17 · like f27 · maybe f34 · because f44 · so f52 ·
//   CENTRALIZED f54-64 · you f64 · get f71 · THE EMPEROR f73-84 · and f84 ·
//   the f96 · whole f103 · thing f106 · FALLS f110-122 · whereas f124 · other
//   f135 · tribes f141 · were f148 · more f151 · DISPERSED f154-166.
// DURATION = 166 frames (f0..f165): the slot is 166 frames of the sequence; no
// tail.
//
// THE PICTURE. One wide page. LEFT: hierShared's tree (1 -> 4 -> 12 -> the
// many) at TakingThatIndividual's scale and tier spacing (836 px wide, centred
// on x 540; the Ruler 175 px, feet y 505; the many's feet y 1110). RIGHT, ~1055
// px away: nine independent bands scattered over ~940 x 830 px, each its own
// orange headman (hierShared Ruler, ~82 px) with 3-6 cream followers (42-48 px)
// below him on short cream links. No link between two bands.
// CLIP RULE: orange = THE ONE AT THE TOP (the Ruler; each band's headman).
// Everything else cream at INK_FULL / INK_CONTEXT; the stroke is cream.
//
// GESTURES (the only ones):
//   0. f0-f54  "...because they were so centralized" (so f52, centralized f54):
//              the hierarchy builds itself UP, one front, never stopping: the
//              many stand at f0 with their links a quarter risen; the links
//              reach the 12 officials (ink in f18-f28), the 4 lords (f30.5-
//              f40) and converge on ONE point where the orange Ruler inks in
//              f46-f54. The camera creeps in 3.5 % (f0-f112). f54-f71: faint
//              cream dashes run up the links to him.
//   1. "you get the emperor" (the emperor f73): ONE cream stroke (a tapering
//              sweep with three trailing hatch lines) enters upper right f62
//              and lands on him f71; it is gone by f79. He is knocked from his
//              place: tips and falls down-left behind the tree's top (80 deg,
//              f71-f89), his orange draining to dim cream f72-f84; a dashed
//              seat-ring is left (f72-f78). The dashes stop (f71-f76).
//   2. "and the whole thing falls" (falls f110): ONE front runs down from the
//              empty top: the four top links drop f90-f102; the lords topple
//              and sink 150 px (f93-f115), the officials 90 px (f100.5-f120),
//              the many sag and spread (f106-f124); links droop; every figure
//              dims to INK_CONTEXT as it goes down; the fallen Ruler sinks
//              with them. By f122 a low heap, nothing above y ~780.
//   3. "whereas other tribes were more dispersed" (more f151, dispersed f154):
//              ONE camera glide right, 1040 px, f112-f156 (pulling back 6 %):
//              the heap leaves left, the bands enter right, already standing
//              and alive. f156-f165: a slow creep goes on; each band sways on
//              its own clock.
// Nothing else: no labels, no map, no strings, no glow.
//
// FACTS DRAWN: none beyond the line. Tree and bands are SCHEMATIC (the set's
// vocabulary; not counts of any polity or people).
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  /** the bands' link weight as a factor on the tree's */
  bandLink: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, bandLink: 0.74 });

const BIG = 4000;
const f2 = (v: number) => v.toFixed(2);

const SoCentralized: React.FC<Props> = ({ vignette, bandLink }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const loyalty = loyaltyAt(frame);
  const linkW = LINK_W * S;

  // ---- the four top links ----
  const top = TREE.byTier[1].map((i) => {
    const t = topLinkAt(i, frame);
    return { i, d: cubicD(t.c), len: cubicLen(t.c), draw: t.draw };
  });

  // ---- the Ruler (he leaves the tree) ----
  const r = rulerAt(frame);
  const rulerSize = RULER_PX;

  // ---- the stroke ----
  const sw = sweepAt(frame);
  let sweep: React.ReactNode = null;
  if (sw.op > 0.003 && sw.head > 0) {
    const M = 26;
    const span = 0.3;
    const L: P2[] = [];
    const R: P2[] = [];
    for (let j = 0; j <= M; j++) {
      const t = j / M;
      const u = sw.head - span * (1 - t);
      const p = sweepPoint(u);
      const q = sweepPoint(u + 0.004);
      const dl = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
      const nx = -(q[1] - p[1]) / dl;
      const ny = (q[0] - p[0]) / dl;
      // thick at the head (a rounded nose over the last 8 %), tapering to nothing
      const w = 10.5 * Math.pow(t, 1.25) * (t > 0.92 ? Math.sqrt(Math.max(0, 1 - Math.pow((t - 0.92) / 0.08, 2))) : 1);
      L.push([p[0] + nx * w, p[1] + ny * w]);
      R.push([p[0] - nx * w, p[1] - ny * w]);
    }
    const body = `M${L.map((p) => `${f2(p[0])},${f2(p[1])}`).join("L")}L${R.reverse()
      .map((p) => `${f2(p[0])},${f2(p[1])}`)
      .join("L")}Z`;
    const hatch = [-11, 0, 11].map((off, hi) => {
      const pts: string[] = [];
      for (let j = 0; j <= 12; j++) {
        const u = sw.head - 0.5 + 0.03 * hi + (0.4 - 0.05 * hi) * (j / 12);
        const p = sweepPoint(u);
        const q = sweepPoint(u + 0.004);
        const dl = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
        pts.push(`${f2(p[0] - ((q[1] - p[1]) / dl) * off)},${f2(p[1] + ((q[0] - p[0]) / dl) * off)}`);
      }
      return `M${pts.join("L")}`;
    });
    sweep = (
      <g opacity={sw.op}>
        <path d={body} fill={DARK} fillOpacity={0.55} stroke={DARK} strokeOpacity={0.55} strokeWidth={3} strokeLinejoin="round" />
        <path d={body} fill={INK} fillOpacity={INK_FULL} />
        {hatch.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={INK} strokeOpacity={INK_CONTEXT} strokeWidth={2.2} strokeLinecap="round" />
        ))}
      </g>
    );
  }

  const seatOp = seatOpAt(frame);

  return (
    <HierPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        {/* the empty seat */}
        {seatOp > 0.003 ? (
          <ellipse cx={SEAT[0]} cy={SEAT[1] + 3} rx={44} ry={11.5} fill="none" stroke={INK} strokeOpacity={seatOp} strokeWidth={3.2} strokeDasharray="10 8" strokeDashoffset={-frame * 0.55} />
        ) : null}

        {/* the four top links */}
        <g fill="none" strokeLinecap="round">
          {top.map((l) =>
            l.draw <= 0.002 ? null : (
              <path
                key={`c-${l.i}`}
                d={l.d}
                stroke={DARK}
                strokeOpacity={0.6 * INK_CONTEXT}
                strokeWidth={linkW + LINK_CASING * S}
                strokeDasharray={l.draw < 0.999 ? `${f2(l.draw * l.len)} ${BIG}` : undefined}
                strokeDashoffset={l.draw < 0.999 ? -(1 - l.draw) * l.len : undefined}
              />
            ),
          )}
          {top.map((l) =>
            l.draw <= 0.002 ? null : (
              <path
                key={`i-${l.i}`}
                d={l.d}
                stroke={INK}
                strokeOpacity={INK_CONTEXT}
                strokeWidth={linkW}
                strokeDasharray={l.draw < 0.999 ? `${f2(l.draw * l.len)} ${BIG}` : undefined}
                strokeDashoffset={l.draw < 0.999 ? -(1 - l.draw) * l.len : undefined}
              />
            ),
          )}
        </g>
        <g fill="none" strokeLinecap="butt">
          {top.map((l) =>
            (loyalty.get(l.i) ?? []).map((pu, j) => {
              const a0 = Math.max(0, pu.at * S);
              const a1 = Math.min(l.len, (pu.at + PULSE_LEN) * S);
              if (a1 - a0 < 1) return null;
              return <path key={`p-${l.i}-${j}`} d={l.d} stroke={INK} strokeOpacity={pu.op ?? INK_FULL} strokeWidth={linkW} strokeDasharray={`${f2(a1 - a0)} ${BIG}`} strokeDashoffset={-(l.len - a1)} />;
            }),
          )}
        </g>

        {/* the Ruler: orange, draining to dim cream as he falls behind the tree's top */}
        {r.ink > 0.003 ? (
          <g transform={`translate(${f2(r.x)} ${f2(r.y)}) rotate(${r.rot.toFixed(3)}) translate(0 ${f2(rulerSize / 2)})`} opacity={r.ink * (1 - (1 - INK_CONTEXT) * r.drain)}>
            {r.drain > 0.003 ? <Ruler size={rulerSize} look="cream" /> : null}
            {r.drain < 0.997 ? (
              <g opacity={1 - r.drain}>
                <Ruler size={rulerSize} look="orange" />
              </g>
            ) : null}
          </g>
        ) : null}

        <Tree x={TREE_X} y={TREE_Y} scale={S} node={(n) => nodeStateAt(n, frame)} link={(c) => linkStateAt(c, frame, loyalty)} />

        {sweep}

        {/* the dispersed bands */}
        {BANDS.map((b, bi) => {
          const lw = linkW * bandLink;
          const head: P2 = [b.x, b.y];
          const fol = b.followers.map((q) => {
            const tilt = bandSway(q.seed + 500, frame, 4.2);
            const a = (tilt * Math.PI) / 180;
            const H = q.size + 3;
            return { q, tilt, top: [q.x + H * Math.sin(a), q.y - H * Math.cos(a)] as P2 };
          });
          return (
            <g key={`band-${bi}`}>
              <g fill="none" strokeLinecap="round">
                {fol.map((o, j) => (
                  <path key={`c${j}`} d={linkPathBetween(head, o.top, 0, 1)} stroke={DARK} strokeOpacity={0.6 * INK_CONTEXT} strokeWidth={lw + 2.4} />
                ))}
                {fol.map((o, j) => (
                  <path key={`i${j}`} d={linkPathBetween(head, o.top, 0, 1)} stroke={INK} strokeOpacity={INK_CONTEXT} strokeWidth={lw} />
                ))}
              </g>
              <g transform={`translate(${f2(b.x)} ${f2(b.y)}) rotate(${(b.lean + bandSway(bi + 900, frame, 1.8)).toFixed(3)})`}>
                <Ruler size={b.size} look="orange" />
              </g>
              {fol.map((o, j) => (
                <g key={`f${j}`} opacity={INK_FULL} transform={`translate(${f2(o.q.x)} ${f2(o.q.y)}) rotate(${o.tilt.toFixed(3)})`}>
                  {o.q.kind === "official" ? <Official size={o.q.size} /> : <Commoner size={o.q.size} />}
                </g>
              ))}
            </g>
          );
        })}
      </WorldSvg>
    </HierPage>
  );
};

export default SoCentralized;
