import type { ReactNode } from "react";

export function SectionCard({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className}`}>
      {(title || subtitle || right) && (
        <header className="card-pad flex items-start justify-between gap-4 border-b border-skin-border">
          <div>
            {title && <h3 className="text-lg font-display">{title}</h3>}
            {subtitle && <p className="text-sm text-skin-muted mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className="card-pad">{children}</div>
    </section>
  );
}

export default SectionCard;
