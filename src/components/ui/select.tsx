"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { ChevronDown, Check } from "lucide-react";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export const Select = ({ value, onValueChange, children }: SelectProps) => (
  <div>{children}</div>
);

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const SelectTrigger = ({ className, children, ...props }: SelectTriggerProps) => (
  <button
    type="button"
    className={cn(
      "press flex h-10 w-full items-center justify-between rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
      className,
    )}
    {...props}
  >
    {children}
    <ChevronDown className="h-4 w-4 opacity-50" />
  </button>
);

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SelectContent = ({ className, children, ...props }: SelectContentProps) => (
  <div
    className={cn(
      "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl border border-line bg-surface p-1 text-sm shadow-lg",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const SelectItem = ({ className, children, value, ...props }: SelectItemProps) => (
  <div
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-primary-soft focus:text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <Check className="h-4 w-4" />
    </span>
    <span className="pointer-events-none">{children}</span>
  </div>
);

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {}

export const SelectValue = ({ className, ...props }: SelectValueProps) => (
  <span className={cn("truncate", className)} {...props} />
);