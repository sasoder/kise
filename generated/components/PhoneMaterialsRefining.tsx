import {loadFont} from '@remotion/google-fonts/Roboto';
import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {
  weights: ['500', '700', '900'],
  subsets: ['latin'],
});

export const schema = z.object({
  headline: z.string(),
  accentColor: z.string(),
});

export type PhoneMaterialsRefiningProps = z.infer<typeof schema>;

export const defaultProps: PhoneMaterialsRefiningProps = schema.parse({
  headline: 'WHO REFINES THE\nMATERIALS IN YOUR PHONE',
  accentColor: '#E03131',
});

const rows = [
  {label: 'RARE EARTHS', value: 91, start: 20, usa: '≈0%', usaStart: 44},
  {label: 'GRAPHITE', value: 90, start: 24, usa: '0%', usaStart: 49},
  {label: 'LITHIUM', value: 69, start: 28},
] as const;

const easeOut = Easing.bezier(0.12, 0.84, 0.18, 1);

const Headline: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, [0, 10], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  });

  return (
    <div style={{overflow: 'hidden'}}>
      <div
        style={{
          color: '#111111',
          fontFamily,
          fontSize: 78,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 0.96,
          whiteSpace: 'pre-line',
          translate: `0 ${reveal * 100}%`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Row: React.FC<{
  accentColor: string;
  label: string;
  start: number;
  usa?: string;
  usaStart?: number;
  value: number;
}> = ({accentColor, label, start, usa, usaStart, value}) => {
  const frame = useCurrentFrame();
  const labelStart = 12 + rows.findIndex((row) => row.label === label) * 3;
  const labelProgress = interpolate(frame, [labelStart, labelStart + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOut,
  });
  const barProgress = interpolate(
    frame,
    [start, start + 10, start + 14],
    [0, 1.03, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeOut},
  );
  const countProgress = Math.min(1, Math.max(0, barProgress));
  const count = Math.min(value, Math.floor(value * countProgress));
  const usaProgress = usaStart === undefined ? 0 : interpolate(frame, [usaStart, usaStart + 2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const punch = interpolate(frame, [70, 71, 72], [1, 1.04, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
      <div
        style={{
          color: '#111111',
          fontFamily,
          fontSize: 44,
          fontWeight: 500,
          letterSpacing: '-0.01em',
          opacity: labelProgress,
          translate: `${(1 - labelProgress) * -20}px 0`,
        }}
      >
        {label}
      </div>

      <div style={{height: 116, position: 'relative', width: '100%'}}>
        <div
          style={{
            alignItems: 'center',
            backgroundColor: accentColor,
            display: 'flex',
            height: '100%',
            justifyContent: 'space-between',
            overflow: 'hidden',
            padding: '0 22px 0 26px',
            position: 'absolute',
            scale: `${barProgress} 1`,
            transformOrigin: 'left center',
            width: `${value}%`,
          }}
        >
          <div style={{color: '#FFFFFF', fontFamily, fontSize: 30, fontWeight: 700, letterSpacing: '0.08em'}}>
            CHINA
          </div>
          <div
            style={{
              color: '#FFFFFF',
              fontFamily,
              fontSize: 112,
              fontWeight: 900,
              letterSpacing: '-0.055em',
              lineHeight: 1,
              scale: punch,
            }}
          >
            {count}%
          </div>
        </div>
      </div>

      {usa ? (
        <div style={{alignItems: 'center', display: 'flex', gap: 16, height: 48}}>
          <div
            style={{
              border: '4px solid #111111',
              boxSizing: 'border-box',
              height: 24,
              scale: `${usaProgress} 1`,
              transformOrigin: 'left center',
              width: 42,
            }}
          />
          <div
            style={{
              color: '#111111',
              fontFamily,
              display: 'flex',
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: '-0.04em',
              opacity: usaProgress,
            }}
          >
            <span style={{fontSize: 30, letterSpacing: '0.06em', marginRight: 14}}>USA</span>
            <span>{usa}</span>
          </div>
        </div>
      ) : (
        <div style={{height: 48}} />
      )}
    </div>
  );
};

const PhoneMaterialsRefining: React.FC<PhoneMaterialsRefiningProps> = ({
  accentColor,
  headline,
}) => {
  return (
    <AbsoluteFill style={{backgroundColor: '#FFFFFF'}}>
      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 70,
          marginLeft: 100,
          marginRight: 100,
          paddingTop: 330,
        }}
      >
        <Headline text={headline} />
        <section style={{display: 'flex', flexDirection: 'column', gap: 42}}>
          {rows.map((row) => (
            <Row accentColor={accentColor} key={row.label} {...row} />
          ))}
        </section>
      </main>
    </AbsoluteFill>
  );
};

export default PhoneMaterialsRefining;
