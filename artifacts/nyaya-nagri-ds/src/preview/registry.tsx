import { lazy, type ComponentType } from 'react';
import {
  ColorsPage,
  FontsPage,
  LayoutPage,
  OverviewPage,
} from './foundations';

function lazyPage(load: () => Promise<ComponentType>) {
  return lazy(async () => ({ default: await load() }));
}

const ButtonDemo = lazyPage(() =>
  import('./demos/button').then(({ ButtonDemo }) => ButtonDemo),
);
const BadgeDemo = lazyPage(() =>
  import('./demos/badge').then(({ BadgeDemo }) => BadgeDemo),
);
const CardDemo = lazyPage(() =>
  import('./demos/card').then(({ CardDemo }) => CardDemo),
);
const DialogDemo = lazyPage(() =>
  import('./demos/dialog').then(({ DialogDemo }) => DialogDemo),
);
const FormControlsDemo = lazyPage(() =>
  import('./demos/form-controls').then(
    ({ FormControlsDemo }) => FormControlsDemo,
  ),
);

export type PreviewEntry = {
  // Globally unique across every group — it is the deep-link slug (`#page=<id>`)
  // and the active-page key. Group-qualify names that repeat across groups
  // (e.g. `brand-icons` vs `components-icons`).
  id: string;
  name: string;
  description: string;
  Page: ComponentType;
};

export type NavGroup = {
  name: string;
  entries: PreviewEntry[];
};

export const DESIGN_SYSTEM = {
  title: 'Nyaya Nagri',
  description:
    'The visual language of Nyaya Nagri — a playful legal-literacy city for young learners: warm cream surfaces, deep navy text, orange pill CTAs, and the Fredoka display face.',
} as const;

export const OVERVIEW_ENTRY: PreviewEntry = {
  id: 'overview',
  name: 'Overview',
  description: 'The visual foundations and principles that shape this system.',
  Page: OverviewPage,
};

export const NAV_GROUPS: NavGroup[] = [
  {
    name: 'Colors',
    entries: [
      {
        id: 'color-roles',
        name: 'Color roles',
        description:
          'Brand orange, sky, and green with warm cream surfaces and navy chrome.',
        Page: ColorsPage,
      },
    ],
  },
  {
    name: 'Fonts',
    entries: [
      {
        id: 'type-scale',
        name: 'Type scale',
        description:
          'Fredoka display, Nunito body (with Devanagari/Gujarati fallbacks), Playfair certificates.',
        Page: FontsPage,
      },
    ],
  },
  {
    name: 'Layout',
    entries: [
      {
        id: 'spacing-radius',
        name: 'Spacing and radius',
        description: 'Spacing rhythm and the big friendly corner language.',
        Page: LayoutPage,
      },
    ],
  },
  {
    name: 'Actions',
    entries: [
      {
        id: 'button',
        name: 'Buttons',
        description:
          'Orange gradient brand CTA, success, navy chrome, and quiet variants.',
        Page: ButtonDemo,
      },
    ],
  },
  {
    name: 'Forms & inputs',
    entries: [
      {
        id: 'form-controls',
        name: 'Input, Textarea & Label',
        description:
          'Friendly rounded fields with 44px touch targets and orange focus.',
        Page: FormControlsDemo,
      },
    ],
  },
  {
    name: 'Overlays',
    entries: [
      {
        id: 'dialog',
        name: 'Dialog',
        description:
          'Rounded-3xl modal shells with pill close buttons, as in the app.',
        Page: DialogDemo,
      },
    ],
  },
  {
    name: 'Data display',
    entries: [
      {
        id: 'badge',
        name: 'Badge',
        description: 'Achievement, status, and certificate chips — always pills.',
        Page: BadgeDemo,
      },
      {
        id: 'card',
        name: 'Card',
        description: 'White, cream, and navy panels with soft 2px borders.',
        Page: CardDemo,
      },
    ],
  },
];

export const ALL_ENTRIES: PreviewEntry[] = [
  OVERVIEW_ENTRY,
  ...NAV_GROUPS.flatMap((group) => group.entries),
];

// A duplicate id would make one page unreachable (its deep link and highlight
// resolve to the first match), so fail loudly instead of shipping a dead page.
const duplicateIds = ALL_ENTRIES.map((entry) => entry.id).filter(
  (id, index, ids) => ids.indexOf(id) !== index,
);
if (duplicateIds.length > 0) {
  throw new Error(
    `Duplicate preview page id(s): ${[...new Set(duplicateIds)].join(
      ', ',
    )}. Every page id must be unique across all nav groups.`,
  );
}
