import React from "react";
import { AbsoluteFill } from "remotion";
import { StoutStage } from "../kits/cheeky-pint/stoutShared";
import { ASTRA_CHANNEL, ASTRA_INDEX, ChannelHeader, Composer, MessageRow, SlackCursor, SlackSidebar, SlackWindow, WIN } from "./slackShared";

// slackProbe — the whole Slack world, wide, in its cut-20 state (the model's channel selected on amber, a few
// real message rows with the bot "astra", its APP badge, an attachment card and reaction chips). A still for
// checking slackShared; not a cut.
export const PROBE_DURATION = 1;
export const SlackProbe: React.FC = () => {
  const k = 0.98;
  const cam = { x: WIN.w / 2, y: WIN.h / 2, k };
  return (
    <AbsoluteFill>
      <StoutStage S={0} cam={cam} pool={{ x: WIN.w / 2, y: WIN.h / 2 }} sway={false}>
        <SlackWindow>
          <SlackSidebar k={k} rows={{ [ASTRA_INDEX]: { unread: true, amber: 1 } }} />
          <ChannelHeader name={ASTRA_CHANNEL} members={31} />
          <MessageRow y={96} m={{ name: "Maya", time: "11:02 PM", avatar: { kind: "person", color: "#4E8A86", variant: "bun" }, body: ["ok who has a problem they've been stuck on for years"] }} />
          <MessageRow
            y={160}
            m={{
              name: "astra",
              app: true,
              time: "11:06 PM",
              avatar: { kind: "astra" },
              body: ["Solved. Write-up attached."],
              attachment: { w: 420, h: 56, title: "writeup.pdf", greek: [260] },
              reactions: [
                { glyph: "🔥", count: 12, mine: true },
                { glyph: "🤯", count: 7 },
              ],
            }}
          />
          <MessageRow y={330} m={{ name: "Daniel", time: "11:09 PM", avatar: { kind: "initials", color: "#4271A8", text: "D" }, greek: [520, 300] }} />
          <Composer channel={ASTRA_CHANNEL} />
          <SlackCursor x={700} y={300} />
        </SlackWindow>
      </StoutStage>
    </AbsoluteFill>
  );
};
