import * as React from 'react';

import { cn } from '../../lib/utils';

/**
 * Nyaya Nagri input. shadcn API, restyled: rounded-xl, 2px warm border,
 * 44px minimum touch height (the app enforces this for its young audience),
 * orange focus ring.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex min-h-11 w-full rounded-xl border-2 border-input bg-card px-4 py-2 text-base font-medium text-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
