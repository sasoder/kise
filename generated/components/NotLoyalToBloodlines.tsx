import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { clamp01, smoothstep, sway } from "./fieldShared";
import { CompanyChair, Crown, DARK, INK, Person, SeatedPerson, Throne, WritingDesk, personUnits, type PersonSpec } from "./NotLoyalToBloodlinesFigures";

// ---------------------------------------------------------------------------
// NotLoyalToBloodlines (Sheppard_East_India_Kings, Dwarkesh map style: the
// engraved cream page on umber, as PriorYearRecessionV2 / InterestRatesGoDownV2).
// REBUILT as a simpler picture: two seats, the same vacancy resolved two ways.
//
// Si Sheppard: "the corporations, for the reasons you outlined, [are]
//   profit-driven and therefore not loyal to bloodlines or any other kind of
//   extraneous circumstances, but just" (cut back to him: "looking for the
//   most competent leadership").
//
// CHECK LINE: "When the seat falls empty, a kingdom gets the next of kin, even
//   a child; the Company picks its best man."
//
// Word onsets (frames from the start of this composition):
//   the f0 · corporations f4 · for the reasons you outlined f21-34 · profit f45
//   · -driven f53 · and therefore f60-66 · not f73 · loyal f82 · to f91 ·
//   bloodlines f99 · or any other kind of f114-131 · extraneous f134 ·
//   circumstances f145 · but f160 · just f165 · cut f176
// DURATION = sequence frames 1679 -> 1855 = 176 frames at 24000/1001 fps
//   (7.34 s).
//
// THE MOTION (one development, both sides in step): a throne on the left with
// its king, the Company's chair on the right under its orange mark with its
// governor (an orange ring behind his head). Below the caption strip: under
// the throne, on ONE cream descent line, the only heir, a small child; under
// the chair, with no lines, three grown candidates. Both occupants sink away
// together (f8-46); the crown and the ring stay hovering over two empty seats.
// LEFT the line lights and carries the child straight up onto the throne, and
// the crown comes down far too big over his brow on "bloodlines". RIGHT an
// orange ring passes along the three candidates, comes back and settles on the
// sturdy middle man, who rises to the chair; the ring fills behind his head.
// The camera pushes in gently throughout and keeps pushing on the two seated
// figures to the cut. Orange = the Company (mark, ring). No text (the letters
// in the mark are the mark).
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
  markSrc: z.string(),
  vignette: z.number(),
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  ink: INK,
  accent: ACCENT,
  accentDeep: ACCENT_DEEP,
  backdropSrc: "ww1credit/LandBackdrop_1080x1920_flat.png",
  // public/eastindia/eic-mark.png (the user's logo, white on alpha) tinted #FFB000
  markSrc: "eastindia/NotLoyalToBloodlines-mark-orange.png",
  vignette: 0.32,
});

// ---------------------------------------------------------------------------
// The page (world units == screen px at camera k 1 centred on 540, 960).
// ---------------------------------------------------------------------------
const GROUND = 1040; // both seats stand here, above the caption strip
const TX = 290; // the throne
const CX = 790; // the Company's chair
const DESK_X = 966;
const SIT = 45; // figure units the upper body drops when seated
const OCC_S = 1.54; // px per figure unit of a seated occupant

const KING: PersonSpec = { dress: "robe", build: 1.2, stance: 18, hair: "dark", beard: "full", wristL: [-29, -119], wristR: [29, -119], jewels: true };
const GOVERNOR: PersonSpec = { dress: "coat", build: 1.16, stance: 18, hat: "tricorne", hair: "dark", beard: "full", wristL: [-32, -116], wristR: [32, -116] };
const CHILD: PersonSpec = { dress: "robe", build: 0.88, stance: 11, hair: "dark", beard: "none", headScale: 1.75, wristL: [-36, -100], wristR: [36, -100] };
// the three candidates: an old man, the sturdy one, a slight youth
const C_OLD: PersonSpec = { dress: "coat", build: 0.8, stance: 11, hat: "none", hair: "white", beard: "long", hunch: 1, wristL: [-21, -70], wristR: [43, -112], prop: "staff" };
const C_BEST: PersonSpec = { dress: "coat", build: 1.22, stance: 19, hat: "tricorne", hair: "dark", wristL: [-33, -116], wristR: [33, -117], sash: true };
const C_YOUTH: PersonSpec = { dress: "coat", build: 0.76, stance: 10, hat: "none", hair: "wig", wristL: [-30, -98], wristR: [30, -98] };

const OCC_FEET = GROUND - 10;
const KING_H = personUnits(KING) * OCC_S;
const GOV_H = personUnits(GOVERNOR) * OCC_S;
const BEST_SEAT_H = personUnits(C_BEST) * OCC_S;
const HEAD_Y = OCC_FEET + (-199.55 + SIT) * OCC_S; // a seated occupant's head centre

// the crown: hovering where the king's head was, then down on the child
const CROWN_S = 1.25;
const CROWN_HOVER = { x: TX, y: OCC_FEET - (personUnits(KING) - SIT) * OCC_S + 5 };

// the heir, on the one line of descent
const CHILD_H = 150;
const CHILD_FEET0 = 1640;
const CHILD_FEET1 = GROUND - 40; // sat on the throne, feet off the ground
const CHILD_S = CHILD_H / personUnits(CHILD);
const CHILD_TOP1 = CHILD_FEET1 - (personUnits(CHILD) - SIT) * CHILD_S;
const CROWN_CHILD = { x: TX - 3, y: CHILD_TOP1 + 9 };
const LINE_Y1 = CHILD_FEET0 - CHILD_H + 14;

// the candidates: [x, standing height]; all feet on one line
const CAND_FEET = 1660;
const CANDS: { x: number; h: number; spec: PersonSpec }[] = [
  { x: 618, h: 204, spec: C_OLD },
  { x: CX, h: 256, spec: C_BEST },
  { x: 962, h: 208, spec: C_YOUTH },
];
const candRing = (i: number) => ({ x: CANDS[i].x + (i === 0 ? 8 : 0), y: CAND_FEET - 0.8 * CANDS[i].h, r: 0.31 * CANDS[i].h });

// the ring over the chair, behind the sitter's head
const RING = { x: CX, y: HEAD_Y + 8, r: 88 };
const MARK = { x: CX, y: 462, size: 190 };

// ---------------------------------------------------------------------------
// Timing.
// ---------------------------------------------------------------------------
export const T = {
  leave: [8, 46] as const, // both occupants sink away together
  lineLit: [55, 68] as const,
  childRise: [62, 96] as const,
  childSit: [89, 99] as const,
  crownDown: [91, 104] as const, // lands on "bloodlines" f99
  crownSlip: [148, 176] as const,
  selIn: [96, 103] as const,
  selPath: [
    [103, 0],
    [117, 2],
    [128, 1], // settles on the sturdy middle man
  ] as const,
  bestRise: [131, 146] as const,
  bestSit: [139, 147] as const,
  ringFill: [143, 151] as const,
};
const ease = (f: number, r: readonly [number, number]) => smoothstep((f - r[0]) / (r[1] - r[0]));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** where the selector is along the row of candidates (0..2) */
export const selAt = (f: number) => {
  let p: number = T.selPath[0][1];
  for (let i = 0; i < T.selPath.length - 1; i++) {
    const a = T.selPath[i];
    const b = T.selPath[i + 1];
    if (f > a[0]) p = mix(a[1], b[1], smoothstep((f - a[0]) / (b[0] - a[0])));
  }
  return p;
};

// ---------------------------------------------------------------------------
// The camera: a coarse keyed track followed through a two-pole damped filter.
// ---------------------------------------------------------------------------
const CAM_KEYS: [number, number, number, number][] = [
  // frame, cx, cy, k        (the filter lags ~16 f: keys sit that much early)
  [-60, 540, 994, 0.99],
  [-16, 540, 992, 1.0],
  [34, 544, 986, 1.04],
  [128, 550, 980, 1.06],
  // the push onto the two seated figures (both seats whole, above the strip)
  [172, 574, 940, 1.125],
  [260, 578, 932, 1.16],
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
const NotLoyalToBloodlines: React.FC<Props> = ({ ink, accent, accentDeep, backdropSrc, markSrc, vignette }) => {
  const frame = useCurrentFrame();

  const cam = camAt(frame);
  const drift = sway(frame);
  const tx = W / 2 - cam.cx * cam.k + drift.dx * 0.6;
  const ty = H / 2 - cam.cy * cam.k + drift.dy * 0.5;
  const camT = `translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${cam.k.toFixed(5)})`;
  const worldDiv: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${cam.k})` };

  // 1. both occupants leave
  const leaveU = ease(frame, T.leave);
  const leaverOp = 1 - smoothstep((leaveU - 0.15) / 0.85);
  const leaverDy = 46 * leaveU;

  // 2. the bloodline acts: the line lights, the child rises and sits, the crown comes down
  const litU = ease(frame, T.lineLit);
  
  const childU = ease(frame, T.childRise);
  const childFeet = mix(CHILD_FEET0, CHILD_FEET1, childU);
  const childSit = SIT * ease(frame, T.childSit);
  // the line is used up as he climbs it: its foot stays under his head
  const lineY1 = Math.max(GROUND, Math.min(LINE_Y1, childFeet - CHILD_H + 14));
  const crownU = ease(frame, T.crownDown);
  const slipU = ease(frame, T.crownSlip);
  const crownX = mix(CROWN_HOVER.x, CROWN_CHILD.x, crownU) - 2 * slipU;
  const crownY = mix(CROWN_HOVER.y, CROWN_CHILD.y, crownU) + 6 * slipU;
  const crownTilt = -13 * crownU - 5 * slipU;

  // 3. the Company chooses
  const selOp = ease(frame, T.selIn);
  const p = selAt(frame);
  const i0 = Math.min(1, Math.floor(p));
  const ra = candRing(i0);
  const rb = candRing(i0 + 1);
  const pt = p - i0;
  const riseU = ease(frame, T.bestRise);
  const bestSit = SIT * ease(frame, T.bestSit);
  const bestFeet = mix(CAND_FEET, OCC_FEET, riseU);
  const bestH = mix(CANDS[1].h, BEST_SEAT_H, riseU);
  const sel = {
    x: mix(mix(ra.x, rb.x, pt), RING.x, riseU),
    y: mix(mix(ra.y, rb.y, pt), RING.y, riseU),
    r: mix(mix(ra.r, rb.r, pt), RING.r, riseU),
  };
  const fillU = ease(frame, T.ringFill);
  const ringFill = 0.5 * Math.max(leaverOp, fillU);
  const ringLit = Math.max(leaverOp, fillU);

  const casing = { stroke: DARK, strokeOpacity: 0.55, fill: "none" };

  return (
    <AbsoluteFill style={{ backgroundColor: "#3A3025" }}>
      {/* the umber page, world space, oversized */}
      <div style={worldDiv}>
        <Img src={staticFile(backdropSrc)} style={{ position: "absolute", left: -W * 0.1, top: -H * 0.1, width: W * 1.2, height: H * 1.2 }} />
      </div>

      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
        <g transform={camT}>
          {/* the one line of descent: throne down to the heir; it lights from the throne downward */}
          <line x1={TX} y1={GROUND} x2={TX} y2={lineY1} stroke={DARK} strokeOpacity={0.5} strokeWidth={11} strokeLinecap="round" />
          <line x1={TX} y1={GROUND} x2={TX} y2={lineY1} stroke={ink} strokeOpacity={0.6} strokeWidth={6} strokeLinecap="round" />
          {litU > 0.001 ? (
            <>
              <line x1={TX} y1={GROUND} x2={TX} y2={Math.min(lineY1, mix(GROUND, LINE_Y1, litU))} stroke={DARK} strokeOpacity={0.55} strokeWidth={17} strokeLinecap="round" />
              <line x1={TX} y1={GROUND} x2={TX} y2={Math.min(lineY1, mix(GROUND, LINE_Y1, litU))} stroke={ink} strokeWidth={11} strokeLinecap="round" />
            </>
          ) : null}

          {/* the two seats */}
          <Throne x={TX} y={GROUND} />
          <CompanyChair x={CX} y={GROUND} />
          <WritingDesk x={DESK_X} y={GROUND} />

          {/* the ring over the chair: full behind a sitter, empty over the vacancy */}
          <circle cx={RING.x} cy={RING.y} r={RING.r} fill={accentDeep} fillOpacity={ringFill} />
          <circle cx={RING.x} cy={RING.y} r={RING.r} {...casing} strokeWidth={16} />
          <circle cx={RING.x} cy={RING.y} r={RING.r} fill="none" stroke={ringLit > 0.5 ? accent : accentDeep} strokeOpacity={0.75 + 0.25 * ringLit} strokeWidth={8 + 3 * ringLit} />

          {/* the two who leave */}
          {leaverOp > 0.002 ? (
            <g opacity={leaverOp} transform={`translate(0 ${leaverDy.toFixed(2)})`}>
              <SeatedPerson x={TX} y={OCC_FEET} h={KING_H} spec={KING} uid="nlbKing" sit={SIT} />
              <SeatedPerson x={CX} y={OCC_FEET} h={GOV_H} spec={GOVERNOR} uid="nlbGov" sit={SIT} />
            </g>
          ) : null}

          {/* the selector: one orange ring along the candidates, then up with the chosen man */}
          {selOp > 0.001 && riseU < 0.999 ? (
            <g opacity={selOp}>
              <circle cx={sel.x} cy={sel.y} r={sel.r} fill={accentDeep} fillOpacity={0.3} />
              <circle cx={sel.x} cy={sel.y} r={sel.r} {...casing} strokeWidth={16} />
              <circle cx={sel.x} cy={sel.y} r={sel.r} fill="none" stroke={accent} strokeWidth={11} />
            </g>
          ) : null}

          {/* the candidates; the middle one rises to the chair */}
          <Person x={CANDS[0].x} y={CAND_FEET} h={CANDS[0].h} spec={CANDS[0].spec} uid="nlbC0" ground />
          <Person x={CANDS[2].x} y={CAND_FEET} h={CANDS[2].h} spec={CANDS[2].spec} uid="nlbC2" ground />
          {riseU < 0.001 ? (
            <Person x={CANDS[1].x} y={CAND_FEET} h={CANDS[1].h} spec={CANDS[1].spec} uid="nlbC1" ground />
          ) : (
            <SeatedPerson x={CX} y={bestFeet} h={bestH} spec={C_BEST} uid="nlbC1" sit={bestSit} />
          )}

          {/* the heir, and the one crown */}
          <SeatedPerson x={TX} y={childFeet} h={CHILD_H} spec={CHILD} uid="nlbChild" sit={childSit} />
          <Crown x={crownX} y={crownY} tilt={crownTilt} scale={CROWN_S} uid="nlbCrown" />
        </g>
      </svg>

      {/* the Company's mark, above its chair like a sign */}
      <div style={worldDiv}>
        <Img src={staticFile(markSrc)} style={{ position: "absolute", left: MARK.x - MARK.size / 2, top: MARK.y - (MARK.size * 1362) / 1400 / 2, width: MARK.size }} />
      </div>

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 46%, rgba(8,6,4,0) 55%, rgba(8,6,4,${(vignette * 0.5).toFixed(3)}) 82%, rgba(8,6,4,${vignette.toFixed(3)}) 100%)`,
        }}
      />
    </AbsoluteFill>
  );
};

export default NotLoyalToBloodlines;
