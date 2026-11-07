"use client";

import { useActionState, useId } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { brand } from "@/config/brand";
import { claimUsername, type ClaimState } from "@/modules/profiles/actions";

const initial: ClaimState = {};

/** "coffeaetthea.in/[ yourname ] Claim", the first thing a creator does. */
export function ClaimBox() {
  const [state, action, pending] = useActionState(claimUsername, initial);
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <form action={action} noValidate className="w-full max-w-xl">
      <label htmlFor={id} className="sr-only">
        Choose your page address
      </label>
      <div className="flex min-h-14 items-stretch panel press-shadow focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-shu">
        <span
          aria-hidden
          className="flex items-center pr-0.5 pl-4 tabular text-ink-soft select-none"
        >
          {brand.domain}/
        </span>
        <input
          id={id}
          name="username"
          defaultValue={state.value}
          placeholder="yourname"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          maxLength={40}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent py-3 pr-2 tabular text-ink placeholder:text-ink-faint focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          className="border-l-2 border-ink bg-shu px-5 font-medium text-sheet transition-colors hover:bg-ink disabled:opacity-60 sm:px-7"
        >
          {pending ? "Checking…" : "Claim"}
        </button>
      </div>
      {state.error && (
        <p id={errorId} role="alert" className="mt-3 flex items-start gap-1.5 text-sm text-brick">
          <WarningCircle aria-hidden size={16} className="mt-0.5 shrink-0" />
          {state.error}
        </p>
      )}
    </form>
  );
}
