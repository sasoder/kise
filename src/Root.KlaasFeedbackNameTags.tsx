import {Composition} from 'remotion';
import NameTagStripe, {schema} from '../generated/components/kits/name-tags/NameTagStripe';

// Check: identify each guest and host in the three Klaas interview revisions.
// 150 frames / 24 fps = 6.25 seconds. The editor trims the static hold to each shot.
// The existing Stripe L3 animates its lines at f1 / f4 / f6 and settles by f27.
// No change to the client kit, native size, type, placement, or entrance.
// Tanja's role is spoken in IMG_9815.MOV: Sales Director, Mid-Market, Personio.
// Cancan / Julius: official allO post, https://www.linkedin.com/posts/allo-restaurant-system_allo-stripetour-restaurants-activity-7478740609386766336-cP_d
// Christian: https://www.thi.de/personen/prof-dr-rer-pol-christian-stummeyer/
// Thomas: Christian's Oct 28 Stripe Local event announcement, https://de.linkedin.com/in/christianstummeyer
const people = [
  {key: 'TanjaMeisinger', name: 'Tanja Meisinger', job: 'Sales Director, Mid-Market', company: 'Personio'},
  {key: 'ChristianStummeyer', name: 'Christian Stummeyer', job: 'Professor', company: 'TH Ingolstadt'},
  {key: 'CancanLiu', name: 'Cancan Liu', job: 'CEO & Co-founder', company: 'allO'},
  {key: 'JuliusDanek', name: 'Julius Danek', job: 'Stripe', company: ''},
  {key: 'ThomasCser', name: 'Thomas Cser', job: 'Head of DACH', company: 'Stripe'},
] as const;

export const RemotionRoot = () => (
  <>
    {people.flatMap(({key, ...person}) =>
      (['left', 'right'] as const).map((align) => (
        <Composition
          key={`${key}-${align}`}
          id={`KlaasStripe-${key}-${align}`}
          component={NameTagStripe}
          schema={schema}
          defaultProps={{...person, align}}
          durationInFrames={150}
          fps={24}
          width={1080}
          height={1920}
        />
      )),
    )}
  </>
);
