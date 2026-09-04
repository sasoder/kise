import {loadFont} from '@remotion/google-fonts/Caveat';
import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {z} from 'zod';

const {fontFamily} = loadFont('normal', {
  weights: ['400'],
  subsets: ['latin'],
});

export const schema = z.object({
  boardAsset: z.string(),
  chalkColor: z.string(),
});

export type ChalkboardEquationDrawProps = z.infer<typeof schema>;

export const defaultProps: ChalkboardEquationDrawProps = schema.parse({
  boardAsset: 'chalkboard-schwarzschild-radius-9x16.png',
  chalkColor: '#eeeae0',
});

type StrokeProps = {
  d: string;
  start: number;
  end: number;
  chalkColor: string;
  strokeWidth?: number;
};

const drawProgress = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    easing: Easing.bezier(0.42, 0, 0.58, 1),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const ChalkStroke: React.FC<StrokeProps> = ({
  d,
  start,
  end,
  chalkColor,
  strokeWidth = 8,
}) => {
  const frame = useCurrentFrame();
  const progress = drawProgress(frame, start, end);

  return (
    <>
      <path
        d={d}
        fill="none"
        pathLength={1}
        stroke={chalkColor}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth + 7}
        opacity={0.11}
        filter="url(#chalkHalo)"
      />
      <path
        d={d}
        fill="none"
        pathLength={1}
        stroke={chalkColor}
        strokeDasharray={1}
        strokeDashoffset={1 - progress}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={strokeWidth}
        opacity={0.96}
        filter="url(#chalkTexture)"
      />
    </>
  );
};

const ChalkboardSurface: React.FC<{chalkColor: string}> = ({chalkColor}) => {
  const frame = useCurrentFrame();
  const dustOpacity = interpolate(frame, [18, 116, 128], [0, 0.12, 0.06], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <svg
      aria-label="R equals two G M divided by c squared"
      viewBox="0 0 928 1668"
      style={{
        position: 'absolute',
        left: 76,
        top: 126,
        width: 928,
        height: 1668,
        overflow: 'hidden',
      }}
    >
      <defs>
        <radialGradient id="boardLight" cx="46%" cy="28%" r="88%">
          <stop offset="0%" stopColor="#252a2c" />
          <stop offset="48%" stopColor="#181d1f" />
          <stop offset="100%" stopColor="#0d1112" />
        </radialGradient>
        <filter id="boardTexture" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            baseFrequency="0.018 0.22"
            numOctaves={3}
            seed={19}
            type="fractalNoise"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.13" />
          </feComponentTransfer>
        </filter>
        <filter id="chalkTexture" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            baseFrequency="0.07 0.45"
            numOctaves={2}
            seed={7}
            type="fractalNoise"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={1.9}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        <filter id="chalkHalo" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={1.8} />
        </filter>
      </defs>

      <rect width={928} height={1668} fill="url(#boardLight)" />
      <rect
        width={928}
        height={1668}
        fill="#ffffff"
        filter="url(#boardTexture)"
        opacity={0.36}
      />
      <rect
        x={18}
        y={18}
        width={892}
        height={1632}
        fill="none"
        stroke="#283033"
        strokeWidth={2}
        opacity={0.35}
      />

      <g>
        <ChalkStroke
          d="M190 690 C188 750 188 814 190 875"
          start={18}
          end={29}
          chalkColor={chalkColor}
        />
        <ChalkStroke
          d="M190 692 C229 668 281 680 286 727 C291 773 246 790 192 779"
          start={28}
          end={42}
          chalkColor={chalkColor}
        />
        <ChalkStroke
          d="M235 780 C251 808 276 848 300 875"
          start={40}
          end={49}
          chalkColor={chalkColor}
        />

        <ChalkStroke
          d="M330 758 C350 760 370 758 392 759"
          start={46}
          end={52}
          chalkColor={chalkColor}
          strokeWidth={7}
        />
        <ChalkStroke
          d="M330 803 C350 805 373 802 392 804"
          start={51}
          end={57}
          chalkColor={chalkColor}
          strokeWidth={7}
        />

        <ChalkStroke
          d="M450 711 C455 674 515 663 530 701 C544 737 496 760 455 796 C479 794 506 796 536 795"
          start={55}
          end={70}
          chalkColor={chalkColor}
        />
        <ChalkStroke
          d="M654 716 C633 684 581 681 563 724 C542 773 576 806 619 796 C645 790 654 768 650 742 C638 742 624 742 612 742"
          start={68}
          end={84}
          chalkColor={chalkColor}
        />
        <ChalkStroke
          d="M684 796 C688 757 692 718 700 690 C713 721 727 750 741 776 C755 748 771 718 785 690 C790 727 796 760 801 796"
          start={81}
          end={96}
          chalkColor={chalkColor}
        />

        <ChalkStroke
          d="M425 845 C540 842 690 847 815 845"
          start={94}
          end={104}
          chalkColor={chalkColor}
          strokeWidth={7}
        />

        <ChalkStroke
          d="M645 924 C622 893 578 894 560 940 C541 989 577 1021 618 1005 C630 1000 639 992 646 982"
          start={102}
          end={116}
          chalkColor={chalkColor}
        />
        <ChalkStroke
          d="M678 906 C682 882 714 878 721 899 C727 916 706 929 682 946 C695 945 711 945 727 945"
          start={114}
          end={122}
          chalkColor={chalkColor}
          strokeWidth={6}
        />
      </g>

      <g opacity={dustOpacity} fill={chalkColor}>
        <circle cx={455} cy={815} r={2.4} />
        <circle cx={538} cy={834} r={1.8} />
        <circle cx={612} cy={819} r={2.1} />
        <circle cx={706} cy={855} r={1.7} />
        <circle cx={624} cy={1030} r={2.2} />
        <circle cx={735} cy={958} r={1.5} />
        <circle cx={318} cy={830} r={1.6} />
      </g>
    </svg>
  );
};

const ChalkboardEquationDraw: React.FC<ChalkboardEquationDrawProps> = ({
  boardAsset,
  chalkColor,
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#0c1112',
        fontFamily,
      }}
    >
      <Img
        src={staticFile(boardAsset)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <ChalkboardSurface chalkColor={chalkColor} />
    </AbsoluteFill>
  );
};

export default ChalkboardEquationDraw;
