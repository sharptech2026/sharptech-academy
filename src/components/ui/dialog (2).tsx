"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => (
  <div>{children}</div>
);

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DialogContent = ({ className, children, ...props }: DialogContentProps) => (
  <div
    className={cn(
      "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-surface p-6 shadow-lg duration-200 rounded-2xl",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}

export const DialogHeader = ({ className, children, ...props }: DialogHeaderProps) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props}>
    {children}
  </div>
);

interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

export const DialogTitle = ({ className, ...props }: DialogTitleProps) => (
  <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props} />
);

interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const DialogTrigger = ({ className, children, ...props }: DialogTriggerProps) => (
  <button className={cn("", className)} {...props}>
    {children}
  </button>
);