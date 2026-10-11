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
// then pulls back once (k 1.5 -> 1.0 by ~f150) and creeps in on the ring
// through the hold. 8 of 13 bystanders are down by ~f215.
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
  INK,
  Medallion,
  Page,
  Person,
  WorldSvg,
  clamp01,
  hash,
  mixColor,
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
const LIFT = 0.55; // how far a fallen body is lifted from the kit's DEAD tone toward cream

type Body = { x: number; y: number; h: number; seed: number; facing: 1 | -1; hit: number | null };
// (x, y) = the feet. hit = the contact frame (null = never struck).
export const PEOPLE: Body[] = [
  // above the ring
  { x: 290, y: 455, h: 140, seed: 3, facing: 1, hit: null },
  { x: 530, y: 415, h: 146, seed: 8, facing: 1, hit: null },
  { x: 930, y: 520, h: 138, seed: 12, facing: 1, hit: null },
  // the sides
  { x: 100, y: 905, h: 142, seed: 17, facing: -1, hit: null },
  { x: 932, y: 858, h: 135, seed: 5, facing: 1, hit: 16 },
  { x: 1000, y: 1068, h: 136, seed: 21, facing: -1, hit: 46 },
  // below the caption strip
  { x: 900, y: 1455, h: 138, seed: 26, facing: 1, hit: 86 },
  { x: 560, y: 1610, h: 142, seed: 31, facing: -1, hit: 138 },
  { x: 150, y: 1455, h: 136, seed: 37, facing: -1, hit: 182 },
  { x: 850, y: 1610, h: 140, seed: 44, facing: 1, hit: 166 },
  { x: 700, y: 1455, h: 140, seed: 52, facing: -1, hit: 197 },
  { x: 230, y: 1610, h: 138, seed: 58, facing: -1, hit: 120 },
  { x: 500, y: 1455, h: 144, seed: 63, facing: 1, hit: null },
];

// One stray per struck figure: where it leaves the ring (tangent point), the
// straight run to the chest, and the contact frame.
type Stray = { body: number; hit: number; aLeave: number; tx: number; ty: number; dx: number; dy: number; len: number; px: number; py: number };
export const STRAYS: Stray[] = PEOPLE.flatMap((p, i) => {
  if (p.hit === null) return [];
  // aim at the chest, then stop on the near edge of the torso
  const ax = p.x;
  const ay = p.y - p.h * 0.62;
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
  return [{ body: i, hit: p.hit, aLeave: a0, tx: t0x, ty: t0y, dx, dy, len, px: t0x + dx * len, py: t0y + dy * len }];
});

// The camera: close on the flea side, one pull-back, then a creep in on the ring.
const CAM: CamKey[] = [
  { f: -40, x: 742, y: 792, k: 1.56 },
  { f: 0, x: 724, y: 806, k: 1.5 },
  { f: 30, x: 708, y: 820, k: 1.455 },
  { f: 146, x: 540, y: 960, k: 1.0 },
  { f: 232, x: 540, y: 954.5, k: 1.048 },
];

/** the kit's germ mark at a given angle: axis path of one capsule */
const capsule = (x: number, y: number, ang: number, half: number) => {
  const dx = Math.cos(ang) * half;
  const dy = Math.sin(ang) * half;
  return `M${(x - dx).toFixed(2)},${(y - dy).toFixed(2)}L${(x + dx).toFixed(2)},${(y + dy).toFixed(2)}`;
};

// engraved sleepers of the track (static)
const TICKS = Array.from({ length: 72 }, (_, i) => {
  const a = (i / 72) * Math.PI * 2;
  const c = Math.cos(a);
  const s = Math.sin(a);
  const r0 = R - BAND + 3;
  const r1 = R - BAND + (i % 6 === 0 ? 13 : 8);
  return `M${(CX + r0 * c).toFixed(1)},${(CY + r0 * s).toFixed(1)}L${(CX + r1 * c).toFixed(1)},${(CY + r1 * s).toFixed(1)}`;
}).join("");

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
  let trailD = ""; // live trails: tangent point -> the stray
  const deadTrails: { key: number; d: string; u: number }[] = [];
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
        trailD += `M${s.tx.toFixed(1)},${s.ty.toFixed(1)}L${(s.tx + s.dx * run).toFixed(1)},${(s.ty + s.dy * run).toFixed(1)}`;
      } else {
        const a = s.aLeave + run / R_STRAY;
        if (a > -Math.PI) ringD += capsule(CX + R_STRAY * Math.cos(a), CY + R_STRAY * Math.sin(a), a + Math.PI / 2, half);
      }
    } else {
      deadTrails.push({ key: s.body, d: `M${s.tx.toFixed(1)},${s.ty.toFixed(1)}L${s.px.toFixed(1)},${s.py.toFixed(1)}`, u: clamp01((frame - s.hit) / 12) });
      // it ends here: carried down by the body, dimming to the dead tone
      const fl = fallOf(p);
      const fall = Math.pow(fl, 2.2);
      const ang = (p.facing * 90 * fall * Math.PI) / 180;
      const ox = s.px - p.x;
      const oy = s.py - p.y;
      const x = p.x + ox * Math.cos(ang) - oy * Math.sin(ang);
      const y = p.y - 0.07 * p.h * fall + ox * Math.sin(ang) + oy * Math.cos(ang);
      ended.push({ key: s.body, d: capsule(x, y, Math.atan2(s.dy, s.dx) + ang, half + (flyHalf - half) * (1 - smoothstep(fl / 0.5))), dead: smoothstep((fl - 0.25) / 0.6) });
    }
  }

  return (
    <Page>
      <WorldSvg cam={cam}>
        {/* the track */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke={DARK} strokeOpacity={0.42} strokeWidth={BAND * 2 + 8} />
        <path d={TICKS} fill="none" stroke={INK} strokeOpacity={0.42} strokeWidth={1.6} />
        <circle cx={CX} cy={CY} r={R + BAND} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={6} />
        <circle cx={CX} cy={CY} r={R - BAND} fill="none" stroke={DARK} strokeOpacity={0.6} strokeWidth={6} />
        <circle cx={CX} cy={CY} r={R + BAND} fill="none" stroke={INK} strokeWidth={3} />
        <circle cx={CX} cy={CY} r={R - BAND} fill="none" stroke={INK} strokeWidth={3} />

        {/* the trails: orange while the stray flies, then a faint dashed dead line */}
        {deadTrails.map((t) => (
          <g key={t.key} fill="none">
            {t.u < 1 ? <path d={t.d} stroke={ACCENT} strokeWidth={2.5} strokeOpacity={1 - t.u} /> : null}
            <path d={t.d} stroke={DEAD} strokeWidth={2.5} strokeOpacity={0.6 * t.u} strokeDasharray="9 8" />
          </g>
        ))}
        {trailD ? <path d={trailD} fill="none" stroke={ACCENT} strokeWidth={2.5} /> : null}

        {/* germs on the ring and in flight */}
        <g fill="none" strokeLinecap="round">
          <path d={ringD + flyD} stroke={DARK} strokeOpacity={0.7} strokeWidth={casingW} />
          <path d={ringD + flyD} stroke={ACCENT} strokeWidth={2 * germR} />
        </g>

        <Medallion kind="marmot" cx={CX - R} cy={CY} r={MED_R} />
        <Medallion kind="flea" cx={CX + R} cy={CY} r={MED_R} />

        {/* the bystanders */}
        {ORDER.map((i) => {
          const p = PEOPLE[i];
          const struck = p.hit !== null && frame >= p.hit;
          const fl = fallOf(p);
          const dead = smoothstep((fl - 0.7) / 0.3);
          // the same pose rebuilt around a standing (cream) figure, laid over the
          // kit's dead tone so a fallen body stays readable (kit untouched)
          const fall = Math.pow(fl, 2.2);
          const tilt = (hash(p.seed, 3) - 0.5) * 5;
          const lift = -7.5 * (p.h / 100) * (0.94 + 0.12 * hash(p.seed, 2)) * (0.9 + 0.24 * hash(p.seed, 1)) * fall;
          if (dead > 0.001)
            return (
              <g key={i}>
                <Person x={p.x} y={p.y} h={p.h} seed={p.seed} facing={p.facing} tone={1} fallen={fl} />
                <g transform={`translate(0 ${lift}) rotate(${(p.facing * 90 - tilt) * fall} ${p.x} ${p.y})`}>
                  <Person x={p.x} y={p.y} h={p.h} seed={p.seed} opacity={LIFT * dead} />
                </g>
              </g>
            );
          return (
            <Person
              key={i}
              x={p.x}
              y={p.y}
              h={p.h}
              seed={p.seed}
              facing={p.facing}
              tone={struck && p.hit !== null ? clamp01((frame - p.hit + 1) / 3) : 0}
              fallen={fallOf(p)}
            />
          );
        })}

        {/* the germs that ended in a body */}
        {ended.map((e) =>
          e.dead < 0.999 ? (
            <g key={e.key} fill="none" strokeLinecap="round">
              <path d={e.d} stroke={DARK} strokeOpacity={0.7 * (1 - e.dead)} strokeWidth={casingW} />
              <path d={e.d} stroke={mixColor(ACCENT, DEAD, e.dead)} strokeWidth={2 * germR} />
            </g>
          ) : null,
        )}
      </WorldSvg>
    </Page>
  );
};

export default CollateralDamage;
