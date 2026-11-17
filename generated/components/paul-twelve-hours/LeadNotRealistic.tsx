// ---------------------------------------------------------------------------
// LeadNotRealistic (paul-twelve-hours, cut 53, S7). Paul world, look C "Graphite air" (paulWorld / paulWorldSets), on
// the Dwarkesh 3D style's craft (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 158 frames.
// Returns to S5's race ruler (MonthsAhead, the master): fog, light and ruler from raceState.ts (RACE.spec), the same
// flag tokens and the same orange stack cards (secretCard STACK_CARD, the world's card jitter).
//
// CHECK LINE: "if the secrets aren't protected, the lead was never real."
//
// THE LINE: "So to the extent that this information is not protected, then the lead is sort of not realistic in the
// first place."
// WORD -> FRAME (Whisper, cut f0 = 53.512 s; true onsets ~5-9 f later): to -7 · the 1 · extent 3 · that 7 · this 11 ·
// information 18 · is 25 · not 32 · protected 39 · then 55 · the 65 · lead 84 · is 98 · sort 102 · of 105 · not 109 ·
// realistic 115 · (in the first place 130-141)
// DURATION: the slot 53.512 -> 60.102 s = 6.590 s x 23.976 = 158 frames (f0..f157).
//
// THE MOTION: open close on the US token on its tall orange stack (8 cards, month 0) from the front right, the lead
// painted flat on the ruler between the lanes (an ink dimension line with end ticks, US line -> China's puck); an eased
// pull-back reveals China's token on a bare puck at month 6 entering from the right edge (f15-30). On "not protected"
// a dashed case draws round the US stack by its moving tip (f32-50) while the stack's top card slides askew (open,
// f36-48). Then one ribbon of cards (6, at most 3-4 in flight, the stack's own card size) leaves the open top
// (f44-74): each slides out level from under the US puck, arcs low along the ruler and slides in level from the front
// under China's puck (the token lifts one card); China's stack grows card by card while the US stack shrinks a little
// (8 -> 6: two are the US's own loose top cards, four are copies peeled off the open top: the secrets are copied, not
// lost) and China's token advances along its lane from the first landing (f64) to month 0.6 (f90, "lead": S6's twelve
// hours), the painted bracket shrinking with it to a short stub. On "not realistic" the stub turns dashed (f111-117)
// and China closes it to the line while it fades into the ruler (f117-134); meanwhile the camera swings round to S6's
// front view (f100-150): the payoff is two equal orange stacks side by side at the line, the US flag flying left,
// China's right, the dashed case still round the US stack; a slow creep and living drift to f157.
// Orange = the American labs' algorithmic secrets; dashed = not real (the case that isn't there, the lead).
// CAUSE -> EFFECT: each card leaves from the open top card's pose (contact f = its departure: 44 50 56 62 68 74);
// the US token drops one card only after a real departure's card has slid out from under it (d+3..d+9); China's
// token lifts from each card's distance to its slot (as its leading edge comes in under the puck) and the card lands
// at its slot (arrivals 64 69 74 79 84 89); China moves only from the first landing; the bracket's far tick IS China's
// month every frame (solid and dashed alike, anchored at the US line).
//
// DEPTH: metres, the ruler along -z (month m at z = -m * 0.5), US lane x -0.5 (S5's), China's lane x +0.85 (S5:
// +0.5; moved out so the dashed case and the bracket strip fit between the two stacks at the line), the bracket flat
// on the ruler at x +0.2 (bar 8 cm, ticks 18 cm; clear of the case at x +0.07 and China's cards from x +0.36). The
// case stands 8 cm out from the stack, dashes r 3.6 cm, cream with a touch of emissive. Camera (orbit, fov 26): start
// target [-0.69, 0.4, 0.11] dist 13.56 yaw 24 pitch 13 (China's puck off the right edge) -> f62 dist 20.4 pitch 18
// (the whole run) -> f106 dist 16.6 yaw 20 pitch 21 (the pair nearing the line) -> f150 S6's front view, yaw 0,
// pitch 23, dist 16 -> 15.7 (flags x ~115-965, pole tops y ~330; S6 ends at yaw 0 / pitch 11 / dist 14, fov 26, a
// little tighter and lower). From the front right China always stands screen-right of the US: the flags never cross.
// Fog / light: RACE.spec.
//
// SOURCES: none (the speaker's argument; no figures on screen).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { C, D2R, PaulStage, THREE, camTrack, ease01, hash01, living, mix, orbitCam, type Any, type Orbit, type V3, type World, type WorldSpec } from "./paulWorld";
import { RULER, STACK_CARD, STACK_PITCH, makeDashedCase, makeFlagToken, makeRuler, monthZ, secretCard, yawTo } from "./paulWorldSets";
import { RACE } from "./raceState";

export const FPS = 24000 / 1001;
export const DURATION = 158;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- the layout ---------------------------------------------------------------------------------------------------
// S5's lanes, China's moved out (+0.5 -> +0.85) so the dashed case and the painted lead bracket fit between the stacks
const US_X = RULER.LANE.us;
const CN_X = 0.85;
const US0 = 8; // cards on the US stack at f0
const CN_FROM = 6; // China's month at f0
const CN_STUB = 0.6; // where the leak leaves China (S6's twelve hours): the stub of lead "not realistic" dashes out
const CN_CLOSE = [117, 134] as const; // China closes the dashed stub to the line ("realistic", true ~f121)
const H2 = STACK_CARD[1] / 2;
const Y0 = RULER.TOP;

// ---- the beats (cut frames) -----------------------------------------------------------------------------------------
const CASE_DRAW = [32, 50] as const; // "not protected" (true ~f38-45)
const OPEN = [36, 48] as const;
const DEP = [44, 50, 56, 62, 68, 74];
const ARR = [64, 69, 74, 79, 84, 89];
const REAL = [true, false, false, true, false, false]; // the US's own loose top cards; the rest are copies
const CN_MOVE = [64, 90] as const; // from the first landing to the US line ("lead" true ~f90)
const BR_DASH = [111, 117] as const; // the stub's solid -> dashed crossfade ("not", true ~f115)
const BR_FADE = [118, 134] as const; // the dashed stub drains into the ruler as China closes it
const SLIDE = 1.1; // m: the slide in, from the front (+z) of China's stack

export const cnMonth = (f: number) => mix(CN_FROM, CN_STUB, ease01(CN_MOVE[0], CN_MOVE[1], f)) * (1 - ease01(CN_CLOSE[0], CN_CLOSE[1], f));

// ---- the camera -----------------------------------------------------------------------------------------------------
const CAM0: Orbit = { target: [-0.69, 0.4, 0.11], dist: 13.56, yaw: 24, pitch: 13, fov: 26 };
const TRACK = camTrack(CAM0, [
  // the reveal: back and up from the front-right three-quarter until China (entering from the right edge), the run and
  // the ribbon stand in the box (moving at f0)
  { from: -8, to: 62, key: { target: [0.6, -0.05, -0.22], dist: 20.42, pitch: 18 } },
  // as China comes up the ruler: in onto the pair at the line, still from the front right (the painted bracket reads
  // between the stacks as it drains)
  { from: 58, to: 106, key: { target: [0.41, 0.33, 0.59], dist: 16.58, yaw: 20, pitch: 21 } },
  // the payoff: round to S6's front view, a little wider and higher (pitch 23) so the case reads as a box
  { from: 100, to: 150, key: { target: [0.17, 0.21, 1.11], dist: 16.0, yaw: 0, pitch: 23 } },
  // a slow creep on to the end
  { from: 146, to: 230, key: { dist: 15.7 } },
]);

// ---- the card jitter (the world's makeOrangeStack formulas, so the stacks look the same) ----------------------------
const jx = (i: number) => 0.014 * Math.sin(i * 2.3);
const jy = (i: number, lane: number) => (hash01(i + lane * 3) - 0.5) * 8;

/** the US stack's smooth count (a real departure's card slides out, then the token settles one card down) */
const usSmooth = (f: number) => US0 - DEP.reduce((s, d, j) => s + (REAL[j] ? ease01(d + 3, d + 9, f) : 0), 0);
const usCount = (f: number) => US0 - DEP.filter((d, j) => REAL[j] && f > d).length;
/** the open top: only the top card slid askew (0..1), the next one easing out after a real departure */
const usAskew = (i: number, f: number) => ease01(OPEN[0], OPEN[1], f) * Math.max(0, Math.min(1, i - usSmooth(f) + 2));
const usCardPose = (i: number, f: number): { p: V3; yaw: number } => {
  const s = usAskew(i, f);
  return { p: [US_X + jx(i) + 0.05 * s, Y0 + H2 + i * STACK_PITCH, 0.04 * s], yaw: jy(i, US_X) + 6 * s };
};

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
/** card j's progress along its flight (0..1); outside = not in flight */
const flightS = (j: number, f: number) => {
  const u = (f - DEP[j]) / (ARR[j] - DEP[j]);
  if (u <= 0 || u >= 1) return u <= 0 ? -1 : 2;
  return u - (0.62 * Math.sin(2 * Math.PI * u)) / (2 * Math.PI);
};
/** card j's flight path with China at month cn: a level slide out from under the US puck (front-right), one low arc
 *  over the ruler, and a level slide in from the front under China's puck (centripetal Catmull-Rom, arc-length) */
const flightCurve = (j: number, cn: number) => {
  const S = usCardPose(Math.max(0, usCountAt(j) - 1), DEP[j]).p;
  const E: V3 = [CN_X + jx(j), Y0 + H2 + j * STACK_PITCH, monthZ(cn)];
  const B: V3 = [S[0] + 0.6, S[1] + 0.01, S[2] + 0.78];
  const A: V3 = [E[0], E[1] + 0.01, E[2] + SLIDE];
  const hop = Math.hypot(A[0] - B[0], A[2] - B[2]);
  const H: V3 = [(B[0] + A[0]) / 2, Math.max(B[1], A[1]) + Math.min(0.6, 0.28 * hop), (B[2] + A[2]) / 2];
  const pts: V3[] = [S, [S[0] + 0.3, S[1] + 0.004, S[2] + 0.39], B, H, A, [E[0], E[1] + 0.003, E[2] + SLIDE / 2], E];
  return { curve: new THREE.CatmullRomCurve3(pts.map((q) => new THREE.Vector3(...q)), false, "centripetal"), E };
};
/** how far China's token has been lifted by card j (0..1; 1 once landed): from the card's distance to its slot (the
 *  token rises as the card's leading edge comes in under the puck) */
const cnLift = (j: number, f: number) => {
  const s = flightS(j, f);
  if (s < 0) return 0;
  if (s > 1) return 1;
  const { curve, E } = flightCurve(j, cnMonth(f));
  const d = curve.getPointAt(s).distanceTo(new THREE.Vector3(...E));
  return smooth((1.0 - d) / 0.2);
};
const cnCount = (f: number) => ARR.filter((a) => f >= a).length;
const cnStackY = (f: number) => Y0 + DEP.reduce((s, _, j) => s + cnLift(j, f), 0) * STACK_PITCH;

/** the US stack's count just before departure j (whose top card the card leaves from) */
const usCountAt = (j: number) => US0 - DEP.filter((d, k) => REAL[k] && k < j).length;

// ---- the lead: a dimension line painted on the ruler (built here) ----------------------------------------------------
// It lies flat in the strip between the US case and China's lane: a bar along the ruler from the US line (month 0) to
// China's current month, with an end tick across the strip at each end. Live: its far end IS China's position.
const BR = { x: 0.2, w: 0.08, tick: 0.18, tickD: 0.07, h: 0.008, dash: 0.06, gap: 0.045 };
const makeLeadBracket = (w: World) => {
  const { K, scene } = w;
  const mk = () => new THREE.MeshStandardMaterial({ color: new THREE.Color(C.ink), roughness: 0.9, metalness: 0, transparent: true, opacity: 1 });
  const solidMat = mk();
  const dashMat = mk();
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const bar = (g: Any, mat: Any, x0: number, x1: number, z0: number, z1: number) => {
    const m = new THREE.Mesh(unit, mat);
    m.scale.set(Math.abs(x1 - x0), BR.h, Math.abs(z1 - z0));
    m.position.set((x0 + x1) / 2, RULER.TOP + BR.h / 2, (z0 + z1) / 2);
    m.receiveShadow = true;
    g.add(m);
    return m;
  };
  const solid = K.group(scene);
  const bodyBar = bar(solid, solidMat, BR.x - BR.w / 2, BR.x + BR.w / 2, 0, -1);
  bar(solid, solidMat, BR.x - BR.tick / 2, BR.x + BR.tick / 2, BR.tickD / 2, -BR.tickD / 2);
  const farTick = bar(solid, solidMat, BR.x - BR.tick / 2, BR.x + BR.tick / 2, BR.tickD / 2, -BR.tickD / 2);
  // the dashed stub (China's resting gap): the bar in short dashes, each tick in three
  const dashed = K.group(scene);
  const zEnd = monthZ(CN_STUB);
  for (let z = -BR.tickD / 2 - BR.gap; z - BR.dash > zEnd + BR.tickD / 2 + 0.01; z -= BR.dash + BR.gap) bar(dashed, dashMat, BR.x - BR.w / 2, BR.x + BR.w / 2, z, z - BR.dash);
  const seg = (BR.tick - BR.gap) / 2;
  [0, zEnd].forEach((zt) => {
    for (let k = 0; k < 2; k++) {
      const x0 = BR.x - BR.tick / 2 + k * (seg + BR.gap);
      bar(dashed, dashMat, x0, x0 + seg, zt + BR.tickD / 2, zt - BR.tickD / 2);
    }
  });
  const update = (p: { far: number; solid: number; dashed: number }) => {
    const span = Math.max(0.001, -p.far);
    bodyBar.scale.z = span;
    bodyBar.position.z = -span / 2;
    farTick.position.z = p.far;
    solid.visible = p.solid > 0.003;
    solidMat.opacity = p.solid;
    dashed.visible = p.dashed > 0.003;
    dashMat.opacity = p.dashed;
    // the dashed stub is live too: it rides China's puck in as China closes it (anchored at the US line)
    dashed.scale.z = Math.max(0.02, p.far / zEnd);
  };
  return { update };
};

// ---- the world ----------------------------------------------------------------------------------------------------
const SPEC: WorldSpec = {
  fog: RACE.spec.fog,
  light: RACE.spec.light,
  build: (w) => {
    const { K, scene } = w;
    makeRuler(w);
    // the US stack (cards built like makeOrangeStack's, posed here so the open top can feed the leak)
    const usG = K.group(scene);
    const usCards = Array.from({ length: US0 }, () => {
      const c = K.group(usG);
      secretCard(w, STACK_CARD, c, 0.5);
      return c;
    });
    K.blob(US_X + 0.08, 0.04, 1.4, 1.2, 0.55, Y0 + 0.003);
    // China's stack (grows by landed cards)
    const cnG = K.group(scene);
    const cnCards = DEP.map((_, i) => {
      const c = K.group(cnG);
      secretCard(w, STACK_CARD, c, 0.5);
      c.position.set(jx(i), Y0 + H2 + i * STACK_PITCH, 0);
      c.rotation.y = jy(i, CN_X) * D2R;
      return c;
    });
    const cnBlob = K.blob(0, 0, 1.4, 1.2, 0.55, Y0 + 0.003);
    const fUS = makeFlagToken(w, { kind: "us", lane: US_X, flyLeft: true });
    const fCN = makeFlagToken(w, { kind: "cn", lane: CN_X });
    // the case that isn't there: 8 cm out from the stack, thicker cream-white dashes with a touch of their own light
    const box = makeDashedCase(w, { center: [US_X, 0.73, 0], size: [1.14, 1.14, 0.96], r: 0.036 });
    const caseMat = new THREE.MeshStandardMaterial({ color: new THREE.Color("#F8F5EE"), emissive: new THREE.Color(C.cream), emissiveIntensity: 0.4, roughness: 0.8, metalness: 0 });
    const br = makeLeadBracket(w);
    // the flying cards
    const fly = DEP.map(() => {
      const g = K.group(scene);
      secretCard(w, STACK_CARD, g, 0.5);
      return g;
    });
    const up = new THREE.Vector3(0, 1, 0);
    return (f, cam) => {
      const cn = cnMonth(f);
      const zc = monthZ(cn);
      // US stack
      const nU = usCount(f);
      usCards.forEach((c: Any, i: number) => {
        c.visible = i < nU;
        if (!c.visible) return;
        const { p, yaw } = usCardPose(i, f);
        c.position.set(...p);
        c.rotation.set(0, yaw * D2R, 0);
      });
      fUS.update({ month: 0, y: Y0 + usSmooth(f) * STACK_PITCH, yaw: yawTo(cam, [US_X, 1, 0]) + 18, wave: f + 20 });
      // China
      const nC = cnCount(f);
      cnG.position.set(CN_X, 0, zc);
      cnCards.forEach((c: Any, i: number) => (c.visible = i < nC));
      const first = cnLift(0, f);
      cnBlob.position.set(CN_X + 0.08, Y0 + 0.003, zc + 0.04);
      cnBlob.visible = first > 0.01;
      cnBlob.material.opacity = 0.55 * first;
      fCN.update({ month: cn, y: cnStackY(f), yaw: yawTo(cam, [CN_X, 1, zc]) - 18, wave: f });
      // the case that isn't there
      box.update({ draw: ease01(CASE_DRAW[0], CASE_DRAW[1], f) });
      box.group.traverse((o: Any) => {
        if (o.isMesh) o.material = caseMat;
      });
      // the bracket that measured the lead
      const dashIn = ease01(BR_DASH[0], BR_DASH[1], f);
      br.update({ far: zc, solid: 1 - dashIn, dashed: dashIn * (1 - ease01(BR_FADE[0], BR_FADE[1], f)) });
      // the ribbon
      fly.forEach((g: Any, j: number) => {
        const s = flightS(j, f);
        const on = s > 0 && s < 1;
        g.visible = on;
        if (!on) return;
        // a copy rises off the top card; a real departure IS the top card (hidden in the stack from DEP[j])
        const { curve } = flightCurve(j, cn);
        const pos = curve.getPointAt(s);
        const t = curve.getTangentAt(s);
        g.position.copy(pos);
        const y0 = usCardPose(Math.max(0, usCountAt(j) - 1), DEP[j]).yaw;
        const y1 = jy(j, CN_X);
        g.rotation.set(0, mix(y0, y1, smooth(s)) * D2R, 0);
        const hz = Math.hypot(t.x, t.z);
        if (hz > 1e-5) {
          const slope = Math.atan2(t.y, hz);
          const axis = new THREE.Vector3(t.x / hz, 0, t.z / hz).cross(up).normalize();
          g.rotateOnWorldAxis(axis, slope * 0.3);
        }
      });
    };
  },
};

const LeadNotRealistic: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = orbitCam(living(TRACK(f), f));
  return <PaulStage spec={SPEC} cam={cam} frame={f} />;
};
export default LeadNotRealistic;
