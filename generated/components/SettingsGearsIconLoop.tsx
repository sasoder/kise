import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  iconSize: z.number().min(240).max(1040),
  liveliness: z.number().min(0).max(2),
});

export type SettingsGearsIconLoopProps = z.infer<typeof schema>;

export const defaultProps: SettingsGearsIconLoopProps = schema.parse({
  iconSize: 700,
  liveliness: 1,
});

// Each gear is its own connected component of the source PNG, split out pixel
// for pixel so it can turn about its own hub. Centres/teeth measured from the
// artwork in its native 512x512 space.
const TEETH = 8;
const STEP = 360 / TEETH; // the gear looks identical every 45deg

const GEARS = [
  // steps = whole tooth-steps travelled per loop, so every loop closes seamlessly.
  // Small gears turn faster, and meshing neighbours turn opposite ways.
  {file: 'gear-large.png', cx: 151.3, cy: 153.7, steps: 1},
  {file: 'gear-mid.png', cx: 386.8, cy: 282.3, steps: -2},
  {file: 'gear-small.png', cx: 201.0, cy: 407.5, steps: 3},
];

const SettingsGearsIconLoop: React.FC<SettingsGearsIconLoopProps> = ({
  iconSize,
  liveliness,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();

  const cycle = (frame % durationInFrames) / durationInFrames;

  // Backlash: teeth take up slack four times per loop, so the train reads as
  // loaded metal rather than a smooth CSS spin.
  const backlash = Math.sin(cycle * Math.PI * 8);
  const breath = Math.sin(cycle * Math.PI * 2);

  return (
    <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: iconSize,
          height: iconSize,
          // Volume-preserving squash: the housing takes the load of the train.
          scale: `${1 + breath * 0.008 * liveliness} ${
            1 - breath * 0.005 * liveliness
          }`,
          translate: `0px ${Math.cos(cycle * Math.PI * 2) * 2 * liveliness}px`,
        }}
      >
        {GEARS.map((gear) => {
          const direction = Math.sign(gear.steps);
          const angle =
            cycle * gear.steps * STEP - direction * backlash * 0.3 * liveliness;

          return (
            <Img
              key={gear.file}
              src={staticFile(gear.file)}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                rotate: `${angle}deg`,
                transformOrigin: `${(gear.cx / 512) * 100}% ${
                  (gear.cy / 512) * 100
                }%`,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default SettingsGearsIconLoop;
