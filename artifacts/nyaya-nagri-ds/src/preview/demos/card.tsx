import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Guidelines, Stack } from '../parts';

export function CardDemo() {
  return (
    <div className="space-y-8">
      <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
        <Stack label="Default (SectionCard) — white panel, soft 2px border">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Constitution Corner</CardTitle>
              <CardDescription>
                Learn your fundamental rights, one story at a time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="success">3 of 5 quests</Badge>
                <Badge>⭐ 40 XP</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Meet Justice Didi at the courthouse to begin the next story.
              </p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">Continue</Button>
              <Button variant="ghost" size="sm">
                Later
              </Button>
            </CardFooter>
          </Card>
        </Stack>

        <div className="grid gap-4 md:grid-cols-2">
          <Stack label="Cream — parchment panel (avatar/economy)">
            <Card variant="cream">
              <CardHeader>
                <CardTitle>Certificate progress</CardTitle>
                <CardDescription className="text-[#8a6d1f]">
                  2 more quests to earn your gold seal.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="gold">🏅 Gold seal</Badge>
              </CardContent>
            </Card>
          </Stack>

          <Stack label="Navy — chrome panel (HUD / nav surfaces)">
            <Card variant="navy">
              <CardHeader>
                <CardTitle>Zone 3 — Court Square</CardTitle>
                <CardDescription className="text-sidebar-foreground/70">
                  Your city map and progress live on navy chrome.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="translucent">Level 4</Badge>
              </CardContent>
            </Card>
          </Stack>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground">
        <Guidelines
          items={[
            {
              kind: 'do',
              text: 'Use the default white card for content sections; cream for certificate/reward moments; navy for HUD chrome.',
            },
            {
              kind: 'do',
              text: 'Keep titles in the display face and descriptions in muted Nunito.',
            },
            {
              kind: 'dont',
              text: "Don't stack heavy shadows — panels stay soft (shadow-sm) with 2px borders doing the framing.",
            },
          ]}
        />
      </div>
    </div>
  );
}
