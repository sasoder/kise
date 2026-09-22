import {Composition} from 'remotion';
import HarderToMakeProgressV2, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/HarderToMakeProgressV2';

// Private render entry for HarderToMakeProgressV2 (Noam_Challenge_The_Model,
// cut 5, V2), so this cut renders while other builders own src/Root.tsx. Orange
// Dwarkesh on the grid background: progress as a curve over time. The camera
// pans right at one constant rate — that is the clock — and against it the
// model's rise dies: the trail behind it comes up at 60 degrees, bends, and
// arrives flat, the `?` rungs it climbs by get further and further apart, and
// the next one is off along the plateau and never reached.
// Opaque 1080x1920 at 24fps.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="HarderToMakeProgressV2"
        component={HarderToMakeProgressV2}
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
