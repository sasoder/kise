// ---------------------------------------------------------------------------
// ResignForm (caro-firing-moses, cut 62.167). The show's own corkboard look (paperShared.tsx), translated to 9:16.
// Opaque 1080x1920, 24 fps, 119 frames.
//
// CHECK LINE: the viewer sees the pre-printed form "City of New York / Resignation / I, Robert Moses, do hereby
// resign as ____" fill in as it is read: the joke that the resignation was routine paperwork, a stack of them.
//
// THE LINE: "...got a stack of forms printed that read, quote, 'I, Robert Moses, do hereby resign as so-and-so,'
// end quote, to save Moses the trouble..."
// WORD -> FRAME (composition frames; Whisper reads 2-7 f early): (quote -2) · I 5 · Robert 19 · Moses 26 · do 38 ·
// hereby 42 · resign 52 · as 59 · so 66 · and 71 · so 74 · end 81 · quote 85 · to 93 · save 97 · Moses 104 ·
// the 113 · trouble 119.
// DURATION: the slot 62.167 -> 67.125 s = 4.958 s x 24 = 119 frames (f0..f118).
//
// THE MOTION: the original's white form pinned at its top corners to the warm cork, re-staged tall (900 px wide,
// all type above y 1080), lying on a small static stack of identical forms whose edges show under it. Frame 0
// holds the cork, the stack and the printed header (CITY OF NEW YORK / RESIGNATION / rule); "I, Robert Moses, do
// hereby resign as" types on with the voice ("I," on f5 ... "as" on f59), the blank rule after "as" and the second
// blank line draw on through "so-and-so" (f66-80), "Dated ____, 193__" and the signature line with "(Signature)"
// write on through "end quote" (f81-92). One slow push-in (k 1 -> 1.06) from f0 to the last frame; no fade.
//
// SOURCES: the form's wording is the original graphic's (after Robert Caro, The Power Broker). Art lifted from the
// show's 4K frames resignForm_seqf1560.png, _seqf1520.png, _seqf1492.png (assets-src/caro-firing-moses/lift_paper.py).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CorkPlate, Cutout, FORM_FONT, FilmGrain, PaperSheet, TypedLine, Vignette, driftTransform, typeFrames } from "./paperShared";

export const FPS = 24;
export const DURATION = 119;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const FORM = { x: 90, y: 220, w: 900, h: 800 };
// the push-in ends at K_END about (540, 600); the type's right edge sits at form x 805 (world 895) so it stays
// inside the apps' safe x 920 at the last frame (540 + 355 x 1.06 = 916)
const K_END = 1.06;
const TEXT_L = 60;
const TEXT_R = 95;
const INK = "rgb(14,13,12)";
const PAPER_LIGHT =
  "radial-gradient(ellipse 90% 80% at 55% 30%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 50%, rgba(40,30,20,0.10) 100%)";
const SIDE_SHEET = "sepia(0.18) brightness(1.02) blur(1.6px) drop-shadow(0 10px 12px rgba(0,0,0,0.4))";
const FORM_SHADOW = "0 14px 22px rgba(0,0,0,0.38), 0 3px 4px rgba(0,0,0,0.35)";

// the stack under the form: offsets from the top form and turns about its centre, fixed for the whole cut
const STACK = [
  { dx: 7, dy: 46, rot: 0.9, b: 0.86 },
  { dx: -5, dy: 34, rot: -0.6, b: 0.89 },
  { dx: 12, dy: 22, rot: 1.4, b: 0.92 },
  { dx: -9, dy: 11, rot: -1.2, b: 0.95 },
];

// the white pin, lifted at 0.42: head centre at (43.3, 37.8) lifted px, radius 26; shown with a ~23 px head
const PIN_S = 0.9;
const PIN = { w: 92, h: 92, cx: 43.3, cy: 37.8 };
const PINS = [
  { x: FORM.x + 34, y: FORM.y + 22 },
  { x: FORM.x + FORM.w - 34, y: FORM.y + 22 },
];

const WORDS = [
  { text: "I,", f: 5 },
  { text: "Robert", f: 19 },
  { text: "Moses,", f: 26 },
  { text: "do", f: 38 },
  { text: "hereby", f: 42 },
  { text: "resign", f: 52 },
  { text: "as", f: 59 },
];
const FRAMES = typeFrames(WORDS, 63);
const LINE1 = "I, Robert Moses, do hereby";
const LINE2 = "resign as";

// "Dated", ", 193" and "(Signature)" write on during "end quote" (f81..92)
const DATED = "Dated";
const DATED_F = typeFrames([{ text: DATED, f: 81 }], 85);
const YEAR = ", 193";
const YEAR_F = typeFrames([{ text: YEAR, f: 87 }], 89);
const SIG = "(Signature)";
const SIG_F = typeFrames([{ text: SIG, f: 87 }], 92);

const draw = (frame: number, a: number, b: number) =>
  interpolate(frame, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// a ruled blank that draws on left to right; sits on the text baseline when used in a baseline-aligned flex row
const Rule: React.FC<{ p: number; w?: number; flex?: boolean; thick?: number; drop?: number; ml?: number }> = ({
  p,
  w,
  flex,
  thick = 2.6,
  drop = 6,
  ml = 0,
}) => (
  <span
    style={{
      display: "inline-block",
      flex: flex ? 1 : undefined,
      width: w,
      height: 0,
      marginLeft: ml,
      position: "relative",
      top: drop,
      borderBottom: `${thick}px solid ${INK}`,
      transform: `scaleX(${p})`,
      transformOrigin: "0 0",
    }}
  />
);

const ResignForm: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const cam = driftTransform(frame / (DURATION - 1), 1, K_END, 540, 600, 0, 0);
  const body: React.CSSProperties = { fontFamily: FORM_FONT, fontWeight: 500, color: INK };
  return (
    <AbsoluteFill style={{ backgroundColor: "rgb(80,76,70)", overflow: "hidden" }}>
      <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920, transformOrigin: "0 0", transform: cam.css }}>
        <CorkPlate src="rf_cork.jpg" w={1440} h={2400} s={0.875} cx={540} cy={960} />
        {/* the rest of the board: two typed sheets low in the corners, below the caption bands, cut by the frame and
            soft like the original's out-of-focus edges (the QuoteCard sheets, warmed to this board's light) */}
        <Cutout src="qc_sheetL.png" w={400} h={965} s={0.86} x={-46} y={1500} rot={1.6} style={{ filter: SIDE_SHEET }} />
        <Cutout src="qc_sheetR.png" w={390} h={960} s={0.86} x={1080 + 46 - 335} y={1540} rot={-1.2} style={{ filter: SIDE_SHEET }} />
        {STACK.map((s, i) => (
          <PaperSheet
            key={i}
            src="rf_paper.jpg"
            x={FORM.x + s.dx}
            y={FORM.y + s.dy}
            w={FORM.w}
            h={FORM.h}
            rot={s.rot}
            brightness={1.02 * s.b}
            shadow={FORM_SHADOW}
            light={PAPER_LIGHT}
          />
        ))}
        <PaperSheet src="rf_paper.jpg" x={FORM.x} y={FORM.y} w={FORM.w} h={FORM.h} brightness={1.03} shadow={FORM_SHADOW} light={PAPER_LIGHT}>
          {/* the printed header, there from frame 0 */}
          <div
            style={{
              position: "absolute",
              left: 0,
              width: FORM.w,
              top: 92,
              textAlign: "center",
              fontFamily: FORM_FONT,
              fontWeight: 600,
              fontSize: 34,
              lineHeight: 1,
              letterSpacing: "0.3em",
              color: INK,
              paddingLeft: "0.3em",
            }}
          >
            CITY OF NEW YORK
          </div>
          <div
            style={{
              position: "absolute",
              left: 0,
              width: FORM.w,
              top: 150,
              textAlign: "center",
              fontFamily: FORM_FONT,
              fontWeight: 700,
              fontSize: 80,
              lineHeight: 1,
              letterSpacing: "0.12em",
              color: INK,
              paddingLeft: "0.12em",
            }}
          >
            RESIGNATION
          </div>
          <div style={{ position: "absolute", left: 330, width: 240, top: 262, height: 0, borderBottom: `3px solid ${INK}` }} />

          {/* the typed sentence */}
          <div style={{ position: "absolute", left: TEXT_L, right: TEXT_R, top: 330, fontSize: 58, lineHeight: "84px", wordSpacing: "0.12em", ...body }}>
            <TypedLine text={LINE1} frames={FRAMES} from={0} frame={frame} color={INK} />
            <div style={{ display: "flex", alignItems: "baseline", whiteSpace: "pre" }}>
              <TypedLine text={LINE2} frames={FRAMES} from={LINE1.length + 1} frame={frame} color={INK} />
              <Rule p={draw(frame, 66, 72)} flex ml={20} />
            </div>
            <div style={{ display: "flex", alignItems: "baseline", height: 84 }}>
              <span style={{ visibility: "hidden" }}>I</span>
              <Rule p={draw(frame, 71, 80)} flex />
            </div>
          </div>

          {/* Dated ____, 193__ and the signature line */}
          <div
            style={{
              position: "absolute",
              right: TEXT_R,
              top: 600,
              display: "flex",
              alignItems: "baseline",
              fontSize: 42,
              whiteSpace: "pre",
              ...body,
            }}
          >
            <TypedLine text={DATED} frames={DATED_F} from={0} frame={frame} color={INK} />
            <Rule p={draw(frame, 83, 88)} w={230} ml={16} thick={2.2} drop={4} />
            <TypedLine text={YEAR} frames={YEAR_F} from={0} frame={frame} color={INK} style={{ marginLeft: 8 }} />
            <Rule p={draw(frame, 89, 91)} w={62} ml={8} thick={2.2} drop={4} />
          </div>
          <div style={{ position: "absolute", left: FORM.w - TEXT_R - 370, width: 370, top: 728, height: 0, borderBottom: `2.2px solid ${INK}`, transform: `scaleX(${draw(frame, 85, 92)})`, transformOrigin: "0 0" }} />
          <div style={{ position: "absolute", left: FORM.w - TEXT_R - 370, width: 370, top: 740, textAlign: "center", fontSize: 30, lineHeight: 1, ...body }}>
            <TypedLine text={SIG} frames={SIG_F} from={0} frame={frame} color={INK} style={{ display: "inline" }} />
          </div>
        </PaperSheet>
        {PINS.map((p, i) => (
          <Cutout
            key={i}
            src="rf_pin.png"
            w={PIN.w}
            h={PIN.h}
            s={PIN_S}
            x={p.x - PIN.cx * PIN_S}
            y={p.y - PIN.cy * PIN_S}
            style={{ filter: "drop-shadow(5px 7px 5px rgba(0,0,0,0.35))" }}
          />
        ))}
      </div>
      <Vignette strength={0.5} inner={45} at="50% 34%" />
      <FilmGrain frame={frame} amount={0.16} />
    </AbsoluteFill>
  );
};

export default ResignForm;
