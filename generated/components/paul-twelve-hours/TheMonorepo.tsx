// ---------------------------------------------------------------------------
// TheMonorepo (paul-twelve-hours, cut 11). Paul world, Look C "Graphite air" (styles/dwarkesh-3d.md medium,
// styles/dwarkesh.md vocabulary; the shared world paulWorld / paulWorldSets / paulFolk, imported, never edited).
// Opaque 1080x1920, 23.976 fps, 110 frames.
//
// CHECK LINE: "one repo holds nearly all of OpenAI's code, so getting in means getting nearly everything."
//
// THE LINE: "...or they got access to the monorepo where most OpenAI code is shared and iterated on."
// WORD -> FRAME (Whisper, from f0; true onsets ~5-9 f later): or -1 · they 2 · got 3 · access 5 · to 11 · the 18 ·
//   monorepo 25 · where 34 · most 39 · OpenAI 52 · code 64 · is 75 · shared 83 · and 92 · iterated 95 · on 101
// DURATION: the slot 11.762 -> 16.350 s = 4.588 s x 23.976 = 110 frames (f0..f109).
//
// THE MOTION (rev 1, user notes Nov 17: "start with a tight shot on him, then zoom out and reveal the entire thing";
// the outsider is the world's 3D clay figure, built in the scene). TIGHT on his hooded head and his right hand at the
// lock on the door's right jamb, the shut door's seam glowing beside the hand. From f0 he turns the key (f0-10) while
// the seam warms; the door swings out (f10-26) on the lit passage ("got access": inner jambs, a short receding corridor
// brightest at its far wall, code bars glimpsed there, warm light on the floor and on his face from a weak lamp at the
// threshold). He turns the key back (f15-21), draws it out (f19-34) and looks up as ONE eased pull-back (f20-80)
// reveals the door at the tower's foot, the tower rising, the OpenAI cap arriving on "OpenAI" (true ~f58) and the whole
// tower. Three contributors a side (the same clay figure, 1 m, in sand hoodies, typing at laptops) draw faint thin feed
// lines into a side panel each (f56-85), and cream commit beads with a short glowing trail ride them in, landings
// staggered f80-97 and repeating to f109 ("shared", true ~f89); each landing rewrites its panel's bars (one lobe, 12 f)
// - "shared and iterated on". Living drift only after f80.
// Orange = the American labs' algorithmic secrets (the code's orange lines, the light inside the tower); the outsider,
// contributors, feed lines and beads are neutral.
//
// CAMERA: the world's orbit camera (camTrack + living). Opening dist 3.3, yaw -20 (head and key hand in the keep-in
// box, his body running down through the caption bands), held f0-20; then one pull-back built as two overlapping lobes
// (dolly-out + orbit + crane f20-76, target drift onto the tower f30-80) to the whole tower (cap top ~y 325, base
// ~y 1026, his feet ~y 1040).
//
// SOURCES: none on screen beyond the OpenAI mark (kits/dwarkesh/brandGlyphs via the world's tower cap). The monorepo
// is the internal `openai/openai` repo Hacktron reached (COMMON.md facts, Jul 2026).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { C, D2R, PaulStage, THREE, camTrack, clamp01, ease01, living, mix3, orbitCam, type Any, type Orbit, type V3, type World, type WorldSpec } from "./paulWorld";
import { TOWER, makeMonorepo, makeThread, yawTo } from "./paulWorldSets";
import { OUT3D_INKS, makeOutsider3D, type OutsiderPose3D } from "./paulOutsider3d";

export const FPS = 24000 / 1001;
export const DURATION = 110;
export const schema = z.object({ debug: z.boolean(), pick: z.array(z.number()) });
export const defaultProps = schema.parse({ debug: false, pick: [] });

// ===================================================================================================================
// THE DOOR (this cut's prop: the world's makeOutsiderDoor hatch sits at knee height, out of a standing figure's reach,
// so this door is set into the tower's foot on the bar-free right third of the front face, sized to him)
// ===================================================================================================================
const DOOR = { X: 0.66, OW: 0.6, OH: 1.28, JW: 0.12, LT: 0.14, Z0: 0.7, Z1: 1.12 };
/** the right jamb's front-outer corner (x, z): the lock sits on it, facing the outsider's key */
const JAMB_CORNER: [number, number] = [DOOR.X + DOOR.OW / 2 + DOOR.JW, DOOR.Z1];
const LAMP = 0.75;
const makeDoor = (w: World) => {
  const { K, scene } = w;
  const { X, OW, OH, JW, LT, Z0, Z1 } = DOOR;
  const zc = (Z0 + Z1) / 2;
  const d = Z1 - Z0;
  const frame = K.clay(C.clayWarm);
  K.box([JW, OH + LT, d], frame, [X - OW / 2 - JW / 2, (OH + LT) / 2, zc], { r: 0.035 });
  K.box([JW, OH + LT, d], frame, [X + OW / 2 + JW / 2, (OH + LT) / 2, zc], { r: 0.035 });
  K.box([OW + 2 * JW, LT, d], frame, [X, OH + LT / 2, zc], { r: 0.035 });
  // the light inside: a passage receding into the tower, built in forced perspective inside the deep door frame (its
  // back wall at 46 % scale only 0.15 m behind the threshold, so it reads as a long corridor from the front without
  // cutting the world's tower). Unlit vertex-colour walls: warm brown at the threshold to bright orange deep inside,
  // with a few code bars glimpsed on the bright end; a light-leak sheet behind the shut leaf's seams gives way as it opens.
  const ZE = Z1 - 0.105;
  const ZB = 0.862;
  const SC = 0.46;
  const bc: [number, number] = [X + 0.03, OH * 0.5 + 0.08];
  const xl = X - OW / 2;
  const xr = X + OW / 2;
  const E: V3[] = [[xl, 0, ZE], [xr, 0, ZE], [xr, OH, ZE], [xl, OH, ZE]];
  const B: V3[] = E.map(([x, y]) => [bc[0] + (x - X) * SC, bc[1] + (y - OH / 2) * SC, ZB] as V3);
  const NEAR = new THREE.Color("#6E4618");
  const FAR = new THREE.Color("#F09A22");
  const BACK = new THREE.Color("#FFC765");
  const passMat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const quad = (pts: V3[], cols: Any[]) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(cols.flatMap((c: Any) => [c.r, c.g, c.b]), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const m = new THREE.Mesh(g, passMat);
    m.castShadow = false;
    m.receiveShadow = false;
    scene.add(m);
    return m;
  };
  quad([E[0], B[0], B[3], E[3]], [NEAR, FAR, FAR, NEAR]); // left wall
  quad([E[1], B[1], B[2], E[2]], [NEAR, FAR, FAR, NEAR]); // right wall
  quad([E[0], E[1], B[1], B[0]], [NEAR, NEAR, FAR, FAR]); // floor
  quad([E[3], E[2], B[2], B[3]], [NEAR, NEAR, FAR, FAR]); // ceiling
  quad(B, [BACK, BACK, BACK, BACK]); // the bright end
  // code bars glimpsed inside, on the bright end (bars along the side walls read as light rays in this perspective)
  const barMat = (c: string) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const bar = (pts: V3[], mat: Any) => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts.flat(), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = false;
    m.receiveShadow = false;
    scene.add(m);
  };
  const orangeBar = barMat("#FFB000");
  const liteBar = barMat("#FFE2A6");
  const onBack = (u: number, v: number): V3 => [mix3(B[0], B[1], u)[0], mix3(B[0], B[3], v)[1], ZB + 0.001];
  (
    [
      [0.12, 0.62, 0.78],
      [0.22, 0.75, 0.62],
      [0.22, 0.55, 0.46],
      [0.12, 0.7, 0.3],
    ] as [number, number, number][]
  ).forEach(([u0, u1, v]) => {
    const t = 0.03;
    bar([onBack(u0, v - t), onBack(u1, v - t), onBack(u1, v + t), onBack(u0, v + t)], v === 0.62 ? orangeBar : liteBar);
  });
  // the light leaking round the shut leaf: a bright sheet just inside the threshold that gives way as it opens
  const leakMat = new THREE.MeshBasicMaterial({ color: new THREE.Color("#FFB21A"), transparent: true, depthWrite: false });
  const leak = new THREE.Mesh(new THREE.PlaneGeometry(OW, OH), leakMat);
  leak.position.set(X, OH / 2, ZE + 0.002);
  scene.add(leak);
  // the leaf, hinged on the left jamb, swinging out toward us
  const hinge = K.group(scene, [X - OW / 2 + 0.004, 0, Z1 - 0.04]);
  const leafMat = K.clay(C.clay);
  K.box([OW - 0.05, OH - 0.04, 0.06], leafMat, [OW / 2 - 0.004, OH / 2 + 0.006, -0.03], { r: 0.02, parent: hinge });
  // the light falling out of the doorway onto the floor (a warm spill blob) and onto him (a weak short-range warm lamp
  // just inside the threshold; kept low so the swung leaf does not blow out)
  const spill = K.blob(X + 0.08, Z1 + 0.62, 1.25, 1.5, 0, 0.005);
  spill.material = spill.material.clone();
  spill.material.color.set("#FFB000");
  spill.material.blending = THREE.AdditiveBlending;
  const lamp = new THREE.PointLight(new THREE.Color("#FFB04A"), 0, 2.6, 2);
  lamp.position.set(X + 0.1, 0.85, Z1 + 0.05);
  lamp.castShadow = false;
  scene.add(lamp);
  const LEAK_DIM = new THREE.Color("#7A4E1C");
  const LEAK_HOT = new THREE.Color("#FFB21A");
  const update = (p: { open: number; seam: number; glow: number }) => {
    hinge.rotation.y = -100 * D2R * clamp01(p.open);
    leakMat.color.copy(LEAK_DIM).lerp(LEAK_HOT, clamp01(p.seam));
    spill.material.opacity = 0.3 * clamp01(p.glow);
    lamp.intensity = LAMP * clamp01(p.glow);
    leakMat.opacity = 1 - clamp01(p.open / 0.35);
    leak.visible = leakMat.opacity > 0.002;
  };
  return { update };
};

/** the lock block on the jamb's corner, its face square to the key: the key's bit sits 25 mm inside it */
const makeLock = (w: World, tip: V3, dir: V3) => {
  const { K, scene } = w;
  const n = new THREE.Vector3(...dir).normalize();
  const g = K.group(scene, [tip[0] + n.x * 0.005, tip[1] + n.y * 0.005, tip[2] + n.z * 0.005]);
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), n);
  K.box([0.1, 0.15, 0.06], K.clay(C.stone, { mottle: false }), [0, 0, 0], { r: 0.012, parent: g });
  K.cyl(0.03, 0.03, 0.006, K.clay(C.clayWarm, { mottle: false }), [0, 0, 0.031], { rot: [90, 0, 0], parent: g, seg: 20 });
  K.box([0.008, 0.026, 0.004], K.clay("#2A2826", { mottle: false }), [0, -0.004, 0.035], { r: 0.002, parent: g });
};

// ===================================================================================================================
// THE CONTRIBUTORS (this cut's: placed so both sides read in the final wide; each feeds one panel)
// ===================================================================================================================
type Feeder = { at: [number, number]; h: number; face: "left" | "right"; layer: number; u: number; period: number; phase: number };
// people at laptops, the same clay figure as the outsider at a smaller size (1 m), three a side spaced ~70 px apart
// across the final wide at three depths (near ones larger by perspective), clear of the base and of the outsider. In turn round the tower: left front -> left back -> right back ->
// right front. Layers all different (one feeder per panel), periods >= REWRITE so a rewrite never restarts mid-lobe.
const FEEDERS: Feeder[] = [
  { at: [-2.03, 1.3], h: 1.0, face: "left", layer: 1, u: 0.6, period: 15, phase: 0 },
  { at: [-1.7, -0.3], h: 1.0, face: "left", layer: 3, u: 0.0, period: 14, phase: 37 },
  { at: [-2.94, -2.6], h: 1.0, face: "left", layer: 5, u: -0.7, period: 16, phase: 71 },
  { at: [1.63, -2.7], h: 1.0, face: "right", layer: 2, u: -0.8, period: 15, phase: 19 },
  { at: [2.33, -0.7], h: 1.0, face: "right", layer: 4, u: -0.3, period: 13, phase: 53 },
  { at: [2.9, 1.0], h: 1.0, face: "right", layer: 6, u: 0.2, period: 14, phase: 88 },
];
const TRAVEL = 14; // frames for a bead from contributor to panel (constant pace along its line)
const DRAW_LEN = 10; // frames for a feed line to draw from its contributor into the tower (ends as its first bead leaves)
const REWRITE = 12; // frames of a panel's rewrite lobe after a bead lands
/** the launch frames of feeder i's beads: first landings staggered f80..f97.5, then each at its own period */
const launches = (i: number) => Array.from({ length: 4 }, (_, n) => 66 + i * 3.5 + n * FEEDERS[i].period);
const TRAIL_M = 0.55; // metres of glowing band behind a bead
/** a contributor's pose: typing at the laptop held level, head down to the screen (breath and blinks from frame) */
const feederPose = (F: Feeder, yaw: number, f: number): OutsiderPose3D => ({ hood: "up", carry: "laptop", typing: 1, yaw, frame: f + F.phase, headPitch: 14 });
/** the contributors wear warm sand hoodies and stone trousers (this cut's own tinted copies of the figure's
 * materials), so they read as the people who work on the repo, apart from the slate outsider */
const STAFF_TINT: [string, string][] = [
  [OUT3D_INKS.hoodie, "#C2B9A8"],
  [OUT3D_INKS.hoodieDeep, "#ADA493"],
  [OUT3D_INKS.hoodieRib, "#B5AC9B"],
  [OUT3D_INKS.hoodIn, "#8E8577"],
  [OUT3D_INKS.trousers, "#6F6A62"],
];
const tintStaff = (fig: ReturnType<typeof makeOutsider3D>, cache: Map<string, Any>) => {
  const keys = new Map(STAFF_TINT.map(([a, b]) => [new THREE.Color(a).getHexString(), b]));
  fig.group.traverse((o: Any) => {
    const m = o.isMesh ? o.material : null;
    if (!m || !m.color) return;
    const to = keys.get(m.color.getHexString());
    if (!to) return;
    if (!cache.has(m.uuid)) {
      const c = m.clone();
      c.color.set(to);
      cache.set(m.uuid, c);
    }
    o.material = cache.get(m.uuid);
  });
};
const makeFeeders = (w: World, tower: ReturnType<typeof makeMonorepo>, camEnd: Any) => {
  const { scene } = w;
  const tints = new Map<string, Any>();
  const beadMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#FFF8EC"), emissive: new THREE.Color("#FFF3DE"), emissiveIntensity: 0.95, roughness: 0.5 });
  const trailMats = [0.7, 0.42, 0.18].map((o) => new THREE.MeshBasicMaterial({ color: new THREE.Color("#FFF6E8"), transparent: true, opacity: o, depthWrite: false }));
  return FEEDERS.map((F, i) => {
    const [px, pz] = F.at;
    const at: V3 = [px, 0, pz];
    // turned between the tower (what they feed) and the final camera (so faces and screens read), fixed: no pivots
    const toTower = Math.atan2(tower.x - px, tower.z - pz) / D2R;
    const toCam = yawTo(camEnd, at);
    const yaw = toTower + 0.45 * (((toCam - toTower + 540) % 360) - 180);
    const fig = makeOutsider3D(w);
    tintStaff(fig, tints);
    fig.update(feederPose(F, yaw, 0), at, F.h);
    const lp = new THREE.Vector3();
    fig.rig.lap.getWorldPosition(lp);
    const end = tower.facePoint(F.face, F.layer, F.u);
    const start: V3 = [lp.x, lp.y + 0.06, lp.z];
    // the feed line: thin and faint (it only carries the commits; the band behind each bead is what lights)
    const th = makeThread(w, [start, mix3(start, end, 0.5), end], { r: 0.008, beads: 0, color: "#C9C4BB" });
    th.mesh.material.transparent = true;
    th.mesh.material.depthWrite = false;
    const len = th.curve.getLength();
    const beads = [0, 1].map(() => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), beadMat);
      b.castShadow = false;
      b.receiveShadow = false;
      scene.add(b);
      const trail = trailMats.map((m) => {
        const t = new THREE.Mesh(new THREE.BufferGeometry(), m);
        t.castShadow = false;
        scene.add(t);
        return t;
      });
      return { b, trail };
    });
    /** a bead at t (or hidden), its band of trail behind it in three fading steps */
    const setBead = (k: number, t: number) => {
      const B = beads[k];
      const on = t >= 0 && t <= 1;
      B.b.visible = on;
      B.trail.forEach((m: Any, j: number) => {
        m.geometry.dispose();
        m.geometry = new THREE.BufferGeometry();
        if (!on) return;
        const seg = TRAIL_M / len / 3;
        const t1 = t - j * seg;
        const t0 = Math.max(0, t1 - seg);
        if (t1 - t0 < 0.004) return;
        const sub = new THREE.CatmullRomCurve3(Array.from({ length: 6 }, (_, q) => th.curve.getPointAt(t0 + ((t1 - t0) * q) / 5)));
        m.geometry = new THREE.TubeGeometry(sub, 8, 0.024 - j * 0.004, 8, false);
      });
      if (on) B.b.position.copy(th.curve.getPointAt(t));
    };
    return { F, i, th, setBead, fig, at, yaw };
  });
};

// ===================================================================================================================
// THE OUTSIDER (the world's 3D clay figure): beside the right jamb, three-quarter to us, his right hand reaching to
// the lock on the jamb's corner with the key; he turns it, the door swings, he turns it back and draws the key out,
// then looks up the tower as we pull away. Feet planted all cut (no walk, no turn).
// ===================================================================================================================
const OUT_YAW = -60; // world yaw (0 faces +z, the camera's side)
const OUT_H = 1.45;
const T_KEY = { turn: [0, 10] as [number, number], open: [10, 26] as [number, number], back: [15, 21] as [number, number], out: [19, 34] as [number, number] };
const outPose = (f: number): OutsiderPose3D => {
  const out = ease01(T_KEY.out[0], T_KEY.out[1], f);
  const look = ease01(26, 58, f) * (1 - 0.45 * ease01(78, 104, f));
  return {
    hood: "up",
    carry: "none",
    yaw: OUT_YAW,
    frame: f + 12,
    reach: 1 - 0.88 * out,
    keyTurn: ease01(T_KEY.turn[0], T_KEY.turn[1], f) * (1 - ease01(T_KEY.back[0], T_KEY.back[1], f)),
    headYaw: -12 * (1 - out) + 6 * look,
    headPitch: 6 * (1 - out) - 16 * look,
  };
};
/** where his key's bit is at the lock (contact pose): on the right jamb's outer side, near its front corner */
const TIP_AT: [number, number] = [JAMB_CORNER[0] + 0.035, JAMB_CORNER[1] - 0.12];
/** his feet: TIP_AT minus the bit's offset from the feet in the contact pose (measured at build; see makeStage) */
const OUT_AT: V3 = [1.641, 0, 0.948];

// ===================================================================================================================
// THE CAMERA: tight on his hooded head and the key hand at the lock (the door's seam glowing beside the hand), held with
// living drift through the turn and the door opening, then ONE eased pull-back (dist in log space, a slight crane up
// and a drift of the target onto the tower) f20-80 that reveals the door at the tower's foot, the tower rising, the
// cap on "OpenAI" and lands on the whole tower before the contributors light. Only living drift after.
// ===================================================================================================================
const START: Orbit = { target: [1.27, 0.8, 1.02], dist: 3.3, yaw: -20, pitch: 3, fov: 30 };
const END: Orbit = { target: [0.25, 0.3, 0.25], dist: 20.5, yaw: 13, pitch: 8, fov: 30 };
// one pull-back as two overlapping lobes: the dolly-out with its orbit and crane (f20-76) and the target's drift onto
// the tower (f30-80), so the drift happens once the lens is wide (his head stays within ~80 px of its x all the way)
const TRACK = camTrack(START, [
  { from: 20, to: 76, key: { dist: END.dist, yaw: END.yaw, pitch: END.pitch, fov: END.fov } },
  { from: 30, to: 80, key: { target: END.target } },
]);
const camOf = (f: number) => orbitCam(living(TRACK(f), f));
const CAM_END = orbitCam(END);

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
const MEAS = { text: "" };
const SPEC: WorldSpec = {
  fog: { near: 12, far: 40 },
  light: { center: [0.3, 1.6, 0.3], span: 6 },
  build: (w) => {
    const T = makeMonorepo(w);
    const D = makeDoor(w);
    const O = makeOutsider3D(w);
    // the lock goes where his key's bit is in the contact pose (the turn rolls the key about its own shaft)
    O.update(outPose(0), OUT_AT, OUT_H);
    const tip = O.keyTip();
    const kb = new THREE.Vector3();
    O.rig.key.getWorldPosition(kb);
    makeLock(w, tip, [tip[0] - kb.x, tip[1] - kb.y, tip[2] - kb.z]);
    MEAS.text = `tip ${tip.map((v) => v.toFixed(3)).join(",")} kb ${[kb.x, kb.y, kb.z].map((v) => v.toFixed(3)).join(",")} head ${O.head().map((v) => v.toFixed(3)).join(",")}`;
    const feeders = makeFeeders(w, T, CAM_END);
    return (f) => {
      D.update({ seam: 0.35 + 0.65 * ease01(0, 10, f), open: ease01(T_KEY.open[0], T_KEY.open[1], f), glow: ease01(T_KEY.open[0], T_KEY.open[1] + 4, f) });
      O.update(outPose(f), OUT_AT, OUT_H);
      const rewrite: number[] = Array.from({ length: TOWER.NL }, () => 0);
      feeders.forEach(({ F, i, th, setBead, fig, at, yaw }) => {
        fig.update(feederPose(F, yaw, f), at, F.h);
        const L = launches(i);
        const draw = ease01(L[0] - DRAW_LEN, L[0] + 1, f);
        th.update({ draw, lit: 0 });
        th.mesh.material.opacity = 0.35;
        const ts = L.map((l) => (f - l) / TRAVEL).filter((t) => t >= 0 && t <= 1);
        setBead(0, ts[0] ?? -1);
        setBead(1, ts[1] ?? -1);
        // the latest landing on this feeder's panel drives its rewrite (contact = landing frame)
        const arr = L.map((l) => l + TRAVEL).filter((A) => A <= f);
        if (arr.length) rewrite[F.layer] = clamp01((f - arr[arr.length - 1]) / REWRITE);
      });
      T.update({ rewrite });
    };
  },
};

const TheMonorepo: React.FC<z.infer<typeof schema>> = ({ debug, pick }) => {
  const cur = useCurrentFrame();
  // review stills: `pick` maps the render's frames onto chosen cut frames
  const f = pick.length ? pick[Math.min(cur, pick.length - 1)] : cur;
  const cam = camOf(f);
  return (
    <PaulStage
      spec={SPEC}
      cam={cam}
      frame={f}
      overlay={
        debug
          ? (P) => {
              const ft = P(OUT_AT);
              const hd = P([OUT_AT[0], OUT_H, OUT_AT[2]]);
              const tp = P([TIP_AT[0], 0.9, TIP_AT[1]]);
              return (
                <>
                  <circle cx={tp[0]} cy={tp[1]} r={6} fill="blue" />
                  <text x={20} y={110} fontSize={30} fill="red">{MEAS.text}</text>
                  <text x={20} y={60} fontSize={36} fill="red">{`f${f} h=${(ft[1] - hd[1]).toFixed(0)} feet ${ft[0].toFixed(0)},${ft[1].toFixed(0)} cap ${P([0, 3.66, 0.83])[1].toFixed(0)} base ${P([0, 0, 0.85])[1].toFixed(0)}`}</text>
                </>
              );
            }
          : undefined
      }
    />
  );
};

export default TheMonorepo;
