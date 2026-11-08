"use client";

import Link from "next/link";
import {
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactElement,
  type ReactNode,
} from "react";
import { ArrowDown, ArrowUp, Trash, WarningCircle } from "@phosphor-icons/react";
import { CafePage, type CafePageData } from "@/components/creator/cafe-page";
import { Button } from "@/components/ui/button";
import { Wordmark } from "@/components/marketing/wordmark";
import { brand } from "@/config/brand";
import {
  MAX_BLOCKS,
  MAX_GALLERY_IMAGES,
  type BlockType,
  type PageBlock,
  type PageDocument,
  type PageTheme,
} from "@/modules/pages/document";
import { mediaUrl } from "@/modules/pages/media";
import { publishPage, saveDraft, uploadPageImage } from "@/modules/pages/studio-actions";
import {
  FONT_NAMES,
  FONTS,
  PALETTE_NAMES,
  PALETTES,
  paletteContrast,
  paletteLabel,
  type FontName,
  type Palette,
} from "@/modules/pages/theme";

type Profile = Omit<CafePageData, "document">;
type SaveState = { kind: "idle" | "saving" | "saved" | "error"; message?: string };

const control =
  "block w-full min-h-10 border-2 border-ink bg-sheet px-2.5 text-sm focus:outline-2 focus:outline-offset-2 focus:outline-ink";
const label = "text-xs font-semibold tracking-wide uppercase";

const addable: { type: Exclude<BlockType, "support">; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "quote", label: "Quote" },
  { type: "gallery", label: "Gallery" },
  { type: "divider", label: "Divider" },
  { type: "about", label: "About" },
  { type: "links", label: "Links" },
];

function newBlock(type: Exclude<BlockType, "support">): PageBlock {
  const id = `${type}-${crypto.randomUUID().slice(0, 6)}`;
  switch (type) {
    case "text":
      return { id, type, title: "", body: "" };
    case "quote":
      return { id, type, text: "A line worth remembering.", attribution: "", effect: "none" };
    case "gallery":
      return { id, type, title: "", images: [] };
    case "divider":
      return { id, type, style: "line" };
    default:
      return { id, type };
  }
}

export function Studio({
  initialDocument,
  profile,
}: {
  initialDocument: PageDocument;
  profile: Profile;
}) {
  const [doc, setDoc] = useState(initialDocument);
  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [publish, setPublish] = useState<SaveState>({ kind: "idle" });
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [pane, setPane] = useState<"edit" | "preview">("edit");
  const [, startTransition] = useTransition();
  const first = useRef(true);
  const latest = useRef(doc);

  // Debounced autosave of the draft.
  useEffect(() => {
    latest.current = doc;
    if (first.current) {
      first.current = false;
      return;
    }
    setSave({ kind: "saving" });
    const t = setTimeout(() => {
      startTransition(async () => {
        const r = await saveDraft(doc);
        if (latest.current !== doc) return; // a newer edit will save itself
        setSave(r.ok ? { kind: "saved" } : { kind: "error", message: r.error });
      });
    }, 800);
    return () => clearTimeout(t);
  }, [doc]);

  const setTheme = (patch: Partial<PageTheme>) =>
    setDoc((d) => ({ ...d, theme: { ...d.theme, ...patch } }));
  const setBlock = (id: string, patch: Partial<PageBlock>) =>
    setDoc((d) => ({
      ...d,
      blocks: d.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as PageBlock) : b)),
    }));
  const move = (i: number, by: -1 | 1) =>
    setDoc((d) => {
      const blocks = [...d.blocks];
      const j = i + by;
      if (j < 0 || j >= blocks.length) return d;
      [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
      return { ...d, blocks };
    });
  const remove = (id: string) =>
    setDoc((d) => ({ ...d, blocks: d.blocks.filter((b) => b.id !== id) }));
  const add = (type: Exclude<BlockType, "support">) =>
    setDoc((d) => {
      const at = d.blocks.findIndex((b) => b.type === "support");
      const blocks = [...d.blocks];
      blocks.splice(at === -1 ? blocks.length : at, 0, newBlock(type));
      return { ...d, blocks };
    });

  const onPublish = () =>
    startTransition(async () => {
      setPublish({ kind: "saving" });
      // Make sure the newest edits are saved before publishing them.
      const saved = await saveDraft(latest.current);
      if (!saved.ok) return setPublish({ kind: "error", message: saved.error });
      setSave({ kind: "saved" });
      const r = await publishPage();
      setPublish(r.ok ? { kind: "saved" } : { kind: "error", message: r.error });
    });

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <header className="sticky top-0 z-20 border-b-2 border-ink bg-paper">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" aria-label={`${brand.name} dashboard`}>
              <Wordmark className="h-6 w-auto" />
            </Link>
            <span className="text-sm font-semibold">Page Studio</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span role="status" aria-live="polite" className="text-ink-soft">
              {save.kind === "saving" && "Saving…"}
              {save.kind === "saved" && "Draft saved"}
              {save.kind === "error" && (
                <span className="font-medium text-ink">{save.message}</span>
              )}
            </span>
            <Link
              href={`/${profile.username}`}
              target="_blank"
              className="underline decoration-1 underline-offset-4"
            >
              View live page
            </Link>
            <Button
              variant="stamp"
              size="sm"
              onClick={onPublish}
              disabled={publish.kind === "saving"}
            >
              {publish.kind === "saving" ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </div>
        {publish.kind !== "idle" && publish.kind !== "saving" && (
          <p role="status" className="border-t-2 border-ink bg-sheet px-4 py-2 text-sm md:px-6">
            {publish.kind === "saved" ? (
              <>
                Published. Your page at{" "}
                <Link href={`/${profile.username}`} className="font-medium underline">
                  {brand.domain}/{profile.username}
                </Link>{" "}
                now shows these changes.
              </>
            ) : (
              publish.message
            )}
          </p>
        )}
        <div className="flex border-t-2 border-ink md:hidden" role="tablist">
          {(["edit", "preview"] as const).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={pane === p}
              onClick={() => setPane(p)}
              className={`flex-1 py-2 text-sm font-semibold capitalize ${pane === p ? "bg-ink text-sheet" : ""}`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      <div className="grid flex-1 md:grid-cols-[400px_minmax(0,1fr)]">
        <aside
          aria-label="Page settings"
          className={`border-ink md:block md:border-r-2 ${pane === "edit" ? "block" : "hidden"} md:max-h-[calc(100dvh-56px)] md:overflow-y-auto`}
        >
          <ThemePanel theme={doc.theme} onChange={setTheme} ownerId={profile.ownerId} />
          <section aria-labelledby="blocks-title" className="border-t-2 border-ink p-4">
            <h2 id="blocks-title" className="font-display text-lg">
              Blocks
            </h2>
            <ol className="mt-3 grid gap-3">
              {doc.blocks.map((b, i) => (
                <li key={b.id} className="border-2 border-ink bg-sheet">
                  <div className="flex items-center justify-between gap-2 border-b-2 border-ink px-3 py-1.5">
                    <span className="text-sm font-semibold capitalize">{b.type}</span>
                    <div className="flex gap-1">
                      <IconButton
                        label={`Move ${b.type} up`}
                        onClick={() => move(i, -1)}
                        disabled={i === 0}
                      >
                        <ArrowUp size={14} />
                      </IconButton>
                      <IconButton
                        label={`Move ${b.type} down`}
                        onClick={() => move(i, 1)}
                        disabled={i === doc.blocks.length - 1}
                      >
                        <ArrowDown size={14} />
                      </IconButton>
                      {b.type !== "support" && (
                        <IconButton label={`Remove ${b.type}`} onClick={() => remove(b.id)}>
                          <Trash size={14} />
                        </IconButton>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <BlockEditor
                      block={b}
                      onChange={(patch) => setBlock(b.id, patch)}
                      ownerId={profile.ownerId}
                    />
                  </div>
                </li>
              ))}
            </ol>
            {doc.blocks.length < MAX_BLOCKS && (
              <div className="mt-4 grid gap-2">
                <span className={label}>Add a block</span>
                <div className="flex flex-wrap gap-2">
                  {addable.map((a) => (
                    <button
                      key={a.type}
                      type="button"
                      onClick={() => add(a.type)}
                      className="min-h-9 border-2 border-ink bg-sheet px-3 text-sm font-medium hover:bg-ink hover:text-sheet"
                    >
                      + {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </aside>

        <section
          aria-label="Preview"
          className={`${pane === "preview" ? "block" : "hidden"} md:block md:max-h-[calc(100dvh-56px)] md:overflow-y-auto`}
        >
          <div className="flex items-center justify-between gap-3 border-b-2 border-ink bg-sheet px-4 py-2 text-sm">
            <span className="text-ink-soft">Preview of your draft</span>
            <div className="flex gap-1" role="group" aria-label="Preview width">
              {(["desktop", "mobile"] as const).map((v) => (
                <button
                  key={v}
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={`border-2 border-ink px-2.5 py-0.5 capitalize ${view === v ? "bg-ink text-sheet" : ""}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div
            className={`mx-auto ${view === "mobile" ? "max-w-[390px] border-x-2 border-ink" : ""}`}
          >
            <CafePage preview page={{ ...profile, document: doc }} />
          </div>
        </section>
      </div>
    </div>
  );
}

function IconButton({
  label: text,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={text}
      title={text}
      onClick={onClick}
      disabled={disabled}
      className="grid size-8 place-items-center border-2 border-ink hover:bg-ink hover:text-sheet disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/** Explicit label/id pairing, so a field's accessible name is just its label. */
function Labelled({ text, children }: { text: string; children: ReactElement<{ id?: string }> }) {
  const id = useId();
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className={label}>
        {text}
      </label>
      {cloneElement(children, { id })}
    </div>
  );
}

function ThemePanel({
  theme,
  onChange,
  ownerId,
}: {
  theme: PageTheme;
  onChange: (p: Partial<PageTheme>) => void;
  ownerId: string;
}) {
  const custom: Palette = theme.custom ?? PALETTES.newsprint;
  const active: Palette = theme.palette === "custom" ? custom : PALETTES[theme.palette];
  const contrast = paletteContrast(active);
  const lowContrast = contrast.textOnBackground < 4.5 || contrast.textOnSurface < 4.5;
  const [coverError, setCoverError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  return (
    <section aria-labelledby="theme-title" className="grid gap-5 p-4">
      <h2 id="theme-title" className="font-display text-lg">
        Look
      </h2>

      <fieldset className="grid gap-2">
        <legend className={`${label} mb-1.5`}>Colours</legend>
        <div className="grid grid-cols-3 gap-2">
          {[...PALETTE_NAMES, "custom" as const].map((name) => {
            const p = name === "custom" ? custom : PALETTES[name];
            return (
              <button
                key={name}
                type="button"
                aria-pressed={theme.palette === name}
                onClick={() =>
                  onChange({ palette: name, custom: name === "custom" ? custom : theme.custom })
                }
                className={`border-2 p-1.5 text-left text-xs ${theme.palette === name ? "border-ink bg-ink text-sheet" : "border-ink bg-sheet"}`}
              >
                <span aria-hidden className="mb-1 flex h-5 border border-ink">
                  <span className="flex-1" style={{ background: p.background }} />
                  <span className="flex-1" style={{ background: p.surface }} />
                  <span className="flex-1" style={{ background: p.accent }} />
                  <span className="flex-1" style={{ background: p.text }} />
                </span>
                {name === "custom" ? "Custom" : paletteLabel[name]}
              </button>
            );
          })}
        </div>
        {theme.palette === "custom" && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(Object.keys(custom) as (keyof Palette)[]).map((k) => (
              <label key={k} className="flex items-center gap-2 text-xs">
                <input
                  type="color"
                  value={
                    custom[k].length === 4
                      ? `#${[...custom[k].slice(1)].map((c) => c + c).join("")}`
                      : custom[k]
                  }
                  onChange={(e) => onChange({ custom: { ...custom, [k]: e.target.value } })}
                  className="h-8 w-10 cursor-pointer border-2 border-ink bg-sheet"
                />
                {k.replace(/([A-Z])/g, " $1").toLowerCase()}
              </label>
            ))}
          </div>
        )}
        <p
          className={`flex items-start gap-1.5 text-xs ${lowContrast ? "font-semibold" : "text-ink-soft"}`}
        >
          {lowContrast && <WarningCircle aria-hidden size={14} className="mt-px shrink-0" />}
          Text contrast {contrast.textOnBackground.toFixed(1)}:1 on background,{" "}
          {contrast.textOnSurface.toFixed(1)}:1 on panels.
          {lowContrast ? " Below 4.5:1 is hard to read; pick darker text or lighter panels." : ""}
        </p>
      </fieldset>

      <div className="grid gap-3">
        <span className={label}>Typefaces (up to three)</span>
        {(["display", "body", "accent"] as const).map((role) => (
          <Labelled
            key={role}
            text={role === "display" ? "Headings" : role === "body" ? "Body text" : "Details"}
          >
            <select
              value={theme.fonts[role]}
              onChange={(e) =>
                onChange({ fonts: { ...theme.fonts, [role]: e.target.value as FontName } })
              }
              className={control}
            >
              {FONT_NAMES.map((f) => (
                <option key={f} value={f}>
                  {FONTS[f].label}
                </option>
              ))}
            </select>
          </Labelled>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Labelled text="Border">
          <select
            value={theme.border.width}
            onChange={(e) =>
              onChange({
                border: {
                  ...theme.border,
                  width: Number(e.target.value) as PageTheme["border"]["width"],
                },
              })
            }
            className={control}
          >
            {[0, 1, 2, 3, 4].map((w) => (
              <option key={w} value={w}>
                {w === 0 ? "None" : `${w}px`}
              </option>
            ))}
          </select>
        </Labelled>
        <Labelled text="Border style">
          <select
            value={theme.border.style}
            onChange={(e) =>
              onChange({
                border: { ...theme.border, style: e.target.value as PageTheme["border"]["style"] },
              })
            }
            className={control}
          >
            <option value="solid">Solid</option>
            <option value="double">Double</option>
            <option value="dashed">Dashed</option>
          </select>
        </Labelled>
        <Labelled text="Corners">
          <select
            value={theme.radius}
            onChange={(e) => onChange({ radius: Number(e.target.value) as PageTheme["radius"] })}
            className={control}
          >
            <option value={0}>Square</option>
            <option value={4}>Slightly rounded</option>
            <option value={10}>Rounded</option>
            <option value={20}>Very rounded</option>
          </select>
        </Labelled>
        <Labelled text="Shadow">
          <select
            value={theme.shadow}
            onChange={(e) => onChange({ shadow: e.target.value as PageTheme["shadow"] })}
            className={control}
          >
            <option value="none">None</option>
            <option value="hard">Hard (comic)</option>
            <option value="soft">Soft</option>
          </select>
        </Labelled>
        <Labelled text="Image shape">
          <select
            value={theme.imageShape}
            onChange={(e) => onChange({ imageShape: e.target.value as PageTheme["imageShape"] })}
            className={control}
          >
            <option value="square">Square</option>
            <option value="circle">Circle</option>
            <option value="slant">Slanted</option>
            <option value="arch">Arch</option>
          </select>
        </Labelled>
        <Labelled text="Background">
          <select
            value={theme.background}
            onChange={(e) => onChange({ background: e.target.value as PageTheme["background"] })}
            className={control}
          >
            <option value="plain">Plain</option>
            <option value="tone">Halftone dots</option>
            <option value="lines">Ruled lines</option>
          </select>
        </Labelled>
      </div>

      <div className="grid gap-2">
        <span className={label}>Cover image</span>
        {theme.coverPath && (
          // eslint-disable-next-line @next/next/no-img-element -- storage URL preview
          <img
            src={mediaUrl("covers", ownerId, theme.coverPath) ?? ""}
            alt="Current cover"
            className="aspect-[3/1] w-full border-2 border-ink object-cover"
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex min-h-9 cursor-pointer items-center border-2 border-ink bg-sheet px-3 text-sm font-medium hover:bg-ink hover:text-sheet">
            {uploading ? "Uploading…" : theme.coverPath ? "Replace cover" : "Upload cover"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setUploading(true);
                setCoverError(null);
                const fd = new FormData();
                fd.set("kind", "cover");
                fd.set("file", f);
                const r = await uploadPageImage(fd);
                setUploading(false);
                if (r.ok) onChange({ coverPath: r.path });
                else setCoverError(r.error);
                e.target.value = "";
              }}
            />
          </label>
          {theme.coverPath && (
            <button
              type="button"
              onClick={() => onChange({ coverPath: null })}
              className="text-sm underline"
            >
              Remove
            </button>
          )}
        </div>
        <p className="text-xs text-ink-soft">
          Wide images work best (3:1). JPEG, PNG or WebP, up to 5 MB.
        </p>
        {coverError && <p className="text-sm font-medium">{coverError}</p>}
      </div>
    </section>
  );
}

function BlockEditor({
  block,
  onChange,
  ownerId,
}: {
  block: PageBlock;
  onChange: (patch: Partial<PageBlock>) => void;
  ownerId: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  switch (block.type) {
    case "about":
      return (
        <p className="text-sm text-ink-soft">
          Shows your bio. Edit it from &ldquo;Edit your page&rdquo;.
        </p>
      );
    case "links":
      return (
        <p className="text-sm text-ink-soft">
          Shows your links. Edit them from &ldquo;Edit your page&rdquo;.
        </p>
      );
    case "support":
      return (
        <p className="text-sm text-ink-soft">
          The support panel. You can move it, but every page keeps exactly one.
        </p>
      );
    case "text":
      return (
        <div className="grid gap-2">
          <Labelled text="Title">
            <input
              value={block.title}
              maxLength={80}
              onChange={(e) => onChange({ title: e.target.value })}
              className={control}
            />
          </Labelled>
          <Labelled text="Text">
            <textarea
              value={block.body}
              maxLength={3000}
              rows={4}
              onChange={(e) => onChange({ body: e.target.value })}
              className={`${control} py-2`}
            />
          </Labelled>
        </div>
      );
    case "quote":
      return (
        <div className="grid gap-2">
          <Labelled text="Quote">
            <textarea
              value={block.text}
              maxLength={280}
              rows={2}
              onChange={(e) => onChange({ text: e.target.value })}
              className={`${control} py-2`}
            />
          </Labelled>
          <Labelled text="Attribution">
            <input
              value={block.attribution}
              maxLength={80}
              onChange={(e) => onChange({ attribution: e.target.value })}
              className={control}
            />
          </Labelled>
          <Labelled text="Effect">
            <select
              value={block.effect}
              onChange={(e) => onChange({ effect: e.target.value as "none" | "pulse" })}
              className={control}
            >
              <option value="none">None</option>
              <option value="pulse">Slow pulse</option>
            </select>
          </Labelled>
        </div>
      );
    case "divider":
      return (
        <Labelled text="Style">
          <select
            value={block.style}
            onChange={(e) => onChange({ style: e.target.value as "line" | "tone" | "space" })}
            className={control}
          >
            <option value="line">Line</option>
            <option value="tone">Halftone band</option>
            <option value="space">Empty space</option>
          </select>
        </Labelled>
      );
    case "gallery":
      return (
        <div className="grid gap-2">
          <Labelled text="Title">
            <input
              value={block.title}
              maxLength={80}
              onChange={(e) => onChange({ title: e.target.value })}
              className={control}
            />
          </Labelled>
          {block.images.length > 0 && (
            <ul className="grid gap-2">
              {block.images.map((img, i) => (
                <li key={img.path} className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element -- storage URL thumbnail */}
                  <img
                    src={mediaUrl("page-media", ownerId, img.path) ?? ""}
                    alt=""
                    className="size-12 shrink-0 border-2 border-ink object-cover"
                  />
                  <input
                    aria-label={`Description of image ${i + 1}`}
                    placeholder="Describe the image"
                    value={img.alt}
                    maxLength={140}
                    onChange={(e) =>
                      onChange({
                        images: block.images.map((x, j) =>
                          j === i ? { ...x, alt: e.target.value } : x,
                        ),
                      })
                    }
                    className={`${control} min-w-0`}
                  />
                  <IconButton
                    label={`Remove image ${i + 1}`}
                    onClick={() => onChange({ images: block.images.filter((_, j) => j !== i) })}
                  >
                    <Trash size={14} />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
          {block.images.length < MAX_GALLERY_IMAGES && (
            <label className="inline-flex min-h-9 w-fit cursor-pointer items-center border-2 border-ink bg-sheet px-3 text-sm font-medium hover:bg-ink hover:text-sheet">
              {uploading ? "Uploading…" : "Add image"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploading(true);
                  setError(null);
                  const fd = new FormData();
                  fd.set("kind", "gallery");
                  fd.set("file", f);
                  const r = await uploadPageImage(fd);
                  setUploading(false);
                  if (r.ok) onChange({ images: [...block.images, { path: r.path, alt: "" }] });
                  else setError(r.error);
                  e.target.value = "";
                }}
              />
            </label>
          )}
          {error && <p className="text-sm font-medium">{error}</p>}
        </div>
      );
    default:
      return null;
  }
}
