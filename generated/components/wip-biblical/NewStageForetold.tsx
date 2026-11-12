// ---------------------------------------------------------------------------
// NewStageForetold (wip-biblical, cut 0). Works in Progress style (styles/works-in-progress.md; kit
// generated/components/kits/works-in-progress/wipShared.tsx).
// Opaque 1080x1920, 24 fps, 138 frames.
//
// CHECK LINE: "A prophet from 2,000 years ago is pointing straight at today's AI." With no sound: a laptop typing a red-ink
// chat, and, twenty century ticks away along one printed line, a Doré prophet pointing at it.
//
// THE LINE: "AI may be ushering in a new stage of human consciousness just as the prophets predicted 2,000 years ago."
// WORD -> FRAME: AI 0 · may 4 · be 12 · ushering 16 · in 30 · a 33 · new 34 · stage 39 · of 47 · human 53 · consciousness 59 ·
// just 70 · as 82 · the 88 · prophets 91 · predicted 98 · 2,000 107-115 · years 125 · ago 129 (Whisper onsets, may run early)
// DURATION: the slot 0.000 -> 5.750 s = 5.750 s x 24 = 138 frames (f0..f137). The edit cuts to the speaker at f138.
//
// THE MOTION: one camera curve. It opens pushed in (k 2.23) on the laptop at the right of the top band, drifting, while the
// AI's reply streams onto its screen in red ink, word by word, from f0 to "consciousness" (f59). From "new stage" (f34) the
// camera eases back and left along the printed indigo timeline that runs from the lid's edge leftwards: twenty century
// ticks, every fifth one taller (AD 1 to 2026 at 20.25 centuries, so the right end runs a quarter century past the last
// tick). Two small mono labels in indigo sit above its ends and rise while fading in as the camera reveals each end:
// "2026" by the lid from f6, "AD 1" as the left end comes on screen (about f40). The camera arrives at k 1.3 about f91 and
// keeps drifting slowly down and in (to k ~1.33) through the last frame, so the settled frame never freezes. Ezekiel (Doré)
// slides in from the left frame edge at his final height on paper's ease, f62-91, wholly off frame until about f67, so the
// camera's pan and his slide read as one move; he lands on "prophets" (f91) with his raised finger just below-left of the
// timeline's AD 1 end, pointing along it toward the laptop. Settled at f91 (screen px): Ezekiel x 58-469, print foot
// y 816; timeline y ~168, x ~467-698 (about 11.4 px a century); laptop x 503-1003. The reply's block cursor blinks slowly.
// SHIFT (Nov 12, user): everything prints BIBLICAL_SHIFT_Y = 100 px lower via <ShiftDown>; the screen px above are before it.
// Contact frames: none; a 26 px gap (settled) separates the fingertip from the timeline's left end, which sits 10 px above it.
// SPOT INK: red = the AI's words (the clip's AI thread). Indigo = the printed century rule. Deep green = the user's
// question bubble and the empty prompt bar.
//
// SOURCES: Ezekiel: Gustave Doré, "Ezekiel prophesying", La Sainte Bible (Tours: Mame, 1866), t. 2, BnF copy via Internet
// Archive bnf-bpt6k10443187, public domain; cut out by scripts/clips/wip-biblical/bake-prophets-0.py (prophetShared.tsx).
// Laptop: assets_raw/ai/Laptop_MacBookPro2016_three-quarter_white-ground_screen-on.jpg, MacBook Pro 2016, Sonicdrewdriver,
// CC BY-SA 4.0; its Wikipedia page blanked to a pale panel, cut out and graded by scripts/clips/wip-biblical/bake-laptop-0.py.
// The chat (chatScreen.tsx) is drawn word blocks, not legible text, mapped onto the display's four corners. "2,000 years" is the speaker's figure: the timeline's
// labels are AD 1 and 2026 (the director's call, review 2); Ezekiel himself worked c. 593-571 BC, so the timeline measures the
// speaker's span, not his date.
// ---------------------------------------------------------------------------
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, CutOut, INDIGO, MONO, PaperGround, WipFilmLife, WipPlane, depthTransform, inkOn, runWipCamera, slide, textRise, type WipCamKey } from "../kits/works-in-progress/wipShared";
import { ChatScreen, REPLY_WORDS, SCREEN_H, SCREEN_W, quadMatrix3d, type Pt } from "./chatScreen";
import { ShiftDown } from "./biblicalShift";
import { CenturyRule, ProphetCutOut, PROPHETS } from "./prophetShared";

export const FPS = 24;
export const DURATION = 138;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** A camera key that puts world point (wx, wy) at screen point (sx, sy) at zoom k. */
const key = (f: number, wx: number, wy: number, sx: number, sy: number, k: number, ease?: "inout" | "linear"): WipCamKey => ({
  f,
  x: wx - (sx - 540) / k,
  y: wy - (sy - 960) / k,
  k,
  ease,
});

// The layout is written in SETTLED-FRAME screen px (sx, sy): the frame the camera reaches at k K_SET, centred on world
// (540, 960). wx/wy turn those into world px; every size below is divided by K_SET for the same reason.
const K_SET = 1.3;
const wx = (sx: number) => 540 + (sx - 540) / K_SET;
const wy = (sy: number) => 960 + (sy - 960) / K_SET;

// -- the prophet: Ezekiel, his raised fingertip (the top of the plate) at the rule's left end ----------------------------
// Settled: print 690 px tall, x 58-469, top y 150; fingertip (441, 178), head top y 231, foot of the print y 816 (his lower
// robe goes behind her head line, x < 470).
const PROPHET = "ezekiel";
const P = PROPHETS[PROPHET];
const P_H = 690 / K_SET;
const P_W = P_H * P.aspect;
const P_LEFT = wx(58);
const P_TOP = wy(150);
const P_FOOT = P_TOP + P.feet[1] * P_H;
const FINGER = { x: P_LEFT + P.hand[0] * P_W, y: P_TOP + P.hand[1] * P_H };

// -- the rule ------------------------------------------------------------------------------------------------------
// The finger points up and along the timeline: the rule starts a little right of and above his fingertip, never touching it.
const RULE_X0 = FINGER.x + 26 / K_SET;
const RULE_Y = FINGER.y - 10 / K_SET;
// AD 1 to 2026: twenty century ticks (100 ... 2000) at i / 20.25 of the length, every fifth one taller.
const RULE_SPAN = 20.25;
const RULE_TICK = 9;
const RULE_MAJOR = 2.1;
const RULE_W = 3.2;
// the two end labels (mono, indigo, printed), set ABOVE the rule's two ends: under it the ticks hang, and under the right
// end the lid's slanting edge would cover "2026"
const LABEL_SIZE = 21 / K_SET;
const LABEL_TOP = RULE_Y - RULE_W / 2 - 9 / K_SET - LABEL_SIZE;

// -- the laptop: a MacBook Pro in three-quarter view, its lid's left edge meeting the rule's right end ----------------
// nsf_laptop.png = the photo's own px (1371 x 1080). The lit display's corners and the lid's outer left edge at the
// rule's height, in photo px (bake-laptop-0.py's SCREEN). Settled: 500 px wide, x 503-1003 (the lid's top-right corner at
// x 990), y 94-488, centre (753, 291); the rule runs x 447-698, 12.5 px a century.
const LAP_PX_W = 1371;
const LAP_PX_H = 1080;
const LAP_W = 500 / K_SET;
const LAP_S = LAP_W / LAP_PX_W;
const LAP_LEFT = wx(990) - 1335 * LAP_S;
const LID_EDGE: Pt = [534, 230];
const LAP_TOP = RULE_Y - LID_EDGE[1] * LAP_S;
const lap = (p: Pt): Pt => [LAP_LEFT + p[0] * LAP_S, LAP_TOP + p[1] * LAP_S];
const QUAD: [Pt, Pt, Pt, Pt] = [lap([563, 85]), lap([1298, 72]), lap([1230, 623]), lap([518, 528])];
const LAPTOP_CX = LAP_LEFT + LAP_W / 2;
const LAPTOP_CY = LAP_TOP + (LAP_PX_H * LAP_S) / 2;
const RULE_X1 = lap(LID_EDGE)[0] + 3 / K_SET; // tucked under the lid's edge

// -- the camera ------------------------------------------------------------------------------------------------------
// Pushed in on the laptop (k 2.23: the laptop ~860 px wide), drifting; from "new stage" one ease back and left to K_SET,
// keyed at f86 so the follower arrives as Ezekiel lands; then a slow creep in about the composition's middle.
const K_OPEN = 2.23;
const camAt = runWipCamera(
  [
    key(-24, LAPTOP_CX, LAPTOP_CY, 546, 424, K_OPEN * 0.985),
    key(24, LAPTOP_CX, LAPTOP_CY, 542, 420, K_OPEN * 1.01, "linear"),
    key(86, 540, 960, 540, 960, K_SET),
    // the living frame: a slow drift down and in, still moving on the last frame
    key(DURATION + 10, wx(530), wy(400), 530, 426, K_SET * 1.022, "linear"),
  ],
  DURATION,
);

// -- the reply: streams from f0 to "consciousness" (f59) --------------------------------------------------------------
const REPLY_START_WORDS = 7;
const REPLY_END = 59;
// -- Ezekiel's entrance: slid in from the left frame edge at his final height, on paper's ease, landing on "prophets" ----
// At SLIDE_START his print (paper border and shadow included) lies wholly past the frame's left edge on that frame's camera.
const SLIDE_START = 62;
// The labels rise as the camera brings each end of the rule into view: "2026" by the laptop at once, "AD 1" on the first
// frame its end is 90 px inside the frame's left edge.
const LABEL_2026 = 6;
const LABEL_AD1 = (() => {
  for (let f = 0; f < DURATION; f++) {
    if (depthTransform(camAt(f)).toScreen(RULE_X0, RULE_Y).x >= 90) return f;
  }
  return DURATION;
})();
const SLIDE_END = 91;
const SLIDE_MARGIN = 46 / K_SET; // border, contact shadow and a little air
const slideCam = camAt(SLIDE_START);
const P_LEFT_START = slideCam.x - 540 / slideCam.k - P_W - SLIDE_MARGIN;

const LABEL: React.CSSProperties = {
  fontFamily: MONO,
  fontWeight: 400,
  fontSize: LABEL_SIZE,
  lineHeight: 1,
  letterSpacing: 0.4,
  color: inkOn(INDIGO),
  whiteSpace: "nowrap",
};

const NewStageForetold: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const shown = interpolate(frame, [0, REPLY_END], [REPLY_START_WORDS, REPLY_WORDS], clamp);
  const cursor = frame < REPLY_END + 4 ? 1 : Math.floor((frame - REPLY_END - 4) / 14) % 2 === 0 ? 0 : 1;
  const along = slide(frame, SLIDE_START, SLIDE_END - SLIDE_START);
  const pLeft = P_LEFT_START + (P_LEFT - P_LEFT_START) * along;
  return (
    <>
      <WipFilmLife frame={frame}>
        <ShiftDown>
          <PaperGround cam={cam} />
          <WipPlane cam={cam} ink>
            <CenturyRule
              x0={RULE_X0}
              x1={RULE_X1}
              y={RULE_Y}
              weight={RULE_W}
              tick={RULE_TICK}
              endTick={1}
              span={RULE_SPAN}
              major={5}
              majorTick={RULE_MAJOR}
              misregister={0.5}
            />
            <div style={{ position: "absolute", left: RULE_X0 - 1, top: LABEL_TOP, ...LABEL, ...textRise(frame, LABEL_AD1, 12, 10 / K_SET) }}>AD 1</div>
            <div style={{ position: "absolute", left: RULE_X1 - 16 / K_SET - 200, width: 200, textAlign: "right", top: LABEL_TOP, ...LABEL, ...textRise(frame, LABEL_2026, 12, 10 / K_SET) }}>
              2026
            </div>
          </WipPlane>
          <WipPlane cam={cam}>
            <CutOut src="wip-biblical/nsf_laptop.png" x={LAPTOP_CX} y={LAPTOP_CY} w={LAP_W} aspect={LAP_PX_W / LAP_PX_H} border={5} grain={0.05} seed="laptop" />
          </WipPlane>
          <WipPlane cam={cam} ink>
            <div style={{ position: "absolute", left: 0, top: 0, width: SCREEN_W, height: SCREEN_H, transformOrigin: "0 0", transform: quadMatrix3d(SCREEN_W, SCREEN_H, QUAD) }}>
              <ChatScreen shown={shown} cursor={cursor} />
            </div>
          </WipPlane>
          {frame >= SLIDE_START ? (
            <WipPlane cam={cam}>
              <ProphetCutOut name={PROPHET} x={pLeft + P_W / 2} footY={P_FOOT} height={P_H} lift={(1 - along) * 0.3} />
            </WipPlane>
          ) : null}
        </ShiftDown>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default NewStageForetold;
