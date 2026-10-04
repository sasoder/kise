import {Composition} from 'remotion';
import FlockingToHisBanner, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/FlockingToHisBanner';

// Private render entry for FlockingToHisBanner (cut D of the Tlaxcalans clip),
// so this cut renders while other builders own src/Root.tsx. Si Sheppard: "So
// as Cortes builds up for the final campaign against Tenochtitlan, he has
// indigenous people flocking to his banner from all over Mesoamerica."
// Opaque vintage map, 1080x1920, 24fps, 249 frames.
export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="FlockingToHisBanner"
        component={FlockingToHisBanner}
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
