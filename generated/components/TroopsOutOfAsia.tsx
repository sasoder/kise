import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { z } from "zod";
import { FRAME_H, FRAME_W, clamp, hash, smoothstep, sway } from "./fieldShared";
// The map is drawn in two halves. The STATIC layers (sea, water-lines,
// graticule, land + rim, Lake Baikal, 1905 borders, coast) are a raster LOD
// pyramid baked once by `scripts/bake-transsib-rasters.mjs` (public/transsib/,
// rects in transsibLevels.ts). The DYNAMIC overlays (the railway, the
// Europe/Asia boundary, the two names, the troops) are light vectors from
// `scripts/build-transsib-map.mjs` (transsibMapData.ts). Natural Earth 10m on a
// north-up Lambert conformal conic, parallels 45/60, centre meridian 82 E.
import { ASIA_ARC_D, EURO1_ARC_D, EURO2_ARC_D, HARBIN, MOSCOW, ROUTE_PTS, URALS_CROSS, URALS_D } from "./transsibMapData";
import {
  CAM_TRACK,
  DURATION,
  FPS,
  ROUTE_LEN,
  S0,
  T,
  headS,
  journeyD,
  journeyInv,
  journeyV,
  levelDrawn,
  levelOps,
  routeAt,
  routeNormal,
  routeSplit,
} from "./transsibCamera";
import { LEVELS } from "./transsibLevels";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// Sarah Paine, after the Portsmouth peace: Russia raised a loan and needed that
// money "simply to transport its troops out of Asia back to European Russia."
// SRT 0:50.42 -> 0:55.44. In-point 50.42 s = f0; the line ends at f120
// (round(5.02 * 24) = 120) + the 16-frame house tail = 136 frames, 24 fps.
// Word onsets: simply f0 · to f20 · transport f27 · its f41 · troops f51 ·
// out of f60 · Asia f73 · back f82 · to f91 · European f95 · Russia f105.
//
// DWARKESH MAP STYLE (MEMORY.md; reference SouthManchuriaRailway.tsx): sea
// #1B2226, land #3F3428 with the #6A5838 rim, cream ink #E9DDBF, 4 engraved
// water-lines, 5 deg graticule, baked mottle + grain, vignette, IM Fell English
// SC, the chequered railway symbol. NO ORANGE in this cut (in this clip orange
// is Japan's gain). Everything is cream at two opacities: full for the troops,
// the railway they have travelled and the landed names; ~0.5 for the 1905
// borders, the idle railway; the Europe/Asia boundary sits at 0.35 until the
// column crosses it.
//
// THE GESTURES, each with its word (frames at 24 fps):
//   1. "simply" f0-20: the close-up (k 4.5, creeping to 4.6) on Manchuria:
//      ~170 cream dots massed round Harbin on the railway, each drifting on
//      its own, the idle railway running west off-frame. From f12 the camera
//      starts to ease west, anticipating the departure.
//   2. "to transport … troops" f22-51: the head steps onto the line at the
//      crowd's west edge (f22) and the column files out after it. The column
//      moves as ONE (same path parameter, same speed, small lateral offsets);
//      soldiers step on at even gaps along the line (4.3 world px for the
//      first, widening evenly to ~10 for the last, who leaves at f122), so the
//      spacing is set at the join and kept all the way. Speed starts at a walk
//      and builds. The crowd
//      erodes from its west side and drifts toward the join point. The railway converts to full cream just behind
//      the head. The camera follows the head ~80 px right of centre (y ~835)
//      and pulls back in one long move (k 4.5 f18 -> 2.2 f51 -> 1.4 f73),
//      the map sliding at <= 24 screen px/frame.
//   3. "out of Asia" f60-73: over Siberia the pull-back runs on (k 1.8 -> 1.4);
//      ASIA slides up (24 px + fade) from f64 along the 61.2 N parallel above
//      the column, full by f73.
//   4. "back to European Russia" f82-112: the camera eases (softplus, only ever
//      westward) into the final wide, zoom 0.94, landed by f98 (Moscow on x
//      150, Harbin on x 1020, route middle on y 800); the head crosses the
//      Urals boundary at f95 and the boundary brightens out of the crossing
//      (f93-110); EUROPEAN RUSSIA slides up west of the Urals from f96, full
//      by f105; the head reaches Moscow at f112, where each soldier is
//      absorbed (shrinks and fades over 6 frames) and one small cream city dot
//      marks Moscow from the head's arrival.
//   5. tail f98-136: the wide of the whole route Moscow -> Harbin, the column
//      strung out along all of it, still flowing (the Harbin crowd empties by
//      ~f122); the camera creeps in 3 %; one faint highlight travels the
//      railway Harbin -> Moscow (f100-136), plus the house sway (vertical only).
// Nothing else: no train, no soldiers' icons, no arrows, no counter, no city
// names, no orange.
//
// THE ROUTE (lon, lat; Wikipedia / GeoNames town and station coordinates):
//   Harbin 126.63,45.75 · Qiqihar (the CER's Tsitsihar stn at Angangxi)
//   123.80,47.20 · Manzhouli 117.43,49.60 · Chita 113.50,52.03 ·
//   Verkhneudinsk (Ulan-Ude) 107.60,51.83 · Circum-Baikal: Mysovaya
//   105.85,51.70, Slyudyanka 103.70,51.655, Kultuk 103.72,51.735, Port Baikal
//   104.84,51.865 · Irkutsk 104.26,52.27 · Krasnoyarsk 92.87,56.01 ·
//   Novonikolaevsk (Novosibirsk) 82.92,55.03 · Omsk 73.37,54.99 · Kurgan
//   65.34,55.44 · Chelyabinsk 61.40,55.16 · Urals crossing (the obelisk near
//   Urzhumka) 59.85,55.12 · Ufa 55.97,54.73 · Samara 50.10,53.20 · Moscow
//   (Kazansky) 37.66,55.77; plus unlabelled shape stations (Anda, Zhalantun,
//   Bukhedu, Hailar, Borzya, Olovyannaya, Karymskaya, Mogzon, Khilok, Petrovsky
//   Zavod, Selenginsk, Posolskaya, Tankhoy, Vydrino, Baikalsk, Marituy, Usolye,
//   Cheremkhovo, Zima, Tulun, Nizhneudinsk, Taishet, Kansk, Achinsk, Mariinsk,
//   Taiga, Bolotnoye, Kargat, Barabinsk, Tatarsk, Isilkul, Petropavlovsk,
//   Makushino, Shumikha, Miass, Zlatoust, Asha, Abdulino, Kinel, Syzran,
//   Kuznetsk, Penza, Morshansk, Ryazhsk, Ryazan, Kolomna), full list with
//   coordinates in scripts/build-transsib-map.mjs. 1905 routing: the
//   Circum-Baikal line via Port Baikal (the Kultuk-Irkutsk cut-off is 1940s),
//   the Samara-Zlatoust line over the Urals, Samara -> Moscow via Penza and
//   Ryazan.
// ---------------------------------------------------------------------------

export const SEA = "#1B2226";
export const INK = "#E9DDBF";
const CORE = "#15120E"; // the dark core of the railway symbol
const SHADOW = "#0B0907";

export const schema = z.object({
  sea: z.string(),
  ink: z.string(),
  grainSrc: z.string(),
  mottleSrc: z.string(),
  vignette: z.number(),
  troops: z.number().int().min(60).max(240),
  labels: z.object({
    asia: z.string(),
    europe1: z.string(),
    europe2: z.string(),
  }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  sea: SEA,
  ink: INK,
  grainSrc: "manchuria/grain.png",
  mottleSrc: "manchuria/mottle.png",
  vignette: 0.55,
  troops: 170,
  labels: { asia: "ASIA", europe1: "EUROPEAN", europe2: "RUSSIA" },
});

// ---------------------------------------------------------------------------
// The troops. Crowd slots round Harbin (an organic sunflower, a little wider
// along the line), a departure order west-first, and Moscow slots for the
// arrivals.
// ---------------------------------------------------------------------------
const LAST_DEPART = 122;
const WALK = 10; // frames from the crowd to the join point
const GAP0 = 4.3; // world px between the first soldiers on the line
const ABSORB = 6; // frames a soldier takes to shrink into Moscow
const CROWD_C = { x: HARBIN.x + 3, y: HARBIN.y + 2 };
const CROWD_R = 24; // world px

type Soldier = {
  px: number;
  py: number; // crowd slot
  t: number; // departure frame
  d0: number; // how far the column had run when he stepped on
  v: number; // the column's speed then
  fa: number; // the frame he reaches Moscow
  lat: number; // lateral offset in the column, -1..1
  w1: number;
  w2: number;
  p1: number;
  p2: number; // drift
};
const makeTroops = (n: number): Soldier[] => {
  // an organic mass: a sunflower with a lumpy outline, thinning toward the rim
  // (radius ~ index^0.62, not ^0.5), strong jitter so no lattice shows, and a
  // few stragglers just outside
  const slots = Array.from({ length: n }, (_, j) => {
    const th = j * 2.399963 + 0.7;
    const lump = 1 + 0.16 * Math.sin(2 * th + 1.3) + 0.1 * Math.sin(3 * th + 0.4) + 0.06 * Math.sin(5 * th + 2.1);
    const straggle = hash(j, 11) > 0.94 ? 1.12 + 0.2 * hash(j, 12) : 1;
    const rr = CROWD_R * Math.pow((j + 0.5) / n, 0.62) * lump * straggle;
    return {
      x: CROWD_C.x + rr * Math.cos(th) * 1.22 + (hash(j, 1) - 0.5) * 2.4,
      y: CROWD_C.y + rr * Math.sin(th) * 0.8 + (hash(j, 2) - 0.5) * 2.4,
      key: 0,
    };
  });
  slots.forEach((s, j) => (s.key = s.x + (hash(j, 3) - 0.5) * 7));
  slots.sort((a, b) => a.key - b.key); // west first
  // Departures are scheduled by distance, not time: soldier i steps on when
  // the column has run d_i, so the gap behind him on the line is d_i - d_(i-1),
  // growing evenly from GAP0 (the walk-pace file out of Harbin) to whatever
  // lands the last departure on LAST_DEPART (~10 world px, the wide's beads).
  const dLast = journeyD(LAST_DEPART - T.depart);
  const g1 = (2 * dLast) / Math.max(1, n - 1) - GAP0;
  const dOf = (i: number) => GAP0 * i + ((g1 - GAP0) * i * i) / (2 * Math.max(1, n - 1));
  return slots.map((s, i) => {
    // a gaussian-ish lateral offset: most of the column rides the line
    const lat = (hash(i, 4) + hash(i, 5) + hash(i, 6) - 1.5) / 1.5;
    const d0 = dOf(i);
    const t = T.depart + journeyInv(d0);
    return {
      d0,
      v: journeyV(t - T.depart),
      fa: T.depart + journeyInv(ROUTE_LEN - S0 + d0),
      px: s.x,
      py: s.y,
      t,
      lat,
      w1: 0.04 + 0.05 * hash(i, 7),
      w2: 0.04 + 0.05 * hash(i, 8),
      p1: hash(i, 9) * 6.28,
      p2: hash(i, 10) * 6.28,
    };
  });
};

// ---------------------------------------------------------------------------
// The railway symbol's dashes, in world units, in octaves: a screen-constant
// dash on a long path crawls along it as k changes, so the dash is fixed in
// world px within an octave of k and the next octave (half the length) fades
// in across it.
// ---------------------------------------------------------------------------
const DASH = 8; // screen px at the bottom of each octave
const octaves = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  const t = smoothstep((L2 - o - 0.25) / 0.5);
  const a = DASH / Math.pow(2, o);
  return [
    { d: a, op: 1 - t },
    { d: a / 2, op: t },
  ].filter((x) => x.op > 0.001);
};

const toD = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;
const ROUTE_D = toD(ROUTE_PTS as [number, number][]);

const LABEL_TRAVEL = 24;
const LABEL_FRAMES = 14;
const LABEL_FADE = 9;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);
const slide = (frame: number, f0: number) => ({
  dy: interpolate(frame, [f0, f0 + LABEL_FRAMES], [LABEL_TRAVEL, 0], { easing: EASE_LAND, ...clamp }),
  op: interpolate(frame, [f0, f0 + LABEL_FADE], [0, 1], clamp),
});
const ramp = (f: number, a: number, b: number) => smoothstep((f - a) / (b - a));

// ---------------------------------------------------------------------------
const TroopsOutOfAsia: React.FC<Props> = ({ sea, ink, grainSrc, mottleSrc, vignette, troops, labels }) => {
  const frame = useCurrentFrame();
  const fi = Math.min(DURATION, Math.max(0, Math.round(frame)));

  // -- camera ----------------------------------------------------------------
  const cam = CAM_TRACK[fi];
  const drift = sway(frame);
  const k = cam.k;
  const cx = cam.cx; // no horizontal sway: the camera's x only ever travels west or holds
  const cy = cam.cy + drift.dy / k;
  const tx = FRAME_W / 2 - cx * k;
  const ty = FRAME_H / 2 - cy * k;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(5)})`;
  const px = (v: number) => v / k;
  const grow = (v: number, e = 0.35) => (v * Math.pow(k, e)) / k;
  const view = { x0: cx - 580 / k, x1: cx + 580 / k, y0: cy - 1000 / k, y1: cy + 1000 / k };

  // -- the static map: the LOD level(s) for this k -----------------------------
  const ops = levelOps(k);
  const levelImgs = LEVELS.map((L, li) => {
    if (!levelDrawn(ops, li)) return null;
    return (
      <Img
        key={L.name}
        src={staticFile(`transsib/lod-${L.name}.png`)}
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
    );
  });

  // -- the railway -------------------------------------------------------------
  const sHead = headS(frame);
  const sFront = frame < T.depart ? 0 : Math.max(0, sHead - px(6)) * ramp(frame, T.depart - 1, T.depart + 5);
  const { before, after } = routeSplit(sFront);
  const RW = 5.4 * Math.pow(k, 0.12); // screen px
  const oct = octaves(k);
  const rail = (d: string, key: string, offset = 0) => (
    <g key={key} fill="none" strokeLinejoin="round">
      <path d={d} stroke={SHADOW} strokeOpacity={0.55} strokeWidth={px(RW + 3.5)} />
      <path d={d} stroke={ink} strokeWidth={px(RW)} />
      <path d={d} stroke={CORE} strokeWidth={px(RW - 2.8)} />
      {oct.map((o) => (
        <path
          key={`o${o.d}`}
          d={d}
          stroke={ink}
          strokeOpacity={o.op}
          strokeWidth={px(RW - 2.8)}
          strokeDasharray={`${o.d} ${o.d}`}
          strokeDashoffset={offset}
        />
      ))}
    </g>
  );

  // the hold's travelling highlight, Harbin -> Moscow
  const shT = ramp(frame, T.shimmer[0], T.shimmer[1]);
  const shS = ROUTE_LEN * shT;
  const shOp = Math.sin(Math.PI * Math.min(1, Math.max(0, (frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0])))) * 0.5;

  // -- the Europe/Asia boundary ------------------------------------------------
  const bT = ramp(frame, T.boundary[0], T.boundary[1]);
  const bR = 30 + 190 * bT; // world px, the brightened reach out of the crossing

  // -- the troops ----------------------------------------------------------------
  const soldiers = React.useMemo(() => makeTroops(troops), [troops]);
  const rDot = 4.6 * Math.pow(k / 4.5, 0.35); // screen px
  const halfW = 5.5 * Math.pow(k / 4.5, 0.5); // the column's half-width, screen px
  const join = routeAt(S0);
  const joinN = routeNormal(S0);
  const tan0 = (() => {
    const a = routeAt(S0);
    const b = routeAt(S0 + 4);
    const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
  })();
  const compact = 0.3 * ramp(frame, 30, 130);
  const dots: React.ReactNode[] = [];
  const halos: React.ReactNode[] = [];
  soldiers.forEach((sd, i) => {
    const tau = frame - sd.t;
    // crowd position: slot + its own drift, the crowd drawing toward the join
    const cxw = sd.px + (join.x - sd.px) * compact + 0.55 * Math.sin(frame * sd.w1 + sd.p1);
    const cyw = sd.py + (join.y - sd.py) * compact + 0.45 * Math.cos(frame * sd.w2 + sd.p2);
    const latW = px(halfW * sd.lat);
    let x: number;
    let y: number;
    let absorb = 1;
    if (tau < -WALK) {
      x = cxw;
      y = cyw;
    } else if (tau < 0) {
      // cubic Hermite from the crowd slot (at rest) to the join point, arriving
      // with the journey's own starting speed along the line
      const u = (tau + WALK) / WALK;
      const h00 = 2 * u * u * u - 3 * u * u + 1;
      const h01 = -2 * u * u * u + 3 * u * u;
      const h11 = u * u * u - u * u;
      const jx = join.x + joinN.x * latW;
      const jy = join.y + joinN.y * latW;
      x = h00 * cxw + h01 * jx + h11 * WALK * sd.v * tan0.x;
      y = h00 * cyw + h01 * jy + h11 * WALK * sd.v * tan0.y;
    } else {
      const s = Math.min(ROUTE_LEN, S0 + journeyD(frame - T.depart) - sd.d0);
      const p = routeAt(s);
      const n = routeNormal(s);
      x = p.x + n.x * latW;
      y = p.y + n.y * latW;
      // arrival: absorbed at the destination, shrinking and fading over 6 frames
      if (frame >= sd.fa) {
        const a = smoothstep((frame - sd.fa) / ABSORB);
        if (a >= 1) return;
        absorb = 1 - a;
      }
    }
    if (x < view.x0 || x > view.x1 || y < view.y0 || y > view.y1) return;
    halos.push(<circle key={`h${i}`} cx={x} cy={y} r={px((rDot + 1.7) * absorb)} opacity={absorb} />);
    dots.push(<circle key={`d${i}`} cx={x} cy={y} r={px(rDot * absorb)} opacity={absorb} />);
  });

  const cityT = interpolate(frame, [T.moscow, T.moscow + 5], [0, 1], { easing: EASE_LAND, ...clamp });

  // -- type ---------------------------------------------------------------------
  const asiaSl = slide(frame, T.asia);
  const euroSl = slide(frame, T.europe);
  const asiaSz = grow(40);
  const euroSz = grow(34);
  const arcText = (text: string, href: string, size: number, spacing: number, sl: { dy: number; op: number }) =>
    sl.op > 0 ? (
      <g transform={`translate(0 ${px(sl.dy)})`} opacity={sl.op}>
        <text
          fill={ink}
          stroke={sea}
          strokeOpacity={0.5}
          strokeWidth={size * 0.1}
          paintOrder="stroke"
          style={{ fontFamily: fellSC, fontSize: size, letterSpacing: size * spacing }}
        >
          <textPath href={href} startOffset="50%" textAnchor="middle">
            {text}
          </textPath>
        </text>
      </g>
    ) : null;

  // Mottle tiles, world space, in octaves: the stains keep roughly the same
  // screen size through a 4.5x zoom (a single world-size tile magnified 4.5x
  // turns into smudges), each octave anchored to the map, the next one fading
  // in across it.
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

  return (
    <AbsoluteFill style={{ backgroundColor: sea }}>
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
          opacity: 0.9,
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

      {/* ---------------- RAILWAY, BOUNDARY, NAMES, TROOPS ---------------- */}
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
        <defs>
          <path id="asiaArc" d={ASIA_ARC_D} />
          <path id="euro1Arc" d={EURO1_ARC_D} />
          <path id="euro2Arc" d={EURO2_ARC_D} />
          <radialGradient id="bndGlowG" gradientUnits="userSpaceOnUse" cx={URALS_CROSS.x} cy={URALS_CROSS.y} r={bR}>
            <stop offset={0} stopColor="#fff" />
            <stop offset={0.55} stopColor="#fff" />
            <stop offset={1} stopColor="#000" />
          </radialGradient>
          <mask id="bndMask" maskUnits="userSpaceOnUse" x={-200} y={-200} width={1500} height={2400}>
            <rect x={-200} y={-200} width={1500} height={2400} fill="url(#bndGlowG)" />
          </mask>
        </defs>
        <g transform={camT}>
          {/* the Europe/Asia boundary: faint, then bright where the column crossed */}
          <path
            d={URALS_D}
            fill="none"
            stroke={ink}
            strokeOpacity={0.35}
            strokeWidth={px(1.7)}
            strokeDasharray="6 4.5"
            strokeLinecap="round"
          />
          {bT > 0 ? (
            <path
              d={URALS_D}
              fill="none"
              stroke={ink}
              strokeOpacity={0.9 * bT}
              strokeWidth={px(2.1)}
              strokeDasharray="6 4.5"
              strokeLinecap="round"
              mask="url(#bndMask)"
            />
          ) : null}

          {/* the names */}
          {arcText(labels.asia, "#asiaArc", asiaSz, 0.7, asiaSl)}
          {arcText(labels.europe1, "#euro1Arc", euroSz, 0.1, euroSl)}
          {arcText(labels.europe2, "#euro2Arc", euroSz, 0.1, euroSl)}

          {/* the railway: idle at half, travelled at full */}
          <g opacity={0.5}>
            {after.length > 1 ? rail(toD(after), "idle", sFront) : null}
          </g>
          {sFront > 0.5 ? rail(toD(before), "active") : null}
          {shOp > 0.01
            ? [
                [90, 0.3],
                [44, 0.45],
                [16, 0.65],
              ].map(([len, o]) => (
                <path
                  key={`sh-${len}`}
                  d={ROUTE_D}
                  fill="none"
                  stroke="#FFF6DC"
                  strokeOpacity={o * shOp}
                  strokeWidth={px(RW - 1)}
                  strokeLinecap="round"
                  strokeDasharray={`${px(len)} ${ROUTE_LEN * 2}`}
                  strokeDashoffset={-(shS - px(len) / 2)}
                />
              ))
            : null}

          {/* the troops */}
          <g fill={SHADOW} fillOpacity={0.55}>
            {halos}
          </g>
          <g fill={ink}>{dots}</g>
          {/* Moscow: one small solid cream city dot from the moment the head arrives */}
          {cityT > 0 ? (
            <circle
              cx={MOSCOW.x}
              cy={MOSCOW.y}
              r={((6.5 * Math.pow(k, 0.18)) / k) * cityT}
              fill={ink}
              stroke={SHADOW}
              strokeWidth={(2.2 * Math.pow(k, 0.18)) / k}
            />
          ) : null}
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

export default TroopsOutOfAsia;
