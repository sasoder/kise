// NewsCardAimNamanPortrait — the approved AIM article, recomposed as one portrait news sheet.
// CHECK: the teenager Shruti met is now in the press building delivery drones.
// LINE: "Naman at 16 sounded ... like he just came out as this fully formed person."
// WORD -> SOURCE FRAME: Naman-4; at8; 16=24; sounded36; it58; was67; like72; hatched82;
// egg99; something107; came128; fully143; formed149; person157; end~170.
// DURATION:179 frames at24000/1001. The latest vertical timeline keeps the same source24–88 trim.
// MOTION: already resolved article, one continuous 2.5% push; the orange age highlight wipes atf24–36.
// The headline is reset above a full uncropped aircraft photo, rather than shrinking the two-column wide card.
// All article content stays within x90–990,y300–1070 across every camera state; captions are below the sheet.
// SOURCE: Analytics India Magazine,11Oct2025,Sanjana Gupta; the exact approved headline and Airbound photo
// from ../shruti-trailer/NewsCardAimNaman.tsx. The existing shared source records article URL/licence/font fallback.
// No new facts. CHAIN: India's outliers; the static crown and age highlight retain the approved meaning.
import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/fonts";
import { ChainEcho, CROWN_STEP, INK, ORANGE, SHADOW, SHADOW_OFF, fontFamily, type } from "../kits/core-memory/cerroShared";
import { defaultProps as approved, textWidth, highlightAt } from "../shruti-trailer/NewsCardAimNaman";
import { PortraitFilmLife, TallPaper } from "./ShrutiPortraitShared";

export const FPS = 24000 / 1001;
export const DURATION = 179;
export const schema = z.object({});
export const defaultProps = schema.parse({});
const RUPEE_FAMILY = "ShrutiPortraitRupee";
loadFont({ family: RUPEE_FAMILY, url: staticFile("shruti-trailer/fonts/Roboto-Black.ttf"), weight: "900", unicodeRange: "U+20B9" });
export const LINES = ["This 20-Year-Old Is Building", "Drones to Bring Delivery", "Costs Down to Just ₹1"];
if (LINES.join(" ").toLowerCase() !== approved.headlineA.join(" ").toLowerCase()) throw new Error("Portrait headline differs from approved article");
export const SW = 840;
export const SH = 704;
export const TURN = -0.7;
export const camAt = (f: number) => {
  const t = Math.min(1,Math.max(0,f/178));
  const g = 0.3*t+0.7*(0.5-0.5*Math.cos(Math.PI*t));
  return { x:540-2*g,y:697-g,k:1+0.025*g };
};
const SIZE=46;
const LEAD=50;
const CAP_TOP=82;
const LEFT=26;
const PHOTO={x:70,y:266,w:700,h:393.75};
const PHOTO_SRC="shruti-trailer/newscard_aim_naman_photo_1920.jpg";
const NewsCardAimNamanPortrait: React.FC<z.infer<typeof schema>> = () => {
  const frame=useCurrentFrame();
  const cam=camAt(frame);
  const hl=highlightAt(frame,24,12);
  const hx=LEFT-SIZE*0.04+textWidth("This ",SIZE)-SIZE*.1;
  const hw=textWidth("20-Year-Old",SIZE)+2*SIZE*.1;
  return <AbsoluteFill>
    <PortraitFilmLife frame={frame} seed="aim-naman-tall">
      <TallPaper frame={frame} cx={540+frame*.015} cy={960+frame*.012} cxRest={540} cyRest={960} k={cam.k}/>
      <div style={{position:"absolute",left:cam.x,top:cam.y,width:SW,height:SH,transformOrigin:"0 0",transform:`scale(${cam.k}) rotate(${TURN}deg) translate(-50%, -50%)`}}>
        <svg width={SW+SHADOW_OFF} height={SH+SHADOW_OFF} viewBox={`0 0 ${SW+SHADOW_OFF} ${SH+SHADOW_OFF}`} style={{position:"absolute",left:0,top:0,overflow:"visible"}}>
          <rect x={SHADOW_OFF} y={SHADOW_OFF} width={SW} height={SH} fill={SHADOW}/>
          <ChainEcho frame={0} start={-100} core="none" step={CROWN_STEP} render={fill=><rect x={0} y={0} width={SW} height={30} fill={fill}/>}/>
          <rect width={SW} height={SH} fill={INK}/>
          <rect x={26} y={22} width={788} height={42} fill={SHADOW}/>
          <text x={39} y={50} fill={INK} style={type(23,900,.04)}>{approved.outlet}</text>
          <text x={801} y={49} fill={INK} textAnchor="end" style={type(21,800,.02)}>{approved.date}</text>
          {hl>0?<rect x={hx} y={CAP_TOP-SIZE*.13} width={hw*hl} height={SIZE*.96} fill={ORANGE}/>:null}
          {LINES.map((line,i)=><text key={line} x={LEFT-SIZE*.04} y={CAP_TOP+SIZE*.7+i*LEAD} fill={SHADOW} style={{...type(SIZE,900),fontFamily:`${fontFamily}, ${RUPEE_FAMILY}`}}>{line}</text>)}
          <text x={LEFT} y={248} fill={SHADOW} style={type(20,800,.03)}>{approved.byline}</text>
          <text x={SW-26} y={684} textAnchor="end" fill={SHADOW} style={type(18,800,.03)}>{approved.credit}</text>
        </svg>
        <Img src={staticFile(PHOTO_SRC)} style={{position:"absolute",left:PHOTO.x,top:PHOTO.y,width:PHOTO.w,height:PHOTO.h,maxWidth:"none"}}/>
      </div>
    </PortraitFilmLife>
  </AbsoluteFill>;
};
export default NewsCardAimNamanPortrait;
