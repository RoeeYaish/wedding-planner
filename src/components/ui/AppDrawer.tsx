import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import React from "react";

type AppDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children?: React.ReactNode;
};

export default function AppDrawer({ open, onOpenChange, title, children }: AppDrawerProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
  <Dialog.Overlay className="fixed inset-0 bg-skin-overlay backdrop-blur-md z-30" />
  <Dialog.Content className="fixed inset-y-0 right-0 w-full sm:w-[520px] lg:w-[720px] bg-skin-card text-skin-text shadow-lift rounded-l-2xl p-4 md:p-6 focus:outline-none z-40">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded p-2 text-skin-muted hover:opacity-90"><X size={16} /></button>
            </Dialog.Close>
          </div>
          <div className="mt-4">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
