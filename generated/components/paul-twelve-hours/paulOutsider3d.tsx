// ===================================================================================================================
// paulOutsider3d — THE OUTSIDER as a real 3D clay figure IN the paul-twelve-hours world (rev 1). A designer-toy /
// clay-figurine hooded kid, ~3 heads tall, built from three.js meshes in the world's clay (same key light, cream rim,
// VSM + contact shadows, fog and grade as the sets). Never realistic: a big round face in a modelled hood with a thick
// soft rim, two dark dot eyes (they blink), a tiny nose bump, a faint printed blush, a small smile; a soft hoodie sack
// with a kangaroo pocket, two drawstrings and ribbed cuffs and hem; tapered sleeve arms with mitten hands; slim
// trousers; chunky rounded off-white trainers on a sole band. Inks: slate hoodie, charcoal trousers, off-white
// trainers (OUTSIDER_INKS of paulFolk). Nothing on him is orange (only the cards a cut puts in his tote).
//
//   const O = makeOutsider3D(w, { toteCards? })            inside a WorldSpec build (once)
//   O.update(pose, at, heightM = 1.45)                       per frame: feet on the floor point `at` (world)
//   O.group, O.hand("R" | "L"), O.keyTip(), O.head()        world anchors (valid after update)
//
// POSE (OutsiderPose of paulFolk, same meaning, plus three new actions):
//   yaw       deg, WORLD yaw: 0 faces +z (toward a camera on +z), +90 faces +x (walks to screen right). Unlike the 2D
//             overlay this is no longer relative to the camera: to face the camera use yawTo(cam, at) (paulWorldSets).
//   walk      the walk phase (rad); walkAmt 0..1 the walk's amount (ease it in and out: the feet stay planted).
//             One step per PI of phase; STRIDE = 2 * OUT3D.STEP m per 2 PI. Move `at` with walkPlan / walkTravel.
//   reach 0..1 right arm forward (door, key)     keyTurn 0..1  the right wrist turns a small key (key shown when set)
//   whoa  0..1 small hands-up surprise           typing  0..1  (carry "laptop") opens the hugged laptop and taps
//   carry "tote" | "laptop" | "none"             toteCards 0..4  orange cards peeking out of the tote
//   fumble 0..1 a clumsy jiggle                  frame   the frame (breathing, idle weight shift, blinks, tapping)
//   headYaw / headPitch (+ looks down) / headRoll    armR / armL  full overrides (the Worker's ArmPose, in 3D:
//             abd out to the side, flex forward, abd2 upper-arm twist (- = forearm inward), flex2 elbow, droop wrist,
//             thumb 0..1 = forearm roll to palm-down, optional roll deg)
//   shuffle 0..1 lifts the feet alternately in place (use while turning on the spot; the walk phase drives it)
// Pose helpers (same names as paulFolk + 3D): outsiderStand3D, outsiderWalk3D, outsiderReach3D, outsiderCarry3D.
// WALKING WITHOUT SLIDING: walkPlan({ from, to, f0, f1, rampIn, rampOut }) -> (f) => { at, yaw, walk, walkAmt }
//   solves the phase rate so the planted foot never slides (exact, eased start and stop). walkTravel(phase) is the
//   distance at constant walkAmt 1 (OUT3D.STEP m per PI). Comfortable cadence 0.22-0.42 rad / frame (0.5-1 m/s).
// RIG (groups): root (at, yaw, scale) > pelvis (bob, sway, roll, twist) > spine (lean) > chest (breath) > neck > head
//   (yaw, pitch, roll); chest > shoulderR/L > elbowR/L > wristR/L; root > hipR/L > kneeR/L; root > ankleR/L (two-bone
//   IK from the hip to a planted / stepping ankle; heel strike about the heel, toe off about the ball).
// ===================================================================================================================
import { OUTSIDER_INKS } from "./paulFolk";
import { D2R, THREE, clamp01, hash01, mix, type Any, type V3, type World } from "./paulWorld";

// ---- inks (the 2D outsider's, plus skin and face) ---------------------------------------------------------------
export const OUT3D_INKS = {
  ...OUTSIDER_INKS,
  skin: "#EBD6C3",
  nose: "#E6CDB8",
  eye: "#24201D",
  mouth: "#4A3A33",
  hoodIn: "#44484D",
  laptopScreen: "#3A3835",
  key: "#D8D0BE",
};
/** the figure's geometry (metres at the nominal height 1.45; the root is scaled for other heights) */
export const OUT3D = {
  /** his default height (m); the model is built at its own height TOP and scaled to heightM */
  H: 1.45,
  STEP: 0.27,
  LIFT: 0.066,
  HIP_Y: 0.408,
  ANKLE_Y: 0.074,
  FOOT_X: 0.088,
  HIP_X: 0.08,
  THIGH: 0.17,
  SHIN: 0.168,
  SH_X: 0.17,
  SH_Y: 0.762,
  UPPER: 0.14,
  FORE: 0.128,
  NECK_Y: 0.832,
  /** a brisk walk's phase per frame (as paulFolk) */
  RATE: 0.26,
};
const STRIDE = 2 * OUT3D.STEP;
export { STRIDE as OUT3D_STRIDE };

// ---- pose types and helpers --------------------------------------------------------------------------------------
export type Arm3 = { abd: number; flex: number; abd2: number; flex2: number; droop: number; thumb: number; roll?: number };
export type OutsiderPose3D = {
  yaw?: number;
  walk?: number;
  walkAmt?: number;
  reach?: number;
  carry?: "tote" | "laptop" | "none";
  hood?: "up" | "down";
  frame?: number;
  headYaw?: number;
  headPitch?: number;
  headRoll?: number;
  fumble?: number;
  armR?: Arm3;
  armL?: Arm3;
  whoa?: number;
  keyTurn?: number;
  typing?: number;
  toteCards?: number;
  shuffle?: number;
};
export const outsiderStand3D = (o: OutsiderPose3D = {}): OutsiderPose3D => ({ carry: "none", hood: "up", ...o });
/** a brisk walk on the spot's phase (frame * RATE); move `at` by walkTravel(walk) along the yaw */
export const outsiderWalk3D = (frame: number, o: OutsiderPose3D = {}): OutsiderPose3D => ({ hood: "up", carry: "none", ...o, walk: frame * OUT3D.RATE, walkAmt: o.walkAmt ?? 1, frame });
export const outsiderReach3D = (t: number, o: OutsiderPose3D = {}): OutsiderPose3D => ({ hood: "up", carry: "none", ...o, reach: t });
export const outsiderCarry3D = (frame: number, carry: "tote" | "laptop", o: OutsiderPose3D = {}): OutsiderPose3D => ({ hood: "up", ...o, carry, frame });

/** the distance walked at walkAmt 1 over a phase (m): STEP per PI */
export const walkTravel = (phase: number, amt = 1) => (amt * OUT3D.STEP * phase) / Math.PI;
const TAU = Math.PI * 2;
const modp = (v: number, m: number) => ((v % m) + m) % m;
/** stance progress 0..1 of whichever foot is planted at this phase */
const stanceS = (phi: number) => modp(phi, Math.PI) / Math.PI;
/** the exact distance walked between frames fa and fb for any phase(f) / amt(f) (summed per frame; no sliding) */
export const walkIntegrate = (phaseAt: (f: number) => number, amtAt: (f: number) => number, fa: number, fb: number) => {
  let d = 0;
  const n = Math.ceil(Math.abs(fb - fa) * 4);
  for (let i = 0; i < n; i++) {
    const f0 = fa + ((fb - fa) * i) / n;
    const f1 = fa + ((fb - fa) * (i + 1)) / n;
    const p0 = phaseAt(f0);
    const p1 = phaseAt(f1);
    const a0 = amtAt(f0);
    const a1 = amtAt(f1);
    // switches of the planted foot inside the step
    const k0 = Math.floor(p0 / Math.PI);
    const k1 = Math.floor(p1 / Math.PI);
    let sw = 0;
    for (let k = Math.min(k0, k1) + 1; k <= Math.max(k0, k1); k++) {
      const t = (k * Math.PI - p0) / (p1 - p0);
      sw += (p1 >= p0 ? 1 : -1) * mix(a0, a1, t);
    }
    d += OUT3D.STEP * (sw - (a1 * (0.5 - stanceS(p1)) - a0 * (0.5 - stanceS(p0))));
  }
  return d;
};
const smooth = (t: number) => {
  const u = clamp01(t);
  return u * u * (3 - 2 * u);
};
const lobe = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t - Math.sin(TAU * t) / TAU);

export type WalkPlan = ((f: number) => { at: V3; yaw: number; walk: number; walkAmt: number }) & { rate: number; yaw: number; dist: number };
/** a straight walk from -> to between frames f0 and f1 with eased start (rampIn frames; 0 = already walking at f0,
 *  he walks in from before f0) and eased stop (rampOut). The phase rate is solved so the distance comes out exactly
 *  and the planted foot never slides. Before f0 (rampIn > 0) he stands at `from`; after f1 at `to`. */
export const walkPlan = (o: { from: V3; to: V3; f0: number; f1: number; rampIn?: number; rampOut?: number; phase0?: number }): WalkPlan => {
  const dx = o.to[0] - o.from[0];
  const dz = o.to[2] - o.from[2];
  const D = Math.hypot(dx, dz);
  const ux = dx / Math.max(1e-9, D);
  const uz = dz / Math.max(1e-9, D);
  const yaw = Math.atan2(dx, dz) / D2R;
  const rin = o.rampIn ?? 8;
  const rout = o.rampOut ?? 10;
  const ph0 = o.phase0 ?? 0;
  const amt = (f: number) => {
    const up = rin > 0 ? smooth((f - o.f0) / rin) : 1;
    const dn = rout > 0 ? smooth((o.f1 - f) / rout) : f <= o.f1 ? 1 : 0;
    if (rin > 0 && f <= o.f0) return 0;
    if (f >= o.f1) return 0;
    return up * dn;
  };
  // exact travel since f0 at a constant phase rate: STEP * (sum of amt at the foot switches) - STEP * [amt (0.5 - s)]
  const travel = (f: number, rate: number) => {
    const ph = (g: number) => ph0 + rate * (g - o.f0);
    const term = (g: number) => amt(g) * (0.5 - stanceS(ph(g)));
    let sum = 0;
    const kA = Math.floor(ph(Math.min(f, o.f0)) / Math.PI);
    const kB = Math.floor(ph(Math.max(f, o.f0)) / Math.PI);
    for (let k = kA + 1; k <= kB; k++) {
      const fk = o.f0 + (k * Math.PI - ph0) / rate;
      sum += amt(fk);
    }
    const sgn = f >= o.f0 ? 1 : -1;
    return OUT3D.STEP * (sgn * sum - (term(f) - term(o.f0)));
  };
  let lo = 0.01;
  let hi = 2.5;
  for (let i = 0; i < 80; i++) {
    const m = (lo + hi) / 2;
    if (travel(o.f1, m) < D) lo = m;
    else hi = m;
  }
  const rate = (lo + hi) / 2;
  const plan = ((f: number) => {
    const g = rin > 0 ? Math.max(o.f0, Math.min(o.f1, f)) : Math.min(o.f1, f);
    const s = travel(g, rate);
    return { at: [o.from[0] + ux * s, o.from[1], o.from[2] + uz * s] as V3, yaw, walk: ph0 + rate * (g - o.f0), walkAmt: amt(f) };
  }) as WalkPlan;
  plan.rate = rate;
  plan.yaw = yaw;
  plan.dist = D;
  return plan;
};

// ---- arm presets (the Worker's ArmPose fields, read in 3D) -------------------------------------------------------
export const ARM3_HANG: Arm3 = { abd: 13, flex: 4, abd2: -10, flex2: 14, droop: 6, thumb: 0 };
export const ARM3_REACH: Arm3 = { abd: 9, flex: 74, abd2: -8, flex2: 16, droop: -6, thumb: 0.15 };
export const ARM3_WHOA: Arm3 = { abd: 36, flex: 30, abd2: 34, flex2: 128, droop: -26, thumb: 0, roll: -40 };
export const ARM3_HUG: Arm3 = { abd: 10, flex: 40, abd2: -64, flex2: 88, droop: 6, thumb: 0.4 };
export const ARM3_TOTE: Arm3 = { abd: 18, flex: 2, abd2: -4, flex2: 8, droop: 2, thumb: 0 };
export const ARM3_TYPE_L: Arm3 = { abd: 14, flex: 24, abd2: -52, flex2: 74, droop: -2, thumb: 0.9 };
export const ARM3_TYPE_R: Arm3 = { abd: 12, flex: 34, abd2: -34, flex2: 62, droop: 18, thumb: 1 };
export const mixArm3 = (a: Arm3, b: Arm3, t: number): Arm3 => ({
  abd: mix(a.abd, b.abd, t),
  flex: mix(a.flex, b.flex, t),
  abd2: mix(a.abd2, b.abd2, t),
  flex2: mix(a.flex2, b.flex2, t),
  droop: mix(a.droop, b.droop, t),
  thumb: mix(a.thumb, b.thumb, t),
  roll: mix(a.roll ?? 0, b.roll ?? 0, t),
});

// ---- geometry helpers --------------------------------------------------------------------------------------------
/** a tapered capsule hanging from the origin along -y: radius r0 at the top joint, r1 at the bottom joint, L apart */
const taperGeo = (r0: number, r1: number, L: number, seg = 36) => {
  const pts: Any[] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (Math.PI / 2) * (i / n);
    pts.push(new THREE.Vector2(Math.max(0, r1 * Math.cos(a)), -L + r1 * Math.sin(a)));
  }
  for (let i = 1; i <= n; i++) {
    const a = (Math.PI / 2) * (i / n);
    pts.push(new THREE.Vector2(Math.max(0, r0 * Math.cos(a)), r0 * Math.sin(a)));
  }
  return new THREE.LatheGeometry(pts, seg);
};
/** the hoodie's body profile (radius, height) in root space, from the hem up to the neck */
const TORSO_PROFILE: [number, number][] = [
  [0.0, 0.372],
  [0.118, 0.372],
  [0.143, 0.378],
  [0.154, 0.397],
  [0.16, 0.44],
  [0.163, 0.52],
  [0.162, 0.6],
  [0.158, 0.68],
  [0.152, 0.735],
  [0.141, 0.776],
  [0.12, 0.81],
  [0.088, 0.836],
  [0.046, 0.853],
  [0.0, 0.858],
];
/** the model's own top (the hood's crown) */
const TOP = OUT3D.NECK_Y + 0.248 + 0.25 * 1.04;
const torsoCurve = () => new THREE.SplineCurve(TORSO_PROFILE.map(([r, y]) => new THREE.Vector2(r, y)));
/** the torso's radius at a height (for things sitting on its surface) */
const torsoR = (() => {
  const c = torsoCurve();
  const pts = c.getPoints(200) as Any[];
  return (y: number) => {
    let best = pts[0];
    for (const p of pts) if (Math.abs(p.y - y) < Math.abs(best.y - y) && p.x > 0.01) best = p;
    return best.x;
  };
})();
const TORSO_Z = 0.8; // the body is a little flatter front to back

/** a soft canvas texture of ribs (vertical stripes), repeated n times along u */
const ribTex = (w: World, n: number) => {
  const t = w.T.draw(128, 8, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 128, 8);
    for (let i = 0; i < 8; i++) {
      const g = c.createLinearGradient(i * 16, 0, i * 16 + 16, 0);
      g.addColorStop(0, "rgb(205,205,205)");
      g.addColorStop(0.5, "rgb(255,255,255)");
      g.addColorStop(1, "rgb(205,205,205)");
      c.fillStyle = g;
      c.fillRect(i * 16, 0, 16, 8);
    }
  });
  t.tex.wrapS = t.tex.wrapT = THREE.RepeatWrapping;
  t.tex.repeat.set(n / 8, 1);
  return t.tex;
};
/** the face's printed blush (and the clay's mottle) on the head sphere: an equirect map, the face toward +z (u 0.25) */
const faceTex = (w: World) =>
  w.T.draw(1024, 512, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 2600; i++) {
      const r = 2 + 9 * hash01(i + 0.5);
      c.fillStyle = `rgba(${hash01(i + 1.1) > 0.5 ? "255,255,255" : "160,150,140"},${(0.02 + 0.035 * hash01(i + 2.2)).toFixed(3)})`;
      c.beginPath();
      c.arc(hash01(i + 3.3) * 1024, hash01(i + 4.4) * 512, r, 0, 6.283);
      c.fill();
    }
    // the cheeks: soft pink discs below and outside the eyes (u 0.25 +- 0.1, v 0.585)
    [0.25 - 0.098, 0.25 + 0.098].forEach((u) => {
      const x = u * 1024;
      const y = 0.585 * 512;
      const g = c.createRadialGradient(x, y, 0, x, y, 34);
      g.addColorStop(0, "rgba(236,150,138,0.62)");
      g.addColorStop(0.55, "rgba(236,150,138,0.32)");
      g.addColorStop(1, "rgba(236,150,138,0)");
      c.fillStyle = g;
      c.beginPath();
      c.ellipse(x, y, 34, 26, 0, 0, 6.283);
      c.fill();
    });
  }).tex;

// ===================================================================================================================
// THE FIGURE
// ===================================================================================================================
export type Outsider3D = ReturnType<typeof makeOutsider3D>;
export const makeOutsider3D = (w: World, opts: { toteCards?: number; parent?: Any } = {}) => {
  const { K, scene } = w;
  const I = OUT3D_INKS;
  const parent = opts.parent ?? scene;
  const root = K.group(parent);
  const mesh = (geo: Any, mat: Any, pos: V3 = [0, 0, 0], par: Any = root, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(...pos);
    m.castShadow = shadow;
    m.receiveShadow = true;
    par.add(m);
    return m;
  };
  const mat = {
    hoodie: K.clay(I.hoodie),
    hoodieDeep: K.clay(I.hoodieDeep),
    rib: new THREE.MeshStandardMaterial({ color: new THREE.Color(I.hoodieRib), roughness: 0.92, map: ribTex(w, 44) }),
    ribCuff: new THREE.MeshStandardMaterial({ color: new THREE.Color(I.hoodieRib), roughness: 0.92, map: ribTex(w, 22) }),
    hoodIn: K.clay(I.hoodIn, { mottle: false }),
    string: K.clay(I.string, { mottle: false }),
    trousers: K.clay(I.trousers),
    shoes: K.clay(I.shoes),
    sole: K.clay(I.sole, { mottle: false }),
    skin: K.clay(I.skin),
    face: new THREE.MeshStandardMaterial({ color: new THREE.Color(I.skin), roughness: 0.86, map: faceTex(w) }),
    nose: K.clay(I.nose, { mottle: false }),
    eye: new THREE.MeshStandardMaterial({ color: new THREE.Color(I.eye), roughness: 0.38 }),
    glint: new THREE.MeshStandardMaterial({ color: new THREE.Color("#FFFFFF"), emissive: new THREE.Color("#FFFFFF"), emissiveIntensity: 0.5, roughness: 0.3 }),
    mouth: K.clay(I.mouth, { mottle: false }),
    key: new THREE.MeshStandardMaterial({ color: new THREE.Color(I.key), roughness: 0.45, metalness: 0.15 }),
    laptop: new THREE.MeshStandardMaterial({ color: new THREE.Color(I.laptop), roughness: 0.5, metalness: 0.1 }),
    laptopEdge: K.clay(I.laptopEdge, { mottle: false }),
    tote: K.clay(I.tote),
    toteHandle: K.clay(I.toteHandle),
  };

  // ---- pelvis, spine, chest ------------------------------------------------------------------------------------
  const pelvis = K.group(root, [0, OUT3D.HIP_Y, 0]);
  // the trousers' seat (mostly under the hoodie's hem)
  const seat = mesh(new THREE.SphereGeometry(0.135, 40, 24), mat.trousers, [0, 0.0, -0.004], pelvis);
  seat.scale.set(1.08, 0.62, 0.84);
  const spine = K.group(pelvis);
  const torsoG = K.group(spine, [0, -OUT3D.HIP_Y, 0]);
  torsoG.scale.set(1, 1, TORSO_Z);
  const tpts = torsoCurve().getPoints(48);
  mesh(new THREE.LatheGeometry(tpts, 64), mat.hoodie, [0, 0, 0], torsoG);
  // the ribbed hem
  const hem = mesh(new THREE.TorusGeometry(0.151, 0.021, 14, 72), mat.rib, [0, 0.394, 0], torsoG);
  hem.rotation.x = Math.PI / 2;
  // the kangaroo pocket: a patch of the body's own surface, lifted, darker; the hand openings as soft rolls
  const pocketPts = torsoCurve()
    .getPoints(160)
    .filter((p: Any) => p.y > 0.452 && p.y < 0.595)
    .map((p: Any) => new THREE.Vector2(p.x + 0.009, p.y));
  const pocket = mesh(new THREE.LatheGeometry(pocketPts, 28, -0.7, 1.4), mat.hoodieDeep, [0, 0, 0], torsoG);
  pocket.material = mat.hoodieDeep.clone();
  pocket.material.side = THREE.DoubleSide;
  const onBody = (phi: number, y: number, out = 0.012): V3 => {
    const r = torsoR(y) + out;
    return [r * Math.sin(phi), y, r * Math.cos(phi)];
  };
  [-1, 1].forEach((sd) => {
    const a = onBody(sd * 0.7, 0.455, 0.014);
    const b = onBody(sd * 0.5, 0.592, 0.014);
    const r = K.rod(a, b, 0.008, mat.hoodieDeep, torsoG);
    r.castShadow = false;
  });
  const chest = K.group(spine, [0, OUT3D.SH_Y - OUT3D.HIP_Y, 0]);
  // the drawstrings (from under the hood rim, down the chest), cream, with small aglets
  [-1, 1].forEach((sd) => {
    const top: V3 = [sd * 0.036, 0.875 - OUT3D.SH_Y, 0.15];
    const yb = 0.71;
    const bot: V3 = [sd * 0.046, yb - OUT3D.SH_Y, torsoR(yb) * TORSO_Z + 0.014];
    const r = K.rod(top, bot, 0.0075, mat.string, chest);
    r.castShadow = false;
    mesh(new THREE.CapsuleGeometry(0.0095, 0.018, 4, 10), mat.string, [bot[0], bot[1] - 0.012, bot[2] + 0.001], chest, false);
  });

  // the hood's cowl: the hood's lower edge settling round the neck onto the shoulders
  const cowl = mesh(new THREE.TorusGeometry(0.1, 0.05, 20, 64), mat.hoodie, [0, OUT3D.NECK_Y - OUT3D.SH_Y + 0.004, -0.018], chest);
  cowl.rotation.x = Math.PI / 2;
  cowl.scale.set(1.12, 0.9, 0.72);

  // ---- neck, head, hood, face --------------------------------------------------------------------------------
  const neck = K.group(chest, [0, OUT3D.NECK_Y - OUT3D.SH_Y, 0]);
  const head = K.group(neck);
  const HC: V3 = [0, 0.232, 0.02];
  const HR = 0.2;
  const face = mesh(new THREE.SphereGeometry(HR, 72, 48), mat.face, HC, head);
  face.scale.set(1.04, 1, 1);
  // the hood: an outer shell open toward +z, a darker inner shell, a thick soft rim round the face opening
  const OPEN = 50 * D2R;
  const HO = 0.25;
  const hoodPos: V3 = [0, 0.248, -0.016];
  const hoodScale: V3 = [1.0, 1.04, 1.07];
  const shellGeo = (r: number) => {
    const g = new THREE.SphereGeometry(r, 72, 48, 0, TAU, OPEN, Math.PI - OPEN);
    g.rotateX(Math.PI / 2);
    return g;
  };
  const hoodOut = mesh(shellGeo(HO), mat.hoodie, hoodPos, head);
  hoodOut.scale.set(...hoodScale);
  const inMat = mat.hoodIn.clone();
  inMat.side = THREE.BackSide;
  const hoodIn = mesh(shellGeo(HO - 0.014), inMat, hoodPos, head, false);
  hoodIn.scale.set(...hoodScale);
  const rimR = (HO - 0.007) * Math.sin(OPEN);
  const rim = mesh(new THREE.TorusGeometry(rimR, 0.031, 20, 96), mat.hoodie, [hoodPos[0], hoodPos[1], hoodPos[2] + (HO - 0.007) * Math.cos(OPEN) * hoodScale[2]], head);
  rim.scale.set(1, hoodScale[1], 1);
  // the face: two dark dot eyes (a tiny glint each; they blink), a tiny nose bump, a small smile / an "o" (whoa)
  const onFace = (x: number, y: number, sink = 0): V3 => {
    const z = Math.sqrt(Math.max(0, HR * HR - (x / 1.04) ** 2 - y * y));
    return [HC[0] + x, HC[1] + y, HC[2] + z - sink];
  };
  const eyes = [-1, 1].map((sd) => {
    const g = K.group(head, onFace(sd * 0.07, -0.002, 0.004));
    g.rotation.y = Math.asin(0.07 / HR) * sd;
    const e = mesh(new THREE.SphereGeometry(0.021, 24, 16), mat.eye, [0, 0, 0], g, false);
    e.scale.set(1, 1.28, 0.5);
    mesh(new THREE.SphereGeometry(0.0055, 10, 8), mat.glint, [-0.0055 * sd - 0.002, 0.0095, 0.0075], g, false);
    return g;
  });
  const nose = mesh(new THREE.SphereGeometry(0.023, 20, 14), mat.nose, onFace(0, -0.046, 0.011), head, false);
  nose.scale.set(1.12, 0.88, 0.85);
  const mouthG = K.group(head, onFace(0, -0.092, 0.002));
  mouthG.rotation.x = Math.asin(0.092 / HR);
  const smile = mesh(new THREE.TorusGeometry(0.019, 0.0048, 8, 24, Math.PI), mat.mouth, [0, 0.006, 0], mouthG, false);
  smile.rotation.z = Math.PI;
  const mouthO = mesh(new THREE.SphereGeometry(0.014, 16, 12), mat.mouth, [0, -0.002, 0], mouthG, false);
  mouthO.scale.set(1, 1.25, 0.35);

  // ---- arms ---------------------------------------------------------------------------------------------------
  const upperGeo = taperGeo(0.054, 0.046, OUT3D.UPPER);
  const foreGeo = taperGeo(0.046, 0.041, OUT3D.FORE - 0.012);
  const mkArm = (sd: number) => {
    // sd: -1 = his right (screen left when he faces us), +1 = his left
    const sh = K.group(chest, [sd * OUT3D.SH_X, 0, -0.005]);
    sh.rotation.order = "XZY";
    mesh(upperGeo, mat.hoodie, [0, 0, 0], sh);
    const el = K.group(sh, [0, -OUT3D.UPPER, 0]);
    mesh(foreGeo, mat.hoodie, [0, 0, 0], el);
    const cuff = mesh(new THREE.TorusGeometry(0.039, 0.016, 12, 40), mat.ribCuff, [0, -OUT3D.FORE + 0.018, 0], el);
    cuff.rotation.x = Math.PI / 2;
    const wr = K.group(el, [0, -OUT3D.FORE, 0]);
    wr.rotation.order = "YXZ";
    // the mitten: palm toward the body (x), thumb forward-inward
    const hand = mesh(new THREE.SphereGeometry(0.052, 28, 20), mat.skin, [0, -0.05, 0.0], wr);
    hand.scale.set(0.78, 1.12, 0.98);
    const th = mesh(new THREE.SphereGeometry(0.021, 16, 12), mat.skin, [-sd * 0.02, -0.03, 0.036], wr);
    th.scale.set(0.9, 1.35, 0.9);
    th.rotation.x = -0.4;
    return { sh, el, wr };
  };
  const armR = mkArm(-1);
  const armL = mkArm(1);
  // the key (right hand): bow in the fist, the shaft out past the mitten's tip
  const key = K.group(armR.wr, [0.006, -0.08, 0.02]);
  const bow = mesh(new THREE.TorusGeometry(0.022, 0.0075, 10, 28), mat.key, [0, 0.0, 0], key);
  bow.rotation.y = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.075, 12), mat.key, [0, -0.058, 0], key);
  mesh(new THREE.BoxGeometry(0.004, 0.018, 0.016), mat.key, [0, -0.083, 0.009], key);
  mesh(new THREE.BoxGeometry(0.004, 0.012, 0.012), mat.key, [0, -0.066, 0.008], key);

  // ---- legs and trainers -------------------------------------------------------------------------------------
  const thighGeo = taperGeo(0.07, 0.058, OUT3D.THIGH);
  const shinGeo = taperGeo(0.058, 0.048, OUT3D.SHIN);
  const soleGeo = (() => {
    // a stadium in plan (x across, z along: toe at +z), extruded up 0.018 with a 0.009 bevel (0.036 thick)
    const hw = 0.064 - 0.009;
    const z0 = -0.082 + 0.009;
    const z1 = 0.17 - 0.009;
    const sh = new THREE.Shape();
    sh.moveTo(-hw, -(z0 + hw));
    sh.lineTo(-hw, -(z1 - hw));
    sh.absarc(0, -(z1 - hw), hw, Math.PI, 2 * Math.PI, false);
    sh.lineTo(hw, -(z0 + hw));
    sh.absarc(0, -(z0 + hw), hw, 0, Math.PI, false);
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.018, bevelEnabled: true, bevelThickness: 0.009, bevelSize: 0.009, bevelSegments: 4, curveSegments: 24 });
    g.rotateX(-Math.PI / 2);
    return g;
  })();
  const upperGeo2 = (() => {
    const g = new THREE.CapsuleGeometry(0.057, 0.118, 10, 28);
    g.rotateX(Math.PI / 2);
    return g;
  })();
  const mkLeg = (sd: number) => {
    const hip = K.group(root);
    mesh(thighGeo, mat.trousers, [0, 0, 0], hip);
    const knee = K.group(hip, [0, -OUT3D.THIGH, 0]);
    mesh(shinGeo, mat.trousers, [0, 0, 0], knee);
    const ankle = K.group(root);
    ankle.rotation.order = "YXZ";
    // the sole band: a stadium-shaped slab (round toe and heel), bevelled; the upper: a soft capsule sitting in it
    mesh(soleGeo, mat.sole, [0, -OUT3D.ANKLE_Y + 0.009, 0], ankle);
    const up = mesh(upperGeo2, mat.shoes, [0, -OUT3D.ANKLE_Y + 0.058, 0.044], ankle);
    up.scale.set(1.0, 0.7, 1.0);
    const col = mesh(new THREE.TorusGeometry(0.043, 0.013, 10, 32), mat.shoes, [0, -OUT3D.ANKLE_Y + 0.096, -0.016], ankle);
    col.rotation.x = Math.PI / 2 + 0.25;
    // laces: three soft cream bars across the instep
    [0.03, 0.058, 0.086].forEach((z, i) => {
      const l = mesh(new THREE.CapsuleGeometry(0.0055, 0.04 - i * 0.006, 4, 8), mat.string, [0, -OUT3D.ANKLE_Y + 0.101 - i * 0.006, z], ankle, false);
      l.rotation.z = Math.PI / 2;
    });
    // the foot's contact blob
    const blob = K.blob(0, 0, 0.17, 0.32, 0.34, 0.004, root);
    return { sd, hip, knee, ankle, blob };
  };
  const legR = mkLeg(-1);
  const legL = mkLeg(1);
  const bodyBlob = K.blob(0.02, 0.0, 0.62, 0.48, 0.3, 0.003, root);

  // ---- props: laptop (on the spine), tote (left hand) ------------------------------------------------------------
  const lap = K.group(spine);
  K.box([0.3, 0.018, 0.21], mat.laptop, [0, 0, 0], { r: 0.008, parent: lap, seg: 3 });
  const keysTex = w.T.draw(300, 210, (c) => {
    c.fillStyle = "#8F9296";
    c.fillRect(0, 0, 300, 210);
    c.fillStyle = "#6E7175";
    for (let r = 0; r < 4; r++) for (let k = 0; k < 11; k++) c.fillRect(18 + k * 24.5, 18 + r * 24, 20, 19);
    c.fillRect(70, 118, 160, 19);
    c.fillStyle = "#A3A6AA";
    c.fillRect(105, 150, 90, 48);
  });
  K.print(keysTex, 0.28, [0, 0.0095, 0], [-90, 0, 0], { parent: lap, h: 0.196 });
  const lidHinge = K.group(lap, [0, 0.009, 0.105]);
  K.box([0.3, 0.012, 0.21], mat.laptop, [0, 0.006, -0.105], { r: 0.006, parent: lidHinge, seg: 3 });
  const screenTex = w.T.draw(300, 210, (c) => {
    c.fillStyle = I.laptopScreen;
    c.fillRect(0, 0, 300, 210);
    c.fillStyle = "rgba(245,241,232,0.55)";
    const rows: [number, number][] = [
      [0, 120],
      [16, 80],
      [16, 150],
      [32, 60],
      [16, 110],
      [0, 90],
      [16, 140],
      [32, 70],
    ];
    rows.forEach(([x, w2], i) => c.fillRect(22 + x, 22 + i * 21, w2, 9));
  });
  K.print(screenTex, 0.27, [0, -0.0005, -0.105], [90, 0, 0], { parent: lidHinge, h: 0.18 });
  // a thin dark edge line along the closed laptop (the gap between lid and base) is the base's own rounded edge
  const tote = K.group(armL.wr, [0, -0.05, 0]);
  const toteBag = K.group(tote);
  K.box([0.21, 0.2, 0.075], mat.tote, [0, -0.2, 0], { r: 0.025, parent: toteBag });
  [-1, 1].forEach((sd) => {
    const hd = mesh(new THREE.TorusGeometry(0.06, 0.009, 8, 28, Math.PI), mat.toteHandle, [sd * 0.008, -0.1, 0], toteBag);
    hd.rotation.y = sd * 0.25;
    hd.scale.set(0.9, 1.6, 1);
  });
  const toteCardsG = [-0.05, 0.02, 0.06, -0.01].map((x, i) => {
    const g = K.group(toteBag, [x, -0.1 + 0.01 * (i % 2), (i % 2 ? 1 : -1) * 0.01]);
    g.rotation.set((hash01(i + 3) - 0.5) * 0.3, (hash01(i + 5) - 0.5) * 0.6, (i - 1.5) * 0.25);
    K.box([0.085, 0.11, 0.01], K.orange(0.45), [0, -0.01, 0], { r: 0.004, parent: g, seg: 2 });
    return g;
  });

  // ---- per-frame update ----------------------------------------------------------------------------------------
  const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const eul = new THREE.Euler();
  const HEEL = v3(0, -OUT3D.ANKLE_Y, -0.074);
  const BALL = v3(0, -OUT3D.ANKLE_Y, 0.112);
  /** the ankle offset when the foot (toe-out yaw `toe`) is pitched by theta (deg, toe up +) about pivot P */
  const pivOff = (P: Any, theta: number, toe: number) => {
    const Pr = P.clone().applyEuler(eul.set(0, toe, 0, "YXZ"));
    const R = P.clone().applyEuler(eul.set(-theta * D2R, toe, 0, "YXZ"));
    return Pr.sub(R);
  };
  const HS = 17;
  const TO = 34;
  /** the foot (ankle position in root space + pitch) of one side at walk phase phi, amount a */
  const footAt = (sd: number, phi: number, a: number, shuffle: number) => {
    const p = modp(phi + (sd > 0 ? 0 : Math.PI), TAU);
    const toe = sd * 7 * D2R;
    const x = sd * OUT3D.FOOT_X;
    let z: number;
    let lift = 0;
    let off: Any;
    let pitch: number;
    if (p < Math.PI) {
      const s = p / Math.PI;
      z = a * OUT3D.STEP * (0.5 - s);
      if (s < 0.2) {
        pitch = HS * a * (1 - smooth(s / 0.2));
        off = pivOff(HEEL, pitch, toe);
      } else if (s < 0.56) {
        pitch = 0;
        off = v3();
      } else {
        pitch = -TO * a * smooth((s - 0.56) / 0.44);
        off = pivOff(BALL, pitch, toe);
      }
    } else {
      const u = (p - Math.PI) / Math.PI;
      z = a * OUT3D.STEP * (-0.5 + lobe(u));
      lift = OUT3D.LIFT * Math.min(1, a * 1.25) * Math.pow(Math.sin(Math.PI * u), 1.3) + 0.032 * shuffle * Math.sin(Math.PI * u);
      pitch = mix(-TO * a, HS * a, smooth(u * 1.15));
      const wgt = smooth(u);
      off = pivOff(BALL, pitch, toe).multiplyScalar(1 - wgt).add(pivOff(HEEL, pitch, toe).multiplyScalar(wgt));
    }
    const pos = v3(x, OUT3D.ANKLE_Y + lift, z).add(off);
    return { pos, pitch, toe, lift };
  };
  const L1 = OUT3D.THIGH;
  const L2 = OUT3D.SHIN;
  const basisQuat = (yAxis: Any, fwd: Any) => {
    const y = yAxis.clone().normalize();
    const zz = fwd.clone().sub(y.clone().multiplyScalar(fwd.dot(y)));
    if (zz.lengthSq() < 1e-8) zz.set(0, 0, 1);
    zz.normalize();
    const x = new THREE.Vector3().crossVectors(y, zz).normalize();
    const m = new THREE.Matrix4().makeBasis(x, y, zz);
    return new THREE.Quaternion().setFromRotationMatrix(m);
  };
  /** two-bone IK: thigh from H toward the knee, shin to A; the knee points along kneeDir */
  const solveLeg = (leg: typeof legR, H: Any, A: Any, kneeDir: Any) => {
    const dvec = A.clone().sub(H);
    const d = Math.min(L1 + L2 - 0.0008, Math.max(Math.abs(L1 - L2) + 0.01, dvec.length()));
    const u = dvec.clone().normalize();
    const cosA = (L1 * L1 + d * d - L2 * L2) / (2 * L1 * d);
    const a1 = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const vperp = kneeDir.clone().sub(u.clone().multiplyScalar(kneeDir.dot(u)));
    if (vperp.lengthSq() < 1e-8) vperp.set(0, 0, 1);
    vperp.normalize();
    const K1 = H.clone().add(u.clone().multiplyScalar(L1 * Math.cos(a1)).add(vperp.clone().multiplyScalar(L1 * Math.sin(a1))));
    const qT = basisQuat(H.clone().sub(K1), kneeDir);
    const A2 = H.clone().add(u.clone().multiplyScalar(d));
    const qS = basisQuat(K1.clone().sub(A2), kneeDir);
    leg.hip.position.copy(H);
    leg.hip.quaternion.copy(qT);
    leg.knee.quaternion.copy(qT.clone().invert().multiply(qS));
  };
  const setArm = (arm: typeof armR, sd: number, a: Arm3) => {
    // abd: out to the side (his right is -x); flex forward; abd2 twist (- = forearm inward); flex2 elbow; thumb = roll
    arm.sh.rotation.set(-a.flex * D2R, sd * a.abd2 * D2R, sd * a.abd * D2R);
    arm.el.rotation.set(-a.flex2 * D2R, 0, 0);
    arm.wr.rotation.set(a.droop * D2R, sd * (a.thumb * 80 + (a.roll ?? 0)) * D2R, 0);
  };
  const blinkAt = (f: number) => {
    // a blink every ~3-4 s (jittered), 5 frames
    const k = Math.floor(f / 84);
    let v = 0;
    for (let j = k - 1; j <= k + 1; j++) {
      const c = j * 84 + 20 + 40 * hash01(j * 7.7 + 1.3);
      v = Math.max(v, 1 - Math.abs(f - c) / 2.6);
    }
    return smooth(v);
  };
  const toteQ = new THREE.Quaternion();
  const wq = new THREE.Quaternion();
  const st = { toteCards: opts.toteCards ?? 0 };

  const update = (p: OutsiderPose3D, at: V3, heightM = OUT3D.H) => {
    const f = p.frame ?? 0;
    const t = f / (24000 / 1001);
    const a = clamp01(p.walkAmt ?? 0);
    const phi = p.walk ?? 0;
    const fum = clamp01(p.fumble ?? 0);
    const reach = clamp01(p.reach ?? 0);
    const whoa = clamp01(p.whoa ?? 0);
    const typing = clamp01(p.typing ?? 0);
    const shuffle = clamp01(p.shuffle ?? 0);
    const carry = p.carry ?? "none";
    const idle = 1 - a;
    const breath = 0.5 + 0.5 * Math.sin((t / 4.2) * TAU - Math.PI / 2);
    const shift = 0.014 * Math.sin((t / 5.6) * TAU + 0.4) * idle;
    const jig = (k: number) => fum * Math.sin(t * TAU * 1.7 + k);

    root.position.set(...at);
    root.rotation.set(0, (p.yaw ?? 0) * D2R, 0);
    root.scale.setScalar(heightM / TOP);

    // -- feet first (they do not depend on the pelvis)
    const fR = footAt(-1, phi, a, shuffle);
    const fL = footAt(1, phi, a, shuffle);
    // -- the pelvis: bob (low at double support), sway over the stance foot, roll, twist; idle weight shift; fumble dip
    const bob = a * 0.02 * (0.5 + 0.5 * Math.cos(2 * phi));
    let py = OUT3D.HIP_Y - bob - 0.004 * idle - 0.012 * fum * (0.5 + 0.5 * Math.sin(t * 6.1)) - 0.006 * whoa;
    const px = a * 0.016 * Math.sin(phi) + shift;
    pelvis.rotation.set(0, -6 * a * Math.cos(phi) * D2R, (-2.6 * a * Math.sin(phi) - (shift / 0.014) * 1.6) * D2R);
    const hipJ = (sd: number, y: number) => {
      pelvis.position.set(px, y, 0);
      pelvis.updateMatrix();
      return v3(sd * OUT3D.HIP_X, 0, 0).applyMatrix4(pelvis.matrix);
    };
    // never over-stretch a leg: lower the pelvis if a foot is out of reach
    for (let it = 0; it < 2; it++) {
      let drop = 0;
      [
        [-1, fR],
        [1, fL],
      ].forEach(([sd, ft]) => {
        const H = hipJ(sd as number, py);
        const A = (ft as typeof fR).pos;
        const h = Math.hypot(H.x - A.x, H.z - A.z);
        const maxY = A.y + Math.sqrt(Math.max(0, (0.996 * (L1 + L2)) ** 2 - h * h));
        drop = Math.max(drop, H.y - maxY);
      });
      py -= drop;
    }
    pelvis.position.set(px, py, 0);
    pelvis.updateMatrix();
    // -- spine: walking lean, reach lean, whoa lean back; chest: counter-twist, breath
    spine.rotation.set((4.5 * a + 5 * reach - 7 * whoa + 2 * fum * Math.sin(t * 5)) * D2R, 0, 0);
    chest.rotation.set(0, 9 * a * Math.cos(phi) * D2R, (1.2 * a * Math.sin(phi) + (shift / 0.014) * 1.0) * D2R);
    chest.position.y = OUT3D.SH_Y - OUT3D.HIP_Y + 0.004 * breath;
    torsoG.scale.set(1 + 0.008 * breath, 1, TORSO_Z * (1 + 0.022 * breath));
    // -- head
    const hp = (p.headPitch ?? 2) + fum * 4 * Math.sin(t * 9) - 6 * whoa + 4 * reach - 2.5 * a * Math.cos(2 * phi);
    const hy = (p.headYaw ?? 0) + 1.6 * idle * Math.sin((t / 3.9) * TAU) - 9 * a * Math.cos(phi) * 0.4;
    const hr = (p.headRoll ?? 0) + fum * 3 * Math.sin(t * 7.3) + 1.2 * idle * Math.sin((t / 4.7) * TAU + 1) + 2 * a * Math.sin(phi);
    neck.rotation.set(hp * 0.35 * D2R, hy * 0.35 * D2R, 0);
    head.rotation.set(hp * 0.65 * D2R, hy * 0.65 * D2R, -hr * D2R, "YXZ");
    // the hood is up (hood "down" is not modelled in 3D; the cuts all use "up")
    const bl = blinkAt(f + 13 * hash01(at[0] * 3.1 + at[2]));
    eyes.forEach((e) => e.scale.set(1, 1 - 0.9 * bl, 1));
    smile.scale.setScalar(1 - 0.85 * whoa);
    smile.visible = whoa < 0.9;
    mouthO.scale.set(whoa, 1.25 * whoa, 0.35);
    mouthO.visible = whoa > 0.06;
    // -- arms
    const swing = 21 * a;
    let aR: Arm3 = { ...ARM3_HANG, flex: ARM3_HANG.flex + swing * Math.cos(phi), flex2: ARM3_HANG.flex2 + 12 * a * Math.max(0, Math.cos(phi)) };
    let aL: Arm3 = { ...ARM3_HANG, flex: ARM3_HANG.flex - swing * Math.cos(phi), flex2: ARM3_HANG.flex2 + 12 * a * Math.max(0, -Math.cos(phi)) };
    // breathing lifts the arms a touch; idle: the hands drift a little
    aR.abd += 1.2 * breath;
    aL.abd += 1.2 * breath;
    if (carry === "tote") aL = { ...ARM3_TOTE, flex: ARM3_TOTE.flex - 7 * a * Math.cos(phi) };
    if (carry === "laptop") {
      const ty = smooth(typing);
      const tap = typing * Math.sin(t * TAU * 3.4);
      const tap2 = typing * Math.sin(t * TAU * 3.4 + 2.1);
      aR = mixArm3(ARM3_HUG, ARM3_TYPE_R, ty);
      aL = mixArm3(ARM3_HUG, ARM3_TYPE_L, ty);
      aR.flex2 += 5 * Math.max(0, tap);
      aR.droop += 9 * Math.max(0, tap);
      aL.droop += 4 * Math.max(0, tap2) * 0.4;
    }
    aR = mixArm3(aR, ARM3_REACH, smooth(reach));
    aR = mixArm3(aR, ARM3_WHOA, whoa);
    aL = mixArm3(aL, ARM3_WHOA, whoa);
    if (p.armR) aR = { ...p.armR };
    if (p.armL) aL = { ...p.armL };
    aR = { ...aR, flex: aR.flex + 7 * jig(0), abd: aR.abd + 3 * jig(2.3) };
    aL = { ...aL, flex: aL.flex + 7 * jig(1.7), abd: aL.abd + 3 * jig(0.6) };
    // the key turn: the right forearm rolls (the key turns about its shaft)
    const kt = p.keyTurn;
    key.visible = kt !== undefined;
    if (kt !== undefined) aR = { ...aR, roll: (aR.roll ?? 0) - 90 * smooth(kt) };
    setArm(armR, -1, aR);
    setArm(armL, 1, aL);
    // -- legs (IK) and feet
    [
      [legR, fR],
      [legL, fL],
    ].forEach(([lg, ft]) => {
      const leg = lg as typeof legR;
      const fo = ft as typeof fR;
      const H = hipJ(leg.sd, py);
      const kneeDir = v3(Math.sin(fo.toe) * 0.6, 0, Math.cos(fo.toe)).normalize();
      solveLeg(leg, H, fo.pos, kneeDir);
      leg.ankle.position.copy(fo.pos);
      leg.ankle.rotation.set(-fo.pitch * D2R, fo.toe, 0, "YXZ");
      leg.blob.position.set(fo.pos.x, 0.004, fo.pos.z + 0.05);
      leg.blob.rotation.set(-Math.PI / 2, 0, -fo.toe);
      leg.blob.material.opacity = 0.34 * clamp01(1 - (fo.pos.y - OUT3D.ANKLE_Y) / 0.09);
    });
    pelvis.position.set(px, py, 0);
    bodyBlob.position.set(px * 0.6 + 0.02, 0.003, 0.0);
    // -- props
    const lapOn = carry === "laptop";
    lap.visible = lapOn;
    if (lapOn) {
      const ty = smooth(typing);
      // hugged closed upright against the chest (0) -> held flat, open, in front of the belly (1)
      lap.position.set(0.0, mix(0.285, 0.175, ty), mix(0.146, 0.262, ty));
      lap.rotation.set(mix(80, 4, ty) * D2R, 0, 0);
      lidHinge.rotation.x = 106 * smooth((typing - 0.25) / 0.75) * D2R;
    }
    tote.visible = carry === "tote";
    const nCards = Math.round(p.toteCards ?? st.toteCards);
    toteCardsG.forEach((g, i) => (g.visible = i < nCards));
    root.updateMatrixWorld(true);
    if (carry === "tote") {
      // the bag hangs upright from the hand (a little pendulum lag in the walk)
      armL.wr.getWorldQuaternion(wq);
      root.getWorldQuaternion(toteQ);
      const sw = new THREE.Quaternion().setFromEuler(new THREE.Euler((7 * a * Math.sin(phi - 0.9) + 3 * jig(1)) * D2R, 0, 2 * a * Math.sin(phi) * D2R));
      tote.quaternion.copy(wq.invert().multiply(toteQ).multiply(sw));
      tote.updateMatrixWorld(true);
    }
  };
  const world = (o: Any, local: V3 = [0, 0, 0]): V3 => {
    const v = new THREE.Vector3(...local);
    o.localToWorld(v);
    return [v.x, v.y, v.z];
  };
  return {
    group: root,
    update,
    rig: { root, pelvis, spine, chest, neck, head, armR, armL, legR, legL, lap, lidHinge, tote, key },
    /** the mitten's centre (world) */
    hand: (side: "R" | "L") => world((side === "R" ? armR : armL).wr, [0, -0.05, 0]),
    /** the key's bit (world) */
    keyTip: () => world(key, [0, -0.085, 0]),
    /** the face's centre (world) */
    head: () => world(head, HC),
  };
};
