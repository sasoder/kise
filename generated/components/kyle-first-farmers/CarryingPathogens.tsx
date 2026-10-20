// ---------------------------------------------------------------------------
// CarryingPathogens (kyle-first-farmers, cut 92). Dwarkesh map style (styles/dwarkesh-map.md).
// Opaque 1080x1920, 29.97 fps, 448 frames. The clip's closing graphic.
// The Neolithic Europe world of firstFarmersMap.tsx and its front model (neolithicFront.ts), opening on cut F's
// (OutcompeteEurope) first frame; the cast, Germs and props of farmersFigures.tsx / firstFarmersShared.tsx.
// State (camera, clock, Danube, columns, germs, deaths, population): carryingPathogensWorld.ts.
//
// CHECK LINE: "as the farmers migrated into Europe their germs travelled with them and ran ahead of them — the
// hunter-gatherers in their path started dying before the farmers even arrived."
//
// THE LINE (sequence 92.19-107.14 s): "Those kinds of populations, when they're then migrating into Europe, are
// probably carrying these pathogens with them, that may have had a kind of further effect that, on top of just being
// able to extract more energy and multiply faster, drives up the mortality of the existing populations."
// WORD -> FRAME: Those 1 · kinds 16 · of 25 · populations 29 · when 45 · they're 54 · then 58 · migrating 64 ·
// into 86 · Europe 92 · are 105 · probably 108 · carrying 115 · these 136 · pathogens 152 · with 167 · them 184 ·
// that 193 · may 203 · have 207 · had 211 · a 220 · kind 226 · of 232 · further 235 · effect 243 · that 253 ·
// on 263 · top 267 · of 272 · just 277 · being 280 · able 284 · to 288 · extract 292 · more 298 · energy 305 ·
// and 316 · multiply 320 · faster 328 · drives 346 · up 354 · the 363 · mortality 366 · of 379 · the 395 ·
// existing 398 · populations 411.
// DURATION: the slot 92.1921 -> 107.1404 s = 14.948 s x 29.97 = 448 frames (f0..f447).
//
// THE MOTION: one camera move. It opens on cut F's first frame pixel for pixel (the Aegean at k 3; only the drawn
// Danube is new). From f36 a compact body of 30 farmer dots buds off the farmed land of Attica (each dot slides out
// of an existing farmer dot) and sets off on "migrating" (f66), marching at constant speed through Thessaly, up the
// Vardar and the Morava to the Danube at the Morava's mouth by Smederevo (f236), where it turns downstream along the
// river and slows to a walk; the camera travels with it at k 3.1-3.4 (its body held near screen (540, 960), the
// landscape moving under us), so by f240 we are over the Danube with the Iron Gates in frame. The orange front creeps
// behind (6600 BC at f0 -> ~6110 BC at the end). EUROPE slides up f78-92 over the land north of the Danube.
// From f104 ("carrying" f115) a stipple haze comes out of the body and LEADS it down its route (emitted in 22-frame
// slices, each drifting along the heading ~1 world px a frame faster than the march), and legible microbes (6-8 in
// shot through f140-200, ~45 px) swim head first out of its head, three times as fast as it marches, to cream
// forager dots ahead and sink into them. A dot starts dying on the frame a microbe lands in it (contact frame = first
// reaction frame) or 6 frames after the haze first touches it: its mark swells to 1.5x as it drains to DEAD, then
// drops and flattens (lying down); first deaths f126-132, a run of them just above the frame's middle after
// "pathogens" (f152); 26 by f229. The dead are never absorbed and never parents of farmer dots; the column and the
// front later pass over them. After the Danube the haze runs on downstream into the camp's dot (three microbes sink
// into it f240-262). From f246 the camera dives in one log-space move (ln k on a smootherstep, k 3.4 -> 146 by f336)
// onto that dot on the Danube in the Iron Gates gorge, the column drawing in (compact) and leaving the frame to the
// left: the dot hands over to its camp at k 4.6-6.4, the map's dots go at k 12-24, the Danube opens from a cream line
// into the river band behind the camp, the gorge's far wall comes up behind it (k 30-90), the camp's own haze drifts
// in from upstream (screen left) and the map dissolves into the land page at k 45-95. At figure scale ("drives up
// the mortality", f336-411) four of the six foragers sicken and fall one after another, left to right with the haze,
// each one 3 frames after a legible microbe swims into his or her chest (b2 f336, a1 f350, c1 f364, b1 f378; the
// last lands ~f411 on "populations"); a woman and a child (0.65 of her height) survive, standing between the fallen.
// The orange farmers walk in at the far (west) edge of the clearing from ~f385, still distant: the germs got there
// first. To the last frame the haze thins (its inflow stops f390-400), the fire licks and sparks, a smoke curl
// drifts, and the camera creeps in (k 146 -> 150).
// Orange = the incoming farmers' side (their land, their dots, their columns, the figures, their germs); everything
// else is cream; a forager killed by disease drains to DEAD. Text: EUROPE only.
//
// SOURCES: the map world and the front model are the clip's (firstFarmersMap.tsx, neolithicFront.ts: arrival dates of
// farming from Pinhasi, Fort & Ammerman 2005 and Shennan 2018; cut F's header). The Danube's course: named towns along
// it (lon/lat listed in carryingPathogensWorld.ts; the brief's checkpoints Sulina 45.2 N 29.6 E, Silistra, Ruse,
// Vidin, Lepenski Vir 44.56 N 22.03 E, Belgrade, Budapest (the bend north at Vukovar / Visegrad), Vienna, Linz,
// Regensburg, Donaueschingen), Catmull-Rom between them; within ~17 km of the camp the course is laid level (the real
// Orsova-Turnu Severin run is ~20 deg off level). The column's route follows the Vardar-Morava corridor to the Danube
// at Smederevo (schematic). The camp: a Mesolithic forager camp on the Danube bank in the Iron Gates gorge
// (as at Lepenski Vir, Vlasac, Schela Cladovei), unlabelled; it sits ~40 km downstream of Lepenski Vir itself, at
// the blue-noise forager dot the front model puts there. Dot counts and deaths are schematic. No year on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FarmedLand, Label, MapPage, WorldSvg, dotScreen, mixColor, toScreen, viewRect, type Cam, type P2 } from "./firstFarmersMap";
import { Germs, Microbe } from "./firstFarmersShared";
import { ACCENT, DARK, DEAD, FRAME_H, FRAME_W, INK, LAND, SEA } from "./firstFarmersTokens";
import { FALL, Farmer, Forager, HideTent, POSES, WALK_CYCLE, farmAnchors, idle, walkAdvance, walkLegs, walk, type FigPose } from "./farmersFigures";
import {
  CAMP,
  CAMP_DOT,
  CLOSE_RIVER,
  COLUMNS,
  DANUBE_PTS,
  DURATION as WORLD_DURATION,
  FORAGER_BASE,
  K_C,
  SWIMMERS,
  TIMELINE,
  camAt,
  campShow,
  closeHaze,
  closeToWorld,
  columnBorn,
  columnDot,
  hazeLayers,
  mapDotsGone,
  mapGone,
  populationAt,
  swimmerAt,
} from "./carryingPathogensWorld";

export const FPS = 30000 / 1001;
export const DURATION = 448;
if (WORLD_DURATION !== DURATION) throw new Error("CarryingPathogens: the world module's DURATION differs");
export const schema = z.object({ vignette: z.number().min(0).max(1) });
export const defaultProps = schema.parse({ vignette: 0.55 });

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smootherV = (v: number) => {
  const x = c01(v);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const sstep = (v: number) => {
  const x = c01(v);
  return x * x * (3 - 2 * x);
};

// ---------------------------------------------------------------------------
// EUROPE: on its word (f92), as in cut F (Fell SC, cap 46, widely spaced), over the land north of the Danube the
// migrants are heading into (upper left at its word; it comes down toward the middle as the camera travels north)
// ---------------------------------------------------------------------------
export const LABEL_AT: P2 = [680, 975];
export const LABEL_APPEAR = 78;

// ---------------------------------------------------------------------------
// THE MAP LAYERS
// ---------------------------------------------------------------------------
/** the plain land page over the map tiles (the close), with the same world-space mottle as MapBase's */
const LandPage: React.FC<{ cam: Cam; amount: number }> = ({ cam, amount }) => {
  if (amount <= 0.002) return null;
  const k = cam.k;
  const view = viewRect(cam, 12);
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const tiles: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = 640 / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const x0 = Math.floor((view.x0 - ox / Math.pow(2, o)) / S) * S + ox / Math.pow(2, o);
    const y0 = Math.floor((view.y0 - oy / Math.pow(2, o)) / S) * S + oy / Math.pow(2, o);
    for (let y = y0; y < view.y1; y += S) for (let x = x0; x < view.x1; x += S) tiles.push({ x, y, s: S, o: op });
  });
  return (
    <AbsoluteFill style={{ opacity: amount }}>
      <AbsoluteFill style={{ backgroundColor: LAND }} />
      <div style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity: 0.9, overflow: "hidden" }}>
        {tiles.map((t, i) => {
          const [sx, sy] = toScreen(cam, t.x, t.y);
          return (
            <Img
              key={`lm-${i}`}
              src={staticFile("firstfarmers/mottle.png")}
              style={{ position: "absolute", left: 0, top: 0, width: 512, height: 512, maxWidth: "none", transformOrigin: "0 0", transform: `translate(${sx.toFixed(2)}px, ${sy.toFixed(2)}px) scale(${((t.s * k * 1.002) / 512).toFixed(5)})`, opacity: t.o }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/** the Danube: a cream engraved line at the wide (1 px at the source to 3 at the delta) that opens, as the camera
 *  goes in, into the river band behind the camp (dark water between cream banks) */
const RIVER_HALF_W = CLOSE_RIVER.half / K_C; // world px: the band's half width at the close
const Danube: React.FC<{ cam: Cam }> = ({ cam }) => {
  const k = cam.k;
  const v = viewRect(cam, 40);
  const step = Math.max(1, Math.floor(1.2 / (0.25 * k)));
  const pts = DANUBE_PTS;
  // visible runs
  const runs: number[][] = [];
  let cur: number[] = [];
  for (let i = 0; i < pts.length; i += step) {
    const p = pts[i];
    const inV = p.x > v.x0 && p.x < v.x1 && p.y > v.y0 && p.y < v.y1;
    if (inV) cur.push(i);
    else if (cur.length) {
      cur.push(i);
      runs.push(cur);
      cur = [];
    }
  }
  if (cur.length) runs.push(cur);
  const real = 2 * RIVER_HALF_W * k; // the band's width on screen
  const widthAt = (w0: number) => Math.sqrt((w0 * Math.pow(k, 0.22)) ** 2 + real * real);
  const water = sstep((widthAt(2.5) - 7) / 14);
  const bank = 2.2;
  const poly = (ids: number[], extra: number) => {
    const L: string[] = [];
    const R: string[] = [];
    ids.forEach((i, q) => {
      const a = pts[ids[Math.max(0, q - 1)]];
      const b = pts[ids[Math.min(ids.length - 1, q + 1)]];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const hw = (widthAt(pts[i].w) / 2 + extra) / k;
      const nx = (-dy / d) * hw;
      const ny = (dx / d) * hw;
      L.push(`${(pts[i].x + nx).toFixed(3)},${(pts[i].y + ny).toFixed(3)}`);
      R.push(`${(pts[i].x - nx).toFixed(3)},${(pts[i].y - ny).toFixed(3)}`);
    });
    return `M${L.join("L")}L${R.reverse().join("L")}Z`;
  };
  // as the map gives way to the page, the river beyond the camp's level run dissolves with it (its bends would
  // otherwise frame the camp like a horseshoe): a radial mask round the camp, solid inside the run
  const g = mapGone(k);
  const R = 7;
  return (
    <g mask={g > 0.002 ? "url(#cp-river)" : undefined}>
      {g > 0.002 ? (
        <defs>
          <radialGradient id="cp-river-g" gradientUnits="userSpaceOnUse" cx={CAMP[0]} cy={CAMP[1]} r={R}>
            <stop offset={0.5} stopColor="#fff" stopOpacity={1} />
            <stop offset={1} stopColor="#fff" stopOpacity={1 - g} />
          </radialGradient>
          <mask id="cp-river" maskUnits="userSpaceOnUse" x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0}>
            <rect x={v.x0} y={v.y0} width={v.x1 - v.x0} height={v.y1 - v.y0} fill="url(#cp-river-g)" />
          </mask>
        </defs>
      ) : null}
      {runs.map((ids, ri) => (
        <g key={ri}>
          <path d={poly(ids, 1.4)} fill={DARK} fillOpacity={0.35} />
          <path d={poly(ids, water * bank * 0.5)} fill={INK} fillOpacity={0.62 + 0.18 * water} />
          {water > 0.01 ? <path d={poly(ids, -bank * 0.5)} fill={SEA} fillOpacity={water} /> : null}
        </g>
      ))}
    </g>
  );
};

/** the dots of the population, with the dead (DEAD, flattened: lying down) */
const Dots: React.FC<{ f: number; cam: Cam; opacity: number }> = ({ f, cam, opacity }) => {
  if (opacity <= 0.002) return null;
  const st = populationAt(f, cam);
  const r = dotScreen(cam.k) / 2 / cam.k;
  const ring = 1.5 / cam.k;
  const one = (key: string, q: { x: number; y: number; tone: number; farmer: boolean; dead: number }) => {
    if (q.dead > 0) {
      // the mark swells to 1.5x as it drains to DEAD, then drops and flattens: lying down
      const d = q.dead;
      const g = smootherV(d / 0.45);
      const fl = smootherV((d - 0.4) / 0.6);
      const fill = mixColor(INK, DEAD, smootherV(d / 0.6));
      const rr = r * (1 + 0.55 * g);
      return <ellipse key={key} cx={q.x} cy={q.y + r * 0.75 * fl} rx={rr * (1 + 0.25 * fl)} ry={rr * (1 - 0.48 * fl)} fill={fill} stroke={DARK} strokeOpacity={0.9} strokeWidth={ring * (1 + 0.8 * g)} />;
    }
    const fill = q.farmer ? ACCENT : q.tone > 0 ? mixColor(INK, ACCENT, q.tone) : INK;
    return <circle key={key} cx={q.x} cy={q.y} r={r} fill={fill} stroke={DARK} strokeOpacity={0.65} strokeWidth={ring} />;
  };
  return (
    <g opacity={opacity}>
      {st.under.filter((q) => q.id !== CAMP_DOT).map((q) => one(`u${q.id}`, q))}
      {st.over.filter((q) => q.id !== CAMP_DOT).map((q) => one(`o${q.id}`, q))}
    </g>
  );
};

/** the camp's own dot: it rides up onto the camp's centre as the camera comes in, and hands over to the figures */
const CAMP_DOT_END = closeToWorld(540, 900);
const CampDot: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const show = 1 - campShow(cam.k);
  if (show <= 0.002) return null;
  const st = populationAt(f, { x: FORAGER_BASE.x[CAMP_DOT], y: FORAGER_BASE.y[CAMP_DOT], k: 1 });
  const q = st.over.find((d) => d.id === CAMP_DOT);
  const base: P2 = q ? [q.x, q.y] : [FORAGER_BASE.x[CAMP_DOT], FORAGER_BASE.y[CAMP_DOT]];
  const u = sstep(Math.log(cam.k / 2.4) / Math.log(4.6 / 2.4));
  const x = base[0] + (CAMP_DOT_END[0] - base[0]) * u;
  const y = base[1] + (CAMP_DOT_END[1] - base[1]) * u;
  const r = dotScreen(cam.k) / 2 / cam.k;
  return <circle cx={x} cy={y} r={r} fill={INK} stroke={DARK} strokeOpacity={0.65} strokeWidth={1.5 / cam.k} opacity={show} />;
};

/** the marching columns: compact bodies of farmer dots */
const Columns: React.FC<{ f: number; cam: Cam; opacity: number }> = ({ f, cam, opacity }) => {
  if (opacity <= 0.002) return null;
  const r = dotScreen(cam.k) / 2 / cam.k;
  const ring = 1.5 / cam.k;
  return (
    <g opacity={opacity}>
      {COLUMNS.map((c) =>
        c.slots.map((_, j) => {
          if (!columnBorn(c, j, f)) return null;
          const [x, y] = columnDot(c, j, f, cam.k);
          return <circle key={`c${c.id}-${j}`} cx={x} cy={y} r={r} fill={ACCENT} stroke={DARK} strokeOpacity={0.7} strokeWidth={ring} />;
        }),
      )}
    </g>
  );
};

/** the legible microbes swimming from the columns to the forager dots */
const Swimmers: React.FC<{ f: number; cam: Cam; opacity: number }> = ({ f, cam, opacity }) => {
  if (opacity <= 0.002) return null;
  return (
    <g opacity={opacity}>
      {SWIMMERS.map((w, i) => {
        const s = swimmerAt(w, f);
        if (!s || s.op <= 0.01) return null;
        return <Microbe key={i} at={[s.x, s.y]} len={(w.len * s.size) / cam.k} angle={w.kind === "rod" ? s.ang : s.ang * 0.3 + 20 * Math.sin(f * 0.03 + w.seed)} kind={w.kind} n={w.n} wave={f * 0.32 + w.seed} opacity={s.op} />;
      })}
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CLOSE: the forager camp on the Danube (close px: = screen px at the close camera)
// ---------------------------------------------------------------------------
type Person = { id: string; woman?: boolean; child?: boolean; at: P2; scale: number; dir: 1 | -1; die?: number; spear?: boolean; seed: number };
/** three depths on the bank: rear, middle, front (feet y, scale); the front is ~375 px tall */
const ROW = { C: { y: 946, s: 0.72 }, B: { y: 993, s: 0.94 }, A: { y: 1040, s: 1.3 } };
/** the camp's six: four die one after another, left to right (the haze comes down the river from the west, screen
 *  left, where the column is); the left-hand ones fall to the left, the right-hand ones to the right, and the two
 *  survivors stand between them. The child is 0.65 of the woman's height. */
const CHILD_S = (ROW.A.s * 0.65 * 298) / 232;
export const CAMP_PEOPLE: Person[] = [
  { id: "c1", at: [648, ROW.C.y], scale: ROW.C.s, dir: 1, die: 364, spear: true, seed: 1 },
  { id: "b2", at: [374, ROW.B.y], scale: ROW.B.s, dir: -1, die: 336, spear: true, seed: 7 },
  { id: "b1", woman: true, at: [754, ROW.B.y], scale: ROW.B.s, dir: 1, die: 378, seed: 2 },
  { id: "a1", at: [440, ROW.A.y], scale: ROW.A.s, dir: -1, die: 350, spear: true, seed: 3 },
  // the two who survive
  { id: "s1", woman: true, at: [628, ROW.A.y], scale: ROW.A.s, dir: -1, seed: 5 },
  { id: "s2", child: true, at: [552, ROW.A.y], scale: CHILD_S, dir: 1, seed: 6 },
];
const poseOf = (p: Person, f: number): FigPose => {
  const base = p.spear ? POSES.spear(p.dir) : POSES.stand(p.dir);
  return idle(base, f, p.seed);
};
const fallOf = (p: Person, f: number) => (p.die === undefined ? 0 : c01((f - p.die) / FALL.frames));

/** the cause of each death at the close: two legible microbes swim in out of the haze from the west (screen left),
 *  head first, and sink into him or her; the first lands 3 frames before the stoop begins (p.die) */
type CloseSwim = { from: P2; ctrl: P2; who: number; f0: number; f1: number; len: number; seed: number };
export const CLOSE_SWIMS: CloseSwim[] = CAMP_PEOPLE.flatMap((p, who) => {
  if (p.die === undefined) return [];
  const chest = farmAnchors("forager", poseOf(p, p.die), p.at, p.scale, p.woman, p.child).chest;
  return [0, 1].map((q) => {
    const from: P2 = [chest[0] - 330 - 70 * q, chest[1] - 150 + 210 * q];
    const ctrl: P2 = [(from[0] + chest[0]) / 2 - 30, (from[1] + chest[1]) / 2 + (q ? 50 : -60)];
    const f1 = p.die! - 3 + 7 * q;
    return { from, ctrl, who, f0: f1 - 54, f1, len: 40 + 6 * q, seed: who * 3 + q };
  });
});
const CloseSwimmers: React.FC<{ f: number; op: number; front: boolean }> = ({ f, op, front }) => (
  <g opacity={op}>
    {CLOSE_SWIMS.map((w, i) => {
      if (f < w.f0 || f > w.f1 + 6) return null;
      if ((CAMP_PEOPLE[w.who].scale >= ROW.A.s) !== front) return null;
      const p = CAMP_PEOPLE[w.who];
      const to = farmAnchors("forager", poseOf(p, f), p.at, p.scale, p.woman, p.child).chest;
      const t = c01((f - w.f0) / (w.f1 - w.f0));
      const e = t;
      const q = 1 - e;
      const x = q * q * w.from[0] + 2 * q * e * w.ctrl[0] + e * e * to[0];
      const y = q * q * w.from[1] + 2 * q * e * w.ctrl[1] + e * e * to[1];
      const dx = 2 * q * (w.ctrl[0] - w.from[0]) + 2 * e * (to[0] - w.ctrl[0]);
      const dy = 2 * q * (w.ctrl[1] - w.from[1]) + 2 * e * (to[1] - w.ctrl[1]);
      const out = sstep((f - w.f0) / 8);
      const sink = 1 - sstep((f - w.f1) / 6);
      return <Microbe key={i} at={[x, y]} len={w.len * (0.4 + 0.6 * sink)} angle={(Math.atan2(dy, dx) * 180) / Math.PI} kind="rod" n={w.seed % 2 ? 3 : 2} wave={f * 0.32 + w.seed} opacity={0.95 * out * sink} />;
    })}
  </g>
);

/** the hearth: a ring of stones, crossed logs, licking cream flames, a few sparks rising and a thin smoke curl */
const Hearth: React.FC<{ at: P2; f: number; s: number }> = ({ at, f, s }) => {
  const stones = Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI * (0.04 + (0.92 * i) / 7);
    return [Math.cos(a) * 52, 5 - Math.sin(a) * 9] as P2;
  });
  // a tongue: a slim S-curved blade of flame, its tip licking side to side
  const tongue = (x: number, h: number, w: number, ph: number) => {
    const lick = 9 * Math.sin(f * 0.23 + ph) + 4 * Math.sin(f * 0.51 + ph * 1.7);
    const hh = h * (0.85 + 0.15 * Math.sin(f * 0.29 + ph * 2.3));
    const tx = x + lick;
    return `M${x - w},-2C${x - w * 1.2},${-hh * 0.35} ${x - w * 0.1 + lick * 0.2},${-hh * 0.55} ${tx - w * 0.15},${-hh * 0.8}Q${tx - w * 0.05},${-hh * 0.92} ${tx},${-hh}Q${tx + w * 0.35},${-hh * 0.72} ${x + w * 0.55 + lick * 0.35},${-hh * 0.5}C${x + w * 1.1},${-hh * 0.32} ${x + w * 1.1},${-hh * 0.12} ${x + w},-2Z`;
  };
  const sparks = Array.from({ length: 4 }, (_, i) => {
    const per = 34 + 9 * i;
    const t = ((f + i * 13) % per) / per;
    return { x: (i - 1.5) * 9 + 14 * Math.sin(t * 5 + i), y: -60 - 90 * t, o: Math.sin(Math.PI * t) };
  });
  let smoke = "";
  for (let j = 0; j <= 14; j++) {
    const u = j / 14;
    smoke += `${j ? "L" : "M"}${(4 + 16 * Math.sin(u * 5 + f * 0.04) * u).toFixed(1)},${(-92 - u * 150).toFixed(1)}`;
  }
  return (
    <g transform={`translate(${at[0]} ${at[1]}) scale(${s})`}>
      <ellipse cx={0} cy={4} rx={62} ry={11} fill={DARK} fillOpacity={0.45} />
      <path d={smoke} fill="none" stroke={INK} strokeOpacity={0.22} strokeWidth={3} strokeLinecap="round" />
      <path d="M-38,0L36,-11M-34,-11L40,2" stroke={DARK} strokeWidth={14} strokeLinecap="round" />
      <path d="M-38,0L36,-11M-34,-11L40,2" stroke="#6A5838" strokeWidth={8} strokeLinecap="round" />
      <g stroke={DARK} strokeWidth={3} strokeLinejoin="round" fill={INK}>
        <path d={tongue(-18, 46, 11, 2.1)} />
        <path d={tongue(20, 54, 12, 4.2)} />
        <path d={tongue(0, 84, 16, 0)} />
      </g>
      <path d={tongue(1, 46, 7, 1.1)} fill="#B9AD8D" />
      {sparks.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.4} fill={INK} opacity={0.8 * p.o} />
      ))}
      {stones.map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={12} ry={8} fill="#2A2119" stroke={INK} strokeOpacity={0.8} strokeWidth={2} />
      ))}
    </g>
  );
};

/** the far wall of the Iron Gates gorge above the river: two rock planes in receding umber with a cream ridge line,
 *  higher toward the frame sides */
const Gorge: React.FC<{ op: number }> = ({ op }) => {
  if (op <= 0.002) return null;
  const ridge = (y0: number, amp: number, seed: number, rise: number) => {
    const pts: P2[] = [];
    for (let i = 0; i <= 120; i++) {
      const x = -2400 + (i / 120) * 5880;
      const u = (x - 540) / 600;
      const y = y0 + amp * (0.55 * Math.sin(u * 4.1 + seed) + 0.25 * Math.sin(u * 9.3 + seed * 2) + 0.08 * Math.sin(u * 23 + seed)) - rise * Math.min(1, u * u);
      pts.push([x, y]);
    }
    return pts;
  };
  const P = (p: P2) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const plane = (pts: P2[], base: number) => `M${pts.map(P).join("L")}L3480,${base}L-2400,${base}Z`;
  const line = (pts: P2[]) => `M${pts.map(P).join("L")}`;
  const far = ridge(300, 40, 1.3, 120);
  const near = ridge(470, 46, 4.1, 260);
  return (
    <g opacity={op}>
      <path d={plane(far, 836)} fill="#382E23" />
      <path d={line(far)} fill="none" stroke={INK} strokeOpacity={0.26} strokeWidth={2.2} strokeLinejoin="round" />
      <path d={plane(near, 836)} fill="#2E251B" />
      <path d={line(near)} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={6} strokeLinejoin="round" />
      <path d={line(near)} fill="none" stroke={INK} strokeOpacity={0.5} strokeWidth={2.4} strokeLinejoin="round" />
    </g>
  );
};

/** the river band at the close: engraved water-lines drifting downstream (east, screen right) */
const WaterLines: React.FC<{ f: number }> = ({ f }) => {
  const rows = [-22, -9, 4, 16, 27];
  return (
    <g fill="none" stroke={INK} strokeLinecap="round">
      {rows.map((dy, i) => {
        const y = CLOSE_RIVER.y + dy;
        const off = (f * (0.5 + 0.12 * i) + i * 97) % 160;
        let d = "";
        for (let x = -160 + off; x < 1240; x += 160) {
          const l = 60 + 30 * Math.sin(i * 3.1 + x * 0.01);
          d += `M${x.toFixed(1)},${y.toFixed(1)}l${l.toFixed(1)},0`;
        }
        return <path key={i} d={d} strokeWidth={1.6} strokeOpacity={0.28 - 0.03 * i} />;
      })}
    </g>
  );
};

/** the bank the camp stands on: sparse engraved ground strokes thinning toward us */
const Bank: React.FC = () => {
  let d = "";
  for (let r = 0; r < 4; r++) {
    const y = 926 + r * 34 + r * r * 8;
    const gap = 26 + r * 12;
    for (let x = 10 + ((r * 37) % gap); x < 1080; x += gap) {
      const l = 16 - r * 2.4;
      d += `M${(x - l / 2).toFixed(1)},${(y + 2).toFixed(1)}L${(x + l / 2).toFixed(1)},${(y - 2).toFixed(1)}`;
    }
  }
  return <path d={d} fill="none" stroke={INK} strokeWidth={1.4} strokeOpacity={0.3} strokeLinecap="round" />;
};

/** the farmers arriving at the far (west) edge of the clearing along the bank (orange, small: still distant), walking
 *  from f345 (off frame until ~f385) */
const ARRIVE = { f0: 345, s: 0.5, y: 926 };
const ARRIVALS: { x0: number; woman?: boolean; hoe?: boolean; seed: number }[] = [
  { x0: -112, hoe: true, seed: 1 },
  { x0: -214, woman: true, seed: 2 },
  { x0: -324, hoe: true, seed: 3 },
];
const arrivalAt = (a: (typeof ARRIVALS)[number], f: number) => {
  const t = Math.max(0, f - ARRIVE.f0);
  const x = a.x0 + walkAdvance(ARRIVE.s) * t;
  const ph = t / WALK_CYCLE + a.seed * 0.31;
  const pose = a.hoe ? walkLegs(POSES.hoeShoulder(1), ph) : walk(POSES.stand(1), ph);
  return { at: [x, ARRIVE.y] as P2, pose };
};

const Camp: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const show = campShow(cam.k);
  if (show <= 0.002) return null;
  const kl = cam.k / K_C; // screen px per close px
  const [ax, ay] = toScreen(cam, CAMP[0], CAMP[1]);
  const tf = `translate(${ax.toFixed(3)} ${ay.toFixed(3)}) scale(${kl.toFixed(6)}) translate(-540 -1040)`;
  const haze = closeHaze(cam.k);
  const people = CAMP_PEOPLE;
  const fig = (p: Person) => (
    <Forager key={p.id} uid={`cp-${p.id}`} pose={poseOf(p, f)} at={p.at} scale={p.scale} woman={p.woman} child={p.child} hold={p.spear ? "spear" : "none"} fall={fallOf(p, f)} fallDir={p.dir} seed={p.seed} />
  );
  const targets = people.map((p) => farmAnchors("forager", poseOf(p, f), p.at, p.scale, p.woman, p.child).chest);
  // they walk in from beyond the left edge from ARRIVE.f0 (not drawn before: at a wider zoom they would stand in view)
  const arrivals = f >= ARRIVE.f0 ? ARRIVALS.map((a) => ({ a, ...arrivalAt(a, f) })) : [];
  const farmerSources = arrivals.map(({ a, pose, at }) => {
    const g = farmAnchors("farmer", pose, at, ARRIVE.s, a.woman).germ;
    return { at: g.at, rx: g.rx, ry: g.ry, rate: 0.9, from: ARRIVE.f0 - 40 };
  });
  return (
    <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0, opacity: show }}>
      <g transform={tf}>
        <Gorge op={sstep(Math.log(cam.k / 30) / Math.log(90 / 30))} />
        <WaterLines f={f} />
        <Bank />
        <HideTent at={[952, 942]} scale={0.58} open={0.5} uid="cp-t1" seed={2} />
        <HideTent at={[228, 940]} scale={0.5} open={0.4} uid="cp-t2" seed={5} />
        {haze > 0.002 ? <Germs frame={f} k={kl} sources={farmerSources} life={150} spread={0.5} drift={[1.1, 0]} wander={26} mote={2.4} microbe={38} microbeShare={0.01} opacity={haze} seed={71} /> : null}
        {arrivals.map(({ a, pose, at }, i) => (
          <Farmer key={`fa${i}`} uid={`cp-fa${i}`} pose={idle(pose, f, a.seed)} at={at} scale={ARRIVE.s} woman={a.woman} hold={a.hoe ? "hoe" : "none"} seed={a.seed} />
        ))}
        {fig(people[0])}
        {haze > 0.002 ? (
          <Germs
            frame={f}
            k={kl}
            sources={[
              { at: [-100, 700], rx: 120, rate: 1.05, until: 400 },
              { at: [-140, 880], rx: 120, rate: 1.05, until: 392 },
            ]}
            life={300}
            spread={0.9}
            drift={[2.6, -0.04]}
            wander={40}
            targets={targets}
            travel={0.6}
            travelAt={30}
            travelTime={150}
            settle={55}
            mote={2.1}
            microbe={40}
            microbeShare={0.008}
            rodShare={0.18}
            opacity={haze * 0.65}
            seed={73}
          />
        ) : null}
        {fig(people[1])}
        {fig(people[2])}
        <Hearth at={[890, 1036]} f={f} s={1.2} />
        <CloseSwimmers f={f} op={haze} front={false} />
        {people.slice(3).map(fig)}
        <CloseSwimmers f={f} op={haze} front />
      </g>
    </svg>
  );
};

// ---------------------------------------------------------------------------
const CarryingPathogens: React.FC<z.infer<typeof schema>> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const T = TIMELINE.dateAt(frame);
  const gone = mapGone(cam.k);
  const mapOp = 1 - gone;
  const dotsOp = 1 - mapDotsGone(cam.k);
  const hazeOp = 1 - sstep(Math.log(cam.k / 12) / Math.log(30 / 12));
  return (
    <MapPage cam={cam} vignette={vignette}>
      <LandPage cam={cam} amount={gone} />
      <WorldSvg cam={cam}>
        <FarmedLand T={T} cam={cam} id="cp" wash={0.3} hatch={0.45} opacity={mapOp} />
        <Danube cam={cam} />
        <Dots f={frame} cam={cam} opacity={dotsOp} />
        <CampDot f={frame} cam={cam} />
        <Columns f={frame} cam={cam} opacity={dotsOp} />
        {hazeOp > 0.002 ? hazeLayers(frame, cam.k).map((g) => <Germs key={g.seed} {...g} opacity={hazeOp} />) : null}
        <Swimmers f={frame} cam={cam} opacity={hazeOp} />
        <Label x={LABEL_AT[0]} y={LABEL_AT[1]} text="EUROPE" appear={LABEL_APPEAR} frame={frame} cam={cam} cap={46} spacing={0.34} opacity={1 - sstep(Math.log(cam.k / 5) / Math.log(9 / 5))} />
      </WorldSvg>
      <Camp f={frame} cam={cam} />
    </MapPage>
  );
};

export default CarryingPathogens;
