// ---------------------------------------------------------------------------
// EightBeatsTen (toto-champion-eight, cut 23). Cheeky Pint style (stout) (styles/cheeky-pint.md), revision 1.
// Opaque 1080x1920, 25 fps, 115 frames. The racetrack world is trackWorld.tsx (TrackStage: golden-hour sky, trees,
// grandstand, catch fence, tyre wall, kerbs, asphalt, verge, the finish strip and banner); the karts are champShared's
// KartWithKid (the same drawing as cut 11). Both shared files are imported, never edited.
//
// CHECK LINE: "a smaller, younger kid (8) beat the older kids (10) in the same race: that's the early sign."
//
// THE LINE: "Even with the tiny ones, you can identify the ones that are doing better than their peers. Either |
// because they are younger, you know, if someone that's eight years old beats the ones that are ten in that group,
// you | can have those very early signs..." (this cut: "because ... group, you").
// WORD -> FRAME (animation_source/notes/words_cutB.md; Whisper onsets, may sit early, so beats land ON or after):
//   because 4 · they 10 · are 16 · younger 18 · you know 27-33 · if 34 · someone 37 · that's 42 · eight 49 ·
//   years 52 · old 57 · beats 63 · the 69 · ones 73 · that are 77-85 · ten 85 · in 89 · that 94 · group 98 (-105) ·
//   you 110.
// DURATION: the slot 23.080 -> 27.680 s = 4.60 s x 25 = 115 frames (f0..f114).
//
// THE MOTION (user revision 1: "it must be clear they are in a race ... start on the driver, zoom out to show the
// others, show he's winning; we can tell that he's younger because he's smaller"; blind review: size must compare at
// one depth, and the pass must happen on "beats"): one continuous camera truck alongside the 8-year-old (the cream
// kart, kid 0.70 against the 10s' 1.0, in champShared's smaller kart) on a kart circuit, side view, the world streaming
// past in parallax (verge and near kerb fastest, the sky barely moving). Hard cut in at speed on a CLOSE of him
// (f0-24): k 1.25, his whole kart in frame, flat out. From f24 the camera pulls out while it keeps tracking him (a
// zoom mixed with a dolly back, the eye rising 1.5 -> 4 m) and by f37 reveals the race: he is tucked in right behind a
// bigger 10-year-old in his own lane (nose to tail), the second 10 alongside it on the lane 0.5 m beyond; three karts
// bunched, the 8 last of them. No 10 is ever nearer the camera than him, so the size difference is the kids', not
// distance (the 10s' kids >= 35 % taller on screen through f63-f98, measured below). On "eight" (f49-59) his helmet
// stripe and nose number panel take the amber. On "years old" (f50-60) he darts out of the slipstream 0.5 m toward us and,
// from "beats" (f63), blasts past both (his surge, their fade): the camera keeps trucking with him while he moves
// forward through the group in frame, and by "ten" (f85) he is clearly ahead with daylight behind him. The finish
// (chequered strip across the track + a chequered banner on two posts) streams in from the right and his helmet
// crosses its middle at f99, the 10s trailing. After the line (f99-114) everyone lifts off and the world eases (the
// camera cranes up a little, eye 4 -> 5 m, so the strip reads as a line across the track): both 10s cross behind
// him at the end; everyone still rolling, nothing new. No labels, no numbers, no text.
// AMBER = the talent / potential you can see in a kid (the 8's helmet stripe + nose number panel only); cream = the
// subject, board = context (the 10s' karts lifted toward cream, dim 0.45: ~2.1:1 on the asphalt, accepted by the
// director; their helmets brick and dusty blue so they read as helmets). Nothing black.
// CAUSE -> EFFECT: the karts move only under their own drive (wheels turn by the distance rolled, a road jitter at
// speed, the kids lean forward into a surge and back as they lift); the camera is a truck that follows him.
// THE FINISH is passed to TrackStage only once its banner reaches the frame: while the banner's blurred group lies
// wholly outside the frame, Chrome paints a hard black bar in the top-left corner (preview r3 f0-f63, r4 f75-f82).
//
// SOURCES: none (no real figures; ages from the spoken line).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, EDGE, AmberGradient, amberBandFor, bloomFilter, clamp01, lerp, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { KART, KID, KartWithKid, M, kartScaleFor, type HelmetTone } from "./champShared";
import { OnLane, TRACK, TRACK_RIG, TrackStage, kartJitter, laneGroundY, laneK, planeCam, pullOut, project, type TrackCam } from "./trackWorld";

export const FPS = 25;
export const DURATION = 115;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const ss = (a: number, b: number, f: number) => smoothstep((f - a) / (b - a));
const ss5 = (a: number, b: number, f: number) => {
  const u = clamp01((f - a) / (b - a));
  return u * u * u * (u * (6 * u - 15) + 10);
};
/** a smooth bump 0 -> 1 -> 0: up over a..b, down over c..d */
const bump = (a: number, b: number, c: number, d: number, f: number) => ss(a, b, f) * (1 - ss(c, d, f));

// --- the camera -------------------------------------------------------------------------------------------------------
// close: k 1.25 at 8 m, eye 1.5 m, ground line y 1080; wide: k 0.45 (a 10's kart >= 300 px), pulled out with dolly 0.8
// (the camera ~18 m off: little perspective between the lanes), eye 4 m (the lanes separate), ground line y 970;
// after the line the eye cranes up to 5 m. The pull is f24 -> f52 (C2 smooth).
export const CLOSE = { k: 1.25, D: 8 * M, eye: TRACK_RIG.eye, groundY: 1080 } as const;
export const WIDE = { k: 0.45, eye: 4 * M, groundY: 970 } as const;
const END_EYE = 5 * M;
const PULL = [24, 52] as const;
const DOLLY = 0.8;
/** the 8's helmet on screen (x): his kart centred in the close; left of centre at the reveal (the group ahead of him
 *  in frame); then forward through the group as he passes; on ahead after the line */
const heroSx = (f: number) => 480 - 100 * ss(PULL[0], PULL[1], f) + 360 * ss(56, 92, f) + 60 * ss(97, 114, f);

// --- the race (world px along the track, px / frame) --------------------------------------------------------------------
const SUB = 4;
/** the 8's speed: flat out (130), the surge past them (f56-90, +40: the camera stays <= TRACK.vMax), lifting off after
 *  the line */
const v8 = (f: number) => 130 + 40 * bump(58, 68, 82, 92, f) - 100 * ss(97, 113, f);
const integ = (v: (f: number) => number) => {
  const out: number[] = [0];
  let d = 0;
  for (let f = 0; f < DURATION + 2; f++) {
    for (let s = 0; s < SUB; s++) d += v(f + (s + 0.5) / SUB) / SUB;
    out.push(d);
  }
  return (f: number) => {
    const i = Math.max(0, Math.min(out.length - 2, Math.floor(f)));
    return lerp(out[i], out[i + 1], f - i);
  };
};
const X8 = integ(v8);
/** his lane: 0 (the 10's slipstream) until he darts out toward us on "years old" (f50-60) */
export const HERO_OUT = -0.5 * M;
const heroZ = (f: number) => HERO_OUT * ss5(50, 60, f);
export const HERO_KID = 0.7;

type Racer = { z: number; kid: number; helmet: HelmetTone; stripe: HelmetTone; suit: HelmetTone; seed: number };
type Rival = Racer & { rel: (f: number) => number };
/** the two 10-year-olds: helmet x relative to the 8's (metres). Ahead of him in the close (out of frame right), the
 *  group he is tucked into at the reveal, passed from "beats", trailing at the line and crossing behind him at the end */
const RIVALS: Rival[] = [
  // B: the lane 0.5 m beyond his (drawn first), alongside A at the reveal
  { z: 0.5 * M, kid: 1, helmet: "denim", stripe: "oat", suit: "sage", seed: 2, rel: (f) => 2.3 - 1.1 * ss5(20, 46, f) - 3.3 * ss(58, 86, f) - 0.2 * ss(86, 97, f) - 0.3 * ss(97, 114, f) },
  // A: his own lane, the kart he is tucked in behind (nose to tail)
  { z: 0, kid: 1, helmet: "rust", stripe: "oat", suit: "plum", seed: 5, rel: (f) => 1.95 - 0.2 * ss5(20, 44, f) - 4.15 * ss(60, 87, f) - 0.8 * ss(87, 97, f) - 0.3 * ss(97, 114, f) },
];
/** the 10s: board-toned context lifted toward cream so their bodywork reads on the warm-grey asphalt */
const DIM_10 = 0.45;
const HERO: Racer = { z: 0, kid: HERO_KID, helmet: "cream", stripe: "terracotta", suit: "denim", seed: 0 };
const rivalX = (r: Rival, f: number) => X8(f) + r.rel(f) * M;

/** the camera at frame f (the truck follows the 8 at heroSx; k and D through the pull; the eye rises) */
export const camAt = (f: number): TrackCam => {
  const u = ss5(PULL[0], PULL[1], f);
  const k = Math.exp(lerp(Math.log(CLOSE.k), Math.log(WIDE.k), u));
  const { D } = pullOut(CLOSE.k, CLOSE.D, k, DOLLY);
  const eye = lerp(CLOSE.eye, WIDE.eye, u) + (END_EYE - WIDE.eye) * ss(90, 114, f);
  const groundY = lerp(CLOSE.groundY, WIDE.groundY, u);
  return { x: X8(f) - (heroSx(f) - 540) / k, k, D, eye, groundY };
};

/** the finish: its strip's middle under his helmet at f99 ("group") */
export const CROSS_F = 99;
const FIN_LEN = 1.2 * M;
export const FINISH_X = X8(CROSS_F) - FIN_LEN / 2;
/** the banner's world extent past the strip's leading edge (trackWorld BANNER: left -1.4 m, right 2.6 m, z 6 m) */
const BANNER_X = [-1.4 * M, 2.6 * M] as const;
const BANNER_Z = 6 * M;
/** handed to the stage only once the banner reaches the frame: while its blurred group lies wholly outside the
 *  frame (r4: f75-f82, its left edge at x 1424 -> 1095), Chrome paints a black bar in the top-left corner. The banner
 *  sits left of the strip, so the strip is still out of frame when the finish switches on (checked below). */
const finishNear = (cam: TrackCam) => {
  const bl = project(cam, FINISH_X + BANNER_X[0], 0, BANNER_Z)[0];
  const br = project(cam, FINISH_X + BANNER_X[1], 0, BANNER_Z)[0];
  return bl < 1075 && br > 5;
};

// --- the 8's amber number panel -----------------------------------------------------------------------------------------
// champShared draws a blank number panel on every kart's nose; its box is not exported, so it is restated here from
// champShared's kartGeom (`plate`: top-left at kart metres (0.93, 0.185), 0.15 x 0.10 m, corner 0.022 m, riding the
// bob) and drawn OVER the shared kart in the amber band with the kit bloom (lane coordinates: y 0 = the ground).
const PLATE = { x: 0.93, y: 0.185, w: 0.15, h: 0.1, r: 0.022 } as const;
const AmberPlate: React.FC<{ x: number; ks: number; bob: number; k: number; amber: number; band: [number, number] }> = ({ x, ks, bob, k, amber, band }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  if (amber <= 0.002) return null;
  const s = M * ks;
  const px = x + PLATE.x * s;
  const py = -PLATE.y * s - bob;
  const d = rectPath(px, py, PLATE.w * s, PLATE.h * s, PLATE.r * s);
  return (
    <g opacity={clamp01(amber)}>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
      </defs>
      <path d={d} fill={`url(#${uid}a)`} style={{ filter: bloomFilter(k) }} />
      <path d={`M${px + PLATE.r * s} ${py + EDGE.HOT / k / 2}H${px + (PLATE.w - PLATE.r) * s}`} stroke={COLOR.amberHot} strokeWidth={EDGE.HOT / k} />
    </g>
  );
};

// --- per-frame state (also used by the load-time checks) ---------------------------------------------------------------
type KartState = { x: number; v: number; acc: number; z: number; kid: number; ks: number; racer: Racer; is8: boolean };
/** far lane first, then his lane's 10, then him (always the nearest) */
const kartsAt = (f: number): KartState[] => {
  const st = (racer: Racer, xf: (f: number) => number, zz: number, is8: boolean): KartState => {
    const v = xf(f + 0.5) - xf(f - 0.5);
    const acc = xf(f + 1) - 2 * xf(f) + xf(f - 1);
    return { x: xf(f), v, acc, z: zz, kid: racer.kid, ks: kartScaleFor(racer.kid), racer, is8 };
  };
  return [st(RIVALS[0], (g) => rivalX(RIVALS[0], g), RIVALS[0].z, false), st(RIVALS[1], (g) => rivalX(RIVALS[1], g), RIVALS[1].z, false), st(HERO, X8, heroZ(f), true)];
};
const amberAt = (f: number) => ss(49, 59, f);

/** screen box of a kart (x from rear to nose, y from helmet top to ground) and its kid's height on screen */
const kartBox = (cam: TrackCam, s: KartState) => {
  const kz = laneK(cam, s.z);
  const [rx] = project(cam, s.x + KART.rear * M * s.ks, 0, s.z);
  const [nx] = project(cam, s.x + KART.nose * M * s.ks, 0, s.z);
  const gy = laneGroundY(cam, s.z);
  const kidH = KID.helmetTop * s.kid * M * kz;
  const top = gy - kidH;
  const face = gy - KID.helmetY * s.kid * M * kz;
  const [hx] = project(cam, s.x, 0, s.z);
  const seat = gy - 0.2 * s.ks * M * kz;
  return { rx, nx, gy, top, face, hx, seat, kidH, w: nx - rx };
};
/** world x of a kart's rear and nose */
const ends = (s: KartState) => [s.x + KART.rear * M * s.ks, s.x + KART.nose * M * s.ks] as const;

// --- load-time checks ----------------------------------------------------------------------------------------------------
(() => {
  // EBT_PROBE=1 (probe scripts only): print instead of throwing
  const probe = typeof process !== "undefined" && !!process.env?.EBT_PROBE;
  const fail = (m: string) => {
    if (probe) console.log(`CHECK: ${m}`);
    else throw new Error(`EightBeatsTen: ${m}`);
  };
  for (let f = 0; f < DURATION; f++) {
    const cam = camAt(f);
    const ks = kartsAt(f);
    const [B, A, H] = ks;
    for (const s of ks) {
      if (s.v <= 0) fail(`a kart rolls backward at f${f}`);
      const b = kartBox(cam, s);
      // faces (helmets) above the caption bands
      if (b.nx > 0 && b.rx < 1080 && b.top < 1250 && b.face > 1060) fail(`a face in the caption band at f${f}`);
      // riders (the kid down to the seat) above the first caption band wherever the rider is in frame
      if (b.hx > -60 && b.hx < 1140 && b.seat > 1080) fail(`a rider in the caption band at f${f} (seat y ${b.seat.toFixed(0)})`);
    }
    // no 10 nearer the camera than him (so his smaller size is never distance)
    if (A.z < H.z - 0.5 || B.z < H.z - 0.5) fail(`a 10 is nearer the camera than him at f${f}`);
    // same-lane karts never overlap (A and him share a lane until he is out of it)
    if (Math.abs(A.z - H.z) < 0.3 * M) {
      const [hr, hn] = ends(H);
      const [ar, an] = ends(A);
      if (hn > ar - 0.08 * M && an > hr - 0.08 * M) fail(`he and the 10 in his lane overlap at f${f}`);
    }
    const hero = kartBox(cam, H);
    if (hero.nx > 1062 || hero.rx < 20) fail(`the 8's kart leaves the frame at f${f} (${hero.rx.toFixed(0)}-${hero.nx.toFixed(0)})`);
    // the close is only him
    if (f < 24) for (const s of [A, B]) {
      const b = kartBox(cam, s);
      if (b.nx > 0 && b.rx < 1080) fail(`a 10 is in the close at f${f}`);
    }
    // the reveal (f37-55): three bunched, he is level with or just behind the 10s (no 10 nose more than 1.5 m ahead of his)
    if (f >= 37 && f <= 55) for (const s of [A, B]) {
      const lead = (ends(s)[1] - ends(H)[1]) / M;
      if (lead < -0.1 || lead > 2.0) fail(`not bunched at f${f} (a 10 leads him by ${lead.toFixed(2)} m)`);
    }
    // by "ten" (f85): clearly ahead, daylight between his tail and every 10's nose
    if (f >= 85) for (const s of [A, B]) if (ends(s)[1] > ends(H)[0] - 0.25 * M) fail(`no daylight behind him at f${f}`);
    // the size read: the 10s' kids >= 35 % taller than his on screen, f63-f98
    if (f >= 63 && f <= 98) for (const s of [A, B]) if (kartBox(cam, s).kidH < 1.35 * hero.kidH) fail(`a 10's kid only ${(kartBox(cam, s).kidH / hero.kidH).toFixed(2)}x his at f${f}`);
    // the camera stays within the world's pattern speed (no strobing)
    const vc = camAt(f + 0.5).x - camAt(f - 0.5).x;
    if (vc > TRACK.vMax) fail(`the truck is ${vc.toFixed(0)} px/f at f${f}`);
  }
  // the wide frames: all three karts whole and readable
  for (const f of [56, 63, 75, 85, 98]) {
    const cam = camAt(f);
    for (const s of kartsAt(f)) {
      const b = kartBox(cam, s);
      if (b.rx < 0 || b.nx > 1080) fail(`a kart is cut by the frame at f${f}`);
      if (s.kid === 1 && b.w < 300) fail(`a 10's kart is ${b.w.toFixed(0)} px wide at f${f}`);
    }
  }
  // the 10s still behind the line when he crosses
  for (const s of kartsAt(CROSS_F).slice(0, 2)) if (ends(s)[1] > FINISH_X) fail("a 10 is over the line when he crosses");
  // no pop: the frame the finish switches on, only the banner's left edge is entering (the strip still out of frame)
  for (let f = 1; f < DURATION; f++)
    if (finishNear(camAt(f)) && !finishNear(camAt(f - 1))) {
      const c = camAt(f);
      const strip = Math.min(...[TRACK.asphalt[0], 0, TRACK.asphalt[1]].map((zz) => project(c, FINISH_X, 0, zz)[0]));
      if (strip < 1090 || project(c, FINISH_X + BANNER_X[0], 0, BANNER_Z)[0] < 1010) fail(`the finish pops in at f${f}`);
    }
})();

// --- the cut -------------------------------------------------------------------------------------------------------------
const EightBeatsTen: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const vCam = camAt(f + 0.5).x - camAt(f - 0.5).x;
  const ks = kartsAt(f);
  const amber = amberAt(f);
  const band = amberBandFor(planeCam(cam, heroZ(f)));
  return (
    <TrackStage S={f} cam={cam} v={vCam} finish={finishNear(cam) ? { x: FINISH_X } : null}>
      {ks.map((s, i) => {
        const kz = laneK(cam, s.z);
        const speed = clamp01(s.v / 150);
        const j = kartJitter(f, s.racer.seed, 0.6 + 0.4 * speed);
        const bob = j.bob;
        // lean: forward (-) into a surge, back (+) as he lifts; plus the road jitter
        const lean = Math.max(-6, Math.min(6, -s.acc * 1.4)) + j.lean;
        return (
          <OnLane key={i} cam={cam} z={s.z}>
            <KartWithKid x={s.x} y={0} k={kz} scale={s.kid} dim={s.is8 ? 0 : DIM_10} helmet={s.racer.helmet} stripe={s.racer.stripe} suit={s.racer.suit} wheelSpin={s.x} wheelSpeed={s.v} bob={bob} lean={lean} amber={s.is8 ? amber : 0} />
            {s.is8 ? <AmberPlate x={s.x} ks={s.ks} bob={bob} k={kz} amber={amber} band={band} /> : null}
          </OnLane>
        );
      })}
    </TrackStage>
  );
};
export default EightBeatsTen;

/** for the probe scripts: per-frame screen boxes */
export const debugAt = (f: number) => {
  const cam = camAt(f);
  return { cam, karts: kartsAt(f).map((s) => ({ ...kartBox(cam, s), v: s.v, z: s.z })), finish: project(cam, FINISH_X + FIN_LEN / 2, 0, 0)[0], finishNear: finishNear(cam) };
};
