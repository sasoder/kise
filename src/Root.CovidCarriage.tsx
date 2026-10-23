import {Composition} from 'remotion';
import {CarriageCovid, CarriageEmpty, CarriageMotion, CarriageSars, CarriageSicken} from '../generated/components/kyle-covid/covidCarriageProbe';

// Probe stills of the kyle-covid metro carriage set (covidCarriage.tsx) with the modern cast.
export const RemotionRoot = () => (
  <>
    <Composition id="CarriageEmpty" component={CarriageEmpty} durationInFrames={1} fps={30000 / 1001} width={1080} height={1920} defaultProps={{bands: false}} />
    <Composition id="CarriageCovid" component={CarriageCovid} durationInFrames={1} fps={30000 / 1001} width={1080} height={1920} defaultProps={{frame: 60, bands: false, k: 2.3, hideNear: false}} />
    <Composition id="CarriageSars" component={CarriageSars} durationInFrames={1} fps={30000 / 1001} width={1080} height={1920} defaultProps={{frame: 60, bands: false, k: 2.3}} />
    <Composition id="CarriageSicken" component={CarriageSicken} durationInFrames={1} fps={30000 / 1001} width={1080} height={1920} defaultProps={{frame: 0, k: 3.0}} />
    <Composition id="CarriageMotion" component={CarriageMotion} durationInFrames={150} fps={30000 / 1001} width={1080} height={1920} />
  </>
);
