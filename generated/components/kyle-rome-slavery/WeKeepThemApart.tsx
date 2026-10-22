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
// THE MOTION (Revision 1, the camera keyed on the words): one stage of stone flags in one-point perspective.
// f0-~28 CLOSE on the sale ("slavery is bad"): the slave standing bowed at the front of a Roman sale platform (the
// catasta: chalked feet, a blank titulus at his neck), the dealer beside him presenting him with an open hand, the
// buyer in a toga below looking up, a fettered slave waiting behind; cold and sunk toward DEAD; a slow push keeps it
// alive. f24-80 ("and we think progress ... economic"): one sideways pan at the same close zoom over the seam onto the
// LIT half: a red-gloss pottery (warm floor, potters at their wheels in the back rows, the front row of stools empty,
// a domed kiln glowing cream, a rack whose ORANGE bowls stack up). f66-150: a slow drift along the rows while the
// bowls keep stacking ("growth ... innovation is good"). f133-194 ("We tend to think"): one zoom-out to the wide of
// both halves; the seam cracks along the centre line f146-156 and the halves slide apart f152-189 as two blocks with
// an empty dark void between, landed on "together" (f191). Then alive to f210.
// CAUSE BEFORE EFFECT: the crack runs before the slide (crack from f146, first movement of the halves f153).
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
import { AirStage } from "../kyle-pandemics/pandemicAir";
import { AIR_BLOOM, MarketWorkshopStage, C_END, cutCCamAt, cutCSeam, cutCSplit, cutCStack, worldAirAt } from "./marketWorkshopWorld";

export const FPS = 30000 / 1001;
export const DURATION = 211;
if (C_END.frame !== DURATION - 1) throw new Error("C_END must be this cut's last frame");
/** V3: "A" = the world inside the pandemics clip's medium (pandemicAir palette A, mood day; ./marketWorkshopAir);
 *  "old" = the delivered V2 picture on the paper page */
export const schema = z.object({ look: z.enum(["old", "A"]).default("A") });
export const defaultProps = schema.parse({});

const WeKeepThemApart: React.FC<z.infer<typeof schema>> = ({ look }) => {
  const f = useCurrentFrame();
  const cam = cutCCamAt(f);
  if (look === "A") {
    const air = worldAirAt(cam, f);
    return (
      <AirStage v={air.v} bloom={AIR_BLOOM}>
        <WorldSvg cam={cam}>
          <MarketWorkshopStage cam={cam} frame={f} split={cutCSplit(f)} seam={cutCSeam(f)} stack={cutCStack(f)} uid="wk" air={air} />
        </WorldSvg>
      </AirStage>
    );
  }
  return (
    <TexcocoPage cam={cam}>
      <WorldSvg cam={cam}>
        <MarketWorkshopStage cam={cam} frame={f} split={cutCSplit(f)} seam={cutCSeam(f)} stack={cutCStack(f)} uid="wk" />
      </WorldSvg>
    </TexcocoPage>
  );
};

export default WeKeepThemApart;
