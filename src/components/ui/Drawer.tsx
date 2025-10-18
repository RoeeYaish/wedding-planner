import { useEffect } from "react";

type DrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
};

export default function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-skin-overlay backdrop-blur-md transition-opacity duration-200 ease-in-out"
        onClick={onClose}
        style={{ opacity: 1 }}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 right-0 flex pointer-events-none">
        <div className="w-full md:w-2/3 lg:w-1/2 pointer-events-auto drawer-panel">
          <div className="h-full overflow-y-auto bg-skin-card text-skin-text p-4 md:p-6 rounded-l-2xl shadow-lift transform transition-transform duration-200 ease-in-out translate-x-0">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-skin-text tracking-wide uppercase">{title}</h3>
              <button onClick={onClose} className="text-sm text-skin-muted rounded px-3 py-1 hover:opacity-90">Close</button>
            </div>

            <div className="mt-4">
              {children ?? (
                <div className="text-center text-skin-muted py-12">
                  <div className="text-4xl">�</div>
                  <div className="mt-3">No items to show yet — add something to get started.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
