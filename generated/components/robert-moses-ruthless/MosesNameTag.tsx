// ---------------------------------------------------------------------------
// MosesNameTag (robert-moses-ruthless). Name tag (styles/name-tags.md): NameTagMapStyle with new props, never rebuilt.
// Transparent overlay 1080x1920, 23.976 fps, 131 frames.
// Baked at 0.72x of the component's size with its top at about y 1140, bottom about y 1280, left edge about
// x 180, because graphics go into the project at default Motion. Check a still of the settled tag against that.
// Names come from the job, the project or the user; never guess a surname or a title.
//
// DURATION: the slot is sequence frame 22 (0.918 s) -> frame 153 (6.381 s) = 131 frames at 23.976 (5.464 s, f0..f130).
// Check: the settled tag reads "Robert Moses / New York's master builder" over the user's still of Moses with the
// Battery Bridge model (images/00.0a_IfSomeoneStood_MosesBatteryBridgeModel1939.jpg, placed whole at fit-width in
// the 1080x1920 frame, 0.918-6.381 s).
// SOURCES: name and job from the director's brief; the user's note on this still: "can we just get a name tag for
// this guy, and what he's famous for".
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import Tag from "../kits/name-tags/NameTagMapStyle";

export const FPS = 24000 / 1001;
export const DURATION = 131;
export const schema = z.object({ name: z.string(), job: z.string() });
export const defaultProps = schema.parse({ name: "Robert Moses", job: "New York's master builder" });

const SCALE = 0.72;
// The full-size point of the tag (x, y) that lands on the house spot (toX, toY) at SCALE.
const AT = { x: 84, y: 1330, toX: 180, toY: 1140 }; // the plate's top-left

const MosesNameTag: React.FC<z.infer<typeof schema>> = ({ name, job }) => {
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

export default MosesNameTag;
