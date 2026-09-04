import {AbsoluteFill} from 'remotion';
import {z} from 'zod';

export const schema = z.object({
  color: z.string(),
  strokeWidth: z.number().min(1).max(12),
});

export type FlagIconProps = z.infer<typeof schema>;

// 3.75 units in the 100 box is the same stroke-to-size ratio the flag carries in
// the cutaway (15px at a 400px glyph), so this still matches the animated one.
export const defaultProps: FlagIconProps = schema.parse({
  color: '#000000',
  strokeWidth: 3.75,
});

// Same paths as the spectrum and europe scenes. The viewBox is tightened to the
// glyph's own ink bounds (x 26..74, y 14..90, widened by half a stroke) and
// padded evenly, so the exported icon sits centred in a square canvas instead of
// inheriting the layout box it was authored in.
const FlagIcon: React.FC<FlagIconProps> = ({color, strokeWidth}) => {
  return (
    <AbsoluteFill>
      <svg viewBox="3.75 5.75 92.5 92.5" width="100%" height="100%">
        <g
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M26 14 v76" />
          <path d="M26 20 c16 -8 32 8 48 0 v28 c-16 8 -32 -8 -48 0 z" />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

export default FlagIcon;
