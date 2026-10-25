// ---------------------------------------------------------------------------
// NameTagScottKirby (scott-free-wifi). Name tag (styles/name-tags.md): NameTagStout with new props, never rebuilt.
// Transparent overlay 1080x1920, 23.976 fps, 96 frames.
// Baked at 0.72x of the component's size with its top at about y 1140, bottom about y 1280, left edge about
// x 180, because graphics go into the project at default Motion. Check a still of the settled tag against that.
// Names come from the job, the project or the user; never guess a surname or a title.
//
// DURATION: the stout tag's fixed 96 frames (4.004 s at 23.976); the editor trims it. Delivered as a file only
// (~/Downloads), not placed in the timeline.
// SOURCES: name and title as on the show's own lower third in the episode footage ("SCOTT KIRBY / CEO, United
// Airlines"), in house capitalisation. Name advance measured with hb-shape public/Sohne-Dreiviertelfett.otf
// "Scott Kirby" = 5115 / 1000 em.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import Tag from "../kits/name-tags/NameTagStout";
import { TAG_ADV_EM } from "../kits/cheeky-pint/stoutShared";

export const FPS = 24000 / 1001;
export const DURATION = 96;
export const schema = z.object({ name: z.string(), job: z.string() });
export const defaultProps = schema.parse({ name: "Scott Kirby", job: "CEO, United Airlines" });
TAG_ADV_EM["Scott Kirby"] = 5.115;

const SCALE = 0.72;
// The full-size point of the tag (x, y) that lands on the house spot (toX, toY) at SCALE.
const AT = { x: 84, y: 1620, toX: 180, toY: 1280 }; // bottom-left

const NameTagScottKirby: React.FC<z.infer<typeof schema>> = ({ name, job }) => {
  return (
    <AbsoluteFill
      style={{
        transformOrigin: "0 0",
        transform: `translate(${AT.toX - SCALE * AT.x}px, ${AT.toY - SCALE * AT.y}px) scale(${SCALE})`,
      }}
    >
      <Tag name={name} job={job} backdrop={false} />
    </AbsoluteFill>
  );
};

export default NameTagScottKirby;
