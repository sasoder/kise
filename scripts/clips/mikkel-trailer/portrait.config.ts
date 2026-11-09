import {Config} from "@remotion/cli/config";
import path from "node:path";

Config.overrideWebpackConfig((config)=>({...config,resolve:{...config.resolve,alias:{...config.resolve?.alias,"@remotion/google-fonts/Barlow$":path.resolve("generated/components/mikkel-trailer/barlowLocal.ts")}}}));
if(process.env.MIKKEL_PREVIEW==="1"){Config.setCodec("h264");Config.setVideoImageFormat("jpeg");Config.setPixelFormat("yuv420p");}

if(process.env.MIKKEL_PREVIEW!=="1"){Config.setCodec("prores");Config.setProResProfile("4444");Config.setVideoImageFormat("png");Config.setPixelFormat("yuva444p10le");}
Config.setOverwriteOutput(true);
