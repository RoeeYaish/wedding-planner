import type { HTMLAttributes } from "react";

export function Badge({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={`pill bg-skin-pillBg text-skin-muted border border-skin-border ${className}`.trim()} {...props} />
  );
}

export default Badge;
