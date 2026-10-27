// ---------------------------------------------------------------------------
// DepressionOpeningSPRev2 (sarah-pearl-harbor, opening, seq f30-161). Dwarkesh map style (styles/dwarkesh-map.md).
// Opaque 1080x1920, 24 fps, 132 frames. Replaces the user's native Premiere opening (soup-kitchen pan, then the
// Tariff Act page) with the same shot concept, made smoother and more polished.
//
// CHECK LINE: "With the sound off: Depression-era men queue for free soup — and the answer was a 1930 law
// 'to protect American labor'."
//
// THE LINE: "[Back in the day,] in the Great Depression, the original America Firsters wanted to protect American
// jobs. So they…"
// WORD -> FRAME (local, automated alignment ±2 f): in 2 · the 5 · Great 7 · Depression 13 · the 30 · original 35 ·
// America 45 · firsters 58 · wanted 80 · to 87 · protect 90 · American 98 · jobs 108 · So 119 · they 124.
// DURATION: seq f30..161 inclusive = 132 frames (f0..f131) at 24 fps, then a hard cut to the 1930 cartoon.
//
// THE MOTION: one camera from f0 to f131 (all tracks in DepressionOpeningSPRev2Motion.ts, each the integral of
// raised-cosine velocity lobes; k/dk/d2k plot in the build folder). It opens clearly moving (9 px/f) near the photo's
// left edge, centres the sign (..UP COFFEE & DOUGHNUTS / FOR THE UNEMPLOYED over the first men) around f20
// ("Depression"), and pans right along the queue, peaking at 19.5 px/f on f44 ("America"), at rest by f96. The
// Statutes page rises from below the frame edge at full size and full opacity (f52-78, ~75 % up by f66, peak ~100 px/f
// at f59; it starts low enough that its shadow is off-frame with it), leaning 2.4° and settling through a -0.5°
// counter-lean, its soft deep-brown (#17120D) shadow travelling with it (a contact halo plus a cast shadow to the lower
// right, wider and farther while the sheet is lifted; it ramps in only as the sheet's own edge enters and fades as the
// camera closes in); the photo recedes into a warm DARK dim (50 %) and a 3.5 px blur and, as a deeper plane, magnifies
// less under the push (parallax 0.4). The page lands at 82 % of the width with its whole left edge (margin notes,
// "590") inside the frame; the same camera starts pushing as it settles (one long ease f64-106, peak f84) straight into
// the real words "to protect American" (line 2 of the CHAP. 497 header); the sideways travel lags the zoom so the page
// covers the frame's width from ~f76. Page scale 0.5 -> 2.64 on f100 (phrase 874 px = 81 %, x-height ~47 px, ~12 px on
// a 270 px phone) -> 2.8 on f131 (86 %). The page fills the top of frame from f100: the phrase sits only 223 page px
// under the page's top edge, so its centre sits at y ~586 on f100 (the lowest it can with the edge off-frame). The
// close-up's left frame edge lands at page x 1296 (clean gaps in the running head and line 1, so "Ch. 497. 1930." and
// "commerce" are whole); on the phrase line the clipped end of "States," is feathered into bare paper just before "to".
// Every camera track also carries ONE long tail lobe with the push's own start and peak: after f84 the camera only
// decelerates, yet the hold keeps ~2.4-3 px/f on the phrase (zoom creep about the left edge + a drift up the page;
// nothing clips; phrase centre ~y 504 on f131). The neighbouring words of the real page stay in shot, cropped by the
// frame. On "protect" (f90) one orange marker pen underlines "to protect American" (f90-102, landed before "jobs");
// then (f100-109) the page recedes 25 % toward umber around the phrase, and everything below the underlined line goes
// into "paper in shadow": still sharp (at most ~2.4 px softness), a warm umber layer graded downward takes 80-96.5 %
// of the contrast, so no body type reads in the caption bands. No pulse, no second stroke, nothing fades out.
// Orange appears only as the underline; everything else is umber and cream. No added text.
//
// DELIBERATE STYLE EXCEPTION: the map style wants real images as cream-duotone vignettes or cut-outs, never a
// bright rectangular plate. To keep the user's own photo choice and shot concept, the soup-kitchen photograph stays
// a FULL-FRAME photograph and the Statutes page stays a whole rectangular page. Both are brought into the house
// palette instead: the photo as a warm umber/cream duotone (#17120D -> #E9DDBF, tonal detail kept), the page as
// cream paper with umber ink and a soft deep-brown (#17120D) shadow; house screen grain and vignette on top.
//
// SOURCES (the user's own selections, clip folder images/, read only; baked by
// scripts/clips/sarah-pearl-harbor/bake-opening-rev2.py into public/pearl-opening-rev2/):
//   00.2_GreatDepression_CaponeSoupKitchenChicago1931.jpg — Al Capone's soup kitchen, Chicago, 1931 (US National
//     Archives photograph): "FREE SOUP COFFEE & DOUGHNUTS FOR THE UNEMPLOYED".
//   02.5_ProtectAmericanJobs_TariffAct1930FirstPage.jpg — Statutes at Large vol. 46 p. 590, 71st Congress Sess. II
//     Ch. 497 (June 17, 1930, the Tariff Act of 1930 / Smoot-Hawley): "An Act To provide revenue, to regulate commerce
//     with foreign countries, to encourage the industries of the United States, to protect American labor, and for
//     other purposes." Underline and crop positions measured on that scan (measure scripts in the build folder).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { PaperTop } from "../kits/maps/incaShared";
import {
  BELOW,
  BLUR_MAX,
  DIM_MAX,
  H,
  PAGE_H,
  PAGE_S,
  PAGE_W,
  PAGE_X,
  PAGE_Y,
  PEN,
  PHOTO_FIX,
  PHOTO_H,
  PHOTO_S,
  PHOTO_TY,
  PHOTO_W,
  RISE_DIST,
  SHADE,
  UL1,
  UL_W,
  W,
  belowT,
  camOf,
  dimT,
  pageDY,
  pageRot,
  penT,
  shadowFade,
  FEATHER,
  photoTX,
  photoZoom,
  recedeT,
} from "./DepressionOpeningSPRev2Motion";

export const FPS = 24;
export const DURATION = 132;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const DARK = "#17120D"; // pearlShared's DARK (deep brown), per styles/dwarkesh-map.md
const ACC = "#FFB000";
const ACC_DEEP = "#D98A0C";
const SHADOW = "23,18,13"; // DARK as rgb
const UMBER = "#3F3428"; // LAND: the page recedes toward it
const SH_M = 220; // world px of room around the page for its shadow
const PAPER = "233,221,191"; // the baked page's bare paper (#E9DDBF), rgb
const SH_STEPS = 30; // stacked low-alpha rects per shadow: a smooth soft falloff, darkest at the sheet's edge

type Stroke = { x0: number; x1: number; y0: number; y1: number };

/** a marker stroke as a filled outline: slight taper, slightly irregular ink edge (fixed per stroke, never per frame) */
const markerOutline = (s: Stroke, w: number, seed: string) => {
  const n = Math.max(8, Math.round((s.x1 - s.x0) / 5));
  const sag = 1.8;
  const cy = (t: number) => (1 - t) * (1 - t) * s.y0 + 2 * (1 - t) * t * ((s.y0 + s.y1) / 2 + sag) + t * t * s.y1;
  const half = (t: number) => (w / 2) * (1.05 - 0.15 * t);
  const top: string[] = [];
  const bot: string[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = s.x0 + t * (s.x1 - s.x0);
    const jt = (random(`${seed}-t-${i}`) - 0.5) * 0.7;
    const jb = (random(`${seed}-b-${i}`) - 0.5) * 0.7;
    top.push(`${x.toFixed(1)},${(cy(t) - half(t) + jt).toFixed(2)}`);
    bot.push(`${x.toFixed(1)},${(cy(t) + half(t) + jb).toFixed(2)}`);
  }
  const r0 = half(0);
  const r1 = half(1);
  // round ends: arcs between the top and bottom edges
  return {
    d: `M ${top.join(" L ")} A ${r1} ${r1} 0 0 1 ${bot[n]} L ${bot.reverse().join(" L ")} A ${r0} ${r0} 0 0 1 ${top[0]} Z`,
    cy,
    half,
  };
};

/** one marker stroke under page words, revealed by a moving pen tip (a solid shape under a moving clip) */
const MarkerStroke: React.FC<{ s: Stroke; t: number; id: string }> = ({ s, t, id }) => {
  if (t <= 0) return null;
  const outer = markerOutline(s, UL_W, `${id}-o`);
  const inner = markerOutline({ ...s, y0: s.y0 - 0.9, y1: s.y1 - 0.9 }, UL_W * 0.52, `${id}-i`);
  const px = s.x0 + t * (s.x1 - s.x0);
  const py = outer.cy(t);
  const r = outer.half(t);
  return (
    <g>
      <clipPath id={id}>
        <rect x={s.x0 - UL_W} y={Math.min(s.y0, s.y1) - 20} width={px - s.x0 + UL_W} height={50} />
      </clipPath>
      <g clipPath={`url(#${id})`}>
        <path d={outer.d} fill={ACC_DEEP} />
        <path d={inner.d} fill={ACC} />
      </g>
      {t < 1 ? <circle cx={px} cy={py} r={r} fill={ACC_DEEP} /> : null}
    </g>
  );
};

const DepressionOpeningSPRev2: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = camOf(frame);
  const pz = photoZoom(frame);
  const dim = dimT(frame);
  const dy = pageDY(frame);
  const lift = dy / RISE_DIST; // 1 while the sheet is still below/rising, 0 once laid down
  const rot = pageRot(frame);
  const t1 = penT(frame, PEN.f0, PEN.f1);
  const rec = recedeT(frame);
  const below = belowT(frame);
  // the shadow exists only once the sheet itself is on screen: it ramps in as the page's top edge crosses the
  // frame's bottom edge (and fades out as the camera closes in)
  const pageTopOnScreen = cam.ay + cam.z * (PAGE_Y + dy - cam.wy);
  const entered = Math.min(1, Math.max(0, (H - pageTopOnScreen) / 60));
  const shFade = shadowFade(frame) * entered;
  const fu = Math.min(1, Math.max(0, (frame - 97) / 6));
  const feather = fu * fu * (3 - 2 * fu);
  const featherMask = `linear-gradient(to bottom, transparent 0px, black ${(8 * PAGE_S).toFixed(2)}px, black ${((FEATHER.v1 - FEATHER.v0 - 8) * PAGE_S).toFixed(2)}px, transparent 100%)`;
  const softMask = `linear-gradient(to bottom, transparent ${(BELOW.soft0 * PAGE_S).toFixed(2)}px, black ${(BELOW.soft1 * PAGE_S).toFixed(2)}px)`;
  const pw = PAGE_W * PAGE_S;
  const ph = PAGE_H * PAGE_S;
  const pageVisible = PAGE_Y + dy < H + 120;

  return (
    <AbsoluteFill style={{ backgroundColor: DARK, overflow: "hidden" }}>
      {/* the photo: a deeper plane under the same push (parallax), blur held at BLUR_MAX screen px */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: W,
          height: H,
          transformOrigin: "0 0",
          transform: `translate(${PHOTO_FIX.x}px, ${PHOTO_FIX.y}px) scale(${pz}) translate(${-PHOTO_FIX.x}px, ${-PHOTO_FIX.y}px)`,
        }}
      >
        <Img
          src={staticFile("pearl-opening-rev2/soup-duotone.jpg")}
          style={{
            position: "absolute",
            left: photoTX(frame),
            top: PHOTO_TY,
            width: PHOTO_W * PHOTO_S,
            height: PHOTO_H * PHOTO_S,
            filter: dim > 0.001 ? `blur(${(BLUR_MAX * dim) / pz}px)` : undefined,
          }}
        />
      </div>
      {/* the photo recedes: warm darken toward DARK */}
      <AbsoluteFill style={{ backgroundColor: `rgba(${SHADOW},${(DIM_MAX * dim).toFixed(4)})` }} />
      {/* the page, under the camera */}
      {pageVisible ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: W,
            height: H,
            transformOrigin: "0 0",
            transform: `translate(${cam.ax}px, ${cam.ay}px) scale(${cam.z}) translate(${-cam.wx}px, ${-cam.wy}px)`,
          }}
        >
          {/* the shadow travels with the sheet: DARK sheets under it (same centre and rotation), softened by stacking
              SH_STEPS unblurred rounded rects of low opacity (blurred shadow layers came out empty in this renderer).
              A wide, soft, offset shadow while the sheet is lifted, tightening into a dark contact shadow as it lands. */}
          <svg
            width={pw + 2 * SH_M}
            height={ph + 2 * SH_M}
            style={{
              position: "absolute",
              left: PAGE_X - SH_M,
              top: PAGE_Y + dy - SH_M,
              transformOrigin: "50% 50%",
              transform: `rotate(${rot}deg)`,
              overflow: "visible",
            }}
          >
            {[
              // contact halo on every side (reads above the top edge against the lit crowd)
              { reach: 26 + 40 * lift, dx: 0, dy: -2, o: 0.034 * shFade },
              // cast shadow, light from the upper left: falls right and down, wider and farther while lifted
              { reach: 40 + 60 * lift, dx: 14 + 34 * lift, dy: 14 + 40 * lift, o: 0.026 * shFade },
            ].map((s, i) =>
              Array.from({ length: SH_STEPS }, (_, k) => {
                const g = (s.reach * (k + 1)) / SH_STEPS;
                return (
                  <rect
                    key={`sh${i}-${k}`}
                    x={SH_M - g + s.dx}
                    y={SH_M - g + s.dy}
                    width={pw + 2 * g}
                    height={ph + 2 * g}
                    rx={g}
                    fill={DARK}
                    opacity={s.o}
                  />
                );
              }),
            )}
          </svg>
          <div
            style={{
              position: "absolute",
              left: PAGE_X,
              top: PAGE_Y + dy,
              width: pw,
              height: ph,
              transformOrigin: "50% 50%",
              transform: `rotate(${rot}deg)`,
            }}
          >
            <Img src={staticFile("pearl-opening-rev2/page-cream.jpg")} style={{ position: "absolute", left: 0, top: 0, width: pw, height: ph }} />
            {below > 0 ? (
              <>
                {/* below the underlined line: at most a ~2.4 px softness (one copy, masked in by depth)... */}
                <Img
                  src={staticFile("pearl-opening-rev2/page-cream.jpg")}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: pw,
                    height: ph,
                    filter: `blur(${(BELOW.soft * PAGE_S).toFixed(3)}px)`,
                    opacity: below,
                    WebkitMaskImage: softMask,
                    maskImage: softMask,
                  }}
                />
                {/* ...and paper in shadow: a warm umber layer graded downward that takes the contrast away */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: pw,
                    height: ph,
                    opacity: below,
                    background: `linear-gradient(to bottom, rgba(${SHADE},0) ${(BELOW.dark0 * PAGE_S).toFixed(2)}px, rgba(${SHADE},${BELOW.darkMid}) ${(BELOW.dark1 * PAGE_S).toFixed(2)}px, rgba(${SHADE},${BELOW.darkMax}) ${(BELOW.dark2 * PAGE_S).toFixed(2)}px, rgba(${SHADE},${BELOW.darkMax}) 100%)`,
                  }}
                />
              </>
            ) : null}
            {feather > 0 ? (
              // the close-up's left feather: on the phrase line, the clipped "States," left of "to" fades into the
              // paper (bare-paper cream under the page's own recede and grain), so the frame's left edge never shows
              // a stray ", " fragment
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: FEATHER.v0 * PAGE_S,
                  width: FEATHER.u1 * PAGE_S,
                  height: (FEATHER.v1 - FEATHER.v0) * PAGE_S,
                  opacity: feather,
                  background: `linear-gradient(to right, rgba(${PAPER},1) 0px, rgba(${PAPER},1) ${(FEATHER.u0 * PAGE_S).toFixed(2)}px, rgba(${PAPER},0) ${(FEATHER.u1 * PAGE_S).toFixed(2)}px)`,
                  WebkitMaskImage: featherMask,
                  maskImage: featherMask,
                }}
              />
            ) : null}
            <svg viewBox={`0 0 ${PAGE_W} ${PAGE_H}`} width={pw} height={ph} style={{ position: "absolute", left: 0, top: 0 }}>
              <defs>
                <filter id="rcFeather" x="-20%" y="-50%" width="140%" height="200%">
                  <feGaussianBlur stdDeviation="16" />
                </filter>
                <mask id="rcMask" maskUnits="userSpaceOnUse" x="0" y="0" width={PAGE_W} height={PAGE_H}>
                  <rect x="0" y="0" width={PAGE_W} height={PAGE_H} fill="white" />
                  {/* the phrase stays bright: "to protect American" with its underline */}
                  <g filter="url(#rcFeather)">
                    <rect x={1318} y={204} width={370} height={50} rx={24} fill="black" />
                  </g>
                </mask>
              </defs>
              {rec > 0 ? <rect x="0" y="0" width={PAGE_W} height={PAGE_H} fill={UMBER} opacity={rec} mask="url(#rcMask)" /> : null}
              <g style={{ mixBlendMode: "multiply" }}>
                <MarkerStroke s={UL1} t={t1} id="ul1" />
              </g>
            </svg>
          </div>
        </div>
      ) : null}
      <PaperTop vignette={0.42} />
    </AbsoluteFill>
  );
};

export default DepressionOpeningSPRev2;
