import {loadFont as loadLocalFont} from "@remotion/fonts";
import {staticFile} from "remotion";
export const fontFamily = "Barlow";
let loaded = false;
export const loadFont = () => {
 if (!loaded && typeof document !== "undefined") {
  loaded=true;
  for(const weight of [800,900]) loadLocalFont({family:fontFamily,url:staticFile(`mikkel-trailer/fonts/Barlow-${weight}.otf`),weight:String(weight)});
 }
 return {fontFamily};
};
