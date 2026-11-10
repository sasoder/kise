import {Composition} from 'remotion';
import AbassHumbleQuiz,{DURATION,FPS,defaultProps,schema,frameCount} from '../generated/components/abass-humble-quiz/AbassHumbleQuiz';
export const RemotionRoot=()=> (
  <Composition id="AbassHumbleQuiz" component={AbassHumbleQuiz} schema={schema} defaultProps={defaultProps}
    durationInFrames={DURATION} calculateMetadata={({props})=>({durationInFrames:frameCount(props.round)})}
    fps={FPS} width={1080} height={1920}/>
);
