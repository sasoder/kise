// ---------------------------------------------------------------------------
// unleashGlyphs (sam-kids-mind-blown, cut 1 only): the family of things people make in CreativeUnleash.
// Museshared's GlyphMark grammar (24-unit box, round joins, ink inside about 2..22) but SOLID: an amber card
// silhouette with its one detail in ink. Note, camera, book and heart follow Lucide's outlines (ISC), filled; the
// others are drawn here to the same grammar. Each glyph is a list of parts:
//   solid  a filled path in the card's colour (fattened by a same-colour stroke so every corner is chunky)
//   line   a stroked path in the card's colour, at LINE units (the note's stems, the brush's handle); thin = the bike's frame
//   ink    a stroked path in ink, at INK units; inkDot a filled ink circle; amberDot a filled card circle over ink
// ---------------------------------------------------------------------------
import React from "react";
import { circlePath, type SilItem } from "../kits/cheeky-pint/museShared";

const LINE = 3.9;
const INK = 1.9;
const THIN = 2.5;
const FATTEN = 1.1;

export type MakeName = "note" | "controller" | "brush" | "rocket" | "camera" | "heart" | "book" | "house" | "bike";
type Part = { solid: string } | { line: string } | { thin: string } | { ink: string } | { inkDot: [number, number, number] } | { amberDot: [number, number, number] } | { disc: [number, number, number] };

const GLYPHS: Record<MakeName, Part[]> = {
  note: [{ solid: "M8.2 5.6 20.8 3.4V8L8.2 10.2Z" }, { line: "M9.3 17.8V7" }, { line: "M19.7 15.8V5" }, { disc: [6.1, 17.9, 3.3] }, { disc: [16.5, 15.9, 3.3] }],
  controller: [
    { solid: "M7.2 7h9.6a4.8 4.8 0 0 1 4.8 4.4l.5 5.2a2.8 2.8 0 0 1-5 2L15.2 17H8.8l-1.9 1.6a2.8 2.8 0 0 1-5-2l.5-5.2A4.8 4.8 0 0 1 7.2 7Z" },
    { ink: "M5.9 11.7h4.2" },
    { ink: "M8 9.6v4.2" },
    { inkDot: [15.2, 13.1, 1.25] },
    { inkDot: [18.2, 10.6, 1.25] },
  ],
  brush: [{ line: "M20.8 3.2 12.6 11.4" }, { solid: "M11.4 11.6c-3-.5-5.6 1.4-6 4.2-.3 2-1.3 3.2-3 4 3.2 1.6 7.4 1.2 9.8-1.2 1.7-1.7 2-3.8 1.3-5.2Z" }, { ink: "M10.7 10.7 14 14" }],
  rocket: [
    { solid: "M12 1.8c3.3 2.6 4.8 6.2 4.8 10v5H7.2v-5c0-3.8 1.5-7.4 4.8-10Z" },
    { solid: "M7.2 11.2 3.4 15.8v4L7.2 17.6Z" },
    { solid: "M16.8 11.2l3.8 4.6v4l-3.8-2.2Z" },
    { solid: "M9.8 18.6h4.4v2.8H9.8Z" },
    { inkDot: [12, 9.4, 2.15] },
  ],
  camera: [
    { solid: "M14.5 4.4h-5L7.2 7.4H4a1.8 1.8 0 0 0-1.8 1.8v8.8A1.8 1.8 0 0 0 4 19.8h16a1.8 1.8 0 0 0 1.8-1.8V9.2A1.8 1.8 0 0 0 20 7.4h-3.2Z" },
    { inkDot: [12, 13.2, 3.9] },
    { amberDot: [12, 13.2, 1.8] },
  ],
  heart: [{ solid: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" }],
  book: [
    { solid: "M12 6.4C10 4.5 7 3.6 2.8 3.6a.7.7 0 0 0-.7.7v13.4c0 .4.3.7.7.7 4.2 0 6.9 1 9.2 2.9 2.3-1.9 5-2.9 9.2-2.9.4 0 .7-.3.7-.7V4.3a.7.7 0 0 0-.7-.7C17 3.6 14 4.5 12 6.4Z" },
    { ink: "M12 7.2v12.6" },
  ],
  house: [{ solid: "M12 2.4 21.8 11v1.2h-2.3V20.6a.9.9 0 0 1-.9.9H5.4a.9.9 0 0 1-.9-.9V12.2H2.2V11Z" }, { ink: "M10 21v-5a2 2 0 0 1 4 0v5" }],
  bike: [
    { disc: [5.4, 17, 4.7] },
    { disc: [18.6, 17, 4.7] },
    { inkDot: [5.4, 17, 2.7] },
    { inkDot: [18.6, 17, 2.7] },
    { thin: "M5.4 17 9.6 9h6.6L18.6 17" },
    { thin: "M9.6 9 12.4 17H5.4" },
    { thin: "M16.2 9 15 5.4h-3" },
    { thin: "M7.6 6.4h3.6" },
  ],
};

export const MAKE_NAMES: MakeName[] = ["note", "controller", "brush", "rocket", "camera", "heart", "book", "house", "bike"];

/** The glyph's silhouette as SilItems for the field's ONE UnionShadow: `tf` places its 24 box in the world; ink ignored. */
export const makeSil = (name: MakeName, tf: string): SilItem[] =>
  GLYPHS[name].flatMap((p): SilItem[] => {
    if ("solid" in p) return [{ d: p.solid, tf }];
    if ("line" in p) return [{ d: p.line, stroke: LINE, tf }];
    if ("thin" in p) return [{ d: p.thin, stroke: THIN, tf }];
    if ("disc" in p) return [{ d: circlePath(p.disc[0], p.disc[1], p.disc[2]), tf }];
    return [];
  });

/** The glyph's amber body in its 24 box: draw inside a transform; `fill` is the frame's amber gradient. */
export const MakeBody: React.FC<{ name: MakeName; fill: string; ink: string }> = ({ name, fill, ink }) => (
  <>
    {GLYPHS[name].map((p, i) => {
      if ("solid" in p) return <path key={i} d={p.solid} fill={fill} stroke={fill} strokeWidth={FATTEN} strokeLinejoin="round" />;
      if ("line" in p) return <path key={i} d={p.line} fill="none" stroke={fill} strokeWidth={LINE} strokeLinecap="round" strokeLinejoin="round" />;
      if ("thin" in p) return <path key={i} d={p.thin} fill="none" stroke={fill} strokeWidth={THIN} strokeLinecap="round" strokeLinejoin="round" />;
      if ("disc" in p) return <circle key={i} cx={p.disc[0]} cy={p.disc[1]} r={p.disc[2]} fill={fill} />;
      if ("ink" in p) return <path key={i} d={p.ink} fill="none" stroke={ink} strokeWidth={INK} strokeLinecap="round" strokeLinejoin="round" />;
      if ("inkDot" in p) return <circle key={i} cx={p.inkDot[0]} cy={p.inkDot[1]} r={p.inkDot[2]} fill={ink} />;
      return <circle key={i} cx={p.amberDot[0]} cy={p.amberDot[1]} r={p.amberDot[2]} fill={fill} />;
    })}
  </>
);
