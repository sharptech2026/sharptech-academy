"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export const Tabs = ({ children, value, onValueChange, ...props }: TabsProps) => (
  <div {...props}>
    {React.Children.map(children, (child) =>
      React.isValidElement(child) && (child.type === TabsList || child.type === TabsTrigger || child.type === TabsContent)
        ? React.cloneElement(child as React.ReactElement<any>, { value, onValueChange } as any)
        : child
    )}
  </div>
);

interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList = ({ children, className, ...props }: TabsListProps) => (
  <div
    className={cn("inline-flex h-10 items-center justify-center rounded-2xl bg-muted p-1", className)}
    {...props}
  >
    {children}
  </div>
);

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = ({ className, value, ...props }: TabsTriggerProps) => (
  <button
    className={cn(
      "press flex items-center justify-center gap-1 rounded-xl px-3 text-sm font-bold",
      "data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-card",
      "data-[state=inactive]:text-muted",
      className,
    )}
    {...props}
  />
);

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = ({ children, className, value, ...props }: TabsContentProps) => (
  <div className={cn("mt-4", className)} {...props}>
    {children}
  </div>
);