// ---------------------------------------------------------------------------
// GladstoneNameTag (wip-victorians). Name tag (styles/name-tags.md): NameTagWip with new props, never rebuilt.
// Transparent overlay 1080x1920, 24 fps, 63 frames.
// Baked at 0.72x of the component's size with its top at about y 1140, bottom about y 1280, left edge about
// x 180, because graphics go into the project at default Motion. Check a still of the settled tag against that.
// Names come from the job, the project or the user; never guess a surname or a title.
//
// DURATION: the slot 8.125 -> 10.750 s = 2.625 s x 24 = 63 frames (f0..f62).
// SOURCES: the director's job message: name "William Gladstone", job "Four-time Prime Minister"
// MEASURED on the render: slip x 180-749, y 1136-1279 (570 x 144) at f50; f27 to f62 pixel-identical, alpha 0 at f0.
// Contrast, WCAG, median stroke against median paper: name 11.2:1, job 11.2:1.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import Tag from "../kits/name-tags/NameTagWip";

export const FPS = 24;
export const DURATION = 63;
export const schema = z.object({ name: z.string(), job: z.string() });
export const defaultProps = schema.parse({ name: "William Gladstone", job: "Four-time Prime Minister" });

const SCALE = 0.72;
// The full-size point of the tag (x, y) that lands on the house spot (toX, toY) at SCALE.
const AT = { x: 84, y: 1620, toX: 180, toY: 1280 }; // bottom-left

const GladstoneNameTag: React.FC<z.infer<typeof schema>> = ({ name, job }) => {
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

export default GladstoneNameTag;
