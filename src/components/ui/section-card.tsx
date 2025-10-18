import type { ReactNode } from "react";
import { Card } from "./Card";

type SectionCardProps = {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className,
}: SectionCardProps) {
  const hasScrollBody = className?.includes("scroll-body");

  return (
    <Card className={className} dir="rtl">
      {(title || subtitle || actions) && (
                <div className="flex items-start justify-between border-b border-skin-border pb-4 mb-6">
          <div className="space-y-1">
                    {title && <h3 className="text-sm font-semibold text-skin-text uppercase tracking-wide">{title}</h3>}
                    {subtitle && <p className="text-skin-muted text-sm">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`${hasScrollBody ? "max-h-72 overflow-y-auto pr-1" : ""} space-y-4`}>
        {children}
      </div>
    </Card>
  );
}