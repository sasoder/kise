// Rasterise the OpenAI knot (animation_source/assets/openai_symbol.svg, the image agent's copy) as a black-on-
// transparent PNG for cut 53 DrowningInApplications: bake-drowning-sheets.py prints it on the "slop" sheet.
// Run from the repo root:
//   bun scripts/clips/shruti-trailer/bake-drowning-mark.mjs <openai_symbol.svg> assets-src/shruti-trailer/openai_mark_black.png
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";

const [src, out] = process.argv.slice(2);
if (!src || !out) throw new Error("usage: bake-drowning-mark.mjs <svg> <out.png>");
let svg = readFileSync(src, "utf8");
// print black: force every fill to black (the source path has no fill = black already; this guards a white copy)
svg = svg.replace(/fill="[^"]*"/g, 'fill="#000"');
const png = new Resvg(svg, { fitTo: { mode: "width", value: 512 }, background: "rgba(0,0,0,0)", shapeRendering: 2 }).render().asPng();
writeFileSync(out, png);
console.log(`wrote ${out}`);
