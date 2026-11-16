import React from "react";
import {AbsoluteFill} from "remotion";
import {TallPaper} from "../kits/core-memory/deathCountShared";
export const PortraitPaper:React.FC<{frame:number}>=({frame})=><TallPaper frame={frame} cx={540} cy={960} k={1}/>;
// The existing animated world sits in the portrait reading area; paper continues behind it over the full frame.
export const PortraitWorld:React.FC<{children:React.ReactNode;scale?:number;top?:number}>=({children,scale=.51,top=420})=><div style={{position:"absolute",width:2048,height:1080,left:540-1024*scale,top,transformOrigin:"0 0",transform:`scale(${scale})`}}>{children}</div>;
export const PortraitFilm:React.FC<{children:React.ReactNode;frame:number;seed?:string}>=({children})=><AbsoluteFill style={{overflow:"hidden"}}>{children}<AbsoluteFill style={{pointerEvents:"none",background:"radial-gradient(ellipse at 50% 44%, transparent 45%,rgba(0,0,0,.18) 100%)"}}/></AbsoluteFill>;
