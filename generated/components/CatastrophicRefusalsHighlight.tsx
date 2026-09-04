import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadSerif} from '@remotion/google-fonts/Newsreader';
import {loadFont as loadSans} from '@remotion/google-fonts/Inter';
import {z} from 'zod';

const serif = loadSerif('normal', {
  weights: ['400'],
  subsets: ['latin'],
});

loadSerif('italic', {
  weights: ['400'],
  subsets: ['latin'],
});

const sans = loadSans('normal', {
  weights: ['400', '500', '600'],
  subsets: ['latin'],
});

export const FPS = 30;
export const DURATION = 240;

// The post is authored at its own CSS width and scaled up to the 1080px frame,
// so every measurement below stays in one consistent coordinate system.
const PAGE_W = 720;
const GUTTER = 34;
const TOP_PAD = 40;
const BODY_SIZE = 30;
const BODY_LEADING = 44;
const PARA_GAP = 30;
const LIST_INDENT = 76;

export const schema = z.object({
  pageBg: z.string(),
  ink: z.string(),
  muted: z.string(),
  link: z.string(),
  karma: z.string(),
  // Highlighter. `body` is the settled ink, `edge` the wetter leading edge.
  markerBody: z.string(),
  markerEdge: z.string(),
  // Marker band geometry, as fractions of the text's content box: how tall,
  // then how low it rides.
  markerHeight: z.number(),
  markerDrop: z.number(),
  // When the pen touches down, and how long it takes to cross the sentence.
  // Both in seconds, so they can be matched to a voiceover without maths.
  highlightStart: z.number(),
  highlightDuration: z.number(),
});

export type CatastrophicRefusalsHighlightProps = z.infer<typeof schema>;

const HIGHLIGHTED = [
  'Some',
  'AIs',
  'refuse',
  'to',
  'help',
  'with',
  'making',
  'new',
  'AIs',
  'with',
  'very',
  'different',
  'values.',
];

// Share the crossing time by character count so the pen travels at a roughly
// even speed instead of jumping between long and short words.
const TOTAL_CHARS = HIGHLIGHTED.reduce((sum, w) => sum + w.length, 0);

const INTRO_A = 'This post was inspired by useful discussions with Habryka and Sam Marks ';
const INTRO_B =
  '. The views expressed here are my own and do not reflect those of my employer.';

const PARA_LEAD_TAIL =
  ' While this is not an issue yet, it might become a catastrophic one if refusals get in the way of fixing alignment failures.';

const PARA_PARTICULAR =
  'In particular, it seems plausible that in a future where AIs are mostly automating AI R&D:';

const LIST_ITEMS = [
  'AI companies rely entirely on their AIs for their increasingly complex and secure training and science infra;',
  'AI companies don’t have AIs that are competent and trustworthy enough to use their training and science infra and that would never refuse instructions to significantly update AI values;',
  'AI companies at some point need to drastically revise their alignment target.',
];

const PARA_RESULTS =
  'I present results on a new “AI modification refusal” synthetic evaluation, where Claude Opus 4.5, Sonnet 4.5 and Claude Haiku 4.5 refuse to assist with significant AI value updates while models from other providers don’t. I also explain why I think the situation might become concerning.';

const PARA_NOTE =
  'Note that this is very different from the usual concerns with misaligned AIs, where AIs are performing mostly subtle malicious actions without the developers knowing about them - refusals to help are by definition visible.';

const paragraphStyle: React.CSSProperties = {
  fontFamily: serif.fontFamily,
  fontSize: BODY_SIZE,
  lineHeight: `${BODY_LEADING}px`,
  fontWeight: 400,
  letterSpacing: '-0.002em',
  margin: 0,
};

const Chevron: React.FC<{color: string; up: boolean}> = ({color, up}) => (
  <svg width={46} height={26} viewBox="0 0 46 26" fill="none">
    <path
      d={up ? 'M3 21 L23 5 L43 21' : 'M3 5 L23 21 L43 5'}
      stroke={color}
      strokeWidth={3.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CommentMark: React.FC<{color: string}> = ({color}) => (
  <svg width={26} height={26} viewBox="0 0 26 26" fill="none">
    <path
      d="M3 4.5h20v14H10.5L5 23v-4.5H3z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
  </svg>
);

const SpeakerMark: React.FC<{color: string}> = ({color}) => (
  <svg width={28} height={26} viewBox="0 0 28 26" fill="none">
    <path
      d="M4 10h4l6-5v16l-6-5H4z"
      stroke={color}
      strokeWidth={1.7}
      strokeLinejoin="round"
    />
    <path d="M18.5 9.5a6 6 0 0 1 0 7" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
    <path d="M22 6.5a10 10 0 0 1 0 13" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
  </svg>
);

const CatastrophicRefusalsHighlight: React.FC<CatastrophicRefusalsHighlightProps> = ({
  pageBg,
  ink,
  muted,
  link,
  karma,
  markerBody,
  markerEdge,
  markerHeight,
  markerDrop,
  highlightStart,
  highlightDuration,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const seconds = frame / fps;

  let cursor = highlightStart;
  const tokens = HIGHLIGHTED.map((text) => {
    const start = cursor;
    const end = start + (highlightDuration * text.length) / TOTAL_CHARS;
    cursor = end;
    return {text, start, end};
  });

  const metaStyle: React.CSSProperties = {
    fontFamily: sans.fontFamily,
    fontSize: 25,
    fontWeight: 400,
    color: muted,
    display: 'flex',
    alignItems: 'center',
    gap: 14,
  };

  return (
    <AbsoluteFill style={{backgroundColor: pageBg, overflow: 'hidden'}}>
      <AbsoluteFill
        style={{
          width: PAGE_W,
          transform: `scale(${width / PAGE_W})`,
          transformOrigin: 'top left',
          padding: `${TOP_PAD}px ${GUTTER}px 0`,
          boxSizing: 'border-box',
          color: ink,
        }}
      >
        {/* Title, with the karma widget parked in the right margin. */}
        <div style={{display: 'flex', alignItems: 'flex-start', gap: 24}}>
          <h1
            style={{
              fontFamily: serif.fontFamily,
              fontSize: 46,
              fontWeight: 400,
              lineHeight: '58px',
              letterSpacing: '-0.012em',
              margin: 0,
              flex: 1,
            }}
          >
            Refusals that could become catastrophic
          </h1>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              paddingTop: 4,
            }}
          >
            <Chevron color={karma} up />
            <span
              style={{
                fontFamily: sans.fontFamily,
                fontSize: 40,
                fontWeight: 400,
                color: karma,
                lineHeight: '44px',
              }}
            >
              87
            </span>
            <Chevron color={karma} up={false} />
          </div>
        </div>

        <div
          style={{
            ...metaStyle,
            fontSize: 27,
            marginTop: 26,
            gap: 8,
          }}
        >
          <span>by</span>
          <span style={{color: ink, fontWeight: 600}}>Fabien Roger</span>
        </div>

        <div style={{...metaStyle, marginTop: 24, gap: 26}}>
          <span>30th Jan 2026</span>
          <span>9 min read</span>
          <span style={{display: 'flex', alignItems: 'center', gap: 10}}>
            <CommentMark color={muted} />
            12
          </span>
          <SpeakerMark color={muted} />
          <span style={{fontSize: 30, letterSpacing: '0.12em'}}>•••</span>
        </div>

        <p
          style={{
            ...paragraphStyle,
            fontStyle: 'italic',
            marginTop: 56,
          }}
        >
          {INTRO_A}
          <span
            style={{
              color: link,
              textDecoration: 'underline',
              textUnderlineOffset: 3,
              textDecorationThickness: 1,
            }}
          >
            here°
          </span>
          {INTRO_B}
        </p>

        {/* The read: the marker crosses the opening sentence only. */}
        <p style={{...paragraphStyle, marginTop: PARA_GAP}}>
          {tokens.map((token, i) => {
            const progress = interpolate(seconds, [token.start, token.end], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            // The wetter leading edge belongs to the word the pen is crossing
            // right now. Painting it on finished words would leave a dark
            // stripe at every word boundary.
            const wiping = progress > 0 && progress < 1;
            return (
              <span
                key={i}
                style={{
                  backgroundImage: wiping
                    ? `linear-gradient(90deg, ${markerBody} 0%, ${markerBody} 74%, ${markerEdge} 100%)`
                    : `linear-gradient(90deg, ${markerBody}, ${markerBody})`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: `left ${markerDrop * 100}%`,
                  backgroundSize: `${progress * 100}% ${markerHeight * 100}%`,
                }}
              >
                {`${token.text} `}
              </span>
            );
          })}
          {PARA_LEAD_TAIL.trimStart()}
        </p>

        <p style={{...paragraphStyle, marginTop: PARA_GAP}}>{PARA_PARTICULAR}</p>

        <ol
          style={{
            ...paragraphStyle,
            marginTop: PARA_GAP,
            paddingLeft: LIST_INDENT,
          }}
        >
          {LIST_ITEMS.map((item, i) => (
            <li key={i} style={{marginTop: i === 0 ? 0 : 22}}>
              {item}
              {i === LIST_ITEMS.length - 1 ? (
                <sup style={{color: link, fontSize: 19}}>[1]</sup>
              ) : null}
            </li>
          ))}
        </ol>

        <p style={{...paragraphStyle, marginTop: PARA_GAP}}>{PARA_RESULTS}</p>
        <p style={{...paragraphStyle, marginTop: PARA_GAP}}>{PARA_NOTE}</p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const defaultProps = schema.parse({
  pageBg: '#FFFFFF',
  ink: '#26221E',
  muted: '#5F5B57',
  link: '#5F9B65',
  karma: '#C6C2BC',
  markerBody: 'rgba(217, 119, 87, 0.34)',
  markerEdge: 'rgba(217, 119, 87, 0.52)',
  markerHeight: 0.78,
  markerDrop: 0.76,
  highlightStart: 0.7,
  highlightDuration: 4.4,
});

export default CatastrophicRefusalsHighlight;
