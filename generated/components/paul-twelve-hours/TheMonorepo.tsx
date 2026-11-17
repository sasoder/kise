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
// THE MOTION: low and close on the outsider at a person-sized door in the foot of the one code tower; his right hand is
// on the key in the jamb, the shut door's seams already leak orange. He turns the key (contact f0, turn f2-12) and the
// door swings out (first reaction f11, open by f27) onto a lit passage ("got access"): inner jambs, a short receding
// corridor whose warm gradient is brightest at its far wall, orange and cream code bars glimpsed on that wall, and a
// soft orange spill on the floor and on his front. He lets go and looks up. The camera holds through the key and the
// door, then ONE eased crane up + pull-back (f25-75) brings the OpenAI cap in on the way up ("OpenAI" true ~f58) and
// lands on the whole tower. Three contributors a side (clay person tokens and >_ laptops, near ones larger, set apart
// from the base in two rows) draw faint thin feed lines into a side panel each (f56-85), and cream commit beads with a
// short glowing trail ride them inward at a constant pace, landings staggered f80-97 and repeating to f109 ("shared",
// true ~f89); each landing (contact) rewrites its panel's bars from the next frame (one lobe, 12 f) — "shared and
// iterated on". Living drift only after f75.
// Orange = the American labs' algorithmic secrets (the code's orange lines, the light inside the tower); the outsider,
// contributors, feed lines and beads are neutral.
//
// CAMERA: the world's orbit camera (camTrack + living). Opening ~320 px/m at the outsider (he is ~475 px tall; the
// tower top off frame), held f0-25; one lobe f25-75 to the whole tower in the keep-in box (cap top ~y 325, base
// ~y 1025, feet ~y 1050); nothing in the caption bands once the door is open.
//
// SOURCES: none on screen beyond the OpenAI mark (kits/dwarkesh/brandGlyphs via the world's tower cap). The monorepo
// is the internal `openai/openai` repo Hacktron reached (COMMON.md facts, Jul 2026).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { C, D2R, PaulStage, THREE, camTrack, clamp01, ease01, living, mix3, orbitCam, type Any, type Orbit, type V3, type World, type WorldSpec } from "./paulWorld";
import { TOWER, makeMonorepo, makeThread } from "./paulWorldSets";
import { Outsider, buildOutsider, FIGURE_UNITS, type OutsiderPose } from "./paulFolk";

export const FPS = 24000 / 1001;
export const DURATION = 110;
export const schema = z.object({ debug: z.boolean(), pick: z.array(z.number()) });
export const defaultProps = schema.parse({ debug: false, pick: [] });

// ===================================================================================================================
// THE DOOR (this cut's prop: the world's makeOutsiderDoor hatch sits at knee height, out of a standing figure's reach,
// so this door is set into the tower's foot on the bar-free right third of the front face, sized to him)
// ===================================================================================================================
const DOOR = { X: 0.66, OW: 0.6, OH: 1.28, JW: 0.12, LT: 0.14, Z0: 0.7, Z1: 1.12, KY: 0.74 };
/** the keyhole on the right jamb (world) */
const KEYHOLE: V3 = [DOOR.X + DOOR.OW / 2 + DOOR.JW / 2, DOOR.KY, DOOR.Z1 + 0.012];
const makeDoor = (w: World) => {
  const { K, scene } = w;
  const { X, OW, OH, JW, LT, Z0, Z1, KY } = DOOR;
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
  // a lock plate and the key in it
  K.box([0.1, 0.17, 0.016], K.clay(C.stone, { mottle: false }), [KEYHOLE[0], KY, Z1 + 0.004], { r: 0.008 });
  const key = K.group(scene, [KEYHOLE[0], KY, Z1 + 0.012]);
  const keyMat = K.clay(C.cream, { mottle: false });
  K.cyl(0.013, 0.013, 0.07, keyMat, [0, 0, 0.035], { rot: [90, 0, 0], parent: key, seg: 12 });
  // the bow: a flat ring standing in the key's plane, so the turn reads (upright -> flat)
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.016, 12, 32), keyMat);
  bow.position.set(0, 0.0, 0.1);
  bow.rotation.y = 90 * D2R;
  bow.castShadow = true;
  key.add(bow);
  // the light falling out of the doorway onto the floor (a warm spill, no lamp: a point light blew the leaf out to yellow)
  const spill = K.blob(X + 0.08, Z1 + 0.62, 1.25, 1.5, 0, 0.005);
  spill.material = spill.material.clone();
  spill.material.color.set("#FFB000");
  spill.material.blending = THREE.AdditiveBlending;
  const update = (p: { open: number; turn: number; glow: number }) => {
    hinge.rotation.y = -100 * D2R * clamp01(p.open);
    key.rotation.z = -90 * D2R * clamp01(p.turn);
    spill.material.opacity = 0.3 * clamp01(p.glow);
    leakMat.opacity = 1 - clamp01(p.open / 0.35);
    leak.visible = leakMat.opacity > 0.002;
  };
  return { update };
};

// ===================================================================================================================
// THE CONTRIBUTORS (this cut's: placed so both sides read in the final wide; each feeds one panel)
// ===================================================================================================================
type Feeder = { at: [number, number]; s: number; terminal: boolean; face: "left" | "right"; layer: number; u: number; period: number };
// two rows a side in the final wide: a near row (laptop outside, person inside on the left; laptop inside, person
// outside on the right) and one far person set back and out, so all three read apart; near ones larger (s).
// In turn round the tower: left front -> left back -> right back -> right front. Layers all different (one feeder
// per panel), periods >= REWRITE so a panel's rewrite never restarts mid-lobe.
const FEEDERS: Feeder[] = [
  { at: [-2.1, 1.35], s: 1.2, terminal: true, face: "left", layer: 1, u: 0.6, period: 15 },
  { at: [-1.65, 0.65], s: 1.1, terminal: false, face: "left", layer: 3, u: 0.3, period: 14 },
  { at: [-3.1, -1.7], s: 1.0, terminal: false, face: "left", layer: 6, u: -0.7, period: 16 },
  { at: [1.75, -2.6], s: 1.0, terminal: false, face: "right", layer: 7, u: -0.8, period: 15 },
  { at: [2.55, 0.9], s: 1.1, terminal: false, face: "right", layer: 5, u: -0.1, period: 13 },
  { at: [1.95, 1.35], s: 1.2, terminal: true, face: "right", layer: 2, u: 0.3, period: 14 },
];
const TRAVEL = 14; // frames for a bead from contributor to panel (constant pace along its line)
const DRAW_LEN = 10; // frames for a feed line to draw from its contributor into the tower (ends as its first bead leaves)
const REWRITE = 12; // frames of a panel's rewrite lobe after a bead lands
/** the launch frames of feeder i's beads: first landings staggered f80..f97.5, then each at its own period */
const launches = (i: number) => Array.from({ length: 4 }, (_, n) => 66 + i * 3.5 + n * FEEDERS[i].period);
const TRAIL_M = 0.55; // metres of glowing band behind a bead
const makeFeeders = (w: World, tower: ReturnType<typeof makeMonorepo>) => {
  const { K, T, scene } = w;
  const screenT = T.draw(256, 160, (c) => {
    c.fillStyle = "#3A3835";
    c.fillRect(0, 0, 256, 160);
    c.fillStyle = C.cream;
    c.font = `700 70px monospace`;
    c.fillText(">_", 30, 100);
  });
  const beadMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#FFF8EC"), emissive: new THREE.Color("#FFF3DE"), emissiveIntensity: 0.95, roughness: 0.5 });
  const trailMats = [0.7, 0.42, 0.18].map((o) => new THREE.MeshBasicMaterial({ color: new THREE.Color("#FFF6E8"), transparent: true, opacity: o, depthWrite: false }));
  return FEEDERS.map((F, i) => {
    const [px, pz] = F.at;
    const yawToTower = Math.atan2(tower.x - px, tower.z - pz) / D2R;
    const tg = K.group(scene, [px, 0, pz], yawToTower);
    tg.scale.setScalar(F.s);
    if (F.terminal) {
      K.box([0.42, 0.06, 0.3], K.clay(C.clayWarm), [0, 0.03, 0.06], { r: 0.02, parent: tg });
      const scr = K.group(tg, [0, 0.06, -0.06]);
      scr.rotation.x = -14 * D2R;
      K.box([0.42, 0.3, 0.04], K.clay(C.clay), [0, 0.15, 0], { r: 0.02, parent: scr });
      K.print(screenT, 0.36, [0, 0.15, 0.021], [0, 0, 0], { parent: scr, h: 0.22 });
    } else {
      K.puck(0.2, 0.06, 0.02, K.clay(C.clayWarm, { mottle: false }), [0, 0, 0], { parent: tg });
      K.box([0.3, 0.2, 0.16], K.clay(C.stone), [0, 0.16, 0], { r: 0.07, parent: tg });
      K.sphere(0.085, K.clay(C.clay), [0, 0.35, 0], tg);
    }
    K.blob(px + 0.05, pz + 0.05, 0.45 * F.s, 0.39 * F.s, 0.45);
    const end = tower.facePoint(F.face, F.layer, F.u);
    const fwd: V3 = [Math.sin(yawToTower * D2R), 0, Math.cos(yawToTower * D2R)];
    const start: V3 = [px + fwd[0] * 0.22 * F.s, (F.terminal ? 0.26 : 0.24) * F.s, pz + fwd[2] * 0.22 * F.s];
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
    return { F, i, th, setBead };
  });
};

// ===================================================================================================================
// THE STAGE
// ===================================================================================================================
const T_KEY = { turn: [2, 12] as [number, number], open: [11, 27] as [number, number] };
const SPEC: WorldSpec = {
  fog: { near: 12, far: 40 },
  light: { center: [0.3, 1.6, 0.3], span: 6 },
  build: (w) => {
    const T = makeMonorepo(w);
    const D = makeDoor(w);
    const feeders = makeFeeders(w, T);
    return (f) => {
      D.update({ turn: ease01(T_KEY.turn[0], T_KEY.turn[1], f), open: ease01(T_KEY.open[0], T_KEY.open[1], f), glow: ease01(T_KEY.open[0], T_KEY.open[1] + 4, f) });
      const rewrite: number[] = Array.from({ length: TOWER.NL }, () => 0);
      feeders.forEach(({ F, i, th, setBead }) => {
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

// the camera: held low and close on the door through the key turn and the opening (living drift only), then ONE eased
// move (crane up + pull-back together) f25-75 onto the whole-tower wide; the cap enters the keep-in at ~f60. The
// outsider's feet stay at y 1037-1053 all the way (above the caption band).
const START: Orbit = { target: [1.0, 0.23, 1.2], dist: 10.2, yaw: 8, pitch: 3.5, fov: 34 };
const TRACK = camTrack(START, [{ from: 25, to: 75, key: { target: [0.0, 0.3, 0.25], dist: 20.5, yaw: 13, pitch: 8, fov: 30 } }]);
const camOf = (f: number) => orbitCam(living(TRACK(f), f));

// the outsider: by the right jamb, turned toward the door, his right hand on the key
const OUT_AT: V3 = [1.37, 0, 1.38];
const outPose = (f: number): OutsiderPose => {
  const let_go = ease01(15, 30, f);
  const look = ease01(26, 52, f) * (1 - 0.6 * ease01(70, 100, f));
  return { hood: "up", carry: "none", yaw: -36, frame: f, reach: 1 - 0.85 * let_go, headPitch: 2 - 14 * look, headYaw: -6 * look };
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
      overlay={(P) => {
        const pose = outPose(f);
        const ft = P(OUT_AT);
        const hd = P([OUT_AT[0], 1.45, OUT_AT[2]]);
        const s = (ft[1] - hd[1]) / FIGURE_UNITS;
        const hand = buildOutsider(pose).anchors.handR;
        const kh = P(KEYHOLE);
        const pxm = (ft[1] - hd[1]) / 1.45;
        const sp = P([OUT_AT[0] - 0.16, 0.82, OUT_AT[2] + 0.02]);
        return (
          <>
            <Outsider P={P} at={OUT_AT} heightM={1.45} pose={pose} uid="s2o" />
            {/* the doorway's light on his front (the side toward the door) and the jamb beside him */}
            <defs>
              <radialGradient id="s2spill">
                <stop offset="0" stopColor="#FFB000" stopOpacity={1} />
                <stop offset="0.55" stopColor="#FFB000" stopOpacity={0.45} />
                <stop offset="1" stopColor="#FFB000" stopOpacity={0} />
              </radialGradient>
            </defs>
            <ellipse
              cx={sp[0]}
              cy={sp[1]}
              rx={0.34 * pxm}
              ry={0.78 * pxm}
              fill="url(#s2spill)"
              opacity={0.34 * ease01(T_KEY.open[0], T_KEY.open[1] + 4, f)}
              style={{ mixBlendMode: "screen" }}
            />
            {debug ? (
              <>
                <circle cx={ft[0] + hand[0] * s} cy={ft[1] + hand[1] * s} r={6} fill="red" />
                <circle cx={kh[0]} cy={kh[1]} r={6} fill="blue" />
                <text x={20} y={60} fontSize={40} fill="red">{`f${f} h=${(ft[1] - hd[1]).toFixed(0)} hand ${(ft[0] + hand[0] * s).toFixed(0)},${(ft[1] + hand[1] * s).toFixed(0)} key ${kh[0].toFixed(0)},${kh[1].toFixed(0)} cap ${P([0, 3.66, 0.83])[1].toFixed(0)} base ${P([0, 0, 0.85])[1].toFixed(0)}`}</text>
              </>
            ) : null}
          </>
        );
      }}
    />
  );
};

export default TheMonorepo;
