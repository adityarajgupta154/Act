import { Badge } from '../../components/ui/badge';
import { Guidelines, Row, Stack } from '../parts';

export function BadgeDemo() {
  return (
    <div className="space-y-8">
      <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
        <Row label="Variants">
          <Badge>⭐ 120 XP</Badge>
          <Badge variant="gold">🏅 Certificate</Badge>
          <Badge variant="success">Completed</Badge>
          <Badge variant="info">New quest</Badge>
          <Badge variant="navy">Zone 3</Badge>
          <Badge variant="destructive">Locked</Badge>
          <Badge variant="neutral">Draft</Badge>
          <Badge variant="outline">Outline</Badge>
        </Row>

        <Stack label="Over navy / photos (translucent)">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-sidebar p-4">
            <Badge variant="translucent">Level 4</Badge>
            <Badge variant="translucent">7-day streak</Badge>
            <Badge>⭐ 40 XP</Badge>
          </div>
        </Stack>
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground">
        <Guidelines
          items={[
            {
              kind: 'do',
              text: 'Amber is the achievement tone; gold-on-cream is reserved for certificates.',
            },
            {
              kind: 'do',
              text: 'Use the translucent chip over navy chrome or artwork, as the app does on its map.',
            },
            {
              kind: 'dont',
              text: "Don't square the corners — every chip in Nyaya Nagri is a pill.",
            },
            {
              kind: 'dont',
              text: "Don't write sentences in badges; two or three words at most.",
            },
          ]}
        />
      </div>
    </div>
  );
}
