import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  DARK,
  HierPage,
  INK,
  INK_CONTEXT,
  INK_FULL,
  LINK_CASING,
  LINK_TAPER,
  LINK_W,
  Lord,
  TREE,
  Tree,
  WorldSvg,
  linkLengthBetween,
  linkPathBetween,
  smootherstep,
  smoothstep,
  swayCam,
} from "./hierShared";
import {
  BAR_HALF,
  DURATION,
  FPS,
  PULSE_LEN,
  S,
  SEAT,
  T,
  TREE_X,
  TREE_Y,
  anchorsAt,
  armAt,
  barAt,
  barPoint,
  camAt,
  commandOn,
  cubicD,
  cubicLen,
  linkStateAt,
  lordLinkAt,
  loyaltyAt,
  nodeStateAt,
  rimAt,
  ringAt,
  type P2,
} from "./takingMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// TakingThatIndividual (G2 of 3). Dwarkesh Patel with Si Sheppard, clip
// "Centralized empires fell fast". Dwarkesh map style, a PAGE cut (the dark
// land page, no map). Opaque 1080x1920, 24 fps. It continues G1
// (HierarchicalNature): ONE of its trees, seen closer.
//
// THE LINE (sequence 30.322-37.162 s; f = round((t - 30.322) * 24)):
//   "(...tree.) Taking that individual destabilizes the whole system,
//    potentially even means that it can be functionally governed through the
//    use of intermediaries or even puppets."
//   (tree f2) · TAKING f8 · that f11 · INDIVIDUAL f11-21 · DESTABILIZES f21-38 ·
//   the f38 · whole f42 · SYSTEM f46-61 · potentially f61 · even f69 · means
//   f74 · that f81 · it f84 · can f87 · be f89 · FUNCTIONALLY f93 · GOVERNED
//   f104-112 · through f112 · the f121 · use f128 · of f134 · INTERMEDIARIES
//   f137-148 · or f148 · even f151 · PUPPETS f154-164.
// DURATION = round(6.840 * 24) = 164 frames (f0..f163), no tail: the interval
// is fixed by the edit.
//
// THE PICTURE. hierShared's tree (1 -> 4 -> 12 -> the many) at scale 1.9 (836
// px wide), centred on x 540: the orange Ruler 175 px tall, his feet at y 505;
// lords' feet y 721, officials' y 898, the many's feet y 1038-1110. The tiers
// stand closer together than in G1 (the same figures and fan; shorter links)
// so the headroom for the strings fits above him. No labels (no named word).
// CLIP RULE: orange = THE ONE AT THE TOP and the authority that flows from him
// (the Ruler; the two command pulses; the lords' rims while a command passes
// through them). The taker's apparatus (strings, clasp, control bar, the empty
// seat) is cream ink.
//
// ONE MECHANISM, the strings that take him are the strings that work him.
// GESTURES (the only ones; each leads its word):
//   0. f0        established: the whole tree alive (each figure's own tiny
//                sway; cream loyalty dashes travelling UP the links to the
//                Ruler, as G1 ended); two cream strings with an open clasp
//                ring already coming down over his plumes; the camera creeps
//                in 4.5 % over the whole cut (one C1 track, the house hand on
//                it), settling ~24 px lower while he is hoisted (f0-f30).
//   1. "Taking that individual" (f8 / f11): the clasp reaches his shoulders
//                f8.5 and closes round them f7.5-f10.5; the strings HOIST him
//                120 px f11-f24 (eased both ends): he hangs limp (a 4.5 deg
//                tilt, swinging; head dropped, legs trailing); a dashed cream
//                seat-ring is left where he stood (f12-f18). His four links to
//                the lords stretch as he rises and let go f18-f21.6 (one after
//                another): they stay on the lords' heads and wilt toward the
//                empty seat. The loyalty dashes fade on the links as they go.
//   2. "destabilizes the whole system" (f21 / f46): ONE front runs DOWN from
//                the broken top: the lords f25, the officials f35.5, the many
//                f46-f57. Where it has passed: links slack (sag 0 -> ~0.8),
//                figures off their upright (lords <= 7 deg, the rest <= 9 deg,
//                each his own), tiers out of line (wander <= 13 px), the crowd
//                loose and spread (<= 19 px); all of it keeps swaying. Measured
//                max 3.2 px/f at the nodes.
//   3. "means that it can be functionally governed" (f93 / f104): the strings
//                lower him onto his seat f62-f88 (lands f88), still clasped,
//                still orange; the four wilted links rise and meet his feet
//                f76-f88; a second front runs down from his feet: lords
//                upright f89-f97, officials f94-f102, the many f99-f110.
//                The system stands again, under strings.
//   4. "through the use of intermediaries or even puppets": a cream control
//                bar eases down into view f112-f130, the clasp strings hanging
//                from its middle, and two hand strings drop from its ends to
//                his wrists (f114-f128).
//                "intermediaries" (f137): the bar tips f130-f135, one hand
//                string goes taut and his arm lifts (lands f135); an ORANGE
//                command leaves his feet f135 and runs down: the four links
//                f135-f140, the four lords take an orange rim f139-f145 (the
//                intermediaries carry it), the officials' links f143-f148, the
//                many's links f150-f155; the many step 6 px and lean as one
//                f153-f161 (they obey).
//                "puppets" (f154): the bar jerks up f147.5-f153, both arms fly
//                up on taut strings and his body bobs 14 px off the seat (lands
//                f153); a second orange command leaves f153.5 (links f153.5-
//                f158.5, the lords' rims f157.5-f163). The cut ends f163 with it
//                in the officials' links, the bar and the body swaying: a
//                hand-off to the speaker.
// The arms are never keyed: a hand string has a fixed length, so the arm's
// angle is solved from where the bar's end is (takingMotion armAt).
// Nothing else: no hand, no Spaniard, no flags, no text, no glow.
//
// FACTS DRAWN: none beyond the line. The tree is G1's SCHEMATIC (1 -> 4 -> 12
// -> the many is the set's vocabulary, not a count of any polity).
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  /** the strings' and the clasp's stroke weight (px) */
  stringWidth: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, stringWidth: 3.6 });

const N = TREE.nodes;
const CASE = 0.6;
const BIG = 4000;

/** a cream apparatus stroke over its DARK casing */
const Stroke: React.FC<{ d: string; w: number; op?: number; dash?: string; dashOffset?: number }> = ({ d, w, op = INK_FULL, dash, dashOffset }) =>
  op <= 0.003 ? null : (
    <g fill="none" strokeLinecap="round">
      <path d={d} stroke={DARK} strokeOpacity={CASE * op} strokeWidth={w + 2.4} strokeDasharray={dash} strokeDashoffset={dashOffset} />
      <path d={d} stroke={INK} strokeOpacity={op} strokeWidth={w} strokeDasharray={dash} strokeDashoffset={dashOffset} />
    </g>
  );

const TakingThatIndividual: React.FC<Props> = ({ vignette, stringWidth }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(camAt(frame), frame);
  const ring = ringAt(frame);
  const loyalty = loyaltyAt(frame);
  const linkW = LINK_W * S;

  // ---- the empty seat ----
  const seatOp = INK_CONTEXT * smoothstep((frame - 12) / 6) * (1 - smoothstep((frame - 83) / 5));

  // ---- the four links to the Ruler ----
  const lordLinks = TREE.byTier[1].map((i) => {
    const { c } = lordLinkAt(i, frame);
    return { i, c, d: cubicD(c), len: cubicLen(c) };
  });

  // ---- the lords' rims ----
  const rim = rimAt(frame);

  // ---- the command pulses (orange) ----
  const commands: React.ReactNode[] = [];
  for (const c of N) {
    if (c.parent < 0) continue;
    const qs = commandOn(c, frame);
    if (!qs.length) continue;
    let d: string;
    let L: number;
    if (c.tier === 1) {
      const ll = lordLinks[c.id - 1];
      d = ll.d;
      L = ll.len;
    } else {
      const p0 = anchorsAt(N[c.parent], frame).bottom;
      const p1 = anchorsAt(c, frame).top;
      d = linkPathBetween(p0, p1, 0, 1);
      L = linkLengthBetween(p0, p1, 0, 1);
    }
    const w = Math.max(3.8, linkW * LINK_TAPER[c.tier] * 1.4);
    const len = Math.max(26, 0.42 * L);
    qs.forEach((q, j) => {
      const mid = q * (L + len) - len / 2;
      const a0 = Math.max(0, mid - len / 2);
      const a1 = Math.min(L, mid + len / 2);
      if (a1 - a0 < 1) return;
      const dash = `${(a1 - a0).toFixed(2)} ${BIG}`;
      commands.push(
        <g key={`${c.id}-${j}`} fill="none" strokeLinecap="butt">
          <path d={d} stroke={DARK} strokeOpacity={0.55} strokeWidth={w + 2.6} strokeDasharray={dash} strokeDashoffset={-a0} />
          <path d={d} stroke={ACCENT} strokeWidth={w} strokeDasharray={dash} strokeDashoffset={-a0} />
        </g>,
      );
    });
  }

  // ---- the clasp ring and the strings ----
  const ringT = `rotate(${ring.rot.toFixed(3)} ${ring.cx.toFixed(2)} ${ring.cy.toFixed(2)})`;
  const ringHalf = (front: boolean) =>
    `M${(ring.cx - ring.rx).toFixed(2)},${ring.cy.toFixed(2)} A${ring.rx.toFixed(2)},${ring.ry.toFixed(2)} 0 0 ${front ? 0 : 1} ${(ring.cx + ring.rx).toFixed(2)},${ring.cy.toFixed(2)}`;
  const ra = (ring.rot * Math.PI) / 180;
  const ringSide = (s: number): P2 => [ring.cx + s * ring.rx * Math.cos(ra), ring.cy + s * ring.rx * Math.sin(ra)];
  const claspStrings = [-1, 1].map((s) => {
    const top = barPoint(frame, s * 30);
    const b = ringSide(s);
    return `M${top[0].toFixed(2)},${top[1].toFixed(2)} L${b[0].toFixed(2)},${b[1].toFixed(2)}`;
  });
  const grow = smootherstep((frame - T.handStrings[0]) / (T.handStrings[1] - T.handStrings[0]));
  const handStrings =
    grow <= 0.002
      ? []
      : (["L", "R"] as const).map((side) => {
          const a = armAt(frame, side);
          const s = side === "L" ? -1 : 1;
          const end: P2 = [a.end[0] + (a.hand[0] - a.end[0]) * grow, a.end[1] + (a.hand[1] - a.end[1]) * grow];
          const chord = Math.hypot(end[0] - a.end[0], end[1] - a.end[1]);
          // a slack string bows outward (the bow that takes up the spare length), swaying a little
          const bow = Math.min(34, 0.8 * Math.sqrt((3 * chord * a.slack) / 8)) * grow * (1 + 0.18 * Math.sin(frame / 6 + s));
          const mx = (a.end[0] + end[0]) / 2 + s * bow * 1.5;
          const my = (a.end[1] + end[1]) / 2 + bow * 0.5;
          return `M${a.end[0].toFixed(2)},${a.end[1].toFixed(2)} Q${mx.toFixed(2)},${my.toFixed(2)} ${end[0].toFixed(2)},${end[1].toFixed(2)}`;
        });
  const bar = barAt(frame);
  const barW = 2 * BAR_HALF + 34;

  return (
    <HierPage cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <defs>
          {/* a hard rim: the figure's silhouette grown 2.4 units, flooded orange (no blur) */}
          <filter id="taking-rim" filterUnits="userSpaceOnUse" x={-40} y={-80} width={80} height={100}>
            <feMorphology in="SourceAlpha" operator="dilate" radius={2.4} result="grown" />
            <feFlood floodColor={ACCENT} result="flood" />
            <feComposite in="flood" in2="grown" operator="in" />
          </filter>
        </defs>

        {/* the empty seat */}
        {seatOp > 0.003 ? (
          <ellipse
            cx={SEAT[0]}
            cy={SEAT[1] + 3}
            rx={44}
            ry={11.5}
            fill="none"
            stroke={INK}
            strokeOpacity={seatOp}
            strokeWidth={3.2}
            strokeDasharray="10 8"
            strokeDashoffset={-frame * 0.55}
            strokeLinecap="butt"
          />
        ) : null}

        {/* the lords' orange rims, under the tree */}
        {rim > 0.003
          ? TREE.byTier[1].map((i) => {
              const n = N[i];
              const st = nodeStateAt(n, frame);
              const b = anchorsAt(n, frame).bottom;
              return (
                <g key={`rim-${i}`} opacity={rim} transform={`translate(${b[0].toFixed(2)} ${b[1].toFixed(2)}) rotate(${(st.tilt ?? 0).toFixed(3)}) scale(${S})`}>
                  <g filter="url(#taking-rim)">
                    <Lord size={n.size} />
                  </g>
                </g>
              );
            })
          : null}

        {/* the four links to the Ruler */}
        <g fill="none" strokeLinecap="round">
          {lordLinks.map((l) => (
            <path key={`lc-${l.i}`} d={l.d} stroke={DARK} strokeOpacity={CASE * INK_CONTEXT} strokeWidth={linkW + LINK_CASING * S} />
          ))}
          {lordLinks.map((l) => (
            <path key={`li-${l.i}`} d={l.d} stroke={INK} strokeOpacity={INK_CONTEXT} strokeWidth={linkW} />
          ))}
        </g>
        <g fill="none" strokeLinecap="butt">
          {lordLinks.map((l) =>
            (loyalty.get(l.i) ?? []).map((pu, j) => {
              const a0 = Math.max(0, pu.at * S);
              const a1 = Math.min(l.len, (pu.at + PULSE_LEN) * S);
              if (a1 - a0 < 1) return null;
              return (
                <path key={`lp-${l.i}-${j}`} d={l.d} stroke={INK} strokeOpacity={pu.op ?? INK_FULL} strokeWidth={linkW} strokeDasharray={`${(a1 - a0).toFixed(2)} ${BIG}`} strokeDashoffset={-(l.len - a1)} />
              );
            }),
          )}
        </g>

        {/* the clasp's far half, behind him */}
        <g transform={ringT}>
          <Stroke d={ringHalf(false)} w={stringWidth + 0.6} />
        </g>

        <Tree x={TREE_X} y={TREE_Y} scale={S} node={(n) => nodeStateAt(n, frame)} link={(c) => linkStateAt(c, frame, loyalty)} />

        {commands}

        {/* the clasp's near half, the strings, the control bar */}
        <g transform={ringT}>
          <Stroke d={ringHalf(true)} w={stringWidth + 0.6} />
        </g>
        {claspStrings.map((d, i) => (
          <Stroke key={`cs-${i}`} d={d} w={stringWidth} />
        ))}
        {handStrings.map((d, i) => (
          <Stroke key={`hs-${i}`} d={d} w={stringWidth * 0.86} />
        ))}
        <g transform={`translate(${bar.x.toFixed(2)} ${bar.y.toFixed(2)}) rotate(${bar.tilt.toFixed(3)})`}>
          <rect x={-barW / 2 - 1.6} y={-8.1} width={barW + 3.2} height={16.2} rx={4.6} fill={DARK} fillOpacity={0.7} />
          <rect x={-barW / 2} y={-6.5} width={barW} height={13} rx={3.4} fill={INK} fillOpacity={INK_FULL} />
          <path d={`M${-barW / 2 + 9},2.4 L${barW / 2 - 9},2.4`} stroke={DARK} strokeOpacity={0.3} strokeWidth={1.1} fill="none" />
        </g>
      </WorldSvg>
    </HierPage>
  );
};

export default TakingThatIndividual;
