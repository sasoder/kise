import { Composition } from "remotion";
import {
  FPS,
  FolkHero,
  FolkPhone,
  FolkPoses,
  FolkStrip,
  FolkStyle,
  POSES_H,
  POSES_W,
  STRIPS,
  STYLE_H,
  STYLE_W,
  stripSize,
} from "../generated/components/rsi-stupidest-species/stupidestFolkProbe";

// Probe sheets of the clip's cast (rsi-stupidest-species shared module stupidestFolk.tsx).
export const RemotionRoot = () => (
  <>
    <Composition
      id="FolkStyle"
      component={FolkStyle}
      durationInFrames={1}
      fps={FPS}
      width={STYLE_W}
      height={STYLE_H}
    />
    <Composition
      id="FolkPoses"
      component={FolkPoses}
      durationInFrames={1}
      fps={FPS}
      width={POSES_W}
      height={POSES_H}
    />
    <Composition
      id="FolkHero"
      component={FolkHero}
      durationInFrames={1}
      fps={FPS}
      width={1080}
      height={1920}
      defaultProps={{ t: 0 }}
    />
    <Composition
      id="FolkPhone"
      component={FolkPhone}
      durationInFrames={1}
      fps={FPS}
      width={1080}
      height={1920}
    />
    {STRIPS.map((s) => (
      <Composition
        key={s}
        id={`FolkStrip-${s}`}
        component={FolkStrip}
        durationInFrames={1}
        fps={FPS}
        width={stripSize(s).w}
        height={stripSize(s).h}
        defaultProps={{ strip: s }}
      />
    ))}
  </>
);
