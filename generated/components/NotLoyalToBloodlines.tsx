import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { z } from "zod";
import { clamp01, smoothstep, sway } from "./fieldShared";
import { CROWN_H, Crown, DARK, INK, Person, type P2, type PersonSpec } from "./NotLoyalToBloodlinesFigures";

const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// NotLoyalToBloodlines (Sheppard_East_India_Kings, Dwarkesh map style: the
// engraved cream page on umber, as PriorYearRecessionV2 / InterestRatesGoDownV2).
//
// Si Sheppard: "the corporations, for the reasons you outlined, [are]
//   profit-driven and therefore not loyal to bloodlines or any other kind of
//   extraneous circumstances, but just" (cut back to him: "looking for the
//   most competent leadership").
//
// CHECK LINE: "A crown can only pass down the family line, whoever is next;
//   the Company's command can go to anyone."
//
// Word onsets (frames from the start of this composition):
//   the f0 · corporations f4 · for the reasons you outlined f21-34 · profit f45
//   · -driven f53 · and f60 · therefore f66 · not f73 · loyal f82 · to f91 ·
//   bloodlines f99 · or f114 · any other kind of f118 · extraneous f134 ·
//   circumstances f145 · but f160 · just f165 · cut f176
// DURATION = sequence frames 1679 -> 1855 = 176 frames at 24000/1001 fps
//   (7.34 s).
//
// THE MOTION (one development): two things share one page. A BLOODLINE in
// cream down the centre-left: four generations on one descent line (a strong
// king, an adult, a stooped old man, a small child) and ONE crown that slides
// straight down that line from head to head and ends on the child. The
// COMPANY in orange: its balemark draws in at upper right on "corporations",
// then a chain of command hops from person to person among unrelated men
// (a clerk, a merchant, an officer), each hop a bold link landing a ring on
// the chosen one while the last ring empties; on "not loyal to bloodlines"
// the third hop runs straight across the cream descent line to a sturdy
// officer on the other side as the crown, bound to its line, arrives on the
// child, level with the officer. The camera opens on the king and the mark,
// travels down the page with them (widest ~f100), then makes one push-in onto
// the pair alone (crowned child | ringed officer), still pushing slowly at the
// cut, while a faint highlight travels the orange trail.
// Orange = the Company and its choices; everything dynastic is cream. No text
// (the V E I C inside the mark are the mark).
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 176;
export const W = 1080;
export const H = 1920;

export const ACCENT = "#FFB000";
export const ACCENT_DEEP = "#D98A0C";

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentDeep: z.string(),
  backdropSrc: z.string(),
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  vignette: 0.32,
});

// ---------------------------------------------------------------------------
// The page (world units == screen px in the settled frame, camera k 1 centred
// on 540, 960).
// ---------------------------------------------------------------------------
const BL_X = 500; // the line of descent

const KING: PersonSpec = { dress: "robe", build: 1.2, stance: 18, hair: "dark", beard: "full", wristL: [-29, -119], wristR: [29, -119], prop: "sabre", jewels: true };
const HEIR: PersonSpec = { dress: "robe", build: 0.98, hair: "dark", beard: "none", wristL: [-6, -103], wristR: [6, -103] };
const OLD: PersonSpec = { dress: "robe", build: 0.78, stance: 11, hair: "white", beard: "long", hunch: 1, wristL: [-21, -70], wristR: [43, -112], prop: "staff" };
const CHILD: PersonSpec = { dress: "robe", build: 0.88, stance: 11, hair: "dark", beard: "none", headScale: 1.75, wristL: [-36, -100], wristR: [36, -100] };

// generation i: head top and height (px); feet = top + h
const CROWN_S = 1.43;
const GENS: { top: number; h: number; spec: PersonSpec }[] = [
  { top: 95, h: 290, spec: KING },
  { top: 415, h: 262, spec: HEIR },
  { top: 790, h: 255, spec: OLD }, // feet 1045: above the caption strip; a clear band above his head for the final frame's top edge
  { top: 1335, h: 160, spec: CHILD }, // below it; the line runs on through the strip
];
// where the crown's base sits on each head (the old man's head is forward of the line)
const CROWN_AT: P2[] = [
  [BL_X, GENS[0].top + 9],
  [BL_X, GENS[1].top + 9],
  [BL_X + 12, GENS[2].top + 12],
  [BL_X - 3, GENS[3].top + 12],
];
const LINE_Y0 = GENS[0].top + 30;
const LINE_Y1 = GENS[3].top + 20;

// the unrelated men: [x, feet y, height]
type Man = { x: number; y: number; h: number; spec: PersonSpec };
const CLERK: Man = { x: 700, y: 680, h: 240, spec: { dress: "coat", build: 0.88, hat: "none", hair: "wig", wristL: [-15, -126], wristR: [15, -126], prop: "ledger" } };
const MERCHANT: Man = { x: 925, y: 1060, h: 245, spec: { dress: "coat", build: 1.04, belly: 1.32, hat: "tricorne", hair: "dark", wristL: [-12, -142], wristR: [44, -100], prop: "cane" } };
// the chosen officer ends below the caption strip, level with the child
const OFFICER: Man = { x: 215, y: 1560, h: 270, spec: { dress: "coat", build: 1.22, stance: 20, hat: "tricorne", hair: "dark", wristL: [-33, -116], wristR: [33, -117], prop: "sword", sash: true } };
const SOLDIER: Man = { x: 215, y: 625, h: 245, spec: { dress: "coat", build: 1, hat: "tricorne", hair: "dark", wristL: [-37, -96], wristR: [36, -112], prop: "musket", belts: true } };
const MEN: Man[] = [CLERK, MERCHANT, OFFICER, SOLDIER];

// the chosen three, in order, each with the ring behind his head and shoulders
const CHOSEN = [CLERK, MERCHANT, OFFICER].map((m) => ({ c: [m.x, m.y - 0.8 * m.h] as P2, r: 0.29 * m.h }));

// the Company's balemark: (0, 0) of its own frame at MARK, scale MARK_S
const MARK: P2 = [850, 250];
const MARK_S = 1.2;
const HEART = "M0,85C-30,55 -85,20 -85,-20C-85,-55 -55,-70 -32,-70C-15,-70 -4,-58 0,-40C4,-58 15,-70 32,-70C55,-70 85,-55 85,-20C85,20 30,55 0,85Z";
const SALTIRE = ["M-76,-58L44,62", "M76,-58L-44,62"];
const FOUR = "M0,-40V-152L-38,-108H26";
const MARK_TIP: P2 = [MARK[0], MARK[1] + 85 * MARK_S + 6];

// the links: ring edge to ring edge (the first from the mark's point)
const along = (a: P2, b: P2, d: number): P2 => {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [a[0] + ((b[0] - a[0]) / l) * d, a[1] + ((b[1] - a[1]) / l) * d];
};
const LINKS: { a: P2; b: P2; len: number }[] = CHOSEN.map((to, i) => {
  const from = i === 0 ? null : CHOSEN[i - 1];
  const a = from ? along(from.c, to.c, from.r) : MARK_TIP;
  const b = along(to.c, from ? from.c : MARK_TIP, to.r);
  return { a, b, len: Math.hypot(b[0] - a[0], b[1] - a[1]) };
});
const TRAIL_LEN = LINKS.reduce((s, l) => s + l.len, 0);
/** the stretches of the trail between arc lengths s0 and s1 */
const trailBetween = (s0: number, s1: number) => {
  let d = "";
  let acc = 0;
  for (const l of LINKS) {
    const t0 = Math.max(0, (s0 - acc) / l.len);
    const t1 = Math.min(1, (s1 - acc) / l.len);
    if (t1 > t0) {
      const p = along(l.a, l.b, t0 * l.len);
      const q = along(l.a, l.b, t1 * l.len);
      d += `M${p[0].toFixed(1)},${p[1].toFixed(1)}L${q[0].toFixed(1)},${q[1].toFixed(1)}`;
    }
    acc += l.len;
  }
  return d;
};

// ---------------------------------------------------------------------------
// Timing.
// ---------------------------------------------------------------------------
export const T = {
  heart: [-7, 15] as const,
  saltire: [9, 22] as const,
  four: [14, 28] as const,
  letters: [15, 28] as const,
  hops: [
    [30, 50],
    [58, 80],
    [82, 118], // the decisive hop: over the descent line ~f102 ("bloodlines" f99)
  ] as const,
  crown: [
    [24, 48],
    [60, 86],
    [100, 138],
  ] as const,
  crownTilt: [126, 141] as const,
  shimmer: [132, 174] as const,
};
const ease = (f: number, r: readonly [number, number]) => smoothstep((f - r[0]) / (r[1] - r[0]));

export const hopU = (i: number, f: number) => ease(f, T.hops[i]);
/** ring i: how far round it is drawn, and how lit (the last holder empties) */
export const ringState = (i: number, f: number) => {
  const end = T.hops[i][1];
  const on = smoothstep((f - (end - 3)) / 9);
  const next = T.hops[i + 1];
  const lit = on * (next ? 1 - smoothstep((f - (next[0] + 1)) / 12) : 1);
  return { on, lit };
};
export const crownAt = (f: number): { p: P2; tilt: number } => {
  let p = CROWN_AT[0];
  T.crown.forEach((r, i) => {
    const u = ease(f, r);
    if (u > 0) p = [CROWN_AT[i][0] + (CROWN_AT[i + 1][0] - CROWN_AT[i][0]) * u, CROWN_AT[i][1] + (CROWN_AT[i + 1][1] - CROWN_AT[i][1]) * u];
  });
  return { p, tilt: -13 * ease(f, T.crownTilt) };
};

// ---------------------------------------------------------------------------
// The camera: its own coarse keyed track (centre x, centre y, zoom), followed
// through a two-pole damped filter so it never pops or stops dead.
// ---------------------------------------------------------------------------
const CAM_KEYS: [number, number, number, number][] = [
  // frame, cx, cy, k        (the filter lags ~16 f: keys sit that much early)
  [-60, 568, 630, 1.27],
  [-16, 566, 640, 1.25],
  [20, 560, 720, 1.18],
  [60, 548, 880, 1.06],
  [90, 540, 965, 1.0],
  // one push-in onto the pair: crowned child | ringed officer, nobody else
  [117, 342, 1609, 1.8],
  [200, 342, 1522, 2.1],
];
const camTarget = (f: number): [number, number, number] => {
  let i = 0;
  while (i < CAM_KEYS.length - 2 && f > CAM_KEYS[i + 1][0]) i++;
  const a = CAM_KEYS[i];
  const b = CAM_KEYS[i + 1];
  const u = clamp01((f - a[0]) / (b[0] - a[0]));
  return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, Math.log(a[3]) + (Math.log(b[3]) - Math.log(a[3])) * u];
};
const CAM_TAU = 8;
const CAM_PRE = 60;
const CAM_TRACK: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  const a = 1 - Math.exp(-1 / CAM_TAU);
  let s1 = camTarget(-CAM_PRE);
  let s2 = s1;
  for (let f = -CAM_PRE; f <= DURATION; f++) {
    const t = camTarget(f);
    s1 = [s1[0] + (t[0] - s1[0]) * a, s1[1] + (t[1] - s1[1]) * a, s1[2] + (t[2] - s1[2]) * a];
    s2 = [s2[0] + (s1[0] - s2[0]) * a, s2[1] + (s1[1] - s2[1]) * a, s2[2] + (s1[2] - s2[2]) * a];
    if (f >= 0) out.push([s2[0], s2[1], Math.exp(s2[2])]);
  }
  return out;
})();
export const camAt = (f: number) => {
  const c = CAM_TRACK[Math.max(0, Math.min(DURATION, Math.round(f)))];
  return { cx: c[0], cy: c[1], k: c[2] };
};

// ---------------------------------------------------------------------------
const NotLoyalToBloodlines: React.FC<Props> = ({ ink, accent, accentDeep, backdropSrc, vignette }) => {
  const frame = useCurrentFrame();

  const cam = camAt(frame);
  const drift = sway(frame);
  const tx = W / 2 - cam.cx * cam.k + drift.dx * 0.6;
  const ty = H / 2 - cam.cy * cam.k + drift.dy * 0.5;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${cam.k.toFixed(5)})`;

  // the mark draws in
  const heartU = ease(frame, T.heart);
  const saltU = ease(frame, T.saltire);
  const fourU = ease(frame, T.four);
  const lettersOp = ease(frame, T.letters);

  const crown = crownAt(frame);

  // the faint highlight along the trail
  const shT = clamp01((frame - T.shimmer[0]) / (T.shimmer[1] - T.shimmer[0]));
  const shS = TRAIL_LEN * smoothstep(shT);
  const shOp = Math.sin(Math.PI * shT) * 0.6;

  const casing = { stroke: DARK, strokeOpacity: 0.55, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const letter = { fontFamily: fellSC, fontSize: 31, textAnchor: "middle" as const, fill: accent, opacity: lettersOp };

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      {/* the umber page, world space, oversized so the opening close-up stays on paper */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${cam.k})` }}>
        <Img src={staticFile(backdropSrc)} style={{ position: "absolute", left: -W * 0.35, top: -H * 0.35, width: W * 1.7, height: H * 1.7 }} />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <defs>
          <clipPath id="nlbHeart">
            <path d={HEART} />
          </clipPath>
        </defs>
        <g transform={camT}>
          {/* the line of descent */}
          <line x1={BL_X} y1={LINE_Y0} x2={BL_X} y2={LINE_Y1} stroke={DARK} strokeOpacity={0.55} strokeWidth={15} strokeLinecap="round" />
          <line x1={BL_X} y1={LINE_Y0} x2={BL_X} y2={LINE_Y1} stroke={ink} strokeWidth={10} strokeLinecap="round" />

          {/* the rings behind the chosen */}
          {CHOSEN.map((c, i) => {
            const st = ringState(i, frame);
            if (st.on <= 0.001) return null;
            const circ = 2 * Math.PI * c.r;
            const w = 7 + 5 * st.lit;
            return (
              <g key={`ring-${i}`} transform={`rotate(${(Math.atan2(LINKS[i].b[1] - c.c[1], LINKS[i].b[0] - c.c[0]) * 180) / Math.PI} ${c.c[0]} ${c.c[1]})`}>
                <circle cx={c.c[0]} cy={c.c[1]} r={c.r} fill={accentDeep} fillOpacity={0.5 * st.lit * st.on} />
                <circle cx={c.c[0]} cy={c.c[1]} r={c.r} {...casing} strokeWidth={w + 5} strokeDasharray={`${circ * st.on} ${circ}`} />
                <circle
                  cx={c.c[0]}
                  cy={c.c[1]}
                  r={c.r}
                  fill="none"
                  stroke={st.lit > 0.5 ? accent : accentDeep}
                  strokeOpacity={0.7 + 0.3 * st.lit}
                  strokeWidth={w}
                  strokeLinecap="round"
                  strokeDasharray={`${circ * st.on} ${circ}`}
                />
              </g>
            );
          })}

          {/* the chain of command: each hop a bold link; the trail stays */}
          {LINKS.map((l, i) => {
            const u = hopU(i, frame);
            if (u <= 0.001) return null;
            const tip = along(l.a, l.b, l.len * u);
            return (
              <g key={`link-${i}`}>
                <line x1={l.a[0]} y1={l.a[1]} x2={tip[0]} y2={tip[1]} {...casing} strokeWidth={18} />
                <line x1={l.a[0]} y1={l.a[1]} x2={tip[0]} y2={tip[1]} stroke={accent} strokeWidth={12} strokeLinecap="round" />
                {u < 0.999 ? <circle cx={tip[0]} cy={tip[1]} r={11} fill={accent} stroke={DARK} strokeOpacity={0.55} strokeWidth={3} /> : null}
              </g>
            );
          })}
          {shOp > 0.01
            ? [
                [130, 0.3],
                [64, 0.5],
                [24, 0.8],
              ].map(([len, o]) => <path key={`sh-${len}`} d={trailBetween(shS - len / 2, shS + len / 2)} fill="none" stroke="#FFE9B8" strokeOpacity={o * shOp} strokeWidth={7} strokeLinecap="round" />)
            : null}

          {/* the Company's mark */}
          <g transform={`translate(${MARK[0]} ${MARK[1]}) scale(${MARK_S})`}>
            <path d={HEART} fill={accentDeep} fillOpacity={0.16 * heartU} />
            <path d={HEART} pathLength={1} {...casing} strokeWidth={13} strokeDasharray={`${heartU} 2`} />
            <path d={FOUR} pathLength={1} {...casing} strokeWidth={13} strokeDasharray={`${fourU} 2`} opacity={fourU > 0.001 ? 1 : 0} />
            <g clipPath="url(#nlbHeart)">
              {SALTIRE.map((d) => (
                <path key={d} d={d} pathLength={1} fill="none" stroke={accent} strokeWidth={5.5} strokeDasharray={`${saltU} 2`} opacity={saltU > 0.001 ? 1 : 0} />
              ))}
            </g>
            <path d={HEART} pathLength={1} fill="none" stroke={accent} strokeWidth={8.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${heartU} 2`} opacity={heartU > 0.001 ? 1 : 0} />
            <path d={FOUR} pathLength={1} fill="none" stroke={accent} strokeWidth={8.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={`${fourU} 2`} opacity={fourU > 0.001 ? 1 : 0} />
            <text x={0} y={-10} {...letter}>
              V
            </text>
            <text x={-44} y={24} {...letter}>
              E
            </text>
            <text x={44} y={24} {...letter}>
              I
            </text>
            <text x={0} y={60} {...letter} fontSize={27}>
              C
            </text>
          </g>

          {/* the unrelated men */}
          {MEN.map((m, i) => (
            <Person key={`man-${i}`} x={m.x} y={m.y} h={m.h} spec={m.spec} uid={`nlbm${i}`} ground />
          ))}
          {/* the four generations, and the one crown */}
          {GENS.map((g, i) => (
            <Person key={`gen-${i}`} x={BL_X} y={g.top + g.h} h={g.h} spec={g.spec} uid={`nlbg${i}`} />
          ))}
          <Crown x={crown.p[0]} y={crown.p[1]} tilt={crown.tilt} scale={CROWN_S} uid="nlbCrown" />
        </g>
      </svg>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 46%, rgba(8,6,4,0) 55%, rgba(8,6,4,${(vignette * 0.5).toFixed(3)}) 82%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export const CROWN_HEIGHT = CROWN_H;
export default NotLoyalToBloodlines;

