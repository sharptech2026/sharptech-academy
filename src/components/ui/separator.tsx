"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {}

export const Separator = ({ className, ...props }: SeparatorProps) => (
  <hr className={cn("shrink-0 bg-line", className)} {...props} />
);