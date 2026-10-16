// The half-res review preview: H.264 from JPEG frames in yuv420p, so it plays anywhere and renders fast.
// Pass it in place of remotion.config.ts (finals keep that one: ProRes 4444, PNG, yuva444p10le):
//   bunx remotion render src/entry.<Name>.ts <Name> <scratch>/<Name>.mp4 --config=scripts/preview.config.ts --scale=0.5
import { Config } from "@remotion/cli/config";

Config.setCodec("h264");
Config.setVideoImageFormat("jpeg");
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
