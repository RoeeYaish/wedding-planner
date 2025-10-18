import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { KeyboardEvent } from "react";

export type Kpi = {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: "default" | "success" | "warn" | "neutral";
};

type SummaryCardProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  kpis: Kpi[]; // up to 3
  ctaLabel?: string;
  onOpen?: () => void;
  className?: string;
};

export default function SummaryCard({ title, subtitle, icon, kpis, ctaLabel = "View", onOpen, className = "" }: SummaryCardProps) {
  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onOpen) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  };

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onKeyDown={handleKey}
      onClick={() => onOpen?.()}
      className={cn("card card-pad rounded-xl shadow-soft hover:shadow-lift transform-gpu hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between", className)}
      aria-label={title}
    >
      <div>
        <div className="flex items-start gap-3">
          <div className="flex-none">
            <div className="badge-pill">
              {icon ?? null}
            </div>
          </div>
          <div className="flex-1">
            <div className="text-lg font-semibold text-skin-text tracking-wide uppercase">{title}</div>
            {subtitle ? <div className="text-sm text-skin-muted mt-1">{subtitle}</div> : null}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-6">
          {kpis.slice(0, 3).map((k, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="badge-pill opacity-70">
                {k.icon ? <span className="mr-2 opacity-70">{k.icon}</span> : null}
                <span className="text-sm leading-none text-skin-muted">{k.label}</span>
              </span>
              <div className="text-lg font-semibold text-skin-text min-w-[2.5rem] text-right">{k.value === 0 || k.value === "0" ? "—" : k.value}</div>
            </div>
          ))}
          </div>
        </div>
      </div>

      <div className="mt-4 w-full flex items-center justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen?.();
          }}
          className="btn-primary w-full sm:w-auto"
          type="button"
        >
          {ctaLabel}
        </button>
      </div>
    </div>
  );
}
