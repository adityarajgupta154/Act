import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const CORE_SWATCHES = [
  { name: 'Primary — brand orange', className: 'bg-primary' },
  { name: 'Secondary — sky blue', className: 'bg-secondary' },
  { name: 'Accent — success green', className: 'bg-accent' },
] as const;

const SUPPORTING_SWATCHES = [
  { name: 'Background (warm cream)', className: 'border bg-background' },
  { name: 'Foreground (deep navy)', className: 'bg-foreground' },
  { name: 'Muted', className: 'bg-muted' },
  { name: 'Destructive', className: 'bg-destructive' },
  { name: 'Border', className: 'bg-border' },
] as const;

const CHROME_SWATCHES = [
  { name: 'Navy chrome (sidebar)', className: 'bg-sidebar' },
  { name: 'Navy hover (sidebar accent)', className: 'bg-[hsl(var(--sidebar-accent))]' },
  { name: 'Certificate gold (chart-5)', className: 'bg-chart-5' },
  { name: 'Zone purple (chart-4)', className: 'bg-chart-4' },
] as const;

const TYPE_SCALE = [
  { label: 'Display', className: 'font-display text-4xl font-semibold' },
  { label: 'Heading', className: 'font-display text-2xl font-semibold' },
  { label: 'Body', className: 'text-base' },
  { label: 'Label', className: 'text-sm font-bold' },
  { label: 'Caption', className: 'text-sm font-medium text-muted-foreground' },
  { label: 'Certificate', className: 'font-serif text-2xl font-semibold' },
] as const;

const SPACING_SCALE = [
  { label: '4', className: 'w-4' },
  { label: '8', className: 'w-8' },
  { label: '12', className: 'w-12' },
  { label: '16', className: 'w-16' },
  { label: '24', className: 'w-24' },
] as const;

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-16 rounded-lg ${className}`} />
      <p className="text-sm font-medium">{name}</p>
    </div>
  );
}

export function OverviewPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border bg-card p-5 text-card-foreground">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Core palette
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {CORE_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Typography
          </h2>
          <div className="mt-4 space-y-3">
            {TYPE_SCALE.map((entry) => (
              <p key={entry.label} className={entry.className}>
                {entry.label}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-5 text-card-foreground">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            In use
          </h2>
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Join Nyaya Nagri</CardTitle>
              <CardDescription>
                Components composed from the tokens above.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="overview-name">Player name</Label>
                <Input id="overview-name" placeholder="What should we call you?" />
              </div>
              <div className="flex items-center gap-2">
                <Badge>⭐ 120 XP</Badge>
                <Badge variant="success">Level 3</Badge>
                <Badge variant="info" className="ml-auto">
                  New
                </Badge>
              </div>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">Start</Button>
              <Button variant="outline" size="sm">
                Cancel
              </Button>
            </CardFooter>
          </Card>
        </section>
      </div>

      <section className="space-y-4 rounded-xl border bg-card p-5 text-card-foreground">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Components
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary CTA</Button>
          <Button variant="success">Success</Button>
          <Button variant="navy">Navy</Button>
          <Button variant="outline">Outline</Button>
          <Badge>Achievement</Badge>
          <Badge variant="gold">Certificate</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>
    </div>
  );
}

export function ColorsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Brand colors</h2>
          <p className="text-sm text-muted-foreground">
            Extracted from the Nyaya Nagri app: orange drives CTAs and focus,
            sky and green support quests and success moments.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {CORE_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Semantic and surface colors</h2>
          <p className="text-sm text-muted-foreground">
            Warm cream surfaces with deep navy text. Dark mode is derived from
            the app&apos;s own navy chrome (the app ships light-only).
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          {SUPPORTING_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Chrome and celebration colors</h2>
          <p className="text-sm text-muted-foreground">
            Navy chrome frames HUDs and nav; gold marks certificates and
            achievements; purple marks world zones.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {CHROME_SWATCHES.map((swatch) => (
            <Swatch key={swatch.name} {...swatch} />
          ))}
        </div>
      </section>
    </div>
  );
}

export function FontsPage() {
  return (
    <div className="space-y-8 rounded-xl border bg-card p-6 text-card-foreground">
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Font families
        </h2>
        <div className="mt-4 space-y-6">
          <div>
            <p className="font-display text-4xl font-semibold">Nyaya Nagri</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Fredoka — display face for headings, CTAs, and celebration
              moments.
            </p>
          </div>
          <div>
            <p className="text-2xl">
              Learn the law, one quest at a time. कानून सीखो, खेल-खेल में!
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Nunito — body and UI face. Noto Sans Devanagari and Noto Sans
              Gujarati carry Hindi and Gujarati text.
            </p>
          </div>
          <div>
            <p className="font-serif text-2xl font-semibold">
              Certificate of Achievement
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Playfair Display — formal face reserved for certificates.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-t pt-6">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Type scale
        </h2>
        {TYPE_SCALE.map((entry) => (
          <div key={entry.label} className="grid gap-2 sm:grid-cols-[88px_1fr]">
            <span className="pt-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {entry.label}
            </span>
            <p className={entry.className}>Justice City welcomes every child.</p>
          </div>
        ))}
      </section>
    </div>
  );
}

export function LayoutPage() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-semibold">Spacing</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          The spacing scale, derived from the base spacing token.
        </p>
        <div className="mt-6 space-y-4">
          {SPACING_SCALE.map((space) => (
            <div key={space.label} className="flex items-center gap-4">
              <span className="w-8 text-xs text-muted-foreground">
                {space.label}
              </span>
              <div className={`h-3 rounded-full bg-primary ${space.className}`} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border bg-card p-6 text-card-foreground">
        <h2 className="font-semibold">Radius</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Big, friendly corners — the base radius token is 1rem, and pills
          (rounded-full) are the signature shape for buttons and chips.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {[
            { label: 'Small', className: 'rounded-sm' },
            { label: 'Medium', className: 'rounded-md' },
            { label: 'Large', className: 'rounded-lg' },
            { label: 'Extra large', className: 'rounded-xl' },
          ].map((radius) => (
            <div
              key={radius.label}
              className={`flex h-24 items-end border bg-muted p-3 ${radius.className}`}
            >
              <span className="text-xs font-medium">{radius.label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
