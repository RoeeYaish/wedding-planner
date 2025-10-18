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
        "card p-6",
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
    <div className={cn("mb-6 space-y-2", className)}>
      <h3 className="text-xl font-semibold text-ink leading-tight">{title}</h3>
      {subtitle ? <p className="text-muted text-sm leading-relaxed">{subtitle}</p> : null}
    </div>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-4", className)}>{children}</div>;
}
