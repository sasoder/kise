// ---------------------------------------------------------------------------
// NanometersVsReality (sam-pricing-tokens, cut 48). Cheeky Pint style (stout) (styles/cheeky-pint.md), the clip's
// shared world ./pricingShared (read-only). Opaque 1080x1920, 23.976 fps, 68 frames. Palette B1.
//
// CHECK LINE: "A '3 nm' chip has nothing 3 nm wide in it: the real parts are many times bigger; the name is just a
// label."
//
// THE LINE (John): "(You know the way, like, the) nanometers has very little relation to reality these days?"
// WORD -> FRAME (composition frames, Whisper, may run 2-6 f early): nanometers f1 · has f9 · very f16 · little f30 ·
//   relation f35 · to f41 · reality f46 · these f51 · days f58 · (John continues on camera from f67).
// DURATION: the slot 48.840 -> 51.677 s (sequence frames 1171 -> 1239) = 68 frames at 24000/1001 (f0..f67).
//
// THE MOTION: one dive. f0 a real "3 nm" chip (the Lunar Lake Compute Tile die shot, no product name) lies on the
// board with an amber "3 nm" sticker on it, the camera already pushing in. The push turns into a log-space dive into
// the die (x40): the sticker leaves the frame to the right (~f9), the photo runs out of resolution and defocuses
// (sharp -> soft crossfade = a focus pull), then drains into the ground's tone and gives way to the board, while a
// nearer drawn plane (2.5D: the gates sit nearer the lens than the die surface, so they outgrow it at the end of
// the dive) resolves out of the dark: a long row of cream gate strips at the real gate pitch, landing ~f26 with four
// in frame. "very little": a tiny amber bracket drawn to TRUE scale (3 nm = 1/15 of the 45 nm pitch: ~17 px against
// a 260 px pitch, its left leg on the pitch bracket's origin, over its bar) with its amber "3 nm" beside its free end
// (lands f29). "reality": from that same origin a cream bracket opens across one real gate pitch
// (f32-43) and its readout "45 nm" lands (f46). Hold alive to f67 on a slow creep.
// CAUSE: the gates' tone (dark -> cream) is driven by the same zoom value that defocuses and drains the photo: the
// drawing takes over exactly where the photo stops resolving (a die shot cannot show 45 nm gates).
// AMBER = the number the customer is shown (the "3 nm" label: the sticker at f0 and the sliver's label at the end);
// cream = the real thing (gates, the pitch bracket, its readout); the board = context.
//
// CAMERA (own track, not the house damped follow: a x40 dive is a log-space zoom, which neither runCamera nor
// pricingShared's depthScale (its 0.02 guard is for moderate dollies) can carry). ln k = VC f + E TE (1 - e^(-f/TE))
// + B (Phi((f - FC)/SIG) - Phi(-FC/SIG)): an early push already moving at f0 (~5 %/f), one Gaussian lobe of
// log-velocity (peak ~28 %/f at f13-14, one deceleration lobe f14-26), then a creep (~0.1 %/f) that never stops.
// Zoom centre: the dive target T on the die, at screen S(f) easing (smoothstep f0 -> f26) from where it sits at f0
// to the gates' centre (540, 765). The gate plane is the same dolly at height H = 0.25 / R above the die: its scale
// kd / (1 - H kd) (1.004 x the die's at f0, 1.33 x at the end).
//
// SOURCES
//   Die photo: Fritzchens Fritz, CC0, Wikimedia Commons "Intel@TSMC_N3_N6@LunarLake@LNL(4P+4LPE)@CoreUltra200Series@
//     DSCx06_poly@5xExt" (3840 px thumbnail; images/cutout_sources/SOURCES.md). The big upper die = the Compute Tile,
//     TSMC N3B (Wikipedia "Lunar Lake", Tom's Hardware; FACTS.md section 3). Baked by
//     scripts/clips/sam-pricing-tokens/bake-chip.py -> nanometersData.ts.
//   45 nm: TSMC N3 contacted gate pitch, TSMC at IEDM 2022, as reported by Scotten Jones, "IEDM 2022 - TSMC 3nm",
//     SemiWiki, 2 Jan 2023: "a Contacted Gate Pitch (Contacted Poly Pitch, CPP as I describe it) of 45nm is
//     disclosed." https://semiwiki.com/semiconductor-manufacturers/tsmc/322688-iedm-2022-tsmc-3nm/ (N3B is the
//     original N3, so the die and the number match.)
//   Gate width ~0.37 of the pitch: IEEE IRDS 2022 More Moore Table MM-7, "3nm" column, Lg 16 nm (HP) / 18 nm (HD)
//     against its 48 nm gate pitch (https://irds.ieee.org/images/files/pdf/2022/2022IRDS_MM.pdf). Not labelled.
//   The labelling point ("3 nm" is a name, not a feature): IEEE Spectrum, Samuel K. Moore, "A Better Way to Measure
//     Progress in Semiconductors" (print "The Node is Nonsense"), 21 Jul 2020: "Most of the critical features of a
//     7-nm transistor are actually considerably larger than 7 nm."
//     https://spectrum.ieee.org/a-better-way-to-measure-progress-in-semiconductors
//   The 3 nm sliver is the name drawn at true scale against the 45 nm pitch (3 / 45 = 1 / 15), not a measured part.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, GEO, Numeral, bloomFilter, StoutStage, clamp01, lerp, mixHex, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { GRADE, PriceSticker, SHADOW_S, StoutShadow, gradeMatrix, type Cam, type Grade, type ShadowPart } from "./pricingShared";
import { CHIP_ASPECT, CHIP_SHARP, CHIP_SOFT } from "./nanometersData";

export const FPS = 24000 / 1001;
export const DURATION = 68;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `nm${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
const span = (v: number, a: number, b: number) => smoothstep((v - a) / (b - a));

// ===========================================================================
// THE FACTS (FACTS.md; the director's decisions)
// ===========================================================================
export const GATE_PITCH_NM = 45; // TSMC N3 contacted gate pitch (IEDM 2022, SemiWiki)
export const NAME_NM = 3; // the node's name
export const GATE_W_SHARE = 0.37; // gate width / pitch (IRDS Lg 16-18 nm against a 48 nm pitch: 0.33-0.38)

// ===========================================================================
// THE DIE (world D: the die's own px, 1000 wide; k = 1 at f0)
// ===========================================================================
const DIE = { w: 1000, h: 1000 / CHIP_ASPECT } as const;
/** The dive target on the die (D px): a dark brown logic block left of centre (source px ~1504, 960). */
const T = { x: 0.3885 * DIE.w, y: 0.4602 * DIE.h } as const;
/** Where the die's centre sits on screen at f0 (k 1): the whole tile in frame, above the caption bands. */
const DIE_F0 = { x: 540, y: 790 } as const;
/** The "3 nm" sticker on the die (D px, centre): upper right, so the dive throws it out to the right early. */
const STICKER = { cx: T.x + 362, cy: T.y - 150, w: 240, h: 104 } as const;
/** The die's grade: pricingShared's GRADE, a little less chroma (the poly layer's blues and violets). */
const DIE_GRADE: Grade = { ...GRADE, saturate: 0.62 };
const LAMP_TINT = "#FFF4E2"; // pricingShared's top-lit ramp tint (not exported there); the ramp alphas are GRADE's

// ===========================================================================
// THE CAMERA — a log-space dive (header)
// ===========================================================================
const R = 40; // the die's zoom at f67
const CAMP = { VC: 0.0005, E: 0.035, TE: 8, FC: 13.5, SIG: 4.8 } as const;
const Phi = (x: number) => {
  const t = 1 / (1 + (0.3275911 * Math.abs(x)) / Math.SQRT2);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp((-x * x) / 2);
  return 0.5 * (1 + Math.sign(x) * y);
};
const lobe = (f: number) => Phi((f - CAMP.FC) / CAMP.SIG) - Phi(-CAMP.FC / CAMP.SIG);
const early = (f: number) => CAMP.VC * f + CAMP.E * CAMP.TE * (1 - Math.exp(-f / CAMP.TE));
const B = (Math.log(R) - early(DURATION - 1)) / lobe(DURATION - 1);
/** The die plane's zoom at frame f (1 at f0, R at f67). */
export const kDie = (f: number) => Math.exp(early(f) + B * lobe(f));
/** The gate plane: the same dolly, H above the die (nearer the lens). */
const H = 0.25 / R;
const kGateRaw = (f: number) => {
  const kd = kDie(f);
  return kd / (1 - H * kd);
};
const KG_END = kGateRaw(DURATION - 1);
/** The gate plane's screen scale: G units are screen px at f67. */
export const sGate = (f: number) => kGateRaw(f) / KG_END;
/** The zoom centre's screen point: T's screen position (eases to the gates' centre). */
const S0 = { x: DIE_F0.x + (T.x - DIE.w / 2), y: DIE_F0.y + (T.y - DIE.h / 2) };
const S1 = { x: 540, y: 765 };
const S_END_F = 26;
export const screenCentre = (f: number) => {
  const u = smoothstep(f / S_END_F);
  return { x: lerp(S0.x, S1.x, u), y: lerp(S0.y, S1.y, u) };
};

// ===========================================================================
// THE PHOTO -> DRAWING HANDOFF (all keyed on the die's zoom kd: one cause)
// ===========================================================================
/** defocus: the soft bake over the sharp one (the photo runs out of resolution past k ~2.8) */
const SOFT_K = [2.6, 7] as const;
/** drain: the photo's tone sinks to the ground's (through its alpha) */
const DRAIN_K = [6, 16] as const;
/** give way: the drained photo hands the frame back to the board (its own fibres, pool, vignette) */
const GIVE_K = [14, 24] as const;
/** the gates' tone: the photo's own local tone -> cream (they resolve out of the defocused die) */
const GATE_K = [7, 24] as const;
const lk = (k: number, ab: readonly [number, number]) => span(Math.log(k), Math.log(ab[0]), Math.log(ab[1]));

// ===========================================================================
// THE GATES (world G: screen px at f67, origin = the gates' centre)
// ===========================================================================
const PITCH = 260; // one 45 nm gate pitch on screen at the resolve
const GATE = { w: GATE_W_SHARE * PITCH, top: -245, bottom: 245, n: 22 } as const; // n each side of the centre
const gateX = (i: number) => (i + 0.5) * PITCH; // i = -n .. n-1; i -1 and 0 straddle the centre
const GATE_R = GEO.RADIUS * (GATE.w / GEO.TILE);
// the graded soft die's mean around T (measured from chip_computetile_soft.jpg through DIE_GRADE: #614D35 over
// +-20 px, #624E38 over +-60 px): the gates start in the photo's own tone, so they resolve out of it, not onto it
const DARK = "#624E38";
const DARK_FOOT = mixHex(DARK, COLOR.shadow, 0.08);
/** The pitch bracket (cream): gate -1's centre -> gate 0's centre, its bar above the gates. */
const BR = { x0: gateX(-1), x1: gateX(0), y: -290, bar: 7, tickUp: 0, tickDown: 30, tick: 7 } as const; // legs down toward the gates (a 15 px gap: separate objects)
/** The 3 nm sliver (amber) at TRUE scale: 3 / 45 of the pitch (leg centre to leg centre), the same bracket form, from the
 *  pitch bracket's origin. Both are Π-shaped (legs down only): with legs both ways the 17 px sliver read as a letter H. */
const SLIVER_W = (NAME_NM / GATE_PITCH_NM) * PITCH;
// ONE origin: the sliver's left leg stands on the pitch bracket's left leg line (gate -1's centre), directly over the
// pitch bracket's bar; both measure leg centre to leg centre, so "this much" vs "this much" from one point.
const SL = { x0: BR.x0, y: BR.y - 40, bar: 4, tick: 4, tickUp: 0, tickDown: 20 } as const; // its feet 18 px over the bar
const TYPE_READOUT = 160; // "45 nm": cap 115 px
const TYPE_NAME = 84; // "3 nm": cap 60 px
const READOUT = { x: 0, y: BR.y - 112 } as const; // above the sliver's label
const NAME = { x: SL.x0 + SLIVER_W + SL.tick / 2 + 14, y: SL.y + SL.tickDown } as const; // beside the sliver's free end
/** beats (frames) */
const BEAT = {
  sliver: { tick0: 16, bar: 18, tick1: 21, end: 24 },
  name: 17, // the amber "3 nm" enters over 12 f -> lands f29 ("little" f30)
  bracket: { tick0: 32, bar: 34, tick1: 41, end: 44 },
  readout: 34, // enters over 12 f -> lands f46 ("reality" f46)
} as const;
const ENTER_F = 12;

// ===========================================================================
// PIECES
// ===========================================================================
/** The die: graded photo (sharp under soft), the top-lit ramp, the sticker, the drain layer; one shadow. */
const Die: React.FC<{ kd: number; S: { x: number; y: number } }> = ({ kd, S }) => {
  const uid = uidOf(useId());
  const soft = lk(kd, SOFT_K);
  const drain = lk(kd, DRAIN_K);
  const give = lk(kd, GIVE_K);
  if (give >= 0.999) return null;
  const box = { x: 0, y: 0, w: DIE.w, h: DIE.h };
  const img = (src: string, extra?: React.SVGProps<SVGImageElement>) => (
    <image href={src} x="0" y="0" width={f3(box.w)} height={f3(box.h)} preserveAspectRatio="none" filter={`url(#${uid}g)`} {...extra} />
  );
  // the sticker leaves the frame by k ~2.4; stop drawing it (and its bloom) once it is off screen
  const stickerScreenX0 = S.x + (STICKER.cx - STICKER.w / 2 - T.x) * kd;
  const showSticker = stickerScreenX0 < 1080 + 40;
  const showShadow = kd < 5;
  const sticker = { x: STICKER.cx - STICKER.w / 2, y: STICKER.cy - STICKER.h / 2, w: STICKER.w, h: STICKER.h, r: 0.07 * STICKER.h };
  const sil: ShadowPart[] = [{ d: rectPath(0, 0, box.w, box.h, 1) }];
  return (
    <g opacity={f3(1 - give)} transform={`translate(${fx(S.x)} ${fx(S.y)}) scale(${fx(kd)}) translate(${fx(-T.x)} ${fx(-T.y)})`}>
      <defs>
        <filter id={`${uid}g`} colorInterpolationFilters="sRGB" x="0" y="0" width="1" height="1">
          <feColorMatrix type="saturate" values={f3(DIE_GRADE.saturate)} />
          <feColorMatrix type="matrix" values={gradeMatrix(DIE_GRADE)} />
        </filter>
        <linearGradient id={`${uid}r`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={f3(box.h)}>
          <stop offset="0" stopColor={LAMP_TINT} stopOpacity={f3(DIE_GRADE.topLight)} />
          <stop offset="0.45" stopColor={LAMP_TINT} stopOpacity="0" />
          <stop offset="0.55" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={f3(DIE_GRADE.foot)} />
        </linearGradient>
      </defs>
      {showShadow ? <StoutShadow parts={sil} s={SHADOW_S} elevation="rest" /> : null}
      {soft < 0.999 ? img(CHIP_SHARP) : null}
      {soft > 0.001 ? img(CHIP_SOFT, { opacity: f3(soft) }) : null}
      <rect x="0" y="0" width={f3(box.w)} height={f3(box.h)} fill={`url(#${uid}r)`} />
      {showSticker ? <PriceSticker box={sticker} k={kd} text={`${NAME_NM} nm`} /> : null}
      {drain > 0.001 ? <rect x="0" y="0" width={f3(box.w)} height={f3(box.h)} fill={COLOR.ground} opacity={f3(drain)} /> : null}
    </g>
  );
};

/** A dimension bracket drawn by moving tips: left tick grows out from the bar line, the bar runs right, the right
 *  tick grows. Returns the visible body parts (G px) for the one shadow and the body. */
const bracketParts = (
  b: { x0: number; x1: number; y: number; bar: number; tick: number; tickUp: number; tickDown: number },
  f: number,
  t: { tick0: number; bar: number; tick1: number; end: number },
) => {
  const parts: string[] = [];
  const u0 = smoothstep((f - t.tick0) / 4);
  const ub = smoothstep((f - t.bar) / (t.tick1 - t.bar));
  const u1 = smoothstep((f - t.tick1) / (t.end - t.tick1));
  const tick = (x: number, u: number) => {
    if (u <= 0.001) return;
    const up = b.tickUp * u;
    const dn = b.tickDown * u;
    const h = Math.max(b.bar, up + dn);
    parts.push(rectPath(x - b.tick / 2, b.y - Math.max(up, b.bar / 2), b.tick, h, Math.min(1.5, b.tick / 2)));
  };
  tick(b.x0, u0);
  if (ub > 0.001) {
    const xa = b.x0 + b.tick / 2;
    const xb = lerp(xa, b.x1 - b.tick / 2, ub);
    if (xb - xa > 0.2) parts.push(rectPath(xa - 0.5, b.y - b.bar / 2, xb - xa + 0.5, b.bar, 0));
  }
  tick(b.x1, u1);
  return parts;
};

// ===========================================================================
// THE CUT
// ===========================================================================
const NanometersVsReality: React.FC<z.infer<typeof schema>> = () => {
  const uid = uidOf(useId());
  const f = useCurrentFrame();
  const kd = kDie(f);
  const sg = sGate(f);
  const S = screenCentre(f);
  // StoutStage: centre-fixed camera that only zooms (the ground's gentle zoom with the dive, no parallax); the
  // children undo its transform and draw in screen px.
  const cam: Cam = { x: 540, y: 960, k: kd };
  const rest: Cam = { x: 540, y: 960, k: 1 };
  const pool = { x: 540 + (S.x - 540) / kd, y: 960 + (S.y - 960) / kd };
  const unstage = `translate(540 960) scale(${fx(1 / kd)}) translate(-540 -960)`;

  // gates: tone dark -> cream with the photo's handoff
  const tg = lk(kd, GATE_K);
  const gTop = mixHex(DARK, COLOR.cream, tg);
  const gFoot = mixHex(DARK_FOOT, COLOR.creamFoot, tg);
  const visible: number[] = [];
  for (let i = -GATE.n; i < GATE.n; i++) {
    const sx = S.x + gateX(i) * sg;
    const hw = (GATE.w / 2) * sg;
    if (sx + hw > -60 && sx - hw < 1140) visible.push(i); // margin: a culled gate's shadow never shows
  }
  const gatePaths = visible.map((i) => rectPath(gateX(i) - GATE.w / 2, GATE.top, GATE.w, GATE.bottom - GATE.top, GATE_R));
  const showGates = sg * GATE.w > 0.6;

  // brackets (G px)
  const brParts = bracketParts(BR, f, BEAT.bracket);
  const slParts = bracketParts({ ...SL, x1: SL.x0 + SLIVER_W }, f, BEAT.sliver);
  // amber band locked to the screen (y 300 -> 1368), in G px
  const band = [(300 - S.y) / sg, (1368 - S.y) / sg];
  const nameEnter = clamp01((f - BEAT.name) / ENTER_F);
  const readEnter = clamp01((f - BEAT.readout) / ENTER_F);

  return (
    <StoutStage S={f} cam={cam} rest={rest} pool={pool}>
      <g transform={unstage}>
        <Die kd={kd} S={S} />
        {showGates ? (
          <g transform={`translate(${fx(S.x)} ${fx(S.y)}) scale(${fx(sg)})`}>
            <defs>
              <linearGradient id={`${uid}gc`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(GATE.top)} x2="0" y2={f3(GATE.bottom)}>
                <stop offset="0" stopColor={gTop} />
                <stop offset="1" stopColor={gFoot} />
              </linearGradient>
              <linearGradient id={`${uid}am`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(band[0])} x2="0" y2={f3(band[1])}>
                <stop offset="0" stopColor={COLOR.amberTop} />
                <stop offset="1" stopColor={COLOR.amberFoot} />
              </linearGradient>
            </defs>
            {/* one lamp: the gates' shadow and the brackets' (separate objects, one layer each) */}
            <StoutShadow parts={gatePaths.map((d) => ({ d }))} s={SHADOW_S} elevation="rest" strength={tg} />
            {brParts.length ? <StoutShadow parts={brParts.map((d) => ({ d }))} s={SHADOW_S} elevation="rest" /> : null}
            {slParts.length ? <StoutShadow parts={slParts.map((d) => ({ d }))} s={SHADOW_S} elevation="rest" /> : null}
            {gatePaths.map((d, j) => (
              <path key={visible[j]} d={d} fill={`url(#${uid}gc)`} />
            ))}
            {visible.map((i) => (
              <path
                key={`e${i}`}
                d={`M${f3(gateX(i) - GATE.w / 2 + GATE_R)} ${f3(GATE.top + EDGE.CREAM / sg / 2)}H${f3(gateX(i) + GATE.w / 2 - GATE_R)}`}
                stroke={COLOR.edge}
                strokeOpacity={f3(ALPHA.edge * tg)}
                strokeWidth={f3(EDGE.CREAM / sg)}
              />
            ))}
            {/* the pitch bracket: cream card */}
            {brParts.map((d, j) => (
              <path key={`b${j}`} d={d} fill={COLOR.cream} />
            ))}
            {/* the 3 nm sliver: amber, its fixed bloom */}
            {slParts.length ? (
              <g style={{ filter: bloomFilter(sg) }}>
                {slParts.map((d, j) => (
                  <path key={`s${j}`} d={d} fill={`url(#${uid}am)`} />
                ))}
              </g>
            ) : null}
            <Numeral x={NAME.x} y={NAME.y} k={sg} px={TYPE_NAME} text={`${NAME_NM} nm`} tone="amber" anchor="start" enter={nameEnter} glow />
            <Numeral x={READOUT.x} y={READOUT.y} k={sg} px={TYPE_READOUT} text={`${GATE_PITCH_NM} nm`} tone="cream" anchor="middle" enter={readEnter} />
          </g>
        ) : null}
      </g>
    </StoutStage>
  );
};

export default NanometersVsReality;
