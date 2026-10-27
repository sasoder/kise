// ---------------------------------------------------------------------------
// WattNameTag (kyle-rome-industrial). Name tag (styles/name-tags.md): NameTagMapStyle with new props, never rebuilt.
// Transparent overlay 1080x1920, 29.97 fps, 113 frames.
// Baked at 0.72x of the component's size with its top at about y 1140, bottom about y 1280, left edge about
// x 180, because graphics go into the project at default Motion. Check a still of the settled tag against that.
// Names come from the job, the project or the user; never guess a surname or a title.
//
// DURATION: the slot 114.548 -> 118.318 s = 3.770 s x 29.97 = 113 frames (f0..f112), the span of the enabled V2 still
// 112.3_NoSpark_LauderJamesWattSteamEngine.jpg (Robert Scott Lauder, "James Watt and the Steam Engine"); on V3 above it.
// Check: the settled tag reads "James Watt / Invented the efficient steam engine, 1769" over the still.
// SOURCES: user at 00;01;54;15 (rev 2, 2026-10-27): "add a name tag graphic on v3 here saying his name and what he
// invented". Watt's separate-condenser patent, 1769 (REV2_notes_20261027.md, "New name tag").
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import Tag from "../kits/name-tags/NameTagMapStyle";

export const FPS = 30000 / 1001;
export const DURATION = 113;
export const schema = z.object({ name: z.string(), job: z.string() });
export const defaultProps = schema.parse({ name: "James Watt", job: "Invented the efficient steam engine, 1769" });

const SCALE = 0.72;
// The full-size point of the tag (x, y) that lands on the house spot (toX, toY) at SCALE.
const AT = { x: 84, y: 1330, toX: 180, toY: 1140 }; // the plate's top-left

const WattNameTag: React.FC<z.infer<typeof schema>> = ({ name, job }) => {
  return (
    <AbsoluteFill
      style={{
        transformOrigin: "0 0",
        transform: `translate(${AT.toX - SCALE * AT.x}px, ${AT.toY - SCALE * AT.y}px) scale(${SCALE})`,
      }}
    >
      <Tag name={name} job={job} durationInFrames={DURATION} />
    </AbsoluteFill>
  );
};

export default WattNameTag;
