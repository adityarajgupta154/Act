import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

/**
 * Nyaya Nagri badge. The app's real chip language (inline patterns +
 * LabelBadge/ConfidenceBadge in adults/shared.tsx): always rounded-full,
 * bold, compact. `default` is the amber achievement chip; `translucent`
 * is the white chip used over photos/navy; `gold` is the certificate tone.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border-2 px-3 py-1 text-xs font-bold transition-colors [&_svg]:size-3.5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-amber-100 text-amber-800',
        gold: 'border-[#E7CE8F] bg-[#FBF8EF] text-[#8a6d1f]',
        success: 'border-transparent bg-emerald-100 text-emerald-800',
        info: 'border-transparent bg-sky-100 text-sky-800',
        navy: 'border-transparent bg-sidebar text-sidebar-foreground',
        destructive: 'border-transparent bg-red-100 text-red-800',
        neutral: 'border-transparent bg-muted text-muted-foreground',
        translucent:
          'border-transparent bg-white/80 text-slate-800 backdrop-blur-sm',
        outline: 'border-border text-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
