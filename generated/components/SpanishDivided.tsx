import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  Carrack,
  CityDot,
  CORTES_ROAD,
  CrowdDots,
  DARK,
  HoldRing,
  INK,
  INK_CONTEXT,
  INK_FULL,
  MapLabel,
  MapStack,
  NARVAEZ_LAND_LEG,
  NARVAEZ_VOYAGE_RIDE as NARVAEZ_VOYAGE,
  PaperTop,
  SEA,
  SITES,
  Swords,
  WorldSvg,
  labelSlide,
  screenOf,
  smoothstep,
  swayCam,
  viewRect,
} from "./cortesShared";
import {
  DUR_A,
  DUR_B,
  FPS,
  G_B,
  ROAD_S0,
  T,
  camAt,
  cortesCapY,
  dotsAt,
  landLegAt,
  orangeBodyAt,
  roadHeadAt,
  roadSpeedAt,
  routeEndAt,
  SHIP_ROCK,
  shipAt,
  swordsAnchorAt,
} from "./spanishMotion";

export { DUR_A, DUR_B, FPS, G_B };

// ---------------------------------------------------------------------------
// Dwarkesh with Si Sheppard, clip "Sheppard_Cortes_recruits_the_arrest_army",
// cut 1, as ONE world on ONE global clock g rendered as TWO compositions that
// play back to back:
//   SpanishDivided         g0..g84   (85 f), in-point 6.70 s  -> 6_SpanishDivided.mov
//   GoingBeyondHisMission  g85..g321 (237 f), in-point 10.24 s -> 10_GoingBeyondHisMission.mov
// GoingBeyondHisMission's f0 is g85, the frame after SpanishDivided's last; the
// camera, the crowd and every moving thing are functions of g, so the join is
// seamless (checked: last frames of 1a against the first of 1b).
// "... the Spanish were themselves divided and in fact fighting each other. ‖
//  So maybe you should tell the story how Velázquez sends another expedition
//  to go capture and arrest Cortés for going beyond the prerogative of his
//  mission."
//
// TIMELINE. The SRT (media-to-srt output ..._c4_p0.5.srt) is on the EDIT
// timeline, transcribed from input/Sheppard_Cortes_recruits_the_arrest_army.mp3
// (59.26 s); the clip folder's .movs are a longer raw cut (74.7 s) and are never
// measured. g = round((t - 6.70) * 24). Word onsets (SRT, unrefined):
//   the g0 · Spanish g2 · were g12 · themselves g19 · divided g28 · and in g42 ·
//   fact g56 · fighting g60 · each g70 · other g75 (ends 10.24 s = g85) ‖ So g85 ·
//   maybe g88 · you should tell the story g98-107 · how g112 · Velázquez g118 ·
//   sends g131 · another g141 · expedition g153 · to go g164 · capture g187 ·
//   and g199 · arrest g206 (SRT 15.259 s -> g205.4) · Cortés g214 · for g227 ·
//   going g232 · beyond g238 · the g248 · prerogative g256 · of his g273 ·
//   mission g293 (ends 19.46 s = g306). Spot-checked against the mp3's band
//   energy: the /f/ of "fighting" starts 9.25 s (g61), the burst of "Cortés"
//   15.80 s (g218), "going" 16.32 s (g231): the SRT onsets are kept unrefined.
// DURATIONS: cut 1a = round((10.24 - 6.70) * 24) = round(3.54 * 24) = 85;
//   cut 1b = round((19.46 - 10.24) * 24) = round(9.22 * 24) = 221, + the
//   16-frame house tail = 237 (g85..g321).
//
// DWARKESH MAP STYLE (MEMORY.md; the shared world cortesShared.tsx): sea
// #1B2226, land #3F3428 with the #6A5838 rim, cream ink #E9DDBF, 4 engraved
// water-lines, 5° graticule, baked mottle + grain, vignette, IM Fell English SC.
// No borders. Opaque 1080x1920, 24 fps.
//
// COLOUR RULE: house orange (#FFB000 / #D98A0C) = CORTÉS'S SIDE: his 27 men
// once the crowd splits, his road, the ring on the capital he holds. Everything
// else is cream #E9DDBF at two rungs: full (0.94) for what is in play (the
// Spanish crowd and Narváez's men, the swords, Velázquez's Santiago, the ship
// and its route while it sails, Tenochtitlan), ~0.5 for context (the route once
// the road takes over). Nothing else is coloured.
//
// THE GESTURES, each with its word (global frames). One continuous motion: one
// Spanish army splits and fights itself; the camera pulls away across the Gulf
// to the man in Cuba who sent half of it, follows his ship all the way back to
// that same fight, then rides the other half's road from the coast deep inland.
// (Revised 2026-10-01 after the director's review 1: rounded bodies, a seam
// clash, k ~11 opening, a centred Gulf wide, the ship on an open-water line and
// camera-sized, never on land and never flickering, both labels re-set.)
//   1. "the Spanish were themselves" g0-28. Close on the Gulf coast north of
//      San Juan de Ulúa at k 11.0 (creeping to 11.6 by g73), the whole crowd
//      ~51 % of the frame width on y ~835, the coast and its water-lines at the
//      right: SPANISH_ONE, 117 cream dots (1 dot = 10 men) in one even
//      blue-noise crowd, every dot on its own hashed micro-drift.
//   2. "divided" g24-46. Cortés's 27 inland dots peel away as ONE body (one
//      eased move, no stagger) and gather into a compact rounded group, slightly
//      taller than wide, on his road; the cream 90 settle into their own rounded
//      body against the coast; a clear channel (~2 dot spacings) opens between.
//      The orange arrives as one eased 10 f crossfade per dot, travelling from
//      the fissure out through the group (g26-46). The camera drifts west a
//      touch so the two bodies stay centred.
//   3. "and in fact fighting each other" g52-85. The orange body drives into the
//      cream's west flank (g52-64); both fronts flatten against each other into
//      a seam where the dots compress; along it they give and take, each on its
//      own phase; the seam bows back into the cream (g58-66), then the cream
//      pushes back (g66-77), then it keeps working (a deterministic particle
//      simulation: homes, the seam constraint, spacing). The Swords glyph slides
//      up 24 px and fades in centred on the seam, above the bodies, landing on
//      "fighting" g60 (110 px). It stays to the end as the battle-site marker,
//      world-anchored, never under 40 px.
//   4. "So maybe you should tell the story how" g73-130. One long eased
//      pull-back (k 11.6 -> 0.93, g73-112: still k > 10 at g80, so the clash
//      reads to the join and past it) and glide east at low k (g84-130,
//      screen-shaped: <= 21.5 px/f) through THE GULF WIDE on "Velázquez" g118:
//      the Cempoala group at x ~143, Santiago de Cuba at x ~938, the stage on
//      y ~835. The clash simmers on, small.
//   5. "Velázquez" g110-118. Santiago's small cream city dot fades in and
//      VELÁZQUEZ (IM Fell English SC, 40 px) slides up end-aligned 16 px left of
//      it, on its line, over eastern Cuba, landed on g118. It fades as the ship
//      sails out under it (g138-152).
//   6. "sends another expedition to go capture and arrest Cortés" g129-214.
//      The cream dashed route grows from Santiago two frames ahead of "sends"
//      (g129) and the carrack sails NARVAEZ_VOYAGE_RIDE, one smooth open-water
//      line: down Santiago's bay, west between Cabo Cruz and Jamaica, south of
//      the three Caymans, north-west through the Yucatán Channel, one broad arc
//      over the Gulf north of the Alacranes reef, and south-west into the
//      anchorage ~28 world px east of San Juan de Ulúa. It accelerates out
//      (11 f), cruises (~19 world px/f), decelerates (22 f) and rides at anchor
//      from g194. It is sized with the camera (37.5 k^0.6 px: 37 px at k 0.97,
//      51 px at anchor, k 1.69) and drawn exactly on its own route, the route's
//      end at its stern. It fades in ONCE (g137-144), as soon as its whole box
//      is 6 world px clear of Cuba, and out ONCE at anchor (g196-203) while the
//      dashed line runs on ashore to San Juan de Ulúa (g195-201, "and" g199);
//      between the two it is always fully seen and its box never comes within
//      6 world px of land (it never sits on Cuba, a cay or a coast). The camera
//      holds the Gulf wide while the ship comes to it, then locks on (C1: the
//      ship's screen point starts where it is, moving as it moves, and eases to
//      rest), riding it in the middle third from g151 and pushing in gently
//      (k 0.97 -> 1.72); as the ship slows it leads on west (g180-230), so the
//      crowd comes to the centre by "arrest". The dashed land leg runs from San
//      Juan de Ulúa into the cream body at Cempoala (g199-207, "arrest" g206);
//      the cream front presses one step (3.4 world px) into the orange
//      (g204-217).
//      CORTÉS (38 px) slides up centred below the orange body from g206, landed
//      on "Cortés" g214; its cap line sits 20 px under the body or lower where
//      the road's Cholula bend and the cream body's bottom need it (it never
//      touches the road, the lake or Tenochtitlan), so it travels with the group.
//   7. "for going beyond the prerogative of his mission" g226-293. The camera
//      glides west and pushes in onto central Mexico (k 1.8 -> 4.2, g226-291):
//      the crowd at the right, Tenochtitlan at the left. Cortés's road draws in
//      orange, head-led, from just inside the orange body along CORTES_ROAD: it
//      leaves the body on "going/beyond" (g227-240 ramp), climbs inland past
//      Tlaxcala and Cholula and reaches Tenochtitlan on "mission" (g293); the
//      camera rides it. CORTÉS eases to the context rung as the road gets under
//      way (g245-260). Tenochtitlan's cream dot fades in g236-248; its HoldRing
//      (Cortés holds the capital) crossfades in g291-303. Narváez's route
//      recedes to the context rung (g228-246).
//   8. Tail g306-321. A highlight travels the orange road (from g298, to the
//      last frame), the seam keeps giving and taking, the camera creeps
//      (k 4.2 -> 4.29). Never a frozen frame.
// Nothing else: no other labels (no place names are spoken), no titles, no
// legend, no extra arrows.
//
// SOURCES. scripts/cortes-geo.json (the director's sites, the Narváez voyage of
// 1520 and Cortés's road of 1519 as checked waypoints, the georeferenced 1519
// empire and Lake Texcoco, the facts: Narváez ~900 men, Cortés 266 at Cempoala,
// the night of 27/28 May 1520; 1 dot = 10 men -> 90 + 27). Natural Earth 10m
// land (world-atlas). The voyage, smoothed (centripetal Catmull-Rom), is
// asserted >= 5 km offshore except the bay exit and the anchorage approach; the
// riding voyage the ship sails (a clamped cubic B-spline) is asserted >= 5 world
// px clear of the exact coast for the whole glyph box between its end zones
// (scripts/build-cortes-map.mjs), and per frame the drawn glyph's exact screen
// box keeps >= 5 world px off land while it is seen, fading in and out once
// (scripts/check-spanish-divided.ts).
// ---------------------------------------------------------------------------

export const schema = z.object({
  startFrame: z.number().int().min(0),
  labels: z.object({ velazquez: z.string(), cortes: z.string() }),
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
const baseProps = { labels: { velazquez: "VELÁZQUEZ", cortes: "CORTÉS" }, vignette: 0.55 };
export const defaultPropsSpanishDivided: Props = schema.parse({ ...baseProps, startFrame: 0 });
export const defaultPropsGoingBeyond: Props = schema.parse({ ...baseProps, startFrame: G_B });
export const defaultProps = defaultPropsSpanishDivided;

// world-anchored dashes that hold their screen size through a zoom: a period
// per octave of k, the next octave fading in across it (RailwaysInEuropeanRussia)
const DASH = 11; // screen px period at the bottom of an octave
const octaves = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = DASH / Math.pow(2, o);
  return [
    { p: a, op: 1 - t },
    { p: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
};
const SWORDS_K = 11.3; // the swords are 110 px at the clash's zoom, world-anchored from there, never under 40 px
const CAP = 0.66; // IM Fell English SC cap height, em

const CortesCut1: React.FC<Props> = ({ startFrame, labels, vignette }) => {
  const frame = useCurrentFrame();
  const g = frame + startFrame;
  const cam = swayCam(camAt(g), g);
  const k = cam.k;
  const px = (v: number) => v / k;
  const view = viewRect(cam, 60);
  const inView = (x: number, y: number) => x > view.x0 && x < view.x1 && y > view.y0 && y < view.y1;

  // -- Narváez's route and the land leg: a fine cream dashed line -------------
  const routeOp = INK_FULL + (INK_CONTEXT - INK_FULL) * smoothstep((g - T.routeRecede[0]) / (T.routeRecede[1] - T.routeRecede[0]));
  const routeEnd = g > T.depart ? routeEndAt(g, k) : 0;
  const routeD = routeEnd > 0.5 ? NARVAEZ_VOYAGE.partialD(0, routeEnd) : "";
  const legEnd = landLegAt(g);
  const legD = legEnd > 0.2 ? NARVAEZ_LAND_LEG.partialD(0, legEnd) : "";
  const oct = octaves(k);
  const dashed = (d: string, offset: number, key: string) =>
    d ? (
      <g key={key} fill="none" strokeLinecap="butt" strokeLinejoin="round">
        <path d={d} stroke={DARK} strokeOpacity={0.35 * routeOp} strokeWidth={px(4)} />
        {oct.map((o) => (
          <path
            key={`${key}-${o.p}`}
            d={d}
            stroke={INK}
            strokeOpacity={routeOp * o.op}
            strokeWidth={px(2)}
            strokeDasharray={`${o.p * 0.58} ${o.p * 0.42}`}
            strokeDashoffset={-offset}
          />
        ))}
      </g>
    ) : null;

  // -- Cortés's road: orange, head-led -----------------------------------------
  const head = roadHeadAt(g);
  const roadOn = g >= T.road[0] && head > ROAD_S0 + 0.05;
  const roadD = roadOn ? CORTES_ROAD.partialD(ROAD_S0, head) : "";
  const RW = 3.6 * Math.pow(k, 0.1);
  const headPt = CORTES_ROAD.pointAt(head);
  const headGlow = smoothstep(roadSpeedAt(g) / 0.6) * (roadOn ? 1 : 0);
  // the tail's travelling highlight
  const shimmer: React.ReactNode[] = [];
  if (g >= T.shimmer && roadD) {
    const fadeIn = smoothstep((g - T.shimmer) / 10);
    const L = head - ROAD_S0;
    const PERIOD = 30;
    const u = ((((g - T.shimmer) / PERIOD) % 1) + 1) % 1;
    const s = L * smoothstep(u);
    const op = Math.sin(Math.PI * u) * 0.55 * fadeIn;
    [
      [70, 0.3],
      [36, 0.45],
      [14, 0.7],
    ].forEach(([len, o]) => {
      if (op < 0.01) return;
      shimmer.push(
        <path
          key={`sh-${len}`}
          d={roadD}
          fill="none"
          stroke="#FFE3A6"
          strokeOpacity={o * op}
          strokeWidth={px(RW - 0.8)}
          strokeLinecap="round"
          strokeDasharray={`${px(len)} ${L * 3}`}
          strokeDashoffset={-(s - px(len) / 2)}
        />,
      );
    });
  }

  // -- the crowd, the swords ---------------------------------------------------
  const dots = dotsAt(g, k);
  const swSl = labelSlide(g, T.swords);
  const swSize = Math.max(40, 110 * (k / SWORDS_K));
  const [swX, swy0] = swordsAnchorAt(g);
  const swY = swy0 - px(14 + swSize / 2 - swSl.dy);

  // -- the ship ---------------------------------------------------------------
  const ship = shipAt(g);

  // -- sites -------------------------------------------------------------------
  const santiagoOp = smoothstep((g - T.velazquez) / 8);
  const velOp = 1 - smoothstep((g - 138) / 14); // it fades as the ship sails out under it
  const tenochOp = smoothstep((g - T.tenochIn[0]) / (T.tenochIn[1] - T.tenochIn[0]));
  const holdOp = smoothstep((g - T.hold[0]) / (T.hold[1] - T.hold[0]));
  // CORTÉS centred below the orange body (its cap line 20 px under it, and never
  // up on the road's Cholula bend or the cream body); it eases to the context
  // rung as the road gets under way
  const ob = orangeBodyAt(g);
  const cortesSize = 38;
  const cortesBase = cortesCapY(g, k) + px(CAP * cortesSize);
  const cortesOp = INK_FULL + (INK_CONTEXT - INK_FULL) * smoothstep((g - T.cortesRecede[0]) / (T.cortesRecede[1] - T.cortesRecede[0]));

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        <defs>
          <radialGradient id="roadGlow">
            <stop offset="0%" stopColor={ACCENT} stopOpacity={0.75} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
          </radialGradient>
        </defs>
        {/* Narváez's route, then the land leg into the crowd */}
        {dashed(routeD, 0, "route")}
        {dashed(legD, NARVAEZ_VOYAGE.len, "leg")}

        {/* Cortés's road, under the crowd it leaves */}
        {roadD ? (
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={roadD} stroke={DARK} strokeOpacity={0.6} strokeWidth={px(RW + 3.2)} />
            <path d={roadD} stroke={ACCENT} strokeWidth={px(RW)} />
          </g>
        ) : null}
        {shimmer}
        {headGlow > 0.01 && inView(headPt[0], headPt[1]) ? (
          <circle cx={headPt[0]} cy={headPt[1]} r={px(15)} fill="url(#roadGlow)" opacity={headGlow} />
        ) : null}

        {/* Tenochtitlan, then Cortés's hold on it */}
        <CityDot x={SITES.tenochtitlan.x} y={SITES.tenochtitlan.y} cam={cam} opacity={tenochOp} />
        <HoldRing x={SITES.tenochtitlan.x} y={SITES.tenochtitlan.y} cam={cam} opacity={holdOp} />

        {/* the Spanish at Cempoala */}
        <CrowdDots dots={dots} cam={cam} />

        {/* Velázquez's Santiago */}
        <CityDot x={SITES.santiago.x} y={SITES.santiago.y} cam={cam} opacity={santiagoOp} />

        {/* the battle-site marker */}
        <Swords x={swX} y={swY} cam={cam} size={swSize} opacity={swSl.op} />
      </WorldSvg>

      {/* VELÁZQUEZ names the Santiago dot: end-aligned 16 px left of it, on its line */}
      <MapLabel
        text={labels.velazquez}
        x={SITES.santiago.x}
        y={SITES.santiago.y}
        cam={cam}
        frame={g}
        f0={T.velazquez}
        anchor="end"
        dx={-16}
        dy={7}
        opacity={INK_FULL * velOp}
      />

      {/* the expedition, over the name it sails out from under */}
      {ship.op > 0.002 && inView(ship.x, ship.y) ? (
        <WorldSvg cam={cam}>
          <Carrack x={ship.x} y={ship.y} cam={cam} frame={g} size={ship.size} seed={1520} opacity={ship.op} pitch={ship.pitch} wake={ship.wake} rock={SHIP_ROCK} />
        </WorldSvg>
      ) : null}

      <MapLabel
        text={labels.cortes}
        x={ob.cx}
        y={cortesBase}
        cam={cam}
        frame={g}
        f0={T.cortes}
        anchor="middle"
        size={cortesSize}
        spacing={0.22}
        opacity={cortesOp}
      />
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

/** the global frame shown at frame f of a composition starting at startFrame (for checks) */
export const globalFrame = (f: number, startFrame: number) => f + startFrame;
/** the screen point of a world point at global frame g (for checks) */
export const screenAt = (p: [number, number], g: number) => screenOf(p, swayCam(camAt(g), g));

export default CortesCut1;
