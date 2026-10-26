// ---------------------------------------------------------------------------
// PeopleButIron (kyle-rome-industrial, cut 34). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 206 frames.
// One Roman work yard inside the misty teal air (AirStage, palette A, mood day) on a londonDepth one-point perspective,
// from the kit kits/dwarkesh-3d/dwarkesh3d. Camera and layout: ./peopleButIronPlan.ts; set pieces:
// ./peopleButIronProps.tsx.
//
// CHECK LINE: "Rome had people in huge numbers, but what they worked with was the same simple iron hand tools people
// had used for centuries — no machines: an Iron Age world."
//
// THE LINE: "And what the Romans, they've got people, but like they don't have technology. They don't have ideas.
// It's a late Iron Age civilization. [I do think…]"
// WORD -> FRAME (Whisper, heard ~6 f later): And what the Romans -7–24 · they've got people 29–51 · but like they
// don't have 55–86 · technology 86–101 · They don't have ideas 107–127 · It's a 132–155 · late Iron Age 155–177 ·
// civilization 177–186 · (I, on camera next) 198
// DURATION: the slot 34.968 -> 41.842 s = 6.874 s x 29.97 = 206 frames (f0..f205).
//
// THE MOTION: one camera. f0-78 ("the Romans, they've got people"): from a close group of stone-cutters the eye rises
// (2.5 -> 4.7 m) and pulls back, and the yard opens behind them: hand-workers at slabs and rock, carriers with baskets,
// rows of them deep into the haze, the colonnade going up far off. f40-140 ("but they don't have
// technology. They don't have ideas"): one lateral glide at an even speed along the front row toward the forge, past
// the rope team leaning back on a taut rope as their block inches along on wooden rollers. f110-188 ("It's a late Iron
// Age civilization"): the glide eases into a push-in on the smith at his anvil, the iron toolkit on its rack behind him;
// his hammer strikes the blade on "Iron" (contact f160, the first cream sparks f161) and once more (f190); the yard keeps
// working behind him in the haze.
// CAUSE BEFORE EFFECT: the rope is taut from f0 and every hauler's fists sit on it every frame (grip); the block and the
// men move together, the rollers turn at half the block's speed (rolling, not sliding); every striker's hammer or pick
// head meets its slab or rock at phase 0 of the blow (the slab's top is where the head lands); the smith's contact frames
// f100, f130, f160, f190 (first spark the frame after).
// ORANGE: none. The clip's orange is technology, and the point of this cut is that there is none: iron in slate grey,
// stone, timber, hemp and the folk's own muted cloth; the forge's embers and the hot blade in a dull red-brown, the
// sparks cream. bloom 0.
//
// DEPTH: a real eye (plan): F 1750 px, eye 2.1 m -> 4.3 m -> 2.1 m up, 1000 -> 1520 -> ~750 units in front of the front
// row (Z 0); a lens shift keeps the front row's feet on screen y 1095 (-> 1033 at the end). Fog by the eye's distance
// (AIR_SCENE_EYE), the people by stage depth (figFog). Yard rows at Z 950..5200 on a staggered grid widening with depth
// (heads never meet); the colonnade going up at Z 6800, hills at Z 17000. The rope runs diagonally (plan angle -0.72
// rad), so the team recedes in perspective to its block.
//
// SOURCES: none on screen. The picture: Roman stone-working by hand (hammer, point and claw chisel, pick; blocks moved
// on rollers and sledges with ropes and levers) and the Roman smith's open hearth and low anvil with hammer and tongs
// (the tombstone and relief iconography of fabri ferrarii, e.g. the Aquileia smith relief).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirBox, AirCyl, AirFloor, AirHorizonHazeW, AirShadow, AirStage, MAT, RomeFolk, WorldSvg, airWorldOf, mixHex, swayCam, type AirWorld, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { BLOCK, BLOCK_V, COLONNADE, CUTTERS_X, DURATION, FPS, ROPE_ANG, SMITH, SMITH_CONTACT, SMITH_PERIOD, STATIONS, eyeAt, h01 } from "./peopleButIronPlan";
import { Chips, HangingTool, Log, Prism, ROCK, RUBBLE, Sparks, TUFA, makeChips, type EyePos, type ToolKind } from "./peopleButIronProps";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

type FigPose = RomeFolk.FigPose;
type Kind = "slave" | "freeman";
type Item = { Z: number; key: string; el: React.ReactNode };

// ---------------------------------------------------------------------------
// strikers: both fists on the shaft (FreeStreetNoEngine's smithGrips: 26 units apart along it, so the shaft never
// turns over between coincident fists), and where the head lands at the blow (the slab's top)
// ---------------------------------------------------------------------------
const SG_LO = -4;
const SG_UP = 18;
const strikeGrips = (q: FigPose, at: P2, scale: number, dir: 1 | -1): { L: P2; R: P2 } => {
  const up = dir === 1 ? q.armL.w : q.armR.w;
  const g = dir === 1 ? q.armR.w : q.armL.w;
  const L0 = Math.hypot(up[0] - g[0], up[1] - g[1]) || 1;
  const sd: P2 = [(up[0] - g[0]) / L0, (up[1] - g[1]) / L0];
  const w = (k: number): P2 => [at[0] + (g[0] + sd[0] * k) * scale, at[1] + (g[1] + sd[1] * k) * scale];
  return dir === 1 ? { L: w(SG_UP), R: w(SG_LO) } : { R: w(SG_UP), L: w(SG_LO) };
};
const HEAD_AT: Record<string, P2> = {};
/** the tool head at the blow (phase 0), in the striker's own units */
const headAt = (kind: Kind, tool: "hammer" | "pick", dir: 1 | -1): P2 => {
  const k = `${kind}${tool}${dir}`;
  if (!HEAD_AT[k]) {
    const q0 = RomeFolk.POSES.strike(dir, 0);
    const a = RomeFolk.romeAnchors(kind, q0, [0, 0], 1, { variant: 0, grip: strikeGrips(q0, [0, 0], 1, dir), tool });
    HEAD_AT[k] = a.toolHead ?? [dir * 138, -51];
  }
  return HEAD_AT[k];
};

// ---------------------------------------------------------------------------
// the folk
// ---------------------------------------------------------------------------
/** muted inks: the ochre freeman to khaki (an ochre tunic near the lens read as the accent) */
const inksOf = (kind: Kind, variant: number) => (kind === "freeman" && variant === 1 ? { tunic: "#9A9070" } : undefined);
const Folk: React.FC<{ A: AirWorld; kind: Kind; variant: number; pose: FigPose; X: number; Z: number; uid: string; tool?: "hammer" | "pick"; grip?: { L?: P2; R?: P2 }; load?: "basket"; garb?: "tunic" | "exomis"; apron?: boolean }> = ({
  A,
  kind,
  variant,
  pose,
  X,
  Z,
  uid,
  tool,
  grip,
  load,
  garb,
  apron,
}) => {
  const { at, scale } = A.P.at(X, Z);
  const common = { pose, at, scale, uid, variant, fog: A.folkFog(Z), unitPx: A.k, tool, grip, load, inks: inksOf(kind, variant), texture: scale * A.k > 0.32 };
  return kind === "slave" ? <RomeFolk.Slave {...common} garb={garb ?? "tunic"} /> : <RomeFolk.Freeman {...common} pilleus={false} apron={apron ?? false} />;
};

/** a striker at his slab or rock: the head lands on its top at phase 0 */
const strikerItems = (A: AirWorld, eye: EyePos, f: number, o: { key: string; kind: Kind; variant: number; X: number; Z: number; dir: 1 | -1; tool: "hammer" | "pick"; period: number; off: number; work: "slab" | "rock"; ang?: number; garb?: "tunic" | "exomis"; apron?: boolean }): Item[] => {
  const head = headAt(o.kind, o.tool, o.dir);
  const ph = (f + o.off) / o.period;
  const q = RomeFolk.POSES.strike(o.dir, ph);
  const { at, scale } = A.P.at(o.X, o.Z);
  const topY = head[1] + 4;
  const Xw = o.X + head[0];
  const items: Item[] = [];
  const work =
    o.work === "slab" ? (
      <Prism A={A} eye={eye} X={Xw + o.dir * 20} Z={o.Z + 6} w={120} d={86} Y0={topY} ang={o.ang ?? 0} mat={TUFA} uid={`${o.key}w`} />
    ) : (
      <Prism A={A} eye={eye} X={Xw + o.dir * 16} Z={o.Z + 10} w={104} d={96} Y0={topY} ang={(o.ang ?? 0) + 0.5} mat={ROCK} uid={`${o.key}w`} />
    );
  items.push({
    Z: o.Z + 0.5,
    key: `${o.key}w`,
    el: (
      <g key={`${o.key}w`}>
        <AirShadow A={A} X={Xw + o.dir * 20} Z={o.Z + 6} w={78} d={56} uid={`${o.key}ws`} amt={0.7} />
        {work}
      </g>
    ),
  });
  items.push({
    Z: o.Z,
    key: o.key,
    el: (
      <g key={o.key}>
        <AirShadow A={A} X={o.X} Z={o.Z} w={56} d={28} uid={`${o.key}s`} amt={0.8} />
        <Folk A={A} kind={o.kind} variant={o.variant} pose={q} X={o.X} Z={o.Z} uid={o.key} tool={o.tool} grip={strikeGrips(q, at, scale, o.dir)} garb={o.garb} apron={o.apron} />
      </g>
    ),
  });
  return items;
};

/** a carrier with a basket of chips on his shoulder, walking his lane at the cast's own stride */
const walkerItem = (A: AirWorld, f: number, o: { key: string; kind: Kind; variant: number; X: number; Z: number; dir: 1 | -1; off: number }): Item => {
  const adv = RomeFolk.walkAdvance(1);
  const X = o.X + o.dir * adv * (f - 103);
  const q = RomeFolk.POSES.carry(o.dir, (f + o.off) / RomeFolk.WALK_CYCLE);
  return {
    Z: o.Z,
    key: o.key,
    el: (
      <g key={o.key}>
        <AirShadow A={A} X={X} Z={o.Z} w={56} d={28} uid={`${o.key}s`} amt={0.8} />
        <Folk A={A} kind={o.kind} variant={o.variant} pose={q} X={X} Z={o.Z} uid={o.key} load="basket" />
      </g>
    ),
  };
};

// ---------------------------------------------------------------------------
// static world data
// ---------------------------------------------------------------------------
const NEAR_CHIPS = makeChips(100, 1100, -2600, 2400, -1250, 900, 4, 15, 1.0);
/** soft patches on the ground: stone dust (light) and trodden earth (dark), so the floor is never one flat tone */
const PATCHES = Array.from({ length: 44 }, (_, i) => ({ X: -2600 + 5200 * h01(i, 81), Z: -1150 + 2900 * Math.pow(h01(i, 82), 1.3), r: 120 + 260 * h01(i, 83), dust: h01(i, 84) < 0.55 }));
const COAL_CHIPS = makeChips(5000, 46, 300, 1000, -260, 200, 3, 8, 1.0);
const YARD_CHIPS = makeChips(900, 380, -4200, 4200, 300, 3600, 7, 20, 1.3);
/** the foreground (the bottom third is never a plain slab): rubble heaps, a few blocks, baskets of chips, tools lying,
 *  and by the anvil a quench tub */
type Fore = { kind: "heap" | "block" | "basket" | "tub" | "hammer" | "pick"; X: number; Z: number; s: number; ang?: number };
const FORE: Fore[] = [
  { kind: "heap", X: -1350, Z: -420, s: 1.3 },
  { kind: "basket", X: -1180, Z: -520, s: 1 },
  { kind: "hammer", X: -980, Z: -380, s: 1, ang: -8 },
  { kind: "heap", X: -760, Z: -560, s: 1.0 },
  { kind: "heap", X: -420, Z: -420, s: 1.1 },
  { kind: "pick", X: -200, Z: -520, s: 1, ang: 6 },
  { kind: "basket", X: 30, Z: -380, s: 1 },
  { kind: "heap", X: 240, Z: -560, s: 1.4 },
  { kind: "block", X: 420, Z: -380, s: 0.7, ang: -0.3 },
  { kind: "tub", X: 950, Z: 40, s: 0.8 },
  { kind: "basket", X: 600, Z: -230, s: 1.1 },
  { kind: "heap", X: 760, Z: -360, s: 0.6 },
];
const TOOLS_ON_RACK: { kind: ToolKind; dx: number; rot: number; bar: 0 | 1 }[] = [
  { kind: "tongs", dx: 22, rot: 2, bar: 0 },
  { kind: "chisel", dx: 70, rot: 1.5, bar: 0 },
  { kind: "saw", dx: 124, rot: 0.5, bar: 0 },
  { kind: "hammer", dx: 336, rot: -1, bar: 0 },
  { kind: "pick", dx: 92, rot: -1, bar: 1 },
  { kind: "sickle", dx: 296, rot: 178, bar: 1 },
];
const RACK = { X0: 700, X1: 1090, Z: 560, top: -430, bar: -392, bar2: -236 };
const HEARTH = { x0: 240, x1: 470, z0: 230, z1: 440, top: -128 };
const ANVIL_Z = SMITH.Z;
/** the smith's rhythm: blows every SMITH_PERIOD frames (contacts f100, f130, f160 on "Iron", f190); after the f190 blow
 *  he rests the hammer on the blade, lifting it only a hair, so the last frame is just after a blow (face clear) */
const LAST_BLOW = SMITH_CONTACT + SMITH_PERIOD;
const smithPhase = (f: number) => {
  if (f <= LAST_BLOW) return (f - SMITH_CONTACT) / SMITH_PERIOD;
  const u = Math.min(1, (f - LAST_BLOW) / 15);
  // leaves the blade at the same rate as a blow (phase 1/30 per frame), easing to a rest at phase ~0.09
  return 1 + 0.09 * (1 - Math.pow(1 - u, 2.2));
};
const COAL = { lit: "#4A423C", mid: "#36302B", dark: "#211C19" };

const PeopleButIron: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const E = eyeAt(frame);
  const cam = swayCam(E.cam, frame);
  const E0 = eyeAt(0);
  const A = airWorldOf({ cam, rest: E0.cam, depth: E.depth, frame });
  const eye: EyePos = { x: cam.cx, y: -E.Eh, z: -E.Dc };
  const P = A.P;
  const f = frame;
  const items: Item[] = [];

  // ---- the far works: the stepped quarry face (left) and the colonnade going up (right) ----------------------------
  const far: React.ReactNode[] = [];
  {
    // the hills beyond the works, almost the air's own colour (the farm world's hills in the same haze)
    const HZ = 17000;
    const pts: P2[] = [];
    for (let i = 0; i <= 60; i++) {
      const X = -16000 + (32000 * i) / 60;
      const Y = -(900 + 520 * Math.sin(X / 2300 + 0.7) + 330 * Math.sin(X / 900 + 2.1) + 160 * Math.sin(X / 420));
      pts.push(P.p(X, Y, HZ));
    }
    const base = [P.p(16000, 0, HZ), P.p(-16000, 0, HZ)];
    far.push(<path key="hills" d={`M${[...pts, ...base].map((v) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`).join("L")}Z`} fill={A.tone("#4F7266", HZ, 900)} />);
  }
  far.push(<AirBox key="stylo" A={A} X0={COLONNADE.X0} X1={COLONNADE.X1} Y0={-90} Y1={0} Z0={COLONNADE.Z - 60} Z1={COLONNADE.Z + 520} mat={TUFA} uid="stylo" />);
  const colH = [880, 880, 620, 880, 410, 700, 230, 880];
  for (let row = 1; row >= 0; row--)
    colH.forEach((hh, i) => {
      const X = COLONNADE.X0 + 180 + i * 440;
      const Zc = COLONNADE.Z + row * 420;
      const H = row ? Math.max(200, hh - 260) : hh;
      far.push(<AirCyl key={`c${row}${i}`} A={A} X={X} Z={Zc} R={52} Y0={-90 - H} Y1={-90} mat={MAT.marble} uid={`c${row}${i}`} joints={Array.from({ length: Math.floor(H / 150) }, (_, j) => -90 - (j + 1) * 150)} />);
    });
  // timber scaffold poles round the unfinished columns
  for (let i = 0; i < 5; i++) {
    const X = COLONNADE.X0 + 1060 + i * 380;
    far.push(<AirBox key={`sp${i}`} A={A} X0={X - 9} X1={X + 9} Y0={-1080} Y1={-90} Z0={COLONNADE.Z - 110} Z1={COLONNADE.Z - 92} mat={MAT.timber} uid={`sp${i}`} rim={0.4} />);
  }
  far.push(<AirBox key="sb1" A={A} X0={COLONNADE.X0 + 1040} X1={COLONNADE.X0 + 2620} Y0={-720} Y1={-704} Z0={COLONNADE.Z - 112} Z1={COLONNADE.Z - 90} mat={MAT.timber} uid="sb1" rim={0.4} />);
  far.push(<AirBox key="sb2" A={A} X0={COLONNADE.X0 + 1040} X1={COLONNADE.X0 + 2620} Y0={-420} Y1={-404} Z0={COLONNADE.Z - 112} Z1={COLONNADE.Z - 90} mat={MAT.timber} uid="sb2" rim={0.4} />);

  // ---- the yard's stations ----------------------------------------------------------------------------------------
  for (const s of STATIONS) {
    if (s.kind === "stack") {
      const k = `st${s.id}`;
      const ang = (h01(s.id, 13) - 0.5) * 0.9;
      items.push({
        Z: s.Z,
        key: k,
        el: (
          <g key={k}>
            <AirShadow A={A} X={s.X} Z={s.Z} w={150 * s.size} d={90 * s.size} uid={`${k}s`} amt={0.6} />
            <Prism A={A} eye={eye} X={s.X} Z={s.Z} w={220 * s.size} d={130 * s.size} Y0={-95 * s.size} ang={ang} mat={TUFA} uid={`${k}a`} />
            <Prism A={A} eye={eye} X={s.X + 20} Z={s.Z + 10} w={150 * s.size} d={110 * s.size} Y0={-180 * s.size} Y1={-95 * s.size} ang={ang + 0.15} mat={TUFA} uid={`${k}b`} />
          </g>
        ),
      });
    } else if (s.kind === "heap") {
      // a rubble heap: a low mound of chips
      const k = `hp${s.id}`;
      items.push({
        Z: s.Z,
        key: k,
        el: (
          <g key={k}>
            <AirShadow A={A} X={s.X} Z={s.Z} w={170 * s.size} d={110 * s.size} uid={`${k}s`} amt={0.5} />
            <Chips A={A} eye={eye} chips={HEAPS[s.id % HEAPS.length].map((c) => ({ ...c, X: s.X + c.X * s.size, Z: s.Z + c.Z * s.size, r: c.r * s.size }))} mat={TUFA} uid={k} bands={[-9e9, 9e9]} />
          </g>
        ),
      });
    } else if (s.kind === "carry") {
      items.push(walkerItem(A, f, { key: `cw${s.id}`, kind: s.who, variant: s.variant, X: s.X, Z: s.Z, dir: s.dir, off: s.off }));
    } else if (s.kind === "dress" || s.kind === "pick") {
      items.push(
        ...strikerItems(A, eye, f, { key: `w${s.id}`, kind: s.who, variant: s.variant, X: s.X, Z: s.Z, dir: s.dir, tool: s.kind === "dress" ? "hammer" : "pick", period: s.period, off: s.off, work: s.kind === "dress" ? "slab" : "rock", ang: (h01(s.id, 14) - 0.5) * 0.8 }),
      );
    }
  }

  // ---- the front row: the stone-cutters of the opening -------------------------------------------------------------
  items.push(...strikerItems(A, eye, f, { key: "cA", kind: "slave", variant: 1, X: CUTTERS_X - 170, Z: 30, dir: 1, tool: "hammer", period: 29, off: 9, work: "slab", ang: 0.12, garb: "exomis" }));
  items.push(...strikerItems(A, eye, f, { key: "cB", kind: "freeman", variant: 1, X: CUTTERS_X + 210, Z: 190, dir: -1, tool: "hammer", period: 32, off: 24, work: "slab", ang: -0.2 }));
  items.push(...strikerItems(A, eye, f, { key: "cC", kind: "slave", variant: 0, X: CUTTERS_X - 520, Z: 360, dir: 1, tool: "pick", period: 34, off: 3, work: "rock", ang: 0.3 }));
  items.push(walkerItem(A, f, { key: "cD", kind: "slave", variant: 2, X: CUTTERS_X - 60, Z: -170, dir: 1, off: 7 }));

  // ---- the rope team: a block on rollers, a taut rope receding diagonally, five men leaning back on it -------------
  {
    const travel = BLOCK_V * f;
    const ux = Math.cos(ROPE_ANG);
    const uz = Math.sin(ROPE_ANG);
    // the perpendicular in plan, toward us (its Z < 0)
    const nx = uz;
    const nz = -ux;
    const bcx = BLOCK.X + ux * travel;
    const bcz = BLOCK.Z + uz * travel;
    const yB = -2 * BLOCK.roll;
    // the hook: the middle of the block's leading face
    const hook: [number, number, number] = [bcx + (ux * BLOCK.w) / 2, yB - 58, bcz + (uz * BLOCK.w) / 2];
    const Lr = 1150;
    const endY = -196;
    const ropeAt = (s: number): [number, number, number] => [hook[0] + ux * s, hook[1] + (endY - hook[1]) * Math.min(1, s / Lr), hook[2] + uz * s];
    const pr = (p: [number, number, number]) => P.p(p[0], p[1], p[2]);
    // rollers under the block, rolling (centres at half the block's travel), their axes across the motion
    const rollers: React.ReactNode[] = [];
    for (let i = 0; i < 3; i++) {
      const sOff = -90 + i * 90 + travel / 2 - travel;
      const rx = bcx + ux * sOff;
      const rz = bcz + uz * sOff;
      rollers.push(<Log key={`rl${i}`} A={A} eye={eye} X={rx} Z={rz} Yc={-BLOCK.roll} R={BLOCK.roll} len={BLOCK.d + 70} ang={ROPE_ANG + Math.PI / 2} turn={travel / 2 / BLOCK.roll} uid={`rl${i}`} />);
    }
    items.push({
      Z: bcz,
      key: "blk",
      el: (
        <g key="blk">
          <AirShadow A={A} X={bcx} Z={bcz} w={170} d={130} uid="blks" amt={0.75} />
          {rollers}
          <Prism A={A} eye={eye} X={bcx} Z={bcz} w={BLOCK.w} d={BLOCK.d} Y0={yB - BLOCK.h} Y1={yB} ang={ROPE_ANG} mat={TUFA} uid="blkb" />
        </g>
      ),
    });
    const men = [
      { s: 200, side: 1, kind: "slave" as Kind, v: 0 },
      { s: 400, side: -1, kind: "slave" as Kind, v: 1 },
      { s: 600, side: 1, kind: "freeman" as Kind, v: 0 },
      { s: 800, side: -1, kind: "slave" as Kind, v: 2 },
      { s: 1000, side: 1, kind: "slave" as Kind, v: 4 },
    ];
    const ropeW = 7;
    const ropeCol = (Z: number) => A.tone(MAT.hemp.mid, Z, 150);
    let sPrev = 0;
    men.forEach((m, i) => {
      const fp = ropeAt(m.s + 84);
      const Xm = fp[0] - nx * 30;
      const Zm = fp[2] - nz * 30;
      // walking backward (to the right, toward us) as the block comes on: phase from the screen-x component of travel
      const ph = -(travel * ux + i * 17) / (2 * RomeFolk.PUSH.stride);
      const base = RomeFolk.POSES.push(-1, ph);
      const strain = 0.5 + 0.5 * Math.sin((2 * Math.PI * (f + i * 5)) / 46);
      const q: FigPose = { ...base, lean: -20 - 4 * strain, crouch: 20 + 6 * strain + (4 - i) * 3, pitch: -6 };
      const gA = pr(ropeAt(m.s));
      const gB = pr(ropeAt(m.s + 24));
      items.push({
        Z: Zm,
        key: `rm${i}`,
        el: (
          <g key={`rm${i}`}>
            <AirShadow A={A} X={Xm} Z={Zm} w={58} d={28} uid={`rm${i}s`} amt={0.8} />
            <Folk A={A} kind={m.kind} variant={m.v} pose={q} X={Xm} Z={Zm} uid={`rm${i}`} grip={{ L: gA, R: gB }} garb={i === 1 ? "exomis" : "tunic"} apron={false} />
          </g>
        ),
      });
      // the rope from the previous man's grip to this man's: on his far side it lies behind him, on his near side over him
      const a = pr(ropeAt(sPrev));
      const b = pr(ropeAt(m.s + 24));
      const zSeg = (ropeAt(sPrev)[2] + ropeAt(m.s)[2]) / 2;
      items.push({
        Z: Zm - 1,
        key: `rp${i}`,
        el: <path key={`rp${i}`} d={`M${a[0].toFixed(2)},${a[1].toFixed(2)}L${b[0].toFixed(2)},${b[1].toFixed(2)}`} stroke={ropeCol(zSeg)} strokeWidth={ropeW * P.r(zSeg)} strokeLinecap="round" />,
      });
      sPrev = m.s + 24;
    });
    // the tail beyond the last man: slack, down to the ground
    const tail0 = ropeAt(sPrev);
    const tA = pr(tail0);
    const tB = P.p(tail0[0] + ux * 110, -36, tail0[2] + uz * 110);
    const tC = P.p(tail0[0] + ux * 190 + nx * 30, 0, tail0[2] + uz * 190 + nz * 30);
    items.push({ Z: tail0[2] - 60, key: "rpt", el: <path key="rpt" d={`M${tA[0].toFixed(2)},${tA[1].toFixed(2)}Q${tB[0].toFixed(2)},${tB[1].toFixed(2)} ${tC[0].toFixed(2)},${tC[1].toFixed(2)}`} fill="none" stroke={ropeCol(tail0[2])} strokeWidth={ropeW * P.r(tail0[2])} strokeLinecap="round" /> });
  }

  // ---- the forge: the hearth (passed on the glide), the smith at his anvil, the rack of the whole iron toolkit -----
  {
    const dir = 1 as const;
    const head = headAt("freeman", "hammer", dir);
    const ph = smithPhase(f);
    const q = RomeFolk.POSES.strike(dir, ph);
    const { at, scale } = P.at(SMITH.X, SMITH.Z);
    const ax = SMITH.X + head[0];
    const aTop = head[1] + 4;
    const iron = MAT.iron;
    const hitN = Math.min(1, Math.floor((f - SMITH_CONTACT) / SMITH_PERIOD));
    const sinceHit = f - (SMITH_CONTACT + hitN * SMITH_PERIOD);
    const bl = (X0: number, X1: number, Y: number) => [P.p(X0, Y, ANVIL_Z - 7), P.p(X1, Y, ANVIL_Z - 7), P.p(X1 + 4, Y, ANVIL_Z + 7), P.p(X0, Y, ANVIL_Z + 7)];
    const bladeD = (pts: P2[]) => `M${pts.map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join("L")}Z`;
    items.push({
      Z: ANVIL_Z + 2,
      key: "anv",
      el: (
        <g key="anv">
          <AirShadow A={A} X={ax} Z={ANVIL_Z} w={70} d={50} uid="anvs" amt={0.85} />
          <AirCyl A={A} X={ax} Z={ANVIL_Z} R={42} Y0={-22} Y1={0} mat={MAT.timber} uid="stump" />
          <AirBox A={A} X0={ax - 20} X1={ax + 20} Y0={aTop + 8} Y1={-22} Z0={ANVIL_Z - 15} Z1={ANVIL_Z + 15} mat={iron} uid="anvb" />
          <AirBox A={A} X0={ax - 34} X1={ax + 34} Y0={aTop} Y1={aTop + 8} Z0={ANVIL_Z - 19} Z1={ANVIL_Z + 19} mat={iron} uid="anvt" />
          <path d={bladeD(bl(ax - 64, ax + 38, aTop - 0.5))} fill={A.tone(iron.mid, ANVIL_Z, 50)} stroke={A.tone(iron.dark, ANVIL_Z, 50)} strokeWidth={A.lw(0.8)} />
          <path d={bladeD(bl(ax - 4, ax + 38, aTop - 0.6))} fill={A.tone(mixHex("#8E4F36", "#6E3A2A", 0.4 * (1 - Math.exp(-sinceHit / 30))), ANVIL_Z, 50)} />
        </g>
      ),
    });
    items.push({
      Z: SMITH.Z,
      key: "smith",
      el: (
        <g key="smith">
          <AirShadow A={A} X={SMITH.X} Z={SMITH.Z} w={64} d={30} uid="smis" amt={0.85} />
          <Folk A={A} kind="freeman" variant={2} pose={q} X={SMITH.X} Z={SMITH.Z} uid="smith" tool="hammer" grip={strikeGrips(q, at, scale, dir)} />
        </g>
      ),
    });
    items.push({ Z: SMITH.Z - 30, key: "spk", el: <Sparks key="spk" A={A} X={ax + 6} Y={aTop - 4} Z={ANVIL_Z - 8} age={sinceHit} seed={hitN + 7} /> });
    // the hearth behind his back: a waist-high stone hearth, a bed of charcoal glowing a dull red-brown, a little smoke
    const { x0: hx0, x1: hx1, z0: hz0, z1: hz1, top: hTop } = HEARTH;
    const hzm = (hz0 + hz1) / 2;
    const flick = (k: number) => 0.7 + 0.3 * Math.sin(f * (0.21 + 0.05 * h01(k, 61)) + 6.28 * h01(k, 62));
    const coals: React.ReactNode[] = [];
    for (let i = 0; i < 40; i++) {
      const cx = hx0 + 22 + (hx1 - hx0 - 44) * h01(i, 63);
      const cz = hz0 + 22 + (hz1 - hz0 - 44) * h01(i, 64);
      const c = P.p(cx, hTop - 4, cz);
      const rr = (6 + 8 * h01(i, 65)) * P.r(cz);
      // the charcoal: dark lumps; near the middle a few glow a dull red-brown (never the clip's orange)
      const mid = 1 - Math.min(1, Math.hypot((cx - (hx0 + hx1) / 2) / ((hx1 - hx0) / 2), (cz - hzm) / ((hz1 - hz0) / 2)));
      const hot = h01(i, 66) < 0.3 + 0.5 * mid;
      const col = hot ? mixHex("#4A2820", "#8A4232", flick(i) * (0.4 + 0.6 * mid)) : mixHex("#241E1B", "#3A302A", h01(i, 67));
      coals.push(<ellipse key={i} cx={c[0]} cy={c[1]} rx={rr} ry={rr * 0.55} fill={A.tone(col, cz, 140)} />);
    }
    const smoke: React.ReactNode[] = [];
    for (let i = 0; i < 7; i++) {
      const life = 90;
      const age = (f + i * (life / 7)) % life;
      const u = age / life;
      const sp = P.p((hx0 + hx1) / 2 + 40 * Math.sin(u * 3 + i) + u * 60, hTop - 30 - u * 520, hzm + 20);
      const rr = (40 + 90 * u) * P.r(hzm);
      smoke.push(<ellipse key={i} cx={sp[0]} cy={sp[1]} rx={rr} ry={rr * 0.8} fill={A.tone("#B8B2A4", hzm, 300 + u * 500)} opacity={0.14 * Math.sin(Math.PI * u)} />);
    }
    const ec = P.p((hx0 + hx1) / 2, hTop - 2, hzm);
    const er = ((hx1 - hx0) / 2) * P.r(hzm);
    items.push({
      Z: hz0,
      key: "hearth",
      el: (
        <g key="hearth">
          <AirShadow A={A} X={(hx0 + hx1) / 2} Z={hzm} w={170} d={130} uid="hs" amt={0.7} />
          <AirBox A={A} X0={hx0} X1={hx1} Y0={hTop} Y1={0} Z0={hz0} Z1={hz1} mat={ROCK} uid="hb" />
          {(() => {
            // the fire mouth in the hearth's front: an arch, dark inside, a dull red-brown glow low in it
            const q: P2[] = [];
            const xa = hx0 + 62;
            const xb = hx1 - 62;
            q.push(P.p(xa, -6, hz0));
            for (let i = 0; i <= 12; i++) {
              const t = Math.PI - (i / 12) * Math.PI;
              q.push(P.p((xa + xb) / 2 + ((xb - xa) / 2) * Math.cos(t), -50 - 38 * Math.sin(t), hz0));
            }
            q.push(P.p(xb, -6, hz0));
            const d = `M${q.map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join("L")}Z`;
            const g = P.p((xa + xb) / 2, -14, hz0);
            return (
              <g>
                <defs>
                  <radialGradient id="mouth" gradientUnits="userSpaceOnUse" cx={g[0]} cy={g[1]} r={75 * P.r(hz0)}>
                    <stop offset="0" stopColor={A.tone("#A0503A", hz0, 40)} stopOpacity={0.95 * flick(98)} />
                    <stop offset="0.6" stopColor={A.tone("#6A3226", hz0, 40)} stopOpacity={0.7} />
                    <stop offset="1" stopColor={A.tone("#2A1E17", hz0, 40)} stopOpacity={0} />
                  </radialGradient>
                </defs>
                <path d={d} fill={A.tone("#2A1E17", hz0, 40)} />
                <path d={d} fill="url(#mouth)" />
              </g>
            );
          })()}
          <defs>
            <radialGradient id="emb" gradientUnits="userSpaceOnUse" cx={ec[0]} cy={ec[1]} r={er}>
              <stop offset="0" stopColor={A.tone("#7A3A2B", hzm, 140)} stopOpacity={1} />
              <stop offset="0.6" stopColor={A.tone("#46281F", hzm, 140)} stopOpacity={1} />
              <stop offset="1" stopColor={A.tone("#2A221E", hzm, 140)} stopOpacity={1} />
            </radialGradient>
          </defs>
          <path d={`M${[P.p(hx0 + 14, hTop, hz0 + 14), P.p(hx1 - 14, hTop, hz0 + 14), P.p(hx1 - 14, hTop, hz1 - 14), P.p(hx0 + 14, hTop, hz1 - 14)].map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join("L")}Z`} fill="url(#emb)" />
          {coals}
          <defs>
            <radialGradient id="hglow" gradientUnits="userSpaceOnUse" cx={ec[0]} cy={ec[1] - 40 * P.r(hzm)} r={200 * P.r(hzm)}>
              <stop offset="0" stopColor={A.tone("#9A4A36", hzm, 200)} stopOpacity={0.3 * (0.85 + 0.15 * flick(99))} />
              <stop offset="0.6" stopColor={A.tone("#7A3A2A", hzm, 200)} stopOpacity={0.1} />
              <stop offset="1" stopColor={A.tone("#7A3A2A", hzm, 200)} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={ec[0]} cy={ec[1] - 40 * P.r(hzm)} rx={200 * P.r(hzm)} ry={150 * P.r(hzm)} fill="url(#hglow)" />
          {smoke}
        </g>
      ),
    });
    // the rack behind the anvil: two posts and a bar with pegs, every tool of the Iron Age kit hanging from it
    const tools = TOOLS_ON_RACK.map((t, i) => (
      <HangingTool key={i} A={A} kind={t.kind} X={RACK.X0 + 22 + t.dx} Y={(t.bar ? RACK.bar2 : RACK.bar) + 12} Z={RACK.Z - 14} rot={t.rot + 1.2 * Math.sin(f / 37 + i)} size={1.15} uid={`tl${i}`} />
    ));
    items.push({
      Z: RACK.Z,
      key: "rack",
      el: (
        <g key="rack">
          <AirShadow A={A} X={RACK.X0} Z={RACK.Z} w={40} d={30} uid="rks1" amt={0.6} />
          <AirShadow A={A} X={RACK.X1} Z={RACK.Z} w={40} d={30} uid="rks2" amt={0.6} />
          <AirBox A={A} X0={RACK.X0 - 14} X1={RACK.X0 + 6} Y0={RACK.top} Y1={0} Z0={RACK.Z - 10} Z1={RACK.Z + 10} mat={MAT.timber} uid="rkp1" />
          <AirBox A={A} X0={RACK.X1 - 6} X1={RACK.X1 + 14} Y0={RACK.top} Y1={0} Z0={RACK.Z - 10} Z1={RACK.Z + 10} mat={MAT.timber} uid="rkp2" />
          <AirBox A={A} X0={RACK.X0 - 26} X1={RACK.X1 + 26} Y0={RACK.bar - 16} Y1={RACK.bar} Z0={RACK.Z - 12} Z1={RACK.Z + 6} mat={MAT.timber} uid="rkbar" />
          <AirBox A={A} X0={RACK.X0 - 20} X1={RACK.X1 + 20} Y0={RACK.bar2 - 14} Y1={RACK.bar2} Z0={RACK.Z - 12} Z1={RACK.Z + 6} mat={MAT.timber} uid="rkbar2" />
          {tools}
        </g>
      ),
    });
  }

  // ---- the foreground: rubble heaps, baskets, tools lying, a quench tub by the anvil -------------------------------
  FORE.forEach((b, i) => {
    const k = `fg${i}`;
    if (b.kind === "heap") {
      items.push({
        Z: b.Z,
        key: k,
        el: (
          <g key={k}>
            <AirShadow A={A} X={b.X} Z={b.Z} w={150 * b.s} d={100 * b.s} uid={`${k}s`} amt={0.55} />
            <Chips A={A} eye={eye} chips={HEAPS[i % HEAPS.length].map((c) => ({ ...c, X: b.X + c.X * b.s, Z: b.Z + c.Z * b.s, r: c.r * b.s }))} mat={RUBBLE} uid={k} bands={[-9e9, 9e9]} />
          </g>
        ),
      });
    } else if (b.kind === "block") {
      items.push({
        Z: b.Z,
        key: k,
        el: (
          <g key={k}>
            <AirShadow A={A} X={b.X} Z={b.Z} w={110 * b.s} d={80 * b.s} uid={`${k}s`} amt={0.7} />
            <Prism A={A} eye={eye} X={b.X} Z={b.Z} w={150 * b.s} d={110 * b.s} Y0={-62 * b.s} ang={b.ang ?? 0} mat={ROCK} uid={k} />
          </g>
        ),
      });
    } else if (b.kind === "basket") {
      const { at, scale } = P.at(b.X, b.Z);
      items.push({
        Z: b.Z,
        key: k,
        el: (
          <g key={k}>
            <AirShadow A={A} X={b.X} Z={b.Z} w={40} d={26} uid={`${k}s`} amt={0.7} />
            <RomeFolk.Basket at={at} scale={scale * b.s} uid={k} full={0.35} fog={{ rgb: "#4E4438", amount: 0.5 }} unitPx={A.k} />
          </g>
        ),
      });
    } else if (b.kind === "tub") {
      items.push({
        Z: b.Z,
        key: k,
        el: (
          <g key={k}>
            <AirShadow A={A} X={b.X} Z={b.Z} w={60} d={44} uid={`${k}s`} amt={0.75} />
            <AirCyl A={A} X={b.X} Z={b.Z} R={46 * b.s} Y0={-62 * b.s} Y1={0} mat={MAT.timber} uid={k} joints={[-20 * b.s, -46 * b.s]} />
            {(() => {
              const c = P.p(b.X, -58 * b.s, b.Z);
              const rx = 40 * b.s * P.r(b.Z);
              const ry = Math.abs(P.p(b.X, -58 * b.s, b.Z - 40 * b.s)[1] - P.p(b.X, -58 * b.s, b.Z + 40 * b.s)[1]) / 2;
              return <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={A.tone("#3E5552", b.Z, 60)} />;
            })()}
          </g>
        ),
      });
    } else {
      const { at, scale } = P.at(b.X, b.Z);
      const T = b.kind === "pick" ? RomeFolk.Pick : RomeFolk.Hammer;
      items.push({ Z: b.Z, key: k, el: <T key={k} at={at} scale={scale * b.s} angle={b.ang ?? 0} uid={k} fog={A.folkFog(b.Z)} unitPx={A.k} /> });
    }
  });

  // painter's order: far to near (a stable tie-break by key)
  items.sort((a, b) => b.Z - a.Z || (a.key < b.key ? -1 : 1));
  const culled = items.filter((it) => it.Z > P.zNear + 120);

  const lowAir = mixHex(A.screenAir(cam.cy + 960 / cam.k), "#3F3226", 0.5);
  return (
    <AirStage v={A.v} bloom={0}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-12000} x1={12000} z0={-1600} z1={14000} mat={MAT.ground} jointAmt={0} />
        <AirHorizonHazeW A={A} id="haze" />
        {far}
        {PATCHES.map((pt, i) => {
          if (pt.Z - pt.r < P.zNear + 80) return null;
          // three nested rings at a third of the strength each: a soft edge, never a seam
          const ring = (sc: number) => {
            const q: P2[] = [];
            for (let j = 0; j < 20; j++) {
              const a = (j / 20) * Math.PI * 2;
              const rr = pt.r * sc * (0.8 + 0.25 * Math.sin(a * 3 + i));
              q.push(P.p(pt.X + rr * Math.cos(a), 0, pt.Z + rr * 0.7 * Math.sin(a)));
            }
            return `M${q.map((v) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`).join("L")}Z`;
          };
          const col = A.tone(pt.dust ? "#A39478" : "#5E5242", pt.Z, 0);
          const op = (pt.dust ? 0.3 : 0.22) / 3;
          return (
            <g key={`pa${i}`} fill={col} opacity={1}>
              <path d={ring(1)} opacity={op} />
              <path d={ring(0.78)} opacity={op} />
              <path d={ring(0.55)} opacity={op} />
            </g>
          );
        })}
        <Chips A={A} eye={eye} chips={YARD_CHIPS} mat={TUFA} uid="ych" />
        <Chips A={A} eye={eye} chips={NEAR_CHIPS} mat={RUBBLE} uid="nch" />
        <Chips A={A} eye={eye} chips={COAL_CHIPS} mat={COAL} uid="cch" />
        {culled.map((it) => it.el)}
      </WorldSvg>
      {/* the low air: the bottom of the frame sinks into the dense air (never a plain slab) */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 58%, ${lowAir}80 80%, ${lowAir}D0 100%)` }} />
    </AirStage>
  );
};

/** rubble heaps: a few mounds of chips (local units round the heap's centre) */
const HEAPS = [0, 1, 2].map((s) => makeChips(3000 + s * 200, 44, -90, 90, -60, 60, 6, 18, 1).map((c) => ({ ...c, h: c.h * (1.6 - Math.hypot(c.X / 90, c.Z / 60)) })));

export default PeopleButIron;
