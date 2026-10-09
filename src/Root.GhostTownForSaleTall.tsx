import {Composition} from 'remotion';
import GhostTownForSaleTall, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/GhostTownForSaleTall';

// Private render entry for GhostTownForSaleTall (the 9:16 sibling of cut 3 of the Cerro Gordo set, Core
// Memory x Brent Underwood): a phone feed of listings stops on the one with a real photograph — GHOST TOWN
// FOR SALE, UNDER $1 MILLION. Opaque 9:16, 1080x1920, 24fps, 122 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="GhostTownForSaleTall"
        component={GhostTownForSaleTall}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
