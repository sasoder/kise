/**
 * Humble quiz overlay — four question cuts chosen by the round prop.
 * CHECK LINE: The viewer can choose A/B/C and see which answer Abass confirms.
 * THE LINE: Q1 adult permanent teeth (28/32/36), Q2 after brushing (rinse/spit/mouthwash),
 * Q3 between teeth (brush/mouthwash/floss), Q4 caries (water/sugar/bacteria producing acid).
 * Exact question and choice wording, option -> frame and answer -> frame: quizData.ts.
 * DURATION: each (endFrame - startFrame), at 60fps; 563 / 634 / 698 / 777 frames.
 * MOTION: the question slides up24px while fading in; each choice follows its spoken letter.
 * On the spoken answer one continuous white sweep crosses the correct row and inverts its type.
 * All elements then hold still. No camera, shadow, third colour, or idle motion.
 * SOURCES: supplied Abass - hur mycket kan du audio; no new factual claims.
 * Layout explicitly directed below captions: question y1360, choices y1510/1598/1686.
 */
import React from 'react';
import {loadFont} from '@remotion/fonts';
import {AbsoluteFill, cancelRender, continueRender, delayRender, staticFile, useCurrentFrame} from 'remotion';
import {z} from 'zod';
import {QuizBoard, QuizRound} from './quizPanels';
import {rounds} from './quizData';

const fontHandle=delayRender('Loading Neulis Cursive Bold');
loadFont({family:'Neulis Cursive',url:staticFile('NeulisCursive-Bold.otf'),weight:'700'})
  .then(()=>continueRender(fontHandle)).catch((err)=>cancelRender(err));
export const FPS=60;
export const DURATION=rounds.teeth.endFrame-rounds.teeth.startFrame;
export const schema=z.object({round:z.enum(['teeth','spit','between','caries'])});
export const defaultProps=schema.parse({round:'teeth'});
export const frameCount=(round:keyof typeof rounds)=>rounds[round].endFrame-rounds[round].startFrame;
const AbassHumbleQuiz:React.FC<z.infer<typeof schema>>=({round})=>{
  const frame=useCurrentFrame();
  return <AbsoluteFill><QuizBoard frame={frame} round={rounds[round] as unknown as QuizRound}/></AbsoluteFill>;
};
export default AbassHumbleQuiz;
