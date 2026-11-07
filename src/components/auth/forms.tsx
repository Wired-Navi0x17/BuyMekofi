"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import {
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
  type FormState,
} from "@/modules/auth/actions";
import { PASSWORD_MIN } from "@/modules/auth/schemas";
import { normaliseUsername, validateUsernameFormat } from "@/modules/profiles/username";
import { checkUsernameStep, type ClaimState } from "@/modules/profiles/actions";
import { brand } from "@/config/brand";

const idle: FormState = { status: "idle" };
const linkClass = "text-ink underline decoration-1 underline-offset-4 hover:text-ink-soft";

function Heading({ title, lead }: { title: string; lead?: string }) {
  return (
    <header className="mb-8">
      <h1 className="text-[1.75rem] leading-tight font-medium tracking-tight">{title}</h1>
      {lead && <p className="mt-2 text-ink-soft">{lead}</p>}
    </header>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, idle);
  const params = useSearchParams();
  const linkError = params.get("error") === "link";

  return (
    <>
      <Heading title="Log in" />
      <form action={action} className="grid gap-5" noValidate>
        <input type="hidden" name="next" value={params.get("next") ?? ""} />
        {linkError && (
          <FormMessage tone="error">
            That link has expired or was already used. Log in, or ask for a new link.
          </FormMessage>
        )}
        {state.message && <FormMessage tone="error">{state.message}</FormMessage>}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          error={state.errors?.email}
        />
        <Field
          label="Password"
          name="password"
          revealable
          autoComplete="current-password"
          required
          error={state.errors?.password}
        />
        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-6 flex flex-wrap justify-between gap-3 text-sm text-ink-soft">
        <Link href="/forgot-password" className={linkClass}>
          Forgot your password?
        </Link>
        <span>
          New here?{" "}
          <Link href="/register" className={linkClass}>
            Create your page
          </Link>
        </span>
      </p>
    </>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUp, idle);
  const [nameState, nameAction, checking] = useActionState(checkUsernameStep, {} as ClaimState);
  // When the person clicks "Change", the result they are changing becomes stale;
  // only a newer check result may move them on again.
  const [stale, setStale] = useState<ClaimState | null>(null);
  const params = useSearchParams();
  const fromClaim = validateUsernameFormat(normaliseUsername(params.get("username") ?? ""));

  // Step 2 once a name has been checked here, or arrived checked from the claim box.
  const fresh = nameState !== stale;
  const chosen =
    fresh && nameState.ok && nameState.value
      ? nameState.value
      : stale === null && fromClaim.ok
        ? fromClaim.username
        : null;

  if (state.status === "sent") {
    return (
      <>
        <Heading title="Check your email" />
        <FormMessage tone="notice">
          If <span className="font-medium">{state.email}</span> can be registered, we have sent a
          confirmation link to it. Open it on this device to finish setting up your page.
        </FormMessage>
        <p className="mt-6 text-sm text-ink-soft">
          Nothing after a few minutes? Check spam, or{" "}
          <Link href="/register" className={linkClass}>
            start again
          </Link>
          .
        </p>
      </>
    );
  }

  if (!chosen) {
    return (
      <>
        <Heading title="Create your account" lead="Choose a username for your page." />
        <form action={nameAction} noValidate>
          <label htmlFor="register-username" className="sr-only">
            Username
          </label>
          <div className="flex min-h-13 items-stretch border-2 border-ink bg-sheet focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
            <span aria-hidden className="flex items-center pl-3 tabular text-ink-soft select-none">
              {brand.domain}/
            </span>
            <input
              id="register-username"
              name="username"
              defaultValue={nameState.value ?? (fromClaim.ok ? fromClaim.username : "")}
              placeholder="yourname"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus
              maxLength={40}
              aria-invalid={fresh && nameState.error ? true : undefined}
              aria-describedby={fresh && nameState.error ? "register-username-error" : undefined}
              className="min-w-0 flex-1 bg-transparent py-3 pr-3 tabular focus:outline-none"
            />
          </div>
          {fresh && nameState.error && (
            <p id="register-username-error" role="alert" className="mt-2 text-sm font-medium">
              {nameState.error}
            </p>
          )}
          <Button type="submit" disabled={checking} className="mt-6 w-full">
            {checking ? "Checking…" : "Next"}
          </Button>
        </form>
        <p className="mt-8 text-sm text-ink-soft">
          Already have an account?{" "}
          <Link href="/login" className={linkClass}>
            Log in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <Heading title="Create your account" lead="Now the login details for your page." />
      <p className="mb-6 flex items-center justify-between gap-3 border-2 border-ink bg-sheet px-3 py-2.5 text-sm">
        <span className="min-w-0 truncate font-medium tabular">
          {brand.domain}/{chosen}
        </span>
        <button
          type="button"
          onClick={() => setStale(nameState)}
          className={`${linkClass} shrink-0`}
        >
          Change
        </button>
      </p>
      <form action={action} className="grid gap-5" noValidate>
        <input type="hidden" name="username" value={chosen} />
        {state.message && <FormMessage tone="error">{state.message}</FormMessage>}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          error={state.errors?.email}
        />
        <Field
          label="Password"
          name="password"
          hint={`At least ${PASSWORD_MIN} characters.`}
          revealable
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          error={state.errors?.password}
        />
        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? "Creating account…" : "Sign up"}
        </Button>
      </form>
      <p className="mt-6 text-sm text-ink-soft">
        The username becomes yours when you finish setting up your page.
      </p>
    </>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, idle);

  if (state.status === "sent") {
    return (
      <>
        <Heading title="Check your email" />
        <FormMessage tone="notice">
          If there is an account for <span className="font-medium">{state.email}</span>, a link to
          set a new password is on its way. It works once and expires in an hour.
        </FormMessage>
        <p className="mt-6 text-sm">
          <Link href="/login" className={linkClass}>
            Back to log in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <Heading title="Reset your password" lead="We'll email you a link to set a new one." />
      <form action={action} className="grid gap-5" noValidate>
        {state.message && <FormMessage tone="error">{state.message}</FormMessage>}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          error={state.errors?.email}
        />
        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, idle);
  return (
    <>
      <Heading title="Set a new password" />
      <form action={action} className="grid gap-5" noValidate>
        {state.message && <FormMessage tone="error">{state.message}</FormMessage>}
        <Field
          label="New password"
          name="password"
          hint={`At least ${PASSWORD_MIN} characters.`}
          revealable
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN}
          error={state.errors?.password}
        />
        <Field
          label="Repeat new password"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          error={state.errors?.confirm}
        />
        <Button type="submit" disabled={pending} className="mt-1 w-full">
          {pending ? "Saving…" : "Save password"}
        </Button>
      </form>
    </>
  );
}

/** Same dimensions as the forms, so nothing jumps when they hydrate. */
export function FormSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <div aria-hidden className="grid animate-pulse gap-5">
      <div className="mb-3 h-9 w-40 bg-rule/40" />
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="grid gap-2">
          <div className="h-4 w-20 bg-rule/40" />
          <div className="h-11 bg-rule/40" />
        </div>
      ))}
      <div className="mt-1 h-11 bg-rule/40" />
    </div>
  );
}
