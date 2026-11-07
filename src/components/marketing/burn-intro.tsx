"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Wordmark } from "./wordmark";
import { createBurnRenderer } from "./burn-shader";

type IntroState = "pending" | "done" | "off";

const SEEN_KEY = "coffea.intro.seen";
/** Shader threshold at scroll start and end. Below ~0.12 nothing burns; above ~1.05 everything has. */
const T_START = 0.12;
const T_END = 1.06;

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return false;
  }
}
const noopSubscribe = () => () => {};
/** True when the intro should not play: reduced motion or already seen. */
function shouldSkipIntro(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches || readSeen();
}

function writeSeen() {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    /* storage unavailable: the intro simply plays again next time */
  }
}

/**
 * Landing intro (DESIGN.md §1b): a paper sheet with the wordmark written in
 * ink; scrolling burns it away to reveal `children`, which stay pinned
 * (CSS sticky) while the sheet burns. Skipped for reduced motion, for
 * returning visitors, without JS, and without WebGL.
 */
export function BurnIntro({ children }: { children: ReactNode }) {
  const [progressState, setState] = useState<IntroState>("pending");
  // Server snapshot is "play" so the sheet is in the first paint (no flash of content).
  const skip = useSyncExternalStore(noopSubscribe, shouldSkipIntro, () => false);
  const state: IntroState = skip ? "off" : progressState;
  const spacerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skipRef = useRef<() => void>(() => {});

  useEffect(() => {
    const spacer = spacerRef.current;
    const overlay = overlayRef.current;
    const canvas = canvasRef.current;
    if (skip || !spacer || !overlay || !canvas) return;

    // 1.25x is visually identical for a noise field and roughly halves GPU
    // work on retina screens, which is what keeps the scrub smooth.
    const renderer = createBurnRenderer(canvas, 1.25);
    if (!renderer) {
      // No WebGL: drop the intro on the next frame.
      const id = requestAnimationFrame(() => setState("off"));
      return () => cancelAnimationFrame(id);
    }

    gsap.registerPlugin(ScrollTrigger);
    const inertTargets = document.querySelectorAll<HTMLElement>("[data-intro-inert]");
    inertTargets.forEach((el) => (el.inert = true));

    const params = { progress: 0 };
    let raf = 0;
    let finished = false;
    let firstFrame = true;

    const frame = (now: number) => {
      renderer.draw(T_START + (T_END - T_START) * params.progress, now);
      // Finish when the burn has actually completed, not when the trigger is
      // passed: scrub smoothing lags behind the scrollbar.
      if (params.progress >= 0.999) {
        finish();
        return;
      }
      if (firstFrame) {
        // The CSS sheet covered the page until WebGL could draw the same paper.
        overlay.style.background = "transparent";
        firstFrame = false;
      }
      raf = requestAnimationFrame(frame);
    };

    const onResize = () => renderer.resize();
    renderer.resize();
    window.addEventListener("resize", onResize);
    raf = requestAnimationFrame(frame);
    overlay.dataset.ready = "true"; // interactive from here on (used by e2e tests)

    function finish() {
      if (finished || !spacer) return;
      finished = true;
      cancelAnimationFrame(raf);
      ctx.revert();
      inertTargets.forEach((el) => (el.inert = false));
      writeSeen();
      // Collapse the scroll runway and move the scroll position by the same
      // amount in the same frame, so nothing visibly jumps and the page then
      // scrolls normally in both directions.
      const hero = spacer.firstElementChild as HTMLElement | null;
      const extra = spacer.offsetHeight - (hero?.offsetHeight ?? window.innerHeight);
      spacer.style.minHeight = "0px";
      window.scrollTo({ top: Math.max(0, window.scrollY - extra), behavior: "instant" });
      setState("done");
    }

    // Declared after finish(), which only runs from later frames/callbacks.
    const ctx = gsap.context(() => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: spacer,
            start: "top top",
            end: "bottom bottom",
            // Seconds the burn takes to catch up with the scrollbar: absorbs
            // stepped mouse-wheel input into one continuous motion.
            scrub: 1.1,
          },
        })
        .to(params, { progress: 1, ease: "none", duration: 1 }, 0)
        .to(labelsRef.current, { opacity: 0, duration: 0.08 }, 0);
    });

    skipRef.current = () => {
      ctx.revert();
      gsap.to(labelsRef.current, { opacity: 0, duration: 0.2 });
      gsap.to(params, { progress: 1, duration: 1.4, ease: "power1.inOut" });
    };

    return () => {
      ctx.revert();
      gsap.killTweensOf(params);
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      inertTargets.forEach((el) => (el.inert = false));
      renderer.dispose();
    };
  }, [skip]);

  const overlayVisible = state === "pending";

  return (
    <>
      <div ref={spacerRef} className="intro-spacer relative" data-intro={state}>
        <div className="sticky top-0" data-intro-inert>
          {children}
        </div>
      </div>

      {overlayVisible && (
        <div
          ref={overlayRef}
          className="burn-overlay fixed inset-0 z-40 bg-sheet"
          role="dialog"
          aria-label="Introduction"
        >
          <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" />
          <div
            ref={labelsRef}
            className="relative mx-auto grid min-h-[100dvh] max-w-6xl grid-rows-[1fr_auto] px-4 pb-8 md:px-8 md:pb-12"
          >
            <div className="flex items-center">
              <Wordmark animated className="w-[min(92vw,64rem)] text-ink md:-ml-4" />
            </div>
            <div className="flex items-center justify-between gap-6">
              <p className="ink-after max-w-[28ch] text-sm text-ink-soft [--ink-after-delay:2.4s]">
                Scroll to open the page.
              </p>
              <button
                type="button"
                onClick={() => skipRef.current()}
                className="min-h-11 px-1 text-sm text-ink-soft underline decoration-1 underline-offset-4 hover:text-ink"
              >
                Skip intro
              </button>
            </div>
          </div>
        </div>
      )}
      <noscript>
        <style>{`.burn-overlay{display:none!important}.intro-spacer{min-height:0!important}`}</style>
      </noscript>
    </>
  );
}
