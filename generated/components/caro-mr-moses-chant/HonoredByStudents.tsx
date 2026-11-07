// ---------------------------------------------------------------------------
// HonoredByStudents (caro-mr-moses-chant, cut 19). Style: the show's own 16:9 graphic (a photographed 1930s New York
// Times page), translated to 9:16 in the same look; not a kise style file. Opaque 1080x1920, 24 fps, 72 frames.
//
// CHECK LINE: "A real 1930s New York Times clipping: high-school students gave Moses a medal — HONORED BY STUDENTS."
//
// THE LINE: "In the 1930s and 1940s, New York high schools voted Moses the most admired New Yorker."
// WORD -> FRAME: New -1 · York 3 · high 9 · schools 13 · voted 20 · Moses 28 · the 35 · most 42 · admired 48 ·
// New 57 · York 64 · (next line "This" 71). Whisper, may run ~5 frames early.
// DURATION: the slot 19.8333 -> 22.8333 s = 3.000 s x 24 = 72 frames (f0..f71).
//
// FRAMING PROP (director's review, rev 2): framing 'faces' (default) keeps both men in the picture: one gentle push
// (k 0.87 -> 0.901, x1.035) drifting right and down from the same opening frame, both faces in frame throughout (Moses
// loses his ear at the left edge from ~f20, never his eye or smile), the caption headline below the lower band
// (highlighter box y ~1639-1703 at f52, caps ~34 px), the same highlighter sweep f43 -> f52. framing 'caption' is
// rev 1, described next, pixel-identical to its preview.
// THE MOTION ('caption'): a hard cut in on the photo column: Moses and the student Vincent Coen full figure, faces in the upper
// third, the caption block at the bottom. One eased push-in and tilt down (moving from f0, fastest ~f15 at ~38 px/f,
// under 3 px/f by f40, done f44: through "voted Moses the most") carries the camera onto the hand-over and the caption
// headline, panning right so the whole of "HONORED BY STUDENTS" sits in frame. The real yellow highlighter sweeps left -> right behind HONORED BY STUDENTS f43 ("most")
// -> f52 (just after "admired" f48), multiplied over the ink so the letters stay black. f52-71: settled, living hold
// (animated grain, the push still creeping ~2.5 %). The camera's bottom edge is pinned to the last row of page the
// show ever photographed (world y 2224), so no frame shows anything that is not the real page.
// FRAMING: the page data ends ~275 world px under the caption headline, so the headline cannot sit above the caption
// bands with paper under it to the frame bottom (that would need k > 3), and the hand-over sits 930 world px above the
// headline (so headline <= y 1040 with caps >= 45 px puts the medal ~100 px above the frame). It settles BELOW the lower
// band instead: highlighter box y ~1544-1628 at f52 (~1542-1627 at f71), caps ~45 px, the hands at y ~410-635 (the
// student's hand and the medal whole, Moses' hands cut by the left edge), the frame top just under the faces.
//
// SOURCES: every pixel of the page is the show's own graphic (Caro_Mr_Moses_chant media, 4K frames
// notes/reference/honored_src22.30 ... 25.20.png): a flat plate registered onto the widest frame (src 22.30, which is
// "world" px) by SIFT + RANSAC similarity (pure scale + shift, rotation < 0.007 deg); 22.30+22.75 averaged for the top,
// 23.75 from world y 700 and 24.25+24.75+25.20 (24.25 alone inside the highlighter) from world y 1026, feathered, light
// matched to 22.30, chroma grain removed (assets-src/caro-mr-moses-chant/honored_plate.py). The highlighter's box
// (world 2122-2852 x 1906-1977) and multiply colour rgb(247, 222, 46) are measured from the ratio 24.75 / 24.25; it ends
// at 2836 here (14 px past the S, mirroring the 13 px before the H) so it stops short of the column rule at the
// frame's right edge. Grain: assets-src/caro-mr-moses-chant/honored_grain.py.
// Photo: Times Wide World Photo (NYT, 1930s): Robert Moses receiving a medal from Vincent Coen, Richmond Hill High School.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";

export const FPS = 24;
export const DURATION = 72;
export const schema = z.object({
  // 'faces' (default): a gentle push that keeps both men's faces in frame. 'caption': rev 1, the push onto the caption.
  framing: z.enum(["faces", "caption"]),
});
export const defaultProps = schema.parse({ framing: "faces" });

const DIR = "caro-mr-moses-chant";
const GROUND = "#0b0a0a"; // never seen: the camera stays inside the page

// ---- the plate in world px (1 world px = 1 px of the 4K frame src 22.30)
const PLATE = { x: 1360, y: 0, w: 1560, h: 2782 / 1.25 };

// ---- the real highlighter (world px), and its sweep
const HL = { x: 2122, y: 1906, w: 714, h: 71, color: "rgb(247, 222, 46)" };
const SWEEP = [43, 52]; // "most" f42 -> complete just after "admired" f48
const EDGE = 14; // world px of soft leading edge while the marker moves

// ---- camera: k = screen px per world px; the visible rect's bottom edge is pinned at world y 2224 (the page's last
// photographed row), its right edge eases 2708.7 -> 2850 (photo centred at f0; at the end just past the column rule,
// short of the next column's text). k eases 0.87 -> 1.16 over f0-44 (one bezier, moving from f0), times a slow 2.5 %
// creep over the whole cut (k 1.189 at f71). The frame top stays at world y >= 17 (above it the folio is cut).
const BOTTOM = 2224;
const K0 = 0.87;
const K1 = 1.16;
const CREEP = 0.025;
const R0 = 2708.7;
const R1 = 2850;
const MOVE_END = 44;
const progress = (f: number) =>
  interpolate(f, [0, MOVE_END], [0, 1], {
    easing: Easing.bezier(0.42, 0.08, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const cameraCaption = (f: number) => {
  const p = progress(f);
  const k = K0 * Math.pow(K1 / K0, p) * (1 + (CREEP * f) / (DURATION - 1));
  const right = R0 + (R1 - R0) * p;
  return { k, left: right - 1080 / k, top: BOTTOM - 1920 / k };
};

// ---- 'faces' camera: the same opening frame and the same push ease, a gentle push that keeps both faces in. The top
// edge eases from world y 17.1 (f0, identical to 'caption') to 78 (Moses' crown is at 153), the right edge to 2847
// (the highlighter ends 2836, the column rule ~2842) on a slightly later ease, k 0.87 -> 0.89 by f44 and a 1.2 %
// creep to k 0.901 at f71 (x1.035 overall). The push is small because the width is the limit: the highlighter's end
// pins the right edge, so every extra 1 % of zoom moves the left edge ~12 world px into Moses' head. At f71 the left
// edge is world x 1648: Moses loses his ear and the back of his jaw (1550-1640, from ~f20) and keeps his eye (1770,
// ~110 px in) and smile. The bottom edge stays <= 2225 on every frame (the real page ends at 2225.6).
const F_K1 = 0.89;
const F_CREEP = 0.012;
const F_T0 = BOTTOM - 1920 / K0;
const F_T1 = 78;
const F_R1 = 2847;
const cameraFaces = (f: number) => {
  const p = progress(f);
  // the pan right runs a little later than the push, so Moses' ear holds longer; done by f43 (STUDENTS whole when
  // the highlighter starts)
  const px = interpolate(f, [0, 43], [0, 1], {
    easing: Easing.bezier(0.55, 0.05, 0.35, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const k = K0 * Math.pow(F_K1 / K0, p) * (1 + (F_CREEP * f) / (DURATION - 1));
  const right = R0 + (F_R1 - R0) * px;
  return { k, left: right - 1080 / k, top: F_T0 + (F_T1 - F_T0) * p };
};

const HonoredByStudents: React.FC<z.infer<typeof schema>> = ({ framing }) => {
  const frame = useCurrentFrame();
  const { k, left, top } = framing === "caption" ? cameraCaption(frame) : cameraFaces(frame);

  const sweep = interpolate(frame, SWEEP, [0, 1], {
    easing: Easing.bezier(0.35, 0, 0.45, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const hlW = HL.w * sweep;
  const edge = sweep < 1 ? Math.min(EDGE, hlW) : 0;

  // grain: one tile, a fresh offset every frame (screen space)
  const gx = Math.floor(random(`gx${frame}`) * 120);
  const gy = Math.floor(random(`gy${frame}`) * 120);

  return (
    <AbsoluteFill style={{ backgroundColor: GROUND, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1,
          height: 1,
          transformOrigin: "0 0",
          transform: `translate(${-left * k}px, ${-top * k}px) scale(${k})`,
        }}
      >
        <Img
          src={staticFile(`${DIR}/honored_plate.jpg`)}
          style={{ position: "absolute", left: PLATE.x, top: PLATE.y, width: PLATE.w, height: PLATE.h, maxWidth: "none" }}
        />
        {hlW > 0.5 ? (
          <div
            style={{
              position: "absolute",
              left: HL.x,
              top: HL.y,
              width: hlW,
              height: HL.h,
              mixBlendMode: "multiply",
              background:
                edge > 0
                  ? `linear-gradient(to right, ${HL.color} 0px, ${HL.color} ${hlW - edge}px, rgba(255,255,255,0) ${hlW}px)`
                  : HL.color,
            }}
          />
        ) : null}
      </div>
      {/* grain, screen space, fresh every frame */}
      <Img
        src={staticFile(`${DIR}/honored_grain.jpg`)}
        style={{ position: "absolute", left: -gx, top: -gy, width: 1200, height: 2040, mixBlendMode: "overlay", opacity: 0.35 }}
      />
    </AbsoluteFill>
  );
};

export default HonoredByStudents;
