import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "press inline-flex items-center justify-center gap-2 rounded-2xl font-bold disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary",
        deep: "bg-primary-deep text-on-primary",
        inverse: "bg-on-primary text-ink",
        surface: "border-2 border-line bg-surface text-ink",
        ghost: "bg-transparent text-muted",
      },
      size: {
        lg: "h-14 w-full px-5 text-lg",
        md: "h-12 px-4 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "lg" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, size, type = "button", ...props }: Props) {
  return <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
