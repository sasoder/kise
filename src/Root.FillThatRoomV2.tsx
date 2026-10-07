import React from 'react';
import {AbsoluteFill, Composition} from 'remotion';
import {Emperor} from '../generated/components/stringsShared';
import {
  Bank,
  CAM_RANSOM_END,
  CAM_RANSOM_MAIN,
  ChalkLine,
  GoldPiece,
  KINDS,
  PIECES,
  POSE_REACH,
  PizarroLabel,
  RANSOM_END,
  RANSOM_MAIN,
  ROOM,
  RansomPage,
  RansomTableau,
  RansomWall,
  type RansomScene,
} from '../generated/components/ransomV2Shared';
import type {Cam} from '../generated/components/incaShared';
import FillThatRoomV2, {DURATION, FPS, defaultProps, schema} from '../generated/components/FillThatRoomV2';

// Private render entry for FillThatRoomV2 (60_FillThatRoom, the rebuild) and
// the stills of its world (ransomV2Shared): the art sheet, the MAIN framing
// with the full bank, the END state. Opaque 1080x1920, 24 fps, 190 frames.
const Sheet: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#3F3428'}}>
    <svg width={2400} height={2300} viewBox="0 0 2400 2300">
      <defs>
        <clipPath id="sh-a">
          <rect x={40} y={40} width={1120} height={1180} />
        </clipPath>
        <clipPath id="sh-b">
          <rect x={40} y={1260} width={2320} height={1000} />
        </clipPath>
      </defs>
      {/* the wall and the figure reaching */}
      <g clipPath="url(#sh-a)">
        <g transform="translate(40 40) scale(1.5) translate(-170 -770)">
          <RansomWall />
          <ChalkLine l={1} r={1} />
          <Emperor pose={POSE_REACH} variant="inca" at={[ROOM.standX, ROOM.floor]} uid="sh-e" />
        </g>
      </g>
      {/* the twelve pieces, 220 px each */}
      {KINDS.map((k, i) => {
        const p = PIECES[k];
        const s = 220 / Math.max(p.h, p.w);
        return <GoldPiece key={k} kind={k} x={1330 + (i % 4) * 285} y={380 + Math.floor(i / 4) * 400} s={s} silver={i === 5 || i === 10} />;
      })}
      {/* the assembled bank */}
      <g clipPath="url(#sh-b)">
        <g transform="translate(40 1260) scale(2.6) translate(-150 -1085)">
          <RansomWall />
          <ChalkLine l={1} r={1} />
          <Bank />
        </g>
      </g>
    </svg>
  </AbsoluteFill>
);
const State: React.FC<{scene: RansomScene; cam: Cam; label: boolean}> = ({scene, cam, label}) => (
  <RansomPage cam={cam}>
    <RansomTableau scene={scene} cam={cam} frame={189} />
    {label ? <PizarroLabel cam={cam} frame={189} /> : null}
  </RansomPage>
);

export const RemotionRoot = () => (
  <>
    <Composition id="FillThatRoomV2" component={FillThatRoomV2} schema={schema} defaultProps={defaultProps} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
    <Composition id="RansomV2Sheet" component={Sheet} durationInFrames={1} fps={24} width={2400} height={2300} />
    <Composition id="RansomV2Main" component={State} defaultProps={{scene: RANSOM_MAIN, cam: CAM_RANSOM_MAIN, label: false}} durationInFrames={1} fps={24} width={1080} height={1920} />
    <Composition id="RansomV2End" component={State} defaultProps={{scene: RANSOM_END, cam: CAM_RANSOM_END, label: true}} durationInFrames={1} fps={24} width={1080} height={1920} />
  </>
);
