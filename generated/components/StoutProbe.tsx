import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { CRESTS, type CrestId } from "./wolffLogos";
import { GEO, TILE_TOP, TYPE, Label, LightSweep, Numeral, Pillar, StoutNameTag, StoutStage, StoutWatchHere, amberBandFor, camFor, numeralWidth } from "./stoutShared";

// ---------------------------------------------------------------------------
// StoutProbe — measuring and test sheets for the stout system (not deliverables):
//   crests    each crest's raw markup fitted to a 480 px cell by its viewBox, black on
//             white, so its ink box can be measured (sets stoutShared's OPTICAL table)
//   specimen  the motion API at work, frozen: an odometer mid-roll with its vertical
//             motion blur, a Numeral and a Label mid-entrance, a LightSweep crossing an
//             amber body, a pillar lifting off the floor, and the kerning of "$1B",
//             "30%", "$6B", "20x", "$326M" at HERO size (proportional and tabular)
// ---------------------------------------------------------------------------
export const PROBE_IDS: CrestId[] = ["LAKERS", "WARRIORS", "KNICKS", "COWBOYS", "MANUTD", "REALMADRID"];
export const CELL = 480;
export const schema = z.object({ sheet: z.enum(["crests", "specimen", "motion"]) });
export const defaultProps = schema.parse({ sheet: "crests" });

const Crests: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#fff" }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {PROBE_IDS.map((id, i) => {
        const c = CRESTS[id]!;
        const [vx, vy, vw, vh] = c.viewBox.trim().split(/[\s,]+/).map(Number);
        const sc = CELL / Math.max(vw, vh);
        const x0 = 40 + (i % 2) * (CELL + 40);
        const y0 = 40 + Math.floor(i / 2) * (CELL + 40);
        return <g key={id} transform={`translate(${x0 - vx * sc} ${y0 - vy * sc}) scale(${sc})`} fill="#000" dangerouslySetInnerHTML={{ __html: c.markup }} />;
      })}
    </svg>
  </AbsoluteFill>
);

const Specimen: React.FC = () => {
  const k = 1.5625;
  const cam = camFor(GEO.X_NOW, GEO.FLOOR, 540, 1368, k);
  const W = (sx: number, sy: number) => ({ x: cam.x + (sx - 540) / k, y: cam.y + (sy - 960) / k });
  return (
    <StoutStage S={0} cam={cam} pool={{ x: GEO.X_NOW, y: TILE_TOP - 200 }} sway={false}>
      {/* kerning: HERO, proportional (static) and tabular (an odometer at rest) */}
      {["$1B", "30%", "$6B", "20×", "$326M"].map((t, i) => (
        <Numeral key={`p${t}`} {...W(60, 230 + i * 150)} k={k} px={TYPE.SECONDARY} text={t} tone="cream" anchor="start" />
      ))}
      {[1, 30, 6, 20, 326].map((v, i) => (
        <Numeral
          key={`t${v}`}
          {...W(1020, 230 + i * 150)}
          k={k}
          px={TYPE.SECONDARY}
          value={v}
          format={(n) => (i === 0 ? `$${n}B` : i === 1 ? `${n}%` : i === 2 ? `$${n}B` : i === 3 ? `${n}×` : `$${n}M`)}
          tone="creamLo"
          anchor="end"
        />
      ))}
      {/* an odometer mid-roll: 199.45 -> 200 rolls the three digits together, blurred */}
      <Numeral {...W(540, 1000)} k={k} px={TYPE.HERO} value={199.45} format={(n) => `$${n}M`} rollBlur={7} tone="cream" />
      {/* a Numeral and a Label half-way through the entrance */}
      <Numeral {...W(300, 1180)} k={k} px={TYPE.LABEL} text="$1B" enter={0.5} tone="cream" />
      <Label {...W(300, 1230)} k={k} text="revenue" enter={0.5} />
      {/* a pillar mid-lift, with a light sweep crossing its amber tower */}
      <Pillar x={GEO.X_NOW + 160} k={k} figure={{ kind: "mercedes" }} bar={280} accent lift={0.6} elevation="rest" dy={-30} amberBand={[W(0, 300).y, W(0, 1368).y]} />
      <LightSweep x={GEO.X_NOW + 160 - GEO.BAR / 2} y={TILE_TOP - 30 - 280} w={GEO.BAR} h={280} k={k} t={0.45} on="amber" />
      <Numeral {...W(840, 1180)} k={k} px={TYPE.LABEL} text={`w ${numeralWidth("$326M", TYPE.HERO).toFixed(0)}`} tone="creamLo" />
    </StoutStage>
  );
};

/** The motion props, frozen mid-way: pillars entering and dimming by tone, the overlays' entrances. */
const Motion: React.FC = () => {
  const k = 1.5625;
  const cam = camFor(GEO.X_NOW, GEO.FLOOR, 540, 1000, k);
  const band = amberBandFor(cam);
  return (
    <StoutStage S={0} cam={cam} pool={{ x: GEO.X_NOW, y: TILE_TOP - 100 }} sway={false}
      overlay={<><StoutNameTag name="Toto Wolff" job="CEO of Mercedes F1 team" frame={9} /><StoutWatchHere frame={16} /></>}
    >
      {[0, 0.25, 0.5, 0.75, 1].map((d, i) => (
        <Pillar key={i} x={GEO.X_NOW + (i - 2) * GEO.PITCH} k={k} figure={{ kind: "crest", id: "COWBOYS" }} bar={180} dim={d} enter={i === 4 ? 0.5 : 1} amberBand={band} />
      ))}
    </StoutStage>
  );
};

const StoutProbe: React.FC<z.infer<typeof schema>> = ({ sheet }) => (sheet === "crests" ? <Crests /> : sheet === "specimen" ? <Specimen /> : <Motion />);
export default StoutProbe;
