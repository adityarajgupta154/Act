import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

/**
 * Nyaya Nagri button. Ported from the app's shadcn button and restyled with
 * the app's real CTA language: rounded-full pills, white ring, darker
 * bottom-border press depth, and the Fredoka display face.
 * - `default` = the orange gradient brand CTA (src/home/PrimaryCta.tsx).
 * - `success` = the green onboarding CTA (WelcomeScene).
 * - `navy` = the app's navy chrome buttons (#14306E, hover #1d3f8c).
 */
const buttonVariants = cva(
  'group inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-display font-semibold tracking-wide transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100',
  {
    variants: {
      variant: {
        default:
          'rounded-full text-white bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-400 hover:to-orange-500 ring-2 ring-white/60 border-b-4 border-orange-800 shadow-[0_18px_35px_-12px_rgba(194,65,12,0.9)] [text-shadow:0_1px_2px_rgba(0,0,0,0.25)] motion-safe:hover:-translate-y-0.5 active:translate-y-0.5 active:border-b-2',
        success:
          'rounded-full text-white bg-gradient-to-b from-[#4cb653] to-[#1f7c2f] ring-2 ring-white/40 border-b-4 border-[#14532d] shadow-[0_18px_35px_-12px_rgba(20,83,45,0.7)] [text-shadow:0_1px_2px_rgba(0,0,0,0.25)] hover:brightness-105 active:border-b-2 active:translate-y-[2px]',
        navy: 'rounded-full text-white bg-[#14306E] hover:bg-[#1d3f8c] ring-2 ring-white/20 border-b-4 border-[#0b1d45] shadow-md active:border-b-2 active:translate-y-[2px]',
        secondary:
          'rounded-full bg-secondary text-secondary-foreground ring-2 ring-white/50 border-b-4 border-sky-700 shadow-md [text-shadow:0_1px_2px_rgba(0,0,0,0.2)] hover:brightness-105 active:border-b-2 active:translate-y-[2px]',
        destructive:
          'rounded-full bg-destructive text-destructive-foreground border-b-4 border-red-900/70 shadow-sm hover:brightness-105 active:border-b-2 active:translate-y-[2px]',
        outline:
          'rounded-full border-2 border-border bg-card text-card-foreground font-bold hover:border-muted-foreground/50',
        ghost: 'rounded-full border-2 border-transparent hover:bg-muted/60',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        // 44px minimum touch target — the app enforces this globally for its
        // young audience (nyaya-nagri src/index.css touch-target rules).
        default: 'min-h-11 px-6 py-2 text-base',
        sm: 'min-h-9 px-4 py-1.5 text-sm',
        lg: 'min-h-14 px-10 py-3 text-lg md:text-xl',
        icon: 'h-11 w-11 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
