import React from 'react';
import {Easing, interpolate} from 'remotion';

export const PURPLE = '#7970b4';
export const WHITE = '#FFFFFF';
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const FILL = Easing.bezier(0.65, 0, 0.35, 1);
const ramp = (frame: number, start: number, length: number, ease = EASE) =>
  interpolate(frame, [start, start + length], [0, 1], {
    easing: ease, extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  });

// Softened six-sided panels evoke the quiz-show answer board without sharp joins.
const panelPath = (w: number, h: number) => {
  const k = 30, r = 10, m = h / 2;
  return `M ${k + r} 4 H ${w-k-r} Q ${w-k+2} 4 ${w-k+8} 14 L ${w-6} ${m-8} Q ${w} ${m} ${w-6} ${m+8} L ${w-k+8} ${h-14} Q ${w-k+2} ${h-4} ${w-k-r} ${h-4} H ${k+r} Q ${k-2} ${h-4} ${k-8} ${h-14} L 6 ${m+8} Q 0 ${m} 6 ${m-8} L ${k-8} 14 Q ${k-2} 4 ${k+r} 4 Z`;
};

export const QuizPanel: React.FC<{
  frame: number; start: number; x: number; y: number; width: number; height: number;
  text: string; letter?: string; size?: number; reveal?: number;
}> = ({frame, start, x, y, width, height, text, letter, size = 50, reveal}) => {
  const enter = ramp(frame, start, 25);
  const filled = reveal === undefined ? 0 : ramp(frame, reveal, 30, FILL);
  const clipId = `panel-${x}-${y}`;
  const path = panelPath(width, height);
  const content = (color: string) => <div style={{
    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: letter ? '8px 48px 8px 70px' : '8px 60px',
    color, fontFamily: 'Neulis Cursive', fontWeight: 700, fontSize: size,
    lineHeight: 1.03, letterSpacing: 0, textAlign: 'center', whiteSpace: 'pre-line',
  }}>{letter && <span style={{position: 'absolute', left: 30, fontSize: 43}}>{letter}</span>}{text}</div>;
  return <div style={{position:'absolute', left:x, top:y, width, height,
    opacity: enter, translate: `0px ${(1-enter)*24}px`}}>
    <svg width={width} height={height} style={{position:'absolute', inset:0}}>
      <defs><clipPath id={clipId}><path d={path}/></clipPath></defs>
      <path d={path} fill={PURPLE} stroke={WHITE} strokeWidth={8}/>
      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={0} width={width*filled} height={height} fill={WHITE}/>
      </g>
    </svg>
    {content(WHITE)}
    <div style={{position:'absolute', inset:0, clipPath:`inset(0 ${(1-filled)*100}% 0 0)`}}>{content(PURPLE)}</div>
  </div>;
};

export type QuizRound = {
  question: string; options: string[]; optionFrames: number[];
  correct: number; revealFrame: number;
};
export const QuizBoard: React.FC<{frame:number; round:QuizRound}> = ({frame,round}) => {
  
  return <>
    <QuizPanel frame={frame} start={0} x={90} y={1360} width={900} height={136}
      text={round.question} size={48}/>
    {round.options.map((text,i)=>{
      const width=900;
      const x=90;
      const y=1510+i*88;
      return <QuizPanel key={i} frame={frame} start={round.optionFrames[i]}
        x={x} y={y} width={width} height={80} text={text}
        letter={String.fromCharCode(65+i)} size={48}
        reveal={i===round.correct?round.revealFrame:undefined}/>;
    })}
  </>;
};
