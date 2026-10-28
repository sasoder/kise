// PricingProbe — the shared world's probe still (never delivered): the OpenAI slot tile with the price tag standing
// in its slot (one union shadow), the prompt card, a hanging tag on a taut twine, a PhotoCutOut grade test (lit and
// dimmed), and macintoshShared's Bust beside CustomerBust at sour 0 and sour 1. All at k 1 (world = screen px).
import React from "react";
import { staticFile } from "remotion";
import { z } from "zod";
import { StoutStage } from "../kits/cheeky-pint/stoutShared";
import {
  Bust,
  CROWD,
  CUT11_WORLD,
  CrowdShadow,
  CustomerBust,
  OpenAISlotTile,
  PhotoCutOut,
  PriceTag,
  PromptCard,
  TAG,
  TILE,
  priceTagSil,
  slotGeom,
} from "./pricingShared";

export const FPS = 24000 / 1001;
export const DURATION = 1;
/** `bustTest` renders ONE bust alone at the same place (the sour-0 pixel test: "bust" vs "customer"). */
export const schema = z.object({ bustTest: z.enum(["none", "bust", "customer"]) });
export const defaultProps = schema.parse({ bustTest: "none" });

const CAM = { x: 540, y: 960, k: 1 };
const G = slotGeom(CUT11_WORLD.x, CUT11_WORLD.floor, TILE.size);
const STAND = { x: G.x, y: G.top, anchor: "foot" as const, angle: 0, k: 1, string: "limp" as const, stringSwing: 0 };
const HOOK = { x: 935, y: 120 };
const R = 70;
const busts = [
  { x: 150, y: 1700, spec: CROWD[2] },
  { x: 390, y: 1700, spec: CROWD[2] },
  { x: 660, y: 1700, spec: CROWD[2] },
  { x: 900, y: 1700, spec: CROWD[1] },
];
const PLANE = "zach-kelly-johnson/C/cutout_c130b_side_facing-left.png";

const BustTest: React.FC<{ which: "bust" | "customer" }> = ({ which }) => (
  <StoutStage S={0} cam={CAM} rest={CAM} pool={{ x: 540, y: 900 }} sway={false}>
    <CrowdShadow busts={[{ x: 540, y: 900, r: 160, facing: 1, bodyLen: 300 }]} />
    {which === "bust" ? (
      <Bust x={540} y={900} r={160} spec={CROWD[0]} facing={1} bodyLen={300} pose={{ smile: 0.4, tilt: 3, blink: 0.2 }} />
    ) : (
      <CustomerBust x={540} y={900} r={160} spec={CROWD[0]} facing={1} bodyLen={300} pose={{ smile: 0.4, tilt: 3, blink: 0.2, sour: 0 }} />
    )}
  </StoutStage>
);

const PricingProbe: React.FC<z.infer<typeof schema>> = ({ bustTest }) =>
  bustTest !== "none" ? <BustTest which={bustTest} /> : (
  <StoutStage S={0} cam={CAM} rest={CAM} pool={{ x: 540, y: 900 }} sway={false}>
    <PromptCard x={250} y={200} k={1} />
    <PhotoCutOut src={staticFile(PLANE)} x={200} floor={470} h={110} aspect={1607 / 623} k={1} />
    <PhotoCutOut src={staticFile(PLANE)} x={200} floor={620} h={110} aspect={1607 / 623} k={1} dim={1} />
    <PriceTag x={HOOK.x} y={HOOK.y + 90} anchor="hole" k={1} h={260} string={{ to: HOOK }} angle={4} />
    {/* the tag standing in the tile's slot: one object, one shadow */}
    <OpenAISlotTile x={G.x} floor={G.floor} k={1} extraSil={priceTagSil(STAND)} occupant={TAG.w}>
      <PriceTag {...STAND} shadow={false} />
    </OpenAISlotTile>
    <CrowdShadow busts={busts.map((b) => ({ x: b.x, y: b.y, r: R, facing: b.spec.facing, bodyLen: 300 }))} />
    <Bust x={busts[0].x} y={busts[0].y} r={R} spec={busts[0].spec} bodyLen={300} />
    <CustomerBust x={busts[1].x} y={busts[1].y} r={R} spec={busts[1].spec} bodyLen={300} />
    <CustomerBust x={busts[2].x} y={busts[2].y} r={R} spec={busts[2].spec} bodyLen={300} pose={{ sour: 1 }} />
    <CustomerBust x={busts[3].x} y={busts[3].y} r={R} spec={busts[3].spec} bodyLen={300} pose={{ sour: 1 }} />
  </StoutStage>
);
export default PricingProbe;
