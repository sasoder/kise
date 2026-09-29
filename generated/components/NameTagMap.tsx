import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {loadFont as loadFell} from '@remotion/google-fonts/IMFellEnglish';
import {loadFont as loadFellSC} from '@remotion/google-fonts/IMFellEnglishSC';
import {z} from 'zod';

/**
 * NameTagMap — transparent 1080x1920 lower-third name tag in the Dwarkesh map
 * style. It is the map-style sibling of NameTagCoreMemory.tsx: same anchor
 * (bottom-left at left 84 / bottom 300), same left-aligned name-over-job
 * layout, same schema/defaultProps pattern, redrawn as a piece of the
 * Russo-Japanese War maps (SouthManchuriaRailway.tsx) it cuts against.
 *
 * Plate: a piece of the map's land, not a flat bar — land #3F3428 at 0.92,
 * with the map's own baked textures on it (public/manchuria/mottle.png as
 * 640 px tiles at 0.9, grain.png at 1.0, the strengths the map uses), radius
 * 4, and one hairline engraved inset border (cream, 1.5 px, 8 px in, 0.3).
 * No drop shadow: the dark plate separates from bright footage on its own.
 *
 * Type: name in IM Fell English roman 84 px, cream; job in IM Fell English SC
 * 38 px, letter-spaced 0.12 em, cream at 0.8, like a region label on the map.
 * Both carry a faint 2 px zero-blur dark offset shadow.
 *
 * Orange is the only accent: one 3 px square-ended rule between name and job,
 * drawn left to right from the text edge to the name's width.
 *
 * Palette:
 *   land    #3F3428  plate
 *   cream   #E9DDBF  name, job (0.8), inset border (0.3)
 *   orange  #FFB000  the rule
 *   shadow  #0A0704  text offset shadow (0.55)
 *
 * Frame table (24 fps, 96 frames):
 *   plate  0 -> 16   slide up 64 px + opacity 0 -> 1
 *   name   4 -> 16   slide up 24 px + opacity 0 -> 1
 *   rule  10 -> 24   draws left to right
 *   job   11 -> 23   slide up 24 px + opacity 0 -> 1
 *   24 -> 95         static hold, no outro, no idle motion
 *
 * Everything eases out on Easing.bezier(0.16, 1, 0.3, 1); nothing pops.
 */

const {fontFamily: fell} = loadFell('normal', {
  weights: ['400'],
  subsets: ['latin'],
});
const {fontFamily: fellSC} = loadFellSC('normal', {
  weights: ['400'],
  subsets: ['latin'],
});

export const FPS = 24;
export const DURATION = 96;

export const schema = z.object({
  name: z.string(),
  job: z.string(),
});

export type NameTagMapProps = z.infer<typeof schema>;

export const defaultProps: NameTagMapProps = schema.parse({
  name: 'Carl von Clausewitz',
  job: 'Prussian general',
});

// ---- Layout (identical anchor to NameTagCoreMemory) ----
const LEFT = 84;
const BOTTOM = 300;

// ---- Palette (Dwarkesh map style) ----
const LAND = '#3F3428';
const CREAM = '#E9DDBF';
const ORANGE = '#FFB000';
const TEXT_SHADOW = '2px 2px 0 rgba(10, 7, 4, 0.55)';

// ---- Plate ----
const PLATE_OPACITY = 0.92;
const PLATE_RISE = 64;
const MOTTLE_TILE = 640;

// ---- Type ----
const NAME_SIZE = 84;
const JOB_SIZE = 38;
const JOB_TRACKING = 0.12; // em
const TEXT_RISE = 24;

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

const T = {
  plate: [0, 16],
  name: [4, 16],
  rule: [10, 24],
  job: [11, 23],
} as const;

const progress = (frame: number, [a, b]: readonly [number, number]) =>
  interpolate(frame, [a, b], [0, 1], {
    easing: EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const NameTagMap: React.FC<NameTagMapProps> = ({name, job}) => {
  const frame = useCurrentFrame();

  const plateT = progress(frame, T.plate);
  const nameT = progress(frame, T.name);
  const ruleT = progress(frame, T.rule);
  const jobT = progress(frame, T.job);

  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: LEFT, bottom: BOTTOM}}>
        <div style={{position: 'relative', display: 'inline-block'}}>
          {/* ---- The plate: a piece of the map's land ---- */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: LAND,
              opacity: plateT * PLATE_OPACITY,
              transform: `translateY(${(1 - plateT) * PLATE_RISE}px)`,
            }}
          >
            {/* world-space mottle, tiled as the map tiles it */}
            <div style={{position: 'absolute', left: -180, top: -230, opacity: 0.9}}>
              {[0, 1].map((i) => (
                <Img
                  key={i}
                  src={staticFile('manchuria/mottle.png')}
                  style={{
                    position: 'absolute',
                    left: i * MOTTLE_TILE,
                    top: 0,
                    width: MOTTLE_TILE + 1,
                    height: MOTTLE_TILE + 1,
                  }}
                />
              ))}
            </div>
            {/* screen-space grain */}
            <Img
              src={staticFile('manchuria/grain.png')}
              style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920}}
            />
            {/* the engraved inset hairline */}
            <div
              style={{
                position: 'absolute',
                inset: 8,
                border: `1.5px solid ${CREAM}`,
                borderRadius: 1,
                opacity: 0.3,
              }}
            />
          </div>

          {/* ---- Type ---- */}
          <div
            style={{
              position: 'relative',
              padding: '32px 52px 30px 52px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            {/* name + rule share one box, so the rule is the name's width */}
            <div style={{display: 'flex', flexDirection: 'column'}}>
              <div
                style={{
                  fontFamily: fell,
                  fontSize: NAME_SIZE,
                  lineHeight: 1.12,
                  color: CREAM,
                  whiteSpace: 'nowrap',
                  textShadow: TEXT_SHADOW,
                  opacity: nameT,
                  transform: `translateY(${(1 - nameT) * TEXT_RISE}px)`,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  height: 3,
                  marginTop: 8,
                  marginBottom: 16,
                  backgroundColor: ORANGE,
                  clipPath: `inset(0 ${((1 - ruleT) * 100).toFixed(3)}% 0 0)`,
                }}
              />
            </div>
            <div
              style={{
                fontFamily: fellSC,
                fontSize: JOB_SIZE,
                lineHeight: 1.1,
                letterSpacing: `${JOB_TRACKING}em`,
                // cancel the tracking after the last letter so the plate's
                // right padding stays even
                marginRight: `-${JOB_TRACKING}em`,
                color: CREAM,
                whiteSpace: 'nowrap',
                textShadow: TEXT_SHADOW,
                opacity: jobT * 0.8,
                transform: `translateY(${(1 - jobT) * TEXT_RISE}px)`,
              }}
            >
              {job}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default NameTagMap;
