import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-skin-border bg-skin-card px-4 py-2 text-sm shadow-soft transition-all placeholder:text-skin-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skin-primary/50 focus-visible:shadow-lift disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
