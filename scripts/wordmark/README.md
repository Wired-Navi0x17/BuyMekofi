# Wordmark generator

Rebuilds `src/components/marketing/wordmark-data.ts`. Dev-only, not a project dependency.

1. Download `MrDafoe-Regular.ttf` (OFL) from github.com/google/fonts (`ofl/mrdafoe`).
2. `pnpm dlx -p opentype.js@1.3.4 node extract.mjs MrDafoe-Regular.ttf Coffea glyphs.json`
3. `node grid.mjs glyphs.json strokes.json over.svg` and view `over.svg` to adjust the pen
   strokes in `strokes.json` (writing order, width covers the glyph's thickest part).
4. Regenerate the data module from `glyphs.json` + `strokes.json`.
