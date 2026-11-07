import { useId } from "react";
import { brand } from "@/config/brand";
import { wordmark } from "./wordmark-data";

/** Pen timing per stroke, in writing order (seconds). */
const STROKE_SECONDS = [0.9, 0.55, 0.6, 0.6, 0.45, 0.55] as const;
const START_DELAY = 0.35;
const GAP = 0.06;

/** Precomputed once: when each stroke starts, and when writing ends. */
const { timings, total } = wordmark.strokes.reduce(
  (acc, _, i) => {
    const duration = STROKE_SECONDS[i] ?? 0.5;
    return {
      timings: [...acc.timings, { delay: acc.total, duration }],
      total: acc.total + duration + GAP,
    };
  },
  { timings: [] as { delay: number; duration: number }[], total: START_DELAY },
);

type Props = {
  className?: string;
  /** Write the wordmark stroke by stroke instead of showing it complete. */
  animated?: boolean;
};

/**
 * The Coffea wordmark. Static by default; `animated` draws it in ink with
 * CSS only (no JS), clipped by the glyph outlines. Reduced motion shows the
 * finished mark immediately (see globals.css `.ink-*`).
 */
export function Wordmark({ className, animated = false }: Props) {
  const clipId = `ink-${useId().replace(/[^\w-]/g, "")}`;
  const label = brand.name;

  if (!animated) {
    return (
      <svg
        viewBox={`0 0 ${wordmark.width} ${wordmark.height}`}
        className={className}
        role="img"
        aria-label={label}
      >
        <path d={wordmark.glyph} fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${wordmark.width} ${wordmark.height}`}
      className={className}
      role="img"
      aria-label={label}
      style={{ ["--ink-total" as string]: `${total}s` }}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={wordmark.glyph} />
        </clipPath>
      </defs>
      <g
        clipPath={`url(#${clipId})`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {wordmark.strokes.map((stroke, i) => (
          <path
            key={i}
            d={stroke.d}
            strokeWidth={stroke.width}
            pathLength={1}
            className="ink-stroke"
            style={{
              ["--ink-delay" as string]: `${timings[i].delay}s`,
              ["--ink-duration" as string]: `${timings[i].duration}s`,
            }}
          />
        ))}
      </g>
      {/* Settles the slivers a broad pen can miss once writing finishes. */}
      <path d={wordmark.glyph} fill="currentColor" className="ink-settle" />
    </svg>
  );
}
