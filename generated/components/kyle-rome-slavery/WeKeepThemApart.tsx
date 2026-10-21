// ---------------------------------------------------------------------------
// WeKeepThemApart (kyle-rome-slavery, cut 20). Dwarkesh map style (styles/dwarkesh-map.md), the 3D DEPTH manner of
// Kyle London (londonDepth, read only). Opaque 1080x1920, 29.97 fps, 211 frames.
// The world (stage, figures, camera track, end state) is ./marketWorkshopWorld.tsx, shared with cut D.
//
// CHECK LINE: "We picture slavery and a thriving, productive economy as two different worlds that pull apart."
//
// THE LINE: "(I think because we think we) know slavery is bad and we think progress and economic growth and
// innovation is good. We tend to think that those things don't go together."
// WORD -> FRAME: know 1 · slavery 5 · is 12 · bad 15 · and 23 · we 34 · think 38 · progress 42 · and 56 ·
// economic 74 · growth 81 · and 99 · innovation 107 · is 113 · good 122 · We 133 · tend 138 · to 143 · think 147 ·
// that 153 · those 157 · things 162 · don't 170 · go 186 · together 191 · (cut to the speaker at f211)
// DURATION: the slot 20.087 -> 27.127 s = 7.040 s x 29.97 = 211 frames (f0..f210).
//
// THE MOTION: one stage of stone flags in one-point perspective, one camera in three phases. f0-34: close on a slave
// standing bowed on a Roman sale platform (the catasta: chalked feet, a blank titulus at his neck, the dealer beside
// him presenting him with an open hand, a buyer in a toga looking up from beside the platform, a fettered slave
// waiting behind), the sale lit flat and cold, sunk toward DEAD; the camera already easing back. f0-132: one
// pull-back and drift right brings in, beside the platform, a thriving red-gloss pottery, the LIT half of the stage
// (warm floor, in-play cream potters at their wheels in the back rows, the front row of stools empty, a domed kiln
// glowing cream), its ORANGE bowls stacking up on the rack through "progress ... innovation is good". f131-142
// ("We"): a straight seam cracks along the stage's centre line, front to back; f137-189 the two halves slide apart
// on the floor plane as two blocks (their faces sinking into the page below, the inner cut faces lit / shaded), an
// empty dark void opening between them, the camera widening a touch in one lobe; landed on "together" (f191).
// Then alive to f210: the bowls still stacking, the wheels turning, the slave still bowed.
// CAUSE BEFORE EFFECT: the crack runs before the slide (contact f131, first movement of the halves f138).
// Orange = productive output (the bowls); people are cream; the sale's tones sink toward DEAD.
//
// SOURCES (illustrative; nothing on screen): slave sales on a raised platform (catasta) with a label (titulus) at
// the neck; chalked feet for imported slaves (Pliny, Natural History 35.199). Arretine terra sigillata workshops
// (Arezzo, 1st c. BC - 1st c. AD): stamps name the workshop owner and often the enslaved potter (Perennius and his
// potter Tigranes; Ateius and his slaves).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { TexcocoPage, WorldSvg } from "../kits/maps/texcocoShared";
import { MarketWorkshopStage, C_END, cutCCamAt, cutCSeam, cutCSplit, cutCStack } from "./marketWorkshopWorld";

export const FPS = 30000 / 1001;
export const DURATION = 211;
if (C_END.frame !== DURATION - 1) throw new Error("C_END must be this cut's last frame");
export const schema = z.object({});
export const defaultProps = schema.parse({});

const WeKeepThemApart: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = cutCCamAt(f);
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <MarketWorkshopStage cam={cam} frame={f} split={cutCSplit(f)} seam={cutCSeam(f)} stack={cutCStack(f)} uid="wk" />
      </WorldSvg>
    </TexcocoPage>
  );
};

export default WeKeepThemApart;
