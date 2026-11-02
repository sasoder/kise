// ---------------------------------------------------------------------------
// WipKitProbe (wip-anthropic): the Works in Progress kit on real pictures, not a cut. The mint page, stamps with real
// b&w pictures, a logo stamp, a red postmark over one, an indigo mark, a cut-out, a slow camera. Opaque 1080x1920, 24 fps, 48 frames.
// Contact frames: the stamp at f8, the red postmark at f14.
// SOURCES: stand-ins already in public/, through bake-photo.py: brezhnev/irkutsk_queue_1981.jpg (a), maven/pentagon.jpg (b),
// brezhnev/brezhnev_1972.jpg (cut-out). A kit test only; the marks' places and dates are placeholders.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CLAY,
  CaptionBandsDebug,
  CutOut,
  INDIGO,
  InkPrint,
  PaperGround,
  Postmark,
  PrintPhoto,
  RED,
  Stamp,
  WipFilmLife,
  WipPlane,
  inkPress,
  runWipCamera,
  stampPress,
} from "../kits/works-in-progress/wipShared";

export const FPS = 24;
export const DURATION = 48;
export const schema = z.object({ bands: z.boolean(), zoom: z.number() });
export const defaultProps = schema.parse({ bands: false, zoom: 1 });

const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: 930, k: 1 },
    { f: DURATION, x: 556, y: 960, k: 1.06, ease: "linear" },
  ],
  DURATION,
);

// The Claude mark (public/logos/claude.svg), a real brand mark in its real colour.
const MARK = "M4.709 15.955l4.72-2.647.08-.23-.08-.128H9.2l-.79-.048-2.698-.073-2.339-.097-2.266-.122-.571-.121L0 11.784l.055-.352.48-.321.686.06 1.52.103 2.278.158 1.652.097 2.449.255h.389l.055-.157-.134-.098-.103-.097-2.358-1.596-2.552-1.688-1.336-.972-.724-.491-.364-.462-.158-1.008.656-.722.881.06.225.061.893.686 1.908 1.476 2.491 1.833.365.304.145-.103.019-.073-.164-.274-1.355-2.446-1.446-2.49-.644-1.032-.17-.619a2.97 2.97 0 01-.104-.729L6.283.134 6.696 0l.996.134.42.364.62 1.414 1.002 2.229 1.555 3.03.456.898.243.832.091.255h.158V9.01l.128-1.706.237-2.095.23-2.695.08-.76.376-.91.747-.492.584.28.48.685-.067.444-.286 1.851-.559 2.903-.364 1.942h.212l.243-.242.985-1.306 1.652-2.064.73-.82.85-.904.547-.431h1.033l.76 1.129-.34 1.166-1.064 1.347-.881 1.142-1.264 1.7-.79 1.36.073.11.188-.02 2.856-.606 1.543-.28 1.841-.315.833.388.091.395-.328.807-1.969.486-2.309.462-3.439.813-.042.03.049.061 1.549.146.662.036h1.622l3.02.225.79.522.474.638-.079.485-1.215.62-1.64-.389-3.829-.91-1.312-.329h-.182v.11l1.093 1.068 2.006 1.81 2.509 2.33.127.578-.322.455-.34-.049-2.205-1.657-.851-.747-1.926-1.62h-.128v.17l.444.649 2.345 3.521.122 1.08-.17.353-.608.213-.668-.122-1.374-1.925-1.415-2.167-1.143-1.943-.14.08-.674 7.254-.316.37-.729.28-.607-.461-.322-.747.322-1.476.389-1.924.315-1.53.286-1.9.17-.632-.012-.042-.14.018-1.434 1.967-2.18 2.945-1.726 1.845-.414.164-.717-.37.067-.662.401-.589 2.388-3.036 1.44-1.882.93-1.086-.006-.158h-.055L4.132 18.56l-1.13.146-.487-.456.061-.746.231-.243 1.908-1.312-.006.006z";

const PHOTO_A = "wip-anthropic/probe_a.png";
const PHOTO_B = "wip-anthropic/probe_b.png";
const CUT = "wip-anthropic/probe_cut.png";
const CUT_ASPECT = 0.7318;

const WipKitProbe: React.FC<z.infer<typeof schema>> = ({ bands, zoom }) => {
  const frame = useCurrentFrame();
  const at = camAt(frame);
  const cam = { ...at, k: at.k * zoom }; // zoom: a test of the filters under a closer camera
  return (
    <>
      <WipFilmLife frame={frame}>
        <PaperGround cam={cam} />
        <WipPlane cam={cam} ink>
          <Postmark x={315} y={395} size={430} ink={INDIGO} seed="pitt" top="PITTSBURGH" bottom="PA." date="NOV 2" sub="1901" bars="wavy" rotate={-7} />
        </WipPlane>
        <WipPlane cam={cam}>
          <CutOut src={CUT} x={785} y={815} w={340} aspect={CUT_ASPECT} rotate={2} border={6} seed="cut" />
          <Stamp x={355} y={740} w={350} h={450} rotate={-3} seed="a" press={stampPress(frame, 8)} from={{ x: -720, y: -320 }}>
            <PrintPhoto src={PHOTO_A} />
          </Stamp>
          <Stamp x={770} y={400} w={280} h={360} rotate={4} seed="b">
            <PrintPhoto src={PHOTO_B} />
          </Stamp>
          <Stamp x={165} y={985} w={150} h={185} rotate={6} seed="c" window="#F3EEE2">
            <InkPrint x={20} y={34} w={94} h={94} ink={CLAY} seed="mark" rough={0.5} wear={0.1} misregister={0.5}>
              <svg width={94} height={94} viewBox="0 0 24 24" style={{ position: "absolute" }}>
                <path d={MARK} fill="currentColor" />
              </svg>
            </InkPrint>
          </Stamp>
        </WipPlane>
        <WipPlane cam={cam} ink>
          <Postmark x={500} y={590} size={410} ink={RED} seed="wash" top="WASHINGTON" bottom="D.C." date="JUL 15" sub="10-AM" press={inkPress(frame, 14)} />
          <Postmark x={900} y={610} size={290} ink={RED} seed="aust" shape="single" top="AUSTIN" bottom="TEX." date="MAR 5" rotate={11} />
        </WipPlane>
      </WipFilmLife>
      <CaptionBandsDebug on={bands} />
    </>
  );
};

export default WipKitProbe;
