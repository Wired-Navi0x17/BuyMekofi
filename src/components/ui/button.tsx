import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "stamp" | "secondary" | "quiet";
type Size = "md" | "sm";

const base =
  "inline-flex items-center justify-center gap-2 font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-[var(--ease-ink)] disabled:pointer-events-none disabled:opacity-50 select-none";

// Pressed like a rubber stamp: the hard shadow collapses as the button moves into it.
const pressable =
  "press-shadow hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_var(--color-ink)]";

const variants: Record<Variant, string> = {
  primary: `bg-ink text-sheet border-2 border-ink ${pressable}`,
  stamp: `bg-cherry text-sheet border-2 border-ink ${pressable}`,
  secondary:
    "border-2 border-ink bg-sheet text-ink hover:bg-ink hover:text-sheet active:translate-y-px",
  quiet: "text-ink-soft hover:text-ink underline-offset-4 decoration-1 hover:underline",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 text-[0.9375rem]",
  sm: "min-h-10 px-3.5 text-sm",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra = "") {
  return `${base} ${variants[variant]} ${variant === "quiet" ? "min-h-11 px-1" : sizes[size]} ${extra}`.trim();
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; size?: Size };

export function Button({ variant, size, className = "", type = "button", ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: Variant; size?: Size };

export function ButtonLink({ variant, size, className = "", ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}
