import { ArrowRight, MapPin, Volume2 } from 'lucide-react';

import { Button } from '../../components/ui/button';
import { Guidelines, Row, Stack } from '../parts';

export function ButtonDemo() {
  return (
    <div className="space-y-8">
      <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
        <Row label="Variants">
          <Button>
            Enter <ArrowRight />
          </Button>
          <Button variant="success">Start quest</Button>
          <Button variant="navy">Continue</Button>
          <Button variant="secondary">Explore</Button>
          <Button variant="destructive">Delete</Button>
          <Button variant="outline">Not now</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="link">Learn more</Button>
        </Row>

        <Row label="Sizes">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">
            Enter city <ArrowRight />
          </Button>
          <Button size="icon" aria-label="Play narration">
            <Volume2 />
          </Button>
        </Row>

        <Row label="States">
          <Button disabled>Disabled</Button>
          <Button variant="navy" disabled>
            Disabled navy
          </Button>
          <Button variant="outline">
            <MapPin /> With icon
          </Button>
          <Button asChild>
            <a href="#page=button">As link</a>
          </Button>
        </Row>

        <Stack label="The brand CTA (as on the app's home screen)">
          <div>
            <Button size="lg" className="uppercase">
              Enter <ArrowRight />
            </Button>
          </div>
        </Stack>
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground">
        <Guidelines
          items={[
            {
              kind: 'do',
              text: 'Use one orange CTA per screen — it is the hero action (the app keeps a single ENTER pill on Home).',
            },
            {
              kind: 'do',
              text: 'Pair the hero CTA with navy or outline buttons for secondary choices.',
            },
            {
              kind: 'do',
              text: 'Keep the 44px minimum touch height (default/lg sizes) — the audience is children.',
            },
            {
              kind: 'dont',
              text: "Don't place two gradient CTAs side by side; success green is for completion moments only.",
            },
            {
              kind: 'dont',
              text: "Don't remove the white ring or bottom border — the press depth is part of the brand.",
            },
          ]}
        />
      </div>
    </div>
  );
}
