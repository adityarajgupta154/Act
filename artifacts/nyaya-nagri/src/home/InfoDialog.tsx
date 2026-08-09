/** Nyaya Nagri — simple localized info dialog (About / How It Works share this shell). */
import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

export function InfoDialog({
  open,
  onOpenChange,
  title,
  closeLabel,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  closeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-5 md:p-7 w-[92vw] max-w-lg max-h-[88vh] overflow-y-auto shadow-2xl z-50 animate-in zoom-in-95 duration-200 focus:outline-none"
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          <Dialog.Close asChild>
            <button
              className="absolute right-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors touch-manipulation"
              aria-label={closeLabel}
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </Dialog.Close>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
