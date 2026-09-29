import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
// d3-geo ships no type declarations in this repo (installed for the map build scripts)
// @ts-expect-error untyped module
import { geoEqualEarth, geoPath } from "d3-geo";
import { z } from "zod";
import { hash } from "./fieldShared";
import { ARCS, KOREA_D, KPA, LIT_D, NORTH_D, FRONT_D, P38_D, PLACES, PLACES_LL, PROJ, UN } from "./worldMapData";
import { clamp01, levelDrawn, levelOps, smoothstep } from "./worldCamera";
import { LEVELS, PAGE } from "./interventionV2Levels";
import { CAM_TRACK, DURATION, FPS, G_LAST, LIGHT_AT, T, ramp, ringR, spreadFrames } from "./interventionV2Motion";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// InterventionV2 (delivered as 10_ThirdPartyIntervention_V2.mov, replacing
// 10_ThirdPartyIntervention + 16_CivilRegionalGlobal): Sarah Paine, "Both
// sides overreached in Korea",
//   "until he triggered the third party intervention from hell, which is when
//    the United States and UN partners got involved. Then what was a civil war
//    becomes a regional war, with potential to become a global war, and you're
//    off to a completely different race, much higher cost."
// IN-POINT 10.599 s = f0; the line ends 25.480 s: round(14.881 x 24) = 357, +
// the 16-frame house tail: DURATION = 373 frames, 24 fps. On the world pair's
// global clock: local frame == global frame.
// Word onsets (frames): until 0 · he 10 · triggered 17 · the 26 · third 31 ·
// party 37 · intervention 45 · from 55 · hell 62 · which 75 · is 79 · when 82 ·
// the 85 · united 88 · states 93 · and 102 · U N 107 · partners 120 · got 128 ·
// involved 134 · then 149 · what 159 · was a 170 · civil 177 · war 183 ·
// becomes 190 · a 201 · regional 207 · war 215 · with 224 · potential 230 ·
// to 240 · become 245 · a 250 · global 254 · war 261 · and 270 · you're 280 ·
// off 284 · to a 289 · completely 294 · different 306 · race 315 · much 332 ·
// higher 340 · cost 346.
//
// THE USER'S NOTE on V1: "make this into a single graphic, but reimagine it
// slightly. Right now it's a bit overwhelming and hard to follow, too much
// going on." So V2 is ONE idea, the war spreading outward from Korea, with
// four element types: the map, Korea's orange, the lit countries (a 0.15
// cream wash + hatch + INK_HI outline) and one ring with its words. No arcs,
// no packets, the armies only in the opening, three big camera moves (V1 had
// five).
//
// DWARKESH MAP STYLE, world scale (as V1: worldMapData / worldStatic, the same
// bake stack re-fitted to this camera in public/interventionV2/). ORANGE = the
// overreach only: the North's hatch and army. Everyone else is cream.
//
// THE GESTURES, each with its word:
//   1. "until he triggered" f0-30: close on Korea (k 22, a 2 % creep in, the
//      held breath); the North's orange hatch to the Pusan Perimeter of 4 Aug
//      1950 (dashed orange edge), the 38th faint under it; 23 orange dots press
//      on the line, 31 cream dots in the pocket (1 dot = 3,000 men).
//   2. "the third party intervention from hell, which is when the United States
//      and UN partners got involved" f16-128: ONE long eased pull-back (it
//      turns out of the creep ~f18), Korea sliding left while the zoom opens
//      the Pacific (k 2.3 at f96, the USA in frame for "united"), flowing on to
//      the world wide (k 1.30: every lit polity inside the frame with 44 px
//      margins), landed f128, 6 f before "involved".
//        - the armies fade f52-84 as Korea gets small (k ~10 -> ~3)
//        - UNITED STATES slides up from f80 (landed ~f94); the USA lights from
//          f84, a wash spreading from San Francisco inland, full by f102
//        - the 15 partners light in a calm wave ordered by distance from Korea
//          ("U N partners got involved"): Philippines f107 ... Colombia f126,
//          each a soft wash spreading from its port/capital over 14 f (the
//          last full by f140). No lines to Korea, no names.
//   3. "then what was a civil war becomes a regional war" f132-216: ONE push-in
//      to the Asia-Pacific framing (k 4.6, landed f180):
//        - on the way in the partners dim to the low rung (x0.5, f140-164) and
//          UNITED STATES fades (f138-152)
//        - the ring (a small circle on the sphere, 6 deg round the peninsula,
//          INK_HI, 2.4 px) draws clockwise from the north f152-175, closing on
//          "civil"; CIVIL slides up on its top from f169
//        - "becomes" f188-212: the ring grows to 28 deg and the camera eases out
//          a little with it (k 4.6 -> 3.8); the PRC and USSR light where they
//          are inside the ring (country ∩ ring interior: the colour spreads with
//          the edge, never pops); CIVIL goes as REGIONAL slides up (f199)
//   4. "with potential to become a global war" f216-250: ONE pull-back to the
//      world wide (landed f250, 4 f before "global"). The ring turns DASHED on
//      "potential" (f226-236) and grows 28 -> 75 deg by "global" -> 92 by f268;
//      the lit partners come back up to the high rung as the dashed edge
//      reaches them; REGIONAL slides round the ring and goes as GLOBAL slides
//      up (f246), riding the ring in the open Pacific.
//   5. "and you're off to a completely different race, much higher cost"
//      f262-372: no new element. A slow steady push toward Korea (k 1.30 ->
//      1.8, Korea eased to x ~515), the dashed ring breathing out to 104 deg,
//      still moving on the last frame. The plate's top edge stays at y ~500
//      (the wide's own atlas margin, never more than 27 % of the frame).
// Colombia (132 deg from Korea) and South Africa (113 deg) lie beyond the ring
// and stay on the low rung: the war is still only "potential" there.
//
// SOURCES: the Pusan Perimeter of 4 Aug 1950, the 38th, Pusan:
// korea1950Fronts.ts (Appleman, "South to the Naktong, North to the Yalu", US
// Army CMH 1961, map III; West Point atlas; ~0.1 deg). Strengths early August
// 1950 (Appleman ch. XIII; Wikipedia "Battle of the Pusan Perimeter"): KPA
// ~70,000 -> 23 dots, UN ~92,000 (ROK ~45,000 + US ~47,000) -> 31 dots. The
// 16 UN combat contributors: UN Command / Wikipedia "United Nations Command".
// Map: Natural Earth, Equal Earth centred 146 E, 1950 polities (see
// scripts/build-world-map.mjs). Distances: great-circle degrees from the
// peninsula's middle (127.7 E, 38.3 N).
// ---------------------------------------------------------------------------

const FRAME_W = 1080;
const FRAME_H = 1920;
const SEA = "#1B2226";
const INK = "#E9DDBF";
const ACCENT = "#FFB000";
const ACCENT_DEEP = "#D98A0C";
const SHADOW = "#0B0907";
const INK_HI = 0.9;
const INK_LO = 0.5;
const LIT_WASH = 0.15;
const SW_OUTLINE = 1.8;
const SW_RING = 2.4;
const SW_HATCH = 1.25;

export const schema = z.object({
  grainSrc: z.string(),
  mottleSrc: z.string(),
  vignette: z.number(),
  usLabel: z.string(),
  words: z.object({ civil: z.string(), regional: z.string(), global: z.string() }),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  grainSrc: "manchuria/grain.png",
  mottleSrc: "manchuria/mottle.png",
  vignette: 0.55,
  usLabel: "UNITED STATES",
  words: { civil: "CIVIL", regional: "REGIONAL", global: "GLOBAL" },
});

// ---------------------------------------------------------------------------
// The ring: a small circle on the sphere round the peninsula, projected
// ---------------------------------------------------------------------------
type P2 = [number, number];
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
const ringGeo = (r: number) => {
  const n = r < 20 ? 180 : 360;
  const coords: P2[] = Array.from({ length: n + 1 }, (_, i) => dest((360 * i) / n, r));
  const lineD: string = gpath({ type: "LineString", coordinates: coords }) ?? "";
  const areaD: string = gpath({ type: "Polygon", coordinates: [coords] }) ?? "";
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
const swayY = (g: number) => 4 * Math.sin(g / 19);
const HATCH_BASE = 15;
const hatchOct = (k: number) => {
  const L2 = Math.log2(k);
  const o = Math.floor(L2);
  return { S: HATCH_BASE / Math.pow(2, o), mid: smoothstep((L2 - o - 0.2) / 0.6) };
};
const GLOBAL_BRG = 100; // GLOBAL rides the ring here: the open Pacific, in frame through the closing push

// ---------------------------------------------------------------------------
const InterventionV2: React.FC<Props> = ({ grainSrc, mottleSrc, vignette, usLabel, words }) => {
  const g = useCurrentFrame(); // local frame == global frame
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
        src={staticFile(`interventionV2/lod-${L.name}.png`)}
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

  // -- rungs, ring ------------------------------------------------------------------
  const m = 1 - 0.5 * ramp(g, T.rungDrop[0], T.rungDrop[1]); // 1 -> 0.5 (the low rung)
  const ringPow = ramp(g, T.ringPower[0], T.ringPower[1]);
  const r = ringR(g);
  const ring = g >= T.ringDraw[0] ? ringGeo(r) : null;

  const hO = hatchOct(k);
  const hatchPattern = (id: string, color: string) => (
    <pattern id={id} patternUnits="userSpaceOnUse" width={hO.S} height={hO.S} patternTransform="rotate(45)">
      <line x1={0} y1={0} x2={0} y2={hO.S} stroke={color} strokeWidth={px(SW_HATCH)} />
      <line x1={hO.S / 2} y1={0} x2={hO.S / 2} y2={hO.S} stroke={color} strokeWidth={px(SW_HATCH)} strokeOpacity={hO.mid} />
    </pattern>
  );

  // -- the lit countries: wash + hatch + outline, spreading from their port ------------
  const litLayer = (key: string, d: string, opacity: number, clip?: string) =>
    opacity > 0.002 ? (
      <g key={key} opacity={opacity} clipPath={clip}>
        <path d={d} fill={INK} fillOpacity={LIT_WASH} fillRule="evenodd" />
        <path d={d} fill="url(#v2HatchInk)" fillRule="evenodd" opacity={INK_LO} />
        <path d={d} fill="none" stroke={INK} strokeOpacity={INK_HI} strokeWidth={px(SW_OUTLINE)} strokeLinejoin="round" />
      </g>
    ) : null;
  const spreadClips: React.ReactNode[] = [];
  const litBase: React.ReactNode[] = [];
  const litRing: React.ReactNode[] = [];
  for (const key of Object.keys(ARCS)) {
    const u = clamp01((g - LIGHT_AT[key]) / spreadFrames(key));
    if (u <= 0) continue;
    const eased = smoothstep(u); // soft start, soft finish: a wash, not a pop
    const a = ARCS[key];
    let clip: string | undefined;
    if (u < 1) {
      clip = `url(#v2spread-${key})`;
      spreadClips.push(
        <clipPath key={key} id={`v2spread-${key}`}>
          <circle cx={a.origin[0]} cy={a.origin[1]} r={Math.max(0.01, a.spreadR * eased)} />
        </clipPath>,
      );
    }
    // the wash fades up as it spreads, so even a small country never pops
    litBase.push(litLayer(`b-${key}`, LIT_D[key], m * (0.35 + 0.65 * eased), clip));
    if (ring && ringPow > 0) litRing.push(litLayer(`r-${key}`, LIT_D[key], (1 - m) * ringPow, "url(#v2RingArea)"));
  }
  if (ring && ringPow > 0) {
    litRing.push(litLayer("r-PRC", LIT_D.PRC, ringPow, "url(#v2RingArea)"));
    litRing.push(litLayer("r-USSR", LIT_D.USSR, ringPow, "url(#v2RingArea)"));
  }

  // -- Korea: the armies, fading as Korea gets small -------------------------------------
  const armyOp = 1 - ramp(g, T.armiesOut[0], T.armiesOut[1]);
  const dotD = 9 * Math.pow(k / 22, 0.6); // screen px
  const kpa =
    armyOp > 0.002
      ? KPA.map(([x, y, dx, dy, l], i) => {
          const press = 0.22 * l * (0.5 + 0.5 * Math.sin(g * (0.1 + 0.05 * hash(i, 3)) + 6.28 * hash(i, 4)));
          const bx = (0.9 / k) * Math.sin(g * (0.05 + 0.04 * hash(i, 5)) + 6.28 * hash(i, 6));
          const by = (0.9 / k) * Math.sin(g * (0.045 + 0.04 * hash(i, 7)) + 6.28 * hash(i, 8));
          return [x + dx * press + bx, y + dy * press + by];
        })
      : [];
  const un =
    armyOp > 0.002
      ? UN.map(([x, y], i) => [
          x + (0.9 / k) * Math.sin(g * (0.05 + 0.04 * hash(i, 15)) + 6.28 * hash(i, 16)),
          y + (0.9 / k) * Math.sin(g * (0.045 + 0.04 * hash(i, 17)) + 6.28 * hash(i, 18)),
        ])
      : [];

  // -- words --------------------------------------------------------------------------------
  const usSl = slide(g, T.usLabel);
  const usOut = 1 - ramp(g, T.usLabelOut[0], T.usLabelOut[1]);
  const usSize = grow(32, 2.15, 0.6);
  const civSl = slide(g, T.civil);
  const regSl = slide(g, T.regional);
  const gloSl = slide(g, T.global);
  const civOut = 1 - ramp(g, T.regional - 6, T.regional + 3);
  const regOut = 1 - ramp(g, T.global - 6, T.global + 4);
  // REGIONAL rides the ring's top, sliding round it as the ring passes the pole
  const regBrg = 45 * smoothstep((r - 30) / 22);
  const ringWord = (text: string, brg: number, sl: { dy: number; op: number }, out: number, anchor: "above" | "inside") => {
    const op = sl.op * out;
    if (op <= 0.002) return null;
    const [x, y] = ringPoint(brg, r);
    const size = px(30);
    const gap = px(16);
    return (
      <text
        x={anchor === "inside" ? x - gap : x}
        y={(anchor === "above" ? y - gap : y + size * 0.32) + px(sl.dy)}
        textAnchor={anchor === "inside" ? "end" : "middle"}
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

  // -- the ring stroke -------------------------------------------------------------------------
  const drawU = smoothstep((g - T.ringDraw[0]) / (T.ringDraw[1] - T.ringDraw[0]));
  const dashU = ramp(g, T.dashed[0], T.dashed[1]);
  const ringDash =
    drawU < 1 && ring ? `${ring.len * drawU} ${ring.len + 10}` : dashU > 0 ? `${px(11 - 1.5 * dashU)} ${px(0.01 + 7.5 * dashU)}` : undefined;

  // -- mottle tiles, world space, in octaves ------------------------------------------------------
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
      {levelImgs}

      {/* paper mottling, world space */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: FRAME_W,
          height: FRAME_H,
          transformOrigin: "0 0",
          transform: `translate(${tx}px, ${ty}px) scale(${k})`,
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

      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
        <defs>
          {hatchPattern("v2HatchInk", INK)}
          {hatchPattern("v2HatchOrange", ACCENT)}
          <clipPath id="v2KoreaClip">
            <path d={KOREA_D} />
          </clipPath>
          {ring ? (
            <clipPath id="v2RingArea">
              <path d={ring.areaD} />
            </clipPath>
          ) : null}
          {spreadClips}
        </defs>
        <g transform={camT}>
          {/* the lit countries: base rung (spreading in), then the ring's top-up */}
          {litBase}
          {litRing}

          {/* Korea: the 38th faint under the North's hatch, the hatch down to the perimeter */}
          <g clipPath="url(#v2KoreaClip)">
            <path d={P38_D} fill="none" stroke={INK} strokeOpacity={0.4} strokeWidth={px(1.5)} strokeDasharray={`${px(7)} ${px(5)}`} />
            <path d={NORTH_D} fill={ACCENT_DEEP} fillOpacity={0.22} />
            <path d={NORTH_D} fill="url(#v2HatchOrange)" opacity={0.7} />
            <path d={FRONT_D} fill="none" stroke={ACCENT} strokeWidth={px(2.2)} strokeDasharray={`${px(7)} ${px(5)}`} strokeLinecap="round" />
          </g>

          {/* the armies: 1 dot = 3,000 men, only while Korea is large */}
          {armyOp > 0.002 ? (
            <g opacity={armyOp}>
              {un.map(([x, y], i) => (
                <circle key={`u${i}`} cx={x} cy={y} r={px(dotD / 2)} fill={INK} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={px(1.4)} />
              ))}
              {kpa.map(([x, y], i) => (
                <circle key={`k${i}`} cx={x} cy={y} r={px(dotD / 2)} fill={ACCENT} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={px(1.4)} />
              ))}
            </g>
          ) : null}

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
          {ringWord(words.global, GLOBAL_BRG, gloSl, 1, "inside")}
        </g>
      </svg>

      {/* paper: grain and vignette, screen space */}
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

export default InterventionV2;
