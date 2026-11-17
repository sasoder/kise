// ===================================================================================================================
// paulWorldSets — THE SETS of the paul-twelve-hours world (paulWorld.tsx is the medium). Every set is built once in
// spec.build and returns { group, update(props), ...helpers }; call update(props) from the per-frame function with
// every animated value computed from the frame (frames come in any order). Props left out keep their last value.
// Units: metres, y up, floor y 0. Orange = the labs' secrets only. Dashed = not real.
//
//   CARDS     secretCard(w, size?, parent?)                      one orange card (CARD = [0.46, 0.04, 0.33])
//             makeCardStream(w, { path, n, size?, flat? })       update({ ts: number[] | (i) => t, tumble? })
//   S1        makeVault(w, { x, z?, brand, maxCards?, hinge? })  update({ wheel, bolts, open, cardsLeft, ghost, glow })
//                 .sill / .sillNormal / .stackTop() / .rampPath  where the cards leave the round door (rev 1)
//   S2 / S3   makeMonorepo(w, { x?, z? })                        update({ gapAt, gapOpen, rewrite[], lift })
//             makeContributors(w, tower, { n, seed?, rMin?, rMax?, front? })   update({ lit, beads })
//             makeOutsiderDoor(w, tower, { x? })                 update({ glow, open, keyIn, keyTurn })
//             makeThread(w, pts, { r?, color?, lit? })           update({ draw, lit, beads })
//             makeLens(w, { r? })                                update({ pos, rot, read, row })
//             makeHacktronPanel(w, tower, { gapAt? })            update({ insert, glint })
//   S4        makeDial(w, { pos, yaw?, R? })                     update({ sweep })
//             makeSlackStack(w, { x?, z?, n?, mark? })           update({ open: number[] | (i) => open })  mark "colour" | "black"
//   LABELS    makeNamePlate(w, { text | image, at, ... })        update({ show, yaw, text })
//   S5-S7     makeRuler(w, { months? })                          RULER geometry, monthZ(m)
//             makeFlagToken(w, { kind, lane, flyLeft? })         update({ month, y, yaw, wave, show })
//             makeOrangeStack(w, { lane, max? })                 update({ month, cards, open, y0 }) .topY()
//             makeGhostRing(w, { lane })                         update({ month, show })
//             makeGapBracket(w, { x?, y?, plateX?, stem?, plateW? }) update({ from, to, dashed, label, show, draw })
//             makeDashedCase(w, { center, size })                update({ draw })
// ===================================================================================================================
import { ANTHROPIC, OPENAI } from "../kits/dwarkesh/brandGlyphs";
import { C, D2R, FONT, THREE, TRUE, clamp01, hash01, lobe, mix, mix3, type Any, type CamDef, type Tex, type V3, type World } from "./paulWorld";

// ===================================================================================================================
// CARDS
// ===================================================================================================================
export const CARD: V3 = [0.46, 0.04, 0.33];
export const secretCard = (w: World, size: V3 = CARD, parent?: Any, glow = 0.5) => w.K.box(size, w.K.orange(glow), [0, 0, 0], { r: 0.012, seg: 3, parent });

/** n cards along a path; each card's t (0..1 along the path; outside = hidden) set per frame. Cards lie along the
 *  path's slope (flat = lie level), with a small per-card yaw jitter; tumble (deg) adds a per-card spin in the air. */
export const makeCardStream = (w: World, o: { path: V3[]; n: number; size?: V3; flat?: boolean; seed?: number; shadows?: boolean }) => {
  const { K, scene } = w;
  const curve = new THREE.CatmullRomCurve3(o.path.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const seed = o.seed ?? 1;
  const cards = Array.from({ length: o.n }, (_, i) => {
    const g = K.group(scene);
    secretCard(w, o.size ?? CARD, g);
    const blob = o.shadows === false ? null : K.blob(0, 0, (o.size ?? CARD)[0] * 1.4, (o.size ?? CARD)[2] * 1.5, 0.3);
    return { g, blob, jit: (hash01(i * 3.1 + seed) - 0.5) * 30, roll: (hash01(i * 5.7 + seed) - 0.5) * 10 };
  });
  const st = { ts: Array.from({ length: o.n }, () => -1) as number[], tumble: 0 };
  const update = (p: { ts?: number[] | ((i: number) => number); tumble?: number }) => {
    if (p.ts) st.ts = cards.map((_, i) => (typeof p.ts === "function" ? (p.ts as (i: number) => number)(i) : (p.ts as number[])[i] ?? -1));
    if (p.tumble !== undefined) st.tumble = p.tumble;
    cards.forEach((c, i) => {
      const t = st.ts[i];
      const on = t >= 0 && t <= 1;
      c.g.visible = on;
      if (c.blob) c.blob.visible = on;
      if (!on) return;
      const pt = curve.getPointAt(t);
      const tg = curve.getTangentAt(t);
      const yaw = Math.atan2(tg.x, tg.z);
      const slope = o.flat ? 0 : Math.atan2(-tg.y, Math.hypot(tg.x, tg.z));
      c.g.position.copy(pt);
      c.g.position.y += (o.size ?? CARD)[1] / 2 + 0.005;
      c.g.rotation.set(0, 0, 0);
      c.g.rotateY(yaw + c.jit * D2R);
      c.g.rotateX(slope);
      c.g.rotateZ((c.roll + st.tumble * (hash01(i + 0.3) - 0.5) * 2) * D2R);
      if (st.tumble) c.g.rotateX(st.tumble * (hash01(i + 0.7) - 0.5) * D2R);
      if (c.blob) {
        c.blob.position.set(pt.x + 0.04, 0.004, pt.z + 0.03);
        c.blob.material.opacity = 0.3 * clamp01(1 - pt.y / 0.6);
      }
    });
  };
  return { curve, cards, update };
};

// ===================================================================================================================
// S1: THE LAB VAULTS (rev 1: real bank vaults)
// ===================================================================================================================
/** a bank vault in the world's clay: a heavy rounded steel-clay body (warm grey) on a plinth, bored through by a round
 *  chamber; on its front a raised collar ring with a ring of rivets, and the big ROUND door (stepped rim, recessed
 *  field) with a 4-spoke wheel handle at its centre, 8 radial locking bolts that stick out of its edge over the collar
 *  and slide in when unlocking, hinged on a chunky barrel at one side (left for a vault at x < 0, right otherwise, so
 *  the doors open away from the middle). The lab's mark (black, true colour) on the body above the door. Inside, a
 *  shelf running to the doorway carries a neat stack of glowing orange cards; the chamber lining warms when open, and
 *  a soft orange spill falls on the floor in front of the open door.
 *  update({ wheel (rad), bolts 0..1 (retracted), open 0..1 (door swing to OPEN_DEG), cardsLeft, ghost 0..1, glow 0..1 })
 *  (hatchOpen is still read, as `open`, for rev-0 cuts). Anchors: sill / sillNormal (where cards leave: the shelf's
 *  front edge in the doorway, world), stackTop() (the top card, world), doorCentre, top (the full stack's top y). */
export const VAULT = {
  W: 1.5,
  H: 2.0,
  D: 1.3,
  /** rev 0 (the hatch); unused */
  HINGE_Y: 0.2,
  CARD: [0.44, 0.04, 0.34] as V3,
  PITCH: 0.044,
  X_OPENAI: -0.92,
  X_ANTHROPIC: 0.92,
  /** the door's centre height, the chamber's bore radius, the door's radius, the collar's outer radius */
  DOOR_Y: 0.88,
  BORE: 0.44,
  DOOR_R: 0.53,
  COLLAR_R: 0.68,
  /** the shelf's top (the stack's floor) and the door's full swing (deg) */
  SHELF_TOP: 0.56,
  OPEN_DEG: 100,
};
export const makeVault = (w: World, o: { x: number; z?: number; brand: "openai" | "anthropic"; maxCards?: number; hinge?: "left" | "right" }) => {
  const { K, T, scene } = w;
  const { W: VW, H: VH, D: VD, DOOR_Y: DY, BORE: RB, DOOR_R: RD, COLLAR_R: RC, SHELF_TOP } = VAULT;
  const z0 = o.z ?? 0;
  const max = o.maxCards ?? 10;
  const side = o.hinge ? (o.hinge === "left" ? -1 : 1) : o.x < 0 ? -1 : 1;
  const g = K.group(scene, [o.x, 0, z0]);
  const F = VD / 2;
  // the body's clay: warm grey, its mottle at the boxes' scale (the extrusion's UVs run in metres)
  const fine = T.mottle.clone();
  fine.repeat.set(1.6, 1.6);
  fine.needsUpdate = true;
  const steel = new THREE.MeshStandardMaterial({ color: new THREE.Color("#D4CFC7"), roughness: 0.88, metalness: 0, map: fine });
  const bright = K.clay(C.clay);
  const warm = K.clay(C.clayWarm);
  const stone = K.clay(C.stone);
  const P = { parent: g };
  // the plinth
  K.box([VW + 0.1, 0.2, VD + 0.1], warm, [0, 0.1, 0], { r: 0.06, ...P });
  // the body: a rounded slab extruded front to back, bored through by the round chamber
  const bev = 0.075;
  const x0 = -VW / 2 + bev;
  const x1 = VW / 2 - bev;
  const y0 = 0.2 + bev;
  const y1 = VH - bev;
  const cr = 0.12;
  const shape = new THREE.Shape();
  shape.moveTo(x0 + cr, y0);
  shape.lineTo(x1 - cr, y0);
  shape.absarc(x1 - cr, y0 + cr, cr, -Math.PI / 2, 0, false);
  shape.lineTo(x1, y1 - cr);
  shape.absarc(x1 - cr, y1 - cr, cr, 0, Math.PI / 2, false);
  shape.lineTo(x0 + cr, y1);
  shape.absarc(x0 + cr, y1 - cr, cr, Math.PI / 2, Math.PI, false);
  shape.lineTo(x0, y0 + cr);
  shape.absarc(x0 + cr, y0 + cr, cr, Math.PI, 1.5 * Math.PI, false);
  const hole = new THREE.Path();
  hole.absarc(0, DY, RB + bev, 0, 2 * Math.PI, true);
  shape.holes.push(hole);
  const bodyGeo = new THREE.ExtrudeGeometry(shape, { depth: VD - 2 * bev, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 6, curveSegments: 72 });
  const body = new THREE.Mesh(bodyGeo, steel);
  body.position.z = -VD / 2 + bev;
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);
  // the chamber: a lining (warm clay that glows a little when open), a back disc, the shelf running to the doorway
  const zBack = -VD / 2 + 0.12;
  const liningMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.clayWarm), roughness: 0.9, side: THREE.BackSide, emissive: new THREE.Color("#FF9A00"), emissiveIntensity: 0, map: T.mottle });
  const lining = new THREE.Mesh(new THREE.CylinderGeometry(RB - 0.003, RB - 0.003, F - zBack, 72, 1, true), liningMat);
  lining.rotation.x = Math.PI / 2;
  lining.position.set(0, DY, (F + zBack) / 2);
  lining.receiveShadow = true;
  g.add(lining);
  const backMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.clayWarm), roughness: 0.9, emissive: new THREE.Color("#FF9A00"), emissiveIntensity: 0, map: T.mottle });
  const back = new THREE.Mesh(new THREE.CircleGeometry(RB, 72), backMat);
  back.position.set(0, DY, zBack);
  back.receiveShadow = true;
  g.add(back);
  const shelfLen = F - 0.03 - zBack;
  K.box([0.54, 0.05, shelfLen], bright, [0, SHELF_TOP - 0.025, zBack + shelfLen / 2], { r: 0.018, ...P });
  K.box([0.24, SHELF_TOP - 0.05 - (DY - RB) + 0.04, shelfLen - 0.1], warm, [0, (SHELF_TOP - 0.05 + DY - RB - 0.04) / 2, zBack + shelfLen / 2], { r: 0.02, ...P });
  // the collar: a raised ring round the bore, rounded outer edge (lathe about z)
  const lathe = (pts: [number, number][], seg = 96) => {
    const geo = new THREE.LatheGeometry(
      pts.map(([r, h]) => new THREE.Vector2(r, h)),
      seg,
    );
    geo.rotateX(Math.PI / 2);
    return geo;
  };
  const collarMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.clayAlt), roughness: 0.88, metalness: 0, map: fine });
  const collar = new THREE.Mesh(
    lathe([
      [RC, -0.03],
      [RC, 0.028],
      [RC - 0.012, 0.055],
      [RC - 0.04, 0.066],
      [RB + 0.035, 0.066],
      [RB + 0.008, 0.052],
      [RB, 0.03],
      [RB, -0.03],
    ]),
    collarMat,
  );
  collar.position.set(0, DY, F);
  collar.castShadow = true;
  collar.receiveShadow = true;
  g.add(collar);
  // the ring of rivets on the collar (between the bolts' angles)
  for (let i = 0; i < 24; i++) {
    const a = (i * 15 * Math.PI) / 180;
    const rv = K.sphere(0.019, stone, [Math.cos(a) * 0.607, DY + Math.sin(a) * 0.607, F + 0.064], g);
    rv.scale.set(1, 1, 0.62);
  }
  // the hinge barrel (static, at the door's side) and its two mounts on the body
  const HX = 0.715;
  const HZ = F + 0.13;
  K.cyl(0.056, 0.056, 0.58, warm, [side * HX, DY, HZ], { parent: g, seg: 40 });
  [-1, 1].forEach((k) => {
    K.puck(0.06, 0.035, 0.014, warm, [side * HX, DY + k * 0.29 + (k < 0 ? -0.035 : 0), HZ], { parent: g });
    K.box([0.11, 0.08, 0.14], warm, [side * (HX - 0.02), DY + k * 0.205, F + 0.07], { r: 0.025, ...P });
  });
  // THE DOOR: pivots about the barrel's axis; door-local origin = the centre of its back face
  const pivot = K.group(g, [side * HX, DY, HZ]);
  const door = K.group(pivot, [-side * HX, 0, F + 0.06 - HZ]);
  const DT = 0.14;
  const doorMesh = new THREE.Mesh(
    lathe([
      [0, 0],
      [RD - 0.03, 0],
      [RD, 0.03],
      [RD, DT - 0.036],
      [RD - 0.036, DT],
      [RD - 0.088, DT],
      [RD - 0.104, DT - 0.024],
      [0.175, DT - 0.024],
      [0.155, DT - 0.01],
      [0, DT - 0.01],
    ]),
    bright,
  );
  doorMesh.castShadow = true;
  doorMesh.receiveShadow = true;
  door.add(doorMesh);
  // the straps from the barrel across the door's face
  [-1, 1].forEach((k) => {
    const x0s = side * 0.3;
    const x1s = side * (HX - 0.02);
    K.box([Math.abs(x1s - x0s), 0.075, 0.032], warm, [(x0s + x1s) / 2, k * 0.2, DT + 0.01], { r: 0.014, parent: door });
    K.sphere(0.018, stone, [side * 0.33, k * 0.2, DT + 0.028], door).scale.set(1, 1, 0.6);
  });
  // the locking bolts: radial capsules at mid-depth, out over the collar when locked (bolts 0), flush when retracted
  const bolts = Array.from({ length: 8 }, (_, i) => {
    const bg = K.group(door, [0, 0, 0.048]);
    bg.rotation.z = ((22.5 + i * 45) * Math.PI) / 180;
    const holder = K.group(bg);
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.034, 0.13, 6, 18), stone);
    m.rotation.z = -Math.PI / 2;
    m.castShadow = true;
    m.receiveShadow = true;
    holder.add(m);
    return holder;
  });
  // the wheel handle: a hub, four spokes ending in knobs, a rim
  const wheel = K.group(door, [0, 0, DT - 0.01]);
  K.cyl(0.066, 0.072, 0.09, warm, [0, 0, 0.045], { rot: [90, 0, 0], parent: wheel, seg: 36 });
  K.sphere(0.05, stone, [0, 0, 0.09], wheel).scale.set(1, 1, 0.55);
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 16, 72), stone);
  rimT.position.z = 0.07;
  rimT.castShadow = true;
  rimT.receiveShadow = true;
  wheel.add(rimT);
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2 + Math.PI / 4;
    K.rod([Math.cos(a) * 0.05, Math.sin(a) * 0.05, 0.07], [Math.cos(a) * 0.232, Math.sin(a) * 0.232, 0.07], 0.018, stone, wheel);
    K.sphere(0.03, warm, [Math.cos(a) * 0.245, Math.sin(a) * 0.245, 0.07], wheel);
  }
  // the lab's mark on the body above the door (true colour, black)
  const mark = T.glyph((o.brand === "openai" ? OPENAI : ANTHROPIC).paths, { color: "#141414" });
  K.print(mark, 0.34, [0, (DY + RC + VH) / 2 + 0.01, F + 0.003], [0, 0, 0], { ...P, trueColour: true });
  // the stack on the shelf, and the dashed ghost of the full stack (its front face)
  const stack = Array.from({ length: max }, (_, i) => {
    const c = K.group(g, [0.012 * Math.sin(i * 2.1), SHELF_TOP + VAULT.CARD[1] / 2 + 0.001 + i * VAULT.PITCH, 0]);
    c.rotation.y = (hash01(i + o.x * 7) - 0.5) * 7 * D2R;
    secretCard(w, VAULT.CARD, c, 0.5);
    return c;
  });
  const top = SHELF_TOP + max * VAULT.PITCH + 0.02;
  const ghost = K.group(g);
  const gx = VAULT.CARD[0] / 2 + 0.025;
  const gz = VAULT.CARD[2] / 2 + 0.03;
  K.dashes(
    [
      [-gx, SHELF_TOP + 0.02, gz],
      [-gx, top, gz],
      [gx, top, gz],
      [gx, SHELF_TOP + 0.02, gz],
    ],
    { dash: 0.08, gap: 0.055, r: 0.011, parent: ghost },
  );
  // contact shadows; the open door's warm spill on the floor in front
  K.blob(o.x + 0.06, z0 + 0.06, VW * 1.32, VD * 1.3, 0.62);
  K.pool(o.x, z0 + 0.4, 2.0, 0.16);
  const spillMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.orange), alphaMap: T.blob, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.0), spillMat);
  spill.rotation.x = -Math.PI / 2;
  spill.position.set(0, 0.006, F + 0.55);
  spill.renderOrder = 2;
  g.add(spill);
  /** from the stack's front, along the shelf, over the sill and down to the floor in front (world) */
  const rampPath: V3[] = [
    [o.x, SHELF_TOP + 0.03, z0 + 0.05],
    [o.x, SHELF_TOP + 0.03, z0 + 0.4],
    [o.x, SHELF_TOP + 0.02, z0 + F + 0.1],
    [o.x, 0.34, z0 + F + 0.4],
    [o.x, 0.04, z0 + F + 0.7],
    [o.x, 0.02, z0 + F + 1.1],
  ];
  const sill: V3 = [o.x, SHELF_TOP, z0 + F + 0.066];
  const sillNormal: V3 = [0, 0, 1];
  const doorCentre: V3 = [o.x, DY, z0 + F + 0.06 + DT];
  const st = { open: 0, wheel: 0, bolts: 0, cardsLeft: max, ghost: 0, glow: 1 };
  const update = (p: { open?: number; hatchOpen?: number; wheel?: number; bolts?: number; cardsLeft?: number; ghost?: number; glow?: number }) => {
    if (p.open !== undefined) st.open = p.open;
    else if (p.hatchOpen !== undefined) st.open = p.hatchOpen;
    if (p.wheel !== undefined) st.wheel = p.wheel;
    if (p.bolts !== undefined) st.bolts = p.bolts;
    if (p.cardsLeft !== undefined) st.cardsLeft = p.cardsLeft;
    if (p.ghost !== undefined) st.ghost = p.ghost;
    if (p.glow !== undefined) st.glow = p.glow;
    const op = clamp01(st.open);
    pivot.rotation.y = side * VAULT.OPEN_DEG * D2R * op;
    wheel.rotation.z = st.wheel;
    bolts.forEach((b) => (b.position.x = 0.548 - 0.115 * clamp01(st.bolts)));
    liningMat.emissiveIntensity = 0.13 * st.glow * clamp01(op * 3);
    backMat.emissiveIntensity = 0.2 * st.glow * clamp01(op * 3);
    spillMat.opacity = 0.2 * st.glow * lobe(op);
    spill.visible = op > 0.01 && st.glow > 0.01;
    const n = Math.max(0, Math.min(max, st.cardsLeft));
    const full = Math.floor(n);
    const frac = n - full;
    stack.forEach((c, i) => {
      c.visible = i < full || (i === full && frac > 0.001);
      // the top partial card: sliding out along the shelf toward the doorway
      c.position.z = i === full ? (1 - frac) * 0.5 : 0;
    });
    ghost.visible = st.ghost > 0.02;
    ghost.children.forEach((m: Any, i: number) => (m.visible = i / ghost.children.length <= st.ghost));
  };
  update({});
  const stackTop = (): V3 => [o.x, SHELF_TOP + Math.max(0, Math.min(max, st.cardsLeft)) * VAULT.PITCH, z0];
  /** hinge: the door's pivot group (rev 0 cuts read it; it has no cylinder children of its own) */
  return { group: g, hinge: pivot, door, wheel, bolts, update, rampPath, top, sill, sillNormal, stackTop, doorCentre, side };
};

// ===================================================================================================================
// S2 / S3: THE MONOREPO
// ===================================================================================================================
/** the tower: a base, NL code panels (counted from the BOTTOM, 0..11), a cap with the OpenAI mark on its front.
 *  Centre at (x, z); front face at z + D/2. Fixed geometry the cuts rely on (see PAUL_WORLD_READY.md). */
export const TOWER = { W: 2.3, D: 1.5, LH: 0.2, PITCH: 0.245, BASE: 0.5, NL: 12, CAP_H: 0.4 };
/** layer i's centre height (from the bottom, no gap) */
export const layerY = (i: number) => TOWER.BASE + i * TOWER.PITCH + TOWER.LH / 2 + 0.02;
/** each layer's code (FROM THE TOP): [indent, length, orange?] in tenths of a metre */
export const CODE: [number, number, boolean][][] = [
  [[0, 7, false]],
  [[1, 4, false], [6, 5, false]],
  [[2, 3, false], [6, 8, true]],
  [[2, 9, false]],
  [[1, 3, false], [5, 3, false], [9, 4, false]],
  [[0, 5, false]],
  [[1, 6, true], [8, 4, false]],
  [[2, 4, false], [7, 6, false]],
  [[2, 7, false]],
  [[1, 2, false], [4, 9, true]],
  [[0, 8, false]],
  [[1, 5, false], [7, 3, false]],
];
export const codeRowOfLayer = (i: number) => CODE[TOWER.NL - 1 - i];
const codeBars = (w: World, row: [number, number, boolean][], parent: Any, z: number, cream = false) =>
  row.map(([ind, len, o], j) => {
    const x0 = -TOWER.W / 2 + 0.22 + ind * 0.1;
    const wd = len * 0.1 - 0.05;
    const holder = w.K.group(parent, [x0, 0, z]);
    const m = w.K.box([wd, 0.075, 0.035], o ? w.K.orange(0.6) : w.K.clay(cream ? C.clay : C.slate, { mottle: false }), [wd / 2, 0, 0], { r: 0.017, seg: 3, parent: holder });
    return { holder, m, wd, alt: Math.max(0.15, wd * (0.55 + 0.9 * hash01(j * 13.3 + len))), orange: o };
  });
export const makeMonorepo = (w: World, o: { x?: number; z?: number } = {}) => {
  const { K, T, scene } = w;
  const x = o.x ?? 0;
  const z = o.z ?? 0;
  const { W: TW, D: TD, LH, BASE, NL, CAP_H } = TOWER;
  const g = K.group(scene, [x, 0, z]);
  K.box([TW + 0.2, BASE, TD + 0.2], K.clay(C.clayWarm), [0, BASE / 2, 0], { r: 0.06, parent: g });
  const layers = Array.from({ length: NL }, (_, i) => {
    const lg = K.group(g, [0, layerY(i), 0]);
    K.box([TW, LH, TD], K.clay(i % 2 === 1 ? C.clay : C.clayAlt), [0, 0, 0], { r: 0.035, parent: lg });
    const bars = codeBars(w, codeRowOfLayer(i), lg, TD / 2 + 0.012);
    return { g: lg, bars };
  });
  const capBase = layerY(NL - 1) + LH / 2 + 0.04;
  const cap = K.group(g, [0, capBase + CAP_H / 2, 0]);
  K.box([TW + 0.16, CAP_H, TD + 0.16], K.clay(C.clay), [0, 0, 0], { r: 0.07, parent: cap });
  K.print(T.glyph(OPENAI.paths, { color: "#141414" }), 0.34, [0, 0, (TD + 0.16) / 2 + 0.003], [0, 0, 0], { parent: cap, trueColour: true });
  K.blob(x + 0.15, z + 0.15, TW * 1.6, TD * 1.6, 0.65);
  K.pool(x, z + 0.3, 3.2, 0.18);
  const st = { gapAt: 6, gapOpen: 0, lift: 0, rewrite: [] as number[] };
  const update = (p: { gapAt?: number; gapOpen?: number; rewrite?: number[]; lift?: number }) => {
    if (p.gapAt !== undefined) st.gapAt = p.gapAt;
    if (p.gapOpen !== undefined) st.gapOpen = p.gapOpen;
    if (p.rewrite) st.rewrite = p.rewrite;
    const gap = TOWER.PITCH * clamp01(st.gapOpen);
    layers.forEach((L, i) => {
      L.g.position.y = layerY(i) + (i >= st.gapAt ? gap : 0);
      const r = clamp01(st.rewrite[i] ?? 0);
      // rewriting: each bar eases to its alternate length and back (one lobe), the panel's code changing
      const k = Math.sin(Math.PI * lobe(r));
      L.bars.forEach((b) => b.holder.scale.set(mix(1, b.alt / b.wd, k), 1, 1));
    });
    cap.position.y = capBase + CAP_H / 2 + gap;
  };
  /** a world point on a face: side "front" | "back" | "left" | "right", layer i (from the bottom), u -1..1 across */
  const facePoint = (side: "front" | "back" | "left" | "right", i: number, u = 0): V3 => {
    const y = layerY(i);
    if (side === "front") return [x + u * TW * 0.42, y, z + TD / 2 + 0.01];
    if (side === "back") return [x + u * TW * 0.42, y, z - TD / 2 - 0.01];
    if (side === "left") return [x - TW / 2 - 0.01, y, z + u * TD * 0.42];
    return [x + TW / 2 + 0.01, y, z + u * TD * 0.42];
  };
  return { group: g, layers, cap, capTop: capBase + CAP_H, update, facePoint, x, z };
};
export type Monorepo = ReturnType<typeof makeMonorepo>;

/** a thread along points: drawn (0..1 of its length), lit (0..1: stone -> cream), commit beads at t (0..1) */
export const makeThread = (w: World, pts: V3[], o: { r?: number; color?: string; litColor?: string; beads?: number; beadR?: number } = {}) => {
  const { K, scene } = w;
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const r = o.r ?? 0.016;
  const base = new THREE.Color(o.color ?? "#A29E97");
  const litC = new THREE.Color(o.litColor ?? C.cream);
  const mat = new THREE.MeshStandardMaterial({ color: base.clone(), roughness: 0.85, emissive: new THREE.Color(C.cream), emissiveIntensity: 0 });
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat);
  // thin tubes cast blotchy VSM shadows: threads cast none (their beads do)
  mesh.castShadow = false;
  scene.add(mesh);
  const beadMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.cream), emissive: new THREE.Color(C.cream), emissiveIntensity: 0.55, roughness: 0.6 });
  const beads = Array.from({ length: o.beads ?? 2 }, () => K.sphere(o.beadR ?? 0.055, beadMat, [0, -5, 0]));
  let drawn = -1;
  const st = { draw: 1, lit: 0, beads: [] as number[] };
  const update = (p: { draw?: number; lit?: number; beads?: number[] }) => {
    if (p.draw !== undefined) st.draw = p.draw;
    if (p.lit !== undefined) st.lit = p.lit;
    if (p.beads) st.beads = p.beads;
    const d = Math.round(clamp01(st.draw) * 200) / 200;
    if (d !== drawn) {
      drawn = d;
      mesh.geometry.dispose();
      if (d > 0.005) {
        const sub = new THREE.CatmullRomCurve3(Array.from({ length: 40 }, (_, i) => curve.getPointAt((i / 39) * d)), false, "centripetal");
        mesh.geometry = new THREE.TubeGeometry(sub, 120, r, 10, false);
      } else mesh.geometry = new THREE.BufferGeometry();
    }
    mat.color.copy(base).lerp(litC, clamp01(st.lit));
    mat.emissiveIntensity = 0.28 * clamp01(st.lit);
    beads.forEach((b, i) => {
      const t = st.beads[i];
      b.visible = t !== undefined && t >= 0 && t <= Math.min(1, st.draw);
      if (b.visible) b.position.copy(curve.getPointAt(t));
    });
  };
  update({});
  return { curve, mesh, update };
};

/** contributors all round the tower (not in the front sector): small person tokens and terminals on the floor, each
 *  with its thread rising gently into a panel on a side or the back; lit (one or per thread) and commit beads (t per
 *  thread, -1 none) */
export const makeContributors = (w: World, tower: Monorepo, o: { n?: number; seed?: number; rMin?: number; rMax?: number; front?: number } = {}) => {
  const { K, T, scene } = w;
  const n = o.n ?? 12;
  const seed = o.seed ?? 3;
  const rMin = o.rMin ?? 2.1;
  const rMax = o.rMax ?? 3.4;
  const frontHalf = (o.front ?? 40) * D2R; // keep this half-angle in front clear
  const screenT = T.draw(256, 160, (c) => {
    c.fillStyle = "#3A3835";
    c.fillRect(0, 0, 256, 160);
    c.fillStyle = C.cream;
    c.font = `700 70px monospace`;
    c.fillText(">_", 30, 100);
  });
  const items = Array.from({ length: n }, (_, i) => {
    const span = 2 * Math.PI - 2 * frontHalf;
    const a = frontHalf + (i / Math.max(1, n - 1)) * span + (hash01(i + seed) - 0.5) * (span / n) * 0.5; // 0 = toward +z
    const R = rMin + (rMax - rMin) * hash01(i * 1.7 + seed);
    const px = tower.x + Math.sin(a) * R;
    const pz = tower.z + Math.cos(a) * R;
    const face = Math.abs(Math.cos(a)) > 0.7 && Math.cos(a) < 0 ? "back" : Math.sin(a) > 0 ? "right" : "left";
    const yawToTower = Math.atan2(tower.x - px, tower.z - pz) / D2R;
    const tg = K.group(scene, [px, 0, pz], yawToTower);
    tg.scale.setScalar(1.35);
    const terminal = hash01(i * 2.3 + seed) > 0.62;
    if (terminal) {
      K.box([0.42, 0.06, 0.3], K.clay(C.clayWarm), [0, 0.03, 0.06], { r: 0.02, parent: tg });
      const scr = K.group(tg, [0, 0.06, -0.06]);
      scr.rotation.x = -14 * D2R;
      K.box([0.42, 0.3, 0.04], K.clay(C.clay), [0, 0.15, 0], { r: 0.02, parent: scr });
      K.print(screenT, 0.36, [0, 0.15, 0.021], [0, 0, 0], { parent: scr, h: 0.22 });
    } else {
      // a person token: a puck, shoulders and a head, in clay
      K.puck(0.2, 0.06, 0.02, K.clay(C.clayWarm, { mottle: false }), [0, 0, 0], { parent: tg });
      K.box([0.3, 0.2, 0.16], K.clay(C.stone), [0, 0.16, 0], { r: 0.07, parent: tg });
      K.sphere(0.085, K.clay(C.clay), [0, 0.35, 0], tg);
    }
    K.blob(px + 0.04, pz + 0.04, 0.6, 0.5, 0.45);
    const layer = 1 + Math.floor(hash01(i * 3.9 + seed) * (TOWER.NL - 2));
    const end = tower.facePoint(face as "back" | "left" | "right", layer, (hash01(i + 9.1 + seed) - 0.5) * 1.6);
    const start: V3 = [px + Math.sin(yawToTower * D2R) * 0.3, terminal ? 0.26 : 0.38, pz + Math.cos(yawToTower * D2R) * 0.3];
    const mid1 = mix3(start, end, 0.35);
    const mid2 = mix3(start, end, 0.72);
    const out = 0.35;
    const nrm = face === "back" ? [0, 0, -1] : face === "right" ? [1, 0, 0] : [-1, 0, 0];
    const pts: V3[] = [start, [mid1[0], start[1] + (end[1] - start[1]) * 0.25 + 0.25, mid1[2]], [mid2[0], start[1] + (end[1] - start[1]) * 0.75 + 0.15, mid2[2]], [end[0] + nrm[0] * out, end[1], end[2] + nrm[2] * out], end];
    const th = makeThread(w, pts, { r: 0.014, beads: 2, beadR: 0.05 });
    return { th, terminal, at: [px, 0, pz] as V3 };
  });
  const update = (p: { lit?: number | number[]; beads?: (number[] | number)[]; draw?: number | number[] }) =>
    items.forEach((it, i) =>
      it.th.update({
        lit: p.lit === undefined ? undefined : typeof p.lit === "number" ? p.lit : p.lit[i],
        draw: p.draw === undefined ? undefined : typeof p.draw === "number" ? p.draw : p.draw[i],
        beads: p.beads === undefined ? undefined : ([] as number[]).concat(p.beads[i] ?? -1),
      }),
    );
  return { items, update };
};

/** the outsider's door at the tower's foot (front face of the base), lit orange from inside; the key in the leaf */
export const makeOutsiderDoor = (w: World, tower: Monorepo, o: { x?: number } = {}) => {
  const { K } = w;
  const x = tower.x + (o.x ?? 0.55);
  const zf = tower.z + (TOWER.D + 0.2) / 2;
  const dw = 0.5;
  const dh = 0.38;
  const yc = 0.23;
  K.box([dw, dh, 0.02], K.clay(C.shadow, { mottle: false }), [x, yc, zf + 0.002], { r: 0.012, shadow: false });
  const lightMat = K.orange(1.2, true);
  const light = K.box([dw - 0.06, dh - 0.06, 0.02], lightMat, [x, yc, zf + 0.006], { r: 0.012, shadow: false });
  const hinge = K.group(w.scene, [x + dw / 2, yc, zf + 0.025]);
  K.box([dw, dh, 0.05], K.clay(C.clay), [-dw / 2, 0, 0], { r: 0.015, parent: hinge });
  const kg = K.group(hinge, [-dw + 0.09, 0, 0.03]);
  const keyMat = K.clay(C.cream, { mottle: false });
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.02, 14, 36), keyMat);
  bow.position.set(0, 0, 0.12);
  bow.castShadow = true;
  kg.add(bow);
  K.cyl(0.016, 0.016, 0.1, keyMat, [0, 0, 0.05], { rot: [90, 0, 0], parent: kg, seg: 12 });
  const st = { glow: 1, open: 1, keyIn: 1, keyTurn: 1 };
  const update = (p: { glow?: number; open?: number; keyIn?: number; keyTurn?: number }) => {
    Object.assign(st, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
    hinge.rotation.y = 62 * D2R * clamp01(st.open);
    lightMat.emissiveIntensity = 1.2 * clamp01(st.glow);
    lightMat.color.set(st.glow > 0.02 ? C.orange : C.shadow);
    light.visible = st.glow > 0.01;
    kg.visible = st.keyIn > 0.01;
    kg.position.z = 0.03 + (1 - clamp01(st.keyIn)) * 0.25;
    kg.rotation.z = 90 * D2R * clamp01(st.keyTurn);
  };
  update({});
  /** where the outsider stands to use the door (world, on the floor) */
  const standAt: V3 = [x + 0.15, 0, zf + 0.55];
  return { update, standAt, doorAt: [x, yc, zf] as V3 };
};

/** the reading lens: a clay ring and handle, the glass, and inside it the enlarged bars of the row it reads */
export const makeLens = (w: World, o: { r?: number } = {}) => {
  const { K, T, scene } = w;
  const R = o.r ?? 0.34;
  const g = K.group(scene);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.05, 20, 72), K.clay(C.clay));
  g.add(ring);
  K.cyl(0.045, 0.05, 0.5, K.clay(C.clayWarm), [R * 1.24, -R * 1.24, 0], { rot: [0, 0, 45], parent: g, seg: 24 });
  const viewMat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0, roughness: 0.6, depthWrite: false });
  const view = new THREE.Mesh(new THREE.CircleGeometry(R * 0.97, 64), viewMat);
  view.position.z = -0.005;
  g.add(view);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(R * 0.97, 64), new THREE.MeshStandardMaterial({ color: new THREE.Color("#F6F3EC"), transparent: true, opacity: 0.14, roughness: 0.15, depthWrite: false }));
  glass.position.z = 0.01;
  g.add(glass);
  const cache = new Map<string, Tex>();
  const rowTex = (row: [number, number, boolean][]) => {
    const key = JSON.stringify(row);
    if (!cache.has(key))
      cache.set(
        key,
        T.draw(512, 512, (c) => {
          c.fillStyle = C.clayAlt;
          c.fillRect(0, 0, 512, 512);
          // the panel edge above and below, the row's bars ~2.2x
          c.fillStyle = "#C9C4BA";
          c.fillRect(0, 70, 512, 10);
          c.fillRect(0, 432, 512, 10);
          row.forEach(([ind, len, or]) => {
            c.fillStyle = or ? C.orange : C.slate;
            const x = 20 + ind * 46;
            const wd = len * 46 - 22;
            c.beginPath();
            c.roundRect(x, 220, wd, 72, 30);
            c.fill();
          });
        }),
      );
    return cache.get(key)!;
  };
  // a floating lens throws a broken, blotchy VSM shadow across the panel gaps: it casts none
  // (three's VSM also draws receiveShadow meshes into the shadow map, so both go off)
  g.traverse((m: Any) => {
    m.castShadow = false;
    m.receiveShadow = false;
  });
  const st = { pos: [0, 2, 1] as V3, rot: [-6, 14, -8] as V3, read: 0, row: CODE[0] };
  const update = (p: { pos?: V3; rot?: V3; read?: number; row?: [number, number, boolean][] }) => {
    Object.assign(st, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
    g.position.set(...st.pos);
    g.rotation.set(st.rot[0] * D2R, st.rot[1] * D2R, st.rot[2] * D2R);
    const t = rowTex(st.row);
    if (viewMat.map !== t.tex) {
      viewMat.map = t.tex;
      viewMat.needsUpdate = true;
    }
    viewMat.opacity = clamp01(st.read);
    view.visible = st.read > 0.01;
  };
  update({});
  return { group: g, update };
};

/** the foreign HACKTRON panel: slate clay, cream code, the official mark and wordmark on a cream edge plate, the merge
 *  glyph on its front. insert 0 = outside the tower to the right, 1 = in its slot at layer gapAt (tower gap open) */
export const makeHacktronPanel = (w: World, tower: Monorepo, o: { gapAt?: number; glyph?: "merge" | "pr" } = {}) => {
  const { K, T, scene } = w;
  const { W: TW, D: TD, LH } = TOWER;
  const gapAt = o.gapAt ?? 6;
  const g = K.group(scene);
  K.box([TW, LH, TD], K.clay("#77746E"), [0, 0, 0], { r: 0.035, parent: g });
  codeBars(w, [[16, 2, false], [19, 2, false]], g, TD / 2 + 0.012, true);
  // the edge plate: cream clay with the official mark + wordmark (true colour, black)
  const pw = 1.05;
  const ph = 0.17;
  const px0 = -0.32;
  K.box([pw, ph, 0.05], K.clay(C.clay), [px0, 0, TD / 2 + 0.03], { r: 0.02, parent: g });
  const wm = T.image("paul-twelve-hours/hacktron_wordmark.svg", 5184 / 521, { px: 2000 });
  const mk = T.image("paul-twelve-hours/hacktron.svg", 900 / 961, { px: 400 });
  K.print(mk, 0.12, [px0 - pw / 2 + 0.1, 0, TD / 2 + 0.057], [0, 0, 0], { parent: g, trueColour: true });
  K.print(wm, 0.78, [px0 + 0.07, 0, TD / 2 + 0.057], [0, 0, 0], { parent: g, trueColour: true });
  // the merge glyph (Lucide git-merge / git-pull-request), stroked cream on the panel front
  const glyph = T.draw(256, 256, (c) => {
    c.strokeStyle = C.cream;
    c.lineCap = "round";
    c.lineJoin = "round";
    c.scale(256 / 24, 256 / 24);
    c.lineWidth = 2.1;
    if ((o.glyph ?? "merge") === "merge") {
      c.beginPath();
      c.arc(18, 18, 3, 0, 6.283);
      c.stroke();
      c.beginPath();
      c.arc(6, 6, 3, 0, 6.283);
      c.stroke();
      c.stroke(new Path2D("M6 21V9a9 9 0 0 0 9 9"));
    } else {
      c.stroke(new Path2D("M6 9v12M13 6h3a2 2 0 0 1 2 2v7M16 3l-3 3 3 3"));
      c.beginPath();
      c.arc(18, 18, 3, 0, 6.283);
      c.stroke();
      c.beginPath();
      c.arc(6, 6, 3, 0, 6.283);
      c.stroke();
    }
  });
  K.print(glyph, 0.19, [0.4, 0, TD / 2 + 0.003], [0, 0, 0], { parent: g });
  // the glint: a thin cream line along the front top edge
  const glintMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(C.cream), emissive: new THREE.Color(C.cream), emissiveIntensity: 0, roughness: 0.5 });
  const glint = K.box([TW, 0.014, 0.014], glintMat, [0, LH / 2 - 0.004, TD / 2 + 0.004], { r: 0.006, parent: g, shadow: false, seg: 2 });
  const st = { insert: 0, glint: 0 };
  const update = (p: { insert?: number; glint?: number }) => {
    Object.assign(st, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
    g.position.set(tower.x + (1 - clamp01(st.insert)) * (TW * 1.25), layerY(gapAt), tower.z);
    glintMat.emissiveIntensity = 1.4 * clamp01(st.glint);
    glint.visible = st.glint > 0.01;
  };
  update({});
  return { group: g, update };
};

// ===================================================================================================================
// S4: THE DIAL AND THE SLACK STACK
// ===================================================================================================================
/** a 12-hour dial standing on a block printed "12 HOURS": a thick disc, a darker face, the sweep lit cream from 12
 *  clockwise, the hand at the sweep's edge. sweep 0..1 = 0..12 h. pos = the dial's centre. */
export const makeDial = (w: World, o: { pos: V3; yaw?: number; R?: number; label?: string }) => {
  const { K, T, scene } = w;
  const R = o.R ?? 0.86;
  const g = K.group(scene, o.pos, o.yaw ?? 16);
  K.cyl(R, R, 0.22, K.clay(C.clay), [0, 0, 0], { rot: [90, 0, 0], parent: g });
  K.cyl(R * 0.9, R * 0.9, 0.02, K.clay("#8C877F", { mottle: false }), [0, 0, 0.115], { rot: [90, 0, 0], parent: g });
  const secMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#F8F4EC"), emissive: new THREE.Color("#F8F4EC"), emissiveIntensity: 0.38, roughness: 0.8 });
  const sec = new THREE.Mesh(new THREE.BufferGeometry(), secMat);
  sec.position.set(0, 0, 0.128);
  sec.receiveShadow = true;
  g.add(sec);
  for (let i = 0; i < 12; i++) {
    const a = (90 - i * 30) * D2R;
    K.box([0.05, i % 3 === 0 ? 0.16 : 0.1, 0.03], K.clay(C.ink, { mottle: false }), [Math.cos(a) * R * 0.74, Math.sin(a) * R * 0.74, 0.14], { r: 0.012, rot: [0, 0, a / D2R - 90], parent: g, seg: 3 });
  }
  const hand = K.group(g, [0, 0, 0.17]);
  K.box([0.06, 0.62, 0.04], K.clay(C.ink, { mottle: false }), [0, 0.27, 0], { r: 0.02, parent: hand, seg: 3 });
  K.cyl(0.07, 0.07, 0.06, K.clay(C.ink, { mottle: false }), [0, 0, 0.17], { rot: [90, 0, 0], parent: g, seg: 32 });
  // the block it stands on, printed with its label
  const bh = 0.36;
  const by = o.pos[1] - R - bh / 2 + 0.03;
  const block = K.group(scene, [o.pos[0], by, o.pos[2]], o.yaw ?? 16);
  K.box([1.9, bh + 0.08, 0.62], K.clay(C.clayWarm), [0, 0.04, 0], { r: 0.05, parent: block });
  const lbl = T.text(o.label ?? "12 HOURS", { px: 150, color: C.ink, pad: 0.06 });
  const lw = 1.74;
  const labelHolder = K.group(block, [0, 0.04, 0.312]);
  K.print(lbl, lw, [0, 0, 0], [0, 0, 0], { parent: labelHolder });
  w.legible(labelHolder, (lw / lbl.aspect) * (lbl.capFrac ?? 0.5));
  K.blob(o.pos[0] + 0.05, o.pos[2] + 0.1, 1.7, 1.05, 0.55);
  let last = -1;
  const update = (p: { sweep?: number }) => {
    const s = clamp01(p.sweep ?? (last < 0 ? 0 : last));
    if (Math.abs(s - last) > 1e-4) {
      last = s;
      sec.geometry.dispose();
      const deg = Math.max(0.01, 360 * s);
      sec.geometry = new THREE.CircleGeometry(R * 0.86, 128, (90 - deg) * D2R, deg * D2R);
      sec.visible = s > 0.0005;
      hand.rotation.z = -deg * D2R;
    }
  };
  update({ sweep: 0 });
  return { group: g, update };
};

/** the Slack stack: n channel tiles round an orange core under a cap with the Slack mark (four colours, or black
 *  like the Anthropic mark beside it: mark "black", rev 1) and the Anthropic mark. open per tile 0..1: the tile slides
 *  out like a drawer and its message bar lights. */
export const makeSlackStack = (w: World, o: { x?: number; z?: number; n?: number; mark?: "colour" | "black" } = {}) => {
  const { K, T, scene } = w;
  const sx = o.x ?? 1.02;
  const sz = o.z ?? 0;
  const n = o.n ?? 7;
  const th = 0.3;
  const pitch = 0.355;
  const y0 = 0.16;
  K.box([1.9, y0, 1.5], K.clay(C.clayWarm), [sx, y0 / 2, sz]);
  K.box([1.62, n * pitch - 0.02, 1.2], K.orange(0.9), [sx, y0 + (n * pitch) / 2, sz + 0.02], { r: 0.03 });
  const hashT = T.text("#", { px: 200, color: C.ink, pad: 0.1 });
  const tiles = Array.from({ length: n }, (_, i) => {
    const y = y0 + i * pitch + th / 2 + 0.03;
    const tg = K.group(scene, [sx + (hash01(i + 4) - 0.5) * 0.06, y, sz]);
    K.box([1.72, th, 1.3], K.clay(i % 2 ? C.clay : C.clayAlt), [0, 0, 0], { r: 0.035, parent: tg });
    const zf = 0.65 + 0.003;
    K.print(hashT, 0.2, [-0.62, 0, zf], [0, 0, 0], { parent: tg });
    const bw = 0.55 + 0.45 * hash01(i + 7);
    const barMat = K.orange(0.7, true);
    K.box([bw, 0.08, 0.03], barMat, [-0.42 + bw / 2, 0, zf + 0.01], { r: 0.018, seg: 3, parent: tg });
    return { tg, barMat, out: 0.32 + 0.16 * hash01(i + 2), skew: (hash01(i + 9) - 0.5) * 8, y };
  });
  const capY = y0 + n * pitch + 0.03 + 0.26;
  K.box([1.9, 0.5, 1.5], K.clay(C.clay), [sx, capY, sz + 0.12], { r: 0.07 });
  const slack = T.image(o.mark === "black" ? "paul-twelve-hours/slack_black.svg" : "paul-twelve-hours/slack.svg", 1, { px: 512 });
  K.print(slack, 0.3, [sx - 0.3, capY, sz + 0.12 + 0.752], [0, 0, 0], { trueColour: true });
  K.print(T.glyph(ANTHROPIC.paths, { color: "#141414" }), 0.36, [sx + 0.3, capY, sz + 0.12 + 0.752], [0, 0, 0], { trueColour: true });
  K.blob(sx + 0.12, sz + 0.25, 2.5, 2.0, 0.6);
  K.pool(sx, sz + 0.4, 2.6, 0.16);
  const update = (p: { open?: number[] | ((i: number) => number) }) => {
    if (!p.open) return;
    tiles.forEach((t, i) => {
      const v = clamp01(typeof p.open === "function" ? p.open(i) : (p.open as number[])[i] ?? 0);
      t.tg.position.z = sz + v * t.out;
      t.tg.rotation.y = v * t.skew * D2R;
      t.barMat.emissiveIntensity = 0.9 * v;
      t.barMat.color.set(C.slate).lerp(new THREE.Color(C.orange), Math.min(1, v * 4));
    });
  };
  update({ open: () => 0 });
  return { update, capY, x: sx, z: sz, tiles };
};

// ===================================================================================================================
// LABELS
// ===================================================================================================================
/** a name plate standing on the floor (or a surface) at `at`, on a short stem: cream clay with ink caps, or an image
 *  (a wordmark, e.g. paul-twelve-hours/cathedral_black.png). Kept legible (cap >= minPx). show 0..1 rises it up. */
export const makeNamePlate = (
  w: World,
  o: { text?: string; image?: { path: string; aspect: number; capFrac?: number }; at: V3; yaw?: number; w?: number; tilt?: number; stem?: number; minPx?: number; color?: string },
) => {
  const { K, T, scene } = w;
  const root = K.group(scene, o.at, o.yaw ?? 0);
  const holder = K.group(root);
  const pw = o.w ?? 1.1;
  const stem = o.stem ?? 0.1;
  let capH = 0.1;
  const build = (text?: string) => {
    K.clear(holder);
    let t: Tex;
    let h: number;
    const pr = pw * 0.95;
    if (o.image && !text) {
      const pad = 90;
      t = T.image(o.image.path, o.image.aspect, { px: 1600, pad });
      h = (pw / t.aspect) * 1.0;
      const ih = (1600 - 2 * pad) / o.image.aspect;
      capH = (pr / t.aspect) * (o.image.capFrac ?? 0.8) * (ih / (ih + 2 * pad));
    } else {
      t = T.text(text ?? o.text ?? "", { px: 150, color: C.ink });
      h = (pw / t.aspect) * 1.02;
      capH = (pr / t.aspect) * (t.capFrac ?? 0.5);
    }
    const g = K.group(holder, [0, stem + h / 2, 0]);
    g.rotation.x = -(o.tilt ?? 6) * D2R;
    K.box([pw, h, 0.08], K.clay(o.color ?? C.clay), [0, 0, 0], { r: 0.035, parent: g });
    K.print(t, pr, [0, 0, 0.042], [0, 0, 0], { parent: g, trueColour: !!o.image && !text });
    if (stem > 0.001) K.box([0.05, stem + 0.02, 0.05], K.clay(C.cream, { mottle: false }), [0, stem / 2, 0], { r: 0.02, parent: holder });
    return h;
  };
  let label = o.text;
  build(o.text);
  w.legible(holder, () => capH, o.minPx ?? 48);
  const st = { show: 1, yaw: o.yaw ?? 0 };
  const update = (p: { show?: number; yaw?: number; text?: string }) => {
    if (p.text !== undefined && p.text !== label) {
      label = p.text;
      build(p.text);
    }
    if (p.show !== undefined) st.show = p.show;
    if (p.yaw !== undefined) st.yaw = p.yaw;
    root.rotation.y = st.yaw * D2R;
    const s = clamp01(st.show);
    root.visible = s > 0.01;
    holder.position.y = -(1 - lobe(s)) * 0.3;
    root.scale.setScalar(0.6 + 0.4 * lobe(s));
  };
  update({});
  return { root, update };
};
/** the yaw that turns a face (normal +z) toward the camera, horizontally */
export const yawTo = (cam: CamDef, at: V3) => Math.atan2(cam.pos[0] - at[0], cam.pos[2] - at[2]) / D2R;

// ===================================================================================================================
// S5 / S6 / S7: THE RACE RULER
// ===================================================================================================================
/** the ruler runs along -z: month m at z = -m * MPM; the US lane nearer the near (x -) edge, China's beyond it;
 *  the numbers on the near edge strip (NUM_X), upright to a camera at the front left. */
export const RULER = { W: 2.8, Z0: 1.3, Z1: -10.5, MPM: 0.5, LANE: { us: -0.5, cn: 0.5 }, LANE_LINE: 0, NUM_X: -1.18, TOP: 0.16, PUCK: 0.42 };
export const monthZ = (m: number) => -m * RULER.MPM;
export const makeRuler = (w: World, o: { months?: number; z1?: number } = {}) => {
  const { K, T } = w;
  const Z1 = o.z1 ?? RULER.Z1;
  const RW = RULER.W;
  const RZ0 = RULER.Z0;
  const len = RZ0 - Z1;
  const months = o.months ?? 20;
  K.box([RW, RULER.TOP, len], K.clay(C.clay), [0, RULER.TOP / 2, (RZ0 + Z1) / 2], { r: 0.05 });
  const ppm = 260;
  const top = T.draw(RW * ppm, len * ppm, (c) => {
    c.clearRect(0, 0, RW * ppm, len * ppm);
    c.textAlign = "center";
    c.textBaseline = "middle";
    const yOf = (z: number) => (z - Z1) * ppm;
    for (let m = 0; m <= months; m++) {
      const z = monthZ(m);
      if (z < Z1 + 0.1) continue;
      const y = yOf(z);
      c.fillStyle = C.ink;
      c.globalAlpha = 0.75;
      c.fillRect(0.4 * ppm, y - 0.014 * ppm, (RW - 0.46) * ppm, 0.028 * ppm);
      c.globalAlpha = 1;
      c.save();
      c.translate((RULER.NUM_X + RW / 2) * ppm, y);
      c.rotate(Math.PI / 2);
      c.font = `700 ${0.34 * ppm}px "${FONT}"`;
      c.fillText(String(m), 0, 0.01 * ppm);
      c.restore();
      for (let q = 1; q < 4; q++) {
        const yq = y - (q / 4) * RULER.MPM * ppm;
        if (yq < 0) continue;
        c.globalAlpha = 0.38;
        c.fillRect((RW - 0.32) * ppm, yq - 0.009 * ppm, 0.26 * ppm, 0.018 * ppm);
        c.globalAlpha = 1;
      }
    }
    c.globalAlpha = 0.28;
    c.fillRect((RULER.LANE_LINE + RW / 2 - 0.008) * ppm, 0, 0.016 * ppm, len * ppm);
    c.globalAlpha = 1;
  });
  K.print(top, RW, [0, RULER.TOP + 0.001, (RZ0 + Z1) / 2], [-90, 0, 0], { h: len });
  K.blob(0.08, (RZ0 + Z1) / 2, RW * 1.18, len * 1.04, 0.32);
  K.pool(0, -1.5, 4.5, 0.14);
};

/** a flag on a pole on a puck; the flag in true colour, waving with `wave` (the frame); base at (lane x, y, month z) */
export const makeFlagToken = (w: World, o: { kind: "us" | "cn"; lane?: number; flyLeft?: boolean }) => {
  const { K, T, scene } = w;
  const x = o.lane ?? (o.kind === "us" ? RULER.LANE.us : RULER.LANE.cn);
  const g = K.group(scene, [x, RULER.TOP, 0]);
  const PH = 1.55;
  K.puck(RULER.PUCK, 0.15, 0.05, K.clay(C.clay, { mottle: false }), [0, 0, 0], { parent: g });
  K.cyl(0.026, 0.026, PH, K.clay(C.clayWarm, { mottle: false }), [0, 0.15 + PH / 2, 0], { parent: g, seg: 16 });
  K.sphere(0.05, K.clay(C.clay, { mottle: false }), [0, 0.15 + PH + 0.03, 0], g);
  const fw = 1.0;
  const fh = 0.66;
  const fl = !!o.flyLeft;
  const tex = T.draw(1000, 660, (c) => {
    if (fl) {
      c.translate(1000, 0);
      c.scale(-1, 1);
    }
    if (o.kind === "us") drawUSFlag(c, 1000, 660);
    else drawCNFlag(c, 1000, 660);
  });
  const geo = new THREE.PlaneGeometry(fw, fh, 40, 10);
  const pos = geo.attributes.position;
  const base = Float32Array.from(pos.array as ArrayLike<number>);
  const mat = new THREE.MeshStandardMaterial({ map: tex.tex, side: THREE.DoubleSide, roughness: 0.9, emissive: new THREE.Color("#ffffff"), emissiveMap: tex.tex, emissiveIntensity: 0.3, fog: false });
  const flag = new THREE.Mesh(geo, mat);
  flag.position.set((fl ? -1 : 1) * (fw / 2 + 0.024), 0.15 + PH - fh / 2 - 0.02, 0);
  flag.castShadow = true;
  flag.receiveShadow = true;
  flag.userData.tc = true;
  const fg = K.group(g);
  fg.add(flag);
  const blob = K.blob(x + 0.06, 0.03, 1.15, 1.15, 0.5, RULER.TOP + 0.004);
  const st = { month: 0, y: RULER.TOP, yaw: 0, wave: 0, show: 1 };
  const update = (p: { month?: number; y?: number; yaw?: number; wave?: number; show?: number }) => {
    Object.assign(st, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
    const z = monthZ(st.month);
    g.position.set(x, st.y, z);
    g.visible = st.show > 0.01;
    g.scale.setScalar(0.4 + 0.6 * lobe(clamp01(st.show)));
    fg.rotation.y = st.yaw * D2R;
    blob.position.set(x + 0.06, st.y + 0.004, z + 0.03);
    blob.visible = g.visible;
    const ph = st.wave * 0.11;
    for (let i = 0; i < pos.count; i++) {
      const bx = base[i * 3];
      const by = base[i * 3 + 1];
      const u = fl ? (fw / 2 - bx) / fw : (bx + fw / 2) / fw;
      pos.setZ(i, (0.06 + 0.02 * Math.sin(ph * 0.37)) * Math.sin(u * 6.5 + 0.3 - ph) * u);
      pos.setY(i, by - 0.03 * u * u + 0.012 * u * Math.sin(u * 5 - ph * 1.3));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };
  update({});
  return { group: g, update, x };
};

/** a neat stack of orange cards in a lane at a month; cards may be fractional (the next card drops in from above);
 *  open lifts the top cards askew. topY() = the stack's top (where a flag token stands). */
export const STACK_CARD: V3 = [0.98, 0.07, 0.8];
export const STACK_PITCH = 0.075;
export const makeOrangeStack = (w: World, o: { lane: number; max?: number }) => {
  const { K, scene } = w;
  const max = o.max ?? 16;
  const g = K.group(scene, [o.lane, 0, 0]);
  const cards = Array.from({ length: max }, (_, i) => {
    const c = K.group(g);
    secretCard(w, STACK_CARD, c, 0.5);
    return { c, jx: 0.014 * Math.sin(i * 2.3), jy: (hash01(i + o.lane * 3) - 0.5) * 8 };
  });
  const blob = K.blob(0, 0, 1.4, 1.2, 0.55);
  const st = { month: 0, cards: 4, open: 0, y0: RULER.TOP };
  const update = (p: { month?: number; cards?: number; open?: number; y0?: number }) => {
    Object.assign(st, Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined)));
    const z = monthZ(st.month);
    g.position.set(o.lane, 0, z);
    const n = Math.max(0, Math.min(max, st.cards));
    const full = Math.floor(n);
    const frac = n - full;
    cards.forEach((cd, i) => {
      const vis = i < full || (i === full && frac > 0.001);
      cd.c.visible = vis;
      if (!vis) return;
      const drop = i === full ? (1 - lobe(frac)) * 0.6 : 0;
      // the top two cards slid askew when open
      const k = i - (full - 2);
      const askew = k >= 0 && i < full ? clamp01(st.open) : 0;
      cd.c.position.set(cd.jx + askew * 0.1 * (k + 1), st.y0 + STACK_CARD[1] / 2 + i * STACK_PITCH + drop, askew * 0.09 * (k + 1));
      cd.c.rotation.y = (cd.jy + askew * 14 * (k + 1)) * D2R;
    });
    blob.position.set(o.lane + 0.08, st.y0 + 0.003, z + 0.04);
    blob.visible = n > 0.01;
  };
  const topY = () => st.y0 + Math.max(0, Math.min(max, st.cards)) * STACK_PITCH;
  update({});
  return { group: g, update, topY };
};

/** a dashed ring on the ruler top: where a token stood (or might stand) */
export const makeGhostRing = (w: World, o: { lane: number; r?: number }) => {
  const g = w.K.group(w.scene);
  const r = o.r ?? RULER.PUCK;
  const pts: V3[] = [];
  for (let i = 0; i <= 72; i++) pts.push([r * Math.cos((i / 72) * 6.283), RULER.TOP + 0.025, r * Math.sin((i / 72) * 6.283)]);
  w.K.dashes(pts, { dash: 0.12, gap: 0.08, r: 0.024, parent: g });
  const update = (p: { month?: number; show?: number }) => {
    if (p.month !== undefined) g.position.set(o.lane, 0, monthZ(p.month));
    if (p.show !== undefined) {
      g.visible = p.show > 0.01;
      g.children.forEach((m: Any, i: number) => (m.visible = i / g.children.length <= p.show!));
    }
  };
  update({ month: 0, show: 1 });
  return { group: g, update };
};

/** the gap bracket along the lane line, low over the ruler: a rod from month `from` to `to` with end ticks dropping
 *  to the ruler, solid or dashed (not real), carrying a plate on a signpost stem at its middle (plateX across, stem
 *  height). draw 0..1 draws it from `from`. Rebuilt only when its shape changes. */
export const makeGapBracket = (w: World, o: { x?: number; y?: number; drop?: number; r?: number; plateX?: number; stem?: number; plateW?: number; plateAt?: number; plateY?: number } = {}) => {
  const { K, scene } = w;
  const x = o.x ?? RULER.LANE_LINE;
  const y = o.y ?? 0.42;
  const drop = o.drop ?? 0.2;
  const r = o.r ?? 0.04;
  const g = K.group(scene);
  const mat = K.clay(C.cream, { mottle: false });
  const plate = makeNamePlate(w, { text: " ", at: [x + (o.plateX ?? 0.1), y, 0], w: o.plateW ?? 1.0, stem: o.stem ?? 0.68, tilt: 0 });
  let key = "";
  const st = { from: 0, to: 8, dashed: 0, label: "", show: 1, draw: 1, yaw: 0 };
  const update = (p: { from?: number; to?: number; dashed?: number | boolean; label?: string; show?: number; draw?: number; plateYaw?: number }) => {
    if (p.from !== undefined) st.from = p.from;
    if (p.to !== undefined) st.to = p.to;
    if (p.dashed !== undefined) st.dashed = typeof p.dashed === "boolean" ? (p.dashed ? 1 : 0) : p.dashed;
    if (p.label !== undefined) st.label = p.label;
    if (p.show !== undefined) st.show = p.show;
    if (p.draw !== undefined) st.draw = p.draw;
    if (p.plateYaw !== undefined) st.yaw = p.plateYaw;
    const za = monthZ(st.from);
    const zb = monthZ(st.from + (st.to - st.from) * clamp01(st.draw));
    const span = Math.abs(zb - za);
    const dashed = st.dashed > 0.5;
    const k = `${za.toFixed(3)}|${zb.toFixed(3)}|${dashed}|${st.show > 0.01}`;
    if (k !== key) {
      key = k;
      K.clear(g);
      if (st.show > 0.01 && span > 0.02) {
        const pts: V3[] = [
          [x, y - drop, za],
          [x, y, za],
          [x, y, zb],
          [x, y - drop, zb],
        ];
        if (dashed) K.dashes(pts, { dash: 0.14, gap: 0.1, r, parent: g });
        else {
          K.rod(pts[0], pts[1], r, mat, g);
          K.rod(pts[1], pts[2], r, mat, g);
          K.rod(pts[2], pts[3], r, mat, g);
        }
      }
    }
    const pm = (za + zb) / 2 + (o.plateAt ?? 0);
    plate.root.position.set(x + (o.plateX ?? 0.1), y + (o.plateY ?? 0), pm);
    plate.update({ text: st.label, yaw: st.yaw, show: st.show * (st.label.trim() ? 1 : 0) * clamp01(span / 0.05) });
  };
  update({});
  return { group: g, update, plate };
};

/** a dashed box outline (a protection that isn't there), drawn 0..1 */
export const makeDashedCase = (w: World, o: { center: V3; size: V3; r?: number }) => {
  const g = w.K.group(w.scene);
  const [cx, cy, cz] = o.center;
  const [sx, sy, sz] = o.size.map((v) => v / 2) as V3;
  const c = (a: number, b: number, d: number): V3 => [cx + a * sx, cy + b * sy, cz + d * sz];
  // one continuous path over the box's edges (drawn in this order)
  const path: V3[][] = [
    [c(-1, -1, 1), c(-1, 1, 1), c(1, 1, 1), c(1, -1, 1)],
    [c(1, -1, -1), c(1, 1, -1), c(-1, 1, -1), c(-1, -1, -1)],
    [c(-1, 1, 1), c(-1, 1, -1)],
    [c(1, 1, 1), c(1, 1, -1)],
    [c(1, -1, 1), c(1, -1, -1)],
    [c(-1, -1, 1), c(-1, -1, -1)],
  ];
  let last = -1;
  const update = (p: { draw?: number }) => {
    const d = Math.round(clamp01(p.draw ?? 1) * 120) / 120;
    if (d === last) return;
    last = d;
    w.K.clear(g);
    path.forEach((seg, i) => {
      const u = clamp01(d * path.length - i);
      if (u > 0) w.K.dashes(seg, { dash: 0.14, gap: 0.09, r: o.r ?? 0.022, parent: g, upTo: u });
    });
  };
  update({ draw: 0 });
  return { group: g, update };
};

// ===================================================================================================================
// FLAGS (true colours)
// ===================================================================================================================
const star = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot = -Math.PI / 2) => {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.382;
    const a = rot + (i * Math.PI) / 5;
    ctx.lineTo(x + rr * Math.cos(a), y + rr * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
};
export const drawUSFlag = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  for (let i = 0; i < 13; i++) {
    ctx.fillStyle = i % 2 === 0 ? TRUE.usRed : TRUE.usWhite;
    ctx.fillRect(0, (i * h) / 13, w, h / 13 + 1);
  }
  const cw = w * 0.4;
  const ch = (h * 7) / 13;
  ctx.fillStyle = TRUE.usBlue;
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = TRUE.usWhite;
  for (let r = 0; r < 9; r++) {
    const n = r % 2 === 0 ? 6 : 5;
    for (let c = 0; c < n; c++) star(ctx, (cw / 12) * (2 * c + 1 + (r % 2)), (ch / 10) * (r + 1), Math.min(cw, ch) * 0.04);
  }
};
export const drawCNFlag = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
  ctx.fillStyle = TRUE.cnRed;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = TRUE.cnYellow;
  const u = w / 30;
  star(ctx, 5 * u, 5 * u, 3 * u);
  const smalls: [number, number][] = [
    [10, 2],
    [12, 4],
    [12, 7],
    [10, 9],
  ];
  smalls.forEach(([x, y]) => star(ctx, x * u, y * u, u, Math.atan2(5 - y, 5 - x)));
};
