import * as React from "react";
import { cn } from "@/lib/cn";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "destructive" | "warning";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-xs font-bold",
        {
          "bg-primary-soft text-primary": variant === "default",
          "bg-secondary-soft text-secondary": variant === "secondary",
          "bg-destructive-soft text-destructive": variant === "destructive",
          "bg-amber-bg text-amber": variant === "warning",
        },
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}