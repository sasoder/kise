import React from "react";
import MostSponsorship, { BEATS, DURATION, FPS, type Props, schema } from "./MostSponsorship";

// ---------------------------------------------------------------------------
// MostSponsorshipV2 — Toto Wolff, "Mercedes F1 financials" (Cheeky Pint S4E01),
// cut 5, version 2. Cheeky Pint style, opaque kraft, 1080x1920, 24 fps.
//
// THE LINE: "And if you look at Mercedes, things that are unknown, we are the
// team that's generating the most sponsorship of any sports team in the world."
// In 0:40.280. DURATION = round((48.520 - 40.280) x 24) = 198, + 16 = 214
// (unchanged from V1).
//
// WHY V2. The user on V1 (delivered): "for the 40 graphic, I feel like there's
// a missing element of the orange touch." The director's answer: Mercedes'
// sponsorship bar rises in AMBER — the clip's accent on its subject, the one
// orange tower among white bars.
//
// WHAT CHANGES: exactly one thing. Mercedes' bar (gesture 4 of
// MostSponsorship.tsx, f80..f132 + its 3 px settle to f142, the resolved tower
// after) keeps MoneyBar's form and shadow and is filled with a subtle vertical
// amber gradient, ACCENT #FFB000 at the top to COIN_GRAD_LO #E29A00 at the foot
// (the coin highlight's family); no glow, no outline. The Mercedes tile stays
// white. The four rivals and the whole world row stay white, with the same
// dimming, the same timing and the same camera — V2 IS V1's component with the
// prop `mercedesBar: "amber"`, so every other track is shared by construction.
//
// GESTURES: V1's eight, word for word (see MostSponsorship.tsx); gesture 4's
// bar is amber. DATA: V1's (Mercedes ~$558M 2025 = 700 world px; Cowboys 0.54
// sourced; Real Madrid 0.85, Man United 0.62, Lakers 0.40 illustrative).
// ---------------------------------------------------------------------------

export { BEATS, DURATION, FPS, schema };
export const defaultProps: Props = schema.parse({ crests: "auto", mercedesBar: "amber" });

const MostSponsorshipV2: React.FC<Props> = (props) => <MostSponsorship {...props} />;

export default MostSponsorshipV2;
