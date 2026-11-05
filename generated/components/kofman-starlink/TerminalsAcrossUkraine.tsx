// ---------------------------------------------------------------------------
// TerminalsAcrossUkraine (kofman-starlink, cut 33). ChinaTalk style (newsprint) (styles/chinatalk.md; kit API in
// generated/components/kits/chinatalk/chinatalkVintage.md).
// Opaque 1080x1920, 24 fps, 143 frames.
//
// CHECK LINE: "Over 50,000 Starlink terminals spread across all of free Ukraine, right up to the front."
//
// THE LINE: "And to scale up like the rapid proliferation of the many, many thousands of Starlink terminals across
// Ukraine, it's proven an essential enabling technology."
// WORD -> FRAME: rapid -2 · proliferation 5 · of 16 · the 22 · many 23 · many 30 · thousands 34 · of 44 · Starlink 49 ·
// terminals 57 · across 66 · Ukraine 74 · it's 91 · proven 106 · an 111 · essential 115 · enabling 121 ·
// technology 129 (ends 138) · cut back to the speaker at 143.
// DURATION: the slot 33.5833 -> 39.5417 s = 5.958 s x 24 = 143 frames (f0..f142).
//
// THE MOTION: one continuous pull-back from inside the proliferating field to the whole country. The cut opens at
// k 2.8 on western Ukraine around Lviv, the thick ink border in shot and a cluster of big red terminals already there;
// each terminal's birth frame is its distance from the Lviv seed (with a low-frequency ragged front and hash noise),
// so the births sweep west -> east, fastest on "many, many thousands" (f23-44), and reach the front by ~f80 while the
// camera pulls back over the same span and settles on the full country by ~f84 (keys early; the follower lags). The
// occupied territory soaks in as an ink hatch (f54-84, west -> east, behind the wave) and stays empty. From f91 the
// field is complete and lives by one slow travelling highlight: a soft band in which the terminals shift toward RED_HI
// (colour only) sweeps once across free Ukraine west -> east, f90 -> the front at f135, while the camera creeps. Through the
// pull-back the western border keeps >= 60 screen px of paper inside the left edge (a zoom-only bound on the camera x).
// THE COUNT (rev 3): the field is a count, 1 dot = 25 terminals, exactly 2,000 dots = 50,000. A counter above the map
// reads the births off the field (dots shown x 25, down to the 100), comes into frame with its legend (a dot "= 25
// terminals") on "thousands" (enters f30, lands f38, in frame from ~f33 at ~24,000), climbs fastest f34-44 and lands
// on 50,000+ on f80, the frame the last terminal appears; it never changes after (rounded down, so 50,000 never shows
// without its "+"). The counter is the headline at 1.9x the kit value size, the legend key 1.3x. The layout is one
// centred column on the wide (k 0.9): kicker (no rules) y 196, counter 292, legend 376, map 420-996, source line 1032.
// Landings: kicker STARLINK TERMINALS lands f49, counter f38 -> 50,000+ f80, the hatch f54-84 (unlabelled), source f88.
// RED = Starlink (the terminals). Nothing else is red.
//
// SOURCES: Ukraine outline: Natural Earth 10m (world-atlas). This Natural Earth build assigns Crimea to "Russia", so
// the Crimea polygon is taken from NE's "Russia" feature and unioned into Ukraine (the internationally recognised
// border, same NE coast, exact join at Perekop). Occupied territory as of 3 Nov 2026: DeepStateMap
// (https://deepstatemap.live), assets-src/kofman-starlink/deepstate_occupied_20261103.geojson, 28 polygons unioned and
// clipped to the outline. Built by scripts/maps/configs/kofman-starlink.mjs (build only, no bake) into
// ukraineMapData.ts. The count: "over 50,000" Starlink terminals delivered to Ukraine through the Ministry of Digital
// Transformation, Ukrinform, 3 Apr 2025, after a Fedorov announcement
// (https://ukrinform.net/amp/rubric-society/3978117-ukraine-receives-5000-more-starlink-terminals-from-poland.html);
// on screen as 50,000+ and as 2,000 dots of 25. Where a dot stands is a picture of spread, not a location record.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  FeatherWipe,
  HatchFill,
  INK_HI,
  Label,
  RED,
  RED_DEEP,
  RED_HI,
  RedGroup,
  SOURCE_PX,
  EDGE_SAFE,
  FRAME_W,
  SourceLine,
  VStage,
  V_INK,
  clamp01,
  easeOutCubic,
  enterFrom,
  enterU,
  labelWidth,
  lineW,
  mixHex,
  runVCamera,
  smoothstep,
  vz,
} from "../kits/chinatalk/chinatalkVintage";
import type { Pt } from "../kits/chinatalk/chinatalkVintage";
import { hash, makeTone } from "../kits/dwarkesh/fieldShared";
import { DOTS, DOT_COUNT, DOT_R, OCCUPIED, OCCUPIED_BOX, PLACES, TERMINALS_PER_DOT, UKRAINE_BOX, UKRAINE_D } from "./ukraineMapData";

export const FPS = 24;
export const DURATION = 143;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---------------------------------------------------------------------------
// THE CAMERA: one pull-back, keyed early (the follower lags ~8-10 f), then a slow creep in the same direction.
// World px == screen px at the resolved view (540, 960, k 1).
// The western border keeps paper inside the left frame edge through the pull-back: the follower's x is held under a
// bound that is a smooth function of the zoom alone (the static map's west tip WEST_X lands >= LEFT_PAD screen px in,
// sway included), joined with a soft minimum so the track stays one smooth curve. It binds through the pull-back and
// only grazes the wide (the resolved view sits ~4 px west of its key: the map's side margins even out at ~64 px).
// The spread then fills toward the right.
// The vertical is likewise a smooth function of the zoom alone: the map's top edge sits at screen y MAP_TOP_SCREEN(k),
// ~395 on the close opening and 400 on the wide, lifted by up to TOP_LIFT through the middle of the pull-back (in
// log zoom), so the page above the map (the counter, the legend, the kicker) comes into frame early, while the count
// is still running, instead of along the top edge. The follower's own y is not used.
// ---------------------------------------------------------------------------
const SEED = { x: PLACES.lviv[0] + 6, y: PLACES.lviv[1] + 6 };
/** the outline's westernmost world x (Zakarpattia) */
const WEST_X = UKRAINE_BOX[0];
/** screen px of paper kept between the frame's left edge and the border (incl. the 5 px house sway) */
const LEFT_PAD = 58;
const SOFT = 9;
const followCam = runVCamera(
  [
    { f: -20, x: SEED.x + 34, y: SEED.y + 4, k: 2.9 },
    { f: -6, x: SEED.x + 37, y: SEED.y + 8, k: 2.86, ease: "linear" },
    { f: 72, x: 540, y: 978, k: 0.915 },
    { f: DURATION, x: 541, y: 976, k: 0.9, ease: "linear" },
  ],
  DURATION,
);
const softMin = (a: number, b: number, s: number) => Math.min(a, b) - s * Math.log1p(Math.exp(-Math.abs(a - b) / s));
const MAP_TOP = UKRAINE_BOX[1];
const K_OPEN = followCam(0).k;
const K_WIDE = 0.9;
const TOP_OPEN = 395;
const TOP_WIDE = 420;
const TOP_LIFT = 150;
const mapTopScreen = (k: number) => {
  const u = clamp01((Math.log(K_OPEN) - Math.log(k)) / (Math.log(K_OPEN) - Math.log(K_WIDE)));
  return TOP_OPEN + (TOP_WIDE - TOP_OPEN) * u + TOP_LIFT * Math.sin(Math.PI * u);
};
export const camAt = (S: number) => {
  const c = followCam(S);
  const bound = WEST_X + (540 - LEFT_PAD) / c.k;
  return { ...c, x: softMin(c.x, bound, SOFT), y: MAP_TOP - (mapTopScreen(c.k) - 960) / c.k };
};

// ---------------------------------------------------------------------------
// THE SPREAD: a front leaves the Lviv seed and sweeps east. Its radius R(f) runs on one speed curve whose peak sits
// on "many, many thousands" (f23-44); a terminal is born when the front reaches its (ragged) distance.
// ---------------------------------------------------------------------------
type Term = { x: number; y: number; r: number; birth: number; rest: number; h: number };
/** frames a terminal takes to grow in (Seal-style easeOutCubic) */
const GROW_F = 8;
/** frames the fresh (bright RED) ink takes to dry halfway toward its rest tone */
const DRY_F = 14;
/** the front's radius at f0 (a cluster of dozens already in) and the frame it reaches the farthest terminal */
const R0 = 104;
const FRONT_END_F = 80;
const effDist = (x: number, y: number, h: number) => {
  const dx = x - SEED.x;
  const dy = y - SEED.y;
  const th = Math.atan2(dy, dx);
  const d = Math.hypot(dx, dy);
  // low-frequency ragged front (not a circle), plus per-dot noise so the edge is a scatter, not a line
  return d * (1 + 0.07 * Math.sin(3 * th + 1.3) + 0.045 * Math.sin(5 * th + 4.1) + 0.03 * Math.sin(8 * th + 0.4)) + (h - 0.5) * 46;
};
const RAW = DOTS.map(([x, y, r, h], i) => ({ x, y, r, h, d: effDist(x, y, h), i }));
const R_MAX = Math.max(...RAW.map((t) => t.d)) + 4;
/** front speed shape (unnormalised): a base pace plus a bump on f23-44 */
const vShape = (f: number) => 0.3 + Math.exp(-Math.pow((f - 34) / 13, 2)) + 0.25 * Math.exp(-Math.pow((f - 58) / 14, 2));
const STEP = 0.25;
const FRONT: { f: number; R: number }[] = (() => {
  let total = 0;
  for (let f = 0; f < FRONT_END_F; f += STEP) total += vShape(f + STEP / 2) * STEP;
  const scale = (R_MAX - R0) / total;
  const out: { f: number; R: number }[] = [];
  // before f0, the front ran at its f0 speed (so the cluster's rim is mid-growth on frame 0)
  const v0 = vShape(0) * scale;
  for (let f = -40; f < 0; f += STEP) out.push({ f, R: R0 + v0 * f });
  let R = R0;
  for (let f = 0; f <= FRONT_END_F + 1e-6; f += STEP) {
    out.push({ f, R });
    R += vShape(f + STEP / 2) * STEP * scale;
  }
  return out;
})();
const birthOf = (d: number) => {
  if (d <= FRONT[0].R) return -60;
  for (let i = 1; i < FRONT.length; i++)
    if (FRONT[i].R >= d) {
      const a = FRONT[i - 1];
      const b = FRONT[i];
      return a.f + ((d - a.R) / (b.R - a.R)) * (b.f - a.f);
    }
  return FRONT_END_F;
};
export const TERMS: Term[] = RAW.map((t) => ({
  x: t.x,
  y: t.y,
  r: DOT_R * t.r,
  birth: birthOf(t.d),
  rest: 0.32 + 0.5 * hash(t.i, 31),
  h: t.h,
}));
/** the frame the last terminal is fully grown */
export const LAST_GROWN = Math.max(...TERMS.map((t) => t.birth)) + GROW_F;
const tone = makeTone(RED_DEEP, RED);
const rgbHex = (rgb: string) => `#${(rgb.match(/\d+/g) ?? []).map((v) => Number(v).toString(16).padStart(2, "0")).join("")}`;

// ---------------------------------------------------------------------------
// THE LIVING HOLD: once the field is complete, one slow travelling highlight. A soft band in which the terminals
// shift toward RED_HI (colour only: no size change, no rings) sweeps once across free Ukraine, west -> east, at one
// steady pace: it enters from the western border at HL_F0 and its centre reaches the easternmost terminals (the front)
// at HL_F1. About a fifth of the country wide (full width at half strength), Gaussian feathered edges, and each dot's
// own hash nudges where the band meets it so the edges are a scatter, not a ruled line. It only recolours dots, so
// nothing reaches the hatch or the border. It reads as the network lit / alive, never as impacts.
// ---------------------------------------------------------------------------
const HL_F0 = 90;
const HL_F1 = 135;
const COUNTRY_W = UKRAINE_BOX[2] - UKRAINE_BOX[0];
/** full width at half strength = a fifth of the country */
const HL_SIGMA = COUNTRY_W / 5 / 2.355;
/** peak shift toward RED_HI at the band's centre */
const HL_PEAK = 0.8;
const HL_EAST = Math.max(...TERMS.map((t) => t.x));
/** the centre starts this far west of the border, so the band soaks in from outside the country */
const HL_X0 = UKRAINE_BOX[0] - 2.2 * HL_SIGMA;
const HL_SPEED = (HL_EAST - HL_X0) / (HL_F1 - HL_F0);
const bandAt = (S: number, x: number, h: number) => {
  if (S <= HL_F0 - 1) return 0;
  const cx = HL_X0 + HL_SPEED * (S - HL_F0);
  const u = (x + (h - 0.5) * 0.6 * HL_SIGMA - cx) / HL_SIGMA;
  return HL_PEAK * Math.exp(-0.5 * u * u);
};

// ---------------------------------------------------------------------------
// LAYOUT (world px == screen px at the resolved view)
// ---------------------------------------------------------------------------
// One centred column, laid out in SCREEN px on the wide (k K_WIDE, map top at TOP_WIDE) and placed in the world from
// there: kicker, counter, legend, the map (screen y 400-1002), the source line (1036). All above y 1060.
const MAP_CX = (UKRAINE_BOX[0] + UKRAINE_BOX[2]) / 2;
const WIDE_CY = MAP_TOP - (TOP_WIDE - 960) / K_WIDE;
const worldY = (screenY: number) => WIDE_CY + (screenY - 960) / K_WIDE;
const KICKER_Y = worldY(196);
const COUNTER_Y = worldY(292);
const LEGEND_Y = worldY(376);
const SOURCE_Y = worldY(1032);
/** The counter is the headline: the kit's "value" label drawn COUNTER_GAIN x its size (a scale about its own centre;
 *  the kit's font, weight, figures and entrance are untouched). Above k 1 the gain cancels the size law, so the number
 *  keeps its wide-shot size on screen through the pull-back instead of growing past the frame edge. */
const COUNTER_GAIN = 1.9;
const counterScale = (k: number) => COUNTER_GAIN * (k > 1 ? Math.pow(k, -0.75) : 1);
/** the legend's key text at LEGEND_GAIN x the kit's source-line size (its dot stays a field dot) */
const LEGEND_GAIN = 1.3;
const scaleAbout = (x: number, y: number, s: number) =>
  `translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${s.toFixed(5)}) translate(${(-x).toFixed(3)} ${(-y).toFixed(3)})`;
// THE COUNT: every dot is TERMINALS_PER_DOT terminals. The counter reads the births straight off the field (a dot is
// counted from the frame it shows), x 25, rounded to the nearest 100; it rides the spread (fastest on f34-44) and lands
// on 50,000+ on the frame the last terminal appears, then never changes.
const COUNT_FINAL = "50,000+";
/** the counter (and its legend) land here: on "thousands" (f34), once the camera has brought the page above the map in */
const COUNTER_F = 38;
const SOURCE_F = 88;
const LEGEND_TEXT = "= 25 terminals";
const SOURCE_TEXT = "Source: Ministry of Digital Transformation, via Ukrinform, Apr 2025";
const BIRTHS = TERMS.map((t) => t.birth).sort((a, b) => a - b);
export const bornAt = (S: number) => {
  let lo = 0;
  let hi = BIRTHS.length;
  while (lo < hi) {
    const m = (lo + hi) >> 1;
    if (BIRTHS[m] < S) lo = m + 1;
    else hi = m;
  }
  return lo;
};
export const countText = (S: number) => {
  const n = bornAt(S);
  if (n >= DOT_COUNT) return COUNT_FINAL;
  // rounded DOWN, so "50,000" never shows without its "+": the "+" arrives with the 2,000th dot
  return (Math.floor((n * TERMINALS_PER_DOT) / 100) * 100).toLocaleString("en-US");
};
/** the legend, centred as a group: a terminal dot, a gap, then the italic key (its width estimated from the kit's
 *  source-line size: Source Serif 4 Italic averages ~0.47 em a glyph) */
const legendGeom = (k: number) => {
  const fs = LEGEND_GAIN * Math.max(SOURCE_PX * vz(k), SOURCE_PX / k);
  const textW = 0.47 * fs * LEGEND_TEXT.length;
  const gap = 0.45 * fs;
  const w = 2 * DOT_R + gap + textW;
  const x0 = MAP_CX - w / 2;
  return { dotX: x0 + DOT_R, textX: x0 + 2 * DOT_R + gap };
};
const OCC_POLYS: Pt[][] = OCCUPIED.filter((r) => r.length > 6).map((r) => r.map(([x, y]) => ({ x, y })));
const HATCH_ANCHOR = { x: 0, y: 0 };
/** the hatch soaks in west -> east behind the wave */
const HATCH_F0 = 54;
const HATCH_F1 = 84;
const HATCH_BOX = { x0: OCCUPIED_BOX[0] - 10, y0: OCCUPIED_BOX[1] - 10, x1: OCCUPIED_BOX[2] + 10, y1: OCCUPIED_BOX[3] + 10 };

const TerminalsAcrossUkraine: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = camAt(S);
  const k = cam.k;

  // only what the camera can see
  const hw = 600 / k;
  const hh = 1020 / k;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < TERMS.length; i++) {
    const t = TERMS[i];
    const age = S - t.birth;
    if (age <= 0) continue;
    if (Math.abs(t.x - cam.x) > hw || Math.abs(t.y - cam.y) > hh) continue;
    const g = easeOutCubic(clamp01(age / GROW_F));
    const wet = Math.pow(0.5, Math.max(0, age - GROW_F * 0.5) / DRY_F);
    const fill = tone(t.rest + (1 - t.rest) * wet);
    const hl = bandAt(S, t.x, t.h);
    dots.push(<circle key={i} cx={t.x} cy={t.y} r={(t.r * g).toFixed(3)} fill={hl > 0.004 ? mixHex(rgbHex(fill), RED_HI, hl) : fill} />);
  }

  const hatchU = clamp01((S - HATCH_F0) / (HATCH_F1 - HATCH_F0));
  const legend = legendGeom(k);
  // the scaled counter's own edge fade (the kit fades a label by its unscaled box)
  const cs = counterScale(k);
  const chw = (labelWidth(COUNT_FINAL, "value", k) / 2) * cs;
  const cLeft = 540 + (MAP_CX - chw - cam.x) * k;
  const cRight = 540 + (MAP_CX + chw - cam.x) * k;
  const cEdge = smoothstep(Math.min(cLeft, FRAME_W - cRight) / EDGE_SAFE);
  // the legend comes in with the number, never ahead of it
  const legendU = enterU(S, COUNTER_F) * cEdge;

  return (
    <VStage S={S} cam={cam}>
      {/* the occupied territory: an ink wash under a fine hatch, soaking in behind the wave; never a dot in it */}
      <FeatherWipe id="occ-wipe" box={HATCH_BOX} u={smoothstep(hatchU)} feather={140} dir="right">
        {OCC_POLYS.map((poly, i) => (
          <HatchFill key={i} id={`occ-hatch-${i}`} region={poly} k={k} color={V_INK} fill={0.1} lineOpacity={0.35} anchor={HATCH_ANCHOR} />
        ))}
      </FeatherWipe>

      {/* the terminals: red, on one warm paper shadow */}
      <RedGroup k={k}>{dots}</RedGroup>

      {/* the border: thick ink, the whole country (Crimea included) */}
      <path d={UKRAINE_D} fill="none" stroke={V_INK} strokeOpacity={INK_HI} strokeWidth={lineW(k).toFixed(3)} strokeLinejoin="round" />

      <Label text="Starlink terminals" x={MAP_CX} y={KICKER_Y} k={k} size="word" appear={enterU(S, 49)} />
      <g transform={scaleAbout(MAP_CX, COUNTER_Y, cs)}>
        <Label text={countText(S)} x={MAP_CX - labelWidth(COUNT_FINAL, "value", k) / 2} y={COUNTER_Y} k={k} size="value" anchor="start" rung={INK_HI * cEdge} appear={enterU(S, COUNTER_F)} />
      </g>
      <RedGroup k={k}>
        <circle cx={legend.dotX} cy={LEGEND_Y} r={(DOT_R * easeOutCubic(legendU)).toFixed(3)} fill={tone(0.6)} />
      </RedGroup>
      <g transform={scaleAbout(legend.textX, LEGEND_Y, LEGEND_GAIN)}>
        <SourceLine text={LEGEND_TEXT} x={legend.textX} y={LEGEND_Y} k={k} rung={INK_HI} appear={legendU} />
      </g>
      <SourceLine text={SOURCE_TEXT} x={MAP_CX} y={SOURCE_Y} k={k} anchor="middle" appear={enterFrom(S, SOURCE_F)} />
    </VStage>
  );
};

export default TerminalsAcrossUkraine;
