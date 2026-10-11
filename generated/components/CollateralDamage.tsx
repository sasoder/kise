// ---------------------------------------------------------------------------
// CollateralDamage (plague clip: Dwarkesh Patel with Kyle Harper, "Why the
// plague is so deadly to humans"; sequence 25.125 s - 32.266 s).
//
// CHECK LINE: "The plague's real circuit is rodent to flea to rodent; people
// are bystanders hit by strays, and since nothing that happens to us feeds
// back into that circuit, it never eases off."
//
// SPOKEN (the speaker has just said "It's an animal disease. We're, like,"):
//   "collateral damage. And so it has no evolved incentive to modulate its
//    virulence to be able to transmit sustainably."
// 29.97 fps, f = round((t - 25.125) * 29.97):
//   collateral f5 · damage f17 · And f32 · so f42 · it f45 · has f48 · no f53 ·
//   evolved f63 · incentive f79 · to f93 · modulate f107 · its f122 ·
//   virulence f127 · to f147 · be able to f157 · transmit f168 ·
//   sustainably f181 · speech ends f214.   DURATION = 214 + 6 = 220.
//
// THE MOTION: a closed ring track (marmot at 9 o'clock, flea at 3 o'clock)
// carries a stream of orange germs clockwise at one constant speed and density
// from the first frame to the last. Now and then one germ leaves the ring at a
// tangent on the flea side, flies straight at the same speed and fells a
// bystander; it ends in the body (nothing ever goes back). The camera opens
// close on the flea side for the first hit ("collateral damage", contact f16),
// then pulls back once (k 1.35 -> 1.0 by ~f150) and creeps in on the ring
// through the hold. Each stray draws an inked orange trail from the point where
// it left the ring; after the hit the trail dies to a fine dashed line.
// POLISH PASS (kit v2): bystanders are Vecellio's 1598 woodcut figures, the
// track is an inked, cross-hatched double line with the medallions seated on it. 8 of 13 bystanders are down by ~f215.
//
// FACTS SHOWN: none as figures or text. The picture is the sylvatic cycle of
// Yersinia pestis (rodent -> flea -> rodent) with humans as incidental hosts;
// the medallions are the kit's marmot (Muetzel, Brehms Tierleben) and flea
// (Hooke, Micrographia 1665).
//
// OWN HELPER: `capsule()` below draws the kit's germ mark (same stroke, caps,
// casing and colours as plagueShared's <Germs>) at a GIVEN angle, so germs on
// the track point along their travel; the kit's germ() only takes a seed.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  type CamKey,
  DARK,
  DEAD,
  FPS as KIT_FPS,
  Hatch,
  INK,
  InkStroke,
  Medallion,
  Page,
  Person,
  type Pt,
  WorldSvg,
  clamp01,
  groundHatch,
  hash,
  inkPath,
  mixColor,
  roughen,
  runCamera,
  smoothstep,
} from "./plagueShared";

export const FPS = KIT_FPS;
export const DURATION = 220;

export const schema = z.object({
  /** germs in the stream on the ring */
  streamCount: z.number().int().min(6).max(60),
  /** germ travel speed, world px per frame (ring and strays alike) */
  speed: z.number().min(2).max(30),
  /** germ half-width, world px */
  germR: z.number().min(2).max(14),
  /** frames a struck figure takes to reach the ground */
  fallFrames: z.number().min(8).max(40),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ streamCount: 24, speed: 13, germR: 5.6, fallFrames: 18 });

// ---------------------------------------------------------------------------
// The world (world px == screen px at k 1, camera (540, 960)).
// Angles: position = C + R (cos a, sin a), y down, so a grows CLOCKWISE on
// screen: marmot at a = pi (9 o'clock), top at -pi/2, flea at 0 (3 o'clock).
// ---------------------------------------------------------------------------
const CX = 540;
const CY = 840;
const R = 240; // centre line of the track
const BAND = 20; // half width of the track
const R_STRAY = R + 9; // the lane a germ that will leave rides in
const MED_R = 100;
const DEAD_PAPER = "#9C9482"; // the kit's dead print tone

type Body = { x: number; y: number; h: number; seed: number; variant: number; facing: 1 | -1; hit: number | null };
// (x, y) = the feet. hit = the contact frame (null = never struck). facing = the side it falls to.
export const PEOPLE: Body[] = [
  // above the ring
  { x: 280, y: 452, h: 156, seed: 3, variant: 1, facing: 1, hit: null },
  { x: 545, y: 408, h: 162, seed: 8, variant: 2, facing: 1, hit: null },
  { x: 945, y: 505, h: 154, seed: 12, variant: 5, facing: 1, hit: null },
  // the sides
  { x: 98, y: 915, h: 158, seed: 17, variant: 4, facing: -1, hit: null },
  { x: 926, y: 860, h: 142, seed: 5, variant: 0, facing: 1, hit: 16 },
  { x: 1002, y: 1070, h: 152, seed: 21, variant: 3, facing: -1, hit: 46 },
  // below the caption strip
  { x: 900, y: 1482, h: 156, seed: 26, variant: 2, facing: 1, hit: 86 },
  { x: 560, y: 1655, h: 160, seed: 31, variant: 5, facing: -1, hit: 138 },
  { x: 178, y: 1482, h: 154, seed: 37, variant: 1, facing: -1, hit: 182 },
  { x: 850, y: 1655, h: 158, seed: 44, variant: 4, facing: 1, hit: 166 },
  { x: 722, y: 1482, h: 156, seed: 52, variant: 3, facing: -1, hit: 197 },
  { x: 200, y: 1655, h: 156, seed: 58, variant: 0, facing: -1, hit: 120 },
  { x: 505, y: 1482, h: 162, seed: 63, variant: 4, facing: 1, hit: null },
];

// One stray per struck figure: where it leaves the ring (tangent point), the
// straight run to the chest, and the contact frame.
type Stray = { body: number; hit: number; aLeave: number; tx: number; ty: number; dx: number; dy: number; len: number; px: number; py: number; trail: string };
export const STRAYS: Stray[] = PEOPLE.flatMap((p, i) => {
  if (p.hit === null) return [];
  // aim at the chest, then stop on the near edge of the torso
  const ax = p.x;
  const ay = p.y - p.h * 0.6;
  const rx = ax - CX;
  const ry = ay - CY;
  const d0 = Math.hypot(rx, ry);
  const a0 = Math.atan2(ry, rx) - Math.acos(R_STRAY / d0);
  const t0x = CX + R_STRAY * Math.cos(a0);
  const t0y = CY + R_STRAY * Math.sin(a0);
  const l0 = Math.hypot(ax - t0x, ay - t0y);
  const dx = (ax - t0x) / l0;
  const dy = (ay - t0y) / l0;
  const len = l0 - p.h * 0.1;
  const px = t0x + dx * len;
  const py = t0y + dy * len;
  // the trail it will draw: the same straight run with a graver's slight life in it
  const trail = inkPath(roughen([[t0x, t0y], [px, py]], 20 + i, 1.1));
  return [{ body: i, hit: p.hit, aLeave: a0, tx: t0x, ty: t0y, dx, dy, len, px, py, trail }];
});

// The camera: the flea and the right of the ring, one eased pull-back, then a creep in on the ring.
const CAM: CamKey[] = [
  { f: -40, x: 824, y: 792, k: 1.385 },
  { f: 0, x: 815, y: 800, k: 1.35 },
  { f: 30, x: 798, y: 811, k: 1.315 },
  { f: 148, x: 541, y: 960, k: 1.0 },
  { f: 232, x: 556, y: 969, k: 1.058 }, // the hold: the creep in rides on a slow drift, so nothing ever stops
];

/** the kit's germ mark at a given angle: axis path of one capsule */
const capsule = (x: number, y: number, ang: number, half: number) => {
  const dx = Math.cos(ang) * half;
  const dy = Math.sin(ang) * half;
  return `M${(x - dx).toFixed(2)},${(y - dy).toFixed(2)}L${(x + dx).toFixed(2)},${(y + dy).toFixed(2)}`;
};

// The track: two inked rails (the joins sit under the flea medallion) and the
// annulus between them, hatched.
const ringPts = (r: number): Pt[] => Array.from({ length: 49 }, (_, i): Pt => [CX + r * Math.cos((i / 48) * Math.PI * 2), CY + r * Math.sin((i / 48) * Math.PI * 2)]);
const RAIL_OUT = inkPath(roughen(ringPts(R + BAND), 5, 1.5));
const RAIL_IN = inkPath(roughen(ringPts(R - BAND), 9, 1.5));
const circleD = (r: number) => `M${CX + r},${CY}A${r},${r} 0 1 1 ${CX - r},${CY}A${r},${r} 0 1 1 ${CX + r},${CY}Z`;
const BED = circleD(R + BAND) + circleD(R - BAND);
const MED_SHADOW = (cx: number) => `M${cx + 7 + MED_R + 12},${CY + 10}A${MED_R + 12},${MED_R + 12} 0 1 1 ${cx + 7 - MED_R - 12},${CY + 10}A${MED_R + 12},${MED_R + 12} 0 1 1 ${cx + 7 + MED_R + 12},${CY + 10}Z`;

const ORDER = PEOPLE.map((_, i) => i).sort((a, b) => PEOPLE[a].y - PEOPLE[b].y);

const CollateralDamage: React.FC<Props> = ({ streamCount, speed, germR, fallFrames }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM, frame);
  const half = germR * 0.9;
  const casingW = 2 * germR + Math.max(1.2, germR * 0.5);

  // the stream: constant angular speed, constant count, for ever
  const omega = speed / R;
  let ringD = "";
  for (let i = 0; i < streamCount; i++) {
    const a = ((i + (hash(i, 11) - 0.5) * 0.3) / streamCount) * Math.PI * 2 + omega * frame;
    const r = R - 5 + (hash(i, 12) - 0.5) * 16;
    const wob = (hash(i, 13) - 0.5) * 0.5;
    ringD += capsule(CX + r * Math.cos(a), CY + r * Math.sin(a), a + Math.PI / 2 + wob, half);
  }

  // strays: on the ring (from behind the marmot), in flight, or ended in a body
  let flyD = "";
  const trails: { key: number; d: string; run: number; u: number }[] = [];
  const flyHalf = 15 - germR; // a stray in flight is ~30 px long
  const ended: { key: number; d: string; dead: number }[] = [];
  const fallOf = (p: Body) => (p.hit === null ? 0 : clamp01((frame - p.hit) / fallFrames));
  for (const s of STRAYS) {
    const p = PEOPLE[s.body];
    if (frame <= s.hit) {
      const run = s.len + (frame - s.hit) * speed; // distance past the tangent point
      if (run >= 0) {
        // it stretches as it is flung clear of the track, and draws its own trail
        const hf = half + (flyHalf - half) * smoothstep(run / 70);
        flyD += capsule(s.tx + s.dx * run, s.ty + s.dy * run, Math.atan2(s.dy, s.dx), hf);
        trails.push({ key: s.body, d: s.trail, run, u: 0 });
      } else {
        const a = s.aLeave + run / R_STRAY;
        if (a > -Math.PI) ringD += capsule(CX + R_STRAY * Math.cos(a), CY + R_STRAY * Math.sin(a), a + Math.PI / 2, half);
      }
    } else {
      trails.push({ key: s.body, d: s.trail, run: s.len, u: smoothstep((frame - s.hit) / 12) });
      // it ends here: carried down by the body, dimming to the dead tone
      const fl = fallOf(p);
      const fall = Math.pow(fl, 2.2);
      const ang = (p.facing * 90 * fall * Math.PI) / 180;
      const ox = s.px - p.x;
      const oy = s.py - p.y;
      const x = p.x + ox * Math.cos(ang) - oy * Math.sin(ang);
      const y = p.y - 0.1 * p.h * fall + ox * Math.sin(ang) + oy * Math.cos(ang);
      ended.push({ key: s.body, d: capsule(x, y, Math.atan2(s.dy, s.dx) + ang, half + (flyHalf - half) * (1 - smoothstep(fl / 0.5))), dead: smoothstep((fl - 0.25) / 0.6) });
    }
  }

  return (
    <Page>
      <WorldSvg
        cam={cam}
        defs={
          <>
            <Hatch id="cdHatchA" spacing={6} angle={45} width={1.2} opacity={0.34} />
            <Hatch id="cdHatchB" spacing={6} angle={-45} width={1.2} opacity={0.22} />
            <Hatch id="cdHatchS" spacing={5} angle={35} width={1.2} opacity={0.5} />
          </>
        }
      >
        {/* the track: a cross-hatched bed between two inked rails */}
        <path d={BED} fillRule="evenodd" fill={DARK} fillOpacity={0.5} />
        <path d={BED} fillRule="evenodd" fill="url(#cdHatchA)" />
        <path d={BED} fillRule="evenodd" fill="url(#cdHatchB)" />
        <InkStroke d={RAIL_OUT} width={3} />
        <InkStroke d={RAIL_IN} width={3} />

        {/* the trails: inked orange while the stray flies, then a fine dashed dead line */}
        {trails.map((t) => (
          <g key={t.key}>
            {t.u > 0 ? <InkStroke d={t.d} width={1.8} casing={false} color={DEAD} opacity={0.45 * t.u} dash="8 9" /> : null}
            {t.u < 1 ? <InkStroke d={t.d} width={3} tone={1} opacity={1 - t.u} dash={`${t.run.toFixed(1)} 4000`} /> : null}
          </g>
        ))}

        {/* germs on the ring and in flight */}
        <g fill="none" strokeLinecap="round">
          <path d={ringD + flyD} stroke={DARK} strokeOpacity={0.7} strokeWidth={casingW} />
          <path d={ringD + flyD} stroke={ACCENT} strokeWidth={2 * germR} />
        </g>

        {/* the medallions, seated on the track with a hatch shadow */}
        {[CX - R, CX + R].map((mx) => (
          <g key={mx}>
            <path d={MED_SHADOW(mx)} fill={DARK} fillOpacity={0.55} />
            <path d={MED_SHADOW(mx)} fill="url(#cdHatchS)" />
          </g>
        ))}
        <Medallion kind="marmot" cx={CX - R} cy={CY} r={MED_R} />
        <Medallion kind="flea" cx={CX + R} cy={CY} r={MED_R} />

        {/* the bystanders */}
        {ORDER.map((i) => {
          const p = PEOPLE[i];
          const fl = fallOf(p);
          const land = smoothstep((fl - 0.55) / 0.45);
          return (
            <g key={i}>
              {land > 0 ? (
                <path
                  d={groundHatch(p.x + p.facing * p.h * 0.5, p.y + p.h * 0.03, p.h * 0.56, 17)}
                  fill="none"
                  stroke={INK}
                  strokeWidth={1.3}
                  strokeOpacity={0.4 * land}
                  strokeLinecap="round"
                />
              ) : null}
              <Person
                x={p.x}
                y={p.y}
                h={p.h}
                seed={p.seed}
                variant={p.variant}
                facing={p.facing}
                tone={p.hit !== null && frame >= p.hit ? clamp01((frame - p.hit + 1) / 5) : 0}
                fallen={fl}
              />
            </g>
          );
        })}

        {/* the germs that ended in a body */}
        {ended.map((e) =>
          e.dead < 0.999 ? (
            <g key={e.key} fill="none" strokeLinecap="round" opacity={1 - e.dead * e.dead}>
              <path d={e.d} stroke={DARK} strokeOpacity={0.7 * (1 - e.dead)} strokeWidth={casingW} />
              <path d={e.d} stroke={mixColor(ACCENT, DEAD_PAPER, e.dead)} strokeWidth={2 * germR} />
            </g>
          ) : null,
        )}
      </WorldSvg>
    </Page>
  );
};

export default CollateralDamage;
