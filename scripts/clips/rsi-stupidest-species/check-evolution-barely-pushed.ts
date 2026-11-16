// check-evolution-barely-pushed — per-frame checks of EvolutionBarelyPushed REVISION 1b, THE MARCH LEFT AS A LINEUP
// (rsi-stupidest-species, cut 51). Run: bun scripts/clips/rsi-stupidest-species/check-evolution-barely-pushed.ts [--table]
//
// 1. the camera moves at f0; the zoom only ever pulls back; no camera jerk (the Z 0 plane, px/f^2)
// 2. every SWAP is hidden: the old figure (with its glow's halo and its contact shadow) is inside its near object's
//    full-width span on the frame before the swap; the new one and the old one's afterimage on the swap frame
// 3. the near objects cross the screen at <= 45 px per frame while they are in frame
// 4. the middle stages (hominin, forager) are clear of every near object for >= 16 frames
// 5. his face (the head's disc) is inside the keep-in box (x 65-1015, y 290-1070) and out of the caption bands on every
//    frame it is visible; on the end frames every face of the lineup too
// 6. the end frame: the whole lineup inside x 65-1015; every near object out of frame (sunk below it or off its side)
//    from f80 on
// 7. planted feet: a foot (or the chimp's knuckle) on the ground does not slide (world units per frame)
// 8. pops: within a stage the head moves smoothly on screen
// 9. the glow: the chimp's 60-70 % of the modern man's; each spot 18-24 % of its head's width across
// 10. REV 2, the city (the right side of the split): every building, tree and the lamp stand right of the split (the
//    buildings nearer than Z 6000 past the kerb); once on the paving the modern man's feet stay on the sidewalk (short of
//    the kerb); the lamp's pole and head keep >= 12 px clear of his body (not his shadow) on every frame it is visible, its head inside the keep-in box on the
//    end frame; the city grows in without a pop (<= 0.12 of its opacity per frame)
import { buildPerson } from "../../../generated/components/rsi-stupidest-species/stupidestFolkBody";
import { chimpAnchors } from "../../../generated/components/rsi-stupidest-species/stupidestFolk";
import { covidAnchors } from "../../../generated/components/kyle-covid/covidFolk";
import {
  AFTER,
  BUILDINGS,
  LAMP,
  STREET_TREES,
  X_KERB,
  X_PAVE,
  cityIn,
  DURATION,
  GLOW_R,
  MOD_END,
  OCCS,
  STAGES,
  SWAPS,
  boxOf,
  buildWalker,
  camAt,
  glowOf,
  occCentre,
  rOf,
  rigAt,
  stageAt,
  toScreen,
  walkX,
  walkerBox,
  walkerPose,
} from "../../../generated/components/rsi-stupidest-species/EvolutionBarelyPushed";

type P2 = [number, number];
type Box = { x0: number; x1: number; y0: number; y1: number };
const table = process.argv.includes("--table");
const issues: string[] = [];
const KEEP = { x0: 65, x1: 1015, y0: 290, y1: 1070 };
const BANDS: [number, number][] = [
  [1080, 1250],
  [1360, 1460],
];
const PAINT = 2;

// ---- 1. the camera ---------------------------------------------------------------------------------------------
const cams = Array.from({ length: DURATION + 1 }, (_, f) => rigAt(f).cam);
const v0 = (cams[1].cx - cams[0].cx) * cams[0].k;
if (Math.abs(v0) < 0.5)
  issues.push(`camera at rest at f0 (${v0.toFixed(2)} px/f)`);
let maxJerk = 0;
for (let f = 1; f < DURATION; f++) {
  if (cams[f].k > cams[f - 1].k + 1e-9)
    issues.push(`f${f}: the zoom pushes in`);
  const a0 = (cams[f].cx - cams[f - 1].cx) * cams[f].k;
  const a1 = (cams[f + 1].cx - cams[f].cx) * cams[f].k;
  maxJerk = Math.max(maxJerk, Math.abs(a1 - a0));
  if (Math.abs(a1 - a0) > 4)
    issues.push(`f${f}: camera jerk ${(a1 - a0).toFixed(1)} px/f^2`);
}

// ---- the near objects on screen ---------------------------------------------------------------------------------------
const occS = (i: number, f: number) => {
  const o = OCCS[i];
  const cam = camAt(f);
  const rg = rigAt(f);
  const r = rOf(f, o.Z);
  const c = occCentre(o, f, cam);
  const hw = o.hw * r * cam.k;
  const sy = (Y: number) =>
    960 + (rg.depth.eyeY + (Y - rg.depth.eyeY) * r - cam.cy) * cam.k;
  return {
    c,
    x0: c - hw + PAINT,
    x1: c + hw - PAINT,
    top: sy(o.topY),
    base: sy(0),
    capTop: sy(o.topY - 1.0 * o.hw),
  };
};
const inside = (B: Box, s: ReturnType<typeof occS>) =>
  B.x0 >= s.x0 && B.x1 <= s.x1 && B.y0 >= s.top;
const overlaps = (B: Box, s: ReturnType<typeof occS>) =>
  Math.min(B.x1, s.x1 + PAINT) > Math.max(B.x0, s.x0 - PAINT) &&
  B.y1 > s.capTop;

// ---- 2. the swaps -------------------------------------------------------------------------------------------------------
const swapRows: string[] = [];
OCCS.forEach((o, i) => {
  const s = o.swap;
  const A = walkerBox(s - 1);
  const B = walkerBox(s);
  const Af = boxOf(AFTER[i].b, [AFTER[i].X, 0], camAt(s));
  const sa = occS(i, s - 1);
  const sb = occS(i, s);
  const fmt = (q: Box, z: ReturnType<typeof occS>) =>
    `fig ${q.x0.toFixed(0)}..${q.x1.toFixed(0)} top ${q.y0.toFixed(0)}; occ ${z.x0.toFixed(0)}..${z.x1.toFixed(0)} top ${z.top.toFixed(0)}`;
  if (!inside(A, sa))
    issues.push(
      `swap ${i + 1} (${o.kind}, f${s}): the old figure is not covered at f${s - 1} (${fmt(A, sa)})`,
    );
  if (!inside(B, sb))
    issues.push(
      `swap ${i + 1} (${o.kind}, f${s}): the new figure is not covered at f${s} (${fmt(B, sb)})`,
    );
  if (!inside(Af, sb))
    issues.push(
      `swap ${i + 1} (${o.kind}, f${s}): the afterimage is not covered at f${s} (${fmt(Af, sb)})`,
    );
  let full = 0;
  let part = 0;
  for (let f = Math.max(0, s - 20); f <= s + 20; f++) {
    const W = walkerBox(f);
    const z = occS(i, f);
    if (inside(W, z)) full++;
    if (overlaps(W, z)) part++;
  }
  swapRows.push(
    `${o.kind} f${s}: fully hidden ${full} f, touched ${part} f, ${(sb.x1 - sb.x0 + 2 * PAINT).toFixed(0)} px wide at r ${o.r} (figure ${(B.x1 - B.x0).toFixed(0)} px)`,
  );
});

// ---- 3. speeds, 4. clear frames, 5. faces, 8. pops ------------------------------------------------------------------
const faceOf = (b: ReturnType<typeof buildWalker>, X: number, f: number) => {
  const cam = camAt(f);
  const head = toScreen(cam, [X + b.headC[0] * b.scale, b.headC[1] * b.scale]);
  return { head, hr: b.headR * b.scale * cam.k };
};
const faceIssues = (who: string, f: number, head: P2, hr: number) => {
  if (
    head[0] - hr < KEEP.x0 ||
    head[0] + hr > KEEP.x1 ||
    head[1] - hr < KEEP.y0 ||
    head[1] + hr > KEEP.y1
  )
    issues.push(
      `f${f}: ${who}'s face (${head[0].toFixed(0)}, ${head[1].toFixed(0)} r ${hr.toFixed(0)}) leaves the keep-in box`,
    );
  for (const [y0, y1] of BANDS)
    if (head[1] + hr > y0 && head[1] - hr < y1)
      issues.push(`f${f}: ${who}'s face in the caption band ${y0}-${y1}`);
};
const clear = [0, 0, 0, 0];
let prevHead: P2 | null = null;
let maxOccV = 0;
const rows: string[] = [];
for (let f = 0; f < DURATION; f++) {
  const cam = camAt(f);
  const wp = walkerPose(f);
  const b = buildWalker(wp, f);
  const X = walkX(f);
  const W = walkerBox(f);
  const { head, hr } = faceOf(b, X, f);
  const hidden = OCCS.some((_, i) => {
    const s = occS(i, f);
    return (
      head[0] - hr >= s.x0 && head[0] + hr <= s.x1 && head[1] - hr >= s.top
    );
  });
  if (!hidden) faceIssues("his", f, head, hr);
  const touched = OCCS.some((_, i) => overlaps(W, occS(i, f)));
  if (!touched) clear[stageAt(f)]++;
  OCCS.forEach((o, i) => {
    const a = occS(i, f);
    const n = occS(i, f + 1);
    const inFrame = a.x1 > -20 && a.x0 < 1100 && a.capTop < 1920;
    if (!inFrame || f === DURATION - 1) return;
    const v = Math.abs(n.c - a.c);
    maxOccV = Math.max(maxOccV, v);
    if (v > 45)
      issues.push(`f${f}: the ${o.kind} crosses at ${v.toFixed(1)} px/f`);
  });
  const st = stageAt(f);
  if (prevHead && stageAt(f - 1) === st) {
    const d = Math.hypot(head[0] - prevHead[0], head[1] - prevHead[1]);
    if (d > 26) issues.push(`f${f}: the head jumps ${d.toFixed(1)} px`);
  }
  prevHead = head;
  const feetS = toScreen(cam, [X, 0]);
  if (f < 78 && (feetS[0] < 440 || feetS[0] > 700))
    issues.push(`f${f}: his feet drift to x ${feetS[0].toFixed(0)}`);
  rows.push(
    `f${String(f).padStart(3)} ${b.kind.padEnd(7)} X ${X.toFixed(1).padStart(6)} k ${cam.k.toFixed(2)} eye ${rigAt(f).depth.eyeY.toFixed(0)} feet ${feetS[0].toFixed(0)},${feetS[1].toFixed(0)} head ${head[0].toFixed(0)},${head[1].toFixed(0)} r ${hr.toFixed(0)}${hidden ? " (hidden)" : ""}${touched ? " (touched)" : ""}`,
  );
}
if (clear[1] < 16)
  issues.push(`the hominin is clear for only ${clear[1]} frames`);
if (clear[2] < 16)
  issues.push(`the forager is clear for only ${clear[2]} frames`);

// ---- 6. the end frames ------------------------------------------------------------------------------------------------
let lineupRow = "";
for (let f = 96; f < DURATION; f++) {
  const cam = camAt(f);
  const boxes = [
    ...AFTER.map((a) => ({
      who: a.b.kind,
      b: a.b,
      X: a.X,
      box: boxOf(a.b, [a.X, 0], cam),
    })),
    {
      who: "modern",
      b: MOD_END.b,
      X: MOD_END.X,
      box: boxOf(buildWalker(walkerPose(f), f), [walkX(f), 0], cam),
    },
  ];
  const x0 = Math.min(...boxes.map((q) => q.box.x0));
  const x1 = Math.max(...boxes.map((q) => q.box.x1));
  if (x0 < KEEP.x0 || x1 > KEEP.x1)
    issues.push(`f${f}: the lineup spans x ${x0.toFixed(0)}..${x1.toFixed(0)}`);
  for (const q of boxes.slice(0, 3)) {
    const { head, hr } = faceOf(q.b, q.X, f);
    faceIssues(`the ${q.who} afterimage`, f, head, hr);
  }
  OCCS.forEach((o, i) => {
    const s = occS(i, f);
    if (s.x1 > 0 && s.x0 < 1080 && s.capTop < 1920)
      issues.push(
        `f${f}: the ${o.kind} is still in frame (x ${s.c.toFixed(0)}, top ${s.capTop.toFixed(0)})`,
      );
  });
  if (f === DURATION - 1) {
    lineupRow = `end lineup x ${x0.toFixed(0)}..${x1.toFixed(0)}; faces y ${boxes.map((q) => faceOf(q.b, q.X, f).head[1].toFixed(0)).join(" / ")}; heights px ${boxes.map((q) => (q.box.y1 - q.box.y0).toFixed(0)).join(" / ")}`;
  }
}

// the rise has sunk every near object out of the bottom of the frame by f80 (no sliver at the bottom edge)
for (let f = 80; f < 96; f++) {
  OCCS.forEach((o, i) => {
    const s = occS(i, f);
    if (s.x1 > 0 && s.x0 < 1080 && s.capTop < 1925)
      issues.push(
        `f${f}: the ${o.kind} still shows at the bottom edge (x ${s.c.toFixed(0)}, top ${s.capTop.toFixed(0)})`,
      );
  });
}

// ---- 7. planted feet ---------------------------------------------------------------------------------------------------
type Feet = Record<string, P2>;
const feetOf = (f: number): { kind: string; feet: Feet } => {
  const wp = walkerPose(f);
  const X = walkX(f);
  const w = (a: P2, s: number): P2 => [X + a[0] * s, a[1] * s];
  if (wp.kind === "chimp") {
    const a = chimpAnchors(0, wp.pose, [X, 0], STAGES[0].scale);
    return {
      kind: "chimp",
      feet: { handL: a.handL, handR: a.handR, footL: a.footL, footR: a.footR },
    };
  }
  if (wp.kind === "modern") {
    const a = covidAnchors("commuter", wp.pose, [X, 0], STAGES[3].scale, {
      variant: 1,
    });
    return {
      kind: "modern",
      feet: {
        footL: [(a.toeL[0] + a.heelL[0]) / 2, Math.min(a.toeL[1], a.heelL[1])],
        footR: [(a.toeR[0] + a.heelR[0]) / 2, Math.min(a.toeR[1], a.heelR[1])],
      },
    };
  }
  const i = wp.kind === "hominin" ? 1 : 2;
  const a = buildPerson("forager", wp.pose, {
    variant: wp.kind === "hominin" ? 4 : 0,
  }).anchors;
  // a person's foot is planted while heel AND toe are down (the cast's toe-off pivots about the ankle: not a slide)
  const foot = (t: P2, h: P2): P2 => [(t[0] + h[0]) / 2, Math.min(t[1], h[1])];
  return {
    kind: wp.kind,
    feet: {
      footL: w(foot(a.toeL, a.heelL), STAGES[i].scale),
      footR: w(foot(a.toeR, a.heelR), STAGES[i].scale),
    },
  };
};
let maxSlide = 0;
let slideAt = "";
for (let f = 1; f < DURATION; f++) {
  if (SWAPS.includes(f)) continue;
  const A0 = feetOf(f - 1);
  const A1 = feetOf(f);
  for (const key of Object.keys(A1.feet)) {
    const p0 = A0.feet[key];
    const p1 = A1.feet[key];
    if (p0[1] > -1.5 && p1[1] > -1.5) {
      const d = Math.abs(p1[0] - p0[0]);
      if (d > maxSlide) {
        maxSlide = d;
        slideAt = `f${f} ${A1.kind} ${key}`;
      }
    }
  }
}
if (maxSlide > 2.5)
  issues.push(
    `a planted foot slides ${maxSlide.toFixed(2)} units/f (${slideAt})`,
  );

// ---- 9. the glow ----------------------------------------------------------------------------------------------------
const ratio = GLOW_R.chimp / GLOW_R.modern;
if (ratio < 0.6 || ratio > 0.7)
  issues.push(
    `the chimp's glow is ${(ratio * 100).toFixed(0)} % of the modern man's (want 60-70 %)`,
  );
const glowRows: string[] = [];
for (const f of [0, 30, 55, 100]) {
  const b = buildWalker(walkerPose(f), f);
  const g = glowOf(b, [0, 0]);
  const pct = (2 * g.R) / (2 * g.headR);
  glowRows.push(`${b.kind} ${(pct * 100).toFixed(0)} %`);
  if (pct < 0.18 || pct > 0.24)
    issues.push(
      `the ${b.kind}'s glow is ${(pct * 100).toFixed(0)} % of its head's width (want 18-24 %)`,
    );
}

// ---- 10. the city -------------------------------------------------------------------------------------------------------
for (const b of BUILDINGS)
  if (b.X0 <= X_PAVE + 150 || (b.Z0 < 6000 && b.X0 <= X_KERB))
    issues.push(
      `a building stands too near the split (X0 ${b.X0}, Z0 ${b.Z0})`,
    );
for (const t of STREET_TREES)
  if (t.X - 70 <= X_PAVE)
    issues.push(`a street tree stands on the savannah (X ${t.X})`);
if (LAMP.X - 17 <= X_PAVE) issues.push(`the lamp stands on the savannah`);
let lampGap = 1e9;
let lampGapAt = 0;
let maxIn = 0;
for (let f = 0; f < DURATION; f++) {
  if (walkX(f) >= X_PAVE + 20) {
    const X = walkX(f);
    if (X > X_KERB - 60)
      issues.push(`f${f}: his feet are off the sidewalk (X ${X.toFixed(0)})`);
  }
  for (const Z of [0, 2000, 5000, 9000])
    maxIn = Math.max(maxIn, Math.abs(cityIn(f + 1, Z) - cityIn(f, Z)));
  if (cityIn(f, 0) < 0.05) continue;
  const cam = camAt(f);
  const rg = rigAt(f);
  const r = rOf(f, LAMP.Z);
  const sx = (X: number) => 540 + (X - cam.cx) * r * cam.k;
  const sy = (Y: number) =>
    960 + (rg.depth.eyeY + (Y - rg.depth.eyeY) * r - cam.cy) * cam.k;
  const B = boxOf(buildWalker(walkerPose(f), f), [walkX(f), 0], cam, false);
  const poleX0 = sx(LAMP.X - 17);
  if (B.x1 < sx(LAMP.X + LAMP.arm + 30) && B.y1 > sy(-LAMP.H - 40)) {
    const gap = poleX0 - B.x1;
    if (gap < lampGap) {
      lampGap = gap;
      lampGapAt = f;
    }
  }
  if (f === DURATION - 1) {
    const hx = sx(LAMP.X + LAMP.arm + 26);
    const hy = sy(-LAMP.H - 38);
    if (hx > KEEP.x1 || hy < KEEP.y0)
      issues.push(
        `the lamp's head is outside the keep-in box on the end frame (${hx.toFixed(0)}, ${hy.toFixed(0)})`,
      );
  }
}
if (lampGap < 12)
  issues.push(
    `the lamp comes within ${lampGap.toFixed(0)} px of him (f${lampGapAt})`,
  );
if (maxIn > 0.12)
  issues.push(
    `the city pops in (${maxIn.toFixed(2)} of its opacity in one frame)`,
  );
const cityRow = `city: ${BUILDINGS.length} buildings right of the split (past the kerb nearer than Z 6000); lamp clear of him by >= ${lampGap.toFixed(0)} px (f${lampGapAt}); city grows in at <= ${maxIn.toFixed(2)} / f`;

if (table) console.log(rows.join("\n"));
console.log(swapRows.join("\n"));
console.log(
  `clear frames: chimp ${clear[0]}, hominin ${clear[1]}, forager ${clear[2]}, modern ${clear[3]}; near objects max ${maxOccV.toFixed(0)} px/f in frame; camera jerk max ${maxJerk.toFixed(1)} px/f^2`,
);
console.log(
  `walk ${walkX(DURATION - 1).toFixed(0)} units; afterimages at X ${AFTER.map((a) => a.X.toFixed(0)).join(", ")}, the modern man ${MOD_END.X.toFixed(0)}; k ${cams[0].k.toFixed(2)} -> ${cams[DURATION - 1].k.toFixed(2)}; eye ${rigAt(0).depth.eyeY} -> ${rigAt(DURATION - 1).depth.eyeY}`,
);
console.log(
  `glow chimp ${GLOW_R.chimp} vs modern ${GLOW_R.modern} units (${(ratio * 100).toFixed(0)} %); spot / head width: ${glowRows.join(", ")}; worst planted-foot slide ${maxSlide.toFixed(2)} units/f (${slideAt})`,
);
console.log(lineupRow);
console.log(cityRow);
console.log(
  issues.length
    ? `ISSUES (${issues.length}):\n  ${issues.join("\n  ")}`
    : "OK: no issues",
);
