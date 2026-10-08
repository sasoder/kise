import {Composition} from 'remotion';
import NotLoyalToBloodlines, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/NotLoyalToBloodlines';

// Private render entry for NotLoyalToBloodlines, so this cut renders while
// other builders own src/Root.tsx. Si Sheppard: "the corporations ... profit-
// driven and therefore not loyal to bloodlines". Dwarkesh map style (engraved
// page), 1080x1920, 23.976 fps, 176 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="NotLoyalToBloodlines"
        component={NotLoyalToBloodlines}
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
