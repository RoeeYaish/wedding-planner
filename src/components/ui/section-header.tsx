import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
};

export default function SectionHeader({
  title,
  subtitle,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      <div className="space-y-1 text-right">
        <h3 className="text-lg font-semibold text-skin-text">{title}</h3>
        {subtitle ? <p className="text-sm text-skin-muted">{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 md:mt-0 mt-2">{actions}</div>
      ) : null}
    </div>
  );
}
