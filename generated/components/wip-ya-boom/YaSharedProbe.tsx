// ---------------------------------------------------------------------------
// YaSharedProbe (wip-ya-boom, not a cut). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx) with the clip's materials (./yaShared.tsx).
// Opaque 1080x1920, 24 fps, 48 frames.
//
// CHECK LINE: none: a probe of the shared materials for the other builders.
// THE LINE: none. WORD -> FRAME: none. DURATION: 2 s x 24 = 48 frames (f0..f47).
//
// THE MOTION: a person cut-out already pasted; a cover slapped down from the right (contact f10, skid to f16, press f10-15)
// with two strips of tape; "$55M" written in red felt-tip from f18; a ring drawn round it from f27; a mono label rises at
// f20. The camera creeps in. Prop `fonts` shows the felt-tip font candidates instead (a still).
// SPOT INK: red = the editor's felt-tip.
//
// SOURCES: probe stand-ins from other clips: public/wip-anthropic/dt_dario.png (person), public/wip-anthropic/
// carnegie_lib_Pittsburgh_PA.png (a print standing in for a cover). The figure "$55M" is only a sample of the hand.
// ---------------------------------------------------------------------------
import { loadFont as loadCaveatBrush } from "@remotion/google-fonts/CaveatBrush";
import { loadFont as loadCovered } from "@remotion/google-fonts/CoveredByYourGrace";
import { loadFont as loadGochi } from "@remotion/google-fonts/GochiHand";
import { loadFont as loadJust } from "@remotion/google-fonts/JustAnotherHand";
import { loadFont as loadKalam } from "@remotion/google-fonts/Kalam";
import { loadFont as loadNanum } from "@remotion/google-fonts/NanumPenScript";
import { loadFont as loadPermanent } from "@remotion/google-fonts/PermanentMarker";
import { loadFont as loadReenie } from "@remotion/google-fonts/ReenieBeanie";
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, MONO, PaperGround, WipFilmLife, WipPlane, inkOn, runWipCamera } from "../kits/works-in-progress/wipShared";
import { INK, MARKER_RED, MarkerPath, MarkerText, MonoLabel, THEME, XeroxCutOut, slapDown } from "./yaShared";

export const FPS = 24;
export const DURATION = 48;
export const schema = z.object({ bands: z.boolean(), fonts: z.boolean() });
export const defaultProps = schema.parse({ bands: false, fonts: false });

const NANUM = loadNanum("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
const COVERED = loadCovered("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily;
// [name, family, weight, stroke em]: the stroke thickens a thin hand to the felt-tip's nib
const CANDIDATES: [string, string, string, number][] = [
  ["Nanum Pen Script", NANUM, "400", 0],
  ["Nanum Pen Script + 0.022 em stroke", NANUM, "400", 0.022],
  ["Covered By Your Grace", COVERED, "400", 0],
  ["Covered By Your Grace + 0.015 em stroke", COVERED, "400", 0.015],
  ["Caveat Brush", loadCaveatBrush("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily, "400", 0],
  ["Gochi Hand", loadGochi("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily, "400", 0],
  ["Kalam 700", loadKalam("normal", { weights: ["700"], subsets: ["latin"] }).fontFamily, "700", 0],
  ["Reenie Beanie / Just Another Hand / Permanent Marker: see the first sheet", loadReenie("normal", { weights: ["400"], subsets: ["latin"] }).fontFamily, "400", 0],
];
void loadJust;
void loadPermanent;

const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: 960, k: 1 },
    { f: DURATION, x: 540, y: 960, k: 1.04, ease: "linear" },
  ],
  DURATION,
);

const YaSharedProbe: React.FC<z.infer<typeof schema>> = ({ bands, fonts }) => {
  const frame = useCurrentFrame();
  const cam = camAt(fonts ? 0 : frame);
  if (fonts) {
    return (
      <WipFilmLife frame={0} theme={THEME}>
        <PaperGround cam={cam} theme={THEME} />
        <WipPlane cam={cam} ink>
          {CANDIDATES.map(([name, family, weight, st], i) => (
            <div key={name} style={{ position: "absolute", left: 70, top: 70 + i * 228 }}>
              <div style={{ fontFamily: MONO, fontWeight: 400, fontSize: 28, color: INK }}>{name}</div>
              <div style={{ fontFamily: family, fontWeight: Number(weight), fontSize: 132, lineHeight: 1.15, color: inkOn(MARKER_RED, THEME), whiteSpace: "nowrap", WebkitTextStroke: st ? `${(st * 132).toFixed(2)}px ${inkOn(MARKER_RED, THEME)}` : undefined }}>
                $1B 100M $55M -40%
              </div>
            </div>
          ))}
        </WipPlane>
      </WipFilmLife>
    );
  }
  return (
    <>
      <WipFilmLife frame={frame} theme={THEME}>
        <PaperGround cam={cam} theme={THEME} />
        <WipPlane cam={cam}>
          <XeroxCutOut src="wip-anthropic/dt_dario.png" kind="person" x={330} y={560} w={470} aspect={1800 / 2179} rotate={-3} seed="probe-person" />
          <XeroxCutOut
            src="wip-anthropic/carnegie_lib_Pittsburgh_PA.png"
            kind="cover"
            x={720}
            y={900}
            w={390}
            aspect={0.66}
            rotate={5}
            skew={1}
            tape={["tl", "br"]}
            slap={slapDown(frame, 10, { from: { x: 820, y: -260 }, spin: 9 })}
            seed="probe-cover"
          />
        </WipPlane>
        <WipPlane cam={cam}>
          <MonoLabel text="Suzanne Collins, 2013" x={120} y={1500} frame={frame} start={20} />
        </WipPlane>
        <WipPlane cam={cam} ink>
          <MarkerText text="$55M" x={330} y={1010} size={170} frame={frame} start={18} seed="probe-55" />
          <MarkerPath shape={{ kind: "ring", cx: 330, cy: 1012, rx: 200, ry: 110 }} frame={frame} start={27} dur={13} seed="probe-ring" />
          <MarkerPath shape={{ kind: "underline", x0: 116, y0: 1560, x1: 560, y1: 1552 }} frame={frame} start={34} dur={7} seed="probe-under" />
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default YaSharedProbe;
