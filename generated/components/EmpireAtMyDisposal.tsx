import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CORTES_ROAD,
  CityDot,
  Coin,
  CrowdDots,
  DARK,
  EMPIRE_BORDER_D,
  EMPIRE_D,
  HoldRing,
  INK,
  INK_CONTEXT,
  MapStack,
  PaperTop,
  SEA,
  SITES,
  Swords,
  WorldSvg,
  dotRadius,
  smoothstep,
  swayCam,
} from "./cortesShared";
import {
  BORDER_FEATHER,
  CAM_TRACK,
  DURATION,
  EMPIRE_ORIGIN,
  FPS,
  HATCH_FEATHER,
  ROAD_LEN,
  ROAD_S0,
  SWORDS_ANCHOR,
  borderR,
  coinsAt,
  dotsAt,
  hatchR,
} from "./empireMotion";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// Dwarkesh Patel with Si Sheppard on Cortes, clip
// "Sheppard_Cortes_recruits_the_arrest_army" (59 s edit), cut 3. Context (not
// rendered): Cortes has just beaten Narvaez at Cempoala (night of 27/28 May
// 1520) and tells Narvaez's men "my friends, why are we fighting? We have ..."
// This cut: "... the Empire at my disposal. Join with me and we can share in
// the riches. So he wins over the vast majority of this new force. It becomes
// effectively reinforcements."
//
// TIMELINE. The SRT (media-to-srt output ..._c4_p0.5.srt) is on the EDIT
// timeline (the clip folder's .mov is a longer raw cut; never measured
// against). In-point 50.72 s = f0; frame = round((t - 50.72) * 24):
//   the f0 · Empire f5 · at my f13 · disposal f19 · join f37 · with f44 ·
//   me and f48 · we can f55 · share f60 · in the f65 · riches f69 · so he f74 ·
//   wins f84 · over f90 · the f97 · vast f103 · majority f110 · of f120 ·
//   this f125 · new f130 · force f136 · it f144 · becomes f146 ·
//   effectively f151 · reinforcements f159 (ends 58.119 s = f178).
// DURATION: "the" 50.72 -> "reinforcements" ends 58.119: round(7.40 * 24) =
// 178, + the 16-frame house tail = 194 frames.
//
// DWARKESH MAP STYLE on THE CORTES WORLD (cortesShared.tsx; the static map is
// the shared LOD pyramid): sea #1B2226, land #3F3428 + #6A5838 rim, cream ink
// #E9DDBF, engraved water-lines, graticule, baked mottle + grain, vignette.
// Opaque 1080x1920, 24 fps. No labels (no name is spoken), no numbers.
//
// COLOUR RULE: house orange (#FFB000 / #D98A0C) = CORTES'S SIDE ONLY: his men,
// his road, what he holds (the HoldRing, then the empire's hatch), his gold.
// Everything else (Narvaez's men, the empire's border before it is his, the
// swords) is cream #E9DDBF at two rungs: full = in play (the cream dots),
// ~0.5 = context (the dashed border, the swords). Nothing else is coloured.
//
// STATE AT f0 (cut 1's world, the fight over): the Cempoala crowds at
// CREAM_REST (90 cream = Narvaez's men) and ORANGE_REST (27 orange =
// Cortes's), standing apart across the clear channel; the swords over the
// channel at the context rung (cut 1's size law: 110 px at k 11.3,
// world-anchored, never under 40 px); the orange road standing from the orange
// group to Tenochtitlan as cut 1 drew it (ROAD_S0 recomputed as spanishMotion
// does; cut 1's width 3.6 k^0.1 px over a dark casing 3.2 px wider); the
// HoldRing on Tenochtitlan's city dot.
//
// THE GESTURES, each with its word (frames at 24 fps). One motion: the camera
// rises from the beaten camp to the whole empire turning Cortes's colour,
// follows the gold down his road to the coast, watches it turn the other army
// orange, then follows the doubled army back up the road. In this world
// (0.383 world px per km; the two bodies span ~55 world px) the brief's zooms
// for the crowd (3.5 -> 2.4) would leave the conversion ~190 px wide, so its
// ratios are kept on readable framings: 6.0 -> 2.3 -> 7.3/8.3 -> 5.6.
//   1. "the Empire at my disposal" f0-34. Open on the two bodies at k 6.0,
//      centred on y 835, the coast and the sea at the right. Glide 1 (f-8..44,
//      eased): one pull-back west onto the whole 1519 empire as a SHAPE: the
//      widest moment, k 2.30 at f38, its box centred on y 835 and every edge
//      in frame from ~f30 to ~f46 (x ~175..875, the Pacific edge at y ~1115;
//      the Soconusco exclave off frame, its fronts held until it is).
//      "Empire" f5: the empire's border wipes in as one radial front out of
//      Tenochtitlan (f5-21, a soft edge of 12 world px): fine dashed cream at
//      0.5, world-anchored octave dashes (cut 1's 11 px period, 58 % on).
//      "at my disposal" f13-30: the gained-territory symbol (orange hatch +
//      deep fill, house values, clipped to land; Tlaxcala, Teotitlan,
//      Metztitlan, Yopitzinco and the lake stay bare) spreads out of the
//      HoldRing on a second eased radial front (f12-32) that turns the dashed
//      border orange as it passes; complete by f32, inside the visible outline.
//      As the camera closes on the men (k 3.0 -> 5.5) the hatch and its dashed
//      orange edges recede together to 0.19, so the background goes calm and
//      the dots carry the frame.
//   2. "Join with me and we can share in the riches" f37-74. Gold coins (the
//      house Coin; the Railways size law, never under 1.5 dot diameters)
//      stream out of Tenochtitlan down the road: one file, 8 world px apart,
//      growing out of the city, accelerating (f37-53) to a cruise, each with a
//      hair of sway on its own phase. Glide 2 (f34..90): one smooth push-in
//      east with the stream's head, the head held near frame centre (k 2.3 ->
//      ~5.3 on "riches" f69 -> 7.3 keyed at f82); the head reaches the open
//      channel, the edge of the cream body, on "riches" f69.
//   3. "So he wins over the vast majority of this new force" f74-140. Each coin
//      leaves the road there and eases onto its cluster of four cream dots (21
//      clusters, converted in order of distance from that entry point, so the
//      conversion travels inland -> sea), where it dissolves (7 f); its four
//      men turn orange in one eased crossfade (10 f, cut 1's) and walk over to
//      Cortes's side (a relaxation crowd: even spacing, a clear gap between
//      the colours, the coast kept). The stream flows until the last coin lands
//      (f124); all 84 are orange by "force" f136. The last six cream (Narvaez
//      and his loyal officers) are pressed into a knot at the seaward edge. The
//      creep (f60..164, k -> 8.3 keyed at f136) moves in on it.
//   4. "It becomes effectively reinforcements" f144-193. The converted and
//      Cortes's 27 have closed into one orange army; from "it" f144 it turns
//      onto the road and marches inland as a column: head-led, four files,
//      ranks 3.25 world px apart, odd files half a rank back, a hair of jitter
//      per man; each slot, as it starts to fill, takes the waiting man nearest
//      to it (the waiting army is held behind the formation line, so no path
//      crosses the queue). Glide 3 (f132..234): the camera pulls back and
//      follows inland (k 8.3 -> ~5.6 on the last frame) with the column at the
//      centre; the head is still ~20 world px short of Tenochtitlan, still
//      marching, and the camera still moving, on the last frame.
// Nothing else: no labels, no numbers, no tribute arrows.
//
// SOURCES. scripts/cortes-geo.json (the director's sites, Cortes's road
// Cempoala - Xalapa - ... - Tlaxcala - Cholula - Paso de Cortes - Iztapalapa -
// Tenochtitlan, and the facts: Narvaez ~900 men, Cortes 266, 1 dot = 10 men,
// most of Narvaez's men joined him, back in Tenochtitlan 24 June 1520). The
// 1519 empire: "Aztec Empire 1519 map-fr.svg" (Wikimedia Commons, Keepscases &
// Semhur after Yavidaxiu; from Atlas del Mexico prehispanico, Arqueologia
// Mexicana 2000), georeferenced in cortes-geo.json (outer ring, the Tlaxcala
// and Teotitlan holes, the Soconusco exclave), clipped to Natural Earth 10m
// land (world-atlas) by scripts/build-cortes-map.mjs.
// ---------------------------------------------------------------------------

export const schema = z.object({
  vignette: z.number(),
  hatchOpacity: z.number(), // the gained territory at the empire wide
  hatchCloseOpacity: z.number(), // ... receded under the crowd at the close framings
  borderOpacity: z.number(), // the cream border's rung (context)
  swordsOpacity: z.number(), // the swords' rung (context)
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  vignette: 0.55,
  hatchOpacity: 1,
  hatchCloseOpacity: 0.19,
  borderOpacity: INK_CONTEXT,
  swordsOpacity: INK_CONTEXT,
});

// ---------------------------------------------------------------------------
const HATCH_SCREEN = 10; // screen px between hatch lines (octave-stable, world-anchored)
const DASH = 11; // screen px dash period at the bottom of an octave (cut 1's, 58 % on)
/** world-anchored dashes that keep ~DASH..2 DASH px on screen: two octaves crossfaded */
const octaveDashes = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = DASH / Math.pow(2, o);
  return [
    { d: a, op: 1 - t },
    { d: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
};
const SWORDS_K = 11.3; // cut 1's: the swords are 110 px at k 11.3, world-anchored, never under 40 px
// the Railways coin law, but never under 1.5 dot diameters, so in the close
// framings a coin still reads as a coin among the men
const ROAD_D = CORTES_ROAD.partialD(ROAD_S0, ROAD_LEN);
const coinScreen = (k: number) => Math.max(16 * Math.pow(k / 2.4, 0.25), 1.5 * 2 * dotRadius(k) * k);

const EmpireAtMyDisposal: React.FC<Props> = ({ vignette, hatchOpacity, hatchCloseOpacity, borderOpacity, swordsOpacity }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(DURATION, Math.max(0, Math.round(frame)));
  const cam = swayCam(CAM_TRACK[fi], frame);
  const k = cam.k;
  const px = (v: number) => v / k;

  // -- the empire: two radial fronts out of Tenochtitlan ------------------------
  const [ox, oy] = EMPIRE_ORIGIN;
  const rB = borderR(frame);
  const rH = hatchR(frame);
  // the territory recedes as the camera closes on the men, so they carry the frame
  const close = smoothstep((k - 3.0) / (5.5 - 3.0));
  const hatchOp = hatchOpacity * (1 - (1 - hatchCloseOpacity) * close);
  // the octave-stable hatch (koreaShared FrontHatch): period P world px holds
  // lines at 0 and P (full) and P/2 (fading in across the octave)
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const ht = L2 - o;
  const P = (2 * HATCH_SCREEN) / Math.pow(2, o);
  const hsw = px(2.1);
  const dashes = octaveDashes(k);
  const borderW = px(1.7);
  const MASK = { x: -260, y: 560, w: 760, h: 700 };

  // -- the crowd, the coins ------------------------------------------------------
  const dots = dotsAt(frame, k);
  const coins = coinsAt(frame);
  const cs = coinScreen(k);
  const swordsSize = Math.max(40, 110 * (k / SWORDS_K));
  const RW = 3.6 * Math.pow(k, 0.1); // cut 1's road width (screen px)

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        <defs>
          <radialGradient id="emBorderFront" gradientUnits="userSpaceOnUse" cx={ox} cy={oy} r={Math.max(0.01, rB + BORDER_FEATHER)}>
            <stop offset={Math.max(0, rB / (rB + BORDER_FEATHER))} stopColor="#fff" stopOpacity={1} />
            <stop offset={1} stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="emHatchFront" gradientUnits="userSpaceOnUse" cx={ox} cy={oy} r={Math.max(0.01, rH + HATCH_FEATHER)}>
            <stop offset={Math.max(0, rH / (rH + HATCH_FEATHER))} stopColor="#fff" stopOpacity={1} />
            <stop offset={1} stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="emHatchHole" gradientUnits="userSpaceOnUse" cx={ox} cy={oy} r={Math.max(0.01, rH + HATCH_FEATHER)}>
            <stop offset={Math.max(0, rH / (rH + HATCH_FEATHER))} stopColor="#000" stopOpacity={1} />
            <stop offset={1} stopColor="#000" stopOpacity={0} />
          </radialGradient>
          {/* the cream border shows where the border front has passed and the hatch has not */}
          <mask id="emBorderMask" maskUnits="userSpaceOnUse" x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h}>
            <rect x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h} fill="url(#emBorderFront)" />
            {rH > 0 ? <rect x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h} fill="url(#emHatchHole)" /> : null}
          </mask>
          <mask id="emHatchMask" maskUnits="userSpaceOnUse" x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h}>
            <rect x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h} fill="url(#emHatchFront)" />
          </mask>
          <pattern id="emHatchPat" patternUnits="userSpaceOnUse" width={P} height={P} patternTransform="rotate(45)">
            <line x1={0} y1={-1} x2={0} y2={P + 1} stroke={ACCENT} strokeWidth={hsw} />
            <line x1={P / 2} y1={-1} x2={P / 2} y2={P + 1} stroke={ACCENT} strokeWidth={hsw} strokeOpacity={ht} />
            <line x1={P} y1={-1} x2={P} y2={P + 1} stroke={ACCENT} strokeWidth={hsw} />
          </pattern>
        </defs>

        {/* THE EMPIRE: the cream border (context), then what is his */}
        {rB > 0 ? (
          <g mask="url(#emBorderMask)" fill="none" strokeLinecap="butt">
            {dashes.map((d) => (
              <path
                key={`bc-${d.d}`}
                d={EMPIRE_BORDER_D}
                stroke={INK}
                strokeOpacity={borderOpacity * d.op}
                strokeWidth={borderW}
                strokeDasharray={`${d.d * 0.58} ${d.d * 0.42}`}
              />
            ))}
          </g>
        ) : null}
        {rH > 0 ? (
          <g mask="url(#emHatchMask)">
            <path d={EMPIRE_D} fillRule="evenodd" fill={ACCENT_DEEP} fillOpacity={0.2 * hatchOp} />
            <path d={EMPIRE_D} fillRule="evenodd" fill="url(#emHatchPat)" opacity={0.7 * hatchOp} />
            <g fill="none" strokeLinecap="butt">
              {dashes.map((d) => (
                <path
                  key={`bo-${d.d}`}
                  d={EMPIRE_BORDER_D}
                  stroke={ACCENT}
                  strokeOpacity={hatchOp * d.op}
                  strokeWidth={px(2.2)}
                  strokeDasharray={`${d.d * 0.58} ${d.d * 0.42}`}
                />
              ))}
            </g>
          </g>
        ) : null}

        {/* CORTES'S ROAD, as cut 1 left it (its width law and casing) */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={ROAD_D} stroke={DARK} strokeOpacity={0.6} strokeWidth={px(RW + 3.2)} />
          <path d={ROAD_D} stroke={ACCENT} strokeWidth={px(RW)} />
        </g>

        {/* what he holds */}
        <CityDot x={SITES.tenochtitlan.x} y={SITES.tenochtitlan.y} cam={cam} />
        <HoldRing x={SITES.tenochtitlan.x} y={SITES.tenochtitlan.y} cam={cam} />

        {/* the fight that is over */}
        <Swords x={SWORDS_ANCHOR[0]} y={SWORDS_ANCHOR[1] - px(14 + swordsSize / 2)} cam={cam} size={swordsSize} opacity={swordsOpacity} />

        {/* the men */}
        <CrowdDots dots={dots} cam={cam} />

        {/* the gold */}
        {coins.map((c) => (
          // out of the city it grows from nothing; into its cluster it
          // dissolves (shrinks to ~40 % while it fades), never a last speck
          <Coin
            key={`c-${c.i}`}
            x={c.x}
            y={c.y}
            cam={cam}
            size={cs * (c.absorb ? 0.4 + 0.6 * c.scale : c.scale)}
            opacity={c.absorb ? smoothstep(c.scale * 1.35) : Math.min(1, c.scale * 1.6)}
          />
        ))}
      </WorldSvg>
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default EmpireAtMyDisposal;
