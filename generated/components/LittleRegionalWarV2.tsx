import React from "react";
import { AbsoluteFill, Easing, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { FRAME_H, FRAME_W, clamp01, hash, smoothstep } from "./fieldShared";
// The same 1914 world and the same pushed borders as LittleRegionalWar
// (scripts/build-ww1-map.mjs); the static layers are ONE raster pair baked at
// this piece's fixed framing by scripts/bake-lrw-v2-rasters.mjs.
import { LRW_PLACES, PUSHES } from "./lrwOverlay";
import { FRAME } from "./lrwV2Frame";

export const FPS = 24;
// In-point 3.60 s of the clip SRT = f0; frame = round((t - 3.60) * 24).
// The line ends with "europe" at 10.94 s: round((10.94 - 3.60) * 24) = 176,
// + the 16-frame house tail = 192.
export const DURATION = 192;

// ---------------------------------------------------------------------------
// Sarah Paine: "Everyone before World War I thinks they're going to run a
// little regional war, and they're going to poach some territory from
// somebody else in Europe."
//
// V2 (the user's review of V1): an overlay must not zoom, so there is NO
// CAMERA: no zoom, pan, creep or sway. One fixed framing for all 192 frames:
// the whole feathered island of Europe centred in the frame (centre x 540,
// y 960), as large as it can be with its feather at alpha 0 at least 40 px
// before every frame edge. Nothing is ever cropped.
//
// TRANSPARENT, 1080x1920, 24 fps. Only the land (Dwarkesh map style: umber
// #3F3428, rim #6A5838, cream coast #E9DDBF, mottle and grain, a soft contact
// shadow baked into the alpha) and the fine dashed cream 1914 borders. Orange
// #FFB000 / #D98A0C (the hatch with the dashed orange edge) = poached
// territory, and nothing else. No text, dots, ties or arrows.
//
// THE GESTURES, each with its word:
//   1. f0-84   calm and static         — "everyone before World War I thinks …"
//   2. f84-94  on "regional", every 1914 border outside a ~260 km radius of the
//      Austro-Serbian border fades to 0.2; the local border stays 0.5: a
//      little regional war, shown without a zoom        — "a little regional war"
//   3. f121-150 the Austro-Serbian line (Drina, Sava, Danube) slides south-east
//      into Serbia, the orange hatch filling behind the moving line (the line
//      is the front), its old place a faint dashed ghost; ~2/3 on "territory"
//      f133, settled f150. Alone, and the largest bite
//                                      — "poach some territory from somebody else"
//   4. f150-168 the other borders return to full; f150-172 the SAME push at six
//      more borders, starts hashed, each settling in 18 f: France into
//      Alsace-Lorraine and the Rhineland, Italy north into the Trentino and the
//      Tyrol, Russia into Galicia, Germany into Russian Poland, Romania into
//      Transylvania, Bulgaria into Macedonia. Hold to f191 with a faint
//      highlight travelling the orange edges              — "… in Europe"
// Nothing else.
// ---------------------------------------------------------------------------

export const INK = "#E9DDBF";
export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";
const HILITE = "#FFE3A6";

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  /** preview only: a backdrop to judge the alpha against; the delivery is transparent */
  backdrop: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ ink: INK, accent: ACCENT, accentDeep: ACCENT_DEEP, backdrop: "transparent" });

export const T = {
  regional: [84, 94] as const,
  poach: [121, 150] as const,
  undim: [150, 168] as const,
  others: [150, 172] as const,
  otherDur: 18,
  hold: [172, 192] as const,
};
const ramp = (f: number, a: number, b: number) => smoothstep((f - a) / (b - a));

// At this one scale (k ~1.14) the V1 depths read as slivers, so every push goes
// deeper, still along its one direction (a shear, never self-intersecting)
// and to a historically motivated line: Serbia 320 km, the largest by far
// (to Nis: Austria and Bulgaria took all of Serbia in 1915, which is also why
// its bite meets Bulgaria's), the Rhineland (France's 1917 aim), the Brenner (Italy's 1919 line), Galicia to the Carpathians (Russia,
// 1914), Poland to Warsaw (Germany, 1915), all of Transylvania (Romania), and
// Vardar Macedonia (Bulgaria).
const DEPTH_KM: Record<string, number> = {
  serbia: 320,
  alsace: 190,
  italy: 150,
  galicia: 170,
  poland: 160,
  transylvania: 170,
  macedonia: 140,
};
const PX_PER_KM = 0.2637; // world px per km (the bake's scale)

type P2 = [number, number];
const PUSH = PUSHES.map((p) => {
  let mx = 0;
  let my = 0;
  for (const [x, y] of p.pts) {
    mx += x;
    my += y;
  }
  return { ...p, depth: (DEPTH_KM[p.id] ?? 100) * PX_PER_KM, mid: { x: mx / p.pts.length, y: my / p.pts.length } };
});
const OTHERS = PUSH.filter((p) => p.id !== "serbia").map((p) => p.id);
const OTHER_START: Record<string, number> = {};
[...OTHERS]
  .sort((a, b) => hash(a.charCodeAt(0) * 7 + a.length, 13) - hash(b.charCodeAt(0) * 7 + b.length, 13))
  .forEach((id, i) => {
    OTHER_START[id] = T.others[0] + ((T.others[1] - T.others[0]) * i) / (OTHERS.length - 1);
  });
const progress = (id: string, f: number) => {
  if (id === "serbia") {
    const u = clamp01((f - T.poach[0]) / (T.poach[1] - T.poach[0]));
    return 1 - (1 - u) * (1 - u); // starts with speed on "poach", ~2/3 on "territory"
  }
  return Easing.inOut(Easing.cubic)(clamp01((f - OTHER_START[id]) / T.otherDur));
};

const REGION_R = 260 * PX_PER_KM;
const REGION_FEATHER = 60 * PX_PER_KM;
const DIM = 0.2 / 0.5;
const dOf = (pts: P2[]) => `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}`;

// ---------------------------------------------------------------------------
const LittleRegionalWarV2: React.FC<Props> = ({ ink, accent, accentDeep, backdrop }) => {
  const frame = useCurrentFrame();
  const { k, tx, ty } = FRAME;
  const camT = `translate(${tx} ${ty}) scale(${k})`;
  const px = (v: number) => v / k;

  const dimT = ramp(frame, T.regional[0], T.regional[1]) * (1 - ramp(frame, T.undim[0], T.undim[1]));
  const outerA = 1 - (1 - DIM) * dimT;
  const dimAt = (p: { x: number; y: number }) => {
    const d = Math.hypot(p.x - LRW_PLACES.regionCentre.x, p.y - LRW_PLACES.regionCentre.y);
    return 1 - (1 - outerA) * smoothstep((d - REGION_R) / REGION_FEATHER);
  };
  const rcx = LRW_PLACES.regionCentre.x * k + tx;
  const rcy = LRW_PLACES.regionCentre.y * k + ty;
  const borderMask =
    outerA < 0.999
      ? `radial-gradient(circle at ${rcx.toFixed(1)}px ${rcy.toFixed(1)}px, #000 ${(REGION_R * k).toFixed(1)}px, rgba(0,0,0,${outerA.toFixed(3)}) ${((REGION_R + REGION_FEATHER) * k).toFixed(1)}px)`
      : undefined;

  // hatch at a fixed 11 px screen spacing
  const HS = px(11);
  const dash = `${px(8)} ${px(5)}`;
  const holdT = ramp(frame, T.hold[0], T.hold[0] + 8);

  return (
    <AbsoluteFill style={{ backgroundColor: backdrop }}>
      <Img src={staticFile("lrw-v2/land.png")} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
      <Img
        src={staticFile("lrw-v2/borders.png")}
        style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, WebkitMaskImage: borderMask, maskImage: borderMask }}
      />
      <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute" }}>
        <defs>
          <pattern id="hA" patternUnits="userSpaceOnUse" width={HS} height={HS} patternTransform="rotate(45)">
            <line x1={HS / 2} y1={0} x2={HS / 2} y2={HS} stroke={accent} strokeWidth={px(2)} />
          </pattern>
        </defs>
        <g transform={camT}>
          {PUSH.map((p) => {
            const e = progress(p.id, frame);
            const dimF = dimAt(p.mid);
            const ghost = (
              <path
                key={`${p.id}-g`}
                d={dOf(p.pts)}
                fill="none"
                stroke={ink}
                strokeOpacity={(0.5 - 0.25 * smoothstep(e / 0.3)) * dimF}
                strokeWidth={px(1.7)}
                strokeDasharray={dash}
                strokeLinecap="round"
              />
            );
            // the REVEAL rule: nothing orange at e = 0
            if (e <= 0) return ghost;
            const cur: P2[] = p.pts.map(([x, y], i) => [x + p.dir[0] * p.depth * p.bump[i] * e, y + p.dir[1] * p.depth * p.bump[i] * e]);
            const region = `${dOf(p.pts)}L${[...cur]
              .reverse()
              .map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`)
              .join("L")}Z`;
            const curD = dOf(cur);
            const ph = ((((frame - T.hold[0]) * 1.4 + hash(p.id.length, 3) * 30) % 40) + 40) % 40 / 40;
            const shOp = holdT * Math.sin(Math.PI * ph) * 0.55;
            return (
              <g key={p.id}>
                {ghost}
                <path d={region} fill={accentDeep} fillOpacity={0.2} fillRule="evenodd" />
                <path d={region} fill="url(#hA)" fillRule="evenodd" opacity={0.85} />
                <path d={curD} fill="none" stroke={accent} strokeWidth={px(2.2)} strokeDasharray={`${px(6.5)} ${px(6.5)}`} strokeDashoffset={-px(6.5)} strokeLinecap="round" />
                <path d={curD} fill="none" stroke={ink} strokeOpacity={0.5 * dimF + 0.35} strokeWidth={px(1.7)} strokeDasharray={`${px(6.5)} ${px(6.5)}`} strokeLinecap="round" />
                {shOp > 0.01 ? (
                  <path
                    d={curD}
                    fill="none"
                    stroke={HILITE}
                    strokeOpacity={shOp}
                    strokeWidth={px(2.6)}
                    pathLength={1}
                    strokeDasharray="0.16 2"
                    strokeDashoffset={-(ph * 1.16 - 0.16)}
                    strokeLinecap="round"
                  />
                ) : null}
              </g>
            );
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default LittleRegionalWarV2;
