// ---------------------------------------------------------------------------
// VivaldiTookBack (kofman-vivaldi, cut 0). ChinaTalk style (newsprint) (styles/chinatalk.md; kit API in
// generated/components/kits/chinatalk/chinatalkVintage.md). Delivered as 0_VivaldiTookBack.mov.
// Opaque 1080x1920, 24 fps, 145 frames.
//
// CHECK LINE: "in two months (mid-Aug to mid-Oct 2026) Ukraine pushed the Russians out of a whole salient north of
// Lyman — that patch of the map is Ukrainian again."
//
// THE LINE: "[Vivaldi,] in terms of square kilometers, took back more territory in a couple of months than the summer
// 2023 offensive."
// WORD -> FRAME: terms 3 · square 9 · kilometers 13 · took 27 · back 31 · more 38 · territory 52 · in 64 ·
// a couple 68-71 · months 77 · than 86 · the 98 · summer 106 · 2023 111 · offensive 122 (next sentence 140; cut 145).
// DURATION: the slot 0.625 -> 6.667 s = 6.042 s x 24 = 145 frames (f0..f144).
//
// THE MOTION: one continuous soak. f0 is the real Lyman sector on 15 Aug 2026: Russian-held ground hatched, its salient
// bulging west north of Lyman, the front an ink line, the Donets a hair, LYMAN, the kicker "Operation Vivaldi" and the
// date AUG 2026. On "took" (contact f27) red soaks into the salient from its Ukrainian-side edge (the old front, which
// bleeds away f27-41) toward the 15 Oct front: a clean front with RED_WET just behind it, the hatch bleeding out ahead
// of it; fast at the touch, slowing as it spreads, at rest on the new front at f80 ("months" 77). The new front is
// written over the red's east edge by an ink bead, north to south, f66-86, and the date crosses to OCT 2026 (f70-84).
// The camera pushes from k 0.83 (salient ~60 % of the frame) to k 1.10 (the red ~80 %) through the soak and creeps on
// to the last frame; the source line enters at f88. Nothing fades out at the end.
// TWO COLOURS (revision 5 Nov): Ukrainian-held ground is a flat print blue (lymanShared UA_BLUE #3F6A8C at UA_WASH
// 0.33), Russian-held ground the ink wash + hatch. "UKRAINE" sits on the blue for the whole cut; "RUSSIAN-HELD" sits on
// the salient (SALIENT_RUSSIAN_LABEL) and bleeds away f38-52 as the red takes that ground. From f100 (SETTLED_F, the
// flood is long at rest) the map is drawn by VivaldiEndMap: the same picture with a flat RetakenPatch, so cut 11 can
// open on the exact last frame from the exported end state (VIVALDI_END_CAM, _HELD, _FRONTS, _PATCH, _LABELS,
// VIVALDI_HEADER, VIVALDI_HATCH_K, VIVALDI_PLACES; RetakenPatch fill 1 -> 0 / edge 0 -> 1 is the remembered patch).
// Contact: the red's first seep on the old front at f27 (t > 0); the old front's bleed starts on the same frame.
// RED = the ground Ukraine took back in Vivaldi. Nothing else is red.
//
// SOURCES: front lines and areas: DeepStateMap (deepstatemap.live) history snapshots of 15 Aug and 15 Oct 2026, via
// lymanFrontData.ts (assets-src/kofman-vivaldi/build_lyman_data.py). The patch is HELD 15 Aug minus HELD 15 Oct
// (179 km2 by DeepState); no km2 figure and no 2023 comparison is drawn (COMMON.md: the speaker's comparison is not
// supported by the data). The flood's shape: assets-src/kofman-vivaldi/build_vivaldi_soak.ts (a harmonic field from
// the old front to the new, vivaldiSoakData.ts). The map draws HELD 15 Oct + the patch for 15 Aug (lymanShared
// HELD_AUG_DRAWN: two small Russian gains made between the dates, ~1 and ~10 km2, show from f0).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  INK_HI,
  Kicker,
  Label,
  RED,
  RED_WET,
  RedGroup,
  SourceLine,
  VStage,
  WET_DRY_F,
  WET_LEN,
  clamp01,
  cumLen,
  enterFrom,
  labelCapH,
  runVCamera,
  shootEase,
  smoothstep,
  vz,
  KICKER_PAD,
} from "../kits/chinatalk/chinatalkVintage";
import type { Cam, Pt, VCamKey } from "../kits/chinatalk/chinatalkVintage";
import { HELD_20261015, HELD_20261103, MAINFRONT_20261103, RETAKEN_VIVALDI } from "./lymanFrontData";
import {
  FRAMING_SALIENT,
  FRAMING_SALIENT_OPEN,
  FRAMING_SECTOR,
  FRONT_AUG_DRAWN,
  FRONT_OCT_NORTH,
  FRONT_OCT_SOUTH,
  FrontLine,
  HELD_AUG_DRAWN,
  LymanMap,
  RetakenPatch,
  SALIENT_RUSSIAN_LABEL,
  SideLabel,
  VIVALDI_NEW_EDGE,
  VIVALDI_OLD_EDGE,
} from "./lymanShared";
import { SOAK_BOX, SOAK_PNG } from "./vivaldiSoakData";

export const FPS = 24;
export const DURATION = 145;
export const schema = z.object({
  /** stills of the shared map only: "sector" (FRAMING_SECTOR, 3 Nov 2026) or "salient" (FRAMING_SALIENT, 15 Aug) */
  probe: z.enum(["none", "sector", "salient", "stalemate"]),
});
export const defaultProps = schema.parse({ probe: "none" });

// --- the soak --------------------------------------------------------------------
/** contact: the first seep on the old front ("took" 27) */
const T0 = 27;
/** at rest on the new front ("months" 77) */
const T1 = 80;
/** the threshold overshoots 1 so the last level is full when it lands */
const T_MAX = 1.03;
/** ink soaking into paper: fastest at the touch, slowing as it spreads */
const SOAK_P = 1.6;
const soak = (x: number) => 1 - Math.pow(1 - clamp01(x), SOAK_P);
const soakInv = (e: number) => 1 - Math.pow(1 - clamp01(e), 1 / SOAK_P);
/** the soak level at frame S (field units: the fraction of the patch's area flooded) */
const levelAt = (S: number) => (S <= T0 ? 0 : T_MAX * soak((S - T0) / (T1 - T0)));
/** the frame the front passed field level v */
const frameOfLevel = (v: number) => T0 + soakInv(v / T_MAX) * (T1 - T0);
/** the clean front's soft edge, in field units (~2 levels, ~3 world px) */
const EDGE_V = 2 / 255;
/** world px per field unit, on average over the patch (the bake's median spacing x 255) */
const PX_PER_V = 390;
/** the hatch ahead of the front bleeds out over this band, starting this far ahead (field units) */
const BLEED_LEAD = 10 / 255;
const BLEED_W = 16 / 255;
const TABLE_N = 256;
const tableOf = (f: (v: number) => number) =>
  Array.from({ length: TABLE_N }, (_, i) => clamp01(f(i / (TABLE_N - 1))).toFixed(4)).join(" ");
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
const RED_RGB = rgb(RED);
const WET_RGB = rgb(RED_WET);

/** The red soaking through the patch: the baked field as an image, turned into colour per frame by a filter
 *  (alpha table = the flood up to the level, a second layer = the wet band), clipped to the vector patch. */
const Flood: React.FC<{ S: number; k: number }> = ({ S, k }) => {
  const t = levelAt(S);
  if (t <= 0) return null;
  const base = (v: number) => (t - v) / EDGE_V;
  const wet = (v: number) => {
    const age = S - frameOfLevel(v);
    return clamp01(base(v)) * (1 - smoothstep(age / WET_DRY_F)) * (1 - smoothstep(((t - v) * PX_PER_V) / WET_LEN));
  };
  const wetOn = S < T1 + WET_DRY_F + 2;
  const fn = (c: number[]) => (
    <>
      <feFuncR type="linear" slope={0} intercept={c[0].toFixed(5)} />
      <feFuncG type="linear" slope={0} intercept={c[1].toFixed(5)} />
      <feFuncB type="linear" slope={0} intercept={c[2].toFixed(5)} />
    </>
  );
  const fr = { x: SOAK_BOX.x, y: SOAK_BOX.y, width: SOAK_BOX.w, height: SOAK_BOX.h };
  const img = (filter: string) => (
    <image href={SOAK_PNG} x={SOAK_BOX.x} y={SOAK_BOX.y} width={SOAK_BOX.w} height={SOAK_BOX.h} preserveAspectRatio="none" filter={filter} />
  );
  const big = { x: -4000, y: -4000, width: 9000, height: 9000 };
  return (
    <g>
      <defs>
        <clipPath id="vtb-patch">
          <path d={RETAKEN_VIVALDI} clipRule="evenodd" />
        </clipPath>
        <mask id="vtb-outside" maskUnits="userSpaceOnUse" {...big}>
          <rect {...big} fill="#FFFFFF" />
          <path d={RETAKEN_VIVALDI} clipRule="evenodd" fillRule="evenodd" fill="#000000" />
        </mask>
        <filter id="vtb-flood" filterUnits="userSpaceOnUse" {...fr} colorInterpolationFilters="sRGB">
          <feComponentTransfer in="SourceGraphic" result="base">
            {fn(RED_RGB)}
            <feFuncA type="table" tableValues={tableOf(base)} />
          </feComponentTransfer>
          {wetOn ? (
            <>
              <feComponentTransfer in="SourceGraphic" result="wet">
                {fn(WET_RGB)}
                <feFuncA type="table" tableValues={tableOf(wet)} />
              </feComponentTransfer>
              <feComposite in="wet" in2="base" operator="over" />
            </>
          ) : null}
        </filter>
      </defs>
      {/* the red's paper shadow, only where it falls OUTSIDE the patch: ink soaking through paper casts none at its front */}
      <g mask="url(#vtb-outside)">
        <RedGroup k={k}>
          <g clipPath="url(#vtb-patch)">{img("url(#vtb-flood)")}</g>
        </RedGroup>
      </g>
      <g clipPath="url(#vtb-patch)">{img("url(#vtb-flood)")}</g>
    </g>
  );
};

/** The mask that bleeds the hatch out of the patch just ahead of the front (white = keep). */
const HatchBleedMask: React.FC<{ S: number }> = ({ S }) => {
  const t = levelAt(S);
  const big = { x: -4000, y: -4000, width: 9000, height: 9000 };
  return (
    <mask id="vtb-bleed" maskUnits="userSpaceOnUse" {...big}>
      <rect {...big} fill="#FFFFFF" />
      {t > 0 ? (
        <>
          <filter id="vtb-bleed-f" filterUnits="userSpaceOnUse" x={SOAK_BOX.x} y={SOAK_BOX.y} width={SOAK_BOX.w} height={SOAK_BOX.h} colorInterpolationFilters="sRGB">
            <feComponentTransfer>
              <feFuncR type="linear" slope={0} intercept={0} />
              <feFuncG type="linear" slope={0} intercept={0} />
              <feFuncB type="linear" slope={0} intercept={0} />
              <feFuncA type="table" tableValues={tableOf((v) => smoothstep((t + BLEED_LEAD - v) / BLEED_W))} />
            </feComponentTransfer>
          </filter>
          <g clipPath="url(#vtb-patch)">
            <image href={SOAK_PNG} x={SOAK_BOX.x} y={SOAK_BOX.y} width={SOAK_BOX.w} height={SOAK_BOX.h} preserveAspectRatio="none" filter="url(#vtb-bleed-f)" />
          </g>
        </>
      ) : null}
    </mask>
  );
};

// --- the fronts ---------------------------------------------------------------------
/** the old front around the salient bleeds away from the contact */
const OLD_BLEED_F = 14;
/** the new front is written north to south by an ink bead */
const NEW_F0 = 66;
const NEW_F1 = 86;
/** The south pin is a near-reversal: the old edge's last segment runs back over the first stretch of the Oct front
 *  south of it (2 px apart). So the old edge ends, and the new edge runs on, to the Oct front's next vertex, and the
 *  static south line starts there: no spur at any frame. */
const SOUTH_JOIN: Pt = FRONT_OCT_SOUTH[1];
const OLD_EDGE: Pt[] = [...VIVALDI_OLD_EDGE.slice(0, -1), SOUTH_JOIN];
const NEW_EDGE: Pt[] = [...VIVALDI_NEW_EDGE, SOUTH_JOIN];
const SOUTH_STATIC: Pt[] = FRONT_OCT_SOUTH.slice(1);
const NEW_CUM = cumLen(NEW_EDGE);
const NEW_LEN = NEW_CUM[NEW_CUM.length - 1];
const newLenAt = (S: number) => NEW_LEN * shootEase((S - NEW_F0) / (NEW_F1 - NEW_F0));
const shootInv = (e: number) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 30; i++) {
    const m = (lo + hi) / 2;
    if (shootEase(m) < e) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};
const newFrameOf = (s: number) => NEW_F0 + shootInv(s / NEW_LEN) * (NEW_F1 - NEW_F0);
/** the bead drains into the line once it lands on the south pin */
const BEAD_DRAIN_F = 6;

// --- page furniture ------------------------------------------------------------------
const KICKER = { x: 20, y: 150, w: 540 };
/** the date sits under the kicker's hair rule, a "head" label (sized at the settled zoom) */
const dateY = (k: number) => KICKER.y + labelCapH("word", k) / 2 + KICKER_PAD * vz(k) + 26 + labelCapH("head", k) / 2;
const DATE_X0 = 70;
/** the source line closes the header block under the date (under the map it would cross the front by Lyman) */
const sourceY = (k: number) => dateY(k) + labelCapH("head", k) / 2 + 34;
const SOURCE = { x: 20, f: 88 };
/** RUSSIAN-HELD sits on the salient (SALIENT_RUSSIAN_LABEL) and bleeds away from the frame the red front touches its
 *  west end (field level at world (260, 760) -> f37) */
const RUSSIAN_BLEED_F0 = 38;
const RUSSIAN_BLEED_F = 14;
/** once the wet has dried (T1 + WET_DRY_F) the soak is drawn as the exported RetakenPatch at fill 1 over the 15 Oct map
 *  (blue under the patch, no hatch): the same pixels, and the state cut 11 opens on */
const SETTLED_F = 100;

// --- the camera: one push through the soak, then a creep to the last frame ---------------------------------
const key = (f: number, c: Cam, ease?: VCamKey["ease"]): VCamKey => ({ f, x: c.x, y: c.y, k: c.k, ease });
const camAt = runVCamera(
  [
    key(-24, FRAMING_SALIENT_OPEN),
    key(92, FRAMING_SALIENT),
    key(DURATION + 10, { x: FRAMING_SALIENT.x + 4, y: FRAMING_SALIENT.y - 6, k: FRAMING_SALIENT.k * 1.03 }, "linear"),
  ],
  DURATION,
);
export { camAt };

// --- the END STATE (cut 11 opens on this exact last frame) -------------------------------------------------------
/** the hatch pitch is locked at this zoom for the whole cut */
export const VIVALDI_HATCH_K = 0.95;
export const VIVALDI_PLACES = ["Lyman"] as const;
/** the camera on the last frame (f144) */
export const VIVALDI_END_CAM: Cam = camAt(DURATION - 1);
/** held ground on the last frame: the 15 Oct map (the patch is Ukrainian; blue under the red) */
export const VIVALDI_END_HELD = HELD_20261015;
/** the front on the last frame, as three static ink FrontLines (north, the new edge along the patch, south) */
export const VIVALDI_END_FRONTS: Pt[][] = [FRONT_OCT_NORTH, NEW_EDGE, SOUTH_STATIC];
/** the patch on the last frame: RetakenPatch fill 1 (flat RED with its outside paper shadow), no RED_DEEP edge yet */
export const VIVALDI_END_PATCH = { fill: 1, edge: 0 } as const;
/** labels on the last frame: UKRAINE at SIDE_LABELS.ukraine (shown); RUSSIAN-HELD gone (it bled away on the salient);
 *  LYMAN dot + label; the header block below fully in (kit Kicker, "head" Label anchor start, SourceLine) */
export const VIVALDI_END_LABELS = { ukraine: true, russian: false, places: VIVALDI_PLACES } as const;
export const VIVALDI_HEADER = {
  kicker: { text: "Operation Vivaldi", x: KICKER.x, y: KICKER.y, width: KICKER.w },
  date: { text: "Oct 2026", x: KICKER.x, y: dateY(FRAMING_SALIENT.k) },
  source: { text: "Front line: DeepStateMap, 15 Aug and 15 Oct 2026", x: SOURCE.x, y: sourceY(FRAMING_SALIENT.k) },
} as const;
/** The settled map from SETTLED_F to the end (= cut 11's first frame): 15 Oct held ground with the blue, the red patch,
 *  the three front pieces, Lyman. Put SideLabel ukraine and the VIVALDI_HEADER furniture over it. */
export const VivaldiEndMap: React.FC<{ k: number; id?: string; patch?: { fill: number; edge: number } }> = ({ k, id = "vtb", patch = VIVALDI_END_PATCH }) => (
  <LymanMap id={id} k={k} hatchK={VIVALDI_HATCH_K} held={VIVALDI_END_HELD} fronts={VIVALDI_END_FRONTS} places={VIVALDI_PLACES}>
    <RetakenPatch id={`${id}-patch`} k={k} fill={patch.fill} edge={patch.edge} />
  </LymanMap>
);

/** cut 11's last camera (LooksLikeStalemate STALEMATE_END_CAM, 5 Nov 2026), for the label check only */
const PROBE_STALEMATE_CAM: Cam = { x: 708.63, y: 895.17, k: 0.9585 };
const Probe: React.FC<{ S: number; probe: "sector" | "salient" | "stalemate" }> = ({ S, probe }) => {
  const cam = probe === "sector" ? FRAMING_SECTOR : probe === "stalemate" ? PROBE_STALEMATE_CAM : FRAMING_SALIENT;
  const k = cam.k;
  return (
    <VStage S={S} cam={cam}>
      {probe !== "salient" ? (
        <>
          <LymanMap id="p" k={k} held={HELD_20261103} fronts={[MAINFRONT_20261103]} places={["Lyman", "Siversk", "Yarova"]} dots={["Serednie", "Zelena Dolyna", "Kolodiazi"]}>
            <RetakenPatch id="p-patch" k={k} />
          </LymanMap>
          <SideLabel which="ukraine" k={k} />
          <SideLabel which="russian" k={k} />
        </>
      ) : (
        <>
          <LymanMap id="p" k={k} held={HELD_AUG_DRAWN} fronts={[FRONT_AUG_DRAWN]} places={["Lyman"]} />
          <SideLabel which="ukraine" k={k} />
          <SideLabel which="russian" k={k} at={SALIENT_RUSSIAN_LABEL} />
        </>
      )}
    </VStage>
  );
};

const VivaldiTookBack: React.FC<z.infer<typeof schema>> = ({ probe }) => {
  const S = useCurrentFrame();
  if (probe !== "none") return <Probe S={S} probe={probe} />;
  const cam = camAt(S);
  const k = cam.k;
  const kEnd = FRAMING_SALIENT.k;
  const newLen = newLenAt(S);
  const beadOn = S < NEW_F0 ? 0 : 1 - smoothstep((S - NEW_F1) / BEAD_DRAIN_F);
  return (
    <VStage S={S} cam={cam}>
      {S < SETTLED_F ? (
        <>
          <defs>
            <HatchBleedMask S={S} />
          </defs>
          <LymanMap id="vtb" k={k} hatchK={VIVALDI_HATCH_K} held={HELD_AUG_DRAWN} heldMask="url(#vtb-bleed)" fronts={[FRONT_OCT_NORTH, SOUTH_STATIC]} places={VIVALDI_PLACES}>
            <Flood S={S} k={k} />
            <FrontLine id="vtb-old" points={OLD_EDGE} k={k} diffuse={clamp01((S - T0) / OLD_BLEED_F)} />
            {S >= NEW_F0 ? (
              <FrontLine id="vtb-new" points={NEW_EDGE} k={k} len={newLen} ageAt={(s) => S - newFrameOf(s)} bead={beadOn} />
            ) : null}
          </LymanMap>
        </>
      ) : (
        <VivaldiEndMap k={k} />
      )}
      <SideLabel which="ukraine" k={k} />
      <SideLabel which="russian" k={k} at={SALIENT_RUSSIAN_LABEL} diffuse={clamp01((S - RUSSIAN_BLEED_F0) / RUSSIAN_BLEED_F)} />
      <Kicker text={VIVALDI_HEADER.kicker.text} x={KICKER.x} y={KICKER.y} k={k} width={KICKER.w} />
      <Label text="Aug 2026" x={KICKER.x} y={dateY(kEnd)} k={k} size="head" anchor="start" rung={INK_HI} diffuse={clamp01((S - DATE_X0) / 14)} />
      <Label text={VIVALDI_HEADER.date.text} x={KICKER.x} y={dateY(kEnd)} k={k} size="head" anchor="start" rung={INK_HI} appear={enterFrom(S, DATE_X0 + 2)} />
      <SourceLine text={VIVALDI_HEADER.source.text} x={SOURCE.x} y={sourceY(kEnd)} k={k} appear={enterFrom(S, SOURCE.f)} />
    </VStage>
  );
};

export default VivaldiTookBack;
