// ---------------------------------------------------------------------------
// PointsAndLines (sarah-insurgency, cut 12). The clip's one-off "Dwarkesh 3D map" look (COMMON.md): the old printed
// China map laid as the floor of the Dwarkesh 3D misty air (styles/dwarkesh-3d.md + the map style's vintage feel),
// wooden wargame pieces standing on it. Opaque 1080x1920, 24 fps, 145 frames. RENDER WITH --gl=angle (WebGL2 ground).
//
// CHECK LINE: "Japan conquered a vast stretch of China, but guerrillas rose all through it, so Japan really held only
// the cities and the railway lines."
//
// THE LINE: "(If you think about) Japan, this happened to them as well. And this whole theater is useless to them
// until they can (stabilize it)."
// WORD -> FRAME (f0 = 12.333 s): about -3 · JAPAN 3 · this 22 · happened 31 · to 41 · them 45 · as 48 · well 52 ·
//   And 63 · this 73 · WHOLE 81 · THEATER 87 · is 98 · USELESS 108 · to 121 · them 131 · until 137 · (they 149)
// DURATION: the slot 12.333 -> 18.375 s = 6.042 s x 24 = 145 frames (f0..f144). Speaker after.
//
// THE MOTION: one continuous camera (pointsAndLinesState PL_KEYS). f0-12: it holds close on western Honshu with a
// slow drift (the Japan block with its Hinomaru on Honshu, "JAPAN" lying on Honshu, landing f-11 -> f3, whole in
// frame to ~f16). f12-52: the block sets sail and crosses at a ship's steady pace through the Korea Strait, across the
// Yellow Sea and through the Bohai Strait (SEA_ROUTE), easing to rest at Tianjin (f52), the camera pulling back to
// follow it in one lobe. Then it rises and turns to frame the whole occupied theatre looking north-north-west
// (yaw -20, so every garrison sits clear of the caption bands), centred near y 950 by ~f100, then a slow creep.
// THE CONQUEST (f52-108): from the landing the cream occupied hatch spreads inland with a crisp monotone front (the
// ground's radial front; reach = 23 world px / frame) and stops on FRONT_1938 (the region's own edge). The garrisons
// leave the Japan block on a schedule (GARRISON_DEP: Tianjin's is uncovered under the block at f52, then the far
// towns first, Taiyuan f53 ... Jinan f74), each pushed out of the block (KICK) and then travelling straight to its
// town, never ahead of the front; the held railways draw behind the front. The block pauses, shrinks as its garrisons
// leave (110 -> 72 wide), marches from f58 down a smooth curve west of Jinan and Kaifeng to Wuhan (stands f105) and
// is the Wuhan-front block.
// THE GUERRILLAS (f94-141): orange pawns RISE out of the map all through the countryside between the lines,
// starting in the Taihang (Jin-Cha-Ji) and spreading outward (starts f94 -> f108, each rise 26 f). As each pawn's head
// is up (rise 0.3: the CAUSE) the cream hatch clears from it outward (first reaction the next frame), a rough disc
// growing over 26 f, until the cream hold is left only as thin bands along the railways (and the Yangtze to Wuhan)
// and discs at the towns: POINTS AND LINES; the land between keeps a faint orange wash (it belongs to the pawns).
// Mechanism: two ground canvases on the one camera: below, the map + the cream occupied hatch; above, the same map
// with the orange wash + the cream BANDS only, clipped (CSS clip-path) to the union of the pawns' discs.
// f138-144: settled, the camera's creep.
// Orange = China's side (the pawns, the wash of their land); cream = Japan (blocks, garrisons, hatch, held lines).
// No labels but JAPAN (spoken), no numbers.
//
// DEPTH: one pinhole (F 1300) on the clip camera (insurgencyCamera.ts): D 960 -> 2480 -> 1150 -> 1127, pitch 36 ->
// 62.3, yaw -9 -> -20.3. Fog: fogFor(cam). Pieces (faces fixed on the map toward the end lens): Japan block 110
// (Wuhan block 72), garrisons 46, pawns 62 world px (>= 40 px tall in the wide). End-state constants for cut 40:
// pointsAndLinesState.ts.
//
// SOURCES: the occupied area (OCCUPIED_1939, FRONT_1938 from city capture dates) and the guerrilla base areas are
//   the clip world's (insChinaMapData.ts, after pearl-geo and COMMON.md). Held "points and lines" (COMMON.md): the
//   cities and the railways Beiping-Hankou to Xinxiang, Tianjin-Pukou, Shijiazhuang-Taiyuan, Jinan-Qingdao, Longhai
//   east of Kaifeng, Shanghai-Nanjing, Shanghai-Hangzhou, Beiping-Shanhaiguan, and the Yangtze to Wuhan (fell Oct
//   1938); railway courses city-to-city, APPROXIMATE (pointsAndLinesData.ts, scripts/clips/sarah-insurgency/
//   bake-points-and-lines.mjs). The landing below Tanggu stands for the North China Area Army's entry via Tianjin
//   (July-Aug 1937); one landing for the whole conquest is a simplification. Pawn spots are sampled over the occupied
//   land between the lines (more in the base areas Jin-Cha-Ji, Jizhong, Shandong, Jin-Ji-Lu-Yu, N4A Jiangsu / Anhui).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  Block,
  CHINA,
  Garrison,
  GroundLabel,
  GroundLine,
  HorizonHaze,
  INK,
  InsurgencyStage,
  MapGround3D,
  Pawn,
  WorldLayer,
  blockSpec,
  insWorld,
  sortFarToNear,
  toScreen,
  type InsWorld,
  type P2,
  type TerritoryLayer,
} from "./insurgencyShared";
import {
  BLOCK_FACE,
  END_TERRITORY,
  GARRISONS,
  GARRISON_FACE,
  GARRISON_SIZE,
  HELD_LINES,
  HONSHU,
  JAPAN_W,
  LANDING,
  PAWNS,
  PAWN_SIZE,
  PAWN_START,
  RISE_LEN,
  T_LAND,
  WUHAN_W,
  coreAt,
  frontField,
  plCam,
  reachAt,
  garrisonAt,
  GARRISON_DEP,
} from "./pointsAndLinesState";

export const FPS = 24;
export const DURATION = 145;
export const schema = z.object({ bands: z.boolean().optional() });
export const defaultProps = schema.parse({});

const REST = plCam(0);
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut3 = (t: number) => 1 - Math.pow(1 - c01(t), 3);
const easeInOut = (t: number) => {
  const v = c01(t);
  return v < 0.5 ? 4 * v * v * v : 1 - Math.pow(-2 * v + 2, 3) / 2;
};

// ---- the label ---------------------------------------------------------------------------------------------------
const JAPAN_LABEL_AT: P2 = [HONSHU[0] + 235, HONSHU[1] - 70];
const LABEL_YAW = -9;
const LABEL_T0 = -11; // lands on f3 (JAPAN 3)

// ---- the held lines: arclength tables (the front draws each one) -------------------------------------------------
const RAILS = HELD_LINES.filter((l) => l.kind === "rail").map((l) => {
  const cs: number[] = [0];
  for (let i = 1; i < l.pts.length; i++) cs.push(cs[i - 1] + Math.hypot(l.pts[i][0] - l.pts[i - 1][0], l.pts[i][1] - l.pts[i - 1][1]));
  return { ...l, cs, len: cs[cs.length - 1], field: l.pts.map((p) => frontField(p)) };
});
/** the part of a rail inside the front: [from, to] arclength fractions (null = none yet) */
const railSpan = (r: (typeof RAILS)[number], reach: number): [number, number] | null => {
  let a = Infinity;
  let b = -Infinity;
  for (let i = 0; i < r.pts.length; i++)
    if (r.field[i] < reach) {
      a = Math.min(a, r.cs[i]);
      b = Math.max(b, r.cs[i]);
    }
  if (!(b > a)) return null;
  return [a / r.len, b / r.len];
};

// ---- the guerrillas' clearing: one rough disc per pawn, growing once its head is up --------------------------------
const CLEAR_AT = 0.3; // the rise drive at which the pawn's head and collar are out (the cause)
const CLEAR_LEN = 26;
const clearR = (i: number, frame: number) => PAWNS[i].R * easeOut3((frame - (PAWN_START[i] + CLEAR_AT * RISE_LEN)) / CLEAR_LEN);
const discPath = (A: InsWorld, c: P2, R: number, seed: number) => {
  const n = 56;
  const out: string[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const r = R * (1 + 0.07 * Math.sin(3 * a + seed * 1.7) + 0.045 * Math.sin(7 * a + seed * 2.9) + 0.025 * Math.sin(13 * a + seed));
    const s = toScreen(A.cam, c[0] + Math.cos(a) * r, 0, c[1] + Math.sin(a) * r);
    if (s.z < 1) return "";
    out.push(`${s.x.toFixed(2)},${s.y.toFixed(2)}`);
  }
  return `M${out.join("L")}Z`;
};

// ---- the river (geography for the held Yangtze band) ---------------------------------------------------------------
const YANGTZE = CHINA.RIVER_YANGTZE.pts;

type Item = { at: P2; key: string; inside?: boolean; el: React.ReactNode };

const Bands: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    {[
      [1080, 1250],
      [1360, 1460],
    ].map(([a, b]) => (
      <rect key={a} x={2} y={a} width={1076} height={b - a} fill="#FFFFFF" fillOpacity={0.06} stroke="#FF00FF" strokeOpacity={0.7} strokeDasharray="8 6" />
    ))}
  </svg>
);

const PointsAndLines: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = plCam(frame);
  const A = insWorld({ cam, rest: REST, frame });
  const reach = reachAt(frame);
  const front = { kind: "radial" as const, at: LANDING, reach };

  // the ground below: the map + the cream occupation spreading from the landing
  const below: TerritoryLayer[] = frame >= T_LAND ? [{ d: CHINA.OCCUPIED_1939.d, color: "cream", front }] : [];
  // the ground above (inside the cleared discs): the orange wash of the land between + the cream hold that is left
  const above: TerritoryLayer[] = END_TERRITORY.map((t) => ({ ...t, front }));
  const discs = PAWNS.map((p, i) => {
    const R = clearR(i, frame);
    return R > 0.5 ? discPath(A, p.at, R, i + 1) : "";
  }).join("");

  // the Japan block -> the Wuhan-front block
  const cp = coreAt(frame);
  // it shrinks as its garrisons leave it (the first leaves f57, the last f78)
  const coreW = JAPAN_W + (WUHAN_W - JAPAN_W) * easeInOut((frame - T_LAND) / (Math.max(...GARRISON_DEP) - T_LAND + 2));
  const core = blockSpec(cp[0], cp[1], coreW, BLOCK_FACE);

  const items: Item[] = [];
  items.push({ at: cp, key: "core", el: <Block key="core" A={A} spec={core} color="cream" sticker="japan" uid="core" /> });
  if (frame >= T_LAND) {
    GARRISONS.forEach((g, i) => {
      const p = garrisonAt(i, frame);
      const inside = Math.hypot(p[0] - cp[0], p[1] - cp[1]) < coreW * 0.42;
      items.push({ at: p, key: `g${i}`, inside, el: <Garrison key={`g${i}`} A={A} x={p[0]} z={p[1]} size={GARRISON_SIZE} face={GARRISON_FACE} uid={`g${i}`} /> });
    });
  }
  PAWNS.forEach((p, i) => {
    const u = (frame - PAWN_START[i]) / RISE_LEN;
    if (u <= 0) return;
    items.push({ at: p.at, key: `p${i}`, el: <Pawn key={`p${i}`} A={A} x={p.at[0]} z={p.at[1]} size={PAWN_SIZE} rise={u} uid={`p${i}`} seed={i + 1} /> });
  });
  // painter's order far -> near; a garrison still inside the block is drawn before it (it comes out of it)
  const sorted = sortFarToNear(A, items, (it) => it.at);
  const inner = sorted.filter((it) => it.inside);
  const rest = sorted.filter((it) => !it.inside);
  const ci = rest.findIndex((it) => it.key === "core");
  const ordered = [...rest.slice(0, ci), ...inner, ...rest.slice(ci)];

  return (
    <AbsoluteFill style={{ backgroundColor: "#2A2620" }}>
      <InsurgencyStage A={A}>
        <MapGround3D world="china" cam={cam} air={A.ground} fog={A.fog} territory={below} />
        <AbsoluteFill style={{ clipPath: discs ? `path(nonzero, '${discs}')` : undefined, visibility: discs ? "visible" : "hidden" }}>
          <MapGround3D world="china" cam={cam} air={A.ground} fog={A.fog} territory={above} />
        </AbsoluteFill>
        <HorizonHaze A={A} id="hzPL" />
        <WorldLayer>
          <GroundLine A={A} pts={YANGTZE} w={3.2} color={INK.creamDim} opacity={0.5} />
          {RAILS.map((r) => {
            const sp = railSpan(r, reach);
            return sp ? <GroundLine key={r.key} A={A} pts={r.pts} kind="rail" w={7} dash={10} from={sp[0]} to={sp[1]} /> : null;
          })}
          <GroundLabel A={A} text="JAPAN" at={JAPAN_LABEL_AT} size={46} yaw={LABEL_YAW} t={frame - LABEL_T0} />
          {ordered.map((it) => (
            <React.Fragment key={it.key}>{it.el}</React.Fragment>
          ))}
        </WorldLayer>
      </InsurgencyStage>
      {bands ? <Bands /> : null}
    </AbsoluteFill>
  );
};

export default PointsAndLines;
