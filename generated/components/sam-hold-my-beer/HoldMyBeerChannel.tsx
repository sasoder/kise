// ---------------------------------------------------------------------------
// HoldMyBeerChannel (sam-hold-my-beer, cut 6). Cheeky Pint style (stout) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 85 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "OpenAI had a real Slack channel for the new model, and it was called #astra-hold-my-beer."
//
// THE LINE: "The name of the channel was Model Name Dash Hold My Beer," (then "and…" at f83)
// WORD -> FRAME (composition f0 = sequence 6.339667 s): The −2 · name 4 · of 11 · the 17 · channel 19 · was 28 ·
// Model 39 · Name 51 · Dash 57 · Hold 66 · My 72 · Beer 75 · and 83.
// DURATION: the slot 6.339667 -> 9.884875 s = 3.545 s x 23.976 = 85 frames (f0..f84).
//
// THE MOTION: a real Slack desktop window (workspace "OpenAI") lies on the espresso board under the stout
// light; one channel in its sidebar is redacted (its real name, blurred). One continuous push-in from f0 runs
// to that row while the pointer glides to it and clicks: the amber selection pill grows out of the click
// (the old quiet selection on #general drains) and the push lands on the huge row a few frames before
// "Model". Then the blur lifts left to right with the words: "astra" across Model/Name, "-" on Dash, "hold" on
// Hold, "-my" on My, "-beer" on Beer; a slow creep holds the settled name to the cut.
//   f0        the window, sidebar + part of #general; row text ~34 screen px; the redacted row at y ~899
//   f-6..31   the push (k 2.29 at f0 -> 5.6) onto the row, landing ~f37-39 (damped follower), then a creep
//             superposed from f18 (k 5.72 at f84): one deceleration lobe, never a stop
//   f0..26    the pointer glides from the pane to the row; CLICK: press peaks f27 (contact frame), the
//             first amber pill frame is f28 (the pill grows sideways out of the tip, f28-33); #general's
//             quiet pill drains over the same frames; the row's text turns to Slack ink on the amber
//   f31..46   the pointer slides away down-right and leaves the frame with the push
//   f36..79   the unblur, per character with overlapping ramps (a smooth wipe, never a pop), each chunk mostly
//             sharp on its word: astra f36-56 (Model/Name), "-" f50-58 (Dash 57), hold f57-70 (Hold 66),
//             -my f64-75 (My 72), -beer f68-79 (Beer 75); each character comes up from a lighter ink smudge
//             to full ink as it sharpens
//   f79..84   settled: the full name readable, the creep and the grain alive
// AMBER = the model ("astra"): here only its channel's selection pill. Cream = the subject, board = context;
// the Slack window keeps Slack's real colours (pane warm near-white, nothing black).
//
// DEVIATION FROM THE BRIEF'S LIST: the channel order is announcements, compute, evals, general, research,
// [redacted], random (research moved above the redacted row). With research below random, the landing frame
// (a row pitch of ~157 screen px) always put a readable channel name inside the caption band y 1080-1250.
//
// SOURCES: Slack mark = Wikimedia Commons "Slack_icon_2019.svg" (assets-src/sam-hold-my-beer/slack_icon_commons.svg),
// inlined in slackShared.tsx. Slack's layout and colours from the desktop app. No figures.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutStage, easeOutCubic, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack, restToRest, type Glide } from "../kits/cheeky-pint/museShared";
import {
  ASTRA_CHANNEL,
  ASTRA_INDEX,
  ChannelHeader,
  Composer,
  GENERAL_MESSAGES,
  MessageRow,
  REDACT_SIGMA,
  SIDEBAR,
  SlackCursor,
  SlackSidebar,
  SlackWindow,
  channelTop,
} from "./slackShared";

export const FPS = 24000 / 1001;
export const DURATION = 85;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// --- the row and the camera (world px = Slack px; the window's top-left is the origin) ----------------------
const ROW_TOP = channelTop(ASTRA_INDEX); // 334
const ROW_CY = ROW_TOP + SIDEBAR.rowH / 2; // 348
const GENERAL_INDEX = 3;
const K0 = 2.25; // the start look's scale: the follower has crept to ~2.29 by f0 (a row's 15 px text ~34 screen px)
const K1 = 5.6; // landing: at f84 (k 5.72) "# astra-hold-my-beer" is 80 % of the width (ink x 69-930), cap ~62 px, the pill x 12-1064
const K2 = 5.78; // the creep's end (f84 reaches ~5.72 on the way)
/** The start look: at f0 the window's left edge sits at screen x ~32, its top at ~101, the redacted row at y ~899. */
const START = { x: 0 - (36 - 540) / K0, y: ROW_CY - (900 - 960) / K0, k: K0 };
/** Landing: the pill's centre (x 100) on the frame's centre line, the row's centre at screen y 875. */
const LAND = { x: SIDEBAR.w / 2, y: ROW_CY - (875 - 960) / K1 };
const GLIDES: Glide[] = [
  { f0: -6, f1: 31, dx: LAND.x - START.x, dy: LAND.y - START.y, k: K1 },
  { f0: 18, f1: 118, k: K2 },
];
export const CAM = makeClockCam(START, GLIDES, DURATION + 4);
const POOL = makePoolTrack({ x: 300, y: 330 }, [{ f0: -6, f1: 32, x: LAND.x, y: ROW_CY }], DURATION + 4);

// --- the pointer and the click ------------------------------------------------------------------------------
const CLICK_F = 27; // contact: the press peaks
const PILL_F = 6; // the pill's growth from the tip (first pill frame: CLICK_F + 1)
const TIP0 = { x: 338, y: 290 }; // f0, over the pane (under Priya's name, clear of the text)
const TIP_CLICK = { x: 126, y: ROW_CY + 3 }; // on the redacted name
const TIP_AWAY = { x: 236, y: 418 }; // down-right, out of the frame with the push
const pointer = (f: number) => {
  if (f < CLICK_F + 4) {
    const u = restToRest((f + 5) / (CLICK_F - 1 + 5), 2.2);
    return { x: lerp(TIP0.x, TIP_CLICK.x, u), y: lerp(TIP0.y, TIP_CLICK.y, u) };
  }
  const u = restToRest((f - (CLICK_F + 4)) / 16, 2);
  return { x: lerp(TIP_CLICK.x, TIP_AWAY.x, u), y: lerp(TIP_CLICK.y, TIP_AWAY.y, u) };
};
const pressAt = (f: number) => smoothstep((f - (CLICK_F - 1.5)) / 1.5) * (1 - smoothstep((f - (CLICK_F + 1)) / 2));

// --- the unblur: per character, overlapping ramps (frame each starts, ramp length) -------------------------
// "astra-hold-my-beer": a s t r a | - | h o l d | - m y | - b e e r
const CHAR_START = [36, 38.5, 41, 43.5, 46, 50, 57.5, 59, 60.5, 62, 64.5, 66, 67.5, 68.5, 69.5, 70.5, 71.5, 72.5];
const CHAR_RAMP = [10, 10, 10, 10, 10, 8, 8, 8, 8, 8, 8, 8, 8, 6, 6, 6, 6, 6];
const sigmaAt = (f: number, i: number) => REDACT_SIGMA * Math.pow(1 - smoothstep((f - CHAR_START[i]) / CHAR_RAMP[i]), 1.3);

const HoldMyBeerChannel: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const pool = POOL(S);
  const amber = easeOutCubic((S - CLICK_F) / PILL_F);
  const quiet = 1 - smoothstep((S - CLICK_F) / PILL_F);
  const blur = [...ASTRA_CHANNEL].map((_, i) => sigmaAt(S, i));
  const tip = pointer(S);
  const showPointer = S < CLICK_F + 26;
  return (
    <AbsoluteFill>
      <StoutStage S={S} cam={cam} rest={CAM.rest} pool={{ x: pool.x, y: pool.y, strength: pool.strength }}>
        <SlackWindow>
          <SlackSidebar
            k={cam.k}
            rows={{
              [GENERAL_INDEX]: { quiet },
              [ASTRA_INDEX]: { unread: true, amber, amberFrom: TIP_CLICK, blur },
            }}
          />
          <ChannelHeader name="general" members={48} />
          {GENERAL_MESSAGES.map(({ y, m }) => (
            <MessageRow key={m.name} y={y} m={m} />
          ))}
          <Composer channel="general" />
          {showPointer ? <SlackCursor x={tip.x} y={tip.y} press={pressAt(S)} /> : null}
        </SlackWindow>
      </StoutStage>
    </AbsoluteFill>
  );
};

export default HoldMyBeerChannel;
