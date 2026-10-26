// ---------------------------------------------------------------------------
// AeolipileNameTag (kyle-rome-industrial). Name tag (styles/name-tags.md): NameTagMapStyle with new props, never rebuilt.
// Transparent overlay 1080x1920, 29.97 fps, 76 frames.
// Baked at 0.72x of the component's size with its top at about y 1140, bottom about y 1280, left edge about
// x 180, because graphics go into the project at default Motion. Check a still of the settled tag against that.
// Names come from the job, the project or the user; never guess a surname or a title.
//
// DURATION: the slot 132.432 -> 134.968 s = 2.536 s x 29.97 = 76 frames (f0..f75): local f200 of cut 125
// (CenturiesOfLittleScience) to its out point; on V5 above that graphic.
// Check: the settled tag reads "Hero's aeolipile / Early steam turbine, Alexandria, 1st century AD" over cut 125's
// aeolipile (from f200 its subject, framed above y ~1100 and centred, so the tag at y 1140-1280 never covers it).
// SOURCES: name and job from the director's brief (REV1_notes_20261026.md, "Cut 125"; the job line per the director's review of rev 1; user at 02;13;23: "make sure the
// thing in focus here is actually a piece of technology. If so, add a lower-third name tag"). Hero of Alexandria's
// aeolipile, Pneumatica (1st century AD, Roman Egypt).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import Tag from "../kits/name-tags/NameTagMapStyle";

export const FPS = 30000 / 1001;
export const DURATION = 76;
export const schema = z.object({ name: z.string(), job: z.string() });
export const defaultProps = schema.parse({ name: "Hero's aeolipile", job: "Early steam turbine, Alexandria, 1st century AD" });

const SCALE = 0.72;
// The full-size point of the tag (x, y) that lands on the house spot (toX, toY) at SCALE.
const AT = { x: 84, y: 1330, toX: 180, toY: 1140 }; // the plate's top-left

const AeolipileNameTag: React.FC<z.infer<typeof schema>> = ({ name, job }) => {
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

export default AeolipileNameTag;
