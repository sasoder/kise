import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { z } from "zod";
import { WIDE } from "./oceaniaMapData";
import { DOTS, DURATION as MOTION_DURATION, FRAME_H, FRAME_W, SIZE, cameraAt, clamp01, placeDot, type Cam } from "./minorityMotion";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// MinorityInOwnCountry (Si Sheppard, "Texcoco", cut E; delivered as
// 43_MinorityInOwnCountry.mov). Dwarkesh map style. Opaque 1080x1920,
// 23.976 fps, 106 frames.
//
// CHECK LINE: "In Australia and New Zealand the newcomers kept arriving until
// the original peoples were a small minority in their own land."
//
// THE LINE (frames from the cut's first frame):
//   as 0 · happened 4 · in 10 · for 21 · example 23 · AUSTRALIA 34 · and 43 ·
//   NEW 47 · ZEALAND 50 · that 59 · we'll 61 · become 67 · the 73 ·
//   MINORITY 76 · in 85 · our 90 · own 93 · country 97 · cut 106.
//
// THE MOTION (one, a tide of people, and one travelling camera): Australia
// alone fills the frame, sparsely dotted with ORANGE dots only (the original
// peoples). Cream dots (the newcomers) come in across the water in slim
// columns, land at the colonial ports and fill the land outward from them; the
// orange dots never change, they are simply surrounded. The camera glides
// east and a little south the whole way (never above ~10 px a frame), New
// Zealand entering on its name and filling the same way, and settles on the
// Tasman: the packed south-east on the left, New Zealand whole on the right.
// Three element types: the map, orange dots, cream dots. Two labels, each on
// its spoken word.
//
// THE NUMBERS (final state; each country shows its own share, the two are NOT
// on one common scale of people per dot):
//   Australia    19 orange among 500 dots = 3.8 %  (ABS estimate, 30 June
//                2021: 983,700 Aboriginal and Torres Strait Islander people)
//   New Zealand  18 orange among 101 dots = 17.8 % (Stats NZ, 2023 Census:
//                887,493 Maori)
// WHAT IS SCHEMATIC: where the cream dots stand is a softened picture of real
// settlement (dense at the ports and the south-east, sparse in the interior),
// not a census map; New Zealand is filled evenly. The ports are real (Sydney,
// Brisbane, Perth, Adelaide, Melbourne, Hobart; Auckland for the North Island,
// Christchurch for the South); the sea routes are drawn, not historical tracks.
// Map: scripts/build-texcoco-oceania-map.mjs (Natural Earth 10m, Lambert
// conformal conic 18 S / 36 S about 150 E, no state borders).
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = MOTION_DURATION;

const SEA = "#1B2226";
const INK = "#E9DDBF";
const ACCENT = "#FFB000";
const DARK = "#0B0907";
/** the newcomers: cream at ~0.8 over the land tone, mixed once so overlaps do not stack */
const CREAM_DIM = "#C6BA9F";

export const schema = z.object({
  vignette: z.number().min(0).max(1),
  labels: z.object({ australia: z.string(), newZealand: z.string() }),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  vignette: 0.55,
  labels: { australia: "AUSTRALIA", newZealand: "NEW ZEALAND" },
});

const camT = (cam: Cam) => ({ tx: FRAME_W / 2 - cam.cx * cam.k, ty: FRAME_H / 2 - cam.cy * cam.k });

// ---- paper: world-space mottle octaves + screen grain + vignette (incaShared's) ---
const Mottle: React.FC<{ cam: Cam; opacity?: number; tile?: number }> = ({ cam, opacity = 0.9, tile = 640 }) => {
  const { k } = cam;
  const { tx, ty } = camT(cam);
  const v = {
    x0: cam.cx - (FRAME_W / 2 + 24) / k,
    x1: cam.cx + (FRAME_W / 2 + 24) / k,
    y0: cam.cy - (FRAME_H / 2 + 24) / k,
    y1: cam.cy + (FRAME_H / 2 + 24) / k,
  };
  const L2 = Math.log2(k);
  const om = Math.floor(L2);
  const tm = L2 - om;
  const tiles: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = tile / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const oxS = (ox / 640) * S;
    const oyS = (oy / 640) * S;
    const x0 = Math.floor((v.x0 - oxS) / S) * S + oxS;
    const y0 = Math.floor((v.y0 - oyS) / S) * S + oyS;
    for (let y = y0; y < v.y1; y += S) for (let x = x0; x < v.x1; x += S) tiles.push({ x, y, s: S, o: op });
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: FRAME_W,
        height: FRAME_H,
        transformOrigin: "0 0",
        transform: `translate(${tx}px, ${ty}px) scale(${k})`,
        opacity,
      }}
    >
      {tiles.map((t, i) => (
        <Img
          key={`m-${i}`}
          src={staticFile("manchuria/mottle.png")}
          style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }}
        />
      ))}
    </div>
  );
};

// ---- labels: slide up 24 px while fading in, landing on the word ------------------
const LABEL_FRAMES = 14;
const slide = (frame: number, land: number) => {
  const u = clamp01((frame - (land - LABEL_FRAMES)) / LABEL_FRAMES);
  return { dy: 24 * Math.pow(1 - u, 3), op: clamp01((frame - (land - LABEL_FRAMES)) / 9) };
};
const LAND_AUSTRALIA = 34;
const LAND_NEW_ZEALAND = 49;
/** world anchors: the sea south of the continent, below the caption strip when the word lands; the sea north-west of New Zealand */
const AU_AT: [number, number] = [468, 1092];
/** AUSTRALIA leaves with the west of the continent: it fades before the frame edge would cut it */
const AU_OUT: [number, number] = [45, 56];
const NZ_AT: [number, number] = [1020, 808];

const MinorityInOwnCountry: React.FC<Props> = ({ vignette, labels }) => {
  const frame = useCurrentFrame();
  const cam = cameraAt(frame);
  const { k } = cam;
  const { tx, ty } = camT(cam);

  // every dot, in three layers: walkers and columns under the standing crowd, orange on top
  const moving: React.ReactNode[] = [];
  const standing: React.ReactNode[] = [];
  const orange: React.ReactNode[] = [];
  const p = [0, 0, 1];
  // only what is in frame (plus a margin) is drawn
  const mx = (FRAME_W / 2 + 30) / k;
  const my = (FRAME_H / 2 + 30) / k;
  for (let i = 0; i < DOTS.length; i++) {
    const d = DOTS[i];
    const st = placeDot(i, frame, p);
    if (Math.abs(p[0] - cam.cx) > mx || Math.abs(p[1] - cam.cy) > my) continue;
    const z = SIZE[d.country];
    const x = p[0].toFixed(2);
    const y = p[1].toFixed(2);
    if (d.orange) {
      orange.push(
        <g key={i}>
          <circle cx={x} cy={y} r={z.orange + z.halo + 1.8} fill={DARK} fillOpacity={0.38} />
          <circle cx={x} cy={y} r={z.orange + z.halo} fill={DARK} />
          <circle cx={x} cy={y} r={z.orange} fill={ACCENT} />
        </g>,
      );
      continue;
    }
    const r = z.cream * p[2];
    const node = (
      <g key={i}>
        <circle cx={x} cy={y} r={(r + z.casing).toFixed(2)} fill={DARK} />
        <circle cx={x} cy={y} r={r.toFixed(2)} fill={CREAM_DIM} />
      </g>
    );
    if (st === 2) standing.push(node);
    else moving.push(node);
  }

  const au = slide(frame, LAND_AUSTRALIA);
  const nz = slide(frame, LAND_NEW_ZEALAND);
  // type rides the map (world px; x k on screen: ~52 px and ~42 px caps lines)
  const sAu = 34;
  const sNz = 26;
  const haloOf = (size: number) => ({ stroke: SEA, strokeOpacity: 0.6, strokeWidth: size * 0.14, paintOrder: "stroke" as const });

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <Img
        src={staticFile(WIDE.src)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: WIDE.W,
          height: WIDE.H,
          transformOrigin: "0 0",
          transform: `translate(${(tx + WIDE.x0 * k).toFixed(3)}px, ${(ty + WIDE.y0 * k).toFixed(3)}px) scale(${(k / WIDE.s).toFixed(6)})`,
        }}
      />
      <Mottle cam={cam} opacity={0.9} />
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0 }}>
        <g transform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(6)})`}>
          {moving}
          {standing}
          {orange}
          {au.op > 0 && frame < AU_OUT[1] ? (
            <text
              x={AU_AT[0]}
              y={AU_AT[1] + au.dy / k}
              textAnchor="middle"
              opacity={au.op * 0.94 * (1 - clamp01((frame - AU_OUT[0]) / (AU_OUT[1] - AU_OUT[0])))}
              fill={INK}
              {...haloOf(sAu)}
              style={{ fontFamily: fellSC, fontSize: sAu, letterSpacing: sAu * 0.28 }}
            >
              {labels.australia}
            </text>
          ) : null}
          {nz.op > 0 ? (
            <text
              x={NZ_AT[0]}
              y={NZ_AT[1] + nz.dy / k}
              textAnchor="end"
              opacity={nz.op * 0.94}
              fill={INK}
              {...haloOf(sNz)}
              style={{ fontFamily: fellSC, fontSize: sNz, letterSpacing: sNz * 0.2 }}
            >
              {labels.newZealand}
            </text>
          ) : null}
        </g>
      </svg>
      <Img src={staticFile("manchuria/grain.png")} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 95% 80% at 50% 45%, rgba(8,6,4,0) 45%, rgba(8,6,4,${(vignette * 0.45).toFixed(3)}) 75%, rgba(8,6,4,${vignette.toFixed(
            3,
          )}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default MinorityInOwnCountry;
