import { STATS } from "../generated/components/TooEasy";

const j = (v: unknown) => JSON.stringify(v);
for (const [k, v] of Object.entries(STATS)) {
  if (Array.isArray(v)) {
    console.log(`${k}:`);
    for (const row of v) console.log("  ", j(row));
  } else if (v && typeof v === "object") {
    console.log(`${k}:`);
    for (const [k2, v2] of Object.entries(v as Record<string, unknown>))
      console.log(`   ${k2}: ${j(v2)}`);
  } else {
    console.log(`${k}: ${j(v)}`);
  }
}
