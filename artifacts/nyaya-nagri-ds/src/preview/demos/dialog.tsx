import { Button } from '../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Guidelines, Row } from '../parts';

export function DialogDemo() {
  return (
    <div className="space-y-8">
      <div className="space-y-6 rounded-xl border bg-card p-6 text-card-foreground">
        <Row label="Modal shell (as in the app's Map/Help/Certificate modals)">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="navy">Open city map</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave this quest?</DialogTitle>
                <DialogDescription>
                  Your progress in this story is saved automatically — you can
                  come back any time from the city map.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline">Stay here</Button>
                <Button>Go to map</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Row>
      </div>

      <div className="rounded-xl border bg-card p-6 text-card-foreground">
        <Guidelines
          items={[
            {
              kind: 'do',
              text: 'Keep one decision per dialog with a clear hero action; the pill close button always sits top-right.',
            },
            {
              kind: 'do',
              text: 'Write titles in the display face, short and friendly — the audience is children.',
            },
            {
              kind: 'dont',
              text: "Don't darken the overlay beyond slate-900/50 or square off the corners — modals stay soft and rounded.",
            },
          ]}
        />
      </div>
    </div>
  );
}
