import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-cyan-600 text-white shadow-sm shadow-cyan-900/10 hover:bg-cyan-500 disabled:bg-zinc-400 disabled:text-white",
  secondary:
    "border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:border-cyan-200 hover:bg-cyan-50/60 disabled:text-zinc-400",
  ghost:
    "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 disabled:text-zinc-400",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
