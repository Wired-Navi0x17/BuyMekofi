"use client";

import { useRouter } from "next/navigation";
import { cloneElement, useId, useState, useTransition, type ReactElement } from "react";
import { ArrowDown, ArrowUp, Trash } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { Content, ContentKey } from "@/modules/cms/content";
import {
  publishContent,
  restoreContentVersion,
  saveContentDraft,
} from "@/modules/cms/admin-actions";

const input =
  "block w-full border-2 border-ink bg-sheet px-3 py-2 text-sm focus:outline-2 focus:outline-offset-2 focus:outline-ink";

function Field({ label, children }: { label: string; children: ReactElement<{ id?: string }> }) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}

type Status = { kind: "idle" | "busy" | "ok" | "error"; text?: string };

export function ContentEditor<K extends ContentKey>({
  contentKey,
  initial,
}: {
  contentKey: K;
  initial: Content<K>;
}) {
  const [value, setValue] = useState<Content<K>>(initial);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, start] = useTransition();
  const router = useRouter();

  const save = (andPublish: boolean) =>
    start(async () => {
      setStatus({ kind: "busy" });
      const saved = await saveContentDraft(contentKey, value);
      if (!saved.ok) return setStatus({ kind: "error", text: saved.error });
      if (!andPublish)
        return setStatus({ kind: "ok", text: "Draft saved. It isn't live until you publish." });
      const pub = await publishContent(contentKey);
      if (!pub.ok) return setStatus({ kind: "error", text: pub.error });
      setStatus({ kind: "ok", text: "Published. The homepage now shows this." });
      router.refresh();
    });

  return (
    <form
      className="grid gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        save(false);
      }}
    >
      <Fields contentKey={contentKey} value={value} onChange={setValue} />
      <div className="flex flex-wrap items-center gap-3 border-t-2 border-ink pt-4">
        <Button type="submit" variant="secondary" disabled={pending}>
          Save draft
        </Button>
        <Button type="button" variant="stamp" disabled={pending} onClick={() => save(true)}>
          {pending ? "Working…" : "Save and publish"}
        </Button>
        {status.text && (
          <p
            role={status.kind === "error" ? "alert" : "status"}
            className={`text-sm ${status.kind === "error" ? "font-semibold" : ""}`}
          >
            {status.text}
          </p>
        )}
      </div>
    </form>
  );
}

/* Per-key forms. Values are plain text; the site renders them escaped. */
function Fields<K extends ContentKey>({
  contentKey,
  value,
  onChange,
}: {
  contentKey: K;
  value: Content<K>;
  onChange: (v: Content<K>) => void;
}) {
  // Narrowed views of the generic value for each key.
  const set = (patch: object) => onChange({ ...(value as object), ...patch } as Content<K>);

  switch (contentKey) {
    case "landing.hero": {
      const v = value as Content<"landing.hero">;
      return (
        <>
          <Field label="Headline">
            <input
              value={v.title}
              maxLength={120}
              onChange={(e) => set({ title: e.target.value })}
              className={input}
            />
          </Field>
          <Field label="Second line (outlined lettering)">
            <input
              value={v.highlight}
              maxLength={120}
              onChange={(e) => set({ highlight: e.target.value })}
              className={input}
            />
          </Field>
          <Field label="Intro paragraph">
            <textarea
              value={v.body}
              maxLength={600}
              rows={4}
              onChange={(e) => set({ body: e.target.value })}
              className={input}
            />
          </Field>
          <Field label="Status note (under the claim box)">
            <textarea
              value={v.status}
              maxLength={300}
              rows={2}
              onChange={(e) => set({ status: e.target.value })}
              className={input}
            />
          </Field>
        </>
      );
    }
    case "landing.pricing_note": {
      const v = value as Content<"landing.pricing_note">;
      return (
        <Field label="Note">
          <textarea
            value={v.body}
            maxLength={600}
            rows={4}
            onChange={(e) => set({ body: e.target.value })}
            className={input}
          />
        </Field>
      );
    }
    case "site.announcement": {
      const v = value as Content<"site.announcement">;
      return (
        <>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={v.enabled}
              onChange={(e) => set({ enabled: e.target.checked })}
              className="size-5 accent-ink"
            />
            Show the announcement bar
          </label>
          <Field label="Text">
            <input
              value={v.text}
              maxLength={200}
              onChange={(e) => set({ text: e.target.value })}
              className={input}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Link label (optional)">
              <input
                value={v.linkLabel}
                maxLength={40}
                onChange={(e) => set({ linkLabel: e.target.value })}
                className={input}
              />
            </Field>
            <Field label="Link address (/path or https://)">
              <input
                value={v.linkHref}
                maxLength={500}
                onChange={(e) => set({ linkHref: e.target.value })}
                className={input}
              />
            </Field>
          </div>
        </>
      );
    }
    case "landing.steps": {
      const v = value as Content<"landing.steps">;
      const setItem = (i: number, patch: object) =>
        set({ items: v.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
      return (
        <>
          <Field label="Section title">
            <input
              value={v.title}
              maxLength={120}
              onChange={(e) => set({ title: e.target.value })}
              className={input}
            />
          </Field>
          {v.items.map((it, i) => (
            <fieldset key={i} className="grid gap-3 border-2 border-ink p-4">
              <legend className="px-1 text-sm font-semibold">Panel {i + 1}</legend>
              <Field label="Comic word">
                <input
                  value={it.sfx}
                  maxLength={14}
                  onChange={(e) => setItem(i, { sfx: e.target.value })}
                  className={input}
                />
              </Field>
              <Field label="Title">
                <input
                  value={it.title}
                  maxLength={80}
                  onChange={(e) => setItem(i, { title: e.target.value })}
                  className={input}
                />
              </Field>
              <Field label="Text">
                <textarea
                  value={it.body}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setItem(i, { body: e.target.value })}
                  className={input}
                />
              </Field>
            </fieldset>
          ))}
        </>
      );
    }
    case "landing.faq": {
      const v = value as Content<"landing.faq">;
      const items = v.items;
      const setItems = (next: typeof items) => set({ items: next });
      return (
        <>
          <Field label="Section title">
            <input
              value={v.title}
              maxLength={120}
              onChange={(e) => set({ title: e.target.value })}
              className={input}
            />
          </Field>
          {items.map((it, i) => (
            <fieldset key={i} className="grid gap-3 border-2 border-ink p-4">
              <legend className="px-1 text-sm font-semibold">Question {i + 1}</legend>
              <div className="flex justify-end gap-1">
                {[
                  {
                    label: "Move up",
                    icon: <ArrowUp size={14} />,
                    disabled: i === 0,
                    run: () => setItems(swap(items, i, i - 1)),
                  },
                  {
                    label: "Move down",
                    icon: <ArrowDown size={14} />,
                    disabled: i === items.length - 1,
                    run: () => setItems(swap(items, i, i + 1)),
                  },
                  {
                    label: "Remove",
                    icon: <Trash size={14} />,
                    disabled: items.length === 1,
                    run: () => setItems(items.filter((_, j) => j !== i)),
                  },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    aria-label={`${b.label} question ${i + 1}`}
                    disabled={b.disabled}
                    onClick={b.run}
                    className="grid size-8 place-items-center border-2 border-ink hover:bg-ink hover:text-sheet disabled:opacity-30"
                  >
                    {b.icon}
                  </button>
                ))}
              </div>
              <Field label="Question">
                <input
                  value={it.q}
                  maxLength={160}
                  onChange={(e) =>
                    setItems(items.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))
                  }
                  className={input}
                />
              </Field>
              <Field label="Answer">
                <textarea
                  value={it.a}
                  maxLength={1200}
                  rows={4}
                  onChange={(e) =>
                    setItems(items.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))
                  }
                  className={input}
                />
              </Field>
            </fieldset>
          ))}
          {items.length < 20 && (
            <button
              type="button"
              onClick={() => setItems([...items, { q: "", a: "" }])}
              className="min-h-10 w-fit border-2 border-ink px-4 text-sm font-medium hover:bg-ink hover:text-sheet"
            >
              + Add a question
            </button>
          )}
        </>
      );
    }
    default:
      return null;
  }
}

function swap<T>(arr: T[], i: number, j: number): T[] {
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function RestoreButton({
  contentKey,
  versionId,
}: {
  contentKey: ContentKey;
  versionId: number;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();
  return (
    <span className="text-right">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await restoreContentVersion(contentKey, versionId);
            setMsg(r.ok ? "Copied to draft" : r.error);
            if (r.ok) router.refresh();
          })
        }
        className="underline underline-offset-4"
      >
        {pending ? "Restoring…" : "Restore to draft"}
      </button>
      {msg && <span className="block text-xs text-ink-soft">{msg}</span>}
    </span>
  );
}
