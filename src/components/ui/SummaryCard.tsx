import { type ReactNode, useEffect, useState, useRef } from "react";

type KPI = { label: string; value: string; tone?: "success" | "warn" | "neutral" };

type SummaryCardProps = {
  title: string;
  subtitle?: string;
  kpis?: KPI[];
  cta?: ReactNode;
  icon?: ReactNode;
  onOpen?: () => void;
  className?: string;
};

export default function SummaryCard({ title, subtitle, kpis = [], cta, icon, onOpen, className = "" }: SummaryCardProps) {
  const kpisToShow = kpis.slice(0, 3);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShow(true), 30);
    return () => clearTimeout(id);
  }, []);

  // render CTA inside a wrapper so clicks on it can open the drawer without cloning
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const renderedCta: ReactNode = cta;

  return (
    <section
      className={`card rounded-xl shadow-soft cursor-pointer transform-gpu transition-transform entry-fade ${show ? 'show' : ''} ${className}`}
      onClick={(e) => {
        // if the click happened inside the CTA wrapper, open the drawer
        if (ctaRef.current && ctaRef.current.contains(e.target as Node)) {
          onOpen?.();
          return;
        }

        // prevent accidental clicks on interactive children outside CTA
        if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;
        onOpen?.();
      }}
      role={onOpen ? "button" : undefined}
      aria-label={title}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {icon ? <div className="text-skin-muted w-8 h-8 flex items-center justify-center rounded-md">{icon}</div> : null}
          <div className="space-y-1">
            <h4 className="text-lg font-semibold text-skin-text tracking-wide uppercase">{title}</h4>
            {subtitle ? <div className="text-sm text-skin-muted">{subtitle}</div> : null}
          </div>
        </div>

  {renderedCta ? <div ref={ctaRef} className="ml-2 w-full sm:w-auto">{renderedCta}</div> : null}
      </div>

      {kpisToShow.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2 items-center border-t border-transparent pt-3">
          {kpisToShow.map((k, idx) => (
            <div key={idx} className="flex items-center space-x-2 pr-3 border-r last:border-r-0 border-skin-border">
                <span className={`pill ${k.tone === 'success' ? 'pill-success' : k.tone === 'warn' ? 'pill-warn' : ''}`}>{k.label}</span>
                <div className="text-lg font-semibold text-skin-text">{k.value === '0' ? '\u2014' : k.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export { }
