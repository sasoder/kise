// ---------------------------------------------------------------------------
// DefenseFirstThenOffense (kofman-vivaldi, cut 28), revision 2: on the Lyman map. ChinaTalk style (newsprint)
// (styles/chinatalk.md; kit API in generated/components/kits/chinatalk/chinatalkVintage.md; the clip's two-colour map
// in lymanShared.tsx). Delivered as 28_DefenseFirstThenOffense.mov. Opaque 1080x1920, 24 fps, 248 frames.
//
// CHECK LINE: "the drones first hold the Ukrainian line (Russian attacks die in their kill zone); later the same
// drones lead the Ukrainian push, and the front moves east over the Vivaldi salient."
//
// THE LINE: "It's easiest to apply technology to the defense first, and it's easier to do defense on land than
// offense. And then usually that technology then gets adapted over time by the same force to enable offensive
// operations."
// WORD -> FRAME: easiest 4 · apply 17 · technology 23 · to the 35-41 · defense 44 · first 53 · and 65 · easier 70 ·
// to do 74-77 · defense 80 · on land 89-93 · than 98 · offense 101 · And then 105-116 · usually 119 ·
// that technology 129-134 · then 146 · gets 153 · adapted 160 · over 171 · time 189 · by 199 · the same 204-207 ·
// force 211 · to enable 218-221 · offensive 227 · operations 235 · (cut back to the speaker at 248).
// DURATION: the slot 28.833 -> 39.167 s = 10.333 s x 24 = 248 frames (f0..f247).
//
// THE PICTURE: the shared Lyman map (lymanShared LymanMap: Ukrainian ground blue, Russian-held ground the grey wash
// under the hatch, the Donets, LYMAN, UKRAINE / RUSSIAN-HELD) on 15 Aug 2026, the Russian-held salient bulging west
// north of Lyman. RED = the drones (Phosphor "drone", DRONE_D) and their kill zone. Nothing else is red (the retaken
// patch's fine RED_DEEP edge, the clip's memory thread, settles in at the end as in cuts 0-18).
//
// THE MOTION: three red drones fly in from the west frame edge and take station over the Ukrainian side of the
// salient's front (arrivals f36, f40, f44 "defense"); from the point of the front under each one a red kill zone (one
// flat RED wash, no hatch of its own) opens along the front on the Russian-held side: a narrow band ~78 world px deep
// hugging the line, only along the stretch the drones watch, with a short taper at each end (settled ~f62). On
// "easier to do defense on land" three heavy dashed ink Russian attack arrows (the weight of the Ukrainian ones) run
// west from deep in the salient, stop dead on the band's edge (f84 "defense", f90, f97 "land") and bleed away. The
// drones hold station through "And then usually" (the camera holds its x too), then from f108 move east over the
// Russian-held side in one move (slow at first: "adapted over time"); the band goes with them, always just ahead of
// them (the front they are taking, pushed 180 world px east); the front follows 16 frames behind (f124-238) as the
// real 15 Aug front morphs into the real 15 Oct front, the ground behind it turning blue (the Vivaldi patch), each
// drone's solid ink Ukrainian attack arrow growing out of the old front behind it. The camera pushes in through the
// defense, drifts east with the advance, and creeps to the end, where the patch's RED_DEEP edge settles (f228-246) and
// the drones hover over the Russian side of the new front with the kill zone just ahead of them.
// CONTACTS: drone A/B/C station on f36/40/44, its kill zone's first red on the same frame. Russian arrows stop on the
// band's edge on f84/90/97 (they never reach the line). The front leaves the 15 Aug line on f124.
//
// SOURCES: front lines and areas: DeepStateMap (deepstatemap.live) history snapshots of 15 Aug and 15 Oct 2026, via
// lymanFrontData.ts / lymanShared.tsx (VIVALDI_OLD_EDGE -> VIVALDI_NEW_EDGE; HELD_20261015 + the morphing patch);
// the morph between the two fronts is drawn, not data (only its two ends are real). The Donets: Natural Earth; Lyman:
// OpenStreetMap Nominatim. Drone counts, arrows and the kill zone are illustrative, not data. The SourceLine names
// DeepStateMap, 15 Aug and 15 Oct 2026.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DashedPath,
  INK_HI,
  InkDiffuse,
  Pictogram,
  RED,
  RED_LINE,
  RedGroup,
  SourceLine,
  V_INK,
  VStage,
  WetLine,
  clamp01,
  cumLen,
  inkDiffuse,
  pointAtLen,
  polyD,
  runVCamera,
  smoothstep,
  toWorld,
  wpx,
} from "../kits/chinatalk/chinatalkVintage";
import type { Cam, DashMod, Pt, VCamKey } from "../kits/chinatalk/chinatalkVintage";
import { HELD_20261015 } from "./lymanFrontData";
import {
  FRONT_OCT_NORTH,
  FRONT_OCT_SOUTH,
  FrontLine,
  LymanMap,
  RetakenPatch,
  SALIENT_RUSSIAN_LABEL,
  SideLabel,
  VIVALDI_NEW_EDGE,
  VIVALDI_OLD_EDGE,
  despike,
} from "./lymanShared";
import { DRONE_D } from "./vivaldiPictos";

export const FPS = 24;
export const DURATION = 248;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ID = "dfo";

// --- the front: the real 15 Aug edge of the salient morphing into the real 15 Oct edge ----------------------------
/** both edges sampled at the same arc fractions (every vertex of each kept), so the morph is exact at both ends */
const fracs = (pts: Pt[]) => {
  const c = cumLen(pts);
  return c.map((s) => s / c[c.length - 1]);
};
const FR = Array.from(new Set([...fracs(VIVALDI_OLD_EDGE), ...fracs(VIVALDI_NEW_EDGE)].map((f) => Math.round(f * 1e6) / 1e6))).sort((a, b) => a - b);
const sampleAt = (pts: Pt[]) => {
  const c = cumLen(pts);
  const L = c[c.length - 1];
  return FR.map((f) => pointAtLen(pts, c, f * L));
};
const OLD_S = sampleAt(VIVALDI_OLD_EDGE);
const NEW_S = sampleAt(VIVALDI_NEW_EDGE);
/** the salient's front at progress t (0 = 15 Aug, 1 = 15 Oct), north to south */
const morph = (t: number): Pt[] => OLD_S.map((a, i) => ({ x: a.x + (NEW_S[i].x - a.x) * t, y: a.y + (NEW_S[i].y - a.y) * t }));
/** the whole visible front at t: Oct north of the salient, the morph, Oct south of it */
const frontAt = (t: number): Pt[] => despike([...FRONT_OCT_NORTH, ...morph(t).slice(1), ...FRONT_OCT_SOUTH.slice(1)]);
/** Russian-held ground at t: HELD 15 Oct + what is left of the salient (between the front at t and the Oct edge) */
const heldAt = (t: number): string[] => {
  if (t >= 0.999) return [HELD_20261015];
  const m = morph(t);
  return [HELD_20261015, polyD([...m, ...[...NEW_S].reverse()], true)];
};

// --- timing ----------------------------------------------------------------------------------------------------------
/** the drones' advance (slow out of station: "adapted over time"), then the front following behind */
const ADV_F0 = 108;
const ADV_F1 = 222;
const FRONT_LAG = 16;
const advEase = (u: number) => {
  const x = clamp01(u);
  // a slow start that builds, then settles: smootherstep weighted toward the end
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const tDrone = (S: number) => advEase((S - ADV_F0) / (ADV_F1 - ADV_F0));
const tFront = (S: number) => tDrone(S - FRONT_LAG);
/** the kill zone's line: the front the drones are taking (the morph at the drones' progress), pushed east by
 *  ZONE_SHIFT x that progress (tapered to nothing at the two fixed ends of the salient). Each drone sits ~90 world px
 *  west of the old front on station and ~90 east of the new one at the end, so the band keeps the same place
 *  relative to them throughout: just ahead of them, one band, never a field */
const ZONE_SHIFT = 180;
const ZONE_TAPER = 0.15;
const zoneLineAt = (t: number): Pt[] => {
  const m = morph(t);
  const sh = ZONE_SHIFT * t;
  const shifted = m.map((q, i) => ({ x: q.x + sh * smoothstep(Math.min(FR[i], 1 - FR[i]) / ZONE_TAPER), y: q.y }));
  return despike([...FRONT_OCT_NORTH, ...shifted.slice(1), ...FRONT_OCT_SOUTH.slice(1)]);
};
/** the ground east (the Russian side) of a front-like line: it runs from far north to far south, so close it far east */
const FAR_EAST = 4000;
const beyondOf = (line: Pt[]): string =>
  polyD([...line, { x: FAR_EAST, y: line[line.length - 1].y }, { x: FAR_EAST, y: line[0].y }], true);
/** the patch's RED_DEEP edge settles once the front is home */
const EDGE_F0 = 228;
const EDGE_F = 18;

// --- the drones ----------------------------------------------------------------------------------------------------
const DRONE_SIZE = 170;
type Drone = {
  id: string;
  /** station over the Ukrainian side of the 15 Aug front, and the point of the front under it (the contact) */
  station: Pt;
  contact: Pt;
  /** the end: over the Russian side of the 15 Oct front, and where its Ukrainian attack ends (on that front) */
  final: Pt;
  arrowEnd: Pt;
  /** where it comes in from (off the west frame edge), an optional control point for its curve (A keeps clear of the
   *  UKRAINE label), and the frame it takes station */
  from: Pt;
  via?: Pt;
  arrive: number;
  /** its Russian attack: from deep in the salient toward its contact; it stops on the kill zone's edge (computed) */
  atkFrom: Pt;
  atkF0: number;
};
const DRONES: Drone[] = [
  {
    id: "a",
    station: { x: 560, y: 445 },
    contact: { x: 560, y: 528 },
    final: { x: 858, y: 452 },
    arrowEnd: { x: 768, y: 474 },
    from: { x: -300, y: 60 },
    via: { x: 520, y: 250 },
    arrive: 36,
    atkFrom: { x: 900, y: 590 },
    atkF0: 64,
  },
  {
    id: "b",
    station: { x: 170, y: 690 },
    contact: { x: 262, y: 690 },
    final: { x: 735, y: 640 },
    arrowEnd: { x: 645, y: 655 },
    from: { x: -470, y: 610 },
    arrive: 40,
    atkFrom: { x: 760, y: 640 },
    atkF0: 70,
  },
  {
    id: "c",
    station: { x: -14, y: 812 },
    contact: { x: 76, y: 818 },
    final: { x: 640, y: 790 },
    arrowEnd: { x: 555, y: 798 },
    from: { x: -480, y: 760 },
    arrive: 44,
    atkFrom: { x: 600, y: 884 },
    atkF0: 77,
  },
];
const ENTRY_F0 = -2;
/** the way in: a curve from off the west edge that arrives heading toward the drone's later advance */
const entryPts = (d: Drone): Pt[] => {
  const hx = d.final.x - d.station.x;
  const hy = d.final.y - d.station.y;
  const h = Math.hypot(hx, hy);
  const c = d.via ?? { x: d.station.x - (hx / h) * 220, y: d.station.y - (hy / h) * 220 };
  return Array.from({ length: 81 }, (_, i) => {
    const t = i / 80;
    const a = (1 - t) * (1 - t);
    const b = 2 * t * (1 - t);
    const e = t * t;
    return { x: a * d.from.x + b * c.x + e * d.station.x, y: a * d.from.y + b * c.y + e * d.station.y };
  });
};
const ENTRIES = DRONES.map((d) => {
  const pts = entryPts(d);
  const cum = cumLen(pts);
  return { pts, cum, len: cum[cum.length - 1] };
});
const headingDeg = (a: Pt, b: Pt) => (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
const BOB_A = 2.5;
const BOB_T = 44;
export const droneAt = (i: number, S: number): { x: number; y: number; rot: number } => {
  const d = DRONES[i];
  const e = ENTRIES[i];
  if (S < d.arrive) {
    const u = clamp01((S - ENTRY_F0) / (d.arrive - ENTRY_F0));
    const s = e.len * (1 - (1 - u) * (1 - u));
    const p = pointAtLen(e.pts, e.cum, s);
    const q = pointAtLen(e.pts, e.cum, Math.min(e.len, s + 3));
    const r = pointAtLen(e.pts, e.cum, Math.max(0, s - 3));
    return { x: p.x, y: p.y, rot: headingDeg(r, q) + 90 };
  }
  const t = tDrone(S);
  // on station it turns (eased, the short way under the drone's four-fold symmetry) from its arrival heading to the
  // heading of its later advance
  const endA = pointAtLen(e.pts, e.cum, e.len - 3);
  const rotEnd = headingDeg(endA, d.station) + 90;
  const rotAdv = headingDeg(d.station, d.final) + 90;
  const delta = ((((rotAdv - rotEnd + 45) % 90) + 90) % 90) - 45;
  const rot = rotEnd + delta * smoothstep((S - d.arrive) / 16);
  const bob = BOB_A * Math.sin((2 * Math.PI * (S - d.arrive)) / BOB_T + i * 2.1) * smoothstep((S - d.arrive) / 10);
  return {
    x: d.station.x + (d.final.x - d.station.x) * t,
    y: d.station.y + (d.final.y - d.station.y) * t + bob,
    rot,
  };
};

// --- the kill zone ---------------------------------------------------------------------------------------------------
/** its depth (world px): the band is the stroke of the zone's line, clipped to the Russian side of that line, so it is
 *  ZONE_HALF deep everywhere and never grows into a field */
const ZONE_HALF = 78;
/** it opens from each drone's contact (world px over frames), soaking fast then slowing, along the stretch of front
 *  the three drones watch only, with a short taper at its two ends */
const ZONE_OPEN_F = 22;
const ZONE_REACH = 200;
const ZONE_FEATHER = 70;
const SOAK_P = 1.6;
const soak = (u: number) => 1 - Math.pow(1 - clamp01(u), SOAK_P);
/** one clean flat RED wash, no hatch of its own (the map's hatch shows through) */
const ZONE_WASH = 0.34;

// --- the attacks -----------------------------------------------------------------------------------------------------
/** the Russian attacks: as heavy as the Ukrainian ones, they run in fast (barely easing) and stop dead on the kill
 *  zone's edge: stops f84 "defense", f90, f97 "land" */
const ATK_F = 20;
const ATK_BLEED_AFTER = 2;
const ATK_BLEED_RUN = 5;
const ATK_BLEED_F = 11;
const atkEase = (u: number) => 1 - Math.pow(1 - clamp01(u), 1.35);
/** arrow heads, SCREEN px at k = 1 */
const UA_HEAD = { len: 44, w: 46 };
/** distance from p to a polyline */
const distToLine = (p: Pt, pts: Pt[]) => {
  let best = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const L2 = dx * dx + dy * dy || 1;
    const t = clamp01(((p.x - a.x) * dx + (p.y - a.y) * dy) / L2);
    best = Math.min(best, Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy));
  }
  return best;
};
/** where each Russian attack's tip stops: the first point on its way to the contact that touches the kill zone */
const FRONT_0 = frontAt(0);
const ATK_TO: Pt[] = DRONES.map((d) => {
  const dx = d.contact.x - d.atkFrom.x;
  const dy = d.contact.y - d.atkFrom.y;
  for (let i = 0; i <= 400; i++) {
    const q = { x: d.atkFrom.x + (dx * i) / 400, y: d.atkFrom.y + (dy * i) / 400 };
    if (distToLine(q, FRONT_0) <= ZONE_HALF + 2) return q;
  }
  throw new Error(`DefenseFirstThenOffense: attack ${d.id} never reaches the kill zone`);
});
const headD = (tip: Pt, dir: Pt, len: number, w: number) => {
  const bx = tip.x - dir.x * len;
  const by = tip.y - dir.y * len;
  return `M${tip.x.toFixed(2)} ${tip.y.toFixed(2)}L${(bx - (dir.y * w) / 2).toFixed(2)} ${(by + (dir.x * w) / 2).toFixed(2)}L${(bx + (dir.y * w) / 2).toFixed(2)} ${(by - (dir.x * w) / 2).toFixed(2)}Z`;
};
const unit = (a: Pt, b: Pt) => {
  const L = Math.hypot(b.x - a.x, b.y - a.y);
  return { x: (b.x - a.x) / L, y: (b.y - a.y) / L, L };
};

// --- labels ----------------------------------------------------------------------------------------------------------
/** RUSSIAN-HELD sits on the salient (as cut 0 sets it) and bleeds away as the drones start over it */
const RU_LABEL_BLEED_F0 = 116;
const RU_LABEL_BLEED_F = 14;

// --- the camera: the salient with Lyman below the bands, a push in through the defense, an eastward drift with the
// advance, a creep to the end ------------------------------------------------------------------------------------------
const CAM_KEYS: VCamKey[] = [
  { f: -24, x: 400, y: 800, k: 0.88 },
  { f: 64, x: 404, y: 790, k: 0.95 },
  { f: 132, x: 404, y: 784, k: 0.96 },
  { f: 216, x: 540, y: 764, k: 1.0 },
  { f: DURATION - 1, x: 548, y: 760, k: 1.025, ease: "linear" },
];
export const camAt = runVCamera(CAM_KEYS, DURATION);
const MAP_HATCH_K = 0.96;
/** the source line: two lines in the lower left, under Lyman, clear of the front on every camera state (world-locked) */
const SOURCE_AT: Pt = toWorld(camAt(DURATION - 1), 48, 1790);
const SOURCE_LINES = ["Front lines: DeepStateMap,", "15 Aug and 15 Oct 2026"];
const SOURCE_LEAD = 34;

const DefenseFirstThenOffense: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam: Cam = camAt(S);
  const k = cam.k;

  const tf = tFront(S);
  const held = heldAt(tf);
  const zoneLine = zoneLineAt(tDrone(S));
  const beyond = beyondOf(zoneLine);

  // the view in world px (for masks), with margin for the sway
  const hw = 620 / k + 80;
  const hh = 1040 / k + 80;
  const box = { x: cam.x - hw, y: cam.y - hh, width: 2 * hw, height: 2 * hh };
  const rect: Pt[] = [
    { x: box.x, y: box.y },
    { x: box.x + box.width, y: box.y },
    { x: box.x + box.width, y: box.y + box.height },
    { x: box.x, y: box.y + box.height },
  ];

  // the kill zone's opening discs, one per drone contact
  // (each disc rides with its drone, so the zone moves with them: it covers the stretch of front they watch)
  const discs = DRONES.map((d, i) => {
    const p = droneAt(i, S);
    const c = S < d.arrive ? d.contact : { x: d.contact.x + p.x - d.station.x, y: d.contact.y + p.y - d.station.y };
    return { c, r: ZONE_REACH * soak((S - d.arrive + 0.5) / ZONE_OPEN_F) };
  });
  const zoneOn = discs.some((q) => q.r > 0.5);

  const uHead = { len: wpx(UA_HEAD.len, k), w: wpx(UA_HEAD.w, k) };

  return (
    <VStage S={S} cam={cam}>
      <defs>
        {zoneOn ? (
          <>
            {discs.map((q, i) =>
              q.r > 0.5 ? (
                <radialGradient key={i} id={`${ID}-disc-${i}`} gradientUnits="userSpaceOnUse" cx={q.c.x} cy={q.c.y} r={(q.r + ZONE_FEATHER).toFixed(2)}>
                  <stop offset={0} stopColor="#FFFFFF" />
                  <stop offset={(q.r / (q.r + ZONE_FEATHER)).toFixed(4)} stopColor="#FFFFFF" />
                  <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
                </radialGradient>
              ) : null,
            )}
            <mask id={`${ID}-open`} maskUnits="userSpaceOnUse" {...box}>
              {discs.map((q, i) => (q.r > 0.5 ? <rect key={i} {...box} fill={`url(#${ID}-disc-${i})`} /> : null))}
            </mask>
            <mask id={`${ID}-band`} maskUnits="userSpaceOnUse" {...box}>
              <path d={polyD(zoneLine)} fill="none" stroke="#FFFFFF" strokeWidth={2 * ZONE_HALF} strokeLinecap="round" strokeLinejoin="round" />
            </mask>
            <clipPath id={`${ID}-held`}>
              <path d={beyond} clipRule="evenodd" />
            </clipPath>
          </>
        ) : null}
      </defs>

      <LymanMap id={ID} k={k} hatchK={MAP_HATCH_K} held={held} places={["Lyman"]}>
        {/* the memory thread: the retaken patch's fine RED_DEEP edge settles once the front is home */}
        <RetakenPatch id={`${ID}-patch`} k={k} fill={0} edge={smoothstep((S - EDGE_F0) / EDGE_F)} />

        {/* the kill zone: red on the Russian-held side of the line the drones hold */}
        {zoneOn ? (
          <g clipPath={`url(#${ID}-held)`}>
            <g mask={`url(#${ID}-band)`}>
              <g mask={`url(#${ID}-open)`}>
                <path d={polyD(rect, true)} fill={RED} opacity={ZONE_WASH} />
              </g>
            </g>
          </g>
        ) : null}

        {/* the Russian attacks: heavy dashed ink out of the salient at the drones; they stop on the kill zone's edge */}
        {DRONES.map((d, di) => {
          if (S < d.atkF0) return null;
          const stop = d.atkF0 + ATK_F;
          const bleed0 = stop + ATK_BLEED_AFTER;
          if (S >= bleed0 + ATK_BLEED_RUN + ATK_BLEED_F + 1) return null;
          const u = unit(d.atkFrom, ATK_TO[di]);
          const dist = u.L * atkEase((S - d.atkF0) / ATK_F);
          if (dist < 1) return null;
          const tip = { x: d.atkFrom.x + u.x * dist, y: d.atkFrom.y + u.y * dist };
          const hl = Math.min(uHead.len, dist);
          const shaftLen = Math.max(0, dist - hl + 3);
          const shaftTo = { x: d.atkFrom.x + u.x * shaftLen, y: d.atkFrom.y + u.y * shaftLen };
          const mod = (_i: number, sMid: number, total: number): DashMod => {
            const v = clamp01((S - bleed0 - (1 - sMid / total) * ATK_BLEED_RUN) / ATK_BLEED_F);
            if (v <= 0) return null;
            const q = inkDiffuse(v);
            return { opacity: q.opacity, blur: q.blur, spread: q.spread };
          };
          return (
            <g key={d.id}>
              {shaftLen > 1 ? <DashedPath points={[d.atkFrom, shaftTo]} k={k} S={S} dashMod={mod} width={RED_LINE} /> : null}
              <InkDiffuse u={(S - bleed0) / ATK_BLEED_F} k={k} cx={tip.x} cy={tip.y}>
                <path d={headD(tip, u, hl, uHead.w * Math.min(1, dist / uHead.len))} fill={V_INK} opacity={INK_HI} />
              </InkDiffuse>
            </g>
          );
        })}

        {/* the Ukrainian attacks: solid ink, out of the old front behind each drone, their heads on the moving front */}
        {tf > 0.002
          ? DRONES.map((d) => {
              const u = unit(d.contact, d.arrowEnd);
              const tipDist = u.L * tf;
              if (tipDist < 2) return null;
              const tip = { x: d.contact.x + u.x * tipDist, y: d.contact.y + u.y * tipDist };
              const shaft = Math.max(0, tipDist - uHead.len + 3);
              return (
                <g key={d.id}>
                  {shaft > 1 ? (
                    <WetLine
                      id={`${ID}-ua-${d.id}`}
                      points={[d.contact, { x: d.contact.x + u.x * shaft, y: d.contact.y + u.y * shaft }]}
                      k={k}
                      ink
                      rung={INK_HI}
                      width={RED_LINE}
                    />
                  ) : null}
                  <path d={headD(tip, u, Math.min(uHead.len, tipDist), uHead.w * Math.min(1, tipDist / uHead.len))} fill={V_INK} opacity={INK_HI} />
                </g>
              );
            })
          : null}

        {/* the front, real at both ends */}
        <FrontLine id={`${ID}-front`} points={frontAt(tf)} k={k} />
      </LymanMap>

      {/* the side labels (shared placements) */}
      <SideLabel which="ukraine" k={k} />
      <SideLabel which="russian" k={k} at={SALIENT_RUSSIAN_LABEL} diffuse={clamp01((S - RU_LABEL_BLEED_F0) / RU_LABEL_BLEED_F)} />

      {/* the technology */}
      <RedGroup k={k}>
        {DRONES.map((d, i) => {
          const p = droneAt(i, S);
          return <Pictogram key={d.id} d={DRONE_D} x={p.x} y={p.y} size={DRONE_SIZE} color={RED} rung={1} rotate={p.rot} />;
        })}
      </RedGroup>

      {SOURCE_LINES.map((t, i) => (
        <SourceLine key={t} text={t} x={SOURCE_AT.x} y={SOURCE_AT.y + i * SOURCE_LEAD} k={k} />
      ))}
    </VStage>
  );
};

export default DefenseFirstThenOffense;
