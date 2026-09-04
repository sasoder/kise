import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  interpolateColors,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { z } from "zod";

export const FPS = 24;
// Tobi, "i think the meta shopify [collab] has created more businesses than any
// government policy in history" — clip 1.459s -> 12.580s, 11.121s.
export const DURATION = 267;

export const schema = z.object({
  ink: z.string(),
  accent: z.string(),
  accentHot: z.string(),
  backgroundBase: z.string(),
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
  shadowY: z.number(),
  shadowBlur: z.number(),
  shadowOpacity: z.number(),
  beats: z.object({
    metaIn: z.number(),
    shopifyIn: z.number(),
    lock: z.number(),
    feed: z.number(),
    more: z.number(),
    government: z.number(),
    policy: z.number(),
    history: z.number(),
  }),
});

export type Props = z.infer<typeof schema>;

// Beats are lifted straight off the word-level SRT (_c10_p0.5), not estimated
// from the midpoint of a line:
//   f0   "i think"       f109 "more businesses"
//   f14  "the meta"      f124 "than any"  <- held for 3.36s
//   f62  "shopify"       f205 "government"
//   f80  "has created"   f213 "policy in"      f228 "history"
export const defaultProps: Props = schema.parse({
  ink: "#FFFFFF",
  accent: "#FFC543",
  accentHot: "#FFE9B0",
  backgroundBase: "#241D15",
  backgroundSrc: "brown-paper-backdrop.jpg",
  // The paper is a texture, not line-work: its value is the fibre and the
  // vignette, so it takes far less blur than the grid does. Past ~7px the grain
  // dissolves and the field goes to flat mud.
  backgroundBlur: 5,
  backgroundDim: 0.58,
  parallax: 0.15,
  shadowY: 2,
  shadowBlur: 9,
  shadowOpacity: 0.22,
  beats: {
    metaIn: 30,
    shopifyIn: 62,
    lock: 72,
    feed: 80,
    more: 109,
    government: 205,
    policy: 213,
    history: 228,
  },
});

const WORLD_W = 1080;
const WORLD_H = 5200;

// ---------------------------------------------------------------------------
// One ground, one unit, one grammar.
//
// Every actor is built the same way: a mark standing on a plinth below the
// baseline, and a stack of identical units rising from the baseline directly
// above it. Nothing in the scene is drawn in a language of its own.
// ---------------------------------------------------------------------------
const BASE = 4600; // the baseline every quantity is measured from
const GROUND = 4804; // where the marks stand, below the baseline
const PLINTH_H = 10;
const PLINTH_PAD = 14;

const UNIT_H = 40;
const UNIT_GAP = 12;
const PITCH = UNIT_H + UNIT_GAP;
const STACK_W = 190;

const COL_CX = 540; // Meta x Shopify — centred, it is the subject
const GOV_CX = 190; // government — same construction, its own place on the ground
const GOV_UNITS = 4;

// The top of the government stack is the bottom edge of the amber column's
// fifth gap, so the comparison rule seats into the column's own structure
// instead of being drawn across a lit field.
const GOV_TOP = BASE - GOV_UNITS * PITCH;
// Overhangs the column just enough to read as a level carried across it, and
// stops there. Run out to 790 it trailed off into empty paper.
const RULE_X1 = 680;

// "...in history" is carried by a brightness sweep running the length of the
// shaft and off the top, not by extra objects. Three faint ghost levels were
// tried here and cut: floating between the two stacks, muted white on paper,
// they read as dirt rather than as lesser policies.
const SWEEP_TRAVEL = 3200;
const SWEEP_WIDTH = 260;

// ---------------------------------------------------------------------------
// The marks
//
// Simple Icons are drawn on a 24-unit box but their ink does not fill it: Meta
// spans the full width, Shopify is inset 1.448 either side and its silhouette
// narrows further at mid-height. Placing by the box is what made the pair look
// lopsided and left the connector short of the bag. Everything here is measured
// off the ink instead, and both marks stand on the plinth by their ink bottoms,
// so the pair is symmetrical by construction rather than by eye.
// ---------------------------------------------------------------------------
const META_INK = { x0: 0, x1: 24, y1: 19.971 };
const SHOP_INK = { x0: 1.448, x1: 22.553, y1: 24 };

const META_INK_W = 200;
const S_META = META_INK_W / (META_INK.x1 - META_INK.x0);
const S_SHOP = S_META * 0.82; // ink-area match: Meta 79.8k px, Shopify 139.8k
const SHOP_INK_W = (SHOP_INK.x1 - SHOP_INK.x0) * S_SHOP;

const PAIR_GAP = 46;
const PAIR_W = META_INK_W + PAIR_GAP + SHOP_INK_W;
const PAIR_X0 = COL_CX - PAIR_W / 2;

const placeX = (s: number, x0: number, left: number) => left - (x0 - 12) * s;
const placeY = (s: number, y1: number) => GROUND - (y1 - 12) * s;

const META_CX = placeX(S_META, META_INK.x0, PAIR_X0);
const META_CY = placeY(S_META, META_INK.y1);
const SHOP_CX = placeX(S_SHOP, SHOP_INK.x0, PAIR_X0 + META_INK_W + PAIR_GAP);
const SHOP_CY = placeY(S_SHOP, SHOP_INK.y1);

const META_D =
  "M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a6.624 6.624 0 0 0 .265.86 5.297 5.297 0 0 0 .371.761c.696 1.159 1.818 1.927 3.593 1.927 1.497 0 2.633-.671 3.965-2.444.76-1.012 1.144-1.626 2.663-4.32l.756-1.339.186-.325c.061.1.121.196.183.3l2.152 3.595c.724 1.21 1.665 2.556 2.47 3.314 1.046.987 1.992 1.22 3.06 1.22 1.075 0 1.876-.355 2.455-.843a3.743 3.743 0 0 0 .81-.973c.542-.939.861-2.127.861-3.745 0-2.72-.681-5.357-2.084-7.45-1.282-1.912-2.957-2.93-4.716-2.93-1.047 0-2.088.467-3.053 1.308-.652.57-1.257 1.29-1.82 2.05-.69-.875-1.335-1.547-1.958-2.056-1.182-.966-2.315-1.303-3.454-1.303zm10.16 2.053c1.147 0 2.188.758 2.992 1.999 1.132 1.748 1.647 4.195 1.647 6.4 0 1.548-.368 2.9-1.839 2.9-.58 0-1.027-.23-1.664-1.004-.496-.601-1.343-1.878-2.832-4.358l-.617-1.028a44.908 44.908 0 0 0-1.255-1.98c.07-.109.141-.224.211-.327 1.12-1.667 2.118-2.602 3.358-2.602zm-10.201.553c1.265 0 2.058.791 2.675 1.446.307.327.737.871 1.234 1.579l-1.02 1.566c-.757 1.163-1.882 3.017-2.837 4.338-1.191 1.649-1.81 1.817-2.486 1.817-.524 0-1.038-.237-1.383-.794-.263-.426-.464-1.13-.464-2.046 0-2.221.63-4.535 1.66-6.088.454-.687.964-1.226 1.533-1.533a2.264 2.264 0 0 1 1.088-.285z";
const SHOP_D =
  "M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z";

// ---------------------------------------------------------------------------
// Government
//
// A columned institution, drawn from the scene's own parts: a triangle, an
// architrave bar, four column bars on the same rhythm as the unit stack above
// it, and a step. Same optical weight as the Meta mark, standing on the same
// ground, so the two sides of the comparison read as peers rather than one
// brand mark and one abstract dot. Local y runs 0 (apex) to GOV_H (step base).
// ---------------------------------------------------------------------------
const GOV_H = 140;
const GOV_ROOF = `${GOV_CX},0 ${GOV_CX - 95},44 ${GOV_CX + 95},44`;
const GOV_BARS = [
  { x: GOV_CX - 86, y: 44, w: 172, h: 14 }, // architrave
  ...[-63, -21, 21, 63].map((c) => ({ x: GOV_CX + c - 11, y: 62, w: 22, h: 60 })),
  { x: GOV_CX - 95, y: 122, w: 190, h: 18 }, // step
];

const GROW_F = [80, 109, 150, 190, 230, DURATION];
const GROW_H = [0, 380, 1000, 1600, 2500, 2900];
const height = (f: number) =>
  interpolate(f, GROW_F, GROW_H, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
const MAX_UNITS = Math.ceil(GROW_H[GROW_H.length - 1] / PITCH);

// ---------------------------------------------------------------------------
// Camera
//
// Its own keyed track, damped, never chasing the head — the head accelerates
// the whole way and following it directly makes the pull-back speed up with it.
// Keys sit ~10 frames ahead of the beats they serve so the damped follow lands
// on the beat. The baseline starts at screen y 835 and settles at 1180; the
// lowest element ends at 1316, keeping the whole scene clear of the captions
// along the bottom of the frame.
// ---------------------------------------------------------------------------
const CAM_F = [0, 58, 74, 100, 140, 178, 215, DURATION];
const CAM_CY = [4725, 4725, 4720, 4690, 4560, 4420, 4245, 4245];
const CAM_K = [1, 1, 1, 0.95, 0.82, 0.7, 0.62, 0.62];
const CAM_STIFF = 0.09;
const CAM_DAMP = 0.468;

const camera = (upto: number) => {
  let cy = CAM_CY[0];
  let k = CAM_K[0];
  let vcy = 0;
  let vk = 0;
  for (let f = 1; f <= upto; f++) {
    const tcy = interpolate(f, CAM_F, CAM_CY, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const tk = interpolate(f, CAM_F, CAM_K, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    vcy += (tcy - cy) * CAM_STIFF - vcy * CAM_DAMP;
    cy += vcy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
  }
  return { cy, k };
};

const BG_OVERSIZE = 1.8;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (f: number, a: number, b: number, easing?: (t: number) => number) =>
  interpolate(f, [a, b], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

const MoreThanAnyPolicy: React.FC<Props> = ({
  ink,
  accent,
  accentHot,
  backgroundBase,
  backgroundSrc,
  backgroundBlur,
  backgroundDim,
  parallax,
  shadowY,
  shadowBlur,
  shadowOpacity,
  beats,
}) => {
  const frame = useCurrentFrame();
  const { cy, k } = camera(frame);
  const tx = 540 - 540 * k;
  const ty = 960 - cy * k;

  const bgY = -(cy - CAM_CY[0]) * k * parallax - frame * 0.3;
  const bgScale = 1 + (k - 1) * 0.3;

  const H = height(frame);
  const headY = BASE - H;
  // Already part-drawn on frame 0 — the measure predates the claim, and it is
  // the only thing holding the frame during "i think".
  const datum = interpolate(frame, [0, 22], [0.34, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // The marks travel for the whole of "i think the", each on its own shallow
  // arc, and land on their own word. A symmetric ease keeps them visibly in
  // flight to the end; an out-ease is ~95% done at 60% of its run, which put
  // Shopify on screen well before it was said.
  const metaIn = ease(frame, 4, beats.metaIn, Easing.inOut(Easing.sin));
  const shopIn = ease(frame, 26, beats.shopifyIn, Easing.inOut(Easing.sin));
  const metaFade = ease(frame, 4, 18);
  const shopFade = ease(frame, 26, 40);
  const metaArc = -78 * Math.sin(Math.PI * metaIn);
  const shopArc = -58 * Math.sin(Math.PI * shopIn);
  // Impact is a scale pop, not a positional overshoot, so a mark can never
  // appear to arrive early and then drift into place.
  const pop = (at: number) =>
    1 + 0.055 * ease(frame, at, at + 4) * (1 - ease(frame, at + 4, at + 11));

  // The plinth draws out from under the pair and they close slightly onto it:
  // two marks become one object standing on one footing.
  const plinth = ease(frame, beats.lock, beats.lock + 11, Easing.out(Easing.back(1.5)));
  const pull = 11 * ease(frame, beats.lock, beats.lock + 13, Easing.out(Easing.back(1.3)));

  const govIn = ease(frame, beats.government, beats.government + 11, Easing.out(Easing.back(1.4)));
  const govStack = ease(frame, beats.government + 6, beats.policy + 4, Easing.out(Easing.cubic));
  const rule = ease(frame, beats.policy, beats.history, Easing.inOut(Easing.quad));
  const sweepY =
    BASE - GOV_UNITS * PITCH - SWEEP_TRAVEL * ease(frame, beats.history, beats.history + 30);
  const sweepLive = frame >= beats.history && frame <= beats.history + 34;
  // The government side settles back once the comparison has been made, so the
  // last frame belongs to the thing that is still climbing.
  const recede = 1 - 0.22 * ease(frame, beats.history + 6, beats.history + 26);

  const ruleX0 = GOV_CX - STACK_W / 2;
  const ruleW = (RULE_X1 - ruleX0) * rule;

  const units: React.ReactNode[] = [];
  for (let i = 0; i < MAX_UNITS; i++) {
    const bottom = i * PITCH;
    const t = clamp01((H - bottom) / UNIT_H);
    if (t <= 0) break;
    // Read off the distance to the visible head, never a parallel timer, so it
    // cannot drift if the growth curve is retimed.
    const heat = 1 - clamp01((H - (bottom + UNIT_H)) / 170);
    // A slow wave up the shaft — the only thing still moving once the head has
    // left the top of the frame.
    const ripple = 0.93 + 0.07 * Math.sin(bottom / 210 - frame * 0.09);
    const sweep = sweepLive ? 1 - clamp01(Math.abs(BASE - bottom - sweepY) / SWEEP_WIDTH) : 0;
    units.push(
      <rect
        key={i}
        x={COL_CX - STACK_W / 2}
        y={BASE - bottom - UNIT_H * t}
        width={STACK_W}
        height={UNIT_H * t}
        fill={interpolateColors(Math.max(heat, sweep * 0.8), [0, 1], [accent, accentHot])}
        opacity={ripple}
      />,
    );
  }

  const govUnits: React.ReactNode[] = [];
  for (let i = 0; i < GOV_UNITS; i++) {
    const t = clamp01(govStack * GOV_UNITS - i);
    if (t <= 0) break;
    govUnits.push(
      <rect
        key={i}
        x={GOV_CX - STACK_W / 2}
        y={BASE - i * PITCH - UNIT_H * t}
        width={STACK_W}
        height={UNIT_H * t}
        fill={ink}
      />,
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: backgroundBase }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img
          src={staticFile(backgroundSrc)}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: WORLD_W * BG_OVERSIZE,
            height: 1920 * BG_OVERSIZE,
            objectFit: "cover",
            transform: `translate(-50%, -50%) translateY(${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`,
            filter: `blur(${backgroundBlur}px) brightness(${backgroundDim})`,
          }}
        />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          filter: `drop-shadow(0 ${shadowY}px ${shadowBlur}px rgba(0,0,0,${shadowOpacity}))`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: WORLD_W,
            height: WORLD_H,
            transformOrigin: "0 0",
            transform: `translate(${tx}px, ${ty}px) scale(${k})`,
          }}
        >
          <svg
            width={WORLD_W}
            height={WORLD_H}
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
          >
            {/* the measure exists before the claim does */}
            <rect
              x={540 - 390 * datum}
              y={BASE - 2}
              width={780 * datum}
              height={4}
              fill={ink}
              opacity={0.18}
            />

            {units}
            {H > 4 ? (
              <rect
                x={COL_CX - STACK_W / 2}
                y={headY - 5}
                width={STACK_W}
                height={5}
                fill={accentHot}
              />
            ) : null}

            {/* Meta x Shopify: one plinth, both marks placed off their ink */}
            <rect
              x={PAIR_X0 - PLINTH_PAD + pull}
              y={GROUND + 6}
              width={(PAIR_W + PLINTH_PAD * 2 - pull * 2) * plinth}
              height={PLINTH_H}
              fill={accent}
            />
            <g
              opacity={metaFade}
              transform={`translate(${META_CX + pull - (1 - metaIn) * 520}, ${META_CY + metaArc}) scale(${S_META * pop(beats.metaIn)}) translate(-12, -12)`}
            >
              <path d={META_D} fill={accent} />
            </g>
            <g
              opacity={shopFade}
              transform={`translate(${SHOP_CX - pull + (1 - shopIn) * 520}, ${SHOP_CY + shopArc}) scale(${S_SHOP * pop(beats.shopifyIn)}) translate(-12, -12)`}
            >
              <path d={SHOP_D} fill={accent} />
            </g>

            {/* government: the same construction, in ink */}
            <g opacity={govIn * recede}>
              <rect
                x={GOV_CX - STACK_W / 2 - PLINTH_PAD}
                y={GROUND + 6}
                width={STACK_W + PLINTH_PAD * 2}
                height={PLINTH_H}
                fill={ink}
              />
              <g transform={`translate(0, ${GROUND - GOV_H})`}>
                <polygon points={GOV_ROOF} fill={ink} />
                {GOV_BARS.map((b) => (
                  <rect key={b.x} x={b.x} y={b.y} width={b.w} height={b.h} fill={ink} />
                ))}
              </g>
            </g>
            <g opacity={recede}>{govUnits}</g>

            {/* the comparison: government's ceiling carried across the column */}
            {rule > 0 ? (
              <g opacity={0.34 + 0.66 * recede}>
                <rect x={ruleX0} y={GOV_TOP} width={ruleW} height={UNIT_GAP} fill={ink} />
                {rule < 1 ? (
                  <rect
                    x={ruleX0 + ruleW - 6}
                    y={GOV_TOP - 7}
                    width={9}
                    height={UNIT_GAP + 14}
                    fill={ink}
                  />
                ) : null}
              </g>
            ) : null}
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export default MoreThanAnyPolicy;
