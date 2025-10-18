import type { ButtonHTMLAttributes } from "react";

export function Button({ className = "", variant = "primary", ...props }: {
  className?: string;
  variant?: "primary" | "muted";
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "btn " + (variant === "primary" ? "btn-primary" : "btn-muted");
  return <button className={`${base} ${className}`.trim()} {...props} />;
}

export default Button;
