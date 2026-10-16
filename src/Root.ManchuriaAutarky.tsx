import {Composition} from 'remotion';
import ManchuriaAutarky, {DURATION, FPS, defaultProps, schema} from '../generated/components/sarah-pearl-harbor/ManchuriaAutarky';

// Private render entry for ManchuriaAutarky (Sarah Paine, "How the Depression
// pushed Japan to Pearl Harbor", Dwarkesh map style): Japan's 1931 empire lives
// on cream sea-lanes; one orange front takes Manchuria, its coal, iron and
// soybeans start running to Japan and close one orange loop through Korea, and
// the outside lanes go slack. Opaque, 1080x1920, 24 fps, 206 frames.
// ManchuriaAutarkyDebug draws the route geometry over the map for checking.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="ManchuriaAutarky"
        component={ManchuriaAutarky}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="ManchuriaAutarkyDebug"
        component={ManchuriaAutarky}
        schema={schema}
        defaultProps={{...defaultProps, debug: true}}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
