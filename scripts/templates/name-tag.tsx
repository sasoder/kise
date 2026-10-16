// ---------------------------------------------------------------------------
// __NAME__ (__CLIP__). __STYLE__ (styles/name-tags.md): __TAG__ with new props, never rebuilt.
// __FORMAT__.
// Baked at 0.72x of the component's size with its top at about y 1140, bottom about y 1280, left edge about
// x 180, because graphics go into the project at default Motion. Check a still of the settled tag against that.
// Names come from the job, the project or the user; never guess a surname or a title.
//
// DURATION: __DURATION_NOTE__
// SOURCES: <where the name and job come from>
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import Tag from "../kits/name-tags/__TAG__";

export const FPS = __FPS__;
export const DURATION = __DURATION__;
export const schema = z.object({ name: z.string(), job: z.string() });
export const defaultProps = schema.parse({ name: "<Name Surname>", job: "<Job in sentence case>" });

const SCALE = 0.72;
// The full-size point of the tag (x, y) that lands on the house spot (toX, toY) at SCALE.
const AT = __TAG_AT__; // __TAG_AT_NOTE__

const __NAME__: React.FC<z.infer<typeof schema>> = ({ name, job }) => {
  return (
    <AbsoluteFill
      style={{
        transformOrigin: "0 0",
        transform: `translate(${AT.toX - SCALE * AT.x}px, ${AT.toY - SCALE * AT.y}px) scale(${SCALE})`,
      }}
    >
      <Tag name={name} job={job}__TAG_EXTRA__ />
    </AbsoluteFill>
  );
};

export default __NAME__;
