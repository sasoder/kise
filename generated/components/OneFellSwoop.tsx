// ---------------------------------------------------------------------------
// OneFellSwoop: graphic 3 of 3 of the clip "Sheppard: centralized empires fell
// fast" (Dwarkesh with Si Sheppard). Dwarkesh map style; a real map.
// 1080x1920, 24 fps, opaque.
//
// LINE (sequence 44.336-50.300 s): "...meant that the Spanish couldn't take
// out the Maya in one fell swoop. They couldn't do to the Maya what they'd done
// to the Aztecs."
// DURATION = round(5.964 s x 24) = 143 frames, no tail (the edit fixes it).
//
// CLIP RULE: ORANGE = THE ONE AT THE TOP, the head of a polity. Nothing else is
// orange. The Spaniards' stroke is neutral cream. Cream at two rungs only
// (INK_FULL 0.94 / INK_CONTEXT 0.5). The tree of the two earlier cuts at map
// scale: the Aztec empire = ONE big tree (one orange head at Tenochtitlan, cream
// links branching out to the province heads, the territory in cream hatch); the
// Maya = many small separate trees, one orange head each, no link between them.
//
// GESTURES (the only ones), word onset -> frame
//   0. f0-50     THE MANY: opens close (k 2.9) on the northern Yucatan cluster,
//                already gliding, and pulls back and south in one eased move to
//                the whole Maya world (k 1.95) by f50, the Peten and highland
//                polities entering as it goes; every little tree lit, each
//                orange head breathing on its own phase. Then a creep; the
//                camera is never at rest.
//   1. "the Maya" f41: MAYA slides up from f33 in the open interior between
//                Acalan and the Peten lakes.
//   2. "in one fell swoop" f56-84: THE SWOOP: f48 -> f71 one broad cream C
//                enters off the north-east coast, sweeps across the whole north
//                of the peninsula and down its west side, and lands on ONE head
//                ("one city", unnamed) at f71 ("swoop" f74); its trail lingers
//                ~10 f. Only that head empties to a dashed cream ring (f71-81);
//                its own links slacken and drop a rung; a crisp ripple leaves it
//                and dies at its little tree's edge (34 px, f71-83). Every
//                other head keeps breathing.
//   3. "They couldn't do to the Maya..." f84-121: ONE eased glide west and out
//                (f76 -> f117, C1, peak mid-move): the Maya slide to the right,
//                central Mexico enters; the frame holds both (k 1.08), the lit
//                Aztec tree with its one orange head legible from ~f105.
//   4. "...what they'd done to the Aztecs" f111-143: THE SAME SWOOP (the same
//                C, laid by a similarity, the same weight) from the Gulf, f99 ->
//                lands on Tenochtitlan at f119 ("done" f121): the one head
//                empties to a dashed ring (f119-129) and this time the ripple
//                has somewhere to go: a crisp front runs out along every link
//                (a ring in the hatch + a bead on each link, 8.4 px/f), each
//                link falling to the context rung and sagging, each province
//                dot dimming, the hatch sinking to 0.3 behind it. AZTECS slides
//                up from f122 (word f130). f143: the front is at the last
//                provinces, still running; the Maya lights still breathe.
//
// SOURCES
//   Land: Natural Earth 10m (world-atlas). No borders: none of today's existed.
//   Aztec empire 1519 (hatch, dashed border): scripts/cortes-geo.json, the
//     georeferenced "Aztec Empire 1519 map-fr.svg" (Wikimedia Commons, after
//     Atlas del Mexico prehispanico, Arqueologia Mexicana 2000). Province heads:
//     the Codex Mendoza tributary-province head towns (Berdan & Anawalt 1992)
//     as georeferenced in tlaxProvinces.ts: 37 heads there; the 4 within 38 km
//     of Tenochtitlan (Chalco, Citlaltepec, Cuauhtitlan, Acolhuacan) sit under
//     the capital's disc at this scale and are not drawn apart, and the
//     Xoconochco (Soconusco) exclave is left out of this cut: 32 nodes. The
//     LINKS are schematic (a head hangs from the nearest head within 35 deg of
//     its bearing from the capital and <= 0.75 of its distance, else from the
//     capital), not roads or documented chains of command.
//   Maya polities c. 1520s-1540s, drawn at their capitals' sites (the Yucatan
//     provinces after Roys 1957, "The Political Geography of the Yucatan
//     Maya"): KEPT (23) Ah Canul (Calkini), Can Pech (Campeche), Chanputun
//     (Champoton), Ceh Pech (Motul), Ah Kin Chel (Izamal), Tutul Xiu (Mani),
//     Sotuta, Cupul (Saci), Chikinchel (Chauaca), Ecab, Cochuah (Tihosuco),
//     Uaymil (Bacalar), Chetumal, Cozumel, Itza (Nojpeten), Acalan
//     (Itzamkanac: APPROXIMATE site), Lakandon Ch'ol (Sac Balam: APPROXIMATE
//     site), K'iche' (Q'umarkaj), Kaqchikel (Iximche), Mam (Zaculeu), Poqomam
//     (Mixco Viejo), Rabinal, Tzotzil (Zinacantan). DROPPED for room (within
//     62 px of a kept head in the close framing): Chakan, Hocaba, Tases, Kowoj,
//     Tz'utujil, Ixil. NUDGED apart to 62 px (<= 21 km from the site; the
//     build logs each): Motul, Izamal, Mani, Sotuta, Bacalar, Chetumal,
//     Q'umarkaj, Iximche, Zaculeu, Mixco Viejo, Rabinal. Each polity's 3-4
//     dependents are schematic (subject towns, not named places).
//   The first stroke enters off the north-east coast (Montejo's first entrada
//     landed on the east coast, 1527); the second comes off the Gulf (Cortes
//     landed at San Juan de Ulua / Veracruz, 1519). Both are gestures, not
//     routes. The struck Maya head is "one city", deliberately unnamed: it is
//     not a claim about which polity was reduced first.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  AZTEC_NODES,
  DARK,
  Dot,
  EmpireHatch,
  Head,
  INK,
  INK_CONTEXT,
  INK_FULL,
  MAYA_POLITIES,
  MapLabel,
  MapPage,
  Ripple,
  Swoop,
  TENOCHTITLAN,
  TreeLink,
  WorldSvg,
  breath,
  camFor,
  clamp01,
  hash,
  linkPoint,
  makeSwoop,
  project,
  sizeAt,
  smoothstep,
  swayCam,
  swoopShapeOf,
  worldOf,
  type Cam,
  type P2,
} from "./mayaShared";

export const FPS = 24;
export const DURATION = 143; // round(5.964 s x 24)

export const schema = z.object({
  vignette: z.number().min(0).max(1),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---------------------------------------------------------------------------
// Timing
// ---------------------------------------------------------------------------
export const T = {
  mayaLabel: 33,
  open: 50, // the opening pull-back lands
  swoop1: [48, 71] as [number, number],
  glide: [76, 117] as [number, number],
  swoop2: [99, 119] as [number, number],
  aztecsLabel: 122,
};
const HEAD_OUT = 10; // frames: the orange disc -> the dashed ring
const RIPPLE_F = 12; // frames of the Maya ripple
const RIPPLE_PX = 34; // screen px: the little tree's edge
export const FRONT_V = 8.4; // world px per frame: the Aztec collapse front
const FRONT_SOFT = 6; // screen px

// ---------------------------------------------------------------------------
// The cast
// ---------------------------------------------------------------------------
// "one city": the head on the west side where the stroke ends (never named on screen)
const STRUCK = MAYA_POLITIES.findIndex((p) => p.name === "Chanputun");
const STRUCK_P: P2 = [MAYA_POLITIES[STRUCK].x, MAYA_POLITIES[STRUCK].y];
const AZ_LINKS = AZTEC_NODES.map((n, i) => ({
  a: (n.parent < 0 ? TENOCHTITLAN : [AZTEC_NODES[n.parent].x, AZTEC_NODES[n.parent].y]) as P2,
  b: [n.x, n.y] as P2,
  bow: (i % 2 ? 1 : -1) * (0.05 + 0.05 * hash(i, 5)), // a gentle curve
}));
const AZ_LINK_W = 3; // screen px
const distTen = (p: P2) => Math.hypot(p[0] - TENOCHTITLAN[0], p[1] - TENOCHTITLAN[1]);

// ---------------------------------------------------------------------------
// The camera. Three framings, each creeping: N(f) close on the northern
// cluster, A(f) the whole Maya world, B(f) the wide. N -> A by an ease that is
// already moving at f0 and lands with zero slope at T.open; A -> B by one
// smoothstep over T.glide. C1 end to end and never at rest.
// ---------------------------------------------------------------------------
const NORTH_ANCHOR = project(-88.6, 20.85);
const camN = (f: number): Cam => camFor(NORTH_ANCHOR, 2.9 * Math.exp(0.0003 * f), 540, 800);
const CLOSE_ANCHOR = project(-89.84, 18.1);
const CLOSE_AT: P2 = [540, 690];
const camA = (f: number): Cam => camFor(CLOSE_ANCHOR, 1.95 * Math.exp(0.00032 * f), CLOSE_AT[0], CLOSE_AT[1]);
const WIDE_K = 1.08;
/** the middle of the pair (the Aztec tree's west tip ... the Maya's east tip) and its centre of mass */
const PAIR = (() => {
  const xs = [...AZTEC_NODES.map((n) => n.x), ...MAYA_POLITIES.map((m) => m.x)];
  const ys = [...AZTEC_NODES.map((n) => n.y), ...MAYA_POLITIES.map((m) => m.y)];
  return [(Math.min(...xs) + Math.max(...xs)) / 2, ys.reduce((a, b) => a + b, 0) / ys.length] as P2;
})();
const camB = (f: number): Cam => camFor(PAIR, WIDE_K * Math.exp(-0.0007 * (f - T.glide[1])), 540, 835);
const mixCam = (a: Cam, b: Cam, g: number): Cam => {
  const k = Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * g);
  // the centre rides 1 / k, so a point of the page crosses the screen evenly through the zoom
  const w = Math.abs(a.k - b.k) < 1e-6 ? g : (1 / k - 1 / a.k) / (1 / b.k - 1 / a.k);
  return { k, cx: a.cx + (b.cx - a.cx) * w, cy: a.cy + (b.cy - a.cy) * w };
};
const OPEN_LEAD = 13; // frames: how far into its ease the opening move already is at f0
export const cameraAt = (f: number): Cam => {
  const u0 = smoothstep(OPEN_LEAD / (T.open + OPEN_LEAD));
  const h = (smoothstep((f + OPEN_LEAD) / (T.open + OPEN_LEAD)) - u0) / (1 - u0);
  const g = smoothstep((f - T.glide[0]) / (T.glide[1] - T.glide[0]));
  const near = h >= 1 ? camA(f) : mixCam(camN(f), camA(f), h);
  return g <= 0 ? near : mixCam(near, camB(f), g);
};

// the two strokes: ONE shape. The first enters at screen (900, 330) of its first frame
const S1_FROM = worldOf([900, 330], cameraAt(T.swoop1[0]));
const SHAPE = swoopShapeOf(S1_FROM, project(-88.3, 21.6), project(-90.8, 21.0), STRUCK_P);
export const SWOOP_1 = makeSwoop(S1_FROM, STRUCK_P, SHAPE);
const SWOOP_2_PX = 300; // its length on screen in the wide
const S2_SCALE = SWOOP_2_PX / WIDE_K / SWOOP_1.len;
export const SWOOP_2 = makeSwoop(
  [TENOCHTITLAN[0] - (STRUCK_P[0] - S1_FROM[0]) * S2_SCALE, TENOCHTITLAN[1] - (STRUCK_P[1] - S1_FROM[1]) * S2_SCALE],
  TENOCHTITLAN,
  SHAPE,
);

// ---------------------------------------------------------------------------
// The swoop's clock
// ---------------------------------------------------------------------------
const SWOOP_TAIL = 0.66; // of the path: the blade's length
const SWOOP_FADE = 10; // frames: the trail lingers behind the landed head and thins out
export const swoopAt = (f: number, [f0, f1]: [number, number], len: number) => {
  const t = clamp01((f - f0) / (f1 - f0));
  // drawn at a nearly even speed (a deliberate stroke), easing only at its ends
  const head = len * (0.55 * t + 0.45 * smoothstep(t));
  const tl = SWOOP_TAIL * len;
  const after = clamp01((f - f1) / SWOOP_FADE);
  const tail = f <= f1 ? Math.max(0, head - tl) : len - tl * (1 - smoothstep(after)) * (1 - 0.15 * after);
  const opacity = f < f0 ? 0 : 1 - smoothstep((f - f1 - 2) / (SWOOP_FADE - 2));
  return { head, tail, opacity };
};

const LABEL_MAYA = project(-90.35, 17.36);
const LABEL_AZTECS = project(-98.55, 22.55);

const OneFellSwoop: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = swayCam(cameraAt(frame), frame);
  const k = cam.k;

  // --- the Maya stroke lands
  const hit1 = T.swoop1[1];
  const out1 = (frame - hit1) / HEAD_OUT;
  const rt = clamp01((frame - hit1) / RIPPLE_F);
  const rippleR = RIPPLE_PX * (1 - (1 - rt) * (1 - rt)); // screen px
  const rippleOp = frame < hit1 ? 0 : 1 - smoothstep((rt - 0.5) / 0.5);
  const struckFront = frame < hit1 ? -1 : rt >= 1 ? 1e6 : rippleR / k; // world px from the struck head
  const passedStruck = (p: P2) => (struckFront < 0 ? 0 : (struckFront - Math.hypot(p[0] - STRUCK_P[0], p[1] - STRUCK_P[1])) / (FRONT_SOFT / k));

  // --- the Aztec stroke lands
  const hit2 = T.swoop2[1];
  const out2 = (frame - hit2) / HEAD_OUT;
  const R = Math.max(0, frame - hit2) * FRONT_V; // world px from Tenochtitlan
  const passedAz = (p: P2) => (R <= 0 ? 0 : (R - distTen(p)) / (FRONT_SOFT / k));
  // the ring leaves the head at the full rung (the Maya ripple's twin), then runs on
  // through the territory at the context rung with a bead on every link it crosses
  const ringNear = R <= 0 ? 0 : 1 - smoothstep((R * k - 22) / 16);
  const beadOp = smoothstep((R * k - 14) / 14);

  const s1 = swoopAt(frame, T.swoop1, SWOOP_1.len);
  const s2 = swoopAt(frame, T.swoop2, SWOOP_2.len);

  const depR = sizeAt(3.0, k);
  const provR = sizeAt(6.7, k); // 5 px in the wide
  const mayaR = sizeAt(7, k);
  const tenR = sizeAt(17.5, k); // 13 px in the wide

  // the front's beads: where the circle of radius R crosses each link
  const beads: P2[] = [];
  if (beadOp > 0.01)
    for (const { a, b, bow } of AZ_LINKS) {
      if (R <= distTen(a) || R >= distTen(b)) continue;
      // bisect along the link (distance from the capital rises from a to b)
      let lo = 0;
      let hi = 1;
      for (let i = 0; i < 14; i++) {
        const m = (lo + hi) / 2;
        if (distTen(linkPoint(a, b, bow, m)) < R) lo = m;
        else hi = m;
      }
      beads.push(linkPoint(a, b, bow, lo));
    }

  const mayaSize = 64 * Math.pow(k / 1.95, 0.37);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1B2226" }}>
      <MapPage cam={cam} vignette={vignette}>
        <WorldSvg cam={cam}>
          {/* THE AZTEC EMPIRE: territory, then the one big tree */}
          <EmpireHatch cam={cam} sunk={R > 0 ? { r: R, to: 0.3 } : undefined} />
          {AZ_LINKS.map((l, i) => (
            <TreeLink key={`al${i}`} a={l.a} b={l.b} cam={cam} passed={passedAz} sag={9} width={AZ_LINK_W} bow={l.bow} />
          ))}
          {AZTEC_NODES.map((n, i) => (
            <Dot key={`an${i}`} x={n.x} y={n.y} cam={cam} r={provR} level={1 - clamp01(passedAz([n.x, n.y]))} />
          ))}
          {beads.map((p, i) => (
            <g key={`bd${i}`} opacity={beadOp}>
              <circle cx={p[0]} cy={p[1]} r={6.6 / k} fill={DARK} fillOpacity={0.6} />
              <circle cx={p[0]} cy={p[1]} r={4.6 / k} fill={INK} fillOpacity={INK_FULL} />
            </g>
          ))}
          <Head x={TENOCHTITLAN[0]} y={TENOCHTITLAN[1]} cam={cam} r={tenR} out={out2} breath={breath(frame, 99)} />
          {R > 0 ? <Ripple x={TENOCHTITLAN[0]} y={TENOCHTITLAN[1]} cam={cam} r={R * k} opacity={1 - ringNear} rung={INK_CONTEXT} inEmpire /> : null}
          <Ripple x={TENOCHTITLAN[0]} y={TENOCHTITLAN[1]} cam={cam} r={R * k} opacity={ringNear} />

          {/* THE MAYA: many small separate trees */}
          {MAYA_POLITIES.map((m, i) =>
            m.deps.map((d, j) => (
              <TreeLink key={`ml${i}-${j}`} a={[m.x, m.y]} b={d as P2} cam={cam} passed={i === STRUCK ? passedStruck : undefined} sag={7} />
            )),
          )}
          {MAYA_POLITIES.map((m, i) =>
            m.deps.map((d, j) => (
              <Dot key={`md${i}-${j}`} x={d[0]} y={d[1]} cam={cam} r={depR} level={i === STRUCK ? 1 - clamp01(passedStruck(d as P2)) : 1} />
            )),
          )}
          {MAYA_POLITIES.map((m, i) => (
            <Head key={`mh${i}`} x={m.x} y={m.y} cam={cam} r={mayaR} out={i === STRUCK ? out1 : 0} breath={breath(frame, i + 1)} />
          ))}
          <Ripple x={STRUCK_P[0]} y={STRUCK_P[1]} cam={cam} r={rippleR} opacity={rippleOp} />

          {/* THE SWOOP, twice the same stroke */}
          <Swoop path={SWOOP_1} cam={cam} head={s1.head} tail={s1.tail} opacity={s1.opacity} />
          <Swoop path={SWOOP_2} cam={cam} head={s2.head} tail={s2.tail} opacity={s2.opacity} />
        </WorldSvg>
        <MapLabel text="MAYA" x={LABEL_MAYA[0]} y={LABEL_MAYA[1]} cam={cam} frame={frame} f0={T.mayaLabel} size={mayaSize} spacing={0.34} />
        <MapLabel text="AZTECS" x={LABEL_AZTECS[0]} y={LABEL_AZTECS[1]} cam={cam} frame={frame} f0={T.aztecsLabel} size={56} spacing={0.3} />
      </MapPage>
    </AbsoluteFill>
  );
};

export default OneFellSwoop;
