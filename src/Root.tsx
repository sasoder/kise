import {Composition} from 'remotion';
import PowerTheEntireUs, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/PowerTheEntireUs';

// Joel, 28.719 s: "it takes 100 square miles ... 100 by 100 to power the entire
// US a few times over". A 100 x 100 mile square fills with real solar strings on
// satellite desert, gets its dimensions, then one pull-back reveals the whole
// contiguous US with the square tiny in the West and two more stamping in.
// Opaque 1080x1920.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PowerTheEntireUs"
        component={PowerTheEntireUs}
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
