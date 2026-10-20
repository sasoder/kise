// ---------------------------------------------------------------------------
// HugeLandscapes (kyle-first-farmers, file 43_HugeLandscapes). Dwarkesh map style (styles/dwarkesh-map.md), the
// umber page with no map, in cut D's pictorial-map world. Opaque 1080x1920, 29.97 fps, 334 frames.
//
// CHECK LINE: "A forager band needs a whole landscape to feed a handful of people, while the same square of
//   farmland feeds a crowd."
//
// THE LINE: "[And so the foragers] require huge landscapes to extract enough energy to feed themselves and grow
//   and reproduce, whereas farmers per unit of land can extract such higher rates of energy."
// WORD -> FRAME: require 15 · huge 27 · landscapes 43 · to 57 · extract 69 · enough 76 · energy 86 · to 94 ·
//   feed 109 · themselves 115 · and 123 · grow 135 · and 141 · reproduce 147 · whereas 162 · farmers 168 · per 185 ·
//   unit 196 · of 206 · land 213 · can 220 · extract 232 · such 244 · higher 260 · rates 272 · of 292 · energy 303.
// DURATION: the slot 43.9105 -> 55.0550 s = 11.1445 s x 29.97 = 334 frames (f0..f333).
//
// THE JOIN: f0 is cut D's f240 pixel for pixel: D's whole world (EnergyWorld, exported by AllAboutEnergy.tsx) runs
//   on at D frame 240 + f under D's own camera at f0 (allAboutEnergyState CAM_END). D's frame on f0 is the world
//   rectangle V0: D's world is drawn inside it, E's wild outside it, with D's own forest generator and pen (copied
//   verbatim in hugeLandscapesArt.tsx) so the seam is invisible; E's glades, deer and meadow lie wholly outside V0.
//   Proof: scratchpad E_landscapes/join_diff.png (14 px differ by 1/255, nothing else).
//
// THE MOTION (V2, cold-review pass): out of D's clearing straight to a cream forager band walking to its hut on a
//   meadow south of the river (found close, f30-42); on "huge" (f27) their range grows outward from the camp as a
//   closed dashed loop (f27-90), its cream territory fill arriving as it closes (f78-100). A drift and a push to the
//   camp: the woman tips her basket onto a tiny food heap (f110-128), a child steps out from behind its mother (f130-
//   174: five), the two hunters set off west across the range (from f122). On "whereas farmers" the camera brings
//   the farm back into frame (heap in at f168); on "unit" two identical dashed squares are drawn at once in mirror
//   motion (f186-206): one tight over the field, heap and longhouse, one inset inside the range; the world outside
//   them dims. The camera pushes in (f192-244) until the squares fill the upper frame side by side. "such higher
//   rates of energy": six farmers who came out of the longhouse with baskets of grain tip them onto a second heap
//   by the house, two together on "higher" (the heap jumps, f256-270), the rest up to "energy" (f306); more farmers
//   come round the heap into the yard (f144-200 out of the door, in the square by f260-300). The forest square holds
//   one grazing stag to the end. Living to the last frame.
// Orange = the incoming farmers' side (their people, rows, grain); cream = the foragers and the wild. No text.
// NOT DONE: the brief's "the heap grows again" (f244-303): D's heap reaches its full amount (heapAmount caps at 1)
//   at f~125 and covers the door and the carriers if it grows further; the square fills with people instead.
//
// SOURCES: none on screen (no figures, places or dates). Mesolithic hide hut and gear, Neolithic farm: the clip's
//   shared props (farmersFigures). The red deer (stag / hind) is added to farmersFigures (SHARED_CHANGES.md).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ContactShadow, DARK, INK, LAND, LAND_RIM, Page, WorldSvg, inkPath, mixColor, type Cam, type P2 } from "./firstFarmersShared";
import { CREAM, Deer, Farmer, ORANGE, Forager, GrainHeapFed, HideTent, POSES, TurnForager, farmAnchors, idle, lerpFig, mirrorPose, walkPose, type FigPose, type Ink } from "./farmersFigures";
import { EnergyWorld } from "./AllAboutEnergy";
import { DURATION as D_DURATION, END_FRAME, FPS as D_FPS, HEAP, PEOPLE, clearingOutline, heapAmount, heapH, heapHalfW, scrubIn, treesIn, type Tree } from "./allAboutEnergyState";
import { Basket, River, TreeArt } from "./hugeLandscapesArtV2";
import {
  ARRIVALS,
  BAND,
  BAND_STRIDE,
  CHILD,
  CROWD_STRIDE,
  DOOR,
  DOOR_H,
  DOOR_W,
  DOOR_X,
  DURATION as S_DURATION,
  FARM_SQ,
  FOOD,
  GLADES,
  HEAP2,
  POUR_F0,
  POUR_F1,
  POUR_LEN,
  SQ,
  SQ_F0,
  SQ_F1,
  STOP_F,
  TENT,
  TENT_BASE,
  V0,
  WILD_DEER,
  WILD_SQ,
  arrivalAt,
  arrivalEnd,
  c01,
  camE,
  deerAt,
  heap2Amount,
  inGlade,
  meadowOutline,
  memberX,
  memberY,
  rangeAt,
  rangeFill,
  sstep,
  toGo,
  treeFreeOfV0,
  trekDist,
  walkAmt,
  type Arrival,
  type Member,
} from "./hugeLandscapesStateV2";

export const FPS = D_FPS;
export const DURATION = S_DURATION;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// the join: E opens on D's last frame (same world, same camera, same clock)
if (D_DURATION - 1 !== END_FRAME || Math.abs(FPS - 30000 / 1001) > 1e-9 || PEOPLE !== 1) throw new Error("HugeLandscapes: cut D's constants changed");

const P = (v: P2) => `${v[0].toFixed(1)},${v[1].toFixed(1)}`;
const polyD = (pts: P2[]) => (pts.length < 2 ? "" : `M${pts.map(P).join("L")}`);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mix2 = (a: P2, b: P2, t: number): P2 => [mix(a[0], b[0], t), mix(a[1], b[1], t)];

// ---------------------------------------------------------------------------
// THE WILD beyond D's frame: D's forest generator and pen (identical near V0),
// glades and deer where nothing of D's frame can see them
// ---------------------------------------------------------------------------
const GLADE_GROUND = mixColor(LAND, LAND_RIM, 0.22);
const WildLayer: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const k = cam.k;
  const hw = 540 / k;
  const hh = 960 / k;
  const vx0 = cam.x - hw - 200;
  const vx1 = cam.x + hw + 200;
  const vy0 = cam.y - hh - 200;
  const vy1 = cam.y + hh + 700;
  const items: { y: number; el: React.ReactNode }[] = [];
  const keep = (t: Tree, s: number) => !(treeFreeOfV0(t.x, t.y, s) && inGlade(t.x, t.y));
  for (const t of treesIn(vx0 - 200, vy0, vx1 + 200, vy1)) if (keep(t, t.s * 1.25)) items.push({ y: t.y, el: <TreeArt key={`t${t.seed}`} t={t} k={k} /> });
  for (const t of scrubIn(vx0, vy0, vx1, vy1)) if (keep(t, t.s * 0.5)) items.push({ y: t.y, el: <TreeArt key={`s${t.seed}`} t={{ ...t, kind: 2 }} scale={0.5} squash={0.5} k={k} /> });
  WILD_DEER.forEach((d0, i) => {
    const ds = deerAt(d0, f);
    const d = { ...d0, at: ds.at };
    if (d.at[0] < vx0 - 300 || d.at[0] > vx1 + 300 || d.at[1] < vy0 || d.at[1] > vy1) return;
    const graze = (0.5 + 0.5 * Math.sin((END_FRAME + f) / 41 + d.seed * 2.1)) * (1 - ds.moving);
    items.push({
      y: d.at[1],
      el: (
        <g key={`d${i}`}>
          <ContactShadow x={d.at[0]} y={d.at[1]} halfW={118 * d.scale} />
          <Deer at={d.at} scale={d.scale} dir={d.dir} stag={d.stag} graze={graze} g={END_FRAME + f} seed={d.seed} uid={`wd${i}`} shadow={false} walk={ds.moving > 0 ? ds.dist / (2 * 30 * d.scale) : undefined} walkAmount={ds.moving} />
        </g>
      ),
    });
  });
  items.sort((a, b) => a.y - b.y);
  return (
    <WorldSvg cam={cam}>
      {GLADES.map((g, i) => (
        <ellipse key={i} cx={g.cx} cy={g.cy} rx={g.rx * 0.92} ry={g.ry * 0.8} fill={GLADE_GROUND} fillOpacity={0.5} />
      ))}
      <path d={inkPath(meadowOutline(), true)} fill={GLADE_GROUND} fillOpacity={0.55} />
      <River x0={vx0} x1={vx1} k={k} />
      {items.map((it) => it.el)}
    </WorldSvg>
  );
};

// ---------------------------------------------------------------------------
// THE BAND
// ---------------------------------------------------------------------------
const SPEAR_WALK_L = POSES.spearTrail(-1);
const SPEAR_L = POSES.spear(-1);
/** W: the basket on the near hip (facing right before the mirror: L = the near arm); pouring: leaning in, both hands forward */
const BASKET_R: FigPose = { ...POSES.stand(1), armL: { w: [42, -152], elbow: [-0.4, 1], fist: 0.9, hand: 0 }, armR: { w: [14, -150], elbow: [-0.5, 1], fist: 0.3, hand: 0 } };
const POUR_R: FigPose = { ...POSES.stand(1), lean: 30, crouch: 30, pitch: 18, armL: { w: [104, -150], elbow: [-0.3, 1], fist: 0.9, hand: 0 }, armR: { w: [92, -164], elbow: [-0.3, 1], fist: 0.9, hand: 0 } };
const BASKET_L = mirrorPose(BASKET_R);
const POUR_L = mirrorPose(POUR_R);
const EMPTY_R: FigPose = { ...BASKET_R, armL: { w: [30, -140], elbow: [-0.5, 1], fist: 0.8, hand: 0 } };
const EMPTY_L = mirrorPose(EMPTY_R);
const STAND_L = POSES.stand(-1);
const STOOP_L: FigPose = mirrorPose({ ...POSES.stand(1), lean: 34, crouch: 60, pitch: 16 });

const PHASE0: Record<Member["id"], number> = { A: 0, B: 0.5, W: 0.27, M: 0.71 };
const memberPose = (m: Member, f: number): { pose: FigPose; at: P2 } => {
  const x = memberX(m, f);
  const at: P2 = [x, memberY(m)];
  const ph = (toGo(0) - toGo(f)) / (2 * BAND_STRIDE * PEOPLE) + PHASE0[m.id];
  const amt = walkAmt(f);
  const g = END_FRAME + f + m.seed * 29;
  const walkOn = (base: FigPose, legsOnly: boolean) => {
    const w = walkPose(base, ph, amt, BAND_STRIDE);
    return legsOnly ? { ...w, armL: base.armL, armR: base.armR } : w;
  };
  if (m.id === "A" || m.id === "B") {
    if (amt > 0) return { pose: walkOn(SPEAR_WALK_L, true), at };
    // they stop at the camp, then set off again west across the range (still facing west: no turn)
    const d = trekDist(m, f);
    if (d <= 0) {
      const r = sstep((f - STOP_F) / 12);
      return { pose: idle(lerpFig(SPEAR_WALK_L, SPEAR_L, r * 0.6), g, m.seed), at };
    }
    const back = lerpFig(SPEAR_WALK_L, SPEAR_L, 0.6);
    const tw = Math.min(1, d / 30);
    const base = lerpFig(back, SPEAR_WALK_L, tw);
    const w = walkPose(base, (toGo(0) + d) / (2 * BAND_STRIDE * PEOPLE) + PHASE0[m.id], tw, BAND_STRIDE);
    return { pose: { ...w, armL: base.armL, armR: base.armR }, at };
  }
  if (m.id === "W") {
    if (f < POUR_F0 - 6) return { pose: amt > 0 ? walkOn(BASKET_L, true) : idle(BASKET_L, g, m.seed), at };
    if (f < POUR_F1) {
      const u = sstep((f - (POUR_F0 - 6)) / 10);
      return { pose: lerpFig(BASKET_L, POUR_L, u), at };
    }
    const r = sstep((f - POUR_F1) / 12);
    return { pose: idle(lerpFig(POUR_L, EMPTY_L, r), g, m.seed), at };
  }
  // M: walks, then stands at the hut's door; she looks down at the child stepping out in front of her
  const look = sstep((f - CHILD.walk0 - 4) / 12);
  const q = amt > 0 ? walkOn(STAND_L, false) : idle(STAND_L, g, m.seed);
  return { pose: { ...q, pitch: q.pitch + 16 * look }, at };
};
/** the near (R when facing left) hand of a member, world */
const nearHand = (m: Member, pose: FigPose, at: P2) => farmAnchors("forager", pose, at, PEOPLE, m.woman).nearHand as P2;

const Band: React.FC<{ f: number }> = ({ f }) => {
  const st = BAND.map((m) => ({ m, ...memberPose(m, f) }));
  const get = (id: Member["id"]) => st.find((o) => o.m.id === id)!;
  const A = get("A");
  const B = get("B");
  const W = get("W");
  const M = get("M");
  // W's basket on her near hand: carried, tipped over the food heap, empty
  const wh = nearHand(W.m, W.pose, W.at);
  const tip = sstep((f - POUR_F0) / 8) * (1 - sstep((f - POUR_F1) / 10));
  const basketAt: P2 = [wh[0] - 6, wh[1] + 2];
  const basketAngle = -112 * tip;
  const poured = c01((f - POUR_F0 - 3) / (POUR_F1 - POUR_F0 - 6));
  const mouthOf = (fl: number): P2 => {
    const q = memberPose(W.m, Math.round(fl));
    const h = nearHand(W.m, q.pose, q.at);
    const t = sstep((fl - POUR_F0) / 8);
    const a = (-112 * t * Math.PI) / 180;
    return [h[0] - 6 - 40 * Math.cos(a), h[1] + 2 - 40 * Math.sin(a)];
  };
  const foodAmount = (fr: number) => sstep(c01((fr - POUR_F0 - 3) / (POUR_F1 - POUR_F0 - 6)));
  // the child: out of the hut behind M, then out from behind her
  const ce = c01((f - CHILD.emerge0) / (CHILD.emerge1 - CHILD.emerge0));
  const cw = c01((f - CHILD.walk0) / (CHILD.walk1 - CHILD.walk0));
  const childY = mix(TENT_BASE - 34, memberY(M.m) - 14, sstep(ce));
  const cdx = CHILD.dx * sstep(cw);
  const childX = DOOR_X - 8 + cdx;
  const cmov = cw > 0 && cw < 1 ? Math.min(1, 4 * Math.sin(Math.PI * cw)) : 0;
  const childPoseNow = f < CHILD.walk0 ? lerpFig(STOOP_L, STAND_L, sstep(ce)) : idle(walkPose(STAND_L, Math.abs(cdx) / (2 * 44 * 0.69), cmov), END_FRAME + f, 7);
  const inside = childY < TENT_BASE;
  const doorW = (100 + 30 * 0.5) * TENT.scale;
  const doorH = 160 * TENT.scale;
  const items: { y: number; el: React.ReactNode }[] = [];
  items.push({ y: TENT_BASE, el: <HideTent key="tent" at={[TENT.x, TENT_BASE]} scale={TENT.scale} uid="etent" seed={3} /> });
  items.push({
    y: FOOD.at[1],
    el: <GrainHeapFed key="food" at={FOOD.at} scale={FOOD.scale} frame={f} amountAt={foodAmount} width={FOOD.width} height={FOOD.height} source={(fl) => mouthOf(fl)} flight={9} arc={18} seed={5} ink={CREAM as Ink} />,
  });
  if (f >= CHILD.emerge0)
    items.push({
      y: childY,
      el: (
        <g key="child">
          {inside ? (
            <clipPath id="e-door">
              <path d={`M${DOOR_X - doorW / 2},${TENT_BASE + 40}L${DOOR_X - doorW / 2},${TENT_BASE}Q${DOOR_X - doorW / 2 - 4},${TENT_BASE - doorH} ${DOOR_X},${TENT_BASE - doorH}Q${DOOR_X + doorW / 2 + 4},${TENT_BASE - doorH} ${DOOR_X + doorW / 2},${TENT_BASE}L${DOOR_X + doorW / 2},${TENT_BASE + 40}Z`} />
            </clipPath>
          ) : null}
          <g clipPath={inside ? "url(#e-door)" : undefined}>
            <Forager pose={childPoseNow} at={[childX, childY]} scale={PEOPLE} uid="echild" child seed={7} />
          </g>
        </g>
      ),
    });
  items.push({ y: B.at[1], el: <TurnForager key="B" pose={B.pose} at={B.at} scale={PEOPLE} uid="eB" hold="spear" holdSide="R" frontArms={["R"]} seed={2} /> });
  items.push({ y: A.at[1], el: <TurnForager key="A" pose={A.pose} at={A.at} scale={PEOPLE} uid="eA" hold="spear" holdSide="R" frontArms={["R"]} seed={1} /> });
  items.push({
    y: W.at[1],
    el: (
      <g key="W">
        <Forager pose={W.pose} at={W.at} scale={PEOPLE} uid="eW" woman seed={3} />
        <Basket at={basketAt} scale={PEOPLE} angle={basketAngle} full={1 - poured} />
      </g>
    ),
  });
  items.push({ y: M.at[1] + 1, el: <Forager key="M" pose={M.pose} at={M.at} scale={PEOPLE} uid="eM" woman seed={4} /> });
  items.sort((a, b) => a.y - b.y);
  return <>{items.map((it) => it.el)}</>;
};

// ---------------------------------------------------------------------------
// THE FARM's new people (orange): out of the longhouse door into the yard.
// While in the doorway they show only through it; behind the heap's base line
// the heap's dome covers them (D draws the heap; E masks its people by its outline).
// ---------------------------------------------------------------------------
const CROWD_STAND_R = POSES.stand(1);
const CROWD_STAND_L = POSES.stand(-1);
/** the grain carriers: the basket on the near hip; tipping it out over HEAP2 (they face left, the heap in front) */
const GRAIN = ORANGE.main;
type CrowdState = { pose: FigPose; at: P2; basket: { at: P2; angle: number; full: number; dir: 1 | -1 } | null; s: NonNullable<ReturnType<typeof arrivalAt>> };
const crowdState = (ar: Arrival, f: number): CrowdState | null => {
  const s = arrivalAt(ar, f);
  if (!s) return null;
  const fd = END_FRAME + f;
  const stride = CROWD_STRIDE * (ar.child ? 0.69 : 1);
  const carry = !!ar.pour;
  const facing = s.dir === 1 ? (carry ? BASKET_R : CROWD_STAND_R) : carry ? BASKET_L : CROWD_STAND_L;
  const stoop = (1 - s.out) * 0.8;
  let q: FigPose;
  if (s.moving > 0) {
    const w = walkPose(facing, s.dist / (2 * stride), s.moving, stride);
    q = carry ? { ...w, armL: facing.armL, armR: facing.armR } : w;
  } else if (carry && ar.pour) {
    const t0 = ar.pour.f0;
    const [B0, P0, E0] = s.dir === 1 ? [BASKET_R, POUR_R, EMPTY_R] : [BASKET_L, POUR_L, EMPTY_L];
    if (f < t0 - 6) q = idle(B0, fd + ar.seed * 13, ar.seed);
    else if (f < t0 + POUR_LEN) q = lerpFig(B0, P0, sstep((f - (t0 - 6)) / 10));
    else q = idle(lerpFig(P0, E0, sstep((f - t0 - POUR_LEN) / 12)), fd + ar.seed * 13, ar.seed);
  } else q = idle(facing, fd + ar.seed * 13, ar.seed);
  if (stoop > 0) q = { ...q, lean: q.lean + 26 * stoop * s.dir, crouch: q.crouch + 40 * stoop };
  let basket: CrowdState["basket"] = null;
  if (carry && ar.pour) {
    const h = farmAnchors("farmer", q, s.at, PEOPLE, ar.woman).nearHand as P2;
    const t0 = ar.pour.f0;
    const tip = s.moving > 0 ? 0 : sstep((f - t0) / 8) * (1 - sstep((f - t0 - POUR_LEN) / 10));
    const poured = c01((f - t0 - 4) / (POUR_LEN - 4));
    basket = { at: [h[0] + 6 * s.dir, h[1] + 2], angle: 112 * tip * s.dir, full: 1 - poured, dir: s.dir };
  }
  return { pose: q, at: s.at, basket, s };
};
/** where HEAP2's grain leaves: the lip of the basket being tipped at frame fl */
const heap2Source = (fl: number): P2 | null => {
  for (const ar of ARRIVALS) {
    if (!ar.pour || fl < ar.pour.f0 || fl > ar.pour.f0 + POUR_LEN) continue;
    const c = crowdState(ar, Math.round(fl));
    if (!c || !c.basket) continue;
    const a = (c.basket.angle * Math.PI) / 180;
    const lx = 40 * c.basket.dir;
    return [c.basket.at[0] + lx * Math.cos(a), c.basket.at[1] + lx * Math.sin(a)];
  }
  return null;
};
if (ARRIVALS.some((a) => a.pour && arrivalEnd(a) > a.pour.f0 - 8)) throw new Error("HugeLandscapesV2: a grain carrier arrives after his pour");
const Crowd: React.FC<{ f: number }> = ({ f }) => {
  const fd = END_FRAME + f;
  const a = heapAmount(fd);
  const hw = heapHalfW(a);
  const hh = heapH(a);
  const [hx, hy] = HEAP.at;
  const dome = Array.from({ length: 41 }, (_, i) => {
    const u = -1 + (2 * i) / 40;
    return [hx + u * (hw + 6), hy - (hh + 5) * (1 - u * u)] as P2;
  });
  const domeD = `M${dome.map(P).join("L")}L${hx + hw + 6},${hy + 3}L${hx - hw - 6},${hy + 3}Z`;
  const behindMask = `M-20000,-20000H20000V20000H-20000Z${domeD}`;
  // HEAP2's dome (it grows: whoever is behind its base line is covered by it)
  const a2 = heap2Amount(f);
  const h2w = (HEAP2.width / 2) * HEAP2.scale * Math.sqrt(a2);
  const h2h = HEAP2.height * HEAP2.scale * Math.sqrt(a2);
  const dome2 = Array.from({ length: 41 }, (_, i) => {
    const u = -1 + (2 * i) / 40;
    return [HEAP2.at[0] + u * (h2w + 6), HEAP2.at[1] - (h2h + 5) * (1 - u * u)] as P2;
  });
  const behind2Mask = `M-20000,-20000H20000V20000H-20000ZM${dome2.map(P).join("L")}Z`;
  const doorD = `M${DOOR[0] - DOOR_W / 2},${DOOR[1] - DOOR_H}H${DOOR[0] + DOOR_W / 2}V${DOOR[1] + 60}H${DOOR[0] - DOOR_W / 2}Z`;
  const items: { y: number; el: React.ReactNode }[] = [];
  items.push({
    y: HEAP2.at[1],
    el: <GrainHeapFed key="heap2" at={HEAP2.at} scale={HEAP2.scale} frame={f} amountAt={heap2Amount} width={HEAP2.width} height={HEAP2.height} source={(fl) => heap2Source(fl)} flight={10} arc={22} seed={9} />,
  });
  ARRIVALS.forEach((ar, i) => {
    const c = crowdState(ar, f);
    if (!c) return;
    const s = c.s;
    const behind = s.at[1] < hy + 1;
    const behind2 = a2 > 0.002 && s.at[1] < HEAP2.at[1] + 1;
    const el = (
      <>
        <Farmer pose={c.pose} at={s.at} scale={PEOPLE} uid={`ec${i}`} woman={ar.woman} child={ar.child} hold="none" seed={ar.seed} />
        {c.basket ? <Basket at={c.basket.at} scale={PEOPLE} angle={c.basket.angle} full={c.basket.full} load={GRAIN} /> : null}
      </>
    );
    items.push({
      y: s.at[1],
      el: (
        <g key={`c${i}`}>
          {s.inside ? (
            <clipPath id={`e-dr${i}`}>
              <path d={doorD} />
            </clipPath>
          ) : null}
          {behind ? (
            <clipPath id={`e-hp${i}`}>
              <path d={behindMask} clipRule="evenodd" />
            </clipPath>
          ) : null}
          {behind2 ? (
            <clipPath id={`e-h2${i}`}>
              <path d={behind2Mask} clipRule="evenodd" />
            </clipPath>
          ) : null}
          <g clipPath={behind2 ? `url(#e-h2${i})` : undefined}>
            <g clipPath={behind ? `url(#e-hp${i})` : undefined}>
              <g clipPath={s.inside ? `url(#e-dr${i})` : undefined}>{el}</g>
            </g>
          </g>
        </g>
      ),
    });
  });
  items.sort((p, q) => p.y - q.y);
  return <>{items.map((it) => it.el)}</>;
};

// ---------------------------------------------------------------------------
// THE TRAIL and THE SQUARES (cream dashes on a dark casing, line weights in screen px)
// ---------------------------------------------------------------------------
const Dashed: React.FC<{ d: string; k: number; w: number; dash: number; gap: number; op?: number }> = ({ d, k, w, dash, gap, op = 1 }) =>
  d ? (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={DARK} strokeWidth={(w + 3.2) / k} strokeOpacity={0.7 * op} strokeDasharray={`${dash} ${gap}`} />
      <path d={d} stroke={INK} strokeWidth={w / k} strokeOpacity={0.92 * op} strokeDasharray={`${dash} ${gap}`} />
    </g>
  ) : null;
/** the forest veil's mask: everything but D's clearing, its edge feathered over ~2 trees */
const CLEARING_MASK = (
  <>
    <filter id="e-feather" x={-2400} y={-2400} width={6000} height={4800} filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation={140} />
    </filter>
    <mask id="e-clearing" maskUnits="userSpaceOnUse" x={-20000} y={-20000} width={50000} height={50000}>
      <rect x={-20000} y={-20000} width={50000} height={50000} fill="#fff" />
      <path d={inkPath(clearingOutline(120), true)} fill="#000" filter="url(#e-feather)" />
    </mask>
  </>
);
const sqD = (o: P2) => `M${o[0]},${o[1]}h${SQ}v${SQ}h${-SQ}Z`;
const squarePrefix = (x0: number, y0: number, u: number, ccwFromRight = false): P2[] => {
  const c: P2[] = ccwFromRight
    ? [[x0 + SQ, y0], [x0, y0], [x0, y0 + SQ], [x0 + SQ, y0 + SQ], [x0 + SQ, y0]]
    : [[x0, y0], [x0 + SQ, y0], [x0 + SQ, y0 + SQ], [x0, y0 + SQ], [x0, y0]];
  const s = u * 4;
  const out: P2[] = [c[0]];
  for (let i = 0; i < 4; i++) {
    if (s >= i + 1) out.push(c[i + 1]);
    else {
      if (s > i) out.push(mix2(c[i], c[i + 1], s - i));
      break;
    }
  }
  return out;
};

const HugeLandscapesV2: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camE(f);
  const k = cam.k;
  // D's frame on screen, snapped to whole pixels: D's world is drawn inside it, E's wild outside it
  const L = Math.round((V0.x0 - cam.x) * k + 540);
  const R = Math.round((V0.x1 - cam.x) * k + 540);
  const T = Math.round((V0.y0 - cam.y) * k + 960);
  const B = Math.round((V0.y1 - cam.y) * k + 960);
  const covers = L <= 0 && T <= 0 && R >= 1080 && B >= 1920;
  const cl = Math.max(-2, L);
  const ct = Math.max(-2, T);
  const cr = Math.min(1082, R);
  const cb = Math.min(1922, B);
  const sqU = sstep((f - SQ_F0) / (SQ_F1 - SQ_F0));
  // the context recedes as the squares are laid down (the squares themselves stay at full strength)
  const veil = 0.46 * sstep((f - SQ_F1 + 8) / 34);
  // the forest outside D's clearing recedes to the context level from f0 (0 on f0: the join stays exact), and hands
  // over to the squares' dim as that comes in (the wild square brightens, the clearing outside the farm square dims)
  const forestVeil = 0.46 * sstep(f / 22) * (1 - sstep((f - SQ_F1 + 8) / 34));
  const wash = 0.13 * rangeFill(f);
  const range = rangeAt(f);
  return (
    <AbsoluteFill>
      <Page>
        {covers ? null : (
          <AbsoluteFill style={{ clipPath: `polygon(evenodd, -4px -4px, 1084px -4px, 1084px 1924px, -4px 1924px, -4px -4px, ${cl}px ${ct}px, ${cr}px ${ct}px, ${cr}px ${cb}px, ${cl}px ${cb}px, ${cl}px ${ct}px)` }}>
            <WildLayer f={f} cam={cam} />
          </AbsoluteFill>
        )}
        <AbsoluteFill style={covers ? undefined : { clipPath: `polygon(${cl}px ${ct}px, ${cr}px ${ct}px, ${cr}px ${cb}px, ${cl}px ${cb}px)` }}>
          <EnergyWorld frame={END_FRAME + f} cam={cam} />
        </AbsoluteFill>
        <WorldSvg cam={cam} defs={CLEARING_MASK}>
          {forestVeil > 0.002 ? <rect x={-20000} y={-20000} width={50000} height={50000} fill={LAND} fillOpacity={forestVeil} mask="url(#e-clearing)" /> : null}
          {veil > 0.002 ? <path d={`M-20000,-20000H30000V30000H-20000Z${sqD(FARM_SQ)}${sqD(WILD_SQ)}`} fill={LAND} fillOpacity={veil} fillRule="evenodd" /> : null}
          {range.length && wash > 0.002 ? <path d={inkPath(range, true)} fill={INK} fillOpacity={wash} /> : null}
          <Crowd f={f} />
          {range.length ? <Dashed d={`${polyD(range)}Z`} k={k} w={4.6} dash={210} gap={90} /> : null}
          <Band f={f} />
          {sqU > 0 ? (
            <>
              <Dashed d={polyD(squarePrefix(FARM_SQ[0], FARM_SQ[1], sqU, true))} k={k} w={6.4} dash={95} gap={62} />
              <Dashed d={polyD(squarePrefix(WILD_SQ[0], WILD_SQ[1], sqU))} k={k} w={6.4} dash={95} gap={62} />
            </>
          ) : null}
        </WorldSvg>
      </Page>
    </AbsoluteFill>
  );
};

export default HugeLandscapesV2;
