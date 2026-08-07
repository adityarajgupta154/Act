import * as Dialog from '@radix-ui/react-dialog';
import { Phone, ShieldAlert, X } from 'lucide-react';

export function HelpDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button 
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white px-5 py-4 md:px-6 md:py-4 rounded-full shadow-lg transition-transform active:scale-95 duration-200 pointer-events-auto"
          aria-label="Get Help Now"
        >
          <ShieldAlert className="w-6 h-6 md:w-7 md:h-7" />
          <span className="font-display font-bold text-lg md:text-xl tracking-wide hidden sm:inline-block">Get Help Now</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-in fade-in duration-200" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 md:p-8 w-[90vw] max-w-sm shadow-2xl z-50 animate-in zoom-in-95 duration-200 focus:outline-none">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-display font-bold text-2xl text-slate-800">Emergency Help</h2>
            <Dialog.Close asChild>
              <button 
                className="p-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-full transition-colors touch-manipulation"
                aria-label="Close"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </Dialog.Close>
          </div>
          
          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-2xl flex flex-col gap-2 border border-red-100">
              <span className="text-sm font-bold text-red-600 uppercase tracking-wider">Childline</span>
              <div className="flex items-center gap-3">
                <div className="bg-red-500 p-3 rounded-full">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl md:text-4xl font-display font-bold text-slate-800">1098</span>
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-2xl flex flex-col gap-2 border border-orange-100">
              <span className="text-sm font-bold text-orange-600 uppercase tracking-wider">Cyber Crime</span>
              <div className="flex items-center gap-3">
                <div className="bg-orange-500 p-3 rounded-full">
                  <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <span className="text-3xl md:text-4xl font-display font-bold text-slate-800">155260</span>
              </div>
            </div>
          </div>
          
          <p className="mt-6 text-center text-sm text-slate-500 font-medium">
            Available 24/7. It's safe and free to call.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
