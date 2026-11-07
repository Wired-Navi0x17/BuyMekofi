"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { WarningCircle } from "@phosphor-icons/react";

type FieldProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** Adds a Show/Hide toggle for password inputs. */
  revealable?: boolean;
};

const inputClass =
  "block w-full min-h-11 border border-rule bg-sheet px-3 text-base text-ink placeholder:text-ink-faint transition-colors duration-150 hover:border-rule-strong focus:border-ink focus:outline-2 focus:outline-offset-2 focus:outline-shu aria-[invalid=true]:border-brick";

/** Label above, hint under the label, error below the input (DESIGN.md §4). */
export function Field({
  label,
  hint,
  error,
  revealable,
  type,
  className = "",
  ...rest
}: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const [revealed, setRevealed] = useState(false);
  const effectiveType = revealable ? (revealed ? "text" : "password") : type;

  return (
    <div className={`grid gap-2 ${className}`}>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {revealable && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="text-sm text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
            aria-controls={id}
            aria-pressed={revealed}
          >
            {revealed ? "Hide" : "Show"}
          </button>
        )}
      </div>
      {hint && (
        <p id={hintId} className="-mt-1 text-sm text-ink-soft">
          {hint}
        </p>
      )}
      <input
        id={id}
        type={effectiveType}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={inputClass}
        {...rest}
      />
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-sm text-brick">
          <WarningCircle aria-hidden size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Form-level message: errors announce assertively, notices politely. */
export function FormMessage({ tone, children }: { tone: "error" | "notice"; children: ReactNode }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`border-l-2 py-1 pl-3 text-sm ${tone === "error" ? "border-brick text-brick" : "border-leaf text-ink"}`}
    >
      {children}
    </p>
  );
}
