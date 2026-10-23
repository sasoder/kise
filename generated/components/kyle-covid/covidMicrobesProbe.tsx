// ---------------------------------------------------------------------------
// covidMicrobesProbe (kyle-covid): the probe sheets of the clip's microbes module (covidMicrobes.tsx), one sheet per
// frame, in the micro medium (AirStage, palette A, mood micro; frame 6 at night). Not a cut.
//   f0  bodies A: sphere, rod, bean, comma, corkscrew, virion: cream 200 / 60 / 20 px, DEAD 60, orange 200 / 60 / 20
//   f1  bodies B: tailed rod, hairy rod, bulb rod, spiky sphere, twisty, a mutated oddball
//   f2  a rod dividing, every frame of a 24-frame division (left to right, top to bottom)
//   f3  a sphere (12 frames) and a comma (12 frames) dividing
//   f4  genomes interpolating: rod -> corkscrew -> bean -> virion (12 steps each row)
//   f5  the swarm (baked sprites, 8-40 px, fog by depth) in the micro medium
//   f6  the swarm at night (mood night, a lamp at the upper left)
//   f7  a hero rod at 240 px, wobbling, every 3rd frame of 36 (the tumble and the roll), and the orange spread
//   f8  a rod's division at 700 px (t 0.36 / 0.42 / 0.47: the waist just before, at and after the split)
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, makeAirView, rgbHex, type AirScene } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  GENOMES,
  MicrobeCanvas,
  SWARM_KINDS,
  bakeSwarm,
  blitSwarm,
  divisionShapes,
  drawMicrobe,
  inkOf,
  mixGenome,
  mutate,
  shapeOf,
  span,
  wobble,
  type Genome,
  type Look,
} from "./covidMicrobes";

export const FPS = 30000 / 1001;
export const DURATION = 9;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const SCENE: AirScene = { look: "A", mood: "micro", F: 1400, fogNear: 12, fogVis: 70, fogMax: 0.97, hLow: 0, hHigh: 24, moteUnit: 3 };

const label = (ctx: CanvasRenderingContext2D, t: string, x: number, y: number) => {
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "#F3EBDD";
  ctx.font = "20px sans-serif";
  ctx.fillText(t, x, y);
  ctx.globalAlpha = 1;
};
const at = (ctx: CanvasRenderingContext2D, g: Genome, x: number, y: number, spanPx: number, look: Look, frame = 0, rot?: { yaw: number; pitch: number; roll: number }) => {
  const px = spanPx / span(g);
  const w = wobble(frame, g.seed, 0.4);
  const r = rot ?? { yaw: -0.35, pitch: 0.2, roll: 0.15 };
  drawMicrobe(ctx, [{ s: shapeOf(g, r, w.wave), x, y }], px, inkOf({ ...look, tone: (look.tone ?? 0) + g.tone }));
};

const bodiesSheet = (ctx: CanvasRenderingContext2D, rows: [string, Genome][]) => {
  const cols: { x: number; s: number; look: Look; name: string }[] = [
    { x: 150, s: 200, look: {}, name: "cream 200" },
    { x: 330, s: 60, look: {}, name: "60" },
    { x: 415, s: 20, look: {}, name: "20" },
    { x: 500, s: 60, look: { drain: 1 }, name: "dead 60" },
    { x: 700, s: 200, look: { orange: 1 }, name: "orange 200" },
    { x: 880, s: 60, look: { orange: 1 }, name: "60" },
    { x: 965, s: 20, look: { orange: 1 }, name: "20" },
  ];
  cols.forEach((c) => label(ctx, c.name, c.x - 40, 80));
  rows.forEach(([name, g], i) => {
    const y = 250 + i * 280;
    label(ctx, name, 20, y - 120);
    cols.forEach((c) => at(ctx, g, c.x, y, c.s, c.look));
  });
};

const divideSheet = (ctx: CanvasRenderingContext2D, items: { g: Genome; n: number; y0: number }[]) => {
  items.forEach(({ g, n, y0 }) => {
    const gA = mutate(g, 11, 0.5, "bend");
    const gB = mutate(g, 23, 0.6, "spikes");
    const spanPx = 150;
    const px = spanPx / span(g);
    for (let k = 0; k < n; k++) {
      const t = k / (n - 1);
      const col = k % 4;
      const row = Math.floor(k / 4);
      const cx = 140 + col * 265;
      const cy = y0 + row * 270;
      const rot = { yaw: -0.25, pitch: 0.35, roll: 0.1 };
      const d = divisionShapes(g, gA, gB, rot, rot, { ...rot, yaw: rot.yaw + 0.3 }, k * 0.21, t, 1.3);
      drawMicrobe(
        ctx,
        [
          { s: d.a, x: cx + d.oa[0] * px, y: cy + d.oa[1] * px },
          { s: d.b, x: cx + d.ob[0] * px, y: cy + d.ob[1] * px },
        ],
        px,
        inkOf({}),
        { whole: d.whole },
      );
      label(ctx, `f${k}`, cx - 120, cy - 100);
    }
  });
};

const morphSheet = (ctx: CanvasRenderingContext2D) => {
  const rows: [Genome, Genome][] = [
    [GENOMES.rod, GENOMES.corkscrew],
    [GENOMES.corkscrew, GENOMES.bean],
    [GENOMES.bean, GENOMES.comma],
    [GENOMES.comma, GENOMES.spikySphere],
    [GENOMES.spikySphere, GENOMES.virion],
  ];
  rows.forEach(([a, b], i) => {
    for (let k = 0; k < 12; k++) {
      const t = k / 11;
      const g = mixGenome(a, b, t);
      const col = k % 6;
      const row = Math.floor(k / 6);
      const cx = 100 + col * 176;
      const cy = 150 + i * 360 + row * 170;
      const px = 130 / Math.max(span(a), span(b));
      drawMicrobe(ctx, [{ s: shapeOf(g, { yaw: -0.3, pitch: 0.25, roll: 0.4 }, 0), x: cx, y: cy }], px, inkOf({ orange: i === 4 ? t : 0 }));
    }
  });
};

const swarmSheet = (ctx: CanvasRenderingContext2D, frame: number, night: boolean, airAt: (sy: number) => string) => {
  const sw = bakeSwarm({ key: "probe", span: 56 });
  // a field of 520 in depth: far ones small and fogged, near ones up to 40 px
  const items: { x: number; y: number; d: number; k: number; yaw: number; seed: number }[] = [];
  let s = 7;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
  for (let i = 0; i < 520; i++) items.push({ x: rnd() * 1080, y: 120 + rnd() * 1700, d: Math.pow(rnd(), 1.6), k: Math.floor(rnd() * SWARM_KINDS.length), yaw: rnd() * 6.28, seed: rnd() * 100 });
  items.sort((a, b) => b.d - a.d);
  items.forEach((m) => {
    const size = 8 + 32 * (1 - m.d);
    blitSwarm(ctx, sw, m.k, m.x, m.y, size, { yaw: m.yaw + frame * 0.02, wave: frame * 0.21 + m.seed, fog: 0.85 * m.d * (night ? 1 : 0.9), air: airAt(m.y) });
  });
  label(ctx, night ? "swarm at night (mood night)" : "swarm, 8-40 px, fog by depth (micro)", 30, 60);
};

const wobbleSheet = (ctx: CanvasRenderingContext2D) => {
  const g = { ...GENOMES.hairyRod, len: 1.4, girth: 0.5, pili: 0.7 };
  for (let k = 0; k < 12; k++) {
    const f = k * 3;
    const col = k % 3;
    const row = Math.floor(k / 3);
    const cx = 190 + col * 350;
    const cy = 170 + row * 330;
    const w = wobble(f, 1.3);
    const px = 240 / span(g);
    drawMicrobe(ctx, [{ s: shapeOf(g, { yaw: -0.3 + w.yaw, pitch: w.pitch, roll: w.roll }, w.wave), x: cx, y: cy }], px, inkOf({}));
    label(ctx, `f${f}`, cx - 160, cy - 120);
  }
  // the orange spread from a contact point (the virion turning)
  const v = mixGenome(GENOMES.spikySphere, GENOMES.virion, 0.6);
  for (let k = 0; k < 6; k++) {
    const cx = 100 + k * 176;
    const cy = 1650;
    const px = 140 / span(v);
    const r = 15 + k * 32;
    drawMicrobe(ctx, [{ s: shapeOf(v, { yaw: 0, pitch: 0.2, roll: 0.3 }, 0), x: cx, y: cy }], px, inkOf({}), { orangeSpread: { x: cx, y: cy - 70, r } });
  }
  label(ctx, "orangeSpread from the top contact point", 30, 1530);
};

const debugSheet = (ctx: CanvasRenderingContext2D) => {
  const g = GENOMES.rod;
  const gA = mutate(g, 11, 0.5, "bend");
  const gB = mutate(g, 23, 0.6, "spikes");
  const rot = { yaw: -0.25, pitch: 0.35, roll: 0.1 };
  [0.36, 0.42, 0.47].forEach((t, i) => {
    const px = 700 / span(g);
    const cx = 540;
    const cy = 300 + i * 560;
    const d = divisionShapes(g, gA, gB, rot, rot, { ...rot, yaw: rot.yaw + 0.3 }, 0, t, 1.3);
    drawMicrobe(ctx, [{ s: d.a, x: cx + d.oa[0] * px, y: cy + d.oa[1] * px }, { s: d.b, x: cx + d.ob[0] * px, y: cy + d.ob[1] * px }], px, inkOf({}), { whole: d.whole });
  });
};
const ProbeWorld: React.FC<{ frame: number }> = ({ frame }) => {
  const night = frame === 6;
  const v = makeAirView({ scene: { ...SCENE, mood: night ? "night" : "micro" }, frame: 0, horizon: 760 });
  const airAt = (sy: number) => rgbHex(v.airAtScreen(sy));
  return (
    <AirStage v={v} bloom={0.22} lamp={night ? { x: 120, y: 120, angle: 1.1, spread: 0.5, reach: 1800 } : undefined}>
      <MicrobeCanvas
        draw={(ctx) => {
          if (frame === 0)
            bodiesSheet(ctx, [
              ["sphere", GENOMES.sphere],
              ["rod", GENOMES.rod],
              ["bean", GENOMES.bean],
              ["comma", GENOMES.comma],
              ["corkscrew", GENOMES.corkscrew],
              ["virion", GENOMES.virion],
            ]);
          else if (frame === 1)
            bodiesSheet(ctx, [
              ["tailed rod", GENOMES.tailedRod],
              ["hairy rod", GENOMES.hairyRod],
              ["bulb rod", GENOMES.bulbRod],
              ["spiky sphere", GENOMES.spikySphere],
              ["twisty", GENOMES.twisty],
              ["oddball (mutated x4)", mutate(mutate(mutate(mutate(GENOMES.rod, 3, 0.8, "coil"), 5, 0.7, "bulb"), 9, 0.7, "spikes"), 13, 0.6, "tail")],
            ]);
          else if (frame === 2) divideSheet(ctx, [{ g: GENOMES.rod, n: 24, y0: 150 }]);
          else if (frame === 3)
            divideSheet(ctx, [
              { g: GENOMES.sphere, n: 12, y0: 150 },
              { g: { ...GENOMES.comma, tail: 0.8 }, n: 12, y0: 990 },
            ]);
          else if (frame === 4) morphSheet(ctx);
          else if (frame === 5 || frame === 6) swarmSheet(ctx, frame, night, airAt);
          else if (frame === 7) wobbleSheet(ctx);
          else debugSheet(ctx);
        }}
      />
    </AirStage>
  );
};

const CovidMicrobesProbe: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  return <ProbeWorld frame={frame} />;
};
export default CovidMicrobesProbe;
