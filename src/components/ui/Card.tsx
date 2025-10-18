import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
  dir?: string;
};

export function Card({ children, className, dir }: CardProps) {
  return (
    <div
      className={cn(
        "card p-6 md:p-8",
        className
      )}
      dir={dir}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-3", className)}>
      <div className="flex items-start justify-between border-b border-[#F1EAEA] pb-3">
        <div>
          <h3 className="text-lg font-semibold text-skin-text tracking-wide uppercase">{title}</h3>
          {subtitle ? <p className="text-skin-muted text-sm leading-relaxed">{subtitle}</p> : null}
        </div>
      </div>
    </div>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}
