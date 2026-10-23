// ---------------------------------------------------------------------------
// SeveralDaysBeforeIllness (kyle-covid, cut 21). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 158 frames. Plan (camera, light cycle, walk, cast timetable): ./severalDaysPlan.ts;
// the medium through the time-lapse: ./severalDaysAir.ts; the set: ./severalDaysStreet.tsx; the cast: ./covidFolk.
//
// CHECK LINE: "Day after day the infected man went about his life looking fine, passing it to person after person —
// and only after several days did he finally get sick."
//
// THE LINE: "[COVID-19 was impossible to contain because it] took several days before you really presented with
// clinical illness." (after the cut, on the speaker: "And it's just that little quirk that made it totally impossible
// to control through non-pharmaceutical interventions early on.")
// WORD -> FRAME (f0 = 21.2546 s): TOOK 1 · SEVERAL 9 · DAYS 28 · before 41 · you 55 · really 61 · PRESENTED 80 ·
// with 104 · CLINICAL 119 · ILLNESS 127 · (And 154)
// DURATION: the slot 21.255 -> 26.527 s = 5.272 s x 29.97 = 158 frames (f0..f157).
//
// THE MOTION: one continuous truck to the right along a modern city street (one-point perspective, parallax: the
// bollards in front slide fastest, the shop row slowest) with THE CARRIER (covidFolk Carrier v0, the man of cut 3),
// glowing in the chest and perfectly well (no backpack: review 2, so his glow reads as two lungs and a windpipe),
// walking at the frame's middle, while the light runs a time-lapse of several days: from the first morning, two and
// a half clearly separate cycles (day, night f29, day, night f74, day; the clock slows into the third day's late
// morning). Each day the sun crosses: the time-lapse SHADOWS of the bollards, the lampposts, the bench and the
// people sweep across the pavement (long to the right in the morning, short at noon, long to the left in the
// evening) and the shafts swing with them; each night the air darkens and the shop windows, the lanterns, the far
// city's windows and the street lamps along the back of the pavement come on cream (cones and pools only where
// their lamp is in view).
// He carries a subtle warm cloud of his own air round his head and shoulders (covidHaze, the clip's shared air, as
// cut 3; user revision 1: nothing aimed at anyone) and leaves a short faint trail of it hanging in the street behind
// him (fading over ~30-40 frames). Four passers-by come toward him one at a time (kindles start f18, f40, f62, f84): he
// glances, smiles, says hi (the cloud's front lobe fills), their face walks into his cloud (CONTACT: ~4-8 frames before
// the kindle starts) and on through it as they pass behind him; they walk on to his left with their chest kindling,
// unaware. From f99 he
// slows; the illness shows (pale grey-green, the flush, droopy lids, a sweat drop) and he coughs twice into his fist
// (f99-f127, a spray of specks); he stops (f122), turns to the street and sinks onto a bench (f124-f142). THE PUSH
// (user revision 1): from f92, as he slows, the sideways truck blends into a forward dolly toward him, one continuous
// camera (the truck decelerates f92-f146 while the push accelerates out of rest at f92, peaks at f119 and eases out by
// f152, then creeps to the end; the eye lowers 1.12 -> 1.0 m and the framing tilts down onto him), so his paling and the
// cough happen as the camera comes in, and it lands on a close frame of him seated (head to feet ~61 % of the frame,
// the face ~y 470-690, the lungs above y 1000, a little right of centre). Behind him everything softens by its depth as
// the camera comes in (a little more air, a slight defocus), the glowing people he passed still in shot on his left.
// The bollards in front sweep down and out of frame to the left (the one that stood at X 450 moved to 520: no post in
// front of him in the payoff frame). The
// hold (f146-f157): him slumped on the bench right of centre, turned a little toward the street he walked, his hands in his
// lap (the lungs' glow in view); on the left, at three depths, glowing people still about: the flat cap and the girl
// a step back, chatting; the first passer-by, the teal puffer with her coffee, walking back in days later; the
// white-haired woman nearer us, waiting by the bench; a well man walks in on the right; two well friends talk inside
// the cafe.
// Orange = the virus only (the lungs' glow, his air (the haze), the cough's specks; a faint chest halo at night). The set, the
// clothes and the lights are muted local colours and cream; no text, no numbers.
//
// DEPTH (review 1: pushed in, the eye lowered): eye 200 units (1.12 m, his chest) up, dRef 760 at kRef 2.9, dolly
// 0.5 through f92 (the walking Carrier ~50 % of the frame's height); the push (user revision 1, severalDaysPlan rigAt)
// dollies the eye from 760 to ~511 units from his plane at a nearly constant focal length (k 2.9 -> 4.4) and lowers it
// to 178 units; fog by the eye's distance (palette A, the day
// mood blended into the night mood by the clock). Z: kerb -240, bollards -214, lampposts -214, the Carrier 0, the
// bench 34-92, passers-by 300-600, the cafe guests 880, the shop row's front 780, the far city 1700-2600.
//
// SOURCES (header only, nothing on screen): incubation ~5 days median (Lauer et al., Ann Intern Med 2020);
// infectious from ~2 days before symptoms (He et al., Nat Med 2020).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirShadow, AirStage, WorldSvg, mixHex, swayCam, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { BreathSpecks, CovidFigure, POSES, breathe, covidAnchors, type CovidPose, type Speck } from "./covidFolk";
import { AURA, AuraGlow, auraFor, standingHeight } from "./covidAura";
import { HazeCloud, breathRhythm, hazeAt, type Haze, type HazeEmitter, type HazeOpts } from "./covidHaze";
import { cycleWorldOf, type CycleWorld } from "./severalDaysAir";
import {
  BACKS,
  COUGH,
  DEPTH,
  depthAt,
  DURATION,
  ENCOUNTERS,
  FPS,
  PASSERS,
  c01,
  camAt,
  hash1,
  heroAtX,
  heroPoseRaw,
  heroSick,
  lerp,
  nightAt,
  pushAt,
  sst,
  sunAt,
  BACK_LAMPS,
  BOLLARDS,
  LAMPS,
  Z_BACK_LAMP,
  Z_KERB,
  Z_LAMP,
  Z_SHOP,
  walkerPose,
  walkerX,
  type Walker,
} from "./severalDaysPlan";
import { Alley, BackLamps, Bench, Bollards, CastShadows, FarCity, Ground, LampCones, LampPools, LanternGlow, Lanterns, Lampposts, ShopGlow, ShopRow, lampLit, type Caster, type Inside } from "./severalDaysStreet";

export { DURATION, FPS };
/** haze: false draws the cut without the shared air (a check: the frames diff-blend against the revision without it) */
/** aura: false draws revision 1 (h4) exactly: no aura, the cloud at strength 1 (a check: the frames diff-blend against it) */
export const schema = z.object({ haze: z.boolean().default(true), aura: z.boolean().default(true) });
export const defaultProps = schema.parse({});

/** the covidFolk glow this cut was approved and delivered with (Round 3, "v3"); pinned so the committed source
 *  re-renders the delivered .mov exactly (covidFolk's default moved on to "v4") */
const GLOW = "v3" as const;

/** the push's softening of what lies behind him (at the end, at the shop row's depth): a defocus (screen px at
 *  full size) and a little more air on the people */
const DOF_PX = 3;
const DOF_AIR = 0.2;

const REST = swayCam(camAt(0), 0);
const camOf = (f: number) => swayCam(camAt(f), f);

// ===================================================================================================================
// THE CARRIER'S PERFORMANCE: the plan's walk / stop / sit, plus the greetings, the cough and the illness
// ===================================================================================================================
const bump = (f: number, a: number, b: number, c: number, d: number) => sst(a, b, f) * (1 - sst(c, d, f));
export const heroPose = (f: number): CovidPose => {
  let q = heroPoseRaw(f);
  const sick = heroSick(f);
  // the greetings: as each passer-by comes up he turns his head a little to them, looks, smiles, says hi (the puff)
  let turn = 0;
  let hi = 0;
  let nod = 0;
  for (const ks of ENCOUNTERS) {
    turn = Math.max(turn, bump(f, ks - 17, ks - 10, ks + 1, ks + 9));
    hi = Math.max(hi, bump(f, ks - 10, ks - 8, ks - 5, ks - 2));
    nod = Math.max(nod, Math.sin(Math.PI * c01((f - (ks - 10)) / 10)) ** 2 * (f > ks - 10 && f < ks ? 1 : 0));
  }
  const well = 1 - sick;
  q = {
    ...q,
    headYaw: q.headYaw + 0.12 * turn * well,
    pitch: q.pitch + 5 * nod * well - 3 * turn * well,
    look: [lerp(q.look?.[0] ?? 0, 0.55, turn * well), lerp(q.look?.[1] ?? 0, -0.12, turn * well)],
    mouth: lerp(0.32, 0, sst(98, 112, f)),
    open: Math.max(q.open ?? 0, 0.34 * hi * well),
  };
  // the cough fit (the near fist to the mouth), while he slows and stops
  const ct = c01((f - COUGH[0]) / (COUGH[1] - COUGH[0]));
  if (ct > 0 && ct < 1) q = POSES.cough(q, ct, 2, "fist");
  // the illness: drooping lids, worried brows (the cast's sick does the skin, the flush, the sweat, the hunch)
  q = { ...q, worry: Math.max(q.worry ?? 0, 0.7 * sick), lids: Math.max(q.lids, 0.35 * sick), hunch: Math.max(q.hunch ?? 0, 0.35 * sick) };
  // seated, both hands rest in his lap (a hand at the chest covered a lung: review 1, the glow must read as lungs)
  return q;
};

// ===================================================================================================================
// THE WALKERS (passers-by and the people behind): a walk with planted feet at their own pace; the passers-by glance
// at him and smile as they meet
// ===================================================================================================================
export const walkerPoseAt = (w: Walker, f: number): CovidPose => {
  let q = walkerPose(w, f);
  if (w.enc) {
    const ks = w.enc.ks;
    const g = bump(f, ks - 16, ks - 9, ks + 2, ks + 10);
    // they glance at him (straight ahead of them), a small smile
    q = { ...q, look: [0.45 * g * w.dir, -0.04 * g], headYaw: q.headYaw - 0.08 * g * w.dir, mouth: 0.15 + 0.2 * g };
  }
  return q;
};

// ===================================================================================================================
// THE SHARED AIR (user revision 1: no puffs aimed at people; covidHaze, the clip's shared air, as cut 3): a subtle warm
// cloud round his head and shoulders that he carries along the street (the envelope, centred on his head now), and a
// short faint trail left hanging where he walked (his exhale puffs and motes stay where they were breathed out and fade
// over ~30-40 frames, so the street never fills with orange). Each passer-by walks into the front of his cloud (its lobe
// fills as he says hi) and on through it behind him; their chest starts to kindle a few frames after their face enters
// it (the timetable of the delivered cut: kindles at ENCOUNTERS). The cough adds to the air (and keeps its spray of
// specks out past his fist, as delivered).
// ===================================================================================================================
const HERO_A = new Map<number, ReturnType<typeof covidAnchors>>();
/** his anchors at integer frame fi, world px (his plane Z 0: world px = units) */
const heroA = (fi: number) => {
  const hit = HERO_A.get(fi);
  if (hit) return hit;
  const a = covidAnchors("carrier", heroPose(fi), [heroAtX(fi), 0], 1);
  HERO_A.set(fi, a);
  return a;
};
/** saying hi to each passer-by (talking: the cloud's front lobe fills), and the cough (more breathed out, pushed) */
const talkAt = (f: number) => {
  let hi = 0;
  for (const ks of ENCOUNTERS) hi = Math.max(hi, bump(f, ks - 13, ks - 9, ks - 3, ks + 3));
  return hi;
};
const coughAt = (f: number) => bump(f, COUGH[0], COUGH[0] + 4, COUGH[1] - 4, COUGH[1]);
/** TWO EMITTERS, one breath. THE CLOUD he carries: cut 3's look values (HAZE) on an anchor that walks with him (his
 *  feet now), so the envelope, its puffs and its motes go along the street with him; the lobe and the halo a little
 *  lower (no seated neighbour: the passers-by walk through its edge). THE TRAIL: the same breath, anchored to the
 *  street (what he breathes out stays where it was breathed out): only a thin share of short-lived puffs and motes,
 *  fading over ~30-40 frames behind him, so the street never fills with orange. */
const HAZE_CARRIED: Partial<HazeOpts> = { lobeW: 5, haloW: 0.9, moteRate: 0.42 };
/** USER REVISION 2 ("a slightly more pronounced aura", COMMON.md THE AURA): his cloud and trail a step stronger, by cut
 *  3's ratio (covidHaze strength 1.42 over the street values below), and the light the virus throws (covidAura): round
 *  him as cut 3 (the full aura behind him, AURA_BACK, a share over him, AURA_FRONT), round every infected passer-by as
 *  cut 39 (the standard aura over the figure, kindling with their glow) */
export const HAZE_STRENGTH = 1.42;
export const AURA_FRONT = 0.35;
export const AURA_BACK = { rK: 0.55 / 0.4, aK: 0.75 / 0.65 };
/** the people behind him soften with the push's depth (rev 1), their light too: up to a quarter less at the shop row's
 *  depth at the end (the end group still glows as a group of lit people; he stays the one the eye goes to) */
const AURA_DEEP = 0.25;
/** his back aura's size through the push: cut 3's AURA_BACK radius while he walks (~500 px on screen at k 2.9); as the
 *  camera comes in it eases (with the push) to a fixed ~445 px on screen, so it keeps wrapping his head and shoulders
 *  but no longer washes the background (the well man on the right, the shop front beyond the group) */
const BACK_PX_END = 445;
const backRK = (f: number, k: number) => {
  const u = sst(0, 0.8, pushAt(f));
  const perK = AURA.personR * standingHeight("carrier", 0) * k;
  return lerp(AURA_BACK.rK, BACK_PX_END / perK, u);
};
/** the veil's strength by the camera: the walk is framed at ~2.9 px per unit (cut 3 lands at ~3.9), so the walk's
 *  veil is a little stronger than cut 3's to stay a warm tint at phone size; as the push comes in (4.4 px per unit) it
 *  eases back toward cut 3's values */
const veilAt = (f: number) => {
  const u = pushAt(f);
  return { gain: lerp(0.045, 0.032, u), cap: lerp(0.3, 0.26, u) };
};
const HAZE_TRAIL: Partial<HazeOpts> = { gain: 0, life: 44, puffGain: 0.035, moteRate: 0.22, moteLife: 58, moteFade: [12, 0.4], boundBack: 900, boundFwd: 900 };
const heroLocal = (f: number) => covidAnchors("carrier", heroPose(Math.round(f)), [0, 0], 1);
const HL = new Map<number, ReturnType<typeof covidAnchors>>();
const heroL = (f: number) => {
  const fi = Math.round(f);
  const hit = HL.get(fi);
  if (hit) return hit;
  const a = heroLocal(fi);
  HL.set(fi, a);
  return a;
};
const breath = {
  // he faces right the whole cut (seated he turns only a little to the street): the lobe stays on his right, no flip
  dirAt: (): P2 => [1, 0.15],
  amountAt: (f: number) => c01(breathRhythm(f, 96, 0.7) * (1 + 0.25 * coughAt(f))),
  pushAt: (f: number) => Math.max(0.3, talkAt(f), 0.8 * coughAt(f)),
};
type Avoid = { c: P2; r: number; layer?: "front" | "all" };
/** at the end (seated, alone on the bench: nobody on his right) the cloud's front lobe and wide halo stay at the
 *  revision-1 strength (their weights / strength), so the stronger cloud stays round him and the well man on his right
 *  and the shop front are not warmed (director, u2b) */
const sideAt = (f: number, strength: number) => {
  const u = sst(0, 0.8, pushAt(f));
  const k = lerp(1, 1 / strength, u);
  return { lobeW: (HAZE_CARRIED.lobeW ?? 5) * k, haloW: (HAZE_CARRIED.haloW ?? 0.9) * k };
};
export const hazeOf = (A: CycleWorld, f: number, avoid: Avoid[], strength = HAZE_STRENGTH): Haze => {
  const hxNow = heroAtX(f);
  const carried: HazeEmitter = {
    ...breath,
    // rig units from his feet now (his plane Z 0)
    project: (u) => ({ p: A.P.p(hxNow + u[0], u[1], u[2]), s: A.P.r(u[2]) }),
    mouthAt: (g) => {
      const m = heroL(g).mouth;
      return [m[0], m[1], 0];
    },
    centreAt: (g) => {
      const c = heroL(g).headC;
      return [c[0], c[1], 0];
    },
    seed: 21.3,
    opts: { ...HAZE_CARRIED, ...veilAt(f), ...sideAt(f, strength), strength },
  };
  const trail: HazeEmitter = {
    ...breath,
    // anchored to the street (the world's origin): units = world units on his walk line
    project: (u) => ({ p: A.P.p(u[0], u[1], u[2]), s: A.P.r(u[2]) }),
    mouthAt: (g) => {
      const m = heroA(Math.round(g)).mouth;
      return [m[0], m[1], 0];
    },
    centreAt: (g) => {
      const c = heroA(Math.round(g)).headC;
      return [c[0], c[1], 0];
    },
    seed: 7.9,
    opts: { ...HAZE_TRAIL, cap: veilAt(f).cap, strength },
  };
  return hazeAt([carried, trail], f, { avoid, below: A.cam.cy + (1050 - 960) / A.k });
};
/** the cough's spray: a burst at each cough, out past the fist, falling and fading (world-anchored specks) */
const coughSpray = (f: number): Speck[] => {
  const out: Speck[] = [];
  const nC = 2;
  for (let c = 0; c < nC; c++) {
    const ct = COUGH[0] + (COUGH[1] - COUGH[0]) * (0.16 + (0.66 * (c + 0.08)) / nC);
    if (f < ct) continue;
    for (let j = 0; j < 9; j++) {
      const b = ct + j * 0.35;
      const age = f - b;
      if (age < 0 || age > 34) continue;
      const h1 = hash1(c * 31 + j * 1.3 + 5);
      const h2 = hash1(c * 17 + j * 2.9 + 9);
      const O = heroA(Math.round(b)).mouth;
      const u = age / 34;
      const s = 80 * (1 - Math.pow(1 - u, 2.2)) * (0.6 + 0.6 * h2);
      const th = 0.8 * (2 * h1 - 1) - 0.1;
      const dx = Math.cos(th);
      const dy = Math.sin(th) + 0.25;
      const p: P2 = [O[0] + 10 + dx * s, O[1] + dy * s + 14 * u * u];
      const a = 0.75 * sst(0, 0.05, u) * Math.pow(1 - u, 1.2);
      out.push({ p, r: Math.max(0.8, 1.0 + 1.1 * h2), a });
    }
  }
  return out;
};

// ===================================================================================================================
// THE PEOPLE INSIDE (the street's far life): two friends at a cafe table behind the glass, talking (well). The cafe
// stays on his left (behind him) the whole cut, so they never sit in a puff's path.
// ===================================================================================================================
const GUESTS = [
  { kind: "commuter" as const, variant: 2, X: -212, dir: 1 as const, seed: 7 },
  { kind: "elder" as const, variant: 2, X: -78, dir: -1 as const, seed: 9 },
];
const Z_GUEST = 880;
const cafeInside = (A: CycleWorld, frame: number): Inside => (s, o, i, lit) => {
  if (s.kind !== "cafe" || i !== 0) return null;
  const P = A.P;
  const room = mixHex(A.tone("#3B4947", Z_GUEST, 200), A.tone("#6A5A45", Z_GUEST, 200), lit);
  const fog = { rgb: room, amount: lerp(0.42, 0.3, lit) };
  const tb = (X0: number, X1: number, Y0: number, Y1: number) => {
    const q = [P.p(X0, Y0, Z_GUEST), P.p(X1, Y0, Z_GUEST), P.p(X1, Y1, Z_GUEST), P.p(X0, Y1, Z_GUEST)];
    return `M${q.map((v) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`).join("L")}Z`;
  };
  void o;
  return (
    <g>
      {GUESTS.map((g, k) => {
        const { at, scale } = P.at(g.X, Z_GUEST);
        const base = { ...POSES.sit(g.dir), yaw: g.dir * 0.9, headYaw: g.dir * 0.8 };
        const q = breathe(POSES.chat(base, frame + 40 * k, g.dir, 0.8, g.seed), frame, 1, g.seed);
        return <CovidFigure key={k} kind={g.kind} variant={g.variant} pose={q} at={at} scale={scale} uid={`gst${k}`} frame={frame} fog={fog} unitPx={A.k} glowStyle={GLOW} />;
      })}
      {/* their small table and two cups */}
      <path d={tb(-168, -122, -134, -126) + tb(-147, -143, -126, -92)} fill={mixHex(A.tone("#5E452F", Z_GUEST, 120), room, 0.4)} />
      <path d={tb(-162, -152, -148, -134) + tb(-138, -128, -148, -134)} fill={mixHex(A.tone("#D9CDB4", Z_GUEST, 140), room, 0.35)} />
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
type Item = { Z: number; el: React.ReactNode };
const SeveralDaysBeforeIllness: React.FC<z.infer<typeof schema>> = ({ haze: withHaze = true, aura: withAura = true }) => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const n = nightAt(frame);
  const sun = sunAt(frame);
  const A = cycleWorldOf({ cam, rest: REST, depth: depthAt(frame), restDepth: DEPTH, frame, night: n, side: sun.side });
  const P = A.P;
  // THE PUSH's depth: as the camera comes in on him, everything behind him softens by its depth (a little more air,
  // a slight defocus), so the sick man stands out against the glowing people he passed (user revision 1)
  const u = pushAt(frame);
  const deep = (Z: number) => u * Math.pow(c01((Z - 120) / 660), 0.8);
  const dofDef = (Z: number, id: string) => {
    const sd = (DOF_PX * deep(Z)) / A.k;
    return sd * A.k < 0.15 ? null : (
      <filter id={id} x="-15%" y="-10%" width="130%" height="120%">
        <feGaussianBlur stdDeviation={sd} />
      </filter>
    );
  };
  /** a figure's fog: by its depth (the kit's figFog, plus the push's air), then the night (less inside a lamp's pool) */
  const figFog = (X: number, Z: number) => {
    const b0 = A.folkFog(Z);
    const base = { rgb: b0.rgb, amount: 1 - (1 - b0.amount) * (1 - DOF_AIR * deep(Z)) };
    const lit = c01(lampLit(X, frame, Z));
    const nt = n * 0.46 * (1 - 0.6 * lit);
    const amount = 1 - (1 - base.amount) * (1 - nt);
    const night = A.airHex(Z, 150);
    return { rgb: amount > 0 ? mixHex(base.rgb as string, night, nt / Math.max(1e-6, amount)) : night, amount };
  };
  const half = 540 / A.k;
  const items: Item[] = [];
  /** the time-lapse shadows' casters (a figure's height from its head anchor) */
  const casters: Caster[] = [];
  const avoid: Avoid[] = [];
  /** the light fades out above the caption bands (screen rows 960 -> 1070, as cut 3) */
  const fadeB: [number, number] = [cam.cy + (960 - 960) / cam.k, cam.cy + (1070 - 960) / cam.k];
  /** at night an infected chest glows into the dark air round it (a soft orange halo at the chest) */
  const halo = (kind: Walker["kind"], variant: number, q: CovidPose, at: P2, scale: number, inf: number, uid: string) => {
    const a = n * inf;
    if (a < 0.02) return null;
    const c = covidAnchors(kind, q, at, scale, { variant }).chest;
    return (
      <g style={{ mixBlendMode: "screen" }}>
        <defs>
          <radialGradient id={`${uid}hl`}>
            <stop offset="0" stopColor="#FFB000" stopOpacity={0.3} />
            <stop offset="0.45" stopColor="#D98A0C" stopOpacity={0.1} />
            <stop offset="1" stopColor="#D98A0C" stopOpacity={0} />
          </radialGradient>
        </defs>
        <ellipse cx={c[0]} cy={c[1] + 6 * scale} rx={95 * scale} ry={110 * scale} fill={`url(#${uid}hl)`} opacity={a} />
      </g>
    );
  };
  const addWalker = (w: Walker, uid: string) => {
    const X = walkerX(w, frame);
    const r = P.r(w.Z);
    if (Math.abs(P.p(X, 0, w.Z)[0] - cam.cx) > half + 160 * r) return;
    const { at, scale } = P.at(X, w.Z);
    const q = walkerPoseAt(w, frame);
    const inf = w.inf(frame);
    casters.push({ X, Z: w.Z, H: -covidAnchors(w.kind, q, [0, 0], 1, { variant: w.variant }).headTop[1] + 8, W: 66 });
    // the haze's motes never ride a passer-by's face or body (the veil passes over them: they walk through it)
    const wa = covidAnchors(w.kind, q, at, scale, { variant: w.variant });
    avoid.push({ c: wa.headC, r: 46 * scale }, { c: wa.chest, r: 60 * scale }, { c: wa.hip, r: 55 * scale });
    const dof = dofDef(w.Z, `${uid}dof`);
    items.push({
      Z: w.Z,
      el: (
        <g key={uid} filter={dof ? `url(#${uid}dof)` : undefined}>
          {dof ? <defs>{dof}</defs> : null}
          <AirShadow A={A} X={X} Z={w.Z} w={58} d={28} uid={`${uid}s`} amt={0.8} />
          <CovidFigure kind={w.kind} variant={w.variant} pose={q} at={at} scale={scale} uid={uid} infected={inf} frame={frame} fog={figFog(X, w.Z)} unitPx={cam.k} hold={w.hold} glowStyle={GLOW} />
          {halo(w.kind, w.variant, q, at, scale, inf, uid)}
          {withAura && inf > 0.01 ? <AuraGlow aura={auraFor(w.kind, q, at, scale, inf, { variant: w.variant, aK: 1 - AURA_DEEP * deep(w.Z) })} uid={`${uid}au`} fog={figFog(X, w.Z)} fadeBelow={fadeB} /> : null}
        </g>
      ),
    });
  };
  BACKS.forEach((w) => addWalker(w, `bk${w.id}`));
  PASSERS.forEach((w) => addWalker(w, `ps${w.id}`));
  items.push({ Z: 60, el: <Bench key="bench" A={A} /> });
  // the Carrier, his breath just behind him
  const hx = heroAtX(frame);
  const H = P.at(hx, 0);
  const hq = heroPose(frame);
  casters.push({ X: hx, Z: 0, H: -covidAnchors("carrier", hq, [0, 0], 1).headTop[1] + 10, W: 76 });
  for (const X of BOLLARDS) casters.push({ X, Z: Z_KERB + 26, H: 112, W: 18 });
  for (const X of LAMPS) casters.push({ X, Z: Z_LAMP, H: 1400, W: 15 });
  for (const X of BACK_LAMPS) casters.push({ X, Z: Z_BACK_LAMP, H: 700, W: 11 });
  // his air: the cloud behind his centre before him (the people behind are inside it), the part in front after him
  avoid.push({ c: heroA(frame).headC, r: 30, layer: "front" });
  items.push({ Z: 1, el: <BreathSpecks key="hb" specks={coughSpray(frame)} uid="hb" /> });
  if (withHaze) {
    const haze = hazeOf(A, frame, avoid, withAura ? HAZE_STRENGTH : 1);
    const hf = figFog(hx, 0);
    items.push({ Z: 1.5, el: <HazeCloud key="hzb" haze={haze} layer="back" uid="hzb" fog={hf} /> });
    items.push({ Z: -1, el: <HazeCloud key="hzf" haze={haze} layer="front" uid="hzf" fog={hf} /> });
  }
  items.push({
    Z: 0,
    el: (
      <g key="hero">
        <AirShadow A={A} X={hx} Z={0} w={64} d={30} uid="hs" amt={0.85} />
        <CovidFigure kind="carrier" variant={0} pose={hq} at={H.at} scale={H.scale} uid="hero" infected={1} sick={heroSick(frame)} frame={frame} fog={figFog(hx, 0)} unitPx={cam.k} carry="none" glowStyle={GLOW} />
        {halo("carrier", 0, hq, H.at, H.scale, 1, "hero")}
      </g>
    ),
  });
  if (withAura) {
    // his light: the full aura behind him (it lights the air round him), a share over him (the lungs keep their shape)
    const hisAura = auraFor("carrier", hq, H.at, H.scale, 1, { rK: backRK(frame, cam.k) / AURA_BACK.rK });
    const hisBack = auraFor("carrier", hq, H.at, H.scale, 1, { ...AURA_BACK, rK: backRK(frame, cam.k) });
    items.push({ Z: 0.5, el: <AuraGlow key="aurhb" aura={hisBack} uid="aurhb" fog={figFog(hx, 0)} fadeBelow={fadeB} /> });
    items.push({ Z: -0.5, el: <AuraGlow key="aurhf" aura={{ ...hisAura, a: hisAura.a * AURA_FRONT }} uid="aurhf" fog={figFog(hx, 0)} fadeBelow={fadeB} /> });
  }
  items.sort((a, b) => b.Z - a.Z);
  const setDof = dofDef(Z_SHOP, "sd-setdof");
  const lampDof = dofDef(Z_BACK_LAMP, "sd-lampdof");
  return (
    <AirStage v={A.v} bloom={0.22} shafts={Math.pow(1 - n, 1.3)} motes={1 - 0.5 * n} grade={1 - 0.3 * n} vignette={1 - 0.15 * n}>
      <WorldSvg cam={cam}>
        <g filter={setDof ? "url(#sd-setdof)" : undefined}>
          {setDof ? <defs>{setDof}</defs> : null}
          <FarCity A={A} f={frame} />
          <Alley A={A} />
          <ShopRow A={A} f={frame} inside={cafeInside(A, frame)} />
          <Lanterns A={A} f={frame} />
        </g>
        <Ground A={A} />
        <ShopGlow A={A} f={frame} />
        <LanternGlow A={A} f={frame} />
        <LampPools A={A} f={frame} />
        <CastShadows A={A} sun={sun} casters={casters} bench />
        <g filter={lampDof ? "url(#sd-lampdof)" : undefined}>
          {lampDof ? <defs>{lampDof}</defs> : null}
          <BackLamps A={A} f={frame} />
        </g>
        <LampCones A={A} f={frame} which="back" />
        {items.map((it) => it.el)}
        <Bollards A={A} />
        <Lampposts A={A} />
        <LampCones A={A} f={frame} which="front" />
      </WorldSvg>
    </AirStage>
  );
};

export default SeveralDaysBeforeIllness;
