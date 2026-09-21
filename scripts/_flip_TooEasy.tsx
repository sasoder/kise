import { QUESTIONS } from "../generated/components/challengeShared";
import { CAM_AT, SOLVED_AT } from "../generated/components/TooEasy";

const i = Number(process.argv[2] ?? 30);
const q = QUESTIONS[i];
for (let f = Number(process.argv[3] ?? 50); f <= Number(process.argv[4] ?? 68); f++) {
  const c = CAM_AT(f);
  const x = 540 + (q.x - 540) * c.k;
  const y = 960 + (q.y - c.cy) * c.k;
  console.log(f, Math.round(x - 105), Math.round(y - 105), SOLVED_AT(f, i).toFixed(2));
}
