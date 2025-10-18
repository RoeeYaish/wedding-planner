import * as React from "react"
import { cn } from "@/lib/utils"

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-skin-border bg-skin-card px-4 py-2 text-sm shadow-soft ring-offset-background placeholder:text-skin-muted focus:outline-none focus:ring-2 focus:ring-skin-primary/50 focus:shadow-lift disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 appearance-none",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = "Select"

export { Select }