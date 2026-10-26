// ---------------------------------------------------------------------------
// PasteurNameTag (kyle-vaccine). Name tag (styles/name-tags.md): NameTagMapStyle with new props, never rebuilt.
// Transparent overlay 1080x1920, 29.97 fps, 91 frames.
// Baked at 0.72x of the component's size with its top at about y 1140, bottom about y 1280, left edge about
// x 180, because graphics go into the project at default Motion. Check a still of the settled tag against that.
// Names come from the job, the project or the user; never guess a surname or a title.
//
// DURATION: the slot 62.262 -> 65.299 s = 3.036 s x 29.97 = 91 frames (f0..f90).
// Check: the settled tag reads "Louis Pasteur / Chemist and microbiologist" over the Edelfelt portrait still
// (images/60.8_Pasteur_EdelfeltPasteur1885.jpg, 62.262-65.299 s), clear of his face.
// SOURCES: name and job from the director's brief (REV1_notes_20261026.md, "Cut 59 - Pasteur name tag"; user at
// 1;02;08: "add name and tag to this guy").
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import Tag from "../kits/name-tags/NameTagMapStyle";

export const FPS = 30000 / 1001;
export const DURATION = 91;
export const schema = z.object({ name: z.string(), job: z.string() });
export const defaultProps = schema.parse({ name: "Louis Pasteur", job: "Chemist and microbiologist" });

const SCALE = 0.72;
// The full-size point of the tag (x, y) that lands on the house spot (toX, toY) at SCALE.
const AT = { x: 84, y: 1330, toX: 180, toY: 1140 }; // the plate's top-left

const PasteurNameTag: React.FC<z.infer<typeof schema>> = ({ name, job }) => {
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

export default PasteurNameTag;
