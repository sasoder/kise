import React from 'react';
import {AbsoluteFill, Composition, Img, staticFile} from 'remotion';
import CodeAndApps, {
  DURATION,
  FPS,
  defaultProps,
  schema,
} from '../generated/components/CodeAndApps';

// Private render entry for CodeAndApps, so this cut renders while other
// builders own src/Root.tsx. "...a kind of startup that doesn't deal with code
// and apps, but with [welding]". Core memory ink, TRANSPARENT overlay that goes
// behind the roto'd speaker, 1080x1920, 24 fps, 110 frames.
//
// `CodeAndApps` is the deliverable (alpha). The two preview ids are for judging
// it in context only and are never delivered:
//   CodeAndAppsPreview  the speaker still behind, plus a ROUGH hand-drawn matte
//                       of her in front, standing in for the user's roto
//   CodeAndAppsOver     the speaker still behind, graphic fully on top

const STILL = 'hadrian05/speaker_ref.png';
// A crude outline of the speaker in the reference still (head, hair, body).
const ROUGH_MATTE =
  'polygon(0px 1920px, 0px 1400px, 150px 1215px, 325px 1135px, 345px 1000px, 335px 850px, 395px 690px, 470px 590px, 560px 545px, 660px 550px, 740px 620px, 790px 760px, 805px 830px, 800px 930px, 830px 1050px, 845px 1135px, 1000px 1200px, 1080px 1290px, 1080px 1920px)';

const still: React.CSSProperties = {position: 'absolute', left: 0, top: 0, width: 1080, height: 1920};

const Preview: React.FC<{matte: boolean}> = ({matte}) => (
  <AbsoluteFill>
    <Img src={staticFile(STILL)} style={still} />
    <CodeAndApps {...defaultProps} />
    {matte ? <Img src={staticFile(STILL)} style={{...still, clipPath: ROUGH_MATTE}} /> : null}
  </AbsoluteFill>
);

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CodeAndApps"
        component={CodeAndApps}
        schema={schema}
        defaultProps={defaultProps}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="CodeAndAppsPreview"
        component={Preview}
        defaultProps={{matte: true}}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
      <Composition
        id="CodeAndAppsOver"
        component={Preview}
        defaultProps={{matte: false}}
        durationInFrames={DURATION}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
