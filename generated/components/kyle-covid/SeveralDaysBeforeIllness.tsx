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
// Four passers-by come toward him one at a time (kindles start f18, f40, f62, f84): he glances, smiles, says hi, a
// soft puff of orange specks drifts onto their face (CONTACT: the first specks reach the mouth 3 frames before the
// kindle starts), they pass behind him and walk on to his left with their chest kindling, unaware. From f99 he
// slows; the illness shows (pale grey-green, the flush, droopy lids, a sweat drop) and he coughs twice into his fist
// (f99-f127, a spray of specks); he stops (f122), turns to the street and sinks onto a bench (f124-f142); the truck
// decelerates in one lobe (f92-f124) and the camera pushes in a little for the bench (k 2.9 -> 3.0, f96-f140). The hold
// (f142-f157): him slumped on the bench right of centre, turned a little toward the street he walked, his hands in his
// lap (the lungs' glow in view); on the left, at three depths, glowing people still about: the flat cap and the girl
// a step back, chatting; the first passer-by, the teal puffer with her coffee, walking back in days later; the
// white-haired woman nearer us, waiting by the bench; a well man walks in on the right; two well friends talk inside
// the cafe.
// Orange = the virus only (the lungs' glow, the breath and cough specks; a faint chest halo at night). The set, the
// clothes and the lights are muted local colours and cream; no text, no numbers.
//
// DEPTH (review 1: pushed in, the eye lowered): eye 200 units (1.12 m, his chest) up, dRef 760 at kRef 2.9, dolly
// 0.5; the walking Carrier ~50 % of the frame's height, seated ~40 %; fog by the eye's distance (palette A, the day
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
import { cycleWorldOf, type CycleWorld } from "./severalDaysAir";
import {
  BACKS,
  COUGH,
  DEPTH,
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
  sst,
  sunAt,
  BACK_LAMPS,
  BOLLARDS,
  LAMPS,
  Z_BACK_LAMP,
  Z_KERB,
  Z_LAMP,
  walkerPose,
  walkerX,
  type Walker,
} from "./severalDaysPlan";
import { Alley, BackLamps, Bench, Bollards, CastShadows, FarCity, Ground, LampCones, LampPools, LanternGlow, Lanterns, Lampposts, ShopGlow, ShopRow, lampLit, type Caster, type Inside } from "./severalDaysStreet";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

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
// THE BREATH (world-anchored specks: each born where his mouth was): a puff steered onto each passer-by's face as he
// says hi (contact = the first specks reach the mouth; the kindle starts there), and the cough's spray. Drawn just
// behind him (between him and the people behind), so no speck ever sits on his own face.
// ===================================================================================================================
const MOUTH = new Map<number, { m: P2; d: P2; s: number }>();
const heroMouthAt = (fi: number) => {
  const hit = MOUTH.get(fi);
  if (hit) return hit;
  const a = covidAnchors("carrier", heroPose(fi), [heroAtX(fi), 0], 1);
  const out = { m: a.mouth, d: a.mouthDir, s: 1 };
  MOUTH.set(fi, out);
  return out;
};
const PMOUTH = new Map<string, P2>();
/** a walker's mouth in the 2D world at frame fi (projected at its depth) */
const walkerMouthAt = (w: Walker, fi: number, A: CycleWorld | null) => {
  const key = `${w.id}|${fi}`;
  const hit = PMOUTH.get(key);
  if (hit) return hit;
  const Afi = A ?? cycleWorldOf({ cam: camOf(fi), rest: REST, depth: DEPTH, frame: fi, night: nightAt(fi) });
  const { at, scale } = Afi.P.at(walkerX(w, fi), w.Z);
  const m = covidAnchors(w.kind, walkerPoseAt(w, fi), at, scale, { variant: w.variant }).mouth;
  PMOUTH.set(key, m);
  return m;
};
const bez = (a: P2, c: P2, b: P2, t: number): P2 => [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]];
const breathOf = (f: number, A: CycleWorld): Speck[] => {
  const out: Speck[] = [];
  // the puffs onto the passers-by
  for (const w of PASSERS) {
    const e = w.enc!;
    if (f < e.puff[0] || f > e.puff[1] + 18) continue;
    const T = walkerMouthAt(w, Math.round(f), A);
    const rate = 4;
    for (let i = Math.ceil(e.puff[0] * rate); i <= Math.floor(Math.min(f, e.puff[1]) * rate); i++) {
      const b = i / rate;
      const age = f - b;
      const h1 = hash1(i * 1.7 + w.seed * 13);
      const h2 = hash1(i * 3.1 + w.seed * 7);
      const h3 = hash1(i * 5.3 + w.seed * 3);
      const travelT = 5 + 2.5 * h2;
      const u = c01(age / travelT);
      if (u >= 1) continue;
      const O = heroMouthAt(Math.round(b));
      const L = Math.hypot(T[0] - O.m[0], T[1] - O.m[1]);
      const C: P2 = [O.m[0] + O.d[0] * L * 0.5, O.m[1] + O.d[1] * L * 0.5 - 6];
      const v = Math.pow(u, 0.85);
      const pt = bez(O.m, C, T, v);
      const nx = -(T[1] - O.m[1]) / Math.max(1, L);
      const ny = (T[0] - O.m[0]) / Math.max(1, L);
      const lat = (2 * h1 - 1) * L * 0.22 * Math.sin(Math.PI * v) + 3 * Math.sin(age * 0.4 + h3 * 6);
      const scaleT = 0.8;
      const r = Math.max(0.9, (1.3 + 1.3 * h2) * lerp(1, scaleT, v));
      const a = sst(0, 0.1, u) * (1 - sst(0.78, 1, u)) * (0.7 + 0.3 * h1);
      out.push({ p: [pt[0] + nx * lat, pt[1] + ny * lat], r, a });
    }
  }
  // the cough's spray: a burst at each cough, out past the fist, falling and fading
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
      const O = heroMouthAt(Math.round(b));
      const u = age / 34;
      const s = 80 * (1 - Math.pow(1 - u, 2.2)) * (0.6 + 0.6 * h2);
      const th = 0.8 * (2 * h1 - 1) - 0.1;
      const dx = Math.cos(th);
      const dy = Math.sin(th) + 0.25;
      const p: P2 = [O.m[0] + 10 + dx * s, O.m[1] + dy * s + 14 * u * u];
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
        return <CovidFigure key={k} kind={g.kind} variant={g.variant} pose={q} at={at} scale={scale} uid={`gst${k}`} frame={frame} fog={fog} unitPx={A.k} />;
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
const SeveralDaysBeforeIllness: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const n = nightAt(frame);
  const sun = sunAt(frame);
  const A = cycleWorldOf({ cam, rest: REST, depth: DEPTH, frame, night: n, side: sun.side });
  const P = A.P;
  /** a figure's fog: by its depth (the kit's figFog), then the night (less inside a lamp's pool) */
  const figFog = (X: number, Z: number) => {
    const base = A.folkFog(Z);
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
    items.push({
      Z: w.Z,
      el: (
        <g key={uid}>
          <AirShadow A={A} X={X} Z={w.Z} w={58} d={28} uid={`${uid}s`} amt={0.8} />
          <CovidFigure kind={w.kind} variant={w.variant} pose={q} at={at} scale={scale} uid={uid} infected={inf} frame={frame} fog={figFog(X, w.Z)} unitPx={cam.k} hold={w.hold} />
          {halo(w.kind, w.variant, q, at, scale, inf, uid)}
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
  const specks = breathOf(frame, A);
  items.push({ Z: 1, el: <BreathSpecks key="hb" specks={specks} uid="hb" /> });
  items.push({
    Z: 0,
    el: (
      <g key="hero">
        <AirShadow A={A} X={hx} Z={0} w={64} d={30} uid="hs" amt={0.85} />
        <CovidFigure kind="carrier" variant={0} pose={hq} at={H.at} scale={H.scale} uid="hero" infected={1} sick={heroSick(frame)} frame={frame} fog={figFog(hx, 0)} unitPx={cam.k} carry="none" />
        {halo("carrier", 0, hq, H.at, H.scale, 1, "hero")}
      </g>
    ),
  });
  items.sort((a, b) => b.Z - a.Z);
  return (
    <AirStage v={A.v} bloom={0.22} shafts={Math.pow(1 - n, 1.3)} motes={1 - 0.5 * n} grade={1 - 0.3 * n} vignette={1 - 0.15 * n}>
      <WorldSvg cam={cam}>
        <FarCity A={A} f={frame} />
        <Alley A={A} />
        <ShopRow A={A} f={frame} inside={cafeInside(A, frame)} />
        <Lanterns A={A} f={frame} />
        <Ground A={A} />
        <ShopGlow A={A} f={frame} />
        <LanternGlow A={A} f={frame} />
        <LampPools A={A} f={frame} />
        <CastShadows A={A} sun={sun} casters={casters} bench />
        <BackLamps A={A} f={frame} />
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
