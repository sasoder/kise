// ---------------------------------------------------------------------------
// rodentFigures: Europe's people in RodentFromCentralAsia (kyle-pandemics, cut 1). V3 cast take 2: the picture-book
// GOUACHE crowd of pandemicFolk (medieval kinds: medMan, medWoman, medChild, medOld; the living in natural earthy
// cloth, the fallen in a deepened DEAD), thinned so no two overlap by more than a shoulder (CROWD),
// baked once per kind / seed / ink into sprites with the gouache filter inside (useFolkSprites), and blitted on a canvas
// through the cut's camera, far to near: feet on the map ground plane, scale by depth, fogged into the clip's air by
// the ground's own haze (AIR_READY.md: the air at that distance), a soft contact shadow in the medium's shadow colour.
// As the front reaches a figure, every second one (CROWD: the alternating pick in the order the front reaches them,
// its timing FALL) falls: pandemicFolk's fall() (it tips over the edge of a foot toward the west on
// screen, slow then quicker, lands flat with a small settle), crossfading to its DEAD sprite as it goes. The others
// stand with a slow idle sway.
// ---------------------------------------------------------------------------
import React, { useMemo } from "react";
import { FolkCanvas, crowdSpriteReq, fall, sway, useFolkSprites, type CrowdKind } from "./pandemicFolk";
import { AIR, airRamp, rgbHex } from "./pandemicAir";
import { FALL, FIGURES, FIG_H, H, W, camAt, toScreen, type Cam, type Fig } from "./rodentCamera";
import type { Shape } from "./pandemicFolkPaint";

/** the four kinds of the map's people, their heights against a man's and their share (medWoman at most a quarter) */
const KINDS: { kind: CrowdKind; k: number; w: number }[] = [
  { kind: "medMan", k: 1, w: 0.4 },
  { kind: "medWoman", k: 0.94, w: 0.22 },
  { kind: "medOld", k: 0.95, w: 0.2 },
  { kind: "medChild", k: 0.74, w: 0.18 },
];
/** the living in natural, earthy medieval cloth (the approved style frames): oatmeal, umber, slate, muted red-brown,
 *  dusty teal; each remaps pandemicFolkCrowd's "natural" ink set (c1 hood / veil, c2 garment, c3 deep, c4 light
 *  piece, c5 dark accents) */
const NATURAL = ["#A9785E", "#7D8775", "#5E5348", "#EBE2CD", "#3F342C"];
const CLOTH: string[][] = [
  ["#B9A584", "#8C7A5E", "#6B5D47", "#D9CCB0", "#4A3E31"], // oatmeal
  ["#7A5A40", "#9C8463", "#563F2E", "#CDBE9E", "#3A2C21"], // umber
  ["#5F6A6E", "#8B7D66", "#454E52", "#D3C7AC", "#33302B"], // slate
  ["#8A4E3C", "#6E6152", "#66392C", "#D6C8AA", "#3E2C24"], // muted red-brown
  ["#5E7B74", "#9A8668", "#455C57", "#D6CAAE", "#37332C"], // dusty teal
];
/** the fallen: pandemicFolk's DEAD, a touch deeper so a lying body reads on the orange hatch */
const DEAD_SRC = ["#9A8B70", "#8A7B62", "#776A53", "#AA9C82", "#5E5341"];
const DEAD_DEEP = ["#8C7D64", "#7C6E57", "#6E624E", "#A09278", "#4C4234"];
const recolor = (shapes: Shape[], from: string[], to: string[]): Shape[] =>
  shapes.map((sh) => {
    const i = from.findIndex((c) => c.toLowerCase() === sh.fill.toLowerCase());
    return i < 0 ? sh : { ...sh, fill: to[i] };
  });
/** two seeds per kind (skin, hair, a mirrored drawing) */
const SEEDS = [1, 4];
/** the baked height of a man (px); nearer figures are ~130-200 px, the far ones smaller (drawImage scales down) */
const BAKE_PX = 230;
const SHADOW = AIR.A.shadow;
/** the air the far figures fade into (the medium at the horizon's distance in a day scene) */
const AIR_FAR = rgbHex(airRamp("A", AIR.A.eyeT + 0.04));

const smooth = (a: number, b: number, x: number) => {
  const u = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return u * u * (3 - 2 * u);
};
/** the ground's own haze at a distance (rodentGround: lighter on the near map, converging on the air far off) */
const hazeOf = (dist: number, D: number) => {
  const h0 = 0.8 * smooth(1.6, 4.4, dist / D);
  return h0 + (1 - h0) * smooth(3.5, 14, dist / D);
};
/** the screen direction of west at a ground point: the side the fallers topple to */
const westSign = (cam: Cam, x: number, y: number) => {
  const a = toScreen(cam, x, 0, y);
  const b = toScreen(cam, x - cam.r[0] * 20, 0, y - cam.r[2] * 20);
  return b.x - a.x < 0 ? -1 : 1;
};
/** a sprite's silhouette in one colour (for the haze over it), made once per sprite */
const SIL = new Map<HTMLCanvasElement, HTMLCanvasElement>();
const silOf = (c: HTMLCanvasElement) => {
  const hit = SIL.get(c);
  if (hit) return hit;
  const s = document.createElement("canvas");
  s.width = c.width;
  s.height = c.height;
  const x = s.getContext("2d") as CanvasRenderingContext2D;
  x.drawImage(c, 0, 0);
  x.globalCompositeOperation = "source-in";
  x.fillStyle = AIR_FAR;
  x.fillRect(0, 0, s.width, s.height);
  SIL.set(c, s);
  return s;
};

const hsh = (n: number) => {
  const s = Math.sin(n * 91.7 + 3.1) * 43758.5453;
  return s - Math.floor(s);
};
/** THE CROWD, thinned (V3 take 2): of FIGURES, a spread subset in which no two figures overlap by more than a shoulder
 *  on any frame of the approach and the landing (an ellipse test in screen px scaled by their height), even in number;
 *  then rodentCamera's alternating pick re-done on the survivors in the order the front reaches them (pairs: the one
 *  with fewer fallen neighbours falls), so exactly half fall, spread evenly, at their own arrival frames */
export const CROWD: (Fig & { kind: number; cloth: number })[] = (() => {
  const frames = [150, 165, 180, 206].map((f) => camAt(f));
  const order = FIGURES.slice().sort((a, b) => hsh(a.i) - hsh(b.i));
  const keep: Fig[] = [];
  for (const q of order) {
    const ok = frames.every((c) => {
      const a = toScreen(c, q.x, 0, q.y);
      return keep.every((o) => {
        const b = toScreen(c, o.x, 0, o.y);
        const h = FIG_H * Math.max(a.s, b.s);
        const dx = (a.x - b.x) / (0.36 * h);
        const dy = (a.y - b.y) / (0.65 * h);
        return dx * dx + dy * dy >= 1;
      });
    });
    if (ok) keep.push(q);
  }
  keep.sort((a, b) => a.arrive - b.arrive);
  if (keep.length % 2) keep.pop();
  const out = keep.map((q) => {
    const r = hsh(q.i + 17);
    let acc = 0;
    let kind = KINDS.length - 1;
    for (let k = 0; k < KINDS.length; k++) {
      acc += KINDS[k].w;
      if (r < acc) {
        kind = k;
        break;
      }
    }
    return { ...q, falls: false, kind, cloth: Math.floor(hsh(q.i + 29) * CLOTH.length) };
  });
  for (let k = 0; k + 1 < out.length; k += 2) {
    const deadNear = (q: Fig) => out.filter((o) => o.falls && Math.hypot(o.x - q.x, o.y - q.y) < 340).length;
    const a = out[k];
    const b = out[k + 1];
    const da = deadNear(a);
    const db = deadNear(b);
    if (da < db || (da === db && (k / 2) % 2 === 0)) a.falls = true;
    else b.falls = true;
  }
  return out;
})();

export const RodentFigures: React.FC<{ cam: Cam; frame: number }> = ({ cam, frame }) => {
  const reqs = useMemo(
    () =>
      KINDS.flatMap((kd) =>
        SEEDS.flatMap((s) => [
          ...CLOTH.map((cl, ci) => {
            const r = crowdSpriteReq(kd.kind, "natural", s, BAKE_PX * kd.k);
            return { ...r, key: `${r.key}|cloth${ci}`, shapes: recolor(r.shapes, NATURAL, cl) };
          }),
          (() => {
            const r = crowdSpriteReq(kd.kind, "dead", s, BAKE_PX * kd.k);
            return { ...r, key: `${r.key}|deep`, shapes: recolor(r.shapes, DEAD_SRC, DEAD_DEEP) };
          })(),
        ]),
      ),
    [],
  );
  const get = useFolkSprites(reqs);
  const keyOf = (kind: number, seed: number, ink: "alive" | "dead", cloth = 0) => {
    const kd = KINDS[kind];
    const pre = `${kd.kind}|${ink === "alive" ? "natural" : "dead"}|${SEEDS[seed % SEEDS.length] % 8}|`;
    const suf = ink === "alive" ? `|cloth${cloth}` : "|deep";
    return reqs.find((r) => r.key.startsWith(pre) && r.key.endsWith(suf))?.key ?? "";
  };
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const vis = CROWD.map((q) => ({ q, s: toScreen(cam, q.x, 0, q.y) }))
      .filter(({ s }) => s.z > 10 && s.x > -120 && s.x < W + 120 && s.y > -60 && s.y < H + 260)
      .sort((a, b) => b.s.z - a.s.z);
    for (const { q, s } of vis) {
      const v = q.kind;
      const hPx = FIG_H * s.s * KINDS[v].k;
      if (hPx < 3) continue;
      const u = q.falls ? Math.max(0, Math.min(1, (frame - q.arrive - FALL.delay) / FALL.dur)) : 0;
      const dist = Math.hypot(q.x - cam.C[0], cam.C[1], q.y - cam.C[2]);
      const haze = hazeOf(dist, cam.D);
      const dir = westSign(cam, q.x, q.y) as 1 | -1;
      const fl = fall(u, dir);
      const lying = Math.abs(fl.rot) / 90;
      // how flat the ground is seen here (a lying body foreshortens with it)
      const fore = Math.max(0.12, Math.abs(toScreen(cam, q.x, 0, q.y - 10).y - toScreen(cam, q.x, 0, q.y + 10).y) / (20 * s.s));
      // the contact shadow: soft, in the medium's shadow colour; it stretches under a falling body
      const rx = hPx * (0.2 + 0.32 * lying);
      const ry = Math.max(1, hPx * (0.2 + 0.08 * lying) * fore);
      ctx.save();
      // a lying body gets a clearer, longer shadow under it (so the fallen read on the orange hatch)
      ctx.globalAlpha = (0.42 + 0.3 * lying) * (1 - haze);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
      g.addColorStop(0, SHADOW);
      g.addColorStop(1, "rgba(34,24,15,0)");
      ctx.translate(s.x + hPx * 0.06 + dir * hPx * 0.42 * lying, s.y + ry * 0.25);
      ctx.scale(rx, ry);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // the body: standing with an idle sway, or falling (crossfading to its DEAD sprite as it goes)
      const alive = get(keyOf(v, q.seed, "alive", q.cloth));
      const dead = get(keyOf(v, q.seed, "dead"));
      if (!alive || !dead) continue;
      const sw = q.falls && u > 0 ? { rot: 0, sy: 1 } : sway(frame, q.seed);
      const dT = Math.max(0, Math.min(1, (u - 0.1) / 0.6));
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.scale(1, 1 - 0.32 * lying * (1 - fore));
      const o = { rot: u > 0 ? fl.rot : sw.rot, pivot: u > 0 ? fl.pivot : ([0, 0] as [number, number]), sy: sw.sy };
      // the crossfade paints DEAD over the cream (same silhouette), so a falling body never turns see-through
      blit(ctx, alive.c, alive, hPx, { ...o, alpha: dT >= 0.999 ? 0 : 1 });
      blit(ctx, dead.c, dead, hPx, { ...o, alpha: dT });
      // the air over it by its distance
      if (haze > 0.01) blit(ctx, silOf(alive.c), alive, hPx, { ...o, alpha: Math.min(0.95, haze) });
      ctx.restore();
    }
  };
  return <FolkCanvas draw={draw} width={W} height={H} />;
};

type SpriteLike = { c: HTMLCanvasElement; ax: number; ay: number; px: number; unitsPerPx: number };
/** blitFolk's placement, for any canvas with a sprite's anchor (the haze silhouette shares its sprite's) */
const blit = (ctx: CanvasRenderingContext2D, img: HTMLCanvasElement, sp: SpriteLike, hPx: number, o: { alpha: number; rot: number; pivot: [number, number]; sy: number }) => {
  if (o.alpha <= 0.003) return;
  const f = hPx / sp.px;
  const ppx = (o.pivot[0] / sp.unitsPerPx) * f;
  const ppy = (o.pivot[1] / sp.unitsPerPx) * f;
  ctx.save();
  ctx.globalAlpha = o.alpha;
  ctx.translate(ppx, ppy);
  if (o.rot) ctx.rotate((o.rot * Math.PI) / 180);
  ctx.scale(1, o.sy);
  ctx.translate(-ppx, -ppy);
  ctx.drawImage(img, -sp.ax * f, -sp.ay * f, img.width * f, img.height * f);
  ctx.restore();
};
