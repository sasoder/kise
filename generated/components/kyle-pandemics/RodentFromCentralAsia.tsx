// ---------------------------------------------------------------------------
// RodentFromCentralAsia (kyle-pandemics, cut 1). Dwarkesh map style (styles/dwarkesh-map.md) drawn in the 3D depth
// manner of the Kyle London clip (DEPTH.md: one camera, a ground plane, volumes lit from the upper left, contact and
// form shadows, atmospheric depth, parallax). Opaque 1080x1920, 29.97 fps, 207 frames.
// RENDER WITH --gl=angle (the ground is WebGL2): every render command below adds it.
//
// CHECK LINE: "a disease came out of a burrowing rodent on the Central Asian steppe, swept west across the land, and
// when it reached Europe half the people fell."
//
// THE LINE: "(In the case of the plague,) you would never be like, I think that every now and then a rodent disease
// from Central Asia is going to wipe out half of the continent."
// WORD -> FRAME (f0 = 1.034 s): you -5 · would -1 · never 7 · be 19 · like 25 · I 34 · think 37 · that 46 · every 53 ·
//   now 64 · and 71 · then 77 · a 85 · RODENT 94 · DISEASE 106 · from 113 · CENTRAL 123 · ASIA 132 · is 141 ·
//   going 149 · to 150 · WIPE 155 · OUT 163 · HALF 170 · of 178 · the 180 · CONTINENT 185 (slot ends 207).
// DURATION: the slot 1.034 -> 7.941 s = 6.907 s x 29.97 = 207 frames (f0..f206).
//
// THE MOTION: one continuous crane from a burrow to a continent, the camera always looking north (rodentCamera.ts).
// f0-84 at the grey marmot's eye level on the steppe (grizzled cream-umber fur, a broad flat head, small low ears,
// bead eyes, two cream incisors, a dark-tipped tail; its burrow loose earth: an irregular heap, an apron of thrown-out
// soil with clods and pebbles): a visible push-in that arcs round it from its right (parallax
// on the tufts and the mound) down to the burrow mouth, large and near the frame's centre by f84. The marmot lives
// (headAt): it sniffs, turns its head to the camera (f22-36), blinks, nods, turns away west again (f56-70), sniffs and
// settles; it sways and breathes, its tail flicks. THE SEEP (CAUSE: orange wells up in the mouth f82-86, brims over the
// lower lip as ONE broad wet tongue down the apron from f85, parting near the bottom into lobes that reach the ground
// on f91 / f93 / f95; FIRST REACTION: each opens a pool on the ground on its frame, the pools spread and merge with an
// organic edge) - "rodent
// DISEASE". f93-125 the crane: a log-space rise and pitch-down; the steppe crossfades by altitude into the baked map
// of Eurasia laid as the ground; the stain spreads round the burrow (Issyk-Kul, Balkhash). CENTRAL ASIA (Fell SC, lying
// on the ground north of the burrow) slides north f112 -> lands f122 ("CENTRAL" 123); the marmot shrinks to a cream
// mark at the origin. f125-170 the camera pans west with the front - an organic land front (a baked travel-time
// field: fast along the steppe corridor, the coasts and the big rivers, slow in the open sea, petering out raggedly
// into North Africa / Arabia and the far north; monotone, clipped to land, hatch along the parallels so the pan
// slides along it) - seen from a high pitch on the approach (the far figures stand apart), landing as a HIGH OBLIQUE
// (57 deg) over the Mediterranean looking north: Europe fills the height (Scandinavia y ~300-560, the near coasts
// y ~900-1060), no horizon or plate edge in frame. f141-183 as the front reaches each of
// Europe's 52 figures (nearest ~130-170 px tall), exactly every second one falls (topples west about its feet, drains
// to DEAD, lies on the ground; 26 fall); the last lands ~f183 ("CONTINENT" 185). f170-206 settled, a slow creep.
// Orange = THE DISEASE only (the seep, the stain, the front, the wash); everything else cream / umber / DEAD.
//
// DEPTH: one pinhole (F 1300 px) aimed at a target from a distance D (62 -> 2550 world px), pitch 5 -> 63 -> 57 deg,
// yawed to the local LCC meridian (plus the opening arc's offset, 30 -> 0 deg by f102). Ground Y = 0 (the map's
// world px), a WebGL2 ray cast per pixel (rodentGround.tsx); every overlay (marmot, mound, tufts, label, figures) is
// projected through the same camera, painter's order by depth.
// One light from the upper left; contact shadows on the ground; atmospheric haze toward the page by distance / D.
//
// SOURCES: the origin, 75.5 E 42.7 N (the Chuy valley at the western end of Lake Issyk-Kul, Kyrgyzstan): the Black
//   Death's ancestral strain in the Kara-Djigach and Burana cemeteries, 1338-39 (Spyrou et al., "The source of the
//   Black Death in fourteenth-century central Eurasia", Nature 606, 718-724, 2022). The grey marmot (Marmota
//   baibacina) stands for the reservoir: the Tian Shan plague foci are kept by marmots and other burrowing rodents
//   (Spyrou et al. 2022 on the region's rodent reservoirs; the plague-focus literature).
//   The westward sweep: Caffa 1346, Constantinople and Messina 1347, France / England / Iberia 1348, Scandinavia
//   1349 (the conventional chronology); Iceland was spared in 1347-51 (left out of the wash). "Half of the
//   continent" is the speaker's figure: drawn as exactly every second figure falling, no number on screen.
//   Map: Natural Earth 10m through scripts/maps/configs/kyle-pandemics.mjs (LCC 38/56 N, centre 40 E; period water
//   Issyk-Kul, Balkhash, Zaysan, the pre-1960 Aral, Ladoga, Onega, Vanern, Malaren, Saimaa, Paijanne; no borders).
//   The front's field: scripts/clips/kyle-pandemics/bake-rodent-front.mjs (public/kyle-pandemics/rodent/front.f32,
//   rodentFrontData.ts); the burrow's geometry: rodentPlace.ts. River courses there are approximate and only steer it.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { z } from "zod";
import { PaperTop } from "../kits/maps/incaShared";
import { RodentGround } from "./rodentGround";
import { RodentFigures } from "./rodentFigures";
import { SteppeThings } from "./rodentMarmot";
import { DURATION, FPS, H, W, camAt, local, toScreen, type Cam } from "./rodentCamera";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });

const LAND = "#3F3428";
const INK = "#E9DDBF";
const DARK = "#17120D";

// ---------------------------------------------------------------------------
// CENTRAL ASIA: lying on the ground round the origin (an affine of the ground at its anchor), sliding north while it
// fades in; lands f122, on "CENTRAL" (f123)
// ---------------------------------------------------------------------------
export const LABEL = { in: 112, land: 122, r: -4, a: 150, size: 100, widthAtLand: 560, text: "CENTRAL ASIA" };
const TEXT_W = 0.84 * LABEL.size * LABEL.text.length; // the text's width in its own units (Fell SC caps + tracking), approx.
const groundJ = (cam: Cam, r: number, a: number) => {
  const [x, y] = local(r, a);
  const s0 = toScreen(cam, x, 0, y);
  const e = 0.5;
  const [xr, yr] = local(r + e, a);
  const [xa, ya] = local(r, a + e);
  const sr = toScreen(cam, xr, 0, yr);
  const sa = toScreen(cam, xa, 0, ya);
  return { p: [s0.x, s0.y], dr: [(sr.x - s0.x) / e, (sr.y - s0.y) / e], da: [(sa.x - s0.x) / e, (sa.y - s0.y) / e] };
};
/** ground units per text unit: the label is LABEL.widthAtLand px wide on screen when it lands */
const LABEL_K = (() => {
  const J = groundJ(camAt(LABEL.land), LABEL.r, LABEL.a);
  return LABEL.widthAtLand / (TEXT_W * Math.hypot(J.dr[0], J.dr[1]));
})();
const GroundLabel: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  if (frame < LABEL.in) return null;
  const u = interpolate(frame, [LABEL.in, LABEL.land], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const op = interpolate(frame, [LABEL.in, LABEL.in + 9], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const J0 = groundJ(cam, LABEL.r, LABEL.a);
  // the slide: 26 screen px up the ground toward the north
  const back = 26 / Math.max(1e-3, Math.hypot(J0.da[0], J0.da[1]));
  const J = groundJ(cam, LABEL.r, LABEL.a - back * (1 - u));
  const k = LABEL_K;
  const m = [J.dr[0] * k, J.dr[1] * k, -J.da[0] * k, -J.da[1] * k, J.p[0], J.p[1]];
  if (m.some((v) => !Number.isFinite(v))) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      <g transform={`matrix(${m.map((v) => v.toFixed(5)).join(",")})`} opacity={op}>
        <text
          x={0}
          y={LABEL.size * 0.36}
          textAnchor="middle"
          fill={INK}
          stroke={DARK}
          strokeOpacity={0.85}
          strokeWidth={LABEL.size * 0.16}
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ fontFamily: fellSC, fontSize: LABEL.size, letterSpacing: `${0.16 * LABEL.size}px` }}
        >
          {LABEL.text}
        </text>
      </g>
    </svg>
  );
};

const RodentFromCentralAsia: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <AbsoluteFill style={{ backgroundColor: LAND }}>
      <RodentGround cam={cam} frame={frame} />
      <GroundLabel cam={cam} frame={frame} />
      <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
        <SteppeThings cam={cam} frame={frame} />
      </svg>
      <RodentFigures cam={cam} frame={frame} />
      <PaperTop vignette={0.5} />
    </AbsoluteFill>
  );
};

export default RodentFromCentralAsia;
