// ---------------------------------------------------------------------------
// sugarE: ACT E of "SarahWar_Britain_let_America_go_to_keep_its_sugar_islands"
// (Dwarkesh with Sarah Paine; Dwarkesh map style) on THE SUGAR WORLD (sugarShared).
// Owned by builder E. Composed by sugarScene.tsx; rendered by cut E KeepTheCaribbean
// (g1679..1826 = story s1186..1333; s = g - 493).
//
// E "And the British decide, get rid of the revolting colonies. They aren't much in
//    this day and keep things in the Caribbean."
//
// ORANGE = THE SIDE AT WAR WITH BRITAIN (here: the colonies, left wholly orange).
// Britain, its army and the islands it keeps are CREAM.
//
// GESTURES (story frames s), each with its word:
//  E0 "And the British decide" g1684-1696: from D's last frame (pulling back from
//     India) the camera keeps pulling back to the world - Mississippi to India, every
//     mark of D's global war in frame (T.out, van Wijk-Nuij) - and, overlapping it,
//     glides west and down onto the colonies + the western Atlantic (T.hop, van
//     Wijk-Nuij; New York upper centre, k 0.62). Centre-pan peak ~43 px/f (the
//     India -> America distance in ~64 frames; the scene's motion blur covers it).
//  E1 "get rid of the revolting colonies" g1713-1734: Britain's faint cream wash over
//     the colonies (there since A) withdraws seaward behind a crisp front (T.wash),
//     and the cream army enclave at New York (B's, handed off at s1186 from its exact
//     AB_END positions) gathers into one compact body and lifts off down the Narrows
//     (T.gather, T.depart): the colonies are left wholly orange.
//  E2 "They aren't much in this day" g1750-1785: the column sails south past Cape
//     Hatteras into the open Atlantic east of the Bahamas; the camera glides ahead of
//     it (one long move, T.follow), leading, never chasing.
//  E3 "and keep things in the Caribbean" g1791-1814: the column forks past the Bahamas: one
//     half through the Windward Passage to Jamaica, the other outside the Antilles to
//     Antigua and Barbados (the rear ranks stop at Antigua). Each body settles round
//     its island inside a thin cream ring that draws as it arrives, and the island
//     brightens from the 0.45 cream of D to full cream (arrivals keyed to "keep" /
//     "things" / "Caribbean"). CARIBBEAN (IM Fell SC, spaced caps) lands on
//     "Caribbean" g1814. End framing: the Antilles arc across the column (Jamaica's ring
//     left .. Barbados' right, mid-height on y835, k 1.15); the hold creeps (~3.5 %) to
//     the end; the garrisons drift. CD's polity fills stay at its tour rung (0.3), so
//     the kept islands, their rings and the men are the brightest things.
//  Nothing else.
//
// THE ISLANDS lit are the three Britain held through the whole war - Jamaica, Antigua,
// Barbados. Dominica (1778), St Vincent, Grenada (1779), Tobago (1781), St Kitts, Nevis,
// Montserrat (Feb 1782) and the Bahamas (May 1782) all fell, so they keep D's state.
// SOURCES: notes/E_FACTS.md (dates, routes, URLs): Capture of St Lucia (Grant's 5,000,
// Sandy Hook 4 Nov 1778 -> Barbados 10 Dec 1778) https://en.wikipedia.org/wiki/Capture_of_St._Lucia ;
// Anglo-French War (1778-1783) https://en.wikipedia.org/wiki/Anglo-French_War_(1778%E2%80%931783) ;
// Siege of Brimstone Hill https://en.wikipedia.org/wiki/Siege_of_Brimstone_Hill ;
// Capture of Montserrat https://en.wikipedia.org/wiki/Capture_of_Montserrat ;
// Capture of the Bahamas (1782) https://en.wikipedia.org/wiki/Capture_of_the_Bahamas_(1782) ;
// the 1782 evacuations: https://www.georgiaencyclopedia.org/articles/history-archaeology/revolutionary-war-in-georgia/ ,
// https://pmccandless.substack.com/p/the-british-evacuate-charleston-december .
// Island outlines: Natural Earth 10m (scripts/build-sugarE-islands.mjs -> sugarEIslands.ts).
// Routes: sugarEData.ts (plausible sail-era sea paths; checked clear of land).
// ---------------------------------------------------------------------------
import React from "react";
import { AB_END, menR } from "./sugarAB";
import { camCD } from "./sugarCD";
import { ROUTES_LL, type LL } from "./sugarEData";
import { ISLANDS } from "./sugarEIslands";
import {
  type Act,
  type ActProps,
  CUT_S,
  COLONIES_D,
  COLONY_COAST,
  COLONY_INNER_D,
  COLONY_OUTER_D,
  type Dot,
  Dots,
  Fill,
  type Framing,
  HANDOFF,
  INK,
  InkLine,
  LABEL_LEAD,
  Label,
  type Move,
  type P2,
  RUNG,
  Ring,
  OrangeLine,
  TOUR_RUNG,
  W_ORANGE,
  dOf,
  ramp,
  blueNoise,
  dotR,
  easeInOutSine,
  extendCamTrack,
  lerp,
  makeTrack,
  menDrift,
  project,
  revealHalfPlane,
  smoothRoute,
  smoothstep,
  sw,
} from "./sugarShared";

const P = (ll: LL): P2 => project(ll[0], ll[1]);
const S0 = CUT_S.E.s0; // 1186

// ---------------------------------------------------------------------------
// TIMING (story frames; E: s = g - 493)
// ---------------------------------------------------------------------------
export const T = {
  out: [S0, 1220] as [number, number], // pull-out to the world (all of D's marks)
  hop: [1210, 1250] as [number, number], // glide down onto the colonies
  wash: [sw(1713) - 3, sw(1734) - 2] as [number, number], // "get rid of ... colonies"
  depart: sw(1713), // the enclave starts to file out through the Narrows on "get rid of"
  restore: [1214, 1238] as [number, number], // the colonies back to full as the glide brings them in
  close: [sw(1716), sw(1734) + 2] as [number, number], // the militia close over the harbour behind the column
  follow: [1232, 1312] as [number, number],
  creep: [1302, 1352] as [number, number],
  caribbean: sw(1814) - LABEL_LEAD,
  ringDraw: 14,
  bright: 14,
};

// ---------------------------------------------------------------------------
// ROUTES and places (world px)
// ---------------------------------------------------------------------------
const TRUNK = ROUTES_LL.trunk.map(P);
export const ROUTE_W = smoothRoute([...TRUNK, ...ROUTES_LL.west.map(P)], 3);
export const ROUTE_E = smoothRoute([...TRUNK, ...ROUTES_LL.east.map(P)], 3);
const ENC_C = AB_END.enclave.c as P2;
/** arclength of the point of a route nearest p */
const nearestS = (route: typeof ROUTE_W, p: P2) => {
  let best = 0;
  let bd = Infinity;
  for (let s = 0; s <= route.len; s += 1) {
    const q = route.pointAt(s);
    const d = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2;
    if (d < bd) [bd, best] = [d, s];
  }
  return best;
};
const S_ENC = nearestS(ROUTE_W, ENC_C); // the body's centre at lift-off
const S_FORK = nearestS(ROUTE_W, P(ROUTES_LL.trunk[ROUTES_LL.trunk.length - 2])); // routes identical up to here
const S_SPLIT = nearestS(ROUTE_W, P(ROUTES_LL.trunk[ROUTES_LL.trunk.length - 1])); // where they part

type IslandKey = keyof typeof ISLANDS;
const ISL: Record<IslandKey, { c: P2; d: string }> = {
  jamaica: { c: ISLANDS.jamaica.c as unknown as P2, d: ISLANDS.jamaica.d },
  // Antigua itself (Barbuda, its dependency, is in the outline but the garrison sits on Antigua)
  antigua: { c: project(-61.8, 17.07), d: ISLANDS.antigua.d },
  barbados: { c: ISLANDS.barbados.c as unknown as P2, d: ISLANDS.barbados.d },
};

// ---------------------------------------------------------------------------
// THE CAMERA = CD's track extended
// ---------------------------------------------------------------------------
const Fr = (lon: number, lat: number, k: number, sx = 540, sy = 835): Framing => ({ p: project(lon, lat), k, sx, sy });
/** E0 the world: Mississippi to India, every mark of D's global war in frame (D0's wide) */
const F_WORLD = Fr(-4, 25, 0.1436);
/** E1 the colonies + the western Atlantic (New York upper centre) */
const F_COLONIES = Fr(-74.05, 40.66, 0.62, 590, 640);
/** E3 the islands: Jamaica left, Antigua + Barbados right, centred on y835 */
/** E3 the Antilles arc across the column: Jamaica's ring left .. Barbados' ring right
 *  centred on x540, the Jamaica-Barbados mid-height on y835 (k 1.15 -> creep 1.19,
 *  under the 1.25 band; the rings span ~940 px) */
const K_END = 1.15;
const F_ISLANDS: Framing = {
  p: [(ISL.jamaica.c[0] - 50 + ISL.barbados.c[0] + 35) / 2, (ISL.jamaica.c[1] + ISL.barbados.c[1]) / 2],
  k: K_END,
  sx: 540,
  sy: 835,
};
const F_CREEP: Framing = { ...F_ISLANDS, k: K_END * 1.035 };
export const camE = extendCamTrack(
  camCD,
  [F_WORLD, F_COLONIES, F_ISLANDS, F_CREEP],
  [
    { from: T.out[0], to: T.out[1], path: "vw", rho: 1.6, taper: 0.5 },
    { from: T.hop[0], to: T.hop[1], path: "vw", rho: 1.2, taper: 0.6 },
    { from: T.follow[0], to: T.follow[1], taper: 0.85 },
    { from: T.creep[0], to: T.creep[1], taper: 1 },
  ] satisfies Move[],
);

// ---------------------------------------------------------------------------
// THE ARMY: 128 dots (AB's enclave) -> one compact column -> three garrisons
// ---------------------------------------------------------------------------
const N = AB_END.enclave.dots.length; // 128
const ENC = AB_END.enclave.dots as P2[];
/** the body: blue noise in an ellipse (a along: +1 head .. -1 tail; b across, |b| <= BODY_A:
 *  + = right of the heading = west on a southward course); world offsets = (a, b) x BODY_L */
const BODY_L = 150; // half-length of the column at sea, world px
const BODY_A = 46 / 150; // half-width / half-length
const BODY: P2[] = blueNoise(N, { x0: -1, y0: -BODY_A, x1: 1, y1: BODY_A }, ([a, b]) => a * a + (b / BODY_A) ** 2 <= 1, 1783, 30);
const assign = (starts: P2[], targets: P2[]) => {
  const d2 = (a: P2, b: P2) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const asg = starts.map((_, i) => i);
  for (let pass = 0; pass < 30; pass++) {
    let improved = false;
    for (let i = 0; i < asg.length; i++)
      for (let j = i + 1; j < asg.length; j++) {
        const now = d2(starts[i], targets[asg[i]]) + d2(starts[j], targets[asg[j]]);
        const alt = d2(starts[i], targets[asg[j]]) + d2(starts[j], targets[asg[i]]);
        if (alt < now - 1e-6) {
          [asg[i], asg[j]] = [asg[j], asg[i]];
          improved = true;
        }
      }
    if (!improved) break;
  }
  return asg;
};
const frameAt = (route: typeof ROUTE_W, s: number) => {
  const a = route.pointAt(s - 40);
  const b = route.pointAt(s + 40);
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return { p: route.pointAt(s), t: [(b[0] - a[0]) / l, (b[1] - a[1]) / l] as P2 };
};
const along = (route: typeof ROUTE_W, s: number, lat: number): P2 => {
  const { p, t } = frameAt(route, s);
  return [p[0] - t[1] * lat, p[1] + t[0] * lat];
};
/** the enclave files out through the Narrows: dot j waits on its enclave slot until its
 *  place in the column reaches the harbour (OUT_LEAD world px before it), then joins */
const OUT_LEAD = 25;
const OUT_RUN = 70;
// assignment: enclave dot j -> body slot, against the column just clear of the harbour
// (the southern dots of the enclave take the head)
const SLOT_OF = assign(
  ENC,
  BODY.map(([a, b]) => along(ROUTE_W, S_ENC + BODY_L + 30 + a * BODY_L, b * BODY_L)),
); // SLOT_OF[j] = body index of enclave dot j

// the three groups (by body slot): west half -> Jamaica; east half: front -> Barbados, rear -> Antigua
type G = "jamaica" | "antigua" | "barbados";
const GROUP: G[] = (() => {
  const idx = BODY.map((_, i) => i);
  const byB = idx.slice().sort((i, j) => BODY[j][1] - BODY[i][1]);
  const west = new Set(byB.slice(0, 64));
  const east = byB.slice(64).sort((i, j) => BODY[i][0] - BODY[j][0]); // rear first
  const ant = new Set(east.slice(0, 24));
  return idx.map((i) => (west.has(i) ? "jamaica" : ant.has(i) ? "antigua" : "barbados"));
})();
const ROUTE_OF: Record<G, typeof ROUTE_W> = { jamaica: ROUTE_W, antigua: ROUTE_E, barbados: ROUTE_E };
/** each group's body centre (unit-disc coords) for re-centring after the fork */
const GC: Record<G, P2> = (() => {
  const acc: Record<G, [number, number, number]> = { jamaica: [0, 0, 0], antigua: [0, 0, 0], barbados: [0, 0, 0] };
  BODY.forEach(([a, b], i) => {
    const q = acc[GROUP[i]];
    q[0] += a;
    q[1] += b;
    q[2]++;
  });
  return Object.fromEntries(Object.entries(acc).map(([k, q]) => [k, [q[0] / q[2], q[1] / q[2]]])) as Record<G, P2>;
})();
const DEST_S: Record<G, number> = {
  jamaica: ROUTE_W.len,
  antigua: nearestS(ROUTE_E, ISL.antigua.c),
  barbados: ROUTE_E.len,
};
// the garrisons: blue-noise discs round each island (spacing ~10.5 world px)
const GAR_R: Record<G, number> = { jamaica: 50, antigua: 27, barbados: 35 };
const GAR_CENTRE: Record<G, P2> = {
  jamaica: ISL.jamaica.c,
  antigua: ISL.antigua.c,
  barbados: ISL.barbados.c,
};
const GARRISON: Record<G, P2[]> = (() => {
  const out = {} as Record<G, P2[]>;
  (["jamaica", "antigua", "barbados"] as G[]).forEach((g, gi) => {
    const n = GROUP.filter((q) => q === g).length;
    const c = GAR_CENTRE[g];
    const R = GAR_R[g];
    out[g] = blueNoise(n, { x0: c[0] - R, y0: c[1] - R, x1: c[0] + R, y1: c[1] + R }, (p) => Math.hypot(p[0] - c[0], p[1] - c[1]) <= R, 1782 + gi * 7, 30);
  });
  return out;
})();

// THE CRUISE: one shared distance along the routes (a velocity bump: accelerate out of
// the Narrows, cruise); past the fork each group runs at its own pace (the east branch
// is longer) and eases into its port
const CRUISE_V = 17.6; // world px / f
const cruise = makeTrack([[T.depart, 1500, CRUISE_V * (1500 - T.depart) * 0.95, 0.1]], 0, 1100, 1520, 2);
const PACE: Record<G, number> = { jamaica: 0.97, antigua: 1.12, barbados: 1.12 };
const FORK_W = 140; // world px over which the pace changes
/** each group's body past the fork, as a share of the column's length / width (narrow
 *  enough for the Windward Passage) */
const FORK_ALONG = 0.6;
const FORK_ACROSS = 0.5;
const EASE_IN = 70; // world px: the approach into port (exponential ease-out)
/** a group's centre arclength at s (the centre of the GROUP: the body centre plus the
 *  group's own offset in the body, so the groups never overlap as they part) */
const centreS = (g: G, s: number) => {
  const x = S_ENC - BODY_L - OUT_LEAD + cruise(s) + GC[g][0] * BODY_L;
  let y = x;
  const u = x - S_FORK;
  if (u > 0) {
    const m = PACE[g];
    y = S_FORK + (u < FORK_W ? u + ((m - 1) * u * u) / (2 * FORK_W) : u * m - ((m - 1) * FORK_W) / 2);
  }
  const D = DEST_S[g];
  const j = D - EASE_IN;
  return y <= j ? y : D - EASE_IN * Math.exp(-(y - j) / EASE_IN);
};
/** 0 -> 1 as a group's centre passes the fork: the groups close up into compact bodies */
const forkU = (g: G, s: number) => smoothstep((centreS(g, s) - S_SPLIT + 30) / 200);
/** the groups close up along the route BEFORE the split, so they part as compact bodies */
const closeU = (g: G, s: number) => smoothstep((centreS(g, s) - S_SPLIT + 300) / 240);
/** the army at story frame s (world px; index-stable over the 128 enclave dots) */
export const armyE = (s: number, k: number): Dot[] => {
  const rEnc = menR(k); // AB's beachhead dot size
  const rSea = Math.max(dotR(k), menR(k));
  return ENC.map((e0, j) => {
    const dr = menDrift(j, s, k, 0.7);
    const encP: P2 = [e0[0] + dr[0], e0[1] + dr[1]];
    if (s < T.depart) return { x: encP[0], y: encP[1], t: 0, r: rEnc };
    const bi = SLOT_OF[j];
    const g = GROUP[bi];
    const route = ROUTE_OF[g];
    const [a0, b0] = BODY[bi];
    // offsets from the GROUP's centre; past the fork each group closes up into a narrow body
    const fork = forkU(g, s);
    const sj = centreS(g, s) + (a0 - GC[g][0]) * BODY_L * lerp(1, FORK_ALONG, closeU(g, s));
    const lat = (b0 - GC[g][1] * fork) * BODY_L * lerp(1, FORK_ACROSS, fork);
    const bodyP = along(route, Math.max(sj, S_ENC - OUT_LEAD), lat);
    // into the garrison as the group's centre closes on its port
    const set = smoothstep((centreS(g, s) - (DEST_S[g] - 2.2 * EASE_IN)) / (1.9 * EASE_IN));
    const gp = GARRISON[g][GROUP_INDEX[j]];
    const target: P2 = set > 0 ? [lerp(bodyP[0], gp[0], set), lerp(bodyP[1], gp[1], set)] : bodyP;
    // leaving the enclave as its place in the column reaches the harbour
    const w = smoothstep((sj - (S_ENC - OUT_LEAD)) / OUT_RUN);
    const sd = menDrift(j + 300, s, k, 0.7 * set);
    return {
      x: lerp(encP[0], target[0], w) + sd[0],
      y: lerp(encP[1], target[1], w) + sd[1],
      t: 0,
      r: lerp(rEnc, rSea, w),
    };
  });
};
// each dot's index within its group's garrison (2-opt: arrival order -> slots)
const GROUP_INDEX: number[] = (() => {
  const out = new Array<number>(N).fill(0);
  (["jamaica", "antigua", "barbados"] as G[]).forEach((g) => {
    const js = ENC.map((_, j) => j).filter((j) => GROUP[SLOT_OF[j]] === g);
    // where each dot would be on arrival with no settling
    const route = ROUTE_OF[g];
    const D = DEST_S[g];
    const starts = js.map((j) => {
      const [a0, b0] = BODY[SLOT_OF[j]];
      return along(route, D - EASE_IN * 0.6 + (a0 - GC[g][0]) * BODY_L * FORK_ALONG, (b0 - GC[g][1]) * BODY_L * FORK_ACROSS);
    });
    const asg = assign(starts, GARRISON[g]);
    js.forEach((j, i) => (out[j] = asg[i]));
  });
  return out;
})();
/** the story frame each group's centre reaches its port (within 6 world px) */
const ARRIVE: Record<G, number> = (() => {
  const out = {} as Record<G, number>;
  (["jamaica", "antigua", "barbados"] as G[]).forEach((g) => {
    let f = T.depart;
    while (f < 1500 && centreS(g, f) < DEST_S[g] - 0.45 * EASE_IN) f += 0.25;
    out[g] = f;
  });
  return out;
})();
export const E_ARRIVE = ARRIVE;

// ---------------------------------------------------------------------------
// THE LAYERS
// ---------------------------------------------------------------------------
/** Britain's wash over the colonies withdraws seaward: the covered side of a front
 *  that runs from the interior (NW) out past the coast (SE) */
const WASH_N: P2 = [-0.6, -0.8]; // unit, pointing inland (the way the uncovered side grows)
const washReveal = (s: number) => {
  const u = easeInOutSine((s - T.wash[0]) / (T.wash[1] - T.wash[0]));
  return revealHalfPlane(ENC_C, WASH_N, lerp(900, -160, u));
};
/** THE COLONIES (handed over from AB at HANDOFF.colonies, at D's tour rung 0.3): their
 *  orange wash, dashed land edge, orange coast, inner lines and militia come back to full
 *  as the camera brings them in (T.restore) - they are the subject of "revolting colonies" */
const COAST_D = COLONY_COAST.map((l) => dOf(l)).join("");
const colRung = (s: number) => lerp(TOUR_RUNG, 1, ramp(s, T.restore[0], T.restore[1]));
const brightU = (g: G, s: number) => smoothstep((s - ARRIVE[g] + 4) / T.bright);
export const EUnder: React.FC<ActProps> = ({ s, cam, uid = "" }) => {
  if (s < S0) return null;
  const wU = (s - T.wash[0]) / (T.wash[1] - T.wash[0]);
  return (
    <>
      {s >= HANDOFF.colonies ? (
        <Fill id={`eCol${uid}`} d={COLONIES_D} cam={cam} side="orange" fill={AB_END.colonyOrange.fill} hatch={AB_END.colonyOrange.hatch} opacity={colRung(s)} />
      ) : null}
      {wU < 1 ? (
        <Fill id={`eCw${uid}`} d={COLONIES_D} cam={cam} side="cream" fill={AB_END.colonyWash.fill} hatch={AB_END.colonyWash.hatch} reveal={wU > 0 ? washReveal(s) : undefined} feather={6} />
      ) : null}
      {(["jamaica", "antigua", "barbados"] as G[]).map((g) => {
        const b = brightU(g, s);
        return b > 0.002 ? <Fill key={g} id={`eIs-${g}${uid}`} d={ISL[g].d} cam={cam} side="cream" fill={0.62 * b} hatch={0.55 * b} /> : null;
      })}
    </>
  );
};
/** THE MILITIA (handed over from AB at HANDOFF.militia): AB's exact dots, and as the
 *  column leaves through the Narrows ("get rid of" .. "colonies") the hole they ringed
 *  closes INWARD over the harbour - an area-preserving radial map round the beachhead
 *  (r'^2 = r^2 - R_HOLE^2 u), so the band's men fill the disc at their own density and
 *  the scatter far out barely moves: no empty disc, the colonies wholly orange. */
const R_HOLE = AB_END.enclave.r + 3.6; // the band's inner edge (AB's BAND_IN)
export const militiaE = (s: number, k: number): Dot[] => {
  const u = easeInOutSine((s - T.close[0]) / (T.close[1] - T.close[0]));
  const men = AB_END.militia.at(s, k);
  if (u <= 0) return men;
  return men.map((d) => {
    const dx = d.x - ENC_C[0];
    const dy = d.y - ENC_C[1];
    const r = Math.hypot(dx, dy) || 1e-6;
    const r2 = Math.sqrt(Math.max(0, r * r - R_HOLE * R_HOLE * u));
    return { ...d, x: ENC_C[0] + (dx / r) * r2, y: ENC_C[1] + (dy / r) * r2 };
  });
};
export const EOver: React.FC<ActProps> = ({ s, cam }) => {
  if (s < S0) return null;
  const k = cam.k;
  return (
    <>
      {(["jamaica", "antigua", "barbados"] as G[]).map((g) => {
        const b = brightU(g, s);
        if (b <= 0.002) return null;
        const rp = smoothstep((s - ARRIVE[g] + 6) / T.ringDraw);
        return (
          <g key={g}>
            <InkLine d={ISL[g].d} cam={cam} width={1.6} opacity={b} />
            <Ring x={GAR_CENTRE[g][0]} y={GAR_CENTRE[g][1]} cam={cam} r={GAR_R[g] * k + 11} progress={rp} color={INK} width={2.0} opacity={lerp(RUNG.mid, 1, b)} />
          </g>
        );
      })}
      {s >= HANDOFF.colonies ? (
        <>
          <InkLine d={COLONY_INNER_D} cam={cam} width={1.3} opacity={0.62 * colRung(s)} />
          <OrangeLine d={COLONY_OUTER_D} cam={cam} dash={0} width={W_ORANGE} opacity={colRung(s)} />
          <OrangeLine d={COAST_D} cam={cam} width={W_ORANGE} opacity={colRung(s)} />
        </>
      ) : null}
      {s >= HANDOFF.militia ? <Dots dots={militiaE(s, k)} cam={cam} opacity={colRung(s)} /> : null}
      <Dots dots={armyE(s, k)} cam={cam} />
    </>
  );
};
const LABEL_AT: P2 = project(-68.6, 15.3);
export const ELabels: React.FC<ActProps> = ({ s, cam }) => {
  if (s < S0) return null;
  return <Label text="CARIBBEAN" x={LABEL_AT[0]} y={LABEL_AT[1]} cam={cam} frame={s} f0={T.caribbean} size={46} spacing={0.34} />;
};

/** ACT E for sugarScene */
export const ACT_E: Act = { name: "E", cam: camE, Under: EUnder, Over: EOver, Labels: ELabels };
