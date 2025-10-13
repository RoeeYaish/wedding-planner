import { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm p-5">
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle ? <p className="text-sm text-neutral-500">{subtitle}</p> : null}
    </div>
  );
}
