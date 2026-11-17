// ---------------------------------------------------------------------------------------------------------------------
// LeakedSecrets (paul-twelve-hours, cut 2), rev 2 (director review 1). Look C "Graphite air" on the shared world
// (paulWorld / paulWorldSets / paulFolk). Opaque 1080x1920, 23.976 fps, 158 frames.
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
// THE MOTION: one continuous pull-back with a slow orbit to the right. It opens close on the OpenAI vault (mark +
// window: a neat stack of ten glowing orange cards on a pedestal behind the glass), the camera already easing back. On
// "actors" the small hooded outsider walks in from the left (on screen from ~f41), a little clumsy (a stumble at
// f47-51), and stops beside an open cardboard box that stands between the two vaults (~f58). On "access" the hatch's
// three latch pins slide down out of the lintel (f55-61), the hatch rattles, falls faster and faster and lands as a
// ramp (f75, small rebound); he startles (f74). As the hatch settles the top card slides off (f81), then one every 3.6
// frames: over the hatch's bottom rail, turning long side first onto its inner stile, down the stile, off the tip and a
// low arc in over the box's side wall onto the heap. From f72 the camera pulls back and pans right: the Anthropic vault
// (draining the same way, its stream half a beat behind OpenAI's) is whole in frame by ~f111; the two streams converge
// on the box from left and right. He turns to the box and his hands come up ("whoa", f100-114). The box fills (first
// card in ~f116, "vast"), the heap rises above the rim; by "developments" (f134-141) both stacks are down to three with
// dashed outlines of the full stacks; one last card per stack trickles in (lands ~f150-153, stacks down to two) under
// a slow creep back to f157.
// CAUSE -> EFFECT: pins out (f61) -> hatch falls (f63) -> lands (f75) -> he startles (f74) -> first card off (f81); a
// card leaves only after the card above it; each card lands on the heap of those before it (the heap rises).
// Orange = the American labs' algorithmic secrets (the cards). Dashed = not real (the stack that is no longer there).
//
// LAYOUT (metres, y up): the vaults at x -1.4 (OpenAI) and +1.4 (Anthropic): a gap of ~0.87 vault widths (the world's
// default +-0.92 is moved apart for the box). Each holds a stack of 10 cards (0.34 x 0.25) on a pedestal (the world
// vault's big-card stack is hidden); 8 leave. The open box (1.0 x 0.56 x 0.30, the back flap up, the others folded
// down) stands at [0, 0, 2.26], between and in front of the ramp tips. The outsider (1.42 m) stops at [-1.08, 0, 2.85],
// front-left of the box: with the camera orbiting to yaw ~17 deg his overlay stays clear of the OpenAI lane and arc
// (>= ~40 px at every frame; he is a 2D overlay and cannot go behind anything). Cards run at 0.085 m/f after a 3-frame
// start (spacing ~0.31 m), at most 8 in flight per stream.
// CAMERA: dist 6.4 -> 12.6 (f-14..50, yaw 3 -> 17) -> 13.2 (f32..92, calm) -> 18.6 (f72..126, the reveal: pans right
// to x 0.22, yaw 17, pitch 20) -> 19.6 (f114..214, the creep); fov 26, plus living(). End frame: vaults x ~88-1002,
// tops y ~440-500, box front and his feet y ~1026.
//
// SOURCES: none (no figures on screen). Logos: the world's OpenAI / Anthropic marks on the vault lintels.
// ---------------------------------------------------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Outsider, type OutsiderPose } from "./paulFolk";
import { C, PaulStage, THREE, camTrack, clamp01, ease01, hash01, living, orbitCam, type Any, type V3, type World, type WorldSpec } from "./paulWorld";
import { makeVault, secretCard } from "./paulWorldSets";

export const FPS = 24000 / 1001;
export const DURATION = 158;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const D2R = Math.PI / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ---- the outsider ----------------------------------------------------------------------------------------------------
const OUT_Z = 2.85;
const OUT_X0 = -3.0; // off-frame left at f34
const OUT_X1 = -1.08; // his spot, front-left of the box
const OUT_H = 1.42;
const WALK0 = 34;
const WALK1 = 61;
/** his x: walks in, a stumble (a hitch, then a lurch to catch himself), stops on his spot */
const outX = (f: number) => {
  const base = ease01(WALK0 - 6, WALK1, f); // already walking as he enters
  const hitch = -0.07 * Math.exp(-Math.pow((f - 48) / 2.2, 2)) + 0.05 * Math.exp(-Math.pow((f - 51.5) / 2, 2));
  return lerp(OUT_X0, OUT_X1, base) + hitch * clamp01((WALK1 - f) / 4);
};
// the arm poses (the Worker rig's ArmPose: upper arm abd/flex, forearm abd2/flex2, hand droop, thumb)
type Arm = { abd: number; flex: number; abd2: number; flex2: number; droop: number; thumb: number };
const HANG: Arm = { abd: 13, flex: 6, abd2: -9, flex2: 12, droop: 4, thumb: 0 };
const WHOA_R: Arm = { abd: 34, flex: 38, abd2: 22, flex2: 148, droop: -18, thumb: 0.4 };
const WHOA_L: Arm = { abd: 30, flex: 44, abd2: 18, flex2: 142, droop: -14, thumb: 0.4 };
const mixArm = (a: Arm, b: Arm, t: number): Arm => ({
  abd: lerp(a.abd, b.abd, t),
  flex: lerp(a.flex, b.flex, t),
  abd2: lerp(a.abd2, b.abd2, t),
  flex2: lerp(a.flex2, b.flex2, t),
  droop: lerp(a.droop, b.droop, t),
  thumb: lerp(a.thumb, b.thumb, t),
});
/** the pose: walking in (stumble), stopping, a startle on the hatch, then turning to the box with his hands up */
const poseAt = (f: number): OutsiderPose => {
  const walking = 1 - ease01(WALK1 - 6, WALK1 + 1, f);
  const stumble = Math.exp(-Math.pow((f - 49) / 2.6, 2));
  const startle = Math.exp(-Math.pow((f - 74) / 5, 2));
  const turn = ease01(84, 100, f); // turns to the box as the first cards come
  const whoa = ease01(100, 114, f);
  const t = f / 23.976;
  const fum = 0.5 * stumble + 0.55 * startle + 0.15 * (1 - walking) * (1 - whoa) + 0.1 * whoa;
  const jig = (k: number) => fum * Math.sin(t * 2 * Math.PI * 1.7 + k) * 7;
  // a little hop of the hands as each pair of cards lands (from f116)
  const bob = whoa * 4 * Math.max(0, Math.sin(((f - 116) / 7.2) * 2 * Math.PI)) * (f > 116 && f < 146 ? 1 : 0);
  const armR = { ...mixArm(HANG, WHOA_R, whoa), flex: lerp(HANG.flex, WHOA_R.flex, whoa) + jig(0) + 26 * startle, flex2: lerp(HANG.flex2, WHOA_R.flex2, whoa) + bob };
  const armL = { ...mixArm(HANG, WHOA_L, whoa), flex: lerp(HANG.flex, WHOA_L.flex, whoa) + jig(1.7) + 22 * startle, flex2: lerp(HANG.flex2, WHOA_L.flex2, whoa) + bob };
  const pose: OutsiderPose = {
    hood: "up",
    carry: "none",
    frame: f,
    yaw: lerp(18 + 8 * turn, 62, walking) - 6 * startle,
    walk: (f - WALK0) * 0.42 - 0.6 * stumble,
    walkAmt: walking,
    headYaw: lerp(-6 + 20 * turn, 6, walking) - 16 * startle,
    headPitch: 3 + 13 * stumble - 10 * startle + 7 * turn,
    headRoll: 4.5 + 6 * stumble,
    fumble: fum,
  };
  // while he walks the rig swings his arms itself; once he stops the arms are posed here (identical at walkAmt 0)
  if (walking < 0.001) {
    pose.armR = armR;
    pose.armL = armL;
  }
  return pose;
};

// ---- the cards -------------------------------------------------------------------------------------------------------
const CS: V3 = [0.34, 0.042, 0.25];
const PITCH = 0.046;
const NSTACK = 10;
const NLEAVE = 8; // the 8th is a late trickle (arrives 4 f later than the even beat)
const X_O = -1.4;
const X_A = 1.4;
const PED_TOP = 0.56;
const V = 0.085; // m per frame, once moving
const TA = 3; // frames to reach speed off the stack
const INT = 3.6; // frames between two cards of one stream (spacing ~0.31 m)
const slotY = (i: number) => PED_TOP + CS[1] / 2 + 0.002 + i * PITCH; // i from the bottom
const sOf = (t: number) => (t <= 0 ? 0 : t < TA ? (0.5 * V * t * t) / TA : V * (t - TA / 2));
const tOf = (s: number) => (s <= (V * TA) / 2 ? Math.sqrt((2 * s * TA) / V) : s / V + TA / 2);
/** the ramp's top surface (the fallen hatch, 98 deg): y at depth z, plus half a card */
const rampY = (z: number) => 0.269 - 0.1404 * (z - 0.68) + CS[1] / 2 + 0.006;

// the box: open, between and in front of the ramp tips
const BOX = { x: 0, z: 2.26, L: 1.0, D: 0.56, H: 0.3, t: 0.02 };
const BOX_FLOOR = 0.02;
/** where the j-th card to arrive (0..15, alternating OpenAI / Anthropic) rests on the heap */
const restOf = (j: number) => {
  const side = j % 2 === 0 ? -1 : 1; // OpenAI from the left, Anthropic from the right
  const k = j / 15;
  return {
    pos: [BOX.x + side * (0.2 - 0.17 * k) + (hash01(j * 7.1) - 0.5) * 0.05, BOX_FLOOR + CS[1] / 2 + 0.003 + 0.025 * j, BOX.z + (hash01(j * 3.3 + 1) - 0.5) * 0.12] as V3,
    yaw: (hash01(j * 5.9 + 2) - 0.5) * 22,
    rx: (hash01(j * 2.7 + 3) - 0.5) * 8,
    rz: -side * (3 + 6 * k) + (hash01(j * 4.1) - 0.5) * 4,
  };
};

/** one card's path: off its slot and out over the hatch's bottom rail to its inner stile, down the stile (long side
 *  first, like a conveyor), off the tip and a low arc in over the box's side wall onto the heap */
const STILE = 0.47; // the inner stile's centre, from the vault's axis
const pathPts = (x: number, y: number, side: number, rest: V3): V3[] => {
  const hx = x + side * STILE;
  return [
    [x, y, 0.0],
    [x, y + 0.004, 0.2],
    [x + side * 0.07, Math.max(0.42, y - 0.08), 0.44],
    [x + side * 0.3, rampY(0.82), 0.82],
    [hx - side * 0.01, rampY(1.1), 1.1],
    [hx, rampY(1.5), 1.5],
    [hx, rampY(1.86), 1.86], // H: leaves the tip
    [hx + side * 0.2, 0.33, 2.0],
    [rest[0] - side * 0.2, Math.max(0.46, rest[1] + 0.16), (2.0 + rest[2]) / 2 + 0.02],
    rest,
  ];
};
// THE SCHEDULE: cards arrive on the heap every INT frames per stream, Anthropic half a beat after OpenAI; each leaves
// its stack tOf(len) earlier (the top card first). The first OpenAI card leaves at f81, as the hatch settles.
const O_FIRST_DEP = 81;
type Brand = "openai" | "anthropic";
const mkCard = (x: number, k: number, brand: Brand) => {
  const side = brand === "openai" ? 1 : -1; // towards the box
  const j = 2 * k + (brand === "openai" ? 0 : 1);
  const rest = restOf(j);
  const curve = new THREE.CatmullRomCurve3(pathPts(x, slotY(NSTACK - 1 - k), side, rest.pos).map((p) => new THREE.Vector3(...p)), false, "centripetal");
  // the arc length where it leaves the ramp tip (the 7th point)
  const H = new THREE.Vector3(...pathPts(x, slotY(NSTACK - 1 - k), side, rest.pos)[6]);
  let uH = 0;
  for (let i = 0, best = 1e9; i <= 400; i++) {
    const d = curve.getPointAt(i / 400).distanceTo(H);
    if (d < best) [best, uH] = [d, i / 400];
  }
  const len = curve.getLength();
  return { curve, len, sH: uH * len, rest, side };
};
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

type Mover = { g: Any; blob: Any; curve: Any; len: number; sH: number; side: number; dep: number; jit: number; rest: ReturnType<typeof restOf>; x: number };
type Stack = { movers: Mover[]; vault: ReturnType<typeof makeVault>; ghost: Any; ghostAt: (f: number) => number; pins: Any[]; pinY: number };

const buildStack = (w: World, x: number, brand: Brand): Stack => {
  const { K, scene } = w;
  const vault = makeVault(w, { x, brand, maxCards: 4 });
  vault.update({ hatchOpen: 0, cardsLeft: 0, ghost: 0 });
  K.box([0.5, PED_TOP - 0.2, 0.4], K.clay(C.clayAlt), [x, 0.2 + (PED_TOP - 0.2) / 2, 0.0], { r: 0.03 });
  const movers: Mover[] = [];
  for (let i = 0; i < NSTACK; i++) {
    const k = NSTACK - 1 - i; // k-th to leave (0 = the top card)
    const g = K.group(scene, [x + 0.012 * Math.sin(i * 2.3 + x), slotY(i), 0.0]);
    const jit = (hash01(i * 3.7 + x * 11) - 0.5) * 6;
    g.rotation.y = jit * D2R;
    secretCard(w, CS, g, 0.5);
    if (k >= NLEAVE) continue;
    const c = SCHED[brand][k];
    const blob = K.blob(0, 0, CS[0] * 1.4, CS[2] * 1.6, 0.3);
    movers.push({ g, blob, curve: c.curve, len: c.len, sH: c.sH, side: c.side, dep: c.dep, jit, rest: c.rest, x });
  }
  // the dashed outline of the full stack (its front face), drawn on as the stack drains
  const ghost = K.group(scene);
  const gx = CS[0] / 2 + 0.03;
  const gz = CS[2] / 2 + 0.03;
  K.dashes(
    [
      [x - gx, PED_TOP + 0.02, gz],
      [x - gx, slotY(NSTACK - 1) + 0.04, gz],
      [x + gx, slotY(NSTACK - 1) + 0.04, gz],
      [x + gx, PED_TOP + 0.02, gz],
    ],
    { dash: 0.06, gap: 0.04, r: 0.0095, parent: ghost },
  );
  const deps = movers.map((m) => m.dep).sort((a, b) => a - b);
  // drawn on continuously between departures: starts once two cards have gone, complete when the stack is down to 3
  // (before the late trickle card)
  const ghostAt = (f: number) => {
    const gone = deps.filter((d) => f >= d).length;
    let c = gone;
    if (gone < deps.length && gone > 0) c = gone - 1 + clamp01((f - deps[gone - 1]) / Math.max(1, deps[gone] - deps[gone - 1]));
    return clamp01((c - 2) / (NLEAVE - 3));
  };
  const pins = vault.hinge.children.filter((c: Any) => c.geometry?.type === "CylinderGeometry");
  return { movers, vault, ghost, ghostAt, pins, pinY: pins[0]?.position.y ?? 1.32 };
};

/** the open cardboard box (neutral clay): bottom, four walls, the back flap up, the front and side flaps folded down */
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
  // flaps: a hinge group on each top edge, the flap standing up in it (+y), turned outwards
  const flapAt = (pos: V3, rot: V3, size: V3) => {
    const h = K.group(g, pos);
    h.rotation.set(rot[0] * D2R, rot[1] * D2R, rot[2] * D2R);
    K.box(size, flap, [0, size[1] / 2, 0], { ...P, parent: h });
  };
  flapAt([0, H, -D / 2 + t / 2], [-24, 0, 0], [L - 0.01, D / 2 - 0.01, t * 0.8]); // back flap: up, leaning back
  flapAt([0, H, D / 2 - t / 2], [158, 0, 0], [L - 0.01, D / 2 - 0.03, t * 0.8]); // front flap: folded down over the front
  flapAt([-L / 2 + t / 2, H, 0], [0, 0, 128], [t * 0.8, D / 2 - 0.02, D - 0.02]); // side flaps: folded out and down
  flapAt([L / 2 - t / 2, H, 0], [0, 0, -128], [t * 0.8, D / 2 - 0.02, D - 0.02]);
  K.blob(BOX.x, BOX.z, L * 1.5, D * 1.7, 0.42);
};

const SPEC: WorldSpec = {
  fog: { near: 12, far: 40 },
  light: { center: [0, 1, 1.4], span: 7 },
  build: (w) => {
    const O = buildStack(w, X_O, "openai");
    const A = buildStack(w, X_A, "anthropic");
    buildBox(w);
    const all = [...O.movers, ...A.movers];
    const onRamp = (p: Any, x: number) => Math.abs(p.x - x) < 0.6 && p.z > 0.6 && p.z < 1.97;
    return (f) => {
      // the hatches: the three latch pins slide down out of the lintel (f0-8 .. f0-2), the hatch rattles, then falls
      // faster and faster and lands with a small rebound
      const hatch = (f0: number) => {
        const t = clamp01((f - f0) / 12);
        const fall = t * t;
        const b = f - f0 - 12;
        const bounce = b > 0 ? 0.035 * Math.exp(-b / 3.2) * Math.abs(Math.sin((b / 5.5) * Math.PI)) : 0;
        const rattle = f < f0 ? 0.03 * Math.sin(Math.PI * clamp01((f - (f0 - 3)) / 3)) : 0;
        return fall - bounce + rattle;
      };
      const pins = (S: Stack, f0: number) => S.pins.forEach((c: Any) => (c.position.y = S.pinY - 0.15 * ease01(f0 - 8, f0 - 2, f)));
      O.vault.update({ hatchOpen: hatch(63), cardsLeft: 0, ghost: 0 });
      A.vault.update({ hatchOpen: hatch(60), cardsLeft: 0, ghost: 0 });
      pins(O, 63);
      pins(A, 60);
      all.forEach((m) => {
        const t = f - m.dep;
        const s = Math.min(m.len, sOf(t));
        m.blob.visible = false;
        if (t <= 0) return; // still in the stack (its build position)
        const u = s / m.len;
        const p = m.curve.getPointAt(u);
        const tg = m.curve.getTangentAt(Math.min(u, 0.995));
        // heading along the path; the slope tilts it on the ramp, only a little in the air; it settles to its rest
        // pose over the last 0.3 m (lands flat-ish on the heap)
        // past the tip the heading is held (the card keeps its long side along z through the arc and lands so)
        const inAir = clamp01((s - m.sH) / 0.2);
        const tgH = inAir > 0 ? m.curve.getTangentAt(m.sH / m.len) : tg;
        const yaw = Math.atan2(tgH.x, tgH.z);
        const slope = Math.atan2(-tg.y, Math.hypot(tg.x, tg.z));
        // kept nearly flat: at most ~17 deg on the drop off the pedestal, a third of the slope in the air
        const pitch = lerp(Math.max(-0.3, Math.min(0.3, slope)), 0.3 * slope, inAir);
        const settle = clamp01(1 - (m.len - s) / 0.3);
        const sm = settle * settle * (3 - 2 * settle);
        m.g.position.copy(p);
        m.g.rotation.set(0, 0, 0);
        // in the stack the long side is across; it turns long-side-first on the hatch's bottom rail (z 0.62-1.12)
        const turn = clamp01((p.z - 0.62) / 0.5);
        const run = lerp(m.jit * D2R, yaw + (Math.PI / 2) * m.side, turn * turn * (3 - 2 * turn));
        m.g.rotateY(lerp(run, m.rest.yaw * D2R + (m.side * Math.PI) / 2, sm));
        m.g.rotateX(lerp(pitch, m.rest.rx * D2R, sm));
        m.g.rotateZ(m.rest.rz * D2R * sm);
        // contact shadow on the floor (off the ramp, outside the box)
        const inBox = Math.abs(p.x - BOX.x) < BOX.L / 2 + 0.05 && Math.abs(p.z - BOX.z) < BOX.D / 2 + 0.05;
        if (s < m.len && !onRamp(p, m.x) && !inBox && p.z > 0.6) {
          m.blob.visible = true;
          m.blob.position.set(p.x + 0.03, 0.004, p.z + 0.03);
          m.blob.material.opacity = 0.3 * clamp01(1 - p.y / 0.8);
        }
      });
      [O, A].forEach((S) => {
        const d = S.ghostAt(f);
        S.ghost.children.forEach((c: Any, i: number) => (c.visible = d > 0.001 && i / S.ghost.children.length < d));
      });
    };
  },
};

// ---- the camera: one continuous pull-back with a slow orbit right, then a slow creep ------------------------------
const TRACK = camTrack({ target: [X_O, 0.72, 0.67], dist: 6.4, yaw: 3, pitch: 5, fov: 26 }, [
  // already easing back at f0; he walks in from the left on "actors" (f39)
  { from: -14, to: 50, key: { target: [-0.95, 0.12, 1.9], dist: 12.6, yaw: 17, pitch: 12 } },
  // calmer while the hatch falls (Anthropic still off-frame right)
  { from: 32, to: 92, key: { dist: 13.2, pitch: 13 } },
  // the reveal: pulls back, orbits and pans right; the Anthropic vault is whole by ~f110 ("vast majority")
  { from: 72, to: 126, key: { target: [0.22, -0.1, 1.3], dist: 18.6, yaw: 17, pitch: 20 } },
  // keeps creeping back the same way to the end (living, never a dead hold)
  { from: 114, to: 214, key: { target: [0.25, -0.14, 1.3], dist: 19.6, yaw: 18.5, pitch: 21 } },
]);
export const camAt = (f: number) => orbitCam(living(TRACK(f), f));

const LeakedSecrets: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  return <PaulStage spec={SPEC} cam={camAt(f)} overlay={(P) => <Outsider P={P} at={[outX(f), 0, OUT_Z]} heightM={OUT_H} pose={poseAt(f)} uid="ls" />} />;
};
export default LeakedSecrets;
