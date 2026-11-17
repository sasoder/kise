// ---------------------------------------------------------------------------------------------------------------------
// LeakedSecrets (paul-twelve-hours, cut 2), rev 3 (the user's rev-1 notes: real vaults, a finished 3D outsider). Look C
// "Graphite air" on the shared world (paulWorld / paulWorldSets / paulOutsider3d). Opaque 1080x1920, 23.976 fps.
//
// CHECK LINE: "even amateurs walked out with most of the labs' algorithmic secrets."
//
// THE LINE: "...have had extremely unsophisticated actors who appeared to have enough access to essentially extract the
// vast majority of algorithmic developments."
// WORD -> FRAME (Whisper; true onsets ~5-9 f later): have -6 · had 1 · extremely 5 · unsophisticated 16 · actors 33 ·
// who 40 · appeared 50 · to 56 · have 60 · enough 61 · access 65 · to 73 · essentially 80 · extract 89 · the 100 ·
// vast 108 · majority 110 · of 117 · algorithmic 123 · developments 134 · (Like 154)
// DURATION: the slot 2.753 -> 9.343 s = 6.590 s x 23.976 = 158 frames (f0..f157).
//
// THE MOTION: see MOTION below (kept next to the numbers it describes).
// Orange = the American labs' algorithmic secrets (the cards). Dashed = not real (the stack that is no longer there).
//
// SOURCES: none (no figures on screen). Logos: the world's OpenAI / Anthropic marks on the vaults.
// ---------------------------------------------------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { OUT3D, makeOutsider3D, walkPlan, type OutsiderPose3D } from "./paulOutsider3d";
import { C, PaulStage, THREE, camTrack, clamp01, ease01, hash01, living, mix, orbitCam, type Any, type V3, type World, type WorldSpec } from "./paulWorld";
import { VAULT, makeVault, secretCard, yawTo } from "./paulWorldSets";

export const FPS = 24000 / 1001;
export const DURATION = 158;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const D2R = Math.PI / 180;

// MOTION
// f0     close on the OpenAI vault's round door, the camera already easing back (and orbiting a little right); a faint
//        warm glow breathes in the seam round the closed door (the secrets inside; Anthropic's too, off-phase) and fades
//        as each door opens. The wheel stays still until "access".
// f24-60 on "unsophisticated actors" the outsider, the world's black artist's mannequin (faceless, matte near-black),
//        walks in from the right, near profile, a toe-catch at f40-47 (the head dips to his feet, the hands lift a
//        little and settle), an eased stop between the vaults behind the open box (walkPlan with his look and height,
//        feet planted, f60), then a shuffling turn to face us (f56-74).
// f64-78 on "access" the OpenAI wheel spins a turn and a half; the bolts retract (f76-86); the door swings open away
//        from him (f84-104) on the glowing stack. He starts back a little (f83-91). Anthropic does the same 2 f early.
// f94    on "extract" the top card slides off the stack, along the shelf and over the sill, and hops in a low arc into
//        the box (first lands f119); one every 3.6 f from each vault (Anthropic half a beat behind), two ribbons
//        converging on the box, each card lower than the one behind it
//        while the camera pulls back and pans right onto a longer lens (26 -> 16 deg, f70-120) so both open doors sit
//        inside x 65-1015 in the wide with him ~287 px tall; the haze moves back with the camera to keep its depth;
//        the Anthropic vault is whole in frame by ~f111. His hands half rise
//        (f104-118) and he looks down into the box as it fills.
// f134+  by "developments" both stacks are down to three with dashed outlines of the full stacks; a last card from
//        each vault trickles in (lands f148 / f150), stacks at two; a slow creep back to f157.
// CAUSE -> EFFECT: wheel -> bolts -> door -> first card; a card leaves only after the card above it; each card lands on
// the heap of those before it.

// ---- layout -------------------------------------------------------------------------------------------------------
const X_O = -1.25;
const X_A = 1.25;
const BOX = { x: 0, z: 2.1, L: 1.0, D: 0.56, H: 0.24, t: 0.02 };
const BOX_FLOOR = 0.02;
const OUT_H = 1.45;
const SPOT: V3 = [0.0, 0, 0.82];

// ---- the vault beats ----------------------------------------------------------------------------------------------
const doorAt = (f: number, lead: number) => ({
  wheel: 1.5 * 2 * Math.PI * ease01(64 - lead, 78 - lead, f),
  bolts: ease01(76 - lead, 86 - lead, f),
  open: ease01(84 - lead, 104 - lead, f),
});

// ---- the outsider -------------------------------------------------------------------------------------------------
const WALK = walkPlan({ from: [1.3, 0, 0.78], to: SPOT, f0: 24, f1: 60, rampIn: 0, rampOut: 14, look: "mannequin", heightM: OUT_H });
/** the black mannequin: clumsy in a quiet way. Small, deliberate gestures (no flailing): a toe-catch at f43 (the head
 *  dips to the feet, the hands lift a little and settle), a held stop, a shuffling turn to face us, a small start
 *  back as the first wheel bites (f87), and on the flood a guarded half-raise of the hands while he looks down into
 *  the box. The fumble jiggle is kept tiny: it reads as a hitch, not a wobble. */
const poseAt = (f: number, camYaw: number): OutsiderPose3D => {
  const w = WALK(f);
  const stumble = Math.exp(-Math.pow((f - 43) / 3.2, 2));
  const catchUp = Math.exp(-Math.pow((f - 47) / 3, 2)); // the head comes back up after the catch
  const turn = ease01(56, 74, f);
  const startle = Math.exp(-Math.pow((f - 87) / 4, 2));
  const whoa = ease01(104, 118, f);
  const look = ease01(100, 120, f);
  return {
    carry: "none",
    frame: f,
    yaw: mix(w.yaw, camYaw - 6, turn),
    walk: w.walk + OUT3D.RATE * Math.max(0, f - 60),
    walkAmt: w.walkAmt,
    shuffle: 0.7 * Math.sin(Math.PI * clamp01((f - 56) / 18)),
    fumble: 0.3 * stumble,
    whoa: Math.min(1, 0.32 * stumble + 0.3 * startle + 0.5 * whoa),
    headPitch: 2 + 14 * stumble - 3 * catchUp - 6 * startle + 12 * look,
    headYaw: 7 * Math.sin(Math.PI * clamp01((f - 96) / 30)) * (1 - look * 0.5),
    headRoll: 4 * stumble,
  };
};

// ---- the cards ----------------------------------------------------------------------------------------------------
const CS = VAULT.CARD; // 0.44 x 0.04 x 0.34
const NSTACK = 10;
const NLEAVE = 8; // the 8th is a late trickle
const V = 0.13; // m / f once moving (spacing 0.47 m: a card is 0.44 long, so a ribbon never overlaps itself)
const TA = 3;
const INT = 3.6;
const slotPos = (x: number, i: number): V3 => [x + 0.012 * Math.sin(i * 2.1), VAULT.SHELF_TOP + CS[1] / 2 + 0.001 + i * VAULT.PITCH, 0];
const slotYaw = (x: number, i: number) => (hash01(i + x * 7) - 0.5) * 7 * D2R;
const sOf = (t: number) => (t <= 0 ? 0 : t < TA ? (0.5 * V * t * t) / TA : V * (t - TA / 2));
const tOf = (s: number) => (s <= (V * TA) / 2 ? Math.sqrt((2 * s * TA) / V) : s / V + TA / 2);

/** where the j-th card to arrive (0..15, alternating OpenAI / Anthropic) rests: two neat columns side by side in the
 *  box (OpenAI left, Anthropic right, half a card's thickness apart in height), each card 0.047 above the last of its
 *  column, small yaw jitter only (no tilt, so no card ever cuts into its neighbour); the heap tops the rim by ~0.1 m */
const restOf = (j: number) => {
  const side = j % 2 === 0 ? -1 : 1;
  const k = Math.floor(j / 2);
  return {
    pos: [BOX.x + side * 0.236 + (hash01(j * 7.1) - 0.5) * 0.01, BOX_FLOOR + CS[1] / 2 + 0.003 + 0.047 * k + (side > 0 ? 0.0235 : 0), BOX.z + (hash01(j * 3.3 + 1) - 0.5) * 0.06] as V3,
    yaw: (hash01(j * 5.9 + 2) - 0.5) * 10,
    rx: 0,
    rz: 0,
  };
};

/** a card's path: off its slot along the shelf, over the sill and out of the bore, a small hop up, then a steady
 *  glide down across to the box (each card is lower than the one behind it, so a ribbon never cuts through itself)
 *  and a short drop onto the heap (the trailing edge clears the box wall before it drops) */
const pathPts = (x: number, i: number, side: number, rest: V3): V3[] => {
  const p0 = slotPos(x, i);
  const y = p0[1];
  return [
    p0,
    [p0[0], y + 0.004, 0.32],
    [x + side * 0.05, y + 0.02, 0.78],
    [x + side * 0.16, y + 0.07, 1.15],
    [mix(x + side * 0.16, rest[0], 0.55), mix(y + 0.07, Math.max(0.56, rest[1] + 0.3), 0.5), mix(1.15, rest[2], 0.62)],
    [rest[0] - side * 0.02, Math.max(0.56, rest[1] + 0.3), rest[2]],
    rest,
  ];
};
type Brand = "openai" | "anthropic";
const mkCard = (x: number, k: number, brand: Brand) => {
  const side = brand === "openai" ? 1 : -1;
  const i = NSTACK - 1 - k;
  const j = 2 * k + (brand === "openai" ? 0 : 1);
  const rest = restOf(j);
  const pts = pathPts(x, i, side, rest.pos);
  const curve = new THREE.CatmullRomCurve3(
    pts.map((p) => new THREE.Vector3(...p)),
    false,
    "centripetal",
  );
  const len = curve.getLength();
  // the arc length where it leaves the sill (the 3rd point)
  const S3 = new THREE.Vector3(...pts[2]);
  let uS = 0;
  for (let n = 0, best = 1e9; n <= 300; n++) {
    const d = curve.getPointAt(n / 300).distanceTo(S3);
    if (d < best) [best, uS] = [d, n / 300];
  }
  return { curve, len, sS: uS * len, rest, side, i, yaw0: slotYaw(x, i) };
};
const O_FIRST_DEP = 94;
const FIRST_ARRIVE = O_FIRST_DEP + tOf(mkCard(X_O, 0, "openai").len);
const SCHED = (["openai", "anthropic"] as Brand[]).reduce(
  (acc, brand) => {
    acc[brand] = Array.from({ length: NLEAVE }, (_, k) => {
      const c = mkCard(brand === "openai" ? X_O : X_A, k, brand);
      const arrive = FIRST_ARRIVE + INT * k + (brand === "openai" ? 0 : INT / 2) + (k === NLEAVE - 1 ? 4 : 0);
      return { ...c, dep: arrive - tOf(c.len), arrive };
    });
    return acc;
  },
  {} as Record<Brand, (ReturnType<typeof mkCard> & { dep: number; arrive: number })[]>,
);

type Mover = ReturnType<typeof mkCard> & { g: Any; blob: Any; dep: number; x: number };
const buildSide = (w: World, x: number, brand: Brand) => {
  const { K, scene } = w;
  const vault = makeVault(w, { x, brand, maxCards: NSTACK });
  const movers: Mover[] = SCHED[brand].map((c) => {
    const g = K.group(scene);
    secretCard(w, CS, g, 0.5);
    g.visible = false;
    const blob = K.blob(0, 0, CS[0] * 1.3, CS[2] * 1.4, 0.3);
    blob.visible = false;
    return { ...c, g, blob, x };
  });
  const deps = movers.map((m) => m.dep).sort((a, b) => a - b);
  // the dashed outline draws on between departures: from two gone to seven gone (before the trickle)
  const ghostAt = (f: number) => {
    const gone = deps.filter((d) => f >= d).length;
    let c = gone;
    if (gone < deps.length && gone > 0) c = gone - 1 + clamp01((f - deps[gone - 1]) / Math.max(1, deps[gone] - deps[gone - 1]));
    return clamp01((c - 2) / (NLEAVE - 3));
  };
  const goneAt = (f: number) => deps.filter((d) => f > d).length;
  return { vault, movers, ghostAt, goneAt };
};

/** the open cardboard box (neutral clay): bottom, four walls, all four flaps folded down outside (he stands behind
 *  it, so nothing on the box rises above its rim) */
const buildBox = (w: World) => {
  const { K, scene } = w;
  const g = K.group(scene, [BOX.x, 0, BOX.z]);
  const card = K.clay(C.clayWarm);
  const flap = K.clay(C.clayAlt);
  const { L, D, H, t } = BOX;
  const P = { parent: g, r: 0.006, seg: 2 };
  K.box([L, BOX_FLOOR, D], card, [0, BOX_FLOOR / 2, 0], P);
  K.box([L, H, t], card, [0, H / 2, D / 2 - t / 2], P);
  K.box([L, H, t], card, [0, H / 2, -D / 2 + t / 2], P);
  K.box([t, H, D - 2 * t], card, [-L / 2 + t / 2, H / 2, 0], P);
  K.box([t, H, D - 2 * t], card, [L / 2 - t / 2, H / 2, 0], P);
  const flapAt = (pos: V3, rot: V3, size: V3) => {
    const h = K.group(g, pos);
    h.rotation.set(rot[0] * D2R, rot[1] * D2R, rot[2] * D2R);
    K.box(size, flap, [0, size[1] / 2, 0], { ...P, parent: h });
  };
  flapAt([0, H, -D / 2 + t / 2], [-150, 0, 0], [L - 0.01, D / 2 - 0.03, t * 0.8]);
  flapAt([0, H, D / 2 - t / 2], [158, 0, 0], [L - 0.01, D / 2 - 0.03, t * 0.8]);
  flapAt([-L / 2 + t / 2, H, 0], [0, 0, 128], [t * 0.8, D / 2 - 0.02, D - 0.02]);
  flapAt([L / 2 - t / 2, H, 0], [0, 0, -128], [t * 0.8, D / 2 - 0.02, D - 0.02]);
  K.blob(BOX.x, BOX.z, L * 1.5, D * 1.7, 0.42);
};

// ---- the seam glow: the secrets inside, a faint warm light breathing through the gap round the closed door ----------
/** three soft translucent orange rings hugging the door's edge on the collar's face (core, halo, wide halo); fade as it opens */
/** the dust: the world's motes thinned to a few, so no speck ever crosses his head or face (checked f0-157 against the
 *  stage's mote layout and this camera; the layout has no seed, and the speck over his head at f43-70 is mote 5 of
 *  the front layer, present at any density above ~0.04) */
const AIR = { motes: 0.035 };
const SEAM = { r: VAULT.DOOR_R + 0.008, z: VAULT.D / 2 + 0.072 };
const buildSeamGlow = (w: World, x: number) => {
  const mats = [
    { tube: 0.007, a: 0.3 },
    { tube: 0.018, a: 0.13 },
    { tube: 0.038, a: 0.06 },
  ].map(({ tube, a }) => {
    const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(C.orange), transparent: true, opacity: 0, depthWrite: false, fog: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(SEAM.r + tube * 0.5, tube, 12, 120), m);
    ring.position.set(x, VAULT.DOOR_Y, SEAM.z);
    ring.renderOrder = 3;
    w.scene.add(ring);
    return { m, ring, a };
  });
  return (f: number, open: number, phase: number) => {
    const breathe = 0.62 + 0.38 * Math.sin((2 * Math.PI * (f + phase)) / 44 - Math.PI / 2);
    const k = breathe * (1 - clamp01(open / 0.22));
    mats.forEach(({ m, ring, a }) => {
      m.opacity = a * k;
      ring.visible = k > 0.002;
    });
  };
};

const SPEC_FOG = { near: 12, far: 40 };
const FOG_REF = 19.7;
const SPEC: WorldSpec = {
  fog: SPEC_FOG,
  light: { center: [0, 1, 1.1], span: 7 },
  build: (w) => {
    const O = buildSide(w, X_O, "openai");
    const A = buildSide(w, X_A, "anthropic");
    buildBox(w);
    const man = makeOutsider3D(w, { look: "mannequin", tone: "black" });
    const all = [...O.movers, ...A.movers];
    const seamO = buildSeamGlow(w, X_O);
    const seamA = buildSeamGlow(w, X_A);
    return (f, cam) => {
      // the haze keeps its depth relative to the subject: the long-lens wide sits farther back than the old one
      // (19.7 m), so the fog's near and far move back with the camera beyond that (unchanged before ~f100)
      const camD = Math.hypot(cam.pos[0] - cam.target[0], cam.pos[1] - cam.target[1], cam.pos[2] - cam.target[2]);
      const fogShift = Math.max(0, camD - FOG_REF);
      (w.scene.fog as Any).near = SPEC_FOG.near + fogShift;
      (w.scene.fog as Any).far = SPEC_FOG.far + fogShift;
      seamO(f, doorAt(f, 0).open, 0);
      seamA(f, doorAt(f, 2).open, 13);
      [
        [O, 0],
        [A, 2],
      ].forEach(([S, lead]) => {
        const s = S as typeof O;
        s.vault.update({ ...doorAt(f, lead as number), cardsLeft: NSTACK - s.goneAt(f), ghost: s.ghostAt(f), glow: 1 });
      });
      const camYaw = yawTo(cam, SPOT);
      man.update(poseAt(f, camYaw), WALK(f).at, OUT_H);
      all.forEach((m) => {
        const t = f - m.dep;
        m.blob.visible = false;
        if (t <= 0) {
          m.g.visible = false;
          return;
        }
        m.g.visible = true;
        const s = Math.min(m.len, sOf(t));
        const u = s / m.len;
        const p = m.curve.getPointAt(u);
        const tg = m.curve.getTangentAt(Math.min(u, 0.995));
        // flat on the shelf; in the air a third of the slope; it settles onto its rest pose over the last 0.3 m
        const slope = Math.atan2(-tg.y, Math.hypot(tg.x, tg.z));
        const inAir = clamp01((s - m.sS) / 0.25);
        const settle = clamp01(1 - (m.len - s) / 0.3);
        const sm = settle * settle * (3 - 2 * settle);
        const bank = -m.side * 0.12 * Math.sin(Math.PI * clamp01((s - m.sS) / Math.max(0.01, m.len - m.sS)));
        m.g.position.copy(p);
        m.g.rotation.set(0, 0, 0);
        m.g.rotateY(mix(m.yaw0, m.rest.yaw * D2R, sm));
        m.g.rotateX(mix(0.3 * slope * inAir, m.rest.rx * D2R, sm));
        m.g.rotateZ(mix(bank, m.rest.rz * D2R, sm));
        // a contact shadow on the floor while it flies (not inside the box)
        const inBox = Math.abs(p.x - BOX.x) < BOX.L / 2 + 0.05 && Math.abs(p.z - BOX.z) < BOX.D / 2 + 0.05;
        if (s < m.len && p.z > 0.8 && !inBox) {
          m.blob.visible = true;
          m.blob.position.set(p.x + 0.03, 0.004, p.z + 0.03);
          m.blob.material.opacity = 0.3 * clamp01(1 - p.y / 1.0);
        }
      });
    };
  },
};

// ---- the camera: one continuous pull-back with a slow orbit right, then a slow creep ------------------------------
const TRACK = camTrack({ target: [X_O, 0.95, 0.7], dist: 6.0, yaw: 4, pitch: 5, fov: 26 }, [
  { from: -14, to: 50, key: { target: [-0.5, -0.05, 1.2], dist: 11.8, yaw: 2, pitch: 12 } },
  { from: 32, to: 92, key: { dist: 12.2, pitch: 11 } },
  { from: 70, to: 120, key: { target: [-0.03, 0.0, 1.1], dist: 33.25, yaw: 1, pitch: 18, fov: 16 } },
  { from: 114, to: 214, key: { target: [-0.03, -0.02, 1.1], dist: 33.55, yaw: 1, pitch: 18, fov: 16 } },
]);
export const camAt = (f: number) => orbitCam(living(TRACK(f), f));

const LeakedSecrets: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  return <PaulStage spec={SPEC} cam={camAt(f)} air={AIR} />;
};
export default LeakedSecrets;
