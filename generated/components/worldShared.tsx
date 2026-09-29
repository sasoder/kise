import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
// d3-geo ships no type declarations in this repo (installed for the map build scripts)
// @ts-expect-error untyped module
import { geoEqualEarth, geoPath } from "d3-geo";
import { hash } from "./fieldShared";
// The map is drawn in two halves. The STATIC layers (page, sea, water-lines,
// graticule, land + rim, 1950 borders of the lit polities, coast, the sphere's
// edge) are a raster LOD pyramid baked once by scripts/bake-world-rasters.mjs
// (public/world/, rects in worldLevels.ts). The DYNAMIC overlays (the lit
// polities, Korea's armies and the North's hatch, the arcs, the packets, the
// ring, the words) are light vectors from scripts/build-world-map.mjs
// (worldMapData.ts). Natural Earth on Equal Earth, centre meridian 146 E.
import { ARCS, FRONT_D, KOREA_D, KPA, LIT_D, NORTH_D, P38_D, PLACES, PLACES_LL, PROJ, UN } from "./worldMapData";
import { ANCHOR, CAM_TRACK, G_LAST, W, clamp01, levelDrawn, levelOps, pchip, ramp, smoothstep } from "./worldCamera";
import { LEVELS, PAGE } from "./worldLevels";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });

export const FRAME_W = 1080;
export const FRAME_H = 1920;
export const SEA = "#1B2226";
export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
const SHADOW = "#0B0907";
// ONE opacity ladder: HI for what is lit / active, LO for the hatch and the
// arcs, DIM (half) for the rung everything drops to in cut 3.
export const INK_HI = 0.9;
export const INK_LO = 0.5;
// ONE stroke family (screen px)
const SW_OUTLINE = 1.8;
const LIT_WASH = 0.15; // the lit countries' cream wash
const SW_ARC = 1.6;
const SW_RING = 2.4;
const SW_HATCH = 1.25;

// ---------------------------------------------------------------------------
// THE TIMELINE (global frames G; W in worldCamera.ts holds every word onset)
// ---------------------------------------------------------------------------
export const T = {
  usLabel: 80, // UNITED STATES slides up (8 f before "united" 88), landed ~94
  usSpread: [84, 101] as const, // the USA lights, spreading from the west coast inland
  usArc: [92, 110] as const, // its arc draws SF -> Pusan
  wave: [102, 113] as const, // the 15 partners light, ordered by distance from Korea
  spreadFrames: 10,
  arcDelay: 3,
  arcFrames: 12,
  packetsOn: 126, // the first packets leave the origins ("got" 128)
  usLabelOut: [149, 163] as const, // cut 3 has only the ring words
  rungDrop: [149, 176] as const, // partners, arcs and packets drop to the low rung
  ringDraw: [152, 175] as const, // the 6 deg ring draws, closing ~f26
  civil: W.civil - 8, // CIVIL slides up
  ringPower: [185, 197] as const, // the ring starts to carry the war outward ("becomes")
  regional: W.regional - 8, // REGIONAL slides up, CIVIL fades
  dashed: [W.potential - 4, W.potential + 6] as const, // the ring turns dashed on "potential"
  global: W.global - 8, // GLOBAL slides up, REGIONAL fades
  surge1: [W.completely, W.race] as const, // the packets speed up and thicken
  surge2: [W.much, W.cost] as const, // ... and again
  push: 264, // cut 3's closing push back into Korea starts (f115; see worldCamera TAIL)
};

// the ring's radius (degrees) on the global clock: 6 (civil) -> 28 (regional,
// settled ~f60) -> ~75 on "global" (the 48 states) -> 92 -> breathing out to 103
const RING_R = pchip([
  [185, 6],
  [209, 28],
  [221, 28.8],
  [254, 75],
  [268, 92],
  [G_LAST, 103],
]);
export const ringR = (g: number) => (g < 185 ? 6 : RING_R(g));

// the partners' wave: lighting frame from their distance to Korea
const PARTNERS = Object.keys(ARCS).filter((g) => g !== "USA");
const dMin = Math.min(...PARTNERS.map((g) => ARCS[g].distDeg));
const dMax = Math.max(...PARTNERS.map((g) => ARCS[g].distDeg));
export const LIGHT_AT: Record<string, number> = {
  USA: T.usSpread[0],
  ...Object.fromEntries(
    PARTNERS.map((g) => [g, T.wave[0] + ((T.wave[1] - T.wave[0]) * (ARCS[g].distDeg - dMin)) / (dMax - dMin)]),
  ),
};
const spreadFrames = (g: string) => (g === "USA" ? T.usSpread[1] - T.usSpread[0] : T.spreadFrames);
const arcWindow = (g: string): [number, number] =>
  g === "USA" ? [T.usArc[0], T.usArc[1]] : [LIGHT_AT[g] + T.arcDelay, LIGHT_AT[g] + T.arcDelay + T.arcFrames];

// ---------------------------------------------------------------------------
// The packets: each arc emits at a rate e(G) and every packet in flight rides
// the arc's phase at v(G) (fraction of the arc per frame), so a speed change
// moves every packet at once and a denser stream never pops a packet in
// mid-arc. Both integrated once per frame into tables.
// ---------------------------------------------------------------------------
// Through cut 3's closing push (k 1.3 -> 8.8) the packets' phase rate is
// divided by (zoom gained since the push began)^0.7: nearly constant SCREEN
// speed (<= ~42 px/f on the longest arcs in the close, so nothing strobes),
// yet fast enough in world terms that the packets emitted in the "completely
// different race" surge reach Pusan inside the close frame by the end.
const K_PUSH0 = CAM_TRACK[T.push].k;
const zoomComp = (g: number) => {
  const w = ramp(g, T.push - 2, T.push + 12);
  if (w <= 0) return 1;
  const gi = Math.max(0, Math.min(G_LAST, g));
  const i = Math.floor(gi);
  const kk = CAM_TRACK[i].k + (CAM_TRACK[Math.min(G_LAST, i + 1)].k - CAM_TRACK[i].k) * (gi - i);
  return 1 + (Math.pow(K_PUSH0 / kk, 0.7) - 1) * w;
};
const rateV = (g: number) => {
  const slow = 1 / 40 + (1 / 72 - 1 / 40) * ramp(g, T.rungDrop[0], T.rungDrop[1]);
  const v = slow + (1 / 34 - 1 / 72) * ramp(g, T.surge1[0], T.surge1[1]) + (1 / 22 - 1 / 34) * ramp(g, T.surge2[0], T.surge2[1]);
  return v * zoomComp(g);
};
const rateE = (g: number) => {
  if (g < T.packetsOn) return 0;
  const base = 1 / 9 + (1 / 15 - 1 / 9) * ramp(g, T.rungDrop[0], T.rungDrop[1]);
  return base + (1 / 3.5 - 1 / 15) * ramp(g, T.surge1[0], T.surge1[1]) + (1 / 2 - 1 / 3.5) * ramp(g, T.surge2[0], T.surge2[1]);
};
const TABLE_N = G_LAST + 2;
const V_TAB = new Float64Array(TABLE_N);
const E_TAB = new Float64Array(TABLE_N);
for (let g = 1; g < TABLE_N; g++) {
  V_TAB[g] = V_TAB[g - 1] + rateV(g - 0.5);
  E_TAB[g] = E_TAB[g - 1] + rateE(g - 0.5);
}
const tab = (t: Float64Array, g: number) => {
  const x = Math.max(0, Math.min(TABLE_N - 1.001, g));
  const i = Math.floor(x);
  return t[i] + (t[i + 1] - t[i]) * (x - i);
};
/** the frame at which the emission count reaches n (inverse of E_TAB) */
const emitFrame = (n: number) => {
  let lo = 0;
  let hi = TABLE_N - 1;
  if (E_TAB[hi] < n) return Infinity;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (E_TAB[m] < n) lo = m;
    else hi = m;
  }
  return lo + (n - E_TAB[lo]) / (E_TAB[hi] - E_TAB[lo] || 1);
};

// ---------------------------------------------------------------------------
// Arc geometry helpers
// ---------------------------------------------------------------------------
type P2 = [number, number];
const ARC_CUM: Record<string, number[]> = Object.fromEntries(
  Object.entries(ARCS).map(([g, a]) => {
    const c = [0];
    for (let i = 1; i < a.pts.length; i++) c.push(c[i - 1] + Math.hypot(a.pts[i][0] - a.pts[i - 1][0], a.pts[i][1] - a.pts[i - 1][1]));
    return [g, c];
  }),
);
const arcAt = (g: string, u: number): P2 => {
  const pts = ARCS[g].pts;
  const c = ARC_CUM[g];
  const s = clamp01(u) * c[c.length - 1];
  let lo = 0;
  let hi = c.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (c[m] <= s) lo = m;
    else hi = m;
  }
  const t = (s - c[lo]) / (c[hi] - c[lo] || 1);
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * t, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * t];
};
const toD = (pts: P2[]) => `M${pts.map(([x, y]) => `${x},${y}`).join("L")}`;
const ARC_D: Record<string, string> = Object.fromEntries(Object.entries(ARCS).map(([g, a]) => [g, toD(a.pts)]));

// ---------------------------------------------------------------------------
// The ring: a small circle on the sphere round the peninsula, projected
// ---------------------------------------------------------------------------
const proj = geoEqualEarth().rotate([PROJ.rotate, 0]).scale(PROJ.scale).translate(PROJ.translate).precision(0.05);
const gpath = geoPath(proj);
const RING_C = PLACES_LL.koreaMid;
const RAD = Math.PI / 180;
const dest = (brg: number, d: number): P2 => {
  const [l0, f0] = [RING_C[0] * RAD, RING_C[1] * RAD];
  const b = brg * RAD;
  const dd = d * RAD;
  const f1 = Math.asin(Math.sin(f0) * Math.cos(dd) + Math.cos(f0) * Math.sin(dd) * Math.cos(b));
  const l1 = l0 + Math.atan2(Math.sin(b) * Math.sin(dd) * Math.cos(f0), Math.cos(dd) - Math.sin(f0) * Math.sin(f1));
  return [((((l1 / RAD + 540) % 360) + 360) % 360) - 180, f1 / RAD];
};
/** the ring at radius r: its interior (clip) and its line (clockwise from north) */
const ringGeo = (r: number) => {
  const n = r < 20 ? 180 : 360;
  const coords: P2[] = Array.from({ length: n + 1 }, (_, i) => dest((360 * i) / n, r));
  const lineD = gpath({ type: "LineString", coordinates: coords }) ?? "";
  const areaD = gpath({ type: "Polygon", coordinates: [coords] }) ?? "";
  let len = 0;
  if (r < 50) {
    let prev = proj(coords[0]) as P2;
    for (let i = 1; i < coords.length; i++) {
      const q = proj(coords[i]) as P2;
      len += Math.hypot(q[0] - prev[0], q[1] - prev[1]);
      prev = q;
    }
  }
  return { lineD, areaD, len };
};
const ringPoint = (brg: number, r: number) => proj(dest(brg, r)) as P2;

// ---------------------------------------------------------------------------
// type
// ---------------------------------------------------------------------------
const LABEL_TRAVEL = 24;
const LABEL_FRAMES = 14;
const LABEL_FADE = 9;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const clampX = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };
const slide = (g: number, g0: number) => ({
  dy: interpolate(g, [g0, g0 + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...clampX }),
  op: interpolate(g, [g0, g0 + LABEL_FADE], [0, 1], clampX),
});

// the house sway: vertical only, slow
const swayY = (g: number) => 4 * Math.sin(g / 19);

// hatch octaves: world spacing fixed within an octave of k, the in-between
// lines fading in across it, so the hatch never swims as the camera zooms
const HATCH_BASE = 15; // screen px at the bottom of an octave (lines every 7.5..15 px)
const hatchOct = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  return { S: HATCH_BASE / Math.pow(2, o), mid: smoothstep((L2 - o - 0.2) / 0.6) };
};

// ---------------------------------------------------------------------------
export type SceneProps = {
  g: number; // global frame
  grainSrc: string;
  mottleSrc: string;
  vignette: number;
  usLabel: string;
  words: { civil: string; regional: string; global: string };
};

export const WorldScene: React.FC<SceneProps> = ({ g, grainSrc, mottleSrc, vignette, usLabel, words }) => {
  const gi = Math.max(0, Math.min(G_LAST, Math.round(g)));

  // -- camera -----------------------------------------------------------------
  const cam = CAM_TRACK[gi];
  const k = cam.k;
  const cx = cam.cx;
  const cy = cam.cy - swayY(g) / k;
  const tx = FRAME_W / 2 - cx * k;
  const ty = FRAME_H / 2 - cy * k;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  const px = (v: number) => v / k;
  const grow = (v: number, k0: number, e = 0.35) => (v * Math.pow(k / k0, e)) / k;
  const view = { x0: cx - 600 / k, x1: cx + 600 / k, y0: cy - 1020 / k, y1: cy + 1020 / k };

  // -- the static map: the LOD level(s) for this k -------------------------------
  const ops = levelOps(k);
  const levelImgs = LEVELS.map((L, li) =>
    levelDrawn(ops, li) ? (
      <Img
        key={L.name}
        src={staticFile(`world/lod-${L.name}.png`)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: L.W,
          height: L.H,
          transformOrigin: "0 0",
          transform: `translate(${(tx + L.x0 * k).toFixed(3)}px, ${(ty + L.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
          opacity: ops[li],
        }}
      />
    ) : null,
  );

  // -- rungs ---------------------------------------------------------------------
  const m = 1 - 0.5 * ramp(g, T.rungDrop[0], T.rungDrop[1]); // 1 -> 0.5 (the low rung)
  const ringPow = ramp(g, T.ringPower[0], T.ringPower[1]);
  const r = ringR(g);
  const ringOn = g >= T.ringDraw[0];
  const ring = ringOn ? ringGeo(r) : null;

  // -- hatch patterns --------------------------------------------------------------
  const hO = hatchOct(k);
  const hatchPattern = (id: string, color: string) => (
    <pattern id={id} patternUnits="userSpaceOnUse" width={hO.S} height={hO.S} patternTransform="rotate(45)">
      <line x1={0} y1={0} x2={0} y2={hO.S} stroke={color} strokeWidth={px(SW_HATCH)} />
      <line x1={hO.S / 2} y1={0} x2={hO.S / 2} y2={hO.S} stroke={color} strokeWidth={px(SW_HATCH)} strokeOpacity={hO.mid} />
    </pattern>
  );

  // -- the lit polities -------------------------------------------------------------
  const litLayer = (key: string, d: string, opacity: number, clip?: string) =>
    opacity > 0.002 ? (
      <g key={key} opacity={opacity} clipPath={clip}>
        {/* a faint cream wash under the hatch, so a lit country reads as lit at the wide */}
        <path d={d} fill={INK} fillOpacity={LIT_WASH} fillRule="evenodd" />
        <path d={d} fill="url(#hatchInk)" fillRule="evenodd" opacity={INK_LO} />
        <path d={d} fill="none" stroke={INK} strokeOpacity={INK_HI} strokeWidth={px(SW_OUTLINE)} strokeLinejoin="round" />
      </g>
    ) : null;
  const spreadClips: React.ReactNode[] = [];
  const litBase: React.ReactNode[] = [];
  const litRing: React.ReactNode[] = [];
  for (const key of Object.keys(ARCS)) {
    const t0 = LIGHT_AT[key];
    const u = clamp01((g - t0) / spreadFrames(key));
    if (u <= 0) continue;
    const eased = 1 - Math.pow(1 - u, 2.2); // the spread decelerates as it fills the country
    const a = ARCS[key];
    let clip: string | undefined;
    if (u < 1) {
      clip = `url(#spread-${key})`;
      spreadClips.push(
        <clipPath key={key} id={`spread-${key}`}>
          <circle cx={a.origin[0]} cy={a.origin[1]} r={Math.max(0.01, a.spreadR * eased)} />
        </clipPath>,
      );
    }
    litBase.push(litLayer(`b-${key}`, LIT_D[key], m, clip));
    if (ring && ringPow > 0) litRing.push(litLayer(`r-${key}`, LIT_D[key], (1 - m) * ringPow, "url(#ringArea)"));
  }
  if (ring && ringPow > 0) {
    litRing.push(litLayer("r-PRC", LIT_D.PRC, ringPow, "url(#ringArea)"));
    litRing.push(litLayer("r-USSR", LIT_D.USSR, ringPow, "url(#ringArea)"));
  }

  // -- the arcs ----------------------------------------------------------------------
  const arcs: React.ReactNode[] = [];
  const packets: React.ReactNode[] = [];
  const pk = m + (1 - m) * ramp(g, T.surge1[0], T.surge1[1] + 6); // packets climb back to the high rung with the surge
  // constant SCREEN size at every zoom (world-sized via px()): small packets, many of them in the close
  const pkR = 2.6 + 0.5 * ramp(g, T.surge1[0], T.surge1[1]) + 0.5 * ramp(g, T.surge2[0], T.surge2[1]);
  const vNow = tab(V_TAB, g);
  Object.keys(ARCS).forEach((key, ai) => {
    const [a0, a1] = arcWindow(key);
    const u = smoothstep((g - a0) / (a1 - a0));
    if (u <= 0) return;
    const L = ARC_CUM[key][ARC_CUM[key].length - 1];
    arcs.push(
      <path
        key={key}
        d={ARC_D[key]}
        fill="none"
        stroke={INK}
        strokeWidth={px(SW_ARC)}
        strokeLinecap="round"
        strokeDasharray={u < 1 ? `${L * u} ${L + 10}` : undefined}
      />,
    );
    if (g < T.packetsOn) return;
    // packets: arc ai's emissions are offset by a hashed fraction of one gap
    const off = hash(ai, 5);
    const eNow = tab(E_TAB, g) + off;
    for (let j = Math.max(0, Math.floor(eNow) - 120); j <= Math.floor(eNow); j++) {
      const ge = emitFrame(j - off);
      if (!Number.isFinite(ge) || ge > g) continue;
      const ph = vNow - tab(V_TAB, ge);
      if (ph < 0 || ph > 1) continue;
      // fade in leaving the origin and out arriving at Pusan over fixed SCREEN distances
      const fade = smoothstep((ph * L * k) / 30) * smoothstep(((1 - ph) * L * k) / 40);
      if (fade <= 0.01) continue;
      const [x, y] = arcAt(key, ph);
      if (x < view.x0 || x > view.x1 || y < view.y0 || y > view.y1) continue;
      packets.push(<circle key={`${key}-${j}`} cx={x} cy={y} r={px(pkR * (0.55 + 0.45 * fade))} fillOpacity={INK_HI * pk * fade} />);
    }
  });

  // -- Korea: the North's hatch, the 38th, the perimeter, the armies ---------------------
  const dotD = 9 * Math.pow(k / 22, 0.6); // screen px
  const kpa = KPA.map(([x, y, dx, dy, l], i) => {
    // the front presses: each dot leans toward the perimeter on its own slow beat
    const press = 0.22 * l * (0.5 + 0.5 * Math.sin(g * (0.1 + 0.05 * hash(i, 3)) + 6.28 * hash(i, 4)));
    const bx = (0.9 / k) * Math.sin(g * (0.05 + 0.04 * hash(i, 5)) + 6.28 * hash(i, 6));
    const by = (0.9 / k) * Math.sin(g * (0.045 + 0.04 * hash(i, 7)) + 6.28 * hash(i, 8));
    return [x + dx * press + bx, y + dy * press + by];
  });
  const un = UN.map(([x, y], i) => [
    x + (0.9 / k) * Math.sin(g * (0.05 + 0.04 * hash(i, 15)) + 6.28 * hash(i, 16)),
    y + (0.9 / k) * Math.sin(g * (0.045 + 0.04 * hash(i, 17)) + 6.28 * hash(i, 18)),
  ]);

  // -- labels ----------------------------------------------------------------------------
  const usSl = slide(g, T.usLabel);
  const usOut = 1 - ramp(g, T.usLabelOut[0], T.usLabelOut[1]);
  const usSize = grow(32, 2.15, 0.6);
  const civSl = slide(g, T.civil);
  const regSl = slide(g, T.regional);
  const gloSl = slide(g, T.global);
  const civOut = 1 - ramp(g, T.regional - 6, T.regional + 3); // out before REGIONAL is readable on the same spot
  const regOut = 1 - ramp(g, T.global - 6, T.global + 4);
  // REGIONAL rides the ring's top while the ring is regional, then slides round
  // it toward the Pacific as the ring grows past the pole (the top of a ring
  // wider than 52.5 deg lies beyond the pole), handing over to GLOBAL's spot.
  const regBrg = 45 * smoothstep((r - 30) / 22);
  const ringWord = (text: string, brg: number, sl: { dy: number; op: number }, out: number, anchor: "above" | "right") => {
    const op = sl.op * out;
    if (op <= 0.002) return null;
    const [x, y] = ringPoint(brg, r);
    const size = px(30);
    const gap = px(16);
    return (
      <text
        x={anchor === "right" ? x + gap : x}
        y={(anchor === "above" ? y - gap : y + size * 0.32) + px(sl.dy)}
        textAnchor={anchor === "right" ? "start" : "middle"}
        opacity={op}
        fill={INK}
        fillOpacity={INK_HI}
        stroke={SEA}
        strokeOpacity={0.6}
        strokeWidth={size * 0.14}
        paintOrder="stroke"
        style={{ fontFamily: fellSC, fontSize: size, letterSpacing: size * 0.24 }}
      >
        {text}
      </text>
    );
  };

  // -- the ring stroke ----------------------------------------------------------------------
  const drawU = smoothstep((g - T.ringDraw[0]) / (T.ringDraw[1] - T.ringDraw[0]));
  const dashU = ramp(g, T.dashed[0], T.dashed[1]);
  const ringDash =
    drawU < 1 && ring
      ? `${ring.len * drawU} ${ring.len + 10}`
      : dashU > 0
        ? `${px(11 - 1.5 * dashU)} ${px(0.01 + 7.5 * dashU)}`
        : undefined;

  // -- mottle tiles, world space, in octaves --------------------------------------------------
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
    const ox = ((o * 173) % 640) - 320;
    const oy = ((o * 311) % 640) - 320;
    const x0 = Math.floor((view.x0 - ox) / S) * S + ox;
    const y0 = Math.floor((view.y0 - oy) / S) * S + oy;
    for (let y = y0; y < view.y1; y += S) for (let x = x0; x < view.x1; x += S) tiles.push({ x, y, s: S, o: op });
  });

  const us = PLACES.usLabel;

  return (
    <AbsoluteFill style={{ backgroundColor: PAGE }}>
      {/* ---------------- THE MAP: the baked static layers ---------------- */}
      {levelImgs}

      {/* ---------------- PAPER MOTTLING, world space ---------------- */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          // the page is large at the wides: the mottle eases off there so its tile never reads as a repeat
          opacity: 0.55 + 0.35 * smoothstep(Math.log(k / 1.3) / Math.log(3 / 1.3)),
        }}
      >
        {tiles.map((t, i) => (
          <Img
            key={`m-${i}`}
            src={staticFile(mottleSrc)}
            style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
          />
        ))}
      </div>

      {/* ---------------- THE OVERLAYS ---------------- */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
        <defs>
          {hatchPattern("hatchInk", INK)}
          {hatchPattern("hatchOrange", ACCENT)}
          <clipPath id="koreaClip">
            <path d={KOREA_D} />
          </clipPath>
          {ring ? (
            <clipPath id="ringArea">
              <path d={ring.areaD} />
            </clipPath>
          ) : null}
          {spreadClips}
        </defs>
        <g transform={camT}>
          {/* the lit polities: base rung (spreading in), then the ring's top-up */}
          {litBase}
          {litRing}

          {/* Korea: the 38th faint under the North's hatch, the hatch down to the perimeter */}
          <g clipPath="url(#koreaClip)">
            <path d={P38_D} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={px(1.5)} strokeDasharray={`${px(7)} ${px(5)}`} />
            <path d={NORTH_D} fill={ACCENT_DEEP} fillOpacity={0.22} />
            <path d={NORTH_D} fill="url(#hatchOrange)" opacity={0.7} />
            <path d={FRONT_D} fill="none" stroke={ACCENT} strokeWidth={px(2.2)} strokeDasharray={`${px(7)} ${px(5)}`} strokeLinecap="round" />
          </g>

          {/* the arcs, then the packets riding them */}
          {/* one group opacity, so where arcs overlap (the European bundle) they stay one line, not a brighter braid */}
          <g opacity={INK_LO * m}>{arcs}</g>
          <g fill={INK}>{packets}</g>

          {/* the armies: 1 dot = 3,000 men */}
          <g>
            {un.map(([x, y], i) => (
              <circle key={`u${i}`} cx={x} cy={y} r={px(dotD / 2)} fill={INK} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={px(1.4)} />
            ))}
            {kpa.map(([x, y], i) => (
              <circle key={`k${i}`} cx={x} cy={y} r={px(dotD / 2)} fill={ACCENT} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={px(1.4)} />
            ))}
          </g>

          {/* the ring */}
          {ring && drawU > 0 ? (
            <path
              d={ring.lineD}
              fill="none"
              stroke={INK}
              strokeOpacity={INK_HI}
              strokeWidth={px(SW_RING)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={ringDash}
            />
          ) : null}

          {/* the words */}
          {usSl.op * usOut > 0.002 ? (
            <text
              x={us[0]}
              y={us[1] + px(usSl.dy)}
              textAnchor="middle"
              opacity={usSl.op * usOut}
              fill={INK}
              fillOpacity={INK_HI}
              stroke={SEA}
              strokeOpacity={0.55}
              strokeWidth={usSize * 0.12}
              paintOrder="stroke"
              style={{ fontFamily: fellSC, fontSize: usSize, letterSpacing: usSize * 0.16 }}
            >
              {usLabel}
            </text>
          ) : null}
          {ringWord(words.civil, 0, civSl, civOut, "above")}
          {ringWord(words.regional, regBrg, regSl, regOut, "above")}
          {ringWord(words.global, 88, gloSl, 1, "right")}
        </g>
      </svg>

      {/* ---------------- PAPER: grain and vignette, screen space ---------------- */}
      <Img src={staticFile(grainSrc)} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(
            3,
          )}) 75%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export { ANCHOR };
