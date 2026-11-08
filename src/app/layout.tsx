import type { Metadata, Viewport } from "next";
import { Dela_Gothic_One, Geist } from "next/font/google";
import { brand } from "@/config/brand";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const delaGothic = Dela_Gothic_One({
  variable: "--font-dela-gothic",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: { default: `${brand.name}: ${brand.tagline}`, template: `%s · ${brand.name}` },
  // The site is designed light-only; ask Dark Reader not to rewrite it
  // (its DOM edits also caused hydration warnings).
  other: { "darkreader-lock": "true" },
  description:
    "A page for Indian creators with your links, portfolio and a support panel. The page is free; commission applies only to contributions processed through us.",
};

export const viewport: Viewport = {
  themeColor: "#f7f7f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      // Smooth for in-page anchors (CSS); Next keeps route changes instant.
      data-scroll-behavior="smooth"
      // Extensions (password managers, translators) add attributes to <html>.
      suppressHydrationWarning
      className={`${geist.variable} ${delaGothic.variable} antialiased`}
    >
      <body className="min-h-[100dvh] bg-paper text-ink">
        {/* Pencil-wobble filters for hand-drawn outlines (the `panel` utility). */}
        <svg aria-hidden width="0" height="0" className="absolute">
          <filter id="sketch">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="7" />
            <feDisplacementMap
              in="SourceGraphic"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <filter id="sketch-light">
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="1" seed="21" />
            <feDisplacementMap
              in="SourceGraphic"
              scale="2.2"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </svg>
        {children}
      </body>
    </html>
  );
}
