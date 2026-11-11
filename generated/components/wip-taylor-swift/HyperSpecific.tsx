// ---------------------------------------------------------------------------
// HyperSpecific (wip-taylor-swift, cut 28). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 84 frames.
//
// CHECK LINE: "Her songs are full of tiny, real, specific things: a red scarf, a cardigan, a polaroid come out of the
// record." With no sound: a record turns on the page, and a red knit scarf, a cable-knit cardigan and a polaroid slide out
// from under it, one after another, the red scarf the eye's first stop.
//
// THE LINE: "This is why her songs are filled with rich, hyper-specific moments and images."
// WORD -> FRAME: This 0 · is 1 · why 5 · her 8 · songs 12 · are 18 · filled 23 · with 28 · rich 31 · hyper 40 ·
// specific 48 · moments 57 · and 68 · images 73 · (cut back to the speaker at f82)
// DURATION: the slot 28.2931 -> 31.7100 s = 82 frames at 24 + 2 frames of tail handle = 84 frames (f0..f83).
//
// THE MOTION: one continuous push-in. A b&w LP lies on the page from f0, its label turning at a slow constant speed (the
// vinyl's sheen stays put, as on a turntable; the label is plain paper, no one's record). From "filled" three real things
// are dealt out from under it, each sliding clear of the disc with a small turn and lying flat on the page round it: the
// red knit scarf with its fringe to the upper left (All Too Well), a polaroid of her on the 1989 World Tour to the upper
// right (1989), the cream cable-knit cardigan down the left side beside her head (folklore). The camera pushes in from f0,
// easing into a creep by "images", drifting so the scarf sits nearer the middle.
// THE PRESENTER (COMMON.md): she is keyed over the middle and bottom of the frame, so the record and the scarf and polaroid
// live in y ~120-760; the cardigan sits in the left strip beside her head. `presenter` (preview only) darkens her area.
// Contact frames: nothing presses. Each thing leaves the record's edge a few frames after its start and lies flat on its
// landing frame: scarf 21 -> 37 (out from under the rim ~f25, "filled"), polaroid 31 -> 47 ("specific" 48), cardigan
// 41 -> 57 ("moments" 57).
// SPOT INK: red = where her focus lands: the scarf, printed in red over its b&w print. No indigo in this cut.
//
// SOURCES (animation_source/assets_raw/SOURCES.txt, group song/; Commons):
// Record: "A&M Records 12" LP (Side 1)", DiscoA340, CC0 (vinyl_record_AandM_b.jpg).
// Scarf: "Brioche scarf", snickclunk, CC BY 2.0 (scarf_red_knit_a.jpg): the All Too Well scarf stand-in.
// Cardigan: "Aran cardigan", Lisa Dusseault, CC BY 2.0 (cardigan_cream_cableknit_a.jpg): the folklore cardigan stand-in.
// Polaroid: "Example of Polaroid 600 type photo", Sgroey, CC BY-SA 4.0 (polaroid_single_a.jpg); in its window, Taylor on the
// 1989 World Tour, AAMI Park, Melbourne, 12 Dec 2015, "Taylor Swift AAMI Park 20151212 02", AussieLegend, CC BY-SA 4.0
// (taylor/taylor_2015_1989Tour_fulllength.jpg).
// Bake: scripts/clips/wip-taylor-swift/bake-hyper-28.py (Apple Vision fg mattes; the LP stretched to a circle and its
// label repainted as plain paper and cut out to turn; the scarf rebuilt from its own knit: a band of three stretches of the
// photo laid end to end along the ribs, a fringe cut from single ribs, bent into a loose S; Taylor set into the polaroid's
// window; all graded by wip-anthropic/bake-photo.py).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CaptionBandsDebug,
  CutOut,
  InkPrint,
  PaperGround,
  RED,
  WipCam,
  WipFilmLife,
  WipPlane,
  depthTransform,
  inkOn,
  runWipCamera,
  slide,
} from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 84;
export const schema = z.object({ bands: z.boolean(), presenter: z.boolean() });
export const defaultProps = schema.parse({ bands: false, presenter: false });

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// -- the record (world px = screen px at the opening key) ----------------------------------------------------------------
// hs_record.png: the disc fills 0.987 of the print's width; hs_record_label.png is 0.3857 of it, on the same centre.
const REC = { x: 540, y: 462, disc: 430 };
const REC_W = REC.disc / 0.987;
const LABEL_W = REC_W * 0.3857;
const SPIN = 4.6; // degrees per frame, constant (about 18 rpm)
const SPIN0 = -24;

// -- the camera: one push-in, easing into a creep by "images" ------------------------------------------------------------
// The record's centre is held on a screen point that drifts right and down while the zoom rises, so the frame's middle
// moves toward the scarf (upper left). Keys every 4 frames, linear, sampled from an ease-out; the follower smooths them.
const K_END = 1.085;
const REC_END = { x: 572, y: 500 };
const CREEP = 0.00045; // zoom per frame after the push, so the hold stays alive
const hold = (f: number, wx: number, wy: number, sx: number, sy: number, k: number) => ({
  f,
  x: wx - (sx - 540) / k,
  y: wy - (sy - 960) / k,
  k,
  ease: "linear" as const,
});
const PUSH_FROM = -10;
const PUSH_TO = 76;
const pushAt = (f: number) => {
  const t = clamp01((f - PUSH_FROM) / (PUSH_TO - PUSH_FROM));
  return 1 - (1 - t) ** 2.2;
};
const camKey = (f: number) => {
  const p = pushAt(f);
  const k = K_END ** p * (1 + CREEP * Math.max(0, f - 40));
  return hold(f, REC.x, REC.y, 540 + (REC_END.x - 540) * p, REC.y + (REC_END.y - REC.y) * p, k);
};
const camAt: (f: number) => WipCam = runWipCamera(
  [{ f: -30, x: 540, y: 960, k: 1 }, ...Array.from({ length: 34 }, (_, i) => camKey(-16 + i * 4))],
  DURATION,
);

// -- the three things: placed by where they lie on screen in the last frame ----------------------------------------------
const END = depthTransform(camAt(DURATION - 1));
const toWorld = (sx: number, sy: number) => ({ x: (sx - END.tx) / END.k, y: (sy - END.ty) / END.k });

type Thing = {
  key: string;
  src: string;
  aspect: number;
  w: number; // world px wide
  at: { x: number; y: number }; // world centre, landed
  rot: number; // landed tilt
  turn: number; // degrees it turns on the way out
  start: number; // first frame it moves
  land: number; // lies flat
  gamma: number; // the print's mid-tone on the page (below 1 lighter)
};
const DEAL = 16;
const mk = (key: string, src: string, aspect: number, screenW: number, sx: number, sy: number, rot: number, turn: number, start: number, gamma = 1): Thing => ({
  key,
  src,
  aspect,
  w: screenW / END.k,
  at: toWorld(sx, sy),
  rot,
  turn,
  start,
  land: start + DEAL,
  gamma,
});
const SCARF = mk("scarf", "wip-taylor-swift/hs_scarf.png", 0.4371, 176, 228, 338, -6, -26, 21);
const POLAROID = mk("polaroid", "wip-taylor-swift/hs_polaroid.png", 0.828, 232, 848, 274, 8, 24, 31);
const CARDIGAN = mk("cardigan", "wip-taylor-swift/hs_cardigan.png", 1.4224, 272, 226, 748, -6, -20, 41, 0.78);
const THINGS = [SCARF, POLAROID, CARDIGAN];

// Each starts hidden under the disc, a little way toward where it goes, and slides out on paper's ease.
const dealt = (t: Thing, frame: number) => {
  const u = slide(frame, t.start, DEAL);
  const dx = t.at.x - REC.x;
  const dy = t.at.y - REC.y;
  const d = Math.hypot(dx, dy);
  const from = { x: REC.x + (dx / d) * 4, y: REC.y + (dy / d) * 4 };
  return {
    x: from.x + (t.at.x - from.x) * u,
    y: from.y + (t.at.y - from.y) * u,
    rot: t.rot - t.turn * (1 - u),
    lift: 0.3 * Math.sin(Math.PI * u),
  };
};

const SCARF_TINT = "#E3364F";

// -- the scarf's red: the print's own silhouette, in spot ink over its b&w print -----------------------------------------
const Silhouette: React.FC<{ src: string; colour: string; w: number; h: number }> = ({ src, colour, w, h }) => {
  const id = `hs-sil-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={id} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feFlood floodColor={colour} result="c" />
            <feComposite in="c" in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
      </svg>
      <div style={{ position: "absolute", inset: 0, filter: `url(#${id})` }}>
        <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, maxWidth: "none" }} />
      </div>
    </>
  );
};

// Preview aid: the presenter's area (COMMON.md) darkened, to check the cut still reads with her keyed on top.
const PresenterDebug: React.FC<{ on: boolean }> = ({ on }) =>
  on ? (
    <>
      <div style={{ position: "absolute", left: 300, top: 780, width: 500, height: 320, background: "rgba(20,20,20,0.72)" }} />
      <div style={{ position: "absolute", left: 100, top: 1100, width: 900, height: 820, background: "rgba(20,20,20,0.72)" }} />
    </>
  ) : null;

const HyperSpecific: React.FC<z.infer<typeof schema>> = ({ bands, presenter }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const live = THINGS.filter((t) => frame >= t.start).map((t) => ({ t, p: dealt(t, frame) }));
  const scarf = live.find((l) => l.t === SCARF);
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        {/* the three things, under the record until they slide out */}
        <WipPlane cam={cam}>
          {live.map(({ t, p }) => (
            <CutOut key={t.key} src={t.src} x={p.x} y={p.y} w={t.w} aspect={t.aspect} rotate={p.rot} border={6} lift={p.lift} gamma={t.gamma} seed={`hs-${t.key}`} />
          ))}
        </WipPlane>
        {/* the scarf printed red: multiplies into its print; the record's plane, above, covers it while it is underneath */}
        <WipPlane cam={cam} ink>
          {scarf ? (
            // a flat pale coat first, so the rough coat's dry patches show red, not the white of the print
            <div
              style={{
                position: "absolute",
                left: scarf.p.x - scarf.t.w / 2,
                top: scarf.p.y - scarf.t.w / scarf.t.aspect / 2,
                width: scarf.t.w,
                height: scarf.t.w / scarf.t.aspect,
                transform: `rotate(${scarf.p.rot}deg)`,
                mixBlendMode: "multiply",
              }}
            >
              <Silhouette src={SCARF.src} colour={inkOn(SCARF_TINT)} w={SCARF.w} h={SCARF.w / SCARF.aspect} />
            </div>
          ) : null}
          {scarf ? (
            <InkPrint
              x={scarf.p.x - scarf.t.w / 2}
              y={scarf.p.y - scarf.t.w / scarf.t.aspect / 2}
              w={scarf.t.w}
              h={scarf.t.w / scarf.t.aspect}
              rotate={scarf.p.rot}
              ink={RED}
              seed="hs-scarf-red"
              rough={0.8}
              wear={0.12}
              misregister={1.2}
            >
              {(c) => <Silhouette src={SCARF.src} colour={c} w={SCARF.w} h={SCARF.w / SCARF.aspect} />}
            </InkPrint>
          ) : null}
        </WipPlane>
        {/* the record: the vinyl lies still, the label turns */}
        <WipPlane cam={cam}>
          <CutOut src="wip-taylor-swift/hs_record.png" x={REC.x} y={REC.y} w={REC_W} aspect={1} border={6} seed="hs-record" />
          <CutOut src="wip-taylor-swift/hs_record_label.png" x={REC.x} y={REC.y} w={LABEL_W} aspect={1} rotate={SPIN0 + SPIN * frame} shadow={0} seed="hs-label" />
        </WipPlane>
      </WipFilmLife>
      <PresenterDebug on={presenter} />
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default HyperSpecific;
