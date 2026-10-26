import {Composition} from 'remotion';
import {HEADS_H, HEADS_W, STRIPS, STYLE_H, STYLE_W, VaccineFolkHeads, VaccineFolkPhone, VaccineFolkStrip, VaccineFolkStyle, stripSize} from '../generated/components/kyle-vaccine/vaccineFolkProbe';

// Probe sheets of the kyle-vaccine cast (vaccineFolk.tsx).
export const RemotionRoot = () => (
  <>
    <Composition id="VaccineFolkStyle" component={VaccineFolkStyle} durationInFrames={1} fps={30} width={STYLE_W} height={STYLE_H} />
    <Composition id="VaccineFolkHeads" component={VaccineFolkHeads} durationInFrames={1} fps={30} width={HEADS_W} height={HEADS_H} defaultProps={{worry: 0}} />
    <Composition id="VaccineFolkPhone" component={VaccineFolkPhone} durationInFrames={1} fps={30} width={1080} height={1920} />
    {STRIPS.map((s) => (
      <Composition key={s} id={`VaccineFolkStrip-${s}`} component={VaccineFolkStrip} durationInFrames={1} fps={30} width={stripSize(s).w} height={stripSize(s).h} defaultProps={{strip: s}} />
    ))}
  </>
);
