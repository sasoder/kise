// check-smaller-does-the-same-job: every-frame checks for SmallerDoesTheSameJob (rsi-ten-earths, cut 57): on every
// frame and camera state, the screen boxes of the small Genius (head, feet), the giant (head, feet), both sheets and
// both year plates (glyph boxes once entering), the keep-in box (x 65-1015, y 290-1070), the caption bands
// (y 1080-1250 / 1360-1460) and the button column (x >= 955 below y 900); nothing standing on the floor (easel legs,
// both figures' feet, rack bases) reaches into a plate's glyph box; the small Genius's pencil tip vs the drawn tick end
// while drawing; the giant's first visible frame, when its head first crosses the left edge (and how high it is then),
// when the head is wholly inside the frame and when it is inside the keep-in.
// Run: bun scripts/clips/rsi-ten-earths/check-smaller-does-the-same-job.ts
import { perspective, swayCam } from "../../../generated/components/kits/dwarkesh-3d/dwarkesh3d";
import { RACK } from "../../../generated/components/rsi-ten-earths/tenEarthsHall";
import { geniusAnchors, tickDrawn } from "../../../generated/components/rsi-ten-earths/tenEarthsGenius";
import {
  DURATION,
  GIANT,
  GIANT_SHEET,
  PLATES,
  PLATE_SLIDE,
  SHEET,
  SMALL_X1,
  TICK,
  Z_FIG,
  camState,
  giantPose,
  racksAt,
  smallState,
  tickT,
} from "../../../generated/components/rsi-ten-earths/SmallerDoesTheSameJob";

type B = { l: number; r: number; t: number; b: number };
const inBand = (y0: number, y1: number) => (y1 > 1080 && y0 < 1250) || (y1 > 1360 && y0 < 1460);
const onScreen = (b: B) => b.r > 0 && b.l < 1080 && b.b > 0 && b.t < 1920;
const issues: string[] = [];
let giantFirst = -1;
let giantHeadIn = -1;
let headEdge = -1;
let headEdgeTop = 0;
let headWhole = -1;
let maxTipErr = 0;
const ext: Record<string, B> = {};
const grow = (k: string, b: B) => {
  const e = ext[k] ?? { l: 1e9, r: -1e9, t: 1e9, b: -1e9 };
  ext[k] = { l: Math.min(e.l, b.l), r: Math.max(e.r, b.r), t: Math.min(e.t, b.t), b: Math.max(e.b, b.b) };
};
for (let f = 0; f < DURATION; f++) {
  const C = camState(f);
  const cam = swayCam(C.cam, f);
  const P = perspective(cam, C.depth);
  const S = (p: [number, number]): [number, number] => [(p[0] - cam.cx) * cam.k + 540, (p[1] - cam.cy) * cam.k + 960];
  const rEnd = (() => {
    const e = camState(DURATION - 1).depth.dRef;
    return (Zq: number) => e / (e + Zq);
  })();
  // the small Genius
  const st = smallState(f);
  const sm = P.at(st.X, Z_FIG);
  const an = geniusAnchors(0, st.pose, sm.at, sm.scale);
  const head = S(an.headTop as [number, number]);
  const feet = S(sm.at as [number, number]);
  const smB = { l: head[0] - 60, r: head[0] + 60, t: head[1], b: feet[1] };
  grow("small", smB);
  if (f >= 30 && (head[1] < 290 || feet[1] > 1070)) issues.push(`f${f} small Genius y ${head[1].toFixed(0)}-${feet[1].toFixed(0)}`);
  if (inBand(head[1], head[1] + 50)) issues.push(`f${f} small face in a caption band`);
  // the pencil tip on the stroke while drawing
  const t = tickT(f);
  if (f >= TICK.f0 && t > 0.3 && t <= 0.72) {
    const ea = P.at(SMALL_X1, Z_FIG);
    const pts = tickDrawn(1, t);
    const end = pts[pts.length - 1];
    const tip = an.pencilTip as [number, number];
    const err = Math.hypot(ea.at[0] + end[0] * ea.scale - tip[0], ea.at[1] + end[1] * ea.scale - tip[1]) * cam.k;
    maxTipErr = Math.max(maxTipErr, err);
  }
  // the giant
  const gi = P.at(GIANT.X, GIANT.Z);
  const ga = geniusAnchors(0, giantPose(f), gi.at, gi.scale * GIANT.k);
  const gh = S(ga.headTop as [number, number]);
  const gf = S(gi.at as [number, number]);
  const giB = { l: gf[0] - 170 * gi.scale * cam.k * 1, r: gf[0] + 170 * gi.scale * cam.k, t: gh[1], b: gf[1] };
  if (giantFirst < 0 && onScreen(giB)) giantFirst = f;
  const hr = (ga.headR as number) * cam.k;
  const hc = S(ga.headC as [number, number]);
  if (headEdge < 0 && hc[0] + hr > 0) {
    headEdge = f;
    headEdgeTop = gh[1];
  }
  if (headWhole < 0 && hc[0] - hr >= 0 && gh[1] >= 0) headWhole = f;
  if (giantHeadIn < 0 && gh[1] >= 290 && hc[0] - hr >= 65) giantHeadIn = f;
  if (onScreen(giB)) grow("giant", giB);
  if (onScreen(giB) && inBand(gh[1], gh[1] + 150)) issues.push(`f${f} giant face in a caption band`);
  // the sheets
  const ss = P.at(SMALL_X1, Z_FIG);
  const sA = S([ss.at[0] + SHEET.x0 * ss.scale, ss.at[1] + SHEET.y0 * ss.scale]);
  const sB = S([ss.at[0] + SHEET.x1 * ss.scale, ss.at[1] + SHEET.y1 * ss.scale]);
  const shB = { l: sA[0], r: sB[0], t: sA[1], b: sB[1] };
  grow("smallSheet", shB);
  if (shB.r > 1015 || shB.t < 290 || shB.b > 1070 || shB.l < 65) issues.push(`f${f} small sheet ${JSON.stringify(Object.fromEntries(Object.entries(shB).map(([k, v]) => [k, Math.round(v)])))}`);
  const gs = P.at(GIANT_SHEET.X, GIANT_SHEET.Z);
  const gsc = gs.scale * (rEnd(Z_FIG) / rEnd(GIANT_SHEET.Z));
  const gA = S([gs.at[0] + SHEET.x0 * gsc, gs.at[1] + (SHEET.y0 - GIANT_SHEET.lift) * gsc]);
  const gB = S([gs.at[0] + SHEET.x1 * gsc, gs.at[1] + (SHEET.y1 - GIANT_SHEET.lift) * gsc]);
  const gsB = { l: gA[0], r: gB[0], t: gA[1], b: gB[1] };
  if (onScreen(gsB)) grow("giantSheet", gsB);
  if (f === DURATION - 1) {
    ext.sheetsEnd = { l: shB.r - shB.l, r: gsB.r - gsB.l, t: shB.b - shB.t, b: gsB.b - gsB.t };
    ext.figuresEnd = { l: feet[1] - head[1], r: gf[1] - gh[1], t: head[1], b: gh[1] };
  }
  // what stands on the floor, as screen points / base segments [x0, x1, y]
  const ground: { what: string; x0: number; x1: number; y: number }[] = [];
  const legs = (at: [number, number], sc: number, what: string) => {
    for (const x of [SHEET.x0 - 4, SHEET.x1 + 4, (SHEET.x0 + SHEET.x1) / 2 + 26]) {
      const q = S([at[0] + x * sc, at[1]]);
      ground.push({ what, x0: q[0] - 3, x1: q[0] + 3, y: q[1] + 3 });
    }
  };
  legs(ss.at as [number, number], ss.scale, "small easel leg");
  legs(gs.at as [number, number], gsc, "giant easel leg");
  for (const [nm, a] of [["small", an], ["giant", ga]] as const) {
    for (const key of ["toeL", "toeR", "heelL", "heelR"] as const) {
      const q = S(a[key] as [number, number]);
      ground.push({ what: `${nm} foot`, x0: q[0] - 4, x1: q[0] + 4, y: q[1] + 4 });
    }
  }
  for (const rk of racksAt(f)) {
    const a = S(P.p(rk.X - RACK.w / 2, 0, rk.Z) as [number, number]);
    const b = S(P.p(rk.X + RACK.w / 2, 0, rk.Z) as [number, number]);
    ground.push({ what: "rack base", x0: a[0], x1: b[0], y: Math.max(a[1], b[1]) });
  }
  // the plates (glyph box measured on a full-res still: figures 0.62 em each; top c - 0.53 em, bottom c + 0.42 em,
  // stroke included; plus the slide-up's remaining lift)
  PLATES.forEach((pl) => {
    if (f <= pl.f0) return; // t 0: not drawn
    const r = P.r(pl.Z);
    const s = pl.size * r * cam.k;
    const c = S(P.p(pl.X, pl.Y, pl.Z));
    const t = Math.min(1, (f - pl.f0) / 12);
    const lift = PLATE_SLIDE * s * (1 - (1 - Math.pow(1 - t, 3)));
    const tw = 4 * 0.62 * s;
    const b = { l: c[0] - tw / 2, r: c[0] + tw / 2, t: c[1] - 0.53 * s + lift, b: c[1] + 0.42 * s + lift };
    grow(`plate${pl.text}`, b);
    if (b.l < 65 || b.r > 1015 || b.t < 290 || b.b > 1070 || inBand(b.t, b.b) || (b.r > 955 && b.b > 900)) issues.push(`f${f} plate ${pl.text} ${Math.round(b.l)}-${Math.round(b.r)} x ${Math.round(b.t)}-${Math.round(b.b)}`);
    for (const g of ground) {
      if (g.x1 > b.l - 4 && g.x0 < b.r + 4 && g.y > b.t - 4) issues.push(`f${f} ${g.what} (x ${Math.round(g.x0)}-${Math.round(g.x1)}, y ${Math.round(g.y)}) reaches plate ${pl.text} (top ${Math.round(b.t)})`);
    }
    if (f === DURATION - 1) {
      const gap = Math.min(...ground.filter((g) => g.x1 > b.l - 4 && g.x0 < b.r + 4).map((g) => b.t - g.y));
      console.log(`plate ${pl.text} at rest: ${Math.round(b.l)}-${Math.round(b.r)} x ${Math.round(b.t)}-${Math.round(b.b)}, clearance above to the nearest standing thing over it ${gap.toFixed(0)} px`);
    }
  });
}
const round = (b: B) => Object.fromEntries(Object.entries(b).map(([k, v]) => [k, Math.round(v)]));
console.log("extents (l r t b; sheetsEnd = small w, giant w, small h, giant h; figuresEnd = small h, giant h, small head y, giant head y):");
for (const [k, v] of Object.entries(ext)) console.log(" ", k, JSON.stringify(round(v)));
console.log("giant first on screen f", giantFirst, "| head reaches the left edge f", headEdge, "(head top y", Math.round(headEdgeTop), ") | head wholly in frame f", headWhole, "| head inside the keep-in f", giantHeadIn);
console.log("pencil tip vs stroke end max px", maxTipErr.toFixed(2));
console.log(issues.length ? issues.join("\n") : "no issues");
