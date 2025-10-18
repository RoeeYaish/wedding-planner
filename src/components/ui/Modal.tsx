import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from 'react-dom'

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children?: React.ReactNode;
};

export default function Modal({ open, onOpenChange, title, children }: ModalProps) {
  // body scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const portalTarget = typeof document !== 'undefined' ? document.getElementById('portal-root') ?? document.body : null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {portalTarget ? createPortal(
        <>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 z-40" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[min(100%-2rem,1100px)] rounded-2xl bg-skin-card text-skin-text p-4 md:p-6 shadow-2xl z-50 transition-all duration-200 ease-out scale-95 opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100"
            onInteractOutside={() => onOpenChange(false)}
          >
            <div className="flex items-start justify-between">
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              <div className="ml-2">
                <Dialog.Close asChild>
                  <button aria-label="Close" className="rounded-lg p-2 bg-skin-card text-skin-muted hover:bg-skin-bg focus:outline-none focus:ring-2 focus:ring-skin-primary/40 border border-skin-border">
                    <X size={18} />
                  </button>
                </Dialog.Close>
              </div>
            </div>
            <div className="mt-4 max-h-[75vh] overflow-auto">{children}</div>
          </Dialog.Content>
        </>, portalTarget) : (
        <>
          <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-200 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[min(100%-2rem,1100px)] rounded-2xl bg-skin-card text-skin-text p-4 md:p-6 shadow-2xl z-50 transition-all duration-200 ease-out scale-95 opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100">
            <div className="flex items-start justify-between">
              <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
              <div className="ml-2">
                <Dialog.Close asChild>
                  <button aria-label="Close" className="rounded-lg p-2 bg-skin-card text-skin-muted hover:bg-skin-bg focus:outline-none focus:ring-2 focus:ring-skin-primary/40 border border-skin-border">
                    <X size={18} />
                  </button>
                </Dialog.Close>
              </div>
            </div>
            <div className="mt-4 max-h-[75vh] overflow-auto">{children}</div>
          </Dialog.Content>
        </>
      )}
    </Dialog.Root>
  )
}
