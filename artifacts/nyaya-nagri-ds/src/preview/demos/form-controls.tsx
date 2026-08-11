import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Guidelines, Stack } from '../parts';

export function FormControlsDemo() {
  return (
    <div className="space-y-8">
      <div className="grid gap-6 rounded-xl border bg-card p-6 text-card-foreground md:grid-cols-2">
        <Stack label="Input">
          <div className="space-y-1.5">
            <Label htmlFor="fc-name">Player name</Label>
            <Input id="fc-name" placeholder="What should we call you?" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fc-pin">Parent PIN</Label>
            <Input id="fc-pin" type="password" placeholder="4 digits" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fc-disabled">Disabled</Label>
            <Input id="fc-disabled" disabled placeholder="Not available yet" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fc-invalid">With error</Label>
            <Input
              id="fc-invalid"
              aria-invalid="true"
              defaultValue="???"
              aria-describedby="fc-invalid-hint"
            />
            <p id="fc-invalid-hint" className="text-sm font-medium text-destructive">
              Please use letters only.
            </p>
          </div>
        </Stack>

        <Stack label="Textarea">
          <div className="space-y-1.5">
            <Label htmlFor="fc-story">Your story idea</Label>
            <Textarea
              id="fc-story"
              placeholder="Tell us what happened at the playground…"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fc-story-disabled">Disabled</Label>
            <Textarea id="fc-story-disabled" disabled placeholder="Locked" />
          </div>
        </Stack>
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground">
        <Guidelines
          items={[
            {
              kind: 'do',
              text: 'Always show a visible bold label — placeholders alone are not labels.',
            },
            {
              kind: 'do',
              text: 'Keep fields at least 44px tall; young users tap, they rarely click.',
            },
            {
              kind: 'do',
              text: 'Pair errors with a short, kind sentence — never just a red border.',
            },
            {
              kind: 'dont',
              text: "Don't shrink the orange focus ring; keyboard visibility is part of the app's accessibility contract.",
            },
          ]}
        />
      </div>
    </div>
  );
}
