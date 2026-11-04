// ---------------------------------------------------------------------------
// LBJNameTag (robert-johnson-ranch). Name tag (styles/name-tags.md): NameTagMapStyle with new props, never rebuilt.
// Transparent overlay 1080x1920, 23.976 fps, 31 frames.
// Baked at 0.72x of the component's size with its top at about y 1140, bottom about y 1280, left edge about
// x 180, because graphics go into the project at default Motion. Check a still of the settled tag against that.
// Names come from the job, the project or the user; never guess a surname or a title.
//
// DURATION: the slot 2.419 -> 3.712 s = 31 frames (f0..f30) at 23.976: B10, the close-up of Johnson, the first frame
// he is on screen, as the speaker says "...grew up with Lyndon Johnson". The next shot (B11, 3.712) shows only his old
// pupils, so the tag ends with the close-up. On V8 above everything. A 31 f slot leaves 10 settled frames at the full
// entrance, so the tag takes the kit's short-slot entrance (all in by f12): durationInFrames passed as 29.
// SOURCES: the user at 00:00:01:19: "let's get a name tag for the Johnson guy at this part"; the name is in the line.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import Tag from "../kits/name-tags/NameTagMapStyle";

export const FPS = 24000 / 1001;
export const DURATION = 31;
export const schema = z.object({ name: z.string(), job: z.string() });
export const defaultProps = schema.parse({ name: "Lyndon B. Johnson", job: "36th President of the United States" });

const SCALE = 0.72;
// The full-size point of the tag (x, y) that lands on the house spot (toX, toY) at SCALE.
const AT = { x: 84, y: 1330, toX: 180, toY: 1140 }; // the plate's top-left

const LBJNameTag: React.FC<z.infer<typeof schema>> = ({ name, job }) => {
  return (
    <AbsoluteFill
      style={{
        transformOrigin: "0 0",
        transform: `translate(${AT.toX - SCALE * AT.x}px, ${AT.toY - SCALE * AT.y}px) scale(${SCALE})`,
      }}
    >
      <Tag name={name} job={job} durationInFrames={Math.min(DURATION, 29)} />
    </AbsoluteFill>
  );
};

export default LBJNameTag;
