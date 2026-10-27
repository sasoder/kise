// ---------------------------------------------------------------------------
// FactionsUniteFiguresV2 (cold-review V2 of 58_FactionsUnite_Figures_SP;
// Pearl Harbor clip, Dwarkesh Patel with Sarah Paine; Dwarkesh map style).
//
// CHECK LINE: China's rival armies were fighting each other; they turn and form
// one front against Japan's orange.
//
// SPOKEN: "And the many bickering factions of China stopped fighting each other
// because they understood that Japan poses existential threat."
// Word -> local frame (24 fps, +-2): And 4, the 12, many 18, bickering 25,
// factions 41, of 52, China 55, stopped 68, fighting 76, each 84, other 89,
// because 94, they 99, understood 103, that 114, Japan 117, poses 126,
// existential 142, threat 160.
//
// DURATION 179 = the delivered native media (58_FactionsUnite_Figures_SP.mov):
// 167 spoken frames (seq 1406..1572, used 0..166) + a 12-frame living hold handle.
//
// MOTION (close -> wide -> close, one camera track):
//   0-66   CLOSE (Japan's orange kept off frame) on three armies of engraved 1937
//          soldiers (pearlFiguresV2) in a triangle in free China, all facing
//          inward: Communists (soft caps, red star flag) top left, provincials
//          (peaked caps, five-coloured flag) top right, Nationalists (steel
//          helmets, Blue Sky White Sun) below, split to face both. Every pair aims
//          at the other; bayonet lunges and recoils from f0, the biggest on
//          "bickering" (25) and "factions" (41).
//   67-75  "stopped": every rifle comes upright together in one eased move.
//   76-96  the men facing west wheel round through a drawn front view to face
//          east; the rest bring their rifles to the ready.
//   92-118 the pull-out, a brief geography reveal at f110-118: north China,
//          Manchukuo, the Bohai, Korea's edge, Japan's held land in orange; the
//          three march at the double, nearest first, each one body with one
//          ease-out, into one two-deep line of riflemen well back on the China
//          side, facing Japan (provincials in ~f121, Nationalists ~f132,
//          Communists ~f138); each standard-bearer stands just behind his own
//          group, staggered, the three flags flying west clear of each other.
//   117-160 Japan's border advances west at a near-constant speed from "Japan"
//          (117) to "threat" (160), stopping just past the ready bayonet tips.
//   118-142 one slow push back in on the wall (soldiers ~215 px tall from f142).
//   142-160 "existential threat": three heavy barbed orange arrows leave the
//          held area (drawn on by their tips from inside the orange) and catch
//          the advancing edge by f148, then ride it. CONTACT: the edge meets the
//          wall's bayonet tips on f155; FIRST REACTION: the wall braces from f156
//          (staggered to f159); the advance lands on "threat" (160).
//   160-178 living hold: slow push, the border creeping, flags in the wind.
//
// 1937 MAP: orange = Japan 1931 (home islands, Korea, Taiwan, Kwantung),
// Manchukuo and occupied north China (factionsUniteMapV2: the SP's OCCUPIED_1938
// minus Hainan, Feb 1939, and the Canton pocket, Oct 1938). The occupied area is
// still the APPROXIMATE 1938-39 front (it includes Xuzhou, Kaifeng and Wuhan, all
// taken in 1938); no 1937 front exists in the map world.
//
// SOURCES: map world, 1931 empire, Manchukuo and the 1938-39 front:
// pearlAsiaMapData (Natural Earth 10m; front APPROXIMATE). Flags: Republic of
// China national flag (1928-), Chinese Red Army flag (star, hammer and sickle),
// the Beiyang five-coloured flag (1912-28), redrawn two-tone. Uniforms: NRA 1937
// (M35 helmet, cotton tunic, puttees, Hanyang 88 / Chiang Kai-shek rifle with
// bayonet), Eighth Route Army soft cap. No numbers on screen.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { idle, poseTrack, track } from "../kits/maps/texcocoShared";
import { lerpFig, type FigPose } from "../kits/maps/texcocoFigures";
import { FRONT_1938_PTS, JAPAN_1931, MANCHUKUO } from "./pearlAsiaMapData";
import { OCCUPIED_V2 } from "./factionsUniteMapV2";
import { ACCENT, ACCENT_DEEP, Hatch, HatchPattern, Label, MapPage, SHADOW, WorldSvg, clamp01, dOf, px, runCamera, smoothstep, type Cam, type CamKey, type P2 } from "./pearlShared";
import { MAN_UNITS, POSES, RUN, Soldier37, runLegs, type Faction } from "./pearlFiguresV2";

export const FPS = 24;
export const DURATION = 179;

export const schema = z.object({ vignette: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55 });

// ---------------------------------------------------------------------------
// CAMERA (pearlShared runCamera: keys -> pchip -> damped follow, trails ~5 f).
// Rest zooms sit outside the map's LOD crossfade bands (a2 1.32-1.95, a4 4-5.8). The close
// keeps Japan's orange off frame (right edge < x 505) until the pull-out reveals it.
// Vertical framing: the lowest feet stay above y 1060 on every state.
// ---------------------------------------------------------------------------
const CAM_KEYS: CamKey[] = [
  { f: -40, x: 371, y: 816, k: 4.95 },
  { f: 0, x: 372, y: 816.5, k: 5.0 },
  { f: 60, x: 373, y: 817, k: 5.1 },
  { f: 92, x: 374, y: 817, k: 5.15 },
  { f: 104, x: 470, y: 816, k: 3.0 },
  { f: 112, x: 590, y: 806, k: 1.92 },
  { f: 118, x: 586, y: 808, k: 1.97 },
  { f: 142, x: 480, y: 823, k: 4.1 },
  { f: 166, x: 478, y: 823.5, k: 4.25 },
  { f: 210, x: 476, y: 824, k: 4.35 },
];
const camAt = (f: number): Cam => runCamera(CAM_KEYS, f);

// ---------------------------------------------------------------------------
// THE FRONT (the vertical stretch, Mongolia border -> the Yellow River bend)
// ---------------------------------------------------------------------------
const FRONT_N = (() => {
  let n = 0;
  while (n < FRONT_1938_PTS.length - 1 && FRONT_1938_PTS[n][1] < 862) n++;
  return n;
})();
const FRONT_V: P2[] = FRONT_1938_PTS.slice(0, FRONT_N + 1) as P2[];
/** the front's x at world y (first crossing on the vertical stretch) */
const frontX = (y: number) => {
  for (let i = 1; i < FRONT_V.length; i++) {
    const [x0, y0] = FRONT_V[i - 1];
    const [x1, y1] = FRONT_V[i];
    if ((y0 - y) * (y1 - y) <= 0 && y0 !== y1) return x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
  }
  return FRONT_V[FRONT_V.length - 1][0];
};
/** the westmost the front comes within 22 px of y (the line keeps clear of its steps) */
const westX = (y: number) => {
  let m = Infinity;
  for (let d = -22; d <= 22; d += 2) m = Math.min(m, frontX(y + d));
  return m;
};

// ---------------------------------------------------------------------------
// THE MEN: 52 world px tall (~260 screen px in the close, ~100 in the brief wide, ~215 from f142)
// ---------------------------------------------------------------------------
const MAN_H = 52;
const SC = MAN_H / MAN_UNITS;
type Man = {
  g: Faction;
  home: P2;
  bearer: boolean;
  /** facing in the clash */
  dir: 1 | -1;
  /** which rivalry drives him (0 comm-warl, 1 nat-comm, 2 nat-warl), its sign (+ = he lunges), toward whom */
  duel: 0 | 1 | 2;
  sgn: 1 | -1;
  at: P2;
};
const MEN: Man[] = [
  // the Communists, top left, facing east (back rank at the provincials, front rank at the Nationalists)
  { g: "comm", home: [312, 780], bearer: false, dir: 1, duel: 0, sgn: 1, at: [1, 0] },
  { g: "comm", home: [330, 780], bearer: true, dir: 1, duel: 0, sgn: 1, at: [1, 0] },
  { g: "comm", home: [318, 792], bearer: false, dir: 1, duel: 1, sgn: -1, at: [0.8, 0.6] },
  { g: "comm", home: [336, 792], bearer: false, dir: 1, duel: 1, sgn: -1, at: [0.8, 0.6] },
  // the provincial army, top right, facing west
  { g: "warl", home: [422, 780], bearer: true, dir: -1, duel: 0, sgn: -1, at: [-1, 0] },
  { g: "warl", home: [440, 780], bearer: false, dir: -1, duel: 0, sgn: -1, at: [-1, 0] },
  { g: "warl", home: [416, 792], bearer: false, dir: -1, duel: 2, sgn: -1, at: [-0.8, 0.6] },
  { g: "warl", home: [434, 792], bearer: false, dir: -1, duel: 2, sgn: -1, at: [-0.8, 0.6] },
  // the Nationalists, below, split: the west half at the Communists, the east half at the provincials
  { g: "nat", home: [360, 822], bearer: false, dir: -1, duel: 1, sgn: 1, at: [-0.8, -0.6] },
  { g: "nat", home: [377, 822], bearer: true, dir: -1, duel: 1, sgn: 1, at: [-0.8, -0.6] },
  { g: "nat", home: [394, 822], bearer: false, dir: 1, duel: 2, sgn: 1, at: [0.8, -0.6] },
  { g: "nat", home: [366, 834], bearer: false, dir: -1, duel: 1, sgn: 1, at: [-0.8, -0.6] },
  { g: "nat", home: [388, 834], bearer: false, dir: 1, duel: 2, sgn: 1, at: [0.8, -0.6] },
];
const NM = MEN.length;
// the line, two deep, set well back on the China side, riflemen only: front file 64 px
// behind the westmost front, rear file 16 further
const NR = MEN.filter((m) => !m.bearer).length;
const SLOT_Y0 = 728;
const SLOT_Y1 = 846;
const SLOTS: P2[] = Array.from({ length: NR }, (_, i) => {
  const y = SLOT_Y0 + ((SLOT_Y1 - SLOT_Y0) * i) / (NR - 1);
  return [westX(y) - (i % 2 ? 80 : 64), y];
});
const GROUP_ORDER: Faction[] = ["comm", "warl", "nat"];
/** each standard-bearer stands just behind his own group in the line, staggered in x,
 *  his flag flying west into open ground: three separate flags over one front */
const BEARER_SPOT: Record<Faction, P2> = {
  comm: [westX(740) - 122, 740],
  warl: [westX(782) - 108, 782],
  nat: [westX(826) - 122, 826],
};
/** where each man ends: riflemen into the line in group order (by home y then x), bearers behind */
const DEST: P2[] = (() => {
  const out: P2[] = new Array(NM);
  let s = 0;
  for (const g of GROUP_ORDER) {
    const ids = MEN.map((m, i) => ({ m, i })).filter(({ m }) => m.g === g);
    ids.sort((a, b) => a.m.home[1] - b.m.home[1] || a.m.home[0] - b.m.home[0]);
    for (const { m, i } of ids) out[i] = m.bearer ? BEARER_SPOT[g] : SLOTS[s++];
  }
  return out;
})();

// ---------------------------------------------------------------------------
// THE CLASH: three rivalries, each a signed track (+ = the first named lunges)
// ---------------------------------------------------------------------------
const DUELS = [
  // Communists (+) vs provincials
  track([[-30, 0], [0, 0.45], [12, -0.6], [25, 1], [33, 0.15], [41, -1], [50, 0.3], [60, 0.85], [68, 0.55], [300, 0.55]]),
  // Nationalists (+) vs Communists
  track([[-30, 0], [0, -0.5], [14, 0.45], [25, -0.95], [34, 0.35], [41, 1], [51, -0.4], [61, 0.6], [68, 0.35], [300, 0.35]]),
  // Nationalists (+) vs provincials
  track([[-30, 0], [0, 0.55], [16, -0.45], [25, 0.95], [34, -0.3], [41, -1], [52, 0.5], [62, -0.6], [68, -0.3], [300, -0.3]]),
];
const HALT = 68;
/** the stand-down: every rifle lowered to upright together in one eased move, 67-75 */
const snapAt = (f: number) => smoothstep((f - 67) / 8);

// ---------------------------------------------------------------------------
// THE TURN (men facing west) through a drawn front view, and the march
// ---------------------------------------------------------------------------
const TURN = poseTrack([
  [0, POSES.stop(-1)],
  [7, POSES.order()],
  [13, POSES.stop(1)],
  [20, POSES.ready(1)],
]);
const TURN_F = poseTrack([
  [0, POSES.carry(-1)],
  [7, POSES.flagOrder()],
  [14, POSES.carry(1)],
]);
const TURN0 = 76;
function hashN(i: number, k: number) {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
}
const MARCH: Record<Faction, [number, number]> = { warl: [97, 121], nat: [99, 132], comm: [101, 138] };
const PROFILE = (() => {
  const n = 400;
  const v = Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n;
    return smoothstep(u / 0.1) * (u < 0.55 ? 1 : 1 - smoothstep((u - 0.55) / 0.45) * 0.999);
  });
  const cum = [0];
  for (let i = 1; i <= n; i++) cum.push(cum[i - 1] + (v[i] + v[i - 1]) / 2);
  return { cum: cum.map((c) => c / cum[n]), v: v.map((x) => x / (cum[n] / n)) };
})();
const prog = (u: number) => {
  const x = clamp01(u) * 400;
  const i = Math.min(399, Math.floor(x));
  return PROFILE.cum[i] + (PROFILE.cum[i + 1] - PROFILE.cum[i]) * (x - i);
};
const speedAt = (u: number) => (u <= 0 || u >= 1 ? 0 : PROFILE.v[Math.round(clamp01(u) * 400)]);
/** inside a group the man nearest his slot moves first */
const DELAY: number[] = MEN.map((m, i) => {
  const d = Math.hypot(DEST[i][0] - m.home[0], DEST[i][1] - m.home[1]);
  const ds = MEN.filter((q) => q.g === m.g).map((q) => {
    const j = MEN.indexOf(q);
    return Math.hypot(DEST[j][0] - q.home[0], DEST[j][1] - q.home[1]);
  });
  return Math.round((d - Math.min(...ds)) * 0.06);
});

// ---------------------------------------------------------------------------
// JAPAN PRESSES IN. The border edge moves at a near-constant speed from the
// front toward a target just past the wall's ready bayonet tips, from "Japan"
// (117) to "threat" (160), creeping on through the hold. The arrows leave the
// held area on "existential" (142): drawn on by their tips from inside the
// orange, they catch the moving edge by f148 and ride it.
// ---------------------------------------------------------------------------
const ARROW_Y = [736, 784, 828];
/** 0 -> 1 from 117 to 160 at a near-constant speed (a 4-frame ease at each end) */
const PRESS_TABLE = (() => {
  const v = (f: number) => smoothstep((f - 117) / 4) * (1 - smoothstep((f - 156) / 4));
  const cum = [0];
  for (let f = 117; f < 160; f += 0.25) cum.push(cum[cum.length - 1] + v(f + 0.125) * 0.25);
  return cum.map((c) => c / cum[cum.length - 1]);
})();
const pressP = (f: number) => {
  if (f <= 117) return 0;
  if (f >= 160) return 1 + 0.002 * (f - 160);
  const x = (f - 117) * 4;
  const i = Math.floor(x);
  return PRESS_TABLE[i] + (PRESS_TABLE[Math.min(PRESS_TABLE.length - 1, i + 1)] - PRESS_TABLE[i]) * (x - i);
};
const pressW = (y: number) => smoothstep((y - 700) / 16) * smoothstep((862 - y) / 16);
/** the border's x at world y on frame f */
const edgeX = (y: number, f: number) => {
  const fx = frontX(y);
  const target = westX(y) - 36; // just past the ready bayonet tips (westX - 32), short of the men (westX - 56)
  return fx + (target - fx) * pressP(f) * pressW(y);
};
/** the edge reaches the ready bayonet tips (32 of its ~36 px from the front) */
const CONTACT = 155;
const BRACE0 = CONTACT + 1;

type State = { pos: P2; pose: FigPose };
const stateAt = (i: number, f: number): State => {
  const m = MEN[i];
  const lag = i % 3;
  const a = m.sgn * DUELS[m.duel](Math.min(f, HALT) - lag);
  const amp = a >= 0 ? 5 * a : 3 * a;
  const home: P2 = [m.home[0] + m.at[0] * amp, m.home[1] + m.at[1] * amp];
  const dir = m.dir;
  const clashPose = (): FigPose => {
    if (m.bearer) {
      const base = POSES.carry(dir);
      return { ...base, lean: base.lean + 4 * dir * a };
    }
    return a >= 0 ? lerpFig(POSES.guard(dir), POSES.thrust(dir), a) : lerpFig(POSES.guard(dir), POSES.recoil(dir), -a);
  };
  const stopPose = m.bearer ? POSES.carry(dir) : POSES.stop(dir);
  let pose: FigPose = lerpFig(clashPose(), stopPose, snapAt(f));
  if (f >= TURN0) {
    if (dir === -1) {
      const tf = f - TURN0 - Math.round(hashN(i, 3));
      if (tf > 0) pose = m.bearer ? TURN_F(tf) : TURN(tf);
    } else {
      const w = smoothstep((f - TURN0 - 2 - (i % 2)) / 14);
      pose = m.bearer ? POSES.carry(1) : lerpFig(stopPose, POSES.ready(1), w);
    }
  }
  const [t0g, t1] = MARCH[m.g];
  const t0 = t0g + DELAY[i];
  const u = (f - t0) / (t1 - t0);
  if (u <= 0) return { pos: home, pose: idle(pose, f, i, 0.8) };
  // ---- the march ----
  const slot = DEST[i];
  const p = prog(u);
  const pos: P2 = [home[0] + (slot[0] - home[0]) * p, home[1] + (slot[1] - home[1]) * p];
  const len = Math.hypot(slot[0] - home[0], slot[1] - home[1]);
  const amt = clamp01(speedAt(u) * 1.1) * (1 - smoothstep((u - 0.9) / 0.1));
  const carryW = smoothstep(u / 0.18) * (1 - smoothstep((u - 0.8) / 0.2));
  const ready = m.bearer ? POSES.carry(1) : POSES.ready(1);
  const moving = m.bearer ? POSES.carry(1) : lerpFig(ready, POSES.port(1), carryW);
  pose = u < 1 ? runLegs(moving, (p * len) / RUN.cycleDist(SC) + hashN(i, 9), amt) : ready;
  // ---- on the line: brace when the orange reaches the bayonets ----
  if (u >= 1) {
    const near = Math.min(...ARROW_Y.map((y) => Math.abs(y - slot[1])));
    const bw = smoothstep((f - BRACE0 - Math.min(3, near * 0.12)) / 6);
    pose = lerpFig(ready, m.bearer ? POSES.carryBrace(1) : POSES.brace(1), bw);
  }
  return { pos, pose: idle(pose, f, i, 0.8) };
};

// ---------------------------------------------------------------------------
// ADVANCE ARROW: a heavy orange shaft and a solid barbed head, drawn on from
// its tail in Japan's held area; then it rides the advancing border
// ---------------------------------------------------------------------------
const AdvanceArrow: React.FC<{ y: number; f: number; cam: Cam }> = ({ y, f, cam }) => {
  if (f <= 142) return null;
  const tailX = frontX(y) + 14;
  const tipX = tailX + (edgeX(y, f) - tailX) * (1 - Math.pow(1 - clamp01((f - 142) / 6), 2));
  const hl = px(cam, 58);
  const hw = px(cam, 34);
  const sw = px(cam, 9);
  if (tailX - tipX < hl * 0.5) return null;
  const back = tipX + hl;
  const barb = tipX + hl * 0.7;
  const tip: P2 = [tipX, y];
  const head = dOf([tip, [back, y - hw], [barb, y - sw], [barb, y + sw], [back, y + hw]], true);
  const shaft = barb < tailX ? dOf([[barb, y - sw], [tailX, y - sw], [tailX, y + sw], [barb, y + sw]], true) : "";
  const cs = px(cam, 3.2);
  return (
    <g strokeLinejoin="round">
      {shaft ? <path d={shaft} fill={SHADOW} fillOpacity={0.7} stroke={SHADOW} strokeOpacity={0.7} strokeWidth={cs * 2} /> : null}
      <path d={head} fill={SHADOW} fillOpacity={0.7} stroke={SHADOW} strokeOpacity={0.7} strokeWidth={cs * 2} />
      {shaft ? <path d={shaft} fill={ACCENT} /> : null}
      <path d={head} fill={ACCENT} />
    </g>
  );
};

/** the strip the orange gains west of the front (hatch + wash + its dashed new edge) */
const AdvanceBand: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  if (pressP(f) <= 0.002) return null;
  const pts = FRONT_V.filter(([, y]) => y >= 700 && y <= 862);
  const edge: P2[] = pts.map(([, y]) => [edgeX(y, f), y]);
  const poly = [...pts, ...[...edge].reverse()];
  return (
    <g>
      <defs>
        <HatchPattern id="fuv2-adv-pat" cam={cam} />
      </defs>
      <path d={dOf(poly, true)} fill={ACCENT_DEEP} fillOpacity={0.3} />
      <path d={dOf(poly, true)} fill="url(#fuv2-adv-pat)" opacity={0.75} />
      <path d={dOf(edge)} fill="none" stroke={ACCENT} strokeWidth={px(cam, 3)} strokeLinecap="round" />
    </g>
  );
};

const CHINA_AT: P2 = [376, 744];
const JAPAN_AT: P2 = [570, 760];

const FactionsUniteFiguresV2: React.FC<Props> = ({ vignette }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const wave = frame / 26;
  const states = MEN.map((_, i) => stateAt(i, frame));
  const order = states.map((s, i) => ({ s, i })).sort((a, b) => a.s.pos[1] - b.s.pos[1]);
  return (
    <MapPage world="asia" cam={cam} vignette={vignette}>
      <WorldSvg cam={cam}>
        <Hatch region={JAPAN_1931} cam={cam} id="fuv2-j31" />
        <Hatch region={MANCHUKUO} cam={cam} id="fuv2-mk" />
        <Hatch region={OCCUPIED_V2} cam={cam} id="fuv2-occ" />
        <AdvanceBand f={frame} cam={cam} />
        {order.map(({ s, i }) => (
          <Soldier37 key={i} faction={MEN[i].g} bearer={MEN[i].bearer} pose={s.pose} at={s.pos} scale={SC} uid={`fm${i}`} wave={wave + i * 0.37} seed={i} />
        ))}
        {ARROW_Y.map((y) => (
          <AdvanceArrow key={y} y={y} f={frame} cam={cam} />
        ))}
        <Label x={CHINA_AT[0]} y={CHINA_AT[1]} text="CHINA" appear={47} frame={frame} cam={cam} out={[100, 110]} />
        <Label x={JAPAN_AT[0]} y={JAPAN_AT[1]} text="JAPAN" appear={109} frame={frame} cam={cam} color={ACCENT} />
      </WorldSvg>
    </MapPage>
  );
};

export default FactionsUniteFiguresV2;
