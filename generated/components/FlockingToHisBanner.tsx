import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CanvasDots } from "./incaShared";
import {
  ACCENT,
  CLIP_G0,
  DURATIONS,
  INK,
  INK_CONTEXT,
  INK_FULL,
  LABEL_TRAVEL,
  MapLabel,
  PaperTop,
  SEA,
  SITES_T,
  TlaxcalaClaims,
  WorldSvg,
  fortressSize,
  makeTrack,
  smoothstep,
  swayCam,
  type Cam,
  type P2,
} from "./tlaxShared";
import { LABEL as A_LABEL } from "./CarvedOutOfTheAztecs";
import { C_END, ProvinceMosaic } from "./SubordinatedPeoples";
import {
  Banner,
  HEART,
  HostMapStack,
  STREAMS,
  dotCasing,
  dotScreenR,
  hostAt,
  makeMoveCamera,
  screenPt,
  type Creep,
  type Framing,
  type Move,
} from "./tlaxHost";

// ---------------------------------------------------------------------------
// FlockingToHisBanner. Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Tlaxcalans_thought_they_used_Cortes", cut D, on the Tlaxcala world
// (tlaxShared) with the allied host (tlaxHost). The line: "So as Cortes builds
// up for the final campaign against Tenochtitlan, he has indigenous people
// flocking to his banner from all over Mesoamerica."
//
// TIMELINE (the SRT is the 71.9 s edit timeline): in-point 47.579 s = f0;
// f = round((t - 47.579) * 24): so as f0 · Cortes f16 · builds f29 · up for f37 ·
// the f60 · final f65 · campaign f72 · against f83 · Tenoch- f99 · -titlan f113 ·
// he has f123 · indigenous f145 · people f163 · flocking f171 · to his f181 ·
// banner f187 · from f193 · all f199 · over f210 · Mesoamerica f217.
// DURATION: "so as" 47.579 -> "Mesoamerica" ends 57.280: round(9.701 * 24) =
// 233, + the 16-frame house tail = 249 (DURATIONS.D). Clip clock G = 438 + f.
// JOIN: f0 = C f209 pixel for pixel (C_END.cam, C's ProvinceMosaic, C_END.g).
//
// DWARKESH MAP STYLE, opaque 1080x1920, 24 fps. Orange = the Aztecs' enemies
// only (their land, their warriors); the empire and the Spaniards are cream.
// Labels: CORTES (f16) and TENOCHTITLAN (f99) only, IM Fell English SC.
//
// THE GESTURES, each with its word (frames at 24 fps):
//   1. "So as Cortes builds up" f0-40: THE DIVE, one log-zoom from C's wide
//      (k 3.24) onto the banner (k 80, landing f40; ease in and out), anchored on
//      its foot, which glides to (540, 835). The mosaic recedes with the dive
//      (f1 -> ~f22, driven by the zoom) to its context rung (one group at 0.32),
//      cut A's fortress claim held at ~0.6: from here the orange is the people.
//   2. "Cortes" f16: the banner rises at the host's heart (f8-24: it swings up
//      about its foot, eased, no overshoot) and CORTES slides up under it (from
//      f8; full rung until the first heads arrive, then the context rung,
//      f171-183; it leaves with TENOCHTITLAN at the pull-back, f190-204).
//   3. "builds up" f1-61: the 90 Spaniards march out of Tlaxcala (fading in at
//      the city from f1) along P's Tlaxcala - Texcoco road as a short column
//      (4 files), brisk over the sierra, walking as they near the banner, and
//      each eases into his slot round it (farthest first): all in by f61, a
//      cream body ~120 px across, its dots 4 px with daylight between them.
//   4. "for the final campaign against Tenoch-" f46-92: one glide west and out
//      (k 80 -> 30, landing f92) until Tenochtitlan (A's fortress) and the banner
//      share the frame, their centre of mass on (540, 835); TENOCHTITLAN slides
//      up above the fortress from f91 (A's label size, spacing and offset rule).
//   5. "he has indigenous people flocking to his banner" f92-193: the held
//      breath, a slow push toward the banner (k 30 -> ~36). The columns come:
//      the Acolhua step out of their land to the north (in frame) on f128,
//      Tlaxcala's head crosses the frame's right edge on f141, then the others
//      from the south; each a compact marching column of the host's own dots
//      (~32-47 px wide, feathered, gently pulsing), at a steady pace. The first
//      heads reach the Spaniards on "flocking" (f172): each column runs at its
//      pace into the sector of the host facing its road and fills it from the
//      inside out, so the body grows round the Spaniards.
//   6. "from all over Mesoamerica" f172-212: the pull-back to every source (k ->
//      6.3, landing f212, 5 f before "Mesoamerica"), the sources' box centred on
//      the content point; CORTES and TENOCHTITLAN leave as it gets under way
//      (the house exit, f190-204). In the wide every column is its own orange
//      caterpillar on its own road, all converging on the lake: Tlaxcala's tail
//      and, behind it, the Totonacs from the coast (east), the Acolhua's tail
//      (north), Cuauhnahuac, Toluca and Malinalco (south and west) still on the
//      road. Tail f212-248: the wide drifts on, the columns keep marching, the
//      body swells (12,562 of the 17,910 allies in place on f248; the rest
//      arrive in E).
// Nothing else.
//
// SOURCES (SP/FACTS.md, H; tlaxHost's header): the 900 Spaniards (Cortes's
// review at Texcoco, Third Letter, 28 Apr 1521: 86 horse, 118 crossbowmen and
// arquebusiers, 700-odd foot), the allies (Cortes's 50,000+ Tlaxcalans and
// 75,000+ in the three siege divisions; ~200,000 upper estimates), drawn 1 : 200
// at 1 dot = 10 men; Cortes's base at Texcoco from 31 Dec 1520, reached from
// Tlaxcala over the sierra; the polities, their weights and land routes from
// P's tlaxProvinces (POLITIES, weight > 0). The host's footprint and the
// banner's place (10 km east of Texcoco) are a map-symbol convention.
//
// CHECKS (SP/h): camScan probe grid max 121 px/f (f17, the dive's corners),
// max |dv| 8.3 px/f^2 (the dive), no spikes; the pull-back's corners <= 6.6
// px/f^2; the heart <= 18.3 px/f. Every visible dot <= 27 px/f of its own
// motion (cap 45); no dot ever on the lake. Map sharp at every hold (the host level 1.13 texels/px at
// k 80; valley3 1.42 at k 30; close 1.21 at k 6.3); holds outside every band.
// Join C f209 -> D f0: 0 px (SP/h/join).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = DURATIONS.D; // 249
export const LAST = DURATION - 1;
/** the clip clock: G = G0 + f (D f0 = C f209 = G 438) */
export const G0 = CLIP_G0.D;
if (G0 !== C_END.g) throw new Error("D f0's clip clock must be C_END.g");

/** word onsets, f = round((t - 47.579) * 24) (SP/frames.txt) */
export const W = {
  soAs: 0,
  cortes: 16,
  builds: 29,
  upFor: 37,
  the: 60,
  final: 65,
  campaign: 72,
  against: 83,
  tenoch: 99,
  titlan: 113,
  heHas: 123,
  indigenous: 145,
  people: 163,
  flocking: 171,
  toHis: 181,
  banner: 187,
  from: 193,
  all: 199,
  over: 210,
  mesoamerica: 217,
};

const TENOCH: P2 = [SITES_T.tenochtitlan.x, SITES_T.tenochtitlan.y];

// ---------------------------------------------------------------------------
// THE CAMERA (tlaxHost makeMoveCamera: anchored on the banner's foot; moves and
// creeps as cosine-tapered velocity bumps; f0 = C_END.cam exactly)
// ---------------------------------------------------------------------------
const C_END_CAM: Cam = C_END.cam;
/** the close framing: the banner and the Spaniards' body on the content point
 *  (dots 4 px, the body ~120 px across, the banner ~120 px tall) */
export const K_CLOSE = 80;
/** Tenochtitlan and the banner, their centre of mass on the content point */
const K_PAIR = 30;
const COM: P2 = [(TENOCH[0] + HEART[0]) / 2, (TENOCH[1] + HEART[1]) / 2];
const PAIR: Framing = { k: K_PAIR, s: [540 + (HEART[0] - COM[0]) * K_PAIR, 835 + (HEART[1] - COM[1]) * K_PAIR] };
/** the wide: every stream's source in frame, their box centred on the content point */
export const SOURCE_BOX = (() => {
  const xs = STREAMS.map((q) => q.wp[0][0]);
  const ys = STREAMS.map((q) => q.wp[0][1]);
  return { x0: Math.min(...xs, HEART[0]), x1: Math.max(...xs, HEART[0]), y0: Math.min(...ys, HEART[1]), y1: Math.max(...ys, HEART[1]) };
})();
export const K_WIDE = 6.3;
const WIDE: Framing = {
  k: K_WIDE,
  s: [540 + (HEART[0] - (SOURCE_BOX.x0 + SOURCE_BOX.x1) / 2) * K_WIDE, 835 + (HEART[1] - (SOURCE_BOX.y0 + SOURCE_BOX.y1) / 2) * K_WIDE],
};
/** the moves (each lands on its framing at the end of its window) and the creeps under them */
export const MOVES: Move[] = [
  { win: [-6, 40], taper: 1, to: { k: K_CLOSE, s: [540, 835] } }, // "so as Cortes builds up": the dive onto the banner
  { win: [46, 92], taper: 1, to: PAIR }, // "for the final campaign against Tenoch-": one glide west and out to the pair
  { win: [172, 212], taper: 1, to: WIDE }, // "from all over Meso-": the pull-back to every source
];
export const CREEPS: Creep[] = [
  { win: [18, 64], dlnk: 0.03 }, // through the dive's landing, while the column arrives
  { win: [86, 196], dlnk: Math.log(36 / K_PAIR), dsx: -22, dsy: 8 }, // the held breath on the pair: a slow push toward the banner
  { win: [200, 300], dlnk: -0.035, dsx: 5, dsy: 4 }, // the wide, still drifting
];
const camRun = makeMoveCamera(HEART, { k: C_END_CAM.k, s: screenPt(HEART, C_END_CAM) }, MOVES, CREEPS, makeTrack);
/** the authored camera (no sway); f0 = C_END.cam exactly */
export const camAt = (f: number): Cam => (f === 0 ? { ...C_END_CAM } : camRun(f));
export const CAM_TRACK: Cam[] = Array.from({ length: DURATION + 1 }, (_, f) => camAt(f));

// ---------------------------------------------------------------------------
// THE MOSAIC (C's end state, P's ProvinceMosaic) recedes over the dive to a
// faint context rung (its orange hatch ~0.27, its edges and teeth ~0.32, as one
// group) and stays there through D and E: from here the orange that matters is
// the people. Cut A's fortress claim is drawn again on top so it holds ~0.6.
// D f0 is untouched (the recession starts after f0).
// ---------------------------------------------------------------------------
export const MOSAIC_REST = 0.32;
const K_RECEDED = 10;
/** the mosaic's rung in D at frame f: driven by the dive (ln k from C's wide to K_RECEDED) */
export const mosaicD = (f: number) => {
  if (f <= 0) return 1;
  if (f >= MOVES[0].win[1]) return MOSAIC_REST;
  const u = Math.log(CAM_TRACK[Math.min(LAST, Math.round(f))].k / C_END_CAM.k) / Math.log(K_RECEDED / C_END_CAM.k);
  return 1 - (1 - MOSAIC_REST) * smoothstep(u);
};
const CLAIM_TOP = 0.41; // the fortress claim's top copy at the rest rung: 1 - (1 - 0.32)(1 - 0.41) = 0.6
export const WorldLayer: React.FC<{ cam: Cam; m: number }> = ({ cam, m }) => {
  const top = (CLAIM_TOP * (1 - m)) / (1 - MOSAIC_REST);
  return (
    <>
      {m >= 0.9999 ? (
        <ProvinceMosaic cam={cam} />
      ) : (
        <AbsoluteFill style={{ opacity: m }}>
          <ProvinceMosaic cam={cam} />
        </AbsoluteFill>
      )}
      {top > 0.001 ? (
        <WorldSvg cam={cam}>
          <TlaxcalaClaims cam={cam} opacity={top} />
        </WorldSvg>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------------------
// THE SCENE, shared by D and E (so E f0 renders the same tree as D's last frame)
// ---------------------------------------------------------------------------
/** the banner's pole in screen px: ~120 at the close framing, ~80 on the pair, ~40 in the wide */
export const bannerSize = (k: number) => 76 * Math.pow(k / 26, 0.4);
/** CORTES under the Spaniards' body (screen px below the banner's foot) */
const cortesDy = (k: number) => 52 + 0.62 * k;
/** a label on its entrance clock, its rung, and its exit (the reverse: fades, slides down 24 px) */
export type LabelState = { frame: number; f0: number; opacity: number; exit: number };
/** the spotlight (E): the map base dims to 0.7, the mosaic and the allies to 0.45 */
const SPOT_BASE = 0.3;
const SPOT_HOST = 0.55;
export const HostScene: React.FC<{
  cam: Cam;
  g: number;
  vignette: number;
  mosaic: number;
  banner: number;
  cortes: LabelState;
  tenoch: LabelState;
  shade?: number;
  children?: React.ReactNode;
}> = ({ cam, g, vignette, mosaic, banner, cortes, tenoch, shade = 0, children }) => {
  const k = cam.k;
  const host = hostAt(g, k);
  const r = dotScreenR(k);
  const casing = dotCasing(r);
  const allies = host.allies.filter((L) => L.n > 0);
  const spanish = host.spanish.filter((L) => L.n > 0);
  const label = (st: LabelState) => ({ frame: st.frame, f0: st.f0, opacity: st.opacity * (1 - st.exit), exitDy: LABEL_TRAVEL * st.exit });
  const lc = label(cortes);
  const lt = label(tenoch);
  const people = (
    <>
      <WorldLayer cam={cam} m={mosaic} />
      {allies.length ? (
        <CanvasDots cam={cam} layers={allies.map((L) => ({ xy: L.xy.subarray(0, 2 * L.n), r, color: ACCENT, opacity: L.op, casing }))} />
      ) : null}
    </>
  );
  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <HostMapStack cam={cam} />
      {shade > 0.0005 ? (
        <>
          <AbsoluteFill style={{ backgroundColor: `rgba(8,6,4,${(SPOT_BASE * shade).toFixed(4)})` }} />
          <AbsoluteFill style={{ filter: `brightness(${(1 - SPOT_HOST * shade).toFixed(4)})` }}>{people}</AbsoluteFill>
        </>
      ) : (
        people
      )}
      {spanish.length ? (
        <CanvasDots cam={cam} layers={spanish.map((L) => ({ xy: L.xy.subarray(0, 2 * L.n), r, color: INK, opacity: INK_FULL * L.op, casing: casing * 0.7 }))} />
      ) : null}
      {banner > 0 ? (
        <WorldSvg cam={cam}>
          <Banner x={HEART[0]} y={HEART[1]} cam={cam} size={bannerSize(k)} progress={banner} />
        </WorldSvg>
      ) : null}
      {lc.opacity > 0.002 ? (
        <MapLabel text="CORTÉS" x={HEART[0]} y={HEART[1]} dy={cortesDy(k) + lc.exitDy} cam={cam} frame={lc.frame} f0={lc.f0} size={40} opacity={lc.opacity} />
      ) : null}
      {lt.opacity > 0.002 ? (
        <MapLabel
          text="TENOCHTITLAN"
          x={TENOCH[0]}
          y={TENOCH[1]}
          cam={cam}
          frame={lt.frame}
          f0={lt.f0}
          size={A_LABEL.size}
          spacing={A_LABEL.spacing}
          anchor={A_LABEL.anchor}
          dx={A_LABEL.dx}
          dy={-(fortressSize(k) - 5.4) + lt.exitDy}
          opacity={lt.opacity}
        />
      ) : null}
      {children}
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

/** the labels' entrances in D (the house slide-up, ~8 f before the word) */
export const CORTES_F0 = 8;
export const TENOCH_F0 = 91;
/** CORTES drops to the context rung as the first heads reach the banner */
export const cortesRung = (f: number) => INK_FULL - (INK_FULL - INK_CONTEXT) * smoothstep((f - W.flocking) / 12);
/** both labels leave as the pull-back gets under way (the house exit, f190-204): they have served their words */
export const LABELS_OUT = 190;
export const labelsExit = (f: number) => smoothstep((f - LABELS_OUT) / 14);
/** the banner rises f8..f24 */
export const BANNER_F0 = 8;
export const BANNER_FRAMES = 16;

export const schema = z.object({
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

const FlockingToHisBanner: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(LAST, Math.max(0, Math.round(frame)));
  const g = G0 + frame;
  const cam = swayCam(CAM_TRACK[fi], g);
  return (
    <HostScene
      cam={cam}
      g={g}
      vignette={vignette}
      mosaic={mosaicD(frame)}
      banner={(frame - BANNER_F0) / BANNER_FRAMES}
      cortes={{ frame, f0: CORTES_F0, opacity: cortesRung(frame), exit: labelsExit(frame) }}
      tenoch={{ frame, f0: TENOCH_F0, opacity: INK_FULL, exit: labelsExit(frame) }}
    />
  );
};

export default FlockingToHisBanner;

/** the state E opens on (asserted there) */
export const D_END = {
  f: LAST,
  g: G0 + LAST,
  cam: CAM_TRACK[LAST],
  mosaic: mosaicD(LAST),
  bannerProgress: (LAST - BANNER_F0) / BANNER_FRAMES,
  cortes: { frame: LAST, f0: CORTES_F0, opacity: cortesRung(LAST), exit: labelsExit(LAST) },
  tenoch: { frame: LAST, f0: TENOCH_F0, opacity: INK_FULL, exit: labelsExit(LAST) },
};
