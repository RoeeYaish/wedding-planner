import { type ReactNode } from "react";
import Button from '@/components/ui/button'

type KPI = { label: string; value: string; tone?: "success" | "warn" | "neutral" };

type Props = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  kpis?: KPI[];
  onView?: () => void;
};

export default function SummaryCard({ title, subtitle, icon, kpis = [], onView }: Props) {
  const kpisToShow = kpis.slice(0, 3);

  return (
    <article
      className="card min-h-[110px] p-4 rounded-xl hover:shadow-lift hover:-translate-y-[1px] transition-transform cursor-pointer"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;
        onView?.();
      }}
      aria-label={title}
    >
      <div className="flex items-start justify-between">
    <div className="flex items-center gap-3">
      {icon ? <div className="w-8 h-8 rounded-md flex items-center justify-center text-skin-muted opacity-70">{icon}</div> : null}
          <div>
            <div className="text-sm font-semibold">{title}</div>
                {subtitle ? <div className="text-xs text-skin-muted">{subtitle}</div> : null}
          </div>
        </div>
        <div className="ml-2 w-24 sm:w-auto">
          <Button variant="primary" onClick={() => onView?.()}>View</Button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex flex-wrap gap-6 items-center">
          {kpisToShow.map((k, i) => (
            <div key={i} className="flex flex-col">
              <div className="text-xs text-skin-muted">{k.label}</div>
              <div className={`text-sm font-semibold ${k.tone === 'warn' ? 'text-amber-700' : k.tone === 'success' ? 'text-emerald-600' : ''}`}>{k.value}</div>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
