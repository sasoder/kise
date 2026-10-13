import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "./outgrowShared";
import { COLOR, LightSweep, StoutStage, amberBandFor, clamp01, lerp, smoothstep } from "./stoutShared";
import { PEG, PegShadows, PersonPeg, SEAT, TeamTile, teamTileLayout, type Seat } from "./talentShared";

// ---------------------------------------------------------------------------
// TalentDensity — cut 1 of the Cheeky Pint S4E03 (Meta / MSL) clip "Talent density beat team size",
// in the stout system (stoutShared.tsx) with the clip's vocabulary (talentShared.tsx).
// 1080x1920, 23.976 fps, opaque, palette B1. No text, no numerals.
//
// CHECK LINE (what the viewer can say after this cut): "A few standout people packed tightly together
// are what counts, not a big crowd."
//
// THE LINE (Mark Zuckerberg): "[you] don't need a lot of people, and talent density is the thing that
// matters."
// DURATION: slot = round(2.628 x 23.976) = 63 frames, + a 12-frame living tail = 75. The editor trims to
// 63; everything has landed by f 56.
// ONSETS (f): don't 2 · need 8 · a lot 12 · people 17 · and 23 · talent 26 · density 32 · is 40 ·
// the thing 47 · matters 53.
//
// ONE MOTION: a wide field of kraft people sinks into the board in one wave travelling out from the
// centre while the camera pushes in; the six amber people scattered among them lift out of their slots,
// travel in on gentle arcs and drop into the six slots of the small cream tile at the centre, shoulder
// to shoulder; one light sweep crosses the packed tile on "matters". The push never stops.
//
//   f 0       settled: ~40 kraft + 6 amber pegs on an even brick grid (pegs ~105 px tall on screen), the
//             empty 3x2 tile at the centre; the camera already creeping in
//   f 2-25    the kraft crowd sinks into its slots, centre first (10 f each), and loses the light by
//             tone: it STAYS as a wide, spread-out field of dark low heads (down and out, never gone)
//   f 19-26   the six amber pegs lift one level, far ones first
//   f 21-39   they travel in above the card (far ones leave first) and hover over their slots
//   f 39-47   they are set down into the slots in slot order, one clean wave; a soft contact occlusion
//             at each foot
//   f 53-63   THE ONE CLICK: the light sweep crosses the packed tile
//   f 63-74   tail: the slow push continues (tile ~66 % of the width at f 56), the pool rests on the pack;
//             the bright tight pack inside the dim spread field is the picture
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const SLOT_FRAMES = 63;
export const DURATION = SLOT_FRAMES + 12;

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the world: centred on the tile ------------------------------------------------------------------
const CX = 540;
const CY = 960;
const TILE = teamTileLayout({ x: CX, y: CY, cols: 3, rows: 2, peg: PEG.S });
/** The crowd's brick grid: cell pitch (world px); a cell's peg stands with its feet PEG.S / 2 below the cell centre. */
const GRID = { px: 150, py: 165 } as const;
/** The picked: their cells (dx, dy from the centre) and the tile slot each one goes to. */
const PICKED: { dx: number; dy: number; slot: number }[] = [
  { dx: -150, dy: -330, slot: 0 },
  { dx: 75, dy: -495, slot: 1 },
  { dx: 225, dy: -165, slot: 2 },
  { dx: -225, dy: 165, slot: 3 },
  { dx: -75, dy: 495, slot: 4 },
  { dx: 150, dy: 330, slot: 5 },
];
type Cell = { x: number; y: number; d: number };
const CROWD: Cell[] = (() => {
  const out: Cell[] = [];
  for (let r = -6; r <= 6; r++) {
    const odd = Math.abs(r) % 2 === 1;
    for (let c = -5; c <= 5; c++) {
      const dx = (c + (odd ? 0.5 : 0)) * GRID.px;
      const dy = r * GRID.py;
      if (Math.abs(dx) > 640) continue;
      // the tile's clearing, and the cells of the picked
      if (Math.abs(dx) < TILE.w / 2 + PEG.S / 2 + 20 && Math.abs(dy) < TILE.h / 2 + PEG.S / 2 + 20) continue;
      if (PICKED.some((p) => Math.abs(p.dx - dx) < 1 && Math.abs(p.dy - dy) < 1)) continue;
      out.push({ x: CX + dx, y: CY + dy + PEG.S / 2, d: Math.hypot(dx, dy) });
    }
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
})();

// --- timing ------------------------------------------------------------------------------------------
const WAVE = { f0: 2, span: 13, each: 10, reach: 780 } as const; // the sink wave: start = f0 + span x d / reach
/** Where the crowd ends up: down in its slots to the crown of the head, its tone most of the way to the ground's. */
const DOWN = { sink: 0.66, shade: 0.72 } as const;
const HOVER0 = 39; // the first set-down starts; then one every LAND_STEP frames, in slot order
const LAND_STEP = 1.1;
const SET_F = 4; // frames a set-down takes
const HOVER_H = 12; // how high above its slot a peg hovers (world px)
const SWEEP: [number, number] = [53, 63];
const K_START = 1.45; // a crowd peg ~105 px tall on screen at f 0
const K_END = (0.68 * 1080) / TILE.w; // the packed tile ~66 % of the frame's width at f 56, ~68 % at the end

/** The camera: one push that never stops (a smooth main move + a constant creep), centred on the tile. The
 *  main move is late, with the picked coming in: the far ones stay in frame until they have left. */
const camAt = (f: number): Cam => {
  const c = 0.0016;
  const p = (Math.pow(smoothstep((f + 4) / 62), 1.35) + c * f) / (1 + c * (DURATION - 1));
  return { x: CX, y: CY, k: Math.exp(lerp(Math.log(K_START), Math.log(K_END), p)) };
};

/** A picked peg at frame f: where its feet are, how far it is lifted, how deep it is seated. */
const FLIGHTS = PICKED.map((p) => {
  const from = { x: CX + p.dx, y: CY + p.dy + PEG.S / 2 };
  const to = TILE.slots[p.slot];
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const set = HOVER0 + p.slot * LAND_STEP; // its set-down starts
  const arrive = set - 1; // over its slot one frame before
  const dur = 11 + dist / 62; // far ones take longer and leave first
  return { from, to, dist, set, land: set + SET_F, t0: arrive - dur, arrive, slot: p.slot };
});
const flightAt = (i: number, f: number) => {
  const F = FLIGHTS[i];
  // the lift out of the slot (5 f, ending as the travel starts) and the set-down into the tile's slot
  const up = smoothstep((f - (F.t0 - 3)) / 5);
  const down = smoothstep((f - F.set) / SET_F);
  const u = clamp01((f - F.t0) / (F.arrive - F.t0));
  // rest to rest, a touch flatter than a smoothstep (lower top speed)
  const e = lerp(smoothstep(u), u, 0.25 * Math.sin(Math.PI * u));
  // a gentle arc: bowed to one side of the straight line, the same hand for all six
  const bow = 0.09 * F.dist * Math.sin(Math.PI * e);
  const nx = -(F.to.y - F.from.y) / F.dist;
  const ny = (F.to.x - F.from.x) / F.dist;
  return {
    x: lerp(F.from.x, F.to.x, e) + nx * bow,
    // lifted: 5 px off its slot at first, HOVER_H above the card's slot at the end, then set down
    y: lerp(F.from.y, F.to.y, e) + ny * bow - lerp(5, HOVER_H, e) * up * (1 - down),
    lift: up * (1 - down),
    sink: SEAT * down,
    down,
    landed: f >= F.land,
    left: f > F.t0 - 3,
  };
};

const TalentDensity: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const k = cam.k;
  const band = amberBandFor(cam);
  const crowd = CROWD.map((c) => {
    const u = (frame - (WAVE.f0 + (WAVE.span * c.d) / WAVE.reach)) / WAVE.each;
    return { ...c, sink: DOWN.sink * smoothstep(u), shade: DOWN.shade * smoothstep(u * 1.25) };
  });
  const flights = FLIGHTS.map((_, i) => flightAt(i, frame));
  const seated: Seat[] = TILE.slots.map((_, s) => {
    const i = FLIGHTS.findIndex((F) => F.slot === s);
    return flights[i].landed ? "amber" : null;
  });
  const settle = smoothstep((frame - 24) / 24);
  return (
    <AbsoluteFill>
      <StoutStage S={frame} cam={cam} rest={camAt(0)} pool={{ x: CX, y: CY - 10, strength: lerp(1, 1.7, settle) }}>
        {/* the crowd: one shadow, then each person in their slot */}
        <PegShadows pegs={crowd} />
        {crowd.map((c, i) => (
          <PersonPeg key={i} x={c.x} y={c.y} k={k} tone="kraft" sink={c.sink} shade={c.shade} shadow={false} slot="ground" />
        ))}
        {/* the slots the picked leave behind */}
        {FLIGHTS.map((F, i) => (flights[i].left ? <PersonPeg key={i} x={F.from.x} y={F.from.y} k={k} sink={1} slot="ground" /> : null))}
        {/* the team tile and whoever has landed in it */}
        <TeamTile x={CX} y={CY} cols={3} rows={2} peg={PEG.S} k={k} seated={seated} amberBand={band} />
        {/* a little body on the cream: a soft contact occlusion under each foot as it is set down */}
        <defs>
          <clipPath id="td-foot">
            <rect x={TILE.x0} y={TILE.y0} width={TILE.w} height={TILE.h} />
          </clipPath>
        </defs>
        <g clipPath="url(#td-foot)" fill={COLOR.shadow} style={{ filter: "blur(2.6px)" }}>
          {FLIGHTS.map((F, i) =>
            flights[i].down > 0.01 ? (
              <ellipse key={i} cx={F.to.x + 1.5} cy={F.to.y + 3.2} rx={PEG.S * 0.47} ry={3.4} opacity={0.34 * flights[i].down} />
            ) : null,
          )}
        </g>
        {/* the picked: standing in the field, then lifted and on their way (the later slots on top) */}
        {FLIGHTS.map((F, i) => {
          const s = flights[i];
          if (s.landed) return null;
          return (
            <PersonPeg
              key={i}
              x={s.x}
              y={s.y}
              k={k}
              tone="amber"
              lift={s.lift}
              sink={s.sink}
              shadowStrength={1 - s.down}
              slot={s.left ? null : "ground"}
              amberBand={band}
            />
          );
        })}
        <LightSweep x={TILE.x0} y={TILE.y0} w={TILE.w} h={TILE.h} k={k} t={(frame - SWEEP[0]) / (SWEEP[1] - SWEEP[0])} on="amber" />
      </StoutStage>
    </AbsoluteFill>
  );
};

export default TalentDensity;
