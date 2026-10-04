import {Composition} from 'remotion';
import TwoDriversStout, * as C1 from '../generated/components/TwoDriversStout';
import PitWallStout, * as C2 from '../generated/components/PitWallStout';
import TipOfTheIcebergStout, * as C3 from '../generated/components/TipOfTheIcebergStout';
import TwoHubsStout, * as C4 from '../generated/components/TwoHubsStout';
import QuiteVastStout, * as C5 from '../generated/components/QuiteVastStout';
import NotTwoSuperstarsStout, * as C6 from '../generated/components/NotTwoSuperstarsStout';

// Private render entry for Toto Wolff's "no dickheads rule" (Cheeky Pint S4E01, stout system): six cuts on
// one iceberg world and one story clock (icebergShared.tsx), so it renders while other sessions own
// src/Root.tsx. 1080x1920, 24 fps, opaque.
export const RemotionRoot = () => {
  return (
    <>
      <Composition id="TwoDriversStout" component={TwoDriversStout} schema={C1.schema} defaultProps={C1.defaultProps} durationInFrames={C1.DURATION} fps={C1.FPS} width={1080} height={1920} />
      <Composition id="PitWallStout" component={PitWallStout} schema={C2.schema} defaultProps={C2.defaultProps} durationInFrames={C2.DURATION} fps={C2.FPS} width={1080} height={1920} />
      <Composition id="TipOfTheIcebergStout" component={TipOfTheIcebergStout} schema={C3.schema} defaultProps={C3.defaultProps} durationInFrames={C3.DURATION} fps={C3.FPS} width={1080} height={1920} />
      <Composition id="TwoHubsStout" component={TwoHubsStout} schema={C4.schema} defaultProps={C4.defaultProps} durationInFrames={C4.DURATION} fps={C4.FPS} width={1080} height={1920} />
      <Composition id="QuiteVastStout" component={QuiteVastStout} schema={C5.schema} defaultProps={C5.defaultProps} durationInFrames={C5.DURATION} fps={C5.FPS} width={1080} height={1920} />
      <Composition id="NotTwoSuperstarsStout" component={NotTwoSuperstarsStout} schema={C6.schema} defaultProps={C6.defaultProps} durationInFrames={C6.DURATION} fps={C6.FPS} width={1080} height={1920} />
    </>
  );
};
