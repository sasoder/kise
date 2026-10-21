import {Composition} from 'remotion';
import {AntSheetProbe} from '../generated/components/kyle-pandemics/creaturesProbe';

// Private probe entry (kyle-pandemics V3, not a cut): the zombie ant of cut 58 at 2x in the clip's
// medium, for the look sheets. 1 frame each. The marmot's probes: src/Root.MarmotV3.tsx.
const FPS = 30000 / 1001;
export const RemotionRoot = () => (
  <>
    {(['A', 'B'] as const).map((air) =>
      (['side', '3q', 'grip'] as const).map((pose) => (
        <Composition
          key={`${pose}${air}`}
          id={`Ant-${pose}-${air}`}
          component={AntSheetProbe}
          defaultProps={{air, pose}}
          durationInFrames={1}
          fps={FPS}
          width={1080}
          height={1920}
        />
      )),
    )}
  </>
);
