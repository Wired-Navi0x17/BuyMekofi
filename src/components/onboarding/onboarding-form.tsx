"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Plus, X } from "@phosphor-icons/react";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Field, FormMessage } from "@/components/ui/field";
import { completeOnboarding, type OnboardingState } from "@/modules/profiles/onboarding";
import {
  MAX_LINKS,
  PLATFORMS,
  platformLabel,
  type Platform,
} from "@/modules/profiles/onboarding-schema";

type Defaults = {
  username: string;
  displayName: string;
  bio: string;
  hasAvatar: boolean;
  links: { platform: Platform; url: string }[];
};

// No width here: each control sets its own (w-full for single fields).
const inputBase =
  "block border-2 border-ink bg-sheet px-3 text-base focus:outline-2 focus:outline-offset-2 focus:outline-ink";

export function OnboardingForm({ defaults, editing }: { defaults: Defaults; editing: boolean }) {
  const [state, action, pending] = useActionState(completeOnboarding, {} as OnboardingState);
  const errors = state.errors ?? {};
  const ids = { username: useId(), bio: useId(), avatar: useId() };
  const [bioLength, setBioLength] = useState(defaults.bio.length);
  const [preview, setPreview] = useState<string | null>(null);
  const [links, setLinks] = useState(
    defaults.links.length > 0 ? defaults.links : [{ platform: "instagram" as Platform, url: "" }],
  );

  // Revoke object URLs created for the photo preview.
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-[1.75rem] leading-tight font-medium tracking-tight">
          {editing ? "Edit your page" : "Set up your page"}
        </h1>
        <p className="mt-2 text-ink-soft">
          {editing
            ? "Changes go live when you publish."
            : "Four things and you're live. You can change all of it later."}
        </p>
      </header>

      <form action={action} className="grid gap-6" noValidate>
        {errors.form && <FormMessage tone="error">{errors.form}</FormMessage>}

        {/* Photo */}
        <div className="flex items-center gap-4">
          <div className="grid size-20 shrink-0 place-items-center overflow-hidden border-[3px] border-ink bg-paper">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img src={preview} alt="" className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden className="h-full w-full tone-light opacity-40" />
            )}
          </div>
          <div className="grid gap-1">
            <label htmlFor={ids.avatar} className="text-sm font-medium">
              Photo{" "}
              {defaults.hasAvatar && !preview
                ? "(you have one; choose a file to replace it)"
                : "(optional)"}
            </label>
            <input
              id={ids.avatar}
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-describedby={`${ids.avatar}-hint`}
              onChange={(e) => {
                const f = e.target.files?.[0];
                setPreview(f ? URL.createObjectURL(f) : null);
              }}
              className="text-sm file:mr-3 file:min-h-10 file:cursor-pointer file:border-2 file:border-ink file:bg-sheet file:px-3 file:font-medium"
            />
            <p id={`${ids.avatar}-hint`} className="text-xs text-ink-soft">
              JPEG, PNG or WebP, up to 2 MB.
            </p>
            {errors.avatar && <p className="text-sm font-medium">{errors.avatar}</p>}
          </div>
        </div>

        <Field
          label="Name on your page"
          name="displayName"
          required
          maxLength={60}
          defaultValue={defaults.displayName}
          autoComplete="name"
          error={errors.displayName}
        />

        {/* Username */}
        <div className="grid gap-2">
          <label htmlFor={ids.username} className="text-sm font-medium">
            Page address
          </label>
          <div className="flex min-h-11 items-stretch border-2 border-ink bg-sheet focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ink">
            <span aria-hidden className="flex items-center pl-3 tabular text-ink-soft select-none">
              {brand.domain}/
            </span>
            <input
              id={ids.username}
              name="username"
              defaultValue={defaults.username}
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              maxLength={40}
              aria-invalid={errors.username ? true : undefined}
              className="min-w-0 flex-1 bg-transparent pr-3 tabular focus:outline-none"
            />
          </div>
          {errors.username && <p className="text-sm font-medium">{errors.username}</p>}
        </div>

        {/* Bio */}
        <div className="grid gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor={ids.bio} className="text-sm font-medium">
              About you (optional)
            </label>
            <span className="text-xs tabular text-ink-soft">{bioLength}/500</span>
          </div>
          <textarea
            id={ids.bio}
            name="bio"
            rows={4}
            maxLength={500}
            defaultValue={defaults.bio}
            onChange={(e) => setBioLength(e.target.value.length)}
            placeholder="What you make, and who it's for."
            className={`${inputBase} w-full py-2 leading-relaxed`}
          />
          {errors.bio && <p className="text-sm font-medium">{errors.bio}</p>}
        </div>

        {/* Links */}
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">Links (optional)</legend>
          {links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <select
                name="linkPlatform"
                aria-label={`Link ${i + 1} type`}
                value={link.platform}
                onChange={(e) =>
                  setLinks((ls) =>
                    ls.map((l, j) =>
                      j === i ? { ...l, platform: e.target.value as Platform } : l,
                    ),
                  )
                }
                className={`${inputBase} min-h-11 w-32 shrink-0 sm:w-36`}
              >
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {platformLabel[p]}
                  </option>
                ))}
              </select>
              <input
                name="linkUrl"
                aria-label={`Link ${i + 1} address`}
                inputMode="url"
                placeholder="instagram.com/yourname"
                value={link.url}
                onChange={(e) =>
                  setLinks((ls) => ls.map((l, j) => (j === i ? { ...l, url: e.target.value } : l)))
                }
                className={`${inputBase} min-h-11 min-w-0 flex-1`}
              />
              <button
                type="button"
                aria-label={`Remove link ${i + 1}`}
                onClick={() => setLinks((ls) => ls.filter((_, j) => j !== i))}
                className="grid size-11 shrink-0 place-items-center border-2 border-ink hover:bg-ink hover:text-sheet"
              >
                <X size={16} aria-hidden />
              </button>
            </div>
          ))}
          {links.length < MAX_LINKS && (
            <button
              type="button"
              onClick={() => setLinks((ls) => [...ls, { platform: "website", url: "" }])}
              className="flex w-fit items-center gap-1.5 text-sm font-medium underline decoration-1 underline-offset-4"
            >
              <Plus size={14} aria-hidden /> Add a link
            </button>
          )}
          {errors.links && <p className="text-sm font-medium">{errors.links}</p>}
        </fieldset>

        <Button type="submit" variant="stamp" disabled={pending} className="mt-2 w-full">
          {pending ? "Publishing…" : editing ? "Publish changes" : "Publish my page"}
        </Button>
      </form>
    </>
  );
}
